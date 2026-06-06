import { sql } from './db'
import type { RoleRow } from './dashboard'
import type { TailoredPackage } from './tailorTypes'

/**
 * Full role record for the /engine/roles/[id] drilldown page.
 *
 * Extends RoleRow with the rich fields the dashboard cards omit:
 *  - jd_text         the original job description text
 *  - fit_reasons     the matcher's bulleted reasoning
 *  - events          the full chronological event log for this role
 *  - package_status  the application_packages.status (e.g. 'draft', 'sent')
 */
export interface RoleEvent {
  id: number
  kind: string
  detail: Record<string, unknown> | null
  created_at: string
}

export interface RoleDetail extends RoleRow {
  jd_text: string | null
  fit_reasons: string[]
  events: RoleEvent[]
  /** application_packages.status for the latest package, if any. */
  package_status: string | null
  /** Latest user rating: 1 (thumbs up) or -1 (thumbs down). Null when never rated. */
  user_rating: 1 | -1 | null
}

interface RoleRowRaw {
  id: string | number
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
  jd_text: string | null
  fit_reasons: unknown
  package_json: TailoredPackage | null
  package_id: string | number | null
  package_status: string | null
}

interface EventRowRaw {
  id: string | number
  kind: string
  detail: Record<string, unknown> | null
  created_at: string
}

/** Coerce whatever the DB returns for fit_reasons into a string[]. */
function coerceFitReasons(input: unknown): string[] {
  if (Array.isArray(input)) {
    return input.filter((x): x is string => typeof x === 'string')
  }
  if (typeof input === 'string') {
    // Some Postgres clients return jsonb as a string — try to parse.
    try {
      const parsed = JSON.parse(input)
      if (Array.isArray(parsed)) {
        return parsed.filter((x): x is string => typeof x === 'string')
      }
    } catch {
      // not JSON — fall through
    }
  }
  return []
}

/**
 * Load one role with its latest application_package and every event,
 * chronologically ascending. Returns null when no role with that id exists
 * (or it's discarded — we exclude discarded the same way the queue does).
 */
export async function loadRoleDetail(id: number): Promise<RoleDetail | null> {
  if (!Number.isFinite(id) || id <= 0) return null

  const roleRows = await sql`
    select
      r.id, r.company, r.title, r.location, r.url, r.source, r.fit_score,
      r.segment, r.ai_native, r.route, r.status, r.created_at,
      r.jd_text, r.fit_reasons,
      p.id as package_id, p.package_json, p.status as package_status
    from roles r
    left join lateral (
      select id, package_json, status
      from application_packages
      where role_id = r.id
      order by created_at desc
      limit 1
    ) p on true
    where r.id = ${id}
    limit 1
  `
  const row = (roleRows as RoleRowRaw[])[0]
  if (!row) return null

  const eventRows = await sql`
    select id, kind, detail, created_at
    from events
    where role_id = ${id}
    order by created_at asc, id asc
  `
  const events = (eventRows as EventRowRaw[]).map((e) => ({
    id: Number(e.id),
    kind: e.kind,
    detail: e.detail,
    created_at: e.created_at,
  }))

  // Latest 'rated' event wins — events are sorted ascending, so walk from the end.
  let userRating: 1 | -1 | null = null
  for (let i = events.length - 1; i >= 0; i--) {
    const e = events[i]
    if (e.kind !== 'rated') continue
    const raw = e.detail && typeof e.detail === 'object' ? (e.detail as { rating?: unknown }).rating : null
    const n = typeof raw === 'number' ? raw : typeof raw === 'string' ? Number(raw) : NaN
    if (n === 1 || n === -1) {
      userRating = n
      break
    }
  }

  return {
    id: Number(row.id),
    company: row.company,
    title: row.title,
    location: row.location,
    url: row.url,
    source: row.source,
    fit_score: row.fit_score,
    segment: row.segment,
    ai_native: row.ai_native,
    route: row.route,
    status: row.status,
    created_at: row.created_at,
    package_json: row.package_json,
    package_id: row.package_id == null ? null : Number(row.package_id),
    user_rating: userRating,
    jd_text: row.jd_text,
    fit_reasons: coerceFitReasons(row.fit_reasons),
    events,
    package_status: row.package_status,
  }
}
