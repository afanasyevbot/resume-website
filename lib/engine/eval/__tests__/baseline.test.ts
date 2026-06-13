import { describe, it, expect } from 'vitest'
import { evaluate } from '../compareToLabels'
import { LABELED_SET } from '../labeledSet'
import { AUTO_FIT } from '../../thresholds'

/**
 * Baseline: how well does the CURRENT rubric (stored prod scores) match the
 * ground-truth labels? This documents the miscalibration the rubric change
 * (Stage 2) must fix, and acts as a regression anchor — re-running with new
 * scores should LOWER the MAE on the under-scored mid-market AE roles without
 * inflating the enterprise/CSM/eng ones.
 */
describe('matcher baseline — current rubric vs ground-truth labels', () => {
  const report = evaluate(LABELED_SET, 15)

  it('the labeled set is non-trivial and spans the range', () => {
    expect(report.n).toBeGreaterThanOrEqual(15)
  })

  it('the current rubric is meaningfully off (MAE documents the gap)', () => {
    // Snapshot the baseline so a future rubric change can show improvement.
    expect(report.mae).toBeGreaterThan(8)
  })

  it('THE DEAD ZONE: most strong-yes roles do not clear the auto-apply bar today', () => {
    // Roles labeled >=8 are ones Matthew would clearly want auto-applied. The
    // rubric should put them at/above AUTO_FIT. Today most land at 72-74 — the
    // core "I don't see it applying" cause. Stage 2 must flip this.
    const strongYes = LABELED_SET.filter((l) => l.label >= 8)
    const clearAuto = strongYes.filter((l) => l.result.score >= AUTO_FIT)
    expect(strongYes.length).toBeGreaterThanOrEqual(4)
    // Documents the failure: a minority of clear-yes roles auto-apply right now.
    expect(clearAuto.length).toBeLessThan(strongYes.length / 2)
  })

  it('is miscalibrated in BOTH directions (under-rates AE fits, over-rates CSM/BDR)', () => {
    const under = report.disagreements.filter((d) => d.matcherScore < d.labelScore)
    const over = report.disagreements.filter((d) => d.matcherScore > d.labelScore)
    expect(under.length).toBeGreaterThan(0) // mid-market AE fits scored too low
    expect(over.length).toBeGreaterThan(0)  // CSM/BDR roles scored too high (clutter)
  })

  it('his two thumbs-up roles both fall below the auto-apply bar today', () => {
    // The smoking gun: the roles Matthew actually said YES to scored 72 and 74,
    // so zero of his real "yes" votes would auto-apply under the current rubric.
    const thumbed = LABELED_SET.filter(
      (l) => l.company === 'Customer.io' && l.title.startsWith('Mid-Market') ||
             l.company === 'Hirequorum',
    )
    expect(thumbed.length).toBe(2)
    expect(thumbed.every((l) => l.result.score < 75)).toBe(true)
  })
})
