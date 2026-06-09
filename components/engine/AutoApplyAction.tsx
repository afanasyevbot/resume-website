'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface AutoApplyReport {
  applied: number
  needsReview: number
  skipped: number
  failed: number
  total: number
  dryRun: boolean
  message?: string
  results: Array<{
    company: string
    title: string
    success: boolean
    needsReview: boolean
    skipped: boolean
    failed: boolean
    reason: string | null
  }>
}

export default function AutoApplyAction() {
  const router = useRouter()
  const [phase, setPhase] = useState<'idle' | 'running' | 'done' | 'error'>('idle')
  const [report, setReport] = useState<AutoApplyReport | null>(null)
  const [error, setError] = useState('')

  async function run() {
    setPhase('running')
    setError('')
    setReport(null)
    try {
      const res = await fetch('/api/engine/auto-apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maxApply: 5 }),
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error ?? `Failed (${res.status})`)
      }
      const data = (await res.json()) as AutoApplyReport
      setReport(data)
      setPhase('done')
      router.refresh()
      setTimeout(() => setPhase('idle'), 12000)
    } catch (err) {
      setPhase('error')
      setError(err instanceof Error ? err.message : 'Unknown error')
      setTimeout(() => setPhase('idle'), 8000)
    }
  }

  if (phase === 'running') {
    return (
      <div
        className="flex items-center gap-2 text-[11px]"
        style={{ color: 'var(--color-gold)', fontFamily: 'var(--font-sans)' }}
      >
        <span
          className="inline-block w-2 h-2 rounded-full animate-pulse"
          style={{ backgroundColor: 'var(--color-gold)' }}
        />
        Auto-applying…
      </div>
    )
  }

  if (phase === 'done' && report) {
    if (report.total === 0) {
      return (
        <span
          className="text-[11px]"
          style={{ color: 'var(--color-text-dim)', fontFamily: 'var(--font-sans)' }}
        >
          {report.message ?? 'No eligible roles (need tailored + Greenhouse/Ashby URL)'}
        </span>
      )
    }
    return (
      <div style={{ fontFamily: 'var(--font-sans)' }}>
        <div className="text-[11px] tabular-nums" style={{ color: 'var(--color-text-secondary)' }}>
          <span style={{ color: report.applied > 0 ? '#9ab48a' : 'var(--color-text-dim)' }}>
            {report.applied} applied
          </span>
          {report.needsReview > 0 && (
            <span style={{ color: '#c89418' }}> · {report.needsReview} to verify</span>
          )}
          {report.skipped > 0 && (
            <span style={{ color: 'var(--color-text-dim)' }}> · {report.skipped} skipped</span>
          )}
          {report.failed > 0 && (
            <span style={{ color: '#a8463a' }}> · {report.failed} error</span>
          )}
        </div>
        {report.results.length > 0 && (
          <div className="mt-1" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {report.results.map((r, i) => {
              const icon = r.success ? '✓' : r.needsReview ? '⚠' : r.failed ? '✗' : '–'
              const color = r.success ? '#9ab48a' : r.needsReview ? '#c89418' : r.failed ? '#a8463a' : '#888'
              return (
                <div key={i} className="text-[10px]" style={{ color, lineHeight: 1.4 }}>
                  {icon} {r.company}
                  {r.reason && <span style={{ color: '#666', marginLeft: 4 }}>· {r.reason}</span>}
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  if (phase === 'error') {
    return (
      <span className="text-[11px]" style={{ color: '#a8463a', fontFamily: 'var(--font-sans)' }}>
        {error}
      </span>
    )
  }

  return (
    <button
      onClick={run}
      className="text-[11px] font-medium"
      style={{
        fontFamily: 'var(--font-sans)',
        color: '#fff',
        background: 'linear-gradient(90deg, #3f6a2c, #4f8038)',
        border: 'none',
        padding: '5px 12px',
        borderRadius: 4,
        cursor: 'pointer',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
      }}
      title="Auto-submit tailored roles to Greenhouse/Ashby. Safe whitelist only."
    >
      🚀 Auto-Apply
    </button>
  )
}
