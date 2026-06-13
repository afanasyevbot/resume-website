import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { sql } from '@/lib/engine/db'
import type { TailoredPackage } from '@/lib/engine/tailorTypes'
import { hasBudget } from '@/lib/engine/costGuard'
import { notifySlack, buildAutoApplyRecap } from '@/lib/engine/notify'
import { submitAndPersist } from '@/lib/engine/submitRole'
import { buildAutoApplyRunDetail, recordAutoApplyRun, tailoredExclusions, runAllFailed } from '@/lib/engine/autoApplyAudit'
import { postSlackMessage } from '@/lib/engine/slack/client'
import { approvalBlocks } from '@/lib/engine/slack/blocks'
import { checkApplyUrl } from '@/lib/engine/urlHealth'
import { verifySessionToken, SESSION_COOKIE } from '@/lib/engine/auth'
import { AUTO_FIT, TAILOR_FLOOR } from '@/lib/engine/thresholds'
import { SUBMITTABLE_ATS_ARR } from '@/lib/engine/ats/capability'

export const runtime = 'nodejs'
// Browser submits run sequentially and can be slow; Vercel Pro allows up to 300s.
export const maxDuration = 300

interface AutoApplyResult {
  roleId: number
  company: string
  title: string
  /** True only when the application was explicitly confirmed submitted. */
  success: boolean
  /** Submitted but unconfirmed, or couldn't be completed — Matthew handles it. */
  needsReview: boolean
  skipped: boolean
  /** Parked pending a Slack approval (borderline fit on the autonomous path). */
  awaitingApproval?: boolean
  /** Browser service threw or returned an error (service down, network, etc.). */
  failed: boolean
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
  /** Who triggered this — 'auto' (cron) counts against the daily cap; 'manual' doesn't. */
  method?: 'auto' | 'manual'
}

