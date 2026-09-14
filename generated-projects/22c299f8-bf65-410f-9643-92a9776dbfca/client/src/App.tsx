import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import DemoLogin from "@/pages/DemoLogin";
import AdminLogin from "@/pages/AdminLogin";
import BranchLogin from "@/pages/BranchLogin";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminDashboardNew from "@/pages/AdminDashboardNew";
import BranchDashboard from "@/pages/BranchDashboard";
import FileManager from "@/pages/FileManager";
import AdminDemo from "@/pages/AdminDemo";
import BranchDemo from "@/pages/BranchDemo";
import BranchChartPage from "@/pages/BranchChartPage";
import LogoTest from "@/pages/LogoTest";
import PDFBuilder from "@/pages/PDFBuilder";

import NotFound from "@/pages/not-found";
import InstallPrompt from "@/components/InstallPrompt";
import InstallGuide from "@/pages/InstallGuide";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    // PWA Install prompt handling
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    // Dynamic favicon based on current section
    const updateFavicon = () => {
      const path = window.location.pathname;
      const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
      
      if (path.includes('/admin')) {
        if (link) link.href = 'https://0qshtsle6wr4hqxp.public.blob.vercel-storage.com/imports/1789087864601-135a0bf6-8eca-46a5-9ccf-7315e717be73-admin-icon-7v1NVQASIAgMWcqtZAQFKPpmr28voZ.svg';
        document.title = 'Admin Portal - Food Safety Rating';
      } else if (path.includes('/branch')) {
        if (link) link.href = 'https://0qshtsle6wr4hqxp.public.blob.vercel-storage.com/imports/1789087865071-07190d5c-bdf8-46a8-b4f7-2470436ed4c2-branch-icon-J46RXv22SaDZxG9d8dH2xv5S2woqTR.svg';
        document.title = 'Branch Dashboard - Food Safety Rating';
      } else {
        if (link) link.href = 'https://0qshtsle6wr4hqxp.public.blob.vercel-storage.com/imports/1789087863695-14c77f90-85b3-4985-8538-2991e7c9a805-favicon-NGE4aUsITdJLCDZt1qwI76fj0bhsV3.svg';
        document.title = 'Food Safety Rating - Pest Control Management';
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('popstate', updateFavicon);
    updateFavicon();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('popstate', updateFavicon);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

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
      
      <Switch>
      {/* Public Routes */}
      <Route path="/admin" component={AdminLogin} />
      <Route path="/admin-login" component={AdminLogin} />
      <Route path="/branch" component={BranchLogin} />
      <Route path="/branch-login" component={BranchLogin} />
      <Route path="/branch-dashboard" component={BranchDashboard} />
      <Route path="/branch-charts" component={BranchChartPage} />
      <Route path="/chart" component={BranchChartPage} />
      <Route path="/install" component={InstallGuide} />
      
      {/* Main Routes */}
      <Route path="/" component={BranchLogin} />
      
      {/* Admin Routes */}
      <Route path="/admin-dashboard" component={AdminDashboard} />
      <Route path="/pdf-builder" component={PDFBuilder} />
      <Route path="/file-manager" component={FileManager} />
      <Route path="/old-admin" component={AdminDashboardNew} />
      <Route path="/old-branch" component={BranchDashboard} />
      <Route path="/demo" component={DemoLogin} />
      
      {/* Demo Routes */}
      <Route path="/admin-demo" component={AdminDemo} />
      <Route path="/branch-demo" component={BranchDemo} />
      <Route path="/logo-test" component={LogoTest} />
      
      <Route component={NotFound} />
    </Switch>
    
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
