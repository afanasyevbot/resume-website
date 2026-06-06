# Job Engine — Phase 1a: Canonical Profile + Role Matcher Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reconcile Matthew's canonical profile (6 AI systems) and build a tested Role Matcher library — the engine's "brain" that scores a job posting against his profile and routes it (tailor / flag / discard).

**Architecture:** Pure TypeScript library modules under `lib/engine/`, reusing the existing `professionalContext` + `buildSystemPrompt` + Anthropic patterns from `app/api/fit/route.ts`. The LLM produces judgment only (score, reasons, AI-native, segment); a separate deterministic function makes the routing decision. No database, no auth, no API route in this slice — those land in the next plan. Everything is unit-testable with a mocked Anthropic client.

**Tech Stack:** Next.js 16, TypeScript (strict), `@anthropic-ai/sdk`, Vitest. Path alias `@/*` → repo root.

**Repo:** `~/Documents/_Archive/resume-website` (current branch `feat/job-application-engine`). Run all commands from the repo root.

---

### Task 1: Reconcile the canonical profile (6 AI systems)

`professionalContext.ts` currently lists 5 projects and says "5 production AI systems." Matthew's canonical count is 6 — the missing one is the M&A Valuation System.

**Files:**
- Modify: `lib/professionalContext.ts`
- Test: `lib/__tests__/professionalContext.test.ts` (create)

- [ ] **Step 1: Write the failing test**

Create `lib/__tests__/professionalContext.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { professionalContext } from '../professionalContext'

describe('professionalContext canonical facts', () => {
  it('lists 6 production AI systems', () => {
    expect(professionalContext.projects).toHaveLength(6)
  })

  it('includes the M&A Valuation System', () => {
    const names = professionalContext.projects.map((p) => p.name)
    expect(names).toContain('M&A Valuation System')
  })

  it('summary states 6 production AI systems', () => {
    expect(professionalContext.summary).toContain('6 production AI systems')
  })

  it('key stats state 6 production AI systems', () => {
    expect(professionalContext.keyStats.some((s) => s.includes('6 production AI systems'))).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- lib/__tests__/professionalContext.test.ts`
Expected: FAIL (projects has length 5; summary/keyStats say "5 production AI systems").

- [ ] **Step 3: Add the M&A Valuation System project**

In `lib/professionalContext.ts`, inside the `projects` array, insert this object immediately **before** the `Glow Routine` entry (`{ name: 'Glow Routine', ... }`):

```typescript
    {
      name: 'M&A Valuation System',
      badge: 'AI Valuation · Client',
      description:
        'Streamlit-based M&A valuation platform running 12 financial models (DCF, comparables, precedent transactions, and more) across a multi-page deal workspace. Generates Excel and CIM-quality PDF reports, persists deals to Supabase, and supports multi-deal switching. Containerized with Docker and Nginx, instrumented with Sentry, and covered by a pytest suite.',
      stack: ['Python', 'Streamlit', 'Supabase', 'Docker + Nginx', 'Sentry', 'pytest'],
    },
```

- [ ] **Step 4: Bump the "5 → 6 production AI systems" count strings**

Make these exact replacements in `lib/professionalContext.ts`:

1. In `summary`: `built 5 production AI systems` → `built 6 production AI systems`
2. In the Founder role `preview`: `Built 5 production AI systems while carrying full quota.` → `Built 6 production AI systems while carrying full quota.`
3. In the Founder role `bullets`: `Built 5 production AI systems using Anthropic API and LLM platforms` → `Built 6 production AI systems using Anthropic API and LLM platforms`
4. In the Founder role `aiContext.results`: `5 production AI systems delivered.` → `6 production AI systems delivered.`
5. In `keyStats`: `5 production AI systems built and deployed while carrying full sales quota` → `6 production AI systems built and deployed while carrying full sales quota`

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test -- lib/__tests__/professionalContext.test.ts`
Expected: PASS (4 tests).

Also run the existing prompt test to confirm nothing broke:
Run: `npm test -- lib/__tests__/buildSystemPrompt.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/professionalContext.ts lib/__tests__/professionalContext.test.ts
git commit -m "feat: reconcile canonical profile to 6 AI systems (add M&A Valuation System)"
```

---

### Task 2: Engine types

**Files:**
- Create: `lib/engine/types.ts`

- [ ] **Step 1: Create the types module**

Create `lib/engine/types.ts`:

```typescript
export type RouteDecision = 'tailor' | 'flag' | 'discard'

export type Segment = 'mid-market' | 'enterprise' | 'unknown'

