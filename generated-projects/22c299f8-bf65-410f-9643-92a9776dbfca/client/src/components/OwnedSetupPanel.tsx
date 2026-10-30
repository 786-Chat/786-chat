import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

type Selection = { ssid: string; mac: string };
export default function OwnedSetupPanel() {
  const { toast } = useToast();
  const [selected, setSelected] = useState<Selection | null>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [branchId, setBranchId] = useState("");
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
      <p className="rounded-lg bg-slate-950/80 p-4 text-sm text-amber-200">HP2 detects factory pairing Wi-Fi but cannot send restaurant SSID/password to the mouse. Wi-Fi credential collection is disabled until a secure, tested provisioning protocol is implemented. Do not enter passwords here.</p>
      <p className="text-sm text-slate-300">Next hardware check: verify mouse firmware compatibility, provisioning transport, and authenticated MQTT telemetry before enabling Connect.</p>
      <button disabled className="rounded-lg bg-slate-700 px-5 py-3 opacity-60">Verify MQTT — awaiting real device connection</button>
    </section>
  </main>;
}
