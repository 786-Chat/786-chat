import assert from "node:assert/strict"
import test from "node:test"
import { readFile } from "node:fs/promises"

const provider = await readFile(new URL("../../lib/786-chat/provider-controller.ts", import.meta.url), "utf8")
const security = await readFile(new URL("../../lib/786-chat/generated-security.ts", import.meta.url), "utf8")

test("validation repair preserves validator file order instead of backend bucket order", () => {
  assert.match(provider, /createValidationRepairUnits/)
  assert.match(provider, /VALIDATION-GUIDED REPAIR/)
  assert.match(provider, /isValidationRepair \? createValidationRepairUnits\(plannedFiles\) : createGenerationUnits\(plannedFiles\)/)
  assert.match(provider, /MAX_VALIDATION_REPAIR_FILE_UNITS_PER_REQUEST\s*=\s*4/)
})

test("documentation credential examples warn without weakening source secret blocking", () => {
  assert.match(security, /DOCUMENTATION_PATH/)
  assert.match(security, /DOCUMENTED_\$\{kind\}/)
  assert.match(security, /kind !== "PRIVATE_KEY"/)
  assert.match(security, /EMBEDDED_\$\{kind\}/)
})
