'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function EditOrderPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [total, setTotal] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    fetch(`/api/orders/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setTotal(data.total);
        setStatus(data.status);
      });
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ total: Number(total), status }),
    });
    if (res.ok) {
      router.push('/orders');
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Edit Order</h1>
      <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow max-w-md">
        <div className="mb-4">
          <label className="block mb-1">Total</label>
          <input
            type="number"
            value={total}
            onChange={(e) => setTotal(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Save</button>
      </form>
    </div>
  );
}
