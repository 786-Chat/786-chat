import { hardenPestControlRuntime as hardenPestControlRuntimeBase } from "./pestcontrol-runtime-hardening-base"

const PEST_CONTROL_PROJECT_ID = "22c299f8-bf65-410f-9643-92a9776dbfca"

function patchOwnedIotGatewayRoutes(source: string): string {
  let next = source

  if (!next.includes('timingSafeEqual')) {
    next = next.replace(
      'import { randomUUID } from "crypto";',
      'import { randomUUID, timingSafeEqual } from "crypto";',
    )
  }

  if (next.includes('/api/iot/gateway/health')) return next

  const marker = "  // Auth middleware (this sets up sessions first)"
  if (!next.includes(marker)) return next

  const gatewayRoutes = `  // 786.Chat: Food Safety HP2/MQTT gateway. Kept on every Pest Control rebuild.
  app.get("/api/iot/gateway/health", (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json({
      status: "ok",
      provider: "Food Safety Owned IoT",
      configured: Boolean(process.env.FOODSAFETY_IOT_GATEWAY_TOKEN?.trim()),
    });
  });

  app.post("/api/iot/gateway/events", async (req, res) => {
    try {
      const expectedToken = String(process.env.FOODSAFETY_IOT_GATEWAY_TOKEN || "").trim();
      if (!expectedToken) {
        return res.status(503).json({
          message: "Food Safety IoT gateway token is not configured",
          code: "IOT_GATEWAY_NOT_CONFIGURED",
        });
      }

      const headerToken = String(req.get("x-foodsafety-gateway-token") || "").trim();
      const authorization = String(req.get("authorization") || "").trim();
      const providedToken = headerToken || (/^Bearer\\s+/i.test(authorization)
        ? authorization.replace(/^Bearer\\s+/i, "").trim()
        : "");
      const providedBuffer = Buffer.from(providedToken);
      const expectedBuffer = Buffer.from(expectedToken);
      const authorized = providedBuffer.length === expectedBuffer.length &&
        providedBuffer.length > 0 &&
        timingSafeEqual(providedBuffer, expectedBuffer);

      if (!authorized) {
        return res.status(401).json({
          message: "Invalid Food Safety IoT gateway token",
          code: "IOT_GATEWAY_UNAUTHORIZED",
        });
      }

      await ensureOwnedIotSchema();

      const body = req.body && typeof req.body === "object" ? req.body : {};
      const deviceId = String(body.deviceId || body.device_id || "").trim();
      const type = String(body.type || body.eventType || body.event_type || "").trim();
      const allowedTypes = new Set(["trap_triggered", "trap_reset", "heartbeat", "online", "offline"]);

      if (!deviceId) {
        return res.status(400).json({ message: "deviceId is required", code: "DEVICE_ID_REQUIRED" });
      }
      if (!allowedTypes.has(type)) {
        return res.status(400).json({
          message: \`Unsupported event type: \${type || "(empty)"}\`,
          code: "INVALID_EVENT_TYPE",
        });
      }

      const deviceResult: any = await db.execute(sql\`
        SELECT id, device_id, branch_id, friendly_name, installation_location
        FROM owned_iot_devices
        WHERE device_id = \${deviceId}
        LIMIT 1
      \`);
      const deviceRows = Array.isArray(deviceResult) ? deviceResult : (deviceResult?.rows || []);
      if (!deviceRows.length) {
        return res.status(404).json({
          message: \`Food Safety device \${deviceId} is not registered\`,
          code: "DEVICE_NOT_REGISTERED",
        });
      }
      const device = deviceRows[0];
      if (!device.branch_id) {
        return res.status(409).json({
          message: \`Food Safety device \${deviceId} is not assigned to a branch\`,
          code: "DEVICE_UNASSIGNED",
        });
      }

      const suppliedEventId = String(body.eventId || body.event_id || "").trim();
      const eventId = suppliedEventId || randomUUID();
      const duplicateResult: any = await db.execute(sql\`
        SELECT event_id
        FROM owned_iot_events
        WHERE event_id = \${eventId}
        LIMIT 1
      \`);
      const duplicateRows = Array.isArray(duplicateResult) ? duplicateResult : (duplicateResult?.rows || []);
      if (duplicateRows.length) {
        return res.status(200).json({ success: true, duplicate: true, eventId, deviceId, type });
      }

      const integerOrNull = (value: unknown): number | null => {
        if (value === null || value === undefined || value === "") return null;
        const parsed = Number(value);
        return Number.isFinite(parsed) ? Math.trunc(parsed) : null;
      };

      const rssi = integerOrNull(body.rssi);
      const batteryPct = integerOrNull(body.batteryPct ?? body.battery_pct ?? body.battery);
      const eventValue = body.value !== undefined
        ? body.value
        : type === "trap_triggered" ? true
        : type === "trap_reset" ? false
        : type === "online" ? true
        : type === "offline" ? false
        : null;
      const valueJson = JSON.stringify(eventValue ?? null);
      const rawJson = JSON.stringify({
        source: "hp2-mqtt-gateway",
        ...body,
        deviceId,
        type,
        eventId,
      });

      if (type === "trap_triggered") {
        await db.execute(sql\`
          UPDATE owned_iot_devices
          SET is_online = true,
              last_seen_at = now(),
              last_alarm_at = now(),
              last_event_id = \${eventId},
              rssi = COALESCE(\${rssi}, rssi),
              battery_pct = COALESCE(\${batteryPct}, battery_pct),
              updated_at = now()
          WHERE device_id = \${deviceId}
        \`);
      } else if (type === "trap_reset") {
        await db.execute(sql\`
          UPDATE owned_iot_devices
          SET is_online = true,
              last_seen_at = now(),
              last_alarm_at = NULL,
              last_event_id = \${eventId},
              rssi = COALESCE(\${rssi}, rssi),
              battery_pct = COALESCE(\${batteryPct}, battery_pct),
              updated_at = now()
          WHERE device_id = \${deviceId}
        \`);
      } else if (type === "offline") {
        await db.execute(sql\`
          UPDATE owned_iot_devices
          SET is_online = false,
              last_seen_at = now(),
              last_event_id = \${eventId},
              rssi = COALESCE(\${rssi}, rssi),
              battery_pct = COALESCE(\${batteryPct}, battery_pct),
              updated_at = now()
          WHERE device_id = \${deviceId}
        \`);
      } else {
        await db.execute(sql\`
          UPDATE owned_iot_devices
          SET is_online = true,
              last_seen_at = now(),
              last_event_id = \${eventId},
              rssi = COALESCE(\${rssi}, rssi),
              battery_pct = COALESCE(\${batteryPct}, battery_pct),
              updated_at = now()
          WHERE device_id = \${deviceId}
        \`);
      }

      await db.execute(sql\`
        INSERT INTO owned_iot_events
          (event_id, device_id, branch_id, friendly_name, installation_location, event_type, event_value, event_at, raw_payload)
        VALUES
          (\${eventId}, \${deviceId}, \${device.branch_id}::uuid, \${device.friendly_name || null}, \${device.installation_location || null}, \${type}, CAST(\${valueJson} AS jsonb), now(), CAST(\${rawJson} AS jsonb))
      \`);

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

`

  return next.replace(marker, `${gatewayRoutes}${marker}`)
}


