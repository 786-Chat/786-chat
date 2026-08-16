import { query } from './db';

export async function logAudit(companyId: string, action: string, entity: string, entityId: string, details?: unknown) {
  await query(
    `INSERT INTO audit_logs (company_id, action, entity, entity_id, details) VALUES ($1, $2, $3, $4, $5)`,
    [companyId, action, entity, entityId, details ? JSON.stringify(details) : null]
  );
}
