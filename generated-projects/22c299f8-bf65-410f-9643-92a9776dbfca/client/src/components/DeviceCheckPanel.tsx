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
  const [registered, setRegistered] = useState<RegisteredDevice[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [scanStartedAt, setScanStartedAt] = useState(0);
  const [baselineWifiKeys, setBaselineWifiKeys] = useState<string[]>([]);
  const beginMouseScan = (branchId: string) => {
    setSelectedBranchId(branchId);
    setBaselineWifiKeys(rows.filter(row =>
      row.hardwareKey.startsWith("wifi-ap:") && row.isWifiRecentlySeen
    ).map(row => row.hardwareKey));
    setScanStartedAt(Date.now());
  };
  const [busy, setBusy] = useState("");
  const [wifiAssignOpenId, setWifiAssignOpenId] = useState("");
  const [wifiPhysicallyConfirmed, setWifiPhysicallyConfirmed] = useState<Record<string, boolean>>({});
  const [wifiObservation, setWifiObservation] = useState({ ssid: "", macAddress: "", ipAddress: "", signalPercent: "" });

  const [existingChoice, setExistingChoice] = useState<Record<string, string>>({});
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});

  const load = async () => {
    const [checkRes, devicesRes, branchesRes] = await Promise.all([
      fetch("/api/iot/device-check", { credentials: "include", cache: "no-store" }),
      fetch("/api/iot/devices", { credentials: "include", cache: "no-store" }),
      fetch("/api/branches?page=1&limit=5000", { credentials: "include", cache: "no-store" }),
    ]);

    if (checkRes.ok) {
      const data = await checkRes.json();
      setRows(Array.isArray(data) ? data : []);
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
    live: rows.filter((row) => row.isLive && !row.hardwareKey.startsWith("wifi-ap:")).length,
    wifiSeen: selectedBranchId && scanStartedAt ? rows.filter(row =>
      row.hardwareKey.startsWith("wifi-ap:") &&
      row.wifiObservationSource === "hp2-wifi-scan" &&
      row.isWifiRecentlySeen &&
      !baselineWifiKeys.includes(row.hardwareKey) &&
      Boolean(row.lastSeenAt) &&
      new Date(row.lastSeenAt!).getTime() > scanStartedAt
    ).length : 0,
    unassigned: rows.filter(row => !row.assignedDeviceId && !row.hardwareKey.startsWith("wifi-ap:") && row.isLive).length,
    linked: rows.filter((row) => Boolean(row.assignedDeviceId)).length,
  }), [rows, selectedBranchId, scanStartedAt, baselineWifiKeys]);

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

  const freshMouseSightings = rows.filter(row =>
    Boolean(selectedBranchId) &&
    row.hardwareKey.startsWith("wifi-ap:") &&
    row.wifiObservationSource === "hp2-wifi-scan" &&
    row.isWifiRecentlySeen &&
    !baselineWifiKeys.includes(row.hardwareKey) &&
    Boolean(row.lastSeenAt) &&
    new Date(row.lastSeenAt!).getTime() > scanStartedAt &&
    !row.assignedDeviceId
  );
  const unassignedWifiTotal = freshMouseSightings.length;
  const unassignedSightings = freshMouseSightings.slice(0, 10);
  const branchDevices = rows.filter(row => selectedBranchId && row.assignedBranchId === selectedBranchId).slice(0, 30);
  const removeWifiSighting = async (row: DeviceCheckRow) => {
    if (!window.confirm("Remove this Wi-Fi sighting only? Registered devices, assignments and MQTT history will remain.")) return;
    setBusy("remove:" + row.id);
    try {
      const response = await fetch("/api/iot/device-check/" + encodeURIComponent(row.id) + "/wifi-sighting", { method: "DELETE", credentials: "include" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.message || "Sighting could not be removed");
      await load();
      toast({ title: "Wi-Fi sighting removed" });
    } catch (err: any) {
      toast({ title: "Could not remove sighting", description: err?.message, variant: "destructive" });
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
        <Button type="button" onClick={() => load().catch(() => {})} className="bg-slate-800 text-white hover:bg-slate-700">
          <RefreshCw className="mr-2 h-4 w-4" />
          Check latest HP2 reports
        </Button>
      </div>

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
            <p className="text-xs text-cyan-200">Wi-Fi AP sightings</p>
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
        <select value={selectedBranchId} aria-label="Select branch before viewing devices"
          onChange={e => beginMouseScan(e.target.value)}
          className="mt-3 h-10 w-full max-w-md rounded border border-slate-600 bg-slate-950 px-3 text-white">
          <option value="">Choose branch, then switch ON one mouse...</option>
          {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        {selectedBranchId && <>
          <p className="mt-3 text-sm text-white">MQTT-live identities assigned to this branch ({branchDevices.filter(row => row.isLive).length})</p>
          {branchDevices.filter(row => row.isLive).slice(0, 10).map(row => <p key={row.id} className="mt-2 rounded bg-slate-800 p-2 text-sm text-white">{row.assignedDeviceId} — {row.assignedDeviceName || row.hostname} — MQTT live</p>)}
          <button type="button" onClick={() => beginMouseScan(selectedBranchId)} className="mt-3 rounded border border-cyan-500/60 px-3 py-2 text-sm text-cyan-100">Start fresh detection for next mouse</button>
          <p className="mt-2 text-xs text-slate-400">Keep other mice OFF. New Wi-Fi signals are candidates, not proof of physical identity or MQTT connectivity.</p>
        </>}
        {!selectedBranchId && <p className="mt-3 text-sm text-cyan-200">Clean slate. Select Addis Restaurant or another branch, then switch ON one mouse. Old test sightings stay hidden.</p>}
      </section>
      {selectedBranchId && (
      <section className="space-y-3" aria-label="HP2 detected Wi-Fi mice">
        <div>
          <h3 className="text-lg font-bold text-white">New Wi-Fi detections ({unassignedWifiTotal})</h3>
          <p className="text-sm text-slate-300">Only new HP2 signals since this branch was selected appear here. Old saved sightings stay hidden. Confirm the physical mouse before assigning it; Wi-Fi is not MQTT.</p>
          {unassignedWifiTotal > 10 && <p className="mt-1 text-xs text-amber-200">Showing the 10 newest of {unassignedWifiTotal} signals to keep this page responsive.</p>}
        </div>
        {unassignedSightings.length === 0 ? (
          <div className="rounded-xl border border-dashed border-cyan-500/30 bg-slate-900/60 p-5 text-sm text-slate-300">
            No new Wi-Fi signal yet. Switch ON the mouse you want to identify, keeping other mice OFF. This page checks HP2 reports automatically.
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
                    {row.isWifiRecentlySeen ? "Recently detected" : "Previous sighting"}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-slate-800 p-3"><p className="text-xs text-slate-400">Last Wi-Fi signal</p><p className="font-semibold text-white">{row.wifiSignalPercent == null ? "Not reported" : row.wifiSignalPercent + "%"}</p></div>
                  <div className="rounded-lg bg-slate-800 p-3"><p className="text-xs text-slate-400">MQTT</p><p className="font-semibold text-amber-200">Not verified</p></div>
                </div>
                <p className="mt-3 text-xs text-slate-400">Last HP2 report: {row.lastSeenAt ? new Date(row.lastSeenAt).toLocaleString("en-GB", { timeZone: "Europe/London" }) : "Never"}</p>
                <p className="mt-1 text-xs text-slate-400">{row.wifiObservationSource === "admin-entry" ? "Manually recorded" : "HP2 scanner observation"} · Not assigned automatically</p>
                <button type="button" disabled={busy === "remove:" + row.id} onClick={() => removeWifiSighting(row)} className="mt-3 rounded border border-red-500/40 px-3 py-1.5 text-xs text-red-200 hover:bg-red-950/50">Remove Wi-Fi Sighting</button>
              </article>
            ))}
          </div>
        )}
      </section>
      )}

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
