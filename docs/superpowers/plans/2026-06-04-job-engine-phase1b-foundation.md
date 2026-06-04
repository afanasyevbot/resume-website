# Job Engine — Phase 1b: Foundation (login + database + protected dashboard shell) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Turn the engine from a library into a real app you can log into: relocate the repo to active `~/Projects`, stand up a Neon Postgres database with the core schema, add a single-user password login that gates `/engine/*`, and ship a minimal protected dashboard page that reads from the database — proving the full stack end to end.

**Architecture:** Reuses the existing Next.js 16 App Router site. New private routes under `app/engine/*` are protected by `middleware.ts`. Auth is a single password (env var) verified server-side; on success a signed session JWT (via `jose`, Edge-compatible) is stored in an HTTP-only cookie that the middleware verifies. Data lives in Neon Postgres, accessed through `@neondatabase/serverless`. Schema changes are SQL migration files in `db/migrations/` applied to Neon.

**Tech Stack:** Next.js 16, TypeScript (strict), `@neondatabase/serverless`, `jose`, Vitest. Path alias `@/*` → repo root.

**Repo:** `~/Documents/_Archive/resume-website` initially; Task 1 relocates it to `~/Projects/resume-website`. After Task 1, run all commands from `~/Projects/resume-website`.

---

## ⚠️ CONFIRM-FIRST steps (do NOT run without Matthew's explicit go)

