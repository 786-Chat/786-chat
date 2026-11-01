/**
 * Read only previously received device telemetry. Pairing-AP scans, registry
 * lifecycle status and registration are NOT proof of physical mouse power.
 * The owned IoT API currently supplies battery and RSSI, but does not supply
 * a physical switch reading; show "Not verified" until it does.
 */
type Reading = { code?: unknown; name?: unknown; value?: unknown };

export function ownedMouseReadings(lastStatus: unknown, lastCheckedAt: unknown) {
  const reportedAt = typeof lastCheckedAt === "string" || typeof lastCheckedAt === "number"
    ? new Date(lastCheckedAt).getTime()
    : Number.NaN;
  const hasReport = Number.isFinite(reportedAt) && reportedAt > 0;
  const entries: Reading[] = Array.isArray(lastStatus) ? lastStatus : [];
  const get = (pattern: RegExp) =>
    entries.find(item => item && pattern.test(String(item.code ?? item.name ?? "").trim().toLowerCase()))?.value;

  const batteryRaw = get(/^battery(?:_percentage|_percent|_pct|_level)?$/);
  const batteryNumber = batteryRaw === null || batteryRaw === undefined || batteryRaw === ""
    ? Number.NaN : Number(String(batteryRaw).replace(/%$/, "").trim());
  const batteryLabel = hasReport && Number.isFinite(batteryNumber) && batteryNumber >= 0 && batteryNumber <= 100
    ? `${batteryNumber}% (last report)`
    : "Not verified";

  // DO NOT treat the generic "status" field as ON/OFF. The server uses it
  // for online/offline/awaiting_activation, not for the physical switch.
  const powerRaw = get(/^(?:switch(?:_?\d+)?|power|power_state|device_power|on_off)$/);
  const normalized = typeof powerRaw === "boolean" ? String(powerRaw) : String(powerRaw ?? "").trim().toLowerCase();
  const powerValue = ["on", "true", "1"].includes(normalized)
    ? "ON"
    : ["off", "false", "0"].includes(normalized) ? "OFF" : null;
  const powerLabel = hasReport && powerValue ? `${powerValue} (last report)` : "Not verified";

  const rssiRaw = get(/^rssi$/);
  const rssi = rssiRaw === null || rssiRaw === undefined || rssiRaw === "" ? Number.NaN : Number(rssiRaw);
  const mqttSignalLabel = hasReport && Number.isFinite(rssi) ? `${rssi} dBm (last report)` : null;

  return { batteryLabel, powerLabel, mqttSignalLabel, hasReport };
}
