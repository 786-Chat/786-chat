"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";

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

interface FreezerOption {
  id: string;
  option_type: string;
  value: string;
}

const emptyForm = {
  name: "",
  equipmentType: "",
  location: "",
  targetTemperature: "",
  active: true,
};

export function MobileFreezerManage() {
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [locations, setLocations] = useState<string[]>(["Freezer 1", "Freezer 2", "Freezer 3", "Fridge 1", "Fridge 2", "Cold Room"]);
  const [form, setForm] = useState({ ...emptyForm });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    fetchEquipment();
    fetchOptions();
  }, []);

  async function fetchEquipment() {
    try {
      const res = await fetch("/api/freezer-equipment");
      if (!res.ok) throw new Error("Failed to load equipment");
      const data = await res.json();
      setEquipmentList(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchOptions() {
    try {
      const res = await fetch("/api/freezer-options");
      if (!res.ok) throw new Error("Failed to load options");
      const data: FreezerOption[] = await res.json();
      const locs = data.filter(o => o.option_type === "location").map(o => o.value);
      if (locs.length) setLocations(locs);
    } catch (err: any) {
      setError(err.message);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value, type } = e.target;
    const val = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    setForm(prev => ({ ...prev, [name]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const payload = {
        ...form,
        currentTemperature: "",
        lastCheckedDate: "",
        lastCheckedTime: "",
        checkedBy: "",
        status: "Normal",
        notes: "",
      };
      const url = editingId ? `/api/freezer-equipment/${editingId}` : "/api/freezer-equipment";
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || "Failed to save equipment");
      }
      setForm({ ...emptyForm });
      setEditingId(null);
      setShowAdd(false);
      await fetchEquipment();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(item: Equipment) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      equipmentType: item.equipment_type,
      location: item.location,
      targetTemperature: item.target_temperature,
      active: item.active,
    });
    setShowAdd(true);
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
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Manage Equipment</h1>

      {error && <p className="text-sm font-semibold text-red-400">{error}</p>}

      <button
        onClick={() => { setShowAdd(!showAdd); setEditingId(null); setForm({ ...emptyForm }); }}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-sky-500 px-4 py-3 font-semibold text-slate-950 hover:bg-sky-400"
      >
        <Plus className="h-5 w-5" /> {showAdd ? "Close Form" : "Add Equipment"}
      </button>

      {showAdd && (
        <Card className="border-2 border-slate-600 bg-white text-slate-900">
          <CardContent className="p-4">
            <h2 className="mb-3 text-lg font-bold">{editingId ? "Edit Equipment" : "Add Equipment"}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col">
                <label className="mb-1 text-sm font-semibold">Equipment Name</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Freezer 1"
                  className="h-11 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none"
                />
              </div>
              <div className="flex flex-col">
                <label className="mb-1 text-sm font-semibold">Equipment Type</label>
                <select
                  name="equipmentType"
                  value={form.equipmentType}
                  onChange={handleChange}
                  required
                  className="h-11 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none"
                >
                  <option value="">Select type</option>
                  <option value="Freezer">Freezer</option>
                  <option value="Fridge">Fridge</option>
                  <option value="Chiller">Chiller</option>
                </select>
              </div>
              <div className="flex flex-col">
                <label className="mb-1 text-sm font-semibold">Location</label>
                <select
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  required
                  className="h-11 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none"
                >
                  <option value="">Select location</option>
                  {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                </select>
              </div>
              <div className="flex flex-col">
                <label className="mb-1 text-sm font-semibold">Target Temperature (°C)</label>
                <input
                  name="targetTemperature"
                  value={form.targetTemperature}
                  onChange={handleChange}
                  required
                  placeholder={form.equipmentType === "Freezer" ? "-18" : "5"}
                  className="h-11 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  name="active"
                  type="checkbox"
                  checked={Boolean(form.active)}
                  onChange={handleChange}
                  className="h-5 w-5"
                />
                <label className="text-sm font-semibold">Active</label>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="h-11 w-full cursor-pointer rounded bg-emerald-600 px-6 font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
              >
                {saving ? "Saving..." : editingId ? "Update Equipment" : "Add Equipment"}
              </button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <p className="p-4 text-sm text-slate-400">Loading equipment...</p>
          ) : equipmentList.length === 0 ? (
            <p className="p-4 text-sm text-slate-400">No equipment added yet</p>
          ) : (
            <div className="divide-y divide-slate-800">
              {equipmentList.map(item => (
                <div key={item.id} className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="break-words font-semibold text-slate-100">{item.name}</span>
                      <Badge tone={item.active ? "green" : "amber"}>{item.active ? "Active" : "Inactive"}</Badge>
                    </div>
                    <div className="mt-1 text-sm text-slate-400">
                      {item.equipment_type} • {item.location} • Target {item.target_temperature}°C
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => handleEdit(item)}
                      className="rounded bg-sky-500 p-2 text-slate-950 hover:bg-sky-400"
                      aria-label="Edit equipment"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="rounded bg-red-500 p-2 text-white hover:bg-red-400"
                      aria-label="Delete equipment"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
