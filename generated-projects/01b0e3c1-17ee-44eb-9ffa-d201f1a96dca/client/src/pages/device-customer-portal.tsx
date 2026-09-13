import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { Device, DeviceSchedule, DeviceGroup } from "@shared/schema";
import { Wifi, WifiOff, Power, Droplets, Wind, Timer, Settings, LogOut, Cpu, FolderOpen, Plus, Pencil, Trash2, Clock, Calendar } from "lucide-react";

const DAYS = [
  { key: "mon", label: "Mon" }, { key: "tue", label: "Tue" }, { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" }, { key: "fri", label: "Fri" }, { key: "sat", label: "Sat" }, { key: "sun", label: "Sun" }
];

export default function DeviceCustomerPortal() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const customerId = localStorage.getItem("deviceCustomerId");
  const customerName = localStorage.getItem("deviceCustomerName");
  const brandName = localStorage.getItem("deviceCustomerBrandName");

  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<DeviceSchedule | null>(null);
  const [scheduleForm, setScheduleForm] = useState({ name: "Schedule", startTime: "08:00", endTime: "22:00", spraySeconds: 10, pauseSeconds: 30, daysOfWeek: ["mon","tue","wed","thu","fri","sat","sun"] as string[], isEnabled: true });

  useEffect(() => {
    if (!customerId) setLocation("/device-customer-login");
  }, [customerId, setLocation]);

  const { data: devices = [] } = useQuery<Device[]>({
    queryKey: [`/api/device-customers/${customerId}/devices`],
    enabled: !!customerId,
    refetchInterval: 10000,
  });

  const { data: groups = [] } = useQuery<DeviceGroup[]>({
    queryKey: [`/api/device-customers/${customerId}/groups`],
    enabled: !!customerId,
  });

  const { data: schedules = [] } = useQuery<DeviceSchedule[]>({
    queryKey: [`/api/devices/${selectedDevice?.id}/schedules`],
    enabled: !!selectedDevice,
  });

  const onlineCount = devices.filter(d => d.isOnline).length;

  const updateDeviceMut = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/devices/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/device-customers/${customerId}/devices`] });
      if (selectedDevice && data.id === selectedDevice.id) setSelectedDevice(data);
      toast({ title: "Device updated" });
    },
  });

  const createScheduleMut = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/device-schedules", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...data, deviceId: selectedDevice?.id }) });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [`/api/devices/${selectedDevice?.id}/schedules`] }); setShowScheduleForm(false); resetScheduleForm(); toast({ title: "Schedule created" }); },
  });

  const updateScheduleMut = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/device-schedules/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [`/api/devices/${selectedDevice?.id}/schedules`] }); setShowScheduleForm(false); setEditingSchedule(null); resetScheduleForm(); toast({ title: "Schedule updated" }); },
  });

  const deleteScheduleMut = useMutation({
    mutationFn: async (id: string) => { await fetch(`/api/device-schedules/${id}`, { method: "DELETE" }); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [`/api/devices/${selectedDevice?.id}/schedules`] }); toast({ title: "Schedule deleted" }); },
  });

  function resetScheduleForm() { setScheduleForm({ name: "Schedule", startTime: "08:00", endTime: "22:00", spraySeconds: 10, pauseSeconds: 30, daysOfWeek: ["mon","tue","wed","thu","fri","sat","sun"], isEnabled: true }); }

  function handleLogout() {
    localStorage.removeItem("deviceCustomerId");
    localStorage.removeItem("deviceCustomerName");
    localStorage.removeItem("deviceCustomerBrandId");
    localStorage.removeItem("deviceCustomerBrandName");
    localStorage.removeItem("deviceCustomerBrandSlug");
    setLocation("/device-customer-login");
  }

  function toggleDay(day: string) {
    setScheduleForm(prev => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter(d => d !== day)
        : [...prev.daysOfWeek, day]
    }));
  }

  if (!customerId) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
      <header className="border-b border-white/10 bg-black/30 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {selectedDevice ? (
              <Button variant="ghost" size="sm" onClick={() => setSelectedDevice(null)} className="text-gray-400 hover:text-white" data-testid="button-back-devices">
                ← Back
              </Button>
            ) : (
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <Wifi className="h-5 w-5 text-white" />
              </div>
            )}
            <div>
              <h1 className="text-lg font-bold text-white">{selectedDevice ? selectedDevice.name : brandName || "Device Portal"}</h1>
              <p className="text-xs text-gray-400">{selectedDevice ? `SN: ${selectedDevice.serialNumber}` : `Welcome, ${customerName}`}</p>
            </div>
          </div>
          <Button variant="ghost" onClick={handleLogout} className="text-gray-400 hover:text-white" data-testid="button-logout">
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {!selectedDevice ? (
          <>
            {/* Device Overview */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-white">{devices.length}</p>
                  <p className="text-xs text-gray-400 mt-1">Total Devices</p>
                </CardContent>
              </Card>
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-green-400">{onlineCount}</p>
                  <p className="text-xs text-gray-400 mt-1">Online</p>
                </CardContent>
              </Card>
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-red-400">{devices.length - onlineCount}</p>
                  <p className="text-xs text-gray-400 mt-1">Offline</p>
                </CardContent>
              </Card>
            </div>

            {/* Device Groups */}
            {groups.length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-white mb-3">Device Groups</h2>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {groups.map(g => {
                    const count = devices.filter(d => d.groupId === g.id).length;
                    return (
                      <Card key={g.id} className="bg-white/5 border-white/10 min-w-[160px] flex-shrink-0" data-testid={`card-group-${g.id}`}>
                        <CardContent className="p-4 text-center">
                          <FolderOpen className="h-6 w-6 text-purple-400 mx-auto mb-2" />
                          <p className="text-white font-medium">{g.name}</p>
                          <p className="text-xs text-gray-400">{count} devices</p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Devices List */}
            <h2 className="text-lg font-semibold text-white mb-3">My Devices</h2>
            {devices.length === 0 ? (
              <Card className="bg-white/5 border-white/10"><CardContent className="py-16 text-center"><Cpu className="h-16 w-16 text-gray-600 mx-auto mb-4" /><p className="text-gray-400 text-lg">No devices assigned yet</p><p className="text-gray-500 text-sm mt-1">Contact your administrator to get devices assigned</p></CardContent></Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {devices.map(device => (
                  <Card key={device.id} className="bg-white/5 border-white/10 hover:border-cyan-500/30 transition-all cursor-pointer" onClick={() => setSelectedDevice(device)} data-testid={`card-device-${device.id}`}>
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${device.isOnline ? "bg-green-500/20" : "bg-gray-700/50"}`}>
                            {device.isOnline ? <Wifi className="h-6 w-6 text-green-400" /> : <WifiOff className="h-6 w-6 text-gray-500" />}
                          </div>
                          <div>
                            <h3 className="font-bold text-white">{device.name}</h3>
                            <p className="text-xs text-gray-400">{device.model} • SN: {device.serialNumber}</p>
                          </div>
                        </div>
                        {device.isRunning && <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse"></div>}
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2 text-gray-400">
                          <Droplets className="h-4 w-4 text-cyan-400" />
                          <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${(device.liquidLevel || 0) > 30 ? "bg-cyan-500" : (device.liquidLevel || 0) > 10 ? "bg-yellow-500" : "bg-red-500"}`} style={{ width: `${device.liquidLevel}%` }}></div>
                          </div>
                          <span className="text-white text-xs">{device.liquidLevel}%</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-400">
                          <Wind className="h-4 w-4" />
                          <span className="text-white text-xs">{device.fanSpeed}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        ) : (
          /* Device Control Panel */
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Status */}
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className={`h-16 w-16 rounded-2xl flex items-center justify-center ${selectedDevice.isOnline ? "bg-green-500/20" : "bg-gray-700/50"}`}>
                      {selectedDevice.isOnline ? <Wifi className="h-8 w-8 text-green-400" /> : <WifiOff className="h-8 w-8 text-gray-500" />}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">{selectedDevice.name}</h2>
                      <p className="text-sm text-gray-400">{selectedDevice.model} • SN: {selectedDevice.serialNumber}</p>
                      <Badge className={`mt-1 ${selectedDevice.isOnline ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                        {selectedDevice.isOnline ? "Online" : "Offline"}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    size="lg"
                    className={`rounded-full h-16 w-16 ${selectedDevice.isRunning ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"}`}
                    onClick={() => updateDeviceMut.mutate({ id: selectedDevice.id, data: { isRunning: !selectedDevice.isRunning } })}
                    data-testid="button-power-toggle"
                  >
                    <Power className="h-8 w-8" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2"><Droplets className="h-4 w-4 text-cyan-400" /><span className="text-sm text-gray-400">Liquid Level</span></div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-3 bg-gray-700 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${(selectedDevice.liquidLevel || 0) > 30 ? "bg-cyan-500" : (selectedDevice.liquidLevel || 0) > 10 ? "bg-yellow-500" : "bg-red-500"}`} style={{ width: `${selectedDevice.liquidLevel}%` }}></div>
                      </div>
                      <span className="text-lg font-bold text-white">{selectedDevice.liquidLevel}%</span>
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2"><Droplets className="h-4 w-4 text-blue-400" /><span className="text-sm text-gray-400">Oil Capacity</span></div>
                    <p className="text-lg font-bold text-white">{selectedDevice.oilCapacity}ml</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Controls */}
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-6 space-y-6">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2"><Settings className="h-5 w-5 text-cyan-400" /> Controls</h3>

                <div>
                  <div className="flex justify-between mb-2"><Label className="text-gray-400">Fan Speed</Label><span className="text-white font-medium">{selectedDevice.fanSpeed}/5</span></div>
                  <Slider
                    value={[selectedDevice.fanSpeed || 3]}
                    min={1} max={5} step={1}
                    onValueCommit={(v) => updateDeviceMut.mutate({ id: selectedDevice.id, data: { fanSpeed: v[0] } })}
                    className="py-2"
                    data-testid="slider-fan-speed"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-2"><Label className="text-gray-400">Concentration</Label><span className="text-white font-medium">{selectedDevice.concentration}%</span></div>
                  <Slider
                    value={[selectedDevice.concentration || 50]}
                    min={10} max={100} step={10}
                    onValueCommit={(v) => updateDeviceMut.mutate({ id: selectedDevice.id, data: { concentration: v[0] } })}
                    className="py-2"
                    data-testid="slider-concentration"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-2"><Label className="text-gray-400">Spray Duration</Label><span className="text-white font-medium">{selectedDevice.sprayDuration}s</span></div>
                  <Slider
                    value={[selectedDevice.sprayDuration || 10]}
                    min={5} max={60} step={5}
                    onValueCommit={(v) => updateDeviceMut.mutate({ id: selectedDevice.id, data: { sprayDuration: v[0] } })}
                    className="py-2"
                    data-testid="slider-spray-duration"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-2"><Label className="text-gray-400">Pause Duration</Label><span className="text-white font-medium">{selectedDevice.pauseDuration}s</span></div>
                  <Slider
                    value={[selectedDevice.pauseDuration || 30]}
                    min={10} max={300} step={10}
                    onValueCommit={(v) => updateDeviceMut.mutate({ id: selectedDevice.id, data: { pauseDuration: v[0] } })}
                    className="py-2"
                    data-testid="slider-pause-duration"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Schedules */}
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2"><Timer className="h-5 w-5 text-cyan-400" /> Schedules</h3>
                  <Button size="sm" onClick={() => { resetScheduleForm(); setEditingSchedule(null); setShowScheduleForm(true); }} className="bg-cyan-600 hover:bg-cyan-700" data-testid="button-add-schedule">
                    <Plus className="h-4 w-4 mr-1" /> Add
                  </Button>
                </div>

                {schedules.length === 0 ? (
                  <div className="text-center py-6 text-gray-400">
                    <Clock className="h-10 w-10 mx-auto mb-2 text-gray-600" />
                    <p>No schedules set</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {schedules.map(schedule => (
                      <div key={schedule.id} className={`p-4 rounded-xl border transition-all ${schedule.isEnabled ? "bg-cyan-500/10 border-cyan-500/20" : "bg-white/5 border-white/10"}`} data-testid={`schedule-${schedule.id}`}>
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="font-medium text-white">{schedule.name}</span>
                            <span className="text-sm text-gray-400 ml-3"><Clock className="h-3 w-3 inline mr-1" />{schedule.startTime} - {schedule.endTime}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={schedule.isEnabled ?? true}
                              onCheckedChange={(checked) => updateScheduleMut.mutate({ id: schedule.id, data: { isEnabled: checked } })}
                              data-testid={`switch-schedule-${schedule.id}`}
                            />
                            <Button size="icon" variant="ghost" onClick={() => {
                              setEditingSchedule(schedule);
                              setScheduleForm({
                                name: schedule.name || "Schedule",
                                startTime: schedule.startTime || "08:00",
                                endTime: schedule.endTime || "22:00",
                                spraySeconds: schedule.spraySeconds || 10,
                                pauseSeconds: schedule.pauseSeconds || 30,
                                daysOfWeek: (schedule.daysOfWeek as string[]) || ["mon","tue","wed","thu","fri","sat","sun"],
                                isEnabled: schedule.isEnabled ?? true,
                              });
                              setShowScheduleForm(true);
                            }} className="text-gray-400 hover:text-white h-8 w-8">
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => { if (confirm("Delete schedule?")) deleteScheduleMut.mutate(schedule.id); }} className="text-gray-400 hover:text-red-400 h-8 w-8">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span>Spray: {schedule.spraySeconds}s / Pause: {schedule.pauseSeconds}s</span>
                        </div>
                        <div className="flex gap-1 mt-2">
                          {DAYS.map(d => (
                            <span key={d.key} className={`text-xs px-2 py-1 rounded ${(schedule.daysOfWeek as string[] || []).includes(d.key) ? "bg-cyan-500/30 text-cyan-300" : "bg-white/5 text-gray-600"}`}>
                              {d.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Device Info */}
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Device Info</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-400">Serial Number</span><span className="text-white">{selectedDevice.serialNumber}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Model</span><span className="text-white">{selectedDevice.model}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Firmware</span><span className="text-white">{selectedDevice.firmwareVersion}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Signal</span><span className="text-white">{selectedDevice.signalStrength} dBm</span></div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Schedule Form */}
      <Dialog open={showScheduleForm} onOpenChange={(open) => { setShowScheduleForm(open); if (!open) { setEditingSchedule(null); resetScheduleForm(); } }}>
        <DialogContent className="bg-slate-900 border-white/10 text-white">
          <DialogHeader><DialogTitle>{editingSchedule ? "Edit Schedule" : "Create Schedule"}</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); if (editingSchedule) { updateScheduleMut.mutate({ id: editingSchedule.id, data: scheduleForm }); } else { createScheduleMut.mutate(scheduleForm); } }} className="space-y-4">
            <div><Label>Name</Label><Input value={scheduleForm.name} onChange={(e) => setScheduleForm({ ...scheduleForm, name: e.target.value })} className="bg-white/10 border-white/20" data-testid="input-schedule-name" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Start Time</Label><Input type="time" value={scheduleForm.startTime} onChange={(e) => setScheduleForm({ ...scheduleForm, startTime: e.target.value })} className="bg-white/10 border-white/20" data-testid="input-start-time" /></div>
              <div><Label>End Time</Label><Input type="time" value={scheduleForm.endTime} onChange={(e) => setScheduleForm({ ...scheduleForm, endTime: e.target.value })} className="bg-white/10 border-white/20" data-testid="input-end-time" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Spray Duration (seconds)</Label><Input type="number" value={scheduleForm.spraySeconds} onChange={(e) => setScheduleForm({ ...scheduleForm, spraySeconds: parseInt(e.target.value) || 10 })} className="bg-white/10 border-white/20" data-testid="input-spray-seconds" /></div>
              <div><Label>Pause Duration (seconds)</Label><Input type="number" value={scheduleForm.pauseSeconds} onChange={(e) => setScheduleForm({ ...scheduleForm, pauseSeconds: parseInt(e.target.value) || 30 })} className="bg-white/10 border-white/20" data-testid="input-pause-seconds" /></div>
            </div>
            <div>
              <Label className="mb-2 block">Active Days</Label>
              <div className="flex gap-2">
                {DAYS.map(d => (
                  <button key={d.key} type="button" onClick={() => toggleDay(d.key)} className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${scheduleForm.daysOfWeek.includes(d.key) ? "bg-cyan-600 text-white" : "bg-white/10 text-gray-400"}`} data-testid={`toggle-day-${d.key}`}>
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={scheduleForm.isEnabled} onCheckedChange={(v) => setScheduleForm({ ...scheduleForm, isEnabled: v })} data-testid="switch-schedule-enabled" />
              <Label>Schedule Enabled</Label>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => { setShowScheduleForm(false); setEditingSchedule(null); resetScheduleForm(); }} className="border-white/20 text-white">Cancel</Button>
              <Button type="submit" className="bg-cyan-600 hover:bg-cyan-700" data-testid="button-submit-schedule">{editingSchedule ? "Update" : "Create"} Schedule</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
