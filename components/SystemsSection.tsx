'use client'

import { useState } from 'react'
import Image from 'next/image'
import GlowRoutineApp from '@/components/GlowRoutineApp'
import { glowUrl, pulseUrl } from '@/lib/siteContent'

export default function SystemsSection() {
  const [glowOpen, setGlowOpen] = useState(false)

  return (
    <section id="builder" className="section-divider">
      <div className="mb-10 sm:mb-14">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] mb-3 text-ghost">Selected work</p>
        <h2 className="font-display text-[30px] sm:text-[40px] lg:text-[44px] font-medium leading-[1.12] tracking-[-0.02em] max-w-[22ch] text-ink">
          Seven systems built in production
        </h2>
        <p className="text-[15px] sm:text-[16px] leading-[1.65] mt-4 max-w-[52ch] text-muted">
          Signature work built while carrying quota: live product, two lead-gen systems, client platforms, and one expandable app.
        </p>
      </div>

      <div className="space-y-6">
        <article className="card overflow-hidden signature-card">
          <div className="p-6 sm:p-8">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ghost mb-2">Signature build · M&amp;A advisory</p>
            <h3 className="font-display font-semibold text-ink leading-[1.15] tracking-[-0.02em] mb-3 text-[26px] sm:text-[32px]">
              Buyer Engine · Paradise Capital
            </h3>
            <p className="text-[15px] text-muted leading-[1.7]">
              Full-cycle solo engagement: identified the pain point, pitched the solution, then designed, built, and now maintain a production platform that finds, enriches, and ranks likely buyers for M&amp;A deals. One person owning the pitch, the build, and the running system.
            </p>
            <p className="text-[12px] text-ghost mt-5 pt-5 border-t border-border">
              Next.js · Supabase (pgvector) · FastAPI · Agent SDK · Turborepo
            </p>
          </div>
        </article>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <article className="card overflow-hidden">
            <div className="p-6 sm:p-7">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ghost mb-2">Own product · Live SaaS</p>
              <h3 className="font-display font-semibold text-ink leading-[1.15] tracking-[-0.02em] mb-3 text-[22px] sm:text-[26px]">
                Pulse
              </h3>
              <p className="text-[15px] text-muted leading-[1.7]">
                Live SaaS platform for financial advisors and owner-operators. Multi-tenant architecture, Stripe billing, QuickBooks + Xero + Plaid integrations, and an advisor workspace. Own product, built while carrying full quota.
              </p>
              <a
                href={pulseUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[14px] text-ink font-semibold mt-5 hover:underline underline-offset-4"
              >
                View live product
                <Image src="/icons/external-link.svg" alt="" aria-hidden width={14} height={14} />
              </a>
              <p className="text-[12px] text-ghost mt-5 pt-5 border-t border-border">Next.js · Railway Postgres · Stripe · LLM APIs</p>
            </div>
          </article>

          <article className="card overflow-hidden">
            <div className="p-6 sm:p-7">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ghost mb-2">Lead gen · M&amp;A advisory</p>
              <h3 className="font-display font-semibold text-ink leading-[1.15] tracking-[-0.02em] mb-3 text-[22px] sm:text-[26px]">
                M&amp;A lead-gen platform
              </h3>
              <p className="text-[15px] text-muted leading-[1.7]">
                Automated acquisition-target discovery and qualification. Scoring against buyer criteria, a persistent lead database, and weekly reports for the advisory team.
              </p>
              <p className="text-[12px] text-ghost mt-5 pt-5 border-t border-border">Next.js · SQLite · Railway · Sentry</p>
            </div>
          </article>

          <article className="card overflow-hidden lg:col-span-2">
            <div className="p-6 sm:p-7">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ghost mb-2">Lead gen · Real estate tech</p>
              <h3 className="font-display font-semibold text-ink leading-[1.15] tracking-[-0.02em] mb-3 text-[22px] sm:text-[26px]">
                Real estate prospecting engine
              </h3>
              <p className="text-[15px] text-muted leading-[1.7]">
                Automated prospect discovery with Playwright scraping, multi-provider enrichment (Apollo, Hunter), ICP scoring, and outreach draft generation on a cron pipeline.
              </p>
              <p className="text-[12px] text-ghost mt-5 pt-5 border-t border-border">Next.js · Playwright · Apollo · Railway</p>
            </div>
          </article>
        </div>
      </div>

      <div className="mt-12">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-ghost mb-4">Other</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <article className="card overflow-hidden md:col-span-2">
            <div className="p-6 sm:p-7">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ghost mb-2">Consumer PWA · expandable app</p>
              <h3 className="font-display font-semibold text-ink leading-[1.15] tracking-[-0.02em] mb-3 text-[20px] sm:text-[22px]">
                Glow Routine
              </h3>
              <p className="text-[15px] text-muted leading-[1.7]">
                Skincare tracking PWA with AM/PM checklists, streak tracking, and an advisor. Side project. Expand the app to tap through it.
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
              <div className="border-t border-border bg-[#faf8f6] px-4 py-6 sm:px-6 sm:py-8">
                <GlowRoutineApp />
              </div>
            )}
          </article>

          <article className="card overflow-hidden">
            <div className="p-6 sm:p-7">
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

          <article className="card overflow-hidden">
            <div className="p-6 sm:p-7">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ghost mb-2">Pro bono</p>
              <h3 className="font-display font-semibold text-ink leading-[1.15] tracking-[-0.02em] mb-3 text-[20px] sm:text-[22px]">
                Grace Church
              </h3>
              <p className="text-[15px] text-muted leading-[1.7]">
                Full digital transformation: website rebrand, online giving, Microsoft 365 for staff email, and a member portal for announcements, groups, and volunteer coordination.
              </p>
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
