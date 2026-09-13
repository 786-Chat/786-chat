import { useState } from "react";
import { useLocation } from "wouter";
import { Copy, Check, Building, CreditCard } from "lucide-react";

export default function PayInfoPage() {
  const [copied, setCopied] = useState<string | null>(null);
  const params = new URLSearchParams(window.location.search);

  const bank = params.get("bank") || "";
  const name = params.get("name") || "";
  const sortCode = params.get("sc") || "";
  const accountNumber = params.get("acc") || "";
  const iban = params.get("iban") || "";
  const amount = params.get("amount") || "";
  const currency = params.get("cur") || "£";
  const restaurant = params.get("r") || "";
  const ep = params.get("ep") || "";
  const epName = params.get("epn") || "";
  const jc = params.get("jc") || "";
  const jcName = params.get("jcn") || "";

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const DetailRow = ({ label, value, copyKey }: { label: string; value: string; copyKey: string }) => (
    <div className="flex items-center justify-between py-3 px-4 bg-white/10 rounded-xl" data-testid={`pay-detail-${copyKey}`}>
      <div>
        <p className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">{label}</p>
        <p className="font-bold text-white text-lg mt-0.5">{value}</p>
      </div>
      <button
        onClick={() => copyToClipboard(value, copyKey)}
        className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 transition-all"
        data-testid={`button-copy-${copyKey}`}
      >
        {copied === copyKey ? (
          <Check className="h-5 w-5 text-green-400" />
        ) : (
          <Copy className="h-5 w-5 text-gray-300" />
        )}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f0a1e] via-[#1a1030] to-[#0f0a1e] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-5">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-purple-500/20 px-4 py-2 rounded-full">
            <Building className="h-5 w-5 text-purple-400" />
            <span className="text-sm font-bold text-purple-300 uppercase tracking-wider">Bank Transfer</span>
          </div>
          {restaurant && (
            <p className="text-gray-400 text-sm">Payment to <span className="text-white font-semibold">{restaurant}</span></p>
          )}
        </div>

        {amount && (
          <div className="text-center py-4 bg-gradient-to-r from-yellow-500/20 via-amber-500/20 to-yellow-500/20 rounded-2xl border border-yellow-500/30">
            <p className="text-xs text-yellow-300/70 uppercase tracking-wider mb-1">Amount to Pay</p>
            <p className="text-3xl font-black text-yellow-400">{currency}{amount}</p>
          </div>
        )}

        <div className="space-y-2">
          <p className="text-xs text-gray-400 text-center mb-3">Tap the copy button next to each detail to copy it</p>
          {bank && <DetailRow label="Bank" value={bank} copyKey="bank" />}
          {name && <DetailRow label="Account Name" value={name} copyKey="name" />}
          {sortCode && <DetailRow label="Sort Code" value={sortCode} copyKey="sort-code" />}
          {accountNumber && <DetailRow label="Account Number" value={accountNumber} copyKey="account" />}
          {iban && <DetailRow label="IBAN" value={iban} copyKey="iban" />}
          {ep && <DetailRow label="EasyPaisa" value={`${epName} - ${ep}`} copyKey="easypaisa" />}
          {jc && <DetailRow label="JazzCash" value={`${jcName} - ${jc}`} copyKey="jazzcash" />}
        </div>

        <div className="text-center pt-2">
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <p className="text-xs text-gray-400 leading-relaxed">
              Copy the details above and paste them into your banking app to complete the payment. After transferring, go back and confirm your order.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
