import { NextResponse } from 'next/server'
import { sql } from '@/lib/engine/db'
import { runFeedbackEval, type FeedbackEvalRow } from '@/lib/engine/eval/runFeedbackEval'

export const runtime = 'nodejs'

/**
 * GET /api/engine/eval
 *
 * Pulls every 'rated' event joined to its role, compares matcher fit_score
 * against Matthew's thumbs-up/down, and returns the aggregate report from
 * runFeedbackEval(). Auth is enforced upstream by proxy.ts (matcher covers
 * /api/engine/:path*).
 *
 * To avoid double-counting when a role has been rated multiple times, we keep
 * only the LATEST rating per role (DISTINCT ON), which mirrors what the
 * dashboard surfaces to the user.
 */
export async function GET() {
  const rows = (await sql`
    select distinct on (e.role_id)
      e.role_id,
      r.company,
      r.title,
      r.route,
      r.fit_score,
      (e.detail->>'rating')::int as rating,
      e.created_at
    from events e
    join roles r on r.id = e.role_id
    where e.kind = 'rated'
      and r.fit_score is not null
    order by e.role_id, e.created_at desc
  `) as Array<{
    role_id: string | number
    company: string
    title: string
    route: string | null
    fit_score: string | number
    rating: string | number
    created_at: string
  }>

  const evalRows: FeedbackEvalRow[] = []
  const items: Array<{
    roleId: number
    company: string
    title: string
    route: string | null
    matcherScore: number
    rating: 1 | -1
  }> = []

  for (const r of rows) {
    const rating = Number(r.rating)
    if (rating !== 1 && rating !== -1) continue
    const matcherScore = Number(r.fit_score)
    evalRows.push({ matcherScore, rating: rating as 1 | -1 })
    items.push({
      roleId: Number(r.role_id),
      company: r.company,
      title: r.title,
      route: r.route,
      matcherScore,
      rating: rating as 1 | -1,
    })
  }

  const report = runFeedbackEval(evalRows)
  return NextResponse.json({ report, items })
}
