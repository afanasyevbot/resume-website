import type { Metadata } from 'next'
import Link from 'next/link'
import { professionalContext as ctx } from '@/lib/professionalContext'
import { resumeVariants, contactLine, type ResumeVariant } from '@/lib/resumeContent'
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

export default async function ResumePage({
  searchParams,
}: {
  searchParams: Promise<{ variant?: string }>
}) {
  const params = await searchParams
  const variant: ResumeVariant = params.variant === 'gtm' ? 'gtm' : 'sales'
  const content = resumeVariants[variant]

  return (
    <div className="resume-root min-h-screen py-10 px-5 sm:px-8 flex flex-col items-center">
      <div className="no-print w-full max-w-[800px] flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <Link href="/" className="text-[13px] text-text-dim hover:text-gold transition-colors">
          ← Back to site
        </Link>
        <div className="flex items-center gap-2">
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
          <PrintButton />
        </div>
      </div>

      <article className="resume-sheet w-full max-w-[800px] rounded-lg sm:p-12 p-7">
        <header className="mb-7 text-center">
          <h1 className="resume-name font-display text-[44px] sm:text-[52px] font-semibold leading-[0.95] tracking-[-1px]">
            Matthew Afanasiev
          </h1>
          <p className="resume-subtitle text-[12px] tracking-[3px] uppercase font-semibold mt-2">
            Revenue × AI
          </p>
          <p className="resume-body text-[14px] italic mt-2">{content.subtitle}</p>
          <p className="resume-contact text-[12px] mt-3">{contactLine()}</p>
        </header>

        <section className="mb-7 text-center">
          <p className="resume-role text-[18px] font-semibold">{content.headline}</p>
          <p className="resume-body text-[13px] italic mt-2">{content.tagline}</p>
          <p className="resume-body text-[13px] leading-[1.65] mt-4 text-left">{content.summary}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 border-y border-border py-4">
            {content.stats.map((stat) => (
              <div key={stat.sub} className="text-center">
                <p className="resume-role text-[22px] font-semibold leading-none">{stat.big}</p>
                <p className="resume-dates text-[10px] uppercase tracking-wide mt-1">{stat.sub}</p>
              </div>
            ))}
          </div>
        </section>

        {variant === 'gtm' && content.gtmExpertise && (
          <section className="mb-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <SectionHeading>Go-To-Market Expertise</SectionHeading>
              <ul className="space-y-1">
                {content.gtmExpertise.map((item) => (
                  <li key={item} className="resume-body text-[12.5px] leading-[1.5] pl-4 relative">
                    <span className="resume-bullet absolute left-0">·</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <SectionHeading>Tools &amp; Stack</SectionHeading>
              <ul className="space-y-1">
                {content.toolsStack?.map((item) => (
                  <li key={item} className="resume-body text-[12.5px] leading-[1.5] pl-4 relative">
                    <span className="resume-bullet absolute left-0">·</span>
                    {item}
                  </li>
                ))}
              </ul>
              {content.whatDrivesMe && (
                <>
                  <SectionHeading>What Drives Me</SectionHeading>
                  <p className="resume-body text-[12.5px]">{content.whatDrivesMe}</p>
                </>
              )}
            </div>
          </section>
        )}

        <section className="mb-7">
          <SectionHeading>Experience</SectionHeading>
          <div className="space-y-5">
            {content.roles.map((role) => (
              <div key={role.title}>
                <div className="flex justify-between items-baseline gap-3 flex-wrap">
                  <h3 className="resume-role text-[14.5px] font-semibold">{role.title}</h3>
                  <span className="resume-dates text-[12px] whitespace-nowrap">{role.dates}</span>
                </div>
                <p className="resume-company text-[12.5px] font-medium mb-1.5">
                  {role.company}
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

        {variant === 'gtm' && content.signatureBuild ? (
          <>
            <section className="mb-7">
              <SectionHeading>Signature Build</SectionHeading>
              <div className="resume-body text-[12.5px] leading-[1.55]">
                <span className="resume-role font-semibold">{content.signatureBuild.name}</span>
                <span className="resume-dates"> · {content.signatureBuild.badge}</span>
                <p className="mt-1">{content.signatureBuild.description}</p>
                <p className="resume-dates mt-1">{content.signatureBuild.stack}</p>
              </div>
            </section>
            <section className="mb-7">
              <SectionHeading>Additional Builds</SectionHeading>
              <div className="space-y-3">
                {content.additionalBuilds?.map((p) => (
                  <div key={p.name} className="resume-body text-[12.5px] leading-[1.55]">
                    <span className="resume-role font-semibold">{p.name}</span>
                    <span className="resume-dates"> · {p.badge}</span>
                    <p className="mt-1">{p.description}</p>
                    <p className="resume-dates mt-1">{p.stack}</p>
                  </div>
                ))}
              </div>
            </section>
          </>
        ) : (
          <section className="mb-7">
            <SectionHeading>AI Systems Built</SectionHeading>
            <div className="space-y-3">
              {content.projects.map((p) => (
                <div key={p.name} className="resume-body text-[12.5px] leading-[1.55]">
                  <span className="resume-role font-semibold">{p.name}</span>
                  <span className="resume-dates"> · {p.badge}</span>
                  <p className="mt-1">{p.description}</p>
                  <p className="resume-dates mt-1">{p.stack}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {content.skills.length > 0 && (
          <section className="mb-7">
            <SectionHeading>Core Skills</SectionHeading>
            <div className="space-y-2">
              {content.skills.map((skill) => (
                <p key={skill.category} className="resume-body text-[12.5px] leading-[1.55]">
                  <span className="resume-role font-semibold">{skill.category}</span> {skill.items}
                </p>
              ))}
            </div>
          </section>
        )}

        <section>
          <SectionHeading>Education</SectionHeading>
          <p className="resume-body text-[12.5px] leading-[1.5]">
            BBA, Marketing Management · University of St. Thomas · 2017 - 2021
          </p>
        </section>
      </article>
    </div>
  )
}
