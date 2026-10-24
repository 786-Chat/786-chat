import test from "node:test";
import assert from "node:assert/strict";
import { createHmac, createHash } from "node:crypto";
import { createReadOnlyTuyaInspector, signingHeaders, safeStatusSummary } from "./tuya-readonly-status-inspector.mjs";

const CLIENT_ID = "fake-client-id";
const SECRET = "fake-secret-no-real-credentials";
const DEVICE = "abcdefgh1234567890";

test("signs Tuya GET token and status requests with official v2 HMAC structure", () => {
  const path = "/v1.0/token?grant_type=1";
  const h = signingHeaders({ clientId: CLIENT_ID, secret: SECRET, pathname: path, now: 1234567890123, nonce: "abc" });
  const emptyHash = createHash("sha256").update("").digest("hex");
  const payload = CLIENT_ID + "1234567890123" + "abc" + ["GET", emptyHash, "", path].join("\n");
  assert.equal(h.sign, createHmac("sha256", SECRET).update(payload).digest("hex").toUpperCase());
  assert.equal(h.sign_method, "HMAC-SHA256");
  assert.equal(h.access_token, undefined);
  assert.equal(h.nonce, "abc");
});

test("only GETs token and real device status, never reports a catch or contacts website", async () => {
  const calls = [];
  const inspector = createReadOnlyTuyaInspector({
    clientId: CLIENT_ID, clientSecret: SECRET, region: "eu",
    clock: () => 1234567890123, nextNonce: () => "abc",
    request: async (url, options) => {
      calls.push({ url, options });
      const isToken = url.endsWith("/v1.0/token?grant_type=1");
      return {
        ok: true,
        json: async () => isToken
          ? { success: true, result: { access_token: "fake-access-token" } }
          : { success: true, result: [
            { code: "battery_percentage", value: 81 },
            { code: "alarm_state_unknown", value: true },
            { code: "device_wifi_rssi", value: -62 },
          ] },
      };
    },
  });
  const result = await inspector.getStatus(DEVICE);
  assert.equal(result.length, 3);
  assert.deepEqual(safeStatusSummary(result).map(x => x.code),
    ["battery_percentage", "alarm_state_unknown", "device_wifi_rssi"]);
  assert.equal(safeStatusSummary(result)[0].value, undefined, "values redacted by default");
  assert.equal(safeStatusSummary(result, true)[0].value, 81);
  assert.deepEqual(calls.map(x => x.url), [
    "https://openapi.tuyaeu.com/v1.0/token?grant_type=1",
    "https://openapi.tuyaeu.com/v1.0/iot-03/devices/" + DEVICE + "/status",
  ]);
  assert.ok(calls.every(x => x.options.method === "GET"));
  assert.ok(calls.every(x => x.options.redirect === "error"));
  assert.equal(calls[1].options.headers.access_token, "fake-access-token");
  assert.equal(calls[0].options.headers.access_token, undefined);
  assert.ok(calls.every(x => !x.url.includes("pestcontrol.cat")));
});

test("unknown region, setup BSSID, and invalid linked account fail closed", async () => {
  assert.throws(() => createReadOnlyTuyaInspector({
    clientId: CLIENT_ID, clientSecret: SECRET, region: "not-allowed",
  }), /Unsupported TUYA_REGION/);
  let touchedNetwork = false;
  const inspector = createReadOnlyTuyaInspector({
    clientId: CLIENT_ID, clientSecret: SECRET,
    request: async () => { touchedNetwork = true; return { ok: true, json: async () => ({ success: true }) }; },
  });
  await assert.rejects(inspector.getStatus("F8:17:2D:BB:20:3A"), /genuine Tuya Cloud device ID/);
  assert.equal(touchedNetwork, false);
  const wrongAccount = createReadOnlyTuyaInspector({
    clientId: CLIENT_ID, clientSecret: SECRET,
    request: async () => ({ ok: true, json: async () => ({ success: false, code: "1106", msg: "PRIVATE_ACCOUNT_DETAILS" }) }),
  });
  await assert.rejects(wrongAccount.getStatus(DEVICE), /code=1106/);
});

test("no automatic catch classification is possible from an unknown DP code", () => {
  const status = safeStatusSummary([{ code: "thing_1", value: true, valueType: "boolean" }]);
  assert.deepEqual(status, [{ code: "thing_1", valueType: "boolean" }]);
  assert.equal("type" in status[0], false);
  assert.equal("trap_triggered" in status[0], false);
});
