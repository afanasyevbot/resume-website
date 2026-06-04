# Job Engine — Phase 1e: Tailoring Agent

**Goal:** Productionize Matthew's job-application-engine skill as a server-side agent. Each scored role gets a tailored package (summary, emphasized bullets, cover letter, outreach draft), lint-checked against his master-profile rules.

**Architecture:**
- `lib/engine/tailor.ts` — pure server-side Claude call + lint pass. Takes a role row + result; returns a structured `TailoredPackage`. The system prompt embeds his canonical profile (cached) and the tailoring rules. Self-corrects on lint failure (max 2 retries).
- `app/api/engine/tailor/route.ts` — POST endpoint. Loads role from Neon, calls the agent, persists package, fires `tailored` event, returns the package.
- `components/engine/TailorAction.tsx` — client component, the gold "Tailor" button + result expand.
- `RoleQueueTable.tsx` — render `TailorAction` when status=scored + route=tailor.

## Lint rules (from `professionalContext.ts` doNotSay + master-profile audit)
- No em dashes (—). Reject and retry.
- No "Quarterbacked" — use "Led" or "Drove".
- No "enterprise" claims (Matthew is mid-market).
- No fabricated stats — every numeric claim must appear in `professionalContext.keyStats` or `roles[].bullets`.
- Cover letter ≤ 300 words. Outreach ≤ 90 words.

## Archetype selection (LLM picks, code enforces)
- `aiNative=true` and the company sells AI → archetype `"revenue-x-ai"` (builder positioning lead)
- `aiNative=true` and dev-tool/LLM infra → archetype `"claude-code-sidebar"`
- otherwise → archetype `"classic-ats"`

## TailoredPackage shape

```ts
interface TailoredPackage {
  archetype: 'revenue-x-ai' | 'claude-code-sidebar' | 'classic-ats'
  summary: string             // 3-4 sentence profile summary
  emphasizedBullets: string[] // 4 bullets — reordered/rewritten existing ones, JD vocab
  coverLetter: string         // <= 300 words
  outreachDraft: string       // <= 90 words, LinkedIn-flavored
  notes: string[]             // honest gaps acknowledged (≤ 3)
  lintIssues: string[]        // any rules the agent had to fix during retry
}
```

## API contract
`POST /api/engine/tailor`
- Body: `{ roleId: number }`
- Returns: `{ packageId, package }` or `{ error }`
- Auth: middleware-gated (existing engine session cookie)

## Out of scope (next slices)
- Actual DOCX/PDF generation — text-only artifacts for now (Matthew copies into his templates)
- Sourcing agent (separate slice)
- Outreach send (always drafts you send)
