import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Phone, PhoneOff, PhoneCall, PhoneIncoming, Mic, MicOff, Loader2, X, ChevronDown, ChevronUp, Settings, Circle } from "lucide-react";
import * as JsSIP from "jssip";

export default function Link24PhoneWebphone() {
  const { data: server } = useQuery<any>({ queryKey: ["/api/pbx/server"] });
  // Show the JsSIP Beta dialer (collapsed by default with audio warning)
  const showBeta = true;

  const PROVIDERS: Record<string, { wsUrl: string; sipDomain: string; label: string }> = {
    voipfone: { wsUrl: "wss://webrtc.voipfone.co.uk:7443/ws", sipDomain: "sip.voipfone.net", label: "VoIPfone WebRTC (Recommended)" },
    wave: { wsUrl: "wss://ofye4vuaak.a.gdms.cloud/ws", sipDomain: "ofye4vuaak.a.gdms.cloud", label: "Wave Cloud (Grandstream proprietary — may not work in browser)" },
    zadarma: { wsUrl: "wss://wss.zadarma.com:443", sipDomain: "pbx.zadarma.com", label: "Zadarma Cloud (PBX)" },
    myucm: { wsUrl: "wss://voip.link24.cloud/ws", sipDomain: "voip.link24.cloud", label: "Link24 Cloud PBX (UCM6302)" },
    custom: { wsUrl: "", sipDomain: "", label: "Custom / Other" },
  };

  const savedProvider = localStorage.getItem("webphone_provider") || "myucm";
  const initialProvider = PROVIDERS[savedProvider] ? savedProvider : "myucm";
  const [provider, setProvider] = useState<string>(initialProvider);
  const [extension, setExtension] = useState(localStorage.getItem("webphone_ext") || "1001");
  const [password, setPassword] = useState(localStorage.getItem("webphone_pw") || "");
  // For non-custom providers, ALWAYS use the fresh preset (not stale localStorage values)
  const [wsUrl, setWsUrl] = useState(
    initialProvider === "custom"
      ? (localStorage.getItem("webphone_ws") || "")
      : PROVIDERS[initialProvider].wsUrl
  );
  const [sipDomain, setSipDomain] = useState(
    initialProvider === "custom"
      ? (localStorage.getItem("webphone_domain") || "")
      : PROVIDERS[initialProvider].sipDomain
  );

  const [status, setStatus] = useState<"idle" | "connecting" | "registered" | "failed">("idle");
  const [error, setError] = useState<string>("");
  const [callState, setCallState] = useState<"none" | "ringing" | "incoming" | "in-call">("none");
  const [callerInfo, setCallerInfo] = useState<string>("");
  const [dialNumber, setDialNumber] = useState("");
  const [muted, setMuted] = useState(false);
  const [recording, setRecording] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [rtpStats, setRtpStats] = useState<{ inKbps: number; outKbps: number; inTotal: number; outTotal: number; ice: string }>({ inKbps: 0, outKbps: 0, inTotal: 0, outTotal: 0, ice: "—" });
  const [audioBlocked, setAudioBlocked] = useState(false);

  const uaRef = useRef<any>(null);
  const sessionRef = useRef<any>(null);
  const acceptedRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ringRef = useRef<HTMLAudioElement | null>(null);
  const durationTimerRef = useRef<any>(null);
  const ringCtxRef = useRef<AudioContext | null>(null);
  const ringTimerRef = useRef<any>(null);

  async function startRing() {
    try {
      const el = ringRef.current;
      if (el) {
        el.loop = true;
        el.volume = 1.0;
        el.currentTime = 0;
        await el.play();
        console.log("[Webphone] ringtone (file) playing");
        return;
      }
    } catch (e) {
      console.warn("[Webphone] file ring failed, falling back to oscillator:", e);
    }
    try {
      if (!ringCtxRef.current) {
        ringCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = ringCtxRef.current;
      if (ctx.state === "suspended") {
        try { await ctx.resume(); } catch {}
      }
      const playBurst = () => {
        const t0 = ctx.currentTime + 0.02;
        const gain = ctx.createGain();
        const VOL = 0.7;
        gain.gain.setValueAtTime(0, t0);
        gain.gain.linearRampToValueAtTime(VOL, t0 + 0.02);
        gain.gain.setValueAtTime(VOL, t0 + 0.38);
        gain.gain.linearRampToValueAtTime(0, t0 + 0.4);
        gain.gain.setValueAtTime(0, t0 + 0.6);
        gain.gain.linearRampToValueAtTime(VOL, t0 + 0.62);
        gain.gain.setValueAtTime(VOL, t0 + 0.98);
        gain.gain.linearRampToValueAtTime(0, t0 + 1.0);
        const o1 = ctx.createOscillator(); o1.frequency.value = 400; o1.type = "sine";
        const o2 = ctx.createOscillator(); o2.frequency.value = 450; o2.type = "sine";
        o1.connect(gain); o2.connect(gain); gain.connect(ctx.destination);
        o1.start(t0); o2.start(t0); o1.stop(t0 + 1.05); o2.stop(t0 + 1.05);
        o1.onended = () => { try { gain.disconnect(); } catch {} };
      };
      console.log("[Webphone] startRing oscillator, ctx state:", ctx.state);
      playBurst();
      ringTimerRef.current = setInterval(playBurst, 3000);
    } catch (e) {
      console.warn("[Webphone] ring start failed:", e);
    }
  }

  function stopRing() {
    try {
      const el = ringRef.current;
      if (el) { el.pause(); el.currentTime = 0; }
    } catch {}
    if (ringTimerRef.current) { clearInterval(ringTimerRef.current); ringTimerRef.current = null; }
  }

  // Triggers the browser microphone permission prompt ONCE per page load so the user
  // doesn't get interrupted by it mid-call. We immediately stop the tracks because we
  // only need the permission grant — JsSIP will request fresh tracks when answering.
  const micPrimedRef = useRef(false);
  async function primeMicPermission() {
    if (micPrimedRef.current) return;
    if (!navigator.mediaDevices?.getUserMedia) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      micPrimedRef.current = true;
      console.log("[Webphone] Microphone permission primed");
    } catch (err) {
      console.warn("[Webphone] Could not prime mic permission (user must allow on first call):", err);
    }
  }

  // Apply provider preset when provider changes (unless user has custom saved values)
  function applyProvider(p: string) {
    setProvider(p);
    localStorage.setItem("webphone_provider", p);
    if (p !== "custom" && PROVIDERS[p]) {
      setWsUrl(PROVIDERS[p].wsUrl);
      setSipDomain(PROVIDERS[p].sipDomain);
      localStorage.setItem("webphone_ws", PROVIDERS[p].wsUrl);
      localStorage.setItem("webphone_domain", PROVIDERS[p].sipDomain);
    }
  }

  // Cleanup
  useEffect(() => () => {
    try { uaRef.current?.stop(); } catch {}
    if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    stopRing();
    try { ringCtxRef.current?.close(); } catch {}
    ringCtxRef.current = null;
  }, []);

  function register() {
    setError("");
    if (!extension || !password || !wsUrl || !sipDomain) {
      setError("Fill in extension, password, WS URL, and SIP domain.");
      return;
    }
    localStorage.setItem("webphone_ext", extension);
    localStorage.setItem("webphone_pw", password);
    localStorage.setItem("webphone_ws", wsUrl);
    localStorage.setItem("webphone_domain", sipDomain);
    localStorage.setItem("webphone_provider", provider);

    setStatus("connecting");
    try {
      try {
        if (!ringCtxRef.current) {
          ringCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (ringCtxRef.current.state === "suspended") {
          ringCtxRef.current.resume().catch(() => {});
        }
      } catch {}
      // Prime audio elements during user gesture (Sign In click) so mobile browsers
      // allow programmatic .play() later when an incoming call arrives in background.
      try {
        const r = ringRef.current;
        if (r) {
          r.muted = true;
          const p = r.play();
          if (p && typeof p.then === "function") {
            p.then(() => { try { r.pause(); r.currentTime = 0; r.muted = false; } catch {} })
             .catch(() => { try { r.muted = false; } catch {} });
          }
        }
        const a = audioRef.current;
        if (a) {
          a.muted = true;
          const p2 = a.play();
          if (p2 && typeof p2.then === "function") {
            p2.then(() => { try { a.pause(); a.muted = false; } catch {} })
              .catch(() => { try { a.muted = false; } catch {} });
          }
        }
      } catch {}
      const socket = new (JsSIP as any).WebSocketInterface(wsUrl);
      // Some providers (e.g. VoIPfone) use `*` in the SIP user which isn't valid in a URI user-part.
      // Encode the URI user but pass the raw extension as the auth user so REGISTER/INVITE auth works.
      const uriUser = encodeURIComponent(extension);
      const ua = new (JsSIP as any).UA({
        sockets: [socket],
        uri: `sip:${uriUser}@${sipDomain}`,
        authorization_user: extension,
        registrar_server: `sip:${sipDomain}`,
        password,
        display_name: `Link24 ${extension}`,
        register: true,
        register_expires: 60,
        session_timers: false,
        connection_recovery_min_interval: 2,
        connection_recovery_max_interval: 10,
        use_preloaded_route: false,
        keepAliveInterval: 15,
      });
      uaRef.current = ua;

      ua.on("registered", () => {
        setStatus("registered");
        setError("");
        // Prime mic permission ONCE per session so future Answer taps don't trigger the
        // browser popup mid-call. Some browsers (esp. iOS Safari) only remember the grant
        // for the lifetime of the page, so we re-prime on every successful registration.
        primeMicPermission();
      });
      ua.on("unregistered", () => setStatus("idle"));
      ua.on("registrationFailed", (e: any) => {
        setStatus("failed");
        setError(`Registration failed: ${e?.cause || "check credentials & UCM extension exists"}`);
      });
      ua.on("disconnected", () => { if (status === "registered") setStatus("connecting"); });

      ua.on("newRTCSession", (data: any) => {
        const session = data.session;
        sessionRef.current = session;

        if (session.direction === "incoming") {
          setCallState("incoming");
          setCallerInfo(session.remote_identity?.uri?.user || "Unknown");
          startRing();
        } else {
          setCallState("ringing");
        }

        // Robust pc-acquisition: poll session.connection in case the
        // `peerconnection` event fired before our listener attached
        // (this happens for outbound calls in some JsSIP versions).
        let pcAttached = false;
        const attachPc = (pc: RTCPeerConnection) => {
          if (pcAttached) return;
          pcAttached = true;
          console.log("[Webphone] pc acquired via", (session as any).connection === pc ? "polling" : "event");
          try { setRtpStats((s) => ({ ...s, ice: pc.iceConnectionState || "new" })); } catch {}
          // Immediate, ICE-independent stats poll so user sees real numbers
          let lastIn0 = 0, lastOut0 = 0;
          const earlyStatsTimer = setInterval(async () => {
            if (pc.connectionState === "closed" || pc.connectionState === "failed") { clearInterval(earlyStatsTimer); return; }
            try {
              const stats = await pc.getStats();
              let inboundBytes = 0, outboundBytes = 0;
              stats.forEach((s: any) => {
                if (s.type === "inbound-rtp" && s.kind === "audio") inboundBytes += s.bytesReceived || 0;
                if (s.type === "outbound-rtp" && s.kind === "audio") outboundBytes += s.bytesSent || 0;
              });
              const dIn = inboundBytes - lastIn0;
              const dOut = outboundBytes - lastOut0;
              setRtpStats((s) => ({
                ...s,
                inKbps: Math.round((dIn * 8) / 2000),
                outKbps: Math.round((dOut * 8) / 2000),
                inTotal: inboundBytes,
                outTotal: outboundBytes,
                ice: pc.iceConnectionState || s.ice,
              }));
              lastIn0 = inboundBytes; lastOut0 = outboundBytes;
            } catch {}
          }, 2000);
          const bindStream = (stream: MediaStream) => {
            const el = audioRef.current;
            if (!el) return;
            el.srcObject = stream;
            el.muted = false; el.volume = 1.0; (el as any).playsInline = true;
            el.play()
              .then(() => { setAudioBlocked(false); console.log("[Webphone] audio playing"); })
              .catch((err) => {
                console.error("[Webphone] audio.play() blocked by browser:", err?.name, err?.message);
                setAudioBlocked(true);
                const resume = () => {
                  el.play()
                    .then(() => { setAudioBlocked(false); document.removeEventListener("click", resume); document.removeEventListener("touchstart", resume); })
                    .catch(() => {});
                };
                document.addEventListener("click", resume);
                document.addEventListener("touchstart", resume);
              });
          };
          // Bind from any existing receivers immediately — covers the case
          // where the `track` event already fired before our listener attached.
          try {
            const recvs = pc.getReceivers?.() || [];
            for (const r of recvs) {
              if (r.track && r.track.kind === "audio") { bindStream(new MediaStream([r.track])); break; }
            }
          } catch {}
          pc.addEventListener("track", (te: any) => {
            console.log("[Webphone] track:", te.track?.kind, "streams:", te.streams?.length);
            if (te.track?.kind !== "audio") return;
            bindStream(te.streams?.[0] || new MediaStream([te.track]));
          });
          pc.addEventListener("iceconnectionstatechange", () => {
            console.log("[Webphone] ICE:", pc.iceConnectionState);
            setRtpStats((s) => ({ ...s, ice: pc.iceConnectionState }));
            if (pc.iceConnectionState === "failed") setError("ICE failed — TURN/firewall blocking media.");
            if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {
              // Re-bind from receivers once ICE is up, in case the track event was missed
              setTimeout(() => {
                try {
                  const el = audioRef.current;
                  const recvs = pc.getReceivers?.() || [];
                  for (const r of recvs) {
                    if (r.track && r.track.kind === "audio") {
                      if (el && (!el.srcObject || (el.srcObject as MediaStream).getAudioTracks().length === 0)) {
                        bindStream(new MediaStream([r.track]));
                      }
                      break;
                    }
                  }
                } catch {}
              }, 300);
            }
          });
          pc.addEventListener("connectionstatechange", () => console.log("[Webphone] PC:", pc.connectionState));
          pc.addEventListener("icecandidateerror", (ev: any) => console.error("[Webphone] ICE cand err:", ev.errorCode, ev.errorText, ev.url));
        };
        // Fast poll for up to 8s
        const pollStart = Date.now();
        const pcPoll = setInterval(() => {
          const pc = (session as any).connection as RTCPeerConnection | undefined;
          if (pc) { clearInterval(pcPoll); attachPc(pc); }
          else if (Date.now() - pollStart > 8000) { clearInterval(pcPoll); console.warn("[Webphone] never got session.connection in 8s"); }
        }, 100);

        session.on("accepted", () => {
          acceptedRef.current = true;
          setCallState("in-call");
          stopRing();
          setCallDuration(0);
          durationTimerRef.current = setInterval(() => setCallDuration((d) => d + 1), 1000);
        });
        session.on("confirmed", () => {
          acceptedRef.current = true;
          if (callState !== "in-call") {
            setCallState("in-call");
            stopRing();
            if (!durationTimerRef.current) {
              setCallDuration(0);
              durationTimerRef.current = setInterval(() => setCallDuration((d) => d + 1), 1000);
            }
          }
        });
        session.on("ended", () => endCallCleanup());
        session.on("failed", (e: any) => {
          const code = e?.message?.status_code;
          const reason = e?.message?.reason_phrase;
          const cause = e?.cause || "unknown";
          if (acceptedRef.current) {
            console.warn("[Webphone] Ignoring stale 'failed' event after call was accepted:", { cause, code, reason });
            return;
          }
          const detail = code ? `${cause} — SIP ${code} ${reason || ""}` : cause;
          setError(`Call failed: ${detail}`);
          console.error("[Webphone] Call failed:", { cause, code, reason, fullMessage: e?.message, originator: e?.originator });
          endCallCleanup();
        });
        // JsSIP fires this event when it has a pc; attachPc is idempotent
        // and the polling above will also call it as a backup.
        session.on("peerconnection", (e: any) => attachPc(e.peerconnection));
        session.on("sdp", (data: any) => {
          console.log("[Webphone] SDP", data.originator, ":\n", data.sdp);
        });
        session.on("getusermediafailed", (err: any) => {
          console.error("[Webphone] getUserMedia failed:", err);
          setError(`Mic access failed: ${err?.name || err?.message || "denied"}`);
        });
        session.on("peerconnection:setremotedescriptionfailed", (err: any) => {
          console.error("[Webphone] setRemoteDescription failed:", err);
          setError(`Bad SDP from UCM: ${err?.message || "unknown"}`);
        });
        session.on("peerconnection:setlocaldescriptionfailed", (err: any) => {
          console.error("[Webphone] setLocalDescription failed:", err);
          setError(`Local SDP failed: ${err?.message || "unknown"}`);
        });
      });

      ua.start();
    } catch (e: any) {
      setStatus("failed");
      setError(e.message);
    }
  }

  function unregister() {
    try { uaRef.current?.stop(); } catch {}
    setStatus("idle");
  }

  function endCallCleanup() {
    setCallState("none");
    setCallerInfo("");
    setMuted(false);
    setRecording(false);
    setCallDuration(0);
    setRtpStats({ inKbps: 0, outKbps: 0, inTotal: 0, outTotal: 0, ice: "—" });
    setAudioBlocked(false);
    stopRing();
    if (durationTimerRef.current) { clearInterval(durationTimerRef.current); durationTimerRef.current = null; }
    sessionRef.current = null;
    acceptedRef.current = false;
  }

  // Fallback STUN-only config used if Cloudflare TURN fetch fails
  const FALLBACK_ICE_SERVERS = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun.cloudflare.com:3478" },
  ];

  // Fetch fresh short-lived Cloudflare TURN credentials from our backend.
  // Falls back to STUN-only if the endpoint fails so calls can still attempt.
  async function getIceServers(): Promise<any[]> {
    try {
      const r = await fetch("/api/pbx/turn-credentials");
      if (!r.ok) return FALLBACK_ICE_SERVERS;
      const data = await r.json();
      return data.iceServers && data.iceServers.length ? data.iceServers : FALLBACK_ICE_SERVERS;
    } catch {
      return FALLBACK_ICE_SERVERS;
    }
  }

  // Convert dialed number into a digit-only form that matches a UCM Asterisk
  // outbound route pattern like `_X.` (X = digit 0-9). UCM rejects with 603
  // Decline if no route matches, so we MUST NOT send a leading `+` to UCM.
  // Conventions: UK numbers → `0XXXXXXXXXX`, international → `00CCXXXXX...`.
  function normalizeNumber(raw: string): string {
    let n = raw.trim().replace(/[\s\-()]/g, "");
    // Internal extensions / feature codes — pass through unchanged
    if (/^\*?\d{2,5}#?$/.test(n)) return n;
    // Strip leading + and convert to UK national or 00 international format
    if (n.startsWith("+")) {
      const stripped = n.slice(1);
      if (stripped.startsWith("44")) return "0" + stripped.slice(2);
      return "00" + stripped;
    }
    // Already in 00 international form
    if (n.startsWith("00")) return n;
    // UK national form already (e.g. 07427742840)
    if (n.startsWith("0")) return n;
    // Bare digits 10+ — assume international, add 00 prefix (or convert 44 → 0)
    if (/^\d{10,}$/.test(n)) {
      if (n.startsWith("44")) return "0" + n.slice(2);
      return "00" + n;
    }
    return n;
  }

  async function makeCall(target?: string) {
    const raw = target || dialNumber;
    if (!raw || !uaRef.current || status !== "registered") return;
    const num = normalizeNumber(raw);
    console.log("[Webphone] dialing", raw, "→", num);
    const iceServers = await getIceServers();
    const opts = {
      mediaConstraints: { audio: true, video: false },
      pcConfig: { iceServers, iceTransportPolicy: "all" as RTCIceTransportPolicy },
    };
    uaRef.current.call(`sip:${num}@${sipDomain}`, opts);
  }

  async function answer() {
    const iceServers = await getIceServers();
    sessionRef.current?.answer({
      mediaConstraints: { audio: true, video: false },
      pcConfig: { iceServers, iceTransportPolicy: "all" as RTCIceTransportPolicy },
    });
  }
  function hangup() {
    try { sessionRef.current?.terminate(); } catch {}
    endCallCleanup();
  }
  function toggleMute() {
    if (!sessionRef.current) return;
    if (muted) sessionRef.current.unmute({ audio: true });
    else sessionRef.current.mute({ audio: true });
    setMuted(!muted);
  }
  function toggleRecording() {
    if (!sessionRef.current) return;
    try {
      // Grandstream UCM one-touch record feature code (configurable in UCM → Call Features → Feature Codes)
      const code = recording ? "*4" : "*3";
      const tones = code.split("");
      tones.forEach((t, i) => {
        setTimeout(() => {
          try { sessionRef.current?.sendDTMF(t, { duration: 160, interToneGap: 100 }); } catch {}
        }, i * 250);
      });
      setRecording(!recording);
    } catch (e: any) {
      setError("Could not toggle recording: " + (e?.message || ""));
    }
  }

  const fmtTime = (s: number) => `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;
  const dialpad = ["1","2","3","4","5","6","7","8","9","*","0","#"];

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 relative overflow-hidden flex items-center justify-center p-3 sm:p-6">
      <audio ref={audioRef} autoPlay />
      <audio ref={ringRef} loop preload="auto" src="/ringtone.wav" />

      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-blue-600/30 blur-3xl"/>
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-indigo-600/30 blur-3xl"/>
      <div className="pointer-events-none absolute top-1/3 right-1/4 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl"/>

      {/* Brand row (desktop) */}
      <div className="hidden md:flex absolute top-6 left-6 items-center gap-2 text-white/80">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center">
          <Phone className="h-4 w-4 text-white"/>
        </div>
        <div className="leading-tight">
          <div className="text-sm font-bold">Link24 Cloud Phone</div>
          <div className="text-[10px] text-white/50">Browser-based softphone</div>
        </div>
      </div>

      {/* Phone-frame wrapper (visible on md+) */}
      <div className="relative w-full max-w-sm md:max-w-[360px]">
        <div className="hidden md:block absolute -inset-3 rounded-[3rem] bg-gradient-to-br from-slate-800 to-slate-950 shadow-2xl shadow-black/60 ring-1 ring-white/10"/>
        <div className="hidden md:block absolute left-1/2 -translate-x-1/2 -top-1 w-24 h-5 rounded-b-2xl bg-slate-950 z-10"/>

      <Card className="relative z-20 w-full bg-slate-900/85 backdrop-blur border-slate-700 text-white md:rounded-[2.25rem] md:overflow-hidden md:shadow-xl md:mt-8">
        <CardHeader className="p-3 pb-2">
          <CardTitle className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5"><Phone className="h-4 w-4"/>Webphone (Beta) <span className="text-[10px] opacity-60" data-testid="text-build-tag">v6-mic-prime</span></span>
            <Badge className={
              status === "registered" ? "bg-emerald-600" :
              status === "connecting" ? "bg-amber-600" :
              status === "failed" ? "bg-rose-600" : "bg-slate-600"
            }>
              {status === "registered" ? "● Online" : status === "connecting" ? "Connecting..." : status === "failed" ? "Failed" : "Offline"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2.5 p-3 pt-0">
          {status !== "registered" ? (
            <>
              <div>
                <Label className="text-slate-300">Extension / Username</Label>
                <Input value={extension} onChange={(e) => setExtension(e.target.value)} placeholder={provider === "voipfone" ? "e.g. 30258306*201" : "e.g. 1001"} className="bg-slate-800 border-slate-700" data-testid="input-webphone-ext"/>
              </div>
              <div>
                <Label className="text-slate-300">SIP Password</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={provider === "voipfone" ? "VoIPfone extension password" : "From your admin"} className="bg-slate-800 border-slate-700" data-testid="input-webphone-pw"/>
              </div>
              {provider === "voipfone" && (
                <div className="text-[11px] text-blue-300 bg-blue-950/40 border border-blue-800/60 rounded p-2 leading-relaxed">
                  <strong>VoIPfone tip:</strong> Use the full username format <code className="text-amber-300">30258306*201</code> (account*extension). Get the password from VoIPfone → Services → Virtual PBX → PBX Extensions.
                </div>
              )}
              <button
                type="button"
                onClick={() => setShowAdvanced(s => !s)}
                className="w-full flex items-center justify-between text-[11px] text-slate-500 hover:text-slate-300 px-1 py-0.5"
                data-testid="button-toggle-advanced"
              >
                <span className="flex items-center gap-1.5"><Settings className="h-3 w-3"/> Trouble signing in?</span>
                {showAdvanced ? <ChevronUp className="h-3 w-3"/> : <ChevronDown className="h-3 w-3"/>}
              </button>
              {showAdvanced && (
                <div className="space-y-2 pl-1 border-l-2 border-slate-700 ml-1 py-1">
                  <div>
                    <Label className="text-slate-400 text-xs">Server</Label>
                    <select
                      value={provider}
                      onChange={(e) => applyProvider(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-white text-xs"
                      data-testid="select-provider"
                    >
                      {Object.entries(PROVIDERS).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </select>
                  </div>
                  {provider === "custom" && (
                    <>
                      <div>
                        <Label className="text-slate-400 text-xs">SIP Domain</Label>
                        <Input value={sipDomain} onChange={(e) => setSipDomain(e.target.value)} className="bg-slate-800 border-slate-700 font-mono text-xs h-8" data-testid="input-webphone-domain"/>
                      </div>
                      <div>
                        <Label className="text-slate-400 text-xs">WebSocket URL</Label>
                        <Input value={wsUrl} onChange={(e) => setWsUrl(e.target.value)} className="bg-slate-800 border-slate-700 font-mono text-xs h-8" data-testid="input-webphone-ws"/>
                      </div>
                    </>
                  )}
                </div>
              )}
              {error && <div className="text-sm text-rose-400 bg-rose-950/40 border border-rose-800 rounded p-2">{error}</div>}
              <Button onClick={register} disabled={status === "connecting"} className="w-full bg-emerald-600 hover:bg-emerald-700" data-testid="button-webphone-register">
                {status === "connecting" ? <Loader2 className="h-4 w-4 mr-2 animate-spin"/> : <Phone className="h-4 w-4 mr-2"/>}
                {status === "connecting" ? "Connecting..." : "Sign In"}
              </Button>
              <p className="text-[11px] text-slate-500 text-center">Need an extension? Contact your Link24 admin.</p>
            </>
          ) : (
            <>
              <div className="text-center text-sm text-slate-400">Logged in as <strong className="text-white">Ext {extension}</strong></div>

              {callState === "none" && (
                <>
                  <div className="bg-slate-800 rounded-lg p-3 text-center text-2xl font-mono tracking-widest min-h-[48px]" data-testid="text-dial-number">
                    {dialNumber || <span className="text-slate-500 text-base">Enter number...</span>}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {dialpad.map((d) => (
                      <Button key={d} variant="outline" onClick={() => setDialNumber(dialNumber + d)} className="h-14 text-xl bg-slate-800 hover:bg-slate-700 border-slate-700 text-white" data-testid={`button-dial-${d}`}>
                        {d}
                      </Button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setDialNumber(dialNumber.slice(0, -1))} className="flex-1 bg-slate-800 border-slate-700 text-white" data-testid="button-dial-back">⌫</Button>
                    <Button onClick={() => makeCall()} disabled={!dialNumber} className="flex-[2] bg-emerald-600 hover:bg-emerald-700 h-12" data-testid="button-make-call">
                      <PhoneCall className="h-5 w-5 mr-2"/>Call
                    </Button>
                  </div>
                  <div className="text-xs text-slate-400 text-center pt-2">
                    Try: <button className="underline mr-2" onClick={() => makeCall("*97")} data-testid="button-test-vm">*97 (voicemail)</button>
                    <button className="underline" onClick={() => makeCall("*65")} data-testid="button-test-echo">*65 (echo test)</button>
                  </div>
                </>
              )}

              {callState === "incoming" && (
                <div className="text-center space-y-4 py-4">
                  <PhoneIncoming className="h-16 w-16 mx-auto text-emerald-400 animate-bounce"/>
                  <div className="text-2xl font-bold">{callerInfo}</div>
                  <div className="text-slate-400">Incoming call...</div>
                  <div className="flex gap-2">
                    <Button onClick={hangup} className="flex-1 bg-rose-600 hover:bg-rose-700 h-14" data-testid="button-reject">
                      <PhoneOff className="h-5 w-5 mr-2"/>Reject
                    </Button>
                    <Button onClick={answer} className="flex-1 bg-emerald-600 hover:bg-emerald-700 h-14" data-testid="button-answer">
                      <Phone className="h-5 w-5 mr-2"/>Answer
                    </Button>
                  </div>
                </div>
              )}

              {callState === "ringing" && (
                <div className="text-center space-y-4 py-4">
                  <Loader2 className="h-16 w-16 mx-auto text-amber-400 animate-spin"/>
                  <div className="text-xl">Calling {dialNumber}...</div>
                  <Button onClick={hangup} className="w-full bg-rose-600 hover:bg-rose-700" data-testid="button-cancel-call">
                    <X className="h-5 w-5 mr-2"/>Cancel
                  </Button>
                </div>
              )}

              {callState === "in-call" && (
                <div className="text-center space-y-4 py-4">
                  <Phone className="h-16 w-16 mx-auto text-emerald-400"/>
                  <div className="text-2xl font-bold">{callerInfo || dialNumber}</div>
                  <div className="text-3xl font-mono text-emerald-400" data-testid="text-call-duration">{fmtTime(callDuration)}</div>

                  {audioBlocked && (
                    <button
                      type="button"
                      onClick={() => { audioRef.current?.play().then(() => setAudioBlocked(false)).catch(() => {}); }}
                      className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold py-3 rounded-lg animate-pulse text-sm"
                      data-testid="button-unblock-audio"
                    >
                      🔊 Tap to enable sound
                    </button>
                  )}

                  {/* Live audio diagnostic — shows whether RTP is flowing each direction */}
                  <div className="bg-slate-800/70 border border-slate-700 rounded-lg p-2 text-xs space-y-1" data-testid="panel-rtp-stats">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">⬇ Mobile → You</span>
                      <span className={rtpStats.inKbps > 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"} data-testid="text-rtp-in">
                        {rtpStats.inKbps > 0 ? `${rtpStats.inKbps} kbps ✓` : "0 kbps ✗ silent"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">⬆ You → Mobile</span>
                      <span className={rtpStats.outKbps > 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"} data-testid="text-rtp-out">
                        {rtpStats.outKbps > 0 ? `${rtpStats.outKbps} kbps ✓` : "0 kbps ✗ silent"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>ICE: {rtpStats.ice}</span>
                      <span>in {rtpStats.inTotal}B · out {rtpStats.outTotal}B</span>
                    </div>
                  </div>

                  {recording && (
                    <div className="flex items-center justify-center gap-2 text-rose-400 text-sm font-semibold animate-pulse" data-testid="status-recording">
                      <Circle className="h-3 w-3 fill-rose-500 text-rose-500"/> REC · Customer is hearing recording beep
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-2">
                    <Button onClick={toggleMute} variant="outline" className="bg-slate-800 border-slate-700 text-white h-14" data-testid="button-mute">
                      {muted ? <MicOff className="h-5 w-5 mr-1"/> : <Mic className="h-5 w-5 mr-1"/>}
                      <span className="text-xs">{muted ? "Unmute" : "Mute"}</span>
                    </Button>
                    <Button
                      onClick={toggleRecording}
                      variant="outline"
                      className={recording
                        ? "bg-rose-600 hover:bg-rose-700 border-rose-500 text-white h-14"
                        : "bg-slate-800 border-slate-700 text-white h-14"}
                      data-testid="button-record"
                    >
                      <Circle className={`h-5 w-5 mr-1 ${recording ? "fill-white" : "fill-rose-500 text-rose-500"}`}/>
                      <span className="text-xs">{recording ? "Stop Rec" : "Record"}</span>
                    </Button>
                    <Button onClick={hangup} className="bg-rose-600 hover:bg-rose-700 h-14" data-testid="button-hangup">
                      <PhoneOff className="h-5 w-5 mr-1"/>
                      <span className="text-xs">End</span>
                    </Button>
                  </div>
                  <p className="text-[10px] text-slate-500">Recording uses UCM feature code *3 / *4. Set "Beep tone every X seconds" in UCM → Call Features → Call Recording so the customer hears the beep.</p>
                </div>
              )}

              {error && callState === "none" && <div className="text-xs text-rose-400 bg-rose-950/40 border border-rose-800 rounded p-2">{error}</div>}

              <Button variant="ghost" onClick={unregister} className="w-full text-slate-400 hover:text-white" data-testid="button-webphone-disconnect">
                Disconnect
              </Button>
            </>
          )}
          <div className="text-[10px] text-slate-500 text-center pt-1">
            Backup phone:{" "}
            <a
              href="https://link24phone.a.gdms.cloud"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:text-emerald-300 underline"
              data-testid="link-wave-cloud-fallback"
            >
              Open Wave Cloud
            </a>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
