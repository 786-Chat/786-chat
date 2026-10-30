import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";

type Observation = {
  id: string; hardwareKey: string; hostname?: string | null; macAddress?: string | null;
  wifiSignalPercent?: number | null; lastSeenAt?: string | null;
  isWifiRecentlySeen?: boolean;
};
const macPattern = /^([0-9a-f]{2}:){5}[0-9a-f]{2}$/i;
export default function FreshSmartCheck() {
  const [rows, setRows] = useState<Observation[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/iot/device-check", { credentials: "include", cache: "no-store" });
      if (!response.ok) throw Error("Could not read HP2 observations");
      const observations = await response.json();
      if (!Array.isArray(observations)) throw Error("Invalid HP2 observations");
      setRows(observations);
      setError("");
    } catch (e: any) { setError(e?.message || "Scan report unavailable"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    refresh();
    const timer = window.setInterval(refresh, 15000);
    return () => window.clearInterval(timer);
  }, [refresh]);
  const valid = useMemo(() => rows.filter(row =>
    row.hardwareKey?.startsWith("wifi-ap:") &&
    row.hostname?.toLowerCase().startsWith("smartlife-") &&
    macPattern.test(row.macAddress || "") &&
    row.hostname?.toLowerCase() === "smartlife-203b" &&
    row.macAddress?.toLowerCase() === "f8:17:2d:bb:20:3a"
  ), [rows]);
  const visible = valid.filter(row =>
    (row.hostname + " " + row.macAddress).toLowerCase().includes(search.toLowerCase())
  );
  const count = valid.length;
  const next = (row: Observation) => {
    if (!row.isWifiRecentlySeen) return;
    sessionStorage.setItem("pest-smart-check-selected-v1", JSON.stringify({
      ssid: row.hostname, mac: row.macAddress, observedAt: row.lastSeenAt
    }));
    window.dispatchEvent(new Event("pest:open-owned-smart-devices"));
  };
  return <main className="mx-auto max-w-4xl text-white">
    <section className="space-y-5 rounded-2xl border border-cyan-500/30 bg-slate-900/80 p-5 md:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-2xl font-bold">Smart Check</h2><p className="mt-1 text-sm text-slate-300">Mouse #11 only · {count} saved observation</p></div>
        <button type="button" onClick={refresh} disabled={loading} className="flex items-center gap-2 rounded-lg bg-cyan-700 px-4 py-2 disabled:opacity-50"><RefreshCw size={16}/>{loading ? "Checking..." : "Refresh"}</button>
      </div>
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search mouse or MAC" aria-label="Search mouse or MAC" className="w-full rounded-lg border border-slate-600 bg-slate-950 p-3"/>
      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
      {visible.length === 0 && <p className="rounded-lg bg-slate-950 p-4 text-slate-300">"Mouse #11 has not been observed yet. No other devices are shown."</p>}
      <div className="grid gap-3 md:grid-cols-2">{visible.map(row => <article key={row.id} className="rounded-xl border border-slate-700 bg-slate-950/70 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2"><strong>{row.hostname}</strong><span className={row.isWifiRecentlySeen ? "text-xs text-emerald-300" : "text-xs text-amber-300"}>{row.isWifiRecentlySeen ? "Recently seen" : "Old sighting"}</span></div>
        <p className="mt-2 font-mono text-xs text-cyan-200">{row.macAddress}</p>
        <p className="mt-2 text-sm text-slate-300">Wi-Fi signal: {row.wifiSignalPercent == null ? "Unknown" : row.wifiSignalPercent + "%"}</p>
        <button type="button" disabled={!row.isWifiRecentlySeen} onClick={() => next(row)} className="mt-3 rounded-lg bg-cyan-600 px-5 py-2 font-semibold disabled:cursor-not-allowed disabled:bg-slate-700 disabled:opacity-50">NEXT →</button>
      </article>)}</div>
      <p className="text-xs text-slate-400">Mouse #11 only. Historical sightings do not confirm a live connection; NEXT becomes available after a fresh observation.</p>
    </section>
  </main>;
}
