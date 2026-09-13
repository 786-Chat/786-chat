import test from "node:test"
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"

const source = async (path) => readFile(new URL(`../../${path}`, import.meta.url), "utf8")

test("passed builds expose a stable 786.Chat preview hostname", async () => {
  const buildJobs = await source("lib/786-admin/build-jobs.ts")

  assert.match(buildJobs, /preview-\$\{compact\}\.786\.chat/)
  assert.match(buildJobs, /build\?\.status === "passed" && build\.deployment_url/)
  assert.match(buildJobs, /deployment_url: previewUrl/)
})

test("middleware reserves preview project hostnames before customer-domain routing", async () => {
  const middleware = await source("middleware.ts")

  assert.match(middleware, /preview-\(\[0-9a-f\]\{32\}\)\\\.786\\\.chat/)
  assert.match(middleware, /generated-preview-host\/\$\{previewId\}/)
  assert.match(middleware, /!pathname\.startsWith\("\/generated-preview-host\/"\)/)
})

test("generated preview proxy keeps Vercel bypass secret server-side", async () => {
  const proxy = await source("app/generated-preview-host/[projectId]/[[...path]]/route.ts")

  assert.match(proxy, /VERCEL_AUTOMATION_BYPASS_SECRET/)
  assert.match(proxy, /BUILD_RUNNER_SECRET/)
  assert.match(proxy, /x-vercel-protection-bypass/)
  assert.match(proxy, /b\.status = 'passed'/)
  assert.match(proxy, /X-786-Generated-Preview/)
})

test("generated preview strips only platform auth cookies and preserves app sessions", async () => {
  const proxy = await source("app/generated-preview-host/[projectId]/[[...path]]/route.ts")

  assert.match(proxy, /PLATFORM_COOKIE_NAMES = new Set\(\["auth_token", "auth-token"\]\)/)
  assert.match(proxy, /function generatedAppCookieHeader/)
  assert.match(proxy, /headers\.set\("cookie", generatedCookies\)/)
  assert.match(proxy, /connect\.sid/)
  assert.doesNotMatch(proxy, /headers\.delete\("cookie"\)\s*\n\s*headers\.set\("accept-encoding"/)
})

test("frame policy allows only 786.Chat surfaces to embed generated previews", async () => {
  const nextConfig = await source("next.config.mjs")

  assert.doesNotMatch(nextConfig, /X-Frame-Options/)
  assert.match(nextConfig, /frame-ancestors 'self' https:\/\/786\.chat https:\/\/\*\.786\.chat/)
})
