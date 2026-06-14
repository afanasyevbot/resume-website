import type Anthropic from '@anthropic-ai/sdk'
import { sql, tx } from './db'
import { tailorRole } from './tailor'
import type { TailorInput } from './tailorTypes'

/**
 * Recover roles stranded at status='scored', route='tailor' with NO application
 * package — the signature of a tailoring step that failed mid-sourcing. These
 * are the HIGHEST-value roles (they cleared the tailor floor) yet they leak out
 * of the funnel silently (they still display as "in queue"). This pass re-runs
 * tailoring so they reach 'tailored' and become apply-eligible.
 *
 * Idempotent: the NOT EXISTS guard means a role that already has a package is
 * never re-tailored. Capped per run so a backlog can't blow the cost cap / the
 * serverless window — the cron runs daily, so it drains over a few days.
 */
interface StrandedRow {
  id: string | number
  company: string
  title: string
  location: string | null
  url: string | null
  jd_text: string | null
  fit_score: number | null
  fit_reasons: unknown
  segment: string | null
  ai_native: boolean | null
}

function coerceReasons(input: unknown): string[] {
  if (Array.isArray(input)) return input.filter((x): x is string => typeof x === 'string')
  if (typeof input === 'string') {
    try {
      const p = JSON.parse(input)
      if (Array.isArray(p)) return p.filter((x): x is string => typeof x === 'string')
    } catch {
      /* not JSON */
    }
  }
  return []
}

export async function retailorStranded(
  client: Anthropic,
  max = 5,
): Promise<{ retailored: number; failed: number }> {
  const rows = (await sql`
    select r.id, r.company, r.title, r.location, r.url, r.jd_text,
           r.fit_score, r.fit_reasons, r.segment, r.ai_native
    from roles r
    where r.status = 'scored' and r.route = 'tailor'
      and r.jd_text is not null
      and not exists (
        select 1 from application_packages p
        where p.role_id = r.id and p.package_json is not null
      )
    order by r.fit_score desc nulls last
    limit ${max}
  `) as StrandedRow[]

  let retailored = 0
  let failed = 0
  for (const r of rows) {
    const id = Number(r.id)
    try {
      const input: TailorInput = {
        role: {
          company: r.company,
          title: r.title,
          location: r.location,
          url: r.url,
          jdText: r.jd_text ?? '',
          fitScore: r.fit_score,
          fitReasons: coerceReasons(r.fit_reasons),
          segment: r.segment,
          aiNative: r.ai_native,
        },
      }
      const pkg = await tailorRole(client, input)
      const payload = JSON.stringify(pkg)
      await tx((txn) => [
        txn`insert into application_packages (role_id, cover_letter, outreach_draft, package_json, status)
            values (${id}, ${pkg.coverLetter}, ${pkg.outreachDraft}, ${payload}::jsonb, 'draft')`,
        txn`update roles set status = 'tailored', updated_at = now() where id = ${id}`,
        txn`insert into events (role_id, kind, detail) values (${id}, 'tailored', ${payload}::jsonb)`,
      ])
      retailored += 1
    } catch (err) {
      failed += 1
      const msg = err instanceof Error ? err.message : String(err)
      await sql`insert into events (role_id, kind, detail) values (${id}, 'tailor_failed', ${JSON.stringify({ reason: msg, retry: true })}::jsonb)`.catch(() => {})
    }
  }
  return { retailored, failed }
}
