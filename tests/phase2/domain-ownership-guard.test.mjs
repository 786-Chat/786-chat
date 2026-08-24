import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), "utf8")

test("hostnames cannot be claimed by a second project", async () => {
  const domains = await read("lib/786-admin/domains.ts")
  assert.match(domains, /async function assertHostnameAvailable/)
  assert.match(domains, /LOWER\(hostname\) = \$\{hostname\.toLowerCase\(\)\.trim\(\)\}/)
  assert.match(domains, /status != 'removed'/)
  assert.match(domains, /project_id != \$\{projectId\}/)
  assert.match(domains, /This domain is already connected to another project\./)
  assert.ok(
    domains.indexOf("await assertHostnameAvailable(hostname, input.deployment.project_id)") <
      domains.indexOf("providerState = await addDomainToVercel(hostname)"),
    "ownership must be checked before provider provisioning",
  )
})
