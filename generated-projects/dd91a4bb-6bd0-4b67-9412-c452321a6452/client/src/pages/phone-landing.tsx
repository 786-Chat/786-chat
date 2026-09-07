import { useEffect, useRef, useState, useMemo } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Phone, Sparkles, Crown, Gem, Check, Volume2, VolumeX, ArrowRight,
  Mic, Music, PhoneForwarded, BookOpen, Bell, PhoneCall, Voicemail, ListTree,
  Globe, Building2, Home, Warehouse, Store, Download, Share, Plus, X as XIcon,
} from "lucide-react";

type PhoneOffer = {
  id: string;
  slug: string;
  title: string;
  badge?: string | null;
  tagline?: string | null;
  price: string;
  priceSuffix?: string | null;
  bullets: string[];
  ctaLabel?: string | null;
  accentColor?: string | null;
  enabled: boolean;
  sortOrder: number;
};

const ADDONS = [
  { id: "recording",     label: "Call Recording",          price: 3, icon: Mic },
  { id: "hold-music",    label: "Hold Music",              price: 1, icon: Music },
  { id: "out-music",     label: "Outgoing Music",          price: 1, icon: Music },
  { id: "forward",       label: "Call Forward",            price: 1, icon: PhoneForwarded },
  { id: "waiting",       label: "Call Waiting",            price: 0, icon: PhoneCall },
  { id: "click-to-call", label: "Click-to-Call / Paste Dial", price: 0, icon: Phone },
  { id: "contacts",      label: "Contact Book",            price: 1, icon: BookOpen },
  { id: "ringtone",      label: "Custom Ringtone Upload",  price: 1, icon: Bell },
  { id: "voicemail",     label: "Voicemail to Email",      price: 2, icon: Voicemail },
  { id: "ivr",           label: "IVR Menu (Press 1 for...)", price: 4, icon: ListTree },
];

const BUSINESS_TYPES = [
  { id: "home",      label: "Home / Domestic", icon: Home },
  { id: "business",  label: "Business",        icon: Building2 },
  { id: "shop",      label: "Shop / Retail",   icon: Store },
  { id: "warehouse", label: "Warehouse",       icon: Warehouse },
];

// ─────────────── Sound Engine (no extra packages, uses WebAudio) ───────────────
function useSoundEngine(enabled: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);
  const ambientRef = useRef<{ osc: OscillatorNode; gain: GainNode } | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const Ctx = (window.AudioContext || (window as any).webkitAudioContext);
    if (!Ctx) return;
    const ctx: AudioContext = ctxRef.current ?? new Ctx();
    ctxRef.current = ctx;
    const tryResume = () => { if (ctx.state === "suspended") ctx.resume().catch(() => {}); };
    tryResume();
    // Browsers block audio until first user gesture — resume on first interaction
    const onGesture = () => {
      tryResume();
      window.removeEventListener("pointerdown", onGesture);
      window.removeEventListener("keydown", onGesture);
      window.removeEventListener("touchstart", onGesture);
      window.removeEventListener("scroll", onGesture);
    };
    window.addEventListener("pointerdown", onGesture, { once: true });
    window.addEventListener("keydown", onGesture, { once: true });
    window.addEventListener("touchstart", onGesture, { once: true });
    window.addEventListener("scroll", onGesture, { once: true, passive: true });

    // Ambient pad — slow detuned sine
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 110;
    gain.gain.value = 0;
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    gain.gain.linearRampToValueAtTime(0.03, ctx.currentTime + 2);
    ambientRef.current = { osc, gain };

    return () => {
      try {
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
        setTimeout(() => { try { osc.stop(); } catch {} }, 400);
      } catch {}
    };
  }, [enabled]);

  const swoosh = (intensity = 0.05) => {
    if (!enabled) return;
    const ctx = ctxRef.current;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(800 + Math.random() * 400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.18);
    gain.gain.setValueAtTime(intensity, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.21);
  };

  return { swoosh };
}

