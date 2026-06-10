'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ApplyActionProps {
  roleId: number
  status: string
}

/** Statuses that mean the role is already at or beyond "applied". */
const APPLIED_OR_BEYOND = new Set([
  'applied',
  'responded',
  'interviewing',
  'offer',
  'rejected',
])

/**
 * Right-column action for marking a role as applied. Renders either:
 *  - "✓ Applied" badge (sage) when status is already at/past applied, or
 *  - "Mark applied" button that POSTs /api/engine/apply and refreshes the route.
 */
export default function ApplyAction({ roleId, status }: ApplyActionProps) {
  const router = useRouter()
  const [phase, setPhase] = useState<'idle' | 'applying' | 'error'>('idle')
  const [error, setError] = useState('')

  if (APPLIED_OR_BEYOND.has(status.toLowerCase())) {
    return (
      <span
        className="inline-flex items-center text-[10px] font-medium px-2 py-1 rounded"
        style={{
          fontFamily: 'var(--font-sans)',
          backgroundColor: 'rgba(74,222,128,0.10)',
          color: '#6ee7a0',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        ✓ Applied
      </span>
    )
  }

  async function markApplied() {
    setPhase('applying')
    setError('')
    try {
      const res = await fetch('/api/engine/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleId }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(data.error ?? `Request failed (${res.status})`)
      }
      setPhase('idle')
      router.refresh()
    } catch (err) {
      setPhase('error')
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  if (phase === 'applying') {
    return (
      <div
        className="flex items-center gap-2 text-[11px]"
        style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-sans)' }}
      >
        <span
          className="inline-block w-2 h-2 rounded-full animate-pulse"
          style={{ backgroundColor: 'var(--color-text-secondary)' }}
        />
        Marking…
      </div>
    )
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={markApplied}
        className="text-[11px] font-medium px-3 py-1.5 rounded"
        style={{
          fontFamily: 'var(--font-sans)',
          backgroundColor: 'transparent',
          color: 'var(--color-text-secondary)',
          border: '1px solid var(--color-border)',
          cursor: 'pointer',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        Mark applied
      </button>
      {phase === 'error' && (
        <p
          className="text-[10px] text-right"
          style={{ color: '#fca5a5', fontFamily: 'var(--font-sans)', maxWidth: 200 }}
        >
          {error}
        </p>
      )}
    </div>
  )
}
