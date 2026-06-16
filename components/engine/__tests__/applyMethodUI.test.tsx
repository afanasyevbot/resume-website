import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ApplyBadge from '../ApplyBadge'
import PipelineStrip from '../PipelineStrip'
import type { KpiCounts } from '@/lib/engine/dashboard'

describe('ApplyBadge', () => {
  it('labels each method bucket', () => {
    expect(render(<ApplyBadge method="auto" />).getByText('Auto-applied')).toBeTruthy()
    expect(render(<ApplyBadge method="one-click" />).getByText('You approved')).toBeTruthy()
    expect(render(<ApplyBadge method="manual" />).getByText('You applied')).toBeTruthy()
  })
})

describe('PipelineStrip — Applied tile split', () => {
  const counts: KpiCounts = {
    sourced: 10,
    inQueue: 3,
    applied: 6,
    appliedBreakdown: { autonomous: 2, approved: 1, self: 3, unknown: 0 },
    responded: 0,
    draftsToSend: 0,
  }

  it('shows the auto / approved / by-you breakdown under Applied', () => {
    render(<PipelineStrip counts={counts} rows={[]} />)
    expect(screen.getByText(/2 auto.*1 approved.*3 by you/)).toBeTruthy()
  })

  it('omits zero buckets from the breakdown', () => {
    render(
      <PipelineStrip
        counts={{ ...counts, applied: 2, appliedBreakdown: { autonomous: 2, approved: 0, self: 0, unknown: 0 } }}
        rows={[]}
      />,
    )
    expect(screen.getByText('2 auto')).toBeTruthy()
  })
})
