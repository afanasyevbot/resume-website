import { describe, it, expect } from 'vitest'
import {
  isAggregatorHost,
  queriesForToday,
  buildLookalikePrompt,
  type FitSignal,
} from '../webResearch'

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

describe('buildLookalikePrompt', () => {
  const signals: FitSignal[] = [
    { company: 'OpenAI', title: 'Mid-Market AE', segment: 'mid-market', aiNative: true, fitReasons: ['AI-native', 'mid-market'] },
    { company: 'Writer', title: 'Strategic AE', segment: 'mid-market', aiNative: true, fitReasons: ['generative AI'] },
    { company: 'Ramp', title: 'Account Executive', segment: 'mid-market', aiNative: false, fitReasons: ['fintech SaaS'] },
  ]

  it('lists every good-fit company and asks for the requested count', () => {
    const prompt = buildLookalikePrompt(signals, 3)
    expect(prompt).toContain('OpenAI')
    expect(prompt).toContain('Writer')
    expect(prompt).toContain('Ramp')
    expect(prompt).toContain('3 search queries')
  })

  it('surfaces derived traits so Claude can infer the profile', () => {
    const prompt = buildLookalikePrompt(signals, 2)
    expect(prompt).toContain('AI-native')
    expect(prompt).toContain('mid-market')
    expect(prompt).toContain('2 search queries')
  })
})
