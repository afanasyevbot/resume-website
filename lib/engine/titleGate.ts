/**
 * Title gate — the single, shared cheap pre-filter so we never burn a Claude
 * call on a role that's obviously not a fit. Two passes: a title must MATCH the
 * allow-list AND must NOT match the block-list (the block-list wins ties).
 *
 * This used to live in two copies — one in ATS sourcing, one in web research —
 * and they had drifted: the research copy allowed BDR/SDR titles the ATS copy
 * explicitly blocked, so research paid to score roles Matthew had excluded.
 * One source of truth now; both paths import passesTitleGate.
 *
 * Matthew's targeting: AE / GTM broadly — account executive, mid-market,
 * strategic, sales, GTM, founding sales, business development, revenue, RevOps,
 * partnerships, alliances, channel, growth, client director/executive/partner.
 * NOT: CSM, BDR/SDR, solutions/sales engineering, pre-sales, data/marketing/
 * product roles.
 */

/** Allow-list: GTM/AE-flavored titles worth a closer look. */
export const RELEVANT_TITLE_RE =
  /\b(account executive|\bAE\b|account manager|\bAM\b|mid[-\s]?market|strategic|enterprise|sales|GTM|go[-\s]?to[-\s]?market|founding sales|business development|revenue|rev[-\s]?ops|partner(?:ship)?s?|alliances?|channel|growth|client (?:director|executive|partner))\b/i

/** Block-list: GTM-adjacent titles Matthew is NOT targeting. Checked after the
 *  allow-list, so a legit AE title still passes; the block-list wins ties. */
export const BLOCKED_TITLE_RE =
  /\b(customer success|CSM|solution(?:s)? engineer|pre[-\s]?sales|BDR|SDR|business development rep(?:resentative)?|sales development|data scientist|data analyst|marketing manager|product manager)\b/i

/** True if a job title should proceed to (paid) scoring. */
export function passesTitleGate(title: string): boolean {
  return RELEVANT_TITLE_RE.test(title) && !BLOCKED_TITLE_RE.test(title)
}
