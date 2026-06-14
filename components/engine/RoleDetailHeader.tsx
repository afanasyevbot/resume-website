import Link from 'next/link'
import type { RoleDetail } from '@/lib/engine/role-detail'

// ─── Helpers (parallels RoleCard so the drilldown looks like the queue card) ───

const ROUTE_ACCENT: Record<string, string> = {
  tailor: '#d4b278',
  flag: '#b88940',
  discard: '#5a5040',
}
const DEFAULT_ACCENT = '#352c1e'

function scoreColor(route: string | null, score: number): string {
  if (!route || score < 55) return 'var(--color-text-faint)'
  if (score >= 70) return '#d4b278'
  return '#b88940'
}

function avatarLetters(company: string): string {
  const parts = company.trim().split(/\s+/)
  if (parts.length === 0) return '??'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

function avatarTint(company: string): { bg: string; fg: string } {
  let h = 0
  for (let i = 0; i < company.length; i++) h = (h * 31 + company.charCodeAt(i)) >>> 0
  const palettes = [
    { bg: 'rgba(148,163,184,0.18)', fg: '#d4b278' },
    { bg: 'rgba(184,138,120,0.20)', fg: '#c89e88' },
    { bg: 'rgba(74,222,128,0.16)', fg: '#a8c094' },
    { bg: 'rgba(180,160,200,0.16)', fg: '#b8a4c8' },
    { bg: 'rgba(190,170,140,0.18)', fg: '#c8b89a' },
  ]
  return palettes[h % palettes.length]
}

type TagVariant = 'gold' | 'sage' | 'cream' | 'muted'

function Tag({ children, variant = 'muted' }: { children: React.ReactNode; variant?: TagVariant }) {
  const palette: Record<TagVariant, { bg: string; fg: string }> = {
    gold: { bg: 'rgba(148,163,184,0.12)', fg: '#d4b278' },
    sage: { bg: 'rgba(74,222,128,0.10)', fg: '#6ee7a0' },
    cream: { bg: 'rgba(226,213,192,0.08)', fg: '#e2d5c0' },
    muted: { bg: 'rgba(154,163,180,0.08)', fg: '#9aa3b4' },
  }
  const c = palette[variant]
  return (
    <span
      className="inline-flex items-center text-[10px] font-medium"
      style={{
        fontFamily: 'var(--font-sans)',
        backgroundColor: c.bg,
        color: c.fg,
        padding: '2px 8px',
        borderRadius: 4,
        letterSpacing: '0.04em',
      }}
    >
      {children}
    </span>
  )
}

function deriveTags(role: RoleDetail): { label: string; variant: TagVariant }[] {
  const tags: { label: string; variant: TagVariant }[] = []
  if (role.route) tags.push({ label: role.route.toUpperCase(), variant: 'gold' })
  if (role.ai_native) tags.push({ label: 'AI-Native', variant: 'gold' })
  if (role.segment === 'mid-market') tags.push({ label: 'Mid-market', variant: 'cream' })
  if (role.segment === 'enterprise') tags.push({ label: 'Enterprise', variant: 'muted' })
  if (!role.location || /remote|anywhere/i.test(role.location)) {
    tags.push({ label: 'Remote', variant: 'sage' })
  }
  if (/\bfounding\b/i.test(role.title)) tags.push({ label: 'Founding', variant: 'gold' })
  if (role.source) tags.push({ label: role.source, variant: 'muted' })
  return tags
}

interface RoleDetailHeaderProps {
  role: RoleDetail
}

export default function RoleDetailHeader({ role }: RoleDetailHeaderProps) {
  const accent = ROUTE_ACCENT[role.route?.toLowerCase() ?? ''] ?? DEFAULT_ACCENT
  const tint = avatarTint(role.company)
  const score = role.fit_score ?? 0
  const tags = deriveTags(role)

  return (
    <header>
      {/* Back link */}
      <Link
        href="/engine"
        className="inline-flex items-center text-[11px] font-medium"
        style={{
          fontFamily: 'var(--font-sans)',
          color: 'var(--color-text-faint)',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          textDecoration: 'none',
        }}
      >
        ← Queue
      </Link>

      {/* Avatar + name/title block + score */}
      <div className="mt-5 flex items-start gap-4">
        <div
          className="flex-shrink-0 flex items-center justify-center font-semibold tabular-nums"
          style={{
            width: 56,
            height: 56,
            borderRadius: 10,
            backgroundColor: tint.bg,
            color: tint.fg,
            fontSize: 18,
            fontFamily: 'var(--font-sans)',
            letterSpacing: '0.04em',
            border: `1px solid ${tint.fg}33`,
            // route accent on the left edge of the avatar — a small flourish
            // that echoes the card's top accent
            boxShadow: `inset 3px 0 0 ${accent}`,
          }}
          aria-hidden
        >
          {avatarLetters(role.company)}
        </div>

        <div className="flex-1 min-w-0">
          <p
            className="text-[13px] uppercase"
            style={{
              fontFamily: 'var(--font-sans)',
              color: 'var(--color-text-faint)',
              letterSpacing: '0.04em',
            }}
          >
            {role.company}
          </p>
          <h1
            className="mt-1 text-[28px] lg:text-[32px] font-semibold leading-tight tracking-tight"
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--color-text-bright)',
            }}
          >
            {role.title}
          </h1>
          {role.location && (
            <p
              className="mt-1 text-[12px]"
              style={{
                color: 'var(--color-text-secondary)',
                fontFamily: 'var(--font-sans)',
              }}
            >
              {role.location}
            </p>
          )}
        </div>

        {role.fit_score !== null && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <span
              aria-hidden
              className="inline-block rounded-full"
              style={{
                width: 9,
                height: 9,
                backgroundColor: scoreColor(role.route, score),
                boxShadow:
                  score >= 70 ? `0 0 6px ${scoreColor(role.route, score)}66` : 'none',
              }}
            />
            <span
              className="tabular-nums font-medium"
              style={{
                color: 'var(--color-text-bright)',
                fontFamily: 'var(--font-display)',
                fontSize: 32,
                lineHeight: 1,
              }}
            >
              {Math.round(score / 10)}
              <span style={{ color: 'var(--color-text-faint)', fontSize: 18 }}>/10</span>
            </span>
          </div>
        )}
      </div>

      {/* Tags row */}
      {tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {tags.map((t, i) => (
            <Tag key={i} variant={t.variant}>
              {t.label}
            </Tag>
          ))}
        </div>
      )}
    </header>
  )
}
