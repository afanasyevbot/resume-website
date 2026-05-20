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

export interface FitResult {
  score: number
  verdict: string
  strengths: string[]
  flags: string[]
  recommendation: 'Proceed' | 'Proceed with caveats' | 'Consider passing'
}
