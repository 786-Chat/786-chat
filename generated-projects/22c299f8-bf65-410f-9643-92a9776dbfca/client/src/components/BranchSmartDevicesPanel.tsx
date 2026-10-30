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
    if (code.includes("switch") && raw !== null && raw !== undefined && raw !== "") power = String(raw);
  }
  return { battery, power };
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
              const lastReport = device.lastCheckedAt ? new Date(device.lastCheckedAt) : null;
              const hasValidReport = Boolean(lastReport && !Number.isNaN(lastReport.getTime()));
              const powerLabel = snap.power ? readableStatus(snap.power) + (device.isOnline ? "" : " (last report)") : "Power not verified";
              const connectionLabel = device.isOnline ? "MQTT recently reported" : hasValidReport ? "No recent MQTT signal" : "MQTT not yet verified";
              const wifiSighting = device.wifiSetupSighting;
              const wifiSightingValid = wifiSighting && typeof wifiSighting.ssid === "string" &&
                wifiSighting.lastSeenAt && !Number.isNaN(new Date(wifiSighting.lastSeenAt).getTime());
              return (
                <div key={device.id} className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-800/60">
                  <div className={`h-1.5 ${device.isOnline ? "bg-emerald-500" : "bg-slate-600"}`} />
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate text-lg font-semibold text-white">Device {index + 1} — {device.deviceName}</p>
                        <p className="mt-1 break-all font-mono text-[11px] text-slate-500">{device.deviceId}</p>
                        {device.notes && <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-300"><MapPin className="h-4 w-4 text-cyan-300" />{device.notes}</p>}
                      </div>
                      <Badge className={device.isOnline ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-700 text-slate-300"}>{connectionLabel}</Badge>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <div className="min-w-0 rounded-xl bg-slate-900/70 p-3">
                        <span className="block text-[11px] uppercase tracking-wide text-slate-500">Battery</span>
                        <div className="mt-1 flex min-w-0 items-center gap-1.5"><Battery className="h-4 w-4 flex-shrink-0 text-emerald-300" /><span className="min-w-0 break-words font-semibold text-white">{snap.battery || "—"}</span></div>
                      </div>
                      <div className="min-w-0 overflow-hidden rounded-xl bg-slate-900/70 p-3">
                        <span className="block text-[11px] uppercase tracking-wide text-slate-500">Power</span>
                        <span className="mt-1 block min-w-0 break-words text-sm font-semibold leading-tight text-white">{powerLabel}</span>
                      </div>
                      <div className={`min-w-0 rounded-xl p-3 ${alarm ? "bg-red-500/15" : "bg-slate-900/70"}`}>
                        <span className="block text-[11px] uppercase tracking-wide text-slate-500">Trap</span>
                        <span className={`mt-1 block break-words text-sm font-semibold leading-tight ${alarm ? "text-red-300" : "text-white"}`}>{alarm ? "Mouse Caught" : device.isOnline ? "No active alarm" : "Not verified"}</span>
                      </div>
                      <div className="min-w-0 rounded-xl bg-slate-900/70 p-3">
                        <span className="block text-[11px] uppercase tracking-wide text-slate-500">MQTT</span>
                        <div className="mt-1 flex min-w-0 items-start gap-1.5"><Wifi className="mt-0.5 h-4 w-4 flex-shrink-0 text-cyan-300" /><span className="min-w-0 break-words text-sm font-semibold leading-tight text-white">{connectionLabel}</span></div>
                      </div>
                    </div>

                    {wifiSightingValid && (
                      <div className="mt-3 rounded-xl border border-cyan-700/40 bg-cyan-950/20 p-3 text-xs text-cyan-100">
                        <div className="flex items-center gap-2 font-semibold"><Wifi className="h-4 w-4 shrink-0" />HP2 pairing Wi-Fi observed — {wifiSighting.ssid}</div>
                        <p className="mt-1">
                          {wifiSighting.signalPercent == null ? "Signal unknown" : wifiSighting.signalPercent + "% last observed"}
                          {" · "}{wifiSighting.recentlySeen ? "Recently visible to HP2" : "No recent pairing signal (saved)"}
                          {" · "}{new Date(wifiSighting.lastSeenAt).toLocaleString("en-GB", { timeZone: "Europe/London" })}
                        </p>
                        <p className="mt-1 text-slate-300">Factory AP name match only. This does not verify the physical trap, a restaurant Wi-Fi connection, MQTT, power state, or alarm readiness.</p>
                      </div>
                    )}
                    <div className="mt-4 border-t border-slate-700/70 pt-3 text-xs text-slate-400">
                      Last verified MQTT report: {hasValidReport ? lastReport!.toLocaleString("en-GB", { timeZone: "Europe/London" }) : "None yet"}
                      {" · "}{device.isOnline ? "Recently received authenticated telemetry." : "Not currently verified. Sleeping, OFF, or out of range are all possible; no reset required."}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <p className="text-center text-xs text-slate-600">Food Safety Owned IoT • Only authenticated device reports confirm live monitoring</p>
    </div>
  );
}
