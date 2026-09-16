import type { Archetype } from '@/lib/engine/tailorTypes'

export type ResumeVariant = 'sales' | 'gtm'

export function archetypeToVariant(archetype: Archetype): ResumeVariant {
  return archetype === 'classic-ats' ? 'sales' : 'gtm'
}

export const RESUME_HEADLINE = 'Account Executive | AI Systems & GTM'

export const RESUME_PDF_PATHS: Record<ResumeVariant, string> = {
  sales: '/resume/Matthew_Afanasiev_AI_Sales_Resume.pdf',
  gtm: '/resume/Matthew_Afanasiev_AI_GTM_Strategy_Resume.pdf',
}

export const RESUME_CONTACT = {
  phone: '651.468.1408',
  email: 'mattafanasiev@outlook.com',
  linkedin: 'linkedin.com/in/matthewafanasiev',
  site: 'mafanasiev.me',
  fidelis: 'fidelisstrategy.net',
  pulse: 'fidelispulse.com',
}

export const PERSONAL_SIGNATURE = 'MY WHY: Faith · Family · First generation'

export interface ResumeRoleBlock {
  title: string
  company: string
  dates: string
  concurrent?: boolean
  bullets: string[]
}

export interface ResumeProjectBlock {
  name: string
  description: string
  stack?: string
}

export interface ResumeVariantContent {
  variant: ResumeVariant
  summary: string
  roles: ResumeRoleBlock[]
  projects: ResumeProjectBlock[]
  skills: { category: string; items: string }[]
}

const SHARED_BULLETS = {
  sales_result:
    "Finished Q1 2026 ranked #1 of 30 account executives; achieved 102.6% of FY25 quota with the division's highest close rate.",
  sales_scope:
    'Own full-cycle mid-market sales to operators and CTOs, leading technical discovery and demos around supply-chain integrations.',
  ai_partner:
    'Serve as a go-to frontline partner to directors and VPs, identifying rep bottlenecks and shaping AI workflow improvements with go-to-market engineers.',
  ai_pilot:
    'Helped lead the AI email-drafting pilot and presented the sales-team launch demo. Reported sales-floor results: users convert leads 10–20% faster and close deals approximately 1.5x faster than non-users.',
  mid_market:
    'Grew portfolio ARR 58% YoY in FY24 across 500+ accounts; advised companies up to $150M in revenue on ERP migrations.',
  associate:
    'Ranked #1 of 40 account executives at 151% quota attainment; designed supplier onboarding campaigns with major retailers.',
}

const FIDELIS_SALES_BULLETS = [
  'Partner with Paradise Capital on its Buyer Engine and custom AI workflows, translating M&A operating needs into software and ongoing improvements.',
  'Own client discovery, proposals, commercial agreement, solution design, deployment, and ongoing development.',
]

const FIDELIS_GTM_BULLETS = [
  "Translate Paradise Capital's M&A workflows into custom software and agentic solutions, including the Buyer Engine; guide scoping and ongoing development.",
  'Own client discovery, solution scoping, proposals, commercial agreement, deployment, and maintenance.',
]

const BUILT_PROJECTS: ResumeProjectBlock[] = [
  {
    name: 'Buyer Engine | Paradise Capital',
    description:
      'Built and maintain an M&A platform that finds, enriches, and ranks prospective acquirers. Client reports reducing buyer-list preparation from weeks to minutes.',
    stack: 'FastAPI · Anthropic Agent SDK · Supabase',
  },
  {
    name: 'Fidelis Pulse & Fidelis Advisor',
    description: 'Built two products: owner dashboards and M&A client workspaces.',
  },
  {
    name: 'AI Lead Generation',
    description: 'Built automated lead discovery and qualification with Next.js, Playwright, and Railway.',
    stack: 'Next.js · Playwright · Railway',
  },
]

