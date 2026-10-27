import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Link2, Radar, RefreshCw, ShieldCheck, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface DeviceCheckRow {
  id: string;
  hardwareKey: string;
  macAddress?: string | null;
  ipAddress?: string | null;
  mqttPrefix?: string | null;
  hostname?: string | null;
  connected: boolean;
  rssi?: number | null;
  wifiSignalPercent?: number | null;
  wifiObservationSource?: string | null;
  isWifiRecentlySeen?: boolean;
  legacyDeviceId?: string | null;
  assignedDeviceId?: string | null;
  assignedDeviceName?: string | null;
  assignedBranchId?: string | null;
  assignedBranchName?: string | null;
  assignedLocation?: string | null;
  lastSeenAt?: string | null;
  isLive: boolean;
}

interface IgnoredWifi {
  hardwareKey: string;
  hostname?: string | null;
  macAddress?: string | null;
  ignoredAt?: string | null;
}

interface RegisteredDevice {
  id: string;
  deviceId: string;
  deviceName?: string;
  branchId?: string | null;
  notes?: string | null;
}

interface BranchOption {
  id: string;
  name: string;
  address?: string | null;
  postCode?: string | null;
}

type Draft = {
  deviceId: string;
  deviceName: string;
  branchId: string;
  notes: string;
};

const emptyDraft = (): Draft => ({ deviceId: "", deviceName: "", branchId: "", notes: "" });

// A historical unverified DEVICE4 row is not a real current device. Preserve
// the database history but do not offer an obsolete identity for linking.
const isObsoleteLegacyDevice4 = (row: DeviceCheckRow) =>
  !row.hardwareKey.startsWith("wifi-ap:") &&
  String(row.mqttPrefix || "").toUpperCase() === "DEVICE4" &&
  !row.macAddress && !row.ipAddress && !row.assignedDeviceId && !row.isLive &&
  (!row.lastSeenAt || Date.now() - new Date(row.lastSeenAt).getTime() > 24 * 60 * 60 * 1000);

