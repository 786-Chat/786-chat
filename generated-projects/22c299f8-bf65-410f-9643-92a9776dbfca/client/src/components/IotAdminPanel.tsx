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

// A sleeping radio, powered-off device and lost connection all look the same
// until an authenticated MQTT report arrives. Never label absence as "OFF".
function getMouseConnectivity(device: any) {
  if (device.isOnline) {
    return {
      badge: "MQTT recently reported",
      status: "Recently reported — MQTT",
      detail: "Last authenticated gateway report received. This does not prove that Wi-Fi will stay awake.",
      active: true,
    };
  }
  if (device.lastCheckedAt) {
    return {
      badge: "Sleeping / No recent signal",
      status: "No recent MQTT signal",
      detail: "May be sleeping, out of range, or switched off. Power state is not verified; no reset needed.",
      active: false,
    };
  }
  return {
    badge: "Awaiting MQTT activation",
    status: "MQTT not yet verified",
    detail: "Registration is saved. No physical MQTT report has been verified yet.",
    active: false,
  };
}

// Only correlate observations by an exact factory AP name explicitly present
// in the saved device's friendly name. This is NOT authenticated identity.
function namedFactoryWifi(deviceName: unknown) {
  return String(deviceName || "").match(/\b(?:SmartLife-[A-Z0-9]+|OpenBK[A-Z0-9_-]+)\b/i)?.[0].toLowerCase() || "";
}

function deviceSnapshot(statusList: any[]) {
  const list = Array.isArray(statusList) ? statusList : [];
  let battery: string | null = null;
  let state: string | null = null;
  let mqttRssi: number | null = null;
  for (const item of list) {
    const code = normalize(item?.code || item?.name || item?.dpId);
    const raw = item?.value;
    if (code.includes("battery")) battery = typeof raw === "number" ? `${raw}%` : String(raw ?? "");
    if (code === "status" || code.includes("switch")) state = String(raw ?? "");
    if (code === "rssi" && raw !== null && raw !== undefined && Number.isFinite(Number(raw))) mqttRssi = Number(raw);
  }
  return { battery, state, mqttRssi };
}

