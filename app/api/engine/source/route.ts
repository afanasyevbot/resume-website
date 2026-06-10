import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'
import { runSourcing, formatSourceRunDetail } from '@/lib/engine/sourcing'
import { sql } from '@/lib/engine/db'
import { anthropicKey } from '@/lib/env'

export const runtime = 'nodejs'
// Sourcing can take a while: 12 companies × several scoring calls × ~2-15s each
export const maxDuration = 300

export async function POST(req: Request) {
  // Parse optional caps from body
  const body = (await req.json().catch(() => ({}))) as { maxScores?: number; maxAgeDays?: number }
  const maxScores = typeof body.maxScores === 'number' ? Math.min(50, Math.max(1, body.maxScores)) : undefined
  const maxAgeDays = typeof body.maxAgeDays === 'number' ? Math.min(180, Math.max(1, body.maxAgeDays)) : undefined

  const client = new Anthropic({ apiKey: anthropicKey() })
  try {
    const report = await runSourcing(client, { maxScores, maxAgeDays })
    return NextResponse.json(report)
  } catch (err) {
    console.error('POST /api/engine/source error:', err)
    return NextResponse.json({ error: 'Sourcing failed.' }, { status: 502 })
  }
}

// Cron-triggered sourcing with auto-tailor. Throughput is TIME-boxed, not
// count-boxed: keep scoring until ~240s of the 300s function window is used,
// with a cost-sanity cap of 25 (the old fixed cap of 5 starved the funnel —
// 5 scores/run across 35 companies can't feed a 10-applies/day pipeline).
// Cost guard still blocks every Claude call once the $25/mo cap is hit.
const CRON_MAX_SCORES = 25
const CRON_DEADLINE_MS = 240_000

export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET
  const auth = req.headers.get('authorization')
  if (!cronSecret || auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const client = new Anthropic({ apiKey: anthropicKey() })
  try {
    const report = await runSourcing(client, { maxScores: CRON_MAX_SCORES, deadlineMs: CRON_DEADLINE_MS, autoTailor: true })
    const detail = formatSourceRunDetail(report)
    // Persist summary so the funnel can be audited from the DB (not just Vercel logs)
    await sql`insert into events (kind, detail) values ('source_run', ${JSON.stringify(detail)}::jsonb)`
    console.log('cron sourcing:', JSON.stringify(detail))
    return NextResponse.json({ ok: true, ...report })
  } catch (err) {
    console.error('GET /api/engine/source (cron) error:', err)
    return NextResponse.json({ error: 'Sourcing failed.' }, { status: 502 })
  }
}
