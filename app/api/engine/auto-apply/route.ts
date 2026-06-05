import { NextResponse } from 'next/server'
import { sql, tx } from '@/lib/engine/db'
import { professionalContext } from '@/lib/professionalContext'
import { buildResumePdf } from '@/lib/engine/pdf/resume'
import type { TailoredPackage } from '@/lib/engine/tailorTypes'
import { hasBudget } from '@/lib/engine/costGuard'
import { decideApplyOutcome } from '@/lib/engine/applyDecision'
import { loadScreeningFacts } from '@/lib/engine/screeningFacts'

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
  /** Submitted but unconfirmed — Matthew should verify manually. */
  needsReview: boolean
  skipped: boolean
  reason: string | null
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
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    roleIds?: number[]
    maxApply?: number
    dryRun?: boolean
  }
  const maxApply = Math.min(body.maxApply ?? 5, 10)
  const dryRun = body.dryRun ?? false

  // Budget check (auto-apply doesn't call Claude, but the PDF generation is cheap
  // and we want the overall system to respect the cap).
  if (!(await hasBudget())) {
    return NextResponse.json({ error: 'Monthly spend cap reached.' }, { status: 429 })
  }

  // Find eligible roles: tailored, route=tailor, url present (Greenhouse/Ashby)
  let roles: Array<{
    id: number
    company: string
    title: string
    url: string
    package_json: TailoredPackage
    package_id: number
  }>

  if (body.roleIds && body.roleIds.length > 0) {
    // Specific roles requested
    const rows = await sql`
      select r.id, r.company, r.title, r.url, p.package_json, p.id as package_id
      from roles r
      join lateral (
        select id, package_json from application_packages
        where role_id = r.id order by created_at desc limit 1
      ) p on true
      where r.id = any(${body.roleIds})
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
    return NextResponse.json({ message: 'No eligible roles for auto-apply.', results: [] })
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
        // Skipped (blocker/gate) or failed — leave role status unchanged.
        results.push({
          roleId: role.id,
          company: role.company,
          title: role.title,
          success: false,
          needsReview: false,
          skipped: outcome === 'skipped',
          reason: result.reason ?? (outcome === 'failed' ? 'failed' : 'unknown'),
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

  return NextResponse.json({
    applied,
    needsReview,
    skipped,
    total: results.length,
    dryRun,
    results,
  })
}
