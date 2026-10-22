import test from "node:test"
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { classifyBuilderMessageIntent } from "../../lib/786-chat/message-intent.ts"
import { validateGeneratedSecurity } from "../../lib/786-chat/generated-security.ts"

const exactQuestion = "Please read my existing Pest Control project code and identify the component that displays the Smart Devices cards. Do not edit, save, rebuild or deploy anything. Just explain what you found."

test("reported read-only project inspection routes to chat, not generation", () => {
  assert.equal(classifyBuilderMessageIntent(exactQuestion), "chat")
  assert.equal(classifyBuilderMessageIntent("Please inspect existing branch cards and explain what you found"), "chat")
  assert.equal(classifyBuilderMessageIntent("Read the Smart Devices source code, do not change any files"), "chat")
})

test("affirmative edit instructions still route to generation", () => {
  assert.equal(classifyBuilderMessageIntent("Please read the code and then fix Smart Devices"), "edit")
  assert.equal(classifyBuilderMessageIntent("Read the code and remove the legacy card"), "edit")
  assert.equal(classifyBuilderMessageIntent("Please fix the Smart Devices button"), "edit")
  assert.equal(classifyBuilderMessageIntent("Can you update the Device Check page?"), "edit")
})

const legacy = 'import { execSync } from "node:child_process"; execSync("echo legacy")'
const mouseScripts = {
  "ops/hp2/foodsafety-wifi-ap-scanner.mjs": legacy,
  "ops/hp2/owned-iot-mqtt-bridge.mjs": 'const cp = require("child_process"); cp.spawnSync("sh")',
}

test("brand-new or modified command execution is rejected", () => {
  assert.equal(validateGeneratedSecurity(mouseScripts).valid, false)
  assert.equal(validateGeneratedSecurity({
    ...mouseScripts,
    "ops/hp2/foodsafety-wifi-ap-scanner.mjs": 'import { execSync } from "node:child_process"; execSync("echo changed")',
  }, { unchangedFiles: mouseScripts }).valid, false)
})

test("only byte-identical trusted saved legacy scripts are warnings during an edit", () => {
  const result = validateGeneratedSecurity({
    ...mouseScripts,
    "app/page.tsx": "export default function Page() { return <main>Updated</main> }",
  }, { unchangedFiles: mouseScripts })
  assert.equal(result.valid, true)
  assert.equal(result.errors.length, 0)
  assert.equal(result.warnings.filter(w => w.code.startsWith("UNCHANGED_LEGACY_")).length, 2)
})

test("new scripts cannot masquerade as existing and secret detection is never waived", () => {
  const original = { "ops/hp2/foodsafety-wifi-ap-scanner.mjs": legacy }
  const malicious = { ...original, "ops/hp2/added-danger.mjs": legacy }
  assert.equal(validateGeneratedSecurity(malicious, { unchangedFiles: original }).valid, false)
  const secretInLegacy = { "ops/hp2/foodsafety-wifi-ap-scanner.mjs": legacy + '\nconst token = "sk-live-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"' }
  assert.equal(validateGeneratedSecurity(secretInLegacy, { unchangedFiles: secretInLegacy }).valid, false)
})

test("static public assets are not treated as server executable scripts", () => {
  const result = validateGeneratedSecurity({
    "client/public/foodsafety-iot/owned-iot-mqtt-bridge.mjs": legacy,
  })
  assert.equal(result.valid, true)
})

test("generation API and save API use server-verified legacy baselines", async () => {
  const generate = await readFile("app/api/786-chat/generate/route.ts", "utf8")
  const save = await readFile("app/api/786-chat/projects/[id]/route.ts", "utf8")
  const client = await readFile("components/786-chat/api.ts", "utf8")
  assert.match(generate, /isBuilderChatOnlyMessage\(prompt\)/)
  assert.match(generate, /getProjectWithData\(trustedProjectId, ownerEmail\)/)
  assert.match(generate, /unchangedFiles: existingFiles/)
  assert.match(generate, /projectId: trustedProjectId/)
  assert.match(save, /unchangedFiles: current\?\.files/)
  assert.match(client, /isBuilderChatOnlyMessage\(request\.message\)/)
  assert.match(client, /fetch\("\/api\/786-chat\/ask"/)
})