export default function IotAdminPanel() {
  const { toast } = useToast();
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [assigned, setAssigned] = useState<any[]>([]);
  const [wifiObservations, setWifiObservations] = useState<any[]>([]);
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
  const [deviceSearch, setDeviceSearch] = useState("");
  const [branchSearchOpen, setBranchSearchOpen] = useState(false);
  const [advancedDeviceId, setAdvancedDeviceId] = useState("");
  const [showEmergencyTools, setShowEmergencyTools] = useState(false);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [showFactorySignals, setShowFactorySignals] = useState(true);
  const [showWifiDetails, setShowWifiDetails] = useState(false);
  const [nearbyWifiNetworks, setNearbyWifiNetworks] = useState<Array<{ ssid: string; frequency: number | null; signal: number | null }>>([]);
  const [routerScanStatus, setRouterScanStatus] = useState("No automatic HP2 router scan received yet.");
  const [routerScanReportedAt, setRouterScanReportedAt] = useState<string | null>(null);

  // Read the Smart Check handoff. This is only a temporary selection, not proof
  // of physical Wi-Fi provisioning, authenticated MQTT, or device ownership.
  const [smartCheckSelection, setSmartCheckSelection] = useState<{ ssid: string; mac: string } | null>(null);
  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem("pest-smart-check-selected-v1");
      if (!raw) return;
      const value = JSON.parse(raw);
      if (typeof value?.ssid !== "string" || typeof value?.mac !== "string") return;
      setSmartCheckSelection({ ssid: value.ssid, mac: value.mac });
    } catch (_) { /* Invalid handoff is ignored, never trusted */ }
  }, []);

  // Show each nearby 2.4 GHz router once, using the strongest reported signal.
  const local24Networks = useMemo(() => {
    const results = new Map<string, { ssid: string; frequency: number; signal: number }>();
    for (const observation of nearbyWifiNetworks) {
      if (!observation || typeof observation.ssid !== "string" ||
          typeof observation.frequency !== "number" ||
          observation.frequency < 2400 || observation.frequency >= 2500) continue;
      const signal = typeof observation.signal === "number" ? observation.signal : 0;
      const previous = results.get(observation.ssid);
      if (!previous || previous.signal < signal) {
        results.set(observation.ssid, { ssid: observation.ssid, frequency: observation.frequency, signal });
      }
    }
    return [...results.values()].sort((a, b) => b.signal - a.signal || a.ssid.localeCompare(b.ssid));
  }, [nearbyWifiNetworks]);

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
    () => activeBranchId ? ownedDevices.filter((device: any) => String(device.branchId) === String(activeBranchId)) : ownedDevices,
    [ownedDevices, activeBranchId],
  );
  const matchedBranchDevices = useMemo(() => {
    const term = deviceSearch.trim().toLowerCase().replace(/\.{3}$/, "").replace(/…$/, "");
    if (!term) return activeBranchDevices;
    return activeBranchDevices.filter((device: any, index: number) =>
      [`Device ${index + 1} — ${device.deviceName || ""}`, device.deviceName, device.deviceId, device.notes]
        .some((value) => String(value || "").toLowerCase().includes(term)));
  }, [activeBranchDevices, deviceSearch]);
  const selectedWifiMouse = useMemo(() =>
    ownedDevices.find((device: any) => String(device.deviceId) === String(wifiDeviceId)) || null,
    [ownedDevices, wifiDeviceId]);
  const branchSearchResults = useMemo(() => {
    const query = branchSearch.trim().toLowerCase();
    if (!query) return branches.slice(0, 12);
    return branches
      .filter((branch) => [branch.name, branch.address, branch.postCode]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)))
      .slice(0, 20);
  }, [branches, branchSearch]);


  const loadHp2RouterNetworks = async () => {
    try {
      const response = await fetch("/api/iot/router-wifi-networks", { credentials: "include", cache: "no-store" });
      if (!response.ok) {
        setRouterScanStatus("HP2 router scan service is not available on this preview (" + response.status + ").");
        return;
      }
      const data = await response.json();
      if (!data?.fresh || !Array.isArray(data.networks) || !data.networks.length) {
        setRouterScanStatus("No recent HP2 router scan. Use Refresh, or enter the SSID manually.");
        setRouterScanReportedAt(data?.reportedAt || null);
        return;
      }
      const networks = data.networks.filter((item: any) =>
        typeof item?.ssid === "string" && item.ssid.length > 0 && item.ssid.length <= 64 &&
        Number.isInteger(item.frequency) && item.frequency >= 2400 && item.frequency <= 5900 &&
        Number.isInteger(item.signal) && item.signal >= 0 && item.signal <= 100 &&
        !/^(SmartLife-|OpenBK)/i.test(item.ssid)
      ).slice(0, 64);
      setNearbyWifiNetworks(networks);
      setRouterScanStatus("HP2 router scan received — " + networks.length + " networks. Choose a 2.4 GHz router below.");
      setRouterScanReportedAt(data.reportedAt || null);
    } catch {
      setRouterScanStatus("Cannot reach HP2 router scan service. You may enter the SSID manually.");
    }
  };

  const loadBase = async () => {
    const [statusRes, assignedRes, branchRes, wifiCheckRes] = await Promise.all([
      fetch("/api/iot/owned/status", { credentials: "include", cache: "no-store" }),
      fetch("/api/iot/devices", { credentials: "include", cache: "no-store" }),
      fetch("/api/branches?page=1&limit=5000", { credentials: "include", cache: "no-store" }),
      fetch("/api/iot/device-check", { credentials: "include", cache: "no-store" }),
    ]);

    if (wifiCheckRes.ok) {
      const data = await wifiCheckRes.json().catch(() => []);
      setWifiObservations(Array.isArray(data) ? data.filter((item: any) => String(item.hardwareKey || "").startsWith("wifi-ap:")) : []);
    }
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
    loadHp2RouterNetworks().catch(() => {});
    const timer = window.setInterval(() => {
      loadBase().catch(() => {});
      loadHp2RouterNetworks().catch(() => {});
    }, 20000);
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

    // Prevent AI-generated descriptive text from being stored as physical hardware identity.
    const model = hardwareModel.trim() || "BK7231N-MOUSE-V1";
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]{1,63}$/.test(model)) {
      toast({
        title: "Invalid hardware model",
        description: "Use the device's actual model identifier, for example BK7231N-MOUSE-V1.",
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
          hardwareModel: model,
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
      setBranchId(branchId);
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
        <div className="flex flex-wrap gap-2">

        <Button
          onClick={() => { setShowRegisterForm(true); window.setTimeout(() => document.getElementById("owned-device-name")?.focus(), 0); }}
          className="bg-cyan-600 hover:bg-cyan-500 text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Mouse Device
        </Button>
        </div>
      </div>
      <div className="rounded-xl border border-cyan-500/30 bg-slate-900/55 p-4">
        <h3 className="font-semibold text-white">Owned mouse setup and branch assignment</h3>
        <p className="mt-1 text-sm text-slate-300">Select a real Wi-Fi observation in Smart Check first. Then complete customer branch registration here. A saved sighting does not prove physical Wi-Fi provisioning or MQTT connectivity.</p>
      </div>

      <div>
        <Button type="button" size="sm" variant="ghost" onClick={() => setShowEmergencyTools(!showEmergencyTools)} className="text-xs text-slate-400 hover:text-white">{showEmergencyTools ? "Hide Emergency Backup Tools" : "Emergency Backup Tools (Advanced)"}</Button>
        {showEmergencyTools && <div className="mt-2 rounded-2xl border border-amber-500/30 bg-slate-800/65 p-5">
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
      }
      </div>
      <section className="rounded-2xl border border-cyan-500/30 bg-slate-800/65 p-4 sm:p-5" id="owned-local-wifi-setup">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold text-white sm:text-lg">STEP 2 — RESTAURANT WI-FI</h3>
            <p className="mt-1 text-xs text-slate-300">Choose your 2.4 GHz router near HP2. This is a real Wi-Fi scan, not a mouse connection.</p>
          </div>
          <Button type="button" variant="outline" onClick={() => loadHp2RouterNetworks()} className="h-9 border-cyan-500/40 text-cyan-100">
            Refresh Wi-Fi list
          </Button>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          <div>
            <label htmlFor="owned-wifi-branch" className="mb-1 block text-xs font-medium text-cyan-100">Restaurant / branch</label>
            <select id="owned-wifi-branch" className="h-10 w-full rounded-md border border-slate-600 bg-slate-900 px-3 text-sm text-white"
              value={activeBranchId}
              onChange={event => {
                const id = event.target.value;
                const b = branches.find(branch => String(branch.id) === id);
                setActiveBranchId(id); setBranchId(id); setBranchSearch(b?.name || "");
                setBranchSearchOpen(false); setWifiDeviceId(""); setWifiPassword("");
              }}>
              <option value="">All branches (select restaurant)</option>
              {branches.map(b => <option key={b.id} value={String(b.id)}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="owned-wifi-device" className="mb-1 block text-xs font-medium text-cyan-100">Mouse</label>
            <select id="owned-wifi-device" className="h-10 w-full rounded-md border border-slate-600 bg-slate-900 px-3 text-sm text-white"
              value={wifiDeviceId} onChange={event => { setWifiDeviceId(event.target.value); setWifiPassword(""); }}>
              <option value="">Select registered mouse...</option>
              {activeBranchDevices.map((device: any) => (
                <option key={device.deviceId} value={String(device.deviceId)}>
                  {device.deviceName || device.deviceId} — {branchById.get(String(device.branchId)) || "Unassigned"}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="owned-wifi-network" className="mb-1 block text-xs font-medium text-cyan-100">Wi-Fi network (2.4 GHz)</label>
            <select id="owned-wifi-network" name="foodsafety-router-ssid-choice" autoComplete="off"
              className="h-10 w-full rounded-md border border-slate-600 bg-slate-900 px-3 text-sm text-white"
              value={local24Networks.some(network => network.ssid === wifiSsid) ? wifiSsid : ""}
              onChange={event => { setWifiSsid(event.target.value); setWifiPassword(""); }}>
              <option value="">{local24Networks.length ? "Select a nearby 2.4 GHz Wi-Fi network..." : "No recent HP2 scan — refresh or enter manually"}</option>
              {local24Networks.map(network => (
                <option key={network.ssid} value={network.ssid}>
                  {network.ssid} — {network.signal}% signal
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="owned-wifi-password" className="mb-1 block text-xs font-medium text-cyan-100">Wi-Fi password</label>
            <input id="owned-wifi-password" name="foodsafety-router-password-local-only" type="password"
              autoComplete="new-password" data-lpignore="true" data-1p-ignore="true"
              aria-label="Wi-Fi password — temporary local browser entry"
              placeholder="Password (not saved or sent)" value={wifiPassword} maxLength={128}
              onChange={event => setWifiPassword(event.target.value)}
              className="h-10 w-full rounded-md border border-slate-600 bg-slate-900 px-3 text-sm text-white placeholder:text-slate-400" />
          </div>
          <div className="flex items-end">
            <Button type="button" disabled className="h-10 w-full bg-slate-600 text-white disabled:opacity-75"
              title="The physical BMAX W003 still has factory Tuya firmware. No verified local provisioning method exists.">
              Connect mouse — not available yet
            </Button>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <span className="text-cyan-200" role="status" aria-live="polite">
            {local24Networks.length ? local24Networks.length + " nearby 2.4 GHz routers" : routerScanStatus}
          </span>
          {routerScanReportedAt && <span className="text-slate-400">HP2 last scan: {new Date(routerScanReportedAt).toLocaleTimeString("en-GB", { timeZone: "Europe/London" })}</span>}
          {wifiPassword && <button type="button" onClick={() => setWifiPassword("")} className="text-cyan-200 underline">Clear password</button>}
        </div>
        <div className="mt-2 rounded-lg border border-amber-500/30 bg-amber-950/20 px-3 py-2 text-xs text-amber-100">
          <strong>Not provisioned:</strong> Mouse #11 uses factory Tuya firmware. Selecting Wi-Fi and typing a password does not send them to the mouse or establish MQTT.
          The password stays in this tab only and is cleared on refresh.
        </div>
        {selectedWifiMouse && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-cyan-500/25 bg-slate-900/50 p-3">
            <div className="min-w-0 text-xs text-slate-200">
              <strong className="text-cyan-100">Already registered:</strong> {selectedWifiMouse.deviceName || selectedWifiMouse.deviceId}
              {" · "}{branchById.get(String(selectedWifiMouse.branchId)) || selectedWifiMouse.branchName || "Assigned branch"}
              <p className="mt-1 text-amber-200">Next opens the saved device. It does not send Wi-Fi credentials or establish MQTT.</p>
            </div>
            <Button type="button" variant="outline" className="border-cyan-500/50 text-cyan-100"
              onClick={() => {
                const id = String(selectedWifiMouse.branchId || "");
                const b = branches.find(x => String(x.id) === id);
                setActiveBranchId(id);
                setBranchSearch(b?.name || "");
                setBranchSearchOpen(false);
                setDeviceSearch("");
                document.getElementById("pest-registered-mice")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}>
              Next → View saved mouse
            </Button>
          </div>
        )}
        <details className="mt-2 text-xs text-slate-300">
          <summary className="cursor-pointer text-cyan-200">Network missing? Enter SSID manually / Why Connect is unavailable</summary>
          <label htmlFor="food-safety-router-ssid-manual" className="mt-2 block text-slate-300">Other or hidden 2.4 GHz Wi-Fi network name</label>
          <input id="food-safety-router-ssid-manual" type="search" name="food-safety-router-ssid-manual" autoComplete="off" data-lpignore="true" data-1p-ignore="true"
            className="mt-1 h-9 w-full max-w-md rounded-md border border-slate-600 bg-slate-900 px-3 text-sm text-white"
            placeholder="Enter SSID, not an email" value={wifiSsid} maxLength={64} onChange={event => { setWifiSsid(event.target.value); setWifiPassword(""); }} />
          <p className="mt-2">HP2 scans routers physically near HP2, not at distant restaurants. SmartLife-XXXX is a temporary factory pairing network. A verified device-side firmware or integration is needed before the Connect button can safely work.</p>
        </details>
      </section>

      {smartCheckSelection && (
        <div className="rounded-xl border border-cyan-500/40 bg-cyan-950/30 p-4 text-sm text-white" role="status">
          <strong className="block text-base">Selected in Smart Check: {smartCheckSelection.ssid || "Wi-Fi mouse"}</strong>
          <p className="mt-1 font-mono text-xs text-cyan-200">Observed MAC: {smartCheckSelection.mac || "Unavailable"}</p>
          <p className="mt-2 text-slate-300">Wi-Fi discovery only. Choose the correct customer branch and register the device below. Wi-Fi provisioning and MQTT must be verified separately.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" type="button" onClick={() => {
              setDeviceName(smartCheckSelection.ssid);
              setShowRegisterForm(true);
              window.setTimeout(() => document.getElementById("pest-add-device")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
            }} className="bg-cyan-600 text-white hover:bg-cyan-500">Next — Select branch</Button>
            <Button size="sm" type="button" variant="outline" onClick={() => {
              window.sessionStorage.removeItem("pest-smart-check-selected-v1");
              setSmartCheckSelection(null);
            }} className="border-slate-600 text-white">Clear selection</Button>
          </div>
        </div>
      )}
      <div className="rounded-xl border border-blue-500/30 bg-slate-900/50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-semibold text-white">STEP 3 — ASSIGN NEW MOUSE (ONLY IF NEEDED)</h3>
            <p className="mt-1 text-sm text-slate-300">Already registered? Skip this step. Do not create another record for the same physical mouse.</p>
          </div>
          <Button type="button" variant="outline" onClick={() => setShowRegisterForm(value => !value)} className="border-blue-500/40 text-blue-100">
            {showRegisterForm ? "Hide new mouse form" : "Add a different, unregistered mouse"}
          </Button>
        </div>
      </div>
      {showRegisterForm && <div id="pest-add-device" className="rounded-2xl border border-slate-700 bg-slate-800/65 p-5">
        <div className="mb-4 flex items-center gap-2">
          <Plus className="h-4 w-4 text-blue-300" />
          <h3 className="font-semibold text-white">Add Mouse — Assign to Restaurant (pending activation)</h3>
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
          {registering ? "Registering..." : "Save Mouse & Branch (Pending)"}
        </Button>

        {lastCreatedId && (
          <div className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-100">
            Device created: <span className="font-mono font-semibold">{lastCreatedId}</span>. It becomes Connected when the physical trap connects to your Food Safety gateway using this ID.
          </div>
        )}
      </div>

      }
      <div id="pest-registered-mice" className="scroll-mt-28 rounded-xl border border-emerald-500/25 bg-slate-900/50 p-4">
        <h3 className="text-lg font-semibold text-white">STEP 4 — REGISTERED MOUSE CARDS</h3>
        <p className="mt-1 text-sm text-slate-300">Saved mice remain registered when their Wi-Fi sleeps. No recent signal means sleep, power OFF or network loss is possible — never claim the mouse is switched OFF without proof. Only authenticated MQTT confirms connectivity and catch events.</p>
      </div>
      <div className="rounded-2xl border border-slate-700 bg-slate-800/65 p-5">
        <div className="mb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="relative w-full max-w-xl">
              <label className="mb-1 block text-sm font-semibold text-white">Select Restaurant / Branch</label>
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
<select aria-label="Select restaurant" value={activeBranchId} onChange={e => { const id=e.target.value; const branch=branches.find(b => String(b.id)===id); setActiveBranchId(id); setBranchId(id); setBranchSearch(branch?.name || ""); setBranchSearchOpen(false); }} className="h-10 w-full max-w-xs rounded-md border border-slate-600 bg-slate-950 px-3 text-sm text-white"><option value="">All restaurants</option>{branches.map(b => <option key={b.id} value={String(b.id)}>{b.name}</option>)}</select>
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
              <div className="grid gap-0">
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
                      <p className="hidden">
                        {branchDeviceBackup
                          ? `Last branch backup: ${new Date(branchDeviceBackup.created_at).toLocaleString("en-GB", { timeZone: "Europe/London" })}`
                          : "No backup saved for this branch yet."}
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-slate-600 bg-slate-900/40 p-5 text-sm text-slate-400">
              All registered devices are shown below. Search and select a branch to filter by shop.
            </div>
          )}
        </div>

        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 font-semibold text-white">
            <HardDrive className="h-4 w-4 text-emerald-300" />
            {activeBranch ? `${activeBranch.name} Devices (${activeBranchDevices.length})` : `All Registered Devices (${ownedDevices.length})`}
          </h3>
          <div className="flex flex-wrap gap-2">
            {activeBranch && (
              <Button size="sm" onClick={() => { setBranchId(activeBranch.id); setShowRegisterForm(true); window.setTimeout(() => document.getElementById("pest-add-device")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0); }} className="bg-blue-600 text-white hover:bg-blue-500">
                <Plus className="mr-1 h-4 w-4" /> Add Mouse Device
              </Button>
            )}
          <Button size="sm" variant="outline" onClick={() => loadBase()} className="border-slate-600 text-slate-200">
            <RefreshCw className="mr-1 h-3.5 w-3.5" />
            Refresh
          </Button>
          </div>
        </div>

        <Input aria-label="Search mouse devices" placeholder="Search mouse name, ID or installation area" value={deviceSearch} onChange={e => setDeviceSearch(e.target.value)} className="mb-4 max-w-sm border-slate-600 bg-slate-950 text-white" />
        {matchedBranchDevices.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center text-slate-400">
            <p>{activeBranchDevices.length ? "No devices match this search. Your assigned mice are unchanged." : activeBranch ? `No devices are assigned to ${activeBranch.name} yet.` : "No registered devices found."}</p>
             {deviceSearch && <Button type="button" size="sm" variant="outline" className="border-slate-600 text-slate-200" onClick={() => setDeviceSearch("")}>Clear search</Button>}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {matchedBranchDevices.map((device: any) => {
               const index = activeBranchDevices.indexOf(device);
              const snap = deviceSnapshot(device.lastStatus);
              const connectivity = getMouseConnectivity(device);
              const setupSsid = namedFactoryWifi(device.deviceName);
              const matchingWifi = setupSsid
                ? wifiObservations.find((observation: any) =>
                    String(observation.hostname || "").trim().toLowerCase() === setupSsid)
                : undefined;
              return (
                <div key={device.id} className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-white">{device.deviceName || device.deviceId}</p>
                      <p className="mt-0.5 text-xs text-slate-400">{branchById.get(device.branchId) || device.branchName || "Assigned branch"}</p>
                      <p className="mt-1 break-all font-mono text-[11px] text-slate-500">{device.deviceId}</p>
                    </div>
                    <Badge className={connectivity.active ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-200"}>
                      {connectivity.badge}
                    </Badge>
                  </div>

                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    <div className="rounded-lg border border-slate-700 bg-slate-950/45 p-3">
                      <p className="text-xs text-slate-400">Connection</p>
                      <p className={connectivity.active ? "font-semibold text-emerald-300" : "font-semibold text-amber-200"}>{connectivity.active ? "MQTT recently reported" : "MQTT not verified live"}</p>
                    </div>
                    <div className="rounded-lg border border-slate-700 bg-slate-950/45 p-3">
                      <p className="text-xs text-slate-400">Sensor</p>
                      <p className={device.alarmActive ? "font-semibold text-red-300" : "font-semibold text-slate-200"}>{device.alarmActive ? "🔴 Mouse caught" : "No verified active catch"}</p>
                    </div>
                    <div className="rounded-lg border border-slate-700 bg-slate-950/45 p-3">
                      <p className="text-xs text-slate-400">Last report</p>
                      <p className="text-sm text-white">{device.lastCheckedAt ? new Date(device.lastCheckedAt).toLocaleString("en-GB", { timeZone: "Europe/London" }) : "No MQTT report yet"}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-slate-400">Wi-Fi setup sightings are managed in Smart Check. {device.notes ? "Installation: " + device.notes : ""}</p>
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

                  <Button type="button" size="sm" variant="ghost" onClick={() => setAdvancedDeviceId(advancedDeviceId === String(device.id) ? "" : String(device.id))} className="mt-3 text-xs text-slate-400 hover:text-white">
                    {advancedDeviceId === String(device.id) ? "Hide Advanced Settings" : "Advanced Settings"}
                  </Button>
                  {advancedDeviceId === String(device.id) && <div className="mt-2 rounded-lg border border-slate-700/70 bg-slate-950/35 p-2">
                    <p className="mb-2 text-[11px] font-medium text-slate-400">Advanced device backup and restore</p>
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
                  </div>}

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => refreshDevice(device.id)} className="border-slate-600 text-slate-200">
                      <RefreshCw className="mr-1 h-3 w-3" />
                      Refresh
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => beginEditDevice(device)} className="border-cyan-700/60 text-cyan-200">
                      <Pencil className="mr-1 h-3 w-3" />
                      Edit / Reassign
                    </Button>
                    {advancedDeviceId === String(device.id) && (pendingRemoveDeviceId === String(device.id) ? (
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
                    ))}
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
