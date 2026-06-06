import { sql } from './db'
import { listDueReminders, type Reminder } from './reminders'

export interface KpiCounts {
  sourced: number
  inQueue: number
  applied: number
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
}

export interface DashboardData {
  counts: KpiCounts
  deltas: KpiDeltas
  queue: RoleRow[]
  activity: ActivityEvent[]
  reminders: Reminder[]
}

export async function getCounts(): Promise<KpiCounts> {
  const r = await sql`
    select
      count(*) filter (where status not in ('discarded', 'archived')) as sourced,
      count(*) filter (where route = 'tailor' and status in ('scored','tailored','queued')) as in_queue,
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
  const row = r[0] as Record<string, string | number>
  const dr = d[0] as Record<string, string | number>
  return {
    sourced: Number(row.sourced ?? 0),
    inQueue: Number(row.in_queue ?? 0),
    applied: Number(row.applied ?? 0),
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

export async function listQueue(limit = 30): Promise<RoleRow[]> {
  // LEFT JOIN LATERAL grabs the most-recent application_package and the
  // most-recent 'rated' event per role (both optional, so left-join).
  const rows = await sql`
    select
      r.id, r.company, r.title, r.location, r.url, r.source, r.fit_score, r.segment,
      r.ai_native, r.route, r.status, r.created_at,
      p.package_json, p.id as package_id,
      fb.rating as user_rating
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
    select e.id, e.kind, r.company as company, e.detail, e.created_at
    from events e
    left join roles r on r.id = e.role_id
    order by e.created_at desc
    limit ${limit}
  `
  return rows as ActivityEvent[]
}

export async function loadDashboard(): Promise<DashboardData> {
  const [counts, deltas, queue, activity, reminders] = await Promise.all([
    getCounts(),
    getDeltas(),
    listQueue(),
    listActivity(),
    listDueReminders(),
  ])
  return { counts, deltas, queue, activity, reminders }
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
