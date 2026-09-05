import Link from "next/link";
import { Coffee, Users, TrendingUp, ShoppingBag } from "lucide-react";

export default function DashboardPage() {
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
            <Link href="/login" className="text-sm font-medium text-slate-300 hover:text-cyan-400">Login</Link>
            <Link href="/dashboard" className="text-sm font-medium text-cyan-400">Dashboard</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-10">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="mt-2 text-slate-400">Welcome back! Here&apos;s your coffee shop overview.</p>

        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-cyan-500/20 bg-[#0d1526] p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-slate-400">Total Sales</h3>
              <TrendingUp className="h-5 w-5 text-green-400" />
            </div>
            <p className="mt-2 text-3xl font-bold">$12,345</p>
            <p className="mt-1 text-xs text-green-400">+12% from last month</p>
          </div>

          <div className="rounded-xl border border-cyan-500/20 bg-[#0d1526] p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-slate-400">Orders</h3>
              <ShoppingBag className="h-5 w-5 text-cyan-400" />
            </div>
            <p className="mt-2 text-3xl font-bold">1,234</p>
            <p className="mt-1 text-xs text-cyan-400">+8% from last month</p>
          </div>

          <div className="rounded-xl border border-cyan-500/20 bg-[#0d1526] p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-slate-400">Customers</h3>
              <Users className="h-5 w-5 text-amber-400" />
            </div>
            <p className="mt-2 text-3xl font-bold">890</p>
            <p className="mt-1 text-xs text-amber-400">+5% from last month</p>
          </div>

          <div className="rounded-xl border border-cyan-500/20 bg-[#0d1526] p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-slate-400">Avg. Order</h3>
              <Coffee className="h-5 w-5 text-red-400" />
            </div>
            <p className="mt-2 text-3xl font-bold">$10.50</p>
            <p className="mt-1 text-xs text-red-400">+2% from last month</p>
          </div>
        </div>

        <div className="mt-8 rounded-xl border border-cyan-500/20 bg-[#0d1526] p-6">
          <h2 className="text-xl font-semibold">Recent Orders</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400">
                  <th className="pb-2">Order</th>
                  <th className="pb-2">Customer</th>
                  <th className="pb-2">Items</th>
                  <th className="pb-2">Total</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                <tr>
                  <td className="py-3">#1001</td>
                  <td>John Doe</td>
                  <td>2</td>
                  <td>$18.50</td>
                  <td><span className="rounded-full bg-green-500/20 px-2 py-1 text-xs text-green-400">Completed</span></td>
                </tr>
                <tr>
                  <td className="py-3">#1002</td>
                  <td>Jane Smith</td>
                  <td>1</td>
                  <td>$5.00</td>
                  <td><span className="rounded-full bg-amber-500/20 px-2 py-1 text-xs text-amber-400">Pending</span></td>
                </tr>
                <tr>
                  <td className="py-3">#1003</td>
                  <td>Bob Johnson</td>
                  <td>3</td>
                  <td>$22.75</td>
                  <td><span className="rounded-full bg-cyan-500/20 px-2 py-1 text-xs text-cyan-400">In Progress</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
