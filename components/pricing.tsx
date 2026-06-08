"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Check, Sparkles, Globe, ShoppingCart, Crown, Code, ArrowRight } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

const packages = [
  {
    id: "basic",
    name: "Basic Website",
    description: "Perfect for local businesses",
    price: "10",
    icon: Globe,
    gradient: "from-blue-500 to-cyan-500",
    popular: false,
    features: [
      "Professional website",
      "Logo & branding setup",
      "Contact page with form",
      "Google map integration",
      "WhatsApp chat button",
      "Mobile responsive",
      "SSL certificate",
      "Custom domain",
    ],
  },
  {
    id: "ordering",
    name: "Restaurant Ordering",
    description: "Complete ordering system",
    price: "20",
    icon: ShoppingCart,
    gradient: "from-purple-500 to-pink-500",
    popular: true,
    features: [
      "Everything in Basic",
      "Online menu builder",
      "Shopping basket & cart",
      "Checkout & payments",
      "Customer dashboard",
      "Order notifications",
      "Order history",
      "Multiple payment methods",
    ],
  },
  {
    id: "full",
    name: "Full Restaurant",
    description: "Complete business solution",
    price: "99",
    icon: Crown,
    gradient: "from-amber-500 to-orange-500",
    popular: false,
    features: [
      "Everything in Ordering",
      "Kitchen display system",
      "Driver delivery system",
      "Receipt & invoices",
      "Marketplace listing",
      "Priority support",
      "Analytics dashboard",
      "Multi-location support",
    ],
  },
  {
    id: "developer",
    name: "AI Developer Help",
    description: "Premium custom support",
    price: "Custom",
    icon: Code,
    gradient: "from-violet-500 to-purple-500",
    popular: false,
    features: [
      "Paid premium assistance",
      "Custom feature development",
      "API integrations",
      "Code modifications",
      "Dedicated support",
      "Priority bug fixes",
      "Training & onboarding",
      "Consultation calls",
    ],
    contactOnly: true,
  },
]

export function Pricing() {
  return (
    <section id="pricing" className="relative py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/5 rounded-full blur-[150px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-3xl text-center mb-12"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-white/10 mb-6"
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-medium text-white/80">Pricing Plans</span>
          </motion.div>
          
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6 text-white">
            Business packages for
            <span className="block gradient-text mt-2">every need</span>
          </h2>
          <p className="text-lg text-white/60">
            Choose the perfect package for your business. Start with what you need and upgrade as you grow.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 items-start">
          {packages.map((pkg, index) => (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className={cn(
                "relative group",
                pkg.popular && "lg:-mt-4 lg:mb-4"
              )}
            >
              {/* Glow effect for popular plan */}
              {pkg.popular && (
                <div className="absolute -inset-px rounded-3xl bg-gradient-to-r from-cyan-500 via-purple-500 to-cyan-500 opacity-50 blur-lg group-hover:opacity-70 transition-opacity" />
              )}
              
              <div className={cn(
                "relative h-full overflow-hidden rounded-2xl border glass p-6 flex flex-col",
                pkg.popular
                  ? "border-cyan-500/30 bg-background/80"
                  : "border-white/10"
              )}>
                {/* Popular badge */}
                {pkg.popular && (
                  <div className="absolute top-0 right-0">
                    <div className="flex items-center gap-1.5 rounded-bl-xl rounded-tr-2xl bg-gradient-to-r from-cyan-500 to-purple-500 px-3 py-1.5 text-xs font-semibold text-white">
                      <Sparkles className="h-3 w-3" />
                      Popular
                    </div>
                  </div>
                )}

                {/* Plan header */}
                <div className="mb-4">
                  <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${pkg.gradient} p-0.5 mb-3`}>
                    <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-background/90">
                      <pkg.icon className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-white">{pkg.name}</h3>
                  <p className="text-sm text-white/50 mt-1">{pkg.description}</p>
                </div>

                {/* Price */}
                <div className="mb-4">
                  <div className="flex items-baseline gap-1">
                    {pkg.price === "Custom" ? (
                      <span className="text-3xl font-bold tracking-tight text-white">Custom</span>
                    ) : (
                      <>
                        <span className="text-3xl font-bold tracking-tight text-white">
                          £{pkg.price}
                        </span>
                        <span className="text-white/50 text-sm">/month</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-2 mb-6 flex-1">
                  {pkg.features.slice(0, 5).map((feature, i) => (
                    <motion.li 
                      key={feature} 
                      className="flex items-start gap-2"
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 + i * 0.05 }}
                    >
                      <div className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${pkg.gradient}`}>
                        <Check className="h-2.5 w-2.5 text-white" />
                      </div>
                      <span className="text-xs text-white/60">{feature}</span>
                    </motion.li>
                  ))}
                </ul>

                {/* CTA */}
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    asChild
                    className={cn(
                      "w-full h-10 text-sm font-medium",
                      pkg.popular
                        ? "bg-gradient-to-r from-cyan-500 to-purple-500 hover:opacity-90 shadow-lg shadow-cyan-500/25"
                        : "border-white/10 hover:bg-white/5"
                    )}
                    variant={pkg.popular ? "default" : "outline"}
                  >
                    <Link href={pkg.contactOnly ? "/contact" : "/register"}>
                      {pkg.contactOnly ? "Contact Us" : `Get ${pkg.name}`}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* View All Link */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <p className="text-white/50">
            Need more details?{" "}
            <Link href="/pricing" className="text-cyan-400 hover:text-cyan-300 transition-colors font-medium">
              View full pricing page
            </Link>{" "}
            or{" "}
            <Link href="/contact" className="text-cyan-400 hover:text-cyan-300 transition-colors font-medium">
              contact us
            </Link>
            .
          </p>
        </motion.div>
      </div>
    </section>
  )
}
