import type { RoleRow } from './dashboard'
import type { Reminder } from './reminders'
import type { ApprovalItem, ManualApplyItem, FollowUpItem, DeckItem } from '@/components/engine/DecisionDeck'

/**
 * Assembles the Decision Deck from queue rows and due reminders.
 * Order: approvals (highest-value, engine is ready) → manual-apply (engine
 * tried + failed, Matthew's action needed) → follow-ups (lower urgency).
 */
export function buildDeck(queue: RoleRow[], reminders: Reminder[]): DeckItem[] {
  const approvals: ApprovalItem[] = queue
    .filter((r) => r.status === 'awaiting_approval')
    .map((r) => ({
      type: 'approval' as const,
      roleId: r.id,
      company: r.company,
      title: r.title,
      fit: r.fit_score,
      reason:
        Array.isArray(r.fit_reasons) && typeof r.fit_reasons[0] === 'string'
          ? (r.fit_reasons[0] as string)
          : null,
      summary: r.jd_summary,
    }))

  const manuals: ManualApplyItem[] = queue
    .filter((r) => r.status === 'needs_review')
    .map((r) => ({
      type: 'manual' as const,
      roleId: r.id,
      company: r.company,
      title: r.title,
      fit: r.fit_score,
      reason:
        Array.isArray(r.fit_reasons) && typeof r.fit_reasons[0] === 'string'
          ? (r.fit_reasons[0] as string)
          : null,
      url: r.url,
    }))

  const followUps: FollowUpItem[] = reminders.map((rem) => ({
    type: 'followup' as const,
    reminder: rem,
  }))

  return [...approvals, ...manuals, ...followUps]
}
