import { NextResponse } from 'next/server'
import { completeReminder } from '@/lib/engine/reminders'

export const runtime = 'nodejs'

/**
 * POST /api/engine/reminders/:id/complete
 * Marks a reminder as done. No body required.
 */
export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params
  const reminderId = Number(id)
  if (!Number.isFinite(reminderId) || Number.isNaN(reminderId) || reminderId <= 0) {
    return NextResponse.json({ error: 'Invalid reminder id' }, { status: 400 })
  }
  await completeReminder(reminderId)
  return NextResponse.json({ ok: true })
}