export const resumeVariants: Record<ResumeVariant, ResumeVariantContent> = {
  sales: {
    variant: 'sales',
    summary:
      'Account executive with five years of B2B SaaS sales experience, combining full-cycle selling, AI workflow improvement, and hands-on software delivery. Partner with leadership and go-to-market engineers at SPS Commerce; independently build custom AI systems through Fidelis Strategy, from discovery through deployment.',
    roles: [
      {
        title: 'Net New Subscriber Account Executive, Supply Chain Performance',
        company: 'SPS Commerce',
        dates: 'Feb 2025 - Present',
        bullets: [
          SHARED_BULLETS.sales_result,
          SHARED_BULLETS.sales_scope,
          SHARED_BULLETS.ai_partner,
          SHARED_BULLETS.ai_pilot,
        ],
      },
      {
        title: 'Founder & Growth Strategy Consultant',
        company: 'Fidelis Strategy LLC',
        dates: 'Jan 2026 - Present',
        concurrent: true,
        bullets: FIDELIS_SALES_BULLETS,
      },
      {
        title: 'Mid-Market Account Executive',
        company: 'SPS Commerce',
        dates: 'Nov 2022 - Jan 2025',
        bullets: [SHARED_BULLETS.mid_market],
      },
      {
        title: 'Associate Account Executive, Community Sales',
        company: 'SPS Commerce',
        dates: 'Dec 2021 - Oct 2022',
        bullets: [SHARED_BULLETS.associate],
      },
    ],
    projects: BUILT_PROJECTS,
    skills: [
      {
        category: 'Sales',
        items:
          'Full-cycle SaaS sales, technical discovery, demos, ROI selling, outbound prospecting, Salesforce',
      },
      {
        category: 'GTM & AI Adoption',
        items: 'Workflow discovery, requirements feedback, pilot leadership, rollout support',
      },
      {
        category: 'AI & Technical',
        items: 'LLM APIs, agentic workflows, API integrations, FastAPI, Next.js, Postgres, Supabase',
      },
    ],
  },
  gtm: {
    variant: 'gtm',
    summary:
      'Account executive with five years of B2B SaaS sales experience. Partner with directors, VPs, and go-to-market engineers to identify sales bottlenecks, shape AI solutions, and support adoption. Independently build custom software and agentic workflows through Fidelis Strategy, connecting business priorities to working systems.',
    roles: [
      {
        title: 'Net New Subscriber Account Executive, Supply Chain Performance',
        company: 'SPS Commerce',
        dates: 'Feb 2025 - Present',
        bullets: [
          SHARED_BULLETS.ai_partner,
          SHARED_BULLETS.ai_pilot,
          SHARED_BULLETS.sales_result,
          SHARED_BULLETS.sales_scope,
        ],
      },
      {
        title: 'Founder & Growth Strategy Consultant',
        company: 'Fidelis Strategy LLC',
        dates: 'Jan 2026 - Present',
        concurrent: true,
        bullets: FIDELIS_GTM_BULLETS,
      },
      {
        title: 'Mid-Market Account Executive',
        company: 'SPS Commerce',
        dates: 'Nov 2022 - Jan 2025',
        bullets: [SHARED_BULLETS.mid_market],
      },
      {
        title: 'Associate Account Executive, Community Sales',
        company: 'SPS Commerce',
        dates: 'Dec 2021 - Oct 2022',
        bullets: [SHARED_BULLETS.associate],
      },
    ],
    projects: BUILT_PROJECTS,
    skills: [
      {
        category: 'GTM & AI Adoption',
        items: 'Workflow discovery, requirements feedback, pilot leadership, rollout support',
      },
      {
        category: 'AI & Technical',
        items: 'Agentic workflows, API integrations, LLM APIs, FastAPI, Next.js, Postgres, Supabase',
      },
      {
        category: 'Sales',
        items: 'Consultative discovery, technical demos, ROI selling, full-cycle SaaS sales, Salesforce',
      },
    ],
  },
}

export function contactLine(): string {
  const c = RESUME_CONTACT
  return `Portfolio: ${c.site} | ${c.linkedin}\n${c.phone} | ${c.email}`
}

function formatRoleBlock(role: ResumeRoleBlock): string {
  const header = `${role.title}, ${role.company} (${role.dates}${role.concurrent ? ', concurrent' : ''})`
  const bullets = role.bullets.map((b) => `  - ${b}`).join('\n')
  return `${header}\n${bullets}`
}

function formatProjectBlock(proj: ResumeProjectBlock): string {
  const stack = proj.stack ? ` Stack: ${proj.stack}.` : ''
  return `- **${proj.name}**: ${proj.description}${stack}`
}

/** Curated resume copy for AI chat, matcher, and tailor — same source as PDF/DOCX. */
export function formatResumeVariantForPrompt(variant: ResumeVariant): string {
  const v = resumeVariants[variant]
  const label = variant === 'sales' ? 'Sales-led (Commercial AE)' : 'AI GTM (Builder-forward)'
  const lines = [
    `### ${label}`,
    `Headline: ${RESUME_HEADLINE}`,
    `Summary: ${v.summary}`,
    '',
    'Experience (curated resume bullets):',
    ...v.roles.map((r) => formatRoleBlock(r)),
    '',
    'AI products & systems built:',
    ...v.projects.map((p) => formatProjectBlock(p)),
    '',
    'Skills:',
    ...v.skills.map((skill) => `  ${skill.category}: ${skill.items}`),
    '',
    PERSONAL_SIGNATURE,
  ]

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
