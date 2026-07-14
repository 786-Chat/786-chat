"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { SpaceBackground } from "@/components/ui/space-background"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { motion } from "framer-motion"
import { useState } from "react"
import {
  Sparkles,
  Send,
  Phone,
  Mail,
  MessageCircle,
  Loader2,
  CheckCircle,
  ArrowRight,
} from "lucide-react"

const businessTypes = [
  "Restaurant",
  "Takeaway",
  "Cafe",
  "Pizza Shop",
  "Fast Food",
  "Bakery",
  "Salon / Barber",
  "Retail Shop",
  "Other Local Business",
]

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    businessType: "",
    message: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsSubmitting(false)
    setIsSubmitted(true)
  }

  const handleChange = (field: string, value: string) => {
    setFormData((previous) => ({ ...previous, [field]: value }))
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <SpaceBackground />
      <div className="relative z-10">
        <Navbar />

        <section className="px-4 pb-12 pt-44 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 glass"
            >
              <Sparkles className="h-4 w-4 text-cyan-400" />
              <span className="text-sm font-medium text-white/80">Contact 786 Chat AI</span>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl"
            >
              <span className="text-white">Get in touch</span>
              <span className="mt-2 block gradient-text">we&apos;re here to help</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mx-auto max-w-2xl text-lg text-white/60"
            >
              Questions about AI project generation, editing, collaboration or deployment? Send us a message and our team will help.
            </motion.p>
          </div>
        </section>

        <section className="px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-12 lg:grid-cols-2">
              <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                <div className="rounded-2xl border border-white/10 p-8 glass">
                  {isSubmitted ? (
                    <div className="py-12 text-center">
                      <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-500">
                        <CheckCircle className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="mb-4 text-2xl font-bold text-white">Message sent</h3>
                      <p className="mb-8 text-white/60">Thank you for contacting us. We&apos;ll get back to you within 24 hours.</p>
                      <Button
                        onClick={() => {
                          setIsSubmitted(false)
                          setFormData({ name: "", email: "", phone: "", businessType: "", message: "" })
                        }}
                        variant="outline"
                        className="border-white/10"
                      >
                        Send another message
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid gap-6 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="name" className="text-white">Name *</Label>
                          <Input id="name" value={formData.name} onChange={(event) => handleChange("name", event.target.value)} placeholder="Your name" required className="border-white/10 bg-white/5 focus:border-cyan-500" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-white">Email *</Label>
                          <Input id="email" type="email" value={formData.email} onChange={(event) => handleChange("email", event.target.value)} placeholder="you@example.com" required className="border-white/10 bg-white/5 focus:border-cyan-500" />
                        </div>
                      </div>
                      <div className="grid gap-6 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="phone" className="text-white">Phone number</Label>
                          <Input id="phone" type="tel" value={formData.phone} onChange={(event) => handleChange("phone", event.target.value)} placeholder="+44 7XXX XXXXXX" className="border-white/10 bg-white/5 focus:border-cyan-500" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="businessType" className="text-white">Business type</Label>
                          <Select value={formData.businessType} onValueChange={(value) => handleChange("businessType", value)}>
                            <SelectTrigger className="border-white/10 bg-white/5 focus:border-cyan-500"><SelectValue placeholder="Select your business type" /></SelectTrigger>
                            <SelectContent>{businessTypes.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="message" className="text-white">Message *</Label>
                        <Textarea id="message" value={formData.message} onChange={(event) => handleChange("message", event.target.value)} placeholder="Tell us about your project or ask us anything..." required rows={5} className="resize-none border-white/10 bg-white/5 focus:border-cyan-500" />
                      </div>
                      <Button type="submit" disabled={isSubmitting} className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:opacity-90" size="lg">
                        {isSubmitting ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Sending...</> : <><Send className="mr-2 h-5 w-5" />Send message</>}
                      </Button>
                    </form>
                  )}
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="space-y-8">
                <div className="space-y-4">
                  <h2 className="mb-6 text-2xl font-bold text-white">Quick contact</h2>
                  <a href="https://wa.me/447XXXXXXXXX" target="_blank" rel="noopener noreferrer" className="group flex items-center gap-4 rounded-xl border border-white/5 p-4 transition-colors hover:border-green-500/30 glass">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-500"><MessageCircle className="h-6 w-6 text-white" /></div>
                    <div><p className="font-semibold text-white transition-colors group-hover:text-green-400">WhatsApp</p><p className="text-sm text-white/60">Message us instantly</p></div>
                    <ArrowRight className="ml-auto h-5 w-5 text-white/40 transition-colors group-hover:text-green-400" />
                  </a>
                  <a href="tel:+447XXXXXXXXX" className="group flex items-center gap-4 rounded-xl border border-white/5 p-4 transition-colors hover:border-cyan-500/30 glass">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500"><Phone className="h-6 w-6 text-white" /></div>
                    <div><p className="font-semibold text-white transition-colors group-hover:text-cyan-400">Phone</p><p className="text-sm text-white/60">Call us directly</p></div>
                    <ArrowRight className="ml-auto h-5 w-5 text-white/40 transition-colors group-hover:text-cyan-400" />
                  </a>
                  <a href="mailto:mujeeb@job4u.com" className="group flex items-center gap-4 rounded-xl border border-white/5 p-4 transition-colors hover:border-amber-400/30 glass">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-300 to-yellow-600"><Mail className="h-6 w-6 text-slate-950" /></div>
                    <div><p className="font-semibold text-white transition-colors group-hover:text-amber-300">Email</p><p className="text-sm text-white/60">mujeeb@job4u.com</p></div>
                    <ArrowRight className="ml-auto h-5 w-5 text-white/40 transition-colors group-hover:text-amber-300" />
                  </a>
                </div>

                <div className="rounded-xl border border-white/5 p-6 glass">
                  <h3 className="mb-2 font-semibold text-white">Response time</h3>
                  <p className="text-sm leading-relaxed text-white/60">We typically respond within 24 hours during business days. For urgent matters, please use WhatsApp or phone.</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Link href="/themes" className="group rounded-xl border border-white/5 p-6 transition-colors hover:border-cyan-500/30 glass"><h3 className="mb-2 font-semibold text-white transition-colors group-hover:text-cyan-400">Browse templates</h3><p className="text-sm text-white/60">Start from a polished project template.</p></Link>
                  <Link href="/import-website" className="group rounded-xl border border-white/5 p-6 transition-colors hover:border-purple-500/30 glass"><h3 className="mb-2 font-semibold text-white transition-colors group-hover:text-purple-400">Import website</h3><p className="text-sm text-white/60">Bring your existing site into 786 Chat AI.</p></Link>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </main>
  )
}
