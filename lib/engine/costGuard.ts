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

// ── Sonnet 4.6 pricing (as of June 2026) ──────────────────────────────
// Input:  $3.00 / 1M tokens  → 0.0003 cents/token
// Output: $15.00 / 1M tokens → 0.0015 cents/token
// Cached input: $0.30 / 1M   → 0.00003 cents/token
// We store cost in cents for precision without floating-point drift.
const INPUT_COST_PER_TOKEN = 0.0003    // cents
const OUTPUT_COST_PER_TOKEN = 0.0015   // cents
const CACHED_COST_PER_TOKEN = 0.00003  // cents

export function estimateCostCents(
  inputTokens: number,
  outputTokens: number,
  cachedTokens: number,
): number {
  const uncachedInput = Math.max(0, inputTokens - cachedTokens)
  return (
    uncachedInput * INPUT_COST_PER_TOKEN +
    cachedTokens * CACHED_COST_PER_TOKEN +
    outputTokens * OUTPUT_COST_PER_TOKEN
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
  const spent = await monthToDateCents()
  return spent < capCents()
}

export interface UsageRecord {
  kind: string
  model: string
  inputTokens: number
  outputTokens: number
  cachedTokens: number
  roleId?: number | null
}

/** Log a Claude call's token usage and cost. Call AFTER a successful API response.
 *  No-ops without DATABASE_URL (test/build environments). */
export async function logUsage(rec: UsageRecord): Promise<void> {
  if (!process.env.DATABASE_URL) return
  const cost = estimateCostCents(rec.inputTokens, rec.outputTokens, rec.cachedTokens)
  await sql`
    insert into api_usage (kind, model, input_tokens, output_tokens, cached_tokens, cost_cents, role_id)
    values (${rec.kind}, ${rec.model}, ${rec.inputTokens}, ${rec.outputTokens}, ${rec.cachedTokens}, ${cost}, ${rec.roleId ?? null})
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
