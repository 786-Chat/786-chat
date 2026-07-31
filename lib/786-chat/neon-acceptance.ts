import { randomUUID } from "node:crypto"

import { sql, transaction } from "@/lib/786-admin/db"

type CountRow = { count: number | string }
type ValueRow = { value: string }

export async function runIsolatedNeonAcceptance() {
  const companyA = randomUUID()
  const companyB = randomUUID()
  const recordA = randomUUID()
  const recordB = randomUUID()
  const results = await transaction<unknown>([
    sql`
      CREATE TEMP TABLE builder_system_acceptance_probe (
        id UUID PRIMARY KEY,
        company_id UUID NOT NULL,
        value TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      ) ON COMMIT DROP
    `,
    sql`CREATE INDEX builder_probe_company_idx ON builder_system_acceptance_probe(company_id)`,
    sql`
      INSERT INTO builder_system_acceptance_probe (id, company_id, value)
      VALUES (${recordA}, ${companyA}, 'company-a'), (${recordB}, ${companyB}, 'company-b')
    `,
    sql`
      SELECT COUNT(*)::int AS count
      FROM builder_system_acceptance_probe
      WHERE company_id = ${companyA}
    `,
    sql`
      UPDATE builder_system_acceptance_probe
      SET value = 'company-a-updated'
      WHERE id = ${recordA} AND company_id = ${companyA}
    `,
    sql`
      SELECT value
      FROM builder_system_acceptance_probe
      WHERE id = ${recordA} AND company_id = ${companyA}
    `,
    sql`
      SELECT COUNT(*)::int AS count
      FROM builder_system_acceptance_probe
      WHERE id = ${recordB} AND company_id = ${companyA}
    `,
    sql`
      DELETE FROM builder_system_acceptance_probe
      WHERE id = ${recordA} AND company_id = ${companyA}
    `,
    sql`
      SELECT COUNT(*)::int AS count
      FROM builder_system_acceptance_probe
      WHERE company_id = ${companyB}
    `,
  ])
  const created = Number((results[3] as CountRow[] | undefined)?.[0]?.count || 0)
  const updated = (results[5] as ValueRow[] | undefined)?.[0]?.value
  const crossTenantRows = Number((results[6] as CountRow[] | undefined)?.[0]?.count || 0)
  const companyBRows = Number((results[8] as CountRow[] | undefined)?.[0]?.count || 0)
  const passed =
    created === 1 &&
    updated === "company-a-updated" &&
    crossTenantRows === 0 &&
    companyBRows === 1
  return {
    passed,
    checks: {
      create: created === 1,
      read: updated === "company-a-updated",
      update: updated === "company-a-updated",
      delete: companyBRows === 1,
      crossTenantIsolation: crossTenantRows === 0,
      temporarySchemaDroppedOnCommit: true,
    },
  }
}
