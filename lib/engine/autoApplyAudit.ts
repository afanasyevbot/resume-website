import { sql } from './db'
import { SUBMITTABLE_ATS_ARR } from './ats/capability'

/**
 * Visibility layer for the auto-apply cron. Every run writes an
 * 'auto_apply_run' event so the dashboard activity feed always shows what the
 * cron saw and did — including "found nothing eligible" runs, which were
 * previously completely silent.
 */

/** Why tailored roles were NOT picked up by the cron's eligibility query. */
export interface TailoredExclusions {
  /** All roles currently at status=tailored, route=tailor. */
  tailoredTotal: number
  /** Excluded because the engine can't auto-submit this ats_type (no submitter). */
  blockedByUrlWhitelist: number
  /** Excluded because fit_score is below the cron floor. */
  belowFitFloor: number
  /** Excluded because no application package exists. */
  noPackage: number
  /** Roles the cron's query would actually return. */
  eligible: number
}

export interface RunCounts {
  applied: number
  needsReview: number
  skipped: number
  failed: number
  awaitingApproval: number
  total: number
}

export interface AutoApplyRunDetail extends RunCounts, TailoredExclusions {
  summary: string
  dryRun: boolean
  minFit: number
  appliedToday: number
  /** True when the run tried to submit and EVERY attempt failed — read by the
   *  cron heartbeat (assessCronHealth) so a browser-service outage shows red. */
  errored?: boolean
}

/** PURE: did the run attempt submissions and have ALL of them fail? That's the
 *  signature of a down browser service (vs. a healthy "nothing eligible" run,
 *  where total === 0). Drives the errored heartbeat flag + the Slack ping. */
export function runAllFailed(counts: { total: number; applied: number; failed: number }): boolean {
  return counts.total > 0 && counts.applied === 0 && counts.failed === counts.total
}

/**
 * Count tailored roles the cron query excludes, and why. Mirrors the cron's
 * eligibility filters in runAutoApply — if those change, change this too.
 */
export async function tailoredExclusions(minFit: number): Promise<TailoredExclusions> {
  const rows = await sql`
    select
      count(*)::int as tailored_total,
      count(*) filter (
        where ats_type is null or ats_type <> all(${SUBMITTABLE_ATS_ARR})
      )::int as blocked_by_url,
      count(*) filter (where coalesce(fit_score, 0) < ${minFit})::int as below_fit,
      count(*) filter (
        where not exists (
          select 1 from application_packages p
          where p.role_id = roles.id and p.package_json is not null
        )
      )::int as no_package,
      count(*) filter (
        where url is not null
          and ats_type = any(${SUBMITTABLE_ATS_ARR})
          and coalesce(fit_score, 0) >= ${minFit}
          and exists (
            select 1 from application_packages p
            where p.role_id = roles.id and p.package_json is not null
          )
      )::int as eligible
    from roles
    where status = 'tailored' and route = 'tailor'
  `
  const r = rows[0] as Record<string, number>
  return {
    tailoredTotal: Number(r.tailored_total ?? 0),
    blockedByUrlWhitelist: Number(r.blocked_by_url ?? 0),
    belowFitFloor: Number(r.below_fit ?? 0),
    noPackage: Number(r.no_package ?? 0),
    eligible: Number(r.eligible ?? 0),
  }
}

/** Build the event detail (pure — testable). The summary is what the activity feed shows. */
export function buildAutoApplyRunDetail(
  counts: RunCounts,
  exclusions: TailoredExclusions,
  opts: { dryRun: boolean; minFit: number; appliedToday: number },
): AutoApplyRunDetail {
  let summary: string
  if (counts.total === 0) {
    const reasons: string[] = []
    if (exclusions.blockedByUrlWhitelist > 0)
      reasons.push(`${exclusions.blockedByUrlWhitelist} blocked by ATS whitelist`)
    if (exclusions.belowFitFloor > 0)
      reasons.push(`${exclusions.belowFitFloor} below fit ${opts.minFit}`)
    if (exclusions.noPackage > 0) reasons.push(`${exclusions.noPackage} missing package`)
    summary =
      `0 eligible of ${exclusions.tailoredTotal} tailored` +
      (reasons.length > 0 ? ` — ${reasons.join(', ')}` : '')
  } else {
    const parts: string[] = []
    if (counts.applied > 0) parts.push(`${counts.applied} applied`)
    if (counts.awaitingApproval > 0) parts.push(`${counts.awaitingApproval} awaiting approval`)
    if (counts.needsReview > 0) parts.push(`${counts.needsReview} needs review`)
    if (counts.skipped > 0) parts.push(`${counts.skipped} skipped`)
    if (counts.failed > 0) parts.push(`${counts.failed} failed`)
    summary = parts.join(', ') || `${counts.total} processed`
  }
  if (opts.dryRun) summary = `dry run — ${summary}`
  return { summary, ...counts, ...exclusions, ...opts }
}

/** Persist the run record. Best-effort: an audit failure must never break the run. */
export async function recordAutoApplyRun(detail: AutoApplyRunDetail): Promise<void> {
  try {
    const payload = JSON.stringify(detail)
    await sql`insert into events (kind, detail) values ('auto_apply_run', ${payload}::jsonb)`
  } catch (err) {
    console.error('recordAutoApplyRun failed:', err)
  }
}
