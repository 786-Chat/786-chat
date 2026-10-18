import Link from "next/link";
import { Activity, BarChart3, Users, GitBranch, Zap } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen grid-bg scanline relative">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="flex justify-between items-center mb-12">
          <div className="text-2xl font-bold neon-text">RUNTIME_CRM</div>
          <nav className="flex gap-4">
            <Link href="/dashboard" className="neon-button">Dashboard</Link>
            <Link href="/customers" className="neon-button">Customers</Link>
            <Link href="/pipeline" className="neon-button">Pipeline</Link>
            <Link href="/activities" className="neon-button">Activities</Link>
            <Link href="/reports" className="neon-button">Reports</Link>
          </nav>
        </header>

        {/* Hero */}
        <section className="mb-16">
          <div className="text-5xl font-bold mb-4">
            <span className="neon-text">SYSTEM</span> <span className="text-magenta">BOOT</span>
          </div>
          <p className="text-xl text-gray-400 mb-8">
            Multi-company CRM acceptance platform. Lead capture, qualification, follow-up, booking, and campaign attribution.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border border-cyan-500/50 clip-corner">
              <div className="text-cyan-400 text-sm">TENANT</div>
              <div className="text-2xl font-bold">ACME</div>
            </div>
            <div className="p-4 border border-magenta-500/50 clip-corner">
              <div className="text-magenta-400 text-sm">ROLE</div>
              <div className="text-2xl font-bold">OWNER</div>
            </div>
            <div className="p-4 border border-acid-500/50 clip-corner">
              <div className="text-acid-400 text-sm">STATUS</div>
              <div className="text-2xl font-bold pulse">ONLINE</div>
            </div>
          </div>
        </section>

        {/* Modules */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6">MODULES</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link href="/dashboard" className="p-6 border border-cyan-500/30 hover:border-cyan-500 transition clip-corner">
              <BarChart3 className="w-8 h-8 text-cyan-400 mb-2" />
              <h3 className="text-xl font-bold">Dashboard</h3>
              <p className="text-gray-400">Key metrics and system status.</p>
            </Link>
            <Link href="/customers" className="p-6 border border-cyan-500/30 hover:border-cyan-500 transition clip-corner">
              <Users className="w-8 h-8 text-cyan-400 mb-2" />
              <h3 className="text-xl font-bold">Customers</h3>
              <p className="text-gray-400">Customer 360 and lead capture.</p>
            </Link>
            <Link href="/pipeline" className="p-6 border border-cyan-500/30 hover:border-cyan-500 transition clip-corner">
              <GitBranch className="w-8 h-8 text-cyan-400 mb-2" />
              <h3 className="text-xl font-bold">Pipeline</h3>
              <p className="text-gray-400">Opportunity stages and conversion.</p>
            </Link>
            <Link href="/activities" className="p-6 border border-cyan-500/30 hover:border-cyan-500 transition clip-corner">
              <Activity className="w-8 h-8 text-cyan-400 mb-2" />
              <h3 className="text-xl font-bold">Activities</h3>
              <p className="text-gray-400">Tasks and follow-up notifications.</p>
            </Link>
            <Link href="/reports" className="p-6 border border-cyan-500/30 hover:border-cyan-500 transition clip-corner">
              <BarChart3 className="w-8 h-8 text-cyan-400 mb-2" />
              <h3 className="text-xl font-bold">Reports</h3>
              <p className="text-gray-400">Campaign attribution and sales analytics.</p>
            </Link>
          </div>
        </section>

        {/* Live feed */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6">LIVE FEED</h2>
          <div className="border border-cyan-500/30 p-4 clip-corner">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 bg-cyan-400 rounded-full pulse"></span>
              <span className="text-cyan-400">SYSTEM ACTIVE</span>
            </div>
            <p className="text-gray-400">Monitoring tenant operations...</p>
          </div>
        </section>

        {/* Access tiers */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6">ACCESS TIERS</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 border border-cyan-500/30">
              <div className="text-cyan-400 font-bold">OWNER</div>
              <div className="text-sm text-gray-400">Full access</div>
            </div>
            <div className="p-4 border border-cyan-500/30">
              <div className="text-cyan-400 font-bold">MANAGER</div>
              <div className="text-sm text-gray-400">Manage pipeline</div>
            </div>
            <div className="p-4 border border-cyan-500/30">
              <div className="text-cyan-400 font-bold">AGENT</div>
              <div className="text-sm text-gray-400">Capture leads</div>
            </div>
            <div className="p-4 border border-cyan-500/30">
              <div className="text-cyan-400 font-bold">AUDITOR</div>
              <div className="text-sm text-gray-400">Read-only</div>
            </div>
          </div>
        </section>

        {/* Connect */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6">CONNECT</h2>
          <div className="flex gap-4">
            <Link href="/dashboard" className="neon-button">Enter System</Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-cyan-500/30 pt-4 text-sm text-gray-500">
          <div className="flex justify-between">
            <span>RUNTIME_CRM v1.0</span>
            <span>NETWORK: <span className="text-cyan-400 pulse">STABLE</span></span>
          </div>
        </footer>
      </div>
    </main>
  );
}
