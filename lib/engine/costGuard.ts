import { sql } from './db'

/**
 * Hard monthly spend cap in CENTS. $25.00 = 2500 cents.
 * When month-to-date spend reaches this, all Claude calls are blocked.
 *
 * Override via MONTHLY_CAP_CENTS env var if needed.
 */
const DEFAULT_CAP_CENTS = 2500

export function capCents(): number {
  const env = process.env.MONTHLY_CAP_CENTS
  if (env) {
    const n = Number(env)
    if (!Number.isNaN(n) && n > 0) return n
  }
  return DEFAULT_CAP_CENTS
}

// ── Sonnet 4.6 pricing (as of June 2026), in cents/token ──────────────
// Anthropic returns FOUR DISJOINT token counts — they do not overlap, so the
// cost is their straight sum, never a subtraction. (The old model subtracted
// cache_read from input_tokens, but input_tokens is ALREADY the uncached count,
// and it never captured cache-WRITE tokens at all — so it under-reported spend,
// quietly weakening the $25 cap that is the only autonomous-spend backstop.)
//   input (uncached):  $3.00 / 1M  → 0.0003   cents/token
//   output:            $15.00 / 1M → 0.0015   cents/token
//   cache read:        $0.30 / 1M  → 0.00003  cents/token  (0.1× input)
//   cache write (5m):  $3.75 / 1M  → 0.000375 cents/token  (1.25× input)
const INPUT_COST_PER_TOKEN = 0.0003
const OUTPUT_COST_PER_TOKEN = 0.0015
const CACHE_READ_COST_PER_TOKEN = 0.00003
const CACHE_WRITE_COST_PER_TOKEN = 0.000375

export interface TokenUsage {
  /** Fresh, uncached input (Anthropic `input_tokens` — already excludes cache). */
  inputTokens: number
  outputTokens: number
  /** `cache_read_input_tokens` — read from the prompt cache. */
  cacheReadTokens: number
  /** `cache_creation_input_tokens` — written to the prompt cache (billed 1.25×). */
  cacheCreationTokens: number
}

export function estimateCostCents(u: TokenUsage): number {
  return (
    u.inputTokens * INPUT_COST_PER_TOKEN +
    u.cacheReadTokens * CACHE_READ_COST_PER_TOKEN +
    u.cacheCreationTokens * CACHE_WRITE_COST_PER_TOKEN +
    u.outputTokens * OUTPUT_COST_PER_TOKEN
  )
}

/** Month-to-date spend in cents. */
export async function monthToDateCents(): Promise<number> {
  const rows = await sql`
    select coalesce(sum(cost_cents), 0) as total
    from api_usage
    where created_at >= date_trunc('month', now())
  `
  return Number((rows[0] as { total: string | number }).total)
}

/** Returns true if there's budget left this month; false if the cap is hit.
 *  In environments without a DATABASE_URL (tests, build), always returns true
 *  so the guard doesn't block pure-function tests. */
export async function hasBudget(): Promise<boolean> {
  if (!process.env.DATABASE_URL) return true
  try {
    const spent = await monthToDateCents()
    return spent < capCents()
  } catch (err) {
    // Can't verify spend (DB hiccup). In production, fail CLOSED — never spend
    // blind against an unknown balance. In dev/test, fail open so a missing DB
    // doesn't block local work.
    if (process.env.NODE_ENV === 'production') {
      console.error('hasBudget: spend check failed, blocking Claude calls:', err)
      return false
    }
    return true
  }
}

export interface UsageRecord {
  kind: string
  model: string
  inputTokens: number
  outputTokens: number
  cacheReadTokens: number
  cacheCreationTokens: number
  roleId?: number | null
}

/** Log a Claude call's token usage and cost. Call AFTER a successful API response.
 *  No-ops without DATABASE_URL (test/build environments). */
export async function logUsage(rec: UsageRecord): Promise<void> {
  if (!process.env.DATABASE_URL) return
  const cost = estimateCostCents(rec)
  await sql`
    insert into api_usage (kind, model, input_tokens, output_tokens, cached_tokens, cache_creation_tokens, cost_cents, role_id)
    values (${rec.kind}, ${rec.model}, ${rec.inputTokens}, ${rec.outputTokens}, ${rec.cacheReadTokens}, ${rec.cacheCreationTokens}, ${cost}, ${rec.roleId ?? null})
  `
}

/** Human-readable spend summary for the dashboard / API. */
export async function spendSummary(): Promise<{
  monthCents: number
  capCents: number
  remainingCents: number
  percentUsed: number
}> {
  const spent = await monthToDateCents()
  const cap = capCents()
  return {
    monthCents: Math.round(spent * 100) / 100,
    capCents: cap,
    remainingCents: Math.round(Math.max(0, cap - spent) * 100) / 100,
    percentUsed: cap > 0 ? Math.round((spent / cap) * 10000) / 100 : 0,
  }
}
