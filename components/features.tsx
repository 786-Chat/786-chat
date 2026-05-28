"use client"

import { motion, useMotionValue, useTransform } from "framer-motion"
import { 
  Globe, 
  ShoppingCart, 
  UtensilsCrossed, 
  Truck, 
  Monitor, 
  Store,
  FileText,
  Palette,
  Sparkles
} from "lucide-react"
import { useRef } from "react"

const features = [
  {
    icon: Globe,
    title: "Business Website",
    description: "Professional website with custom domain, SEO optimization, and mobile-responsive design.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: ShoppingCart,
    title: "Online Ordering System",
    description: "Accept orders online with real-time notifications, payment processing, and order tracking.",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: UtensilsCrossed,
    title: "Menu Builder",
    description: "Easy-to-use menu builder with categories, modifiers, dietary labels, and pricing variants.",
    color: "from-orange-500 to-red-500",
  },
  {
    icon: Truck,
    title: "Delivery Driver System",
    description: "Manage delivery drivers, assign orders, and track deliveries in real-time.",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: Monitor,
    title: "Kitchen Display System",
    description: "Digital kitchen display for order management with prep timers and status updates.",
    color: "from-indigo-500 to-purple-500",
  },
  {
    icon: Store,
    title: "Marketplace Listing",
    description: "Get discovered by local customers through our marketplace with featured listings.",
    color: "from-yellow-500 to-orange-500",
  },
  {
    icon: FileText,
    title: "Receipt & Invoice System",
    description: "Professional receipts with customizable branding, VAT support, and email delivery.",
    color: "from-cyan-500 to-blue-500",
  },
  {
    icon: Palette,
    title: "Theme Marketplace",
    description: "Choose from 50+ professionally designed themes or import your existing website.",
    color: "from-pink-500 to-rose-500",
  },
]

function FeatureCard({ feature, index }: { feature: typeof features[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  
  const rotateX = useTransform(y, [-100, 100], [5, -5])
  const rotateY = useTransform(x, [-100, 100], [-5, 5])

  function handleMouse(event: React.MouseEvent<HTMLDivElement>) {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    x.set(event.clientX - rect.left - rect.width / 2)
    y.set(event.clientY - rect.top - rect.height / 2)
  }

  function handleMouseLeave() {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      onMouseMove={handleMouse}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      className="group relative"
    >
      <div className="relative overflow-hidden rounded-2xl border border-white/5 glass p-6 transition-all duration-300 hover:border-white/10">
        {/* Gradient background on hover */}
        <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
        
        {/* Glow effect */}
        <div className={`absolute -inset-px rounded-2xl bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500`} />
        
        <div className="relative" style={{ transform: "translateZ(20px)" }}>
          {/* Icon */}
          <motion.div 
            className={`mb-5 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${feature.color} p-0.5`}
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-background/90">
              <feature.icon className="h-6 w-6 text-foreground" />
            </div>
          </motion.div>
          
          {/* Content */}
          <h3 className="mb-2 text-lg font-semibold text-foreground group-hover:gradient-text transition-all">
            {feature.title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {feature.description}
          </p>
        </div>

        {/* Corner decoration */}
        <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 blur-2xl transition-opacity`} />
      </div>
    </motion.div>
  )
}

export function Features() {
  return (
    <section id="features" className="relative py-32 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 right-0 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[120px]" />
      </div>
      
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-3xl text-center mb-20"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-white/10 mb-6"
          >
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-foreground/80">Powerful Features</span>
          </motion.div>
          
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">
            Everything you need to
            <span className="block gradient-text mt-2">grow your business</span>
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            From professional websites to complete ordering systems, MujeebProAI provides
            all the tools you need to succeed online. Plus AI Developer help available as a premium option.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} />
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-20 text-center"
        >
          <p className="text-muted-foreground mb-4">
            And many more features to explore...
          </p>
          <motion.div
            className="inline-flex items-center gap-2 text-primary hover:text-accent transition-colors cursor-pointer"
            whileHover={{ x: 5 }}
          >
            <span className="font-medium">View all features</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
