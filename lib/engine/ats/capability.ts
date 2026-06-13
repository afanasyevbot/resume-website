/**
 * ATS capability: which platform a job URL belongs to, and whether the browser
 * service can auto-submit it. This is the single source of truth the apply cron
 * gates on — replacing the old `url like '%greenhouse.io%' or '%ashbyhq.com%'`
 * substring checks scattered across the cron query and the audit. Add a new ATS
 * to SUBMITTABLE_ATS the day a submitter lands and the whole pipeline lights up
 * with no query edits.
 */

/** Host suffix → normalized ats_type. Order doesn't matter (suffixes are distinct). */
const HOST_TO_ATS: ReadonlyArray<readonly [string, string]> = [
  ['greenhouse.io', 'greenhouse'],
  ['lever.co', 'lever'],
  ['ashbyhq.com', 'ashby'],
  ['myworkdayjobs.com', 'workday'],
  ['workday.com', 'workday'],
  ['smartrecruiters.com', 'smartrecruiters'],
  ['icims.com', 'icims'],
  ['jobvite.com', 'jobvite'],
  ['taleo.net', 'taleo'],
  ['successfactors.com', 'successfactors'],
  ['breezy.hr', 'breezy'],
  ['applytojob.com', 'applytojob'],
]

/** Normalized ATS platform for a job URL, or null if not a known ATS host. */
export function atsTypeFromUrl(url: string | null | undefined): string | null {
  if (!url) return null
  try {
    const host = new URL(url).hostname.replace(/^www\./, '').toLowerCase()
    for (const [domain, type] of HOST_TO_ATS) {
      if (host === domain || host.endsWith('.' + domain)) return type
    }
    return null
  } catch {
    return null
  }
}

/**
 * ATS platforms the browser service can actually auto-submit today. The cron
 * applies ONLY to these; everything else (Lever, Workday, unknown, aggregator)
 * routes to manual review so Matthew sees it in the deck instead of it sitting
 * tailored forever.
 */
export const SUBMITTABLE_ATS = ['greenhouse', 'ashby'] as const

/** A mutable copy for SQL `= any(...)` params (Neon needs a plain array). */
export const SUBMITTABLE_ATS_ARR: string[] = [...SUBMITTABLE_ATS]

/** Can the engine auto-submit this ats_type without a human? */
export function canAutoSubmit(atsType: string | null | undefined): boolean {
  return atsType != null && (SUBMITTABLE_ATS as readonly string[]).includes(atsType)
}
