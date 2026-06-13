import { describe, it, expect } from 'vitest'
import { buildAutoApplyRunDetail, runAllFailed, type RunCounts, type TailoredExclusions } from '../autoApplyAudit'

describe('runAllFailed — browser-service-down signature', () => {
  it('is true when the run attempted submits and every one failed', () => {
    expect(runAllFailed({ total: 3, applied: 0, failed: 3 })).toBe(true)
  })

  it('is false for a healthy "nothing eligible" run (total 0) — not an outage', () => {
    expect(runAllFailed({ total: 0, applied: 0, failed: 0 })).toBe(false)
  })

  it('is false when at least one submit succeeded', () => {
    expect(runAllFailed({ total: 3, applied: 1, failed: 2 })).toBe(false)
  })

  it('is false when some failed but others were skipped/needs-review (not a total outage)', () => {
    expect(runAllFailed({ total: 3, applied: 0, failed: 1 })).toBe(false)
  })
})

const ZERO_EXCLUSIONS: TailoredExclusions = {
  tailoredTotal: 0,
  blockedByUrlWhitelist: 0,
  belowFitFloor: 0,
  noPackage: 0,
  eligible: 0,
}

function counts(partial: Partial<RunCounts> = {}): RunCounts {
  return { applied: 0, needsReview: 0, skipped: 0, failed: 0, awaitingApproval: 0, total: 0, ...partial }
}

describe('buildAutoApplyRunDetail', () => {
  it('explains a run with zero eligible roles, naming every exclusion reason', () => {
    const detail = buildAutoApplyRunDetail(
      counts(),
      { tailoredTotal: 3, blockedByUrlWhitelist: 2, belowFitFloor: 1, noPackage: 0, eligible: 0 },
      { dryRun: false, minFit: 70, appliedToday: 0 },
    )
    expect(detail.summary).toBe(
      '0 eligible of 3 tailored — 2 blocked by ATS whitelist, 1 below fit 70',
    )
    expect(detail.eligible).toBe(0)
    expect(detail.tailoredTotal).toBe(3)
  })

  it('reports a clean "nothing tailored" run', () => {
    const detail = buildAutoApplyRunDetail(counts(), ZERO_EXCLUSIONS, {
      dryRun: false,
      minFit: 70,
      appliedToday: 0,
    })
    expect(detail.summary).toBe('0 eligible of 0 tailored')
  })

  it('summarizes outcomes when roles were processed', () => {
    const detail = buildAutoApplyRunDetail(
      counts({ applied: 1, awaitingApproval: 2, failed: 1, total: 4 }),
      { tailoredTotal: 4, blockedByUrlWhitelist: 0, belowFitFloor: 0, noPackage: 0, eligible: 4 },
      { dryRun: false, minFit: 70, appliedToday: 1 },
    )
    expect(detail.summary).toBe('1 applied, 2 awaiting approval, 1 failed')
    expect(detail.applied).toBe(1)
    expect(detail.awaitingApproval).toBe(2)
  })

  it('marks dry runs so they are never mistaken for real submissions', () => {
    const detail = buildAutoApplyRunDetail(
      counts({ skipped: 1, total: 1 }),
      { tailoredTotal: 1, blockedByUrlWhitelist: 0, belowFitFloor: 0, noPackage: 0, eligible: 1 },
      { dryRun: true, minFit: 70, appliedToday: 0 },
    )
    expect(detail.dryRun).toBe(true)
    expect(detail.summary).toMatch(/dry run/i)
  })

  it('omits zero-count reasons from the summary', () => {
    const detail = buildAutoApplyRunDetail(
      counts(),
      { tailoredTotal: 1, blockedByUrlWhitelist: 0, belowFitFloor: 0, noPackage: 1, eligible: 0 },
      { dryRun: false, minFit: 70, appliedToday: 0 },
    )
    expect(detail.summary).toBe('0 eligible of 1 tailored — 1 missing package')
  })
})
