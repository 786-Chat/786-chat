import { Navbar } from "@/components/navbar"
import { Hero } from "@/components/hero"
import { Features } from "@/components/features"
import { Founder } from "@/components/founder"
import { Trusted } from "@/components/trusted"
import { Pricing } from "@/components/pricing"
import { Footer } from "@/components/footer"
import { SpaceBackground } from "@/components/ui/space-background"

export default function HomePage() {
  return (
    <main className="relative min-h-screen bg-background overflow-hidden">
      {/* Animated Space Background */}
      <SpaceBackground />
      
      {/* Content */}
      <div className="relative z-10">
        <Navbar />
        <Hero />
        <Features />
        <Founder />
        <Trusted />
        <Pricing />
        <Footer />
      </div>
    </main>
  )
}
