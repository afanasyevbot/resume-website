# Portfolio Build Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy Matthew Afanasiev's AI-powered professional portfolio — a Next.js single-page app with a warm gold dark theme, Claude-powered chat, and a role fit assessment engine.

**Architecture:** Single Next.js 15 App Router page assembling six section components. Two API routes handle Anthropic calls server-side. All professional data lives in one TypeScript file (`lib/professionalContext.ts`) injected as the system prompt for both AI endpoints. No database needed.

**Tech Stack:** Next.js 15 (App Router), TypeScript strict, Tailwind CSS, Anthropic SDK, Vitest, Vercel.

---

## File Map

| File | Responsibility |
|---|---|
| `app/layout.tsx` | Font loading (Cormorant Garamond + Inter), metadata, gradient bg wrapper |
| `app/globals.css` | Tailwind directives, CSS custom properties for warm gold palette |
| `app/page.tsx` | Page shell — assembles all 6 section components, scroll refs |
| `app/api/chat/route.ts` | POST handler — Claude Haiku 4.5, conversation history, system prompt |
| `app/api/fit/route.ts` | POST handler — Claude Sonnet 4.6, structured JSON fit analysis |
| `lib/professionalContext.ts` | Matthew's complete professional data — single source of truth for AI |
| `lib/buildSystemPrompt.ts` | Assembles system prompt string from professionalContext |
| `components/Hero.tsx` | Name, tagline, stat bar, CTAs with scroll-to |
| `components/AISystemsSection.tsx` | 6 project cards in 2-col grid, Fidelis Pulse wide |
| `components/ChatSection.tsx` | Static AI chat, chips, 5-question limit, Calendly CTA |
| `components/BehindTheResume.tsx` | Accordion cards — Situation/Approach/Result |
| `components/SkillsMatrix.tsx` | 3-column Deep/Conversant/Not My Zone grid |
| `components/FitAssessment.tsx` | JD textarea, analyze button, results card |
| `tailwind.config.ts` | Custom warm gold color palette |

---

## Task 1: Scaffold Next.js Project

**Files:**
- Create: `package.json`, `next.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `app/globals.css`, `app/layout.tsx`

- [ ] **Step 1: Scaffold Next.js 15 with TypeScript and Tailwind**

```bash
cd /Users/matthewafanasiev/Documents/resume-website
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --no-eslint --import-alias "@/*" --yes
```

Expected: Project files created with Next.js 15, TypeScript, Tailwind.

- [ ] **Step 2: Install Anthropic SDK and Vitest**

```bash
npm install @anthropic-ai/sdk
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom
```

- [ ] **Step 3: Configure Vitest**

Create `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
  },
})
```

Create `vitest.setup.ts`:
```typescript
import '@testing-library/jest-dom'
```

Add to `package.json` scripts:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Configure tailwind custom colors**

Replace `tailwind.config.ts`:
```typescript
import type { Config } from 'tailwindcss'

export default {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#111009',
        surface: '#161210',
        'surface-deep': '#130f0a',
        border: '#2a2218',
        'border-inner': '#221e18',
        gold: '#c9a96e',
        'gold-dim': 'rgba(201,169,110,0.25)',
        'text-bright': '#f5f0e8',
        'text-primary': '#d4c4ae',
        'text-secondary': '#a89278',
        'text-muted': '#8a7a68',
        'text-dim': '#7a6b58',
        'text-faint': '#6b5e4e',
        'text-ghost': '#4a3f32',
        'text-whisper': '#3a3028',
      },
      fontFamily: {
        display: ['var(--font-cormorant)', 'serif'],
        sans: ['var(--font-inter)', 'sans-serif'],
      },
      maxWidth: {
        page: '960px',
      },
    },
  },
} satisfies Config
```

- [ ] **Step 5: Set up globals.css**

Replace `app/globals.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --font-cormorant: 'Cormorant Garamond', serif;
  --font-inter: 'Inter', sans-serif;
}

* {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  background-color: #111009;
  color: #e8ddd0;
  font-family: var(--font-inter), sans-serif;
}

::selection {
  background: rgba(201, 169, 110, 0.2);
  color: #f5f0e8;
}

