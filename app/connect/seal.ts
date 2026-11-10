import { createPublicKey } from 'crypto'

const SEALING_KEY_BITS = 3072

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
