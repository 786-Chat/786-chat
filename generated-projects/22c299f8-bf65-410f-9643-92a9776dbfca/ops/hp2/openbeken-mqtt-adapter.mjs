#!/usr/bin/env node
/**
 * OPTIONAL OpenBeken MQTT-to-Food Safety event adapter.
 *
 * For a VERIFIED, already-flashed OpenBeken battery mouse only.
 * Does NOT configure, flash, reset, wake, or communicate with a factory
 * Tuya/SmartLife mouse. Do NOT run until the hardware and topic mapping
 * have been physically verified and a real MQTT broker is receiving data.
 *
 * Environment:
 *   PEST_CONTROL_BASE_URL=https://pestcontrol.cat
 *   FOODSAFETY_IOT_GATEWAY_TOKEN=<existing protected gateway token>
 *   FOODSAFETY_OPENBEKEN_DEVICE_MAP='{"Mouse_Trap_1":"FS-MOUSE-000003"}'
 *   MQTT_HOST=127.0.0.1 [optional]
 *   MQTT_PORT=1883 [optional]
 *   MQTT_USERNAME / MQTT_PASSWORD [optional]
 *
 * An exact, administrator-approved MQTT prefix -> registered device ID map
 * is REQUIRED. Do not guess FS-MOUSE IDs from mouse numbers or MAC addresses.
 * This adapter uses mosquitto_sub -R to IGNORE replayed retained MQTT messages,
 * preventing stale retained catch alerts from being re-sent at startup.
 */
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import readline from "node:readline";

function parseReport(topic, payload, permittedPrefixes) {
  const m = String(topic || "").match(/^([A-Za-z0-9_-]+)\/(1|get|2)\/get$/);
  // Strictly require only OpenBeken channel 1 (catch) or 2 (battery).
  const parts = String(topic || "").match(/^([A-Za-z0-9_-]+)\/(1|2)\/get$/);
  if (!parts || !permittedPrefixes.has(parts[1])) return null;
  const value = String(payload || "").trim();
  if (parts[2] === "1") {
    return value === "1" ? { prefix: parts[1], type: "trap_triggered" }
      : value === "0" ? { prefix: parts[1], type: "trap_reset" }
      : null;
  }
  const batteryPct = Number(value);
  return /^(?:100|[0-9]{1,2})$/.test(value) && Number.isInteger(batteryPct)
    ? { prefix: parts[1], type: "heartbeat", batteryPct }
    : null;
}

if (process.argv.includes("--self-test")) {
  const assert = (cond, msg) => { if (!cond) throw new Error("Self-test failed: " + msg); };
  const allow = new Set(["Mouse_Trap_1"]);
  assert(parseReport("Mouse_Trap_1/1/get", "1", allow)?.type === "trap_triggered", "caught DP");
  assert(parseReport("Mouse_Trap_1/1/get", "0", allow)?.type === "trap_reset", "reset DP");
  assert(parseReport("Mouse_Trap_1/2/get", "75", allow)?.batteryPct === 75, "battery DP");
  assert(parseReport("Mouse_Trap_1/2/get", "100", allow)?.batteryPct === 100, "battery 100");
  assert(!parseReport("Mouse_Trap_2/1/get", "1", allow), "unknown prefix refused");
  assert(!parseReport("Mouse_Trap_1/1/get", "-1", allow), "unknown trap value refused");
  assert(!parseReport("Mouse_Trap_1/2/get", "-1", allow), "battery sentinel refused");
  assert(!parseReport("Mouse_Trap_1/2/get", "130", allow), "battery overflow refused");
  assert(!parseReport("Mouse_Trap_1/trap", "1", allow), "legacy trap topic refused");
  console.log("PASS: OpenBeken topic parsing, strict allowlist, and battery validation");
  process.exit(0);
}

const base = String(process.env.PEST_CONTROL_BASE_URL || "").trim().replace(/\/+$/, "");
const token = String(process.env.FOODSAFETY_IOT_GATEWAY_TOKEN || "").trim();
const mqttHost = String(process.env.MQTT_HOST || "127.0.0.1").trim();
const mqttPort = String(process.env.MQTT_PORT || "1883").trim();
const mqttUser = String(process.env.MQTT_USERNAME || "").trim();
const mqttPassword = String(process.env.MQTT_PASSWORD || "").trim();

