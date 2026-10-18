"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function DashboardPage() {
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/orders", { headers: { "x-company-id": "demo" } })
      .then((res) => res.json())
      .then((data) => setOrders(data.orders || []))
      .catch(() => setOrders([]));
  }, []);

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <div className="space-y-4">
        <div className="flex gap-4">
          <Button asChild>
            <Link href="/orders">View Orders</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/menu">Menu</Link>
          </Button>
        </div>
        <h2 className="text-xl font-semibold">Recent Orders</h2>
        {orders.length === 0 ? (
          <p>No orders yet.</p>
        ) : (
          <ul className="space-y-2">
            {orders.map((order) => (
              <li key={order.id} className="border p-3 rounded">
                <p>Order #{order.id}</p>
                <p>Status: {order.status}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
