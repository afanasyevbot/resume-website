# System Wiring Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 7 confirmed correctness/security bugs found during a full system wiring review.

**Architecture:** All fixes are surgical — one or two lines each, touching exactly the broken path. No abstractions introduced. No tests exist in this codebase for these paths, so each task includes a manual verification step.

**Tech Stack:** Next.js 16 App Router, TypeScript, Neon PostgreSQL (tagged-template SQL), Slack Web API, jose JWT.

---

## Files touched

| File | Change |
|------|--------|
| `lib/engine/dashboard.ts` | Fix `getCounts` in_queue + revert `getDeltas` to no-JOIN |
| `app/api/engine/auto-apply/route.ts` | Add session auth to POST handler |
| `lib/engine/slack/client.ts` | Remove `'#job-engine'` channel fallback, guard channel ID |
| `app/api/engine/slack/events/route.ts` | Scope pending-question match to thread_ts |
| `lib/engine/submitRole.ts` | Hard-error on empty BROWSER_SERVICE_SECRET |
| `lib/engine/costGuard.ts` | Export `capCents()` |
| `lib/engine/slack/ask.ts` | Use `capCents()` instead of hard-coded 2500 |

---

### Task 1: Fix getCounts in_queue + revert getDeltas

**Problem A:** `getCounts` counts `in_queue` as `status IN ('scored','tailored','queued')` but `statusView.ts` ACTIVE set also includes `'needs_review'` and `'awaiting_approval'`. Roles in those states show in the Active tab but the KPI tile shows 0.

**Problem B:** `getDeltas` uses an INNER JOIN with `WHERE r.status NOT IN ('discarded','archived')`. This means events for roles that were applied to and later discarded are silently excluded from the 7-day applied delta. The simpler, semantically correct query has no JOIN — it counts events unconditionally (test-run events were already cleaned from the DB).

**Files:**
- Modify: `lib/engine/dashboard.ts:61` (in_queue filter)
- Modify: `lib/engine/dashboard.ts:85-98` (getDeltas query)

- [ ] **Step 1: Fix getCounts in_queue filter**

In `lib/engine/dashboard.ts`, change line 61 from:
```typescript
      count(*) filter (where route = 'tailor' and status in ('scored','tailored','queued')) as in_queue,
```
to:
```typescript
      count(*) filter (where route = 'tailor' and status in ('scored','tailored','queued','needs_review','awaiting_approval')) as in_queue,
```

- [ ] **Step 2: Revert getDeltas to simple no-JOIN query**

Replace the entire `getDeltas` function body with the original simple form:

```typescript
export async function getDeltas(): Promise<KpiDeltas> {
  const r = await sql`
    select
      count(*) filter (where kind = 'sourced' and created_at > now() - interval '7 days') as sourced_7d,
      count(*) filter (where kind = 'applied' and created_at > now() - interval '7 days') as applied_7d,
      count(*) filter (where kind = 'responded' and created_at > now() - interval '7 days') as responded_7d
    from events
  `
  const row = r[0] as Record<string, string | number>
  return {
    sourced7d: Number(row.sourced_7d ?? 0),
    applied7d: Number(row.applied_7d ?? 0),
    responded7d: Number(row.responded_7d ?? 0),
  }
}
```

- [ ] **Step 3: Verify (manual)**

Load the dashboard. If any roles have status `needs_review` or `awaiting_approval`, the "In queue" KPI tile should now count them. The Active queue tab count and the KPI tile value should match.

- [ ] **Step 4: Commit**

```bash
git add lib/engine/dashboard.ts
git commit -m "fix(dashboard): include needs_review/awaiting_approval in in_queue count; simplify getDeltas"
```

---

### Task 2: Add session auth to POST /auto-apply

**Problem:** The POST handler (dashboard "🚀 Auto-Apply" button) has zero authentication. The GET handler (cron) correctly checks `CRON_SECRET`. The POST should verify the session cookie — anyone who can POST to the URL can trigger real job submissions.

**Files:**
- Modify: `app/api/engine/auto-apply/route.ts:192`

- [ ] **Step 1: Add imports at the top of the file**

The file already imports from `next/server`. Add the auth imports. At the top of `app/api/engine/auto-apply/route.ts`, add to the import block:

```typescript
import { cookies } from 'next/headers'
import { verifySessionToken, SESSION_COOKIE } from '@/lib/engine/auth'
```

- [ ] **Step 2: Add auth check as the first thing in the POST handler**

Replace the existing `export async function POST(req: Request) {` block's opening:

```typescript
export async function POST(req: Request) {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!(await verifySessionToken(token))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const body = (await req.json().catch(() => ({}))) as {
```

The rest of the POST handler is unchanged.

- [ ] **Step 3: Verify (manual)**

Open the dashboard while logged in — the Auto-Apply button should still work. Open a fresh incognito window (no session cookie) and POST to `/api/engine/auto-apply` with `curl -X POST https://matthew-afanasiev.vercel.app/api/engine/auto-apply -H 'Content-Type: application/json' -d '{}'` — expect `{"error":"unauthorized"}` with status 401.

- [ ] **Step 4: Commit**

```bash
git add app/api/engine/auto-apply/route.ts
git commit -m "fix(security): require session auth on POST /api/engine/auto-apply"
```

---

### Task 3: Remove '#job-engine' channel name fallback

**Problem:** `lib/engine/slack/client.ts` line 7: `export const SLACK_CHANNEL = process.env.SLACK_CHANNEL_ID || '#job-engine'`. Slack's `chat.postMessage` API requires a channel ID (e.g. `C01ABC123`), not a channel name. When `SLACK_CHANNEL_ID` is unset, every notification silently fails — `{ ok: false }` — with no log.

**Fix:** If `SLACK_CHANNEL_ID` is unset, return `{ ok: false }` early just like the missing-token guard. Channel name as fallback is dead code.

**Files:**
- Modify: `lib/engine/slack/client.ts:7`

- [ ] **Step 1: Replace the SLACK_CHANNEL constant and add a channel guard**

Replace the top of `lib/engine/slack/client.ts`:

```typescript
const BOT_TOKEN = process.env.SLACK_BOT_TOKEN
const SLACK_CHANNEL_ID = process.env.SLACK_CHANNEL_ID
```

Then in `postSlackMessage`, the early-return guard becomes:

```typescript
export async function postSlackMessage(text: string, blocks?: unknown[], channel = SLACK_CHANNEL_ID): Promise<PostResult> {
  if (!BOT_TOKEN || !channel) return { ok: false }
```

Remove the old `export const SLACK_CHANNEL = ...` line entirely. Any callers that import `SLACK_CHANNEL` by name need to be updated.

- [ ] **Step 2: Check for callers importing SLACK_CHANNEL**

```bash
grep -rn "SLACK_CHANNEL[^_]" /Users/matthewafanasiev/Projects/resume-website --include="*.ts" --include="*.tsx" | grep -v node_modules
```

Update any import that uses the old `SLACK_CHANNEL` export. (If none exist, skip.)

- [ ] **Step 3: Verify (manual)**

Confirm the Slack integration still works: trigger a test from the dashboard and check that a message arrives in `#job-engine`. If `SLACK_CHANNEL_ID` is correctly set in Vercel env, this is a no-op change in production.

- [ ] **Step 4: Commit**

```bash
git add lib/engine/slack/client.ts
git commit -m "fix(slack): remove channel-name fallback — chat.postMessage requires a channel ID"
```

---

### Task 4: Scope Slack pending-question answers to thread

**Problem:** `app/api/engine/slack/events/route.ts` line 56 selects `ORDER BY created_at DESC LIMIT 1` — it grabs the newest pending question globally. If two roles are simultaneously awaiting answers, a reply to one answers the other.

**Fix:** When Matthew replies in a thread (`event.thread_ts` present), match the pending question by `message_ts = event.thread_ts`. If he replies at the top level (no thread), use the existing most-recent behavior as a fallback. The `message_ts` is already stored in `slack_pending` when the question is posted.

**Files:**
- Modify: `app/api/engine/slack/events/route.ts:32-68`

- [ ] **Step 1: Add thread_ts to the event type**

In `app/api/engine/slack/events/route.ts`, update the `body` type declaration to include `thread_ts`:

```typescript
  let body: {
    type?: string
    challenge?: string
    event?: { type?: string; text?: string; channel?: string; bot_id?: string; subtype?: string; user?: string; thread_ts?: string }
  }
```

- [ ] **Step 2: Replace the pending-question lookup query**

Replace the SQL block starting at line 56:

```typescript
    const threadTs = e!.thread_ts
    const openQ = await sql`
      select id, role_id, question from slack_pending
      where kind = 'question' and status = 'pending'
        and (${threadTs ?? null}::text is null or message_ts = ${threadTs ?? null})
      order by created_at desc limit 1
    `
```

