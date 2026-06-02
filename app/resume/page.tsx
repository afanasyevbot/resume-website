import type { Metadata } from 'next'
import Link from 'next/link'
import { professionalContext as ctx } from '@/lib/professionalContext'
import PrintButton from '@/components/PrintButton'

export const metadata: Metadata = {
  title: 'Résumé · Matthew Afanasiev',
  description: ctx.summary,
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="resume-heading text-[12px] tracking-[2.5px] uppercase font-semibold mb-3 pb-1.5">
      {children}
    </h2>
  )
}

export default function ResumePage() {
  const { identity, roles, projects, proBono, skills } = ctx

  return (
    <div className="resume-root min-h-screen py-10 px-5 sm:px-8 flex flex-col items-center">
      {/* Toolbar — hidden when printing */}
      <div className="no-print w-full max-w-[800px] flex justify-between items-center mb-6">
        <Link href="/" className="text-[13px] text-text-dim hover:text-gold transition-colors">
          ← Back to site
        </Link>
        <PrintButton />
      </div>

      {/* The sheet */}
      <article className="resume-sheet w-full max-w-[800px] rounded-lg sm:p-12 p-7">
        {/* Header */}
        <header className="mb-7">
          <h1 className="resume-name font-display text-[44px] sm:text-[52px] font-semibold leading-[0.95] tracking-[-1px]">
            {identity.name}
          </h1>
          <p className="resume-subtitle text-[14px] tracking-[1px] uppercase font-medium mt-2">
            Account Executive · SaaS Sales &amp; AI Systems Builder
          </p>
          <div className="resume-contact flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] mt-3">
            <span>Minneapolis, MN</span>
            <span>{identity.phone}</span>
            <a href={`mailto:${identity.email}`}>{identity.email}</a>
            <a href={`https://${identity.linkedin}`} target="_blank" rel="noopener noreferrer">
              {identity.linkedin}
            </a>
            <a href="https://matthew-afanasiev.vercel.app" target="_blank" rel="noopener noreferrer">
              matthew-afanasiev.vercel.app
            </a>
          </div>
        </header>

        {/* Profile */}
        <section className="mb-7">
          <SectionHeading>Profile</SectionHeading>
          <p className="resume-body text-[13.5px] leading-[1.65]">{ctx.summary}</p>
        </section>

        {/* Experience */}
        <section className="mb-7">
          <SectionHeading>Experience</SectionHeading>
          <div className="space-y-5">
            {roles.map((role) => (
              <div key={role.title} className="resume-entry">
                <div className="flex justify-between items-baseline gap-3 flex-wrap">
                  <h3 className="resume-role text-[14.5px] font-semibold">{role.title}</h3>
                  <span className="resume-dates text-[12px] whitespace-nowrap">{role.dates}</span>
                </div>
                <p className="resume-company text-[12.5px] font-medium mb-1.5">{role.company}</p>
                <ul className="space-y-1">
                  {role.bullets.map((b, i) => (
                    <li key={i} className="resume-body text-[12.5px] leading-[1.55] pl-4 relative">
                      <span className="resume-bullet absolute left-0">·</span>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* AI Systems Built */}
        <section className="mb-7">
          <SectionHeading>AI Systems Built — {projects.length} in Production</SectionHeading>
          <div className="space-y-2.5">
            {projects.map((p) => (
              <div key={p.name} className="resume-body text-[12.5px] leading-[1.55]">
                <span className="resume-role font-semibold">{p.name}</span>
                <span className="resume-dates"> · {p.badge}</span>
                {p.link && (
                  <>
                    {' '}
                    <a href={p.link} target="_blank" rel="noopener noreferrer" className="resume-link">
                      ({p.link.replace('https://', '')})
                    </a>
                  </>
                )}
                <span> — Stack: {p.stack.join(', ')}.</span>
              </div>
            ))}
          </div>
        </section>

        {/* Pro Bono */}
        <section className="mb-7">
          <SectionHeading>Pro Bono</SectionHeading>
          {proBono.map((p) => (
            <div key={p.name} className="resume-body text-[12.5px] leading-[1.55]">
              <span className="resume-role font-semibold">{p.name}</span>
              {p.link && (
                <>
                  {' '}
                  <a href={p.link} target="_blank" rel="noopener noreferrer" className="resume-link">
                    ({p.link.replace('https://', '')})
                  </a>
                </>
              )}
              <span>
                {' '}
                — Microsoft 365 tenant, staff email, donation platform, spend management, full site
                redesign, and content tooling for a non-technical team. Phase 2: QuickBooks Online.
              </span>
            </div>
          ))}
        </section>

        {/* Skills + Education */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
          <div>
            <SectionHeading>Core Skills</SectionHeading>
            <ul className="space-y-1">
              {skills.deep.map((s) => (
                <li key={s} className="resume-body text-[12.5px] leading-[1.5] pl-4 relative">
                  <span className="resume-bullet absolute left-0">·</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <SectionHeading>Conversant</SectionHeading>
            <ul className="space-y-1 mb-5">
              {skills.conversant.map((s) => (
                <li key={s} className="resume-body text-[12.5px] leading-[1.5] pl-4 relative">
                  <span className="resume-bullet absolute left-0">·</span>
                  {s}
                </li>
              ))}
            </ul>
            <SectionHeading>Education</SectionHeading>
            <p className="resume-body text-[12.5px] leading-[1.5]">{identity.education}</p>
          </div>
        </section>
      </article>
    </div>
  )
}
