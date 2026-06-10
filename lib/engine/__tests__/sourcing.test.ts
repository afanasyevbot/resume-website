import { describe, it, expect } from 'vitest'
import { planSourcing } from '../sourcing'
import type { AtsListing, TargetCompany } from '../ats/types'

function company(name: string): TargetCompany {
  return { name, ats: 'greenhouse', slug: name.toLowerCase() }
}

function listing(partial: Partial<AtsListing> & { url: string }): AtsListing {
  return {
    externalId: partial.url,
    title: 'Account Executive',
    location: null,
    jdText: '',
    publishedAt: null,
    ...partial,
  }
}

describe('planSourcing', () => {
  it('round-robins across companies instead of draining one first', () => {
    // Company A (alphabetically first) has many relevant roles; B has fewer.
    // The OLD greedy loop would emit all of A before any of B, starving B.
    const fetched = [
      {
        company: company('Anthropic'),
        listings: [
          listing({ url: 'a1', title: 'Account Executive' }),
          listing({ url: 'a2', title: 'Sales Executive' }),
          listing({ url: 'a3', title: 'Mid-Market AE' }),
        ],
      },
      {
        company: company('Cursor'),
        listings: [
          listing({ url: 'c1', title: 'Account Executive' }),
          listing({ url: 'c2', title: 'Strategic AE' }),
        ],
      },
    ]
    const plan = planSourcing(fetched, new Set(), { maxAgeDays: 30 })
    const urls = plan.work.map((w) => w.listing.url)
    // Interleaved: A0, C0, A1, C1, A2 — Cursor is reached on pass 1, not last.
    expect(urls).toEqual(['a1', 'c1', 'a2', 'c2', 'a3'])
  })

  it('skips already-known URLs and counts them as duplicates', () => {
    const fetched = [
      {
        company: company('Anthropic'),
        listings: [
          listing({ url: 'a1', title: 'Account Executive' }),
          listing({ url: 'a2', title: 'Account Executive' }),
        ],
      },
    ]
    const plan = planSourcing(fetched, new Set(['a1']), { maxAgeDays: 30 })
    expect(plan.work.map((w) => w.listing.url)).toEqual(['a2'])
    expect(plan.skippedDuplicate).toBe(1)
  })

  it('skips title-irrelevant roles and counts them', () => {
    const fetched = [
      {
        company: company('Anthropic'),
        listings: [
          listing({ url: 'a1', title: 'Account Executive' }),
          listing({ url: 'a2', title: 'Senior Backend Engineer' }),
          listing({ url: 'a3', title: 'Product Designer' }),
        ],
      },
    ]
    const plan = planSourcing(fetched, new Set(), { maxAgeDays: 30 })
    expect(plan.work.map((w) => w.listing.url)).toEqual(['a1'])
    expect(plan.skippedIrrelevant).toBe(2)
  })

  it('silently drops listings older than maxAgeDays', () => {
    const old = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
    const recent = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    const fetched = [
      {
        company: company('Anthropic'),
        listings: [
          listing({ url: 'a1', title: 'Account Executive', publishedAt: old }),
          listing({ url: 'a2', title: 'Account Executive', publishedAt: recent }),
        ],
      },
    ]
    const plan = planSourcing(fetched, new Set(), { maxAgeDays: 30 })
    expect(plan.work.map((w) => w.listing.url)).toEqual(['a2'])
    // Old role isn't counted as relevant, and isn't an "irrelevant" skip either.
    expect(plan.stats.get('Anthropic')?.relevant).toBe(1)
  })

  it('reports accurate per-company listed/new/relevant counts', () => {
    const fetched = [
      {
        company: company('Anthropic'),
        listings: [
          listing({ url: 'a1', title: 'Account Executive' }), // new + relevant
          listing({ url: 'a2', title: 'Engineer' }), // new, irrelevant
          listing({ url: 'a3', title: 'Account Executive' }), // duplicate
        ],
      },
    ]
    const plan = planSourcing(fetched, new Set(['a3']), { maxAgeDays: 30 })
    const s = plan.stats.get('Anthropic')!
    expect(s.listed).toBe(3)
    expect(s.new).toBe(2) // a1, a2 (a3 was a known duplicate)
    expect(s.relevant).toBe(1) // only a1
  })
})

describe('planSourcing — GTM-wide title gate (Matthew wants GTM broadly, not just AE)', () => {
  const gtmTitles = [
    'Partnerships Manager',
    'Strategic Alliances Lead',
    'Channel Partner Manager',
    'Solutions Engineer',
    'Revenue Operations Manager',
    'RevOps Analyst',
    'Growth Lead',
    'Founding GTM',
    'GTM Engineer',
    'Client Director',
  ]

  it('lets GTM-adjacent titles through to scoring', () => {
    const fetched = [
      {
        company: { name: 'Acme', ats: 'greenhouse' as const, slug: 'acme' },
        listings: gtmTitles.map((title, i) => listing({ url: `g${i}`, title })),
      },
    ]
    const plan = planSourcing(fetched, new Set(), { maxAgeDays: 30 })
    const passed = plan.work.map((w) => w.listing.title)
    for (const t of gtmTitles) expect(passed).toContain(t)
  })

  it('still blocks clearly irrelevant titles', () => {
    const fetched = [
      {
        company: { name: 'Acme', ats: 'greenhouse' as const, slug: 'acme' },
        listings: [
          listing({ url: 'x1', title: 'Senior Backend Engineer' }),
          listing({ url: 'x2', title: 'Product Designer' }),
          listing({ url: 'x3', title: 'Recruiting Coordinator' }),
        ],
      },
    ]
    const plan = planSourcing(fetched, new Set(), { maxAgeDays: 30 })
    expect(plan.work.length).toBe(0)
    expect(plan.skippedIrrelevant).toBe(3)
  })
})
