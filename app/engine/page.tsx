import Link from 'next/link'
import { loadDashboard } from '@/lib/engine/dashboard'
import { recordVisitAndGetDigest } from '@/lib/engine/visit'
import { briefStatsSince, composeBrief } from '@/lib/engine/brief'
import { buildDeck } from '@/lib/engine/buildDeck'
import EngineHeader from '@/components/engine/EngineHeader'
import DecisionDeck from '@/components/engine/DecisionDeck'
import PipelineStrip from '@/components/engine/PipelineStrip'
import AgentWire from '@/components/engine/AgentWire'

export const dynamic = 'force-dynamic'

/**
 * The engine front page is a morning brief, not a dashboard: what the agent
 * did (in a sentence), the few decisions only Matthew can make (one at a
 * time), the pipeline in one line, and a timestamped wire of agent activity.
 * The full role list lives at /engine/roles.
 */
export default async function EngineDashboard() {
  const [data, digest] = await Promise.all([loadDashboard(), recordVisitAndGetDigest()])
  const { counts, queue, activity, reminders } = data
  const deck = buildDeck(queue, reminders)

  const stats = await briefStatsSince(digest.since, deck.length)
  stats.sinceLabel = digest.sinceLabel
  const brief = composeBrief(stats)

  return (
    <main
      className="max-w-[860px] mx-auto px-6 lg:px-10 pt-10 pb-24"
      style={{ fontFamily: 'var(--font-sans)' }}
    >
      <EngineHeader
        digestSlot={
          <p
            className="mt-5 text-[17px] leading-relaxed max-w-[640px]"
            style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-sans)' }}
          >
            {brief}
          </p>
        }
      />

      <div className="my-8" style={{ borderTop: '1px solid #e2e6ec' }} />

      {/* The decisions only Matthew can make — one at a time. */}
      <DecisionDeck items={deck} />

      {/* Pipeline in one line. */}
      <div className="mt-10 mb-10">
        <PipelineStrip counts={counts} rows={queue} />
      </div>

      {/* Everything the agent did, timestamped. */}
      <div
        className="vellum rounded-lg px-6 py-5"
        style={{ border: '1px solid var(--color-border)' }}
      >
        <AgentWire events={activity} />
      </div>

      <div className="mt-8 text-center">
        <Link
          href="/engine/roles"
          className="text-[12px] uppercase"
          style={{
            color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-display)',
            letterSpacing: '0.18em',
            textDecoration: 'none',
          }}
        >
          Browse all roles →
        </Link>
      </div>
    </main>
  )
}
