import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mockFitResponse = {
  score: 82,
  verdict: 'Strong match — AI-Native AE',
  strengths: ['Net-new hunting track record', 'AI systems builder'],
  flags: ['No enterprise experience'],
  recommendation: 'Proceed',
}

vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(function () {
    return {
      messages: {
        create: vi.fn().mockResolvedValue({
          content: [{ type: 'text', text: JSON.stringify(mockFitResponse) }],
        }),
      },
    }
  }),
}))

describe('POST /api/fit', () => {
  beforeEach(() => {
    process.env.ANTHROPIC_API_KEY = 'test-key'
  })

  it('returns structured fit analysis for a valid JD', async () => {
    const { POST } = await import('../route')
    const request = new NextRequest('http://localhost/api/fit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobDescription: 'We need an AE with 3+ years SaaS experience...' }),
    })
    const response = await POST(request)
    const data = await response.json()
    expect(response.status).toBe(200)
    expect(data).toHaveProperty('score')
    expect(data).toHaveProperty('strengths')
    expect(data).toHaveProperty('flags')
    expect(data).toHaveProperty('recommendation')
    expect(typeof data.score).toBe('number')
    expect(Array.isArray(data.strengths)).toBe(true)
  })

  it('returns 400 if jobDescription is missing', async () => {
    const { POST } = await import('../route')
    const request = new NextRequest('http://localhost/api/fit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    const response = await POST(request)
    expect(response.status).toBe(400)
  })
})
