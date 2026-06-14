'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ResearchReport {
  queriesRun: number
  resultsFound: number
  newUrls: number
  relevant: number
  scored: number
  tailored: number
  lookalikeCount: number
  errors: string[]
  durationMs: number
}

export default function ResearchAction() {
  const router = useRouter()
  const [phase, setPhase] = useState<'idle' | 'researching' | 'done' | 'error'>('idle')
  const [error, setError] = useState('')
  const [report, setReport] = useState<ResearchReport | null>(null)

  async function research() {
    setPhase('researching')
    setError('')
    setReport(null)
    try {
      const res = await fetch('/api/engine/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error ?? `Failed (${res.status})`)
      }
      const data = (await res.json()) as ResearchReport
      setReport(data)
      setPhase('done')
      router.refresh()
      setTimeout(() => setPhase('idle'), 8000)
    } catch (err) {
      setPhase('error')
      setError(err instanceof Error ? err.message : 'Unknown error')
      setTimeout(() => setPhase('idle'), 6000)
    }
  }

  if (phase === 'researching') {
    return (
      <div
        className="flex items-center gap-2 text-[11px]"
        style={{ color: 'var(--color-gold)', fontFamily: 'var(--font-sans)' }}
      >
        <span
          className="inline-block w-2 h-2 rounded-full animate-pulse"
          style={{ backgroundColor: 'var(--color-gold)' }}
        />
        Researching…
      </div>
    )
  }

  if (phase === 'done' && report) {
    return (
      <div
        className="text-[11px] tabular-nums"
        style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-sans)' }}
      >
        <span style={{ color: 'var(--color-gold)' }}>+{report.scored}</span> found
        {report.tailored > 0 && (
          <span style={{ color: 'var(--color-text-dim)' }}> · {report.tailored} tailored</span>
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
      onClick={research}
      className="text-[11px] font-medium"
      style={{
        fontFamily: 'var(--font-sans)',
        color: 'var(--color-gold)',
        background: 'transparent',
        border: '1px solid var(--color-gold-dim)',
        padding: '4px 10px',
        borderRadius: 4,
        cursor: 'pointer',
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
      }}
      title="Search the open web for new AI sales roles matching your profile."
    >
      🔍 Research
    </button>
  )
}
