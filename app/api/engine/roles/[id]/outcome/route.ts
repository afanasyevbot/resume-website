import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { sql } from '@/lib/engine/db'
import { canLogOutcome, OUTCOME_STATUSES } from '@/lib/engine/statusTypes'
import { verifySessionToken, SESSION_COOKIE } from '@/lib/engine/auth'

export const runtime = 'nodejs'

/**
 * POST /api/engine/roles/[id]/outcome — log what happened after applying.
 * Body: { outcome: 'responded' | 'interviewing' | 'offer' | 'rejected' }
 *
 * Writes the status transition + an event, which makes the Responses KPI and
 * the 7-day deltas real for the first time (they were counted but never fed).
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!(await verifySessionToken(token))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { id: idRaw } = await params
  const roleId = Number(idRaw)
  if (!Number.isInteger(roleId) || roleId <= 0) {
    return NextResponse.json({ error: 'bad role id' }, { status: 400 })
  }
  const body = (await req.json().catch(() => ({}))) as { outcome?: string }
  const outcome = body.outcome ?? ''
  if (!(OUTCOME_STATUSES as readonly string[]).includes(outcome)) {
    return NextResponse.json(
      { error: `outcome must be one of: ${OUTCOME_STATUSES.join(', ')}` },
      { status: 400 },
    )
  }

  const rows = await sql`select status from roles where id = ${roleId}`
  const current = (rows as Array<{ status: string }>)[0]?.status
  if (!current) return NextResponse.json({ error: 'role not found' }, { status: 404 })
  if (!canLogOutcome(current, outcome)) {
    return NextResponse.json(
      { error: `cannot log an outcome from status '${current}' — apply first` },
      { status: 409 },
    )
  }

  const detail = JSON.stringify({ from: current, method: 'dashboard' })
  await sql`update roles set status = ${outcome}, updated_at = now() where id = ${roleId}`
  await sql`insert into events (role_id, kind, detail) values (${roleId}, ${outcome}, ${detail}::jsonb)`

  return NextResponse.json({ ok: true, status: outcome })
}
