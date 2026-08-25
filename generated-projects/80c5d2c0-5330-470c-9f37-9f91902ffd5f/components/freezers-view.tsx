"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const equipmentTypes = ["Freezer", "Chiller"];
const locations = ["Freezer 1", "Freezer 2", "Freezer 3", "Freezer 4", "Chiller 1", "Chiller 2", "Dry Store"];

interface FreezerEquipment {
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

const emptyForm = {
  name: "",
  equipmentType: "Freezer",
  location: "",
  targetTemperature: "",
  currentTemperature: "",
  lastCheckedDate: "",
  lastCheckedTime: "",
  checkedBy: "",
  notes: "",
  active: true
};

function determineStatus(type: string, currentTemp: string): string {
  const temp = parseFloat(currentTemp);
  if (isNaN(temp)) return "Out of Range";
  if (type === "Freezer") {
    if (temp <= -18) return "Normal";
    if (temp <= -15) return "Warning";
    return "Out of Range";
  } else {
    if (temp <= 5) return "Normal";
    if (temp <= 8) return "Warning";
    return "Out of Range";
  }
}

export function FreezersView() {
  const [equipment, setEquipment] = useState<FreezerEquipment[]>([]);
  const [form, setForm] = useState({ ...emptyForm });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEquipment();
  }, []);

  async function fetchEquipment() {
    try {
      const res = await fetch("/api/freezer-equipment");
      if (!res.ok) throw new Error("Failed to load equipment");
      const data = await res.json();
      setEquipment(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target;
    const val = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    setForm((prev) => ({ ...prev, [name]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const status = determineStatus(form.equipmentType, form.currentTemperature);
    const payload = { ...form, status, active: Boolean(form.active) };
    try {
      const url = editingId ? `/api/freezer-equipment/${editingId}` : "/api/freezer-equipment";
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || "Failed to save equipment");
      }
      setForm({ ...emptyForm });
      setEditingId(null);
      await fetchEquipment();
    } catch (err: any) {
      setError(err.message);
    }
  }

  function handleEdit(item: FreezerEquipment) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      equipmentType: item.equipment_type,
      location: item.location,
      targetTemperature: item.target_temperature,
      currentTemperature: item.current_temperature,
      lastCheckedDate: item.last_checked_date,
      lastCheckedTime: item.last_checked_time,
      checkedBy: item.checked_by,
      notes: item.notes,
      active: item.active
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this equipment?")) return;
    try {
      const res = await fetch(`/api/freezer-equipment/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      await fetchEquipment();
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Freezers</h1>

      <Card className="border-2 border-slate-600 bg-white text-slate-900">
        <CardContent className="p-4 sm:p-6">
          <h2 className="mb-4 text-lg font-bold">{editingId ? "Edit Equipment" : "Add Equipment"}</h2>
          {error && <p className="mb-3 text-sm font-semibold text-red-600">{error}</p>}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold">Equipment Name</label>
              <input name="name" value={form.name} onChange={handleChange} required className="h-11 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none" />
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold">Equipment Type</label>
              <select name="equipmentType" value={form.equipmentType} onChange={handleChange} className="h-11 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none">
                {equipmentTypes.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold">Location</label>
              <select name="location" value={form.location} onChange={handleChange} required className="h-11 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none">
                <option value="">Select</option>
                {locations.map((loc) => <option key={loc} value={loc}>{loc}</option>)}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold">Target Temperature (°C)</label>
              <input name="targetTemperature" value={form.targetTemperature} onChange={handleChange} required placeholder={form.equipmentType === "Freezer" ? "-18" : "5"} className="h-11 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none" />
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold">Current Temperature (°C)</label>
              <input name="currentTemperature" value={form.currentTemperature} onChange={handleChange} required className="h-11 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none" />
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold">Last Checked Date</label>
              <input name="lastCheckedDate" type="date" value={form.lastCheckedDate} onChange={handleChange} required className="h-11 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none" />
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold">Last Checked Time</label>
              <input name="lastCheckedTime" type="time" value={form.lastCheckedTime} onChange={handleChange} required className="h-11 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none" />
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold">Checked By</label>
              <input name="checkedBy" value={form.checkedBy} onChange={handleChange} required className="h-11 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none" />
            </div>
            <div className="flex flex-col sm:col-span-2">
              <label className="mb-1 text-sm font-semibold">Notes</label>
              <textarea name="notes" value={form.notes} onChange={handleChange} rows={2} className="rounded border-2 border-slate-400 px-3 py-2 focus:border-sky-500 focus:outline-none" />
            </div>
            <div className="flex items-center gap-2 sm:col-span-2">
              <input name="active" type="checkbox" checked={Boolean(form.active)} onChange={handleChange} className="h-5 w-5" />
              <label className="text-sm font-semibold">Active</label>
            </div>
            <div className="flex gap-3 sm:col-span-2">
              <button type="submit" className="h-11 cursor-pointer rounded bg-emerald-600 px-6 font-semibold text-white hover:bg-emerald-500">
                {editingId ? "Update Equipment" : "Add Equipment"}
              </button>
              {editingId && (
                <button type="button" onClick={() => { setEditingId(null); setForm({ ...emptyForm }); }} className="h-11 cursor-pointer rounded bg-slate-200 px-6 font-semibold text-slate-700 hover:bg-slate-300">
                  Cancel
                </button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <p className="p-4 text-sm text-slate-400">Loading equipment...</p>
          ) : equipment.length === 0 ? (
            <p className="p-4 text-sm text-slate-400">No equipment added yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-800 text-slate-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Location</th>
                    <th className="px-4 py-3 font-medium">Target</th>
                    <th className="px-4 py-3 font-medium">Current</th>
                    <th className="px-4 py-3 font-medium">Last Checked</th>
                    <th className="px-4 py-3 font-medium">Checked By</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Active</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {equipment.map((item) => {
                    const statusTone = item.status === "Normal" ? "green" : item.status === "Warning" ? "amber" : "red";
                    return (
                      <tr key={item.id} className="text-slate-300">
                        <td className="px-4 py-3 font-medium text-slate-100">{item.name}</td>
                        <td className="px-4 py-3">{item.equipment_type}</td>
                        <td className="px-4 py-3">{item.location}</td>
                        <td className="px-4 py-3">{item.target_temperature}°C</td>
                        <td className="px-4 py-3">{item.current_temperature}°C</td>
                        <td className="px-4 py-3">{item.last_checked_date} {item.last_checked_time}</td>
                        <td className="px-4 py-3">{item.checked_by}</td>
                        <td className="px-4 py-3">
                          <Badge tone={statusTone as any}>{item.status}</Badge>
                        </td>
                        <td className="px-4 py-3">{item.active ? "Yes" : "No"}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button onClick={() => handleEdit(item)} className="cursor-pointer rounded bg-sky-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-sky-400">Edit</button>
                            <button onClick={() => handleDelete(item.id)} className="cursor-pointer rounded bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-400">Delete</button>
                          </div>
                        </td>
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
