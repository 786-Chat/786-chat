import { ConfirmationHero } from "@/components/ConfirmationHero";
import { CapabilityOrbit } from "@/components/CapabilityOrbit";
import { InteractiveDemo } from "@/components/InteractiveDemo";
import { TrustLayer } from "@/components/TrustLayer";
import { Plans } from "@/components/Plans";
import { ActionTray } from "@/components/ActionTray";

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_15%_0%,rgba(79,70,229,0.35),transparent_60%),radial-gradient(50%_40%_at_90%_10%,rgba(6,182,212,0.28),transparent_60%),radial-gradient(45%_45%_at_60%_100%,rgba(124,58,237,0.28),transparent_60%)]" />
      <ConfirmationHero />
      <CapabilityOrbit />
      <InteractiveDemo />
      <TrustLayer />
      <Plans />
      <ActionTray />
      <footer className="border-t border-white/10 bg-white/5 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-slate-300 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="font-semibold text-white">786.Chat</p>
          <p>Single-route confirmation workspace.</p>
        </div>
      </footer>
    </main>
  );
}
