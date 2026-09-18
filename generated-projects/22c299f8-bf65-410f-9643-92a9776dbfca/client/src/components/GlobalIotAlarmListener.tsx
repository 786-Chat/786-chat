
import { useEffect, useMemo, useRef, useState } from "react";
import { BellRing, CheckCircle2, Volume2, VolumeX } from "lucide-react";

interface AlarmDevice {
  id: string;
  deviceId: string;
  deviceName: string;
  branchId?: string;
  branchName?: string;
  notes?: string;
  alarmActive?: boolean;
  lastAlarmAt?: string;
}

function createChime(ctx: AudioContext) {
  const now = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.22, now + 0.03);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);
  master.connect(ctx.destination);

  const notes = [659.25, 783.99, 987.77];
  notes.forEach((frequency, index) => {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = index === 0 ? "sine" : "triangle";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, now + index * 0.16);
    gain.gain.exponentialRampToValueAtTime(0.24, now + index * 0.16 + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.16 + 0.36);
    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start(now + index * 0.16);
    oscillator.stop(now + index * 0.16 + 0.42);
  });
}

export default function GlobalIotAlarmListener() {
  const path = typeof window !== "undefined" ? window.location.pathname : "";
  const mode = useMemo<"admin" | "branch" | null>(() => {
    if (path === "/admin-dashboard") return "admin";
    if (path === "/branch-dashboard") return "branch";
    return null;
  }, [path]);

  const [alarms, setAlarms] = useState<AlarmDevice[]>([]);
  const [soundMuted, setSoundMuted] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!mode) return;
    const unlockAudio = async () => {
      try {
        const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextCtor) return;
        const ctx = audioContextRef.current || new AudioContextCtor();
        audioContextRef.current = ctx;
        if (ctx.state === "suspended") await ctx.resume();
        setAudioReady(true);
      } catch (_) {}
    };
    window.addEventListener("pointerdown", unlockAudio, { once: true });
    window.addEventListener("keydown", unlockAudio, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
    };
  }, [mode]);

  useEffect(() => {
    if (!mode) return;
    let cancelled = false;
    const endpoint = mode === "admin" ? "/api/iot/alarms?refresh=1" : "/api/branch/iot-alarms?refresh=1";

    const poll = async () => {
      try {
        const response = await fetch(endpoint, { credentials: "include", cache: "no-store" });
        if (!response.ok) return;
        const data = await response.json();
        if (!cancelled) {
          const next = Array.isArray(data) ? data : [];
          setAlarms(next);
          if (next.length === 0) setSoundMuted(false);
        }
      } catch (_) {}
    };

    poll();
    const timer = window.setInterval(poll, 12000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [mode]);

  useEffect(() => {
    if (!mode || alarms.length === 0 || soundMuted || !audioReady) return;
    const play = () => {
      const ctx = audioContextRef.current;
      if (!ctx) return;
      if (ctx.state === "suspended") ctx.resume().catch(() => {});
      createChime(ctx);
    };
    play();
    const timer = window.setInterval(play, 2200);
    return () => window.clearInterval(timer);
  }, [mode, alarms.length, soundMuted, audioReady]);

  if (!mode || alarms.length === 0) return null;

  const acknowledge = async () => {
    setSoundMuted(true);
    await Promise.all(
      alarms.map(async (device) => {
        const endpoint = mode === "admin"
          ? `/api/iot/devices/${device.id}/clear-alarm`
          : `/api/branch/iot-devices/${device.id}/clear-alarm`;
        try {
          await fetch(endpoint, { method: "POST", credentials: "include" });
        } catch (_) {}
      })
    );
    setAlarms([]);
  };

  const primary = alarms[0];
  return (
    <div className="fixed inset-x-3 top-3 z-[9999] mx-auto max-w-2xl rounded-2xl border border-red-400/70 bg-slate-950/95 p-4 shadow-2xl shadow-red-950/50 backdrop-blur-xl sm:p-5">
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-red-500/20 ring-1 ring-red-400/40">
          <BellRing className="h-6 w-6 animate-pulse text-red-300" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-bold text-white sm:text-lg">Pest trap alert</h3>
            <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-semibold text-red-200">ACTION REQUIRED</span>
          </div>
          <p className="mt-1 text-sm text-slate-200">
            {primary.deviceName || "Smart pest-control device"} has reported a trap/shock event.
            {alarms.length > 1 ? ` ${alarms.length} devices currently need attention.` : ""}
          </p>
          {primary.branchName && <p className="mt-1 text-xs text-slate-300">Branch: <span className="font-semibold text-white">{primary.branchName}</span></p>}
          {primary.notes && <p className="mt-1 text-xs text-slate-400">Location: {primary.notes}</p>}
          <p className="mt-2 text-xs text-slate-400">Check the trap, remove the pest safely, clean/reset the device, then return it to service.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={acknowledge}
              className="inline-flex items-center gap-2 rounded-lg bg-red-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-400"
            >
              <VolumeX className="h-4 w-4" /> Stop alarm & acknowledge
            </button>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent("food-safety-open-smart-devices"))}
              className="inline-flex items-center gap-2 rounded-lg border border-blue-500/50 bg-blue-500/10 px-3 py-2 text-sm font-medium text-blue-100 transition hover:bg-blue-500/20"
            >
              Open Smart Devices
            </button>
            <button
              onClick={() => setSoundMuted((value) => !value)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
            >
              {soundMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              {soundMuted ? "Sound muted" : audioReady ? "Alarm sound on" : "Tap page once to enable sound"}
            </button>
          </div>
        </div>
        <CheckCircle2 className="mt-1 h-5 w-5 flex-shrink-0 text-emerald-400" />
      </div>
    </div>
  );
}
