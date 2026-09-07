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
    expect(prompt).toContain('$50K')
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
    expect(prompt).toContain('I close deals. I build AI systems.')
    expect(prompt).toContain('I build AI systems. I drive go-to-market strategy.')
    expect(prompt).toContain('mafanasiev@outlook.com')
  })
})
