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

test('shortens a workspace name that would not fit', () => {
  const connection = {
    accessToken: `xoxb-${'1'.repeat(70)}`,
    team: { id: 'T0123456789', name: 'Acme '.repeat(100) }
  }

  const opened = openAsUnleash(sealForInstance(publicKey, connection))

  expect(opened.accessToken).toBe(connection.accessToken)
  expect(connection.team.name.startsWith(opened.team.name)).toBe(true)
  expect(opened.team.name.length).toBeGreaterThan(0)
})

test('accepts only 3072-bit RSA keys as sealing keys', () => {
  const smallKey = unleashKeyPair(2048).publicKey

  expect(isSealingKey(publicKey)).toBe(true)
  expect(isSealingKey(smallKey)).toBe(false)
  expect(isSealingKey('not-a-key')).toBe(false)
})
