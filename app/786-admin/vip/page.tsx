"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Brush,
  CheckCircle2,
  CloudUpload,
  FileImage,
  ImageIcon,
  Link2,
  PanelLeft,
  Palette,
  Save,
  ShieldCheck,
  Sparkles,
  Type,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/contexts/auth-context"

const ADMIN_EMAIL = "mujeeb@job4u.com"

const sidebarItems = ["Home", "Projects", "Published Projects", "Admin Security", "Integrations", "Settings"]
const themeCards = ["Neon Dark", "VIP Cyan Glow", "Purple Studio", "Green Matrix", "Canva Style", "Clean Glass"]
const projectRows = [
  { name: "786 Admin Portal", url: "786.chat/admin-portal", status: "Dashboard card" },
  { name: "MujeebProAI Safe Copy", url: "mujeebproai.com/safe-copy", status: "Protected label" },
  { name: "Customer Builder System", url: "786.chat/customer-builder-later", status: "Future label" },
]

export default function SevenEightSixAdminVipPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [brandName, setBrandName] = useState("Admin 786")
  const [dashboardTitle, setDashboardTitle] = useState("Hi Mujeeb, what do you want to make?")
  const [dashboardSubtitle, setDashboardSubtitle] = useState("Admin 786 Dashboard — build, edit, design, fix and deploy step by step.")
  const [newsLoop, setNewsLoop] = useState("Welcome to 786.Chat VIP control • Change logo • Change colors • Change dashboard cards")
  const [fontSize, setFontSize] = useState("36")
  const [fontColor, setFontColor] = useState("#ffffff")
  const [cardBorder, setCardBorder] = useState("#22d3ee")
  const [backgroundColor, setBackgroundColor] = useState("#050713")

  const isAdmin = useMemo(() => user?.email?.toLowerCase().trim() === ADMIN_EMAIL, [user])

  useEffect(() => {
    if (!isLoading && !isAdmin) router.replace("/786-admin/login")
  }, [isAdmin, isLoading, router])

  if (isLoading || !isAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050713] text-white">
        <div className="rounded-2xl border border-cyan-300/20 bg-white/[0.05] px-5 py-4 text-sm text-cyan-100 shadow-[0_0_40px_rgba(34,211,238,0.18)]">
          Loading Admin VIP Control
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#050713] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(34,211,238,0.20),transparent_30%),radial-gradient(circle_at_80%_15%,rgba(168,85,247,0.18),transparent_28%),radial-gradient(circle_at_50%_100%,rgba(59,130,246,0.12),transparent_35%)]" />
      <div className="relative grid min-h-screen grid-cols-1 lg:grid-cols-[280px_1fr]">
        <aside className="hidden border-r border-white/10 bg-[#08111f]/85 p-5 backdrop-blur-2xl lg:block">
          <div className="rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-5 text-center shadow-[0_0_45px_rgba(34,211,238,0.12)]">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-300 text-xl font-black text-slate-950 shadow-[0_0_32px_rgba(34,211,238,0.48)]">786</div>
            <p className="text-lg font-bold">Admin VIP</p>
            <p className="mt-1 text-sm text-cyan-100/75">Control Admin 786 Dashboard</p>
          </div>
          <nav className="mt-5 space-y-2 text-sm">
            <button onClick={() => router.push("/786-admin/dashboard")} className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left text-slate-200 hover:bg-cyan-300/10">
              <ArrowLeft className="h-4 w-4" /> Back Dashboard
            </button>
            <div className="rounded-2xl border border-cyan-300/25 bg-cyan-300/12 px-4 py-3 text-cyan-100">Admin VIP Page</div>
          </nav>
          <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-4 text-xs text-emerald-100">
            <p className="font-semibold">Safe mode</p>
            <p className="mt-1 text-emerald-100/75">VIP controls dashboard style only. No project delete actions here.</p>
          </div>
        </aside>

        <section className="overflow-y-auto px-5 py-6 lg:px-10 lg:py-8">
          <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-xs text-cyan-100">
                <ShieldCheck className="h-4 w-4" /> Owner only: {user.email}
              </div>
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Admin VIP Control</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-300">Control Admin 786 Dashboard style, logo, sidebar text, dashboard wording, backgrounds, theme style, fonts, card labels, URLs and news loop.</p>
            </div>
            <Button className="gap-2 rounded-2xl bg-cyan-300 px-5 text-slate-950 hover:bg-cyan-200"><Save className="h-4 w-4" /> Save VIP Settings</Button>
          </header>

          <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
            <section className="space-y-5">
              <div className="rounded-3xl border border-white/10 bg-white/[0.055] p-5 backdrop-blur-2xl">
                <div className="mb-4 flex items-center gap-3"><FileImage className="h-5 w-5 text-cyan-200" /><h2 className="font-bold">Logo and brand</h2></div>
                <div className="grid gap-4 md:grid-cols-[160px_1fr]">
                  <div className="flex h-40 flex-col items-center justify-center rounded-3xl border border-dashed border-cyan-300/30 bg-cyan-300/10 text-center"><CloudUpload className="mb-2 h-7 w-7 text-cyan-200" /><p className="text-sm font-semibold">Upload logo</p><p className="mt-1 text-xs text-slate-400">PNG / JPG / GIF</p></div>
                  <div className="space-y-3"><Input value={brandName} onChange={(event) => setBrandName(event.target.value)} className="border-white/10 bg-black/20 text-white" /><Input placeholder="Paste logo image URL" className="border-white/10 bg-black/20 text-white placeholder:text-slate-500" /></div>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.055] p-5 backdrop-blur-2xl">
                <div className="mb-4 flex items-center gap-3"><PanelLeft className="h-5 w-5 text-cyan-200" /><h2 className="font-bold">Sidebar text control</h2></div>
                <div className="grid gap-3 md:grid-cols-2">{sidebarItems.map((item) => (<Input key={item} defaultValue={item} className="border-white/10 bg-black/20 text-white" />))}</div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.055] p-5 backdrop-blur-2xl">
                <div className="mb-4 flex items-center gap-3"><Type className="h-5 w-5 text-cyan-200" /><h2 className="font-bold">Dashboard text and animation</h2></div>
                <div className="space-y-3"><Input value={dashboardTitle} onChange={(event) => setDashboardTitle(event.target.value)} className="border-white/10 bg-black/20 text-white" /><Input value={dashboardSubtitle} onChange={(event) => setDashboardSubtitle(event.target.value)} className="border-white/10 bg-black/20 text-white" /><Input value={newsLoop} onChange={(event) => setNewsLoop(event.target.value)} className="border-white/10 bg-black/20 text-white" /></div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.055] p-5 backdrop-blur-2xl">
                <h2 className="mb-2 font-bold">Dashboard card text and URLs</h2>
                <p className="mb-4 text-xs text-slate-400">VIP only controls how Admin 786 Dashboard cards look and what labels/URLs they show. Real project delete and restore controls belong in Admin Projects later.</p>
                <div className="space-y-3">{projectRows.map((project) => (<div key={project.name} className="grid gap-3 rounded-2xl border border-white/10 bg-black/20 p-3 md:grid-cols-[1fr_1fr_auto] md:items-center"><Input defaultValue={project.name} className="border-white/10 bg-white/[0.04] text-white" /><div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3"><Link2 className="h-4 w-4 text-slate-400" /><Input defaultValue={project.url} className="border-0 bg-transparent px-0 text-white focus-visible:ring-0" /></div><span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs text-emerald-100">{project.status}</span></div>))}</div>
              </div>
            </section>

            <section className="space-y-5">
              <div className="rounded-3xl border border-white/10 bg-white/[0.055] p-5 backdrop-blur-2xl">
                <div className="mb-4 flex items-center gap-3"><Palette className="h-5 w-5 text-cyan-200" /><h2 className="font-bold">Canva-style theme controls</h2></div>
                <div className="grid gap-3 sm:grid-cols-2">{themeCards.map((theme) => (<button key={theme} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-left hover:border-cyan-300/40 hover:bg-cyan-300/10"><div className="mb-3 h-16 rounded-2xl bg-gradient-to-br from-cyan-300/40 via-blue-500/20 to-purple-500/30" /><p className="font-semibold">{theme}</p><p className="mt-1 text-xs text-slate-400">Apply theme style later</p></button>))}</div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.055] p-5 backdrop-blur-2xl">
                <div className="mb-4 flex items-center gap-3"><Brush className="h-5 w-5 text-cyan-200" /><h2 className="font-bold">Font, color and border</h2></div>
                <div className="grid gap-3 sm:grid-cols-2"><Input value={fontSize} onChange={(event) => setFontSize(event.target.value)} className="border-white/10 bg-black/20 text-white" /><Input value={fontColor} onChange={(event) => setFontColor(event.target.value)} className="border-white/10 bg-black/20 text-white" /><Input value={cardBorder} onChange={(event) => setCardBorder(event.target.value)} className="border-white/10 bg-black/20 text-white" /><Input value={backgroundColor} onChange={(event) => setBackgroundColor(event.target.value)} className="border-white/10 bg-black/20 text-white" /></div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.055] p-5 backdrop-blur-2xl">
                <div className="mb-4 flex items-center gap-3"><ImageIcon className="h-5 w-5 text-cyan-200" /><h2 className="font-bold">Background image and slider</h2></div>
                <div className="space-y-3"><Input placeholder="Slide 1 image URL" className="border-white/10 bg-black/20 text-white placeholder:text-slate-500" /><Input placeholder="Slide 2 image URL" className="border-white/10 bg-black/20 text-white placeholder:text-slate-500" /><Input placeholder="Slide 3 image URL" className="border-white/10 bg-black/20 text-white placeholder:text-slate-500" /></div>
              </div>

              <div className="rounded-3xl border border-cyan-300/20 bg-black/25 p-5 backdrop-blur-2xl">
                <div className="mb-4 flex items-center gap-3"><Sparkles className="h-5 w-5 text-cyan-200" /><h2 className="font-bold">Live style preview</h2></div>
                <div style={{ backgroundColor, borderColor: cardBorder }} className="overflow-hidden rounded-3xl border p-5"><h3 style={{ color: fontColor, fontSize: `${Number(fontSize) || 36}px` }} className="font-black leading-tight">{dashboardTitle}</h3><p className="mt-3 text-sm text-slate-300">{dashboardSubtitle}</p><div className="mt-5 overflow-hidden rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-xs text-cyan-100"><div className="animate-pulse whitespace-nowrap">{newsLoop}</div></div></div>
              </div>

              <div className="rounded-3xl border border-emerald-300/20 bg-emerald-300/10 p-5 text-sm text-emerald-100"><div className="mb-2 flex items-center gap-2 font-bold"><CheckCircle2 className="h-5 w-5" /> VIP cleanup added safely</div><p className="text-emerald-100/80">This page controls Admin 786 Dashboard style only. Delete/restore actions will be built later inside Admin Projects after approval.</p></div>
            </section>
          </div>
        </section>
      </div>
    </main>
  )
}
