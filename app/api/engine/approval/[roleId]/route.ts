import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { sql } from '@/lib/engine/db'
import { hasBudget } from '@/lib/engine/costGuard'
import { loadRoleForApply, submitAndPersist } from '@/lib/engine/submitRole'
import { updateSlackMessage } from '@/lib/engine/slack/client'
import { verifySessionToken, SESSION_COOKIE } from '@/lib/engine/auth'

export const runtime = 'nodejs'
// Browser submits are slow; same ceiling as the Slack interactions route.
export const maxDuration = 300

/**
 * POST /api/engine/approval/[roleId] — dashboard approve/skip for roles parked
 * in 'awaiting_approval'. Body: { action: 'approve' | 'skip' }
 *
 * Mirrors the Slack interactions route's idempotency: the pending row is
 * claimed with an atomic UPDATE..WHERE status='pending', so a double-click or
 * a racing Slack click can't trigger a second submit — exactly one channel
 * wins. Roles with NO pending row (e.g. the Slack post failed) are still
 * rescuable via an atomic status claim, which makes the dashboard a true
 * recovery path rather than a mirror of Slack.
 */
export async function POST(req: Request, { params }: { params: Promise<{ roleId: string }> }) {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!(await verifySessionToken(token))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { roleId: roleIdRaw } = await params
  const roleId = Number(roleIdRaw)
  if (!Number.isInteger(roleId) || roleId <= 0) {
    return NextResponse.json({ error: 'bad roleId' }, { status: 400 })
  }
  const body = (await req.json().catch(() => ({}))) as { action?: string }
  const action = body.action
  if (action !== 'approve' && action !== 'skip') {
    return NextResponse.json({ error: "action must be 'approve' or 'skip'" }, { status: 400 })
  }

  // Claim the pending approval (if Slack got one) — only one click wins.
  const claimed = await sql`
    update slack_pending set status = 'done', resolved_at = now()
    where role_id = ${roleId} and kind = 'approval' and status = 'pending'
    returning channel, message_ts
  `
  let channel: string | null = null
  let ts: string | null = null
  if ((claimed as unknown[]).length > 0) {
    const row = (claimed as Array<{ channel: string | null; message_ts: string | null }>)[0]
    channel = row.channel
    ts = row.message_ts
  } else {
    // Stranded-role fallback: no pending row (Slack post failed or was already
    // resolved). Atomically claim via the status itself so a racing request
    // can't double-handle.
    const stranded = await sql`
      update roles set updated_at = now()
      where id = ${roleId} and status = 'awaiting_approval'
      returning id
    `
    if ((stranded as unknown[]).length === 0) {
      return NextResponse.json({ error: 'already handled' }, { status: 409 })
    }
  }

  if (action === 'skip') {
    await sql`update roles set status = 'archived', updated_at = now() where id = ${roleId}`
    await sql`insert into events (role_id, kind, detail) values (${roleId}, 'approval_skipped', ${JSON.stringify({ method: 'dashboard' })}::jsonb)`
    if (channel && ts) await updateSlackMessage(channel, ts, '✗ Skipped from dashboard — not applying.')
    return NextResponse.json({ ok: true, outcome: 'skipped' })
  }

  // Approve → submit now (the dashboard shows a spinner while this runs).
  if (!(await hasBudget())) {
    return NextResponse.json({ error: 'Monthly spend cap reached.' }, { status: 429 })
  }
  const role = await loadRoleForApply(roleId)
  if (!role) {
    return NextResponse.json({ error: 'Could not load the role to submit.' }, { status: 404 })
  }
  const r = await submitAndPersist(role, { method: 'dashboard-approved', askOnSlack: true })

  if (channel && ts) {
    const text =
      r.outcome === 'applied'
        ? `✅ Approved from dashboard — applied to ${r.company}.`
        : `⚠️ Approved from dashboard — ${r.company}: ${r.reason ?? r.outcome}.`
    await updateSlackMessage(channel, ts, text)
  }

  return NextResponse.json({
    ok: true,
    outcome: r.outcome,
    reason: r.reason,
    company: r.company,
    title: r.title,
    unanswered: r.unanswered,
  })
}
