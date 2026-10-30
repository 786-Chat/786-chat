#!/usr/bin/env node
/**
 * Read-only HP2 multi-mouse SmartLife pairing AP scanner.
 * No Wi-Fi association, password handling, firmware flashing, or fake MQTT.
 * Required: HTTPS PEST_CONTROL_BASE_URL and FOODSAFETY_IOT_GATEWAY_TOKEN.
 * Optional: FOODSAFETY_WIFI_INTERFACE (preferred, not mandatory).
 * Obsolete FOODSAFETY_WIFI_BSSID no longer restricts discovery to one mouse.
 */
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);
const apiBase = String(process.env.PEST_CONTROL_BASE_URL || "").trim().replace(/\/+$/, "");
const token = String(process.env.FOODSAFETY_IOT_GATEWAY_TOKEN || "").trim();
const preferred = String(process.env.FOODSAFETY_WIFI_INTERFACE || "").trim();
if (!/^https:\/\//.test(apiBase) || !token) {
  console.error("[hp2-wifi] HTTPS base URL and existing gateway token required.");
  process.exit(1);
}
if (preferred && !/^[a-zA-Z0-9_-]+$/.test(preferred)) {
  console.error("[hp2-wifi] Invalid preferred interface.");
  process.exit(1);
}
if (process.env.FOODSAFETY_WIFI_BSSID) {
  console.log("[hp2-wifi] Legacy single-BSSID filter ignored; finding all SmartLife mouse APs.");
}

async function interfaces() {
  const { stdout } = await run("nmcli", ["-t", "-e", "no", "-f", "DEVICE,TYPE", "device", "status"],
    { timeout: 6000, maxBuffer: 65536 });
  const wifi = stdout.split(/\r?\n/).map(line => line.match(/^([^:]+):wifi$/i)?.[1]).filter(Boolean);
  if (preferred && !wifi.includes(preferred)) {
    console.warn("[hp2-wifi] Old Wi-Fi interface " + preferred + " missing; using " + (wifi.join(", ") || "none"));
  }
  return preferred && wifi.includes(preferred)
    ? [preferred, ...wifi.filter(name => name !== preferred)]
    : wifi;
}

function readAps(stdout) {
  const result = [];
  for (const line of String(stdout).split(/\r?\n/)) {
    const m = line.match(/^(.*):((?:[0-9a-f]{2}:){5}[0-9a-f]{2}):(\d{1,3})$/i);
    if (!m) continue;
    const ssid = m[1].trim();
    if (!/^(SmartLife-|OpenBK)/i.test(ssid) || ssid.length > 64) continue;
    const signalPercent = Number(m[3]);
    if (signalPercent < 0 || signalPercent > 100) continue;
    result.push({ ssid, macAddress: m[2].toUpperCase(), signalPercent });
  }
  return result;
}

async function scanOnce() {
  const adapters = await interfaces();
  if (!adapters.length) {
    console.warn("[hp2-wifi] No Wi-Fi adapter detected. Saved sightings remain historical.");
    return;
  }
  const found = new Map();
  for (const iface of adapters) {
    try {
      const { stdout } = await run("nmcli", ["-t", "-e", "no", "-f", "SSID,BSSID,SIGNAL",
        "device", "wifi", "list", "ifname", iface, "--rescan", "yes"],
        { timeout: 18000, maxBuffer: 524288 });
      for (const ap of readAps(stdout)) {
        const old = found.get(ap.macAddress);
        if (!old || ap.signalPercent > old.signalPercent) found.set(ap.macAddress, ap);
      }
    } catch (error) {
      console.warn("[hp2-wifi] Scan " + iface + ": " + (error?.message || error));
    }
  }
  if (!found.size) {
    console.log("[hp2-wifi] No mouse AP visible now; never infer MQTT offline from this scan.");
    return;
  }
  for (const ap of found.values()) {
    try {
      const response = await fetch(apiBase + "/api/iot/gateway/wifi-observation", {
        method: "POST",
        headers: { authorization: "Bearer " + token, "content-type": "application/json" },
        body: JSON.stringify(ap),
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) {
        console.error("[hp2-wifi] " + ap.ssid + " report HTTP " + response.status);
        continue;
      }
      console.log("[hp2-wifi] Saved " + ap.ssid + " " + ap.macAddress +
        " " + ap.signalPercent + "% (not MQTT).");
    } catch (error) {
      console.error("[hp2-wifi] Report " + ap.ssid + ": " + (error?.message || error));
    }
  }
}

console.log("[hp2-wifi] Multi-mouse read-only scanner started (25 second interval).");
while (true) {
  try { await scanOnce(); } catch (error) { console.error("[hp2-wifi] " + (error?.message || error)); }
  await new Promise(resolve => setTimeout(resolve, 25000));
}
