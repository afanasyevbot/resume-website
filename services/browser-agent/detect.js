/**
 * Pure URL-based ATS detection helpers. Kept free of Playwright so they can
 * be unit-tested without a browser.
 */

/** Classify an apply attempt as 'greenhouse' | 'ashby' | null from BOTH the
 *  requested URL and the post-redirect final URL. Greenhouse boards links
 *  routinely redirect to the company's own careers site — the attempt is
 *  still a Greenhouse attempt, so the requested URL counts too. */
function classifyAtsUrl(requestedUrl, finalUrl) {
  for (const url of [finalUrl, requestedUrl]) {
    if (!url) continue
    if (url.includes('boards.greenhouse.io') || url.includes('job-boards.greenhouse.io')) return 'greenhouse'
    if (url.includes('jobs.ashbyhq.com')) return 'ashby'
  }
  return null
}

/** Greenhouse signals a closed/removed job by redirecting jobs/<id> to the
 *  company board index with ?error=true. */
function isDeadGreenhouseListing(finalUrl) {
  try {
    const u = new URL(finalUrl)
    if (!u.hostname.endsWith('greenhouse.io')) return false
    return u.searchParams.get('error') === 'true'
  } catch {
    return false
  }
}

module.exports = { classifyAtsUrl, isDeadGreenhouseListing }
