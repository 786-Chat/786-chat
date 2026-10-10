import { useEffect, useMemo, useState } from "react";
import { HardDrive, LockKeyhole, MapPin, Pencil, Plus, RefreshCw, Save, Search, ShieldCheck, Trash2, Wifi, X, Zap } from "lucide-react";
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
  const [deviceBackup, setDeviceBackup] = useState<any>(null);
  const [backingUpDevices, setBackingUpDevices] = useState(false);
  const [restoringDevices, setRestoringDevices] = useState(false);
  const [restoreBackupConfirm, setRestoreBackupConfirm] = useState(false);
  const [allDeviceBackup, setAllDeviceBackup] = useState<any>(null);
  const [branchDeviceBackup, setBranchDeviceBackup] = useState<any>(null);
  const [backupBusyKey, setBackupBusyKey] = useState("");
  const [restoreBusyKey, setRestoreBusyKey] = useState("");
  const [pendingRestore, setPendingRestore] = useState<any>(null);
  const [restorePinRequest, setRestorePinRequest] = useState<any>(null);
  const [restorePin, setRestorePin] = useState("");
  const [restorePinError, setRestorePinError] = useState("");
  const [verifyingRestorePin, setVerifyingRestorePin] = useState(false);
  const [backupPinRequest, setBackupPinRequest] = useState<any>(null);
  const [backupPin, setBackupPin] = useState("");
  const [backupPinError, setBackupPinError] = useState("");
  const [verifyingBackupPin, setVerifyingBackupPin] = useState(false);

  const [branchMenuOpen, setBranchMenuOpen] = useState(false);
  const [deviceMenuOpen, setDeviceMenuOpen] = useState(false);
  const [branchLoadError, setBranchLoadError] = useState("");
  const [wifiDeviceId, setWifiDeviceId] = useState("");
  const [wifiSsid, setWifiSsid] = useState("");
  const [wifiPassword, setWifiPassword] = useState("");
  const [setupAddress, setSetupAddress] = useState("http://192.168.4.1");
  const [gatewayHost, setGatewayHost] = useState("192.168.0.14");
  const [gatewayPort, setGatewayPort] = useState("1883");
  const [sendingWifi, setSendingWifi] = useState(false);
  const [editingDeviceId, setEditingDeviceId] = useState("");
  const [editDeviceName, setEditDeviceName] = useState("");
  const [editBranchId, setEditBranchId] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editHardwareModel, setEditHardwareModel] = useState("");
  const [savingDevice, setSavingDevice] = useState(false);
  const [pendingRemoveDeviceId, setPendingRemoveDeviceId] = useState("");
  const [removingDeviceId, setRemovingDeviceId] = useState("");
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
    loadLatestScopedBackup("all").then(setAllDeviceBackup).catch(() => {});
    const timer = window.setInterval(() => loadBase().catch(() => {}), 20000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const current = ownedDevices.find((device: any) => String(device.deviceId) === String(wifiDeviceId));
    if (activeBranchId && current && String(current.branchId) !== String(activeBranchId)) {
      setWifiDeviceId("");
      return;
    }
    if (!wifiDeviceId) {
      const first = activeBranchId ? activeBranchDevices[0] : undefined;
      if (first) setWifiDeviceId(String(first.deviceId || ""));
    }
  }, [ownedDevices, activeBranchDevices, activeBranchId, wifiDeviceId]);

  const scopedBackupKey = (scope: "all" | "branch" | "device", scopeId = "") =>
    `${scope}:${scopeId || "all"}`;

  const loadLatestScopedBackup = async (scope: "all" | "branch" | "device", scopeId = "") => {
    const params = new URLSearchParams({ scope });
    if (scope !== "all") params.set("scopeId", scopeId);
    const response = await fetch(`/api/iot/device-backups/latest?${params.toString()}`, {
      credentials: "include",
      cache: "no-store",
    });
    if (!response.ok) return null;
    const data = await response.json().catch(() => ({}));
    return data?.backup || null;
  };

  const backupScopedDevices = async (
    scope: "all" | "branch" | "device",
    scopeId = "",
    label = "",
    backupGrant = "",
  ) => {
    const key = scopedBackupKey(scope, scopeId);
    setBackupBusyKey(key);
    try {
      const response = await fetch("/api/iot/device-backups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ scope, scopeId, label, backupGrant }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast({ title: "Backup failed", description: data?.message || "Could not back up devices", variant: "destructive" });
        return;
      }

      if (scope === "all") setAllDeviceBackup(data?.backup || null);
      if (scope === "branch" && scopeId === activeBranchId) setBranchDeviceBackup(data?.backup || null);
      setPendingRestore(null);
      toast({
        title: scope === "device" ? "Device backup saved" : scope === "branch" ? "Branch backup saved" : "All-device backup saved",
        description: `${data?.backup?.device_count ?? 0} device${Number(data?.backup?.device_count || 0) === 1 ? "" : "s"} saved. Customer data and live telemetry are not copied or changed.`,
      });
    } finally {
      setBackupBusyKey("");
    }
  };

  const prepareScopedBackup = (
    scope: "all" | "branch" | "device",
    scopeId = "",
    label = "",
  ) => {
    const key = scopedBackupKey(scope, scopeId);
    setBackupPin("");
    setBackupPinError("");
    setBackupPinRequest({ key, scope, scopeId, label });
  };

  const cancelBackupPin = () => {
    if (verifyingBackupPin) return;
    setBackupPinRequest(null);
    setBackupPin("");
    setBackupPinError("");
  };

  const verifyBackupPin = async () => {
    if (!backupPinRequest || !backupPin.trim()) {
      setBackupPinError("Enter the backup PIN.");
      return;
    }

    setVerifyingBackupPin(true);
    setBackupPinError("");
    try {
      const response = await fetch("/api/iot/device-backups/verify-restore-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "backup",
          pin: backupPin,
          scope: backupPinRequest.scope,
          scopeId: backupPinRequest.scopeId,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.backupGrant) {
        setBackupPinError(data?.message || "Incorrect PIN.");
        return;
      }

      const request = backupPinRequest;
      setBackupPinRequest(null);
      setBackupPin("");
      setBackupPinError("");
      await backupScopedDevices(
        request.scope,
        request.scopeId,
        request.label,
        String(data.backupGrant),
      );
    } finally {
      setVerifyingBackupPin(false);
    }
  };

  const prepareScopedRestore = async (
    scope: "all" | "branch" | "device",
    scopeId = "",
    label = "",
  ) => {
    const key = scopedBackupKey(scope, scopeId);
    const backup = await loadLatestScopedBackup(scope, scopeId);
    if (!backup?.id) {
      toast({
        title: "No backup saved",
        description: scope === "device"
          ? "Back up this device first."
          : scope === "branch"
            ? "Back up this branch first."
            : "Create an all-device backup first.",
        variant: "destructive",
      });
      return;
    }

    setPendingRestore(null);
    setRestorePin("");
    setRestorePinError("");
    setRestorePinRequest({ key, scope, scopeId, label, backup });
  };

  const cancelRestorePin = () => {
    if (verifyingRestorePin) return;
    setRestorePinRequest(null);
    setRestorePin("");
    setRestorePinError("");
  };

  const verifyRestorePin = async () => {
    if (!restorePinRequest || !restorePin.trim()) {
      setRestorePinError("Enter the restore PIN.");
      return;
    }

    setVerifyingRestorePin(true);
    setRestorePinError("");
    try {
      const response = await fetch("/api/iot/device-backups/verify-restore-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "restore",
          pin: restorePin,
          scope: restorePinRequest.scope,
          scopeId: restorePinRequest.scopeId,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.restoreGrant) {
        setRestorePinError(data?.message || "Incorrect PIN.");
        return;
      }

      setPendingRestore({
        ...restorePinRequest,
        restoreGrant: String(data.restoreGrant),
      });
      setRestorePinRequest(null);
      setRestorePin("");
      setRestorePinError("");
    } finally {
      setVerifyingRestorePin(false);
    }
  };

  const confirmScopedRestore = async () => {
    if (!pendingRestore?.backup?.id || !pendingRestore?.restoreGrant) return;
    const { key, scope, scopeId, backup, restoreGrant } = pendingRestore;
    setRestoreBusyKey(key);
    try {
      const response = await fetch(`/api/iot/device-backups/${backup.id}/restore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ scope, scopeId, restoreGrant }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setPendingRestore(null);
        toast({
          title: "Restore failed",
          description: data?.message || "Could not restore device setup",
          variant: "destructive",
        });
        return;
      }

      setPendingRestore(null);
      await loadBase();
      if (scope === "all") setAllDeviceBackup(await loadLatestScopedBackup("all"));
      if (scope === "branch" && scopeId === activeBranchId) setBranchDeviceBackup(await loadLatestScopedBackup("branch", scopeId));
      toast({
        title: scope === "device" ? "Device restored" : scope === "branch" ? "Branch devices restored" : "All devices restored",
        description: data?.message || "Saved device assignments are back.",
      });
    } finally {
      setRestoreBusyKey("");
    }
  };

  useEffect(() => {
    if (!activeBranchId) {
      setBranchDeviceBackup(null);
      return;
    }
    loadLatestScopedBackup("branch", activeBranchId).then(setBranchDeviceBackup).catch(() => setBranchDeviceBackup(null));
  }, [activeBranchId]);

  const loadDeviceBackup = async () => {
    const response = await fetch("/api/iot/device-backups/latest", { credentials: "include", cache: "no-store" });
    if (!response.ok) return;
    const data = await response.json().catch(() => ({}));
    setDeviceBackup(data?.backup || null);
  };

  const backupWorkingDeviceSetup = async () => {
    setBackingUpDevices(true);
    try {
      const response = await fetch("/api/iot/device-backups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ label: "Working device setup" }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast({ title: "Backup failed", description: data?.message || "Could not back up devices", variant: "destructive" });
        return;
      }
      setDeviceBackup(data?.backup || null);
      setRestoreBackupConfirm(false);
      toast({ title: "Device setup backed up", description: `${data?.backup?.device_count ?? ownedDevices.length} assigned device(s) saved.` });
    } finally {
      setBackingUpDevices(false);
    }
  };

  const restoreWorkingDeviceSetup = async () => {
    if (!deviceBackup?.id) return;
    setRestoringDevices(true);
    try {
      const response = await fetch(`/api/iot/device-backups/${deviceBackup.id}/restore`, { method: "POST", credentials: "include" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast({ title: "Restore failed", description: data?.message || "Could not restore device setup", variant: "destructive" });
        return;
      }
      setRestoreBackupConfirm(false);
      await loadBase();
      await loadDeviceBackup();
      toast({ title: "Device setup restored", description: data?.message || "Saved device assignments are back." });
    } finally {
      setRestoringDevices(false);
    }
  };
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
      setActiveBranchId(branchId);
      setBranchSearch(branchById.get(branchId) || "");
      setBranchId("");
      setNotes("");
      await loadBase();
    } finally {
      setRegistering(false);
    }
  };

  const removeDevice = async (id: string, name: string) => {
    setRemovingDeviceId(id);
    try {
      const response = await fetch(`/api/iot/devices/${id}`, { method: "DELETE", credentials: "include" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast({ title: "Could not unassign device", description: data?.message || "Please try again", variant: "destructive" });
        return;
      }
      setPendingRemoveDeviceId("");
      toast({ title: "Device unassigned", description: `${name} is now available to assign to another shop.` });
      await loadBase();
    } finally {
      setRemovingDeviceId("");
    }
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

  const provisioningPayload = () => ({
    deviceId: wifiDeviceId,
    ssid: wifiSsid,
    password: wifiPassword,
    mqttHost: gatewayHost,
    mqttPort: Number(gatewayPort) || 1883,
  });

  const sendWifiDirect = async () => {
    if (!wifiDeviceId || !wifiSsid || !wifiPassword || !setupAddress.trim()) {
      toast({ title: "Wi-Fi details needed", description: "Choose the registered device, enter this shop\'s 2.4 GHz Wi-Fi name and password, then continue.", variant: "destructive" });
      return;
    }

    setSendingWifi(true);
    const base = setupAddress.trim().replace(/\/$/, "");
    const body = JSON.stringify(provisioningPayload(), null, 2);

    try {
      try {
        await navigator.clipboard.writeText(body);
      } catch (_) {}

      toast({
        title: "Device Wi-Fi setup ready",
        description: `Wi-Fi details are ready for ${wifiDeviceId}. No new window was opened. Keep this page open while the physical trap is in Food Safety setup mode.`,
      });
    } finally {
      setSendingWifi(false);
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

      <div className="rounded-2xl border border-amber-500/30 bg-slate-800/65 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-amber-300" />
              <h3 className="font-semibold text-white">Emergency All-Device Backup</h3>
            </div>
            <p className="mt-2 text-sm text-slate-300">
              Use this only for a whole-system device setup problem. For one restaurant or one trap, use the safer branch/device buttons below.
            </p>
            <p className="mt-1 text-xs text-slate-400">
              This never deletes customer branches, reports, alarm history or event history. Connected, battery and signal data always stay live from HP2.
            </p>
            {allDeviceBackup ? (
              <p className="mt-2 text-xs text-emerald-200">
                Last all-device backup: {new Date(allDeviceBackup.created_at).toLocaleString("en-GB", { timeZone: "Europe/London" })} · {allDeviceBackup.device_count} device(s)
              </p>
            ) : (
              <p className="mt-2 text-xs text-amber-200">No all-device backup saved yet.</p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              onClick={() => prepareScopedBackup("all", "", "Emergency all-device setup")}
              disabled={Boolean(backupBusyKey || restoreBusyKey)}
              className="bg-emerald-600 text-white hover:bg-emerald-500"
            >
              <LockKeyhole className="mr-2 h-4 w-4" />
              {backupBusyKey === scopedBackupKey("all") ? "Saving..." : "Backup All Devices"}
            </Button>
            {pendingRestore?.key === scopedBackupKey("all") ? (
              <>
                <Button
                  type="button"
                  onClick={confirmScopedRestore}
                  disabled={Boolean(restoreBusyKey)}
                  className="bg-red-600 text-white hover:bg-red-500"
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${restoreBusyKey === scopedBackupKey("all") ? "animate-spin" : ""}`} />
                  {restoreBusyKey === scopedBackupKey("all") ? "Restoring..." : "Confirm Restore ALL Devices"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPendingRestore(null)}
                  disabled={Boolean(restoreBusyKey)}
                  className="border-slate-600 text-slate-200"
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => prepareScopedRestore("all", "", "all devices")}
                disabled={Boolean(backupBusyKey || restoreBusyKey)}
                className="border-red-700/60 text-red-200"
              >
                <LockKeyhole className="mr-2 h-4 w-4" />
                Restore All Devices
              </Button>
            )}
          </div>
        </div>
      </div>
      <div className="rounded-2xl border border-emerald-500/30 bg-slate-800/65 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-300" />
              <h3 className="font-semibold text-white">Device Setup Backup</h3>
            </div>
            <p className="mt-2 text-sm text-slate-300">
              Save the working Device IDs, names and branch assignments before changing Add Device settings.
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Restore never fakes Connected, last-seen, alarm, battery or signal data. Those still come only from the real HP2 gateway.
            </p>
            {deviceBackup ? (
              <p className="mt-2 text-xs text-emerald-200">
                Last working backup: {new Date(deviceBackup.created_at).toLocaleString("en-GB", { timeZone: "Europe/London" })} · {deviceBackup.device_count} device(s)
              </p>
            ) : (
              <p className="mt-2 text-xs text-amber-200">No manual working-device backup saved yet.</p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              onClick={backupWorkingDeviceSetup}
              disabled={backingUpDevices || restoringDevices}
              className="bg-emerald-600 text-white hover:bg-emerald-500"
            >
              <Save className="mr-2 h-4 w-4" />
              {backingUpDevices ? "Saving Backup..." : "Backup Working Setup"}
            </Button>
            {restoreBackupConfirm ? (
              <>
                <Button
                  type="button"
                  onClick={restoreWorkingDeviceSetup}
                  disabled={!deviceBackup?.id || restoringDevices}
                  className="bg-amber-600 text-white hover:bg-amber-500"
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${restoringDevices ? "animate-spin" : ""}`} />
                  {restoringDevices ? "Restoring..." : "Confirm Restore"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRestoreBackupConfirm(false)}
                  disabled={restoringDevices}
                  className="border-slate-600 text-slate-200"
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => setRestoreBackupConfirm(true)}
                disabled={!deviceBackup?.id || backingUpDevices || restoringDevices}
                className="border-amber-600/70 text-amber-200"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Restore Last Backup
              </Button>
            )}
          </div>
        </div>
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
            <p className="mt-1 text-[11px] text-slate-500">Leave blank to create the next ID. An existing ID can only be assigned after it has been removed from its previous shop.</p>
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
          Admin-only setup for the physical trap. Choose the device and enter the local 2.4 GHz Wi-Fi details.
          The Wi-Fi password is kept only in this browser session and is never saved in Neon.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Device</label>
            <select
              value={wifiDeviceId}
              onChange={(event) => setWifiDeviceId(event.target.value)}
              className="h-10 w-full rounded-md border border-slate-600 bg-slate-900 px-3 text-sm text-white"
            >
              <option value="">Select registered device...</option>
              {(activeBranch ? activeBranchDevices : ownedDevices).map((device: any) => (
                <option key={device.id} value={device.deviceId}>
                  {device.deviceName || device.deviceId} — {device.deviceId}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Wi-Fi Name (SSID)</label>
            <Input
              value={wifiSsid}
              onChange={(event) => setWifiSsid(event.target.value)}
              placeholder="Customer / home 2.4 GHz Wi-Fi"
              autoComplete="off"
              className="border-slate-600 bg-slate-900 text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Wi-Fi Password</label>
            <Input
              type="password"
              value={wifiPassword}
              onChange={(event) => setWifiPassword(event.target.value)}
              placeholder="Enter Wi-Fi password"
              autoComplete="new-password"
              className="border-slate-600 bg-slate-900 text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Device Setup Address</label>
            <Input
              value={setupAddress}
              onChange={(event) => setSetupAddress(event.target.value)}
              placeholder="http://192.168.4.1"
              className="border-slate-600 bg-slate-900 font-mono text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">HP2 / MQTT Host</label>
            <Input
              value={gatewayHost}
              onChange={(event) => setGatewayHost(event.target.value)}
              className="border-slate-600 bg-slate-900 font-mono text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">MQTT Port</label>
            <Input
              value={gatewayPort}
              onChange={(event) => setGatewayPort(event.target.value.replace(/[^0-9]/g, ""))}
              inputMode="numeric"
              className="border-slate-600 bg-slate-900 font-mono text-white"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button
            type="button"
            onClick={sendWifiDirect}
            disabled={sendingWifi || !wifiDeviceId || !wifiSsid || !wifiPassword}
            className="bg-cyan-600 text-white hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sendingWifi ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Wifi className="mr-2 h-4 w-4" />}
            {sendingWifi ? "Preparing..." : "Prepare Wi-Fi Setup"}
          </Button>
          <p className="text-xs text-slate-400">
            No new tab opens. This prepares the details for the physical trap setup; it does not fake a Connected status.
          </p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-3">
            <p className="text-[11px] uppercase tracking-wide text-slate-500">Gateway / MQTT Host</p>
            <p className="mt-1 break-all font-mono text-sm font-semibold text-white">{gatewayHost || "192.168.0.14"}</p>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-3">
            <p className="text-[11px] uppercase tracking-wide text-slate-500">MQTT Port</p>
            <p className="mt-1 font-mono text-sm font-semibold text-white">{gatewayPort || "1883"}</p>
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
                        const first = ownedDevices.find((device: any) => String(device.branchId) === String(branch.id));
                        setWifiDeviceId(first ? String(first.deviceId || "") : "");
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
                  setWifiDeviceId("");
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
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => prepareScopedBackup("branch", activeBranch.id, `${activeBranch.name} device setup`)}
                          disabled={!activeBranchDevices.length || Boolean(backupBusyKey || restoreBusyKey)}
                          className="bg-emerald-600 text-white hover:bg-emerald-500"
                        >
                          <LockKeyhole className="mr-1 h-3.5 w-3.5" />
                          {backupBusyKey === scopedBackupKey("branch", activeBranch.id) ? "Saving..." : "Backup This Branch"}
                        </Button>
                        {pendingRestore?.key === scopedBackupKey("branch", activeBranch.id) ? (
                          <>
                            <Button
                              type="button"
                              size="sm"
                              onClick={confirmScopedRestore}
                              disabled={Boolean(restoreBusyKey)}
                              className="bg-amber-600 text-white hover:bg-amber-500"
                            >
                              <RefreshCw className={`mr-1 h-3.5 w-3.5 ${restoreBusyKey === scopedBackupKey("branch", activeBranch.id) ? "animate-spin" : ""}`} />
                              {restoreBusyKey === scopedBackupKey("branch", activeBranch.id) ? "Restoring..." : "Confirm Branch Restore"}
                            </Button>
                            <Button type="button" size="sm" variant="outline" onClick={() => setPendingRestore(null)} className="border-slate-600 text-slate-200">
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => prepareScopedRestore("branch", activeBranch.id, activeBranch.name)}
                            disabled={!activeBranchDevices.length || Boolean(backupBusyKey || restoreBusyKey)}
                            className="border-amber-700/60 text-amber-200"
                          >
                            <LockKeyhole className="mr-1 h-3.5 w-3.5" />
                            Restore This Branch
                          </Button>
                        )}
                      </div>
                      <p className="mt-2 text-[11px] text-slate-500">
                        {branchDeviceBackup
                          ? `Last branch backup: ${new Date(branchDeviceBackup.created_at).toLocaleString("en-GB", { timeZone: "Europe/London" })}`
                          : "No backup saved for this branch yet."}
                      </p>
                    </div>
                  </div>
                </div>
                {activeBranchMapQuery && (activeBranch.address || activeBranch.postCode) && (
                  <div className="relative h-48 overflow-hidden border-t border-slate-700 lg:h-full lg:min-h-[180px] lg:border-l lg:border-t-0">
                    <iframe
                      title={`${activeBranch.name} map`}
                      src={`https://www.google.com/maps?q=${encodeURIComponent(activeBranchMapQuery)}&output=embed`}
                      className="h-full w-full border-0"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                    {activeBranchDevices.length > 0 && (
                      <div className="pointer-events-none absolute bottom-2 left-2 right-2 flex flex-wrap gap-1.5">
                        {activeBranchDevices.slice(0, 4).map((device: any, index: number) => (
                          <div
                            key={device.id}
                            className="flex max-w-full items-center gap-1.5 rounded-full border border-slate-600/80 bg-slate-950/90 px-2.5 py-1 text-[11px] text-white shadow-lg backdrop-blur"
                          >
                            <span aria-hidden="true">🐭</span>
                            <span className="font-semibold">Device {index + 1}</span>
                            <span className={device.isOnline ? "text-emerald-300" : "text-slate-400"}>
                              {device.isOnline ? "● Connected" : "● Offline"}
                            </span>
                            <span className="truncate text-cyan-200">• {device.notes || "Installation area not set"}</span>
                          </div>
                        ))}
                      </div>
                    )}
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

                  <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                    <Wifi className="h-3.5 w-3.5" />
                    Wi-Fi / MQTT
                    {device.lastCheckedAt ? ` • Last seen ${new Date(device.lastCheckedAt).toLocaleString("en-GB")}` : ""}
                  </div>

                  {device.notes && <p className="mt-2 text-xs text-slate-400">Installation area: {device.notes}</p>}

                  {editingDeviceId === String(device.id) && (
                    <div className="mt-4 rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-3">
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-cyan-100">Edit this device</p>
                          <p className="text-[11px] text-slate-400">Device ID stays fixed: {device.deviceId}. To move shops, remove it first, then register the same ID at the new branch.</p>
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

                  <div className="mt-4 rounded-lg border border-slate-700/70 bg-slate-950/35 p-2">
                    <p className="mb-2 text-[11px] font-medium text-slate-400">Safe backup for this device only</p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => prepareScopedBackup("device", String(device.deviceId), `${device.deviceName || device.deviceId} device setup`)}
                        disabled={Boolean(backupBusyKey || restoreBusyKey)}
                        className="bg-emerald-700 text-white hover:bg-emerald-600"
                      >
                        <LockKeyhole className="mr-1 h-3 w-3" />
                        {backupBusyKey === scopedBackupKey("device", String(device.deviceId)) ? "Saving..." : "Backup Device"}
                      </Button>
                      {pendingRestore?.key === scopedBackupKey("device", String(device.deviceId)) ? (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            onClick={confirmScopedRestore}
                            disabled={Boolean(restoreBusyKey)}
                            className="bg-amber-600 text-white hover:bg-amber-500"
                          >
                            <RefreshCw className={`mr-1 h-3 w-3 ${restoreBusyKey === scopedBackupKey("device", String(device.deviceId)) ? "animate-spin" : ""}`} />
                            {restoreBusyKey === scopedBackupKey("device", String(device.deviceId)) ? "Restoring..." : "Confirm Device Restore"}
                          </Button>
                          <Button type="button" size="sm" variant="outline" onClick={() => setPendingRestore(null)} className="border-slate-600 text-slate-200">
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => prepareScopedRestore("device", String(device.deviceId), String(device.deviceName || device.deviceId))}
                          disabled={Boolean(backupBusyKey || restoreBusyKey)}
                          className="border-amber-700/60 text-amber-200"
                        >
                          <LockKeyhole className="mr-1 h-3 w-3" />
                          Restore Device
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => refreshDevice(device.id)} className="border-slate-600 text-slate-200">
                      <RefreshCw className="mr-1 h-3 w-3" />
                      Refresh
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => beginEditDevice(device)} className="border-cyan-700/60 text-cyan-200">
                      <Pencil className="mr-1 h-3 w-3" />
                      Edit / Reassign
                    </Button>
                    {pendingRemoveDeviceId === String(device.id) ? (
                      <>
                        <Button
                          size="sm"
                          onClick={() => removeDevice(String(device.id), String(device.deviceName || device.deviceId))}
                          disabled={removingDeviceId === String(device.id)}
                          className="bg-red-600 text-white hover:bg-red-500"
                        >
                          <Trash2 className="mr-1 h-3 w-3" />
                          {removingDeviceId === String(device.id) ? "Unassigning..." : "Confirm Unassign"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setPendingRemoveDeviceId("")}
                          disabled={removingDeviceId === String(device.id)}
                          className="border-slate-600 text-slate-200"
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPendingRemoveDeviceId(String(device.id))}
                        className="border-red-700/60 text-red-300"
                      >
                        <Trash2 className="mr-1 h-3 w-3" />
                        Unassign Device
                      </Button>
                    )}
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

      {backupPinRequest && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-600 bg-slate-900 p-5 shadow-2xl">
            <div className="mb-2 flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <LockKeyhole className="h-5 w-5 text-emerald-300" />
                <h3 className="text-lg font-semibold text-white">Smart Devices Backup Security</h3>
              </div>
              <button
                type="button"
                onClick={cancelBackupPin}
                disabled={verifyingBackupPin}
                className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-50"
                aria-label="Close backup PIN"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mb-4 text-sm text-slate-300">
              Enter the admin PIN to create this {backupPinRequest.scope === "device" ? "device" : backupPinRequest.scope === "branch" ? "branch" : "all-device"} backup.
            </p>

            <label className="mb-1 block text-xs font-medium text-slate-400">PIN</label>
            <Input
              type="password"
              value={backupPin}
              onChange={(event) => {
                setBackupPin(event.target.value);
                if (backupPinError) setBackupPinError("");
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !verifyingBackupPin) verifyBackupPin();
              }}
              autoFocus
              autoComplete="off"
              placeholder="Enter your PIN"
              className="border-slate-600 bg-slate-800 text-white"
            />

            {backupPinError && (
              <p className="mt-2 text-sm text-red-300">{backupPinError}</p>
            )}

            <p className="mt-2 text-xs text-slate-500">
              The server checks the same protected PIN before the backup is created.
            </p>

            <div className="mt-5 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={cancelBackupPin}
                disabled={verifyingBackupPin}
                className="border-slate-600 text-slate-200"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={verifyBackupPin}
                disabled={verifyingBackupPin || !backupPin.trim()}
                className="bg-emerald-600 text-white hover:bg-emerald-500"
              >
                <LockKeyhole className="mr-2 h-4 w-4" />
                {verifyingBackupPin ? "Checking PIN..." : "Unlock & Backup"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {restorePinRequest && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-600 bg-slate-900 p-5 shadow-2xl">
            <div className="mb-2 flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <LockKeyhole className="h-5 w-5 text-amber-300" />
                <h3 className="text-lg font-semibold text-white">Smart Devices Restore Security</h3>
              </div>
              <button
                type="button"
                onClick={cancelRestorePin}
                disabled={verifyingRestorePin}
                className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-50"
                aria-label="Close restore PIN"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mb-4 text-sm text-slate-300">
              Enter the admin restore PIN to unlock this {restorePinRequest.scope === "device" ? "device" : restorePinRequest.scope === "branch" ? "branch" : "all-device"} restore.
            </p>

            <label className="mb-1 block text-xs font-medium text-slate-400">PIN</label>
            <Input
              type="password"
              value={restorePin}
              onChange={(event) => {
                setRestorePin(event.target.value);
                if (restorePinError) setRestorePinError("");
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !verifyingRestorePin) verifyRestorePin();
              }}
              autoFocus
              autoComplete="off"
              placeholder="Enter your PIN"
              className="border-slate-600 bg-slate-800 text-white"
            />

            {restorePinError && (
              <p className="mt-2 text-sm text-red-300">{restorePinError}</p>
            )}

            <p className="mt-2 text-xs text-slate-500">
              The PIN unlocks only this restore action. The server checks it again before any device assignment is changed.
            </p>

            <div className="mt-5 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={cancelRestorePin}
                disabled={verifyingRestorePin}
                className="border-slate-600 text-slate-200"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={verifyRestorePin}
                disabled={verifyingRestorePin || !restorePin.trim()}
                className="bg-amber-600 text-white hover:bg-amber-500"
              >
                <LockKeyhole className="mr-2 h-4 w-4" />
                {verifyingRestorePin ? "Checking PIN..." : "Unlock Restore"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
