'use client'

import { useState } from 'react'
import type { RoleRow, KpiCounts, KpiDeltas } from '@/lib/engine/dashboard'
import type { Reminder } from '@/lib/engine/reminders'
import KpiTile from './KpiTile'
import RoleQueueTable from './RoleQueueTable'
import TodayBar from './TodayBar'
import { type StatusView, countByView } from './statusView'

interface QueueWithTilesProps {
  counts: KpiCounts
  deltas: KpiDeltas
  rows: RoleRow[]
  reminders: Reminder[]
  /** Server-rendered sidebar (reminders + activity), passed through. */
  sidebar: React.ReactNode
}

function scrollToQueue() {
  if (typeof document !== 'undefined') {
    document.getElementById('role-queue')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

export default function QueueWithTiles({
  counts,
  deltas,
  rows,
  reminders,
  sidebar,
}: QueueWithTilesProps) {
  const [statusView, setStatusView] = useState<StatusView>('active')
  const viewCounts = countByView(rows)

  // "Today" metrics
  const now = Date.now()
  const readyToApply = rows.filter((r) => r.status === 'tailored').length
  const dueReminders = reminders.filter(
    (r) => new Date(r.due_at).getTime() <= now,
  ).length

  function showActive() {
    setStatusView('active')
    scrollToQueue()
  }

  return (
    <>
      <TodayBar
        readyToApply={readyToApply}
        dueReminders={dueReminders}
        draftsToSend={counts.draftsToSend}
        onShowActive={showActive}
      />

      {/* KPI tiles — clickable, drive the queue's status filter */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-6">
        <KpiTile
          label="Sourced"
          value={counts.sourced}
          delta={deltas.sourced7d}
          onClick={() => setStatusView('all')}
          active={statusView === 'all'}
        />
        <KpiTile
          label="In queue"
          value={counts.inQueue}
          subtext="awaiting"
          actionable
          onClick={() => setStatusView('active')}
          active={statusView === 'active'}
        />
        <KpiTile
          label="Applied"
          value={counts.applied}
          delta={deltas.applied7d}
          onClick={() => setStatusView('applied')}
          active={statusView === 'applied'}
        />
        <KpiTile
          label="Responses"
          value={counts.responded}
          delta={deltas.responded7d}
          onClick={() => setStatusView('applied')}
        />
        <KpiTile
          label="Drafts"
          value={counts.draftsToSend}
          subtext="to send"
          actionable
          onClick={showActive}
        />
      </div>

      {/* Queue + sidebar */}
      <div id="role-queue" className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-8">
        <div className="lg:col-span-8">
          <RoleQueueTable
            rows={rows}
            statusView={statusView}
            onStatusView={setStatusView}
            viewCounts={viewCounts}
          />
        </div>
        <aside className="lg:col-span-4 space-y-6">{sidebar}</aside>
      </div>
    </>
  )
}
