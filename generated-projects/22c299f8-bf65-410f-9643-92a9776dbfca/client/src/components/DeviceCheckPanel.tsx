import { useEffect, useMemo, useState } from "react";
import { Radar, RefreshCw, Search, Wifi, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface DeviceCheckRow {
  id: string;
  hardwareKey: string;
  macAddress?: string | null;
  ipAddress?: string | null;
  mqttPrefix?: string | null;
  hostname?: string | null;
  connected: boolean;
  rssi?: number | null;
  wifiSignalPercent?: number | null;
  wifiObservationSource?: string | null;
  isWifiRecentlySeen?: boolean;
  assignedDeviceId?: string | null;
  assignedDeviceName?: string | null;
  assignedBranchId?: string | null;
  assignedBranchName?: string | null;
  assignedLocation?: string | null;
  lastSeenAt?: string | null;
  isLive: boolean;
}

interface BranchOption {
  id: string;
  name: string;
}

export default function DeviceCheckPanel() {
  const { toast } = useToast();
  const [rows, setRows] = useState<DeviceCheckRow[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [refreshStatus, setRefreshStatus] = useState("");

  const load = async (showStatus = false) => {
    const [checkRes, branchRes] = await Promise.all([
      fetch("/api/iot/device-check", { credentials: "include", cache: "no-store" }),
      fetch("/api/branches?page=1&limit=5000", { credentials: "include", cache: "no-store" }),
    ]);
    if (!checkRes.ok) throw new Error("HP2 Device Check request failed (HTTP " + checkRes.status + ")");
    const data = await checkRes.json();
    if (!Array.isArray(data)) throw new Error("Unexpected Device Check response.");
    setRows(data);
    if (branchRes.ok) {
      const b = await branchRes.json();
      if (Array.isArray(b?.branches)) setBranches(b.branches);
    }
    if (showStatus) setRefreshStatus("Loaded " + data.length + " saved HP2 record(s). A Wi-Fi sighting is not an MQTT connection.");
  };

  useEffect(() => {
    load().catch(() => {});
    const timer = window.setInterval(() => load().catch(() => {}), 5000);
    return () => window.clearInterval(timer);
  }, []);

  const refreshReports = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await load(true);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unable to check HP2 reports.";
      setRefreshStatus(msg);
      toast({ title: "Device Check failed", description: msg, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const counts = useMemo(() => ({
    mqtt: rows.filter(r => !r.hardwareKey.startsWith("wifi-ap:") && r.isLive).length,
    wifi: rows.filter(r => r.hardwareKey.startsWith("wifi-ap:")).length,
    assigned: rows.filter(r => Boolean(r.assignedDeviceId)).length,
  }), [rows]);

  const filtered = useMemo(() => rows.filter(row => {
    const searchText = [row.hostname, row.mqttPrefix, row.macAddress,
      row.assignedDeviceId, row.assignedDeviceName, row.assignedBranchName,
      row.assignedLocation].filter(Boolean).join(" ").toLowerCase();
    return searchText.includes(search.trim().toLowerCase()) &&
      (!branchFilter || String(row.assignedBranchId || "") === branchFilter);
  }), [rows, search, branchFilter]);

  return (
    <section className="w-full max-w-full space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="rounded-xl bg-cyan-600 p-3"><Radar className="h-5 w-5 text-white" /></span>
          <div>
            <h2 className="text-xl font-bold text-white">Device Check</h2>
            <p className="text-sm text-slate-300">Find mouse Wi-Fi sightings and verify MQTT status.</p>
          </div>
        </div>
        <Button onClick={refreshReports} disabled={busy} className="bg-slate-800 text-white hover:bg-slate-700">
          <RefreshCw className="mr-2 h-4 w-4" /> {busy ? "Checking..." : "Check latest HP2 reports"}
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-200"><strong className="block text-2xl">{counts.mqtt}</strong><span className="text-xs">MQTT live</span></div>
        <div className="rounded-xl bg-cyan-500/10 p-3 text-cyan-200"><strong className="block text-2xl">{counts.wifi}</strong><span className="text-xs">Wi-Fi sightings</span></div>
        <div className="rounded-xl bg-blue-500/10 p-3 text-blue-200"><strong className="block text-2xl">{counts.assigned}</strong><span className="text-xs">Linked records</span></div>
      </div>
      <div className="grid gap-3 rounded-xl border border-slate-600 bg-slate-800/70 p-3 sm:grid-cols-2">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input aria-label="Search mice" placeholder="Search mouse ID, Wi-Fi name or MAC" value={search}
            onChange={e => setSearch(e.target.value)} className="border-slate-600 bg-slate-950 pl-9 text-white" />
        </label>
        <select aria-label="Filter customer branch" value={branchFilter} onChange={e => setBranchFilter(e.target.value)}
          className="h-10 min-w-0 rounded-md border border-slate-600 bg-slate-950 px-3 text-sm text-white">
          <option value="">All branches (including unassigned)</option>
          {branches.map(b => <option key={b.id} value={String(b.id)}>{b.name}</option>)}
        </select>
      </div>
      {refreshStatus && <p role="status" aria-live="polite" className="text-sm text-cyan-200">{refreshStatus}</p>}
      <p className="text-xs text-slate-400">Wi-Fi sightings are historical unless recently observed. They never prove an MQTT connection. Registration, Wi-Fi setup and branch assignment belong in Smart Devices.</p>
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-700 bg-slate-800/70 p-6 text-center text-slate-300">
          No matching devices in saved HP2 reports. The website cannot scan nearby Wi-Fi without the HP2 scanner.
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {filtered.map(row => {
            const wifiOnly = row.hardwareKey.startsWith("wifi-ap:");
            const mqttLive = !wifiOnly && Boolean(row.isLive);
            return (
              <article key={row.id} className="min-w-0 rounded-xl border border-slate-700 bg-slate-800/75 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="break-words font-semibold text-white">{row.assignedDeviceName || row.hostname || row.mqttPrefix || "Unidentified mouse"}</h3>
                    <p className="mt-1 break-all text-xs text-slate-400">{row.assignedDeviceId || row.macAddress || "Identity not verified"}</p>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold ${mqttLive ? "bg-emerald-500/20 text-emerald-200" : "bg-amber-500/15 text-amber-200"}`}>
                    {mqttLive ? "MQTT live" : wifiOnly ? (row.isWifiRecentlySeen ? "Wi-Fi recently seen" : "Wi-Fi last seen") : "MQTT not live"}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-md bg-slate-900/70 p-2"><span className="block text-xs text-slate-400">Wi-Fi signal</span><strong className="text-white">{wifiOnly ? (row.wifiSignalPercent == null ? "Not reported" : row.wifiSignalPercent + "% (last scan)") : "Not independently verified"}</strong></div>
                  <div className="rounded-md bg-slate-900/70 p-2"><span className="block text-xs text-slate-400">MQTT</span><strong className={mqttLive ? "text-emerald-300" : "text-amber-300"}>{mqttLive ? "Connected" : "Not verified live"}</strong></div>
                </div>
                <p className="mt-3 text-xs text-slate-300">Branch: {row.assignedBranchName || "Not assigned"}{row.assignedLocation ? " · " + row.assignedLocation : ""}</p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <button type="button" aria-expanded={Boolean(expanded[row.id])} onClick={() => setExpanded(current => ({ ...current, [row.id]: !current[row.id] }))}
                    className="inline-flex items-center gap-1 text-sm font-medium text-cyan-300 hover:text-cyan-100">
                    <ChevronDown className="h-4 w-4" /> {expanded[row.id] ? "Hide details" : "View details"}
                  </button>
                  <span className="text-xs text-slate-400">Manage registration and assignment in Smart Devices</span>
                </div>
                {expanded[row.id] && <div className="mt-3 space-y-1 rounded-lg bg-slate-900/70 p-3 text-xs text-slate-300">
                  <p>Wi-Fi BSSID / MAC: {row.macAddress || "Not recorded"}</p>
                  <p>AP / device IP: {row.ipAddress || "Not recorded"}</p>
                  <p>MQTT prefix: {wifiOnly ? "Not established" : row.mqttPrefix || "Not recorded"}</p>
                  <p>Last HP2 report: {row.lastSeenAt ? new Date(row.lastSeenAt).toLocaleString("en-GB", { timeZone: "Europe/London" }) : "Never"}</p>
                  <p>Source: {wifiOnly ? "Wi-Fi sighting only" : "Gateway record"}</p>
                  <p className="flex items-center gap-1"><Wifi className="h-3 w-3" /> Device identity and alarms require actual authenticated MQTT telemetry.</p>
                </div>}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
