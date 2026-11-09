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

// Unleash only shows the workspace name, in the integration's description
// ("Slack workspace Acme"), so it is shortened to make room for the token.
const fitToSeal = (connection: SlackConnection): Buffer => {
  const name = Array.from(connection.team.name)
  for (let length = name.length; length >= 0; length--) {
    const payload = Buffer.from(
      JSON.stringify({
        ...connection,
        team: { ...connection.team, name: name.slice(0, length).join('') }
      })
    )
    if (payload.length <= MAX_SEALED_BYTES) {
      return payload
    }
  }
  throw new Error(`The token alone takes more than ${MAX_SEALED_BYTES} bytes`)
}

export const sealForInstance = (
  publicKey: string,
  connection: SlackConnection
): string =>
  publicEncrypt(
    {
      key: rsaPublicKey(publicKey),
      padding: constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256'
    },
    fitToSeal(connection)
  ).toString('base64url')
