import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, Trash2, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Observation = {id:string;hardwareKey:string;hostname?:string|null;macAddress?:string|null;wifiSignalPercent?:number|null;lastSeenAt?:string|null;isWifiRecentlySeen?:boolean};
type Network = {ssid:string;frequency:number;signal:number};
type Scan = {fresh:boolean;reportedAt:string|null;networks:Network[]};
type Branch = {id:string;name:string};
type Device = {id:string;deviceId?:string;deviceName?:string;branchId?:string;branchName?:string;location?:string;installationLocation?:string;batteryPercent?:number|null;batteryPct?:number|null;wifiSignal?:number|null;rssi?:number|null;isOnline?:boolean;lastSeenAt?:string|null;trapCondition?:string|null;notes?:string|null};
const MOUSE_SSID="SmartLife-203B";
const MOUSE_MAC="F8:17:2D:BB:20:3A";
const input="w-full rounded-lg border border-slate-600 bg-slate-950 p-3 text-white";
export default function FreshSmartCheck(){
 const {toast}=useToast();
 const [branches,setBranches]=useState<Branch[]>([]);
 const [branchId,setBranchId]=useState("");
 const [devices,setDevices]=useState<Device[]>([]);
 const [observation,setObservation]=useState<Observation|null>(null);
 const [scan,setScan]=useState<Scan|null>(null);
 const [deviceName,setDeviceName]=useState("Mouse #11");
 const [location,setLocation]=useState("");
 const [notes,setNotes]=useState("");
 const [wifiName,setWifiName]=useState("");
 const [password,setPassword]=useState("");
 const [showPassword,setShowPassword]=useState(false);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [editing,setEditing]=useState<string|null>(null);
 const [searchBranch,setSearchBranch]=useState("");
 const refresh=useCallback(async()=>{
  try{
   const [o,b,d,n]=await Promise.all([
    fetch("/api/iot/device-check",{credentials:"include",cache:"no-store"}),
    fetch("/api/branches?page=1&limit=5000",{credentials:"include",cache:"no-store"}),
    fetch("/api/iot/devices",{credentials:"include",cache:"no-store"}),
    fetch("/api/iot/router-wifi-networks",{credentials:"include",cache:"no-store"})
   ]);
   if(!o.ok||!b.ok||!d.ok||!n.ok) throw Error("Could not load current scanner or customer information");
   const sightings=await o.json() as Observation[];
   const branchData=await b.json();
   const deviceData=await d.json();
   const networkData=await n.json() as Scan;
   setBranches(Array.isArray(branchData.branches)?branchData.branches:[]);
   setDevices(Array.isArray(deviceData)?deviceData:[]);
   setObservation(Array.isArray(sightings)?sightings.find(x=>x.hostname?.toLowerCase()===MOUSE_SSID.toLowerCase()&&x.macAddress?.toLowerCase()===MOUSE_MAC.toLowerCase())||null:null);
   setScan(networkData);
   setError("");
  }catch(e:any){setError(String(e?.message||e));}
 },[]);
 useEffect(()=>{refresh();const timer=window.setInterval(refresh,15000);return()=>window.clearInterval(timer)},[refresh]);
 const nearWifi=useMemo(()=>scan?.fresh?(scan.networks||[]).filter(n=>n.frequency>=2400&&n.frequency<2500):[],[scan]);
 const matching=useMemo(()=>devices.filter(d=>String(d.deviceName||"").toLowerCase().includes(MOUSE_SSID.toLowerCase())||String(d.notes||d.location||d.installationLocation||"").toLowerCase().includes(MOUSE_MAC.toLowerCase())),[devices]);
 const registered=matching[0];
 const save=async()=>{
  if(!branchId||!deviceName.trim()) {setError("Select a restaurant and enter the mouse name.");return;}
  if(!observation?.isWifiRecentlySeen&&!registered){setError("Turn on Mouse #11 near HP2 to confirm a fresh observation before registering.");return;}
  setBusy(true);
  try{
   const existing=editing?matching.find(x=>x.id===editing):registered;
   const result=await fetch(existing?"/api/iot/devices/"+encodeURIComponent(existing.id):"/api/iot/devices",{
     method:existing?"PATCH":"POST",credentials:"include",
     headers:{"Content-Type":"application/json"},
     body:JSON.stringify({deviceName:deviceName.trim(),branchId,deviceId:existing?.deviceId||"",hardwareModel:"BK7231N-MOUSE-V1",notes:"Installation area: "+location.trim()+". SmartLife AP: "+MOUSE_SSID+". Mouse MAC: "+MOUSE_MAC+". "+notes.trim()})
   });
   const data=await result.json().catch(()=>({}));
   if(!result.ok)throw Error(data?.message||"Could not save mouse");
   setEditing(null);setPassword("");setShowPassword(false);
   toast({title:"Mouse registration saved",description:"Restaurant and mouse details saved. Wi-Fi password NOT sent. Mouse connectivity requires real MQTT confirmation."});
   await refresh();
  }catch(e:any){setError(String(e?.message||e))}
  finally{setBusy(false)}
 };
 const remove=async(d:Device)=>{
  if(!window.confirm("Delete mouse "+(d.deviceName||d.deviceId)+" from the registered device list? This does not delete the restaurant. This action may affect device monitoring."))return;
  setBusy(true);
  try{
   const res=await fetch("/api/iot/devices/"+encodeURIComponent(d.id),{method:"DELETE",credentials:"include"});
   if(!res.ok)throw Error((await res.json().catch(()=>({}))).message||"Could not delete device");
   toast({title:"Mouse registration deleted"});await refresh();
  }catch(e:any){setError(String(e?.message||e))}
  finally{setBusy(false)}
 };
 return <main className="mx-auto max-w-5xl space-y-5 text-white">
  <header className="rounded-2xl border border-cyan-500/30 bg-slate-900/80 p-5">
   <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-2xl font-bold">Smart Check</h2><button className="flex items-center gap-2 rounded-lg bg-cyan-700 px-4 py-2" onClick={refresh}><RefreshCw size={17}/> Refresh</button></div>
   <p className="mt-2 text-sm text-slate-300">Mouse installation · select the restaurant, detect the mouse, choose Wi-Fi, save the mouse card.</p>
  </header>
  <section className="space-y-4 rounded-2xl border border-slate-700 bg-slate-900/75 p-5">
   <h3 className="text-lg font-semibold">1 · Select Restaurant / Branch</h3>
   <input placeholder="Search existing restaurants" value={searchBranch} onChange={e=>setSearchBranch(e.target.value)} className={input}/>
   <select value={branchId} onChange={e=>setBranchId(e.target.value)} className={input}><option value="">Select registered restaurant</option>{branches.filter(b=>b.name.toLowerCase().includes(searchBranch.toLowerCase())).map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select>
  </section>
  <section className="space-y-4 rounded-2xl border border-slate-700 bg-slate-900/75 p-5">
   <h3 className="text-lg font-semibold">2 · Register Mouse</h3>
   <div className="grid gap-4 sm:grid-cols-2">
    <label>Mouse number / Device name<input className={"mt-2 "+input} value={deviceName} onChange={e=>setDeviceName(e.target.value)} maxLength={120}/></label>
    <label>Installation area<input className={"mt-2 "+input} value={location} onChange={e=>setLocation(e.target.value)} placeholder="Kitchen"/></label>
    <div className="rounded-lg bg-slate-950 p-3"><p className="text-sm text-slate-400">Device Wi-Fi ID · Auto</p><strong>{observation?.hostname||MOUSE_SSID}</strong></div>
    <div className="rounded-lg bg-slate-950 p-3"><p className="text-sm text-slate-400">Mouse MAC · Auto</p><strong className="font-mono text-sm">{observation?.macAddress||MOUSE_MAC}</strong></div>
   </div>
   <p className="text-sm text-cyan-200">{observation?.isWifiRecentlySeen?"HP2 detected Mouse #11 recently": "Mouse #11 is not currently detected. Switch on the mouse near HP2 to scan."}</p>
   {observation?.wifiSignalPercent!=null&&<p className="text-sm">HP2 Wi-Fi signal: {observation.wifiSignalPercent}% (access-point scan, not connected signal)</p>}
   <p className="text-xs text-slate-400">Battery and trap condition appear only after the physical mouse reports them. No guessed status.</p>
   <h3 className="text-lg font-semibold">3 · Restaurant 2.4 GHz Wi-Fi</h3>
   <select className={input} value={wifiName} onChange={e=>{setWifiName(e.target.value);setPassword("");}}><option value="">Select nearby Wi-Fi</option>{nearWifi.map(n=><option key={n.ssid+":"+n.frequency} value={n.ssid}>{n.ssid} · {n.signal}%</option>)}</select>
   <input className={input} value={wifiName} onChange={e=>{setWifiName(e.target.value);setPassword("");}} placeholder="Or enter Wi-Fi name manually"/>
   {!scan?.fresh&&<p className="text-sm text-amber-200">HP2 has not reported a recent router scan.</p>}
   <div className="flex gap-2"><input type={showPassword?"text":"password"} className={input} value={password} onChange={e=>setPassword(e.target.value)} autoComplete="new-password" placeholder="Wi-Fi password (local entry only)"/><button type="button" onClick={()=>setShowPassword(v=>!v)} className="rounded-lg bg-slate-700 px-4">{showPassword?"Hide":"Show"}</button></div>
   <p className="text-xs text-amber-200">Password is never uploaded or saved. Save only registers the mouse; physical provisioning is not implemented. Please do not enter your real password until Connect is operational.</p>
   <label className="block">Internal notes<textarea className={"mt-2 "+input} rows={2} value={notes} onChange={e=>setNotes(e.target.value)} /></label>
   {error&&<p role="alert" className="rounded-lg bg-red-950 p-3 text-sm text-red-200">{error}</p>}
   <div className="flex flex-wrap gap-3">
    <button disabled={busy||!branchId||(!observation?.isWifiRecentlySeen&&!registered)} onClick={save} className="rounded-lg bg-cyan-600 px-5 py-3 font-semibold disabled:opacity-40">{busy?"Saving...":editing?"Save Changes":"Save Mouse Card"}</button>
    <button type="button" disabled className="rounded-lg bg-slate-700 px-5 py-3 font-semibold opacity-50">Save & Connect · Not available yet</button>
   </div>
  </section>
  <section className="space-y-4 rounded-2xl border border-slate-700 bg-slate-900/75 p-5">
   <h3 className="text-lg font-semibold">Registered Mouse Cards</h3>
   {matching.length===0&&<p className="rounded-lg bg-slate-950 p-4 text-slate-300">No registered Mouse #11 card yet.</p>}
   {matching.map(d=>{
    const battery=d.batteryPercent??d.batteryPct;const signal=d.wifiSignal??d.rssi;
    return <article key={d.id} className="rounded-xl border border-cyan-500/30 bg-slate-950 p-4">
     <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h4 className="text-lg font-bold">{d.deviceName||"Mouse #11"}</h4><p className="font-mono text-xs text-cyan-200">{d.deviceId||"ID not available"}</p><p className="mt-1 text-sm">Wi-Fi ID: {MOUSE_SSID} · MAC: {MOUSE_MAC}</p></div>
      <div className="flex gap-2">
       <button type="button" onClick={()=>{setEditing(d.id);setDeviceName(d.deviceName||"Mouse #11");setBranchId(d.branchId||"");setLocation(d.location||d.installationLocation||"");window.scrollTo({top:0,behavior:"smooth"})}} className="rounded-lg bg-slate-700 p-3" aria-label="Edit mouse"><Pencil size={17}/></button>
       <button type="button" onClick={()=>remove(d)} disabled={busy} className="rounded-lg bg-red-900/70 p-3 disabled:opacity-40" aria-label="Delete mouse"><Trash2 size={17}/></button>
      </div>
     </div>
     <p className="mt-3 text-sm">Restaurant: {d.branchName||branches.find(b=>b.id===d.branchId)?.name||"Not assigned"}</p>
     <p className="text-sm">Installation area: {d.location||d.installationLocation||"Not set"}</p>
     {battery!=null&&<p className="text-sm">Battery: {battery}%</p>}
     {signal!=null&&<p className="text-sm">Wi-Fi signal: {signal}</p>}
     <p className="text-sm">{d.isOnline&&d.lastSeenAt&&Date.now()-new Date(d.lastSeenAt).getTime()<180000?"🟢 Connected (recent MQTT report)":"Connection not confirmed"}</p>
     {d.trapCondition&&["ready","caught","service_required"].includes(d.trapCondition.toLowerCase())&&<p className="text-sm">Trap: {d.trapCondition}</p>}
     {d.lastSeenAt&&<p className="text-xs text-slate-400">Last updated: {new Date(d.lastSeenAt).toLocaleString("en-GB")}</p>}
    </article>
   })}
  </section>
 </main>;
}
