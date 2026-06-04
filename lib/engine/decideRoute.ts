import type { MatchAssessment, RouteDecision } from './types'

export interface RouteThresholds {
  tailor: number // score >= this → tailor
  flag: number // score >= this (and < tailor) → flag; below → discard
}

export const DEFAULT_THRESHOLDS: RouteThresholds = { tailor: 70, flag: 55 }

/**
 * Deterministic routing. The LLM produces the judgment (score/segment);
 * this code makes the decision — never the model.
 * Enterprise-only roles are capped at 'flag' because Matthew is mid-market;
 * they never auto-route to 'tailor' regardless of score.
 */
export function decideRoute(
  assessment: MatchAssessment,
  thresholds: RouteThresholds = DEFAULT_THRESHOLDS,
): RouteDecision {
  const { score, segment } = assessment
  let route: RouteDecision =
    score >= thresholds.tailor ? 'tailor' : score >= thresholds.flag ? 'flag' : 'discard'
  if (segment === 'enterprise' && route === 'tailor') route = 'flag'
  return route
}
