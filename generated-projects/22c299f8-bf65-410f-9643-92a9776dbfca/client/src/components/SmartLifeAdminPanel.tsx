
import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, Battery, MapPin, RefreshCw, Save, Search, Shield, Smartphone, Wifi, Trash2 } from "lucide-react";

type Branch = {id: string; name: string};
type Device = {id: string; branchId: string; deviceCode: string; name: string;
  installationArea: string; connectionStatus: string; batteryPercent: number | null;
  trapStatus: string; signalDbm: number | null; notes: string; updatedAt: string; activeCaughtCount: number};
type Alert = { id:string; deviceId:string; deviceName:string; caughtCount:number;
  sentAt:string; acknowledgedAt:string | null; message:string; archivedAt?:string | null; archivedBy?:string | null; archiveNote?:string | null };
type FormDevice = {
  deviceCode:string; name:string; installationArea:string; batteryPercent:string;
  connectionStatus:string; trapStatus:string; signalDbm:string; notes:string;
};

// Admin-selected instructions; the actual alarm is only sent after explicit confirmation.
// No automatic Smart Life cloud messages or changes to Food Safety IoT records.
const smartLifeAlarmTemplates: {title:string; message:string}[] = [
  {
    "title": "Safe removal and reset",
    "message": "Mouse detected. Trained staff: turn off the trap if safe, wear gloves, dispose of the catch hygienically. Clean the area, close the trap, switch it on and return it to its original position."
  },
  {
    "title": "Kitchen hygiene",
    "message": "Kitchen alert: keep food and utensils away from the affected area. Ask trained staff to handle the catch safely, clean and sanitise the area, then reset the trap."
  },
  {
    "title": "Multiple mice caught",
    "message": "Multiple catches reported. Ask trained staff to follow the site's safe disposal and cleaning procedure. Reset the trap and report any further mouse activity."
  },
  {
    "title": "Contact pest controller",
    "message": "Please do not open or move the trap unless you are trained. Contact your pest controller to arrange safe removal, cleaning and resetting."
  },
  {
    "title": "Check the trap",
    "message": "Please check the trap safely. If a mouse is present, trained staff should follow the approved disposal and cleaning procedure before restarting the trap."
  },
  {
    "title": "Check surrounding area",
    "message": "Please inspect the surrounding area for further pest activity. Keep food preparation away from any affected surfaces and follow your site hygiene procedure."
  },
  {
    "title": "Clean and disinfect",
    "message": "After safe removal of the catch, clean and disinfect the affected area in line with your site procedure. Make sure the trap is secure and working."
  },
  {
    "title": "Return to original position",
    "message": "After servicing, close and restart the trap safely. Put it back in its original approved installation area. Do not relocate it without permission."
  },
  {
    "title": "Confirm work completed",
    "message": "Please confirm when the mouse has been dealt with safely, the area has been cleaned and the trap is correctly closed, restarted and back in place."
  },
  {
    "title": "Request technician visit",
    "message": "Pest controller attention requested. Please leave the trap in its designated location, avoid handling its contents and contact our team for assistance."
  }
];

const blank: FormDevice = {deviceCode:"SL-MOUSE-",name:"",installationArea:"",
  batteryPercent:"",connectionStatus:"unknown",trapStatus:"ready",signalDbm:"",notes:""};
const request = async (url:string, init?:RequestInit) => {
  const response = await fetch(url,{...init,credentials:"include",cache:"no-store"});
  const payload = await response.json().catch(()=>({}));
  if(!response.ok) throw new Error(payload.message || `Request failed (${response.status})`);
  return payload;
};
const nameFor = (connection:string) => connection==="connected"?"Connected":connection==="disconnected"?"Disconnected":"Not reported";
const timeFor = (value:string) => new Date(value).toLocaleString("en-GB");

