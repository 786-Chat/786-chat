import { useEffect, useState } from "react";
import { ownedMouseReadings } from "@/lib/ownedMouseReadings";

export default function NewBranchOwnedPanel({ mode }: { mode: "devices" | "alerts" }) {
  const [devices,setDevices]=useState<any[]>([]);
  const [alerts,setAlerts]=useState<any[]>([]);
  const [instructions,setInstructions]=useState<any[]>([]);
  const [error,setError]=useState("");
  const load=async()=>{
    try {
      const path=mode==="devices"?"/api/branch/iot-devices?refresh=1":"/api/branch/iot-alarms?refresh=1";
      const res=await fetch(path,{credentials:"include",cache:"no-store"});
      if(!res.ok) throw new Error("Branch device API returned HTTP "+res.status);
      const data=await res.json();
      if(mode==="devices")setDevices(Array.isArray(data)?data:[]);
      else setAlerts(Array.isArray(data)?data:[]);
      if(mode==="alerts") {
        const manual=await fetch("/api/branch/iot-manual-instructions",{credentials:"include",cache:"no-store"});
        if(manual.ok){const items=await manual.json();setInstructions(Array.isArray(items)?items:[]);}
      }
      setError("");
    }catch(e:any){setError(String(e?.message||e));}
  };
  useEffect(()=>{load();const timer=window.setInterval(load,15000);return()=>window.clearInterval(timer);},[mode]);
  return <section className="space-y-4">
    <header className="rounded-2xl border border-cyan-500/30 bg-slate-900/80 p-5 text-white">
      <h2 className="text-2xl font-bold">{mode==="devices"?"Smart Devices":"Device Alerts"}</h2>
      <p className="mt-1 text-sm text-slate-300">Saved restaurant mouse cards remain visible after pairing Wi-Fi stops. Live MQTT, battery and physical ON/OFF require genuine reports.</p>
      <button className="mt-3 rounded-xl border-b-4 border-cyan-950 bg-cyan-600 px-5 py-3 font-semibold text-white shadow-[0_6px_0_rgba(8,47,73,.7)] transition-all hover:-translate-y-0.5 active:translate-y-1 active:shadow-none" onClick={load}>Refresh</button>
    </header>
    {error && <p role="alert" className="rounded-lg bg-red-900/40 p-3 text-red-200">{error}</p>}
    {mode==="devices" ? (devices.length ? <div className="grid gap-4 md:grid-cols-2">{devices.map(d=>{
      const last=d.lastCheckedAt;
      const connected=Boolean(d.isOnline&&last&&Date.now()-new Date(last).getTime()<180000);
      const {batteryLabel,powerLabel,mqttSignalLabel,hasReport}=ownedMouseReadings(d.lastStatus,last);
      const hadReport=hasReport;
      const raw=String(d.notes||"");
      const locationMatch=raw.match(/Installation area:\s*(.*?)\.\s*SmartLife AP:/i);
      const area=locationMatch?locationMatch[1]:raw;
      const sighting=d.wifiSetupSighting as {ssid?:string;signalPercent?:number|null;lastSeenAt?:string|null;recentlySeen?:boolean}|null|undefined;
      return <article key={d.id||d.deviceId} className="space-y-3 rounded-2xl border border-cyan-500/25 bg-slate-950 p-5 text-white">
        <div className="flex items-start justify-between gap-2"><div><h3 className="font-bold">{d.deviceName||d.deviceId||"Registered mouse"}</h3><p className="text-xs text-cyan-200">{d.deviceId}</p><p className="mt-1 text-sm">{d.branchName||"This restaurant"}</p><p className="text-xs text-slate-400">📍 {area||"Installation area not set"}</p></div><span className={"rounded-full px-3 py-1 text-xs font-semibold "+(connected?"bg-emerald-900 text-emerald-200":"bg-slate-800 text-slate-300")}>{connected?"MQTT recently reported":hadReport?"No recent MQTT (may be sleeping)":"MQTT not verified"}</span></div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{([["BATTERY",batteryLabel],["POWER",powerLabel],["MQTT",connected?"Recently reported":hadReport?"No recent signal":"Not verified"],["TRAP",d.alarmActive?"Mouse caught (recorded)":connected?"No active alarm":"Not verified"]] as [string,string][]).map(([label,value])=><div key={label} className="rounded-lg bg-slate-800 p-3"><div className="text-xs text-slate-400">{label}</div><div className="mt-1 text-sm font-semibold">{value}</div></div>)}</div>
        {sighting&&<p className={"rounded-lg border p-2 text-xs "+(sighting.recentlySeen?"border-cyan-600/40 bg-cyan-950/30 text-cyan-100":"border-slate-700 bg-slate-900 text-slate-400")}>{sighting.recentlySeen?"HP2 saw a pairing Wi-Fi broadcast recently":"Historical HP2 pairing Wi-Fi sighting"}{sighting.signalPercent!=null?" · "+sighting.signalPercent+"% signal":""}{sighting.lastSeenAt?" · "+new Date(sighting.lastSeenAt).toLocaleString("en-GB"):""}. Matched by saved Wi-Fi name; not verified MQTT or device ownership.</p>}
        {mqttSignalLabel&&<p className="text-xs text-slate-300">MQTT-reported signal: {mqttSignalLabel}</p>}
        {hadReport&&last&&<p className="text-xs text-slate-400">Last authenticated device report: {new Date(last).toLocaleString("en-GB")}. Physical ON/OFF is not inferred from pairing Wi-Fi.</p>}
        {d.alarmActive&&<p className="rounded-lg bg-red-950 p-3 font-bold text-red-200">Mouse caught — active verified alert</p>}
      </article>;
    })}</div> : <p className="rounded-xl bg-slate-900/70 p-5 text-slate-300">No registered Food Safety mouse is assigned to this restaurant.</p>)
     : (alerts.length ? <div className="space-y-3">{alerts.map((a,i)=><article key={a.eventId||a.id||i} className="rounded-xl border border-red-500/40 bg-red-950/30 p-5 text-white">
       <strong className="text-red-200">Mouse caught — active alarm</strong>
       <p className="mt-1">{a.deviceName||a.friendlyName||a.deviceId||"Assigned mouse"}</p>
       <p className="mt-1 text-xs text-slate-300">{a.lastAlarmAt?new Date(a.lastAlarmAt).toLocaleString("en-GB"):"Event timestamp unavailable"}</p>
     </article>)}</div>:<p className="rounded-xl bg-slate-900/70 p-5 text-slate-300">No active verified mouse-caught alarms.</p>)}
    {mode==="alerts"&&<section className="space-y-3 rounded-xl border border-cyan-500/30 bg-slate-900/75 p-5"><h3 className="text-lg font-bold text-white">Instructions from Pest Controller</h3>{instructions.length===0?<p className="text-sm text-slate-400">No manual instructions received.</p>:instructions.map(m=><article key={m.id} className="rounded-lg bg-slate-950 p-4 text-white"><strong>{m.friendly_name||m.device_id}</strong><p className="mt-1 text-sm font-semibold text-cyan-200">{m.instruction}</p><p className="mt-1">{m.message}</p><p className="mt-2 text-xs text-slate-400">Manual message · {new Date(m.created_at).toLocaleString("en-GB")} · Reported mice: {m.mice_count}</p></article>)}</section>}
  </section>;
}
