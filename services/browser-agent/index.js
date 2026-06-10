const express = require('express')
const { chromium } = require('playwright')
const { writeFileSync, mkdirSync } = require('fs')
const { join } = require('path')
const { matchAnswer } = require('./answer')
const { classifyAtsUrl, isDeadGreenhouseListing } = require('./detect')

const app = express()
app.use(express.json({ limit: '5mb' }))

const PORT = process.env.PORT || 4100
const SECRET = process.env.BROWSER_SERVICE_SECRET || ''

// ── Auth middleware ──────────────────────────────────────────────────

function auth(req, res, next) {
  if (!SECRET) return res.status(500).json({ error: 'BROWSER_SERVICE_SECRET not set' })
  const token = req.headers.authorization
  if (token !== `Bearer ${SECRET}`) return res.status(401).json({ error: 'unauthorized' })
  next()
}

// ── ATS form detection + filling ────────────────────────────────────

/** Detect which ATS type a page is, or 'unknown'. Checks the requested URL
 *  too — Greenhouse boards links often redirect to the company careers site. */
async function detectAtsType(page, requestedUrl) {
  const fromUrl = classifyAtsUrl(requestedUrl, page.url())
  if (fromUrl) return fromUrl
  // Check for Greenhouse/Ashby iframes or known form selectors
  const hasGreenhouse = await page.$('#application_form, form#s2-application, [data-gapi-analytics-id]').catch(() => null)
  if (hasGreenhouse) return 'greenhouse'
  const hasAshby = await page.$('[class*="ashby"], form[action*="ashby"]').catch(() => null)
  if (hasAshby) return 'ashby'
  return 'unknown'
}

/** Check for blockers that mean we should skip to manual queue.
 *  IMPORTANT: reCAPTCHA v3 (invisible) is NOT a blocker — it runs silently and
 *  most Greenhouse forms accept low-score submissions. Only visible CAPTCHA
 *  challenges (v2 checkbox, hCaptcha) are blockers. */
async function detectBlockers(page) {
  const blockers = []

  // Visible CAPTCHA challenge (reCAPTCHA v2 checkbox or hCaptcha)
  const visibleRecaptcha = await page.$('iframe[src*="recaptcha"][title*="challenge" i]').catch(() => null)
  const hcaptcha = await page.$('iframe[src*="hcaptcha"]').catch(() => null)
  if (visibleRecaptcha || hcaptcha) blockers.push('captcha_visible')

  // reCAPTCHA v3 (invisible) is fine — just note it for logging
  const invisibleRecaptcha = await page.$('textarea[name="g-recaptcha-response"]').catch(() => null)
  if (invisibleRecaptcha) {
    console.log('reCAPTCHA v3 (invisible) detected — proceeding (most forms accept low scores)')
  }

  // Login wall
  const hasLogin = await page.$('input[type="password"], [class*="login-form"], [data-testid="login"]').catch(() => null)
  if (hasLogin) blockers.push('login_required')

  return blockers
}

/** Fill a Greenhouse application form. Returns true if successfully filled.
 *  Greenhouse uses simple #id selectors: #first_name, #last_name, #email,
 *  #phone, #resume (file input). LinkedIn is a custom question with varying ID. */
async function fillGreenhouse(page, data) {
  try {
    // Core fields (by #id — the reliable Greenhouse pattern)
    await page.fill('#first_name', data.firstName, { timeout: 5000 })
    await page.fill('#last_name', data.lastName, { timeout: 3000 })
    await page.fill('#email', data.email, { timeout: 3000 })

    // Phone
    const phoneInput = await page.$('#phone')
    if (phoneInput) await phoneInput.fill(data.phone)

    // LinkedIn — custom question, find by label text
    const linkedinInput = await page.$('input[id*="linkedin" i]')
      || await page.locator('label:has-text("LinkedIn") + input, label:has-text("LinkedIn") ~ input').first().elementHandle().catch(() => null)
    if (linkedinInput && data.linkedin) await linkedinInput.fill(data.linkedin)

    // Resume upload (file input with id="resume" or first file input)
    const fileInput = await page.$('#resume') || await page.$('input[type="file"]')
    if (fileInput && data.resumePath) {
      await fileInput.setInputFiles(data.resumePath)
      await page.waitForTimeout(1000) // let the upload process
    }

    // Cover letter (textarea, if present)
    const coverTextarea = await page.$('#cover_letter, textarea[id*="cover_letter"]')
    if (coverTextarea && data.coverLetter) {
      await coverTextarea.fill(data.coverLetter)
    }

    return true
  } catch (err) {
    console.error('Greenhouse fill error:', err.message)
    return false
  }
}

