'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  roleId: number
}

export default function PerRoleAutoApply({ roleId }: Props) {
  const router = useRouter()
  const [phase, setPhase] = useState<'idle' | 'running' | 'done' | 'error'>('idle')
  const [label, setLabel] = useState('')

  async function run() {
    setPhase('running')
    try {
      const res = await fetch('/api/engine/auto-apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleIds: [roleId], maxApply: 1 }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        applied?: number
        needsReview?: number
        skipped?: number
        failed?: number
        total?: number
        results?: Array<{ reason: string | null }>
        error?: string
        message?: string
      }
      if (!res.ok) throw new Error(data.error ?? `Failed (${res.status})`)
      const reason = data.results?.[0]?.reason ?? null
      if (data.applied === 1) {
        setLabel('✓ Applied')
      } else if (data.needsReview === 1) {
        setLabel('⚠ Needs review')
      } else if (data.skipped === 1) {
        setLabel(`Skipped${reason ? ` · ${reason}` : ''}`)
      } else if ((data.total ?? 0) === 0) {
        setLabel(data.message ?? 'Not eligible')
      } else if (data.failed === 1) {
        setLabel(`Error${reason ? ` · ${reason}` : ' · browser service unavailable'}`)
      } else {
        setLabel(reason ?? 'No result')
      }
      setPhase('done')
      router.refresh()
      setTimeout(() => setPhase('idle'), 10000)
    } catch (err) {
      setLabel(err instanceof Error ? err.message : 'Error')
      setPhase('error')
      setTimeout(() => setPhase('idle'), 6000)
    }
  }

  if (phase === 'running') {
    return (
      <div
        className="flex items-center gap-1.5 text-[11px]"
        style={{ color: 'var(--color-gold)', fontFamily: 'var(--font-sans)' }}
      >
        <span
          className="inline-block w-2 h-2 rounded-full animate-pulse"
          style={{ backgroundColor: 'var(--color-gold)' }}
        />
        Applying…
      </div>
    )
  }

  if (phase === 'done') {
    const isApplied = label.startsWith('✓')
    const isReview = label.startsWith('⚠')
    const isError = label.startsWith('Error') || label.startsWith('Not eligible')
    const bg = isApplied ? 'rgba(154,180,138,0.12)' : isReview ? 'rgba(184,134,42,0.12)' : 'rgba(168,70,58,0.10)'
    const color = isApplied ? '#9ab48a' : isReview ? '#c89418' : isError ? '#a8463a' : '#888'
    return (
      <span
        className="text-[11px] font-medium px-3 py-1.5 rounded"
        style={{ fontFamily: 'var(--font-sans)', backgroundColor: bg, color, letterSpacing: '0.06em', maxWidth: 280, display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        title={label}
      >
        {label}
      </span>
    )
  }

  if (phase === 'error') {
    return (
      <span
        className="text-[11px]"
        style={{ color: '#a8463a', fontFamily: 'var(--font-sans)' }}
      >
        {label}
      </span>
    )
  }

  return (
    <button
      onClick={run}
      className="text-[11px] font-medium px-3 py-1.5 rounded"
      style={{
        fontFamily: 'var(--font-sans)',
        color: '#fff',
        background: 'linear-gradient(90deg, #3f6a2c, #4f8038)',
        border: 'none',
        cursor: 'pointer',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
      }}
    >
      🚀 Apply
    </button>
  )
}
