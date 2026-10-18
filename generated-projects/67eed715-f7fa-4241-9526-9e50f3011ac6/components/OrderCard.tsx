import Link from "next/link";

interface Order {
  id: string;
  customer: string;
  total: number;
  status: string;
}

export default function OrderCard({ order }: { order: Order }) {
  return (
    <Link href={`/orders/${order.id}`} className="card hover:shadow-lg transition block">
      <div className="flex justify-between items-center">
        <div>
          <p className="font-semibold">Order #{order.id}</p>
          <p className="text-sm text-gray-500">{order.customer}</p>
        </div>
        <div className="text-right">
          <p className="font-bold">${order.total.toFixed(2)}</p>
          <span className="inline-block px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">{order.status}</span>
        </div>
      </div>
    </Link>
  );
}