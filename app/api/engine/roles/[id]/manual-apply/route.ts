import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { sql } from '@/lib/engine/db'
import { verifySessionToken, SESSION_COOKIE } from '@/lib/engine/auth'

export const runtime = 'nodejs'

/**
 * POST /api/engine/roles/[id]/manual-apply
 *
 * Called from the Decision Deck when the engine couldn't auto-submit (unknown
 * ATS) and Matthew applies manually. Body: { action?: 'apply' | 'skip' }
 * Default action is 'apply'.
 *
 * 'apply' → needs_review → applied (method: 'manual')
 * 'skip'  → needs_review → archived
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

  const body = (await req.json().catch(() => ({}))) as { action?: string }
  const action = body.action ?? 'apply'
  if (action !== 'apply' && action !== 'skip') {
    return NextResponse.json({ error: "action must be 'apply' or 'skip'" }, { status: 400 })
  }

  const rows = await sql`select status from roles where id = ${roleId}`
  const current = (rows as Array<{ status: string }>)[0]?.status
  if (!current) return NextResponse.json({ error: 'role not found' }, { status: 404 })
  if (current !== 'needs_review') {
    return NextResponse.json({ error: `role is not in needs_review (is: ${current})` }, { status: 409 })
  }

  if (action === 'skip') {
    await sql`update roles set status = 'archived', updated_at = now() where id = ${roleId}`
    await sql`insert into events (role_id, kind, detail) values (${roleId}, 'approval_skipped', ${JSON.stringify({ method: 'manual-pass' })}::jsonb)`
    return NextResponse.json({ ok: true, outcome: 'skipped' })
  }

  // Mark applied — Matthew opened the URL and will complete the form
  await sql`update roles set status = 'applied', updated_at = now() where id = ${roleId}`
  await sql`insert into events (role_id, kind, detail) values (${roleId}, 'applied', ${JSON.stringify({ method: 'manual' })}::jsonb)`
  return NextResponse.json({ ok: true, outcome: 'applied' })
}
