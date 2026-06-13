import { describe, it, expect } from 'vitest'
import { assessCronHealth } from '../health'

const NOW = new Date('2026-06-12T12:00:00Z')

describe('assessCronHealth — cron heartbeat', () => {
  it('marks a cron fresh when it ran within its window', () => {
    const h = assessCronHealth(
      [{ kind: 'source_run', lastRunAt: '2026-06-12T08:00:00Z', detail: null }],
      NOW,
    )
    expect(h.crons.find((c) => c.kind === 'source_run')!.stale).toBe(false)
  })

  it('anyStale is false only when ALL three crons are fresh', () => {
    const at = '2026-06-12T08:00:00Z' // 4h ago — fresh for all
    const h = assessCronHealth(
      [
        { kind: 'source_run', lastRunAt: at, detail: null },
        { kind: 'auto_apply_run', lastRunAt: at, detail: null },
        { kind: 'research_run', lastRunAt: at, detail: null },
      ],
      NOW,
    )
    expect(h.anyStale).toBe(false)
  })

  it('marks a cron stale once it is past its absolute threshold (source: 26h)', () => {
    // 30h ago > 26h threshold → stale.
    const h = assessCronHealth(
      [{ kind: 'source_run', lastRunAt: '2026-06-11T06:00:00Z', detail: null }],
      NOW,
    )
    expect(h.crons.find((c) => c.kind === 'source_run')!.stale).toBe(true)
    expect(h.anyStale).toBe(true)
  })

  it('does NOT flag a normal overnight gap as stale (16h < 26h)', () => {
    // Evening source run at 20:00 yesterday, viewed at noon = 16h. Healthy.
    const h = assessCronHealth(
      [{ kind: 'source_run', lastRunAt: '2026-06-11T20:00:00Z', detail: null }],
      NOW,
    )
    expect(h.crons.find((c) => c.kind === 'source_run')!.stale).toBe(false)
  })

  it('treats a cron that has never run as stale', () => {
    const h = assessCronHealth([], NOW)
    expect(h.crons.every((c) => c.stale)).toBe(true)
    expect(h.crons.every((c) => c.lastRunAt === null)).toBe(true)
    expect(h.anyStale).toBe(true)
  })

  it('reports all three crons even when only one has run', () => {
    const h = assessCronHealth(
      [{ kind: 'auto_apply_run', lastRunAt: '2026-06-12T09:00:00Z', detail: null }],
      NOW,
    )
    expect(h.crons.map((c) => c.kind).sort()).toEqual(['auto_apply_run', 'research_run', 'source_run'])
  })

  it('extracts failedCompanies from the latest source_run detail', () => {
    const h = assessCronHealth(
      [{ kind: 'source_run', lastRunAt: '2026-06-12T08:00:00Z', detail: { failedCompanies: ['Groq', 'Stampli'] } }],
      NOW,
    )
    expect(h.failedCompanies).toEqual(['Groq', 'Stampli'])
    expect(h.crons.find((c) => c.kind === 'source_run')!.failedCompanies).toEqual(['Groq', 'Stampli'])
  })

  it('research gets a longer leash (30h) since it runs once a day', () => {
    // 28h ago: stale for source (26h) but fresh for research (30h).
    const at = '2026-06-11T08:00:00Z'
    const h = assessCronHealth(
      [
        { kind: 'source_run', lastRunAt: at, detail: null },
        { kind: 'research_run', lastRunAt: at, detail: null },
      ],
      NOW,
    )
    expect(h.crons.find((c) => c.kind === 'source_run')!.stale).toBe(true)
    expect(h.crons.find((c) => c.kind === 'research_run')!.stale).toBe(false)
  })
})
