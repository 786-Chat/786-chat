import { useEffect, useMemo, useState } from "react";
import { HardDrive, MapPin, Pencil, Plus, RefreshCw, Save, Search, ShieldCheck, Trash2, Wifi, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface BranchOption {
  id: string;
  name: string;
  address?: string | null;
  postCode?: string | null;
}

function normalize(value: unknown) {
  return String(value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function formatUkDateTime(value: Date | string | number) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(value));
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
  const [deviceName, setDeviceName] = useState("");
  const [hardwareModel, setHardwareModel] = useState("BK7231N-MOUSE-V1");
  const [branchId, setBranchId] = useState("");
  const [notes, setNotes] = useState("");
  const [lastCreatedId, setLastCreatedId] = useState("");

  const [branchMenuOpen, setBranchMenuOpen] = useState(false);
  const [branchLoadError, setBranchLoadError] = useState("");
  const [editingDeviceId, setEditingDeviceId] = useState("");
  const [editDeviceName, setEditDeviceName] = useState("");
  const [editBranchId, setEditBranchId] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editHardwareModel, setEditHardwareModel] = useState("");
  const [savingDevice, setSavingDevice] = useState(false);
  const [ukNow, setUkNow] = useState(() => new Date());
  const [activeBranchId, setActiveBranchId] = useState("");
  const [branchSearch, setBranchSearch] = useState("");
  const [branchSearchOpen, setBranchSearchOpen] = useState(false);

  const branchById = useMemo(() => new Map(branches.map((branch) => [branch.id, branch.name])), [branches]);
  const ownedDevices = useMemo(
    () => assigned.filter((device: any) => device?.provider === "food-safety-owned-mqtt"),
    [assigned],
  );

  const activeBranch = useMemo(
    () => branches.find((branch) => String(branch.id) === String(activeBranchId)) || null,
    [branches, activeBranchId],
  );
  const activeBranchDevices = useMemo(
    () => ownedDevices.filter((device: any) => String(device.branchId) === String(activeBranchId)),
    [ownedDevices, activeBranchId],
  );
  const branchSearchResults = useMemo(() => {
    const query = branchSearch.trim().toLowerCase();
    if (!query) return branches.slice(0, 12);
    return branches
      .filter((branch) => [branch.name, branch.address, branch.postCode]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)))
      .slice(0, 20);
  }, [branches, branchSearch]);
  const activeBranchMapQuery = useMemo(() => {
    if (!activeBranch) return "";
    return [activeBranch.name, activeBranch.address, activeBranch.postCode].filter(Boolean).join(", ");
  }, [activeBranch]);

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
      const realBranches = all.filter((branch: any) =>
        Boolean(String(branch?.name || "").trim()) &&
        !String(branch.name).startsWith("Available Branch ")
      );
      setBranches(realBranches);
      setBranchLoadError(realBranches.length ? "" : "No customer branches were returned.");
    } else {
      setBranchLoadError("Could not load customer branches. Refresh after admin login.");
    }
  };

  useEffect(() => {
    loadBase().catch(() => {});
    const timer = window.setInterval(() => loadBase().catch(() => {}), 20000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setUkNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

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
          title: response.status === 409 ? "Device already assigned" : "Could not register device",
          description: data?.message || "Please try again",
          variant: "destructive",
        });
        return;
      }

      const createdId = String(data?.deviceId || "");
      setLastCreatedId(createdId);
      toast({
        title: "Food Safety device registered",
        description: `${String(data?.deviceName || deviceName)} is assigned to ${branchById.get(branchId) || "the selected branch"}.`,
      });
      setDeviceId("");
      setDeviceName("");
      setActiveBranchId(branchId);
      setBranchSearch(branchById.get(branchId) || "");
      setBranchId("");
      setNotes("");
      await loadBase();
    } finally {
      setRegistering(false);
    }
  };

  const recoverStaleDevice = async () => {
    const staleDeviceId = deviceId.trim().toUpperCase();
    if (!staleDeviceId) return;
    if (!window.confirm(`Permanently remove stale registry record ${staleDeviceId}? Use this only when Assigned Devices is empty but registration says the ID already exists.`)) return;
    const response = await fetch(`/api/iot/devices/by-device-id/${encodeURIComponent(staleDeviceId)}`, { method: "DELETE", credentials: "include" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      toast({ title: "Could not clear stale device", description: data?.message || "Please try again", variant: "destructive" });
      return;
    }
    toast({ title: "Stale device cleared", description: `${staleDeviceId} can now be registered again.` });
    await loadBase();
  };

  const removeDevice = async (id: string, name: string) => {
    if (!window.confirm(`Remove ${name} from this branch? After removal, its Device ID can be registered to another shop.`)) return;
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

  const beginEditDevice = (device: any) => {
    setEditingDeviceId(String(device.id));
    setEditDeviceName(String(device.deviceName || ""));
    setEditBranchId(String(device.branchId || ""));
    setEditNotes(String(device.notes || ""));
    setEditHardwareModel(String(device.hardwareModel || "BK7231N-MOUSE-V1"));
  };

  const cancelEditDevice = () => {
    setEditingDeviceId("");
    setEditDeviceName("");
    setEditBranchId("");
    setEditNotes("");
    setEditHardwareModel("");
  };

  const saveEditedDevice = async (device: any) => {
    if (!editDeviceName.trim() || !editBranchId) {
      toast({
        title: "Missing information",
        description: "Enter a device name and choose the correct branch.",
        variant: "destructive",
      });
      return;
    }

    setSavingDevice(true);
    try {
      const response = await fetch(`/api/iot/devices/${device.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          deviceName: editDeviceName.trim(),
          branchId: editBranchId,
          notes: editNotes.trim(),
          hardwareModel: editHardwareModel.trim() || "BK7231N-MOUSE-V1",
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast({
          title: "Could not update device",
          description: data?.message || "Please try again",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Device updated",
        description: `${data?.deviceName || editDeviceName} is assigned to ${branchById.get(editBranchId) || "the selected branch"}.`,
      });
      const nextBranchId = editBranchId;
      cancelEditDevice();
      setActiveBranchId(nextBranchId);
      setBranchSearch(branchById.get(nextBranchId) || "");
      await loadBase();
    } finally {
      setSavingDevice(false);
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
          <div className="relative">
            <label className="mb-1 block text-xs font-medium text-slate-400">Branch</label>
            <button
              type="button"
              onClick={() => setBranchMenuOpen((open) => !open)}
              className="flex w-full items-center justify-between rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-left text-sm text-white"
            >
              <span className="truncate">{branchById.get(branchId) || "Select customer branch..."}</span>
              <span className="ml-3 text-slate-400">⌄</span>
            </button>
            {branchMenuOpen && (
              <div className="absolute left-0 right-0 top-full z-[9999] mt-1 max-h-64 overflow-y-auto rounded-md border border-slate-600 bg-slate-950 p-1 shadow-2xl">
                {branches.length ? branches.map((branch) => (
                  <button
                    type="button"
                    key={branch.id}
                    onClick={() => {
                      setBranchId(branch.id);
                      setActiveBranchId(branch.id);
                      setBranchSearch(branch.name);
                      setBranchMenuOpen(false);
                    }}
                    className="block w-full rounded px-3 py-2 text-left text-sm text-white hover:bg-cyan-600/30 focus:bg-cyan-600/30"
                  >
                    {branch.name}
                  </button>
                )) : (
                  <div className="p-3 text-sm text-amber-200">
                    {branchLoadError || "No customer branches loaded."}
                  </div>
                )}
              </div>
            )}
            {branchLoadError && (
              <button
                type="button"
                onClick={() => loadBase().catch(() => {})}
                className="mt-2 text-xs font-medium text-cyan-300 hover:text-cyan-200"
              >
                Refresh customer branches
              </button>
            )}
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
            <label className="mb-1 block text-xs font-medium text-slate-400">Installation Area / Notes</label>
            <Input
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="e.g. Kitchen, back door, storage area, bathroom"
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
            Device created: <span className="font-mono font-semibold">{lastCreatedId}</span>. It becomes Connected when the physical trap connects to your Food Safety gateway using this ID.
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-cyan-500/30 bg-slate-800/65 p-5">
        <div className="mb-4 flex items-center gap-2">
          <Wifi className="h-4 w-4 text-cyan-300" />
          <h3 className="font-semibold text-white">Food Safety Wireless Activation</h3>
        </div>
        <p className="text-sm text-slate-300">
          Devices use the proven Food Safety path: trap firmware → customer 2.4 GHz Wi-Fi → HP2 Mosquitto → Pest Control.
          This Admin page registers and assigns devices; it does not pretend to program factory Wi-Fi from the browser.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-3">
            <p className="text-[11px] uppercase tracking-wide text-slate-500">Gateway / MQTT Host</p>
            <p className="mt-1 font-mono text-sm font-semibold text-white">192.168.0.14</p>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-3">
            <p className="text-[11px] uppercase tracking-wide text-slate-500">MQTT Port</p>
            <p className="mt-1 font-mono text-sm font-semibold text-white">1883</p>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-3">
            <p className="text-[11px] uppercase tracking-wide text-slate-500">Transport</p>
            <p className="mt-1 text-sm font-semibold text-white">{systemStatus?.transport || "MQTT / Wi-Fi"}</p>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-3">
            <p className="text-[11px] uppercase tracking-wide text-slate-500">Registered Devices</p>
            <p className="mt-1 text-sm font-semibold text-white">{systemStatus?.registeredDevices ?? ownedDevices.length}</p>
          </div>
        </div>

        <p className="mt-3 text-xs text-slate-400">
          A registered trap changes to Connected automatically after its real wireless gateway event reaches Pest Control.
          No customer Wi-Fi password is stored or copied by this dashboard.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-700 bg-slate-800/65 p-5">
        <div className="mb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="relative w-full max-w-xl">
              <label className="mb-1 block text-xs font-medium text-slate-400">Search Branch / Shop</label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input
                  value={branchSearch}
                  onFocus={() => setBranchSearchOpen(true)}
                  onChange={(event) => {
                    setBranchSearch(event.target.value);
                    setBranchSearchOpen(true);
                  }}
                  placeholder="Type shop name, address or postcode..."
                  className="border-slate-600 bg-slate-900 pl-9 text-white"
                />
              </div>
              {branchSearchOpen && (
                <div className="absolute left-0 right-0 top-full z-[9999] mt-1 max-h-72 overflow-y-auto rounded-md border border-slate-600 bg-slate-950 p-1 shadow-2xl">
                  {branchSearchResults.length ? branchSearchResults.map((branch) => (
                    <button
                      type="button"
                      key={branch.id}
                      onClick={() => {
                        setActiveBranchId(branch.id);
                        setBranchSearch(branch.name);
                        setBranchSearchOpen(false);
                        setBranchId(branch.id);
                      }}
                      className="block w-full rounded px-3 py-2 text-left hover:bg-cyan-600/25"
                    >
                      <span className="block text-sm font-medium text-white">{branch.name}</span>
                      {(branch.address || branch.postCode) && (
                        <span className="mt-0.5 block text-xs text-slate-400">
                          {[branch.address, branch.postCode].filter(Boolean).join(", ")}
                        </span>
                      )}
                    </button>
                  )) : (
                    <div className="p-3 text-sm text-slate-400">No matching branch found.</div>
                  )}
                </div>
              )}
            </div>
            {activeBranch && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setActiveBranchId("");
                  setBranchSearch("");
                  setBranchId("");
                }}
                className="border-slate-600 text-slate-200"
              >
                Show another branch
              </Button>
            )}
          </div>

          {activeBranch ? (
            <div className="mt-4 overflow-hidden rounded-xl border border-cyan-500/25 bg-slate-900/60">
              <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_360px]">
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" />
                    <div className="min-w-0">
                      <p className="text-base font-semibold text-white">{activeBranch.name}</p>
                      <p className="mt-1 text-sm text-slate-400">
                        {[activeBranch.address, activeBranch.postCode].filter(Boolean).join(", ") || "No branch address saved yet."}
                      </p>
                      <p className="mt-2 text-xs text-cyan-200">
                        {activeBranchDevices.length} device{activeBranchDevices.length === 1 ? "" : "s"} assigned to this branch
                      </p>
                    </div>
                  </div>
                </div>
                {activeBranchMapQuery && (activeBranch.address || activeBranch.postCode) && (
                  <div className="h-48 border-t border-slate-700 lg:h-full lg:min-h-[180px] lg:border-l lg:border-t-0">
                    <iframe
                      title={`${activeBranch.name} map`}
                      src={`https://www.google.com/maps?q=${encodeURIComponent(activeBranchMapQuery)}&output=embed`}
                      className="h-full w-full border-0"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-slate-600 bg-slate-900/40 p-5 text-sm text-slate-400">
              Search and select one branch to see only that shop's devices.
            </div>
          )}
        </div>

        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 font-semibold text-white">
            <HardDrive className="h-4 w-4 text-emerald-300" />
            {activeBranch ? `${activeBranch.name} Devices (${activeBranchDevices.length})` : "Branch Devices"}
          </h3>
          <Button size="sm" variant="outline" onClick={() => loadBase()} className="border-slate-600 text-slate-200">
            <RefreshCw className="mr-1 h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>

        {!activeBranch ? (
          <div className="py-8 text-center text-sm text-slate-400">
            Select a branch above to view its devices.
          </div>
        ) : activeBranchDevices.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center text-slate-400">
            <p>No devices are assigned to {activeBranch.name} yet.</p>
            {deviceId.trim() && (
              <Button size="sm" variant="outline" onClick={recoverStaleDevice} className="border-amber-600/60 text-amber-200">
                <Trash2 className="mr-1 h-3 w-3" />
                Clear stale {deviceId.trim().toUpperCase()}
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {activeBranchDevices.map((device: any, index: number) => {
              const snap = deviceSnapshot(device.lastStatus);
              return (
                <div key={device.id} className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-white">Device {index + 1} — {device.deviceName}</p>
                      <p className="mt-0.5 text-xs text-slate-400">{branchById.get(device.branchId) || device.branchName || "Assigned branch"}</p>
                      <p className="mt-1 break-all font-mono text-[11px] text-slate-500">{device.deviceId}</p>
                    </div>
                    <Badge className={device.isOnline ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-700 text-slate-300"}>
                      {device.isOnline ? "Connected" : (snap.state === "awaiting_activation" ? "Awaiting activation" : "Disconnected")}
                    </Badge>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                    <div className="rounded-lg bg-slate-800 p-2"><span className="block text-slate-500">System</span><span className="text-white">Food Safety Owned</span></div>
                    <div className="rounded-lg bg-slate-800 p-2"><span className="block text-slate-500">Battery</span><span className="text-white">{snap.battery || "—"}</span></div>
                    <div className="rounded-lg bg-slate-800 p-2"><span className="block text-slate-500">Status</span><span className="text-white">{snap.state || (device.isOnline ? "Connected" : "Disconnected")}</span></div>
                    <div className={`rounded-lg p-2 ${device.alarmActive ? "bg-red-500/20" : "bg-slate-800"}`}><span className="block text-slate-500">Trap</span><span className={device.alarmActive ? "font-bold text-red-300" : "text-white"}>{device.alarmActive ? "Mouse Caught" : "Ready"}</span></div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                    <Wifi className="h-3.5 w-3.5" />
                    <span>Wi-Fi / MQTT</span>
                    <span>• UK time: {formatUkDateTime(ukNow)}</span>
                    <span>
                      {device.lastCheckedAt
                        ? `• Last seen: ${formatUkDateTime(device.lastCheckedAt)}`
                        : "• Last seen: Never"}
                    </span>
                  </div>

                  {device.notes && <p className="mt-2 text-xs text-slate-400">Installation area: {device.notes}</p>}

                  {editingDeviceId === String(device.id) && (
                    <div className="mt-4 rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-3">
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-cyan-100">Edit / Reassign this device</p>
                          <p className="text-[11px] text-slate-400">Device ID stays fixed: {device.deviceId}</p>
                        </div>
                        <Button size="sm" variant="ghost" onClick={cancelEditDevice} className="text-slate-300 hover:text-white">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-[11px] font-medium text-slate-400">Friendly Device Name</label>
                          <Input
                            value={editDeviceName}
                            onChange={(event) => setEditDeviceName(event.target.value)}
                            className="border-slate-600 bg-slate-950 text-white"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-[11px] font-medium text-slate-400">Shop / Branch</label>
                          <select
                            value={editBranchId}
                            onChange={(event) => setEditBranchId(event.target.value)}
                            className="h-10 w-full rounded-md border border-slate-600 bg-slate-950 px-3 text-sm text-white"
                          >
                            <option value="">Select customer branch...</option>
                            {branches.map((branch) => (
                              <option key={branch.id} value={branch.id}>{branch.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-[11px] font-medium text-slate-400">Installation Area</label>
                          <Input
                            value={editNotes}
                            onChange={(event) => setEditNotes(event.target.value)}
                            placeholder="Kitchen / Wall, Back Door, Storage..."
                            className="border-slate-600 bg-slate-950 text-white"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-[11px] font-medium text-slate-400">Hardware Model</label>
                          <Input
                            value={editHardwareModel}
                            onChange={(event) => setEditHardwareModel(event.target.value)}
                            className="border-slate-600 bg-slate-950 text-white"
                          />
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          onClick={() => saveEditedDevice(device)}
                          disabled={savingDevice}
                          className="bg-cyan-600 text-white hover:bg-cyan-500"
                        >
                          {savingDevice ? <RefreshCw className="mr-1 h-3 w-3 animate-spin" /> : <Save className="mr-1 h-3 w-3" />}
                          {savingDevice ? "Saving..." : "Save Device"}
                        </Button>
                        <Button size="sm" variant="outline" onClick={cancelEditDevice} className="border-slate-600 text-slate-200">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => refreshDevice(device.id)} className="border-slate-600 text-slate-200">
                      <RefreshCw className="mr-1 h-3 w-3" />
                      Refresh
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => beginEditDevice(device)} className="border-cyan-700/60 text-cyan-200">
                      <Pencil className="mr-1 h-3 w-3" />
                      Edit / Reassign
                    </Button>
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
          <p>New devices use only your Food Safety device registry and HP2 MQTT/Wi-Fi gateway. Device connection state comes from real gateway events, not a browser setup page.</p>
        </div>
      </div>
    </div>
  );
}
