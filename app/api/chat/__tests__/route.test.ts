import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(function () {
    return {
      messages: {
        create: vi.fn().mockResolvedValue({
          content: [{ type: 'text', text: 'Test response from Claude' }],
        }),
      },
    }
  }),
}))

describe('POST /api/chat', () => {
  beforeEach(() => {
    process.env.ANTHROPIC_API_KEY = 'test-key'
  })

  it('returns a reply for a valid message', async () => {
    const { POST } = await import('../route')
    const request = new NextRequest('http://localhost/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'What are his deal sizes?', history: [] }),
    })
    const response = await POST(request)
    const data = await response.json()
    expect(response.status).toBe(200)
    expect(data).toHaveProperty('reply')
    expect(typeof data.reply).toBe('string')
  })

  it('returns 400 if message is missing', async () => {
    const { POST } = await import('../route')
    const request = new NextRequest('http://localhost/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ history: [] }),
    })
    const response = await POST(request)
    expect(response.status).toBe(400)
  })
})
