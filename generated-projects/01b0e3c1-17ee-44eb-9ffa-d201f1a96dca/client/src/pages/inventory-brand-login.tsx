import { useState } from "react";
import { useLocation } from "wouter";
import { Factory, LogIn, ArrowLeft, Package, BarChart3, QrCode, Lock, User, Boxes } from "lucide-react";

export default function InventoryBrandLogin() {
  const [, navigate] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) { setError("Please enter username and password"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/inventory/brands/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        const brand = await res.json();
        localStorage.setItem("inventoryBrand", JSON.stringify(brand));
        navigate("/inventory-brand-dashboard");
      } else { setError("Invalid username or password"); }
    } catch { setError("Login failed"); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4" style={{ background: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)" }}>
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-20" style={{ background: "radial-gradient(circle, #f59e0b 0%, transparent 70%)" }} />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full opacity-15" style={{ background: "radial-gradient(circle, #8b5cf6 0%, transparent 70%)" }} />
        <div className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #06b6d4 0%, transparent 70%)" }} />
        {[...Array(30)].map((_, i) => (
          <div key={i} className="absolute w-1 h-1 bg-white rounded-full animate-pulse" style={{ top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 4}s`, opacity: Math.random() * 0.4 + 0.1 }} />
        ))}
      </div>

      <div className="w-full max-w-md relative z-10">
        <button onClick={() => navigate("/")} className="text-white/50 hover:text-white flex items-center gap-2 mb-8 transition-colors group" data-testid="button-back">
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> Back to Home
        </button>

        <div className="bg-white/[0.08] backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/15 overflow-hidden">
          <div className="px-8 pt-10 pb-6 text-center relative">
            <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent" />
            <div className="relative">
              <div className="relative inline-flex">
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-xl shadow-amber-500/20" style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}>
                  <Factory size={36} className="text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30 animate-pulse">
                  <Boxes size={16} className="text-white" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2" data-testid="text-login-title">Brand Portal</h1>
              <p className="text-white/40 text-sm">Manufacturing & Inventory Management</p>
            </div>
          </div>

          <div className="px-8 pb-8">
            {error && (
              <div className="bg-red-500/15 border border-red-400/20 text-red-300 p-3.5 rounded-xl mb-5 text-sm flex items-center gap-2" data-testid="text-error">
                <div className="w-2 h-2 bg-red-400 rounded-full shrink-0 animate-pulse" />{error}
              </div>
            )}

            <form onSubmit={login} className="space-y-5">
              <div>
                <label className="text-sm font-medium text-white/60 mb-2 block">Username</label>
                <div className="relative">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" />
                  <input value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-white/[0.06] border border-white/15 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder-white/25 focus:outline-none focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/15 transition-all" placeholder="Enter your username" data-testid="input-username" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-white/60 mb-2 block">Password</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" />
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-white/[0.06] border border-white/15 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder-white/25 focus:outline-none focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/15 transition-all" placeholder="Enter your password" data-testid="input-password" />
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full py-3.5 rounded-xl font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-all hover:shadow-xl hover:shadow-amber-500/20 active:scale-[0.98]" style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }} data-testid="button-login">
                <LogIn size={18} /> {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>
          </div>

          <div className="border-t border-white/[0.06] px-8 py-5 bg-white/[0.02]">
            <div className="flex items-center justify-center gap-8 text-white/25 text-xs">
              <span className="flex items-center gap-1.5"><Package size={13} /> Products</span>
              <span className="flex items-center gap-1.5"><QrCode size={13} /> Barcode</span>
              <span className="flex items-center gap-1.5"><BarChart3 size={13} /> Analytics</span>
            </div>
          </div>
        </div>

        <p className="text-center text-white/20 text-xs mt-6">Mujeeb Manufacturing & Inventory System</p>
      </div>
    </div>
  );
}
