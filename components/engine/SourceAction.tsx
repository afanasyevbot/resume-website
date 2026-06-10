'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface SourcingReport {
  totalScored: number
  totalSkippedDuplicate: number
  totalSkippedIrrelevant: number
  totalErrors: number
  capHit: boolean
  durationMs: number
}

export default function SourceAction() {
  const router = useRouter()
  const [phase, setPhase] = useState<'idle' | 'sourcing' | 'done' | 'error'>('idle')
  const [error, setError] = useState('')
  const [report, setReport] = useState<SourcingReport | null>(null)

  async function source() {
    setPhase('sourcing')
    setError('')
    setReport(null)
    try {
      const res = await fetch('/api/engine/source', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error ?? `Request failed (${res.status})`)
      }
      const data = (await res.json()) as SourcingReport
      setReport(data)
      setPhase('done')
      router.refresh()
      // auto-clear after 8s
      setTimeout(() => setPhase('idle'), 8000)
    } catch (err) {
      setPhase('error')
      setError(err instanceof Error ? err.message : 'Unknown error')
      setTimeout(() => setPhase('idle'), 6000)
    }
  }

  if (phase === 'sourcing') {
    return (
      <div
        className="flex items-center gap-2 text-[11px]"
        style={{ color: 'var(--color-gold)', fontFamily: 'var(--font-sans)' }}
      >
        <span
          className="inline-block w-2 h-2 rounded-full animate-pulse"
          style={{ backgroundColor: 'var(--color-gold)' }}
        />
        Sourcing…
      </div>
    )
  }

  if (phase === 'done' && report) {
    return (
      <div
        className="text-[11px] tabular-nums"
        style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-sans)' }}
      >
        <span style={{ color: 'var(--color-gold)' }}>+{report.totalScored}</span> scored
        <span style={{ color: 'var(--color-text-ghost)' }}>
          {' · '}
          {report.totalSkippedDuplicate} dupes · {report.totalSkippedIrrelevant} skipped
          {report.totalErrors > 0 ? ` · ${report.totalErrors} errors` : ''}
        </span>
      </div>
    )
  }

  if (phase === 'error') {
    return (
      <span
        className="text-[11px]"
        style={{ color: '#fca5a5', fontFamily: 'var(--font-sans)' }}
      >
        {error}
      </span>
    )
  }

  // idle
  return (
    <button
      onClick={source}
      className="text-[11px] font-medium"
      style={{
        fontFamily: 'var(--font-sans)',
        color: 'var(--color-gold)',
        background: 'transparent',
        border: '1px solid var(--color-gold-dim)',
        padding: '4px 10px',
        borderRadius: 4,
        cursor: 'pointer',
        letterSpacing: '0.10em',
        textTransform: 'uppercase',
        transition: 'color 0.15s, border-color 0.15s',
      }}
      title="Poll your target companies' ATS boards for new openings, score the relevant ones."
    >
      Source
    </button>
  )
}
