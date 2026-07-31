import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"
import vm from "node:vm"
import ts from "typescript"

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), "utf8")

async function loadCases() {
  const source = await read("lib/786-chat/runtime-acceptance.ts")
  const javascript = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  const module = { exports: {} }
  vm.runInNewContext(javascript, { module, exports: module.exports })
  return module.exports
}

test("runtime matrix defines CRM, manufacturing and pest IoT cases", async () => {
  const { RUNTIME_ACCEPTANCE_CASES } = await loadCases()
  assert.deepEqual(
    Array.from(RUNTIME_ACCEPTANCE_CASES, (value) => value.id),
    ["crm", "manufacturing", "pest-iot"],
  )
  for (const value of RUNTIME_ACCEPTANCE_CASES) {
    assert.ok(value.prompt.length > 300)
    assert.equal(value.workflowStates.length, 3)
    assert.equal(value.recordKinds.length, 3)
  }
})

test("each runtime case selects an explicit operational blueprint", async () => {
  const { getRuntimeAcceptanceCase } = await loadCases()
  assert.equal(getRuntimeAcceptanceCase("crm").expectedBlueprintId, "crm")
  assert.equal(getRuntimeAcceptanceCase("manufacturing").expectedBlueprintId, "manufacturing")
  assert.equal(getRuntimeAcceptanceCase("pest-iot").expectedBlueprintId, "pest-control")
  assert.equal(getRuntimeAcceptanceCase("unknown"), null)
})

test("runtime endpoint uses canonical generation, persistence and isolated builds", async () => {
  const route = await read("app/api/786-chat/system-acceptance/runtime/route.ts")
  assert.match(route, /POST as generateProject/)
  assert.match(route, /saveGeneratedProjectAtomic/)
  assert.match(route, /POST as queueBuild/)
  assert.match(route, /runDomainNeonWorkflowAcceptance/)
  assert.match(route, /expectedBlueprintId/)
  assert.match(route, /RUN_PHASE_3_RUNTIME_ACCEPTANCE/)
  assert.match(route, /isAdminUser/)
})

test("runtime status verifies a passed compiled HTTPS preview", async () => {
  const route = await read("app/api/786-chat/system-acceptance/runtime/route.ts")
  assert.match(route, /build\?\.status === "passed"/)
  assert.match(route, /build\.deployment_url/)
  assert.match(route, /https:\\\/\\\//)
  assert.match(route, /text\\\/html/)
  assert.match(route, /AbortSignal\.timeout/)
  assert.doesNotMatch(route, /srcDoc|srcdoc/)
})

test("domain Neon probe performs state, audit, delete and tenant-isolation checks", async () => {
  const source = await read("lib/786-chat/runtime-neon-acceptance.ts")
  assert.match(source, /CREATE TEMP TABLE builder_domain_acceptance_records/)
  assert.match(source, /CREATE TEMP TABLE builder_domain_acceptance_events/)
  assert.match(source, /ON COMMIT DROP/)
  assert.match(source, /companyA/)
  assert.match(source, /companyB/)
  assert.match(source, /stateTransition/)
  assert.match(source, /auditEvent/)
  assert.match(source, /crossTenantIsolation/)
  assert.doesNotMatch(source, /DROP TABLE/)
})
