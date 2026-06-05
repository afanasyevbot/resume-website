import { NextRequest, NextResponse } from 'next/server'
import { verifySessionToken, SESSION_COOKIE } from '@/lib/engine/auth'

/** Constant-time string comparison using Web Crypto (Edge-safe).
 *  Compares SHA-256 digests so timing doesn't leak character positions. */
async function constantTimeEqual(a: string, b: string): Promise<boolean> {
  const enc = new TextEncoder()
  const [ha, hb] = await Promise.all([
    crypto.subtle.digest('SHA-256', enc.encode(a)),
    crypto.subtle.digest('SHA-256', enc.encode(b)),
  ])
  const va = new Uint8Array(ha)
  const vb = new Uint8Array(hb)
  if (va.length !== vb.length) return false
  let diff = 0
  for (let i = 0; i < va.length; i++) diff |= va[i] ^ vb[i]
  return diff === 0
}

export async function proxy(req: NextRequest) {
  // Allow the login page, logout, and their APIs through unauthenticated.
  const { pathname } = req.nextUrl
  if (
    pathname === '/engine/login' ||
    pathname.startsWith('/api/engine/login') ||
    pathname.startsWith('/api/engine/logout')
  ) {
    return NextResponse.next()
  }

  // Allow Vercel Cron (and any server-to-server caller) holding the cron
  // secret. Uses constant-time comparison to prevent timing attacks.
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = req.headers.get('authorization') ?? ''
    if (await constantTimeEqual(auth, `Bearer ${cronSecret}`)) {
      return NextResponse.next()
    }
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value
  if (await verifySessionToken(token)) return NextResponse.next()

  const loginUrl = req.nextUrl.clone()
  loginUrl.pathname = '/engine/login'
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/engine/:path*', '/api/engine/:path*'],
}
