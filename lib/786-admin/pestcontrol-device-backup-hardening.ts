const PEST_CONTROL_PROJECT_ID = "22c299f8-bf65-410f-9643-92a9776dbfca"

function patchRoute(
  source: string,
  routeMarkers: string[],
  transform: (block: string) => string,
): string {
  let start = -1
  let matchedMarker = ""

  for (const marker of routeMarkers) {
    const found = source.indexOf(marker)
    if (found >= 0) {
      start = found
      matchedMarker = marker
      break
    }
  }

  if (start < 0) return source
  const nextRoute = source.indexOf("\n  app.", start + matchedMarker.length)
  const end = nextRoute < 0 ? source.length : nextRoute
  const block = source.slice(start, end)
  const patched = transform(block)
  if (patched === block) return source
  return source.slice(0, start) + patched + source.slice(end)
}

function patchDeviceBackupSchema(source: string): string {
  if (source.includes("CREATE TABLE IF NOT EXISTS owned_iot_device_backups")) return source

  const marker = "    await db.execute(sql`CREATE INDEX IF NOT EXISTS owned_iot_devices_branch_idx ON owned_iot_devices(branch_id)`);"
  if (!source.includes(marker)) return source

  const schema = [
    "    // 786.Chat: persistent snapshots of device registry/branch assignment only.",
    "    // Live telemetry is deliberately excluded so restore can never fake a connected trap.",
    "    await db.execute(sql`",
    "      CREATE TABLE IF NOT EXISTS owned_iot_device_backups (",
    "        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),",
    "        backup_type text NOT NULL DEFAULT 'manual',",
    "        label text,",
    "        device_count integer NOT NULL DEFAULT 0,",
    "        snapshot jsonb NOT NULL DEFAULT '[]'::jsonb,",
    "        created_at timestamptz NOT NULL DEFAULT now()",
    "      )",
    "    `);",
    "    await db.execute(sql`CREATE INDEX IF NOT EXISTS owned_iot_device_backups_created_idx ON owned_iot_device_backups(created_at DESC)`);",
    "",
  ].join("\n")

  return source.replace(marker, schema + marker)
}

