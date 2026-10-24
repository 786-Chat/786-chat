#!/usr/bin/env node
/**
 * Optional Food Safety / Mujeeb API adapter.
 *
 * Accepts EXPLICIT catch/reset and real battery updates from an authenticated, locally trusted
 * integration and forwards them to the existing Pest Control gateway API.
 *
 * IMPORTANT: This is a receiver, NOT a Tuya local protocol client or a
 * SmartLife notification listener. Seeing SmartLife-xxxx Wi-Fi, a MAC, or a
 * device ID alone must never generate a catch event.
 *
 * Start ONLY after a genuine event source and its device binding are verified.
 * Bound to loopback by design; remote sources require a separately managed,
 * authenticated connection. Never publish this HTTP port to the internet.
 */
import { createServer } from "node:http";
import { createHash, timingSafeEqual } from "node:crypto";
import { fileURLToPath } from "node:url";

const TYPES = new Set(["trap_triggered", "trap_reset", "battery_update", "signal_update"]);
const BODY_LIMIT = 8192;

function tokenEquals(actual, expected) {
  const a = Buffer.from(String(actual || ""));
  const b = Buffer.from(String(expected || ""));
  return a.length > 0 && a.length === b.length && timingSafeEqual(a, b);
}

export function stableEventId(sourceDeviceId, upstreamEventId) {
  return "mu-" + createHash("sha256")
    .update(JSON.stringify([sourceDeviceId, upstreamEventId]))
    .digest("hex").slice(0, 48);
}

