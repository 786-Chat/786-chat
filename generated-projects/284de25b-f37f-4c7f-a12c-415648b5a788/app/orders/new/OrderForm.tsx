'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

type Customer = { id: string; name: string };
type Product = { id: string; name: string; sku: string; price: number | string; stock: number };
type OrderLine = { product_id: string; quantity: number };

export default function OrderForm({ customers, products }: { customers: Customer[]; products: Product[] }) {
  const router = useRouter();
  const [customerId, setCustomerId] = useState('');
  const [status, setStatus] = useState('pending');
  const [items, setItems] = useState<OrderLine[]>([{ product_id: '', quantity: 1 }]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const total = useMemo(() => items.reduce((sum, item) => {
    const product = products.find((p) => p.id === item.product_id);
    return sum + (product ? Number(product.price) * Math.max(0, item.quantity) : 0);
  }, 0), [items, products]);

  function updateLine(index: number, patch: Partial<OrderLine>) { setItems((current) => current.map((item, i) => i === index ? { ...item, ...patch } : item)); }
  function addLine() { setItems((current) => [...current, { product_id: '', quantity: 1 }]); }
  function removeLine(index: number) { setItems((current) => current.length === 1 ? current : current.filter((_, i) => i !== index)); }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const validItems = items.filter((item) => item.product_id && item.quantity > 0);
    if (!customerId) return setError('Select a customer');
    if (!validItems.length) return setError('Add at least one product');
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customer_id: customerId, status, items: validItems }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Failed to create order');
      router.push('/orders');
      router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : 'An error occurred'); } finally { setIsSubmitting(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-lg bg-white p-6 shadow">
      <div><label className="label">Customer</label><select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="input" required><option value="">Select a customer</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}</select></div>
      <div><label className="label">Status</label><select value={status} onChange={(e) => setStatus(e.target.value)} className="input"><option value="pending">Pending</option><option value="in_transit">In Transit</option><option value="delivered">Delivered</option><option value="cancelled">Cancelled</option></select></div>
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3"><label className="label">Products</label><button type="button" onClick={addLine} className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"><Plus size={15} /> Add Product</button></div>
        {products.length === 0 && <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">No products available. <Link href="/products" className="font-medium underline">Add a product first</Link>.</div>}
        {items.map((item, index) => {
          const selected = products.find((p) => p.id === item.product_id);
          const lineTotal = selected ? Number(selected.price) * Math.max(0, item.quantity) : 0;
          return <div key={index} className="grid gap-3 rounded-md border border-slate-200 p-3 sm:grid-cols-[1fr_100px_110px_40px] sm:items-end">
            <div><label className="block text-xs font-medium text-slate-500">Product</label><select value={item.product_id} onChange={(e) => updateLine(index, { product_id: e.target.value })} className="input mt-1" required><option value="">Select product</option>{products.map((product) => <option key={product.id} value={product.id} disabled={product.stock <= 0}>{product.name} — {product.sku} — £{Number(product.price).toFixed(2)} — stock {product.stock}</option>)}</select></div>
            <div><label className="block text-xs font-medium text-slate-500">Qty</label><input type="number" min="1" max={selected?.stock || undefined} value={item.quantity} onChange={(e) => updateLine(index, { quantity: Math.max(1, Number(e.target.value) || 1) })} className="input mt-1" required /></div>
            <div><label className="block text-xs font-medium text-slate-500">Line Total</label><div className="mt-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium">£{lineTotal.toFixed(2)}</div></div>
            <button type="button" onClick={() => removeLine(index)} disabled={items.length === 1} className="inline-flex h-10 items-center justify-center rounded-md text-red-600 hover:bg-red-50 disabled:opacity-30"><Trash2 size={17} /></button>
          </div>;
        })}
      </div>
      <div className="flex items-center justify-between rounded-md bg-slate-50 px-4 py-3"><span className="font-medium text-slate-700">Order Total</span><span className="text-xl font-bold text-slate-900">£{total.toFixed(2)}</span></div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={isSubmitting || products.length === 0} className="btn btn-primary w-full">{isSubmitting ? 'Creating...' : 'Create Order'}</button>
    </form>
  );
}
