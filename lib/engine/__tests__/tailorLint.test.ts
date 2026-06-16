import { describe, it, expect } from 'vitest'
import { lintPackage } from '../tailorLint'
import type { TailoredPackage } from '../tailorTypes'

function pkg(partial: Partial<TailoredPackage>): TailoredPackage {
  return {
    archetype: 'classic-ats',
    summary: 'Top performer. AE who builds AI. Mid-market specialist. Five years of full-cycle sales.',
    emphasizedBullets: ['bullet one', 'bullet two', 'bullet three', 'bullet four'],
    coverLetter: 'Hello team. I am excited to apply.',
    outreachDraft: 'Hey, saw your role and would love to chat.',
    notes: [],
    lintIssues: [],
    ...partial,
  }
}

describe('lintPackage', () => {
  it('passes a clean package', () => {
    expect(lintPackage(pkg({})).ok).toBe(true)
  })

  it('flags em dashes', () => {
    const r = lintPackage(pkg({ summary: 'Top performer — AE who builds AI.' }))
    expect(r.ok).toBe(false)
    expect(r.issues.some((s) => s.includes('em dash'))).toBe(true)
  })

  it('flags "Quarterbacked" (case-insensitive)', () => {
    const r = lintPackage(pkg({ emphasizedBullets: ['Quarterbacked the deal', 'b', 'c', 'd'] }))
    expect(r.ok).toBe(false)
    expect(r.issues.some((s) => s.includes('"Quarterbacked"'))).toBe(true)
  })

  it('flags self-claim "enterprise experience"', () => {
    const r = lintPackage(pkg({ coverLetter: 'I have enterprise experience' }))
    expect(r.ok).toBe(false)
    expect(r.issues.some((s) => s.includes('Do not claim'))).toBe(true)
  })

  it('flags "sold to enterprise"', () => {
    const r = lintPackage(pkg({ coverLetter: 'I have sold to enterprise customers' }))
    expect(r.ok).toBe(false)
    // either rule may catch this, both are blocking
    expect(r.issues.length).toBeGreaterThan(0)
  })

  it('flags "enterprise AE"', () => {
    const r = lintPackage(pkg({ emphasizedBullets: ['Top enterprise AE', 'b', 'c', 'd'] }))
    expect(r.ok).toBe(false)
  })

  it('allows capitalized "Enterprise" in product names (ChatGPT Enterprise)', () => {
    const r = lintPackage(pkg({ coverLetter: 'Sell ChatGPT Enterprise to mid-market buyers' }))
    expect(r.ok).toBe(true)
  })

  it('allows generic "enterprise AI adoption" (industry adjective, not self-claim)', () => {
    const r = lintPackage(
      pkg({ coverLetter: 'OpenAI is defining what enterprise AI adoption looks like.' }),
    )
    expect(r.ok).toBe(true)
  })

  it('allows "enterprise" in notes (internal gap acknowledgments)', () => {
    const r = lintPackage(
      pkg({ notes: ['Quota size sits below the $1M+ enterprise AE range.'] }),
    )
    expect(r.ok).toBe(true)
  })

  it('flags cover letter > 300 words', () => {
    const long = 'word '.repeat(301).trim()
    const r = lintPackage(pkg({ coverLetter: long }))
    expect(r.ok).toBe(false)
    expect(r.issues.some((s) => s.includes('Cover letter is'))).toBe(true)
  })

  it('flags outreach > 90 words', () => {
    const long = 'word '.repeat(91).trim()
    const r = lintPackage(pkg({ outreachDraft: long }))
    expect(r.ok).toBe(false)
    expect(r.issues.some((s) => s.includes('Outreach draft is'))).toBe(true)
  })

  it('flags wrong bullet count', () => {
    const r = lintPackage(pkg({ emphasizedBullets: ['a', 'b', 'c'] }))
    expect(r.ok).toBe(false)
    expect(r.issues.some((s) => s.includes('Emphasized bullets must be exactly 4'))).toBe(true)
  })

  it('flags > 3 notes', () => {
    const r = lintPackage(pkg({ notes: ['a', 'b', 'c', 'd'] }))
    expect(r.ok).toBe(false)
    expect(r.issues.some((s) => s.includes('Notes/gaps'))).toBe(true)
  })

  it('flags empty summary', () => {
    const r = lintPackage(pkg({ summary: '' }))
    expect(r.ok).toBe(false)
    expect(r.issues.some((s) => s.includes('Summary is empty'))).toBe(true)
  })

  // ── Skill-parity rules ported from Matthew's job-application skill ──

  it('genericizes a named AI vendor/API ("Anthropic API")', () => {
    const r = lintPackage(pkg({ coverLetter: 'I built six systems on the Anthropic API.' }))
    expect(r.ok).toBe(false)
    expect(r.issues.some((s) => s.toLowerCase().includes('api'))).toBe(true)
  })

  it('genericizes "Claude API" and "Claude Agent SDK" in outgoing copy', () => {
    expect(lintPackage(pkg({ emphasizedBullets: ['Shipped on the Claude API', 'b', 'c', 'd'] })).ok).toBe(false)
    expect(lintPackage(pkg({ summary: 'Built multi-agent systems with the Claude Agent SDK for clients.' })).ok).toBe(false)
  })

  it('allows the generic phrasing the rule prefers ("multiple AI APIs")', () => {
    expect(lintPackage(pkg({ coverLetter: 'I built six production systems on multiple AI APIs.' })).ok).toBe(true)
  })

  it('flags claiming experience with a named sales methodology (MEDDIC)', () => {
    const r = lintPackage(pkg({ coverLetter: 'Experienced in MEDDIC and Challenger across full cycles.' }))
    expect(r.ok).toBe(false)
    expect(r.issues.some((s) => s.toLowerCase().includes('methodology'))).toBe(true)
  })

  it('allows framing a methodology as eager-to-learn (not a claim)', () => {
    expect(lintPackage(pkg({ coverLetter: 'Eager to learn your MEDDIC process if it is part of the role.' })).ok).toBe(true)
  })

  it('flags claiming a $1M+ quota', () => {
    expect(lintPackage(pkg({ summary: 'Carried a $1M+ quota in a mid-market book of business.' })).ok).toBe(false)
    expect(lintPackage(pkg({ coverLetter: 'Managed a $1 million quota target last year.' })).ok).toBe(false)
  })

  it('does not flag normal dollar figures ($99K, $1.2M ARR)', () => {
    expect(lintPackage(pkg({ summary: 'Closed $99K in two months and grew ARR by 58%.' })).ok).toBe(true)
    expect(lintPackage(pkg({ coverLetter: 'Drove a deal reaching $1.2M in ARR impact.' })).ok).toBe(true)
  })

  it('accumulates multiple issues', () => {
    const r = lintPackage(
      pkg({
        summary: 'Quarterbacked the team — sold to enterprise customers.',
      }),
    )
    expect(r.ok).toBe(false)
    expect(r.issues.length).toBeGreaterThanOrEqual(3)
  })
})
