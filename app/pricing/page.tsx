import { Navbar } from "@/components/navbar"
import { Pricing } from "@/components/pricing"
import { Footer } from "@/components/footer"
import { SpaceBackground } from "@/components/ui/space-background"

export default function PricingPage() {
  return (
    <main className="relative min-h-screen bg-background overflow-hidden">
      {/* Animated Space Background */}
      <SpaceBackground />
      
      {/* Content */}
      <div className="relative z-10">
        <Navbar />
        <div className="pt-24">
          <Pricing />
        </div>
        <Footer />
      </div>
    </main>
  )
}
