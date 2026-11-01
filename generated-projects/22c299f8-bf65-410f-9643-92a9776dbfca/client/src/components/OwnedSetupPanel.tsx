import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, RadioTower } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Branch={id:string;name:string};
type Reading={code:string;value:unknown};
type Device={
 id:string;deviceId?:string;deviceName?:string;branchId?:string;branchName?:string;
 notes?:string;hardwareModel?:string;isOnline?:boolean;lastCheckedAt?:string|null;
 lastStatus?:Reading[];alarmActive?:boolean;trapCondition?:string|null;
};
const area=(d:Device)=>{
 const text=String(d.notes||"");return text.match(/Installation area:\s*(.*?)\.\s*SmartLife AP:/i)?.[1]||text||"Not specified";
};
const getNumber=(d:Device,code:string,min:number,max:number)=>{
 if(!d.lastCheckedAt)return null;
 const raw=d.lastStatus?.find(s=>s.code===code)?.value;
 if(raw===null||raw===undefined||raw==="")return null;
 const n=Number(raw);return Number.isFinite(n)&&n>=min&&n<=max?n:null;
};
const isLive=(d:Device)=>{
 const delta=d.lastCheckedAt?Date.now()-new Date(d.lastCheckedAt).getTime():NaN;
 return Boolean(d.isOnline&&Number.isFinite(delta)&&delta>=0&&delta<180000);
};
const input="rounded-xl border border-slate-600 bg-slate-950 px-4 py-3 text-white focus:border-cyan-400";
export default function OwnedSetupPanel(){
 const {toast}=useToast();
 const [branches,setBranches]=useState<Branch[]>([]);
 const [devices,setDevices]=useState<Device[]>([]);
 const [branchFilter,setBranchFilter]=useState("");
 const [search,setSearch]=useState("");
 const [assignTo,setAssignTo]=useState<Record<string,string>>({});
 const [saving,setSaving]=useState("");
 const [loading,setLoading]=useState(false);
 const [initialLoadFinished,setInitialLoadFinished]=useState(false);
 const [error,setError]=useState("");
 const refresh=useCallback(async()=>{
  setLoading(true);
  try{
   const [b,d]=await Promise.all([
    fetch("/api/branches?page=1&limit=5000",{credentials:"include",cache:"no-store"}),
    fetch("/api/iot/devices",{credentials:"include",cache:"no-store"}),
   ]);
   if(!b.ok||!d.ok)throw Error("Could not load registered mouse reports.");
   const br=await b.json();const dv=await d.json();
   const received=Array.isArray(dv)?dv:[];
   setBranches(Array.isArray(br.branches)?br.branches:[]);
   setDevices(received);
   setAssignTo(prev=>Object.fromEntries(received.map((item:Device)=>[item.id,prev[item.id]??item.branchId??""])));
   setError("");
  }catch(e:any){setError(String(e?.message||e))}
  finally{setLoading(false);setInitialLoadFinished(true);}
 },[]);
 useEffect(()=>{void refresh();const timer=window.setInterval(()=>void refresh(),15000);return()=>window.clearInterval(timer);},[refresh]);
 const live=useMemo(()=>devices.filter(isLive),[devices]);
 const visible=live.filter(d=>(!branchFilter||d.branchId===branchFilter)&&[d.deviceId,d.deviceName,d.branchName].some(v=>String(v||"").toLowerCase().includes(search.toLowerCase())));
 const assign=async(d:Device)=>{
  const target=assignTo[d.id];
  if(!target||target===d.branchId)return;
  setSaving(d.id);
  try{
   const r=await fetch("/api/iot/devices/"+encodeURIComponent(d.id),{
    method:"PATCH",credentials:"include",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({branchId:target,deviceName:d.deviceName||d.deviceId,notes:d.notes||"",hardwareModel:d.hardwareModel||"BK7231N-MOUSE-V1"})
   });
   if(!r.ok)throw Error((await r.json().catch(()=>({})).message||"Could not assign restaurant."));
   toast({title:"Restaurant assignment saved",description:"Customer assignment updated. The physical Wi-Fi/MQTT connection was not altered."});
   await refresh();
  }catch(e:any){setError(String(e?.message||e));}finally{setSaving("");}
 };
 return <main className="mx-auto max-w-5xl space-y-5 text-white">
  <header className="rounded-2xl border border-cyan-500/30 bg-slate-900/80 p-5">
   <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-2xl font-bold">Smart Devices</h2><p className="mt-1 text-sm text-slate-300">Genuine live MQTT devices · branch monitoring and assignment</p></div><button type="button" disabled={loading} onClick={()=>void refresh()} className="flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-3 font-semibold disabled:opacity-60"><RefreshCw size={17} className={loading?"animate-spin":""}/>{loading?"Refreshing...":"Refresh"}</button></div>
  </header>
  {error&&<p role="alert" className="rounded-lg border border-red-500/40 bg-red-950 p-4 text-red-200">{error}</p>}
  <section className="rounded-2xl border border-slate-700 bg-slate-900/75 p-5">
   <h3 className="mb-3 font-semibold">Find connected mouse / restaurant</h3>
   <div className="grid gap-3 sm:grid-cols-2">
    <select aria-label="Filter restaurant" className={input} value={branchFilter} onChange={e=>setBranchFilter(e.target.value)}><option value="">All restaurants</option>{branches.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select>
    <input aria-label="Search connected mice" className={input} value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search mouse name or device ID"/>
   </div>
  </section>
  {!initialLoadFinished&&<div role="status" className="rounded-2xl bg-slate-900 p-6 text-cyan-200">Loading saved device reports…</div>}
  {initialLoadFinished&&!error&&visible.length===0&&<div role="status" className="rounded-2xl border border-cyan-500/25 bg-slate-900/75 p-6">
   <div className="flex items-center gap-2 font-semibold"><RadioTower size={18}/>No verified live MQTT mouse devices</div>
   <p className="mt-2 text-sm text-slate-300">{live.length?"No live mice match the chosen search or restaurant.":"No physical mouse has reported a recent authenticated MQTT connection. Verified monitoring cards will appear here after a genuine device report."}</p>
   <p className="mt-2 text-xs text-slate-400">Saved registrations remain in Smart Check. Pairing Wi-Fi scans are not live MQTT connections.</p>
  </div>}
  <div className="grid gap-4 lg:grid-cols-2">{visible.map(d=>{
   const battery=getNumber(d,"battery_percentage",0,100);
   const rssi=getNumber(d,"rssi",-120,0);
   const report=d.lastCheckedAt?new Date(d.lastCheckedAt).toLocaleString("en-GB"):"Not reported";
   const branch=d.branchName||branches.find(x=>x.id===d.branchId)?.name||"Not assigned";
   return <article key={d.id} className="space-y-4 rounded-2xl border border-emerald-500/40 bg-slate-950 p-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
     <div><h3 className="text-lg font-bold">{d.deviceName||d.deviceId}</h3><p className="font-mono text-xs text-cyan-200">{d.deviceId}</p><p className="mt-1 text-sm">{branch} · {area(d)}</p></div>
     <span className="rounded-full bg-emerald-900 px-3 py-1 text-xs font-semibold text-emerald-200">Recent MQTT report</span>
    </div>
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{([
     ["Battery",battery===null?"Not reported":battery+"% (last report)"],
     ["Device Wi-Fi","MQTT reachable · Wi-Fi path not verified"],
     ["MQTT","Recent authenticated report"],
     ["MQTT RSSI",rssi===null?"Not reported":rssi+" dBm (last report)"],
     ["Last report",report],
     ["Trap",d.alarmActive?"Mouse caught (verified)":d.trapCondition||"No active verified alarm"],
    ] as [string,string][]).map(([name,value])=><div key={name} className="rounded-xl bg-slate-900 p-3"><p className="text-xs text-slate-400">{name}</p><strong className="mt-1 block text-sm">{value}</strong></div>)}</div>
    <div className="border-t border-slate-700 pt-4">
     <label className="mb-2 block text-sm font-semibold">Assign to Branch</label>
     <div className="flex flex-wrap gap-2"><select aria-label={"Restaurant for "+(d.deviceName||d.deviceId)} className={input+" min-w-0 flex-1"} value={assignTo[d.id]??d.branchId??""} onChange={e=>setAssignTo(p=>({...p,[d.id]:e.target.value}))}><option value="">Choose restaurant</option>{branches.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select>
      <button type="button" disabled={saving===d.id||!assignTo[d.id]||assignTo[d.id]===d.branchId} onClick={()=>void assign(d)} className="rounded-xl bg-cyan-600 px-5 py-3 font-semibold disabled:opacity-40">{saving===d.id?"Saving...":"Assign"}</button>
     </div>
    </div>
   </article>;
  })}</div>
 </main>;
}