function patchDeviceBackupRoutes(source: string): string {
  let next = source

  if (!next.includes('app.get("/api/iot/device-backups/latest"')) {
    const marker = '  app.get("/api/iot/owned/status", isAdminAuthenticated, async (_req, res) => {'
    if (next.includes(marker)) {
      const routes = [
        "  // 786.Chat: backup only durable device identity + branch assignment fields.",
        "  // Online/offline, last-seen, alarm, RSSI and battery remain gateway-owned truth.",
        "  const createOwnedIotDeviceBackup = async (backupType = 'manual', label = '') => {",
        "    await ensureOwnedIotSchema();",
        "    const devicesResult: any = await db.execute(sql`",
        "      SELECT",
        "        device_id, hardware_model, firmware_version, branch_id::text AS branch_id,",
        "        friendly_name, installation_location, lifecycle_state",
        "      FROM owned_iot_devices",
        "      WHERE branch_id IS NOT NULL",
        "      ORDER BY device_id",
        "    `);",
        "    const deviceRows = Array.isArray(devicesResult) ? devicesResult : (devicesResult?.rows || []);",
        "    if (!deviceRows.length) return null;",
        "    const snapshot = deviceRows.map((row: any) => ({",
        "      deviceId: String(row.device_id || ''),",
        "      hardwareModel: row.hardware_model || null,",
        "      firmwareVersion: row.firmware_version || null,",
        "      branchId: row.branch_id ? String(row.branch_id) : null,",
        "      friendlyName: row.friendly_name || null,",
        "      installationLocation: row.installation_location || null,",
        "      lifecycleState: row.lifecycle_state || 'awaiting_activation',",
        "    }));",
        "    const snapshotJson = JSON.stringify(snapshot);",
        "    const createdResult: any = await db.execute(sql`",
        "      INSERT INTO owned_iot_device_backups (backup_type, label, device_count, snapshot)",
        "      VALUES (${backupType}, ${label || null}, ${snapshot.length}, CAST(${snapshotJson} AS jsonb))",
        "      RETURNING id::text AS id, backup_type, label, device_count, created_at",
        "    `);",
        "    const createdRows = Array.isArray(createdResult) ? createdResult : (createdResult?.rows || []);",
        "    return createdRows[0] || null;",
        "  };",
        "",
        "  app.get(\"/api/iot/device-backups/latest\", isAdminAuthenticated, async (_req, res) => {",
        "    try {",
        "      await ensureOwnedIotSchema();",
        "      const result: any = await db.execute(sql`",
        "        SELECT id::text AS id, backup_type, label, device_count, created_at",
        "        FROM owned_iot_device_backups",
        "        WHERE backup_type = 'manual'",
        "        ORDER BY created_at DESC",
        "        LIMIT 1",
        "      `);",
        "      const rows = Array.isArray(result) ? result : (result?.rows || []);",
        "      return res.json({ backup: rows[0] || null });",
        "    } catch (error: any) {",
        "      console.error('Failed to load latest device backup:', error?.message || error);",
        "      return res.status(500).json({ message: 'Could not load device backup' });",
        "    }",
        "  });",
        "",
        "  app.post(\"/api/iot/device-backups\", isAdminAuthenticated, async (req, res) => {",
        "    try {",
        "      const label = String(req.body?.label || 'Working device setup').trim().slice(0, 200);",
        "      const backup = await createOwnedIotDeviceBackup('manual', label);",
        "      if (!backup) {",
        "        return res.status(409).json({ message: 'There are no assigned Food Safety devices to back up.' });",
        "      }",
        "      return res.status(201).json({ success: true, backup });",
        "    } catch (error: any) {",
        "      console.error('Failed to create device backup:', error?.message || error);",
        "      return res.status(500).json({ message: 'Could not create device backup' });",
        "    }",
        "  });",
        "",
        "  app.post(\"/api/iot/device-backups/:id/restore\", isAdminAuthenticated, async (req, res) => {",
        "    try {",
        "      await ensureOwnedIotSchema();",
        "      const backupId = String(req.params.id || '').trim();",
        "      const backupResult: any = await db.execute(sql`",
        "        SELECT id::text AS id, label, snapshot, created_at",
        "        FROM owned_iot_device_backups",
        "        WHERE id::text = ${backupId}",
        "        LIMIT 1",
        "      `);",
        "      const backupRows = Array.isArray(backupResult) ? backupResult : (backupResult?.rows || []);",
        "      if (!backupRows.length) return res.status(404).json({ message: 'Device backup was not found.' });",
        "",
        "      const rawSnapshot = backupRows[0]?.snapshot;",
        "      const snapshot = Array.isArray(rawSnapshot)",
        "        ? rawSnapshot",
        "        : (() => { try { return JSON.parse(String(rawSnapshot || '[]')); } catch { return []; } })();",
        "      if (!Array.isArray(snapshot) || !snapshot.length) {",
        "        return res.status(409).json({ message: 'This device backup is empty.' });",
        "      }",
        "",
        "      // Safety net: keep the current assignment map before restoring an older one.",
        "      await createOwnedIotDeviceBackup('auto', `Before restore ${backupId}`).catch((error: any) =>",
        "        console.warn('Pre-restore device snapshot failed:', error?.message || error),",
        "      );",
        "",
        "      let restored = 0;",
        "      let skipped = 0;",
        "      for (const saved of snapshot) {",
        "        const deviceId = String(saved?.deviceId || '').trim();",
        "        const branchId = String(saved?.branchId || '').trim();",
        "        if (!deviceId || !branchId) { skipped += 1; continue; }",
        "",
        "        let branchExists = false;",
        "        try { branchExists = Boolean(await storage.getBranch(branchId)); } catch (_) {}",
        "        if (!branchExists) { skipped += 1; continue; }",
        "",
        "        const existingResult: any = await db.execute(sql`",
        "          SELECT id FROM owned_iot_devices WHERE device_id = ${deviceId} LIMIT 1",
        "        `);",
        "        const existingRows = Array.isArray(existingResult) ? existingResult : (existingResult?.rows || []);",
        "        const hardwareModel = String(saved?.hardwareModel || 'BK7231N-MOUSE-V1').trim() || 'BK7231N-MOUSE-V1';",
        "        const firmwareVersion = saved?.firmwareVersion ? String(saved.firmwareVersion) : null;",
        "        const friendlyName = saved?.friendlyName ? String(saved.friendlyName) : deviceId;",
        "        const location = saved?.installationLocation ? String(saved.installationLocation) : null;",
        "        const lifecycleState = saved?.lifecycleState ? String(saved.lifecycleState) : 'awaiting_activation';",
        "",
        "        if (existingRows.length) {",
        "          await db.execute(sql`",
        "            UPDATE owned_iot_devices",
        "            SET hardware_model = ${hardwareModel},",
        "                firmware_version = ${firmwareVersion},",
        "                branch_id = ${branchId}::uuid,",
        "                friendly_name = ${friendlyName},",
        "                installation_location = ${location},",
        "                lifecycle_state = ${lifecycleState},",
        "                updated_at = now()",
        "            WHERE device_id = ${deviceId}",
        "          `);",
        "        } else {",
        "          await db.execute(sql`",
        "            INSERT INTO owned_iot_devices",
        "              (device_id, hardware_model, firmware_version, branch_id, friendly_name, installation_location, lifecycle_state, is_online)",
        "            VALUES",
        "              (${deviceId}, ${hardwareModel}, ${firmwareVersion}, ${branchId}::uuid, ${friendlyName}, ${location}, ${lifecycleState}, false)",
        "          `);",
        "        }",
        "        restored += 1;",
        "      }",
        "",
        "      return res.json({",
        "        success: true,",
        "        backupId,",
        "        restored,",
        "        skipped,",
        "        message: `Restored ${restored} device assignment${restored === 1 ? '' : 's'}. Live online status will update only from real HP2 gateway events.`,",
        "      });",
        "    } catch (error: any) {",
        "      console.error('Failed to restore device backup:', error?.message || error);",
        "      return res.status(500).json({ message: 'Could not restore device backup' });",
        "    }",
        "  });",
        "",
      ].join("\n")

      next = next.replace(marker, routes + marker)
    }
  }

  const addAutoBackup = (block: string, label: string) => {
    if (block.includes("createOwnedIotDeviceBackup('auto'")) return block
    const marker = "      await ensureOwnedIotSchema();"
    if (!block.includes(marker)) return block
    const lines = [
      marker,
      `      await createOwnedIotDeviceBackup('auto', '${label}').catch((error: any) =>`,
      "        console.warn('Automatic device backup failed:', error?.message || error),",
      "      );",
    ].join("\n")
    return block.replace(marker, lines)
  }

  next = patchRoute(next, ['  app.post("/api/iot/devices", isAdminAuthenticated'], (block) => addAutoBackup(block, "Before Add Device"))
  next = patchRoute(next, ['  app.patch("/api/iot/devices/:id", isAdminAuthenticated'], (block) => addAutoBackup(block, "Before Edit Device"))
  next = patchRoute(next, ['  app.delete("/api/iot/devices/:id", isAdminAuthenticated'], (block) => addAutoBackup(block, "Before Unassign Device"))
  next = patchRoute(next, ['  app.delete("/api/iot/devices/by-device-id/:deviceId", isAdminAuthenticated'], (block) => addAutoBackup(block, "Before Unassign Device"))

  return next
}

