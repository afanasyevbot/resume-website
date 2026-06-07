import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'
import { anthropicKey } from '@/lib/env'
import {
  queriesForToday,
  processWebResults,
  gatherFitSignals,
  lookalikeQueries,
  type WebSearchResult,
  type WebResearchReport,
} from '@/lib/engine/webResearch'

export const runtime = 'nodejs'
export const maxDuration = 300

const TAVILY_API_KEY = process.env.TAVILY_API_KEY

// ── Tavily helpers (direct HTTP — we can't import MCP tools in a route) ──

async function tavilySearch(query: string): Promise<WebSearchResult[]> {
  if (!TAVILY_API_KEY) return []
  const res = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: TAVILY_API_KEY,
      query,
      max_results: 10,
      search_depth: 'basic',
      time_range: 'month',
    }),
  })
  if (!res.ok) return []
  const body = (await res.json()) as { results?: Array<{ url: string; title: string; content: string }> }
  return (body.results ?? []).map((r) => ({
    title: r.title ?? '',
    url: r.url,
    snippet: r.content ?? '',
  }))
}

async function tavilyExtract(urls: string[]): Promise<Map<string, string>> {
  if (!TAVILY_API_KEY || urls.length === 0) return new Map()
  const res = await fetch('https://api.tavily.com/extract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: TAVILY_API_KEY,
      urls,
    }),
  })
  if (!res.ok) return new Map()
  const body = (await res.json()) as { results?: Array<{ url: string; raw_content: string }> }
  const map = new Map<string, string>()
  for (const r of body.results ?? []) {
    if (r.raw_content) map.set(r.url, r.raw_content)
  }
  return map
}

// ── Route handlers ───────────────────────────────────────────────────

/** Manual trigger from the dashboard. */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { maxScores?: number }
  const maxScores = typeof body.maxScores === 'number' ? Math.min(15, Math.max(1, body.maxScores)) : 10

  if (!TAVILY_API_KEY) {
    return NextResponse.json({ error: 'TAVILY_API_KEY not configured' }, { status: 500 })
  }

  const client = new Anthropic({ apiKey: anthropicKey() })

  // Broad static sweep across the full lane, PLUS dynamic "find lookalikes"
  // queries learned from companies that have fit you well so far.
  const signals = await gatherFitSignals()
  const dynamic = await lookalikeQueries(client, signals, 3)
  const queries = [...queriesForToday(5), ...dynamic]
  const allResults: WebSearchResult[] = []

  for (const q of queries) {
    const results = await tavilySearch(q)
    allResults.push(...results)
  }

  // Dedupe by URL before extracting
  const uniqueUrls = [...new Set(allResults.map((r) => r.url))]
  const extracted = await tavilyExtract(uniqueUrls.slice(0, 25)) // cap extraction calls

  const report = await processWebResults(client, allResults, extracted, { maxScores, autoTailor: true, lookalikeCount: dynamic.length })
  report.queriesRun = queries.length

  return NextResponse.json(report)
}

/** Cron-triggered. Same auth pattern as /api/engine/source. */
export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET
  const auth = req.headers.get('authorization')
  if (!cronSecret || auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  if (!TAVILY_API_KEY) {
    return NextResponse.json({ error: 'TAVILY_API_KEY not configured' }, { status: 500 })
  }

  const client = new Anthropic({ apiKey: anthropicKey() })

  // Broad daily sweep + dynamic lookalike queries. Sized to stay in 300s.
  const signals = await gatherFitSignals()
  const dynamic = await lookalikeQueries(client, signals, 2)
  const queries = [...queriesForToday(4), ...dynamic]
  const allResults: WebSearchResult[] = []

  for (const q of queries) {
    const results = await tavilySearch(q)
    allResults.push(...results)
  }

  const uniqueUrls = [...new Set(allResults.map((r) => r.url))]
  const extracted = await tavilyExtract(uniqueUrls.slice(0, 20))

  const report = await processWebResults(client, allResults, extracted, { maxScores: 8, autoTailor: true, lookalikeCount: dynamic.length })
  report.queriesRun = queries.length

  console.log('cron research:', JSON.stringify({ scored: report.scored, tailored: report.tailored, lookalikes: report.lookalikeCount, errors: report.errors.length }))
  return NextResponse.json({ ok: true, ...report })
}
