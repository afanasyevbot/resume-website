import { NextResponse } from 'next/server'
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
