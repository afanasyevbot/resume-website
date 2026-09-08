'use client'

import { useState } from 'react'
import Image from 'next/image'
import { methodology } from '@/lib/siteContent'

export default function SalesMethodology() {
  const [open, setOpen] = useState(false)

  return (
    <section id="methodology" className="section-band -mx-5 sm:-mx-10 lg:-mx-12">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="glass-tile glass-tile-lift w-full flex items-center justify-between gap-4 px-6 sm:px-10 lg:px-12 py-5 sm:py-6 text-left"
      >
        <div>
          <p className="font-display text-[24px] sm:text-[32px] lg:text-[36px] font-semibold text-ink tracking-[-0.02em]">
            Sales methodology
          </p>
          <p className="text-[14px] text-ghost mt-1.5">How I sell B2B SaaS. {open ? 'Tap to collapse.' : 'Tap to expand.'}</p>
        </div>
        <span
          className={`inline-flex shrink-0 rounded-full border border-glass-border p-2 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        >
          <Image src="/icons/chevron.svg" alt="" aria-hidden width={16} height={16} className="block" />
        </span>
      </button>

      {open && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-0 text-left">
          {methodology.map((item, i) => (
            <article
              key={item.step}
              className="glass-tile glass-tile-lift p-6 sm:p-7 h-full reveal-up"
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
