import { useState, useCallback } from "react";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Lock, Loader2, Store } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { InstallPrompt } from "@/components/install-prompt";
import { PwaSplashScreen } from "@/components/pwa-splash-screen";
import { usePwaBranding } from "@/hooks/use-pwa-branding";
import { useQuery } from "@tanstack/react-query";

export default function SuppliersLogin() {
  const [, setLocation] = useLocation();
  const { slug } = useParams<{ slug: string }>();
  const [restaurantName, setRestaurantName] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [splashComplete, setSplashComplete] = useState(false);

  usePwaBranding("suppliers");

  const { data: restaurant, isLoading: loadingRestaurant } = useQuery<any>({
    queryKey: ["/api/restaurants", slug],
    queryFn: async () => {
      const res = await fetch(`/api/restaurants/${slug}`);
      if (!res.ok) throw new Error("Restaurant not found");
      return res.json();
    },
    enabled: !!slug,
  });

  const handleSplashComplete = useCallback(() => {
    setSplashComplete(true);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const loginRestaurantName = slug ? restaurant?.name : restaurantName.trim();
    
    if (!loginRestaurantName || !password.trim()) {
      toast({ title: "Missing fields", description: "Please enter both restaurant name and password", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    
    try {
      const res = await fetch("/api/branch-login-by-name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurantName: loginRestaurantName, password: password.trim(), role: "suppliers" }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Login failed");
      }

      localStorage.setItem("suppliersBranchSlug", data.restaurant.slug);
      localStorage.setItem("suppliersBranchName", data.restaurant.name);
      
      toast({ title: "Supplier Portal Ready", description: `Logged into ${data.restaurant.name}` });
      setLocation(`/suppliers/${data.restaurant.slug}`);
    } catch (error) {
      toast({ 
        title: "Login failed", 
        description: error instanceof Error ? error.message : "Invalid credentials", 
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (loadingRestaurant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-amber-900/20 to-slate-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-amber-400 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <PwaSplashScreen
        appName="App Suppliers"
        accentColor="#f59e0b"
        iconComponent={<Package className="h-12 w-12" />}
        onComplete={handleSplashComplete}
      />
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-amber-900/20 to-slate-900 flex items-center justify-center p-4">
        <InstallPrompt />
        <Card className="w-full max-w-md border-slate-700 bg-slate-800/50 backdrop-blur">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mb-4">
              <Package className="h-8 w-8 text-amber-400" />
            </div>
            <CardTitle className="text-2xl text-white">Supplier Portal Login</CardTitle>
            <CardDescription className="text-slate-400">
              Enter your branch details to access suppliers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="restaurantName" className="text-slate-300 flex items-center gap-2">
                  <Store className="h-4 w-4" />
                  Restaurant Name
                </Label>
                {slug && restaurant ? (
                  <Input
                    id="restaurantName"
                    type="text"
                    value={restaurant.name}
                    disabled
                    className="bg-slate-700/50 border-slate-600 text-white"
                  />
                ) : (
                  <Input
                    id="restaurantName"
                    type="text"
                    placeholder="Enter restaurant name"
                    value={restaurantName}
                    onChange={(e) => setRestaurantName(e.target.value)}
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                    data-testid="input-restaurant-name"
                    autoComplete="off"
                  />
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300 flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                  data-testid="input-password"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                disabled={isLoading}
                data-testid="button-login"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  "Login to Suppliers"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
