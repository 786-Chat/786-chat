import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Download, Share, Plus, Smartphone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type SectionKey = "customer" | "epos" | "kitchen" | "waiter" | "driver" | "suppliers" | "finances";

const SECTION_CONFIG: Record<SectionKey, { appName: string; themeColor: string; icon: string; gradient: string }> = {
  customer: { appName: "Link24", themeColor: "#8b5cf6", icon: "24", gradient: "linear-gradient(135deg, #8b5cf6 0%, #3b82f6 33%, #10b981 66%, #eab308 100%)" },
  epos: { appName: "Link24-EPOS", themeColor: "#06b6d4", icon: "POS", gradient: "linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)" },
  kitchen: { appName: "Link24-Kitchen", themeColor: "#f97316", icon: "KDS", gradient: "linear-gradient(135deg, #f97316 0%, #dc2626 100%)" },
  waiter: { appName: "Link24-Waiter", themeColor: "#1e3a5f", icon: "🍽️", gradient: "linear-gradient(135deg, #1e3a5f 0%, #3b82f6 100%)" },
  driver: { appName: "Link24-Driver", themeColor: "#f59e0b", icon: "🚗", gradient: "linear-gradient(135deg, #f59e0b 0%, #f97316 100%)" },
  suppliers: { appName: "Link24-Suppliers", themeColor: "#8b5cf6", icon: "📦", gradient: "linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)" },
  finances: { appName: "Link24-Finances", themeColor: "#10b981", icon: "💰", gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)" },
};

export interface InstallPromptProps {
  restaurantName?: string;
  themeColor?: string;
  appName?: string;
  section?: SectionKey;
  logoUrl?: string;
}

export function InstallPrompt({ restaurantName, themeColor, appName, section = "customer", logoUrl }: InstallPromptProps) {
  const config = SECTION_CONFIG[section];
  const resolvedThemeColor = themeColor || config.themeColor;
  const resolvedAppName = restaurantName || appName || config.appName;
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isMac = /Macintosh/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    setIsIOS(isIOSDevice || (isMac && isSafari));

    const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                       (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    const wasDismissed = localStorage.getItem('link24-menu-install-dismissed');
    if (wasDismissed) {
      const dismissedTime = parseInt(wasDismissed, 10);
      if (Date.now() - dismissedTime < 24 * 60 * 60 * 1000) {
        setDismissed(true);
      }
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!dismissed && !standalone) {
        setTimeout(() => setShowPrompt(true), 2000);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    if (!standalone && !dismissed && isIOSDevice) {
      setTimeout(() => setShowPrompt(true), 3000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, [dismissed]);

  useEffect(() => {
    if (!showPrompt) return;
    const autoHideTimer = setTimeout(() => {
      setShowPrompt(false);
    }, 15000);
    return () => clearTimeout(autoHideTimer);
  }, [showPrompt]);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem('link24-menu-install-dismissed', Date.now().toString());
  };

  if (isStandalone || !showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm"
      >
        <div 
          className="rounded-2xl p-4 shadow-2xl border border-blue-500/30"
          style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            boxShadow: `0 20px 60px ${resolvedThemeColor}30, 0 0 40px ${resolvedThemeColor}10`
          }}
        >
          <button 
            onClick={handleDismiss}
            className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="h-4 w-4 text-slate-400" />
          </button>

          <div className="flex items-start gap-3">
            <div 
              className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
              style={{ 
                background: config.gradient,
                boxShadow: `0 8px 20px ${resolvedThemeColor}40`
              }}
            >
              {logoUrl ? (
                <img src={logoUrl} alt={resolvedAppName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-bold text-xl">{config.icon}</span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-white text-base mb-1">
                Add {resolvedAppName}
              </h3>
              <p className="text-slate-400 text-xs mb-3 leading-relaxed">
                {isIOS 
                  ? `Tap the Share button then "Add to Home Screen" for quick access`
                  : `Install for quick access anytime`
                }
              </p>

              {isIOS ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-blue-400 text-xs font-medium bg-blue-500/10 rounded-lg p-2">
                    <Share className="h-5 w-5 flex-shrink-0" />
                    <span>Tap the <strong>Share</strong> button at the bottom of Safari, then scroll down and tap <strong>"Add to Home Screen"</strong></span>
                  </div>
                </div>
              ) : deferredPrompt ? (
                <Button
                  onClick={handleInstall}
                  className="w-full gap-2 font-semibold text-white"
                  style={{ background: config.gradient }}
                  data-testid="button-install-app"
                >
                  <Download className="h-4 w-4" />
                  Add to Home Screen
                </Button>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-blue-400 text-xs font-medium bg-blue-500/10 rounded-lg p-2">
                    <Smartphone className="h-5 w-5 flex-shrink-0" />
                    <span>Tap the <strong>⋮ menu</strong> in your browser, then tap <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong></span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
