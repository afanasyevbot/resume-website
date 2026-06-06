import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'
import { sql, tx } from '@/lib/engine/db'
import { tailorRole } from '@/lib/engine/tailor'
import type { TailorInput } from '@/lib/engine/tailorTypes'
import { anthropicKey } from '@/lib/env'

export const runtime = 'nodejs'

interface RoleRecord {
  id: number
  company: string
  title: string
  location: string | null
  url: string | null
  jd_text: string | null
  fit_score: number | null
  fit_reasons: unknown
  segment: string | null
  ai_native: boolean | null
  status: string
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  const roleId = body && typeof (body as { roleId?: unknown }).roleId === 'number'
    ? (body as { roleId: number }).roleId
    : null
  if (roleId === null) {
    return NextResponse.json({ error: 'roleId (number) required' }, { status: 400 })
  }

  // Load the role
  const rows = await sql`
    select id, company, title, location, url, jd_text,
           fit_score, fit_reasons, segment, ai_native, status
    from roles
    where id = ${roleId}
    limit 1
  `
  const role = rows[0] as RoleRecord | undefined
  if (!role) return NextResponse.json({ error: 'Role not found' }, { status: 404 })
  if (!role.jd_text) {
    return NextResponse.json({ error: 'Role has no JD text to tailor against' }, { status: 400 })
  }

  // Normalize fit_reasons to string[]
  const fitReasons: string[] = Array.isArray(role.fit_reasons)
    ? (role.fit_reasons as unknown[]).filter((x): x is string => typeof x === 'string')
    : []

  const input: TailorInput = {
    role: {
      company: role.company,
      title: role.title,
      location: role.location,
      url: role.url,
      jdText: role.jd_text,
      fitScore: role.fit_score,
      fitReasons,
      segment: role.segment,
      aiNative: role.ai_native,
    },
  }

  const client = new Anthropic({ apiKey: anthropicKey() })

  let pkg
  try {
    pkg = await tailorRole(client, input)
  } catch (err) {
    console.error('POST /api/engine/tailor error:', err)
    return NextResponse.json({ error: 'Tailoring failed. Try again.' }, { status: 502 })
  }

  // Persist the package + bump role status + log event atomically:
  // all three writes commit together or none do.
  const payload = JSON.stringify(pkg)
  const results = await tx((txn) => [
    txn`
      insert into application_packages (role_id, cover_letter, outreach_draft, package_json, status)
      values (${roleId}, ${pkg.coverLetter}, ${pkg.outreachDraft}, ${payload}::jsonb, 'draft')
      returning id
    `,
    txn`update roles set status = 'tailored', updated_at = now() where id = ${roleId}`,
    txn`
      insert into events (role_id, kind, detail)
      values (${roleId}, 'tailored', ${payload}::jsonb)
    `,
  ])
  const insertedRows = results[0] as Array<{ id: number }>
  const packageId = Number(insertedRows[0].id)

  return NextResponse.json({ packageId, package: pkg })
}
