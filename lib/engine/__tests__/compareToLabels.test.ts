import { describe, it, expect } from 'vitest'
import { evaluate, labelToScore } from '../eval/compareToLabels'
import type { LabeledRole } from '../eval/compareToLabels'
import type { MatchResult } from '../types'

function result(score: number): MatchResult {
  return { score, reasons: [], aiNative: true, segment: 'mid-market', summary: null, route: 'tailor' }
}

const rows: LabeledRole[] = [
  { company: 'Rox', title: 'Strategic AE', label: 9, result: result(88) }, // label 90, diff 2
  { company: 'Datadog', title: 'AE', label: 7, result: result(72) }, // label 70, diff 2
  { company: 'Xometry', title: 'AE Aerospace', label: 4, result: result(75) }, // label 40, diff 35
]

describe('labelToScore', () => {
  it('maps a 1-10 label onto 0-100', () => {
    expect(labelToScore(9)).toBe(90)
    expect(labelToScore(4)).toBe(40)
  })
})

describe('evaluate', () => {
  it('counts rows', () => {
    expect(evaluate(rows).n).toBe(3)
  })

  it('computes mean absolute error', () => {
    // diffs: 2, 2, 35 → mean 13
    expect(evaluate(rows).mae).toBeCloseTo(13, 5)
  })

  it('computes agreement within tolerance', () => {
    // tolerance 15 → 2 of 3 within
    expect(evaluate(rows, 15).agreement).toBeCloseTo(2 / 3, 5)
  })

  it('lists disagreements beyond tolerance', () => {
    const report = evaluate(rows, 15)
    expect(report.disagreements).toHaveLength(1)
    expect(report.disagreements[0].company).toBe('Xometry')
    expect(report.disagreements[0].diff).toBe(35)
  })

  it('handles an empty set without dividing by zero', () => {
    const report = evaluate([])
    expect(report.n).toBe(0)
    expect(report.mae).toBe(0)
    expect(report.agreement).toBe(0)
  })
})
