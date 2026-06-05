'use client'

import { useMemo, useState } from 'react'
import type { RoleRow } from '@/lib/engine/dashboard'
import EmptyState from './EmptyState'
import AddRoleForm from './AddRoleForm'
import SourceAction from './SourceAction'
import ResearchAction from './ResearchAction'
import RoleCard from './RoleCard'
import FilterPills, { type FilterKey, computeCounts, rowMatches } from './FilterPills'
import { type StatusView, statusMatches } from './statusView'

function IdleIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3" strokeLinecap="round" />
      <circle cx="24" cy="24" r="3" fill="currentColor" opacity="0.4" />
    </svg>
  )
}

const STATUS_TABS: { key: StatusView; label: string }[] = [
  { key: 'active', label: 'Active' },
  { key: 'applied', label: 'Applied' },
  { key: 'all', label: 'All' },
]

interface RoleQueueTableProps {
  rows: RoleRow[]
  statusView: StatusView
  onStatusView: (v: StatusView) => void
  viewCounts: Record<StatusView, number>
}

export default function RoleQueueTable({
  rows,
  statusView,
  onStatusView,
  viewCounts,
}: RoleQueueTableProps) {
  const [addOpen, setAddOpen] = useState(false)
  const [filter, setFilter] = useState<FilterKey>('all')
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const statusFiltered = useMemo(
    () => rows.filter((r) => statusMatches(r, statusView)),
    [rows, statusView],
  )
  const catCounts = useMemo(() => computeCounts(statusFiltered), [statusFiltered])
  const visible = useMemo(
    () => statusFiltered.filter((r) => rowMatches(r, filter)),
    [statusFiltered, filter],
  )

  return (
    <div className="vellum rounded-lg overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
      {/* Header: title + actions */}
      <div
        className="px-5 py-3 flex items-center justify-between"
        style={{ borderBottom: '1px dashed rgba(138,109,59,0.18)' }}
      >
        <p
          className="text-[11px] font-medium uppercase tracking-widest"
          style={{ color: 'var(--color-text-faint)', fontFamily: 'var(--font-sans)', letterSpacing: '0.14em' }}
        >
          Role Queue
        </p>
        <div className="flex items-center gap-3">
          <SourceAction />
          <ResearchAction />
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
            }}
            aria-expanded={addOpen}
          >
            {addOpen ? 'Close' : '+ Add role'}
          </button>
        </div>
      </div>

      {addOpen && <AddRoleForm onClose={() => setAddOpen(false)} />}

      {/* Status segmented control */}
      <div
        className="px-5 py-2.5 flex items-center gap-1.5"
        style={{ borderBottom: '1px dashed rgba(138,109,59,0.12)' }}
      >
        {STATUS_TABS.map((tab) => {
          const isActive = statusView === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => onStatusView(tab.key)}
              className="text-[12px] font-medium transition-colors"
              style={{
                fontFamily: 'var(--font-sans)',
                color: isActive ? '#1c1810' : 'var(--color-text-dim)',
                backgroundColor: isActive ? 'rgba(200,148,24,0.16)' : 'transparent',
                border: `1px solid ${isActive ? 'rgba(200,148,24,0.4)' : 'transparent'}`,
                padding: '4px 12px',
                borderRadius: 6,
                cursor: 'pointer',
              }}
              aria-pressed={isActive}
            >
              {tab.label}
              <span className="ml-1.5 tabular-nums" style={{ color: isActive ? '#8a6310' : 'var(--color-text-ghost)', fontSize: 11 }}>
                {viewCounts[tab.key]}
              </span>
            </button>
          )
        })}
      </div>

      {/* Category filter pills (within the current status view) */}
      {statusFiltered.length > 0 && (
        <div style={{ borderBottom: '1px dashed rgba(138,109,59,0.10)' }}>
          <FilterPills active={filter} onChange={setFilter} counts={catCounts} />
        </div>
      )}

      {/* Cards / empty states */}
      {rows.length === 0 ? (
        <EmptyState
          icon={<IdleIcon />}
          title="The engine is idle."
          subtitle="Drop in a JD with “+ Add role”, or click “Source” to poll your target companies."
        />
      ) : statusFiltered.length === 0 ? (
        <EmptyMessage>
          {statusView === 'active'
            ? 'No active roles — you’re all caught up. 🎉'
            : statusView === 'applied'
            ? 'No applications yet. Mark a role applied and it shows here.'
            : 'No roles yet.'}
        </EmptyMessage>
      ) : visible.length === 0 ? (
        <EmptyMessage>— no roles match this filter —</EmptyMessage>
      ) : (
        <div className="p-4 grid grid-cols-1 gap-3">
          {visible.map((row) => (
            <RoleCard
              key={row.id}
              row={row}
              expanded={expandedId === row.id}
              onToggleExpanded={() => setExpandedId(expandedId === row.id ? null : row.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function EmptyMessage({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex items-center justify-center py-12 text-center px-6"
      style={{ color: 'var(--color-text-dim)', fontFamily: 'var(--font-sans)', fontSize: 13 }}
    >
      {children}
    </div>
  )
}
