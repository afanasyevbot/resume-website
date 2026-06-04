interface BadgeConfig {
  text: string
  bg: string
  dot: string
}

const STATUS_MAP: Record<string, BadgeConfig> = {
  sourced:      { text: '#9aa3b4', bg: 'rgba(120,130,150,0.10)', dot: '#9aa3b4' },
  scored:       { text: '#9aa3b4', bg: 'rgba(120,130,150,0.10)', dot: '#9aa3b4' },
  tailored:     { text: '#d4b278', bg: 'rgba(212,178,120,0.12)', dot: '#d4b278' },
  queued:       { text: '#d4b278', bg: 'rgba(212,178,120,0.12)', dot: '#d4b278' },
  applied:      { text: '#9ab48a', bg: 'rgba(154,180,138,0.10)', dot: '#9ab48a' },
  responded:    { text: '#e2d5c0', bg: 'rgba(226,213,192,0.08)', dot: '#e2d5c0' },
  interviewing: { text: '#e2d5c0', bg: 'rgba(226,213,192,0.08)', dot: '#e2d5c0' },
  offer:        { text: '#e9c98c', bg: 'rgba(233,201,140,0.16)', dot: '#e9c98c' },
  rejected:     { text: '#b88078', bg: 'rgba(184,128,120,0.08)', dot: '#b88078' },
  discarded:    { text: '#5e5040', bg: 'rgba(94,80,64,0.10)',    dot: '#5e5040' },
}

const FALLBACK: BadgeConfig = {
  text: '#9aa3b4',
  bg: 'rgba(120,130,150,0.10)',
  dot: '#9aa3b4',
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