/** Shared engine for both the manual button (POST) and the daily cron (GET). */
async function runAutoApply(opts: RunOpts) {
  const { roleIds, maxApply, dryRun } = opts
  const minFit = opts.minFit ?? 0
  const method = opts.method ?? 'auto'

  // Find eligible roles: tailored, route=tailor, url present (Greenhouse/Ashby)
  let roles: Array<{
    id: number
    company: string
    title: string
    url: string
    fit_score: number | null
    package_json: TailoredPackage
  }>

  if (roleIds && roleIds.length > 0) {
    const rows = await sql`
      select r.id, r.company, r.title, r.url, r.fit_score, p.package_json
      from roles r
      join lateral (
        select package_json from application_packages
        where role_id = r.id order by created_at desc limit 1
      ) p on true
      where r.id = any(${roleIds})
        and r.status = 'tailored'
        and r.route = 'tailor'
        and r.url is not null
        and p.package_json is not null
      limit ${maxApply}
    `
    roles = (rows as typeof roles).map((r) => ({ ...r, id: Number(r.id), fit_score: r.fit_score == null ? null : Number(r.fit_score) }))
  } else {
    // Cron (auto) restricts to known-safe ATS platforms. Manual button is an
    // explicit human action so we let it try any URL — the browser service
    // will return skipped/needs_review for unsupported ATS types.
    // distinct on (url): if the same listing was sourced twice (e.g. via an
    // aggregator AND the ATS), only the highest-fit copy is eligible — never
    // submit the same application twice in one run.
    const rows = method === 'auto'
      ? await sql`
          select * from (
            select distinct on (r.url)
              r.id, r.company, r.title, r.url, r.fit_score, p.package_json
            from roles r
            join lateral (
              select package_json from application_packages
              where role_id = r.id order by created_at desc limit 1
            ) p on true
            where r.status = 'tailored'
              and r.route = 'tailor'
              and r.url is not null
              and r.ats_type = any(${SUBMITTABLE_ATS_ARR})
              and coalesce(r.fit_score, 0) >= ${minFit}
              and p.package_json is not null
            order by r.url, r.fit_score desc nulls last
          ) dedup
          order by dedup.fit_score desc nulls last
          limit ${maxApply}
        `
      : await sql`
          select * from (
            select distinct on (r.url)
              r.id, r.company, r.title, r.url, r.fit_score, p.package_json
            from roles r
            join lateral (
              select package_json from application_packages
              where role_id = r.id order by created_at desc limit 1
            ) p on true
            where r.status = 'tailored'
              and r.route = 'tailor'
              and r.url is not null
              and coalesce(r.fit_score, 0) >= ${minFit}
              and p.package_json is not null
            order by r.url, r.fit_score desc nulls last
          ) dedup
          order by dedup.fit_score desc nulls last
          limit ${maxApply}
        `
    roles = (rows as typeof roles).map((r) => ({ ...r, id: Number(r.id), fit_score: r.fit_score == null ? null : Number(r.fit_score) }))
  }

  if (roles.length === 0) {
    return { applied: 0, needsReview: 0, skipped: 0, failed: 0, awaitingApproval: 0, total: 0, dryRun, results: [], message: 'No eligible roles for auto-apply.' }
  }

  const results: AutoApplyResult[] = []

  for (const role of roles) {
    // Borderline fit on the AUTONOMOUS path → ask for approval instead of submitting.
    // The manual button (method='manual') is an explicit human action → no gating.
    if (method === 'auto' && !dryRun && role.fit_score != null && role.fit_score < AUTO_FIT) {
      const existing = await sql`select 1 from slack_pending where role_id = ${role.id} and kind = 'approval' and status = 'pending' limit 1`
      if ((existing as unknown[]).length === 0) {
        // Pre-flight: verify the listing is still live before interrupting Matthew.
        if (role.url) {
          const health = await checkApplyUrl(role.url)
          if (!health.ok) {
            await sql`update roles set status = 'discarded', updated_at = now() where id = ${role.id}`
            const detail = JSON.stringify({ url: role.url, method: 'pre-approval-check', reason: 'job_not_found', healthReason: health.reason })
            await sql`insert into events (role_id, kind, detail) values (${role.id}, 'job_not_found', ${detail}::jsonb)`
            results.push({ roleId: role.id, company: role.company, title: role.title, success: false, needsReview: false, skipped: true, failed: false, reason: `listing gone before approval sent: ${health.reason}`, atsType: null })
            continue
          }
        }

        const pend = await sql`insert into slack_pending (role_id, kind, status) values (${role.id}, 'approval', 'pending') returning id`
        const pendingId = Number((pend as Array<{ id: number }>)[0].id)
        const posted = await postSlackMessage(
          `Ready to apply: ${role.company} — ${role.title}`,
          approvalBlocks({ company: role.company, title: role.title, fit: role.fit_score, pendingId }),
        )
        if (posted.ok) {
          await sql`update slack_pending set channel = ${posted.channel ?? null}, message_ts = ${posted.ts ?? null} where id = ${pendingId}`
          // Park it so it isn't re-picked next run while awaiting the decision.
          await sql`update roles set status = 'awaiting_approval', updated_at = now() where id = ${role.id}`
          const detail = JSON.stringify({ method, fit: role.fit_score, autoFitFloor: AUTO_FIT })
          await sql`insert into events (role_id, kind, detail) values (${role.id}, 'awaiting_approval', ${detail}::jsonb)`
        } else {
          // Slack never got the approval request. Parking the role anyway would
          // strand it in 'awaiting_approval' with no message and no way out, so
          // leave it 'tailored' (retried next run) and record why.
          await sql`update slack_pending set status = 'failed' where id = ${pendingId}`
          const detail = JSON.stringify({ method, fit: role.fit_score, reason: 'slack approval message failed to post — role left tailored for retry' })
          await sql`insert into events (role_id, kind, detail) values (${role.id}, 'approval_post_failed', ${detail}::jsonb)`
          results.push({ roleId: role.id, company: role.company, title: role.title, success: false, needsReview: false, skipped: false, failed: true, reason: 'slack approval message failed to post', atsType: null })
          continue
        }
      }
      results.push({ roleId: role.id, company: role.company, title: role.title, success: false, needsReview: false, skipped: false, awaitingApproval: true, failed: false, reason: 'awaiting approval', atsType: null })
      continue
    }

    // Isolate each role: an unexpected throw (browser service down, PDF gen
    // failure, transient SQL error) fails THAT role and moves on, instead of
    // unwinding the whole cron run and losing the roles already processed.
    let r
    try {
      r = await submitAndPersist(
        { id: role.id, company: role.company, title: role.title, url: role.url, fit_score: role.fit_score, package_json: role.package_json },
        { dryRun, method, askOnSlack: method !== 'manual' },
      )
    } catch (err) {
      r = { outcome: 'failed' as const, company: role.company, title: role.title, reason: err instanceof Error ? err.message : String(err), unanswered: [] as string[], atsType: null }
    }
    results.push({
      roleId: role.id,
      company: role.company,
      title: role.title,
      success: r.outcome === 'applied',
      needsReview: r.outcome === 'needs_review' && !dryRun,
      skipped: r.outcome === 'skipped' || dryRun,
      failed: r.outcome === 'failed',
      reason: r.reason,
      unanswered: r.unanswered,
      atsType: r.atsType,
    })
  }

  const applied = results.filter((r) => r.success).length
  const needsReview = results.filter((r) => r.needsReview).length
  const skipped = results.filter((r) => r.skipped).length
  const failed = results.filter((r) => r.failed).length
  const awaitingApproval = results.filter((r) => r.awaitingApproval).length

  return { applied, needsReview, skipped, failed, awaitingApproval, total: results.length, dryRun, results }
}

