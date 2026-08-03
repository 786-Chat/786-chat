import type { Metadata } from "next"
import { Navbar } from "@/components/navbar"
import { Pricing } from "@/components/pricing"
import { Footer } from "@/components/footer"
import { SpaceBackground } from "@/components/ui/space-background"

export const metadata: Metadata = {
  title: "Pricing | 786.Chat",
  description: "Compare Free, Pro and Business plans for AI generations, projects, deployments, custom domains and teams.",
}

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
