import 'server-only';
import { query } from './db';

export async function logAudit(companyId: string, action: string, resource: string, resourceId: string | null, metadata: Record<string, unknown> = {}) {
  await query(
    `INSERT INTO audit_logs (company_id, action, resource, resource_id, metadata) VALUES ($1, $2, $3, $4, $5)`,
    [companyId, action, resource, resourceId, JSON.stringify(metadata)]
  );
}
