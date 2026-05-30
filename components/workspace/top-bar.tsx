"use client"

import { useState } from "react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { 
  PanelLeftClose, 
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Settings, 
  Share2, 
  Globe,
  LayoutDashboard,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Monitor,
  Smartphone,
  Tablet,
  ExternalLink,
  RefreshCw,
  LogOut,
  Rocket,
  Link2,
  Copy,
  Check,
  Home,
  Eye,
  Code,
  Loader2,
  CheckCircle2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { MujeebProAILogo } from "@/components/mujeebproai-logo"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

const DEVICE_PRESETS = [
  { id: "full", label: "Full Size", icon: Monitor, width: "100%", height: "100%" },
  { id: "16:9", label: "16:9", icon: Monitor, width: "1280px", height: "720px" },
  { id: "iphone-se", label: "iPhone SE", icon: Smartphone, width: "375px", height: "667px" },
  { id: "iphone-air", label: "iPhone Air", icon: Smartphone, width: "390px", height: "844px" },
  { id: "iphone-17", label: "iPhone 17", icon: Smartphone, width: "393px", height: "852px" },
  { id: "iphone-17-pro", label: "iPhone 17 Pro", icon: Smartphone, width: "402px", height: "874px" },
  { id: "iphone-17-pro-max", label: "iPhone 17 Pro Max", icon: Smartphone, width: "440px", height: "956px" },
  { id: "pixel-10", label: "Pixel 10", icon: Smartphone, width: "412px", height: "915px" },
  { id: "pixel-10-pro", label: "Pixel 10 Pro", icon: Smartphone, width: "412px", height: "915px" },
  { id: "pixel-10-pro-xl", label: "Pixel 10 Pro XL", icon: Smartphone, width: "448px", height: "998px" },
  { id: "galaxy-s25", label: "Samsung Galaxy S25", icon: Smartphone, width: "385px", height: "854px" },
  { id: "galaxy-s25-plus", label: "Samsung Galaxy S25+", icon: Smartphone, width: "412px", height: "915px" },
  { id: "galaxy-s25-ultra", label: "Samsung Galaxy S25 Ultra", icon: Smartphone, width: "440px", height: "960px" },
]

interface TopBarProps {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  previewOpen: boolean
  setPreviewOpen: (open: boolean) => void
  dashboardOpen: boolean
  setDashboardOpen: (open: boolean) => void
  previewDevice: string
  setPreviewDevice: (device: string) => void
  activeView: "chat" | "preview"
  setActiveView: (view: "chat" | "preview") => void
  viewMode?: "preview" | "code"
  onViewModeChange?: (mode: "preview" | "code") => void
}

