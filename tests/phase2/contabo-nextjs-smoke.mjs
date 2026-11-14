/**
 * CI-only boot smoke test against disposable local PostgreSQL 17.
 * Runs the compiled Next.js server and verifies live/ready behavior without
 * revealing credentials or contacting production services.
 */
import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { setTimeout as sleep } from "node:timers/promises"

const connectionString = process.env.DATABASE_URL
if (!connectionString) throw new Error("CI smoke test requires DATABASE_URL")
const db = new URL(connectionString)
assert.equal(db.pathname, "/chat786_staging")
assert.ok(["localhost", "127.0.0.1"].includes(db.hostname), "Smoke tests cannot contact remote databases")
assert.equal(process.env.CONTABO_STAGING_ONLY, "1")
assert.equal(process.env.DATABASE_PROVIDER, "postgres")

const port = 31786
const origin = `http://127.0.0.1:${port}`
const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-H", "127.0.0.1", "-p", String(port)], {
  stdio: ["ignore", "pipe", "pipe"],
  env: {
    ...process.env,
    NODE_ENV: "production",
    PORT: String(port),
    HOSTNAME: "127.0.0.1",
    CONTABO_GENERATED_DEPLOYMENTS_READY: "0",
  },
})
// Consume output so the child cannot block on a full pipe, but do not log secrets.
child.stdout.resume()
child.stderr.resume()

async function get(path) {
  return fetch(origin + path, {
    signal: AbortSignal.timeout(2500),
    headers: { Accept: "application/json" },
  })
}

try {
  let booted = false
  for (let i = 0; i < 50; i++) {
    if (child.exitCode !== null) throw new Error("Next.js exited before becoming healthy")
    try {
      const response = await get("/api/health/live")
      if (response.ok && (await response.json()).status === "alive") {
        booted = true
        break
      }
    } catch { /* not listening yet */ }
    await sleep(400)
  }
  assert.ok(booted, "Next.js did not start within startup window")

  const live = await get("/api/health/live")
  assert.equal(live.status, 200)
  assert.equal((await live.json()).service, "786.chat")

  const ready = await get("/api/health/ready")
  // Database is working, but generated-app deployment isn't proven ready yet.
  assert.equal(ready.status, 503, "Staging readiness must fail closed until generated hosting verified")
  const body = await ready.json()
  assert.equal(body.checks.database, "ok", "Staging must connect to local PostgreSQL")
  assert.equal(body.checks.hosting, "contabo-staging")
  assert.equal(body.checks.generatedDeployments, "not_verified")
  assert.equal(body.checks.vercelToken, "missing")
  console.log("PASS: Next.js starts, local PostgreSQL is healthy, hosting readiness fails closed")
} catch (err) {
  // Deliberately do not log raw server output: build/runtime logs can contain secrets.
  console.error("Staging smoke test failed:", err instanceof Error ? err.message : String(err))
  throw err
} finally {
  child.kill("SIGTERM")
  await sleep(400)
  if (child.exitCode === null) child.kill("SIGKILL")
}
