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
  const perCompany: SourcingReport['perCompany'] = []
  let totalScored = 0
  let totalTailored = 0
  let totalSkippedDuplicate = 0
  let totalSkippedIrrelevant = 0
  let totalErrors = 0
  let capHit = false

  for (const company of companies) {
    const stat = { company: company.name, ats: company.ats, listed: 0, new: 0, relevant: 0, scored: 0, tailored: 0, errors: [] as string[] }
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
    totalTailored,
    totalSkippedDuplicate,
    totalSkippedIrrelevant,
    totalErrors,
    capHit,
    durationMs: Date.now() - t0,
  }
}
