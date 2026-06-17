import { timeAgo } from '@/lib/engine/dashboard'

// Same palette as ActivityFeed so the dot color is a consistent visual code.
const KIND_DOT: Record<string, string> = {
  sourced:      '#9aa3b4',
  scored:       '#e2d5c0',
  tailored:     '#d4b278',
  queued:       '#d4b278',
  applied:      '#6ee7a0',
  responded:    '#e9c98c',
  interviewing: '#e2d5c0',
  offer:        '#e9c98c',
  rejected:     '#b88078',
  discarded:    '#5e5040',
}

const DEFAULT_DOT = '#7e6e58'

export interface TimelineEvent {
  id: number
  kind: string
  detail: Record<string, unknown> | null
  created_at: string
}

interface EventTimelineProps {
  events: TimelineEvent[]
}

/** Capitalize a kind string for display. Underscores become spaces. */
function kindLabel(kind: string): string {
  const spaced = kind.replace(/_/g, ' ')
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase()
}

/** One-line summary pulled from the event detail JSON, if useful. */
function detailSummary(detail: Record<string, unknown> | null): string | null {
  if (!detail) return null
  // Prefer human-friendly fields when present.
  for (const key of ['note', 'reason', 'archetype', 'route', 'source']) {
    const v = detail[key]
    if (typeof v === 'string' && v.length > 0) return v
  }
  return null
}

/** Pretty-printed JSON for the expandable detail block. */
function formatDetail(detail: Record<string, unknown> | null): string | null {
  if (!detail) return null
  try {
    return JSON.stringify(detail, null, 2)
  } catch {
    return null
  }
}

export default function EventTimeline({ events }: EventTimelineProps) {
  if (events.length === 0) {
    return (
      <div
        className="flex items-center justify-center py-8"
        style={{
          color: 'var(--color-text-ghost)',
          fontFamily: 'var(--font-sans)',
          fontSize: 12,
        }}
      >
        — no events yet —
      </div>
    )
  }

  return (
    <ol className="relative">
      {events.map((event, i) => {
        const dotColor = KIND_DOT[event.kind.toLowerCase()] ?? DEFAULT_DOT
        const isLast = i === events.length - 1
        const summary = detailSummary(event.detail)
        const json = formatDetail(event.detail)

        return (
          <li key={event.id} className="relative pl-6 pb-4">
            {/* Vertical connector line — sits behind the dots */}
            {!isLast && (
              <span
                aria-hidden
                className="absolute"
                style={{
                  left: 3,
                  top: 10,
                  bottom: -2,
                  width: 1,
                  backgroundColor: 'var(--color-border-inner)',
                }}
              />
            )}
            {/* Dot */}
            <span
              aria-hidden
              className="absolute rounded-full"
              style={{
                left: 0,
                top: 4,
                width: 7,
                height: 7,
                backgroundColor: dotColor,
                boxShadow: `0 0 4px ${dotColor}55`,
              }}
            />
            {/* Label + time */}
            <div className="flex items-baseline justify-between gap-3">
              <p
                className="text-[12px] font-medium"
                style={{
                  color: 'var(--color-text-secondary)',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                {kindLabel(event.kind)}
                {summary && (
                  <span
                    className="ml-2 font-normal"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    · {summary}
                  </span>
                )}
              </p>
              <span
                className="text-[11px] tabular-nums flex-shrink-0"
                style={{
                  color: 'var(--color-text-ghost)',
                  fontFamily: 'var(--font-sans)',
                }}
                title={new Date(event.created_at).toLocaleString()}
              >
                {timeAgo(event.created_at)}
              </span>
            </div>
            {/* Screenshot thumbnail — links to full image in a new tab */}
            {typeof event.detail?.screenshotUrl === 'string' && (
              <a
                href={event.detail.screenshotUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 block"
                style={{ display: 'inline-block' }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={event.detail.screenshotUrl}
                  alt="Form screenshot"
                  style={{
                    maxHeight: 120,
                    borderRadius: 4,
                    border: '1px solid var(--color-border-inner)',
                    display: 'block',
                  }}
                />
              </a>
            )}
            {/* Pretty-printed JSON when there's structured detail */}
            {json && (
              <pre
                className="mt-2 text-[10.5px] whitespace-pre-wrap break-words overflow-x-auto"
                style={{
                  color: 'var(--color-text-muted)',
                  fontFamily:
                    'ui-monospace, SFMono-Regular, Menlo, monospace',
                  backgroundColor: 'rgba(148,163,184,0.04)',
                  border: '1px solid var(--color-border-inner)',
                  borderRadius: 4,
                  padding: '6px 8px',
                  maxHeight: 180,
                  overflowY: 'auto',
                }}
              >
                {json}
              </pre>
            )}
          </li>
        )
      })}
    </ol>
  )
}
