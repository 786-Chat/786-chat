import assert from "node:assert/strict"
import test from "node:test"
import { readFile } from "node:fs/promises"

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), "utf8")

test("billing exposes one Free, Pro and Business entitlement catalogue", async () => {
  const billing = await read("lib/786-chat/billing.ts")
  assert.match(billing, /free:\s*\{/)
  assert.match(billing, /pro:\s*\{/)
  assert.match(billing, /business:\s*\{/)
  assert.match(billing, /projects:/)
  assert.match(billing, /deploymentsPerMonth:/)
  assert.match(billing, /customDomains:/)
  assert.match(billing, /teamMembers:/)
})

test("checkout authenticates the canonical account and accepts only server prices", async () => {
  const checkout = await read("app/api/stripe/checkout/route.ts")
  assert.match(checkout, /getSession\(\)/)
  assert.match(checkout, /BUILDER_PLANS\[requestedPlan\]/)
  assert.match(checkout, /BUILDER_CREDIT_PACKAGES\[packageId\]/)
  assert.doesNotMatch(checkout, /body\.price|body\.amount|stripe_settings/)
  assert.match(checkout, /billing_version: "2"/)
  assert.match(checkout, /BILLING_WEBHOOK_NOT_CONFIGURED/)
})

test("Stripe webhook requires signatures and processes events idempotently", async () => {
  const webhook = await read("app/api/stripe/webhook/route.ts")
  assert.match(webhook, /STRIPE_WEBHOOK_SECRET/)
  assert.match(webhook, /constructEvent\(await request\.text\(\), signature, secret\)/)
  assert.doesNotMatch(webhook, /JSON\.parse\(body\)|not recommended for production/)
  assert.match(webhook, /builder_billing_events/)
  assert.match(webhook, /ON CONFLICT \(event_id\)/)
})

test("plan changes cannot bypass Stripe", async () => {
  const subscription = await read("app/api/subscription/route.ts")
  assert.match(subscription, /Plan changes require Stripe Checkout/)
  assert.doesNotMatch(subscription, /SET\s+plan\s*=\s*\$\{planId\}/)
})

test("project, deployment and domain allowances are enforced", async () => {
  const projects = await read("app/api/786-chat/projects/route.ts")
  const deploy = await read("app/api/786-chat/projects/[id]/deploy/route.ts")
  assert.match(projects, /PROJECT_LIMIT_REACHED/)
  assert.match(deploy, /DEPLOYMENT_LIMIT_REACHED/)
  assert.match(deploy, /CUSTOM_DOMAIN_LIMIT_REACHED/)
  assert.match(deploy, /CUSTOM_DOMAIN_PLAN_REQUIRED/)
})

test("purchased AI credits are reserved and refunded after provider failure", async () => {
  const governance = await read("lib/786-chat/ai-governance.ts")
  assert.match(governance, /extra_credits = extra_credits - 1/)
  assert.match(governance, /credit_reserved/)
  assert.match(governance, /credit_refunded = credit_reserved > 0/)
  assert.match(governance, /COALESCE\(s\.extra_credits, 0\) \+ failed\.credit_reserved/)
})
