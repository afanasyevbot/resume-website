# Matthew Afanasiev — AI Portfolio: Design Spec
**Date:** 2026-05-19  
**Status:** Approved — ready for implementation

---

## Overview

A single-page AI-powered professional portfolio and role fit assessment platform. Primary audience: hiring managers and recruiters at AI-native or AI-forward SaaS companies evaluating Matthew for AE, Strategic AE, GTM, or hybrid sales/builder roles.

**Core positioning:** "I close deals. I ship AI systems. Most reps can't build. Most builders can't sell. I've been on both sides — and I do both well."

**Live URL target:** Deployed to Vercel. Custom domain TBD.

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 15 App Router | Matthew's existing stack; API routes handle Claude calls server-side |
| Language | TypeScript strict | Type safety for professionalContext and API response shapes |
| Styling | Tailwind CSS | Utility-first, matches existing projects |
| AI | Anthropic SDK (Claude) | Chat: Haiku 4.5 (fast/cheap). Fit: Sonnet 4.6 (structured reasoning) |
| Deployment | Vercel | One-command deploy, env var management |
| Fonts | Cormorant Garamond + Inter | Via Google Fonts / next/font |

---

## Design System

### Colors
```
Background:       #111009  (warm near-black)
Surface:          #161210  (card backgrounds)
Border:           #2a2218  (subtle warm border)
Border-light:     #221e18  (inner dividers)

Gold (primary):   #c9a96e  (links, badges, CTAs, accents)
Gold-gradient:    rgba(201,169,110,0.22) (hero radial glow)

Text-bright:      #f5f0e8  (headings, hero name)
Text-primary:     #d4c4ae  (strong emphasis)
Text-secondary:   #a89278  (body copy, chat messages)
Text-muted:       #8a7a68  (descriptions, subtitles)
Text-dim:         #7a6b58  (conversant skills)
Text-faint:       #6b5e4e  (stat labels, section labels)
Text-ghost:       #4a3f32  (Not My Zone, placeholders)
Text-whisper:     #3a3028  (section label uppercase)
```

### Typography
- **Display:** Cormorant Garamond 600 — hero name (100px), section titles (32px), stat numbers (42px), fit score (68px), card names (24px)
- **Body:** Inter — everything else
- **Scale:** Body 14px, subtitles 15px, section labels 11px/4px tracking/uppercase, badges 10px/2px tracking

### Background
Three-layer radial gradient:
- Primary: `ellipse 90% 55% at 50% -5%` — gold glow at top
- Secondary: `ellipse 60% 40% at 90% 10%` — subtle right accent
- Tertiary: `ellipse 50% 60% at 10% 80%` — faint bottom-left warmth
Fixed position, full viewport height.

---

## Page Structure

Single-page scroll. No navigation. Max-width 960px, centered, 48px horizontal padding.

### Section Order
1. Hero
2. AI Systems Shipped
3. Ask AI About Me (static chat section)
4. Behind the Resume
5. Radical Transparency · Skills
6. Role Fit Assessment

---

## Section Specs

### 1. Hero

**Top links:**
- `fidelisstrategy.net ↗` and `fidelispulse.com ↗` — 11px uppercase gold, subtle underline

**Name:** "Matthew / Afanasiev" — Cormorant Garamond 600, 100px, line-height 0.92, letter-spacing -3px

**Tagline:**
```
I close deals. I ship AI systems.
Most reps can't build. Most builders can't sell.
I've been on both sides — and I do both well.
```
17px Inter 300, max-width 500px

**Subline:** "Consistent top performer · Every role · 5 years" — 12px gold uppercase, letter-spacing 2px

**CTAs (3 buttons):**
- "✦ Ask AI About Me" — gold outline button, scrolls to chat section
- "Analyze Role Fit →" — gold outline, lighter border, scrolls to fit assessment
- "LinkedIn ↗" — ghost button → `linkedin.com/in/matthewafanasiev`

**Stats bar (4 cells, grid, 1px gold-dark dividers):**
| Stat | Label |
|---|---|
| #1 | Q1 2026 · Net New |
| 58% | ARR Growth · FY24 |
| 6+ | AI Systems Shipped |
| 5yr | Sales Experience |

---

### 2. AI Systems Shipped

Section label: "AI Systems Shipped" | Sub: "Production systems — not prototypes. Built while carrying full quota."

**Layout:** 2-column grid. Fidelis Pulse spans full width (wide card).

**Projects:**

| Name | Badge | Key Detail | Link |
|---|---|---|---|
| Fidelis Pulse | ◉ Live SaaS Product | Multi-tenant, Stripe, QBO/Xero/Plaid, Claude advisor | fidelispulse.com ↗ |
| M&A Advisory — Buyer Intelligence Engine | AI Agents · Client | pgvector, FastAPI, Anthropic Managed Agents | — |
| M&A Advisory — Lead Generation Platform | Lead Gen · Client | Claude scoring, SQLite, Railway | — |
| Real Estate Tech — AI Prospecting Engine | Lead Gen · Client | Playwright, Apollo/Hunter, cron pipeline | — |
| Glow Routine | Consumer PWA | Supabase, Web Push, PostHog | — |
| Grace Church — Full Technology Buildout | Pro Bono | M365, donation platform, spend mgmt, Phase 2 QBO | eagangrace.com ↗ |

