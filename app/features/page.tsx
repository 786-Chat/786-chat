"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { SpaceBackground } from "@/components/ui/space-background"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { motion } from "framer-motion"
import { 
  Palette, 
  Globe, 
  UtensilsCrossed, 
  ShoppingCart, 
  Monitor, 
  Truck, 
  Store, 
  MapPin,
  Upload,
  Code,
  Check,
  ArrowRight,
  Sparkles
} from "lucide-react"

const features = [
  {
    icon: Palette,
    title: "Theme Marketplace",
    description: "Browse 50+ professionally designed themes for restaurants, cafes, salons, and local businesses. Each theme is mobile-responsive, SEO-optimized, and fully customizable to match your brand.",
    color: "from-pink-500 to-rose-500",
    benefits: ["50+ premium themes", "Mobile responsive", "One-click install", "Full customization"],
    cta: { label: "Browse Themes", href: "/themes" }
  },
  {
    icon: Globe,
    title: "Website Builder",
    description: "Create a professional website in minutes with our drag-and-drop builder. Add pages, customize colors, upload your logo, and publish instantly with your custom domain.",
    color: "from-blue-500 to-cyan-500",
    benefits: ["Drag & drop editor", "Custom domain", "SSL certificate", "SEO optimization"],
    cta: { label: "Start Building", href: "/register" }
  },
  {
    icon: UtensilsCrossed,
    title: "Menu Builder",
    description: "Build beautiful digital menus with categories, modifiers, dietary labels, size variants, and pricing options. Import existing menus or create from scratch with our easy editor.",
    color: "from-orange-500 to-red-500",
    benefits: ["Categories & items", "Size variants", "Dietary labels", "Bulk import"],
    cta: { label: "Start Free", href: "/register" }
  },
  {
    icon: ShoppingCart,
    title: "Online Ordering",
    description: "Accept orders online 24/7 with real-time notifications, payment processing, and automatic order confirmation. Customers can track their orders and reorder favorites.",
    color: "from-purple-500 to-pink-500",
    benefits: ["Real-time orders", "Payment processing", "Order tracking", "Customer accounts"],
    cta: { label: "Get Started", href: "/register" }
  },
  {
    icon: Monitor,
    title: "Kitchen Display System",
    description: "Streamline kitchen operations with our digital display system. See incoming orders, track prep times, mark items as ready, and manage kitchen workflow efficiently.",
    color: "from-indigo-500 to-purple-500",
    benefits: ["Order queue", "Prep timers", "Status updates", "Multi-station"],
    cta: { label: "Learn More", href: "/register" }
  },
  {
    icon: Truck,
    title: "Driver System",
    description: "Manage your delivery drivers with real-time tracking, order assignment, route optimization, and delivery status updates. Drivers get their own mobile app.",
    color: "from-green-500 to-emerald-500",
    benefits: ["Real-time tracking", "Order assignment", "Driver app", "Delivery zones"],
    cta: { label: "Get Started", href: "/register" }
  },
  {
    icon: Store,
    title: "Marketplace Listing",
    description: "Get discovered by local customers through our marketplace. Featured listings, customer reviews, and search visibility help you attract new customers.",
    color: "from-yellow-500 to-orange-500",
    benefits: ["Local visibility", "Customer reviews", "Featured spots", "Search ranking"],
    cta: { label: "Join Marketplace", href: "/register" }
  },
  {
    icon: MapPin,
    title: "Google Business Setup",
    description: "We help you set up and optimize your Google Business Profile. Get found on Google Maps, collect reviews, and appear in local search results.",
    color: "from-red-500 to-pink-500",
    benefits: ["Google Maps listing", "Review management", "Local SEO", "Business hours"],
    cta: { label: "Get Help", href: "/contact" }
  },
  {
    icon: Upload,
    title: "Import Existing Website",
    description: "Already have a website? We can import your existing design, content, and branding. Just share your URL and our team will recreate it with all our features.",
    color: "from-cyan-500 to-blue-500",
    benefits: ["Design import", "Content migration", "Brand matching", "Feature upgrade"],
    cta: { label: "Import Website", href: "/import-website" }
  },
  {
    icon: Code,
    title: "AI Developer Help",
    description: "Need custom features or changes? Our AI developer assistance provides premium support for custom coding, integrations, and advanced modifications.",
    color: "from-violet-500 to-purple-500",
    benefits: ["Custom features", "API integrations", "Priority support", "Code changes"],
    cta: { label: "Contact Us", href: "/contact" }
  },
]

export default function FeaturesPage() {
  return (
    <main className="relative min-h-screen bg-background overflow-hidden">
      <SpaceBackground />
      
      <div className="relative z-10">
        <Navbar />
        
        {/* Hero Section */}
        <section className="pt-40 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-white/10 mb-6"
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-medium text-white/80">All Features</span>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6"
            >
              <span className="text-white">Everything you need to</span>
              <span className="block gradient-text mt-2">grow your business online</span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="max-w-2xl mx-auto text-lg text-white/60 mb-10"
            >
              From professional websites to complete restaurant ordering systems,
              MujeebProAI provides all the tools you need to succeed.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-wrap justify-center gap-4"
            >
              <Button asChild size="lg" className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:opacity-90">
                <Link href="/themes">
                  <Palette className="mr-2 h-5 w-5" />
                  Browse Themes
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/10 hover:bg-white/5">
                <Link href="/import-website">
                  <Upload className="mr-2 h-5 w-5" />
                  Import Existing Website
                </Link>
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="space-y-16">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex flex-col ${index % 2 === 1 ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-8 lg:gap-16 items-center`}
                >
                  {/* Content */}
                  <div className="flex-1 max-w-xl">
                    <div className={`inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${feature.color} p-0.5 mb-6`}>
                      <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-background/90">
                        <feature.icon className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    
                    <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                      {feature.title}
                    </h2>
                    
                    <p className="text-white/60 text-lg mb-6 leading-relaxed">
                      {feature.description}
                    </p>
                    
                    <ul className="space-y-3 mb-8">
                      {feature.benefits.map((benefit) => (
                        <li key={benefit} className="flex items-center gap-3">
                          <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${feature.color}`}>
                            <Check className="h-3 w-3 text-white" />
                          </div>
                          <span className="text-white/80">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <Button asChild className={`bg-gradient-to-r ${feature.color} hover:opacity-90`}>
                      <Link href={feature.cta.href}>
                        {feature.cta.label}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                  
                  {/* Visual */}
                  <div className="flex-1 w-full max-w-lg">
                    <div className={`relative overflow-hidden rounded-2xl border border-white/10 glass p-8 bg-gradient-to-br ${feature.color} bg-opacity-5`}>
                      <div className={`absolute -inset-px rounded-2xl bg-gradient-to-br ${feature.color} opacity-10 blur-xl`} />
                      <div className="relative flex items-center justify-center h-48">
                        <feature.icon className="h-24 w-24 text-white/20" />
                      </div>
                    </div>
                  </div>
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
                Ready to get started?
              </h2>
              <p className="text-white/60 text-lg mb-8 max-w-2xl mx-auto">
                Join hundreds of businesses already using MujeebProAI to grow online.
                Start free today and upgrade as you grow.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button asChild size="lg" className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:opacity-90">
                  <Link href="/register">
                    Start Restaurant Website
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
