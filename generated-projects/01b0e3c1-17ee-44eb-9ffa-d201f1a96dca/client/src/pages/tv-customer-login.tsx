import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Tv, LogIn, Eye, EyeOff, Monitor } from "lucide-react";

interface TvDisplay {
  id: string;
  tvType: number;
  name: string;
  config: any;
  accessToken: string;
  orientation: string;
}

interface LoginResponse {
  customerId: string;
  name: string;
  assignedTvs: number[];
  tvDisplays: TvDisplay[];
}

export default function TvCustomerLogin() {
  const [, navigate] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [loginData, setLoginData] = useState<LoginResponse | null>(null);

  const handleLogin = async () => {
    if (!username || !password) {
      setError("Please enter username and password");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/tv-display-customers/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }
      setLoginData(data);
      setLoggedIn(true);
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const openTvDisplay = (tv: TvDisplay) => {
    if (loginData) {
      navigate(`/tv-customer/${loginData.customerId}/${tv.tvType}`);
    }
  };

  if (loggedIn && loginData) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)", color: "white", fontFamily: "'Segoe UI', Arial, sans-serif" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 20px" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <Tv size={40} />
            </div>
            <h1 style={{ fontSize: "2em", fontWeight: 900, marginBottom: 8 }} data-testid="text-welcome">Welcome, {loginData.name}</h1>
            <p style={{ color: "#94a3b8", fontSize: "1.1em" }}>Select a TV display to view</p>
          </div>

          {loginData.tvDisplays.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60, background: "rgba(255,255,255,0.05)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.1)" }}>
              <Monitor size={48} style={{ color: "#64748b", marginBottom: 16 }} />
              <p style={{ color: "#94a3b8", fontSize: "1.1em" }}>No TV displays assigned to your account yet.</p>
              <p style={{ color: "#64748b", fontSize: "0.9em", marginTop: 8 }}>Please contact the administrator.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 20 }}>
              {loginData.tvDisplays.map((tv) => (
                <button
                  key={tv.id}
                  onClick={() => openTvDisplay(tv)}
                  style={{
                    background: "linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.15))",
                    border: "1px solid rgba(59,130,246,0.3)",
                    borderRadius: 16,
                    padding: 30,
                    textAlign: "center",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    color: "white",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.borderColor = "rgba(59,130,246,0.6)";
                    e.currentTarget.style.boxShadow = "0 8px 30px rgba(59,130,246,0.2)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.borderColor = "rgba(59,130,246,0.3)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                  data-testid={`btn-tv-display-${tv.tvType}`}
                >
                  <div style={{ width: 60, height: 60, borderRadius: 12, background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: "1.5em", fontWeight: 900 }}>
                    {tv.tvType}
                  </div>
                  <div style={{ fontSize: "1.2em", fontWeight: 700, marginBottom: 6 }}>TV {tv.tvType}</div>
                  <div style={{ fontSize: "0.85em", color: "#94a3b8" }}>{tv.name}</div>
                  <div style={{ marginTop: 12, fontSize: "0.75em", color: "#64748b", textTransform: "uppercase", letterSpacing: 1 }}>{tv.orientation}</div>
                </button>
              ))}
            </div>
          )}

          <div style={{ textAlign: "center", marginTop: 40 }}>
            <button
              onClick={() => { setLoggedIn(false); setLoginData(null); setUsername(""); setPassword(""); }}
              style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#94a3b8", padding: "10px 24px", borderRadius: 8, cursor: "pointer", fontSize: "0.9em" }}
              data-testid="btn-logout"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI', Arial, sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 420, padding: 20 }}>
        <div style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(20px)", borderRadius: 24, border: "1px solid rgba(255,255,255,0.1)", padding: "48px 36px", boxShadow: "0 25px 50px rgba(0,0,0,0.5)" }}>
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <div style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <Tv size={40} color="white" />
            </div>
            <h1 style={{ fontSize: "1.8em", fontWeight: 900, color: "white", marginBottom: 8 }}>TV Display Login</h1>
            <p style={{ color: "#94a3b8", fontSize: "0.95em" }}>Enter your credentials to access your TV displays</p>
          </div>

          {error && (
            <div style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 12, padding: "12px 16px", marginBottom: 20, color: "#fca5a5", fontSize: "0.9em", textAlign: "center" }} data-testid="text-error">
              {error}
            </div>
          )}

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", color: "#94a3b8", fontSize: "0.85em", marginBottom: 8, fontWeight: 500 }}>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              placeholder="Enter your username"
              style={{ width: "100%", padding: "14px 16px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12, color: "white", fontSize: "1em", outline: "none", boxSizing: "border-box" }}
              data-testid="input-username"
            />
          </div>

          <div style={{ marginBottom: 28 }}>
            <label style={{ display: "block", color: "#94a3b8", fontSize: "0.85em", marginBottom: 8, fontWeight: 500 }}>Password</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                placeholder="Enter your password"
                style={{ width: "100%", padding: "14px 48px 14px 16px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12, color: "white", fontSize: "1em", outline: "none", boxSizing: "border-box" }}
                data-testid="input-password"
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#64748b", cursor: "pointer", padding: 4 }}
                data-testid="btn-toggle-password"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              background: loading ? "#4b5563" : "linear-gradient(135deg, #3b82f6, #8b5cf6)",
              border: "none",
              borderRadius: 12,
              color: "white",
              fontSize: "1.1em",
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              transition: "all 0.3s ease",
            }}
            data-testid="btn-login"
          >
            <LogIn size={20} />
            {loading ? "Logging in..." : "Login"}
          </button>
        </div>

        <p style={{ textAlign: "center", color: "#475569", fontSize: "0.8em", marginTop: 20 }}>
          TV Display Management System
        </p>
      </div>
    </div>
  );
}
