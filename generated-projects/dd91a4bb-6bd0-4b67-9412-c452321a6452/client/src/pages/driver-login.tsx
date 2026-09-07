import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, Phone, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { InstallPrompt } from "@/components/install-prompt";
import { usePwaBranding } from "@/hooks/use-pwa-branding";

export default function DriverLogin() {
  const [, setLocation] = useLocation();
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  usePwaBranding("driver");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phone.trim() || !pin.trim()) {
      toast({ title: "Missing fields", description: "Please enter your phone number and PIN", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    
    try {
      const res = await fetch("/api/driver-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim(), password: pin.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Login failed");
      }

      localStorage.setItem("driverId", data.driver.id);
      localStorage.setItem("driverName", data.driver.name);
      localStorage.setItem("driverPhone", data.driver.phone);
      
      toast({ title: "Welcome back!", description: `Logged in as ${data.driver.name}` });
      setLocation("/driver-dashboard");
    } catch (error) {
      toast({ 
        title: "Login failed", 
        description: error instanceof Error ? error.message : "Invalid phone number or PIN", 
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-slate-700 bg-slate-800/50 backdrop-blur">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4">
            <Car className="h-8 w-8 text-emerald-400" />
          </div>
          <CardTitle className="text-2xl text-white">Driver Login</CardTitle>
          <CardDescription className="text-slate-400">
            Enter your phone number and PIN to access deliveries
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-slate-200">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="07xxx xxxxxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                  data-testid="input-driver-phone"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="pin" className="text-slate-200">PIN</Label>
              <Input
                id="pin"
                type="password"
                placeholder="Enter your 4-digit PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                maxLength={6}
                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 text-center text-2xl tracking-widest"
                data-testid="input-driver-pin"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={isLoading}
              data-testid="button-driver-login"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Logging in...
                </>
              ) : (
                <>
                  <Car className="h-4 w-4 mr-2" />
                  Start Driving
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-400">
            <p>Contact your manager if you don't have login credentials</p>
          </div>
        </CardContent>
      </Card>
      
      <InstallPrompt section="driver" />
    </div>
  );
}
