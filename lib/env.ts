import { readFileSync } from 'node:fs'
import { join } from 'node:path'

let cached: string | undefined

/**
 * Strip a single matched pair of surrounding quotes (single or double).
 * Mimics how dotenv treats quoted values like `KEY="value"` or `KEY='value'`.
 * Exported for unit testing; treat as module-private otherwise.
 */
export function stripQuotes(s: string): string {
  if (s.length < 2) return s
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    return s.slice(1, -1)
  }
  return s
}

/**
 * Returns the Anthropic API key, robust to a common dev annoyance:
 * a parent shell may have `ANTHROPIC_API_KEY=""` set (Claude Code, a
 * stale profile entry, etc.), and Next.js prefers shell env over
 * `.env.local`. So when process.env is empty/invalid, fall back to
 * parsing `.env.local` directly.
 *
 * On Vercel, the production env var is set normally and the first
 * branch wins — no file read needed.
 *
 * Throws if neither source produces a key that looks like an
 * Anthropic key. Result is cached per-process.
 */
export function anthropicKey(): string {
  if (cached) return cached

  const fromEnv = (process.env.ANTHROPIC_API_KEY ?? '').trim()
  if (fromEnv.startsWith('sk-ant-') && fromEnv.length > 50) {
    cached = fromEnv
    return fromEnv
  }

  // Shell value missing or empty — try .env.local at the project root.
  try {
    const path = join(process.cwd(), '.env.local')
    const content = readFileSync(path, 'utf8')
    const line = content.split('\n').find((l) => l.startsWith('ANTHROPIC_API_KEY='))
    if (!line) throw new Error('ANTHROPIC_API_KEY not in .env.local')
    const value = stripQuotes(line.slice('ANTHROPIC_API_KEY='.length).trim())
    if (!value.startsWith('sk-ant-') || value.length <= 50) {
      throw new Error('ANTHROPIC_API_KEY in .env.local is not a valid key')
    }
    cached = value
    return value
  } catch (err) {
    throw new Error(
      `Could not load ANTHROPIC_API_KEY: ${err instanceof Error ? err.message : String(err)}`,
    )
  }
}
