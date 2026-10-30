import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

type Selection = { ssid: string; mac: string };
export default function OwnedSetupPanel() {
  const { toast } = useToast();
  const [selected, setSelected] = useState<Selection | null>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [branchId, setBranchId] = useState("");
  const [ssid, setSsid] = useState("");
  const [wifiPassword, setWifiPassword] = useState("");
  const [busy, setBusy] = useState(false);
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
    try {
      const raw = sessionStorage.getItem("pest-smart-check-selected-v1");
      const item = raw ? JSON.parse(raw) : null;
      if (typeof item?.ssid === "string" && typeof item?.mac === "string") setSelected({ ssid: item.ssid, mac: item.mac });
    } catch (_) {}
  }, []);
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
      <p className="mt-2 text-sm text-slate-300">Select a mouse in Smart Check first. Existing records are kept, but old device cards are not reused.</p>
    </header>
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
      <button disabled={!selected || !branchId || !!alreadyRegistered || busy} onClick={save} className="rounded-lg bg-cyan-600 px-5 py-3 font-semibold disabled:opacity-40">{busy ? "Saving..." : "Save device and assign branch"}</button>
    </section>
    <section className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5 space-y-3">
      <h3 className="font-semibold">3 · Restaurant Wi-Fi and physical MQTT verification</h3>
      <label className="block text-sm">2.4 GHz network (manual entry)<input value={ssid} onChange={e=>setSsid(e.target.value)} className="mt-2 block w-full rounded-lg bg-slate-950 p-3" placeholder="Restaurant Wi-Fi name" /></label>
      <label className="block text-sm">Wi-Fi password (not saved or transmitted)<input type="password" value={wifiPassword} onChange={e=>setWifiPassword(e.target.value)} className="mt-2 block w-full rounded-lg bg-slate-950 p-3" /></label>
      <p className="text-sm text-amber-200">Connect is unavailable until compatible mouse firmware and a secure provisioning protocol are physically verified. Entering credentials here does not connect the mouse.</p>
      <button disabled className="rounded-lg bg-slate-700 px-5 py-3 opacity-60">Verify MQTT — awaiting real device connection</button>
    </section>
    <section className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5">
      <h3 className="font-semibold">Registered devices · {devices.length}</h3>
      <p className="mb-3 text-xs text-slate-400">Existing customer records are retained. This is a simple list, not the old cards.</p>
      <div className="space-y-2">{devices.map(d=><div key={d.id || d.deviceId} className="flex flex-wrap justify-between gap-2 rounded-lg border border-slate-700 bg-slate-950/50 p-3 text-sm"><span>{d.deviceName || d.deviceId}</span><span className="font-mono text-xs text-slate-400">{d.deviceId}</span><span className={d.isOnline ? "text-emerald-300" : "text-amber-300"}>{d.isOnline ? "MQTT reported" : "No verified live MQTT"}</span></div>)}</div>
    </section>
  </main>;
}
