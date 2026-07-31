import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"
import vm from "node:vm"
import ts from "typescript"

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), "utf8")

async function loadAcceptance() {
  const source = await read("lib/786-chat/domain-acceptance.ts")
  const javascript = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  const module = { exports: {} }
  vm.runInNewContext(javascript, { module, exports: module.exports })
  return module.exports.assessDomainAcceptance
}

function operationalPage(copy) {
  return `
    "use client"
    import { useState } from "react"
    export default function Page() {
      const [status, setStatus] = useState("new")
      return <main><p>${copy}</p><form onSubmit={() => setStatus("approved")}>
        <input name="search" /><select name="status"><option>hold</option></select>
        <button type="submit">Approve and dispatch</button>
      </form><table><tbody><tr><td>{status}</td></tr></tbody></table></main>
    }
  `
}

function baseFixture(routes, evidence) {
  const files = {
    "sql/schema.sql": `
      CREATE TABLE companies (id UUID PRIMARY KEY);
      CREATE TABLE records (
        id UUID PRIMARY KEY,
        company_id UUID NOT NULL REFERENCES companies(id),
        status TEXT NOT NULL
      );
      CREATE INDEX records_company_idx ON records(company_id);
    `,
    "app/api/records/route.ts":
      "export async function GET(){return requireTenant()} export async function POST(){return requireTenant()}",
    "app/api/records/[id]/route.ts":
      "export async function GET(){return requireTenant()} export async function PATCH(){return requireTenant()} export async function DELETE(){return requireTenant()}",
  }
  routes.forEach((route, index) => {
    files[`app/${route.slice(1)}/page.tsx`] = operationalPage(index === 0 ? evidence : "Operational status transition")
  })
  return files
}

test("CRM output proves the lead-to-conversion workflow", async () => {
  const assess = await loadAcceptance()
  const files = baseFixture(
    ["/customers", "/pipeline", "/activities", "/reports"],
    "Lead capture form saves customer. Pipeline opportunity stage status. Sales follow-up notification task. Booking sale conversion campaign attribution.",
  )
  const result = assess("crm", files)
  assert.equal(result.valid, true, result.errors.join("; "))
  assert.deepEqual(Object.values(result.checks), [true, true, true, true, true])
})

test("manufacturing output proves traceability, safety and recall operations", async () => {
  const assess = await loadAcceptance()
  const files = baseFixture(
    ["/production", "/batches", "/quality", "/inventory", "/maintenance", "/traceability"],
    "BOM recipe material production. Batch lot traceability supplier. Quality release hold inspection. Temperature hygiene allergen expiry. Recall dispatch warehouse barcode. Maintenance downtime machine wastage.",
  )
  const result = assess("manufacturing", files)
  assert.equal(result.valid, true, result.errors.join("; "))
})

test("pest-control output proves the device-to-technician workflow", async () => {
  const assess = await loadAcceptance()
  const files = baseFixture(
    ["/devices", "/alerts", "/map", "/reports"],
    "Device registration pairing QR. Telemetry MQTT HTTPS gateway. Battery signal online offline. Alert acknowledge status event. Technician work order maintenance assignment. Site building floor room.",
  )
  const result = assess("pest-control", files)
  assert.equal(result.valid, true, result.errors.join("; "))
})

test("static marketing dashboards cannot satisfy domain acceptance", async () => {
  const assess = await loadAcceptance()
  const files = {
    "app/customers/page.tsx": "export default function Page(){return <h1>Customers</h1>}",
    "app/pipeline/page.tsx": "export default function Page(){return <h1>Beautiful pipeline cards</h1>}",
    "app/activities/page.tsx": "export default function Page(){return <h1>Activities</h1>}",
    "app/reports/page.tsx": "export default function Page(){return <h1>Reports</h1>}",
  }
  const result = assess("crm", files)
  assert.equal(result.valid, false)
  assert.match(result.errors.join("\n"), /workflow evidence/i)
  assert.match(result.errors.join("\n"), /operational pages/i)
  assert.match(result.errors.join("\n"), /tenant-scoped schema/i)
})

test("missing a critical manufacturing workflow is named explicitly", async () => {
  const assess = await loadAcceptance()
  const files = baseFixture(
    ["/production", "/batches", "/quality", "/inventory", "/maintenance", "/traceability"],
    "BOM recipe material production. Batch lot traceability supplier. Quality release hold inspection. Recall dispatch warehouse barcode. Maintenance downtime machine wastage.",
  )
  const result = assess("manufacturing", files)
  assert.equal(result.valid, false)
  assert.match(result.errors.join("\n"), /food safety monitoring/i)
})

test("active project validation invokes domain acceptance", async () => {
  const validation = await read("lib/786-chat/validation.ts")
  assert.match(validation, /assessDomainAcceptance/)
  assert.match(validation, /systemBlueprint\.id/)
  assert.match(validation, /domainAcceptance\.errors/)
})
