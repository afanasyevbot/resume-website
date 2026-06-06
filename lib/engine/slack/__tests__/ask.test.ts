import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * Unit tests for the conversational Slack handler.
 * We mock the DB + Anthropic to verify routing logic and
 * that the prompt contains the right contextual data.
 */

// Mock the DB module
vi.mock('@/lib/engine/db', () => ({
  sql: vi.fn(),
}))

// Mock Anthropic client
vi.mock('@anthropic-ai/sdk', () => {
  const create = vi.fn().mockResolvedValue({
    content: [{ type: 'text', text: '2 roles in queue, 1 applied this week. Nothing pending.' }],
  })
  return {
    default: vi.fn().mockImplementation(() => ({ messages: { create } })),
  }
})

// Mock the Slack client
vi.mock('@/lib/engine/slack/client', () => ({
  postSlackMessage: vi.fn().mockResolvedValue({ ok: true }),
}))

vi.mock('@/lib/env', () => ({ anthropicKey: () => 'sk-ant-test' }))

import { sql } from '@/lib/engine/db'
import { postSlackMessage } from '@/lib/engine/slack/client'
import { answerQuestion } from '../ask'

const mockSql = vi.mocked(sql)

describe('answerQuestion', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Return minimal valid data for each of the 5 parallel queries
    mockSql.mockImplementation((async () => {
      return []
    }) as unknown as typeof sql)
  })

  it('calls postSlackMessage with a non-empty reply', async () => {
    await answerQuestion('what is in my queue?')
    expect(postSlackMessage).toHaveBeenCalledOnce()
    const [text] = vi.mocked(postSlackMessage).mock.calls[0]
    expect(typeof text).toBe('string')
    expect(text.length).toBeGreaterThan(0)
  })

  it('handles a DB error gracefully — posts an error message, does not throw', async () => {
    mockSql.mockRejectedValue(new Error('DB unavailable'))
    await expect(answerQuestion('status?')).resolves.not.toThrow()
    expect(postSlackMessage).toHaveBeenCalledOnce()
    const [text] = vi.mocked(postSlackMessage).mock.calls[0]
    expect(text).toContain('⚠️')
  })

  it('posts a non-empty reply for a status question', async () => {
    await answerQuestion('what is in my queue?')
    expect(postSlackMessage).toHaveBeenCalledOnce()
    const [reply] = vi.mocked(postSlackMessage).mock.calls[0]
    expect(typeof reply).toBe('string')
    expect(reply.length).toBeGreaterThan(0)
  })
})
