import { NextRequest, NextResponse } from 'next/server'
import { verifySessionToken, SESSION_COOKIE } from '@/lib/engine/auth'

export async function middleware(req: NextRequest) {
  // Allow the login page and its API through unauthenticated.
  const { pathname } = req.nextUrl
  if (pathname === '/engine/login' || pathname.startsWith('/api/engine/login')) {
    return NextResponse.next()
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
