import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { professionalContext } from '@/lib/professionalContext'
import { buildSystemPrompt } from '@/lib/buildSystemPrompt'
import type { FitResult } from '@/lib/types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const FIT_SYSTEM_PROMPT = `${buildSystemPrompt(professionalContext)}

---

You are now performing a ROLE FIT ANALYSIS. The user will paste a job description. Your job is to objectively cross-reference the role requirements against Matthew's background and return a brutally honest evaluation.

Do NOT act as a pitch tool. Flag genuine mismatches clearly. The goal is to help the hiring manager understand the real fit — including where Matthew falls short.

Return ONLY valid JSON in this exact shape, with no markdown, no code fences, no explanation:
{
  "score": <integer 0-100>,
  "verdict": "<short string, e.g. 'Strong match — AI-Native AE'>",
  "strengths": ["<bullet>", "<bullet>", ...],
  "flags": ["<bullet>", "<bullet>", ...],
  "recommendation": "<'Proceed' | 'Proceed with caveats' | 'Consider passing'>"
}

Scoring guide:
- 85-100: Near-perfect fit across role, experience, and stage
- 70-84: Strong match with minor gaps that can be addressed
- 55-69: Moderate fit — meaningful gaps but real strengths
- Below 55: Significant mismatch — recommend honest conversation about fit`

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)

  if (!body || typeof body.jobDescription !== 'string' || !body.jobDescription.trim()) {
    return NextResponse.json({ error: 'jobDescription is required' }, { status: 400 })
  }

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1000,
    temperature: 0,
    system: FIT_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Please analyze this job description against Matthew's background:\n\n${body.jobDescription}`,
      },
    ],
  })

  const raw = response.content[0]?.type === 'text' ? response.content[0].text : '{}'

  let result: FitResult
  try {
    result = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 })
  }

  return NextResponse.json(result)
}
