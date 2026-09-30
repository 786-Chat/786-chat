import { useEffect, useMemo, useState } from "react";
import { BellRing, CheckCircle2, MapPin, RefreshCw, ShieldCheck, VolumeX, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface BranchIotAlertsPanelProps {
  onOpenDevices?: () => void;
}

const ACK_STORAGE_KEY = "food-safety-iot-acknowledged-alarms-v1";

function alarmKey(device: any) {
  return `${device.id}:${device.lastAlarmAt || "active"}`;
}

function readAcknowledgedKeys() {
  try {
    const value = JSON.parse(window.localStorage.getItem(ACK_STORAGE_KEY) || "[]");
    return new Set<string>(Array.isArray(value) ? value.map(String) : []);
  } catch (_) {
    return new Set<string>();
  }
}

export default function BranchIotAlertsPanel({ onOpenDevices }: BranchIotAlertsPanelProps) {
  const [alarms, setAlarms] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stoppedKeys, setStoppedKeys] = useState<Set<string>>(new Set());

  const load = async () => {
    try {
      const [alarmRes, deviceRes, historyRes] = await Promise.all([
        fetch("/api/branch/iot-alarms?refresh=1", { credentials: "include", cache: "no-store" }),
        fetch("/api/branch/iot-devices?refresh=1", { credentials: "include", cache: "no-store" }),
        fetch("/api/branch/iot-alarm-history", { credentials: "include", cache: "no-store" }),
      ]);
      if (alarmRes.ok) {
        const data = await alarmRes.json();
        setAlarms(Array.isArray(data) ? data : []);
      }
      if (deviceRes.ok) {
        const data = await deviceRes.json();
        setDevices(Array.isArray(data) ? data : []);
      }
      if (historyRes.ok) {
        const data = await historyRes.json();
        setHistory(Array.isArray(data) ? data : []);
      }
      setStoppedKeys(readAcknowledgedKeys());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 12000);
    return () => window.clearInterval(timer);
  }, []);

  const onlineCount = useMemo(() => devices.filter((device) => device?.isOnline).length, [devices]);
  const offlineCount = devices.length - onlineCount;

  const stopAlarm = (device: any) => {
    const next = readAcknowledgedKeys();
    next.add(alarmKey(device));
    try {
      window.localStorage.setItem(ACK_STORAGE_KEY, JSON.stringify([...next]));
    } catch (_) {}
    setStoppedKeys(next);
    window.dispatchEvent(new CustomEvent("food-safety-alarm-stopped"));
  };

  return (
    <div className="space-y-6 min-h-screen">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${alarms.length ? "bg-red-500/20 ring-1 ring-red-400/40" : "bg-emerald-500/20 ring-1 ring-emerald-400/30"}`}>
            {alarms.length ? <BellRing className="h-5 w-5 text-red-300" /> : <ShieldCheck className="h-5 w-5 text-emerald-300" />}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Device Alerts</h2>
            <p className="text-sm text-slate-400">Live Food Safety pest-device alarms for this branch</p>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={() => void load()} className="border-slate-600 text-slate-200">
          <RefreshCw className="mr-1 h-3.5 w-3.5" />Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-700 bg-slate-800/70 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Assigned Devices</p>
          <p className="mt-1 text-2xl font-bold text-white">{devices.length}</p>
        </div>
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
          <p className="text-xs uppercase tracking-wide text-emerald-300">Online</p>
          <p className="mt-1 text-2xl font-bold text-emerald-200">{onlineCount}</p>
        </div>
        <div className={`rounded-xl border p-4 ${alarms.length ? "border-red-500/40 bg-red-500/15" : "border-slate-700 bg-slate-800/70"}`}>
          <p className={`text-xs uppercase tracking-wide ${alarms.length ? "text-red-300" : "text-slate-500"}`}>Mouse Caught</p>
          <p className={`mt-1 text-2xl font-bold ${alarms.length ? "text-red-200" : "text-white"}`}>{alarms.length}</p>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-10 text-center text-slate-400">Checking device alarms…</div>
      ) : alarms.length === 0 ? (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-6 w-6 flex-shrink-0 text-emerald-300" />
            <div>
              <h3 className="font-bold text-emerald-100">Ready</h3>
              <p className="mt-1 text-sm text-emerald-200/80">
                {devices.length
                  ? `All ${devices.length} assigned device${devices.length === 1 ? "" : "s"} are ready. ${offlineCount ? `${offlineCount} device${offlineCount === 1 ? " is" : "s are"} not currently connected.` : ""}`
                  : "No smart devices are assigned to this branch yet."}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {alarms.map((device) => {
            const stopped = stoppedKeys.has(alarmKey(device));
            return (
              <div key={device.id} className="rounded-2xl border border-red-500/50 bg-red-950/25 p-5 shadow-lg shadow-red-950/20">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-bold text-white">{device.deviceName || "Food Safety Smart Device"}</h3>
                      <Badge className="bg-red-500/20 text-red-200">MOUSE CAUGHT</Badge>
                      {stopped && <Badge className="bg-slate-700 text-slate-200">ALARM STOPPED</Badge>}
                    </div>
                    <p className="mt-1 break-all text-xs text-slate-500">{device.deviceId}</p>
                    {device.branchName && <p className="mt-2 text-sm text-slate-300">Branch: <span className="font-semibold text-white">{device.branchName}</span></p>}
                    {device.notes && <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-300"><MapPin className="h-4 w-4 text-red-300" />{device.notes}</p>}
                    <p className="mt-2 text-sm font-semibold text-red-200">Mouse caught. The device returns to Ready only after the trap is physically reset.</p>
                    {device.lastAlarmAt && <p className="mt-1 text-xs text-red-300">Caught: {new Date(device.lastAlarmAt).toLocaleString("en-GB")}</p>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button disabled={stopped} onClick={() => stopAlarm(device)} className="bg-red-600 text-white hover:bg-red-500 disabled:bg-slate-700 disabled:text-slate-300">
                      <VolumeX className="mr-1 h-4 w-4" />{stopped ? "Alarm Stopped" : "Stop Alarm"}
                    </Button>
                    <Button variant="outline" onClick={onOpenDevices} className="border-slate-600 text-slate-200"><Wifi className="mr-1 h-4 w-4" />Smart Devices</Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-5">
        <div className="mb-3">
          <h3 className="font-bold text-white">Catch History</h3>
          <p className="mt-1 text-sm text-slate-400">Previous catches stay in history after the alarm is stopped.</p>
        </div>
        {history.length === 0 ? (
          <p className="rounded-xl bg-slate-900/60 p-4 text-sm text-slate-400">No previous catches recorded for this branch.</p>
        ) : (
          <div className="space-y-3">
            {history.slice(0, 12).map((event: any) => (
              <div key={event.id} className="rounded-xl border border-slate-700 bg-slate-900/55 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-white">{event.deviceName || "Food Safety Smart Device"}</p>
                      {event.isTest && <Badge className="bg-amber-500/15 text-amber-300">TEST</Badge>}
                    </div>
                    {event.location && <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-300"><MapPin className="h-4 w-4 text-cyan-300" />{event.location}</p>}
                    <p className="mt-1 text-xs text-slate-400">{event.message}</p>
                  </div>
                  <p className="flex-shrink-0 text-xs font-medium text-slate-300">{event.eventAt ? new Date(event.eventAt).toLocaleString("en-GB") : "Unknown time"}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
