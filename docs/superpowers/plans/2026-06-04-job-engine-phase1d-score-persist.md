# Job Engine — Phase 1d: Score & Persist Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Checkbox tasks.

**Goal:** Wire the matcher (`lib/engine/matcher.ts`) into a real, persisted API. Add the first way to feed roles in: a "drop in a JD" form on the dashboard. End-to-end loop: paste JD → score in Claude → save to Neon → refresh → see it in the queue with a fit score.

**Architecture:** A single new server route `POST /api/engine/score` validates input, calls `scoreRole()` with a real Anthropic client (with **prompt caching enabled** to amortize the ~5k-token profile prompt), persists via a new pure helper `persistScoredRole()`, and writes lifecycle events. A client-side `<AddRoleForm/>` posts to it and `router.refresh()`'s the dashboard.

**Repo:** `~/Projects/resume-website`, branch `feat/job-application-engine`.

---

### Task 1: Enable prompt caching on the matcher

Anthropic's prompt cache lets us mark the long, identical system prompt as cacheable. Saves ~70% of input tokens after the first call, cuts per-score cost meaningfully.

**Files:**
- Modify: `lib/engine/matcher.ts` — change `system:` from a string to an array with `cache_control`.

Replace:
```ts
system: MATCH_SYSTEM_PROMPT,
```
with:
```ts
system: [
  {
    type: 'text',
    text: MATCH_SYSTEM_PROMPT,
    cache_control: { type: 'ephemeral' },
  },
],
```

Verify `npm test` (existing matcher tests should still pass — the fake client ignores the system param shape).

Commit: `perf(engine): enable prompt caching on matcher system prompt`.

---

### Task 2: Persistence helper

**Files:**
- Create: `lib/engine/persistRole.ts`
- Test: `lib/engine/__tests__/persistRole.test.ts`

```ts
// lib/engine/persistRole.ts
import { sql } from './db'
import type { MatchResult } from './types'

export interface PersistableRole {
  company: string
  title: string
  jobDescription: string
  url?: string | null
  location?: string | null
  source?: string | null   // 'manual' | 'ats' | 'email' | 'research'
}

export interface PersistedRole {
  id: number
  status: string
}

/** Insert a scored role + its sourced/scored lifecycle events in one transaction.
 *  Returns the new role id and the resolved status. Pure of HTTP concerns. */
export async function persistScoredRole(
  role: PersistableRole,
  result: MatchResult,
): Promise<PersistedRole> {
  // Status from route — keep it simple, the tailoring slice will add 'tailored'.
  const status = result.route === 'discard' ? 'discarded' : 'scored'
  const source = role.source ?? 'manual'

  const rows = await sql`
    insert into roles
      (company, title, url, location, jd_text, source, fit_score, fit_reasons, segment, ai_native, route, status)
    values
      (${role.company}, ${role.title}, ${role.url ?? null}, ${role.location ?? null},
       ${role.jobDescription}, ${source}, ${result.score},
       ${JSON.stringify(result.reasons)}::jsonb, ${result.segment}, ${result.aiNative},
       ${result.route}, ${status})
    returning id
  `
  const id = Number((rows[0] as { id: number }).id)

  // Two events: sourced + scored
  await sql`
    insert into events (role_id, kind, detail) values
      (${id}, 'sourced', ${JSON.stringify({ source })}::jsonb),
      (${id}, 'scored',  ${JSON.stringify({ score: result.score, route: result.route })}::jsonb)
  `

  return { id, status }
}
```

