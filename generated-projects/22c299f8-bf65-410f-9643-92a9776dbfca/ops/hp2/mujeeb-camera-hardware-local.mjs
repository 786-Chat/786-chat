#!/usr/bin/env node
/**
 * Safe HP2 hardware-path demonstration:
 * real USB camera -> red-light candidate -> localhost authenticated Mujeeb
 * relay -> injected fake gateway. NO real website requests, MQTT or customer
 * alarms. The red signal may be ordinary trap startup, NOT a proven catch.
 */
import { spawn } from "node:child_process";
import { createMujeebEventRelay } from "./mujeeb-event-relay.mjs";
import { parseRoi, redPixelFraction, RedLedEdgeDetector } from "./camera-led-detector.mjs";

const WIDTH = 320, HEIGHT = 240, FRAME_BYTES = WIDTH * HEIGHT * 3;
const argv = process.argv.slice(2);
function arg(name, fallback) {
  const index = argv.indexOf(name);
  return index < 0 ? fallback : argv[index + 1];
}
if (!argv.includes("--roi")) {
  console.error("Usage: node mujeeb-camera-hardware-local.mjs --roi x,y,w,h [--device /dev/video0]");
  process.exit(2);
}
const roi = parseRoi(arg("--roi", ""), WIDTH, HEIGHT);
const device = arg("--device", "/dev/video0");
if (!/^\/dev\/video\d+$/.test(device)) throw new Error("Camera must be a /dev/videoN device");
const inputToken = "OFFLINE-LOCAL-INPUT-TEST-TOKEN-ONLY";
const gatewayToken = "OFFLINE-LOCAL-GATEWAY-TEST-TOKEN-ONLY";
const sourceId = "USB-CAMERA-LOCAL-TEST-NOT-DEVICE-ID";
const fsId = "FS-MOUSE-000003"; // test ID only; DOES NOT write to customer data
const captured = [];
const relay = createMujeebEventRelay({
  ingressToken: inputToken,
  gatewayToken,
  baseUrl: "https://offline-test.invalid",
  bindings: { [sourceId]: fsId },
  request: async (url, options) => {
    // The entire downstream is intercepted here. NO internet is contacted.
    if (url !== "https://offline-test.invalid/api/iot/gateway/events") {
      throw new Error("unexpected gateway target");
    }
    if (options.headers.authorization !== "Bearer " + gatewayToken) {
      throw new Error("unexpected gateway credential");
    }
    captured.push(JSON.parse(options.body));
    return { ok: true, status: 202 };
  },
});
await new Promise(resolve => relay.listen(0, "127.0.0.1", resolve));

let done = false, frames = 0, buffer = Buffer.alloc(0), lastError = "";
const detector = new RedLedEdgeDetector({ startupGuardMs: 0 });
const ffmpeg = spawn("ffmpeg", [
  "-nostdin", "-hide_banner", "-loglevel", "error",
  "-f", "v4l2", "-input_format", "mjpeg", "-video_size", "320x240",
  "-i", device, "-vf", "fps=2", "-pix_fmt", "rgb24", "-f", "rawvideo", "-"
], { stdio: ["ignore", "pipe", "pipe"] });
ffmpeg.stderr.on("data", part => {
  lastError = (lastError + String(part)).slice(-800);
});
console.log("[test] REAL CAMERA -> LOCAL MUJEEB API -> FAKE GATEWAY ONLY");
console.log("[test] No production website requests, no customer alarm, no MQTT");
console.log("[test] Red indicates a test candidate, NOT proof of a catch");
console.log("[test] ROI=" + Object.values(roi).join(",") + ". Turn CLOSED trap ON briefly, then OFF.");
async function finish(err) {
  if (done) return;
  done = true;
  clearTimeout(timer);
  ffmpeg.kill("SIGTERM");
  await new Promise(resolve => relay.close(resolve));
  if (err) {
    console.error("[test] INCOMPLETE: " + err.message);
    process.exitCode = 1;
  }
}
const timer = setTimeout(() => void finish(new Error("No red-light candidate within 90 seconds")), 90000);
ffmpeg.on("error", err => void finish(err));
ffmpeg.on("exit", code => {
  if (!done) void finish(new Error("Camera stream ended (" + code + "): " + lastError));
});
process.on("SIGINT", () => void finish(new Error("User stopped camera test")));
ffmpeg.stdout.on("data", data => {
  if (done) return;
  buffer = Buffer.concat([buffer, data]);
  while (buffer.length >= FRAME_BYTES && !done) {
    const frame = buffer.subarray(0, FRAME_BYTES);
    buffer = buffer.subarray(FRAME_BYTES);
    frames++;
    const fraction = redPixelFraction(frame, WIDTH, HEIGHT, roi);
    const candidate = detector.observe(fraction, frames * 500);
    if (!candidate) continue;
    console.log("[test] RED LIGHT CANDIDATE seen on actual USB camera; checking relay...");
    void (async () => {
      const response = await fetch("http://127.0.0.1:" + relay.address().port + "/ingest", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer " + inputToken,
        },
        body: JSON.stringify({
          sourceDeviceId: sourceId,
          upstreamEventId: "optical-hardware-test-0001",
          type: "trap_triggered",
        }),
      });
      if (response.status !== 202) throw new Error("Local relay rejected input (" + response.status + ")");
      if (captured.length !== 1 || captured[0].deviceId !== fsId || captured[0].type !== "trap_triggered") {
        throw new Error("Fake gateway did not receive expected test payload");
      }
      console.log("[test] PASS: LIVE CAMERA -> MUJEEB API -> FAKE GATEWAY (no MQTT)");
      console.log("[test] This was NOT a real mouse catch, and NO customer alarm was sent.");
    })().then(() => finish()).catch(err => finish(err));
    break;
  }
});
