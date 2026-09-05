"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";

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
  equipmentId: "",
  actualTemperature: "",
  checkDate: "",
  checkTime: "",
  checkedBy: "",
  notes: ""
};

export function MobileFreezerCheck() {
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [staffNames, setStaffNames] = useState<string[]>([]);
  const [savedNotes, setSavedNotes] = useState<string[]>([]);
  const [form, setForm] = useState({ ...emptyForm });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchEquipment();
    fetchOptions();
    setForm((prev) => ({ ...prev, checkDate: getTodayLondonISO() }));
  }, []);

  async function fetchEquipment() {
    try {
      const res = await fetch("/api/freezer-equipment");
      if (!res.ok) throw new Error("Failed to load equipment");
      const data = await res.json();
      setEquipmentList(data.filter((e: Equipment) => e.active));
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
      const staff = data.filter(o => o.option_type === "staff_name").map(o => o.value);
      const notes = data.filter(o => o.option_type === "saved_note").map(o => o.value);
      if (staff.length) setStaffNames(staff);
      if (notes.length) setSavedNotes(notes);
    } catch (err: any) {
      setError(err.message);
    }
  }

  function getTodayLondonISO() {
    const now = new Date();
    const london = new Date(now.toLocaleString("en-US", { timeZone: "Europe/London" }));
    return london.toISOString().slice(0, 10);
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

  function useCurrentTime() {
    const now = new Date();
    const time = now.toTimeString().slice(0, 5);
    setForm((prev) => ({ ...prev, checkTime: time }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    setSaved(false);
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
      const savedCheck = await res.json();
      await syncMyDocument(savedCheck);
      setSaved(true);
      setForm({ ...emptyForm, checkDate: getTodayLondonISO() });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function syncMyDocument(check: any) {
    try {
      const equipment = equipmentList.find((eq) => eq.id === check.equipment_id);
      const tasks = [
        { taskKey: "equipment", task: "Equipment", completed: true, value: check.equipment_name },
        { taskKey: "type", task: "Equipment Type", completed: true, value: check.equipment_type },
        { taskKey: "location", task: "Location", completed: true, value: check.location },
        { taskKey: "target", task: "Target Temperature", completed: true, value: check.target_temperature },
        { taskKey: "actual", task: "Actual Temperature", completed: true, value: check.actual_temperature },
        { taskKey: "checkedBy", task: "Checked By", completed: true, value: check.checked_by },
        { taskKey: "status", task: "Status", completed: true, value: check.status },
        { taskKey: "notes", task: "Notes", completed: true, value: check.notes || "" }
      ];
      const payload = {
        documentType: `freezer_check_${check.equipment_id}`,
        title: `Freezer Check - ${check.equipment_name}`,
        checkDate: check.check_date,
        dayName: new Date(`${check.check_date}T12:00:00`).toLocaleDateString("en-GB", { weekday: "long" }),
        data: tasks,
        status: "Completed"
      };
      await fetch("/api/my-documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.error("Failed to sync My Documents", err);
    }
  }

  const selectedEquipment = equipmentList.find((eq) => eq.id === form.equipmentId);

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-2xl font-bold">Daily Freezer / Chiller Check</h1>

      {saved && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-emerald-300">
          <CheckCircle2 className="h-5 w-5" />
          <span className="font-semibold">Temperature check saved</span>
        </div>
      )}

      {error && <p className="text-sm font-semibold text-red-400">{error}</p>}

      <Card className="border-2 border-slate-600 bg-white text-slate-900">
        <CardContent className="p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold">Equipment</label>
              <select name="equipmentId" value={form.equipmentId} onChange={handleEquipmentChange} required className="h-11 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none">
                <option value="">Select equipment</option>
                {equipmentList.map((eq) => (
                  <option key={eq.id} value={eq.id}>{eq.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col">
                <label className="mb-1 text-sm font-semibold">Equipment Type</label>
                <input value={selectedEquipment?.equipment_type || ""} readOnly className="h-11 rounded border-2 border-slate-300 bg-slate-100 px-3" />
              </div>
              <div className="flex flex-col">
                <label className="mb-1 text-sm font-semibold">Location</label>
                <input value={selectedEquipment?.location || ""} readOnly className="h-11 rounded border-2 border-slate-300 bg-slate-100 px-3" />
              </div>
            </div>

            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold">Target Temperature (°C)</label>
              <input value={selectedEquipment?.target_temperature || ""} readOnly className="h-11 rounded border-2 border-slate-300 bg-slate-100 px-3" />
            </div>

            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold">Current Temperature (°C)</label>
              <input name="actualTemperature" value={form.actualTemperature} onChange={handleChange} required placeholder="Enter measured temperature" className="h-11 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col">
                <label className="mb-1 text-sm font-semibold">Date</label>
                <input name="checkDate" type="date" value={form.checkDate} onChange={handleChange} required className="h-11 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none" />
              </div>
              <div className="flex flex-col">
                <label className="mb-1 text-sm font-semibold">Time</label>
                <div className="flex gap-2">
                  <input name="checkTime" type="time" value={form.checkTime} onChange={handleChange} required className="h-11 flex-1 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none" />
                  <button type="button" onClick={useCurrentTime} className="h-11 shrink-0 cursor-pointer rounded border-2 border-slate-400 bg-slate-100 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-200">Now</button>
                </div>
              </div>
            </div>

            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold">Checked By</label>
              <select name="checkedBy" value={form.checkedBy} onChange={handleChange} required className="h-11 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none">
                <option value="">Select staff</option>
                {staffNames.map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
            </div>

            <div className="flex flex-col">
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

            <button type="submit" disabled={saving} className="h-11 w-full cursor-pointer rounded bg-emerald-600 px-6 font-semibold text-white hover:bg-emerald-500 disabled:opacity-60">
              {saving ? "Saving..." : "Save Temperature Check"}
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
