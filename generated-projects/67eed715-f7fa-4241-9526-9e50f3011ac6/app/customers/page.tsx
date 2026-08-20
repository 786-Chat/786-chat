import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CustomerCard from "@/components/CustomerCard";

const customers = [
  { id: "1", name: "John Doe", email: "john@example.com", phone: "555-1234" },
  { id: "2", name: "Jane Smith", email: "jane@example.com", phone: "555-5678" },
  { id: "3", name: "Bob Johnson", email: "bob@example.com", phone: "555-9012" },
];

export default function CustomersPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-serif mb-6">Customers</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {customers.map((customer) => (
            <CustomerCard key={customer.id} customer={customer} />
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}