import { timeAgo } from '@/lib/engine/dashboard'
import type { EngineHealth } from '@/lib/engine/health'

/**
 * The heartbeat: a quiet row of status chips, one per cron — when it last ran,
 * green when healthy, amber-red when stale or failed. Always visible so a dead
 * job can't hide behind a calm dashboard.
 */
export default function HealthLine({ health }: { health: EngineHealth }) {
  if (health.crons.length === 0) return null
  return (
    <div className="flex flex-wrap items-center gap-2">
      {health.crons.map((c) => {
        const unhealthy = c.stale || c.failed
        const dot = unhealthy ? '#dc2626' : '#16a34a'
        const title = c.failed
          ? `${c.label} ran but failed — check its API key / logs`
          : c.stale
            ? `${c.label} looks stuck — last ran ${c.lastRunAt ? `${timeAgo(c.lastRunAt)} ago` : 'never'}`
            : `${c.label} healthy`
        return (
          <span
            key={c.kind}
            className="eng-pill"
            title={title}
            style={{
              background: unhealthy ? 'rgba(220,38,38,0.07)' : 'var(--color-surface)',
              border: `1px solid ${unhealthy ? 'rgba(220,38,38,0.25)' : 'var(--color-border)'}`,
              color: unhealthy ? '#b91c1c' : 'var(--color-text-secondary)',
            }}
          >
            <span aria-hidden style={{ width: 6, height: 6, borderRadius: 999, background: dot, display: 'inline-block' }} />
            <span style={{ fontWeight: 500 }}>{c.label}</span>
            <span style={{ color: unhealthy ? '#c2410c' : 'var(--color-text-muted)' }}>
              {c.failed ? 'failed' : c.lastRunAt ? `${timeAgo(c.lastRunAt)} ago` : 'never run'}
            </span>
          </span>
        )
      })}
    </div>
  )
}
