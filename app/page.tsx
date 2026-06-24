import { headers } from "next/headers"
import { Navbar } from "@/components/navbar"
import { Hero } from "@/components/hero"
import { Footer } from "@/components/footer"
import { SpaceBackground } from "@/components/ui/space-background"

export default async function HomePage() {
  const host = (await headers()).get("host")?.toLowerCase() || ""
  const isSevenEightSixChat = host === "786.chat" || host === "www.786.chat"

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {!isSevenEightSixChat && <SpaceBackground />}
      <div className="relative z-10">
        <Navbar />
        <Hero />
        <Footer />
      </div>
    </main>
  )
}
