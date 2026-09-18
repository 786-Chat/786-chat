import { useEffect, useMemo, useState } from "react";
import { Copy, ExternalLink, HardDrive, Plus, RefreshCw, ShieldCheck, Trash2, Wifi, Zap } from "lucide-react";
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

function deviceSnapshot(statusList: any[]) {
  const list = Array.isArray(statusList) ? statusList : [];
  let battery: string | null = null;
  let state: string | null = null;
  for (const item of list) {
    const code = normalize(item?.code || item?.name || item?.dpId);
    const raw = item?.value;
    if (code.includes("battery")) battery = typeof raw === "number" ? `${raw}%` : String(raw ?? "");
    if (code === "status" || code.includes("switch")) state = String(raw ?? "");
  }
  return { battery, state };
}

export default function IotAdminPanel() {
  const { toast } = useToast();
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [assigned, setAssigned] = useState<any[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [registering, setRegistering] = useState(false);
  const [deviceId, setDeviceId] = useState("");
  const [deviceName, setDeviceName] = useState("HP2");
  const [hardwareModel, setHardwareModel] = useState("BK7231N-MOUSE-V1");
  const [branchId, setBranchId] = useState("");
  const [notes, setNotes] = useState("");
  const [lastCreatedId, setLastCreatedId] = useState("");
  const [clearingId, setClearingId] = useState<string | null>(null);

  const [wifiDeviceId, setWifiDeviceId] = useState("");
  const [wifiSsid, setWifiSsid] = useState("");
  const [wifiPassword, setWifiPassword] = useState("");
  const [setupAddress, setSetupAddress] = useState("http://192.168.4.1");
  const [gatewayHost, setGatewayHost] = useState("FOODSAFETY-GW01");
  const [gatewayPort, setGatewayPort] = useState("1883");
  const [sendingWifi, setSendingWifi] = useState(false);
  const [showSetupGuide, setShowSetupGuide] = useState(false);

  const branchById = useMemo(() => new Map(branches.map((branch) => [branch.id, branch.name])), [branches]);
  const ownedDevices = useMemo(
    () => assigned.filter((device: any) => device?.provider === "food-safety-owned-mqtt"),
    [assigned],
  );

  const loadBase = async () => {
    const [statusRes, assignedRes, branchRes] = await Promise.all([
      fetch("/api/iot/owned/status", { credentials: "include", cache: "no-store" }),
      fetch("/api/iot/devices", { credentials: "include", cache: "no-store" }),
      fetch("/api/branches?page=1&limit=5000", { credentials: "include", cache: "no-store" }),
    ]);

    if (statusRes.ok) setSystemStatus(await statusRes.json());
    if (assignedRes.ok) {
      const devices = await assignedRes.json();
      setAssigned(Array.isArray(devices) ? devices : []);
    }
    if (branchRes.ok) {
      const data = await branchRes.json();
      const all = Array.isArray(data?.branches) ? data.branches : [];
      setBranches(all.filter((branch: any) =>
        Boolean(String(branch?.name || "").trim()) &&
        !String(branch.name).startsWith("Available Branch ")
      ));
    }
  };

  useEffect(() => {
    loadBase().catch(() => {});
    const timer = window.setInterval(() => loadBase().catch(() => {}), 20000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!wifiDeviceId && ownedDevices.length > 0) {
      setWifiDeviceId(String(ownedDevices[0].deviceId || ""));
    }
  }, [ownedDevices, wifiDeviceId]);

  const registerDevice = async () => {
    if (!deviceName.trim() || !branchId) {
      toast({
        title: "Missing information",
        description: "Enter a friendly device name and choose a branch.",
        variant: "destructive",
      });
      return;
    }

    setRegistering(true);
    try {
      const response = await fetch("/api/iot/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          deviceId: deviceId.trim(),
          deviceName: deviceName.trim(),
          branchId,
          notes: notes.trim(),
          hardwareModel: hardwareModel.trim() || "FOOD-SAFETY-MOUSE-V1",
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast({
          title: "Could not register device",
          description: data?.message || "Please try again",
          variant: "destructive",
        });
        return;
      }

      const createdId = String(data?.deviceId || "");
      setLastCreatedId(createdId);
      setWifiDeviceId(createdId);
      toast({
        title: "Food Safety device registered",
        description: `${String(data?.deviceName || deviceName)} is assigned to ${branchById.get(branchId) || "the selected branch"}.`,
      });
      setDeviceId("");
      setDeviceName("");
      setBranchId("");
      setNotes("");
      await loadBase();
    } finally {
      setRegistering(false);
    }
  };

  const removeDevice = async (id: string, name: string) => {
    if (!window.confirm(`Remove ${name} from this branch?`)) return;
    const response = await fetch(`/api/iot/devices/${id}`, { method: "DELETE", credentials: "include" });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      toast({ title: "Could not remove device", description: data?.message || "Please try again", variant: "destructive" });
      return;
    }
    await loadBase();
  };

  const refreshDevice = async (id: string) => {
    await fetch(`/api/iot/devices/${id}/refresh`, { method: "POST", credentials: "include" });
    await loadBase();
  };

  const clearCatch = async (id: string, name: string) => {
    setClearingId(id);
    try {
      const response = await fetch(`/api/iot/devices/${id}/clear-alarm`, {
        method: "POST",
        credentials: "include",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast({ title: "Could not clear catch", description: data?.message || "Please try again", variant: "destructive" });
        return;
      }
      toast({ title: "Catch cleared", description: `${name} is marked serviced. The branch catch card will disappear automatically.` });
      await loadBase();
    } finally {
      setClearingId(null);
    }
  };

  const provisioningPayload = () => ({
    deviceId: wifiDeviceId,
    ssid: wifiSsid,
    password: wifiPassword,
    mqttHost: gatewayHost,
    mqttPort: Number(gatewayPort) || 1883,
  });

  const copyWifiSetup = async () => {
    if (!wifiDeviceId || !wifiSsid || !wifiPassword) {
      toast({ title: "Wi-Fi details needed", description: "Choose a device and enter the Wi-Fi name and password.", variant: "destructive" });
      return;
    }
    await navigator.clipboard.writeText(JSON.stringify(provisioningPayload(), null, 2));
    toast({
      title: "Wi-Fi setup copied",
      description: "The Wi-Fi password is only in your browser clipboard. It is not stored in 786.Chat or Neon.",
    });
  };

  const sendWifiDirect = async () => {
    if (!wifiDeviceId || !wifiSsid || !wifiPassword || !setupAddress.trim()) {
      toast({ title: "Wi-Fi details needed", description: "Choose a device, enter Wi-Fi details and the device setup address.", variant: "destructive" });
      return;
    }

    setSendingWifi(true);
    try {
      try {
        await navigator.clipboard.writeText(JSON.stringify(provisioningPayload(), null, 2));
      } catch (_) {}
      setShowSetupGuide(true);
    } finally {
      setSendingWifi(false);
    }
  };

  const openLocalSetupPage = () => {
    const base = setupAddress.trim() || "http://192.168.4.1";
    const opened = window.open(base, "_blank", "noopener,noreferrer");
    if (!opened) {
      window.location.assign(base);
    }
  };

  const canRegister = Boolean(deviceName.trim() && branchId);

  return (
    <div className="space-y-6 w-full max-w-full">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Smart Devices</h2>
            <p className="text-sm text-slate-400">Your own Food Safety IoT mouse-trap system</p>
          </div>
        </div>
        <Button
          onClick={() => document.getElementById("owned-device-name")?.focus()}
          className="bg-cyan-600 hover:bg-cyan-500 text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          Register New Device
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-slate-700 bg-slate-800/70 p-4">
          <p className="text-xs text-slate-400">Provider</p>
          <p className="mt-1 font-semibold text-white">Food Safety Owned IoT</p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/70 p-4">
          <p className="text-xs text-slate-400">System Status</p>
          <div className="mt-1 flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${systemStatus?.configured ? "bg-emerald-400" : "bg-amber-400"}`} />
            <span className={systemStatus?.configured ? "text-emerald-300" : "text-amber-300"}>
              {systemStatus?.configured ? "Ready" : "Checking"}
            </span>
          </div>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/70 p-4">
          <p className="text-xs text-slate-400">Connection</p>
          <p className="mt-1 font-medium text-white">Wi-Fi / MQTT</p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/70 p-4">
          <p className="text-xs text-slate-400">Assigned Devices</p>
          <p className="mt-1 text-xl font-bold text-white">{assigned.length}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge className="border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-emerald-200">Independent Food Safety IoT</Badge>
        <Badge className="border-blue-500/40 bg-blue-500/10 px-3 py-2 text-blue-200">Food Safety Gateway + Neon</Badge>
      </div>

      <div className="rounded-2xl border border-slate-700 bg-slate-800/65 p-5">
        <div className="mb-4 flex items-center gap-2">
          <Plus className="h-4 w-4 text-blue-300" />
          <h3 className="font-semibold text-white">Add Device → Name → Branch → Assign → Activate</h3>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Friendly Device Name</label>
            <Input
              id="owned-device-name"
              value={deviceName}
              onChange={(event) => setDeviceName(event.target.value)}
              placeholder="e.g. HP2"
              className="border-slate-600 bg-slate-900 text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Branch</label>
            <select
              value={branchId}
              onChange={(event) => setBranchId(event.target.value)}
              className="w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white"
            >
              <option value="">Select customer branch...</option>
              {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Device ID</label>
            <Input
              value={deviceId}
              onChange={(event) => setDeviceId(event.target.value.toUpperCase())}
              placeholder="Leave blank to create the next FS-MOUSE ID"
              className="border-slate-600 bg-slate-900 text-white"
            />
            <p className="mt-1 text-[11px] text-slate-500">Leave blank and the system creates a unique ID such as FS-MOUSE-000001.</p>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Hardware Model</label>
            <Input
              value={hardwareModel}
              onChange={(event) => setHardwareModel(event.target.value)}
              placeholder="BK7231N-MOUSE-V1"
              className="border-slate-600 bg-slate-900 text-white"
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-medium text-slate-400">Location / Notes</label>
            <Input
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="e.g. Front counter, stock room, kitchen wall"
              className="border-slate-600 bg-slate-900 text-white"
            />
          </div>
        </div>

        <Button
          onClick={registerDevice}
          disabled={!canRegister || registering}
          className="mt-4 bg-blue-600 hover:bg-blue-500 text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {registering ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
          {registering ? "Registering..." : "Register & Assign Device"}
        </Button>

        {lastCreatedId && (
          <div className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-100">
            Device created: <span className="font-mono font-semibold">{lastCreatedId}</span>. It becomes Online when the physical trap connects to your Food Safety gateway using this ID.
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-cyan-500/30 bg-slate-800/65 p-5">
        <div className="mb-4 flex items-center gap-2">
          <Wifi className="h-4 w-4 text-cyan-300" />
          <h3 className="font-semibold text-white">Connect Device to Wi-Fi</h3>
        </div>
        <p className="mb-4 text-sm text-slate-400">
          Enter the customer Wi-Fi here while the physical trap is in Food Safety setup mode. The password is kept only in this browser and is never saved in Neon.
        </p>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Device</label>
            <select
              value={wifiDeviceId}
              onChange={(event) => setWifiDeviceId(event.target.value)}
              className="w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white"
            >
              <option value="">Select registered device...</option>
              {ownedDevices.map((device: any) => (
                <option key={device.id} value={device.deviceId}>{device.deviceName} — {device.deviceId}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Wi-Fi Name (SSID)</label>
            <Input
              value={wifiSsid}
              onChange={(event) => setWifiSsid(event.target.value)}
              placeholder="Customer 2.4 GHz Wi-Fi"
              className="border-slate-600 bg-slate-900 text-white"
              autoComplete="off"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Wi-Fi Password</label>
            <Input
              type="password"
              value={wifiPassword}
              onChange={(event) => setWifiPassword(event.target.value)}
              placeholder="Wi-Fi password"
              className="border-slate-600 bg-slate-900 text-white"
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Device Setup Address</label>
            <Input
              value={setupAddress}
              onChange={(event) => setSetupAddress(event.target.value)}
              placeholder="http://192.168.4.1"
              className="border-slate-600 bg-slate-900 text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Food Safety Gateway / MQTT Host</label>
            <Input
              value={gatewayHost}
              onChange={(event) => setGatewayHost(event.target.value)}
              placeholder="FOODSAFETY-GW01 or local IP"
              className="border-slate-600 bg-slate-900 text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">MQTT Port</label>
            <Input
              value={gatewayPort}
              onChange={(event) => setGatewayPort(event.target.value.replace(/[^0-9]/g, ""))}
              placeholder="1883"
              className="border-slate-600 bg-slate-900 text-white"
              inputMode="numeric"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            onClick={sendWifiDirect}
            disabled={sendingWifi || !wifiDeviceId || !wifiSsid || !wifiPassword}
            className="bg-cyan-600 text-white hover:bg-cyan-500"
          >
            {sendingWifi ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Wifi className="mr-2 h-4 w-4" />}
            {sendingWifi ? "Sending..." : "Send Wi-Fi to Device"}
          </Button>
          <Button
            onClick={copyWifiSetup}
            variant="outline"
            className="border-slate-600 text-slate-200"
          >
            <Copy className="mr-2 h-4 w-4" />
            Copy Setup Details
          </Button>
          <Button
            onClick={() => setShowSetupGuide((value) => !value)}
            variant="outline"
            className="border-slate-600 text-slate-200"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Open Device Setup
          </Button>
        </div>

        <p className="mt-3 text-xs text-slate-500">
          The first BK7231N trap must have the Food Safety firmware/setup portal installed before the local setup page can exist. After that firmware is proven, future shops use this same setup flow.
        </p>
      </div>

      {showSetupGuide && (
        <div className="rounded-2xl border border-cyan-500/25 bg-slate-950/65 p-5 text-sm text-slate-200">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <h4 className="flex items-center gap-2 font-semibold text-cyan-100">
                <Wifi className="h-4 w-4 text-cyan-300" />
                Device setup steps
              </h4>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-slate-300">
                <li>Put the physical trap into Food Safety setup mode.</li>
                <li>Connect this phone, tablet or computer to the trap's temporary Food Safety Wi-Fi network.</li>
                <li>Only then open the local setup page and enter the customer 2.4 GHz Wi-Fi details.</li>
              </ol>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-lg bg-slate-900 p-3">
                  <span className="block text-xs text-slate-500">Device</span>
                  <span className="break-all font-mono text-slate-100">{wifiDeviceId || "Select a device first"}</span>
                </div>
                <div className="rounded-lg bg-slate-900 p-3">
                  <span className="block text-xs text-slate-500">Customer Wi-Fi</span>
                  <span className="break-all text-slate-100">{wifiSsid || "Enter Wi-Fi name first"}</span>
                </div>
                <div className="rounded-lg bg-slate-900 p-3">
                  <span className="block text-xs text-slate-500">Local setup address</span>
                  <span className="break-all font-mono text-slate-100">{setupAddress.trim() || "http://192.168.4.1"}</span>
                </div>
                <div className="rounded-lg bg-slate-900 p-3">
                  <span className="block text-xs text-slate-500">Gateway</span>
                  <span className="break-all font-mono text-slate-100">{gatewayHost}:{gatewayPort || "1883"}</span>
                </div>
              </div>
              <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-100">
                If 192.168.4.1 is blank after you connect to the trap's setup Wi-Fi, the Food Safety setup firmware/portal is not running on that trap yet.
              </div>
              <p className="mt-3 text-xs text-slate-500">
                Your Wi-Fi password stays in this browser and is not stored in Neon.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={copyWifiSetup} className="border-slate-600 text-slate-200">
                <Copy className="mr-2 h-4 w-4" />
                Copy Setup Details
              </Button>
              <Button type="button" onClick={openLocalSetupPage} className="bg-cyan-600 text-white hover:bg-cyan-500">
                <ExternalLink className="mr-2 h-4 w-4" />
                Open Local Setup Page
              </Button>
              <Button type="button" variant="ghost" onClick={() => setShowSetupGuide(false)} className="text-slate-300">
                Close Guide
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-700 bg-slate-800/65 p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 font-semibold text-white">
            <HardDrive className="h-4 w-4 text-emerald-300" />
            Assigned Devices ({assigned.length})
          </h3>
          <Button size="sm" variant="outline" onClick={() => loadBase()} className="border-slate-600 text-slate-200">
            <RefreshCw className="mr-1 h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>

        {assigned.length === 0 ? (
          <div className="py-10 text-center text-slate-400">No owned devices assigned yet.</div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {assigned.map((device: any) => {
              const snap = deviceSnapshot(device.lastStatus);
              return (
                <div key={device.id} className={`rounded-xl border p-4 ${device.alarmActive ? "border-red-500/60 bg-red-950/20" : "border-slate-700 bg-slate-900/60"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-white">{device.deviceName}</p>
                      <p className="mt-0.5 text-xs text-slate-400">{branchById.get(device.branchId) || device.branchName || "Assigned branch"}</p>
                      <p className="mt-1 break-all font-mono text-[11px] text-slate-500">{device.deviceId}</p>
                    </div>
                    <Badge className={device.isOnline ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-700 text-slate-300"}>
                      {device.isOnline ? "Online" : (snap.state === "awaiting_activation" ? "Awaiting activation" : "Offline")}
                    </Badge>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                    <div className="rounded-lg bg-slate-800 p-2"><span className="block text-slate-500">System</span><span className="text-white">Food Safety Owned</span></div>
                    <div className="rounded-lg bg-slate-800 p-2"><span className="block text-slate-500">Battery</span><span className="text-white">{snap.battery || "—"}</span></div>
                    <div className="rounded-lg bg-slate-800 p-2"><span className="block text-slate-500">Status</span><span className="text-white">{snap.state || (device.isOnline ? "Online" : "Offline")}</span></div>
                    <div className={`rounded-lg p-2 ${device.alarmActive ? "bg-red-500/20" : "bg-slate-800"}`}><span className="block text-slate-500">Trap Event</span><span className={device.alarmActive ? "font-bold text-red-300" : "text-white"}>{device.alarmActive ? "Caught" : "Normal"}</span></div>
                  </div>

                  <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                    <Wifi className="h-3.5 w-3.5" />
                    Wi-Fi / MQTT
                    {device.lastCheckedAt ? ` • Last seen ${new Date(device.lastCheckedAt).toLocaleString("en-GB")}` : ""}
                  </div>

                  {device.notes && <p className="mt-2 text-xs text-slate-400">Location: {device.notes}</p>}

                  {device.alarmActive && (
                    <div className="mt-3 rounded-lg border border-red-500/40 bg-red-500/15 p-3 text-sm text-red-100">
                      <p className="font-semibold">🐭 Mouse caught — service this trap.</p>
                      {device.lastAlarmAt && <p className="mt-1 text-xs text-red-200">Triggered: {new Date(device.lastAlarmAt).toLocaleString("en-GB")}</p>}
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => refreshDevice(device.id)} className="border-slate-600 text-slate-200">
                      <RefreshCw className="mr-1 h-3 w-3" />
                      Refresh
                    </Button>
                    {device.alarmActive && (
                      <Button
                        size="sm"
                        onClick={() => clearCatch(device.id, device.deviceName)}
                        disabled={clearingId === device.id}
                        className="bg-emerald-600 text-white hover:bg-emerald-500"
                      >
                        {clearingId === device.id ? <RefreshCw className="mr-1 h-3 w-3 animate-spin" /> : <ShieldCheck className="mr-1 h-3 w-3" />}
                        {clearingId === device.id ? "Clearing..." : "Clear caught mouse"}
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => removeDevice(device.id, device.deviceName)} className="border-red-700/60 text-red-300">
                      <Trash2 className="mr-1 h-3 w-3" />
                      Remove Device
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4 text-sm text-slate-300">
        <div className="flex items-start gap-2">
          <ShieldCheck className="mt-0.5 h-4 w-4 text-cyan-300" />
          <p>New devices use only your Food Safety device registry and MQTT/Wi-Fi gateway. Customer Wi-Fi passwords are never stored in the platform database.</p>
        </div>
      </div>
    </div>
  );
}
