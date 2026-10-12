import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

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
