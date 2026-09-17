import { spsCaseStudy } from '@/lib/siteContent'

export default function SPSCaseStudySection() {
  return (
    <section id="sps-ai-workflow" className="section-divider">
      <div className="mb-8 sm:mb-10">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] mb-3 text-ghost">SPS Commerce</p>
        <h2 className="font-display text-[26px] sm:text-[34px] lg:text-[38px] font-medium leading-[1.15] tracking-[-0.02em] max-w-[28ch] text-ink">
          {spsCaseStudy.title}
        </h2>
      </div>

      <article className="card card-lift p-7 sm:p-9 max-w-[62ch]">
        <p className="text-[15px] sm:text-[16px] text-muted leading-[1.75]">{spsCaseStudy.body}</p>
        <p className="text-[15px] sm:text-[16px] text-ink font-medium leading-[1.65] mt-6">{spsCaseStudy.reportedResults}</p>
        <p className="text-[13px] text-ghost leading-[1.65] mt-5 pt-5 border-t border-border">{spsCaseStudy.contribution}</p>
        <p className="text-[12px] text-ghost leading-[1.6] mt-4">{spsCaseStudy.asOfNote}</p>
      </article>
    </section>
  )
}