/** Fill an Ashby application form. */
async function fillAshby(page, data) {
  try {
    // Ashby uses a React form with specific class patterns
    const nameInput = await page.$('input[name="name"], input[name="_systemfield_name"]')
    if (nameInput) await nameInput.fill(`${data.firstName} ${data.lastName}`)

    const emailInput = await page.$('input[name="email"], input[name="_systemfield_email"], input[type="email"]')
    if (emailInput) await emailInput.fill(data.email)

    const phoneInput = await page.$('input[name="phone"], input[name="_systemfield_phone"], input[type="tel"]')
    if (phoneInput) await phoneInput.fill(data.phone)

    const linkedinInput = await page.$('input[name*="linkedin" i], input[placeholder*="linkedin" i]')
    if (linkedinInput) await linkedinInput.fill(data.linkedin)

    // Resume
    const fileInput = await page.$('input[type="file"]')
    if (fileInput && data.resumePath) {
      await fileInput.setInputFiles(data.resumePath)
    }

    return true
  } catch (err) {
    console.error('Ashby fill error:', err.message)
    return false
  }
}

/** Extract every custom screening question on the form: label, type, options,
 *  whether it's required, and a selector to fill it. Core fields (name/email/
 *  phone/resume/cover) are excluded — those are handled separately. */
async function extractQuestions(page) {
  return await page.evaluate(() => {
    const CORE = new Set(['first_name', 'last_name', 'email', 'phone', 'resume', 'cover_letter', 'full_name', 'name'])
    const clean = (s) => (s || '').replace(/\s+/g, ' ').replace(/\*/g, '').trim()
    const sel = (el) => {
      if (el.id) return '#' + CSS.escape(el.id)
      if (el.name) return el.tagName.toLowerCase() + '[name="' + CSS.escape(el.name) + '"]'
      return null
    }
    const out = []
    const seenRadioGroups = new Set()
    const controls = Array.from(document.querySelectorAll('input, select, textarea'))

    for (const el of controls) {
      const tag = el.tagName.toLowerCase()
      const itype = (el.getAttribute('type') || '').toLowerCase()
      if (['hidden', 'file', 'submit', 'button', 'search'].includes(itype)) continue
      const id = el.id || ''
      const name = el.name || ''
      if (CORE.has(id) || CORE.has(name)) continue

      // Label: prefer label[for=id], else nearest container label/legend.
      let label = ''
      if (id) {
        const l = document.querySelector('label[for="' + CSS.escape(id) + '"]')
        if (l) label = l.textContent
      }
      if (!label) {
        const wrap = el.closest('.field, [class*="field"], [class*="question"], fieldset, [class*="form-group"]')
        const l = wrap && wrap.querySelector('label, legend')
        if (l) label = l.textContent
      }
      label = clean(label)
      if (!label) continue

      const required = el.hasAttribute('required') || el.getAttribute('aria-required') === 'true'

      if (itype === 'radio') {
        if (!name || seenRadioGroups.has(name)) continue
        seenRadioGroups.add(name)
        const radios = Array.from(document.querySelectorAll('input[type="radio"][name="' + CSS.escape(name) + '"]'))
        const optionRefs = radios
          .map((r) => {
            let t = ''
            if (r.id) { const rl = document.querySelector('label[for="' + CSS.escape(r.id) + '"]'); if (rl) t = rl.textContent }
            if (!t) t = r.value
            return { label: clean(t), selector: sel(r) }
          })
          .filter((o) => o.label && o.selector)
        // group label = fieldset legend if present
        const fs = el.closest('fieldset')
        const lg = fs && fs.querySelector('legend')
        if (lg) label = clean(lg.textContent)
        out.push({ label, type: 'radio', required, options: optionRefs.map((o) => o.label), optionRefs })
      } else if (tag === 'select') {
        const options = Array.from(el.options).map((o) => clean(o.textContent)).filter(Boolean)
        out.push({ label, type: 'select', required, options, selector: sel(el) })
      } else if (itype === 'checkbox') {
        out.push({ label, type: 'boolean', required, options: [], selector: sel(el) })
      } else if (tag === 'textarea') {
        out.push({ label, type: 'textarea', required, options: [], selector: sel(el) })
      } else {
        out.push({ label, type: 'text', required, options: [], selector: sel(el) })
      }
    }

    // Dedupe: React forms often render the same question more than once. Collapse
    // by (label + type), keeping the first (which carries a usable selector) and
    // treating the question as required if ANY copy is required.
    const byKey = new Map()
    for (const q of out) {
      const key = q.type + '::' + q.label.toLowerCase()
      if (byKey.has(key)) {
        if (q.required) byKey.get(key).required = true
      } else {
        byKey.set(key, q)
      }
    }
    return Array.from(byKey.values())
  })
}

