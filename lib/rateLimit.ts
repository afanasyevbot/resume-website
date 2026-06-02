import { NextRequest } from 'next/server'

// Best-effort in-memory limiter. Protects against casual abuse of the paid
// Anthropic key. Note: state is per server instance, not shared across the
// fleet, so it is a soft cap rather than a hard guarantee.
const hits = new Map<string, number[]>()

export function getClientId(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  return forwarded?.split(',')[0]?.trim() || 'unknown'
}

export function rateLimit(id: string, max: number, windowMs: number): boolean {
  const now = Date.now()
  const recent = (hits.get(id) ?? []).filter((t) => now - t < windowMs)

  if (recent.length >= max) {
    hits.set(id, recent)
    return false
  }

  recent.push(now)
  hits.set(id, recent)
  return true
}
