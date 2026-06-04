import { loadDashboard } from '@/lib/engine/dashboard'
import { recordVisitAndGetDigest } from '@/lib/engine/visit'
import EngineHeader from '@/components/engine/EngineHeader'
import SinceDigest from '@/components/engine/SinceDigest'
import KpiTile from '@/components/engine/KpiTile'
import RoleQueueTable from '@/components/engine/RoleQueueTable'
import ActivityFeed from '@/components/engine/ActivityFeed'
import ReminderList from '@/components/engine/ReminderList'

export const dynamic = 'force-dynamic'

export default async function EngineDashboard() {
  // Run the visit-tracking + dashboard load in parallel.
  const [data, digest] = await Promise.all([
    loadDashboard(),
    recordVisitAndGetDigest(),
  ])
  const { counts, deltas, queue, activity, reminders } = data

  return (
    <main
      className="max-w-[1200px] mx-auto px-6 lg:px-10 pt-10 pb-24"
      style={{ fontFamily: 'var(--font-sans)' }}
    >
      <EngineHeader digestSlot={<SinceDigest digest={digest} />} />

      {/* Dashed semantic divider */}
      <div
        className="my-8"
        style={{
          borderTop: '1px dashed rgba(212,178,120,0.12)',
        }}
      />

      {/* KPI row */}
      <section className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KpiTile
          label="Sourced"
          value={counts.sourced}
          delta={deltas.sourced7d}
        />
        <KpiTile
          label="In queue"
          value={counts.inQueue}
          subtext="awaiting"
          actionable
        />
        <KpiTile
          label="Applied"
          value={counts.applied}
          delta={deltas.applied7d}
        />
        <KpiTile
          label="Responses"
          value={counts.responded}
          delta={deltas.responded7d}
        />
        <KpiTile
          label="Drafts"
          value={counts.draftsToSend}
          subtext="to send"
          actionable
        />
      </section>

      {/* Secondary dashed divider */}
      <div
        className="my-8"
        style={{
          borderTop: '1px dashed rgba(212,178,120,0.08)',
        }}
      />

      {/* Queue + sidebar (reminders above activity) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <RoleQueueTable rows={queue} />
        </div>
        <aside className="lg:col-span-4 space-y-6">
          <ReminderList reminders={reminders} />
          <ActivityFeed events={activity} />
        </aside>
      </section>
    </main>
  )
}