function patchOwnedIotAdminPanel(source: string): string {
  let next = source

  if (next.includes("Food Safety Wireless Activation") && !next.includes("Connect Device to Wi-Fi")) {
    return next
  }

  const startMarker = `      <div className="rounded-2xl border border-cyan-500/30 bg-slate-800/65 p-5">
        <div className="mb-4 flex items-center gap-2">
          <Wifi className="h-4 w-4 text-cyan-300" />
          <h3 className="font-semibold text-white">Connect Device to Wi-Fi</h3>`

  const endMarker = `      <div className="rounded-2xl border border-slate-700 bg-slate-800/65 p-5">
        <div className="mb-4">`

  const start = next.indexOf(startMarker)
  if (start < 0) return next
  const end = next.indexOf(endMarker, start + startMarker.length)
  if (end < 0) return next

  const replacement = `      <div className="rounded-2xl border border-cyan-500/30 bg-slate-800/65 p-5">
        <div className="mb-4 flex items-center gap-2">
          <Wifi className="h-4 w-4 text-cyan-300" />
          <h3 className="font-semibold text-white">Food Safety Wireless Activation</h3>
        </div>
        <p className="text-sm text-slate-300">
          Devices use the proven Food Safety path: trap firmware → customer 2.4 GHz Wi-Fi → HP2 Mosquitto → Pest Control.
          This Admin page registers and assigns devices; it does not pretend to program factory Wi-Fi from the browser.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-3">
            <p className="text-[11px] uppercase tracking-wide text-slate-500">Gateway / MQTT Host</p>
            <p className="mt-1 font-mono text-sm font-semibold text-white">192.168.0.14</p>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-3">
            <p className="text-[11px] uppercase tracking-wide text-slate-500">MQTT Port</p>
            <p className="mt-1 font-mono text-sm font-semibold text-white">1883</p>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-3">
            <p className="text-[11px] uppercase tracking-wide text-slate-500">Transport</p>
            <p className="mt-1 text-sm font-semibold text-white">{systemStatus?.transport || "MQTT / Wi-Fi"}</p>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-3">
            <p className="text-[11px] uppercase tracking-wide text-slate-500">Registered Devices</p>
            <p className="mt-1 text-sm font-semibold text-white">{systemStatus?.registeredDevices ?? ownedDevices.length}</p>
          </div>
        </div>

        <p className="mt-3 text-xs text-slate-400">
          A registered trap changes to Connected automatically after its real wireless gateway event reaches Pest Control.
          No customer Wi-Fi password is stored or copied by this dashboard.
        </p>
      </div>

`

  next = next.slice(0, start) + replacement + next.slice(end)

  next = next.replace(
    "New devices use only your Food Safety device registry and MQTT/Wi-Fi gateway. Customer Wi-Fi passwords are never stored in the platform database.",
    "New devices use only your Food Safety device registry and HP2 MQTT/Wi-Fi gateway. Device connection state comes from real gateway events, not a browser setup page.",
  )

  return next
}

export function hardenPestControlRuntime(
  projectId: string,
  files: Record<string, string>,
): Record<string, string> {
  const runtimeFiles = hardenPestControlRuntimeBase(projectId, files)
  if (projectId !== PEST_CONTROL_PROJECT_ID) return runtimeFiles

  const routesPath = "server/routes.ts"
  if (runtimeFiles[routesPath]) {
    runtimeFiles[routesPath] = patchOwnedIotGatewayRoutes(runtimeFiles[routesPath])
  }

  const iotAdminPanelPath = "client/src/components/IotAdminPanel.tsx"
  if (runtimeFiles[iotAdminPanelPath]) {
    runtimeFiles[iotAdminPanelPath] = patchOwnedIotAdminPanel(runtimeFiles[iotAdminPanelPath])
  }

  return runtimeFiles
}
