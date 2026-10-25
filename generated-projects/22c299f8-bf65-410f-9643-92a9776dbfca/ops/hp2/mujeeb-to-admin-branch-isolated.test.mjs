import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createContext, runInContext } from "node:vm";
import { randomUUID, timingSafeEqual } from "node:crypto";
import ts from "typescript";
import { createMujeebEventRelay } from "./mujeeb-event-relay.mjs";

/**
 * DRY RUN: actual gateway/Admin/Branch handler source is transpiled and called
 * against an IN-MEMORY fake DB and locally intercepted Mujeeb relay request.
 * No external HTTP, no Neon, no production alarm, no customer data, no MQTT.
 */
const BASE = "https://mock-alarm-gateway.invalid";
const BRANCH_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const BRANCH_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const FS_ID = "FS-MOUSE-000003";
const OTHER_ID = "FS-MOUSE-000004";
const TOKEN = "test-gateway-token-not-a-real-secret";
const INGRESS = "test-mujeeb-ingress-separate-secret";
const NATIVE_ID = "ISOLATED-SOURCE-FOR-MOUSE-11";

const source = await readFile(new URL("../../server/routes.ts", import.meta.url), "utf8");
function section(from, to) {
  const start = source.indexOf(from);
  const end = source.indexOf(to, start + from.length);
  assert.ok(start >= 0 && end > start, "Expected unchanged website handler: " + from);
  return source.slice(start, end);
}
const sections = [
  section('app.post("/api/iot/gateway/events"', '// Auth middleware (this sets up sessions first)'),
  section('const ownedIotDevicesForAdmin =', 'const loadIotAlarmHistory ='),
  section('app.get("/api/iot/alarms"', 'const ownedIotDevicesForBranch ='),
  section('const ownedIotDevicesForBranch =', 'app.get("/api/branch/iot-alarm-history"'),
  section('app.get("/api/branch/iot-alarms"', 'app.post("/api/branch/iot-devices/:id/clear-alarm"'),
];

