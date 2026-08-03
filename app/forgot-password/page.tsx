"use client"

import Link from "next/link"
import { FormEvent, useState } from "react"
import { ArrowLeft, Loader2, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setLoading(true)
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await response.json()
      setMessage(data.message || "If that account exists, a password reset email has been sent.")
    } catch {
      setMessage("We could not process this request. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#050814] px-4 text-white">
      <section className="w-full max-w-lg rounded-[28px] border border-white/10 bg-white/[.055] p-7 shadow-2xl backdrop-blur-2xl sm:p-10">
        <Link href="/login" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"><ArrowLeft className="h-4 w-4" /> Back to sign in</Link>
        <div className="mt-7 grid h-14 w-14 place-items-center rounded-2xl bg-cyan-400/10 text-cyan-200"><Mail className="h-7 w-7" /></div>
        <h1 className="mt-6 text-3xl font-black">Reset your password</h1>
        <p className="mt-3 leading-7 text-slate-400">Enter your account email and we will send a secure, single-use reset link.</p>
        {message ? <div role="status" className="mt-6 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4 text-sm text-cyan-100">{message}</div> : null}
        <form onSubmit={submit} className="mt-7 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required className="h-12 border-white/15 bg-black/20" />
          </div>
          <Button type="submit" disabled={loading} className="h-12 w-full bg-gradient-to-r from-cyan-400 to-violet-500 font-bold">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Send reset link
          </Button>
        </form>
      </section>
    </main>
  )
}
