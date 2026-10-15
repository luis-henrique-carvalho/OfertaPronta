import { describe, it, expect } from 'vitest'
import { parseServerEnv, serverEnvSchema } from './server-env'

describe('serverEnv', () => {
  it('should parse valid environment variables with defaults', () => {
    const env = parseServerEnv({})

    expect(env.DATABASE_URL).toBe('postgresql://postgres:postgres@localhost:5432/ofertapronta')
    expect(env.NODE_ENV).toBe('development')
    expect(env.PORT).toBe(3000)
  })

  it('should override defaults with custom values', () => {
    const custom = {
      DATABASE_URL: 'postgresql://app_user:secret@db.production:5432/oferta_prod',
      NODE_ENV: 'production',
      PORT: '8080',
    }

    const env = parseServerEnv(custom)

    expect(env.DATABASE_URL).toBe('postgresql://app_user:secret@db.production:5432/oferta_prod')
    expect(env.NODE_ENV).toBe('production')
    expect(env.PORT).toBe(8080)
  })

  it('should reject invalid NODE_ENV', () => {
    const invalid = {
      NODE_ENV: 'staging',
    }

    expect(() => parseServerEnv(invalid)).toThrow()
  })

  it('should reject invalid PORT', () => {
    const invalid = {
      PORT: 'not-a-number',
    }

    expect(() => parseServerEnv(invalid)).toThrow()
  })

  it('should export schema for runtime validation', () => {
    expect(serverEnvSchema).toBeDefined()
  })
})
