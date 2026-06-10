import type { RoleRow } from '@/lib/engine/dashboard'
import ApprovalAction from './ApprovalAction'

interface ApprovalQueueProps {
  rows: RoleRow[]
}

/**
 * "Needs your OK" strip — every role parked in 'awaiting_approval', with the
 * fit score, why it's held, and one-click approve/skip. Hidden when empty.
 * This is also the recovery path for roles whose Slack approval message
 * failed to send.
 */
export default function ApprovalQueue({ rows }: ApprovalQueueProps) {
  const waiting = rows.filter((r) => r.status === 'awaiting_approval')
  if (waiting.length === 0) return null

  return (
    <div
      className="rounded-lg mb-8 overflow-hidden"
      style={{ border: '1px solid rgba(240,180,41,0.35)', background: 'rgba(240,180,41,0.05)' }}
    >
      <div className="px-5 py-3" style={{ borderBottom: '1px dashed rgba(240,180,41,0.2)' }}>
        <p
          className="text-[11px] font-medium uppercase tracking-widest"
          style={{ color: '#f0b429', fontFamily: 'var(--font-sans)', letterSpacing: '0.14em' }}
        >
          Needs your OK — {waiting.length} role{waiting.length === 1 ? '' : 's'} held for approval
        </p>
      </div>
      <ul>
        {waiting.map((r, i) => {
          const firstReason = Array.isArray(r.fit_reasons) && typeof r.fit_reasons[0] === 'string'
            ? (r.fit_reasons[0] as string)
            : null
          return (
            <li
              key={r.id}
              className="px-5 py-4 flex flex-wrap items-center justify-between gap-3"
              style={{
                borderBottom: i === waiting.length - 1 ? 'none' : '1px solid rgba(240,180,41,0.12)',
              }}
            >
              <div className="min-w-0">
                <p
                  className="text-[13px] font-medium truncate"
                  style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-sans)' }}
                >
                  {r.company} — {r.title}
                </p>
                <p
                  className="text-[11px] mt-0.5"
                  style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-sans)' }}
                >
                  Held at fit {r.fit_score ?? '?'} — auto-applies at 75+
                  {firstReason ? ` · ${firstReason}` : ''}
                </p>
              </div>
              <ApprovalAction roleId={r.id} />
            </li>
          )
        })}
      </ul>
    </div>
  )
}
