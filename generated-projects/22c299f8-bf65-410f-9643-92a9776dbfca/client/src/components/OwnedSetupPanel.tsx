import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Branch = {id:string;name:string};
type Device = {id:string;deviceId?:string;deviceName?:string;branchId?:string;branchName?:string;notes?:string;isOnline?:boolean;lastCheckedAt?:string|null;lastStatus?:Array<{code:string;value:any}>;alarmActive?:boolean};
const area=(d:Device)=>{const raw=String(d.notes||"");const m=raw.match(/Installation area:\s*(.*?)\.\s*SmartLife AP:/i);return m?m[1]:raw};
export default function OwnedSetupPanel(){
 const {toast}=useToast();
 const [branches,setBranches]=useState<Branch[]>([]);
 const [devices,setDevices]=useState<Device[]>([]);
 const [assignment,setAssignment]=useState<Record<string,string>>({});
 const [saving,setSaving]=useState("");
 const [loading,setLoading]=useState(false);
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
   setAssignment(prev=>Object.fromEntries(records.map((x:Device)=>[x.id,prev[x.id]??x.branchId??""])));
   setError("");
  }catch(e:any){setError(String(e?.message||e))}
  finally{setLoading(false)}
 },[]);
 useEffect(()=>{refresh();const timer=window.setInterval(refresh,15000);return()=>window.clearInterval(timer)},[refresh]);
 const assign=async(d:Device)=>{
  const target=assignment[d.id];if(!target)return;
  setSaving(d.id);
  try{
   const response=await fetch("/api/iot/devices/"+encodeURIComponent(d.id),{
    method:"PATCH",credentials:"include",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({deviceName:d.deviceName||d.deviceId,branchId:target,notes:d.notes||"",hardwareModel:"BK7231N-MOUSE-V1"})
   });
   if(!response.ok)throw Error((await response.json().catch(()=>({})).message||"Could not assign restaurant");
   toast({title:"Restaurant assignment saved",description:"The device is assigned in records. Physical MQTT connectivity must still be verified."});
   await refresh();
  }catch(e:any){setError(String(e?.message||e))}
  finally{setSaving("")}
 };
 return <main className="mx-auto max-w-5xl space-y-5 text-white">
  <header className="rounded-2xl border border-cyan-500/30 bg-slate-900/75 p-5">
   <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-2xl font-bold">Smart Devices</h2><p className="mt-1 text-sm text-slate-300">Registered Food Safety mouse traps · real device records only</p></div><button type="button" disabled={loading} onClick={refresh} className="flex items-center gap-2 rounded-xl border-b-4 border-cyan-950 bg-cyan-600 px-5 py-3 font-semibold shadow-[0_6px_0_rgba(8,47,73,.7)] transition-all hover:-translate-y-0.5 active:translate-y-1 active:shadow-none disabled:opacity-60"><RefreshCw size={18} className={loading?"animate-spin":""}/>{loading?"Refreshing...":"Refresh"}</button></div>
  </header>
  {error&&<p role="alert" className="rounded-lg bg-red-950 p-3 text-red-200">{error}</p>}
  {devices.length===0&&<p className="rounded-xl bg-slate-900 p-5">No registered Food Safety mouse devices. Register a mouse in Smart Check first.</p>}
  <div className="grid gap-5 lg:grid-cols-2">{devices.map(d=>{
   const status=d.lastStatus||[];
   const battery=status.find(x=>x.code==="battery_percentage")?.value;
   const signal=status.find(x=>x.code==="rssi")?.value;
   const last=d.lastCheckedAt;
   const connected=Boolean(d.isOnline&&last&&Date.now()-new Date(last).getTime()<180000);
   const trap=connected&&d.alarmActive?"Mouse Caught":connected?"":"";
   return <article key={d.id} className="space-y-4 rounded-2xl border border-cyan-500/25 bg-slate-950 p-5">
    <div className="flex items-start justify-between gap-3"><div><h3 className="text-lg font-bold">{d.deviceName||d.deviceId}</h3><p className="text-xs text-cyan-200">{d.deviceId}</p><p className="mt-1 text-sm">{d.branchName||branches.find(b=>b.id===d.branchId)?.name||"Unassigned"}</p><p className="text-xs text-slate-400">📍 {area(d)||"Installation area not set"}</p></div><span className={"rounded-full px-3 py-1 text-xs font-semibold "+(connected?"bg-emerald-900 text-emerald-200":"bg-slate-800 text-slate-300")}>{connected?"Connected":"Not connected"}</span></div>
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{[
      ["SYSTEM","Food Safety IoT"],
      ["BATTERY",battery==null?"—":String(battery)+"%"],
      ["STATUS",connected?"Online":"Not confirmed"],
      ["TRAP",trap||"—"]
     ].map(([label,value])=><div key={label} className="rounded-xl bg-slate-800 p-3"><p className="text-xs text-slate-400">{label}</p><strong className="mt-1 block text-sm">{value}</strong></div>)}</div>
    {signal!=null&&<p className="text-sm text-slate-300">📶 Wi-Fi RSSI: {signal}</p>}
    {last&&<p className="text-xs text-slate-400">Last device report: {new Date(last).toLocaleString("en-GB")}</p>}
    <div className="space-y-2 border-t border-slate-700 pt-4"><label className="block text-sm font-semibold">Assign to Branch</label><div className="flex flex-wrap gap-2"><select className="min-w-0 flex-1 rounded-lg border border-slate-600 bg-slate-900 p-3" value={assignment[d.id]??d.branchId??""} onChange={e=>setAssignment(v=>({...v,[d.id]:e.target.value}))}><option value="">Choose restaurant</option>{branches.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select><button type="button" disabled={saving===d.id||!assignment[d.id]||assignment[d.id]===d.branchId} onClick={()=>assign(d)} className="rounded-lg bg-cyan-600 px-4 py-3 font-semibold disabled:opacity-40">{saving===d.id?"Saving...":"Assign"}</button></div><p className="text-xs text-slate-400">Assignment updates customer records; it does not mean physical Wi-Fi or MQTT is connected.</p></div>
   </article>
  })}</div>
 </main>;
}
