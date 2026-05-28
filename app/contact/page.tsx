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
  ArrowRight
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
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    setIsSubmitting(false)
    setIsSubmitted(true)
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <main className="relative min-h-screen bg-background overflow-hidden">
      <SpaceBackground />
      
      <div className="relative z-10">
        <Navbar />
        
        {/* Hero Section */}
        <section className="pt-40 pb-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-white/10 mb-6"
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-medium text-white/80">Contact Us</span>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6"
            >
              <span className="text-white">Get in touch</span>
              <span className="block gradient-text mt-2">we&apos;re here to help</span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="max-w-2xl mx-auto text-lg text-white/60"
            >
              Have questions about our services? Need help getting started?
              Fill out the form below or reach out directly.
            </motion.p>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid gap-12 lg:grid-cols-2">
              {/* Contact Form */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="glass rounded-2xl border border-white/10 p-8">
                  {isSubmitted ? (
                    <div className="text-center py-12">
                      <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-500 mb-6">
                        <CheckCircle className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-4">Message Sent!</h3>
                      <p className="text-white/60 mb-8">
                        Thank you for contacting us. We&apos;ll get back to you within 24 hours.
                      </p>
                      <Button
                        onClick={() => {
                          setIsSubmitted(false)
                          setFormData({ name: "", email: "", phone: "", businessType: "", message: "" })
                        }}
                        variant="outline"
                        className="border-white/10"
                      >
                        Send Another Message
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid gap-6 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="name" className="text-white">Name *</Label>
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => handleChange("name", e.target.value)}
                            placeholder="Your name"
                            required
                            className="bg-white/5 border-white/10 focus:border-cyan-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-white">Email *</Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleChange("email", e.target.value)}
                            placeholder="you@example.com"
                            required
                            className="bg-white/5 border-white/10 focus:border-cyan-500"
                          />
                        </div>
                      </div>

                      <div className="grid gap-6 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="phone" className="text-white">Phone Number</Label>
                          <Input
                            id="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => handleChange("phone", e.target.value)}
                            placeholder="+44 7XXX XXXXXX"
                            className="bg-white/5 border-white/10 focus:border-cyan-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="businessType" className="text-white">Business Type</Label>
                          <Select
                            value={formData.businessType}
                            onValueChange={(value) => handleChange("businessType", value)}
                          >
                            <SelectTrigger className="bg-white/5 border-white/10 focus:border-cyan-500">
                              <SelectValue placeholder="Select your business type" />
                            </SelectTrigger>
                            <SelectContent>
                              {businessTypes.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="message" className="text-white">Message *</Label>
                        <Textarea
                          id="message"
                          value={formData.message}
                          onChange={(e) => handleChange("message", e.target.value)}
                          placeholder="Tell us about your project or ask us anything..."
                          required
                          rows={5}
                          className="bg-white/5 border-white/10 focus:border-cyan-500 resize-none"
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:opacity-90"
                        size="lg"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-5 w-5" />
                            Send Message
                          </>
                        )}
                      </Button>
                    </form>
                  )}
                </div>
              </motion.div>

              {/* Contact Info */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-8"
              >
                {/* Quick Contact Options */}
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-white mb-6">Quick Contact</h2>
                  
                  {/* WhatsApp */}
                  <a
                    href="https://wa.me/447XXXXXXXXX"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 glass rounded-xl border border-white/5 hover:border-green-500/30 transition-colors group"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-500">
                      <MessageCircle className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-white group-hover:text-green-400 transition-colors">
                        WhatsApp
                      </p>
                      <p className="text-white/60 text-sm">Message us instantly</p>
                    </div>
                    <ArrowRight className="ml-auto h-5 w-5 text-white/40 group-hover:text-green-400 transition-colors" />
                  </a>

                  {/* Phone */}
                  <a
                    href="tel:+447XXXXXXXXX"
                    className="flex items-center gap-4 p-4 glass rounded-xl border border-white/5 hover:border-cyan-500/30 transition-colors group"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500">
                      <Phone className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-white group-hover:text-cyan-400 transition-colors">
                        Phone
                      </p>
                      <p className="text-white/60 text-sm">Call us directly</p>
                    </div>
                    <ArrowRight className="ml-auto h-5 w-5 text-white/40 group-hover:text-cyan-400 transition-colors" />
                  </a>

                  {/* Email */}
                  <a
                    href="mailto:support@mujeebproai.com"
                    className="flex items-center gap-4 p-4 glass rounded-xl border border-white/5 hover:border-purple-500/30 transition-colors group"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
                      <Mail className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-white group-hover:text-purple-400 transition-colors">
                        Email
                      </p>
                      <p className="text-white/60 text-sm">support@mujeebproai.com</p>
                    </div>
                    <ArrowRight className="ml-auto h-5 w-5 text-white/40 group-hover:text-purple-400 transition-colors" />
                  </a>
                </div>

                {/* Response Time */}
                <div className="glass rounded-xl border border-white/5 p-6">
                  <h3 className="font-semibold text-white mb-2">Response Time</h3>
                  <p className="text-white/60 text-sm leading-relaxed">
                    We typically respond within 24 hours during business days.
                    For urgent matters, please use WhatsApp or phone.
                  </p>
                </div>

                {/* CTA Cards */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <Link
                    href="/themes"
                    className="p-6 glass rounded-xl border border-white/5 hover:border-cyan-500/30 transition-colors group"
                  >
                    <h3 className="font-semibold text-white group-hover:text-cyan-400 transition-colors mb-2">
                      Browse Themes
                    </h3>
                    <p className="text-white/60 text-sm">
                      Explore our theme marketplace
                    </p>
                  </Link>
                  <Link
                    href="/import-website"
                    className="p-6 glass rounded-xl border border-white/5 hover:border-purple-500/30 transition-colors group"
                  >
                    <h3 className="font-semibold text-white group-hover:text-purple-400 transition-colors mb-2">
                      Import Website
                    </h3>
                    <p className="text-white/60 text-sm">
                      Bring your existing site
                    </p>
                  </Link>
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
