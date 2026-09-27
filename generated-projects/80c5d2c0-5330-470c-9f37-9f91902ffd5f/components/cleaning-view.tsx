"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const defaultAreas = ["Kitchen", "Freezer 1", "Freezer 2", "Chiller 1", "Production Area", "Packaging Area", "Cold Room"];
const defaultTasks = ["Deep Clean", "Surface Wipe", "Defrost", "Sanitise", "Sweep", "Mop"];
const defaultChemicals = ["Sanitiser", "Degreaser", "Detergent", "Bleach", "Glass Cleaner"];
const defaultSavedNotes = ["Cleaning completed", "Need follow-up", "Equipment moved"];

interface CleaningCheck {
  id: string;
  area_equipment: string;
  cleaning_task: string;
  cleaning_date: string;
  cleaning_time: string;
  cleaned_by: string;
  checked_by: string;
  chemical_used: string;
  result: string;
  notes: string;
  completed: boolean;
}

interface CleaningOption {
  id: string;
  option_type: string;
  value: string;
}

const emptyForm = {
  areaEquipment: "",
  cleaningTask: "",
  cleaningDate: "",
  cleaningTime: "",
  cleanedBy: "",
  checkedBy: "",
  chemicalUsed: "",
  result: "Satisfactory",
  notes: "",
  completed: true
};

