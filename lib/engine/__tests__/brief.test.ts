import { describe, it, expect } from 'vitest'
import { composeBrief } from '../brief'

describe('composeBrief — the chief-of-staff morning sentence', () => {
  it('narrates a productive window with decisions waiting', () => {
    const text = composeBrief({
      sinceLabel: '14h',
      scanned: 21,
      applied: [{ company: 'Vercel' }],
      held: [{ company: 'Customer.io', fit: 74 }],
      retired: 2,
      decisions: 1,
    })
    expect(text).toContain('21 openings')
    expect(text).toContain('applied to Vercel')
    expect(text).toContain('retired 2 dead listings')
    expect(text).toMatch(/judgment|your call/i)
  })

  it('lists multiple applied companies naturally', () => {
    const text = composeBrief({
      sinceLabel: '1d',
      scanned: 30,
      applied: [{ company: 'Vercel' }, { company: 'Ramp' }],
      held: [],
      retired: 0,
      decisions: 0,
    })
    expect(text).toContain('applied to Vercel and Ramp')
    expect(text).not.toMatch(/retired/)
  })

  it('handles a quiet window honestly', () => {
    const text = composeBrief({
      sinceLabel: '2h',
      scanned: 0,
      applied: [],
      held: [],
      retired: 0,
      decisions: 0,
    })
    expect(text).toMatch(/quiet|nothing new/i)
    expect(text).toMatch(/next (scan|run)/i)
  })

  it('says you are done when nothing needs a decision', () => {
    const text = composeBrief({
      sinceLabel: '12h',
      scanned: 15,
      applied: [],
      held: [],
      retired: 1,
      decisions: 0,
    })
    expect(text).toMatch(/nothing needs you/i)
  })
})
