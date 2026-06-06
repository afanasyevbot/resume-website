import { NextResponse } from 'next/server'
import { sql } from '@/lib/engine/db'

export const runtime = 'nodejs'

/**
 * POST /api/engine/feedback
 * Body: { roleId: number, rating: 1 | -1 }
 *
 * Logs a thumbs-up (1) or thumbs-down (-1) rating against a role as an
 * append-only event. We never overwrite — listQueue picks the latest, so
 * Matthew can change his mind without losing history. Eval workflows read
 * these events later to compute matcher-vs-human agreement.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  const roleId =
    body && typeof (body as { roleId?: unknown }).roleId === 'number'
      ? (body as { roleId: number }).roleId
      : null
  const rating =
    body && typeof (body as { rating?: unknown }).rating === 'number'
      ? (body as { rating: number }).rating
      : null

  if (roleId === null) {
    return NextResponse.json({ error: 'roleId (number) required' }, { status: 400 })
  }
  if (rating !== 1 && rating !== -1) {
    return NextResponse.json({ error: 'rating must be 1 or -1' }, { status: 400 })
  }

  // Verify role exists — avoids phantom feedback events on nonexistent roles.
  const found = (await sql`select id from roles where id = ${roleId} limit 1`) as Array<{
    id: number
  }>
  if (found.length === 0) {
    return NextResponse.json({ error: 'Role not found' }, { status: 404 })
  }

  const detail = JSON.stringify({ rating })
  await sql`
    insert into events (role_id, kind, detail)
    values (${roleId}, 'rated', ${detail}::jsonb)
  `

  return NextResponse.json({ ok: true })
}
