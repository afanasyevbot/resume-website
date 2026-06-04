import { sql } from './db'

export interface RoleRow {
  id: number
  company: string
  title: string
  fit_score: number | null
  route: string | null
  status: string
  created_at: string
}

/** Most recent roles for the dashboard. */
export async function listRoles(limit = 50): Promise<RoleRow[]> {
  const rows = await sql`
    select id, company, title, fit_score, route, status, created_at
    from roles
    order by created_at desc
    limit ${limit}
  `
  return rows as RoleRow[]
}
