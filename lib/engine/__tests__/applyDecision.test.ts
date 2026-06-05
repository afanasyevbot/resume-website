import { describe, it, expect } from 'vitest'
import { decideApplyOutcome } from '../applyDecision'

describe('decideApplyOutcome', () => {
  it('marks applied only when the browser explicitly confirms', () => {
    expect(decideApplyOutcome({ submitted: true, confirmed: true }, false)).toBe('applied')
  })

  it('does NOT mark applied when submit was clicked but not confirmed', () => {
    // The core bug guard: a clicked submit button is not proof of submission.
    expect(decideApplyOutcome({ submitted: true, confirmed: false }, false)).toBe('needs_review')
  })

  it('treats submitted with no confirmation field as needs_review', () => {
    expect(decideApplyOutcome({ submitted: true }, false)).toBe('needs_review')
  })

  it('never marks applied on a dry run, even if confirmed', () => {
    expect(decideApplyOutcome({ submitted: true, confirmed: true }, true)).toBe('skipped')
  })

  it('routes an intentional skip (blocker/gate) to skipped', () => {
    expect(decideApplyOutcome({ skipped: true, reason: 'screening_questions' }, false)).toBe('skipped')
  })

  it('routes an empty/error result to failed', () => {
    expect(decideApplyOutcome({}, false)).toBe('failed')
  })

  it('does not let a stray success flag override missing confirmation', () => {
    // Only `confirmed` promotes to applied — `success` alone must not.
    expect(decideApplyOutcome({ submitted: true, success: true, confirmed: false }, false)).toBe('needs_review')
  })
})
