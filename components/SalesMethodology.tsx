'use client'

import { useState } from 'react'
import Image from 'next/image'
import { methodology } from '@/lib/siteContent'

export default function SalesMethodology() {
  const [open, setOpen] = useState(false)

  return (
    <section id="methodology" className="section-band">
      <div className="text-center mx-auto max-w-[36rem]">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="font-display text-[24px] sm:text-[36px] font-semibold text-ink tracking-[-0.02em] underline underline-offset-4 decoration-border hover:decoration-ink/40 px-2"
        >
          Sales methodology
          <span className={`inline-flex transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
            <Image src="/icons/chevron.svg" alt="" aria-hidden width={16} height={16} className="inline-block shrink-0 ml-1" />
          </span>
        </button>
        <p className="text-[14px] text-ghost mt-1.5">How I sell B2B SaaS. Tap to expand.</p>
      </div>

      {open && (
        <div className="mt-8 pt-6 border-t border-border/70 space-y-6 text-left mx-auto max-w-[32rem]">
          {methodology.map((item) => (
            <article key={item.step}>
              <p className="text-[12px] font-medium uppercase tracking-[0.16em] text-ghost mb-2">{item.step}</p>
              <h3 className="font-display text-[24px] sm:text-[26px] font-semibold text-ink mb-2 tracking-[-0.02em]">
                {item.title}
              </h3>
              <p className="text-[16px] text-muted leading-[1.65]">{item.body}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
