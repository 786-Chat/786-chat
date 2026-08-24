import 'server-only';
import { neon, neonConfig } from '@neondatabase/serverless';
import { getEnv } from './env';

let db: ReturnType<typeof neon> | null = null;

export function getDb() {
  if (!db) {
    const { DATABASE_URL } = getEnv();
    neonConfig.fetchConnectionCache = true;
    db = neon(DATABASE_URL);
  }
  return db;
}

export function getSql() {
  return getDb();
}
