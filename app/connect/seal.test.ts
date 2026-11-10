import { expect, test } from 'vitest'
import { isSealingKey, sealForInstance } from './seal'
import { unleashKeyPair } from './test-keys'

const { publicKey, open: openAsUnleash } = unleashKeyPair()

test('seals what Unleash opens', () => {
  const connection = {
    accessToken: 'xoxb-test-token-0123456789',
    team: { id: 'T1', name: 'Acme' }
  }

  const sealed = sealForInstance(publicKey, connection)

  expect(openAsUnleash(sealed)).toEqual(connection)
})

test('refuses a workspace name too long to seal', () => {
  const connection = {
    accessToken: `xoxb-${'1'.repeat(70)}`,
    team: { id: 'T0123456789', name: 'Acme '.repeat(100) }
  }

  expect(() => sealForInstance(publicKey, connection)).toThrow(
    'The connection takes more than 318 bytes'
  )
})

test('accepts only 3072-bit RSA keys as sealing keys', () => {
  const smallKey = unleashKeyPair(2048).publicKey

  expect(isSealingKey(publicKey)).toBe(true)
  expect(isSealingKey(smallKey)).toBe(false)
  expect(isSealingKey('not-a-key')).toBe(false)
})