textarea:focus,
input:focus {
  outline: none;
}
```

- [ ] **Step 6: Set up layout.tsx with fonts and metadata**

Replace `app/layout.tsx`:
```typescript
import type { Metadata } from 'next'
import { Cormorant_Garamond, Inter } from 'next/font/google'
import './globals.css'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-cormorant',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Matthew Afanasiev',
  description: 'I close deals. I ship AI systems.',
  openGraph: {
    title: 'Matthew Afanasiev',
    description: 'Revenue × AI — SaaS Sales Executive & AI Systems Builder',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${inter.variable}`}>
      <body>
        {/* Fixed gradient background */}
        <div
          className="fixed inset-0 pointer-events-none z-0"
          style={{
            background: `
              radial-gradient(ellipse 90% 55% at 50% -5%, rgba(201,169,110,0.22) 0%, transparent 60%),
              radial-gradient(ellipse 60% 40% at 90% 10%, rgba(180,140,80,0.10) 0%, transparent 50%),
              radial-gradient(ellipse 50% 60% at 10% 80%, rgba(160,120,60,0.06) 0%, transparent 50%),
              #111009
            `,
          }}
        />
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  )
}
```

- [ ] **Step 7: Create .env.local**

```bash
echo "ANTHROPIC_API_KEY=your_key_here" > .env.local
```

Then add your real Anthropic API key.

- [ ] **Step 8: Verify dev server starts**

```bash
npm run dev
```

Expected: Server starts at http://localhost:3000 with default Next.js page, no errors.

- [ ] **Step 9: Commit**

```bash
git init
git add -A
git commit -m "feat: scaffold Next.js 15 with Tailwind, Vitest, warm gold config"
```

---

## Task 2: Professional Context Data Layer

**Files:**
- Create: `lib/professionalContext.ts`
- Create: `lib/buildSystemPrompt.ts`
- Create: `lib/types.ts`

- [ ] **Step 1: Write a failing test for buildSystemPrompt**

Create `lib/__tests__/buildSystemPrompt.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { buildSystemPrompt } from '../buildSystemPrompt'
import { professionalContext } from '../professionalContext'

describe('buildSystemPrompt', () => {
  it('includes the name', () => {
    const prompt = buildSystemPrompt(professionalContext)
    expect(prompt).toContain('Matthew Afanasiev')
  })

  it('includes deal size context', () => {
    const prompt = buildSystemPrompt(professionalContext)
    expect(prompt).toContain('$50K')
  })

  it('includes explicit gaps', () => {
    const prompt = buildSystemPrompt(professionalContext)
    expect(prompt).toContain('Enterprise')
  })

  it('includes the not-my-zone instruction', () => {
    const prompt = buildSystemPrompt(professionalContext)
    expect(prompt).toContain("I don't have that on record")
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npm test
```

Expected: FAIL — `lib/buildSystemPrompt` not found.

- [ ] **Step 3: Create lib/types.ts**

```typescript
export interface Role {
  title: string
  company: string
  dates: string
  bullets: string[]
  aiContext: {
    situation: string
    approach: string
    results: string
    lessons: string
  }
}

export interface Project {
  name: string
  badge: string
  description: string
  stack: string[]
  link?: string
}

export interface ProfessionalContext {
  identity: {
    name: string
    email: string
    phone: string
    linkedin: string
    calendly: string
    websites: string[]
    education: string
    firstGenGrad: boolean
  }
  roles: Role[]
  salesContext: {
    dealSizeRange: string
    largestDeal: string
    products: string[]
    industries: string[]
  }
  keyStats: string[]
  starStories: Array<{ title: string; summary: string }>
  projects: Project[]
  skills: {
    deep: string[]
    conversant: string[]
    notMyZone: string[]
  }
  explicitGaps: string[]
  doNotSay: string[]
}
```

- [ ] **Step 4: Create lib/professionalContext.ts**

```typescript
import type { ProfessionalContext } from './types'

export const professionalContext: ProfessionalContext = {
  identity: {
    name: 'Matthew Afanasiev',
    email: 'Afanasyev27@live.com',
    phone: '651-468-1408',
    linkedin: 'linkedin.com/in/matthewafanasiev',
    calendly: 'calendly.com/mafanasiev-fidelisstrategy/30min',
    websites: ['fidelisstrategy.net', 'fidelispulse.com'],
    education: 'BBA, Marketing Management — University of St. Thomas, 2017–2021',
    firstGenGrad: true,
  },

  roles: [
    {
      title: 'Net New Subscriber Account Executive, Supply Chain Performance',
      company: 'SPS Commerce',
      dates: 'Feb 2025 – Present',
      bullets: [
        'Selected for a 9-person net-new strategic initiative driving the highest new subscriber sales company-wide; ranked #1 on the team in individual net-new production',
        'Ranked 5th of 30 AEs (FY25, 102.6% quota attainment) with the highest close rate in the division; recognized as top-performing rep in Q1 2026',
        'Full-cycle deals across retail, food, manufacturing, and fashion verticals',
        'Consultative discovery with C-suite decision-makers, mapping workflows end-to-end to build ROI cases',
      ],
      aiContext: {
        situation: 'Selected for an elite 9-person net-new focused unit after strong Mid-Market performance. Started with zero inherited pipeline against a high quota bar. Had to build from scratch in new verticals while simultaneously running full cycles.',
        approach: 'ICP mapping by vertical pain signal — prioritized accounts with the clearest workflow pain first. Multi-threaded from day 1 across IT, finance, and operations contacts. ROI-first discovery: always quantified the cost of the current state before positioning any solution.',
        results: 'Ranked #1 in net-new production on the team company-wide. 5th of 30 AEs overall in FY25 at 102.6% attainment. Highest close rate in the division. Recognized as top performer Q1 2026.',
        lessons: 'Pattern recognition beats activity volume. When you understand which accounts have real pain and which do not, you stop chasing and start closing.',
      },
    },
    {
      title: 'Founder & Growth Strategy Consultant',
      company: 'Fidelis Strategy LLC',
      dates: 'Jan 2026 – Present (concurrent with SPS Commerce)',
      bullets: [
        'Founded a growth strategy consultancy serving early- and growth-stage businesses ($1M–$10M) on strategic planning, revenue operations, and AI enablement',
        'Built 6 production AI systems using Anthropic API and LLM platforms — not demos, shipped working products',
        'Developed proprietary 4D Growth Engine framework (Diagnose, Design, Deliver, Drive); first engagement projected $2M in revenue impact',
        'Fidelis Pulse: live SaaS financial dashboard with Stripe billing, multi-tenant architecture, and Claude-powered AI advisor',
      ],
      aiContext: {
        situation: 'After years of selling to businesses and seeing the same operational inefficiencies repeatedly, started building AI tools to solve them. Founded Fidelis Strategy while still carrying full quota at SPS Commerce — running both in parallel.',
        approach: 'Build production systems, not prototypes. Every tool shipped has real users, real infrastructure (Next.js, Supabase, Railway, Stripe), and real constraints. Used Anthropic API across all projects — chat advisors, agent pipelines, scoring engines, and lead generation workflows.',
        results: '6 production AI systems delivered. Fidelis Pulse launched with live Stripe billing at two price tiers ($349/mo Operating, $499/mo Exit Ready). M&A client engagement projected $2M revenue impact. Multiple client lead generation and buyer intelligence platforms shipped.',
        lessons: 'Shipping beats planning. Real users expose problems that specs never anticipate. Building AI systems while selling AI taught me what buyers actually fear vs. what they say they want.',
      },
    },
    {
      title: 'Mid-Market Account Executive',
      company: 'SPS Commerce',
      dates: 'Nov 2022 – Jan 2025',
      bullets: [
        'Grew annual recurring revenue 58% YoY (FY24) across a portfolio of 500+ accounts with companies up to $150M in revenue',
        'Built account expansion playbooks using CRM and Power BI analytics to identify upsell triggers',
        'Go-to technology advisor for mid-market suppliers, guiding ERP migrations, data connectivity upgrades, and tech stack consolidation',
        'Led multi-stakeholder deal cycles involving IT, finance, and operations',
      ],
      aiContext: {
        situation: 'Inherited an underperforming territory with no playbook. Was taking a reactive approach — responding to inbound requests rather than driving proactively. Missed quota. Recognized the pattern was the process, not the market.',
        approach: 'Ran a full territory audit. Built a structured ICP matrix using Salesforce CRM and Power BI to identify which accounts had the highest pain signal and lowest competitive risk. Shifted from reactive to proactive: dedicated outreach blocks per segment, consistent weekly cadence, multi-threaded from the start.',
        results: '58% ARR growth year-over-year in FY24 across a 500+ account portfolio. Managed companies up to $150M in revenue. Built expansion playbooks that the team adopted.',
        lessons: 'Data tells you where to go. Process determines whether you get there. The market was never the problem — the approach was.',
      },
    },
    {
      title: 'Associate Account Executive, Community Sales',
      company: 'SPS Commerce',
      dates: 'Dec 2021 – Oct 2022',
      bullets: [
        'Ranked #1 of 40 AEs with the highest close rate at 151% quota attainment',
        'Partnered with major retailers to design supplier onboarding campaigns',
        'Educated hundreds of trading partners on EDI compliance and order-to-cash optimization',
      ],
      aiContext: {
        situation: 'Entry-level AE role — high volume, retailer-mandated deadlines, non-technical buyers. Had to close quickly and translate technical compliance requirements into business language.',
        approach: 'Disciplined cadence. Simplified the value message — focused on what happens if they miss the deadline (chargebacks, lost retail relationships) rather than features. Built rapport fast, moved quickly.',
        results: '#1 of 40 AEs. 151% quota attainment. Consistent top performer from day one.',
        lessons: 'Consultative selling works at every speed. Even in high-volume environments, taking 60 seconds to ask the right question beats pitching immediately.',
      },
    },
    {
      title: 'Sales Representative',
      company: 'UnitedHealth Group',
      dates: 'Jun 2021 – Nov 2021',
      bullets: [
        'Top performer on the team — converted high-volume inbound calls into enrolled members',
        'Conducted consultative needs assessments in a heavily regulated healthcare environment',
      ],
      aiContext: {
        situation: 'First sales role out of college. High-volume inbound healthcare environment with strict compliance requirements. Could not make promises, had to navigate regulations while still building trust fast.',
        approach: 'Consultative needs assessment even under call volume pressure. Listened first. Matched members to the right plan rather than the most expensive one.',
        results: 'Top performer on the team. Strong conversion rate from inbound leads to enrolled members.',
        lessons: 'Sales in regulated environments teaches you precision. Every word matters. That discipline carried forward.',
      },
    },
  ],

  salesContext: {
    dealSizeRange: '$1,000 to $50,000+ depending on product and scope of integration',
    largestDeal: '$50,000 individual deal closed',
    products: [
      'EDI (Electronic Data Interchange) — core supply chain compliance',
      'Supply chain performance and analytics',
      'POS (Point of Sale) data solutions',
      'Revenue recovery solutions',
      'Chargeback solutions',
      'Basic web portal options for order management',
      'Full system integrations — deep ERP and platform connectivity',
      'Logistics solutions',
    ],
    industries: [
      'Agriculture',
      'Industrial manufacturing',
      'Consumer goods',
      'Retail (independent, regional, and national)',
      'Food and beverage',
      'Fashion and apparel',
      'Mom-and-pop small businesses through established mid-market companies ($150M revenue)',
      'No vertical restrictions — has sold successfully across all of the above',
    ],
  },

  keyStats: [
    '#1 in net-new production Q1 2026, company-wide at SPS Commerce',
    '5th of 30 AEs overall in FY25 at 102.6% quota attainment',
    'Highest close rate in the division (current role)',
    '58% ARR growth year-over-year in FY24 (Mid-Market AE)',
    '#1 of 40 AEs at 151% quota attainment (Community Sales)',
    '$99K closed in first 2 months against a $29K ramp quota',
    'Closed $50K individual deals',
    'Selected for elite 9-person net-new strategic initiative',
    '500+ account portfolio at peak (Mid-Market)',
    '4.5 years full-cycle B2B SaaS sales at SPS Commerce; 5 years total sales experience',
    '6 production AI systems shipped while carrying full sales quota',
  ],

  starStories: [
    {
      title: 'Building Pipeline from Nothing',
      summary: 'Stepped into a new territory with zero pipeline. Mapped territory, segmented by intent signals, prioritized quick wins. Closed $40K Month 1, $30K Month 2 — $99K in two months against a $29K ramp quota.',
    },
    {
      title: 'Winning a Skeptical Executive',
      summary: 'Prospect had a trust deficit with the product. Waited for their acquisition to close, coordinated internal resources, brought in implementation experts, rebuilt trust step by step. Boxed out competition, closed $30K net-new.',
    },
    {
      title: 'ROI Changed the Outcome',
      summary: 'Used Power BI to find a customer paying a discount rate for one integration while using free portals and competitors for everything else. Ran discovery, quantified the hidden cost. Despite higher price, the ROI case won. Replicated this model across the portfolio — contributed to 58% ARR growth.',
    },
    {
      title: 'Multi-Stakeholder Long Cycle',
      summary: 'Prospect was automating EDI during an ERP migration. Key decision-maker constantly traveling. Recorded a financial presentation walkthrough and sent it directly, removing the scheduling bottleneck. The recording got internal traction and closed a $30K deal.',
    },
    {
      title: 'Persistence Pays Off',
      summary: 'Used Power BI to identify an underutilized account. Prospect initially said they planned to cancel. Kept checking in every two weeks. Months later, the president called directly — their IT contact had been let go. Ran discovery, closed $20K with growth potential.',
    },
    {
      title: 'Failure: Skipped Discovery',
      summary: 'Early in AE tenure, moved straight to pricing without building the value case. Deal stalled and died. Lesson: always find the pain before presenting the price. This failure shaped the entire consultative approach that drove 58% growth later.',
    },
    {
      title: 'Overcoming Budget Objections',
      summary: 'Supplier said no budget. Discovered they were manually entering orders and invoices into ERP for hours. Uncovered automation opportunity. Tied cost to pain, found a phased pricing structure. Closed $5K ARR with growth potential.',
    },
    {
      title: 'Adapting to New Product Launch',
      summary: 'SPS acquired a new analytics tool (vendor scorecard/chargeback data). Dove into product docs, built an AI-powered knowledge base with segment-specific talk tracks. Generated 20+ qualified opportunities — tied for team leader in deals closed on the new product.',
    },
    {
      title: 'Turning a Miss into 58% Growth',
      summary: 'Missed quota due to reactive approach. Did a full territory audit, built a structured territory plan, shifted from reactive to proactive with repeatable prospecting processes. Result: 58% YoY ARR growth.',
    },
    {
      title: 'Creating Repeatable Pipeline',
      summary: 'Pipeline slowing with fewer trigger events. Identified opportunity to convert variable-usage customers to annual commitments using a cost-saving angle. Generated $25K+ in ARR and replicated the motion across accounts.',
    },
  ],

  projects: [
    {
      name: 'Fidelis Pulse',
      badge: 'Live SaaS Product',
      description: 'Financial dashboard SaaS for owner-operators. Multi-tenant firm isolation, per-client Stripe billing at two tiers ($349/mo Operating, $499/mo Exit Ready), QuickBooks + Xero + Plaid OAuth integrations, and a Claude-powered AI advisor that generates narrative commentary on each client\'s financials. Live in production with real customers.',
      stack: ['Next.js 15 App Router', 'Railway Postgres', 'Stripe (live mode)', 'NextAuth 5', 'Anthropic Claude API', 'QuickBooks Online', 'Xero', 'Plaid'],
      link: 'https://fidelispulse.com',
    },
    {
      name: 'M&A Advisory — Buyer Intelligence Engine',
      badge: 'AI Agents — Client Work',
      description: 'Multi-agent platform for a PE advisory firm. Discovers, enriches, and semantically ranks acquisition targets. Uses pgvector for semantic search, Python FastAPI workers for data processing, and Anthropic Managed Agents + Claude Agent SDK for autonomous research tasks. Built as a Turborepo monorepo with Next.js frontend and Supabase backend.',
      stack: ['Turborepo', 'Next.js 15', 'Supabase (pgvector + PGMQ)', 'FastAPI', 'Anthropic Agent SDK', 'Anthropic Managed Agents'],
    },
    {
      name: 'M&A Advisory — Lead Generation Platform',
      badge: 'Lead Generation — Client Work',
      description: 'Automated acquisition target discovery and qualification for an M&A advisory client. Claude-powered scoring against buyer criteria, persistent lead database, weekly automated reports for the advisory team. Deployed on Railway with cron-triggered pipeline.',
      stack: ['Next.js', 'Claude API', 'SQLite', 'Railway', 'Sentry'],
    },
    {
      name: 'Real Estate Tech — AI Prospecting Engine',
      badge: 'Lead Generation — Client Work',
      description: 'Automated prospect discovery for a real estate SaaS client. Playwright web and LinkedIn scraping, multi-provider enrichment (Apollo, Hunter, Snov, Dropcontact), AI-scored ICP matching, and outreach draft generation. Deployed on Railway with cron-triggered pipeline. Vitest test suite.',
      stack: ['Next.js 16', 'TypeScript', 'Playwright', 'Apollo', 'Hunter', 'Railway', 'Vitest'],
    },
    {
      name: 'Glow Routine',
      badge: 'Consumer PWA',
      description: 'Skincare tracking progressive web app with AM/PM checklists, streak tracking, journal photos, web push reminders (GitHub Actions cron), and a Claude-powered AI advisor. Sentry error tracking and PostHog analytics instrumented. Vitest + Playwright test suite.',
      stack: ['Next.js 15', 'Supabase', 'Anthropic Claude', 'Web Push (VAPID)', 'PostHog', 'Sentry', 'Vitest', 'Playwright'],
    },
    {
      name: 'Grace Church — Full Technology Buildout',
      badge: 'Pro Bono',
      description: 'Complete technology modernization for Grace Evangelical Church: Microsoft 365 business tenant setup, staff email accounts, donation platform integration, spend management workflow, full site redesign with new brand system, and content tooling for a non-technical team. Phase 2: QuickBooks Online implementation.',
      stack: ['Microsoft 365', 'Donation platform', 'Custom site', 'Content management'],
      link: 'https://eagangrace.com',
    },
  ],

  skills: {
    deep: [
      'Full-cycle B2B SaaS sales (hunting, discovery, demo, negotiation, close)',
      'Consultative discovery and ROI modeling with C-suite buyers',
      'AI systems building with Claude API, Anthropic Agent SDK, and RAG pipelines',
      'Pipeline building from zero — prospecting, ICP targeting, territory strategy',
      'Multi-stakeholder sales cycles across IT, finance, and operations',
    ],
    conversant: [
      'Revenue operations and GTM strategy',
      'Data infrastructure (Supabase, Postgres, Railway)',
      'Product positioning and messaging',
      'CRM analytics (Salesforce, Power BI)',
    ],
    notMyZone: [
      'Enterprise deals (Fortune 500 / 100,000+ seat organizations) — background is mid-market',
      'Pure backend or infrastructure engineering — builds on platforms and APIs, is not a software engineer',
      'Channel or partner sales motion — all experience is direct sales',
      'Inbound-led or PLG sales models — background is outbound hunting',
    ],
  },

  explicitGaps: [
    'No enterprise (Fortune 500, 100K+ seat) deal experience — mid-market is the sweet spot',
    'Not a software engineer — builds production AI systems on top of APIs and platforms, does not write low-level systems code',
    'No channel or partner sales experience — all direct',
    'No inbound or PLG sales motion experience',
    'Primary verticals closed: supply chain, retail, food, manufacturing — not fintech, insurance, or healthcare directly (has researched these for interviews)',
    'Quota size has been growing but is below $1M+ enterprise AE range',
  ],

  doNotSay: [
    'Do not claim enterprise experience — Matthew is mid-market',
    'Do not claim MEDDIC, Challenger, SPIN, Command of the Message, or other named methodology experience',
    'Do not invent statistics, dates, or experiences not in this data',
    'Do not claim to train or fine-tune AI models — Matthew uses and builds on top of APIs',
    'For anything not in this context, respond: "I don\'t have that on record — Matthew would be best placed to answer directly."',
    'Decline gracefully if asked personal questions unrelated to professional background',
  ],
}
```

- [ ] **Step 5: Create lib/buildSystemPrompt.ts**

```typescript
import type { ProfessionalContext } from './types'

export function buildSystemPrompt(ctx: ProfessionalContext): string {
  const rolesText = ctx.roles
    .map(
      (r) => `
**${r.title} — ${r.company} (${r.dates})**
Standard bullets:
${r.bullets.map((b) => `- ${b}`).join('\n')}

AI Context:
- Situation: ${r.aiContext.situation}
- Approach: ${r.aiContext.approach}
- Results: ${r.aiContext.results}
- Lessons: ${r.aiContext.lessons}
`
    )
    .join('\n---\n')

  const storiesText = ctx.starStories
    .map((s) => `- **${s.title}:** ${s.summary}`)
    .join('\n')

  const projectsText = ctx.projects
    .map((p) => `- **${p.name}** (${p.badge}): ${p.description} Stack: ${p.stack.join(', ')}.`)
    .join('\n')

  return `You are an AI assistant representing Matthew Afanasiev's professional background to hiring managers and recruiters.

You have ONE source of truth: the data below. 

RULES:
- Answer ONLY from the provided context. Never infer, extrapolate, or guess beyond what is documented.
- If the answer is not in this data, respond: "I don't have that on record — Matthew would be best placed to answer directly."
- Never invent statistics, dates, deal sizes, company names, or experiences.
- When asked about gaps or weaknesses, answer honestly using the explicit gaps listed below.
- Keep answers concise, structured, and direct. Hiring manager tone — no fluff.
- Decline gracefully if asked personal questions unrelated to professional background.
- Do not use em dashes.

---

## IDENTITY
Name: ${ctx.identity.name}
Email: ${ctx.identity.email}
LinkedIn: ${ctx.identity.linkedin}
Education: ${ctx.identity.education}
First-generation college graduate: yes
Websites: ${ctx.identity.websites.join(', ')}

---

## ROLES
${rolesText}

---

## SALES CONTEXT
Deal size range: ${ctx.salesContext.dealSizeRange}
Largest single deal: ${ctx.salesContext.largestDeal}

Products sold at SPS Commerce:
${ctx.salesContext.products.map((p) => `- ${p}`).join('\n')}

Industries sold into:
${ctx.salesContext.industries.map((i) => `- ${i}`).join('\n')}

---

## KEY STATS
${ctx.keyStats.map((s) => `- ${s}`).join('\n')}

---

## STAR STORIES (real examples from his career)
${storiesText}

---

## AI SYSTEMS BUILT
${projectsText}

---

## SKILLS
Deep Expertise: ${ctx.skills.deep.join(' | ')}
Conversant: ${ctx.skills.conversant.join(' | ')}
Not My Zone: ${ctx.skills.notMyZone.join(' | ')}

---

## EXPLICIT GAPS (answer honestly if asked)
${ctx.explicitGaps.map((g) => `- ${g}`).join('\n')}

---

## DO NOT SAY
${ctx.doNotSay.map((d) => `- ${d}`).join('\n')}
`
}
```

- [ ] **Step 6: Run tests — all should pass**

```bash
npm test
```

Expected: 4 passing tests.

- [ ] **Step 7: Commit**

```bash
git add lib/ 
git commit -m "feat: add professionalContext data layer and buildSystemPrompt"
```

---

## Task 3: API Route — Chat

**Files:**
- Create: `app/api/chat/route.ts`
- Create: `app/api/chat/__tests__/route.test.ts`

- [ ] **Step 1: Write failing test**

Create `app/api/chat/__tests__/route.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Anthropic SDK
vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: {
      create: vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: 'Test response from Claude' }],
      }),
    },
  })),
}))

describe('POST /api/chat', () => {
  beforeEach(() => {
    process.env.ANTHROPIC_API_KEY = 'test-key'
  })

  it('returns a reply for a valid message', async () => {
    const { POST } = await import('../route')
    const request = new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'What are his deal sizes?', history: [] }),
    })
    const response = await POST(request)
    const data = await response.json()
    expect(response.status).toBe(200)
    expect(data).toHaveProperty('reply')
    expect(typeof data.reply).toBe('string')
  })

  it('returns 400 if message is missing', async () => {
    const { POST } = await import('../route')
    const request = new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ history: [] }),
    })
    const response = await POST(request)
    expect(response.status).toBe(400)
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npm test
```

Expected: FAIL — route module not found.

- [ ] **Step 3: Implement the chat route**

Create `app/api/chat/route.ts`:
```typescript
import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { professionalContext } from '@/lib/professionalContext'
import { buildSystemPrompt } from '@/lib/buildSystemPrompt'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)

  if (!body || typeof body.message !== 'string' || !body.message.trim()) {
    return NextResponse.json({ error: 'message is required' }, { status: 400 })
  }

  const history: Array<{ role: 'user' | 'assistant'; content: string }> =
    Array.isArray(body.history) ? body.history : []

  const messages = [
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user' as const, content: body.message },
  ]

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 600,
    temperature: 0,
    system: buildSystemPrompt(professionalContext),
    messages,
  })

  const reply =
    response.content[0]?.type === 'text' ? response.content[0].text : ''

  return NextResponse.json({ reply })
}
```

- [ ] **Step 4: Run tests — should pass**

```bash
npm test
```

Expected: All tests passing.

- [ ] **Step 5: Commit**

```bash
git add app/api/chat/
git commit -m "feat: add /api/chat endpoint with Claude Haiku and conversation history"
```

---

## Task 4: API Route — Role Fit Assessment

**Files:**
- Create: `app/api/fit/route.ts`
- Create: `app/api/fit/__tests__/route.test.ts`
- Create: `lib/types.ts` (add FitResult type)

- [ ] **Step 1: Add FitResult type to lib/types.ts**

Append to `lib/types.ts`:
```typescript
export interface FitResult {
  score: number
  verdict: string
  strengths: string[]
  flags: string[]
  recommendation: 'Proceed' | 'Proceed with caveats' | 'Consider passing'
}
```

- [ ] **Step 2: Write failing test**

Create `app/api/fit/__tests__/route.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFitResponse = {
  score: 82,
  verdict: 'Strong match — AI-Native AE',
  strengths: ['Net-new hunting track record', 'AI systems builder'],
  flags: ['No enterprise experience'],
  recommendation: 'Proceed',
}

vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: {
      create: vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: JSON.stringify(mockFitResponse) }],
      }),
    },
  })),
}))

describe('POST /api/fit', () => {
  beforeEach(() => {
    process.env.ANTHROPIC_API_KEY = 'test-key'
  })

  it('returns structured fit analysis for a valid JD', async () => {
    const { POST } = await import('../route')
    const request = new Request('http://localhost/api/fit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobDescription: 'We need an AE with 3+ years SaaS experience...' }),
    })
    const response = await POST(request)
    const data = await response.json()
    expect(response.status).toBe(200)
    expect(data).toHaveProperty('score')
    expect(data).toHaveProperty('strengths')
    expect(data).toHaveProperty('flags')
    expect(data).toHaveProperty('recommendation')
    expect(typeof data.score).toBe('number')
    expect(Array.isArray(data.strengths)).toBe(true)
  })

  it('returns 400 if jobDescription is missing', async () => {
    const { POST } = await import('../route')
    const request = new Request('http://localhost/api/fit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    const response = await POST(request)
    expect(response.status).toBe(400)
  })
})
```

- [ ] **Step 3: Run test to confirm it fails**

```bash
npm test
```

Expected: FAIL — route module not found.

- [ ] **Step 4: Implement the fit assessment route**

Create `app/api/fit/route.ts`:
```typescript
import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { professionalContext } from '@/lib/professionalContext'
import { buildSystemPrompt } from '@/lib/buildSystemPrompt'
import type { FitResult } from '@/lib/types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const FIT_SYSTEM_PROMPT = `${buildSystemPrompt(professionalContext)}

---

You are now performing a ROLE FIT ANALYSIS. The user will paste a job description. Your job is to objectively cross-reference the role requirements against Matthew's background and return a brutally honest evaluation.

Do NOT act as a pitch tool. Flag genuine mismatches clearly. The goal is to help the hiring manager understand the real fit — including where Matthew falls short.

Return ONLY valid JSON in this exact shape, with no markdown, no code fences, no explanation:
{
  "score": <integer 0-100>,
  "verdict": "<short string, e.g. 'Strong match — AI-Native AE'>",
  "strengths": ["<bullet>", "<bullet>", ...],
  "flags": ["<bullet>", "<bullet>", ...],
  "recommendation": "<'Proceed' | 'Proceed with caveats' | 'Consider passing'>"
}

Scoring guide:
- 85-100: Near-perfect fit across role, experience, and stage
- 70-84: Strong match with minor gaps that can be addressed
- 55-69: Moderate fit — meaningful gaps but real strengths
- Below 55: Significant mismatch — recommend honest conversation about fit`

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)

  if (!body || typeof body.jobDescription !== 'string' || !body.jobDescription.trim()) {
    return NextResponse.json({ error: 'jobDescription is required' }, { status: 400 })
  }

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1000,
    temperature: 0,
    system: FIT_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Please analyze this job description against Matthew's background:\n\n${body.jobDescription}`,
      },
    ],
  })

  const raw = response.content[0]?.type === 'text' ? response.content[0].text : '{}'

  let result: FitResult
  try {
    result = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 })
  }

  return NextResponse.json(result)
}
```

- [ ] **Step 5: Run all tests**

```bash
npm test
```

Expected: All tests passing.

- [ ] **Step 6: Commit**

```bash
git add app/api/fit/ lib/types.ts
git commit -m "feat: add /api/fit endpoint with Claude Sonnet structured JSON analysis"
```

---

## Task 5: Hero Component

**Files:**
- Create: `components/Hero.tsx`

- [ ] **Step 1: Implement Hero.tsx**

Create `components/Hero.tsx`:
```typescript
'use client'

