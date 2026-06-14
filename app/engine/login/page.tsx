'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

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
        padding: '1.5rem',
      }}
    >
      <div className="vellum" style={{ width: '100%', maxWidth: 380, padding: '2.5rem 2rem' }}>
        {/* Wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: '1.75rem' }}>
          <span
            aria-hidden
            style={{ width: 30, height: 30, borderRadius: 9, background: 'var(--color-gold)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 600 }}
          >
            j
          </span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 500, color: 'var(--color-text-primary)' }}>
            Job Engine
          </span>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h1 className="eng-display" style={{ fontSize: 26, margin: 0 }}>
            Welcome back
          </h1>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13.5, color: 'var(--color-text-muted)', marginTop: 6 }}>
            Sign in to your command center.
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
              padding: '12px 14px',
              fontSize: 14,
              fontFamily: 'var(--font-sans)',
              color: 'var(--color-text-bright)',
              backgroundColor: 'var(--color-surface-deep)',
              border: `1px solid ${error ? 'rgba(220,38,38,0.45)' : 'var(--color-border)'}`,
              borderRadius: 10,
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={loading}
            className="eng-btn eng-btn-primary"
            style={{ width: '100%', marginTop: 12, opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        {error && (
          <p style={{ color: '#b91c1c', fontFamily: 'var(--font-sans)', fontSize: 13, marginTop: 12, textAlign: 'center' }}>
            {error}
          </p>
        )}
      </div>
    </main>
  )
}
