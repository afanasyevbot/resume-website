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
