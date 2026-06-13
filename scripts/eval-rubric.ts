/**
 * Rubric eval harness — the "evals before ship" gate for any matcher prompt change.
 *
 * Re-scores the labeled ground-truth set (lib/engine/eval/labeledSet.ts) against
 * each role's REAL job description with the CURRENT matcher rubric, then prints
 * before (stored snapshot) vs after (fresh score) so you can see whether a rubric
 * edit actually moved the needle BEFORE merging it.
 *
 * Run it (needs an Anthropic key + DB — neither is wired into CI/local test):
 *   node --env-file=.env.local --import tsx scripts/eval-rubric.ts
 *
 * Ship criteria for the Stage-2 rubric change:
 *   - every strong-yes role (label >= 8) scores >= AUTO_FIT (75)
 *   - every no role (label <= 2) scores < FLAG_FLOOR (45)
 *   - overall MAE vs labels goes DOWN versus the stored baseline
 */
import Anthropic from '@anthropic-ai/sdk'
import { sql } from '../lib/engine/db'
import { scoreRole } from '../lib/engine/matcher'
import { evaluate, labelToScore } from '../lib/engine/eval/compareToLabels'
import { LABELED_SET } from '../lib/engine/eval/labeledSet'
import { AUTO_FIT, FLAG_FLOOR } from '../lib/engine/thresholds'

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY not set. Run: node --env-file=.env.local --import tsx scripts/eval-rubric.ts')
    process.exit(1)
  }
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const rescored = []
  for (const row of LABELED_SET) {
    const found = (await sql`select jd_text, company, title, location from roles where id = ${row.id} limit 1`) as Array<{
      jd_text: string | null; company: string; title: string; location: string | null
    }>
    const jd = found[0]
    if (!jd?.jd_text) {
      console.warn(`! skipping id ${row.id} (${row.company}) — no JD text in DB`)
      continue
    }
    const result = await scoreRole(client, {
      company: jd.company, title: jd.title, jobDescription: jd.jd_text, location: jd.location ?? undefined,
    })
    rescored.push({ ...row, result })
  }

  const before = evaluate(LABELED_SET, 15)
  const after = evaluate(rescored, 15)

  console.log('\n  role                                          label   before  after')
  console.log('  ' + '─'.repeat(70))
  for (const row of rescored) {
    const stored = LABELED_SET.find((l) => l.id === row.id)!.result.score
    const name = `${row.company} — ${row.title}`.slice(0, 44).padEnd(44)
    const tgt = String(labelToScore(row.label)).padStart(5)
    const flag = row.label >= 8 && row.result.score < AUTO_FIT ? '  ← still misses 75'
      : row.label <= 2 && row.result.score >= FLAG_FLOOR ? '  ← still inflated'
      : ''
    console.log(`  ${name} ${tgt}   ${String(stored).padStart(4)}    ${String(row.result.score).padStart(4)}${flag}`)
  }

  const strongYes = rescored.filter((r) => r.label >= 8)
  const strongYesAuto = strongYes.filter((r) => r.result.score >= AUTO_FIT)
  const noRoles = rescored.filter((r) => r.label <= 2)
  const noInflated = noRoles.filter((r) => r.result.score >= FLAG_FLOOR)

  console.log('\n  MAE vs labels:   before ' + before.mae.toFixed(1) + '   →   after ' + after.mae.toFixed(1))
  console.log(`  strong-yes (label>=8) clearing AUTO_FIT(${AUTO_FIT}): ${strongYesAuto.length}/${strongYes.length}`)
  console.log(`  no-roles (label<=2) still >= FLAG_FLOOR(${FLAG_FLOOR}): ${noInflated.length}/${noRoles.length}`)
  const pass = after.mae <= before.mae && strongYesAuto.length === strongYes.length && noInflated.length === 0
  console.log('\n  SHIP CRITERIA: ' + (pass ? 'PASS ✓ — safe to merge the rubric change' : 'NOT MET ✗ — do not merge yet'))
  process.exit(pass ? 0 : 1)
}

main().catch((e) => { console.error(e); process.exit(1) })
