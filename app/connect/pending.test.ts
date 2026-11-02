import { expect, test } from 'vitest'
import {
  type PendingConnect,
  decodePending,
  encodePending,
  parseReturnTo
} from './pending'

const config = { clientSecret: 'client-secret', allowLocalhostHttp: false }

const defaultPending: PendingConnect = {
  returnTo: 'https://unleash.example/acme',
  unleashState: 'unleash-state-1',
  publicKey: 'public-key',
  slackState: 'slack-state-1',
  confirmToken: 'confirm-token-1',
  step: 'confirming'
}

test.each([
  ['https://unleash.example', 'https://unleash.example'],
  ['https://unleash.example/acme/', 'https://unleash.example/acme'],
  ['https://unleash.example:8443/acme', 'https://unleash.example:8443/acme'],
  ['http://unleash.example', undefined],
  ['http://localhost:4242', undefined],
  ['https://user:password@unleash.example', undefined],
  ['https://unleash.example/?next=elsewhere', undefined],
  ['https://unleash.example/#fragment', undefined],
  ['javascript:alert(1)', undefined],
  ['not a url', undefined],
  [null, undefined]
])('reads the return address %s as %s', (raw, expected) => {
  expect(parseReturnTo(raw, config)).toBe(expected)
})

test('accepts an Unleash on http://localhost only in development', () => {
  expect(
    parseReturnTo('http://localhost:4242', { allowLocalhostHttp: true })
  ).toBe('http://localhost:4242')
})

test('reads back the pending connection it signed', () => {
  expect(decodePending(encodePending(defaultPending, config), config)).toEqual(
    defaultPending
  )
})

test('refuses a cookie that was changed, signed elsewhere or is not a pending connection', () => {
  const [, signature] = encodePending(defaultPending, config).split('.')
  const changed = `${Buffer.from(
    JSON.stringify({ ...defaultPending, returnTo: 'https://evil.example' })
  ).toString('base64url')}.${signature}`
  const signedElsewhere = encodePending(defaultPending, {
    clientSecret: 'another-secret'
  })
  const notPending = encodePending(
    { ...defaultPending, returnTo: 'http://evil.example' },
    config
  )

  for (const cookie of [changed, signedElsewhere, notPending, 'garbage', undefined]) {
    expect(decodePending(cookie, config)).toBeUndefined()
  }
})
