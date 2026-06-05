interface BadgeConfig {
  text: string
  bg: string
  dot: string
}

// Tuned for legibility on cream paper: saturated dark text, light tinted bg.
const STATUS_MAP: Record<string, BadgeConfig> = {
  sourced:      { text: '#566173', bg: 'rgba(86,97,115,0.12)',  dot: '#566173' },
  scored:       { text: '#566173', bg: 'rgba(86,97,115,0.12)',  dot: '#566173' },
  tailored:     { text: '#8a6310', bg: 'rgba(138,99,16,0.13)',  dot: '#b8862a' },
  queued:       { text: '#8a6310', bg: 'rgba(138,99,16,0.13)',  dot: '#b8862a' },
  applied:      { text: '#3f6a2c', bg: 'rgba(63,106,44,0.13)',  dot: '#4f8038' },
  responded:    { text: '#6b5530', bg: 'rgba(107,85,48,0.12)',  dot: '#8a6d3b' },
  interviewing: { text: '#6b5530', bg: 'rgba(107,85,48,0.12)',  dot: '#8a6d3b' },
  offer:        { text: '#9a6a08', bg: 'rgba(154,106,8,0.16)',  dot: '#c8901a' },
  rejected:     { text: '#a8463a', bg: 'rgba(168,70,58,0.12)',  dot: '#c05545' },
  discarded:    { text: '#8a7d62', bg: 'rgba(138,125,98,0.12)', dot: '#a99c7e' },
}

const FALLBACK: BadgeConfig = {
  text: '#566173',
  bg: 'rgba(86,97,115,0.12)',
  dot: '#566173',
}

interface StatusBadgeProps {
  status: string
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const cfg = STATUS_MAP[status.toLowerCase()] ?? FALLBACK
  const label = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()

  return (
    <span
      className="inline-flex items-center gap-1 px-2 rounded-sm text-[11px] font-medium"
      style={{
        height: 20,
        backgroundColor: cfg.bg,
        color: cfg.text,
        fontFamily: 'var(--font-sans)',
        letterSpacing: '0.03em',
      }}
    >
      <span
        className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: cfg.dot }}
        aria-hidden="true"
      />
      {label}
    </span>
  )
}