function patchDeviceBackupAdminUi(source: string): string {
  let next = source
  if (next.includes("Device Setup Backup")) return next

  const stateMarker = '  const [lastCreatedId, setLastCreatedId] = useState("");'
  if (next.includes(stateMarker)) {
    next = next.replace(
      stateMarker,
      [
        stateMarker,
        '  const [deviceBackup, setDeviceBackup] = useState<any>(null);',
        '  const [backingUpDevices, setBackingUpDevices] = useState(false);',
        '  const [restoringDevices, setRestoringDevices] = useState(false);',
        '  const [restoreBackupConfirm, setRestoreBackupConfirm] = useState(false);',
      ].join("\n"),
    )
  }

  const registerMarker = "  const registerDevice = async () => {"
  if (next.includes(registerMarker)) {
    const actions = [
      "  const loadDeviceBackup = async () => {",
      '    const response = await fetch("/api/iot/device-backups/latest", { credentials: "include", cache: "no-store" });',
      "    if (!response.ok) return;",
      "    const data = await response.json().catch(() => ({}));",
      "    setDeviceBackup(data?.backup || null);",
      "  };",
      "",
      "  const backupWorkingDeviceSetup = async () => {",
      "    setBackingUpDevices(true);",
      "    try {",
      '      const response = await fetch("/api/iot/device-backups", {',
      '        method: "POST",',
      '        headers: { "Content-Type": "application/json" },',
      '        credentials: "include",',
      '        body: JSON.stringify({ label: "Working device setup" }),',
      "      });",
      "      const data = await response.json().catch(() => ({}));",
      "      if (!response.ok) {",
      '        toast({ title: "Backup failed", description: data?.message || "Could not back up devices", variant: "destructive" });',
      "        return;",
      "      }",
      "      setDeviceBackup(data?.backup || null);",
      '      setRestoreBackupConfirm(false);',
      '      toast({ title: "Device setup backed up", description: `${data?.backup?.device_count ?? ownedDevices.length} assigned device(s) saved.` });',
      "    } finally {",
      "      setBackingUpDevices(false);",
      "    }",
      "  };",
      "",
      "  const restoreWorkingDeviceSetup = async () => {",
      "    if (!deviceBackup?.id) return;",
      "    setRestoringDevices(true);",
      "    try {",
      '      const response = await fetch(`/api/iot/device-backups/${deviceBackup.id}/restore`, { method: "POST", credentials: "include" });',
      "      const data = await response.json().catch(() => ({}));",
      "      if (!response.ok) {",
      '        toast({ title: "Restore failed", description: data?.message || "Could not restore device setup", variant: "destructive" });',
      "        return;",
      "      }",
      '      setRestoreBackupConfirm(false);',
      "      await loadBase();",
      "      await loadDeviceBackup();",
      '      toast({ title: "Device setup restored", description: data?.message || "Saved device assignments are back." });',
      "    } finally {",
      "      setRestoringDevices(false);",
      "    }",
      "  };",
      "",
    ].join("\n")
    next = next.replace(registerMarker, actions + registerMarker)
  }

  const effectMarker = [
    "  useEffect(() => {",
    "    loadBase().catch(() => {});",
    "    const timer = window.setInterval(() => loadBase().catch(() => {}), 20000);",
    "    return () => window.clearInterval(timer);",
    "  }, []);",
  ].join("\n")
  if (next.includes(effectMarker)) {
    next = next.replace(
      effectMarker,
      [
        "  useEffect(() => {",
        "    loadBase().catch(() => {});",
        "    loadDeviceBackup().catch(() => {});",
        "    const timer = window.setInterval(() => loadBase().catch(() => {}), 20000);",
        "    return () => window.clearInterval(timer);",
        "  }, []);",
      ].join("\n"),
    )
  }

  const addDeviceCardMarker = [
    '      <div className="rounded-2xl border border-slate-700 bg-slate-800/65 p-5">',
    '        <div className="mb-4 flex items-center gap-2">',
    '          <Plus className="h-4 w-4 text-blue-300" />',
    '          <h3 className="font-semibold text-white">Add Device → Name → Branch → Assign → Activate</h3>',
  ].join("\n")

  if (next.includes(addDeviceCardMarker)) {
    const card = [
      '      <div className="rounded-2xl border border-emerald-500/30 bg-slate-800/65 p-5">',
      '        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">',
      '          <div>',
      '            <div className="flex items-center gap-2">',
      '              <ShieldCheck className="h-4 w-4 text-emerald-300" />',
      '              <h3 className="font-semibold text-white">Device Setup Backup</h3>',
      '            </div>',
      '            <p className="mt-2 text-sm text-slate-300">',
      '              Save the working Device IDs, names and branch assignments before changing Add Device settings.',
      '            </p>',
      '            <p className="mt-1 text-xs text-slate-400">',
      '              Restore never fakes Connected, last-seen, alarm, battery or signal data. Those still come only from the real HP2 gateway.',
      '            </p>',
      '            {deviceBackup ? (',
      '              <p className="mt-2 text-xs text-emerald-200">',
      '                Last working backup: {formatUkDateTime(deviceBackup.created_at)} · {deviceBackup.device_count} device(s)',
      '              </p>',
      '            ) : (',
      '              <p className="mt-2 text-xs text-amber-200">No manual working-device backup saved yet.</p>',
      '            )}',
      '          </div>',
      '          <div className="flex flex-wrap items-center gap-2">',
      '            <Button',
      '              type="button"',
      '              onClick={backupWorkingDeviceSetup}',
      '              disabled={backingUpDevices || restoringDevices}',
      '              className="bg-emerald-600 text-white hover:bg-emerald-500"',
      '            >',
      '              <Save className="mr-2 h-4 w-4" />',
      '              {backingUpDevices ? "Saving Backup..." : "Backup Working Setup"}',
      '            </Button>',
      '            {restoreBackupConfirm ? (',
      '              <>',
      '                <Button',
      '                  type="button"',
      '                  onClick={restoreWorkingDeviceSetup}',
      '                  disabled={!deviceBackup?.id || restoringDevices}',
      '                  className="bg-amber-600 text-white hover:bg-amber-500"',
      '                >',
      '                  <RefreshCw className={`mr-2 h-4 w-4 ${restoringDevices ? "animate-spin" : ""}`} />',
      '                  {restoringDevices ? "Restoring..." : "Confirm Restore"}',
      '                </Button>',
      '                <Button',
      '                  type="button"',
      '                  variant="outline"',
      '                  onClick={() => setRestoreBackupConfirm(false)}',
      '                  disabled={restoringDevices}',
      '                  className="border-slate-600 text-slate-200"',
      '                >',
      '                  Cancel',
      '                </Button>',
      '              </>',
      '            ) : (',
      '              <Button',
      '                type="button"',
      '                variant="outline"',
      '                onClick={() => setRestoreBackupConfirm(true)}',
      '                disabled={!deviceBackup?.id || backingUpDevices || restoringDevices}',
      '                className="border-amber-600/70 text-amber-200"',
      '              >',
      '                <RefreshCw className="mr-2 h-4 w-4" />',
      '                Restore Last Backup',
      '              </Button>',
      '            )}',
      '          </div>',
      '        </div>',
      '      </div>',
      '',
    ].join("\n")
    next = next.replace(addDeviceCardMarker, card + addDeviceCardMarker)
  }

  return next
}

export function hardenPestControlDeviceBackups(
  projectId: string,
  files: Record<string, string>,
): Record<string, string> {
  if (projectId !== PEST_CONTROL_PROJECT_ID) return files

  const runtimeFiles = { ...files }
  const routesPath = "server/routes.ts"
  if (runtimeFiles[routesPath]) {
    let routes = patchDeviceBackupSchema(runtimeFiles[routesPath])
    routes = patchDeviceBackupRoutes(routes)
    runtimeFiles[routesPath] = routes
  }

  const adminPanelPath = "client/src/components/IotAdminPanel.tsx"
  if (runtimeFiles[adminPanelPath]) {
    runtimeFiles[adminPanelPath] = patchDeviceBackupAdminUi(runtimeFiles[adminPanelPath])
  }

  return runtimeFiles
}
