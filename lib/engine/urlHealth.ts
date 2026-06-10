/**
 * Apply-URL health check for research-path roles. Aggregator-extracted URLs
 * routinely go dead (Greenhouse reposts change the job ID), and a dead URL
 * wastes a tailor run and stalls the apply pipeline. Checked BEFORE scoring,
 * so a dead listing costs one HTTP request instead of a Claude call.
 */

export interface UrlHealth {
  ok: boolean
  reason: string | null
  /** Where the URL actually landed after redirects (may differ from input). */
  finalUrl: string | null
}

/** Pure classification — only definitive death signals fail a URL.
 *  Bot-blocking statuses (403/405/5xx) pass: a block is not proof the job is gone. */
export function classifyUrlHealth(status: number, finalUrl: string): UrlHealth {
  if (status === 404 || status === 410) {
    return { ok: false, reason: `listing gone (HTTP ${status})`, finalUrl }
  }
  try {
    const u = new URL(finalUrl)
    if (u.hostname.endsWith('greenhouse.io') && u.searchParams.get('error') === 'true') {
      return { ok: false, reason: 'greenhouse error=true redirect (job not found)', finalUrl }
    }
  } catch {
    /* unparseable final URL → don't fail on it */
  }
  return { ok: true, reason: null, finalUrl }
}

/** Follow redirects and classify. Network failures pass (benefit of the doubt). */
export async function checkApplyUrl(url: string, timeoutMs = 5000): Promise<UrlHealth> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    // GET, not HEAD — several ATS reject HEAD outright, and we never read the body.
    const res = await fetch(url, { method: 'GET', redirect: 'follow', signal: ctrl.signal })
    return classifyUrlHealth(res.status, res.url || url)
  } catch {
    return { ok: true, reason: null, finalUrl: null }
  } finally {
    clearTimeout(timer)
  }
}
