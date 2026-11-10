import type { BrokerConfig } from './config'
import type { PendingConnect } from './pending'

const redirectUri = ({ publicUrl }: Pick<BrokerConfig, 'publicUrl'>) =>
  `${publicUrl}/callback`

export const slackAuthorizeUrl = (
  { slackState }: Pick<PendingConnect, 'slackState'>,
  config: BrokerConfig
): string => {
  const url = new URL('https://slack.com/oauth/v2/authorize')
  url.searchParams.set('client_id', config.clientId)
  url.searchParams.set('scope', config.scope)
  url.searchParams.set('redirect_uri', redirectUri(config))
  url.searchParams.set('state', slackState)
  return url.toString()
}
