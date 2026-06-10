'use client'

import Link from 'next/link'
import type { RoleRow } from '@/lib/engine/dashboard'
import { timeAgo } from '@/lib/engine/dashboard'
import TailorAction, { TailorPackagePanel } from './TailorAction'
import ApplyAction from './ApplyAction'
import PerRoleAutoApply from './PerRoleAutoApply'
import ApprovalAction from './ApprovalAction'
import { scoreBand } from '@/lib/engine/scoreBands'
import AgentTrail from './AgentTrail'
import FeedbackButtons from './FeedbackButtons'
import { avatarLetters, avatarTint } from './avatar'

/** Statuses where "Mark applied" is offered — scored/queued only.
 *  Tailored roles get the autonomous apply button instead. */
const APPLYABLE_STATUSES = new Set(['scored', 'queued'])

interface RoleCardProps {
  row: RoleRow
  expanded: boolean
  onToggleExpanded: () => void
}

const ROUTE_ACCENT: Record<string, string> = {
  tailor: '#c89418', // gold
  flag: '#b8862a', // amber
  discard: '#cabd9f', // faint
}

const DEFAULT_ACCENT = '#e4dac6'

/** Score color matches the route the model chose. Tuned for cream paper. */
function scoreColor(route: string | null, score: number): string {
  if (!route || score < 55) return 'var(--color-text-faint)'
  if (score >= 70) return '#8a6310' // dark gold
  return '#a86f10' // amber-brown
}

interface TagProps {
  children: React.ReactNode
  variant?: 'gold' | 'sage' | 'cream' | 'muted'
}

function Tag({ children, variant = 'muted' }: TagProps) {
  const palette: Record<NonNullable<TagProps['variant']>, { bg: string; fg: string }> = {
    gold: { bg: 'rgba(184,134,42,0.14)', fg: '#8a6310' },
    sage: { bg: 'rgba(79,128,56,0.13)', fg: '#3f6a2c' },
    cream: { bg: 'rgba(107,85,48,0.10)', fg: '#6b5530' },
    muted: { bg: 'rgba(86,97,115,0.10)', fg: '#566173' },
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
        // Brighter than the cream panel it sits in, with a soft drop shadow
        // so nested cards separate. Route accent on the top edge.
        backgroundColor: '#fffefa',
        boxShadow: `inset 0 2px 0 ${accent}, 0 1px 4px rgba(0,0,0,0.07)`,
      }}
    >
      <div className="p-5">
        {/* Body — wrapped in a Link so the avatar/title/data/trail area
            navigates to the drilldown. Action buttons sit OUTSIDE the link
            so Tailor/Apply/Feedback clicks never trigger navigation. */}
        <Link
          href={`/engine/roles/${row.id}`}
          className="block"
          style={{ textDecoration: 'none', color: 'inherit' }}
          aria-label={`Open ${row.company} — ${row.title}`}
        >
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

        {/* Summary */}
        {row.jd_summary && (
          <p
            className="mt-3 text-[11.5px] leading-relaxed line-clamp-3"
            style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-sans)' }}
          >
            {row.jd_summary}
          </p>
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
                  title={scoreBand(row.fit_score).meaning}
                >
                  {score}/100 ·{' '}
                  <span style={{ color: scoreBand(row.fit_score).color }}>
                    {scoreBand(row.fit_score).label}
                  </span>
                </span>
              }
            />
          )}
        </div>

        {/* Agent trail */}
        <div className="mt-5 pt-4" style={{ borderTop: '1px dashed rgba(212,178,120,0.08)' }}>
          <AgentTrail status={row.status} hasPackage={hasPackage} source={row.source} />
        </div>
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-5">
          <FeedbackButtons roleId={row.id} currentRating={row.user_rating} />
          {row.url && (
            <a
              href={row.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-center text-[11px] font-medium px-3 py-2 rounded transition-colors"
              style={{
                fontFamily: 'var(--font-sans)',
                color: 'var(--color-text-secondary)',
                background: 'transparent',
                border: '1px solid var(--color-border)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                textDecoration: 'none',
              }}
            >
              ↗ View
            </a>
          )}
          {row.status === 'tailored' && row.route === 'tailor' && (
            <PerRoleAutoApply roleId={row.id} />
          )}
          {row.status === 'awaiting_approval' && <ApprovalAction roleId={row.id} />}
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
          {APPLYABLE_STATUSES.has(row.status.toLowerCase()) && (
            <ApplyAction roleId={row.id} status={row.status} />
          )}
        </div>
      </div>

      {/* Expanded package panel */}
      {expanded && row.package_json && (
        <TailorPackagePanel pkg={row.package_json} packageId={row.package_id} />
      )}
    </div>
  )
}
