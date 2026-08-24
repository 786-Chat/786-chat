import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), "utf8")

test("live customer hosts expose robots, sitemap, and customer canonical URLs", async () => {
  const route = await read("app/customer-hosts/[hostname]/[[...path]]/route.ts")

  assert.match(route, /seoPath === "robots\.txt"/)
  assert.match(route, /Sitemap: https:\/\/\$\{customerHostname\}\/sitemap\.xml/)
  assert.match(route, /seoPath === "sitemap\.xml"/)
  assert.match(route, /publicStaticRoutes\(files\)/)
  assert.match(route, /NON_INDEXABLE_SEGMENTS/)
  assert.match(route, /segment\.startsWith\("\["\)/)
  assert.match(route, /rel="canonical"/)
  assert.match(route, /canonicalUrl\(customerHostname, path\)/)
})

test("customer SEO discovery uses deployment files and only serves for live verified hostnames", async () => {
  const route = await read("app/customer-hosts/[hostname]/[[...path]]/route.ts")
  const publishing = await read("lib/786-admin/publishing.ts")

  assert.ok(
    route.indexOf("getLiveDeploymentByHostname(normalized)") < route.indexOf('seoPath === "robots.txt"'),
    "SEO discovery files must only be served after resolving a live customer deployment",
  )
  assert.match(route, /deployment\.files/)
  assert.match(publishing, /d\.status = 'active'/)
  assert.match(publishing, /d\.dns_status = 'verified'/)
  assert.match(publishing, /d\.ssl_status = 'active'/)
})
