import { getSql } from './db';

export async function auditLog(companyId: string, action: string, entity: string, entityId?: string) {
  const sql = getSql();
  await sql`INSERT INTO audit_logs (company_id, action, entity, entity_id) VALUES (${companyId}, ${action}, ${entity}, ${entityId ?? null})`;
}
