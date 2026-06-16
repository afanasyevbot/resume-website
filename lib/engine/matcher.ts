import type Anthropic from '@anthropic-ai/sdk'
import { professionalContext } from '@/lib/professionalContext'
import { buildSystemPrompt } from '@/lib/buildSystemPrompt'
import { decideRoute } from './decideRoute'
import { extractJsonObject } from './jsonExtract'
import { hasBudget, logUsage } from './costGuard'
import { passesLocationGate, locationExclusionReason } from './locationGate'
import type { MatchAssessment, MatchResult, RoleInput, Segment } from './types'

export const MATCH_SYSTEM_PROMPT = `${buildSystemPrompt(professionalContext)}

---

You are screening a job posting for Matthew. Judge fit against his real background ONLY — never invent experience. He is a full-cycle mid-market / strategic AE with 5+ years B2B SaaS sales experience who also builds AI systems. He targets any B2B SaaS or tech company where a strong AE can earn $170k+ OTE. He works fully remote (anywhere US), or onsite/hybrid only in Minneapolis/Minnesota, Chicago, the Carolinas, Florida, or Tennessee. Mid-market, NOT enterprise.

Return ONLY valid JSON, no markdown and no prose, in this exact shape:
{
  "score": <integer 0-100, overall fit>,
  "reasons": ["<short bullet>", "..."],
  "aiNative": <true if the company's core product is building or selling AI, else false>,
  "segment": "<'mid-market' | 'enterprise' | 'unknown'>",
  "summary": "<2-3 sentence plain-English summary of the role: what the company does, what the AE would own, and why it may/may not fit Matthew. Max 60 words.>",
  "workplace": "<'remote' if it can be done fully remotely; 'onsite' if it requires being in an office most days; 'hybrid' if mixed; 'unknown' ONLY if the posting truly doesn't say>",
  "locations": ["<2-letter US state code for EACH required office/city, e.g. 'CA' for San Francisco, 'NY' for New York; use [] when remote or no location is stated>"]
}

LOCATION IS NOT A SCORING FACTOR. A separate hard filter decides whether the
location works — do NOT raise or lower the score based on where the role is.
Just EXTRACT workplace + locations accurately. Score purely on role type,
segment, and comp fit.

Scoring guide — compensation and role type are the primary signals. Calibrate to
these anchors and do NOT cluster genuine fits in the low 70s:
- 82-95: A full-cycle AE / Account Executive role at a B2B SaaS or tech company,
  mid-market or strategic (non-enterprise), remote or remote-friendly. This is his
  CORE LANE — score it here even when OTE is unlisted and even when the company is
  not AI-native. A clean mid-market AE role with no real disqualifier belongs HERE,
  not in the 70s. (AI-native core product: +3-5, toward the top of the band.)
  Example: a remote Mid-Market Account Executive at a B2B SaaS company ≈ 82-85.
- 70-81: An AE role with ONE real, specific gap — a clear enterprise lean or
  comp signaled clearly below target. (Location is NOT a gap here — it is gated
  separately; do not dock for it.)
- 55-69: An AE role with a SERIOUS gap — enterprise-only, SMB/PLG transactional,
  or comp clearly under $150k OTE.
- 30-54: Sales-adjacent but the wrong role type — SDR/BDR, Customer Success,
  RevOps / sales-ops, solutions / sales engineering, sales management/leadership.
- below 30: Not a sales role at all — engineering, marketing, finance, ops, recruiting.

OTE not listed: assume it may meet the $170k target unless the JD signals otherwise
— do NOT dock points for a missing number.`

const VALID_SEGMENTS: Segment[] = ['mid-market', 'enterprise', 'unknown']
const VALID_WORKPLACES = ['remote', 'onsite', 'hybrid', 'unknown']

export function isMatchAssessment(value: unknown): value is MatchAssessment {
  if (value === null || typeof value !== 'object') return false
  const r = value as Record<string, unknown>
  if (
    typeof r.score !== 'number' ||
    !Number.isInteger(r.score) ||
    (r.score as number) < 0 ||
    (r.score as number) > 100 ||
    !Array.isArray(r.reasons) ||
    !r.reasons.every((x) => typeof x === 'string') ||
    typeof r.aiNative !== 'boolean' ||
    typeof r.segment !== 'string' ||
    !VALID_SEGMENTS.includes(r.segment as Segment)
  ) return false
  // summary is optional — normalize missing/non-string to null
  if (typeof r.summary !== 'string') r.summary = null
  // workplace/locations are normalized rather than required: an older response
  // or a model slip must not fail validation. Defaults ('unknown'/[]) PASS the
  // location gate, so a missing field never silently discards a role.
  if (typeof r.workplace !== 'string' || !VALID_WORKPLACES.includes(r.workplace as string)) {
    r.workplace = 'unknown'
  }
  if (!Array.isArray(r.locations) || !r.locations.every((x) => typeof x === 'string')) {
    r.locations = []
  }
  return true
}

/** Calls Claude to assess a role. Throws on unparseable or invalid output.
 *  Checks the monthly spend cap before calling; throws if over budget. */
export async function assessRole(client: Anthropic, role: RoleInput, roleId?: number | null): Promise<MatchAssessment> {
  if (!(await hasBudget())) throw new Error('Monthly spend cap reached — scoring paused.')
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
  // Log token usage for cost tracking.
  const usage = response.usage
  await logUsage({
    kind: 'score',
    model: 'claude-sonnet-4-6',
    inputTokens: usage?.input_tokens ?? 0,
    outputTokens: usage?.output_tokens ?? 0,
    cacheReadTokens: (usage as { cache_read_input_tokens?: number })?.cache_read_input_tokens ?? 0,
    cacheCreationTokens: (usage as { cache_creation_input_tokens?: number })?.cache_creation_input_tokens ?? 0,
    roleId: roleId ?? null,
  })

  const raw = response.content[0]?.type === 'text' ? response.content[0].text : ''
  const parsed: unknown = JSON.parse(extractJsonObject(raw, 'matcher'))
  if (!isMatchAssessment(parsed)) throw new Error('matcher: invalid assessment shape')
  return parsed
}

/** Full matcher: assess via the LLM, then attach the deterministic route. */
export async function scoreRole(client: Anthropic, role: RoleInput): Promise<MatchResult> {
  const assessment = await assessRole(client, role)
  const route = decideRoute(assessment)
  // When the location gate is what discarded the role, prepend a plain reason so
  // the discarded row still explains itself in the dashboard (not a bare number).
  const reasons =
    route === 'discard' && !passesLocationGate(assessment.workplace, assessment.locations)
      ? [locationExclusionReason(assessment.workplace, assessment.locations), ...assessment.reasons]
      : assessment.reasons
  return { ...assessment, reasons, route }
}
