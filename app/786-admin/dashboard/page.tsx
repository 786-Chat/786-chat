"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Bell,
  Bot,
  Box,
  ChevronRight,
  Code2,
  FileCode2,
  Globe2,
  HelpCircle,
  Home,
  ImageIcon,
  Import,
  Laptop,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Monitor,
  Moon,
  Palette,
  Plus,
  Rocket,
  Search,
  Settings,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Sun,
  Tablet,
  Wand2,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/contexts/auth-context"

const ADMIN_EMAIL = "mujeeb@job4u.com"

type ThemeMode = "light" | "dark" | "system"
type DeviceMode = "Desktop" | "Tablet" | "Mobile"

const navItems = [
  { label: "Home", icon: Home, active: true },
  { label: "Projects", icon: Box },
  { label: "Published Projects", icon: Globe2 },
  { label: "Admin Security", icon: ShieldCheck },
  { label: "Integrations", icon: Zap },
]

const quickTypes = [
  { label: "Website", icon: LayoutDashboard },
  { label: "AI App", icon: Bot },
  { label: "Design", icon: Wand2 },
  { label: "API", icon: Code2 },
  { label: "Deploy", icon: Rocket },
]

const deviceLinks: { label: DeviceMode; icon: typeof Monitor }[] = [
  { label: "Desktop", icon: Monitor },
  { label: "Tablet", icon: Tablet },
  { label: "Mobile", icon: Smartphone },
]

const themeOptions: { label: string; value: ThemeMode; icon: typeof Sun }[] = [
  { label: "Light", value: "light", icon: Sun },
  { label: "Dark", value: "dark", icon: Moon },
  { label: "System", value: "system", icon: Laptop },
]

const wallpaperSlides = [
  {
    title: "Nordic Coast",
    subtitle: "VIP wallpaper mode",
    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=2200&q=80",
    sidebar:
      "border-cyan-200/25 bg-gradient-to-b from-cyan-950/86 via-slate-950/84 to-blue-950/86 text-white shadow-[10px_0_55px_rgba(34,211,238,0.16)]",
  },
  {
    title: "Mountain Glass",
    subtitle: "Animated dashboard background",
    image:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=2200&q=80",
    sidebar:
      "border-emerald-200/25 bg-gradient-to-b from-emerald-950/86 via-slate-950/84 to-teal-950/86 text-white shadow-[10px_0_55px_rgba(52,211,153,0.16)]",
  },
  {
    title: "Neon City",
    subtitle: "Premium 786.Chat system style",
    image:
      "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=2200&q=80",
    sidebar:
      "border-fuchsia-200/25 bg-gradient-to-b from-fuchsia-950/86 via-slate-950/84 to-violet-950/86 text-white shadow-[10px_0_55px_rgba(217,70,239,0.16)]",
  },
  {
    title: "Ocean Light",
    subtitle: "PNG/JPG style image slider",
    image:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2200&q=80",
    sidebar:
      "border-sky-200/25 bg-gradient-to-b from-sky-950/86 via-slate-950/84 to-cyan-950/86 text-white shadow-[10px_0_55px_rgba(56,189,248,0.16)]",
  },
]

const recentProjects = [
  {
    name: "786 Admin Portal",
    status: "Design draft",
    age: "today",
    icon: LayoutDashboard,
    glow: "from-cyan-300/50 to-blue-500/25",
  },
  {
    name: "MujeebProAI Safe Copy",
    status: "Protected",
    age: "old project safe",
    icon: LockKeyhole,
    glow: "from-emerald-300/50 to-cyan-500/25",
  },
  {
    name: "Customer Builder System",
    status: "Phase later",
    age: "planned",
    icon: FileCode2,
    glow: "from-violet-300/50 to-fuchsia-500/25",
  },
]

export default function SevenEightSixAdminDashboardPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [prompt, setPrompt] = useState("")
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [themeMenuOpen, setThemeMenuOpen] = useState(false)
  const [themeMode, setThemeMode] = useState<ThemeMode>("dark")
  const [deviceMenuOpen, setDeviceMenuOpen] = useState(false)
  const [activeDevice, setActiveDevice] = useState<DeviceMode>("Desktop")
  const [activeWallpaper, setActiveWallpaper] = useState(0)

  const isAdmin = useMemo(
    () => user?.email?.toLowerCase().trim() === ADMIN_EMAIL,
    [user]
  )

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.replace("/786-admin/login")
    }
  }, [isAdmin, isLoading, router])

  useEffect(() => {
    if (themeMode !== "system") return

    const timer = window.setInterval(() => {
      setActiveWallpaper((current) => (current + 1) % wallpaperSlides.length)
    }, 5500)

    return () => window.clearInterval(timer)
  }, [themeMode])

  const isWallpaperMode = themeMode === "system"
  const isDarkTheme = themeMode === "dark" || isWallpaperMode
  const activeThemeLabel = themeMode === "system" ? "System" : isDarkTheme ? "Dark" : "Light"
  const activeDeviceInfo = deviceLinks.find((device) => device.label === activeDevice) || deviceLinks[0]
  const ActiveDeviceIcon = activeDeviceInfo.icon
  const currentWallpaper = wallpaperSlides[activeWallpaper]

  const pageClass = isWallpaperMode
    ? "bg-[#050713] text-white"
    : isDarkTheme
      ? "bg-[#050713] text-white"
      : "bg-[#f5f8ff] text-slate-950"

  const glowClass = isDarkTheme
    ? "bg-[radial-gradient(circle_at_30%_0%,rgba(0,255,255,0.17),transparent_28%),radial-gradient(circle_at_80%_18%,rgba(125,92,255,0.18),transparent_30%),radial-gradient(circle_at_50%_100%,rgba(0,160,255,0.08),transparent_34%)]"
    : "bg-[radial-gradient(circle_at_28%_0%,rgba(14,165,233,0.18),transparent_28%),radial-gradient(circle_at_80%_18%,rgba(125,92,255,0.12),transparent_30%),radial-gradient(circle_at_50%_100%,rgba(34,197,94,0.08),transparent_34%)]"

  const sidebarClass = isWallpaperMode
    ? currentWallpaper.sidebar
    : isDarkTheme
      ? "border-white/10 bg-[#0b1020]/82 text-white"
      : "border-slate-200 bg-white/90 text-slate-950 shadow-[8px_0_40px_rgba(15,23,42,0.05)]"

  const cardClass = isDarkTheme
    ? "border-white/10 bg-white/[0.065] text-white shadow-[0_0_45px_rgba(0,0,0,0.25)]"
    : "border-slate-200 bg-white text-slate-950 shadow-[0_14px_45px_rgba(15,23,42,0.08)]"

  const softCardClass = isDarkTheme
    ? "border-cyan-300/20 bg-cyan-300/10 text-cyan-100"
    : "border-cyan-200 bg-cyan-50 text-cyan-900"

  const mutedTextClass = isDarkTheme ? "text-slate-300" : "text-slate-600"
  const strongTextClass = isDarkTheme ? "text-white" : "text-slate-950"
  const inputTextClass = isDarkTheme ? "text-white placeholder:text-slate-400" : "text-slate-950 placeholder:text-slate-400"
  const menuClass = isDarkTheme
    ? "border-white/10 bg-[#101421]/95 text-slate-200 shadow-[0_18px_50px_rgba(0,0,0,0.30)]"
    : "border-slate-200 bg-white text-slate-800 shadow-[0_18px_50px_rgba(15,23,42,0.14)]"

  if (isLoading || !isAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050713] text-white">
        <div className="flex items-center gap-3 rounded-2xl border border-cyan-300/20 bg-white/[0.04] px-5 py-4 text-sm text-cyan-100 shadow-[0_0_40px_rgba(0,255,255,0.14)]">
          <Sparkles className="h-4 w-4 animate-pulse text-cyan-200" />
          Loading Admin 786 Dashboard
        </div>
      </main>
    )
  }

  return (
    <main className={`relative min-h-screen overflow-hidden transition-colors duration-300 ${pageClass}`}>
      {isWallpaperMode ? (
        <>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentWallpaper.image}
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 1.1, ease: "easeOut" }}
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${currentWallpaper.image})` }}
            />
          </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-[#050713]/70 to-[#050713]/95" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(0,255,255,0.22),transparent_28%),radial-gradient(circle_at_30%_80%,rgba(125,92,255,0.18),transparent_35%)]" />
        </>
      ) : (
        <div className={`absolute inset-0 transition-colors duration-300 ${glowClass}`} />
      )}

      <div className="relative grid min-h-screen grid-cols-1 lg:grid-cols-[260px_1fr]">
        <aside className={`hidden border-r p-4 backdrop-blur-2xl transition-all duration-700 lg:block ${sidebarClass}`}>
          <div className={`mb-5 flex flex-col items-center justify-center rounded-2xl border px-3 py-5 text-center ${softCardClass}`}>
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-300 text-xl font-bold text-slate-950 shadow-[0_0_28px_rgba(34,211,238,0.45)]">
              786
            </div>
            <div>
              <p className="text-lg font-bold leading-tight">Admin 786</p>
              <p className={`mt-1 text-sm ${mutedTextClass}`}>Dashboard</p>
            </div>
          </div>

          <div className="mb-4 grid gap-2">
            <Button className="h-9 justify-start gap-2 border border-cyan-300/30 bg-cyan-300/20 text-cyan-100 hover:bg-cyan-300/25">
              <Plus className="h-4 w-4" />
              Create something new
            </Button>
            <Button
              variant="outline"
              className={`h-9 justify-start gap-2 ${
                isDarkTheme
                  ? "border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.07]"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Import className="h-4 w-4" />
              Import code or design
            </Button>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.label}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition ${
                    item.active
                      ? isDarkTheme
                        ? "bg-cyan-300/10 text-cyan-100 shadow-[inset_0_0_0_1px_rgba(103,232,249,0.15)]"
                        : "bg-cyan-50 text-cyan-800 shadow-[inset_0_0_0_1px_rgba(103,232,249,0.35)]"
                      : isDarkTheme
                        ? "text-slate-400 hover:bg-white/[0.05] hover:text-white"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              )
            })}

            <div className="relative">
              <button
                onClick={() => setSettingsOpen((current) => !current)}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition ${
                  isDarkTheme
                    ? "text-slate-400 hover:bg-white/[0.05] hover:text-white"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-950"
                }`}
              >
                <span className="flex items-center gap-3">
                  <Settings className="h-4 w-4" />
                  Settings
                </span>
                <ChevronRight className={`h-4 w-4 transition ${settingsOpen ? "rotate-90" : ""}`} />
              </button>

              {settingsOpen && (
                <div className={`mt-2 rounded-2xl border p-2 ${menuClass}`}>
                  <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm hover:bg-cyan-300/10">
                    <Bell className="h-4 w-4" />
                    Notifications
                  </button>

                  <div className="relative">
                    <button
                      onClick={() => setThemeMenuOpen((current) => !current)}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm hover:bg-cyan-300/10"
                    >
                      <span className="flex items-center gap-3">
                        <Palette className="h-4 w-4" />
                        Theme
                      </span>
                      <span className="flex items-center gap-2">
                        {activeThemeLabel}
                        <ChevronRight className={`h-4 w-4 transition ${themeMenuOpen ? "rotate-90" : ""}`} />
                      </span>
                    </button>

                    {themeMenuOpen && (
                      <div className={`ml-5 mt-1 rounded-xl border p-1 ${isDarkTheme ? "border-white/10 bg-black/20" : "border-slate-200 bg-slate-50"}`}>
                        {themeOptions.map((option) => {
                          const Icon = option.icon
                          const active = themeMode === option.value

                          return (
                            <button
                              key={option.value}
                              onClick={() => setThemeMode(option.value)}
                              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition ${
                                active
                                  ? isDarkTheme
                                    ? "bg-cyan-300/15 text-cyan-100"
                                    : "bg-cyan-100 text-cyan-900"
                                  : "hover:bg-cyan-300/10"
                              }`}
                            >
                              <Icon className="h-4 w-4" />
                              {option.label}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm hover:bg-cyan-300/10">
                    <HelpCircle className="h-4 w-4" />
                    Help
                  </button>
                  <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm hover:bg-cyan-300/10">
                    <LogOut className="h-4 w-4" />
                    Log out
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => router.push("/786-admin/vip")}
              className={`mt-2 flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left text-sm font-semibold transition ${
                isDarkTheme
                  ? "border-cyan-300/25 bg-cyan-300/10 text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,0.10)] hover:border-cyan-300/45 hover:bg-cyan-300/15"
                  : "border-cyan-200 bg-cyan-50 text-cyan-900 hover:bg-cyan-100"
              }`}
            >
              <Sparkles className="h-4 w-4" />
              Go To 786 Admin VIP
            </button>
          </nav>

          <div className={`absolute bottom-4 left-4 right-4 rounded-2xl border p-4 text-xs ${softCardClass}`}>
            <p className="font-medium">Admin only</p>
            <p className={`mt-1 ${mutedTextClass}`}>Full control will be added step by step safely.</p>
          </div>
        </aside>

        <section className="relative overflow-y-auto overflow-x-hidden px-5 py-6 lg:px-10 lg:py-8">
          <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className={`flex w-full flex-col items-center justify-center rounded-2xl border px-4 py-5 text-center lg:hidden ${softCardClass}`}>
              <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-300 text-xl font-bold text-slate-950 shadow-[0_0_28px_rgba(34,211,238,0.45)]">
                786
              </div>
              <p className="text-lg font-bold leading-tight">Admin 786</p>
              <p className={`mt-1 text-sm ${mutedTextClass}`}>Dashboard</p>
            </div>

            <div className={`hidden max-w-sm flex-1 items-center gap-2 rounded-2xl border px-3 py-2 lg:flex ${cardClass}`}>
              <Search className={`h-4 w-4 ${mutedTextClass}`} />
              <span className={`text-sm ${mutedTextClass}`}>Search projects, files, APIs...</span>
            </div>

            <div className="relative flex justify-start sm:justify-end">
              <button
                onClick={() => setDeviceMenuOpen((current) => !current)}
                className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition ${
                  isDarkTheme
                    ? "border-cyan-300/20 bg-white/[0.08] text-slate-100 hover:border-cyan-300/40 hover:bg-cyan-300/10 hover:text-cyan-100"
                    : "border-slate-200 bg-white text-slate-700 shadow-sm hover:border-cyan-300 hover:text-cyan-700"
                }`}
              >
                <ActiveDeviceIcon className="h-4 w-4" />
                {activeDevice}
                <ChevronRight className={`h-3.5 w-3.5 transition ${deviceMenuOpen ? "rotate-90" : ""}`} />
              </button>

              {deviceMenuOpen && (
                <div className={`absolute right-0 top-11 z-50 w-44 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border p-2 ${menuClass}`}>
                  {deviceLinks.map((item) => {
                    const Icon = item.icon
                    const active = activeDevice === item.label

                    return (
                      <button
                        key={item.label}
                        onClick={() => {
                          setActiveDevice(item.label)
                          setDeviceMenuOpen(false)
                        }}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition ${
                          active
                            ? isDarkTheme
                              ? "bg-cyan-300/15 text-cyan-100"
                              : "bg-cyan-100 text-cyan-900"
                            : "hover:bg-cyan-300/10"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </header>

          {isWallpaperMode && (
            <section className="mb-8 overflow-hidden rounded-3xl border border-white/15 bg-black/25 p-3 shadow-[0_22px_70px_rgba(0,0,0,0.30)] backdrop-blur-xl">
              <div className="mb-3 flex items-center justify-between gap-3 px-1">
                <div>
                  <p className="flex items-center gap-2 text-sm font-semibold text-white">
                    <ImageIcon className="h-4 w-4 text-cyan-200" />
                    VIP System Wallpaper
                  </p>
                  <p className="text-xs text-slate-300">{currentWallpaper.title} — {currentWallpaper.subtitle}</p>
                </div>
                <div className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100">
                  Auto slider
                </div>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-1">
                {wallpaperSlides.map((slide, index) => (
                  <button
                    key={slide.title}
                    onClick={() => setActiveWallpaper(index)}
                    className={`relative h-20 min-w-[150px] overflow-hidden rounded-2xl border transition ${
                      activeWallpaper === index
                        ? "border-cyan-300 shadow-[0_0_24px_rgba(0,255,255,0.22)]"
                        : "border-white/15 opacity-80 hover:opacity-100"
                    }`}
                  >
                    <div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{ backgroundImage: `url(${slide.image})` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent" />
                    <span className="absolute bottom-2 left-2 text-xs font-medium text-white">{slide.title}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.42 }}
            className="mx-auto max-w-5xl"
          >
            <div className="text-center">
              <div className={`mb-4 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs ${softCardClass}`}>
                <ShieldCheck className="h-4 w-4" />
                Owner logged in as {user.email}
              </div>
              <h1 className={`text-center text-3xl font-semibold tracking-tight sm:text-4xl ${strongTextClass}`}>
                Hi Mujeeb, what do you want to make?
              </h1>
              <p className={`mx-auto mt-3 max-w-2xl text-center text-sm ${mutedTextClass}`}>
                Admin 786 Dashboard — build, edit, design, fix and deploy step by step.
              </p>
            </div>

            <div className={`mx-auto mt-8 max-w-3xl rounded-[24px] border p-2 backdrop-blur-2xl ${cardClass}`}>
              <div className={`rounded-[20px] border p-4 ${isDarkTheme ? "border-white/10 bg-black/25" : "border-slate-200 bg-white"}`}>
                <Input
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder="Build an admin login, dashboard, API, homepage, animation..."
                  className={`h-14 border-0 bg-transparent text-base focus-visible:ring-0 ${inputTextClass}`}
                />
                <div className={`mt-2 flex items-center justify-between border-t pt-3 ${isDarkTheme ? "border-white/10" : "border-slate-200"}`}>
                  <button className={`rounded-xl border px-3 py-2 text-sm transition ${isDarkTheme ? "border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.07]" : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-white"}`}>
                    + Add file
                  </button>
                  <Button className="h-9 gap-2 bg-cyan-300 text-slate-950 hover:bg-cyan-200">
                    Start
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-5">
              {quickTypes.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.label}
                    className={`group flex flex-col items-center gap-2 text-xs transition ${isDarkTheme ? "text-slate-300 hover:text-cyan-100" : "text-slate-500 hover:text-cyan-700"}`}
                  >
                    <span className={`flex h-12 w-12 items-center justify-center rounded-2xl border transition ${isDarkTheme ? "border-white/10 bg-white/[0.06] group-hover:border-cyan-300/30 group-hover:bg-cyan-300/10 group-hover:shadow-[0_0_28px_rgba(0,255,255,0.12)]" : "border-slate-200 bg-white shadow-sm group-hover:border-cyan-300 group-hover:bg-cyan-50"}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    {item.label}
                  </button>
                )
              })}
            </div>

            <section className="mt-20">
              <div className="mb-5 flex items-center justify-between">
                <h2 className={`text-sm font-medium ${isDarkTheme ? "text-slate-200" : "text-slate-700"}`}>Your recent Projects</h2>
                <button className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs transition ${isDarkTheme ? "border-white/10 bg-white/[0.07] text-slate-200 hover:border-cyan-300/25 hover:text-cyan-100" : "border-slate-200 bg-white text-slate-700 shadow-sm hover:border-cyan-300 hover:text-cyan-700"}`}>
                  View All
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {recentProjects.map((project) => {
                  const Icon = project.icon
                  return (
                    <div
                      key={project.name}
                      className={`group overflow-hidden rounded-3xl border transition hover:-translate-y-1 ${cardClass} ${isDarkTheme ? "hover:border-cyan-300/30" : "hover:border-cyan-300"}`}
                    >
                      <div className={`flex h-32 items-center justify-center bg-gradient-to-br ${project.glow}`}>
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/25 bg-black/25 backdrop-blur-xl">
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className={`font-medium ${strongTextClass}`}>{project.name}</h3>
                        <p className={`mt-2 text-xs ${mutedTextClass}`}>
                          {project.status} • {project.age}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          </motion.div>
        </section>
      </div>
    </main>
  )
}
