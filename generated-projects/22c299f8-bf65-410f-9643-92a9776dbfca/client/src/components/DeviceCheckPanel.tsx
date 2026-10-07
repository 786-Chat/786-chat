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

export default function DeviceCheckPanel() {
  const { toast } = useToast();
  const [rows, setRows] = useState<DeviceCheckRow[]>([]);
  const [registered, setRegistered] = useState<RegisteredDevice[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [busy, setBusy] = useState("");
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

  useEffect(() => {
    load().catch(() => {});
    const timer = window.setInterval(() => load().catch(() => {}), 5000);
    return () => window.clearInterval(timer);
  }, []);

  const counts = useMemo(() => ({
    live: rows.filter((row) => row.isLive).length,
    unassigned: rows.filter((row) => !row.assignedDeviceId).length,
    linked: rows.filter((row) => Boolean(row.assignedDeviceId)).length,
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

  const linkExisting = async (row: DeviceCheckRow) => {
    const deviceId = String(existingChoice[row.id] || row.legacyDeviceId || "").trim();
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
    const draft = drafts[row.id] || emptyDraft();
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

      const linkResponse = await fetch("/api/iot/device-check/" + row.id + "/link-existing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ deviceId: permanentDeviceId }),
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
        description: permanentDeviceId + " is now tied to this physical mouse and branch.",
      });
      await load();
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="space-y-5 w-full max-w-full">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-600">
            <Radar className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Device Check</h2>
            <p className="text-sm text-slate-400">Identify a physical mouse before assigning it to any branch</p>
          </div>
        </div>
        <Button type="button" onClick={() => load().catch(() => {})} className="bg-slate-800 text-white hover:bg-slate-700">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="rounded-2xl border border-cyan-500/30 bg-slate-800/65 p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 text-cyan-300" />
          <div>
            <h3 className="font-semibold text-white">Safe physical identification</h3>
            <p className="mt-1 text-sm text-slate-300">
              Turn on only one mouse at a time. HP2 records its live MQTT name, IP address and Wi-Fi MAC. The MAC is the permanent fingerprint; the IP can change.
              Nothing on this page belongs to a customer branch until you explicitly link or assign it.
            </p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-center">
            <p className="text-2xl font-bold text-emerald-300">{counts.live}</p>
            <p className="text-xs text-emerald-200">Live now</p>
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

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-slate-700 bg-slate-800/65 p-10 text-center">
          <Wifi className="mx-auto h-9 w-9 text-slate-500" />
          <h3 className="mt-3 font-semibold text-white">No physical mouse detected yet</h3>
          <p className="mt-1 text-sm text-slate-400">After the HP2 bridge update, turn on one mouse. It will appear here automatically.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {rows.map((row) => {
            const duplicates = row.ipAddress ? (duplicateIpMap.get(row.ipAddress) || []) : [];
            const hasIpConflict = duplicates.length > 1;
            const draft = drafts[row.id] || emptyDraft();

            return (
              <div key={row.id} className="rounded-2xl border border-slate-700 bg-slate-800/70 p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-white">{row.hostname || row.mqttPrefix || "Food Safety Mouse"}</h3>
                      <span className={"rounded-full px-2 py-0.5 text-xs font-semibold " + (row.isLive ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-700 text-slate-300")}>
                        {row.isLive ? "LIVE" : "Last seen"}
                      </span>
                      {row.assignedDeviceId && (
                        <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-xs font-semibold text-blue-300">IDENTIFIED</span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      Last seen: {row.lastSeenAt ? new Date(row.lastSeenAt).toLocaleString("en-GB", { timeZone: "Europe/London" }) : "Never"}
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
                    <p className="mt-1 font-mono text-sm font-semibold text-white">{row.ipAddress || "Waiting for IP"}</p>
                  </div>
                  <div className="rounded-lg bg-slate-900/70 p-3">
                    <p className="text-[11px] uppercase text-slate-500">MQTT device name</p>
                    <p className="mt-1 font-mono text-sm font-semibold text-white">{row.mqttPrefix || "Unknown"}</p>
                  </div>
                  <div className="rounded-lg bg-slate-900/70 p-3">
                    <p className="text-[11px] uppercase text-slate-500">Signal</p>
                    <p className="mt-1 text-sm font-semibold text-white">{row.rssi == null ? "Waiting" : row.rssi + " dBm"}</p>
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

                {row.assignedDeviceId ? (
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
                          value={existingChoice[row.id] || row.legacyDeviceId || ""}
                          onChange={(event) => setExistingChoice((current) => ({ ...current, [row.id]: event.target.value }))}
                          className="h-10 min-w-0 flex-1 rounded-md border border-slate-600 bg-slate-950 px-3 text-sm text-white"
                        >
                          <option value="">Select existing device...</option>
                          {registered.map((device) => {
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
                        <p className="mt-2 text-xs text-cyan-300">HP2 legacy bridge currently suggests: {row.legacyDeviceId}. Confirm physically before linking.</p>
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
                        <select
                          value={draft.branchId}
                          onChange={(event) => setDraft(row.id, { branchId: event.target.value })}
                          className="h-10 rounded-md border border-slate-600 bg-slate-950 px-3 text-sm text-white"
                        >
                          <option value="">Select branch...</option>
                          {branches.map((branch) => (
                            <option key={branch.id} value={branch.id}>
                              {branch.name}{branch.address ? " — " + branch.address : ""}{branch.postCode ? " " + branch.postCode : ""}
                            </option>
                          ))}
                        </select>
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
  );
}
