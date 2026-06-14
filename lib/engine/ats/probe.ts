import type { TargetCompany } from './types'

/**
 * Probe known ATS hosts for a slug. Used to auto-heal a target company whose
 * board 404s: the dominant failure mode is a company that MIGRATED ATS while
 * keeping the same slug (migration 0012 fixed 14 such cases by hand —
 * greenhouse→ashby, etc.). Rather than let that recur silently, sourcing probes
 * the other hosts on a fetch failure and repoints automatically.
 */
type ProbeAts = Extract<TargetCompany['ats'], 'greenhouse' | 'ashby'>

const PROBES: Array<{ ats: ProbeAts; url: (slug: string) => string }> = [
  { ats: 'greenhouse', url: (s) => `https://boards-api.greenhouse.io/v1/boards/${s}/jobs` },
  { ats: 'ashby', url: (s) => `https://api.ashbyhq.com/posting-api/job-board/${s}` },
]

/**
 * Returns the ATS host (excluding `exclude`) that currently serves this slug,
 * or null if none do. Network/parse errors count as "not found" — a probe must
 * never throw into the sourcing loop.
 */
export async function probeAtsForSlug(slug: string, exclude?: string): Promise<ProbeAts | null> {
  for (const p of PROBES) {
    if (p.ats === exclude) continue
    try {
      const res = await fetch(p.url(slug), { headers: { Accept: 'application/json' } })
      if (res.ok) return p.ats
    } catch {
      // network error — treat as not found, try the next host
    }
  }
  return null
}
