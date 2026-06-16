import { sql } from './db'
import { listDueReminders, type Reminder } from './reminders'
import { loadCronHealth, type EngineHealth } from './health'
import { applyMethodBucket, type ApplyBucket } from './applyMethod'

export interface KpiCounts {
  sourced: number
  inQueue: number
  applied: number
  /** The `applied` total split by how it was submitted (autonomous / approved / self). */
  appliedBreakdown: Record<ApplyBucket, number>
  responded: number
  draftsToSend: number
}

export interface KpiDeltas {
  sourced7d: number
  applied7d: number
  responded7d: number
}

export interface ActivityEvent {
  id: number
  kind: string
  company: string | null
  role_id: number | null
  detail: Record<string, unknown> | null
  created_at: string
}

import type { TailoredPackage } from './tailorTypes'

export interface RoleRow {
  id: number
  company: string
  title: string
  location: string | null
  url: string | null
  source: string | null
  fit_score: number | null
  /** Matcher's stored reasons for the score (jsonb array of strings). */
  fit_reasons: unknown[] | null
  segment: string | null
  ai_native: boolean | null
  route: string | null
  status: string
  created_at: string
  /** Latest tailored package for this role, if any. */
  package_json: TailoredPackage | null
  /** application_packages.id for the latest package — needed for DOCX downloads. */
  package_id: number | null
  /** Latest thumbs-up (1) / thumbs-down (-1) rating from the 'rated' events stream. */
  user_rating: 1 | -1 | null
  /** Short AI-generated summary of the role (2-3 sentences). */
  jd_summary: string | null
  /** Raw method from the latest 'applied' event (null if not applied). Bucket it
   *  with applyMethodBucket() for the auto-vs-manual badge. */
  apply_method: string | null
}

export interface DashboardData {
  counts: KpiCounts
  deltas: KpiDeltas
  queue: RoleRow[]
  activity: ActivityEvent[]
  reminders: Reminder[]
  /** Cron heartbeat — is each scheduled job still running? */
  health: EngineHealth
}

export async function getCounts(): Promise<KpiCounts> {
  const r = await sql`
    select
      count(*) filter (where status not in ('discarded', 'archived')) as sourced,
      count(*) filter (where route in ('tailor','flag') and status in ('scored','tailored','queued','needs_review','awaiting_approval')) as in_queue,
      count(*) filter (where status = 'applied') as applied,
      count(*) filter (where status in ('responded','interviewing','offer','rejected')) as responded
    from roles
  `
  const d = await sql`
    select count(*) as n
    from application_packages p
    join roles r on r.id = p.role_id
    where p.outreach_draft is not null
      and p.status = 'draft'
      and r.status not in ('archived', 'discarded')
  `
  // Split the applied total by submission method. Each applied role's method is
  // on its latest 'applied' event; bucket it in JS so the labels stay in one
  // place (applyMethod.ts). Same `status = 'applied'` filter as the total above,
  // so the three buckets always sum to `applied`.
  const b = await sql`
    select coalesce(ae.method, 'unknown') as method, count(*)::int as n
    from roles r
    left join lateral (
      select detail->>'method' as method
      from events
      where role_id = r.id and kind = 'applied'
      order by created_at desc
      limit 1
    ) ae on true
    where r.status = 'applied'
    group by coalesce(ae.method, 'unknown')
  `
  const appliedBreakdown: Record<ApplyBucket, number> = { autonomous: 0, approved: 0, self: 0, unknown: 0 }
  for (const m of b as Array<{ method: string; n: number }>) {
    appliedBreakdown[applyMethodBucket(m.method)] += Number(m.n)
  }

  const row = r[0] as Record<string, string | number>
  const dr = d[0] as Record<string, string | number>
  return {
    sourced: Number(row.sourced ?? 0),
    inQueue: Number(row.in_queue ?? 0),
    applied: Number(row.applied ?? 0),
    appliedBreakdown,
    responded: Number(row.responded ?? 0),
    draftsToSend: Number(dr.n ?? 0),
  }
}

export async function getDeltas(): Promise<KpiDeltas> {
  const r = await sql`
    select
      count(*) filter (where kind = 'sourced' and created_at > now() - interval '7 days') as sourced_7d,
      count(*) filter (where kind = 'applied' and created_at > now() - interval '7 days') as applied_7d,
      count(*) filter (where kind = 'responded' and created_at > now() - interval '7 days') as responded_7d
    from events
  `
  const row = r[0] as Record<string, string | number>
  return {
    sourced7d: Number(row.sourced_7d ?? 0),
    applied7d: Number(row.applied_7d ?? 0),
    responded7d: Number(row.responded_7d ?? 0),
  }
}