test("real isolated gateway handlers route Mujeeb catch to Admin and assigned Branch, never other branch", async () => {
  const timestamp = new Date().toISOString();
  const devices = [
    { id: "mock-row-11", device_id: FS_ID, branch_id: BRANCH_A, friendly_name: "Mouse #11", installation_location: "Kitchen", hardware_model: "BMAX W003", firmware_version: "unverified", lifecycle_state: "assigned", is_online: false, battery_pct: null, rssi: null, last_seen_at: null, last_alarm_at: null, last_event_id: null, manually_off_at: null },
    { id: "mock-row-other", device_id: OTHER_ID, branch_id: BRANCH_B, friendly_name: "Other branch device", installation_location: "Back room", hardware_model: "BMAX W003", firmware_version: "unverified", lifecycle_state: "assigned", is_online: false, battery_pct: null, rssi: null, last_seen_at: null, last_alarm_at: null, last_event_id: null, manually_off_at: null },
  ];
  const events = new Map();
  const sql = (strings, ...values) => ({
    text: strings.reduce((v, part, i) => v + part + (i < values.length ? "?" : ""), ""),
    values,
  });
  const queries = [];
  const db = { execute: async (query) => {
    queries.push(query.text);
    const q = query.text.replace(/\s+/g, " ").trim();
    if (q.includes("FROM owned_iot_events") && q.includes("WHERE event_id ="))
      return { rows: events.has(query.values[0]) ? [{ event_id: query.values[0] }] : [] };
    if (q.includes("FROM owned_iot_devices") && q.includes("WHERE device_id ="))
      return { rows: devices.filter(row => row.device_id === query.values[0]) };
    if (q.startsWith("UPDATE owned_iot_devices")) {
      const eventId = query.values[0];
      const row = devices.find(d => d.device_id === query.values.at(-1));
      assert.ok(row, "updated device must exist in fake store");
      row.last_event_id = eventId;
      row.last_seen_at = timestamp;
      row.is_online = true;
      if (q.includes("last_alarm_at = now()")) row.last_alarm_at = timestamp;
      if (q.includes("last_alarm_at = NULL")) row.last_alarm_at = null;
      return { rows: [] };
    }
    if (q.startsWith("INSERT INTO owned_iot_events")) {
      events.set(query.values[0], { deviceId: query.values[1], branchId: query.values[2], type: query.values[5] });
      return { rows: [] };
    }
    if (q.includes("FROM owned_iot_devices") && q.includes("WHERE branch_id::text =")) {
      assert.match(q, /WHERE branch_id::text = \?/);
      return { rows: devices.filter(row => row.branch_id === query.values[0]) };
    }
    if (q.includes("FROM owned_iot_devices") && q.includes("WHERE COALESCE(lifecycle_state")) {
      return { rows: devices.filter(row => row.lifecycle_state !== "archived") };
    }
    throw new Error("Unexpected SQL in isolated route test: " + q.slice(0, 250));
  } };
  const handlers = new Map();
  const app = {
    post: (path, ...fns) => handlers.set("POST " + path, fns),
    get: (path, ...fns) => handlers.set("GET " + path, fns),
  };
  const adminAuthGuard = (_req, _res, next) => next();
  const context = createContext({
    app, db, sql, Buffer, timingSafeEqual, randomUUID,
    ensureOwnedIotSchema: async () => {},
    process: { env: { FOODSAFETY_IOT_GATEWAY_TOKEN: TOKEN } },
    console,
    isAdminAuthenticated: adminAuthGuard,
    ownedIotIsOnline: (flag) => Boolean(flag),
    ownedIotConnectionState: row => row.is_online ? "online" : "sleeping",
    storage: {
      getBranch: async id => ({ name: id === BRANCH_A ? "Addis Restaurant" : "Other branch" }),
    },
  });
  for (const chunk of sections) {
    const output = ts.transpileModule(chunk, {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None },
      reportDiagnostics: true,
    });
    assert.equal((output.diagnostics || []).filter(d => d.category === ts.DiagnosticCategory.Error).length, 0);
    runInContext(output.outputText, context, { timeout: 5000 });
  }

  async function call(method, path, { body = {}, headers = {}, session = {} } = {}) {
    const handlersForRoute = handlers.get(method + " " + path);
    assert.ok(handlersForRoute?.length, "website route exists: " + method + " " + path);
    const req = { body, session, get: name => headers[name.toLowerCase()] || "" };
    const res = {
      code: 200, data: null,
      status(code) { this.code = code; return this; },
      json(value) { this.data = value; return this; },
    };
    // The Admin route registers real auth middleware; do not silently skip its presence.
    if (path === "/api/iot/alarms") assert.equal(handlersForRoute[0], adminAuthGuard);
    const handler = handlersForRoute.at(-1);
    await handler(req, res);
    return { status: res.code, body: res.data };
  }
  const receiver = createMujeebEventRelay({
    ingressToken: INGRESS, gatewayToken: TOKEN, baseUrl: BASE,
    bindings: { [NATIVE_ID]: FS_ID },
    request: async (url, options) => {
      assert.equal(url, BASE + "/api/iot/gateway/events");
      const response = await call("POST", "/api/iot/gateway/events", {
        body: JSON.parse(options.body), headers: { authorization: options.headers.authorization },
      });
      return { ok: response.status >= 200 && response.status < 300, status: response.status };
    },
  });
  await new Promise(resolve => receiver.listen(0, "127.0.0.1", resolve));
  try {
    const endpoint = "http://127.0.0.1:" + receiver.address().port + "/ingest";
    const send = async (type, upstreamEventId) => {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { authorization: "Bearer " + INGRESS, "content-type": "application/json" },
        body: JSON.stringify({ sourceDeviceId: NATIVE_ID, type, upstreamEventId }),
      });
      return res.status;
    };
    const branchA = { branchId: BRANCH_A, userType: "branch" };
    const branchB = { branchId: BRANCH_B, userType: "branch" };
    // The real authenticated gateway handler must reject impossible battery and RSSI
    // before a customer can see any telemetry or an alarm.
    const originalEvents = events.size;
    const invalidBattery = await call("POST", "/api/iot/gateway/events", {
      headers: { authorization: "Bearer " + TOKEN },
      body: { deviceId: FS_ID, type: "heartbeat", eventId: "invalid-battery-001", batteryPct: 104 },
    });
    assert.equal(invalidBattery.status, 422);
    const invalidSignal = await call("POST", "/api/iot/gateway/events", {
      headers: { authorization: "Bearer " + TOKEN },
      body: { deviceId: FS_ID, type: "heartbeat", eventId: "invalid-signal-001", rssi: 70 },
    });
    assert.equal(invalidSignal.status, 422);
    assert.equal(events.size, originalEvents, "Invalid telemetry must not reach event history");
    assert.equal(devices[0].last_seen_at, null, "Invalid telemetry must not mark Mouse 11 live");
    const asAdmin = async () => (await call("GET", "/api/iot/alarms")).body;
    const asBranch = async session => call("GET", "/api/branch/iot-alarms", { session });
    assert.equal(await send("trap_triggered", "isolated-catch-001"), 202);
    assert.equal(events.size, 1);
    const payloadSource = queries.filter(q => q.includes("INSERT INTO owned_iot_events"));
    assert.equal(payloadSource.length, 1, "Only the verified event can be stored");
    assert.equal((await asAdmin()).length, 1, "Admin sees test mouse alarm");
    assert.equal((await asAdmin())[0].deviceId, FS_ID);
    const a = await asBranch(branchA);
    const b = await asBranch(branchB);
    assert.equal(a.status, 200);
    assert.equal(a.body.length, 1, "Assigned Addis Restaurant branch sees own alarm");
    assert.equal(a.body[0].branchName, "Addis Restaurant");
    assert.equal(b.status, 200);
    assert.equal(b.body.length, 0, "Other branch cannot see Addis alarm");
    assert.equal((await asBranch({})).status, 401, "Anonymous branch must not see alarms");
    assert.equal((await asBranch({ userType: "admin", branchId: BRANCH_A })).status, 401);
    assert.equal(await send("trap_triggered", "isolated-catch-001"), 202);
    assert.equal(events.size, 1, "Retry is deduplicated at gateway");
    assert.equal(await send("trap_reset", "isolated-reset-001"), 202);
    assert.equal((await asAdmin()).length, 0, "Admin alarm clears after reset");
    assert.equal((await asBranch(branchA)).body.length, 0, "Branch alarm clears after reset");
    assert.ok(queries.some(q => /WHERE branch_id::text/.test(q)), "database query is scoped to logged in branch");
    console.log("PASS: Mujeeb relay -> actual gateway handler -> fake DB -> actual Admin and Branch handlers");
    console.log("PASS: no cross-branch leakage, no anonymous alarms, deduplication and reset");
    console.log("OFFLINE ONLY: no Neon, no deployed website, no customer alarm and no MQTT");
  } finally {
    await new Promise(resolve => receiver.close(resolve));
  }
});


