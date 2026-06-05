'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface AutoApplyReport {
  applied: number
  skipped: number
  total: number
  dryRun: boolean
  results: Array<{
    company: string
    success: boolean
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
    return (
      <div
        className="text-[11px] tabular-nums"
        style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-sans)' }}
      >
        <span style={{ color: report.applied > 0 ? '#3f6a2c' : 'var(--color-text-dim)' }}>
          {report.applied} applied
        </span>
        {report.skipped > 0 && (
          <span style={{ color: 'var(--color-text-dim)' }}> · {report.skipped} skipped</span>
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
