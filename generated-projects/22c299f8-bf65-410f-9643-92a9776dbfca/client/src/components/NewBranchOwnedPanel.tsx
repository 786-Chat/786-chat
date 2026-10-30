import { useEffect, useState } from "react";

export default function NewBranchOwnedPanel({ mode }: { mode: "devices" | "alerts" }) {
  const [devices,setDevices]=useState<any[]>([]);
  const [alerts,setAlerts]=useState<any[]>([]);
  const [error,setError]=useState("");
  const load=async()=>{
    try {
      const path=mode==="devices"?"/api/branch/iot-devices?refresh=1":"/api/branch/iot-alarms?refresh=1";
      const res=await fetch(path,{credentials:"include",cache:"no-store"});
      if(!res.ok) throw new Error("Branch device API returned HTTP "+res.status);
      const data=await res.json();
      if(mode==="devices")setDevices(Array.isArray(data)?data:[]);
      else setAlerts(Array.isArray(data)?data:[]);
      setError("");
    }catch(e:any){setError(String(e?.message||e));}
  };
  useEffect(()=>{load();const timer=window.setInterval(load,15000);return()=>window.clearInterval(timer);},[mode]);
  return <section className="space-y-4">
    <header className="rounded-2xl border border-cyan-500/30 bg-slate-900/80 p-5 text-white">
      <h2 className="text-2xl font-bold">{mode==="devices"?"Smart Devices":"Device Alerts"}</h2>
      <p className="mt-1 text-sm text-slate-300">Only verified events and devices assigned to this restaurant are shown.</p>
      <button className="mt-3 rounded-lg border border-cyan-600 px-4 py-2 text-sm text-cyan-200" onClick={load}>Refresh</button>
    </header>
    {error && <p role="alert" className="rounded-lg bg-red-900/40 p-3 text-red-200">{error}</p>}
    {mode==="devices" ? (devices.length ? <div className="grid gap-3 md:grid-cols-2">{devices.map(d=><article key={d.id||d.deviceId} className="rounded-xl border border-slate-700 bg-slate-900/75 p-4 text-white">
      <h3 className="font-semibold">{d.deviceName||d.friendlyName||d.deviceId||"Registered mouse"}</h3>
      <p className="text-xs text-slate-400">{d.deviceId||""}</p>
      <p className="mt-2 text-sm">{d.isOnline?"MQTT recently reported":"No recent verified MQTT signal"}</p>
      <p className={d.alarmActive?"mt-2 font-semibold text-red-300":"mt-2 text-slate-300"}>{d.alarmActive?"Mouse caught — active event":"No verified active alarm"}</p>
      <p className="mt-2 text-xs text-slate-400">Last report: {d.lastCheckedAt?new Date(d.lastCheckedAt).toLocaleString("en-GB"):"Not yet reported"}</p>
    </article>)}</div>:<p className="rounded-xl bg-slate-900/70 p-5 text-slate-300">No registered mice assigned to this branch.</p>)
     : (alerts.length ? <div className="space-y-3">{alerts.map((a,i)=><article key={a.eventId||a.id||i} className="rounded-xl border border-red-500/40 bg-red-950/30 p-5 text-white">
       <strong className="text-red-200">Mouse caught — active alarm</strong>
       <p className="mt-1">{a.deviceName||a.friendlyName||a.deviceId||"Assigned mouse"}</p>
       <p className="mt-1 text-xs text-slate-300">{a.lastAlarmAt?new Date(a.lastAlarmAt).toLocaleString("en-GB"):"Event timestamp unavailable"}</p>
     </article>)}</div>:<p className="rounded-xl bg-slate-900/70 p-5 text-slate-300">No active verified mouse-caught alarms.</p>)}
  </section>;
}
