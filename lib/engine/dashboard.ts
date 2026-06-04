import { sql } from './db'

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

export interface RoleRow {
  id: number
  company: string
  title: string
  location: string | null
  fit_score: number | null
  segment: string | null
  ai_native: boolean | null
  route: string | null
  status: string
  created_at: string
}

export interface DashboardData {
  counts: KpiCounts
  deltas: KpiDeltas
  queue: RoleRow[]
  activity: ActivityEvent[]
}

export async function getCounts(): Promise<KpiCounts> {
  const r = await sql`
    select
      count(*) filter (where status != 'discarded') as sourced,
      count(*) filter (where route = 'tailor' and status in ('scored','tailored','queued')) as in_queue,
      count(*) filter (where status = 'applied') as applied,
      count(*) filter (where status in ('responded','interviewing','offer','rejected')) as responded
    from roles
  `
  const d = await sql`
    select count(*) as n from application_packages where outreach_draft is not null and status = 'draft'
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
  const rows = await sql`
    select id, company, title, location, fit_score, segment, ai_native, route, status, created_at
    from roles
    where status != 'discarded'
    order by
      case route when 'tailor' then 1 when 'flag' then 2 else 3 end,
      fit_score desc nulls last,
      created_at desc
    limit ${limit}
  `
  return rows as RoleRow[]
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
  const [counts, deltas, queue, activity] = await Promise.all([
    getCounts(),
    getDeltas(),
    listQueue(),
    listActivity(),
  ])
  return { counts, deltas, queue, activity }
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
