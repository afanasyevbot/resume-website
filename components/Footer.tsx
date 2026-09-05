import Image from 'next/image'
import { calendlyUrl, publicEmail } from '@/lib/siteContent'

export default function Footer() {
  return (
    <footer id="contact" className="section-divider pb-16 sm:pb-20">
      <div className="text-center mx-auto max-w-[40rem]">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ghost mb-3">Contact</p>
        <h2 className="font-display text-[32px] sm:text-[44px] font-medium text-ink leading-[1.12] tracking-[-0.02em] mb-4">
          Open to account executive and go-to-market roles
        </h2>
        <p className="text-[15px] text-muted leading-[1.65] mb-8">
          B2B SaaS: full-cycle sales, prescriptive discovery, and the systems behind the pitch. Book 20 minutes or share a JD.
        </p>
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-center gap-2.5">
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
            <Image src="/icons/document.svg" alt="" aria-hidden width={16} height={16} />
            Résumé
          </a>
          <a
            href={`mailto:${publicEmail}`}
            className="inline-flex items-center justify-center min-h-[48px] px-4 text-[14px] font-semibold text-ink hover:underline underline-offset-4 decoration-border"
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
      <p className="text-[12px] text-ghost mt-12 text-center">© {new Date().getFullYear()} Matthew Afanasiev</p>
    </footer>
  )
}
