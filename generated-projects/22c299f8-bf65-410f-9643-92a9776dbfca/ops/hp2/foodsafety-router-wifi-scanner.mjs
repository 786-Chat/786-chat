#!/usr/bin/env node
/**
 * OPTIONAL read-only HP2 router Wi-Fi scanner for Food Safety Admin preview.
 *
 * Reads *local nearby access points* using NetworkManager's nmcli, then posts
 * SSID, frequency and signal ONLY to the authenticated Food Safety preview.
 * Never requests a password, joins an AP, changes gateway settings, resets a
 * mouse, flashes firmware or emits MQTT connectivity events.
 *
 * Environment:
 * FOODSAFETY_IOT_GATEWAY_TOKEN: existing HP2 gateway secret (never printed).
 * FOODSAFETY_ROUTER_SCAN_REPORT_URL: HTTPS preview endpoint ending in
 *   /api/iot/gateway/router-wifi-scan.
 * FOODSAFETY_WIFI_INTERFACE: optional, defaults to the existing HP2 TP-Link.
 *
 * Usage: node ... --self-test; node ... --once; node ... (every 75 seconds)
 */
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execFile);

function parseWifi(output) {
  const result = new Map();
  for (const line of String(output).split(/\r?\n/)) {
    const match = line.trim().replace(/^\*\s+/, "").match(/^(.+?)\s+(\d{4})\s*MHz\s+(\d{1,3})\s*$/i);
    if (!match) continue;
    const ssid = match[1].trim();
    const frequency = Number(match[2]);
    const signal = Number(match[3]);
    if (!ssid || ssid === "--" || ssid.length > 64 || /[\x00-\x1F\x7F]/.test(ssid) ||
        /^(SmartLife-|OpenBK)/i.test(ssid) || frequency < 2400 || frequency > 5900 ||
        signal < 0 || signal > 100) continue;
    const key = ssid + ":" + frequency;
    const previous = result.get(key);
    if (!previous || previous.signal < signal) result.set(key, { ssid, frequency, signal });
  }
  return [...result.values()].sort((a, b) =>
    Number(a.frequency >= 2500) - Number(b.frequency >= 2500) ||
    b.signal - a.signal).slice(0, 64);
}

if (process.argv.includes("--self-test")) {
  const rows = parseWifi("SSID FREQ SIGNAL\nVM1530649 2437 MHz 100\nVM1530649 5540 MHz 100\nSmartLife-203B 2462 MHz 83\nExample Cafe 2412 MHz 42");
  if (rows.length !== 3 || rows[0].ssid !== "VM1530649" ||
      rows[0].frequency !== 2437 || rows[1].ssid !== "Example Cafe" ||
      rows[2].frequency !== 5540) throw Error("HP2 router scan parser failed");
  console.log("PASS: router scan parser, 2.4/5 GHz frequencies, factory AP filter");
  process.exit(0);
}

const token = String(process.env.FOODSAFETY_IOT_GATEWAY_TOKEN || "").trim();
const target = String(process.env.FOODSAFETY_ROUTER_SCAN_REPORT_URL || "").trim();
const iface = String(process.env.FOODSAFETY_WIFI_INTERFACE || "wlxe4fac420a7a9").trim();
let url;
try { url = new URL(target); } catch { /* verified below */ }
if (!token || !url || url.protocol !== "https:" ||
    !url.hostname.endsWith(".vercel.app") ||
    url.pathname !== "/api/iot/gateway/router-wifi-scan" ||
    !/^[a-zA-Z0-9_-]{3,64}$/.test(iface)) {
  console.error("[router-wifi] Require existing protected gateway token, valid preview URL, and safe Wi-Fi interface.");
  process.exit(2);
}

async function scanOnce() {
  const { stdout } = await exec("nmcli",
    ["-f", "SSID,FREQ,SIGNAL", "device", "wifi", "list", "ifname", iface, "--rescan", "yes"],
    { timeout: 22000, maxBuffer: 1024 * 1024 });
  const networks = parseWifi(stdout);
  const response = await fetch(url, {
    method: "POST",
    headers: { authorization: "Bearer " + token, "content-type": "application/json" },
    body: JSON.stringify({ networks }),
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) {
    console.error("[router-wifi] Preview did not accept router scan (HTTP " + response.status + ").");
    process.exitCode = 1;
    return;
  }
  console.log("[router-wifi] Preview accepted " + networks.length +
    " local router observations; no passwords or mouse connection involved.");
}

if (process.argv.includes("--once")) {
  try { await scanOnce(); }
  catch (error) { console.error("[router-wifi] Scan failed: " + error.message); process.exitCode = 1; }
} else {
  console.log("[router-wifi] Optional read-only local router scan every 75 seconds.");
  while (true) {
    try { await scanOnce(); }
    catch (error) { console.error("[router-wifi] " + error.message); }
    await new Promise(resolve => setTimeout(resolve, 75000));
  }
}
