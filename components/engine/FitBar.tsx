// Darker on cream so the thin fill bar stays visible on light paper.
const ROUTE_COLORS: Record<string, string> = {
  tailor:  '#e3a52e',
  flag:    '#b07b2e',
  discard: '#b0a486',
}

const DEFAULT_COLOR = '#5d6b80'

interface FitBarProps {
  score: number
  route: string | null
}

export default function FitBar({ score, route }: FitBarProps) {
  const fillColor = ROUTE_COLORS[route?.toLowerCase() ?? ''] ?? DEFAULT_COLOR
  const pct = Math.min(100, Math.max(0, score))

  return (
    <span
      className="inline-flex items-center gap-2"
      style={{ fontFamily: 'var(--font-sans)' }}
    >
      <span
        className="text-[12px] tabular-nums w-7 text-right flex-shrink-0"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        {score}
      </span>
      <span
        className="relative h-1 rounded-full flex-shrink-0"
        style={{
          width: 80,
          backgroundColor: 'var(--color-border-inner)',
        }}
      >
        <span
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            width: `${pct}%`,
            backgroundColor: fillColor,
          }}
        />
      </span>
    </span>
  )
}
