import assert from "node:assert/strict"
import test from "node:test"

const { analyseProjectPrompt } = await import("../../lib/786-chat/specification.ts")

test("Raja process-flow copy mentioning a goods-received form does not require a new form control", () => {
  const specification = analyseProjectPrompt(`Update ONLY my EXISTING Raja Catering Process Flow diagram.

Do NOT create a new project.
Do NOT redesign anything.
Do NOT change the sidebar.
Do NOT change database, APIs, forms, Delivery, Stock, Production or Ready Stock logic.

Update only the existing Kulfi Flow Diagram.

2. Delivery → Stock
When raw ingredients arrive, staff complete the Delivery / Goods Received form and the received quantity is added to Stock.

3. Stock → Production
Production uses the required ingredients and quantities from Stock for the Kulfi batch.

9. Production Complete → Ready Stock
When the manufacturing batch is completed, record the finished Kulfi quantity in Ready Stock.`)

  assert.equal(specification.requiredComponents.includes("form"), false)
  assert.equal(specification.systemBlueprint, null)
})

test("an explicit targeted request to add or update a form still requires the form control", () => {
  const addForm = analyseProjectPrompt("Update the existing Contact page and add a contact form with name, email and message fields.")
  const editForm = analyseProjectPrompt("Fix the existing booking form validation and keep the rest of the page unchanged.")

  assert.equal(addForm.requiredComponents.includes("form"), true)
  assert.equal(editForm.requiredComponents.includes("form"), true)
})
