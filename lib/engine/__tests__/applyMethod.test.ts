import { describe, it, expect } from 'vitest'
import { applyMethodBucket, APPLY_BUCKET_META, type ApplyBucket } from '../applyMethod'

describe('applyMethodBucket — classify how an application was submitted', () => {
  it('cron auto-submit with no human → autonomous', () => {
    expect(applyMethodBucket('auto')).toBe('autonomous')
  })

  it('engine submitted after a human OK → approved', () => {
    expect(applyMethodBucket('one-click')).toBe('approved')
    expect(applyMethodBucket('auto-approved')).toBe('approved')
    expect(applyMethodBucket('auto-answered')).toBe('approved')
  })

  it('Matthew filled the form himself → self', () => {
    expect(applyMethodBucket('manual')).toBe('self')
  })

  it('missing/unknown method → unknown (never crash, never mislabel)', () => {
    expect(applyMethodBucket(null)).toBe('unknown')
    expect(applyMethodBucket(undefined)).toBe('unknown')
    expect(applyMethodBucket('something-new')).toBe('unknown')
  })
})

describe('APPLY_BUCKET_META — display labels for every bucket', () => {
  it('has a distinct label for each bucket', () => {
    const buckets: ApplyBucket[] = ['autonomous', 'approved', 'self', 'unknown']
    const labels = buckets.map((b) => APPLY_BUCKET_META[b].label)
    expect(new Set(labels).size).toBe(buckets.length) // all distinct
    expect(APPLY_BUCKET_META.autonomous.label.toLowerCase()).toMatch(/auto/)
  })
})
