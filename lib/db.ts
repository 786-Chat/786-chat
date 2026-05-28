import { neon, NeonQueryFunction } from '@neondatabase/serverless'

// Lazy-load database connection to avoid build-time errors
let sqlInstance: NeonQueryFunction<false, false> | null = null

export function getSql() {
  if (!sqlInstance) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set')
    }
    sqlInstance = neon(process.env.DATABASE_URL)
  }
  return sqlInstance
}

// Export sql as a function that uses lazy loading
export const sql = new Proxy((() => {}) as NeonQueryFunction<false, false>, {
  apply(_target, _thisArg, args) {
    return (getSql() as any)(...args)
  },
  get(_target, prop) {
    return (getSql() as any)[prop]
  }
}) as NeonQueryFunction<false, false>
