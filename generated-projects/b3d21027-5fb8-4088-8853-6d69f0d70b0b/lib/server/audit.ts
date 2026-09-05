import { neon } from "@neondatabase/serverless";

export async function logAuditEvent(params: {
  companyId: string;
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}) {
  const sql = neon(process.env.DATABASE_URL!);
  await sql`
    INSERT INTO audit_logs (company_id, user_id, action, entity_type, entity_id, metadata)
    VALUES (${params.companyId}, ${params.userId ?? null}, ${params.action}, ${params.entityType}, ${params.entityId ?? null}, ${params.metadata ? JSON.stringify(params.metadata) : null})
  `;
}
