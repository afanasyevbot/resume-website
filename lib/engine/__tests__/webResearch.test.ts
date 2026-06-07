import { describe, it, expect } from 'vitest'
import { isAggregatorHost, queriesForToday, detectAtsFromUrl } from '../webResearch'

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
    const qs = queriesForToday(6)
    expect(qs).toHaveLength(6)
    expect(qs.every((q) => q.length > 0)).toBe(true)
  })
})

describe('detectAtsFromUrl', () => {
  it('detects a Greenhouse board slug from boards.greenhouse.io', () => {
    expect(detectAtsFromUrl('https://boards.greenhouse.io/ramp/jobs/123')).toEqual({
      ats: 'greenhouse',
      slug: 'ramp',
    })
  })

  it('detects a Greenhouse slug from job-boards.greenhouse.io', () => {
    expect(detectAtsFromUrl('https://job-boards.greenhouse.io/notion/jobs/9')).toEqual({
      ats: 'greenhouse',
      slug: 'notion',
    })
  })

  it('detects an Ashby slug from jobs.ashbyhq.com', () => {
    expect(detectAtsFromUrl('https://jobs.ashbyhq.com/openai/abc-def')).toEqual({
      ats: 'ashby',
      slug: 'openai',
    })
  })

  it('returns null for a non-ATS company career page', () => {
    expect(detectAtsFromUrl('https://www.cursor.com/careers/ae')).toBeNull()
  })

  it('returns null for an aggregator or unparseable URL', () => {
    expect(detectAtsFromUrl('https://www.linkedin.com/jobs/view/1')).toBeNull()
    expect(detectAtsFromUrl('garbage')).toBeNull()
  })

  it('does not mistake the bare board host for a slug', () => {
    // No slug segment after the host → nothing to register.
    expect(detectAtsFromUrl('https://boards.greenhouse.io/')).toBeNull()
  })
})
