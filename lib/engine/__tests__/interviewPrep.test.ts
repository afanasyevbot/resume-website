import { describe, it, expect } from 'vitest'
import type Anthropic from '@anthropic-ai/sdk'
import { generateInterviewPrep, isInterviewPrep, type InterviewPrepInput } from '../interviewPrep'

const input: InterviewPrepInput = {
  company: 'Harvey',
  title: 'Mid Market Account Executive',
  jdText: 'Sell our agentic AI platform to mid-market legal teams. 4+ years SaaS sales.',
  fitReasons: ['Mid-market AE in core lane', 'AI-native company'],
  segment: 'mid-market',
  aiNative: true,
}

const goodPrep = {
  whyThisCompany: 'Harvey applies agentic AI to legal work, which maps to my builder-who-sells edge.',
  likelyQuestions: [
    { question: 'Walk me through a complex multi-stakeholder deal.', angle: 'Use the Multi-Stakeholder Long Cycle STAR story.' },
  ],
  objections: [
    { objection: 'Only ~5 years of experience.', response: 'Top performer in every role; lead with the ranking stats.' },
  ],
  questionsToAsk: ['How does the AE team partner with product on the agent roadmap?'],
}

function fakeClient(text: string): Anthropic {
  return {
    messages: { create: async () => ({ content: [{ type: 'text', text }] }) },
  } as unknown as Anthropic
}

describe('isInterviewPrep', () => {
  it('accepts a well-formed prep', () => {
    expect(isInterviewPrep(goodPrep)).toBe(true)
  })

  it('rejects a non-string whyThisCompany', () => {
    expect(isInterviewPrep({ ...goodPrep, whyThisCompany: 123 })).toBe(false)
  })

  it('rejects a question missing its angle', () => {
    expect(isInterviewPrep({ ...goodPrep, likelyQuestions: [{ question: 'q' }] })).toBe(false)
  })

  it('rejects non-string questionsToAsk', () => {
    expect(isInterviewPrep({ ...goodPrep, questionsToAsk: [1, 2] })).toBe(false)
  })
})

describe('generateInterviewPrep', () => {
  it('parses a clean JSON response', async () => {
    const prep = await generateInterviewPrep(fakeClient(JSON.stringify(goodPrep)), input)
    expect(prep.whyThisCompany).toMatch(/Harvey/)
    expect(prep.likelyQuestions[0].angle).toMatch(/STAR/)
  })

  it('extracts JSON even when fenced', async () => {
    const wrapped = '```json\n' + JSON.stringify(goodPrep) + '\n```'
    const prep = await generateInterviewPrep(fakeClient(wrapped), input)
    expect(prep.questionsToAsk.length).toBeGreaterThan(0)
  })

  it('throws on an invalid shape', async () => {
    await expect(
      generateInterviewPrep(fakeClient(JSON.stringify({ whyThisCompany: 'x' })), input),
    ).rejects.toThrow()
  })
})