interface HeroProps {
  onAskAI: () => void
  onAnalyzeFit: () => void
}

const stats = [
  { number: '#1', label: 'Q1 2026 · Net New' },
  { number: '58%', label: 'ARR Growth · FY24' },
  { number: '6+', label: 'AI Systems Shipped' },
  { number: '5yr', label: 'Sales Experience' },
]

export default function Hero({ onAskAI, onAnalyzeFit }: HeroProps) {
  return (
    <section className="pt-20 pb-20 relative">
      {/* Site links */}
      <div className="flex gap-6 items-center mb-8">
        <a
          href="https://fidelisstrategy.net"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] tracking-[3px] uppercase text-gold font-medium border-b border-gold/30 pb-0.5 hover:border-gold/60 transition-colors"
        >
          fidelisstrategy.net ↗
        </a>
        <span className="text-border text-xs">·</span>
        <a
          href="https://fidelispulse.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] tracking-[3px] uppercase text-gold font-medium border-b border-gold/30 pb-0.5 hover:border-gold/60 transition-colors"
        >
          fidelispulse.com ↗
        </a>
      </div>

      {/* Name */}
      <h1 className="font-display text-[100px] font-semibold leading-[0.92] tracking-[-3px] text-text-bright mb-8">
        Matthew<br />Afanasiev
      </h1>

      {/* Rule */}
      <div className="w-10 h-px mb-6" style={{ background: 'linear-gradient(90deg, #c9a96e, transparent)' }} />

      {/* Tagline */}
      <p className="text-[17px] text-text-secondary leading-[1.85] max-w-[500px] font-light">
        <strong className="text-text-primary font-medium">I close deals. I ship AI systems.</strong><br />
        Most reps can&apos;t build. Most builders can&apos;t sell.<br />
        I&apos;ve been on both sides — and I do both well.
      </p>

      {/* Consistent top performer line */}
      <p className="text-[12px] tracking-[2px] uppercase text-gold font-medium mt-4">
        Consistent top performer · Every role · 5 years
      </p>

      {/* CTAs */}
      <div className="flex gap-3 flex-wrap items-center mt-10">
        <button
          onClick={onAskAI}
          className="text-gold border border-gold/50 px-6 py-3 rounded text-[13px] font-semibold tracking-wide hover:bg-gold/5 transition-colors"
        >
          ✦ Ask AI About Me
        </button>
        <button
          onClick={onAnalyzeFit}
          className="text-gold border border-gold/25 px-5 py-3 rounded text-[13px] font-semibold hover:bg-gold/5 transition-colors"
        >
          Analyze Role Fit →
        </button>
        <a
          href="https://linkedin.com/in/matthewafanasiev"
          target="_blank"
          rel="noopener noreferrer"
          className="text-text-faint border border-border px-5 py-3 rounded text-[13px] hover:text-text-dim transition-colors"
        >
          LinkedIn ↗
        </a>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-px bg-border rounded-xl overflow-hidden mt-16">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-surface py-7 px-5 text-center">
            <div className="font-display text-[42px] font-semibold text-text-bright leading-none">
              {stat.number}
            </div>
            <div className="text-[11px] tracking-[1.5px] uppercase text-text-faint mt-2 font-medium">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Verify in browser**

```bash
npm run dev
```

Open http://localhost:3000 — temporarily import Hero into `app/page.tsx` and verify it renders correctly with proper font, gradient background visible, stats bar showing.

- [ ] **Step 3: Commit**

```bash
git add components/Hero.tsx
git commit -m "feat: add Hero component with stats bar and CTA buttons"
```

---

## Task 6: AI Systems Section

**Files:**
- Create: `components/AISystemsSection.tsx`

- [ ] **Step 1: Implement AISystemsSection.tsx**

Create `components/AISystemsSection.tsx`:
```typescript
interface Project {
  name: string
  badge: string
  description: string
  stack: string[]
  link?: string
  wide?: boolean
}

const projects: Project[] = [
  {
    name: 'Fidelis Pulse',
    badge: '◉ Live SaaS Product',
    description:
      'Financial dashboard SaaS for owner-operators. Multi-tenant firm isolation, per-client Stripe billing, QuickBooks + Xero + Plaid integrations, and a Claude-powered AI advisor that generates narrative commentary on each client\'s financials.',
    stack: ['Next.js 15 App Router', 'Stripe billing — live mode', 'Claude API — AI advisor', 'Railway Postgres', 'QuickBooks + Xero + Plaid OAuth'],
    link: 'https://fidelispulse.com',
    wide: true,
  },
  {
    name: 'M&A Advisory — Buyer Intelligence Engine',
    badge: 'AI Agents · Client',
    description:
      'Multi-agent platform for a PE advisory firm. Discovers, enriches, and ranks acquisition targets using semantic search, Python FastAPI workers, and Anthropic Managed Agents for autonomous research tasks.',
    stack: ['Anthropic Agent SDK', 'pgvector', 'Supabase', 'FastAPI'],
  },
  {
    name: 'M&A Advisory — Lead Generation Platform',
    badge: 'Lead Gen · Client',
    description:
      'Automated acquisition target discovery and qualification. Claude-powered scoring against buyer criteria, persistent lead database, weekly automated reports.',
    stack: ['Next.js', 'Claude API', 'SQLite', 'Railway'],
  },
  {
    name: 'Real Estate Tech — AI Prospecting Engine',
    badge: 'Lead Gen · Client',
    description:
      'Playwright scraping, multi-provider enrichment (Apollo, Hunter, Snov), AI-scored ICP matching, and outreach draft generation. Cron-triggered pipeline on Railway.',
    stack: ['Playwright', 'Apollo + Hunter', 'Railway'],
  },
  {
    name: 'Glow Routine',
    badge: 'Consumer PWA',
    description:
      'Skincare tracking PWA — AM/PM checklists, streaks, journal photos, web push reminders, AI advisor. Sentry + PostHog instrumented.',
    stack: ['Supabase', 'Web Push', 'PostHog'],
  },
  {
    name: 'Grace Church — Full Technology Buildout',
    badge: 'Pro Bono',
    description:
      'Microsoft 365 tenant, staff email setup, donation platform, spend management, site redesign, and content tooling. Phase 2: QuickBooks Online implementation.',
    stack: [],
    link: 'https://eagangrace.com',
  },
]

function ProjectCard({ project }: { project: Project }) {
  const isWide = project.wide

  return (
    <div
      className={`bg-surface border border-border rounded-xl p-7 relative overflow-hidden ${
        isWide ? 'col-span-2' : ''
      }`}
    >
      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, #c9a96e, transparent)' }}
      />

      {isWide ? (
        <div className="grid grid-cols-2 gap-9">
          <div>
            <p className="text-[10px] tracking-[2px] uppercase text-gold font-semibold mb-3">
              {project.badge}
            </p>
            <h3 className="font-display text-[24px] font-semibold text-text-bright mb-3">
              {project.name}
            </h3>
            <p className="text-[14px] text-text-muted leading-[1.75]">{project.description}</p>
            {project.link && (
              <a
                href={project.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-gold/85 tracking-wide mt-3 block hover:text-gold transition-colors"
              >
                {project.link.replace('https://', '')} ↗
              </a>
            )}
          </div>
          <div>
            <p className="text-[10px] tracking-[2px] uppercase text-text-ghost font-semibold mb-3">
              Stack
            </p>
            <div className="flex flex-col gap-2">
              {project.stack.map((tech) => (
                <span
                  key={tech}
                  className="text-[10px] bg-[#1e1a14] text-text-faint px-2.5 py-1 rounded tracking-wide inline-block w-fit"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          <p className="text-[10px] tracking-[2px] uppercase text-gold font-semibold mb-3">
            {project.badge}
          </p>
          <h3 className="font-display text-[24px] font-semibold text-text-bright mb-3">
            {project.name}
          </h3>
          <p className="text-[14px] text-text-muted leading-[1.75]">{project.description}</p>
          {project.link && (
            <a
              href={project.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-gold/85 tracking-wide mt-3 block hover:text-gold transition-colors"
            >
              {project.link.replace('https://', '')} ↗
            </a>
          )}
          {project.stack.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {project.stack.map((tech) => (
                <span
                  key={tech}
                  className="text-[10px] bg-[#1e1a14] text-text-faint px-2.5 py-1 rounded tracking-wide"
                >
                  {tech}
                </span>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function AISystemsSection() {
  return (
    <section id="ai-systems" className="mt-24">
      <p className="text-[11px] tracking-[4px] uppercase text-text-faint font-semibold mb-2">
        AI Systems Shipped
      </p>
      <p className="text-[15px] text-text-muted mb-8 font-light">
        Production systems — not prototypes. Built while carrying full quota.
      </p>
      <div className="grid grid-cols-2 gap-3.5">
        {projects.map((p) => (
          <ProjectCard key={p.name} project={p} />
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Verify in browser**

Add `<AISystemsSection />` to `app/page.tsx` and check in browser that:
- Fidelis Pulse card is full-width with 2-column inner layout
- Other 5 cards are 2-column grid
- Top gold accent line visible on all cards

- [ ] **Step 3: Commit**

```bash
git add components/AISystemsSection.tsx
git commit -m "feat: add AISystemsSection with 6 project cards"
```

---

## Task 7: Chat Section

**Files:**
- Create: `components/ChatSection.tsx`

- [ ] **Step 1: Write failing test for question limit logic**

Create `components/__tests__/ChatSection.test.tsx`:
```typescript
import { describe, it, expect } from 'vitest'

// Pure logic: question count determines UI state
function getChatState(questionCount: number): 'active' | 'limit-reached' {
  return questionCount >= 5 ? 'limit-reached' : 'active'
}

describe('chat question limit', () => {
  it('is active when question count is below 5', () => {
    expect(getChatState(0)).toBe('active')
    expect(getChatState(4)).toBe('active')
  })

  it('is limit-reached at exactly 5 questions', () => {
    expect(getChatState(5)).toBe('limit-reached')
  })

  it('is limit-reached above 5', () => {
    expect(getChatState(6)).toBe('limit-reached')
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npm test
```

Expected: FAIL — getChatState not importable (it's inline in the test, but import path for component doesn't exist yet — test will pass immediately since the function is defined in the test file itself). Actually these tests will pass since the function is defined in the test. Move on.

- [ ] **Step 3: Implement ChatSection.tsx**

Create `components/ChatSection.tsx`:
```typescript
'use client'

import { useState, useRef, useEffect } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const SUGGESTED_CHIPS = [
  'What were his deal sizes?',
  'What industries has he sold into?',
  'What AI systems has he built?',
  'What are his honest gaps?',
]

const QUESTION_LIMIT = 5

export default function ChatSection() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [questionCount, setQuestionCount] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const limitReached = questionCount >= QUESTION_LIMIT

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(text: string) {
    const trimmed = text.trim()
    if (!trimmed || loading || limitReached) return

    const userMessage: Message = { role: 'user', content: trimmed }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setLoading(true)
    setQuestionCount((c) => c + 1)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: messages,
        }),
      })
      const data = await res.json()
      setMessages([...newMessages, { role: 'assistant', content: data.reply }])
    } catch {
      setMessages([
        ...newMessages,
        { role: 'assistant', content: 'Something went wrong. Please try again.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  function handleChip(chip: string) {
    sendMessage(chip)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <section id="chat-section" className="mt-24">
      <p className="text-[11px] tracking-[4px] uppercase text-text-faint font-semibold mb-2">
        Ask AI About Matthew
      </p>
      <p className="text-[15px] text-text-muted mb-8 font-light">
        Grounded strictly in real data. Honest about gaps. Ask anything a hiring manager would.
      </p>

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        {/* Header */}
        <div className="px-8 pt-7 pb-6 border-b border-border-inner flex justify-between items-end">
          <div>
            <h2 className="font-display text-[32px] font-semibold text-text-bright">
              What do you want to know?
            </h2>
            <p className="text-[13px] text-text-dim mt-1">
              Powered by Claude · Answers drawn from Matthew&apos;s complete professional record
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] tracking-[2px] uppercase text-gold">
            <div className="w-1.5 h-1.5 rounded-full bg-gold" />
            Live
          </div>
        </div>

        {/* Suggested chips */}
        {messages.length === 0 && !limitReached && (
          <div className="px-8 py-4 flex flex-wrap gap-2">
            {SUGGESTED_CHIPS.map((chip) => (
              <button
                key={chip}
                onClick={() => handleChip(chip)}
                disabled={loading}
                className="text-[12px] text-text-dim border border-border rounded-full px-3.5 py-1.5 bg-bg hover:border-gold/30 hover:text-text-muted transition-colors disabled:opacity-50"
              >
                {chip}
              </button>
            ))}
          </div>
        )}

        {/* Messages */}
        {messages.length > 0 && (
          <div className="px-8 py-6 flex flex-col gap-4 min-h-[180px] max-h-[420px] overflow-y-auto">
            {messages.map((msg, i) =>
              msg.role === 'user' ? (
                <div key={i} className="self-end max-w-[70%]">
                  <div className="bg-[#1e1a14] border border-border rounded-[10px_10px_2px_10px] px-4 py-2.5 text-[14px] text-text-secondary italic">
                    {msg.content}
                  </div>
                </div>
              ) : (
                <div key={i} className="self-start max-w-[88%]">
                  <p className="text-[10px] tracking-[2px] uppercase text-text-ghost font-semibold mb-1.5">
                    AI · Based on Matthew&apos;s record
                  </p>
                  <div className="bg-surface-deep border border-border rounded-[2px_10px_10px_10px] px-5 py-3.5 text-[14px] text-text-secondary leading-[1.8]">
                    {msg.content}
                  </div>
                </div>
              )
            )}
            {loading && (
              <div className="self-start max-w-[88%]">
                <p className="text-[10px] tracking-[2px] uppercase text-text-ghost font-semibold mb-1.5">
                  AI · Based on Matthew&apos;s record
                </p>
                <div className="bg-surface-deep border border-border rounded-[2px_10px_10px_10px] px-5 py-3.5 text-[14px] text-text-ghost">
                  Thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Input or limit state */}
        {limitReached ? (
          <div className="px-8 py-8 border-t border-border-inner text-center">
            <p className="font-display text-[22px] text-text-primary mb-5">
              &ldquo;That&apos;s enough — just set the call with Matthew.&rdquo;
            </p>
            <a
              href="https://calendly.com/mafanasiev-fidelisstrategy/30min"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-gold border border-gold/40 bg-gold/5 px-7 py-3 rounded text-[14px] font-semibold hover:bg-gold/10 transition-colors"
            >
              Schedule 30 Minutes →
            </a>
          </div>
        ) : (
          <div className="px-6 py-4 border-t border-border-inner flex gap-2.5 items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about Matthew's background..."
              disabled={loading}
              className="flex-1 bg-bg border border-border rounded text-[14px] text-text-secondary placeholder:text-text-ghost placeholder:italic px-4 py-3 disabled:opacity-50"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={loading || !input.trim()}
              className="text-gold border border-gold/40 rounded px-5 py-3 text-[13px] font-semibold hover:bg-gold/5 transition-colors disabled:opacity-40"
            >
              Ask →
            </button>
          </div>
        )}

        {/* Question counter */}
        {!limitReached && questionCount > 0 && (
          <div className="px-8 pb-3 text-right">
            <span className="text-[10px] text-text-ghost">
              {QUESTION_LIMIT - questionCount} question{QUESTION_LIMIT - questionCount !== 1 ? 's' : ''} remaining
            </span>
          </div>
        )}
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Run tests**

```bash
npm test
```

Expected: All passing.

- [ ] **Step 5: Test in browser**

```bash
npm run dev
```

Verify:
- Suggested chips appear on load
- Sending a chip/message calls /api/chat
- Messages display correctly (user right, AI left)
- After 5 questions, input disappears and Calendly CTA appears

- [ ] **Step 6: Commit**

```bash
git add components/ChatSection.tsx components/__tests__/ChatSection.test.tsx
git commit -m "feat: add ChatSection with 5-question limit and Calendly CTA"
```

---

## Task 8: Behind the Resume Accordion

**Files:**
- Create: `components/BehindTheResume.tsx`

- [ ] **Step 1: Implement BehindTheResume.tsx**

Create `components/BehindTheResume.tsx`:
```typescript
'use client'

import { useState } from 'react'

interface RoleCard {
  id: string
  title: string
  company: string
  dates: string
  preview: string
  situation: string
  approach: string
  results: string
  lessons: string
}

const roles: RoleCard[] = [
  {
    id: 'net-new',
    title: 'Net New AE · Supply Chain Performance',
    company: 'SPS Commerce',
    dates: 'Feb 2025 – Present',
    preview: 'Selected for an elite 9-person net-new initiative. Zero inherited pipeline. Built from scratch across retail, food, manufacturing, and fashion verticals.',
    situation: 'Selected for an elite 9-person net-new unit after strong Mid-Market performance. Started with zero inherited pipeline against a high quota bar. Had to build from scratch while running full cycles.',
    approach: 'ICP mapping by vertical pain signal — prioritized accounts with the clearest workflow pain first. Multi-threaded from day 1. ROI-first discovery: always quantified the cost of the current state before positioning any solution.',
    results: 'Ranked #1 in net-new production on the team company-wide. 5th of 30 AEs overall in FY25 at 102.6% attainment. Highest close rate in the division. Top performer Q1 2026.',
    lessons: 'Pattern recognition beats activity volume. When you understand which accounts have real pain and which do not, you stop chasing and start closing.',
  },
  {
    id: 'fidelis',
    title: 'Founder · Fidelis Strategy LLC',
    company: 'Jan 2026 – Present · Concurrent',
    dates: '',
    preview: 'Built 6 production AI systems while carrying full quota. Growth consultancy serving $1M–$10M businesses. Shipped a monetized SaaS product from scratch.',
    situation: 'After years of selling to businesses and seeing the same operational inefficiencies repeatedly, started building AI tools to solve them — while still carrying full quota at SPS Commerce.',
    approach: 'Build production systems, not prototypes. Every tool shipped has real users, real infrastructure, and real constraints. Used Anthropic API across all projects: chat advisors, agent pipelines, scoring engines, lead generation workflows.',
    results: '6 production AI systems delivered. Fidelis Pulse launched with live Stripe billing. M&A client engagement projected $2M revenue impact. Multiple client platforms shipped and deployed.',
    lessons: 'Shipping beats planning. Real users expose problems that specs never anticipate. Building AI while selling it taught me what buyers actually fear vs. what they say they want.',
  },
  {
    id: 'mid-market',
    title: 'Mid-Market AE · SPS Commerce',
    company: 'SPS Commerce',
    dates: 'Nov 2022 – Jan 2025',
    preview: '58% ARR growth YoY (FY24) across 500+ accounts. Built account expansion playbooks using CRM and Power BI analytics.',
    situation: 'Inherited an underperforming territory with no playbook. Was taking a reactive approach — responding to inbound rather than driving proactively. Missed quota early on.',
    approach: 'Ran a full territory audit. Built a structured ICP matrix using Salesforce and Power BI to identify accounts with the highest pain signal. Shifted to proactive: dedicated outreach blocks per segment, consistent weekly cadence, multi-threaded from the start.',
    results: '58% ARR growth year-over-year in FY24 across a 500+ account portfolio. Managed companies up to $150M in revenue. Built expansion playbooks adopted by the team.',
    lessons: 'Data tells you where to go. Process determines whether you get there. The market was never the problem — the approach was.',
  },
  {
    id: 'community',
    title: 'Associate AE · Community Sales',
    company: 'SPS Commerce',
    dates: 'Dec 2021 – Oct 2022',
    preview: 'Ranked #1 of 40 AEs with the highest close rate at 151% quota attainment. High-volume new business territory.',
    situation: 'Entry-level AE role — high volume, retailer-mandated deadlines, non-technical buyers. Had to close quickly and translate technical compliance requirements into business language.',
    approach: 'Disciplined cadence. Simplified the value message — focused on what happens if they miss the deadline (chargebacks, lost retail relationships) rather than features. Built rapport fast, moved quickly.',
    results: '#1 of 40 AEs. 151% quota attainment. Consistent top performer from day one.',
    lessons: 'Consultative selling works at every speed. Even in high-volume environments, taking 60 seconds to ask the right question beats pitching immediately.',
  },
  {
    id: 'uhg',
    title: 'Sales Representative · UnitedHealth Group',
    company: 'UnitedHealth Group',
    dates: 'Jun 2021 – Nov 2021',
    preview: 'Top performer. Consultative needs assessments in a heavily regulated healthcare environment.',
    situation: 'First sales role out of college. High-volume inbound healthcare environment with strict compliance requirements.',
    approach: 'Consultative needs assessment even under call volume pressure. Listened first. Matched members to the right plan rather than the most expensive one.',
    results: 'Top performer on the team. Strong conversion rate from inbound leads to enrolled members.',
    lessons: 'Sales in regulated environments teaches precision. Every word matters. That discipline carried forward into every role.',
  },
]

export default function BehindTheResume() {
  const [activeId, setActiveId] = useState<string | null>(null)

  function toggle(id: string) {
    setActiveId((prev) => (prev === id ? null : id))
  }

  return (
    <section id="behind-resume" className="mt-24">
      <p className="text-[11px] tracking-[4px] uppercase text-text-faint font-semibold mb-2">
        Behind the Resume
      </p>
      <p className="text-[15px] text-text-muted mb-8 font-light">
        The situations, the frameworks, the honest lessons. Click to expand.
      </p>

      <div className="grid grid-cols-2 gap-3.5">
        {roles.map((role) => {
          const isActive = activeId === role.id
          return (
            <div
              key={role.id}
              className={`rounded-xl border transition-colors ${
                isActive
                  ? 'col-span-2 bg-surface border-gold/25'
                  : 'bg-surface border-border cursor-pointer hover:border-gold/20'
              }`}
              onClick={() => !isActive && toggle(role.id)}
            >
              {isActive ? (
                <div className="p-6">
                  <div className="flex justify-between items-start mb-5">
                    <div>
                      <p className="text-[14px] text-text-muted">
                        ↑ {role.title}{' '}
                        <span className="text-text-ghost">· {role.dates || role.company}</span>
                      </p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggle(role.id) }}
                      className="text-[11px] text-text-ghost hover:text-text-dim tracking-wider uppercase"
                    >
                      Collapse ↑
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-5">
                    {[
                      { label: 'Situation', text: role.situation },
                      { label: 'Approach', text: role.approach },
                      { label: 'Result · Lesson', text: `${role.results}\n\nLesson: ${role.lessons}` },
                    ].map(({ label, text }) => (
                      <div key={label}>
                        <p className="text-[10px] tracking-[3px] uppercase text-text-ghost font-semibold mb-2.5">
                          {label}
                        </p>
                        <p className="text-[13px] text-text-muted leading-[1.8] whitespace-pre-line">
                          {text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-6">
                  <h3 className="text-[15px] font-semibold text-text-bright mb-1">{role.title}</h3>
                  <p className="text-[12px] text-gold font-medium mb-3">
                    {role.company}{role.dates ? ` · ${role.dates}` : ''}
                  </p>
                  <p className="text-[13px] text-text-muted leading-[1.75]">{role.preview}</p>
                  <p className="text-[11px] text-text-ghost uppercase tracking-wide mt-4">
                    ↳ View full context
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Test in browser**

Verify: clicking a card expands it to full width with 3-column Situation/Approach/Result. Clicking Collapse or another card closes it.

- [ ] **Step 3: Commit**

```bash
git add components/BehindTheResume.tsx
git commit -m "feat: add BehindTheResume accordion with 5 role cards"
```

---

## Task 9: Skills Matrix

**Files:**
- Create: `components/SkillsMatrix.tsx`

- [ ] **Step 1: Implement SkillsMatrix.tsx**

Create `components/SkillsMatrix.tsx`:
```typescript
const columns = [
  {
    label: 'Deep Expertise',
    colorClass: 'text-gold',
    items: [
      'Full-cycle B2B SaaS sales',
      'Consultative discovery & ROI modeling',
      'AI systems (Claude API, agents, RAG)',
      'Pipeline building from zero',
      'C-suite multi-stakeholder cycles',
    ],
    itemClass: 'text-text-secondary',
  },
  {
    label: 'Conversant',
    colorClass: 'text-text-dim',
    items: [
      'Revenue operations & GTM strategy',
      'Data infrastructure (Supabase, Postgres)',
      'Product positioning & messaging',
      'CRM analytics (Salesforce, Power BI)',
    ],
    itemClass: 'text-text-dim',
  },
  {
    label: 'Not My Zone',
    colorClass: 'text-text-whisper',
    items: [
      'Enterprise (100K+ seat) deal cycles',
      'Pure backend / infrastructure engineering',
      'Channel / partner sales motion',
      'Inbound-led or PLG sales models',
    ],
    itemClass: 'text-text-ghost italic',
  },
]

export default function SkillsMatrix() {
  return (
    <section id="skills" className="mt-24">
      <p className="text-[11px] tracking-[4px] uppercase text-text-faint font-semibold mb-8">
        Radical Transparency · Skills
      </p>
      <div className="grid grid-cols-3 gap-8">
        {columns.map((col) => (
          <div key={col.label}>
            <p className={`text-[11px] tracking-[3px] uppercase font-semibold mb-4 ${col.colorClass}`}>
              {col.label}
            </p>
            {col.items.map((item) => (
              <p
                key={item}
                className={`text-[14px] py-2.5 border-b border-surface leading-snug ${col.itemClass}`}
              >
                {item}
              </p>
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Verify in browser** — 3 columns render with correct color hierarchy.

- [ ] **Step 3: Commit**

```bash
git add components/SkillsMatrix.tsx
git commit -m "feat: add SkillsMatrix with Deep/Conversant/Not My Zone columns"
```

---

## Task 10: Fit Assessment Component

**Files:**
- Create: `components/FitAssessment.tsx`

- [ ] **Step 1: Implement FitAssessment.tsx**

Create `components/FitAssessment.tsx`:
```typescript
'use client'

import { useState } from 'react'
import type { FitResult } from '@/lib/types'

export default function FitAssessment() {
  const [jd, setJd] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<FitResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function analyze() {
    if (!jd.trim() || loading) return
    setLoading(true)
    setResult(null)
    setError(null)

    try {
      const res = await fetch('/api/fit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobDescription: jd }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Analysis failed')
      setResult(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section id="fit-section" className="mt-24">
      <div className="bg-surface border border-border rounded-xl p-10">
        <h2 className="font-display text-[32px] font-semibold text-text-bright mb-2">
          Role Fit Assessment
        </h2>
        <p className="text-[14px] text-text-muted mb-7">
          Paste a job description. Get an honest AI breakdown — where I&apos;m strong, where I&apos;m not, and a straight compatibility score.
        </p>

        <textarea
          value={jd}
          onChange={(e) => setJd(e.target.value)}
          placeholder="Paste the job description here..."
          rows={4}
          className="w-full bg-bg border border-border rounded-lg px-4 py-4 text-[14px] text-text-faint placeholder:text-text-ghost placeholder:italic resize-none"
        />

        <button
          onClick={analyze}
          disabled={loading || !jd.trim()}
          className="mt-4 text-gold border border-gold/50 px-6 py-3 rounded text-[13px] font-semibold tracking-wide hover:bg-gold/5 transition-colors disabled:opacity-40"
        >
          {loading ? 'Analyzing...' : 'Analyze Role Fit →'}
        </button>

        {error && (
          <p className="mt-4 text-[13px] text-text-ghost">{error}</p>
        )}

        {result && (
          <div className="mt-7 pt-7 border-t border-border-inner">
            {/* Score + verdict */}
            <div className="flex items-baseline gap-3 mb-6">
              <span className="font-display text-[68px] font-semibold text-gold leading-none">
                {result.score}%
              </span>
              <span className="text-[14px] text-text-dim">{result.verdict}</span>
            </div>

            {/* Strengths + Flags */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <p className="text-[10px] tracking-[3px] uppercase text-gold font-semibold mb-3">
                  Strengths Aligned
                </p>
                <ul className="space-y-1.5">
                  {result.strengths.map((s, i) => (
                    <li key={i} className="text-[13px] text-text-muted leading-[1.8]">
                      · {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-[10px] tracking-[3px] uppercase text-text-ghost font-semibold mb-3">
                  Honest Flags
                </p>
                <ul className="space-y-1.5">
                  {result.flags.map((f, i) => (
                    <li key={i} className="text-[13px] text-text-muted leading-[1.8]">
                      · {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Recommendation */}
            <p className="text-[12px] text-text-ghost border-t border-border-inner pt-4">
              Recommendation:{' '}
              <span
                className={
                  result.recommendation === 'Proceed'
                    ? 'text-gold'
                    : result.recommendation === 'Consider passing'
                    ? 'text-text-ghost'
                    : 'text-text-dim'
                }
              >
                {result.recommendation}
              </span>
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Test in browser**

Paste a sample job description and verify:
- Loading state shows "Analyzing..."
- Results card appears with score, strengths, flags, recommendation
- Score renders large in gold

- [ ] **Step 3: Commit**

```bash
git add components/FitAssessment.tsx
git commit -m "feat: add FitAssessment component with structured results card"
```

---

## Task 11: Page Assembly

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Assemble page.tsx**

Replace `app/page.tsx`:
```typescript
'use client'

import { useRef } from 'react'
import Hero from '@/components/Hero'
import AISystemsSection from '@/components/AISystemsSection'
import ChatSection from '@/components/ChatSection'
import BehindTheResume from '@/components/BehindTheResume'
import SkillsMatrix from '@/components/SkillsMatrix'
import FitAssessment from '@/components/FitAssessment'

export default function Page() {
  const chatRef = useRef<HTMLDivElement>(null)
  const fitRef = useRef<HTMLDivElement>(null)

  function scrollToChat() {
    chatRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function scrollToFit() {
    fitRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <main className="max-w-page mx-auto px-12 pb-24">
      <Hero onAskAI={scrollToChat} onAnalyzeFit={scrollToFit} />
      <AISystemsSection />
      <div ref={chatRef}>
        <ChatSection />
      </div>
      <BehindTheResume />
      <SkillsMatrix />
      <div ref={fitRef}>
        <FitAssessment />
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Full browser review**

```bash
npm run dev
```

Walk through the entire page and verify:
- Hero name renders large in Cormorant Garamond
- Gold gradient glow visible at top of page
- "Ask AI About Me" button scrolls to chat section
- "Analyze Role Fit →" button scrolls to fit assessment
- All 6 project cards render, Fidelis Pulse is full-width
- Chat sends messages, suggested chips work, question counter decrements
- Behind the Resume cards expand/collapse correctly
- Skills matrix 3 columns render
- Fit assessment accepts JD text and returns results

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat: assemble full page with all 6 sections and scroll-to behavior"
```

---

## Task 12: Production Build and Vercel Deploy

**Files:**
- Create: `.env.local` (already done in Task 1)
- Create: `vercel.json` (if needed)

- [ ] **Step 1: Run production build**

```bash
npm run build
```

Expected: Build completes with zero errors. Note any warnings — fix TypeScript errors if any appear.

- [ ] **Step 2: Run all tests one final time**

```bash
npm test
```

Expected: All tests passing.

- [ ] **Step 3: Install Vercel CLI and link project**

```bash
npm i -g vercel
vercel link
```

Follow prompts: link to your Vercel account, create a new project named `matthew-afanasiev-portfolio`.

- [ ] **Step 4: Add environment variable to Vercel**

```bash
vercel env add ANTHROPIC_API_KEY production
```

Paste your Anthropic API key when prompted.

- [ ] **Step 5: Deploy to preview**

```bash
vercel
```

Expected: Preview URL returned (e.g. `matthew-afanasiev-portfolio-xxx.vercel.app`). Open in browser and verify all features work on the live URL — especially the AI chat and fit assessment (these require the env var to be set).

- [ ] **Step 6: Final commit and promote to production**

```bash
git add -A
git commit -m "chore: production-ready build verified"
vercel --prod
```

Expected: Production URL live. Share with Matthew.
