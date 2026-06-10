'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const SOURCES = [
  { value: 'manual', label: 'Manual' },
  { value: 'ats', label: 'ATS / Career page' },
  { value: 'email', label: 'Job-alert email' },
  { value: 'research', label: 'Research' },
] as const

type Phase = 'idle' | 'submitting' | 'error'

const INPUT_STYLE: React.CSSProperties = {
  fontFamily: 'var(--font-sans)',
  backgroundColor: 'var(--color-surface-deep)',
  border: '1px solid var(--color-border-inner)',
  borderRadius: 6,
  padding: '8px 10px',
  fontSize: 13,
  color: 'var(--color-text-bright)',
  width: '100%',
  outline: 'none',
}

const LABEL_STYLE: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--color-text-faint)',
  fontFamily: 'var(--font-sans)',
  marginBottom: 6,
}

interface AddRoleFormProps {
  /** Called by the parent's open/close toggle. */
  onClose: () => void
}

export default function AddRoleForm({ onClose }: AddRoleFormProps) {
  const router = useRouter()
  const [company, setCompany] = useState('')
  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('')
  const [url, setUrl] = useState('')
  const [source, setSource] = useState<(typeof SOURCES)[number]['value']>('manual')
  const [jobDescription, setJobDescription] = useState('')
  const [phase, setPhase] = useState<Phase>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const canSubmit =
    company.trim().length > 0 &&
    title.trim().length > 0 &&
    jobDescription.trim().length >= 30 &&
    phase !== 'submitting'

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setPhase('submitting')
    setErrorMsg('')
    try {
      const res = await fetch('/api/engine/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company, title, location, url, source, jobDescription }),
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error ?? `Request failed (${res.status})`)
      }
      // Reset + refresh
      setCompany('')
      setTitle('')
      setLocation('')
      setUrl('')
      setSource('manual')
      setJobDescription('')
      setPhase('idle')
      onClose()
      router.refresh()
    } catch (err) {
      setPhase('error')
      setErrorMsg(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  const submitting = phase === 'submitting'

  return (
    <form
      onSubmit={submit}
      className="px-5 py-4"
      style={{
        borderBottom: '1px dashed rgba(148,163,184,0.10)',
        backgroundColor: 'rgba(148,163,184,0.025)',
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label style={LABEL_STYLE}>Company *</label>
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Anthropic"
            disabled={submitting}
            style={INPUT_STYLE}
            autoFocus
          />
        </div>
        <div>
          <label style={LABEL_STYLE}>Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Mid-Market Account Executive"
            disabled={submitting}
            style={INPUT_STYLE}
          />
        </div>
        <div>
          <label style={LABEL_STYLE}>Location</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Remote · or Boston, MA"
            disabled={submitting}
            style={INPUT_STYLE}
          />
        </div>
        <div>
          <label style={LABEL_STYLE}>URL</label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            disabled={submitting}
            style={INPUT_STYLE}
          />
        </div>
        <div className="md:col-span-2">
          <label style={LABEL_STYLE}>Source</label>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value as (typeof SOURCES)[number]['value'])}
            disabled={submitting}
            style={{ ...INPUT_STYLE, paddingRight: 24 }}
          >
            {SOURCES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label style={LABEL_STYLE}>Job description *</label>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the full JD here. The matcher uses it to score fit against your profile."
            disabled={submitting}
            rows={8}
            style={{ ...INPUT_STYLE, resize: 'vertical', minHeight: 140, lineHeight: 1.5 }}
          />
          <p
            className="mt-1 text-[11px] tabular-nums"
            style={{ color: 'var(--color-text-ghost)', fontFamily: 'var(--font-sans)' }}
          >
            {jobDescription.length} chars · minimum 30
          </p>
        </div>
      </div>

      {phase === 'error' && (
        <p
          className="mt-3 text-[12px]"
          style={{ color: '#fca5a5', fontFamily: 'var(--font-sans)' }}
        >
          {errorMsg}
        </p>
      )}

      <div className="flex items-center justify-end gap-3 mt-4">
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          className="text-[12px]"
          style={{
            fontFamily: 'var(--font-sans)',
            color: 'var(--color-text-faint)',
            background: 'transparent',
            border: 'none',
            cursor: submitting ? 'not-allowed' : 'pointer',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!canSubmit}
          className="text-[12px] font-medium"
          style={{
            fontFamily: 'var(--font-sans)',
            backgroundColor: canSubmit ? 'var(--color-gold)' : 'rgba(148,163,184,0.30)',
            color: canSubmit ? '#1a1510' : 'var(--color-text-faint)',
            border: 'none',
            padding: '8px 18px',
            borderRadius: 6,
            cursor: canSubmit ? 'pointer' : 'not-allowed',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            transition: 'background-color 0.15s',
          }}
        >
          {submitting ? 'Scoring with Claude…' : 'Score & Save'}
        </button>
      </div>
    </form>
  )
}
