import { getSql } from './db';

export async function logAudit(action: string, entity: string, entityId: string, companyId: string) {
  const sql = getSql();
  await sql`INSERT INTO audit_logs (action, entity, entity_id, company_id) VALUES (${action}, ${entity}, ${entityId}, ${companyId})`;
}