export default function DeviceCheckPanel() {
  const { toast } = useToast();
  const [rows, setRows] = useState<DeviceCheckRow[]>([]);
  const [loadError, setLoadError] = useState("");
  const [refreshingReports, setRefreshingReports] = useState(false);
  const [refreshColour, setRefreshColour] = useState<"green" | "blue" | null>(null);
  const [lastManualRefresh, setLastManualRefresh] = useState("");
  const [manualRefreshError, setManualRefreshError] = useState("");
  const [registered, setRegistered] = useState<RegisteredDevice[]>([]);
  const [ignoredWifi, setIgnoredWifi] = useState<IgnoredWifi[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [branchPickerOpen, setBranchPickerOpen] = useState(false);
  const [branchPickerSearch, setBranchPickerSearch] = useState("");
  const [busy, setBusy] = useState("");
  const [wifiAssignOpenId, setWifiAssignOpenId] = useState("");
  const [wifiPhysicallyConfirmed, setWifiPhysicallyConfirmed] = useState<Record<string, boolean>>({});
  const [wifiObservation, setWifiObservation] = useState({ ssid: "", macAddress: "", ipAddress: "", signalPercent: "" });

  const [existingChoice, setExistingChoice] = useState<Record<string, string>>({});
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});

  const load = async () => {
    const [checkRes, devicesRes, branchesRes, ignoredRes] = await Promise.all([
      fetch("/api/iot/device-check", { credentials: "include", cache: "no-store" }),
      fetch("/api/iot/devices", { credentials: "include", cache: "no-store" }),
      fetch("/api/branches?page=1&limit=5000", { credentials: "include", cache: "no-store" }),
      fetch("/api/iot/device-check/ignored-wifi", { credentials: "include", cache: "no-store" }),
    ]);

    if (!checkRes.ok) {
      const errorData = await checkRes.json().catch(() => ({}));
      setLoadError("Device Check API " + checkRes.status + ": " + String(errorData?.message || "Unable to load recorded HP2 Wi-Fi sightings."));
    } else {
      const data = await checkRes.json().catch(() => null);
      if (Array.isArray(data)) { setRows(data); setLoadError(""); }
      else setLoadError("Device Check API returned invalid data.");
    }
    if (ignoredRes.ok) {
      const data = await ignoredRes.json().catch(() => null);
      if (Array.isArray(data)) setIgnoredWifi(data);
    }
    if (devicesRes.ok) {
      const data = await devicesRes.json();
      setRegistered(Array.isArray(data) ? data : []);
    }
    if (branchesRes.ok) {
      const data = await branchesRes.json();
      setBranches(Array.isArray(data?.branches) ? data.branches : []);
    }
  };


  const refreshHp2Reports = async () => {
    if (refreshingReports) return;
    setRefreshingReports(true);
    setManualRefreshError("");
    try {
      const response = await fetch("/api/iot/device-check", { credentials: "include", cache: "no-store" });
      if (!response.ok) throw new Error(`Device Check API returned ${response.status}`);
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error("Device Check returned invalid data");
      setRows(data);
      setLoadError("");
      setRefreshColour((previous) => previous === "green" ? "blue" : "green");
      setLastManualRefresh(new Date().toLocaleTimeString("en-GB", { timeZone: "Europe/London" }));
      toast({ title: "HP2 reports checked", description: "Latest saved reports loaded. No new signal does not mean the mouse is offline." });
    } catch (error: any) {
      setManualRefreshError(error?.message || "Unable to refresh HP2 reports");
      toast({ title: "HP2 refresh failed", description: error?.message || "Please try again.", variant: "destructive" });
    } finally {
      setRefreshingReports(false);
    }
  };

  // An admin-entered HP2 scan is a historic Wi-Fi sighting, never MQTT telemetry.
  const recordWifiObservation = async () => {
    setBusy("wifi-observation");
    try {
      const response = await fetch("/api/iot/device-check/wifi-observation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(wifiObservation),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast({ title: "Wi-Fi sighting not recorded", description: data?.message || "Please try again.", variant: "destructive" });
        return;
      }
      toast({ title: "HP2 Wi-Fi sighting recorded", description: "Recorded as factory Wi-Fi observed, not MQTT connected." });
      setWifiObservation({ ssid: "", macAddress: "", ipAddress: "", signalPercent: "" });
      await load();
    } catch {
      toast({ title: "Connection error", description: "Could not save the HP2 Wi-Fi sighting.", variant: "destructive" });
    } finally {
      setBusy("");
    }
  };

  useEffect(() => {
    load().catch(() => {});
    const timer = window.setInterval(() => load().catch(() => {}), 5000);
    return () => window.clearInterval(timer);
  }, []);

  const counts = useMemo(() => ({
    live: rows.filter(row => row.isLive && !row.hardwareKey.startsWith("wifi-ap:")).length,
    wifiSeen: rows.filter(row => row.hardwareKey.startsWith("wifi-ap:") && row.isWifiRecentlySeen).length,
    unassigned: rows.filter(row => row.hardwareKey.startsWith("wifi-ap:") && !row.assignedDeviceId).length,
    linked: rows.filter(row => Boolean(row.assignedDeviceId)).length,
  }), [rows]);

  const duplicateIpMap = useMemo(() => {
    const map = new Map<string, DeviceCheckRow[]>();
    for (const row of rows) {
      const ip = String(row.ipAddress || "").trim();
      if (!ip) continue;
      const group = map.get(ip) || [];
      group.push(row);
      map.set(ip, group);
    }
    return map;
  }, [rows]);

  const setDraft = (id: string, patch: Partial<Draft>) => {
    setDrafts((current) => ({
      ...current,
      [id]: { ...(current[id] || emptyDraft()), ...patch },
    }));
  };

  const registerPendingFromWifi = async (row: { id: string }) => {
    const draft = drafts[row.id] || emptyDraft();
    const deviceId = draft.deviceId.trim().toUpperCase();
    if (!deviceId || !draft.deviceName.trim() || !draft.branchId || !draft.notes.trim()) return;
    if (registered.some((device) => device.deviceId.toUpperCase() === deviceId)) {
      toast({ title: "Already registered", description: "Use Smart Devices → Edit / Reassign for an existing device.", variant: "destructive" });
      return;
    }
    setBusy("pending:" + row.id);
    try {
      const response = await fetch("/api/iot/devices", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ deviceId, deviceName: draft.deviceName.trim(), branchId: draft.branchId, notes: draft.notes.trim(), hardwareModel: "BK7231N-MOUSE-V1" }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) { toast({ title: "Could not save", description: data?.message || "Registration failed", variant: "destructive" }); return; }
      toast({ title: "Pending device saved", description: "Customer and location saved. Wi-Fi observation is NOT linked as live MQTT telemetry." });
      setDrafts((current) => ({ ...current, [row.id]: emptyDraft() }));
      await load();
    } catch { toast({ title: "Network error", description: "Could not save registration.", variant: "destructive" }); }
    finally { setBusy(""); }
  };

  const assignWifiExisting = async (row: DeviceCheckRow) => {
    const deviceId = String(existingChoice[row.id] || "").trim().toUpperCase();
    const target = registered.find(item => item.deviceId.toUpperCase() === deviceId);
    if (!selectedBranchId || !wifiPhysicallyConfirmed[row.id] || !target || String(target.branchId) !== selectedBranchId) {
      toast({ title: "Confirm the physical mouse and branch", description: "Choose a device registered to this customer, then tick the physical identity confirmation.", variant: "destructive" });
      return;
    }
    setBusy("wifi-link:" + row.id);
    try {
      const response = await fetch("/api/iot/device-check/" + encodeURIComponent(row.id) + "/link-wifi", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ deviceId, branchId: selectedBranchId }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.message || "Unable to link sighting");
      toast({ title: "Mouse assigned to branch", description: deviceId + " moved from unassigned Wi-Fi sightings to its customer. MQTT not verified." });
      setWifiAssignOpenId("");
      await load();
    } catch (err: any) {
      toast({ title: "Assignment failed", description: err?.message || "Please retry", variant: "destructive" });
    } finally { setBusy(""); }
  };

  const linkExisting = async (row: DeviceCheckRow) => {
    const deviceId = String(existingChoice[row.id] || "").trim();
    if (!deviceId) {
      toast({ title: "Choose a device", description: "Select the existing FS-MOUSE device you physically checked.", variant: "destructive" });
      return;
    }

    setBusy("link:" + row.id);
    try {
      const response = await fetch("/api/iot/device-check/" + row.id + "/link-existing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ deviceId }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast({ title: "Could not link device", description: data?.message || "Please try again", variant: "destructive" });
        return;
      }
      toast({
        title: "Physical device identified",
        description: (data?.deviceId || deviceId) + " is now linked to this MAC / MQTT identity.",
      });
      await load();
    } finally {
      setBusy("");
    }
  };

  const registerAndAssign = async (row: DeviceCheckRow) => {
    const wifiOnly = row.hardwareKey.startsWith("wifi-ap:");
    const draft = { ...(drafts[row.id] || emptyDraft()), branchId: wifiOnly ? selectedBranchId : (drafts[row.id]?.branchId || "") };
    if (wifiOnly && (!selectedBranchId || !wifiPhysicallyConfirmed[row.id] || !draft.notes.trim())) {
      toast({ title: "Confirm the mouse first", description: "Confirm the physical mouse identity and add installation area.", variant: "destructive" });
      return;
    }
    if (!draft.deviceName.trim() || !draft.branchId) {
      toast({ title: "Name and branch required", description: "Enter the device name and choose the branch after the physical check.", variant: "destructive" });
      return;
    }

    setBusy("assign:" + row.id);
    try {
      const registerResponse = await fetch("/api/iot/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          deviceId: draft.deviceId.trim().toUpperCase(),
          deviceName: draft.deviceName.trim(),
          branchId: draft.branchId,
          notes: draft.notes.trim(),
          hardwareModel: "BK7231N-MOUSE-V1",
        }),
      });
      const registeredData = await registerResponse.json().catch(() => ({}));
      if (!registerResponse.ok) {
        toast({ title: "Could not register device", description: registeredData?.message || "Please try again", variant: "destructive" });
        return;
      }

      const permanentDeviceId = String(registeredData?.deviceId || "").trim();
      if (!permanentDeviceId) {
        toast({ title: "Registration incomplete", description: "The permanent FS-MOUSE ID was not returned.", variant: "destructive" });
        return;
      }

      const linkResponse = await fetch("/api/iot/device-check/" + row.id + (wifiOnly ? "/link-wifi" : "/link-existing"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ deviceId: permanentDeviceId, branchId: draft.branchId }),
      });
      const linkedData = await linkResponse.json().catch(() => ({}));
      if (!linkResponse.ok) {
        toast({
          title: "Device registered — link needs attention",
          description: linkedData?.message || (permanentDeviceId + " was created, but the physical MAC could not be linked. Use Link Existing."),
          variant: "destructive",
        });
        await load();
        return;
      }

      toast({
        title: "Device registered and assigned",
        description: permanentDeviceId + " is now assigned to its branch." + (wifiOnly ? " MQTT is not yet verified." : ""),
      });
      if (wifiOnly) setWifiAssignOpenId("");
      await load();
    } finally {
      setBusy("");
    }
  };

  // Keep every saved unassigned HP2 Wi-Fi sighting available regardless of whether
  // its factory AP is currently broadcasting. Refreshing an existing BSSID must
  // not silently remove its card, and assignment removes it from this queue.
  const unassignedWifiSightings = rows.filter(row =>
    row.hardwareKey.startsWith("wifi-ap:") && !row.assignedDeviceId
  );
  const unassignedWifiTotal = unassignedWifiSightings.length;
  const unassignedSightings = unassignedWifiSightings;
  const branchDevices = rows.filter(row => selectedBranchId && row.assignedBranchId === selectedBranchId);
  const removeWifiSighting = async (row: DeviceCheckRow) => {
    if (!window.confirm("Ignore " + (row.hostname || row.macAddress || "this Wi-Fi signal") + " until you restore it? HP2 will continue scanning, but the card will not return. Registered devices, assignments and MQTT remain unchanged.")) return;
    setBusy("remove:" + row.id);
    try {
      const response = await fetch("/api/iot/device-check/" + encodeURIComponent(row.id) + "/wifi-sighting", { method: "DELETE", credentials: "include" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.message || "Could not ignore Wi-Fi sighting");
      await load();
      toast({ title: "Wi-Fi signal ignored", description: "This BSSID will not reappear on the scanner list until you restore it from Ignored Wi-Fi signals." });
    } catch (err: any) {
      toast({ title: "Could not ignore Wi-Fi signal", description: err?.message, variant: "destructive" });
    } finally { setBusy(""); }
  };
  const restoreIgnoredWifi = async (item: IgnoredWifi) => {
    setBusy("restore:" + item.hardwareKey);
    try {
      const response = await fetch("/api/iot/device-check/restore-wifi", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ hardwareKey: item.hardwareKey }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.message || "Could not restore the ignored signal");
      await load();
      toast({ title: "Wi-Fi signal restored", description: "It can now appear as an unassigned HP2 Wi-Fi sighting again." });
    } catch (err: any) {
      toast({ title: "Restore failed", description: err?.message || "Try again.", variant: "destructive" });
    } finally { setBusy(""); }
  };
  const visibleMqttRows = rows.filter(row =>
    !row.hardwareKey.startsWith("wifi-ap:") &&
    row.isLive &&
    !isObsoleteLegacyDevice4(row)
  );
  const manualDraft = drafts["manual-registration"] || emptyDraft();

  return (
    <div className="space-y-5 w-full max-w-full">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-600">
            <Radar className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Device Check</h2>
            <p className="text-sm text-slate-400">Identify mouse Wi-Fi signals first; MQTT connected status requires actual gateway telemetry</p>
          </div>
        </div>
        <div className="flex flex-col items-start gap-1 sm:items-end">
          <Button
            type="button"
            onClick={refreshHp2Reports}
            disabled={refreshingReports}
            aria-busy={refreshingReports}
            className={refreshingReports
              ? "bg-amber-600 text-white cursor-wait"
              : manualRefreshError
                ? "bg-red-700 text-white hover:bg-red-600"
                : refreshColour === "green"
                  ? "bg-emerald-600 text-white hover:bg-emerald-500"
                  : refreshColour === "blue"
                    ? "bg-blue-600 text-white hover:bg-blue-500"
                    : "bg-slate-800 text-white hover:bg-slate-700"}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshingReports ? "animate-spin" : ""}`} />
            {refreshingReports ? "Checking HP2 reports..." : "Check latest HP2 reports"}
          </Button>
          <span role="status" aria-live="polite" className={`text-xs ${manualRefreshError ? "text-red-300" : "text-slate-300"}`}>
            {manualRefreshError ? `Refresh failed: ${manualRefreshError}`
              : lastManualRefresh ? `Checked at ${lastManualRefresh} · ${rows.filter(row => row.hardwareKey.startsWith("wifi-ap:")).length} saved Wi-Fi sighting(s)`
              : "Click to check saved HP2 reports"}
          </span>
        </div>
      </div>

      {loadError && <div role="alert" className="rounded-lg border border-red-500/50 bg-red-950/40 p-3 text-sm text-red-100">Device Check loading error: {loadError}. This does not mean a mouse is switched OFF.</div>}
      <div className="rounded-2xl border border-cyan-500/30 bg-slate-800/65 p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 text-cyan-300" />
          <div>
            <h3 className="font-semibold text-white">Safe physical identification</h3>
            <p className="mt-1 text-sm text-slate-300">
              HP2 can report MQTT-connected mice and, with the optional Ubuntu scanner, observed factory SmartLife Wi-Fi access points. An AP BSSID may differ from the MQTT device MAC. Pairing LEDs may stop flashing automatically; a saved sighting does not mean the trap is currently online. No branch assignment happens automatically.
            </p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-center">
            <p className="text-2xl font-bold text-emerald-300">{counts.live}</p>
            <p className="text-xs text-emerald-200">MQTT live now</p>
          </div>
          <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-3 text-center">
            <p className="text-2xl font-bold text-cyan-300">{counts.wifiSeen}</p>
            <p className="text-xs text-cyan-200">Wi-Fi AP seen recently</p>
          </div>
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-center">
            <p className="text-2xl font-bold text-amber-300">{counts.unassigned}</p>
            <p className="text-xs text-amber-200">Not linked</p>
          </div>
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-3 text-center">
            <p className="text-2xl font-bold text-blue-300">{counts.linked}</p>
            <p className="text-xs text-blue-200">Identified</p>
          </div>
        </div>
      </div>


      <section className="rounded-xl border border-blue-500/30 bg-slate-900/70 p-4">
        <h3 className="font-semibold text-white">Select Branch</h3>
        <div className="relative mt-3 w-full max-w-md">
          <button type="button" aria-expanded={branchPickerOpen} aria-controls="device-check-branch-options"
            onClick={() => setBranchPickerOpen(open => !open)}
            className="flex h-11 w-full items-center justify-between gap-2 rounded border border-slate-600 bg-slate-950 px-3 text-left text-sm text-white">
            <span className="truncate">{branches.find(b => String(b.id) === selectedBranchId)?.name || "Select customer branch..."}</span>
            <span aria-hidden="true" className="text-cyan-300">{branchPickerOpen ? "▲" : "▼"}</span>
          </button>
          {branchPickerOpen && (
            <div id="device-check-branch-options" className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border border-slate-600 bg-slate-950 p-2 shadow-2xl">
              <Input autoFocus aria-label="Search customer branch" placeholder="Search shop name or postcode..."
                value={branchPickerSearch} onChange={e => setBranchPickerSearch(e.target.value)}
                className="mb-2 h-9 border-slate-600 bg-slate-900 text-white" />
              <div className="max-h-48 overflow-y-auto">
                {branches.filter(b => [b.name, b.address, b.postCode].some(v =>
                  String(v || "").toLowerCase().includes(branchPickerSearch.trim().toLowerCase())
                )).slice(0, 15).map(b => (
                  <button key={b.id} type="button"
                    onClick={() => { setSelectedBranchId(String(b.id)); setBranchPickerOpen(false); setBranchPickerSearch(""); setWifiAssignOpenId(""); setWifiPhysicallyConfirmed({}); setExistingChoice({}); }}
                    className={"block w-full rounded px-3 py-2 text-left text-sm hover:bg-blue-600/25 " + (String(b.id) === selectedBranchId ? "bg-cyan-600/25 text-cyan-100" : "text-white")}>
                    <span className="block truncate font-medium">{b.name}</span>
                    {(b.postCode || b.address) && <span className="block truncate text-xs text-slate-400">{[b.address, b.postCode].filter(Boolean).join(" · ")}</span>}
                  </button>
                ))}
                {!branches.some(b => [b.name, b.address, b.postCode].some(v =>
                  String(v || "").toLowerCase().includes(branchPickerSearch.trim().toLowerCase())
                )) && <p className="px-3 py-3 text-xs text-slate-400">No matching branch found.</p>}
              </div>
              <button type="button" onClick={() => setBranchPickerOpen(false)} className="mt-2 w-full rounded bg-slate-800 px-3 py-2 text-xs text-slate-200">Close</button>
            </div>
          )}
        </div>
        {selectedBranchId && <>
          <p className="mt-3 text-sm font-semibold text-white">Devices assigned to this branch ({branchDevices.length})</p>
          {branchDevices.length === 0 && <p className="mt-2 text-xs text-slate-400">No physical mouse assigned yet. A confirmed Wi-Fi card moves here after assignment.</p>}
          {branchDevices.map(row => (
            <div key={row.id} className="mt-2 rounded-lg border border-slate-700 bg-slate-800 p-3">
              <p className="text-sm font-semibold text-white">{row.assignedDeviceName || row.hostname || "Mouse"} — {row.assignedDeviceId}</p>
              <p className="mt-1 font-mono text-xs text-cyan-200">{row.hostname || row.mqttPrefix || "Wi-Fi observation"}{row.macAddress ? " · " + row.macAddress : ""}</p>
              <p className="mt-1 text-xs text-slate-300">{row.hardwareKey.startsWith("wifi-ap:") ? (row.isWifiRecentlySeen ? "Wi-Fi recently observed · MQTT unverified" : "Sleeping / No recent Wi-Fi signal · MQTT unverified") : row.isLive ? "MQTT live" : "Sleeping / No recent MQTT signal"}</p>
            </div>
          ))}
          <p className="mt-2 text-xs text-slate-400">Assigned mice stay here even when sleeping or switched OFF. Wi-Fi scans alone do not establish MQTT connectivity.</p>
        </>}
        {!selectedBranchId && <p className="mt-3 text-sm text-cyan-200">Choose a branch to see only that customer’s assigned mice. The unassigned HP2 Wi-Fi queue below is available for identification at any time.</p>}
      </section>
      <section className="space-y-3" aria-label="All unassigned HP2 Wi-Fi mouse sightings">
        <div>
          <h3 className="text-lg font-bold text-white">Unassigned HP2 Wi-Fi sightings ({unassignedWifiTotal})</h3>
          <p className="text-sm text-slate-300">All detected Wi-Fi mouse signals stay here until assigned to a branch. Recently seen and historical signals are labelled separately. Select the customer branch above, physically identify the mouse, then assign. Wi-Fi observation does not prove MQTT.</p>
        </div>
        {unassignedSightings.length === 0 ? (
          <div className="rounded-xl border border-dashed border-cyan-500/30 bg-slate-900/60 p-5 text-sm text-slate-300">
            No unassigned Wi-Fi sightings. Switch ON one mouse and check the HP2 report; it will remain listed here until you assign it.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {unassignedSightings.map((row) => (
              <article key={row.id} className="rounded-2xl border border-cyan-500/35 bg-slate-900/80 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h4 className="break-all text-base font-bold text-white">{row.hostname || "Unidentified Wi-Fi AP"}</h4>
                    <p className="mt-1 break-all font-mono text-xs text-cyan-200">{row.macAddress || "MAC not reported"}</p>
                  </div>
                  <span className={"rounded-full px-3 py-1 text-xs font-semibold " + (row.isWifiRecentlySeen ? "bg-cyan-500/20 text-cyan-200" : "bg-slate-700 text-slate-300")}>
                    {row.isWifiRecentlySeen ? "Recent HP2 signal" : "Last sighting (not live)"}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-slate-800 p-3"><p className="text-xs text-slate-400">Last Wi-Fi signal</p><p className="font-semibold text-white">{row.wifiSignalPercent == null ? "Not reported" : row.wifiSignalPercent + "%"}</p></div>
                  <div className="rounded-lg bg-slate-800 p-3"><p className="text-xs text-slate-400">MQTT</p><p className="font-semibold text-amber-200">Not verified</p></div>
                </div>
                <p className="mt-3 text-xs text-slate-400">Last HP2 report: {row.lastSeenAt ? new Date(row.lastSeenAt).toLocaleString("en-GB", { timeZone: "Europe/London" }) : "Never"}</p>
                <p className="mt-1 text-xs text-slate-400">{row.wifiObservationSource === "admin-entry" ? "Manually recorded" : "HP2 scanner observation"} · Not assigned automatically</p>
                <button type="button" onClick={() => setWifiAssignOpenId(wifiAssignOpenId === row.id ? "" : row.id)}
                  className="mr-2 mt-3 rounded border border-emerald-400/50 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-200">
                  {wifiAssignOpenId === row.id ? "Cancel assignment" : "Assign to selected branch"}
                </button>
                {wifiAssignOpenId === row.id && (
                  <div className="mt-3 space-y-3 rounded-lg border border-cyan-500/40 bg-slate-800 p-3">
                    <p className="text-sm font-semibold text-white">Assign this mouse to {branches.find(b => b.id === selectedBranchId)?.name || "selected branch"}</p>
                    <p className="text-xs text-amber-200">Verify the physical mouse first. This records its Wi-Fi AP identity; MQTT is not connected or proven by this action.</p>
                    <label className="flex items-start gap-2 text-xs text-white">
                      <input type="checkbox" checked={Boolean(wifiPhysicallyConfirmed[row.id])} onChange={e => setWifiPhysicallyConfirmed(previous => ({ ...previous, [row.id]: e.target.checked }))} className="mt-0.5" />
                      I have physically confirmed this is the correct mouse for the selected branch.
                    </label>
                    <div className="rounded-lg border border-slate-600 p-3">
                      <p className="mb-2 text-xs font-semibold text-white">Already registered? Link existing FS-MOUSE device</p>
                      <select aria-label="Registered device in selected branch" value={existingChoice[row.id] || ""} onChange={e => setExistingChoice(old => ({ ...old, [row.id]: e.target.value }))}
                        className="h-10 w-full rounded border border-slate-600 bg-slate-950 px-2 text-xs text-white">
                        <option value="">Select a registered mouse from this branch...</option>
                        {registered.filter(device => String(device.branchId) === selectedBranchId && device.deviceId.toUpperCase() !== "FS-MOUSE-000001").map(device => (
                          <option key={device.id} value={device.deviceId}>{device.deviceName || device.deviceId} — {device.deviceId}</option>
                        ))}
                      </select>
                      <button type="button" disabled={!wifiPhysicallyConfirmed[row.id] || !existingChoice[row.id] || busy === "wifi-link:" + row.id}
                        onClick={() => assignWifiExisting(row)} className="mt-2 rounded bg-blue-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">
                        Link Existing to Branch
                      </button>
                    </div>
                    <div className="rounded-lg border border-slate-600 p-3">
                      <p className="mb-2 text-xs font-semibold text-white">New mouse? Register and assign to this branch</p>
                      <Input aria-label="New physical mouse name" placeholder="Device name, e.g. Mouse 10" value={(drafts[row.id] || emptyDraft()).deviceName}
                        onChange={e => setDraft(row.id, { deviceName: e.target.value, branchId: selectedBranchId })} className="mb-2 border-slate-600 bg-slate-950 text-white" />
                      <Input aria-label="New mouse installation area" placeholder="Installation area, e.g. Kitchen / Back Door" value={(drafts[row.id] || emptyDraft()).notes}
                        onChange={e => setDraft(row.id, { notes: e.target.value, branchId: selectedBranchId })} className="mb-2 border-slate-600 bg-slate-950 text-white" />
                      <Input aria-label="Optional Food Safety device ID" placeholder="Optional unique FS-MOUSE ID (automatically generated if blank)" value={(drafts[row.id] || emptyDraft()).deviceId}
                        onChange={e => setDraft(row.id, { deviceId: e.target.value.toUpperCase(), branchId: selectedBranchId })} className="border-slate-600 bg-slate-950 text-white" />
                      <button type="button" onClick={() => registerAndAssign(row)}
                        disabled={!wifiPhysicallyConfirmed[row.id] || !(drafts[row.id]?.deviceName || "").trim() || !(drafts[row.id]?.notes || "").trim() || busy === "assign:" + row.id}
                        className="mt-3 rounded bg-emerald-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">
                        Register & Assign to This Branch
                      </button>
                    </div>
                  </div>
                )}
                <button type="button" disabled={busy === "remove:" + row.id} onClick={() => removeWifiSighting(row)} className="mt-3 rounded border border-red-500/40 px-3 py-1.5 text-xs text-red-200 hover:bg-red-950/50">{busy === "remove:" + row.id ? "Ignoring..." : "Ignore Wi-Fi signal"}</button>
              </article>
            ))}
          </div>
        )}
      </section>

      <details className="rounded-xl border border-slate-600/60 bg-slate-900/60 p-4">
        <summary className="cursor-pointer text-sm font-semibold text-slate-200">Ignored Wi-Fi signals ({ignoredWifi.length}) — Restore if needed</summary>
        <div className="mt-3 space-y-2">
          <p className="text-xs text-slate-400">HP2 still scans normally, but ignored Wi-Fi addresses do not return to Device Check. Restore a signal here if it belongs to a mouse you need later.</p>
          {ignoredWifi.length === 0 && <p className="text-sm text-slate-400">No Wi-Fi signals ignored yet.</p>}
          {ignoredWifi.map(item => (
            <div key={item.hardwareKey} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-700 bg-slate-800 p-3">
              <div className="min-w-0">
                <p className="break-all text-sm font-semibold text-white">{item.hostname || "Unidentified Wi-Fi signal"}</p>
                <p className="mt-1 break-all font-mono text-xs text-slate-400">{item.macAddress || item.hardwareKey}</p>
              </div>
              <button type="button" disabled={busy === "restore:" + item.hardwareKey} onClick={() => restoreIgnoredWifi(item)}
                className="rounded border border-cyan-500/50 px-3 py-2 text-xs font-semibold text-cyan-200 disabled:opacity-50">
                {busy === "restore:" + item.hardwareKey ? "Restoring..." : "Restore Wi-Fi signal"}
              </button>
            </div>
          ))}
        </div>
      </details>
      <details className="rounded-2xl border border-amber-500/25 bg-slate-800/65 p-5">
        <summary className="cursor-pointer font-semibold text-amber-200">Advanced: manual Wi-Fi observation</summary>
        <div className="mt-3">
        <h3 className="font-semibold text-white">Check / record HP2 Wi-Fi signal</h3>
        <p className="mt-1 text-sm text-slate-300">
          Press “Check latest HP2 reports” above to load the most recent automatic scanner reports. Automatic scanning requires the separate HP2 Ubuntu agent to be running; this website cannot scan local Wi-Fi by itself. You can also record a real terminal scan below, even after the green pairing light times out. A sighting is not MQTT connectivity.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
          <Input aria-label="Observed Wi-Fi name" value={wifiObservation.ssid}
            onChange={(event) => setWifiObservation((current) => ({ ...current, ssid: event.target.value }))}
            placeholder="Wi-Fi name, e.g. SmartLife-AB12" className="border-slate-600 bg-slate-950 text-white" />
          <Input aria-label="Observed Wi-Fi BSSID" value={wifiObservation.macAddress}
            onChange={(event) => setWifiObservation((current) => ({ ...current, macAddress: event.target.value }))}
            placeholder="Wi-Fi BSSID / MAC" className="border-slate-600 bg-slate-950 text-white" />
          <Input aria-label="Observed AP gateway address" value={wifiObservation.ipAddress}
            onChange={(event) => setWifiObservation((current) => ({ ...current, ipAddress: event.target.value }))}
            placeholder="AP gateway IP (optional)" className="border-slate-600 bg-slate-950 text-white" />
          <Input aria-label="Observed signal percentage" value={wifiObservation.signalPercent}
            onChange={(event) => setWifiObservation((current) => ({ ...current, signalPercent: event.target.value.replace(/[^0-9]/g, "").slice(0, 3) }))}
            inputMode="numeric" placeholder="Signal % e.g. 75" className="border-slate-600 bg-slate-950 text-white" />
        </div>
        <Button type="button" onClick={recordWifiObservation}
          disabled={busy === "wifi-observation" || !wifiObservation.ssid.trim() || !wifiObservation.macAddress.trim()}
          className="mt-3 bg-amber-600 text-white hover:bg-amber-500">
          <Wifi className="mr-2 h-4 w-4" />
          {busy === "wifi-observation" ? "Recording..." : "Save HP2 Wi-Fi sighting (not MQTT)"}
        </Button>
      </div>

      <div className="rounded-2xl border border-blue-500/25 bg-slate-800/70 p-5 space-y-3">
        <h3 className="font-semibold text-white">Register New Device — Pending Activation</h3>
        <p className="text-sm text-slate-300">Save a new device ID, customer and installation area even when no Wi-Fi is detected. This does not provision firmware or establish live MQTT. Mouse #7 is already registered to Addis Restaurant; edit it in Smart Devices instead of registering it again.</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input aria-label="New device ID" placeholder="New unique ID, e.g. FS-MOUSE-000004" value={manualDraft.deviceId} onChange={(e) => setDraft("manual-registration", { deviceId: e.target.value.toUpperCase() })} className="border-slate-600 bg-slate-950 text-white" />
          <Input aria-label="Device name" placeholder="Device name, e.g. Mouse 8" value={manualDraft.deviceName} onChange={(e) => setDraft("manual-registration", { deviceName: e.target.value })} className="border-slate-600 bg-slate-950 text-white" />
          <select aria-label="Customer branch" value={manualDraft.branchId} onChange={(e) => setDraft("manual-registration", { branchId: e.target.value })} className="h-10 w-full rounded-md border border-slate-600 bg-slate-950 px-3 text-sm text-white">
            <option value="">Select customer branch...</option>
            {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
          </select>
          <Input aria-label="Installation area" placeholder="Installation area, e.g. Kitchen / Back Door" value={manualDraft.notes} onChange={(e) => setDraft("manual-registration", { notes: e.target.value })} className="border-slate-600 bg-slate-950 text-white" />
        </div>
        <Button type="button" onClick={() => registerPendingFromWifi({ id: "manual-registration" })} disabled={busy === "pending:manual-registration" || !manualDraft.deviceId.trim() || !manualDraft.deviceName.trim() || !manualDraft.branchId || !manualDraft.notes.trim()} className="bg-blue-600 text-white hover:bg-blue-500">
          {busy === "pending:manual-registration" ? "Saving..." : "Save pending registration (not live)"}
        </Button>
        </div>
      </details>

      {visibleMqttRows.length > 0 && <details className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
        <summary className="cursor-pointer font-semibold text-slate-200">Live MQTT identity — verify and link to branch</summary>
        <div className="mt-4">
      {visibleMqttRows.length === 0 ? (
        <div className="rounded-2xl border border-slate-700 bg-slate-800/65 p-10 text-center">
          <Wifi className="mx-auto h-9 w-9 text-slate-500" />
          <h3 className="mt-3 font-semibold text-white">No verified MQTT identity found</h3>
          <p className="mt-1 text-sm text-slate-400">No current MQTT identity is available to link. Old unverified DEVICE4 test data is hidden; historic records remain saved.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {visibleMqttRows.map((row) => {
            const wifiOnly = row.hardwareKey.startsWith("wifi-ap:");
            const duplicates = row.ipAddress ? (duplicateIpMap.get(row.ipAddress) || []) : [];
            const hasIpConflict = !wifiOnly && duplicates.length > 1;
            const draft = drafts[row.id] || emptyDraft();

            return (
              <div key={row.id} className="rounded-2xl border border-slate-700 bg-slate-800/70 p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-white">{row.hostname || row.mqttPrefix || "Food Safety Mouse"}</h3>
                      <span className={"rounded-full px-2 py-0.5 text-xs font-semibold " + (row.isLive ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-700 text-slate-300")}>
                        {wifiOnly ? (row.isWifiRecentlySeen ? "Wi-Fi seen recently (not MQTT)" : "Wi-Fi sighting saved (not live)") : row.isLive ? "MQTT LIVE" : "Last seen"}
                      </span>
                      {row.assignedDeviceId && (
                        <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-xs font-semibold text-blue-300">IDENTIFIED</span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {wifiOnly ? (row.wifiObservationSource === "hp2-wifi-scan" ? "Last HP2 scanner observation" : "Observation recorded") : "Last seen"}: {row.lastSeenAt ? new Date(row.lastSeenAt).toLocaleString("en-GB", { timeZone: "Europe/London" }) : "Never"}
                    </p>
                  </div>
                  {row.connected && <CheckCircle2 className="h-5 w-5 text-emerald-300" />}
                </div>

                <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div className="rounded-lg bg-slate-900/70 p-3">
                    <p className="text-[11px] uppercase text-slate-500">Wi-Fi MAC / fingerprint</p>
                    <p className="mt-1 break-all font-mono text-sm font-semibold text-white">{row.macAddress || "Waiting for MAC"}</p>
                  </div>
                  <div className="rounded-lg bg-slate-900/70 p-3">
                    <p className="text-[11px] uppercase text-slate-500">Current IP</p>
                    <p className="mt-1 font-mono text-sm font-semibold text-white">{row.ipAddress || (wifiOnly ? "AP IP not recorded" : "Waiting for IP")}</p>
                  </div>
                  <div className="rounded-lg bg-slate-900/70 p-3">
                    <p className="text-[11px] uppercase text-slate-500">MQTT device name</p>
                    <p className="mt-1 font-mono text-sm font-semibold text-white">{wifiOnly ? "Not connected to MQTT" : row.mqttPrefix || "Unknown"}</p>
                  </div>
                  <div className="rounded-lg bg-slate-900/70 p-3">
                    <p className="text-[11px] uppercase text-slate-500">Signal</p>
                    <p className="mt-1 text-sm font-semibold text-white">{wifiOnly ? (row.wifiSignalPercent == null ? "Not recorded" : row.wifiSignalPercent + "% (last Wi-Fi scan)") : row.rssi == null ? "Waiting" : row.rssi + " dBm"}</p>
                  </div>
                </div>

                {hasIpConflict && (
                  <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-100">
                    <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" />
                    <p>
                      This IP is also present on another detected record. Match the MAC before assigning.
                      {duplicates.filter((item) => item.id !== row.id && item.assignedDeviceId).map((item) =>
                        " " + item.assignedDeviceId + (item.assignedBranchName ? " → " + item.assignedBranchName : "") + "."
                      ).join("")}
                    </p>
                  </div>
                )}

                {wifiOnly ? (
                  <>
                  <div className="mt-4 rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-3 text-sm text-cyan-100">
                    Wi-Fi access point detected, but no MQTT device identity or trap events have been verified.
                    You can create a separate pending customer device record below. This Wi-Fi sighting is NOT automatically linked to MQTT or marked live.
                    When green pairing flashing times out, the last recorded signal remains visible as historic information.
                  </div>
                  <div className="mt-3 space-y-3 rounded-xl border border-slate-600 bg-slate-900/60 p-4">
                    <h4 className="font-semibold text-white">Register new customer device (pending activation)</h4>
                    <p className="text-xs text-slate-300">This records the branch and location only. It does not link the SmartLife MAC, configure firmware or enable MQTT alarms. Use Smart Devices to edit an already registered ID.</p>
                    <p className="text-xs text-slate-400">Observed Wi-Fi MAC: {row.macAddress || "Not recorded"}</p>
                    <Input aria-label="New device ID" placeholder="New unique ID, e.g. FS-MOUSE-000004" value={draft.deviceId} onChange={(e) => setDraft(row.id, { deviceId: e.target.value.toUpperCase() })} className="border-slate-600 bg-slate-950 text-white" />
                    <Input aria-label="Device name" placeholder="Device name, e.g. Mouse 8" value={draft.deviceName} onChange={(e) => setDraft(row.id, { deviceName: e.target.value })} className="border-slate-600 bg-slate-950 text-white" />
                    <select aria-label="Customer branch" value={draft.branchId} onChange={(e) => setDraft(row.id, { branchId: e.target.value })} className="h-10 w-full rounded-md border border-slate-600 bg-slate-950 px-3 text-sm text-white">
                      <option value="">Select customer branch...</option>
                      {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
                    </select>
                    <Input aria-label="Installation area" placeholder="Installation area, e.g. Kitchen / Back Door" value={draft.notes} onChange={(e) => setDraft(row.id, { notes: e.target.value })} className="border-slate-600 bg-slate-950 text-white" />
                    <Button type="button" onClick={() => registerPendingFromWifi(row)} disabled={busy === "pending:" + row.id || !draft.deviceId.trim() || !draft.deviceName.trim() || !draft.branchId || !draft.notes.trim()} className="bg-blue-600 text-white hover:bg-blue-500">
                      {busy === "pending:" + row.id ? "Saving..." : "Save as pending (not live)"}
                    </Button>
                  </div>
                  </>
                ) : row.assignedDeviceId ? (
                  <div className="mt-4 rounded-xl border border-blue-500/25 bg-blue-500/10 p-4">
                    <div className="flex items-start gap-2">
                      <Link2 className="mt-0.5 h-4 w-4 text-blue-300" />
                      <div>
                        <p className="font-semibold text-blue-100">{row.assignedDeviceId} — {row.assignedDeviceName || "Food Safety Mouse"}</p>
                        <p className="mt-1 text-sm text-blue-200/80">
                          {row.assignedBranchName ? "Branch: " + row.assignedBranchName : "Not assigned to a branch"}
                          {row.assignedLocation ? " • " + row.assignedLocation : ""}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 space-y-4">
                    <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
                      <h4 className="font-semibold text-white">Already registered?</h4>
                      <p className="mt-1 text-xs text-slate-400">Use this for an existing FS-MOUSE ID after you confirm which physical mouse is switched on.</p>
                      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                        <select
                          value={existingChoice[row.id] || ""}
                          onChange={(event) => setExistingChoice((current) => ({ ...current, [row.id]: event.target.value }))}
                          className="h-10 min-w-0 flex-1 rounded-md border border-slate-600 bg-slate-950 px-3 text-sm text-white"
                        >
                          <option value="">Select existing device...</option>
                          {registered.filter((device) => device.deviceId.toUpperCase() !== "FS-MOUSE-000001").map((device) => {
                            const branch = branches.find((item) => String(item.id) === String(device.branchId || ""));
                            return (
                              <option key={device.id} value={device.deviceId}>
                                {device.deviceId} — {device.deviceName || "Device"}{branch ? " — " + branch.name : ""}
                              </option>
                            );
                          })}
                        </select>
                        <Button
                          type="button"
                          onClick={() => linkExisting(row)}
                          disabled={busy === "link:" + row.id}
                          className="bg-blue-600 text-white hover:bg-blue-500"
                        >
                          <Link2 className="mr-2 h-4 w-4" />
                          {busy === "link:" + row.id ? "Linking..." : "Link Existing"}
                        </Button>
                      </div>
                      {row.legacyDeviceId && (
                        <p className="mt-2 text-xs text-cyan-300">Historical legacy reference: {row.legacyDeviceId}. Select and verify a current registered device manually; this is not an automatic assignment.</p>
                      )}
                    </div>

                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                      <h4 className="font-semibold text-white">New physical mouse</h4>
                      <p className="mt-1 text-xs text-slate-400">Only after you identify this mouse, give it a permanent ID/name and assign it to the correct shop.</p>
                      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <Input
                          value={draft.deviceId}
                          onChange={(event) => setDraft(row.id, { deviceId: event.target.value.toUpperCase() })}
                          placeholder="ID optional, e.g. FS-MOUSE-000002"
                          className="border-slate-600 bg-slate-950 text-white"
                        />
                        <Input
                          value={draft.deviceName}
                          onChange={(event) => setDraft(row.id, { deviceName: event.target.value })}
                          placeholder="Name, e.g. Kitchen"
                          className="border-slate-600 bg-slate-950 text-white"
                        />
                        <details className="relative min-w-0 rounded-md border border-slate-600 bg-slate-950 text-sm text-white">
                          <summary className="flex h-10 cursor-pointer items-center px-3">
                            {branches.find((branch) => branch.id === draft.branchId)?.name || "Select branch..."}
                          </summary>
                          <div className="max-h-40 overflow-y-auto border-t border-slate-600 p-1">
                            {branches.map((branch) => (
                              <button key={branch.id} type="button"
                                className="block w-full rounded px-2 py-2 text-left text-xs hover:bg-slate-700"
                                onClick={(event) => {
                                  setDraft(row.id, { branchId: branch.id });
                                  event.currentTarget.closest("details")?.removeAttribute("open");
                                }}>
                                {branch.name}{branch.address ? " — " + branch.address : ""}{branch.postCode ? " " + branch.postCode : ""}
                              </button>
                            ))}
                          </div>
                        </details>
                        <Input
                          value={draft.notes}
                          onChange={(event) => setDraft(row.id, { notes: event.target.value })}
                          placeholder="Installation area, e.g. Kitchen"
                          className="border-slate-600 bg-slate-950 text-white"
                        />
                      </div>
                      <Button
                        type="button"
                        onClick={() => registerAndAssign(row)}
                        disabled={busy === "assign:" + row.id || !draft.deviceName.trim() || !draft.branchId}
                        className="mt-3 bg-emerald-600 text-white hover:bg-emerald-500"
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        {busy === "assign:" + row.id ? "Assigning..." : "Register & Assign This Physical Mouse"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
        </div>
      </details>}
    </div>
  );
}
