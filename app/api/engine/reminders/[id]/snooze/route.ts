import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifySessionToken, SESSION_COOKIE } from '@/lib/engine/auth'
import { snoozeReminder } from '@/lib/engine/reminders'

export const runtime = 'nodejs'

const ALLOWED_DAYS = new Set([1, 3, 7])

/**
 * POST /api/engine/reminders/:id/snooze
 * Body: { days: 1 | 3 | 7 }
 * Pushes snoozed_until forward by the requested number of days.
 */
export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  if (!(await verifySessionToken(token))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const { id } = await ctx.params
  const reminderId = Number(id)
  if (!Number.isFinite(reminderId) || Number.isNaN(reminderId) || reminderId <= 0) {
    return NextResponse.json({ error: 'Invalid reminder id' }, { status: 400 })
  }

  const body = await req.json().catch(() => null)
  const days =
    body && typeof (body as { days?: unknown }).days === 'number'
      ? (body as { days: number }).days
      : null
  if (days === null || !ALLOWED_DAYS.has(days)) {
    return NextResponse.json({ error: 'days must be 1, 3, or 7' }, { status: 400 })
  }

  await snoozeReminder(reminderId, days)
  return NextResponse.json({ ok: true })
}
