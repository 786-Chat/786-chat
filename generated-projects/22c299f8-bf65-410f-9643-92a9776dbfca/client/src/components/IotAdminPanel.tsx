
import { useEffect, useMemo, useState } from "react";
import { Battery, Cloud, HardDrive, Plus, RefreshCw, Search, ShieldCheck, Trash2, Wifi, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface BranchOption {
  id: string;
  name: string;
}

function normalize(value: unknown) {
  return String(value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function extractDeviceList(payload: any): any[] {
  const candidates = [
    payload,
    payload?.devices,
    payload?.list,
    payload?.data,
    payload?.data?.devices,
    payload?.data?.list,
    payload?.result,
    payload?.result?.devices,
    payload?.result?.list,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }

  return [];
}

function deviceSnapshot(statusList: any[]) {
  const list = Array.isArray(statusList) ? statusList : [];
  let battery: string | null = null;
  let power: string | null = null;
  let shock = false;
  for (const item of list) {
    const code = normalize(item?.code || item?.name || item?.dpId);
    const raw = item?.value;
    if (code.includes("battery")) battery = typeof raw === "number" ? `${raw}%` : String(raw ?? "");
    if (code === "status" || code.includes("switch")) power = String(raw ?? "");
    if (code.includes("shock")) {
      const v = normalize(raw);
      shock = raw === true || ["over", "alarm", "triggered", "on", "1", "true"].includes(v);
    }
  }
  return { battery, power, shock };
}

export default function IotAdminPanel() {
  const { toast } = useToast();
  const [status, setStatus] = useState<any>(null);
  const [assigned, setAssigned] = useState<any[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [cloudDevices, setCloudDevices] = useState<any[]>([]);
  const [discovering, setDiscovering] = useState(false);
  const [testing, setTesting] = useState(false);
  const [provider, setProvider] = useState("tuya");
  const [deviceId, setDeviceId] = useState("");
  const [deviceName, setDeviceName] = useState("");
  const [branchId, setBranchId] = useState("");
  const [notes, setNotes] = useState("");

  const branchById = useMemo(() => new Map(branches.map((branch) => [branch.id, branch.name])), [branches]);

  const loadBase = async () => {
    const [statusRes, assignedRes, branchRes] = await Promise.all([
      fetch("/api/tuya/status", { credentials: "include", cache: "no-store" }),
      fetch("/api/iot/devices", { credentials: "include", cache: "no-store" }),
      fetch("/api/branches?page=1&limit=5000", { credentials: "include", cache: "no-store" }),
    ]);
    if (statusRes.ok) setStatus(await statusRes.json());
    if (assignedRes.ok) setAssigned(await assignedRes.json());
    if (branchRes.ok) {
      const data = await branchRes.json();
      const all = Array.isArray(data?.branches) ? data.branches : [];
      setBranches(all.filter((branch: any) => Boolean(String(branch?.name || "").trim()) && !String(branch.name).startsWith("Available Branch ")));
    }
  };

  useEffect(() => {
    loadBase().catch(() => {});
    const timer = window.setInterval(() => loadBase().catch(() => {}), 20000);
    return () => window.clearInterval(timer);
  }, []);

  const discover = async (silent = false) => {
    if (discovering || provider !== "tuya") return;
    setDiscovering(true);
    try {
      const response = await fetch("/api/tuya/devices", { credentials: "include", cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.message || data?.msg || "Could not load Food Safety devices");
      const devices = extractDeviceList(data);
      setCloudDevices(devices);
      if (!silent) {
        toast({ title: "Food Safety devices loaded", description: `${devices.length} cloud device(s) found.` });
      }
    } catch (error: any) {
      toast({ title: "Device discovery failed", description: error?.message || "Could not load Food Safety devices", variant: "destructive" });
    } finally {
      setDiscovering(false);
    }
  };

  useEffect(() => {
    if (status?.configured && provider === "tuya" && cloudDevices.length === 0 && !discovering) {
      void discover(true);
    }
  }, [status?.configured, provider]);

  const testConnection = async () => {
    setTesting(true);
    try {
      const response = await fetch("/api/tuya/test-connection", { credentials: "include", cache: "no-store" });
      const data = await response.json();
      toast({ title: data?.success ? "Device cloud connected" : "Device cloud connection failed", description: data?.message || "Connection check finished", variant: data?.success ? "default" : "destructive" });
      await loadBase();
    } finally {
      setTesting(false);
    }
  };

  const assignDevice = async () => {
    if (!deviceId || !deviceName.trim() || !branchId) {
      toast({ title: "Missing information", description: "Choose a cloud device, enter a friendly name, and choose a branch.", variant: "destructive" });
      return;
    }
    const response = await fetch("/api/iot/devices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ deviceId, deviceName: deviceName.trim(), branchId, notes, provider }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      toast({ title: "Could not assign device", description: data?.message || "Please try again", variant: "destructive" });
      return;
    }
    toast({ title: "Device assigned", description: `${deviceName} is now connected to ${branchById.get(branchId) || "the selected branch"}.` });
    setDeviceId("");
    setDeviceName("");
    setBranchId("");
    setNotes("");
    await loadBase();
  };

  const removeDevice = async (id: string, name: string) => {
    if (!window.confirm(`Remove ${name} from this branch?`)) return;
    await fetch(`/api/iot/devices/${id}`, { method: "DELETE", credentials: "include" });
    await loadBase();
  };

  const refreshDevice = async (id: string) => {
    await fetch(`/api/iot/devices/${id}/refresh`, { method: "POST", credentials: "include" });
    await loadBase();
  };

  const canAssign = Boolean(deviceId && deviceName.trim() && branchId);

  return (
    <div className="space-y-6 w-full max-w-full">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Smart Devices</h2>
            <p className="text-sm text-slate-400">Food Safety smart devices assigned to customer branches</p>
          </div>
        </div>
        <Button onClick={() => discover(false)} disabled={discovering} className="bg-cyan-600 hover:bg-cyan-500 text-white">
          {discovering ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
          {discovering ? "Loading Devices..." : "Find / Import Devices"}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-slate-700 bg-slate-800/70 p-4">
          <p className="text-xs text-slate-400">Provider</p>
          <p className="mt-1 font-semibold text-white">Food Safety Device Cloud</p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/70 p-4">
          <p className="text-xs text-slate-400">Cloud Status</p>
          <div className="mt-1 flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${status?.configured ? "bg-emerald-400" : "bg-red-400"}`} />
            <span className={status?.configured ? "text-emerald-300" : "text-red-300"}>{status?.configured ? "Configured" : "Credentials needed"}</span>
          </div>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/70 p-4">
          <p className="text-xs text-slate-400">Data Center</p>
          <p className="mt-1 font-medium text-white">Central Europe</p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/70 p-4">
          <p className="text-xs text-slate-400">Assigned Devices</p>
          <p className="mt-1 text-xl font-bold text-white">{assigned.length}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={testConnection} disabled={testing} variant="outline" className="border-slate-600 text-slate-200">
          {testing ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Cloud className="mr-2 h-4 w-4" />}
          Test Device Cloud
        </Button>
        <Badge className="border-blue-500/40 bg-blue-500/10 px-3 py-2 text-blue-200">Wi-Fi / Cloud</Badge>
      </div>

      <div className="rounded-2xl border border-slate-700 bg-slate-800/65 p-5">
        <div className="mb-4 flex items-center gap-2">
          <Plus className="h-4 w-4 text-blue-300" />
          <h3 className="font-semibold text-white">Add Device → Choose Provider → Import → Name → Branch → Assign</h3>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Provider</label>
            <select
              value={provider}
              onChange={(event) => {
                setProvider(event.target.value);
                setDeviceId("");
                setCloudDevices([]);
              }}
              className="w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white"
            >
              <option value="tuya">Food Safety Device Cloud</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Find / Import Device</label>
            <select
              value={deviceId}
              onFocus={() => {
                if (!cloudDevices.length && !discovering) void discover(false);
              }}
              onClick={() => {
                if (!cloudDevices.length && !discovering) void discover(false);
              }}
              onChange={(event) => {
                const id = event.target.value;
                setDeviceId(id);
                const found = cloudDevices.find((device: any) => String(device.id || device.device_id || device.deviceId) === id);
                if (found) setDeviceName(String(found.name || found.device_name || found.product_name || "Smart Pest Device"));
              }}
              className="w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white"
            >
              <option value="">
                {discovering ? "Loading devices..." : cloudDevices.length ? "Choose a device..." : "Click to Find / Import Devices"}
              </option>
              {cloudDevices.map((device: any) => {
                const id = String(device.id || device.device_id || device.deviceId || "");
                const name = String(device.name || device.device_name || device.product_name || id);
                const online = device.online === true || device.is_online === true;
                return <option key={id} value={id}>{name} {online ? "• Online" : "• Offline"}</option>;
              })}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Friendly Device Name</label>
            <Input value={deviceName} onChange={(event) => setDeviceName(event.target.value)} placeholder="e.g. Mouse Trap Front Counter" className="border-slate-600 bg-slate-900 text-white" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Branch</label>
            <select value={branchId} onChange={(event) => setBranchId(event.target.value)} className="w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white">
              <option value="">Select customer branch...</option>
              {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-medium text-slate-400">Location / Notes</label>
            <Input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="e.g. Front counter, stock room, kitchen wall" className="border-slate-600 bg-slate-900 text-white" />
          </div>
        </div>

        {deviceId && <p className="mt-3 break-all text-xs text-slate-500">Device ID: {deviceId}</p>}
        <Button
          onClick={assignDevice}
          disabled={!canAssign}
          className="mt-4 bg-blue-600 hover:bg-blue-500 text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="mr-2 h-4 w-4" />Assign Device
        </Button>
      </div>

      <div className="rounded-2xl border border-slate-700 bg-slate-800/65 p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 font-semibold text-white"><HardDrive className="h-4 w-4 text-emerald-300" />Assigned Devices ({assigned.length})</h3>
          <Button size="sm" variant="outline" onClick={() => loadBase()} className="border-slate-600 text-slate-200"><RefreshCw className="mr-1 h-3.5 w-3.5" />Refresh</Button>
        </div>
        {assigned.length === 0 ? (
          <div className="py-10 text-center text-slate-400">No devices assigned yet.</div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {assigned.map((device: any) => {
              const snap = deviceSnapshot(device.lastStatus);
              return (
                <div key={device.id} className={`rounded-xl border p-4 ${device.alarmActive ? "border-red-500/60 bg-red-950/20" : "border-slate-700 bg-slate-900/60"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-white">{device.deviceName}</p>
                      <p className="mt-0.5 text-xs text-slate-400">{branchById.get(device.branchId) || "Assigned branch"}</p>
                      <p className="mt-1 break-all font-mono text-[11px] text-slate-500">{device.deviceId}</p>
                    </div>
                    <Badge className={device.isOnline ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-700 text-slate-300"}>{device.isOnline ? "Online" : "Offline"}</Badge>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                    <div className="rounded-lg bg-slate-800 p-2"><span className="block text-slate-500">Provider</span><span className="text-white">Food Safety</span></div>
                    <div className="rounded-lg bg-slate-800 p-2"><span className="block text-slate-500">Battery</span><span className="text-white">{snap.battery || "—"}</span></div>
                    <div className="rounded-lg bg-slate-800 p-2"><span className="block text-slate-500">Status</span><span className="text-white">{snap.power || (device.isOnline ? "Online" : "Offline")}</span></div>
                    <div className={`rounded-lg p-2 ${snap.shock || device.alarmActive ? "bg-red-500/20" : "bg-slate-800"}`}><span className="block text-slate-500">Trap Event</span><span className={snap.shock || device.alarmActive ? "font-bold text-red-300" : "text-white"}>{snap.shock || device.alarmActive ? "Triggered" : "Normal"}</span></div>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs text-slate-500"><Wifi className="h-3.5 w-3.5" />Wi-Fi / Cloud {device.lastCheckedAt ? `• Last seen ${new Date(device.lastCheckedAt).toLocaleString("en-GB")}` : ""}</div>
                  {device.alarmActive && <div className="mt-3 rounded-lg border border-red-500/40 bg-red-500/15 p-2 text-sm font-semibold text-red-200">⚠ Pest trap triggered — check and reset this device.</div>}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => refreshDevice(device.id)} className="border-slate-600 text-slate-200"><RefreshCw className="mr-1 h-3 w-3" />Refresh</Button>
                    <Button size="sm" variant="outline" onClick={() => removeDevice(device.id, device.deviceName)} className="border-red-700/60 text-red-300"><Trash2 className="mr-1 h-3 w-3" />Remove</Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4 text-sm text-slate-300">
        <div className="flex items-start gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 text-cyan-300" /><p>Device-provider credentials stay protected on the server. Branch dashboards receive only their assigned device status, battery, last-seen time and trap alerts.</p></div>
      </div>
    </div>
  );
}