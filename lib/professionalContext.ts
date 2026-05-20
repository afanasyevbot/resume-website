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
        situation:
          'Selected for an elite 9-person net-new focused unit after strong Mid-Market performance. Started with zero inherited pipeline against a high quota bar. Had to build from scratch in new verticals while simultaneously running full cycles.',
        approach:
          'ICP mapping by vertical pain signal — prioritized accounts with the clearest workflow pain first. Multi-threaded from day 1 across IT, finance, and operations contacts. ROI-first discovery: always quantified the cost of the current state before positioning any solution.',
        results:
          'Ranked #1 in net-new production on the team company-wide. 5th of 30 AEs overall in FY25 at 102.6% attainment. Highest close rate in the division. Recognized as top performer Q1 2026.',
        lessons:
          'Pattern recognition beats activity volume. When you understand which accounts have real pain and which do not, you stop chasing and start closing.',
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
        situation:
          'After years of selling to businesses and seeing the same operational inefficiencies repeatedly, started building AI tools to solve them. Founded Fidelis Strategy while still carrying full quota at SPS Commerce — running both in parallel.',
        approach:
          'Build production systems, not prototypes. Every tool shipped has real users, real infrastructure (Next.js, Supabase, Railway, Stripe), and real constraints. Used Anthropic API across all projects — chat advisors, agent pipelines, scoring engines, and lead generation workflows.',
        results:
          '6 production AI systems delivered. Fidelis Pulse launched with live Stripe billing at two price tiers ($349/mo Operating, $499/mo Exit Ready). M&A client engagement projected $2M revenue impact. Multiple client lead generation and buyer intelligence platforms shipped.',
        lessons:
          'Shipping beats planning. Real users expose problems that specs never anticipate. Building AI systems while selling AI taught me what buyers actually fear vs. what they say they want.',
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
        situation:
          'Inherited an underperforming territory with no playbook. Was taking a reactive approach — responding to inbound requests rather than driving proactively. Missed quota early. Recognized the pattern was the process, not the market.',
        approach:
          'Ran a full territory audit. Built a structured ICP matrix using Salesforce CRM and Power BI to identify which accounts had the highest pain signal and lowest competitive risk. Shifted from reactive to proactive: dedicated outreach blocks per segment, consistent weekly cadence, multi-threaded from the start.',
        results:
          '58% ARR growth year-over-year in FY24 across a 500+ account portfolio. Managed companies up to $150M in revenue. Built expansion playbooks that the team adopted.',
        lessons:
          'Data tells you where to go. Process determines whether you get there. The market was never the problem — the approach was.',
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
        situation:
          'Entry-level AE role — high volume, retailer-mandated deadlines, non-technical buyers. Had to close quickly and translate technical compliance requirements into business language.',
        approach:
          'Disciplined cadence. Simplified the value message — focused on what happens if they miss the deadline (chargebacks, lost retail relationships) rather than features. Built rapport fast, moved quickly.',
        results: '#1 of 40 AEs. 151% quota attainment. Consistent top performer from day one.',
        lessons:
          'Consultative selling works at every speed. Even in high-volume environments, taking 60 seconds to ask the right question beats pitching immediately.',
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
        situation:
          'First sales role out of college. High-volume inbound healthcare environment with strict compliance requirements. Could not make promises, had to navigate regulations while still building trust fast.',
        approach:
          'Consultative needs assessment even under call volume pressure. Listened first. Matched members to the right plan rather than the most expensive one.',
        results:
          'Top performer on the team. Strong conversion rate from inbound leads to enrolled members.',
        lessons:
          'Sales in regulated environments teaches you precision. Every word matters. That discipline carried forward.',
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
      summary:
        'Stepped into a new territory with zero pipeline. Mapped territory, segmented by intent signals, prioritized quick wins. Closed $40K Month 1, $30K Month 2 — $99K in two months against a $29K ramp quota.',
    },
    {
      title: 'Winning a Skeptical Executive',
      summary:
        'Prospect had a trust deficit with the product. Waited for their acquisition to close, coordinated internal resources, brought in implementation experts, rebuilt trust step by step. Boxed out competition, closed $30K net-new.',
    },
    {
      title: 'ROI Changed the Outcome',
      summary:
        'Used Power BI to find a customer paying a discount rate for one integration while using free portals and competitors for everything else. Ran discovery, quantified the hidden cost. Despite higher price, the ROI case won. Replicated this model across the portfolio — contributed to 58% ARR growth.',
    },
    {
      title: 'Multi-Stakeholder Long Cycle',
      summary:
        'Prospect was automating EDI during an ERP migration. Key decision-maker constantly traveling. Recorded a financial presentation walkthrough and sent it directly, removing the scheduling bottleneck. The recording got internal traction and closed a $30K deal.',
    },
    {
      title: 'Persistence Pays Off',
      summary:
        'Used Power BI to identify an underutilized account. Prospect initially said they planned to cancel. Kept checking in every two weeks. Months later, the president called directly — their IT contact had been let go. Ran discovery, closed $20K with growth potential.',
    },
    {
      title: 'Failure: Skipped Discovery',
      summary:
        'Early in AE tenure, moved straight to pricing without building the value case. Deal stalled and died. Lesson: always find the pain before presenting the price. This failure shaped the entire consultative approach that drove 58% growth later.',
    },
    {
      title: 'Overcoming Budget Objections',
      summary:
        'Supplier said no budget. Discovered they were manually entering orders and invoices into ERP for hours. Uncovered automation opportunity. Tied cost to pain, found a phased pricing structure. Closed $5K ARR with growth potential.',
    },
    {
      title: 'Adapting to New Product Launch',
      summary:
        'SPS acquired a new analytics tool (vendor scorecard/chargeback data). Dove into product docs, built an AI-powered knowledge base with segment-specific talk tracks. Generated 20+ qualified opportunities — tied for team leader in deals closed on the new product.',
    },
    {
      title: 'Turning a Miss into 58% Growth',
      summary:
        'Missed quota due to reactive approach. Did a full territory audit, built a structured territory plan, shifted from reactive to proactive with repeatable prospecting processes. Result: 58% YoY ARR growth.',
    },
    {
      title: 'Creating Repeatable Pipeline',
      summary:
        'Pipeline slowing with fewer trigger events. Identified opportunity to convert variable-usage customers to annual commitments using a cost-saving angle. Generated $25K+ in ARR and replicated the motion across accounts.',
    },
  ],

  projects: [
    {
      name: 'Fidelis Pulse',
      badge: 'Live SaaS Product',
      description:
        "Financial dashboard SaaS for owner-operators. Multi-tenant firm isolation, per-client Stripe billing at two tiers ($349/mo Operating, $499/mo Exit Ready), QuickBooks + Xero + Plaid OAuth integrations, and a Claude-powered AI advisor that generates narrative commentary on each client's financials. Live in production with real customers.",
      stack: [
        'Next.js 15 App Router',
        'Railway Postgres',
        'Stripe (live mode)',
        'NextAuth 5',
        'Anthropic Claude API',
        'QuickBooks Online',
        'Xero',
        'Plaid',
      ],
      link: 'https://fidelispulse.com',
    },
    {
      name: 'M&A Advisory — Buyer Intelligence Engine',
      badge: 'AI Agents — Client Work',
      description:
        'Multi-agent platform for a PE advisory firm. Discovers, enriches, and semantically ranks acquisition targets. Uses pgvector for semantic search, Python FastAPI workers for data processing, and Anthropic Managed Agents + Claude Agent SDK for autonomous research tasks. Built as a Turborepo monorepo with Next.js frontend and Supabase backend.',
      stack: [
        'Turborepo',
        'Next.js 15',
        'Supabase (pgvector + PGMQ)',
        'FastAPI',
        'Anthropic Agent SDK',
        'Anthropic Managed Agents',
      ],
    },
    {
      name: 'M&A Advisory — Lead Generation Platform',
      badge: 'Lead Generation — Client Work',
      description:
        'Automated acquisition target discovery and qualification for an M&A advisory client. Claude-powered scoring against buyer criteria, persistent lead database, weekly automated reports for the advisory team. Deployed on Railway with cron-triggered pipeline.',
      stack: ['Next.js', 'Claude API', 'SQLite', 'Railway', 'Sentry'],
    },
    {
      name: 'Real Estate Tech — AI Prospecting Engine',
      badge: 'Lead Generation — Client Work',
      description:
        'Automated prospect discovery for a real estate SaaS client. Playwright web and LinkedIn scraping, multi-provider enrichment (Apollo, Hunter, Snov, Dropcontact), AI-scored ICP matching, and outreach draft generation. Deployed on Railway with cron-triggered pipeline. Vitest test suite.',
      stack: [
        'Next.js 16',
        'TypeScript',
        'Playwright',
        'Apollo',
        'Hunter',
        'Railway',
        'Vitest',
      ],
    },
    {
      name: 'Glow Routine',
      badge: 'Consumer PWA',
      description:
        'Skincare tracking progressive web app with AM/PM checklists, streak tracking, journal photos, web push reminders (GitHub Actions cron), and a Claude-powered AI advisor. Sentry error tracking and PostHog analytics instrumented. Vitest + Playwright test suite.',
      stack: [
        'Next.js 15',
        'Supabase',
        'Anthropic Claude',
        'Web Push (VAPID)',
        'PostHog',
        'Sentry',
        'Vitest',
        'Playwright',
      ],
    },
    {
      name: 'Grace Church — Full Technology Buildout',
      badge: 'Pro Bono',
      description:
        'Complete technology modernization for Grace Evangelical Church: Microsoft 365 business tenant setup, staff email accounts, donation platform integration, spend management workflow, full site redesign with new brand system, and content tooling for a non-technical team. Phase 2: QuickBooks Online implementation.',
      stack: [
        'Microsoft 365',
        'Donation platform',
        'Custom site',
        'Content management',
      ],
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
    'Primary verticals closed: supply chain, retail, food, manufacturing — not fintech, insurance, or healthcare directly (has researched these for specific interviews)',
    'Quota size has been growing but is below $1M+ enterprise AE range',
  ],

  doNotSay: [
    'Do not claim enterprise experience — Matthew is mid-market',
    'Do not claim MEDDIC, Challenger, SPIN, Command of the Message, or other named methodology experience',
    'Do not invent statistics, dates, or experiences not in this data',
    'Do not claim to train or fine-tune AI models — Matthew uses and builds on top of APIs',
    'Decline gracefully if asked personal questions unrelated to professional background',
  ],
}
