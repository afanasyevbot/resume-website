import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { OUTCOME_STATUSES, ROLE_STATUSES, canLogOutcome } from '../statusTypes'

describe('ROLE_STATUSES ⇄ DB CHECK drift guard', () => {
  it('every outcome status is also a valid role status', () => {
    for (const o of OUTCOME_STATUSES) expect(ROLE_STATUSES).toContain(o)
  })

  it('covers the statuses the engine actually writes', () => {
    // The lifecycle the code sets via `status = '...'` across the engine.
    for (const s of ['scored', 'tailored', 'awaiting_approval', 'needs_review', 'applied', 'discarded', 'archived']) {
      expect(ROLE_STATUSES).toContain(s)
    }
  })

  it('matches the CHECK list in migration 0015 EXACTLY (no silent drift)', () => {
    const sql = readFileSync(
      join(process.cwd(), 'db/migrations/0015_roles_url_unique_status_check.sql'),
      'utf8',
    )
    // Pull the quoted values inside the status in (...) CHECK.
    const block = sql.slice(sql.indexOf('status in ('))
    const quoted = [...block.matchAll(/'([a-z_]+)'/g)].map((m) => m[1])
    expect(new Set(quoted)).toEqual(new Set(ROLE_STATUSES))
  })
})

describe('canLogOutcome — outcome transitions', () => {
  it('an applied role can log any outcome', () => {
    for (const o of OUTCOME_STATUSES) {
      expect(canLogOutcome('applied', o)).toBe(true)
    }
  })

  it('outcomes can be corrected (responded → interviewing → offer / rejected)', () => {
    expect(canLogOutcome('responded', 'interviewing')).toBe(true)
    expect(canLogOutcome('interviewing', 'offer')).toBe(true)
    expect(canLogOutcome('interviewing', 'rejected')).toBe(true)
    expect(canLogOutcome('offer', 'rejected')).toBe(true)
  })

  it('roles that never applied cannot log outcomes', () => {
    for (const s of ['sourced', 'scored', 'tailored', 'awaiting_approval', 'needs_review', 'discarded', 'archived']) {
      expect(canLogOutcome(s, 'responded')).toBe(false)
    }
  })

  it('rejects unknown outcome values', () => {
    expect(canLogOutcome('applied', 'ghosted')).toBe(false)
    expect(canLogOutcome('applied', '')).toBe(false)
  })
})
