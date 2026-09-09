import { useState } from "react";
import { CheckCircle, CreditCard, Store, User, Building2, Landmark, Clock, Zap, AlertTriangle, FileText, Info, HelpCircle, ChevronDown, ChevronUp } from "lucide-react";

const FEE_AMOUNTS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 50, 100];

function calcFees(amount: number, instant: boolean) {
  const stripeFee = amount * 0.015 + 0.20;
  const platformFee = amount * 0.005;
  const instantFee = instant ? Math.max(amount * 0.01, 0.50) : 0;
  const totalFee = stripeFee + platformFee + instantFee;
  const youReceive = amount - totalFee;
  return { stripeFee, platformFee, instantFee, totalFee, youReceive };
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-white/10 rounded-xl overflow-hidden">
      <button type="button" onClick={(e) => { e.preventDefault(); setOpen(!open); }} className="w-full flex items-start gap-3 p-4 text-left hover:bg-white/5 transition-all" data-testid={`faq-${q.slice(0, 20).replace(/\s/g, '-').toLowerCase()}`}>
        <HelpCircle className="h-4 w-4 text-indigo-400 mt-0.5 shrink-0" />
        <span className="text-white text-sm font-semibold flex-1">{q}</span>
        {open ? <ChevronUp className="h-4 w-4 text-white/30 shrink-0" /> : <ChevronDown className="h-4 w-4 text-white/30 shrink-0" />}
      </button>
      {open && <div className="px-4 pb-4 pl-11 text-white/60 text-sm leading-relaxed whitespace-pre-line">{a}</div>}
    </div>
  );
}

function FaqSection() {
  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <HelpCircle className="h-5 w-5 text-cyan-400" />
        <h2 className="text-lg font-semibold text-white">Common Questions</h2>
      </div>
      <div className="space-y-2">
        <FaqItem
          q="How does my money get to my bank?"
          a={"All your card payments from the day are collected together by Stripe. Then Stripe sends ONE transfer to your bank account.\n\nFor example: If you get 5 orders of £10 each (total £50), Stripe doesn't send 5 separate transfers. It sends 1 transfer of the total amount after fees.\n\nThis means the instant payout fee is only charged ONCE on the total, not per order."}
        />
        <FaqItem
          q="How much does Instant Payout really cost? (Example: 5 x £10 orders)"
          a={"Let's say you receive 5 orders of £10 each = £50 total.\n\n🕐 Standard Payout (FREE — 2 days):\n• 5 x Stripe fee (£0.35 each) = £1.75\n• 5 x Platform fee (£0.05 each) = £0.25\n• Payout fee = £0.00 (FREE)\n• You receive: £48.00 in your bank in 2 days\n\n⚡ Instant Payout (1% — within minutes):\n• 5 x Stripe fee (£0.35 each) = £1.75\n• 5 x Platform fee (£0.05 each) = £0.25\n• Instant payout fee (1% of £48.00) = £0.48\n• You receive: £47.52 in your bank within minutes\n\nDifference: Only 48p more to get your money instantly!\nStripe sends it as ONE payment, so the instant fee is charged once, not 5 times."}
        />
        <FaqItem
          q="When will I receive my first payment?"
          a={"For the first 1-2 weeks, Stripe verifies your business. During this time, payments may take 7-14 days to arrive. This is a one-time security check.\n\nAfter verification:\n• Standard: Money arrives every 2 business days\n• Instant: Money arrives within minutes (to debit card)"}
        />
        <FaqItem
          q="Do I need to pay anything upfront?"
          a={"No! There are:\n• No setup fees\n• No monthly fees\n• No contracts\n• No minimum payments\n\nFees are only taken when you actually receive a card payment. If you don't receive any payments, you pay nothing."}
        />
        <FaqItem
          q="What cards can my customers pay with?"
          a={"Your customers can pay with:\n• Visa\n• Mastercard\n• American Express\n• Apple Pay\n• Google Pay\n• Contactless payments\n\nAll major cards and digital wallets are accepted."}
        />
        <FaqItem
          q="Can I switch between Standard and Instant later?"
          a={"Yes! You can change your payout speed at any time. Just contact Link24 support and we will update your settings. There is no charge for switching."}
        />
        <FaqItem
          q="Is my money safe?"
          a={"Yes, completely safe. Stripe is one of the world's largest payment processors, trusted by millions of businesses including Amazon, Google, and Uber. Your money is held securely and transferred directly to your bank account. Link24 never holds your money."}
        />
      </div>
    </div>
  );
}

