import Link from 'next/link'
import type { RoleRow, KpiCounts } from '@/lib/engine/dashboard'

interface PipelineStripProps {
  counts: KpiCounts
  rows: RoleRow[]
}

/** The funnel at a glance: found → strong → ready → applied → interviews. */
export default function PipelineStrip({ counts, rows }: PipelineStripProps) {
  const strong = rows.filter((r) => (r.fit_score ?? 0) >= 70).length
  const ready = rows.filter((r) => r.status === 'tailored' || r.status === 'awaiting_approval').length
  const interviews = rows.filter((r) => ['interviewing', 'offer'].includes(r.status)).length

  const stages = [
    { label: 'In pipeline', n: counts.sourced, color: '#64748b' },
    { label: 'Strong fit', n: strong, color: '#2563eb' },
    { label: 'Ready', n: ready, color: '#b45309' },
    { label: 'Applied', n: counts.applied, color: '#16a34a' },
    { label: 'Interviews', n: interviews, color: '#7c3aed' },
  ]

  return (
    <div className="grid grid-cols-5 gap-3">
      {stages.map((s) => (
        <Link
          key={s.label}
          href="/engine/roles"
          className="vellum block rounded-2xl px-4 py-4 transition-transform hover:-translate-y-0.5"
          style={{ textDecoration: 'none' }}
        >
          <span className="flex items-center gap-2">
            <span style={{ width: 7, height: 7, borderRadius: 999, background: s.color, display: 'inline-block' }} aria-hidden />
            <span className="text-[11px]" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)' }}>{s.label}</span>
          </span>
          <span className="eng-display block mt-2" style={{ fontSize: 30, lineHeight: 1 }}>
            {s.n}
          </span>
        </Link>
      ))}
    </div>
  )
}
