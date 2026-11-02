import { generateKeyPairSync, privateDecrypt } from 'crypto'
import { NextRequest } from 'next/server'
import { expect, test } from 'vitest'
import type { BrokerConfig } from './config'
import { continueToSlack, finishConnection, startConnection } from './flow'
import {
  PENDING_COOKIE,
  type PendingConnect,
  decodePending,
  encodePending
} from './pending'

// A key pair like the one Unleash makes for each connection.
const keys = generateKeyPairSync('rsa', { modulusLength: 3072 })
const publicKey = keys.publicKey
  .export({ format: 'der', type: 'spki' })
  .toString('base64url')

const config: BrokerConfig = {
  publicUrl: 'https://broker.example',
  clientId: 'client-id',
  clientSecret: 'client-secret',
  scope: 'chat:write,chat:write.public',
  allowLocalhostHttp: false
}

const defaultPending: PendingConnect = {
  returnTo: 'https://unleash.example/acme',
  unleashState: 'unleash-state-1',
  publicKey,
  slackState: 'slack-state-1',
  confirmToken: 'confirm-token-1',
  step: 'confirming'
}

const confirmedPending: PendingConnect = { ...defaultPending, step: 'confirmed' }

const request = (path: string, pending?: PendingConnect) =>
  new NextRequest(
    `${config.publicUrl}${path}`,
    pending && {
      headers: { cookie: `${PENDING_COOKIE}=${encodePending(pending, config)}` }
    }
  )

const pendingSetBy = (response: Response) => {
  const value = response.headers
    .get('set-cookie')
    ?.match(new RegExp(`${PENDING_COOKIE}=([^;]*)`))?.[1]
  return decodePending(value && decodeURIComponent(value), config)
}

const counter = () => {
  let count = 0
  return () => `token-${++count}`
}

const slackAnswering = (answer: object | Error) => {
  const calls: { url: string; init?: RequestInit }[] = []
  const fetch = async (url: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ url: String(url), init })
    if (answer instanceof Error) {
      throw answer
    }
    return new Response(JSON.stringify(answer))
  }
  return { fetch: fetch as typeof globalThis.fetch, calls }
}

const fragmentOf = (response: Response) =>
  new URLSearchParams(new URL(response.headers.get('location')!).hash.slice(1))

const openAsUnleash = (sealed: string) =>
  JSON.parse(
    privateDecrypt(
      { key: keys.privateKey, oaepHash: 'sha256' },
      Buffer.from(sealed, 'base64url')
    ).toString()
  )

test('remembers a request from Unleash in a signed cookie and asks the admin to confirm', () => {
  const params = new URLSearchParams({
    return_to: 'https://unleash.example/acme/',
    public_key: publicKey,
    state: 'unleash-state-1'
  })

  const response = startConnection(request(`/connect?${params}`), {
    config,
    randomToken: counter()
  })

  expect(response.status).toBe(302)
  expect(response.headers.get('location')).toBe('/connect/confirm')
  expect(pendingSetBy(response)).toEqual({
    ...defaultPending,
    slackState: 'token-1',
    confirmToken: 'token-2'
  })
  // Out of reach of scripts, and sent along when Slack redirects back.
  expect(response.headers.get('set-cookie')).toContain('HttpOnly')
  expect(response.headers.get('set-cookie')).toContain('SameSite=lax')
})

const smallKey = () =>
  generateKeyPairSync('rsa', { modulusLength: 2048 })
    .publicKey.export({ format: 'der', type: 'spki' })
    .toString('base64url')

test.each([
  ['an address without https', { return_to: 'http://unleash.example' }, 'The address of your Unleash instance is not valid.'],
  ['a 2048-bit key', { public_key: smallKey() }, 'The request from Unleash has no valid public key.'],
  ['a short state', { state: 'short' }, 'The request from Unleash has no valid state.']
])('refuses a request from Unleash with %s', async (_, override, message) => {
  const params = new URLSearchParams({
    return_to: 'https://unleash.example/acme',
    public_key: publicKey,
    state: 'unleash-state-1',
    ...override
  })

  const response = startConnection(request(`/connect?${params}`), {
    config,
    randomToken: counter()
  })

  expect(response.status).toBe(400)
  expect(await response.text()).toContain(message)
})

