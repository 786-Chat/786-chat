"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

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

type MobileOpeningChecksProps = {
  onBack?: () => void;
};

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

function getTodayLondonISO() {
  const now = new Date();
  const london = new Date(now.toLocaleString("en-US", { timeZone: "Europe/London" }));
  return isoDate(london);
}

function getDayName(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-GB", { weekday: "long" });
}

export function MobileOpeningChecks({ onBack }: MobileOpeningChecksProps) {
  const [selectedDate, setSelectedDate] = useState(() => getTodayLondonISO());
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [slideDirection, setSlideDirection] = useState<"left" | "right" | null>(null);
  const [animating, setAnimating] = useState(false);

  const weekStart = useMemo(() => mondayOf(new Date(`${selectedDate}T12:00:00`)), [selectedDate]);
  const weekDates = useMemo(() => DAYS.map((_, i) => addDays(weekStart, i)), [weekStart]);
  const selected = new Date(`${selectedDate}T12:00:00`);
  const dayIndex = selected.getDay() === 0 ? 6 : selected.getDay() - 1;
  const dayLabel = DAYS[dayIndex];

  useEffect(() => {
    loadWeek();
  }, [weekStart.getTime()]);

  async function loadWeek() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/weekly-checks?type=opening&weekStart=${isoDate(weekStart)}`);
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

  async function toggle(taskIndex: number) {
    const dateKey = selectedDate;
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
        body: JSON.stringify({ checkType: "opening", taskKey, checkDate: dateKey, completed: nextValue }),
      });
      if (!res.ok) throw new Error("Failed to save check");
      // After saving, sync the My Documents record for this date
      await syncMyDocument(dateKey);
    } catch (err: any) {
      setCompleted(prev => ({ ...prev, [key]: !nextValue }));
      setError(err.message || "Failed to save check");
    } finally {
      setSavingKey(null);
    }
  }

  async function syncMyDocument(dateStr: string) {
    try {
      // Fetch all opening checks for that date
      const weekStartDate = mondayOf(new Date(`${dateStr}T12:00:00`));
      const res = await fetch(`/api/weekly-checks?type=opening&weekStart=${isoDate(weekStartDate)}`);
      if (!res.ok) return;
      const rows = await res.json();
      const tasks = OPENING_TASKS.map((task, index) => {
        const taskKey = `task-${index + 1}`;
        const row = rows.find((r: any) => r.task_key === taskKey && r.check_date === dateStr);
        return {
          taskKey,
          task,
          completed: row ? Boolean(row.completed) : false,
        };
      });
      const allCompleted = tasks.every(t => t.completed);
      const dayName = getDayName(dateStr);
      const payload = {
        documentType: "opening_checks",
        title: "Opening Checks",
        checkDate: dateStr,
        dayName,
        data: tasks,
        status: allCompleted ? "Completed" : "Incomplete",
      };
      // Upsert via my-documents API (POST creates or updates)
      await fetch("/api/my-documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error("Failed to sync My Documents", err);
    }
  }

  function moveDay(direction: 1 | -1) {
    if (animating) return;
    setSlideDirection(direction === 1 ? "left" : "right");
    setAnimating(true);
    setSelectedDate(isoDate(addDays(new Date(`${selectedDate}T12:00:00`), direction)));
    setTimeout(() => {
      setAnimating(false);
      setSlideDirection(null);
    }, 300);
  }

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) moveDay(1);
      else moveDay(-1);
    }
    touchStartX.current = null;
    touchStartY.current = null;
  }

  const slideClass =
    slideDirection === "left"
      ? "animate-slide-left"
      : slideDirection === "right"
      ? "animate-slide-right"
      : "";

  function goBack() {
    if (onBack) {
      onBack();
      return;
    }
    window.history.back();
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950 text-slate-100" style={{ scrollbarWidth: "none" }}>
      <style>{`
        .animate-slide-left { animation: slideLeft 0.3s ease-out; }
        .animate-slide-right { animation: slideRight 0.3s ease-out; }
        @keyframes slideLeft { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes slideRight { from { transform: translateX(-100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      `}</style>
      <div className="mx-auto min-h-full w-full max-w-md px-4 pb-8 pt-4">
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={goBack}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-slate-200 hover:bg-slate-700"
            aria-label="Back to Raja launcher"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-bold">Opening Checks</h1>
          <div className="w-10" />
        </div>

        <div className="mb-4 text-center">
          <div className="text-2xl font-extrabold uppercase tracking-wide">{dayLabel}</div>
          <div className="text-sm text-slate-400">
            {selected.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
          </div>
        </div>

        {error && <div className="mb-3 rounded bg-red-950/70 px-3 py-2 text-sm font-semibold text-red-300">{error}</div>}

        <div
          className={`space-y-3 ${slideClass}`}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {loading ? (
            <p className="text-center text-sm text-slate-400">Loading checks…</p>
          ) : (
            OPENING_TASKS.map((task, index) => {
              const taskKey = `task-${index + 1}`;
              const key = `${taskKey}|${selectedDate}`;
              const checked = Boolean(completed[key]);
              return (
                <div
                  key={task}
                  className={`flex items-center rounded-xl px-4 py-3 shadow-lg ${TASK_CLASSES[index % TASK_CLASSES.length]}`}
                >
                  <span className="flex-1 text-sm font-semibold text-white">{task}</span>
                  <button
                    type="button"
                    disabled={savingKey === key}
                    onClick={() => toggle(index)}
                    aria-label={`${task} ${dayLabel}`}
                    className={`ml-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 text-lg font-black transition ${
                      checked
                        ? "border-emerald-300 bg-emerald-500 text-white"
                        : "border-sky-500 bg-slate-900 text-transparent hover:border-sky-300"
                    } disabled:opacity-50`}
                  >
                    {checked ? "✓" : "□"}
                  </button>
                </div>
              );
            })
          )}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={() => moveDay(-1)}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-800 text-slate-200 hover:bg-slate-700"
            aria-label="Previous day"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex gap-1">
            {weekDates.map((date, i) => (
              <span
                key={isoDate(date)}
                className={`h-2 w-2 rounded-full ${i === dayIndex ? "bg-sky-400" : "bg-slate-600"}`}
              />
            ))}
          </div>
          <button
            onClick={() => moveDay(1)}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-800 text-slate-200 hover:bg-slate-700"
            aria-label="Next day"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-4 text-center text-xs text-slate-500">Swipe left/right to change day • Ticks save automatically</p>
      </div>
    </div>
  );
}
