import { NextResponse, after } from 'next/server'
import { verifySlackSignature } from '@/lib/engine/slack/verify'
import { sql } from '@/lib/engine/db'
import { loadRoleForApply, submitAndPersist } from '@/lib/engine/submitRole'
import { updateSlackMessage } from '@/lib/engine/slack/client'

export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * Slack Interactivity callback — [✅ Approve] / [✗ Skip] buttons.
 *
 * Idempotency (per the security review): the pending action is claimed with an
 * atomic UPDATE..WHERE status='pending'. A replayed click finds it already
 * 'done' and does nothing — so a captured request can't trigger a second submit
 * inside Slack's 5-minute signature window. We ack within 3s and run the ~30s
 * submit in the background via after().
 */
export async function POST(req: Request) {
  const rawBody = await req.text()
  const signingSecret = process.env.SLACK_SIGNING_SECRET ?? ''
  const ok = verifySlackSignature({
    signingSecret,
    rawBody,
    timestamp: req.headers.get('x-slack-request-timestamp'),
    signature: req.headers.get('x-slack-signature'),
  })
  if (!ok) return NextResponse.json({ error: 'bad signature' }, { status: 401 })

  const params = new URLSearchParams(rawBody)
  let payload: { actions?: Array<{ action_id?: string; value?: string }> }
  try {
    payload = JSON.parse(params.get('payload') ?? '{}')
  } catch {
    return NextResponse.json({ error: 'bad payload' }, { status: 400 })
  }

  const action = payload.actions?.[0]
  if (!action || !action.value) return NextResponse.json({ ok: true })
  const pendingId = Number(action.value)
  const isApprove = action.action_id === 'approve_apply'

  // Atomically claim — only one click wins, replays no-op.
  const claimed = await sql`
    update slack_pending set status = 'done', resolved_at = now()
    where id = ${pendingId} and kind = 'approval' and status = 'pending'
    returning role_id, channel, message_ts
  `
  const row = (claimed as Array<{ role_id: number; channel: string | null; message_ts: string | null }>)[0]
  if (!row) {
    // Already handled (or unknown) — safe no-op.
    return NextResponse.json({ ok: true })
  }
  const roleId = Number(row.role_id)
  const channel = row.channel
  const ts = row.message_ts

  if (!isApprove) {
    await sql`update roles set status = 'archived', updated_at = now() where id = ${roleId}`
    if (channel && ts) await updateSlackMessage(channel, ts, '✗ Skipped — not applying.')
    return NextResponse.json({ ok: true })
  }

  // Approve → submit in the background, then edit the message with the result.
  after(async () => {
    let text: string
    const role = await loadRoleForApply(roleId)
    if (!role) {
      text = '⚠️ Could not load the role to submit (it may have changed).'
    } else {
      const r = await submitAndPersist(role, { method: 'auto-approved', askOnSlack: true })
      text =
        r.outcome === 'applied'
          ? `✅ Applied to ${r.company} — ${r.title}.`
          : r.outcome === 'needs_review'
            ? `⚠️ ${r.company}: ${r.reason ?? 'needs review'} — see the dashboard.`
            : `⚠️ ${r.company}: ${r.reason ?? 'could not submit'}.`
    }
    if (channel && ts) await updateSlackMessage(channel, ts, text)
  })

  if (channel && ts) await updateSlackMessage(channel, ts, '⏳ Approved — submitting…')
  return NextResponse.json({ ok: true })
}