test('sends a confirmed connection on to Slack', () => {
  const response = continueToSlack(
    request('/connect/continue?confirm=confirm-token-1', defaultPending),
    { config }
  )

  const location = new URL(response.headers.get('location')!)
  expect(`${location.origin}${location.pathname}`).toBe(
    'https://slack.com/oauth/v2/authorize'
  )
  expect(Object.fromEntries(location.searchParams)).toEqual({
    client_id: 'client-id',
    scope: 'chat:write,chat:write.public',
    redirect_uri: 'https://broker.example/callback',
    state: 'slack-state-1'
  })
  expect(pendingSetBy(response)).toEqual(confirmedPending)
})

test.each([
  ['another token', '/connect/continue?confirm=another-token', defaultPending],
  ['no token', '/connect/continue', defaultPending],
  ['no cookie', '/connect/continue?confirm=confirm-token-1', undefined]
])('refuses a confirmation with %s', (_, path, pending) => {
  const response = continueToSlack(request(path, pending), { config })

  expect(response.status).toBe(400)
})

test('seals the token Slack issued and sends it to Unleash in the fragment, then forgets the connection', async () => {
  const slack = slackAnswering({
    ok: true,
    token_type: 'bot',
    access_token: 'xoxb-the-token',
    team: { id: 'T1', name: 'Acme' }
  })

  const response = await finishConnection(
    request('/callback?code=the-code&state=slack-state-1', confirmedPending),
    { config, fetch: slack.fetch }
  )

  expect(response.headers.get('location')).toMatch(
    /^https:\/\/unleash\.example\/acme\/integrations\/connected\/slack-app#/
  )
  const fragment = fragmentOf(response)
  expect(fragment.get('state')).toBe('unleash-state-1')
  expect(openAsUnleash(fragment.get('sealed')!)).toEqual({
    accessToken: 'xoxb-the-token',
    team: { id: 'T1', name: 'Acme' }
  })
  expect(slack.calls).toMatchObject([
    {
      url: 'https://slack.com/api/oauth.v2.access',
      init: {
        headers: {
          Authorization: `Basic ${Buffer.from('client-id:client-secret').toString('base64')}`
        }
      }
    }
  ])
  expect(
    Object.fromEntries(slack.calls[0].init!.body as URLSearchParams)
  ).toEqual({ code: 'the-code', redirect_uri: 'https://broker.example/callback' })
  expect(response.headers.get('set-cookie')).toMatch(
    new RegExp(`^${PENDING_COOKIE}=;.*Max-Age=0.*Secure`)
  )
})

test.each([
  ['access_denied', '/callback?error=access_denied&state=slack-state-1', { ok: true }],
  ['invalid_code', '/callback?code=the-code&state=slack-state-1', { ok: false, error: 'invalid_code' }],
  ['no_bot_token', '/callback?code=the-code&state=slack-state-1', { ok: true, token_type: 'user', access_token: 'xoxp-a-user-token', team: { id: 'T1', name: 'Acme' } }],
  ['slack_unreachable', '/callback?code=the-code&state=slack-state-1', new TypeError('fetch failed')],
  ['sealing_failed', '/callback?code=the-code&state=slack-state-1', { ok: true, token_type: 'bot', access_token: `xoxb-${'1'.repeat(400)}`, team: { id: 'T1', name: 'Acme' } }]
])('tells Unleash why the connection failed: %s', async (error, path, answer) => {
  const response = await finishConnection(request(path, confirmedPending), {
    config,
    fetch: slackAnswering(answer).fetch
  })

  expect(Object.fromEntries(fragmentOf(response))).toEqual({
    state: 'unleash-state-1',
    error
  })
})

test.each([
  ['before the admin confirmed', '/callback?code=the-code&state=slack-state-1', defaultPending],
  ['with another state', '/callback?code=the-code&state=another-state', confirmedPending],
  ['without the cookie', '/callback?code=the-code&state=slack-state-1', undefined]
])('refuses a return from Slack %s', async (_, path, pending) => {
  const slack = slackAnswering({ ok: true })

  const response = await finishConnection(request(path, pending), {
    config,
    fetch: slack.fetch
  })

  expect(response.status).toBe(400)
  expect(slack.calls).toEqual([])
})
