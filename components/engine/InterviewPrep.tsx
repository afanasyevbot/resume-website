'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { InterviewPrep as Prep } from '@/lib/engine/interviewPrep'

/**
 * On-demand interview prep for a role: generates (and persists) a prep sheet
 * from Matthew's profile + the JD, then renders it. Low-volume by design, so it
 * runs only when Matthew clicks — only roles that reach an interview cost a call.
 */
export default function InterviewPrep({
  roleId,
  initialPrep,
}: {
  roleId: number
  initialPrep: Prep | null
}) {
  const router = useRouter()
  const [prep, setPrep] = useState<Prep | null>(initialPrep)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function generate() {
    setBusy(true)
    setErr('')
    try {
      const res = await fetch(`/api/engine/roles/${roleId}/interview-prep`, { method: 'POST' })
      const data = (await res.json().catch(() => ({}))) as { prep?: Prep; error?: string }
      if (!res.ok || !data.prep) throw new Error(data.error ?? `Request failed (${res.status})`)
      setPrep(data.prep)
      router.refresh()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <p className="text-[12px]" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)' }}>
          Likely questions with answer angles, honest objection handling, and what to ask — from your profile and this JD.
        </p>
        <button
          onClick={generate}
          disabled={busy}
          className="text-[11px] font-medium px-4 py-2 rounded whitespace-nowrap"
          style={{
            fontFamily: 'var(--font-sans)',
            color: 'var(--color-text-bright)',
            background: 'transparent',
            border: '1px solid var(--color-border)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            cursor: busy ? 'wait' : 'pointer',
          }}
        >
          {busy ? 'Generating…' : prep ? 'Regenerate' : 'Generate prep'}
        </button>
      </div>

      {err && (
        <p className="text-[12px] mb-3" style={{ color: '#c0564b', fontFamily: 'var(--font-sans)' }}>
          {err}
        </p>
      )}

      {prep ? (
        <div className="flex flex-col gap-5">
          <Section label="Why this company">
            <p className="text-[13px] leading-relaxed" style={{ color: 'var(--color-text-primary)' }}>
              {prep.whyThisCompany}
            </p>
          </Section>

          <Section label="Likely questions">
            <ul className="flex flex-col gap-3">
              {prep.likelyQuestions.map((q, i) => (
                <li key={i}>
                  <p className="text-[13px] font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    {q.question}
                  </p>
                  <p className="text-[12px] leading-relaxed mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                    {q.angle}
                  </p>
                </li>
              ))}
            </ul>
          </Section>

          <Section label="Objections & honest answers">
            <ul className="flex flex-col gap-3">
              {prep.objections.map((o, i) => (
                <li key={i}>
                  <p className="text-[13px] font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    {o.objection}
                  </p>
                  <p className="text-[12px] leading-relaxed mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                    {o.response}
                  </p>
                </li>
              ))}
            </ul>
          </Section>

          <Section label="Questions to ask them">
            <ul className="flex flex-col gap-1.5 list-disc pl-4">
              {prep.questionsToAsk.map((q, i) => (
                <li key={i} className="text-[13px] leading-relaxed" style={{ color: 'var(--color-text-primary)' }}>
                  {q}
                </li>
              ))}
            </ul>
          </Section>
        </div>
      ) : (
        !busy && (
          <p className="text-[12px] italic" style={{ color: 'var(--color-text-ghost)', fontFamily: 'var(--font-sans)' }}>
            No prep yet. Generate it when you land the interview.
          </p>
        )
      )}
    </div>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p
        className="text-[10px] font-medium uppercase mb-1.5"
        style={{ color: 'var(--color-text-faint)', fontFamily: 'var(--font-sans)', letterSpacing: '0.06em' }}
      >
        {label}
      </p>
      {children}
    </div>
  )
}
