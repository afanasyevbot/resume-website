import { describe, it, expect } from 'vitest'
import { passesTitleGate } from '../titleGate'

describe('passesTitleGate — one shared gate for ATS + web research', () => {
  it('passes the AE / GTM titles Matthew targets', () => {
    for (const t of [
      'Account Executive',
      'Mid-Market Account Executive, Americas',
      'Strategic Account Executive',
      'Founding Account Executive',
      'GTM - AI Native Sales',
      'Partnerships Manager',
      'Channel Account Manager',
      'Revenue Operations Manager',
      'Client Director',
    ]) {
      expect(passesTitleGate(t), `expected "${t}" to pass`).toBe(true)
    }
  })

  it('blocks the non-AE titles (block-list wins ties)', () => {
    for (const t of [
      'Customer Success Manager',
      'Mid-Market Customer Success Manager', // matches mid-market allow → blocked by CSM
      'Solutions Engineer',
      'Solution Engineer (Pre-Sales)',
      'Business Development Representative',
      'Sales Development Representative',
      'Data Scientist, GTM',
      'Product Manager',
      'Marketing Manager',
    ]) {
      expect(passesTitleGate(t), `expected "${t}" to be blocked`).toBe(false)
    }
  })

  it('blocks BDR/SDR — the exact drift the old web-research gate let through', () => {
    expect(passesTitleGate('BDR, Enterprise')).toBe(false)
    expect(passesTitleGate('SDR (AMER)')).toBe(false)
  })

  it('blocks clearly irrelevant non-GTM titles', () => {
    expect(passesTitleGate('Senior Backend Engineer')).toBe(false)
    expect(passesTitleGate('Recruiting Coordinator')).toBe(false)
  })
})
