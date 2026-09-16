import { describe, it, expect } from 'vitest'
import { professionalContext } from '../professionalContext'

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

  it('includes the M&A Valuation System', () => {
    const names = professionalContext.projects.map((p) => p.name)
    expect(names).toContain('M&A Valuation System')
  })

  it('summary reflects updated positioning without monetized Pulse claims', () => {
    expect(professionalContext.summary).toContain('Account executive with five years')
    expect(professionalContext.summary).not.toMatch(/monetized/i)
    expect(professionalContext.summary).not.toMatch(/7 production systems/i)
  })

  it('headline metrics no longer use a production-system count', () => {
    expect(professionalContext.headlineMetrics.some((m) => m.label.toLowerCase().includes('production systems'))).toBe(
      false,
    )
  })
})
