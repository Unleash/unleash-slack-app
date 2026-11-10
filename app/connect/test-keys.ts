import { generateKeyPairSync, privateDecrypt } from 'crypto'

// A key pair like the one Unleash makes for each connection, with the public
// key as Unleash sends it (SPKI DER, base64url), and opening what is sealed to
// it the way Unleash does (SlackAppInstallService.openSealed in Unleash/unleash).
export const unleashKeyPair = (modulusLength = 3072) => {
  const keys = generateKeyPairSync('rsa', { modulusLength })
  return {
    publicKey: keys.publicKey
      .export({ format: 'der', type: 'spki' })
      .toString('base64url'),
    open: (sealed: string) =>
      JSON.parse(
        privateDecrypt(
          { key: keys.privateKey, oaepHash: 'sha256' },
          Buffer.from(sealed, 'base64url')
        ).toString()
      )
  }
}