export function createMujeebEventRelay({
  ingressToken,
  gatewayToken,
  baseUrl,
  bindings,
  request = fetch,
}) {
  if (!ingressToken || !gatewayToken || ingressToken === gatewayToken) {
    throw new Error("Separate Mujeeb ingress and Food Safety gateway tokens are required");
  }
  if (!/^https:\/\//i.test(baseUrl || "")) {
    throw new Error("PEST_CONTROL_BASE_URL must be HTTPS");
  }
  if (!bindings || typeof bindings !== "object" || Array.isArray(bindings)) {
    throw new Error("Verified native-device-ID to FS-MOUSE-ID bindings are required");
  }
  for (const [nativeId, fsId] of Object.entries(bindings)) {
    if (!nativeId || !/^FS-MOUSE-\d{6}$/.test(String(fsId))) {
      throw new Error("Invalid native ID -> FS-MOUSE binding");
    }
  }

  return createServer(async (req, res) => {
    const send = (status, data) => {
      res.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
      res.end(JSON.stringify(data));
    };

    if (req.method === "GET" && req.url === "/health") {
      return send(200, { service: "mu-verified-event-relay", readyForRealEvents: Object.keys(bindings).length > 0 });
    }
    if (req.method !== "POST" || req.url !== "/ingest") {
      return send(404, { error: "NOT_FOUND" });
    }

    const header = String(req.headers.authorization || "");
    const bearer = /^Bearer\s+(.+)$/i.exec(header)?.[1] || "";
    if (!tokenEquals(bearer, ingressToken)) {
      return send(401, { error: "UNAUTHORIZED" });
    }
    if (!String(req.headers["content-type"] || "").toLowerCase().startsWith("application/json")) {
      return send(415, { error: "JSON_REQUIRED" });
    }

    let size = 0;
    const chunks = [];
    try {
      for await (const chunk of req) {
        size += chunk.length;
        if (size > BODY_LIMIT) return send(413, { error: "BODY_TOO_LARGE" });
        chunks.push(chunk);
      }
      const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
      if (!body || typeof body !== "object" || Array.isArray(body)) {
        return send(400, { error: "INVALID_JSON_OBJECT" });
      }

      // Native Tuya ID is NOT the AP MAC/BSSID or our FS-MOUSE registration ID.
      // A technician/admin must independently establish a real device binding.
      const sourceDeviceId = String(body.sourceDeviceId || "").trim();
      const mappedFsId = Object.hasOwn(bindings, sourceDeviceId) ? bindings[sourceDeviceId] : "";
      if (!mappedFsId) return send(403, { error: "UNVERIFIED_DEVICE_ID" });

      const type = String(body.type || "").trim();
      if (!TYPES.has(type)) return send(422, { error: "UNSUPPORTED_VERIFIED_DEVICE_EVENT" });

      // Upstream event ID must be stable across retries. No guessing from Wi-Fi.
      const upstreamEventId = String(body.upstreamEventId || "").trim();
      if (!/^[a-zA-Z0-9._:-]{8,128}$/.test(upstreamEventId)) {
        return send(422, { error: "UPSTREAM_EVENT_ID_REQUIRED" });
      }

      const eventId = stableEventId(sourceDeviceId, upstreamEventId);
      const batteryPct = body.batteryPct;
      if (batteryPct !== undefined && (!Number.isInteger(batteryPct) || batteryPct < 0 || batteryPct > 100)) {
        return send(422, { error: "INVALID_BATTERY" });
      }
      // Battery-only messages must include a REAL device-reported percentage.
      // Never infer it from Wi-Fi strength, estimated battery age or an LED.
      if (type === "battery_update" && batteryPct === undefined) {
        return send(422, { error: "REAL_BATTERY_PERCENT_REQUIRED" });
      }
      // Real device-reported Wi-Fi RSSI uses dBm, unlike HP2 setup-AP
      // signalPercent. Never infer this reading from sighting/SSID presence.
      const rssi = body.rssi;
      if (rssi !== undefined && (!Number.isInteger(rssi) || rssi < -110 || rssi > -1)) {
        return send(422, { error: "INVALID_DEVICE_RSSI" });
      }
      if (type === "signal_update" && rssi === undefined) {
        return send(422, { error: "REAL_DEVICE_RSSI_REQUIRED" });
      }

      // Existing API resolves the assigned branch from its database. Caller
      // cannot select a customer or inject an alternate branch ID.
      const event = {
        eventId,
        deviceId: mappedFsId,
        type: type === "battery_update" || type === "signal_update" ? "heartbeat" : type,
        ...(type === "battery_update" ? {} : { value: type === "trap_triggered" }),
        source: "mu-authenticated-event-adapter",
        upstreamEventId,
        ...(batteryPct === undefined ? {} : { batteryPct }),
        ...(rssi === undefined ? {} : { rssi }),
      };
      const upstream = await request(baseUrl.replace(/\/+$/, "") + "/api/iot/gateway/events", {
        method: "POST",
        headers: {
          authorization: "Bearer " + gatewayToken,
          "content-type": "application/json",
        },
        body: JSON.stringify(event),
        signal: AbortSignal.timeout(8000),
      });
      if (!upstream.ok) {
        return send(502, { error: "GATEWAY_REJECTED_EVENT", gatewayStatus: upstream.status });
      }
      return send(202, { accepted: true, eventId, deviceId: mappedFsId });
    } catch (err) {
      if (err instanceof SyntaxError) return send(400, { error: "INVALID_JSON" });
      // Never log incoming secrets or notification content.
      console.error("[mu-relay] Delivery failed:", err?.message || String(err));
      return send(502, { error: "DELIVERY_FAILED" });
    }
  });
}

export function startFromEnvironment(env = process.env) {
  const bindings = JSON.parse(env.MUJEEB_DEVICE_BINDINGS_JSON || "{}");
  const server = createMujeebEventRelay({
    ingressToken: env.MUJEEB_INGRESS_TOKEN,
    gatewayToken: env.FOODSAFETY_IOT_GATEWAY_TOKEN,
    baseUrl: env.PEST_CONTROL_BASE_URL,
    bindings,
  });
  const port = Number(env.MUJEEB_INGRESS_PORT || 43117);
  if (!Number.isInteger(port) || port < 1024 || port > 65535) {
    throw new Error("Invalid MUJEEB_INGRESS_PORT");
  }
  server.listen(port, "127.0.0.1", () => {
    console.log("[mu-relay] Local authenticated listener on 127.0.0.1:" + port);
  });
  return server;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    startFromEnvironment();
  } catch (err) {
    console.error("[mu-relay] Not started:", err?.message || String(err));
    process.exitCode = 1;
  }
}
