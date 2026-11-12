import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RefreshCw, Pencil, Trash2, Wifi, ArrowRight, RadioTower } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Observation = {
 id:string; hardwareKey:string; hostname?:string|null; macAddress?:string|null;
 wifiSignalPercent?:number|null; lastSeenAt?:string|null; isWifiRecentlySeen?:boolean;
 wifiObservationSource?:string|null;
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
const factoryName=(d:Device)=>String(d.deviceName||"").match(/\b(?:SmartLife-[A-Z0-9]+|OpenBK[A-Z0-9_-]+)\b/i)?.[0]?.toLowerCase()||"";
const matchesSighting=(d:Device,mac:string,ssid:string)=>{
 const stored=savedMac(d);
 // An explicit mismatching MAC overrides a coincidental name match.
 if(stored&&stored!==mac)return false;
 return (Boolean(stored)&&stored===mac)||(Boolean(ssid)&&factoryName(d)===ssid.toLowerCase());
};
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
 const [,setBranchesLoaded]=useState(false);
 const [branchesLoading,setBranchesLoading]=useState(false);
 const [branchError,setBranchError]=useState("");
 const [wifiLoading,setWifiLoading]=useState(false);
 const [wifiMessage,setWifiMessage]=useState("");
 const [detectingMouse,setDetectingMouse]=useState(false);
 const [mouseMessage,setMouseMessage]=useState("");
 const [devicesLoaded,setDevicesLoaded]=useState(false);
 const [showPrevious,setShowPrevious]=useState(false);
 const [wifiName,setWifiName]=useState("");
 const [wifiPassword,setWifiPassword]=useState("");
 const [showWifiPassword,setShowWifiPassword]=useState(false);
 const [wifiListOpen,setWifiListOpen]=useState(false);
 const [wifiIsTyping,setWifiIsTyping]=useState(false);
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
 const branchesRequest=useRef(false);
 const wifiRequest=useRef(false);
 const wifiLastRequestAt=useRef(0);

 // Manual only: no useEffect, setInterval or background browser requests.
 // HP2 scans independently. Both Refresh and Detect read its saved reports.

 // Load each data source independently: a scanner error must not hide restaurants.
 const getJson=useCallback(async(path:string)=>{
  const response=await fetch(path,{credentials:"include",cache:"no-store"});
  if(!response.ok)throw Error("HTTP "+response.status);
  return response.json();
 },[]);
 const applyMouseReports=useCallback((value:unknown)=>{
  const data=Array.isArray(value)?(value as Observation[]).filter(mouseAp):[];
  setObservations(data);
  const verified=data.filter(x=>x.wifiObservationSource==="hp2-wifi-scan"&&x.lastSeenAt);
  const fresh=verified.filter(x=>x.isWifiRecentlySeen&&Date.now()-new Date(x.lastSeenAt!).getTime()>=0&&Date.now()-new Date(x.lastSeenAt!).getTime()<75000);
  setSelectedMac(prev=>verified.some(x=>normalizedMac(x.macAddress)===prev)?prev:fresh.length===1?normalizedMac(fresh[0].macAddress):"");
  setMouseMessage(fresh.length?fresh.length+" recent HP2 pairing Wi-Fi sighting(s) found.":verified.length?"No recent HP2 pairing signal. "+verified.length+" previous HP2 mouse AP(s) available for historical identification only.":"No HP2-scanned pairing AP available. A manual sighting is not proof of physical detection.");
 },[]);
 const applyBranches=useCallback((data:any)=>{
  if(!Array.isArray(data?.branches))throw Error("Invalid branch data");
  setBranches((data.branches as Branch[]).filter(x=>x?.id&&x?.name).sort((a,b)=>a.name.localeCompare(b.name)));
  setBranchesLoaded(true);
  setBranchError(data.branches.length?"":"No registered restaurants returned.");
 },[]);
 const loadBranches=async()=>{
  if(branchesRequest.current)return;
  branchesRequest.current=true;
  setBranchesLoading(true);
  try{applyBranches(await getJson("/api/branches?page=1&limit=5000"));}
  catch(e:any){setBranchError("Restaurant list unavailable ("+String(e?.message||e)+"). Press Refresh to retry.");}
  finally{branchesRequest.current=false;setBranchesLoading(false);}
 };
 const loadWifi=async()=>{
  // Focus and click may both fire: read the last HP2 scan only once per interaction.
  if(wifiRequest.current||Date.now()-wifiLastRequestAt.current<1500)return;
  wifiRequest.current=true;
  wifiLastRequestAt.current=Date.now();
  setWifiLoading(true);
  try{
   const n=await getJson("/api/iot/router-wifi-networks") as Scan;
   setScan(n);
   setWifiMessage(n.fresh?"HP2 reported nearby Wi-Fi"+(n.reportedAt?" · "+when(n.reportedAt):"")+".":"No recent Wi-Fi scan from HP2. The local Windows/Ubuntu scanner must be running; the website cannot scan PC Wi-Fi radios.");
  }catch(e:any){setScan(null);setWifiMessage("HP2 scanner report unavailable ("+String(e?.message||e)+"). You can type the Wi-Fi name manually.");}
  finally{wifiRequest.current=false;setWifiLoading(false);}
 };
 const detectMouse=async()=>{
  if(detectingMouse)return;
  setDetectingMouse(true);
  try{applyMouseReports(await getJson("/api/iot/device-check"));}
  catch(e:any){setMouseMessage("HP2 detection unavailable ("+String(e?.message||e)+").");setObservations([]);}
  finally{setDetectingMouse(false);}
 };
 const refresh=useCallback(async()=>{
  setRefreshing(true);
  const [o,b,d,n]=await Promise.allSettled([
   getJson("/api/iot/device-check"),getJson("/api/branches?page=1&limit=5000"),
   getJson("/api/iot/devices"),getJson("/api/iot/router-wifi-networks")
  ]);
  if(o.status==="fulfilled")applyMouseReports(o.value);
  else setMouseMessage("HP2 pairing scan unavailable.");
  if(b.status==="fulfilled"){try{applyBranches(b.value);}catch(e:any){setBranchError("Bad restaurant response.");}}
  else setBranchError("Restaurant list unavailable; click to retry.");
  if(d.status==="fulfilled"&&Array.isArray(d.value)){setDevices(d.value);setDevicesLoaded(true);setError("");}
  else setError("Registered mouse list unavailable; other sections can still load.");
  if(n.status==="fulfilled"){
   setScan(n.value as Scan);setWifiMessage(n.value?.fresh?"Latest HP2 Wi-Fi scan received.":"No recent 2.4 GHz scan from HP2.");
  }else setWifiMessage("HP2 router scan unavailable. Wi-Fi name can be entered manually.");
  setRefreshedAt(new Date().toLocaleTimeString("en-GB"));
  setRefreshing(false);
 },[getJson,applyMouseReports,applyBranches]);
 // Initial restaurant and saved-card data is loaded once without polling the HP2 scanner.
 useEffect(()=>{
  void loadBranches();
  void getJson("/api/iot/devices").then(value=>{
   if(Array.isArray(value)){setDevices(value);setDevicesLoaded(true);}
   else setError("Saved mouse records were returned in an unexpected format.");
  }).catch(()=>setError("Registered mouse cards unavailable; press Refresh to retry."));
  // This mount-only effect never refreshes HP2 mouse reports or router scans.
  // eslint-disable-next-line react-hooks/exhaustive-deps
 },[]);
 // No timer: Refresh, Wi-Fi selection and Detect mouse act only on user clicks.
 const nearbyWifi=useMemo(()=>{
  if(!scan?.fresh)return [] as Network[];
  const strongest=new Map<string,Network>();
  for(const n of scan.networks||[]){
   // Pairing APs are mouse identity, not the restaurant/home router selection.
   if(!n?.ssid?.trim()||/^(SmartLife-|OpenBK)/i.test(n.ssid)||!Number.isFinite(n.frequency)||
      n.frequency<2400||n.frequency>5900)continue;
   const band=n.frequency<2500?"2.4":"5";
   const key=n.ssid+"|"+band;
   if(!strongest.has(key)||strongest.get(key)!.signal<n.signal)strongest.set(key,n);
  }
  return [...strongest.values()].sort((a,b)=>(a.frequency<2500?0:1)-(b.frequency<2500?0:1)||b.signal-a.signal||a.ssid.localeCompare(b.ssid));
 },[scan]);
 const recordedMice=useMemo(()=>observations.filter(o=>o.wifiObservationSource==="hp2-wifi-scan"&&o.macAddress&&o.lastSeenAt).sort((a,b)=>new Date(b.lastSeenAt!).getTime()-new Date(a.lastSeenAt!).getTime()),[observations]);
 const currentMice=recordedMice.filter(o=>o.isWifiRecentlySeen&&Date.now()-new Date(o.lastSeenAt!).getTime()>=0&&Date.now()-new Date(o.lastSeenAt!).getTime()<75000);
 const selectableMice=[...currentMice,...recordedMice.filter(o=>!currentMice.some(x=>x.id===o.id))];
 const selected=selectableMice.find(o=>normalizedMac(o.macAddress)===selectedMac);
 const selectedIsRecent=Boolean(selected&&currentMice.some(o=>o.id===selected.id));
 const selectedRegisteredMatches=devices.filter(d=>Boolean(selectedMac)&&matchesSighting(d,selectedMac,String(selected?.hostname||"")));
 const selectedRegistered=selectedRegisteredMatches.length===1?selectedRegisteredMatches[0]:undefined;
 const selectedBranch=branches.find(b=>b.id===branchId);
 const editingSaved=editing?devices.find(d=>d.id===editing):null;
 const formValid=Boolean(branchId&&(wifiName.trim()||editingSaved)&&deviceName.trim()&&location.trim()&&(selected||(editingSaved&&savedMac(editingSaved)&&savedAp(editingSaved))));
 const resetForm=()=>{
  setDeviceName("");setLocation("");setNotes("");setSelectedMac("");setWifiName("");setWifiPassword("");setShowWifiPassword(false);setWifiListOpen(false);setWifiIsTyping(false);setEditing(null);
  setJustSaved(null);setError("");
 };
 const save=async()=>{
  const existing=editing?devices.find(d=>d.id===editing):selectedRegistered;
  if(!branchId||!deviceName.trim()||!location.trim()||(!editing&&!wifiName.trim())){
   setError("Choose a restaurant and its 2.4 GHz Wi-Fi, then enter mouse name and installation area.");return;
  }
  const detected=selected||(existing&&editing?{macAddress:savedMac(existing),hostname:savedAp(existing)}:null);
  if(!detected?.macAddress||!detected.hostname){
   setError("Choose an HP2-scanned mouse ID/MAC (recent or historical) before saving. The factory Wi-Fi name cannot reveal the mouse number.");return;
  }
  const mac=normalizedMac(detected.macAddress);
  const duplicate=devices.find(d=>matchesSighting(d,mac,String(detected.hostname))&&d.id!==existing?.id);
  if(selectedRegisteredMatches.length>1||duplicate){setError("An existing mouse card may already use this pairing identity. Open the saved mouse card; do not create a duplicate.");return;}
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
   setWifiPassword("");setShowWifiPassword(false);
   setJustSaved(mac);setShowPrevious(false);
   toast({title:"Mouse registration saved",description:"Saved to the selected restaurant. Wi-Fi/MQTT connection is NOT yet verified."});
   try{const newList=await getJson("/api/iot/devices");if(Array.isArray(newList)){setDevices(newList);setDevicesLoaded(true);}}
   catch{setError("Registration saved. Press Refresh to load its card.");}
  }catch(e:any){setError(String(e?.message||e));}
  finally{setBusy(false);}
 };
 // Transfer an observed mouse or a saved mouse registration to Smart Devices.
 // No Wi-Fi passwords, network credentials or claimed MQTT status in this handoff.
 const openSmartDevices=(known?:Device)=>{
  const ap=known?savedAp(known):selected?.hostname;
  const mac=known?savedMac(known):normalizedMac(selected?.macAddress);
  if(!ap||!/^([0-9A-F]{2}:){5}[0-9A-F]{2}$/.test(mac)){
   setError("Select a detected mouse or use Next on an existing saved card first.");
   return;
  }
  // Previous authenticated HP2 scans are identification evidence, never MQTT proof.
  if(!known&&(!selected||selected.wifiObservationSource!=="hp2-wifi-scan"||!selected.lastSeenAt)){
   setError("Choose a verified HP2 observation or a saved registration; physical connectivity is still unverified.");
   return;
  }
  try{
   window.sessionStorage.setItem("pest-smart-check-selected-v1",JSON.stringify({
    version:1,createdAt:Date.now(),ssid:ap,mac,
    branchId:known?.branchId||branchId,
    deviceName:known?.deviceName||deviceName.trim(),
    location:known?savedArea(known):location.trim(),
    wifiSsid:known?"":wifiName.trim(),
    savedDeviceId:known?.id||null
   }));
   setWifiPassword("");
   setError("");
   window.dispatchEvent(new Event("pest:open-owned-smart-devices"));
  }catch{
   setError("Could not open Smart Devices with this mouse. Please enable session storage and try again.");
  }
 };
 const edit=(d:Device)=>{
  const mac=savedMac(d);
  setEditing(d.id);setBranchId(d.branchId||"");setDeviceName(d.deviceName||"");
  setLocation(savedArea(d));setNotes("");setWifiName("");setWifiPassword("");setShowWifiPassword(false);setWifiListOpen(false);setWifiIsTyping(false);setSelectedMac(mac);
  setJustSaved(null);window.scrollTo({top:0,behavior:"smooth"});
 };
 const remove=async(d:Device)=>{
  if(!window.confirm("Delete registered mouse "+(d.deviceName||d.deviceId)+"? This affects saved monitoring data and cannot be undone."))return;
  setBusy(true);
  try{
   const r=await fetch("/api/iot/devices/"+encodeURIComponent(d.id),{method:"DELETE",credentials:"include"});
   if(!r.ok)throw Error((await r.json().catch(()=>({})))?.message||"Delete failed");
   toast({title:"Registration deleted"});await refresh();
  }catch(e:any){setError(String(e?.message||e));}finally{setBusy(false);}
 };
 return <main className="mx-auto w-full min-w-0 max-w-[1500px] space-y-5 text-white">
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
     <select className={input} value={branchId} disabled={branchesLoading && branches.length===0} onChange={e=>setBranchId(e.target.value)}>
      <option value="">{branchesLoading?"Loading restaurants...":"Choose registered restaurant"}</option>
      {branches.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
     </select>
     {branchError&&<p role="status" className="mt-2 text-sm text-amber-200">{branchError}</p>}
    </label>
    <div className="relative sm:col-span-2">
     <label htmlFor="mouse-install-wifi" className="mb-2 block font-semibold">2.4 GHz Wi-Fi — Restaurant / Home / Hotspot</label>
     <div className="relative">
      <input id="mouse-install-wifi" role="combobox" aria-controls="mouse-install-wifi-list"
       aria-expanded={wifiListOpen} aria-autocomplete="list" aria-haspopup="listbox"
       className={input+" pr-12"} placeholder="Tap to choose scanned Wi-Fi, or type its name"
       value={wifiName} autoComplete="off" name="restaurant-wifi-ssid" onFocus={()=>{setWifiListOpen(true);void loadWifi()}}
       // Focus already opens and loads this list; do not also fetch on click.
       onChange={e=>{setWifiName(e.target.value);setWifiPassword("");setShowWifiPassword(false);setWifiIsTyping(true);setWifiListOpen(true)}}
       onKeyDown={e=>{if(e.key==="Escape")setWifiListOpen(false)}}/>
      <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-cyan-200">▾</span>
     {wifiListOpen&&<div id="mouse-install-wifi-list" role="listbox" aria-label="Nearby local Wi-Fi (2.4 GHz selectable; 5 GHz informational)" className="absolute left-0 right-0 top-full z-30 mt-1 max-h-56 overflow-y-auto rounded-xl border border-slate-600 bg-slate-950 shadow-xl">
      {nearbyWifi.filter(n=>!wifiIsTyping||!wifiName||n.ssid.toLowerCase().includes(wifiName.toLowerCase())).map(n=>
       <button type="button" role="option" aria-selected={wifiName===n.ssid&&n.frequency<2500} aria-disabled={n.frequency>=2500} disabled={n.frequency>=2500} key={n.ssid+"|"+n.frequency} className="flex w-full items-center justify-between gap-3 border-b border-slate-800 px-4 py-3 text-left text-sm hover:bg-cyan-950 focus:bg-cyan-950 disabled:cursor-not-allowed disabled:opacity-50"
        onClick={()=>{setWifiName(n.ssid);setWifiPassword("");setShowWifiPassword(false);setWifiListOpen(false);setWifiIsTyping(false)}}>
        <span className="truncate font-semibold">{n.ssid}</span><span className="shrink-0 text-xs text-cyan-200">{n.signal}% · {n.frequency<2500?"2.4 GHz":"5 GHz (not compatible)"}</span>
       </button>)}
      {nearbyWifi.length===0&&<p role="status" className="p-4 text-sm text-amber-200">{wifiLoading?"Checking the latest HP2 scan report...":wifiMessage||"HP2 has not provided a fresh Wi-Fi scan. You may enter the SSID manually."}</p>}
      {nearbyWifi.length>0&&wifiIsTyping&&!nearbyWifi.some(n=>!wifiName||n.ssid.toLowerCase().includes(wifiName.toLowerCase()))&&<p className="p-4 text-sm text-slate-400">No scanned match. You can keep the Wi-Fi name you typed.</p>}
     </div>}
     </div>
     {wifiName.trim()&&<div className="mt-3 rounded-xl border border-slate-700 bg-slate-950 p-4">
      <label htmlFor="mouse-install-wifi-password" className="mb-2 block text-sm font-semibold">Wi-Fi password <span className="text-xs font-normal text-slate-400">(local form only)</span></label>
      <div className="flex gap-2">
       <input id="mouse-install-wifi-password" type={showWifiPassword?"text":"password"} autoComplete="new-password" spellCheck={false} className={input+" min-w-0 flex-1"} value={wifiPassword} onChange={e=>setWifiPassword(e.target.value)} placeholder="Password — not sent or saved"/>
       <button type="button" onClick={()=>setShowWifiPassword(x=>!x)} className="rounded-lg bg-slate-700 px-4 py-2 text-sm">{showWifiPassword?"Hide":"Show"}</button>
      </div>
      <p className="mt-2 text-xs text-amber-200">Physical Wi-Fi setup is not yet available on the BMAX W003. Do not enter a real password for installation yet. This field is local-only; its value is never sent to the server or mouse, and is cleared on Save. Saving registers a mouse, not its Wi-Fi connection.</p>
     </div>}
     {wifiMessage&&!wifiListOpen&&<p role="status" className="mt-2 text-xs text-slate-400">{wifiMessage}</p>}
    </div>
    <label><span className="mb-2 block font-semibold">Mouse number / Device name</span><input className={input} value={deviceName} onChange={e=>setDeviceName(e.target.value)} placeholder="e.g. Mouse #13" maxLength={120}/></label>
    <label><span className="mb-2 block font-semibold">Installation area</span><input className={input} value={location} onChange={e=>setLocation(e.target.value)} placeholder="Kitchen, storage room, etc." maxLength={120}/></label>
   </div>
   <div className="space-y-3 rounded-xl border border-cyan-600/30 bg-slate-950 p-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h4 className="font-bold">Find mouse from HP2 reports</h4><p className="mt-1 text-sm text-slate-300">Read HP2 scans. A mouse already set up in Smart Life does not need resetting just to use its previously recorded pairing identity.</p></div>
     <button type="button" disabled={detectingMouse||busy} onClick={()=>void detectMouse()} className="flex items-center gap-2 rounded-lg border border-cyan-500 bg-cyan-950 px-4 py-3 font-semibold text-cyan-100 disabled:opacity-50"><RadioTower size={16}/>{detectingMouse?"Checking HP2...":"Detect mouse"}</button>
    </div>
    <p className="text-xs text-slate-400">Detect mouse reads the latest saved HP2 report once. It does not start or repeatedly refresh HP2 scans. A SmartLife Wi-Fi name cannot reveal the mouse number—you enter that above.</p>
    <label className="block text-sm font-medium">Mouse Wi-Fi ID from HP2 — recent or historical
     <select className={"mt-2 "+input} value={selectableMice.some(o=>normalizedMac(o.macAddress)===selectedMac)?selectedMac:""} onChange={e=>setSelectedMac(e.target.value)}>
      <option value="">Choose an HP2-scanned mouse ID and MAC</option>
      {selectableMice.map(o=><option key={o.hardwareKey||o.id} value={normalizedMac(o.macAddress)}>{o.hostname} · {o.macAddress} · {currentMice.some(x=>x.id===o.id)?"RECENT":"HISTORICAL "+when(o.lastSeenAt)}</option>)}
     </select>
    </label>
    <div className="grid gap-3 sm:grid-cols-2">
     <div className="rounded-lg bg-slate-900 p-3"><p className="text-xs text-slate-400">{selectedIsRecent?"Recently scanned":"Last recorded"} mouse Wi-Fi ID</p><strong>{selected?.hostname||"Not detected / not selected"}</strong></div>
     <div className="rounded-lg bg-slate-900 p-3"><p className="text-xs text-slate-400">Mouse MAC / BSSID ({selectedIsRecent?"recent":"historical"})</p><strong className="font-mono text-sm">{selected?.macAddress||"Not detected / not selected"}</strong></div>
    </div>
     <p role="status" className="text-xs text-amber-200">{mouseMessage||"Press Detect mouse to load fresh HP2 Wi-Fi sightings."}</p>
     {selected&&!selectedIsRecent&&<p className="rounded-lg border border-amber-600/30 bg-amber-950/20 p-3 text-xs text-amber-100">Historical HP2 observation from {when(selected.lastSeenAt)}. This is a previously detected pairing Wi-Fi ID, not proof that the mouse is currently online, connected through Wi-Fi or MQTT, or catching mice. No reset is needed to reuse this record.</p>}
   </div>
   <div className="rounded-xl border border-slate-700 bg-slate-950 p-4">
    <h4 className="mb-3 font-semibold">Detected mouse information · real reports only</h4>
    <div className="grid gap-2 sm:grid-cols-3">{(()=>{
     const d=selectedRegistered;
     const hasReport=Boolean(d&&validReport(d));
     const bat=hasReport?reportedNumber(reportValue(d!,"battery_percentage")??d!.batteryPercent??d!.batteryPct,0,100):null;
     const rssi=hasReport?reportedNumber(reportValue(d!,"rssi")??d!.rssi,-120,0):null;
     const rows:[string,string][]=[
      ["Mouse Wi-Fi ID",selected?.hostname||"Not detected"],
      ["Mouse MAC",selected?.macAddress||"Not detected"],
      ["Pairing signal",selected?.wifiSignalPercent!=null?selected.wifiSignalPercent+"% ("+(selectedIsRecent?"recent":"historical "+when(selected.lastSeenAt))+" HP2 AP observation)":"Not reported"],
      ["Battery",bat==null?"Not reported by device":bat+"% (last authenticated report)"],
      ["Restaurant Wi-Fi",d&&liveMqtt(d)?"Device reports via MQTT; restaurant SSID unverified":"Not independently verified"],
      ["MQTT",d&&liveMqtt(d)?"Recent authenticated gateway report":hasReport?"Last gateway report is old":"No authenticated report"],
      ["MQTT signal",rssi==null?"No device RSSI reported":rssi+" dBm (last authenticated report)"],
      ["Last device report",hasReport?when(d!.lastCheckedAt):"No gateway report"],
      ["Trap",hasReport&&d?.alarmActive?"Recorded catch alarm":hasReport?"No active catch reported":"No verified catch event"]
     ];
     return rows.map(([name,value])=><div key={name} className="rounded-lg bg-slate-900 p-3"><p className="text-xs text-slate-400">{name}</p><p className="mt-1 text-sm font-semibold">{value}</p></div>);
    })()}</div>
    <p className="mt-2 text-xs text-slate-400">These six readings come only from authenticated physical device/gateway reports. An HP2 SmartLife pairing Wi-Fi sighting proves none of them. Battery and signal are last-reported values, not live sensor readings; router SSID requires separate device-side verification. No simulated battery, connection or catch readings are used.</p>
   </div>
   <label className="block"><span className="mb-2 block font-semibold">Internal notes</span><textarea rows={2} className={input} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Optional installation notes"/></label>
   {error&&<p role="alert" className="rounded-lg border border-red-500/40 bg-red-950/40 p-3 text-red-200">{error}</p>}
   {selectedBranch&&selected&&<p className="text-sm text-cyan-200">Ready to register <strong>{deviceName||"the named mouse"}</strong> at <strong>{selectedBranch.name}</strong> from {selectedIsRecent?"a recent":"a historical"} HP2 observation. This records identity and branch; it does not provision restaurant Wi-Fi.</p>}
   <div className="flex flex-wrap gap-3">
    <button type="button" disabled={busy||refreshing||!formValid} onClick={()=>void save()} className="rounded-xl bg-cyan-600 px-6 py-3 font-bold disabled:opacity-40">{busy?"Saving...":editing?"Save Changes":"Save Mouse Card"}</button>
    <button type="button" disabled={busy||refreshing||!(selected||editingSaved)} onClick={()=>openSmartDevices(editingSaved||undefined)}
     className="inline-flex items-center gap-2 rounded-xl border border-cyan-500 bg-cyan-950 px-5 py-3 font-bold text-cyan-100 disabled:cursor-not-allowed disabled:opacity-40"><ArrowRight size={17}/>NEXT → Smart Devices</button>
    {editing&&<button type="button" onClick={resetForm} className="rounded-xl border border-slate-600 px-5 py-3">Cancel edit</button>}
   </div>
  </section>
  <section className="space-y-4 rounded-2xl border border-slate-700 bg-slate-900/75 p-5">
   <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-xl font-bold">Registered Mouse Cards</h3><span className="text-xs text-slate-400">Real saved records · no simulated readings</span></div>
   {!devicesLoaded&&<p className="rounded-lg bg-slate-950 p-4 text-sm text-slate-300">Click Refresh to load saved records. Detect mouse only checks physical HP2 signals.</p>}
   {devicesLoaded&&devices.length===0&&<p className="rounded-lg bg-slate-950 p-4 text-slate-300">No saved mouse registrations.</p>}
   <p className="text-sm text-slate-300">Only the newly detected or saved mouse is shown here. Existing registrations stay in your records.</p>
   <button type="button" className="rounded-xl border border-slate-600 px-4 py-2 text-sm text-cyan-200" onClick={()=>setShowPrevious(p=>!p)}>{showPrevious?"Hide previous registrations":"Show previous registrations ("+devices.length+")"}</button>
   <div className="grid gap-4 md:grid-cols-2">{devices.filter(d=>showPrevious||(Boolean(justSaved)&&savedMac(d)===justSaved)||(Boolean(selectedMac)&&savedMac(d)===selectedMac)).map(d=>{
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
     <div className="border-t border-slate-800 pt-3"><button type="button" onClick={()=>openSmartDevices(d)} className="inline-flex items-center gap-2 rounded-lg border border-cyan-500 bg-cyan-950 px-4 py-2 text-sm font-semibold text-cyan-100"><ArrowRight size={16}/>NEXT → Smart Devices</button><p className="mt-2 text-xs text-slate-400">Open this saved registration without resetting or re-detecting the mouse. No Wi-Fi or MQTT activation happens here.</p></div>
    </article>;
   })}</div>
  </section>
 </main>;
}