Tests: pure-logic only (don't mock sql; just test that the `status` derivation behaves). Move the status derivation into an exported pure fn `statusFromRoute(route: RouteDecision): string` and unit-test that.

Commit: `feat(engine): persistScoredRole helper`.

---

### Task 3: Score API route

**Files:**
- Create: `app/api/engine/score/route.ts`

```ts
import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'
import { scoreRole } from '@/lib/engine/matcher'
import { persistScoredRole } from '@/lib/engine/persistRole'
import type { PersistableRole } from '@/lib/engine/persistRole'

export const runtime = 'nodejs' // Anthropic SDK needs Node

function validate(body: unknown): PersistableRole | { error: string } {
  if (!body || typeof body !== 'object') return { error: 'Body required' }
  const b = body as Record<string, unknown>
  if (typeof b.company !== 'string' || !b.company.trim()) return { error: 'company required' }
  if (typeof b.title !== 'string' || !b.title.trim()) return { error: 'title required' }
  if (typeof b.jobDescription !== 'string' || b.jobDescription.trim().length < 30) {
    return { error: 'jobDescription required (min 30 chars)' }
  }
  if (b.jobDescription.length > 20_000) return { error: 'jobDescription too long' }
  return {
    company: b.company.trim(),
    title: b.title.trim(),
    jobDescription: b.jobDescription,
    url: typeof b.url === 'string' && b.url.trim() ? b.url.trim() : null,
    location: typeof b.location === 'string' && b.location.trim() ? b.location.trim() : null,
    source: typeof b.source === 'string' && b.source.trim() ? b.source.trim() : 'manual',
  }
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  const v = validate(body)
  if ('error' in v) return NextResponse.json({ error: v.error }, { status: 400 })

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  try {
    const result = await scoreRole(client, v)
    const persisted = await persistScoredRole(v, result)
    return NextResponse.json({ id: persisted.id, status: persisted.status, result })
  } catch (err) {
    console.error('engine/score error:', err)
    return NextResponse.json({ error: 'Scoring failed' }, { status: 502 })
  }
}
```

The middleware (`middleware.ts`) already gates `/api/engine/*` behind auth, so no extra check needed.

Commit: `feat(engine): POST /api/engine/score`.

---

### Task 4: Broaden the "In queue" count

`lib/engine/dashboard.ts`'s `getCounts()` currently has:
```
count(*) filter (where route = 'tailor' and status in ('tailored','queued')) as in_queue
```
Until the tailoring slice ships, scored roles are the only thing actionable. Change to:
```
count(*) filter (where route = 'tailor' and status in ('scored','tailored','queued')) as in_queue
```

Commit: `fix(engine): include 'scored' in In-queue tile`.

---

### Task 5: AddRoleForm UI

**Files:**
- Create: `components/engine/AddRoleForm.tsx` (client)

A button at the top-right of the role queue header that toggles a small inline form (no modal lib — slide-down panel within the queue card). Fields:
- Company (required)
- Title (required)
- Location (optional)
- URL (optional)
- Source (select: Manual / ATS / Email / Research, defaults Manual)
- Job description (textarea, required, min 30 chars, max ~20000)
- Submit → POST `/api/engine/score` → on success, clear + close + `router.refresh()` → on error, inline message.

Loading state: button says "Scoring…" disabled. Show optimistic "Scoring with Claude…" while waiting (matcher takes ~3–8s).

Visual: match the `vellum` treatment of the surrounding card. Use existing CSS variables. Inputs in `bg-[var(--color-surface-deep)]` with `border-[var(--color-border-inner)]`. Submit button in gold.

Wire it into `components/engine/RoleQueueTable.tsx`'s header row (where it currently shows "X roles"). Render the form below the header when toggled open. The empty-state copy should change to "Add your first role with the button above."

Commit: `feat(engine): paste-a-JD form to score and persist new roles`.

---

### Task 6: Verify end-to-end

1. `npm test` — all existing + new tests pass.
2. `npx tsc --noEmit` — clean.
3. `npm run build` — clean.
4. Manual: `npm run dev`, log in, open "Add role," paste a real JD (e.g., from a Greenhouse listing), submit. Expect: ~5s wait, form closes, queue refreshes, new role appears with a fit score that matches the JD's actual fit.
5. Live API verification with curl (logged-in cookie reused):
   ```bash
   curl -b /tmp/engine-cookies.txt -X POST http://localhost:3000/api/engine/score \
     -H 'Content-Type: application/json' \
     -d '{"company":"Test","title":"AE","jobDescription":"... 30+ chars ..."}'
   ```

Commit on success: handled per-task above. Push the branch.

## Out of scope (next slices)

- Tailoring engine + lint pass
- ATS / email / research auto-sourcing
- Per-role drilldown page
- One-click submit
- Eval run against labeled tracker data