export async function listQueue(limit = 200): Promise<RoleRow[]> {
  // LEFT JOIN LATERAL grabs the most-recent application_package and the
  // most-recent 'rated' event per role (both optional, so left-join).
  const rows = await sql`
    select
      r.id, r.company, r.title, r.location, r.url, r.source, r.fit_score, r.fit_reasons, r.segment,
      r.ai_native, r.route, r.status, r.created_at, r.jd_summary,
      p.package_json, p.id as package_id,
      fb.rating as user_rating,
      am.method as apply_method
    from roles r
    left join lateral (
      select id, package_json
      from application_packages
      where role_id = r.id
      order by created_at desc
      limit 1
    ) p on true
    left join lateral (
      select (detail->>'rating')::int as rating
      from events
      where role_id = r.id and kind = 'rated'
      order by created_at desc
      limit 1
    ) fb on true
    left join lateral (
      select detail->>'method' as method
      from events
      where role_id = r.id and kind = 'applied'
      order by created_at desc
      limit 1
    ) am on true
    where r.status not in ('discarded', 'archived')
    order by
      case r.route when 'tailor' then 1 when 'flag' then 2 else 3 end,
      r.fit_score desc nulls last,
      r.created_at desc
    limit ${limit}
  `
  // Neon HTTP returns Postgres BIGINT as string. Coerce to number so the
  // RoleRow TypeScript type matches runtime and the client-side routes
  // (apply/tailor/feedback) get a real number to validate. user_rating
  // comes back as an int already but normalize the null/coercion path.
  return (rows as Array<
    RoleRow & {
      id: string | number
      package_id: string | number | null
      user_rating: string | number | null
    }
  >).map((r) => {
    const rawRating = r.user_rating == null ? null : Number(r.user_rating)
    const rating: 1 | -1 | null = rawRating === 1 ? 1 : rawRating === -1 ? -1 : null
    return {
      ...r,
      id: Number(r.id),
      package_id: r.package_id == null ? null : Number(r.package_id),
      user_rating: rating,
    }
  }) as RoleRow[]
}

export async function listActivity(limit = 20): Promise<ActivityEvent[]> {
  const rows = await sql`
    select e.id, e.kind, e.role_id, r.company as company, e.detail, e.created_at
    from events e
    left join roles r on r.id = e.role_id
    order by e.created_at desc
    limit ${limit}
  `
  return (rows as Array<ActivityEvent & { role_id: string | number | null }>).map((r) => ({
    ...r,
    role_id: r.role_id == null ? null : Number(r.role_id),
  })) as ActivityEvent[]
}

/** Benign health snapshot when the heartbeat query itself fails — the feature
 *  added to surface outages must not become a way to blank the whole dashboard. */
const EMPTY_HEALTH: EngineHealth = { crons: [], needsAttention: false, failedCompanies: [] }

export async function loadDashboard(opts: { withHealth?: boolean } = {}): Promise<DashboardData> {
  // Only the front page renders HealthLine; pages that don't (e.g. /engine/roles)
  // skip the heartbeat query instead of paying for an events scan they discard.
  const withHealth = opts.withHealth ?? true
  const [counts, deltas, queue, activity, reminders, health] = await Promise.all([
    getCounts(),
    getDeltas(),
    listQueue(),
    listActivity(),
    listDueReminders(),
    // Isolated: a failing heartbeat query degrades to "no health shown", never
    // takes down counts/queue/activity/reminders with it.
    withHealth ? loadCronHealth().catch(() => EMPTY_HEALTH) : Promise.resolve(EMPTY_HEALTH),
  ])
  return { counts, deltas, queue, activity, reminders, health }
}

/** Compact "2m / 3h / 1d / Jun 4" relative time. PURE — testable. */
export function timeAgo(input: string | Date, now: Date = new Date()): string {
  const t = typeof input === 'string' ? new Date(input) : input
  const sec = Math.max(0, Math.floor((now.getTime() - t.getTime()) / 1000))
  if (sec < 60) return 'just now'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h`
  const day = Math.floor(hr / 24)
  if (day < 7) return `${day}d`
  return t.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
