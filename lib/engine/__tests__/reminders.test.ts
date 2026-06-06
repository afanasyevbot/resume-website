/**
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest'
import { linkedinSearchUrl } from '../reminders'

describe('linkedinSearchUrl', () => {
  it('builds a search url for a basic company name', () => {
    expect(linkedinSearchUrl('Anthropic')).toBe(
      'https://www.linkedin.com/search/results/people/?keywords=Anthropic',
    )
  })

  it('percent-encodes spaces in multi-word company names', () => {
    expect(linkedinSearchUrl('Open AI')).toBe(
      'https://www.linkedin.com/search/results/people/?keywords=Open%20AI',
    )
  })

  it('percent-encodes special chars (&, ?, /)', () => {
    expect(linkedinSearchUrl('A&B?/C')).toBe(
      'https://www.linkedin.com/search/results/people/?keywords=A%26B%3F%2FC',
    )
  })

  it('handles an empty string without throwing', () => {
    expect(linkedinSearchUrl('')).toBe(
      'https://www.linkedin.com/search/results/people/?keywords=',
    )
  })

  it('encodes unicode characters', () => {
    expect(linkedinSearchUrl('Café')).toBe(
      'https://www.linkedin.com/search/results/people/?keywords=Caf%C3%A9',
    )
  })
})
