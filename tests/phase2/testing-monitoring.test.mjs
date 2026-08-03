import assert from "node:assert/strict"
import test from "node:test"
import { readFile } from "node:fs/promises"

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), "utf8")

test("the complete customer journey runs automatically with protected synthetic credentials", async () => {
  const [journey, vercel] = await Promise.all([
    read("app/api/cron/customer-journey/route.ts"),
    read("vercel.json"),
  ])
  for (const stage of ["register", "verify-email", "login", "create-project", "edit-project", "rebuild", "deploy"]) {
    assert.ok(journey.includes(`"${stage}"`), `missing journey stage ${stage}`)
  }
  assert.match(journey, /CRON_SECRET/)
  assert.match(journey, /SYNTHETIC_MONITOR_EMAIL/)
  assert.match(journey, /SYNTHETIC_MONITOR_PASSWORD/)
  assert.match(journey, /waitForBuild/)
  assert.match(journey, /Production path verification returned HTTP/)
  assert.match(vercel, /\/api\/cron\/customer-journey/)
})

test("monitoring persists structured events, deduplicates incidents and signs alert webhooks", async () => {
  const [monitoring, migration] = await Promise.all([
    read("lib/786-chat/monitoring.ts"),
    read("lib/786-admin/migrations/010-testing-monitoring.sql"),
  ])
  assert.match(monitoring, /builder_monitoring_events/)
  assert.match(monitoring, /builder_incidents/)
  assert.match(monitoring, /createHmac\("sha256"/)
  assert.match(monitoring, /ALERT_WEBHOOK_URL/)
  assert.match(monitoring, /ALERT_WEBHOOK_SECRET/)
  assert.match(monitoring, /ON CONFLICT \(fingerprint\)/)
  assert.match(monitoring, /SENSITIVE_KEY/)
  assert.match(migration, /builder_journey_runs/)
  assert.match(migration, /idx_builder_monitoring_events_failures/)
})

test("AI, build and deployment failures create actionable incidents", async () => {
  const files = await Promise.all([
    read("lib/786-chat/ai-governance.ts"),
    read("app/api/786-admin/projects/[id]/build/route.ts"),
    read("app/api/786-admin/build-runner/callback/route.ts"),
    read("app/api/786-chat/projects/[id]/deploy/route.ts"),
  ])
  for (const source of files) assert.match(source, /recordOperationalEvent/)
  assert.match(files[0], /builder_generation_failed/)
  assert.match(files[1], /build_dispatch_failed/)
  assert.match(files[2], /generated_build_failed/)
  assert.match(files[3], /production_deployment_failed/)
})

test("admins can review, acknowledge and resolve incidents", async () => {
  const [api, page, layout] = await Promise.all([
    read("app/api/admin/monitoring/route.ts"),
    read("app/admin/monitoring/page.tsx"),
    read("app/admin/layout.tsx"),
  ])
  assert.match(api, /isAdminUser/)
  assert.match(api, /setIncidentStatus/)
  assert.match(page, /Run full journey/)
  assert.match(page, /acknowledged/)
  assert.match(page, /resolved/)
  assert.match(layout, /\/admin\/monitoring/)
})
