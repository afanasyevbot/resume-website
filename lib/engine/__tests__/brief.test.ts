import { describe, it, expect } from 'vitest'
import { composeBrief, healthWarning } from '../brief'
import type { EngineHealth } from '../health'

const NOW = new Date('2026-06-12T12:00:00Z')

function health(partial: Partial<EngineHealth> & { crons: EngineHealth['crons'] }): EngineHealth {
  return { anyStale: partial.crons.some((c) => c.stale), failedCompanies: [], ...partial }
}

const freshCrons: EngineHealth['crons'] = [
  { kind: 'source_run', label: 'Sourcing', lastRunAt: '2026-06-12T08:00:00Z', stale: false, failedCompanies: [] },
  { kind: 'auto_apply_run', label: 'Auto-apply', lastRunAt: '2026-06-12T09:00:00Z', stale: false, failedCompanies: [] },
  { kind: 'research_run', label: 'Research', lastRunAt: '2026-06-12T08:30:00Z', stale: false, failedCompanies: [] },
]

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

  it('OVERRIDES a reassuring quiet brief when a cron is stale', () => {
    const stale = health({
      crons: [
        { kind: 'source_run', label: 'Sourcing', lastRunAt: '2026-06-10T08:00:00Z', stale: true, failedCompanies: [] },
        ...freshCrons.slice(1),
      ],
    })
    const text = composeBrief(
      { sinceLabel: '2h', scanned: 0, applied: [], held: [], retired: 0, decisions: 0 },
      stale,
      NOW,
    )
    // The warning must lead — a quiet day during an outage can't read as "all good".
    expect(text).toMatch(/something may be wrong/i)
    expect(text).toMatch(/sourcing hasn't run/i)
  })

  it('does not warn when every cron is fresh', () => {
    const text = composeBrief(
      { sinceLabel: '2h', scanned: 0, applied: [], held: [], retired: 0, decisions: 0 },
      health({ crons: freshCrons }),
      NOW,
    )
    expect(text).not.toMatch(/something may be wrong/i)
  })
})

describe('healthWarning — the one thing that overrides a calm brief', () => {
  it('returns null when everything is healthy', () => {
    expect(healthWarning(health({ crons: freshCrons }), NOW)).toBeNull()
  })

  it('names the stale cron and how long it has been', () => {
    const w = healthWarning(
      health({ crons: [{ kind: 'source_run', label: 'Sourcing', lastRunAt: '2026-06-10T12:00:00Z', stale: true, failedCompanies: [] }, ...freshCrons.slice(1)] }),
      NOW,
    )
    expect(w).toMatch(/sourcing hasn't run in 2d/i)
  })

  it('surfaces failed boards when nothing is stale', () => {
    const w = healthWarning(
      health({ crons: freshCrons, failedCompanies: ['Ramp', 'Vanta', 'Mercury', 'Brex'] }),
      NOW,
    )
    expect(w).toMatch(/4 job boards came back empty/i)
    expect(w).toMatch(/Ramp, Vanta, Mercury \+1 more/)
  })

  it('prioritizes a stale cron over failed boards', () => {
    const w = healthWarning(
      health({
        crons: [{ kind: 'source_run', label: 'Sourcing', lastRunAt: null, stale: true, failedCompanies: [] }, ...freshCrons.slice(1)],
        failedCompanies: ['Ramp'],
      }),
      NOW,
    )
    expect(w).toMatch(/never run/i)
    expect(w).not.toMatch(/came back empty/i)
  })
})
