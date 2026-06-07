import type Anthropic from '@anthropic-ai/sdk'
import { sql, tx } from './db'
import { scoreRole } from './matcher'
import { persistScoredRole, type PersistableRole } from './persistRole'
import { tailorRole } from './tailor'
import type { TailorInput } from './tailorTypes'
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
    tailored: number
    errors: string[]
  }>
  totalScored: number
  totalTailored: number
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
  /** Auto-tailor roles that score ≥70 (route=tailor). Default: true. */
  autoTailor?: boolean
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

// ── Scheduling (pure, testable) ──────────────────────────────────────

export interface FetchedCompany {
  company: TargetCompany
  listings: AtsListing[]
}

export interface SourcingPlan {
  /**
   * Round-robin-ordered work list: one eligible listing per company per pass,
   * cycling until every company's queue is drained. This is the fairness fix —
   * a company with 40 openings (e.g. Anthropic) no longer drains the per-run
   * score budget before smaller companies are ever reached.
   */
  work: Array<{ company: TargetCompany; listing: AtsListing }>
  skippedDuplicate: number
  skippedIrrelevant: number
  /** Per-company listed/new/relevant counts, keyed by company name. */
  stats: Map<string, { listed: number; new: number; relevant: number }>
}

/**
 * Decide WHICH listings to score and in WHAT order — no I/O, no scoring.
 * Filters each company's listings (dedup → title gate → recency), then
 * interleaves the survivors round-robin so coverage is fair across companies.
 * The score cap is applied by the caller against real scores, not here, so
 * empty-JD listings never consume a company's slot.
 */
export function planSourcing(
  fetched: FetchedCompany[],
  knownUrls: Set<string>,
  opts: { maxAgeDays: number },
): SourcingPlan {
  const stats = new Map<string, { listed: number; new: number; relevant: number }>()
  const queues: Array<{ company: TargetCompany; listings: AtsListing[] }> = []
  let skippedDuplicate = 0
  let skippedIrrelevant = 0

  for (const { company, listings } of fetched) {
    const stat = { listed: listings.length, new: 0, relevant: 0 }
    const eligible: AtsListing[] = []
    for (const l of listings) {
      if (knownUrls.has(l.url)) {
        skippedDuplicate += 1
        continue
      }
      stat.new += 1
      if (!RELEVANT_TITLE_RE.test(l.title)) {
        skippedIrrelevant += 1
        continue
      }
      if (!isRecentEnough(l.publishedAt, opts.maxAgeDays)) {
        continue // old-but-relevant: dropped silently, matches prior behavior
      }
      stat.relevant += 1
      eligible.push(l)
    }
    stats.set(company.name, stat)
    queues.push({ company, listings: eligible })
  }

  // Interleave: take index 0 from every company, then index 1, and so on.
  const work: SourcingPlan['work'] = []
  const maxLen = queues.reduce((m, q) => Math.max(m, q.listings.length), 0)
  for (let i = 0; i < maxLen; i++) {
    for (const q of queues) {
      const listing = q.listings[i]
      if (listing) work.push({ company: q.company, listing })
    }
  }

  return { work, skippedDuplicate, skippedIrrelevant, stats }
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
  const autoTailor = opts.autoTailor ?? true
  const t0 = Date.now()

  const [companies, knownUrls] = await Promise.all([listTargetCompanies(), getKnownUrls()])
  let totalScored = 0
  let totalTailored = 0
  let totalErrors = 0
  let capHit = false

  // Per-company stat objects, keyed by name so the round-robin executor can
  // attribute each scored role back to its company.
  const statByName = new Map<string, SourcingReport['perCompany'][number]>()
  for (const company of companies) {
    statByName.set(company.name, {
      company: company.name, ats: company.ats, listed: 0, new: 0, relevant: 0,
      scored: 0, tailored: 0, errors: [],
    })
  }

  // Fetch every company's listings up front (sequential to stay gentle on ATS
  // rate limits), capturing per-company fetch failures.
  const fetched: FetchedCompany[] = []
  for (const company of companies) {
    try {
      const listings = await fetchListings(company)
      fetched.push({ company, listings })
    } catch (err) {
      statByName.get(company.name)!.errors.push(
        `fetch failed: ${err instanceof Error ? err.message : String(err)}`,
      )
      totalErrors += 1
    }
  }

  // Plan the round-robin order, then fold the planning counts into the stats.
  const plan = planSourcing(fetched, knownUrls, { maxAgeDays })
  for (const [name, s] of plan.stats) {
    const stat = statByName.get(name)
    if (stat) {
      stat.listed = s.listed
      stat.new = s.new
      stat.relevant = s.relevant
    }
  }

  // Execute the work list. The cap is on real scores, so empty-JD listings
  // don't consume budget — exactly as before, just over a fair ordering.
  for (const { company, listing: l } of plan.work) {
    if (totalScored >= maxScores) {
      capHit = true
      break
    }
    // safe: plan.work is built from fetched which is a subset of companies, all pre-seeded above
    const stat = statByName.get(company.name)!
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
      const persisted = await persistScoredRole(role, result)
      stat.scored += 1
      totalScored += 1
      knownUrls.add(l.url)

      // Auto-tailor roles that score well enough (route=tailor).
      // This means the daily cron produces FINISHED packages, not just scores.
      if (autoTailor && result.route === 'tailor') {
        try {
          const input: TailorInput = {
            role: {
              company: role.company,
              title: role.title,
              location: role.location ?? null,
              url: role.url ?? null,
              jdText: role.jobDescription,
              fitScore: result.score,
              fitReasons: result.reasons,
              segment: result.segment,
              aiNative: result.aiNative,
            },
          }
          const pkg = await tailorRole(client, input)
          const payload = JSON.stringify(pkg)
          await tx((txn) => [
            txn`insert into application_packages (role_id, cover_letter, outreach_draft, package_json, status)
                values (${persisted.id}, ${pkg.coverLetter}, ${pkg.outreachDraft}, ${payload}::jsonb, 'draft')`,
            txn`update roles set status = 'tailored', updated_at = now() where id = ${persisted.id}`,
            txn`insert into events (role_id, kind, detail)
                values (${persisted.id}, 'tailored', ${payload}::jsonb)`,
          ])
          stat.tailored += 1
          totalTailored += 1
        } catch (tailorErr) {
          // Tailoring failure is non-fatal — the scored role still exists.
          stat.errors.push(`${l.title}: tailor failed: ${tailorErr instanceof Error ? tailorErr.message : String(tailorErr)}`)
        }
      }
    } catch (err) {
      stat.errors.push(`${l.title}: ${err instanceof Error ? err.message : String(err)}`)
      totalErrors += 1
    }
  }

  const perCompany = [...statByName.values()]
  const totalSkippedDuplicate = plan.skippedDuplicate
  const totalSkippedIrrelevant = plan.skippedIrrelevant

  return {
    perCompany,
    totalScored,
    totalTailored,
    totalSkippedDuplicate,
    totalSkippedIrrelevant,
    totalErrors,
    capHit,
    durationMs: Date.now() - t0,
  }
}
