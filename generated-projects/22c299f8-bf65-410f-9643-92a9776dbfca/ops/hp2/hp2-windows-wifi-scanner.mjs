#!/usr/bin/env node
/**
 * Food Safety HP2 Windows 11 read-only Wi-Fi reporter (preview only).
 *
 * Reads nearby Wi-Fi with Windows netsh. Never joins Wi-Fi, requests router
 * passwords, flashes firmware, claims MQTT, or changes Smart Life pairing.
 *
 * Requires Node.js 20+, a working Windows Wi-Fi adapter, and the existing
 * FOODSAFETY_IOT_GATEWAY_TOKEN in this process's environment.
 *
 * Usage:
 *   node hp2-windows-wifi-scanner.mjs --self-test
 *   node hp2-windows-wifi-scanner.mjs --once
 *   node hp2-windows-wifi-scanner.mjs
 */
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import assert from "node:assert/strict";

const execFileAsync = promisify(execFile);
// Explicit preview target. The previous hardcoded deployment was outdated and
// could send fresh HP2 sightings to a different preview than the admin uses.
// Never allow this scanner to accidentally post to production.
const previewDefault = "https://786-generated-22c299f8bf65-b0tt7nbj2-mujeebpro.vercel.app";
const requestedBase = String(process.env.FOODSAFETY_HP2_PREVIEW_URL || previewDefault).trim().replace(/\/+$/, "");
let base;
try {
  const target = new URL(requestedBase);
  if (target.protocol !== "https:" ||
      !/^786-generated-22c299f8bf65-[a-z0-9-]+\.vercel\.app$/i.test(target.hostname) ||
      target.pathname !== "/" || target.search || target.hash) {
    throw new Error("Expected this project's HTTPS Vercel preview hostname");
  }
  base = target.origin;
} catch {
  console.error("[hp2-windows] Invalid FOODSAFETY_HP2_PREVIEW_URL; refusing to send reports.");
  process.exit(2);
}
const token = String(process.env.FOODSAFETY_IOT_GATEWAY_TOKEN || "").trim();
const once = process.argv.includes("--once");
const selfTest = process.argv.includes("--self-test");
const help = process.argv.includes("--help");
const isMouse = (ssid) => /^(?:SmartLife-|OpenBK)/i.test(ssid);
const validMac = (mac) => /^([0-9A-F]{2}:){5}[0-9A-F]{2}$/.test(mac);

function channelFrequency(channel) {
  if (channel >= 1 && channel <= 13) return 2407 + 5 * channel;
  if (channel === 14) return 2484;
  if (channel >= 32 && channel <= 177) return 5000 + 5 * channel;
  return null;
}

function parseNetsh(text) {
  const seen = [];
  let ssid = "";
  let mac = "";
  let signal = null;
  let channel = null;
  const flush = () => {
    if (!ssid || ssid.length > 64 || /[\x00-\x1f\x7f]/.test(ssid)
        || !validMac(mac) || signal === null || signal < 0 || signal > 100) return;
    seen.push({ ssid, macAddress: mac, signal, frequency: channelFrequency(channel) });
  };
  for (const line of String(text).split(/\r?\n/)) {
    const s = line.match(/^\s*SSID\s+\d+\s*:\s*(.*?)\s*$/i);
    if (s) { flush(); ssid = s[1]; mac = ""; signal = null; channel = null; continue; }
    const b = line.match(/^\s*BSSID\s+\d+\s*:\s*((?:[0-9a-f]{2}:){5}[0-9a-f]{2})\s*$/i);
    if (b) { flush(); mac = b[1].toUpperCase(); signal = null; channel = null; continue; }
    const sig = line.match(/^\s*Signal\s*:\s*(\d{1,3})\s*%/i);
    if (sig && mac) { signal = Number(sig[1]); continue; }
    const ch = line.match(/^\s*Channel\s*:\s*(\d{1,3})\s*$/i);
    if (ch && mac) channel = Number(ch[1]);
  }
  flush();
  return seen;
}

function selectReports(entries) {
  const mouseByMac = new Map();
  const routerByKey = new Map();
  for (const ap of entries) {
    if (isMouse(ap.ssid)) {
      const prev = mouseByMac.get(ap.macAddress);
      if (!prev || prev.signalPercent < ap.signal)
        mouseByMac.set(ap.macAddress, { ssid: ap.ssid, macAddress: ap.macAddress, signalPercent: ap.signal });
    } else if (Number.isInteger(ap.frequency) && ap.frequency >= 2400 && ap.frequency <= 5900) {
      const key = ap.ssid + "\n" + ap.frequency;
      const prev = routerByKey.get(key);
      if (!prev || prev.signal < ap.signal)
        routerByKey.set(key, { ssid: ap.ssid, frequency: ap.frequency, signal: ap.signal });
    }
  }
  return {
    mice: [...mouseByMac.values()],
    networks: [...routerByKey.values()].sort((a, b) => b.signal - a.signal).slice(0, 64),
  };
}

