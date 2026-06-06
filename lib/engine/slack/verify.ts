import crypto from 'crypto'

/**
 * Verify a Slack request signature (signing scheme v0).
 *
 * Slack signs every request to our endpoints with HMAC-SHA256 over
 * `v0:{timestamp}:{rawBody}` using the app's signing secret. We MUST verify this
 * on every inbound request — these endpoints are public (no cookie/cron gate), so
 * the signature is the only thing stopping a stranger from forging a "submit this
 * application" command. We also reject stale timestamps to block replay attacks.
 */
export function verifySlackSignature(params: {
  signingSecret: string
  rawBody: string
  timestamp: string | null
  signature: string | null
  /** Override for tests; defaults to current unix seconds. */
  now?: number
}): boolean {
  const { signingSecret, rawBody, timestamp, signature } = params
  if (!signingSecret || !timestamp || !signature) return false

  const ts = Number(timestamp)
  if (!Number.isFinite(ts)) return false

  const now = params.now ?? Math.floor(Date.now() / 1000)
  // Reject anything older than 5 minutes (replay protection).
  if (Math.abs(now - ts) > 60 * 5) return false

  const base = `v0:${timestamp}:${rawBody}`
  const hmac = crypto.createHmac('sha256', signingSecret).update(base).digest('hex')
  const expected = `v0=${hmac}`

  const a = Buffer.from(expected)
  const b = Buffer.from(signature)
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}
