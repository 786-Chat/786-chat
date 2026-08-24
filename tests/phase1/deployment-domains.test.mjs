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

test("www.786.chat permanently redirects to the canonical apex before other routing", async () => {
  const middleware = await read("middleware.ts")
  assert.match(middleware, /if \(hostname === "www\.786\.chat"\)/)
  assert.match(middleware, /canonical\.protocol = "https:"/)
  assert.match(middleware, /canonical\.hostname = "786\.chat"/)
  assert.match(middleware, /NextResponse\.redirect\(canonical, 308\)/)
  assert.ok(
    middleware.indexOf('if (hostname === "www.786.chat")') < middleware.indexOf("const isPlatformHost"),
    "canonical www redirect must run before platform/customer host routing",
  )
})

test("deploy UI exposes path, subdomain and customer-domain choices", async () => {
  const source = await read("components/786-admin/admin-chat-publish-controller.tsx")
  assert.match(source, /786\.Chat project link/)
  assert.match(source, /Professional 786\.Chat subdomain/)
  assert.match(source, /Customer-owned domain/)
  assert.match(source, /SSL\/HTTPS is free/)
})

test("adding another production address reuses the current release instead of redeploying", async () => {
  const source = await read("app/api/786-chat/projects/[id]/deploy/route.ts")
  assert.match(source, /const currentDeployment =\s*\n\s*action === "deploy" \? await getProjectDeployment/)
  assert.match(source, /action === "deploy" && !currentDeployment/)
  assert.match(source, /const deployment =\s*\n\s*currentDeployment \|\|/)
  assert.match(source, /action: "redeploy"/)
})

test("custom host requests stay on the customer hostname and proxy the generated runtime", async () => {
  const middleware = await read("middleware.ts")
  const route = await read("app/customer-hosts/[hostname]/[[...path]]/route.ts")
  const publishing = await read("lib/786-admin/publishing.ts")

  assert.match(middleware, /customer-hosts/)
  assert.doesNotMatch(middleware, /_sites/)
  assert.match(middleware, /if \(!isPlatformHost && !pathname\.startsWith\("\/customer-hosts\/"\)\)/)
  assert.ok(
    middleware.indexOf("if (!isPlatformHost") < middleware.indexOf("const isAdminApi"),
    "customer host rewrite must run before platform API/auth routing",
  )

  assert.match(route, /getLiveDeploymentByHostname/)
  assert.match(route, /deployment\.runtime_url/)
  assert.match(route, /fetch\(runtime, init\)/)
  assert.match(route, /redirect: "manual"/)
  assert.doesNotMatch(route, /NextResponse\.redirect/)
  assert.match(route, /headers\.set\("location", customer\.toString\(\)\)/)
  assert.match(route, /export const POST = handle/)
  assert.match(route, /export const OPTIONS = handle/)
  assert.match(route, /path\.join\("\/"\)/)
  assert.match(publishing, /ssl_status = 'active'/)
})
