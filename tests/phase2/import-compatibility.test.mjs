import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const validation = await readFile(
  new URL("../../lib/786-chat/validation.ts", import.meta.url),
  "utf8",
)
const route = await readFile(
  new URL("../../app/api/786-chat/generate/route.ts", import.meta.url),
  "utf8",
)
const repair = await readFile(
  new URL("../../lib/786-chat/build-repair.ts", import.meta.url),
  "utf8",
)

test("known incompatible Lucide names are normalized before persistence", () => {
  assert.match(validation, /normalizeGeneratedImports/)
  assert.match(validation, /Tooth:\s*"Smile"/)
  assert.match(validation, /Ambulance:\s*"HeartPulse"/)
  assert.match(route, /normalizeGeneratedImports/)
  assert.match(route, /prompt,\s*files/)
})

test("build repair deterministically fixes Lucide export errors", () => {
  assert.match(repair, /deterministicLucideImportRepair/)
  assert.match(repair, /lucide-react/)
  assert.match(repair, /deterministic-lucide-import-compatibility/)
})

test("generation and repair normalize client-component hook boundaries", () => {
  assert.match(validation, /normalizeGeneratedClientBoundaries/)
  assert.match(route, /normalizeGeneratedClientBoundaries/)
  assert.match(repair, /deterministicClientBoundaryRepair/)
  assert.match(repair, /deterministic-client-boundary/)
})

test("generation and repair reject client components that export metadata", () => {
  assert.match(validation, /normalizeGeneratedMetadataBoundaries/)
  assert.match(validation, /Client component cannot export Next\.js metadata/)
  assert.match(route, /normalizeGeneratedMetadataBoundaries/)
  assert.match(route, /must remain Server Components/)
  assert.match(repair, /deterministicClientMetadataRepair/)
  assert.match(repair, /deterministic-client-metadata-boundary/)
})

test("build repair normalizes Neon result indexing errors", () => {
  assert.match(repair, /deterministicNeonResultRepair/)
  assert.match(repair, /deterministic-neon-result-index/)
})

test("AI repair has a realistic but callback-bounded timeout", () => {
  assert.match(repair, /REPAIR_PROVIDER_TIMEOUT_MS = 65_000/)
})
