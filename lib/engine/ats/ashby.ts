import type { AtsListing } from './types'

interface AshbyJob {
  id: string
  title: string
  jobUrl: string
  location?: string
  descriptionPlain?: string
  publishedAt?: string
}

const BASE = 'https://api.ashbyhq.com/posting-api/job-board'

/**
 * Ashby returns the full posting (including plain-text JD) in the list endpoint —
 * no per-job fetch needed.
 */
export async function listJobs(slug: string): Promise<AtsListing[]> {
  const res = await fetch(`${BASE}/${slug}`, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`ashby list ${slug}: ${res.status}`)
  const body = (await res.json()) as { jobs?: AshbyJob[] }
  const jobs = body.jobs ?? []
  return jobs.map((j) => ({
    externalId: j.id,
    title: (j.title ?? '').trim(),
    url: j.jobUrl,
    location: j.location ?? null,
    jdText: (j.descriptionPlain ?? '').trim(),
    publishedAt: j.publishedAt ?? null,
  }))
}

/** Ashby already includes JD text in the list; this is a no-op fallback. */
export async function fetchJdText(_slug: string, _externalId: string): Promise<string> {
  return ''
}
