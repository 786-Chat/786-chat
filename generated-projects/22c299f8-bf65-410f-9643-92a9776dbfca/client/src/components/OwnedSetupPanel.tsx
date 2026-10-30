import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

type Selection = { ssid: string; mac: string };
type NearbyNetwork = { ssid: string; frequency: number; signal: number };
type RouterScan = { source: string; fresh: boolean; reportedAt: string | null; networks: NearbyNetwork[] };
export default function OwnedSetupPanel() {
  const { toast } = useToast();
  const [selected, setSelected] = useState<Selection | null>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [branchId, setBranchId] = useState("");
  const [busy, setBusy] = useState(false);
  const [installerMethod, setInstallerMethod] = useState<"hp2" | "remote">("hp2");
  const [localWifiName, setLocalWifiName] = useState("");
  // In-memory only: never persist, log or submit Wi-Fi credentials before provisioning is verified.
  const [wifiPassword, setWifiPassword] = useState("");
  const [showWifiPassword, setShowWifiPassword] = useState(false);
  const [scan, setScan] = useState<RouterScan | null>(null);
  const [scanBusy, setScanBusy] = useState(false);
  const [scanError, setScanError] = useState("");
  const fetchNearbyNetworks = async () => {
    setScanBusy(true);
    try {
      const response = await fetch("/api/iot/router-wifi-networks", { credentials: "include", cache: "no-store" });
      if (!response.ok) throw new Error("Wi-Fi network report unavailable (HTTP " + response.status + ")");
      const data = await response.json() as RouterScan;
      setScan(data);
      setScanError("");
    } catch (error: any) {
      setScanError(String(error?.message || error));
      setScan(null);
    } finally { setScanBusy(false); }
  };
  const load = async () => {
    const [br, dv] = await Promise.all([
      fetch("/api/branches?page=1&limit=5000", { credentials: "include", cache: "no-store" }),
      fetch("/api/iot/devices", { credentials: "include", cache: "no-store" }),
    ]);
    if (br.ok) { const x = await br.json(); setBranches(Array.isArray(x?.branches) ? x.branches : []); }
    if (dv.ok) { const x = await dv.json(); setDevices(Array.isArray(x) ? x : []); }
  };
  useEffect(() => {
    load().catch(() => {});
    const syncSelection = () => {
      try {
        const raw = sessionStorage.getItem("pest-smart-check-selected-v1");
        const item = raw ? JSON.parse(raw) : null;
        setSelected(typeof item?.ssid === "string" && typeof item?.mac === "string" ? { ssid: item.ssid, mac: item.mac } : null);
      } catch (_) { setSelected(null); }
    };
    syncSelection();
    window.addEventListener("pest:open-owned-smart-devices", syncSelection);
    return () => window.removeEventListener("pest:open-owned-smart-devices", syncSelection);
  }, []);
  useEffect(() => { if (installerMethod === "hp2") fetchNearbyNetworks(); }, [installerMethod]);
  const nearby24 = scan?.fresh ? (scan.networks || []).filter(n => n.frequency >= 2400 && n.frequency < 2500).sort((a,b) => b.signal-a.signal) : [];
  const alreadyRegistered = selected && devices.find((device) => String(device.deviceName || "").toLowerCase().includes(selected.ssid.toLowerCase()));
  const save = async () => {
    if (!selected || !branchId || alreadyRegistered) return;
    setBusy(true);
    try {
      const res = await fetch("/api/iot/devices", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId: "", deviceName: selected.ssid, branchId, notes: "Wi-Fi AP observed: " + selected.mac + ". MQTT identity not yet verified.", hardwareModel: "BK7231N-MOUSE-V1" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Registration failed");
      toast({ title: "Registration saved", description: "Branch assigned in the database. Physical Wi-Fi and MQTT are not yet verified." });
      sessionStorage.removeItem("pest-smart-check-selected-v1");
      setSelected(null);
      await load();
    } catch (error: any) {
      toast({ title: "Could not register", description: String(error?.message || error), variant: "destructive" });
    } finally { setBusy(false); }
  };
  return <main className="space-y-5 text-white">
    <header className="rounded-2xl border border-cyan-500/30 bg-slate-900/70 p-5">
      <h2 className="text-2xl font-bold">Smart Devices · New Setup</h2>
      <p className="mt-2 text-sm text-slate-300">Identify a physical mouse, select its customer branch, then verify local Wi-Fi provisioning and MQTT before marking it connected. Existing records are preserved.</p>
    </header>
    <section className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5 space-y-3">
      <h3 className="font-semibold">Installation location · UK or worldwide</h3>
      <p className="text-sm text-slate-300">A remote website cannot scan nearby Wi-Fi networks. The scanner must run at the restaurant, on a computer or mobile installer physically near the mouse.</p>
      <fieldset className="grid gap-3 sm:grid-cols-2">
        <label className="flex cursor-pointer gap-3 rounded-lg border border-slate-600 bg-slate-950/70 p-3">
          <input type="radio" name="installerMethod" checked={installerMethod === "hp2"} onChange={() => setInstallerMethod("hp2")}/>
          <span><strong className="block">HP2 local scanner</strong><small className="text-slate-300">Available at HP2's physical location. Select a mouse from Smart Check.</small></span>
        </label>
        <label className="flex cursor-pointer gap-3 rounded-lg border border-slate-600 bg-slate-950/70 p-3">
          <input type="radio" name="installerMethod" checked={installerMethod === "remote"} onChange={() => setInstallerMethod("remote")}/>
          <span><strong className="block">Other country · local installer</strong><small className="text-slate-300">Requires a compatible mobile or on-site scanner/provisioning app; not connected yet.</small></span>
        </label>
      </fieldset>
      {installerMethod === "remote" && <p role="status" className="rounded-lg bg-amber-900/20 p-3 text-sm text-amber-200">Worldwide scanning is not available from this browser alone. Do not register an arbitrary mouse from a historical HP2 observation. On-site installer integration and physical firmware validation are required.</p>}
    </section>
    <section className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5 space-y-4">
      <h3 className="font-semibold">1 · Selected mouse</h3>
      {selected ? <div className="rounded-xl bg-slate-800 p-4">
        <strong>{selected.ssid}</strong><p className="font-mono text-xs text-cyan-200">{selected.mac}</p>
        <p className="mt-2 text-xs text-amber-300">HP2 Wi-Fi sighting only · MQTT not verified</p>
      </div> : <p className="text-sm text-slate-400">No new mouse selected. Go to Smart Check and click Next on a detected mouse.</p>}
      {alreadyRegistered && <p className="text-sm text-amber-200">This name matches an existing registration. No duplicate will be created. Verify its MAC and MQTT identity before any changes.</p>}
      <label className="block text-sm">2 · Restaurant / Branch
        <select className="mt-2 block w-full rounded-lg bg-slate-950 p-3" value={branchId} onChange={e=>setBranchId(e.target.value)}>
          <option value="">Select customer branch</option>
          {branches.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </label>
      <button disabled={installerMethod !== "hp2" || !selected || !branchId || !!alreadyRegistered || busy} onClick={save} className="rounded-lg bg-cyan-600 px-5 py-3 font-semibold disabled:opacity-40">{busy ? "Saving..." : "Save registration and branch (not connected)"}</button>
    </section>
    <section className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5 space-y-3">
      <h3 className="font-semibold">3 · Restaurant Wi-Fi and physical MQTT verification</h3>
      {installerMethod === "hp2" && <div className="space-y-3 rounded-lg border border-cyan-500/30 bg-slate-950/60 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <strong>Nearby 2.4 GHz networks reported by HP2</strong>
          <button type="button" onClick={fetchNearbyNetworks} disabled={scanBusy} className="rounded-lg bg-cyan-700 px-4 py-2 text-sm disabled:opacity-50">{scanBusy ? "Loading..." : "Refresh network list"}</button>
        </div>
        <p className="text-xs text-slate-400">HP2 scans using its local Wi-Fi adapter and uploads a time-limited network list. Refresh retrieves that report; it does not command HP2 to rescan. This is not available when installing abroad without a local installer.</p>
        {scanError && <p role="alert" className="text-sm text-red-300">{scanError}</p>}
        {scan && !scan.fresh && <p role="status" className="text-sm text-amber-200">No recent HP2 router scan. Network selection from old scans is disabled. Check the HP2 router-scanner process and its report destination.</p>}
        {scan?.fresh && <p className="text-xs text-cyan-200">Report received: {scan.reportedAt ? new Date(scan.reportedAt).toLocaleString("en-GB") : "time unavailable"} · {nearby24.length} nearby 2.4 GHz networks</p>}
        {scan?.fresh && nearby24.length === 0 && <p className="text-sm text-amber-200">No 2.4 GHz networks found in the latest scan.</p>}
        {nearby24.length > 0 && <label className="block text-sm">Choose a detected 2.4 GHz network
          <select value={nearby24.some(n=>n.ssid===localWifiName)?localWifiName:""} onChange={e=>{setLocalWifiName(e.target.value);setWifiPassword("");setShowWifiPassword(false);}} className="mt-2 w-full rounded-lg border border-slate-600 bg-slate-950 p-3">
            <option value="">Select a nearby network</option>
            {nearby24.map(n=><option key={n.ssid+":"+n.frequency} value={n.ssid}>{n.ssid} · {n.signal}% · {n.frequency} MHz</option>)}
          </select>
        </label>}
      </div>}
      <label className="block text-sm">2.4 GHz Wi-Fi name (manual entry for planning only)
        <input type="text" value={localWifiName} onChange={e=>setLocalWifiName(e.target.value)} autoComplete="off" placeholder="Restaurant Wi-Fi name" className="mt-2 w-full rounded-lg border border-slate-600 bg-slate-950 p-3"/>
      </label>
      <div className="space-y-2 rounded-lg border border-slate-600 bg-slate-950/60 p-4">
        <label htmlFor="owned-mouse-wifi-password" className="block text-sm font-medium">2.4 GHz Wi-Fi password (local entry only)</label>
        <div className="flex gap-2">
          <input id="owned-mouse-wifi-password" type={showWifiPassword ? "text" : "password"} value={wifiPassword} onChange={e => setWifiPassword(e.target.value)} autoComplete="new-password" autoCapitalize="none" spellCheck={false} placeholder={localWifiName ? "Enter password for " + localWifiName : "Select your Wi-Fi network first"} disabled={!localWifiName} className="min-w-0 flex-1 rounded-lg border border-slate-600 bg-slate-900 p-3 disabled:opacity-50" />
          <button type="button" onClick={() => setShowWifiPassword(v => !v)} disabled={!wifiPassword} className="rounded-lg bg-slate-700 px-4 py-2 text-sm disabled:opacity-50" aria-label={showWifiPassword ? "Hide Wi-Fi password" : "Show Wi-Fi password"}>{showWifiPassword ? "Hide" : "Show"}</button>
        </div>
        <p className="text-xs text-amber-200">Password stays in this open browser form only; it is not sent, saved, or used to connect yet. Closing or reloading the page clears it. Mouse provisioning is not active.</p>
      </div>
      <p className="rounded-lg bg-slate-950/80 p-4 text-sm text-amber-200">Network and password entry does not provision the factory mouse. Connect remains disabled until a secure, tested provisioning protocol and compatible firmware are available.</p>
      <p className="text-sm text-slate-300">Next hardware check: verify mouse firmware compatibility, provisioning transport, and authenticated MQTT telemetry before enabling Connect.</p>
      <div className="grid gap-2 text-sm text-slate-300"><p>1. Discovery: verified only when a nearby Wi-Fi AP is observed.</p><p>2. Branch registration: a database record, not a Wi-Fi connection.</p><p>3. Local Wi-Fi provisioning: not yet supported for this factory firmware.</p><p>4. Authenticated MQTT and real trap sensor: not yet verified.</p></div>
      <button disabled className="rounded-lg bg-slate-700 px-5 py-3 opacity-60">Connect and verify MQTT — unavailable until device protocol is tested</button>
    </section>
  </main>;
}
