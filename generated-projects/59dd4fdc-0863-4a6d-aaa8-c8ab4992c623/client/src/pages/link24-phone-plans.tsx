import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import {
  Check, Phone, Loader2, Sparkles, Zap, Globe, Headphones,
  PhoneCall, Voicemail, Users, ShieldCheck, Star, Clock,
  ArrowRight, Mic, Building2
} from "lucide-react";

interface Plan {
  tier: string;
  name: string;
  priceGbp: number;
  maxExtensions: number;
  maxNumbers: number;
  features: string[];
}

export default function Link24PhonePlansPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [restaurantId, setRestaurantId] = useState<string>("");
  const [loadingTier, setLoadingTier] = useState<string>("");

  const { data: plans = [] } = useQuery<Plan[]>({ queryKey: ["/api/phone-billing/plans"] });
  const { data: restaurants = [] } = useQuery<any[]>({ queryKey: ["/api/restaurants"] });

  const params = new URLSearchParams(window.location.search);
  const success = params.get("success") === "1";
  const canceled = params.get("canceled") === "1";

  const checkout = useMutation({
    mutationFn: async (tier: string) => {
      if (!restaurantId) throw new Error("Please pick your shop first (top of page)");
      setLoadingTier(tier);
      return apiRequest("POST", "/api/phone-billing/checkout", { restaurantId, tier });
    },
    onSuccess: (data: any) => {
      if (data?.url) window.location.href = data.url;
      else toast({ title: "Could not start checkout", variant: "destructive" });
    },
    onError: (e: any) => {
      setLoadingTier("");
      toast({ title: "Checkout failed", description: e.message, variant: "destructive" });
    },
  });

  const scrollToPlans = () => document.getElementById("plans")?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
      {/* Top status banners */}
      {success && (
        <div className="bg-emerald-500 text-white text-center py-3 px-4 text-sm font-semibold flex items-center justify-center gap-2" data-testid="banner-success">
          <Sparkles className="h-4 w-4"/> You're subscribed! Your 6-month free trial has started — no card charged yet.
        </div>
      )}
      {canceled && (
        <div className="bg-amber-500 text-white text-center py-3 px-4 text-sm" data-testid="banner-canceled">
          Checkout canceled — pick a plan whenever you're ready.
        </div>
      )}

      {/* HERO */}
      <section className="relative pt-12 md:pt-20 pb-16 md:pb-24 px-4">
        {/* Background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-1/4 w-72 h-72 bg-cyan-500/30 rounded-full blur-3xl"/>
          <div className="absolute top-40 right-1/4 w-96 h-96 bg-violet-600/30 rounded-full blur-3xl"/>
          <div className="absolute bottom-0 left-1/2 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl"/>
        </div>

        <div className="relative max-w-6xl mx-auto text-center">
          {/* Logo */}
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center">
              <Phone className="h-4 w-4 text-white"/>
            </div>
            <span className="font-bold text-sm">Link24 Phone</span>
          </div>

          {/* Promo pill */}
          <Badge className="mb-5 bg-gradient-to-r from-emerald-500 to-emerald-400 text-white border-0 px-4 py-1.5 text-xs font-bold tracking-wide shadow-lg shadow-emerald-500/30">
            🎉 6 MONTHS FREE — NO CARD CHARGED
          </Badge>

          {/* Headline */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight mb-5">
            Your shop's<br/>
            <span className="bg-gradient-to-r from-cyan-300 via-sky-300 to-violet-400 bg-clip-text text-transparent">
              cloud phone system
            </span>
          </h1>

          {/* Sub */}
          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto mb-8 leading-relaxed">
            UK numbers, voicemail, ring groups & a web softphone — running on enterprise PBX.
            <span className="block mt-1 text-cyan-300 font-semibold">Free for 6 months. £8/mo after.</span>
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-10">
            <Button
              onClick={scrollToPlans}
              size="lg"
              className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 text-white font-bold px-8 h-14 text-base shadow-lg shadow-cyan-500/30 border-0"
              data-testid="button-hero-start"
            >
              Start free trial <ArrowRight className="ml-2 h-5 w-5"/>
            </Button>
            <Button
              variant="ghost"
              size="lg"
              onClick={() => document.getElementById("how")?.scrollIntoView({ behavior: "smooth" })}
              className="w-full sm:w-auto h-14 text-slate-300 hover:text-white hover:bg-white/10"
              data-testid="button-hero-how"
            >
              See how it works
            </Button>
          </div>

          {/* Trust strip */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-400">
            <div className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-400"/>No setup fee</div>
            <div className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-400"/>Cancel anytime</div>
            <div className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-400"/>UK 020 numbers</div>
            <div className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-400"/>Works on phone & web</div>
          </div>
        </div>
      </section>

      {/* PHONE MOCKUP + FEATURES */}
      <section id="how" className="px-4 pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Phone mockup */}
            <div className="relative flex justify-center order-2 md:order-1">
              <div className="relative w-[260px] h-[540px] bg-slate-900 rounded-[3rem] border-4 border-slate-800 shadow-2xl shadow-cyan-500/20 overflow-hidden">
                {/* Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-950 rounded-b-2xl z-20"/>
                {/* Screen */}
                <div className="absolute inset-2 rounded-[2.5rem] bg-gradient-to-br from-cyan-600 via-violet-700 to-slate-900 overflow-hidden">
                  {/* Status bar */}
                  <div className="flex justify-between px-5 pt-4 text-white text-xs font-semibold">
                    <span>9:41</span>
                    <span>●●●●</span>
                  </div>
                  {/* Incoming call */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
                    <div className="text-white/70 text-xs uppercase tracking-widest mb-3">Incoming call</div>
                    <div className="w-24 h-24 rounded-full bg-white/15 backdrop-blur-md border-4 border-white/30 flex items-center justify-center mb-4 animate-pulse">
                      <PhoneCall className="h-10 w-10 text-white"/>
                    </div>
                    <div className="text-white text-xl font-bold mb-1">Sarah Khan</div>
                    <div className="text-white/70 text-sm mb-1">+44 7700 900123</div>
                    <div className="text-emerald-300 text-xs mb-10">📦 Last order: £24.50</div>
                    <div className="flex gap-6 mt-auto mb-12">
                      <button className="w-14 h-14 rounded-full bg-rose-500 flex items-center justify-center shadow-lg">
                        <Phone className="h-6 w-6 text-white rotate-[135deg]"/>
                      </button>
                      <button className="w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg animate-bounce">
                        <Phone className="h-6 w-6 text-white"/>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature list */}
            <div className="order-1 md:order-2">
              <h2 className="text-3xl md:text-4xl font-black mb-3">Made for busy shops 🛒</h2>
              <p className="text-slate-400 mb-8">Every call popup shows who's ringing, what they ordered last, and which staff line just rang.</p>

              <div className="space-y-4">
                {[
                  { icon: Users, color: "from-cyan-500 to-blue-500", title: "Ring groups", desc: "Phone rings on every staff line at once. Whoever's free picks up first." },
                  { icon: Voicemail, color: "from-violet-500 to-purple-500", title: "Voicemail to email", desc: "Missed a call? The voice message lands in your inbox as an audio file." },
                  { icon: Mic, color: "from-amber-500 to-orange-500", title: "AI welcome voice", desc: "Custom greeting in any language: \"Welcome to Link24 Pizza, press 1 for orders…\"" },
                  { icon: Globe, color: "from-emerald-500 to-green-500", title: "Works anywhere", desc: "Web softphone, mobile app, or desk phone — same number rings everywhere." },
                ].map((f, i) => (
                  <div key={i} className="flex gap-4 group" data-testid={`feature-${i}`}>
                    <div className={`shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                      <f.icon className="h-6 w-6 text-white"/>
                    </div>
                    <div>
                      <div className="font-bold text-lg">{f.title}</div>
                      <div className="text-slate-400 text-sm leading-relaxed">{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF / STATS */}
      <section className="px-4 py-12 bg-gradient-to-r from-cyan-500/10 via-violet-500/10 to-transparent border-y border-white/5">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { v: "180", l: "Days free trial" },
            { v: "£8", l: "Starting from /mo" },
            { v: "99.9%", l: "Uptime SLA" },
            { v: "24/7", l: "UK support" },
          ].map((s, i) => (
            <div key={i}>
              <div className="text-3xl md:text-4xl font-black bg-gradient-to-br from-cyan-300 to-violet-400 bg-clip-text text-transparent">{s.v}</div>
              <div className="text-xs md:text-sm text-slate-400 mt-1">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* PLANS */}
      <section id="plans" className="px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <Badge className="mb-4 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">All plans 6 months FREE</Badge>
            <h2 className="text-4xl md:text-5xl font-black mb-3">Simple plans, honest pricing</h2>
            <p className="text-slate-400 max-w-xl mx-auto">No setup fees, no hidden costs, no contracts. Pick a plan, get 6 months free, cancel anytime.</p>
          </div>

          {/* Shop selector */}
          <Card className="mb-8 max-w-md mx-auto bg-white/5 border-white/10 backdrop-blur-md">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-3 text-sm font-semibold">
                <Building2 className="h-4 w-4 text-cyan-400"/>
                Step 1 — Pick your shop
              </div>
              <Select value={restaurantId} onValueChange={setRestaurantId}>
                <SelectTrigger className="bg-slate-900 border-white/10 text-white" data-testid="select-shop">
                  <SelectValue placeholder="Select your shop"/>
                </SelectTrigger>
                <SelectContent>
                  {restaurants.map((r: any) => (
                    <SelectItem key={r.id} value={r.id} data-testid={`option-shop-${r.id}`}>{r.name || r.id}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Plan grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
            {plans.map((p, idx) => {
              const popular = p.tier === "team";
              const gradients: Record<string, string> = {
                solo: "from-slate-700 to-slate-800",
                duo: "from-cyan-600 to-blue-700",
                team: "from-violet-600 to-fuchsia-700",
                enterprise: "from-amber-600 to-orange-700",
              };
              return (
                <div key={p.tier} className="relative" data-testid={`card-plan-${p.tier}`}>
                  {popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                      <Badge className="bg-gradient-to-r from-violet-400 to-fuchsia-400 text-white border-0 shadow-lg shadow-violet-500/40 px-3 py-1 text-[10px] font-bold tracking-wider">
                        ⭐ MOST POPULAR
                      </Badge>
                    </div>
                  )}
                  <Card className={`h-full ${popular ? "bg-gradient-to-br from-white/10 to-white/5 border-violet-400/50 shadow-2xl shadow-violet-500/20 scale-[1.02]" : "bg-white/5 border-white/10"} backdrop-blur-md hover:border-white/20 transition-all`}>
                    <CardContent className="pt-6 pb-6">
                      {/* Plan badge */}
                      <div className={`inline-flex w-12 h-12 rounded-2xl bg-gradient-to-br ${gradients[p.tier]} items-center justify-center mb-4 shadow-lg`}>
                        <Phone className="h-6 w-6 text-white"/>
                      </div>

                      <div className="text-xl font-black text-white">{p.name}</div>
                      <div className="text-xs text-slate-400 mb-4">
                        {p.maxExtensions} {p.maxExtensions === 1 ? "user" : "users"} · {p.maxNumbers} {p.maxNumbers === 1 ? "number" : "numbers"}
                      </div>

                      {/* Price */}
                      <div className="flex items-baseline gap-1 mb-1">
                        <span className="text-5xl font-black">£{p.priceGbp}</span>
                        <span className="text-slate-400 text-sm">/mo</span>
                      </div>
                      <div className="text-xs text-emerald-400 font-bold uppercase tracking-wide mb-5">
                        FREE for 6 months
                      </div>

                      {/* Features */}
                      <ul className="space-y-2.5 mb-6 min-h-[140px]">
                        {p.features.map((f, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                            <Check className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0"/>
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>

                      <Button
                        className={`w-full h-12 font-bold ${popular
                          ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-400 hover:to-fuchsia-400 text-white shadow-lg shadow-violet-500/30 border-0"
                          : "bg-white/10 hover:bg-white/20 text-white border border-white/20"}`}
                        disabled={checkout.isPending || !restaurantId}
                        onClick={() => checkout.mutate(p.tier)}
                        data-testid={`button-subscribe-${p.tier}`}
                      >
                        {loadingTier === p.tier && checkout.isPending
                          ? <><Loader2 className="h-4 w-4 mr-2 animate-spin"/>Redirecting…</>
                          : <>Start free trial <ArrowRight className="ml-1.5 h-4 w-4"/></>}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-6 text-sm text-slate-400">
            All prices in GBP. No card charged today. VAT may apply.
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="px-4 py-16 bg-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-black mb-2">Loved by shop owners</h2>
            <div className="flex items-center justify-center gap-1 text-amber-400">
              {[...Array(5)].map((_, i) => <Star key={i} className="h-5 w-5 fill-amber-400"/>)}
              <span className="text-slate-300 ml-2 text-sm">4.9/5 from early access merchants</span>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { name: "Ahmed", shop: "Royal Tandoori, Ilford", text: "Customer rings — popup tells me exactly what they ordered last week. I sound like a wizard!" },
              { name: "Priya", shop: "Spice Hut, Romford", text: "Set up in 10 minutes. Voicemails come straight to my email. No more missed orders." },
              { name: "Marcus", shop: "Burger Bay, Stratford", text: "All three branches share one number. Calls ring everywhere — whoever's free picks up." },
            ].map((t, i) => (
              <Card key={i} className="bg-white/5 border-white/10 backdrop-blur-md">
                <CardContent className="pt-6">
                  <div className="flex gap-1 mb-3 text-amber-400">{[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-amber-400"/>)}</div>
                  <p className="text-slate-200 text-sm leading-relaxed mb-4">"{t.text}"</p>
                  <div className="text-sm">
                    <div className="font-bold text-white">{t.name}</div>
                    <div className="text-slate-400 text-xs">{t.shop}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 py-20">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black text-center mb-10">Common questions</h2>
          <Accordion type="single" collapsible className="space-y-3">
            {[
              { q: "Is it really free for 6 months?", a: "Yes — pick any plan, complete checkout (no card charge today), and you get 180 days completely free. We'll email you 7 days before the trial ends so you can cancel if you don't want to continue." },
              { q: "Do I need any hardware?", a: "No. The web softphone runs in any browser. You can also use the mobile app, or plug in an existing IP desk phone if you have one." },
              { q: "Can I keep my existing phone number?", a: "Yes — UK numbers can usually be ported in (takes 2–4 weeks). Or pick a new local 020 number instantly from your admin panel." },
              { q: "What about call charges?", a: "Inbound calls are free. Outbound to UK landlines ~1p/min, mobiles ~5p/min. Most shops spend under £5/mo on calls." },
              { q: "Can I cancel anytime?", a: "Yes — no contracts, no cancellation fees. Cancel from your billing page in one click." },
            ].map((f, i) => (
              <AccordionItem key={i} value={`q-${i}`} className="bg-white/5 border border-white/10 rounded-2xl px-5 backdrop-blur-md">
                <AccordionTrigger className="text-left font-semibold text-white hover:no-underline" data-testid={`faq-${i}`}>{f.q}</AccordionTrigger>
                <AccordionContent className="text-slate-300 text-sm leading-relaxed">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="px-4 py-20">
        <div className="max-w-3xl mx-auto">
          <Card className="bg-gradient-to-br from-cyan-500/20 via-violet-500/20 to-emerald-500/20 border-white/10 backdrop-blur-md overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent"/>
            <CardContent className="pt-10 pb-10 text-center relative">
              <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-violet-500 items-center justify-center mb-5 shadow-2xl shadow-cyan-500/40">
                <Sparkles className="h-8 w-8 text-white"/>
              </div>
              <h2 className="text-3xl md:text-4xl font-black mb-3">Ready to ditch the old phone?</h2>
              <p className="text-slate-300 mb-6 max-w-lg mx-auto">Join shops across the UK upgrading to a real cloud phone system. 6 months free, no risk.</p>
              <Button
                onClick={scrollToPlans}
                size="lg"
                className="h-14 px-8 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 text-white font-bold shadow-lg shadow-cyan-500/30 border-0"
                data-testid="button-final-cta"
              >
                Start your free trial <ArrowRight className="ml-2 h-5 w-5"/>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="px-4 py-8 border-t border-white/5 text-center text-sm text-slate-500">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center">
            <Phone className="h-3 w-3 text-white"/>
          </div>
          <span className="font-bold text-white">Link24 Phone</span>
        </div>
        <div className="flex items-center justify-center gap-4 mb-3">
          <button onClick={() => navigate("/link24-phone")} className="hover:text-white transition" data-testid="link-back-phone">Phone Hub</button>
          <button onClick={() => navigate("/portal")} className="hover:text-white transition" data-testid="link-portal">Portal</button>
        </div>
        <div className="text-xs">© 2026 Link24 — Cloud PBX powered by Grandstream UCM6302</div>
      </footer>
    </div>
  );
}
