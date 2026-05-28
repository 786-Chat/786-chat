import { neon, NeonQueryFunction } from '@neondatabase/serverless'

let _sql: NeonQueryFunction<false, false> | null = null

export function getSql() {
  if (!_sql) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set')
    }
    _sql = neon(process.env.DATABASE_URL)
  }
  return _sql
}

// For backward compatibility - lazy getter
export const sql = new Proxy({} as NeonQueryFunction<false, false>, {
  apply(_, __, args) {
    return getSql()(args[0] as TemplateStringsArray, ...args.slice(1))
  },
  get(_, prop) {
    const instance = getSql()
    return (instance as Record<string | symbol, unknown>)[prop]
  }
})
