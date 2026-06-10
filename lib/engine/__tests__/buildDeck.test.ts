import { describe, it, expect } from 'vitest'
import { buildDeck } from '../buildDeck'
import type { RoleRow } from '../dashboard'

function makeRole(overrides: Partial<RoleRow> & { id: number; company: string; title: string }): RoleRow {
  return {
    location: null,
    url: null,
    source: null,
    fit_score: null,
    fit_reasons: null,
    segment: null,
    ai_native: null,
    route: 'tailor',
    status: 'awaiting_approval',
    created_at: new Date().toISOString(),
    package_json: null,
    package_id: null,
    user_rating: null,
    jd_summary: null,
    ...overrides,
  }
}

describe('buildDeck', () => {
  it('maps awaiting_approval roles to approval deck items', () => {
    const roles = [makeRole({ id: 1, company: 'Acme', title: 'AE', status: 'awaiting_approval', fit_score: 80 })]
    const deck = buildDeck(roles, [])
    expect(deck).toHaveLength(1)
    expect(deck[0].type).toBe('approval')
    if (deck[0].type === 'approval') {
      expect(deck[0].company).toBe('Acme')
      expect(deck[0].fit).toBe(80)
    }
  })

  it('maps needs_review roles to manual deck items', () => {
    const roles = [
      makeRole({ id: 2, company: 'Lever Co', title: 'MM AE', status: 'needs_review', fit_score: 72, url: 'https://jobs.lever.co/x' }),
    ]
    const deck = buildDeck(roles, [])
    expect(deck).toHaveLength(1)
    expect(deck[0].type).toBe('manual')
    if (deck[0].type === 'manual') {
      expect(deck[0].company).toBe('Lever Co')
      expect(deck[0].url).toBe('https://jobs.lever.co/x')
    }
  })

  it('orders approvals before manual items before followups', () => {
    const roles = [
      makeRole({ id: 3, company: 'B', title: 'AE', status: 'needs_review', fit_score: 70 }),
      makeRole({ id: 4, company: 'A', title: 'AE', status: 'awaiting_approval', fit_score: 82 }),
    ]
    const deck = buildDeck(roles, [])
    expect(deck[0].type).toBe('approval')
    expect(deck[1].type).toBe('manual')
  })

  it('ignores roles with other statuses', () => {
    const roles = [
      makeRole({ id: 5, company: 'C', title: 'AE', status: 'scored' }),
      makeRole({ id: 6, company: 'D', title: 'AE', status: 'tailored' }),
    ]
    const deck = buildDeck(roles, [])
    expect(deck).toHaveLength(0)
  })
})
