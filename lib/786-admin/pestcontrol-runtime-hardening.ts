import { hardenPestControlRuntime as hardenPestControlRuntimeBase } from "./pestcontrol-runtime-hardening-base"

const PEST_CONTROL_PROJECT_ID = "22c299f8-bf65-410f-9643-92a9776dbfca"

function replaceIfPresent(source: string, needle: string, replacement: string): string {
  if (source.includes(replacement)) return source
  if (!source.includes(needle)) return source
  return source.replace(needle, replacement)
}

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



function patchOwnedIotAssignmentLifecycle(source: string): string {
  let next = source

  const branchIndexMarker = '    await db.execute(sql\`CREATE INDEX IF NOT EXISTS owned_iot_devices_branch_idx ON owned_iot_devices(branch_id)\`);'
  if (!next.includes("ALTER TABLE owned_iot_events ADD COLUMN IF NOT EXISTS branch_id") && next.includes(branchIndexMarker)) {
    const snapshotSchema = [
      "    // 786.Chat: preserve the branch/name/location that applied when an event happened.",
      "    await db.execute(sql\`ALTER TABLE owned_iot_events ADD COLUMN IF NOT EXISTS branch_id uuid\`);",
      "    await db.execute(sql\`ALTER TABLE owned_iot_events ADD COLUMN IF NOT EXISTS friendly_name text\`);",
      "    await db.execute(sql\`ALTER TABLE owned_iot_events ADD COLUMN IF NOT EXISTS installation_location text\`);",
      "    await db.execute(sql\`",
      "      UPDATE owned_iot_events e",
      "      SET branch_id = COALESCE(e.branch_id, d.branch_id),",
      "          friendly_name = COALESCE(e.friendly_name, d.friendly_name),",
      "          installation_location = COALESCE(e.installation_location, d.installation_location)",
      "      FROM owned_iot_devices d",
      "      WHERE e.device_id = d.device_id",
      "        AND (e.branch_id IS NULL OR e.friendly_name IS NULL OR e.installation_location IS NULL)",
      "    \`);",
      "    await db.execute(sql\`CREATE INDEX IF NOT EXISTS owned_iot_events_branch_time_idx ON owned_iot_events(branch_id, event_at DESC)\`);",
      "",
    ].join("\n")
    next = next.replace(branchIndexMarker, snapshotSchema + branchIndexMarker)
  }

  next = next.replace(
    '    const ownedBranchFilter = branchId ? sql\`AND d.branch_id::text = \${String(branchId)}\` : sql\`\`;',
    '    const ownedBranchFilter = branchId ? sql\`AND e.branch_id::text = \${String(branchId)}\` : sql\`\`;'
  )

  next = next.replace(
    [
      "        d.device_id,",
      "        COALESCE(d.friendly_name, d.device_id) AS device_name,",
      "        d.branch_id::text AS branch_id,",
      "        b.name AS branch_name,",
      "        COALESCE(d.installation_location, d.hardware_model) AS location,",
    ].join("\n"),
    [
      "        e.device_id,",
      "        COALESCE(e.friendly_name, d.friendly_name, e.device_id) AS device_name,",
      "        e.branch_id::text AS branch_id,",
      "        b.name AS branch_name,",
      "        COALESCE(e.installation_location, d.installation_location, d.hardware_model) AS location,",
    ].join("\n"),
  )

  next = next.replace(
    "      LEFT JOIN branches b ON b.id::text = d.branch_id::text",
    "      LEFT JOIN branches b ON b.id::text = e.branch_id::text",
  )

  next = next.replace(
    [
      "        SELECT id, device_id, friendly_name",
      "        FROM owned_iot_devices",
    ].join("\n"),
    [
      "        SELECT id, device_id, friendly_name, branch_id",
      "        FROM owned_iot_devices",
    ].join("\n"),
  )

  const duplicateOld = [
    "      const existingRows = Array.isArray(existingResult) ? existingResult : (existingResult?.rows || []);",
    "      if (existingRows.length > 0) {",
    "        return res.status(409).json({",
    '          message: "This Food Safety device ID is already registered as " + (existingRows[0]?.friendly_name || existingRows[0]?.device_id),',
    "        });",
    "      }",
  ].join("\n")

  const duplicateNew = [
    "      const existingRows = Array.isArray(existingResult) ? existingResult : (existingResult?.rows || []);",
    "      const existingDevice: any = existingRows[0];",
    "      if (existingDevice?.branch_id) {",
    '        let existingBranchName = "another branch";',
    "        try {",
    "          const existingBranch = await storage.getBranch(String(existingDevice.branch_id));",
    "          if (existingBranch?.name) existingBranchName = existingBranch.name;",
    "        } catch (_) {}",
    "        return res.status(409).json({",
    '          code: "DEVICE_ALREADY_ASSIGNED",',
    "          message: \`\${resolvedDeviceId} is already assigned to \${existingBranchName}. Remove it from that branch before assigning it here.\`,",
    "          deviceId: resolvedDeviceId,",
    "          branchId: String(existingDevice.branch_id),",
    "          branchName: existingBranchName,",
    "        });",
    "      }",
  ].join("\n")

  next = replaceIfPresent(next, duplicateOld, duplicateNew)

  if (!next.includes("if (existingDevice) {")) {
    const insertStart = "      const createdResult: any = await db.execute(sql\`\n        INSERT INTO owned_iot_devices ("
    const start = next.indexOf(insertStart)
    if (start >= 0) {
      const endMarker = "      \`);\n\n      const createdRows = Array.isArray(createdResult)"
      const end = next.indexOf(endMarker, start)
      if (end > start) {
        const oldInsert = next.slice(start, end + "      \`);".length)
        const nestedInsert = oldInsert.replace(
          "      const createdResult: any = await db.execute(sql\`",
          "        createdResult = await db.execute(sql\`",
        )
        const replacement = [
          "      let createdResult: any;",
          "      if (existingDevice) {",
          "        createdResult = await db.execute(sql\`",
          "          UPDATE owned_iot_devices",
          "          SET hardware_model = \${model},",
          "              branch_id = \${targetBranchId}::uuid,",
          "              friendly_name = \${friendlyName},",
          "              installation_location = \${location},",
          "              lifecycle_state = 'awaiting_activation',",
          "              is_online = false,",
          "              last_alarm_at = NULL,",
          "              updated_at = now()",
          "          WHERE id = \${existingDevice.id}::uuid",
          "          RETURNING",
          "            id, device_id, hardware_model, firmware_version, branch_id,",
          "            friendly_name, installation_location, lifecycle_state, is_online,",
          "            battery_pct, rssi, last_seen_at, last_alarm_at",
          "        \`);",
          "      } else {",
          nestedInsert,
          "      }",
        ].join("\n")
        next = next.slice(0, start) + replacement + next.slice(end + "      \`);".length)
      }
    }
  }

  const deleteByIdOld = [
    "      const result: any = await db.execute(sql\`",
    "        DELETE FROM owned_iot_devices",
    "        WHERE id::text = \${String(req.params.id)}",
    "        RETURNING id",
    "      \`);",
  ].join("\n")

  const deleteByIdNew = [
    "      const result: any = await db.execute(sql\`",
    "        UPDATE owned_iot_devices",
    "        SET branch_id = NULL,",
    "            lifecycle_state = 'unassigned',",
    "            is_online = false,",
    "            last_alarm_at = NULL,",
    "            updated_at = now()",
    "        WHERE id::text = \${String(req.params.id)}",
    "        RETURNING id, device_id",
    "      \`);",
  ].join("\n")

  next = replaceIfPresent(next, deleteByIdOld, deleteByIdNew)

  const deleteByDeviceOld = [
    "      const result: any = await db.execute(sql\`",
    "        DELETE FROM owned_iot_devices",
    "        WHERE device_id = \${deviceId}",
    "        RETURNING id, device_id",
    "      \`);",
  ].join("\n")

  const deleteByDeviceNew = [
    "      const result: any = await db.execute(sql\`",
    "        UPDATE owned_iot_devices",
    "        SET branch_id = NULL,",
    "            lifecycle_state = 'unassigned',",
    "            is_online = false,",
    "            last_alarm_at = NULL,",
    "            updated_at = now()",
    "        WHERE device_id = \${deviceId}",
    "        RETURNING id, device_id",
    "      \`);",
  ].join("\n")

  next = replaceIfPresent(next, deleteByDeviceOld, deleteByDeviceNew)

  const testEventOld = [
    "        INSERT INTO owned_iot_events",
    "          (event_id, device_id, event_type, event_value, event_at, raw_payload)",
    "        VALUES",
    "          (gen_random_uuid()::text, \${String(row.device_id)}, 'trap_triggered', 'true'::jsonb, now(),",
    "           jsonb_build_object('source','admin-test-alarm','deviceId',\${String(row.device_id)},'type','trap_triggered','value',true))",
  ].join("\n")

  const testEventNew = [
    "        INSERT INTO owned_iot_events",
    "          (event_id, device_id, branch_id, friendly_name, installation_location, event_type, event_value, event_at, raw_payload)",
    "        VALUES",
    "          (gen_random_uuid()::text, \${String(row.device_id)}, \${row.branch_id}::uuid, \${row.friendly_name || null}, \${row.installation_location || null}, 'trap_triggered', 'true'::jsonb, now(),",
    "           jsonb_build_object('source','admin-test-alarm','deviceId',\${String(row.device_id)},'type','trap_triggered','value',true))",
  ].join("\n")

  next = replaceIfPresent(next, testEventOld, testEventNew)

  return next
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


function patchOwnedIotSafeUi(source: string): string {
  let next = source

  const recoverStart = next.indexOf("  const recoverStaleDevice = async () => {")
  if (recoverStart >= 0) {
    const recoverEnd = next.indexOf("\n\n  const removeDevice", recoverStart)
    if (recoverEnd > recoverStart) next = next.slice(0, recoverStart) + next.slice(recoverEnd + 2)
  }

  if (!next.includes("const [pendingRemoveDeviceId")) {
    next = next.replace(
      '  const [savingDevice, setSavingDevice] = useState(false);',
      '  const [savingDevice, setSavingDevice] = useState(false);\n  const [pendingRemoveDeviceId, setPendingRemoveDeviceId] = useState("");\n  const [removingDeviceId, setRemovingDeviceId] = useState("");',
    )
  }

  const removeStart = next.indexOf("  const removeDevice = async (id: string, name: string) => {")
  const removeEnd = removeStart >= 0 ? next.indexOf("\n\n  const refreshDevice", removeStart) : -1
  if (removeStart >= 0 && removeEnd > removeStart) {
    const replacement = [
      "  const removeDevice = async (id: string, name: string) => {",
      "    setRemovingDeviceId(id);",
      "    try {",
      '      const response = await fetch(\`/api/iot/devices/\${id}\`, { method: "DELETE", credentials: "include" });',
      "      const data = await response.json().catch(() => ({}));",
      "      if (!response.ok) {",
      '        toast({ title: "Could not unassign device", description: data?.message || "Please try again", variant: "destructive" });',
      "        return;",
      "      }",
      '      setPendingRemoveDeviceId("");',
      '      toast({ title: "Device unassigned", description: \`\${name} is now available to assign to another shop.\` });',
      "      await loadBase();",
      "    } finally {",
      '      setRemovingDeviceId("");',
      "    }",
      "  };",
    ].join("\n")
    next = next.slice(0, removeStart) + replacement + next.slice(removeEnd)
  }

  const oldButton = [
    '                    <Button size="sm" variant="outline" onClick={() => removeDevice(device.id, device.deviceName)} className="border-red-700/60 text-red-300">',
    '                      <Trash2 className="mr-1 h-3 w-3" />',
    '                      Remove Device',
    '                    </Button>',
  ].join("\n")

  const inlineConfirm = [
    '                    {pendingRemoveDeviceId === String(device.id) ? (',
    '                      <>',
    '                        <Button',
    '                          size="sm"',
    '                          onClick={() => removeDevice(String(device.id), String(device.deviceName || device.deviceId))}',
    '                          disabled={removingDeviceId === String(device.id)}',
    '                          className="bg-red-600 text-white hover:bg-red-500"',
    '                        >',
    '                          <Trash2 className="mr-1 h-3 w-3" />',
    '                          {removingDeviceId === String(device.id) ? "Unassigning..." : "Confirm Unassign"}',
    '                        </Button>',
    '                        <Button',
    '                          size="sm"',
    '                          variant="outline"',
    '                          onClick={() => setPendingRemoveDeviceId("")}',
    '                          disabled={removingDeviceId === String(device.id)}',
    '                          className="border-slate-600 text-slate-200"',
    '                        >',
    '                          Cancel',
    '                        </Button>',
    '                      </>',
    '                    ) : (',
    '                      <Button',
    '                        size="sm"',
    '                        variant="outline"',
    '                        onClick={() => setPendingRemoveDeviceId(String(device.id))}',
    '                        className="border-red-700/60 text-red-300"',
    '                      >',
    '                        <Trash2 className="mr-1 h-3 w-3" />',
    '                        Unassign Device',
    '                      </Button>',
    '                    )}',
  ].join("\n")

  next = replaceIfPresent(next, oldButton, inlineConfirm)

  next = next.replace(
    "                          <p className=\"text-sm font-semibold text-cyan-100\">Edit / Reassign this device</p>",
    "                          <p className=\"text-sm font-semibold text-cyan-100\">Edit this device</p>",
  )

  next = next.replace(
    "                          <p className=\"text-[11px] text-slate-400\">Device ID stays fixed: {device.deviceId}</p>",
    "                          <p className=\"text-[11px] text-slate-400\">Device ID stays fixed: {device.deviceId}. To move shops, remove it first, then register the same ID at the new branch.</p>",
  )

  next = next.replace(
    "Leave blank and the system creates a unique ID such as FS-MOUSE-000001.",
    "Leave blank to create the next ID. An existing ID can only be assigned after it has been removed from its previous shop.",
  )

  next = next.replace(/\s*\{deviceId\.trim\(\) && \(\s*<Button[\s\S]*?Clear stale \{deviceId\.trim\(\)\.toUpperCase\(\)\}[\s\S]*?<\/Button>\s*\)\}/, "")

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
    let routes = patchOwnedIotAssignmentLifecycle(runtimeFiles[routesPath])
    routes = patchOwnedIotGatewayRoutes(routes)
    runtimeFiles[routesPath] = routes
  }

  const iotAdminPanelPath = "client/src/components/IotAdminPanel.tsx"
  if (runtimeFiles[iotAdminPanelPath]) {
    let adminPanel = patchOwnedIotAdminPanel(runtimeFiles[iotAdminPanelPath])
    adminPanel = patchOwnedIotSafeUi(adminPanel)
    runtimeFiles[iotAdminPanelPath] = adminPanel
  }

  return runtimeFiles
}