export default function StripeApplication() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [feesAccepted, setFeesAccepted] = useState(false);
  const [taxAccepted, setTaxAccepted] = useState(false);
  const [form, setForm] = useState({
    businessName: "", ownerFullName: "", email: "", phone: "",
    businessAddress: "", postcode: "", businessType: "restaurant",
    bankSortCode: "", bankAccountNumber: "", bankAccountName: "", notes: "",
    payoutSpeed: "standard",
  });

  const update = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));
  const isInstant = form.payoutSpeed === "instant";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAccepted || !feesAccepted || !taxAccepted) {
      setError("Please accept all required checkboxes before submitting");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/stripe-applications", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed to submit"); }
      setSubmitted(true);
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#0d1117] to-[#1a1a2e] flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 text-center">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3" data-testid="text-success-title">Application Submitted!</h2>
          <p className="text-white/60 mb-4">Thank you for your application. We will review your details and set up your payment account.</p>
          <div className="bg-white/5 rounded-xl p-4 text-left space-y-2">
            <p className="text-white/80 text-sm font-semibold">What happens next:</p>
            <p className="text-white/60 text-sm">1. We review your application (within 24 hours)</p>
            <p className="text-white/60 text-sm">2. Stripe verifies your business (1-2 business days)</p>
            <p className="text-white/60 text-sm">3. You receive an email confirmation when ready</p>
            <p className="text-white/60 text-sm">4. Start accepting card payments!</p>
          </div>
          <div className="bg-white/5 rounded-xl p-4 mt-4 text-left">
            <p className="text-white/80 text-sm font-semibold mb-2">Your selected payout speed:</p>
            <div className={`flex items-center gap-2 ${form.payoutSpeed === "instant" ? "text-amber-400" : "text-indigo-400"}`}>
              {form.payoutSpeed === "instant" ? <Zap className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
              <span className="text-sm font-semibold">{form.payoutSpeed === "instant" ? "Instant Payout — money within minutes" : "Standard Payout — money in 2 business days"}</span>
            </div>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mt-4 text-left">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-amber-400" />
              <p className="text-amber-400 text-sm font-semibold">Important - Payout Timing</p>
            </div>
            <p className="text-white/50 text-xs">For the first 1-2 weeks, payments may take 7-14 days to reach your bank while Stripe verifies your account. After that, payouts become regular (every 2 business days or instant if selected).</p>
          </div>
          <p className="text-white/40 text-xs mt-6">If you have questions, contact Link24 support</p>
          <button
            type="button"
            data-testid="button-go-back-admin"
            onClick={() => window.location.href = "/admin-payments"}
            className="mt-6 w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold transition-all"
          >
            ← Go Back to Payment Applications
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#0d1117] to-[#1a1a2e] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CreditCard className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2" data-testid="text-form-title">Payment Account Setup</h1>
          <p className="text-white/50">Fill in your business details to start accepting card payments through Link24</p>
          <div className="inline-flex items-center gap-2 mt-3 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5">
            <span className="text-indigo-400 text-sm">🇬🇧 United Kingdom</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Store className="h-5 w-5 text-indigo-400" />
              <h2 className="text-lg font-semibold text-white">Business Details</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-white/60 mb-1 block">Business Name *</label>
                <input data-testid="input-business-name" type="text" required value={form.businessName} onChange={e => update("businessName", e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. Dhaba Restaurant" />
              </div>
              <div>
                <label className="text-sm text-white/60 mb-1 block">Business Type *</label>
                <select data-testid="select-business-type" required value={form.businessType} onChange={e => update("businessType", e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500">
                  <option value="restaurant">Restaurant / Takeaway</option>
                  <option value="retail">Retail Shop</option>
                  <option value="wholesale">Wholesale</option>
                  <option value="services">Services</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-white/60 mb-1 block">Business Address *</label>
                <input data-testid="input-business-address" type="text" required value={form.businessAddress} onChange={e => update("businessAddress", e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-indigo-500"
                  placeholder="Full address" />
              </div>
              <div>
                <label className="text-sm text-white/60 mb-1 block">Postcode *</label>
                <input data-testid="input-postcode" type="text" required value={form.postcode} onChange={e => update("postcode", e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. B1 1AA" />
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <User className="h-5 w-5 text-emerald-400" />
              <h2 className="text-lg font-semibold text-white">Owner Details</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-white/60 mb-1 block">Full Name (Business Owner) *</label>
                <input data-testid="input-owner-name" type="text" required value={form.ownerFullName} onChange={e => update("ownerFullName", e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-indigo-500"
                  placeholder="Full legal name" />
              </div>
              <div>
                <label className="text-sm text-white/60 mb-1 block">Email Address *</label>
                <input data-testid="input-email" type="email" required value={form.email} onChange={e => update("email", e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-indigo-500"
                  placeholder="owner@email.com" />
              </div>
              <div>
                <label className="text-sm text-white/60 mb-1 block">Phone Number *</label>
                <input data-testid="input-phone" type="tel" required value={form.phone} onChange={e => update("phone", e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-indigo-500"
                  placeholder="07xxx xxxxxx" />
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Landmark className="h-5 w-5 text-amber-400" />
              <h2 className="text-lg font-semibold text-white">Bank Details</h2>
            </div>
            <p className="text-white/40 text-xs mb-4">Your bank details are kept secure and used only for receiving payments</p>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-white/60 mb-1 block">Account Holder Name *</label>
                <input data-testid="input-bank-name" type="text" required value={form.bankAccountName} onChange={e => update("bankAccountName", e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-indigo-500"
                  placeholder="Name on bank account" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-white/60 mb-1 block">Sort Code *</label>
                  <input data-testid="input-sort-code" type="text" required value={form.bankSortCode} onChange={e => update("bankSortCode", e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-indigo-500"
                    placeholder="00-00-00" maxLength={8} />
                </div>
                <div>
                  <label className="text-sm text-white/60 mb-1 block">Account Number *</label>
                  <input data-testid="input-account-number" type="text" required value={form.bankAccountNumber} onChange={e => update("bankAccountNumber", e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-indigo-500"
                    placeholder="12345678" maxLength={8} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-5 w-5 text-purple-400" />
              <h2 className="text-lg font-semibold text-white">Payout Speed — Choose how fast you want your money</h2>
            </div>

            <div className="space-y-3">
              <label
                data-testid="option-standard-payout"
                className={`block cursor-pointer rounded-xl border p-4 transition-all ${form.payoutSpeed === "standard" ? "border-indigo-500 bg-indigo-500/10" : "border-white/10 bg-white/5 hover:border-white/20"}`}
                onClick={() => update("payoutSpeed", "standard")}
              >
                <div className="flex items-start gap-3">
                  <input type="radio" name="payoutSpeed" value="standard" checked={form.payoutSpeed === "standard"} onChange={() => update("payoutSpeed", "standard")}
                    className="mt-1 accent-indigo-500" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="h-4 w-4 text-indigo-400" />
                      <span className="text-white font-semibold text-lg">Standard Payout — FREE</span>
                      <span className="text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full">RECOMMENDED</span>
                    </div>
                    <p className="text-white/50 text-sm mb-1">Money arrives in your bank every 2 business days</p>
                    <p className="text-white/40 text-xs">No extra charges — just Stripe fee (1.5% + 20p) + 0.5% platform fee</p>
                  </div>
                </div>
              </label>

              <label
                data-testid="option-instant-payout"
                className={`block cursor-pointer rounded-xl border p-4 transition-all ${form.payoutSpeed === "instant" ? "border-amber-500 bg-amber-500/10" : "border-white/10 bg-white/5 hover:border-white/20"}`}
                onClick={() => update("payoutSpeed", "instant")}
              >
                <div className="flex items-start gap-3">
                  <input type="radio" name="payoutSpeed" value="instant" checked={form.payoutSpeed === "instant"} onChange={() => update("payoutSpeed", "instant")}
                    className="mt-1 accent-amber-500" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Zap className="h-4 w-4 text-amber-400" />
                      <span className="text-white font-semibold text-lg">Instant Payout — 1% extra</span>
                      <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full">SAME DAY</span>
                    </div>
                    <p className="text-white/50 text-sm mb-1">Money arrives in your bank within minutes (to debit card)</p>
                    <p className="text-white/40 text-xs">Additional 1% instant payout fee (minimum 50p) on top of standard fees</p>
                  </div>
                </div>
              </label>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 mt-4">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
                <p className="text-white/50 text-xs leading-relaxed">
                  <span className="text-blue-400 font-semibold">Note:</span> For the first 1-2 weeks after account creation, Stripe may hold payments for 7-14 days while they verify your business. This is a one-time security check. After that, payouts follow your selected schedule automatically.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="h-5 w-5 text-rose-400" />
              <h2 className="text-lg font-semibold text-white">Fee Breakdown — What You'll Pay</h2>
            </div>
            <p className="text-white/40 text-xs mb-4">
              {isInstant
                ? "Showing fees with Instant Payout (1% extra, minimum 50p). Switch to Standard above to compare."
                : "Showing fees with Standard Payout (FREE). Switch to Instant above to compare."
              }
            </p>

            <div className="flex items-center gap-2 mb-4">
              <span className={`text-sm px-3 py-1.5 rounded-full font-semibold ${isInstant ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"}`}>
                {isInstant ? "⚡ Instant Payout Selected" : "🕐 Standard Payout Selected (FREE)"}
              </span>
            </div>

            <div className="bg-white/5 rounded-xl p-4">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left text-white/40 py-2 pr-2">Payment</th>
                      <th className="text-right text-white/40 py-2 px-2">Stripe (1.5%+20p)</th>
                      <th className="text-right text-white/40 py-2 px-2">Your 0.5%</th>
                      {isInstant && <th className="text-right text-amber-400/60 py-2 px-2">Instant (1%)</th>}
                      <th className="text-right text-white/40 py-2 px-2">Total Fee</th>
                      <th className="text-right text-green-400/60 py-2 pl-2">You Receive</th>
                    </tr>
                  </thead>
                  <tbody className="text-white/60">
                    {FEE_AMOUNTS.map((amt, i) => {
                      const fees = calcFees(amt, isInstant);
                      return (
                        <tr key={amt} className={i < FEE_AMOUNTS.length - 1 ? "border-b border-white/5" : ""}>
                          <td className="py-2 pr-2 text-white font-semibold">£{amt.toFixed(2)}</td>
                          <td className="py-2 px-2 text-right">£{fees.stripeFee.toFixed(2)}</td>
                          <td className="py-2 px-2 text-right">£{fees.platformFee.toFixed(2)}</td>
                          {isInstant && <td className="py-2 px-2 text-right text-amber-400">£{fees.instantFee.toFixed(2)}</td>}
                          <td className="py-2 px-2 text-right text-amber-400 font-semibold">£{fees.totalFee.toFixed(2)}</td>
                          <td className="py-2 pl-2 text-right text-green-400 font-semibold">£{fees.youReceive.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {isInstant && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mt-4">
                  <div className="flex items-start gap-2">
                    <Zap className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-amber-400 text-xs font-semibold">Instant Payout: 1% fee with 50p minimum</p>
                      <p className="text-white/40 text-xs mt-1">For payments under £50, the minimum 50p instant fee applies. This is why smaller payments cost more with instant payouts. Consider Standard payout for small transactions.</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-white/60 text-xs font-semibold mb-2">Quick Comparison — £10 payment:</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className={`rounded-lg p-3 border ${!isInstant ? "border-indigo-500 bg-indigo-500/10" : "border-white/10 bg-white/5"}`}>
                    <div className="flex items-center gap-1 mb-1">
                      <Clock className="h-3 w-3 text-indigo-400" />
                      <span className="text-white/70 text-xs font-semibold">Standard (2 days)</span>
                    </div>
                    <p className="text-white/40 text-xs">Fee: £0.40</p>
                    <p className="text-green-400 text-sm font-bold">You get £9.60</p>
                  </div>
                  <div className={`rounded-lg p-3 border ${isInstant ? "border-amber-500 bg-amber-500/10" : "border-white/10 bg-white/5"}`}>
                    <div className="flex items-center gap-1 mb-1">
                      <Zap className="h-3 w-3 text-amber-400" />
                      <span className="text-white/70 text-xs font-semibold">Instant (minutes)</span>
                    </div>
                    <p className="text-white/40 text-xs">Fee: £0.90</p>
                    <p className="text-green-400 text-sm font-bold">You get £9.10</p>
                  </div>
                </div>
                <p className="text-white/30 text-xs mt-2">Difference: 50p more for instant. Standard saves you money.</p>
              </div>

              <p className="text-white/30 text-xs mt-4">* Stripe fee: 1.5% + 20p per UK card transaction. Platform fee: 0.5%. Instant payout: 1% (min 50p). International cards: 2.9% + 20p.</p>
            </div>
          </div>

          <FaqSection />

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="h-5 w-5 text-sky-400" />
              <h2 className="text-lg font-semibold text-white">Additional Notes</h2>
            </div>
            <textarea data-testid="input-notes" value={form.notes} onChange={e => update("notes", e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-indigo-500 min-h-[80px]"
              placeholder="Any additional information (optional)" />
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-orange-400" />
              <h2 className="text-lg font-semibold text-white">Terms & Conditions *</h2>
            </div>
            <p className="text-white/40 text-xs mb-4">Please read and accept the following before submitting:</p>
            <div className="space-y-4">
              <label className="flex items-start gap-3 cursor-pointer" data-testid="checkbox-terms">
                <input type="checkbox" checked={termsAccepted} onChange={e => setTermsAccepted(e.target.checked)}
                  className="mt-1 accent-indigo-500 h-4 w-4" />
                <span className="text-white/60 text-sm leading-relaxed">
                  I agree that my details will be shared with Stripe (payment processor) to set up my payment account.
                  I understand Link24 is a technology platform and not a financial institution.
                  I authorise Link24 to create and manage a payment sub-account on my behalf.
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer" data-testid="checkbox-fees">
                <input type="checkbox" checked={feesAccepted} onChange={e => setFeesAccepted(e.target.checked)}
                  className="mt-1 accent-indigo-500 h-4 w-4" />
                <span className="text-white/60 text-sm leading-relaxed">
                  I understand and accept the transaction fees:
                  <span className="block text-white/40 text-xs mt-1">
                    — Stripe fee: 1.5% + 20p per UK card transaction (2.9% + 20p for international cards)
                    <br />— Link24 platform fee: 0.5% per transaction
                    <br />— Instant payout fee (if selected): 1% additional (minimum 50p)
                    <br />— No monthly fees, no setup fees, no hidden charges
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer" data-testid="checkbox-tax">
                <input type="checkbox" checked={taxAccepted} onChange={e => setTaxAccepted(e.target.checked)}
                  className="mt-1 accent-indigo-500 h-4 w-4" />
                <div className="flex-1">
                  <span className="text-white/60 text-sm leading-relaxed">
                    I understand that I am fully responsible for my own tax, VAT, and all government reporting obligations.
                    Link24 does not provide tax advice and is not responsible for any tax-related matters.
                  </span>
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2 mt-2">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-400 mt-0.5 shrink-0" />
                      <p className="text-amber-400/80 text-xs">It is your responsibility to declare all income, pay VAT (if registered), and comply with HMRC requirements. Link24 is not liable for any unpaid taxes or penalties.</p>
                    </div>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm" data-testid="text-error">{error}</div>}

          <button data-testid="button-submit" type="submit" disabled={loading || !termsAccepted || !feesAccepted || !taxAccepted}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold py-4 rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg">
            {loading ? "Submitting..." : !termsAccepted || !feesAccepted || !taxAccepted ? "Please accept all terms to continue" : "Submit Application"}
          </button>

          <p className="text-center text-white/30 text-xs">Powered by Link24 — Secure Payment Processing</p>
        </form>
      </div>
    </div>
  );
}