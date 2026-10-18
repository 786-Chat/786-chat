import { getDb } from './db';

export async function logAudit(companyId: string, action: string, entity: string, entityId: string) {
  const db = getDb();
  await db(
    'INSERT INTO audit_logs (company_id, action, entity, entity_id) VALUES ($1, $2, $3, $4)',
    [companyId, action, entity, entityId]
  );
}
