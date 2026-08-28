"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ArrowLeft, LockKeyhole } from "lucide-react";
import { OPENING_TASKS, WEEK_DAYS, addIsoDays, londonDateISO } from "@/lib/opening-checks";

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

type MobileOpeningChecksProps = {
  onBack?: () => void;
};

function mondayOfIso(dateString: string) {
  const date = new Date(`${dateString}T12:00:00Z`);
  const day = date.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setUTCDate(date.getUTCDate() + diff);
  return date.toISOString().slice(0, 10);
}

export function MobileOpeningChecks({ onBack }: MobileOpeningChecksProps) {
  const [today, setToday] = useState(() => londonDateISO());
  const [selectedDate, setSelectedDate] = useState(() => londonDateISO());
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [slideDirection, setSlideDirection] = useState<"left" | "right" | null>(null);
  const [animating, setAnimating] = useState(false);

  const weekStart = useMemo(() => mondayOfIso(selectedDate), [selectedDate]);
  const weekDates = useMemo(() => WEEK_DAYS.map((_, index) => addIsoDays(weekStart, index)), [weekStart]);
  const selected = new Date(`${selectedDate}T12:00:00Z`);
  const rawDay = selected.getUTCDay();
  const dayIndex = rawDay === 0 ? 6 : rawDay - 1;
  const dayLabel = WEEK_DAYS[dayIndex];
  const isToday = selectedDate === today;
  const canMoveForward = selectedDate < today;

  // If the screen remains open across midnight, automatically move to the new
  // UK business day so staff always receive a fresh daily checklist.
  useEffect(() => {
    const timer = window.setInterval(() => {
      const nextToday = londonDateISO();
      if (nextToday !== today) {
        setToday(nextToday);
        setSelectedDate(nextToday);
      }
    }, 30_000);
    return () => window.clearInterval(timer);
  }, [today]);

  useEffect(() => {
    loadWeek();
  }, [weekStart, today]);

  async function loadWeek() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/weekly-checks?type=opening&weekStart=${weekStart}`, { cache: "no-store" });
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
    if (!isToday) return;

    const taskKey = `task-${taskIndex + 1}`;
    const key = `${taskKey}|${selectedDate}`;
    const nextValue = !completed[key];
    setCompleted((prev) => ({ ...prev, [key]: nextValue }));
    setSavingKey(key);
    setError(null);

    try {
      const res = await fetch("/api/weekly-checks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkType: "opening", taskKey, checkDate: selectedDate, completed: nextValue }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error || "Failed to save check");
      }
    } catch (err: any) {
      setCompleted((prev) => ({ ...prev, [key]: !nextValue }));
      setError(err.message || "Failed to save check");
    } finally {
      setSavingKey(null);
    }
  }

  function moveDay(direction: 1 | -1) {
    if (animating) return;
    const nextDate = addIsoDays(selectedDate, direction);
    if (nextDate > today) return;

    setSlideDirection(direction === 1 ? "left" : "right");
    setAnimating(true);
    setSelectedDate(nextDate);
    window.setTimeout(() => {
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
    window.location.href = "/";
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden bg-slate-950 text-slate-100" style={{ scrollbarWidth: "none" }}>
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

        <div className="mb-4 grid grid-cols-[44px_1fr_44px] items-center gap-2">
          <button
            type="button"
            onClick={() => moveDay(-1)}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-800 text-slate-100 hover:bg-slate-700 active:scale-95"
            aria-label="Previous day"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <div className="text-center">
            <div className="text-2xl font-extrabold uppercase tracking-wide">{dayLabel}</div>
            <div className="text-sm text-slate-400">
              {selected.toLocaleDateString("en-GB", {
                timeZone: "Europe/London",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={() => moveDay(1)}
            disabled={!canMoveForward}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-800 text-slate-100 hover:bg-slate-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Next day"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>

        <div className={`mb-4 rounded-xl px-3 py-2 text-center text-xs font-semibold ${
          isToday
            ? "bg-emerald-950/70 text-emerald-300"
            : "flex items-center justify-center gap-2 bg-slate-800 text-slate-300"
        }`}>
          {isToday ? (
            "TODAY • Ready for staff opening checks"
          ) : (
            <><LockKeyhole className="h-4 w-4" /> Closed day • Read only</>
          )}
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
                    disabled={!isToday || savingKey === key}
                    onClick={() => toggle(index)}
                    aria-label={`${task} ${dayLabel}`}
                    className={`ml-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 text-lg font-black transition ${
                      checked
                        ? "border-emerald-300 bg-emerald-500 text-white"
                        : "border-white/60 bg-slate-900/70 text-transparent"
                    } disabled:cursor-not-allowed disabled:opacity-70`}
                  >
                    {checked ? "✓" : "□"}
                  </button>
                </div>
              );
            })
          )}
        </div>

        <div className="mt-5 flex items-center justify-center gap-1">
          {weekDates.map((date, index) => (
            <span
              key={date}
              className={`h-2 w-2 rounded-full ${index === dayIndex ? "bg-sky-400" : "bg-slate-600"}`}
            />
          ))}
        </div>

        <p className="mt-3 text-center text-xs text-slate-500">
          Swipe left/right or use ‹ › • Only today can be edited • Saves automatically
        </p>
      </div>
    </div>
  );
}
