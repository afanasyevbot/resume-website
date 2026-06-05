'use strict'

/**
 * Pure screening-question answerer.
 *
 * Maps a single form question to a TRUTHFUL answer drawn ONLY from the provided
 * facts sheet. Returns null when it cannot answer confidently — the caller MUST
 * then skip the form to manual review rather than guess. No fact is ever
 * invented here: every returned value traces to a field on `facts`, and for
 * multiple-choice questions the answer must literally be one of the options.
 *
 * Design: skip-on-doubt. When in doubt, return null. A skipped form costs a
 * manual review; a wrong answer goes out on a real application under his name.
 */

/** Choose the option whose text matches `re`; null if none present. */
function pickOption(options, re) {
  if (!Array.isArray(options)) return null
  const hit = options.find((o) => typeof o === 'string' && re.test(o))
  return hit || null
}

/**
 * @param {{label:string,type:string,options?:string[]}} question
 * @param {object} facts
 * @returns {string|null} the value/option text to fill, or null to skip
 */
function matchAnswer(question, facts) {
  if (!question || !facts) return null
  const label = (question.label || '').replace(/\s+/g, ' ').trim()
  if (!label) return null
  const type = question.type || 'text'
  const opts = Array.isArray(question.options) ? question.options : []
  const L = label.toLowerCase()
  const choice = type === 'select' || type === 'radio' || type === 'boolean'

  // Answer a yes/no question: pick the Yes/No option for choice inputs, else text.
  const yesno = (val) => {
    if (choice) return pickOption(opts, val ? /\byes\b/i : /\bno\b/i) || (val ? 'Yes' : 'No')
    return val ? 'Yes' : 'No'
  }

  // 0a. Phone (some forms render it as a custom question, not a core field).
  if (/\bphone\b|telephone|mobile number|cell( phone| number)?/.test(L)) {
    return (facts.identity && facts.identity.phone) || null
  }

  // 0b. Country.
  if (/^country\b|country of (residence|origin)|what country|which country|country\/region/.test(L)) {
    if (choice) return pickOption(opts, /united states|^usa$|u\.s\.a?\.?$|^us$/i)
    return facts.country || null
  }

  // 0c. Work-location / address question (must come BEFORE relocation so an
  //     "address" question never gets a yes/no relocation answer).
  if (/address.*work|work.*address|where.*(plan|will|do you).*work|work location|location you.*work/.test(L)) {
    return (facts.identity && facts.identity.location) || null
  }

  // 1. Work authorization (US). Exclude background-check authorizations.
  if (
    /(authori[sz](e|ed|ation)|legally.*(work|employ)|work.*(eligib|authori)|right to work|eligible to work)/.test(L) &&
    /(work|employ|eligib)/.test(L) &&
    !/(background|reference|credit|drug)/.test(L)
  ) {
    return yesno(facts.workAuthorized === true)
  }

  // 2. Visa / sponsorship. "require sponsorship?" → needsSponsorship (false → No).
  if (/sponsor|visa/.test(L)) {
    return yesno(facts.needsSponsorship === true)
  }

  // 3. Remote-work willingness.
  if (/work remotely|willing.*remote|comfortable.*remote|remote work|open to remote/.test(L)) {
    return yesno(facts.remoteOk === true)
  }

  // 4. Relocation. Skip if the question is really about an address/location
  //    (guarded above), and leave region-picker questions for manual choice.
  if (/relocat/.test(L) && !/address/.test(L)) {
    if (choice && opts.length > 2) {
      return facts.willingToRelocate ? pickOption(opts, /\byes\b/i) : pickOption(opts, /\bno\b/i)
    }
    return yesno(facts.willingToRelocate === true)
  }

  // 5. Salary / compensation. base → baseSalary; OTE/total → ote; generic → ote.
  if (
    /salary|compensation|base pay|desired pay|expected pay|expected compensation|pay expectation|comp expectation|\bote\b|on.?target earnings|total comp|target earnings/.test(
      L,
    )
  ) {
    let amount
    if (/\bbase\b/.test(L) && !/\bote\b|total|target/.test(L)) amount = facts.baseSalary
    else if (/\bote\b|total comp|target earnings|on.?target/.test(L)) amount = facts.ote
    else amount = facts.ote // generic "salary expectation" → OTE (sales norm)
    return amount != null ? String(amount) : null
  }

  // 6. Start date / notice / availability.
  if (/start date|when.*(start|begin)|notice period|availab(le|ility)|how soon.*(start|begin)|earliest.*start/.test(L)) {
    return facts.startDate || null
  }

  // 7. Years of SALES experience. Must be about selling, not a specific tool
  //    ("years of experience with Salesforce" → null).
  if (
    /years/.test(L) &&
    /(sales|selling|quota|closing|b2b|saas sales|account exec)/.test(L) &&
    !/\bwith\b/.test(L)
  ) {
    return facts.yearsSalesExperience != null ? String(facts.yearsSalesExperience) : null
  }

  // 8. How did you hear about us.
  if (/how did you hear|where did you hear|how.*find.*(us|this|role|position)|referral source|how were you referred/.test(L)) {
    if (choice) return pickOption(opts, /linkedin/i) || facts.howHeard || null
    return facts.howHeard || null
  }

  // 9. Gender.
  if (/\bgender\b|^sex$|what is your sex|gender identity/.test(L)) {
    if (choice) return pickOption(opts, /\bmale\b|\bman\b/i)
    return facts.gender || null
  }

  // 10. Race / ethnicity.
  if (/\brace\b|ethnicit/.test(L)) {
    if (choice) return pickOption(opts, /white/i)
    return facts.raceEthnicity || null
  }

  // 11. Sexual orientation.
  if (/sexual orientation|orientation/.test(L)) {
    if (choice) return pickOption(opts, /heterosexual|straight/i)
    return facts.sexualOrientation || null
  }

  // 12. Veteran status → decline to self-identify.
  if (/veteran|military service|protected veteran/.test(L)) {
    return pickOption(opts, /decline|don.?t wish|do not wish|prefer not|not.*identify|wish not/i)
  }

  // 13. Disability status → decline to self-identify.
  if (/disab(ility|led)/.test(L)) {
    return pickOption(opts, /decline|don.?t wish|do not wish|prefer not|not.*(wish|identify)/i)
  }

  // 14. LinkedIn profile URL.
  if (/linkedin/.test(L)) {
    return (facts.identity && facts.identity.linkedin) || null
  }

  // 15. Website / portfolio.
  if (/website|portfolio|personal site|github/.test(L)) {
    return (facts.identity && facts.identity.website) || null
  }

  // Unknown / essay / company-specific → cannot answer truthfully → skip.
  return null
}

module.exports = { matchAnswer, pickOption }
