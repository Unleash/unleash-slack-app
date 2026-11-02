import { generateKeyPairSync } from 'crypto'
import { expect, test } from 'vitest'
import { isSealingKey } from './seal'

// A key pair like the one Unleash makes for each connection.
const keys = generateKeyPairSync('rsa', { modulusLength: 3072 })
const publicKey = keys.publicKey
  .export({ format: 'der', type: 'spki' })
  .toString('base64url')

test('accepts only 3072-bit RSA keys as sealing keys', () => {
  const smallKey = generateKeyPairSync('rsa', { modulusLength: 2048 })
    .publicKey.export({ format: 'der', type: 'spki' })
    .toString('base64url')

  expect(isSealingKey(publicKey)).toBe(true)
  expect(isSealingKey(smallKey)).toBe(false)
  expect(isSealingKey('not-a-key')).toBe(false)
})
