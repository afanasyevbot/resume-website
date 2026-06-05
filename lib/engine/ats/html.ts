/**
 * Strip HTML tags and decode common HTML entities to plain text.
 * Used for Greenhouse content which arrives as entity-encoded HTML.
 * Not a general-purpose sanitizer — intended for known-shape job posting HTML.
 */
const ENTITY_MAP: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&nbsp;': ' ',
  '&rsquo;': '’',
  '&lsquo;': '‘',
  '&rdquo;': '”',
  '&ldquo;': '“',
  '&mdash;': '—',
  '&ndash;': '–',
  '&hellip;': '…',
}

function decodeEntities(text: string): string {
  let out = text
  for (const [encoded, decoded] of Object.entries(ENTITY_MAP)) {
    out = out.split(encoded).join(decoded)
  }
  // Numeric refs like &#1234; — guarded against out-of-range code points
  out = out.replace(/&#(\d+);/g, (match, n: string) => {
    try { return String.fromCodePoint(parseInt(n, 10)) } catch { return match }
  })
  // Hex numeric refs
  out = out.replace(/&#x([0-9a-fA-F]+);/g, (match, n: string) => {
    try { return String.fromCodePoint(parseInt(n, 16)) } catch { return match }
  })
  return out
}

export function htmlToText(html: string): string {
  if (!html) return ''
  // First pass: decode the entity-encoded form Greenhouse gives us
  // (their `content` field is double-encoded: HTML inside an entity-escaped string).
  let working = decodeEntities(html)
  // Strip script/style blocks entirely
  working = working.replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
  // Replace block-ish tags with newlines
  working = working.replace(/<\/?(p|div|li|h[1-6]|br|tr|article|section)[^>]*>/gi, '\n')
  // Strip all remaining tags
  working = working.replace(/<[^>]+>/g, '')
  // Decode any inner entities exposed by stripping
  working = decodeEntities(working)
  // Collapse whitespace
  working = working
    .split('\n')
    .map((l) => l.replace(/[ \t]+/g, ' ').trim())
    .filter((l) => l.length > 0)
    .join('\n')
  return working.trim()
}
