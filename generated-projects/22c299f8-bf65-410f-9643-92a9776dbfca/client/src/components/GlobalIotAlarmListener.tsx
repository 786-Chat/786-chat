import { useEffect, useMemo, useRef, useState } from "react";
import { BellRing, CheckCircle2, Volume2, VolumeX } from "lucide-react";
import { useLocation } from "wouter";

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

const ACK_STORAGE_KEY = "food-safety-iot-acknowledged-alarms-v1";

function alarmKey(device: AlarmDevice) {
  return `${device.id}:${device.lastAlarmAt || "active"}`;
}

function readAcknowledgedKeys() {
  try {
    const value = JSON.parse(window.localStorage.getItem(ACK_STORAGE_KEY) || "[]");
    return new Set<string>(Array.isArray(value) ? value.map(String) : []);
  } catch (_) {
    return new Set<string>();
  }
}

function createAlarmTone(ctx: AudioContext) {
  const now = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.38, now + 0.03);
  master.gain.setValueAtTime(0.38, now + 1.15);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 1.35);
  master.connect(ctx.destination);

  [0, 0.34, 0.68, 1.02].forEach((offset, index) => {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = "square";
    oscillator.frequency.setValueAtTime(index % 2 === 0 ? 880 : 660, now + offset);
    gain.gain.setValueAtTime(0.0001, now + offset);
    gain.gain.exponentialRampToValueAtTime(0.24, now + offset + 0.02);
    gain.gain.setValueAtTime(0.24, now + offset + 0.22);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.30);
    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start(now + offset);
    oscillator.stop(now + offset + 0.31);
  });
}

export default function GlobalIotAlarmListener() {
  const [path] = useLocation();
  const mode = useMemo<"admin" | "branch" | null>(() => {
    if (path === "/admin-dashboard") return "admin";
    if (path === "/branch-dashboard") return "branch";
    return null;
  }, [path]);

  const [alarms, setAlarms] = useState<AlarmDevice[]>([]);
  const [soundMuted, setSoundMuted] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const acknowledgedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    acknowledgedRef.current = readAcknowledgedKeys();

    const syncStoppedAlarms = () => {
      acknowledgedRef.current = readAcknowledgedKeys();
      setSoundMuted(true);
      setAlarms((current) => current.filter((device) => !acknowledgedRef.current.has(alarmKey(device))));
    };

    window.addEventListener("food-safety-alarm-stopped", syncStoppedAlarms);
    return () => window.removeEventListener("food-safety-alarm-stopped", syncStoppedAlarms);
  }, []);

  useEffect(() => {
    const unlockAudio = async () => {
      try {
        const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextCtor) return;
        const ctx = audioContextRef.current || new AudioContextCtor();
        audioContextRef.current = ctx;
        if (ctx.state === "suspended") await ctx.resume();

        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        gain.gain.value = 0.0001;
        oscillator.connect(gain);
        gain.connect(ctx.destination);
        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.02);

        setAudioReady(ctx.state === "running");
      } catch (_) {}
    };

    const resumeAudio = () => {
      const ctx = audioContextRef.current;
      if (ctx?.state === "suspended") {
        void ctx.resume().then(() => setAudioReady(ctx.state === "running")).catch(() => {});
      }
    };

    window.addEventListener("pointerdown", unlockAudio);
    window.addEventListener("keydown", unlockAudio);
    window.addEventListener("touchstart", unlockAudio, { passive: true });
    window.addEventListener("focus", resumeAudio);
    document.addEventListener("visibilitychange", resumeAudio);

    return () => {
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
      window.removeEventListener("touchstart", unlockAudio);
      window.removeEventListener("focus", resumeAudio);
      document.removeEventListener("visibilitychange", resumeAudio);
    };
  }, []);

  useEffect(() => {
    if (!mode) return;
    let cancelled = false;
    const endpoint = mode === "admin" ? "/api/iot/alarms?refresh=1" : "/api/branch/iot-alarms?refresh=1";

    const poll = async () => {
      try {
        const response = await fetch(endpoint, { credentials: "include", cache: "no-store" });
        if (!response.ok) return;
        const data = await response.json();
        if (cancelled) return;

        acknowledgedRef.current = readAcknowledgedKeys();
        const raw = (Array.isArray(data) ? data : []) as AlarmDevice[];
        const next = raw.filter((device) => !acknowledgedRef.current.has(alarmKey(device)));
        setAlarms(next);
        if (next.length > 0) setSoundMuted(false);
      } catch (_) {}
    };

    void poll();
    const timer = window.setInterval(() => void poll(), 12000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [mode]);

  useEffect(() => {
    if (!mode || alarms.length === 0 || soundMuted || !audioReady) return;
    const play = async () => {
      const ctx = audioContextRef.current;
      if (!ctx) return;
      try {
        if (ctx.state === "suspended") await ctx.resume();
        if (ctx.state === "running") createAlarmTone(ctx);
      } catch (_) {}
    };
    void play();
    const timer = window.setInterval(() => void play(), 2600);
    return () => window.clearInterval(timer);
  }, [mode, alarms.length, soundMuted, audioReady]);

  if (!mode || alarms.length === 0) return null;

  const stopAlarm = () => {
    const acknowledged = acknowledgedRef.current;
    for (const device of alarms) acknowledged.add(alarmKey(device));
    try {
      window.localStorage.setItem(ACK_STORAGE_KEY, JSON.stringify([...acknowledged]));
    } catch (_) {}
    setSoundMuted(true);
    setAlarms([]);
    window.dispatchEvent(new CustomEvent("food-safety-alarm-stopped"));
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
            <h3 className="text-base font-bold text-white sm:text-lg">Mouse caught</h3>
            <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-semibold text-red-200">CAUGHT</span>
          </div>
          <p className="mt-1 text-sm text-slate-200">
            {primary.deviceName || "Smart mouse device"} has reported a catch.
            {alarms.length > 1 ? ` ${alarms.length} devices currently show a catch.` : ""}
          </p>
          {primary.branchName && <p className="mt-1 text-xs text-slate-300">Branch: <span className="font-semibold text-white">{primary.branchName}</span></p>}
          {primary.notes && <p className="mt-1 text-xs text-slate-400">Location: {primary.notes}</p>}
          <p className="mt-2 text-xs text-slate-400">Stop the alarm here. The device remains marked Mouse Caught until the trap is physically reset and becomes Ready again.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={stopAlarm}
              className="inline-flex items-center gap-2 rounded-lg bg-red-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-400"
            >
              <VolumeX className="h-4 w-4" /> Stop Alarm
            </button>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent("food-safety-open-smart-devices"))}
              className="inline-flex items-center gap-2 rounded-lg border border-blue-500/50 bg-blue-500/10 px-3 py-2 text-sm font-medium text-blue-100 transition hover:bg-blue-500/20"
            >
              Open Smart Devices
            </button>
            <button
              onClick={async () => {
                if (!audioReady) {
                  try {
                    const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
                    const ctx = audioContextRef.current || new AudioContextCtor();
                    audioContextRef.current = ctx;
                    if (ctx.state === "suspended") await ctx.resume();
                    setAudioReady(ctx.state === "running");
                    if (ctx.state === "running") createAlarmTone(ctx);
                  } catch (_) {}
                  return;
                }
                setSoundMuted((value) => !value);
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
            >
              {soundMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              {soundMuted ? "Sound muted" : audioReady ? "Alarm sound on" : "Enable alarm sound"}
            </button>
          </div>
        </div>
        <CheckCircle2 className="mt-1 h-5 w-5 flex-shrink-0 text-emerald-400" />
      </div>
    </div>
  );
}
