/**
 * Pure eval helper for thumbs-up/down feedback events.
 *
 * Compares the matcher's 0-100 fit score against Matthew's human rating to
 * answer "is the matcher actually catching the roles I'd say yes to?".
 *
 * Mapping: thumbs-up (1) → 80 (anchor for "yes, I'd apply"),
 *          thumbs-down (-1) → 20 (anchor for "skip this").
 * The anchors are intentionally inside the 0-100 band so MAE stays comparable
 * to the existing labeled-eval helper (compareToLabels.ts).
 *
 * Agreement is measured at the threshold the engine ACTUALLY acts on — AUTO_FIT,
 * the auto-apply floor (thresholds.ts). A thumb-up means "I'd apply"; the matcher
 * "agrees autonomously" when it scored the role at/above AUTO_FIT. The old code
 * graded agreement at a hardcoded 60 — a bar the engine never uses — so the
 * number it reported was meaningless. The whole value of the eval is measuring
 * against the decision the engine really makes.
 */

import { AUTO_FIT } from '../thresholds'

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
  /** Share of rows where the matcher's auto-apply decision matches the rating. */
  agreement: number
  /** The cutoff agreement was measured at (AUTO_FIT). Surfaced so the UI labels it. */
  threshold: number
  breakdown: {
    /** score >= AUTO_FIT AND rating = 1 — engine would auto-apply, human agreed. */
    applyAgree: number
    /** score >= AUTO_FIT AND rating = -1 — engine would auto-apply, human said NO (false apply). */
    applyDisagree: number
    /** score < AUTO_FIT AND rating = -1 — engine would hold/skip, human agreed. */
    holdAgree: number
    /** score < AUTO_FIT AND rating = 1 — engine would hold/skip, human said YES (the miss). */
    holdDisagree: number
  }
}

const RATING_TO_SCORE: Record<1 | -1, number> = { 1: 80, [-1]: 20 }

export function runFeedbackEval(
  rows: FeedbackEvalRow[],
  threshold: number = AUTO_FIT,
): FeedbackEvalReport {
  const n = rows.length
  const breakdown = {
    applyAgree: 0,
    applyDisagree: 0,
    holdAgree: 0,
    holdDisagree: 0,
  }
  let totalDiff = 0
  let agree = 0

  for (const row of rows) {
    const anchor = RATING_TO_SCORE[row.rating]
    totalDiff += Math.abs(row.matcherScore - anchor)
    const wouldAutoApply = row.matcherScore >= threshold
    if (wouldAutoApply && row.rating === 1) {
      breakdown.applyAgree++
      agree++
    } else if (wouldAutoApply && row.rating === -1) {
      breakdown.applyDisagree++
    } else if (!wouldAutoApply && row.rating === -1) {
      breakdown.holdAgree++
      agree++
    } else {
      breakdown.holdDisagree++
    }
  }

  return {
    n,
    mae: n === 0 ? 0 : totalDiff / n,
    agreement: n === 0 ? 0 : agree / n,
    threshold,
    breakdown,
  }
}
