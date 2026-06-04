import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'
import { scoreRole } from '@/lib/engine/matcher'
import { persistScoredRole, type PersistableRole } from '@/lib/engine/persistRole'
import { anthropicKey } from '@/lib/env'

// Anthropic SDK needs Node runtime (not Edge).
export const runtime = 'nodejs'

type Validated = { ok: true; role: PersistableRole } | { ok: false; error: string }

function validate(body: unknown): Validated {
  if (!body || typeof body !== 'object') return { ok: false, error: 'Body required' }
  const b = body as Record<string, unknown>
  if (typeof b.company !== 'string' || !b.company.trim()) return { ok: false, error: 'company is required' }
  if (typeof b.title !== 'string' || !b.title.trim()) return { ok: false, error: 'title is required' }
  if (typeof b.jobDescription !== 'string' || b.jobDescription.trim().length < 30) {
    return { ok: false, error: 'jobDescription is required (min 30 chars)' }
  }
  if (b.jobDescription.length > 20_000) return { ok: false, error: 'jobDescription too long (max 20000 chars)' }
  const role: PersistableRole = {
    company: b.company.trim(),
    title: b.title.trim(),
    jobDescription: b.jobDescription,
    url: typeof b.url === 'string' && b.url.trim() ? b.url.trim() : null,
    location: typeof b.location === 'string' && b.location.trim() ? b.location.trim() : null,
    source: typeof b.source === 'string' && b.source.trim() ? b.source.trim() : 'manual',
  }
  return { ok: true, role }
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  const v = validate(body)
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 })

  const client = new Anthropic({ apiKey: anthropicKey() })
  try {
    // Matcher's RoleInput uses `string | undefined`; persistable uses
    // `string | null | undefined`. Bridge by stripping nulls for the matcher.
    const result = await scoreRole(client, {
      company: v.role.company,
      title: v.role.title,
      jobDescription: v.role.jobDescription,
      url: v.role.url ?? undefined,
      location: v.role.location ?? undefined,
    })
    const persisted = await persistScoredRole(v.role, result)
    return NextResponse.json({ id: persisted.id, status: persisted.status, result })
  } catch (err) {
    console.error('POST /api/engine/score error:', err)
    return NextResponse.json({ error: 'Scoring failed. Try again.' }, { status: 502 })
  }
}
