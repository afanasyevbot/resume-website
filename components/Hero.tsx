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
    <section className="relative pt-[88px] pb-8 sm:pb-12 overflow-hidden">
      <div className="relative">
        <div
          className="pointer-events-none relative mx-auto mb-5 w-[140px] sm:w-[168px] aspect-[7/9] hero-portrait-arch lg:absolute lg:mx-0 lg:mb-0 lg:top-10 lg:right-6 lg:right-10 lg:w-[220px] xl:w-[252px] reveal-up"
          aria-hidden="true"
        >
          <div className="absolute -inset-6 rounded-full bg-gradient-to-br from-gold/20 via-transparent to-transparent blur-2xl opacity-70" />
          <div className="relative overflow-hidden bg-transparent w-full h-full">
            <Image
              src="/images/headshot-sm.webp"
              alt="Matthew Afanasiev"
              fill
              sizes="(max-width: 640px) 140px, (max-width: 1024px) 168px, 420px"
              className="object-contain object-center drop-shadow-[0_12px_32px_rgba(30,77,50,0.18)]"
              priority
            />
          </div>
        </div>

        <div className="relative z-10 mx-auto max-w-[36rem] lg:max-w-[40rem] text-center pt-2 lg:pt-6 reveal-up">
          <p className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.12em] sm:tracking-[0.18em] text-ghost px-3 py-1.5 rounded-full glass-tile">
            Open to AE &amp; GTM roles · B2B SaaS
          </p>
          <h2 className="font-display text-[32px] sm:text-[52px] lg:text-[62px] font-medium text-ink leading-[1.08] tracking-[-0.03em] mt-5 text-balance">
            I sell by guiding the buyer.
          </h2>
          <p className="text-[15px] sm:text-[16px] text-muted leading-[1.65] mt-5 mx-auto max-w-[42ch] px-1">
            Five years selling complex B2B SaaS. Prescriptive selling: find the pain, walk the buying process, and teach how the platform solves it.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5">
            <a href={calendlyUrl} target="_blank" rel="noopener noreferrer" className="btn-primary">
              Book 20 minutes
            </a>
            <a href="/resume" className="btn-ghost">
              Résumé
            </a>
          </div>
        </div>
      </div>

      <div className="relative z-10 mt-12 sm:mt-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className="stat-tile text-center px-3 py-5 sm:px-4 sm:py-6 reveal-up"
              style={{ animationDelay: `${i * 80}ms` }}
              aria-label={`${stat.number} ${stat.label}`}
            >
              <p className="font-display text-[30px] sm:text-[44px] font-semibold text-ink leading-none tracking-[-0.03em] tabular-nums">
                {stat.number}
              </p>
              <p className="text-[11px] sm:text-[13px] text-muted leading-[1.45] mt-2.5">{stat.label}</p>
            </div>
          ))}
        </div>
        <div className="glass-panel mt-8 px-5 py-6 sm:px-8 sm:py-7 max-w-[52ch] mx-auto text-center">
          <p className="text-[14px] sm:text-[15px] text-muted leading-[1.65]">
            Current role: Net New AE at SPS Commerce — full-cycle sales rep for complex B2B SaaS, including AI go-to-market with VPs and directors. Five years in B2B SaaS. Based in Minneapolis.
          </p>
        </div>
      </div>
    </section>
  )
}
