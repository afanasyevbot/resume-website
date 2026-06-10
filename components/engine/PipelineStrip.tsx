import Link from 'next/link'
import type { RoleRow, KpiCounts } from '@/lib/engine/dashboard'

interface PipelineStripProps {
  counts: KpiCounts
  rows: RoleRow[]
}

/** One thin line showing flow: found → strong → ready → applied → interviews. */
export default function PipelineStrip({ counts, rows }: PipelineStripProps) {
  const strong = rows.filter((r) => (r.fit_score ?? 0) >= 70).length
  const ready = rows.filter((r) => r.status === 'tailored' || r.status === 'awaiting_approval').length
  const interviews = rows.filter((r) => ['interviewing', 'offer'].includes(r.status)).length

  const stages = [
    { label: 'in pipeline', n: counts.sourced, color: '#64748b' },
    { label: 'strong fit', n: strong, color: '#2563eb' },
    { label: 'ready', n: ready, color: '#b45309' },
    { label: 'applied', n: counts.applied, color: '#16a34a' },
    { label: 'interviews', n: interviews, color: '#7c3aed' },
  ]

  return (
    <div className="flex items-stretch" style={{ fontFamily: 'var(--font-display)' }}>
      {stages.map((s, i) => (
        <div key={s.label} className="flex-1 flex items-center">
          <Link
            href="/engine/roles"
            className="flex-1 text-center py-2 block hover:opacity-75 transition-opacity"
            style={{ borderBottom: `3px solid ${s.color}`, textDecoration: 'none' }}
          >
            <span className="text-[18px] font-semibold tabular-nums" style={{ color: 'var(--color-text-bright)' }}>
              {s.n}
            </span>
            <span className="block text-[10px] uppercase mt-0.5" style={{ color: 'var(--color-text-faint)', letterSpacing: '0.12em' }}>
              {s.label}
            </span>
          </Link>
          {i < stages.length - 1 && (
            <span className="px-1.5 text-[12px]" style={{ color: 'var(--color-text-ghost)' }} aria-hidden>
              →
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
