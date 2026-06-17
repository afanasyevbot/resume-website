import { notFound } from 'next/navigation'
import { loadRoleDetail } from '@/lib/engine/role-detail'
import RoleDetailHeader from '@/components/engine/RoleDetailHeader'
import EventTimeline from '@/components/engine/EventTimeline'
import { TailorPackagePanel } from '@/components/engine/TailorAction'
import TailorButtonStandalone from '@/components/engine/TailorButtonStandalone'
import ApplyAction from '@/components/engine/ApplyAction'
import FeedbackButtons from '@/components/engine/FeedbackButtons'
import InterviewPrep from '@/components/engine/InterviewPrep'
import { scoreBand } from '@/lib/engine/scoreBands'
import { isInterviewPrep, type InterviewPrep as Prep } from '@/lib/engine/interviewPrep'

export const dynamic = 'force-dynamic'

/** Right-side panel chrome — same vellum + dashed-label style as the queue. */
function Panel({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section
      className="vellum rounded-lg overflow-hidden"
      style={{ border: '1px solid var(--color-border)' }}
    >
      <div
        className="px-5 py-3"
        style={{ borderBottom: '1px dashed rgba(148,163,184,0.10)' }}
      >
        <p
          className="text-[11px] font-medium uppercase"
          style={{
            color: 'var(--color-text-faint)',
            fontFamily: 'var(--font-sans)',
            letterSpacing: '0.04em',
          }}
        >
          {title}
        </p>
      </div>
      <div className="p-5">{children}</div>
    </section>
  )
}

export default async function RoleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const numericId = Number(id)
  if (!Number.isFinite(numericId) || numericId <= 0) notFound()

  const role = await loadRoleDetail(numericId)
  if (!role) notFound()

  const hasPackage = !!role.package_json

  // Latest 'interview_prep' event drives the prep panel (events are ascending).
  const prepEvent = [...role.events].reverse().find((e) => e.kind === 'interview_prep')
  const initialPrep: Prep | null =
    prepEvent && isInterviewPrep(prepEvent.detail) ? (prepEvent.detail as Prep) : null

  return (
    <main
      className="max-w-[1200px] mx-auto px-6 lg:px-10 pt-10 pb-24"
      style={{ fontFamily: 'var(--font-sans)' }}
    >
      <RoleDetailHeader role={role} />

      {/* Dashed semantic divider — matches the dashboard rhythm */}
      <div
        className="my-8"
        style={{ borderTop: '1px dashed rgba(148,163,184,0.12)' }}
      />

      {/* Two-column layout: JD on left, agent surfaces on the right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT — Job description */}
        <div className="lg:col-span-7">
          <Panel title="Job description">
            {role.jd_text ? (
              <pre
                className="text-[12.5px] whitespace-pre-wrap leading-relaxed overflow-y-auto"
                style={{
                  color: 'var(--color-text-primary)',
                  fontFamily: 'var(--font-sans)',
                  maxHeight: '60vh',
                }}
              >
                {role.jd_text}
              </pre>
            ) : (
              <p
                className="text-[12px] italic"
                style={{
                  color: 'var(--color-text-ghost)',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                No JD captured for this role.
              </p>
            )}
          </Panel>
        </div>

        {/* RIGHT — Matcher reasoning + Package + Timeline */}
        <div className="lg:col-span-5 space-y-5">
          {/* (a) Matcher reasoning */}
          <Panel title="Matcher reasoning">
            {role.fit_reasons.length > 0 ? (
              <ul
                className="space-y-2 text-[12.5px] leading-relaxed"
                style={{
                  color: 'var(--color-text-primary)',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                {role.fit_reasons.map((reason, i) => (
                  <li key={i} className="flex gap-2">
                    <span
                      aria-hidden
                      style={{ color: 'var(--color-gold)' }}
                    >
                      ·
                    </span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p
                className="text-[12px] italic"
                style={{
                  color: 'var(--color-text-ghost)',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                No matcher reasoning recorded.
              </p>
            )}
            {role.fit_score !== null && (
              <p
                className="mt-4 pt-3 text-[11px] tabular-nums"
                style={{
                  borderTop: '1px dashed rgba(148,163,184,0.08)',
                  color: 'var(--color-text-faint)',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                Fit {role.fit_score}/100 ·{' '}
                <span style={{ color: scoreBand(role.fit_score).color }}>
                  {scoreBand(role.fit_score).label}
                </span>{' '}
                — {scoreBand(role.fit_score).meaning}
              </p>
            )}
          </Panel>

          {/* (b) Application package */}
          <section
            className="vellum rounded-lg overflow-hidden"
            style={{ border: '1px solid var(--color-border)' }}
          >
            <div
              className="px-5 py-3 flex items-center justify-between"
              style={{ borderBottom: '1px dashed rgba(148,163,184,0.10)' }}
            >
              <p
                className="text-[11px] font-medium uppercase"
                style={{
                  color: 'var(--color-text-faint)',
                  fontFamily: 'var(--font-sans)',
                  letterSpacing: '0.04em',
                }}
              >
                Application package
              </p>
              {!hasPackage && <TailorButtonStandalone roleId={role.id} />}
            </div>
            {hasPackage && role.package_json ? (
              <TailorPackagePanel
                pkg={role.package_json}
                packageId={role.package_id}
              />
            ) : (
              <div className="p-5">
                <p
                  className="text-[12px] italic"
                  style={{
                    color: 'var(--color-text-ghost)',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  No tailored package yet. Tailor to generate a summary, bullets,
                  cover letter, and outreach draft.
                </p>
              </div>
            )}
          </section>

          {/* (c) Timeline */}
          <Panel title="Timeline">
            <EventTimeline events={role.events} />
          </Panel>
        </div>
      </div>

      {/* Actions row */}
      <div
        className="mt-8 pt-6 flex flex-wrap items-center gap-3"
        style={{ borderTop: '1px dashed rgba(148,163,184,0.10)' }}
      >
        {role.url && (
          <a
            href={role.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-medium px-4 py-2 rounded"
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
            ↗ Apply on company site
          </a>
        )}
        {/* ApplyAction renders "Mark applied" when applyable and the sage
            "✓ Applied" badge otherwise — always show it so the drilldown
            reflects the role's current applied state. */}
        <ApplyAction roleId={role.id} status={role.status} />
        <div style={{ marginLeft: 'auto' }}>
          <FeedbackButtons roleId={role.id} currentRating={role.user_rating} />
        </div>
      </div>

      {/* Interview prep — on demand, generated from the profile + this JD */}
      <div className="mt-6">
        <Panel title="Interview prep">
          <InterviewPrep roleId={role.id} initialPrep={initialPrep} />
        </Panel>
      </div>
    </main>
  )
}
