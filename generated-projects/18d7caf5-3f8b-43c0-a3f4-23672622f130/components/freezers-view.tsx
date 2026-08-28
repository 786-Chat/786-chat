"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const defaultEquipmentTypes = ["Freezer", "Chiller", "Fridge"];
const defaultLocations = ["Freezer 1", "Freezer 2", "Freezer 3", "Fridge 1", "Fridge 2", "Cold Room"];
const defaultStaffNames = ["Shiraz", "Mujeeb", "Chef Ali"];
const defaultSavedNotes = ["Temperature checked — OK", "Door seal checked", "Defrost completed", "Temperature adjusted"];

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
  } else if (type === "Chiller") {
    if (temp <= 5) return "Normal";
    if (temp <= 8) return "Warning";
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
  const [equipmentTypes, setEquipmentTypes] = useState<string[]>(defaultEquipmentTypes);
  const [locations, setLocations] = useState<string[]>(defaultLocations);
  const [staffNames, setStaffNames] = useState<string[]>(defaultStaffNames);
  const [savedNotes, setSavedNotes] = useState<string[]>(defaultSavedNotes);
  const [addingType, setAddingType] = useState(false);
  const [addingLocation, setAddingLocation] = useState(false);
  const [addingStaff, setAddingStaff] = useState(false);
  const [addingNote, setAddingNote] = useState(false);
  const [newType, setNewType] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newStaff, setNewStaff] = useState("");
  const [newNote, setNewNote] = useState("");

  useEffect(() => {
    fetchEquipment();
    fetchOptions();
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

  async function fetchOptions() {
    try {
      const res = await fetch("/api/freezer-options");
      if (!res.ok) throw new Error("Failed to load options");
      const data: FreezerOption[] = await res.json();
      const types = data.filter(o => o.option_type === "equipment_type").map(o => o.value);
      const locs = data.filter(o => o.option_type === "location").map(o => o.value);
      const staff = data.filter(o => o.option_type === "staff_name").map(o => o.value);
      const notes = data.filter(o => o.option_type === "saved_note").map(o => o.value);
      if (types.length) setEquipmentTypes(types);
      if (locs.length) setLocations(locs);
      if (staff.length) setStaffNames(staff);
      if (notes.length) setSavedNotes(notes);
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function addOption(optionType: string, value: string) {
    const res = await fetch("/api/freezer-options", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ optionType, value })
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error?.message || "Failed to save option");
    }
    return res.json();
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

  async function handleAddType() {
    if (!newType.trim()) return;
    try {
      await addOption("equipment_type", newType.trim());
      setEquipmentTypes(prev => [...prev, newType.trim()]);
      setForm(prev => ({ ...prev, equipmentType: newType.trim() }));
      setNewType("");
      setAddingType(false);
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleAddLocation() {
    if (!newLocation.trim()) return;
    try {
      await addOption("location", newLocation.trim());
      setLocations(prev => [...prev, newLocation.trim()]);
      setForm(prev => ({ ...prev, location: newLocation.trim() }));
      setNewLocation("");
      setAddingLocation(false);
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleAddStaff() {
    if (!newStaff.trim()) return;
    try {
      await addOption("staff_name", newStaff.trim());
      setStaffNames(prev => [...prev, newStaff.trim()]);
      setForm(prev => ({ ...prev, checkedBy: newStaff.trim() }));
      setNewStaff("");
      setAddingStaff(false);
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleAddNote() {
    if (!newNote.trim()) return;
    try {
      await addOption("saved_note", newNote.trim());
      setSavedNotes(prev => [...prev, newNote.trim()]);
      setNewNote("");
      setAddingNote(false);
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
              <div className="flex gap-2">
                <select name="equipmentType" value={form.equipmentType} onChange={handleChange} required className="h-11 flex-1 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none">
                  <option value="">Select</option>
                  {equipmentTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
                <button type="button" onClick={() => setAddingType(!addingType)} className="h-11 shrink-0 cursor-pointer rounded border-2 border-slate-400 bg-slate-100 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-200">+ Add Type</button>
              </div>
              {addingType && (
                <div className="mt-2 flex gap-2">
                  <input value={newType} onChange={(e) => setNewType(e.target.value)} placeholder="New type" className="h-10 flex-1 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none" />
                  <button type="button" onClick={handleAddType} className="h-10 cursor-pointer rounded bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-500">Save</button>
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold">Location</label>
              <div className="flex gap-2">
                <select name="location" value={form.location} onChange={handleChange} required className="h-11 flex-1 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none">
                  <option value="">Select</option>
                  {locations.map((loc) => <option key={loc} value={loc}>{loc}</option>)}
                </select>
                <button type="button" onClick={() => setAddingLocation(!addingLocation)} className="h-11 shrink-0 cursor-pointer rounded border-2 border-slate-400 bg-slate-100 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-200">+ Add Location</button>
              </div>
              {addingLocation && (
                <div className="mt-2 flex gap-2">
                  <input value={newLocation} onChange={(e) => setNewLocation(e.target.value)} placeholder="New location" className="h-10 flex-1 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none" />
                  <button type="button" onClick={handleAddLocation} className="h-10 cursor-pointer rounded bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-500">Save</button>
                </div>
              )}
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
              <div className="flex gap-2">
                <select name="checkedBy" value={form.checkedBy} onChange={handleChange} required className="h-11 flex-1 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none">
                  <option value="">Select</option>
                  {staffNames.map((name) => <option key={name} value={name}>{name}</option>)}
                </select>
                <button type="button" onClick={() => setAddingStaff(!addingStaff)} className="h-11 shrink-0 cursor-pointer rounded border-2 border-slate-400 bg-slate-100 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-200">+ Add Staff</button>
              </div>
              {addingStaff && (
                <div className="mt-2 flex gap-2">
                  <input value={newStaff} onChange={(e) => setNewStaff(e.target.value)} placeholder="Staff name" className="h-10 flex-1 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none" />
                  <button type="button" onClick={handleAddStaff} className="h-10 cursor-pointer rounded bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-500">Save</button>
                </div>
              )}
            </div>
            <div className="flex flex-col sm:col-span-2">
              <label className="mb-1 text-sm font-semibold">Notes</label>
              <textarea name="notes" value={form.notes} onChange={handleChange} rows={2} className="rounded border-2 border-slate-400 px-3 py-2 focus:border-sky-500 focus:outline-none" />
              <div className="mt-2 flex gap-2">
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) {
                      setForm(prev => ({ ...prev, notes: prev.notes ? prev.notes + "\n" + e.target.value : e.target.value }));
                    }
                  }}
                  className="h-10 flex-1 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none"
                >
                  <option value="">Select saved note</option>
                  {savedNotes.map((note) => <option key={note} value={note}>{note}</option>)}
                </select>
                <button type="button" onClick={() => setAddingNote(!addingNote)} className="h-10 shrink-0 cursor-pointer rounded border-2 border-slate-400 bg-slate-100 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-200">+ Add Note</button>
              </div>
              {addingNote && (
                <div className="mt-2 flex gap-2">
                  <input value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="New note" className="h-10 flex-1 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none" />
                  <button type="button" onClick={handleAddNote} className="h-10 cursor-pointer rounded bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-500">Save</button>
                </div>
              )}
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
            <div className="overflow-x-auto scrollbar-thin">
              <table className="min-w-[900px] w-full text-left text-sm">
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
