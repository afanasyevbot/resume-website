import { NextResponse } from 'next/server'
import { verifySlackSignature } from '@/lib/engine/slack/verify'

export const runtime = 'nodejs'

/**
 * Slack Event Subscriptions callback. Receives:
 *  - url_verification: one-time handshake when the Request URL is set.
 *  - event_callback: message events (a reply in #job-engine answering a question).
 *
 * Every request is signature-verified. We ack within Slack's 3s window; the
 * actual answer-handling + resubmit happens in Phase C (backgrounded).
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

  let body: { type?: string; challenge?: string; event?: Record<string, unknown> }
  try {
    body = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'bad json' }, { status: 400 })
  }

  // Handshake when configuring the Request URL.
  if (body.type === 'url_verification') {
    return NextResponse.json({ challenge: body.challenge })
  }

  // event_callback → message replies. Wired in Phase C.
  // Ack immediately so Slack doesn't retry.
  return NextResponse.json({ ok: true })
}
