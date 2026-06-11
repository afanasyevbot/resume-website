import { NextResponse, after } from 'next/server'
import { verifySlackSignature } from '@/lib/engine/slack/verify'
import { sql } from '@/lib/engine/db'
import { loadRoleForApply, submitAndPersist } from '@/lib/engine/submitRole'
import { postSlackMessage } from '@/lib/engine/slack/client'
import { answerQuestion } from '@/lib/engine/slack/ask'
import Anthropic from '@anthropic-ai/sdk'
import { anthropicKey } from '@/lib/env'

export const runtime = 'nodejs'
export const maxDuration = 300

const CHANNEL_ID = process.env.SLACK_CHANNEL_ID

/**
 * Use Claude (Haiku) to extract per-question answers from a natural language reply.
 * Returns a Record<questionLabel, answer>. Questions with no match are omitted.
 */
async function parseAnswers(questions: string[], reply: string): Promise<Record<string, string>> {
  if (questions.length === 1) {
    // Single question — reply IS the answer, no parsing needed.
    return { [questions[0]]: reply }
  }
  const numbered = questions.map((q, i) => `${i + 1}. ${q}`).join('\n')
  const prompt = `You are extracting answers from a natural language reply to job application screening questions.

Questions:
${numbered}

Reply: "${reply}"

Map each question to the most relevant extracted answer. Use the EXACT question text as the JSON key.
If no answer is found for a question, omit it. Return only valid JSON, nothing else.`

  try {
    const client = new Anthropic({ apiKey: anthropicKey() })
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    })
    const text = msg.content.filter((b) => b.type === 'text').map((b) => (b as { type: 'text'; text: string }).text).join('')
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) return {}
    return JSON.parse(match[0]) as Record<string, string>
  } catch {
    // Fallback: map the reply to the first question only.
    return { [questions[0]]: reply }
  }
}

/**
 * Slack Event Subscriptions callback.
 *  - url_verification: handshake when the Request URL is set.
 *  - event_callback: a plain user message in #job-engine = an answer to the
 *    most recent open question. We claim atomically (so Slack's retries can't
 *    double-process), ack within 3s, and resubmit in the background.
 *
 * The `question` column in slack_pending may be a JSON array of multiple
 * questions (new format) or a plain string (legacy single-question format).
 * Both are handled transparently.
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
    event?: { type?: string; text?: string; channel?: string; bot_id?: string; subtype?: string; user?: string; thread_ts?: string }
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
    const userText = e!.text!.trim()
    const threadTs = e!.thread_ts

    // Check if there's a pending question first — if so, this is an answer.
    const openQ = await sql`
      select id, role_id, question from slack_pending
      where kind = 'question' and status = 'pending'
        and (${threadTs ?? null}::text is null or message_ts = ${threadTs ?? null})
      order by created_at desc limit 1
    `
    const pending = (openQ as Array<{ id: number; role_id: number; question: string }>)[0]

    if (pending) {
      // Claim atomically so Slack retries can't double-process.
      const claimed = await sql`
        update slack_pending set status = 'done', resolved_at = now()
        where id = ${pending.id} and status = 'pending'
        returning role_id, question
      `
      const row = (claimed as Array<{ role_id: number; question: string }>)[0]
      if (row) {
        const roleId = Number(row.role_id)
        // Parse questions — new format is a JSON array, legacy is a plain string.
        let questions: string[]
        try {
          const parsed = JSON.parse(row.question)
          questions = Array.isArray(parsed) ? parsed : [row.question]
        } catch {
          questions = [row.question]
        }

        after(async () => {
          const role = await loadRoleForApply(roleId)
          if (!role) return

          // Use Claude to extract per-question answers from the natural language reply.
          const manualAnswers = await parseAnswers(questions, userText)

          const r = await submitAndPersist(role, {
            method: 'auto-answered',
            manualAnswers,
            askOnSlack: true,
          })

          const text =
            r.outcome === 'applied'
              ? `✅ Applied to ${r.company}.`
              : r.outcome === 'needs_review' && r.unanswered.length > 0
                ? `Got it. Still need a few more answers for ${r.company} — see above.`
                : r.outcome === 'needs_review'
                  ? `Submitted ${r.company} but couldn't confirm — check the dashboard.`
                  : `Couldn't submit ${r.company} — check the dashboard.`
          await postSlackMessage(text)
        })
      }
    } else {
      // No pending question — treat as a conversational query to the engine.
      after(async () => {
        await answerQuestion(userText)
      })
    }
  }

  // Always ack fast so Slack doesn't retry.
  return NextResponse.json({ ok: true })
}
