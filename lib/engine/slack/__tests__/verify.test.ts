import { describe, it, expect } from 'vitest'
import crypto from 'crypto'
import { verifySlackSignature } from '../verify'

const SECRET = 'test_signing_secret'

function sign(rawBody: string, timestamp: string, secret = SECRET): string {
  const hmac = crypto.createHmac('sha256', secret).update(`v0:${timestamp}:${rawBody}`).digest('hex')
  return `v0=${hmac}`
}

describe('verifySlackSignature', () => {
  const now = 1_700_000_000
  const ts = String(now)
  const body = 'token=abc&payload=%7B%7D'

  it('accepts a correctly signed, fresh request', () => {
    expect(verifySlackSignature({ signingSecret: SECRET, rawBody: body, timestamp: ts, signature: sign(body, ts), now })).toBe(true)
  })

  it('rejects a tampered body', () => {
    expect(verifySlackSignature({ signingSecret: SECRET, rawBody: body + 'x', timestamp: ts, signature: sign(body, ts), now })).toBe(false)
  })

  it('rejects a wrong signing secret', () => {
    expect(verifySlackSignature({ signingSecret: 'wrong', rawBody: body, timestamp: ts, signature: sign(body, ts), now })).toBe(false)
  })

  it('rejects a stale timestamp (replay)', () => {
    const oldTs = String(now - 60 * 10) // 10 min old
    expect(verifySlackSignature({ signingSecret: SECRET, rawBody: body, timestamp: oldTs, signature: sign(body, oldTs), now })).toBe(false)
  })

  it('rejects a missing signature or timestamp', () => {
    expect(verifySlackSignature({ signingSecret: SECRET, rawBody: body, timestamp: null, signature: sign(body, ts), now })).toBe(false)
    expect(verifySlackSignature({ signingSecret: SECRET, rawBody: body, timestamp: ts, signature: null, now })).toBe(false)
  })

  it('rejects when no signing secret is configured', () => {
    expect(verifySlackSignature({ signingSecret: '', rawBody: body, timestamp: ts, signature: sign(body, ts), now })).toBe(false)
  })
})
