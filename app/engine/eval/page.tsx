import Link from 'next/link'
import { sql } from '@/lib/engine/db'
import { runFeedbackEval, type FeedbackEvalRow } from '@/lib/engine/eval/runFeedbackEval'

export const dynamic = 'force-dynamic'

interface RatedRow {
  role_id: string | number
  company: string
  title: string
  fit_score: string | number
  rating: string | number
  route: string | null
}

async function loadEvalData() {
  const rows = (await sql`
    select distinct on (e.role_id)
      e.role_id,
      r.company,
      r.title,
      r.fit_score,
      r.route,
      (e.detail->>'rating')::int as rating
    from events e
    join roles r on r.id = e.role_id
    where e.kind = 'rated'
      and r.fit_score is not null
    order by e.role_id, e.created_at desc
  `) as RatedRow[]

  const evalRows: FeedbackEvalRow[] = []
  const items: Array<{
    roleId: number
    company: string
    title: string
    fitScore: number
    rating: 1 | -1
    route: string | null
    agree: boolean
  }> = []

  for (const r of rows) {
    const rating = Number(r.rating)
    if (rating !== 1 && rating !== -1) continue
    const fitScore = Number(r.fit_score)
    const matcherSaidYes = fitScore >= 60
    const humanSaidYes = rating === 1
    evalRows.push({ matcherScore: fitScore, rating: rating as 1 | -1 })
    items.push({
      roleId: Number(r.role_id),
      company: r.company,
      title: r.title,
      fitScore,
      rating: rating as 1 | -1,
      route: r.route,
      agree: matcherSaidYes === humanSaidYes,
    })
  }

  const report = runFeedbackEval(evalRows)
  // Show mismatches first (most actionable), then sorted by score desc
  items.sort((a, b) => {
    if (a.agree !== b.agree) return a.agree ? 1 : -1
    return b.fitScore - a.fitScore
  })
  return { report, items }
}

function StatBox({
  label,
  value,
  sub,
  accent,
}: {
  label: string
  value: string
  sub?: string
  accent?: string
}) {
  return (
    <div
      className="vellum rounded-lg px-5 py-4"
      style={{ border: '1px solid var(--color-border)' }}
    >
      <p
        className="text-[10px] uppercase mb-1"
        style={{
          fontFamily: 'var(--font-display)',
          letterSpacing: '0.16em',
          color: 'var(--color-text-secondary)',
        }}
      >
        {label}
      </p>
      <p
        className="text-[28px] font-semibold tabular-nums leading-none"
        style={{ fontFamily: 'var(--font-display)', color: accent ?? 'var(--color-text-bright)' }}
      >
        {value}
      </p>
      {sub && (
        <p
          className="text-[11px] mt-1"
          style={{ fontFamily: 'var(--font-sans)', color: 'var(--color-text-secondary)' }}
        >
          {sub}
        </p>
      )}
    </div>
  )
}