let map;
try { map = JSON.parse(String(process.env.FOODSAFETY_OPENBEKEN_DEVICE_MAP || "")); }
catch { console.error("[openbeken] Explicit FOODSAFETY_OPENBEKEN_DEVICE_MAP JSON is required."); process.exit(2); }
const entries = Object.entries(map || {});
if (!/^https:\/\//.test(base) || !token ||
    !/^[a-zA-Z0-9._-]+$/.test(mqttHost) || !/^\d{2,5}$/.test(mqttPort) ||
    !entries.length || entries.length > 30 ||
    entries.some(([prefix, id]) =>
      !/^[A-Za-z0-9_-]{1,64}$/.test(prefix) ||
      !/^FS-MOUSE-\d{6,}$/.test(String(id)))) {
  console.error("[openbeken] Invalid configuration. No device events sent.");
  process.exit(2);
}
const devices = new Map(entries);
const topics = entries.flatMap(([prefix]) => [prefix + "/1/get", prefix + "/2/get"]);
const args = ["-h", mqttHost, "-p", mqttPort, "-R", "-v"];
for (const topic of topics) args.push("-t", topic);
if (mqttUser) args.push("-u", mqttUser);
if (mqttPassword) args.push("-P", mqttPassword);

console.log("[openbeken] OPTIONAL verified sensor adapter active, prefixes: " + entries.map(x => x[0]).join(", "));
console.log("[openbeken] Retained messages ignored; no factory Wi-Fi or firmware controls.");
const sub = spawn("mosquitto_sub", args, { stdio: ["ignore", "pipe", "inherit"], env: process.env });
const rl = readline.createInterface({ input: sub.stdout });
let chain = Promise.resolve();
// Duplicate state within one process is ignored, but later wakes can still
// report a real changed state. Initial No (0) is never allowed to clear an
// earlier persisted alarm without first seeing a real Yes (1) this session.
const lastCatch = new Map();

async function postEvent(id, report, topic, payload) {
  const response = await fetch(base + "/api/iot/gateway/events", {
    method: "POST",
    headers: {
      authorization: "Bearer " + token,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      eventId: id + "-openbeken-" + randomUUID(),
      deviceId: id,
      type: report.type,
      value: report.type === "trap_triggered" ? true :
        report.type === "trap_reset" ? false : undefined,
      batteryPct: report.batteryPct,
      mqttTopic: topic,
      mqttPayload: payload,
      source: "hp2-openbeken-verified",
    }),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error("Food Safety API rejected event (" + response.status + ")");
}

rl.on("line", line => {
  const pos = line.indexOf(" ");
  if (pos < 0) return;
  const topic = line.slice(0, pos);
  const payload = line.slice(pos + 1);
  const report = parseReport(topic, payload, devices);
  if (!report) return;
  chain = chain.then(async () => {
    if (report.type === "trap_reset" && lastCatch.get(report.prefix) !== "trap_triggered") {
      console.log("[openbeken] Initial No from " + report.prefix +
        ": not clearing previously saved alarm (needs witnessed change).");
      return;
    }
    if (report.type !== "heartbeat" && lastCatch.get(report.prefix) === report.type) return;
    const id = devices.get(report.prefix);
    await postEvent(id, report, topic, payload);
    if (report.type !== "heartbeat") lastCatch.set(report.prefix, report.type);
    console.log("[openbeken] Accepted " + report.type + " for verified prefix " + report.prefix);
  }).catch(error => console.error("[openbeken] " + error.message));
});
sub.on("error", error => { console.error("[openbeken] mosquitto_sub failed: " + error.message); process.exitCode = 1; });
sub.on("exit", code => process.exit(code === 0 ? 0 : 1));
for (const signal of ["SIGTERM", "SIGINT"]) process.on(signal, () => sub.kill(signal));
