import { useState } from "react";
import { useLocation } from "wouter";
import { Store, User, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function GroceryBranchLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleLogin = async () => {
    if (!username || !password) {
      toast({ title: "Username and password required", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/grocery/branch-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.error || "Login failed", variant: "destructive" });
        return;
      }
      localStorage.setItem("groceryBranchOwnerId", data.branch.id);
      localStorage.setItem("groceryBranchOwnerName", data.branch.name);
      localStorage.setItem("groceryBranchOwnerSlug", data.branch.slug);
      localStorage.setItem("groceryBranchOwnerCurrency", data.branch.currency || "£");
      setLocation("/grocery-branch-dashboard");
    } catch (err) {
      toast({ title: "Login failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 to-green-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center mx-auto mb-4">
            <Store className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl" data-testid="text-branch-login-title">Branch Dashboard Login</CardTitle>
          <p className="text-sm text-muted-foreground">Login with your branch credentials</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Username</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={username} onChange={e => setUsername(e.target.value)} placeholder="Your username" className="pl-10" data-testid="input-branch-username" />
            </div>
          </div>
          <div>
            <Label>Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Your password" className="pl-10" data-testid="input-branch-password" onKeyDown={e => e.key === "Enter" && handleLogin()} />
            </div>
          </div>
          <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={handleLogin} disabled={loading} data-testid="button-branch-login">
            {loading ? "Logging in..." : "Login to Dashboard"}
          </Button>
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => setLocation("/grocery-staff-login")}
              className="text-sm text-emerald-600 hover:text-emerald-700 hover:underline"
              data-testid="link-staff-login"
            >
              Staff Member? Login here
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
