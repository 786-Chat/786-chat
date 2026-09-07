import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Wifi, ArrowLeft } from "lucide-react";

export default function DeviceCustomerLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [brandSlug, setBrandSlug] = useState("");
  const [loading, setLoading] = useState(false);

  const urlParams = new URLSearchParams(window.location.search);
  const prefilledBrand = urlParams.get("brand") || "";

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/device-customers/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, brandSlug: brandSlug || prefilledBrand }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Invalid credentials");
      const { customer, brand } = await res.json();
      localStorage.setItem("deviceCustomerId", customer.id);
      localStorage.setItem("deviceCustomerName", customer.name);
      localStorage.setItem("deviceCustomerBrandId", brand.id);
      localStorage.setItem("deviceCustomerBrandName", brand.name);
      localStorage.setItem("deviceCustomerBrandSlug", brand.slug);
      setLocation("/device-customer-portal");
    } catch (error: any) {
      toast({ title: "Login Failed", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/5 border-white/10 backdrop-blur-xl">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <Wifi className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">Device Control Panel</CardTitle>
          <p className="text-gray-400 text-sm">Sign in to manage your devices</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {!prefilledBrand && (
              <div>
                <Label className="text-gray-300">Brand Code</Label>
                <Input value={brandSlug} onChange={(e) => setBrandSlug(e.target.value)} required className="bg-white/10 border-white/20 text-white" placeholder="Enter brand code" data-testid="input-brand-slug" />
              </div>
            )}
            <div>
              <Label className="text-gray-300">Username</Label>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} required className="bg-white/10 border-white/20 text-white" placeholder="Enter username" data-testid="input-login-username" />
            </div>
            <div>
              <Label className="text-gray-300">Password</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="bg-white/10 border-white/20 text-white" placeholder="Enter password" data-testid="input-login-password" />
            </div>
            <Button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-700" disabled={loading} data-testid="button-login">
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <Button variant="link" onClick={() => setLocation("/")} className="text-gray-400 hover:text-white" data-testid="button-back-home">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
