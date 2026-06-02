'use client'

import { useState } from 'react'
import { professionalContext } from '@/lib/professionalContext'

const roles = professionalContext.roles.map((r, i) => ({
  id: String(i),
  title: r.shortTitle,
  company: r.company,
  dates: r.dates,
  preview: r.preview,
  situation: r.aiContext.situation,
  approach: r.aiContext.approach,
  results: r.aiContext.results,
  lessons: r.aiContext.lessons,
}))

export default function BehindTheResume() {
  const [activeId, setActiveId] = useState<string | null>(null)

  function toggle(id: string) {
    setActiveId((prev) => (prev === id ? null : id))
  }

  return (
    <section id="behind-resume" className="mt-24">
      <p className="text-[11px] tracking-[4px] uppercase text-text-faint font-semibold mb-2">Behind the Resume</p>
      <p className="text-[15px] text-text-muted mb-8 font-light">The situations, the frameworks, the honest lessons. Click to expand.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {roles.map((role) => {
          const isActive = activeId === role.id
          return (
            <div
              key={role.id}
              className={`rounded-xl border transition-colors ${
                isActive
                  ? 'sm:col-span-2 bg-surface border-gold/25'
                  : 'bg-surface border-border cursor-pointer hover:border-gold/20'
              }`}
              onClick={() => !isActive && toggle(role.id)}
              role={isActive ? undefined : 'button'}
              tabIndex={isActive ? undefined : 0}
              onKeyDown={isActive ? undefined : (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(role.id) } }}
              aria-expanded={isActive}
            >
              {isActive ? (
                <div className="p-6">
                  <div className="flex justify-between items-start mb-5">
                    <p className="text-[14px] text-text-muted">
                      ↑ {role.title}{' '}
                      <span className="text-text-ghost">· {role.dates}</span>
                    </p>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggle(role.id) }}
                      aria-label="Collapse"
                      className="text-[11px] text-text-ghost hover:text-text-dim tracking-wider uppercase ml-4 shrink-0"
                    >
                      Collapse ↑
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    {[
                      { label: 'Situation', text: role.situation },
                      { label: 'Approach', text: role.approach },
                      { label: 'Result · Lesson', text: `${role.results}\n\nLesson: ${role.lessons}` },
                    ].map(({ label, text }) => (
                      <div key={label}>
                        <p className="text-[10px] tracking-[3px] uppercase text-text-ghost font-semibold mb-2.5">{label}</p>
                        <p className="text-[13px] text-text-muted leading-[1.8] whitespace-pre-line">{text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-6">
                  <h3 className="text-[15px] font-semibold text-text-bright mb-1">{role.title}</h3>
                  <p className="text-[12px] text-gold font-medium mb-3">
                    {role.company} · {role.dates}
                  </p>
                  <p className="text-[13px] text-text-muted leading-[1.75]">{role.preview}</p>
                  <p className="text-[11px] text-text-ghost uppercase tracking-wide mt-4">↳ View full context</p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
