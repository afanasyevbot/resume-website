import type Anthropic from '@anthropic-ai/sdk'
import { professionalContext } from '@/lib/professionalContext'
import { buildSystemPrompt } from '@/lib/buildSystemPrompt'
import type { TailoredPackage, TailorInput, Archetype } from './tailorTypes'
import { lintPackage } from './tailorLint'

const TAILOR_SYSTEM_PROMPT = `${buildSystemPrompt(professionalContext)}

---

You are now TAILORING an application package for Matthew. The user message contains the target role (company, title, JD) and the matcher's fit assessment. Produce four artifacts, JSON only:

1. **summary** — a 3–4 sentence profile summary REWRITTEN for this role, with a single "company-bridge sentence" that names the company and ties Matthew's edge to what they do. Lead with the builder-who-sells positioning if the company is AI-native.

2. **emphasizedBullets** — exactly 4 bullets, drawn from his existing role bullets in the PROFILE → ROLES section above. Reorder + reframe in the JD's vocabulary. Inject named systems/tools the JD calls out (e.g., NetSuite, SAP, RAG, multi-agent) only if Matthew has real exposure per his profile. Each bullet ≤ 25 words.

3. **coverLetter** — body only, no salutation or closing. Structure: (a) hook tied to the specific company/JD, (b) 4.5–5 yrs SPS + 1-2 hard stats, (c) AI-builder differentiator (cite ONE specific project from his profile that maps to their work), (d) honest gap if the JD asks for something he lacks, (e) short CTA. ≤ 300 words.

4. **outreachDraft** — LinkedIn-style note to a hypothetical buyer/recruiter at the company. Specific to a project of theirs OR the JD. ≤ 90 words. No fluff. First-person, conversational.

Plus:

5. **notes** — up to 3 short honest gap acknowledgments from the matcher's reasons (e.g., "Smaller quota than enterprise AE range"). Used as internal notes, not for the application.

6. **archetype** — pick ONE based on the company type:
   - "revenue-x-ai": company sells AI products as core (AI agents/LLM apps for end users) — lead with builder positioning hardest
   - "claude-code-sidebar": company is dev-tooling / LLM infrastructure — lead with builder positioning but data-flavored
   - "classic-ats": everything else (data infra, fintech, B2B SaaS without AI-native pitch) — conventional ATS layout

**HARD RULES (lint will reject and force a retry):**
- NO em dashes (—). Use commas or periods. EVER.
- Do NOT use the word "Quarterbacked." Use "Led" or "Drove."
- Do NOT claim "enterprise" experience anywhere. Matthew is mid-market.
- NEVER fabricate stats. Only use numbers from his keyStats / role bullets.
- Cover letter ≤ 300 words. Outreach ≤ 90 words.

Return ONLY JSON, no prose:
{
  "archetype": "<archetype>",
  "summary": "<3-4 sentences>",
  "emphasizedBullets": ["<bullet>", "<bullet>", "<bullet>", "<bullet>"],
  "coverLetter": "<body, ≤ 300 words>",
  "outreachDraft": "<≤ 90 words>",
  "notes": ["<gap>", "..."]
}`

const VALID_ARCHETYPES: Archetype[] = ['revenue-x-ai', 'claude-code-sidebar', 'classic-ats']

function isPlainPackage(value: unknown): value is Omit<TailoredPackage, 'lintIssues'> {
  if (!value || typeof value !== 'object') return false
  const r = value as Record<string, unknown>
  return (
    typeof r.archetype === 'string' &&
    VALID_ARCHETYPES.includes(r.archetype as Archetype) &&
    typeof r.summary === 'string' &&
    Array.isArray(r.emphasizedBullets) &&
    r.emphasizedBullets.every((b) => typeof b === 'string') &&
    typeof r.coverLetter === 'string' &&
    typeof r.outreachDraft === 'string' &&
    Array.isArray(r.notes) &&
    r.notes.every((n) => typeof n === 'string')
  )
}

function buildUserMessage(input: TailorInput, lintFeedback?: string[]): string {
  const { role } = input
  const fitReasons = role.fitReasons.length
    ? '\n\nMatcher fit reasons:\n' + role.fitReasons.map((r) => `- ${r}`).join('\n')
    : ''
  const lintBlock =
    lintFeedback && lintFeedback.length
      ? `\n\nPREVIOUS ATTEMPT FAILED LINT. Fix these issues and try again:\n${lintFeedback.map((l) => `- ${l}`).join('\n')}`
      : ''
  return (
    `Tailor an application package for this role.\n\n` +
    `Company: ${role.company}\n` +
    `Title: ${role.title}\n` +
    `Location: ${role.location ?? 'n/a'}\n` +
    `URL: ${role.url ?? 'n/a'}\n` +
    `Matcher: score ${role.fitScore ?? 'n/a'} · segment ${role.segment ?? 'n/a'} · aiNative ${role.aiNative ?? 'n/a'}` +
    fitReasons +
    `\n\nJob description:\n${role.jdText}` +
    lintBlock
  )
}

async function callTailor(
  client: Anthropic,
  input: TailorInput,
  lintFeedback?: string[],
): Promise<TailoredPackage> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2200,
    temperature: 0.4,
    system: [
      {
        type: 'text',
        text: TAILOR_SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [{ role: 'user', content: buildUserMessage(input, lintFeedback) }],
  })
  const raw = response.content[0]?.type === 'text' ? response.content[0].text : ''
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('tailor: no JSON object in response')
  const parsed: unknown = JSON.parse(match[0])
  if (!isPlainPackage(parsed)) throw new Error('tailor: invalid package shape')
  return { ...parsed, lintIssues: [] }
}

const MAX_RETRIES = 2

/**
 * Generate a tailored application package with up to 2 self-correction rounds.
 * If the final round still has lint issues, returns the package WITH the issues
 * surfaced in `lintIssues` so the human can see what's still wrong.
 */
export async function tailorRole(client: Anthropic, input: TailorInput): Promise<TailoredPackage> {
  let pkg = await callTailor(client, input)
  let { issues } = lintPackage(pkg)

  let attempt = 0
  while (issues.length > 0 && attempt < MAX_RETRIES) {
    attempt += 1
    pkg = await callTailor(client, input, issues)
    issues = lintPackage(pkg).issues
  }

  return { ...pkg, lintIssues: issues }
}
