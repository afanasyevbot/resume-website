import { describe, it, expect } from 'vitest'
import { professionalContext } from '../professionalContext'

describe('professionalContext canonical facts', () => {
  it('lists 6 production AI systems', () => {
    expect(professionalContext.projects).toHaveLength(6)
  })

  it('includes the M&A Valuation System', () => {
    const names = professionalContext.projects.map((p) => p.name)
    expect(names).toContain('M&A Valuation System')
  })

  it('summary states 6 production AI systems', () => {
    expect(professionalContext.summary).toContain('6 production AI systems')
  })

  it('key stats state 6 production AI systems', () => {
    expect(professionalContext.keyStats.some((s) => s.includes('6 production AI systems'))).toBe(true)
  })
})
