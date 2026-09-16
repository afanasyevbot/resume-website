import type { ProfessionalContext } from './types'

export const professionalContext: ProfessionalContext = {
  summary:
    'Account executive with five years of B2B SaaS sales experience, combining full-cycle selling, AI workflow improvement, and hands-on software delivery. At SPS Commerce, partners with directors, VPs, and go-to-market engineers to improve sales workflows; finished Q1 2026 ranked #1 of 30 account executives with 102.6% FY25 quota and the division\'s highest close rate. Through Fidelis Strategy, builds custom AI software from business discovery through deployment, including the Buyer Engine for Paradise Capital and products Fidelis Pulse and Fidelis Advisor.',

  identity: {
    name: 'Matthew Afanasiev',
    email: 'mattafanasiev@outlook.com',
    phone: '651-468-1408',
    linkedin: 'linkedin.com/in/matthewafanasiev',
    calendly: 'calendly.com/mafanasiev-fidelisstrategy/30min',
    websites: ['mafanasiev.me', 'fidelisstrategy.net', 'fidelispulse.com'],
    education: 'BBA, Marketing Management, University of St. Thomas, 2017–2021',
    firstGenGrad: true,
  },

  roles: [
    {
      title: 'Net New Subscriber Account Executive, Supply Chain Performance',
      shortTitle: 'Net New AE · Supply Chain Performance',
      company: 'SPS Commerce',
      dates: 'Feb 2025 – Present',
      preview:
        'Finished Q1 2026 ranked #1 of 30 account executives. Partners with leadership on AI workflow improvements alongside full-cycle supply chain sales.',
      bullets: [
        'Finished Q1 2026 ranked #1 of 30 account executives; achieved 102.6% of FY25 quota with the division\'s highest close rate',
        'Own full-cycle mid-market sales to operators and CTOs, leading technical discovery and demos around supply-chain integrations',
        'Serve as a go-to frontline partner to directors and VPs, identifying rep bottlenecks and shaping AI workflow improvements with go-to-market engineers',
        'Helped lead the AI email-drafting pilot and presented the sales-team launch demo. Reported sales-floor results: users convert leads 10–20% faster and close deals approximately 1.5x faster than non-users',
      ],
      aiContext: {
        situation:
          'Pure net-new role — every deal starts at zero, no inherited accounts or existing relationships. The buyer mix skews heavily toward companies earlier in their technology journey: emerging markets, businesses new to supply chain automation, and teams evaluating this category for the first time. These are not sophisticated technical buyers. They need to be brought along.',
        approach:
          'Consultative from the first conversation. The job is less about pitching features and more about teaching — helping prospects understand what they actually need, what questions to ask, and what a good solution looks like before they are ready to commit. Walk them through standing up on SPS supply chain solutions end to end. A growing and increasingly important part of every conversation is educating companies on how AI agents can be integrated directly into their supply chain and order management workflows, turning manual and reactive processes into automated, intelligent ones. Most buyers have heard about AI but have no idea how to apply it to their operations. Being able to explain that credibly, and connect it to their specific workflow, is a genuine differentiator in the sales process.',
        results:
          'Finished Q1 2026 ranked #1 of 30 account executives. 102.6% FY25 quota attainment with the division\'s highest close rate. Reported pilot results: users convert leads 10–20% faster and close deals approximately 1.5x faster than non-users.',
        lessons:
          'Pattern recognition beats activity volume. When you understand which accounts have real pain and which do not, you stop chasing and start closing.',
      },
    },
    {
      title: 'Founder & Growth Strategy Consultant',
      shortTitle: 'Founder · Fidelis Strategy LLC',
      company: 'Fidelis Strategy LLC',
      dates: 'Jan 2026 – Present (concurrent with SPS Commerce)',
      preview:
        'Partners with Paradise Capital on Buyer Engine and custom AI workflows. Owns client discovery through deployment while carrying full quota at SPS.',
      bullets: [
        'Partner with Paradise Capital on its Buyer Engine and custom AI workflows, translating M&A operating needs into software and ongoing improvements',
        'Own client discovery, proposals, commercial agreement, solution design, deployment, and ongoing development',
        'Built Fidelis Pulse (owner dashboards) and Fidelis Advisor (M&A client workspaces) as separate products',
        'Built AI lead-generation systems and other client platforms with Next.js, FastAPI, Supabase, and LLM APIs',
      ],
      aiContext: {
        situation:
          'After years of selling to businesses and seeing the same operational inefficiencies repeatedly, started building AI tools to solve them. Founded Fidelis Strategy while still carrying full quota at SPS Commerce, running both in parallel.',
        approach:
          'Build production systems, not prototypes. Every tool built has real users, real infrastructure (Next.js, Supabase, Railway, Stripe), and real constraints. Used Anthropic API across all projects, chat advisors, agent pipelines, scoring engines, and lead generation workflows.',
        results:
          'Buyer Engine for Paradise Capital: client reports reducing buyer-list preparation from weeks to minutes. Fidelis Pulse and Fidelis Advisor built as separate products. Additional client builds include lead generation, valuation, Glow Routine, and Grace Church technology.',
        lessons:
          'Execution beats planning. Real users expose problems that specs never anticipate. Building AI systems while selling AI taught me what buyers actually fear vs. what they say they want. The deeper lesson: AI advancements — especially what Anthropic is building toward — have fundamentally changed what is possible for any business. Off-the-shelf software forces a company to reshape its operations around someone else\'s workflows. That is backwards. Every business has specific processes that create their edge, and those processes should not be sacrificed to fit a generic system. With modern AI, you can build systems that conform to how a business actually works, not the other way around. That belief is the foundation of everything I build at Fidelis Strategy.',
      },
    },
    {
      title: 'Mid-Market Account Executive',
      shortTitle: 'Mid-Market AE · SPS Commerce',
      company: 'SPS Commerce',
      dates: 'Nov 2022 – Jan 2025',
      preview:
        '58% ARR growth YoY (FY24) across 500+ accounts. Built account expansion playbooks using CRM and Power BI analytics.',
      bullets: [
        'Grew annual recurring revenue 58% YoY (FY24) across a portfolio of 500+ accounts with companies up to $150M in revenue',
        'Built account expansion playbooks using CRM and Power BI analytics to identify upsell triggers',
        'Go-to technology advisor for mid-market suppliers, guiding ERP migrations, data connectivity upgrades, and tech stack consolidation',
        'Led multi-stakeholder deal cycles involving IT, finance, and operations',
      ],
      aiContext: {
        situation:
          'Inherited an underperforming territory with no playbook. Was taking a reactive approach, responding to inbound requests rather than driving proactively. Missed quota early. Recognized the pattern was the process, not the market.',
        approach:
          'Ran a full territory audit. Built a structured ICP matrix using Salesforce CRM and Power BI to identify accounts by vertical pain signal — prioritized the ones with the clearest workflow pain and lowest competitive risk. Shifted from reactive to proactive: dedicated outreach blocks per segment, consistent weekly cadence, multi-threaded from the start across IT, finance, and operations contacts. Discovery-heavy by design: always quantified the cost of the current state before positioning any solution. The goal was never to pitch features — it was to surface the pain, put a number on it, and let the ROI case do the work.',
        results:
          '58% ARR growth year-over-year in FY24 across a 500+ account portfolio. Managed companies up to $150M in revenue. Built expansion playbooks that the team adopted.',
        lessons:
          'Data tells you where to go. Process determines whether you get there. The market was never the problem, the approach was.',
      },
    },
    {
      title: 'Associate Account Executive, Community Sales',
      shortTitle: 'Associate AE · Community Sales',
      company: 'SPS Commerce',
      dates: 'Dec 2021 – Oct 2022',
      preview:
        'Ranked #1 of 40 AEs with the highest close rate at 151% quota attainment. High-volume new business territory.',
      bullets: [
        'Ranked #1 of 40 AEs with the highest close rate at 151% quota attainment',
        'Partnered with major retailers on supplier onboarding campaigns — sold the solutions to trading partners',
        'Educated hundreds of trading partners on EDI compliance and order-to-cash optimization',
      ],
      aiContext: {
        situation:
          'Entry-level AE role, high volume, retailer-driven onboarding deadlines, non-technical buyers. Had to close quickly and translate technical compliance requirements into business language. Partnered with major retailers on supplier onboarding campaigns as the seller of the solutions.',
        approach:
          'Disciplined cadence. Simplified the value message, focused on what happens if they miss the deadline (chargebacks, lost retail relationships) rather than features. Built rapport fast, moved quickly.',
        results: '#1 of 40 AEs. 151% quota attainment. Consistent top performer from day one.',
        lessons:
          'Consultative selling works at every speed. Even in high-volume environments, taking 60 seconds to ask the right question beats pitching immediately.',
      },
    },
    {
      title: 'Sales Representative',
      shortTitle: 'Sales Representative · UnitedHealth Group',
      company: 'UnitedHealth Group',
      dates: 'Jun 2021 – Nov 2021',
      preview:
        'Top performer. Consultative needs assessments in a heavily regulated healthcare environment.',
      bullets: [
        'Top performer on the team, converted high-volume inbound calls into enrolled members',
        'Conducted consultative needs assessments in a heavily regulated healthcare environment',
      ],
      aiContext: {
        situation:
          'First sales role out of college. High-volume inbound healthcare environment with strict compliance requirements.',
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
    inboundExperience: 'Has worked both outbound and inbound motions. At UnitedHealth Group, converted high-volume inbound calls into enrolled health plan members. At SPS Commerce Community Sales, worked retailer-driven inbound campaigns where suppliers needed to onboard on deadline, requiring fast qualification and closing under pressure. As the seller on those campaigns, partnered with major retailers on supplier onboarding programs. Primary outbound experience across the SPS Commerce mid-market and net-new roles.',
    dealSizeRange: 'Deal sizes varied significantly based on product and scope. Simple compliance and portal solutions were smaller transactional deals. Complex engagements involving full system integrations, multi-product combinations (analytics, POS data, revenue recovery, chargeback), and ERP connectivity with multiple stakeholders across IT, finance, and operations were considerably larger. The range reflected the breadth of what was being sold, not a fixed deal motion.',
    largestDeal: 'The more complex deals involving full integrations and multiple products across multiple stakeholders represented the higher end of the range.',
    products: [
      'EDI (Electronic Data Interchange), core supply chain compliance',
      'Supply chain performance and analytics',
      'POS (Point of Sale) data solutions',
      'Revenue recovery solutions',
      'Chargeback solutions',
      'Basic web portal options for order management',
      'Full system integrations, deep ERP and platform connectivity',
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
      'No vertical restrictions, has sold successfully across all of the above',
    ],
  },

  headlineMetrics: [
    { value: '#1', label: 'Of 30 AEs · Q1 2026' },
    { value: '102.6%', label: 'FY25 Attainment' },
    { value: '58%', label: 'ARR Growth · FY24' },
    { value: '5 yrs', label: 'B2B SaaS Sales' },
  ],

  keyStats: [
    'Finished Q1 2026 ranked #1 of 30 account executives at SPS Commerce',
    '102.6% FY25 quota attainment with the division\'s highest close rate',
    'Reported AI pilot results: users convert leads 10–20% faster and close deals approximately 1.5x faster than non-users',
    '58% ARR growth year-over-year in FY24 (Mid-Market AE)',
    '#1 of 40 AEs at 151% quota attainment (Community Sales)',
    '500+ account portfolio at peak (Mid-Market)',
    '5 years B2B SaaS sales experience',
    'Currently first or second among 30 account executives year-to-date at SPS Commerce',
    '5,500+ pull requests shipped in six months across client and product builds',
    'Buyer Engine client result: buyer-list preparation reduced from weeks to minutes (Paradise Capital)',
  ],

  starStories: [
    {
      title: 'Building Pipeline from Nothing',
      summary:
        'Stepped into a new territory with zero pipeline. Mapped territory, segmented by intent signals, prioritized quick wins. Closed $99K in two months against a $29K ramp quota across a mix of transactional and integration-level deals.',
    },
    {
      title: 'Winning a Skeptical Executive',
      summary:
        'Prospect had a trust deficit with the product. Waited for their acquisition to close, coordinated internal resources, brought in implementation experts, rebuilt trust step by step. Navigated a multi-stakeholder cycle and boxed out the competition to close a net-new integration deal.',
    },
    {
      title: 'ROI Changed the Outcome',
      summary:
        'Used Power BI to find a customer paying a discount rate for one integration while using free portals and competitors for everything else. Ran discovery, quantified the hidden cost. Despite higher price, the ROI case won. Replicated this model across the portfolio, contributed to 58% ARR growth.',
    },
    {
      title: 'Multi-Stakeholder Long Cycle',
      summary:
        'Prospect was automating EDI during an ERP migration with IT, finance, and operations all involved. Key decision-maker constantly traveling. Recorded a financial presentation walkthrough and sent it directly, removing the scheduling bottleneck. The recording got internal traction across the buying committee and closed the deal.',
    },
    {
      title: 'Persistence Pays Off',
      summary:
        'Used Power BI to identify an underutilized account. Prospect initially said they planned to cancel. Kept checking in. Months later, the president called directly after a personnel change left them without IT support. Ran fresh discovery, identified expanded needs, and closed a deal with meaningful growth potential.',
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
        'SPS acquired a new analytics tool (vendor scorecard/chargeback data). Dove into product docs, built an AI-powered knowledge base with segment-specific talk tracks. Generated 20+ qualified opportunities, tied for team leader in deals closed on the new product.',
    },
    {
      title: 'Turning a Miss into 58% Growth',
      summary:
        'Missed quota due to reactive approach. Did a full territory audit, built a structured territory plan, shifted from reactive to proactive with repeatable prospecting processes. Result: 58% YoY ARR growth.',
    },
    {
      title: 'Creating Repeatable Pipeline',
      summary:
        'Pipeline slowing with fewer trigger events. Identified opportunity to convert variable-usage customers to annual commitments using a cost-saving angle. Generated meaningful ARR and replicated the motion across the portfolio.',
    },
  ],

  projects: [
    {
      name: 'Buyer Engine',
      badge: 'Paradise Capital',
      description:
        'M&A buyer-research platform that finds, enriches, and ranks prospective acquirers. Client reports reducing buyer-list preparation from weeks to minutes.',
      stack: ['FastAPI', 'Anthropic Agent SDK', 'Supabase', 'Next.js', 'pgvector'],
      link: 'https://fidelisstrategy.net/',
    },
    {
      name: 'Fidelis Pulse',
      badge: 'Own Product',
      description:
        'Business-visibility dashboards that consolidate information for owners.',
      stack: ['Next.js', 'Railway Postgres', 'Stripe', 'LLM APIs'],
      link: 'https://fidelispulse.com/pulse',
    },
    {
      name: 'Fidelis Advisor',
      badge: 'Own Product',
      description:
        'A workspace for M&A/advisory firms to onboard clients, share documents, and manage notes and reminders.',
      stack: ['Next.js', 'Railway Postgres', 'Stripe', 'Claude for Finance'],
      link: 'https://fidelispulse.com/advisor',
    },
    {
      name: 'AI Lead Generation',
      badge: 'Client Build',
      description:
        'Automated lead discovery and qualification with Next.js, Playwright, and Railway.',
      stack: ['Next.js', 'Playwright', 'Railway'],
    },
    {
      name: 'M&A Valuation System',
      badge: 'AI Valuation · Client',
      description:
        'Streamlit-based M&A valuation platform running 12 financial models (DCF, comparables, precedent transactions, and more) across a multi-page deal workspace. Generates Excel and CIM-quality PDF reports, persists deals to Supabase, and supports multi-deal switching. Containerized with Docker and Nginx, instrumented with Sentry, and covered by a pytest suite.',
      stack: ['Python', 'Streamlit', 'Supabase', 'Docker + Nginx', 'Sentry', 'pytest'],
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
  ],

  proBono: [
    {
      name: 'Grace Church, Full Technology Buildout',
      badge: 'Pro Bono',
      description:
        'Pro bono technology consulting for Grace Evangelical Church. Built a custom member portal and back end on Azure SQL, plus Microsoft 365 business tenant setup, staff email accounts, donation platform integration, spend management workflow, full site redesign with new brand system, and content tooling for a non-technical team. Phase 2: QuickBooks Online implementation.',
      stack: [
        'Custom member portal',
        'Azure SQL database',
        'Microsoft 365 tenant',
        'Staff email accounts',
        'Donation platform',
        'Spend management',
        'Site redesign + brand',
        'QuickBooks Online (Phase 2)',
      ],
      link: 'https://eagangrace.com',
    },
  ],

  resumeStats: [
    { big: '#1', sub: 'OF 30 AEs · Q1 2026' },
    { big: '102.6%', sub: 'FY25 ATTAINMENT' },
    { big: '58%', sub: 'ARR GROWTH · FY24' },
    { big: '5 yrs', sub: 'B2B SAAS SALES' },
  ],

  resumeSkills: [
    {
      category: 'SALES',
      items:
        'Full-cycle SaaS sales, technical discovery, demos, ROI selling, outbound prospecting, Salesforce',
    },
    {
      category: 'GTM & AI ADOPTION',
      items: 'Workflow discovery, requirements feedback, pilot leadership, rollout support',
    },
    {
      category: 'AI & TECH',
      items:
        'LLM APIs, agentic workflows, API integrations, FastAPI, Next.js, Postgres, Supabase, 5,500+ pull requests in six months',
    },
  ],

  positioning: {
    openTo: 'Account executive and go-to-market (AE & GTM) roles in B2B SaaS',
    currentRole:
      'Net New AE at SPS Commerce. Finished Q1 2026 ranked #1 of 30 account executives; currently first or second among 30 AEs year-to-date. Full-cycle sales for complex B2B SaaS, partnering with directors and VPs on AI workflow improvements. Based in Minneapolis.',
    salesHeadline: 'Account Executive | AI Systems & GTM',
    gtmHeadline: 'Account Executive | AI Systems & GTM',
    fidelisValue:
      'Fidelis Strategy runs alongside SPS. Matthew owns client discovery through deployment, including the Buyer Engine for Paradise Capital (client reports buyer-list prep reduced from weeks to minutes), Fidelis Pulse, Fidelis Advisor, and other custom AI systems.',
    prescriptiveSelling:
      'Find the pain, guide the buying process, teach how the platform solves it. Discovery with operators and executives on SaaS deals, prescriptive evaluation guidance, demos mapped to named pain, ROI before pricing, multithreading through security and procurement.',
  },

  salesMethodology: [
    {
      step: '01',
      title: 'Find the pain',
      body: 'Discovery with operators and executives on a SaaS deal: map how they buy and work today, quantify the cost of the current state, and isolate the workflow pain that actually moves budget.',
    },
    {
      step: '02',
      title: 'Guide the buying process',
      body: 'Prescriptive selling. Most buyers do not know what good looks like in a software evaluation yet. Walk them through who needs to be in the room, what questions to ask, and what a real platform has to cover.',
    },
    {
      step: '03',
      title: 'Teach the solution',
      body: 'Translate the platform into their workflow. Demo against the pain already named, with an ROI case before anyone asks for pricing, legal, or a timeline.',
    },
    {
      step: '04',
      title: 'Close with conviction',
      body: 'Multithread across IT, finance, and operations. Keep the buying committee aligned through security review and procurement, remove scheduling bottlenecks, and close when the path is obvious.',
    },
  ],

  skills: {
    deep: [
      'Full-cycle B2B SaaS sales (hunting, discovery, demo, negotiation, close)',
      'Consultative discovery and ROI modeling with C-suite buyers',
      'AI systems building with Claude API, Anthropic Agent SDK, and RAG pipelines; 5,500+ pull requests shipped in six months',
      'Pipeline building from zero, prospecting, ICP targeting, territory strategy',
      'Multi-stakeholder sales cycles across IT, finance, and operations',
    ],
    conversant: [
      'Revenue operations and GTM strategy',
      'Data infrastructure (Supabase, Postgres, Railway)',
      'Product positioning and messaging',
      'CRM analytics (Salesforce, Power BI)',
    ],
    notMyZone: [
      'Enterprise deals (Fortune 500 / 100,000+ seat organizations), background is mid-market',
      'Pure backend or infrastructure engineering, builds on platforms and APIs, is not a software engineer',
      'Channel or partner sales motion, all experience is direct sales',
      'PLG (product-led growth) sales models, no experience converting self-serve free trial users specifically',
    ],
  },

  explicitGaps: [
    'No enterprise (Fortune 500, 100K+ seat) deal experience, mid-market is the sweet spot',
    'Not a software engineer, builds production AI systems on top of APIs and platforms, does not write low-level systems code',
    'No channel or partner sales experience, all direct',
    'No PLG (product-led growth) sales motion experience — no documented experience converting self-serve free trial users specifically',
    'Primary verticals closed: supply chain, retail, food, manufacturing, not fintech, insurance, or healthcare directly (has researched these for specific interviews)',
    'Quota size has been growing but is below $1M+ enterprise AE range',
  ],

  doNotSay: [
    'Do not claim enterprise experience, Matthew is mid-market',
    'Do not claim MEDDIC, Challenger, SPIN, Command of the Message, or other named methodology experience',
    'Do not invent statistics, dates, or experiences not in this data',
    'Do not claim to train or fine-tune AI models, Matthew uses and builds on top of APIs',
    'Do not name the specific AI vendor/API in application copy, say "multiple AI APIs" or "API integrations" (internal data may name it)',
    'Do not claim a $1M+ quota, his quota is mid-market sized but growing',
    'Decline gracefully if asked personal questions unrelated to professional background',
  ],
}
