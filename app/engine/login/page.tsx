'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const RED = '#B22234'
const NAVY = '#3C3B6E'
const BRIGHT_RED = '#C8102E'
const BRIGHT_BLUE = '#0A3161'

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
      }}
    >
      <div
        className="vellum"
        style={{
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
