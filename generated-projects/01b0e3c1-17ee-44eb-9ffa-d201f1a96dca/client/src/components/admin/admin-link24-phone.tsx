import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Phone, Server, Wifi, ShieldCheck, Save, Loader2, ExternalLink,
  PhoneCall, Headphones, Globe, ShoppingCart, Building2, Hash,
  CheckCircle2, AlertCircle, Cable, Monitor, Smartphone, Tablet, Cloud, Sparkles,
  Receipt, TrendingUp, Ban, RotateCw, PoundSterling, MessageSquare, IdCard,
  Plus, Trash2, Megaphone, Inbox,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const PLAN_TEMPLATES = [
  { plan: "free-internet", monthlyPrice: "0.00",  includedOutgoingMinutes: 0,    extraMinuteRate: "0.0000", monthlyMinutesCap: 0,    maxExtensions: 1,  maxNumbers: 0, status: "active", label: "🌐 Free Internet",   color: "from-slate-400 to-slate-600", badge: "ACQUISITION", note: "Unlimited app-to-app calls + SMS between Link24 users. No real number. £0 cost to you." },
  { plan: "trial-6mo",     monthlyPrice: "0.00",  includedOutgoingMinutes: 600,  extraMinuteRate: "0.0200", monthlyMinutesCap: 800,   maxExtensions: 1, maxNumbers: 1, status: "trial",  trialMonths: 6, label: "FREE 6-Month Trial", color: "from-emerald-500 to-teal-600", badge: "PROMO" },
  { plan: "starter",       monthlyPrice: "4.99",  includedOutgoingMinutes: 100,  extraMinuteRate: "0.0200", monthlyMinutesCap: 1500,  maxExtensions: 1, maxNumbers: 1, status: "active", label: "Starter", color: "from-blue-500 to-cyan-500", note: "UK number + 100 mins. Internet calls FREE. Profit ~£3.50/shop." },
  { plan: "standard",      monthlyPrice: "8.99",  includedOutgoingMinutes: 500,  extraMinuteRate: "0.0150", monthlyMinutesCap: 3000,  maxExtensions: 2, maxNumbers: 1, status: "active", label: "Standard", color: "from-indigo-500 to-purple-500", note: "UK + 500 mins. SMS included. Profit ~£5.20/shop." },
  { plan: "pro",           monthlyPrice: "14.99", includedOutgoingMinutes: 1500, extraMinuteRate: "0.0100", monthlyMinutesCap: 6000,  maxExtensions: 5, maxNumbers: 2, status: "active", label: "Pro",     color: "from-purple-600 to-pink-600", badge: "POPULAR", note: "UK+PK calls, 1500 mins, SMS, display number. Profit ~£8.30/shop." },
  { plan: "unlimited",     monthlyPrice: "24.99", includedOutgoingMinutes: 5000, extraMinuteRate: "0.0080", monthlyMinutesCap: 15000, maxExtensions: 10, maxNumbers: 5, status: "active", label: "Unlimited", color: "from-pink-600 to-rose-700", note: "Fair-use everything. Multi-extension. Profit ~£14+/shop." },
  // 🇵🇰 Pakistan Diaspora Plans
  { plan: "pk-payg",      monthlyPrice: "0.00",  includedOutgoingMinutes: 0,    extraMinuteRate: "0.0300", monthlyMinutesCap: 1000,  maxExtensions: 1, maxNumbers: 1, status: "active", label: "🇵🇰 PK Pay-As-You-Go", color: "from-slate-500 to-slate-700", region: "PK", note: "No monthly fee. 3p/min PK landline & mobile." },
  { plan: "pk-lite",      monthlyPrice: "8.00",  includedOutgoingMinutes: 200,  extraMinuteRate: "0.0250", monthlyMinutesCap: 1000,  maxExtensions: 1, maxNumbers: 1, status: "active", label: "🇵🇰 Family Lite",      color: "from-green-500 to-emerald-600", region: "PK", note: "200 free PK mins/mo. Perfect for weekly family calls." },
  { plan: "pk-plus",      monthlyPrice: "15.00", includedOutgoingMinutes: 800,  extraMinuteRate: "0.0200", monthlyMinutesCap: 3000,  maxExtensions: 2, maxNumbers: 1, status: "active", label: "🇵🇰 Family Plus",      color: "from-orange-500 to-red-500",   region: "PK", note: "800 free PK mins/mo. Daily 25-min calls covered." },
  { plan: "pk-unlimited", monthlyPrice: "20.00", includedOutgoingMinutes: 3000, extraMinuteRate: "0.0150", monthlyMinutesCap: 5000,  maxExtensions: 3, maxNumbers: 2, status: "active", label: "🇵🇰 Family Unlimited",  color: "from-pink-600 to-rose-700",    region: "PK", badge: "POPULAR", note: "3000 mins fair-use cap (~100 mins/day). Switch to PTCL wholesale at 50+ customers for true unlimited." },
];

const VOIPFONE_NUMBER_PRICES = [
  { type: "UK Local (01/02)", price: "£1/month", inbound: "FREE", note: "Best for shops - looks like BT line", color: "bg-blue-100 text-blue-800 border-blue-300" },
  { type: "UK National (03)", price: "£2/month", inbound: "FREE", note: "Local-rate from mobile - good middle option", color: "bg-cyan-100 text-cyan-800 border-cyan-300" },
  { type: "UK Mobile (07)", price: "£3/month", inbound: "FREE", note: "Looks like normal mobile - test first", color: "bg-purple-100 text-purple-800 border-purple-300" },
  { type: "UK Freephone (0800)", price: "£5/month", inbound: "3p/min", note: "Great marketing - customer pays nothing", color: "bg-emerald-100 text-emerald-800 border-emerald-300" },
];

