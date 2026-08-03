import assert from "node:assert/strict"
import test from "node:test"
import { readFile } from "node:fs/promises"

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), "utf8")

test("public launch routes include docs, examples, legal, security and real support", async () => {
  const routes = ["docs", "examples", "privacy", "terms", "security", "support"]
  for (const route of routes) {
    const page = await read(`app/${route}/page.tsx`)
    assert.match(page, /metadata|LegalDocument/)
  }
  const [navbar, footer] = await Promise.all([read("components/navbar.tsx"), read("components/footer.tsx")])
  for (const href of ["/docs", "/examples", "/support"]) assert.ok(navbar.includes(href) || footer.includes(href))
  assert.doesNotMatch(footer, /event\.preventDefault\(\)/)
})

test("support requests are persisted, rate limited and available to admins", async () => {
  const [publicApi, adminApi, migration, form] = await Promise.all([
    read("app/api/support/route.ts"),
    read("app/api/admin/support/route.ts"),
    read("lib/786-admin/migrations/011-support-tickets.sql"),
    read("components/launch/support-form.tsx"),
  ])
  assert.match(publicApi, /consumeSecurityRateLimit/)
  assert.match(publicApi, /builder_support_tickets/)
  assert.match(publicApi, /recordOperationalEvent/)
  assert.match(adminApi, /isAdminUser/)
  assert.match(migration, /UNIQUE/)
  assert.match(form, /\/api\/support/)
  assert.doesNotMatch(form, /setTimeout/)
})

test("search engines receive an explicit sitemap and safe robots policy", async () => {
  const [sitemap, robots] = await Promise.all([read("app/sitemap.ts"), read("app/robots.ts")])
  for (const route of ["/examples", "/docs", "/privacy", "/terms", "/support"]) assert.match(sitemap, new RegExp(route))
  assert.doesNotMatch(sitemap, /\/pricing/)
  assert.match(robots, /disallow: \["\/api\/", "\/admin\/", "\/dashboard\/", "\/786-admin\/"\]/)
})

test("the old fake contact and newsletter interactions are removed", async () => {
  const [contact, footer, home] = await Promise.all([read("app/contact/page.tsx"), read("components/footer.tsx"), read("app/page.tsx")])
  assert.match(contact, /redirect\("\/support"\)/)
  assert.doesNotMatch(contact, /XXXXXXXXX|setTimeout/)
  assert.doesNotMatch(footer, /Newsletter email|Subscribe/)
  assert.doesNotMatch(home, /href="\/pricing"/)
  assert.match(home, /href="\/support"/)
})
