'use client'

import { useState } from 'react'
import Image from 'next/image'
import GlowRoutineApp from '@/components/GlowRoutineApp'
import { advisorUrl, glowUrl, paradiseCaseStudyUrl, pulseProductUrl } from '@/lib/siteContent'

export default function SystemsSection() {
  const [glowOpen, setGlowOpen] = useState(false)

  return (
    <section id="builder" className="section-divider">
      <div className="mb-12 sm:mb-14">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] mb-3 text-ghost">Selected work</p>
        <h2 className="font-display text-[30px] sm:text-[40px] lg:text-[44px] font-medium leading-[1.12] tracking-[-0.02em] max-w-[22ch] text-ink">
          Products &amp; systems I built
        </h2>
        <p className="text-[15px] sm:text-[16px] leading-[1.65] mt-4 max-w-[52ch] text-muted">
          Client platforms and own products built while carrying quota — from M&amp;A buyer research to owner dashboards and lead generation.
        </p>
      </div>

      <div className="space-y-6">
        <article className="card card-lift overflow-hidden signature-card">
          <div className="p-7 sm:p-8">
            <Image
              src="/images/logos/paradise-capital.avif"
              alt="Paradise Capital"
              width={220}
              height={48}
              className="h-9 sm:h-10 w-auto mb-5"
            />
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ghost mb-2">Featured case study · M&amp;A advisory</p>
            <h3 className="font-display font-semibold text-ink leading-[1.15] tracking-[-0.02em] mb-3 text-[26px] sm:text-[32px]">
              Buyer Engine
            </h3>
            <p className="text-[15px] text-muted leading-[1.7]">
              Preparing a buyer list for an M&amp;A mandate required repeated manual research. Built a platform that finds, enriches, and ranks prospective acquirers for the firm&apos;s deal workflow.
            </p>
            <p className="text-[15px] text-ink font-medium leading-[1.65] mt-4">
              Client-reported result: buyer-list preparation reduced from weeks to minutes.
            </p>
            <p className="text-[14px] text-muted leading-[1.65] mt-3">
              My role: client discovery, commercial agreement, solution design, development, deployment, and ongoing maintenance.
            </p>
            <a
              href={paradiseCaseStudyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[14px] text-ink font-semibold mt-5 hover:underline underline-offset-4"
            >
              Read the Paradise Capital case study
              <Image src="/icons/external-link.svg" alt="" aria-hidden width={14} height={14} />
            </a>
            <p className="text-[12px] text-ghost mt-5 pt-5 border-t border-border">
              FastAPI · Anthropic Agent SDK · Supabase · Next.js
            </p>
          </div>
        </article>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <article className="card card-lift overflow-hidden">
            <div className="p-7 sm:p-7">
              <Image
                src="/images/logos/fidelis-pulse.png"
                alt="Fidelis Pulse"
                width={226}
                height={61}
                className="h-11 sm:h-12 w-auto mb-5"
              />
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ghost mb-2">Own product · For business owners</p>
              <h3 className="font-display font-semibold text-ink leading-[1.15] tracking-[-0.02em] mb-3 text-[22px] sm:text-[26px]">
                Fidelis Pulse
              </h3>
              <p className="text-[15px] text-muted leading-[1.7]">
                The dashboard that gives you a pulse on your business by consolidating all of your data in one place.
              </p>
              <a
                href={pulseProductUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[14px] text-ink font-semibold mt-5 hover:underline underline-offset-4"
              >
                View Pulse
                <Image src="/icons/external-link.svg" alt="" aria-hidden width={14} height={14} />
              </a>
              <p className="text-[12px] text-ghost mt-5 pt-5 border-t border-border">Next.js · Railway Postgres · Stripe · LLM APIs</p>
            </div>
          </article>

          <article className="card card-lift overflow-hidden">
            <div className="p-7 sm:p-7">
              <Image
                src="/images/logos/fidelis-advisor.png"
                alt="Fidelis Advisor"
                width={234}
                height={61}
                className="h-11 sm:h-12 w-auto mb-5"
              />
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ghost mb-2">Own product · For M&amp;A firms</p>
              <h3 className="font-display font-semibold text-ink leading-[1.15] tracking-[-0.02em] mb-3 text-[22px] sm:text-[26px]">
                Fidelis Advisor
              </h3>
              <p className="text-[15px] text-muted leading-[1.7]">
                A workspace for M&amp;A firms to onboard clients, keep them ready for a buyer, share documents, and send notes and reminders.
              </p>
              <a
                href={advisorUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[14px] text-ink font-semibold mt-5 hover:underline underline-offset-4"
              >
                View Advisor
                <Image src="/icons/external-link.svg" alt="" aria-hidden width={14} height={14} />
              </a>
              <p className="text-[12px] text-ghost mt-5 pt-5 border-t border-border">Next.js · Railway Postgres · Stripe · Claude for Finance</p>
            </div>
          </article>

          <article className="card card-lift overflow-hidden">
            <div className="p-7 sm:p-7 h-full flex flex-col">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ghost mb-2">Client build</p>
              <h3 className="font-display font-semibold text-ink leading-[1.15] tracking-[-0.02em] mb-4 text-[22px] sm:text-[26px]">
                AI Lead Generation
              </h3>
              <p className="text-[15px] text-muted leading-[1.7] flex-1">
                Automated lead discovery and qualification with Next.js, Playwright, and Railway.
              </p>
              <p className="text-[12px] text-ghost mt-5 pt-5 border-t border-border">
                Next.js · Playwright · Railway
              </p>
            </div>
          </article>
        </div>
      </div>

      <div className="mt-12">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-ghost mb-4">More builds</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <article className="card card-lift overflow-hidden md:col-span-2">
            <div className="p-7 sm:p-7">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ghost mb-2">Consumer PWA · expandable app</p>
              <h3 className="font-display font-semibold text-ink leading-[1.15] tracking-[-0.02em] mb-3 text-[20px] sm:text-[22px]">
                Glow Routine
              </h3>
              <p className="text-[15px] text-muted leading-[1.7]">
                Skincare tracking PWA with AM/PM checklists, streak tracking, and an advisor. Side project: expand below to tap through a preview.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setGlowOpen((v) => !v)}
                  aria-expanded={glowOpen}
                  className="inline-flex items-center min-h-[44px] px-4 rounded-[8px] border border-border bg-paper text-[14px] font-semibold text-ink hover:border-ink/30"
                >
                  {glowOpen ? 'Close app' : 'Open the app'}
                </button>
                <a
                  href={glowUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[14px] text-ink font-semibold hover:underline underline-offset-4"
                >
                  View project
                  <Image src="/icons/external-link.svg" alt="" aria-hidden width={14} height={14} />
                </a>
              </div>
            </div>
            {glowOpen && (
              <div className="border-t border-border bg-[#faf8f6] px-3 py-5 sm:px-6 sm:py-6 max-h-[min(70vh,560px)] overflow-y-auto">
                <GlowRoutineApp />
              </div>
            )}
          </article>

          <article className="card card-lift overflow-hidden">
            <div className="p-7 sm:p-7">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ghost mb-2">Client build · Advisory</p>
              <h3 className="font-display font-semibold text-ink leading-[1.15] tracking-[-0.02em] mb-3 text-[20px] sm:text-[22px]">
                Business Valuation System
              </h3>
              <p className="text-[15px] text-muted leading-[1.7]">
                Valuation workspace for advisory deals. Ingests financials from PDFs, Excel, or manual inputs, then walks each deal through 12 models to produce defensible outputs.
              </p>
              <p className="text-[12px] text-ghost mt-5 pt-5 border-t border-border">Python · Streamlit · Supabase · Docker</p>
            </div>
          </article>

          <article className="card card-lift overflow-hidden">
            <div className="p-7 sm:p-7">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ghost mb-2">Pro bono</p>
              <h3 className="font-display font-semibold text-ink leading-[1.15] tracking-[-0.02em] mb-3 text-[20px] sm:text-[22px]">
                Grace Church
              </h3>
              <p className="text-[15px] text-muted leading-[1.7]">
                Built a custom member portal and back end on Azure SQL: website rebrand, online giving, Microsoft 365 for staff email, and tools for announcements, groups, and volunteer coordination.
              </p>
              <p className="text-[12px] text-ghost mt-5 pt-5 border-t border-border">Next.js · Azure SQL · Microsoft 365 · Donation platform</p>
              <a
                href="https://eagangrace.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[14px] text-ink font-semibold mt-5 hover:underline underline-offset-4"
              >
                eagangrace.com
                <Image src="/icons/external-link.svg" alt="" aria-hidden width={14} height={14} />
              </a>
            </div>
          </article>
        </div>
      </div>
    </section>
  )
}
