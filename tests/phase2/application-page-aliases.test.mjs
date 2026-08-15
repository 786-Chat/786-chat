import assert from "node:assert/strict"
import test from "node:test"

const { analyseProjectPrompt } = await import("../../lib/786-chat/specification.ts")

test("Saffron-style prose page request plans customers and reservations routes", () => {
  const specification = analyseProjectPrompt(`Create a production-ready full-stack restaurant CRM and reservation application called Saffron Manager.
Create Home, Customers, Reservations and Contact pages.`)
  assert.ok(specification.routes.includes("/"))
  assert.ok(specification.routes.includes("/customers"))
  assert.ok(specification.routes.includes("/reservations"))
  assert.ok(specification.routes.includes("/contact"))
})

test("common full-stack application page nouns become explicit routes", () => {
  const specification = analyseProjectPrompt("Create Orders, Staff, Jobs, Quotations, Invoices, Inventory and Reports pages for a business application.")
  for (const route of ["/orders", "/staff", "/jobs", "/quotations", "/invoices", "/inventory", "/reports"]) {
    assert.ok(specification.routes.includes(route), `missing ${route}`)
  }
})
