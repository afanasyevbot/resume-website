import { NextResponse } from 'next/server'
import { verifySlackSignature } from '@/lib/engine/slack/verify'

export const runtime = 'nodejs'

/**
 * Slack Interactivity callback. Receives button clicks ([Approve]/[Skip]) as
 * application/x-www-form-urlencoded with a `payload` field holding JSON.
 *
 * Signature-verified. We ack within 3s; the real submit (which can take ~30s via
 * the browser agent) runs backgrounded in Phase C, then edits the message.
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
  let payload: { type?: string; actions?: Array<{ action_id?: string; value?: string }>; response_url?: string }
  try {
    payload = JSON.parse(params.get('payload') ?? '{}')
  } catch {
    return NextResponse.json({ error: 'bad payload' }, { status: 400 })
  }

  // block_actions → approve/skip. Wired in Phase C. Ack immediately.
  void payload
  return NextResponse.json({ ok: true })
}
