import { describe, it, expect } from 'vitest'
import {
  PERFORMANCE_AS_OF,
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
      'Top performer',
      '58%',
      'Weeks → minutes',
    ])
  })

  it('keeps the exact SPS AI reported-results wording', () => {
    expect(SPS_AI_REPORTED_RESULTS).toBe(
      'Reported sales-floor results: users convert leads 10–20% faster and close deals approximately 1.5x faster than non-users.',
    )
  })

  it('includes the approved experience detail line', () => {
    expect(SPS_PERFORMANCE_EXPERIENCE_LINE).toContain('Ranked #3 of 30 account executives for 2026 year-to-date')
    expect(SPS_PERFORMANCE_EXPERIENCE_LINE).toContain(PERFORMANCE_AS_OF)
  })

  it('preserves source facts for Q1, Q3, and YTD without overstating Q3', () => {
    expect(performanceSourceFacts.some((f) => f.includes('Q1 2026: ranked #1 of 30'))).toBe(true)
    expect(performanceSourceFacts.some((f) => f.includes('tied for #1'))).toBe(true)
    expect(performanceSourceFacts.some((f) => f.includes('do not describe as an outright or completed Q3 win'))).toBe(
      true,
    )
  })

  it('uses the approved resume performance bullet', () => {
    expect(SPS_PERFORMANCE_RESUME_BULLET).toContain('Top performer in Q1 2026 and Q3 to date')
    expect(SPS_PERFORMANCE_RESUME_BULLET).toContain("tracking toward President's Club")
  })
})
