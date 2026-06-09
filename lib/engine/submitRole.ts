import { sql, tx } from './db'
import { professionalContext } from '../professionalContext'
import { buildResumePdf } from './pdf/resume'
import { decideApplyOutcome } from './applyDecision'
import { loadScreeningFacts } from './screeningFacts'
import { postSlackMessage } from './slack/client'
import { questionText } from './slack/blocks'
import type { TailoredPackage } from './tailorTypes'

function getBrowserUrl(): string {
  const u = process.env.BROWSER_SERVICE_URL
  if (!u) throw new Error('BROWSER_SERVICE_URL is not set. Add this env var pointing to your browser agent service.')
  return u
}

function getBrowserSecret(): string {
  const s = process.env.BROWSER_SERVICE_SECRET
  if (!s) throw new Error('BROWSER_SERVICE_SECRET is not set')
  return s
}

export interface EligibleRole {
  id: number
  company: string
  title: string
  url: string
  fit_score: number | null
  package_json: TailoredPackage
}

/** Load a single role + its latest package, or null if not submittable. */
export async function loadRoleForApply(roleId: number): Promise<EligibleRole | null> {
  const rows = await sql`
    select r.id, r.company, r.title, r.url, r.fit_score, p.package_json
    from roles r
    join lateral (
      select package_json from application_packages where role_id = r.id order by created_at desc limit 1
    ) p on true
    where r.id = ${roleId} and r.url is not null and p.package_json is not null
    limit 1
  `
  const r = (rows as Array<Record<string, unknown>>)[0]
  if (!r) return null
  return {
    id: Number(r.id),
    company: String(r.company),
    title: String(r.title),
    url: String(r.url),
    fit_score: r.fit_score == null ? null : Number(r.fit_score),
    package_json: r.package_json as TailoredPackage,
  }
}

export interface SubmitResult {
  outcome: 'applied' | 'needs_review' | 'skipped' | 'failed'
  company: string
  title: string
  reason: string | null
  unanswered: string[]
}

interface BrowserResult {
  success?: boolean
  submitted?: boolean
  confirmed?: boolean
  skipped?: boolean
  dryRun?: boolean
  reason?: string
  atsType?: string
  questions?: Array<{ label: string; required: boolean; value: unknown }>
  screenshots?: { preSubmit?: string; postSubmit?: string; initial?: string }
}

/**
 * Submit ONE role via the browser agent and persist the outcome. Shared by the
 * cron loop and the Slack approve/answer endpoints, so the confirmed-only
 * invariant lives in exactly one place.
 *
 * When it hits a required question it can't answer (and askOnSlack is on), it
 * posts the question to #job-engine and records a pending 'question' so a reply
 * can answer it — unless one is already open for this role.
 */
export async function submitAndPersist(
  role: EligibleRole,
  opts: { manualAnswers?: Record<string, string>; dryRun?: boolean; method?: string; askOnSlack?: boolean } = {},
): Promise<SubmitResult> {
  const dryRun = opts.dryRun ?? false
  const method = opts.method ?? 'auto'
  const askOnSlack = opts.askOnSlack ?? true
  const ctx = professionalContext
  const facts = await loadScreeningFacts()

  // Validate config before spending time on PDF generation
  const browserUrl = getBrowserUrl()
  const browserSecret = getBrowserSecret()

  let result: BrowserResult
  try {
    const pdfBytes = await buildResumePdf(role.package_json, { company: role.company, title: role.title })
    const response = await fetch(`${browserUrl}/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${browserSecret}` },
      body: JSON.stringify({
        url: role.url,
        firstName: 'Matthew',
        lastName: 'Afanasiev',
        email: ctx.identity.email,
        phone: ctx.identity.phone,
        linkedin: `https://${ctx.identity.linkedin}`,
        resumeBase64: Buffer.from(pdfBytes).toString('base64'),
        coverLetter: role.package_json.coverLetter,
        screeningFacts: facts ?? {},
        manualAnswers: opts.manualAnswers ?? {},
        dryRun,
      }),
    })
    if (!response.ok) {
      const err = await response.text()
      return { outcome: 'failed', company: role.company, title: role.title, reason: `browser ${response.status} ${err.slice(0, 120)}`, unanswered: [] }
    }
    result = (await response.json()) as BrowserResult
  } catch (err) {
    return { outcome: 'failed', company: role.company, title: role.title, reason: err instanceof Error ? err.message : String(err), unanswered: [] }
  }

  const outcome = decideApplyOutcome(result, dryRun)
  const hasScreenshots = !!(result.screenshots?.preSubmit || result.screenshots?.postSubmit)
  const unanswered = (result.questions ?? []).filter((q) => q.value == null && q.required).map((q) => q.label)

  if (outcome === 'applied') {
    const detail = JSON.stringify({ method, atsType: result.atsType, confirmed: true, hasScreenshots })
    if (!dryRun) {
      await tx((txn) => [
        txn`update roles set status = 'applied', updated_at = now() where id = ${role.id}`,
        txn`insert into events (role_id, kind, detail) values (${role.id}, 'applied', ${detail}::jsonb)`,
        txn`insert into reminders (role_id, kind, due_at) values (${role.id}, 'linkedin_follow_up', now() + interval '3 days')`,
        txn`insert into reminders (role_id, kind, due_at) values (${role.id}, 'linkedin_check_in', now() + interval '7 days')`,
      ])
    }
    return { outcome, company: role.company, title: role.title, reason: null, unanswered: [] }
  }

  if (outcome === 'needs_review') {
    // Submitted but unconfirmed.
    const detail = JSON.stringify({ method, atsType: result.atsType, confirmed: false, hasScreenshots, note: 'Submit clicked but not confirmed — verify manually.' })
    if (!dryRun) {
      await tx((txn) => [
        txn`update roles set status = 'needs_review', updated_at = now() where id = ${role.id}`,
        txn`insert into events (role_id, kind, detail) values (${role.id}, 'submit_unconfirmed', ${detail}::jsonb)`,
      ])
    }
    return { outcome, company: role.company, title: role.title, reason: 'submitted but unconfirmed', unanswered: [] }
  }

  // skipped / failed (couldn't complete) → needs_review, and ask the first
  // unanswerable question on Slack if we can.
  if (!dryRun) {
    const detail = JSON.stringify({ method, reason: result.reason ?? outcome, unanswered })
    await tx((txn) => [
      txn`update roles set status = 'needs_review', updated_at = now() where id = ${role.id}`,
      txn`insert into events (role_id, kind, detail) values (${role.id}, 'needs_review', ${detail}::jsonb)`,
    ])

    if (askOnSlack && unanswered.length > 0) {
      // Only ask if there isn't already an open question for this role.
      const open = await sql`select 1 from slack_pending where role_id = ${role.id} and kind = 'question' and status = 'pending' limit 1`
      if ((open as unknown[]).length === 0) {
        const q = unanswered[0]
        const posted = await postSlackMessage(questionText({ company: role.company, title: role.title, question: q }))
        if (posted.ok) {
          await sql`insert into slack_pending (role_id, kind, question, channel, message_ts, status)
                    values (${role.id}, 'question', ${q}, ${posted.channel ?? null}, ${posted.ts ?? null}, 'pending')`
        }
      }
    }
  }
  return { outcome: 'needs_review', company: role.company, title: role.title, reason: result.reason ?? 'needs review', unanswered }
}
