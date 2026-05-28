"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Download, Smartphone, Share, MoreVertical, Plus } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

interface InstallAppButtonProps {
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg"
  className?: string
  showLabel?: boolean
  appName?: string
}

export function InstallAppButton({ 
  variant = "default", 
  size = "default",
  className = "",
  showLabel = true,
  appName = "App"
}: InstallAppButtonProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showIOSGuide, setShowIOSGuide] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Check if already installed as PWA
    const isInStandaloneMode = window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true
    setIsStandalone(isInStandaloneMode)

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    setIsIOS(iOS)

    // Listen for beforeinstallprompt event (Chrome/Edge/Android)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Chrome/Edge/Android - use native prompt
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === "accepted") {
        setDeferredPrompt(null)
      }
    } else if (isIOS) {
      // iOS - show manual instructions
      setShowIOSGuide(true)
    } else {
      // Fallback - show instructions
      setShowIOSGuide(true)
    }
  }

  // Don't show if already installed
  if (isStandalone) {
    return null
  }

  // Don't show if no install option available
  if (!deferredPrompt && !isIOS) {
    return null
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleInstallClick}
        className={className}
      >
        <Download className="w-4 h-4" />
        {showLabel && <span className="ml-2">Install {appName}</span>}
      </Button>

      <Dialog open={showIOSGuide} onOpenChange={setShowIOSGuide}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Install {appName}
            </DialogTitle>
            <DialogDescription>
              Add this app to your home screen for quick access
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {isIOS ? (
              <>
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">iPhone / iPad (Safari)</h4>
                  <div className="space-y-2">
                    <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold">1</span>
                      </div>
                      <div>
                        <p className="text-sm">Tap the <Share className="inline w-4 h-4 mx-1" /> Share button at the bottom of Safari</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold">2</span>
                      </div>
                      <div>
                        <p className="text-sm">Scroll down and tap <Plus className="inline w-4 h-4 mx-1" /> <strong>Add to Home Screen</strong></p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold">3</span>
                      </div>
                      <div>
                        <p className="text-sm">Tap <strong>Add</strong> to install the app</p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">Android (Chrome)</h4>
                  <div className="space-y-2">
                    <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold">1</span>
                      </div>
                      <div>
                        <p className="text-sm">Tap the <MoreVertical className="inline w-4 h-4 mx-1" /> menu button (3 dots) in Chrome</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold">2</span>
                      </div>
                      <div>
                        <p className="text-sm">Tap <strong>Install App</strong> or <strong>Add to Home Screen</strong></p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold">3</span>
                      </div>
                      <div>
                        <p className="text-sm">Tap <strong>Install</strong> to add to your home screen</p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="pt-2 text-center text-xs text-muted-foreground">
              Once installed, open the app from your home screen for the best experience
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
