import { describe, it, expect } from 'vitest'
import { formatSourceRunDetail } from '../sourcing'

describe('formatSourceRunDetail — what gets stored in the source_run event', () => {
  const baseReport = {
    perCompany: [],
    totalScored: 15,
    totalTailored: 1,
    totalSkippedDuplicate: 3,
    totalSkippedIrrelevant: 22,
    totalErrors: 0,
    capHit: false,
    deadlineHit: false,
    durationMs: 48_000,
  }

  it('preserves the key funnel counters', () => {
    const detail = formatSourceRunDetail(baseReport)
    expect(detail.scored).toBe(15)
    expect(detail.tailored).toBe(1)
    expect(detail.errors).toBe(0)
  })

  it('records deadlineHit accurately', () => {
    expect(formatSourceRunDetail({ ...baseReport, deadlineHit: true }).deadlineHit).toBe(true)
    expect(formatSourceRunDetail({ ...baseReport, deadlineHit: false }).deadlineHit).toBe(false)
  })

  it('records capHit accurately', () => {
    expect(formatSourceRunDetail({ ...baseReport, capHit: true }).capHit).toBe(true)
  })

  it('rounds durationMs to nearest second', () => {
    const detail = formatSourceRunDetail({ ...baseReport, durationMs: 48_432 })
    expect(detail.durationS).toBe(48)
  })

  it('computes a human-readable summary string', () => {
    const detail = formatSourceRunDetail({ ...baseReport, deadlineHit: true })
    expect(detail.summary).toMatch(/15/)
    expect(detail.summary).toMatch(/deadline/i)
  })
})
