import { describe, it, expect } from 'vitest'
import {
  SPS_AI_REPORTED_RESULTS,
  SPS_PERFORMANCE_EXPERIENCE_LINE,
  SPS_PERFORMANCE_RESUME_BULLET,
  homepageProofPoints,
  performanceSourceFacts,
} from '../performanceFacts'

describe('performanceFacts', () => {
  it('uses the three approved homepage proof points', () => {
    expect(homepageProofPoints).toHaveLength(3)
    expect(homepageProofPoints.map((p) => p.value)).toEqual([
      '#1 ranked rep YTD',
      '200%',
      'Division record',
    ])
  })

  it('does not show legacy disclaimers on homepage proof points', () => {
    const joined = homepageProofPoints.map((p) => `${p.value} ${p.label}`).join(' ')
    expect(joined).not.toMatch(/of 30/i)
    expect(joined).not.toMatch(/Q1 2026/i)
  })

  it('keeps the exact SPS AI reported-results wording', () => {
    expect(SPS_AI_REPORTED_RESULTS).toBe(
      'Reported sales-floor results: reps using the pilot converted leads 10-20% faster and closed deals approximately 1.5x faster than non-users.',
    )
  })

  it('includes the approved experience detail line', () => {
    expect(SPS_PERFORMANCE_EXPERIENCE_LINE).toContain('200% of quota in Q3')
    expect(SPS_PERFORMANCE_EXPERIENCE_LINE).toContain("President's Club qualification")
  })

  it('preserves source facts for chat without legacy standings', () => {
    expect(performanceSourceFacts.some((f) => f.includes('#1 ranked rep YTD'))).toBe(true)
    expect(performanceSourceFacts.some((f) => f.includes('200% of quota in Q3'))).toBe(true)
    expect(performanceSourceFacts.some((f) => f.includes('Do not say "#1 of 30"'))).toBe(true)
    expect(performanceSourceFacts.join(' ')).not.toMatch(/ranked #3 of 30/i)
  })

  it('uses the approved resume performance bullet', () => {
    expect(SPS_PERFORMANCE_RESUME_BULLET).toContain('#1 ranked rep YTD')
    expect(SPS_PERFORMANCE_RESUME_BULLET).toContain('200% of quota in Q3')
    expect(SPS_PERFORMANCE_RESUME_BULLET).toContain("President's Club qualification")
  })
})
