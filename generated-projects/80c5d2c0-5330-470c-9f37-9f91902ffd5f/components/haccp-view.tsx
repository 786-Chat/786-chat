"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const defaultProcessAreas = ["Cooking", "Cooling", "Freezing", "Storage", "Packing"];
const defaultControlPoints = ["CCP1 - Cooking", "CCP2 - Cooling", "CCP3 - Freezer Storage"];
const defaultCriticalLimits = ["Core temp ≥ 75°C", "Cool to ≤ 8°C in 90 min", "Freezer ≤ -18°C"];
const defaultStaffNames = ["Shiraz", "Mujeeb", "Chef Ali"];
const defaultSavedNotes = ["Check completed", "Need follow-up", "Action taken"];

interface HaccpCheck {
  id: string;
  check_date: string;
  check_time: string;
  process_area: string;
  hazard_type: string;
  control_point: string;
  critical_limit: string;
  actual_result: string;
  status: string;
  checked_by: string;
  notes: string;
  completed: boolean;
}

interface HaccpOption {
  id: string;
  option_type: string;
  value: string;
}

const emptyForm = {
  checkDate: "",
  checkTime: "",
  processArea: "",
  hazardType: "Biological",
  controlPoint: "",
  criticalLimit: "",
  actualResult: "",
  status: "Pass",
  checkedBy: "",
  notes: "",
  completed: true
};

