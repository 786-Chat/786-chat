// @ts-nocheck
/**
 * OPTIONAL Smart Life APP cloud bridge test.
 * This is entirely isolated from SmartLife manual and Food Safety Owned IoT.
 * An authenticated Home Assistant reporter may supply genuine observed states.
 * No simulated data, no automatic branch assignment, and no customer alarms.
 *
 * Configure SMARTLIFE_APP_TEST_BRIDGE_TOKEN on the preview server only.
 * A separate authorised Home Assistant Tuya integration is required to
 * actually observe a mobile Smart Life account/device.
 */
import type { Express } from "express";
import { timingSafeEqual } from "node:crypto";
import { db } from "./db.js";
import { sql } from "drizzle-orm";

const rows = (r: any): any[] => Array.isArray(r) ? r : (r?.rows || []);
const tokenValue = () => String(process.env.SMARTLIFE_APP_TEST_BRIDGE_TOKEN || "").trim();

function safeBearer(header: unknown): boolean {
  const secret = tokenValue();
  if (secret.length < 32 || typeof header !== "string" || !header.startsWith("Bearer ")) return false;
  const supplied = header.slice(7).trim();
  if (supplied.length !== secret.length || !supplied) return false;
  return timingSafeEqual(Buffer.from(supplied), Buffer.from(secret));
}
const named = (x: unknown, max: number): string => typeof x === "string" ? x.trim().slice(0, max) : "";
const fieldNumber = (value: unknown, lo: number, hi: number): number | null => {
  if (typeof value !== "number" || !Number.isFinite(value) || value < lo || value > hi) return null;
  return value;
};