/** Daily safety cap on automatic submissions (a bug can't spray more than this). */
const DAILY_CAP = 10
/** Minimum fit score the cron will pick a role up. Roles TAILOR_FLOOR..AUTO_FIT-1
 *  are held for approval; AUTO_FIT+ auto-submit. The manual button has no floor. */
const CRON_MIN_FIT = TAILOR_FLOOR

/** How many roles were auto-applied (method=auto, i.e. by the cron — NOT the
 *  manual button) since midnight UTC today. */
async function autoAppliedToday(): Promise<number> {
  const rows = await sql`
    select count(*)::int as n from events
    where kind = 'applied'
      and detail->>'method' = 'auto'
      and created_at >= date_trunc('day', now())
  `
  return Number((rows as Array<{ n: number }>)[0]?.n ?? 0)
}

/** ALL confirmed submissions today, any method — backs the global daily cap so
 *  a runaway manual loop can't spray applications past it either. */
async function appliedTodayAnyMethod(): Promise<number> {
  const rows = await sql`
    select count(*)::int as n from events
    where kind = 'applied'
      and created_at >= date_trunc('day', now())
  `
  return Number((rows as Array<{ n: number }>)[0]?.n ?? 0)
}

/** Try to claim the cron lease lock atomically. Returns false if another run
 *  already holds it (prevents two overlapping cron runs from both submitting). */
async function claimCronLock(name: string, minutes = 10): Promise<boolean> {
  const rows = await sql`
    insert into cron_locks (name, locked_until)
    values (${name}, now() + (${minutes} || ' minutes')::interval)
    on conflict (name) do update set locked_until = excluded.locked_until
    where cron_locks.locked_until < now()
    returning name
  `
  return (rows as unknown[]).length > 0
}

async function releaseCronLock(name: string): Promise<void> {
  await sql`update cron_locks set locked_until = now() where name = ${name}`
}

/**
 * Route tailored roles the engine CAN'T auto-submit (Lever/Workday/unknown ATS)
 * into manual review, so they land in the Decision Deck instead of sitting
 * 'tailored' forever, invisible. Returns how many were rerouted. Idempotent:
 * once a role is needs_review it's no longer 'tailored', so it won't re-fire.
 */
async function routeUnsubmittableToReview(): Promise<number> {
  const rows = await sql`
    update roles set status = 'needs_review', updated_at = now()
    where status = 'tailored' and route = 'tailor'
      and (ats_type is null or ats_type <> all(${SUBMITTABLE_ATS_ARR}))
    returning id, ats_type
  `
  for (const r of rows as Array<{ id: number; ats_type: string | null }>) {
    const detail = JSON.stringify({ method: 'auto', reason: 'no_submitter', atsType: r.ats_type })
    await sql`insert into events (role_id, kind, detail) values (${r.id}, 'needs_review', ${detail}::jsonb)`
  }
  return (rows as unknown[]).length
}

/**
 * POST /api/engine/auto-apply — manual trigger (dashboard button).
 * Body: { roleIds?: number[], maxApply?: number, dryRun?: boolean }
 */
