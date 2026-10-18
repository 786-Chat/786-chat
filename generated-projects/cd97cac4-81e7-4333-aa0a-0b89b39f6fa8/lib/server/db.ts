import 'server-only';
import { neon } from '@neondatabase/serverless';
import { env } from './env';

let sql: ReturnType<typeof neon> | null = null;

export function getSql() {
  if (!sql) {
    sql = neon(env.DATABASE_URL);
  }
  return sql;
}
