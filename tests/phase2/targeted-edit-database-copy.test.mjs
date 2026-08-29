import assert from "node:assert/strict"
import test from "node:test"

const { analyseProjectPrompt } = await import("../../lib/786-chat/specification.ts")

test("existing-project template copy text does not force a new database backend", () => {
  const specification = analyseProjectPrompt(`Update my EXISTING Raja Catering project only.

Do NOT start over. Do NOT delete or reset any Raja Catering data.

First create the foundation for a Super Admin Dashboard.

Raja Catering must remain an independent live business exactly as it is now.

Create a separate clean template identity called Super Business Mujeeb.

The template should represent only the current app structure, pages, forms, mobile launcher, workflow and database schema.

It must contain NO live customer data, uploaded documents, users, passwords, production records, stock, checks, SFBB files or business address.

Make this foundation only. Do not yet change customer login or Documents.`)

  assert.equal(specification.systemBlueprint, null)
  assert.equal(specification.backendRequirements.includes("database"), false)
  assert.equal(specification.platforms.includes("database"), false)
})

test("explicit database work in an existing project still requires database capability", () => {
  const specification = analyseProjectPrompt(`Update my EXISTING project only.
Create a separate Neon database for each new business and provision the same schema.`)

  assert.equal(specification.backendRequirements.includes("database"), true)
  assert.equal(specification.platforms.includes("database"), true)
})
