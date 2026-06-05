import type Anthropic from '@anthropic-ai/sdk'
import { sql } from './db'
import { scoreRole } from './matcher'
import { persistScoredRole, type PersistableRole } from './persistRole'
import { tailorRole } from './tailor'
import type { TailorInput } from './tailorTypes'

/**
 * Web Research Sourcing Agent
 *
 * Discovers roles from the open web that aren't on the 34 ATS boards.
 * Uses Tavily search → extract → dedupe → score → auto-tailor.
 *
 * This module does NOT import Tavily directly — it receives search results
 * and extracted text as arguments, so the Vercel route handler (which has
 * access to the Tavily MCP or fetch calls) orchestrates the I/O.
 */

// ── Search query generation ─────────────────────────────────────────

const QUERY_POOL = [
  '"founding account executive" AI startup remote 2026',
  '"mid-market account executive" "AI platform" OR "machine learning" hiring 2026',
  '"account executive" "Series A" OR "Series B" AI remote 2026',
  '"strategic account executive" "AI" OR "LLM" OR "generative" remote',
  '"sales" "founding AE" AI SaaS startup hiring',
  '"account executive" AI "legal tech" OR "insurance" OR "fintech" remote',
  '"GTM" "account executive" AI-native startup remote 2026',
  '"mid-market AE" AI data automation remote hiring',
  '"account executive" "voice AI" OR "conversation intelligence" remote',
  '"founding sales" AI B2B SaaS startup 2026',
]

/** Pick N non-repeating queries. Rotates by day-of-month so daily crons vary. */
export function queriesForToday(n = 3): string[] {
  const dayOfMonth = new Date().getDate() // 1-31
  const result: string[] = []
  for (let i = 0; i < n; i++) {
    result.push(QUERY_POOL[(dayOfMonth + i) % QUERY_POOL.length])
  }
  return result
}

// ── Dedup ────────────────────────────────────────────────────────────

async function getKnownUrls(): Promise<Set<string>> {
  const rows = await sql`select url from roles where url is not null`
  const set = new Set<string>()
  for (const r of rows as Array<{ url: string }>) {
    if (r.url) set.add(r.url)
  }
  return set
}

// ── Title gate (same as ATS sourcing) ────────────────────────────────

const RELEVANT_TITLE_RE =
  /\b(account executive|\bAE\b|account manager|\bAM\b|mid[-\s]?market|strategic|enterprise|sales|GTM|go[-\s]?to[-\s]?market|founding sales|business development|\bBDR\b|\bSDR\b|revenue)\b/i

// ── Types ────────────────────────────────────────────────────────────

export interface WebSearchResult {
  title: string
  url: string
  snippet: string
}

export interface ExtractedPage {
  url: string
  text: string
}

export interface WebResearchReport {
  queriesRun: number
  resultsFound: number
  relevant: number
  newUrls: number
  scored: number
  tailored: number
  errors: string[]
  durationMs: number
}

// ── Orchestrator ─────────────────────────────────────────────────────

interface WebResearchOptions {
  maxScores?: number
  autoTailor?: boolean
}

const DEFAULTS = { maxScores: 5, autoTailor: true }

/**
 * Process web search results: dedupe, title-gate, score, auto-tailor.
 * Called by the route handler which does the actual Tavily I/O.
 */
