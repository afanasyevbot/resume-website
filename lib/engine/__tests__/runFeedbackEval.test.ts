import { describe, it, expect } from 'vitest'
import { runFeedbackEval } from '../eval/runFeedbackEval'
import type { FeedbackEvalRow } from '../eval/runFeedbackEval'

describe('runFeedbackEval', () => {
  it('handles an empty set without dividing by zero', () => {
    const r = runFeedbackEval([])
    expect(r.n).toBe(0)
    expect(r.mae).toBe(0)
    expect(r.agreement).toBe(0)
    expect(r.breakdown).toEqual({
      tailorAgree: 0,
      tailorDisagree: 0,
      discardAgree: 0,
      discardDisagree: 0,
    })
  })

  it('counts a perfect tailor agreement', () => {
    // matcher 80, anchor 80 → diff 0; matcher >= 60 and rating 1 → tailorAgree
    const rows: FeedbackEvalRow[] = [{ matcherScore: 80, rating: 1 }]
    const r = runFeedbackEval(rows)
    expect(r.n).toBe(1)
    expect(r.mae).toBe(0)
    expect(r.agreement).toBe(1)
    expect(r.breakdown.tailorAgree).toBe(1)
  })

  it('counts a perfect discard agreement', () => {
    // matcher 20, anchor 20 → diff 0; matcher < 60 and rating -1 → discardAgree
    const rows: FeedbackEvalRow[] = [{ matcherScore: 20, rating: -1 }]
    const r = runFeedbackEval(rows)
    expect(r.mae).toBe(0)
    expect(r.agreement).toBe(1)
    expect(r.breakdown.discardAgree).toBe(1)
  })

  it('flags a false-positive tailor (matcher said yes, human said no)', () => {
    // matcher 75, rating -1 → anchor 20, diff 55; matcher >= 60 and rating -1
    const rows: FeedbackEvalRow[] = [{ matcherScore: 75, rating: -1 }]
    const r = runFeedbackEval(rows)
    expect(r.mae).toBe(55)
    expect(r.agreement).toBe(0)
    expect(r.breakdown.tailorDisagree).toBe(1)
  })

  it('flags a missed good fit (matcher said no, human said yes)', () => {
    // matcher 40, rating 1 → anchor 80, diff 40; matcher < 60 and rating 1
    const rows: FeedbackEvalRow[] = [{ matcherScore: 40, rating: 1 }]
    const r = runFeedbackEval(rows)
    expect(r.mae).toBe(40)
    expect(r.agreement).toBe(0)
    expect(r.breakdown.discardDisagree).toBe(1)
  })

  it('treats the 60-threshold as inclusive on the tailor side', () => {
    // Exactly 60 should count as tailor-side per the >=60 rule.
    const rows: FeedbackEvalRow[] = [{ matcherScore: 60, rating: 1 }]
    const r = runFeedbackEval(rows)
    expect(r.breakdown.tailorAgree).toBe(1)
    expect(r.agreement).toBe(1)
  })

  it('aggregates a mixed batch correctly', () => {
    const rows: FeedbackEvalRow[] = [
      { matcherScore: 85, rating: 1 }, // tailorAgree, diff 5
      { matcherScore: 72, rating: 1 }, // tailorAgree, diff 8
      { matcherScore: 70, rating: -1 }, // tailorDisagree, diff 50
      { matcherScore: 30, rating: -1 }, // discardAgree, diff 10
      { matcherScore: 45, rating: 1 }, // discardDisagree, diff 35
    ]
    const r = runFeedbackEval(rows)
    expect(r.n).toBe(5)
    // Total diff: 5+8+50+10+35 = 108; mae = 21.6
    expect(r.mae).toBeCloseTo(21.6, 5)
    // Agreements: tailorAgree(2) + discardAgree(1) = 3 of 5
    expect(r.agreement).toBeCloseTo(3 / 5, 5)
    expect(r.breakdown).toEqual({
      tailorAgree: 2,
      tailorDisagree: 1,
      discardAgree: 1,
      discardDisagree: 1,
    })
  })
})
