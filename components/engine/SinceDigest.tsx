import type { VisitDigest } from '@/lib/engine/visit'

/**
 * Tiny one-line "since last visit" report. Sits below the title.
 * Goes silent when there's nothing new — quiet by design.
 */
export default function SinceDigest({ digest }: { digest: VisitDigest }) {
  // First-ever visit — nothing to compare against.
  if (!digest.since) {
    return (
      <p
        className="text-[12px] mt-3"
        style={{
          color: 'var(--color-text-faint)',
          fontFamily: 'var(--font-sans)',
        }}
      >
        Welcome to your engine.
      </p>
    )
  }

  if (!digest.hasUpdates) {
    return (
      <p
        className="text-[12px] mt-3"
        style={{
          color: 'var(--color-text-ghost)',
          fontFamily: 'var(--font-sans)',
        }}
      >
        Nothing new since you checked in {digest.sinceLabel} ago.
      </p>
    )
  }

  const parts: Array<{ label: string; value: number; gold?: boolean }> = [
    { label: 'sourced', value: digest.sourced },
    { label: 'tailored', value: digest.tailored, gold: true },
    { label: 'applied', value: digest.applied, gold: true },
    { label: 'response', value: digest.responded, gold: true },
  ].filter((p) => p.value > 0)

  return (
    <div
      className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3 text-[12px]"
      style={{ fontFamily: 'var(--font-sans)' }}
    >
      <span style={{ color: 'var(--color-text-dim)' }}>
        Since {digest.sinceLabel} ago:
      </span>
      {parts.map((p, i) => (
        <span
          key={p.label}
          className="flex items-center gap-1.5 tabular-nums"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <span
            aria-hidden
            className="inline-block w-1.5 h-1.5 rounded-full"
            style={{
              backgroundColor: p.gold
                ? 'var(--color-gold)'
                : 'var(--color-text-faint)',
            }}
          />
          <span style={{ color: 'var(--color-text-bright)' }}>{p.value}</span>
          <span style={{ color: 'var(--color-text-faint)' }}>{p.label}</span>
          {i < parts.length - 1 && (
            <span style={{ color: 'var(--color-text-whisper)', marginLeft: 6 }}>
              ·
            </span>
          )}
        </span>
      ))}
    </div>
  )
}
