import { neon, type NeonQueryFunction } from '@neondatabase/serverless'

// Lazy-initialised so module import doesn't throw in test/build environments
// where DATABASE_URL is absent. The error surfaces only when a query runs.
let _sql: NeonQueryFunction<false, false> | null = null

export function getSql(): NeonQueryFunction<false, false> {
  if (!_sql) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not set')
    }
    _sql = neon(process.env.DATABASE_URL)
  }
  return _sql
}

// Convenience re-export so existing callers keep `import { sql }` syntax
export const sql: NeonQueryFunction<false, false> = new Proxy(
  {} as NeonQueryFunction<false, false>,
  {
    apply(_target, _thisArg, args) {
      // eslint-disable-next-line prefer-spread
      return getSql().apply(undefined, args as Parameters<NeonQueryFunction<false, false>>)
    },
    get(_target, prop) {
      return getSql()[prop as keyof NeonQueryFunction<false, false>]
    },
  },
)
