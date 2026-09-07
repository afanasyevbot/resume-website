import type { Archetype } from '@/lib/engine/tailorTypes'

export type ResumeVariant = 'sales' | 'gtm'

export function archetypeToVariant(archetype: Archetype): ResumeVariant {
  return archetype === 'classic-ats' ? 'sales' : 'gtm'
}

export const RESUME_CONTACT = {
  phone: '651.468.1408',
  email: 'mafanasiev@outlook.com',
  linkedin: 'linkedin.com/in/matthewafanasiev',
  site: 'mafanasiev.me',
  fidelis: 'fidelisstrategy.net',
  pulse: 'fidelispulse.com',
}

const SHARED_SUMMARY =
  'Five years in B2B SaaS selling complex solutions and helping businesses streamline their processes. Most recently, partnering directly with VPs and directors internally to find where AI can bring efficiency to the company\'s processes, helping drive AI go-to-market initiatives within the organization. Outside of that, founder of a growth strategy consultancy helping business owners leverage AI to grow their top line, independently designing and deploying production systems for clients, built with Claude Code and Cursor, powered by LLM APIs and agent SDKs: a live SaaS product, an AI-driven M&A buyer-matching engine, and automated prospecting tools.'

export interface ResumeRoleBlock {
  title: string
  company: string
  dates: string
  concurrent?: boolean
  bullets: string[]
}

export interface ResumeProjectBlock {
  name: string
  badge: string
  description: string
  stack: string
}

export interface ResumeVariantContent {
  variant: ResumeVariant
  subtitle: string
  headline: string
  tagline: string
  summary: string
  stats: { big: string; sub: string }[]
  roles: ResumeRoleBlock[]
  projects: ResumeProjectBlock[]
  skills: { category: string; items: string }[]
  /** GTM sidebar only */
  gtmExpertise?: string[]
  toolsStack?: string[]
  whatDrivesMe?: string
  signatureBuild?: ResumeProjectBlock
  additionalBuilds?: ResumeProjectBlock[]
}

const SALES_ROLES: ResumeRoleBlock[] = [
  {
    title: 'Net New Subscriber Account Executive, Supply Chain Performance',
    company: 'SPS Commerce',
    dates: 'Feb 2025 - Present',
    bullets: [
      'Helping lead AI go-to-market transformation within the division: running pilot groups and partnering directly with VPs and directors to streamline and improve internal processes.',
      'Selected for a 9-person net-new strategic initiative driving the division\'s highest new subscriber sales; ranked #1 on the team in individual net-new production.',
      'Ranked 5th of 30 AEs (FY25, 102.6% attainment) with the division\'s highest close rate; recognized as the top-performing rep in Q1 2026. Own the full sales cycle from discovery through close across retail, food, manufacturing, and fashion; hunt pipeline from zero, sell to operators and CTOs, and run consultative discovery and demos that map AI and integrations to a real workflow.',
    ],
  },
  {
    title: 'Founder & Growth Strategy Consultant',
    company: 'Fidelis Strategy LLC',
    dates: 'Jan 2026 - Present',
    concurrent: true,
    bullets: [
      'Founder and sole operator of an AI-enabled growth consultancy serving businesses with $1M to $10M in revenue; solo-designs, builds, and maintains production systems end to end while owning the full commercial motion: pitch, demo, and contract.',
      'Designs and deploys 7 production AI systems; first engagement projecting $2M in revenue impact. Owns go-to-market from the ground up: defines scope, sources and closes clients directly, no internal sales or marketing support. Advises clients on where AI can realistically move the needle before building anything.',
    ],
  },
  {
    title: 'Mid-Market Account Executive',
    company: 'SPS Commerce',
    dates: 'Nov 2022 - Jan 2025',
    bullets: [
      'Grew annual recurring revenue 58% YoY (FY24) across 500+ accounts, companies up to $150M in revenue; go-to technology advisor on ERP migrations and tech stack consolidation.',
    ],
  },
  {
    title: 'Associate Account Executive, Community Sales',
    company: 'SPS Commerce',
    dates: 'Dec 2021 - Oct 2022',
    bullets: [
      'Ranked #1 of 40 AEs at 151% quota attainment; partnered with major retailers on supplier onboarding campaigns, selling the solutions to trading partners and educating hundreds of trading partners on EDI compliance.',
    ],
  },
]

