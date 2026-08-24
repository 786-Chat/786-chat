import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), "utf8")

test("deployment schema stores truthful DNS and SSL state separately", async () => {
  const schema = await read("lib/786-admin/schema.sql")
  assert.match(schema, /CREATE TABLE IF NOT EXISTS admin_project_domains/)
  assert.match(schema, /dns_status\s+TEXT NOT NULL/)
  assert.match(schema, /ssl_status\s+TEXT NOT NULL/)
  assert.match(schema, /'provisioning'/)
  assert.doesNotMatch(schema, /ssl_status[^;]+DEFAULT 'active'/s)
})

test("custom-domain integration uses provider records and never hard-codes a DNS target", async () => {
  const source = await read("lib/786-admin/vercel-domains.ts")
  assert.match(source, /recommendedCNAME/)
  assert.match(source, /recommendedIPv4/)
  assert.match(source, /verification/)
  assert.doesNotMatch(source, /cname\.vercel-dns\.com/i)
})

test("SSL becomes active only after DNS, ownership and HTTPS checks", async () => {
  const provider = await read("lib/786-admin/vercel-domains.ts")
  const domains = await read("lib/786-admin/domains.ts")
  assert.match(provider, /httpsIsReady/)
  assert.match(provider, /configured && verified \? await httpsIsReady/)
  assert.match(domains, /state\.configured && state\.verified && state\.sslReady/)
})

test("786.Chat-owned subdomains use wildcard HTTPS instead of per-subdomain DNS provisioning", async () => {
  const provider = await read("lib/786-admin/vercel-domains.ts")
  assert.match(provider, /PLATFORM_DOMAIN = "786\.chat"/)
  assert.match(provider, /isPlatformSubdomain/)
  assert.match(provider, /platformSubdomainState/)
  assert.match(provider, /providerDomainId: `\*\.\$\{PLATFORM_DOMAIN\}`/)
  assert.match(provider, /if \(isPlatformSubdomain\(hostname\)\) return platformSubdomainState\(hostname\)/)
  assert.match(provider, /if \(isPlatformSubdomain\(hostname\)\) return\n\n  const \{ project \} = configuration\(\)/)
})

test("deploy UI exposes path, subdomain and customer-domain choices", async () => {
  const source = await read("components/786-admin/admin-chat-publish-controller.tsx")
  assert.match(source, /786\.Chat project link/)
  assert.match(source, /Professional 786\.Chat subdomain/)
  assert.match(source, /Customer-owned domain/)
  assert.match(source, /SSL\/HTTPS is free/)
})

test("custom host requests use the canonical hostname deployment resolver", async () => {
  const middleware = await read("middleware.ts")
  const route = await read("app/_sites/[hostname]/[[...path]]/route.ts")
  const publishing = await read("lib/786-admin/publishing.ts")
  assert.match(middleware, /_sites/)
  assert.match(route, /getLiveDeploymentByHostname/)
  assert.match(publishing, /ssl_status = 'active'/)
})
