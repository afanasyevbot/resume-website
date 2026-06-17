import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import InterviewPrep from '../InterviewPrep'
import type { InterviewPrep as Prep } from '@/lib/engine/interviewPrep'

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }))

const prep: Prep = {
  whyThisCompany: 'Harvey applies agentic AI to legal work, which maps to my builder-who-sells edge.',
  likelyQuestions: [{ question: 'Walk me through a complex deal.', angle: 'Use the Multi-Stakeholder STAR story.' }],
  objections: [{ objection: 'Only ~5 years of experience.', response: 'Top performer every role; lead with the rankings.' }],
  questionsToAsk: ['How does the AE team partner with product?'],
}

describe('InterviewPrep', () => {
  it('renders all four sections when prep exists', () => {
    render(<InterviewPrep roleId={1} initialPrep={prep} />)
    expect(screen.getByText(/maps to my builder-who-sells edge/)).toBeTruthy()
    expect(screen.getByText('Walk me through a complex deal.')).toBeTruthy()
    expect(screen.getByText(/Only ~5 years of experience/)).toBeTruthy()
    expect(screen.getByText('How does the AE team partner with product?')).toBeTruthy()
    expect(screen.getByText('Regenerate')).toBeTruthy()
  })

  it('shows a generate prompt when there is no prep yet', () => {
    render(<InterviewPrep roleId={1} initialPrep={null} />)
    expect(screen.getByText('Generate prep')).toBeTruthy()
    expect(screen.getByText(/No prep yet/)).toBeTruthy()
  })
})
