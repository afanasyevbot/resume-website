import { describe, it, expect } from 'vitest'
import { decideRoute, DEFAULT_THRESHOLDS } from '../decideRoute'
import type { MatchAssessment } from '../types'

function assessment(partial: Partial<MatchAssessment>): MatchAssessment {
  return {
    score: 0,
    reasons: [],
    aiNative: false,
    segment: 'mid-market',
    summary: null,
    workplace: 'remote',
    locations: [],
    ...partial,
  }
}

describe('decideRoute', () => {
  it('routes a strong mid-market fit to tailor', () => {
    expect(decideRoute(assessment({ score: 80, segment: 'mid-market' }))).toBe('tailor')
  })

  it('routes a borderline score to flag', () => {
    expect(decideRoute(assessment({ score: 60 }))).toBe('flag')
  })

  it('routes a low-but-reviewable score (45-54) to flag, not discard', () => {
    expect(decideRoute(assessment({ score: 50 }))).toBe('flag')
    expect(decideRoute(assessment({ score: 45 }))).toBe('flag')
  })

  it('routes a weak score to discard', () => {
    expect(decideRoute(assessment({ score: 40 }))).toBe('discard')
    expect(decideRoute(assessment({ score: 44 }))).toBe('discard')
  })

  it('caps an enterprise role at flag even with a high score', () => {
    expect(decideRoute(assessment({ score: 90, segment: 'enterprise' }))).toBe('flag')
  })

  it('respects the threshold boundaries exactly', () => {
    expect(decideRoute(assessment({ score: DEFAULT_THRESHOLDS.tailor }))).toBe('tailor')
    expect(decideRoute(assessment({ score: DEFAULT_THRESHOLDS.flag }))).toBe('flag')
    expect(decideRoute(assessment({ score: DEFAULT_THRESHOLDS.flag - 1 }))).toBe('discard')
  })

  it('discards an off-target onsite role even with a tailor-worthy score', () => {
    // The Brex case: great fit on paper, but onsite in CA → never tailor/apply.
    expect(decideRoute(assessment({ score: 88, workplace: 'onsite', locations: ['CA'] }))).toBe('discard')
  })

  it('keeps an onsite role in a target metro (TN) routable by score', () => {
    expect(decideRoute(assessment({ score: 80, workplace: 'onsite', locations: ['TN'] }))).toBe('tailor')
  })

  it('leaves remote roles untouched by the location gate', () => {
    expect(decideRoute(assessment({ score: 80, workplace: 'remote', locations: [] }))).toBe('tailor')
  })
})
