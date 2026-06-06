import { NextResponse } from 'next/server'
import { sql, tx } from '@/lib/engine/db'
import { professionalContext } from '@/lib/professionalContext'
import { buildResumePdf } from '@/lib/engine/pdf/resume'
import type { TailoredPackage } from '@/lib/engine/tailorTypes'
import { hasBudget } from '@/lib/engine/costGuard'
import { decideApplyOutcome } from '@/lib/engine/applyDecision'
import { loadScreeningFacts } from '@/lib/engine/screeningFacts'
import { notifySlack, buildAutoApplyRecap } from '@/lib/engine/notify'

export const runtime = 'nodejs'
// Browser submits run sequentially and can be slow; Vercel Pro allows up to 300s.
export const maxDuration = 300

const BROWSER_URL = process.env.BROWSER_SERVICE_URL ?? 'http://localhost:4100'
const BROWSER_SECRET = process.env.BROWSER_SERVICE_SECRET ?? ''

interface AutoApplyResult {
  roleId: number
  company: string
  title: string
  /** True only when the application was explicitly confirmed submitted. */
  success: boolean
  /** Submitted but unconfirmed, or couldn't be completed — Matthew handles it. */
  needsReview: boolean
  skipped: boolean
  reason: string | null
  /** Required questions the engine had no truthful answer for (drives the alert). */
  unanswered?: string[]
  atsType: string | null
}

/**
 * POST /api/engine/auto-apply
 * Body: { roleIds?: number[], maxApply?: number, dryRun?: boolean }
 *
 * Picks tailored roles on the safe whitelist and auto-submits them via the
 * browser agent service. Each role: generate resume PDF → call browser
 * service → persist result + events + reminders.
 */
interface RunOpts {
  roleIds?: number[]
  maxApply: number
  dryRun: boolean
  /** Minimum fit score for auto-picked roles (cron uses 80; the manual button 0). */
  minFit?: number
}

