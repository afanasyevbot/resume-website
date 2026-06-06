import { describe, it, expect } from 'vitest'
import { matchAnswer } from '../answer.js'

const FACTS = {
  identity: { linkedin: 'https://linkedin.com/in/matthewafanasiev', website: 'https://fidelisstrategy.net', phone: '651-468-1408', location: 'Minneapolis, MN' },
  country: 'United States',
  workAuthorized: true,
  needsSponsorship: false,
  remoteOk: true,
  willingToRelocate: true,
  baseSalary: 105000,
  ote: 180000,
  startDate: "3 weeks' notice",
  yearsSalesExperience: 5,
  howHeard: 'LinkedIn',
  gender: 'Male',
  raceEthnicity: 'White',
  sexualOrientation: 'Heterosexual',
}

const q = (label, type = 'text', options = []) => ({ label, type, options })

describe('matchAnswer — truthful answers from the sheet', () => {
  it('work authorization → Yes', () => {
    expect(matchAnswer(q('Are you legally authorized to work in the United States?', 'select', ['Yes', 'No']), FACTS)).toBe('Yes')
  })

  it('sponsorship → No (he does not need it)', () => {
    expect(matchAnswer(q('Will you now or in the future require visa sponsorship?', 'select', ['Yes', 'No']), FACTS)).toBe('No')
  })

  it('base salary field → base number', () => {
    expect(matchAnswer(q('Desired base salary'), FACTS)).toBe('105000')
  })

  it('OTE field → OTE number', () => {
    expect(matchAnswer(q('What is your target OTE?'), FACTS)).toBe('180000')
  })

  it('generic salary expectation → OTE (sales norm)', () => {
    expect(matchAnswer(q('Salary expectations'), FACTS)).toBe('180000')
  })

  it('start date → notice string', () => {
    expect(matchAnswer(q('When can you start?'), FACTS)).toBe("3 weeks' notice")
  })

  it('years of sales experience → 5', () => {
    expect(matchAnswer(q('How many years of B2B sales experience do you have?'), FACTS)).toBe('5')
  })

  it('how did you hear → picks the LinkedIn option', () => {
    expect(matchAnswer(q('How did you hear about us?', 'select', ['Indeed', 'LinkedIn', 'Referral']), FACTS)).toBe('LinkedIn')
  })

  it('gender → picks Male option', () => {
    expect(matchAnswer(q('Gender', 'select', ['Male', 'Female', 'Decline to self-identify']), FACTS)).toBe('Male')
  })

  it('race → picks White option', () => {
    expect(matchAnswer(q('Race/Ethnicity', 'select', ['White', 'Asian', 'Black or African American']), FACTS)).toBe('White')
  })

  it('veteran status → declines to self-identify', () => {
    expect(matchAnswer(q('Veteran status', 'select', ['I am a veteran', 'I am not a veteran', 'I decline to self-identify']), FACTS)).toBe('I decline to self-identify')
  })

  it('disability status → declines to self-identify', () => {
    expect(matchAnswer(q('Disability status', 'select', ['Yes, I have a disability', 'No, I do not have a disability', 'I do not wish to answer']), FACTS)).toBe('I do not wish to answer')
  })

  it('LinkedIn URL field → his profile URL', () => {
    expect(matchAnswer(q('LinkedIn Profile'), FACTS)).toBe('https://linkedin.com/in/matthewafanasiev')
  })

  it('phone (rendered as a custom question) → his phone', () => {
    expect(matchAnswer(q('Phone'), FACTS)).toBe('651-468-1408')
  })

  it('country → United States', () => {
    expect(matchAnswer(q('Country'), FACTS)).toBe('United States')
  })

  it('"address from which you plan on working" → location, NOT a relocation Yes', () => {
    const a = matchAnswer(q('What is the address from which you plan on working? If you would need to relocate...'), FACTS)
    expect(a).toBe('Minneapolis, MN')
    expect(a).not.toBe('Yes')
  })

  it('a genuine relocation yes/no still answers Yes', () => {
    expect(matchAnswer(q('Are you open to relocation for this role?'), FACTS)).toBe('Yes')
  })
})

describe('matchAnswer — SKIP on doubt (returns null, never guesses)', () => {
  it('years of experience with a SPECIFIC TOOL → null (not his sales years)', () => {
    expect(matchAnswer(q('How many years of experience do you have with Salesforce?'), FACTS)).toBeNull()
  })

  it('open essay question → null', () => {
    expect(matchAnswer(q('Why do you want to work here?', 'textarea'), FACTS)).toBeNull()
  })

  it('company-specific question → null', () => {
    expect(matchAnswer(q('Which of our product lines excites you most?', 'textarea'), FACTS)).toBeNull()
  })

  it('a multiple-choice question with no matching option → null', () => {
    // gender asked but options do not include Male → cannot answer truthfully
    expect(matchAnswer(q('Gender', 'select', ['Female', 'Non-binary']), FACTS)).toBeNull()
  })

  it('empty label → null', () => {
    expect(matchAnswer(q(''), FACTS)).toBeNull()
  })

  it('no facts → null', () => {
    expect(matchAnswer(q('Salary expectations'), null)).toBeNull()
  })
})
