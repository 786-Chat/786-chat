import { useState } from "react";
import { useLocation } from "wouter";
import { Phone, LogIn, Eye, EyeOff, ArrowLeft } from "lucide-react";

export default function Link24PhoneLogin() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/link24-phone/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Login failed");
      }
      const user = await res.json();
      localStorage.setItem("link24PhoneAdmin", JSON.stringify(user));
      setLocation("/link24-phone-admin");
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 flex items-center justify-center p-4 relative overflow-hidden" data-testid="page-link24-phone-login">
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 left-1/2 w-[500px] h-[500px] -translate-x-1/2 -translate-y-1/2 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <button
        onClick={() => setLocation("/portal")}
        className="absolute top-6 left-6 text-white/60 hover:text-white flex items-center gap-2 text-sm z-10"
        data-testid="button-back-portal"
      >
        <ArrowLeft size={18} /> Back to Portal
      </button>

      <div className="relative w-full max-w-md">
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-blue-500/40">
              <Phone size={36} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-1">Link24 Phone</h1>
            <p className="text-white/50 text-sm">Sign in to manage your hosted PBX system</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm px-4 py-3 rounded-xl mb-6" data-testid="text-login-error">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="text-sm font-medium text-white/70 mb-1.5 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-blue-400/50 focus:bg-white/10 transition-all"
                placeholder="admin@link24phone.com"
                data-testid="input-email"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-white/70 mb-1.5 block">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-blue-400/50 focus:bg-white/10 transition-all pr-12"
                  placeholder="Enter your password"
                  data-testid="input-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 text-white py-3 rounded-xl font-semibold hover:shadow-2xl hover:shadow-indigo-500/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              data-testid="button-login"
            >
              <LogIn size={18} /> {loading ? "Signing in..." : "Sign In to Link24 Phone"}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <p className="text-xs text-white/40">
              Default admin: <span className="text-white/70 font-mono">admin@link24phone.com</span>
            </p>
            <p className="text-xs text-white/40 mt-1">
              Contact super admin if you need access
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
