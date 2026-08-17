import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import OrderCard from "@/components/OrderCard";

const orders = [
  { id: "1001", customer: "John Doe", total: 45.5, status: "Completed" },
  { id: "1002", customer: "Jane Smith", total: 78.2, status: "Pending" },
  { id: "1003", customer: "Bob Johnson", total: 32.0, status: "Preparing" },
];

export default function OrdersPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-serif mb-6">Orders</h1>
        <div className="grid gap-4">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}