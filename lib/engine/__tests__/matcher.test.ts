import { describe, it, expect } from 'vitest'
import type Anthropic from '@anthropic-ai/sdk'
import { assessRole, scoreRole, isMatchAssessment } from '../matcher'
import type { RoleInput } from '../types'

const role: RoleInput = {
  company: 'Acme AI',
  title: 'Mid-Market Account Executive',
  jobDescription: 'Sell our AI platform to mid-market buyers. 4+ years SaaS sales.',
}

function fakeClient(text: string): Anthropic {
  return {
    messages: {
      create: async () => ({ content: [{ type: 'text', text }] }),
    },
  } as unknown as Anthropic
}

const goodAssessment = {
  score: 82,
  reasons: ['AI-native', 'mid-market AE'],
  aiNative: true,
  segment: 'mid-market',
}

describe('isMatchAssessment', () => {
  it('accepts a well-formed assessment', () => {
    expect(isMatchAssessment(goodAssessment)).toBe(true)
  })

  it('rejects a bad segment', () => {
    expect(isMatchAssessment({ ...goodAssessment, segment: 'smb' })).toBe(false)
  })

  it('rejects a missing field', () => {
    expect(isMatchAssessment({ score: 80, reasons: [], aiNative: true })).toBe(false)
  })

  it('rejects a score above 100', () => {
    expect(isMatchAssessment({ ...goodAssessment, score: 150 })).toBe(false)
  })

  it('rejects a negative score', () => {
    expect(isMatchAssessment({ ...goodAssessment, score: -5 })).toBe(false)
  })

  it('rejects a non-integer score', () => {
    expect(isMatchAssessment({ ...goodAssessment, score: 82.5 })).toBe(false)
  })
})

describe('assessRole', () => {
  it('parses a clean JSON response', async () => {
    const result = await assessRole(fakeClient(JSON.stringify(goodAssessment)), role)
    expect(result.score).toBe(82)
    expect(result.aiNative).toBe(true)
  })

  it('extracts JSON even when wrapped in prose / code fences', async () => {
    const wrapped = '```json\n' + JSON.stringify(goodAssessment) + '\n```'
    const result = await assessRole(fakeClient(wrapped), role)
    expect(result.segment).toBe('mid-market')
  })

  it('throws when no JSON is present', async () => {
    await expect(assessRole(fakeClient('no json here'), role)).rejects.toThrow()
  })

  it('throws when the shape is invalid', async () => {
    await expect(
      assessRole(fakeClient(JSON.stringify({ score: 'high' })), role),
    ).rejects.toThrow()
  })
})

describe('scoreRole', () => {
  it('attaches a deterministic route to the assessment', async () => {
    const result = await scoreRole(fakeClient(JSON.stringify(goodAssessment)), role)
    expect(result.route).toBe('tailor')
  })

  it('caps an enterprise role at flag', async () => {
    const ent = { ...goodAssessment, score: 95, segment: 'enterprise' }
    const result = await scoreRole(fakeClient(JSON.stringify(ent)), role)
    expect(result.route).toBe('flag')
  })
})
