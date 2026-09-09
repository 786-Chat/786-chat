import { neon } from '@neondatabase/serverless';
import { getDatabaseUrl } from './env';

let sql: any = null;

export function getSql() {
  if (!sql) {
    sql = neon(getDatabaseUrl());
  }
  return sql;
}

export async function query<T = any>(text: string, params?: any[]): Promise<{ rows: T[] }> {
  const sql = getSql();
  const result = await sql(text, ...(params || []));
  return { rows: result as T[] };
}