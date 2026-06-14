import { describe, it, expect, vi, afterEach } from 'vitest'
import { probeAtsForSlug } from '../probe'

const realFetch = global.fetch
afterEach(() => { global.fetch = realFetch })

/** Stub fetch: ok=true only for hosts whose URL contains a substring in `okHosts`. */
function stubFetch(okHosts: string[]) {
  global.fetch = vi.fn(async (url: string | URL | Request) => {
    const u = String(url)
    const ok = okHosts.some((h) => u.includes(h))
    return { ok, status: ok ? 200 : 404 } as Response
  }) as unknown as typeof fetch
}

describe('probeAtsForSlug — find the host that serves a slug', () => {
  it('returns ashby when the slug moved there (greenhouse 404s)', async () => {
    stubFetch(['ashbyhq.com'])
    expect(await probeAtsForSlug('openai', 'greenhouse')).toBe('ashby')
  })

  it('returns greenhouse when that host serves it', async () => {
    stubFetch(['greenhouse.io'])
    expect(await probeAtsForSlug('brex', 'ashby')).toBe('greenhouse')
  })

  it('skips the excluded (currently-failing) host', async () => {
    // greenhouse would say ok, but we exclude it → should look at ashby (404) → null
    stubFetch(['greenhouse.io'])
    expect(await probeAtsForSlug('foo', 'greenhouse')).toBeNull()
  })

  it('returns null when no host serves the slug', async () => {
    stubFetch([])
    expect(await probeAtsForSlug('gone', 'greenhouse')).toBeNull()
  })

  it('treats a network error as not-found (never throws into sourcing)', async () => {
    global.fetch = vi.fn(async () => { throw new Error('network down') }) as unknown as typeof fetch
    await expect(probeAtsForSlug('x')).resolves.toBeNull()
  })
})
