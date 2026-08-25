import assert from "node:assert/strict"
import fs from "node:fs"
import test from "node:test"

const apiSource = fs.readFileSync("components/786-chat/api.ts", "utf8")
const visionRoute = fs.readFileSync("app/api/786-chat/vision/route.ts", "utf8")

test("image attachments are analyzed by Gemini before normal generation", () => {
  assert.match(apiSource, /fetch\("\/api\/786-chat\/vision"/)
  assert.match(apiSource, /IMAGE REFERENCE ANALYSIS — GEMINI VISION ONLY/)
  assert.match(apiSource, /attachments:\s*\[\]/)
  assert.match(apiSource, /DeepSeek must perform all project code generation, editing and repair/)
})

test("read-only image questions return Gemini vision without changing project files", () => {
  assert.match(apiSource, /isReadOnlyImageRequest/)
  assert.match(apiSource, /model:\s*"gemini-vision"/)
  assert.match(apiSource, /files:\s*\{ \.\.\.request\.existing\.keyFiles \}/)
})

test("vision endpoint is analysis-only and never project codegen", () => {
  assert.match(visionRoute, /Your only job is to inspect attached images\/files/)
  assert.match(visionRoute, /Never generate code and never modify project files/)
  assert.match(visionRoute, /BUILDER_MODELS\["gemini-flash"\]/)
})