export function HaccpView() {
  const [checks, setChecks] = useState<HaccpCheck[]>([]);
  const [form, setForm] = useState({ ...emptyForm });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [processAreas, setProcessAreas] = useState<string[]>(defaultProcessAreas);
  const [controlPoints, setControlPoints] = useState<string[]>(defaultControlPoints);
  const [criticalLimits, setCriticalLimits] = useState<string[]>(defaultCriticalLimits);
  const [staffNames, setStaffNames] = useState<string[]>(defaultStaffNames);
  const [savedNotes, setSavedNotes] = useState<string[]>(defaultSavedNotes);
  const [addingProcessArea, setAddingProcessArea] = useState(false);
  const [addingControlPoint, setAddingControlPoint] = useState(false);
  const [addingCriticalLimit, setAddingCriticalLimit] = useState(false);
  const [addingStaff, setAddingStaff] = useState(false);
  const [addingNote, setAddingNote] = useState(false);
  const [newProcessArea, setNewProcessArea] = useState("");
  const [newControlPoint, setNewControlPoint] = useState("");
  const [newCriticalLimit, setNewCriticalLimit] = useState("");
  const [newStaff, setNewStaff] = useState("");
  const [newNote, setNewNote] = useState("");

  useEffect(() => {
    fetchChecks();
    fetchOptions();
  }, []);

  async function fetchChecks() {
    try {
      const res = await fetch("/api/haccp-checks");
      if (!res.ok) throw new Error("Failed to load HACCP checks");
      const data = await res.json();
      setChecks(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchOptions() {
    try {
      const res = await fetch("/api/haccp-options");
      if (!res.ok) throw new Error("Failed to load options");
      const data: HaccpOption[] = await res.json();
      const processVals = data.filter(o => o.option_type === "process_area").map(o => o.value);
      const controlVals = data.filter(o => o.option_type === "control_point").map(o => o.value);
      const limitVals = data.filter(o => o.option_type === "critical_limit").map(o => o.value);
      const staffVals = data.filter(o => o.option_type === "staff_name").map(o => o.value);
      const noteVals = data.filter(o => o.option_type === "saved_note").map(o => o.value);
      if (processVals.length) setProcessAreas(processVals);
      if (controlVals.length) setControlPoints(controlVals);
      if (limitVals.length) setCriticalLimits(limitVals);
      if (staffVals.length) setStaffNames(staffVals);
      if (noteVals.length) setSavedNotes(noteVals);
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function addOption(optionType: string, value: string) {
    const res = await fetch("/api/haccp-options", {
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
      const res = await fetch("/api/haccp-checks", {
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
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleAddProcessArea() {
    if (!newProcessArea.trim()) return;
    try {
      await addOption("process_area", newProcessArea.trim());
      setProcessAreas(prev => [...prev, newProcessArea.trim()]);
      setForm(prev => ({ ...prev, processArea: newProcessArea.trim() }));
      setNewProcessArea("");
      setAddingProcessArea(false);
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleAddControlPoint() {
    if (!newControlPoint.trim()) return;
    try {
      await addOption("control_point", newControlPoint.trim());
      setControlPoints(prev => [...prev, newControlPoint.trim()]);
      setForm(prev => ({ ...prev, controlPoint: newControlPoint.trim() }));
      setNewControlPoint("");
      setAddingControlPoint(false);
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleAddCriticalLimit() {
    if (!newCriticalLimit.trim()) return;
    try {
      await addOption("critical_limit", newCriticalLimit.trim());
      setCriticalLimits(prev => [...prev, newCriticalLimit.trim()]);
      setForm(prev => ({ ...prev, criticalLimit: newCriticalLimit.trim() }));
      setNewCriticalLimit("");
      setAddingCriticalLimit(false);
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
      <h1 className="text-2xl font-bold">HACCP</h1>

      <Card className="border-2 border-slate-600 bg-white text-slate-900">
        <CardContent className="p-4 sm:p-6">
          <h2 className="mb-4 text-lg font-bold">HACCP Check</h2>
          {error && <p className="mb-3 text-sm font-semibold text-red-600">{error}</p>}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              <label className="mb-1 text-sm font-semibold">Process / Area</label>
              <div className="flex gap-2">
                <select name="processArea" value={form.processArea} onChange={handleChange} required className="h-11 flex-1 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none">
                  <option value="">Select</option>
                  {processAreas.map((area) => <option key={area} value={area}>{area}</option>)}
                </select>
                <button type="button" onClick={() => setAddingProcessArea(!addingProcessArea)} className="h-11 shrink-0 cursor-pointer rounded border-2 border-slate-400 bg-slate-100 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-200">+ Add</button>
              </div>
              {addingProcessArea && (
                <div className="mt-2 flex gap-2">
                  <input value={newProcessArea} onChange={(e) => setNewProcessArea(e.target.value)} placeholder="New process/area" className="h-10 flex-1 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none" />
                  <button type="button" onClick={handleAddProcessArea} className="h-10 cursor-pointer rounded bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-500">Save</button>
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold">Hazard Type</label>
              <select name="hazardType" value={form.hazardType} onChange={handleChange} required className="h-11 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none">
                <option value="Biological">Biological</option>
                <option value="Chemical">Chemical</option>
                <option value="Physical">Physical</option>
                <option value="Allergen">Allergen</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold">Control Point</label>
              <div className="flex gap-2">
                <select name="controlPoint" value={form.controlPoint} onChange={handleChange} required className="h-11 flex-1 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none">
                  <option value="">Select</option>
                  {controlPoints.map((cp) => <option key={cp} value={cp}>{cp}</option>)}
                </select>
                <button type="button" onClick={() => setAddingControlPoint(!addingControlPoint)} className="h-11 shrink-0 cursor-pointer rounded border-2 border-slate-400 bg-slate-100 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-200">+ Add</button>
              </div>
              {addingControlPoint && (
                <div className="mt-2 flex gap-2">
                  <input value={newControlPoint} onChange={(e) => setNewControlPoint(e.target.value)} placeholder="New control point" className="h-10 flex-1 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none" />
                  <button type="button" onClick={handleAddControlPoint} className="h-10 cursor-pointer rounded bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-500">Save</button>
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold">Critical Limit</label>
              <div className="flex gap-2">
                <select name="criticalLimit" value={form.criticalLimit} onChange={handleChange} required className="h-11 flex-1 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none">
                  <option value="">Select</option>
                  {criticalLimits.map((cl) => <option key={cl} value={cl}>{cl}</option>)}
                </select>
                <button type="button" onClick={() => setAddingCriticalLimit(!addingCriticalLimit)} className="h-11 shrink-0 cursor-pointer rounded border-2 border-slate-400 bg-slate-100 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-200">+ Add</button>
              </div>
              {addingCriticalLimit && (
                <div className="mt-2 flex gap-2">
                  <input value={newCriticalLimit} onChange={(e) => setNewCriticalLimit(e.target.value)} placeholder="New critical limit" className="h-10 flex-1 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none" />
                  <button type="button" onClick={handleAddCriticalLimit} className="h-10 cursor-pointer rounded bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-500">Save</button>
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold">Actual Result / Measurement</label>
              <input name="actualResult" value={form.actualResult} onChange={handleChange} required placeholder="Enter actual measurement" className="h-11 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none" />
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold">Status</label>
              <select name="status" value={form.status} onChange={handleChange} required className="h-11 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none">
                <option value="Pass">Pass</option>
                <option value="Warning">Warning</option>
                <option value="Fail">Fail</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold">Checked By</label>
              <div className="flex gap-2">
                <select name="checkedBy" value={form.checkedBy} onChange={handleChange} required className="h-11 flex-1 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none">
                  <option value="">Select</option>
                  {staffNames.map((name) => <option key={name} value={name}>{name}</option>)}
                </select>
                <button type="button" onClick={() => setAddingStaff(!addingStaff)} className="h-11 shrink-0 cursor-pointer rounded border-2 border-slate-400 bg-slate-100 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-200">+ Add</button>
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
                <button type="button" onClick={() => setAddingNote(!addingNote)} className="h-10 shrink-0 cursor-pointer rounded border-2 border-slate-400 bg-slate-100 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-200">+ Add</button>
              </div>
              {addingNote && (
                <div className="mt-2 flex gap-2">
                  <input value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="New note" className="h-10 flex-1 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none" />
                  <button type="button" onClick={handleAddNote} className="h-10 cursor-pointer rounded bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-500">Save</button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 sm:col-span-2">
              <input name="completed" type="checkbox" checked={Boolean(form.completed)} onChange={handleChange} className="h-5 w-5" />
              <label className="text-sm font-semibold">Completed</label>
            </div>
            <div className="flex gap-3 sm:col-span-2">
              <button type="submit" className="h-11 cursor-pointer rounded bg-emerald-600 px-6 font-semibold text-white hover:bg-emerald-500">Save Check</button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <p className="p-4 text-sm text-slate-400">Loading HACCP history...</p>
          ) : checks.length === 0 ? (
            <p className="p-4 text-sm text-slate-400">No HACCP checks recorded yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-800 text-slate-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Time</th>
                    <th className="px-4 py-3 font-medium">Process/Area</th>
                    <th className="px-4 py-3 font-medium">Hazard Type</th>
                    <th className="px-4 py-3 font-medium">Control Point</th>
                    <th className="px-4 py-3 font-medium">Critical Limit</th>
                    <th className="px-4 py-3 font-medium">Actual Result</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Checked By</th>
                    <th className="px-4 py-3 font-medium">Completed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {checks.map((check) => {
                    const statusTone = check.status === "Pass" ? "green" : check.status === "Warning" ? "amber" : "red";
                    const completedTone = check.completed ? "green" : "amber";
                    return (
                      <tr key={check.id} className={check.status === "Warning" ? "bg-amber-500/10" : check.status === "Fail" ? "bg-red-500/10" : ""}>
                        <td className="px-4 py-3">{check.check_date}</td>
                        <td className="px-4 py-3">{check.check_time}</td>
                        <td className="px-4 py-3 font-medium text-slate-100">{check.process_area}</td>
                        <td className="px-4 py-3">{check.hazard_type}</td>
                        <td className="px-4 py-3">{check.control_point}</td>
                        <td className="px-4 py-3">{check.critical_limit}</td>
                        <td className="px-4 py-3">{check.actual_result}</td>
                        <td className="px-4 py-3"><Badge tone={statusTone as any}>{check.status}</Badge></td>
                        <td className="px-4 py-3">{check.checked_by}</td>
                        <td className="px-4 py-3"><Badge tone={completedTone as any}>{check.completed ? "Yes" : "No"}</Badge></td>
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
