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
      router.push("/786-admin/dashboard")
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

      router.push("/786-admin/dashboard")
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
    <main className="relative min-h-screen overflow-hidden bg-[#03040b] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_18%,rgba(0,255,255,0.26),transparent_26%),radial-gradient(circle_at_72%_28%,rgba(129,92,255,0.24),transparent_34%),radial-gradient(circle_at_48%_100%,rgba(0,255,170,0.16),transparent_32%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:42px_42px] opacity-25" />

      <section className="relative z-10 grid min-h-screen lg:grid-cols-[0.88fr_1.12fr]">
        <div className="flex items-center justify-center px-5 py-10">
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="w-full max-w-[390px]"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-white/[0.04] px-3 py-1.5 text-xs text-cyan-100 shadow-[0_0_30px_rgba(0,255,255,0.12)] backdrop-blur-xl">
              <ShieldCheck className="h-3.5 w-3.5 text-cyan-300" />
              Owner-only secure access
            </div>

            <div className="relative rounded-[26px] border border-cyan-300/20 bg-[#070a14]/82 p-[1px] shadow-[0_0_75px_rgba(0,255,255,0.16)] backdrop-blur-2xl">
              <div className="absolute inset-x-8 -top-px h-px bg-gradient-to-r from-transparent via-cyan-300 to-transparent" />
              <div className="rounded-[25px] border border-white/5 bg-black/35 px-6 py-7">
                <div className="mb-7">
                  <div className="mb-4 flex h-13 w-13 items-center justify-center rounded-2xl border border-cyan-300/25 bg-cyan-300/10 shadow-[0_0_34px_rgba(0,255,255,0.18)]">
                    <Sparkles className="h-6 w-6 text-cyan-200" />
                  </div>
                  <h1 className="text-3xl font-semibold tracking-tight">
                    Admin <span className="text-cyan-200">786</span>
                  </h1>
                  <p className="mt-2 text-sm text-slate-400">
                    Login to control 786.Chat platform files, design, APIs and deployment.
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
                      Email or username
                    </Label>
                    <Input
                      id="admin-email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="h-11 border-cyan-200/10 bg-cyan-100/[0.06] text-white placeholder:text-slate-600 focus:border-cyan-300/70 focus:ring-cyan-300/20"
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
                        className="h-11 border-cyan-200/10 bg-cyan-100/[0.06] pr-11 text-white placeholder:text-slate-600 focus:border-cyan-300/70 focus:ring-cyan-300/20"
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
                    className="mt-2 h-11 w-full border border-cyan-300/20 bg-gradient-to-r from-cyan-300 via-sky-300 to-violet-300 text-slate-950 shadow-[0_0_32px_rgba(0,255,255,0.23)] transition hover:opacity-95"
                  >
                    {isSubmitting ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Checking admin access
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2">
                        <LockKeyhole className="h-4 w-4" />
                        Log in
                      </span>
                    )}
                  </Button>
                </form>

                <p className="mt-5 text-center text-xs text-slate-500">
                  Customers cannot access admin controls from this page.
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="relative hidden overflow-hidden border-l border-white/10 lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_48%_38%,rgba(0,255,255,0.22),transparent_22%),linear-gradient(135deg,rgba(9,15,31,0.25),rgba(0,0,0,0.82))]" />
          <div className="absolute inset-0 opacity-60 [background-image:linear-gradient(120deg,transparent_0%,rgba(255,255,255,0.09)_45%,transparent_60%)]" />
          <div className="absolute left-16 top-20 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl" />
          <div className="absolute bottom-16 right-20 h-80 w-80 rounded-full bg-violet-400/20 blur-3xl" />

          <div className="relative flex h-full items-center justify-center p-10">
            <div className="max-w-xl text-center">
              <div className="mx-auto mb-8 flex h-32 w-32 items-center justify-center rounded-[36px] border border-cyan-200/20 bg-white/[0.06] text-5xl font-bold shadow-[0_0_70px_rgba(0,255,255,0.18)] backdrop-blur-xl">
                786
              </div>
              <h2 className="text-5xl font-semibold tracking-tight text-white">
                Build faster with <span className="text-cyan-200">786.Chat</span>
              </h2>
              <p className="mx-auto mt-5 max-w-md text-base leading-7 text-slate-300">
                Premium AI admin workspace for code, design, files, APIs, projects and deployment control.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
