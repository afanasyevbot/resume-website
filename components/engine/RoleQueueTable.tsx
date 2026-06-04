import type { RoleRow } from '@/lib/engine/dashboard'
import FitBar from './FitBar'
import StatusBadge from './StatusBadge'
import EmptyState from './EmptyState'

const ROUTE_BORDER: Record<string, string> = {
  tailor:  '#d4b278',
  flag:    '#b88940',
  discard: '#5a5040',
}

const DEFAULT_BORDER = '#352c1e'

// Dashed circle SVG for empty state
function IdleIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle
        cx="24"
        cy="24"
        r="20"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="4 3"
        strokeLinecap="round"
      />
      <circle cx="24" cy="24" r="3" fill="currentColor" opacity="0.4" />
    </svg>
  )
}

interface RoleQueueTableProps {
  rows: RoleRow[]
}

export default function RoleQueueTable({ rows }: RoleQueueTableProps) {
  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        border: '1px solid var(--color-border)',
        backgroundColor: 'rgba(34, 29, 20, 0.4)',
        boxShadow: 'inset 0 1px 0 rgba(212,178,120,0.05)',
      }}
    >
      {/* Section label */}
      <div
        className="px-5 py-3 flex items-center justify-between"
        style={{ borderBottom: '1px dashed rgba(212,178,120,0.10)' }}
      >
        <p
          className="text-[11px] font-medium uppercase tracking-widest"
          style={{
            color: 'var(--color-text-faint)',
            fontFamily: 'var(--font-sans)',
            letterSpacing: '0.14em',
          }}
        >
          Role Queue
        </p>
        {rows.length > 0 && (
          <p
            className="text-[11px] tabular-nums"
            style={{ color: 'var(--color-text-ghost)', fontFamily: 'var(--font-sans)' }}
          >
            {rows.length} role{rows.length === 1 ? '' : 's'}
          </p>
        )}
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={<IdleIcon />}
          title="The engine is idle."
          subtitle="Roles will appear here once sourcing is on. Until then, this is the cockpit."
        />
      ) : (
        <ul className="divide-y" style={{ borderColor: 'var(--color-border-inner)' }}>
          {rows.map((row) => {
            const borderColor = ROUTE_BORDER[row.route?.toLowerCase() ?? ''] ?? DEFAULT_BORDER

            return (
              <li
                key={row.id}
                className="role-queue-row flex items-start gap-0 cursor-pointer transition-colors"
                style={{
                  borderLeft: `2px solid ${borderColor}`,
                }}
              >
                <div className="flex-1 px-5 py-4 min-w-0">
                  {/* Line 1: company + route arrow */}
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[14px] font-medium truncate"
                      style={{
                        color: 'var(--color-text-bright)',
                        fontFamily: 'var(--font-sans)',
                      }}
                    >
                      {row.company}
                    </span>
                    {row.route === 'tailor' && (
                      <span
                        className="text-[11px]"
                        style={{ color: '#d4b278' }}
                        aria-label="Tailor"
                      >
                        →
                      </span>
                    )}
                    {row.route === 'flag' && (
                      <span
                        className="text-[11px]"
                        style={{ color: '#b88940' }}
                        aria-label="Flag"
                      >
                        ⚑
                      </span>
                    )}
                  </div>

                  {/* Line 2: title · location · fit · status */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                    <span
                      className="text-[12px] truncate"
                      style={{
                        color: 'var(--color-text-secondary)',
                        fontFamily: 'var(--font-sans)',
                      }}
                    >
                      {row.title}
                      {row.location ? (
                        <span style={{ color: 'var(--color-text-faint)' }}>
                          {' · '}
                          {row.location}
                        </span>
                      ) : null}
                    </span>

                    {row.fit_score !== null && (
                      <span className="flex-shrink-0">
                        <FitBar score={row.fit_score} route={row.route} />
                      </span>
                    )}

                    <StatusBadge status={row.status} />
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