/** Shared engine for both the manual button (POST) and the daily cron (GET). */
async function runAutoApply(opts: RunOpts) {
  const { roleIds, maxApply, dryRun } = opts
  const minFit = opts.minFit ?? 0

  // Find eligible roles: tailored, route=tailor, url present (Greenhouse/Ashby)
  let roles: Array<{
    id: number
    company: string
    title: string
    url: string
    package_json: TailoredPackage
    package_id: number
  }>

  if (roleIds && roleIds.length > 0) {
    // Specific roles requested
    const rows = await sql`
      select r.id, r.company, r.title, r.url, p.package_json, p.id as package_id
      from roles r
      join lateral (
        select id, package_json from application_packages
        where role_id = r.id order by created_at desc limit 1
      ) p on true
      where r.id = any(${roleIds})
        and r.status = 'tailored'
        and r.route = 'tailor'
        and r.url is not null
        and p.package_json is not null
      limit ${maxApply}
    `
    roles = (rows as typeof roles).map((r) => ({
      ...r,
      id: Number(r.id),
      package_id: Number(r.package_id),
    }))
  } else {
    // Auto-pick: tailored roles on safe ATS whitelist
    const rows = await sql`
      select r.id, r.company, r.title, r.url, p.package_json, p.id as package_id
      from roles r
      join lateral (
        select id, package_json from application_packages
        where role_id = r.id order by created_at desc limit 1
      ) p on true
      where r.status = 'tailored'
        and r.route = 'tailor'
        and r.url is not null
        and (r.url like '%greenhouse.io%' or r.url like '%ashbyhq.com%')
        and coalesce(r.fit_score, 0) >= ${minFit}
        and p.package_json is not null
      order by r.fit_score desc nulls last
      limit ${maxApply}
    `
    roles = (rows as typeof roles).map((r) => ({
      ...r,
      id: Number(r.id),
      package_id: Number(r.package_id),
    }))
  }

  if (roles.length === 0) {
    return { applied: 0, needsReview: 0, skipped: 0, total: 0, dryRun, results: [], message: 'No eligible roles for auto-apply.' }
  }

  const results: AutoApplyResult[] = []
  const ctx = professionalContext
  // Load the screening answer sheet once (null if not yet seeded → forms with
  // required custom questions will skip to needs_review, which is safe).
  const screeningFacts = await loadScreeningFacts()

  for (const role of roles) {
    try {
      // Generate resume PDF
      const pdfBytes = await buildResumePdf(role.package_json, {
        company: role.company,
        title: role.title,
      })
      const resumeBase64 = Buffer.from(pdfBytes).toString('base64')

      // Call browser service
      const response = await fetch(`${BROWSER_URL}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${BROWSER_SECRET}`,
        },
        body: JSON.stringify({
          url: role.url,
          firstName: 'Matthew',
          lastName: 'Afanasiev',
          email: ctx.identity.email,
          phone: ctx.identity.phone,
          linkedin: `https://${ctx.identity.linkedin}`,
          resumeBase64,
          coverLetter: role.package_json.coverLetter,
          screeningFacts: screeningFacts ?? {},
          dryRun,
        }),
      })

      if (!response.ok) {
        const err = await response.text()
        results.push({
          roleId: role.id,
          company: role.company,
          title: role.title,
          success: false,
          needsReview: false,
          skipped: true,
          reason: `browser service error: ${response.status} ${err.slice(0, 200)}`,
          atsType: null,
        })
        continue
      }

      const result = (await response.json()) as {
        success?: boolean
        skipped?: boolean
        submitted?: boolean
        confirmed?: boolean
        dryRun?: boolean
        reason?: string
        atsType?: string
        questions?: Array<{ label: string; required: boolean; value: unknown }>
        screenshots?: { preSubmit?: string; postSubmit?: string; initial?: string }
      }

      const outcome = decideApplyOutcome(result, dryRun)
      const hasScreenshots = !!(result.screenshots?.preSubmit || result.screenshots?.postSubmit)

      if (outcome === 'applied') {
        // Confirmed submitted → mark applied + event + LinkedIn reminders (atomic)
        const detail = JSON.stringify({
          method: 'auto',
          atsType: result.atsType,
          confirmed: true,
          hasScreenshots,
        })
        await tx((txn) => [
          txn`update roles set status = 'applied', updated_at = now() where id = ${role.id}`,
          txn`insert into events (role_id, kind, detail) values (${role.id}, 'applied', ${detail}::jsonb)`,
          txn`insert into reminders (role_id, kind, due_at) values (${role.id}, 'linkedin_follow_up', now() + interval '3 days')`,
          txn`insert into reminders (role_id, kind, due_at) values (${role.id}, 'linkedin_check_in', now() + interval '7 days')`,
        ])

        results.push({
          roleId: role.id,
          company: role.company,
          title: role.title,
          success: true,
          needsReview: false,
          skipped: false,
          reason: null,
          atsType: result.atsType ?? null,
        })
      } else if (outcome === 'needs_review') {
        // Submit was clicked but NOT confirmed. Do NOT mark applied (would be a
        // false positive). Move to 'needs_review' so it (a) leaves the auto-apply
        // candidate pool — preventing a double-submit — and (b) surfaces in the
        // active queue for Matthew to verify by hand. No reminders: we don't know
        // it actually went through.
        const detail = JSON.stringify({
          method: 'auto',
          atsType: result.atsType,
          confirmed: false,
          hasScreenshots,
          note: 'Submit clicked but submission could not be confirmed — verify manually.',
        })
        await tx((txn) => [
          txn`update roles set status = 'needs_review', updated_at = now() where id = ${role.id}`,
          txn`insert into events (role_id, kind, detail) values (${role.id}, 'submit_unconfirmed', ${detail}::jsonb)`,
        ])

        results.push({
          roleId: role.id,
          company: role.company,
          title: role.title,
          success: false,
          needsReview: true,
          skipped: false,
          reason: 'submitted but unconfirmed — verify manually',
          atsType: result.atsType ?? null,
        })
      } else {
        // The engine got a real response but couldn't complete the form (captcha,
        // login wall, unanswerable required questions, …). Route to needs_review so
        // it surfaces for Matthew (and isn't retried forever). Capture the questions
        // it had no truthful answer for, so the alert can name them.
        const unanswered = (result.questions ?? [])
          .filter((q) => q.value == null && q.required)
          .map((q) => q.label)

        if (!dryRun) {
          const detail = JSON.stringify({ method: 'auto', reason: result.reason ?? outcome, unanswered })
          await tx((txn) => [
            txn`update roles set status = 'needs_review', updated_at = now() where id = ${role.id}`,
            txn`insert into events (role_id, kind, detail) values (${role.id}, 'needs_review', ${detail}::jsonb)`,
          ])
        }

        results.push({
          roleId: role.id,
          company: role.company,
          title: role.title,
          success: false,
          needsReview: !dryRun,
          skipped: dryRun,
          reason: result.reason ?? (outcome === 'failed' ? 'failed' : 'needs review'),
          unanswered,
          atsType: result.atsType ?? null,
        })
      }
    } catch (err) {
      results.push({
        roleId: role.id,
        company: role.company,
        title: role.title,
        success: false,
        needsReview: false,
        skipped: true,
        reason: err instanceof Error ? err.message : String(err),
        atsType: null,
      })
    }
  }

  const applied = results.filter((r) => r.success).length
  const needsReview = results.filter((r) => r.needsReview).length
  const skipped = results.filter((r) => r.skipped).length

  return { applied, needsReview, skipped, total: results.length, dryRun, results }
}

