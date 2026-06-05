import type { RoleRow } from '@/lib/engine/dashboard'

/** Which slice of the pipeline the queue is showing. */
export type StatusView = 'active' | 'applied' | 'all'

// Pre-apply, still needs action.
const ACTIVE = new Set(['scored', 'tailored', 'queued'])
// Submitted or past submission.
const APPLIED = new Set(['applied', 'responded', 'interviewing', 'offer', 'rejected'])

export function statusMatches(row: RoleRow, view: StatusView): boolean {
  if (view === 'all') return true
  if (view === 'applied') return APPLIED.has(row.status)
  return ACTIVE.has(row.status)
}

export function countByView(rows: RoleRow[]): Record<StatusView, number> {
  return {
    active: rows.filter((r) => ACTIVE.has(r.status)).length,
    applied: rows.filter((r) => APPLIED.has(r.status)).length,
    all: rows.length,
  }
}
