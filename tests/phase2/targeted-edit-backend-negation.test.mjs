import assert from "node:assert/strict"
import test from "node:test"

const { analyseProjectPrompt } = await import("../../lib/786-chat/specification.ts")

test("display-only database copy does not force backend generation when database work is explicitly deferred", () => {
  const specification = analyseProjectPrompt(`Change ONLY the existing Production page.

Do not redesign anything and do not change any other page.

Fix these two issues only:
1. Remove the duplicate Freezer Temperature field.
2. Make the Save Draft button actually work client-side.

Do not connect the database yet.

When Save Draft is clicked:
- validate the current form
- keep all entered values on screen
- save the draft temporarily in browser localStorage
- show this message:
  \`Draft saved on this device — permanent database storage will be added next.\`

Preserve every other field, page and design.`)

  assert.equal(specification.backendRequirements.includes("database"), false)
  assert.equal(specification.platforms.includes("database"), false)
  assert.equal(specification.platforms.includes("backend"), false)
})

test("a real Neon request in an existing-page edit still enables database generation", () => {
  const specification = analyseProjectPrompt("Change the existing Production page and connect Save Draft to the Neon database.")

  assert.equal(specification.backendRequirements.includes("database"), true)
  assert.equal(specification.platforms.includes("database"), true)
})