**Fidelis Pulse wide card:** 2-column inner layout — description + live link on left, stack tags on right.

**Each card:** gold 1px top accent line, badge (gold), Cormorant title (24px), description (14px #9a8a78), tech tags (10px dark chips), optional link.

---

### 3. Ask AI About Me

Section label: "Ask AI About Matthew" | Sub: "Grounded strictly in real data. Honest about gaps. Ask anything a hiring manager would."

**Chat panel structure (top to bottom):**
1. **Header** — "What do you want to know?" (32px Cormorant) + "Powered by Claude · Answers drawn from Matthew's complete professional record" + Live dot
2. **Suggested chips** — 4 clickable question starters:
   - "What were his deal sizes?"
   - "What industries has he sold into?"
   - "What AI systems has he built?"
   - "What are his honest gaps?"
3. **Message thread** — user bubble (right-aligned, italic), AI response bubble (left-aligned, labeled "AI · Based on Matthew's record")
4. **Input row** — text input + "Ask →" button
5. **Limit state** — shown after 5 questions, replaces input:
   - Text: *"That's enough — just set the call with Matthew."*
   - Button: "Schedule 30 Minutes →" → `https://calendly.com/mafanasiev-fidelisstrategy/30min`

**Conversation memory:** within-session only. Pass full `messages[]` array on each request. No persistence across sessions.

**Clicking a suggested chip** populates the input and submits automatically.

---

### 4. Behind the Resume

Section label: "Behind the Resume" | Sub: "The situations, the frameworks, the honest lessons. Click to expand."

**Layout:** 2-column card grid. Cards expand to full width when active (grid-column: 1/-1).

**Cards (collapsed):** Role title, company + date (gold), 2-line preview, "↳ View full context" trigger.

**Expanded state:** 3-column Situation / Approach / Result · Lesson grid. Gold border on expanded card.

**Roles to include:**
1. Net New AE · SPS Commerce (Feb 2025–Present)
2. Founder · Fidelis Strategy LLC (Jan 2026–Present)
3. Mid-Market AE · SPS Commerce (Nov 2022–Jan 2025) — shown expanded by default as example
4. Associate AE · SPS Commerce (Dec 2021–Oct 2022)
5. Sales Rep · UnitedHealth Group (Jun–Nov 2021)

---

### 5. Radical Transparency · Skills

3-column grid. No borders between items — just a faint bottom rule.

| Column | Color | Items |
|---|---|---|
| Deep Expertise | #c9a96e (gold) | Full-cycle B2B SaaS sales · Consultative discovery & ROI modeling · AI systems (Claude API, agents, RAG) · Pipeline building from zero · C-suite multi-stakeholder cycles |
| Conversant | #7a6b58 (muted) | Revenue operations & GTM strategy · Data infrastructure (Supabase, Postgres) · Product positioning & messaging · CRM analytics (Salesforce, Power BI) |
| Not My Zone | #4a3f32 (faint, italic) | Enterprise (100K+ seat) deal cycles · Pure backend / infrastructure engineering · Channel / partner sales motion · Inbound-led or PLG sales models |

---

### 6. Role Fit Assessment

Full-width widget card. Same surface/border treatment as chat section.

**Title:** "Role Fit Assessment" (32px Cormorant)  
**Sub:** "Paste a job description. Get an honest AI breakdown — where I'm strong, where I'm not, and a straight compatibility score."

**Input:** Large textarea placeholder "Paste the job description here..." + "Analyze Role Fit →" gold button

**Results card (shown after analysis):**
- Score: large Cormorant number in gold (e.g. "84%")
- Verdict line: "Strong match · [Role] · [Company stage]"
- 2-column grid:
  - **Strengths Aligned** (gold label) — bullet points
  - **Honest Flags** (faint label) — bullet points including recommendation if poor fit

---

## Data Layer: `professionalContext.ts`

Single TypeScript file. Injected as system prompt context for both AI endpoints. Contains:

### Identity
- Name, email, phone, LinkedIn, Calendly, websites
- Education: BBA Marketing Mgmt, University of St. Thomas, 2017–2021
- First-generation college graduate

### Roles
For each role: title, company, dates, standard bullets, plus `aiContext: { situation, approach, results, lessons }`

**Roles:** Net New AE (SPS, current) · Founder Fidelis Strategy · Mid-Market AE (SPS) · Associate AE (SPS) · Sales Rep (UnitedHealth)

### Sales Context
- Deal sizes: $1K–$50K+; has closed $50K individual deals
- Products: EDI, supply chain performance, POS data, revenue recovery, chargeback solutions, web portals, full system integrations, logistics solutions
- Industries: agriculture, industrial manufacturing, consumer goods, retail, food & beverage, mom-and-pop through mid-market ($150M revenue)
- No vertical restrictions

### Key Stats
- #1 Q1 2026 net-new production company-wide
- 5th of 30 AEs FY25, 102.6% quota attainment
- 58% ARR growth FY24
- #1 of 40 AEs, 151% attainment (Community Sales)
- $99K closed in 2 months against $29K ramp quota
- Closed $50K individual deals

### STAR Stories (10)
Pipeline from nothing · Winning skeptical exec · ROI changed outcome · Multi-stakeholder long cycle · Persistence pays · Failure (skipped discovery) · Budget objection · New product launch · Turning miss into 58% growth · Repeatable pipeline

### AI Projects (6)
Fidelis Pulse · Paradise Buyer Engine · Paradise Lead Gen · Agent Legend Lead Gen · Glow Routine · Grace Church

### Skills Matrix
Deep / Conversant / Not My Zone (as above)

### What NOT To Say
- No enterprise claims
- No MEDDIC/methodology claims
- Do not invent stats or experiences
- For anything not in context: "I don't have that on record — Matthew would be best placed to answer directly"

### Personal (tone only, not for resume)
- Faith-driven, family-first, first-generation
- Calendly: `calendly.com/mafanasiev-fidelisstrategy/30min`

---

## API Routes

### `POST /api/chat`
```typescript
// Request
{ message: string; history: { role: 'user' | 'assistant'; content: string }[] }

// Response
{ reply: string }

// Config
model: 'claude-haiku-4-5-20251001'
temperature: 0
max_tokens: 600
system: [full professionalContext injected as string]
```

**System prompt template:**
```
You are an AI assistant representing Matthew Afanasiev's professional background.
You have ONE source of truth: the context below.

RULES:
- Answer ONLY from the provided context. Never infer, extrapolate, or guess.
- If the answer is not in this data, say: "I don't have that on record — Matthew would be best placed to answer directly."
- Never invent stats, dates, deal sizes, company names, or experiences.
- Answer honestly about gaps using the explicit gaps listed below.
- Keep answers concise, structured, and direct. Hiring manager tone.
- Decline gracefully if asked anything personal or unrelated to professional background.

[PROFESSIONAL_CONTEXT]
```

### `POST /api/fit`
```typescript
// Request
{ jobDescription: string }

// Response
{
  score: number          // 0-100
  verdict: string        // e.g. "Strong match · AI-Native AE"
  strengths: string[]    // bullet points
  flags: string[]        // honest gaps/mismatches
  recommendation: string // "Proceed" | "Proceed with caveats" | "Consider passing"
}

// Config
model: 'claude-sonnet-4-6'
temperature: 0
max_tokens: 1000
```

**System prompt:** Cross-reference JD requirements against professionalContext. Return structured JSON. Be honest — do not pitch. Flag genuine mismatches. Score reflects realistic fit, not optimism.

---

## Environment Variables
```
ANTHROPIC_API_KEY   # Claude API key — Vercel env vars only, never client-side
```

---

## File Structure
```
/
├── app/
│   ├── page.tsx                    # Single page, all sections
│   ├── layout.tsx                  # Font loading, metadata
│   ├── globals.css                 # Tailwind + custom CSS vars
│   └── api/
│       ├── chat/route.ts           # POST /api/chat
│       └── fit/route.ts            # POST /api/fit
├── components/
│   ├── Hero.tsx
│   ├── AISystemsSection.tsx
│   ├── ChatSection.tsx             # Static chat with 5-question limit
│   ├── BehindTheResume.tsx         # Accordion cards
│   ├── SkillsMatrix.tsx
│   └── FitAssessment.tsx
├── lib/
│   └── professionalContext.ts      # All of Matthew's data — the source of truth
└── .env.local                      # ANTHROPIC_API_KEY (dev only)
```

---

## Interaction Details

**Chat question limit:** `useState<number>` counter. Increments on each submitted question. At 5, hide input row, show limit state with Calendly CTA.

**Suggested chips:** On click, set input value and submit. Counts toward the 5-question limit.

**Behind the Resume accordion:** `useState<string | null>` for active card ID. Clicking a card sets it active (expands) or collapses if already active. Only one card expanded at a time.

**Scroll-to on CTA click:** "Ask AI About Me" button scrolls to `#chat-section`. "Analyze Role Fit →" scrolls to `#fit-section`.

**Fit assessment loading state:** Spinner/pulse on the results card while awaiting API response. Disable button during request.

---

## Anti-Hallucination Measures
1. System prompt explicitly prohibits inference or extrapolation
2. Temperature 0 on all Claude calls
3. `professionalContext.ts` is comprehensive — every deal size, industry, STAR story, and explicit gap is documented
4. Fallback phrase hardcoded in system prompt for unknown questions
5. Full context passed on every call (no RAG retrieval risk)
