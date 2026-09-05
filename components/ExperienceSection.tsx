import Image from 'next/image'
import { experience } from '@/lib/siteContent'

export default function ExperienceSection() {
  return (
    <section id="experience" className="section-divider">
      <div className="mb-10 sm:mb-14">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] mb-3 text-ghost">Experience</p>
        <h2 className="font-display text-[30px] sm:text-[40px] lg:text-[44px] font-medium leading-[1.12] tracking-[-0.02em] max-w-[18ch] text-ink">
          Experience
        </h2>
        <p className="text-[15px] sm:text-[16px] leading-[1.65] mt-4 max-w-[52ch] text-muted">
          Current role at SPS Commerce first. Fidelis Strategy runs alongside that job.
        </p>
      </div>

      <ul className="space-y-0 mt-4">
        {experience.map((role) => (
          <li key={role.fullTitle} className="py-10 sm:py-12 border-b border-border/50">
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 sm:gap-6">
              <h3
                className="font-display text-[22px] sm:text-[28px] font-semibold text-ink leading-[1.15] tracking-[-0.02em]"
                title={role.fullTitle}
              >
                {role.title}
              </h3>
              <p className="text-[11px] font-medium uppercase tracking-[0.06em] sm:tracking-[0.12em] text-ghost sm:text-right sm:shrink-0 sm:whitespace-nowrap">
                {role.dates}
              </p>
            </div>
            <p className="text-[14px] text-muted mt-2">
              {role.companyHref ? (
                <a
                  href={role.companyHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:underline underline-offset-4"
                >
                  {role.company}
                  <Image src="/icons/external-link.svg" alt="" aria-hidden width={12} height={12} />
                </a>
              ) : (
                role.company
              )}
              {role.note ? <span className="text-ghost"> · {role.note}</span> : null}
            </p>
            <ul className="space-y-2.5 mt-5">
              {role.bullets.map((bullet) => (
                <li key={bullet} className="flex gap-2.5 text-[15px] sm:text-[16px] text-muted leading-[1.55]">
                  <span className="text-gold/80 shrink-0 select-none" aria-hidden="true">
                    ·
                  </span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  )
}
