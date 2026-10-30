import { useCallback, useEffect, useMemo, useState } from "react";
import { Radar, RefreshCw, Wifi } from "lucide-react";

type Observation = {
 id: string; hardwareKey: string; hostname?: string | null; macAddress?: string | null;
 wifiSignalPercent?: number | null; lastSeenAt?: string | null;
 isWifiRecentlySeen?: boolean; wifiObservationSource?: string | null;
};
const macPattern = /^([\da-f]{2}:){5}[\da-f]{2}$/i;
export default function FreshSmartCheck() {
 const [rows,setRows]=useState<Observation[]>([]);
 const [search,setSearch]=useState("");
 const [error,setError]=useState("");
 const [loading,setLoading]=useState(false);
 const refresh=useCallback(async()=>{
   setLoading(true);
   try {
     const response=await fetch("/api/iot/device-check",{credentials:"include",cache:"no-store"});
     if(!response.ok) throw new Error("HP2 observation API HTTP "+response.status);
     const data=await response.json();
     if(!Array.isArray(data)) throw new Error("Unexpected observation response");
     setRows(data);setError("");
   }catch(e:any){setError(e?.message||"Could not load HP2 observations");}
   finally{setLoading(false);}
 },[]);
 useEffect(()=>{refresh();const timer=window.setInterval(refresh,15000);return()=>window.clearInterval(timer);},[refresh]);
 const sightings=useMemo(()=>rows.filter(r=>r.hardwareKey?.startsWith("wifi-ap:") && r.hostname?.toLowerCase().startsWith("smartlife-") && macPattern.test(r.macAddress||"")).filter(r=>(r.hostname+" "+r.macAddress).toLowerCase().includes(search.toLowerCase())),[rows,search]);
 const next=(row:Observation)=>{
   sessionStorage.setItem("pest-smart-check-selected-v1",JSON.stringify({ssid:row.hostname,mac:row.macAddress,observedAt:row.lastSeenAt}));
   window.dispatchEvent(new Event("pest:open-owned-smart-devices"));
 };
 return <main className="space-y-5 text-white">
  <header className="rounded-2xl border border-cyan-500/30 bg-slate-900/80 p-5">
   <div className="flex flex-wrap items-center justify-between gap-3">
    <div><h2 className="flex items-center gap-2 text-2xl font-bold"><Radar className="text-cyan-300"/>Smart Check</h2>
    <p className="mt-2 text-sm text-slate-300">HP2 nearby Wi-Fi discovery only. A detected pairing signal is not a verified MQTT connection.</p></div>
    <button type="button" onClick={refresh} disabled={loading} className="flex items-center gap-2 rounded-lg bg-cyan-700 px-4 py-2 text-sm disabled:opacity-50"><RefreshCw size={16}/>{loading?"Checking":"Refresh HP2"}</button>
   </div>
  </header>
  <section className="rounded-2xl border border-slate-700 bg-slate-900/75 p-5">
   <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
    <h3 className="font-semibold">Detected SmartLife Wi-Fi ({sightings.length})</h3>
    <input aria-label="Search Wi-Fi mouse" placeholder="Search SmartLife name or MAC" value={search} onChange={e=>setSearch(e.target.value)} className="w-full max-w-xs rounded-lg border border-slate-600 bg-slate-950 p-2 text-sm"/>
   </div>
   {error&&<p role="alert" className="mb-3 rounded bg-red-950 p-3 text-red-200">{error}</p>}
   {!sightings.length&&<p className="rounded-lg bg-slate-800 p-4 text-slate-300">No matching HP2 Wi-Fi observations. Switch on a nearby mouse and refresh. Historical sightings are kept by the server.</p>}
   <div className="grid gap-3 md:grid-cols-2">{sightings.map(row=><article key={row.id} className="rounded-xl border border-slate-700 bg-slate-950/60 p-4">
    <h4 className="flex items-center gap-2 font-semibold"><Wifi size={16} className="text-cyan-300"/>{row.hostname}</h4>
    <p className="mt-2 font-mono text-xs text-cyan-200">MAC: {row.macAddress}</p>
    <p className="mt-2 text-sm text-slate-300">Signal: {row.wifiSignalPercent == null?"Not measured":row.wifiSignalPercent+"% (last scan)"}</p>
    <p className="mt-1 text-sm text-slate-300">{row.isWifiRecentlySeen?"Recently observed":"No recent Wi-Fi signal"}</p>
    <p className="mt-1 text-xs text-slate-400">Last observation: {row.lastSeenAt?new Date(row.lastSeenAt).toLocaleString("en-GB"):"Unknown"}</p>
    <p className="mt-2 text-xs text-amber-200">MQTT not established by Wi-Fi detection</p>
    <button type="button" onClick={()=>next(row)} className="mt-3 rounded-lg bg-cyan-600 px-5 py-2 font-semibold hover:bg-cyan-500">Next →</button>
   </article>)}</div>
  </section>
 </main>;
}
