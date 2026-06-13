import type Anthropic from '@anthropic-ai/sdk'
import { sql, tx } from './db'
import { scoreRole } from './matcher'
import { persistScoredRole, type PersistableRole } from './persistRole'
import { checkApplyUrl } from './urlHealth'
import { tailorRole } from './tailor'
import type { TailorInput } from './tailorTypes'
import { extractJsonObject } from './jsonExtract'
import { hasBudget, logUsage } from './costGuard'
import { TAILOR_FLOOR } from './thresholds'

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
  /** Number of dynamic "find-lookalikes" queries derived from your good fits. */
  lookalikeCount: number
  errors: string[]
  durationMs: number
}

// ── Orchestrator ─────────────────────────────────────────────────────

interface WebResearchOptions {
  maxScores?: number
  autoTailor?: boolean
  lookalikeCount?: number
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

    // Resolve aggregator URLs to the actual ATS application URL.
    // If the result came from an aggregator page (not a direct ATS host),
    // search the extracted HTML for an embedded ATS URL. If we can't find
    // one, skip — submitting an aggregator URL to the browser service will
    // always return unknown_ats and leave the role stuck in needs_review.
    let applyUrl = result.url
    if (!isDirectAtsHost(result.url)) {
      const resolved = extractDirectAtsUrl(jdText)
      if (!resolved) {
        errors.push(`${result.title}: aggregator URL with no embedded ATS link — skipping`)
        continue
      }
      applyUrl = resolved
      // Check dedup for the resolved URL too (same job may have been sourced directly)
      if (knownUrls.has(applyUrl)) continue
    }

    // Health-check the apply URL before spending a Claude call on scoring.
    // Aggregator-extracted IDs routinely go stale (Greenhouse reposts), and a
    // dead URL stalls the whole pipeline at apply time.
    const health = await checkApplyUrl(applyUrl)
    if (!health.ok) {
      errors.push(`${result.title}: apply URL dead — ${health.reason}`)
      continue
    }

    // Infer company name from the title or URL
    const company = inferCompany(result.title, applyUrl)

    try {
      const role: PersistableRole = {
        company,
        title: cleanTitle(result.title),
        jobDescription: jdText.slice(0, 15000), // cap to prevent huge prompts
        url: applyUrl,
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
      knownUrls.add(applyUrl)
      if (applyUrl !== result.url) knownUrls.add(result.url) // block the aggregator URL too

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
    lookalikeCount: opts.lookalikeCount ?? 0,
    errors,
    durationMs: Date.now() - t0,
  }
}

// ── Helpers ──────────────────────────────────────────────────────────

/**
 * Names/suffixes to strip when inferring company from a title or URL.
 * This is for title/name cleanup only — NOT for URL gating.
 * Deliberately excludes 'lever', 'greenhouse', 'ashbyhq': those host real
 * company application pages and we want to infer the company from the URL
 * domain (e.g. jobs.lever.co/writer → "Writer"), not strip the platform name.
 */
const AGGREGATORS = new Set([
  'teal', 'tealhq', 'jobgether', 'working nomads', 'workingnomads', 'wellfound',
  'linkedin', 'indeed', 'glassdoor', 'ziprecruiter', 'workable', 'jobs by workable',
  'jobleads', 'remote.co', 'remotive', 'builtin',
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
  // Pure noise — no embedded ATS links worth extracting
  'liveblog365.com', 'bebee.com', 'dailyremote.com', 'remoterocketship.com',
  'remoteleaf.com', 'jobgether.com', 'getwork.com', 'talent.com',
]

/** True if the URL's host belongs to a known job-board aggregator. */
export function isAggregatorHost(url: string): boolean {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '').toLowerCase()
    return AGGREGATOR_HOSTS.some((a) => {
      if (a.includes('.')) {
        // Entry includes TLD (e.g. 'angel.co', 'dice.com') — exact or subdomain match.
        return host === a || host.endsWith('.' + a)
      }
      // Bare name (e.g. 'linkedin', 'teal') — match as a domain label, not as an
      // arbitrary substring. 'teal' must not block 'stealth.ai' or similar.
      return host === a || host.startsWith(a + '.') || host.includes('.' + a + '.')
    })
  } catch {
    return false
  }
}

/**
 * Domains that host real, direct-apply job pages. URLs on these domains can
 * be sent straight to the browser service without any resolution step.
 */
const DIRECT_ATS_HOSTS = [
  'greenhouse.io', 'lever.co', 'ashbyhq.com', 'workday.com',
  'smartrecruiters.com', 'icims.com', 'jobvite.com', 'taleo.net',
  'myworkdayjobs.com', 'successfactors.com', 'breezy.hr', 'applytojob.com',
]

/** True if the URL is already a direct company ATS page (no resolution needed). */
export function isDirectAtsHost(url: string): boolean {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '').toLowerCase()
    return DIRECT_ATS_HOSTS.some((d) => host === d || host.endsWith('.' + d))
  } catch {
    return false
  }
}

/**
 * Scans raw HTML/text content for the first direct ATS application URL.
 * Used when a result URL is an aggregator page — we look for the embedded
 * "Apply" link pointing to greenhouse, lever, ashby, etc.
 *
 * Returns the first clean match, or null if none found.
 */
