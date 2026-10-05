// @ts-nocheck
import type { Express, Request } from "express";
import { randomUUID, timingSafeEqual } from "crypto";
import { sql } from "drizzle-orm";
import { db } from "./db.js";

const GATEWAY_TOKEN_ENV = "FOODSAFETY_IOT_GATEWAY_TOKEN";
const ALLOWED_EVENT_TYPES = new Set([
  "trap_triggered",
  "trap_reset",
  "heartbeat",
  "online",
  "offline",
]);

function rowsFrom(result: any): any[] {
  return Array.isArray(result) ? result : (result?.rows || []);
}

function requestToken(req: Request): string {
  const header = String(req.get("x-foodsafety-gateway-token") || "").trim();
  if (header) return header;

  const auth = String(req.get("authorization") || "").trim();
  if (/^Bearer\s+/i.test(auth)) return auth.replace(/^Bearer\s+/i, "").trim();
  return "";
}

function tokenMatches(provided: string, expected: string): boolean {
  if (!provided || !expected) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function integerOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : null;
}

function eventValue(type: string, value: unknown): unknown {
  if (value !== undefined) return value;
  if (type === "trap_triggered") return true;
  if (type === "trap_reset") return false;
  if (type === "online") return true;
  if (type === "offline") return false;
  return null;
}

export function registerOwnedIotGatewayRoutes(app: Express): void {
  app.get("/api/iot/gateway/health", (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json({
      status: "ok",
      provider: "Food Safety Owned IoT",
      configured: Boolean(process.env[GATEWAY_TOKEN_ENV]?.trim()),
    });
  });

  app.post("/api/iot/gateway/events", async (req, res) => {
    try {
      const expectedToken = String(process.env[GATEWAY_TOKEN_ENV] || "").trim();
      if (!expectedToken) {
        return res.status(503).json({
          message: "Food Safety IoT gateway token is not configured",
          code: "IOT_GATEWAY_NOT_CONFIGURED",
        });
      }

      if (!tokenMatches(requestToken(req), expectedToken)) {
        return res.status(401).json({
          message: "Invalid Food Safety IoT gateway token",
          code: "IOT_GATEWAY_UNAUTHORIZED",
        });
      }

      const body = req.body && typeof req.body === "object" ? req.body : {};
      const deviceId = String(body.deviceId || body.device_id || "").trim();
      const type = String(body.type || body.eventType || body.event_type || "").trim();

      if (!deviceId) {
        return res.status(400).json({ message: "deviceId is required", code: "DEVICE_ID_REQUIRED" });
      }
      if (!ALLOWED_EVENT_TYPES.has(type)) {
        return res.status(400).json({
          message: `Unsupported event type: ${type || "(empty)"}`,
          code: "INVALID_EVENT_TYPE",
        });
      }

      const deviceResult: any = await db.execute(sql`
        SELECT id, device_id, branch_id, friendly_name, installation_location
        FROM owned_iot_devices
        WHERE device_id = ${deviceId}
        LIMIT 1
      `);
      const device = rowsFrom(deviceResult)[0];
      if (!device) {
        return res.status(404).json({
          message: `Food Safety device ${deviceId} is not registered`,
          code: "DEVICE_NOT_REGISTERED",
        });
      }

      if (!device.branch_id) {
        return res.status(409).json({
          message: `Food Safety device ${deviceId} is not assigned to a branch`,
          code: "DEVICE_UNASSIGNED",
        });
      }

      await db.execute(sql`ALTER TABLE owned_iot_events ADD COLUMN IF NOT EXISTS branch_id uuid`);
      await db.execute(sql`ALTER TABLE owned_iot_events ADD COLUMN IF NOT EXISTS friendly_name text`);
      await db.execute(sql`ALTER TABLE owned_iot_events ADD COLUMN IF NOT EXISTS installation_location text`);

      const suppliedEventId = String(body.eventId || body.event_id || "").trim();
      const eventId = suppliedEventId || randomUUID();

      const duplicateResult: any = await db.execute(sql`
        SELECT event_id
        FROM owned_iot_events
        WHERE event_id = ${eventId}
        LIMIT 1
      `);
      if (rowsFrom(duplicateResult).length > 0) {
        return res.status(200).json({ success: true, duplicate: true, eventId, deviceId, type });
      }

      const rssi = integerOrNull(body.rssi);
      const batteryPct = integerOrNull(body.batteryPct ?? body.battery_pct ?? body.battery);
      const value = eventValue(type, body.value);
      const valueJson = JSON.stringify(value ?? null);
      const rawJson = JSON.stringify({
        source: "hp2-mqtt-gateway",
        ...body,
        deviceId,
        type,
        eventId,
      });

      if (type === "trap_triggered") {
        await db.execute(sql`
          UPDATE owned_iot_devices
          SET is_online = true,
              lifecycle_state = 'active',
              last_seen_at = now(),
              last_alarm_at = now(),
              last_event_id = ${eventId},
              rssi = COALESCE(${rssi}, rssi),
              battery_pct = COALESCE(${batteryPct}, battery_pct),
              updated_at = now()
          WHERE device_id = ${deviceId}
        `);
      } else if (type === "trap_reset") {
        await db.execute(sql`
          UPDATE owned_iot_devices
          SET is_online = true,
              lifecycle_state = 'active',
              last_seen_at = now(),
              last_alarm_at = NULL,
              last_event_id = ${eventId},
              rssi = COALESCE(${rssi}, rssi),
              battery_pct = COALESCE(${batteryPct}, battery_pct),
              updated_at = now()
          WHERE device_id = ${deviceId}
        `);
      } else if (type === "offline") {
        await db.execute(sql`
          UPDATE owned_iot_devices
          SET is_online = false,
              lifecycle_state = CASE WHEN lifecycle_state = 'awaiting_activation' THEN 'active' ELSE lifecycle_state END,
              last_seen_at = now(),
              last_event_id = ${eventId},
              rssi = COALESCE(${rssi}, rssi),
              battery_pct = COALESCE(${batteryPct}, battery_pct),
              updated_at = now()
          WHERE device_id = ${deviceId}
        `);
      } else {
        await db.execute(sql`
          UPDATE owned_iot_devices
          SET is_online = true,
              lifecycle_state = 'active',
              last_seen_at = now(),
              last_event_id = ${eventId},
              rssi = COALESCE(${rssi}, rssi),
              battery_pct = COALESCE(${batteryPct}, battery_pct),
              updated_at = now()
          WHERE device_id = ${deviceId}
        `);
      }

      await db.execute(sql`
        INSERT INTO owned_iot_events
          (event_id, device_id, branch_id, friendly_name, installation_location, event_type, event_value, event_at, raw_payload)
        VALUES
          (${eventId}, ${deviceId}, ${device.branch_id}::uuid, ${device.friendly_name || null}, ${device.installation_location || null}, ${type}, CAST(${valueJson} AS jsonb), now(), CAST(${rawJson} AS jsonb))
      `);

      return res.status(202).json({
        success: true,
        eventId,
        deviceId,
        type,
        alarmActive: type === "trap_triggered" ? true : type === "trap_reset" ? false : undefined,
      });
    } catch (error: any) {
      console.error("Food Safety IoT gateway event ingest failed:", error?.message || error);
      return res.status(500).json({
        message: "Food Safety IoT gateway event ingest failed",
        code: "IOT_GATEWAY_INGEST_FAILED",
      });
    }
  });
}
