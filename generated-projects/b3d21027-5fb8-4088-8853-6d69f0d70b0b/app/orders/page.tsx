"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/orders", { headers: { "x-company-id": "demo" } })
      .then((res) => res.json())
      .then((data) => setOrders(data.orders || []))
      .catch(() => setOrders([]));
  }, []);

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Orders</h1>
      <div className="space-y-4">
        {orders.length === 0 ? (
          <p>No orders found.</p>
        ) : (
          <ul className="space-y-2">
            {orders.map((order) => (
              <li key={order.id} className="border p-3 rounded">
                <p>Order #{order.id}</p>
                <p>Status: {order.status}</p>
                <p>Total: ${order.total}</p>
              </li>
            ))}
          </ul>
        )}
        <Button onClick={() => window.location.reload()}>Refresh</Button>
      </div>
    </main>
  );
}
