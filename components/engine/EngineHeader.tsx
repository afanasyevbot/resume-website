'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

function greetingFor(hour: number): string {
  if (hour < 5) return 'Up late'
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  if (hour < 22) return 'Good evening'
  return 'Burning the midnight oil'
}

export default function EngineHeader() {
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
          className="text-[12px] uppercase mb-2"
          style={{
            fontFamily: 'var(--font-sans)',
            color: 'var(--color-text-faint)',
            letterSpacing: '0.18em',
          }}
        >
          {greeting}, Matthew
        </p>
        <h1
          className="text-[48px] lg:text-[56px] font-semibold leading-none tracking-tight"
          style={{
            fontFamily: 'var(--font-display)',
            color: 'var(--color-text-bright)',
          }}
        >
          Job Engine
        </h1>
        <div
          className="flex items-center gap-2 mt-2"
          style={{ color: 'var(--color-text-faint)', fontSize: 13 }}
        >
          {/* Pulse dot */}
          <span
            className="inline-block w-2 h-2 rounded-full animate-pulse"
            style={{ backgroundColor: 'var(--color-gold)' }}
            aria-hidden="true"
          />
          <span>Live · last sync just now</span>
        </div>
      </div>

      {/* Right: sign out */}
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
    </header>
  )
}
