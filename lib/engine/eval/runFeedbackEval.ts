/**
 * Pure eval helper for thumbs-up/down feedback events.
 *
 * Compares the matcher's 0-100 fit score against Matthew's human rating to
 * answer "is the matcher actually catching the roles I'd say yes to?".
 *
 * Mapping: thumbs-up (1) → 80 (anchor for "yes, tailor this"),
 *          thumbs-down (-1) → 20 (anchor for "skip this").
 * The anchors are intentionally inside the 0-100 band so MAE stays comparable
 * to the existing labeled-eval helper (compareToLabels.ts).
 *
 * Agreement uses the matcher's own routing threshold: scores >= 60 are
 * "tailor"-side, scores < 60 are "discard/flag"-side. We measure how often
 * that matches the human rating.
 */

export interface FeedbackEvalRow {
  /** Matcher score, 0-100. */
  matcherScore: number
  /** Human rating: 1 = good fit, -1 = bad fit. */
  rating: 1 | -1
}

export interface FeedbackEvalReport {
  n: number
  /** Mean absolute error between matcherScore and the rating-anchor (80/20). */
  mae: number
  /** Share of rows where matcher (>=60 vs <60) matches rating (1 vs -1). */
  agreement: number
  breakdown: {
    /** matcher >= 60 AND rating = 1 — matcher said tailor, human agreed. */
    tailorAgree: number
    /** matcher >= 60 AND rating = -1 — matcher said tailor, human disagreed. */
    tailorDisagree: number
    /** matcher < 60 AND rating = -1 — matcher said skip, human agreed. */
    discardAgree: number
    /** matcher < 60 AND rating = 1 — matcher said skip, human disagreed (miss). */
    discardDisagree: number
  }
}

const RATING_TO_SCORE: Record<1 | -1, number> = { 1: 80, [-1]: 20 }
const TAILOR_THRESHOLD = 60

export function runFeedbackEval(rows: FeedbackEvalRow[]): FeedbackEvalReport {
  const n = rows.length
  const breakdown = {
    tailorAgree: 0,
    tailorDisagree: 0,
    discardAgree: 0,
    discardDisagree: 0,
  }
  let totalDiff = 0
  let agree = 0

  for (const row of rows) {
    const anchor = RATING_TO_SCORE[row.rating]
    totalDiff += Math.abs(row.matcherScore - anchor)
    const matcherSaidTailor = row.matcherScore >= TAILOR_THRESHOLD
    if (matcherSaidTailor && row.rating === 1) {
      breakdown.tailorAgree++
      agree++
    } else if (matcherSaidTailor && row.rating === -1) {
      breakdown.tailorDisagree++
    } else if (!matcherSaidTailor && row.rating === -1) {
      breakdown.discardAgree++
      agree++
    } else {
      breakdown.discardDisagree++
    }
  }

  return {
    n,
    mae: n === 0 ? 0 : totalDiff / n,
    agreement: n === 0 ? 0 : agree / n,
    breakdown,
  }
}
