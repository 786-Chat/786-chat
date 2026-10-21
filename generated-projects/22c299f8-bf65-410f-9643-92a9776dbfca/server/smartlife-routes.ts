// @ts-nocheck

/**
 * SmartLife management. Separate tables/endpoints from Food Safety Owned IoT.
 * SmartLife readings and alerts are explicitly entered/sent by authorised admin;
 * there is NO claim of Tuya cloud/API integration in this module.
 * Every restaurant API scopes by the authenticated session's branchId.
 */
// @ts-nocheck
import type { Express } from "express";
import { db } from "./db.js";
import { storage } from "./storage.js";
import { sql } from "drizzle-orm";

type Section = "smartlife-alert" | "smartlife-devices";
const columns = ["smartlife-alert", "smartlife-devices"];
const rows = (value: any): any[] => Array.isArray(value) ? value : (value?.rows || []);
const validUuid = (value: unknown): value is string =>
  typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
const shortText = (value: unknown, max = 100) =>
  String(value ?? "").trim().slice(0, max);
const publicDevice = (device: any) => ({
  id: device.id, branchId: device.branch_id, deviceCode: device.device_code,
  name: device.display_name, installationArea: device.installation_area,
  batteryPercent: device.battery_percent, connectionStatus: device.connection_status,
  trapStatus: device.trap_status, signalDbm: device.signal_dbm,
  notes: device.notes, updatedAt: device.updated_at,
  activeCaughtCount: Number(device.active_caught_count || 0),
});
const publicAlert = (alert: any) => ({
  id: alert.id, branchId: alert.branch_id, deviceId: alert.device_id,
  deviceCode: alert.device_code, deviceName: alert.device_name,
  installationArea: alert.installation_area, caughtCount: alert.caught_count,
  message: alert.message, sentAt: alert.sent_at,
  acknowledgedAt: alert.acknowledged_at,
  archivedAt: alert.archived_at || null,
  archivedBy: alert.archived_by || null,
  archiveNote: alert.archive_note || null,
});

