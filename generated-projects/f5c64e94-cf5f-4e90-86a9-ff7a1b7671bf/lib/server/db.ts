import 'server-only';
import { neon } from '@neondatabase/serverless';
import { getEnv } from './env';

let cachedSql: ReturnType<typeof neon> | null = null;

export function getSql() {
  if (!cachedSql) {
    const { DATABASE_URL } = getEnv();
    cachedSql = neon(DATABASE_URL);
  }
  return cachedSql;
}

export function getDb() {
  return getSql();
}
