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
  const [wifiChoiceSaved, setWifiChoiceSaved] = useState(false);
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
        const recent = item?.observedAt && Date.now() - new Date(item.observedAt).getTime() >= 0 && Date.now() - new Date(item.observedAt).getTime() < 180000;
        if (!recent) sessionStorage.removeItem("pest-smart-check-selected-v1");
        setSelected(recent && typeof item?.ssid === "string" && typeof item?.mac === "string" ? { ssid: item.ssid, mac: item.mac } : null);
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
  return <main className="text-white">
    <section className="mx-auto max-w-3xl space-y-5 rounded-2xl border border-cyan-500/30 bg-slate-900/80 p-5 md:p-7">
      <div>
        <h2 className="text-2xl font-bold">Set Up Mouse</h2>
        <p className="mt-1 text-sm text-slate-300">One simple setup card. Connect becomes available only when physical mouse pairing is supported.</p>
      </div>
      <div>
        <label className="mb-2 block font-medium">1. Mouse</label>
        {selected ? <div className="rounded-lg border border-cyan-700 bg-slate-950 p-3">
          <strong>{selected.ssid}</strong><span className="ml-3 font-mono text-xs text-cyan-300">{selected.mac}</span>
        </div> : <div className="rounded-lg border border-amber-700/50 bg-slate-950 p-3 text-sm text-amber-200">No mouse selected. Open <strong>Smart Check</strong> and press <strong>NEXT</strong> on the correct mouse, then return here.</div>}
        <p className="mt-1 text-xs text-slate-400">Check the MAC address before assigning. A Wi-Fi sighting does not mean MQTT is connected.</p>
      </div>
      <label className="block font-medium">2. Restaurant
        <select className="mt-2 block w-full rounded-lg border border-slate-600 bg-slate-950 p-3" value={branchId} onChange={e=>setBranchId(e.target.value)}>
          <option value="">Choose restaurant</option>
          {branches.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </label>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="easy-mouse-wifi" className="font-medium">3. Restaurant 2.4 GHz Wi-Fi</label>
          <button type="button" onClick={fetchNearbyNetworks} disabled={scanBusy} className="rounded-lg bg-cyan-700 px-3 py-2 text-sm disabled:opacity-50">{scanBusy ? "Checking..." : "Refresh Wi-Fi"}</button>
        </div>
        {scanError && <p role="alert" className="text-sm text-rose-300">{scanError}</p>}
        {scan && !scan.fresh && <p className="text-sm text-amber-200">No recent HP2 network scan. Scan data must be fresh.</p>}
        <select id="easy-mouse-wifi" value={localWifiName} onChange={e=>{setLocalWifiName(e.target.value);setWifiPassword("");setShowWifiPassword(false);setWifiChoiceSaved(false);}} className="w-full rounded-lg border border-slate-600 bg-slate-950 p-3">
          <option value="">Select nearby Wi-Fi</option>
          {nearby24.map(n=><option key={n.ssid+":"+n.frequency} value={n.ssid}>{n.ssid} · {n.signal}%</option>)}
        </select>
        <p className="text-xs text-slate-400">Networks are reported by HP2 near its location, not your browser. Installations abroad need an on-site installer.</p>
      </div>
      <div>
        <label htmlFor="easy-mouse-password" className="mb-2 block font-medium">4. Wi-Fi password</label>
        <div className="flex gap-2">
          <input id="easy-mouse-password" type={showWifiPassword ? "text" : "password"} value={wifiPassword} onChange={e=>setWifiPassword(e.target.value)} autoComplete="new-password" disabled={!localWifiName} placeholder="Enter Wi-Fi password" className="min-w-0 flex-1 rounded-lg border border-slate-600 bg-slate-950 p-3 disabled:opacity-40" />
          <button type="button" disabled={!wifiPassword} onClick={()=>setShowWifiPassword(v=>!v)} className="rounded-lg bg-slate-700 px-4 disabled:opacity-40">{showWifiPassword ? "Hide" : "Show"}</button>
        </div>
        <p className="mt-1 text-xs text-amber-200">Password is only in this browser form. It is not saved or sent to the mouse. Please do not enter a real password until pairing is ready.</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <button type="button" disabled={!localWifiName} onClick={()=>{
          sessionStorage.setItem("pest-owned-wifi-name-v1",localWifiName);
          setWifiChoiceSaved(true);
          toast({ title:"Wi-Fi name saved in this tab",description:"Password not saved; mouse not connected." });
        }} className="rounded-lg bg-cyan-700 px-5 py-3 font-semibold disabled:opacity-40">Save Wi-Fi name</button>
        <button type="button" disabled className="rounded-lg bg-slate-700 px-5 py-3 font-semibold opacity-50">Connect Mouse · Not ready</button>
      </div>
      {wifiChoiceSaved && <p role="status" className="text-sm text-cyan-200">Wi-Fi name saved locally. The mouse is not connected.</p>}
      {alreadyRegistered && <p className="text-sm text-amber-200">This mouse name is already registered. It will not be duplicated.</p>}
      <p className="rounded-lg bg-slate-950 p-3 text-sm text-slate-300">Physical connection requires compatible mouse firmware and a tested local pairing method. No fake connected status or alarm will be shown.</p>
    </section>
  </main>;
}
