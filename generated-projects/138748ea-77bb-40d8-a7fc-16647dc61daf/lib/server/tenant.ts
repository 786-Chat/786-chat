import 'server-only';
import { getSql } from './db';

export async function requireTenant(userId: string, companyId: string | null) {
  if (!companyId) {
    throw new Error('Forbidden');
  }
  const sql = getSql();
  const rows = (await sql`SELECT id FROM users WHERE id = ${userId} AND company_id = ${companyId}`) as unknown as Array<Record<string, any>>;
  if (rows.length === 0) {
    throw new Error('Forbidden');
  }
  return companyId;
}
