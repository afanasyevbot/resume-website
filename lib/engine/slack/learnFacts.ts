/**
 * After a Slack-answered question leads to a successful apply, extract any
 * universal profile facts from the answers and persist them so future forms
 * auto-answer without asking.
 *
 * Best-effort — a failure here never blocks the apply flow.
 */

import Anthropic from '@anthropic-ai/sdk'
import { anthropicKey } from '@/lib/env'
import { updateProfileFacts } from '@/lib/engine/screeningFacts'
import type { ScreeningFacts } from '@/lib/engine/screeningFacts'

const UPDATABLE_FIELDS = `
yearsSalesExperience (number — total years in sales)
selfSourcedPct (number 0-100 — % of pipeline self-sourced / outbound)
martechYears (number — years selling martech products)
languageProficiency (object — e.g. {"spanish":"none","french":"basic"})
baseSalary (number — base salary expectation in USD)
ote (number — OTE expectation in USD)
startDate (string — availability / notice period)
remoteOk (boolean)
willingToRelocate (boolean)
`.trim()

export async function learnFromAnswers(
  questions: string[],
  manualAnswers: Record<string, string>,
): Promise<void> {
  const answered = questions
    .filter((q) => manualAnswers[q]?.trim())
    .map((q) => `Q: ${q}\nA: ${manualAnswers[q].trim()}`)

  if (answered.length === 0) return

  const prompt = `You are updating a job applicant's profile facts from answers they just gave to screening questions.

Screening question answers:
${answered.join('\n\n')}

Updatable profile fields:
${UPDATABLE_FIELDS}

Rules:
- Only include fields where the answer is clearly a universal fact (years of experience, salary, availability) — NOT role-specific answers ("why do you want to work here?").
- Extract numeric values as numbers (e.g. "5 years" → 5, "~60%" → 60).
- If nothing qualifies, return {}.
- Return only valid JSON, nothing else.`

  try {
    const client = new Anthropic({ apiKey: anthropicKey() })
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    })
    const text = msg.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { type: 'text'; text: string }).text)
      .join('')
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) return
    const patch = JSON.parse(match[0]) as Partial<ScreeningFacts>
    await updateProfileFacts(patch)
  } catch {
    // Best-effort — never surface this error upward
  }
}
