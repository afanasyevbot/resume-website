/**
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest'
import { timeAgo } from '../dashboard'

describe('timeAgo', () => {
  const now = new Date('2026-06-04T12:00:00Z')

  it('returns "just now" under a minute', () => {
    expect(timeAgo(new Date('2026-06-04T11:59:30Z'), now)).toBe('just now')
  })

  it('returns minutes under an hour', () => {
    expect(timeAgo(new Date('2026-06-04T11:45:00Z'), now)).toBe('15m')
  })

  it('returns hours under a day', () => {
    expect(timeAgo(new Date('2026-06-04T09:00:00Z'), now)).toBe('3h')
  })

  it('returns days under a week', () => {
    expect(timeAgo(new Date('2026-06-02T12:00:00Z'), now)).toBe('2d')
  })

  it('returns a short date beyond a week', () => {
    expect(timeAgo(new Date('2026-05-20T12:00:00Z'), now)).toMatch(/May/)
  })

  it('accepts an ISO string as input', () => {
    expect(timeAgo('2026-06-04T11:59:30Z', now)).toBe('just now')
  })

  it('returns "just now" for exact same time', () => {
    expect(timeAgo(now, now)).toBe('just now')
  })

  it('handles 59 seconds as "just now"', () => {
    expect(timeAgo(new Date('2026-06-04T11:59:01Z'), now)).toBe('just now')
  })

  it('handles 60 seconds as "1m"', () => {
    expect(timeAgo(new Date('2026-06-04T11:59:00Z'), now)).toBe('1m')
  })

  it('handles 23h59m as hours', () => {
    expect(timeAgo(new Date('2026-06-03T12:01:00Z'), now)).toBe('23h')
  })

  it('handles exactly 6d as days', () => {
    expect(timeAgo(new Date('2026-05-29T12:00:00Z'), now)).toBe('6d')
  })
})
