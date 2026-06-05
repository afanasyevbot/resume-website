import { NextRequest, NextResponse } from 'next/server'
import { verifySessionToken, SESSION_COOKIE } from '@/lib/engine/auth'

export async function proxy(req: NextRequest) {
  // Allow the login page and its API through unauthenticated.
  const { pathname } = req.nextUrl
  if (pathname === '/engine/login' || pathname.startsWith('/api/engine/login')) {
    return NextResponse.next()
  }

  // Allow Vercel Cron (and any server-to-server caller) holding the cron
  // secret. Vercel automatically sends `Authorization: Bearer <CRON_SECRET>`
  // to scheduled functions when the CRON_SECRET env var is set. This lets the
  // sourcing cron reach /api/engine/source without a session cookie. The route
  // itself re-verifies the token (defense in depth).
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = req.headers.get('authorization')
    if (auth === `Bearer ${cronSecret}`) {
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
