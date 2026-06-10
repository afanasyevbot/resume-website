import { describe, it, expect } from 'vitest'
import { scoreBand } from '../scoreBands'

describe('scoreBand — plain-English meaning of a fit score', () => {
  it('75+ auto-applies (matches AUTO_FIT)', () => {
    expect(scoreBand(75).label).toBe('Auto-apply')
    expect(scoreBand(92).label).toBe('Auto-apply')
  })

  it('70-74 needs approval (matches CRON_MIN_FIT..AUTO_FIT)', () => {
    expect(scoreBand(70).label).toBe('Needs your OK')
    expect(scoreBand(74).label).toBe('Needs your OK')
  })

  it('55-69 is worth a look', () => {
    expect(scoreBand(55).label).toBe('Worth a look')
    expect(scoreBand(69).label).toBe('Worth a look')
  })

  it('45-54 is a long shot (flag floor)', () => {
    expect(scoreBand(45).label).toBe('Long shot')
    expect(scoreBand(54).label).toBe('Long shot')
  })

  it('below 45 is not a fit (discard threshold)', () => {
    expect(scoreBand(44).label).toBe('Not a fit')
    expect(scoreBand(8).label).toBe('Not a fit')
  })

  it('null score → unscored', () => {
    expect(scoreBand(null).label).toBe('Unscored')
  })

  it('every band explains what the engine does with it', () => {
    for (const s of [80, 72, 60, 50, 30]) {
      expect(scoreBand(s).meaning.length).toBeGreaterThan(10)
    }
  })
})
