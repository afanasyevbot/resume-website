import { sql } from './db'
import type { EngineHealth } from './health'

/**
 * The Morning Brief — the engine narrating what it did since Matthew last
 * looked, in plain English. Deterministic string composition from event
 * counts (no LLM call: assembling counts into sentences is plain code).
 */

/** Coarse "3h" / "2d" label for a timestamp — local to keep brief decoupled. */
function agoLabel(iso: string, now: Date): string {
  const hours = Math.floor((now.getTime() - new Date(iso).getTime()) / 3_600_000)
  if (hours < 1) return 'under an hour'
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}

/**
 * PURE: the one thing that must override a reassuring brief — a stuck cron or
 * a batch of dead job boards. Returns a leading warning sentence, or null when
 * everything is healthy. Staleness wins over failed-boards (a dead cron is the
 * bigger problem and implies we can't even trust the board counts).
 */
export function healthWarning(health: EngineHealth | undefined, now: Date = new Date()): string | null {
  if (!health) return null
  const stale = health.crons.filter((c) => c.stale)
  if (stale.length > 0) {
    const clauses = stale.map((c) =>
      c.lastRunAt ? `${c.label.toLowerCase()} hasn't run in ${agoLabel(c.lastRunAt, now)}` : `${c.label.toLowerCase()} has never run`,
    )
    const joined =
      clauses.length === 1
        ? clauses[0]
        : `${clauses.slice(0, -1).join(', ')} and ${clauses[clauses.length - 1]}`
    return `⚠ Something may be wrong — ${joined}. The engine runs about twice a day, so this likely means a job is stuck.`
  }
  if (health.failedCompanies.length > 0) {
    const names = health.failedCompanies
    const list = names.length <= 3 ? names.join(', ') : `${names.slice(0, 3).join(', ')} +${names.length - 3} more`
    return `Heads up: ${names.length} job board${names.length === 1 ? '' : 's'} came back empty in the last sourcing run (${list}) — they may have moved.`
  }
  return null
}

export interface BriefStats {
  /** Pretty "14h" / "2d" label for the since-anchor. */
  sinceLabel: string
  /** New roles scanned+scored in the window. */
  scanned: number
  /** Confirmed submissions in the window. */
  applied: Array<{ company: string }>
  /** Roles parked for approval in the window. */
  held: Array<{ company: string; fit: number | null }>
  /** Dead listings retired in the window. */
  retired: number
  /** How many items are sitting in the decision deck right now. */
  decisions: number
}

function joinNames(items: Array<{ company: string }>): string {
  const names = [...new Set(items.map((i) => i.company))]
  if (names.length === 1) return names[0]
  if (names.length === 2) return `${names[0]} and ${names[1]}`
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`
}

export function composeBrief(s: BriefStats, health?: EngineHealth, now: Date = new Date()): string {
  const parts: string[] = []
  // A stuck cron or dead boards must override the narrative — otherwise a quiet
  // brief reads as "all good" during an outage. Lead with the warning.
  const warning = healthWarning(health, now)
  const lead = warning ? `${warning} ` : ''

  if (s.scanned === 0 && s.applied.length === 0 && s.held.length === 0 && s.retired === 0) {
    const tail =
      s.decisions > 0
        ? `but ${s.decisions === 1 ? 'one item is' : `${s.decisions} items are`} still waiting on your call below.`
        : 'Nothing needs you — see you after the next scan at 8:00am or 4:00pm.'
    return `${lead}Quiet since you left${s.sinceLabel ? ` (${s.sinceLabel} ago)` : ''} — nothing new came in. ${tail}`
  }

  if (s.scanned > 0) parts.push(`scanned ${s.scanned} opening${s.scanned === 1 ? '' : 's'}`)
  if (s.applied.length > 0) parts.push(`applied to ${joinNames(s.applied)} on your behalf`)
  if (s.held.length > 0)
    parts.push(
      `held ${s.held.length === 1 ? joinNames(s.held) : `${s.held.length} roles`} for your call`,
    )
  if (s.retired > 0) parts.push(`retired ${s.retired} dead listing${s.retired === 1 ? '' : 's'}`)

  const did =
    parts.length === 1
      ? parts[0]
      : `${parts.slice(0, -1).join(', ')}, and ${parts[parts.length - 1]}`

  const tail =
    s.decisions === 0
      ? ' Nothing needs you right now.'
      : s.decisions === 1
        ? ' One decision needs 30 seconds of your judgment.'
        : ` ${s.decisions} decisions need a minute of your judgment.`

  return `${lead}While you were away I ${did}.${tail}`
}

/** Gather window stats from the events table since `anchor` (ISO timestamp). */
export async function briefStatsSince(anchor: string | null, decisions: number): Promise<BriefStats> {
  if (!anchor) {
    return { sinceLabel: '', scanned: 0, applied: [], held: [], retired: 0, decisions }
  }
  const rows = await sql`
    select e.kind, r.company, (e.detail->>'fit')::int as fit
    from events e
    left join roles r on r.id = e.role_id
    where e.created_at > ${anchor}
      and e.kind in ('scored', 'applied', 'awaiting_approval', 'job_not_found')
  `
  const stats: BriefStats = { sinceLabel: '', scanned: 0, applied: [], held: [], retired: 0, decisions }
  for (const row of rows as Array<{ kind: string; company: string | null; fit: number | null }>) {
    if (row.kind === 'scored') stats.scanned += 1
    else if (row.kind === 'applied') stats.applied.push({ company: row.company ?? 'a role' })
    else if (row.kind === 'awaiting_approval')
      stats.held.push({ company: row.company ?? 'a role', fit: row.fit })
    else if (row.kind === 'job_not_found') stats.retired += 1
  }
  return stats
}
