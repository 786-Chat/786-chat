
import { useEffect, useState } from "react";
import { Battery, RefreshCw, Shield, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function normalize(value: unknown) {
  return String(value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function snapshot(statusList: any[]) {
  const list = Array.isArray(statusList) ? statusList : [];
  let battery: string | null = null;
  let power: string | null = null;
  let shock = false;
  for (const item of list) {
    const code = normalize(item?.code || item?.name || item?.dpId);
    const raw = item?.value;
    if (code.includes("battery")) battery = typeof raw === "number" ? `${raw}%` : String(raw ?? "");
    if (code === "status" || code.includes("switch")) power = String(raw ?? "");
    if (code.includes("shock")) {
      const v = normalize(raw);
      shock = raw === true || ["over", "alarm", "triggered", "on", "1", "true"].includes(v);
    }
  }
  return { battery, power, shock };
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
    load();
    const timer = window.setInterval(load, 12000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="space-y-6 min-h-screen">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Smart Devices</h2>
            <p className="text-sm text-slate-400">Live pest-control devices assigned to this branch</p>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={load} className="border-slate-600 text-slate-200"><RefreshCw className="mr-1 h-3.5 w-3.5" />Refresh</Button>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-10 text-center text-slate-400">Loading smart devices…</div>
      ) : devices.length === 0 ? (
        <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-10 text-center">
          <p className="text-lg font-medium text-slate-300">No smart devices assigned</p>
          <p className="mt-1 text-sm text-slate-500">Your pest-control provider will assign devices to this branch.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {devices.map((device: any) => {
            const snap = snapshot(device.lastStatus);
            const alarm = Boolean(device.alarmActive || snap.shock);
            return (
              <div key={device.id} className={`overflow-hidden rounded-2xl border ${alarm ? "border-red-500/60 bg-red-950/20" : "border-slate-700 bg-slate-800/60"}`}>
                <div className={`h-1.5 ${alarm ? "bg-red-500" : device.isOnline ? "bg-emerald-500" : "bg-slate-600"}`} />
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-lg font-semibold text-white">{device.deviceName}</p>
                      <p className="mt-1 break-all font-mono text-[11px] text-slate-500">{device.deviceId}</p>
                      {device.notes && <p className="mt-1 text-sm text-slate-400">{device.notes}</p>}
                    </div>
                    <Badge className={device.isOnline ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-700 text-slate-300"}>{device.isOnline ? "Online" : "Offline"}</Badge>
                  </div>

                  {alarm && (
                    <div className="mt-4 rounded-xl border border-red-500/40 bg-red-500/15 p-3">
                      <p className="font-bold text-red-200">⚠ Pest trap triggered</p>
                      <p className="mt-1 text-xs text-red-300">Check the trap safely, remove the pest, clean/reset the device, and return it to service.</p>
                      {device.lastAlarmAt && <p className="mt-1 text-xs text-red-300">Triggered: {new Date(device.lastAlarmAt).toLocaleString("en-GB")}</p>}
                    </div>
                  )}

                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-xl bg-slate-900/70 p-3">
                      <span className="block text-[11px] uppercase tracking-wide text-slate-500">Battery</span>
                      <div className="mt-1 flex items-center gap-1.5"><Battery className="h-4 w-4 text-emerald-300" /><span className="font-semibold text-white">{snap.battery || "—"}</span></div>
                    </div>
                    <div className="rounded-xl bg-slate-900/70 p-3">
                      <span className="block text-[11px] uppercase tracking-wide text-slate-500">Device</span>
                      <span className="mt-1 block font-semibold text-white">{snap.power || (device.isOnline ? "Online" : "Offline")}</span>
                    </div>
                    <div className={`rounded-xl p-3 ${alarm ? "bg-red-500/15" : "bg-slate-900/70"}`}>
                      <span className="block text-[11px] uppercase tracking-wide text-slate-500">Trap Event</span>
                      <span className={`mt-1 block font-semibold ${alarm ? "text-red-300" : "text-white"}`}>{alarm ? "Triggered" : "Normal"}</span>
                    </div>
                    <div className="rounded-xl bg-slate-900/70 p-3">
                      <span className="block text-[11px] uppercase tracking-wide text-slate-500">Connection</span>
                      <div className="mt-1 flex items-center gap-1.5"><Wifi className="h-4 w-4 text-cyan-300" /><span className="font-semibold text-white">Wi-Fi / Cloud</span></div>
                    </div>
                  </div>

                  <div className="mt-4 border-t border-slate-700/70 pt-3 text-xs text-slate-500">
                    Last seen: {device.lastCheckedAt ? new Date(device.lastCheckedAt).toLocaleString("en-GB") : "Waiting for first cloud check"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-center text-xs text-slate-600">Powered by Tuya / Smart Life Cloud • Live IoT pest monitoring</p>
    </div>
  );
}
