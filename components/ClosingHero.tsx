import Image from 'next/image'
import { calendlyUrl, publicEmail } from '@/lib/siteContent'

export default function ClosingHero() {
  return (
    <section id="contact" className="section-divider py-20 sm:py-24 text-center">
      <div className="mx-auto max-w-[44rem] reveal-up">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ghost mb-6">The close</p>
        <h2 className="font-display font-semibold text-ink leading-[1.08] sm:leading-[1.05] tracking-[-0.03em] text-[32px] sm:text-[48px] lg:text-[56px] text-balance">
          If the seat needs someone who can sell it and build it
        </h2>
        <p className="text-[15px] sm:text-[16px] text-muted leading-[1.65] mt-6 mx-auto max-w-[40ch]">
          Open to account executive and go-to-market roles. Book 30 minutes or send a JD.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-center gap-2.5">
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
    </section>
  )
}
