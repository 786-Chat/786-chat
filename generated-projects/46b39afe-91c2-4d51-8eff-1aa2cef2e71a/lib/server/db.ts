import 'server-only';
import { neon } from '@neondatabase/serverless';
import { getDatabaseUrl } from './env';

let sql: ReturnType<typeof neon> | null = null;

export function getSql() {
  if (!sql) {
    sql = neon(getDatabaseUrl());
  }
  return sql;
}

export async function query<T>(text: string, params?: unknown[]): Promise<T[]> {
  const sql = getSql();
  const result = await sql(text, params);
  return result as T[];
}
