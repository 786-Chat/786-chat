import { Gamepad2, ArrowLeft, RotateCcw } from "lucide-react";
import Link from "next/link";
import NeonDash from "./neon-dash";

export default function GamesPage() {
  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-50 border-b-2 border-cyan-400/30 bg-[#0a0a0f]/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-2">
            <Gamepad2 className="h-6 w-6 text-cyan-400" />
            <span className="font-mono text-lg font-bold tracking-widest text-cyan-300">NEON KIDS</span>
          </div>
          <nav className="flex flex-wrap items-center gap-2 font-mono text-xs uppercase tracking-wider">
            <Link href="/" className="btn-neon px-3 py-1">
              <ArrowLeft className="h-4 w-4" /> Home
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="panel p-6">
          <h1 className="font-mono text-2xl font-bold uppercase tracking-widest text-cyan-300">
            &gt; Arcade Games
          </h1>
          <p className="mt-2 font-mono text-sm text-cyan-200/80">
            Play Neon Dash — press spacebar or tap to jump over obstacles.
          </p>
          <div className="mt-6">
            <NeonDash />
          </div>
        </div>
      </section>
    </main>
  );
}
