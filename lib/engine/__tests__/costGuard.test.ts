import { describe, it, expect } from 'vitest'
import { estimateCostCents } from '../costGuard'

/**
 * Anthropic returns four DISJOINT token counts; total cost is their straight
 * sum. The old model wrongly subtracted cache-read from input and never counted
 * cache-write, under-reporting spend. These tests pin the corrected model.
 * Rates (cents/token): input 0.0003, output 0.0015, cacheRead 0.00003,
 * cacheCreation 0.000375.
 */
describe('estimateCostCents — disjoint token-count cost model', () => {
  it('is zero for zero tokens', () => {
    expect(estimateCostCents({ inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheCreationTokens: 0 })).toBe(0)
  })

  it('sums the four disjoint counters (no subtraction)', () => {
    // 1000*0.0003 + 600*0.0015 + 4500*0.00003 = 0.3 + 0.9 + 0.135 = 1.335
    const cost = estimateCostCents({ inputTokens: 1000, outputTokens: 600, cacheReadTokens: 4500, cacheCreationTokens: 0 })
    expect(cost).toBeCloseTo(1.335, 3)
  })

  it('charges cache-WRITE tokens at 1.25x input (the previously-missed cost)', () => {
    // 1000*0.0003 + 1400*0.0015 + 5000*0.000375 = 0.3 + 2.1 + 1.875 = 4.275
    const cost = estimateCostCents({ inputTokens: 1000, outputTokens: 1400, cacheReadTokens: 0, cacheCreationTokens: 5000 })
    expect(cost).toBeCloseTo(4.275, 3)
  })

  it('treats input_tokens as already-uncached (no double-discount of cache-read)', () => {
    // input_tokens and cache_read are SEPARATE Anthropic fields — both are charged.
    const withRead = estimateCostCents({ inputTokens: 1000, outputTokens: 600, cacheReadTokens: 4500, cacheCreationTokens: 0 })
    const noRead = estimateCostCents({ inputTokens: 1000, outputTokens: 600, cacheReadTokens: 0, cacheCreationTokens: 0 })
    expect(withRead).toBeGreaterThan(noRead)
  })

  it('handles a no-cache call (all fresh input)', () => {
    const cost = estimateCostCents({ inputTokens: 1000, outputTokens: 500, cacheReadTokens: 0, cacheCreationTokens: 0 })
    expect(cost).toBeCloseTo(1.05, 3) // 0.3 + 0.75
  })
})
