const PEST_CONTROL_PROJECT_ID = "22c299f8-bf65-410f-9643-92a9776dbfca"

function patchRoutes(source: string): string {
  if (!source) return source
  let next = source

  const oldHealth = `  // A device is only "Connected" when it has reported recently.
  // This prevents an old MQTT event from leaving a device green for days.
  const OWNED_IOT_ONLINE_WINDOW_MS = 30 * 60 * 1000;

  const ownedIotIsOnline = (reportedOnline: unknown, lastSeenAt: unknown) => {
    if (!reportedOnline || !lastSeenAt) return false;
    const lastSeenMs = new Date(String(lastSeenAt)).getTime();
    return Number.isFinite(lastSeenMs) && (Date.now() - lastSeenMs) <= OWNED_IOT_ONLINE_WINDOW_MS;
  };
`

  const newHealth = `  // Food Safety trap health windows. Battery traps may sleep between heartbeats.
  const OWNED_IOT_ONLINE_WINDOW_MS = 30 * 60 * 1000;
  const OWNED_IOT_STANDBY_WINDOW_MS = 6 * 60 * 60 * 1000;
  const OWNED_IOT_ATTENTION_WINDOW_MS = 24 * 60 * 60 * 1000;
  const OWNED_IOT_RESET_VISIBLE_MS = 30 * 60 * 1000;
  const OWNED_IOT_LOW_BATTERY_PCT = 20;

  const ownedIotIsOnline = (reportedOnline: unknown, lastSeenAt: unknown) => {
    if (!reportedOnline || !lastSeenAt) return false;
    const lastSeenMs = new Date(String(lastSeenAt)).getTime();
    return Number.isFinite(lastSeenMs) && (Date.now() - lastSeenMs) <= OWNED_IOT_ONLINE_WINDOW_MS;
  };

  const ownedIotDeviceHealth = (row: any) => {
    const now = Date.now();
    const lastSeenMs = row?.last_seen_at ? new Date(String(row.last_seen_at)).getTime() : NaN;
    const lastEventMs = row?.last_event_at ? new Date(String(row.last_event_at)).getTime() : NaN;
    const seenAgeMs = Number.isFinite(lastSeenMs) ? Math.max(0, now - lastSeenMs) : null;
    const eventAgeMs = Number.isFinite(lastEventMs) ? Math.max(0, now - lastEventMs) : null;
    const latestEventType = String(row?.last_event_type || "").trim().toLowerCase();
    const batteryPct = row?.battery_pct === null || row?.battery_pct === undefined ? null : Number(row.battery_pct);
    const lowBattery = latestEventType === "low_battery" || (Number.isFinite(batteryPct) && Number(batteryPct) <= OWNED_IOT_LOW_BATTERY_PCT);
    const resetReceived = latestEventType === "trap_reset" && eventAgeMs !== null && eventAgeMs <= OWNED_IOT_RESET_VISIBLE_MS;
    const hardwareFault = latestEventType === "hardware_fault";
    const explicitlyOffline = latestEventType === "offline";
    const branchAssigned = Boolean(row?.branch_id);
    const isOnline = ownedIotIsOnline(row?.is_online, row?.last_seen_at);

    let connectionStatus = "offline";
    let connectionLabel = "Offline";
    let statusMessage = "No recent heartbeat. Check batteries, Wi-Fi and the trap.";

    if (!branchAssigned) {
      connectionStatus = "available";
      connectionLabel = "Available / Unassigned";
      statusMessage = "Registered and available for branch assignment.";
    } else if (hardwareFault) {
      connectionStatus = "hardware_fault";
      connectionLabel = "Hardware Fault";
      statusMessage = "The trap reported a hardware fault. Check the physical device.";
    } else if (isOnline) {
      connectionStatus = "connected";
      connectionLabel = "Connected";
      statusMessage = "Heartbeat received recently.";
    } else if (!explicitlyOffline && seenAgeMs !== null && seenAgeMs <= OWNED_IOT_STANDBY_WINDOW_MS) {
      connectionStatus = "sleeping";
      connectionLabel = "Sleeping / Standby";
      statusMessage = "Battery trap is sleeping between heartbeats.";
    } else if (!explicitlyOffline && (seenAgeMs === null || seenAgeMs <= OWNED_IOT_ATTENTION_WINDOW_MS)) {
      connectionStatus = "needs_attention";
      connectionLabel = "Needs Attention";
      statusMessage = seenAgeMs === null
        ? "Waiting for the first heartbeat from this trap."
        : "Heartbeat is overdue. Check battery, Wi-Fi and device position.";
    }

    return {
      isOnline,
      connectionStatus,
      connectionLabel,
      statusMessage,
      lowBattery,
      resetReceived,
      hardwareFault,
      heartbeatAgeMinutes: seenAgeMs === null ? null : Math.floor(seenAgeMs / 60000),
      latestEventType: latestEventType || null,
      latestEventAt: row?.last_event_at || null,
      batteryPct: Number.isFinite(batteryPct) ? Number(batteryPct) : null,
    };
  };
`

  if (!next.includes("OWNED_IOT_STANDBY_WINDOW_MS") && next.includes(oldHealth)) {
    next = next.replace(oldHealth, newHealth)
  }

  const selectOld = `          last_seen_at,
          last_alarm_at
        FROM owned_iot_devices`
  const selectNew = `          last_seen_at,
          last_alarm_at,
          (
            SELECT e.event_type
            FROM owned_iot_events e
            WHERE e.device_id = owned_iot_devices.device_id
            ORDER BY e.event_at DESC
            LIMIT 1
          ) AS last_event_type,
          (
            SELECT e.event_at
            FROM owned_iot_events e
            WHERE e.device_id = owned_iot_devices.device_id
            ORDER BY e.event_at DESC
            LIMIT 1
          ) AS last_event_at
        FROM owned_iot_devices`
  if (!next.includes("AS last_event_type")) next = next.split(selectOld).join(selectNew)

  const mapOld = `      return rows.map((row: any) => {
        const isOnline = ownedIotIsOnline(row.is_online, row.last_seen_at);
        return {
          id: row.id,
          deviceId: row.device_id,
          deviceName: row.friendly_name || row.device_id,
          branchId: row.branch_id,
          notes: row.installation_location || row.hardware_model,
          isOnline,
          reportedOnline: Boolean(row.is_online),
          alarmActive: Boolean(row.last_alarm_at),
          lastAlarmAt: row.last_alarm_at,
          lastCheckedAt: row.last_seen_at,
          hardwareModel: row.hardware_model,
          firmwareVersion: row.firmware_version,
          provider: "food-safety-owned-mqtt",
          lastStatus: [
            { code: "battery_percentage", value: row.battery_pct },
            { code: "status", value: isOnline ? "online" : (row.last_seen_at ? "offline" : (row.lifecycle_state || "awaiting_activation")) },
            { code: "rssi", value: row.rssi },
            { code: "shock", value: Boolean(row.last_alarm_at) },
          ],
        };
      });`
  const mapNew = `      return rows.map((row: any) => {
        const health = ownedIotDeviceHealth(row);
        return {
          id: row.id,
          deviceId: row.device_id,
          deviceName: row.friendly_name || row.device_id,
          branchId: row.branch_id,
          notes: row.installation_location || row.hardware_model,
          isOnline: health.isOnline,
          reportedOnline: Boolean(row.is_online),
          connectionStatus: health.connectionStatus,
          connectionLabel: health.connectionLabel,
          statusMessage: health.statusMessage,
          heartbeatAgeMinutes: health.heartbeatAgeMinutes,
          lowBattery: health.lowBattery,
          resetReceived: health.resetReceived,
          hardwareFault: health.hardwareFault,
          latestEventType: health.latestEventType,
          latestEventAt: health.latestEventAt,
          batteryPct: health.batteryPct,
          rssi: row.rssi,
          alarmActive: Boolean(row.last_alarm_at),
          lastAlarmAt: row.last_alarm_at,
          lastCheckedAt: row.last_seen_at,
          hardwareModel: row.hardware_model,
          firmwareVersion: row.firmware_version,
          provider: "food-safety-owned-mqtt",
          lastStatus: [
            { code: "battery_percentage", value: health.batteryPct },
            { code: "status", value: health.connectionStatus },
            { code: "rssi", value: row.rssi },
            { code: "shock", value: Boolean(row.last_alarm_at) },
          ],
        };
      });`
  if (!next.includes("connectionStatus: health.connectionStatus")) next = next.split(mapOld).join(mapNew)

  next = next.replace(
    'const allowedTypes = new Set(["trap_triggered", "trap_reset", "heartbeat", "online", "offline"]);',
    'const allowedTypes = new Set(["trap_triggered", "trap_reset", "heartbeat", "online", "offline", "low_battery", "hardware_fault"]);',
  )
  next = next.replace(
    "          WHEN e.event_type = 'low_battery' THEN 'Low battery'\n          ELSE ('Device event: ' || e.event_type)",
    "          WHEN e.event_type = 'low_battery' THEN 'Low battery'\n          WHEN e.event_type = 'hardware_fault' THEN 'Hardware fault reported'\n          WHEN e.event_type = 'heartbeat' THEN 'Heartbeat received'\n          ELSE ('Device event: ' || e.event_type)",
  )

  return next
}

