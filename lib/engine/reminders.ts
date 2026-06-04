import { sql } from './db'

/**
 * LinkedIn follow-up reminders.
 *
 * HARD LINE: this module NEVER auto-sends outreach. It only schedules and
 * surfaces reminders so Matthew can compose + send manually. The
 * `linkedinSearchUrl` helper just builds a search URL Matthew clicks.
 */

export const REMINDER_KINDS = [
  'linkedin_follow_up',
  'linkedin_check_in',
  'send_outreach',
] as const
export type ReminderKind = (typeof REMINDER_KINDS)[number]

export interface Reminder {
  id: number
  role_id: number
  kind: ReminderKind
  due_at: string
  completed_at: string | null
  snoozed_until: string | null
  notes: string | null
  created_at: string
  company?: string
  title?: string
}

/**
 * Builds a LinkedIn people search URL for the given company. Pure helper —
 * used by the UI to deep-link Matthew into a search; he picks the human and
 * sends manually.
 */
export function linkedinSearchUrl(company: string): string {
  return `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(company)}`
}

/**
 * Returns reminders that are pending (not completed) and not currently snoozed
 * past `now()`. Joined with roles for company/title display. Ordered by due_at
 * ascending so the most overdue surfaces first.
 */
export async function listDueReminders(limit = 20): Promise<Reminder[]> {
  const rows = await sql`
    select r.id, r.role_id, r.kind, r.due_at, r.completed_at, r.snoozed_until,
           r.notes, r.created_at, ro.company, ro.title
    from reminders r
    join roles ro on ro.id = r.role_id
    where r.completed_at is null
      and (r.snoozed_until is null or r.snoozed_until <= now())
    order by r.due_at asc
    limit ${limit}
  `
  // Neon HTTP returns BIGINT as string — coerce ids to Number so the runtime
  // shape matches the Reminder type and downstream API params validate.
  return (rows as Array<Reminder & { id: string | number; role_id: string | number }>).map(
    (r) => ({
      ...r,
      id: Number(r.id),
      role_id: Number(r.role_id),
    }),
  ) as Reminder[]
}

export async function completeReminder(id: number): Promise<void> {
  await sql`update reminders set completed_at = now() where id = ${id}`
}

export async function snoozeReminder(id: number, days: number): Promise<void> {
  // Interval arithmetic via string-cast — parameterizing the days value
  // keeps it safe from injection while letting Postgres parse the interval.
  await sql`update reminders set snoozed_until = now() + (${days} || ' days')::interval where id = ${id}`
}
