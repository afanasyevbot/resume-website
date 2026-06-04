'use client'

import { useMemo, useState } from 'react'
import type { RoleRow } from '@/lib/engine/dashboard'
import EmptyState from './EmptyState'
import AddRoleForm from './AddRoleForm'
import SourceAction from './SourceAction'
import RoleCard from './RoleCard'
import FilterPills, { type FilterKey, computeCounts, rowMatches } from './FilterPills'

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
  const [addOpen, setAddOpen] = useState(false)
  const [filter, setFilter] = useState<FilterKey>('all')
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const counts = useMemo(() => computeCounts(rows), [rows])
  const visible = useMemo(() => rows.filter((r) => rowMatches(r, filter)), [rows, filter])

  return (
    <div
      className="vellum rounded-lg overflow-hidden"
      style={{ border: '1px solid var(--color-border)' }}
    >
      {/* Header: section label + action buttons */}
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
        <div className="flex items-center gap-3">
          {rows.length > 0 && (
            <p
              className="text-[11px] tabular-nums"
              style={{ color: 'var(--color-text-ghost)', fontFamily: 'var(--font-sans)' }}
            >
              {visible.length}
              {visible.length !== rows.length && (
                <span style={{ color: 'var(--color-text-whisper)' }}> / {rows.length}</span>
              )}{' '}
              role{visible.length === 1 ? '' : 's'}
            </p>
          )}
          <SourceAction />
          <button
            onClick={() => setAddOpen((o) => !o)}
            className="text-[11px] font-medium"
            style={{
              fontFamily: 'var(--font-sans)',
              color: addOpen ? 'var(--color-text-faint)' : 'var(--color-gold)',
              background: 'transparent',
              border: '1px solid',
              borderColor: addOpen ? 'var(--color-border-inner)' : 'var(--color-gold-dim)',
              padding: '4px 10px',
              borderRadius: 4,
              cursor: 'pointer',
              letterSpacing: '0.10em',
              textTransform: 'uppercase',
              transition: 'color 0.15s, border-color 0.15s',
            }}
            aria-expanded={addOpen}
          >
            {addOpen ? 'Close' : '+ Add role'}
          </button>
        </div>
      </div>

      {addOpen && <AddRoleForm onClose={() => setAddOpen(false)} />}

      {/* Filter pills (only when there's content to filter) */}
      {rows.length > 0 && (
        <div
          style={{
            borderBottom: '1px dashed rgba(212,178,120,0.08)',
          }}
        >
          <FilterPills active={filter} onChange={setFilter} counts={counts} />
        </div>
      )}

      {/* Cards / empty state */}
      {rows.length === 0 ? (
        <EmptyState
          icon={<IdleIcon />}
          title="The engine is idle."
          subtitle="Drop in a JD with “+ Add role” above, or click “Source” to poll your target companies."
        />
      ) : visible.length === 0 ? (
        <div
          className="flex items-center justify-center py-12"
          style={{
            color: 'var(--color-text-ghost)',
            fontFamily: 'var(--font-sans)',
            fontSize: 12,
          }}
        >
          — no roles match this filter —
        </div>
      ) : (
        <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
          {visible.map((row) => (
            <RoleCard
              key={row.id}
              row={row}
              expanded={expandedId === row.id}
              onToggleExpanded={() =>
                setExpandedId(expandedId === row.id ? null : row.id)
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}
