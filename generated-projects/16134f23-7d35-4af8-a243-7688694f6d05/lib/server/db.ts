import 'server-only';
import { neon } from '@neondatabase/serverless';
import { requireDatabaseUrl } from './env';

let cachedSql: ReturnType<typeof neon> | null = null;

export function getSql() {
  if (!cachedSql) cachedSql = neon(requireDatabaseUrl());
  return cachedSql;
}

export async function query(text: string, params: unknown[] = []) {
  const sql = getSql();
  const rows = (await sql(text, params as any[])) as unknown as Record<string, any>[];
  return { rows };
}
