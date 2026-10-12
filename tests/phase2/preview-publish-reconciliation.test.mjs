import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

const callback = readFileSync("app/api/786-admin/build-runner/callback/route.ts", "utf8")
const buildRoute = readFileSync("app/api/786-admin/projects/[id]/build/route.ts", "utf8")
const store = readFileSync("lib/786-admin/build-runner-store.ts", "utf8")
const publisher = readFileSync("lib/786-admin/github-project-publisher.ts", "utf8")
const reconciliation = readFileSync("lib/786-admin/preview-reconciliation.ts", "utf8")
const finalizer = readFileSync("lib/786-admin/imported-runtime-finalizer.ts", "utf8")
const workflow = readFileSync(".github/workflows/generated-project-build.yml", "utf8")
const previewHost = readFileSync("app/generated-preview-host/[projectId]/[[...path]]/route.ts", "utf8")

test("publisher checkpoints commit metadata before waiting for Vercel", () => {
  assert.match(callback, /recordRunnerPublishProgress/)
  assert.match(store, /github_commit_sha = \$\{input\.githubCommitSha\}/)
  const checkpointIndex = callback.indexOf("recordRunnerPublishProgress")
  const deployIndex = callback.indexOf("deployGeneratedProjectToVercel")
  assert.ok(checkpointIndex >= 0 && deployIndex >= 0 && checkpointIndex < deployIndex)
})

