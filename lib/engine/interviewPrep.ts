import type Anthropic from '@anthropic-ai/sdk'
import { professionalContext } from '@/lib/professionalContext'
import { buildSystemPrompt } from '@/lib/buildSystemPrompt'
import { extractJsonObject } from './jsonExtract'
import { hasBudget, logUsage } from './costGuard'

/** One likely interview question plus how Matthew should answer it. */
export interface PrepQuestion {
  question: string
  /** How to answer — names a STAR story or stat from his profile when one fits. */
  angle: string
}

/** A likely interviewer concern about Matthew, plus an honest response. */
export interface PrepObjection {
  objection: string
  response: string
}

export interface InterviewPrep {
  /** 2-3 sentence "why this company" he can deliver. */
  whyThisCompany: string
  likelyQuestions: PrepQuestion[]
  objections: PrepObjection[]
  /** Sharp questions for him to ask the interviewer. */
  questionsToAsk: string[]
}

export interface InterviewPrepInput {
  company: string
  title: string
  jdText: string
  fitReasons: string[]
  segment: string | null
  aiNative: boolean | null
}

const PREP_SYSTEM_PROMPT = `${buildSystemPrompt(professionalContext)}

---

You are preparing Matthew for an interview for the role in the user message. Use ONLY his real background above. Be specific, honest, and immediately usable — this is a prep sheet he will study, not marketing copy.

Produce four things:

1. **whyThisCompany** — 2-3 sentences he can deliver out loud: what the company does, and a GENUINE reason it connects to his experience or worldview (bridge from his builder-who-sells identity or a specific AI system he built). No generic enthusiasm.

2. **likelyQuestions** — 5-7 questions likely for THIS role and JD (mix of behavioral, sales-process, and company/role-specific). For each, an "angle": exactly how to answer, naming a specific STAR story or stat from his profile when one fits. If the JD wants something he lacks, the angle says how to address it truthfully.

3. **objections** — 2-4 likely interviewer concerns about HIM (years of experience, vertical/industry gaps, mid-market vs the role's scope, not a formal engineer). For each, an honest, confident response drawn from his real profile.

4. **questionsToAsk** — 3-5 sharp questions for him to ask the interviewer, specific to this company and role.

RULES: No em dashes. Never fabricate stats. Never claim enterprise experience. Do not name a specific AI vendor/API (say "multiple AI APIs"). Do not claim experience with a named sales methodology he has not used.

Return ONLY JSON, no prose:
{
  "whyThisCompany": "<2-3 sentences>",
  "likelyQuestions": [{"question": "<q>", "angle": "<how to answer + which STAR story/stat>"}],
  "objections": [{"objection": "<concern>", "response": "<honest response>"}],
  "questionsToAsk": ["<question>"]
}`

function isQuestion(v: unknown): v is PrepQuestion {
  if (!v || typeof v !== 'object') return false
  const r = v as Record<string, unknown>
  return typeof r.question === 'string' && typeof r.angle === 'string'
}

function isObjection(v: unknown): v is PrepObjection {
  if (!v || typeof v !== 'object') return false
  const r = v as Record<string, unknown>
  return typeof r.objection === 'string' && typeof r.response === 'string'
}

export function isInterviewPrep(value: unknown): value is InterviewPrep {
  if (!value || typeof value !== 'object') return false
  const r = value as Record<string, unknown>
  return (
    typeof r.whyThisCompany === 'string' &&
    Array.isArray(r.likelyQuestions) &&
    r.likelyQuestions.every(isQuestion) &&
    Array.isArray(r.objections) &&
    r.objections.every(isObjection) &&
    Array.isArray(r.questionsToAsk) &&
    r.questionsToAsk.every((q) => typeof q === 'string')
  )
}

function buildUserMessage(input: InterviewPrepInput): string {
  const fitReasons = input.fitReasons.length
    ? '\n\nMatcher fit reasons:\n' + input.fitReasons.map((r) => `- ${r}`).join('\n')
    : ''
  return (
    `Prepare Matthew for an interview for this role.\n\n` +
    `Company: ${input.company}\n` +
    `Title: ${input.title}\n` +
    `Segment: ${input.segment ?? 'n/a'} · aiNative ${input.aiNative ?? 'n/a'}` +
    fitReasons +
    `\n\nJob description:\n${input.jdText}`
  )
}

/** Generate an interview prep sheet. Throws on unparseable/invalid output or
 *  when the monthly spend cap is hit. Low-volume by design (only roles that
 *  reach an interview), so it runs on demand rather than in the bulk pipeline. */
export async function generateInterviewPrep(
  client: Anthropic,
  input: InterviewPrepInput,
): Promise<InterviewPrep> {
  if (!(await hasBudget())) throw new Error('Monthly spend cap reached — interview prep paused.')
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    temperature: 0.5,
    system: [{ type: 'text', text: PREP_SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: buildUserMessage(input) }],
  })
  const usage = response.usage
  await logUsage({
    kind: 'interview_prep',
    model: 'claude-sonnet-4-6',
    inputTokens: usage?.input_tokens ?? 0,
    outputTokens: usage?.output_tokens ?? 0,
    cacheReadTokens: (usage as { cache_read_input_tokens?: number })?.cache_read_input_tokens ?? 0,
    cacheCreationTokens: (usage as { cache_creation_input_tokens?: number })?.cache_creation_input_tokens ?? 0,
  })

  const raw = response.content[0]?.type === 'text' ? response.content[0].text : ''
  const parsed: unknown = JSON.parse(extractJsonObject(raw, 'interviewPrep'))
  if (!isInterviewPrep(parsed)) throw new Error('interviewPrep: invalid shape')
  return parsed
}