function test() {
  const sample = [
    "Interface name : Wi-Fi",
    "SSID 1 : SmartLife-203B",
    "    BSSID 1 : F8:17:2D:BB:20:3A",
    "         Signal : 94%",
    "         Channel : 6",
    "SSID 2 : Restaurant WiFi",
    "    BSSID 1 : 10:20:30:40:50:60",
    "         Signal : 70%",
    "         Channel : 11",
    "    BSSID 2 : 10:20:30:40:50:61",
    "         Signal : 87%",
    "         Channel : 11",
    "SSID 3 : Restaurant 5G",
    "    BSSID 1 : 10:20:30:40:50:62",
    "         Signal : 55%",
    "         Channel : 36",
  ].join("\r\n");
  const result = selectReports(parseNetsh(sample));
  assert.deepEqual(result.mice, [{ ssid: "SmartLife-203B", macAddress: "F8:17:2D:BB:20:3A", signalPercent: 94 }]);
  assert.deepEqual(result.networks, [
    { ssid: "Restaurant WiFi", frequency: 2462, signal: 87 },
    { ssid: "Restaurant 5G", frequency: 5180, signal: 55 },
  ]);
  console.log("PASS: Windows netsh mouse AP, MAC, 2.4/5 GHz and strongest router signal parser.");
}

async function report(path, value) {
  const response = await fetch(base + path, {
    method: "POST",
    headers: { authorization: "Bearer " + token, "content-type": "application/json" },
    body: JSON.stringify(value),
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) {
    // Deliberately do not log HTTP response bodies or gateway token.
    console.error("[hp2-windows] " + path + " HTTP " + response.status);
    return false;
  }
  return true;
}

async function scanOnce(includeRouters) {
  const { stdout } = await execFileAsync("netsh.exe", ["wlan", "show", "networks", "mode=bssid"], {
    timeout: 18000, maxBuffer: 1024 * 1024, windowsHide: true,
  });
  const entries = parseNetsh(stdout);
  if (!entries.length) {
    console.warn("[hp2-windows] No parseable Wi-Fi APs. Check the Wi-Fi adapter, scan visibility and Windows netsh output language.");
    return;
  }
  const { mice, networks } = selectReports(entries);
  if (includeRouters) {
    const accepted = await report("/api/iot/gateway/router-wifi-scan", { networks });
    if (accepted) console.log("[hp2-windows] " + networks.length + " nearby router SSIDs reported to PREVIEW (no passwords).");
  }
  for (const ap of mice) {
    const accepted = await report("/api/iot/gateway/wifi-observation", ap);
    if (accepted) console.log("[hp2-windows] Pairing AP " + ap.ssid + " " + ap.macAddress + " " + ap.signalPercent + "% recorded; NOT MQTT.");
  }
  if (!mice.length) console.log("[hp2-windows] No mouse pairing AP broadcasting. A mouse already connected to Smart Life may not broadcast a pairing AP; do not reset it just for this check.");
  console.log("[hp2-windows] Scan complete: " + mice.length + " pairing AP(s); " + networks.length + " router bands observed.");
}

if (help) {
  console.log("Node 20+ Windows scanner; --self-test, --once, or continuous 25-second reads; requires existing FOODSAFETY_IOT_GATEWAY_TOKEN.");
  process.exit(0);
}
if (selfTest) { test(); process.exit(0); }
if (process.platform !== "win32") {
  console.error("[hp2-windows] Windows 11 only. For Ubuntu, use the existing nmcli scanner.");
  process.exit(2);
}
if (!token) {
  console.error("[hp2-windows] Missing existing FOODSAFETY_IOT_GATEWAY_TOKEN. Configure it on HP2 privately, never send it in chat.");
  process.exit(2);
}
console.log("[hp2-windows] Reporting pairing Wi-Fi observations to PREVIEW: " + base + " (token not printed)");
let cycle = 0;
do {
  try { await scanOnce(cycle % 3 === 0); }
  catch (error) { console.error("[hp2-windows] Scan/report failed: " + String(error?.message || error).slice(0,240)); }
  cycle += 1;
  if (once) break;
  await new Promise(resolve => setTimeout(resolve, 25000));
} while (true);
