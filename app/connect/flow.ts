import { NextResponse, type NextRequest } from 'next/server'
import type { BrokerDeps } from './config'
import { START_AGAIN, errorPage } from './error-page'
import {
  PENDING_COOKIE,
  type PendingConnect,
  clearedCookieOptions,
  cookieOptions,
  decodePending,
  encodePending,
  isUnleashState,
  parseReturnTo
} from './pending'
import { isSealingKey, sealForInstance } from './seal'
import {
  SlackExchangeError,
  type SlackConnection,
  exchangeCode,
  slackAuthorizeUrl
} from './slack'

export const UNLEASH_CONNECTED_PATH = '/integrations/connected/slack-app'

// Started by an Unleash instance's Install & connect:
// GET /connect?return_to&public_key&state
export const startConnection = (
  request: NextRequest,
  { config, randomToken }: Pick<BrokerDeps, 'config' | 'randomToken'>
): Response => {
  const params = request.nextUrl.searchParams
  const returnTo = parseReturnTo(params.get('return_to'), config)
  const publicKey = params.get('public_key') ?? ''
  const unleashState = params.get('state') ?? ''

  if (!returnTo) {
    return errorPage('The address of your Unleash instance is not valid.')
  }
  if (!isSealingKey(publicKey)) {
    return errorPage('The request from Unleash has no valid public key.')
  }
  if (!isUnleashState(unleashState)) {
    return errorPage('The request from Unleash has no valid state.')
  }

  const pending: PendingConnect = {
    returnTo,
    unleashState,
    publicKey,
    slackState: randomToken(),
    confirmToken: randomToken(),
    step: 'confirming'
  }
  // Relative, so the browser stays on the host that holds the cookie.
  const response = new NextResponse(null, {
    status: 302,
    headers: { Location: '/connect/confirm' }
  })
  response.cookies.set(PENDING_COOKIE, encodePending(pending, config), cookieOptions)
  return response
}

// The admin confirmed the destination on /connect/confirm.
export const continueToSlack = (
  request: NextRequest,
  { config }: Pick<BrokerDeps, 'config'>
): Response => {
  const pending = decodePending(request.cookies.get(PENDING_COOKIE)?.value, config)
  const confirmToken = request.nextUrl.searchParams.get('confirm')
  if (!pending || confirmToken !== pending.confirmToken) {
    return errorPage(`This connection has expired. ${START_AGAIN}`)
  }
  const response = NextResponse.redirect(slackAuthorizeUrl(pending, config), 302)
  response.cookies.set(
    PENDING_COOKIE,
    encodePending({ ...pending, step: 'confirmed' }, config),
    cookieOptions
  )
  return response
}

const sealedConnection = async (
  code: string,
  pending: PendingConnect,
  deps: Pick<BrokerDeps, 'config' | 'fetch'>
): Promise<{ sealed_connection: string } | { error: string }> => {
  let connection: SlackConnection
  try {
    connection = await exchangeCode(code, deps)
  } catch (error) {
    if (!(error instanceof SlackExchangeError)) {
      throw error
    }
    const cause = error.cause instanceof Error ? ` (${error.cause.name})` : ''
    console.error(`Could not connect to Slack: ${error.slackError}${cause}`)
    return { error: error.slackError }
  }
  try {
    return {
      sealed_connection: sealForInstance(pending.publicKey, connection)
    }
  } catch (error) {
    // Never the token: only that sealing failed, and the error's name.
    console.error(`Could not seal the token: ${(error as Error).name}`)
    return { error: 'sealing_failed' }
  }
}

// Slack's redirect URL for Install & connect. Exchanges the code with the
// client secret, seals the token to the instance's public key and sends the
// admin back to Unleash with it in the fragment.
export const finishConnection = async (
  request: NextRequest,
  deps: Pick<BrokerDeps, 'config' | 'fetch'>
): Promise<Response> => {
  const params = request.nextUrl.searchParams
  const pending = decodePending(
    request.cookies.get(PENDING_COOKIE)?.value,
    deps.config
  )
  if (pending?.step !== 'confirmed' || params.get('state') !== pending.slackState) {
    return errorPage(
      `This connection has expired or was started in another browser. ${START_AGAIN}`
    )
  }

  const code = params.get('code')
  const outcome = code
    ? await sealedConnection(code, pending, deps)
    : { error: params.get('error') ?? 'no_code' }
  const fragment = new URLSearchParams({
    state: pending.unleashState,
    ...outcome
  })

  const response = NextResponse.redirect(
    `${pending.returnTo}${UNLEASH_CONNECTED_PATH}#${fragment}`,
    302
  )
  response.cookies.set(PENDING_COOKIE, '', clearedCookieOptions)
  return response
}
