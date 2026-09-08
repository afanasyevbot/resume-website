import Image from 'next/image'
import { calendlyUrl, publicEmail } from '@/lib/siteContent'

export default function ClosingHero() {
  return (
    <section id="contact" className="section-divider py-20 sm:py-24 text-center">
      <div className="mx-auto max-w-[44rem] reveal-up">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ghost mb-6">The close</p>
        <h2 className="font-display font-semibold text-ink leading-[1] sm:leading-[0.95] tracking-[-0.04em] text-[36px] sm:text-[72px] lg:text-[80px]">
          Sales.
          <br />
          Depth.
          <br />
          <span className="text-gold">Builder fluency.</span>
        </h2>
        <p className="text-[15px] sm:text-[16px] text-muted leading-[1.65] mt-8 mx-auto max-w-[36ch]">
          Five years selling complex B2B SaaS. 7 production systems built while carrying quota.
        </p>

        <div className="mt-16 sm:mt-20 pt-16 sm:pt-20 border-t border-border">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ghost mb-3">Contact</p>
          <h3 className="font-display text-[28px] sm:text-[44px] font-medium text-ink leading-[1.12] tracking-[-0.02em] mb-4 text-balance">
            Open to account executive and go-to-market roles
          </h3>
          <p className="text-[15px] text-muted leading-[1.65] mb-8 mx-auto max-w-[40ch]">
            B2B SaaS: full-cycle sales, consultative discovery, and the systems behind the pitch. Book 30 minutes or share a JD.
          </p>
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-center gap-2.5">
            <a href={calendlyUrl} target="_blank" rel="noopener noreferrer" className="btn-primary">
              Book 30 minutes
            </a>
            <a href="/resume" className="btn-ghost">
              <Image src="/icons/document.svg" alt="" aria-hidden width={16} height={16} />
              Résumé
            </a>
            <a
              href={`mailto:${publicEmail}`}
              className="inline-flex items-center justify-center min-h-[48px] px-4 text-[14px] font-semibold text-ink hover:underline underline-offset-4 decoration-border break-all"
            >
              {publicEmail}
            </a>
            <a
              href="https://linkedin.com/in/matthewafanasiev"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1 min-h-[48px] px-4 text-[14px] font-semibold text-ink hover:underline underline-offset-4 decoration-border"
            >
              LinkedIn
              <Image src="/icons/external-link.svg" alt="" aria-hidden width={14} height={14} />
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