const GTM_ROLES: ResumeRoleBlock[] = [
  {
    title: 'Net New Subscriber Account Executive, Supply Chain Performance',
    company: 'SPS Commerce',
    dates: 'Feb 2025 - Present',
    bullets: [
      'Helping lead AI go-to-market transformation within the division: running pilot groups and partnering directly with VPs and directors to streamline and improve internal processes.',
      'Selected for a 9-person net-new strategic initiative driving the division\'s highest new subscriber sales; ranked #1 on the team in individual net-new production.',
      'Ranked 5th of 30 AEs (FY25, 102.6% attainment) with the division\'s highest close rate; leads C-suite discovery across retail, food, manufacturing, and fashion.',
    ],
  },
  {
    title: 'Founder & Growth Strategy Consultant',
    company: 'Fidelis Strategy LLC',
    dates: 'Jan 2026 - Present',
    concurrent: true,
    bullets: [
      'Founded an AI-enabled growth consultancy serving businesses with $1M to $10M in revenue; solo-designs, builds, and maintains production systems end to end while owning the full commercial motion: pitch, demo, and contract.',
      '7 systems built; first engagement projecting $2M in revenue impact.',
      'Owns go-to-market from the ground up for every engagement: defines scope, sources and closes clients directly, no internal sales or marketing support.',
      'Advises clients on where AI, and broader growth or process changes, can realistically move the needle, scoping fit and impact before building anything.',
    ],
  },
  {
    title: 'Mid-Market Account Executive',
    company: 'SPS Commerce',
    dates: 'Nov 2022 - Jan 2025',
    bullets: [
      'Grew annual recurring revenue 58% YoY (FY24) across 500+ accounts, companies up to $150M in revenue; go-to technology advisor on ERP migrations and tech stack consolidation.',
    ],
  },
  {
    title: 'Associate Account Executive, Community Sales',
    company: 'SPS Commerce',
    dates: 'Dec 2021 - Oct 2022',
    bullets: [
      'Ranked #1 of 40 AEs at 151% quota attainment; partnered with major retailers on supplier onboarding campaigns, selling the solutions to trading partners and educating hundreds of trading partners on EDI compliance.',
    ],
  },
]

const SIGNATURE_BUILD: ResumeProjectBlock = {
  name: 'M&A Buyer Intelligence Engine',
  badge: 'PARADISE CAPITAL',
  description:
    'Full-cycle solo engagement: identified the pain point, pitched the solution, then designed, built, and now maintain a production AI platform that finds, enriches, and ranks likely buyers for M&A deals. One person owning the pitch, the build, and the running system.',
  stack: 'FastAPI · Anthropic Agent SDK · Supabase',
}

const SALES_PROJECTS: ResumeProjectBlock[] = [
  {
    name: 'Fidelis Pulse',
    badge: 'LIVE SAAS',
    description:
      'Monetized, multi-tenant financial SaaS for business owners and M&A advisors. Stripe billing, accounting and banking integrations (QuickBooks, Xero, Plaid), and Claude-powered finance agents. Live in production with real customers.',
    stack: 'Next.js 15 · Postgres · Stripe · Claude API',
  },
  {
    name: 'M&A Buyer Intelligence Engine',
    badge: 'CLIENT',
    description:
      'Full-cycle solo engagement: identified the pain point, pitched the solution, then designed, built, and now maintain a production AI platform that finds, enriches, and ranks likely buyers for an M&A advisory firm. One person owning the pitch, the build, and the running system.',
    stack: 'pgvector · FastAPI · Anthropic Agent SDK · Supabase',
  },
  {
    name: 'AI Prospecting & Lead-Gen Platforms',
    badge: 'CLIENTS',
    description:
      'Finds and qualifies leads automatically, replacing hours of manual prospecting with a pipeline that keeps running on its own.',
    stack: 'Next.js · Playwright · Apollo · Railway',
  },
]

const GTM_ADDITIONAL_BUILDS: ResumeProjectBlock[] = [
  {
    name: 'Fidelis Pulse',
    badge: 'LIVE SAAS',
    description:
      'Monetized, multi-tenant financial SaaS for owner-operators and advisors. Stripe billing, QuickBooks / Xero / Plaid integrations, and a Claude-powered advisor.',
    stack: 'Next.js 15 · Postgres · Stripe · Claude API',
  },
  {
    name: 'AI Lead Generation Tool',
    badge: 'CLIENTS',
    description:
      'Finds and qualifies leads automatically, replacing hours of manual prospecting with a pipeline that keeps running on its own.',
    stack: 'Next.js · Playwright · Apollo · Railway',
  },
  {
    name: 'Grace Church Portal',
    badge: 'PRO BONO',
    description:
      'Custom member portal and back end on Azure SQL for a bilingual (EN/RU) congregation: volunteer scheduling, groups, and announcements.',
    stack: 'Next.js · Azure SQL · Microsoft 365',
  },
]

