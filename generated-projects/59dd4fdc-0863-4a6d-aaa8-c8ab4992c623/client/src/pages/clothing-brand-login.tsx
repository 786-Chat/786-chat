import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Shirt, ArrowLeft } from "lucide-react";

export default function ClothingBrandLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!username || !password) return;
    setLoading(true);
    try {
      const res = await fetch("/api/clothing/brand-login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        toast({ title: "Invalid credentials", variant: "destructive" });
        return;
      }
      const brand = await res.json();
      localStorage.setItem("clothingBrand", JSON.stringify(brand));
      setLocation("/clothing-brand-dashboard");
    } catch {
      toast({ title: "Login failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-black/40 border-white/10 text-white">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-pink-600/20 flex items-center justify-center mb-4">
            <Shirt className="h-8 w-8 text-pink-400" />
          </div>
          <CardTitle className="text-2xl">Brand Dashboard Login</CardTitle>
          <p className="text-sm text-gray-400">Enter your brand credentials</p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div><Label>Username</Label><Input data-testid="input-login-username" value={username} onChange={e => setUsername(e.target.value)} placeholder="Enter username" className="bg-white/5 border-white/20" /></div>
            <div><Label>Password</Label><Input data-testid="input-login-password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" className="bg-white/5 border-white/20" onKeyDown={e => e.key === "Enter" && handleLogin()} /></div>
            <Button data-testid="button-login" className="w-full bg-pink-600 hover:bg-pink-700" onClick={handleLogin} disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
