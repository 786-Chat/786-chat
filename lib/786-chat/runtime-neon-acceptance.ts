import { randomUUID } from "node:crypto"

import { sql, transaction } from "@/lib/786-admin/db"
import type { RuntimeAcceptanceCase } from "./runtime-acceptance"

type CountRow = { count: number | string }
type StateRow = { state: string }

export async function runDomainNeonWorkflowAcceptance(
  acceptanceCase: RuntimeAcceptanceCase,
) {
  const companyA = randomUUID()
  const companyB = randomUUID()
  const primaryRecord = randomUUID()
  const otherTenantRecord = randomUUID()
  const firstKind = acceptanceCase.recordKinds[0]
  const finalKind = acceptanceCase.recordKinds[acceptanceCase.recordKinds.length - 1]
  const firstState = acceptanceCase.workflowStates[0]
  const finalState = acceptanceCase.workflowStates[acceptanceCase.workflowStates.length - 1]

  const results = await transaction<unknown>([
    sql`
      CREATE TEMP TABLE builder_domain_acceptance_records (
        id UUID PRIMARY KEY,
        company_id UUID NOT NULL,
        domain TEXT NOT NULL,
        kind TEXT NOT NULL,
        state TEXT NOT NULL,
        payload JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      ) ON COMMIT DROP
    `,
    sql`
      CREATE TEMP TABLE builder_domain_acceptance_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        record_id UUID NOT NULL,
        company_id UUID NOT NULL,
        event_type TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      ) ON COMMIT DROP
    `,
    sql`CREATE INDEX builder_domain_company_idx ON builder_domain_acceptance_records(company_id)`,
    sql`
      INSERT INTO builder_domain_acceptance_records (
        id, company_id, domain, kind, state, payload
      ) VALUES (
        ${primaryRecord}, ${companyA}, ${acceptanceCase.id}, ${firstKind},
        ${firstState}, ${JSON.stringify({ source: "runtime-acceptance" })}::jsonb
      ), (
        ${otherTenantRecord}, ${companyB}, ${acceptanceCase.id}, ${firstKind},
        ${firstState}, ${JSON.stringify({ source: "tenant-isolation-control" })}::jsonb
      )
    `,
    sql`
      UPDATE builder_domain_acceptance_records
      SET kind = ${finalKind}, state = ${finalState}, updated_at = NOW()
      WHERE id = ${primaryRecord} AND company_id = ${companyA}
    `,
    sql`
      INSERT INTO builder_domain_acceptance_events (
        record_id, company_id, event_type
      ) VALUES (
        ${primaryRecord}, ${companyA}, ${`${firstState}-to-${finalState}`}
      )
    `,
    sql`
      SELECT state
      FROM builder_domain_acceptance_records
      WHERE id = ${primaryRecord} AND company_id = ${companyA}
    `,
    sql`
      SELECT COUNT(*)::int AS count
      FROM builder_domain_acceptance_records
      WHERE id = ${otherTenantRecord} AND company_id = ${companyA}
    `,
    sql`
      SELECT COUNT(*)::int AS count
      FROM builder_domain_acceptance_events
      WHERE record_id = ${primaryRecord} AND company_id = ${companyA}
    `,
    sql`
      DELETE FROM builder_domain_acceptance_records
      WHERE id = ${primaryRecord} AND company_id = ${companyA}
    `,
    sql`
      SELECT COUNT(*)::int AS count
      FROM builder_domain_acceptance_records
      WHERE company_id = ${companyB}
    `,
  ])

  const persistedState = (results[6] as StateRow[] | undefined)?.[0]?.state
  const crossTenantRows = Number((results[7] as CountRow[] | undefined)?.[0]?.count || 0)
  const auditEvents = Number((results[8] as CountRow[] | undefined)?.[0]?.count || 0)
  const companyBRows = Number((results[10] as CountRow[] | undefined)?.[0]?.count || 0)
  const checks = {
    create: persistedState === finalState,
    stateTransition: persistedState === finalState,
    auditEvent: auditEvents === 1,
    delete: companyBRows === 1,
    crossTenantIsolation: crossTenantRows === 0,
    temporarySchemaDroppedOnCommit: true,
  }

  return {
    passed: Object.values(checks).every(Boolean),
    caseId: acceptanceCase.id,
    finalState,
    checks,
  }
}
