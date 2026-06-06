'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface FeedbackButtonsProps {
  roleId: number
  currentRating: 1 | -1 | null
}

/**
 * Thumbs-up / thumbs-down feedback for a role. Each click POSTs an append-only
 * 'rated' event; the visual reflects the LATEST stored rating. Posting again
 * with the same value is harmless (newest wins, identical value), and posting
 * the opposite simply layers a newer event — history is preserved on the
 * backend for eval purposes.
 */
export default function FeedbackButtons({ roleId, currentRating }: FeedbackButtonsProps) {
  const router = useRouter()
  const [pending, setPending] = useState<1 | -1 | null>(null)
  const [error, setError] = useState('')

  async function submit(rating: 1 | -1) {
    setPending(rating)
    setError('')
    try {
      const res = await fetch('/api/engine/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleId, rating }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(data.error ?? `Request failed (${res.status})`)
      }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setPending(null)
    }
  }

  const up = currentRating === 1
  const down = currentRating === -1

  // Color tokens — gold for thumbs-up, amber/dim for thumbs-down. Inactive
  // sits at a faint grey so the "set" state reads at a glance.
  const upColor = up ? '#d4b278' : 'var(--color-text-faint)'
  const downColor = down ? '#b88940' : 'var(--color-text-faint)'

  return (
    <div className="flex items-center gap-1" role="group" aria-label="Rate this role">
      <button
        type="button"
        onClick={() => submit(1)}
        aria-label="Good fit"
        aria-pressed={up}
        title="Good fit"
        disabled={pending !== null}
        className={`text-[14px] leading-none px-2 py-1.5 rounded ${
          pending === 1 ? 'animate-pulse' : ''
        }`}
        style={{
          fontFamily: 'var(--font-sans)',
          color: upColor,
          background: up ? 'rgba(212,178,120,0.10)' : 'transparent',
          border: `1px solid ${up ? 'rgba(212,178,120,0.30)' : 'var(--color-border)'}`,
          cursor: pending !== null ? 'wait' : 'pointer',
        }}
      >
        <span aria-hidden>👍</span>
      </button>
      <button
        type="button"
        onClick={() => submit(-1)}
        aria-label="Bad fit"
        aria-pressed={down}
        title="Bad fit"
        disabled={pending !== null}
        className={`text-[14px] leading-none px-2 py-1.5 rounded ${
          pending === -1 ? 'animate-pulse' : ''
        }`}
        style={{
          fontFamily: 'var(--font-sans)',
          color: downColor,
          background: down ? 'rgba(184,137,64,0.10)' : 'transparent',
          border: `1px solid ${down ? 'rgba(184,137,64,0.30)' : 'var(--color-border)'}`,
          cursor: pending !== null ? 'wait' : 'pointer',
        }}
      >
        <span aria-hidden>👎</span>
      </button>
      {error && (
        <span
          className="text-[10px] ml-1"
          style={{ color: '#d49a8a', fontFamily: 'var(--font-sans)' }}
        >
          {error}
        </span>
      )}
    </div>
  )
}
