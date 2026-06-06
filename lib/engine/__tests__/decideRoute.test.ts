import { describe, it, expect } from 'vitest'
import { decideRoute, DEFAULT_THRESHOLDS } from '../decideRoute'
import type { MatchAssessment } from '../types'

function assessment(partial: Partial<MatchAssessment>): MatchAssessment {
  return { score: 0, reasons: [], aiNative: false, segment: 'mid-market', ...partial }
}

describe('decideRoute', () => {
  it('routes a strong mid-market fit to tailor', () => {
    expect(decideRoute(assessment({ score: 80, segment: 'mid-market' }))).toBe('tailor')
  })

  it('routes a borderline score to flag', () => {
    expect(decideRoute(assessment({ score: 60 }))).toBe('flag')
  })

  it('routes a weak score to discard', () => {
    expect(decideRoute(assessment({ score: 40 }))).toBe('discard')
  })

  it('caps an enterprise role at flag even with a high score', () => {
    expect(decideRoute(assessment({ score: 90, segment: 'enterprise' }))).toBe('flag')
  })

  it('respects the threshold boundaries exactly', () => {
    expect(decideRoute(assessment({ score: DEFAULT_THRESHOLDS.tailor }))).toBe('tailor')
    expect(decideRoute(assessment({ score: DEFAULT_THRESHOLDS.flag }))).toBe('flag')
    expect(decideRoute(assessment({ score: DEFAULT_THRESHOLDS.flag - 1 }))).toBe('discard')
  })
})
