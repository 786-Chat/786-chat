import { useEffect, useRef, useState, useCallback } from "react";

type Status = "disconnected" | "connecting" | "registered" | "failed";
type CallState = "idle" | "calling" | "ringing" | "connected" | "ended";

export interface SipConfig {
  wsUrl: string;
  domain: string;
  extension: string;
  password: string;
  stunServer?: string;
}

export interface UseSipPhone {
  status: Status;
  callState: CallState;
  error: string | null;
  call: (number: string) => void;
  hangup: () => void;
  toggleMute: () => void;
  toggleHold: () => void;
  sendDtmf: (digit: string) => void;
  muted: boolean;
  holding: boolean;
  remoteAudioRef: React.RefObject<HTMLAudioElement | null>;
}

export function useSipPhone(config: SipConfig | null, enabled: boolean): UseSipPhone {
  const [status, setStatus] = useState<Status>("disconnected");
  const [callState, setCallState] = useState<CallState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [holding, setHolding] = useState(false);
  const uaRef = useRef<any>(null);
  const sessionRef = useRef<any>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!enabled || !config?.wsUrl || !config?.extension || !config?.password) {
      setStatus("disconnected");
      return;
    }
    let cancelled = false;
    setStatus("connecting");
    setError(null);

    (async () => {
      try {
        const JsSIP: any = (await import("jssip")).default || (await import("jssip"));
        if (cancelled) return;
        const socket = new JsSIP.WebSocketInterface(config.wsUrl);
        const ua = new JsSIP.UA({
          sockets: [socket],
          uri: `sip:${config.extension}@${config.domain}`,
          password: config.password,
          register: true,
          session_timers: false,
        });
        uaRef.current = ua;

        ua.on("registered", () => setStatus("registered"));
        ua.on("unregistered", () => setStatus("disconnected"));
        ua.on("registrationFailed", (e: any) => {
          setStatus("failed");
          setError(e?.cause || "Registration failed");
        });
        ua.on("disconnected", () => setStatus("disconnected"));

        ua.on("newRTCSession", (data: any) => {
          const session = data.session;
          sessionRef.current = session;
          setCallState(session.direction === "incoming" ? "ringing" : "calling");

          session.on("progress", () => setCallState("ringing"));
          session.on("accepted", () => setCallState("connected"));
          session.on("confirmed", () => setCallState("connected"));
          session.on("ended", () => { setCallState("ended"); sessionRef.current = null; setMuted(false); setHolding(false); });
          session.on("failed", (e: any) => {
            setError(e?.cause || "Call failed");
            setCallState("ended");
            sessionRef.current = null;
            setMuted(false);
            setHolding(false);
          });

          // Attach remote audio
          session.connection?.addEventListener?.("track", (ev: RTCTrackEvent) => {
            if (remoteAudioRef.current && ev.streams?.[0]) {
              remoteAudioRef.current.srcObject = ev.streams[0];
              remoteAudioRef.current.play().catch(() => {});
            }
          });
        });

        ua.start();
      } catch (e: any) {
        setError(e.message || "SIP init failed");
        setStatus("failed");
      }
    })();

    return () => {
      cancelled = true;
      try { sessionRef.current?.terminate?.(); } catch {}
      try { uaRef.current?.stop?.(); } catch {}
      sessionRef.current = null;
      uaRef.current = null;
    };
  }, [enabled, config?.wsUrl, config?.domain, config?.extension, config?.password]);

  const call = useCallback((number: string) => {
    if (!uaRef.current || status !== "registered") {
      setError("Phone not registered");
      return;
    }
    setError(null);
    const target = `sip:${number}@${config!.domain}`;
    const opts = {
      mediaConstraints: { audio: true, video: false },
      pcConfig: { iceServers: [{ urls: config?.stunServer || "stun:stun.l.google.com:19302" }] },
    };
    try {
      uaRef.current.call(target, opts);
    } catch (e: any) {
      setError(e.message);
    }
  }, [config, status]);

  const hangup = useCallback(() => {
    try { sessionRef.current?.terminate?.(); } catch {}
    sessionRef.current = null;
    setCallState("idle");
  }, []);

  const toggleMute = useCallback(() => {
    if (!sessionRef.current) return;
    if (muted) sessionRef.current.unmute({ audio: true }); else sessionRef.current.mute({ audio: true });
    setMuted(m => !m);
  }, [muted]);

  const toggleHold = useCallback(() => {
    if (!sessionRef.current) return;
    if (holding) sessionRef.current.unhold(); else sessionRef.current.hold();
    setHolding(h => !h);
  }, [holding]);

  const sendDtmf = useCallback((digit: string) => {
    try { sessionRef.current?.sendDTMF?.(digit); } catch {}
  }, []);

  return { status, callState, error, call, hangup, toggleMute, toggleHold, sendDtmf, muted, holding, remoteAudioRef };
}
