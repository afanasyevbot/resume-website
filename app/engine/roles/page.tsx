import Link from 'next/link'
import { loadDashboard } from '@/lib/engine/dashboard'
import QueueWithTiles from '@/components/engine/QueueWithTiles'
import ReminderList from '@/components/engine/ReminderList'
import ActivityFeed from '@/components/engine/ActivityFeed'

export const dynamic = 'force-dynamic'

/**
 * The full working view: every role, KPI tiles, filters, reminders, activity.
 * The front page (/engine) is the brief + decision deck; this is the archive
 * and workbench for digging in.
 */
export default async function RolesPage() {
  const { counts, deltas, queue, activity, reminders } = await loadDashboard({ withHealth: false })

  return (
    <main
      className="max-w-[1200px] mx-auto px-6 lg:px-10 pt-10 pb-24"
      style={{ fontFamily: 'var(--font-sans)' }}
    >
      <div className="flex items-baseline justify-between mb-8">
        <h1
          className="text-[22px] font-semibold uppercase"
          style={{
            fontFamily: 'var(--font-display)',
            color: 'var(--color-text-bright)',
            letterSpacing: '0.12em',
          }}
        >
          All roles
        </h1>
        <Link
          href="/engine"
          className="text-[12px] uppercase"
          style={{
            color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-display)',
            letterSpacing: '0.18em',
            textDecoration: 'none',
          }}
        >
          ← Back to the brief
        </Link>
      </div>

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
