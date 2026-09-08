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
    <section className="relative pt-[104px] sm:pt-[116px] pb-14 sm:pb-20 overflow-hidden">
      <div className="relative reveal-up">
        <div
          className="pointer-events-none hidden md:block absolute top-1/2 -translate-y-1/2 right-0 lg:-right-6 xl:-right-4 w-[min(46vw,280px)] lg:w-[400px] xl:w-[460px] aspect-[7/9] hero-portrait-arch z-0"
          aria-hidden="true"
        >
          <div className="relative overflow-hidden bg-transparent w-full h-full">
            <Image
              src="/images/headshot-sm.webp"
              alt=""
              fill
              sizes="(max-width: 1024px) 280px, 460px"
              className="object-contain object-center drop-shadow-[0_12px_32px_rgba(30,77,50,0.16)]"
              priority
              quality={92}
            />
          </div>
        </div>

        <div className="relative z-10 mx-auto w-full max-w-[38rem] text-center">
          <h2 className="font-display font-bold text-ink leading-[0.95] tracking-[-0.04em] text-[40px] sm:text-[72px] lg:text-[76px] xl:text-[80px]">
            Sales.
            <br />
            Depth.
            <br />
            <span className="text-gold">Builder fluency.</span>
          </h2>
          <p className="font-display text-[18px] sm:text-[22px] lg:text-[24px] font-medium text-muted leading-[1.35] tracking-[-0.01em] mt-8 sm:mt-9 text-balance mx-auto max-w-[34ch]">
            Sales &amp; go-to-market
          </p>
          <p className="font-display text-[17px] sm:text-[21px] lg:text-[23px] font-medium text-gold leading-[1.35] tracking-[-0.01em] mt-1.5 sm:mt-2 text-balance mx-auto max-w-[34ch]">
            &amp; the custom AI systems I build.
          </p>
          <p className="text-[15px] sm:text-[17px] text-muted leading-[1.7] mt-7 sm:mt-8 mx-auto max-w-[46ch]">
            Five years closing complex B2B SaaS — consultative selling on the deal side, production systems leveraging AI on the build side. Both while carrying quota.
          </p>
          <div className="mt-10 sm:mt-12 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
            <a href={calendlyUrl} target="_blank" rel="noopener noreferrer" className="btn-primary">
              Book 30 minutes
            </a>
            <a href="/resume" className="btn-ghost">
              Résumé
            </a>
          </div>
        </div>
      </div>

      <div className="relative z-10 mt-16 sm:mt-24">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className="stat-tile text-center px-3 py-6 sm:px-5 sm:py-7 reveal-up"
              style={{ animationDelay: `${i * 80}ms` }}
              aria-label={`${stat.number} ${stat.label}`}
            >
              <p className="font-display text-[30px] sm:text-[44px] font-semibold text-ink leading-none tracking-[-0.03em] tabular-nums">
                {stat.number}
              </p>
              <p className="text-[11px] sm:text-[13px] text-muted leading-[1.45] mt-3">{stat.label}</p>
            </div>
          ))}
        </div>
        <div className="glass-panel mt-10 sm:mt-12 px-6 py-7 sm:px-10 sm:py-9 max-w-[56ch] mx-auto text-center">
          <p className="text-[14px] sm:text-[15px] text-muted leading-[1.7]">
            Current role: Net New AE at SPS Commerce — full-cycle sales for complex B2B SaaS, including AI go-to-market with VPs and directors. Based in Minneapolis.
          </p>
        </div>
      </div>
    </section>
  )
}
