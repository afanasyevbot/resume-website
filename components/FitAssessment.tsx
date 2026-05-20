'use client'

import { useState } from 'react'
import type { FitResult } from '@/lib/types'

export default function FitAssessment() {
  const [jd, setJd] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<FitResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function analyze() {
    if (!jd.trim() || loading) return
    setLoading(true)
    setResult(null)
    setError(null)

    try {
      const res = await fetch('/api/fit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobDescription: jd }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Analysis failed')
      setResult(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section id="fit-section" className="mt-24">
      <div className="bg-surface border border-border rounded-xl p-10">
        <h2 className="font-display text-[32px] font-semibold text-text-bright mb-2">Role Fit Assessment</h2>
        <p className="text-[14px] text-text-muted mb-7">
          Paste a job description. Get an honest AI breakdown — where I&apos;m strong, where I&apos;m not, and a straight compatibility score.
        </p>

        <textarea
          value={jd}
          onChange={(e) => setJd(e.target.value)}
          placeholder="Paste the job description here..."
          aria-label="Job description"
          rows={4}
          className="w-full bg-bg border border-border rounded-lg px-4 py-4 text-[14px] text-text-faint placeholder:text-text-ghost placeholder:italic resize-none"
        />

        <button
          onClick={analyze}
          disabled={loading || !jd.trim()}
          className="mt-4 text-gold border border-gold/50 px-6 py-3 rounded text-[13px] font-semibold tracking-wide hover:bg-gold/5 transition-colors disabled:opacity-40"
        >
          {loading ? 'Analyzing...' : 'Analyze Role Fit →'}
        </button>

        {error && <p className="mt-4 text-[13px] text-text-ghost">{error}</p>}

        {result && (
          <div className="mt-7 pt-7 border-t border-border-inner">
            <div className="flex items-baseline gap-3 mb-6">
              <span className="font-display text-[68px] font-semibold text-gold leading-none">{Math.round(Math.min(100, Math.max(0, result.score)))}%</span>
              <span className="text-[14px] text-text-dim">{result.verdict}</span>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <p className="text-[10px] tracking-[3px] uppercase text-gold font-semibold mb-3">Strengths Aligned</p>
                <ul className="space-y-1.5">
                  {result.strengths.map((s, i) => (
                    <li key={i} className="text-[13px] text-text-muted leading-[1.8]">· {s}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-[10px] tracking-[3px] uppercase text-text-ghost font-semibold mb-3">Honest Flags</p>
                <ul className="space-y-1.5">
                  {result.flags.map((f, i) => (
                    <li key={i} className="text-[13px] text-text-muted leading-[1.8]">· {f}</li>
                  ))}
                </ul>
              </div>
            </div>

            <p className="text-[12px] text-text-ghost border-t border-border-inner pt-4">
              Recommendation:{' '}
              <span className={result.recommendation === 'Proceed' ? 'text-gold' : result.recommendation === 'Consider passing' ? 'text-text-ghost' : 'text-text-dim'}>
                {result.recommendation}
              </span>
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
