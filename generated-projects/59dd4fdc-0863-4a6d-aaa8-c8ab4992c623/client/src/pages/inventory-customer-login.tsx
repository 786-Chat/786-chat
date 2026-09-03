import { useState } from "react";
import { useLocation } from "wouter";
import { Package, LogIn, Eye, EyeOff } from "lucide-react";

export default function InventoryCustomerLogin() {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/inventory/customer-login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Login failed"); }
      const customer = await res.json();
      localStorage.setItem("inventoryCustomer", JSON.stringify(customer));
      setLocation("/inventory-customer-portal");
    } catch (err: any) { setError(err.message); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0f1729] flex items-center justify-center p-4" data-testid="page-inventory-customer-login">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl" />
      </div>
      <div className="relative w-full max-w-md">
        <div className="bg-[#1a2440]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/25">
              <Package size={28} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Customer Portal</h1>
            <p className="text-white/40 text-sm">Sign in to browse products & place orders</p>
          </div>
          {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl mb-6" data-testid="text-login-error">{error}</div>}
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="text-sm font-medium text-white/60 mb-1.5 block">Username</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} required
                className="w-full bg-[#141d33] border border-white/10 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-emerald-500/50 transition-all"
                placeholder="Enter your username" data-testid="input-username" />
            </div>
            <div>
              <label className="text-sm font-medium text-white/60 mb-1.5 block">Password</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required
                  className="w-full bg-[#141d33] border border-white/10 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-emerald-500/50 transition-all pr-12"
                  placeholder="Enter your password" data-testid="input-password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              data-testid="button-login">
              <LogIn size={18} /> {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
