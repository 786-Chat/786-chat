"use client"

import { motion } from "framer-motion"
import { Globe, Users, Building2, Zap, Shield, Award } from "lucide-react"

const stats = [
  { icon: Users, value: "10K+", label: "Active Users", color: "cyan" },
  { icon: Building2, value: "500+", label: "Businesses", color: "purple" },
  { icon: Globe, value: "50+", label: "Countries", color: "blue" },
  { icon: Zap, value: "99.9%", label: "Uptime", color: "green" },
]

const trustBadges = [
  { icon: Shield, text: "Enterprise Security" },
  { icon: Award, text: "ISO Certified" },
  { icon: Globe, text: "GDPR Compliant" },
]

export function Trusted() {
  return (
    <section className="relative py-20 md:py-28 overflow-hidden">
      {/* Subtle background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Trusted Worldwide
            </span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Empowering businesses and creators across the globe with intelligent AI solutions
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
              className="group"
            >
              <div className="glass rounded-2xl p-6 text-center hover:border-cyan-500/30 transition-all duration-300 hover:scale-105">
                <stat.icon className={`w-8 h-8 mx-auto mb-4 ${
                  stat.color === 'cyan' ? 'text-cyan-400' :
                  stat.color === 'purple' ? 'text-purple-400' :
                  stat.color === 'blue' ? 'text-blue-400' :
                  'text-green-400'
                } group-hover:scale-110 transition-transform`} />
                <div className="text-3xl md:text-4xl font-bold text-foreground mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-wrap justify-center gap-4"
        >
          {trustBadges.map((badge, index) => (
            <div
              key={badge.text}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full glass border border-white/5 hover:border-cyan-500/20 transition-colors"
            >
              <badge.icon className="w-5 h-5 text-cyan-400" />
              <span className="text-sm font-medium text-muted-foreground">{badge.text}</span>
            </div>
          ))}
        </motion.div>

        {/* Built by Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 border border-cyan-500/20">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
              M
            </div>
            <span className="text-foreground font-medium">
              Proudly Built by <span className="text-cyan-400">Mujeeb Sardar</span> in the United Kingdom
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