export function registerSmartLifeRoutes(app: Express, adminOnly: any) {
  let initPromise: Promise<void> | null = null;
  const init = async (): Promise<void> => {
    if (!initPromise) {
      initPromise = (async () => {
        // Completely independent tables: no owned_iot_* tables read or modified.
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS smartlife_devices (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            branch_id uuid NOT NULL,
            device_code text NOT NULL UNIQUE,
            display_name text NOT NULL,
            installation_area text NOT NULL DEFAULT '',
            battery_percent integer CHECK (battery_percent BETWEEN 0 AND 100),
            connection_status text NOT NULL DEFAULT 'unknown'
              CHECK (connection_status IN ('unknown','connected','disconnected')),
            trap_status text NOT NULL DEFAULT 'ready'
              CHECK (trap_status IN ('ready','caught','service_required')),
            signal_dbm integer,
            notes text NOT NULL DEFAULT '',
            updated_at timestamptz NOT NULL DEFAULT now(),
            created_at timestamptz NOT NULL DEFAULT now(),
            archived_at timestamptz
          )
        `);
        await db.execute(sql`
          CREATE INDEX IF NOT EXISTS smartlife_devices_branch_idx
          ON smartlife_devices (branch_id, archived_at, updated_at)
        `);
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS smartlife_alerts (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            branch_id uuid NOT NULL,
            device_id uuid NOT NULL REFERENCES smartlife_devices(id) ON DELETE RESTRICT,
            device_code text NOT NULL,
            device_name text NOT NULL,
            installation_area text NOT NULL DEFAULT '',
            caught_count integer NOT NULL CHECK (caught_count BETWEEN 1 AND 50),
            message text NOT NULL DEFAULT '',
            sent_at timestamptz NOT NULL DEFAULT now(),
            acknowledged_at timestamptz
          )
        `);
        await db.execute(sql`
          ALTER TABLE smartlife_alerts ADD COLUMN IF NOT EXISTS archived_at timestamptz
        `);
        await db.execute(sql`
          ALTER TABLE smartlife_alerts ADD COLUMN IF NOT EXISTS archived_by text
        `);
        await db.execute(sql`
          ALTER TABLE smartlife_alerts ADD COLUMN IF NOT EXISTS archive_note text
        `);
        // Delete in Admin history means hide from the visible list, not erase a service audit.
        // Additive migration: existing SmartLife alerts and Food Safety records are preserved.
        await db.execute(sql`
          ALTER TABLE smartlife_alerts ADD COLUMN IF NOT EXISTS deleted_at timestamptz
        `);
        await db.execute(sql`
          ALTER TABLE smartlife_alerts ADD COLUMN IF NOT EXISTS deleted_by text
        `);
        await db.execute(sql`
          CREATE INDEX IF NOT EXISTS smartlife_alerts_branch_idx
          ON smartlife_alerts (branch_id, sent_at DESC)
        `);
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS smartlife_branch_visibility (
            branch_id uuid PRIMARY KEY,
            alert_visible boolean NOT NULL DEFAULT false,
            devices_visible boolean NOT NULL DEFAULT false,
            updated_at timestamptz NOT NULL DEFAULT now()
          )
        `);
      })().catch((err) => { initPromise = null; throw err; });
    }
    return initPromise;
  };

  const branchIdFromSession = (req: any): string | null => {
    const session = req.session as any;
    return session?.userType === "branch" && validUuid(session?.branchId) ? session.branchId : null;
  };
  const branchExists = async (id: string) => validUuid(id) && Boolean(await storage.getBranch(id));
  const visibilityFor = async (branchId: string) => {
    await init();
    const result = rows(await db.execute(sql`
      SELECT alert_visible, devices_visible FROM smartlife_branch_visibility
      WHERE branch_id = ${branchId}::uuid
    `));
    return {
      smartlifeAlert: result[0]?.alert_visible === true,
      smartlifeDevices: result[0]?.devices_visible === true,
    };
  };
  const denied = (res: any) => res.status(401).json({message: "Restaurant login required."});
  const fail = (res: any, err: any) => {
    console.error("SmartLife route error", err?.message || err);
    return res.status(500).json({message: "SmartLife action could not be completed."});
  };

  // Visibility API is independent of original Device Check/Smart Devices preferences.
  app.get("/api/admin/smartlife/visibility", adminOnly, async (req, res) => {
    try {
      const branchId = String(req.query.branchId || "");
      if (!await branchExists(branchId)) return res.status(404).json({message: "Branch not found."});
      res.setHeader("Cache-Control", "no-store");
      res.json({branchId, ...await visibilityFor(branchId)});
    } catch (err) { fail(res, err); }
  });
  app.post("/api/admin/smartlife/visibility", adminOnly, async (req, res) => {
    try {
      const {branchId, sectionKey, visible} = req.body || {};
      if (!await branchExists(branchId) || !columns.includes(sectionKey) || typeof visible !== "boolean")
        return res.status(400).json({message:"Select a valid branch, section and Show/Hide option."});
      await init();
      if (sectionKey === "smartlife-alert") {
        await db.execute(sql`
          INSERT INTO smartlife_branch_visibility (branch_id, alert_visible, updated_at)
          VALUES (${branchId}::uuid, ${visible}, now())
          ON CONFLICT (branch_id) DO UPDATE
          SET alert_visible=excluded.alert_visible, updated_at=now()
        `);
      } else {
        await db.execute(sql`
          INSERT INTO smartlife_branch_visibility (branch_id, devices_visible, updated_at)
          VALUES (${branchId}::uuid, ${visible}, now())
          ON CONFLICT (branch_id) DO UPDATE
          SET devices_visible=excluded.devices_visible, updated_at=now()
        `);
      }
      res.json({success:true, branchId, ...await visibilityFor(branchId)});
    } catch (err) { fail(res, err); }
  });
  app.get("/api/branch/smartlife/visibility", async (req, res) => {
    const id = branchIdFromSession(req);
    if (!id) return denied(res);
    try {
      res.setHeader("Cache-Control", "no-store");
      res.json(await visibilityFor(id));
    } catch (err) { fail(res, err); }
  });

  // Never list devices across branches to a restaurant.
  const listDevices = async (branchId: string) => {
    await init();
    return rows(await db.execute(sql`
      SELECT d.id,d.branch_id,d.device_code,d.display_name,d.installation_area,
        d.battery_percent,d.connection_status,d.trap_status,d.signal_dbm,d.notes,
        d.updated_at,
        COALESCE((
          SELECT SUM(a.caught_count)::integer
          FROM smartlife_alerts a
          WHERE a.branch_id = d.branch_id
            AND a.device_id = d.id
            AND a.acknowledged_at IS NULL
        ), 0) AS active_caught_count
      FROM smartlife_devices d
      WHERE d.branch_id = ${branchId}::uuid AND d.archived_at IS NULL
      ORDER BY d.created_at ASC, d.device_code ASC
    `)).map(publicDevice);
  };
  app.get("/api/admin/smartlife/devices", adminOnly, async (req, res) => {
    try {
      const id = String(req.query.branchId || "");
      if (!await branchExists(id)) return res.status(400).json({message:"Select a valid restaurant."});
      res.setHeader("Cache-Control", "no-store");
      res.json(await listDevices(id));
    } catch (err) { fail(res, err); }
  });
  app.get("/api/branch/smartlife/devices", async (req, res) => {
    const id = branchIdFromSession(req);
    if (!id) return denied(res);
    try {
      if (!(await visibilityFor(id)).smartlifeDevices) return res.status(403).json({message:"Section hidden."});
      res.setHeader("Cache-Control", "no-store");
      res.json(await listDevices(id));
    } catch (err) { fail(res, err); }
  });

  const readDevice = (payload: any) => {
    const deviceCode = shortText(payload?.deviceCode, 48).toUpperCase();
    const name = shortText(payload?.name, 100);
    const area = shortText(payload?.installationArea, 100);
    const conn = String(payload?.connectionStatus || "unknown");
    const trap = String(payload?.trapStatus || "ready");
    const batt = payload?.batteryPercent === "" || payload?.batteryPercent == null
      ? null : Number(payload.batteryPercent);
    const signal = payload?.signalDbm === "" || payload?.signalDbm == null
      ? null : Number(payload.signalDbm);
    const notes = shortText(payload?.notes, 500);
    if (!/^SL-[A-Z0-9-]{3,44}$/.test(deviceCode) || !name || !area
        || !["unknown","connected","disconnected"].includes(conn)
        || !["ready","caught","service_required"].includes(trap)
        || (batt !== null && (!Number.isInteger(batt) || batt<0 || batt>100))
        || (signal !== null && (!Number.isInteger(signal) || signal< -150 || signal>0))) {
      return null;
    }
    return { deviceCode,name,area,conn,trap,batt,signal,notes };
  };
  app.post("/api/admin/smartlife/devices", adminOnly, async (req, res) => {
    try {
      const branchId = String(req.body?.branchId || "");
      const data = readDevice(req.body);
      if (!await branchExists(branchId) || !data)
        return res.status(400).json({message:"Select a branch; enter unique SL- ID, name, installation area and valid device readings."});
      await init();
      const created = rows(await db.execute(sql`
        INSERT INTO smartlife_devices
          (branch_id,device_code,display_name,installation_area,battery_percent,
           connection_status,trap_status,signal_dbm,notes)
        VALUES
          (${branchId}::uuid,${data.deviceCode},${data.name},${data.area},${data.batt},
           ${data.conn},${data.trap},${data.signal},${data.notes})
        ON CONFLICT (device_code) DO NOTHING
        RETURNING id,branch_id,device_code,display_name,installation_area,battery_percent,
          connection_status,trap_status,signal_dbm,notes,updated_at
      `));
      if (!created.length) return res.status(409).json({message:"This SmartLife device ID is already registered."});
      res.status(201).json(publicDevice(created[0]));
    } catch (err) { fail(res, err); }
  });
  app.patch("/api/admin/smartlife/devices/:id", adminOnly, async (req, res) => {
    try {
      if (!validUuid(req.params.id)) return res.status(400).json({message:"Invalid device."});
      const branchId = String(req.body?.branchId || "");
      const data = readDevice(req.body);
      if (!await branchExists(branchId) || !data)
        return res.status(400).json({message:"Select a valid branch and enter valid device information."});
      await init();
      const updated = rows(await db.execute(sql`
        UPDATE smartlife_devices
        SET branch_id=${branchId}::uuid,device_code=${data.deviceCode},
          display_name=${data.name},installation_area=${data.area},
          battery_percent=${data.batt},connection_status=${data.conn},
          trap_status=${data.trap},signal_dbm=${data.signal},
          notes=${data.notes},updated_at=now()
        WHERE id=${req.params.id}::uuid AND archived_at IS NULL
          AND NOT EXISTS (SELECT 1 FROM smartlife_alerts WHERE device_id=${req.params.id}::uuid
            AND branch_id <> ${branchId}::uuid)
        RETURNING id,branch_id,device_code,display_name,installation_area,battery_percent,
          connection_status,trap_status,signal_dbm,notes,updated_at
      `));
      if (!updated.length) return res.status(409).json({message:"Device not found or cannot reassign a device with alerts from another branch."});
      res.json(publicDevice(updated[0]));
    } catch (err: any) {
      if (err?.cause?.code === "23505" || err?.code === "23505")
        return res.status(409).json({message:"That SmartLife device ID is already in use."});
      fail(res, err);
    }
  });
  // Archive instead of deleting, so history cannot be silently destroyed.
  app.delete("/api/admin/smartlife/devices/:id", adminOnly, async (req, res) => {
    try {
      if (!validUuid(req.params.id)) return res.status(400).json({message:"Invalid device."});
      await init();
      const result = rows(await db.execute(sql`
        UPDATE smartlife_devices SET archived_at=now(),updated_at=now()
        WHERE id=${req.params.id}::uuid AND archived_at IS NULL RETURNING id
      `));
      if (!result.length) return res.status(404).json({message:"Device not found."});
      res.json({success:true});
    } catch (err) { fail(res, err); }
  });

  // A separate alert row is created for every send, including repeat catches.
  // Archive changes visibility only, never removes the audit record.
  const listAlerts = async (branchId: string, archived = false) => {
    await init();
    return rows(await db.execute(sql`
      SELECT id,branch_id,device_id,device_code,device_name,installation_area,
        caught_count,message,sent_at,acknowledged_at,archived_at,archived_by,archive_note
      FROM smartlife_alerts
      WHERE branch_id=${branchId}::uuid AND (archived_at IS NOT NULL)=${archived}
        AND deleted_at IS NULL
      ORDER BY sent_at DESC LIMIT 150
    `)).map(publicAlert);
  };
  app.get("/api/admin/smartlife/alerts", adminOnly, async (req, res) => {
    try {
      const branchId = String(req.query.branchId || "");
      if (!await branchExists(branchId)) return res.status(400).json({message:"Select a valid restaurant."});
      res.setHeader("Cache-Control","no-store");
      res.json(await listAlerts(branchId, String(req.query.archived || "") === "1"));
    } catch (err) { fail(res, err); }
  });
  app.get("/api/branch/smartlife/alerts", async (req, res) => {
    const branchId = branchIdFromSession(req);
    if (!branchId) return denied(res);
    try {
      if (!(await visibilityFor(branchId)).smartlifeAlert) return res.status(403).json({message:"Section hidden."});
      res.setHeader("Cache-Control","no-store");
      res.json(await listAlerts(branchId));
    } catch (err) { fail(res, err); }
  });
  app.post("/api/admin/smartlife/alerts", adminOnly, async (req, res) => {
    try {
      const branchId = String(req.body?.branchId || "");
      const deviceId = String(req.body?.deviceId || "");
      const count = Number(req.body?.caughtCount || 1);
      const message = shortText(req.body?.message, 200);
      if (!await branchExists(branchId) || !validUuid(deviceId) ||
          !Number.isInteger(count) || count < 1 || count > 50)
        return res.status(400).json({message:"Select a branch and device, and a count from 1 to 50."});
      await init();
      const device = rows(await db.execute(sql`
        SELECT id,device_code,display_name,installation_area
        FROM smartlife_devices
        WHERE id=${deviceId}::uuid AND branch_id=${branchId}::uuid AND archived_at IS NULL
      `))[0];
      if (!device) return res.status(404).json({message:"Device not assigned to the selected restaurant."});
      const alert = rows(await db.execute(sql`
        INSERT INTO smartlife_alerts
          (branch_id,device_id,device_code,device_name,installation_area,caught_count,message)
        VALUES
          (${branchId}::uuid,${deviceId}::uuid,${device.device_code},
            ${device.display_name},${device.installation_area},${count},${message})
        RETURNING id,branch_id,device_id,device_code,device_name,installation_area,
          caught_count,message,sent_at,acknowledged_at
      `))[0];
      // Deliberately does NOT update owned_iot_events or its counters.
      res.status(201).json(publicAlert(alert));
    } catch (err) { fail(res, err); }
  });
  app.post("/api/branch/smartlife/alerts/:id/stop", async (req, res) => {
    const branchId = branchIdFromSession(req);
    if (!branchId) return denied(res);
    try {
      if (!validUuid(req.params.id)) return res.status(400).json({message:"Invalid alert."});
      if (!(await visibilityFor(branchId)).smartlifeAlert)
        return res.status(403).json({message:"Section hidden."});
      const ack = rows(await db.execute(sql`
        UPDATE smartlife_alerts
        SET acknowledged_at=COALESCE(acknowledged_at,now())
        WHERE id=${req.params.id}::uuid AND branch_id=${branchId}::uuid
        RETURNING id
      `));
      if (!ack.length) return res.status(404).json({message:"Alert not found for this restaurant."});
      res.json({success:true});
    } catch (err) { fail(res, err); }
  });
  // Archive is allowed ONLY after Stop Alarm; the device is never deleted.
  // Admin is allowed to archive a confirmed resolved catch or restore a record.
  app.post("/api/admin/smartlife/alerts/:id/archive", adminOnly, async (req, res) => {
    try {
      const id = String(req.params.id || "");
      const branchId = String(req.body?.branchId || "");
      const note = shortText(req.body?.archiveNote, 400);
      if (!validUuid(id) || !await branchExists(branchId))
        return res.status(400).json({message:"Select a valid restaurant and alert."});
      await init();
      const found = rows(await db.execute(sql`
        UPDATE smartlife_alerts
        SET archived_at=now(), archived_by='admin',archive_note=${note}
        WHERE id=${id}::uuid AND branch_id=${branchId}::uuid
          AND acknowledged_at IS NOT NULL AND archived_at IS NULL
        RETURNING id
      `));
      if (!found.length) return res.status(409).json({message:"Stop the alarm before archiving, or this alert has already been archived."});
      res.json({success:true,archived:true});
    } catch(err) { fail(res,err); }
  });
  app.post("/api/branch/smartlife/alerts/:id/archive", async (req, res) => {
    const branchId = branchIdFromSession(req);
    if (!branchId) return denied(res);
    try {
      const id = String(req.params.id || "");
      if (!validUuid(id)) return res.status(400).json({message:"Invalid alert ID."});
      if (!(await visibilityFor(branchId)).smartlifeAlert)
        return res.status(403).json({message:"Section hidden."});
      const note = shortText(req.body?.archiveNote, 400);
      const found = rows(await db.execute(sql`
        UPDATE smartlife_alerts
        SET archived_at=now(),archived_by='branch',archive_note=${note}
        WHERE id=${id}::uuid AND branch_id=${branchId}::uuid
          AND acknowledged_at IS NOT NULL AND archived_at IS NULL
        RETURNING id
      `));
      if (!found.length) return res.status(409).json({message:"Stop the alarm before archiving, or it has already been archived."});
      res.json({success:true,archived:true});
    } catch(err) { fail(res,err); }
  });
  // Administrative Delete icon. Explicit confirmation takes place in the Admin UI.
  // Only the selected restaurant's already-archived alert can be hidden from history.
  // Private audit is retained; this never touches devices or Food Safety IoT tables.
  app.post("/api/admin/smartlife/alerts/:id/delete", adminOnly, async (req, res) => {
    try {
      const id = String(req.params.id || "");
      const branchId = String(req.body?.branchId || "");
      if (!validUuid(id) || !await branchExists(branchId))
        return res.status(400).json({message:"Select a valid restaurant and archived alert."});
      await init();
      const found = rows(await db.execute(sql`
        UPDATE smartlife_alerts
        SET deleted_at=now(), deleted_by='admin'
        WHERE id=${id}::uuid AND branch_id=${branchId}::uuid
          AND archived_at IS NOT NULL AND acknowledged_at IS NOT NULL AND deleted_at IS NULL
        RETURNING id
      `));
      if (!found.length)
        return res.status(404).json({message:"Archived alert not found for this restaurant or already removed."});
      return res.json({success:true,removedFromHistory:true});
    } catch(err) { return fail(res,err); }
  });

  app.post("/api/admin/smartlife/alerts/:id/restore", adminOnly, async (req, res) => {
    try {
      const id = String(req.params.id || "");
      const branchId = String(req.body?.branchId || "");
      if (!validUuid(id) || !await branchExists(branchId))
        return res.status(400).json({message:"Select a valid restaurant and alert."});
      await init();
      const found = rows(await db.execute(sql`
        UPDATE smartlife_alerts
        SET archived_at=NULL,archived_by=NULL,archive_note=NULL
        WHERE id=${id}::uuid AND branch_id=${branchId}::uuid AND archived_at IS NOT NULL AND deleted_at IS NULL
        RETURNING id
      `));
      if (!found.length) return res.status(404).json({message:"Archived alert not found for this restaurant."});
      res.json({success:true,restored:true});
    } catch(err) { fail(res,err); }
  });

}
