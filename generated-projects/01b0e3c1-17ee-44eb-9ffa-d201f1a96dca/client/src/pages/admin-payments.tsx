import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, CreditCard, Clock, CheckCircle, XCircle, Eye, EyeOff, Trash2, Globe, MapPin, Zap, Building2, Phone, Mail, Landmark, RefreshCw, Search, Store, Send, Loader2 } from "lucide-react";

type Application = {
  id: string; businessName: string; ownerFullName: string; email: string;
  phone: string; businessAddress: string; postcode: string; businessType: string;
  bankSortCode: string; bankAccountNumber: string; bankAccountName: string;
  payoutSpeed: string; notes: string; status: string; stripeAccountId: string | null;
  commissionType: string; commissionValue: string; instantThreshold: string; createdAt: string;
};

const normalize = (s: string) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "").trim();

export default function AdminPayments() {
  const [, setLocation] = useLocation();
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [showBankDetails, setShowBankDetails] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [testPaymentLoading, setTestPaymentLoading] = useState(false);
  const [testPaymentResult, setTestPaymentResult] = useState<any>(null);
  const [testAmount, setTestAmount] = useState("10.00");
  const [connectLoading, setConnectLoading] = useState(false);
  const [connectResult, setConnectResult] = useState<any>(null);

  const branchName = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("branch") || "";
  }, []);

  const fetchApps = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe-applications");
      const data = await res.json();
      setApps(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchApps(); }, []);

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/stripe-applications/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchApps();
    if (selectedApp?.id === id) setSelectedApp({ ...selectedApp, status });
  };

  const updateCommission = async (id: string, commissionType: string, commissionValue: string) => {
    await fetch(`/api/stripe-applications/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commissionType, commissionValue }),
    });
    fetchApps();
  };

  const updatePayoutSpeed = async (id: string, payoutSpeed: string) => {
    await fetch(`/api/stripe-applications/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payoutSpeed }),
    });
    fetchApps();
  };

  const updateInstantThreshold = async (id: string, instantThreshold: string) => {
    await fetch(`/api/stripe-applications/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ instantThreshold }),
    });
    fetchApps();
  };

  const updateStripeAccountId = async (id: string, stripeAccountId: string) => {
    await fetch(`/api/stripe-applications/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stripeAccountId }),
    });
    fetchApps();
  };

  const deleteApp = async (id: string) => {
    if (!confirm("Are you sure you want to delete this application?")) return;
    await fetch(`/api/stripe-applications/${id}`, { method: "DELETE" });
    setSelectedApp(null);
    fetchApps();
  };

  const isPakistan = (app: Application) => app.businessType?.startsWith("pakistan-");
  const getRegion = (app: Application) => isPakistan(app) ? "Pakistan" : "UK";
  const getBusinessType = (app: Application) => {
    const t = app.businessType?.replace("pakistan-", "") || "other";
    const map: Record<string, string> = { restaurant: "Restaurant / Takeaway", retail: "Retail Shop", wholesale: "Wholesale", services: "Services", other: "Other" };
    return map[t] || t;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "approved": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "active": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "rejected": return "bg-red-500/20 text-red-400 border-red-500/30";
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const branchApps = branchName
    ? apps.filter(a => normalize(a.businessName) === normalize(branchName))
    : apps;

  const filtered = branchApps.filter(a => {
    if (filter === "uk" && isPakistan(a)) return false;
    if (filter === "pakistan" && !isPakistan(a)) return false;
    if (filter === "pending" && a.status !== "pending") return false;
    if (filter === "approved" && a.status !== "approved") return false;
    if (filter === "active" && a.status !== "active") return false;
    if (search) {
      const s = search.toLowerCase();
      return a.businessName.toLowerCase().includes(s) || a.ownerFullName.toLowerCase().includes(s) || a.email.toLowerCase().includes(s);
    }
    return true;
  });

  const stats = {
    total: branchApps.length,
    pending: branchApps.filter(a => a.status === "pending").length,
    approved: branchApps.filter(a => a.status === "approved").length,
    active: branchApps.filter(a => a.status === "active").length,
    uk: branchApps.filter(a => !isPakistan(a)).length,
    pakistan: branchApps.filter(a => isPakistan(a)).length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#0d1117] to-[#1a1a2e] text-white">
      <div className="bg-white/5 border-b border-white/10 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <button onClick={() => setLocation("/admin")} className="p-2 hover:bg-white/10 rounded-xl" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2" data-testid="text-page-title">
                <CreditCard className="h-6 w-6 text-indigo-400" />
                Payment Applications
              </h1>
              {branchName ? (
                <div className="flex items-center gap-2">
                  <Store className="h-3.5 w-3.5 text-purple-400" />
                  <p className="text-purple-400 text-sm font-semibold">{branchName}</p>
                </div>
              ) : (
                <p className="text-white/40 text-sm">Manage Stripe payment accounts for UK & Pakistan branches</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={fetchApps} className="p-2 hover:bg-white/10 rounded-xl" data-testid="button-refresh">
              <RefreshCw className="h-4 w-4" />
            </button>
            <a href="/payment-setup" target="_blank" className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2" data-testid="link-uk-form">
              <MapPin className="h-4 w-4" /> UK Form
            </a>
            <a href="/payment-setup-pk" target="_blank" className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2" data-testid="link-pk-form">
              <Globe className="h-4 w-4" /> PK Form
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
          <button onClick={() => setFilter("all")} className={`rounded-xl p-3 text-center transition-all border ${filter === "all" ? "border-indigo-500 bg-indigo-500/10" : "border-white/10 bg-white/5 hover:border-white/20"}`} data-testid="filter-all">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-white/40">Total</p>
          </button>
          <button onClick={() => setFilter("pending")} className={`rounded-xl p-3 text-center transition-all border ${filter === "pending" ? "border-amber-500 bg-amber-500/10" : "border-white/10 bg-white/5 hover:border-white/20"}`} data-testid="filter-pending">
            <p className="text-2xl font-bold text-amber-400">{stats.pending}</p>
            <p className="text-xs text-white/40">Pending</p>
          </button>
          <button onClick={() => setFilter("approved")} className={`rounded-xl p-3 text-center transition-all border ${filter === "approved" ? "border-green-500 bg-green-500/10" : "border-white/10 bg-white/5 hover:border-white/20"}`} data-testid="filter-approved">
            <p className="text-2xl font-bold text-green-400">{stats.approved}</p>
            <p className="text-xs text-white/40">Approved</p>
          </button>
          <button onClick={() => setFilter("active")} className={`rounded-xl p-3 text-center transition-all border ${filter === "active" ? "border-blue-500 bg-blue-500/10" : "border-white/10 bg-white/5 hover:border-white/20"}`} data-testid="filter-active">
            <p className="text-2xl font-bold text-blue-400">{stats.active}</p>
            <p className="text-xs text-white/40">Active</p>
          </button>
          <button onClick={() => setFilter("uk")} className={`rounded-xl p-3 text-center transition-all border ${filter === "uk" ? "border-indigo-500 bg-indigo-500/10" : "border-white/10 bg-white/5 hover:border-white/20"}`} data-testid="filter-uk">
            <p className="text-2xl font-bold">{stats.uk}</p>
            <p className="text-xs text-white/40">UK</p>
          </button>
          <button onClick={() => setFilter("pakistan")} className={`rounded-xl p-3 text-center transition-all border ${filter === "pakistan" ? "border-green-500 bg-green-500/10" : "border-white/10 bg-white/5 hover:border-white/20"}`} data-testid="filter-pakistan">
            <p className="text-2xl font-bold">{stats.pakistan}</p>
            <p className="text-xs text-white/40">Pakistan</p>
          </button>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            <input data-testid="input-search" value={search} onChange={e => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-indigo-500"
              placeholder="Search by business name, owner, or email..." />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-3 max-h-[70vh] overflow-y-auto pr-2">
            {loading ? (
              <div className="text-center py-10 text-white/30">Loading applications...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-10 text-white/30">
                <CreditCard className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>No applications found{branchName ? ` for ${branchName}` : ""}</p>
                <p className="text-xs mt-1">{branchName ? "This branch hasn't submitted a payment form yet" : "Share the form link with your customers"}</p>
                {branchName && (
                  <p className="text-xs mt-3 text-white/20">Send them the UK form (/payment-setup) or PK form (/payment-setup-pk) to fill in</p>
                )}
              </div>
            ) : filtered.map(app => (
              <button key={app.id} onClick={() => setSelectedApp(app)} data-testid={`card-app-${app.id}`}
                className={`w-full text-left rounded-xl border p-4 transition-all ${selectedApp?.id === app.id ? "border-indigo-500 bg-indigo-500/10" : "border-white/10 bg-white/5 hover:border-white/20"}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {isPakistan(app) ? <span className="text-sm">🇵🇰</span> : <span className="text-sm">🇬🇧</span>}
                    <h3 className="font-semibold text-white text-sm">{app.businessName}</h3>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(app.status)}`}>{app.status}</span>
                </div>
                <p className="text-white/50 text-xs">{app.ownerFullName}</p>
                <p className="text-white/30 text-xs">{app.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-white/20">{new Date(app.createdAt).toLocaleDateString()}</span>
                  {app.payoutSpeed === "instant" && <span className="text-xs text-amber-400 flex items-center gap-1"><Zap className="h-3 w-3" /> Instant</span>}
                  {app.payoutSpeed === "smart" && <span className="text-xs text-emerald-400 flex items-center gap-1"><Zap className="h-3 w-3" /> Smart £{app.instantThreshold || "0"}+</span>}
                </div>
              </button>
            ))}
          </div>

          <div className="lg:col-span-2">
            {selectedApp ? (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {isPakistan(selectedApp) ? <span className="text-lg">🇵🇰</span> : <span className="text-lg">🇬🇧</span>}
                      <h2 className="text-xl font-bold" data-testid="text-detail-name">{selectedApp.businessName}</h2>
                    </div>
                    <p className="text-white/40 text-sm">{getBusinessType(selectedApp)} — {getRegion(selectedApp)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm px-3 py-1 rounded-full border ${getStatusColor(selectedApp.status)}`}>{selectedApp.status}</span>
                    <button onClick={() => deleteApp(selectedApp.id)} className="p-2 hover:bg-red-500/20 rounded-xl text-red-400" data-testid="button-delete">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Building2 className="h-4 w-4 text-indigo-400" />
                      <h3 className="text-sm font-semibold text-white/70">Owner Details</h3>
                    </div>
                    <div className="space-y-2 text-sm">
                      <p className="text-white">{selectedApp.ownerFullName}</p>
                      <p className="text-white/50 flex items-center gap-1"><Mail className="h-3 w-3" /> {selectedApp.email}</p>
                      <p className="text-white/50 flex items-center gap-1"><Phone className="h-3 w-3" /> {selectedApp.phone}</p>
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <MapPin className="h-4 w-4 text-emerald-400" />
                      <h3 className="text-sm font-semibold text-white/70">Address</h3>
                    </div>
                    <div className="space-y-2 text-sm">
                      <p className="text-white">{selectedApp.businessAddress}</p>
                      <p className="text-white/50">{selectedApp.postcode}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Landmark className="h-4 w-4 text-amber-400" />
                      <h3 className="text-sm font-semibold text-white/70">Bank Details</h3>
                    </div>
                    <button onClick={() => setShowBankDetails(p => ({ ...p, [selectedApp.id]: !p[selectedApp.id] }))}
                      className="text-xs text-white/40 hover:text-white/60 flex items-center gap-1" data-testid="button-toggle-bank">
                      {showBankDetails[selectedApp.id] ? <><EyeOff className="h-3 w-3" /> Hide</> : <><Eye className="h-3 w-3" /> Show</>}
                    </button>
                  </div>
                  {showBankDetails[selectedApp.id] ? (
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-white/40 text-xs">Account Name</p>
                        <p className="text-white font-mono">{selectedApp.bankAccountName}</p>
                      </div>
                      <div>
                        <p className="text-white/40 text-xs">Sort Code / Bank Code</p>
                        <p className="text-white font-mono">{selectedApp.bankSortCode}</p>
                      </div>
                      <div>
                        <p className="text-white/40 text-xs">Account Number</p>
                        <p className="text-white font-mono">{selectedApp.bankAccountNumber}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-white/30 text-sm">Bank details hidden — click Show to view</p>
                  )}
                </div>

                <div className="bg-white/5 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="h-4 w-4 text-purple-400" />
                    <h3 className="text-sm font-semibold text-white/70">Payout Speed — Change for this customer</h3>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <button onClick={() => { updatePayoutSpeed(selectedApp.id, "standard"); setSelectedApp({ ...selectedApp, payoutSpeed: "standard" }); }}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${selectedApp.payoutSpeed === "standard" ? "bg-indigo-500 text-white" : "bg-white/5 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"}`}
                      data-testid="button-payout-standard">
                      <Clock className="h-4 w-4" /> Standard — FREE
                    </button>
                    <button onClick={() => { updatePayoutSpeed(selectedApp.id, "instant"); setSelectedApp({ ...selectedApp, payoutSpeed: "instant" }); }}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${selectedApp.payoutSpeed === "instant" ? "bg-amber-500 text-black" : "bg-white/5 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30"}`}
                      data-testid="button-payout-instant">
                      <Zap className="h-4 w-4" /> Instant — 1% extra
                    </button>
                    <button onClick={() => { updatePayoutSpeed(selectedApp.id, "smart"); setSelectedApp({ ...selectedApp, payoutSpeed: "smart" }); }}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${selectedApp.payoutSpeed === "smart" ? "bg-emerald-500 text-black" : "bg-white/5 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"}`}
                      data-testid="button-payout-smart">
                      <Zap className="h-4 w-4" /> Smart — Instant over threshold
                    </button>
                  </div>

                  {selectedApp.payoutSpeed === "smart" && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 mb-3">
                      <p className="text-emerald-400 text-sm font-semibold mb-2">Smart Payout — Set threshold for this shop</p>
                      <p className="text-white/50 text-xs mb-3">When daily balance is over the threshold → Instant payout. Under the threshold → Standard (2 days).</p>
                      <div className="flex items-center gap-3">
                        <span className="text-white/60 text-sm">Instant when over:</span>
                        <div className="flex items-center gap-1">
                          <span className="text-white font-semibold">£</span>
                          <input data-testid="input-instant-threshold" type="number" min="0" step="10"
                            value={selectedApp.instantThreshold || "0"}
                            onChange={e => setSelectedApp({ ...selectedApp, instantThreshold: e.target.value })}
                            onBlur={e => updateInstantThreshold(selectedApp.id, e.target.value)}
                            className="w-24 bg-white/10 border border-emerald-500/30 rounded-lg px-3 py-2 text-white text-sm font-semibold focus:outline-none focus:border-emerald-400"
                          />
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {[50, 100, 150, 200, 500].map(v => (
                          <button key={v} onClick={() => { setSelectedApp({ ...selectedApp, instantThreshold: String(v) }); updateInstantThreshold(selectedApp.id, String(v)); }}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${String(v) === (selectedApp.instantThreshold || "0") ? "bg-emerald-500 text-black" : "bg-white/5 text-white/50 hover:bg-emerald-500/20 border border-white/10"}`}>
                            £{v}
                          </button>
                        ))}
                      </div>
                      <div className="bg-white/5 rounded-lg p-3 mt-3">
                        <p className="text-white/60 text-xs font-semibold mb-1">How it works for this shop:</p>
                        <p className="text-white/40 text-xs">• Balance under £{selectedApp.instantThreshold || "0"} → Standard payout (2 days, FREE)</p>
                        <p className="text-white/40 text-xs">• Balance over £{selectedApp.instantThreshold || "0"} → Instant payout (minutes, 1% fee)</p>
                        <p className="text-white/30 text-xs mt-1">On Stripe: Set manual payouts, then trigger instant when balance exceeds threshold</p>
                      </div>
                    </div>
                  )}

                  {selectedApp.payoutSpeed !== "smart" && (
                    <div className={`rounded-lg p-3 border ${selectedApp.payoutSpeed === "instant" ? "border-amber-500/20 bg-amber-500/5" : "border-indigo-500/20 bg-indigo-500/5"}`}>
                      {selectedApp.payoutSpeed === "instant" ? (
                        <div>
                          <p className="text-amber-400 text-sm font-semibold mb-1">Instant Payout Active</p>
                          <p className="text-white/50 text-xs">{isPakistan(selectedApp) ? "Money arrives in 1-2 business days. Extra 1.5% fee (min 50p)." : "Money arrives within minutes to debit card. Extra 1% fee (min 50p)."}</p>
                          <p className="text-white/30 text-xs mt-1">On Stripe: Set this customer's payout schedule to "Instant" or "Daily"</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-indigo-400 text-sm font-semibold mb-1">Standard Payout Active</p>
                          <p className="text-white/50 text-xs">{isPakistan(selectedApp) ? "Money arrives in 5-7 business days. No extra charges." : "Money arrives in 2 business days. No extra charges."}</p>
                          <p className="text-white/30 text-xs mt-1">On Stripe: Set this customer's payout schedule to "2-day rolling" (default)</p>
                        </div>
                      )}
                    </div>
                  )}

                  <p className="text-white/30 text-xs mt-2">
                    Stripe fees: {isPakistan(selectedApp) ? "2.9% + 20p + 2% conversion" : "1.5% + 20p"} + 0.5% platform
                  </p>
                </div>

                <div className="bg-white/5 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CreditCard className="h-4 w-4 text-rose-400" />
                    <h3 className="text-sm font-semibold text-white/70">Commission Settings</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <select data-testid="select-commission-type" value={selectedApp.commissionType || "percentage"}
                      onChange={e => { updateCommission(selectedApp.id, e.target.value, selectedApp.commissionValue || "0.5"); setSelectedApp({ ...selectedApp, commissionType: e.target.value }); }}
                      className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500">
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (£)</option>
                    </select>
                    <input data-testid="input-commission-value" type="number" step="0.1" min="0"
                      value={selectedApp.commissionValue || "0.5"}
                      onChange={e => { updateCommission(selectedApp.id, selectedApp.commissionType || "percentage", e.target.value); setSelectedApp({ ...selectedApp, commissionValue: e.target.value }); }}
                      className="w-24 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500" />
                    <span className="text-white/40 text-sm">
                      {(selectedApp.commissionType || "percentage") === "percentage" ? "% per transaction" : "£ per transaction"}
                    </span>
                  </div>
                </div>

                <div className="bg-white/5 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CreditCard className="h-4 w-4 text-sky-400" />
                    <h3 className="text-sm font-semibold text-white/70">Stripe Connect Account</h3>
                  </div>

                  {selectedApp.stripeAccountId?.trim() ? (
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-2 flex-1 bg-green-500/10 border border-green-500/30 rounded-xl px-3 py-2">
                          <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
                          <span className="text-green-400 text-sm font-mono">{selectedApp.stripeAccountId}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input data-testid="input-stripe-account-id" type="text" value={selectedApp.stripeAccountId || ""}
                          onChange={e => { setSelectedApp({ ...selectedApp, stripeAccountId: e.target.value }); }}
                          onBlur={e => updateStripeAccountId(selectedApp.id, e.target.value)}
                          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
                          placeholder="Edit account ID manually" />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-white/40 text-xs mb-3">No Stripe account linked yet. Click below to automatically create a Connected Account for this customer using their application details.</p>
                      <button
                        onClick={async () => {
                          setConnectLoading(true);
                          setConnectResult(null);
                          try {
                            const res = await fetch("/api/stripe-create-connect-account", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ applicationId: selectedApp.id }),
                            });
                            const data = await res.json();
                            setConnectResult(data);
                            if (data.success) {
                              setSelectedApp({ ...selectedApp, stripeAccountId: data.accountId, status: "approved" });
                              fetchApps();
                              if (data.onboardingUrl) {
                                window.open(data.onboardingUrl, "_blank");
                              }
                            }
                          } catch (e: any) {
                            setConnectResult({ error: e.message });
                          }
                          setConnectLoading(false);
                        }}
                        disabled={connectLoading}
                        className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white transition-all disabled:opacity-50 w-full justify-center"
                        data-testid="button-create-connect-account">
                        {connectLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                        {connectLoading ? "Creating Account..." : "Create Stripe Connect Account"}
                      </button>
                      {connectResult && (
                        <div className={`mt-3 rounded-lg p-3 border ${connectResult.success ? "border-green-500/30 bg-green-500/10" : "border-red-500/30 bg-red-500/10"}`}>
                          {connectResult.success ? (
                            <div className="space-y-1">
                              <p className="text-green-400 text-sm font-semibold flex items-center gap-1"><CheckCircle className="h-4 w-4" /> Account Created!</p>
                              <p className="text-white/50 text-xs font-mono">Account ID: {connectResult.accountId}</p>
                              <p className="text-white/40 text-xs">A Stripe onboarding page has opened in a new tab. The customer needs to complete their details there.</p>
                            </div>
                          ) : (
                            <div>
                              <p className="text-red-400 text-sm font-semibold flex items-center gap-1"><XCircle className="h-4 w-4" /> Failed</p>
                              <p className="text-white/50 text-xs mt-1">{connectResult.error}</p>
                            </div>
                          )}
                        </div>
                      )}
                      <div className="mt-3 border-t border-white/5 pt-3">
                        <p className="text-white/30 text-xs mb-2">Or enter an existing account ID manually:</p>
                        <input data-testid="input-stripe-account-id-manual" type="text" value={selectedApp.stripeAccountId || ""}
                          onChange={e => { setSelectedApp({ ...selectedApp, stripeAccountId: e.target.value }); }}
                          onBlur={e => updateStripeAccountId(selectedApp.id, e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-indigo-500"
                          placeholder="acct_XXXXXXXXXXXXX" />
                      </div>
                    </div>
                  )}
                </div>

                {selectedApp.stripeAccountId && (
                  <div className="bg-white/5 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Send className="h-4 w-4 text-cyan-400" />
                      <h3 className="text-sm font-semibold text-white/70">Test Payment</h3>
                    </div>
                    <p className="text-white/40 text-xs mb-3">Send a test payment to this connected Stripe account to verify everything works.</p>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center gap-1">
                        <span className="text-white font-semibold">£</span>
                        <input data-testid="input-test-amount" type="number" min="1" step="1" value={testAmount}
                          onChange={e => setTestAmount(e.target.value)}
                          className="w-24 bg-white/10 border border-cyan-500/30 rounded-lg px-3 py-2 text-white text-sm font-semibold focus:outline-none focus:border-cyan-400" />
                      </div>
                      <button
                        onClick={async () => {
                          setTestPaymentLoading(true);
                          setTestPaymentResult(null);
                          try {
                            const res = await fetch("/api/stripe-test-payment", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                stripeAccountId: selectedApp.stripeAccountId,
                                amount: Math.round(parseFloat(testAmount) * 100),
                              }),
                            });
                            const data = await res.json();
                            setTestPaymentResult(data);
                          } catch (e: any) {
                            setTestPaymentResult({ error: e.message });
                          }
                          setTestPaymentLoading(false);
                        }}
                        disabled={testPaymentLoading}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-all disabled:opacity-50"
                        data-testid="button-test-payment">
                        {testPaymentLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        {testPaymentLoading ? "Sending..." : "Send Test Payment"}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {["1.00", "5.00", "10.00", "25.00", "50.00"].map(v => (
                        <button key={v} type="button" onClick={() => setTestAmount(v)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${testAmount === v ? "bg-cyan-500 text-black" : "bg-white/5 text-white/50 hover:bg-cyan-500/20 border border-white/10"}`}>
                          £{v}
                        </button>
                      ))}
                    </div>
                    {testPaymentResult && (
                      <div className={`rounded-lg p-3 border ${testPaymentResult.success ? "border-green-500/30 bg-green-500/10" : "border-red-500/30 bg-red-500/10"}`}>
                        {testPaymentResult.success ? (
                          <div className="space-y-1">
                            <p className="text-green-400 text-sm font-semibold flex items-center gap-1"><CheckCircle className="h-4 w-4" /> Payment Successful!</p>
                            <p className="text-white/50 text-xs">Amount: {testPaymentResult.amount}</p>
                            <p className="text-white/50 text-xs">Platform Fee (0.5%): {testPaymentResult.fee}</p>
                            <p className="text-white/50 text-xs">Status: {testPaymentResult.status}</p>
                            <p className="text-white/30 text-xs font-mono mt-1">Payment ID: {testPaymentResult.paymentId}</p>
                            <p className="text-white/30 text-xs">Check your Stripe dashboard → Payments to see this transaction</p>
                          </div>
                        ) : (
                          <div>
                            <p className="text-red-400 text-sm font-semibold flex items-center gap-1"><XCircle className="h-4 w-4" /> Payment Failed</p>
                            <p className="text-white/50 text-xs mt-1">{testPaymentResult.error}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {selectedApp.notes && (
                  <div className="bg-white/5 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-white/70 mb-2">Notes</h3>
                    <p className="text-white/50 text-sm">{selectedApp.notes}</p>
                  </div>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <p className="text-white/40 text-sm mr-auto">Change Status:</p>
                  <button onClick={() => updateStatus(selectedApp.id, "pending")}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${selectedApp.status === "pending" ? "bg-amber-500 text-black" : "bg-white/5 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30"}`}
                    data-testid="button-status-pending">
                    <Clock className="h-4 w-4 inline mr-1" /> Pending
                  </button>
                  <button onClick={() => updateStatus(selectedApp.id, "approved")}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${selectedApp.status === "approved" ? "bg-green-500 text-black" : "bg-white/5 hover:bg-green-500/20 text-green-400 border border-green-500/30"}`}
                    data-testid="button-status-approved">
                    <CheckCircle className="h-4 w-4 inline mr-1" /> Approved
                  </button>
                  <button onClick={() => updateStatus(selectedApp.id, "active")}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${selectedApp.status === "active" ? "bg-blue-500 text-black" : "bg-white/5 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30"}`}
                    data-testid="button-status-active">
                    <CreditCard className="h-4 w-4 inline mr-1" /> Active
                  </button>
                  <button onClick={() => updateStatus(selectedApp.id, "rejected")}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${selectedApp.status === "rejected" ? "bg-red-500 text-black" : "bg-white/5 hover:bg-red-500/20 text-red-400 border border-red-500/30"}`}
                    data-testid="button-status-rejected">
                    <XCircle className="h-4 w-4 inline mr-1" /> Rejected
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-10 text-center">
                <CreditCard className="h-12 w-12 mx-auto mb-4 text-white/10" />
                <h3 className="text-lg font-semibold text-white/30 mb-2">Select an application</h3>
                <p className="text-white/20 text-sm mb-6">Click on an application from the list to view details, manage status, and set commission</p>
                <div className="flex items-center justify-center gap-4">
                  <div className="bg-white/5 rounded-xl p-4 text-center">
                    <p className="text-white/40 text-xs mb-1">UK Form Link</p>
                    <code className="text-indigo-400 text-xs">/payment-setup</code>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 text-center">
                    <p className="text-white/40 text-xs mb-1">Pakistan Form Link</p>
                    <code className="text-green-400 text-xs">/payment-setup-pk</code>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
