import type { ActivityEvent } from '@/lib/engine/dashboard'
import { timeAgo } from '@/lib/engine/dashboard'

// Per-kind dot colors (matches the status badge palette)
// Darker, saturated dots so they read on the cream activity panel.
const KIND_DOT: Record<string, string> = {
  sourced:      '#566173',
  scored:       '#7d8aa0',
  tailored:     '#e3a52e',
  queued:       '#e3a52e',
  applied:      '#4ade80',
  responded:    '#f0b429',
  interviewing: '#c4924d',
  offer:        '#f0b429',
  rejected:     '#f87171',
  discarded:    '#5d6b80',
  needs_review: '#f0b429',
  awaiting_approval: '#f0b429',
  approval_post_failed: '#f87171',
  job_not_found: '#5d6b80',
  auto_apply_run: '#566173',
}

const DEFAULT_DOT = '#5d6b80'

function kindLabel(kind: string, company: string | null): string {
  const pretty = kind.replace(/_/g, ' ')
  const k = pretty.charAt(0).toUpperCase() + pretty.slice(1).toLowerCase()
  return company ? `${k} · ${company}` : k
}

/** Cron run events carry a human summary ("0 eligible of 3 tailored — …"). */
function eventText(event: ActivityEvent): string {
  const label = kindLabel(event.kind, event.company)
  const summary = event.detail?.summary
  return typeof summary === 'string' ? `${label} — ${summary}` : label
}

interface ActivityFeedProps {
  events: ActivityEvent[]
}

export default function ActivityFeed({ events }: ActivityFeedProps) {
  return (
    <div
      className="vellum rounded-lg overflow-hidden h-full"
      style={{
        border: '1px solid var(--color-border)',
      }}
    >
      {/* Section label */}
      <div
        className="px-5 py-3"
        style={{ borderBottom: '1px dashed rgba(148,163,184,0.10)' }}
      >
        <p
          className="text-[11px] font-medium uppercase"
          style={{
            color: 'var(--color-text-faint)',
            fontFamily: 'var(--font-sans)',
            letterSpacing: '0.04em',
          }}
        >
          Activity
        </p>
      </div>

      <div
        className="overflow-y-auto"
        style={{ maxHeight: 320 }}
      >
        {events.length === 0 ? (
          <div
            className="flex items-center justify-center py-10"
            style={{
              color: 'var(--color-text-ghost)',
              fontFamily: 'var(--font-sans)',
              fontSize: 12,
            }}
          >
            — no activity yet —
          </div>
        ) : (
          <ul className="px-5 py-3 space-y-0">
            {events.map((event, i) => {
              const dotColor = KIND_DOT[event.kind.toLowerCase()] ?? DEFAULT_DOT
              const isLast = i === events.length - 1

              return (
                <li
                  key={event.id}
                  className="flex items-start gap-3 py-2.5"
                  style={{
                    borderBottom: isLast
                      ? 'none'
                      : '1px solid var(--color-border-inner)',
                  }}
                >
                  {/* Timeline dot */}
                  <span
                    className="mt-1 flex-shrink-0 rounded-full"
                    style={{
                      width: 8,
                      height: 8,
                      backgroundColor: dotColor,
                      boxShadow: `0 0 4px ${dotColor}55`,
                    }}
                    aria-hidden="true"
                  />

                  {/* Text + timestamp */}
                  <div className="flex-1 flex items-baseline justify-between gap-2 min-w-0">
                    <span
                      className="text-[12px] truncate"
                      style={{
                        color: 'var(--color-text-secondary)',
                        fontFamily: 'var(--font-sans)',
                      }}
                    >
                      {eventText(event)}
                    </span>
                    <span
                      className="text-[11px] tabular-nums flex-shrink-0"
                      style={{
                        color: 'var(--color-text-ghost)',
                        fontFamily: 'var(--font-sans)',
                      }}
                    >
                      {timeAgo(event.created_at)}
                    </span>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
