import type { Metadata } from 'next'
import Link from 'next/link'
import {
  PERSONAL_SIGNATURE,
  RESUME_HEADLINE,
  RESUME_PDF_PATHS,
  contactLine,
  resumeVariants,
  type ResumeVariant,
} from '@/lib/resumeContent'
import PrintButton from '@/components/PrintButton'

export const metadata: Metadata = {
  title: 'Résumé · Matthew Afanasiev',
  description:
    'Account executive with five years of B2B SaaS sales experience, AI workflow improvement at SPS Commerce, and custom software delivery through Fidelis Strategy.',
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="resume-heading text-[12px] tracking-[2.5px] uppercase font-semibold mb-3 pb-1.5">
      {children}
    </h2>
  )
}

export default async function ResumePage({
  searchParams,
}: {
  searchParams: Promise<{ variant?: string }>
}) {
  const params = await searchParams
  const variant: ResumeVariant = params.variant === 'gtm' ? 'gtm' : 'sales'
  const content = resumeVariants[variant]
  const contact = contactLine().split('\n')

  return (
    <div className="resume-root min-h-screen py-10 px-5 sm:px-8 flex flex-col items-center">
      <div className="no-print w-full max-w-[800px] flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <Link href="/" className="text-[13px] text-text-dim hover:text-gold transition-colors">
          ← Back to site
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/resume?variant=sales"
            className={`text-[12px] font-semibold px-3 py-1.5 rounded border ${
              variant === 'sales' ? 'bg-gold text-white border-gold' : 'border-border text-muted'
            }`}
          >
            Sales-led
          </Link>
          <Link
            href="/resume?variant=gtm"
            className={`text-[12px] font-semibold px-3 py-1.5 rounded border ${
              variant === 'gtm' ? 'bg-gold text-white border-gold' : 'border-border text-muted'
            }`}
          >
            AI GTM
          </Link>
          <a
            href={RESUME_PDF_PATHS[variant]}
            download
            className="text-[12px] font-semibold px-3 py-1.5 rounded border border-gold text-gold hover:bg-gold/5 transition-colors"
          >
            Download PDF
          </a>
          <PrintButton />
        </div>
      </div>

      <article className="resume-sheet w-full max-w-[800px] rounded-lg sm:p-12 p-7">
        <header className="mb-7 text-center">
          <h1 className="resume-name font-display text-[44px] sm:text-[52px] font-semibold leading-[0.95] tracking-[-1px]">
            Matthew Afanasiev
          </h1>
          <p className="resume-subtitle text-[12px] tracking-[2px] uppercase font-semibold mt-3">
            {RESUME_HEADLINE}
          </p>
          <p className="resume-contact text-[12px] mt-3">{contact[0]}</p>
          <p className="resume-contact text-[12px] mt-1">{contact[1]}</p>
        </header>

        <section className="mb-7">
          <p className="resume-body text-[13px] leading-[1.65]">{content.summary}</p>
        </section>

        <section className="mb-7">
          <SectionHeading>Professional Experience</SectionHeading>
          <div className="space-y-5">
            {content.roles.map((role) => (
              <div key={`${role.title}-${role.dates}`}>
                <div className="flex justify-between items-baseline gap-3 flex-wrap">
                  <h3 className="resume-role text-[14.5px] font-semibold">{role.company}</h3>
                  <span className="resume-dates text-[12px] whitespace-nowrap">{role.dates}</span>
                </div>
                <p className="resume-company text-[12.5px] font-medium mb-1.5">
                  {role.title}
                  {role.concurrent ? ' (concurrent)' : ''}
                </p>
                <ul className="space-y-1">
                  {role.bullets.map((b) => (
                    <li key={b} className="resume-body text-[12.5px] leading-[1.55] pl-4 relative">
                      <span className="resume-bullet absolute left-0">·</span>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-7">
          <SectionHeading>AI Products &amp; Systems Built</SectionHeading>
          <div className="space-y-3">
            {content.projects.map((p) => (
              <div key={p.name} className="resume-body text-[12.5px] leading-[1.55]">
                <span className="resume-role font-semibold">{p.name}</span>
                <span> — {p.description}</span>
                {p.stack ? <span className="resume-dates"> Built with {p.stack.replaceAll(' · ', ', ')}.</span> : null}
              </div>
            ))}
          </div>
        </section>

        <section className="mb-7">
          <SectionHeading>Skills</SectionHeading>
          <div className="space-y-2">
            {content.skills.map((skill) => (
              <p key={skill.category} className="resume-body text-[12.5px] leading-[1.55]">
                <span className="resume-role font-semibold">{skill.category}:</span> {skill.items}
              </p>
            ))}
          </div>
        </section>

        <section className="mb-7">
          <SectionHeading>Education</SectionHeading>
          <p className="resume-body text-[12.5px] leading-[1.5]">
            BBA, Marketing Management · University of St. Thomas · 2017 - 2021
          </p>
        </section>

        <p className="resume-body text-[12.5px] text-center mt-8">{PERSONAL_SIGNATURE}</p>
      </article>
    </div>
  )
}