const ledHelpers = `
function connectionBadgeClass(status: string) {
  switch (status) {
    case "connected": return "bg-emerald-500/15 text-emerald-200 border border-emerald-400/30";
    case "sleeping": return "bg-yellow-500/15 text-yellow-200 border border-yellow-400/30";
    case "available": return "bg-blue-500/15 text-blue-200 border border-blue-400/30";
    case "needs_attention": return "bg-orange-500/15 text-orange-200 border border-orange-400/30";
    case "hardware_fault": return "bg-red-500/20 text-red-100 border border-red-400/40";
    default: return "bg-red-500/15 text-red-200 border border-red-400/30";
  }
}

function DeviceStatusLights({ device }: { device: any }) {
  const status = String(device?.connectionStatus || (device?.isOnline ? "connected" : "offline"));
  const items = [
    { key: "connected", label: "Connected", active: status === "connected", on: "bg-emerald-400 shadow-[0_0_9px_rgba(52,211,153,0.95)]" },
    { key: "sleeping", label: "Sleeping / Standby", active: status === "sleeping", on: "bg-yellow-300 shadow-[0_0_9px_rgba(253,224,71,0.95)]" },
    { key: "available", label: "Available / Unassigned", active: status === "available", on: "bg-blue-400 shadow-[0_0_9px_rgba(96,165,250,0.95)]" },
    { key: "attention", label: "Needs Attention", active: status === "needs_attention", on: "bg-orange-400 shadow-[0_0_9px_rgba(251,146,60,0.95)]" },
    { key: "offline", label: "Offline", active: status === "offline", on: "bg-red-500 shadow-[0_0_9px_rgba(239,68,68,0.95)]" },
    { key: "battery", label: "Low Battery", active: Boolean(device?.lowBattery), on: "bg-amber-400 shadow-[0_0_9px_rgba(251,191,36,0.95)]" },
    { key: "caught", label: "Mouse Caught", active: Boolean(device?.alarmActive), on: "bg-red-400 shadow-[0_0_10px_rgba(248,113,113,1)]", pulse: true },
    { key: "reset", label: "Reset Received", active: Boolean(device?.resetReceived), on: "bg-green-400 shadow-[0_0_9px_rgba(74,222,128,0.95)]" },
    { key: "fault", label: "Hardware Fault", active: Boolean(device?.hardwareFault), on: "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,1)]", pulse: true },
  ];

  return (
    <div className="mt-3 flex flex-wrap gap-x-3 gap-y-2 rounded-lg border border-slate-700/70 bg-slate-950/50 px-3 py-2">
      {items.map((item) => (
        <div key={item.key} className="flex items-center gap-1.5 whitespace-nowrap text-[11px]">
          <span
            className={\`h-2.5 w-2.5 rounded-full ring-1 ring-white/20 \${item.active ? item.on : "bg-slate-700 shadow-none"} \${item.active && item.pulse ? "animate-pulse" : ""}\`}
            aria-hidden="true"
          />
          <span className={item.active ? "font-semibold text-slate-100" : "text-slate-500"}>{item.label}</span>
        </div>
      ))}
    </div>
  );
}
`

