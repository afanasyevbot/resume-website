'use client'

import type { RoleRow } from '@/lib/engine/dashboard'
import { timeAgo } from '@/lib/engine/dashboard'
import TailorAction, { TailorPackagePanel } from './TailorAction'
import AgentTrail from './AgentTrail'

interface RoleCardProps {
  row: RoleRow
  expanded: boolean
  onToggleExpanded: () => void
}

const ROUTE_ACCENT: Record<string, string> = {
  tailor: '#d4b278', // gold
  flag: '#b88940', // amber
  discard: '#5a5040', // ghost
}

const DEFAULT_ACCENT = '#352c1e'

/** Score color matches the route the model chose. */
function scoreColor(route: string | null, score: number): string {
  if (!route || score < 55) return 'var(--color-text-faint)'
  if (score >= 70) return '#d4b278' // gold
  return '#b88940' // amber
}

/** Two-letter avatar from the company name. */
function avatarLetters(company: string): string {
  const parts = company.trim().split(/\s+/)
  if (parts.length === 0) return '??'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

/** Deterministic warm-palette tint per company. */
function avatarTint(company: string): { bg: string; fg: string } {
  // Simple hash → choose from a small warm palette
  let h = 0
  for (let i = 0; i < company.length; i++) h = (h * 31 + company.charCodeAt(i)) >>> 0
  const palettes = [
    { bg: 'rgba(212,178,120,0.18)', fg: '#d4b278' }, // gold
    { bg: 'rgba(184,138,120,0.20)', fg: '#c89e88' }, // copper
    { bg: 'rgba(154,180,138,0.16)', fg: '#a8c094' }, // sage
    { bg: 'rgba(180,160,200,0.16)', fg: '#b8a4c8' }, // muted lilac
    { bg: 'rgba(190,170,140,0.18)', fg: '#c8b89a' }, // sand
  ]
  return palettes[h % palettes.length]
}

interface TagProps {
  children: React.ReactNode
  variant?: 'gold' | 'sage' | 'cream' | 'muted'
}

function Tag({ children, variant = 'muted' }: TagProps) {
  const palette: Record<NonNullable<TagProps['variant']>, { bg: string; fg: string }> = {
    gold: { bg: 'rgba(212,178,120,0.12)', fg: '#d4b278' },
    sage: { bg: 'rgba(154,180,138,0.10)', fg: '#9ab48a' },
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

/** Two-column label/value row in the data block. */
function DataRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-3 text-[12px]">
      <span
        className="flex-shrink-0 w-16 uppercase tracking-wider"
        style={{
          color: 'var(--color-text-ghost)',
          fontFamily: 'var(--font-sans)',
          fontSize: 10,
          letterSpacing: '0.10em',
        }}
      >
        {label}
      </span>
      <span
        className="flex-1 min-w-0 truncate text-right"
        style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-sans)' }}
      >
        {value}
      </span>
    </div>
  )
}

export default function RoleCard({ row, expanded, onToggleExpanded }: RoleCardProps) {
  const accent = ROUTE_ACCENT[row.route?.toLowerCase() ?? ''] ?? DEFAULT_ACCENT
  const showTailor = row.route === 'tailor' && ['scored', 'tailored'].includes(row.status)
  const hasPackage = !!row.package_json
  const tint = avatarTint(row.company)
  const score = row.fit_score ?? 0
  const tags: { label: string; variant: TagProps['variant'] }[] = []
  if (row.ai_native) tags.push({ label: 'AI-Native', variant: 'gold' })
  if (row.segment === 'mid-market') tags.push({ label: 'Mid-market', variant: 'cream' })
  if (row.segment === 'enterprise') tags.push({ label: 'Enterprise', variant: 'muted' })
  if (!row.location || /remote|anywhere/i.test(row.location)) tags.push({ label: 'Remote', variant: 'sage' })
  if (/\bfounding\b/i.test(row.title)) tags.push({ label: 'Founding', variant: 'gold' })

  return (
    <div
      className={`vellum rounded-lg overflow-hidden ${expanded ? 'lg:col-span-2' : ''}`}
      style={{
        border: `1px solid var(--color-border)`,
        // route accent shows on the top edge of the card
        boxShadow: `inset 0 2px 0 ${accent}`,
      }}
    >
      <div className="p-5">
        {/* Top row: avatar + company/title + score */}
        <div className="flex items-start gap-3">
          <div
            className="flex-shrink-0 flex items-center justify-center font-semibold tabular-nums"
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              backgroundColor: tint.bg,
              color: tint.fg,
              fontSize: 13,
              fontFamily: 'var(--font-sans)',
              letterSpacing: '0.04em',
              border: `1px solid ${tint.fg}33`,
            }}
            aria-hidden
          >
            {avatarLetters(row.company)}
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="text-[14px] font-semibold leading-tight truncate"
              style={{ color: 'var(--color-text-bright)', fontFamily: 'var(--font-sans)' }}
            >
              {row.company}
            </p>
            <p
              className="text-[12px] truncate mt-0.5"
              style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-sans)' }}
            >
              {row.title}
            </p>
          </div>
          {row.fit_score !== null && (
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span
                aria-hidden
                className="inline-block rounded-full"
                style={{
                  width: 7,
                  height: 7,
                  backgroundColor: scoreColor(row.route, score),
                  boxShadow:
                    score >= 70 ? `0 0 5px ${scoreColor(row.route, score)}66` : 'none',
                }}
              />
              <span
                className="tabular-nums font-medium"
                style={{
                  color: 'var(--color-text-bright)',
                  fontFamily: 'var(--font-display)',
                  fontSize: 18,
                }}
              >
                {Math.round(score / 10)}
                <span style={{ color: 'var(--color-text-faint)' }}>/10</span>
              </span>
            </div>
          )}
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {tags.map((t, i) => (
              <Tag key={i} variant={t.variant}>
                {t.label}
              </Tag>
            ))}
          </div>
        )}

        {/* Data block */}
        <div className="mt-4 space-y-2">
          {row.location && <DataRow label="Location" value={row.location} />}
          <DataRow
            label="Source"
            value={
              <>
                {row.source ?? 'manual'}
                <span style={{ color: 'var(--color-text-faint)' }}>
                  {' · '}
                  {timeAgo(row.created_at)} ago
                </span>
              </>
            }
          />
          {row.fit_score !== null && (
            <DataRow
              label="Fit"
              value={
                <span
                  className="tabular-nums"
                  style={{ color: scoreColor(row.route, score) }}
                >
                  {score}/100 · {row.route}
                </span>
              }
            />
          )}
        </div>

        {/* Agent trail */}
        <div className="mt-5 pt-4" style={{ borderTop: '1px dashed rgba(212,178,120,0.08)' }}>
          <AgentTrail status={row.status} hasPackage={hasPackage} source={row.source} />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-5">
          {row.url && (
            <a
              href={row.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-center text-[11px] font-medium px-3 py-2 rounded transition-colors"
              style={{
                fontFamily: 'var(--font-sans)',
                color: 'var(--color-text-bright)',
                background: 'transparent',
                border: '1px solid var(--color-border)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                textDecoration: 'none',
              }}
            >
              ↗ Apply
            </a>
          )}
          {showTailor && (
            <div className="flex-1">
              <TailorAction
                roleId={row.id}
                hasPackage={hasPackage}
                expanded={expanded}
                onToggleExpanded={onToggleExpanded}
              />
            </div>
          )}
        </div>
      </div>

      {/* Expanded package panel */}
      {expanded && row.package_json && (
        <TailorPackagePanel pkg={row.package_json} />
      )}
    </div>
  )
}
