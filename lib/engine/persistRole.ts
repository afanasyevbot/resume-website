import { sql } from './db'
import { cleanJdText } from './cleanJd'
import type { MatchResult, RouteDecision } from './types'

export interface PersistableRole {
  company: string
  title: string
  jobDescription: string
  url?: string | null
  location?: string | null
  source?: string | null // 'manual' | 'ats' | 'email' | 'research'
}

export interface PersistedRole {
  id: number
  status: string
}

/** Pure: how the route maps to a stored status. Tailoring slice will introduce 'tailored'. */
export function statusFromRoute(route: RouteDecision): string {
  return route === 'discard' ? 'discarded' : 'scored'
}

/**
 * Insert a scored role plus its lifecycle events (sourced, scored).
 * Pure of HTTP concerns — accepts the role input and the matcher result.
 */
export async function persistScoredRole(
  role: PersistableRole,
  result: MatchResult,
): Promise<PersistedRole> {
  const status = statusFromRoute(result.route)
  const source = role.source ?? 'manual'
  const cleanedJd = cleanJdText(role.jobDescription)

  // Single CTE statement: role + events insert as one atomic SQL statement.
  // Postgres treats a single statement as an implicit transaction, so either
  // both inserts succeed or neither does — no orphan roles without events.
  const rows = await sql`
    with new_role as (
      insert into roles
        (company, title, url, location, jd_text, jd_summary, source,
         fit_score, fit_reasons, segment, ai_native, route, status)
      values
        (${role.company}, ${role.title}, ${role.url ?? null}, ${role.location ?? null},
         ${cleanedJd}, ${result.summary ?? null}, ${source},
         ${result.score}, ${JSON.stringify(result.reasons)}::jsonb,
         ${result.segment}, ${result.aiNative}, ${result.route}, ${status})
      returning id
    ),
    sourced_event as (
      insert into events (role_id, kind, detail)
      select id, 'sourced', ${JSON.stringify({ source })}::jsonb from new_role
    ),
    scored_event as (
      insert into events (role_id, kind, detail)
      select id, 'scored',
             ${JSON.stringify({ score: result.score, route: result.route })}::jsonb
      from new_role
    )
    select id from new_role
  `
  const id = Number((rows[0] as { id: number }).id)

  return { id, status }
}
