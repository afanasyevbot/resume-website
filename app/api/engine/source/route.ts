import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'
import { runSourcing } from '@/lib/engine/sourcing'
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

// Cron-triggered sourcing. Vercel Cron sends a GET with
// `Authorization: Bearer <CRON_SECRET>`. We re-verify the token here (the
// middleware also checks it) and run a smaller batch so the function finishes
// within the serverless time budget. At ~8s per scored role, 5 keeps us
// comfortably under Vercel's 60s Hobby-plan function limit. Each run dedupes
// against existing roles, so consecutive days work through the backlog.
const CRON_MAX_SCORES = 5

export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET
  const auth = req.headers.get('authorization')
  if (!cronSecret || auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const client = new Anthropic({ apiKey: anthropicKey() })
  try {
    const report = await runSourcing(client, { maxScores: CRON_MAX_SCORES })
    console.log('cron sourcing:', JSON.stringify({ scored: report.totalScored, errors: report.totalErrors }))
    return NextResponse.json({ ok: true, ...report })
  } catch (err) {
    console.error('GET /api/engine/source (cron) error:', err)
    return NextResponse.json({ error: 'Sourcing failed.' }, { status: 502 })
  }
}
