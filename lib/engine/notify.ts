/**
 * Slack notifications (one-way: engine → Matthew).
 *
 * Posts via the bot token (chat.postMessage) so it shares the same, verified
 * channel as the two-way flows — no dependency on the incoming webhook, which a
 * reinstall can rotate. Best-effort + env-gated: no-op without a bot token, and
 * a Slack failure NEVER breaks an application run.
 */
import { postSlackMessage } from './slack/client'

export async function notifySlack(text: string): Promise<void> {
  await postSlackMessage(text)
}

interface RecapRole {
  company: string
  title: string
  success: boolean
  needsReview: boolean
  reason: string | null
  unanswered?: string[]
}

const DASHBOARD_URL = 'https://matthew-afanasiev.vercel.app/engine'

/** Build the post-run recap message. Returns null when nothing happened
 *  (no applies, nothing needing review) so we don't post empty noise. */
export function buildAutoApplyRecap(
  results: RecapRole[],
  appliedToday: number,
  cap: number,
): string | null {
  const applied = results.filter((r) => r.success)
  const review = results.filter((r) => r.needsReview)
  if (applied.length === 0 && review.length === 0) return null

  const lines: string[] = [`🤖 *Auto-apply run* — ${applied.length} applied, ${review.length} need you  (${appliedToday}/${cap} today)`]

  if (applied.length > 0) {
    lines.push('')
    lines.push('*✅ Applied:*')
    for (const r of applied) lines.push(`  • ${r.company} — ${r.title}`)
  }

  if (review.length > 0) {
    lines.push('')
    lines.push('*⚠️ Needs you:*')
    for (const r of review) {
      if (r.unanswered && r.unanswered.length > 0) {
        lines.push(`  • ${r.company} — couldn't answer: ${r.unanswered.slice(0, 4).join(', ')}`)
      } else {
        lines.push(`  • ${r.company} — ${r.reason ?? 'needs review'}`)
      }
    }
  }

  lines.push('')
  lines.push(`👉 ${DASHBOARD_URL}`)
  return lines.join('\n')
}
