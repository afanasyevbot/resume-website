import type Anthropic from '@anthropic-ai/sdk'
import { professionalContext } from '@/lib/professionalContext'
import { buildSystemPrompt } from '@/lib/buildSystemPrompt'
import { decideRoute } from './decideRoute'
import { extractJsonObject } from './jsonExtract'
import type { MatchAssessment, MatchResult, RoleInput, Segment } from './types'

export const MATCH_SYSTEM_PROMPT = `${buildSystemPrompt(professionalContext)}

---

You are screening a job posting for Matthew. Judge fit against his real background ONLY — never invent experience. He is a mid-market / strategic AE who also builds AI systems. He targets AI-native B2B tech (strongly preferred), plus strong adjacent data / fintech / SaaS. Remote-first (open to Chicago, the Carolinas, Florida). ~$170k+ OTE. Mid-market, NOT enterprise.

Return ONLY valid JSON, no markdown and no prose, in this exact shape:
{
  "score": <integer 0-100, overall fit>,
  "reasons": ["<short bullet>", "..."],
  "aiNative": <true if the company's core product is building or selling AI, else false>,
  "segment": "<'mid-market' | 'enterprise' | 'unknown'>"
}

Scoring guide:
- 85-100: AI-native, mid-market/strategic AE, remote — squarely in his lane
- 70-84: strong match, minor gaps
- 55-69: moderate — real gaps but worth a human look
- below 55: weak fit`

const VALID_SEGMENTS: Segment[] = ['mid-market', 'enterprise', 'unknown']

export function isMatchAssessment(value: unknown): value is MatchAssessment {
  if (value === null || typeof value !== 'object') return false
  const r = value as Record<string, unknown>
  return (
    typeof r.score === 'number' &&
    Number.isInteger(r.score) &&
    (r.score as number) >= 0 &&
    (r.score as number) <= 100 &&
    Array.isArray(r.reasons) &&
    r.reasons.every((x) => typeof x === 'string') &&
    typeof r.aiNative === 'boolean' &&
    typeof r.segment === 'string' &&
    VALID_SEGMENTS.includes(r.segment as Segment)
  )
}

/** Calls Claude to assess a role. Throws on unparseable or invalid output. */
export async function assessRole(client: Anthropic, role: RoleInput): Promise<MatchAssessment> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 800,
    temperature: 0,
    // System prompt is large + identical per call — mark cacheable to
    // amortize input tokens across scores. ~70% input-cost reduction
    // once the cache warms.
    system: [
      {
        type: 'text',
        text: MATCH_SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: `Company: ${role.company}\nTitle: ${role.title}\nLocation: ${role.location ?? 'n/a'}\n\nJob description:\n${role.jobDescription}`,
      },
    ],
  })
  const raw = response.content[0]?.type === 'text' ? response.content[0].text : ''
  const parsed: unknown = JSON.parse(extractJsonObject(raw, 'matcher'))
  if (!isMatchAssessment(parsed)) throw new Error('matcher: invalid assessment shape')
  return parsed
}

/** Full matcher: assess via the LLM, then attach the deterministic route. */
export async function scoreRole(client: Anthropic, role: RoleInput): Promise<MatchResult> {
  const assessment = await assessRole(client, role)
  return { ...assessment, route: decideRoute(assessment) }
}
