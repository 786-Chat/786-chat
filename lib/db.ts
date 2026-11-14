import { neon, type NeonQueryFunction } from '@neondatabase/serverless'
import { pgSql } from '@/lib/contabo-staging-postgres'

// 786.Chat platform data always lives in the main Neon database. Generated
// applications use sibling databases named generated_<project id>. Guard the
// platform from accidentally booting against one of those generated databases
// if Vercel's DATABASE_URL is ever pointed there.
export function platformDatabaseUrl(): string {
  const raw = process.env.DATABASE_URL?.trim()
  if (!raw) {
    throw new Error('DATABASE_URL environment variable is not set')
  }

  try {
    const url = new URL(raw)
    const databaseName = url.pathname.replace(/^\//, '')
    if (databaseName.startsWith('generated_')) {
      url.pathname = '/neondb'
      return url.toString()
    }
  } catch {
    // Keep the original value so the Neon client can report a useful error.
  }

  return raw
}

// Explicit opt-in only. Vercel/Neon stays the default until the staged migration is verified.
export function isContaboStagingDatabase(): boolean {
  return process.env.DATABASE_PROVIDER === 'postgres' && process.env.CONTABO_STAGING_ONLY === '1'
}

// Lazy-load database connection to avoid build-time errors
let sqlInstance: NeonQueryFunction<false, false> | null = null

export function getSql() {
  if (!sqlInstance) {
    sqlInstance = isContaboStagingDatabase()
      ? (pgSql as unknown as NeonQueryFunction<false, false>)
      : neon(platformDatabaseUrl())
  }
  return sqlInstance
}

// Export sql as a function that uses lazy loading
export const sql = new Proxy((() => {}) as unknown as NeonQueryFunction<false, false>, {
  apply(_target, _thisArg, args) {
    return (getSql() as any)(...args)
  },
  get(_target, prop) {
    return (getSql() as any)[prop]
  }
}) as NeonQueryFunction<false, false>
