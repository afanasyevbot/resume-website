import { describe, it, expect } from 'vitest'
import { passesLocationGate, locationExclusionReason } from '../locationGate'

describe('passesLocationGate — hard geographic filter before tailoring/applying', () => {
  it('remote always passes, regardless of any listed state', () => {
    expect(passesLocationGate('remote', [])).toBe(true)
    expect(passesLocationGate('remote', ['CA'])).toBe(true)
  })

  it('excludes the case that leaked: onsite in San Francisco (CA)', () => {
    expect(passesLocationGate('onsite', ['CA'])).toBe(false)
  })

  it('allows onsite in every target metro/state', () => {
    for (const state of ['MN', 'IL', 'NC', 'SC', 'FL', 'TN']) {
      expect(passesLocationGate('onsite', [state])).toBe(true)
    }
  })

  it('allows Tennessee specifically (added 2026-06-15)', () => {
    expect(passesLocationGate('onsite', ['TN'])).toBe(true)
    expect(passesLocationGate('hybrid', ['TN'])).toBe(true)
  })

  it('treats hybrid like onsite for the gate', () => {
    expect(passesLocationGate('hybrid', ['NY'])).toBe(false)
    expect(passesLocationGate('hybrid', ['FL'])).toBe(true)
  })

  it('passes when ANY required location is in the target set', () => {
    expect(passesLocationGate('onsite', ['CA', 'TN'])).toBe(true)
    expect(passesLocationGate('onsite', ['NY', 'WA'])).toBe(false)
  })

  it('is case-insensitive on state codes', () => {
    expect(passesLocationGate('onsite', ['ca'])).toBe(false)
    expect(passesLocationGate('onsite', ['fl'])).toBe(true)
  })

  it('fails OPEN on unknown workplace (could be remote — never silently drop)', () => {
    expect(passesLocationGate('unknown', [])).toBe(true)
    expect(passesLocationGate('unknown', ['CA'])).toBe(true)
  })

  it('fails OPEN when onsite but the location is unparseable/empty', () => {
    expect(passesLocationGate('onsite', [])).toBe(true)
  })
})

describe('locationExclusionReason — human-readable why', () => {
  it('names the offending location and the target list', () => {
    const reason = locationExclusionReason('onsite', ['CA'])
    expect(reason).toMatch(/CA/)
    expect(reason.toLowerCase()).toMatch(/onsite/)
    expect(reason).toMatch(/TN/) // shows the allowed set, which now includes Tennessee
  })
})
