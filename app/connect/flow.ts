import { NextResponse, type NextRequest } from 'next/server'
import type { BrokerDeps } from './config'
import { errorPage } from './error-page'
import {
  PENDING_COOKIE,
  type PendingConnect,
  cookieOptions,
  encodePending,
  isUnleashState,
  parseReturnTo
} from './pending'
import { isSealingKey } from './seal'

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
