/**
 * Strip common scraping artifacts from job description text.
 *
 * Web-scraped JDs often include navigation bars, cookie banners, footer links,
 * markdown image syntax, and duplicate headers from the page chrome. This
 * function removes those artifacts so the stored text is clean for display,
 * scoring, and tailoring.
 */

/** Lines that look like site chrome, not job content. */
const NOISE_PATTERNS = [
  // Cookie / consent banners
  /^we use cookies/i,
  /^accept\s*$/i,
  /^reject\s*$/i,
  /^preferences\s*$/i,
  /cookie.?policy/i,
  /^learn more\s*$/i,
  // Navigation / branding
  /^\[!\[.*?\]\(.*?\)\]\(.*?\)$/,       // markdown image links: [![alt](img)](href)
  /^!\[.*?\]\(.*?\)$/,                   // markdown images: ![alt](img)
  /^\[.*?\]\(\/?[a-z-]*\)$/,            // markdown nav links: [Text](/path)
  // Duplicate metadata lines
  /^(fully remote|remote|americas remote|💼\s*sales|posted \d+ days? ago)\s*$/i,
  // Generic fluff
  /^early access/i,
  /^help us improve/i,
  /^share your feedback/i,
  // Empty bracketed refs
  /^\[#\]$/,
  /^\[accept\]$/i,
  /^\[reject\]$/i,
  /^\[preferences\]$/i,
]

/** True if a line is scraping noise. */
function isNoise(line: string): boolean {
  const trimmed = line.trim()
  if (!trimmed) return false
  return NOISE_PATTERNS.some((p) => p.test(trimmed))
}

/**
 * Remove duplicate consecutive sections. When a page has a sticky header,
 * scrapers often capture the same company/title/location block twice.
 */
function dedupeConsecutive(lines: string[]): string[] {
  if (lines.length < 6) return lines

  // Look for the second occurrence of the first non-empty content line
  // within the first 15 lines — that's the sticky header repeat.
  const firstContent = lines.find((l) => l.trim().length > 10)
  if (!firstContent) return lines

  let firstIdx = -1
  let secondIdx = -1
  for (let i = 0; i < Math.min(lines.length, 20); i++) {
    if (lines[i].trim() === firstContent.trim()) {
      if (firstIdx === -1) firstIdx = i
      else { secondIdx = i; break }
    }
  }

  // If the duplicate block is within the first 15 lines, remove the first copy
  if (secondIdx > firstIdx && secondIdx < 15) {
    return lines.slice(secondIdx)
  }
  return lines
}

export function cleanJdText(raw: string): string {
  if (!raw) return ''

  let lines = raw.split('\n')

  // Strip noise lines
  lines = lines.filter((l) => !isNoise(l))

  // Dedupe sticky-header repeats
  lines = dedupeConsecutive(lines)

  // Collapse runs of 3+ blank lines into 2
  const collapsed: string[] = []
  let blankCount = 0
  for (const line of lines) {
    if (line.trim() === '') {
      blankCount++
      if (blankCount <= 2) collapsed.push(line)
    } else {
      blankCount = 0
      collapsed.push(line)
    }
  }

  return collapsed.join('\n').trim()
}
