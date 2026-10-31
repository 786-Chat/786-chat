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
 const [filterBranch,setFilterBranch]=useState("");
 const [deviceSearch,setDeviceSearch]=useState("");
 const [alertDevice,setAlertDevice]=useState("");
 const [instruction,setInstruction]=useState("");
 const [message,setMessage]=useState("");
 const [count,setCount]=useState(1);
 const [sending,setSending]=useState(false);
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
   if(!response.ok)throw Error((await response.json().catch(()=>({}))).message||"Could not assign restaurant");
   toast({title:"Restaurant assignment saved",description:"The device is assigned in records. Physical MQTT connectivity must still be verified."});
   await refresh();
  }catch(e:any){setError(String(e?.message||e))}
  finally{setSaving("")}
 };
 const visible=devices.filter(d=>(!filterBranch||d.branchId===filterBranch)&&[d.deviceName,d.deviceId].some(t=>String(t||"").toLowerCase().includes(deviceSearch.toLowerCase())));
 // Manual instructions can be sent to any genuinely registered and assigned mouse.
 // The restaurant card filter and text search must not silently disable the picker.
 const instructionDevices=devices.filter(d=>Boolean(d.branchId)&&/^FS-MOUSE-\d{6,}$/.test(String(d.deviceId||""))&&(!filterBranch||d.branchId===filterBranch));
 const selectedInstructionDevice=instructionDevices.find(d=>d.id===alertDevice);
 const templates=[
 ["Safe removal and reset","Please safely remove the catch and reset the trap."],
 ["Kitchen hygiene","Keep food and utensils away from the affected area. Please clean and sanitise, then reset the trap."],
 ["Multiple mice caught","Please inspect the area for multiple mice and contact your pest controller."],
 ["Contact pest controller","Please contact the pest controller."],
 ["Check the trap","Please inspect the mouse trap safely."],
 ["Check surrounding area","Please check the surrounding area for pest activity."],
 ["Clean and disinfect","Please clean and disinfect the affected area."],
 ["Return to original position","Return the trap to its original marked position."],
 ["Confirm work completed","Please confirm when the work is completed."],
 ["Request technician visit","Please request a technician visit."]
 ];
 const sendInstruction=async()=>{
  const d=selectedInstructionDevice;
  if(!d?.branchId||!message.trim())return;
  setSending(true);
  try{
   const res=await fetch("/api/iot/manual-instructions",{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({deviceId:d.deviceId,branchId:d.branchId,miceCount:count,instruction:instruction||"Custom message",message:message.trim()})});
   const data=await res.json().catch(()=>({}));
   if(!res.ok)throw Error(data.message||"Unable to send");
   toast({title:"Manual instruction sent",description:"The branch received your instruction. No physical mouse catch event was generated."});
   setMessage("");setInstruction("");
  }catch(e:any){setError(String(e?.message||e))}
  finally{setSending(false)}
 };
 return <main className="mx-auto max-w-5xl space-y-5 text-white">
  <header className="rounded-2xl border border-cyan-500/30 bg-slate-900/75 p-5">
   <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-2xl font-bold">Smart Devices</h2><p className="mt-1 text-sm text-slate-300">Registered Food Safety mouse traps · real device records only</p></div><button type="button" disabled={loading} onClick={refresh} className="flex items-center gap-2 rounded-xl border-b-4 border-cyan-950 bg-cyan-600 px-5 py-3 font-semibold shadow-[0_6px_0_rgba(8,47,73,.7)] transition-all hover:-translate-y-0.5 active:translate-y-1 active:shadow-none disabled:opacity-60"><RefreshCw size={18} className={loading?"animate-spin":""}/>{loading?"Refreshing...":"Refresh"}</button></div>
  </header>
  {error&&<p role="alert" className="rounded-lg bg-red-950 p-3 text-red-200">{error}</p>}
  <section className="rounded-2xl border border-slate-700 bg-slate-900/75 p-5"><h3 className="mb-3 font-semibold">Select Restaurant / Branch</h3><div className="grid gap-3 sm:grid-cols-2"><select value={filterBranch} onChange={e=>{setFilterBranch(e.target.value);setAlertDevice("");}} className="rounded-lg bg-slate-950 p-3"><option value="">All restaurants</option>{branches.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select><input value={deviceSearch} onChange={e=>setDeviceSearch(e.target.value)} placeholder="Search mouse or device ID" className="rounded-lg bg-slate-950 p-3"/></div></section>
  {devices.length===0&&<p className="rounded-xl bg-slate-900 p-5">No registered Food Safety mouse devices. Register a mouse in Smart Check first.</p>}
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
    {signal!=null&&<p className="text-sm text-slate-300">📶 Wi-Fi RSSI: {signal}</p>}
    {last&&<p className="text-xs text-slate-400">Last device report: {new Date(last).toLocaleString("en-GB")}</p>}
    <div className="space-y-2 border-t border-slate-700 pt-4"><label className="block text-sm font-semibold">Assign to Branch</label><div className="flex flex-wrap gap-2"><select className="min-w-0 flex-1 rounded-lg border border-slate-600 bg-slate-900 p-3" value={assignment[d.id]??d.branchId??""} onChange={e=>setAssignment(v=>({...v,[d.id]:e.target.value}))}><option value="">Choose restaurant</option>{branches.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select><button type="button" disabled={saving===d.id||!assignment[d.id]||assignment[d.id]===d.branchId} onClick={()=>assign(d)} className="rounded-lg bg-cyan-600 px-4 py-3 font-semibold disabled:opacity-40">{saving===d.id?"Saving...":"Assign"}</button></div><p className="text-xs text-slate-400">Assignment updates customer records; it does not mean physical Wi-Fi or MQTT is connected.</p></div>
   </article>
  })}</div>
  <section className="space-y-4 rounded-2xl border border-red-500/30 bg-slate-900/80 p-5">
    <h3 className="text-lg font-bold">Send Mouse Instruction to Restaurant</h3>
    <p className="text-sm text-slate-300">Manual technician message only. Actual mouse-caught alerts come automatically from verified sensor events.</p>
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="text-sm">Device<select className="mt-2 w-full rounded-lg bg-slate-950 p-3" value={alertDevice} onChange={e=>setAlertDevice(e.target.value)} disabled={instructionDevices.length===0}><option value="">Select registered mouse</option>{instructionDevices.map(d=><option key={d.id} value={d.id}>{d.deviceName||d.deviceId} · {d.deviceId} · {d.branchName||branches.find(b=>b.id===d.branchId)?.name||"Assigned branch"}</option>)}</select></label>
      <label className="text-sm">Mice reported in this manual instruction<input type="number" min={1} max={99} value={count} onChange={e=>setCount(Math.max(1,Math.min(99,Number(e.target.value)||1)))} className="mt-2 w-full rounded-lg bg-slate-950 p-3"/></label>
    </div>
    <p className="text-xs text-cyan-200">{selectedInstructionDevice?("Send to: "+(selectedInstructionDevice.branchName||branches.find(b=>b.id===selectedInstructionDevice.branchId)?.name||"Assigned restaurant")+" · "+selectedInstructionDevice.deviceId):instructionDevices.length?"Select a mouse to choose its assigned restaurant automatically.":"No branch-assigned registered mice available for this selection."}</p>
    <label className="block text-sm">Ready-made instruction (10 options)<select value={instruction} onChange={e=>{setInstruction(e.target.value);setMessage(templates.find(t=>t[0]===e.target.value)?.[1]||"")}} className="mt-2 w-full rounded-lg bg-slate-950 p-3"><option value="">Choose instruction or type below</option>{templates.map(([label])=><option key={label} value={label}>{label}</option>)}</select></label>
    <label className="block text-sm">Optional message to restaurant<textarea maxLength={200} value={message} onChange={e=>setMessage(e.target.value)} rows={4} className="mt-2 w-full rounded-lg bg-slate-950 p-3"/></label>
    <p className="text-right text-xs text-slate-400">{message.length}/200 characters</p>
    <button type="button" disabled={!selectedInstructionDevice||!message.trim()||sending} onClick={sendInstruction} className="rounded-lg bg-red-700 px-5 py-3 font-semibold disabled:opacity-40">{sending?"Sending...":"Send Instruction to Restaurant"}</button>
  </section>
 </main>;
}
