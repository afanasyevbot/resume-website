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
          className="pointer-events-none hidden md:block absolute top-1/2 -translate-y-[46%] right-[6%] lg:right-[12%] xl:right-[16%] w-[240px] lg:w-[320px] xl:w-[380px] aspect-[7/9] hero-portrait-arch z-0"
          aria-hidden="true"
        >
          <div className="absolute -inset-16 rounded-full bg-[radial-gradient(circle_at_40%_50%,rgba(246,231,200,0.75)_0%,rgba(246,231,200,0.35)_42%,transparent_72%)] blur-3xl" />
          <div className="absolute inset-y-[-8%] -left-28 w-36 bg-gradient-to-r from-[#f6e7c8] via-[#f6e7c8]/55 to-transparent" />
          <div className="absolute -top-10 inset-x-[-12%] h-20 bg-gradient-to-b from-[#f6e7c8] to-transparent opacity-70" />
          <div className="absolute -bottom-10 inset-x-[-12%] h-20 bg-gradient-to-t from-[#f6e7c8] to-transparent opacity-70" />
          <div className="relative overflow-hidden bg-transparent w-full h-full">
            <Image
              src="/images/headshot-sm.webp"
              alt=""
              fill
              sizes="(max-width: 1024px) 280px, 380px"
              className="object-contain object-center"
              priority
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
