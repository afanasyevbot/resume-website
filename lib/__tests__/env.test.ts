import { describe, it, expect } from 'vitest'
import { stripQuotes } from '../env'

describe('stripQuotes', () => {
  it('passes through an unquoted value unchanged', () => {
    expect(stripQuotes('sk-ant-abc123')).toBe('sk-ant-abc123')
  })

  it('strips surrounding double quotes', () => {
    expect(stripQuotes('"sk-ant-abc123"')).toBe('sk-ant-abc123')
  })

  it('strips surrounding single quotes', () => {
    expect(stripQuotes("'sk-ant-abc123'")).toBe('sk-ant-abc123')
  })

  it('leaves mismatched quotes intact', () => {
    expect(stripQuotes(`"sk-ant-abc123'`)).toBe(`"sk-ant-abc123'`)
    expect(stripQuotes(`'sk-ant-abc123"`)).toBe(`'sk-ant-abc123"`)
  })

  it('leaves a value with only a leading quote intact', () => {
    expect(stripQuotes('"sk-ant-abc123')).toBe('"sk-ant-abc123')
  })

  it('leaves a value with only a trailing quote intact', () => {
    expect(stripQuotes("sk-ant-abc123'")).toBe("sk-ant-abc123'")
  })
})