/** Fill one answered question. Throws if it can't (caller decides to skip). */
async function applyAnswer(page, q, value) {
  if (q.type === 'select') {
    await page.selectOption(q.selector, { label: value }).catch(() => page.selectOption(q.selector, value))
  } else if (q.type === 'radio') {
    const ref = (q.optionRefs || []).find((o) => o.label === value)
    if (!ref) throw new Error('no radio option matched: ' + value)
    await page.check(ref.selector)
  } else if (q.type === 'boolean') {
    if (/^yes$/i.test(value)) await page.check(q.selector)
  } else {
    await page.fill(q.selector, String(value))
  }
}

/** Take a screenshot and return it as a base64 string. */
async function screenshotBase64(page) {
  const buf = await page.screenshot({ fullPage: true })
  return buf.toString('base64')
}

// ── Main apply endpoint ─────────────────────────────────────────────

app.post('/apply', auth, async (req, res) => {
  const {
    url,
    firstName,
    lastName,
    email,
    phone,
    linkedin,
    resumeBase64,
    coverLetter,
    screeningFacts = {},
    manualAnswers = {},
    dryRun = false,
  } = req.body

  if (!url || !firstName || !lastName || !email) {
    return res.status(400).json({ error: 'url, firstName, lastName, email required' })
  }

  let browser = null
  let tmpResumePath = null

  try {
    // Write resume PDF to a temp file for Playwright's setInputFiles
    if (resumeBase64) {
      const tmpDir = join('/tmp', 'browser-agent-' + Date.now())
      mkdirSync(tmpDir, { recursive: true })
      tmpResumePath = join(tmpDir, `Matthew_Afanasiev_Resume.pdf`)
      writeFileSync(tmpResumePath, Buffer.from(resumeBase64, 'base64'))
    }

    browser = await chromium.launch({ headless: true })
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    })
    const page = await context.newPage()

    // Navigate to the application URL
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })

    // Dead listing? Greenhouse redirects closed jobs to the board index with
    // ?error=true. Report it truthfully so the engine can retire the role
    // instead of queuing it for pointless manual review.
    if (isDeadGreenhouseListing(page.url())) {
      const screenshot = await screenshotBase64(page)
      return res.json({
        success: false,
        skipped: true,
        reason: 'job_not_found',
        atsType: 'greenhouse',
        screenshots: { initial: screenshot },
      })
    }

    // Detect ATS type
    const atsType = await detectAtsType(page, url)
    if (atsType === 'unknown') {
      const screenshot = await screenshotBase64(page)
      return res.json({
        success: false,
        skipped: true,
        reason: 'unknown_ats',
        atsType,
        screenshots: { initial: screenshot },
      })
    }

    // Check for blockers
    const blockers = await detectBlockers(page)
    if (blockers.length > 0) {
      const screenshot = await screenshotBase64(page)
      return res.json({
        success: false,
        skipped: true,
        reason: blockers.join(', '),
        atsType,
        screenshots: { initial: screenshot },
      })
    }

    // Fill the core fields first
    const fillData = { firstName, lastName, email, phone, linkedin, resumePath: tmpResumePath, coverLetter }
    let filled = false
    if (atsType === 'greenhouse') filled = await fillGreenhouse(page, fillData)
    else if (atsType === 'ashby') filled = await fillAshby(page, fillData)

    // Screening questions: answer truthfully from the facts sheet, or skip.
    // We extract every custom question, ask the pure matcher for an answer, and
    // SKIP the whole form if any REQUIRED question has no sheet answer — we never
    // submit a real application with a guessed or blank required field.
    const questions = await extractQuestions(page)
    // Resolve an answer: the truthful matcher first, then a human-provided answer
    // (from a Slack reply) keyed by the exact question label. Never invents.
    const resolveAnswer = (q) => {
      const fromFacts = matchAnswer(q, screeningFacts)
      if (fromFacts != null) return fromFacts
      if (manualAnswers && typeof manualAnswers[q.label] === 'string' && manualAnswers[q.label].trim()) {
        return manualAnswers[q.label]
      }
      return null
    }
    const answerPlan = questions.map((q) => ({
      label: q.label,
      type: q.type,
      required: q.required,
      value: resolveAnswer(q),
    }))
    const unanswered = answerPlan.filter((a) => a.value == null && a.required).map((a) => a.label)

    if (unanswered.length > 0) {
      const screenshot = await screenshotBase64(page)
      return res.json({
        success: false,
        skipped: true,
        reason: 'unanswerable_required: ' + unanswered.slice(0, 5).join(' | '),
        atsType,
        questions: answerPlan,
        screenshots: { initial: screenshot },
      })
    }

    // Fill every question we have a confident answer for.
    for (const q of questions) {
      const value = resolveAnswer(q)
      if (value == null) continue
      try {
        await applyAnswer(page, q, value)
      } catch (e) {
        if (q.required) {
          const screenshot = await screenshotBase64(page)
          return res.json({
            success: false,
            skipped: true,
            reason: 'answer_fill_failed: ' + q.label,
            atsType,
            questions: answerPlan,
            screenshots: { initial: screenshot },
          })
        }
      }
    }

    if (!filled) {
      const screenshot = await screenshotBase64(page)
      return res.json({
        success: false,
        skipped: true,
        reason: 'fill_failed',
        atsType,
        screenshots: { initial: screenshot },
      })
    }

    // Screenshot the filled form (pre-submit proof)
    const preSubmitScreenshot = await screenshotBase64(page)

    if (dryRun) {
      return res.json({
        success: false,
        dryRun: true,
        reason: 'dry_run_complete',
        atsType,
        questions: answerPlan,
        screenshots: { preSubmit: preSubmitScreenshot },
      })
    }

    // Click submit
    const urlBeforeSubmit = page.url()
    let submitClicked = false
    const submitSelectors = [
      'button[type="submit"]',
      'input[type="submit"]',
      'button:has-text("Submit")',
      'button:has-text("Apply")',
      'button:has-text("Submit Application")',
      'button:has-text("Submit application")',
    ]
    for (const sel of submitSelectors) {
      const btn = await page.$(sel)
      if (btn && await btn.isVisible()) {
        await btn.click()
        submitClicked = true
        break
      }
    }

    if (!submitClicked) {
      return res.json({
        success: false,
        skipped: true,
        reason: 'submit_button_not_found',
        atsType,
        screenshots: { preSubmit: preSubmitScreenshot },
      })
    }

    // Wait for navigation / confirmation
    await page.waitForTimeout(3000)
    const postSubmitScreenshot = await screenshotBase64(page)

    // ── Confirmation detection ──────────────────────────────────────
    // A clicked submit button is NOT proof of submission. We confirm only when
    // there is a positive signal AND no visible validation error. We bias toward
    // NOT confirming: a false "confirmed" silently loses a real application, while
    // a false "unconfirmed" just routes the role to manual review.
    const pageText = (await page.textContent('body')) || ''

    // Positive signal 1: an explicit success phrase (not just the word "submit",
    // which also appears on the unsubmitted form's button).
    const confirmPhrase =
      /thank you|application (?:was )?(?:submitted|received|sent)|successfully (?:applied|submitted)|we(?:'| ha)ve received your application|your application has been|confirmation/i
    const hasConfirmPhrase = confirmPhrase.test(pageText)

    // Positive signal 2: navigated away from the form and the form is gone.
    const urlAfterSubmit = page.url()
    const navigatedAway = urlAfterSubmit !== urlBeforeSubmit
    const formStillPresent = await page
      .$('#first_name, #email, input[name="name"], input[type="file"]')
      .then(Boolean)
      .catch(() => false)

    // Negative signal: a VISIBLE validation error left on the page → not submitted.
    const visibleErrorCount = await page
      .$$eval(
        '[aria-invalid="true"], .error, .field_error, .field-error, [class*="error-message"], [class*="errorMessage"]',
        (els) => els.filter((el) => el.offsetParent !== null && (el.textContent || '').trim().length > 0).length,
      )
      .catch(() => 0)

    const isConfirmed =
      (hasConfirmPhrase || (navigatedAway && !formStillPresent)) && visibleErrorCount === 0

    return res.json({
      success: isConfirmed,
      submitted: submitClicked,
      confirmed: isConfirmed,
      atsType,
      questions: answerPlan,
      confirmSignals: { hasConfirmPhrase, navigatedAway, formStillPresent, visibleErrorCount },
      screenshots: {
        preSubmit: preSubmitScreenshot,
        postSubmit: postSubmitScreenshot,
      },
    })
  } catch (err) {
    console.error('Apply error:', err)
    return res.status(500).json({
      success: false,
      error: err.message,
    })
  } finally {
    if (browser) await browser.close().catch(() => {})
    // Clean up temp resume file
    if (tmpResumePath) {
      try { require('fs').unlinkSync(tmpResumePath) } catch {}
      try { require('fs').rmdirSync(require('path').dirname(tmpResumePath)) } catch {}
    }
  }
})

// ── Health check ────────────────────────────────────────────────────

app.get('/health', (_, res) => res.json({ ok: true, time: new Date().toISOString() }))

// ── Start ───────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`Browser agent listening on port ${PORT}`)
})
