import { generateKeyPairSync } from 'crypto'
import { NextRequest } from 'next/server'
import { expect, test } from 'vitest'
import type { BrokerConfig } from './config'
import { startConnection } from './flow'
import {
  PENDING_COOKIE,
  type PendingConnect,
  decodePending
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

const request = (path: string) => new NextRequest(`${config.publicUrl}${path}`)

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
