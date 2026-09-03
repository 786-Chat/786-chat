import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { DeviceBrand, Device, DeviceCustomer, DeviceGroup } from "@shared/schema";
import { ArrowLeft, Plus, Pencil, Trash2, Wifi, WifiOff, Users, Cpu, FolderOpen, Power, Droplets, Wind, Signal, LogOut, Copy, Bluetooth, Search, Radio, ChevronUp, ChevronDown, Gauge, X } from "lucide-react";

interface ScannedDevice {
  id: string;
  name: string;
  type: "bluetooth" | "wifi";
  signal: number;
  mac: string;
  model: string;
}

const SIMULATED_BT_DEVICES: ScannedDevice[] = [
  { id: "bt-1", name: "SCHICC-PRO-A1B2", type: "bluetooth", signal: -42, mac: "AA:BB:CC:11:22:33", model: "SCHICC Pro" },
  { id: "bt-2", name: "SCHICC-PRO-C3D4", type: "bluetooth", signal: -55, mac: "AA:BB:CC:44:55:66", model: "SCHICC Pro" },
  { id: "bt-3", name: "SCHICC-PRO-E5F6", type: "bluetooth", signal: -68, mac: "AA:BB:CC:77:88:99", model: "SCHICC Pro" },
  { id: "bt-4", name: "SCHICC-MINI-G7H8", type: "bluetooth", signal: -73, mac: "DD:EE:FF:11:22:33", model: "SCHICC Mini" },
];

const SIMULATED_WIFI_DEVICES: ScannedDevice[] = [
  { id: "wf-1", name: "SCHICC-WiFi-X1Y2", type: "wifi", signal: -35, mac: "11:22:33:AA:BB:CC", model: "SCHICC Pro" },
  { id: "wf-2", name: "SCHICC-WiFi-Z3W4", type: "wifi", signal: -48, mac: "44:55:66:DD:EE:FF", model: "SCHICC Pro" },
  { id: "wf-3", name: "SCHICC-WiFi-V5U6", type: "wifi", signal: -62, mac: "77:88:99:AA:BB:CC", model: "SCHICC Pro" },
];

