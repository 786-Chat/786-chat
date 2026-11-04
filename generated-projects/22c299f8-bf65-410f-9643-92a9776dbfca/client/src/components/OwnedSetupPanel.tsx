import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, RefreshCw, RadioTower, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Branch={id:string;name:string};
type Handoff={version:1;createdAt:number;ssid:string;mac:string;branchId:string;deviceName:string;location:string;wifiSsid:string;savedDeviceId:string|null};

type Reading={code:string;value:unknown};
type Device={
 id:string;deviceId?:string;deviceName?:string;branchId?:string;branchName?:string;
 notes?:string;hardwareModel?:string;isOnline?:boolean;lastCheckedAt?:string|null;
 lastStatus?:Reading[];alarmActive?:boolean;trapCondition?:string|null;
};
const cleanMac=(v:unknown)=>String(v||"").toUpperCase().trim();
const notesMac=(d:Device)=>cleanMac(String(d.notes||"").match(/Mouse MAC:\s*((?:[0-9A-F]{2}:){5}[0-9A-F]{2})/i)?.[1]);
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
 const [handoff,setHandoff]=useState<Handoff|null>(null);
 const [draftBranch,setDraftBranch]=useState("");
 const [draftName,setDraftName]=useState("");
 const [draftArea,setDraftArea]=useState("");
 const [draftNotes,setDraftNotes]=useState("");
 const [registering,setRegistering]=useState(false);
 const [handoffError,setHandoffError]=useState("");
 const [deleteTarget,setDeleteTarget]=useState<Device|null>(null);
 const [deleteAcknowledged,setDeleteAcknowledged]=useState(false);
 const [deleteError,setDeleteError]=useState("");
 const [deleting,setDeleting]=useState(false);
 useEffect(()=>{
  try{
   const raw=window.sessionStorage.getItem("pest-smart-check-selected-v1");
   if(!raw)return;
   const value=JSON.parse(raw);
   const age=Date.now()-Number(value.createdAt);
   if(value.version!==1||!/^([0-9A-F]{2}:){5}[0-9A-F]{2}$/.test(cleanMac(value.mac))||!/^(SmartLife-|OpenBK)/i.test(String(value.ssid||""))||!Number.isFinite(age)||age<0||age>30*60*1000){
    window.sessionStorage.removeItem("pest-smart-check-selected-v1");return;
   }
   const selected:Handoff={
    version:1,createdAt:value.createdAt,ssid:String(value.ssid).slice(0,80),
    mac:cleanMac(value.mac),branchId:String(value.branchId||""),
    deviceName:String(value.deviceName||"").slice(0,120),
    location:String(value.location||"").slice(0,120),
    wifiSsid:String(value.wifiSsid||"").slice(0,64),
    savedDeviceId:typeof value.savedDeviceId==="string"?value.savedDeviceId:null
   };
   setHandoff(selected);setDraftBranch(selected.branchId);
   setDraftName(selected.deviceName);setDraftArea(selected.location);
   setBranchFilter(selected.branchId);
  }catch{
   try{window.sessionStorage.removeItem("pest-smart-check-selected-v1");}catch{}
  }
 },[]);
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
 // Initial load only; do not poll while the installer is choosing a branch or editing fields.
 useEffect(()=>{void refresh();},[refresh]);
 const live=useMemo(()=>devices.filter(isLive),[devices]);
 const alreadyRegistered=handoff?devices.find(d=>notesMac(d)===handoff.mac):undefined;
 const clearSelection=()=>{
  try{window.sessionStorage.removeItem("pest-smart-check-selected-v1");}catch{}
  setHandoff(null);setHandoffError("");setDraftNotes("");
 };
 const registerSelected=async()=>{
  if(!handoff||registering)return;
  if(!branches.some(b=>b.id===draftBranch)||!draftName.trim()||!draftArea.trim()){
   setHandoffError("Choose a registered restaurant and enter the mouse name and installation area.");return;
  }
  setRegistering(true);setHandoffError("");
  try{
   const response=await fetch("/api/iot/devices",{credentials:"include",cache:"no-store"});
   if(!response.ok)throw Error("Cannot check saved registrations. Please retry.");
   const current=await response.json();
   if(!Array.isArray(current))throw Error("Cannot check saved registrations.");
   const duplicate=(current as Device[]).find(d=>notesMac(d)===handoff.mac);
   if(duplicate){setDevices(current);setBranchFilter(duplicate.branchId||"");throw Error("Already saved as "+(duplicate.deviceName||duplicate.deviceId)+". No duplicate was added.");}
   const notes="Installation area: "+draftArea.trim()+". SmartLife AP: "+handoff.ssid+". Mouse MAC: "+handoff.mac+". "+draftNotes.trim();
   const created=await fetch("/api/iot/devices",{method:"POST",credentials:"include",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({deviceName:draftName.trim(),branchId:draftBranch,hardwareModel:"BK7231N-MOUSE-V1",notes})
   });
   const result=await created.json().catch(()=>({}));
   if(!created.ok)throw Error(result.message||"Could not register mouse.");
   setBranchFilter(draftBranch);setSearch("");
   setDraftNotes("");
   toast({title:"Mouse card saved",description:"Registered for restaurant. Physical Wi-Fi and MQTT still not verified."});
   await refresh();
  }catch(e:any){setHandoffError(String(e?.message||e));}
  finally{setRegistering(false);}
 };
 const visible=devices.filter(d=>(!branchFilter||d.branchId===branchFilter)&&[d.deviceId,d.deviceName,d.branchName].some(v=>String(v||"").toLowerCase().includes(search.toLowerCase())));
 const assign=async(d:Device)=>{
  const target=assignTo[d.id];
  if(!target||target===d.branchId)return;
  setSaving(d.id);
  try{
   const r=await fetch("/api/iot/devices/"+encodeURIComponent(d.id),{
    method:"PATCH",credentials:"include",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({branchId:target,deviceName:d.deviceName||d.deviceId,notes:d.notes||"",hardwareModel:d.hardwareModel||"BK7231N-MOUSE-V1"})
   });
   if(!r.ok)throw Error((await r.json().catch(()=>({})))?.message||"Could not assign restaurant.");
   toast({title:"Restaurant assignment saved",description:"Customer assignment updated. The physical Wi-Fi/MQTT connection was not altered."});
   await refresh();
  }catch(e:any){setError(String(e?.message||e));}finally{setSaving("");}
 };
 const permanentlyDeleteMouse=async()=>{
  const target=deleteTarget;
  if(!target?.id||!target.deviceId||!deleteAcknowledged||deleting)return;
  setDeleting(true);setDeleteError("");
  try{
   const response=await fetch("/api/iot/devices/"+encodeURIComponent(target.id)+"/permanent",{
    method:"DELETE",credentials:"include",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({confirm:"DELETE",confirmDeviceId:target.deviceId})
   });
   const result=await response.json().catch(()=>({}));
   if(!response.ok||!result.success)throw Error(result.message||"Could not delete this mouse.");
   setDevices(previous=>previous.filter(d=>d.id!==target.id));
   if(handoff&&(handoff.savedDeviceId===target.id||notesMac(target)===handoff.mac))clearSelection();
   setDeleteTarget(null);setDeleteAcknowledged(false);setDeleteError("");
   toast({title:"Mouse permanently deleted",description:target.deviceId+" removed from backend registration and cards. A registration backup was saved."});
   await refresh();
  }catch(e:any){setDeleteError(String(e?.message||e));}
  finally{setDeleting(false);}
 };
 return <main className="mx-auto max-w-5xl space-y-5 text-white">
  <header className="rounded-2xl border border-cyan-500/30 bg-slate-900/80 p-5">
   <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-2xl font-bold">Smart Devices</h2><p className="mt-1 text-sm text-slate-300">Saved mouse registrations · {live.length} currently reporting through MQTT</p></div><button type="button" disabled={loading} onClick={()=>void refresh()} className="flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-3 font-semibold disabled:opacity-60"><RefreshCw size={17} className={loading?"animate-spin":""}/>{loading?"Refreshing...":"Refresh"}</button></div>
  </header>
  {error&&<p role="alert" className="rounded-lg border border-red-500/40 bg-red-950 p-4 text-red-200">{error}</p>}
  {deleteTarget&&<div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 p-4">
   <div role="dialog" aria-modal="true" aria-labelledby="delete-mouse-title" className="w-full max-w-lg space-y-4 rounded-2xl border border-red-500/60 bg-slate-950 p-6 text-white shadow-2xl">
    <h3 id="delete-mouse-title" className="text-xl font-bold text-red-200">Permanently delete this mouse?</h3>
    <p className="font-semibold">{deleteTarget.deviceName||deleteTarget.deviceId} · <span className="font-mono">{deleteTarget.deviceId}</span></p>
    <p className="text-sm text-slate-200">This deletes the selected mouse registration from the backend database and removes its Smart Devices card, including linked MQTT event history. A restorable registration backup is saved first. Customer branches and manual SmartLife Check / SmartLife Devices records are not changed.</p>
    <p className="rounded-lg border border-amber-500/60 bg-amber-950/40 p-3 text-sm font-semibold text-amber-100">Important: This preview and the live website use the same database configuration. Deleting here removes the actual backend mouse record, including the record seen by the live site. This is not a harmless preview test.</p>
    <p className="text-sm text-amber-200">This does not reset or remove the physical mouse from the Smart Life mobile app. Historical MQTT events are not included in the registration backup.</p>
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-600 bg-slate-900 p-4 text-sm text-white">
     <input type="checkbox" className="mt-1 h-5 w-5 shrink-0 accent-red-600" checked={deleteAcknowledged} onChange={e=>setDeleteAcknowledged(e.target.checked)} disabled={deleting} aria-label="Confirm permanent deletion of selected mouse"/>
     <span><strong>Yes, permanently delete {deleteTarget.deviceName||deleteTarget.deviceId} ({deleteTarget.deviceId}).</strong><span className="mt-1 block text-xs text-amber-200">I understand its registration and MQTT event history will be removed from the shared live database.</span></span>
    </label>
    {!deleteAcknowledged&&<p className="text-xs text-amber-200">Tick the box above to enable the red Delete button. Nothing is deleted until you press it.</p>}
    {deleteError&&<p role="alert" className="text-sm text-red-200">{deleteError}</p>}
    <div className="flex flex-wrap justify-end gap-3">
     <button type="button" disabled={deleting} onClick={()=>{setDeleteTarget(null);setDeleteAcknowledged(false);setDeleteError("");}} className="rounded-lg border border-slate-600 px-4 py-2 font-semibold disabled:opacity-50">Cancel</button>
     <button type="button" disabled={deleting||!deleteAcknowledged} onClick={()=>void permanentlyDeleteMouse()} className="inline-flex items-center gap-2 rounded-lg bg-red-700 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"><Trash2 size={16}/>{deleting?"Deleting…":"Permanently Delete"}</button>
    </div>
   </div>
  </div>}
  {handoff&&<section className="space-y-4 rounded-2xl border border-cyan-500/40 bg-slate-900/80 p-5" aria-label="Selected in Smart Check">
   <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="flex items-center gap-2 text-lg font-bold"><ArrowRight size={18}/>NEXT — From Smart Check</h3><button type="button" onClick={clearSelection} className="rounded-lg border border-slate-600 px-3 py-2 text-sm">Clear selection</button></div>
   <p className="text-sm text-cyan-100">Mouse pairing Wi-Fi: <strong>{handoff.ssid}</strong> · MAC: <strong className="font-mono">{handoff.mac}</strong></p>
   <p className="text-xs text-amber-200">Identity only. This does not prove that the mouse is online or paired to restaurant Wi-Fi. No Wi-Fi password is carried here.</p>
   {alreadyRegistered?<div className="rounded-xl border border-emerald-500/30 bg-slate-950 p-4">
    <p className="font-semibold">Already saved: {alreadyRegistered.deviceName||alreadyRegistered.deviceId}</p>
    <p className="mt-1 text-xs text-slate-300">{alreadyRegistered.deviceId} · {branches.find(b=>b.id===alreadyRegistered.branchId)?.name||alreadyRegistered.branchName||"No restaurant"}</p>
    <p className="mt-2 text-xs text-amber-200">We will not create a duplicate. The saved card is available below, even if MQTT is not connected.</p>
    <button type="button" className="mt-3 rounded-lg border border-cyan-500 px-4 py-2 text-sm text-cyan-100" onClick={()=>{setBranchFilter(alreadyRegistered.branchId||"");setSearch("");document.getElementById("saved-mouse-cards")?.scrollIntoView({behavior:"smooth",block:"start"});}}>View saved mouse</button>
   </div>:<div className="space-y-3">
    <p className="font-semibold">Review and register this mouse (pending activation)</p>
    <div className="grid gap-3 sm:grid-cols-2">
     <label className="space-y-1 text-sm">Restaurant / Branch
      <select className={input+" w-full"} value={draftBranch} onChange={e=>setDraftBranch(e.target.value)}><option value="">Choose registered restaurant</option>{branches.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select>
     </label>
     <label className="space-y-1 text-sm">Mouse number / Name
      <input className={input+" w-full"} maxLength={120} value={draftName} placeholder="e.g. Mouse #12" onChange={e=>setDraftName(e.target.value)}/>
     </label>
     <label className="space-y-1 text-sm">Installation area
      <input className={input+" w-full"} maxLength={120} value={draftArea} placeholder="Kitchen" onChange={e=>setDraftArea(e.target.value)}/>
     </label>
     <div className="rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm">Selected 2.4 GHz Wi-Fi: <strong>{handoff.wifiSsid||"Not selected"}</strong><p className="mt-2 text-xs text-amber-200">Not sent to the physical mouse. Actual pairing must be completed separately in Smart Life.</p></div>
    </div>
    <label className="block space-y-1 text-sm">Internal notes (optional)
     <input className={input+" w-full"} maxLength={300} value={draftNotes} placeholder="Installation details" onChange={e=>setDraftNotes(e.target.value)}/>
    </label>
    {handoffError&&<p role="alert" className="text-sm text-amber-200">{handoffError}</p>}
    <button type="button" disabled={registering||loading||!branches.some(b=>b.id===draftBranch)||!draftName.trim()||!draftArea.trim()} onClick={()=>void registerSelected()} className="rounded-xl bg-cyan-600 px-5 py-3 font-bold disabled:cursor-not-allowed disabled:opacity-40">{registering?"Checking and saving…":"Save Mouse to Restaurant (pending)"}</button>
   </div>}
  </section>}
  <section className="rounded-2xl border border-slate-700 bg-slate-900/75 p-5">
   <h3 className="mb-3 font-semibold">Find registered mouse / restaurant</h3>
   <div className="grid gap-3 sm:grid-cols-2">
    <select aria-label="Filter restaurant" className={input} value={branchFilter} onChange={e=>setBranchFilter(e.target.value)}><option value="">All restaurants</option>{branches.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select>
    <input aria-label="Search registered mice" className={input} value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search mouse name or device ID"/>
   </div>
  </section>
  {!initialLoadFinished&&<div role="status" className="rounded-2xl bg-slate-900 p-6 text-cyan-200">Loading saved device reports…</div>}
  {initialLoadFinished&&!error&&visible.length===0&&<div role="status" className="rounded-2xl border border-cyan-500/25 bg-slate-900/75 p-6">
   <div className="flex items-center gap-2 font-semibold"><RadioTower size={18}/>No saved mice match this selection</div>
   <p className="mt-2 text-sm text-slate-300">{devices.length?"Choose another restaurant or clear the search to see saved mice.":"No mouse registrations found. Use Smart Check to choose a physical mouse."}</p>
   <p className="mt-2 text-xs text-slate-400">Saved mice are not necessarily online; only recent authenticated MQTT confirms a live connection.</p>
  </div>}
  <div id="saved-mouse-cards" className="grid scroll-mt-24 gap-4 lg:grid-cols-2">{visible.map(d=>{
   const connected=isLive(d);
    const battery=getNumber(d,"battery_percentage",0,100);
   const rssi=getNumber(d,"rssi",-120,0);
   const report=d.lastCheckedAt?new Date(d.lastCheckedAt).toLocaleString("en-GB"):"Not reported";
   const branch=d.branchName||branches.find(x=>x.id===d.branchId)?.name||"Not assigned";
   return <article key={d.id} className={"space-y-4 rounded-2xl border bg-slate-950 p-5 "+(connected?"border-emerald-500/40":"border-slate-700")}>
    <div className="flex flex-wrap items-start justify-between gap-3">
     <div><h3 className="text-lg font-bold">{d.deviceName||d.deviceId}</h3><p className="font-mono text-xs text-cyan-200">{d.deviceId}</p><p className="mt-1 text-sm">{branch} · {area(d)}</p></div>
     <div className="flex flex-wrap items-center justify-end gap-2">
      <span className={"rounded-full px-3 py-1 text-xs font-semibold "+(connected?"bg-emerald-900 text-emerald-200":"bg-amber-950 text-amber-200")}>{connected?"Recent MQTT report":d.lastCheckedAt?"No recent MQTT report":"MQTT not verified"}</span>
      <button type="button" aria-label={"Delete "+(d.deviceName||d.deviceId)+" permanently"} title="Delete this mouse from backend and card" onClick={()=>{setDeleteTarget(d);setDeleteAcknowledged(false);setDeleteError("");}} className="inline-flex items-center gap-1 rounded-lg border border-red-700/80 bg-red-950/70 px-2.5 py-1.5 text-xs font-semibold text-red-200 hover:bg-red-900 focus-visible:ring-2 focus-visible:ring-red-300"><Trash2 size={15}/>Delete</button>
     </div>
    </div>
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{([
     ["Battery",battery===null?"Not verified":battery+"% (last MQTT report)"],
     ["Device Wi-Fi","Restaurant Wi-Fi not independently verified"],
     ["MQTT",connected?"Recent authenticated report":d.lastCheckedAt?"Last MQTT report is old":"No authenticated report"],
     ["MQTT RSSI",rssi===null?"Not verified":rssi+" dBm (last MQTT report)"],
     ["Last report",report],
     ["Trap",d.alarmActive?(connected?"Recorded catch alarm":"Previous alarm — not live"):"No verified active catch"],
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
