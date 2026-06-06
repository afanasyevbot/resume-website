import { describe, it, expect } from 'vitest'
import { statusFromRoute } from '../persistRole'

describe('statusFromRoute', () => {
  it('maps tailor → scored', () => {
    expect(statusFromRoute('tailor')).toBe('scored')
  })
  it('maps flag → scored', () => {
    expect(statusFromRoute('flag')).toBe('scored')
  })
  it('maps discard → discarded', () => {
    expect(statusFromRoute('discard')).toBe('discarded')
  })
})
