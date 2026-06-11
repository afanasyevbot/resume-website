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
    <header className="flex items-start justify-between gap-4">
      {/* Left: greeting + title */}
      <div>
        <p
          className="text-[11px] uppercase mb-3"
          style={{
            fontFamily: 'var(--font-display)',
            color: 'var(--color-gold)',
            letterSpacing: '0.3em',
          }}
        >
          ▸ {greeting}, Matthew
        </p>
        <h1
          className="text-[34px] lg:text-[42px] font-semibold leading-none uppercase"
          style={{
            fontFamily: 'var(--font-display)',
            color: 'var(--color-text-bright)',
            letterSpacing: '0.12em',
          }}
        >
          Job&nbsp;Engine
        </h1>
        {digestSlot}
        <div
          className="flex items-center gap-2 mt-3"
          style={{
            color: 'var(--color-text-faint)',
            fontSize: 12,
            fontFamily: 'var(--font-display)',
            letterSpacing: '0.06em',
          }}
        >
          {/* Pulse dot */}
          <span
            className="inline-block w-2 h-2 rounded-full animate-pulse"
            style={{ backgroundColor: '#16a34a', boxShadow: '0 0 6px rgba(22,163,74,0.4)' }}
            aria-hidden="true"
          />
          <span>SYSTEM LIVE · sourcing 08:00 · auto-apply 09:00</span>
        </div>
      </div>

      {/* Right: nav + sign out */}
      <div className="flex items-center gap-4 mt-1">
        <NavLink href="/engine/roles" label="Roles" />
        <NavLink href="/engine/eval" label="Eval" />
        <button
          onClick={handleSignOut}
        className="mt-1 text-xs font-medium transition-colors"
        style={{
          fontFamily: 'var(--font-sans)',
          color: 'var(--color-text-faint)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = 'var(--color-text-muted)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'var(--color-text-faint)'
        }}
      >
        Sign out
      </button>
      </div>
    </header>
  )
}

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname()
  const active = pathname === href || pathname.startsWith(href + '/')
  return (
    <Link
      href={href}
      className="text-xs font-medium transition-colors"
      style={{
        fontFamily: 'var(--font-sans)',
        color: active ? 'var(--color-text-primary)' : 'var(--color-text-faint)',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        textDecoration: 'none',
      }}
    >
      {label}
    </Link>
  )
}
