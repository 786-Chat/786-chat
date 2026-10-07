import { useState, useRef, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Phone, PhoneCall, PhoneIncoming, PhoneOutgoing, PhoneMissed, PhoneOff,
  Delete, Plus, Trash2, Star, MessageSquare, Send, User, Search,
  Mic, MicOff, Volume2, Pause, Play, Heart, Edit3, Check,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSipPhone } from "./use-sip-phone";

const AVATAR_COLORS = ["bg-blue-500", "bg-emerald-500", "bg-pink-500", "bg-orange-500", "bg-purple-500", "bg-amber-500", "bg-cyan-500", "bg-rose-500", "bg-indigo-500"];
const colorFor = (s: string) => AVATAR_COLORS[(s?.charCodeAt(0) || 0) % AVATAR_COLORS.length];
const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase()).join("") || "?";
const fmtDuration = (sec: number) => {
  if (!sec) return "0s";
  const m = Math.floor(sec / 60), s = sec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
};
const fmtTime = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  const diffH = (now.getTime() - d.getTime()) / 3600000;
  if (diffH < 24) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diffH < 168) return d.toLocaleDateString([], { weekday: "short", hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString();
};

// ---------- DTMF Tone Player (Web Audio API) ----------
const DTMF_FREQS: Record<string, [number, number]> = {
  "1": [697, 1209], "2": [697, 1336], "3": [697, 1477],
  "4": [770, 1209], "5": [770, 1336], "6": [770, 1477],
  "7": [852, 1209], "8": [852, 1336], "9": [852, 1477],
  "*": [941, 1209], "0": [941, 1336], "#": [941, 1477],
};
let _ctx: AudioContext | null = null;
const playDTMF = (key: string) => {
  try {
    if (!_ctx) _ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const ctx = _ctx;
    const [f1, f2] = DTMF_FREQS[key] || [0, 0];
    if (!f1) return;
    const dur = 0.12;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.01);
    gain.gain.linearRampToValueAtTime(0.0, ctx.currentTime + dur);
    [f1, f2].forEach(f => {
      const o = ctx.createOscillator();
      o.frequency.value = f;
      o.type = "sine";
      o.connect(gain);
      o.start();
      o.stop(ctx.currentTime + dur);
    });
    gain.connect(ctx.destination);
  } catch {}
};
const playRing = (durationMs = 1500) => {
  try {
    if (!_ctx) _ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const ctx = _ctx;
    const gain = ctx.createGain();
    gain.gain.value = 0.08;
    [440, 480].forEach(f => {
      const o = ctx.createOscillator();
      o.frequency.value = f;
      o.type = "sine";
      o.connect(gain);
      o.start();
      o.stop(ctx.currentTime + durationMs / 1000);
    });
    gain.connect(ctx.destination);
  } catch {}
};
const playSmsBeep = () => {
  try {
    if (!_ctx) _ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const ctx = _ctx;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.01);
    gain.gain.linearRampToValueAtTime(0.0, ctx.currentTime + 0.18);
    const o = ctx.createOscillator();
    o.frequency.setValueAtTime(880, ctx.currentTime);
    o.frequency.linearRampToValueAtTime(1320, ctx.currentTime + 0.15);
    o.type = "triangle";
    o.connect(gain);
    o.start();
    o.stop(ctx.currentTime + 0.2);
    gain.connect(ctx.destination);
  } catch {}
};

