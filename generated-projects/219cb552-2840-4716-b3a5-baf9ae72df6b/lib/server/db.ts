import { neon } from '@neondatabase/serverless';
import { env } from './env';

// Lazy Neon client factory. DATABASE_URL is loaded from lib/server/env.ts
// only when getDb is called, so build-time page collection does not require
// the database to be reachable.
export function getDb() {
  const sql = neon(env.DATABASE_URL);
  return sql;
}

export type Db = ReturnType<typeof getDb>;
