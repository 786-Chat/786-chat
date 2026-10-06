import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Car, Lock, Eye, EyeOff, Phone, User, Mail, MapPin, ArrowLeft, UserPlus, LogIn, Zap } from "lucide-react";

export default function TaxiCustomerLogin() {
  const [, navigate] = useLocation();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regWhatsapp, setRegWhatsapp] = useState("");
  const [regAddress, setRegAddress] = useState("");
  const [regPin, setRegPin] = useState("");
  const [regConfirmPin, setRegConfirmPin] = useState("");
  const [showRegPin, setShowRegPin] = useState(false);

  const { data: brands = [] } = useQuery({
    queryKey: ["/api/taxi-brands"],
    queryFn: async () => {
      const res = await fetch("/api/taxi-brands");
      return res.json();
    },
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/taxi-customers/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      localStorage.setItem("taxiCustomerId", data.customer.id);
      localStorage.setItem("taxiCustomerName", data.customer.name);
      localStorage.setItem("taxiCustomerPhone", data.customer.phone);
      const activeBrands = brands.filter((b: any) => b.status === "active");
      if (activeBrands.length === 1) {
        navigate(`/taxi/${activeBrands[0].slug}`);
      } else {
        navigate("/taxi-customer-home");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (regPin !== regConfirmPin) {
      setError("Passwords do not match");
      return;
    }
    if (regPin.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/taxi-customers/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regName,
          phone: regPhone,
          email: regEmail || undefined,
          whatsapp: regWhatsapp || undefined,
          address: regAddress,
          pin: regPin,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      setSuccess("Account created! You can now sign in.");
      setMode("login");
      setPhone(regPhone);
      setRegName(""); setRegPhone(""); setRegEmail(""); setRegWhatsapp(""); setRegAddress(""); setRegPin(""); setRegConfirmPin("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-fuchsia-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 mb-4 shadow-2xl shadow-purple-500/30">
            <Car className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {mode === "login" ? "Customer Login" : "Create Account"}
          </h1>
          <p className="text-gray-400">
            {mode === "login" ? "Book rides with local taxi services" : "Register to start booking rides"}
          </p>
        </div>

        {mode === "login" ? (
          <form onSubmit={handleLogin} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm" data-testid="text-error">{error}</div>
            )}
            {success && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-green-400 text-sm" data-testid="text-success">{success}</div>
            )}

            <div>
              <label className="text-sm text-gray-300 mb-2 block">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50"
                  placeholder="Enter your phone number"
                  required
                  data-testid="input-phone"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-300 mb-2 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-12 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50"
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
              className="w-full bg-gradient-to-r from-purple-600 to-violet-600 text-white py-3 rounded-xl font-semibold hover:from-purple-500 hover:to-violet-500 transition-all disabled:opacity-50 shadow-lg shadow-purple-500/25"
              data-testid="button-login"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>

            <div className="text-center pt-2">
              <button type="button" onClick={() => { setMode("register"); setError(""); setSuccess(""); }} className="text-purple-400 hover:text-purple-300 text-sm font-medium flex items-center gap-1.5 mx-auto" data-testid="button-switch-register">
                <UserPlus className="h-4 w-4" /> Don't have an account? Register
              </button>
            </div>

            <div className="border-t border-white/10 pt-4 mt-2">
              <p className="text-[11px] text-gray-500 text-center mb-3">Test Accounts (password: customer123)</p>
              <div className="space-y-2">
                {[
                  { name: "Sarah Test", phone: "07700200001" },
                  { name: "James Wilson", phone: "07700200002" },
                  { name: "Fatima Ali", phone: "07700200003" },
                ].map((tc) => (
                  <button
                    key={tc.phone}
                    type="button"
                    onClick={() => { setPhone(tc.phone); setPassword("customer123"); }}
                    className="w-full flex items-center gap-3 py-2.5 px-4 rounded-xl text-sm border border-emerald-500/20 text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/15 transition-all"
                    data-testid={`button-test-customer-${tc.phone}`}
                  >
                    <Zap className="h-3.5 w-3.5 shrink-0" />
                    <span className="font-medium">{tc.name}</span>
                    <span className="ml-auto text-xs text-gray-500 font-mono">{tc.phone}</span>
                  </button>
                ))}
              </div>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm" data-testid="text-error">{error}</div>
            )}

            <div>
              <label className="text-sm text-gray-300 mb-1.5 block">Full Name *</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input type="text" value={regName} onChange={(e) => setRegName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50"
                  placeholder="Your full name" required data-testid="input-reg-name" />
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-300 mb-1.5 block">Phone Number *</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input type="tel" value={regPhone} onChange={(e) => setRegPhone(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50"
                  placeholder="Your phone number" required data-testid="input-reg-phone" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-gray-300 mb-1.5 block">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-3 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 text-sm"
                    placeholder="Email (optional)" data-testid="input-reg-email" />
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-300 mb-1.5 block">WhatsApp</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <input type="tel" value={regWhatsapp} onChange={(e) => setRegWhatsapp(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-3 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 text-sm"
                    placeholder="WhatsApp (optional)" data-testid="input-reg-whatsapp" />
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-300 mb-1.5 block">Address *</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input type="text" value={regAddress} onChange={(e) => setRegAddress(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50"
                  placeholder="Your home address" required data-testid="input-reg-address" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-gray-300 mb-1.5 block">Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <input type={showRegPin ? "text" : "password"} value={regPin} onChange={(e) => setRegPin(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-10 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 text-sm"
                    placeholder="Min 6 chars" required data-testid="input-reg-password" />
                  <button type="button" onClick={() => setShowRegPin(!showRegPin)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                    {showRegPin ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-300 mb-1.5 block">Confirm *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <input type={showRegPin ? "text" : "password"} value={regConfirmPin} onChange={(e) => setRegConfirmPin(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-3 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 text-sm"
                    placeholder="Re-enter" required data-testid="input-reg-confirm" />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-violet-600 text-white py-3 rounded-xl font-semibold hover:from-purple-500 hover:to-violet-500 transition-all disabled:opacity-50 shadow-lg shadow-purple-500/25 mt-2"
              data-testid="button-register"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>

            <div className="text-center pt-1">
              <button type="button" onClick={() => { setMode("login"); setError(""); }} className="text-purple-400 hover:text-purple-300 text-sm font-medium flex items-center gap-1.5 mx-auto" data-testid="button-switch-login">
                <LogIn className="h-4 w-4" /> Already have an account? Sign In
              </button>
            </div>
          </form>
        )}

        <p className="text-center text-gray-700 text-xs mt-6">Taxi Customer Portal</p>
      </div>
    </div>
  );
}
