import { randomBytes } from 'crypto'

export interface BrokerConfig {
  publicUrl: string
  clientId: string
  clientSecret: string
  scope: string
  allowLocalhostHttp: boolean
}

export interface BrokerDeps {
  config: BrokerConfig
  randomToken: () => string
}

export const readConfig = (env: NodeJS.ProcessEnv): BrokerConfig => {
  const required = (name: string): string => {
    const value = env[name]
    if (!value) {
      throw new Error(`${name} is not set`)
    }
    return value
  }
  return {
    publicUrl: required('PUBLIC_URL').replace(/\/+$/, ''),
    clientId: required('NEXT_PUBLIC_CLIENT_ID'),
    clientSecret: required('CLIENT_SECRET'),
    scope: required('NEXT_PUBLIC_SCOPE'),
    allowLocalhostHttp: env.NODE_ENV === 'development'
  }
}

// Read per request, not at import: builds for previews have no CLIENT_SECRET.
export const brokerDeps = (): BrokerDeps => ({
  config: readConfig(process.env),
  randomToken: () => randomBytes(24).toString('base64url')
})