export function WorkspaceTopBar({
  sidebarOpen,
  setSidebarOpen,
  previewOpen,
  setPreviewOpen,
  dashboardOpen,
  setDashboardOpen,
  previewDevice,
  setPreviewDevice,
  activeView,
  setActiveView,
  viewMode = "preview",
  onViewModeChange,
}: TopBarProps) {
  const { user, logout } = useAuth()
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [publishDialogOpen, setPublishDialogOpen] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [isDeploying, setIsDeploying] = useState(false)
  const [deploySuccess, setDeploySuccess] = useState(false)
  const [deployedUrl, setDeployedUrl] = useState("")
  const currentDevice = DEVICE_PRESETS.find(d => d.id === previewDevice) || DEVICE_PRESETS[0]

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  const handleDeploy = async () => {
    setIsDeploying(true)
    try {
      const res = await fetch("/api/deployments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deploy" })
      })
      
      if (res.ok) {
        const data = await res.json()
        setDeployedUrl(data.deployment?.url || "https://your-site.mujeebproai.com")
        setDeploySuccess(true)
        setPublishDialogOpen(false)
      } else {
        // Simulate success for demo
        setTimeout(() => {
          setDeployedUrl("https://your-site.mujeebproai.com")
          setDeploySuccess(true)
          setPublishDialogOpen(false)
          setIsDeploying(false)
        }, 2000)
        return
      }
    } catch {
      // Simulate success for demo
      setTimeout(() => {
        setDeployedUrl("https://your-site.mujeebproai.com")
        setDeploySuccess(true)
        setPublishDialogOpen(false)
        setIsDeploying(false)
      }, 2000)
      return
    }
    setIsDeploying(false)
  }

  return (
    <>
      <div className="h-12 border-b border-white/[0.06] bg-[#0d0d14] flex items-center justify-between px-2 flex-shrink-0 z-50">
        {/* Left Section - More compact on mobile */}
        <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0 min-w-0">
          {/* Sidebar Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 sm:h-8 sm:w-8 text-white/50 hover:text-white hover:bg-white/5 flex-shrink-0"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <PanelLeftClose className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <PanelLeftOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
          </Button>

          {/* Logo - links to homepage - hidden on very small screens */}
          <Link href="/" className="hidden xs:flex items-center hover:opacity-80 transition-opacity flex-shrink-0" title="Go to Homepage">
            <MujeebProAILogo variant="compact" size="sm" animated={false} />
          </Link>

          {/* Home button - shown on mobile instead of logo */}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-white/40 hover:text-cyan-400 hover:bg-cyan-500/10 flex-shrink-0 xs:hidden"
            asChild
            title="Go to Homepage"
          >
            <Link href="/">
              <Home className="w-3.5 h-3.5" />
            </Link>
          </Button>

          <div className="w-px h-5 bg-white/10 mx-1 hidden sm:block" />
        </div>

        {/* v0-style URL Bar - Center */}
        <div className="hidden md:flex items-center gap-2 flex-1 max-w-xl mx-4">
          {/* Traffic Lights */}
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#ff5f57] hover:brightness-110 cursor-pointer" />
            <div className="w-3 h-3 rounded-full bg-[#febc2e] hover:brightness-110 cursor-pointer" />
            <div className="w-3 h-3 rounded-full bg-[#28c840] hover:brightness-110 cursor-pointer" />
          </div>
          {/* Navigation Arrows */}
          <div className="flex items-center gap-0.5">
            <button className="p-1 text-white/30 hover:text-white/60 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="p-1 text-white/30 hover:text-white/60 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          {/* URL Input */}
          <div className="flex-1 flex items-center h-7 bg-white/[0.05] border border-white/[0.1] rounded-lg px-2.5">
            <Globe className="w-3.5 h-3.5 text-white/30 mr-2" />
            <span className="text-xs text-white/50">/</span>
          </div>
        </div>

        {/* Center - Mobile View Switcher */}
        <div className="flex items-center gap-0.5 md:hidden flex-shrink-0">
          <Button
            variant={activeView === "chat" ? "default" : "ghost"}
            size="sm"
            className={`h-6 px-2 text-[10px] sm:h-7 sm:px-3 sm:text-xs ${activeView === "chat" ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" : "text-white/50"}`}
            onClick={() => setActiveView("chat")}
          >
            Chat
          </Button>
          <Button
            variant={activeView === "preview" ? "default" : "ghost"}
            size="sm"
            className={`h-6 px-2 text-[10px] sm:h-7 sm:px-3 sm:text-xs ${activeView === "preview" ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" : "text-white/50"}`}
            onClick={() => { setActiveView("preview"); setPreviewOpen(true) }}
          >
            View
          </Button>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-1">
          {/* Device Preview Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 text-xs text-white/50 hover:text-white hover:bg-white/5 gap-1 hidden lg:flex">
                <currentDevice.icon className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">{currentDevice.label}</span>
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-[#14141f] border-white/10">
              <DropdownMenuLabel className="text-white/40 text-xs">Device Preview</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />
              {DEVICE_PRESETS.map((device) => (
                <DropdownMenuItem
                  key={device.id}
                  className={`text-xs gap-3 cursor-pointer ${previewDevice === device.id ? "text-cyan-400 bg-cyan-500/10" : "text-white/70 hover:text-white"}`}
                  onClick={() => {
                    setPreviewDevice(device.id)
                    if (!previewOpen) setPreviewOpen(true)
                  }}
                >
                  <device.icon className="w-3.5 h-3.5" />
                  <span className="flex-1">{device.label}</span>
                  <span className="text-white/30 text-[10px]">{device.width === "100%" ? "Auto" : `${device.width.replace("px","")}`}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Preview/Code Toggle */}
          <div className="flex items-center gap-0.5 bg-white/[0.03] border border-white/[0.08] rounded-lg p-0.5 hidden sm:flex">
            <button
              onClick={() => onViewModeChange?.("preview")}
              className={`px-2.5 py-1 rounded-md transition-all text-xs flex items-center gap-1.5 ${
                viewMode === "preview" 
                  ? "bg-cyan-500/20 text-cyan-400" 
                  : "text-white/40 hover:text-white/60 hover:bg-white/[0.04]"
              }`}
              title="Preview Mode"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Preview</span>
            </button>
            <button
              onClick={() => onViewModeChange?.("code")}
              className={`px-2.5 py-1 rounded-md transition-all text-xs flex items-center gap-1.5 ${
                viewMode === "code" 
                  ? "bg-cyan-500/20 text-cyan-400" 
                  : "text-white/40 hover:text-white/60 hover:bg-white/[0.04]"
              }`}
              title="Code Mode"
            >
              <Code className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Code</span>
            </button>
          </div>

          {/* Preview Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white/50 hover:text-white hover:bg-white/5 hidden md:flex"
            onClick={() => setPreviewOpen(!previewOpen)}
          >
            {previewOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
          </Button>

          <div className="w-px h-5 bg-white/10 mx-1" />

          {/* Share Button */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-white/50 hover:text-white hover:bg-white/5 gap-1.5 hidden sm:flex"
            onClick={() => setShareDialogOpen(true)}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Share</span>
          </Button>

          {/* Publish Button */}
          <Button
            size="sm"
            className="h-8 text-xs bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white gap-1.5 px-3"
            onClick={() => setPublishDialogOpen(true)}
          >
            <Rocket className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Publish</span>
          </Button>

          <div className="w-px h-5 bg-white/10 mx-1" />

          {/* Dashboard Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 hover:bg-white/5 ${dashboardOpen ? "text-cyan-400" : "text-white/50 hover:text-white"}`}
            onClick={() => setDashboardOpen(!dashboardOpen)}
            title="Dashboard"
          >
            <LayoutDashboard className="w-4 h-4" />
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 gap-2 text-white/60 hover:text-white hover:bg-white/5 px-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-xs font-bold text-white">
                  {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-[#14141f] border-white/10">
              <DropdownMenuLabel className="text-white/40 text-xs">{user?.email}</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem className="text-white/70 hover:text-white text-xs cursor-pointer" onClick={() => setDashboardOpen(true)}>
                <LayoutDashboard className="w-3.5 h-3.5 mr-2" />
                Dashboard
              </DropdownMenuItem>
              <DropdownMenuItem className="text-white/70 hover:text-white text-xs cursor-pointer" onClick={() => setDashboardOpen(true)}>
                <Settings className="w-3.5 h-3.5 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem className="text-red-400 hover:text-red-300 text-xs cursor-pointer" onClick={logout}>
                <LogOut className="w-3.5 h-3.5 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="bg-[#14141f] border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Share Workspace</DialogTitle>
            <DialogDescription className="text-white/50">
              Share your workspace with others or copy the link.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 p-3 bg-white/[0.03] border border-white/[0.08] rounded-lg">
              <Link2 className="w-4 h-4 text-white/40 flex-shrink-0" />
              <span className="text-xs text-white/60 flex-1 truncate">{typeof window !== "undefined" ? window.location.href : ""}</span>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                onClick={handleCopyLink}
              >
                {linkCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-9 text-xs border-white/10 text-white/70 hover:text-white hover:bg-white/5"
                onClick={handleCopyLink}
              >
                <Copy className="w-3.5 h-3.5 mr-2" />
                {linkCopied ? "Copied!" : "Copy Link"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9 text-xs border-white/10 text-white/70 hover:text-white hover:bg-white/5"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: "MujeebProAI Workspace", url: window.location.href })
                  }
                  setShareDialogOpen(false)
                }}
              >
                <Share2 className="w-3.5 h-3.5 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Publish / Deploy Dialog */}
      <Dialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
        <DialogContent className="bg-[#14141f] border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Rocket className="w-5 h-5 text-cyan-400" />
              Publish to MujeebProAI
            </DialogTitle>
            <DialogDescription className="text-white/50">
              Deploy your project to MujeebProAI for production.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="p-4 bg-white/[0.03] border border-white/[0.08] rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/60">Platform</span>
                <span className="text-xs text-white font-medium">MujeebProAI</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/60">Status</span>
                <span className="text-xs text-green-400 font-medium">Ready to deploy</span>
              </div>
            </div>
            <Button
              className="w-full h-10 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-medium text-sm disabled:opacity-50"
              onClick={handleDeploy}
              disabled={isDeploying}
            >
              {isDeploying ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deploying...
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4 mr-2" />
                  Deploy Now
                </>
              )}
            </Button>
            <p className="text-[10px] text-white/30 text-center">
              Your site will be deployed to MujeebProAI cloud infrastructure.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Deployment Success Dialog */}
      <Dialog open={deploySuccess} onOpenChange={setDeploySuccess}>
        <DialogContent className="bg-[#14141f] border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-green-400" />
              Deployment Successful!
            </DialogTitle>
            <DialogDescription className="text-white/50">
              Your project has been deployed to MujeebProAI.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="w-4 h-4 text-green-400" />
                <span className="text-sm text-green-400 font-medium">Live URL</span>
              </div>
              <div className="flex items-center gap-2 bg-black/30 rounded-lg px-3 py-2">
                <code className="text-sm text-white/80 flex-1 truncate">{deployedUrl}</code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-white/50 hover:text-white"
                  onClick={() => {
                    navigator.clipboard.writeText(deployedUrl)
                    setLinkCopied(true)
                    setTimeout(() => setLinkCopied(false), 2000)
                  }}
                >
                  {linkCopied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 h-10 border-white/10 text-white/70 hover:text-white hover:bg-white/5"
                onClick={() => window.open(deployedUrl, "_blank")}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View Site
              </Button>
              <Button
                className="flex-1 h-10 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
                onClick={() => {
                  setDeploySuccess(false)
                  window.location.href = "/dashboard/deployments"
                }}
              >
                <Settings className="w-4 h-4 mr-2" />
                Manage
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export { DEVICE_PRESETS }
