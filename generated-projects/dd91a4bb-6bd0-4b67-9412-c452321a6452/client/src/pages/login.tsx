import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ShieldCheck, ArrowRight, Loader2, AlertCircle, Mail, Lock } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [_, setLocation] = useLocation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Validate credentials
    if (email === "mujeeb@job4u.com" && (password === "smrptt77" || password === "Ayesha123!")) {
      // Store login state
      localStorage.setItem("adminLoggedIn", "true");
      localStorage.setItem("adminEmail", email);
      
      setIsLoading(false);
      setLocation("/portal");
    } else {
      setIsLoading(false);
      setError("Invalid email or password. Please try again.");
    }
  };

  return (
    <div className="min-h-screen premium-gradient-bg relative overflow-hidden flex items-center justify-center p-4">
      {/* Animated Gradient Mesh Background */}
      <div className="gradient-mesh" />

      <div className="w-full max-w-md relative z-20">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 mb-4 shadow-lg">
            <ShieldCheck className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">link24 Admin</h1>
          <p className="text-gray-400">Sign in to access your dashboard</p>
        </div>

        <Card className="border-gray-700/50 bg-gray-800/50 backdrop-blur-xl shadow-2xl">
          <CardHeader>
            <CardTitle className="text-white text-xl">Sign In</CardTitle>
            <CardDescription className="text-gray-400">Enter your credentials to continue</CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 flex items-center gap-2 text-red-400">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                  <Input 
                    id="email" 
                    placeholder="Enter your email" 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoCapitalize="none" 
                    autoComplete="email" 
                    autoCorrect="off"
                    required
                    className="pl-10 h-11 bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-500"
                    data-testid="input-admin-email"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-gray-300">Password</Label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                  <Input 
                    id="password" 
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-10 h-11 bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-500"
                    data-testid="input-admin-password"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="remember" className="border-gray-500 data-[state=checked]:bg-purple-600" />
                <Label htmlFor="remember" className="text-sm font-normal text-gray-400">Remember me</Label>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4 pt-4">
              <Button 
                className="w-full h-11 text-lg font-bold bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 shadow-lg" 
                disabled={isLoading}
                data-testid="button-admin-login"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...
                  </>
                ) : (
                  <>
                    Sign In <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

      </div>
    </div>
  );
}
