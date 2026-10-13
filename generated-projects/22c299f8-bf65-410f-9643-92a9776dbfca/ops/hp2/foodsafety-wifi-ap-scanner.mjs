#!/usr/bin/env node
/**
 * Read-only HP2 Wi-Fi pairing AP scanner for Food Safety.
 * An ordinary website cannot access the machine's radio. Run this scanner
 * locally on HP2 Ubuntu with the existing Food Safety gateway token.
 *
 * Set:
 * PEST_CONTROL_BASE_URL=https://pestcontrol.cat
 * FOODSAFETY_IOT_GATEWAY_TOKEN=<existing HP2 service secret>
 * FOODSAFETY_WIFI_BSSID=F8:17:2D:BB:E0:B7
 * FOODSAFETY_WIFI_INTERFACE=wlx24ec99a65562  (optional)
 *
 * Only the explicitly configured BSSID is reported. This never sends Wi-Fi
 * passwords, does not configure devices, flash firmware or create alarms.
 * Missing AP scan is NOT an MQTT offline event; the UI expires observations.
 */
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const apiBase = String(process.env.PEST_CONTROL_BASE_URL || "").trim().replace(/\/+$/, "");
const gatewayToken = String(process.env.FOODSAFETY_IOT_GATEWAY_TOKEN || "").trim();
const targetBssid = String(process.env.FOODSAFETY_WIFI_BSSID || "").trim().replace(/-/g, ":").toUpperCase();
const wifiInterface = String(process.env.FOODSAFETY_WIFI_INTERFACE || "wlx24ec99a65562").trim();
const scanIntervalMs = 25000;

if (!/^https:\/\//.test(apiBase) || !gatewayToken ||
    !/^([0-9A-F]{2}:){5}[0-9A-F]{2}$/.test(targetBssid) ||
    !/^[a-zA-Z0-9_-]+$/.test(wifiInterface)) {
  console.error("[hp2-wifi] Required: HTTPS PEST_CONTROL_BASE_URL, FOODSAFETY_IOT_GATEWAY_TOKEN, FOODSAFETY_WIFI_BSSID; optionally FOODSAFETY_WIFI_INTERFACE.");
  process.exit(1);
}

const scanOnce = async () => {
  const { stdout } = await execFileAsync("nmcli",
    ["-t", "-e", "no", "-f", "SSID,BSSID,SIGNAL", "device", "wifi", "list",
      "ifname", wifiInterface, "--rescan", "yes"],
    { timeout: 18000, maxBuffer: 256 * 1024 });
  const found = String(stdout || "").split(/\r?\n/).map((line) =>
    line.match(/^(.*):((?:[A-F0-9]{2}:){5}[A-F0-9]{2}):(\d{1,3})$/i),
  ).find((match) => match && match[2].toUpperCase() === targetBssid);
  if (!found) {
    console.log("[hp2-wifi] Pairing AP not visible; last observation retained as historic.");
    return;
  }
  const ssid = found[1];
  if (!/^(SmartLife-|OpenBK)/i.test(ssid)) {
    console.log("[hp2-wifi] Target BSSID is present but SSID is not a supported pairing AP.");
    return;
  }
  const signalPercent = Number(found[3]);

  // IP4.GATEWAY is only this AP's address when this radio has associated
  // with the same SSID. Never attribute the home router IP to the trap.
  let ipAddress = "";
  try {
    const [connection, gateway] = await Promise.all([
      execFileAsync("nmcli", ["-g", "GENERAL.CONNECTION", "device", "show", wifiInterface], { timeout: 3000 }),
      execFileAsync("nmcli", ["-g", "IP4.GATEWAY", "device", "show", wifiInterface], { timeout: 3000 }),
    ]);
    if (connection.stdout.trim() === ssid) {
      const value = gateway.stdout.trim();
      if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(value)) ipAddress = value;
    }
  } catch (_) {
    // Scanning a broadcasting AP does not require joining it.
  }
  const response = await fetch(apiBase + "/api/iot/gateway/wifi-observation", {
    method: "POST",
    headers: {
      authorization: "Bearer " + gatewayToken,
      "content-type": "application/json",
    },
    body: JSON.stringify({ ssid, macAddress: targetBssid, ipAddress, signalPercent }),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) {
    throw new Error("Wi-Fi observation was not accepted (" + response.status + ").");
  }
  console.log("[hp2-wifi] Recorded " + ssid + " at " + signalPercent +
    "% for BSSID " + targetBssid + " (MQTT NOT connected).");
};

console.log("[hp2-wifi] Read-only observer starting on " + wifiInterface +
  ", BSSID " + targetBssid + "; polling ~25 seconds.");
while (true) {
  try {
    await scanOnce();
  } catch (error) {
    console.error("[hp2-wifi] " + (error?.message || String(error)));
  }
  await new Promise((resolve) => setTimeout(resolve, scanIntervalMs));
}
