import { expect, test } from 'vitest'
import { readConfig } from './config'

test('names the setting that is missing', () => {
  const env = {
    NODE_ENV: 'production' as const,
    PUBLIC_URL: 'https://broker.example',
    NEXT_PUBLIC_CLIENT_ID: 'client-id',
    NEXT_PUBLIC_SCOPE: 'chat:write'
  }

  expect(() => readConfig(env)).toThrow('CLIENT_SECRET is not set')
})
