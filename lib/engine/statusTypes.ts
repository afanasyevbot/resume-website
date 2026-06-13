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

/**
 * Every legal value of roles.status, in rough lifecycle order. Single source of
 * truth backing the DB CHECK constraint (migration 0015) — a typo'd status like
 * 'aplied' would otherwise insert silently and vanish the role from every
 * status-filtered query. Add a status here AND widen the CHECK in a new
 * migration (the drift-guard test enforces the two stay in sync).
 *
 * ROLE statuses only — NOT the unrelated status columns on application_packages
 * ('draft'), slack_pending ('pending'/'failed'), or reminders ('done').
 */
export const ROLE_STATUSES = [
  'sourced',
  'scored',
  'tailored',
  'queued',
  'awaiting_approval',
  'needs_review',
  'applied',
  'discarded',
  'archived',
  ...OUTCOME_STATUSES,
] as const
export type RoleStatus = (typeof ROLE_STATUSES)[number]

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
