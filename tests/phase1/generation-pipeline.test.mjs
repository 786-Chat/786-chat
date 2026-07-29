import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), "utf8")

test("canonical generation analyses, plans and validates before acceptance", async () => {
  const route = await read("app/api/786-chat/generate/route.ts")
  const planner = await read("lib/786-chat/planner.ts")

  assert.match(route, /analyseProjectPrompt/)
  assert.match(route, /createProjectPlan/)
  assert.match(route, /validateGeneratedProject/)
  assert.match(route, /status:\s*422/)
})

test("login validation requires all requested controls", async () => {
  const analyser = await read("lib/786-chat/specification.ts")
  const validator = await read("lib/786-chat/validation.ts")

  for (const control of [
    "email-input",
    "password-input",
    "remember-me",
    "forgot-password-link",
    "submit-button",
  ]) {
    assert.match(analyser, new RegExp(control))
    assert.match(validator, new RegExp(control))
  }
  assert.match(validator, /type\\s\*=/)
  assert.match(validator, /password/)
})

test("explicit slash routes are preserved and sent in the generation brief", async () => {
  const analyser = await read("lib/786-chat/specification.ts")
  const route = await read("app/api/786-chat/generate/route.ts")

  assert.match(analyser, /explicitRoutes/)
  assert.match(analyser, /requestedRoutes/)
  assert.match(route, /MANDATORY STRUCTURED REQUIREMENTS/)
  assert.match(route, /Planned files:/)
  assert.match(planner, /package\.json/)
  assert.match(planner, /tsconfig\.json/)
  assert.match(planner, /next\.config\.mjs/)
})

test("generic fallback wording cannot pass verification", async () => {
  const validator = await read("lib/786-chat/validation.ts")

  assert.match(validator, /Generic fallback content was detected/)
  assert.match(validator, /AI Generated Project/)
})

test("canonical generation never accepts the local fallback as success", async () => {
  const route = await read("app/api/786-chat/generate/route.ts")

  assert.match(route, /result\.fellBackToLocal === true/)
  assert.match(route, /No generic fallback project was accepted or saved/)
  assert.match(route, /status:\s*503/)
})
