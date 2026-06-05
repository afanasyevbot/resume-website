/**
 * Decides what to record from a browser-agent /apply response.
 *
 * CRITICAL CORRECTNESS RULE: only an explicitly CONFIRMED submission marks a
 * role 'applied'. A clicked submit button is NOT proof the application went
 * through — forms routinely bounce back on validation with the submit button
 * still on the page. Recording "applied" off a mere click is a silent false
 * positive: Matthew believes he applied when he never did, and the role drops
 * out of his active queue forever. So:
 *
 *   confirmed === true        → 'applied'        (status → applied, reminders set)
 *   submitted but unconfirmed → 'needs_review'   (status → needs_review, surfaced
 *                                                  for manual verification; NOT
 *                                                  re-picked by auto-apply, so it
 *                                                  can't be double-submitted)
 *   skipped (blocker/gate)    → 'skipped'        (status unchanged)
 *   anything else / error     → 'failed'         (status unchanged)
 */
export type ApplyOutcome = 'applied' | 'needs_review' | 'skipped' | 'failed'

export interface BrowserApplyResult {
  success?: boolean
  submitted?: boolean
  confirmed?: boolean
  skipped?: boolean
  dryRun?: boolean
  reason?: string
}

export function decideApplyOutcome(r: BrowserApplyResult, dryRun: boolean): ApplyOutcome {
  // A dry run never mutates state, regardless of what the browser reports.
  if (dryRun) return 'skipped'
  // Only an explicit confirmation counts as applied.
  if (r.confirmed === true) return 'applied'
  // We clicked submit but could not confirm — needs a human to verify.
  if (r.submitted === true) return 'needs_review'
  // Browser intentionally skipped (captcha, screening questions, unknown ATS, …).
  if (r.skipped === true) return 'skipped'
  return 'failed'
}
