import { useEffect, useState } from "react";
import { Battery, MapPin, RefreshCw, Shield, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function normalize(value: unknown) {
  return String(value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function readableStatus(value: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";

  const normalized = raw.toLowerCase().replace(/[\s-]+/g, "_");
  const known: Record<string, string> = {
    awaiting_activation: "Awaiting activation",
    active: "Active",
    activated: "Activated",
    ready: "Ready",
    connected: "Connected",
    disconnected: "Disconnected",
    online: "Online",
    offline: "Offline",
  };

  if (known[normalized]) return known[normalized];

  const human = raw.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  return human ? human.charAt(0).toUpperCase() + human.slice(1) : raw;
}

function snapshot(statusList: any[]) {
  const list = Array.isArray(statusList) ? statusList : [];
  let battery: string | null = null;
  let power: string | null = null;
  for (const item of list) {
    const code = normalize(item?.code || item?.name || item?.dpId);
    const raw = item?.value;
    if (code.includes("battery")) battery = typeof raw === "number" ? `${raw}%` : String(raw ?? "");
    if (code === "status" || code.includes("switch")) power = String(raw ?? "");
  }
  return { battery, power };
}

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

function connectionBarClass(status: string) {
  switch (status) {
    case "connected": return "bg-emerald-400";
    case "sleeping": return "bg-yellow-300";
    case "available": return "bg-blue-400";
    case "needs_attention": return "bg-orange-400";
    case "hardware_fault": return "bg-rose-500";
    default: return "bg-red-500";
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
    <div className="mt-4 flex flex-wrap gap-x-3 gap-y-2 rounded-xl border border-slate-700/70 bg-slate-950/45 px-3 py-2.5">
      {items.map((item) => (
        <div key={item.key} className="flex items-center gap-1.5 whitespace-nowrap text-[11px]">
          <span
            className={`h-2.5 w-2.5 rounded-full ring-1 ring-white/20 ${item.active ? item.on : "bg-slate-700 shadow-none"} ${item.active && item.pulse ? "animate-pulse" : ""}`}
            aria-hidden="true"
          />
          <span className={item.active ? "font-semibold text-slate-100" : "text-slate-500"}>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function BranchSmartDevicesPanel() {
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const response = await fetch("/api/branch/iot-devices?refresh=1", { credentials: "include", cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json();
      setDevices(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 12000);
    return () => window.clearInterval(timer);
  }, []);

  const activeCatches = devices.filter((device: any) => Boolean(device.alarmActive));

  return (
    <div className="space-y-6 min-h-screen">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Smart Devices</h2>
            <p className="text-sm text-slate-400">Mouse devices assigned to this branch</p>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={() => void load()} className="border-slate-600 text-slate-200"><RefreshCw className="mr-1 h-3.5 w-3.5" />Refresh</Button>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-10 text-center text-slate-400">Loading smart devices…</div>
      ) : devices.length === 0 ? (
        <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-10 text-center">
          <p className="text-lg font-medium text-slate-300">No smart devices assigned</p>
          <p className="mt-1 text-sm text-slate-500">Your pest-control provider will assign devices to this branch.</p>
        </div>
      ) : (
        <>
          {activeCatches.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-white">Mouse caught</h3>
                  <p className="text-xs text-slate-400">The trap stays marked Caught until it is physically reset and becomes Ready again.</p>
                </div>
                <Badge className="bg-red-500/20 text-red-200">{activeCatches.length} caught</Badge>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {activeCatches.map((device: any, index: number) => (
                  <div key={`catch-${device.id}`} className="rounded-xl border border-red-500/50 bg-red-500/15 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-bold text-red-100">🐭 Mouse caught {index + 1}</p>
                        <p className="mt-1 truncate text-sm font-medium text-white">{device.deviceName}</p>
                        {device.notes && <p className="mt-1 flex items-center gap-1 text-xs text-red-200/80"><MapPin className="h-3.5 w-3.5" />{device.notes}</p>}
                      </div>
                      <Badge className="bg-red-500/25 text-red-100">Caught</Badge>
                    </div>
                    {device.lastAlarmAt && (
                      <p className="mt-3 text-xs text-red-200">Caught: {new Date(device.lastAlarmAt).toLocaleString("en-GB")}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {devices.map((device: any, index: number) => {
              const snap = snapshot(device.lastStatus);
              const alarm = Boolean(device.alarmActive);
              const connectionStatus = String(device.connectionStatus || (device.isOnline ? "connected" : "offline"));
              const powerLabel = device.connectionLabel || readableStatus(snap.power) || (device.isOnline ? "Connected" : "Offline");
              return (
                <div key={device.id} className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-800/60">
                  <div className={`h-1.5 ${connectionBarClass(connectionStatus)}`} />
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate text-lg font-semibold text-white">Device {index + 1} — {device.deviceName}</p>
                        <p className="mt-1 break-all font-mono text-[11px] text-slate-500">{device.deviceId}</p>
                        {device.notes && <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-300"><MapPin className="h-4 w-4 text-cyan-300" />{device.notes}</p>}
                      </div>
                      <Badge className={connectionBadgeClass(connectionStatus)}>{device.connectionLabel || (device.isOnline ? "Connected" : "Offline")}</Badge>
                    </div>

                    <DeviceStatusLights device={device} />

                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <div className="min-w-0 rounded-xl bg-slate-900/70 p-3">
                        <span className="block text-[11px] uppercase tracking-wide text-slate-500">Battery</span>
                        <div className="mt-1 flex min-w-0 items-center gap-1.5"><Battery className={`h-4 w-4 flex-shrink-0 ${device.lowBattery ? "text-amber-300" : "text-emerald-300"}`} /><span className={`min-w-0 break-words font-semibold ${device.lowBattery ? "text-amber-200" : "text-white"}`}>{snap.battery || "—"}</span></div>
                      </div>
                      <div className="min-w-0 overflow-hidden rounded-xl bg-slate-900/70 p-3">
                        <span className="block text-[11px] uppercase tracking-wide text-slate-500">Device</span>
                        <span className="mt-1 block min-w-0 break-words text-sm font-semibold leading-tight text-white">{powerLabel}</span>
                      </div>
                      <div className={`min-w-0 rounded-xl p-3 ${alarm ? "bg-red-500/15" : "bg-slate-900/70"}`}>
                        <span className="block text-[11px] uppercase tracking-wide text-slate-500">Trap</span>
                        <span className={`mt-1 block break-words text-sm font-semibold leading-tight ${alarm ? "text-red-300" : device.resetReceived ? "text-green-300" : "text-white"}`}>{alarm ? "Mouse Caught" : device.resetReceived ? "Reset Received" : "Ready"}</span>
                      </div>
                      <div className="min-w-0 rounded-xl bg-slate-900/70 p-3">
                        <span className="block text-[11px] uppercase tracking-wide text-slate-500">Wi-Fi</span>
                        <div className="mt-1 flex min-w-0 items-start gap-1.5"><Wifi className="mt-0.5 h-4 w-4 flex-shrink-0 text-cyan-300" /><span className="min-w-0 break-words text-sm font-semibold leading-tight text-white">{device.connectionLabel || (device.isOnline ? "Connected" : "Offline")}</span></div>
                      </div>
                    </div>

                    <div className="mt-4 border-t border-slate-700/70 pt-3 text-xs text-slate-500">
                      <div>Last seen: {device.lastCheckedAt ? new Date(device.lastCheckedAt).toLocaleString("en-GB") : "Waiting for first heartbeat"}</div>
                      {device.heartbeatAgeMinutes !== null && device.heartbeatAgeMinutes !== undefined && (
                        <div className="mt-1">Heartbeat: {device.heartbeatAgeMinutes} minute{device.heartbeatAgeMinutes === 1 ? "" : "s"} ago</div>
                      )}
                      {device.statusMessage && <div className="mt-1 text-slate-400">{device.statusMessage}</div>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <p className="text-center text-xs text-slate-600">Powered by Food Safety Owned IoT • Live pest monitoring</p>
    </div>
  );
}
