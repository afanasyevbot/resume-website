/**
 * Hard geographic gate for the job engine.
 *
 * Location used to be only a soft hint in the matcher prompt, so an onsite-SF
 * role scored 74 and got tailored. This module is the deterministic enforcement:
 * the LLM EXTRACTS where a role is (workplace + state codes), and this code
 * DECIDES whether it's in Matthew's targets (CLAUDE.md #7 — model for judgment,
 * code for the decision). Off-target onsite/hybrid roles are routed to 'discard'
 * in decideRoute and so are never tailored or auto-submitted.
 *
 * Policy lives HERE, in one place — change the list and the whole pipeline follows.
 */

export type Workplace = 'remote' | 'onsite' | 'hybrid' | 'unknown'

/** US states/metros where Matthew will work onsite or hybrid.
 *  MN = Minneapolis/Minnesota, IL = Chicago, NC + SC = the Carolinas,
 *  FL = Florida, TN = Tennessee (added 2026-06-15). Remote (anywhere US) is
 *  always allowed and is handled separately. */
export const ALLOWED_ONSITE_STATES: ReadonlyArray<string> = ['MN', 'IL', 'NC', 'SC', 'FL', 'TN']

const ALLOWED = new Set<string>(ALLOWED_ONSITE_STATES)

/**
 * Does this role's location clear the gate?
 *
 * Fails OPEN by design: only a CONFIRMED offsite role (onsite/hybrid) with a
 * CONFIRMED out-of-list location is excluded. Remote, unknown, and onsite-with-
 * no-parseable-location all pass — silently dropping a good remote role is a
 * worse error in a job search than letting an ambiguous one through to review.
 */
export function passesLocationGate(workplace: string, locations: string[]): boolean {
  if (workplace !== 'onsite' && workplace !== 'hybrid') return true // remote / unknown
  if (!locations || locations.length === 0) return true // can't confirm it's out-of-list
  return locations.some((s) => ALLOWED.has(String(s).trim().toUpperCase()))
}

/** Human-readable reason an offsite role was excluded — prepended to fit_reasons
 *  so a discarded role still explains itself in the dashboard. */
export function locationExclusionReason(workplace: string, locations: string[]): string {
  const where =
    locations && locations.length
      ? locations.map((s) => String(s).trim().toUpperCase()).join('/')
      : 'an unlisted location'
  return `📍 Outside location targets: ${workplace} in ${where} — you take remote, or onsite/hybrid only in ${ALLOWED_ONSITE_STATES.join(', ')}.`
}
