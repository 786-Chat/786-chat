"use client"

import Link from "next/link"
import { FormEvent, useEffect, useState } from "react"
import { CheckCircle2, Loader2, Mail, RefreshCw, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type Status = "idle" | "verifying" | "verified" | "error"

export default function VerifyEmailPage() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<Status>("idle")
  const [message, setMessage] = useState("Check your inbox and click the secure verification link.")
  const [resending, setResending] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get("token")
    const requestedEmail = params.get("email") || ""
    setEmail(requestedEmail)
    if (!token) return

    setStatus("verifying")
    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (response) => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || "This verification link is invalid or expired.")
        setStatus("verified")
        setMessage("Your email is verified. You can now sign in securely.")
      })
      .catch((error: Error) => {
        setStatus("error")
        setMessage(error.message)
      })
  }, [])

  async function resend(event: FormEvent) {
    event.preventDefault()
    if (!email.trim()) return
    setResending(true)
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await response.json()
      setMessage(data.message || "If the account exists, a fresh verification email has been sent.")
      setStatus("idle")
    } catch {
      setStatus("error")
      setMessage("We could not send a new verification email. Please try again.")
    } finally {
      setResending(false)
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#050814] px-4 text-white">
      <section className="w-full max-w-lg rounded-[28px] border border-white/10 bg-white/[.055] p-7 shadow-2xl backdrop-blur-2xl sm:p-10">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-cyan-400/10 text-cyan-200">
          {status === "verifying" ? <Loader2 className="h-7 w-7 animate-spin" /> : status === "verified" ? <CheckCircle2 className="h-7 w-7 text-emerald-300" /> : status === "error" ? <XCircle className="h-7 w-7 text-rose-300" /> : <Mail className="h-7 w-7" />}
        </div>
        <h1 className="mt-6 text-center text-3xl font-black">Verify your email</h1>
        <p className="mt-3 text-center leading-7 text-slate-400">{message}</p>

        {status === "verified" ? (
          <Button asChild className="mt-7 h-12 w-full bg-gradient-to-r from-cyan-400 to-violet-500 font-bold">
            <Link href="/login">Sign in to 786.Chat</Link>
          </Button>
        ) : (
          <form onSubmit={resend} className="mt-7 space-y-3">
            <Input type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required className="h-12 border-white/15 bg-black/20" />
            <Button type="submit" disabled={resending} variant="outline" className="h-12 w-full border-white/15 bg-white/5">
              {resending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Resend verification email
            </Button>
          </form>
        )}
        <p className="mt-6 text-center text-sm text-slate-500"><Link href="/login" className="font-bold text-cyan-200">Back to sign in</Link></p>
      </section>
    </main>
  )
}
