'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const RED = '#B22234'
const NAVY = '#3C3B6E'
const BRIGHT_RED = '#C8102E'
const BRIGHT_BLUE = '#0A3161'

// Scattered flag field for the login background. Fixed positions so it
// renders the same every load (no Math.random — keeps SSR/client in sync).
const FLAGS: { top: string; left: string; size: number; rot: number; op: number; e: string }[] = [
  { top: '8%', left: '6%', size: 44, rot: -15, op: 0.1, e: '🇺🇸' },
  { top: '18%', left: '82%', size: 60, rot: 12, op: 0.12, e: '🇺🇸' },
  { top: '70%', left: '10%', size: 56, rot: 8, op: 0.11, e: '🇺🇸' },
  { top: '82%', left: '78%', size: 48, rot: -10, op: 0.1, e: '🇺🇸' },
  { top: '40%', left: '3%', size: 36, rot: 18, op: 0.08, e: '🇺🇸' },
  { top: '52%', left: '92%', size: 40, rot: -8, op: 0.09, e: '🇺🇸' },
  { top: '30%', left: '24%', size: 28, rot: -20, op: 0.07, e: '⭐' },
  { top: '88%', left: '44%', size: 30, rot: 6, op: 0.07, e: '⭐' },
  { top: '12%', left: '50%', size: 26, rot: 0, op: 0.07, e: '⭐' },
  { top: '64%', left: '60%', size: 24, rot: 14, op: 0.06, e: '⭐' },
  { top: '6%', left: '34%', size: 34, rot: 10, op: 0.08, e: '🇺🇸' },
  { top: '90%', left: '20%', size: 30, rot: -14, op: 0.08, e: '⭐' },
  { top: '46%', left: '70%', size: 32, rot: -6, op: 0.07, e: '🇺🇸' },
  { top: '24%', left: '64%', size: 22, rot: 20, op: 0.06, e: '⭐' },
  { top: '76%', left: '90%', size: 28, rot: 4, op: 0.07, e: '⭐' },
]

export default function EngineLogin() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/engine/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    setLoading(false)
    if (res.ok) router.push('/engine')
    else setError('Incorrect password')
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Scattered flag field behind the card */}
      <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        {FLAGS.map((f, i) => (
          <span
            key={i}
            style={{
              position: 'absolute',
              top: f.top,
              left: f.left,
              fontSize: f.size,
              opacity: f.op,
              transform: `rotate(${f.rot}deg)`,
              filter: 'saturate(1.1)',
              userSelect: 'none',
            }}
          >
            {f.e}
          </span>
        ))}
      </div>

      <div
        className="vellum"
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: 400,
          borderRadius: 14,
          border: '1px solid var(--color-border)',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.45)',
        }}
      >
        {/* Stars & stripes top bar */}
        <div style={{ display: 'flex', height: 8 }}>
          <div
            style={{
              width: 56,
              background: NAVY,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 7,
              letterSpacing: '-1px',
              color: '#fff',
            }}
          >
            ★★★
          </div>
          <div
            style={{
              flex: 1,
              background: `repeating-linear-gradient(90deg, ${RED} 0 14px, #f8f4ee 14px 28px)`,
            }}
          />
        </div>

        <div style={{ padding: '2.25rem 2rem 2rem' }}>
          {/* Flag + heading */}
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: 40, lineHeight: 1, marginBottom: 10 }}>🦅</div>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 30,
                fontWeight: 600,
                color: 'var(--color-text-bright)',
                lineHeight: 1.1,
                margin: 0,
              }}
            >
              Mission Control
            </h1>
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 13,
                color: 'var(--color-text-muted)',
                marginTop: 8,
              }}
            >
              Welcome back, Matthew. Let&rsquo;s go land the job. 🇺🇸
            </p>
          </div>

          <form onSubmit={submit}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoFocus
              style={{
                width: '100%',
                padding: '11px 12px',
                fontSize: 14,
                fontFamily: 'var(--font-sans)',
                color: 'var(--color-text-bright)',
                backgroundColor: 'var(--color-surface-deep)',
                border: `1px solid var(--color-border-inner)`,
                borderRadius: 8,
                outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                marginTop: 12,
                padding: '11px 12px',
                fontSize: 13,
                fontWeight: 600,
                fontFamily: 'var(--font-sans)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: '#fff',
                background: loading
                  ? 'rgba(60,59,110,0.5)'
                  : `linear-gradient(90deg, ${BRIGHT_BLUE}, ${NAVY} 50%, ${BRIGHT_RED})`,
                border: 'none',
                borderRadius: 8,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Saluting…' : 'Enter ★'}
            </button>
          </form>

          {error && (
            <p
              style={{
                color: BRIGHT_RED,
                fontFamily: 'var(--font-sans)',
                fontSize: 13,
                marginTop: 12,
                textAlign: 'center',
              }}
            >
              {error}
            </p>
          )}

          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 11,
              color: 'var(--color-text-ghost)',
              textAlign: 'center',
              marginTop: '1.5rem',
              letterSpacing: '0.04em',
            }}
          >
            🇺🇸 Land of the free, home of the hired 🇺🇸
          </p>
        </div>
      </div>
    </main>
  )
}
