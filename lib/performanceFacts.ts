/** Do not advance performance standings without an explicit new confirmation from Matthew. */

export const SPS_PERFORMANCE_RESUME_BULLET =
  "Top performer in Q1 2026 and Q3 to date; ranked #3 of 30 account executives YTD and tracking toward President's Club."

export const SPS_PERFORMANCE_EXPERIENCE_LINE =
  "Ranked #3 of 30 account executives for 2026 year-to-date; tracking toward 2026 President's Club."

export const SPS_FY25_BULLET =
  "Achieved 102.6% of FY25 quota with the division's highest close rate."

export const SPS_AI_REPORTED_RESULTS =
  'Reported sales-floor results: users convert leads 10–20% faster and close deals approximately 1.5x faster than non-users.'

export const homepageProofPoints = [
  {
    value: 'Top performer',
    label: 'Q1 2026 & Q3 to date',
  },
  {
    value: '58%',
    label: 'Portfolio ARR growth · FY24',
    note: 'Managed portfolio across 500+ accounts.',
  },
  {
    value: 'Weeks → minutes',
    label: 'Buyer-list preparation',
    note: 'Client-reported Buyer Engine result.',
  },
] as const

/** Precise standings for Ask / role-fit context — not all are public homepage labels. */
export const performanceSourceFacts = [
  'Public performance label: Top performer in Q1 2026 and Q3 to date.',
  'Q1 2026: ranked #1 of 30 account executives (completed period).',
  'Q3 2026 to date: tied for #1 (in-progress standing; do not describe as an outright or completed Q3 win).',
  '2026 year-to-date: ranked #3 of 30 account executives.',
  "President's Club: tracking toward 2026 President's Club; this is a trajectory/forecast, not an award already earned.",
  "Achieved 102.6% of FY25 quota with the division's highest close rate.",
  SPS_AI_REPORTED_RESULTS,
  'The AI pilot metrics compare users versus non-users; they are not Matthew\'s personal conversion gains and do not imply he was the sole developer.',
] as const
