'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

function greetingFor(hour: number): string {
  if (hour < 5) return 'Up late'
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  if (hour < 22) return 'Good evening'
  return 'Burning the midnight oil'
}

interface EngineHeaderProps {
  /** Server-rendered "since last visit" slot. Optional. */
  digestSlot?: React.ReactNode
}

export default function EngineHeader({ digestSlot }: EngineHeaderProps) {
  const router = useRouter()
  // Compute greeting on the client after mount — avoids server/client time mismatch.
  const [greeting, setGreeting] = useState<string>('Welcome back')
  useEffect(() => {
    setGreeting(greetingFor(new Date().getHours()))
  }, [])

  async function handleSignOut() {
    await fetch('/api/engine/logout', { method: 'POST' })
    router.push('/engine/login')
  }

  return (
    <header>
      {/* Top row: wordmark + nav */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden
            className="inline-flex items-center justify-center rounded-lg"
            style={{ width: 26, height: 26, background: 'var(--color-gold)', color: '#fff', fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600 }}
          >
            j
          </span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 500, color: 'var(--color-text-primary)', letterSpacing: '-0.01em' }}>
            Job Engine
          </span>
        </div>
        <nav className="flex items-center gap-1">
          <NavLink href="/engine" label="Overview" exact />
          <NavLink href="/engine/roles" label="Roles" />
          <NavLink href="/engine/eval" label="Eval" />
          <button
            onClick={handleSignOut}
            className="ml-1 rounded-lg px-3 py-1.5 text-[13px] transition-colors"
            style={{ fontFamily: 'var(--font-sans)', color: 'var(--color-text-muted)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-text-primary)' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-muted)' }}
          >
            Sign out
          </button>
        </nav>
      </div>

      {/* Greeting */}
      <div className="mt-10">
        <h1
          className="eng-display"
          style={{ fontSize: 40, lineHeight: 1.05 }}
        >
          {greeting}, Matthew.
        </h1>
        {digestSlot}
      </div>
    </header>
  )
}

function NavLink({ href, label, exact }: { href: string; label: string; exact?: boolean }) {
  const pathname = usePathname()
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(href + '/')
  return (
    <Link
      href={href}
      className="rounded-lg px-3 py-1.5 text-[13px] transition-colors"
      style={{
        fontFamily: 'var(--font-sans)',
        fontWeight: active ? 600 : 400,
        color: active ? 'var(--color-text-bright)' : 'var(--color-text-muted)',
        background: active ? 'var(--color-surface-deep)' : 'transparent',
        textDecoration: 'none',
      }}
    >
      {label}
    </Link>
  )
}