/** Daily safety cap on automatic submissions (a bug can't spray more than this). */
const DAILY_CAP = 5
/** Minimum fit score the cron will auto-submit. The manual button has no floor. */
const CRON_MIN_FIT = 80

/** How many roles were auto-applied (method=auto) since midnight UTC today. */
async function autoAppliedToday(): Promise<number> {
  const rows = await sql`
    select count(*)::int as n from events
    where kind = 'applied'
      and detail->>'method' = 'auto'
      and created_at >= date_trunc('day', now())
  `
  return Number((rows as Array<{ n: number }>)[0]?.n ?? 0)
}

/**
 * POST /api/engine/auto-apply — manual trigger (dashboard button).
 * Body: { roleIds?: number[], maxApply?: number, dryRun?: boolean }
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    roleIds?: number[]
    maxApply?: number
    dryRun?: boolean
  }
  if (!(await hasBudget())) {
    return NextResponse.json({ error: 'Monthly spend cap reached.' }, { status: 429 })
  }
  const report = await runAutoApply({
    roleIds: body.roleIds,
    maxApply: Math.min(body.maxApply ?? 5, 10),
    dryRun: body.dryRun ?? false,
    minFit: 0,
  })
  return NextResponse.json(report)
}

/**
 * GET /api/engine/auto-apply — daily cron. Auto-submits high-fit tailored roles
 * within the daily cap. Guardrails: CRON_SECRET auth, fit ≥ CRON_MIN_FIT, at
 * most DAILY_CAP submissions/day, confirmed-submission-only (handled downstream).
 */
export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET
  const auth = req.headers.get('authorization')
  if (!cronSecret || auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  if (!(await hasBudget())) {
    return NextResponse.json({ error: 'Monthly spend cap reached.' }, { status: 429 })
  }

  // Allow a safe dry-run via ?dryRun=1 for testing the cron path without submitting.
  const dryRun = new URL(req.url).searchParams.get('dryRun') === '1'

  const alreadyToday = await autoAppliedToday()
  const remaining = Math.max(0, DAILY_CAP - alreadyToday)
  if (remaining === 0) {
    return NextResponse.json({ ok: true, capReached: true, appliedToday: alreadyToday, cap: DAILY_CAP })
  }

  const report = await runAutoApply({ maxApply: remaining, dryRun, minFit: CRON_MIN_FIT })
  console.log('cron auto-apply:', JSON.stringify({ applied: report.applied, needsReview: report.needsReview, skipped: report.skipped, appliedToday: alreadyToday }))

  // Slack recap (no-op if SLACK_WEBHOOK_URL unset). Real runs only.
  if (!dryRun) {
    const recap = buildAutoApplyRecap(report.results, alreadyToday + report.applied, DAILY_CAP)
    if (recap) await notifySlack(recap)
  }

  return NextResponse.json({ ok: true, appliedToday: alreadyToday, cap: DAILY_CAP, ...report })
}