export function CleaningView() {
  const [checks, setChecks] = useState<CleaningCheck[]>([]);
  const [form, setForm] = useState({ ...emptyForm });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [areas, setAreas] = useState<string[]>(defaultAreas);
  const [tasks, setTasks] = useState<string[]>(defaultTasks);
  const [staff, setStaff] = useState<string[]>([]);
  const [chemicals, setChemicals] = useState<string[]>(defaultChemicals);
  const [savedNotes, setSavedNotes] = useState<string[]>(defaultSavedNotes);
  const [addingArea, setAddingArea] = useState(false);
  const [addingTask, setAddingTask] = useState(false);
  const [addingStaff, setAddingStaff] = useState(false);
  const [addingChemical, setAddingChemical] = useState(false);
  const [addingNote, setAddingNote] = useState(false);
  const [newArea, setNewArea] = useState("");
  const [newTask, setNewTask] = useState("");
  const [newStaff, setNewStaff] = useState("");
  const [newChemical, setNewChemical] = useState("");
  const [newNote, setNewNote] = useState("");

  useEffect(() => {
    fetchChecks();
    fetchOptions();
  }, []);

  async function fetchChecks() {
    try {
      const res = await fetch("/api/cleaning-checks");
      if (!res.ok) throw new Error("Failed to load cleaning checks");
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
      const res = await fetch("/api/cleaning-options");
      if (!res.ok) throw new Error("Failed to load options");
      const data: CleaningOption[] = await res.json();
      const areaVals = data.filter(o => o.option_type === "cleaning_area").map(o => o.value);
      const taskVals = data.filter(o => o.option_type === "cleaning_task").map(o => o.value);
      const staffVals = data.filter(o => o.option_type === "staff_name").map(o => o.value);
      const chemVals = data.filter(o => o.option_type === "chemical").map(o => o.value);
      const noteVals = data.filter(o => o.option_type === "saved_note").map(o => o.value);
      if (areaVals.length) setAreas(areaVals);
      if (taskVals.length) setTasks(taskVals);
      if (staffVals.length) setStaff(staffVals);
      if (chemVals.length) setChemicals(chemVals);
      if (noteVals.length) setSavedNotes(noteVals);
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function addOption(optionType: string, value: string) {
    const res = await fetch("/api/cleaning-options", {
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
    setForm((prev) => ({ ...prev, cleaningDate: date, cleaningTime: time }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch("/api/cleaning-checks", {
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

  async function handleAddArea() {
    if (!newArea.trim()) return;
    try {
      await addOption("cleaning_area", newArea.trim());
      setAreas(prev => [...prev, newArea.trim()]);
      setForm(prev => ({ ...prev, areaEquipment: newArea.trim() }));
      setNewArea("");
      setAddingArea(false);
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleAddTask() {
    if (!newTask.trim()) return;
    try {
      await addOption("cleaning_task", newTask.trim());
      setTasks(prev => [...prev, newTask.trim()]);
      setForm(prev => ({ ...prev, cleaningTask: newTask.trim() }));
      setNewTask("");
      setAddingTask(false);
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleAddStaff() {
    if (!newStaff.trim()) return;
    try {
      await addOption("staff_name", newStaff.trim());
      setStaff(prev => [...prev, newStaff.trim()]);
      setForm(prev => ({ ...prev, cleanedBy: newStaff.trim() }));
      setNewStaff("");
      setAddingStaff(false);
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleAddChemical() {
    if (!newChemical.trim()) return;
    try {
      await addOption("chemical", newChemical.trim());
      setChemicals(prev => [...prev, newChemical.trim()]);
      setForm(prev => ({ ...prev, chemicalUsed: newChemical.trim() }));
      setNewChemical("");
      setAddingChemical(false);
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
      <h1 className="text-2xl font-bold">Cleaning</h1>

      <Card className="border-2 border-slate-600 bg-white text-slate-900">
        <CardContent className="p-4 sm:p-6">
          <h2 className="mb-4 text-lg font-bold">Cleaning Check</h2>
          {error && <p className="mb-3 text-sm font-semibold text-red-600">{error}</p>}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold">Cleaning Area / Equipment</label>
              <div className="flex gap-2">
                <select name="areaEquipment" value={form.areaEquipment} onChange={handleChange} required className="h-11 flex-1 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none">
                  <option value="">Select</option>
                  {areas.map((area) => <option key={area} value={area}>{area}</option>)}
                </select>
                <button type="button" onClick={() => setAddingArea(!addingArea)} className="h-11 shrink-0 cursor-pointer rounded border-2 border-slate-400 bg-slate-100 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-200">+ Add</button>
              </div>
              {addingArea && (
                <div className="mt-2 flex gap-2">
                  <input value={newArea} onChange={(e) => setNewArea(e.target.value)} placeholder="New area" className="h-10 flex-1 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none" />
                  <button type="button" onClick={handleAddArea} className="h-10 cursor-pointer rounded bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-500">Save</button>
                </div>
              )}
            </div>

            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold">Cleaning Task</label>
              <div className="flex gap-2">
                <select name="cleaningTask" value={form.cleaningTask} onChange={handleChange} required className="h-11 flex-1 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none">
                  <option value="">Select</option>
                  {tasks.map((task) => <option key={task} value={task}>{task}</option>)}
                </select>
                <button type="button" onClick={() => setAddingTask(!addingTask)} className="h-11 shrink-0 cursor-pointer rounded border-2 border-slate-400 bg-slate-100 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-200">+ Add</button>
              </div>
              {addingTask && (
                <div className="mt-2 flex gap-2">
                  <input value={newTask} onChange={(e) => setNewTask(e.target.value)} placeholder="New task" className="h-10 flex-1 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none" />
                  <button type="button" onClick={handleAddTask} className="h-10 cursor-pointer rounded bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-500">Save</button>
                </div>
              )}
            </div>

            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold">Cleaning Date</label>
              <input name="cleaningDate" type="date" value={form.cleaningDate} onChange={handleChange} required className="h-11 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none" />
            </div>

            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold">Cleaning Time</label>
              <div className="flex gap-2">
                <input name="cleaningTime" type="time" value={form.cleaningTime} onChange={handleChange} required className="h-11 flex-1 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none" />
                <button type="button" onClick={useCurrentDateTime} className="h-11 shrink-0 cursor-pointer rounded border-2 border-slate-400 bg-slate-100 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-200">Now</button>
              </div>
            </div>

            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold">Cleaned By</label>
              <div className="flex gap-2">
                <select name="cleanedBy" value={form.cleanedBy} onChange={handleChange} required className="h-11 flex-1 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none">
                  <option value="">Select</option>
                  {staff.map((name) => <option key={name} value={name}>{name}</option>)}
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

            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold">Checked By</label>
              <select name="checkedBy" value={form.checkedBy} onChange={handleChange} required className="h-11 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none">
                <option value="">Select</option>
                {staff.map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
            </div>

            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold">Cleaning Chemical / Product Used</label>
              <div className="flex gap-2">
                <select name="chemicalUsed" value={form.chemicalUsed} onChange={handleChange} required className="h-11 flex-1 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none">
                  <option value="">Select</option>
                  {chemicals.map((chem) => <option key={chem} value={chem}>{chem}</option>)}
                </select>
                <button type="button" onClick={() => setAddingChemical(!addingChemical)} className="h-11 shrink-0 cursor-pointer rounded border-2 border-slate-400 bg-slate-100 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-200">+ Add</button>
              </div>
              {addingChemical && (
                <div className="mt-2 flex gap-2">
                  <input value={newChemical} onChange={(e) => setNewChemical(e.target.value)} placeholder="New chemical" className="h-10 flex-1 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none" />
                  <button type="button" onClick={handleAddChemical} className="h-10 cursor-pointer rounded bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-500">Save</button>
                </div>
              )}
            </div>

            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold">Result</label>
              <select name="result" value={form.result} onChange={handleChange} required className="h-11 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none">
                <option value="Satisfactory">Satisfactory</option>
                <option value="Unsatisfactory">Unsatisfactory</option>
              </select>
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
    </div>
  );
}