test("same build callback retries reuse checkpointed publish metadata", () => {
  assert.match(store, /export async function getRunnerPublishProgress/)
  assert.match(store, /WHERE id = \$\{buildId\}/)
  assert.match(callback, /getRunnerPublishProgress\(body\.buildId\)/)
  assert.match(callback, /const reusablePublish = currentPublish \?\? \(/)
  assert.match(callback, /skipped duplicate GitHub upload/)
})

test("identical source retries can reuse prior GitHub publish metadata", () => {
  assert.match(store, /getReusableRunnerPublish/)
  assert.match(store, /source_version = \$\{input\.sourceVersion\}/)
  assert.match(store, /AND status = 'passed'/)
  assert.match(store, /id <> \$\{input\.excludeBuildId\}/)
  assert.match(callback, /getReusableRunnerPublish/)
  assert.match(callback, /reusablePublish \?\? await publishGeneratedProjectToGitHub/)
})

test("GitHub publisher backs off and uploads large generated sources with bounded concurrency", () => {
  assert.match(publisher, /GITHUB_REQUEST_ATTEMPTS = 4/)
  assert.match(publisher, /isRetryableGitHubLimit/)
  assert.match(publisher, /secondary rate limit/)
  assert.match(publisher, /retry-after/)
  assert.match(publisher, /x-ratelimit-reset/)
  assert.match(publisher, /GITHUB_BLOB_CONCURRENCY = 6/)
  assert.match(publisher, /mapWithConcurrency/)
})

test("slow Vercel readiness is handed off before the runner transport timeout", () => {
  assert.match(callback, /PREVIEW_CALLBACK_DEPLOY_WAIT_MS = 180_000/)
  assert.match(callback, /Promise\.race/)
  assert.match(callback, /status: "running"/)
  assert.match(callback, /\{ status: 202 \}/)
  assert.match(callback, /normal build polling will reconcile the deployment/)
  assert.match(workflow, /--max-time 240/)
  assert.match(workflow, /--retry 1/)
})

test("build polling reconciles only a healthy READY Vercel preview", () => {
  assert.match(buildRoute, /findGeneratedPreviewState/)
  assert.match(buildRoute, /preview\?\.state === "READY"/)
  assert.match(buildRoute, /status: "passed"/)
  assert.match(buildRoute, /deploymentUrl: preview\.url/)
  assert.match(reconciliation, /readyState \|\| item\.state/)
  assert.match(reconciliation, /\.vercel\.app/)
  assert.match(reconciliation, /IMPORTED_RUNTIME_HEALTH_PATH = "\/__786-runtime-health"/)
  assert.match(reconciliation, /runtimeResponse\.status === 204/)
  assert.match(reconciliation, /runtimeResponse\.status >= 500/)
  assert.match(finalizer, /app\.get\("\/__786-runtime-health"/)
  assert.match(finalizer, /await loadImportedRuntime\(\)/)
})

test("build polling converts terminal Vercel preview states into a failed build", () => {
  assert.match(buildRoute, /TERMINAL_PREVIEW_FAILURE_STATES/)
  assert.match(buildRoute, /"ERROR", "CANCELED", "CANCELLED"/)
  assert.match(buildRoute, /status: "failed"/)
  assert.match(buildRoute, /Vercel preview deployment\/runtime finished with state/)
  assert.match(reconciliation, /state: string/)
})

test("preview publishing cannot remain running forever", () => {
  assert.match(buildRoute, /PREVIEW_PUBLISH_TIMEOUT_MS = 10 \* 60 \* 1000/)
  assert.match(buildRoute, /Preview publishing timed out before Vercel reached a healthy terminal state/)
  assert.match(buildRoute, /Date\.parse\(build\.updated_at\)/)
})

test("preview host self-heals a healthy READY publish after callback handoff", () => {
  assert.match(previewHost, /latestProjectBuild/)
  assert.match(previewHost, /latestPassedPreviewBuild/)
  assert.match(previewHost, /latest\.status === "running"/)
  assert.match(previewHost, /findGeneratedPreviewState/)
  assert.match(previewHost, /preview\?\.state === "READY"/)
  assert.match(previewHost, /completeRunnerBuild/)
  assert.match(previewHost, /deploymentUrl: preview\.url/)
  assert.match(previewHost, /return latestPassedPreviewBuild\(projectId\)/)
})

// Exercise the real publishing cleanup (without importing the whole Next.js app).
const source = readFileSync("lib/786-admin/pestcontrol-runtime-hardening.ts", "utf8")
const start = source.indexOf("function patchOwnedIotSafeUi(source: string): string {")
const end = source.indexOf("\nexport function hardenPestControlRuntime(", start)
assert.ok(start >= 0 && end > start, "The IoT safe-UI transformation must exist")
const functionSource = source.slice(start, end).replace(
  "function patchOwnedIotSafeUi(source: string): string {",
  "function patchOwnedIotSafeUi(source) {",
)
const patchOwnedIotSafeUi = new Function(
  "replaceIfPresent",
  functionSource + "\nreturn patchOwnedIotSafeUi;",
)((text, before, after) => text.replace(before, after))

test("Pest Control UI hardening does not remove connection-check handler between device removal and refresh", () => {
  const checkHandler = [
    "  const checkRealDeviceConnection = async () => {",
    '    return "real MQTT connection only";',
    "  };",
  ].join("\n")
  const input = [
    "  const [savingDevice, setSavingDevice] = useState(false);",
    "  const removeDevice = async (id: string, name: string) => {",
    '    throw new Error("outdated removal handler");',
    "  };",
    "",
    checkHandler,
    "",
    "  const refreshDevice = async (id: string) => {",
    "    return id;",
    "  };",
  ].join("\n")

  const result = patchOwnedIotSafeUi(input)
  assert.ok(result.includes(checkHandler), "must preserve the real connection-check handler exactly")
  assert.ok(result.includes("  const refreshDevice = async"), "must preserve refresh")
  assert.ok(!result.includes("outdated removal handler"), "must repair only the stale removeDevice body")
  assert.ok(result.includes("setRemovingDeviceId"), "must still apply the removal safety patch")
  assert.equal(patchOwnedIotSafeUi(result), result, "cleanup must be idempotent")
})

test("Pest Control UI hardening does not discard future handlers inserted before refreshDevice", () => {
  const futureHandler = [
    "  const checkMouseBatteryReport = async () => {",
    '    return "report";',
    "  };",
  ].join("\n")
  const sourceWithHandlers = [
    "  const removeDevice = async (id: string, name: string) => {",
    "    return true;",
    "  };",
    "",
    futureHandler,
    "",
    "  const refreshDevice = async (id: string) => {};",
  ].join("\n")
  assert.ok(patchOwnedIotSafeUi(sourceWithHandlers).includes(futureHandler))
})