export default async function EvalPage() {
  const { report, items } = await loadEvalData()

  const label = { fontFamily: 'var(--font-display)', letterSpacing: '0.14em' } as const
  const pct = (n: number, d: number) => (d === 0 ? '—' : `${Math.round((n / d) * 100)}%`)

  return (
    <main
      className="max-w-[900px] mx-auto px-6 lg:px-10 pt-10 pb-24"
      style={{ fontFamily: 'var(--font-sans)' }}
    >
      {/* Header */}
      <div className="mb-8">
        <p
          className="text-[11px] uppercase mb-2"
          style={{ ...label, color: 'var(--color-text-secondary)' }}
        >
          <Link href="/engine" style={{ color: 'inherit', textDecoration: 'none' }}>
            Engine
          </Link>{' '}
          / Eval
        </p>
        <h1
          className="text-[22px] font-semibold"
          style={{ color: 'var(--color-text-bright)', fontFamily: 'var(--font-sans)' }}
        >
          Matcher calibration
        </h1>
        <p
          className="text-[13px] mt-1"
          style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-sans)' }}
        >
          How well does the scorer match your thumbs-up / thumbs-down on role detail pages?
          Rate more roles to improve signal.
        </p>
      </div>

      {report.n === 0 ? (
        <div
          className="vellum rounded-xl px-8 py-10 text-center"
          style={{ border: '1px solid var(--color-border)' }}
        >
          <p
            className="text-[13px] uppercase mb-2"
            style={{ ...label, color: 'var(--color-text-secondary)' }}
          >
            No ratings yet
          </p>
          <p
            className="text-[14px]"
            style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-sans)' }}
          >
            Open any role at{' '}
            <Link
              href="/engine/roles"
              style={{ color: 'var(--color-gold)', textDecoration: 'none' }}
            >
              /engine/roles
            </Link>{' '}
            and use the thumbs buttons to rate it. Ratings feed this report.
          </p>
        </div>
      ) : (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            <StatBox label="Rated" value={String(report.n)} sub="roles with feedback" />
            <StatBox
              label="Agreement"
              value={pct(Math.round(report.agreement * report.n), report.n)}
              sub="matcher matches you"
              accent={report.agreement >= 0.75 ? '#16a34a' : report.agreement >= 0.5 ? '#b45309' : '#dc2626'}
            />
            <StatBox
              label="MAE"
              value={report.mae.toFixed(1)}
              sub="avg score error (pts)"
              accent={report.mae <= 15 ? '#16a34a' : report.mae <= 30 ? '#b45309' : '#dc2626'}
            />
            <StatBox
              label="Held misses"
              value={String(report.breakdown.holdDisagree)}
              sub={`liked, but scored <${report.threshold}`}
              accent={report.breakdown.holdDisagree > 0 ? '#dc2626' : '#16a34a'}
            />
          </div>

          {/* The question Matthew actually asks: of the roles I'd apply to,
              how many would the engine auto-send? This is the "why don't I see
              it applying" answer in one line. */}
          {(() => {
            const liked = report.breakdown.applyAgree + report.breakdown.holdDisagree
            const wouldApply = report.breakdown.applyAgree
            if (liked === 0) return null
            const allClear = wouldApply === liked
            return (
              <div
                className="rounded-lg px-5 py-4 mb-6"
                style={{
                  border: `1px solid ${allClear ? 'rgba(22,163,74,0.30)' : 'rgba(220,38,38,0.30)'}`,
                  background: allClear ? 'rgba(22,163,74,0.05)' : 'rgba(220,38,38,0.04)',
                }}
              >
                <p className="text-[14px]" style={{ color: 'var(--color-text-bright)', fontFamily: 'var(--font-sans)' }}>
                  <strong>{wouldApply} of {liked}</strong> roles you thumbs-upped would auto-apply
                  (score ≥ {report.threshold}).
                </p>
                {!allClear && (
                  <p className="text-[12.5px] mt-1" style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-sans)' }}>
                    The other {liked - wouldApply} scored below {report.threshold} — the engine holds them for your approval
                    instead of applying. If these are real fits, the rubric is scoring them too low.
                  </p>
                )}
              </div>
            )
          })()}

          {/* Breakdown */}
          <div
            className="vellum rounded-lg mb-6 overflow-hidden"
            style={{ border: '1px solid var(--color-border)' }}
          >
            <div
              className="px-5 py-3"
              style={{ borderBottom: '1px dashed rgba(148,163,184,0.12)' }}
            >
              <p
                className="text-[11px] uppercase"
                style={{ ...label, color: 'var(--color-text-secondary)' }}
              >
                Decision breakdown
              </p>
            </div>
            <div className="grid grid-cols-2 divide-x divide-dashed" style={{ borderColor: 'rgba(148,163,184,0.12)' }}>
              {[
                { label: `✓ Would auto-apply (≥${report.threshold}), you agreed`, n: report.breakdown.applyAgree, good: true },
                { label: `✗ Would auto-apply (≥${report.threshold}), you said no`, n: report.breakdown.applyDisagree, good: false },
                { label: `✓ Would hold (<${report.threshold}), you agreed`, n: report.breakdown.holdAgree, good: true },
                { label: `✗ Would hold (<${report.threshold}), you'd apply (miss)`, n: report.breakdown.holdDisagree, good: false },
              ].map((row) => (
                <div key={row.label} className="px-5 py-4">
                  <p
                    className="text-[22px] font-semibold tabular-nums"
                    style={{
                      fontFamily: 'var(--font-display)',
                      color: row.good ? '#16a34a' : row.n > 0 ? '#dc2626' : 'var(--color-text-secondary)',
                    }}
                  >
                    {row.n}
                  </p>
                  <p
                    className="text-[11px] mt-0.5"
                    style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-sans)' }}
                  >
                    {row.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Per-role table */}
          <div
            className="vellum rounded-lg overflow-hidden"
            style={{ border: '1px solid var(--color-border)' }}
          >
            <div
              className="px-5 py-3"
              style={{ borderBottom: '1px dashed rgba(148,163,184,0.12)' }}
            >
              <p
                className="text-[11px] uppercase"
                style={{ ...label, color: 'var(--color-text-secondary)' }}
              >
                Per-role breakdown — mismatches first
              </p>
            </div>
            <table className="w-full text-[12px]" style={{ fontFamily: 'var(--font-sans)', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border-inner)' }}>
                  {['Company', 'Title', 'Score', 'You', 'Match'].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-2 text-left font-medium"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.roleId}
                    style={{ borderBottom: '1px solid var(--color-border-inner)' }}
                  >
                    <td className="px-4 py-2.5" style={{ color: 'var(--color-text-primary)' }}>
                      <Link
                        href={`/engine/roles/${item.roleId}`}
                        style={{ color: 'inherit', textDecoration: 'none' }}
                        className="hover:underline"
                      >
                        {item.company}
                      </Link>
                    </td>
                    <td
                      className="px-4 py-2.5 max-w-[260px] truncate"
                      style={{ color: 'var(--color-text-secondary)' }}
                      title={item.title}
                    >
                      {item.title}
                    </td>
                    <td
                      className="px-4 py-2.5 tabular-nums font-medium"
                      style={{
                        fontFamily: 'var(--font-display)',
                        color: item.fitScore >= 75 ? '#16a34a' : item.fitScore >= 60 ? '#b45309' : '#64748b',
                      }}
                    >
                      {item.fitScore}
                    </td>
                    <td className="px-4 py-2.5">
                      {item.rating === 1 ? (
                        <span title="Good fit">👍</span>
                      ) : (
                        <span title="Bad fit">👎</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      {item.agree ? (
                        <span style={{ color: '#16a34a' }}>✓</span>
                      ) : (
                        <span style={{ color: '#dc2626', fontWeight: 600 }}>✗</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  )
}
