import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { useEffect, useState } from "react";
import DemoLogin from "@/pages/DemoLogin";
import AdminLogin from "@/pages/AdminLogin";
import BranchLogin from "@/pages/BranchLogin";
import AdminDashboard from "@/pages/AdminDashboard";
import BranchDashboard from "@/pages/BranchDashboard";
import FileManager from "@/pages/FileManager";
import AdminDemo from "@/pages/AdminDemo";
import BranchDemo from "@/pages/BranchDemo";
import BranchChartPage from "@/pages/BranchChartPage";
import LogoTest from "@/pages/LogoTest";
import PDFBuilder from "@/pages/PDFBuilder";

import NotFound from "@/pages/not-found";
import InstallPrompt from "@/components/InstallPrompt";
import GlobalIotAlarmListener from "@/components/GlobalIotAlarmListener";
import InstallGuide from "@/pages/InstallGuide";

function AdminLoginRedirect() {
  useEffect(() => {
    window.location.replace("/admin-login");
  }, []);
  return null;
}

function BranchLoginRedirect() {
  useEffect(() => {
    window.location.replace("/branch-login");
  }, []);
  return null;
}

function AdminDashboardRedirect() {
  useEffect(() => {
    window.location.replace("/admin-dashboard");
  }, []);
  return null;
}

function BranchDashboardRedirect() {
  useEffect(() => {
    window.location.replace("/branch-dashboard");
  }, []);
  return null;
}

function Router() {
  const [currentPath] = useLocation();
  const normalizedPath = currentPath.replace(/\/+$/, "") || "/";
  const directLoginPage =
    normalizedPath === "/admin-login"
      ? <AdminLogin />
      : normalizedPath === "/branch-login" || normalizedPath === "/"
        ? <BranchLogin />
        : null;

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    // PWA Install prompt handling
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Keep one canonical Food Safety favicon from client/index.html.
  // Only the browser-tab title changes by route.
  useEffect(() => {
    if (normalizedPath === "/branch-login" || normalizedPath === "/") {
      document.title = "Branch Login - Food Safety Rating";
    } else if (normalizedPath.startsWith("/branch")) {
      document.title = "Branch Dashboard - Food Safety Rating";
    } else if (normalizedPath === "/admin-login") {
      document.title = "Admin Login - Food Safety Rating";
    } else if (normalizedPath.startsWith("/admin")) {
      document.title = "Admin Portal - Food Safety Rating";
    } else {
      document.title = "Food Safety Rating - Pest Control Management";
    }
  }, [normalizedPath]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    }
  };

  return (
    <>
      {/* PWA Install Prompt */}
      {showInstallPrompt && (
        <div className="fixed top-4 right-4 z-50 bg-gradient-to-r from-yellow-400 to-green-400 text-black p-4 rounded-lg shadow-lg max-w-sm">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="font-bold text-sm">Install App</h3>
              <p className="text-xs">Add to home screen for quick access</p>
            </div>
            <div className="flex gap-2 ml-3">
              <button
                onClick={handleInstallClick}
                className="bg-black text-white px-3 py-1 rounded text-xs font-medium hover:bg-gray-800"
              >
                Install
              </button>
              <button
                onClick={() => setShowInstallPrompt(false)}
                className="text-black px-2 py-1 rounded text-xs"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}
      
      <GlobalIotAlarmListener />
      {directLoginPage ?? (
      <Switch>
      {/* Legacy login aliases always resolve to the canonical routes */}
      <Route path="/admin" component={AdminLoginRedirect} />
      <Route path="/branch" component={BranchLoginRedirect} />

      {/* Branch routes */}
      <Route path="/branch-dashboard" component={BranchDashboard} />
      <Route path="/branch-charts" component={BranchChartPage} />
      <Route path="/chart" component={BranchChartPage} />
      <Route path="/install" component={InstallGuide} />
      
      {/* Main route */}
      <Route path="/" component={BranchLogin} />
      
      {/* Admin routes */}
      <Route path="/admin-dashboard" component={AdminDashboard} />
      <Route path="/pdf-builder" component={PDFBuilder} />
      <Route path="/file-manager" component={FileManager} />

      {/* Legacy dashboard aliases */}
      <Route path="/old-admin" component={AdminDashboardRedirect} />
      <Route path="/old-branch" component={BranchDashboardRedirect} />
      <Route path="/demo" component={DemoLogin} />
      
      {/* Demo Routes */}
      <Route path="/admin-demo" component={AdminDemo} />
      <Route path="/branch-demo" component={BranchDemo} />
      <Route path="/logo-test" component={LogoTest} />
      
      <Route component={NotFound} />
    </Switch>
      )}
    
    {/* Install Prompt for PWA */}
    <InstallPrompt />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
