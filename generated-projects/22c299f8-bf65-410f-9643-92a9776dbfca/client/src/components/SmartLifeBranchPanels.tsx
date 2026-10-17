
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Wifi, Battery, Shield, Volume2, VolumeX, CheckCircle2, Mouse, MapPin } from "lucide-react";

type Device = {
  id: string; deviceCode: string; name: string; installationArea: string;
  batteryPercent: number | null; connectionStatus: string; trapStatus: string;
  signalDbm: number | null; updatedAt: string;
};
type Alert = {
  id: string; deviceId: string; deviceCode: string; deviceName: string;
  installationArea: string; caughtCount: number; message: string;
  sentAt: string; acknowledgedAt: string | null;
};
const fetchBranch = async (url: string) => {
  const response = await fetch(url, { credentials: "include", cache: "no-store" });
  if (!response.ok) throw new Error(response.status === 403 ? "This section is hidden." : "Could not load SmartLife information.");
  return response.json();
};
const useDevices = (branchKey: string) => useQuery<Device[]>({
  queryKey: ["/api/branch/smartlife/devices",branchKey],
  enabled: Boolean(branchKey),
  queryFn: () => fetchBranch("/api/branch/smartlife/devices"),
  refetchInterval: 12000, refetchOnWindowFocus: true, retry: false,
});
const useAlerts = (branchKey: string, enabled = true) => useQuery<Alert[]>({
  queryKey: ["/api/branch/smartlife/alerts",branchKey],
  queryFn: () => fetchBranch("/api/branch/smartlife/alerts"),
  enabled: enabled && Boolean(branchKey), refetchInterval: 7000, refetchOnWindowFocus: true, retry: false,
});
const dateString = (value?: string | null) => value ? new Date(value).toLocaleString("en-GB") : "Not reported";

