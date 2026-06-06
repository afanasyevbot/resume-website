import type { MatchResult } from '../types'

export interface LabeledRole {
  company: string
  title: string
  /** Matthew's own fit label, 1-10 (from his tracker). */
  label: number
  result: MatchResult
}

export interface EvalReport {
  n: number
  /** Mean absolute error between matcher score and label, both on 0-100. */
  mae: number
  /** Share of roles where the matcher score is within `tolerance` of the label. */
  agreement: number
  /** Roles where matcher and label disagree by more than `tolerance`. */
  disagreements: Array<{
    company: string
    title: string
    labelScore: number
    matcherScore: number
    diff: number
  }>
}

/** Matthew labels 1-10; the matcher scores 0-100. Put both on 0-100. */
export function labelToScore(label: number): number {
  return Math.round(label * 10)
}

export function evaluate(rows: LabeledRole[], tolerance = 15): EvalReport {
  const diffs = rows.map((row) => {
    const labelScore = labelToScore(row.label)
    return { row, labelScore, diff: Math.abs(row.result.score - labelScore) }
  })
  const within = diffs.filter((d) => d.diff <= tolerance)
  const disagreements = diffs
    .filter((d) => d.diff > tolerance)
    .map((d) => ({
      company: d.row.company,
      title: d.row.title,
      labelScore: d.labelScore,
      matcherScore: d.row.result.score,
      diff: d.diff,
    }))
  return {
    n: rows.length,
    mae: rows.length ? diffs.reduce((s, d) => s + d.diff, 0) / rows.length : 0,
    agreement: rows.length ? within.length / rows.length : 0,
    disagreements,
  }
}
