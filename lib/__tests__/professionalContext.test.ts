import { describe, it, expect } from 'vitest'
import { professionalContext } from '../professionalContext'

describe('professionalContext canonical facts', () => {
  it('lists 7 production systems (6 AI projects plus the Grace Church buildout)', () => {
    expect(professionalContext.projects).toHaveLength(6)
    expect(professionalContext.proBono).toHaveLength(1)
    expect(professionalContext.projects.length + professionalContext.proBono.length).toBe(7)
  })

  it('includes both lead-generation systems', () => {
    const names = professionalContext.projects.map((p) => p.name)
    expect(names.some((n) => n.includes('Lead Generation'))).toBe(true)
    expect(names.some((n) => n.includes('Prospecting'))).toBe(true)
  })

  it('includes the M&A Valuation System', () => {
    const names = professionalContext.projects.map((p) => p.name)
    expect(names).toContain('M&A Valuation System')
  })

  it('summary states 7 production systems', () => {
    expect(professionalContext.summary).toMatch(/7|Seven production systems/i)
  })

  it('key stats state 7 production systems', () => {
    expect(professionalContext.keyStats.some((s) => s.includes('7 production systems'))).toBe(true)
  })
})
