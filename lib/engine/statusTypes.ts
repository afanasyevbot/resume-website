/**
 * Single source of truth for post-application outcome statuses.
 *
 * The dashboard has always COUNTED responded/interviewing/offer/rejected
 * (getCounts in dashboard.ts), but nothing ever WROTE them — the Responses
 * KPI was permanently zero and "interviews booked" unmeasurable. The outcome
 * API uses these to validate transitions.
 */

export const OUTCOME_STATUSES = ['responded', 'interviewing', 'offer', 'rejected'] as const
export type OutcomeStatus = (typeof OUTCOME_STATUSES)[number]

/** Statuses from which an outcome may be logged: applied, or any prior
 *  outcome (so a response can progress to interview, offer, or rejection —
 *  and mistakes can be corrected). */
const OUTCOME_ELIGIBLE = new Set(['applied', ...OUTCOME_STATUSES])

export function canLogOutcome(currentStatus: string, outcome: string): boolean {
  return (
    OUTCOME_ELIGIBLE.has(currentStatus.toLowerCase()) &&
    (OUTCOME_STATUSES as readonly string[]).includes(outcome)
  )
}
