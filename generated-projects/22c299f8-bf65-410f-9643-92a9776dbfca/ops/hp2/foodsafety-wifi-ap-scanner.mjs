#!/usr/bin/env node
/**
 * Read-only HP2 Wi-Fi pairing AP scanner for Food Safety.
 * An ordinary website cannot access the machine's radio. Run this scanner
 * locally on HP2 Ubuntu with the existing Food Safety gateway token.
 *
 * Set:
 * PEST_CONTROL_BASE_URL=https://pestcontrol.cat
 * FOODSAFETY_IOT_GATEWAY_TOKEN=<existing HP2 service secret>
 * FOODSAFETY_WIFI_BSSID=F8:17:2D:BB:E0:B7 (optional: restrict to one known mouse)
 * FOODSAFETY_WIFI_INTERFACE=wlx24ec99a65562  (optional)
 *
 * With no BSSID filter, every visible SmartLife-/OpenBK pairing AP is observed
 * by its unique BSSID. Sightings are NOT proof of ownership or MQTT activity.
 * This never sends Wi-Fi passwords, configures devices, flashes firmware,
 * registers customer devices or creates alarms.
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
    (targetBssid && !/^([0-9A-F]{2}:){5}[0-9A-F]{2}$/.test(targetBssid)) ||
    !/^[a-zA-Z0-9_-]+$/.test(wifiInterface)) {
  console.error("[hp2-wifi] Required: HTTPS PEST_CONTROL_BASE_URL, FOODSAFETY_IOT_GATEWAY_TOKEN; optionally FOODSAFETY_WIFI_BSSID and FOODSAFETY_WIFI_INTERFACE.");
  process.exit(1);
}

const parseScanRow = (line) => {
  // nmcli -t with '-e no' exposes the BSSID's colons. Parse from the right,
  // not by splitting the line on ':' (SSID itself can include colons).
  const match = line.match(/^(.*):((?:[A-F0-9]{2}:){5}[A-F0-9]{2}):(\\d{1,3})$/i);
  if (!match || !/^(SmartLife-|OpenBK)/i.test(match[1])) return null;
  const signalPercent = Number(match[3]);
  if (!Number.isInteger(signalPercent) || signalPercent < 0 || signalPercent > 100) return null;
  return { ssid: match[1], macAddress: match[2].toUpperCase(), signalPercent };
};

const scanOnce = async () => {
  const { stdout } = await execFileAsync("nmcli",
    ["-t", "-e", "no", "-f", "SSID,BSSID,SIGNAL", "device", "wifi", "list",
      "ifname", wifiInterface, "--rescan", "yes"],
    { timeout: 18000, maxBuffer: 256 * 1024 });
  const sightings = new Map();
  for (const line of String(stdout || "").split(/\\r?\\n/)) {
    const row = parseScanRow(line);
    if (!row || (targetBssid && row.macAddress !== targetBssid)) continue;
    const prior = sightings.get(row.macAddress);
    if (!prior || row.signalPercent > prior.signalPercent) {
      sightings.set(row.macAddress, row);
    }
  }
  if (!sightings.size) {
    console.log("[hp2-wifi] No matching pairing AP visible; historic observations are not MQTT status.");
    return;
  }
  // An association does NOT mean MQTT is connected. Only report a gateway IP
  // if this radio is actually associated with the observed SSID.
  let currentConnection = "";
  let gatewayIp = "";
  try {
    const [connection, gateway] = await Promise.all([
      execFileAsync("nmcli", ["-g", "GENERAL.CONNECTION", "device", "show", wifiInterface], { timeout: 3000 }),
      execFileAsync("nmcli", ["-g", "IP4.GATEWAY", "device", "show", wifiInterface], { timeout: 3000 }),
    ]);
    currentConnection = connection.stdout.trim();
    gatewayIp = gateway.stdout.trim();
    if (!/^\\d{1,3}(?:\\.\\d{1,3}){3}$/.test(gatewayIp)) gatewayIp = "";
  } catch (_) {
    // Scanning is read-only; do not join or reconfigure any AP.
  }
  for (const row of sightings.values()) {
    const ipAddress = currentConnection === row.ssid ? gatewayIp : "";
    try {
      const response = await fetch(apiBase + "/api/iot/gateway/wifi-observation", {
        method: "POST",
        headers: {
          authorization: "Bearer " + gatewayToken,
          "content-type": "application/json",
        },
        body: JSON.stringify({ ...row, ipAddress }),
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) {
        throw new Error("Wi-Fi observation rejected (" + response.status + ").");
      }
      console.log("[hp2-wifi] Recorded " + row.ssid + " (" + row.macAddress +
        ") at " + row.signalPercent + "%; MQTT NOT verified.");
    } catch (error) {
      console.error("[hp2-wifi] " + row.macAddress + " " + (error?.message || String(error)));
    }
  }
};

console.log("[hp2-wifi] Read-only observer starting on " + wifiInterface +
  ", scope " + (targetBssid || "all SmartLife-/OpenBK pairing APs") + "; polling ~25 seconds.");
while (true) {
  try {
    await scanOnce();
  } catch (error) {
    console.error("[hp2-wifi] " + (error?.message || String(error)));
  }
  await new Promise((resolve) => setTimeout(resolve, scanIntervalMs));
}
