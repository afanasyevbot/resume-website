import { describe, it, expect } from 'vitest'
import { classifyUrlHealth } from '../urlHealth'

describe('classifyUrlHealth — is an apply URL worth persisting?', () => {
  it('404/410 mean the listing is gone', () => {
    expect(classifyUrlHealth(404, 'https://boards.greenhouse.io/x/jobs/1').ok).toBe(false)
    expect(classifyUrlHealth(410, 'https://jobs.ashbyhq.com/x/1').ok).toBe(false)
  })

  it('a greenhouse ?error=true redirect is a dead listing even with HTTP 200', () => {
    const r = classifyUrlHealth(200, 'https://job-boards.greenhouse.io/acme?error=true')
    expect(r.ok).toBe(false)
    expect(r.reason).toMatch(/error=true|not found|dead/i)
  })

  it('a normal 200 is healthy', () => {
    expect(classifyUrlHealth(200, 'https://job-boards.greenhouse.io/acme/jobs/123').ok).toBe(true)
  })

  it('gives the benefit of the doubt to bot-blocking statuses (403/405/5xx)', () => {
    // Many ATS block HEAD/bot requests; a block is NOT proof the job is gone.
    expect(classifyUrlHealth(403, 'https://example.com/job').ok).toBe(true)
    expect(classifyUrlHealth(405, 'https://example.com/job').ok).toBe(true)
    expect(classifyUrlHealth(503, 'https://example.com/job').ok).toBe(true)
  })
})
