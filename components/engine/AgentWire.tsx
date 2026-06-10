import type { ActivityEvent } from '@/lib/engine/dashboard'
import { timeAgo } from '@/lib/engine/dashboard'

/** Terminal-style verb + color per event kind. */
const VERBS: Record<string, { verb: string; color: string }> = {
  applied: { verb: 'APPLIED', color: '#4ade80' },
  awaiting_approval: { verb: 'HELD', color: '#f0b429' },
  approval_skipped: { verb: 'PASSED', color: '#7d8aa0' },
  approval_post_failed: { verb: 'ALERT', color: '#f87171' },
  submit_unconfirmed: { verb: 'UNCONFIRMED', color: '#f0b429' },
  needs_review: { verb: 'NEEDS REVIEW', color: '#f0b429' },
  job_not_found: { verb: 'RETIRED', color: '#f87171' },
  auto_apply_run: { verb: 'RUN', color: '#60a5fa' },
  tailored: { verb: 'TAILORED', color: '#f0b429' },
  scored: { verb: 'SCORED', color: '#7d8aa0' },
  sourced: { verb: 'FOUND', color: '#7d8aa0' },
  rated: { verb: 'RATED', color: '#7d8aa0' },
  responded: { verb: 'RESPONSE', color: '#a78bfa' },
  interviewing: { verb: 'INTERVIEW', color: '#a78bfa' },
  offer: { verb: 'OFFER', color: '#a78bfa' },
  rejected: { verb: 'REJECTED', color: '#7d8aa0' },
}

function lineFor(e: ActivityEvent): string {
  const summary = e.detail && typeof e.detail.summary === 'string' ? e.detail.summary : null
  if (e.kind === 'auto_apply_run') return summary ?? 'auto-apply run'
  const fit = e.detail && e.detail.fit != null ? ` · fit ${e.detail.fit}` : ''
  return `${e.company ?? ''}${fit}` || e.kind
}

interface AgentWireProps {
  events: ActivityEvent[]
}

/** The agent wire: a live, timestamped feed of everything the engine did. */
export default function AgentWire({ events }: AgentWireProps) {
  return (
    <div>
      <p
        className="text-[10px] uppercase mb-3"
        style={{ color: 'var(--color-text-faint)', fontFamily: 'var(--font-display)', letterSpacing: '0.22em' }}
      >
        Agent wire — everything I did, timestamped
      </p>
      <div className="space-y-1.5" style={{ fontFamily: 'var(--font-display)', fontSize: 12 }}>
        {events.length === 0 && (
          <p style={{ color: 'var(--color-text-ghost)' }}>— no activity yet —</p>
        )}
        {events.map((e) => {
          const v = VERBS[e.kind.toLowerCase()] ?? { verb: e.kind.toUpperCase().replace(/_/g, ' '), color: '#7d8aa0' }
          return (
            <div key={e.id} className="flex items-baseline gap-3">
              <span className="tabular-nums flex-shrink-0 w-12 text-right" style={{ color: 'var(--color-text-ghost)' }}>
                {timeAgo(e.created_at)}
              </span>
              <span className="flex-shrink-0 font-medium" style={{ color: v.color }}>
                {v.verb}
              </span>
              <span className="truncate" style={{ color: 'var(--color-text-secondary)' }}>
                {lineFor(e)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
