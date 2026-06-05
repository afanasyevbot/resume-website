import { describe, it, expect } from 'vitest'
import { estimateCostCents } from '../costGuard'

describe('estimateCostCents', () => {
  it('computes zero for zero tokens', () => {
    expect(estimateCostCents(0, 0, 0)).toBe(0)
  })

  it('computes a typical score call (~5500 input, ~600 output, ~4500 cached)', () => {
    // uncached input = 5500 - 4500 = 1000 tokens
    // cost = 1000 * 0.0003 + 4500 * 0.00003 + 600 * 0.0015
    //      = 0.3 + 0.135 + 0.9 = 1.335 cents ≈ $0.013
    const cost = estimateCostCents(5500, 600, 4500)
    expect(cost).toBeCloseTo(1.335, 2)
  })

  it('computes a typical tailor call (~6800 input, ~1400 output, ~5000 cached)', () => {
    // uncached = 6800 - 5000 = 1800
    // cost = 1800 * 0.0003 + 5000 * 0.00003 + 1400 * 0.0015
    //      = 0.54 + 0.15 + 2.1 = 2.79 cents ≈ $0.028
    const cost = estimateCostCents(6800, 1400, 5000)
    expect(cost).toBeCloseTo(2.79, 2)
  })

  it('handles no caching (all input is uncached)', () => {
    const cost = estimateCostCents(1000, 500, 0)
    // 1000 * 0.0003 + 500 * 0.0015 = 0.3 + 0.75 = 1.05
    expect(cost).toBeCloseTo(1.05, 2)
  })

  it('caps uncached at zero if cached > input (shouldn\'t happen, but safe)', () => {
    // Math.max(0, ...) prevents negative uncached
    const cost = estimateCostCents(1000, 500, 2000)
    // uncached = 0, cached charge = 2000 * 0.00003 = 0.06
    // output = 500 * 0.0015 = 0.75
    expect(cost).toBeCloseTo(0.81, 2)
  })
})
