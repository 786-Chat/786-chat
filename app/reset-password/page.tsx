"use client"

import Link from "next/link"
import { FormEvent, useEffect, useState } from "react"
import { CheckCircle2, Loader2, LockKeyhole } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ResetPasswordPage() {
  const [token, setToken] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [message, setMessage] = useState("")
  const [complete, setComplete] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get("token") || "")
  }, [])

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (password !== confirm) return setMessage("Passwords do not match.")
    setLoading(true)
    setMessage("")
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "This reset link is invalid or expired.")
      setComplete(true)
      setMessage("Your password has been changed and all previous sessions have been signed out.")
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "We could not reset your password.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#050814] px-4 text-white">
      <section className="w-full max-w-lg rounded-[28px] border border-white/10 bg-white/[.055] p-7 shadow-2xl backdrop-blur-2xl sm:p-10">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-violet-400/10 text-violet-200">{complete ? <CheckCircle2 className="h-7 w-7 text-emerald-300" /> : <LockKeyhole className="h-7 w-7" />}</div>
        <h1 className="mt-6 text-3xl font-black">Choose a new password</h1>
        <p className="mt-3 leading-7 text-slate-400">Use at least 10 characters with uppercase, lowercase and a number.</p>
        {message ? <div role="status" className="mt-6 rounded-2xl border border-white/15 bg-white/5 p-4 text-sm text-slate-200">{message}</div> : null}
        {complete ? (
          <Button asChild className="mt-7 h-12 w-full bg-gradient-to-r from-cyan-400 to-violet-500 font-bold"><Link href="/login">Sign in with new password</Link></Button>
        ) : (
          <form onSubmit={submit} className="mt-7 space-y-4">
            <div className="space-y-2"><Label htmlFor="password">New password</Label><Input id="password" type="password" autoComplete="new-password" minLength={10} value={password} onChange={(event) => setPassword(event.target.value)} required className="h-12 border-white/15 bg-black/20" /></div>
            <div className="space-y-2"><Label htmlFor="confirm">Confirm password</Label><Input id="confirm" type="password" autoComplete="new-password" value={confirm} onChange={(event) => setConfirm(event.target.value)} required className="h-12 border-white/15 bg-black/20" /></div>
            <Button type="submit" disabled={loading || !token} className="h-12 w-full bg-gradient-to-r from-cyan-400 to-violet-500 font-bold">{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Reset password</Button>
          </form>
        )}
      </section>
    </main>
  )
}
