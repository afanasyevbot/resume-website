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
  stale: boolean
  /** Companies whose ATS fetch failed in the latest run (source_run only). */
  failedCompanies: string[]
}

export interface EngineHealth {
  crons: CronStatus[]
  anyStale: boolean
  /** Failed-to-fetch companies from the latest source run — surfaced on the brief. */
  failedCompanies: string[]
}

interface LastRun {
  kind: CronKind
  lastRunAt: string | null
  detail: Record<string, unknown> | null
}

/** PURE: turn the latest-run-per-kind rows into a health snapshot given `now`. */
export function assessCronHealth(runs: LastRun[], now: Date = new Date()): EngineHealth {
  const byKind = new Map(runs.map((r) => [r.kind, r]))
  const crons: CronStatus[] = KINDS.map((kind) => {
    const run = byKind.get(kind)
    const lastRunAt = run?.lastRunAt ?? null
    const ageMs = lastRunAt ? now.getTime() - new Date(lastRunAt).getTime() : Infinity
    const stale = ageMs > STALE_HOURS[kind] * 3_600_000
    const failed =
      run?.detail && Array.isArray(run.detail.failedCompanies)
        ? (run.detail.failedCompanies as unknown[]).filter((x): x is string => typeof x === 'string')
        : []
    return { kind, label: LABELS[kind], lastRunAt, stale, failedCompanies: failed }
  })
  const src = crons.find((c) => c.kind === 'source_run')
  return {
    crons,
    anyStale: crons.some((c) => c.stale),
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
