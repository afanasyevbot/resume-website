/**
 * How an application was submitted — the single source of truth for the
 * "auto-applied vs I applied" distinction.
 *
 * The raw `method` is recorded in events.detail.method at apply time across
 * several paths (cron, one-click approve, Slack, manual mark). This module is
 * pure: it buckets that raw string into the three things Matthew actually cares
 * to tell apart, and never crashes on an unknown/missing value (→ 'unknown').
 *
 *   autonomous — engine found it, scored it ≥ AUTO_FIT, and submitted it with
 *                NO human in the loop (cron method 'auto').
 *   approved   — the engine submitted it, but only after Matthew said yes
 *                (deck one-click / Slack approve / Slack answer).
 *   self       — Matthew opened the listing, filled the form himself, and
 *                marked it applied. The engine didn't submit anything.
 */
export type ApplyBucket = 'autonomous' | 'approved' | 'self' | 'unknown'

export function applyMethodBucket(method: string | null | undefined): ApplyBucket {
  switch (method) {
    case 'auto':
      return 'autonomous'
    case 'one-click':
    case 'auto-approved':
    case 'auto-answered':
      return 'approved'
    case 'manual':
      return 'self'
    default:
      return 'unknown'
  }
}

export interface ApplyBucketMeta {
  /** Badge text. */
  label: string
  /** One-line plain-English meaning (tooltip / detail). */
  hint: string
  /** Badge color (engine palette). */
  color: string
}

export const APPLY_BUCKET_META: Record<ApplyBucket, ApplyBucketMeta> = {
  autonomous: {
    label: 'Auto-applied',
    hint: 'The engine submitted this on its own — you never touched it.',
    color: '#4ade80',
  },
  approved: {
    label: 'You approved',
    hint: 'The engine submitted it after you clicked approve.',
    color: '#f0b429',
  },
  self: {
    label: 'You applied',
    hint: 'You filled out the application yourself and marked it done.',
    color: '#7da7d9',
  },
  unknown: {
    label: 'Applied',
    hint: 'Applied — submission method not recorded.',
    color: '#5d6b80',
  },
}
