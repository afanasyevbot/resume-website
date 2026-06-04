import { NextResponse } from 'next/server'
import { timingSafeEqual } from 'node:crypto'
import { createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE } from '@/lib/engine/auth'

function passwordMatches(input: string): boolean {
  const expected = process.env.ENGINE_PASSWORD ?? ''
  const a = Buffer.from(input)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  if (!body || typeof body.password !== 'string' || !passwordMatches(body.password)) {
    return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
  }
  const token = await createSessionToken()
  const res = NextResponse.json({ ok: true })
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  })
  return res
}
