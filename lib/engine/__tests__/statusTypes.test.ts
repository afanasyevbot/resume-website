import { describe, it, expect } from 'vitest'
import { OUTCOME_STATUSES, canLogOutcome } from '../statusTypes'

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
