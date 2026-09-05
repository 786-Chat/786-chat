import { useState } from "react";
import { useLocation } from "wouter";
import { Shield, User, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function GroceryStaffLogin() {
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
      const res = await fetch("/api/grocery/staff-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.error || "Login failed", variant: "destructive" });
        return;
      }
      localStorage.setItem("groceryStaffId", data.staff.id);
      localStorage.setItem("groceryStaffName", data.staff.name);
      localStorage.setItem("groceryStaffRole", data.staff.role);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-indigo-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl" data-testid="text-staff-login-title">Staff Login</CardTitle>
          <p className="text-sm text-muted-foreground">Login with your staff credentials</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Username</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={username} onChange={e => setUsername(e.target.value)} placeholder="Your username" className="pl-10" data-testid="input-staff-login-username" />
            </div>
          </div>
          <div>
            <Label>Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Your password" className="pl-10" data-testid="input-staff-login-password" onKeyDown={e => e.key === "Enter" && handleLogin()} />
            </div>
          </div>
          <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={handleLogin} disabled={loading} data-testid="button-staff-login">
            {loading ? "Logging in..." : "Staff Login"}
          </Button>
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => setLocation("/grocery-branch-login")}
              className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
              data-testid="link-branch-login"
            >
              Branch Owner? Login here
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