These touch real infrastructure / secrets / security and must pause for confirmation (per Matthew's "stop and confirm" rule):
- **Task 3:** creating the Neon database project and applying migrations (the database is "glass" — irreversible if dropped).
- **Tasks 2 & 5:** setting environment variables (`DATABASE_URL`, `ENGINE_PASSWORD`, `ENGINE_SESSION_SECRET`) locally and in Vercel.
- **Task 6:** enabling the middleware that gates `/engine/*` (a security boundary).

Everything else (code, tests) proceeds normally.

---

### Task 1: Relocate the repo to ~/Projects

**Files:** none changed — this is an operational move.

- [ ] **Step 1: Move the folder**

```bash
mv ~/Documents/_Archive/resume-website ~/Projects/resume-website
```

- [ ] **Step 2: Verify git and Vercel link survived**

```bash
git -C ~/Projects/resume-website status
git -C ~/Projects/resume-website log --oneline -1
cat ~/Projects/resume-website/.vercel/project.json
```

Expected: clean status, latest commit present, Vercel project JSON intact (git and `.vercel` travel with the folder).

- [ ] **Step 3: Verify tests still pass from the new location**

Run: `cd ~/Projects/resume-website && npm test`
Expected: 32/32 passing.

(No commit — nothing changed in git; the folder location is not tracked.)

---

### Task 2: Add dependencies + env var scaffolding

**Files:**
- Modify: `package.json` (via npm install)
- Modify: `.env.local` (gitignored — local secrets)
- Create: `.env.example` (committed — documents required vars, no values)

- [ ] **Step 1: Install the two runtime dependencies**

Run: `cd ~/Projects/resume-website && npm install @neondatabase/serverless jose`
Expected: both added to `package.json` dependencies.

- [ ] **Step 2: Create `.env.example`** (committed, documents what's needed — NO real values)

```bash
# Neon Postgres connection string (Task 3)
DATABASE_URL=
# Single password to access the private /engine dashboard (Task 5)
ENGINE_PASSWORD=
# Random 32+ char secret used to sign the session cookie (generate with: openssl rand -base64 32)
ENGINE_SESSION_SECRET=
```

- [ ] **Step 3: Add the same keys (with real values) to `.env.local`**

⚠️ CONFIRM-FIRST. `.env.local` is gitignored. `DATABASE_URL` comes from Task 3. Generate the others:
- `ENGINE_PASSWORD` — a strong password Matthew chooses.
- `ENGINE_SESSION_SECRET` — `openssl rand -base64 32`.

- [ ] **Step 4: Commit (only `.env.example` + `package.json` + lockfile — never `.env.local`)**

```bash
git add package.json package-lock.json .env.example
git commit -m "chore: add neon + jose deps and env scaffolding"
```

---

### Task 3: Provision Neon + create the schema

**Files:**
- Create: `db/migrations/0001_init.sql`

⚠️ CONFIRM-FIRST: creating the Neon project and applying migrations is irreversible. Pause for Matthew's go.

- [ ] **Step 1: Write the migration file**

Create `db/migrations/0001_init.sql`:

```sql
-- Core job-engine schema (Phase 1b)

create table if not exists roles (
  id            bigint generated always as identity primary key,
  company       text not null,
  title         text not null,
  url           text,
  location      text,
  jd_text       text,
  source        text,                       -- 'email' | 'ats' | 'research' | 'manual'
  fit_score     integer,                    -- 0-100, from the matcher
  fit_reasons   jsonb,
  segment       text,                       -- 'mid-market' | 'enterprise' | 'unknown'
  ai_native     boolean,
  route         text,                       -- 'tailor' | 'flag' | 'discard'
  status        text not null default 'sourced',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists application_packages (
  id            bigint generated always as identity primary key,
  role_id       bigint not null references roles(id) on delete cascade,
  resume_path   text,
  cover_letter  text,
  outreach_draft text,
  status        text not null default 'draft',
  created_at    timestamptz not null default now()
);

create table if not exists events (
  id            bigint generated always as identity primary key,
  role_id       bigint references roles(id) on delete set null,
  kind          text not null,              -- e.g. 'sourced','scored','tailored','queued','applied'
  detail        jsonb,
  created_at    timestamptz not null default now()
);

create index if not exists roles_status_idx on roles(status);
create index if not exists roles_company_idx on roles(company);
```

- [ ] **Step 2: Create the Neon project** (CONFIRM-FIRST)

Use the Neon MCP `create_project` (name e.g. `job-engine`). Capture the connection string via `get_connection_string` and put it in `.env.local` as `DATABASE_URL`.

- [ ] **Step 3: Apply the migration** (CONFIRM-FIRST)

Run the contents of `db/migrations/0001_init.sql` against the new Neon project (Neon MCP `run_sql`). Verify the three tables exist with `get_database_tables`.

- [ ] **Step 4: Commit the migration file**

```bash
git add db/migrations/0001_init.sql
git commit -m "feat: add initial job-engine database schema"
```

---

### Task 4: Session auth helpers (signed cookie)

The password is checked server-side (Node); a signed JWT session is verified in middleware (Edge). Uses `jose` rather than hand-rolled crypto.

**Files:**
- Create: `lib/engine/auth.ts`
- Test: `lib/engine/__tests__/auth.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/engine/__tests__/auth.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { createSessionToken, verifySessionToken, SESSION_COOKIE } from '../auth'

beforeEach(() => {
  process.env.ENGINE_SESSION_SECRET = 'test-secret-at-least-32-chars-long-xx'
})

describe('session tokens', () => {
  it('exposes a cookie name', () => {
    expect(SESSION_COOKIE).toBe('engine_session')
  })

  it('creates a token that verifies as valid', async () => {
    const token = await createSessionToken()
    expect(await verifySessionToken(token)).toBe(true)
  })

  it('rejects a tampered token', async () => {
    const token = await createSessionToken()
    expect(await verifySessionToken(token + 'x')).toBe(false)
  })

  it('rejects a token signed with a different secret', async () => {
    const token = await createSessionToken()
    process.env.ENGINE_SESSION_SECRET = 'a-completely-different-secret-value-yy'
    expect(await verifySessionToken(token)).toBe(false)
  })

  it('rejects garbage', async () => {
    expect(await verifySessionToken('not-a-jwt')).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- lib/engine/__tests__/auth.test.ts`
Expected: FAIL ("Cannot find module '../auth'").

- [ ] **Step 3: Write minimal implementation**

Create `lib/engine/auth.ts`:

```typescript
import { SignJWT, jwtVerify } from 'jose'

export const SESSION_COOKIE = 'engine_session'
const ALG = 'HS256'
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7 // 7 days

function secretKey(): Uint8Array {
  const secret = process.env.ENGINE_SESSION_SECRET
  if (!secret) throw new Error('ENGINE_SESSION_SECRET is not set')
  return new TextEncoder().encode(secret)
}

/** Sign a session token. Call after a successful password check. */
export async function createSessionToken(): Promise<string> {
  return new SignJWT({ sub: 'matthew' })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secretKey())
}

/** Verify a session token (signature + expiry). Edge-safe. */
export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false
  try {
    await jwtVerify(token, secretKey(), { algorithms: [ALG] })
    return true
  } catch {
    return false
  }
}

export const SESSION_MAX_AGE = MAX_AGE_SECONDS
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- lib/engine/__tests__/auth.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/engine/auth.ts lib/engine/__tests__/auth.test.ts
git commit -m "feat: add signed session-token helpers for engine auth"
```

---

### Task 5: Login + logout routes and login page

**Files:**
- Create: `app/api/engine/login/route.ts`
- Create: `app/api/engine/logout/route.ts`
- Create: `app/engine/login/page.tsx`

- [ ] **Step 1: Login route** (Node runtime — does the password check)

Create `app/api/engine/login/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { timingSafeEqual } from 'node:crypto'
import { createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE } from '@/lib/engine/auth'

function passwordMatches(input: string): boolean {
  const expected = process.env.ENGINE_PASSWORD ?? ''
  const a = Buffer.from(input)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  if (!body || typeof body.password !== 'string' || !passwordMatches(body.password)) {
    return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
  }
  const token = await createSessionToken()
  const res = NextResponse.json({ ok: true })
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  })
  return res
}
```

- [ ] **Step 2: Logout route**

Create `app/api/engine/logout/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { SESSION_COOKIE } from '@/lib/engine/auth'

export async function POST() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(SESSION_COOKIE, '', { path: '/', maxAge: 0 })
  return res
}
```

- [ ] **Step 3: Login page** (client component)

Create `app/engine/login/page.tsx`:

```tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function EngineLogin() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/engine/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    setLoading(false)
    if (res.ok) router.push('/engine')
    else setError('Incorrect password')
  }

  return (
    <main style={{ maxWidth: 360, margin: '4rem auto', padding: '0 1rem' }}>
      <h1>Engine login</h1>
      <form onSubmit={submit}>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoFocus
          style={{ width: '100%', padding: 8, marginTop: 12 }}
        />
        <button type="submit" disabled={loading} style={{ marginTop: 12, padding: 8 }}>
          {loading ? 'Checking…' : 'Log in'}
        </button>
      </form>
      {error && <p style={{ color: 'crimson', marginTop: 12 }}>{error}</p>}
    </main>
  )
}
```

- [ ] **Step 4: Verify manually** (CONFIRM-FIRST on env vars)

With `ENGINE_PASSWORD` and `ENGINE_SESSION_SECRET` set in `.env.local`, run `npm run dev`, visit `/engine/login`, confirm: wrong password → "Incorrect password"; correct password → redirect to `/engine` and an `engine_session` cookie is set (DevTools → Application → Cookies).

- [ ] **Step 5: Commit**

```bash
git add app/api/engine/login/route.ts app/api/engine/logout/route.ts app/engine/login/page.tsx
git commit -m "feat: add engine password login + logout"
```

---

### Task 6: Middleware gate for /engine/*

⚠️ CONFIRM-FIRST: this turns on the security boundary.

**Files:**
- Create: `middleware.ts` (repo root)

- [ ] **Step 1: Write the middleware**

Create `middleware.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { verifySessionToken, SESSION_COOKIE } from '@/lib/engine/auth'

export async function middleware(req: NextRequest) {
  // Allow the login page and its API through unauthenticated.
  const { pathname } = req.nextUrl
  if (pathname === '/engine/login' || pathname.startsWith('/api/engine/login')) {
    return NextResponse.next()
  }
  const token = req.cookies.get(SESSION_COOKIE)?.value
  if (await verifySessionToken(token)) return NextResponse.next()

  const loginUrl = req.nextUrl.clone()
  loginUrl.pathname = '/engine/login'
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/engine/:path*', '/api/engine/:path*'],
}
```

- [ ] **Step 2: Verify manually**

Run `npm run dev`. Visit `/engine` without logging in → redirected to `/engine/login`. Log in → reach `/engine`. Confirm the public `/` resume page is still reachable without login.

- [ ] **Step 3: Commit**

```bash
git add middleware.ts
git commit -m "feat: gate /engine routes behind session auth"
```

---

### Task 7: Minimal protected dashboard shell

Proves the full stack: login → protected page → live DB query.

**Files:**
- Create: `lib/engine/db.ts`
- Create: `lib/engine/roles.ts`
- Create: `app/engine/page.tsx`

- [ ] **Step 1: DB client**

Create `lib/engine/db.ts`:

```typescript
import { neon } from '@neondatabase/serverless'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set')
}

export const sql = neon(process.env.DATABASE_URL)
```

- [ ] **Step 2: Roles query helper**

Create `lib/engine/roles.ts`:

```typescript
import { sql } from './db'

export interface RoleRow {
  id: number
  company: string
  title: string
  fit_score: number | null
  route: string | null
  status: string
  created_at: string
}

/** Most recent roles for the dashboard. */
export async function listRoles(limit = 50): Promise<RoleRow[]> {
  const rows = await sql`
    select id, company, title, fit_score, route, status, created_at
    from roles
    order by created_at desc
    limit ${limit}
  `
  return rows as RoleRow[]
}
```

- [ ] **Step 3: Dashboard page** (server component, behind middleware)

Create `app/engine/page.tsx`:

```tsx
import { listRoles } from '@/lib/engine/roles'

export const dynamic = 'force-dynamic'

export default async function EngineDashboard() {
  const roles = await listRoles()
  return (
    <main style={{ maxWidth: 960, margin: '2rem auto', padding: '0 1rem' }}>
      <h1>Job Engine</h1>
      <p>{roles.length} role{roles.length === 1 ? '' : 's'} in the pipeline.</p>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 16 }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left' }}>Company</th>
            <th style={{ textAlign: 'left' }}>Role</th>
            <th>Fit</th>
            <th>Route</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {roles.map((r) => (
            <tr key={r.id}>
              <td>{r.company}</td>
              <td>{r.title}</td>
              <td style={{ textAlign: 'center' }}>{r.fit_score ?? '—'}</td>
              <td style={{ textAlign: 'center' }}>{r.route ?? '—'}</td>
              <td style={{ textAlign: 'center' }}>{r.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {roles.length === 0 && <p style={{ marginTop: 16, opacity: 0.7 }}>No roles yet — sourcing comes in the next slice.</p>}
    </main>
  )
}
```

- [ ] **Step 4: Verify manually**

Run `npm run dev`, log in, visit `/engine`. Expected: page loads (no crash), shows "0 roles in the pipeline" and the empty-state message — confirming the page can query Neon. Optionally insert one test row via the Neon MCP and confirm it appears.

- [ ] **Step 5: Commit**

```bash
git add lib/engine/db.ts lib/engine/roles.ts app/engine/page.tsx
git commit -m "feat: add protected engine dashboard shell reading from Neon"
```

---

## Definition of done (Phase 1b)

- Repo lives in `~/Projects/resume-website`.
- Neon database exists with `roles`, `application_packages`, `events`.
- Visiting `/engine` while logged out redirects to `/engine/login`; the public `/` resume page is unaffected.
- Logging in with the correct password reaches `/engine`, which renders live data from Neon (empty state to start).
- `npm test` passes (existing 32 + 5 new auth tests = 37).

## Out of scope (next plans)

- Sourcing (job-alert emails + active research + ATS boards), wiring the matcher into a `/api/engine/match` route, tailoring + lint pass, the one-click review queue, recaps, and the live eval run.
- Vercel↔GitHub auto-deploy connection and setting production env vars in Vercel (operational, do when ready to deploy).
