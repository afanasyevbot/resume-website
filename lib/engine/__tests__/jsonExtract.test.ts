import { describe, it, expect } from 'vitest'
import { extractJsonObject } from '../jsonExtract'

describe('extractJsonObject', () => {
  it('returns plain JSON unchanged', () => {
    const raw = '{"a":1,"b":2}'
    expect(extractJsonObject(raw, 'test')).toBe(raw)
    expect(JSON.parse(extractJsonObject(raw, 'test'))).toEqual({ a: 1, b: 2 })
  })

  it('extracts JSON wrapped in a code fence', () => {
    const raw = '```json\n{"a":1}\n```'
    expect(JSON.parse(extractJsonObject(raw, 'test'))).toEqual({ a: 1 })
  })

  it('extracts JSON with prose before and after', () => {
    const raw = 'Here is the result:\n{"a":1,"b":"hi"}\nLet me know if you need more.'
    expect(JSON.parse(extractJsonObject(raw, 'test'))).toEqual({ a: 1, b: 'hi' })
  })

  it('handles nested objects', () => {
    const raw = 'prefix {"a":{"b":{"c":3}},"d":[1,2]} suffix'
    expect(JSON.parse(extractJsonObject(raw, 'test'))).toEqual({ a: { b: { c: 3 } }, d: [1, 2] })
  })

  it('ignores braces inside string values', () => {
    const raw = '{"text": "Hello { world }"} trailing prose'
    expect(JSON.parse(extractJsonObject(raw, 'test'))).toEqual({ text: 'Hello { world }' })
  })

  it('ignores escaped quotes inside strings', () => {
    const raw = '{"text": "she said \\"hi {there}\\""}'
    expect(JSON.parse(extractJsonObject(raw, 'test'))).toEqual({ text: 'she said "hi {there}"' })
  })

  it('throws when no JSON object is present', () => {
    expect(() => extractJsonObject('no json here', 'matcher')).toThrow(/matcher: no JSON/)
  })

  it('throws when braces never balance', () => {
    expect(() => extractJsonObject('{"a": 1', 'tailor')).toThrow(/tailor: no JSON/)
  })

  it('returns the FIRST balanced object when prose follows', () => {
    // Critical: the greedy bug would have spanned both objects.
    const raw = '{"a":1} and then some other text { not json'
    expect(JSON.parse(extractJsonObject(raw, 'test'))).toEqual({ a: 1 })
  })
})
