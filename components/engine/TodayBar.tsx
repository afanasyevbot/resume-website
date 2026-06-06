'use client'

interface TodayBarProps {
  /** Tailored roles awaiting your submit click. */
  readyToApply: number
  /** LinkedIn reminders due now or overdue. */
  dueReminders: number
  /** Outreach drafts waiting to be sent. */
  draftsToSend: number
  /** Switch the queue to the active view + scroll to it. */
  onShowActive: () => void
}

function scrollTo(id: string) {
  if (typeof document !== 'undefined') {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

interface Item {
  icon: string
  text: string
  onClick: () => void
}

export default function TodayBar({
  readyToApply,
  dueReminders,
  draftsToSend,
  onShowActive,
}: TodayBarProps) {
  const items: Item[] = []
  if (readyToApply > 0) {
    items.push({
      icon: '✓',
      text: `Confirm ${readyToApply} application${readyToApply === 1 ? '' : 's'}`,
      onClick: onShowActive,
    })
  }
  if (dueReminders > 0) {
    items.push({
      icon: '🔗',
      text: `Send ${dueReminders} LinkedIn follow-up${dueReminders === 1 ? '' : 's'}`,
      onClick: () => scrollTo('reminders-panel'),
    })
  }
  if (draftsToSend > 0) {
    items.push({
      icon: '✉',
      text: `${draftsToSend} outreach draft${draftsToSend === 1 ? '' : 's'} to send`,
      onClick: onShowActive,
    })
  }

  const caughtUp = items.length === 0

  return (
    <div
      className="vellum rounded-lg"
      style={{
        border: '1px solid var(--color-border)',
        borderLeft: `3px solid ${caughtUp ? '#4f8038' : '#c89418'}`,
        padding: '14px 18px',
      }}
    >
      <div className="flex items-center flex-wrap gap-x-4 gap-y-2">
        <span
          className="text-[11px] font-semibold uppercase tracking-widest"
          style={{
            color: 'var(--color-text-faint)',
            fontFamily: 'var(--font-sans)',
            letterSpacing: '0.16em',
          }}
        >
          Today
        </span>

        {caughtUp ? (
          <span
            className="text-[13px]"
            style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-sans)' }}
          >
            ✓ All caught up — nothing needs you right now.
          </span>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            {items.map((it, i) => (
              <button
                key={i}
                onClick={it.onClick}
                className="inline-flex items-center gap-2 text-[13px] font-medium transition-colors"
                style={{
                  fontFamily: 'var(--font-sans)',
                  color: '#1c1810',
                  backgroundColor: 'rgba(200,148,24,0.14)',
                  border: '1px solid rgba(200,148,24,0.35)',
                  padding: '6px 12px',
                  borderRadius: 8,
                  cursor: 'pointer',
                }}
              >
                <span aria-hidden style={{ fontSize: 13 }}>
                  {it.icon}
                </span>
                {it.text}
                <span aria-hidden style={{ color: '#8a6310' }}>
                  →
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
