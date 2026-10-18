import 'server-only';
import { neon, NeonQueryFunction } from '@neondatabase/serverless';
import { env } from './env';

let sql: NeonQueryFunction<false, false> | null = null;

export function getDb(): NeonQueryFunction<false, false> {
  if (!sql) {
    sql = neon(env.DATABASE_URL);
  }
  return sql;
}
