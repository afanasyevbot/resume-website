import { describe, it, expect } from 'vitest'
import { resumeVariants, archetypeToVariant, contactLine, formatAllResumeVariantsForPrompt, formatResumeVariantForPrompt } from '../resumeContent'

describe('resumeContent', () => {
  it('maps classic-ats to sales and AI archetypes to gtm', () => {
    expect(archetypeToVariant('classic-ats')).toBe('sales')
    expect(archetypeToVariant('revenue-x-ai')).toBe('gtm')
    expect(archetypeToVariant('claude-code-sidebar')).toBe('gtm')
  })

  it('uses outlook email and mafanasiev.me in contact line', () => {
    expect(contactLine()).toContain('mafanasiev@outlook.com')
    expect(contactLine()).toContain('mafanasiev.me')
  })

  it('sales variant leads with closing headline', () => {
    expect(resumeVariants.sales.headline).toContain('close deals')
    expect(resumeVariants.sales.projects.length).toBeGreaterThan(0)
  })

  it('gtm variant includes sidebar expertise and signature build', () => {
    expect(resumeVariants.gtm.headline).toContain('go-to-market')
    expect(resumeVariants.gtm.gtmExpertise?.length).toBeGreaterThan(0)
    expect(resumeVariants.gtm.signatureBuild?.name).toContain('Buyer Intelligence')
  })

  it('formats both variants for AI prompt', () => {
    const sales = formatResumeVariantForPrompt('sales')
    const all = formatAllResumeVariantsForPrompt()
    expect(sales).toContain('Sales-led')
    expect(all).toContain('AI GTM')
    expect(all).toContain('Signature build')
  })
})
