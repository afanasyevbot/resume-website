'use client'

import { professionalContext } from '@/lib/professionalContext'

interface HeroProps {
  onAskAI: () => void
  onAnalyzeFit: () => void
}

const [topPerformer, arrGrowth, salesExperience] = professionalContext.headlineMetrics

const stats = [
  { number: topPerformer.value, label: topPerformer.label },
  { number: arrGrowth.value, label: arrGrowth.label },
  { number: String(professionalContext.projects.length), label: 'AI Systems Built' },
  { number: salesExperience.value, label: salesExperience.label },
]

export default function Hero({ onAskAI, onAnalyzeFit }: HeroProps) {
  return (
    <section className="pt-20 pb-20 relative text-center">
      {/* Site links */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 items-center justify-center mb-8">
        <a
          href="https://fidelisstrategy.net"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] tracking-[3px] uppercase text-gold font-medium border-b border-gold/30 pb-0.5 hover:border-gold/60 transition-colors"
        >
          fidelisstrategy.net ↗
        </a>
        <span className="text-border text-xs hidden sm:inline">·</span>
        <a
          href="https://fidelispulse.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] tracking-[3px] uppercase text-gold font-medium border-b border-gold/30 pb-0.5 hover:border-gold/60 transition-colors"
        >
          fidelispulse.com ↗
        </a>
      </div>

      {/* Name */}
      <h1 className="font-display text-[64px] sm:text-[120px] font-semibold leading-[0.92] tracking-[-2px] sm:tracking-[-3px] text-text-bright mb-8">
        Matthew<br />Afanasiev
      </h1>

      {/* Rule */}
      <div className="w-10 h-px mb-6 mx-auto" style={{ background: 'linear-gradient(90deg, transparent, #c9a96e, transparent)' }} />

      {/* Tagline */}
      <p className="text-[17px] text-text-secondary leading-[1.85] font-light">
        <strong className="text-text-primary font-medium">I close deals. I build AI systems.</strong><br />
        Most reps can&apos;t build. Most builders can&apos;t sell.<br />
        I&apos;ve been on both sides, and I do both well.
      </p>

      {/* Consistent top performer */}
      <p className="text-[12px] tracking-[2px] uppercase text-gold font-medium mt-4">
        Consistent top performer · 5 years
      </p>

      {/* CTAs */}
      <div className="flex gap-3 flex-wrap items-center justify-center mt-10">
        <button
          onClick={onAskAI}
          className="text-gold border border-gold/50 px-6 py-3 rounded text-[13px] font-semibold tracking-wide hover:bg-gold/5 transition-colors"
        >
          ✦ Ask AI About Me
        </button>
        <button
          onClick={onAnalyzeFit}
          className="text-gold border border-gold/25 px-5 py-3 rounded text-[13px] font-semibold hover:bg-gold/5 transition-colors"
        >
          Analyze Role Fit →
        </button>
        <a
          href="https://linkedin.com/in/matthewafanasiev"
          target="_blank"
          rel="noopener noreferrer"
          className="text-text-faint border border-border px-5 py-3 rounded text-[13px] hover:text-text-dim transition-colors"
        >
          LinkedIn ↗
        </a>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-border rounded-xl overflow-hidden mt-16">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-surface py-7 px-5 text-center">
            <div className="font-display text-[42px] font-semibold text-text-bright leading-none">
              {stat.number}
            </div>
            <div className="text-[11px] tracking-[1.5px] uppercase text-text-faint mt-2 font-medium">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
