import { useState } from "react";
import { CheckCircle, CreditCard, Store, User, Building2, Landmark, Clock, Zap, AlertTriangle, FileText, Info, Globe, HelpCircle, ChevronDown, ChevronUp } from "lucide-react";

const PKR_RATE = 350;
const FEE_AMOUNTS_PKR = [500, 1000, 2000, 3000, 5000, 7000, 10000, 15000, 20000, 35000, 50000];

function calcFeesPKR(amountPKR: number, instant: boolean) {
  const amountGBP = amountPKR / PKR_RATE;
  const stripeFee = amountGBP * 0.029 + 0.20;
  const conversionFee = amountGBP * 0.02;
  const platformFee = amountGBP * 0.005;
  const instantFee = instant ? Math.max(amountGBP * 0.015, 0.50) : 0;
  const totalFeeGBP = stripeFee + conversionFee + platformFee + instantFee;
  const totalFeePKR = totalFeeGBP * PKR_RATE;
  const youReceivePKR = amountPKR - totalFeePKR;
  return { stripeFee: stripeFee * PKR_RATE, conversionFee: conversionFee * PKR_RATE, platformFee: platformFee * PKR_RATE, instantFee: instantFee * PKR_RATE, totalFee: totalFeePKR, youReceive: youReceivePKR };
}

function fmtPKR(v: number) {
  return "Rs " + Math.round(v).toLocaleString();
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-white/10 rounded-xl overflow-hidden">
      <button type="button" onClick={(e) => { e.preventDefault(); setOpen(!open); }} className="w-full flex items-start gap-3 p-4 text-left hover:bg-white/5 transition-all">
        <HelpCircle className="h-4 w-4 text-green-400 mt-0.5 shrink-0" />
        <span className="text-white text-sm font-semibold flex-1">{q}</span>
        {open ? <ChevronUp className="h-4 w-4 text-white/30 shrink-0" /> : <ChevronDown className="h-4 w-4 text-white/30 shrink-0" />}
      </button>
      {open && <div className="px-4 pb-4 pl-11 text-white/60 text-sm leading-relaxed whitespace-pre-line">{a}</div>}
    </div>
  );
}

