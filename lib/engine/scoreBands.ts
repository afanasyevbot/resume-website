/**
 * Plain-English meaning of a fit score — the single source of truth for what
 * the engine DOES at each score, so the dashboard never shows a bare number.
 *
 * Band edges mirror the live policy constants:
 *   75 = AUTO_FIT       (app/api/engine/auto-apply/route.ts) — auto-submits
 *   70 = CRON_MIN_FIT / DEFAULT_THRESHOLDS.tailor             — approval queue
 *   45 = DEFAULT_THRESHOLDS.flag (lib/engine/decideRoute.ts)  — below = discard
 * If those constants change, change these edges too.
 */

export interface ScoreBand {
  label: string
  /** What the engine does with a role in this band. */
  meaning: string
  /** Dot/badge color (matches the engine palette). */
  color: string
}

export function scoreBand(score: number | null | undefined): ScoreBand {
  if (score == null) {
    return { label: 'Unscored', meaning: 'Not yet scored by the matcher.', color: '#5d6b80' }
  }
  if (score >= 75) {
    return {
      label: 'Auto-apply',
      meaning: 'Submits automatically on the daily run — no action needed.',
      color: '#4ade80',
    }
  }
  if (score >= 70) {
    return {
      label: 'Needs your OK',
      meaning: 'Tailored and ready, but held for your one-click approval.',
      color: '#f0b429',
    }
  }
  if (score >= 55) {
    return {
      label: 'Worth a look',
      meaning: 'Flagged for review — decent fit, not auto-tailored.',
      color: '#e3a52e',
    }
  }
  if (score >= 45) {
    return {
      label: 'Long shot',
      meaning: 'Kept visible, but the matcher sees real gaps.',
      color: '#c4924d',
    }
  }
  return {
    label: 'Not a fit',
    meaning: 'Discarded by the matcher — reasons stored on the role.',
    color: '#5d6b80',
  }
}
