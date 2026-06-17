import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { sql } from '@/lib/engine/db'
import { verifySessionToken, SESSION_COOKIE } from '@/lib/engine/auth'
import { generateInterviewPrep, type InterviewPrepInput } from '@/lib/engine/interviewPrep'
import { anthropicKey } from '@/lib/env'

export const runtime = 'nodejs'

interface RoleRecord {
  id: number
  company: string
  title: string
  jd_text: string | null
  fit_reasons: unknown
  segment: string | null
  ai_native: boolean | null
}

/**
 * POST /api/engine/roles/[id]/interview-prep
 *
 * Generates an interview prep sheet (why-this-company, likely questions with
 * answer angles, honest objection handling, questions to ask) for a role using
 * Matthew's profile + the JD. On demand by design — only roles that reach an
 * interview ever cost a call. Persists the result as an 'interview_prep' event.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  if (!(await verifySessionToken(token))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const roleId = Number(id)
  if (!Number.isInteger(roleId) || roleId <= 0) {
    return NextResponse.json({ error: 'bad role id' }, { status: 400 })
  }

  const rows = await sql`
    select id, company, title, jd_text, fit_reasons, segment, ai_native
    from roles where id = ${roleId} limit 1
  `
  const role = rows[0] as RoleRecord | undefined
  if (!role) return NextResponse.json({ error: 'Role not found' }, { status: 404 })
  if (!role.jd_text) {
    return NextResponse.json({ error: 'Role has no JD text to prep against' }, { status: 400 })
  }

  const fitReasons: string[] = Array.isArray(role.fit_reasons)
    ? (role.fit_reasons as unknown[]).filter((x): x is string => typeof x === 'string')
    : []

  const input: InterviewPrepInput = {
    company: role.company,
    title: role.title,
    jdText: role.jd_text,
    fitReasons,
    segment: role.segment,
    aiNative: role.ai_native,
  }

  const client = new Anthropic({ apiKey: anthropicKey() })
  let prep
  try {
    prep = await generateInterviewPrep(client, input)
  } catch (err) {
    console.error('POST /api/engine/roles/[id]/interview-prep error:', err)
    return NextResponse.json({ error: 'Interview prep failed. Try again.' }, { status: 502 })
  }

  // Persist as an event so it's there on the next visit (no schema change).
  await sql`
    insert into events (role_id, kind, detail)
    values (${roleId}, 'interview_prep', ${JSON.stringify(prep)}::jsonb)
  `

  return NextResponse.json({ prep })
}
