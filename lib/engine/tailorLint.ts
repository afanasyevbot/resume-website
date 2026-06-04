import type { TailoredPackage } from './tailorTypes'

export interface LintResult {
  ok: boolean
  issues: string[]
}

/**
 * Word-level forbidden rules applied to OUTGOING content (summary, bullets,
 * cover letter, outreach). NOT applied to `notes`, which are internal
 * gap acknowledgments where it's natural to write "enterprise AE range".
 */
const FORBIDDEN_WORDS = [
  {
    word: 'Quarterbacked',
    caseSensitive: false,
    reason: 'Use "Led" or "Drove" (master profile rule).',
  },
] as const

/**
 * Phrase rules — catches the SELF-claim shape of "enterprise" while allowing
 * (a) capitalized product names ("ChatGPT Enterprise"), and (b) the generic
 * industry adjective ("enterprise AI adoption").
 */
const FORBIDDEN_PHRASES = [
  {
    re: /\benterprise (experience|sales|quota|AE|account executives?|deals?|customers?|clients?|buyers?)\b/i,
    reason:
      'Do not claim "enterprise" sales/experience/quota/etc. — Matthew is mid-market.',
  },
  {
    re: /\b(sold|sell|selling|closed|carried|managed|owned|worked)\s+(to|with|across|in)?\s*(the\s+)?enterprise\b/i,
    reason: 'Do not position Matthew as having sold to enterprise.',
  },
] as const

const EM_DASH = /[—]/g
const WORD_RE = /\b\w[\w'-]*\b/g

function wordCount(s: string): number {
  return (s.match(WORD_RE) ?? []).length
}

function containsForbiddenWord(text: string, word: string, caseSensitive: boolean): boolean {
  const re = new RegExp(`\\b${word}\\b`, caseSensitive ? '' : 'i')
  return re.test(text)
}

export function lintPackage(pkg: TailoredPackage): LintResult {
  const issues: string[] = []

  // OUTGOING content: everything except notes (which are internal gap acks).
  const outgoing = [
    pkg.summary,
    ...pkg.emphasizedBullets,
    pkg.coverLetter,
    pkg.outreachDraft,
  ].join('\n')

  // 1. No em dashes anywhere (including notes — em dash is always wrong).
  const allText = [outgoing, ...pkg.notes].join('\n')
  if (EM_DASH.test(allText)) {
    issues.push('Remove all em dashes (—). Use commas or periods.')
  }

  // 2. Forbidden words on OUTGOING only
  for (const rule of FORBIDDEN_WORDS) {
    if (containsForbiddenWord(outgoing, rule.word, rule.caseSensitive)) {
      issues.push(`"${rule.word}" is forbidden. ${rule.reason}`)
    }
  }

  // 3. Forbidden phrases on OUTGOING only (smarter "enterprise" match)
  for (const rule of FORBIDDEN_PHRASES) {
    if (rule.re.test(outgoing)) {
      issues.push(rule.reason)
    }
  }

  // 4. Length limits
  const coverWords = wordCount(pkg.coverLetter)
  if (coverWords > 300) {
    issues.push(`Cover letter is ${coverWords} words; trim to ≤ 300.`)
  }
  const outreachWords = wordCount(pkg.outreachDraft)
  if (outreachWords > 90) {
    issues.push(`Outreach draft is ${outreachWords} words; trim to ≤ 90.`)
  }

  // 5. Bullet count
  if (pkg.emphasizedBullets.length !== 4) {
    issues.push(`Emphasized bullets must be exactly 4 (got ${pkg.emphasizedBullets.length}).`)
  }

  // 6. Summary length sanity (1-5 sentences feels right)
  const summarySentences = pkg.summary.split(/[.!?]+/).filter((s) => s.trim().length > 0).length
  if (summarySentences > 5) {
    issues.push(`Summary is ${summarySentences} sentences; trim to 3–4.`)
  }
  if (summarySentences === 0) {
    issues.push('Summary is empty.')
  }

  // 7. Notes (gap acknowledgments) ≤ 3
  if (pkg.notes.length > 3) {
    issues.push(`Notes/gaps must be ≤ 3 (got ${pkg.notes.length}).`)
  }

  return { ok: issues.length === 0, issues }
}
