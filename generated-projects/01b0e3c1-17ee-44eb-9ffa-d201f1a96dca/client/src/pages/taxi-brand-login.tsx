import { useState } from "react";
import { useLocation } from "wouter";
import { Car, Lock, Eye, EyeOff, Building2, User, Zap } from "lucide-react";

export default function TaxiBrandLogin() {
  const [, navigate] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/taxi-brand-admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      localStorage.setItem("taxiBrandAdminId", data.brand.id);
      localStorage.setItem("taxiBrandAdminName", data.brand.name);
      localStorage.setItem("taxiBrandAdminSlug", data.brand.slug);
      navigate("/taxi-brand-admin");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fillTestLogin = () => {
    setUsername("mujeeb");
    setPassword("test123");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 mb-4 shadow-2xl shadow-cyan-500/30">
            <Building2 className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Business Owner Login</h1>
          <p className="text-gray-400">Manage your taxi brand, drivers & rides</p>
        </div>

        <form onSubmit={handleLogin} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm" data-testid="text-error">
              {error}
            </div>
          )}

          <div>
            <label className="text-sm text-gray-300 mb-2 block">Username</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <User className="h-4 w-4 text-gray-500" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50"
                placeholder="Enter your username"
                required
                data-testid="input-username"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-300 mb-2 block">Password</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <Lock className="h-4 w-4 text-gray-500" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-12 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50"
                placeholder="Enter your password"
                required
                data-testid="input-password"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3 rounded-xl font-semibold hover:from-cyan-600 hover:to-blue-700 transition-all disabled:opacity-50 shadow-lg shadow-cyan-500/25"
            data-testid="button-login"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <div className="border-t border-white/10 pt-4">
            <button
              type="button"
              onClick={fillTestLogin}
              className="w-full flex items-center justify-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-500/20 transition-all"
              data-testid="button-test-login"
            >
              <Zap className="h-4 w-4" /> Quick Test Login
            </button>
            <p className="text-center text-gray-600 text-xs mt-2">Username: mujeeb | Password: test123</p>
          </div>
        </form>

        <p className="text-center text-gray-600 text-xs mt-6">Business Owner Portal - Taxi Management</p>
      </div>
    </div>
  );
}
