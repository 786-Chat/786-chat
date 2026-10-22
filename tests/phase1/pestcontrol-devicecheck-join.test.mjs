import test from "node:test"
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"

test("HP2 event-history rewrite is scoped to the event query, never Device Check", async () => {
  const source = await readFile("lib/786-admin/pestcontrol-runtime-hardening.ts", "utf8")
  const start = source.indexOf("// Scope the history rewrite to the owned_iot_events query only.")
  assert.ok(start > -1, "owned event join rewrite must be explicitly scoped")
  const scoped = source.slice(start, start + 1100)
  const parts = /next = next\.replace\(\s*\[([\s\S]*?)\]\.join\("\\n"\),\s*\[([\s\S]*?)\]\.join\("\\n"\),\s*\)/.exec(scoped)
  assert.ok(parts, "read exact scoped replacement from production hardening source")
  const entries = (raw) => [...raw.matchAll(/^\s*(".*?")\s*,?\s*$/gm)].map((match) => JSON.parse(match[1]))
  const original = entries(parts[1]).join("\n")
  const replacement = entries(parts[2]).join("\n")
  assert.equal(entries(parts[1]).length, 3)
  assert.equal(entries(parts[2]).length, 3)
  assert.match(original, /FROM owned_iot_events e/)
  assert.match(replacement, /FROM owned_iot_events e/)
  assert.match(original, /branches b ON b\.id::text = d\.branch_id::text/)
  assert.match(replacement, /branches b ON b\.id::text = e\.branch_id::text/)
  const deviceCheck = [
    "FROM owned_iot_device_checks c",
    "LEFT JOIN owned_iot_devices d ON d.device_id = c.assigned_device_id",
    "LEFT JOIN branches b ON b.id::text = d.branch_id::text",
  ].join("\n")
  const eventHistory = original + "\nWHERE e.event_type = 'trap_triggered'"
  assert.equal(deviceCheck.replace(original, replacement), deviceCheck, "Device Check join must not change")
  assert.ok(eventHistory.replace(original, replacement).includes("b.id::text = e.branch_id::text"))
  assert.equal(eventHistory.replace(replacement, original).replace(original, replacement), eventHistory.replace(original, replacement), "rewrite must be idempotent")
})

test("authoritative saved Device Check query joins on assigned device, never events", async () => {
  const source = await readFile("generated-projects/22c299f8-bf65-410f-9643-92a9776dbfca/server/routes.ts", "utf8")
  const start = source.indexOf('app.get("/api/iot/device-check"')
  assert.ok(start > -1, "Device Check route must exist")
  const query = source.slice(start, source.indexOf('app.post("/api/iot/device-check/:id', start))
  assert.match(query, /LEFT JOIN owned_iot_devices d ON d\.device_id = c\.assigned_device_id/)
  assert.match(query, /LEFT JOIN branches b ON b\.id::text = d\.branch_id::text/)
  assert.doesNotMatch(query, /LEFT JOIN branches b ON b\.id::text = e\.branch_id::text/)
})
