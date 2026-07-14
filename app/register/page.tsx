"use client"

import Link from "next/link"
import { FormEvent, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  Rocket,
  ShieldCheck,
  Sparkles,
  WandSparkles,
} from "lucide-react"

import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const benefits = [
  { icon: WandSparkles, title: "Build with AI", text: "Generate complete, editable projects from a simple description." },
  { icon: Rocket, title: "Publish faster", text: "Move from idea to preview, GitHub and deployment in one workspace." },
  { icon: ShieldCheck, title: "Your work stays yours", text: "Projects, revisions and collaboration access remain protected." },
]

function BrandMark() {
  return (
    <div className="relative grid h-12 w-12 place-items-center rounded-2xl border border-cyan-300/25 bg-gradient-to-br from-cyan-400 via-blue-500 to-violet-600 shadow-[0_0_35px_rgba(34,211,238,.28)]">
      <span className="text-lg font-black tracking-tight text-white">786</span>
      <div className="absolute -inset-1 -z-10 rounded-[20px] bg-cyan-400/20 blur-xl" />
    </div>
  )
}

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [error, setError] = useState("")

  const { register, user, isLoading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && user) router.replace("/dashboard")
  }, [authLoading, router, user])

  const passwordChecks = useMemo(
    () => [
      { label: "8 or more characters", passed: password.length >= 8 },
      { label: "At least one letter", passed: /[A-Za-z]/.test(password) },
      { label: "At least one number", passed: /\d/.test(password) },
    ],
    [password],
  )

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")

    if (!firstName.trim() || !lastName.trim()) {
      setError("Please enter your first and last name.")
      return
    }

    if (!passwordChecks.every((check) => check.passed)) {
      setError("Please create a stronger password using the requirements below.")
      return
    }

    if (!agreedToTerms) {
      setError("Please agree to the Terms of Service and Privacy Policy.")
      return
    }

    setIsSubmitting(true)
    try {
      const result = await register(`${firstName.trim()} ${lastName.trim()}`, email.trim(), password)
      if (!result.success) {
        setError(result.error || "We could not create your account. Please try again.")
        return
      }
      router.replace("/dashboard")
    } catch {
      setError("We could not create your account. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (authLoading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#050814] text-white">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}>
          <BrandMark />
        </motion.div>
      </main>
    )
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050814] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-12rem] top-[-10rem] h-[34rem] w-[34rem] rounded-full bg-cyan-500/15 blur-[130px]" />
        <div className="absolute bottom-[-14rem] right-[-10rem] h-[38rem] w-[38rem] rounded-full bg-violet-600/15 blur-[150px]" />
        <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.035)_1px,transparent_1px)] [background-size:48px_48px]" />
      </div>

      <div className="relative mx-auto grid min-h-screen max-w-7xl lg:grid-cols-[1.05fr_.95fr]">
        <section className="hidden border-r border-white/10 px-12 py-14 lg:flex lg:flex-col lg:justify-between xl:px-20">
          <Link href="/" className="inline-flex w-fit items-center gap-3">
            <BrandMark />
            <div>
              <div className="text-xl font-black tracking-tight">786.chat</div>
              <div className="text-xs font-medium uppercase tracking-[.26em] text-cyan-200/60">Chat AI</div>
            </div>
          </Link>

          <div className="max-w-xl py-16">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/5 px-4 py-2 text-sm text-cyan-100">
              <Sparkles className="h-4 w-4" />
              Your AI product workspace
            </div>
            <h1 className="text-5xl font-black leading-[1.05] tracking-[-.04em] xl:text-6xl">
              Turn your idea into a real product.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-8 text-slate-300">
              Create your 786.chat account to generate, edit, review and deploy complete projects from one secure workspace.
            </p>

            <div className="mt-10 space-y-5">
              {benefits.map(({ icon: Icon, title, text }) => (
                <div key={title} className="flex gap-4 rounded-2xl border border-white/8 bg-white/[.035] p-5 backdrop-blur-xl">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-cyan-300/10 text-cyan-200">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-bold">{title}</h2>
                    <p className="mt-1 text-sm leading-6 text-slate-400">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-sm text-slate-500">© {new Date().getFullYear()} 786.chat. Build with confidence.</p>
        </section>

        <section className="flex items-center justify-center px-4 py-8 sm:px-8 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="w-full max-w-xl"
          >
            <div className="mb-7 flex items-center justify-between lg:hidden">
              <Link href="/" className="inline-flex items-center gap-3">
                <BrandMark />
                <div>
                  <div className="text-xl font-black">786.chat</div>
                  <div className="text-[10px] uppercase tracking-[.26em] text-cyan-200/60">Chat AI</div>
                </div>
              </Link>
            </div>

            <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              Back to home
            </Link>

            <div className="rounded-[28px] border border-white/10 bg-white/[.055] p-6 shadow-2xl shadow-black/30 backdrop-blur-2xl sm:p-9">
              <div className="mb-8">
                <div className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-cyan-200">
                  <LockKeyhole className="h-4 w-4" /> Secure registration
                </div>
                <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Create your 786.chat account</h1>
                <p className="mt-3 text-slate-400">Start building free. No payment details required.</p>
              </div>

              {error ? (
                <div role="alert" className="mb-6 flex items-start gap-3 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-100">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              ) : null}

              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First name</Label>
                    <Input id="firstName" autoComplete="given-name" placeholder="Mujeeb" value={firstName} onChange={(event) => setFirstName(event.target.value)} required className="h-12 border-white/10 bg-black/20" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last name</Label>
                    <Input id="lastName" autoComplete="family-name" placeholder="Sardar" value={lastName} onChange={(event) => setLastName(event.target.value)} required className="h-12 border-white/10 bg-black/20" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input id="email" type="email" autoComplete="email" inputMode="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required className="h-12 border-white/10 bg-black/20" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input id="password" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="Create a secure password" value={password} onChange={(event) => setPassword(event.target.value)} required className="h-12 border-white/10 bg-black/20 pr-12" />
                    <button type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 transition hover:bg-white/5 hover:text-white">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <div className="grid gap-2 pt-1 sm:grid-cols-3">
                    {passwordChecks.map((check) => (
                      <div key={check.label} className={`flex items-center gap-1.5 text-xs ${check.passed ? "text-emerald-300" : "text-slate-500"}`}>
                        <Check className="h-3.5 w-3.5" /> {check.label}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl border border-white/8 bg-black/15 p-4">
                  <Checkbox id="terms" checked={agreedToTerms} onCheckedChange={(checked) => setAgreedToTerms(checked === true)} className="mt-0.5" />
                  <Label htmlFor="terms" className="text-sm font-normal leading-6 text-slate-400">
                    I agree to the <Link href="/terms" className="font-semibold text-cyan-200 hover:text-cyan-100">Terms of Service</Link> and <Link href="/privacy" className="font-semibold text-cyan-200 hover:text-cyan-100">Privacy Policy</Link>.
                  </Label>
                </div>

                <Button type="submit" disabled={isSubmitting} className="h-12 w-full bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-600 text-base font-bold text-white shadow-lg shadow-blue-500/20 hover:opacity-95">
                  {isSubmitting ? "Creating your account…" : "Create account"}
                </Button>
              </form>

              <div className="mt-7 border-t border-white/10 pt-6 text-center text-sm text-slate-400">
                Already have an account? <Link href="/login" className="font-bold text-cyan-200 hover:text-cyan-100">Sign in to 786.chat</Link>
              </div>
            </div>

            <p className="mt-5 text-center text-xs leading-5 text-slate-600 lg:hidden">© {new Date().getFullYear()} 786.chat</p>
          </motion.div>
        </section>
      </div>
    </main>
  )
}
