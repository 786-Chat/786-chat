import assert from "node:assert/strict"
import test from "node:test"

const { selectSystemBlueprint } = await import("../../lib/786-chat/system-blueprints.ts")

test("targeted Raja manufacturing navigation edits do not trigger the full manufacturing blueprint", () => {
  const selected = selectSystemBlueprint(`Update Raja Catering sidebar navigation.
Keep Production, Ready Stock, Delivery and Stock.
Move the Kulfi manufacturing flow diagram into Documents.
Do not rebuild the application.`)

  assert.equal(selected, null)
})

test("an explicit manufacturing system request still selects the manufacturing blueprint", () => {
  const selected = selectSystemBlueprint(
    "Create a manufacturing system with production planning, traceability, quality release and recall controls.",
  )

  assert.equal(selected?.id, "manufacturing")
})

test("a new food production application request still selects the manufacturing blueprint", () => {
  const selected = selectSystemBlueprint(
    "Build a food production web application for a factory with batches and quality controls.",
  )

  assert.equal(selected?.id, "manufacturing")
})
