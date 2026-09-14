import { useState } from "react";
import { useLocation } from "wouter";
import { Car, Lock, Eye, EyeOff, Shield, Mail } from "lucide-react";

export default function TaxiAdminLogin() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/taxi-admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      localStorage.setItem("taxiAdminAuth", "true");
      localStorage.setItem("taxiAdminName", data.name || "Taxi Super Admin");
      navigate("/taxi-admin");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-green-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-green-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500 to-green-700 mb-4 shadow-2xl shadow-green-500/30">
            <Shield className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Taxi Super Admin</h1>
          <p className="text-gray-500">Control all taxi businesses from one place</p>
        </div>

        <form onSubmit={handleLogin} className="bg-gray-900/80 backdrop-blur-xl border border-gray-700 rounded-2xl p-8 space-y-6">
          <div className="flex items-center gap-2 text-green-400 text-sm font-medium mb-2">
            <Shield className="h-4 w-4" />
            <span>Super Admin Access Only</span>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm" data-testid="text-error">
              {error}
            </div>
          )}

          <div>
            <label className="text-sm text-gray-300 mb-2 block">Email Address</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <Mail className="h-4 w-4 text-gray-500" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/50 border border-gray-700 rounded-xl pl-11 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50"
                placeholder="Enter your email"
                required
                data-testid="input-email"
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
                className="w-full bg-black/50 border border-gray-700 rounded-xl pl-11 pr-12 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50"
                placeholder="Enter password"
                required
                data-testid="input-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-xl font-semibold hover:from-green-500 hover:to-green-600 transition-all disabled:opacity-50 shadow-lg shadow-green-500/25"
            data-testid="button-login"
          >
            {loading ? "Signing in..." : "Sign In as Super Admin"}
          </button>
        </form>

        <p className="text-center text-gray-700 text-xs mt-6">Taxi Super Admin Portal</p>
      </div>
    </div>
  );
}
