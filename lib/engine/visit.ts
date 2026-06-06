import { sql } from './db'
import { timeAgo } from './dashboard'

export interface VisitDigest {
  /** ISO timestamp of the previous visit ("since" anchor). null = first ever visit. */
  since: string | null
  /** Pretty "2h" / "3d" form of `since` relative to now. Empty when since is null. */
  sinceLabel: string
  /** Counts strictly AFTER `since`. */
  sourced: number
  tailored: number
  applied: number
  responded: number
  /** Convenience: true if any deltas exist. */
  hasUpdates: boolean
}

const SHIFT_THRESHOLD_MS = 60_000 // refreshes within 1 minute don't shift the anchor

/**
 * Tracks the visit and returns a "since last seen" digest.
 *
 * Reads the current `engine_state.last_seen_at`. If the gap since that value is
 * meaningful (>1 minute, so refreshing doesn't reset everything):
 *   - the previous `last_seen_at` is shifted into `prev_seen_at`
 *   - `last_seen_at` is updated to now
 *   - the digest is computed against the OLD `last_seen_at` (what the user saw last visit)
 * Otherwise (refresh case): keep using `prev_seen_at` as the anchor.
 */
export async function recordVisitAndGetDigest(): Promise<VisitDigest> {
  const stateRows = await sql`select last_seen_at, prev_seen_at from engine_state where id = 1`
  const state = stateRows[0] as
    | { last_seen_at: string; prev_seen_at: string | null }
    | undefined

  if (!state) {
    // First-ever visit (table empty) — seed it and report no updates.
    await sql`insert into engine_state (id, last_seen_at) values (1, now()) on conflict do nothing`
    return emptyDigest(null)
  }

  const lastSeen = new Date(state.last_seen_at)
  const gapMs = Date.now() - lastSeen.getTime()

  let anchor: string | null
  if (gapMs > SHIFT_THRESHOLD_MS) {
    // Real new visit. The OLD last_seen becomes the "since" anchor; bump last_seen to now.
    anchor = state.last_seen_at
    await sql`
      update engine_state
         set prev_seen_at = ${state.last_seen_at},
             last_seen_at = now()
       where id = 1
    `
  } else {
    // Refresh within 1 minute — use the previous anchor so deltas stay stable.
    anchor = state.prev_seen_at
  }

  if (!anchor) return emptyDigest(null)

  // Count deltas against the anchor.
  const roleCounts = await sql`
    select
      count(*) filter (where created_at > ${anchor}) as sourced
    from roles
  `
  const eventCounts = await sql`
    select
      count(*) filter (where kind = 'tailored'   and created_at > ${anchor}) as tailored,
      count(*) filter (where kind = 'applied'    and created_at > ${anchor}) as applied,
      count(*) filter (where kind = 'responded'  and created_at > ${anchor}) as responded
    from events
  `
  const r = roleCounts[0] as Record<string, string | number>
  const e = eventCounts[0] as Record<string, string | number>

  const digest: VisitDigest = {
    since: anchor,
    sinceLabel: timeAgo(anchor),
    sourced: Number(r.sourced ?? 0),
    tailored: Number(e.tailored ?? 0),
    applied: Number(e.applied ?? 0),
    responded: Number(e.responded ?? 0),
    hasUpdates: false,
  }
  digest.hasUpdates =
    digest.sourced + digest.tailored + digest.applied + digest.responded > 0
  return digest
}

function emptyDigest(since: string | null): VisitDigest {
  return {
    since,
    sinceLabel: since ? timeAgo(since) : '',
    sourced: 0,
    tailored: 0,
    applied: 0,
    responded: 0,
    hasUpdates: false,
  }
}
