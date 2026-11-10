import type { BrokerConfig, BrokerDeps } from './config'
import type { PendingConnect } from './pending'

const SLACK_URL = 'https://slack.com'

export interface SlackConnection {
  accessToken: string
  team: { id: string; name: string }
}

interface OAuthV2AccessResponse {
  ok: boolean
  error?: string
  token_type?: string
  access_token?: string
  team?: { id?: string; name?: string }
}

export class SlackExchangeError extends Error {
  constructor(readonly slackError: string, options?: { cause: unknown }) {
    super(`oauth.v2.access failed with ${slackError}`, options)
  }
}

const redirectUri = ({ publicUrl }: Pick<BrokerConfig, 'publicUrl'>) =>
  `${publicUrl}/callback`

export const slackAuthorizeUrl = (
  { slackState }: Pick<PendingConnect, 'slackState'>,
  config: BrokerConfig
): string => {
  const url = new URL(`${SLACK_URL}/oauth/v2/authorize`)
  url.searchParams.set('client_id', config.clientId)
  url.searchParams.set('scope', config.scope)
  url.searchParams.set('redirect_uri', redirectUri(config))
  url.searchParams.set('state', slackState)
  return url.toString()
}

export const exchangeCode = async (
  code: string,
  { config, fetch }: Pick<BrokerDeps, 'config' | 'fetch'>
): Promise<SlackConnection> => {
  let result: OAuthV2AccessResponse
  try {
    const res = await fetch(`${SLACK_URL}/api/oauth.v2.access`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${config.clientId}:${config.clientSecret}`
        ).toString('base64')}`
      },
      body: new URLSearchParams({ code, redirect_uri: redirectUri(config) }),
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000)
    })
    result = await res.json()
  } catch (error) {
    throw new SlackExchangeError('slack_unreachable', { cause: error })
  }

  if (!result.ok) {
    throw new SlackExchangeError(result.error ?? 'unknown_error')
  }
  if (result.token_type !== 'bot' || !result.access_token || !result.team?.id) {
    throw new SlackExchangeError('no_bot_token')
  }
  return {
    accessToken: result.access_token,
    team: { id: result.team.id, name: result.team.name ?? result.team.id }
  }
}
