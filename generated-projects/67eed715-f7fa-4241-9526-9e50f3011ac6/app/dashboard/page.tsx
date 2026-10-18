import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import StatCard from "@/components/StatCard";
import { Users, ShoppingBag, CalendarCheck, DollarSign } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-serif mb-6">Dashboard</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Revenue" value="$12,345" icon={DollarSign} trend="+12%" />
          <StatCard title="Orders" value="156" icon={ShoppingBag} trend="+8%" />
          <StatCard title="Customers" value="1,024" icon={Users} trend="+5%" />
          <StatCard title="Reservations" value="48" icon={CalendarCheck} trend="+3%" />
        </div>
      </main>
      <Footer />
    </div>
  );
}