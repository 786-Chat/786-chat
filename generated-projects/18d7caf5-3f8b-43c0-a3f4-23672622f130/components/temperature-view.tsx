"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Equipment {
  id: string;
  name: string;
  equipment_type: string;
  location: string;
  target_temperature: string;
  current_temperature: string;
  last_checked_date: string;
  last_checked_time: string;
  checked_by: string;
  status: string;
  notes: string;
  active: boolean;
}

interface TemperatureCheck {
  id: string;
  equipment_id: string;
  equipment_name: string;
  equipment_type: string;
  location: string;
  target_temperature: string;
  actual_temperature: string;
  check_date: string;
  check_time: string;
  checked_by: string;
  status: string;
  notes: string;
}

interface FreezerOption {
  id: string;
  option_type: string;
  value: string;
}

const emptyForm = {
  equipmentId: "",
  actualTemperature: "",
  checkDate: "",
  checkTime: "",
  checkedBy: "",
  notes: ""
};

export function TemperatureView() {
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [checks, setChecks] = useState<TemperatureCheck[]>([]);
  const [staffNames, setStaffNames] = useState<string[]>([]);
  const [savedNotes, setSavedNotes] = useState<string[]>([]);
  const [form, setForm] = useState({ ...emptyForm });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterEquipment, setFilterEquipment] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  useEffect(() => {
    fetchEquipment();
    fetchOptions();
    fetchChecks();
  }, []);

  async function fetchEquipment() {
    try {
      const res = await fetch("/api/freezer-equipment");
      if (!res.ok) throw new Error("Failed to load equipment");
      const data = await res.json();
      setEquipmentList(data.filter((e: Equipment) => e.active));
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function fetchOptions() {
    try {
      const res = await fetch("/api/freezer-options");
      if (!res.ok) throw new Error("Failed to load options");
      const data: FreezerOption[] = await res.json();
      const staff = data.filter(o => o.option_type === "staff_name").map(o => o.value);
      const notes = data.filter(o => o.option_type === "saved_note").map(o => o.value);
      if (staff.length) setStaffNames(staff);
      if (notes.length) setSavedNotes(notes);
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function fetchChecks() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterEquipment) params.set("equipmentId", filterEquipment);
      if (filterDate) params.set("date", filterDate);
      if (filterStatus) params.set("status", filterStatus);
      const res = await fetch(`/api/temperature-checks?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load checks");
      const data = await res.json();
      setChecks(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleEquipmentChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value;
    const equipment = equipmentList.find((eq) => eq.id === id);
    setForm((prev) => ({
      ...prev,
      equipmentId: id,
      checkedBy: equipment ? equipment.checked_by : prev.checkedBy
    }));
  }

  function useCurrentDateTime() {
    const now = new Date();
    const date = now.toISOString().slice(0, 10);
    const time = now.toTimeString().slice(0, 5);
    setForm((prev) => ({ ...prev, checkDate: date, checkTime: time }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch("/api/temperature-checks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || "Failed to save check");
      }
      setForm({ ...emptyForm });
      await fetchChecks();
      await fetchEquipment();
    } catch (err: any) {
      setError(err.message);
    }
  }

  const selectedEquipment = equipmentList.find((eq) => eq.id === form.equipmentId);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Temperature</h1>

      <Card className="border-2 border-slate-600 bg-white text-slate-900">
        <CardContent className="p-4 sm:p-6">
          <h2 className="mb-4 text-lg font-bold">Record Temperature Check</h2>
          {error && <p className="mb-3 text-sm font-semibold text-red-600">{error}</p>}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold">Equipment</label>
              <select name="equipmentId" value={form.equipmentId} onChange={handleEquipmentChange} required className="h-11 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none">
                <option value="">Select equipment</option>
                {equipmentList.map((eq) => (
                  <option key={eq.id} value={eq.id}>{eq.name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold">Equipment Type</label>
              <input value={selectedEquipment?.equipment_type || ""} readOnly className="h-11 rounded border-2 border-slate-300 bg-slate-100 px-3" />
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold">Location</label>
              <input value={selectedEquipment?.location || ""} readOnly className="h-11 rounded border-2 border-slate-300 bg-slate-100 px-3" />
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold">Target Temperature (°C)</label>
              <input value={selectedEquipment?.target_temperature || ""} readOnly className="h-11 rounded border-2 border-slate-300 bg-slate-100 px-3" />
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold">Actual Temperature (°C)</label>
              <input name="actualTemperature" value={form.actualTemperature} onChange={handleChange} required placeholder="Enter measured temperature" className="h-11 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none" />
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold">Check Date</label>
              <input name="checkDate" type="date" value={form.checkDate} onChange={handleChange} required className="h-11 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none" />
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold">Check Time</label>
              <div className="flex gap-2">
                <input name="checkTime" type="time" value={form.checkTime} onChange={handleChange} required className="h-11 flex-1 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none" />
                <button type="button" onClick={useCurrentDateTime} className="h-11 shrink-0 cursor-pointer rounded border-2 border-slate-400 bg-slate-100 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-200">Now</button>
              </div>
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold">Checked By</label>
              <select name="checkedBy" value={form.checkedBy} onChange={handleChange} required className="h-11 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none">
                <option value="">Select staff</option>
                {staffNames.map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
            </div>
            <div className="flex flex-col sm:col-span-2">
              <label className="mb-1 text-sm font-semibold">Notes</label>
              <textarea name="notes" value={form.notes} onChange={handleChange} rows={2} className="rounded border-2 border-slate-400 px-3 py-2 focus:border-sky-500 focus:outline-none" />
              <div className="mt-2">
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) {
                      setForm(prev => ({ ...prev, notes: prev.notes ? prev.notes + "\n" + e.target.value : e.target.value }));
                    }
                  }}
                  className="h-10 w-full rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none"
                >
                  <option value="">Select saved note</option>
                  {savedNotes.map((note) => <option key={note} value={note}>{note}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 sm:col-span-2">
              <button type="submit" className="h-11 cursor-pointer rounded bg-emerald-600 px-6 font-semibold text-white hover:bg-emerald-500">Save Check</button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <h2 className="mb-3 text-lg font-bold">Temperature History</h2>
          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <select value={filterEquipment} onChange={(e) => setFilterEquipment(e.target.value)} className="h-10 rounded border-2 border-slate-700 bg-slate-900 px-3 text-sm text-slate-200 focus:border-sky-500 focus:outline-none">
              <option value="">All Equipment</option>
              {equipmentList.map((eq) => <option key={eq.id} value={eq.id}>{eq.name}</option>)}
            </select>
            <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="h-10 rounded border-2 border-slate-700 bg-slate-900 px-3 text-sm text-slate-200 focus:border-sky-500 focus:outline-none" />
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="h-10 rounded border-2 border-slate-700 bg-slate-900 px-3 text-sm text-slate-200 focus:border-sky-500 focus:outline-none">
              <option value="">All Status</option>
              <option value="Normal">Normal</option>
              <option value="Warning">Warning</option>
              <option value="Out of Range">Out of Range</option>
            </select>
          </div>
          <button onClick={fetchChecks} className="mb-4 h-10 cursor-pointer rounded bg-sky-500 px-4 text-sm font-semibold text-slate-950 hover:bg-sky-400">Apply Filters</button>
          {loading ? (
            <p className="text-sm text-slate-400">Loading checks...</p>
          ) : checks.length === 0 ? (
            <p className="text-sm text-slate-400">No temperature checks recorded yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-800 text-slate-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Time</th>
                    <th className="px-4 py-3 font-medium">Equipment</th>
                    <th className="px-4 py-3 font-medium">Location</th>
                    <th className="px-4 py-3 font-medium">Target</th>
                    <th className="px-4 py-3 font-medium">Actual</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Checked By</th>
                    <th className="px-4 py-3 font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {checks.map((check) => {
                    const tone = check.status === "Normal" ? "green" : check.status === "Warning" ? "amber" : "red";
                    return (
                      <tr key={check.id} className="text-slate-300">
                        <td className="px-4 py-3">{check.check_date}</td>
                        <td className="px-4 py-3">{check.check_time}</td>
                        <td className="px-4 py-3 font-medium text-slate-100">{check.equipment_name}</td>
                        <td className="px-4 py-3">{check.location}</td>
                        <td className="px-4 py-3">{check.target_temperature}°C</td>
                        <td className="px-4 py-3">{check.actual_temperature}°C</td>
                        <td className="px-4 py-3"><Badge tone={tone as any}>{check.status}</Badge></td>
                        <td className="px-4 py-3">{check.checked_by}</td>
                        <td className="px-4 py-3">{check.notes}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
