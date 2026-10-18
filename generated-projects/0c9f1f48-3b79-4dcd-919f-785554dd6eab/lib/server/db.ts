import { neon } from '@neondatabase/serverless';
import { getDatabaseUrl } from './env';

let sql: ReturnType<typeof neon> | null = null;

export function getSql() {
  if (!sql) {
    sql = neon(getDatabaseUrl());
  }
  return sql;
}

export async function query(text: string, params: unknown[] = []) {
  const sql = getSql();
  const rows = await sql(text, params as any[]);
  return { rows: rows as Array<Record<string, any>> };
}
