export type Archetype = 'revenue-x-ai' | 'claude-code-sidebar' | 'classic-ats'

/** Structured tailored application package — text-only for now, DOCX/PDF later. */
export interface TailoredPackage {
  archetype: Archetype
  /** 3-4 sentence tailored profile summary. */
  summary: string
  /** 4 emphasized resume bullets, reframed in JD vocab from existing role bullets. */
  emphasizedBullets: string[]
  /** Cover letter body (no salutation/closing). ≤ 300 words. */
  coverLetter: string
  /** LinkedIn-style outreach note. ≤ 90 words. */
  outreachDraft: string
  /** Honest gap acknowledgments, ≤ 3 short phrases. */
  notes: string[]
  /** Any lint issues the agent had to self-correct during retries. */
  lintIssues: string[]
}

export interface TailorInput {
  /** The persisted role to tailor for. */
  role: {
    company: string
    title: string
    location: string | null
    url: string | null
    jdText: string
    fitScore: number | null
    fitReasons: string[]
    segment: string | null
    aiNative: boolean | null
  }
}
