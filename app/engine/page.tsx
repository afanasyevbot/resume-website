import Link from 'next/link'
import { loadDashboard } from '@/lib/engine/dashboard'
import { recordVisitAndGetDigest } from '@/lib/engine/visit'
import { briefStatsSince, composeBrief } from '@/lib/engine/brief'
import { buildDeck } from '@/lib/engine/buildDeck'
import EngineHeader from '@/components/engine/EngineHeader'
import DecisionDeck from '@/components/engine/DecisionDeck'
import PipelineStrip from '@/components/engine/PipelineStrip'
import AgentWire from '@/components/engine/AgentWire'
import HealthLine from '@/components/engine/HealthLine'

export const dynamic = 'force-dynamic'

/**
 * The engine front page is a morning brief, not a dashboard: what the agent
 * did (in a sentence), the few decisions only Matthew can make (one at a
 * time), the pipeline in one line, and a timestamped wire of agent activity.
 * The full role list lives at /engine/roles.
 */
export default async function EngineDashboard() {
  const [data, digest] = await Promise.all([loadDashboard(), recordVisitAndGetDigest()])
  const { counts, queue, activity, reminders, health } = data
  const deck = buildDeck(queue, reminders)

  const stats = await briefStatsSince(digest.since, deck.length)
  stats.sinceLabel = digest.sinceLabel
  const brief = composeBrief(stats, health)

  return (
    <main
      className="max-w-[860px] mx-auto px-6 lg:px-10 pt-10 pb-24"
      style={{ fontFamily: 'var(--font-sans)' }}
    >
      <EngineHeader
        digestSlot={
          <p
            className="mt-4 text-[17px] leading-relaxed max-w-[600px]"
            style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-sans)' }}
          >
            {brief}
          </p>
        }
      />

      {/* Cron heartbeat — always visible so a dead job can't hide. */}
      <div className="mt-6">
        <HealthLine health={health} />
      </div>

      {/* The decisions only Matthew can make — one at a time. */}
      <div className="mt-10">
        <DecisionDeck items={deck} />
      </div>

      {/* Pipeline at a glance. */}
      <div className="mt-12">
        <p className="eng-eyebrow mb-3">Pipeline</p>
        <PipelineStrip counts={counts} rows={queue} />
      </div>

      {/* Everything the agent did. */}
      <div className="vellum mt-6 px-7 py-6">
        <AgentWire events={activity} />
      </div>

      <div className="mt-8 text-center">
        <Link
          href="/engine/roles"
          className="text-[13px] inline-flex items-center gap-1.5 transition-colors"
          style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)', textDecoration: 'none' }}
        >
          Browse all roles
          <span aria-hidden>→</span>
        </Link>
      </div>
    </main>
  )
}
