/**
 * The engine's fit-score policy, in ONE place.
 *
 * Every threshold the engine acts on lives here so the matcher, the apply cron,
 * the router, the score-band labels, and the eval can never silently disagree.
 * Before this module, `75` / `70` / `60` were re-typed as literals across five
 * files — the eval graded agreement at a cutoff (60) the engine never used, so
 * "80% agreement" measured the wrong exam.
 *
 * If Matthew's policy changes, change it HERE and everything follows.
 */

/** Fit at/above this auto-submits on the daily cron — no human in the loop. */
export const AUTO_FIT = 75

/** Fit at/above this is tailored and (CRON_MIN_FIT..AUTO_FIT-1) held for approval.
 *  Also the cron's minimum fit to pick a role up at all. */
export const TAILOR_FLOOR = 70

/** Fit at/above this (and below TAILOR_FLOOR) is flagged "worth a look" — never
 *  auto-tailored. Below this is discarded as clear noise. */
export const FLAG_FLOOR = 45

/** Decent-but-not-tailored band edge used only for the "worth a look" label. */
export const LOOK_FLOOR = 55