export function SmartLifeBranchDevices({branchKey,branchName}:{branchKey:string;branchName:string}) {
  const { data, isLoading, error } = useDevices(branchKey);
  const devices = data || [];
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">SmartLife Devices</h1>
        <p className="text-sm text-slate-300">Devices assigned to this restaurant</p>
      </div>
      {isLoading && <p className="text-slate-300">Loading SmartLife devices…</p>}
      {error && <p role="alert" className="text-red-300">{(error as Error).message}</p>}
      {!isLoading && !error && devices.length === 0 &&
        <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-6 text-slate-300">No SmartLife devices are assigned to this restaurant yet.</div>}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {devices.map((device, index) => (
          <article key={device.id} className="rounded-2xl border border-blue-500/30 bg-slate-900/75 p-5 shadow-lg">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold text-white">Device {index + 1} — {device.name}</h2>
                <p className="mt-1 text-sm text-slate-300">{branchName}</p>
                <p className="mt-1 text-xs text-slate-400">{device.deviceCode}</p>
                <p className="mt-1 flex items-center gap-1 text-sm text-slate-300">
                  <MapPin className="h-4 w-4 text-cyan-300" />{device.installationArea}
                </p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold
                ${device.connectionStatus === "connected" ? "bg-emerald-500/20 text-emerald-200" :
                   device.connectionStatus === "disconnected" ? "bg-red-500/20 text-red-200" : "bg-slate-700 text-slate-200"}`}>
                {device.connectionStatus === "connected" ? "Connected" : device.connectionStatus === "disconnected" ? "Disconnected" : "Not reported"}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="rounded-xl bg-slate-800 p-3"><p className="text-xs text-slate-400">SYSTEM</p><p className="mt-1 text-sm font-semibold text-white">SmartLife</p></div>
              <div className="rounded-xl bg-slate-800 p-3"><p className="flex items-center gap-1 text-xs text-slate-400"><Battery className="h-3 w-3" /> BATTERY</p><p className="mt-1 text-sm font-semibold text-white">{device.batteryPercent == null ? "—" : `${device.batteryPercent}%`}</p></div>
              <div className="rounded-xl bg-slate-800 p-3"><p className="text-xs text-slate-400">STATUS</p><p className="mt-1 text-sm font-semibold text-white">{device.connectionStatus === "connected" ? "Online (reported)" : device.connectionStatus === "disconnected" ? "Offline (reported)" : "Awaiting report"}</p></div>
              <div className="rounded-xl bg-slate-800 p-3"><p className="flex items-center gap-1 text-xs text-slate-400"><Shield className="h-3 w-3" /> TRAP</p><p className="mt-1 text-sm font-semibold text-white">{device.trapStatus === "caught" ? "Mouse caught" : device.trapStatus === "service_required" ? "Service required" : "Ready"}</p></div>
            </div>
            <div className="mt-4 space-y-1 border-t border-slate-700 pt-3 text-xs text-slate-300">
              <p className="flex items-center gap-2"><Wifi className="h-3.5 w-3.5" />Wi-Fi signal: {device.signalDbm == null ? "Not reported" : `${device.signalDbm} dBm (last report)`}</p>
              <p>Last updated: {dateString(device.updatedAt)}</p>
              <p>Installation area: {device.installationArea}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

const stopSmartLifeAlarm = async (alertId: string) => {
  const response = await fetch(`/api/branch/smartlife/alerts/${encodeURIComponent(alertId)}/stop`, {
    method: "POST", credentials: "include",
  });
  if (!response.ok) throw new Error("Unable to stop this alarm. Please retry.");
};

export function SmartLifeBranchAlerts({branchKey}:{branchKey:string}) {
  const { data, isLoading, error } = useAlerts(branchKey);
  const queryClient = useQueryClient();
  const [stopping, setStopping] = useState<string | null>(null);
  const [stopError, setStopError] = useState("");
  const acknowledge = async (id: string) => {
    setStopping(id); setStopError("");
    try {
      await stopSmartLifeAlarm(id);
      await queryClient.invalidateQueries({ queryKey: ["/api/branch/smartlife/alerts"] });
    } catch (err: any) { setStopError(err?.message || "Unable to stop alarm."); }
    finally { setStopping(null); }
  };
  const alerts = data || [];
  return (
    <div className="space-y-4">
      <div><h1 className="flex items-center gap-2 text-2xl font-bold text-white"><Bell className="h-6 w-6" />SmartLife Alert</h1>
        <p className="text-sm text-slate-300">Mouse alerts for this restaurant</p></div>
      {isLoading && <p className="text-slate-300">Loading alerts…</p>}
      {error && <p role="alert" className="text-red-300">{(error as Error).message}</p>}
      {stopError && <p role="alert" className="text-red-300">{stopError}</p>}
      {!isLoading && !error && alerts.length === 0 &&
        <div className="rounded-xl border border-slate-700 bg-slate-900/75 p-6 text-slate-300">No SmartLife alerts for this restaurant.</div>}
      {alerts.map((alert) => (
        <article key={alert.id} className={`rounded-xl border p-4 ${alert.acknowledgedAt ? "border-slate-700 bg-slate-900/70" : "border-red-500 bg-red-950/50"}`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className={`text-lg font-bold ${alert.acknowledgedAt ? "text-white" : "text-red-200"}`}>
                {alert.acknowledgedAt ? "Resolved catch" : "🔴 MOUSE CAUGHT"} — {alert.caughtCount}
              </p>
              <p className="mt-1 text-sm font-medium text-white">{alert.deviceName} · {alert.installationArea}</p>
              <p className="text-xs text-slate-300">{alert.deviceCode} · {dateString(alert.sentAt)}</p>
              {alert.message && <p className="mt-2 text-sm text-slate-200">{alert.message}</p>}
            </div>
            {alert.acknowledgedAt
              ? <span className="flex items-center gap-1 text-sm text-emerald-300"><CheckCircle2 className="h-4 w-4" />Stopped</span>
              : <button type="button" disabled={stopping === alert.id} onClick={() => void acknowledge(alert.id)}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50">
                  <VolumeX className="mr-1 inline h-4 w-4" />{stopping === alert.id ? "Stopping…" : "Stop Alarm"}
                </button>}
          </div>
        </article>
      ))}
    </div>
  );
}

/** Always mounted in the branch dashboard, even when the alerts tab is not open.
 * An audible tone requires browser autoplay permission; customer can enable it
 * with the visible "Enable sound" control if autoplay is blocked.
 */
export function SmartLifeAlarmListener({ enabled, branchKey }: { enabled: boolean; branchKey:string }) {
  const { data } = useAlerts(branchKey, enabled);
  const queryClient = useQueryClient();
  const [soundAllowed, setSoundAllowed] = useState(false);
  const [soundError, setSoundError] = useState("");
  const [busy, setBusy] = useState(false);
  const ctxRef = useRef<any>(null);
  const pending = (data || []).filter((alert) => !alert.acknowledgedAt);
  const tone = async () => {
    if (typeof window === "undefined") return;
    try {
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!ctxRef.current) ctxRef.current = new AudioCtx();
      if (ctxRef.current.state === "suspended") await ctxRef.current.resume();
      const ctx = ctxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine"; osc.frequency.value = 840;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.42);
      setSoundError("");
    } catch {
      setSoundError("To hear alerts, click Enable sound.");
    }
  };
  useEffect(() => {
    if (!enabled || !pending.length) return;
    void tone();
    const interval = setInterval(() => { void tone(); }, 2800);
    return () => clearInterval(interval);
  }, [enabled, pending.map((item) => item.id).join(",")]);
  useEffect(() => () => { try { ctxRef.current?.close(); } catch {} }, []);
  if (!enabled || !pending.length) return null;
  const latest = pending[0];
  const stopAll = async () => {
    if (busy) return;
    setBusy(true);
    try {
      for (const alert of pending) await stopSmartLifeAlarm(alert.id);
      await queryClient.invalidateQueries({queryKey:["/api/branch/smartlife/alerts"]});
    } catch (err: any) { setSoundError(err?.message || "Could not stop alarm."); }
    finally { setBusy(false); }
  };
  return (
    <div role="alert" className="fixed bottom-5 left-3 right-3 z-[100] mx-auto max-w-lg rounded-2xl border-2 border-red-400 bg-red-950 p-4 text-white shadow-2xl sm:left-auto sm:right-6">
      <p className="flex items-center gap-2 text-lg font-bold text-red-200"><Bell className="h-5 w-5 animate-pulse" /> SmartLife — MOUSE CAUGHT</p>
      <p className="mt-1 text-sm">{latest.deviceName} — {latest.installationArea} ({latest.caughtCount} caught)</p>
      {pending.length > 1 && <p className="text-xs text-red-200">{pending.length} alarms waiting</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" disabled={busy} onClick={() => void stopAll()} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold hover:bg-red-500">
          <VolumeX className="mr-1 inline h-4 w-4" />{busy ? "Stopping…" : "Stop Alarm"}
        </button>
        <button type="button" onClick={() => { setSoundAllowed(true); void tone(); }}
          className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold hover:bg-red-900">
          <Volume2 className="mr-1 inline h-4 w-4" />{soundAllowed ? "Sound enabled" : "Enable sound"}
        </button>
      </div>
      {soundError && <p className="mt-2 text-xs text-yellow-200">{soundError}</p>}
    </div>
  );
}
