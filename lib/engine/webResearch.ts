import type Anthropic from '@anthropic-ai/sdk'
import { sql, tx } from './db'
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

// Broad query pool spanning Matthew's whole lane — not just AI startups.
// AI-native is the strong preference, but he also fits data infra, fintech,
// vertical SaaS, and his proven supply-chain/logistics vertical. Role and geo
// variants widen the net further. queriesForToday() rotates through these so
// the open web gets searched from many angles over a few days.
const QUERY_POOL = [
  // ── AI-native (strong preference) ──
  '"account executive" AI-native B2B SaaS startup remote hiring',
  '"mid-market account executive" "AI platform" OR "LLM" remote 2026',
  '"strategic account executive" generative AI startup remote',
  '"founding account executive" AI startup remote',
  '"account executive" "Series A" OR "Series B" AI remote hiring',
  '"account executive" "applied AI" OR "AI agents" remote hiring 2026',
  // ── Data / analytics infrastructure ──
  '"account executive" "data platform" OR "data infrastructure" remote hiring',
  '"mid-market account executive" analytics SaaS remote 2026',
  '"account executive" "data warehouse" OR "observability" SaaS remote',
  // ── Fintech ──
  '"account executive" fintech SaaS remote hiring 2026',
  '"mid-market account executive" "financial software" OR fintech remote',
  '"account executive" "payments" OR "accounting software" SaaS remote',
  // ── Vertical SaaS ──
  '"account executive" vertical SaaS B2B remote hiring 2026',
  '"account executive" "legal tech" OR "healthtech" OR "insurtech" SaaS remote',
  '"account executive" "construction software" OR "field service" SaaS remote',
  // ── Supply chain / logistics (proven vertical) ──
  '"account executive" "supply chain" software SaaS remote hiring',
  '"account executive" "logistics" OR "procurement" SaaS remote 2026',
  '"mid-market account executive" "manufacturing" OR "ERP" software remote',
  // ── Role / seniority variants ──
  '"senior account executive" B2B SaaS AI remote hiring 2026',
  '"named account executive" SaaS remote hiring',
  '"account executive" "net new" OR "new business" SaaS remote 2026',
  '"strategic account executive" mid-market SaaS remote',
  // ── Geographies (his locations) ──
  '"account executive" B2B SaaS "Minnesota" OR "Minneapolis" OR remote hiring',
  '"account executive" AI SaaS "Chicago" OR remote hiring',
  '"account executive" SaaS "North Carolina" OR "South Carolina" OR remote',
  '"account executive" B2B SaaS "Florida" OR remote hiring 2026',
  // ── Stage / GTM ──
  '"founding sales" OR "first sales hire" AI B2B startup remote',
  '"GTM" "account executive" AI-native startup remote 2026',
  '"account executive" "Series B" OR "Series C" SaaS remote hiring',
  // ── AI adjacency ──
  '"account executive" "voice AI" OR "conversation intelligence" remote',
  '"account executive" "developer tools" OR "API platform" SaaS remote',
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
  /** New companies auto-added to the deep-crawl target list (learning loop). */
  companiesAdded: number
  addedCompanies: string[]
  errors: string[]
  durationMs: number
}

// ── Orchestrator ─────────────────────────────────────────────────────

interface WebResearchOptions {
  maxScores?: number
  autoTailor?: boolean
  /** Max companies to auto-add to the target list per run (learning-loop cap). */
  maxCompanyAdds?: number
}

