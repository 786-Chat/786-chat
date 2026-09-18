import { neon, NeonQueryFunction } from '@neondatabase/serverless'

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

// Lazy-load database connection to avoid build-time errors
let sqlInstance: NeonQueryFunction<false, false> | null = null

export function getSql() {
  if (!sqlInstance) {
    sqlInstance = neon(platformDatabaseUrl())
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
