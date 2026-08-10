import { neon } from '@neondatabase/serverless';
import { getDatabaseUrl } from './env';

let sql: any = null;

export function getSql() {
  if (!sql) {
    sql = neon(getDatabaseUrl());
  }
  return sql;
}

export async function query<T = any>(text: string, params: unknown[] = []): Promise<{ rows: T[] }> {
  const sql = getSql();
  const rows = await sql.query(text, params);
  return { rows: rows as T[] };
}