import test from "node:test";
import assert from "node:assert/strict";
import { createMujeebEventRelay } from "./mujeeb-event-relay.mjs";
import { RedLedEdgeDetector, redPixelFraction } from "./camera-led-detector.mjs";

/**
 * OFFLINE INTEGRATION DEMONSTRATION ONLY:
 * synthetic red camera pixels -> real HTTP listener on loopback ->
 * intercepted/fake gateway response. NO production network request,
 * NO MQTT, NO browser alarm, NO customer records, NO real mouse-catch claim.
 */
const WIDTH = 320;
const HEIGHT = 240;
const SOURCE_ID = "CAMERA-TEST-SOURCE-ONLY";
const FS_ID = "FS-MOUSE-000003";
const INGRESS_TOKEN = "local-test-ingress-token-not-production";
const GATEWAY_TOKEN = "local-test-gateway-token-not-production";

function syntheticFrame(color) {
  const rgb = Buffer.alloc(WIDTH * HEIGHT * 3);
  // A small illuminated area entirely within the illustrative ROI.
  for (let y = 120; y < 150; y++) {
    for (let x = 165; x < 195; x++) {
      const i = (y * WIDTH + x) * 3;
      rgb[i] = color === "red" ? 255 : 0;
      rgb[i + 1] = color === "green" ? 255 : 0;
      rgb[i + 2] = 0;
    }
  }
  return rgb;
}

test("synthetic camera red candidate can reach isolated Mujeeb API and fake gateway, without MQTT", async () => {
  const roi = { x: 150, y: 110, w: 65, h: 65 };
  const red = redPixelFraction(syntheticFrame("red"), WIDTH, HEIGHT, roi);
  const green = redPixelFraction(syntheticFrame("green"), WIDTH, HEIGHT, roi);
  assert.ok(red > 0.035, "synthetic red must be visible inside ROI");
  assert.equal(green, 0, "green LED must not be red");

  const detector = new RedLedEdgeDetector({ startupGuardMs: 0 });
  assert.equal(detector.observe(green, 0), null);
  assert.equal(detector.observe(red, 500), null);
  assert.equal(detector.observe(red, 1000), null);
  const candidate = detector.observe(red, 1500);
  assert.equal(candidate?.kind, "RED_LIGHT_CANDIDATE");
  assert.equal(detector.observe(red, 2000), null, "persistent red must not repeatedly trigger");

  const captured = [];
  const relay = createMujeebEventRelay({
    ingressToken: INGRESS_TOKEN,
    gatewayToken: GATEWAY_TOKEN,
    baseUrl: "https://pestcontrol.cat",
    bindings: { [SOURCE_ID]: FS_ID },
    request: async (url, options) => {
      // STRICTLY intercept the upstream call; never use real fetch here.
      assert.equal(url, "https://pestcontrol.cat/api/iot/gateway/events");
      assert.equal(options.headers.authorization, "Bearer " + GATEWAY_TOKEN);
      captured.push(JSON.parse(options.body));
      return { ok: true, status: 202 };
    },
  });
  await new Promise(resolve => relay.listen(0, "127.0.0.1", resolve));
  try {
    const url = "http://127.0.0.1:" + relay.address().port + "/ingest";
    const data = {
      sourceDeviceId: SOURCE_ID,
      type: "trap_triggered",
      upstreamEventId: "CAMERA-LOCAL-DEMO-0001",
      branchId: "UNTRUSTED-FORGED-BRANCH",
    };
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer " + INGRESS_TOKEN,
      },
      body: JSON.stringify(data),
    });
    assert.equal(response.status, 202);
    const result = await response.json();
    assert.equal(result.deviceId, FS_ID);
    assert.equal(captured.length, 1);
    assert.equal(captured[0].deviceId, FS_ID);
    assert.equal(captured[0].type, "trap_triggered");
    assert.equal(captured[0].value, true);
    assert.equal(captured[0].branchId, undefined, "client cannot choose customer branch");
    console.log("LOCAL CAMERA -> MUJEEB API -> FAKE GATEWAY: PASS (no real alarms or MQTT)");
  } finally {
    await new Promise(resolve => relay.close(resolve));
  }
});