export async function POST(req: Request) {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!(await verifySessionToken(token))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const body = (await req.json().catch(() => ({}))) as {
    roleIds?: number[]
    maxApply?: number
    dryRun?: boolean
  }
  if (!(await hasBudget())) {
    return NextResponse.json({ error: 'Monthly spend cap reached.' }, { status: 429 })
  }
  // The daily cap is global: manual submissions count against it too.
  const todayTotal = await appliedTodayAnyMethod()
  const remaining = Math.max(0, DAILY_CAP - todayTotal)
  if (remaining === 0 && !(body.dryRun ?? false)) {
    return NextResponse.json({ error: `Daily submission cap reached (${todayTotal}/${DAILY_CAP}).` }, { status: 429 })
  }
  const report = await runAutoApply({
    roleIds: body.roleIds,
    maxApply: Math.min(body.maxApply ?? 5, remaining || 1),
    dryRun: body.dryRun ?? false,
    minFit: 0,
    method: 'manual',
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

  // Atomic lease lock: refuse to run if another cron run is already in flight, so
  // two overlapping runs can't both submit past the daily cap. (Dry runs skip the
  // lock — they don't submit.)
  if (!dryRun && !(await claimCronLock('auto_apply'))) {
    return NextResponse.json({ ok: true, skipped: 'another run in progress' })
  }

  try {
    // Before applying, sweep tailored roles the engine can't auto-submit (Lever,
    // Workday, unknown ATS) into manual review so they reach the Decision Deck
    // instead of leaking out of the funnel. Cheap, idempotent, runs every cron.
    if (!dryRun) {
      const rerouted = await routeUnsubmittableToReview()
      if (rerouted > 0) console.log(`cron auto-apply: routed ${rerouted} no-submitter role(s) to manual review`)
    }

    const alreadyToday = await autoAppliedToday()
    const remaining = Math.max(0, DAILY_CAP - alreadyToday)
    if (remaining === 0) {
      const detail = buildAutoApplyRunDetail(
        { applied: 0, needsReview: 0, skipped: 0, failed: 0, awaitingApproval: 0, total: 0 },
        await tailoredExclusions(CRON_MIN_FIT),
        { dryRun, minFit: CRON_MIN_FIT, appliedToday: alreadyToday },
      )
      detail.summary = `daily cap reached (${alreadyToday}/${DAILY_CAP}) — ${detail.summary}`
      await recordAutoApplyRun(detail)
      return NextResponse.json({ ok: true, capReached: true, appliedToday: alreadyToday, cap: DAILY_CAP })
    }

    const report = await runAutoApply({ maxApply: remaining, dryRun, minFit: CRON_MIN_FIT, method: 'auto' })
    console.log('cron auto-apply:', JSON.stringify({ applied: report.applied, needsReview: report.needsReview, skipped: report.skipped, appliedToday: alreadyToday }))

    // Run-level audit event: every cron run leaves a record — including runs
    // that found nothing eligible, which used to be invisible.
    const runDetail = buildAutoApplyRunDetail(
      {
        applied: report.applied,
        needsReview: report.needsReview,
        skipped: report.skipped,
        failed: report.failed,
        awaitingApproval: report.awaitingApproval,
        total: report.total,
      },
      await tailoredExclusions(CRON_MIN_FIT),
      { dryRun, minFit: CRON_MIN_FIT, appliedToday: alreadyToday },
    )
    // If the run tried to submit and EVERY attempt failed, the browser service
    // is likely down — flag the heartbeat so it shows red instead of green.
    const allFailed = runAllFailed(report)
    if (allFailed) {
      runDetail.errored = true
      runDetail.summary = `all ${report.failed} submit(s) failed — browser service may be down · ${runDetail.summary}`
    }
    await recordAutoApplyRun(runDetail)

    if (!dryRun) {
      const recap = buildAutoApplyRecap(report.results, alreadyToday + report.applied, DAILY_CAP)
      if (recap) await notifySlack(recap)
      // A run where everything failed is worth a direct ping — Matthew shouldn't
      // have to open the dashboard to learn the apply service is broken.
      if (allFailed) {
        await notifySlack(`⚠ Auto-apply: all ${report.failed} submission(s) failed this run — the browser apply service may be down.`)
      }
    }

    return NextResponse.json({ ok: true, appliedToday: alreadyToday, cap: DAILY_CAP, ...report })
  } finally {
    if (!dryRun) await releaseCronLock('auto_apply')
  }
}
