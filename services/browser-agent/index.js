const express = require('express')
const { chromium } = require('playwright')
const { writeFileSync, mkdirSync } = require('fs')
const { join } = require('path')

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

/** Detect which ATS type a page is, or 'unknown'. */
async function detectAtsType(page) {
  const url = page.url()
  if (url.includes('boards.greenhouse.io') || url.includes('job-boards.greenhouse.io')) return 'greenhouse'
  if (url.includes('jobs.ashbyhq.com')) return 'ashby'
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

/** Detect custom screening questions beyond standard fields.
 *  Greenhouse uses question_NNNNN IDs for custom questions. LinkedIn is one
 *  we can handle, so we allow 1 custom question (LinkedIn). More than that
 *  signals real screening we should skip for. */
async function hasScreeningQuestions(page, atsType) {
  if (atsType === 'greenhouse') {
    // Count question_NNNN inputs/textareas (excluding known-safe ones like LinkedIn)
    const customQuestions = await page.$$eval(
      'input[id^="question_"], textarea[id^="question_"]',
      (els) => els.filter((el) => {
        // Allow LinkedIn by checking the label
        const label = el.closest('.field')?.querySelector('label')?.textContent ?? ''
        if (/linkedin/i.test(label)) return false
        return true
      }).length,
    )
    // reCAPTCHA is handled separately in detectBlockers (v3 invisible is not a blocker).
    // Allow up to 1 custom question (e.g., "Where did you hear about us?")
    return customQuestions > 1
  }
  if (atsType === 'ashby') {
    // Ashby custom fields typically have data-testid patterns
    const customFields = await page.$$('div[data-testid*="custom"], div[class*="custom-question"]')
    return customFields.length > 1
  }
  return true // unknown ATS → assume has screening
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

    // Detect ATS type
    const atsType = await detectAtsType(page)
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

    // Check for custom screening questions
    if (await hasScreeningQuestions(page, atsType)) {
      const screenshot = await screenshotBase64(page)
      return res.json({
        success: false,
        skipped: true,
        reason: 'screening_questions',
        atsType,
        screenshots: { initial: screenshot },
      })
    }

    // Fill the form
    const fillData = { firstName, lastName, email, phone, linkedin, resumePath: tmpResumePath, coverLetter }
    let filled = false
    if (atsType === 'greenhouse') filled = await fillGreenhouse(page, fillData)
    else if (atsType === 'ashby') filled = await fillAshby(page, fillData)

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
        screenshots: { preSubmit: preSubmitScreenshot },
      })
    }

    // Click submit
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

    // Check if we landed on a confirmation page
    const pageText = await page.textContent('body')
    const isConfirmed = /thank|submitted|received|application.*sent|confirmation/i.test(pageText || '')

    return res.json({
      success: isConfirmed,
      submitted: submitClicked,
      confirmed: isConfirmed,
      atsType,
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
