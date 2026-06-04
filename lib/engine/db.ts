import { neon, type NeonQueryFunction } from '@neondatabase/serverless'

// Lazy-initialised so module import doesn't throw in test/build environments
// where DATABASE_URL is absent. The error surfaces only when a query runs.
let _sql: NeonQueryFunction<false, false> | null = null

function getSql(): NeonQueryFunction<false, false> {
  if (!_sql) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not set')
    }
    _sql = neon(process.env.DATABASE_URL)
  }
  return _sql
}

// Tagged-template forwarder. A real function (not a Proxy over `{}`) so the
// `sql`...`` call site works. Delegates to the lazy client on each call.
export const sql = ((strings: TemplateStringsArray, ...values: unknown[]) =>
  getSql()(strings, ...values)) as NeonQueryFunction<false, false>
