import { useCallback, useMemo, useState } from "react";
import { RefreshCw, Pencil, Trash2, Wifi, ArrowRight, RadioTower } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Observation = {
 id:string; hardwareKey:string; hostname?:string|null; macAddress?:string|null;
 wifiSignalPercent?:number|null; lastSeenAt?:string|null; isWifiRecentlySeen?:boolean;
 assignedDeviceId?:string|null;
};
type Network = {ssid:string;frequency:number;signal:number};
type Scan = {fresh:boolean;reportedAt:string|null;networks:Network[]};
type Branch = {id:string;name:string};
type Report = {code:string;value:unknown};
type Device = {
 id:string;deviceId?:string;deviceName?:string;branchId?:string;branchName?:string;
 location?:string;installationLocation?:string;batteryPercent?:number|null;batteryPct?:number|null;
 wifiSignal?:number|null;rssi?:number|null;isOnline?:boolean;lastSeenAt?:string|null;
 lastCheckedAt?:string|null;trapCondition?:string|null;notes?:string|null;
 alarmActive?:boolean;lastStatus?:Report[];
};
const input="w-full rounded-xl border border-slate-600 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none";
const normalizedMac=(s:unknown)=>String(s||"").toUpperCase().trim();
const mouseAp=(o:Observation)=>/^(SmartLife-|OpenBK)/i.test(o.hostname||"") && /^([0-9A-F]{2}:){5}[0-9A-F]{2}$/i.test(o.macAddress||"");
const savedMac=(d:Device)=>normalizedMac(String(d.notes||"").match(/Mouse MAC:\s*((?:[0-9A-F]{2}:){5}[0-9A-F]{2})/i)?.[1]);
const savedAp=(d:Device)=>String(d.notes||"").match(/SmartLife AP:\s*([a-zA-Z0-9_-]+)/i)?.[1]||"";
const savedArea=(d:Device)=> {
 const m=String(d.notes||"").match(/Installation area:\s*(.*?)\.\s*SmartLife AP:/i);
 return m?.[1]?.trim()||String(d.location||d.installationLocation||"");
};
const reportValue=(d:Device,code:string)=>d.lastStatus?.find(x=>x.code===code)?.value;
const reportedNumber=(v:unknown,low:number,high:number)=>{
 if(v===null||v===undefined||v==="")return null;
 const n=Number(v);return Number.isFinite(n)&&n>=low&&n<=high?n:null;
};
const validReport=(d:Device)=>Boolean(d.lastCheckedAt&&!Number.isNaN(new Date(d.lastCheckedAt).getTime()));
const liveMqtt=(d:Device)=>{
 const age=d.lastCheckedAt?Date.now()-new Date(d.lastCheckedAt).getTime():NaN;
 return Boolean(d.isOnline&&Number.isFinite(age)&&age>=0&&age<180000);
};
const when=(v?:string|null)=>v?new Date(v).toLocaleString("en-GB"):"Not reported";

