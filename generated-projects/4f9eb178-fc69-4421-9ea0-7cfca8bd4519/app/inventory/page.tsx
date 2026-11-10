'use client';

import { useEffect, useMemo, useState } from 'react';

type Product = {
  id: number;
  product_name: string;
  sku: string;
  category: string;
  cost_price: number;
  selling_price: number;
  vat_percent: number;
  stock_quantity: number;
  minimum_stock: number;
  unit: string;
  supplier: string;
  active: boolean;
};

const tenantHeaders = { 'x-company-id': 'saffron' };
const units = ['Each', 'Kg', 'Gram', 'Litre', 'Box', 'Pack'];

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [productName, setProductName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [vatPercent, setVatPercent] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [minimumStock, setMinimumStock] = useState('');
  const [unit, setUnit] = useState('Each');
  const [supplier, setSupplier] = useState('');
  const [active, setActive] = useState(true);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadProducts = async () => {
    const res = await fetch('/api/products', { headers: tenantHeaders });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load products');
    setProducts(data.rows || []);
  };

  useEffect(() => {
    loadProducts().catch((err) => setError(err.message));
  }, []);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return products;
    return products.filter((p) =>
      p.product_name.toLowerCase().includes(term) ||
      p.sku.toLowerCase().includes(term) ||
      p.category.toLowerCase().includes(term) ||
      p.supplier.toLowerCase().includes(term)
    );
  }, [products, search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      const payload = {
        product_name: productName,
        sku,
        category,
        cost_price: Number(costPrice),
        selling_price: Number(sellingPrice),
        vat_percent: Number(vatPercent),
        stock_quantity: Number(stockQuantity),
        minimum_stock: Number(minimumStock),
        unit,
        supplier,
        active,
      };
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...tenantHeaders },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add product');
      await loadProducts();
      setProductName('');
      setSku('');
      setCategory('');
      setCostPrice('');
      setSellingPrice('');
      setVatPercent('');
      setStockQuantity('');
      setMinimumStock('');
      setUnit('Each');
      setSupplier('');
      setActive(true);
      setMessage('Product added successfully');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-w-0 space-y-8 overflow-x-hidden">
      <h1 className="text-3xl font-bold text-deepgreen">Inventory</h1>
      <div className="card-gold min-w-0">
        <h2 className="mb-4 text-xl font-semibold">Add Product</h2>
        <form onSubmit={handleSubmit} className="min-w-0 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div><label className="label">Product Name</label><input className="input w-full min-w-0" value={productName} onChange={(e) => setProductName(e.target.value)} required /></div>
            <div><label className="label">SKU</label><input className="input w-full min-w-0" value={sku} onChange={(e) => setSku(e.target.value)} required /></div>
            <div><label className="label">Category</label><input className="input w-full min-w-0" value={category} onChange={(e) => setCategory(e.target.value)} required /></div>
            <div><label className="label">Supplier</label><input className="input w-full min-w-0" value={supplier} onChange={(e) => setSupplier(e.target.value)} /></div>
            <div><label className="label">Cost Price</label><input type="number" step="0.01" min="0" className="input w-full min-w-0" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} required /></div>
            <div><label className="label">Selling Price</label><input type="number" step="0.01" min="0" className="input w-full min-w-0" value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)} required /></div>
            <div><label className="label">VAT %</label><input type="number" step="0.01" min="0" className="input w-full min-w-0" value={vatPercent} onChange={(e) => setVatPercent(e.target.value)} required /></div>
            <div><label className="label">Stock Quantity</label><input type="number" min="0" className="input w-full min-w-0" value={stockQuantity} onChange={(e) => setStockQuantity(e.target.value)} required /></div>
            <div><label className="label">Minimum Stock</label><input type="number" min="0" className="input w-full min-w-0" value={minimumStock} onChange={(e) => setMinimumStock(e.target.value)} required /></div>
            <div><label className="label">Unit</label><select className="input w-full min-w-0" value={unit} onChange={(e) => setUnit(e.target.value)}>{units.map((u) => <option key={u} value={u}>{u}</option>)}</select></div>
          </div>
          <div className="flex items-center gap-2"><input type="checkbox" id="active" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-4 w-4" /><label htmlFor="active" className="text-sm font-medium text-gray-700">Active</label></div>
          {message && <p className="break-words text-green-600">{message}</p>}
          {error && <p className="break-words text-red-600">{error}</p>}
          <button type="submit" className="btn-primary">Add Product</button>
        </form>
      </div>
      <div className="card-gold min-w-0 overflow-hidden">
        <h2 className="mb-4 text-xl font-semibold">Product List</h2>
        <div className="relative mb-4 min-w-0">
          <input className="input w-full min-w-0 pr-10" placeholder="Search products by name, SKU, category, or supplier..." value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search products" />
          {search && <button type="button" onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-900" aria-label="Clear product search">×</button>}
        </div>
        <div className="space-y-3 sm:hidden">
          {filteredProducts.map((p) => (
            <article key={p.id} className="min-w-0 rounded-xl border border-gray-200 bg-white/85 p-4 shadow-sm">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <h3 className="min-w-0 break-words font-semibold text-gray-900">{p.product_name}</h3>
                {!p.active && <span className="shrink-0 rounded-full bg-gray-200 px-2 py-0.5 text-xs font-bold text-gray-600">Inactive</span>}
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div><dt className="text-gray-500">SKU</dt><dd className="font-medium text-gray-900">{p.sku}</dd></div>
                <div><dt className="text-gray-500">Category</dt><dd className="font-medium text-gray-900">{p.category}</dd></div>
                <div><dt className="text-gray-500">Cost</dt><dd className="font-medium text-gray-900">£{Number(p.cost_price).toFixed(2)}</dd></div>
                <div><dt className="text-gray-500">Selling</dt><dd className="font-medium text-gray-900">£{Number(p.selling_price).toFixed(2)}</dd></div>
                <div><dt className="text-gray-500">VAT %</dt><dd className="font-medium text-gray-900">{p.vat_percent}%</dd></div>
                <div><dt className="text-gray-500">Stock</dt><dd className="font-medium text-gray-900">{p.stock_quantity} {p.unit}</dd></div>
                <div><dt className="text-gray-500">Min Stock</dt><dd className="font-medium text-gray-900">{p.minimum_stock} {p.unit}</dd></div>
                <div><dt className="text-gray-500">Supplier</dt><dd className="break-words font-medium text-gray-900">{p.supplier || '—'}</dd></div>
              </dl>
            </article>
          ))}
          {filteredProducts.length === 0 && <p className="py-6 text-center text-gray-500">No products found</p>}
        </div>
        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full text-left">
            <thead><tr className="border-b"><th className="py-2">Product</th><th className="py-2">SKU</th><th className="py-2">Category</th><th className="py-2">Cost</th><th className="py-2">Selling</th><th className="py-2">VAT %</th><th className="py-2">Stock</th><th className="py-2">Min</th><th className="py-2">Unit</th><th className="py-2">Supplier</th><th className="py-2">Status</th></tr></thead>
            <tbody>
              {filteredProducts.map((p) => (
                <tr key={p.id} className="border-b">
                  <td className="py-2">{p.product_name}</td>
                  <td className="py-2">{p.sku}</td>
                  <td className="py-2">{p.category}</td>
                  <td className="py-2">£{Number(p.cost_price).toFixed(2)}</td>
                  <td className="py-2">£{Number(p.selling_price).toFixed(2)}</td>
                  <td className="py-2">{p.vat_percent}%</td>
                  <td className="py-2">{p.stock_quantity}</td>
                  <td className="py-2">{p.minimum_stock}</td>
                  <td className="py-2">{p.unit}</td>
                  <td className="py-2">{p.supplier || '—'}</td>
                  <td className="py-2">{p.active ? 'Active' : 'Inactive'}</td>
                </tr>
              ))}
              {filteredProducts.length === 0 && <tr><td colSpan={11} className="py-6 text-center text-gray-500">No products found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