function FaqSectionPK() {
  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <HelpCircle className="h-5 w-5 text-cyan-400" />
        <h2 className="text-lg font-semibold text-white">عام سوالات / Common Questions</h2>
      </div>
      <div className="space-y-2">
        <FaqItem
          q="میری رقم بینک میں کیسے آئے گی؟ / How does my money get to my bank?"
          a={"آپ کی تمام کارڈ ادائیگیاں Stripe جمع کرتا ہے اور پھر ایک ساتھ آپ کے بینک میں بھیجتا ہے۔\n\nمثال: اگر آپ کو 5 آرڈر Rs 3,500 کے ملیں (کل Rs 17,500)، تو Stripe 5 الگ الگ ٹرانسفر نہیں بھیجتا۔ یہ فیس کاٹ کر ایک ٹرانسفر بھیجتا ہے۔\n\nAll your card payments are collected together by Stripe. Then Stripe sends ONE transfer to your bank.\n\nFor example: 5 orders of Rs 3,500 = Stripe sends 1 transfer of the total, not 5 separate ones. The payout fee is charged once, not per order."}
        />
        <FaqItem
          q="فوری ادائیگی کا اصل خرچہ کتنا ہے؟ / How much does Fast Payout really cost? (5 x Rs 3,500 example)"
          a={"فرض کریں آپ کو 5 آرڈر Rs 3,500 کے ملیں = کل Rs 17,500۔\n\n🕐 معیاری ادائیگی (مفت — 5-7 دن):\n• 5 x Stripe فیس (Rs 242 ہر ایک) = Rs 1,208\n• 5 x پلیٹ فارم فیس (Rs 18 ہر ایک) = Rs 88\n• ادائیگی فیس = Rs 0 (مفت)\n• آپ کو ملے گا: Rs 16,205 (5-7 دنوں میں)\n\n⚡ فوری ادائیگی (1.5% — 1-2 دن):\n• 5 x Stripe فیس (Rs 242 ہر ایک) = Rs 1,208\n• 5 x پلیٹ فارم فیس (Rs 18 ہر ایک) = Rs 88\n• فوری ادائیگی فیس (1.5% of Rs 16,205) = Rs 243\n• آپ کو ملے گا: Rs 15,962 (1-2 دنوں میں)\n\nفرق: صرف Rs 243 زیادہ! Stripe ایک بار فیس لیتا ہے، 5 بار نہیں۔\n\nDifference: Only Rs 243 more! Stripe charges the payout fee ONCE on the total, not 5 times."}
        />
        <FaqItem
          q="پہلی ادائیگی کب ملے گی؟ / When will I receive my first payment?"
          a={"پہلے 2-3 ہفتوں میں Stripe آپ کے کاروبار کی تصدیق کرتا ہے۔ اس دوران ادائیگی 14-21 دن لگ سکتی ہے۔ یہ صرف ایک بار ہوتا ہے۔\n\nتصدیق کے بعد:\n• معیاری: رقم 5-7 کاروباری دنوں میں آتی ہے\n• فوری: رقم 1-2 کاروباری دنوں میں آتی ہے\n\nAfter verification:\n• Standard: Money arrives in 5-7 business days\n• Fast: Money arrives in 1-2 business days"}
        />
        <FaqItem
          q="کیا مجھے پہلے سے کچھ ادا کرنا ہوگا؟ / Do I need to pay anything upfront?"
          a={"نہیں! بالکل نہیں:\n• کوئی سیٹ اپ فیس نہیں\n• کوئی ماہانہ فیس نہیں\n• کوئی معاہدہ نہیں\n• کوئی کم از کم ادائیگی نہیں\n\nفیس صرف تب لی جاتی ہے جب آپ کو کارڈ سے ادائیگی ملے۔ اگر کوئی ادائیگی نہیں آتی تو کوئی فیس نہیں۔\n\nNo! Fees are only taken when you receive a card payment. No payments = no fees."}
        />
        <FaqItem
          q="میرے گاہک کون سے کارڈ سے ادائیگی کر سکتے ہیں؟ / What cards can my customers pay with?"
          a={"آپ کے گاہک یہ استعمال کر سکتے ہیں:\n• Visa\n• Mastercard\n• American Express\n• Apple Pay\n• Google Pay\n• Contactless (بغیر رابطے کی ادائیگی)\n\nتمام بڑے کارڈز اور ڈیجیٹل والٹس قبول ہیں۔"}
        />
        <FaqItem
          q="کیا بعد میں ادائیگی کی رفتار تبدیل کر سکتا ہوں؟ / Can I switch payout speed later?"
          a={"جی ہاں! آپ کسی بھی وقت ادائیگی کی رفتار تبدیل کر سکتے ہیں۔ Link24 سپورٹ سے رابطہ کریں اور ہم آپ کی سیٹنگز اپ ڈیٹ کر دیں گے۔ تبدیل کرنے کا کوئی چارج نہیں۔\n\nYes! Contact Link24 support and we'll update your settings. No charge for switching."}
        />
        <FaqItem
          q="کیا میری رقم محفوظ ہے؟ / Is my money safe?"
          a={"جی ہاں، بالکل محفوظ۔ Stripe دنیا کا سب سے بڑا ادائیگی پروسیسر ہے جس پر Amazon، Google، اور Uber بھی اعتماد کرتے ہیں۔ آپ کی رقم محفوظ رکھی جاتی ہے اور براہ راست آپ کے بینک اکاؤنٹ میں بھیجی جاتی ہے۔ Link24 کبھی آپ کی رقم نہیں رکھتا۔\n\nYes, completely safe. Stripe is trusted by millions of businesses worldwide. Link24 never holds your money — it goes directly to your bank."}
        />
      </div>
    </div>
  );
}

