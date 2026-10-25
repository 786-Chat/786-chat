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
    const timer = window.setInterval(() => void load(), 6000);
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
            <p className="text-sm text-slate-400">Assigned devices · connection status requires authenticated gateway reports</p>
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
              const connectionLabel = device.connectionState === "turned_off" ? "Mouse OFF (admin confirmed)" :
                device.isOnline ? "Recent verified gateway report" :
                device.connectionState === "wifi_seen" ? "Setup Wi-Fi seen — API unverified" :
                device.connectionState === "sleeping" ? "No recent device report" :
                device.connectionState === "disconnected" ? "Last report: disconnected" : "Not yet reporting";
              const powerLabel = device.connectionState === "turned_off" ? "OFF confirmed by admin" :
                device.isOnline ? "Recent verified report" :
                device.connectionState === "wifi_seen" ? "Setup AP observed only" :
                device.connectionState === "disconnected" ? "Reported disconnected" :
                "Not verified";
              return (
                <div key={device.id} className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-800/60">
                  <div className={`h-1.5 ${device.connectionState === "turned_off" ? "bg-red-500" : device.isOnline ? "bg-emerald-500" : device.connectionState === "wifi_seen" ? "bg-cyan-500" : "bg-slate-600"}`} />
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate text-lg font-semibold text-white">Device {index + 1} — {device.deviceName}</p>
                        <p className="mt-1 break-all font-mono text-[11px] text-slate-500">{device.deviceId}</p>
                        <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-300"><MapPin className="h-4 w-4 text-cyan-300" />Recorded installation area: {device.installationArea || "Not recorded"}</p>
                      </div>
                      <Badge className={device.connectionState === "turned_off" ? "bg-red-500/20 text-red-100" : device.isOnline ? "bg-emerald-500/15 text-emerald-300" : device.connectionState === "wifi_seen" ? "bg-cyan-500/15 text-cyan-200" : device.connectionState === "sleeping" ? "bg-amber-500/15 text-amber-200" : "bg-slate-700 text-slate-300"}>{connectionLabel}</Badge>
                    </div>

                    {!device.lastCheckedAt && <p className="mt-3 rounded-lg border border-amber-500/25 bg-amber-500/10 p-2.5 text-xs text-amber-100">No authenticated device report received by Food Safety yet. Smart Life pairing is not proof that our own Mujeeb API is connected. The actual mouse power or sleep state is unknown.</p>}
                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <div className="min-w-0 rounded-xl bg-slate-900/70 p-3">
                        <span className="block text-[11px] uppercase tracking-wide text-slate-500">Battery</span>
                        <div className="mt-1 flex min-w-0 items-center gap-1.5"><Battery className="h-4 w-4 flex-shrink-0 text-emerald-300" /><span className="min-w-0 break-words font-semibold text-white">{snap.battery || "Not reported"}</span></div>
                      </div>
                      <div className="min-w-0 overflow-hidden rounded-xl bg-slate-900/70 p-3">
                        <span className="block text-[11px] uppercase tracking-wide text-slate-500">Device</span>
                        <span className="mt-1 block min-w-0 break-words text-sm font-semibold leading-tight text-white">{powerLabel}</span>
                      </div>
                      <div className={`min-w-0 rounded-xl p-3 ${alarm ? "bg-red-500/15" : "bg-slate-900/70"}`}>
                        <span className="block text-[11px] uppercase tracking-wide text-slate-500">Trap</span>
                        <span className={`mt-1 block break-words text-sm font-semibold leading-tight ${alarm ? "text-red-300" : "text-white"}`}>{alarm ? "Mouse Caught" : "No catch reported"}</span>
                      </div>
                      <div className="min-w-0 rounded-xl bg-slate-900/70 p-3">
                        <span className="block text-[11px] uppercase tracking-wide text-slate-500">Wi-Fi</span>
                        <div className="mt-1 flex min-w-0 items-start gap-1.5"><Wifi className="mt-0.5 h-4 w-4 flex-shrink-0 text-cyan-300" /><span className="min-w-0 break-words text-sm font-semibold leading-tight text-white">{device.connectionState === "turned_off" ? "OFF (admin verified)" : device.connectionState === "wifi_seen" ? "Setup AP only" : device.isOnline ? "Gateway report received" : "Not verified"}</span></div>
                      </div>
                    </div>
                    <div className="mt-3 rounded-lg border border-cyan-500/20 bg-slate-900/60 p-3 text-xs text-slate-300">
                      <p className="font-semibold text-cyan-200">Wi-Fi evidence (last observed; not live proof)</p>
                      <p className="mt-1">
                        {device.wifiSignalPercent != null
                          ? `HP2 setup Wi-Fi: ${device.wifiSignalPercent}%`
                          : "HP2 setup Wi-Fi: Not reported"}
                        {device.wifiApName ? ` · ${device.wifiApName}` : ""}
                        {device.wifiLastSeenAt ? ` · Observed ${new Date(device.wifiLastSeenAt).toLocaleString("en-GB")}` : ""}
                      </p>
                      <p className="mt-1">
                        {Array.isArray(device.lastStatus) && device.lastStatus.some((entry: any) =>
                          entry?.code === "rssi" && entry.value != null && Number.isFinite(Number(entry.value)))
                          ? `Last device-reported RSSI: ${device.lastStatus.find((entry: any) => entry?.code === "rssi").value} dBm`
                          : "Device-reported Wi-Fi RSSI: Not reported"}
                      </p>
                      <p className="mt-1 text-slate-400">Smart Life mobile pairing and HP2 setup-AP signals are separate from verified Food Safety gateway reports. A battery-powered trap can sleep without reporting its physical switch state.</p>
                    </div>

                    {device.connectionState === "turned_off" && (
                      <div className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 p-3">
                        <p className="font-semibold text-red-100">Mouse turned OFF — please contact Pest Controller Mujeeb</p>
                        <p className="mt-1 text-xs text-red-100/80">An admin physically confirmed OFF. The mouse remains assigned to this branch. Ask Mujeeb to check its power before use.</p>
                        <button type="button" onClick={() => {
                          const message = "Pest Controller Mujeeb: The mouse trap " + device.deviceName + " (" + device.deviceId + ") at our branch is confirmed turned OFF. Please arrange a check.";
                          void navigator.clipboard?.writeText(message).then(() => window.alert("Message copied. Send it to Pest Controller Mujeeb using your usual contact method.")).catch(() => window.prompt("Copy this message for Mujeeb:", message));
                        }} className="mt-3 rounded-lg border border-red-300/60 px-3 py-2 text-sm font-semibold text-red-100 hover:bg-red-500/20">
                          Copy message for Pest Controller Mujeeb
                        </button>
                      </div>
                    )}
                    <div className="mt-4 border-t border-slate-700/70 pt-3 text-xs text-slate-500">
                      Last verified device report: {device.lastCheckedAt ? new Date(device.lastCheckedAt).toLocaleString("en-GB") : "None received"}
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
