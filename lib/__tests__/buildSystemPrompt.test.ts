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

  it('includes performance standings with Q3 tied-for-first limits', () => {
    const prompt = buildSystemPrompt(professionalContext)
    expect(prompt).toContain('PERFORMANCE STANDINGS')
    expect(prompt).toContain('tied for #1')
    expect(prompt).toContain('do not describe as an outright or completed Q3 win')
  })
})