export default function StripeApplicationPK() {
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
      const payload = { ...form, businessType: `pakistan-${form.businessType}` };
      const res = await fetch("/api/stripe-applications", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
          <h2 className="text-2xl font-bold text-white mb-3" data-testid="text-success-title">درخواست جمع کر دی گئی!</h2>
          <p className="text-white/80 text-lg mb-2">Application Submitted!</p>
          <p className="text-white/60 mb-4">آپ کی درخواست موصول ہو گئی ہے۔ ہم آپ کی تفصیلات کا جائزہ لیں گے اور آپ کا ادائیگی اکاؤنٹ بنائیں گے۔</p>
          <p className="text-white/40 text-sm mb-4">Thank you for your application. We will review your details and set up your payment account.</p>
          <div className="bg-white/5 rounded-xl p-4 text-left space-y-2">
            <p className="text-white/80 text-sm font-semibold">آگے کیا ہوگا / What happens next:</p>
            <p className="text-white/60 text-sm">1. ہم 24 گھنٹے میں آپ کی درخواست کا جائزہ لیں گے</p>
            <p className="text-white/60 text-sm">2. Stripe آپ کے کاروبار کی تصدیق کرے گا (3-5 کاروباری دن)</p>
            <p className="text-white/60 text-sm">3. تصدیق ہونے پر آپ کو ایمیل ملے گی</p>
            <p className="text-white/60 text-sm">4. کارڈ سے ادائیگیاں قبول کرنا شروع کریں!</p>
          </div>
          <div className="bg-white/5 rounded-xl p-4 mt-4 text-left">
            <p className="text-white/80 text-sm font-semibold mb-2">منتخب کردہ ادائیگی کی رفتار / Your selected payout speed:</p>
            <div className={`flex items-center gap-2 ${form.payoutSpeed === "instant" ? "text-amber-400" : "text-green-400"}`}>
              {form.payoutSpeed === "instant" ? <Zap className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
              <span className="text-sm font-semibold">{form.payoutSpeed === "instant" ? "فوری ادائیگی — 1-2 کاروباری دن / Fast Payout — 1-2 business days" : "معیاری ادائیگی — 5-7 کاروباری دن / Standard Payout — 5-7 business days"}</span>
            </div>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mt-4 text-left">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-amber-400" />
              <p className="text-amber-400 text-sm font-semibold">اہم - ادائیگی کا وقت / Payout Timing</p>
            </div>
            <p className="text-white/50 text-xs">پاکستانی اکاؤنٹس کے لیے بین الاقوامی ٹرانسفر میں 5-7 کاروباری دن لگ سکتے ہیں۔ پہلے 2 ہفتوں میں Stripe تصدیق کے دوران 14-21 دن لگ سکتے ہیں۔</p>
            <p className="text-white/40 text-xs mt-1">For Pakistani accounts, international transfers may take 5-7 business days. During the first 2 weeks, Stripe verification may take 14-21 days.</p>
          </div>
          <p className="text-white/40 text-xs mt-6">اگر آپ کے سوالات ہیں تو Link24 سپورٹ سے رابطہ کریں</p>
          <button
            type="button"
            data-testid="button-go-back-admin"
            onClick={() => window.location.href = "/admin-payments"}
            className="mt-6 w-full py-3 px-4 bg-green-600 hover:bg-green-500 text-white rounded-xl font-semibold transition-all"
          >
            ← واپس جائیں / Go Back to Payment Applications
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#0d1117] to-[#1a1a2e] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Globe className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-1" data-testid="text-form-title">ادائیگی اکاؤنٹ سیٹ اپ</h1>
          <p className="text-xl text-white/80 mb-2">Payment Account Setup — Pakistan</p>
          <p className="text-white/50 text-sm">اپنے کاروبار کی تفصیلات بھریں تاکہ Link24 کے ذریعے کارڈ ادائیگیاں قبول کر سکیں</p>
          <div className="inline-flex items-center gap-2 mt-3 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-1.5">
            <span className="text-green-400 text-sm">🇵🇰 Pakistan Branch</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Store className="h-5 w-5 text-green-400" />
              <h2 className="text-lg font-semibold text-white">کاروبار کی تفصیلات / Business Details</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-white/60 mb-1 block">کاروبار کا نام / Business Name *</label>
                <input data-testid="input-business-name" type="text" required value={form.businessName} onChange={e => update("businessName", e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-green-500"
                  placeholder="e.g. Karachi Kitchen" />
              </div>
              <div>
                <label className="text-sm text-white/60 mb-1 block">کاروبار کی قسم / Business Type *</label>
                <select data-testid="select-business-type" required value={form.businessType} onChange={e => update("businessType", e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500">
                  <option value="restaurant">Restaurant / Takeaway</option>
                  <option value="retail">Retail Shop / دکان</option>
                  <option value="wholesale">Wholesale / تھوک</option>
                  <option value="services">Services / خدمات</option>
                  <option value="other">Other / دیگر</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-white/60 mb-1 block">کاروبار کا پتہ / Business Address *</label>
                <input data-testid="input-business-address" type="text" required value={form.businessAddress} onChange={e => update("businessAddress", e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-green-500"
                  placeholder="Full address / مکمل پتہ" />
              </div>
              <div>
                <label className="text-sm text-white/60 mb-1 block">پوسٹ کوڈ / City & Area *</label>
                <input data-testid="input-postcode" type="text" required value={form.postcode} onChange={e => update("postcode", e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-green-500"
                  placeholder="e.g. Lahore, Gulberg" />
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <User className="h-5 w-5 text-emerald-400" />
              <h2 className="text-lg font-semibold text-white">مالک کی تفصیلات / Owner Details</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-white/60 mb-1 block">مکمل نام / Full Name (Business Owner) *</label>
                <input data-testid="input-owner-name" type="text" required value={form.ownerFullName} onChange={e => update("ownerFullName", e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-green-500"
                  placeholder="Full legal name / مکمل قانونی نام" />
              </div>
              <div>
                <label className="text-sm text-white/60 mb-1 block">ای میل / Email Address *</label>
                <input data-testid="input-email" type="email" required value={form.email} onChange={e => update("email", e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-green-500"
                  placeholder="owner@email.com" />
              </div>
              <div>
                <label className="text-sm text-white/60 mb-1 block">فون نمبر / Phone Number *</label>
                <input data-testid="input-phone" type="tel" required value={form.phone} onChange={e => update("phone", e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-green-500"
                  placeholder="+92 3XX XXXXXXX" />
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Landmark className="h-5 w-5 text-amber-400" />
              <h2 className="text-lg font-semibold text-white">بینک کی تفصیلات / Bank Details</h2>
            </div>
            <p className="text-white/40 text-xs mb-4">آپ کی بینک تفصیلات محفوظ ہیں اور صرف ادائیگیاں وصول کرنے کے لیے استعمال ہوں گی</p>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-white/60 mb-1 block">اکاؤنٹ ہولڈر کا نام / Account Holder Name *</label>
                <input data-testid="input-bank-name" type="text" required value={form.bankAccountName} onChange={e => update("bankAccountName", e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-green-500"
                  placeholder="Name on bank account" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-white/60 mb-1 block">بینک کوڈ / Bank Code *</label>
                  <input data-testid="input-sort-code" type="text" required value={form.bankSortCode} onChange={e => update("bankSortCode", e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-green-500"
                    placeholder="IBAN or Branch Code" />
                </div>
                <div>
                  <label className="text-sm text-white/60 mb-1 block">اکاؤنٹ نمبر / Account Number *</label>
                  <input data-testid="input-account-number" type="text" required value={form.bankAccountNumber} onChange={e => update("bankAccountNumber", e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-green-500"
                    placeholder="Account number or IBAN" />
                </div>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
                  <p className="text-white/50 text-xs">پاکستانی بینک اکاؤنٹ کے لیے IBAN نمبر ضرور فراہم کریں (شروع ہوتا ہے PK سے)۔ مثال: PK36SCBL0000001123456702</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-5 w-5 text-purple-400" />
              <h2 className="text-lg font-semibold text-white">ادائیگی کی رفتار / Payout Speed — رقم کتنی جلدی چاہیے؟</h2>
            </div>

            <div className="space-y-3">
              <label
                data-testid="option-standard-payout"
                className={`block cursor-pointer rounded-xl border p-4 transition-all ${form.payoutSpeed === "standard" ? "border-green-500 bg-green-500/10" : "border-white/10 bg-white/5 hover:border-white/20"}`}
                onClick={() => update("payoutSpeed", "standard")}
              >
                <div className="flex items-start gap-3">
                  <input type="radio" name="payoutSpeed" value="standard" checked={form.payoutSpeed === "standard"} onChange={() => update("payoutSpeed", "standard")}
                    className="mt-1 accent-green-500" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="h-4 w-4 text-green-400" />
                      <span className="text-white font-semibold text-lg">معیاری / Standard Payout — FREE</span>
                      <span className="text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full">تجویز کردہ</span>
                    </div>
                    <p className="text-white/50 text-sm mb-1">رقم 5-7 کاروباری دنوں میں آپ کے بینک میں آ جائے گی</p>
                    <p className="text-white/40 text-xs">Money arrives in your bank in 5-7 business days — no extra charges</p>
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
                      <span className="text-white font-semibold text-lg">فوری / Fast Payout — 1.5% extra</span>
                      <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full">1-2 دن</span>
                    </div>
                    <p className="text-white/50 text-sm mb-1">رقم 1-2 کاروباری دنوں میں آ جائے گی</p>
                    <p className="text-white/40 text-xs">Money arrives in 1-2 business days — faster international transfer</p>
                  </div>
                </div>
              </label>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mt-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-amber-400 text-xs font-semibold mb-1">اہم نوٹ / Important Note:</p>
                  <p className="text-white/50 text-xs leading-relaxed">
                    پہلے 2-3 ہفتوں میں Stripe تصدیق کے دوران ادائیگی میں 14-21 دن لگ سکتے ہیں۔ یہ صرف ایک بار ہوتا ہے۔
                  </p>
                  <p className="text-white/40 text-xs mt-1">For the first 2-3 weeks, Stripe verification may cause 14-21 day delays. This is a one-time check.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="h-5 w-5 text-rose-400" />
              <h2 className="text-lg font-semibold text-white">فیس کی تفصیلات / Fee Breakdown — آپ کو کتنا ملے گا</h2>
            </div>
            <p className="text-white/40 text-xs mb-4">
              {isInstant
                ? "فوری ادائیگی کی فیس دکھائی جا رہی ہے (1.5% اضافی)۔ معیاری سے موازنہ کرنے کے لیے اوپر تبدیل کریں۔"
                : "معیاری ادائیگی کی فیس دکھائی جا رہی ہے (مفت)۔ فوری سے موازنہ کرنے کے لیے اوپر تبدیل کریں۔"
              }
            </p>

            <div className="flex items-center gap-2 mb-4">
              <span className={`text-sm px-3 py-1.5 rounded-full font-semibold ${isInstant ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "bg-green-500/20 text-green-400 border border-green-500/30"}`}>
                {isInstant ? "⚡ فوری ادائیگی منتخب / Fast Payout Selected" : "🕐 معیاری ادائیگی منتخب (مفت) / Standard Payout (FREE)"}
              </span>
            </div>

            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-white/30 text-xs mb-3">* تخمینی شرح تبادلہ: £1 = Rs {PKR_RATE} (اصل شرح مختلف ہو سکتی ہے)</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left text-white/40 py-2 pr-2">رقم / Amount</th>
                      <th className="text-right text-white/40 py-2 px-2">Stripe + Conv.</th>
                      <th className="text-right text-white/40 py-2 px-1">پلیٹ فارم 0.5%</th>
                      {isInstant && <th className="text-right text-amber-400/60 py-2 px-1">فوری 1.5%</th>}
                      <th className="text-right text-white/40 py-2 px-2">کل فیس</th>
                      <th className="text-right text-green-400/60 py-2 pl-2">آپ کو ملے گا</th>
                    </tr>
                  </thead>
                  <tbody className="text-white/60">
                    {FEE_AMOUNTS_PKR.map((amt, i) => {
                      const fees = calcFeesPKR(amt, isInstant);
                      return (
                        <tr key={amt} className={i < FEE_AMOUNTS_PKR.length - 1 ? "border-b border-white/5" : ""}>
                          <td className="py-2 pr-2 text-white font-semibold">{fmtPKR(amt)}</td>
                          <td className="py-2 px-2 text-right">{fmtPKR(fees.stripeFee + fees.conversionFee)}</td>
                          <td className="py-2 px-1 text-right">{fmtPKR(fees.platformFee)}</td>
                          {isInstant && <td className="py-2 px-1 text-right text-amber-400">{fmtPKR(fees.instantFee)}</td>}
                          <td className="py-2 px-2 text-right text-amber-400 font-semibold">{fmtPKR(fees.totalFee)}</td>
                          <td className="py-2 pl-2 text-right text-green-400 font-semibold">{fmtPKR(fees.youReceive)}</td>
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
                      <p className="text-amber-400 text-xs font-semibold">فوری ادائیگی: 1.5% فیس، کم از کم Rs 175</p>
                      <p className="text-white/40 text-xs mt-1">Rs 12,000 سے کم ادائیگیوں پر کم از کم Rs 175 فوری فیس لاگو ہوتی ہے۔ چھوٹی رقم کے لیے معیاری بہتر ہے۔</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-white/60 text-xs font-semibold mb-2">فوری موازنہ — Rs 3,500 کی ادائیگی / Quick Comparison — Rs 3,500 (≈£10):</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className={`rounded-lg p-3 border ${!isInstant ? "border-green-500 bg-green-500/10" : "border-white/10 bg-white/5"}`}>
                    <div className="flex items-center gap-1 mb-1">
                      <Clock className="h-3 w-3 text-green-400" />
                      <span className="text-white/70 text-xs font-semibold">معیاری (5-7 دن)</span>
                    </div>
                    <p className="text-white/40 text-xs">فیس: {fmtPKR(calcFeesPKR(3500, false).totalFee)}</p>
                    <p className="text-green-400 text-sm font-bold">ملے گا: {fmtPKR(calcFeesPKR(3500, false).youReceive)}</p>
                  </div>
                  <div className={`rounded-lg p-3 border ${isInstant ? "border-amber-500 bg-amber-500/10" : "border-white/10 bg-white/5"}`}>
                    <div className="flex items-center gap-1 mb-1">
                      <Zap className="h-3 w-3 text-amber-400" />
                      <span className="text-white/70 text-xs font-semibold">فوری (1-2 دن)</span>
                    </div>
                    <p className="text-white/40 text-xs">فیس: {fmtPKR(calcFeesPKR(3500, true).totalFee)}</p>
                    <p className="text-green-400 text-sm font-bold">ملے گا: {fmtPKR(calcFeesPKR(3500, true).youReceive)}</p>
                  </div>
                </div>
                <p className="text-white/30 text-xs mt-2">فرق: صرف {fmtPKR(calcFeesPKR(3500, true).totalFee - calcFeesPKR(3500, false).totalFee)} زیادہ فوری کے لیے۔ معیاری سے پیسے بچتے ہیں۔</p>
              </div>

              <p className="text-white/30 text-xs mt-4">* Stripe: 2.9% + Rs 70 (بین الاقوامی). کرنسی تبدیلی: 2%. پلیٹ فارم: 0.5%. فوری: 1.5% (کم از کم Rs 175). رقم PKR میں موجودہ شرح تبادلہ پر۔</p>
            </div>
          </div>

          <FaqSectionPK />

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="h-5 w-5 text-sky-400" />
              <h2 className="text-lg font-semibold text-white">اضافی نوٹس / Additional Notes</h2>
            </div>
            <textarea data-testid="input-notes" value={form.notes} onChange={e => update("notes", e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-green-500 min-h-[80px]"
              placeholder="Any additional information / کوئی اضافی معلومات (optional)" />
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-orange-400" />
              <h2 className="text-lg font-semibold text-white">شرائط و ضوابط / Terms & Conditions *</h2>
            </div>
            <p className="text-white/40 text-xs mb-4">جمع کرنے سے پہلے براہ کرم درج ذیل کو پڑھیں اور قبول کریں:</p>
            <div className="space-y-4">
              <label className="flex items-start gap-3 cursor-pointer" data-testid="checkbox-terms">
                <input type="checkbox" checked={termsAccepted} onChange={e => setTermsAccepted(e.target.checked)}
                  className="mt-1 accent-green-500 h-4 w-4" />
                <span className="text-white/60 text-sm leading-relaxed">
                  میں اس بات سے اتفاق کرتا/کرتی ہوں کہ میری تفصیلات Stripe (ادائیگی پروسیسر) کے ساتھ شیئر کی جائیں گی۔
                  <span className="block text-white/40 text-xs mt-1">I agree that my details will be shared with Stripe for payment processing. I authorise Link24 to create a payment sub-account on my behalf.</span>
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer" data-testid="checkbox-fees">
                <input type="checkbox" checked={feesAccepted} onChange={e => setFeesAccepted(e.target.checked)}
                  className="mt-1 accent-green-500 h-4 w-4" />
                <span className="text-white/60 text-sm leading-relaxed">
                  میں لین دین کی فیس کو سمجھتا/سمجھتی ہوں اور قبول کرتا/کرتی ہوں:
                  <span className="block text-white/40 text-xs mt-1">
                    — Stripe فیس: 2.9% + 20p فی بین الاقوامی لین دین
                    <br />— کرنسی تبدیلی: 2%
                    <br />— Link24 پلیٹ فارم فیس: 0.5% فی لین دین
                    <br />— فوری ادائیگی فیس (اگر منتخب ہو): 1.5% اضافی (کم از کم 50p)
                    <br />— کوئی ماہانہ فیس نہیں، کوئی سیٹ اپ فیس نہیں
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer" data-testid="checkbox-tax">
                <input type="checkbox" checked={taxAccepted} onChange={e => setTaxAccepted(e.target.checked)}
                  className="mt-1 accent-green-500 h-4 w-4" />
                <div className="flex-1">
                  <span className="text-white/60 text-sm leading-relaxed">
                    میں سمجھتا/سمجھتی ہوں کہ میں اپنے ٹیکس، VAT، اور تمام سرکاری رپورٹنگ ذمہ داریوں کا مکمل طور پر ذمہ دار ہوں۔
                  </span>
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2 mt-2">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-400 mt-0.5 shrink-0" />
                      <p className="text-amber-400/80 text-xs">آپ کی ذمہ داری ہے کہ تمام آمدنی ظاہر کریں، FBR/ٹیکس حکام کو رپورٹ کریں۔ Link24 کسی بھی ٹیکس یا جرمانے کا ذمہ دار نہیں ہے۔
                        <br /><span className="text-white/40">You are responsible for declaring all income to FBR/tax authorities. Link24 is not liable for any unpaid taxes or penalties.</span>
                      </p>
                    </div>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm" data-testid="text-error">{error}</div>}

          <button data-testid="button-submit" type="submit" disabled={loading || !termsAccepted || !feesAccepted || !taxAccepted}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold py-4 rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg">
            {loading ? "جمع ہو رہا ہے..." : !termsAccepted || !feesAccepted || !taxAccepted ? "تمام شرائط قبول کریں / Accept all terms" : "درخواست جمع کریں / Submit Application"}
          </button>

          <p className="text-center text-white/30 text-xs">Powered by Link24 — Secure International Payment Processing</p>
        </form>
      </div>
    </div>
  );
}