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

/** A role the engine couldn't auto-submit (unknown ATS) — Matthew applies manually. */
export interface ManualApplyItem {
  type: 'manual'
  roleId: number
  company: string
  title: string
  fit: number | null
  reason: string | null
  url: string | null
}

/** A due follow-up with its outreach draft ready to send. */
export interface FollowUpItem {
  type: 'followup'
  reminder: Reminder
}

export type DeckItem = ApprovalItem | ManualApplyItem | FollowUpItem

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

  async function markApplied(item: ManualApplyItem) {
    setBusy('manual')
    // Open the job URL first so Matthew can apply
    if (item.url) window.open(item.url, '_blank', 'noopener,noreferrer')
    try {
      const res = await fetch(`/api/engine/roles/${item.roleId}/manual-apply`, { method: 'POST' })
      if (!res.ok) throw new Error(`Request failed (${res.status})`)
      advance(currentIdx, `Marked applied to ${item.company} — finish the form in the new tab.`)
    } catch (err) {
      setBusy(null)
      setNote(err instanceof Error ? err.message : 'Something went wrong.')
    }
  }

  async function passManual(item: ManualApplyItem) {
    setBusy('pass')
    try {
      const res = await fetch(`/api/engine/roles/${item.roleId}/manual-apply`, {
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
        else if (current.type === 'manual') markApplied(current)
        else copyAndComplete(current)
      } else if (e.key === 'Escape') {
        e.preventDefault()
        if (current.type === 'approval') pass(current)
        else if (current.type === 'manual') passManual(current)
        else snooze(current)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, busy])

  const label = { fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: '0.03em' } as const

  if (!current) {
    return (
      <div className="vellum px-8 py-12 text-center">
        <div
          aria-hidden
          className="mx-auto mb-4 flex items-center justify-center rounded-full"
          style={{ width: 44, height: 44, background: 'rgba(22,163,74,0.10)', color: '#16a34a', fontSize: 20 }}
        >
          ✓
        </div>
        <p className="eng-display text-[20px] mb-1">You&apos;re all caught up</p>
        <p className="text-[14px]" style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-sans)' }}>
          {note || 'Nothing needs you. The engine keeps working — check back after the next run.'}
        </p>
      </div>
    )
  }

  return (
    <div className="vellum px-8 py-8 text-center" style={{ boxShadow: '0 1px 2px rgba(60,50,35,0.04), 0 12px 40px -14px rgba(180,83,9,0.28)' }}>
      <p className="text-[12px] mb-5" style={{ ...label, color: 'var(--color-gold)' }}>
        Decision {position} of {items.length}
      </p>

      {current.type === 'approval' ? (
        <>
          <p className="eng-display text-[27px] mb-1" style={{ lineHeight: 1.1 }}>
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
              className="text-[13px] font-medium px-6 py-2.5 rounded-lg"
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
              className="text-[13px] font-medium px-5 py-2.5 rounded-lg"
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
              className="text-[13px] font-medium px-5 py-2.5 rounded-lg"
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
      ) : current.type === 'manual' ? (
        <>
          <p className="text-[11px] mb-1" style={{ ...label, color: '#2563eb' }}>
            Apply manually — engine couldn&apos;t auto-submit
          </p>
          <p className="eng-display text-[27px] mb-1 mt-3" style={{ lineHeight: 1.1 }}>
            {current.company}
          </p>
          <p className="text-[14px] mb-5" style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-sans)' }}>
            {current.title}
          </p>
          {current.fit != null && (
            <div className="flex items-center justify-center gap-4 mb-4">
              <span className="text-[34px] font-semibold tabular-nums" style={{ color: '#b45309', fontFamily: 'var(--font-display)' }}>
                {current.fit}
              </span>
              <span className="text-left text-[12.5px] leading-snug" style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-sans)' }}>
                fit score — cover letter &amp; resume ready
              </span>
            </div>
          )}
          {current.reason && (
            <p className="text-[13px] leading-relaxed mb-6 max-w-[480px] mx-auto" style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-sans)' }}>
              {current.reason}
            </p>
          )}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => markApplied(current)}
              disabled={!!busy}
              className="text-[13px] font-medium px-6 py-2.5 rounded-lg"
              style={{
                fontFamily: 'var(--font-sans)',
                backgroundColor: 'rgba(37,99,235,0.08)',
                color: '#1d4ed8',
                border: '1px solid rgba(37,99,235,0.30)',
                cursor: busy ? 'wait' : 'pointer',
              }}
            >
              {busy === 'manual' ? 'Opening…' : 'Open job & mark applied'}
            </button>
            <button
              onClick={() => passManual(current)}
              disabled={!!busy}
              className="text-[13px] font-medium px-5 py-2.5 rounded-lg"
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
              className="text-[13px] font-medium px-5 py-2.5 rounded-lg"
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
          <p className="eng-display text-[27px] mb-1" style={{ lineHeight: 1.1 }}>
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
              className="text-[13px] font-medium px-6 py-2.5 rounded-lg"
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
              className="text-[13px] font-medium px-5 py-2.5 rounded-lg"
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
      <p className="text-[11px] mt-5" style={{ color: 'var(--color-text-faint)', fontFamily: 'var(--font-sans)' }}>
        {current.type === 'approval' && 'Enter to apply · Esc to pass'}
        {current.type === 'manual' && 'Enter to open & apply · Esc to pass'}
        {current.type === 'followup' && 'Enter to copy & mark done · Esc to snooze'}
      </p>
    </div>
  )
}
