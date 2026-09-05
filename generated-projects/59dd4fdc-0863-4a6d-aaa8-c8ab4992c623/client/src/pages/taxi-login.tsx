import { useState } from "react";
import { useLocation } from "wouter";
import { Car, Phone, Lock, Eye, EyeOff, Sparkles } from "lucide-react";

export default function TaxiDriverLogin() {
  const [, navigate] = useLocation();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/taxi-drivers/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      localStorage.setItem("taxiDriverId", data.driver.id);
      localStorage.setItem("taxiDriverName", data.driver.name);
      localStorage.setItem("taxiBrandId", data.brand.id);
      localStorage.setItem("taxiBrandName", data.brand.name);
      navigate("/taxi-dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 mb-4 shadow-2xl shadow-blue-500/30">
            <Car className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Driver Portal</h1>
          <p className="text-gray-400 flex items-center justify-center gap-2">
            <Sparkles className="h-4 w-4 text-yellow-400" />
            Powered by Link24 Taxi
            <Sparkles className="h-4 w-4 text-yellow-400" />
          </p>
        </div>

        <form onSubmit={handleLogin} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm" data-testid="text-error">
              {error}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter your phone number"
                  className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  required
                  data-testid="input-phone"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-12 pr-12 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  required
                  data-testid="input-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-500/25 disabled:opacity-50"
            data-testid="button-login"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing in...
              </span>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="mt-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
          <p className="text-xs text-gray-400 text-center mb-3 font-medium">Quick Test Login</p>
          <div className="space-y-2">
            {[
              { name: "Ahmed Khan", phone: "07700100001", car: "Toyota Prius • Black" },
              { name: "Bilal Hussain", phone: "07700100002", car: "Ford Galaxy • White" },
              { name: "Zara Malik", phone: "07700100003", car: "Honda Civic • Silver" },
            ].map((driver) => (
              <button
                key={driver.phone}
                type="button"
                onClick={() => { setPhone(driver.phone); setPassword("driver123"); }}
                className="w-full flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-left transition-all group"
                data-testid={`button-test-login-${driver.phone}`}
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500/30 to-purple-500/30 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {driver.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{driver.name}</p>
                  <p className="text-xs text-gray-500">{driver.car}</p>
                </div>
                <span className="text-xs text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Click & Sign In →</span>
              </button>
            ))}
          </div>
          <p className="text-[10px] text-gray-600 text-center mt-2">Password: driver123</p>
        </div>
      </div>
    </div>
  );
}
