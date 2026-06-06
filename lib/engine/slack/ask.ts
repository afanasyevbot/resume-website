/**
 * Conversational Slack handler — answers ad-hoc questions about the engine
 * from Matthew in #job-engine.
 *
 * Flow: fetch a DB snapshot → Claude answers in one call → reply in channel.
 *
 * Deliberately simple: no multi-step reasoning, no agentic loops. Claude gets
 * the full snapshot and picks what's relevant. Cheap (~$0.002/message) and
 * fast (<3s). Best-effort: a failure replies with a short error, never crashes
 * the events route.
 */

import Anthropic from '@anthropic-ai/sdk'
import { anthropicKey } from '@/lib/env'
import { capCents } from '@/lib/engine/costGuard'
import { sql } from '@/lib/engine/db'
import { postSlackMessage } from './client'

// ── DB snapshot ──────────────────────────────────────────────────────────────

async function fetchSnapshot(): Promise<string> {
  const [roles, events, pending, spend, reminders] = await Promise.all([
    // Role pipeline counts
    sql`select status, count(*)::int as n from roles
        where status not in ('discarded','archived')
        group by status order by n desc`,

    // Recent activity (last 7 days)
    sql`select kind, count(*)::int as n from events
        where created_at > now() - interval '7 days'
        group by kind order by n desc`,

    // What's waiting for Matthew
    sql`select sp.kind, r.company, r.title, sp.question
        from slack_pending sp join roles r on r.id = sp.role_id
        where sp.status = 'pending'
        order by sp.created_at desc limit 10`,

    // Spend
    sql`select
          coalesce(sum(cost_cents),0)::int as month_cents,
          ${capCents()} as cap_cents
        from api_usage
        where created_at >= date_trunc('month', now())`,

    // Reminders due today or overdue (pending = not completed; respect snooze)
    sql`select r.company, r.title, rem.kind, rem.due_at
        from reminders rem join roles r on r.id = rem.role_id
        where rem.completed_at is null
          and coalesce(rem.snoozed_until, rem.due_at) <= now() + interval '24 hours'
        order by rem.due_at asc limit 10`,
  ])

  const sections: string[] = []

  // Pipeline
  if ((roles as unknown[]).length > 0) {
    const lines = (roles as Array<{ status: string; n: number }>)
      .map((r) => `  ${r.status}: ${r.n}`)
      .join('\n')
    sections.push(`PIPELINE:\n${lines}`)
  }

  // Events last 7d
  if ((events as unknown[]).length > 0) {
    const lines = (events as Array<{ kind: string; n: number }>)
      .map((e) => `  ${e.kind}: ${e.n}`)
      .join('\n')
    sections.push(`ACTIVITY (last 7 days):\n${lines}`)
  }

  // Pending actions
  if ((pending as unknown[]).length > 0) {
    const lines = (pending as Array<{ kind: string; company: string; title: string; question: string | null }>)
      .map((p) =>
        p.kind === 'question'
          ? `  awaiting answer: ${p.company} — "${p.question}"`
          : `  awaiting approval: ${p.company} — ${p.title}`,
      )
      .join('\n')
    sections.push(`WAITING ON YOU:\n${lines}`)
  } else {
    sections.push('WAITING ON YOU:\n  nothing pending')
  }

  // Spend
  const sp = (spend as Array<{ month_cents: number; cap_cents: number }>)[0]
  if (sp) {
    const pct = ((sp.month_cents / sp.cap_cents) * 100).toFixed(1)
    sections.push(`SPEND THIS MONTH: $${(sp.month_cents / 100).toFixed(2)} of $${(sp.cap_cents / 100).toFixed(0)} cap (${pct}% used)`)
  }

  // Reminders
  if ((reminders as unknown[]).length > 0) {
    const lines = (reminders as Array<{ company: string; title: string; kind: string; due_at: string }>)
      .map((r) => `  ${r.kind.replace(/_/g, ' ')}: ${r.company} (due ${new Date(r.due_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`)
      .join('\n')
    sections.push(`REMINDERS DUE:\n${lines}`)
  }

  return sections.join('\n\n')
}

// ── System prompt ─────────────────────────────────────────────────────────────

const SYSTEM = `You are the Job Engine, an autonomous AI job-application assistant built for Matthew Afanasiev — a sales professional and AI builder actively job-hunting. You run inside his Slack workspace (#job-engine channel).

Your job here is to answer ad-hoc questions about the engine's activity. You have a live snapshot of the database. Answer concisely and directly — this is Slack, not a report. Use plain text, no markdown headers, minimal emoji (one or two is fine). Keep answers under 200 words unless a list genuinely needs to be longer.

Rules:
- Answer from the snapshot only. If something isn't in the snapshot, say you don't have that data.
- Never speculate about future application outcomes.
- For "what's waiting on me" style questions: list the pending items clearly so Matthew can act.
- For status/rundown questions: give a quick summary (pipeline counts, recent applies, what's pending).
- Don't explain how the engine works unless asked.
- If you can't tell what Matthew is asking, say so and give him a quick list of things you can answer.`

// ── Main export ───────────────────────────────────────────────────────────────

export async function answerQuestion(question: string): Promise<void> {
  try {
    const snapshot = await fetchSnapshot()
    const client = new Anthropic({ apiKey: anthropicKey() })

    const msg = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 400,
      system: SYSTEM,
      messages: [
        {
          role: 'user',
          content: `Current engine snapshot:\n\n${snapshot}\n\nMatthew's question: ${question}`,
        },
      ],
    })

    const text = msg.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { type: 'text'; text: string }).text)
      .join('')
      .trim()

    await postSlackMessage(text || "Sorry, I couldn't generate a response.")
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    await postSlackMessage(`⚠️ Couldn't answer that right now: ${msg.slice(0, 120)}`)
  }
}
