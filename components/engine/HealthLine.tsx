import { timeAgo } from '@/lib/engine/dashboard'
import type { EngineHealth } from '@/lib/engine/health'

/**
 * The heartbeat: a persistent one-line readout of when each cron last ran,
 * green when healthy, red when stale (didn't run) OR failed (ran but broke —
 * e.g. Tavily down). Always visible so a dead job can't hide behind a quiet
 * dashboard, and a broken-but-recent run can't masquerade as healthy.
 */
export default function HealthLine({ health }: { health: EngineHealth }) {
  return (
    <div
      className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[11px]"
      style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}
    >
      {health.crons.map((c) => {
        const unhealthy = c.stale || c.failed
        const title = c.failed
          ? `${c.label} ran but failed — check its API key / logs`
          : c.stale
            ? `${c.label} looks stuck — last ran ${c.lastRunAt ? `${timeAgo(c.lastRunAt)} ago` : 'never'}`
            : `${c.label} healthy`
        return (
          <span
            key={c.kind}
            className="inline-flex items-center gap-1.5"
            style={{ color: unhealthy ? '#dc2626' : 'var(--color-text-faint)' }}
            title={title}
          >
            <span aria-hidden style={{ color: unhealthy ? '#dc2626' : '#16a34a' }}>
              {unhealthy ? '✗' : '●'}
            </span>
            {c.label} {c.lastRunAt ? `${timeAgo(c.lastRunAt)} ago` : 'never run'}
            {c.failed ? ' · failed' : ''}
          </span>
        )
      })}
    </div>
  )
}