function patchAdminPanel(source: string): string {
  if (!source || source.includes("function DeviceStatusLights")) return source
  let next = source
  const endSnapshot = "  return { battery, state };\n}\n"
  if (next.includes(endSnapshot)) next = next.replace(endSnapshot, endSnapshot + ledHelpers)

  next = next.replace(
    `                    <Badge className={device.isOnline ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-700 text-slate-300"}>
                      {device.isOnline ? "Connected" : (snap.state === "awaiting_activation" ? "Awaiting activation" : "Disconnected")}
                    </Badge>`,
    `                    <Badge className={connectionBadgeClass(String(device.connectionStatus || (device.isOnline ? "connected" : "offline")))}>
                      {device.connectionLabel || (device.isOnline ? "Connected" : "Offline")}
                    </Badge>`,
  )
  next = next.replace(
    '                  </div>\n\n                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">',
    '                  </div>\n\n                  <DeviceStatusLights device={device} />\n\n                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">',
  )
  next = next.replace(
    '<div className="rounded-lg bg-slate-800 p-2"><span className="block text-slate-500">Battery</span><span className="text-white">{snap.battery || "—"}</span></div>',
    '<div className={\`rounded-lg p-2 \${device.lowBattery ? "bg-amber-500/15" : "bg-slate-800"}\`}><span className="block text-slate-500">Battery</span><span className={device.lowBattery ? "font-semibold text-amber-200" : "text-white"}>{snap.battery || "—"}</span></div>',
  )
  next = next.replace(
    '<div className="rounded-lg bg-slate-800 p-2"><span className="block text-slate-500">Status</span><span className="text-white">{snap.state || (device.isOnline ? "Connected" : "Disconnected")}</span></div>',
    '<div className="rounded-lg bg-slate-800 p-2"><span className="block text-slate-500">Status</span><span className="text-white">{device.connectionLabel || snap.state || (device.isOnline ? "Connected" : "Offline")}</span></div>',
  )
  next = next.replace(
    '<div className={\`rounded-lg p-2 \${device.alarmActive ? "bg-red-500/20" : "bg-slate-800"}\`}><span className="block text-slate-500">Trap</span><span className={device.alarmActive ? "font-bold text-red-300" : "text-white"}>{device.alarmActive ? "Mouse Caught" : "Ready"}</span></div>',
    '<div className={\`rounded-lg p-2 \${device.alarmActive ? "bg-red-500/20" : device.resetReceived ? "bg-green-500/15" : "bg-slate-800"}\`}><span className="block text-slate-500">Trap</span><span className={device.alarmActive ? "font-bold text-red-300" : device.resetReceived ? "font-semibold text-green-300" : "text-white"}>{device.alarmActive ? "Mouse Caught" : device.resetReceived ? "Reset Received" : "Ready"}</span></div>',
  )
  next = next.replace(
    '                    {device.lastCheckedAt ? \` • Last seen \${new Date(device.lastCheckedAt).toLocaleString("en-GB")}\` : ""}\n                  </div>',
    '                    {device.lastCheckedAt ? \` • Last seen \${new Date(device.lastCheckedAt).toLocaleString("en-GB")}\` : " • Waiting for first heartbeat"}\n                    {device.heartbeatAgeMinutes !== null && device.heartbeatAgeMinutes !== undefined ? \` • Heartbeat \${device.heartbeatAgeMinutes} min ago\` : ""}\n                  </div>\n                  {device.statusMessage && <p className="mt-1 text-[11px] text-slate-400">{device.statusMessage}</p>}',
  )
  return next
}

