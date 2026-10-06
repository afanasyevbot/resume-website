import { describe, it, expect } from 'vitest'
import { buildSystemPrompt } from '../buildSystemPrompt'
import { professionalContext } from '../professionalContext'

describe('buildSystemPrompt', () => {
  it('includes the name', () => {
    const prompt = buildSystemPrompt(professionalContext)
    expect(prompt).toContain('Matthew Afanasiev')
  })

  it('includes deal size context', () => {
    const prompt = buildSystemPrompt(professionalContext)
    expect(prompt).toContain('$99K')
  })

  it('includes explicit gaps', () => {
    const prompt = buildSystemPrompt(professionalContext)
    expect(prompt).toContain('Enterprise')
  })

  it('includes positioning and sales methodology', () => {
    const prompt = buildSystemPrompt(professionalContext)
    expect(prompt).toContain('POSITIONING')
    expect(prompt).toContain('SALES METHODOLOGY')
    expect(prompt).toContain('Fidelis Strategy')
  })

  it('includes curated resume variants for chat', () => {
    const prompt = buildSystemPrompt(professionalContext)
    expect(prompt).toContain('CURATED RESUME VARIANTS')
    expect(prompt).toContain('Account Executive | AI Systems & GTM')
    expect(prompt).toContain('mattafanasiev@outlook.com')
  })

  it('includes performance standings for chat', () => {
    const prompt = buildSystemPrompt(professionalContext)
    expect(prompt).toContain('PERFORMANCE STANDINGS')
    expect(prompt).toContain('#1 ranked rep YTD')
    expect(prompt).toContain('200% of quota in Q3')
    expect(prompt).not.toMatch(/ranked #3 of 30 account executives/i)
    expect(prompt).not.toMatch(/Top performer in Q1 2026/i)
  })

  it('documents facts needed for sales-performance questions', () => {
    const prompt = buildSystemPrompt(professionalContext)
    expect(prompt).toContain('division record for most sales in a month')
    expect(prompt).toContain("President's Club qualification")
    expect(prompt).toContain('102.6% of FY25 quota')
    expect(prompt).toContain('Never say third, #3, or ranked #3 of 30')
    expect(prompt).not.toMatch(/Paradise Capital/i)
  })
})
