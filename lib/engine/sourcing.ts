import type Anthropic from '@anthropic-ai/sdk'
import { sql } from './db'
import { scoreRole } from './matcher'
import { persistScoredRole, type PersistableRole } from './persistRole'
import type { AtsListing, TargetCompany } from './ats/types'
import * as greenhouse from './ats/greenhouse'
import * as ashby from './ats/ashby'

/**
 * Title gate: cheap pre-filter so we never burn a Claude call on a role
 * that's obviously not a fit (e.g. engineers, marketers, designers).
 * Conservative — keep ANYTHING sales-flavored, let the matcher decide nuance.
 */
const RELEVANT_TITLE_RE =
  /\b(account executive|\bAE\b|account manager|\bAM\b|mid[-\s]?market|strategic|enterprise|sales|GTM|go[-\s]?to[-\s]?market|founding sales|business development|\bBDR\b|\bSDR\b|revenue|customer success|\bCS\b)\b/i

export interface SourcingReport {
  /** Per-company stats. */
  perCompany: Array<{
    company: string
    ats: string
    listed: number
    new: number
    relevant: number
    scored: number
    errors: string[]
  }>
  totalScored: number
  totalSkippedDuplicate: number
  totalSkippedIrrelevant: number
  totalErrors: number
  capHit: boolean
  durationMs: number
}

interface RunOptions {
  /** Hard cap on the number of scoring calls per run (cost control). */
  maxScores?: number
  /** Skip listings older than this many days. */
  maxAgeDays?: number
}

const DEFAULTS = { maxScores: 20, maxAgeDays: 30 }

export async function listTargetCompanies(): Promise<TargetCompany[]> {
  const rows = await sql`select name, ats, slug from target_companies where active = true order by name`
  return rows as TargetCompany[]
}

async function getKnownUrls(): Promise<Set<string>> {
  const rows = await sql`select url from roles where url is not null`
  const set = new Set<string>()
  for (const r of rows as Array<{ url: string }>) {
    if (r.url) set.add(r.url)
  }
  return set
}

function isRecentEnough(publishedAt: string | null, maxAgeDays: number): boolean {
  if (!publishedAt) return true // no date → don't filter
  const t = Date.parse(publishedAt)
  if (Number.isNaN(t)) return true
  return Date.now() - t < maxAgeDays * 24 * 60 * 60 * 1000
}

async function fetchListings(company: TargetCompany): Promise<AtsListing[]> {
  if (company.ats === 'greenhouse') return greenhouse.listJobs(company.slug)
  if (company.ats === 'ashby') return ashby.listJobs(company.slug)
  throw new Error(`Unsupported ATS: ${company.ats}`)
}

async function hydrateJd(company: TargetCompany, l: AtsListing): Promise<string> {
  if (l.jdText) return l.jdText
  if (company.ats === 'greenhouse') return greenhouse.fetchJdText(company.slug, l.externalId)
  return ''
}

/**
 * Source new openings from all active target companies, dedupe against existing
 * roles, gate by title relevance, score the survivors with Claude, persist results.
 */
export async function runSourcing(
  client: Anthropic,
  opts: RunOptions = {},
): Promise<SourcingReport> {
  const maxScores = opts.maxScores ?? DEFAULTS.maxScores
  const maxAgeDays = opts.maxAgeDays ?? DEFAULTS.maxAgeDays
  const t0 = Date.now()

  const [companies, knownUrls] = await Promise.all([listTargetCompanies(), getKnownUrls()])
  const perCompany: SourcingReport['perCompany'] = []
  let totalScored = 0
  let totalSkippedDuplicate = 0
  let totalSkippedIrrelevant = 0
  let totalErrors = 0
  let capHit = false

  for (const company of companies) {
    const stat = { company: company.name, ats: company.ats, listed: 0, new: 0, relevant: 0, scored: 0, errors: [] as string[] }
    try {
      const listings = await fetchListings(company)
      stat.listed = listings.length

      for (const l of listings) {
        if (totalScored >= maxScores) {
          capHit = true
          break
        }
        if (knownUrls.has(l.url)) {
          totalSkippedDuplicate += 1
          continue
        }
        stat.new += 1
        if (!RELEVANT_TITLE_RE.test(l.title)) {
          totalSkippedIrrelevant += 1
          continue
        }
        if (!isRecentEnough(l.publishedAt, maxAgeDays)) {
          continue
        }
        stat.relevant += 1

        try {
          const jd = await hydrateJd(company, l)
          if (!jd || jd.length < 30) {
            stat.errors.push(`${l.title}: empty JD`)
            totalErrors += 1
            continue
          }

          const role: PersistableRole = {
            company: company.name,
            title: l.title,
            jobDescription: jd,
            url: l.url,
            location: l.location,
            source: company.ats,
          }
          const result = await scoreRole(client, {
            company: role.company,
            title: role.title,
            jobDescription: role.jobDescription,
            url: role.url ?? undefined,
            location: role.location ?? undefined,
          })
          await persistScoredRole(role, result)
          stat.scored += 1
          totalScored += 1
          // Re-record the url so we don't double-score within a run if it appears twice.
          knownUrls.add(l.url)
        } catch (err) {
          stat.errors.push(`${l.title}: ${err instanceof Error ? err.message : String(err)}`)
          totalErrors += 1
        }
      }
    } catch (err) {
      stat.errors.push(`fetch failed: ${err instanceof Error ? err.message : String(err)}`)
      totalErrors += 1
    }
    perCompany.push(stat)
    if (capHit) break
  }

  return {
    perCompany,
    totalScored,
    totalSkippedDuplicate,
    totalSkippedIrrelevant,
    totalErrors,
    capHit,
    durationMs: Date.now() - t0,
  }
}
