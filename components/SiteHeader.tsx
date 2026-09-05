'use client'

import { useEffect, useState } from 'react'
import { OPEN_ASK_EVENT } from '@/lib/siteContent'

const links = [
  { href: '#tools', label: 'Ask' },
  { href: '#experience', label: 'Experience' },
  { href: '#builder', label: 'Systems' },
  { href: '#contact', label: 'Contact' },
]

export default function SiteHeader() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 12)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function openAsk() {
    setOpen(false)
    window.dispatchEvent(new Event(OPEN_ASK_EVENT))
    document.getElementById('tools')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled ? 'bg-paper/92 border-b border-border/70 backdrop-blur-md' : 'bg-transparent'
      }`}
    >
      <div className="max-w-page mx-auto px-4 sm:px-10 lg:px-12 h-[64px] sm:h-[68px] relative flex items-center gap-2">
        <button
          type="button"
          className="lg:hidden shrink-0 min-h-[44px] min-w-[44px] px-3 rounded-full border border-border bg-surface/80 text-[12px] font-medium text-ink"
          aria-expanded={open}
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}
        >
          Menu
        </button>

        <nav className="hidden lg:flex items-center gap-7 flex-1" aria-label="Sections">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-[12px] font-medium lowercase tracking-[0.04em] text-muted hover:text-ink transition-colors"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <h1 className="m-0 min-w-0 flex-1 lg:flex-none lg:absolute lg:left-1/2 lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 text-center">
          <a
            className="font-display text-[16px] xs:text-[18px] sm:text-[23px] font-bold text-ink tracking-[0.01em] leading-tight"
            href="/"
          >
            Matthew Afanasiev
          </a>
        </h1>

        <div className="flex items-center justify-end shrink-0 lg:flex-1">
          <button
            type="button"
            onClick={openAsk}
            className="inline-flex items-center justify-center min-h-[44px] px-3 sm:px-5 rounded-full border border-border bg-surface/80 text-[12px] font-medium text-ink hover:bg-surface transition-colors"
          >
            <span className="sm:hidden">Ask</span>
            <span className="hidden sm:inline">Ask a question</span>
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-border bg-paper px-5 py-4 flex flex-col gap-2">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="min-h-[40px] flex items-center text-[14px] font-medium text-ink"
            >
              {l.label}
            </a>
          ))}
        </div>
      )}
    </header>
  )
}
