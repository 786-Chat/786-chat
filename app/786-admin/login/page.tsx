"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { AlertCircle, Eye, EyeOff, Loader2, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/auth-context"

const ADMIN_EMAIL = "mujeeb@job4u.com"

export default function SevenEightSixAdminLoginPage() {
  const router = useRouter()
  const { login, user, isLoading: authLoading } = useAuth()

  const [email, setEmail] = useState(ADMIN_EMAIL)
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isAdminEmail = useMemo(
    () => email.trim().toLowerCase() === ADMIN_EMAIL,
    [email]
  )

  useEffect(() => {
    if (!authLoading && user?.email?.toLowerCase().trim() === ADMIN_EMAIL) {
      router.push("/dashboard/chat")
    }
  }, [authLoading, router, user])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")

    if (!isAdminEmail) {
      setError("This login is only for the 786.Chat admin account.")
      return
    }

    setIsSubmitting(true)

    try {
      const result = await login(email.trim().toLowerCase(), password)

      if (!result.success) {
        setError(result.error || "Admin login failed. Please check your details.")
        return
      }

      router.push("/dashboard/chat")
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : "Admin login failed. Please try again."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#03050c] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(0,255,255,0.22),transparent_28%),radial-gradient(circle_at_82%_12%,rgba(80,70,255,0.25),transparent_30%),radial-gradient(circle_at_50%_100%,rgba(0,255,150,0.16),transparent_35%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:48px_48px] opacity-30" />
      <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-cyan-400/20 blur-3xl" />

      <section className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="w-full max-w-[390px]"
        >
          <div className="mb-5 flex items-center justify-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-white/[0.04] px-3 py-1.5 text-xs text-cyan-100 shadow-[0_0_30px_rgba(0,255,255,0.12)] backdrop-blur-xl">
              <ShieldCheck className="h-3.5 w-3.5 text-cyan-300" />
              786.Chat Admin Access
            </div>
          </div>

          <div className="relative rounded-[28px] border border-cyan-300/20 bg-[#070a14]/80 p-[1px] shadow-[0_0_70px_rgba(0,255,255,0.16)] backdrop-blur-2xl">
            <div className="absolute inset-x-8 -top-px h-px bg-gradient-to-r from-transparent via-cyan-300 to-transparent" />
            <div className="rounded-[27px] border border-white/5 bg-black/30 px-6 py-7">
              <div className="mb-7 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-300/25 bg-cyan-300/10 shadow-[0_0_34px_rgba(0,255,255,0.18)]">
                  <Sparkles className="h-6 w-6 text-cyan-200" />
                </div>
                <h1 className="text-3xl font-semibold tracking-tight">
                  786<span className="text-cyan-200">.Chat</span>
                </h1>
                <p className="mt-2 text-sm text-slate-400">
                  Secure admin login for platform control.
                </p>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-5 flex items-start gap-2 rounded-2xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-email" className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    Admin email
                  </Label>
                  <Input
                    id="admin-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="h-11 border-white/10 bg-white/[0.04] text-white placeholder:text-slate-600 focus:border-cyan-300/70 focus:ring-cyan-300/20"
                    placeholder="admin@786.chat"
                    autoComplete="email"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admin-password" className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="admin-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="h-11 border-white/10 bg-white/[0.04] pr-11 text-white placeholder:text-slate-600 focus:border-cyan-300/70 focus:ring-cyan-300/20"
                      placeholder="Enter admin password"
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-cyan-200"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={authLoading || isSubmitting}
                  className="mt-2 h-11 w-full border border-cyan-300/20 bg-cyan-300 text-slate-950 shadow-[0_0_28px_rgba(0,255,255,0.22)] transition hover:bg-cyan-200"
                >
                  {isSubmitting ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Checking admin access
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      <LockKeyhole className="h-4 w-4" />
                      Enter Admin Dashboard
                    </span>
                  )}
                </Button>
              </form>

              <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-center text-xs leading-relaxed text-slate-500">
                Customers cannot use this page for admin control.
                <br />
                Admin access is restricted to the owner account only.
              </div>
            </div>
          </div>
        </motion.div>
      </section>
    </main>
  )
}
