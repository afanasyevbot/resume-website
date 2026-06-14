import Link from 'next/link'
import type { ActivityEvent } from '@/lib/engine/dashboard'
import { timeAgo } from '@/lib/engine/dashboard'

/** Plain-language label + dot color per event kind. */
const KINDS: Record<string, { label: string; color: string }> = {
  applied: { label: 'Applied', color: '#16a34a' },
  awaiting_approval: { label: 'Held for your approval', color: '#b45309' },
  approval_skipped: { label: 'Passed', color: '#9ca3af' },
  approval_post_failed: { label: 'Approval alert', color: '#dc2626' },
  submit_unconfirmed: { label: 'Submitted (unconfirmed)', color: '#b45309' },
  needs_review: { label: 'Needs review', color: '#b45309' },
  job_not_found: { label: 'Listing retired', color: '#dc2626' },
  tailor_failed: { label: 'Tailoring failed', color: '#dc2626' },
  tailored: { label: 'Tailored', color: '#b45309' },
  scored: { label: 'Scored', color: '#9ca3af' },
  sourced: { label: 'Found', color: '#9ca3af' },
  rated: { label: 'Rated', color: '#9ca3af' },
  responded: { label: 'Response', color: '#7c3aed' },
  interviewing: { label: 'Interview', color: '#7c3aed' },
  offer: { label: 'Offer', color: '#7c3aed' },
  rejected: { label: 'Rejected', color: '#9ca3af' },
  source_run: { label: 'Sourcing run', color: '#2563eb' },
  research_run: { label: 'Research run', color: '#2563eb' },
  auto_apply_run: { label: 'Auto-apply run', color: '#2563eb' },
}

function failedBoards(e: ActivityEvent): string[] {
  const f = e.detail?.failedCompanies
  return Array.isArray(f) ? f.filter((x): x is string => typeof x === 'string') : []
}

/** The detail line under the action: company + fit, or a run summary. */
function detailFor(e: ActivityEvent): string {
  const summary = e.detail && typeof e.detail.summary === 'string' ? e.detail.summary : null
  if (e.kind.endsWith('_run')) {
    const base = summary ?? e.kind.replace(/_/g, ' ')
    const failed = failedBoards(e)
    return failed.length > 0
      ? `${base} · ${failed.length} board${failed.length === 1 ? '' : 's'} failed: ${failed.slice(0, 3).join(', ')}${failed.length > 3 ? '…' : ''}`
      : base
  }
  const fit = e.detail && e.detail.fit != null ? ` · fit ${e.detail.fit}` : ''
  return `${e.company ?? ''}${fit}`.trim()
}

interface AgentWireProps {
  events: ActivityEvent[]
}

/** A clean, scannable activity timeline of everything the engine did. */
export default function AgentWire({ events }: AgentWireProps) {
  return (
    <div>
      <p className="eng-eyebrow mb-4">Activity</p>
      {events.length === 0 ? (
        <p className="text-[13px]" style={{ color: 'var(--color-text-faint)', fontFamily: 'var(--font-sans)' }}>
          Nothing yet — the engine will log here as it works.
        </p>
      ) : (
        <ul className="space-y-0.5">
          {events.map((e) => {
            const k = KINDS[e.kind.toLowerCase()] ?? { label: e.kind.replace(/_/g, ' '), color: '#9ca3af' }
            const isAlert = e.kind.endsWith('_run') && failedBoards(e).length > 0
            const dot = isAlert ? '#dc2626' : k.color
            const detail = detailFor(e)
            const row = (
              <div className="flex items-baseline gap-3 py-2 px-2 -mx-2 rounded-lg transition-colors hover:bg-[var(--color-surface-deep)]">
                <span aria-hidden className="flex-shrink-0 translate-y-[5px]" style={{ width: 7, height: 7, borderRadius: 999, background: dot, display: 'inline-block' }} />
                <span className="flex-1 min-w-0 text-[13.5px]" style={{ fontFamily: 'var(--font-sans)', color: 'var(--color-text-primary)' }}>
                  <span style={{ fontWeight: 500 }}>{k.label}</span>
                  {detail && <span style={{ color: 'var(--color-text-muted)' }}> — {detail}</span>}
                </span>
                <span className="flex-shrink-0 text-[12px] eng-figure" style={{ color: 'var(--color-text-faint)' }}>
                  {timeAgo(e.created_at)}
                </span>
              </div>
            )
            return (
              <li key={e.id}>
                {e.role_id ? (
                  <Link href={`/engine/roles/${e.role_id}`} style={{ textDecoration: 'none', display: 'block' }}>
                    {row}
                  </Link>
                ) : row}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
