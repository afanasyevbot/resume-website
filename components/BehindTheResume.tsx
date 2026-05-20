'use client'

import { useState } from 'react'

interface RoleCard {
  id: string
  title: string
  company: string
  dates: string
  preview: string
  situation: string
  approach: string
  results: string
  lessons: string
}

const roles: RoleCard[] = [
  {
    id: 'net-new',
    title: 'Net New AE · Supply Chain Performance',
    company: 'SPS Commerce',
    dates: 'Feb 2025 – Present',
    preview: 'Selected for an elite 9-person net-new initiative. Zero inherited pipeline. Built from scratch across retail, food, manufacturing, and fashion verticals.',
    situation: 'Selected for an elite 9-person net-new unit after strong Mid-Market performance. Started with zero inherited pipeline against a high quota bar. Had to build from scratch while running full cycles.',
    approach: 'ICP mapping by vertical pain signal — prioritized accounts with the clearest workflow pain first. Multi-threaded from day 1. ROI-first discovery: always quantified the cost of the current state before positioning any solution.',
    results: 'Ranked #1 in net-new production on the team company-wide. 5th of 30 AEs overall in FY25 at 102.6% attainment. Highest close rate in the division. Top performer Q1 2026.',
    lessons: 'Pattern recognition beats activity volume. When you understand which accounts have real pain and which do not, you stop chasing and start closing.',
  },
  {
    id: 'fidelis',
    title: 'Founder · Fidelis Strategy LLC',
    company: 'Jan 2026 – Present · Concurrent',
    dates: '',
    preview: 'Built 6 production AI systems while carrying full quota. Growth consultancy serving $1M–$10M businesses. Shipped a monetized SaaS product from scratch.',
    situation: 'After years of selling to businesses and seeing the same operational inefficiencies repeatedly, started building AI tools to solve them — while still carrying full quota at SPS Commerce.',
    approach: 'Build production systems, not prototypes. Every tool shipped has real users, real infrastructure, and real constraints. Used Anthropic API across all projects: chat advisors, agent pipelines, scoring engines, lead generation workflows.',
    results: '6 production AI systems delivered. Fidelis Pulse launched with live Stripe billing. M&A client engagement projected $2M revenue impact. Multiple client platforms shipped and deployed.',
    lessons: 'Shipping beats planning. Real users expose problems that specs never anticipate. Building AI while selling it taught me what buyers actually fear vs. what they say they want.',
  },
  {
    id: 'mid-market',
    title: 'Mid-Market AE · SPS Commerce',
    company: 'SPS Commerce',
    dates: 'Nov 2022 – Jan 2025',
    preview: '58% ARR growth YoY (FY24) across 500+ accounts. Built account expansion playbooks using CRM and Power BI analytics.',
    situation: 'Inherited an underperforming territory with no playbook. Was taking a reactive approach — responding to inbound rather than driving proactively. Missed quota early on.',
    approach: 'Ran a full territory audit. Built a structured ICP matrix using Salesforce and Power BI to identify accounts with the highest pain signal. Shifted to proactive: dedicated outreach blocks per segment, consistent weekly cadence, multi-threaded from the start.',
    results: '58% ARR growth year-over-year in FY24 across a 500+ account portfolio. Managed companies up to $150M in revenue. Built expansion playbooks adopted by the team.',
    lessons: 'Data tells you where to go. Process determines whether you get there. The market was never the problem — the approach was.',
  },
  {
    id: 'community',
    title: 'Associate AE · Community Sales',
    company: 'SPS Commerce',
    dates: 'Dec 2021 – Oct 2022',
    preview: 'Ranked #1 of 40 AEs with the highest close rate at 151% quota attainment. High-volume new business territory.',
    situation: 'Entry-level AE role — high volume, retailer-mandated deadlines, non-technical buyers. Had to close quickly and translate technical compliance requirements into business language.',
    approach: 'Disciplined cadence. Simplified the value message — focused on what happens if they miss the deadline (chargebacks, lost retail relationships) rather than features. Built rapport fast, moved quickly.',
    results: '#1 of 40 AEs. 151% quota attainment. Consistent top performer from day one.',
    lessons: 'Consultative selling works at every speed. Even in high-volume environments, taking 60 seconds to ask the right question beats pitching immediately.',
  },
  {
    id: 'uhg',
    title: 'Sales Representative · UnitedHealth Group',
    company: 'UnitedHealth Group',
    dates: 'Jun 2021 – Nov 2021',
    preview: 'Top performer. Consultative needs assessments in a heavily regulated healthcare environment.',
    situation: 'First sales role out of college. High-volume inbound healthcare environment with strict compliance requirements.',
    approach: 'Consultative needs assessment even under call volume pressure. Listened first. Matched members to the right plan rather than the most expensive one.',
    results: 'Top performer on the team. Strong conversion rate from inbound leads to enrolled members.',
    lessons: 'Sales in regulated environments teaches precision. Every word matters. That discipline carried forward into every role.',
  },
]

export default function BehindTheResume() {
  const [activeId, setActiveId] = useState<string | null>(null)

  function toggle(id: string) {
    setActiveId((prev) => (prev === id ? null : id))
  }

  return (
    <section id="behind-resume" className="mt-24">
      <p className="text-[11px] tracking-[4px] uppercase text-text-faint font-semibold mb-2">Behind the Resume</p>
      <p className="text-[15px] text-text-muted mb-8 font-light">The situations, the frameworks, the honest lessons. Click to expand.</p>

      <div className="grid grid-cols-2 gap-3.5">
        {roles.map((role) => {
          const isActive = activeId === role.id
          return (
            <div
              key={role.id}
              className={`rounded-xl border transition-colors ${
                isActive
                  ? 'col-span-2 bg-surface border-gold/25'
                  : 'bg-surface border-border cursor-pointer hover:border-gold/20'
              }`}
              onClick={() => !isActive && toggle(role.id)}
            >
              {isActive ? (
                <div className="p-6">
                  <div className="flex justify-between items-start mb-5">
                    <p className="text-[14px] text-text-muted">
                      ↑ {role.title}{' '}
                      <span className="text-text-ghost">· {role.dates || role.company}</span>
                    </p>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggle(role.id) }}
                      className="text-[11px] text-text-ghost hover:text-text-dim tracking-wider uppercase ml-4 shrink-0"
                    >
                      Collapse ↑
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-5">
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
                    {role.company}{role.dates ? ` · ${role.dates}` : ''}
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
