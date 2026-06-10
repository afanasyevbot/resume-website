'use client'

import type { RoleRow } from '@/lib/engine/dashboard'

export type FilterKey =
  | 'all'
  | 'founding'
  | 'midMarket'
  | 'aiNative'
  | 'remote'
  | 'topFit'

interface FilterPillsProps {
  active: FilterKey
  onChange: (key: FilterKey) => void
  counts: Record<FilterKey, number>
}

const ORDER: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'topFit', label: 'Top fit' },
  { key: 'founding', label: 'Founding AE' },
  { key: 'midMarket', label: 'Mid-market' },
  { key: 'aiNative', label: 'AI-native' },
  { key: 'remote', label: 'Remote' },
]

export default function FilterPills({ active, onChange, counts }: FilterPillsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 px-5 py-3">
      {ORDER.map(({ key, label }) => {
        const isActive = active === key
        const n = counts[key] ?? 0
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            disabled={n === 0 && key !== 'all'}
            className="text-[11px] font-medium transition-colors"
            style={{
              fontFamily: 'var(--font-sans)',
              color: isActive
                ? 'var(--color-gold)'
                : n === 0 && key !== 'all'
                ? 'var(--color-text-whisper)'
                : 'var(--color-text-muted)',
              backgroundColor: isActive
                ? 'rgba(148,163,184,0.10)'
                : 'transparent',
              border: '1px solid',
              borderColor: isActive
                ? 'var(--color-gold-dim)'
                : 'var(--color-border-inner)',
              padding: '5px 12px',
              borderRadius: 999,
              cursor: n === 0 && key !== 'all' ? 'not-allowed' : 'pointer',
              letterSpacing: '0.06em',
              opacity: n === 0 && key !== 'all' ? 0.5 : 1,
            }}
          >
            {label}
            <span
              className="ml-1.5 tabular-nums"
              style={{
                color: isActive
                  ? 'var(--color-gold)'
                  : 'var(--color-text-ghost)',
                fontSize: 10,
              }}
            >
              {n}
            </span>
          </button>
        )
      })}
    </div>
  )
}

/** Pure: does a row pass this filter? */
export function rowMatches(row: RoleRow, key: FilterKey): boolean {
  switch (key) {
    case 'all':
      return true
    case 'founding':
      return /\bfounding\b/i.test(row.title)
    case 'midMarket':
      return row.segment === 'mid-market' && /account executive|\bAE\b/i.test(row.title)
    case 'aiNative':
      return row.ai_native === true
    case 'remote':
      return !row.location || /remote|anywhere/i.test(row.location)
    case 'topFit':
      return (row.fit_score ?? 0) >= 70
  }
}

/** Pure: counts how many rows pass each filter. */
export function computeCounts(rows: RoleRow[]): Record<FilterKey, number> {
  return {
    all: rows.length,
    founding: rows.filter((r) => rowMatches(r, 'founding')).length,
    midMarket: rows.filter((r) => rowMatches(r, 'midMarket')).length,
    aiNative: rows.filter((r) => rowMatches(r, 'aiNative')).length,
    remote: rows.filter((r) => rowMatches(r, 'remote')).length,
    topFit: rows.filter((r) => rowMatches(r, 'topFit')).length,
  }
}
