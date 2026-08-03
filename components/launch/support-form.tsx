"use client"

import { useState } from "react"
import { CheckCircle2, Loader2, Send } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

const initialForm = { name: "", email: "", category: "product", subject: "", message: "" }

export function SupportForm() {
  const [form, setForm] = useState(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [reference, setReference] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const response = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || "Your support request could not be saved.")
      setReference(payload.reference)
      setForm(initialForm)
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Your support request could not be saved.")
    } finally {
      setSubmitting(false)
    }
  }

  if (reference) {
    return (
      <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/10 p-8 text-center" role="status">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400" />
        <h2 className="mt-5 text-2xl font-bold text-white">Support request received</h2>
        <p className="mt-3 text-white/60">Keep this reference for follow-up: <strong className="text-white">{reference}</strong></p>
        <Button variant="outline" className="mt-6 border-white/10" onClick={() => setReference(null)}>Send another request</Button>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-5 rounded-2xl border border-white/10 bg-white/[0.035] p-6 glass sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="support-name">Name</Label>
          <Input id="support-name" required maxLength={120} value={form.name} onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="support-email">Email</Label>
          <Input id="support-email" type="email" required maxLength={200} value={form.email} onChange={(event) => setForm((value) => ({ ...value, email: event.target.value }))} />
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="support-category">Category</Label>
          <select id="support-category" value={form.category} onChange={(event) => setForm((value) => ({ ...value, category: event.target.value }))} className="h-10 w-full rounded-md border border-white/10 bg-background px-3 text-sm">
            <option value="product">Product help</option>
            <option value="account">Account access</option>
            <option value="billing">Billing</option>
            <option value="deployment">Deployment</option>
            <option value="security">Security</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="support-subject">Subject</Label>
          <Input id="support-subject" required minLength={4} maxLength={160} value={form.subject} onChange={(event) => setForm((value) => ({ ...value, subject: event.target.value }))} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="support-message">How can we help?</Label>
        <Textarea id="support-message" required minLength={20} maxLength={5000} rows={7} value={form.message} onChange={(event) => setForm((value) => ({ ...value, message: event.target.value }))} placeholder="Include the steps you took and the exact error shown. Never include passwords or API keys." />
      </div>
      {error && <p role="alert" className="rounded-xl border border-red-400/25 bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
      <Button type="submit" size="lg" disabled={submitting} className="w-full bg-gradient-to-r from-cyan-500 to-violet-500">
        {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
        {submitting ? "Saving request…" : "Send support request"}
      </Button>
    </form>
  )
}
