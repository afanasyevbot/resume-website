interface KpiTileProps {
  label: string
  value: number
  delta?: number
  subtext?: string
  actionable?: boolean
}

export default function KpiTile({ label, value, delta, subtext, actionable = false }: KpiTileProps) {
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

  return (
    <div
      className="relative flex flex-col p-5 rounded-lg overflow-hidden"
      style={{
        backgroundColor: 'rgba(34, 29, 20, 0.6)',
        backdropFilter: 'blur(4px)',
        border: '1px solid var(--color-border)',
        // Inner top glow — echoes the radial bg bleeding through
        boxShadow: 'inset 0 1px 0 rgba(212,178,120,0.06)',
      }}
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
    </div>
  )
}