const DEFAULTS = { maxScores: 5, autoTailor: true, maxCompanyAdds: 3 }

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
  const maxCompanyAdds = opts.maxCompanyAdds ?? DEFAULTS.maxCompanyAdds
  const t0 = Date.now()

  const knownUrls = await getKnownUrls()
  const errors: string[] = []
  const addedCompanies: string[] = []
  let relevant = 0
  let newUrls = 0
  let scored = 0
  let tailored = 0

  for (const result of searchResults) {
    if (scored >= maxScores) break

    // Aggregator gate: job boards (Mediabistro, The Muse, LinkedIn…) return
    // truncated, mis-attributed listings — skip before spending a Claude call.
    // Note: greenhouse/lever/ashby are NOT aggregators here — they host real
    // direct-apply pages, so they're deliberately excluded from this list.
    if (isAggregatorHost(result.url)) continue

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

      // Learning loop: a strong-fit role (route=tailor, i.e. ≥70 and not
      // enterprise-capped) at a Greenhouse/Ashby company we don't already track
      // → add that company to the deep-crawl list so the ATS engine covers it
      // from now on. This is how the open-web discovery grows the target roster.
      if (matchResult.route === 'tailor' && addedCompanies.length < maxCompanyAdds) {
        try {
          const added = await addDiscoveredCompany(role.company, result.url)
          if (added) addedCompanies.push(added)
        } catch (addErr) {
          errors.push(`${company}: company auto-add failed: ${addErr instanceof Error ? addErr.message : String(addErr)}`)
        }
      }

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
          await tx((txn) => [
            txn`insert into application_packages (role_id, cover_letter, outreach_draft, package_json, status)
                values (${persisted.id}, ${pkg.coverLetter}, ${pkg.outreachDraft}, ${payload}::jsonb, 'draft')`,
            txn`update roles set status = 'tailored', updated_at = now() where id = ${persisted.id}`,
            txn`insert into events (role_id, kind, detail)
                values (${persisted.id}, 'tailored', ${payload}::jsonb)`,
          ])
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
    companiesAdded: addedCompanies.length,
    addedCompanies,
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

/**
 * Host substrings for job boards/aggregators whose pages should never be
 * scored — they list other companies' jobs with truncated, mis-attributed
 * titles. Deliberately excludes greenhouse/lever/ashby: those host real
 * company application pages, which ARE worth scoring.
 */
const AGGREGATOR_HOSTS = [
  'linkedin', 'indeed', 'glassdoor', 'ziprecruiter', 'simplyhired', 'monster',
  'mediabistro', 'themuse', 'builtin', 'wellfound', 'angel.co', 'ycombinator',
  'remotive', 'remote.co', 'jobgether', 'workingnomads', 'teal', 'tealhq',
  'jobleads', 'hired.com', 'triplebyte', 'dice.com', 'lensa', 'jobright',
  'jooble', 'jobspresso',
]

/** True if the URL's host belongs to a known job-board aggregator. */
export function isAggregatorHost(url: string): boolean {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '').toLowerCase()
    return AGGREGATOR_HOSTS.some((a) => host.includes(a))
  } catch {
    return false
  }
}

/** Greenhouse/Ashby slugs are lowercase, alphanumeric, hyphen-separated. */
function isValidSlug(s: string): boolean {
  return /^[a-z0-9][a-z0-9-]{1,40}$/.test(s)
}

/**
 * Detect a Greenhouse/Ashby board slug from a job URL so the learning loop can
 * register the company for deep ATS crawling. Returns null for anything we
 * can't confidently attribute (custom domains, aggregators, career pages).
 * Pure + exported for testing.
 */
export function detectAtsFromUrl(
  url: string,
): { ats: 'greenhouse' | 'ashby'; slug: string } | null {
  try {
    const u = new URL(url)
    const host = u.hostname.replace(/^www\./, '').toLowerCase()
    const parts = u.pathname.split('/').filter(Boolean)

    if (host.endsWith('greenhouse.io')) {
      // {slug}.greenhouse.io  (rare embed form)
      const sub = host.slice(0, host.length - '.greenhouse.io'.length)
      if (sub && !['boards', 'job-boards', 'api', 'boards-api'].includes(sub) && isValidSlug(sub)) {
        return { ats: 'greenhouse', slug: sub }
      }
      // boards.greenhouse.io/{slug}/...  or  job-boards.greenhouse.io/{slug}/...
      if (parts[0] && isValidSlug(parts[0])) return { ats: 'greenhouse', slug: parts[0] }
      return null
    }

    if (host.endsWith('ashbyhq.com')) {
      // jobs.ashbyhq.com/{slug}/...
      if (parts[0] && isValidSlug(parts[0])) return { ats: 'ashby', slug: parts[0] }
      return null
    }

    return null
  } catch {
    return null
  }
}

/**
 * Learning loop: register a discovered company for deep ATS crawling.
 * Inserts into target_companies, deduped by (ats, slug) so existing targets and
 * prior auto-adds are no-ops. Returns the company name if a NEW row was added,
 * else null. Only call for strong-fit roles (route=tailor).
 */
async function addDiscoveredCompany(companyName: string, url: string): Promise<string | null> {
  const detected = detectAtsFromUrl(url)
  if (!detected) return null
  // Fall back to a capitalized slug when inference produced a junk/unknown name.
  const name =
    companyName && companyName !== 'Unknown Company'
      ? companyName
      : detected.slug.charAt(0).toUpperCase() + detected.slug.slice(1)
  const rows = await sql`
    insert into target_companies (name, ats, slug, active, notes)
    values (${name}, ${detected.ats}, ${detected.slug}, true, 'auto-added by web research')
    on conflict (ats, slug) do nothing
    returning id
  `
  return rows.length > 0 ? name : null
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
