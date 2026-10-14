import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

const projectId = "22c299f8-bf65-410f-9643-92a9776dbfca"
const source = readFileSync("lib/786-admin/pestcontrol-device-check-hardening.ts", "utf8")

const signature = "export function hardenPestControlDeviceCheck(projectId: string, files: Record<string, string>): Record<string, string> {"
const index = source.indexOf(signature)
assert.ok(index > 0, "Expected the Pest Control Device Check hardening entrypoint")

// Evaluate only the exported orchestration function, using identity transforms
// for the independent route/dashboard patchers. This tests the preservation
// behavior without importing TypeScript or invoking server/database code.
const body = source.slice(index).replace(signature, "function hardenPestControlDeviceCheck(projectId, files) {")
const harden = new Function(
  "PEST_CONTROL_PROJECT_ID",
  "DEVICE_CHECK_PANEL_SOURCE",
  "HP2_BRIDGE_SOURCE",
  "patchRoutes",
  "patchAdminDashboard",
  body + "\nreturn hardenPestControlDeviceCheck;",
)(projectId, "LEGACY DEVICE CHECK PANEL", "BRIDGE", (x) => x, (x) => x)

test("Pest Control publishing preserves the saved Device Check Wi-Fi UI", () => {
  const newerPanel = 'export default function DeviceCheckPanel() { return "Check / record HP2 Wi-Fi signal"; }'
  const output = harden(projectId, {
    "client/src/components/DeviceCheckPanel.tsx": newerPanel,
    "server/routes.ts": "existing routes",
  })
  assert.equal(output["client/src/components/DeviceCheckPanel.tsx"], newerPanel)
  assert.equal(output["server/routes.ts"], "existing routes")
})

test("Pest Control publishing only injects legacy Device Check when missing or invalid", () => {
  assert.equal(
    harden(projectId, {})["client/src/components/DeviceCheckPanel.tsx"],
    "LEGACY DEVICE CHECK PANEL",
  )
  assert.equal(
    harden(projectId, { "client/src/components/DeviceCheckPanel.tsx": "broken import" })
      ["client/src/components/DeviceCheckPanel.tsx"],
    "LEGACY DEVICE CHECK PANEL",
  )
})

test("Pest Control publishing leaves unrelated projects untouched", () => {
  const initial = { "client/src/components/DeviceCheckPanel.tsx": "other project panel" }
  assert.deepEqual(harden("not-pest-control", initial), initial)
})
