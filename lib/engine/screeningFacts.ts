import { sql } from './db'

/**
 * The screening-question answer sheet, stored as a single row in Neon
 * (table `profile_facts`). Kept out of source control so salary/demographic
 * data never enters git — the engine loads it at apply-time and passes only
 * what a given form asks for to the browser agent.
 */
export interface ScreeningFacts {
  identity: {
    firstName: string
    lastName: string
    email: string
    phone: string
    linkedin: string
    website: string
    location: string
  }
  workAuthorized: boolean
  needsSponsorship: boolean
  remoteOk: boolean
  willingToRelocate: boolean
  relocationRegions: string[]
  baseSalary: number
  ote: number
  startDate: string
  yearsSalesExperience: number
  selfSourcedPct: number
  martechYears: number
  languageProficiency: Record<string, string>
  howHeard: string
  gender: string
  raceEthnicity: string
  sexualOrientation: string
  veteranStatus: string
  disabilityStatus: string
}

/** Load the answer sheet, or null if not yet seeded. */
export async function loadScreeningFacts(): Promise<ScreeningFacts | null> {
  const rows = await sql`select facts from profile_facts where id = 1 limit 1`
  if (!rows || rows.length === 0) return null
  return (rows[0] as { facts: ScreeningFacts }).facts
}
