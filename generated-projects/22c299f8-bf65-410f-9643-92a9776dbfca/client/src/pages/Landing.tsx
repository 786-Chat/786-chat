import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


export default function Landing() {
  const [loginType, setLoginType] = useState<"admin" | "branch">("admin");

  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-dark-300">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-float"></div>
        <div className="absolute top-40 right-32 w-20 h-20 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full animate-float" style={{ animationDelay: "-2s" }}></div>
        <div className="absolute bottom-32 left-1/4 w-24 h-24 bg-gradient-to-r from-purple-600 to-pink-400 rounded-full animate-float" style={{ animationDelay: "-4s" }}></div>
      </div>

      <Card className="glass-morphism w-full max-w-md mx-4 animate-fade-in border-0">
        <CardContent className="p-8">
          {/* Logo Section */}
          <div className="flex justify-center mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-2xl animate-float">
              <span className="text-white text-3xl font-bold">FS</span>
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
              Branch Dashboard
            </h1>
            <p className="text-gray-400">Professional Branch Management System</p>
          </div>

          {/* Login Type Selector */}
          <div className="flex bg-dark-200 rounded-lg p-1 mb-6">
            <Button
              variant="ghost"
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-300 ${
                loginType === "admin" 
                  ? "river-magic text-white" 
                  : "text-gray-400 hover:text-white"
              }`}
              onClick={() => setLoginType("admin")}
            >
              Admin Login
            </Button>
            <Button
              variant="ghost"
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-300 ${
                loginType === "branch" 
                  ? "river-magic text-white" 
                  : "text-gray-400 hover:text-white"
              }`}
              onClick={() => setLoginType("branch")}
            >
              Branch Login
            </Button>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Email Address</Label>
              <Input 
                type="email" 
                placeholder="admin@branchsystem.com" 
                className="bg-dark-200 border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Password</Label>
              <Input 
                type="password" 
                placeholder="••••••••" 
                className="bg-dark-200 border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled
              />
            </div>
            
            {loginType === "branch" && (
              <div className="space-y-2">
                <Label className="text-gray-300">Select Branch</Label>
                <Select disabled>
                  <SelectTrigger className="bg-dark-200 border-gray-600 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                    <SelectValue placeholder="Select your branch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="downtown">Downtown Branch</SelectItem>
                    <SelectItem value="westside">Westside Branch</SelectItem>
                    <SelectItem value="northpoint">Northpoint Branch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <Button 
              onClick={handleLogin}
              className="w-full py-3 px-4 river-magic font-semibold text-white transition-all duration-300 hover:shadow-lg hover:scale-105 transform"
            >
              Sign In with Replit
            </Button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              Secure authentication powered by Replit
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
