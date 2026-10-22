import 'server-only';
import { neon } from '@neondatabase/serverless';
import { DATABASE_URL } from './env';

let sql: ReturnType<typeof neon> | null = null;

export function getSql() {
  if (!sql) {
    sql = neon(DATABASE_URL);
  }
  return sql;
}
