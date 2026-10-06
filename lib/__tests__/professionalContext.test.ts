import { describe, it, expect } from 'vitest'
import { professionalContext } from '../professionalContext'
import { homepageProofPoints } from '../performanceFacts'

describe('professionalContext canonical facts', () => {
  it('uses the updated personal email', () => {
    expect(professionalContext.identity.email).toBe('mattafanasiev@outlook.com')
  })

  it('includes Buyer Engine, Pulse, Advisor, and AI Lead Generation', () => {
    const names = professionalContext.projects.map((p) => p.name)
    expect(names).toContain('Buyer Engine')
    expect(names).toContain('Fidelis Pulse')
    expect(names).toContain('Fidelis Advisor')
    expect(names).toContain('AI Lead Generation')
  })

  it('uses the three approved homepage proof points', () => {
    expect(professionalContext.headlineMetrics).toHaveLength(3)
    expect(professionalContext.headlineMetrics.map((m) => m.value)).toEqual(
      homepageProofPoints.map((p) => p.value),
    )
  })

  it('summary reflects updated sales positioning', () => {
    expect(professionalContext.summary).toContain('Account executive with five years')
    expect(professionalContext.summary).toContain('#1 ranked rep YTD')
    expect(professionalContext.summary).toContain('200% of quota in Q3')
    expect(professionalContext.summary).not.toMatch(/Paradise/i)
    expect(professionalContext.summary).not.toMatch(/monetized/i)
  })

  it('preserves precise performance source facts for Ask', () => {
    expect(professionalContext.keyStats.some((s) => s.includes('200% of quota in Q3'))).toBe(true)
    expect(professionalContext.keyStats.some((s) => s.includes('#1 ranked rep YTD'))).toBe(true)
    expect(professionalContext.keyStats.join(' ')).not.toMatch(/ranked #3 of 30/i)
    expect(professionalContext.keyStats.join(' ')).not.toMatch(/Top performer in Q1 2026/i)
  })
})
