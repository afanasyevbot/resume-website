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

  it('names companies that failed to fetch (so dead slugs do not hide in the count)', () => {
    const report = {
      ...baseReport,
      totalErrors: 2,
      perCompany: [
        { company: 'OpenAI', ats: 'greenhouse', listed: 0, new: 0, relevant: 0, scored: 0, tailored: 0, errors: ['fetch failed: greenhouse list openai: 404'] },
        { company: 'Anthropic', ats: 'greenhouse', listed: 30, new: 5, relevant: 3, scored: 3, tailored: 1, errors: [] },
        { company: 'Groq', ats: 'greenhouse', listed: 0, new: 0, relevant: 0, scored: 0, tailored: 0, errors: ['fetch failed: greenhouse list groq: 404'] },
        // A per-listing error (empty JD) is NOT a fetch failure — must not be listed.
        { company: 'Vercel', ats: 'greenhouse', listed: 4, new: 2, relevant: 1, scored: 0, tailored: 0, errors: ['Senior AE: empty JD'] },
      ],
    }
    const detail = formatSourceRunDetail(report)
    expect(detail.failedCompanies).toEqual(['OpenAI', 'Groq'])
  })

  it('reports an empty failedCompanies array when every company fetched cleanly', () => {
    const detail = formatSourceRunDetail(baseReport)
    expect(detail.failedCompanies).toEqual([])
  })
})
