export interface Role {
  title: string
  shortTitle: string
  company: string
  dates: string
  preview: string
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
  summary: string
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
    inboundExperience: string
    dealSizeRange: string
    largestDeal: string
    products: string[]
    industries: string[]
  }
  headlineMetrics: { value: string; label: string }[]
  keyStats: string[]
  starStories: Array<{ title: string; summary: string }>
  projects: Project[]
  proBono: Project[]
  skills: {
    deep: string[]
    conversant: string[]
    notMyZone: string[]
  }
  explicitGaps: string[]
  doNotSay: string[]
}

export interface FitResult {
  score: number
  verdict: string
  strengths: string[]
  flags: string[]
  recommendation: 'Proceed' | 'Proceed with caveats' | 'Consider passing'
}
