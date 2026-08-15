import assert from "node:assert/strict"
import test from "node:test"

const { analyseProjectPrompt } = await import("../../lib/786-chat/specification.ts")

test("a Contact page alone does not force a form requirement", () => {
  const specification = analyseProjectPrompt(`Create a production-ready full-stack restaurant CRM and reservation application called Saffron Manager Test.

Create these pages:
- Home
- Customers
- Reservations
- Contact

Create secure server-side authentication and tenant isolation.`)

  assert.ok(specification.routes.includes("/contact"))
  assert.equal(specification.requiredComponents.includes("form"), false)
})

test("an explicit contact form still requires a form", () => {
  const specification = analyseProjectPrompt("Create a Contact page with a working contact form.")
  assert.ok(specification.requiredComponents.includes("form"))
})

test("login and register requests still require forms", () => {
  const login = analyseProjectPrompt("Create a Login page with secure authentication.")
  const register = analyseProjectPrompt("Create a Register page for new users.")
  assert.ok(login.requiredComponents.includes("form"))
  assert.ok(register.requiredComponents.includes("form"))
})
