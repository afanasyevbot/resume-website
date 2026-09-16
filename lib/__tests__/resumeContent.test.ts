import { describe, it, expect } from 'vitest'
import {
  RESUME_HEADLINE,
  resumeVariants,
  archetypeToVariant,
  contactLine,
  formatAllResumeVariantsForPrompt,
  formatResumeVariantForPrompt,
} from '../resumeContent'

describe('resumeContent', () => {
  it('maps classic-ats to sales and AI archetypes to gtm', () => {
    expect(archetypeToVariant('classic-ats')).toBe('sales')
    expect(archetypeToVariant('revenue-x-ai')).toBe('gtm')
    expect(archetypeToVariant('claude-code-sidebar')).toBe('gtm')
  })

  it('uses updated email and mafanasiev.me in contact line', () => {
    expect(contactLine()).toContain('mattafanasiev@outlook.com')
    expect(contactLine()).toContain('mafanasiev.me')
  })

  it('uses the shared professional headline', () => {
    expect(RESUME_HEADLINE).toBe('Account Executive | AI Systems & GTM')
  })

  it('sales variant matches the updated resume structure', () => {
    expect(resumeVariants.sales.summary).toContain('five years of B2B SaaS sales experience')
    expect(resumeVariants.sales.projects.length).toBe(3)
    expect(resumeVariants.sales.roles[0].bullets[0]).toContain('#1 of 30 account executives')
  })

  it('gtm variant leads with AI workflow bullets', () => {
    expect(resumeVariants.gtm.roles[0].bullets[0]).toContain('go-to frontline partner')
    expect(resumeVariants.gtm.skills[0].category).toBe('GTM & AI Adoption')
  })

  it('does not mention Apollo or monetized Pulse claims', () => {
    const all = formatAllResumeVariantsForPrompt()
    expect(all).not.toMatch(/Apollo/i)
    expect(all).not.toMatch(/monetized/i)
    expect(all).not.toMatch(/real customers/i)
  })

  it('formats both variants for AI prompt', () => {
    const sales = formatResumeVariantForPrompt('sales')
    const all = formatAllResumeVariantsForPrompt()
    expect(sales).toContain('Sales-led')
    expect(all).toContain('AI GTM')
    expect(all).toContain('MY WHY')
  })
})
