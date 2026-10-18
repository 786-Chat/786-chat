import { Gamepad2, BookOpen, Sparkles, Radio, Cpu, Zap, Star, Rocket, Music, Palette, Puzzle, Trophy } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Instrument Panel Navigation */}
      <header className="sticky top-0 z-50 border-b-2 border-cyan-400/30 bg-[#0a0a0f]/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-2">
            <Gamepad2 className="h-6 w-6 text-cyan-400" />
            <span className="font-mono text-lg font-bold tracking-widest text-cyan-300">NEON KIDS</span>
          </div>
          <nav className="flex flex-wrap items-center gap-2 font-mono text-xs uppercase tracking-wider">
            <span className="text-cyan-500">SYS:ONLINE</span>
            <span className="text-magenta-400">//</span>
            <span className="text-cyan-300">PLAYER:01</span>
            <span className="text-magenta-400">//</span>
            <span className="text-acid-300">LVL:5</span>
          </nav>
        </div>
      </header>

      {/* Hero: Terminal Statement and Luminous System Visualization */}
      <section className="relative overflow-hidden border-b-2 border-cyan-400/20">
        <div className="scanline absolute inset-0" />
        <div className="relative mx-auto flex max-w-7xl flex-col items-center gap-8 px-4 py-16 md:py-24">
          <div className="text-center">
            <p className="font-mono text-sm uppercase tracking-widest text-magenta-400">&gt; INITIALIZING FUN...</p>
            <h1 className="glitch mt-4 font-mono text-4xl font-black uppercase tracking-tight text-cyan-300 md:text-6xl">
              Welcome to the Neon Arcade
            </h1>
            <p className="mt-4 max-w-2xl font-mono text-sm text-cyan-200/80 md:text-base">
              A cyberpunk playground for kids. Play games, read stories, and explore a world of neon adventures.
            </p>
          </div>
          <div className="grid w-full max-w-4xl grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { icon: Gamepad2, label: "Games", value: "12" },
              { icon: BookOpen, label: "Stories", value: "24" },
              { icon: Sparkles, label: "Activities", value: "36" },
              { icon: Trophy, label: "Badges", value: "8" },
            ].map((item) => (
              <div key={item.label} className="panel flex flex-col items-center gap-2 p-4">
                <item.icon className="h-8 w-8 text-magenta-400" />
                <span className="font-mono text-2xl font-bold text-cyan-300">{item.value}</span>
                <span className="font-mono text-xs uppercase tracking-wider text-cyan-500">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* System Boot */}
      <section className="border-b-2 border-cyan-400/20 py-12">
        <div className="mx-auto max-w-7xl px-4">
          <div className="panel p-6">
            <h2 className="font-mono text-xl font-bold uppercase tracking-widest text-cyan-300">
              &gt; System Boot
            </h2>
            <div className="mt-4 space-y-2 font-mono text-sm text-cyan-200/80">
              <p><span className="text-magenta-400">[OK]</span> Loading neon core...</p>
              <p><span className="text-magenta-400">[OK]</span> Connecting to fun server...</p>
              <p><span className="text-magenta-400">[OK]</span> Calibrating joy sensors...</p>
              <p><span className="text-magenta-400">[OK]</span> Ready for adventure!</p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="border-b-2 border-cyan-400/20 py-12">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="panel p-6">
              <h2 className="font-mono text-xl font-bold uppercase tracking-widest text-cyan-300">
                &gt; Our Mission
              </h2>
              <p className="mt-4 font-mono text-sm text-cyan-200/80">
                To spark creativity and joy in every kid through interactive neon-powered experiences.
              </p>
            </div>
            <div className="panel p-6">
              <h2 className="font-mono text-xl font-bold uppercase tracking-widest text-cyan-300">
                &gt; How It Works
              </h2>
              <p className="mt-4 font-mono text-sm text-cyan-200/80">
                Pick a module, dive in, and earn badges as you play. Simple, safe, and super fun.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Modules */}
      <section className="border-b-2 border-cyan-400/20 py-12">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="font-mono text-2xl font-bold uppercase tracking-widest text-cyan-300">
            &gt; Modules
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Gamepad2, title: "Arcade Games", desc: "Fast-paced neon challenges.", href: "/games" },
              { icon: BookOpen, title: "Story Lab", desc: "Interactive tales with branching paths." },
              { icon: Palette, title: "Art Studio", desc: "Draw with glowing neon colors." },
              { icon: Music, title: "Sound Synth", desc: "Create your own electronic beats." },
              { icon: Puzzle, title: "Brain Teasers", desc: "Puzzles that light up your mind." },
              { icon: Rocket, title: "Space Explorer", desc: "Journey through neon galaxies." },
            ].map((mod) => (
              <div key={mod.title} className="panel group p-6 transition-all hover:border-magenta-400/50 hover:shadow-[0_0_20px_rgba(255,0,170,0.2)]">
                <mod.icon className="h-10 w-10 text-magenta-400 transition-transform group-hover:scale-110" />
                <h3 className="mt-4 font-mono text-lg font-bold text-cyan-300">{mod.title}</h3>
                <p className="mt-2 font-mono text-sm text-cyan-200/70">{mod.desc}</p>
                {mod.href && (
                  <Link href={mod.href} className="btn-neon mt-4">
                    Play Now
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Feed */}
      <section className="border-b-2 border-cyan-400/20 py-12">
        <div className="mx-auto max-w-7xl px-4">
          <div className="panel p-6">
            <h2 className="font-mono text-xl font-bold uppercase tracking-widest text-cyan-300">
              &gt; Live Feed
            </h2>
            <div className="mt-4 space-y-3 font-mono text-sm">
              {[
                { user: "PixelPirate", action: "scored 500 in Neon Dash", time: "2m ago" },
                { user: "CosmicCat", action: "finished a story", time: "5m ago" },
                { user: "TurboTurtle", action: "unlocked a badge", time: "8m ago" },
              ].map((feed) => (
                <div key={feed.user} className="flex flex-wrap items-center gap-2 border-b border-cyan-400/10 pb-2">
                  <span className="text-magenta-400">{feed.user}</span>
                  <span className="text-cyan-200/80">{feed.action}</span>
                  <span className="ml-auto text-cyan-500">{feed.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Access Tiers */}
      <section className="border-b-2 border-cyan-400/20 py-12">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="font-mono text-2xl font-bold uppercase tracking-widest text-cyan-300">
            &gt; Access Tiers
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              { name: "Rookie", price: "Free", features: ["Basic games", "2 stories", "1 badge"] },
              { name: "Pro", price: "$4/mo", features: ["All games", "All stories", "Unlimited badges"] },
              { name: "Legend", price: "$8/mo", features: ["Everything in Pro", "Early access", "Exclusive avatars"] },
            ].map((tier) => (
              <div key={tier.name} className="panel p-6">
                <h3 className="font-mono text-lg font-bold text-magenta-400">{tier.name}</h3>
                <p className="mt-2 font-mono text-2xl font-bold text-cyan-300">{tier.price}</p>
                <ul className="mt-4 space-y-2 font-mono text-sm text-cyan-200/80">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-acid-300" /> {f}
                    </li>
                  ))}
                </ul>
                <button className="btn-neon mt-6 w-full">Select</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Connect */}
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4">
          <div className="panel p-6">
            <h2 className="font-mono text-xl font-bold uppercase tracking-widest text-cyan-300">
              &gt; Connect
            </h2>
            <form className="mt-4 grid gap-4 md:grid-cols-2">
              <input type="text" placeholder="Your name" className="input-neon" />
              <input type="email" placeholder="Your email" className="input-neon" />
              <textarea placeholder="Message" className="input-neon md:col-span-2" rows={4} />
              <button type="submit" className="btn-neon md:col-span-2">Send Transmission</button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-2 border-cyan-400/20 py-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 font-mono text-xs text-cyan-500">
          <span>&gt; NEON KIDS ARCADE v1.0</span>
          <span>NETWORK: STABLE</span>
          <span>© 2024</span>
        </div>
      </footer>
    </main>
  );
}