export default function DeviceBrandDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const brandId = localStorage.getItem("deviceBrandId");
  const brandName = localStorage.getItem("deviceBrandName");

  const [activeTab, setActiveTab] = useState("devices");
  const [showDeviceForm, setShowDeviceForm] = useState(false);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<DeviceCustomer | null>(null);
  const [editingGroup, setEditingGroup] = useState<DeviceGroup | null>(null);

  const [scanMode, setScanMode] = useState<"none" | "bluetooth" | "wifi">("none");
  const [isScanning, setIsScanning] = useState(false);
  const [scannedDevices, setScannedDevices] = useState<ScannedDevice[]>([]);
  const [controllingDevice, setControllingDevice] = useState<Device | null>(null);

  const [deviceForm, setDeviceForm] = useState({ serialNumber: "", name: "Diffuser", model: "SCHICC Pro", firmwareVersion: "1.0.0", customerId: "", groupId: "" });
  const [customerForm, setCustomerForm] = useState({ name: "", email: "", phone: "", company: "", address: "", loginUsername: "", loginPassword: "" });
  const [groupForm, setGroupForm] = useState({ name: "", description: "", customerId: "" });

  useEffect(() => {
    if (!brandId) setLocation("/device-brand-login");
  }, [brandId, setLocation]);

  const { data: brand } = useQuery<DeviceBrand>({ queryKey: ["/api/device-brands", brandId], queryFn: async () => { const r = await fetch(`/api/device-brands/${brandId}`); return r.json(); }, enabled: !!brandId });
  const { data: devices = [] } = useQuery<Device[]>({ queryKey: [`/api/device-brands/${brandId}/devices`], enabled: !!brandId, refetchInterval: 5000 });
  const { data: customers = [] } = useQuery<DeviceCustomer[]>({ queryKey: [`/api/device-brands/${brandId}/customers`], enabled: !!brandId });
  const { data: groups = [] } = useQuery<DeviceGroup[]>({ queryKey: [`/api/device-brands/${brandId}/groups`], enabled: !!brandId });

  const onlineCount = devices.filter(d => d.isOnline).length;
  const offlineCount = devices.filter(d => !d.isOnline).length;

  const createDeviceMut = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/devices", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...data, brandId }) });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [`/api/device-brands/${brandId}/devices`] }); setShowDeviceForm(false); resetDeviceForm(); toast({ title: "Device added successfully" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateDeviceMut = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/devices/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/device-brands/${brandId}/devices`] });
      if (controllingDevice && data.id === controllingDevice.id) setControllingDevice(data);
      if (editingDevice) { setShowDeviceForm(false); setEditingDevice(null); resetDeviceForm(); }
      toast({ title: "Device updated" });
    },
  });

  const deleteDeviceMut = useMutation({
    mutationFn: async (id: string) => { await fetch(`/api/devices/${id}`, { method: "DELETE" }); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [`/api/device-brands/${brandId}/devices`] }); setControllingDevice(null); toast({ title: "Device deleted" }); },
  });

  const createCustomerMut = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/device-customers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...data, brandId }) });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [`/api/device-brands/${brandId}/customers`] }); setShowCustomerForm(false); resetCustomerForm(); toast({ title: "Customer created" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateCustomerMut = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/device-customers/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [`/api/device-brands/${brandId}/customers`] }); setShowCustomerForm(false); setEditingCustomer(null); resetCustomerForm(); toast({ title: "Customer updated" }); },
  });

  const deleteCustomerMut = useMutation({
    mutationFn: async (id: string) => { await fetch(`/api/device-customers/${id}`, { method: "DELETE" }); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [`/api/device-brands/${brandId}/customers`] }); toast({ title: "Customer deleted" }); },
  });

  const createGroupMut = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/device-groups", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...data, brandId }) });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [`/api/device-brands/${brandId}/groups`] }); setShowGroupForm(false); resetGroupForm(); toast({ title: "Group created" }); },
  });

  const updateGroupMut = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/device-groups/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [`/api/device-brands/${brandId}/groups`] }); setShowGroupForm(false); setEditingGroup(null); resetGroupForm(); toast({ title: "Group updated" }); },
  });

  const deleteGroupMut = useMutation({
    mutationFn: async (id: string) => { await fetch(`/api/device-groups/${id}`, { method: "DELETE" }); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [`/api/device-brands/${brandId}/groups`] }); toast({ title: "Group deleted" }); },
  });

  function resetDeviceForm() { setDeviceForm({ serialNumber: "", name: "Diffuser", model: "SCHICC Pro", firmwareVersion: "1.0.0", customerId: "", groupId: "" }); }
  function resetCustomerForm() { setCustomerForm({ name: "", email: "", phone: "", company: "", address: "", loginUsername: "", loginPassword: "" }); }
  function resetGroupForm() { setGroupForm({ name: "", description: "", customerId: "" }); }

  function handleLogout() {
    localStorage.removeItem("deviceBrandId");
    localStorage.removeItem("deviceBrandSlug");
    localStorage.removeItem("deviceBrandName");
    setLocation("/device-brand-login");
  }

  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => { if (scanIntervalRef.current) clearInterval(scanIntervalRef.current); };
  }, []);

  const startScan = useCallback((type: "bluetooth" | "wifi") => {
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    setScanMode(type);
    setIsScanning(true);
    setScannedDevices([]);
    const sourceDevices = type === "bluetooth" ? [...SIMULATED_BT_DEVICES] : [...SIMULATED_WIFI_DEVICES];
    let idx = 0;
    const interval = setInterval(() => {
      if (idx < sourceDevices.length) {
        const device = sourceDevices[idx];
        if (device) setScannedDevices(prev => [...prev, device]);
        idx++;
      } else {
        clearInterval(interval);
        scanIntervalRef.current = null;
        setIsScanning(false);
      }
    }, 800);
    scanIntervalRef.current = interval;
  }, []);

  function addScannedDevice(scanned: ScannedDevice) {
    const serialNumber = `SCHICC-${scanned.mac.replace(/:/g, "").slice(-6).toUpperCase()}`;
    const existingSerials = devices.map(d => d.serialNumber);
    if (existingSerials.includes(serialNumber)) {
      toast({ title: "Device already registered", description: `Serial: ${serialNumber}`, variant: "destructive" });
      return;
    }
    createDeviceMut.mutate({
      serialNumber,
      name: scanned.name,
      model: scanned.model,
      firmwareVersion: "1.0.0",
      customerId: "",
      groupId: "",
      isOnline: true,
      liquidLevel: 95,
      fanSpeed: 5,
      concentration: 70,
    });
    setScannedDevices(prev => prev.filter(d => d.id !== scanned.id));
  }

  function handleDeviceControl(device: Device, field: string, value: any) {
    updateDeviceMut.mutate({ id: device.id, data: { [field]: value } });
  }

  if (!brandId) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
      <header className="border-b border-white/10 bg-black/30 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Wifi className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">{brandName || "Device Brand"}</h1>
              <p className="text-xs text-gray-400">Smart Device Management</p>
            </div>
          </div>
          <Button variant="ghost" onClick={handleLogout} className="text-gray-400 hover:text-white" data-testid="button-logout">
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="rounded-xl bg-white/5 p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-cyan-500/20 flex items-center justify-center"><Cpu className="h-5 w-5 text-cyan-400" /></div>
            <div><p className="text-2xl font-bold text-white" data-testid="text-total-devices">{devices.length}</p><p className="text-xs text-gray-400">Total Devices</p></div>
          </div>
          <div className="rounded-xl bg-white/5 p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-500/20 flex items-center justify-center"><Wifi className="h-5 w-5 text-green-400" /></div>
            <div><p className="text-2xl font-bold text-white" data-testid="text-online-count">{onlineCount}</p><p className="text-xs text-gray-400">Online</p></div>
          </div>
          <div className="rounded-xl bg-white/5 p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-red-500/20 flex items-center justify-center"><WifiOff className="h-5 w-5 text-red-400" /></div>
            <div><p className="text-2xl font-bold text-white" data-testid="text-offline-count">{offlineCount}</p><p className="text-xs text-gray-400">Offline</p></div>
          </div>
          <div className="rounded-xl bg-white/5 p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center"><Users className="h-5 w-5 text-purple-400" /></div>
            <div><p className="text-2xl font-bold text-white" data-testid="text-customer-count">{customers.length}</p><p className="text-xs text-gray-400">Customers</p></div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white/5 border-0 mb-6">
            <TabsTrigger value="devices" className="data-[state=active]:bg-cyan-600" data-testid="tab-devices"><Cpu className="h-4 w-4 mr-2" />Devices ({devices.length})</TabsTrigger>
            <TabsTrigger value="scan" className="data-[state=active]:bg-cyan-600" data-testid="tab-scan"><Search className="h-4 w-4 mr-2" />Scan Devices</TabsTrigger>
            <TabsTrigger value="customers" className="data-[state=active]:bg-cyan-600" data-testid="tab-customers"><Users className="h-4 w-4 mr-2" />Customers ({customers.length})</TabsTrigger>
            <TabsTrigger value="groups" className="data-[state=active]:bg-cyan-600" data-testid="tab-groups"><FolderOpen className="h-4 w-4 mr-2" />Groups ({groups.length})</TabsTrigger>
          </TabsList>

          {/* SCAN DEVICES TAB */}
          <TabsContent value="scan">
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => startScan("bluetooth")}
                  disabled={isScanning}
                  className={`flex-1 rounded-xl p-6 transition-all ${scanMode === "bluetooth" ? "bg-blue-600/20 ring-2 ring-blue-500" : "bg-white/5 hover:bg-white/10"} ${isScanning ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                  data-testid="button-scan-bluetooth"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-16 w-16 rounded-2xl bg-blue-500/20 flex items-center justify-center">
                      <Bluetooth className={`h-8 w-8 text-blue-400 ${isScanning && scanMode === "bluetooth" ? "animate-pulse" : ""}`} />
                    </div>
                    <div className="text-center">
                      <h3 className="text-lg font-bold text-white">Bluetooth Scan</h3>
                      <p className="text-sm text-gray-400">Search nearby Bluetooth devices</p>
                    </div>
                    {isScanning && scanMode === "bluetooth" && (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-400 border-t-transparent"></div>
                        <span className="text-sm text-blue-400">Scanning...</span>
                      </div>
                    )}
                  </div>
                </button>
                <button
                  onClick={() => startScan("wifi")}
                  disabled={isScanning}
                  className={`flex-1 rounded-xl p-6 transition-all ${scanMode === "wifi" ? "bg-green-600/20 ring-2 ring-green-500" : "bg-white/5 hover:bg-white/10"} ${isScanning ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                  data-testid="button-scan-wifi"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-16 w-16 rounded-2xl bg-green-500/20 flex items-center justify-center">
                      <Wifi className={`h-8 w-8 text-green-400 ${isScanning && scanMode === "wifi" ? "animate-pulse" : ""}`} />
                    </div>
                    <div className="text-center">
                      <h3 className="text-lg font-bold text-white">Wi-Fi Scan</h3>
                      <p className="text-sm text-gray-400">Search nearby Wi-Fi devices</p>
                    </div>
                    {isScanning && scanMode === "wifi" && (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-400 border-t-transparent"></div>
                        <span className="text-sm text-green-400">Scanning...</span>
                      </div>
                    )}
                  </div>
                </button>
              </div>

              {scannedDevices.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <Radio className="h-5 w-5 text-cyan-400" />
                    Found {scannedDevices.length} Device{scannedDevices.length > 1 ? "s" : ""} Nearby
                    {isScanning && <div className="animate-spin rounded-full h-4 w-4 border-2 border-cyan-400 border-t-transparent ml-2"></div>}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {scannedDevices.map((scanned) => {
                      const signalStrength = Math.min(100, Math.max(0, 100 + scanned.signal));
                      return (
                        <div key={scanned.id} className="rounded-xl bg-white/5 p-4 hover:bg-white/10 transition-all" data-testid={`card-scanned-${scanned.id}`}>
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${scanned.type === "bluetooth" ? "bg-blue-500/20" : "bg-green-500/20"}`}>
                                {scanned.type === "bluetooth" ? <Bluetooth className="h-5 w-5 text-blue-400" /> : <Wifi className="h-5 w-5 text-green-400" />}
                              </div>
                              <div>
                                <h4 className="font-semibold text-white text-sm">{scanned.name}</h4>
                                <p className="text-xs text-gray-500">{scanned.mac}</p>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-1 text-xs text-gray-400 mb-3">
                            <div className="flex justify-between"><span>Model</span><span className="text-white">{scanned.model}</span></div>
                            <div className="flex justify-between"><span>Signal</span>
                              <div className="flex items-center gap-2">
                                <div className="w-12 h-1.5 bg-gray-700 rounded-full overflow-hidden"><div className={`h-full rounded-full ${signalStrength > 60 ? "bg-green-500" : signalStrength > 30 ? "bg-yellow-500" : "bg-red-500"}`} style={{ width: `${signalStrength}%` }}></div></div>
                                <span className="text-white">{scanned.signal}dBm</span>
                              </div>
                            </div>
                            <div className="flex justify-between"><span>Type</span><span className={scanned.type === "bluetooth" ? "text-blue-400" : "text-green-400"}>{scanned.type === "bluetooth" ? "Bluetooth" : "Wi-Fi"}</span></div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => addScannedDevice(scanned)}
                            className="w-full bg-cyan-600 hover:bg-cyan-700"
                            disabled={createDeviceMut.isPending}
                            data-testid={`button-add-scanned-${scanned.id}`}
                          >
                            <Plus className="h-3 w-3 mr-1" /> Add Device
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {scanMode !== "none" && !isScanning && scannedDevices.length === 0 && (
                <div className="rounded-xl bg-white/5 py-12 text-center">
                  <Search className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">No devices found. Try scanning again.</p>
                </div>
              )}

              {scanMode === "none" && (
                <div className="rounded-xl bg-white/5 py-16 text-center">
                  <div className="flex justify-center gap-4 mb-4">
                    <Bluetooth className="h-10 w-10 text-blue-400/40" />
                    <Wifi className="h-10 w-10 text-green-400/40" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Scan for Devices</h3>
                  <p className="text-gray-400">Choose Bluetooth or Wi-Fi to discover nearby SCHICC devices</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* DEVICES TAB */}
          <TabsContent value="devices">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-white">Registered Devices</h2>
              <div className="flex gap-2">
                <Button onClick={() => setActiveTab("scan")} variant="outline" className="border-white/20 text-white hover:bg-white/10" data-testid="button-goto-scan">
                  <Search className="h-4 w-4 mr-2" /> Scan Devices
                </Button>
                <Button onClick={() => { resetDeviceForm(); setEditingDevice(null); setShowDeviceForm(true); }} className="bg-cyan-600 hover:bg-cyan-700" data-testid="button-add-device">
                  <Plus className="h-4 w-4 mr-2" /> Register Device
                </Button>
              </div>
            </div>
            {devices.length === 0 ? (
              <div className="rounded-xl bg-white/5 py-12 text-center">
                <Cpu className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 mb-4">No devices registered yet</p>
                <Button onClick={() => setActiveTab("scan")} className="bg-cyan-600 hover:bg-cyan-700">
                  <Search className="h-4 w-4 mr-2" /> Scan for Devices
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {devices.map((device) => {
                  const customer = customers.find(c => c.id === device.customerId);
                  const group = groups.find(g => g.id === device.groupId);
                  const isControlOpen = controllingDevice?.id === device.id;
                  return (
                    <div key={device.id} className={`rounded-xl bg-white/5 overflow-hidden transition-all ${isControlOpen ? "ring-2 ring-cyan-500" : "hover:bg-white/[0.07]"}`} data-testid={`card-device-${device.id}`}>
                      <div className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${device.isOnline ? "bg-green-500/20" : "bg-gray-500/20"}`}>
                              {device.isOnline ? <Wifi className="h-5 w-5 text-green-400" /> : <WifiOff className="h-5 w-5 text-gray-500" />}
                            </div>
                            <div>
                              <h3 className="font-semibold text-white">{device.name}</h3>
                              <p className="text-xs text-gray-400">SN: {device.serialNumber}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {device.isRunning && <Badge className="bg-green-500/20 text-green-400 border-0 text-xs">Running</Badge>}
                            {!device.isRunning && device.isOnline && <Badge className="bg-yellow-500/20 text-yellow-400 border-0 text-xs">Idle</Badge>}
                            {!device.isOnline && <Badge className="bg-gray-500/20 text-gray-400 border-0 text-xs">Offline</Badge>}
                          </div>
                        </div>

                        <div className="space-y-2 mb-3 text-sm">
                          <div className="flex justify-between text-gray-400"><span>Model</span><span className="text-white font-medium">{device.model}</span></div>
                          <div className="flex justify-between items-center text-gray-400">
                            <span className="flex items-center gap-1"><Droplets className="h-3 w-3" /> Liquid Level</span>
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden"><div className={`h-full rounded-full transition-all ${(device.liquidLevel || 0) > 30 ? "bg-cyan-500" : "bg-red-500"}`} style={{ width: `${device.liquidLevel || 0}%` }}></div></div>
                              <span className="text-white font-medium w-10 text-right">{device.liquidLevel}%</span>
                            </div>
                          </div>
                          <div className="flex justify-between text-gray-400"><span className="flex items-center gap-1"><Wind className="h-3 w-3" /> Fan Speed</span><span className="text-white font-medium">{device.fanSpeed}/5</span></div>
                          <div className="flex justify-between text-gray-400"><span className="flex items-center gap-1"><Gauge className="h-3 w-3" /> Concentration</span><span className="text-white font-medium">{device.concentration}%</span></div>
                          {customer && <div className="flex justify-between text-gray-400"><span className="flex items-center gap-1"><Users className="h-3 w-3" /> Customer</span><span className="text-cyan-400">{customer.name}</span></div>}
                          {group && <div className="flex justify-between text-gray-400"><span>Group</span><span className="text-purple-400">{group.name}</span></div>}
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => setControllingDevice(isControlOpen ? null : device)}
                            className={`flex-1 ${isControlOpen ? "bg-cyan-600 hover:bg-cyan-700 text-white" : "bg-white/10 hover:bg-white/15 text-white"}`}
                            data-testid={`button-control-device-${device.id}`}
                          >
                            <Power className="h-3 w-3 mr-1" /> Controls
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => { setEditingDevice(device); setDeviceForm({ serialNumber: device.serialNumber, name: device.name || "Diffuser", model: device.model || "SCHICC Pro", firmwareVersion: device.firmwareVersion || "1.0.0", customerId: device.customerId || "", groupId: device.groupId || "" }); setShowDeviceForm(true); }} className="border-white/20 text-white hover:bg-white/10" data-testid={`button-edit-device-${device.id}`}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => { if (confirm("Delete this device?")) deleteDeviceMut.mutate(device.id); }} data-testid={`button-delete-device-${device.id}`}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {isControlOpen && (
                        <div className="border-t border-white/10 bg-white/[0.03] p-5 space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-white flex items-center gap-2"><Power className="h-4 w-4 text-cyan-400" /> Power</span>
                            <div className="flex items-center gap-3">
                              <span className={`text-xs ${device.isRunning ? "text-green-400" : "text-gray-500"}`}>{device.isRunning ? "ON" : "OFF"}</span>
                              <Switch
                                checked={device.isRunning || false}
                                onCheckedChange={(val) => handleDeviceControl(device, "isRunning", val)}
                                data-testid={`switch-power-${device.id}`}
                              />
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-white flex items-center gap-2"><Droplets className="h-4 w-4 text-cyan-400" /> Liquid Level</span>
                              <span className="text-sm text-white font-bold">{device.liquidLevel}%</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeviceControl(device, "liquidLevel", Math.max(0, (device.liquidLevel || 0) - 5))}
                                className="border-white/20 text-white hover:bg-white/10 h-8 w-8 p-0"
                                data-testid={`button-liquid-down-${device.id}`}
                              >
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                              <div className="flex-1 h-3 bg-gray-700 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full transition-all ${(device.liquidLevel || 0) > 30 ? "bg-gradient-to-r from-cyan-600 to-cyan-400" : "bg-gradient-to-r from-red-600 to-red-400"}`} style={{ width: `${device.liquidLevel || 0}%` }}></div>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeviceControl(device, "liquidLevel", Math.min(100, (device.liquidLevel || 0) + 5))}
                                className="border-white/20 text-white hover:bg-white/10 h-8 w-8 p-0"
                                data-testid={`button-liquid-up-${device.id}`}
                              >
                                <ChevronUp className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-white flex items-center gap-2"><Wind className="h-4 w-4 text-cyan-400" /> Fan Speed</span>
                              <span className="text-sm text-white font-bold">{device.fanSpeed}/5</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeviceControl(device, "fanSpeed", Math.max(0, (device.fanSpeed || 0) - 1))}
                                className="border-white/20 text-white hover:bg-white/10 h-8 w-8 p-0"
                                data-testid={`button-fan-down-${device.id}`}
                              >
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                              <div className="flex-1 flex gap-1">
                                {[1,2,3,4,5].map(level => (
                                  <button
                                    key={level}
                                    onClick={() => handleDeviceControl(device, "fanSpeed", level)}
                                    className={`flex-1 h-3 rounded-full transition-all ${level <= (device.fanSpeed || 0) ? "bg-cyan-500" : "bg-gray-700"}`}
                                    data-testid={`button-fan-level-${level}-${device.id}`}
                                  />
                                ))}
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeviceControl(device, "fanSpeed", Math.min(5, (device.fanSpeed || 0) + 1))}
                                className="border-white/20 text-white hover:bg-white/10 h-8 w-8 p-0"
                                data-testid={`button-fan-up-${device.id}`}
                              >
                                <ChevronUp className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-white flex items-center gap-2"><Gauge className="h-4 w-4 text-cyan-400" /> Concentration</span>
                              <span className="text-sm text-white font-bold">{device.concentration}%</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeviceControl(device, "concentration", Math.max(0, (device.concentration || 0) - 10))}
                                className="border-white/20 text-white hover:bg-white/10 h-8 w-8 p-0"
                                data-testid={`button-conc-down-${device.id}`}
                              >
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                              <div className="flex-1 h-3 bg-gray-700 rounded-full overflow-hidden">
                                <div className="h-full rounded-full bg-gradient-to-r from-purple-600 to-purple-400 transition-all" style={{ width: `${device.concentration || 0}%` }}></div>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeviceControl(device, "concentration", Math.min(100, (device.concentration || 0) + 10))}
                                className="border-white/20 text-white hover:bg-white/10 h-8 w-8 p-0"
                                data-testid={`button-conc-up-${device.id}`}
                              >
                                <ChevronUp className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="pt-2 flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleDeviceControl(device, "isOnline", !device.isOnline)}
                              className={`flex-1 ${device.isOnline ? "bg-green-600/20 text-green-400 hover:bg-green-600/30" : "bg-red-600/20 text-red-400 hover:bg-red-600/30"}`}
                              data-testid={`button-toggle-online-${device.id}`}
                            >
                              {device.isOnline ? <Wifi className="h-3 w-3 mr-1" /> : <WifiOff className="h-3 w-3 mr-1" />}
                              {device.isOnline ? "Online" : "Offline"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setControllingDevice(null)}
                              className="border-white/20 text-gray-400 hover:bg-white/10"
                              data-testid={`button-close-controls-${device.id}`}
                            >
                              <X className="h-3 w-3 mr-1" /> Close
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* CUSTOMERS TAB */}
          <TabsContent value="customers">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-white">Customers</h2>
              <Button onClick={() => { resetCustomerForm(); setEditingCustomer(null); setShowCustomerForm(true); }} className="bg-cyan-600 hover:bg-cyan-700" data-testid="button-add-customer">
                <Plus className="h-4 w-4 mr-2" /> Add Customer
              </Button>
            </div>
            {customers.length === 0 ? (
              <div className="rounded-xl bg-white/5 py-12 text-center"><Users className="h-12 w-12 text-gray-600 mx-auto mb-3" /><p className="text-gray-400">No customers yet</p></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {customers.map((customer) => {
                  const customerDevices = devices.filter(d => d.customerId === customer.id);
                  return (
                    <div key={customer.id} className="rounded-xl bg-white/5 p-5 hover:bg-white/[0.07] transition-all" data-testid={`card-customer-${customer.id}`}>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-white text-lg">{customer.name}</h3>
                          {customer.company && <p className="text-sm text-gray-400">{customer.company}</p>}
                        </div>
                        <Badge className={`border-0 ${customer.isActive ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                          {customer.isActive ? "Active" : "Disabled"}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm text-gray-400 mb-3">
                        {customer.email && <p>{customer.email}</p>}
                        {customer.phone && <p>{customer.phone}</p>}
                        {customer.address && <p>{customer.address}</p>}
                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/10">
                          <Cpu className="h-3 w-3 text-cyan-400" />
                          <span className="text-cyan-400">{customerDevices.length} devices assigned</span>
                        </div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3 mb-3">
                        <p className="text-xs text-gray-500 mb-1">Login Credentials</p>
                        <p className="text-sm text-white">Username: <span className="text-cyan-400">{customer.loginUsername}</span></p>
                        <p className="text-sm text-white">Password: <span className="text-cyan-400">{customer.loginPassword}</span></p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => { setEditingCustomer(customer); setCustomerForm({ name: customer.name, email: customer.email || "", phone: customer.phone || "", company: customer.company || "", address: customer.address || "", loginUsername: customer.loginUsername, loginPassword: customer.loginPassword }); setShowCustomerForm(true); }} className="border-white/20 text-white hover:bg-white/10 flex-1" data-testid={`button-edit-customer-${customer.id}`}>
                          <Pencil className="h-3 w-3 mr-1" /> Edit
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(`Username: ${customer.loginUsername}\nPassword: ${customer.loginPassword}`); toast({ title: "Copied login details" }); }} className="border-white/20 text-white hover:bg-white/10" data-testid={`button-copy-creds-${customer.id}`}>
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => { if (confirm("Delete this customer?")) deleteCustomerMut.mutate(customer.id); }} data-testid={`button-delete-customer-${customer.id}`}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* GROUPS TAB */}
          <TabsContent value="groups">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-white">Device Groups</h2>
              <Button onClick={() => { resetGroupForm(); setEditingGroup(null); setShowGroupForm(true); }} className="bg-cyan-600 hover:bg-cyan-700" data-testid="button-add-group">
                <Plus className="h-4 w-4 mr-2" /> Create Group
              </Button>
            </div>
            {groups.length === 0 ? (
              <div className="rounded-xl bg-white/5 py-12 text-center"><FolderOpen className="h-12 w-12 text-gray-600 mx-auto mb-3" /><p className="text-gray-400">No groups created yet</p></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groups.map((group) => {
                  const groupDevices = devices.filter(d => d.groupId === group.id);
                  const customer = customers.find(c => c.id === group.customerId);
                  return (
                    <div key={group.id} className="rounded-xl bg-white/5 p-5 hover:bg-white/[0.07] transition-all" data-testid={`card-group-${group.id}`}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center"><FolderOpen className="h-5 w-5 text-purple-400" /></div>
                        <div>
                          <h3 className="font-semibold text-white">{group.name}</h3>
                          {customer && <p className="text-xs text-gray-400">Customer: {customer.name}</p>}
                        </div>
                      </div>
                      {group.description && <p className="text-sm text-gray-400 mb-3">{group.description}</p>}
                      <p className="text-sm text-cyan-400 mb-3"><Cpu className="h-3 w-3 inline mr-1" />{groupDevices.length} devices</p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => { setEditingGroup(group); setGroupForm({ name: group.name, description: group.description || "", customerId: group.customerId || "" }); setShowGroupForm(true); }} className="border-white/20 text-white hover:bg-white/10 flex-1"><Pencil className="h-3 w-3 mr-1" /> Edit</Button>
                        <Button size="sm" variant="destructive" onClick={() => { if (confirm("Delete this group?")) deleteGroupMut.mutate(group.id); }}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Device Form Dialog */}
      <Dialog open={showDeviceForm} onOpenChange={(open) => { setShowDeviceForm(open); if (!open) { setEditingDevice(null); resetDeviceForm(); } }}>
        <DialogContent className="bg-slate-900 border-white/10 text-white">
          <DialogHeader><DialogTitle>{editingDevice ? "Edit Device" : "Register New Device"}</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); if (editingDevice) { updateDeviceMut.mutate({ id: editingDevice.id, data: deviceForm }); } else { createDeviceMut.mutate(deviceForm); } }} className="space-y-4">
            <div>
              <Label>Serial Number *</Label>
              <Input value={deviceForm.serialNumber} onChange={(e) => setDeviceForm({ ...deviceForm, serialNumber: e.target.value })} required className="bg-white/10 border-white/20" placeholder="e.g. SCHICC-001" data-testid="input-device-serial" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Device Name</Label><Input value={deviceForm.name} onChange={(e) => setDeviceForm({ ...deviceForm, name: e.target.value })} className="bg-white/10 border-white/20" data-testid="input-device-name" /></div>
              <div><Label>Model</Label><Input value={deviceForm.model} onChange={(e) => setDeviceForm({ ...deviceForm, model: e.target.value })} className="bg-white/10 border-white/20" data-testid="input-device-model" /></div>
            </div>
            <div>
              <Label>Assign to Customer</Label>
              <Select value={deviceForm.customerId || "none"} onValueChange={(v) => setDeviceForm({ ...deviceForm, customerId: v === "none" ? "" : v })}>
                <SelectTrigger className="bg-white/10 border-white/20" data-testid="select-device-customer"><SelectValue placeholder="Unassigned" /></SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/20">
                  <SelectItem value="none">Unassigned</SelectItem>
                  {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Assign to Group</Label>
              <Select value={deviceForm.groupId || "none"} onValueChange={(v) => setDeviceForm({ ...deviceForm, groupId: v === "none" ? "" : v })}>
                <SelectTrigger className="bg-white/10 border-white/20" data-testid="select-device-group"><SelectValue placeholder="No group" /></SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/20">
                  <SelectItem value="none">No group</SelectItem>
                  {groups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => { setShowDeviceForm(false); setEditingDevice(null); resetDeviceForm(); }} className="border-white/20 text-white">Cancel</Button>
              <Button type="submit" className="bg-cyan-600 hover:bg-cyan-700" data-testid="button-submit-device">{editingDevice ? "Update" : "Register"} Device</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Customer Form Dialog */}
      <Dialog open={showCustomerForm} onOpenChange={(open) => { setShowCustomerForm(open); if (!open) { setEditingCustomer(null); resetCustomerForm(); } }}>
        <DialogContent className="bg-slate-900 border-white/10 text-white">
          <DialogHeader><DialogTitle>{editingCustomer ? "Edit Customer" : "Add New Customer"}</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); if (editingCustomer) { updateCustomerMut.mutate({ id: editingCustomer.id, data: customerForm }); } else { createCustomerMut.mutate(customerForm); } }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Name *</Label><Input value={customerForm.name} onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })} required className="bg-white/10 border-white/20" data-testid="input-customer-name" /></div>
              <div><Label>Company</Label><Input value={customerForm.company} onChange={(e) => setCustomerForm({ ...customerForm, company: e.target.value })} className="bg-white/10 border-white/20" data-testid="input-customer-company" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Email</Label><Input value={customerForm.email} onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })} className="bg-white/10 border-white/20" data-testid="input-customer-email" /></div>
              <div><Label>Phone</Label><Input value={customerForm.phone} onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })} className="bg-white/10 border-white/20" data-testid="input-customer-phone" /></div>
            </div>
            <div><Label>Address</Label><Input value={customerForm.address} onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })} className="bg-white/10 border-white/20" data-testid="input-customer-address" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Login Username *</Label><Input value={customerForm.loginUsername} onChange={(e) => setCustomerForm({ ...customerForm, loginUsername: e.target.value })} required className="bg-white/10 border-white/20" data-testid="input-customer-login-username" /></div>
              <div><Label>Login Password *</Label><Input value={customerForm.loginPassword} onChange={(e) => setCustomerForm({ ...customerForm, loginPassword: e.target.value })} required className="bg-white/10 border-white/20" data-testid="input-customer-login-password" /></div>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => { setShowCustomerForm(false); setEditingCustomer(null); resetCustomerForm(); }} className="border-white/20 text-white">Cancel</Button>
              <Button type="submit" className="bg-cyan-600 hover:bg-cyan-700" data-testid="button-submit-customer">{editingCustomer ? "Update" : "Create"} Customer</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Group Form Dialog */}
      <Dialog open={showGroupForm} onOpenChange={(open) => { setShowGroupForm(open); if (!open) { setEditingGroup(null); resetGroupForm(); } }}>
        <DialogContent className="bg-slate-900 border-white/10 text-white">
          <DialogHeader><DialogTitle>{editingGroup ? "Edit Group" : "Create Device Group"}</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); if (editingGroup) { updateGroupMut.mutate({ id: editingGroup.id, data: groupForm }); } else { createGroupMut.mutate(groupForm); } }} className="space-y-4">
            <div><Label>Group Name *</Label><Input value={groupForm.name} onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })} required className="bg-white/10 border-white/20" data-testid="input-group-name" /></div>
            <div><Label>Description</Label><Input value={groupForm.description} onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })} className="bg-white/10 border-white/20" data-testid="input-group-description" /></div>
            <div>
              <Label>Assign to Customer</Label>
              <Select value={groupForm.customerId || "none"} onValueChange={(v) => setGroupForm({ ...groupForm, customerId: v === "none" ? "" : v })}>
                <SelectTrigger className="bg-white/10 border-white/20" data-testid="select-group-customer"><SelectValue placeholder="No specific customer" /></SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/20">
                  <SelectItem value="none">No specific customer</SelectItem>
                  {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => { setShowGroupForm(false); setEditingGroup(null); resetGroupForm(); }} className="border-white/20 text-white">Cancel</Button>
              <Button type="submit" className="bg-cyan-600 hover:bg-cyan-700" data-testid="button-submit-group">{editingGroup ? "Update" : "Create"} Group</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
