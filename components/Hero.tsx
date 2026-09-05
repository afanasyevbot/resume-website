import Image from 'next/image'
import { calendlyUrl } from '@/lib/siteContent'

const stats = [
  { number: '#1', label: 'of 30 AEs · Q1 2026' },
  { number: '102.6%', label: 'FY25 attainment' },
  { number: '58%', label: 'ARR growth · FY24' },
  { number: '7', label: 'systems built' },
]

export default function Hero() {
  return (
    <section className="relative pt-[88px] pb-8 sm:pb-12 overflow-hidden">
      <div className="relative">
        <div
          className="pointer-events-none hidden md:block absolute top-10 right-6 lg:right-10 w-[200px] md:w-[220px] lg:w-[252px] aspect-[7/9] hero-portrait-arch"
          aria-hidden="true"
        >
          <div className="relative overflow-hidden bg-transparent w-full h-full">
            <Image
              src="/images/headshot-sm.webp"
              alt="Matthew Afanasiev"
              fill
              sizes="(max-width: 1024px) 42vw, 420px"
              className="object-contain object-center"
              priority
            />
          </div>
        </div>

        <div className="relative z-10 mx-auto max-w-[36rem] lg:max-w-[40rem] text-center pt-2 lg:pt-6">
          <div className="md:hidden flex justify-center mb-5">
            <div className="relative overflow-hidden border border-border bg-surface shrink-0 rounded-full !w-[72px] !h-[72px]">
              <Image
                src="/images/headshot-sm.webp"
                alt="Matthew Afanasiev"
                fill
                sizes="72px"
                className="object-cover object-[center_18%]"
                priority
              />
            </div>
          </div>

          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ghost">
            Open to AE &amp; GTM roles · B2B SaaS
          </p>
          <h2 className="font-display text-[34px] sm:text-[52px] lg:text-[62px] font-medium text-ink leading-[1.06] tracking-[-0.03em] mt-4">
            I sell by guiding the buyer.
          </h2>
          <p className="text-[16px] text-muted leading-[1.65] mt-5 mx-auto max-w-[42ch]">
            Five years in B2B SaaS. Prescriptive selling: find the pain, walk the buying process, and teach how the solution solves it.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5">
            <a
              href={calendlyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 min-h-[48px] px-6 py-3 rounded-[8px] text-[14px] font-semibold transition-all bg-gold text-ink border border-gold hover:opacity-90"
            >
              Book 20 minutes
            </a>
            <a
              href="/resume"
              className="inline-flex items-center justify-center gap-2 min-h-[48px] px-6 py-3 rounded-[8px] text-[14px] font-semibold transition-all bg-surface text-ink border border-border hover:bg-paper hover:border-ink/20"
            >
              Résumé
            </a>
          </div>
        </div>
      </div>

      <div className="relative z-10 mt-12 sm:mt-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-8 border-y border-border/70 py-8 sm:py-10">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center px-2 py-3" aria-label={`${stat.number} ${stat.label}`}>
              <p className="font-display text-[36px] sm:text-[44px] font-semibold text-ink leading-none tracking-[-0.03em] tabular-nums">
                {stat.number}
              </p>
              <p className="text-[12px] sm:text-[13px] text-muted leading-[1.45] mt-2.5">{stat.label}</p>
            </div>
          ))}
        </div>
        <p className="text-[14px] sm:text-[15px] text-muted leading-[1.65] mt-8 max-w-[52ch] mx-auto text-center">
          Current role: Net New AE at SPS Commerce. Full-cycle mid-market deals with operators who need a guide, not a pitch deck. Based in Minneapolis.
        </p>
      </div>
    </section>
  )
}
