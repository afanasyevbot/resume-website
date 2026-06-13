import { timeAgo } from '@/lib/engine/dashboard'
import type { EngineHealth } from '@/lib/engine/health'

/**
 * The heartbeat: a persistent one-line readout of when each cron last ran,
 * green when fresh, red when stale. Always visible so a dead job can't hide
 * behind a quiet dashboard.
 */
export default function HealthLine({ health }: { health: EngineHealth }) {
  return (
    <div
      className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[11px]"
      style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}
    >
      {health.crons.map((c) => (
        <span
          key={c.kind}
          className="inline-flex items-center gap-1.5"
          style={{ color: c.stale ? '#dc2626' : 'var(--color-text-faint)' }}
          title={c.stale ? `${c.label} looks stuck — last ran ${c.lastRunAt ? `${timeAgo(c.lastRunAt)} ago` : 'never'}` : `${c.label} healthy`}
        >
          <span aria-hidden style={{ color: c.stale ? '#dc2626' : '#16a34a' }}>
            {c.stale ? '✗' : '●'}
          </span>
          {c.label} {c.lastRunAt ? `${timeAgo(c.lastRunAt)} ago` : 'never run'}
        </span>
      ))}
    </div>
  )
}