What this does: when `threadTs` is present, the `message_ts = threadTs` filter applies and only matches the specific question Matthew is replying to. When `threadTs` is null/absent (top-level message), the filter is `null is null` (always true) and falls back to most-recent — preserving existing behavior for non-threaded replies.

- [ ] **Step 3: Verify (manual)**

In Slack, reply in-thread to a specific question message — the right role should receive the answer and attempt resubmission. A top-level message should still answer the most recent pending question as before.

- [ ] **Step 4: Commit**

```bash
git add app/api/engine/slack/events/route.ts
git commit -m "fix(slack): scope pending-question answer to thread_ts when present"
```

---

### Task 5: Guard BROWSER_SERVICE_SECRET + fix hardcoded spend cap

Two small env-var fixes bundled since they're both "silent failure when env var is wrong."

**Problem A:** `lib/engine/submitRole.ts` line 11: `const BROWSER_SECRET = process.env.BROWSER_SERVICE_SECRET ?? ''`. An empty string is passed as a Bearer token — silent auth failure or bypass.

**Problem B:** `lib/engine/slack/ask.ts` line 41: `2500 as cap_cents` hard-coded. If `MONTHLY_CAP_CENTS` is set to a different value, the Slack `?budget` report shows the wrong cap while `costGuard.ts` enforces the right one.

**Files:**
- Modify: `lib/engine/submitRole.ts:11`
- Modify: `lib/engine/costGuard.ts` — export `capCents()`
- Modify: `lib/engine/slack/ask.ts:41`

- [ ] **Step 1: Guard BROWSER_SERVICE_SECRET in submitRole.ts**

Replace lines 10-11 in `lib/engine/submitRole.ts`:

```typescript
const BROWSER_URL = process.env.BROWSER_SERVICE_URL ?? 'http://localhost:4100'

function getBrowserSecret(): string {
  const s = process.env.BROWSER_SERVICE_SECRET
  if (!s) throw new Error('BROWSER_SERVICE_SECRET is not set')
  return s
}
```

Then find the one place `BROWSER_SECRET` is used in the file (in the fetch call to the browser service) and replace it with `getBrowserSecret()`. Search for:
```typescript
Authorization: `Bearer ${BROWSER_SECRET}`
```
Replace with:
```typescript
Authorization: `Bearer ${getBrowserSecret()}`
```

This makes the missing-env-var error explicit at call time rather than sending an empty Bearer token.

- [ ] **Step 2: Export capCents from costGuard.ts**

In `lib/engine/costGuard.ts`, change:

```typescript
function capCents(): number {
```

to:

```typescript
export function capCents(): number {
```

- [ ] **Step 3: Use capCents() in the snapshot query in ask.ts**

In `lib/engine/slack/ask.ts`, add the import at the top:

```typescript
import { capCents } from '@/lib/engine/costGuard'
```

Then in `fetchSnapshot()`, replace the spend query:

```typescript
    sql`select
          coalesce(sum(cost_cents),0)::int as month_cents,
          ${capCents()} as cap_cents
        from api_usage
        where created_at >= date_trunc('month', now())`,
```

- [ ] **Step 4: Verify (manual)**

Ask the Slack bot `?budget` — the cap shown in the reply should match whatever `MONTHLY_CAP_CENTS` is set to in Vercel (or $25 if unset). For the browser secret: if `BROWSER_SERVICE_SECRET` is correctly set in Vercel, auto-apply continues to work. If ever missing, the error log will say `BROWSER_SERVICE_SECRET is not set` instead of a silent 401.

- [ ] **Step 5: Commit**

```bash
git add lib/engine/submitRole.ts lib/engine/costGuard.ts lib/engine/slack/ask.ts
git commit -m "fix(engine): guard BROWSER_SERVICE_SECRET, read cap from env in Slack spend report"
```

---

## Final step: PR

```bash
git push -u origin fix/system-wiring
gh pr create \
  --title "fix(system): 7 wiring bugs — auth, Slack match, in_queue count, env guards" \
  --body "Fixes 7 confirmed bugs from a full system wiring review:

- POST /auto-apply now requires session auth (was wide open)
- Slack question answers scoped to thread_ts when present
- getCounts in_queue now includes needs_review + awaiting_approval
- getDeltas reverted to no-JOIN (semantically correct; test data already cleaned)
- SLACK_CHANNEL_ID fallback '#job-engine' removed (was causing silent Slack failures)
- BROWSER_SERVICE_SECRET now throws if unset instead of sending empty Bearer
- Slack spend report reads cap from MONTHLY_CAP_CENTS env var instead of hardcoded 2500"
```
