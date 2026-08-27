"use client";

import { useEffect, useMemo, useState } from "react";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_CLASSES = [
  "bg-red-500/15 border-red-500/30",
  "bg-blue-500/15 border-blue-500/30",
  "bg-emerald-500/15 border-emerald-500/30",
  "bg-amber-400/20 border-amber-400/40",
  "bg-violet-500/15 border-violet-500/30",
  "bg-pink-500/15 border-pink-500/30",
  "bg-cyan-500/15 border-cyan-500/30",
];
const TASK_CLASSES = [
  "bg-violet-600",
  "bg-emerald-600",
  "bg-blue-600",
  "bg-pink-600",
  "bg-slate-600",
  "bg-orange-600",
  "bg-red-600",
  "bg-cyan-600",
  "bg-amber-500",
];

const OPENING_TASKS = [
  "Hand wash basin has hot/cold running water, soap & towels",
  "Equipment working: fridges, freezers, cooking equipment, dishwasher and hot/cold water",
  "Waste area and sanitisers available; colour-coded cloths ready",
  "Floors clean from the previous day",
  "Food and hand-contact surfaces clean from the previous day",
  "No dirty washing-up left from the previous day",
  "Waste cleared from the previous day",
  "Food handlers fit for work and any required declarations completed",
  "No out-of-date food products; food correctly covered and stored",
];

const CLOSING_TASKS = [
  "All equipment switched off and cleaned (fridges/freezers remain on)",
  "Food and hand-contact surfaces cleaned and sanitised",
  "Floors swept and mopped with appropriate cleaning solution",
  "All food items properly stored and labelled with dates",
  "Waste emptied and bins cleaned",
  "Dishwasher cleaned and switched off",
  "Refrigeration/freezer temperature readings recorded",
  "Hand wash basins restocked with soap and towels",
  "All lights turned off and doors locked securely",
];

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function mondayOf(date: Date) {
  const d = new Date(date);
  d.setHours(12, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function addDays(date: Date, amount: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + amount);
  return d;
}

export function WeeklyChecksView({ mode }: { mode: "opening" | "closing" }) {
  const tasks = mode === "opening" ? OPENING_TASKS : CLOSING_TASKS;
  const [selectedDate, setSelectedDate] = useState(isoDate(new Date()));
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const weekStart = useMemo(() => mondayOf(new Date(`${selectedDate}T12:00:00`)), [selectedDate]);
  const weekDates = useMemo(() => DAYS.map((_, i) => addDays(weekStart, i)), [weekStart]);
  const selected = new Date(`${selectedDate}T12:00:00`);
  const monthLabel = selected.toLocaleDateString("en-GB", { month: "long" });
  const dayLabel = selected.toLocaleDateString("en-GB", { weekday: "long" });
  const title = mode === "opening" ? "Daily Opening Checks" : "Daily Closing Checks";
  const todayIso = isoDate(new Date());

  useEffect(() => {
    loadWeek();
  }, [mode, weekStart.getTime()]);

  async function loadWeek() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/weekly-checks?type=${mode}&weekStart=${isoDate(weekStart)}`);
      if (!res.ok) throw new Error("Failed to load checks");
      const rows = await res.json();
      const next: Record<string, boolean> = {};
      for (const row of rows) next[`${row.task_key}|${row.check_date}`] = Boolean(row.completed);
      setCompleted(next);
    } catch (err: any) {
      setError(err.message || "Failed to load checks");
    } finally {
      setLoading(false);
    }
  }

  async function toggle(taskIndex: number, date: Date) {
    const dateKey = isoDate(date);
    const taskKey = `task-${taskIndex + 1}`;
    const key = `${taskKey}|${dateKey}`;
    const nextValue = !completed[key];
    setCompleted(prev => ({ ...prev, [key]: nextValue }));
    setSavingKey(key);
    setError(null);
    try {
      const res = await fetch("/api/weekly-checks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkType: mode, taskKey, checkDate: dateKey, completed: nextValue }),
      });
      if (!res.ok) throw new Error("Failed to save check");
    } catch (err: any) {
      setCompleted(prev => ({ ...prev, [key]: !nextValue }));
      setError(err.message || "Failed to save check");
    } finally {
      setSavingKey(null);
    }
  }

  function moveWeek(days: number) {
    setSelectedDate(isoDate(addDays(new Date(`${selectedDate}T12:00:00`), days)));
  }

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 shadow-xl">
        <div className="bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 px-5 py-5 text-center text-white">
          <h1 className="text-2xl font-extrabold sm:text-3xl">✓ {title}</h1>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-sm font-semibold">
            <span className="rounded-full bg-white/15 px-3 py-2">Month: {monthLabel}</span>
            <label className="flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5">
              <span>Date</span>
              <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="rounded bg-slate-800 px-2 py-1 text-white" />
            </label>
            <span className="rounded-full bg-emerald-500 px-3 py-2">Day: {dayLabel}</span>
            <button type="button" onClick={() => moveWeek(-7)} className="rounded bg-slate-800/70 px-3 py-2 hover:bg-slate-700">← Previous Week</button>
            <button type="button" onClick={() => moveWeek(7)} className="rounded bg-slate-800/70 px-3 py-2 hover:bg-slate-700">Next Week →</button>
          </div>
        </div>

        {error && <div className="border-b border-red-700 bg-red-950/70 px-4 py-3 text-sm font-semibold text-red-300">{error}</div>}

        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-800 text-white">
                <th className="min-w-[360px] px-4 py-4 text-left">Tasks</th>
                {weekDates.map((date, i) => {
                  const dateIso = isoDate(date);
                  return (
                    <th key={dateIso} className={`min-w-[78px] border-l border-slate-700 px-2 py-3 text-center ${dateIso === todayIso ? "ring-2 ring-inset ring-amber-300" : ""}`}>
                      <div>{DAYS[i]}</div>
                      <div className="mt-1 text-xs font-normal text-slate-300">{date.getDate()}</div>
                      {dateIso === todayIso && <div className="mt-1 text-[10px] font-bold text-amber-300">TODAY</div>}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {tasks.map((task, taskIndex) => (
                <tr key={task} className="border-t border-slate-700">
                  <td className={`${TASK_CLASSES[taskIndex % TASK_CLASSES.length]} px-4 py-4 font-semibold text-white`}>{task}</td>
                  {weekDates.map((date, dayIndex) => {
                    const dateIso = isoDate(date);
                    const taskKey = `task-${taskIndex + 1}`;
                    const key = `${taskKey}|${dateIso}`;
                    const checked = Boolean(completed[key]);
                    return (
                      <td key={dateIso} className={`border-l px-2 py-3 text-center ${DAY_CLASSES[dayIndex]}`}>
                        <button
                          type="button"
                          disabled={loading || savingKey === key}
                          onClick={() => toggle(taskIndex, date)}
                          aria-label={`${task} ${DAYS[dayIndex]}`}
                          className={`mx-auto flex h-10 w-10 items-center justify-center rounded-lg border-2 text-xl font-black shadow-sm transition ${checked ? "border-emerald-300 bg-emerald-500 text-white" : "border-sky-500 bg-slate-900 text-transparent hover:border-sky-300"} disabled:opacity-50`}
                        >
                          {checked ? "✓" : "□"}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-emerald-600 px-4 py-3 text-center text-sm font-semibold text-white">
          Tick each box when the {mode === "opening" ? "opening" : "closing"} check is completed. Your ticks are saved automatically.
        </div>
      </div>
    </div>
  );
}
