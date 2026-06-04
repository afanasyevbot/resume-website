'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Reminder, ReminderKind } from '@/lib/engine/reminders'
import { linkedinSearchUrl } from '@/lib/engine/reminders'
import { avatarLetters, avatarTint } from './avatar'

/** Humanize the reminder kind for display. */
const KIND_LABELS: Record<ReminderKind, string> = {
  linkedin_follow_up: 'LinkedIn follow-up',
  linkedin_check_in: 'Check in',
  send_outreach: 'Send outreach',
}

/**
 * Compact due label.
 * - <24h in the future: "due today"
 * - >24h future: "in Xd" (gold)
 * - past: "overdue Xd" (amber)
 */
function dueLabel(
  due_at: string,
  now: Date = new Date(),
): { text: string; color: string } {
  const due = new Date(due_at).getTime()
  const diffMs = due - now.getTime()
  const ONE_DAY = 24 * 60 * 60 * 1000
  if (diffMs > 0 && diffMs < ONE_DAY) {
    return { text: 'due today', color: '#d4b278' }
  }
  if (diffMs >= ONE_DAY) {
    const days = Math.round(diffMs / ONE_DAY)
    return { text: `in ${days}d`, color: '#d4b278' }
  }
  const days = Math.max(1, Math.round(Math.abs(diffMs) / ONE_DAY))
  return { text: `overdue ${days}d`, color: '#b88940' }
}

interface ReminderItemProps {
  reminder: Reminder
}

export default function ReminderItem({ reminder }: ReminderItemProps) {
  const router = useRouter()
  const [busy, setBusy] = useState<null | 'done' | 'snooze'>(null)
  const [snoozeOpen, setSnoozeOpen] = useState(false)

  const company = reminder.company ?? 'Unknown'
  const tint = avatarTint(company)
  const kindText = KIND_LABELS[reminder.kind] ?? reminder.kind
  const due = dueLabel(reminder.due_at)

  async function markDone() {
    if (busy) return
    setBusy('done')
    try {
      const res = await fetch(`/api/engine/reminders/${reminder.id}/complete`, {
        method: 'POST',
      })
      if (!res.ok) {
        console.error('Failed to complete reminder', await res.text())
        setBusy(null)
        return
      }
      router.refresh()
    } catch (err) {
      console.error('Failed to complete reminder', err)
      setBusy(null)
    }
  }

  async function snooze(days: 1 | 3 | 7) {
    if (busy) return
    setBusy('snooze')
    setSnoozeOpen(false)
    try {
      const res = await fetch(`/api/engine/reminders/${reminder.id}/snooze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days }),
      })
      if (!res.ok) {
        console.error('Failed to snooze reminder', await res.text())
        setBusy(null)
        return
      }
      router.refresh()
    } catch (err) {
      console.error('Failed to snooze reminder', err)
      setBusy(null)
    }
  }

  return (
    <li
      className="flex items-start gap-3 py-3"
      style={{ borderBottom: '1px solid var(--color-border-inner)' }}
    >
      {/* Avatar */}
      <div
        className="flex-shrink-0 flex items-center justify-center font-semibold tabular-nums"
        style={{
          width: 32,
          height: 32,
          borderRadius: 6,
          backgroundColor: tint.bg,
          color: tint.fg,
          fontSize: 11,
          fontFamily: 'var(--font-sans)',
          letterSpacing: '0.04em',
          border: `1px solid ${tint.fg}33`,
        }}
        aria-hidden
      >
        {avatarLetters(company)}
      </div>

      {/* Text + actions */}
      <div className="flex-1 min-w-0">
        <p
          className="text-[12px] font-semibold leading-tight truncate"
          style={{ color: 'var(--color-text-bright)', fontFamily: 'var(--font-sans)' }}
        >
          {company}
        </p>
        <p
          className="text-[11px] mt-0.5 truncate"
          style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-sans)' }}
        >
          {kindText}
          <span style={{ color: 'var(--color-text-faint)' }}>{' · '}</span>
          <span style={{ color: due.color }}>{due.text}</span>
        </p>

        <div className="flex items-center gap-1.5 mt-2 relative">
          <a
            href={linkedinSearchUrl(company)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-medium px-2 py-1 rounded"
            style={{
              fontFamily: 'var(--font-sans)',
              color: 'var(--color-text-secondary)',
              background: 'transparent',
              border: '1px solid var(--color-border)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              textDecoration: 'none',
            }}
          >
            ↗ LinkedIn
          </a>
          <button
            type="button"
            onClick={markDone}
            disabled={busy !== null}
            className="text-[10px] font-medium px-2 py-1 rounded transition-colors"
            style={{
              fontFamily: 'var(--font-sans)',
              color: busy === 'done' ? 'var(--color-text-faint)' : 'var(--color-text-bright)',
              background: 'transparent',
              border: '1px solid var(--color-border)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              cursor: busy !== null ? 'wait' : 'pointer',
            }}
          >
            {busy === 'done' ? '...' : 'Done'}
          </button>
          <button
            type="button"
            onClick={() => setSnoozeOpen((o) => !o)}
            disabled={busy !== null}
            className="text-[10px] font-medium px-2 py-1 rounded transition-colors"
            style={{
              fontFamily: 'var(--font-sans)',
              color: busy === 'snooze' ? 'var(--color-text-faint)' : 'var(--color-text-secondary)',
              background: 'transparent',
              border: '1px solid var(--color-border)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              cursor: busy !== null ? 'wait' : 'pointer',
            }}
            aria-expanded={snoozeOpen}
            aria-haspopup="menu"
          >
            {busy === 'snooze' ? '...' : 'Snooze ▾'}
          </button>
          {snoozeOpen && (
            <div
              role="menu"
              className="absolute z-10 rounded vellum"
              style={{
                top: '100%',
                left: 0,
                marginTop: 4,
                border: '1px solid var(--color-border)',
                minWidth: 88,
              }}
            >
              {([1, 3, 7] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  role="menuitem"
                  onClick={() => snooze(d)}
                  className="block w-full text-left text-[10px] font-medium px-3 py-1.5"
                  style={{
                    fontFamily: 'var(--font-sans)',
                    color: 'var(--color-text-secondary)',
                    background: 'transparent',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                  }}
                >
                  {d === 1 ? '1 day' : d === 3 ? '3 days' : '1 week'}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </li>
  )
}
