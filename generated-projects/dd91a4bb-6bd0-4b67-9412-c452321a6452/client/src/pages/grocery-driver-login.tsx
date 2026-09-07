import { useState } from "react";
import { useLocation } from "wouter";
import { Truck, Phone, Lock, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function GroceryDriverLogin() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleLogin = async () => {
    if (!phone || !password) {
      toast({ title: "Phone and password required", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/grocery/driver-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.error || "Login failed", variant: "destructive" });
        return;
      }
      localStorage.setItem("groceryDriverId", data.driver.id);
      localStorage.setItem("groceryDriverName", data.driver.name);
      localStorage.setItem("groceryBranchId", data.branch.id);
      localStorage.setItem("groceryBranchName", data.branch.name);
      setLocation("/grocery-driver-dashboard");
    } catch (err) {
      toast({ title: "Login failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 to-emerald-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto mb-4">
            <Truck className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Grocery Driver Login</CardTitle>
          <p className="text-sm text-muted-foreground">Login with your phone number and password</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Phone Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Your phone number" className="pl-10" data-testid="input-driver-phone" />
            </div>
          </div>
          <div>
            <Label>Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Your password" className="pl-10" data-testid="input-driver-password" onKeyDown={e => e.key === "Enter" && handleLogin()} />
            </div>
          </div>
          <Button className="w-full bg-green-600 hover:bg-green-700" onClick={handleLogin} disabled={loading} data-testid="button-driver-login">
            {loading ? "Logging in..." : "Login"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
