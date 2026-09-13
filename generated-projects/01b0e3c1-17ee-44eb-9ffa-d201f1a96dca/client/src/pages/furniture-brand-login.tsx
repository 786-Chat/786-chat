import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Sofa } from "lucide-react";

export default function FurnitureBrandLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/furniture/brand-login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) { const err = await res.json(); toast({ title: err.message, variant: "destructive" }); return; }
      const brand = await res.json();
      localStorage.setItem("furnitureBrand", JSON.stringify(brand));
      setLocation("/furniture-brand-dashboard");
    } catch { toast({ title: "Login failed", variant: "destructive" }); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-950 via-stone-950 to-amber-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-black/40 border-amber-500/20 text-white backdrop-blur-xl">
        <CardHeader className="text-center pb-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mx-auto mb-4">
            <Sofa className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">Furniture Brand Login</CardTitle>
          <p className="text-sm text-gray-400">Access your brand dashboard</p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div><Label>Username</Label><Input value={username} onChange={e => setUsername(e.target.value)} placeholder="Enter username" className="bg-white/5 border-white/20" data-testid="input-username" /></div>
            <div><Label>Password</Label><Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" className="bg-white/5 border-white/20" data-testid="input-password" onKeyDown={e => e.key === "Enter" && handleLogin()} /></div>
            <Button onClick={handleLogin} disabled={loading || !username || !password} className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 h-12 font-bold" data-testid="button-login">
              {loading ? "Logging in..." : "LOGIN"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
