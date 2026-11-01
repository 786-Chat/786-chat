import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

type Branch = {id:string;name:string};
type Device = {id:string;deviceId?:string;deviceName?:string;branchId?:string;branchName?:string;notes?:string;isOnline?:boolean;lastCheckedAt?:string|null;lastStatus?:Array<{code:string;value:any}>;alarmActive?:boolean};
const area=(d:Device)=>{const raw=String(d.notes||"");const m=raw.match(/Installation area:\s*(.*?)\.\s*SmartLife AP:/i);return m?m[1]:raw};
export default function OwnedSetupPanel(){
 const [branches,setBranches]=useState<Branch[]>([]);
 const [devices,setDevices]=useState<Device[]>([]);
 const [loading,setLoading]=useState(false);
 const [initialLoadFinished,setInitialLoadFinished]=useState(false);
 const [error,setError]=useState("");
 const refresh=useCallback(async()=>{
  setLoading(true);
  try{
   const [b,d]=await Promise.all([
    fetch("/api/branches?page=1&limit=5000",{credentials:"include",cache:"no-store"}),
    fetch("/api/iot/devices",{credentials:"include",cache:"no-store"})
   ]);
   if(!b.ok||!d.ok)throw Error("Unable to load registered devices or restaurants");
   const br=await b.json();const dv=await d.json();
   setBranches(Array.isArray(br.branches)?br.branches:[]);
   const records=Array.isArray(dv)?dv:[];
   setDevices(records);
   setError("");
  }catch(e:any){setError(String(e?.message||e))}
  finally{
   setLoading(false);
   // Do not show the old "no registered devices" placeholder while the
   // actual device list is still loading. Keep existing cards on refresh.
   setInitialLoadFinished(true);
  }
 },[]);
 useEffect(()=>{refresh();const timer=window.setInterval(refresh,15000);return()=>window.clearInterval(timer)},[refresh]);
 // Saved registration and a pairing Wi-Fi broadcast are NOT an MQTT connection.
 // Only live, authenticated device reports qualify for Smart Devices cards.
 // Leave all saved devices, restaurant assignments and alerts intact.
 const isVerifiedMqttLive=(d:Device)=>{
  if(!d.isOnline||!d.lastCheckedAt)return false;
  const age=Date.now()-new Date(d.lastCheckedAt).getTime();
  return Number.isFinite(age)&&age>=0&&age<180000;
 };
 const visible=devices.filter(isVerifiedMqttLive);
 if(!initialLoadFinished){
  return <main className="mx-auto max-w-5xl space-y-5 text-white">
   <header className="rounded-2xl border border-cyan-500/30 bg-slate-900/75 p-5">
    <h2 className="text-2xl font-bold">Smart Devices</h2>
    <p role="status" aria-live="polite" className="mt-2 flex items-center gap-2 text-sm text-cyan-200"><RefreshCw size={16} className="animate-spin"/>Loading registered devices…</p>
   </header>
  </main>;
 }
 return <main className="mx-auto max-w-5xl space-y-5 text-white">
  <header className="rounded-2xl border border-cyan-500/30 bg-slate-900/75 p-5">
   <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-2xl font-bold">Smart Devices</h2><p className="mt-1 text-sm text-slate-300">Live MQTT-verified mice only · registered mice stay saved in Smart Check</p></div><button type="button" disabled={loading} onClick={refresh} className="flex items-center gap-2 rounded-xl border-b-4 border-cyan-950 bg-cyan-600 px-5 py-3 font-semibold shadow-[0_6px_0_rgba(8,47,73,.7)] transition-all hover:-translate-y-0.5 active:translate-y-1 active:shadow-none disabled:opacity-60"><RefreshCw size={18} className={loading?"animate-spin":""}/>{loading?"Refreshing...":"Refresh"}</button></div>
  </header>
  {error&&<p role="alert" className="rounded-lg bg-red-950 p-3 text-red-200">{error}</p>}
  {!error&&visible.length===0&&<div role="status" className="rounded-2xl border border-cyan-500/25 bg-slate-900/75 p-6 text-slate-200"><h3 className="font-semibold text-white">No verified live MQTT mouse devices</h3><p className="mt-2 text-sm text-slate-300">No physical mouse has reported a recent authenticated MQTT connection. Live monitoring cards will appear here when a genuine connection is verified.</p></div>}
  <div className="grid gap-5 lg:grid-cols-2">{visible.map(d=>{
   const status=d.lastStatus||[];
   const battery=status.find(x=>x.code==="battery_percentage")?.value;
   const signal=status.find(x=>x.code==="rssi")?.value;
   const last=d.lastCheckedAt;
   const connected=Boolean(d.isOnline&&last&&Date.now()-new Date(last).getTime()<180000);
   const hadReport=Boolean(last);
   const trap=connected&&d.alarmActive?"Mouse Caught":connected?"":"";
   return <article key={d.id} className="space-y-4 rounded-2xl border border-cyan-500/25 bg-slate-950 p-5">
    <div className="flex items-start justify-between gap-3"><div><h3 className="text-lg font-bold">{d.deviceName||d.deviceId}</h3><p className="text-xs text-cyan-200">{d.deviceId}</p><p className="mt-1 text-sm">{d.branchName||branches.find(b=>b.id===d.branchId)?.name||"Unassigned"}</p><p className="text-xs text-slate-400">📍 {area(d)||"Installation area not set"}</p></div><span className={"rounded-full px-3 py-1 text-xs font-semibold "+(connected?"bg-emerald-900 text-emerald-200":"bg-slate-800 text-slate-300")}>{connected?"Connected":hadReport?"Sleeping / no recent MQTT":"Not connected"}</span></div>
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{[
      ["SYSTEM","Food Safety IoT"],
      ["BATTERY",battery==null?"Not reported":String(battery)+"% (last report)"],
      ["STATUS",connected?"Online":hadReport?"No recent MQTT":"Not confirmed"],
      ["TRAP",trap||"—"]
     ].map(([label,value])=><div key={label} className="rounded-xl bg-slate-800 p-3"><p className="text-xs text-slate-400">{label}</p><strong className="mt-1 block text-sm">{value}</strong></div>)}</div>
    {signal!=null&&<p className="text-sm text-slate-300">📶 MQTT-reported RSSI: {signal}</p>}
    {last&&<p className="text-xs text-slate-400">Last device report: {new Date(last).toLocaleString("en-GB")}</p>}
   </article>
  })}</div>
 </main>;
}
