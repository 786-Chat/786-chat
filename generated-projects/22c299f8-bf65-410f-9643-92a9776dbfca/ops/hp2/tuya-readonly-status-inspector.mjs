#!/usr/bin/env node
/**
 * READ-ONLY Tuya Cloud inspection for a BMAX W003 already paired in Smart Life.
 * No MQTT, no Wi-Fi provisioning, no catch inference, NO website requests.
 *
 * Requires an authorised Tuya Cloud project with a linked Smart Life account.
 * A saved factory-AP SSID/BSSID is NOT a Tuya device ID.
 *
 * Credentials are read from environment only; never put them into a shell command
 * screenshot, GitHub, this script, or a Pest Control web form.
 */
import { createHash, createHmac, randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";

const REGIONS = Object.freeze({
  eu: "https://openapi.tuyaeu.com",
  we: "https://openapi-weaz.tuyaeu.com",
  us: "https://openapi.tuyaus.com",
  ue: "https://openapi-ueaz.tuyaus.com",
  in: "https://openapi.tuyain.com",
});
const EMPTY_SHA256 = createHash("sha256").update("").digest("hex");

export function signingHeaders({ clientId, secret, pathname, token = "", now, nonce }) {
  // Tuya Cloud v2 signing: HMAC-SHA256(client_id + [access_token] + t +
  // nonce + method + \n + sha256(body) + \n + signedHeaders + \n + url)
  const t = String(now);
  const stringToSign = ["GET", EMPTY_SHA256, "", pathname].join("\n");
  const sign = createHmac("sha256", secret)
    .update(clientId + token + t + nonce + stringToSign)
    .digest("hex").toUpperCase();
  return {
    client_id: clientId, t, nonce, sign, sign_method: "HMAC-SHA256",
    ...(token ? { access_token: token } : {}),
  };
}

export function createReadOnlyTuyaInspector({
  clientId, clientSecret, region = "eu",
  request = fetch, clock = Date.now, nextNonce = randomUUID,
}) {
  if (!clientId || !clientSecret) throw new Error("Tuya client ID and secret are required locally");
  const origin = REGIONS[region];
  if (!origin) throw new Error("Unsupported TUYA_REGION; use eu, we, us, ue or in");
  async function read(pathname, token = "") {
    const headers = signingHeaders({
      clientId, secret: clientSecret, pathname, token, now: clock(), nonce: nextNonce(),
    });
    const res = await request(origin + pathname, {
      method: "GET",
      headers,
      signal: AbortSignal.timeout(10000),
      redirect: "error",
    });
    if (!res.ok) throw new Error("Tuya read-only request failed: HTTP " + res.status);
    const data = await res.json();
    if (data?.success !== true) {
      const code = String(data?.code ?? "UNKNOWN").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 40);
      throw new Error("Tuya API rejected request; code=" + code + " (check permissions, region, and linked account)");
    }
    return data.result;
  }
  async function getStatus(deviceId) {
    if (!/^[a-zA-Z0-9_-]{8,64}$/.test(String(deviceId || ""))) {
      throw new Error("A genuine Tuya Cloud device ID is required (not the SSID or AP MAC)");
    }
    const auth = await read("/v1.0/token?grant_type=1");
    if (!auth?.access_token) throw new Error("Tuya API did not return an access token");
    const statuses = await read(
      "/v1.0/iot-03/devices/" + encodeURIComponent(deviceId) + "/status",
      auth.access_token,
    );
    if (!Array.isArray(statuses)) throw new Error("Tuya returned no device status array");
    return statuses.map(({ code, value }) => ({
      code: String(code ?? ""),
      valueType: value === null ? "null" : Array.isArray(value) ? "array" : typeof value,
      value,
    }));
  }
  return { getStatus, region };
}

export function safeStatusSummary(statuses, showValues = false) {
  return statuses.map(item => ({
    code: item.code,
    valueType: item.valueType,
    ...(showValues ? { value: item.value } : {}),
  }));
}

async function main(env, args) {
  if (args.includes("--help")) {
    console.log("READ-ONLY Tuya status inspector. Required local env: TUYA_CLIENT_ID, TUYA_CLIENT_SECRET, TUYA_DEVICE_ID, TUYA_REGION=eu. Optional: --show-values. NEVER paste secrets into chat.");
    return;
  }
  const inspector = createReadOnlyTuyaInspector({
    clientId: env.TUYA_CLIENT_ID,
    clientSecret: env.TUYA_CLIENT_SECRET,
    region: env.TUYA_REGION || "eu",
  });
  const list = await inspector.getStatus(env.TUYA_DEVICE_ID);
  console.log("[inspect] READ ONLY: Tuya Cloud status codes; no alarms or customer website calls");
  console.log("[inspect] Snapshot values can be stale. No \"Connected\" or \"Caught\" conclusions.");
  console.log(JSON.stringify(safeStatusSummary(list, args.includes("--show-values")), null, 2));
  console.log("[inspect] No data was written or forwarded. Review device codes with a genuine catch test later.");
}
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main(process.env, process.argv.slice(2)).catch(err => {
    console.error("[inspect] " + err.message);
    process.exitCode = 1;
  });
}
