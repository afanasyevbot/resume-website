/**
 * Extract the first balanced JSON object from a string.
 *
 * Why this exists: Claude sometimes wraps JSON in code fences, prepends a
 * "Here's the JSON:" preamble, or appends a trailing sentence. A greedy
 * `/\{[\s\S]*\}/` regex would span from the first `{` to the last `}`, which
 * breaks the moment there's prose with its own punctuation after the object.
 *
 * Approach: walk the string char-by-char from the first `{`, tracking brace
 * depth and string state (so braces inside string literals don't count).
 * Return the first balanced substring. Throws if nothing valid is found.
 */
export function extractJsonObject(raw: string, label: string): string {
  const start = raw.indexOf('{')
  if (start === -1) {
    throw new Error(`${label}: no JSON object in response`)
  }

  let depth = 0
  let inString = false
  let escaped = false

  for (let i = start; i < raw.length; i++) {
    const ch = raw[i]

    if (inString) {
      if (escaped) {
        escaped = false
      } else if (ch === '\\') {
        escaped = true
      } else if (ch === '"') {
        inString = false
      }
      continue
    }

    if (ch === '"') {
      inString = true
      continue
    }

    if (ch === '{') {
      depth++
    } else if (ch === '}') {
      depth--
      if (depth === 0) {
        return raw.slice(start, i + 1)
      }
    }
  }

  throw new Error(`${label}: no JSON object in response`)
}
