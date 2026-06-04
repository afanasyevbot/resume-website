'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { TailoredPackage } from '@/lib/engine/tailorTypes'

interface TailorActionProps {
  roleId: number
  /** Whether a package already exists for this role (data-driven). */
  hasPackage: boolean
  /** Parent-controlled expand state when a package is present. */
  expanded: boolean
  onToggleExpanded: () => void
}

/**
 * The right-column action button. Data-driven:
 *  - no package yet → "Tailor" (triggers /api/engine/tailor, then refresh)
 *  - package exists → "View / Hide package" (toggles parent's expanded state)
 */
export default function TailorAction({
  roleId,
  hasPackage,
  expanded,
  onToggleExpanded,
}: TailorActionProps) {
  const router = useRouter()
  const [phase, setPhase] = useState<'idle' | 'tailoring' | 'error'>('idle')
  const [error, setError] = useState('')

  async function tailor() {
    setPhase('tailoring')
    setError('')
    try {
      const res = await fetch('/api/engine/tailor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleId }),
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error ?? `Request failed (${res.status})`)
      }
      setPhase('idle')
      router.refresh() // parent reload picks up the new package
    } catch (err) {
      setPhase('error')
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  if (phase === 'tailoring') {
    return (
      <div
        className="flex items-center gap-2 text-[11px]"
        style={{ color: 'var(--color-gold)', fontFamily: 'var(--font-sans)' }}
      >
        <span
          className="inline-block w-2 h-2 rounded-full animate-pulse"
          style={{ backgroundColor: 'var(--color-gold)' }}
        />
        Tailoring…
      </div>
    )
  }

  if (hasPackage) {
    return (
      <button
        onClick={onToggleExpanded}
        className="text-[11px] font-medium px-3 py-1.5 rounded"
        style={{
          fontFamily: 'var(--font-sans)',
          backgroundColor: 'transparent',
          color: 'var(--color-gold)',
          border: '1px solid var(--color-gold-dim)',
          cursor: 'pointer',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
        aria-expanded={expanded}
      >
        {expanded ? 'Hide' : 'View package'}
      </button>
    )
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={tailor}
        className="text-[11px] font-medium px-3 py-1.5 rounded"
        style={{
          fontFamily: 'var(--font-sans)',
          backgroundColor: 'var(--color-gold)',
          color: '#1a1510',
          border: 'none',
          cursor: 'pointer',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        Tailor
      </button>
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

/** Inline package panel rendered BELOW the row when expanded. */
export function TailorPackagePanel({ pkg }: { pkg: TailoredPackage }) {
  return (
    <div
      className="grid grid-cols-1 lg:grid-cols-2 gap-5 px-5 py-5"
      style={{
        borderTop: '1px dashed rgba(212,178,120,0.10)',
        backgroundColor: 'rgba(212,178,120,0.025)',
      }}
    >
      <Artifact title={`Summary · ${archetypeLabel(pkg.archetype)}`} content={pkg.summary} />
      <Artifact
        title="Emphasized bullets"
        content={(pkg.emphasizedBullets ?? []).map((b) => `• ${b}`).join('\n')}
      />
      <Artifact title="Cover letter" content={pkg.coverLetter} />
      <Artifact title="Outreach draft" content={pkg.outreachDraft} />
      {(pkg.notes?.length ?? 0) > 0 && (
        <div className="lg:col-span-2">
          <p
            className="text-[11px] uppercase tracking-widest"
            style={{
              color: 'var(--color-text-faint)',
              fontFamily: 'var(--font-sans)',
              letterSpacing: '0.14em',
            }}
          >
            Honest gaps
          </p>
          <ul
            className="mt-2 space-y-1 text-[12px]"
            style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)' }}
          >
            {(pkg.notes ?? []).map((n, i) => (
              <li key={i}>· {n}</li>
            ))}
          </ul>
        </div>
      )}
      {(pkg.lintIssues?.length ?? 0) > 0 && (
        <div className="lg:col-span-2">
          <p
            className="text-[11px] uppercase tracking-widest"
            style={{ color: '#d49a8a', fontFamily: 'var(--font-sans)', letterSpacing: '0.14em' }}
          >
            Lint issues still present
          </p>
          <ul
            className="mt-2 space-y-1 text-[12px]"
            style={{ color: '#d49a8a', fontFamily: 'var(--font-sans)' }}
          >
            {(pkg.lintIssues ?? []).map((n, i) => (
              <li key={i}>· {n}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function archetypeLabel(a: string): string {
  if (a === 'revenue-x-ai') return 'Revenue × AI builder'
  if (a === 'claude-code-sidebar') return 'AI-forward sidebar'
  return 'Classic ATS'
}

function Artifact({ title, content }: { title: string; content: string }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <p
          className="text-[11px] uppercase tracking-widest"
          style={{
            color: 'var(--color-text-faint)',
            fontFamily: 'var(--font-sans)',
            letterSpacing: '0.14em',
          }}
        >
          {title}
        </p>
        <CopyButton text={content} />
      </div>
      <p
        className="mt-2 text-[12px] whitespace-pre-wrap leading-relaxed"
        style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-sans)' }}
      >
        {content}
      </p>
    </div>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <button
      onClick={copy}
      className="text-[10px]"
      style={{
        fontFamily: 'var(--font-sans)',
        color: copied ? 'var(--color-gold)' : 'var(--color-text-ghost)',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
      }}
    >
      {copied ? 'Copied ✓' : 'Copy'}
    </button>
  )
}
