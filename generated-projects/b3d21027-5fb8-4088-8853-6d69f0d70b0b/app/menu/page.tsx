import Link from "next/link";
import { Coffee } from "lucide-react";

const menuItems = [
  { name: "Espresso", price: "$3.50", description: "Rich and bold single-origin shot." },
  { name: "Cappuccino", price: "$4.50", description: "Velvety steamed milk with a thick foam." },
  { name: "Latte", price: "$4.75", description: "Smooth espresso with silky milk." },
  { name: "Mocha", price: "$5.00", description: "Espresso with chocolate and steamed milk." },
  { name: "Cold Brew", price: "$4.25", description: "Slow-steeped for a smooth, refreshing taste." },
  { name: "Pour Over", price: "$5.50", description: "Hand-crafted single-origin, brewed to order." },
];

export default function MenuPage() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-cyan-500/20 bg-[#0a0f1e]/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <Coffee className="h-8 w-8 text-cyan-400" />
            <span className="text-2xl font-bold tracking-tight">Bean House</span>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="/" className="text-sm font-medium text-slate-300 hover:text-cyan-400">Home</Link>
            <Link href="/menu" className="text-sm font-medium text-cyan-400">Menu</Link>
            <Link href="/login" className="text-sm font-medium text-slate-300 hover:text-cyan-400">Login</Link>
            <Link href="/dashboard" className="text-sm font-medium text-slate-300 hover:text-cyan-400">Dashboard</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-10">
        <h1 className="text-3xl font-bold">Our Menu</h1>
        <p className="mt-2 text-slate-400">Handcrafted coffee drinks made with premium beans.</p>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {menuItems.map((item) => (
            <div key={item.name} className="rounded-xl border border-cyan-500/20 bg-[#0d1526] p-6">
              <h3 className="text-xl font-semibold">{item.name}</h3>
              <p className="mt-2 text-slate-400">{item.description}</p>
              <p className="mt-4 text-2xl font-bold text-cyan-400">{item.price}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
