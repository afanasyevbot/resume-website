/**
 * @vitest-environment node
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { createSessionToken, verifySessionToken, SESSION_COOKIE } from '../auth'

beforeEach(() => {
  process.env.ENGINE_SESSION_SECRET = 'test-secret-at-least-32-chars-long-xx'
})

describe('session tokens', () => {
  it('exposes a cookie name', () => {
    expect(SESSION_COOKIE).toBe('engine_session')
  })

  it('creates a token that verifies as valid', async () => {
    const token = await createSessionToken()
    expect(await verifySessionToken(token)).toBe(true)
  })

  it('rejects a tampered token', async () => {
    const token = await createSessionToken()
    expect(await verifySessionToken(token + 'x')).toBe(false)
  })

  it('rejects a token signed with a different secret', async () => {
    const token = await createSessionToken()
    process.env.ENGINE_SESSION_SECRET = 'a-completely-different-secret-value-yy'
    expect(await verifySessionToken(token)).toBe(false)
  })

  it('rejects garbage', async () => {
    expect(await verifySessionToken('not-a-jwt')).toBe(false)
  })
})
