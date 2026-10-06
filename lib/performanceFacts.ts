/** Do not advance performance standings without an explicit new confirmation from Matthew. */

export const SPS_PERFORMANCE_RESUME_BULLET =
  "#1 ranked rep YTD at SPS Commerce; 200% of quota in Q3; broke the division record for most sales in a month; leading President's Club qualification."

export const SPS_PERFORMANCE_EXPERIENCE_LINE =
  "200% of quota in Q3; broke the division record for most sales in a month; leading President's Club qualification."

export const SPS_FY25_BULLET =
  "Achieved 102.6% of FY25 quota with the division's highest close rate."

export const SPS_AI_REPORTED_RESULTS =
  'Reported sales-floor results: reps using the pilot converted leads 10-20% faster and closed deals approximately 1.5x faster than non-users.'

export const homepageProofPoints = [
  {
    value: '#1 ranked rep YTD',
    label: 'SPS Commerce',
  },
  {
    value: '200%',
    label: 'Of quota in Q3',
  },
  {
    value: 'Division record',
    label: 'Most sales in a month',
  },
] as const

/** Precise standings for Ask / role-fit context — not all are public homepage labels. */
export const performanceSourceFacts = [
  '#1 ranked rep YTD at SPS Commerce. Use this exact framing. Do not say "#1 of 30" or cite a numeric rank out of 30.',
  '200% of quota in Q3 (full quarter).',
  'Broke the division record for most sales in a month.',
  "Leading President's Club qualification. This is current standing toward the club, not the same as having already won the award.",
  SPS_FY25_BULLET,
  'FY24: grew portfolio ARR 58% year-over-year across 500+ accounts (Mid-Market AE role).',
  SPS_AI_REPORTED_RESULTS,
  'Built Buyer Engine for an M&A advisory client through Fidelis Strategy.',
  "The AI pilot metrics compare users versus non-users; they are not Matthew's personal conversion gains and do not imply he was the sole developer.",
] as const
