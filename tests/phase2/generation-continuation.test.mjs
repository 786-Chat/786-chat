import assert from "node:assert/strict"
import test from "node:test"
import { readFile } from "node:fs/promises"

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), "utf8")
const [controller, runner, route, governance, client, continuation] = await Promise.all([
  read("lib/786-chat/provider-controller.ts"),
  read("lib/786-chat/file-unit-runner.ts"),
  read("app/api/786-chat/generate/route.ts"),
  read("lib/786-chat/ai-governance.ts"),
  read("components/786-chat/api.ts"),
  read("lib/786-chat/generation-continuation.ts"),
])
const { runFileGenerationUnits } = await import("../../lib/786-chat/file-unit-runner.ts")

test("10-file plans continue in bounded two-unit rounds without regeneration", async () => {
  const units = Array.from({ length: 10 }, (_, index) => ({ name: `unit-${index}`, files: [`file-${index}.ts`] }))
  let files = {}
  const generated = []
  for (let offset = 0; offset < units.length; offset += 2) {
    files = await runFileGenerationUnits({
      units: units.slice(offset, offset + 2),
      providers: ["deepseek-flash", "gemini-flash"],
      initialFiles: files,
      generate: async (unit, provider) => {
        assert.equal(provider, "deepseek-flash")
        generated.push(unit.files[0])
        return `complete:${unit.files[0]}`
      },
    })
  }
  assert.equal(new Set(generated).size, 10)
  assert.deepEqual(Object.keys(files), units.map((unit) => unit.files[0]))
})

test("server protocol caps rounds, seeds prior files and never returns a partial project", () => {
  assert.match(controller, /MAX_FILE_UNITS_PER_REQUEST = 2/)
  assert.match(controller, /units\.slice\(startIndex, startIndex \+ MAX_FILE_UNITS_PER_REQUEST\)/)
  assert.match(controller, /initialFiles: supplied\?\.completedFiles/)
  assert.match(controller, /continuationRequired: true/)
  assert.match(runner, /completedFiles: Record<string, string> = \{ \.\.\.\(input\.initialFiles \|\| \{\}\) \}/)
  assert.match(route, /if \(response\.ok && result\.success === true && result\.continuationRequired === true/)
  assert.match(route, /validateGeneratedProject\(specification, files\)/)
  assert.match(route, /validateGeneratedSecurity\(files\)/)
})

test("continuations reuse one pending generation reservation and enforce ownership", () => {
  assert.match(route, /verifyPendingBuilderGeneration\(\{ generationId, ownerEmail, prompt \}\)/)
  assert.match(route, /if \(continuationState\)[\s\S]*else \{[\s\S]*reserveBuilderGeneration/)
  assert.match(governance, /owner_email = \$\{normalizedEmail\(input\.ownerEmail\)\}/)
  assert.match(governance, /status = 'pending'/)
  assert.match(governance, /prompt_hash = \$\{promptHash\}/)
  assert.match(continuation, /createHmac\("sha256", secret\(\)\)/)
  assert.match(continuation, /timingSafeEqual/)
})

test("client automatically continues with the same signed generation state", () => {
  assert.match(client, /MAX_GENERATION_CONTINUATIONS = 20/)
  assert.match(client, /continuationToken \? \{ continuationToken \}/)
  assert.match(client, /if \(!payload\.continuationRequired\) break/)
  assert.match(client, /ended before the complete project was validated/)
})
