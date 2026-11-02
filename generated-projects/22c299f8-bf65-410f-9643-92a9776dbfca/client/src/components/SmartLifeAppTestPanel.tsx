import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, ArrowRight, Battery, BellRing, Cloud, Database, ExternalLink, Lock, Radio, RefreshCw, ShieldCheck, Smartphone, Wifi, Zap } from "lucide-react";

type Device = {
 deviceKey:string; name:string; source:string; battery:number|null;
 wifiSignalDbm:number|null; connection:string|null; caught:boolean|null;
 lastCaughtAt:string|null; lastReportedAt:string|null;
};
type Status = {
 bridgeConfigured:boolean; connected:boolean; latestReportAt:string|null;
 devices:Device[]; note:string;
};
const clock=(x:string|null)=>x?new Date(x).toLocaleString("en-GB"):"Not received";
const card="rounded-2xl border border-orange-500/30 bg-[#151827]/95 p-5 shadow-lg shadow-orange-950/15";
const statusText=(d:Device)=>{
 if(!d.lastReportedAt)return "Never reported";
 const age=Date.now()-new Date(d.lastReportedAt).getTime();
 if(!Number.isFinite(age)||age<0||age>=180000)return "Historical report only";
 return "Recent bridge report";
};
export default function SmartLifeAppTestPanel({mode}:{mode:"check"|"devices"}){
 const [data,setData]=useState<Status|null>(null);
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState("");
 const [filter,setFilter]=useState("");
 const [lastChecked,setLastChecked]=useState("");
 const refresh=useCallback(async()=>{
  setLoading(true);
  try{
   const response=await fetch("/api/admin/smartlife-app-test/status",{credentials:"include",cache:"no-store"});
   const result=await response.json().catch(()=>({}));
   if(!response.ok)throw Error(result.message||"Could not read Smart Life app test");
   setData(result as Status);setError("");setLastChecked(new Date().toLocaleTimeString("en-GB"));
  }catch(e:any){setError(String(e?.message||e))}
  finally{setLoading(false);}
 },[]);
 useEffect(()=>{void refresh()},[refresh]);
 const devices=data?.devices||[];
 const visible=useMemo(()=>devices.filter(d=>[d.name,d.deviceKey].some(v=>v.toLowerCase().includes(filter.toLowerCase()))),[devices,filter]);
 const online=Boolean(data?.connected);
 const ready=Boolean(data?.bridgeConfigured);
 const testMode=mode==="check";
 return <div className="mx-auto max-w-6xl space-y-5 text-white">
  <header className="overflow-hidden rounded-3xl border border-orange-400/40 bg-gradient-to-br from-[#43203f] via-[#1a223f] to-[#113b45] p-6 shadow-xl shadow-orange-900/20">
   <div className="flex flex-wrap items-center justify-between gap-4">
    <div className="flex items-center gap-3">
     <span className="rounded-2xl bg-orange-500/20 p-3 text-orange-200">{testMode?<Radio size={28}/>:<Database size={28}/>}</span>
     <div><div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-extrabold tracking-tight sm:text-2xl">{testMode?"SmartLife App Test Check":"SmartLife App Devices"}</h2><span className="rounded-full bg-orange-400 px-3 py-1 text-xs font-black text-slate-950">TEST ONLY</span></div>
      <p className="mt-1 text-sm text-orange-100/80">{testMode?"Check whether real Smart Life app events can reach Pest Control Admin.":"Read-only devices received through the independent Smart Life integration test."}</p></div>
    </div>
    <button type="button" onClick={()=>void refresh()} disabled={loading} className="inline-flex items-center gap-2 rounded-xl bg-orange-400 px-5 py-3 font-bold text-slate-950 hover:bg-orange-300 disabled:opacity-50"><RefreshCw size={17} className={loading?"animate-spin":""}/>{loading?"Checking...":"Check connection"}</button>
   </div>
   <div className="mt-5 grid gap-3 sm:grid-cols-3">
    {([
     ["Bridge authentication",ready?"Token configured":"Not configured"],
     ["Recent test report",online?"Received":"Not received"],
     ["Detected test devices",String(devices.length)]
    ] as [string,string][]).map(([label,value])=><div key={label} className="rounded-xl border border-orange-300/20 bg-slate-950/45 p-4"><p className="text-xs uppercase tracking-wider text-orange-100/65">{label}</p><p className="mt-1 text-lg font-bold">{value}</p></div>)}
   </div>
   <p role="status" className="mt-3 text-xs text-orange-100/70">Last checked: {lastChecked||"Not checked"} · Latest reported: {clock(data?.latestReportAt??null)} · No simulated readings</p>
  </header>

  {error&&<p role="alert" className="rounded-xl border border-red-500/50 bg-red-950/50 p-4 text-red-100">{error}</p>}
  {!ready&&<section className="rounded-2xl border border-amber-400/40 bg-amber-950/30 p-4 text-amber-100">
   <div className="flex items-start gap-3"><Lock className="mt-1 shrink-0" size={19}/><p><strong>Automatic connection is not installed yet.</strong> The test receiver is disabled until a separate, strong server-side bridge token and an authorised Home Assistant reporter are configured. The Smart Life mobile app does not send information directly to this web page.</p></div>
  </section>}
  {ready&&!online&&<section className="rounded-2xl border border-amber-400/40 bg-amber-950/30 p-4 text-amber-100">
   <p><strong>No recent authenticated report.</strong> A configured token does not mean the Smart Life account is linked. Pairing in Smart Life alone will not populate this test; the independent integration must relay supported device states.</p>
  </section>}

  {testMode&&<div className="grid gap-4 lg:grid-cols-2">
   <section className={card}>
    <h3 className="flex items-center gap-2 text-lg font-bold text-orange-200"><Smartphone size={21}/>Mouse #11 — Smart Life app test</h3>
    <div className="mt-4 space-y-4">
     {([
      ["1 · Pair on mobile","Add Mouse #11 to the Smart Life mobile app using the chosen restaurant 2.4 GHz Wi-Fi, if pairing succeeds."],
      ["2 · Authorise read access","Use Home Assistant's open-source Tuya integration with the Smart Life account and its QR-code authorisation. No separate Tuya Developer project is needed."],
      ["3 · Inspect genuine entities","Check whether Home Assistant exposes this specific mouse's battery, trap/caught state and connection status. Not every device function is supported."],
      ["4 · Forward verified reports","Configure an independent Home Assistant integration to send only supported observed states to the protected preview receiver. Click Check connection above to see them."]
     ] as [string,string][]).map(([title,desc])=><div key={title} className="border-l-2 border-orange-400/75 pl-4"><h4 className="font-semibold">{title}</h4><p className="mt-1 text-sm text-slate-300">{desc}</p></div>)}
    </div>
    <a target="_blank" rel="noopener noreferrer" href="https://www.home-assistant.io/integrations/tuya/" className="mt-4 inline-flex items-center gap-2 rounded-xl border border-orange-500/40 px-4 py-2 text-sm font-semibold text-orange-200 hover:bg-orange-900/30">Official Home Assistant Tuya instructions <ExternalLink size={15}/></a>
   </section>
   <section className={card}>
    <h3 className="flex items-center gap-2 text-lg font-bold text-teal-200"><ShieldCheck size={20}/>Safe automatic test</h3>
    <p className="mt-3 text-sm text-slate-300">This section is independent of the existing manual SmartLife Check and SmartLife Devices. Both stay unchanged. Existing branch/device data is not imported, overwritten, or reassigned.</p>
    <div className="mt-4 grid gap-3">
     <div className="rounded-xl border border-teal-600/30 bg-teal-950/30 p-3 text-sm"><strong>Real readings only.</strong> Battery percentage is shown only after an authorised Home Assistant report provides it.</div>
     <div className="rounded-xl border border-teal-600/30 bg-teal-950/30 p-3 text-sm"><strong>Catch events isolated.</strong> A real reported catch is visible on the test device card but does not alert a restaurant while in TEST mode.</div>
     <div className="rounded-xl border border-teal-600/30 bg-teal-950/30 p-3 text-sm"><strong>Removable.</strong> The new test pages and isolated test data can be removed without changing your manual SmartLife pages.</div>
    </div>
   </section>
  </div>}

  <section className={card}>
   <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-xl font-bold text-orange-200">{testMode?"Latest automatically reported devices":"Automatically Reported Smart Life App Devices"}</h3><p className="mt-1 text-xs text-slate-400">Only actual authenticated bridge reports. No copied manual registrations.</p></div>
    <div className="relative"><input className="w-full rounded-xl border border-orange-400/30 bg-[#0e1321] px-4 py-3 text-white placeholder:text-slate-500" value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Search Mouse #11 or device key" aria-label="Search test device reports"/></div>
   </div>
   {visible.length===0?<div className="mt-5 rounded-2xl border border-dashed border-orange-400/30 bg-slate-950/40 p-8 text-center"><Cloud className="mx-auto mb-2 text-orange-300" size={30}/><p className="font-semibold">No verified Smart Life app device reports yet</p><p className="mt-2 text-sm text-slate-400">Connecting the mouse in the mobile app does not automatically prove this separate test connection works. When a trusted bridge sends data, it will appear here.</p></div>:
    <div className="mt-5 grid gap-4 lg:grid-cols-2">{visible.map(d=><article key={d.deviceKey} className="rounded-2xl border border-orange-400/30 bg-[#0e1321] p-5">
     <div className="flex flex-wrap items-start justify-between gap-3"><div><h4 className="text-lg font-bold">{d.name}</h4><p className="mt-1 break-all font-mono text-xs text-orange-300">{d.deviceKey}</p></div><span className="rounded-full border border-teal-400/40 bg-teal-950/50 px-3 py-1 text-xs font-semibold text-teal-200">{statusText(d)}</span></div>
     <div className="mt-4 grid grid-cols-2 gap-3">{([
      [<Battery key="battery" size={16}/>, "Battery",d.battery===null?"Not reported":d.battery+"% (last report)"],
      [<Wifi key="wifi" size={16}/>, "Wi-Fi signal",d.wifiSignalDbm===null?"Not reported":d.wifiSignalDbm+" dBm"],
      [<Activity key="status" size={16}/>, "Device status",d.connection||"Not reported"],
      [<BellRing key="caught" size={16}/>, "Mouse caught",d.caught===null?"Not reported":d.caught?"YES — TEST ONLY":"No (reported)"],
      [<Zap key="last" size={16}/>, "Last received",clock(d.lastReportedAt)],
      [<Radio key="caughttime" size={16}/>, "Last caught",clock(d.lastCaughtAt)]
     ] as [React.ReactNode,string,string][]).map(([icon,name,value])=><div key={name} className="rounded-xl bg-slate-900/80 p-3 text-sm"><div className="flex items-center gap-2 text-xs text-orange-200">{icon}{name}</div><div className="mt-2 break-words font-semibold">{value}</div></div>)}</div>
     <p className="mt-3 text-xs text-slate-500">Source: {d.source} · No customer alarm is sent from test data.</p>
    </article>)}</div>}
  </section>
  <footer className="rounded-xl border border-teal-700/35 bg-teal-950/20 px-5 py-4 text-sm text-teal-100">The two new coloured test pages are independent and removable. Your existing manual SmartLife Check / SmartLife Devices continue unchanged. <ArrowRight size={15} className="ml-1 inline"/></footer>
 </div>;
}
