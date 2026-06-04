import type { AtsListing } from './types'
import { htmlToText } from './html'

interface GreenhouseListJob {
  id: number
  title: string
  absolute_url: string
  location: { name?: string } | null
  updated_at: string | null
}

interface GreenhouseSingleJob extends GreenhouseListJob {
  content: string
}

const BASE = 'https://boards-api.greenhouse.io/v1/boards'

/** List jobs for a company. Title + URL + location only. JD content not hydrated. */
export async function listJobs(slug: string): Promise<AtsListing[]> {
  const res = await fetch(`${BASE}/${slug}/jobs`, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`greenhouse list ${slug}: ${res.status}`)
  const body = (await res.json()) as { jobs?: GreenhouseListJob[] }
  const jobs = body.jobs ?? []
  return jobs.map((j) => ({
    externalId: String(j.id),
    title: (j.title ?? '').trim(),
    url: j.absolute_url,
    location: j.location?.name ?? null,
    jdText: '',
    publishedAt: j.updated_at,
  }))
}

/** Fetch one job's JD text. Greenhouse encodes its content as entity-escaped HTML. */
export async function fetchJdText(slug: string, externalId: string): Promise<string> {
  const res = await fetch(`${BASE}/${slug}/jobs/${externalId}?content=true`, {
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(`greenhouse single ${slug}/${externalId}: ${res.status}`)
  const body = (await res.json()) as Partial<GreenhouseSingleJob>
  return htmlToText(body.content ?? '')
}
