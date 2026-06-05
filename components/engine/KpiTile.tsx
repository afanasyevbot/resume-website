interface KpiTileProps {
  label: string
  value: number
  delta?: number
  subtext?: string
  actionable?: boolean
  /** When provided, the tile becomes a button that filters the queue. */
  onClick?: () => void
  /** Highlight when this tile's view is the active queue filter. */
  active?: boolean
}

export default function KpiTile({
  label,
  value,
  delta,
  subtext,
  actionable = false,
  onClick,
  active = false,
}: KpiTileProps) {
  const hasData = value > 0

  function renderDeltaLine() {
    if (!hasData) {
      return (
        <p
          className="text-[11px] mt-1"
          style={{ color: 'var(--color-text-ghost)', fontFamily: 'var(--font-sans)' }}
        >
          — awaiting sourcing —
        </p>
      )
    }
    if (subtext) {
      return (
        <p
          className="text-[11px] mt-1 tabular-nums"
          style={{
            color: actionable ? 'var(--color-gold)' : 'var(--color-text-dim)',
            fontFamily: 'var(--font-sans)',
          }}
        >
          {subtext}
        </p>
      )
    }
    if (delta !== undefined) {
      if (delta === 0) {
        return (
          <p
            className="text-[11px] mt-1 tabular-nums"
            style={{ color: 'var(--color-text-faint)', fontFamily: 'var(--font-sans)' }}
          >
            → no change · 7d
          </p>
        )
      }
      return (
        <p
          className="text-[11px] mt-1 tabular-nums"
          style={{ color: 'var(--color-text-dim)', fontFamily: 'var(--font-sans)' }}
        >
          ↑ {delta} · last 7 days
        </p>
      )
    }
    return null
  }

  const Tag = onClick ? 'button' : 'div'

  return (
    <Tag
      onClick={onClick}
      className="vellum relative flex flex-col p-5 rounded-lg overflow-hidden text-left transition-shadow"
      style={{
        border: active
          ? '1px solid var(--color-gold)'
          : '1px solid var(--color-border)',
        cursor: onClick ? 'pointer' : 'default',
        boxShadow: active ? '0 0 0 1px var(--color-gold), 0 1px 2px rgba(0,0,0,0.22)' : undefined,
      }}
      aria-pressed={onClick ? active : undefined}
    >
      {/* Label */}
      <p
        className="text-[11px] font-medium uppercase tracking-widest"
        style={{
          color: actionable ? 'var(--color-gold)' : 'var(--color-text-faint)',
          fontFamily: 'var(--font-sans)',
          letterSpacing: '0.12em',
        }}
      >
        {label}
      </p>

      {/* Value */}
      <p
        className="text-[44px] leading-none mt-2 tabular-nums font-medium"
        style={{
          fontFamily: 'var(--font-display)',
          color: 'var(--color-text-bright)',
        }}
      >
        {value}
      </p>

      {/* Delta / subtext */}
      {renderDeltaLine()}

      {/* Bottom accent bar */}
      <div
        className="absolute bottom-0 inset-x-0 h-px"
        style={{
          backgroundColor: actionable ? 'var(--color-gold)' : 'var(--color-border-inner)',
        }}
      />
    </Tag>
  )
}
