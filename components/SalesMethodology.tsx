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
          className="glass-tile glass-tile-lift inline-flex items-center gap-2 px-6 py-4 font-display text-[22px] sm:text-[32px] font-semibold text-ink tracking-[-0.02em]"
        >
          Sales methodology
          <span className={`inline-flex transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
            <Image src="/icons/chevron.svg" alt="" aria-hidden width={16} height={16} className="inline-block shrink-0" />
          </span>
        </button>
        <p className="text-[14px] text-ghost mt-3">How I sell B2B SaaS. Tap to expand.</p>
      </div>

      {open && (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 text-left mx-auto max-w-[44rem]">
          {methodology.map((item, i) => (
            <article
              key={item.step}
              className="glass-tile glass-tile-lift p-6 sm:p-7 reveal-up"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <p className="text-[12px] font-medium uppercase tracking-[0.16em] text-ghost mb-2">{item.step}</p>
              <h3 className="font-display text-[22px] sm:text-[24px] font-semibold text-ink mb-2 tracking-[-0.02em]">
                {item.title}
              </h3>
              <p className="text-[15px] text-muted leading-[1.65]">{item.body}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