export const resumeVariants: Record<ResumeVariant, ResumeVariantContent> = {
  sales: {
    variant: 'sales',
    subtitle: 'Account Executive & AI Systems Builder',
    headline: 'I close deals. I build AI systems.',
    tagline: "Most reps can't build. Most builders can't sell. I've been on both sides, and I do both well.",
    summary: SHARED_SUMMARY,
    stats: [
      { big: '#1', sub: 'NET-NEW PRODUCTION · Q1 2026' },
      { big: '102.6%', sub: 'FY25 ATTAINMENT' },
      { big: '58%', sub: 'ARR GROWTH · FY24' },
      { big: '7', sub: 'PRODUCTION SYSTEMS' },
    ],
    roles: SALES_ROLES,
    projects: SALES_PROJECTS,
    skills: [
      {
        category: 'SALES',
        items:
          'Full-Cycle Mid-Market Hunter, Consultative Discovery, Technical Discovery, Product Demonstration, Pipeline Building from Zero, Self-Sourced Outbound, Multithreading, Value & ROI Selling, New Business Acquisition',
      },
      {
        category: 'AI & TECH',
        items:
          'Claude Code, Cursor, Claude API, Apollo, APIs, SDKs, Developer Workflows, Salesforce, Power BI, 5,500+ pull requests in six months',
      },
    ],
  },
  gtm: {
    variant: 'gtm',
    subtitle: 'AI Systems Builder & SaaS Account Executive',
    headline: 'I build AI systems. I drive go-to-market strategy.',
    tagline: "Most builders can't sell it. Most strategists can't build it. I do both.",
    summary: SHARED_SUMMARY,
    stats: [
      { big: '#1', sub: 'NET-NEW PRODUCTION · Q1 2026' },
      { big: '102.6%', sub: 'FY25 QUOTA ATTAINMENT' },
      { big: '58%', sub: 'ARR GROWTH FY24' },
      { big: '7', sub: 'PRODUCTION AI SYSTEMS DEPLOYED' },
    ],
    roles: GTM_ROLES,
    projects: [],
    signatureBuild: SIGNATURE_BUILD,
    additionalBuilds: GTM_ADDITIONAL_BUILDS,
    gtmExpertise: [
      'Full-Cycle Deal Ownership',
      'Consultative Discovery',
      'Multithreading',
      'Value & ROI Selling',
      'New Business & Expansion',
      'AI-Driven Deal Sourcing & Buyer Matching',
      'Pipeline Building from Zero',
      'Executive Alignment',
    ],
    toolsStack: [
      'Claude Code & Cursor',
      'Claude API & Agent SDKs',
      'Full-stack web & data infra',
      'Salesforce, Power BI',
    ],
    whatDrivesMe: 'Faith · Family · First Generation',
    skills: [],
  },
}

export function contactLine(): string {
  const c = RESUME_CONTACT
  return `${c.phone} · ${c.email} · ${c.linkedin} · ${c.fidelis} · ${c.site}`
}

function formatRoleBlock(role: ResumeRoleBlock): string {
  const header = `${role.title}, ${role.company} (${role.dates}${role.concurrent ? ', concurrent' : ''})`
  const bullets = role.bullets.map((b) => `  - ${b}`).join('\n')
  return `${header}\n${bullets}`
}

function formatProjectBlock(proj: ResumeProjectBlock): string {
  return `- **${proj.name}** (${proj.badge}): ${proj.description} Stack: ${proj.stack}.`
}

/** Curated resume copy for AI chat, matcher, and tailor — same source as PDF/DOCX. */
export function formatResumeVariantForPrompt(variant: ResumeVariant): string {
  const v = resumeVariants[variant]
  const label = variant === 'sales' ? 'Sales-led (Commercial AE)' : 'AI GTM (Builder-forward)'
  const lines = [
    `### ${label}`,
    `Subtitle: ${v.subtitle}`,
    `Headline: ${v.headline}`,
    `Tagline: ${v.tagline}`,
    `Summary: ${v.summary}`,
    `Stats: ${v.stats.map((s) => `${s.big} ${s.sub}`).join(' | ')}`,
    '',
    'Experience (curated resume bullets):',
    ...v.roles.map((r) => formatRoleBlock(r)),
  ]

  if (variant === 'gtm') {
    if (v.gtmExpertise?.length) {
      lines.push('', 'GTM expertise:', ...v.gtmExpertise.map((item) => `  - ${item}`))
    }
    if (v.toolsStack?.length) {
      lines.push('', 'Tools & stack:', ...v.toolsStack.map((item) => `  - ${item}`))
    }
    if (v.whatDrivesMe) lines.push('', `What drives him: ${v.whatDrivesMe}`)
    if (v.signatureBuild) {
      lines.push('', 'Signature build:', formatProjectBlock(v.signatureBuild))
    }
    if (v.additionalBuilds?.length) {
      lines.push('', 'Additional builds:', ...v.additionalBuilds.map((p) => formatProjectBlock(p)))
    }
  } else {
    lines.push('', 'AI systems built (resume highlights):', ...v.projects.map((p) => formatProjectBlock(p)))
    if (v.skills.length) {
      lines.push('', 'Core skills:')
      for (const skill of v.skills) lines.push(`  ${skill.category}: ${skill.items}`)
    }
  }

  return lines.join('\n')
}

export function formatAllResumeVariantsForPrompt(): string {
  return [
    'Matthew maintains two curated resume variants. Use the sales-led variant for commercial AE / hunter roles. Use the AI GTM variant for GTM, founding AE, or AI-native builder-forward roles.',
    '',
    formatResumeVariantForPrompt('sales'),
    '',
    formatResumeVariantForPrompt('gtm'),
  ].join('\n')
}
