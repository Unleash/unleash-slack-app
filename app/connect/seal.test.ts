import { expect, test } from 'vitest'
import { isSealingKey } from './seal'
import { unleashKeyPair } from './test-keys'

const { publicKey } = unleashKeyPair()

test('accepts only 3072-bit RSA keys as sealing keys', () => {
  const smallKey = unleashKeyPair(2048).publicKey

  expect(isSealingKey(publicKey)).toBe(true)
  expect(isSealingKey(smallKey)).toBe(false)
  expect(isSealingKey('not-a-key')).toBe(false)
})