export default function FreshSmartCheck(){
 const {toast}=useToast();
 const [branches,setBranches]=useState<Branch[]>([]);
 const [devices,setDevices]=useState<Device[]>([]);
 const [observations,setObservations]=useState<Observation[]>([]);
 const [scan,setScan]=useState<Scan|null>(null);
 const [branchId,setBranchId]=useState("");
 const [searchBranch,setSearchBranch]=useState("");
 const [wifiName,setWifiName]=useState("");
 const [deviceName,setDeviceName]=useState("");
 const [location,setLocation]=useState("");
 const [notes,setNotes]=useState("");
 const [selectedMac,setSelectedMac]=useState("");
 const [editing,setEditing]=useState<string|null>(null);
 const [refreshing,setRefreshing]=useState(false);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [refreshedAt,setRefreshedAt]=useState<string|null>(null);
 const [justSaved,setJustSaved]=useState<string|null>(null);

 // Manual only: no useEffect, setInterval or background browser requests.
 // HP2 scans independently. Both Refresh and Detect read its saved reports.
 const refresh=useCallback(async()=>{
  setRefreshing(true);
  try {
   const [o,b,d,n]=await Promise.all([
    fetch("/api/iot/device-check",{credentials:"include",cache:"no-store"}),
    fetch("/api/branches?page=1&limit=5000",{credentials:"include",cache:"no-store"}),
    fetch("/api/iot/devices",{credentials:"include",cache:"no-store"}),
    fetch("/api/iot/router-wifi-networks",{credentials:"include",cache:"no-store"})
   ]);
   if(!o.ok||!b.ok||!d.ok||!n.ok)throw Error("Could not load saved HP2 reports or device records.");
   const sightings=await o.json() as Observation[];
   const branchData=await b.json();
   const deviceData=await d.json();
   const networkData=await n.json() as Scan;
   const mouseReports=Array.isArray(sightings)?sightings.filter(mouseAp):[];
   setObservations(mouseReports);
   const freshMice=mouseReports.filter(o=>o.isWifiRecentlySeen&&o.lastSeenAt&&Date.now()-new Date(o.lastSeenAt).getTime()<75000);
   if(freshMice.length===1)setSelectedMac(previous=>previous||normalizedMac(freshMice[0].macAddress));
   setBranches(Array.isArray(branchData.branches)?branchData.branches:[]);
   setDevices(Array.isArray(deviceData)?deviceData:[]);
   setScan(networkData);
   setRefreshedAt(new Date().toLocaleTimeString("en-GB"));
   setError("");
  }catch(e:any){setError(String(e?.message||e));}
  finally{setRefreshing(false);}
 },[]);

 const nearbyWifi=useMemo(()=>scan?.fresh?(scan.networks||[]).filter(n=>n.frequency>=2400&&n.frequency<2500&&!/^(SmartLife-|OpenBK)/i.test(n.ssid)):[],[scan]);
 const currentMice=useMemo(()=>observations.filter(o=>o.isWifiRecentlySeen&&o.macAddress&&o.lastSeenAt&&Date.now()-new Date(o.lastSeenAt).getTime()>=0&&Date.now()-new Date(o.lastSeenAt).getTime()<75000),[observations]);
 const selected=currentMice.find(o=>normalizedMac(o.macAddress)===selectedMac);
 const selectedRegistered=devices.find(d=>Boolean(selectedMac)&&savedMac(d)===selectedMac);
 const selectedBranch=branches.find(b=>b.id===branchId);
 const editingSaved=editing?devices.find(d=>d.id===editing):null;
 const formValid=Boolean(branchId&&(wifiName.trim()||editingSaved)&&deviceName.trim()&&location.trim()&&(selected||(editingSaved&&savedMac(editingSaved)&&savedAp(editingSaved))));
 const resetForm=()=>{
  setDeviceName("");setLocation("");setNotes("");setSelectedMac("");setWifiName("");setEditing(null);
  setJustSaved(null);setError("");
 };
 const save=async()=>{
  const existing=editing?devices.find(d=>d.id===editing):selectedRegistered;
  if(!branchId||!deviceName.trim()||!location.trim()||(!editing&&!wifiName.trim())){
   setError("Choose a restaurant and its 2.4 GHz Wi-Fi, then enter mouse name and installation area.");return;
  }
  const detected=selected||(existing&&editing?{macAddress:savedMac(existing),hostname:savedAp(existing)}:null);
  if(!detected?.macAddress||!detected.hostname){
   setError("Detect the physical mouse's pairing Wi-Fi and choose its MAC before saving. The mouse number cannot be inferred from the SmartLife Wi-Fi name.");return;
  }
  const mac=normalizedMac(detected.macAddress);
  const duplicate=devices.find(d=>savedMac(d)===mac&&d.id!==existing?.id);
  if(duplicate){setError("This mouse MAC is already registered as "+(duplicate.deviceName||duplicate.deviceId)+". Edit that card instead of creating a duplicate.");return;}
  setBusy(true);
  try{
   const savedNotes="Installation area: "+location.trim()+". SmartLife AP: "+detected.hostname+". Mouse MAC: "+mac+". "+notes.trim();
   // Passwords are NEVER collected or sent; the stock W003 provisioning
   // protocol is unverified. Selected SSID remains local form context only.
   const response=await fetch(existing?"/api/iot/devices/"+encodeURIComponent(existing.id):"/api/iot/devices",{
    method:existing?"PATCH":"POST",credentials:"include",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({deviceName:deviceName.trim(),branchId,hardwareModel:"BK7231N-MOUSE-V1",notes:savedNotes})
   });
   const data=await response.json().catch(()=>({}));
   if(!response.ok)throw Error(data.message||"Could not save mouse registration.");
   setEditing(null);
   setJustSaved(mac);
   toast({title:"Mouse registration saved",description:"Saved to the selected restaurant. Wi-Fi/MQTT connection is NOT yet verified."});
   await refresh();
  }catch(e:any){setError(String(e?.message||e));}
  finally{setBusy(false);}
 };
 const edit=(d:Device)=>{
  const mac=savedMac(d);
  setEditing(d.id);setBranchId(d.branchId||"");setDeviceName(d.deviceName||"");
  setLocation(savedArea(d));setNotes("");setWifiName("");setSelectedMac(mac);
  setJustSaved(null);window.scrollTo({top:0,behavior:"smooth"});
 };
 const remove=async(d:Device)=>{
  if(!window.confirm("Delete registered mouse "+(d.deviceName||d.deviceId)+"? This affects saved monitoring data and cannot be undone."))return;
  setBusy(true);
  try{
   const r=await fetch("/api/iot/devices/"+encodeURIComponent(d.id),{method:"DELETE",credentials:"include"});
   if(!r.ok)throw Error((await r.json().catch(()=>({})))?.message||"Delete failed"));
   toast({title:"Registration deleted"});await refresh();
  }catch(e:any){setError(String(e?.message||e));}finally{setBusy(false);}
 };
 return <main className="mx-auto max-w-5xl space-y-5 text-white">
  <header className="rounded-2xl border border-cyan-500/30 bg-slate-900/80 p-5">
   <div className="flex flex-wrap items-center justify-between gap-3">
    <div><h2 className="text-2xl font-bold">Smart Check</h2><p className="mt-1 text-sm text-slate-300">One installation form · restaurant Wi-Fi · physical mouse detection · saved card</p></div>
    <button type="button" disabled={refreshing||busy} aria-busy={refreshing} className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-3 font-semibold disabled:opacity-50" onClick={()=>void refresh()}><RefreshCw size={18} className={refreshing?"animate-spin":""}/>{refreshing?"Checking...":"Refresh"}</button>
   </div>
   <p role="status" className="mt-3 text-xs text-cyan-200">{refreshedAt?"Last checked "+refreshedAt+" · Auto-refresh OFF · HP2 scans independently.":"Auto-refresh OFF · Press Refresh to load saved HP2 and restaurant reports."}</p>
  </header>
  <section className="space-y-5 rounded-2xl border border-cyan-500/30 bg-slate-900/75 p-5">
   <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-xl font-bold">Install a mouse · One form</h3><span className="rounded-full bg-cyan-950 px-3 py-1 text-xs text-cyan-200">{editing?"Editing saved mouse":"New installation"}</span></div>
   <div className="grid gap-4 sm:grid-cols-2">
    <label className="sm:col-span-2"><span className="mb-2 block font-semibold">Restaurant / Branch</span>
     <input className={input} placeholder="Search registered restaurants" value={searchBranch} onChange={e=>setSearchBranch(e.target.value)}/>
     <select className={"mt-2 "+input} value={branchId} onChange={e=>setBranchId(e.target.value)}><option value="">Choose restaurant</option>{branches.filter(b=>b.name.toLowerCase().includes(searchBranch.toLowerCase())).map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select>
    </label>
    <label><span className="mb-2 block font-semibold">Restaurant 2.4 GHz Wi-Fi</span><select className={input} value={nearbyWifi.some(n=>n.ssid===wifiName)?wifiName:""} onChange={e=>setWifiName(e.target.value)}><option value="">Choose nearby Wi-Fi</option>{nearbyWifi.map(n=><option key={n.ssid+":"+n.frequency} value={n.ssid}>{n.ssid} · {n.signal}% · {n.frequency} MHz</option>)}</select></label>
    <label><span className="mb-2 block font-semibold">Home / hotspot / local Wi-Fi name</span><input className={input} placeholder="Or enter a 2.4 GHz Wi-Fi name" value={wifiName} onChange={e=>setWifiName(e.target.value)}/></label>
    <div className="sm:col-span-2 rounded-xl border border-slate-700 bg-slate-950 p-4 text-sm text-slate-300">
     <p className="font-medium text-white">Wi-Fi password · Connection setup not yet available</p>
     <input type="password" className={"mt-2 "+input+" cursor-not-allowed opacity-60"} placeholder="Disabled until compatible provisioning is verified" disabled value=""/>
     <p className="mt-2 text-amber-200">Do not enter a real Wi-Fi password yet. The current BMAX W003 firmware has no verified remote provisioning method. Saving registers a mouse; it cannot connect the physical mouse to Wi-Fi.</p>
     {scan&&!scan.fresh&&<p className="mt-2">No recent 2.4 GHz router scan from HP2. You can still type the network name above.</p>}
    </div>
    <label><span className="mb-2 block font-semibold">Mouse number / Device name</span><input className={input} value={deviceName} onChange={e=>setDeviceName(e.target.value)} placeholder="e.g. Mouse #13" maxLength={120}/></label>
    <label><span className="mb-2 block font-semibold">Installation area</span><input className={input} value={location} onChange={e=>setLocation(e.target.value)} placeholder="Kitchen, storage room, etc." maxLength={120}/></label>
   </div>
   <div className="space-y-3 rounded-xl border border-cyan-600/30 bg-slate-950 p-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h4 className="font-bold">Detect the physical mouse</h4><p className="mt-1 text-sm text-slate-300">Switch your chosen mouse ON so its pairing Wi-Fi flashes. HP2 scans independently.</p></div>
     <button type="button" disabled={refreshing||busy} onClick={()=>void refresh()} className="flex items-center gap-2 rounded-lg border border-cyan-500 bg-cyan-950 px-4 py-3 font-semibold text-cyan-100 disabled:opacity-50"><RadioTower size={16}/>{refreshing?"Checking...":"Detect mouse"}</button>
    </div>
    <p className="text-xs text-slate-400">Detect mouse reads the latest saved HP2 report once. It does not start or repeatedly refresh HP2 scans. A SmartLife Wi-Fi name cannot reveal the mouse number—you enter that above.</p>
    <label className="block text-sm font-medium">Detected mouse Wi-Fi (choose the mouse you switched on)
     <select className={"mt-2 "+input} value={currentMice.some(o=>normalizedMac(o.macAddress)===selectedMac)?selectedMac:""} onChange={e=>setSelectedMac(e.target.value)}>
      <option value="">Select a currently detected mouse</option>
      {currentMice.map(o=><option key={o.hardwareKey||o.id} value={normalizedMac(o.macAddress)}>{o.hostname} · {o.macAddress} · {o.wifiSignalPercent??"?"}% AP signal</option>)}
     </select>
    </label>
    <div className="grid gap-3 sm:grid-cols-2">
     <div className="rounded-lg bg-slate-900 p-3"><p className="text-xs text-slate-400">Currently detected mouse Wi-Fi ID</p><strong>{selected?.hostname||"Not detected / not selected"}</strong></div>
     <div className="rounded-lg bg-slate-900 p-3"><p className="text-xs text-slate-400">Currently detected mouse MAC</p><strong className="font-mono text-sm">{selected?.macAddress||"Not detected / not selected"}</strong></div>
    </div>
    <p className="text-xs text-amber-200">{currentMice.length===0?"No current pairing Wi-Fi sighting from HP2. Do not assume the mouse is OFF.":currentMice.length===1?"One pairing Wi-Fi was seen. Confirm it is your mouse before selecting.":currentMice.length+" mouse pairing Wi-Fi networks were seen. Choose the correct physical mouse."}</p>
   </div>
   <label className="block"><span className="mb-2 block font-semibold">Internal notes</span><textarea rows={2} className={input} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Optional installation notes"/></label>
   {error&&<p role="alert" className="rounded-lg border border-red-500/40 bg-red-950/40 p-3 text-red-200">{error}</p>}
   {selectedBranch&&selected&&<p className="text-sm text-cyan-200">Ready to register <strong>{deviceName||"the named mouse"}</strong> at <strong>{selectedBranch.name}</strong>. This records identity and branch; it does not provision restaurant Wi-Fi.</p>}
   <div className="flex flex-wrap gap-3">
    <button type="button" disabled={busy||refreshing||!formValid} onClick={()=>void save()} className="rounded-xl bg-cyan-600 px-6 py-3 font-bold disabled:opacity-40">{busy?"Saving...":editing?"Save Changes":"Save Mouse Card"}</button>
    {editing&&<button type="button" onClick={resetForm} className="rounded-xl border border-slate-600 px-5 py-3">Cancel edit</button>}
   </div>
  </section>
  <section className="space-y-4 rounded-2xl border border-slate-700 bg-slate-900/75 p-5">
   <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-xl font-bold">Registered Mouse Cards</h3><span className="text-xs text-slate-400">Real saved records · no simulated readings</span></div>
   {!refreshedAt&&<p className="rounded-lg bg-slate-950 p-4 text-sm text-slate-300">Click Refresh above to load your saved mouse cards.</p>}
   {refreshedAt&&devices.length===0&&<p className="rounded-lg bg-slate-950 p-4 text-slate-300">No saved mouse registrations.</p>}
   <div className="grid gap-4 md:grid-cols-2">{devices.map(d=>{
    const mac=savedMac(d),ap=savedAp(d);
    const apReport=observations.find(o=>Boolean(mac)&&normalizedMac(o.macAddress)===mac);
    const hasReport=validReport(d);
    const battery=hasReport?reportedNumber(reportValue(d,"battery_percentage")??d.batteryPercent??d.batteryPct,0,100):null;
    const rssi=hasReport?reportedNumber(reportValue(d,"rssi")??d.rssi,-120,0):null;
    const connected=liveMqtt(d);
    const trap=hasReport?(d.alarmActive?"Mouse caught":d.trapCondition||"No verified trap condition"):"Not verified";
    return <article key={d.id} className={"space-y-3 rounded-xl border bg-slate-950 p-4 "+(justSaved&&mac===justSaved?"border-emerald-500/70":"border-cyan-500/25")}>
     <div className="flex items-start justify-between gap-2"><div><h4 className="text-lg font-bold">{d.deviceName||d.deviceId}</h4><p className="font-mono text-xs text-cyan-200">{d.deviceId}</p><p className="mt-1 text-sm text-slate-300">{d.branchName||branches.find(b=>b.id===d.branchId)?.name||"Not assigned"} · {savedArea(d)||"Installation not set"}</p></div>
      <div className="flex gap-2"><button type="button" onClick={()=>edit(d)} aria-label={"Edit "+(d.deviceName||"mouse")} className="rounded-lg bg-slate-800 p-2"><Pencil size={16}/></button><button type="button" disabled={busy} onClick={()=>remove(d)} aria-label={"Delete "+(d.deviceName||"mouse")} className="rounded-lg bg-red-950 p-2 disabled:opacity-40"><Trash2 size={16}/></button></div>
     </div>
     <div className="flex items-center gap-2 text-sm"><span className={"h-2.5 w-2.5 rounded-full "+(connected?"bg-emerald-400":"bg-amber-400")}/><strong>{connected?"MQTT recently reported":"MQTT not verified / no recent report"}</strong></div>
     <p className="text-xs text-slate-400">Pairing Wi-Fi: {ap||"Not recorded"} · MAC: {mac||"Not recorded"}</p>
     <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
      {([
       ["Battery",battery!==null?battery+"% (last report)":"Not verified"],
       ["Device Wi-Fi",connected?"MQTT received · Wi-Fi path not independently verified":"Not verified"],
       ["MQTT",connected?"Recent report":"Not connected / not verified"],
       ["MQTT signal",rssi!==null?rssi+" dBm (last report)":"Not verified"],
       ["Last device report",hasReport?when(d.lastCheckedAt):"Not reported"],
       ["Trap",trap],
      ] as [string,string][]).map(([key,value])=><div key={key} className="rounded-lg bg-slate-900 p-3"><p className="text-xs text-slate-400">{key}</p><p className="mt-1 font-semibold">{value}</p></div>)}
     </div>
     {apReport&&<p className="text-xs text-slate-400"><Wifi size={12} className="mr-1 inline"/>HP2 pairing AP: {apReport.wifiSignalPercent??"?"}% (last seen {when(apReport.lastSeenAt)}) · Not restaurant Wi-Fi</p>}
     <p className="border-t border-slate-800 pt-3 text-xs text-cyan-200"><ArrowRight size={14} className="mr-1 inline"/>Next: Open Smart Devices in the sidebar to view verified MQTT monitoring. This registration stays saved even when the pairing light stops flashing.</p>
    </article>;
   })}</div>
  </section>
 </main>;
}
