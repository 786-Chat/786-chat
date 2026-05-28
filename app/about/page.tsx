"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { SpaceBackground } from "@/components/ui/space-background"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { motion } from "framer-motion"
import { 
  Sparkles,
  ArrowRight,
  Globe,
  ShoppingCart,
  UtensilsCrossed,
  Monitor,
  Truck,
  Store,
  Heart,
  Target,
  Users,
  Zap
} from "lucide-react"

const stats = [
  { value: "500+", label: "Businesses Launched" },
  { value: "50+", label: "Theme Templates" },
  { value: "24/7", label: "Support Available" },
  { value: "99.9%", label: "Uptime Guaranteed" },
]

const values = [
  {
    icon: Heart,
    title: "Customer First",
    description: "We build for our customers. Every feature, every design decision is made with your success in mind."
  },
  {
    icon: Target,
    title: "Simple & Effective",
    description: "No complicated setups or confusing interfaces. We make powerful tools that anyone can use."
  },
  {
    icon: Zap,
    title: "Fast & Reliable",
    description: "Your website needs to be fast. We ensure lightning-fast load times and 99.9% uptime."
  },
  {
    icon: Users,
    title: "Local Focus",
    description: "We specialize in helping local businesses succeed online, with features designed for your needs."
  },
]

const services = [
  { icon: Globe, label: "Professional Websites" },
  { icon: UtensilsCrossed, label: "Menu Builders" },
  { icon: ShoppingCart, label: "Online Ordering" },
  { icon: Monitor, label: "Kitchen Displays" },
  { icon: Truck, label: "Delivery Systems" },
  { icon: Store, label: "Marketplace Listings" },
]

export default function AboutPage() {
  return (
    <main className="relative min-h-screen bg-background overflow-hidden">
      <SpaceBackground />
      
      <div className="relative z-10">
        <Navbar />
        
        {/* Hero Section */}
        <section className="pt-40 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="max-w-3xl">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-white/10 mb-6"
              >
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-medium text-white/80">About Us</span>
              </motion.div>
              
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6"
              >
                <span className="text-white">Helping local businesses</span>
                <span className="block gradient-text mt-2">succeed online</span>
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-lg text-white/60 mb-8 leading-relaxed"
              >
                MujeebProAI helps restaurants, takeaways, cafes, and local businesses 
                launch professional websites, ordering systems, and digital tools quickly.
                We believe every business deserves a powerful online presence, 
                regardless of technical expertise.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-wrap gap-4"
              >
                <Button asChild size="lg" className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:opacity-90">
                  <Link href="/register">
                    Start Your Website
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white/10 hover:bg-white/5">
                  <Link href="/contact">Contact Us</Link>
                </Button>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="grid grid-cols-2 md:grid-cols-4 gap-8"
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="text-4xl sm:text-5xl font-bold gradient-text mb-2">
                    {stat.value}
                  </div>
                  <div className="text-white/60">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* What We Do Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                What we do
              </h2>
              <p className="text-white/60 max-w-2xl mx-auto">
                We provide everything local businesses need to succeed online
              </p>
            </motion.div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service, index) => (
                <motion.div
                  key={service.label}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="glass rounded-2xl border border-white/5 p-6 hover:border-white/10 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-purple-500 p-0.5">
                      <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-background/90">
                        <service.icon className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <span className="text-lg font-semibold text-white">{service.label}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Our Values Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Our values
              </h2>
              <p className="text-white/60 max-w-2xl mx-auto">
                The principles that guide everything we do
              </p>
            </motion.div>

            <div className="grid gap-8 md:grid-cols-2">
              {values.map((value, index) => (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="glass rounded-2xl border border-white/5 p-8"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-purple-500 p-0.5 mb-6">
                    <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-background/90">
                      <value.icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{value.title}</h3>
                  <p className="text-white/60 leading-relaxed">{value.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass rounded-3xl border border-white/10 p-12"
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Ready to grow your business?
              </h2>
              <p className="text-white/60 text-lg mb-8 max-w-2xl mx-auto">
                Join hundreds of local businesses already using MujeebProAI.
                Get started today with a free consultation.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button asChild size="lg" className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:opacity-90">
                  <Link href="/themes">
                    Browse Themes
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white/10 hover:bg-white/5">
                  <Link href="/contact">Contact Support</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        <Footer />
      </div>
    </main>
  )
}
