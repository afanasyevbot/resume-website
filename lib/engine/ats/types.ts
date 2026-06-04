/** A discovered job posting from an ATS, normalized across providers. */
export interface AtsListing {
  /** The ATS-specific job id (string or number; we keep as string for portability). */
  externalId: string
  title: string
  /** The user-facing job posting URL. Used as the dedup key in our DB. */
  url: string
  location: string | null
  /** Plain-text job description. Empty string if not yet hydrated. */
  jdText: string
  publishedAt: string | null
}

export interface TargetCompany {
  name: string
  ats: 'greenhouse' | 'ashby' | 'lever'
  slug: string
}
