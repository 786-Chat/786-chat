"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, ArrowLeft, AlertCircle, Loader2, ShieldCheck } from "lucide-react"
import { motion } from "framer-motion"
import { useAuth } from "@/contexts/auth-context"
import { SpaceBackground } from "@/components/ui/space-background"
import { MujeebProAILogo } from "@/components/mujeebproai-logo"

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
      <div className="flex min-h-screen items-center justify-center bg-background">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }}>
          <MujeebProAILogo variant="icon" size="lg" animated={false} />
        </motion.div>
      </div>
    )
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background">
      <SpaceBackground />
      <div className="relative z-10 w-full max-w-md px-4 py-10">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="rounded-2xl border border-white/10 p-8 glass">
          <div className="flex items-center justify-center">
            <MujeebProAILogo variant="full" size="lg" />
          </div>

          <div className="mt-8 text-center">
            <h1 className="text-3xl font-bold">Welcome back</h1>
            <p className="mt-2 text-muted-foreground">Sign in securely to your 786 Chat AI workspace.</p>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} role="alert" className="mt-6 flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" autoComplete="email" inputMode="email" placeholder="you@example.com" required value={email} onChange={(event) => setEmail(event.target.value)} className="h-12 border-white/10 bg-background/50" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-4">
                <Label htmlFor="password">Password</Label>
                <Link href="/contact" className="text-xs text-muted-foreground transition-colors hover:text-primary">Need account help?</Link>
              </div>
              <div className="relative">
                <Input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Enter your password" required value={password} onChange={(event) => setPassword(event.target.value)} className="h-12 border-white/10 bg-background/50 pr-11" />
                <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="h-12 w-full bg-gradient-to-r from-primary to-accent text-base shadow-lg shadow-primary/25 hover:opacity-90" disabled={isSubmitting || !email.trim() || !password}>
              {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in...</> : "Sign in"}
            </Button>
          </form>

          <div className="mt-6 flex items-start gap-2 rounded-xl border border-cyan-500/15 bg-cyan-500/5 p-3 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />
            Your workspace and projects are isolated to your authenticated account. Never share your password with support.
          </div>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-medium text-primary transition-colors hover:text-accent">Create your account</Link>
          </p>
        </motion.div>

        <p className="mt-6 text-center text-xs text-muted-foreground">Protected by 786 Chat AI account security</p>
      </div>
    </main>
  )
}
