import { NextResponse } from 'next/server'
import { sql, tx } from '@/lib/engine/db'

export const runtime = 'nodejs'

/**
 * POST /api/engine/apply
 * Body: { roleId: number, agent?: boolean }
 *
 * Marks the role as 'applied', stamps updated_at, and logs an event with
 * kind='applied' and detail.method describing how the application happened.
 * All three writes (status bump + event insert) commit together or roll back.
 *
 * Phase 1: agent=false (default) — Matthew clicks "Mark applied" after
 * submitting on the company site. Phase 2 will pass agent=true when an
 * automated apply flow runs.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  const roleId =
    body && typeof (body as { roleId?: unknown }).roleId === 'number'
      ? (body as { roleId: number }).roleId
      : null
  if (roleId === null) {
    return NextResponse.json({ error: 'roleId (number) required' }, { status: 400 })
  }
  const agent = !!(body && (body as { agent?: unknown }).agent === true)
  const method = agent ? 'one-click' : 'manual'

  // Ensure the role exists before we open the transaction. Avoids a phantom
  // "applied" event for a roleId that was never in the DB.
  const found = (await sql`select id from roles where id = ${roleId} limit 1`) as Array<{ id: number }>
  if (found.length === 0) {
    return NextResponse.json({ error: 'Role not found' }, { status: 404 })
  }

  const detail = JSON.stringify({ method })
  await tx((txn) => [
    txn`update roles set status = 'applied', updated_at = now() where id = ${roleId}`,
    txn`
      insert into events (role_id, kind, detail)
      values (${roleId}, 'applied', ${detail}::jsonb)
    `,
  ])

  return NextResponse.json({ ok: true, roleId, method })
}
