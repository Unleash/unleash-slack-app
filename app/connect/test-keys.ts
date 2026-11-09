import { generateKeyPairSync } from 'crypto'

// A key pair like the one Unleash makes for each connection, with the public
// key as Unleash sends it: SPKI DER, base64url.
export const unleashKeyPair = (modulusLength = 3072) => {
  const keys = generateKeyPairSync('rsa', { modulusLength })
  return {
    publicKey: keys.publicKey
      .export({ format: 'der', type: 'spki' })
      .toString('base64url')
  }
}