export default function SmartLifeAdminPanel({mode}:{mode:"check"|"devices"}) {
  const loadSequence = useRef(0);
  const [branches,setBranches] = useState<Branch[]>([]);
  const [branchSearch,setBranchSearch] = useState("");
  const [branchId,setBranchId] = useState("");
  const [devices,setDevices] = useState<Device[]>([]);
  const [alerts,setAlerts] = useState<Alert[]>([]);
  const [archivedAlerts,setArchivedAlerts] = useState<Alert[]>([]);
  const [archiveConfirmId,setArchiveConfirmId] = useState<string | null>(null);
  const [deleteConfirmId,setDeleteConfirmId] = useState<string | null>(null);
  const [showArchived,setShowArchived] = useState(false);
  const [archiveNote,setArchiveNote] = useState("");
  const [form,setForm] = useState<FormDevice>(blank);
  const [editingId,setEditingId] = useState("");
  const [deviceFilter,setDeviceFilter] = useState("");
  const [alarmDevice,setAlarmDevice] = useState("");
  const [caughtCount,setCaughtCount] = useState(1);
  const [alarmMessage,setAlarmMessage] = useState("");
  const [confirmingAlarm,setConfirmingAlarm] = useState(false);
  const [selectedAlarmTemplate,setSelectedAlarmTemplate] = useState("");
  const [error,setError] = useState("");
  const [notice,setNotice] = useState("");
  const [busy,setBusy] = useState(false);
  const [loading,setLoading] = useState(true);
  const selectedBranch = branches.find(x=>x.id===branchId);
  useEffect(()=>{
    let mounted=true;
    (async()=>{
      try{
        const result=await request("/api/branches?page=1&limit=5000");
        if(mounted) setBranches((result.branches || []).filter((b:any)=>
          Boolean(b.id) && Boolean(b.name) && !String(b.name).startsWith("Available Branch "))
          .map((b:any)=>({id:String(b.id),name:String(b.name)})));
      }catch(err:any){if(mounted)setError(err?.message || "Unable to load branches");}
      finally {if(mounted)setLoading(false);}
    })();
    return()=>{mounted=false;};
  },[]);
  const load = async (id:string) => {
    const callId = ++loadSequence.current;
    if(!id){setDevices([]);setAlerts([]);setArchivedAlerts([]);return;}
    setLoading(true);setError("");
    try {
      const [deviceRows,alertRows,archivedRows]=await Promise.all([
        request(`/api/admin/smartlife/devices?branchId=${encodeURIComponent(id)}`),
        request(`/api/admin/smartlife/alerts?branchId=${encodeURIComponent(id)}`),
        request(`/api/admin/smartlife/alerts?branchId=${encodeURIComponent(id)}&archived=1`)
      ]);
      if (callId !== loadSequence.current) return;
      setDevices(Array.isArray(deviceRows) ? deviceRows : []);
      setAlerts(Array.isArray(alertRows) ? alertRows : []);
      setArchivedAlerts(Array.isArray(archivedRows) ? archivedRows : []);
    }catch(err:any){if(callId === loadSequence.current) setError(err?.message || "Unable to load SmartLife information");}
    finally{if(callId === loadSequence.current) setLoading(false);}
  };
  const chooseBranch=(id:string)=>{
    setBranchId(id);setEditingId("");setForm({...blank});setAlarmDevice("");
    setError("");setNotice("");setAlarmMessage("");setSelectedAlarmTemplate("");setConfirmingAlarm(false);setArchiveConfirmId(null);setDeleteConfirmId(null);setArchiveNote("");setShowArchived(false);void load(id);
  };
  const update=(key:keyof FormDevice,value:string)=>setForm(old=>({...old,[key]:value}));
  const edit=(d:Device)=>{
    setEditingId(d.id);
    setForm({deviceCode:d.deviceCode,name:d.name,installationArea:d.installationArea,
      batteryPercent:d.batteryPercent==null?"":String(d.batteryPercent),
      connectionStatus:d.connectionStatus,trapStatus:d.trapStatus,
      signalDbm:d.signalDbm==null?"":String(d.signalDbm),notes:d.notes||""});
    setNotice("");setError("");
    document.getElementById("smartlife-device-form")?.scrollIntoView({behavior:"smooth",block:"center"});
  };
  const submitDevice=async()=>{
    if(!branchId || busy)return;
    setBusy(true);setError("");setNotice("");
    try{
      const payload={
        ...form,branchId,
        batteryPercent:form.batteryPercent===""?null:Number(form.batteryPercent),
        signalDbm:form.signalDbm===""?null:Number(form.signalDbm)
      };
      await request(editingId
          ? `/api/admin/smartlife/devices/${encodeURIComponent(editingId)}`
          : "/api/admin/smartlife/devices",{
        method:editingId?"PATCH":"POST",
        headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)
      });
      setNotice(editingId?"Device updated.":"SmartLife device registered.");
      setEditingId("");setForm({...blank});
      await load(branchId);
    }catch(err:any){setError(err?.message || "Could not save device");}
    finally{setBusy(false);}
  };
  const archive=async(d:Device)=>{
    if(!window.confirm(`Archive ${d.name} (${d.deviceCode})? Previous alerts remain in history.`)) return;
    setBusy(true);setError("");setNotice("");
    try{
      await request(`/api/admin/smartlife/devices/${encodeURIComponent(d.id)}`,{method:"DELETE"});
      setNotice("Device archived; alert history preserved.");
      await load(branchId);
    }catch(err:any){setError(err?.message || "Could not archive device");}
    finally{setBusy(false);}
  };
  const sendAlarm=async()=>{
    if(!branchId || !alarmDevice || busy)return;
    if(!confirmingAlarm)return; // Only the in-page Confirm & Send button can submit.
    setBusy(true);setError("");setNotice("");
    try{
      await request("/api/admin/smartlife/alerts",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({branchId,deviceId:alarmDevice,caughtCount,message:alarmMessage})
      });
      setNotice(`Alarm sent to ${selectedBranch?.name || "selected restaurant"}. Customer will see it in SmartLife Alert.`);
      setAlarmMessage("");setSelectedAlarmTemplate("");setConfirmingAlarm(false);
      await load(branchId);
    }catch(err:any){setError(err?.message || "Alarm could not be sent");}
    finally{setBusy(false);}
  };

  // Archives only an acknowledged SmartLife alert for the selected branch.
  // The audit record remains available in Archived History and can be restored.
  const archiveSmartLifeAlert=async(id:string)=>{
    if(!branchId||busy)return;
    setBusy(true);setError("");setNotice("");
    try{
      await request(`/api/admin/smartlife/alerts/${encodeURIComponent(id)}/archive`,{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({branchId,archiveNote:archiveNote.trim()})
      });
      setArchiveConfirmId(null);setArchiveNote("");
      setNotice("Issue archived. The alert is hidden from the branch's active SmartLife Alert screen. The record remains in Archived History.");
      await load(branchId);
    }catch(err:any){setError(err?.message||"Unable to archive alert.");}
    finally{setBusy(false);}
  };
  const restoreSmartLifeAlert=async(id:string)=>{
    if(!branchId||busy)return;
    setBusy(true);setError("");setNotice("");
    try{
      await request(`/api/admin/smartlife/alerts/${encodeURIComponent(id)}/restore`,{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({branchId})
      });
      setNotice("Alert restored to active SmartLife history.");
      await load(branchId);
    }catch(err:any){setError(err?.message||"Unable to restore alert.");}
    finally{setBusy(false);}
  };
  // Remove one archived alert from this selected restaurant's visible history.
  // The server retains a private audit row; no physical mouse or other branch is modified.
  const deleteArchivedAlert=async(id:string)=>{
    if(!branchId||busy||deleteConfirmId!==id)return;
    setBusy(true);setError("");setNotice("");
    try{
      await request(`/api/admin/smartlife/alerts/${encodeURIComponent(id)}/delete`,{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({branchId})
      });
      setDeleteConfirmId(null);
      setNotice("Archived alert removed from this restaurant's visible history. Device and private audit are preserved.");
      await load(branchId);
    }catch(err:any){setError(err?.message||"Unable to remove archived entry.");}
    finally{setBusy(false);}
  };
  const matches=useMemo(()=>branches.filter(b=>b.name.toLowerCase().includes(branchSearch.trim().toLowerCase())),[branches,branchSearch]);
  const displayed=devices.filter(d=>[d?.name,d?.deviceCode,d?.installationArea].some(v=>String(v ?? "").toLowerCase().includes(deviceFilter.toLowerCase())));

  return (
    <div className="mx-auto max-w-6xl space-y-5 text-white">
      <div className="rounded-2xl border border-blue-500/30 bg-slate-900/70 p-5">
        <h2 className="flex items-center gap-2 text-2xl font-bold">
          {mode==="check"?<Smartphone className="h-6 w-6 text-cyan-300"/>:<Wifi className="h-6 w-6 text-cyan-300"/>}
          {mode==="check"?"SmartLife Check":"SmartLife Devices"}
        </h2>
        <p className="mt-1 text-sm text-slate-300">
          {mode==="check"
            ?"Register and manage SmartLife traps and send authorised alerts when a notification is received."
            :"View and update SmartLife device cards for the selected restaurant."}
        </p>
        <p className="mt-2 text-xs text-cyan-100">Separate from Food Safety IoT / HP2. Device information here is entered by Admin, not obtained through an automatic Smart Life cloud connection.</p>
      </div>

      <section className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5">
        <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold"><Search className="h-5 w-5 text-cyan-300"/>Select Restaurant / Branch</h3>
        <input aria-label="Search restaurant" placeholder="Search branch / shop" value={branchSearch}
          onChange={e=>setBranchSearch(e.target.value)}
          className="mb-3 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-white"/>
        <select aria-label="Select SmartLife branch" value={branchId} onChange={e=>chooseBranch(e.target.value)}
          className="w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-3 text-white">
          <option value="">Select customer branch…</option>
          {matches.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
          {branchId&&!matches.some(b=>b.id===branchId)&&selectedBranch&&<option value={branchId}>{selectedBranch.name}</option>}
        </select>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-300">
          {selectedBranch?<span>Selected: <strong className="text-white">{selectedBranch.name}</strong></span>:<span>Select a branch to manage its own SmartLife devices.</span>}
          {branchId&&<button onClick={()=>void load(branchId)} type="button" disabled={loading}
            className="inline-flex items-center gap-1 rounded-lg border border-cyan-600 px-3 py-1.5 text-cyan-200 hover:bg-cyan-900/30">
            <RefreshCw className="h-4 w-4"/>Refresh
          </button>}
        </div>
      </section>
      {error&&<p role="alert" className="rounded-lg border border-red-600 bg-red-950/40 p-3 text-sm text-red-200">{error}</p>}
      {notice&&<p role="status" className="rounded-lg border border-emerald-500 bg-emerald-950/40 p-3 text-sm text-emerald-200">{notice}</p>}
      {!branchId&&<div className="rounded-xl border border-slate-700 bg-slate-900/60 p-5 text-sm text-slate-300">Choose a restaurant above to continue. No other restaurant's data will appear.</div>}

      {branchId&&mode==="check"&&(
        <>
        <section id="smartlife-device-form" className="rounded-2xl border border-cyan-600/40 bg-slate-900/80 p-5">
          <h3 className="text-lg font-bold">{editingId?"Edit SmartLife Device":"Register New SmartLife Device"}</h3>
          <p className="mb-4 text-xs text-slate-400">Enter values from your own observations or Smart Life app. Use a separate SL- device ID (never reuse FS-MOUSE IDs).</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="text-xs text-slate-300">Unique SmartLife device ID
              <input aria-label="SmartLife device ID" value={form.deviceCode} onChange={e=>update("deviceCode",e.target.value.toUpperCase())}
                placeholder="SL-MOUSE-000001" className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-white"/>
            </label>
            <label className="text-xs text-slate-300">Device name
              <input aria-label="SmartLife device name" value={form.name} onChange={e=>update("name",e.target.value)}
                placeholder="Mouse 8 / Kitchen" className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-white"/>
            </label>
            <label className="text-xs text-slate-300">Installation area
              <input value={form.installationArea} onChange={e=>update("installationArea",e.target.value)}
                placeholder="Kitchen / Back Door" className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-white"/>
            </label>
            <label className="text-xs text-slate-300">Battery (%)
              <input type="number" min="0" max="100" value={form.batteryPercent} onChange={e=>update("batteryPercent",e.target.value)}
                placeholder="Leave empty if unknown" className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-white"/>
            </label>
            <label className="text-xs text-slate-300">Connection (last reported)
              <select value={form.connectionStatus} onChange={e=>update("connectionStatus",e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-white">
                <option value="unknown">Not reported</option><option value="connected">Connected</option>
                <option value="disconnected">Disconnected</option>
              </select>
            </label>
            <label className="text-xs text-slate-300">Trap condition
              <select value={form.trapStatus} onChange={e=>update("trapStatus",e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-white">
                <option value="ready">Ready</option><option value="caught">Mouse caught</option>
                <option value="service_required">Service required</option>
              </select>
            </label>
            <label className="text-xs text-slate-300">Wi-Fi signal (dBm, optional)
              <input type="number" min="-150" max="0" value={form.signalDbm} onChange={e=>update("signalDbm",e.target.value)}
                placeholder="e.g. -58" className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-white"/>
            </label>
            <label className="text-xs text-slate-300">Internal notes
              <input value={form.notes} onChange={e=>update("notes",e.target.value)}
                placeholder="Optional" className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-white"/>
            </label>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" disabled={busy} onClick={()=>void submitDevice()}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-500 disabled:opacity-50">
              <Save className="h-4 w-4"/>{busy?"Saving…":editingId?"Save Changes":"Save SmartLife Device"}
            </button>
            {editingId&&<button type="button" onClick={()=>{setEditingId("");setForm({...blank});}}
              className="rounded-lg border border-slate-500 px-4 py-2 text-slate-200">Cancel Edit</button>}
          </div>
        </section>
        <section className="rounded-2xl border border-red-500/30 bg-slate-900/80 p-5">
          <h3 className="flex items-center gap-2 text-lg font-bold"><Bell className="h-5 w-5 text-red-400"/>Send SmartLife Mouse Alert</h3>
          <p className="mt-1 text-sm text-slate-300">After Admin receives a genuine Smart Life app notification, select the correct restaurant device and send the alert. This does not automatically read Smart Life notifications.</p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="text-xs text-slate-300">Device
              <select value={alarmDevice} onChange={e=>{setAlarmDevice(e.target.value);setConfirmingAlarm(false);}}
                className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-white">
                <option value="">Select device for {selectedBranch?.name || "this restaurant"}</option>
                {devices.map(d=><option key={d.id} value={d.id}>{d.name} — {d.installationArea} ({d.deviceCode})</option>)}
              </select>
            </label>
            <label className="text-xs text-slate-300">Mice caught in this alert
              <input type="number" min="1" max="50" value={caughtCount} onChange={e=>{setCaughtCount(Number(e.target.value));setConfirmingAlarm(false);}}
                className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-white"/>
            </label>
          </div>
          <label className="mt-4 block text-xs text-slate-300">Select a ready-made instruction (10 options)
            <select aria-label="Select SmartLife alarm instruction" value={selectedAlarmTemplate}
              onChange={e=>{
                const index=e.target.value;
                setSelectedAlarmTemplate(index);
                setAlarmMessage(index===""?"":smartLifeAlarmTemplates[Number(index)]?.message || "");
                setConfirmingAlarm(false);
              }}
              className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2.5 text-white">
              <option value="">Choose an instruction, or write your own…</option>
              {smartLifeAlarmTemplates.map((template,index)=>(
                <option key={template.title} value={String(index)}>{index+1}. {template.title}</option>
              ))}
            </select>
          </label>
          <label className="mt-3 block text-xs text-slate-300">Optional message to restaurant — review or edit before sending
            <textarea aria-label="Optional message to restaurant" rows={4} maxLength={200}
              value={alarmMessage} onChange={e=>{setAlarmMessage(e.target.value);setSelectedAlarmTemplate("");setConfirmingAlarm(false);}}
              placeholder="Select an instruction above or type your own message"
              className="mt-1 w-full resize-y rounded-lg border border-slate-600 bg-slate-950 px-3 py-2.5 text-sm leading-relaxed text-white"/>
          </label>
          <p className="mt-1 text-right text-xs text-slate-400">{alarmMessage.length}/200 characters</p>
          <button type="button" disabled={!alarmDevice||busy || !Number.isInteger(caughtCount) || caughtCount < 1 || caughtCount > 50} onClick={()=>{setError("");setConfirmingAlarm(true);}}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 font-bold text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40">
            <Bell className="h-5 w-5"/>Send Alarm to {selectedBranch?.name}
          </button>

          {/* Embedded 786.Chat Preview can suppress native browser confirm().
              An accessible in-page confirmation guarantees the Admin explicitly
              confirms which branch receives this real alarm. */}
          {confirmingAlarm && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-black/80 p-3 sm:p-5">
              <div role="dialog" aria-modal="true" aria-label="Confirm SmartLife mouse alarm"
                className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border-2 border-red-500 bg-slate-950 p-5 shadow-2xl">
                <h4 className="flex items-center gap-2 text-lg font-bold text-red-200">
                  <Bell className="h-5 w-5" /> Confirm SmartLife Alarm
                </h4>
                <p className="mt-3 text-sm text-slate-200">You are about to send a real mouse-caught alarm to:</p>
                <p className="mt-1 text-lg font-bold text-white">{selectedBranch?.name || "Selected restaurant"}</p>
                <p className="mt-2 text-sm text-slate-200">
                  Device: <strong>{devices.find(d=>d.id===alarmDevice)?.name || "No device selected"}</strong>
                </p>
                <p className="mt-1 text-sm text-slate-200">
                  Mice caught: <strong>{caughtCount}</strong>
                </p>
                <div className="mt-3 rounded-lg border border-slate-700 bg-slate-900 p-3">
                  <p className="mb-1 text-xs font-semibold text-cyan-200">Message to restaurant</p>
                  <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-white">
                    {alarmMessage || "No additional instructions"}
                  </p>
                </div>
                {error && <p role="alert" className="mt-3 text-sm text-red-300">{error}</p>}
                <p className="mt-3 text-xs text-amber-200">
                  This sends a real alert to this restaurant's SmartLife Alert screen.
                  It does not operate the physical trap.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <button type="button" disabled={busy} onClick={()=>{setConfirmingAlarm(false);setError("");}}
                    className="rounded-lg border border-slate-500 px-4 py-2.5 font-semibold text-white hover:bg-slate-800 disabled:opacity-50">
                    Cancel
                  </button>
                  <button type="button" disabled={busy || !alarmDevice} onClick={()=>void sendAlarm()}
                    className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 font-bold text-white hover:bg-red-500 disabled:opacity-50">
                    <Bell className="h-4 w-4" />{busy?"Sending…":"Confirm & Send Alarm"}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="mt-5 space-y-3 border-t border-slate-700 pt-4">
            <h4 className="text-sm font-bold text-white">
              SmartLife Alert History — {selectedBranch?.name} ({alerts.length} active)
            </h4>
            {alerts.length===0&&<p className="text-xs text-slate-400">No active SmartLife alerts for this branch.</p>}
            {alerts.map(alert=>(
              <div key={alert.id} className="rounded-lg border border-slate-700 bg-slate-800 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-white">{alert.deviceName} · {alert.caughtCount} mouse/mice</p>
                    <p className="text-xs text-slate-300">{timeFor(alert.sentAt)}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={alert.acknowledgedAt?"text-xs text-emerald-300":"text-xs text-amber-300"}>
                      {alert.acknowledgedAt?"Alarm stopped":"Awaiting Stop Alarm"}
                    </span>
                    {alert.acknowledgedAt&&<button type="button"
                      onClick={()=>{setArchiveConfirmId(alert.id);setArchiveNote("");}}
                      className="rounded-lg border border-amber-500 px-3 py-1.5 text-xs font-semibold text-amber-200">
                      Archive issue
                    </button>}
                  </div>
                </div>
                {alert.message&&<p className="mt-2 whitespace-pre-wrap break-words text-xs text-slate-200">{alert.message}</p>}
                {archiveConfirmId===alert.id&&(
                  <div className="mt-3 rounded-lg border border-amber-500 bg-slate-950 p-3">
                    <p className="font-bold text-amber-200">Confirm this pest issue has been resolved</p>
                    <p className="mt-1 text-xs text-slate-300">
                      Archive removes this alert card from the restaurant's active SmartLife Alert screen.
                      The mouse device stays registered. A permanent copy remains in Admin Archived History.
                    </p>
                    <label className="mt-2 block text-xs text-slate-300">Work completed / visit notes (optional)
                      <textarea rows={2} value={archiveNote} maxLength={400}
                        onChange={e=>setArchiveNote(e.target.value)}
                        placeholder="e.g. Pest controller visited, trap serviced and area cleaned."
                        className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-white"/>
                    </label>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button type="button" disabled={busy} onClick={()=>setArchiveConfirmId(null)}
                        className="rounded-lg border border-slate-500 px-3 py-2 text-xs text-white">Cancel</button>
                      <button type="button" disabled={busy} onClick={()=>void archiveSmartLifeAlert(alert.id)}
                        className="rounded-lg bg-amber-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">
                        {busy?"Archiving…":"Confirm archive"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            <button type="button" onClick={()=>setShowArchived(v=>!v)}
              className="rounded-lg border border-slate-600 px-3 py-2 text-xs font-semibold text-cyan-200 hover:bg-slate-800">
              {showArchived?"Hide Archived History":`View Archived History (${archivedAlerts.length})`}
            </button>
            {showArchived&&(
              <div className="space-y-2 rounded-xl border border-slate-700 bg-slate-950/80 p-3">
                <h5 className="text-sm font-semibold text-slate-200">Archived SmartLife issues — {selectedBranch?.name}</h5>
                {archivedAlerts.length===0&&<p className="text-xs text-slate-400">No archived issues for this branch.</p>}
                {archivedAlerts.map(alert=>(
                  <div key={alert.id} className="rounded-lg border border-slate-700 bg-slate-800 p-3">
                    <div className="flex flex-wrap justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-white">{alert.deviceName} · {alert.caughtCount} mouse/mice</p>
                        <p className="text-xs text-slate-300">Alert: {timeFor(alert.sentAt)} · Archived: {alert.archivedAt?timeFor(alert.archivedAt):"Unknown"}</p>
                        <p className="text-xs text-slate-400">Archived by: {alert.archivedBy||"Unknown"}</p>
                      </div>
                      <div className="flex flex-wrap items-start gap-2">
                        <button type="button" disabled={busy} onClick={()=>{setDeleteConfirmId(null);void restoreSmartLifeAlert(alert.id);}}
                          className="rounded-lg border border-cyan-600 px-3 py-2 text-xs font-semibold text-cyan-200 disabled:opacity-50">
                          Restore
                        </button>
                        <button type="button" aria-label={`Delete archived alert for ${alert.deviceName}`}
                          title="Delete from archived history"
                          disabled={busy} onClick={()=>setDeleteConfirmId(alert.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-red-600 px-3 py-2 text-xs font-semibold text-red-200 hover:bg-red-950/50 disabled:opacity-50">
                          <Trash2 className="h-4 w-4" /> Delete
                        </button>
                      </div>
                    </div>
                    {alert.archiveNote&&<p className="mt-2 text-xs text-slate-300">Visit notes: {alert.archiveNote}</p>}
                    {deleteConfirmId===alert.id&&(
                      <div role="group" aria-label="Confirm delete from SmartLife history"
                        className="mt-3 rounded-lg border border-red-500 bg-red-950/60 p-3">
                        <p className="text-sm font-semibold text-red-100">
                          Delete this archived alert from {selectedBranch?.name} history?
                        </p>
                        <p className="mt-1 text-xs text-slate-200">
                          Only this archived entry will disappear from the visible list. Mouse devices, other restaurants, and the private audit record are kept.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button type="button" disabled={busy}
                            onClick={()=>setDeleteConfirmId(null)}
                            className="rounded-lg border border-slate-500 px-3 py-2 text-xs text-white disabled:opacity-50">
                            Cancel
                          </button>
                          <button type="button" disabled={busy}
                            onClick={()=>void deleteArchivedAlert(alert.id)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white hover:bg-red-500 disabled:opacity-50">
                            <Trash2 className="h-4 w-4" /> {busy?"Removing…":"Confirm Delete"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
        </>
      )}
      {branchId&&(
        <section className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-bold">SmartLife Devices — {selectedBranch?.name} ({devices.length})</h3>
            <input value={deviceFilter} onChange={e=>setDeviceFilter(e.target.value)} placeholder="Search devices"
              className="w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-white sm:w-52"/>
          </div>
          {loading&&<p className="text-slate-300">Loading…</p>}
          {!loading&&devices.length===0&&<p className="text-slate-300">No SmartLife devices for this restaurant yet. Use SmartLife Check to register one.</p>}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {displayed.map((d,index)=>(
            <article key={d.id} className={`rounded-xl border bg-slate-950/60 p-4 ${d.activeCaughtCount>0?"border-2 border-red-500":"border-blue-500/30"}`}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div><h4 className="text-lg font-bold text-white">Device {index+1} — {d.name}</h4>
                  <p className="text-sm text-slate-300">{selectedBranch?.name}</p>
                  <p className="text-xs text-slate-400">{d.deviceCode}</p></div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${d.connectionStatus==="connected"?"bg-emerald-500/20 text-emerald-200":d.connectionStatus==="disconnected"?"bg-red-500/20 text-red-200":"bg-slate-700 text-slate-200"}`}>{nameFor(d.connectionStatus)}</span>
              </div>
              {d.activeCaughtCount>0&&(
                <div role="status" className="mt-3 flex items-center gap-2 rounded-lg border border-red-500 bg-red-950/70 p-3 text-sm font-bold text-red-200">
                  <Bell className="h-4 w-4"/>MOUSE CAUGHT — {d.activeCaughtCount} awaiting attention
                </div>
              )}
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-lg bg-slate-800 p-3"><p className="text-xs text-slate-400">System</p><p>SmartLife</p></div>
                <div className="rounded-lg bg-slate-800 p-3"><p className="flex items-center gap-1 text-xs text-slate-400"><Battery className="h-3 w-3"/>Battery</p><p>{d.batteryPercent==null?"—":`${d.batteryPercent}%`}</p></div>
                <div className="rounded-lg bg-slate-800 p-3"><p className="text-xs text-slate-400">Status</p><p>{nameFor(d.connectionStatus)}</p></div>
                <div className="rounded-lg bg-slate-800 p-3"><p className="flex items-center gap-1 text-xs text-slate-400"><Shield className="h-3 w-3"/>Trap</p><p>{d.activeCaughtCount>0?`Mouse caught (${d.activeCaughtCount})`:d.trapStatus==="caught"?"Mouse caught":d.trapStatus==="service_required"?"Service required":"Ready"}</p></div>
              </div>
              <p className="mt-3 flex items-center gap-1 text-xs text-slate-300"><Wifi className="h-3.5 w-3.5"/>Wi-Fi signal</p>
              <p className="mt-1 flex items-center gap-1 text-xs text-slate-300"><MapPin className="h-3.5 w-3.5"/>{d.installationArea} · Updated {timeFor(d.updatedAt)}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" onClick={()=>{edit(d);}}
                  className="rounded-lg border border-cyan-500 px-3 py-2 text-xs font-semibold text-cyan-200 hover:bg-cyan-900/30">
                  Edit Device
                </button>
                <button type="button" disabled={busy} onClick={()=>void archive(d)}
                  className="rounded-lg border border-red-600 px-3 py-2 text-xs text-red-200 hover:bg-red-900/20">Archive</button>
              </div>
              {mode==="devices"&&editingId===d.id&&(
                <div id="smartlife-device-form" className="mt-4 space-y-2 rounded-xl border border-cyan-600/40 bg-slate-900 p-3">
                  <h5 className="font-semibold">Edit Device</h5>
                  <input aria-label="Device ID" placeholder="SL-MOUSE-000001" value={form.deviceCode} onChange={e=>update("deviceCode",e.target.value.toUpperCase())} className="w-full rounded-lg border border-slate-600 bg-slate-950 p-2 text-sm"/>
                  <input aria-label="Device name" value={form.name} onChange={e=>update("name",e.target.value)} className="w-full rounded-lg border border-slate-600 bg-slate-950 p-2 text-sm"/>
                  <input aria-label="Installation area" value={form.installationArea} onChange={e=>update("installationArea",e.target.value)} className="w-full rounded-lg border border-slate-600 bg-slate-950 p-2 text-sm"/>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="text-xs">Battery %
                      <input type="number" min="0" max="100" value={form.batteryPercent} onChange={e=>update("batteryPercent",e.target.value)} className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-950 p-2 text-sm"/>
                    </label>
                    <label className="text-xs">Signal dBm
                      <input type="number" min="-150" max="0" value={form.signalDbm} onChange={e=>update("signalDbm",e.target.value)} className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-950 p-2 text-sm"/>
                    </label>
                    <label className="text-xs">Connection
                      <select value={form.connectionStatus} onChange={e=>update("connectionStatus",e.target.value)} className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-950 p-2 text-sm">
                        <option value="unknown">Not reported</option><option value="connected">Connected</option><option value="disconnected">Disconnected</option>
                      </select>
                    </label>
                    <label className="text-xs">Trap
                      <select value={form.trapStatus} onChange={e=>update("trapStatus",e.target.value)} className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-950 p-2 text-sm">
                        <option value="ready">Ready</option><option value="caught">Mouse caught</option><option value="service_required">Service required</option>
                      </select>
                    </label>
                  </div>
                  <input aria-label="Internal notes" value={form.notes} onChange={e=>update("notes",e.target.value)} placeholder="Internal notes" className="w-full rounded-lg border border-slate-600 bg-slate-950 p-2 text-sm"/>
                  <div className="flex gap-2">
                    <button type="button" onClick={()=>void submitDevice()} disabled={busy} className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold">Save</button>
                    <button type="button" onClick={()=>{setEditingId("");setForm({...blank});}} className="rounded-lg border border-slate-600 px-3 py-2 text-sm">Cancel</button>
                  </div>
                </div>
              )}
            </article>
          ))}
          </div>
        </section>
      )}
    </div>
  );
}
