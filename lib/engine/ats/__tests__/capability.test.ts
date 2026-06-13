import { describe, it, expect } from 'vitest'
import { atsTypeFromUrl, canAutoSubmit, SUBMITTABLE_ATS } from '../capability'

describe('atsTypeFromUrl — normalize a job URL to its ATS platform', () => {
  it('maps the real ATS hosts the engine sources from', () => {
    expect(atsTypeFromUrl('https://boards.greenhouse.io/customerio/jobs/123')).toBe('greenhouse')
    expect(atsTypeFromUrl('https://job-boards.greenhouse.io/anthropic/jobs/456')).toBe('greenhouse')
    expect(atsTypeFromUrl('https://jobs.ashbyhq.com/openai/abc-def')).toBe('ashby')
    expect(atsTypeFromUrl('https://jobs.lever.co/mistral/xyz')).toBe('lever')
    expect(atsTypeFromUrl('https://acme.wd1.myworkdayjobs.com/careers/job/123')).toBe('workday')
    expect(atsTypeFromUrl('https://careers.smartrecruiters.com/Acme/123')).toBe('smartrecruiters')
  })

  it('ignores a leading www and is case-insensitive on host', () => {
    expect(atsTypeFromUrl('https://WWW.Greenhouse.io/foo/jobs/1')).toBe('greenhouse')
  })

  it('returns null for aggregators and unknown hosts', () => {
    expect(atsTypeFromUrl('https://www.linkedin.com/jobs/view/123')).toBeNull()
    expect(atsTypeFromUrl('https://remoteleaf.com/company/x/role')).toBeNull()
    expect(atsTypeFromUrl('https://example.com/careers')).toBeNull()
  })

  it('returns null for null/empty/garbage input without throwing', () => {
    expect(atsTypeFromUrl(null)).toBeNull()
    expect(atsTypeFromUrl(undefined)).toBeNull()
    expect(atsTypeFromUrl('')).toBeNull()
    expect(atsTypeFromUrl('not a url')).toBeNull()
  })

  it('does not match a host that merely contains an ATS name as a substring', () => {
    // "notgreenhouse.io" / "greenhouse.io.evil.com" must NOT be greenhouse.
    expect(atsTypeFromUrl('https://notgreenhouse.io/jobs/1')).toBeNull()
    expect(atsTypeFromUrl('https://greenhouse.io.evil.com/jobs/1')).toBeNull()
  })
})

describe('canAutoSubmit — the cron gate', () => {
  it('allows exactly the ATS types the browser service can submit', () => {
    expect(canAutoSubmit('greenhouse')).toBe(true)
    expect(canAutoSubmit('ashby')).toBe(true)
  })

  it('blocks ATS types with no submitter yet (so they route to manual review)', () => {
    expect(canAutoSubmit('lever')).toBe(false)
    expect(canAutoSubmit('workday')).toBe(false)
    expect(canAutoSubmit('smartrecruiters')).toBe(false)
  })

  it('blocks null/unknown', () => {
    expect(canAutoSubmit(null)).toBe(false)
    expect(canAutoSubmit(undefined)).toBe(false)
    expect(canAutoSubmit('unknown')).toBe(false)
  })

  it('every submittable type round-trips through canAutoSubmit', () => {
    for (const t of SUBMITTABLE_ATS) expect(canAutoSubmit(t)).toBe(true)
  })
})
