import type { Reminder } from '@/lib/engine/reminders'
import ReminderItem from './ReminderItem'

interface ReminderListProps {
  reminders: Reminder[]
}

export default function ReminderList({ reminders }: ReminderListProps) {
  return (
    <div
      id="reminders-panel"
      className="vellum rounded-lg overflow-hidden"
      style={{ border: '1px solid var(--color-border)' }}
    >
      {/* Section label */}
      <div
        className="px-5 py-3 flex items-baseline justify-between"
        style={{ borderBottom: '1px dashed rgba(212,178,120,0.10)' }}
      >
        <p
          className="text-[11px] font-medium uppercase tracking-widest"
          style={{
            color: 'var(--color-text-faint)',
            fontFamily: 'var(--font-sans)',
            letterSpacing: '0.14em',
          }}
        >
          Follow-ups
          <span style={{ color: 'var(--color-text-ghost)' }}>
            {' · '}
            {reminders.length}
          </span>
        </p>
      </div>

      <div className="overflow-y-auto" style={{ maxHeight: 320 }}>
        {reminders.length === 0 ? (
          <div
            className="px-5 py-8 text-center"
            style={{
              color: 'var(--color-text-ghost)',
              fontFamily: 'var(--font-sans)',
              fontSize: 12,
            }}
          >
            No follow-ups yet. They&rsquo;ll appear here after you Mark Applied on roles.
          </div>
        ) : (
          <ul className="px-5 py-1 space-y-0">
            {reminders.map((r) => (
              <ReminderItem key={r.id} reminder={r} />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
