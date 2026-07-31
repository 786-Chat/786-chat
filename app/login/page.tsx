"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Eye,
  EyeOff,
  ArrowLeft,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Sparkles,
  Code2,
  Rocket,
  CheckCircle2,
} from "lucide-react"
import { motion } from "framer-motion"
import { useAuth } from "@/contexts/auth-context"

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const { login, user, isLoading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && user) router.replace("/dashboard")
  }, [user, authLoading, router])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError("")

    const result = await login(email.trim().toLowerCase(), password)

    if (result.success) {
      router.replace("/dashboard")
      router.refresh()
      return
    }

    setError(result.error || "Login failed. Check your email and password, then try again.")
    setIsSubmitting(false)
  }

  if (authLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#030616]">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-300" />
      </div>
    )
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#030616] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_25%,rgba(14,165,233,.22),transparent_30rem),radial-gradient(circle_at_82%_18%,rgba(124,58,237,.24),transparent_32rem),radial-gradient(circle_at_58%_90%,rgba(37,99,235,.18),transparent_28rem)]" />
      <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(96,165,250,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(96,165,250,.08)_1px,transparent_1px)] [background-size:64px_64px]" />
      <div className="pointer-events-none absolute -right-32 top-24 h-[520px] w-[520px] rounded-full border border-violet-400/20 shadow-[0_0_120px_rgba(79,70,229,.3),inset_0_0_100px_rgba(14,165,233,.12)]" />

      <div className="relative z-10 mx-auto grid min-h-screen w-full max-w-[1440px] lg:grid-cols-[1.08fr_.92fr]">
        <section className="flex flex-col justify-between px-6 py-8 sm:px-10 lg:px-16 lg:py-12">
          <Link href="/" className="inline-flex w-fit items-center gap-3" aria-label="786.Chat home">
            <span className="grid h-11 w-11 place-items-center rounded-full border border-violet-400/60 bg-violet-500/10 text-[12px] font-black text-violet-200 shadow-[0_0_24px_rgba(124,58,237,.35)]">786</span>
            <span className="text-[22px] font-black tracking-[-.04em]">786.Chat</span>
          </Link>

          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65 }} className="my-16 max-w-2xl lg:my-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-[12px] font-bold uppercase tracking-[.18em] text-cyan-200">
              <Sparkles className="h-4 w-4" /> Agentic product engineering
            </div>
            <h1 className="mt-7 text-5xl font-black leading-[.98] tracking-[-.055em] sm:text-6xl xl:text-7xl">
              Build production
              <span className="mt-2 block bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">
                apps by talking to AI
              </span>
            </h1>
            <p className="mt-7 max-w-xl text-[16px] leading-7 text-slate-400">
              Plan, code, test and deploy complete applications from one intelligent workspace.
            </p>
            <div className="mt-9 grid max-w-xl gap-3 sm:grid-cols-3">
              {[
                [Code2, "Real source files"],
                [CheckCircle2, "Verified builds"],
                [Rocket, "Production deploys"],
              ].map(([Icon, label]) => {
                const FeatureIcon = Icon as typeof Code2
                return (
                  <div key={String(label)} className="rounded-xl border border-white/10 bg-white/[.035] p-4 backdrop-blur-xl">
                    <FeatureIcon className="h-5 w-5 text-cyan-300" />
                    <p className="mt-3 text-[13px] font-bold text-slate-200">{String(label)}</p>
                  </div>
                )
              })}
            </div>
          </motion.div>

          <p className="text-[12px] text-slate-600">© {new Date().getFullYear()} 786.Chat · Secure AI product workspace</p>
        </section>

        <section className="flex items-center justify-center border-t border-white/10 bg-[#060a18]/70 px-5 py-12 backdrop-blur-2xl lg:border-l lg:border-t-0 lg:px-12">
          <div className="w-full max-w-[480px]">
            <Link href="/" className="mb-7 inline-flex items-center gap-2 text-[13px] text-slate-400 transition-colors hover:text-white">
              <ArrowLeft className="h-4 w-4" /> Back to home
            </Link>

            <motion.div initial={{ opacity: 0, y: 22, scale: .985 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.5 }} className="rounded-[28px] border border-violet-300/20 bg-[#0a1022]/90 p-6 shadow-[0_30px_100px_rgba(0,0,0,.55),0_0_60px_rgba(79,70,229,.12)] sm:p-9">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-cyan-300 via-blue-400 to-violet-400 text-[13px] font-black text-slate-950">786</span>
                <div>
                  <p className="text-[12px] font-bold uppercase tracking-[.18em] text-cyan-300">Secure workspace</p>
                  <p className="text-[13px] text-slate-500">Projects, code and deployments</p>
                </div>
              </div>

              <div className="mt-8">
                <h2 className="text-3xl font-black tracking-[-.035em]">Welcome back</h2>
                <p className="mt-2 text-[14px] leading-6 text-slate-400">Sign in to continue building with 786.Chat.</p>
              </div>

              {error && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} role="alert" className="mt-5 flex items-start gap-2 rounded-xl border border-rose-400/20 bg-rose-500/10 p-4 text-[13px] text-rose-200">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="mt-7 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[12px] font-bold uppercase tracking-[.12em] text-slate-400">Email</Label>
                  <Input id="email" name="email" type="email" autoComplete="email" inputMode="email" placeholder="you@example.com" required value={email} onChange={(event) => setEmail(event.target.value)} className="h-12 rounded-xl border-white/10 bg-[#050914]/80 px-4 text-[14px] placeholder:text-slate-700 focus-visible:border-cyan-300/50 focus-visible:ring-cyan-300/20" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-4">
                    <Label htmlFor="password" className="text-[12px] font-bold uppercase tracking-[.12em] text-slate-400">Password</Label>
                    <Link href="/contact" className="text-[12px] text-cyan-300 transition-colors hover:text-cyan-200">Need help?</Link>
                  </div>
                  <div className="relative">
                    <Input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Enter your password" required value={password} onChange={(event) => setPassword(event.target.value)} className="h-12 rounded-xl border-white/10 bg-[#050914]/80 px-4 pr-11 text-[14px] placeholder:text-slate-700 focus-visible:border-cyan-300/50 focus-visible:ring-cyan-300/20" />
                    <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 transition-colors hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-300/50">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="h-12 w-full rounded-xl bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 text-[14px] font-black text-slate-950 shadow-[0_16px_40px_rgba(59,130,246,.22)] hover:opacity-95" disabled={isSubmitting || !email.trim() || !password}>
                  {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in...</> : "Sign in to 786.Chat"}
                </Button>
              </form>

              <div className="mt-6 flex items-start gap-2 rounded-xl border border-cyan-300/15 bg-cyan-400/[.06] p-3 text-[12px] leading-5 text-slate-400">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
                Your workspace and projects remain isolated and protected.
              </div>

              <p className="mt-7 text-center text-[13px] text-slate-500">
                New to 786.Chat?{" "}
                <Link href="/register" className="font-bold text-violet-300 transition-colors hover:text-violet-200">Create an account</Link>
              </p>
            </motion.div>
          </div>
        </section>
      </div>
    </main>
  )
}
