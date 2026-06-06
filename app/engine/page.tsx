import { loadDashboard } from '@/lib/engine/dashboard'
import { recordVisitAndGetDigest } from '@/lib/engine/visit'
import EngineHeader from '@/components/engine/EngineHeader'
import SinceDigest from '@/components/engine/SinceDigest'
import ActivityFeed from '@/components/engine/ActivityFeed'
import ReminderList from '@/components/engine/ReminderList'
import QueueWithTiles from '@/components/engine/QueueWithTiles'

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

      {/* Today bar + clickable KPI tiles + queue + sidebar (client wrapper
          so the tiles can drive the queue's status filter) */}
      <QueueWithTiles
        counts={counts}
        deltas={deltas}
        rows={queue}
        reminders={reminders}
        sidebar={
          <>
            <ReminderList reminders={reminders} />
            <ActivityFeed events={activity} />
          </>
        }
      />
    </main>
  )
}
