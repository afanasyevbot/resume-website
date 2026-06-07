import { describe, it, expect } from 'vitest'
import { isAggregatorHost, queriesForToday } from '../webResearch'

describe('isAggregatorHost', () => {
  it('flags job-board aggregators that return mis-attributed listings', () => {
    expect(isAggregatorHost('https://www.mediabistro.com/jobs/123')).toBe(true)
    expect(isAggregatorHost('https://www.themuse.com/jobs/atlassian-ae')).toBe(true)
    expect(isAggregatorHost('https://www.linkedin.com/jobs/view/456')).toBe(true)
    expect(isAggregatorHost('https://builtin.com/job/789')).toBe(true)
  })

  it('does NOT flag direct ATS application pages', () => {
    // These host real company jobs — they must still be scored.
    expect(isAggregatorHost('https://boards.greenhouse.io/openai/jobs/1')).toBe(false)
    expect(isAggregatorHost('https://jobs.lever.co/writer/abc')).toBe(false)
    expect(isAggregatorHost('https://jobs.ashbyhq.com/ramp/xyz')).toBe(false)
  })

  it('does NOT flag a company career page', () => {
    expect(isAggregatorHost('https://openai.com/careers/mid-market-ae')).toBe(false)
    expect(isAggregatorHost('https://www.cursor.com/careers')).toBe(false)
  })

  it('returns false for an unparseable URL', () => {
    expect(isAggregatorHost('not a url')).toBe(false)
  })
})

describe('queriesForToday', () => {
  it('returns the requested number of non-empty queries', () => {
    const qs = queriesForToday(3)
    expect(qs).toHaveLength(3)
    expect(qs.every((q) => q.length > 0)).toBe(true)
  })
})
