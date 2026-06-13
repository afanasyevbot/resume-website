import { describe, it, expect } from 'vitest'
import { runFeedbackEval } from '../eval/runFeedbackEval'
import type { FeedbackEvalRow } from '../eval/runFeedbackEval'
import { AUTO_FIT } from '../thresholds'

describe('runFeedbackEval — measured at the real auto-apply floor (AUTO_FIT)', () => {
  it('defaults its threshold to AUTO_FIT, not a hardcoded number', () => {
    expect(runFeedbackEval([{ matcherScore: AUTO_FIT, rating: 1 }]).threshold).toBe(AUTO_FIT)
  })

  it('handles an empty set without dividing by zero', () => {
    const r = runFeedbackEval([])
    expect(r.n).toBe(0)
    expect(r.mae).toBe(0)
    expect(r.agreement).toBe(0)
    expect(r.breakdown).toEqual({
      applyAgree: 0,
      applyDisagree: 0,
      holdAgree: 0,
      holdDisagree: 0,
    })
  })

  it('counts a role at/above AUTO_FIT that Matthew liked as an apply-agreement', () => {
    // matcher 80 >= 75 and rating 1 → applyAgree; anchor 80 → diff 0
    const rows: FeedbackEvalRow[] = [{ matcherScore: 80, rating: 1 }]
    const r = runFeedbackEval(rows)
    expect(r.n).toBe(1)
    expect(r.mae).toBe(0)
    expect(r.agreement).toBe(1)
    expect(r.breakdown.applyAgree).toBe(1)
  })

  it('counts a low-scored role Matthew disliked as a hold-agreement', () => {
    // matcher 20 < 75 and rating -1 → holdAgree; anchor 20 → diff 0
    const rows: FeedbackEvalRow[] = [{ matcherScore: 20, rating: -1 }]
    const r = runFeedbackEval(rows)
    expect(r.mae).toBe(0)
    expect(r.agreement).toBe(1)
    expect(r.breakdown.holdAgree).toBe(1)
  })

  it('flags a false apply (matcher would auto-apply, human said no)', () => {
    // matcher 80 >= 75 and rating -1 → applyDisagree; anchor 20, diff 60
    const rows: FeedbackEvalRow[] = [{ matcherScore: 80, rating: -1 }]
    const r = runFeedbackEval(rows)
    expect(r.mae).toBe(60)
    expect(r.agreement).toBe(0)
    expect(r.breakdown.applyDisagree).toBe(1)
  })

  it('flags THE MISS: a 72 Matthew loved that the engine would NOT auto-apply', () => {
    // This is the lived problem — good roles land at 72, below AUTO_FIT(75),
    // so the engine holds them and never auto-applies. rating 1, score 72 < 75.
    const rows: FeedbackEvalRow[] = [{ matcherScore: 72, rating: 1 }]
    const r = runFeedbackEval(rows)
    expect(r.agreement).toBe(0)
    expect(r.breakdown.holdDisagree).toBe(1)
  })

  it('treats exactly AUTO_FIT as inclusive on the apply side', () => {
    const rows: FeedbackEvalRow[] = [{ matcherScore: AUTO_FIT, rating: 1 }]
    const r = runFeedbackEval(rows)
    expect(r.breakdown.applyAgree).toBe(1)
    expect(r.agreement).toBe(1)
  })

  it('accepts an explicit threshold override (for threshold sweeps)', () => {
    // At a 70 cutoff, a 72 thumbs-up becomes an agreement instead of a miss.
    const rows: FeedbackEvalRow[] = [{ matcherScore: 72, rating: 1 }]
    expect(runFeedbackEval(rows, 70).breakdown.applyAgree).toBe(1)
    expect(runFeedbackEval(rows, 75).breakdown.holdDisagree).toBe(1)
  })

  it('aggregates a mixed batch correctly at AUTO_FIT=75', () => {
    const rows: FeedbackEvalRow[] = [
      { matcherScore: 85, rating: 1 }, // applyAgree, diff 5
      { matcherScore: 78, rating: 1 }, // applyAgree, diff 2
      { matcherScore: 80, rating: -1 }, // applyDisagree, diff 60
      { matcherScore: 30, rating: -1 }, // holdAgree, diff 10
      { matcherScore: 72, rating: 1 }, // holdDisagree (the miss), diff 8
    ]
    const r = runFeedbackEval(rows)
    expect(r.n).toBe(5)
    // Total diff: 5+2+60+10+8 = 85; mae = 17
    expect(r.mae).toBeCloseTo(17, 5)
    // Agreements: applyAgree(2) + holdAgree(1) = 3 of 5
    expect(r.agreement).toBeCloseTo(3 / 5, 5)
    expect(r.breakdown).toEqual({
      applyAgree: 2,
      applyDisagree: 1,
      holdAgree: 1,
      holdDisagree: 1,
    })
  })
})