test("Admin physically confirmed OFF cannot be overridden by setup Wi-Fi sightings", () => {
  const fn = section('const ownedIotConnectionState =', 'const ownedIotDevicesForAdmin =');
  const context = createContext({
    Date,
    ownedIotIsOnline: (isOnline, lastSeenAt) => Boolean(isOnline && lastSeenAt &&
      Date.now() - new Date(lastSeenAt).getTime() <= 2 * 60 * 1000),
  });
  const transpiled = ts.transpileModule(fn, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None },
  }).outputText;
  runInContext(transpiled, context, { timeout: 5000 });
  const ago = secs => new Date(Date.now() - secs * 1000).toISOString();
  const row = {
    is_online: false, last_seen_at: ago(180), last_wifi_seen_at: ago(1),
    manually_off_at: ago(20), last_event_type: null,
  };
  const state = row => runInContext('ownedIotConnectionState(' + JSON.stringify(row) + ')', context, { timeout: 5000 });
  assert.equal(state(row), 'turned_off', 'Recent pairing AP does not undo physical OFF');
  assert.equal(state({ ...row, manually_off_at: null }), 'wifi_seen', 'Setup Wi-Fi remains a separate observation');
  assert.equal(state({ ...row, last_seen_at: ago(1), is_online: true }), 'online', 'Newer authenticated device report restores observed online status');
});
