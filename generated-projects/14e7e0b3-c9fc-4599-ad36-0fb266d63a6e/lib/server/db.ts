import 'server-only';
import { neon, neonConfig } from '@neondatabase/serverless';
import { env } from './env';

neonConfig.fetchConnectionCache = true;

export function getDb() {
  const sql = neon(env.DATABASE_URL);
  return { query: sql };
}

export function getSql() {
  return neon(env.DATABASE_URL);
}