export async function processWebResults(
  client: Anthropic,
  searchResults: WebSearchResult[],
  extractedPages: Map<string, string>,
  opts: WebResearchOptions = {},
): Promise<WebResearchReport> {
  const maxScores = opts.maxScores ?? DEFAULTS.maxScores
  const autoTailor = opts.autoTailor ?? DEFAULTS.autoTailor
  const t0 = Date.now()

  const knownUrls = await getKnownUrls()
  const errors: string[] = []
  let relevant = 0
  let newUrls = 0
  let scored = 0
  let tailored = 0

  for (const result of searchResults) {
    if (scored >= maxScores) break

    // Dedupe
    if (knownUrls.has(result.url)) continue
    newUrls++

    // Title gate
    if (!RELEVANT_TITLE_RE.test(result.title)) continue
    relevant++

    // Get extracted JD text
    const jdText = extractedPages.get(result.url)
    if (!jdText || jdText.length < 50) {
      errors.push(`${result.title}: no usable JD text extracted`)
      continue
    }

    // Infer company name from the title or URL
    const company = inferCompany(result.title, result.url)

    try {
      const role: PersistableRole = {
        company,
        title: cleanTitle(result.title),
        jobDescription: jdText.slice(0, 15000), // cap to prevent huge prompts
        url: result.url,
        location: null, // web results don't always have this
        source: 'research',
      }

      const matchResult = await scoreRole(client, {
        company: role.company,
        title: role.title,
        jobDescription: role.jobDescription,
        url: role.url ?? undefined,
      })

      const persisted = await persistScoredRole(role, matchResult)
      scored++
      knownUrls.add(result.url)

      // Auto-tailor high-fit roles
      if (autoTailor && matchResult.route === 'tailor') {
        try {
          const input: TailorInput = {
            role: {
              company: role.company,
              title: role.title,
              location: null,
              url: role.url ?? null,
              jdText: role.jobDescription,
              fitScore: matchResult.score,
              fitReasons: matchResult.reasons,
              segment: matchResult.segment,
              aiNative: matchResult.aiNative,
            },
          }
          const pkg = await tailorRole(client, input)
          const payload = JSON.stringify(pkg)
          await sql`
            insert into application_packages (role_id, cover_letter, outreach_draft, package_json, status)
            values (${persisted.id}, ${pkg.coverLetter}, ${pkg.outreachDraft}, ${payload}::jsonb, 'draft')
          `
          await sql`update roles set status = 'tailored', updated_at = now() where id = ${persisted.id}`
          await sql`
            insert into events (role_id, kind, detail)
            values (${persisted.id}, 'tailored', ${payload}::jsonb)
          `
          tailored++
        } catch (tailorErr) {
          errors.push(`${company}: tailor failed: ${tailorErr instanceof Error ? tailorErr.message : String(tailorErr)}`)
        }
      }
    } catch (err) {
      errors.push(`${result.title}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return {
    queriesRun: 0, // set by the caller who knows how many queries were run
    resultsFound: searchResults.length,
    relevant,
    newUrls,
    scored,
    tailored,
    errors,
    durationMs: Date.now() - t0,
  }
}

// ── Helpers ──────────────────────────────────────────────────────────

/** Aggregator/job-board domains and suffixes to strip from company inference. */
const AGGREGATORS = new Set([
  'teal', 'tealhq', 'jobgether', 'working nomads', 'workingnomads', 'wellfound',
  'linkedin', 'indeed', 'glassdoor', 'ziprecruiter', 'workable', 'jobs by workable',
  'lever', 'greenhouse', 'ashbyhq', 'jobleads', 'remote.co', 'remotive', 'builtin',
  'ycombinator', 'angel.co', 'simplyhired', 'monster', 'hired', 'triplebyte',
])

/** Words that signal a metadata fragment, not a company name. */
const JUNK_PREFIXES = /^(permanent contract|remote|full[- ]time|part[- ]time|contract|hybrid|onsite|in|at|usa|us|uk|eu)\b/i

function isAggregator(name: string): boolean {
  return AGGREGATORS.has(name.toLowerCase().trim())
}

/** Best-effort company extraction from a search result title + URL. */
function inferCompany(title: string, url: string): string {
  // 1. Try "at <Company>" pattern (most reliable for job titles)
  const atMatch = title.match(/\bat\s+([A-Z][A-Za-z0-9.&\-' ]+?)(?:\s*[\|–—\-]|$)/i)
  if (atMatch && !isAggregator(atMatch[1]) && !JUNK_PREFIXES.test(atMatch[1])) {
    return atMatch[1].trim()
  }

  // 2. Try splitting on | — – - and taking segments that look like company names
  const segments = title.split(/\s*[\|–—]\s*|\s+-\s+/).map((s) => s.trim()).filter(Boolean)
  for (const seg of segments) {
    // Skip segments that are clearly job titles or aggregator names
    if (/account executive|founding|AE|GTM|sales|mid.market|strategic|hiring|remote/i.test(seg)) continue
    if (isAggregator(seg)) continue
    if (JUNK_PREFIXES.test(seg)) continue
    if (seg.length >= 2 && seg.length <= 40) return seg
  }

  // 3. Try "@ <Company>" pattern
  const atSignMatch = title.match(/@\s*([A-Za-z][A-Za-z0-9.& ]+)/i)
  if (atSignMatch && !isAggregator(atSignMatch[1])) return atSignMatch[1].trim()

  // 4. Fall back to domain name (strip known aggregator domains)
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '')
    const domain = hostname.split('.')[0]
    if (!isAggregator(domain) && domain.length >= 2) {
      return domain.charAt(0).toUpperCase() + domain.slice(1)
    }
  } catch { /* ignore */ }

  return 'Unknown Company'
}

/** Strip aggregator suffixes and metadata from titles. */
function cleanTitle(title: string): string {
  // Remove trailing " | Aggregator" / " - Aggregator" / " @ Company"
  let cleaned = title
  for (const agg of AGGREGATORS) {
    const re = new RegExp(`\\s*[\\|–—\\-]\\s*${agg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'i')
    cleaned = cleaned.replace(re, '')
  }
  // Remove "Jobs By Workable" / "Permanent contract in X" type suffixes
  cleaned = cleaned.replace(/\s*[\|–—\-]\s*(Jobs By \w+|Permanent contract .+|Remote .+|Full[- ]Time .+)$/i, '')
  return cleaned.trim()
}
