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
  const rows = params.length > 0
    ? await sql(text, params, { arrayMode: false, fullResults: false })
    : await sql(text, [], { arrayMode: false, fullResults: false });
  return { rows: rows as T[] };
}
