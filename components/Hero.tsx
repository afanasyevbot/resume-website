import Image from 'next/image'
import { calendlyUrl } from '@/lib/siteContent'

const stats = [
  { number: '#1', label: 'net-new production · Q1 2026' },
  { number: '102.6%', label: 'FY25 attainment' },
  { number: '58%', label: 'ARR growth · FY24' },
  { number: '7', label: 'production systems built' },
]

export default function Hero() {
  return (
    <section className="relative pt-[108px] sm:pt-[116px] pb-20 sm:pb-24 overflow-hidden">
      <div className="relative mx-auto flex flex-col items-center text-center">
        <div
          className="pointer-events-none relative mb-10 sm:mb-10 w-[136px] sm:w-[148px] aspect-[7/9] hero-portrait-arch reveal-up"
          aria-hidden="true"
        >
          <div className="absolute -inset-6 rounded-full bg-gradient-to-br from-gold/20 via-transparent to-transparent blur-2xl opacity-70" />
          <div className="relative overflow-hidden bg-transparent w-full h-full">
            <Image
              src="/images/headshot-sm.webp"
              alt="Matthew Afanasiev"
              fill
              sizes="(max-width: 640px) 136px, 148px"
              className="object-contain object-center drop-shadow-[0_12px_32px_rgba(30,77,50,0.18)]"
              priority
            />
          </div>
        </div>

        <div className="glass-panel w-full max-w-[44rem] mx-auto px-6 py-16 sm:px-12 sm:py-20 reveal-up">
          <p className="text-[12px] font-medium uppercase tracking-[0.2em] text-ghost mb-8 sm:mb-6">
            The close
          </p>
          <div className="flex justify-center">
            <h2 className="hero-close-title font-display font-medium text-ink tracking-[-0.04em] text-center sm:text-left">
              Sales.
              <br />
              Depth.
              <br />
              <span className="text-gold">
                Builder
                <span className="hidden sm:inline"> </span>
                <br className="sm:hidden" />
                fluency.
              </span>
            </h2>
          </div>
          <p className="font-display text-[24px] sm:text-[28px] lg:text-[32px] font-medium text-ink leading-[1.28] tracking-[-0.02em] mt-10 sm:mt-10 text-balance">
            Sales &amp; go-to-market
          </p>
          <p className="font-display text-[22px] sm:text-[26px] lg:text-[30px] font-medium text-gold leading-[1.35] tracking-[-0.02em] mt-3 sm:mt-2 max-w-[16ch] sm:max-w-none mx-auto text-balance">
            &amp; the custom AI systems I build.
          </p>
          <div className="mt-12 sm:mt-12 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3.5 sm:gap-3">
            <a href={calendlyUrl} target="_blank" rel="noopener noreferrer" className="btn-primary min-h-[52px] sm:min-h-[48px]">
              Book 30 minutes
            </a>
            <a href="/resume" className="btn-ghost min-h-[52px] sm:min-h-[48px]">
              Résumé
            </a>
          </div>
        </div>
      </div>

      <div className="relative z-10 mt-14 sm:mt-24">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className="stat-tile text-center px-4 py-8 sm:px-5 sm:py-7 reveal-up"
              style={{ animationDelay: `${i * 80}ms` }}
              aria-label={`${stat.number} ${stat.label}`}
            >
              <p className="font-display text-[32px] sm:text-[44px] font-semibold text-ink leading-none tracking-[-0.03em] tabular-nums">
                {stat.number}
              </p>
              <p className="text-[12px] sm:text-[13px] text-muted leading-[1.55] mt-3.5">{stat.label}</p>
            </div>
          ))}
        </div>
        <div className="glass-panel mt-8 sm:mt-12 px-7 py-8 sm:px-10 sm:py-9 max-w-[56ch] mx-auto text-center">
          <p className="text-[15px] sm:text-[15px] text-muted leading-[1.75]">
            Current role: Net New AE at SPS Commerce — full-cycle sales for complex B2B SaaS, including AI go-to-market with VPs and directors. Based in Minneapolis.
          </p>
        </div>
      </div>
    </section>
  )
}