// ─────────────── Mouse Airbrush Trail ───────────────
function AirbrushTrail({ enabled, onMove }: { enabled: boolean; onMove?: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastMoveRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    type Particle = { x: number; y: number; r: number; life: number; hue: number; vx: number; vy: number };
    const particles: Particle[] = [];

    const handleMove = (e: MouseEvent) => {
      const now = performance.now();
      if (now - lastMoveRef.current < 8) return;
      lastMoveRef.current = now;
      const hue = (now / 30) % 360;
      for (let i = 0; i < 4; i++) {
        particles.push({
          x: e.clientX,
          y: e.clientY,
          r: 4 + Math.random() * 10,
          life: 1,
          hue,
          vx: (Math.random() - 0.5) * 1.6,
          vy: (Math.random() - 0.5) * 1.6,
        });
      }
      if (now - lastMoveRef.current < 100 && Math.random() < 0.15) onMove?.();
    };
    window.addEventListener("mousemove", handleMove);

    let raf = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.018;
        if (p.life <= 0) { particles.splice(i, 1); continue; }
        const alpha = p.life * 0.55;
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        grad.addColorStop(0, `hsla(${p.hue}, 100%, 70%, ${alpha})`);
        grad.addColorStop(1, `hsla(${(p.hue + 60) % 360}, 100%, 50%, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMove);
      cancelAnimationFrame(raf);
    };
  }, [enabled, onMove]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[100]"
      style={{ mixBlendMode: "screen" }}
    />
  );
}

// ─────────────── Install / Add to Home Screen ───────────────
function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const ua = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(ua) || (/(macintosh|mac os x)/.test(ua) && "ontouchend" in document);
    setIsIOS(ios);

    const standalone = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true;
    setIsInstalled(standalone);

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setIsInstalled(true));
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) return false;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setDeferredPrompt(null);
    return outcome === "accepted";
  };

  return { canInstall: !!deferredPrompt, isIOS, isInstalled, promptInstall };
}

function InstallAppButton() {
  const { canInstall, isIOS, isInstalled, promptInstall } = useInstallPrompt();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) return null;
  if (!canInstall && !isIOS) return null;

  const handleClick = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
    } else {
      const installed = await promptInstall();
      if (installed) toast({ title: "App installed!", description: "Find Link24 Phone on your home screen." });
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-purple-700 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-full px-3 py-1.5 transition"
        data-testid="button-install-app"
      >
        <Download className="h-3.5 w-3.5" />
        <span>Install App</span>
      </button>

      {/* iOS instructions modal */}
      <AnimatePresence>
        {showIOSGuide && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
            onClick={() => setShowIOSGuide(false)}
          >
            <motion.div
              initial={{ y: 30, scale: 0.95 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 30, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative"
              data-testid="modal-ios-install"
            >
              <button
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-3 right-3 text-slate-400 hover:text-slate-700"
                data-testid="button-close-ios-guide"
              >
                <XIcon className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-rose-500 via-pink-500 to-purple-600 flex items-center justify-center">
                  <Phone className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900">Add Link24 Phone to Home Screen</div>
                  <div className="text-xs text-slate-500">Works like a real app on your iPhone or iPad</div>
                </div>
              </div>
              <ol className="space-y-3 text-sm text-slate-700">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center">1</span>
                  <span className="flex items-center gap-1.5 flex-wrap">
                    Tap the <Share className="h-4 w-4 inline text-blue-600" /> <span className="font-semibold">Share</span> button at the bottom of Safari
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center">2</span>
                  <span className="flex items-center gap-1.5 flex-wrap">
                    Scroll down and tap <Plus className="h-4 w-4 inline text-slate-600" /> <span className="font-semibold">Add to Home Screen</span>
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center">3</span>
                  <span>Tap <span className="font-semibold">Add</span> in the top-right corner. Done!</span>
                </li>
              </ol>
              <div className="mt-5 text-xs text-slate-500 bg-slate-50 rounded-lg p-3">
                Tip: You must be in <span className="font-semibold">Safari</span> for this to work — not Chrome or another browser on iOS.
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─────────────── Animated Globe (CSS/SVG, multi-color + orbiting icons) ───────────────
function AnimatedGlobe() {
  // Icons that orbit around the globe
  const orbitIcons = [
    { Icon: Phone,         color: "from-emerald-400 to-green-600",  orbit: 0,   speed: 14 },
    { Icon: PhoneCall,     color: "from-purple-400 to-fuchsia-600", orbit: 60,  speed: 18 },
    { Icon: Voicemail,     color: "from-blue-400 to-cyan-500",      orbit: 120, speed: 22 },
    { Icon: Music,         color: "from-amber-400 to-yellow-500",   orbit: 180, speed: 16 },
    { Icon: BookOpen,      color: "from-pink-400 to-rose-500",      orbit: 240, speed: 20 },
    { Icon: Mic,           color: "from-violet-500 to-indigo-600",  orbit: 300, speed: 24 },
  ];

  return (
    <div className="relative w-[80vw] max-w-[640px] aspect-square mx-auto">
      {/* Outer multi-color glow */}
      <motion.div
        className="absolute inset-0 rounded-full blur-3xl"
        animate={{
          background: [
            "conic-gradient(from 0deg, rgba(34,197,94,0.35), rgba(168,85,247,0.35), rgba(59,130,246,0.35), rgba(245,158,11,0.35), rgba(250,204,21,0.35), rgba(34,197,94,0.35))",
            "conic-gradient(from 360deg, rgba(34,197,94,0.35), rgba(168,85,247,0.35), rgba(59,130,246,0.35), rgba(245,158,11,0.35), rgba(250,204,21,0.35), rgba(34,197,94,0.35))",
          ],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
      />

      {/* Globe — animated multi-color gradient */}
      <motion.div
        className="absolute inset-0 rounded-full overflow-hidden shadow-[0_0_80px_rgba(168,85,247,0.45)]"
        animate={{ rotate: 360 }}
        transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
      >
        <motion.div
          className="absolute inset-0"
          animate={{
            background: [
              "radial-gradient(circle at 30% 30%, #fef3c7 0%, #facc15 18%, #34d399 40%, #3b82f6 65%, #a855f7 100%)",
              "radial-gradient(circle at 70% 35%, #fef3c7 0%, #facc15 18%, #a855f7 40%, #3b82f6 65%, #34d399 100%)",
              "radial-gradient(circle at 60% 70%, #fef3c7 0%, #f59e0b 18%, #3b82f6 40%, #a855f7 65%, #34d399 100%)",
              "radial-gradient(circle at 30% 70%, #fef3c7 0%, #facc15 18%, #34d399 40%, #a855f7 65%, #3b82f6 100%)",
              "radial-gradient(circle at 30% 30%, #fef3c7 0%, #facc15 18%, #34d399 40%, #3b82f6 65%, #a855f7 100%)",
            ],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          style={{ mixBlendMode: "normal" }}
        />
        {/* Subtle noise overlay */}
        <div
          className="absolute inset-0 opacity-30 mix-blend-overlay"
          style={{
            backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><filter id="n"><feTurbulence baseFrequency="0.9" numOctaves="2"/></filter><rect width="100%" height="100%" filter="url(%23n)" opacity="0.5"/></svg>')`,
          }}
        />
        {/* Inner highlight */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/30 via-transparent to-black/20" />
      </motion.div>

      {/* Sparkle dots */}
      {Array.from({ length: 30 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 bg-white rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            boxShadow: "0 0 8px white",
          }}
          animate={{ opacity: [0, 1, 0], scale: [0.5, 1.5, 0.5] }}
          transition={{ duration: 2 + Math.random() * 3, repeat: Infinity, delay: Math.random() * 3 }}
        />
      ))}

      {/* Call route lines on globe surface */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 400">
        {[
          { x1: 80,  y1: 120, x2: 320, y2: 200 },
          { x1: 120, y1: 320, x2: 280, y2: 100 },
          { x1: 200, y1: 80,  x2: 100, y2: 280 },
        ].map((l, i) => (
          <motion.line
            key={i}
            x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
            stroke="rgba(255,255,255,0.7)"
            strokeWidth="1.2"
            strokeDasharray="4 4"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: [0, 1, 0] }}
            transition={{ duration: 4, repeat: Infinity, delay: i * 1.2 }}
          />
        ))}
      </svg>

      {/* Orbiting icons — each rotates on its own ring around the globe */}
      <div className="absolute inset-[-8%] pointer-events-none">
        {orbitIcons.map(({ Icon, color, orbit, speed }, i) => (
          <motion.div
            key={i}
            className="absolute inset-0"
            style={{ transformOrigin: "50% 50%" }}
            animate={{ rotate: 360 }}
            initial={{ rotate: orbit }}
            transition={{ duration: speed, repeat: Infinity, ease: "linear" }}
          >
            {/* Position icon at 12 o'clock relative to its rotating frame */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2">
              <motion.div
                className={`flex items-center justify-center rounded-2xl bg-gradient-to-br ${color} shadow-lg shadow-black/10 backdrop-blur`}
                style={{ width: 48, height: 48 }}
                animate={{ rotate: -360, scale: [1, 1.08, 1] }}
                transition={{
                  rotate: { duration: speed, repeat: Infinity, ease: "linear" },
                  scale:  { duration: 2.5, repeat: Infinity, ease: "easeInOut" },
                }}
              >
                <Icon className="h-5 w-5 text-white drop-shadow" />
              </motion.div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─────────────── Page ───────────────
export default function PhoneLandingPage() {
  const [soundOn, setSoundOn] = useState(true);
  const { swoosh } = useSoundEngine(soundOn);
  const heroRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  // Form state
  const [businessType, setBusinessType] = useState("business");
  const [lines, setLines] = useState(1);
  const [extensions, setExtensions] = useState(2);
  const [appUsers, setAppUsers] = useState(2);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [selectedOffer, setSelectedOffer] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNum, setPhoneNum] = useState("");
  const [business, setBusiness] = useState("");
  const [message, setMessage] = useState("");

  const offersQuery = useQuery<PhoneOffer[]>({
    queryKey: ["/api/phone-landing/offers"],
  });
  const offers = offersQuery.data || [];

  const settingsQuery = useQuery<Record<string, string>>({
    queryKey: ["/api/phone-landing/settings"],
  });
  const freephoneNumber = settingsQuery.data?.freephoneNumber || "0800 4714 726";
  const freephoneTel = "+44" + freephoneNumber.replace(/^0/, "").replace(/\s+/g, "");

  // Estimated price = base £8 × lines + £2 × extensions + £1 × appUsers + sum addons
  const estimatedMonthly = useMemo(() => {
    let total = lines * 8 + extensions * 2 + appUsers * 1;
    for (const id of selectedAddons) {
      const a = ADDONS.find(x => x.id === id);
      if (a) total += a.price;
    }
    return total;
  }, [lines, extensions, appUsers, selectedAddons]);

  const submitMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/phone-landing/inquiries", {
        name, email, phone: phoneNum, business, businessType,
        offerSlug: selectedOffer, lines, extensions, appUsers,
        addons: selectedAddons, estimatedMonthly: estimatedMonthly.toFixed(2),
        message,
      });
    },
    onSuccess: () => {
      toast({ title: "Request sent! 🎉", description: "We'll contact you within 24 hours." });
      setName(""); setEmail(""); setPhoneNum(""); setBusiness(""); setMessage("");
    },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      toast({ title: "Required", description: "Name and email are required", variant: "destructive" });
      return;
    }
    submitMutation.mutate();
  };

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth" });
    swoosh(0.08);
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-b from-amber-50 via-rose-50 to-purple-100 text-slate-900">
      <AirbrushTrail enabled onMove={() => Math.random() < 0.05 && swoosh(0.02)} />

      {/* Header */}
      <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-md bg-white/40 border-b border-white/40">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-16">
          <div className="flex items-center gap-2 font-bold text-lg">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 via-pink-500 to-purple-600 flex items-center justify-center">
              <Phone className="h-5 w-5 text-white" />
            </div>
            <span data-testid="text-brand">Link24 Phone</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <InstallAppButton />
            <a
              href={`tel:${freephoneTel}`}
              className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-full px-3 py-1.5 transition"
              data-testid="link-freephone-header"
            >
              <PhoneCall className="h-3.5 w-3.5" />
              <span className="text-[10px] uppercase tracking-wider text-emerald-600">Free</span>
              <span>{freephoneNumber}</span>
            </a>
            <button
              onClick={() => setSoundOn(s => !s)}
              className="flex items-center justify-center h-8 w-8 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
              aria-label={soundOn ? "Mute sound" : "Unmute sound"}
              title={soundOn ? "Sound on" : "Sound off"}
              data-testid="button-sound-toggle"
            >
              {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>
            <Button size="sm" onClick={scrollToForm} className="bg-gradient-to-r from-rose-500 to-purple-600" data-testid="button-cta-header">
              Get Started <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section ref={heroRef} className="relative pt-28 pb-32 min-h-[90vh] flex items-center justify-center">
        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative z-10 text-center max-w-4xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Badge className="mb-6 bg-white/70 text-slate-700 border-white/80 backdrop-blur">
              <Sparkles className="h-3 w-3 mr-1" /> UK Cloud Link24Phone App · Starting £8/mo
            </Badge>
            <h1 className="text-5xl md:text-7xl font-light tracking-tight leading-[1.05] mb-6" data-testid="text-hero-title">
              Your business, <br />
              <span className="font-semibold bg-gradient-to-r from-rose-600 via-pink-600 to-purple-700 bg-clip-text text-transparent">
                speaking the world.
              </span>
            </h1>
            <p className="text-lg md:text-xl text-slate-700 max-w-2xl mx-auto mb-10">
              Premium UK phone numbers, smart routing, browser-based calling,
              voicemail, recording — built for shops, warehouses & homes.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" onClick={scrollToForm} className="bg-gradient-to-r from-rose-500 to-purple-600 shadow-lg shadow-pink-500/30" data-testid="button-cta-hero">
                Get Started <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
              <Button asChild size="lg" className="bg-gradient-to-r from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30 text-white" data-testid="button-try-phone">
                <a href="/phone/app">
                  <PhoneCall className="h-4 w-4 mr-1" /> Try the Cloud Phone
                </a>
              </Button>
              <Button size="lg" variant="outline" onClick={() => document.getElementById("offers")?.scrollIntoView({ behavior: "smooth" })} className="bg-white/60 backdrop-blur" data-testid="button-view-offers">
                View Offers
              </Button>
            </div>
          </motion.div>
          <div className="mt-16">
            <AnimatedGlobe />
          </div>
        </motion.div>
      </section>

      {/* Call rates — extra outgoing minutes breakdown */}
      <section id="rates" className="relative py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <Badge className="mb-4 bg-white/70 text-slate-700 border-white/80 backdrop-blur">
              <Phone className="h-3 w-3 mr-1" /> Pay-as-you-go after free minutes
            </Badge>
            <h2 className="text-4xl md:text-5xl font-light tracking-tight text-slate-900" data-testid="text-rates-title">
              Simple call rates. <span className="font-semibold bg-gradient-to-r from-rose-600 to-purple-700 bg-clip-text text-transparent">No surprises.</span>
            </h2>
            <p className="mt-4 text-slate-600 max-w-2xl mx-auto">
              Every plan includes 100 free outgoing minutes per month. After that, you only pay for what you use — billed by the second.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-white/80 bg-white/70 backdrop-blur shadow-sm" data-testid="card-rate-landline">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    <Phone className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wider text-slate-500">UK Landline</div>
                    <div className="text-2xl font-semibold text-slate-900">5p / minute</div>
                  </div>
                </div>
                <div className="text-sm text-slate-600 border-t border-slate-200/70 pt-4">
                  <div className="flex justify-between text-slate-900 font-semibold"><span>Network cost</span><span>5p</span></div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/80 bg-white/70 backdrop-blur shadow-sm" data-testid="card-rate-mobile">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center">
                    <PhoneCall className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wider text-slate-500">UK Mobile</div>
                    <div className="text-2xl font-semibold text-slate-900">6p / minute</div>
                  </div>
                </div>
                <div className="text-sm text-slate-600 border-t border-slate-200/70 pt-4">
                  <div className="flex justify-between text-slate-900 font-semibold"><span>Network cost</span><span>6p</span></div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Usage examples — first 100 mins free, only extra is charged */}
          <Card className="mt-6 border-white/80 bg-white/70 backdrop-blur shadow-sm" data-testid="card-usage-examples">
            <CardContent className="p-6">
              <div className="text-sm font-semibold text-slate-900 mb-3">
                How extra minutes are charged
              </div>
              <div className="text-xs text-slate-600 mb-4">
                Every plan includes <span className="font-semibold text-slate-900">100 outgoing minutes free</span>. You only pay for minutes used <em>above</em> 100.
              </div>
              <div className="mb-4 flex items-start gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-800">
                <Check className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span><span className="font-semibold">Internal calls are 100% FREE</span> — calling between your own extensions, lines and app users on the same Link24Phone account never costs anything, no minute limit.</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200/70">
                      <th className="py-2 pr-3">You use</th>
                      <th className="py-2 pr-3">Free</th>
                      <th className="py-2 pr-3">Extra charged</th>
                      <th className="py-2 pr-3">Landline (5p)</th>
                      <th className="py-2 pr-3">Mobile (6p)</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-700">
                    <tr className="border-b border-slate-100">
                      <td className="py-2 pr-3 font-medium">100 mins</td>
                      <td className="py-2 pr-3">100</td>
                      <td className="py-2 pr-3">0</td>
                      <td className="py-2 pr-3 font-semibold text-emerald-700">£0.00</td>
                      <td className="py-2 pr-3 font-semibold text-emerald-700">£0.00</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-2 pr-3 font-medium">200 mins</td>
                      <td className="py-2 pr-3">100</td>
                      <td className="py-2 pr-3">100</td>
                      <td className="py-2 pr-3 font-semibold">£5.00</td>
                      <td className="py-2 pr-3 font-semibold">£6.00</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-2 pr-3 font-medium">300 mins</td>
                      <td className="py-2 pr-3">100</td>
                      <td className="py-2 pr-3">200</td>
                      <td className="py-2 pr-3 font-semibold">£10.00</td>
                      <td className="py-2 pr-3 font-semibold">£12.00</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-2 pr-3 font-medium">500 mins</td>
                      <td className="py-2 pr-3">100</td>
                      <td className="py-2 pr-3">400</td>
                      <td className="py-2 pr-3 font-semibold">£20.00</td>
                      <td className="py-2 pr-3 font-semibold">£24.00</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-3 font-medium">1000 mins</td>
                      <td className="py-2 pr-3">100</td>
                      <td className="py-2 pr-3">900</td>
                      <td className="py-2 pr-3 font-semibold">£45.00</td>
                      <td className="py-2 pr-3 font-semibold">£54.00</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-4 space-y-2 text-xs text-slate-500">
                <div>Billed by the second — you only pay for time actually used. The 100 free outgoing minutes reset every month.</div>
                <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-amber-800">
                  <Sparkles className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                  <span><span className="font-semibold">Want to keep costs predictable?</span> On request we can block all international numbers and cap your outgoing calls at 100 minutes — so you'll never go over the free allowance. Zero bill shock.</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Offers (admin-controlled cards) */}
      <section id="offers" className="relative py-24 px-6 bg-gradient-to-b from-transparent via-white/40 to-transparent">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <Badge className="mb-3 bg-rose-100 text-rose-800 border-rose-200">⚡ Special Offers</Badge>
            <h2 className="text-4xl md:text-5xl font-light mb-4">
              Pick your <span className="font-semibold">magic.</span>
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Bundles built for restaurants & shops — phone, pest control, hygiene & more.
            </p>
          </motion.div>

          {offersQuery.isLoading && <div className="text-center text-slate-500">Loading offers…</div>}

          {!offersQuery.isLoading && offers.length === 0 && (
            <div className="text-center text-slate-500 bg-white/50 rounded-2xl p-8" data-testid="text-no-offers">
              No active offers right now. Check back soon!
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-6">
            {offers.map((offer, i) => (
              <OfferCard
                key={offer.id}
                offer={offer}
                index={i}
                onSelect={() => {
                  setSelectedOffer(offer.slug);
                  swoosh(0.1);
                  scrollToForm();
                }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Build Your Plan */}
      <section ref={formRef} className="relative py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge className="mb-3 bg-purple-100 text-purple-800 border-purple-200">🛠 Build Your Plan</Badge>
            <h2 className="text-4xl md:text-5xl font-light mb-4">
              Tell us what you <span className="font-semibold">need.</span>
            </h2>
            <p className="text-slate-600">We&rsquo;ll set it up for you within 24 hours.</p>
          </motion.div>

          <Card className="bg-white/70 backdrop-blur-xl border-white/60 shadow-xl">
            <CardContent className="p-6 md:p-10">
              <form onSubmit={handleSubmit} className="space-y-8">
                {selectedOffer && (
                  <div className="bg-gradient-to-r from-rose-100 to-purple-100 border border-rose-200 rounded-xl p-3 text-sm text-rose-900 flex items-center justify-between" data-testid="banner-selected-offer">
                    <span>✨ Selected offer: <strong>{offers.find(o => o.slug === selectedOffer)?.title}</strong></span>
                    <button type="button" onClick={() => setSelectedOffer(null)} className="text-rose-700 hover:text-rose-900 text-xs underline">clear</button>
                  </div>
                )}

                {/* Business type */}
                <div>
                  <Label className="mb-3 block">Where will you use it?</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {BUSINESS_TYPES.map(b => {
                      const Icon = b.icon;
                      const sel = businessType === b.id;
                      return (
                        <button
                          type="button"
                          key={b.id}
                          onClick={() => { setBusinessType(b.id); swoosh(0.04); }}
                          className={`p-3 rounded-xl border-2 transition-all ${sel ? "border-rose-500 bg-rose-50" : "border-slate-200 bg-white hover:border-slate-300"}`}
                          data-testid={`button-business-${b.id}`}
                        >
                          <Icon className={`h-5 w-5 mx-auto mb-1 ${sel ? "text-rose-600" : "text-slate-500"}`} />
                          <div className="text-xs">{b.label}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Capacity */}
                <div className="grid md:grid-cols-3 gap-4">
                  <NumberPicker label="Lines" value={lines} setValue={setLines} max={10} swoosh={swoosh} testid="lines" />
                  <NumberPicker label="Extensions" value={extensions} setValue={setExtensions} max={20} swoosh={swoosh} testid="extensions" />
                  <NumberPicker label="App users" value={appUsers} setValue={setAppUsers} max={20} swoosh={swoosh} testid="app-users" />
                </div>

                {/* Add-ons */}
                <div>
                  <Label className="mb-3 block">Optional add-ons</Label>
                  <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {ADDONS.map(a => {
                      const Icon = a.icon;
                      const sel = selectedAddons.includes(a.id);
                      return (
                        <button
                          type="button"
                          key={a.id}
                          onClick={() => {
                            setSelectedAddons(s => s.includes(a.id) ? s.filter(x => x !== a.id) : [...s, a.id]);
                            swoosh(0.04);
                          }}
                          className={`p-2.5 rounded-xl border-2 text-left transition-all ${sel ? "border-purple-500 bg-purple-50" : "border-slate-200 bg-white hover:border-slate-300"}`}
                          data-testid={`button-addon-${a.id}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Icon className={`h-4 w-4 ${sel ? "text-purple-600" : "text-slate-500"}`} />
                              <span className="text-sm font-medium">{a.label}</span>
                            </div>
                            <span className="text-xs text-slate-500">{a.price > 0 ? `+£${a.price}` : "FREE"}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Estimated price */}
                <div className="bg-gradient-to-r from-rose-100 via-pink-100 to-purple-100 rounded-2xl p-5 text-center border border-rose-200">
                  <div className="text-xs text-rose-700 uppercase tracking-wider mb-1">Estimated monthly</div>
                  <div className="text-4xl font-bold text-rose-900" data-testid="text-estimated-price">£{estimatedMonthly.toFixed(2)}</div>
                  <div className="text-xs text-rose-700/80 mt-1">Final price confirmed when we contact you</div>
                </div>

                {/* Contact */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Your name *</Label>
                    <Input id="name" value={name} onChange={e => setName(e.target.value)} required data-testid="input-name" />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required data-testid="input-email" />
                  </div>
                  <div>
                    <Label htmlFor="phoneNum">Phone</Label>
                    <Input id="phoneNum" value={phoneNum} onChange={e => setPhoneNum(e.target.value)} data-testid="input-phone" />
                  </div>
                  <div>
                    <Label htmlFor="business">Business name</Label>
                    <Input id="business" value={business} onChange={e => setBusiness(e.target.value)} data-testid="input-business" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="message">Tell us anything else</Label>
                  <Textarea id="message" rows={3} value={message} onChange={e => setMessage(e.target.value)} data-testid="input-message" />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  disabled={submitMutation.isPending}
                  className="w-full bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 text-white shadow-xl shadow-pink-500/30"
                  data-testid="button-submit"
                >
                  {submitMutation.isPending ? "Sending…" : <>Send my request <ArrowRight className="h-4 w-4 ml-1" /></>}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      <footer className="py-10 text-center text-sm text-slate-500 space-y-2">
        <div>© {new Date().getFullYear()} Link24 Phone — Hosted UK Cloud Link24Phone App</div>
        <div className="text-xs text-slate-400">
          Developed by <span className="font-medium text-slate-600">M Sardar</span> ·{" "}
          <a href={`tel:${freephoneTel}`} className="text-slate-600 hover:text-slate-900 underline-offset-2 hover:underline" data-testid="link-developer-phone">
            {freephoneNumber}
          </a>
        </div>
      </footer>
    </div>
  );
}

function NumberPicker({ label, value, setValue, max, swoosh, testid }: { label: string; value: number; setValue: (n: number) => void; max: number; swoosh: (n?: number) => void; testid: string }) {
  return (
    <div>
      <Label className="mb-1.5 block text-sm">{label}</Label>
      <div className="flex items-center gap-2 bg-white rounded-xl border-2 border-slate-200 p-1.5">
        <button type="button" onClick={() => { setValue(Math.max(0, value - 1)); swoosh(0.04); }} className="w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold" data-testid={`button-${testid}-minus`}>−</button>
        <div className="flex-1 text-center font-semibold text-lg" data-testid={`text-${testid}`}>{value}</div>
        <button type="button" onClick={() => { setValue(Math.min(max, value + 1)); swoosh(0.04); }} className="w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold" data-testid={`button-${testid}-plus`}>+</button>
      </div>
    </div>
  );
}

function OfferCard({ offer, index, onSelect }: { offer: PhoneOffer; index: number; onSelect: () => void }) {
  const isPremium = offer.slug.includes("premium");
  const isVip = offer.slug === "vip";
  const Icon = isPremium ? Gem : isVip ? Crown : Sparkles;
  const accent = offer.accentColor || "from-rose-500 to-purple-600";

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.15 }}
      whileHover={{ y: -6 }}
      data-testid={`card-offer-${offer.slug}`}
    >
      <Card className={`relative overflow-hidden border-2 ${isPremium ? "border-amber-300" : isVip ? "border-purple-300" : "border-rose-200"} bg-white/80 backdrop-blur-xl shadow-xl h-full flex flex-col`}>
        <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${accent}`} />
        <CardContent className="p-6 flex flex-col h-full">
          {offer.badge && (
            <Badge className={`self-start mb-3 bg-gradient-to-r ${accent} text-white border-0`} data-testid={`badge-offer-${offer.slug}`}>
              <Icon className="h-3 w-3 mr-1" /> {offer.badge}
            </Badge>
          )}
          <h3 className="text-2xl font-bold mb-1" data-testid={`title-offer-${offer.slug}`}>{offer.title}</h3>
          {offer.tagline && <p className="text-sm text-slate-600 mb-4">{offer.tagline}</p>}
          <div className="flex items-baseline gap-1 mb-4">
            <span className={`text-5xl font-black bg-gradient-to-r ${accent} bg-clip-text text-transparent`} data-testid={`price-offer-${offer.slug}`}>
              £{Number(offer.price).toFixed(0)}
            </span>
            <span className="text-slate-500 text-sm">{offer.priceSuffix || "/month"}</span>
          </div>
          <ul className="space-y-2 mb-6 flex-1">
            {(offer.bullets || []).map((b, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                <Check className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
          <Button onClick={onSelect} className={`bg-gradient-to-r ${accent} text-white shadow-lg w-full`} data-testid={`button-select-${offer.slug}`}>
            {offer.ctaLabel || "Get Started"} <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
