import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { FoodSafetyRating } from "@/components/StarRating";

export default function DemoLogin() {
  const [userType, setUserType] = useState<"admin" | "branch">("branch");
  const [isLoading, setIsLoading] = useState(false);

  const handleDemoLogin = async () => {
    setIsLoading(true);
    
    try {
      // Use server-side demo authentication instead of localStorage
      const response = await fetch('/api/demo/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          userType,
          demoData: {
            id: userType === "admin" ? "demo-admin" : "demo-branch",
            email: userType === "admin" ? "admin@demo.com" : "branch@demo.com",
            firstName: userType === "admin" ? "Demo" : "Branch",
            lastName: userType === "admin" ? "Admin" : "Manager",
            role: userType,
            branchId: userType === "branch" ? "demo-branch-1" : null
          }
        })
      });

      if (response.ok) {
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        console.error('Demo login failed');
        // Fallback: redirect to main login if demo fails
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
      }
    } catch (error) {
      console.error('Demo login error:', error);
      // Fallback: redirect to main login if demo fails
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-dark-300">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-float"></div>
        <div className="absolute top-40 right-32 w-20 h-20 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full animate-float" style={{ animationDelay: "-2s" }}></div>
        <div className="absolute bottom-32 left-1/4 w-24 h-24 bg-gradient-to-r from-purple-600 to-pink-400 rounded-full animate-float" style={{ animationDelay: "-4s" }}></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-4">
        {/* Demo Features Showcase */}
        <Card className="glass-morphism border-0">
          <CardHeader>
            <CardTitle className="text-center text-2xl bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Food Safety Rating System
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 3D Cube with Logos */}
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-4 text-white">Interactive 3D Cube</h3>
              <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-2xl animate-float mx-auto">
                <span className="text-white text-3xl font-bold">FS</span>
              </div>
            </div>

            {/* Star Rating Demo */}
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-4 text-white">Food Safety Rating</h3>
              <FoodSafetyRating 
                rating={4} 
                interactive={false}
                className="max-w-sm mx-auto"
              />
            </div>

            {/* Features List */}
            <div className="text-left">
              <h3 className="text-lg font-semibold mb-3 text-white">Key Features</h3>
              <ul className="space-y-2 text-gray-300">
                <li>✓ Advanced PDF/Image Viewer (PDF, JPG, PNG, GIF, SVG)</li>
                <li>✓ Interactive 3D Cube with Food Safety Logos</li>
                <li>✓ Custom Star Rating System</li>
                <li>✓ Document Management & Upload</li>
                <li>✓ Branch Performance Analytics</li>
                <li>✓ Role-Based Access Control</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Demo Login */}
        <Card className="glass-morphism border-0">
          <CardHeader>
            <CardTitle className="text-center text-xl text-white">
              Demo Access
            </CardTitle>
            <p className="text-center text-gray-400">
              Test all features without registration
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* User Type Selector */}
            <div>
              <Label className="text-white mb-2 block">Select Demo Role</Label>
              <Select value={userType} onValueChange={(value: "admin" | "branch") => setUserType(value)}>
                <SelectTrigger className="bg-dark-200 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin Dashboard</SelectItem>
                  <SelectItem value="branch">Branch Dashboard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Demo Credentials Display */}
            <div className="space-y-3">
              <div className="p-3 bg-dark-200 rounded-lg">
                <Label className="text-gray-400 text-sm">Demo Email:</Label>
                <p className="text-white">{userType === "admin" ? "admin@demo.com" : "branch@demo.com"}</p>
              </div>
              <div className="p-3 bg-dark-200 rounded-lg">
                <Label className="text-gray-400 text-sm">Access Level:</Label>
                <p className="text-white">{userType === "admin" ? "Full Admin Access" : "Branch Manager Access"}</p>
              </div>
            </div>

            {/* Login Button */}
            <Button 
              onClick={handleDemoLogin}
              disabled={isLoading}
              className="w-full river-magic py-3 text-lg font-semibold"
            >
              {isLoading ? "Logging in..." : `Enter ${userType === "admin" ? "Admin" : "Branch"} Demo`}
            </Button>

            <div className="text-center">
              <p className="text-sm text-gray-400">
                No registration required • Full feature access
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}