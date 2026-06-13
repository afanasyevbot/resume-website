import { sql } from './db'

/**
 * Cron heartbeat. The engine runs entirely on scheduled crons; before this,
 * a dead cron or a 100%-failed run looked byte-for-byte identical to a quiet
 * day — the dashboard would cheerfully say "nothing needs you" mid-outage.
 * This module answers "is each cron actually still running?" so the UI and the
 * Morning Brief can raise a flag instead of falsely reassuring.
 */

export type CronKind = 'source_run' | 'auto_apply_run' | 'research_run'

const KINDS: CronKind[] = ['source_run', 'auto_apply_run', 'research_run']

const LABELS: Record<CronKind, string> = {
  source_run: 'Sourcing',
  auto_apply_run: 'Auto-apply',
  research_run: 'Research',
}

/**
 * Absolute staleness thresholds in hours. Crons fire ~twice a day (research
 * once), so a healthy gap is ≤16h; we only flag once a full cycle is clearly
 * missed, to avoid crying wolf on normal overnight gaps. A flat multiplier of
 * the interval would misfire because the two daily runs aren't evenly spaced.
 */
const STALE_HOURS: Record<CronKind, number> = {
  source_run: 26,
  auto_apply_run: 26,
  research_run: 30,
}

export interface CronStatus {
  kind: CronKind
  label: string
  lastRunAt: string | null
  /** Hasn't run within its window — the cron may be dead. */
  stale: boolean
  /** Ran recently but the run itself reported an outage/error (Tavily down, a
   *  thrown run, an all-errors run). A fresh timestamp is NOT enough to be
   *  healthy — otherwise the heartbeat masks the very outage it exists to show. */
  failed: boolean
  /** Why this cron needs attention, for the warning text. */
  reason: 'stale' | 'failed' | null
  /** Companies whose ATS fetch failed in the latest run (source_run only). */
  failedCompanies: string[]
}

export interface EngineHealth {
  crons: CronStatus[]
  /** Any cron stale OR failed — the dashboard should raise a flag. */
  needsAttention: boolean
  /** Failed-to-fetch companies from the latest source run — surfaced on the brief. */
  failedCompanies: string[]
}

interface LastRun {
  kind: CronKind
  lastRunAt: string | null
  detail: Record<string, unknown> | null
}

/** Did this run report a failure in its own detail blob? A run can be RECENT
 *  yet broken — e.g. research wrote a fresh row but TAVILY_API_KEY was unset, or
 *  a run caught an exception and stamped errored:true. Recency alone can't see
 *  these, so the heartbeat must read the run's own verdict. */
function runFailed(detail: Record<string, unknown> | null): boolean {
  if (!detail) return false
  if (detail.errored === true) return true
  if (detail.tavilyConfigured === false) return true
  return false
}

/** PURE: turn the latest-run-per-kind rows into a health snapshot given `now`. */
export function assessCronHealth(runs: LastRun[], now: Date = new Date()): EngineHealth {
  const byKind = new Map(runs.map((r) => [r.kind, r]))
  const crons: CronStatus[] = KINDS.map((kind) => {
    const run = byKind.get(kind)
    const lastRunAt = run?.lastRunAt ?? null
    const ageMs = lastRunAt ? now.getTime() - new Date(lastRunAt).getTime() : Infinity
    const stale = ageMs > STALE_HOURS[kind] * 3_600_000
    const failed = !stale && runFailed(run?.detail ?? null)
    const failedCompanies =
      run?.detail && Array.isArray(run.detail.failedCompanies)
        ? (run.detail.failedCompanies as unknown[]).filter((x): x is string => typeof x === 'string')
        : []
    const reason: CronStatus['reason'] = stale ? 'stale' : failed ? 'failed' : null
    return { kind, label: LABELS[kind], lastRunAt, stale, failed, reason, failedCompanies }
  })
  const src = crons.find((c) => c.kind === 'source_run')
  return {
    crons,
    needsAttention: crons.some((c) => c.stale || c.failed),
    failedCompanies: src?.failedCompanies ?? [],
  }
}

/** Load the latest run per cron kind and assess health. */
export async function loadCronHealth(now: Date = new Date()): Promise<EngineHealth> {
  const rows = await sql`
    select distinct on (kind) kind, created_at as last_run_at, detail
    from events
    where kind in ('source_run', 'auto_apply_run', 'research_run')
    order by kind, created_at desc
  `
  const runs = (rows as Array<{ kind: CronKind; last_run_at: string; detail: Record<string, unknown> | null }>).map(
    (r) => ({ kind: r.kind, lastRunAt: r.last_run_at, detail: r.detail }),
  )
  return assessCronHealth(runs, now)
}