/** What the LLM judges about a role — judgment only, no routing. */
export interface MatchAssessment {
  score: number // 0-100 overall fit vs Matthew's profile
  reasons: string[] // concise bullets: why it fits / where it doesn't
  aiNative: boolean // is the company's core product building/selling AI?
  segment: Segment // the role's sales segment
}

/** A job posting to evaluate. */
export interface RoleInput {
  company: string
  title: string
  jobDescription: string
  url?: string
  location?: string
}

/** Assessment plus the deterministic routing decision. */
export interface MatchResult extends MatchAssessment {
  route: RouteDecision
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/engine/types.ts
git commit -m "feat: add job-engine types"
```

---

### Task 3: Deterministic route decision

The LLM never decides routing — this pure function does (Matthew's rule: model judges, code routes). Enterprise-only roles are capped at `flag` because he is mid-market.

**Files:**
- Create: `lib/engine/decideRoute.ts`
- Test: `lib/engine/__tests__/decideRoute.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/engine/__tests__/decideRoute.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { decideRoute, DEFAULT_THRESHOLDS } from '../decideRoute'
import type { MatchAssessment } from '../types'

function assessment(partial: Partial<MatchAssessment>): MatchAssessment {
  return { score: 0, reasons: [], aiNative: false, segment: 'mid-market', ...partial }
}

describe('decideRoute', () => {
  it('routes a strong mid-market fit to tailor', () => {
    expect(decideRoute(assessment({ score: 80, segment: 'mid-market' }))).toBe('tailor')
  })

  it('routes a borderline score to flag', () => {
    expect(decideRoute(assessment({ score: 60 }))).toBe('flag')
  })

  it('routes a weak score to discard', () => {
    expect(decideRoute(assessment({ score: 40 }))).toBe('discard')
  })

  it('caps an enterprise role at flag even with a high score', () => {
    expect(decideRoute(assessment({ score: 90, segment: 'enterprise' }))).toBe('flag')
  })

  it('respects the threshold boundaries exactly', () => {
    expect(decideRoute(assessment({ score: DEFAULT_THRESHOLDS.tailor }))).toBe('tailor')
    expect(decideRoute(assessment({ score: DEFAULT_THRESHOLDS.flag }))).toBe('flag')
    expect(decideRoute(assessment({ score: DEFAULT_THRESHOLDS.flag - 1 }))).toBe('discard')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- lib/engine/__tests__/decideRoute.test.ts`
Expected: FAIL with "Cannot find module '../decideRoute'".

- [ ] **Step 3: Write minimal implementation**

Create `lib/engine/decideRoute.ts`:

```typescript
import type { MatchAssessment, RouteDecision } from './types'

export interface RouteThresholds {
  tailor: number // score >= this → tailor
  flag: number // score >= this (and < tailor) → flag; below → discard
}

export const DEFAULT_THRESHOLDS: RouteThresholds = { tailor: 70, flag: 55 }

/**
 * Deterministic routing. The LLM produces the judgment (score/segment);
 * this code makes the decision — never the model.
 * Enterprise-only roles are capped at 'flag' because Matthew is mid-market;
 * they never auto-route to 'tailor' regardless of score.
 */
export function decideRoute(
  assessment: MatchAssessment,
  thresholds: RouteThresholds = DEFAULT_THRESHOLDS,
): RouteDecision {
  const { score, segment } = assessment
  let route: RouteDecision =
    score >= thresholds.tailor ? 'tailor' : score >= thresholds.flag ? 'flag' : 'discard'
  if (segment === 'enterprise' && route === 'tailor') route = 'flag'
  return route
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- lib/engine/__tests__/decideRoute.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/engine/decideRoute.ts lib/engine/__tests__/decideRoute.test.ts
git commit -m "feat: add deterministic route decision for matcher"
```

---

### Task 4: The Matcher (assess + score)

Calls Claude to assess a role, validates/parses the JSON (reusing the fit route's extraction approach), then attaches the deterministic route. The Anthropic client is injected so tests can pass a fake.

**Files:**
- Create: `lib/engine/matcher.ts`
- Test: `lib/engine/__tests__/matcher.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/engine/__tests__/matcher.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import type Anthropic from '@anthropic-ai/sdk'
import { assessRole, scoreRole, isMatchAssessment } from '../matcher'
import type { RoleInput } from '../types'

const role: RoleInput = {
  company: 'Acme AI',
  title: 'Mid-Market Account Executive',
  jobDescription: 'Sell our AI platform to mid-market buyers. 4+ years SaaS sales.',
}

function fakeClient(text: string): Anthropic {
  return {
    messages: {
      create: async () => ({ content: [{ type: 'text', text }] }),
    },
  } as unknown as Anthropic
}

const goodAssessment = {
  score: 82,
  reasons: ['AI-native', 'mid-market AE'],
  aiNative: true,
  segment: 'mid-market',
}

describe('isMatchAssessment', () => {
  it('accepts a well-formed assessment', () => {
    expect(isMatchAssessment(goodAssessment)).toBe(true)
  })

  it('rejects a bad segment', () => {
    expect(isMatchAssessment({ ...goodAssessment, segment: 'smb' })).toBe(false)
  })

  it('rejects a missing field', () => {
    expect(isMatchAssessment({ score: 80, reasons: [], aiNative: true })).toBe(false)
  })
})

describe('assessRole', () => {
  it('parses a clean JSON response', async () => {
    const result = await assessRole(fakeClient(JSON.stringify(goodAssessment)), role)
    expect(result.score).toBe(82)
    expect(result.aiNative).toBe(true)
  })

  it('extracts JSON even when wrapped in prose / code fences', async () => {
    const wrapped = '```json\n' + JSON.stringify(goodAssessment) + '\n```'
    const result = await assessRole(fakeClient(wrapped), role)
    expect(result.segment).toBe('mid-market')
  })

  it('throws when no JSON is present', async () => {
    await expect(assessRole(fakeClient('no json here'), role)).rejects.toThrow()
  })

  it('throws when the shape is invalid', async () => {
    await expect(
      assessRole(fakeClient(JSON.stringify({ score: 'high' })), role),
    ).rejects.toThrow()
  })
})

describe('scoreRole', () => {
  it('attaches a deterministic route to the assessment', async () => {
    const result = await scoreRole(fakeClient(JSON.stringify(goodAssessment)), role)
    expect(result.route).toBe('tailor')
  })

  it('caps an enterprise role at flag', async () => {
    const ent = { ...goodAssessment, score: 95, segment: 'enterprise' }
    const result = await scoreRole(fakeClient(JSON.stringify(ent)), role)
    expect(result.route).toBe('flag')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- lib/engine/__tests__/matcher.test.ts`
Expected: FAIL with "Cannot find module '../matcher'".

- [ ] **Step 3: Write minimal implementation**

Create `lib/engine/matcher.ts`:

```typescript
import type Anthropic from '@anthropic-ai/sdk'
import { professionalContext } from '@/lib/professionalContext'
import { buildSystemPrompt } from '@/lib/buildSystemPrompt'
import { decideRoute } from './decideRoute'
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
    system: MATCH_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Company: ${role.company}\nTitle: ${role.title}\nLocation: ${role.location ?? 'n/a'}\n\nJob description:\n${role.jobDescription}`,
      },
    ],
  })
  const raw = response.content[0]?.type === 'text' ? response.content[0].text : ''
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('matcher: no JSON object in response')
  const parsed: unknown = JSON.parse(match[0])
  if (!isMatchAssessment(parsed)) throw new Error('matcher: invalid assessment shape')
  return parsed
}

/** Full matcher: assess via the LLM, then attach the deterministic route. */
export async function scoreRole(client: Anthropic, role: RoleInput): Promise<MatchResult> {
  const assessment = await assessRole(client, role)
  return { ...assessment, route: decideRoute(assessment) }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- lib/engine/__tests__/matcher.test.ts`
Expected: PASS (9 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/engine/matcher.ts lib/engine/__tests__/matcher.test.ts
git commit -m "feat: add role matcher (assess + score)"
```

---

### Task 5: Eval comparison harness

Compares matcher output to Matthew's own fit labels (his tracker scores roles 1-10). Pure logic, so it's unit-tested with synthetic data now; it gets fed real (label, MatchResult) pairs once the sourcing phase supplies job-description text. This is the "evals before we trust auto-anything" gate from the spec.

**Files:**
- Create: `lib/engine/eval/compareToLabels.ts`
- Test: `lib/engine/__tests__/compareToLabels.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/engine/__tests__/compareToLabels.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { evaluate, labelToScore } from '../eval/compareToLabels'
import type { LabeledRole } from '../eval/compareToLabels'
import type { MatchResult } from '../types'

function result(score: number): MatchResult {
  return { score, reasons: [], aiNative: true, segment: 'mid-market', route: 'tailor' }
}

const rows: LabeledRole[] = [
  { company: 'Rox', title: 'Strategic AE', label: 9, result: result(88) }, // label 90, diff 2
  { company: 'Datadog', title: 'AE', label: 7, result: result(72) }, // label 70, diff 2
  { company: 'Xometry', title: 'AE Aerospace', label: 4, result: result(75) }, // label 40, diff 35
]

describe('labelToScore', () => {
  it('maps a 1-10 label onto 0-100', () => {
    expect(labelToScore(9)).toBe(90)
    expect(labelToScore(4)).toBe(40)
  })
})

describe('evaluate', () => {
  it('counts rows', () => {
    expect(evaluate(rows).n).toBe(3)
  })

  it('computes mean absolute error', () => {
    // diffs: 2, 2, 35 → mean 13
    expect(evaluate(rows).mae).toBeCloseTo(13, 5)
  })

  it('computes agreement within tolerance', () => {
    // tolerance 15 → 2 of 3 within
    expect(evaluate(rows, 15).agreement).toBeCloseTo(2 / 3, 5)
  })

  it('lists disagreements beyond tolerance', () => {
    const report = evaluate(rows, 15)
    expect(report.disagreements).toHaveLength(1)
    expect(report.disagreements[0].company).toBe('Xometry')
    expect(report.disagreements[0].diff).toBe(35)
  })

  it('handles an empty set without dividing by zero', () => {
    const report = evaluate([])
    expect(report.n).toBe(0)
    expect(report.mae).toBe(0)
    expect(report.agreement).toBe(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- lib/engine/__tests__/compareToLabels.test.ts`
Expected: FAIL with "Cannot find module '../eval/compareToLabels'".

- [ ] **Step 3: Write minimal implementation**

Create `lib/engine/eval/compareToLabels.ts`:

```typescript
import type { MatchResult } from '../types'

export interface LabeledRole {
  company: string
  title: string
  /** Matthew's own fit label, 1-10 (from his tracker). */
  label: number
  result: MatchResult
}

export interface EvalReport {
  n: number
  /** Mean absolute error between matcher score and label, both on 0-100. */
  mae: number
  /** Share of roles where the matcher score is within `tolerance` of the label. */
  agreement: number
  /** Roles where matcher and label disagree by more than `tolerance`. */
  disagreements: Array<{
    company: string
    title: string
    labelScore: number
    matcherScore: number
    diff: number
  }>
}

/** Matthew labels 1-10; the matcher scores 0-100. Put both on 0-100. */
export function labelToScore(label: number): number {
  return Math.round(label * 10)
}

export function evaluate(rows: LabeledRole[], tolerance = 15): EvalReport {
  const diffs = rows.map((row) => {
    const labelScore = labelToScore(row.label)
    return { row, labelScore, diff: Math.abs(row.result.score - labelScore) }
  })
  const within = diffs.filter((d) => d.diff <= tolerance)
  const disagreements = diffs
    .filter((d) => d.diff > tolerance)
    .map((d) => ({
      company: d.row.company,
      title: d.row.title,
      labelScore: d.labelScore,
      matcherScore: d.row.result.score,
      diff: d.diff,
    }))
  return {
    n: rows.length,
    mae: rows.length ? diffs.reduce((s, d) => s + d.diff, 0) / rows.length : 0,
    agreement: rows.length ? within.length / rows.length : 0,
    disagreements,
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- lib/engine/__tests__/compareToLabels.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Run the full suite to confirm nothing regressed**

Run: `npm test`
Expected: all tests pass (existing + the new engine tests).

- [ ] **Step 6: Commit**

```bash
git add lib/engine/eval/compareToLabels.ts lib/engine/__tests__/compareToLabels.test.ts
git commit -m "feat: add matcher eval comparison harness"
```

---

## How the eval gets used later (not a task)

Once the sourcing phase provides real job-description text, build a small script that: (1) loads Matthew's labeled roles from `job_application_tracker_v5.html`'s `CANONICAL` array (company, title, fit), (2) runs `scoreRole` on each with a live Anthropic client, (3) feeds the `(label, MatchResult)` pairs into `evaluate()`, and (4) prints the `EvalReport`. Auto-submit (Phase 2) stays off until agreement clears an agreed bar. This script calls the real API (costs tokens, needs `ANTHROPIC_API_KEY`), so it is a manual/opt-in run, not part of `npm test`.

## Out of scope for Phase 1a (next plans)

- Relocating the repo out of `_Archive` into `~/Projects/`.
- Postgres (Neon/Supabase) schema + persistence (roles, packages, profile, events, target_companies).
- Single-user auth + `/engine/*` gating + the private match API route.
- Sourcing (active research + ATS boards + job-alert emails), the tailoring engine + lint pass, the review queue UI, and recaps.
