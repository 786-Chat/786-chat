import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import {
  Phone, PhoneCall, PhoneIncoming, PhoneOutgoing, PhoneMissed, PhoneOff,
  Mic, Music, Volume2, Voicemail, Settings, Users, Hash, Clock,
  ArrowLeft, Plus, Trash2, Edit, Play, Loader2, Sparkles, ListMusic,
  Headphones, MessageSquare, BarChart3, ShieldCheck, Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";
import { getRestaurantBySlug } from "@/lib/api";
import type { Restaurant } from "@shared/schema";
import WebPhoneApp from "@/components/link24-phone/web-phone-app";

interface CallLog {
  id: string;
  direction: "inbound" | "outbound" | "missed";
  fromNumber: string;
  toNumber: string;
  customerName?: string;
  status: string;
  startedAt: string;
  durationSeconds: number;
  recordingUrl?: string;
}

interface PbxCustomer {
  id: string;
  phoneNumber: string;
  name?: string;
  address?: string;
  totalCalls: number;
  totalOrders: number;
  lastCallAt?: string;
}

interface Extension {
  id: string;
  extensionNumber: string;
  displayName: string;
  registered: boolean;
  email?: string;
}

interface PhoneNumber {
  id: string;
  number: string;
  numberType: string;
  provider: string;
  monthlyCost: string;
  label?: string;
  status: string;
}

interface AudioFile {
  id: string;
  name: string;
  category: string;
  url: string;
  voice?: string;
  language?: string;
  text?: string;
}

interface CallSettings {
  holdMusicId?: string;
  busyMessageId?: string;
  voicemailGreetingId?: string;
  closedMessageId?: string;
  recordingMode: string;
  recordingRetentionDays: number;
  ringTimeoutSeconds: number;
  queueEnabled: boolean;
  instantAnswerMusic: boolean;
  instantAnswerGreetingId?: string;
  callerAnnouncement: boolean;
}

const VOICE_OPTIONS = [
  { value: "alloy", label: "Alloy (Neutral)" },
  { value: "echo", label: "Echo (Male, deep)" },
  { value: "fable", label: "Fable (British male)" },
  { value: "onyx", label: "Onyx (Strong male)" },
  { value: "nova", label: "Nova (Friendly female)" },
  { value: "shimmer", label: "Shimmer (Warm female)" },
];

const NUMBER_TYPES = [
  { value: "local", label: "UK Local (01/02)", cost: "£1/mo", color: "bg-blue-100 text-blue-800" },
  { value: "national", label: "UK National (03)", cost: "£2/mo", color: "bg-cyan-100 text-cyan-800" },
  { value: "mobile", label: "UK Mobile (07)", cost: "£3/mo", color: "bg-purple-100 text-purple-800" },
  { value: "freephone", label: "UK Freephone (0800)", cost: "£5/mo", color: "bg-emerald-100 text-emerald-800" },
];

const PLAN_TIERS = [
  { id: "basic", name: "Basic", price: 8, color: "from-slate-500 to-slate-700",
    features: ["1 number", "1 user", "Caller ID", "Customer history", "Voicemail"] },
  { id: "pro", name: "Pro", price: 15, color: "from-blue-500 to-indigo-700",
    features: ["2 numbers", "3 users", "Call recording", "IVR menu", "AI welcome voice", "Hold music"] },
  { id: "premium", name: "Premium", price: 25, color: "from-amber-500 to-orange-700",
    features: ["5 numbers", "Unlimited users", "AI transcription", "Multi-language", "Promo on hold", "Reports & analytics"] },
];

export default function Link24Phone() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [incomingCall, setIncomingCall] = useState<CallLog | null>(null);

  const { data: restaurant } = useQuery<Restaurant>({
    queryKey: ["/api/restaurants", slug],
    queryFn: () => getRestaurantBySlug(slug!),
    enabled: !!slug,
  });
  const restaurantId = restaurant?.id;

  const { data: stats } = useQuery<any>({
    queryKey: ["/api/pbx/stats", restaurantId],
    enabled: !!restaurantId,
    refetchInterval: 10000,
  });
  const { data: calls = [] } = useQuery<CallLog[]>({
    queryKey: ["/api/pbx/calls", restaurantId],
    enabled: !!restaurantId,
    refetchInterval: 5000,
  });
  const { data: customers = [] } = useQuery<PbxCustomer[]>({
    queryKey: ["/api/pbx/customers", restaurantId],
    enabled: !!restaurantId,
  });
  const { data: extensions = [] } = useQuery<Extension[]>({
    queryKey: ["/api/pbx/extensions", restaurantId],
    enabled: !!restaurantId,
  });
  const { data: numbers = [] } = useQuery<PhoneNumber[]>({
    queryKey: ["/api/pbx/numbers", restaurantId],
    enabled: !!restaurantId,
  });
  const { data: audioFiles = [] } = useQuery<AudioFile[]>({
    queryKey: ["/api/pbx/audio", restaurantId],
    enabled: !!restaurantId,
  });
  const { data: settings } = useQuery<CallSettings>({
    queryKey: ["/api/pbx/settings", restaurantId],
    enabled: !!restaurantId,
  });
  const { data: subscription } = useQuery<any>({
    queryKey: ["/api/pbx/subscriptions", restaurantId],
    enabled: !!restaurantId,
  });
  const { data: ivr } = useQuery<any>({
    queryKey: ["/api/pbx/ivr", restaurantId],
    enabled: !!restaurantId,
  });

  // Demo: simulate incoming call popup
  const simulateCall = () => {
    if (!calls.length) return toast({ title: "No call history yet", description: "Try receiving a real call first." });
    setIncomingCall(calls[0]);
    setTimeout(() => setIncomingCall(null), 8000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href={`/branch/${slug}`}>
            <Button variant="ghost" size="icon" data-testid="button-back"><ArrowLeft className="h-5 w-5" /></Button>
          </Link>
          <div className="flex items-center gap-3 flex-1">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <PhoneCall className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent" data-testid="text-app-title">
                Link24 Phone
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400" data-testid="text-restaurant-name">
                {restaurant?.name || "Loading..."}
              </p>
            </div>
          </div>
          <Badge variant="outline" className="hidden sm:flex items-center gap-1.5 border-emerald-300 bg-emerald-50 text-emerald-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            PBX Online
          </Badge>
          <Button size="sm" onClick={simulateCall} variant="outline" data-testid="button-simulate-call">
            <PhoneIncoming className="h-4 w-4 mr-1" /> Test Popup
          </Button>
        </div>
      </header>

      {/* Incoming call popup */}
      <AnimatePresence>
        {incomingCall && (
          <motion.div
            initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }}
            className="fixed top-20 right-4 z-50 w-96 max-w-[calc(100vw-2rem)]"
          >
            <Card className="border-2 border-emerald-500 shadow-2xl shadow-emerald-500/30 bg-white dark:bg-slate-900">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center animate-pulse">
                    <PhoneIncoming className="h-7 w-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-500 uppercase font-semibold">Incoming Call</p>
                    <p className="font-bold text-lg" data-testid="text-incoming-name">{incomingCall.customerName || "Unknown caller"}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{incomingCall.fromNumber}</p>
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 mb-3 text-sm">
                  <p className="text-slate-500">Last order: <span className="font-medium text-slate-900 dark:text-slate-100">14 days ago - £25</span></p>
                  <p className="text-slate-500">Total calls: <span className="font-medium text-slate-900 dark:text-slate-100">12</span></p>
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => setIncomingCall(null)}>
                    <Phone className="h-4 w-4 mr-1" /> Pickup
                  </Button>
                  <Button variant="destructive" className="flex-1" onClick={() => setIncomingCall(null)}>
                    <PhoneOff className="h-4 w-4 mr-1" /> Decline
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Plan badge */}
        {subscription && (
          <div className="mb-4 flex items-center justify-between flex-wrap gap-2 p-3 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              <span className="font-semibold">{subscription.plan?.toUpperCase() || "BASIC"} PLAN</span>
              <span className="text-blue-100">£{subscription.monthlyPrice || "8.00"}/month</span>
            </div>
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">{subscription.status}</Badge>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 sm:grid-cols-7 mb-6 h-auto bg-white/60 dark:bg-slate-800/60 backdrop-blur p-1.5 shadow-sm">
            <TabsTrigger value="phone" data-testid="tab-phone"><Phone className="h-4 w-4 mr-1.5"/>Phone</TabsTrigger>
            <TabsTrigger value="dashboard" data-testid="tab-dashboard"><BarChart3 className="h-4 w-4 mr-1.5"/>Dashboard</TabsTrigger>
            <TabsTrigger value="calls" data-testid="tab-calls"><Phone className="h-4 w-4 mr-1.5"/>Calls</TabsTrigger>
            <TabsTrigger value="customers" data-testid="tab-customers"><Users className="h-4 w-4 mr-1.5"/>Customers</TabsTrigger>
            <TabsTrigger value="ivr" data-testid="tab-ivr"><ListMusic className="h-4 w-4 mr-1.5"/>IVR & Voice</TabsTrigger>
            <TabsTrigger value="numbers" data-testid="tab-numbers"><Hash className="h-4 w-4 mr-1.5"/>Numbers</TabsTrigger>
            <TabsTrigger value="settings" data-testid="tab-settings"><Settings className="h-4 w-4 mr-1.5"/>Settings</TabsTrigger>
          </TabsList>

          {/* PHONE APP - new beautiful web phone */}
          <TabsContent value="phone">
            <WebPhoneApp restaurantId={restaurant.id}/>
          </TabsContent>

          {/* DASHBOARD */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={<PhoneIncoming/>} label="Today" value={stats?.today || 0} color="from-blue-500 to-indigo-600" testId="stat-today" />
              <StatCard icon={<Phone/>} label="This Week" value={stats?.week || 0} color="from-emerald-500 to-teal-600" testId="stat-week" />
              <StatCard icon={<PhoneMissed/>} label="Missed (week)" value={stats?.missed || 0} color="from-rose-500 to-red-600" testId="stat-missed" />
              <StatCard icon={<Clock/>} label="Avg Duration" value={`${Math.round((stats?.avgDuration || 0) / 60)}m`} color="from-amber-500 to-orange-600" testId="stat-avg" />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><PhoneCall className="h-5 w-5 text-blue-600"/>Recent Calls</CardTitle>
                </CardHeader>
                <CardContent>
                  {calls.length === 0 ? (
                    <EmptyState icon={<Phone/>} title="No calls yet" hint="Calls will show here when customers ring your shop." />
                  ) : (
                    <div className="space-y-2">
                      {calls.slice(0, 6).map(c => <CallRow key={c.id} call={c} />)}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-amber-500"/>Upgrade Plan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {PLAN_TIERS.map(tier => (
                    <div key={tier.id} className={`p-4 rounded-xl bg-gradient-to-r ${tier.color} text-white shadow-md`}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-lg">{tier.name}</span>
                        <span className="text-xl font-bold">£{tier.price}<span className="text-sm font-normal opacity-80">/mo</span></span>
                      </div>
                      <ul className="text-sm space-y-1 opacity-95">
                        {tier.features.map((f, i) => <li key={i}>• {f}</li>)}
                      </ul>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* CALLS */}
          <TabsContent value="calls">
            <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Phone className="h-5 w-5"/>Call History</CardTitle>
              </CardHeader>
              <CardContent>
                {calls.length === 0 ? (
                  <EmptyState icon={<Phone/>} title="No calls yet" hint="Once your shop is set up, every call will appear here with caller info, duration, and recording (if enabled)." />
                ) : (
                  <div className="space-y-2">
                    {calls.map(c => <CallRow key={c.id} call={c} expanded />)}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* CUSTOMERS */}
          <TabsContent value="customers">
            <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5"/>Customer Phone Book</CardTitle>
                <p className="text-sm text-slate-500">Auto-built from incoming calls. Add notes, addresses, and tags.</p>
              </CardHeader>
              <CardContent>
                {customers.length === 0 ? (
                  <EmptyState icon={<Users/>} title="No customers yet" hint="Customers will appear here automatically when they call your shop." />
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {customers.map(c => (
                      <div key={c.id} className="p-3 rounded-lg border bg-white dark:bg-slate-800 hover:shadow-md transition" data-testid={`card-customer-${c.id}`}>
                        <p className="font-semibold">{c.name || "Unknown"}</p>
                        <p className="text-sm text-slate-500">{c.phoneNumber}</p>
                        <div className="flex gap-2 mt-2 text-xs text-slate-500">
                          <span>{c.totalCalls} calls</span>
                          <span>•</span>
                          <span>{c.totalOrders} orders</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* IVR & VOICE */}
          <TabsContent value="ivr" className="space-y-6">
            <IVRCard restaurantId={restaurantId} ivr={ivr} audioFiles={audioFiles} />
            <AudioLibraryCard restaurantId={restaurantId} audioFiles={audioFiles} />
          </TabsContent>

          {/* NUMBERS */}
          <TabsContent value="numbers" className="space-y-6">
            <NumbersCard restaurantId={restaurantId} numbers={numbers} />
            <ExtensionsCard restaurantId={restaurantId} extensions={extensions} />
          </TabsContent>

          {/* SETTINGS */}
          <TabsContent value="settings">
            <CallSettingsCard restaurantId={restaurantId} settings={settings} audioFiles={audioFiles} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// =====================
// Sub-components
// =====================

function StatCard({ icon, label, value, color, testId }: any) {
  return (
    <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur overflow-hidden">
      <CardContent className="p-4">
        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center text-white mb-2 shadow-md`}>
          {icon}
        </div>
        <p className="text-xs text-slate-500 uppercase font-semibold">{label}</p>
        <p className="text-2xl font-bold" data-testid={testId}>{value}</p>
      </CardContent>
    </Card>
  );
}

function EmptyState({ icon, title, hint }: any) {
  return (
    <div className="text-center py-10 px-4">
      <div className="w-14 h-14 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
        {icon}
      </div>
      <p className="font-medium">{title}</p>
      <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">{hint}</p>
    </div>
  );
}

function CallRow({ call, expanded }: { call: CallLog; expanded?: boolean }) {
  const directionIcon = call.status === "missed" ? <PhoneMissed className="h-4 w-4 text-rose-500"/>
    : call.direction === "outbound" ? <PhoneOutgoing className="h-4 w-4 text-blue-500"/>
    : <PhoneIncoming className="h-4 w-4 text-emerald-500"/>;
  const dur = `${Math.floor(call.durationSeconds / 60)}:${String(call.durationSeconds % 60).padStart(2, "0")}`;
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition" data-testid={`row-call-${call.id}`}>
      {directionIcon}
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{call.customerName || call.fromNumber}</p>
        <p className="text-xs text-slate-500">{new Date(call.startedAt).toLocaleString()}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-mono">{dur}</p>
        {call.recordingUrl && <Button size="sm" variant="ghost" className="h-7 px-2"><Play className="h-3 w-3"/></Button>}
      </div>
    </div>
  );
}

function IVRCard({ restaurantId, ivr, audioFiles }: any) {
  const qc = useQueryClient();
  const [welcomeText, setWelcomeText] = useState(ivr?.welcomeText || "");
  const [voice, setVoice] = useState(ivr?.welcomeVoice || "fable");
  const [enabled, setEnabled] = useState(ivr?.enabled ?? true);
  const [options, setOptions] = useState<any[]>(ivr?.options || [
    { digit: "1", label: "Place an order", action: "extension", target: "" },
    { digit: "2", label: "Book a table", action: "extension", target: "" },
    { digit: "3", label: "Speak to manager", action: "extension", target: "" },
  ]);

  useEffect(() => {
    if (ivr) {
      setWelcomeText(ivr.welcomeText || "");
      setVoice(ivr.welcomeVoice || "fable");
      setEnabled(ivr.enabled ?? true);
      if (ivr.options?.length) setOptions(ivr.options);
    }
  }, [ivr]);

  const saveMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", `/api/pbx/ivr/${restaurantId}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/pbx/ivr", restaurantId] }); toast({ title: "IVR saved" }); },
  });

  const generateVoiceMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/pbx/audio/generate", {
      restaurantId, text: welcomeText, voice, category: "welcome", name: "IVR Welcome",
    }).then(r => r.json()),
    onSuccess: (audio: any) => {
      qc.invalidateQueries({ queryKey: ["/api/pbx/audio", restaurantId] });
      saveMutation.mutate({ welcomeText, welcomeVoice: voice, welcomeAudioUrl: audio.url, enabled, options });
      toast({ title: "AI voice generated", description: "Welcome message ready!" });
    },
    onError: (e: any) => toast({ title: "Failed to generate voice", description: e.message, variant: "destructive" }),
  });

  return (
    <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2"><ListMusic className="h-5 w-5 text-indigo-600"/>IVR Menu (Press 1, 2, 3...)</CardTitle>
          <Switch checked={enabled} onCheckedChange={setEnabled} data-testid="switch-ivr-enabled" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Welcome Message Text</Label>
          <Textarea value={welcomeText} onChange={e => setWelcomeText(e.target.value)} rows={3}
            placeholder="Welcome to Dhaba Restaurant. Press 1 for orders, press 2 for booking, press 3 to speak to a manager."
            data-testid="input-welcome-text" />
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <Label>AI Voice</Label>
            <Select value={voice} onValueChange={setVoice}>
              <SelectTrigger data-testid="select-voice"><SelectValue/></SelectTrigger>
              <SelectContent>
                {VOICE_OPTIONS.map(v => <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button onClick={() => generateVoiceMutation.mutate()} disabled={!welcomeText || generateVoiceMutation.isPending}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600" data-testid="button-generate-voice">
              {generateVoiceMutation.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin"/> : <Sparkles className="h-4 w-4 mr-1"/>}
              Generate AI Voice
            </Button>
          </div>
        </div>

        {ivr?.welcomeAudioUrl && (
          <div className="flex items-center gap-2 p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg">
            <Volume2 className="h-4 w-4 text-indigo-600"/>
            <span className="text-sm flex-1">Current welcome audio</span>
            <audio controls src={ivr.welcomeAudioUrl} className="h-8" />
          </div>
        )}

        <div>
          <Label className="mb-2 block">Menu Options</Label>
          <div className="space-y-2">
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <span className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center">{opt.digit}</span>
                <Input value={opt.label} onChange={e => { const c = [...options]; c[i].label = e.target.value; setOptions(c); }}
                  placeholder="e.g. Place an order" data-testid={`input-option-${i}`} />
                <Button size="icon" variant="ghost" onClick={() => setOptions(options.filter((_, idx) => idx !== i))}>
                  <Trash2 className="h-4 w-4"/>
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => setOptions([...options, { digit: String(options.length + 1), label: "", action: "extension", target: "" }])}>
              <Plus className="h-4 w-4 mr-1"/> Add Option
            </Button>
          </div>
        </div>

        <Button onClick={() => saveMutation.mutate({ welcomeText, welcomeVoice: voice, enabled, options })}
          disabled={saveMutation.isPending} className="w-full" data-testid="button-save-ivr">
          {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin"/>}
          Save IVR Menu
        </Button>
      </CardContent>
    </Card>
  );
}

function AudioLibraryCard({ restaurantId, audioFiles }: any) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [category, setCategory] = useState("hold_music");
  const [voice, setVoice] = useState("fable");
  const [name, setName] = useState("");

  const generateMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/pbx/audio/generate", { restaurantId, text, voice, category, name }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/pbx/audio", restaurantId] });
      setOpen(false); setText(""); setName("");
      toast({ title: "Audio generated" });
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/pbx/audio/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/pbx/audio", restaurantId] }),
  });

  return (
    <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2"><Music className="h-5 w-5 text-purple-600"/>Audio Library</CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" data-testid="button-add-audio"><Plus className="h-4 w-4 mr-1"/> Generate Audio</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Generate AI Audio</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Name</Label>
                  <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Busy message" />
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="welcome">Welcome message</SelectItem>
                      <SelectItem value="busy">Busy / "Please hold"</SelectItem>
                      <SelectItem value="voicemail">Voicemail greeting</SelectItem>
                      <SelectItem value="closed">Closed hours</SelectItem>
                      <SelectItem value="hold_music">Hold music message</SelectItem>
                      <SelectItem value="instant_answer">Instant answer greeting</SelectItem>
                      <SelectItem value="promo">Promotional message</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Voice</Label>
                  <Select value={voice} onValueChange={setVoice}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                      {VOICE_OPTIONS.map(v => <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Text</Label>
                  <Textarea rows={4} value={text} onChange={e => setText(e.target.value)} placeholder="Enter what the AI voice should say..." />
                </div>
                <Button onClick={() => generateMutation.mutate()} disabled={!text || generateMutation.isPending} className="w-full">
                  {generateMutation.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin"/> : <Sparkles className="h-4 w-4 mr-1"/>}
                  Generate Voice
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {audioFiles.length === 0 ? (
          <EmptyState icon={<Music/>} title="No audio yet" hint="Generate AI voice messages or upload custom audio files." />
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {audioFiles.map((a: AudioFile) => (
              <div key={a.id} className="p-3 rounded-lg border bg-white dark:bg-slate-800" data-testid={`card-audio-${a.id}`}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium text-sm">{a.name}</p>
                    <Badge variant="secondary" className="text-xs">{a.category}</Badge>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(a.id)}>
                    <Trash2 className="h-4 w-4"/>
                  </Button>
                </div>
                <audio controls src={a.url} className="w-full h-8" />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function NumbersCard({ restaurantId, numbers }: any) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [number, setNumber] = useState("");
  const [type, setType] = useState("local");
  const [label, setLabel] = useState("");

  const addMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/pbx/numbers", {
      restaurantId, number, numberType: type, label,
      monthlyCost: NUMBER_TYPES.find(t => t.value === type)?.cost.replace(/[^0-9.]/g, "") || "1.00",
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/pbx/numbers", restaurantId] }); setOpen(false); setNumber(""); setLabel(""); },
  });
  const delMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/pbx/numbers/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/pbx/numbers", restaurantId] }),
  });

  return (
    <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2"><Hash className="h-5 w-5 text-emerald-600"/>Phone Numbers</CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" data-testid="button-add-number"><Plus className="h-4 w-4 mr-1"/> Add Number</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Phone Number</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Number Type</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                      {NUMBER_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label} - {t.cost}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Phone Number</Label>
                  <Input value={number} onChange={e => setNumber(e.target.value)} placeholder="+44 121 XXX XXXX" />
                </div>
                <div>
                  <Label>Label (optional)</Label>
                  <Input value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. Main Line, Delivery" />
                </div>
                <Button onClick={() => addMutation.mutate()} disabled={!number || addMutation.isPending} className="w-full">
                  Add Number
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {numbers.length === 0 ? (
          <EmptyState icon={<Hash/>} title="No numbers yet" hint="Add a phone number for customers to call you on. Buy from Voipfone or port your existing BT number." />
        ) : (
          <div className="space-y-2">
            {numbers.map((n: PhoneNumber) => {
              const nt = NUMBER_TYPES.find(t => t.value === n.numberType);
              return (
                <div key={n.id} className="flex items-center gap-3 p-3 rounded-lg border bg-white dark:bg-slate-800" data-testid={`row-number-${n.id}`}>
                  <Phone className="h-5 w-5 text-emerald-600"/>
                  <div className="flex-1">
                    <p className="font-mono font-semibold">{n.number}</p>
                    {n.label && <p className="text-xs text-slate-500">{n.label}</p>}
                  </div>
                  <Badge className={nt?.color}>{nt?.label || n.numberType}</Badge>
                  <span className="text-sm text-slate-500">£{n.monthlyCost}/mo</span>
                  <Button size="icon" variant="ghost" onClick={() => delMutation.mutate(n.id)}>
                    <Trash2 className="h-4 w-4"/>
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ExtensionsCard({ restaurantId, extensions }: any) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [extNumber, setExtNumber] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const addMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/pbx/extensions", {
      restaurantId, extensionNumber: extNumber, displayName: name, email,
      sipPassword: Math.random().toString(36).slice(2, 14),
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/pbx/extensions", restaurantId] }); setOpen(false); setExtNumber(""); setName(""); setEmail(""); },
  });
  const delMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/pbx/extensions/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/pbx/extensions", restaurantId] }),
  });

  return (
    <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2"><Headphones className="h-5 w-5 text-blue-600"/>Staff Extensions</CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" data-testid="button-add-extension"><Plus className="h-4 w-4 mr-1"/> Add Staff</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Staff Extension</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Extension #</Label><Input value={extNumber} onChange={e => setExtNumber(e.target.value)} placeholder="101" /></div>
                <div><Label>Name</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Manager" /></div>
                <div><Label>Email (for voicemail)</Label><Input value={email} onChange={e => setEmail(e.target.value)} placeholder="staff@shop.co.uk" /></div>
                <Button onClick={() => addMutation.mutate()} disabled={!extNumber || !name || addMutation.isPending} className="w-full">
                  Add Extension
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {extensions.length === 0 ? (
          <EmptyState icon={<Headphones/>} title="No staff yet" hint="Add staff extensions so each team member can take calls from their phone or browser." />
        ) : (
          <div className="space-y-2">
            {extensions.map((e: Extension) => (
              <div key={e.id} className="flex items-center gap-3 p-3 rounded-lg border bg-white dark:bg-slate-800" data-testid={`row-extension-${e.id}`}>
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center font-bold text-blue-700 dark:text-blue-300">
                  {e.extensionNumber}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{e.displayName}</p>
                  {e.email && <p className="text-xs text-slate-500">{e.email}</p>}
                </div>
                {e.registered ? (
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">Online</Badge>
                ) : (
                  <Badge variant="outline" className="text-slate-500">Offline</Badge>
                )}
                <Button size="icon" variant="ghost" onClick={() => delMutation.mutate(e.id)}>
                  <Trash2 className="h-4 w-4"/>
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CallSettingsCard({ restaurantId, settings, audioFiles }: any) {
  const qc = useQueryClient();
  const [s, setS] = useState<CallSettings>({
    recordingMode: "off", recordingRetentionDays: 30, ringTimeoutSeconds: 30,
    queueEnabled: false, instantAnswerMusic: false, callerAnnouncement: true,
    ...settings,
  });

  useEffect(() => { if (settings) setS({ ...s, ...settings }); }, [settings]);

  const saveMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/pbx/settings/${restaurantId}`, s),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/pbx/settings", restaurantId] }); toast({ title: "Settings saved" }); },
  });

  const audioByCategory = (cat: string) => audioFiles.filter((a: AudioFile) => a.category === cat);

  return (
    <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5"/>Call Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Instant Answer Music */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/40 dark:to-pink-950/40 border border-purple-200 dark:border-purple-800">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-purple-600"/>
                <Label className="font-semibold text-purple-900 dark:text-purple-100">Instant Answer Music</Label>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                When customer calls — instead of ringing, music plays immediately. Customer feels someone is "with them" right away.
              </p>
            </div>
            <Switch checked={s.instantAnswerMusic} onCheckedChange={v => setS({ ...s, instantAnswerMusic: v })} data-testid="switch-instant-answer" />
          </div>
          {s.instantAnswerMusic && (
            <div className="mt-3">
              <Label className="text-xs">Greeting played first (optional)</Label>
              <Select value={s.instantAnswerGreetingId || "none"} onValueChange={v => setS({ ...s, instantAnswerGreetingId: v === "none" ? undefined : v })}>
                <SelectTrigger><SelectValue placeholder="No greeting - go straight to music"/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No greeting (just music)</SelectItem>
                  {audioByCategory("instant_answer").map((a: AudioFile) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                  {audioByCategory("welcome").map((a: AudioFile) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Hold Music */}
        <div>
          <Label className="flex items-center gap-2 mb-2"><Music className="h-4 w-4"/>Hold Music</Label>
          <Select value={s.holdMusicId || "default"} onValueChange={v => setS({ ...s, holdMusicId: v === "default" ? undefined : v })}>
            <SelectTrigger data-testid="select-hold-music"><SelectValue placeholder="Default relaxing"/></SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default (relaxing instrumental)</SelectItem>
              {audioByCategory("hold_music").map((a: AudioFile) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Busy Message */}
        <div>
          <Label className="flex items-center gap-2 mb-2"><MessageSquare className="h-4 w-4"/>Busy / "Please Hold" Message</Label>
          <Select value={s.busyMessageId || "none"} onValueChange={v => setS({ ...s, busyMessageId: v === "none" ? undefined : v })}>
            <SelectTrigger><SelectValue placeholder="None - just music"/></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None (just music)</SelectItem>
              {audioByCategory("busy").map((a: AudioFile) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Voicemail */}
        <div>
          <Label className="flex items-center gap-2 mb-2"><Voicemail className="h-4 w-4"/>Voicemail Greeting</Label>
          <Select value={s.voicemailGreetingId || "default"} onValueChange={v => setS({ ...s, voicemailGreetingId: v === "default" ? undefined : v })}>
            <SelectTrigger><SelectValue placeholder="Default greeting"/></SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default greeting</SelectItem>
              {audioByCategory("voicemail").map((a: AudioFile) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Recording */}
        <div>
          <Label className="flex items-center gap-2 mb-2"><Mic className="h-4 w-4"/>Call Recording</Label>
          <Select value={s.recordingMode} onValueChange={v => setS({ ...s, recordingMode: v })}>
            <SelectTrigger data-testid="select-recording"><SelectValue/></SelectTrigger>
            <SelectContent>
              <SelectItem value="off">Off (no recording)</SelectItem>
              <SelectItem value="all">All calls</SelectItem>
              <SelectItem value="inbound">Inbound only</SelectItem>
              <SelectItem value="outbound">Outbound only</SelectItem>
              <SelectItem value="on_demand">On-demand (press *1)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Ring Timeout */}
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <Label>Ring Timeout (seconds)</Label>
            <Input type="number" value={s.ringTimeoutSeconds} onChange={e => setS({ ...s, ringTimeoutSeconds: parseInt(e.target.value) || 30 })} />
          </div>
          <div>
            <Label>Recording Retention (days)</Label>
            <Input type="number" value={s.recordingRetentionDays} onChange={e => setS({ ...s, recordingRetentionDays: parseInt(e.target.value) || 30 })} />
          </div>
        </div>

        {/* Queue & Announcement */}
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div>
              <Label>Call Queue</Label>
              <p className="text-xs text-slate-500">Hold callers in queue when all staff busy</p>
            </div>
            <Switch checked={s.queueEnabled} onCheckedChange={v => setS({ ...s, queueEnabled: v })} />
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div>
              <Label>Caller Announcement</Label>
              <p className="text-xs text-slate-500">"Calls may be recorded" message at start (UK GDPR)</p>
            </div>
            <Switch checked={s.callerAnnouncement} onCheckedChange={v => setS({ ...s, callerAnnouncement: v })} />
          </div>
        </div>

        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="w-full" data-testid="button-save-settings">
          {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin"/>}
          Save Settings
        </Button>
      </CardContent>
    </Card>
  );
}
