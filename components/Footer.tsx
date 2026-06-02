import Link from 'next/link'
import { professionalContext as ctx } from '@/lib/professionalContext'

export default function Footer() {
  const { identity } = ctx

  return (
    <footer id="contact" className="mt-24 border-t border-border pt-12">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-8">
        <div>
          <p className="text-[11px] tracking-[4px] uppercase text-text-faint font-semibold mb-3">Get in touch</p>
          <h2 className="font-display text-[28px] font-semibold text-text-bright leading-tight mb-4">
            Let&apos;s talk revenue and AI.
          </h2>
          <div className="flex flex-col gap-1.5 text-[14px]">
            <a href={`mailto:${identity.email}`} className="text-text-muted hover:text-gold transition-colors w-fit">
              {identity.email}
            </a>
            <a
              href={`https://${identity.linkedin}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-muted hover:text-gold transition-colors w-fit"
            >
              {identity.linkedin} ↗
            </a>
            <a
              href={`https://${identity.calendly}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-muted hover:text-gold transition-colors w-fit"
            >
              Book a call ↗
            </a>
          </div>
        </div>

        <Link
          href="/resume"
          className="text-gold border border-gold/50 px-6 py-3 rounded text-[13px] font-semibold tracking-wide hover:bg-gold/5 transition-colors w-fit"
        >
          View / Print Résumé →
        </Link>
      </div>

      <p className="text-[11px] text-text-ghost mt-12">
        © {new Date().getFullYear()} {identity.name}. Built with Next.js and the Claude API.
      </p>
    </footer>
  )
}
