import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

// next/navigation's useRouter is the only hard dependency the deck needs in jsdom.
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }))

import DecisionDeck, { type FollowUpItem } from '../DecisionDeck'
import type { Reminder } from '@/lib/engine/reminders'

const reminder: Reminder = {
  id: 42,
  role_id: 7,
  kind: 'send_outreach',
  due_at: '2026-06-15T00:00:00Z',
  completed_at: null,
  snoozed_until: null,
  notes: null,
  created_at: '2026-06-01T00:00:00Z',
  company: 'Harvey',
  title: 'Mid Market Account Executive',
  outreachDraft: 'Hi [Name], ...',
}

describe('DecisionDeck — follow-up snooze', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ ok: true }) })
  })

  it('sends a valid { days } body the snooze route accepts (was POST with no body → 400)', async () => {
    const item: FollowUpItem = { type: 'followup', reminder }
    render(<DecisionDeck items={[item]} />)

    fireEvent.click(screen.getByText('Snooze'))

    await waitFor(() => expect(global.fetch).toHaveBeenCalled())
    const [url, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(url).toBe('/api/engine/reminders/42/snooze')
    expect(init.method).toBe('POST')
    // The route requires { days: 1 | 3 | 7 }; an empty POST returns 400. Assert
    // the deck actually sends a body the route will accept.
    expect(init.body, 'snooze must send a JSON body').toBeTruthy()
    const parsed = JSON.parse(init.body)
    expect([1, 3, 7]).toContain(parsed.days)
  })
})
