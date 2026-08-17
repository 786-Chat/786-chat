import Link from "next/link";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export default function CustomerCard({ customer }: { customer: Customer }) {
  return (
    <Link href={`/customers/${customer.id}`} className="card hover:shadow-lg transition block">
      <p className="font-semibold">{customer.name}</p>
      <p className="text-sm text-gray-500">{customer.email}</p>
      <p className="text-sm text-gray-500">{customer.phone}</p>
    </Link>
  );
}