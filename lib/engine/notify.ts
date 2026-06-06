/**
 * Slack notifications (one-way: engine → Matthew).
 *
 * Best-effort and env-gated: if SLACK_WEBHOOK_URL is unset (local/tests) this
 * is a no-op, and a Slack failure NEVER breaks the engine — notifications are
 * not allowed to take down an application run.
 */
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL

export async function notifySlack(text: string): Promise<void> {
  if (!SLACK_WEBHOOK_URL) return
  try {
    await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, mrkdwn: true }),
    })
  } catch {
    // swallow — notifications are best-effort
  }
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
