import Image from 'next/image'
import { RESUME_PDF_PATHS } from '@/lib/resumeContent'
import { heroCurrentRoleNote, heroIntro, heroTagline, homepageProofPoints, professionalLabel } from '@/lib/siteContent'

export default function Hero() {
  return (
    <section className="relative pt-[112px] sm:pt-[116px] pb-16 sm:pb-20 overflow-hidden">
      <div className="relative reveal-up">
        <div
          className="pointer-events-none hidden md:block absolute top-1/2 -translate-y-1/2 right-0 lg:-right-6 xl:-right-4 w-[min(46vw,280px)] lg:w-[400px] xl:w-[460px] aspect-[7/9] hero-portrait-arch z-0"
          aria-hidden="true"
        >
          <div className="relative w-full h-full">
            <Image
              src="/images/headshot-sm.webp"
              alt=""
              fill
              sizes="(max-width: 1024px) 280px, 460px"
              className="object-cover object-[center_18%]"
              priority
              quality={92}
            />
          </div>
        </div>

        <div className="relative z-10 mx-auto w-full max-w-[38rem] text-center px-1 sm:px-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ghost mb-5">
            {professionalLabel}
          </p>
          <h2 className="font-display font-bold text-ink leading-[1] sm:leading-[0.95] tracking-[-0.04em] text-[36px] sm:text-[72px] lg:text-[76px] xl:text-[80px]">
            Sales.
            <br />
            Depth.
            <br />
            <span className="text-gold">Builder fluency.</span>
          </h2>
          <p className="font-display text-[16px] sm:text-[19px] lg:text-[20px] font-medium text-muted leading-[1.45] tracking-[-0.01em] mt-8 sm:mt-7 text-balance mx-auto max-w-[22rem] sm:max-w-[40ch]">
            {heroTagline}
          </p>
          <p className="text-[15px] sm:text-[17px] text-muted leading-[1.75] sm:leading-[1.7] mt-7 sm:mt-6 mx-auto max-w-[22rem] sm:max-w-[52ch]">
            {heroIntro}
          </p>
          <div className="mt-12 sm:mt-12 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4 sm:gap-3">
            <a href="#builder" className="btn-primary">
              View my work
            </a>
            <a href={RESUME_PDF_PATHS.sales} className="btn-ghost" download>
              Download resume
            </a>
          </div>
        </div>
      </div>

      <div className="relative z-10 mt-20 sm:mt-24">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
          {homepageProofPoints.map((stat, i) => (
            <div
              key={stat.label}
              className="stat-tile text-center px-4 py-7 sm:px-5 sm:py-8 reveal-up"
              style={{ animationDelay: `${i * 80}ms` }}
              aria-label={stat.note ? `${stat.value} ${stat.label}. ${stat.note}` : `${stat.value} ${stat.label}`}
            >
              <p
                className={`font-display font-semibold text-ink leading-[1.05] tracking-[-0.03em] ${
                  stat.value === '58%' ? 'text-[30px] sm:text-[44px] tabular-nums' : 'text-[22px] sm:text-[28px]'
                }`}
              >
                {stat.value}
              </p>
              <p className="text-[10px] sm:text-[13px] text-muted leading-[1.5] sm:leading-[1.45] mt-3">{stat.label}</p>
              {'note' in stat && stat.note ? (
                <p className="text-[10px] sm:text-[12px] text-ghost leading-[1.45] mt-2">{stat.note}</p>
              ) : null}
            </div>
          ))}
        </div>
        <div className="glass-panel mt-12 sm:mt-12 px-5 py-8 sm:px-10 sm:py-9 max-w-[56ch] mx-auto text-center">
          <p className="text-[14px] sm:text-[15px] text-muted leading-[1.7]">
            {heroCurrentRoleNote}
          </p>
        </div>
      </div>
    </section>
  )
}