export function registerSmartLifeAppTestRoutes(app: Express, adminOnly: any) {
  let initialization: Promise<void> | null = null;
  const ensure = async () => {
    if (!initialization) {
      initialization = db.execute(sql`
        CREATE TABLE IF NOT EXISTS smartlife_app_test_readings (
          device_key text PRIMARY KEY,
          device_name text NOT NULL DEFAULT '',
          source text NOT NULL DEFAULT 'home-assistant-tuya',
          battery_percent integer,
          wifi_signal_dbm integer,
          connection_status text,
          mouse_caught boolean,
          last_caught_at timestamptz,
          last_reported_at timestamptz NOT NULL DEFAULT now(),
          created_at timestamptz NOT NULL DEFAULT now()
        )
      `).then(() => undefined).catch((error: unknown) => { initialization = null; throw error; });
    }
    return initialization;
  };

  // Admin-only read. Never returns a token, Smart Life credentials, or raw cloud payloads.
  app.get("/api/admin/smartlife-app-test/status", adminOnly, async (_req, res) => {
    try {
      res.set("Cache-Control", "private, no-store");
      await ensure();
      const result: any = await db.execute(sql`
        SELECT device_key, device_name, source, battery_percent,
               wifi_signal_dbm, connection_status, mouse_caught,
               last_caught_at, last_reported_at
        FROM smartlife_app_test_readings
        ORDER BY last_reported_at DESC LIMIT 100
      `);
      const devices = rows(result).map((r: any) => ({
        deviceKey: r.device_key, name: r.device_name || r.device_key,
        source: r.source, battery: r.battery_percent == null ? null : Number(r.battery_percent),
        wifiSignalDbm: r.wifi_signal_dbm == null ? null : Number(r.wifi_signal_dbm),
        connection: r.connection_status || null,
        caught: r.mouse_caught == null ? null : Boolean(r.mouse_caught),
        lastCaughtAt: r.last_caught_at || null,
        lastReportedAt: r.last_reported_at || null,
      }));
      return res.json({
        bridgeConfigured: tokenValue().length >= 32,
        connected: devices.some(d => d.lastReportedAt && Date.now() - new Date(d.lastReportedAt).getTime() >= 0 &&
          Date.now() - new Date(d.lastReportedAt).getTime() < 180000),
        latestReportAt: devices[0]?.lastReportedAt || null,
        devices,
        note: "Separate test events from authorised Home Assistant only. Does not read mobile Smart Life directly.",
      });
    } catch (error: any) {
      console.error("SmartLife App Test read error:", error?.message || error);
      return res.status(500).json({ message: "Could not load isolated Smart Life app test." });
    }
  });

  // Only an independently connected, authorised Home Assistant bridge can report.
  // Reject unauthorised or unsupported payloads. Never write to manual
  // smartlife_devices/smartlife_alerts or owned_iot_* tables.
  app.post("/api/integrations/smartlife-app-test/report", async (req, res) => {
    res.set("Cache-Control", "no-store");
    if (!safeBearer(req.headers.authorization)) return res.status(401).json({ message: "Bridge not authorised or not configured." });
    try {
      const value = req.body;
      if (!value || typeof value !== "object" || Array.isArray(value)) return res.status(400).json({ message: "Expected one device report." });
      if (value.source !== "home-assistant-tuya") return res.status(400).json({ message: "Only the configured Home Assistant Tuya bridge is accepted." });
      const key = named(value.deviceKey, 120);
      if (!/^[a-zA-Z0-9_.:-]{3,120}$/.test(key)) return res.status(400).json({ message: "Invalid device key." });
      const deviceName = named(value.deviceName, 100);
      const hasBattery = Object.prototype.hasOwnProperty.call(value, "battery");
      const hasSignal = Object.prototype.hasOwnProperty.call(value, "wifiSignalDbm");
      const hasConnection = Object.prototype.hasOwnProperty.call(value, "connection");
      const hasCaught = Object.prototype.hasOwnProperty.call(value, "caught");
      if (![hasBattery, hasSignal, hasConnection, hasCaught].some(Boolean)) return res.status(400).json({ message: "No device reading supplied." });
      if (hasBattery && value.battery !== null && (!Number.isInteger(value.battery) || fieldNumber(value.battery, 0, 100) === null)) return res.status(400).json({ message: "Invalid battery percentage." });
      if (hasSignal && value.wifiSignalDbm !== null && (!Number.isInteger(value.wifiSignalDbm) || fieldNumber(value.wifiSignalDbm, -120, 0) === null)) return res.status(400).json({ message: "Invalid signal strength." });
      if (hasConnection && value.connection !== null && !["connected", "disconnected", "unknown"].includes(value.connection)) return res.status(400).json({ message: "Invalid connection status." });
      if (hasCaught && value.caught !== null && typeof value.caught !== "boolean") return res.status(400).json({ message: "Invalid mouse-caught state." });
      await ensure();
      const battery = hasBattery ? value.battery : null;
      const signal = hasSignal ? value.wifiSignalDbm : null;
      const connection = hasConnection ? value.connection : null;
      const caught = hasCaught ? value.caught : null;
      const lastCaughtAt = caught === true ? new Date().toISOString() : null;
      await db.execute(sql`
        INSERT INTO smartlife_app_test_readings (
          device_key, device_name, source, battery_percent, wifi_signal_dbm,
          connection_status, mouse_caught, last_caught_at, last_reported_at
        ) VALUES (
          ${key}, ${deviceName}, 'home-assistant-tuya', ${battery},
          ${signal}, ${connection}, ${caught}, ${lastCaughtAt}::timestamptz, now()
        )
        ON CONFLICT (device_key) DO UPDATE SET
          device_name = CASE WHEN EXCLUDED.device_name <> '' THEN EXCLUDED.device_name ELSE smartlife_app_test_readings.device_name END,
          battery_percent = CASE WHEN ${hasBattery} THEN EXCLUDED.battery_percent ELSE smartlife_app_test_readings.battery_percent END,
          wifi_signal_dbm = CASE WHEN ${hasSignal} THEN EXCLUDED.wifi_signal_dbm ELSE smartlife_app_test_readings.wifi_signal_dbm END,
          connection_status = CASE WHEN ${hasConnection} THEN EXCLUDED.connection_status ELSE smartlife_app_test_readings.connection_status END,
          last_caught_at = CASE
            WHEN ${hasCaught} AND EXCLUDED.mouse_caught = true AND smartlife_app_test_readings.mouse_caught IS DISTINCT FROM true
              THEN now() ELSE smartlife_app_test_readings.last_caught_at END,
          mouse_caught = CASE WHEN ${hasCaught} THEN EXCLUDED.mouse_caught ELSE smartlife_app_test_readings.mouse_caught END,
          last_reported_at = now()
      `);
      return res.json({ saved: true, deviceKey: key, destination: "isolated-test-only" });
    } catch (error: any) {
      console.error("SmartLife App Test bridge error:", error?.message || error);
      return res.status(500).json({ message: "Could not save test report." });
    }
  });
}