export function AdminLink24Phone() {
  const [tab, setTab] = useState("overview");

  return (
    <div className="space-y-3 p-3 md:p-4 text-sm">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-13 h-auto gap-0.5 p-0.5">
          <TabsTrigger className="text-[11px] px-1.5 py-1 h-7" value="overview" data-testid="tab-admin-overview"><Server className="h-3 w-3 mr-1"/>Overview</TabsTrigger>
          <TabsTrigger className="text-[11px] px-1.5 py-1 h-7" value="trunks" data-testid="tab-admin-trunks"><Cloud className="h-3 w-3 mr-1"/>Trunks</TabsTrigger>
          <TabsTrigger className="text-[11px] px-1.5 py-1 h-7" value="phone-numbers" data-testid="tab-admin-phone-numbers"><Phone className="h-3 w-3 mr-1"/>Numbers</TabsTrigger>
          <TabsTrigger className="text-[11px] px-1.5 py-1 h-7" value="ring-groups" data-testid="tab-admin-ring-groups"><Globe className="h-3 w-3 mr-1"/>Rings</TabsTrigger>
          <TabsTrigger className="text-[11px] px-1.5 py-1 h-7" value="cloud-bridge" data-testid="tab-admin-cloud-bridge"><Wifi className="h-3 w-3 mr-1"/>Bridge</TabsTrigger>
          <TabsTrigger className="text-[11px] px-1.5 py-1 h-7" value="billing" data-testid="tab-admin-billing"><Receipt className="h-3 w-3 mr-1"/>Billing</TabsTrigger>
          <TabsTrigger className="text-[11px] px-1.5 py-1 h-7" value="profit" data-testid="tab-admin-profit"><Receipt className="h-3 w-3 mr-1"/>Profit</TabsTrigger>
          <TabsTrigger className="text-[11px] px-1.5 py-1 h-7" value="server" data-testid="tab-admin-server"><Cable className="h-3 w-3 mr-1"/>UCM</TabsTrigger>
          <TabsTrigger className="text-[11px] px-1.5 py-1 h-7" value="subscriptions" data-testid="tab-admin-subs"><Building2 className="h-3 w-3 mr-1"/>Shops</TabsTrigger>
          <TabsTrigger className="text-[11px] px-1.5 py-1 h-7" value="numbers" data-testid="tab-admin-numbers"><Hash className="h-3 w-3 mr-1"/>Buy#</TabsTrigger>
          <TabsTrigger className="text-[11px] px-1.5 py-1 h-7" value="desk-phones" data-testid="tab-admin-desk"><Headphones className="h-3 w-3 mr-1"/>Phones</TabsTrigger>
          <TabsTrigger className="text-[11px] px-1.5 py-1 h-7" value="offers" data-testid="tab-admin-offers"><Megaphone className="h-3 w-3 mr-1"/>Offers</TabsTrigger>
          <TabsTrigger className="text-[11px] px-1.5 py-1 h-7" value="inquiries" data-testid="tab-admin-inquiries"><Inbox className="h-3 w-3 mr-1"/>Inquiries</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          <OverviewSection />
        </TabsContent>
        <TabsContent value="trunks" className="mt-4 space-y-4">
          <TrunksSection />
        </TabsContent>
        <TabsContent value="phone-numbers" className="mt-4 space-y-4">
          <PhoneNumbersSection />
        </TabsContent>
        <TabsContent value="ring-groups" className="mt-4 space-y-4">
          <RingGroupsSection />
        </TabsContent>
        <TabsContent value="cloud-bridge" className="mt-4 space-y-4">
          <CloudBridgeSection />
        </TabsContent>
        <TabsContent value="profit" className="mt-4 space-y-4">
          <ProfitSection />
        </TabsContent>
        <TabsContent value="billing" className="mt-4 space-y-4">
          <BillingSection />
        </TabsContent>
        <TabsContent value="server" className="mt-4 space-y-4">
          <ServerSection />
          <ExtensionsManagerSection />
        </TabsContent>
        <TabsContent value="subscriptions" className="mt-4">
          <SubscriptionsSection />
        </TabsContent>
        <TabsContent value="numbers" className="mt-4 space-y-4">
          <NumbersSupplierGuide />
        </TabsContent>
        <TabsContent value="desk-phones" className="mt-4 space-y-4">
          <DeskPhoneGuide />
        </TabsContent>
        <TabsContent value="offers" className="mt-4 space-y-4">
          <SiteSettingsCard />
          <OffersSection />
        </TabsContent>
        <TabsContent value="inquiries" className="mt-4 space-y-4">
          <InquiriesSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function OverviewSection() {
  const { data: server } = useQuery<any>({ queryKey: ["/api/pbx/server"] });
  const { data: subs = [] } = useQuery<any[]>({ queryKey: ["/api/pbx/subscriptions"] });

  const totalRevenue = subs.reduce((sum, s) => sum + parseFloat(s.monthlyPrice || "0"), 0);
  const activeShops = subs.filter(s => s.status === "active").length;
  const trialShops = subs.filter(s => s.status === "trial").length;

  const baseUrl = "https://link24.cloud";
  const links = [
    { label: "Customer Webphone (give to your customers)", url: `${baseUrl}/phone/app`, color: "from-emerald-500 to-teal-600", icon: "📞" },
    { label: "Phone landing page (sales)", url: `${baseUrl}/phone`, color: "from-blue-500 to-indigo-600", icon: "🌐" },
    { label: "Customer login portal", url: `${baseUrl}/link24-phone-login`, color: "from-purple-500 to-pink-600", icon: "🔐" },
    { label: "Admin (this page)", url: `${baseUrl}/link24-phone-admin`, color: "from-slate-600 to-slate-800", icon: "⚙️" },
  ];
  function copy(s: string) {
    try { navigator.clipboard.writeText(s); toast({ title: "Copied!", description: s }); } catch {}
  }

  return (
    <>
      <Card className="border-2 border-emerald-300 dark:border-emerald-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">🔗 Your Webphone Access Links</CardTitle>
          <p className="text-xs text-muted-foreground">Share these URLs with customers. They open instantly in any browser — no install.</p>
        </CardHeader>
        <CardContent className="space-y-2">
          {links.map((l) => (
            <div key={l.url} className={`rounded-lg p-2.5 bg-gradient-to-r ${l.color} text-white`}>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold opacity-90 flex items-center gap-1.5">
                    <span>{l.icon}</span>{l.label}
                  </div>
                  <div className="font-mono text-sm truncate" data-testid={`link-url-${l.url.split("/").pop()}`}>{l.url}</div>
                </div>
                <div className="flex gap-1.5">
                  <Button size="sm" variant="secondary" className="h-7" onClick={() => copy(l.url)} data-testid={`button-copy-${l.url.split("/").pop()}`}>Copy</Button>
                  <a href={l.url} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="secondary" className="h-7"><ExternalLink className="h-3 w-3"/></Button>
                  </a>
                </div>
              </div>
            </div>
          ))}
          <p className="text-[11px] text-muted-foreground pt-1">💡 Customer flow: Create extension here → give them <strong>Extension #</strong> + <strong>Password</strong> → they open the Customer Webphone link → sign in → ready to call.</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Card>
          <CardContent className="p-2.5">
            <Building2 className="h-4 w-4 text-blue-600 mb-0.5" />
            <p className="text-[10px] text-muted-foreground">Active Shops</p>
            <p className="text-lg font-bold leading-tight" data-testid="stat-active-shops">{activeShops}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-2.5">
            <PhoneCall className="h-4 w-4 text-amber-600 mb-0.5" />
            <p className="text-[10px] text-muted-foreground">Trial Shops</p>
            <p className="text-lg font-bold leading-tight">{trialShops}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-2.5">
            <ShoppingCart className="h-4 w-4 text-emerald-600 mb-0.5" />
            <p className="text-[10px] text-muted-foreground">Monthly Revenue</p>
            <p className="text-lg font-bold leading-tight">£{totalRevenue.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-2.5">
            <Server className="h-4 w-4 text-indigo-600 mb-0.5" />
            <p className="text-[10px] text-muted-foreground">PBX Status</p>
            {(() => {
              const bridgeActive = server?.cloudBridgeStatus === "active" && server?.cloudBridgeType && server.cloudBridgeType !== "none";
              const isOnline = server?.status === "online" || bridgeActive;
              const label = bridgeActive ? `Online (${server.cloudBridgeType})` : (server?.status || (server?.host ? "Configured" : "Not configured"));
              return (
                <Badge className={isOnline ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""} variant={isOnline ? "default" : "secondary"}>
                  {isOnline ? "● " : ""}{label}
                </Badge>
              );
            })()}
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden border border-blue-200 dark:border-blue-800">
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-3">
          <div className="flex items-center gap-2 mb-0.5">
            <Cloud className="h-4 w-4" />
            <h3 className="text-sm font-bold">100% Cloud — No Hardware Needed</h3>
            <Sparkles className="h-3 w-3 text-yellow-300" />
          </div>
          <p className="text-blue-50 text-[11px]">Works on every device the shop already owns.</p>
        </div>
        <CardContent className="p-3 space-y-2">
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200 dark:border-blue-800 text-center">
              <Monitor className="h-5 w-5 text-blue-600 mx-auto mb-0.5" />
              <h4 className="font-semibold text-xs">Desktop</h4>
              <p className="text-[10px] text-muted-foreground leading-tight">Chrome/Edge/Safari + USB headset</p>
            </div>
            <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-200 dark:border-emerald-800 text-center">
              <Smartphone className="h-5 w-5 text-emerald-600 mx-auto mb-0.5" />
              <h4 className="font-semibold text-xs">Mobile</h4>
              <p className="text-[10px] text-muted-foreground leading-tight">iPhone & Android, add to home</p>
            </div>
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/40 dark:to-pink-950/40 border border-purple-200 dark:border-purple-800 text-center">
              <Tablet className="h-5 w-5 text-purple-600 mx-auto mb-0.5" />
              <h4 className="font-semibold text-xs">Tablet</h4>
              <p className="text-[10px] text-muted-foreground leading-tight">Counter view + caller history</p>
            </div>
          </div>

          <div className="p-2 rounded bg-slate-50 dark:bg-slate-800 text-[11px]">
            <span className="font-semibold flex items-center gap-1"><Wifi className="h-3 w-3"/>Call flow:</span>
            <span className="font-mono text-muted-foreground">Customer → Voipfone → UCM6302 → Cloud app → Staff answers</span>
          </div>

          <details className="rounded border bg-slate-50/50 dark:bg-slate-900/50 p-2">
            <summary className="cursor-pointer text-[11px] font-medium text-muted-foreground flex items-center gap-1">
              <Headphones className="h-3 w-3"/> Optional desk phones
            </summary>
            <p className="text-[10px] text-muted-foreground mt-1 pl-4">
              99% use the cloud app. For traditional shops, sell a Yealink desk phone (£25 profit). See <strong>Phones</strong> tab.
            </p>
          </details>
        </CardContent>
      </Card>
    </>
  );
}

function ServerSection() {
  const qc = useQueryClient();
  const { data: server } = useQuery<any>({ queryKey: ["/api/pbx/server"] });
  const [form, setForm] = useState({
    name: "Main UCM6302",
    host: "",
    apiPort: 8443,
    sipPort: 5060,
    username: "admin",
    apiSecret: "",
    domain: "",
    wsUrl: "",
    stunServer: "stun:stun.l.google.com:19302",
    totalChannels: 75,
  });

  useEffect(() => {
    if (server) setForm({ ...form, ...server, apiSecret: "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [server]);

  const saveMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/pbx/server", form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/pbx/server"] }); toast({ title: "PBX server saved" }); },
    onError: (e: any) => toast({ title: "Save failed", description: e.message, variant: "destructive" }),
  });

  const testMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/pbx/server/test", form);
      return res.json();
    },
    onSuccess: (r: any) => {
      qc.invalidateQueries({ queryKey: ["/api/pbx/server"] });
      if (r.ok) toast({ title: "✅ Connection successful", description: r.message });
      else toast({ title: "❌ Connection failed", description: r.message, variant: "destructive" });
    },
    onError: (e: any) => toast({ title: "Test failed", description: e.message, variant: "destructive" }),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Cable className="h-5 w-5"/>Grandstream UCM6302 Configuration</CardTitle>
        <p className="text-sm text-muted-foreground">Connect your PBX hardware to Link24. Get IP from your router's connected devices.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Server Name</Label>
            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} data-testid="input-server-name" />
          </div>
          <div>
            <Label>Domain / Public Hostname</Label>
            <Input value={form.domain || ""} onChange={e => setForm({ ...form, domain: e.target.value })} placeholder="mypbx.duckdns.org" />
            <p className="text-xs text-muted-foreground mt-1">Use DuckDNS or Cloudflare Tunnel if no static IP</p>
          </div>
          <div>
            <Label>Host / IP Address *</Label>
            <Input value={form.host} onChange={e => setForm({ ...form, host: e.target.value })} placeholder="192.168.1.50 or your.duckdns.org" data-testid="input-server-host" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>API Port</Label>
              <Input type="number" value={form.apiPort} onChange={e => setForm({ ...form, apiPort: parseInt(e.target.value) || 8443 })} />
            </div>
            <div>
              <Label>SIP Port</Label>
              <Input type="number" value={form.sipPort} onChange={e => setForm({ ...form, sipPort: parseInt(e.target.value) || 5060 })} />
            </div>
          </div>
          <div>
            <Label>API Username *</Label>
            <Input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="admin" data-testid="input-server-user" />
          </div>
          <div>
            <Label>API Secret / Password *</Label>
            <Input type="password" value={form.apiSecret} onChange={e => setForm({ ...form, apiSecret: e.target.value })}
              placeholder={server?.hasSecret ? "•••••• (saved)" : "Enter password"} data-testid="input-server-secret" />
          </div>
          <div>
            <Label>Total Channels</Label>
            <Input type="number" value={form.totalChannels} onChange={e => setForm({ ...form, totalChannels: parseInt(e.target.value) || 75 })} />
            <p className="text-xs text-muted-foreground mt-1">UCM6302 = 75 concurrent calls</p>
          </div>
          <div className="md:col-span-2">
            <Label>WebRTC WebSocket URL <span className="text-xs text-muted-foreground">(for in-browser softphone)</span></Label>
            <Input value={form.wsUrl || ""} onChange={e => setForm({ ...form, wsUrl: e.target.value })}
              placeholder="wss://your.duckdns.org:8089/ws" data-testid="input-server-wsurl" />
            <p className="text-xs text-muted-foreground mt-1">UCM6302 → Web → PBX Settings → SIP Settings → enable WebRTC. Default port 8089.</p>
          </div>
          <div>
            <Label>STUN Server</Label>
            <Input value={form.stunServer || ""} onChange={e => setForm({ ...form, stunServer: e.target.value })}
              placeholder="stun:stun.l.google.com:19302" />
          </div>
          {server?.status && (
            <div>
              <Label>Last Status</Label>
              <div className="mt-2 flex items-center gap-2">
                <span className={`inline-block w-2 h-2 rounded-full ${server.status === "online" ? "bg-emerald-500" : "bg-red-500"}`}/>
                <span className="text-sm capitalize">{server.status}</span>
                {server.lastSeenAt && <span className="text-xs text-muted-foreground">· {new Date(server.lastSeenAt).toLocaleString()}</span>}
              </div>
              {server.lastError && <p className="text-xs text-red-600 mt-1">{server.lastError}</p>}
            </div>
          )}
        </div>

        <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-sm">
          <p className="font-semibold flex items-center gap-2"><AlertCircle className="h-4 w-4 text-amber-600"/>Setup Steps:</p>
          <ol className="list-decimal ml-5 mt-2 space-y-1 text-xs">
            <li>Plug UCM6302 into your router (WAN port)</li>
            <li>Find its IP from your router admin (look for "Grandstream")</li>
            <li>Open browser → that IP → log in with the label password</li>
            <li><strong>CHANGE the default password</strong> (security risk!)</li>
            <li>Enable HTTPS API in UCM Web → System Settings → HTTP Server</li>
            <li>Forward ports 5060 (SIP) + 10000-20000 (RTP) on router OR set up Cloudflare Tunnel</li>
            <li>Enter the connection details above and save</li>
          </ol>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Button variant="outline" onClick={() => testMutation.mutate()} disabled={testMutation.isPending || !form.host || !form.username} data-testid="button-test-server">
            {testMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin"/> : <Cable className="h-4 w-4 mr-2"/>}
            Test Connection
          </Button>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form.host || !form.username} data-testid="button-save-server">
            {saveMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin"/> : <Save className="h-4 w-4 mr-2"/>}
            Save PBX Server
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ExtensionsManagerSection() {
  const qc = useQueryClient();
  const { data: extensions = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/pbx/extensions-all"] });
  const { data: shops = [] } = useQuery<any[]>({ queryKey: ["/api/restaurants"] });
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [showPwId, setShowPwId] = useState<string>("");

  const blank = {
    restaurantId: "",
    extensionNumber: "",
    displayName: "",
    sipPassword: "",
    email: "",
    voicemailEnabled: true,
    voicemailPin: "",
  };
  const [form, setForm] = useState<any>(blank);

  function genPassword() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789abcdefghjkmnpqrstuvwxyz";
    return Array.from({ length: 16 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  }

  function suggestNextNumber() {
    const used = new Set(extensions.map((e: any) => parseInt(e.extensionNumber)).filter(Boolean));
    let n = 1001;
    while (used.has(n)) n++;
    return String(n);
  }

  function startAdd() {
    setEditing(null);
    setForm({ ...blank, extensionNumber: suggestNextNumber(), sipPassword: genPassword() });
    setShowForm(true);
  }
  function startEdit(e: any) { setEditing(e); setForm({ ...blank, ...e }); setShowForm(true); }

  const saveMut = useMutation({
    mutationFn: async (payload: any) => {
      if (editing) return apiRequest("PATCH", `/api/pbx/extensions/${editing.id}`, payload);
      return apiRequest("POST", "/api/pbx/extensions", payload);
    },
    onSuccess: async (res: any) => {
      const saved = await res.json?.().catch(() => null) ?? res;
      qc.invalidateQueries({ queryKey: ["/api/pbx/extensions-all"] });
      const sync = saved?.ucmSync;
      if (sync?.ok === false) {
        toast({ title: "⚠️ Saved, but UCM push failed", description: sync.error?.slice(0, 220) || "Use Push to UCM button to retry.", variant: "destructive" });
      } else if (sync?.ok) {
        toast({ title: "✅ Extension saved & pushed to UCM", description: "Ready to register in any softphone now." });
      } else {
        toast({ title: editing ? "Extension updated" : "Extension created" });
      }
      setShowForm(false); setEditing(null); setForm(blank);
    },
    onError: (e: any) => toast({ title: "Save failed", description: e.message, variant: "destructive" }),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/pbx/extensions/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/pbx/extensions-all"] }); toast({ title: "Extension removed" }); },
  });

  const shopName = (id: string) => shops.find((s: any) => s.id === id)?.name || "—";

  const [quickShopName, setQuickShopName] = useState("");
  const [showQuickShop, setShowQuickShop] = useState(false);
  const quickShopMut = useMutation({
    mutationFn: async (name: string) => {
      const slug = "phone-" + name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") + "-" + Math.random().toString(36).slice(2, 6);
      return apiRequest("POST", "/api/restaurants", { name, slug, address: "Phone-only customer" });
    },
    onSuccess: async (res: any) => {
      const created = await res.json?.() ?? res;
      const newId = created?.id;
      await qc.invalidateQueries({ queryKey: ["/api/restaurants"] });
      if (newId) setForm((f: any) => ({ ...f, restaurantId: newId }));
      setQuickShopName(""); setShowQuickShop(false);
      toast({ title: "Phone customer created" });
    },
    onError: (e: any) => toast({ title: "Could not create customer", description: e.message, variant: "destructive" }),
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">📞 Extensions ({extensions.length})</CardTitle>
            <p className="text-sm text-muted-foreground">SIP credentials for staff softphones, desk phones, and mobile apps.</p>
          </div>
          <Button onClick={startAdd} className="bg-emerald-600 hover:bg-emerald-700" data-testid="button-add-extension">
            <Plus className="h-4 w-4 mr-1.5"/>Add Extension
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showForm && (
          <Card className="border-2 border-emerald-400 mb-4">
            <CardContent className="pt-4 space-y-3">
              <div className="text-sm font-bold">{editing ? "Edit Extension" : "New Extension"}</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>Extension Number</Label>
                  <Input value={form.extensionNumber} onChange={(e) => setForm({ ...form, extensionNumber: e.target.value })} placeholder="1001" data-testid="input-ext-number"/>
                </div>
                <div>
                  <Label>Display Name</Label>
                  <Input value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} placeholder="e.g. Counter / Sarah / Kitchen" data-testid="input-ext-name"/>
                </div>
                <div className="md:col-span-2">
                  <Label>Assign to Shop / Customer</Label>
                  {showQuickShop ? (
                    <div className="flex gap-2">
                      <Input
                        autoFocus
                        placeholder="Customer name (e.g. Royal Tandoori)"
                        value={quickShopName}
                        onChange={(e) => setQuickShopName(e.target.value)}
                        data-testid="input-ext-quick-shop"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && quickShopName.trim()) quickShopMut.mutate(quickShopName.trim());
                          if (e.key === "Escape") { setShowQuickShop(false); setQuickShopName(""); }
                        }}
                      />
                      <Button
                        onClick={() => quickShopMut.mutate(quickShopName.trim())}
                        disabled={!quickShopName.trim() || quickShopMut.isPending}
                        className="bg-emerald-600 hover:bg-emerald-700"
                        data-testid="button-ext-create-quick-shop"
                      >
                        {quickShopMut.isPending ? <Loader2 className="h-4 w-4 animate-spin"/> : "Create"}
                      </Button>
                      <Button variant="outline" onClick={() => { setShowQuickShop(false); setQuickShopName(""); }} data-testid="button-ext-cancel-quick-shop">✕</Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Select
                        value={form.restaurantId}
                        onValueChange={(v) => setForm({ ...form, restaurantId: v })}
                      >
                        <SelectTrigger data-testid="select-ext-shop" className="flex-1"><SelectValue placeholder="Pick existing customer..."/></SelectTrigger>
                        <SelectContent>
                          {shops.length === 0 ? (
                            <div className="px-3 py-2 text-sm text-muted-foreground">No customers yet — click "+ New" →</div>
                          ) : (
                            shops.map((s: any) => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))
                          )}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        onClick={() => setShowQuickShop(true)}
                        className="bg-emerald-600 hover:bg-emerald-700 whitespace-nowrap"
                        data-testid="button-ext-new-customer"
                      >
                        <Plus className="h-4 w-4 mr-1"/>New customer
                      </Button>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">No shop website needed — create a "phone-only" customer just for billing this extension.</p>
                </div>
                <div className="md:col-span-2">
                  <Label>SIP Password (auto-generated, change if needed)</Label>
                  <div className="flex gap-2">
                    <Input value={form.sipPassword} onChange={(e) => setForm({ ...form, sipPassword: e.target.value })} className="font-mono" data-testid="input-ext-pw"/>
                    <Button variant="outline" onClick={() => setForm({ ...form, sipPassword: genPassword() })} data-testid="button-regen-pw">🔄 Regenerate</Button>
                  </div>
                </div>
                <div>
                  <Label>Email (optional, for voicemail-to-email)</Label>
                  <Input value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="staff@shop.com" data-testid="input-ext-email"/>
                </div>
                <div>
                  <Label>Voicemail PIN (4 digits)</Label>
                  <Input value={form.voicemailPin || ""} onChange={(e) => setForm({ ...form, voicemailPin: e.target.value })} placeholder="1234" maxLength={6} data-testid="input-ext-vm-pin"/>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={() => saveMut.mutate(form)} disabled={saveMut.isPending || !form.extensionNumber || !form.displayName || !form.restaurantId || !form.sipPassword} className="bg-emerald-600 hover:bg-emerald-700" data-testid="button-save-ext">
                  {saveMut.isPending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin"/> : <Save className="h-4 w-4 mr-1.5"/>}
                  {editing ? "Update" : "Create Extension"}
                </Button>
                <Button variant="outline" onClick={() => { setShowForm(false); setEditing(null); }} data-testid="button-cancel-ext">Cancel</Button>
              </div>
              <p className="text-xs text-muted-foreground">💡 After saving, give the customer: SIP Server <strong>c074ada35c3e.a.gdms.cloud:5061 (TLS)</strong>, Username <strong>{form.extensionNumber}</strong>, Password (above). They'll plug these into Zoiper/Linphone/Wave.</p>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin"/>Loading extensions...</div>
        ) : extensions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Phone className="h-12 w-12 mx-auto mb-2 opacity-30"/>
            <p>No extensions yet. Click <strong>Add Extension</strong> to create your first one (start with 1001).</p>
          </div>
        ) : (
          <div className="space-y-2">
            {extensions.map((e: any) => (
              <div key={e.id} className="flex items-center justify-between gap-3 p-3 border rounded-lg flex-wrap" data-testid={`row-ext-${e.id}`}>
                <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-lg">
                    {e.extensionNumber}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">{e.displayName}</div>
                    <div className="text-xs text-muted-foreground">{shopName(e.restaurantId)} · {e.email || "no email"}</div>
                    <div className="text-xs font-mono text-slate-500 mt-1">
                      🔑 {showPwId === e.id ? e.sipPassword : "••••••••••••"}
                      <button className="ml-2 text-blue-600 hover:underline" onClick={() => setShowPwId(showPwId === e.id ? "" : e.id)} data-testid={`button-toggle-pw-${e.id}`}>
                        {showPwId === e.id ? "hide" : "show"}
                      </button>
                      <button className="ml-2 text-blue-600 hover:underline" onClick={() => { navigator.clipboard.writeText(e.sipPassword); toast({ title: "Password copied" }); }} data-testid={`button-copy-pw-${e.id}`}>copy</button>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={e.registered ? "default" : "outline"} className={e.registered ? "bg-emerald-600" : ""}>
                    {e.registered ? "● Registered" : "○ Offline"}
                  </Badge>
                  <Button size="sm" variant="outline" onClick={() => startEdit(e)} data-testid={`button-edit-ext-${e.id}`}>Edit</Button>
                  <Button size="sm" variant="outline" className="text-rose-600 hover:bg-rose-50" onClick={() => { if (confirm(`Delete extension ${e.extensionNumber}?`)) delMut.mutate(e.id); }} data-testid={`button-delete-ext-${e.id}`}>
                    <Trash2 className="h-3.5 w-3.5"/>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SubscriptionsSection() {
  const { data: subs = [] } = useQuery<any[]>({ queryKey: ["/api/pbx/subscriptions"] });
  const { data: restaurants = [] } = useQuery<any[]>({ queryKey: ["/api/restaurants"] });

  const restName = (id: string) => restaurants.find((r: any) => r.id === id)?.name || id;
  const restSlug = (id: string) => restaurants.find((r: any) => r.id === id)?.slug;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Shop PBX Subscriptions</CardTitle>
        <p className="text-sm text-muted-foreground">All shops using Link24 Phone — billing, status, and upgrade options.</p>
      </CardHeader>
      <CardContent>
        {subs.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <Phone className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p>No subscriptions yet</p>
            <p className="text-sm mt-1">Shops will appear here when they sign up for Link24 Phone.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {subs.map((s: any) => (
              <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card" data-testid={`row-sub-${s.id}`}>
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-blue-600"/>
                </div>
                <div className="flex-1">
                  <p className="font-medium">{restName(s.restaurantId)}</p>
                  <div className="flex gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="capitalize">{s.plan}</Badge>
                    <span>£{s.monthlyPrice}/mo</span>
                  </div>
                </div>
                <Badge variant={s.status === "active" ? "default" : "secondary"}>{s.status}</Badge>
                {restSlug(s.restaurantId) && (
                  <Button size="sm" variant="outline" onClick={() => window.open(`/phone/${restSlug(s.restaurantId)}`, "_blank")}>
                    <ExternalLink className="h-3 w-3 mr-1"/>Open
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function NumbersSupplierGuide() {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5"/>Where To Buy UK Phone Numbers</CardTitle>
          <p className="text-sm text-muted-foreground">Recommended supplier: <strong>Voipfone.co.uk</strong> — cheapest, easy signup, no Ofcom registration needed.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="font-bold text-lg">Voipfone — Official Supplier</h3>
                <p className="text-blue-100 text-sm">UK-based VoIP wholesale provider</p>
              </div>
              <a href="https://www.voipfone.co.uk" target="_blank" rel="noreferrer">
                <Button variant="secondary" data-testid="button-voipfone">
                  <ExternalLink className="h-4 w-4 mr-1"/>Visit Voipfone
                </Button>
              </a>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            {VOIPFONE_NUMBER_PRICES.map(p => (
              <div key={p.type} className={`p-3 rounded-lg border-2 ${p.color}`}>
                <div className="flex justify-between items-start mb-1">
                  <p className="font-semibold">{p.type}</p>
                  <span className="font-bold">{p.price}</span>
                </div>
                <p className="text-xs">Inbound: <strong>{p.inbound}</strong></p>
                <p className="text-xs mt-1 opacity-80">{p.note}</p>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 text-sm">
            <p className="font-semibold mb-2">Other Suppliers (alternatives):</p>
            <ul className="text-xs space-y-1 text-muted-foreground">
              <li>• <strong>Sipgate</strong> - £1.50/mo local, £3.50/mo mobile</li>
              <li>• <strong>Gradwell</strong> - £3/mo local, £5/mo mobile (more expensive but reliable)</li>
              <li>• <strong>Magrathea</strong> - cheapest wholesale (£0.30-£1) but needs Ofcom registration</li>
              <li>• <strong>Twilio</strong> - £1.15/mo local, best APIs but pricier at scale</li>
              <li>• <strong>VoIP.ms</strong> - cheapest international (~£1.50/mo)</li>
            </ul>
          </div>

          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-sm">
            <p className="font-semibold flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600"/>Number Porting (move shop's existing BT number)</p>
            <p className="text-xs mt-1 text-muted-foreground">Most providers (especially Voipfone) support porting. £15-25 one-time fee, takes 5-10 days. Big selling point: shop keeps their old number, saves 70% on bills.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How To Set Up Voipfone With Your UCM6302</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <ol className="list-decimal ml-5 space-y-2 text-muted-foreground">
            <li>Sign up at <strong>voipfone.co.uk</strong> with UK address + £10 minimum top-up</li>
            <li>Buy a number (e.g. 0121 XXX XXXX local — £1/month)</li>
            <li>Voipfone gives you SIP credentials: <code>username, password, server</code></li>
            <li>In UCM6302 web: <strong>Extension/Trunk → VoIP Trunks → Add SIP Trunk</strong></li>
            <li>Enter Voipfone's server (usually <code>sip.voipfone.net</code>) + your username + password</li>
            <li>In Inbound Routes, point the new number to your shop's extension or IVR</li>
            <li>Outbound Route: prefix any UK call with this trunk</li>
            <li>Done — calls now route through Voipfone via your UCM</li>
          </ol>
        </CardContent>
      </Card>
    </>
  );
}

function DeskPhoneGuide() {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Headphones className="h-5 w-5"/>Desk Phone Setup (No Web App Needed)</CardTitle>
          <p className="text-sm text-muted-foreground">Some shops just want a regular-looking desk phone on the counter. No browser, no computer, no learning curve. Plug & talk.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-3">
            {[
              { name: "Yealink T31G", price: "£55", note: "Best budget option, gigabit, perfect for shops", color: "bg-blue-50 border-blue-200 dark:bg-blue-950/40" },
              { name: "Grandstream GRP2602", price: "£45", note: "Same brand as your UCM, auto-provision works", color: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40" },
              { name: "Yealink T54W", price: "£140", note: "Color screen, WiFi, premium - for managers", color: "bg-purple-50 border-purple-200 dark:bg-purple-950/40" },
              { name: "Cisco SPA303", price: "£40", note: "Reliable, simple, 3 lines", color: "bg-cyan-50 border-cyan-200 dark:bg-cyan-950/40" },
              { name: "Fanvil X3SP", price: "£35", note: "Cheapest reliable option, basic features", color: "bg-amber-50 border-amber-200 dark:bg-amber-950/40" },
              { name: "Cordless DECT (W73P)", price: "£120", note: "Walks around shop, base + handset", color: "bg-rose-50 border-rose-200 dark:bg-rose-950/40" },
            ].map(p => (
              <div key={p.name} className={`p-3 rounded-lg border-2 ${p.color}`}>
                <div className="flex justify-between items-start mb-1">
                  <p className="font-semibold text-sm">{p.name}</p>
                  <span className="font-bold text-sm">{p.price}</span>
                </div>
                <p className="text-xs text-muted-foreground">{p.note}</p>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800 text-sm">
            <p className="font-semibold mb-2 flex items-center gap-2"><Smartphone className="h-4 w-4"/>Setup Steps For Customer:</p>
            <ol className="list-decimal ml-5 space-y-1 text-xs text-muted-foreground">
              <li>You sell the phone to shop owner (mark up £20-30)</li>
              <li>You pre-configure phone in your shop with shop's SIP extension from UCM</li>
              <li>Shop owner just plugs phone into their internet router → ready to use</li>
              <li>Phone works exactly like landline: pick up, dial, hang up</li>
              <li>Caller ID still pops up on phone screen</li>
              <li>You manage features remotely (recording, IVR, hold music) from Link24 admin</li>
            </ol>
          </div>

          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-sm">
            <p className="font-semibold flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-blue-600"/>Where To Buy Desk Phones (Wholesale, Cheap):</p>
            <ul className="text-xs mt-2 space-y-1 text-muted-foreground">
              <li>• <strong>Provu.co.uk</strong> - UK distributor, trade prices, fast shipping</li>
              <li>• <strong>Voipon.co.uk</strong> - large UK stockist, all brands</li>
              <li>• <strong>Solwise.co.uk</strong> - good for Yealink, business accounts get discounts</li>
              <li>• <strong>Amazon Business</strong> - VAT receipts, next-day, but pricier</li>
              <li>• <strong>AliExpress</strong> - cheapest but no UK warranty, slow shipping</li>
            </ul>
          </div>

          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-sm">
            <p className="font-semibold mb-1">💰 Profit Idea: Phone Reseller</p>
            <p className="text-xs text-muted-foreground">Buy Yealink T31G at £55 trade → sell to shop at £80 (£25 profit) + £8/mo subscription = £121/year per shop on top of the £96/year subscription. Total £217/year per shop.</p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function BillingSection() {
  const qc = useQueryClient();
  const { data: usage = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/pbx/billing/all-usage"] });
  const { data: subs = [] } = useQuery<any[]>({ queryKey: ["/api/pbx/subscriptions"] });
  const { data: restaurants = [] } = useQuery<any[]>({ queryKey: ["/api/restaurants"] });

  const totalBase = usage.reduce((s, u) => s + parseFloat(u.monthlyPrice || "0"), 0);
  const totalOverage = usage.reduce((s, u) => s + (u.overageCharge || 0), 0);
  const totalEstimated = usage.reduce((s, u) => s + (u.estimatedTotal || 0), 0);

  const applyPlan = useMutation({
    mutationFn: async ({ restaurantId, tpl }: { restaurantId: string; tpl: any }) => {
      const { plan, monthlyPrice, includedOutgoingMinutes, extraMinuteRate, monthlyMinutesCap, maxExtensions, maxNumbers, status, trialMonths } = tpl;
      const payload: any = { plan, monthlyPrice, includedOutgoingMinutes, extraMinuteRate, monthlyMinutesCap, maxExtensions, maxNumbers, currentPeriodStart: new Date() };
      if (status) payload.status = status;
      if (trialMonths) {
        const trialEnd = new Date(); trialEnd.setMonth(trialEnd.getMonth() + trialMonths);
        payload.trialEndsAt = trialEnd;
      }
      return apiRequest("POST", `/api/pbx/subscriptions/${restaurantId}`, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/pbx/billing/all-usage"] });
      qc.invalidateQueries({ queryKey: ["/api/pbx/subscriptions"] });
      toast({ title: "Plan applied" });
    },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const toggleFeature = useMutation({
    mutationFn: ({ restaurantId, field, enabled }: { restaurantId: string; field: string; enabled: boolean }) =>
      apiRequest("POST", `/api/pbx/subscriptions/${restaurantId}`, { [field]: enabled }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/pbx/billing/all-usage"] }),
  });
  const toggleIntl = useMutation({
    mutationFn: ({ restaurantId, enabled }: { restaurantId: string; enabled: boolean }) =>
      apiRequest("POST", `/api/pbx/subscriptions/${restaurantId}`, { internationalCallsEnabled: enabled }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/pbx/billing/all-usage"] });
      qc.invalidateQueries({ queryKey: ["/api/pbx/subscriptions"] });
      toast({ title: "International calls updated" });
    },
  });

  const resetPeriod = useMutation({
    mutationFn: (restaurantId: string) => apiRequest("POST", `/api/pbx/billing/reset-period/${restaurantId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/pbx/billing/all-usage"] });
      toast({ title: "Billing period reset" });
    },
  });

  const restName = (id: string) => restaurants.find((r: any) => r.id === id)?.name || id;
  const shopsWithoutSub = restaurants.filter((r: any) => !subs.find((s: any) => s.restaurantId === r.id));

  return (
    <>
      {/* Revenue summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4">
          <Building2 className="h-5 w-5 text-blue-600 mb-1" />
          <p className="text-xs text-muted-foreground">Paying Shops</p>
          <p className="text-2xl font-bold" data-testid="stat-billing-shops">{usage.length}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <PoundSterling className="h-5 w-5 text-emerald-600 mb-1" />
          <p className="text-xs text-muted-foreground">Base Plan Revenue</p>
          <p className="text-2xl font-bold">£{totalBase.toFixed(2)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <TrendingUp className="h-5 w-5 text-amber-600 mb-1" />
          <p className="text-xs text-muted-foreground">Overage Charges</p>
          <p className="text-2xl font-bold">£{totalOverage.toFixed(2)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <Receipt className="h-5 w-5 text-purple-600 mb-1" />
          <p className="text-xs text-muted-foreground">Estimated MRR</p>
          <p className="text-2xl font-bold" data-testid="stat-billing-mrr">£{totalEstimated.toFixed(2)}</p>
        </CardContent></Card>
      </div>

      {/* Free internet calls banner */}
      <Card className="border-2 border-emerald-400 bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/30 dark:via-teal-950/30 dark:to-cyan-950/30">
        <CardContent className="p-4 flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md flex-shrink-0">
            <Cloud className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-2 flex-wrap">
              🌐 ALL plans include FREE unlimited internet calls between Link24 users
              <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold">£0 COST TO YOU</span>
            </p>
            <p className="text-xs text-emerald-800/80 dark:text-emerald-200/80 mt-1">
              App-to-app calls (HD voice + video + SMS) go through your server — no telco involved. UK ↔ Pakistan ↔ anywhere worldwide. Bandwidth ~1MB/min.
              Real phone numbers (07/01/02) only charged when calling normal phones.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Plan templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5"/>Plan Templates</CardTitle>
          <p className="text-sm text-muted-foreground">Click "Apply to shop" to set a shop on a plan. Includes free outgoing minutes — anything over is auto-billed at the extra rate.</p>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
            {PLAN_TEMPLATES.map(tpl => (
              <div key={tpl.plan} className={`rounded-xl border-2 overflow-hidden ${(tpl as any).badge ? "border-emerald-500 ring-2 ring-emerald-200 dark:ring-emerald-900" : ""}`}>
                <div className={`bg-gradient-to-r ${tpl.color} text-white p-4 relative`}>
                  {(tpl as any).badge && (
                    <span className="absolute top-2 right-2 bg-yellow-300 text-emerald-900 text-[10px] font-bold px-2 py-0.5 rounded-full">{(tpl as any).badge}</span>
                  )}
                  <p className="text-xs uppercase tracking-wide opacity-80">{tpl.label}</p>
                  <p className="text-3xl font-bold">£{tpl.monthlyPrice}<span className="text-sm font-normal">/mo</span></p>
                  {(tpl as any).trialMonths && (
                    <p className="text-xs mt-1 opacity-90">For {(tpl as any).trialMonths} months, then auto-converts</p>
                  )}
                </div>
                <div className="p-4 space-y-2 text-sm bg-card">
                  <div className="flex justify-between"><span>Free outgoing</span><strong>{tpl.includedOutgoingMinutes} mins/mo</strong></div>
                  <div className="flex justify-between"><span>Extra calls</span><strong>{(parseFloat(tpl.extraMinuteRate) * 100).toFixed(1)}p/min</strong></div>
                  <div className="flex justify-between"><span>Hard cap</span><strong>{tpl.monthlyMinutesCap} mins</strong></div>
                  <div className="flex justify-between"><span>Extensions</span><strong>{tpl.maxExtensions}</strong></div>
                  <div className="flex justify-between"><span>Numbers</span><strong>{tpl.maxNumbers}</strong></div>
                  {(tpl as any).trialMonths && (
                    <div className="text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded">
                      Your cost: ~£{(((parseFloat(tpl.extraMinuteRate) * tpl.includedOutgoingMinutes) + 0.87) * (tpl as any).trialMonths).toFixed(2)} for whole {(tpl as any).trialMonths} months (VoIP.ms)
                    </div>
                  )}
                  {(tpl as any).note && (
                    <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded leading-relaxed">
                      {(tpl as any).note}
                    </div>
                  )}
                  <div className="pt-2 border-t">
                    <Select onValueChange={(restaurantId) => applyPlan.mutate({ restaurantId, tpl })}>
                      <SelectTrigger data-testid={`select-apply-${tpl.plan}`}><SelectValue placeholder="Apply to shop..."/></SelectTrigger>
                      <SelectContent>
                        {restaurants.map((r: any) => (
                          <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-200">
            <strong>Your real cost (VoIP.ms):</strong> £0.85 number + £0.006/min UK outgoing / 2.5p PK landline / 3.5p PK mobile. Premium (1500 free mins) → cost ≈ £9.85, you charge £25 = <strong>£15+ profit/shop/month</strong>.
          </div>
          <div className="mt-3 p-3 rounded-lg bg-pink-50 dark:bg-pink-950/40 border border-pink-200 dark:border-pink-800 text-xs text-pink-900 dark:text-pink-200">
            🇵🇰 <strong>Pakistan plans roadmap:</strong> Phase 1 (now, VoIP.ms 2.5p/min) → caps protect you. Phase 2 (50+ customers, Connect Communications wholesale ₨ 0.60/min ≈ <strong>0.17p/min</strong>) → Family Unlimited £20 becomes <strong>£18 pure profit</strong>. Phase 3 (500+ customers, PTCL Direct ₨ 0.30/min) → market-leading rates.
          </div>
        </CardContent>
      </Card>

      {/* Per-shop usage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5"/>Live Shop Usage This Period</CardTitle>
          <p className="text-sm text-muted-foreground">Outgoing minutes used vs free bundle. Anything over = auto-charged via Stripe at month end.</p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto"/></div>
          ) : usage.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Receipt className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p>No active subscriptions yet</p>
              <p className="text-sm mt-1">Apply a plan to a shop above to start tracking usage.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {usage.map((u: any) => {
                const pct = u.includedMinutes > 0 ? Math.min(100, (u.outboundMinutes / u.includedMinutes) * 100) : 0;
                const overBundle = u.outboundMinutes > u.includedMinutes;
                return (
                  <div key={u.subscriptionId} className="p-4 rounded-lg border bg-card space-y-2" data-testid={`row-usage-${u.restaurantId}`}>
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground"/>
                        <span className="font-semibold">{u.restaurantName}</span>
                        <Badge variant="outline" className="capitalize">{u.plan}</Badge>
                        <Badge variant={u.status === "active" ? "default" : "secondary"}>{u.status}</Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Estimated this month</p>
                        <p className="font-bold text-lg">£{u.estimatedTotal.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Outgoing: <strong>{u.outboundMinutes}</strong> / {u.includedMinutes} free mins</span>
                        {overBundle && (
                          <span className="text-amber-700 dark:text-amber-400 font-medium">
                            +{u.overageMinutes} extra × {(u.extraMinuteRate * 100).toFixed(1)}p = <strong>£{u.overageCharge.toFixed(2)}</strong>
                          </span>
                        )}
                      </div>
                      <Progress value={pct} className={overBundle ? "[&>div]:bg-amber-500" : ""}/>
                    </div>
                    <div className="flex items-center justify-between gap-2 pt-2 border-t flex-wrap">
                      <div className="flex items-center gap-3 flex-wrap">
                        <label className="flex items-center gap-1.5 cursor-pointer" data-testid={`label-intl-${u.restaurantId}`}>
                          <Switch checked={!!u.internationalCallsEnabled} onCheckedChange={(v) => toggleIntl.mutate({ restaurantId: u.restaurantId, enabled: v })} data-testid={`switch-intl-${u.restaurantId}`}/>
                          <span className="text-xs flex items-center gap-1"><Globe className="h-3 w-3"/>International</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <Switch checked={!!u.pakistanCallsEnabled} onCheckedChange={(v) => toggleFeature.mutate({ restaurantId: u.restaurantId, field: "pakistanCallsEnabled", enabled: v })} data-testid={`switch-pk-${u.restaurantId}`}/>
                          <span className="text-xs">🇵🇰 Pakistan</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <Switch checked={!!u.smsEnabled} onCheckedChange={(v) => toggleFeature.mutate({ restaurantId: u.restaurantId, field: "smsEnabled", enabled: v })} data-testid={`switch-sms-${u.restaurantId}`}/>
                          <span className="text-xs flex items-center gap-1"><MessageSquare className="h-3 w-3"/>SMS</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <Switch checked={!!u.customCallerIdEnabled} onCheckedChange={(v) => toggleFeature.mutate({ restaurantId: u.restaurantId, field: "customCallerIdEnabled", enabled: v })} data-testid={`switch-cli-${u.restaurantId}`}/>
                          <span className="text-xs flex items-center gap-1"><IdCard className="h-3 w-3"/>Display No.</span>
                        </label>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => resetPeriod.mutate(u.restaurantId)} data-testid={`button-reset-${u.restaurantId}`}>
                        <RotateCw className="h-3 w-3 mr-1"/>Reset
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {shopsWithoutSub.length > 0 && (
            <div className="mt-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs">
              <p className="font-semibold mb-1">Shops without a Link24 Phone plan ({shopsWithoutSub.length}):</p>
              <p className="text-muted-foreground">{shopsWithoutSub.map((r: any) => r.name).join(", ")} — apply a plan above to start billing.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Safety / fraud protection notes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5"/>Built-in Protection</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-3 text-sm">
          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
            <p className="font-semibold mb-1 flex items-center gap-1"><Ban className="h-4 w-4"/>International calls blocked by default</p>
            <p className="text-xs text-muted-foreground">Stops shops accidentally running up huge bills calling Pakistan/India at premium rates. Toggle ON per shop only when needed (and you can charge a higher rate).</p>
          </div>
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
            <p className="font-semibold mb-1 flex items-center gap-1"><AlertCircle className="h-4 w-4"/>Hard monthly minute cap</p>
            <p className="text-xs text-muted-foreground">If a shop hits the cap (e.g. 5,000 mins on Pro), outgoing is paused. Protects you from abuse, fraud or runaway scripts.</p>
          </div>
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
            <p className="font-semibold mb-1 flex items-center gap-1"><Receipt className="h-4 w-4"/>Auto-billing via Stripe</p>
            <p className="text-xs text-muted-foreground">Base plan charges monthly. Overage minutes added to next invoice automatically — no manual admin needed.</p>
          </div>
          <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800">
            <p className="font-semibold mb-1 flex items-center gap-1"><RotateCw className="h-4 w-4"/>Monthly period reset</p>
            <p className="text-xs text-muted-foreground">Each shop's free-minute bundle resets every month from their billing date. Use "Reset period" to align manually after upgrades.</p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function TrunksSection() {
  const qc = useQueryClient();
  const { data: trunks = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/pbx/trunks"] });
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  const blank = {
    provider: "voipfone",
    name: "",
    country: "UK",
    host: "sip.voipfone.co.uk",
    port: 5060,
    transport: "udp",
    username: "",
    password: "",
    authUsername: "",
    fromDomain: "sip.voipfone.co.uk",
    outboundCallerId: "",
    ratePerMinuteGbp: "0.0100",
    monthlyNumberCostGbp: "2.40",
    isActive: true,
    notes: "",
  };
  const [form, setForm] = useState<any>(blank);

  const saveMut = useMutation({
    mutationFn: async (payload: any) => {
      // Whitelist only insertable fields — never send id/createdAt/status back
      const clean: any = {
        provider: payload.provider, name: payload.name, country: payload.country,
        host: payload.host, port: payload.port, transport: payload.transport,
        username: payload.username, authUsername: payload.authUsername || null,
        fromDomain: payload.fromDomain || null, outboundCallerId: payload.outboundCallerId || null,
        ratePerMinuteGbp: payload.ratePerMinuteGbp, monthlyNumberCostGbp: payload.monthlyNumberCostGbp,
        isActive: payload.isActive, notes: payload.notes || null,
      };
      if (payload.password && payload.password.length > 0) clean.password = payload.password;
      if (editing) return apiRequest("PATCH", `/api/pbx/trunks/${editing.id}`, clean);
      return apiRequest("POST", "/api/pbx/trunks", clean);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/pbx/trunks"] });
      toast({ title: editing ? "Trunk updated" : "Trunk added", description: "Channel pool refreshed." });
      setShowForm(false); setEditing(null); setForm(blank);
    },
    onError: (e: any) => toast({ title: "Save failed", description: e.message, variant: "destructive" }),
  });
  const delMut = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/pbx/trunks/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/pbx/trunks"] }); toast({ title: "Trunk deleted" }); },
  });

  const totalChannels = trunks.filter((t: any) => t.isActive).length;
  const totalCost = trunks.filter((t: any) => t.isActive).reduce((s: number, t: any) => s + parseFloat(t.monthlyNumberCostGbp || "0"), 0);

  function startEdit(t: any) {
    setEditing(t);
    setForm({ ...blank, ...t, password: "" });
    setShowForm(true);
  }
  function startAdd() { setEditing(null); setForm(blank); setShowForm(true); }

  return (
    <div className="space-y-4">
      <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide">Active Channels</div>
              <div className="text-3xl font-bold text-blue-700" data-testid="text-channels-total">{totalChannels}</div>
              <div className="text-xs text-muted-foreground">Concurrent calls supported</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide">Monthly Cost</div>
              <div className="text-3xl font-bold text-emerald-700" data-testid="text-channels-cost">£{totalCost.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">Trunk fees only (excl. numbers)</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide">Capacity Model</div>
              <div className="text-2xl font-bold text-purple-700">~{totalChannels * 10} shops</div>
              <div className="text-xs text-muted-foreground">10:1 oversell (Duo/Solo plans)</div>
            </div>
            <div className="flex items-end">
              <Button onClick={startAdd} data-testid="button-add-trunk" className="bg-blue-600 hover:bg-blue-700">
                <Cloud className="h-4 w-4 mr-2"/>Add SIP Trunk
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {showForm && (
        <Card className="border-2 border-blue-400">
          <CardHeader>
            <CardTitle className="text-lg">{editing ? "Edit SIP Trunk" : "Add SIP Trunk"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>Provider</Label>
                <Select value={form.provider} onValueChange={(v) => setForm({ ...form, provider: v })}>
                  <SelectTrigger data-testid="select-trunk-provider"><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="voipfone">VoIPfone (UK)</SelectItem>
                    <SelectItem value="sipgate">Sipgate (UK)</SelectItem>
                    <SelectItem value="gradwell">Gradwell (UK)</SelectItem>
                    <SelectItem value="simwood">Simwood (UK Wholesale)</SelectItem>
                    <SelectItem value="voipms">VoIP.ms (Intl)</SelectItem>
                    <SelectItem value="telnyx">Telnyx (Intl)</SelectItem>
                    <SelectItem value="didww">DIDWW (Intl)</SelectItem>
                    <SelectItem value="rozee">Rozee (PK)</SelectItem>
                    <SelectItem value="callvoz">CallVoz (PK)</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Friendly Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="VoIPfone-2" data-testid="input-trunk-name"/>
              </div>
              <div>
                <Label>Host</Label>
                <Input value={form.host} onChange={(e) => setForm({ ...form, host: e.target.value })} data-testid="input-trunk-host"/>
              </div>
              <div>
                <Label>Port / Transport</Label>
                <div className="flex gap-2">
                  <Input type="number" value={form.port} onChange={(e) => setForm({ ...form, port: parseInt(e.target.value) || 5060 })} className="w-24" data-testid="input-trunk-port"/>
                  <Select value={form.transport} onValueChange={(v) => setForm({ ...form, transport: v })}>
                    <SelectTrigger className="flex-1" data-testid="select-trunk-transport"><SelectValue/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="udp">UDP</SelectItem>
                      <SelectItem value="tcp">TCP</SelectItem>
                      <SelectItem value="tls">TLS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Username (Auth ID)</Label>
                <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="30258306*201" data-testid="input-trunk-username"/>
              </div>
              <div>
                <Label>Password</Label>
                <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={editing ? "(leave blank to keep current)" : ""} data-testid="input-trunk-password"/>
              </div>
              <div>
                <Label>From Domain (optional)</Label>
                <Input value={form.fromDomain || ""} onChange={(e) => setForm({ ...form, fromDomain: e.target.value })} data-testid="input-trunk-fromdomain"/>
              </div>
              <div>
                <Label>Country</Label>
                <Select value={form.country} onValueChange={(v) => setForm({ ...form, country: v })}>
                  <SelectTrigger data-testid="select-trunk-country"><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UK">🇬🇧 UK</SelectItem>
                    <SelectItem value="PK">🇵🇰 Pakistan</SelectItem>
                    <SelectItem value="INTL">🌐 International</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Rate per minute (£)</Label>
                <Input value={form.ratePerMinuteGbp} onChange={(e) => setForm({ ...form, ratePerMinuteGbp: e.target.value })} data-testid="input-trunk-rate"/>
              </div>
              <div>
                <Label>Monthly cost (£)</Label>
                <Input value={form.monthlyNumberCostGbp} onChange={(e) => setForm({ ...form, monthlyNumberCostGbp: e.target.value })} data-testid="input-trunk-monthly"/>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} data-testid="switch-trunk-active"/>
              <Label>Active (counts toward channel pool)</Label>
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={() => saveMut.mutate(form)} disabled={saveMut.isPending || !form.name || !form.username} data-testid="button-save-trunk" className="bg-blue-600 hover:bg-blue-700">
                {saveMut.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin"/> : <Save className="h-4 w-4 mr-2"/>}
                {editing ? "Update Trunk" : "Save & Add to Pool"}
              </Button>
              <Button variant="outline" onClick={() => { setShowForm(false); setEditing(null); }} data-testid="button-cancel-trunk">Cancel</Button>
            </div>
            <p className="text-xs text-muted-foreground">⚠️ Saving here records the trunk in Link24. You still need to also create it in the UCM6302 web admin (or enable auto-push when configured).</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Cable className="h-4 w-4"/>Channel Pool ({trunks.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin"/>Loading...</div>
          ) : trunks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Cloud className="h-12 w-12 mx-auto mb-2 opacity-30"/>
              <p>No SIP trunks yet. Click <strong>Add SIP Trunk</strong> to register your first channel.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {trunks.map((t: any) => (
                <div key={t.id} data-testid={`row-trunk-${t.id}`} className="flex items-center justify-between p-3 rounded-lg border hover:bg-slate-50">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-2.5 h-2.5 rounded-full ${t.status === "registered" ? "bg-emerald-500" : t.status === "failed" ? "bg-red-500" : "bg-slate-400"}`}/>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold flex items-center gap-2">
                        <span data-testid={`text-trunk-name-${t.id}`}>{t.name}</span>
                        <Badge variant="outline" className="text-xs">{t.provider}</Badge>
                        <Badge variant="outline" className="text-xs">{t.country}</Badge>
                        {!t.isActive && <Badge variant="secondary" className="text-xs">Inactive</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {t.username}@{t.host}:{t.port} · {t.transport?.toUpperCase()} · £{parseFloat(t.monthlyNumberCostGbp || "0").toFixed(2)}/mo · {parseFloat(t.ratePerMinuteGbp || "0").toFixed(4)}£/min
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => startEdit(t)} data-testid={`button-edit-trunk-${t.id}`}>Edit</Button>
                    <Button size="sm" variant="ghost" onClick={() => { if (confirm(`Delete trunk "${t.name}"?`)) delMut.mutate(t.id); }} data-testid={`button-delete-trunk-${t.id}`} className="text-red-600 hover:text-red-700">Delete</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5"/>
            <div className="text-sm space-y-1">
              <p className="font-semibold text-amber-900">Channel Pool = Concurrent Call Capacity</p>
              <p className="text-amber-800">Each active trunk = 1 simultaneous call. With {totalChannels} channel(s), up to {totalChannels} customer(s) can be on the phone at once across <strong>all your shops</strong>. Add more trunks (e.g. VoIPfone Flex at £2.40/mo each) to scale.</p>
              <p className="text-amber-800">⚠️ Status auto-updates from UCM registration polling (coming next phase).</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PhoneNumbersSection() {
  const qc = useQueryClient();
  const { data: numbers = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/pbx/numbers-all"] });
  const { data: shops = [] } = useQuery<any[]>({ queryKey: ["/api/restaurants"] });
  const { data: trunks = [] } = useQuery<any[]>({ queryKey: ["/api/pbx/trunks"] });
  const { data: allExtensions = [] } = useQuery<any[]>({ queryKey: ["/api/pbx/extensions-all"] });
  const { data: allRingGroups = [] } = useQuery<any[]>({ queryKey: ["/api/pbx/ring-groups"] });
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  const blank = {
    restaurantId: "",
    number: "",
    numberType: "local",
    provider: "voipfone",
    monthlyCost: "3.60",
    label: "",
    status: "active",
    inboundDestType: "voicemail",
    inboundDestId: "",
  };
  const [form, setForm] = useState<any>(blank);

  const saveMut = useMutation({
    mutationFn: async (payload: any) => {
      if (editing) return apiRequest("PATCH", `/api/pbx/numbers/${editing.id}`, payload);
      return apiRequest("POST", "/api/pbx/numbers", payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/pbx/numbers-all"] });
      toast({ title: editing ? "Number updated" : "Number added" });
      setShowForm(false); setEditing(null); setForm(blank);
    },
    onError: (e: any) => toast({ title: "Save failed", description: e.message, variant: "destructive" }),
  });
  const delMut = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/pbx/numbers/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/pbx/numbers-all"] }); toast({ title: "Number removed" }); },
  });

  const totalCost = numbers.filter((n: any) => n.status === "active").reduce((s: number, n: any) => s + parseFloat(n.monthlyCost || "0"), 0);
  const shopMap = Object.fromEntries(shops.map((s: any) => [s.id, s.name]));

  function startEdit(n: any) { setEditing(n); setForm({ ...blank, ...n }); setShowForm(true); }
  function startAdd() { setEditing(null); setForm(blank); setShowForm(true); }

  // Quick-add a phone-only customer (no full app account needed)
  const [quickShopName, setQuickShopName] = useState("");
  const [showQuickShop, setShowQuickShop] = useState(false);
  const quickShopMut = useMutation({
    mutationFn: async (name: string) => {
      const slug = "phone-" + name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") + "-" + Math.random().toString(36).slice(2, 6);
      return apiRequest("POST", "/api/restaurants", {
        name,
        slug,
        address: "Phone-only customer",
      });
    },
    onSuccess: async (res: any) => {
      const created = await res.json?.() ?? res;
      const newId = created?.id;
      await qc.invalidateQueries({ queryKey: ["/api/restaurants"] });
      if (newId) setForm((f: any) => ({ ...f, restaurantId: newId }));
      setQuickShopName("");
      setShowQuickShop(false);
      toast({ title: "Phone customer created", description: `${quickShopName} is ready to assign.` });
    },
    onError: (e: any) => toast({ title: "Could not create customer", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-4">
      <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide">Total Numbers</div>
              <div className="text-3xl font-bold text-emerald-700" data-testid="text-numbers-total">{numbers.length}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide">Active</div>
              <div className="text-3xl font-bold text-blue-700">{numbers.filter((n: any) => n.status === "active").length}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide">Monthly Cost</div>
              <div className="text-3xl font-bold text-rose-700" data-testid="text-numbers-cost">£{totalCost.toFixed(2)}</div>
            </div>
            <div className="flex items-end">
              <Button onClick={startAdd} data-testid="button-add-number" className="bg-emerald-600 hover:bg-emerald-700">
                <Phone className="h-4 w-4 mr-2"/>Add Phone Number
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={(o) => { if (!o) { setShowForm(false); setEditing(null); } }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Number" : "Add Phone Number"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <Label>E.164 Number (e.g. +442039514642)</Label>
                <Input value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} placeholder="+442039514642" data-testid="input-number-e164"/>
              </div>
              <div>
                <Label>Assign to Shop / Customer</Label>
                {showQuickShop ? (
                  <div className="flex gap-2">
                    <Input
                      autoFocus
                      placeholder="Customer name (e.g. Royal Tandoori)"
                      value={quickShopName}
                      onChange={(e) => setQuickShopName(e.target.value)}
                      data-testid="input-quick-shop-name"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && quickShopName.trim()) quickShopMut.mutate(quickShopName.trim());
                        if (e.key === "Escape") { setShowQuickShop(false); setQuickShopName(""); }
                      }}
                    />
                    <Button
                      onClick={() => quickShopMut.mutate(quickShopName.trim())}
                      disabled={!quickShopName.trim() || quickShopMut.isPending}
                      data-testid="button-create-quick-shop"
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      {quickShopMut.isPending ? <Loader2 className="h-4 w-4 animate-spin"/> : "Create"}
                    </Button>
                    <Button variant="outline" onClick={() => { setShowQuickShop(false); setQuickShopName(""); }} data-testid="button-cancel-quick-shop">✕</Button>
                  </div>
                ) : (
                  <Select
                    value={form.restaurantId}
                    onValueChange={(v) => {
                      if (v === "__new__") { setShowQuickShop(true); return; }
                      setForm({ ...form, restaurantId: v });
                    }}
                  >
                    <SelectTrigger data-testid="select-number-shop"><SelectValue placeholder="Select shop..."/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__new__" className="font-semibold text-emerald-700">
                        ➕ Add new phone customer…
                      </SelectItem>
                      {shops.length > 0 && <div className="border-t my-1"/>}
                      {shops.map((s: any) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div>
                <Label>Number Type</Label>
                <Select value={form.numberType} onValueChange={(v) => setForm({ ...form, numberType: v })}>
                  <SelectTrigger data-testid="select-number-type"><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="local">UK Local (01/02)</SelectItem>
                    <SelectItem value="national">UK National (03)</SelectItem>
                    <SelectItem value="mobile">UK Mobile (07)</SelectItem>
                    <SelectItem value="freephone">UK Freephone (0800)</SelectItem>
                    <SelectItem value="international">International</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Provider / Trunk</Label>
                <Select value={form.provider} onValueChange={(v) => setForm({ ...form, provider: v })}>
                  <SelectTrigger data-testid="select-number-provider"><SelectValue/></SelectTrigger>
                  <SelectContent>
                    {trunks.length === 0 ? <SelectItem value="voipfone">VoIPfone</SelectItem> : trunks.map((t: any) => (
                      <SelectItem key={t.id} value={t.provider}>{t.name} ({t.provider})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Monthly Cost (£)</Label>
                <Input value={form.monthlyCost} onChange={(e) => setForm({ ...form, monthlyCost: e.target.value })} data-testid="input-number-cost"/>
              </div>
              <div className="md:col-span-2">
                <Label>Label / Notes</Label>
                <Input value={form.label || ""} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="e.g. Main shop line" data-testid="input-number-label"/>
              </div>
            </div>

            {/* Inbound destination */}
            <div className="border-t pt-3 mt-3">
              <Label className="text-base font-semibold">📞 Where do incoming calls go?</Label>
              <p className="text-xs text-muted-foreground mb-2">When someone calls this number, this is what happens.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>Destination Type</Label>
                  <Select value={form.inboundDestType} onValueChange={(v) => setForm({ ...form, inboundDestType: v, inboundDestId: "" })}>
                    <SelectTrigger data-testid="select-dest-type"><SelectValue/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="voicemail">📬 Voicemail (default)</SelectItem>
                      <SelectItem value="extension">👤 Single Extension</SelectItem>
                      <SelectItem value="ring_group">📞 Ring Group (multi-phone)</SelectItem>
                      <SelectItem value="ivr">🤖 IVR Menu (Press 1, 2, 3...)</SelectItem>
                      <SelectItem value="external">📱 Forward to External Number</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  {form.inboundDestType === "extension" && (
                    <>
                      <Label>Extension</Label>
                      <Select value={form.inboundDestId || ""} onValueChange={(v) => setForm({ ...form, inboundDestId: v })}>
                        <SelectTrigger data-testid="select-dest-extension"><SelectValue placeholder="Pick extension..."/></SelectTrigger>
                        <SelectContent>
                          {allExtensions.filter((e: any) => !form.restaurantId || e.restaurantId === form.restaurantId).map((e: any) => (
                            <SelectItem key={e.id} value={e.id}>Ext {e.extensionNumber} — {e.displayName}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </>
                  )}
                  {form.inboundDestType === "ring_group" && (
                    <>
                      <Label>Ring Group</Label>
                      <Select value={form.inboundDestId || ""} onValueChange={(v) => setForm({ ...form, inboundDestId: v })}>
                        <SelectTrigger data-testid="select-dest-ring-group"><SelectValue placeholder="Pick ring group..."/></SelectTrigger>
                        <SelectContent>
                          {allRingGroups.filter((g: any) => !form.restaurantId || g.restaurantId === form.restaurantId).map((g: any) => (
                            <SelectItem key={g.id} value={g.id}>{g.name} ({g.groupNumber}) · {(g.extensionIds || []).length} ext</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </>
                  )}
                  {form.inboundDestType === "external" && (
                    <>
                      <Label>External Number (E.164)</Label>
                      <Input value={form.inboundDestId || ""} onChange={(e) => setForm({ ...form, inboundDestId: e.target.value })} placeholder="+447xxxxxxxxx" data-testid="input-dest-external"/>
                    </>
                  )}
                  {form.inboundDestType === "voicemail" && (
                    <div className="text-xs text-muted-foreground pt-6">📬 Calls go to default voicemail (Ext 1000)</div>
                  )}
                  {form.inboundDestType === "ivr" && (
                    <div className="text-xs text-amber-600 pt-6">⚠️ Configure IVR menu in shop's call settings</div>
                  )}
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">💡 After saving, click "Push to UCM" on the row to apply this routing in the actual phone system.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowForm(false); setEditing(null); }} data-testid="button-cancel-number">Cancel</Button>
            <Button onClick={() => saveMut.mutate(form)} disabled={saveMut.isPending || !form.number || !form.restaurantId} data-testid="button-save-number" className="bg-emerald-600 hover:bg-emerald-700">
              {saveMut.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin"/> : <Save className="h-4 w-4 mr-2"/>}
              {editing ? "Update" : "Save Number"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Hash className="h-4 w-4"/>All Phone Numbers</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin"/>Loading...</div>
          ) : numbers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Phone className="h-12 w-12 mx-auto mb-2 opacity-30"/>
              <p>No numbers yet. Click <strong>Add Phone Number</strong> to assign 020 3951 4642 or 056 0385 1429 to a shop.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {numbers.map((n: any) => {
                const destLabel =
                  n.inboundDestType === "extension" ? `→ Ext ${(allExtensions.find((e: any) => e.id === n.inboundDestId)?.extensionNumber || "?")}` :
                  n.inboundDestType === "ring_group" ? `→ ${(allRingGroups.find((g: any) => g.id === n.inboundDestId)?.name || "Group")}` :
                  n.inboundDestType === "external" ? `→ ${n.inboundDestId || "?"}` :
                  n.inboundDestType === "ivr" ? "→ IVR menu" :
                  "→ Voicemail";
                return (
                <div key={n.id} data-testid={`row-number-${n.id}`} className="flex items-center justify-between p-3 rounded-lg border hover:bg-slate-50">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-2.5 h-2.5 rounded-full ${n.status === "active" ? "bg-emerald-500" : "bg-slate-400"}`}/>
                    <div className="flex-1 min-w-0">
                      <div className="font-mono font-semibold flex items-center gap-2" data-testid={`text-number-${n.id}`}>
                        {n.number}
                        <Badge variant="outline" className="text-xs font-normal">{destLabel}</Badge>
                        {n.ucmSynced ? (
                          <Badge className="bg-emerald-500 text-xs">✅ UCM</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">⚠️ Not pushed</Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {shopMap[n.restaurantId] || "(unassigned)"} · {n.numberType} · {n.provider} · £{parseFloat(n.monthlyCost || "0").toFixed(2)}/mo
                        {n.label ? ` · ${n.label}` : ""}
                        {n.ucmSyncError ? ` · ❌ ${n.ucmSyncError}` : ""}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <PushToUcmButton type="number" id={n.id} synced={n.ucmSynced} queryKey="/api/pbx/numbers-all"/>
                    <Button size="sm" variant="ghost" onClick={() => startEdit(n)} data-testid={`button-edit-number-${n.id}`}>Edit</Button>
                    <Button size="sm" variant="ghost" onClick={() => { if (confirm(`Remove ${n.number}?`)) delMut.mutate(n.id); }} data-testid={`button-delete-number-${n.id}`} className="text-red-600 hover:text-red-700">Delete</Button>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function RingGroupsSection() {
  const qc = useQueryClient();
  const { data: groups = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/pbx/ring-groups"] });
  const { data: shops = [] } = useQuery<any[]>({ queryKey: ["/api/restaurants"] });
  const { data: numbers = [] } = useQuery<any[]>({ queryKey: ["/api/pbx/numbers-all"] });
  const { data: extensions = [] } = useQuery<any[]>({ queryKey: ["/api/pbx/extensions-all"] });
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  const blank = {
    restaurantId: "",
    name: "",
    groupNumber: "6000",
    strategy: "ringall",
    ringTimeSeconds: 20,
    extensionIds: [] as string[],
    assignedNumberId: "",
    failoverDestination: "voicemail:1000",
    enabled: true,
  };
  const [form, setForm] = useState<any>(blank);

  const saveMut = useMutation({
    mutationFn: async (payload: any) => {
      const clean = { ...payload, assignedNumberId: payload.assignedNumberId || null };
      if (editing) return apiRequest("PATCH", `/api/pbx/ring-groups/${editing.id}`, clean);
      return apiRequest("POST", "/api/pbx/ring-groups", clean);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/pbx/ring-groups"] });
      toast({ title: editing ? "Ring group updated" : "Ring group created" });
      setShowForm(false); setEditing(null); setForm(blank);
    },
    onError: (e: any) => toast({ title: "Save failed", description: e.message, variant: "destructive" }),
  });
  const delMut = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/pbx/ring-groups/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/pbx/ring-groups"] }); toast({ title: "Ring group deleted" }); },
  });

  const shopMap = Object.fromEntries(shops.map((s: any) => [s.id, s.name]));
  const numberMap = Object.fromEntries(numbers.map((n: any) => [n.id, n.number]));
  const extByShop = (rid: string) => extensions.filter((e: any) => e.restaurantId === rid);
  const numbersByShop = (rid: string) => numbers.filter((n: any) => n.restaurantId === rid);

  function startEdit(g: any) {
    setEditing(g);
    setForm({ ...blank, ...g, extensionIds: g.extensionIds || [], assignedNumberId: g.assignedNumberId || "" });
    setShowForm(true);
  }
  function startAdd() { setEditing(null); setForm(blank); setShowForm(true); }
  function toggleExt(id: string) {
    const cur = form.extensionIds || [];
    setForm({ ...form, extensionIds: cur.includes(id) ? cur.filter((x: string) => x !== id) : [...cur, id] });
  }

  return (
    <div className="space-y-4">
      <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide">Ring Groups</div>
              <div className="text-3xl font-bold text-purple-700" data-testid="text-rg-total">{groups.length}</div>
              <div className="text-xs text-muted-foreground">One number → multiple staff phones ringing together</div>
            </div>
            <Button onClick={startAdd} data-testid="button-add-ring-group" className="bg-purple-600 hover:bg-purple-700">
              <Globe className="h-4 w-4 mr-2"/>Create Ring Group
            </Button>
          </div>
        </CardContent>
      </Card>

      {showForm && (
        <Card className="border-2 border-purple-400">
          <CardHeader>
            <CardTitle className="text-lg">{editing ? "Edit Ring Group" : "Create Ring Group"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>Shop</Label>
                <Select value={form.restaurantId} onValueChange={(v) => setForm({ ...form, restaurantId: v, extensionIds: [], assignedNumberId: "" })}>
                  <SelectTrigger data-testid="select-rg-shop"><SelectValue placeholder="Select shop..."/></SelectTrigger>
                  <SelectContent>
                    {shops.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Group Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Front Counter" data-testid="input-rg-name"/>
              </div>
              <div>
                <Label>Internal Group Number</Label>
                <Input value={form.groupNumber} onChange={(e) => setForm({ ...form, groupNumber: e.target.value })} placeholder="6000" data-testid="input-rg-number"/>
              </div>
              <div>
                <Label>Ring Strategy</Label>
                <Select value={form.strategy} onValueChange={(v) => setForm({ ...form, strategy: v })}>
                  <SelectTrigger data-testid="select-rg-strategy"><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ringall">Ring All (everyone at once)</SelectItem>
                    <SelectItem value="sequential">Sequential (one by one)</SelectItem>
                    <SelectItem value="random">Random</SelectItem>
                    <SelectItem value="memory">Memory (last answered first)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Ring Time (seconds)</Label>
                <Input type="number" value={form.ringTimeSeconds} onChange={(e) => setForm({ ...form, ringTimeSeconds: parseInt(e.target.value) || 20 })} data-testid="input-rg-ringtime"/>
              </div>
              <div>
                <Label>Inbound Number (optional)</Label>
                <Select value={form.assignedNumberId || "__none__"} onValueChange={(v) => setForm({ ...form, assignedNumberId: v === "__none__" ? "" : v })}>
                  <SelectTrigger data-testid="select-rg-number"><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— None (internal only) —</SelectItem>
                    {numbersByShop(form.restaurantId).map((n: any) => (
                      <SelectItem key={n.id} value={n.id}>{n.number}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label>Failover (if no answer)</Label>
                <Input value={form.failoverDestination || ""} onChange={(e) => setForm({ ...form, failoverDestination: e.target.value })} placeholder="voicemail:1000  |  ext:1001  |  external:447xxxxxxxxx" data-testid="input-rg-failover"/>
              </div>
            </div>

            <div>
              <Label>Extensions in this group ({(form.extensionIds || []).length} selected)</Label>
              {!form.restaurantId ? (
                <p className="text-sm text-muted-foreground italic mt-1">Select a shop first.</p>
              ) : extByShop(form.restaurantId).length === 0 ? (
                <p className="text-sm text-muted-foreground italic mt-1">No extensions for this shop yet.</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2 max-h-48 overflow-y-auto border rounded p-2">
                  {extByShop(form.restaurantId).map((e: any) => {
                    const checked = (form.extensionIds || []).includes(e.id);
                    return (
                      <label key={e.id} data-testid={`checkbox-rg-ext-${e.id}`} className={`flex items-center gap-2 p-2 rounded cursor-pointer text-sm ${checked ? "bg-purple-100 border border-purple-400" : "border hover:bg-slate-50"}`}>
                        <input type="checkbox" checked={checked} onChange={() => toggleExt(e.id)}/>
                        <span><strong>{e.extensionNumber}</strong> {e.displayName}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Switch checked={form.enabled} onCheckedChange={(v) => setForm({ ...form, enabled: v })} data-testid="switch-rg-enabled"/>
              <Label>Enabled</Label>
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={() => saveMut.mutate(form)} disabled={saveMut.isPending || !form.name || !form.restaurantId || !form.groupNumber} data-testid="button-save-ring-group" className="bg-purple-600 hover:bg-purple-700">
                {saveMut.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin"/> : <Save className="h-4 w-4 mr-2"/>}
                {editing ? "Update Group" : "Create Group"}
              </Button>
              <Button variant="outline" onClick={() => { setShowForm(false); setEditing(null); }} data-testid="button-cancel-ring-group">Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Globe className="h-4 w-4"/>All Ring Groups</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin"/>Loading...</div>
          ) : groups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Globe className="h-12 w-12 mx-auto mb-2 opacity-30"/>
              <p>No ring groups yet. Create one to make a number ring multiple staff phones simultaneously.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {groups.map((g: any) => (
                <div key={g.id} data-testid={`row-rg-${g.id}`} className="flex items-center justify-between p-3 rounded-lg border hover:bg-slate-50">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-2.5 h-2.5 rounded-full ${g.enabled ? "bg-emerald-500" : "bg-slate-400"}`}/>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold flex items-center gap-2">
                        <span data-testid={`text-rg-name-${g.id}`}>{g.name}</span>
                        <Badge variant="outline" className="text-xs font-mono">#{g.groupNumber}</Badge>
                        <Badge variant="outline" className="text-xs">{g.strategy}</Badge>
                        {g.assignedNumberId && numberMap[g.assignedNumberId] && (
                          <Badge className="text-xs bg-emerald-100 text-emerald-800 border-emerald-300">📞 {numberMap[g.assignedNumberId]}</Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {shopMap[g.restaurantId] || "(unknown shop)"} · {(g.extensionIds || []).length} extension(s) · ring {g.ringTimeSeconds}s
                        {g.failoverDestination ? ` · failover → ${g.failoverDestination}` : ""}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => startEdit(g)} data-testid={`button-edit-rg-${g.id}`}>Edit</Button>
                    <Button size="sm" variant="ghost" onClick={() => { if (confirm(`Delete "${g.name}"?`)) delMut.mutate(g.id); }} data-testid={`button-delete-rg-${g.id}`} className="text-red-600 hover:text-red-700">Delete</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CloudBridgeSection() {
  const qc = useQueryClient();
  const { data: server } = useQuery<any>({ queryKey: ["/api/pbx/server"] });
  const [bridgeType, setBridgeType] = useState<string>("none");
  const [publicHost, setPublicHost] = useState("");
  const [tunnelId, setTunnelId] = useState("");
  const [notes, setNotes] = useState("");
  const [activeGuide, setActiveGuide] = useState<"cloudflare" | "gdms-basic" | "gdms-plus">("cloudflare");

  useEffect(() => {
    if (server) {
      setBridgeType(server.cloudBridgeType || "none");
      setPublicHost(server.cloudBridgePublicHost || "");
      const cfg = server.cloudBridgeConfig || {};
      setTunnelId(cfg.tunnelId || "");
      setNotes(cfg.notes || "");
    }
  }, [server]);

  const saveMut = useMutation({
    mutationFn: async () => {
      const base = server || {
        name: "Main UCM6302",
        host: publicHost || "ucm.local",
        apiPort: 8089,
        sipPort: 5061,
        username: "admin",
        apiSecret: "placeholder-set-in-ucm6302-tab",
        domain: publicHost || null,
        wsUrl: publicHost ? `wss://${publicHost}:8089/ws` : null,
      };
      return apiRequest("POST", "/api/pbx/server", {
        ...base,
        apiSecret: server ? "" : (base as any).apiSecret,
        cloudBridgeType: bridgeType,
        cloudBridgePublicHost: publicHost || null,
        cloudBridgeStatus: bridgeType === "none" ? "inactive" : "active",
        cloudBridgeConfig: { tunnelId, notes },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/pbx/server"] });
      toast({ title: "Cloud bridge saved", description: `${bridgeType === "none" ? "Bridge disabled" : `Active: ${bridgeType}`}` });
    },
    onError: (e: any) => toast({ title: "Save failed", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-4">
      {/* Push to UCM section */}
      <Card className="border-2 border-purple-300 bg-gradient-to-br from-purple-50 to-fuchsia-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide">🤖 Auto-Sync to UCM6302</div>
              <div className="text-lg font-bold text-purple-800">Push all trunks, extensions, ring-groups & inbound routes</div>
              <div className="text-xs text-muted-foreground">Replaces double data entry — Link24 saves directly into your UCM</div>
            </div>
            <SyncAllUcmButton/>
          </div>
        </CardContent>
      </Card>

      {/* Status banner */}
      <Card className="border-2 border-cyan-200 bg-gradient-to-br from-cyan-50 to-sky-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${bridgeType === "none" ? "bg-slate-200" : "bg-emerald-500"}`}>
                {bridgeType === "none" ? <Ban className="h-6 w-6 text-slate-500"/> : <CheckCircle2 className="h-6 w-6 text-white"/>}
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Active Bridge</div>
                <div className="text-2xl font-bold text-cyan-800" data-testid="text-active-bridge">
                  {bridgeType === "none" ? "❌ Not configured" :
                   bridgeType === "cloudflare" ? "☁️ Cloudflare Tunnel" :
                   bridgeType === "gdms-basic" ? "🟢 GDMS Basic (free)" :
                   "💎 GDMS Plus"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {bridgeType === "none" ? "Phones must be on home WiFi only" : `Remote access via: ${publicHost || "(not set)"}`}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Without bridge</div>
              <div className="text-sm font-semibold text-rose-700">⚠️ Local network only</div>
              <div className="text-xs text-muted-foreground">Bridge required for remote staff/desk phones</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3 option cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Cloudflare */}
        <Card className={`border-2 cursor-pointer transition ${bridgeType === "cloudflare" ? "border-orange-500 ring-2 ring-orange-200" : "border-slate-200 hover:border-orange-300"}`} onClick={() => setBridgeType("cloudflare")} data-testid="card-bridge-cloudflare">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">☁️ Cloudflare Tunnel</CardTitle>
              {bridgeType === "cloudflare" && <Badge className="bg-orange-500">Active</Badge>}
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="text-2xl font-bold text-emerald-600">FREE forever</div>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>✅ Unlimited concurrent calls</li>
              <li>✅ Unlimited bandwidth</li>
              <li>✅ Your own custom domain</li>
              <li>✅ End-to-end TLS encryption</li>
              <li>⚠️ Setup takes ~15 minutes</li>
              <li>⚠️ Needs Cloudflare account + a domain</li>
            </ul>
            <div className="pt-2 border-t">
              <div className="text-xs font-semibold text-emerald-700">🏆 Best for production scale</div>
            </div>
          </CardContent>
        </Card>

        {/* GDMS Basic */}
        <Card className={`border-2 cursor-pointer transition ${bridgeType === "gdms-basic" ? "border-emerald-500 ring-2 ring-emerald-200" : "border-slate-200 hover:border-emerald-300"}`} onClick={() => setBridgeType("gdms-basic")} data-testid="card-bridge-gdms-basic">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">🟢 GDMS Basic</CardTitle>
              {bridgeType === "gdms-basic" && <Badge className="bg-emerald-500">Active</Badge>}
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="text-2xl font-bold text-emerald-600">FREE</div>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>✅ 5-minute setup (Grandstream native)</li>
              <li>✅ No domain or DNS needed</li>
              <li>✅ Auto-discovers your UCM</li>
              <li>⚠️ Only 2 simultaneous calls</li>
              <li>⚠️ 50 endpoints max</li>
              <li>⚠️ Vendor-locked to Grandstream</li>
            </ul>
            <div className="pt-2 border-t">
              <div className="text-xs font-semibold text-amber-700">👌 Best for testing / Solo plan</div>
            </div>
          </CardContent>
        </Card>

        {/* GDMS Plus */}
        <Card className={`border-2 cursor-pointer transition ${bridgeType === "gdms-plus" ? "border-purple-500 ring-2 ring-purple-200" : "border-slate-200 hover:border-purple-300"}`} onClick={() => setBridgeType("gdms-plus")} data-testid="card-bridge-gdms-plus">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">💎 GDMS Plus</CardTitle>
              {bridgeType === "gdms-plus" && <Badge className="bg-purple-500">Active</Badge>}
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="text-2xl font-bold text-purple-600">$175/yr</div>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>✅ 8 simultaneous calls</li>
              <li>✅ 50 users / 50 endpoints</li>
              <li>✅ 3-month free trial</li>
              <li>✅ Native Grandstream support</li>
              <li>⚠️ Annual subscription</li>
            </ul>
            <div className="pt-2 border-t">
              <div className="text-xs font-semibold text-purple-700">💡 Backup if Cloudflare too complex</div>
            </div>
          </CardContent>
        </Card>

        {/* None */}
        <Card className={`border-2 cursor-pointer transition md:col-span-3 ${bridgeType === "none" ? "border-slate-500 ring-2 ring-slate-200" : "border-slate-200 hover:border-slate-300"}`} onClick={() => setBridgeType("none")} data-testid="card-bridge-none">
          <CardContent className="pt-4 flex items-center gap-3">
            <Ban className="h-5 w-5 text-slate-500"/>
            <div className="flex-1">
              <div className="font-semibold text-sm">No bridge (local network only)</div>
              <div className="text-xs text-muted-foreground">Phones must be on the same WiFi as the UCM. Useful while testing.</div>
            </div>
            {bridgeType === "none" && <Badge variant="secondary">Selected</Badge>}
          </CardContent>
        </Card>
      </div>

      {/* Config form */}
      {bridgeType !== "none" && (
        <Card className="border-2 border-cyan-300">
          <CardHeader>
            <CardTitle className="text-base">Bridge Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>Public Host (used by remote phones)</Label>
                <Input
                  value={publicHost}
                  onChange={(e) => setPublicHost(e.target.value)}
                  placeholder={bridgeType === "cloudflare" ? "ucm.link24.app" : bridgeType === "gdms-basic" ? "abc123.gdms.cloud" : "abc123.gdms.cloud"}
                  data-testid="input-bridge-public-host"
                />
                <p className="text-xs text-muted-foreground mt-1">This is what gets put into softphone SIP server settings instead of your home IP.</p>
              </div>
              {bridgeType === "cloudflare" && (
                <div>
                  <Label>Cloudflare Tunnel ID (UUID)</Label>
                  <Input value={tunnelId} onChange={(e) => setTunnelId(e.target.value)} placeholder="6ff42ae2-765d-4adf-8112-..." data-testid="input-bridge-tunnel-id"/>
                </div>
              )}
              {(bridgeType === "gdms-basic" || bridgeType === "gdms-plus") && (
                <div>
                  <Label>GDMS Device Serial / ID</Label>
                  <Input value={tunnelId} onChange={(e) => setTunnelId(e.target.value)} placeholder="UCM6302-XXXXXXXX" data-testid="input-bridge-gdms-id"/>
                </div>
              )}
              <div className="md:col-span-2">
                <Label>Notes</Label>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Internal notes (e.g. setup date, tunnel name)" data-testid="input-bridge-notes"/>
              </div>
            </div>
            <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending} data-testid="button-save-bridge" className="bg-cyan-600 hover:bg-cyan-700">
              {saveMut.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin"/> : <Save className="h-4 w-4 mr-2"/>}
              Save Bridge Configuration
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Setup guides */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-base flex items-center gap-2"><Sparkles className="h-4 w-4"/>Setup Guides</CardTitle>
            <div className="flex gap-1 flex-wrap">
              <Button size="sm" variant={activeGuide === "cloudflare" ? "default" : "outline"} onClick={() => setActiveGuide("cloudflare")} data-testid="button-guide-cloudflare">☁️ Cloudflare</Button>
              <Button size="sm" variant={activeGuide === "gdms-basic" ? "default" : "outline"} onClick={() => setActiveGuide("gdms-basic")} data-testid="button-guide-gdms-basic">🟢 GDMS Basic</Button>
              <Button size="sm" variant={activeGuide === "gdms-plus" ? "default" : "outline"} onClick={() => setActiveGuide("gdms-plus")} data-testid="button-guide-gdms-plus">💎 GDMS Plus</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {activeGuide === "cloudflare" && <CloudflareGuide/>}
          {activeGuide === "gdms-basic" && <GdmsBasicGuide/>}
          {activeGuide === "gdms-plus" && <GdmsPlusGuide/>}
        </CardContent>
      </Card>
    </div>
  );
}

function CloudflareGuide() {
  return (
    <div className="space-y-4 text-sm">
      <div className="bg-orange-50 border-l-4 border-orange-400 p-3 rounded">
        <p className="font-semibold text-orange-900">☁️ Cloudflare Tunnel — FREE forever, unlimited calls</p>
        <p className="text-orange-800 text-xs mt-1">Routes your UCM through Cloudflare's network so remote phones can register without opening any ports on your home router. Keeps your home IP hidden.</p>
      </div>

      <div className="space-y-3">
        <div>
          <p className="font-semibold mb-1">📋 What you need first:</p>
          <ul className="list-disc ml-6 text-xs space-y-0.5 text-muted-foreground">
            <li>A free Cloudflare account → <a href="https://dash.cloudflare.com/sign-up" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline inline-flex items-center gap-1">Sign up <ExternalLink className="h-3 w-3"/></a></li>
            <li>A domain you own pointed at Cloudflare (e.g. link24.app) — £8-12/year. <a href="https://www.cloudflare.com/products/registrar/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline inline-flex items-center gap-1">Cloudflare Registrar <ExternalLink className="h-3 w-3"/></a> (cheap, no markup)</li>
            <li>A small computer always running on your home network (Raspberry Pi, old laptop, mini-PC, or even your UCM via Docker) — to run the `cloudflared` daemon</li>
          </ul>
        </div>

        <div>
          <p className="font-semibold mb-1">🛠️ Setup steps (15-20 min):</p>
          <ol className="list-decimal ml-6 text-xs space-y-2 text-muted-foreground">
            <li>
              <strong>Add your domain to Cloudflare</strong> (Dashboard → Add a site → enter domain → free plan)
            </li>
            <li>
              <strong>Create a tunnel</strong>: Cloudflare Zero Trust dashboard → Networks → Tunnels → Create tunnel → name it "link24-pbx"
              <a href="https://one.dash.cloudflare.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline inline-flex items-center gap-1 ml-1">Open Zero Trust <ExternalLink className="h-3 w-3"/></a>
            </li>
            <li>
              <strong>Install cloudflared</strong> on your home machine (Linux/Pi):
              <pre className="bg-slate-900 text-emerald-300 p-2 rounded mt-1 overflow-x-auto text-[11px]">{`# Linux/Pi (Debian-based)
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64.deb -o cloudflared.deb
sudo dpkg -i cloudflared.deb

# Windows
# Download .msi from https://github.com/cloudflare/cloudflared/releases

# Mac
brew install cloudflared`}</pre>
            </li>
            <li>
              <strong>Connect to your tunnel</strong> (Cloudflare gives you a copy-paste command in the dashboard like):
              <pre className="bg-slate-900 text-emerald-300 p-2 rounded mt-1 overflow-x-auto text-[11px]">{`sudo cloudflared service install <YOUR_TUNNEL_TOKEN>`}</pre>
            </li>
            <li>
              <strong>Add public hostnames</strong> in the tunnel's "Public Hostname" tab. Add 3 entries:
              <table className="text-xs w-full mt-1 border">
                <thead className="bg-slate-100">
                  <tr><th className="p-1 border text-left">Subdomain</th><th className="p-1 border text-left">Service</th><th className="p-1 border text-left">URL</th></tr>
                </thead>
                <tbody>
                  <tr><td className="p-1 border font-mono">ucm</td><td className="p-1 border">HTTPS</td><td className="p-1 border font-mono">192.168.0.109:8089</td></tr>
                  <tr><td className="p-1 border font-mono">sip</td><td className="p-1 border">TCP</td><td className="p-1 border font-mono">192.168.0.109:5060</td></tr>
                  <tr><td className="p-1 border font-mono">api</td><td className="p-1 border">HTTPS</td><td className="p-1 border font-mono">192.168.0.109:8443</td></tr>
                </tbody>
              </table>
            </li>
            <li>
              <strong>Test it</strong>: Open <code className="bg-slate-100 px-1 rounded">https://ucm.yourdomain.com</code> in your browser — UCM login page should load from anywhere in the world!
            </li>
            <li>
              <strong>Save above ↑</strong>: Set Bridge Type = ☁️ Cloudflare, Public Host = <code className="bg-slate-100 px-1 rounded">ucm.yourdomain.com</code>, paste your Tunnel UUID, hit Save.
            </li>
          </ol>
        </div>

        <div className="bg-amber-50 border-l-4 border-amber-400 p-3 rounded text-xs">
          <p className="font-semibold text-amber-900">⚠️ SIP-over-TCP needed</p>
          <p className="text-amber-800">Cloudflare Tunnel doesn't carry UDP, so configure your softphones to use <strong>SIP over TCP</strong> (or TLS) on port 5060. Most modern phones (Linphone, Zoiper, Grandstream Wave) support this — just toggle in account settings.</p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <a href="https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" data-testid="link-cloudflare-docs"><ExternalLink className="h-3 w-3 mr-1"/>Cloudflare Tunnel Docs</Button>
          </a>
          <a href="https://one.dash.cloudflare.com/" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" data-testid="link-cloudflare-zerotrust"><ExternalLink className="h-3 w-3 mr-1"/>Open Zero Trust Dashboard</Button>
          </a>
        </div>
      </div>
    </div>
  );
}

function GdmsBasicGuide() {
  return (
    <div className="space-y-4 text-sm">
      <div className="bg-emerald-50 border-l-4 border-emerald-400 p-3 rounded">
        <p className="font-semibold text-emerald-900">🟢 GDMS Basic — FREE, 5-minute setup</p>
        <p className="text-emerald-800 text-xs mt-1">Grandstream's own cloud (designed for UCM6302). Auto-discovers your UCM, gives it a public address, supports remote phone registration with zero router config.</p>
      </div>

      <div>
        <p className="font-semibold mb-1">📋 What you need:</p>
        <ul className="list-disc ml-6 text-xs space-y-0.5 text-muted-foreground">
          <li>Just a free Grandstream account</li>
          <li>Your UCM6302 must be online (already is ✅)</li>
        </ul>
      </div>

      <div>
        <p className="font-semibold mb-1">🛠️ Setup steps (~5 min):</p>
        <ol className="list-decimal ml-6 text-xs space-y-1.5 text-muted-foreground">
          <li>
            Go to <a href="https://www.gdms.cloud/login/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline inline-flex items-center gap-1">www.gdms.cloud <ExternalLink className="h-3 w-3"/></a> → click <strong>Sign Up Free</strong>
          </li>
          <li>Verify email and log in</li>
          <li>Click <strong>Device Management</strong> → <strong>Add Device</strong> → enter your UCM6302's MAC address (find on the box label, or in UCM web admin → Status)</li>
          <li>UCM6302 auto-claims itself — wait 30 seconds, refresh</li>
          <li>Once "Online", click the device → <strong>Remote Connection</strong> → enable. GDMS gives you a public URL like <code className="bg-slate-100 px-1 rounded">abc123.gdms.cloud</code></li>
          <li>In your softphone, set SIP server = that GDMS URL (instead of your home IP). Username/password = your extension's SIP creds. Done.</li>
          <li><strong>Save above ↑</strong>: Bridge Type = 🟢 GDMS Basic, Public Host = your GDMS URL, paste UCM serial.</li>
        </ol>
      </div>

      <div className="bg-amber-50 border-l-4 border-amber-400 p-3 rounded text-xs">
        <p className="font-semibold text-amber-900">⚠️ Free plan limits</p>
        <ul className="text-amber-800 list-disc ml-5">
          <li><strong>2 simultaneous calls</strong> max — perfect for Solo plan, OK for one Duo customer, blocks Team/Enterprise</li>
          <li><strong>50 endpoints</strong> max — covers ~10 small shops</li>
          <li>Upgrade to GDMS Plus ($175/yr → 8 calls / 50 users) when you outgrow this</li>
        </ul>
      </div>

      <a href="https://www.gdms.cloud/login/" target="_blank" rel="noopener noreferrer">
        <Button variant="outline" size="sm" data-testid="link-gdms-signup"><ExternalLink className="h-3 w-3 mr-1"/>Sign Up at GDMS.cloud (Free)</Button>
      </a>
    </div>
  );
}

function GdmsPlusGuide() {
  return (
    <div className="space-y-4 text-sm">
      <div className="bg-purple-50 border-l-4 border-purple-400 p-3 rounded">
        <p className="font-semibold text-purple-900">💎 GDMS Plus — $175/yr (3-month free trial)</p>
        <p className="text-purple-800 text-xs mt-1">Same as GDMS Basic but raises limits: 8 simultaneous calls, 50 users. Good middle option if you don't want to set up Cloudflare.</p>
      </div>

      <div>
        <p className="font-semibold mb-1">🛠️ How to upgrade:</p>
        <ol className="list-decimal ml-6 text-xs space-y-1.5 text-muted-foreground">
          <li>Sign up for GDMS Basic first (above guide)</li>
          <li>Once UCM is added, click your account in top-right → <strong>Upgrade Plan</strong> → choose <strong>Plus</strong> → start 3-month free trial (no card needed initially)</li>
          <li>After trial: $175/year auto-renews. Cancel anytime in account settings.</li>
          <li><strong>Save above ↑</strong>: Bridge Type = 💎 GDMS Plus.</li>
        </ol>
      </div>

      <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded text-xs">
        <p className="font-semibold text-blue-900">💰 Cost vs benefit math</p>
        <p className="text-blue-800">$175/yr ≈ £138/yr ≈ £11.50/mo. With Duo plan @ £14/mo profit £7 — you'd cover GDMS Plus with 2 paying Duo customers. After that it's pure profit. Cheaper still: free Cloudflare Tunnel = unlimited.</p>
      </div>

      <a href="https://www.gdms.cloud/" target="_blank" rel="noopener noreferrer">
        <Button variant="outline" size="sm" data-testid="link-gdms-plus"><ExternalLink className="h-3 w-3 mr-1"/>Upgrade at GDMS.cloud</Button>
      </a>
    </div>
  );
}

function PushToUcmButton({ type, id, synced, queryKey }: { type: "number" | "extension" | "trunk" | "ring-group"; id: string; synced?: boolean; queryKey: string }) {
  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: () => apiRequest("POST", `/api/pbx/ucm/sync/${type}/${id}`),
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: [queryKey] });
      toast({ title: "✅ Pushed to UCM", description: data?.message || "Synced successfully" });
    },
    onError: (e: any) => toast({ title: "❌ UCM push failed", description: e.message?.slice(0, 200) || "Check UCM6302 is reachable", variant: "destructive" }),
  });
  return (
    <Button
      size="sm"
      variant={synced ? "outline" : "default"}
      onClick={() => mut.mutate()}
      disabled={mut.isPending}
      className={synced ? "" : "bg-purple-600 hover:bg-purple-700"}
      data-testid={`button-push-ucm-${type}-${id}`}
    >
      {mut.isPending ? <Loader2 className="h-3 w-3 mr-1 animate-spin"/> : <Cloud className="h-3 w-3 mr-1"/>}
      {synced ? "Re-push" : "Push to UCM"}
    </Button>
  );
}

export function SyncAllUcmButton() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<any>(null);
  const mut = useMutation({
    mutationFn: () => apiRequest("POST", "/api/pbx/ucm/sync-all"),
    onSuccess: (data: any) => {
      setResult(data);
      qc.invalidateQueries({ queryKey: ["/api/pbx/numbers-all"] });
      qc.invalidateQueries({ queryKey: ["/api/pbx/extensions-all"] });
      qc.invalidateQueries({ queryKey: ["/api/pbx/ring-groups"] });
      qc.invalidateQueries({ queryKey: ["/api/pbx/trunks"] });
      const s = data?.summary;
      toast({ title: data.ok ? "✅ Sync complete" : "⚠️ Sync finished with errors", description: `${s?.ok || 0}/${s?.total || 0} pushed; ${s?.failed || 0} failed` });
    },
    onError: (e: any) => toast({ title: "❌ Sync-all failed", description: e.message, variant: "destructive" }),
  });
  return (
    <>
      <Button onClick={() => { setResult(null); setOpen(true); mut.mutate(); }} disabled={mut.isPending} className="bg-purple-600 hover:bg-purple-700" data-testid="button-sync-all-ucm">
        {mut.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin"/> : <Cloud className="h-4 w-4 mr-2"/>}
        🤖 Push Everything to UCM
      </Button>
      {open && result && (
        <Card className="border-2 border-purple-300 mt-3">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Sync Result: {result.summary?.ok}/{result.summary?.total} OK · {result.summary?.failed} failed</CardTitle>
              <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>×</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="max-h-64 overflow-y-auto text-xs space-y-1">
              {(result.log || []).map((l: any, i: number) => (
                <div key={i} className={`flex gap-2 ${l.ok ? "text-emerald-700" : "text-rose-700"}`}>
                  <span className="font-mono">{l.ok ? "✅" : "❌"}</span>
                  <span className="font-semibold">{l.type}</span>
                  <span>{l.name}</span>
                  {l.error && <span className="text-rose-600">— {l.error}</span>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}

function ProfitSection() {
  const { data, isLoading } = useQuery<any>({ queryKey: ["/api/phone-billing/profit"] });
  if (isLoading) return <div className="p-6 text-center"><Loader2 className="h-6 w-6 animate-spin inline"/></div>;
  if (!data) return <div className="p-6 text-muted-foreground">No data</div>;
  const t = data.totals;
  const fmt = (n: number) => `£${n.toFixed(2)}`;
  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-4 gap-3">
        <Card className="border-emerald-300"><CardContent className="pt-6">
          <div className="text-xs text-muted-foreground uppercase">MRR (live)</div>
          <div className="text-3xl font-bold text-emerald-700" data-testid="text-profit-mrr">{fmt(t.mrr)}</div>
          <div className="text-xs text-muted-foreground mt-1">{t.active} active shops</div>
        </CardContent></Card>
        <Card className="border-cyan-300"><CardContent className="pt-6">
          <div className="text-xs text-muted-foreground uppercase">Potential MRR</div>
          <div className="text-3xl font-bold text-cyan-700" data-testid="text-profit-potential">{fmt(t.potentialMrr)}</div>
          <div className="text-xs text-muted-foreground mt-1">{t.trialing} on trial</div>
        </CardContent></Card>
        <Card className="border-rose-300"><CardContent className="pt-6">
          <div className="text-xs text-muted-foreground uppercase">Costs / mo</div>
          <div className="text-3xl font-bold text-rose-700" data-testid="text-profit-cost">{fmt(t.cost)}</div>
          <div className="text-xs text-muted-foreground mt-1">{t.trunks} trunks · {t.numbers} numbers</div>
        </CardContent></Card>
        <Card className={`border-2 ${t.profit >= 0 ? "border-emerald-500 bg-emerald-50" : "border-rose-500 bg-rose-50"}`}><CardContent className="pt-6">
          <div className="text-xs text-muted-foreground uppercase">Profit / mo</div>
          <div className={`text-3xl font-bold ${t.profit >= 0 ? "text-emerald-700" : "text-rose-700"}`} data-testid="text-profit-net">{fmt(t.profit)}</div>
          <div className="text-xs text-muted-foreground mt-1">Margin: {t.mrr > 0 ? ((t.profit / t.mrr) * 100).toFixed(1) : "—"}%</div>
        </CardContent></Card>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Per-shop breakdown</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-muted-foreground border-b">
                <tr>
                  <th className="text-left py-2">Shop</th>
                  <th className="text-left">Plan</th>
                  <th className="text-left">Status</th>
                  <th className="text-right">Price</th>
                  <th className="text-right">Trunks</th>
                  <th className="text-right">Numbers</th>
                  <th className="text-right">Cost</th>
                  <th className="text-right">Revenue</th>
                  <th className="text-right">Profit</th>
                </tr>
              </thead>
              <tbody>
                {data.breakdown.map((b: any) => (
                  <tr key={b.restaurantId} className="border-b" data-testid={`row-profit-${b.restaurantId}`}>
                    <td className="py-2 font-semibold">{b.shopName}</td>
                    <td><Badge variant="outline">{b.planTier}</Badge></td>
                    <td><Badge variant={b.status === "active" ? "default" : b.status === "trialing" ? "secondary" : "outline"}>{b.status}</Badge></td>
                    <td className="text-right">{fmt(b.monthlyPrice)}</td>
                    <td className="text-right">{b.trunkCount}</td>
                    <td className="text-right">{b.numberCount}</td>
                    <td className="text-right text-rose-600">{fmt(b.cost)}</td>
                    <td className="text-right text-emerald-600">{fmt(b.revenue)}</td>
                    <td className={`text-right font-bold ${b.profit >= 0 ? "text-emerald-700" : "text-rose-700"}`}>{fmt(b.profit)}</td>
                  </tr>
                ))}
                {data.breakdown.length === 0 && (
                  <tr><td colSpan={9} className="text-center py-6 text-muted-foreground">No subscriptions yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="text-xs text-muted-foreground mt-3">
            Cost assumptions: £{data.costAssumptions.trunkCost}/mo per trunk · £{data.costAssumptions.numberCost}/mo per number. Trialing shops show £0 revenue until trial ends.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ====================================================================
// Phone Landing — Offers Manager
// ====================================================================
type PhoneOffer = {
  id: string; slug: string; title: string; badge?: string | null;
  tagline?: string | null; price: string; priceSuffix?: string | null;
  bullets: string[]; ctaLabel?: string | null; accentColor?: string | null;
  enabled: boolean; sortOrder: number;
};

function SiteSettingsCard() {
  const qc = useQueryClient();
  const { data: settings } = useQuery<Record<string, string>>({
    queryKey: ["/api/phone-landing/settings"],
  });
  const [freephone, setFreephone] = useState("");
  useEffect(() => {
    if (settings?.freephoneNumber !== undefined) setFreephone(settings.freephoneNumber || "");
  }, [settings?.freephoneNumber]);

  const saveMut = useMutation({
    mutationFn: async (data: Record<string, string>) =>
      apiRequest("PATCH", "/api/phone-landing/settings", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/phone-landing/settings"] });
      toast({ title: "Saved", description: "Public landing page updated." });
    },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  return (
    <Card data-testid="card-site-settings">
      <CardHeader>
        <CardTitle className="text-base">Public Page Settings</CardTitle>
        <CardDescription>Free contact number shown in the header & footer of /phone-landing</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="freephone-input" className="text-xs">Freephone number (shown to customers)</Label>
          <div className="flex gap-2">
            <Input
              id="freephone-input"
              value={freephone}
              onChange={(e) => setFreephone(e.target.value)}
              placeholder="0800 4714 726"
              className="max-w-xs"
              data-testid="input-freephone-number"
            />
            <Button
              size="sm"
              onClick={() => saveMut.mutate({ freephoneNumber: freephone.trim() })}
              disabled={saveMut.isPending || !freephone.trim()}
              data-testid="button-save-freephone"
            >
              {saveMut.isPending ? "Saving…" : "Save"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Tip: leave blank to use the default. Spaces are OK — we tidy it up for the dial link.</p>
        </div>
      </CardContent>
    </Card>
  );
}

function OffersSection() {
  const qc = useQueryClient();
  const { data: offers = [], isLoading } = useQuery<PhoneOffer[]>({
    queryKey: ["/api/phone-landing/offers", "all"],
    queryFn: async () => {
      const r = await fetch("/api/phone-landing/offers?all=1");
      return r.json();
    },
  });

  const updateMut = useMutation({
    mutationFn: async ({ slug, data }: { slug: string; data: Partial<PhoneOffer> }) =>
      apiRequest("PATCH", `/api/phone-landing/offers/${slug}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/phone-landing/offers", "all"] });
      qc.invalidateQueries({ queryKey: ["/api/phone-landing/offers"] });
      toast({ title: "Saved" });
    },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const createMut = useMutation({
    mutationFn: async (data: Partial<PhoneOffer>) =>
      apiRequest("POST", "/api/phone-landing/offers", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/phone-landing/offers", "all"] });
      toast({ title: "Created" });
    },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/phone-landing/offers/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/phone-landing/offers", "all"] });
      toast({ title: "Deleted" });
    },
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5" /> Landing Page Offers
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Toggle on/off, edit price & bullets. Live at{" "}
              <a href="/phone-landing" target="_blank" className="text-primary underline">/phone-landing</a>
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => {
              const slug = prompt("New offer slug (lowercase, no spaces):");
              if (!slug) return;
              createMut.mutate({
                slug, title: "New Offer", badge: "OFFER", tagline: "",
                price: "0.00", priceSuffix: "/month", bullets: [],
                accentColor: "from-rose-500 to-purple-600", enabled: true,
                sortOrder: (offers.length + 1),
              });
            }}
            data-testid="button-new-offer"
          >
            <Plus className="h-4 w-4 mr-1" /> New Offer
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}
        <div className="space-y-3">
          {offers.map((o) => (
            <OfferEditor
              key={o.id}
              offer={o}
              onSave={(data) => updateMut.mutate({ slug: o.slug, data })}
              onDelete={() => {
                if (confirm(`Delete "${o.title}"?`)) deleteMut.mutate(o.id);
              }}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function OfferEditor({ offer, onSave, onDelete }: { offer: PhoneOffer; onSave: (data: Partial<PhoneOffer>) => void; onDelete: () => void }) {
  const [title, setTitle] = useState(offer.title);
  const [badge, setBadge] = useState(offer.badge || "");
  const [tagline, setTagline] = useState(offer.tagline || "");
  const [price, setPrice] = useState(offer.price);
  const [bulletsText, setBulletsText] = useState((offer.bullets || []).join("\n"));
  const [enabled, setEnabled] = useState(offer.enabled);
  const [sortOrder, setSortOrder] = useState(offer.sortOrder);
  const [accentColor, setAccentColor] = useState(offer.accentColor || "from-rose-500 to-purple-600");

  const dirty =
    title !== offer.title || badge !== (offer.badge || "") || tagline !== (offer.tagline || "") ||
    price !== offer.price || bulletsText !== (offer.bullets || []).join("\n") ||
    enabled !== offer.enabled || sortOrder !== offer.sortOrder ||
    accentColor !== (offer.accentColor || "from-rose-500 to-purple-600");

  return (
    <div className="border rounded-lg p-3 bg-card" data-testid={`offer-editor-${offer.slug}`}>
      <div className="flex items-center justify-between mb-3 gap-2">
        <div className="flex items-center gap-2">
          <Switch checked={enabled} onCheckedChange={setEnabled} data-testid={`switch-offer-enabled-${offer.slug}`} />
          <code className="text-xs bg-muted px-2 py-0.5 rounded">{offer.slug}</code>
          <Badge variant={enabled ? "default" : "outline"} className="text-[10px]">
            {enabled ? "LIVE" : "HIDDEN"}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          {dirty && (
            <Button
              size="sm"
              onClick={() => onSave({ title, badge, tagline, price, bullets: bulletsText.split("\n").map(s => s.trim()).filter(Boolean), enabled, sortOrder, accentColor })}
              data-testid={`button-save-offer-${offer.slug}`}
            >
              <Save className="h-3 w-3 mr-1" /> Save
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={onDelete} data-testid={`button-delete-offer-${offer.slug}`}>
            <Trash2 className="h-3 w-3 text-destructive" />
          </Button>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">Title</Label>
          <Input value={title} onChange={e => setTitle(e.target.value)} data-testid={`input-offer-title-${offer.slug}`} />
        </div>
        <div>
          <Label className="text-xs">Badge</Label>
          <Input value={badge} onChange={e => setBadge(e.target.value)} data-testid={`input-offer-badge-${offer.slug}`} />
        </div>
        <div className="md:col-span-2">
          <Label className="text-xs">Tagline</Label>
          <Input value={tagline} onChange={e => setTagline(e.target.value)} data-testid={`input-offer-tagline-${offer.slug}`} />
        </div>
        <div>
          <Label className="text-xs">Price (£)</Label>
          <Input type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} data-testid={`input-offer-price-${offer.slug}`} />
        </div>
        <div>
          <Label className="text-xs">Sort Order</Label>
          <Input type="number" value={sortOrder} onChange={e => setSortOrder(parseInt(e.target.value) || 0)} data-testid={`input-offer-sort-${offer.slug}`} />
        </div>
        <div className="md:col-span-2">
          <Label className="text-xs">Accent Color (Tailwind gradient)</Label>
          <Select value={accentColor} onValueChange={setAccentColor}>
            <SelectTrigger data-testid={`select-offer-color-${offer.slug}`}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="from-rose-500 to-orange-500">🌅 Rose → Orange</SelectItem>
              <SelectItem value="from-purple-500 to-pink-600">💜 Purple → Pink</SelectItem>
              <SelectItem value="from-amber-500 to-rose-600">✨ Amber → Rose (Premium)</SelectItem>
              <SelectItem value="from-blue-500 to-cyan-500">🌊 Blue → Cyan</SelectItem>
              <SelectItem value="from-emerald-500 to-teal-600">🌿 Emerald → Teal</SelectItem>
              <SelectItem value="from-slate-500 to-slate-700">⚫ Slate</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-2">
          <Label className="text-xs">Bullets (one per line)</Label>
          <Textarea rows={6} value={bulletsText} onChange={e => setBulletsText(e.target.value)} data-testid={`input-offer-bullets-${offer.slug}`} />
        </div>
      </div>
    </div>
  );
}

// ====================================================================
// Phone Landing — Inquiries Inbox
// ====================================================================
type PhoneInquiry = {
  id: string; name: string; email: string; phone?: string | null;
  business?: string | null; businessType?: string | null; offerSlug?: string | null;
  lines: number; extensions: number; appUsers: number; addons: string[];
  estimatedMonthly?: string | null; message?: string | null;
  status: string; notes?: string | null; createdAt: string;
};

function InquiriesSection() {
  const qc = useQueryClient();
  const { data: inquiries = [], isLoading } = useQuery<PhoneInquiry[]>({
    queryKey: ["/api/phone-landing/inquiries"],
  });

  const updateMut = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<PhoneInquiry> }) =>
      apiRequest("PATCH", `/api/phone-landing/inquiries/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/phone-landing/inquiries"] }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/phone-landing/inquiries/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/phone-landing/inquiries"] });
      toast({ title: "Deleted" });
    },
  });

  const newCount = inquiries.filter(i => i.status === "new").length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Inbox className="h-5 w-5" /> Customer Inquiries
          {newCount > 0 && <Badge className="bg-rose-500 text-white">{newCount} new</Badge>}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Submitted via the public landing page at /phone-landing
        </p>
      </CardHeader>
      <CardContent>
        {isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}
        {!isLoading && inquiries.length === 0 && (
          <div className="text-center text-muted-foreground py-8" data-testid="text-no-inquiries">
            No inquiries yet. They&rsquo;ll appear here when customers fill the form.
          </div>
        )}
        <div className="space-y-3">
          {inquiries.map((inq) => (
            <div key={inq.id} className="border rounded-lg p-3 bg-card" data-testid={`inquiry-${inq.id}`}>
              <div className="flex items-start justify-between mb-2 gap-2">
                <div>
                  <div className="font-semibold flex items-center gap-2">
                    {inq.name}
                    <Badge variant="outline" className="text-[10px]">{inq.status}</Badge>
                    {inq.offerSlug && <Badge className="text-[10px] bg-purple-100 text-purple-800">{inq.offerSlug}</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {inq.email} · {inq.phone || "no phone"} · {new Date(inq.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Select value={inq.status} onValueChange={(s) => updateMut.mutate({ id: inq.id, data: { status: s } })}>
                    <SelectTrigger className="w-32 h-7 text-xs" data-testid={`select-status-${inq.id}`}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="converted">Converted</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button size="sm" variant="ghost" onClick={() => { if (confirm("Delete inquiry?")) deleteMut.mutate(inq.id); }} data-testid={`button-delete-inquiry-${inq.id}`}>
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              </div>
              <div className="grid md:grid-cols-4 gap-2 text-xs bg-muted/30 rounded p-2 mb-2">
                <div><span className="text-muted-foreground">Business:</span> {inq.business || "—"}</div>
                <div><span className="text-muted-foreground">Type:</span> {inq.businessType || "—"}</div>
                <div><span className="text-muted-foreground">Lines/Ext/Users:</span> {inq.lines}/{inq.extensions}/{inq.appUsers}</div>
                <div><span className="text-muted-foreground">Est:</span> £{inq.estimatedMonthly || "0"}/mo</div>
              </div>
              {inq.addons && inq.addons.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {inq.addons.map(a => <Badge key={a} variant="secondary" className="text-[10px]">{a}</Badge>)}
                </div>
              )}
              {inq.message && <div className="text-sm bg-amber-50 border border-amber-200 rounded p-2">{inq.message}</div>}
              <div className="flex items-center gap-2 mt-2">
                <a href={`mailto:${inq.email}`} className="text-xs text-primary underline" data-testid={`link-email-${inq.id}`}>📧 Email</a>
                {inq.phone && <a href={`tel:${inq.phone}`} className="text-xs text-primary underline" data-testid={`link-call-${inq.id}`}>📞 Call</a>}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
