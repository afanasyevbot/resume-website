'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface OutcomeMenuProps {
  roleId: number
  status: string
}

const OUTCOMES = [
  { value: 'responded', label: 'They responded' },
  { value: 'interviewing', label: 'Interview booked' },
  { value: 'offer', label: 'Offer' },
  { value: 'rejected', label: 'Rejected' },
] as const

const ELIGIBLE = new Set(['applied', 'responded', 'interviewing', 'offer', 'rejected'])

/**
 * "Log outcome" dropdown for applied roles — feeds the Responses KPI and makes
 * interviews measurable. Renders nothing for roles that haven't applied.
 */
export default function OutcomeMenu({ roleId, status }: OutcomeMenuProps) {
  const router = useRouter()
  const [phase, setPhase] = useState<'idle' | 'saving' | 'error'>('idle')
  const [error, setError] = useState('')

  if (!ELIGIBLE.has(status.toLowerCase())) return null

  async function log(outcome: string) {
    if (!outcome) return
    setPhase('saving')
    setError('')
    try {
      const res = await fetch(`/api/engine/roles/${roleId}/outcome`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outcome }),
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

  return (
    <div className="flex flex-col items-end gap-1">
      <select
        defaultValue=""
        disabled={phase === 'saving'}
        onChange={(e) => log(e.target.value)}
        className="text-[11px] font-medium px-2 py-1.5 rounded"
        style={{
          fontFamily: 'var(--font-sans)',
          backgroundColor: 'transparent',
          color: 'var(--color-text-secondary)',
          border: '1px solid var(--color-border)',
          cursor: phase === 'saving' ? 'wait' : 'pointer',
          letterSpacing: '0.04em',
        }}
      >
        <option value="" disabled>
          {phase === 'saving' ? 'Saving…' : 'Log outcome…'}
        </option>
        {OUTCOMES.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {phase === 'error' && (
        <p
          className="text-[10px] text-right"
          style={{ color: '#d49a8a', fontFamily: 'var(--font-sans)', maxWidth: 200 }}
        >
          {error}
        </p>
      )}
    </div>
  )
}
