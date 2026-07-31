import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"
import vm from "node:vm"
import ts from "typescript"

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), "utf8")

async function loadAcceptance() {
  const source = await read("lib/786-chat/system-acceptance.ts")
  const javascript = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  const module = { exports: {} }
  vm.runInNewContext(javascript, { module, exports: module.exports })
  return module.exports.assessGeneratedSystem
}

function validFixture() {
  return {
    "sql/schema.sql": `
      CREATE TABLE companies (id UUID PRIMARY KEY, name TEXT NOT NULL);
      CREATE TABLE customers (
        id UUID PRIMARY KEY,
        company_id UUID NOT NULL REFERENCES companies(id),
        name TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE audit_logs (
        id UUID PRIMARY KEY,
        company_id UUID NOT NULL REFERENCES companies(id),
        event TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX customers_company_idx ON customers(company_id);
      CREATE INDEX audit_company_idx ON audit_logs(company_id);
    `,
    "app/api/customers/route.ts": `
      export async function GET(){ const companyId = requireTenant(); return companyId }
      export async function POST(){ const companyId = requireTenant(); schema.parse({}); await audit(); return companyId }
    `,
    "app/api/customers/[id]/route.ts": `
      export async function GET(){ const companyId = requireTenant(); return companyId }
      export async function PATCH(){ const companyId = requireTenant(); schema.parse({}); await audit(); return companyId }
      export async function DELETE(){ const companyId = requireTenant(); await audit(); return companyId }
    `,
    "app/dashboard/page.tsx": "export default function Page(){ return <p>Workflow status transition</p> }",
  }
}

const contract = {
  entities: ["companies", "customers", "audit_logs"],
  apiResources: ["customers"],
  workflows: ["lead-to-opportunity"],
  tenantScoped: true,
  platforms: ["web", "backend", "database"],
}

test("representative generated system passes schema, CRUD and tenant acceptance", async () => {
  const assess = await loadAcceptance()
  const result = assess(contract, validFixture())
  assert.equal(result.valid, true, result.errors.join("; "))
  assert.deepEqual(
    Object.values(result.checks),
    [true, true, true, true, true, true, true],
  )
})

test("cross-company unsafe APIs and incomplete migrations are rejected", async () => {
  const assess = await loadAcceptance()
  const files = validFixture()
  files["sql/schema.sql"] = "CREATE TABLE companies (id UUID PRIMARY KEY);"
  files["app/api/customers/route.ts"] = `
    export async function GET(){ return allCustomers() }
    export async function POST(){ return insertCustomer() }
  `
  const result = assess(contract, files)
  assert.equal(result.valid, false)
  assert.match(result.errors.join("\n"), /missing entities/i)
  assert.match(result.errors.join("\n"), /tenant ownership/i)
  assert.match(result.errors.join("\n"), /validate input/i)
  assert.match(result.errors.join("\n"), /audit event/i)
})

test("live Neon probe is admin-only, tenant-scoped and leaves no permanent table", async () => {
  const [route, probe] = await Promise.all([
    read("app/api/786-chat/system-acceptance/neon/route.ts"),
    read("lib/786-chat/neon-acceptance.ts"),
  ])
  assert.match(route, /isAdminUser/)
  assert.match(route, /RUN_ISOLATED_NEON_ACCEPTANCE/)
  assert.match(probe, /CREATE TEMP TABLE/)
  assert.match(probe, /ON COMMIT DROP/)
  assert.match(probe, /companyA/)
  assert.match(probe, /companyB/)
  assert.match(probe, /crossTenantIsolation/)
  assert.doesNotMatch(probe, /DROP TABLE/)
})
