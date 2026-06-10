import { describe, it, expect } from 'vitest'
import { classifyAtsUrl, isDeadGreenhouseListing } from '../detect.js'

describe('classifyAtsUrl — ATS type from requested + final URL', () => {
  it('classifies greenhouse from the final URL', () => {
    expect(classifyAtsUrl('https://example.com/x', 'https://boards.greenhouse.io/acme/jobs/1')).toBe('greenhouse')
    expect(classifyAtsUrl('https://example.com/x', 'https://job-boards.greenhouse.io/acme/jobs/1')).toBe('greenhouse')
  })

  it('classifies ashby from the final URL', () => {
    expect(classifyAtsUrl('https://example.com/x', 'https://jobs.ashbyhq.com/acme/123')).toBe('ashby')
  })

  it('falls back to the REQUESTED url when a redirect lands elsewhere', () => {
    // Greenhouse boards links often redirect to the company careers site —
    // the attempt is still a Greenhouse attempt and must not be "unknown".
    expect(classifyAtsUrl('https://boards.greenhouse.io/acme/jobs/1', 'https://acme.com/careers/1')).toBe('greenhouse')
    expect(classifyAtsUrl('https://jobs.ashbyhq.com/acme/123', 'https://acme.com/careers')).toBe('ashby')
  })

  it('returns null when neither URL is a known ATS', () => {
    expect(classifyAtsUrl('https://example.com/job', 'https://example.com/job')).toBe(null)
  })
})

describe('isDeadGreenhouseListing — closed/removed job detection', () => {
  it('detects the Greenhouse error=true redirect (job no longer exists)', () => {
    // boards.greenhouse.io/acme/jobs/123 → job-boards.greenhouse.io/acme?error=true
    expect(isDeadGreenhouseListing('https://job-boards.greenhouse.io/customerio?error=true')).toBe(true)
    expect(isDeadGreenhouseListing('https://boards.greenhouse.io/acme?error=true&x=1')).toBe(true)
  })

  it('a live listing is not dead', () => {
    expect(isDeadGreenhouseListing('https://job-boards.greenhouse.io/customerio/jobs/7971675')).toBe(false)
  })

  it('error=true on a non-greenhouse host is not a greenhouse dead listing', () => {
    expect(isDeadGreenhouseListing('https://example.com/jobs?error=true')).toBe(false)
  })

  it('tolerates malformed URLs', () => {
    expect(isDeadGreenhouseListing('not a url')).toBe(false)
  })
})
