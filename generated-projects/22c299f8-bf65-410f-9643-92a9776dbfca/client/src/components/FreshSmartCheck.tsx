import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, Search, Wifi, WifiOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Observation = {id:string;hardwareKey?:string;hostname?:string|null;macAddress?:string|null;wifiSignalPercent?:number|null;lastSeenAt?:string|null;isWifiRecentlySeen?:boolean;wifiObservationSource?:string|null};
type Network = {ssid:string;frequency:number;signal:number};
type Scan = {fresh:boolean;reportedAt:string|null;networks:Network[]};
type Branch = {id:string;name:string};
type Device = {id:string;deviceId?:string;deviceName?:string;branchId?:string;branchName?:string;notes?:string|null;location?:string;installationLocation?:string;isOnline?:boolean;lastCheckedAt?:string|null;lastSeenAt?:string|null;alarmActive?:boolean;lastStatus?:Array<{code:string;value:any}>};
type Diagnosis = {deviceRegistered:boolean;deviceId:string|null;branchAssigned:boolean;apRecentlySeen:boolean;apLastSeenAt:string|null;apSignal:number|null;routerScanFresh:boolean;routerScanAt:string|null;mqttRecentlyReceived:boolean;mqttLastSeenAt:string|null;provisioningSupported:boolean;reason:string;firmwareCompatible:boolean|null};
const input = "w-full rounded-lg border border-slate-600 bg-slate-950 p-3 text-white";
const normalizeMac = (value:unknown) => String(value||"").trim().toUpperCase();
const macFromRecord = (d:Device) => normalizeMac(String(d.notes||d.location||d.installationLocation||"").match(/Mouse MAC:\s*((?:[0-9A-F]{2}:){5}[0-9A-F]{2})/i)?.[1]);
const areaFromRecord = (d:Device) => {
 const raw=String(d.notes||d.location||d.installationLocation||"");
 const m=raw.match(/Installation area:\s*(.*?)\.\s*SmartLife AP:/i);
 return m?m[1].trim():(raw&&raw!=="BK7231N-MOUSE-V1"?raw:"");
};
const fmt=(date?:string|null)=>date?new Date(date).toLocaleString("en-GB"):"Never";
const validAp=(o:Observation)=>/^SmartLife-|^OpenBK/i.test(String(o.hostname||""))&&/^([0-9A-F]{2}:){5}[0-9A-F]{2}$/.test(normalizeMac(o.macAddress))&&String(o.hardwareKey||"").startsWith("wifi-ap:");
export default function FreshSmartCheck(){
 const {toast}=useToast();
 const [branches,setBranches]=useState<Branch[]>([]);
 const [devices,setDevices]=useState<Device[]>([]);
 const [observations,setObservations]=useState<Observation[]>([]);
 const [scan,setScan]=useState<Scan|null>(null);
 const [selected,setSelected]=useState("");
 const [branchId,setBranchId]=useState("");
 const [branchSearch,setBranchSearch]=useState("");
 const [deviceName,setDeviceName]=useState("");
 const [location,setLocation]=useState("");
 const [wifiName,setWifiName]=useState("");
 const [notes,setNotes]=useState("");
 const [busy,setBusy]=useState(false);
 const [refreshing,setRefreshing]=useState(false);
 const [initialized,setInitialized]=useState(false);
 const [error,setError]=useState("");
 const [diagnosis,setDiagnosis]=useState<Diagnosis|null>(null);
 const [checking,setChecking]=useState(false);
 const [refreshedAt,setRefreshedAt]=useState<string|null>(null);

 const refresh=useCallback(async()=>{
  setRefreshing(true);
  try{
   const [o,b,d,n]=await Promise.all([
    fetch("/api/iot/device-check",{credentials:"include",cache:"no-store"}),
    fetch("/api/branches?page=1&limit=5000",{credentials:"include",cache:"no-store"}),
    fetch("/api/iot/devices",{credentials:"include",cache:"no-store"}),
    fetch("/api/iot/router-wifi-networks",{credentials:"include",cache:"no-store"})
   ]);
   if(!o.ok||!b.ok||!d.ok)throw Error("Mouse discovery, device records or restaurant list unavailable.");
   const [obs,br,dv]=await Promise.all([o.json(),b.json(),d.json()]);
   const seen=new Set<string>();
   const fresh=(Array.isArray(obs)?obs:[] as Observation[])
    .filter((x:Observation)=>validAp(x))
    .sort((x:Observation,y:Observation)=>Date.parse(y.lastSeenAt||"")-Date.parse(x.lastSeenAt||""))
    .filter((x:Observation)=>{const mac=normalizeMac(x.macAddress);if(seen.has(mac))return false;seen.add(mac);return true;});
   const registered=Array.isArray(dv)?dv as Device[]:[];
   setObservations(fresh);
   setBranches(Array.isArray(br?.branches)?br.branches:[]);
   setDevices(registered);
   setScan(n.ok?await n.json():null);
   setSelected(previous=>{
    if(previous)return previous;
    const recent=fresh.find((x:Observation)=>x.isWifiRecentlySeen);
    if(recent)return "ap:"+normalizeMac(recent.macAddress);
    const known=registered.find(x=>/mouse\s*#?\s*11\b/i.test(x.deviceName||""))||registered.find(x=>macFromRecord(x));
    return known?"saved:"+known.id:"";
   });
   setRefreshedAt(new Date().toLocaleTimeString("en-GB"));
   setError("");
  }catch(e:any){setError(String(e?.message||e));}
  finally{setRefreshing(false);setInitialized(true)}
 },[]);
 useEffect(()=>{void refresh();const timer=window.setInterval(()=>void refresh(),15000);return()=>window.clearInterval(timer)},[refresh]);

 const selectedDeviceId=selected.startsWith("saved:")?selected.slice(6):"";
 const selectedMac=selected.startsWith("ap:")?normalizeMac(selected.slice(3)):macFromRecord(devices.find(d=>d.id===selectedDeviceId)||{id:""});
 const observation=observations.find(o=>normalizeMac(o.macAddress)===selectedMac)||null;
 const registered=selectedDeviceId
  ?devices.find(d=>d.id===selectedDeviceId)
  :devices.find(d=>selectedMac&&macFromRecord(d)===selectedMac);
 const label=registered?.deviceName||observation?.hostname||"Detected mouse";
 const nearWifi=useMemo(()=>{
  if(!scan?.fresh)return [] as Network[];
  const seen=new Set<string>();
  return (scan.networks||[]).filter(n=>n.frequency>=2400&&n.frequency<2500&&!/^(SmartLife-|OpenBK)/i.test(n.ssid))
    .sort((a,b)=>b.signal-a.signal)
    .filter(n=>{if(seen.has(n.ssid))return false;seen.add(n.ssid);return true;});
 },[scan]);
 const hasRecentMqtt=Boolean(registered?.isOnline&&registered.lastCheckedAt&&Date.now()-new Date(registered.lastCheckedAt).getTime()<180000);
 const battery=registered?.lastStatus?.find(x=>x.code==="battery_percentage")?.value;
 const mqttRssi=registered?.lastStatus?.find(x=>x.code==="rssi")?.value;

 // Change the form only when selecting another physical MAC or existing card,
 // never on a 15-second scanner refresh while the installer is typing.
 useEffect(()=>{
  const d=selectedDeviceId?devices.find(x=>x.id===selectedDeviceId):devices.find(x=>selected.startsWith("ap:")&&macFromRecord(x)===normalizeMac(selected.slice(3)));
  setDeviceName(d?.deviceName||"");
  setBranchId(d?.branchId||"");
  setLocation(d?areaFromRecord(d):"");
  setWifiName("");
  setNotes("");
  setBranchSearch("");
  setDiagnosis(null);
 // Selection changes are user-driven; devices must not reset an active form.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[selected]);

 const save=async()=>{
  if(!selected||!selectedMac){setError("Select a physical mouse with a confirmed MAC address first.");return;}
  if(!registered&&!observation?.isWifiRecentlySeen){setError("A newly registered mouse requires a recent physical HP2 sighting.");return;}
  if(!branchId||!deviceName.trim()){setError("Enter a mouse name and choose the restaurant.");return;}
  setBusy(true);setError("");
  try{
   const notesValue="Installation area: "+location.trim()+". SmartLife AP: "+(observation?.hostname||"Not currently broadcasting")+". Mouse MAC: "+selectedMac+". "+notes.trim();
   const existing=registered;
   const response=await fetch(existing?"/api/iot/devices/"+encodeURIComponent(existing.id):"/api/iot/devices",{
    method:existing?"PATCH":"POST",credentials:"include",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({deviceName:deviceName.trim(),branchId,deviceId:existing?.deviceId||"",hardwareModel:"BK7231N-MOUSE-V1",notes:notesValue})
   });
   const data=await response.json().catch(()=>({}));
   if(!response.ok)throw Error(data.message||"Could not save mouse registration.");
   toast({title:"Mouse and restaurant saved",description:"The selected MAC and restaurant were recorded. Physical Wi-Fi and MQTT are not yet confirmed."});
   await refresh();
  }catch(e:any){setError(String(e?.message||e))}
  finally{setBusy(false)}
 };
 const diagnose=async()=>{
  if(!selectedMac){setError("Choose a detected mouse MAC before diagnosing.");return;}
  setChecking(true);setError("");
  try{
   const params=new URLSearchParams({mac:selectedMac});
   if(registered?.deviceId)params.set("deviceId",registered.deviceId);
   const response=await fetch("/api/iot/provisioning-readiness?"+params,{credentials:"include",cache:"no-store"});
   const data=await response.json();
   if(!response.ok)throw Error(data.message||"Connection diagnosis failed.");
   setDiagnosis(data);
  }catch(e:any){setError(String(e?.message||e))}
  finally{setChecking(false)}
 };
 const available=branches.filter(b=>b.name.toLowerCase().includes(branchSearch.toLowerCase())||b.id===branchId);
 const selectedOptionPresent=Boolean(selected)&&
  (selected.startsWith("ap:")?observations.some(o=>normalizeMac(o.macAddress)===selectedMac):devices.some(d=>d.id===selectedDeviceId));
 const otherRegistered=devices.filter(d=>d.id!==registered?.id);

 return <main className="mx-auto max-w-5xl space-y-5 text-white">
  <header className="rounded-2xl border border-cyan-500/30 bg-slate-900/80 p-5">
   <div className="flex flex-wrap items-center justify-between gap-3">
    <div><h2 className="text-2xl font-bold">Smart Check · Mouse Installation</h2><p className="mt-1 text-sm text-slate-300">One physical mouse at a time · HP2 identity → restaurant → Wi-Fi → verified MQTT</p></div>
    <button type="button" disabled={refreshing} onClick={()=>void refresh()} className="flex items-center gap-2 rounded-xl bg-cyan-700 px-4 py-3 font-semibold disabled:opacity-60"><RefreshCw size={17} className={refreshing?"animate-spin":""}/>{refreshing?"Refreshing":"Refresh"}</button>
   </div>
   <p className="mt-2 text-xs text-cyan-200" role="status">{refreshedAt?"Last website refresh: "+refreshedAt+" · HP2 sightings are separately timestamped.":"Loading physical scanner records..."}</p>
  </header>
  {!initialized?<p role="status" className="rounded-xl bg-slate-900 p-5">Loading registered mice and physical HP2 observations…</p>:null}
  {error&&<p role="alert" className="rounded-xl border border-red-500/40 bg-red-950/60 p-4 text-sm text-red-100">{error}</p>}
  <section className="space-y-5 rounded-2xl border border-cyan-500/30 bg-slate-900/80 p-5">
   <div className="space-y-2">
    <h3 className="text-lg font-semibold">1 · Select physical mouse (HP2 discovery)</h3>
    <select aria-label="Select detected or registered physical mouse" className={input} value={selected} onChange={e=>setSelected(e.target.value)}>
     <option value="">Choose a physical mouse</option>
     {!selectedOptionPresent&&selected&&<option value={selected}>Previously selected mouse (not in current list)</option>}
     {observations.map(o=>{
      const mac=normalizeMac(o.macAddress);
      const assigned=devices.find(d=>macFromRecord(d)===mac);
      return <option key={mac} value={"ap:"+mac}>{o.isWifiRecentlySeen?"📡 Recent":"Historical"} · {assigned?.deviceName||o.hostname||"Mouse"} · {mac}{assigned?.deviceId?" · "+assigned.deviceId:""}</option>;
     })}
     {devices.filter(d=>!observations.some(o=>macFromRecord(d)&&macFromRecord(d)===normalizeMac(o.macAddress))).map(d=>
      <option key={d.id} value={"saved:"+d.id}>Saved · {d.deviceName||d.deviceId} · {d.deviceId||"No ID"}{macFromRecord(d)?" · "+macFromRecord(d):" · MAC not recorded"}</option>
     )}
    </select>
    <p className="text-xs text-slate-400">Detected SmartLife/OpenBK pairing networks use the physical MAC. Selecting another mouse will not reuse Mouse #11's ID or create a duplicate record.</p>
   </div>
   {selected&&<div className="space-y-5">
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
     <div className="rounded-xl bg-slate-950 p-3"><p className="text-xs text-slate-400">Physical Wi-Fi ID</p><strong>{observation?.hostname||"Not broadcasting now"}</strong></div>
     <div className="rounded-xl bg-slate-950 p-3"><p className="text-xs text-slate-400">Physical MAC</p><strong className="break-all font-mono text-sm">{selectedMac||"Not recorded"}</strong></div>
     <div className="rounded-xl bg-slate-950 p-3"><p className="text-xs text-slate-400">Saved Food Safety ID</p><strong className="font-mono text-sm">{registered?.deviceId||"Not registered"}</strong></div>
     <div className="rounded-xl bg-slate-950 p-3"><p className="text-xs text-slate-400">HP2 pairing signal</p><strong>{observation?.isWifiRecentlySeen?"Detected recently":observation?"Historical only":"Not observed"}{observation?.wifiSignalPercent!=null?" · "+observation.wifiSignalPercent+"%":""}</strong></div>
    </div>
    <p className="text-xs text-slate-400">Last physical HP2 signal: {fmt(observation?.lastSeenAt)}. Pairing AP detection does not prove that the mouse has joined restaurant Wi-Fi.</p>

    <div className="space-y-3 border-t border-slate-700 pt-5">
     <h3 className="text-lg font-semibold">2 · Restaurant / Branch and device identity</h3>
     <div className="grid gap-3 md:grid-cols-2">
      <label className="space-y-1 text-sm">Mouse name<input className={input} value={deviceName} onChange={e=>setDeviceName(e.target.value)} placeholder="e.g. Mouse 12" maxLength={120}/></label>
      <label className="space-y-1 text-sm">Installation area<input className={input} value={location} onChange={e=>setLocation(e.target.value)} placeholder="Kitchen area"/></label>
      <label className="space-y-1 text-sm">Search restaurant<div className="relative"><Search size={16} className="absolute left-3 top-4 text-slate-400"/><input className={input+" pl-9"} value={branchSearch} onChange={e=>setBranchSearch(e.target.value)} placeholder="Addis Restaurant or another branch"/></div></label>
      <label className="space-y-1 text-sm">Assign to restaurant<select className={input} value={branchId} onChange={e=>setBranchId(e.target.value)}><option value="">Select registered restaurant</option>{available.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></label>
     </div>
     <label className="block space-y-1 text-sm">Internal notes (optional)<textarea rows={2} className={input} value={notes} onChange={e=>setNotes(e.target.value)}/></label>
     <button type="button" onClick={()=>void save()} disabled={busy||!branchId||!selectedMac||(!registered&&!observation?.isWifiRecentlySeen)} className="rounded-lg bg-cyan-600 px-5 py-3 font-semibold disabled:opacity-40">{busy?"Saving...":registered?"Save Existing Mouse / Branch":"Register This Detected Mouse"}</button>
     {registered&&<p className="text-xs text-cyan-200">Saved record: {registered.deviceName||label} · {registered.deviceId} · {branches.find(b=>b.id===registered.branchId)?.name||"Unassigned"}. Saving updates this record; it does not register a second mouse.</p>}
    </div>
    <div className="space-y-3 border-t border-slate-700 pt-5">
     <h3 className="text-lg font-semibold">3 · Nearby restaurant 2.4 GHz Wi-Fi</h3>
     <select className={input} value={wifiName} onChange={e=>setWifiName(e.target.value)}><option value="">Select nearby Wi-Fi (if scanned by HP2)</option>{nearWifi.map(n=><option key={n.ssid} value={n.ssid}>{n.ssid} · {n.signal}%</option>)}</select>
     <input className={input} value={wifiName} onChange={e=>setWifiName(e.target.value)} placeholder="Or enter restaurant Wi-Fi SSID manually"/>
     <p className="text-xs text-slate-400">{scan?.fresh?"Recent HP2 router scan: "+fmt(scan.reportedAt):"No recent HP2 router Wi-Fi scan. This does not mean the physical mouse is offline."}</p>
     <label className="block space-y-1 text-sm text-slate-300">Wi-Fi password<input disabled type="password" autoComplete="off" placeholder="Locked — no verified physical provisioning protocol" className={input+" cursor-not-allowed opacity-60"}/></label>
     <p className="rounded-lg border border-amber-600/40 bg-amber-950/30 p-3 text-sm text-amber-100"><strong>Wi-Fi credentials cannot be sent yet.</strong> HP2 sees the pairing AP, but we have not verified compatible provisioning firmware/protocol on this physical mouse. The website cannot securely configure stock Tuya firmware using only its SSID/MAC. No password is collected or saved.</p>
     <button type="button" disabled className="cursor-not-allowed rounded-lg bg-slate-700 px-5 py-3 font-semibold opacity-60">Connect to restaurant Wi-Fi · Hardware provisioning unavailable</button>
    </div>
    <div className="space-y-3 border-t border-slate-700 pt-5">
     <h3 className="text-lg font-semibold">4 · Connection, battery and catch-sensor evidence</h3>
     <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-lg bg-slate-950 p-3"><p className="text-xs text-slate-400">MQTT</p><strong>{hasRecentMqtt?"🟢 Connected (recent report)":"Not connected / not verified"}</strong></div>
      <div className="rounded-lg bg-slate-950 p-3"><p className="text-xs text-slate-400">Battery</p><strong>{battery==null?"Not reported":String(battery)+"% · last report"}</strong></div>
      <div className="rounded-lg bg-slate-950 p-3"><p className="text-xs text-slate-400">Catch sensor</p><strong>{registered?.alarmActive?"Active recorded catch alarm":"No verified active alarm"}</strong></div>
      <div className="rounded-lg bg-slate-950 p-3"><p className="text-xs text-slate-400">MQTT RSSI</p><strong>{mqttRssi==null?"Not reported":String(mqttRssi)}</strong></div>
     </div>
     <p className="text-xs text-slate-400">Last authenticated device report: {fmt(registered?.lastCheckedAt)}. A Wi-Fi AP signal is not battery data and does not trigger a catch alarm.</p>
     <button type="button" disabled={checking||!selectedMac} onClick={()=>void diagnose()} className="rounded-lg border border-cyan-500/40 bg-cyan-900/60 px-5 py-3 font-semibold disabled:opacity-50">{checking?"Checking…":"Check missing connection stages"}</button>
     {diagnosis&&<div role="status" className="space-y-2 rounded-xl border border-amber-600/30 bg-slate-950 p-4 text-sm">
      <p>Physical HP2 pairing AP: <strong>{diagnosis.apRecentlySeen?"Detected recently":"No recent signal"}{diagnosis.apSignal!=null?" · "+diagnosis.apSignal+"%":""}</strong></p>
      <p>Registered identity: <strong>{diagnosis.deviceRegistered?diagnosis.deviceId:"Not linked to a verified MAC"}</strong></p>
      <p>Restaurant: <strong>{diagnosis.branchAssigned?"Assigned":"Not assigned"}</strong></p>
      <p>Restaurant network scanner: <strong>{diagnosis.routerScanFresh?"Recent scan":"No recent scan"}</strong></p>
      <p>Actual MQTT report: <strong>{diagnosis.mqttRecentlyReceived?"Received recently":"Not received recently"}</strong></p>
      <p>Physical Wi-Fi provisioning: <strong>{diagnosis.provisioningSupported?"Supported":"Not implemented/verified"}</strong></p>
      <p className="border-t border-slate-700 pt-2 text-amber-200">{diagnosis.reason}</p>
     </div>}
    </div>
   </div>}
   {!selected&&initialized&&<p className="rounded-lg bg-slate-950 p-4 text-slate-300">Switch on a mouse near HP2 and choose its actual SmartLife/OpenBK ID and MAC from the selector above. Previously saved mice can also be selected.</p>}
  </section>
  {otherRegistered.length>0&&<section className="rounded-2xl border border-slate-700 bg-slate-900/75 p-4">
   <h3 className="mb-2 font-semibold">Other registered mouse records (not duplicated cards)</h3>
   <div className="flex flex-wrap gap-2">{otherRegistered.map(d=><button type="button" key={d.id} onClick={()=>{setSelected("saved:"+d.id);window.scrollTo({top:0,behavior:"smooth"})}} className="rounded-lg border border-slate-600 bg-slate-950 p-3 text-left text-sm">{d.deviceName||d.deviceId} · {d.deviceId} · {d.branchName||branches.find(b=>b.id===d.branchId)?.name||"Unassigned"}</button>)}</div>
  </section>}
  <p className="text-xs text-slate-400"><Wifi size={14} className="mr-1 inline"/>HP2 detects pairing broadcasts; <WifiOff size={14} className="mr-1 inline"/>not seeing a broadcast does not prove power is OFF. Mouse ID, physical Wi-Fi provisioning and MQTT are independently verified.</p>
 </main>;
}