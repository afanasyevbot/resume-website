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
        error?: string
      }
      if (!res.ok) throw new Error(data.error ?? `Failed (${res.status})`)
      if (data.applied === 1) {
        setLabel('✓ Applied')
      } else if (data.needsReview === 1) {
        setLabel('⚠ Review')
      } else {
        setLabel('Skipped')
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
    return (
      <span
        className="text-[11px] font-medium px-3 py-1.5 rounded"
        style={{
          fontFamily: 'var(--font-sans)',
          backgroundColor: label.startsWith('✓')
            ? 'rgba(154,180,138,0.12)'
            : 'rgba(184,134,42,0.12)',
          color: label.startsWith('✓') ? '#9ab48a' : '#c89418',
          letterSpacing: '0.06em',
        }}
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
