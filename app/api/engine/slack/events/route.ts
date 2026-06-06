import { NextResponse, after } from 'next/server'
import { verifySlackSignature } from '@/lib/engine/slack/verify'
import { sql } from '@/lib/engine/db'
import { loadRoleForApply, submitAndPersist } from '@/lib/engine/submitRole'
import { postSlackMessage } from '@/lib/engine/slack/client'

export const runtime = 'nodejs'
export const maxDuration = 300

const CHANNEL_ID = process.env.SLACK_CHANNEL_ID

/**
 * Slack Event Subscriptions callback.
 *  - url_verification: handshake when the Request URL is set.
 *  - event_callback: a plain user message in #job-engine = an answer to the
 *    most recent open question. We claim that question atomically (so Slack's
 *    retries can't double-process), ack within 3s, and resubmit with the answer
 *    in the background.
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

  let body: {
    type?: string
    challenge?: string
    event?: { type?: string; text?: string; channel?: string; bot_id?: string; subtype?: string; user?: string }
  }
  try {
    body = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'bad json' }, { status: 400 })
  }

  if (body.type === 'url_verification') {
    return NextResponse.json({ challenge: body.challenge })
  }

  const e = body.event
  // Only plain human messages in our channel (ignore the bot's own posts, joins, edits).
  const isHumanReply =
    e?.type === 'message' && !e.bot_id && !e.subtype && !!e.text?.trim() && (!CHANNEL_ID || e.channel === CHANNEL_ID)

  if (isHumanReply) {
    const answer = e!.text!.trim()
    // Claim the most recent open question atomically (retries find it gone).
    const claimed = await sql`
      update slack_pending set status = 'done', resolved_at = now()
      where id = (select id from slack_pending where kind = 'question' and status = 'pending' order by created_at desc limit 1)
      returning role_id, question
    `
    const row = (claimed as Array<{ role_id: number; question: string }>)[0]
    if (row) {
      const roleId = Number(row.role_id)
      const question = row.question
      after(async () => {
        const role = await loadRoleForApply(roleId)
        if (!role) return
        const r = await submitAndPersist(role, {
          method: 'auto-answered',
          manualAnswers: { [question]: answer },
          askOnSlack: true,
        })
        const text =
          r.outcome === 'applied'
            ? `✅ Got it — applied to ${r.company} — ${r.title}.`
            : r.outcome === 'needs_review'
              ? `Thanks. ${r.company}: ${r.reason ?? 'still needs review'} (see dashboard).`
              : `Thanks. ${r.company}: ${r.reason ?? 'could not submit'}.`
        await postSlackMessage(text)
      })
    }
  }

  // Always ack fast so Slack doesn't retry.
  return NextResponse.json({ ok: true })
}