// ---------- Main App Wrapper ----------
export default function WebPhoneApp({ restaurantId }: { restaurantId: string }) {
  const [view, setView] = useState<"dialer" | "contacts" | "history" | "sms">("dialer");
  const { data: subscription } = useQuery<any>({ queryKey: [`/api/pbx/subscriptions/${restaurantId}`] });
  const smsEnabled = !!subscription?.smsEnabled;

  return (
    <div className="space-y-3" data-testid="web-phone-app">
      <div className="grid grid-cols-4 gap-1 p-1 bg-muted rounded-xl">
        {[
          { v: "dialer", icon: Phone, label: "Dialer" },
          { v: "contacts", icon: User, label: "Contacts" },
          { v: "history", icon: PhoneCall, label: "History" },
          { v: "sms", icon: MessageSquare, label: "SMS", disabled: !smsEnabled },
        ].map(t => (
          <button
            key={t.v}
            onClick={() => !t.disabled && setView(t.v as any)}
            disabled={t.disabled}
            data-testid={`tab-app-${t.v}`}
            className={`flex flex-col items-center gap-1 py-3 rounded-lg transition-all ${
              view === t.v
                ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg"
                : t.disabled
                ? "opacity-40 cursor-not-allowed"
                : "hover:bg-card"
            }`}
          >
            <t.icon className="h-5 w-5"/>
            <span className="text-xs font-medium">{t.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
        >
          {view === "dialer" && <DialerView restaurantId={restaurantId} subscription={subscription}/>}
          {view === "contacts" && <ContactsView restaurantId={restaurantId}/>}
          {view === "history" && <HistoryView restaurantId={restaurantId}/>}
          {view === "sms" && <SmsView restaurantId={restaurantId}/>}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ---------- DIALER ----------
function DialerView({ restaurantId, subscription }: { restaurantId: string; subscription: any }) {
  const [num, setNum] = useState("");
  const [calling, setCalling] = useState<{ number: string; displayAs?: any; startedAt: number } | null>(null);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [holding, setHolding] = useState(false);
  const [selectedDisplay, setSelectedDisplay] = useState<string>("default");
  const qc = useQueryClient();

  const { data: contacts = [] } = useQuery<any[]>({ queryKey: [`/api/pbx/contacts/${restaurantId}`] });
  const { data: callerIds = [] } = useQuery<any[]>({ queryKey: [`/api/pbx/caller-ids/${restaurantId}`] });
  const { data: numbers = [] } = useQuery<any[]>({ queryKey: [`/api/pbx/numbers/${restaurantId}`] });
  const { data: webrtc } = useQuery<any>({ queryKey: ["/api/pbx/webrtc-config"] });
  const { data: sipCreds } = useQuery<any>({
    queryKey: [`/api/pbx/softphone-credentials/${restaurantId}`],
    enabled: !!subscription?.hasSipPassword,
  });

  const sipConfig = webrtc && sipCreds?.extension && sipCreds?.password
    ? { wsUrl: webrtc.wsUrl, domain: webrtc.domain, stunServer: webrtc.stunServer, extension: sipCreds.extension, password: sipCreds.password }
    : null;
  const sip = useSipPhone(sipConfig, !!sipConfig);
  const sipReady = sip.status === "registered";

  const customCallerIdEnabled = !!subscription?.customCallerIdEnabled;
  const matchedContact = useMemo(() => contacts.find((c: any) => c.phoneNumber.replace(/\D/g, "") === num.replace(/\D/g, "")), [contacts, num]);

  // Tick timer during call
  useEffect(() => {
    if (!calling) { setDuration(0); return; }
    const id = setInterval(() => setDuration(Math.floor((Date.now() - calling.startedAt) / 1000)), 1000);
    return () => clearInterval(id);
  }, [calling]);

  const press = (k: string) => {
    playDTMF(k);
    setNum(n => (n + k).slice(0, 20));
  };
  const back = () => setNum(n => n.slice(0, -1));

  const startCall = useMutation({
    mutationFn: async () => {
      if (!num.trim()) throw new Error("Enter a number");
      const myNumber = numbers[0]?.number || "+44 0000 000000";
      const displayProfile = callerIds.find((c: any) => c.id === selectedDisplay);
      const fromNumber = displayProfile?.displayNumber || myNumber;
      // Smart on-net routing: ask the server if this number belongs to another Link24 user
      let routeMode: "internal" | "pstn-fallback" | "pstn" = "pstn";
      let dialTarget = num;
      let ownerLabel: string | undefined;
      try {
        const r = await fetch(`/api/pbx/route-lookup?number=${encodeURIComponent(num)}`);
        if (r.ok) {
          const route = await r.json();
          routeMode = route.mode;
          if (route.mode === "internal") {
            dialTarget = route.target;
            ownerLabel = route.ownerLabel;
          }
        }
      } catch {}
      playRing(800);
      if (sipReady) sip.call(dialTarget);
      const log = await apiRequest("POST", "/api/pbx/calls", {
        restaurantId,
        direction: "outbound",
        fromNumber,
        toNumber: num,
        customerName: matchedContact?.name || ownerLabel,
        status: "answered",
        startedAt: new Date().toISOString(),
        notes: routeMode === "internal" ? `on-net (free) → ext ${dialTarget}` : routeMode === "pstn-fallback" ? "on-net offline, used PSTN" : undefined,
      });
      return { log: await log.json(), displayProfile, fromNumber, routeMode, dialTarget, ownerLabel };
    },
    onSuccess: (r) => {
      setCalling({ number: num, displayAs: r.displayProfile, startedAt: Date.now() });
      let mode: string;
      if (!sipReady) {
        mode = "(simulated · PBX not registered)";
      } else if (r.routeMode === "internal") {
        mode = `🟢 FREE · on-net → ext ${r.dialTarget}${r.ownerLabel ? ` (${r.ownerLabel})` : ""}`;
      } else if (r.routeMode === "pstn-fallback") {
        mode = "🟡 on-net but offline · using carrier";
      } else {
        mode = "💷 carrier (paid)";
      }
      toast({ title: "Calling…", description: `${matchedContact?.name || r.ownerLabel || num} · ${mode}${r.displayProfile ? ` · showing as ${r.displayProfile.displayName}` : ""}` });
    },
    onError: (e: any) => toast({ title: "Call failed", description: e.message, variant: "destructive" }),
  });

  const endCall = useMutation({
    mutationFn: async () => {
      if (!calling) return;
      if (sipReady || sip.callState !== "idle") sip.hangup();
      qc.invalidateQueries({ queryKey: [`/api/pbx/calls/${restaurantId}`] });
      return true;
    },
    onSettled: () => {
      setCalling(null);
      setDuration(0);
      setHolding(false);
      setMuted(false);
    },
  });

  // End call when SIP session ends remotely
  useEffect(() => {
    if (sip.callState === "ended" && calling) endCall.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sip.callState]);

  if (calling) {
    return <ActiveCallScreen
      number={calling.number}
      displayAs={calling.displayAs}
      contactName={matchedContact?.name}
      duration={duration}
      muted={muted}
      holding={holding}
      onMute={() => { if (sipReady) sip.toggleMute(); setMuted(m => !m); }}
      onHold={() => { if (sipReady) sip.toggleHold(); setHolding(h => !h); }}
      onEnd={() => endCall.mutate()}
      onPressDtmf={(k: string) => { playDTMF(k); if (sipReady) sip.sendDtmf(k); }}
    />;
  }

  return (
    <Card className="border-2">
      <CardContent className="pt-6 space-y-4">
        {/* Display Number selector — quietly tucked above keypad */}
        {customCallerIdEnabled && callerIds.length > 0 && (
          <div className="flex items-center gap-2 px-1" data-testid="row-display-number">
            <Label className="text-xs text-muted-foreground whitespace-nowrap">Display as</Label>
            <Select value={selectedDisplay} onValueChange={setSelectedDisplay}>
              <SelectTrigger className="h-8 text-xs" data-testid="select-display-number">
                <SelectValue/>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">My number ({numbers[0]?.number?.slice(-7) || "default"})</SelectItem>
                {callerIds.map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>{c.displayName} · {c.displayNumber}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <ManageDisplayNumbersDialog restaurantId={restaurantId} callerIds={callerIds}/>
          </div>
        )}

        {/* SIP registration status */}
        {sipConfig && (
          <div className="flex items-center justify-center gap-2 text-xs" data-testid="text-sip-status">
            <span className={`inline-block w-2 h-2 rounded-full ${
              sip.status === "registered" ? "bg-emerald-500 animate-pulse" :
              sip.status === "connecting" ? "bg-amber-500" :
              sip.status === "failed" ? "bg-red-500" : "bg-gray-400"
            }`}/>
            <span className="text-muted-foreground">
              {sip.status === "registered" ? `📞 PBX live · ext ${subscription.sipExtension}` :
               sip.status === "connecting" ? "Connecting to PBX…" :
               sip.status === "failed" ? `PBX: ${sip.error || "failed"}` : "PBX offline"}
            </span>
          </div>
        )}
        <audio ref={sip.remoteAudioRef} autoPlay playsInline data-testid="audio-sip-remote" />

        {/* Number display */}
        <div className="text-center min-h-[60px]">
          {matchedContact && num && (
            <p className="text-sm text-emerald-600 dark:text-emerald-400 mb-1">{matchedContact.name}</p>
          )}
          <Input
            value={num}
            onChange={e => setNum(e.target.value.replace(/[^\d+*#]/g, ""))}
            placeholder="Enter number"
            className="text-center text-3xl font-light h-14 border-0 focus-visible:ring-0 tracking-wider"
            data-testid="input-dial-number"
          />
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
          {[
            ["1", ""], ["2", "ABC"], ["3", "DEF"],
            ["4", "GHI"], ["5", "JKL"], ["6", "MNO"],
            ["7", "PQRS"], ["8", "TUV"], ["9", "WXYZ"],
            ["*", ""], ["0", "+"], ["#", ""],
          ].map(([k, sub]) => (
            <button
              key={k}
              onClick={() => press(k)}
              data-testid={`key-${k}`}
              className="aspect-square rounded-full bg-card hover:bg-muted active:scale-95 active:bg-indigo-100 dark:active:bg-indigo-900/40 transition-all border shadow-sm flex flex-col items-center justify-center"
            >
              <span className="text-2xl font-medium">{k}</span>
              {sub && <span className="text-[10px] text-muted-foreground tracking-widest">{sub}</span>}
            </button>
          ))}
        </div>

        {/* Action row */}
        <div className="flex items-center justify-center gap-3 max-w-xs mx-auto">
          <button
            onClick={() => num && apiRequest("POST", `/api/pbx/contacts/${restaurantId}`, { name: matchedContact?.name || `Contact ${Date.now() % 1000}`, phoneNumber: num }).then(() => {
              qc.invalidateQueries({ queryKey: [`/api/pbx/contacts/${restaurantId}`] });
              toast({ title: "Saved to contacts" });
            })}
            disabled={!num || !!matchedContact}
            data-testid="button-save-contact"
            className="w-12 h-12 rounded-full bg-card border hover:bg-muted disabled:opacity-30 flex items-center justify-center"
          >
            <Plus className="h-5 w-5"/>
          </button>
          <button
            onClick={() => startCall.mutate()}
            disabled={!num || startCall.isPending}
            data-testid="button-call"
            className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 active:scale-95 text-white shadow-xl flex items-center justify-center disabled:opacity-50"
          >
            <Phone className="h-7 w-7"/>
          </button>
          <button
            onClick={back}
            disabled={!num}
            data-testid="button-backspace"
            className="w-12 h-12 rounded-full bg-card border hover:bg-muted disabled:opacity-30 flex items-center justify-center"
          >
            <Delete className="h-5 w-5"/>
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

function ActiveCallScreen({ number, displayAs, contactName, duration, muted, holding, onMute, onHold, onEnd, onPressDtmf }: any) {
  return (
    <Card className="border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-50 via-card to-card dark:from-emerald-950/30">
      <CardContent className="pt-8 pb-6 text-center space-y-6">
        <div>
          <Avatar className="h-24 w-24 mx-auto mb-3">
            <AvatarFallback className="text-3xl bg-gradient-to-br from-emerald-500 to-green-600 text-white">
              {initials(contactName || number)}
            </AvatarFallback>
          </Avatar>
          <h3 className="text-2xl font-semibold" data-testid="text-call-name">{contactName || number}</h3>
          {contactName && <p className="text-sm text-muted-foreground">{number}</p>}
          {displayAs && (
            <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">📤 Showing as {displayAs.displayName} ({displayAs.displayNumber})</p>
          )}
          {(() => {
            const digits = String(number || "").replace(/\D/g, "");
            const isInternet = digits.length > 0 && digits.length <= 5;
            return isInternet ? (
              <Badge className="mt-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0" data-testid="badge-call-free-internet">
                🌐 FREE Internet Call · £0.00
              </Badge>
            ) : (
              <p className="text-[11px] text-muted-foreground mt-1" data-testid="text-call-rate">
                📞 Telco call · ~0.7p/min · est. £{((duration / 60) * 0.007).toFixed(3)}
              </p>
            );
          })()}
          <p className="text-3xl font-mono mt-3 text-emerald-600 dark:text-emerald-400" data-testid="text-call-duration">
            {String(Math.floor(duration / 60)).padStart(2, "0")}:{String(duration % 60).padStart(2, "0")}
          </p>
          {holding && <Badge className="mt-2 bg-amber-500">On Hold</Badge>}
        </div>

        <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto">
          <CallActionButton icon={muted ? MicOff : Mic} label={muted ? "Unmute" : "Mute"} active={muted} onClick={onMute} testId="button-mute"/>
          <CallActionButton icon={holding ? Play : Pause} label={holding ? "Resume" : "Hold"} active={holding} onClick={onHold} testId="button-hold"/>
          <CallActionButton icon={Volume2} label="Speaker" onClick={() => {}} testId="button-speaker"/>
        </div>

        <button
          onClick={onEnd}
          data-testid="button-end-call"
          className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 active:scale-95 text-white shadow-xl flex items-center justify-center"
        >
          <PhoneOff className="h-8 w-8"/>
        </button>
      </CardContent>
    </Card>
  );
}

function CallActionButton({ icon: Icon, label, active, onClick, testId }: any) {
  return (
    <button onClick={onClick} data-testid={testId} className={`flex flex-col items-center gap-1.5 ${active ? "text-indigo-600" : ""}`}>
      <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
        active ? "bg-indigo-100 dark:bg-indigo-900/40" : "bg-card hover:bg-muted border"
      }`}>
        <Icon className="h-6 w-6"/>
      </div>
      <span className="text-xs">{label}</span>
    </button>
  );
}

// ---------- Display Numbers manager (hidden under "manage" gear) ----------
function ManageDisplayNumbersDialog({ restaurantId, callerIds }: { restaurantId: string; callerIds: any[] }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const qc = useQueryClient();
  const create = useMutation({
    mutationFn: () => apiRequest("POST", `/api/pbx/caller-ids/${restaurantId}`, { displayName: name, displayNumber: number, purpose: "personal" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: [`/api/pbx/caller-ids/${restaurantId}`] }); setName(""); setNumber(""); toast({ title: "Display number added" }); },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });
  const del = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/pbx/caller-ids/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: [`/api/pbx/caller-ids/${restaurantId}`] }),
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="h-8 px-2" data-testid="button-manage-display">
          <Edit3 className="h-3.5 w-3.5"/>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Display Numbers</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            {callerIds.map((c: any) => (
              <div key={c.id} className="flex items-center justify-between p-2 rounded border" data-testid={`row-display-${c.id}`}>
                <div>
                  <p className="font-medium text-sm">{c.displayName}</p>
                  <p className="text-xs text-muted-foreground font-mono">{c.displayNumber}</p>
                </div>
                <Button size="icon" variant="ghost" onClick={() => del.mutate(c.id)} data-testid={`button-delete-display-${c.id}`}>
                  <Trash2 className="h-4 w-4 text-red-500"/>
                </Button>
              </div>
            ))}
            {callerIds.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No display numbers yet — add one below.</p>}
          </div>
          <div className="border-t pt-3 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Name (e.g. Sardar)" value={name} onChange={e => setName(e.target.value)} data-testid="input-display-name"/>
              <Input placeholder="Number (+44…)" value={number} onChange={e => setNumber(e.target.value)} data-testid="input-display-number"/>
            </div>
            <Button className="w-full" onClick={() => create.mutate()} disabled={!name || !number || create.isPending} data-testid="button-add-display">
              <Plus className="h-4 w-4 mr-1"/>Add display number
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------- CONTACTS ----------
function ContactsView({ restaurantId }: { restaurantId: string }) {
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const qc = useQueryClient();
  const { data: contacts = [], isLoading } = useQuery<any[]>({ queryKey: [`/api/pbx/contacts/${restaurantId}`] });

  const create = useMutation({
    mutationFn: () => apiRequest("POST", `/api/pbx/contacts/${restaurantId}`, { name, phoneNumber: number }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: [`/api/pbx/contacts/${restaurantId}`] }); setName(""); setNumber(""); setAdding(false); toast({ title: "Contact saved" }); },
  });
  const del = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/pbx/contacts/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: [`/api/pbx/contacts/${restaurantId}`] }),
  });
  const fav = useMutation({
    mutationFn: ({ id, favorite }: any) => apiRequest("PATCH", `/api/pbx/contacts/${id}`, { favorite }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [`/api/pbx/contacts/${restaurantId}`] }),
  });

  const filtered = contacts.filter((c: any) =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.phoneNumber.includes(search)
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2"><User className="h-5 w-5"/>Contacts <Badge variant="secondary">{contacts.length}</Badge></CardTitle>
          <Button size="sm" onClick={() => setAdding(a => !a)} data-testid="button-add-contact">
            <Plus className="h-4 w-4 mr-1"/>{adding ? "Cancel" : "New"}
          </Button>
        </div>
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
          <Input placeholder="Search contacts…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" data-testid="input-search-contacts"/>
        </div>
        {adding && (
          <div className="mt-3 p-3 rounded-lg border space-y-2 bg-muted/30">
            <Input placeholder="Name" value={name} onChange={e => setName(e.target.value)} data-testid="input-contact-name"/>
            <Input placeholder="Phone number" value={number} onChange={e => setNumber(e.target.value)} data-testid="input-contact-number"/>
            <Button className="w-full" onClick={() => create.mutate()} disabled={!name || !number || create.isPending} data-testid="button-save-new-contact">Save Contact</Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-3">
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No contacts. Tap "New" to add one.</p>
          ) : (
            <div className="space-y-1">
              {filtered.map((c: any) => (
                <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 group" data-testid={`row-contact-${c.id}`}>
                  <Avatar>
                    <AvatarFallback className={`${colorFor(c.name)} text-white text-sm`}>{initials(c.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate" data-testid={`text-contact-name-${c.id}`}>{c.name}</p>
                    <p className="text-sm text-muted-foreground font-mono">{c.phoneNumber}</p>
                  </div>
                  <button onClick={() => fav.mutate({ id: c.id, favorite: !c.favorite })} data-testid={`button-fav-${c.id}`}>
                    <Star className={`h-4 w-4 ${c.favorite ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`}/>
                  </button>
                  <Button size="icon" variant="ghost" className="text-emerald-600" onClick={() => {
                    apiRequest("POST", "/api/pbx/calls", { restaurantId, direction: "outbound", fromNumber: "self", toNumber: c.phoneNumber, customerName: c.name, status: "answered", startedAt: new Date().toISOString() })
                      .then(() => toast({ title: `Calling ${c.name}…` }));
                    playRing(800);
                  }} data-testid={`button-call-contact-${c.id}`}>
                    <Phone className="h-4 w-4"/>
                  </Button>
                  <Button size="icon" variant="ghost" className="opacity-0 group-hover:opacity-100 text-red-500" onClick={() => del.mutate(c.id)} data-testid={`button-delete-contact-${c.id}`}>
                    <Trash2 className="h-4 w-4"/>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// ---------- HISTORY ----------
function HistoryView({ restaurantId }: { restaurantId: string }) {
  const { data: calls = [], isLoading } = useQuery<any[]>({ queryKey: [`/api/pbx/calls/${restaurantId}`] });
  const [filter, setFilter] = useState<"all" | "inbound" | "outbound" | "missed">("all");
  const filtered = filter === "all" ? calls : calls.filter((c: any) => c.direction === filter || (filter === "missed" && c.status === "missed"));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2"><PhoneCall className="h-5 w-5"/>Call History</CardTitle>
        <div className="flex gap-1 mt-2">
          {[
            { v: "all", l: "All" }, { v: "inbound", l: "Incoming" }, { v: "outbound", l: "Outgoing" }, { v: "missed", l: "Missed" }
          ].map(t => (
            <Button key={t.v} size="sm" variant={filter === t.v ? "default" : "outline"} onClick={() => setFilter(t.v as any)} data-testid={`filter-${t.v}`}>
              {t.l}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-3">
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No calls yet.</p>
          ) : (
            <div className="space-y-1">
              {filtered.map((c: any) => {
                const Icon = c.status === "missed" ? PhoneMissed : c.direction === "outbound" ? PhoneOutgoing : PhoneIncoming;
                const color = c.status === "missed" ? "text-red-500" : c.direction === "outbound" ? "text-emerald-500" : "text-blue-500";
                const peer = c.direction === "outbound" ? c.toNumber : c.fromNumber;
                return (
                  <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 border-b" data-testid={`row-call-${c.id}`}>
                    <Icon className={`h-5 w-5 ${color}`}/>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{c.customerName || peer}</p>
                      <p className="text-xs text-muted-foreground">{fmtTime(c.startedAt)} · {fmtDuration(c.durationSeconds || 0)}</p>
                    </div>
                    {c.recordingUrl && (
                      <Button size="icon" variant="ghost" data-testid={`button-play-${c.id}`}>
                        <Play className="h-4 w-4"/>
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" className="text-emerald-600" data-testid={`button-callback-${c.id}`}>
                      <Phone className="h-4 w-4"/>
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// ---------- SMS ----------
function SmsView({ restaurantId }: { restaurantId: string }) {
  const { data: messages = [], isLoading } = useQuery<any[]>({ queryKey: [`/api/pbx/sms/${restaurantId}`] });
  const { data: contacts = [] } = useQuery<any[]>({ queryKey: [`/api/pbx/contacts/${restaurantId}`] });
  const [composing, setComposing] = useState(false);
  const [to, setTo] = useState("");
  const [body, setBody] = useState("");
  const qc = useQueryClient();

  const send = useMutation({
    mutationFn: () => apiRequest("POST", `/api/pbx/sms/${restaurantId}`, { fromNumber: "self", toNumber: to, body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [`/api/pbx/sms/${restaurantId}`] });
      setTo(""); setBody(""); setComposing(false);
      playSmsBeep();
      toast({ title: "Message sent" });
    },
    onError: (e: any) => toast({ title: "SMS failed", description: e.message, variant: "destructive" }),
  });
  const del = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/pbx/sms/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: [`/api/pbx/sms/${restaurantId}`] }),
  });

  // Group by peer number
  const threads = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const m of messages) {
      const peer = m.direction === "outbound" ? m.toNumber : m.fromNumber;
      if (!map.has(peer)) map.set(peer, []);
      map.get(peer)!.push(m);
    }
    return Array.from(map.entries()).map(([peer, msgs]) => {
      const contact = contacts.find((c: any) => c.phoneNumber.replace(/\D/g, "") === peer.replace(/\D/g, ""));
      return { peer, name: contact?.name || peer, last: msgs[0], count: msgs.length, unread: msgs.filter((m: any) => !m.read && m.direction === "inbound").length };
    });
  }, [messages, contacts]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5"/>Messages</CardTitle>
          <Button size="sm" onClick={() => setComposing(c => !c)} data-testid="button-compose-sms">
            {composing ? "Cancel" : <><Plus className="h-4 w-4 mr-1"/>New</>}
          </Button>
        </div>
        {composing && (
          <div className="mt-3 p-3 border rounded-lg space-y-2 bg-muted/30">
            <Input placeholder="To: phone number" value={to} onChange={e => setTo(e.target.value)} data-testid="input-sms-to"/>
            <Textarea placeholder="Message…" value={body} onChange={e => setBody(e.target.value)} rows={3} data-testid="input-sms-body"/>
            <Button className="w-full bg-gradient-to-r from-indigo-500 to-purple-600" onClick={() => send.mutate()} disabled={!to || !body || send.isPending} data-testid="button-send-sms">
              <Send className="h-4 w-4 mr-1"/>Send
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-3">
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Loading…</p>
          ) : threads.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No messages yet.</p>
          ) : (
            <div className="space-y-1">
              {threads.map(t => (
                <div key={t.peer} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 group" data-testid={`row-sms-${t.peer}`}>
                  <Avatar><AvatarFallback className={`${colorFor(t.name)} text-white text-sm`}>{initials(t.name)}</AvatarFallback></Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium truncate">{t.name}</p>
                      {t.unread > 0 && <Badge className="bg-indigo-600">{t.unread}</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{t.last.body}</p>
                  </div>
                  <Button size="icon" variant="ghost" className="opacity-0 group-hover:opacity-100 text-red-500" onClick={() => t.last && del.mutate(t.last.id)} data-testid={`button-delete-sms-${t.peer}`}>
                    <Trash2 className="h-4 w-4"/>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
