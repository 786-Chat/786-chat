import { Navbar } from "@/components/navbar"
import { Hero } from "@/components/hero"
import { Footer } from "@/components/footer"
import { SpaceBackground } from "@/components/ui/space-background"

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <SpaceBackground />
      <div className="relative z-10">
        <Navbar />
        <Hero />
        <Footer />
      </div>
    </main>
  )
}
