import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { professionalContext } from '@/lib/professionalContext'
import { buildSystemPrompt } from '@/lib/buildSystemPrompt'
import { getClientId, rateLimit } from '@/lib/rateLimit'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  if (!rateLimit(getClientId(req), 15, 60_000)) {
    return NextResponse.json({ error: 'Too many requests. Please slow down.' }, { status: 429 })
  }

  const body = await req.json().catch(() => null)

  if (!body || typeof body.message !== 'string' || !body.message.trim()) {
    return NextResponse.json({ error: 'message is required' }, { status: 400 })
  }

  const history: Array<{ role: 'user' | 'assistant'; content: string }> =
    Array.isArray(body.history)
      ? body.history.filter(
          (m: unknown) =>
            m !== null &&
            typeof m === 'object' &&
            'role' in (m as object) &&
            'content' in (m as object) &&
            ((m as { role: unknown }).role === 'user' || (m as { role: unknown }).role === 'assistant') &&
            typeof (m as { content: unknown }).content === 'string'
        )
      : []

  const messages = [
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user' as const, content: body.message },
  ]

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      temperature: 0,
      system: buildSystemPrompt(professionalContext),
      messages,
    })

    const reply =
      response.content[0]?.type === 'text' ? response.content[0].text : ''

    return NextResponse.json({ reply })
  } catch {
    return NextResponse.json({ error: 'Failed to get response' }, { status: 500 })
  }
}
