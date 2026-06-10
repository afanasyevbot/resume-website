'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ApprovalActionProps {
  roleId: number
}

/**
 * Approve / Skip buttons for roles parked in 'awaiting_approval'.
 * Approve submits the application via the browser agent (slow — show progress);
 * Skip archives the role. Both disable on first click; the API's atomic claim
 * makes a stray double-click a safe no-op anyway.
 */
export default function ApprovalAction({ roleId }: ApprovalActionProps) {
  const router = useRouter()
  const [phase, setPhase] = useState<'idle' | 'approving' | 'skipping' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function act(action: 'approve' | 'skip') {
    setPhase(action === 'approve' ? 'approving' : 'skipping')
    setMessage('')
    try {
      const res = await fetch(`/api/engine/approval/${roleId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        error?: string
        outcome?: string
        reason?: string
      }
      if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`)
      setPhase('done')
      setMessage(
        data.outcome === 'applied'
          ? '✓ Applied'
          : data.outcome === 'skipped'
            ? 'Skipped'
            : `${data.outcome}: ${data.reason ?? 'see role'}`,
      )
      router.refresh()
    } catch (err) {
      setPhase('error')
      setMessage(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  if (phase === 'approving' || phase === 'skipping') {
    return (
      <div
        className="flex items-center gap-2 text-[11px]"
        style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-sans)' }}
      >
        <span
          className="inline-block w-2 h-2 rounded-full animate-pulse"
          style={{ backgroundColor: '#c8901a' }}
        />
        {phase === 'approving' ? 'Submitting application…' : 'Skipping…'}
      </div>
    )
  }

  if (phase === 'done') {
    return (
      <span
        className="text-[11px] font-medium"
        style={{ color: '#9ab48a', fontFamily: 'var(--font-sans)' }}
      >
        {message}
      </span>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => act('approve')}
        className="text-[11px] font-medium px-3 py-1.5 rounded"
        style={{
          fontFamily: 'var(--font-sans)',
          backgroundColor: 'rgba(200,144,26,0.15)',
          color: '#c8901a',
          border: '1px solid rgba(200,144,26,0.4)',
          cursor: 'pointer',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        ✓ Approve &amp; submit
      </button>
      <button
        onClick={() => act('skip')}
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
        Skip
      </button>
      {phase === 'error' && (
        <p
          className="text-[10px]"
          style={{ color: '#d49a8a', fontFamily: 'var(--font-sans)', maxWidth: 220 }}
        >
          {message}
        </p>
      )}
    </div>
  )
}
