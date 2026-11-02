import { createHmac, timingSafeEqual } from 'crypto'
import type { BrokerConfig } from './config'

// A connection started from an Unleash instance. It lives in a signed,
// httpOnly cookie, so this site stores nothing.
export interface PendingConnect {
  returnTo: string
  unleashState: string
  publicKey: string
  slackState: string
  confirmToken: string
  step: 'confirming' | 'confirmed'
}

export const PENDING_COOKIE = '__Host-slack_connect'

export const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: 'lax' as const,
  path: '/',
  // As long as Unleash keeps the connection, so the admin can stop at the
  // confirmation page and ask someone before going on.
  maxAge: 60 * 60
}

const LOCALHOSTS = ['localhost', '127.0.0.1', '[::1]']

export const parseReturnTo = (
  raw: string | null,
  { allowLocalhostHttp }: Pick<BrokerConfig, 'allowLocalhostHttp'>
): string | undefined => {
  if (!raw) return undefined
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return undefined
  }
  const localHttp =
    allowLocalhostHttp &&
    url.protocol === 'http:' &&
    LOCALHOSTS.includes(url.hostname)
  if (url.protocol !== 'https:' && !localHttp) return undefined
  if (url.username || url.password || url.search || url.hash) return undefined
  return `${url.origin}${url.pathname.replace(/\/+$/, '')}`
}

export const isUnleashState = (value: string): boolean =>
  /^[A-Za-z0-9_.-]{8,200}$/.test(value)

const sign = (payload: string, clientSecret: string): string => {
  const key = createHmac('sha256', clientSecret)
    .update('slack_connect cookie')
    .digest()
  return createHmac('sha256', key).update(payload).digest('base64url')
}

export const encodePending = (
  pending: PendingConnect,
  { clientSecret }: Pick<BrokerConfig, 'clientSecret'>
): string => {
  const payload = Buffer.from(JSON.stringify(pending)).toString('base64url')
  return `${payload}.${sign(payload, clientSecret)}`
}

const isPendingConnect = (
  value: any,
  config: Pick<BrokerConfig, 'allowLocalhostHttp'>
): value is PendingConnect =>
  typeof value === 'object' &&
  value !== null &&
  typeof value.returnTo === 'string' &&
  parseReturnTo(value.returnTo, config) === value.returnTo &&
  typeof value.unleashState === 'string' &&
  typeof value.publicKey === 'string' &&
  typeof value.slackState === 'string' &&
  typeof value.confirmToken === 'string' &&
  (value.step === 'confirming' || value.step === 'confirmed')

export const decodePending = (
  raw: string | undefined,
  config: Pick<BrokerConfig, 'clientSecret' | 'allowLocalhostHttp'>
): PendingConnect | undefined => {
  const [payload, signature, ...rest] = raw?.split('.') ?? []
  if (!payload || !signature || rest.length > 0) return undefined
  const expected = Buffer.from(sign(payload, config.clientSecret))
  const actual = Buffer.from(signature)
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return undefined
  }
  let value: unknown
  try {
    value = JSON.parse(Buffer.from(payload, 'base64url').toString())
  } catch {
    return undefined
  }
  return isPendingConnect(value, config) ? value : undefined
}
