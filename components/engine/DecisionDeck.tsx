'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Reminder } from '@/lib/engine/reminders'

/** A role held for Matthew's approval. */
export interface ApprovalItem {
  type: 'approval'
  roleId: number
  company: string
  title: string
  fit: number | null
  /** Top matcher reason — the "why" in one line. */
  reason: string | null
  summary: string | null
}

/** A due follow-up with its outreach draft ready to send. */
export interface FollowUpItem {
  type: 'followup'
  reminder: Reminder
}

export type DeckItem = ApprovalItem | FollowUpItem

interface DecisionDeckProps {
  items: DeckItem[]
}

/**
 * The decision deck: every call only Matthew can make, served one at a time.
 * Enter = primary action, Esc = pass/snooze. When the deck empties, he's done
 * for the day — that's the whole UX contract of the front page.
 */
export default function DecisionDeck({ items }: DecisionDeckProps) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [done, setDone] = useState<number[]>([])

  const remaining = items.map((it, i) => ({ it, i })).filter(({ i }) => !done.includes(i))
  const current = remaining[0]?.it ?? null
  const currentIdx = remaining[0]?.i ?? -1
  const position = done.length + 1

  const advance = useCallback((idx: number, message: string) => {
    setDone((d) => [...d, idx])
    setNote(message)
    setBusy(null)
    router.refresh()
  }, [router])

  async function approve(item: ApprovalItem) {
    setBusy('approve')
    setNote('Submitting application via the browser agent — this can take ~30s…')
    try {
      const res = await fetch(`/api/engine/approval/${item.roleId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      })
      const data = (await res.json().catch(() => ({}))) as { outcome?: string; reason?: string; error?: string }
      if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`)
      advance(
        currentIdx,
        data.outcome === 'applied'
          ? `✓ Applied to ${item.company}.`
          : `${item.company}: ${data.reason ?? data.outcome} — details on the role page.`,
      )
    } catch (err) {
      setBusy(null)
      setNote(err instanceof Error ? err.message : 'Something went wrong.')
    }
  }

  async function pass(item: ApprovalItem) {
    setBusy('pass')
    try {
      const res = await fetch(`/api/engine/approval/${item.roleId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'skip' }),
      })
      if (!res.ok) throw new Error(`Request failed (${res.status})`)
      advance(currentIdx, `Passed on ${item.company}.`)
    } catch (err) {
      setBusy(null)
      setNote(err instanceof Error ? err.message : 'Something went wrong.')
    }
  }

  async function copyAndComplete(item: FollowUpItem) {
    setBusy('copy')
    try {
      if (item.reminder.outreachDraft) {
        await navigator.clipboard.writeText(item.reminder.outreachDraft)
      }
      const res = await fetch(`/api/engine/reminders/${item.reminder.id}/complete`, { method: 'POST' })
      if (!res.ok) throw new Error(`Request failed (${res.status})`)
      advance(currentIdx, 'Draft copied — paste it into LinkedIn. Marked done.')
    } catch (err) {
      setBusy(null)
      setNote(err instanceof Error ? err.message : 'Something went wrong.')
    }
  }

  async function snooze(item: FollowUpItem) {
    setBusy('snooze')
    try {
      const res = await fetch(`/api/engine/reminders/${item.reminder.id}/snooze`, { method: 'POST' })
      if (!res.ok) throw new Error(`Request failed (${res.status})`)
      advance(currentIdx, 'Snoozed — it will come back tomorrow.')
    } catch (err) {
      setBusy(null)
      setNote(err instanceof Error ? err.message : 'Something went wrong.')
    }
  }

  // Keyboard: Enter = primary, Esc = pass/snooze
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!current || busy) return
      const target = e.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return
      if (e.key === 'Enter') {
        e.preventDefault()
        if (current.type === 'approval') approve(current)
        else copyAndComplete(current)
      } else if (e.key === 'Escape') {
        e.preventDefault()
        if (current.type === 'approval') pass(current)
        else snooze(current)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, busy])

  const label = { fontFamily: 'var(--font-display)', letterSpacing: '0.18em' } as const

  if (!current) {
    return (
      <div
        className="vellum rounded-xl px-8 py-10 text-center"
        style={{ border: '1px solid var(--color-border)' }}
      >
        <p className="text-[13px] uppercase mb-2" style={{ ...label, color: '#16a34a' }}>
          ✓ Deck clear
        </p>
        <p className="text-[15px]" style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-sans)' }}>
          {note || 'Nothing needs you. The engine keeps working — come back after the next run.'}
        </p>
      </div>
    )
  }

  return (
    <div
      className="vellum rounded-xl px-8 py-8 text-center"
      style={{ border: '1px solid rgba(180,83,9,0.30)' }}
    >
      <p className="text-[11px] uppercase mb-4" style={{ ...label, color: '#b45309' }}>
        Decision {position} of {items.length}
      </p>

      {current.type === 'approval' ? (
        <>
          <p className="text-[26px] font-semibold mb-1" style={{ color: 'var(--color-text-bright)', fontFamily: 'var(--font-sans)' }}>
            {current.company}
          </p>
          <p className="text-[14px] mb-5" style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-sans)' }}>
            {current.title}
          </p>
          <div className="flex items-center justify-center gap-4 mb-4">
            <span className="text-[34px] font-semibold tabular-nums" style={{ color: '#b45309', fontFamily: 'var(--font-display)' }}>
              {current.fit ?? '—'}
            </span>
            <span className="text-left text-[12.5px] leading-snug" style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-sans)' }}>
              held for your call — auto-applies at 75+
            </span>
          </div>
          {current.reason && (
            <p className="text-[13px] leading-relaxed mb-6 max-w-[480px] mx-auto" style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-sans)' }}>
              {current.reason}
            </p>
          )}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => approve(current)}
              disabled={!!busy}
              className="text-[13px] font-medium px-6 py-2.5 rounded"
              style={{
                fontFamily: 'var(--font-sans)',
                backgroundColor: 'rgba(22,163,74,0.08)',
                color: '#15803d',
                border: '1px solid rgba(22,163,74,0.30)',
                cursor: busy ? 'wait' : 'pointer',
              }}
            >
              {busy === 'approve' ? 'Submitting…' : 'Apply now'}
            </button>
            <button
              onClick={() => pass(current)}
              disabled={!!busy}
              className="text-[13px] font-medium px-5 py-2.5 rounded"
              style={{
                fontFamily: 'var(--font-sans)',
                backgroundColor: 'transparent',
                color: 'var(--color-text-secondary)',
                border: '1px solid var(--color-border)',
                cursor: busy ? 'wait' : 'pointer',
              }}
            >
              Pass
            </button>
            <Link
              href={`/engine/roles/${current.roleId}`}
              className="text-[13px] font-medium px-5 py-2.5 rounded"
              style={{
                fontFamily: 'var(--font-sans)',
                color: 'var(--color-text-secondary)',
                border: '1px solid var(--color-border)',
                textDecoration: 'none',
              }}
            >
              Why?
            </Link>
          </div>
        </>
      ) : (
        <>
          <p className="text-[26px] font-semibold mb-1" style={{ color: 'var(--color-text-bright)', fontFamily: 'var(--font-sans)' }}>
            {current.reminder.company ?? 'Follow up'}
          </p>
          <p className="text-[14px] mb-5" style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-sans)' }}>
            {current.reminder.kind === 'linkedin_follow_up' ? 'LinkedIn follow-up due' : 'Check-in due'}
            {current.reminder.title ? ` · ${current.reminder.title}` : ''}
          </p>
          {current.reminder.outreachDraft && (
            <p
              className="text-[13px] leading-relaxed mb-6 max-w-[520px] mx-auto text-left rounded px-4 py-3"
              style={{
                color: 'var(--color-text-primary)',
                fontFamily: 'var(--font-sans)',
                backgroundColor: 'var(--color-surface-deep)',
                border: '1px solid var(--color-border-inner)',
              }}
            >
              {current.reminder.outreachDraft}
            </p>
          )}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => copyAndComplete(current)}
              disabled={!!busy}
              className="text-[13px] font-medium px-6 py-2.5 rounded"
              style={{
                fontFamily: 'var(--font-sans)',
                backgroundColor: 'rgba(22,163,74,0.08)',
                color: '#15803d',
                border: '1px solid rgba(22,163,74,0.30)',
                cursor: busy ? 'wait' : 'pointer',
              }}
            >
              {busy === 'copy' ? 'Copying…' : 'Copy draft & mark done'}
            </button>
            <button
              onClick={() => snooze(current)}
              disabled={!!busy}
              className="text-[13px] font-medium px-5 py-2.5 rounded"
              style={{
                fontFamily: 'var(--font-sans)',
                backgroundColor: 'transparent',
                color: 'var(--color-text-secondary)',
                border: '1px solid var(--color-border)',
                cursor: busy ? 'wait' : 'pointer',
              }}
            >
              Snooze
            </button>
          </div>
        </>
      )}

      {note && (
        <p className="text-[12px] mt-4" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)' }}>
          {note}
        </p>
      )}
      <p className="text-[11px] mt-4" style={{ color: 'var(--color-text-ghost)', fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>
        enter = {current.type === 'approval' ? 'apply' : 'copy & done'} · esc = {current.type === 'approval' ? 'pass' : 'snooze'}
      </p>
    </div>
  )
}
