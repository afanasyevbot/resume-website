export type RouteDecision = 'tailor' | 'flag' | 'discard'

export type Segment = 'mid-market' | 'enterprise' | 'unknown'

/** What the LLM judges about a role — judgment only, no routing. */
export interface MatchAssessment {
  score: number // 0-100 overall fit vs Matthew's profile
  reasons: string[] // concise bullets: why it fits / where it doesn't
  aiNative: boolean // is the company's core product building/selling AI?
  segment: Segment // the role's sales segment
  summary: string | null // 2-3 sentence plain-English summary of the role
}

/** A job posting to evaluate. */
export interface RoleInput {
  company: string
  title: string
  jobDescription: string
  url?: string
  location?: string
}

/** Assessment plus the deterministic routing decision. */
export interface MatchResult extends MatchAssessment {
  route: RouteDecision
}
