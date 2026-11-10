import { constants, createPublicKey, publicEncrypt } from 'crypto'
import type { SlackConnection } from './slack'

const SEALING_KEY_BITS = 3072

// RSA-OAEP with SHA-256 seals at most 384 - 2 * 32 - 2 bytes under a
// 3072-bit key, and Unleash opens a single block.
export const MAX_SEALED_BYTES = 318

const rsaPublicKey = (publicKey: string) =>
  createPublicKey({
    key: Buffer.from(publicKey, 'base64url'),
    format: 'der',
    type: 'spki'
  })

export const isSealingKey = (value: string): boolean => {
  try {
    const key = rsaPublicKey(value)
    return (
      key.asymmetricKeyType === 'rsa' &&
      key.asymmetricKeyDetails?.modulusLength === SEALING_KEY_BITS
    )
  } catch {
    return false
  }
}

export const sealForInstance = (
  publicKey: string,
  connection: SlackConnection
): string => {
  const payload = Buffer.from(JSON.stringify(connection))
  if (payload.length > MAX_SEALED_BYTES) {
    throw new Error(`The connection takes more than ${MAX_SEALED_BYTES} bytes`)
  }
  return publicEncrypt(
    {
      key: rsaPublicKey(publicKey),
      padding: constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256'
    },
    payload
  ).toString('base64url')
}