export function extractDirectAtsUrl(content: string): string | null {
  // Build one pattern per ATS domain. We match URLs that have a path after
  // the domain (i.e. actual job pages, not just the company homepage).
  const patterns: RegExp[] = [
    /https?:\/\/(?:boards\.|jobs\.|app\.)?greenhouse\.io\/[a-zA-Z0-9_-]+\/jobs\/[^\s"'<>)]+/g,
    /https?:\/\/jobs\.lever\.co\/[a-zA-Z0-9_-]+\/[^\s"'<>)]+/g,
    /https?:\/\/[a-zA-Z0-9_-]+\.ashbyhq\.com\/[^\s"'<>)]+/g,
    /https?:\/\/[a-zA-Z0-9_-]+\.wd\d+\.myworkdayjobs\.com\/[^\s"'<>)]+/g,
    /https?:\/\/[a-zA-Z0-9_-]+\.smartrecruiters\.com\/[^\s"'<>)]+/g,
  ]
  for (const pattern of patterns) {
    const match = pattern.exec(content)
    if (match) {
      // Strip trailing HTML artifacts
      return match[0].replace(/['")\]>.,;\\]+$/, '')
    }
  }
  return null
}

// ── Find-lookalikes learning loop ────────────────────────────────────
//
// Instead of re-crawling companies you've already engaged, learn the PROFILE
// of companies that fit you well (high score / 👍 / applied) and search for
// NEW companies like them. Expands the funnel toward your actual taste.

export interface FitSignal {
  company: string
  title: string
  segment: string | null
  aiNative: boolean | null
  fitReasons: string[] | null
}

/**
 * Pull the companies that have proven to be good fits: roles that scored
 * strongly, that you applied to, or that you thumbs-up'd. One row per company
 * (best signal wins), capped — this is the raw material for the profile.
 */
export async function gatherFitSignals(limit = 12): Promise<FitSignal[]> {
  const rows = await sql`
    select distinct on (r.company)
      r.company, r.title, r.segment, r.ai_native as "aiNative", r.fit_reasons as "fitReasons"
    from roles r
    left join lateral (
      select (detail->>'rating')::int as rating
      from events where role_id = r.id and kind = 'rated'
      order by created_at desc limit 1
    ) fb on true
    where r.fit_score >= ${TAILOR_FLOOR} or r.status = 'applied' or fb.rating = 1
    order by r.company, (fb.rating = 1) desc nulls last, r.fit_score desc nulls last
    limit ${limit}
  `
  return rows as FitSignal[]
}

const LOOKALIKE_SYSTEM_PROMPT = `You help expand a job search for a mid-market / strategic Account Executive who also builds AI systems. Given companies that already fit the candidate well, infer their shared profile — product category, company stage, buyer type, company size — and propose NEW web-search queries that would surface DIFFERENT companies with that same profile currently hiring Account Executives.

Rules:
- Do NOT name any of the listed companies; the goal is to find new ones.
- Match this query style: boolean operators, role + trait + "remote". Example: '"account executive" "data platform" Series B remote hiring'.
- Favor mid-market (not enterprise), AI-native or adjacent B2B SaaS.

Return ONLY valid JSON, no prose: {"queries": ["...", "..."]}`

/** Pure: build the user prompt listing the good-fit companies. Testable. */
export function buildLookalikePrompt(signals: FitSignal[], n: number): string {
  const lines = signals.map((s) => {
    const traits = [s.aiNative ? 'AI-native' : null, s.segment].filter(Boolean).join(', ')
    const reasons = (s.fitReasons ?? []).slice(0, 2).join('; ')
    return `- ${s.company} — ${s.title}${traits ? ` (${traits})` : ''}${reasons ? ` — ${reasons}` : ''}`
  })
  return `These companies fit the candidate well:\n${lines.join('\n')}\n\nReturn {"queries": [...]} with ${n} search queries that would find OTHER companies (not the ones listed) with the same profile hiring Account Executives.`
}

/**
 * Generate dynamic "find more like these" search queries from your good fits.
 * Non-essential enhancement: returns [] on too-little-signal, over-budget, or
 * any failure so the broad static sweep always still runs.
 */
export async function lookalikeQueries(
  client: Anthropic,
  signals: FitSignal[],
  n = 3,
): Promise<string[]> {
  if (signals.length < 3) return [] // not enough signal to learn a profile yet
  if (!(await hasBudget())) return []
  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 400,
      temperature: 0.4,
      system: LOOKALIKE_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildLookalikePrompt(signals, n) }],
    })
    const usage = response.usage
    // Fire-and-forget: a DB error in cost tracking must not discard the valid queries.
    logUsage({
      kind: 'lookalike',
      model: 'claude-sonnet-4-6',
      inputTokens: usage?.input_tokens ?? 0,
      outputTokens: usage?.output_tokens ?? 0,
      cacheReadTokens: (usage as { cache_read_input_tokens?: number })?.cache_read_input_tokens ?? 0,
      cacheCreationTokens: (usage as { cache_creation_input_tokens?: number })?.cache_creation_input_tokens ?? 0,
      roleId: null,
    }).catch(() => {})
    const raw = response.content[0]?.type === 'text' ? response.content[0].text : ''
    const parsed = JSON.parse(extractJsonObject(raw, 'lookalike')) as { queries?: unknown }
    if (!Array.isArray(parsed.queries)) return []
    return parsed.queries
      .filter((q): q is string => typeof q === 'string' && q.trim().length > 0)
      .slice(0, n)
  } catch {
    return []
  }
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