function patchBranchPanel(source: string): string {
  if (!source || source.includes("function DeviceStatusLights")) return source
  let next = source
  const endSnapshot = "  return { battery, power };\n}\n"
  const branchHelpers = ledHelpers.replace(
    "function DeviceStatusLights",
    `function connectionBarClass(status: string) {
  switch (status) {
    case "connected": return "bg-emerald-400";
    case "sleeping": return "bg-yellow-300";
    case "available": return "bg-blue-400";
    case "needs_attention": return "bg-orange-400";
    case "hardware_fault": return "bg-rose-500";
    default: return "bg-red-500";
  }
}

function DeviceStatusLights`,
  )
  if (next.includes(endSnapshot)) next = next.replace(endSnapshot, endSnapshot + branchHelpers)

  next = next.replace(
    '              const alarm = Boolean(device.alarmActive);\n              const powerLabel = readableStatus(snap.power) || (device.isOnline ? "Connected" : "Disconnected");',
    '              const alarm = Boolean(device.alarmActive);\n              const connectionStatus = String(device.connectionStatus || (device.isOnline ? "connected" : "offline"));\n              const powerLabel = device.connectionLabel || readableStatus(snap.power) || (device.isOnline ? "Connected" : "Offline");',
  )
  next = next.replace(
    '                  <div className={\`h-1.5 \${device.isOnline ? "bg-emerald-500" : "bg-slate-600"}\`} />',
    '                  <div className={\`h-1.5 \${connectionBarClass(connectionStatus)}\`} />',
  )
  next = next.replace(
    '<Badge className={device.isOnline ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-700 text-slate-300"}>{device.isOnline ? "Connected" : "Disconnected"}</Badge>',
    '<Badge className={connectionBadgeClass(connectionStatus)}>{device.connectionLabel || (device.isOnline ? "Connected" : "Offline")}</Badge>',
  )
  next = next.replace(
    '                    </div>\n\n                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">',
    '                    </div>\n\n                    <DeviceStatusLights device={device} />\n\n                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">',
  )
  next = next.replace(
    '<div className="mt-1 flex min-w-0 items-center gap-1.5"><Battery className="h-4 w-4 flex-shrink-0 text-emerald-300" /><span className="min-w-0 break-words font-semibold text-white">{snap.battery || "—"}</span></div>',
    '<div className="mt-1 flex min-w-0 items-center gap-1.5"><Battery className={\`h-4 w-4 flex-shrink-0 \${device.lowBattery ? "text-amber-300" : "text-emerald-300"}\`} /><span className={\`min-w-0 break-words font-semibold \${device.lowBattery ? "text-amber-200" : "text-white"}\`}>{snap.battery || "—"}</span></div>',
  )
  next = next.replace(
    '<span className={\`mt-1 block break-words text-sm font-semibold leading-tight \${alarm ? "text-red-300" : "text-white"}\`}>{alarm ? "Mouse Caught" : "Ready"}</span>',
    '<span className={\`mt-1 block break-words text-sm font-semibold leading-tight \${alarm ? "text-red-300" : device.resetReceived ? "text-green-300" : "text-white"}\`}>{alarm ? "Mouse Caught" : device.resetReceived ? "Reset Received" : "Ready"}</span>',
  )
  next = next.replace(
    '<div className="mt-1 flex min-w-0 items-start gap-1.5"><Wifi className="mt-0.5 h-4 w-4 flex-shrink-0 text-cyan-300" /><span className="min-w-0 break-words text-sm font-semibold leading-tight text-white">{device.isOnline ? "Connected" : "Disconnected"}</span></div>',
    '<div className="mt-1 flex min-w-0 items-start gap-1.5"><Wifi className="mt-0.5 h-4 w-4 flex-shrink-0 text-cyan-300" /><span className="min-w-0 break-words text-sm font-semibold leading-tight text-white">{device.connectionLabel || (device.isOnline ? "Connected" : "Offline")}</span></div>',
  )
  next = next.replace(
    '                    <div className="mt-4 border-t border-slate-700/70 pt-3 text-xs text-slate-500">\n                      Last seen: {device.lastCheckedAt ? new Date(device.lastCheckedAt).toLocaleString("en-GB") : "Waiting for first check"}\n                    </div>',
    '                    <div className="mt-4 border-t border-slate-700/70 pt-3 text-xs text-slate-500">\n                      <div>Last seen: {device.lastCheckedAt ? new Date(device.lastCheckedAt).toLocaleString("en-GB") : "Waiting for first heartbeat"}</div>\n                      {device.heartbeatAgeMinutes !== null && device.heartbeatAgeMinutes !== undefined && (\n                        <div className="mt-1">Heartbeat: {device.heartbeatAgeMinutes} minute{device.heartbeatAgeMinutes === 1 ? "" : "s"} ago</div>\n                      )}\n                      {device.statusMessage && <div className="mt-1 text-slate-400">{device.statusMessage}</div>}\n                    </div>',
  )
  return next
}

export function hardenPestControlDeviceStatuses(
  projectId: string,
  files: Record<string, string>,
): Record<string, string> {
  if (projectId !== PEST_CONTROL_PROJECT_ID) return files
  const next = { ...files }
  const routesPath = "server/routes.ts"
  const adminPath = "client/src/components/IotAdminPanel.tsx"
  const branchPath = "client/src/components/BranchSmartDevicesPanel.tsx"
  if (next[routesPath]) next[routesPath] = patchRoutes(next[routesPath])
  if (next[adminPath]) next[adminPath] = patchAdminPanel(next[adminPath])
  if (next[branchPath]) next[branchPath] = patchBranchPanel(next[branchPath])
  return next
}
