import {
  PERFORMANCE_AS_OF,
  SPS_AI_REPORTED_RESULTS,
  SPS_FY25_BULLET,
  SPS_PERFORMANCE_EXPERIENCE_LINE,
  homepageProofPoints,
} from '@/lib/performanceFacts'

export const OPEN_ASK_EVENT = 'open-ask-ai'

export const publicEmail = 'mattafanasiev@outlook.com'
export const calendlyUrl = 'https://calendly.com/mafanasiev-fidelisstrategy/30min'
export const pulseUrl = 'https://fidelispulse.com'
export const pulseProductUrl = 'https://fidelispulse.com/pulse'
export const advisorUrl = 'https://fidelispulse.com/advisor'
export const glowUrl = 'https://glow-routine-seven.vercel.app'
export const fidelisUrl = 'https://fidelisstrategy.net'
export const paradiseCaseStudyUrl = 'https://fidelisstrategy.net/'

export const professionalLabel = 'Account Executive | AI Systems & GTM'
export const heroTagline = 'I sell complex software and build AI systems around real business needs.'
export const heroIntro =
  'Five years of B2B SaaS sales experience. At SPS Commerce, I sell complex solutions and partner with directors, VPs, and go-to-market engineers to improve sales workflows. Through Fidelis Strategy, I build custom AI software from business discovery through deployment.'
export const heroCurrentRoleNote =
  'Current role: Net New AE at SPS Commerce. Partnering with directors and VPs on AI workflow improvements. Based in Minneapolis.'
export const builderCredibilityLine = '5,500+ pull requests shipped in six months across client and product builds.'
export const personalSignature = 'MY WHY: Faith · Family · First generation'

export { homepageProofPoints }

export const experience = [
  {
    dates: 'Feb 2025 – Present',
    company: 'SPS Commerce',
    note: 'Current role',
    title: 'Net New AE · Supply Chain Performance',
    fullTitle: 'Net New Subscriber Account Executive, Supply Chain Performance',
    bullets: [
      SPS_PERFORMANCE_EXPERIENCE_LINE,
      'Top performer in Q1 2026 and Q3 to date',
      SPS_FY25_BULLET,
      'Own full-cycle mid-market sales to operators and CTOs, leading technical discovery and demos around supply-chain integrations',
      'Serve as a go-to frontline partner to directors and VPs, identifying rep bottlenecks and shaping AI workflow improvements with go-to-market engineers',
      `Helped lead the AI email-drafting pilot and presented the sales-team launch demo. ${SPS_AI_REPORTED_RESULTS}`,
    ],
  },
  {
    dates: 'Jan 2026 – Present · alongside SPS',
    company: 'Fidelis Strategy LLC',
    companyHref: fidelisUrl,
    note: 'Alongside SPS, not instead of it',
    title: 'Founder & Growth Strategy Consultant',
    fullTitle: 'Founder & Growth Strategy Consultant',
    bullets: [
      'Partner with Paradise Capital on its Buyer Engine and custom AI workflows, translating M&A operating needs into software and ongoing improvements',
      'Own client discovery, proposals, commercial agreement, solution design, deployment, and ongoing development',
    ],
  },
  {
    dates: 'Nov 2022 – Jan 2025',
    company: 'SPS Commerce',
    note: '58% portfolio ARR growth · FY24',
    title: 'Mid-Market Account Executive',
    fullTitle: 'Mid-Market Account Executive',
    bullets: [
      'Grew portfolio ARR 58% YoY across 500+ accounts; advised companies up to $150M in revenue on ERP migrations',
    ],
  },
  {
    dates: 'Dec 2021 – Oct 2022',
    company: 'SPS Commerce',
    note: '151% attainment · #1 of 40 AEs',
    title: 'Associate AE · Community Sales',
    fullTitle: 'Associate Account Executive, Community Sales',
    bullets: [
      'Ranked #1 of 40 account executives at 151% quota attainment; designed supplier onboarding campaigns with major retailers',
    ],
  },
  {
    dates: 'Jun 2021 – Nov 2021',
    company: 'UnitedHealth Group',
    title: 'Sales Representative',
    fullTitle: 'Sales Representative',
    bullets: [
      'Top performer converting high-volume inbound calls into enrolled members',
      'Conducted consultative needs assessments in a heavily regulated healthcare environment',
    ],
  },
]

export const spsCaseStudy = {
  title: 'Turning rep feedback into a useful AI sales workflow',
  body:
    'Repetitive customer-email drafting was taking time away from customer conversations. After identifying the problem and requesting AI access, I joined an existing SPS initiative, helped lead the sales-side pilot, and worked with go-to-market engineers to shape the solution around real rep workflows. I presented the launch demo to the sales team and continue to help directors and VPs identify bottlenecks and useful improvements.',
  reportedResults: SPS_AI_REPORTED_RESULTS,
  contribution:
    'Contribution: frontline workflow input, pilot leadership, requirements feedback, and launch demonstration — not sole development of the company\'s tool.',
  asOfNote: `Performance standings on this page are current as of ${PERFORMANCE_AS_OF}.`,
}

export const methodology = [
  {
    step: '01',
    title: 'Find the pain',
    body: 'Discovery with operators and executives on a SaaS deal: map how they buy and work today, quantify the cost of the current state, and isolate the workflow pain that actually moves budget.',
  },
  {
    step: '02',
    title: 'Guide the buying process',
    body: 'Prescriptive selling. Most buyers do not know what good looks like in a software evaluation yet. I walk them through the decision: who needs to be in the room, what questions to ask, and what a real platform has to cover.',
  },
  {
    step: '03',
    title: 'Teach the solution',
    body: 'Translate the platform into their workflow. Demo against the pain we already named, with an ROI case before anyone asks for pricing, legal, or a timeline.',
  },
  {
    step: '04',
    title: 'Close with conviction',
    body: 'Multithread across IT, finance, and operations. Keep the buying committee aligned through security review and procurement, remove scheduling bottlenecks, and close when the path is obvious.',
  },
]
