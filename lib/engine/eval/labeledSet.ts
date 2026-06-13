import { decideRoute } from '../decideRoute'
import type { LabeledRole } from './compareToLabels'
import type { Segment } from '../types'

/**
 * Ground-truth eval set for the matcher rubric — real roles the engine sourced,
 * each given a 1-10 fit label from Matthew's actual profile so we can measure
 * whether the rubric scores his lane correctly.
 *
 * LABELING RUBRIC (Matthew = mid-market/strategic AE who also builds AI;
 * targets GTM/AE at AI-native + adjacent B2B SaaS; MID-MARKET not enterprise;
 * remote; ~$170k+ OTE):
 *   9-10  textbook fit — mid-market AE, B2B SaaS, remote, AI-native/adjacent
 *   7-8   strong — mid-market AE at a real SaaS co, minor gap (not AI-native, OTE unlisted)
 *   5-6   adjacent — right title but a real gap (geo, fintech vertical, big-co commercial)
 *   3-4   weak — enterprise-leaning AE, or AE at the wrong altitude
 *   1-2   no — enterprise-only AE, CSM, BDR/SDR, ops, engineering
 *
 * `result.score` is the CURRENT rubric's real prod output (snapshot 2026-06-13),
 * so the baseline test measures today's miscalibration with no API call. Two
 * roles carry Matthew's actual thumbs-up (noted) — his only hard ground truth.
 *
 * REVIEW NEEDED: these labels are Claude's proposal from Matthew's profile.
 * Matthew should confirm/adjust before the rubric change (Stage 2) ships.
 */

function r(score: number, segment: Segment, aiNative: boolean) {
  return { score, segment, aiNative, reasons: [], summary: null, route: decideRoute({ score, segment, aiNative, reasons: [], summary: null }) }
}

export const LABELED_SET: LabeledRole[] = [
  // ── Strong fits — mid-market AE in his lane (rubric scores these too low) ──
  { company: 'Customer.io', title: 'Senior Account Executive', label: 8, result: r(82, 'mid-market', false) },
  // Matthew THUMBED UP — textbook mid-market AE fit, yet scored 74 (below auto bar):
  { company: 'Customer.io', title: 'Mid-Market Account Executive, Americas', label: 9, result: r(74, 'mid-market', false) },
  // Matthew THUMBED UP — mid-market AE at an AI company, scored 72:
  { company: 'Hirequorum', title: 'Account Executive, Mid-Market', label: 8, result: r(72, 'mid-market', true) },
  { company: 'Anthropic', title: 'Growth Account Executive, AI Native', label: 8, result: r(72, 'mid-market', true) },
  { company: 'WorkOS', title: 'GTM - AI Native Sales', label: 8, result: r(72, 'unknown', true) },
  { company: 'Sumo Logic', title: 'Mid-Market Account Executive', label: 7, result: r(62, 'mid-market', false) },
  { company: 'Agiloft', title: 'Mid-Market Account Executive (Remote)', label: 7, result: r(62, 'mid-market', false) },

  // ── Adjacent — right title, a real gap (geo, vertical, big-co commercial) ──
  { company: 'BILL', title: 'Mid-Market Account Executive - AP', label: 6, result: r(52, 'mid-market', false) },
  { company: 'Vercel', title: 'Account Executive - Startups, Greenfield', label: 6, result: r(52, 'mid-market', true) },
  { company: 'Harvey', title: 'Mid Market Account Executive, EMEA', label: 5, result: r(52, 'mid-market', true) },
  { company: 'Datadog', title: 'Commercial Account Executive', label: 5, result: r(28, 'mid-market', false) },

  // ── No — enterprise-only AE, CSM, BDR, ops, engineering (rubric ~right here) ──
  { company: 'Anthropic', title: 'Enterprise Account Executive - Retail', label: 3, result: r(38, 'enterprise', true) },
  { company: 'Anthropic', title: 'Enterprise Account Executive, Telecommunications', label: 2, result: r(28, 'enterprise', true) },
  { company: 'Notion', title: 'Mid-Market Customer Success Manager', label: 2, result: r(42, 'mid-market', true) },
  { company: 'Databricks', title: 'Business Development Representative', label: 2, result: r(42, 'enterprise', true) },
  { company: 'Cohere', title: 'RevOps Analyst (Analytics)', label: 2, result: r(18, 'enterprise', true) },
  { company: 'Conga', title: 'Customer Success Manager', label: 1, result: r(12, 'enterprise', false) },
  { company: 'Ramp', title: 'Senior Software Engineer | GTM Platform, Backend', label: 1, result: r(8, 'unknown', true) },
]
