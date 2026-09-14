import 'server-only';
import { neon } from '@neondatabase/serverless';
import { env } from './env';

// Lazy Neon client factory. DATABASE_URL is read from validated env only when getDb/getSql is called.
export function getDb() {
  return neon(env.DATABASE_URL);
}

export function getSql() {
  return getDb();
}
