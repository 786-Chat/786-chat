'use client';

import { useEffect, useMemo, useState } from 'react';
import { Trash2 } from 'lucide-react';

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

const formatGBP = (value: number) =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(value);

const vatAmount = (price: number, vatPercent: number) => (price * vatPercent) / 100;
const totalIncVat = (price: number, vatPercent: number) => price + vatAmount(price, vatPercent);

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

  // Edit & Delete states
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  const resetForm = () => {
    setEditingId(null);
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
  };

  const startEdit = (product: Product) => {
    setMessage('');
    setError('');
    setEditingId(product.id);
    setProductName(product.product_name);
    setSku(product.sku);
    setCategory(product.category);
    setCostPrice(String(product.cost_price));
    setSellingPrice(String(product.selling_price));
    setVatPercent(String(product.vat_percent));
    setStockQuantity(String(product.stock_quantity));
    setMinimumStock(String(product.minimum_stock));
    setUnit(product.unit);
    setSupplier(product.supplier || '');
    setActive(product.active);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
      const isEditing = editingId !== null;
      const res = await fetch(isEditing ? `/api/products/${editingId}` : '/api/products', {
        method: isEditing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', ...tenantHeaders },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || (isEditing ? 'Failed to update product' : 'Failed to add product'));
      await loadProducts();
      resetForm();
      setMessage(isEditing ? 'Product updated successfully' : 'Product added successfully');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setMessage('');
    setError('');
    try {
      const res = await fetch(`/api/products/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: tenantHeaders,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete product');
      setDeleteTarget(null);
      await loadProducts();
      setMessage('Product deleted successfully');
    } catch (err: any) {
      setError(`Delete failed: ${err.message}`);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-w-0 space-y-8 overflow-x-hidden">
      <h1 className="text-3xl font-bold text-deepgreen">Inventory</h1>
      <div className="card-gold min-w-0">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">{editingId ? 'Edit Product' : 'Add Product'}</h2>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-white/70"
            >
              Cancel edit
            </button>
          )}
        </div>
        <form onSubmit={handleSubmit} className="min-w-0 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div><label className="label">Product Name</label><input className="input w-full min-w-0" value={productName} onChange={(e) => setProductName(e.target.value)} required /></div>
            <div><label className="label">SKU</label><input className="input w-full min-w-0" value={sku} onChange={(e) => setSku(e.target.value)} required /></div>
            <div><label className="label">Category</label><input className="input w-full min-w-0" value={category} onChange={(e) => setCategory(e.target.value)} required /></div>
            <div><label className="label">Supplier</label><input className="input w-full min-w-0" value={supplier} onChange={(e) => setSupplier(e.target.value)} /></div>
            <div><label className="label">Cost Price (£)</label><input type="number" step="0.01" min="0" className="input w-full min-w-0" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} required /></div>
            <div><label className="label">Selling Price ex VAT (£)</label><input type="number" step="0.01" min="0" className="input w-full min-w-0" value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)} required /></div>
            <div><label className="label">VAT %</label><input type="number" step="0.01" min="0" className="input w-full min-w-0" value={vatPercent} onChange={(e) => setVatPercent(e.target.value)} required /></div>
            <div><label className="label">Stock Quantity</label><input type="number" min="0" className="input w-full min-w-0" value={stockQuantity} onChange={(e) => setStockQuantity(e.target.value)} required /></div>
            <div><label className="label">Minimum Stock</label><input type="number" min="0" className="input w-full min-w-0" value={minimumStock} onChange={(e) => setMinimumStock(e.target.value)} required /></div>
            <div><label className="label">Unit</label><select className="input w-full min-w-0" value={unit} onChange={(e) => setUnit(e.target.value)}>{units.map((u) => <option key={u} value={u}>{u}</option>)}</select></div>
          </div>
          <div className="flex items-center gap-2"><input type="checkbox" id="active" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-4 w-4" /><label htmlFor="active" className="text-sm font-medium text-gray-700">Active</label></div>
          {message && <p className="break-words text-green-600">{message}</p>}
          {error && <p className="break-words text-red-600">{error}</p>}
          <button type="submit" className="btn-primary">{editingId ? 'Save Changes' : 'Add Product'}</button>
        </form>
      </div>

      <div className="card-gold min-w-0 overflow-hidden">
        <h2 className="mb-4 text-xl font-semibold">Product List</h2>
        <div className="relative mb-4 min-w-0">
          <input className="input w-full min-w-0 pr-10" placeholder="Search products by name, SKU, category, or supplier..." value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search products" />
          {search && <button type="button" onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-900" aria-label="Clear product search">×</button>}
        </div>

        {/* Mobile cards */}
        <div className="space-y-3 sm:hidden">
          {filteredProducts.map((p) => {
            const vat = vatAmount(p.selling_price, p.vat_percent);
            const total = totalIncVat(p.selling_price, p.vat_percent);
            return (
              <article key={p.id} className="min-w-0 rounded-xl border border-gray-200 bg-white/85 p-4 shadow-sm">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <h3 className="min-w-0 break-words font-semibold text-gray-900">{p.product_name}</h3>
                  {!p.active && <span className="shrink-0 rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600">Inactive</span>}
                </div>
                <p className="mt-1 break-all text-sm text-gray-500">{p.sku} · {p.category}</p>
                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div><dt className="text-gray-500">Cost</dt><dd className="font-medium text-gray-900">{formatGBP(p.cost_price)}</dd></div>
                  <div><dt className="text-gray-500">Price ex VAT</dt><dd className="font-medium text-gray-900">{formatGBP(p.selling_price)}</dd></div>
                  <div><dt className="text-gray-500">VAT %</dt><dd className="font-medium text-gray-900">{p.vat_percent}%</dd></div>
                  <div><dt className="text-gray-500">VAT Amount</dt><dd className="font-medium text-gray-900">{formatGBP(vat)}</dd></div>
                  <div><dt className="text-gray-500">Total inc VAT</dt><dd className="font-medium text-gray-900">{formatGBP(total)}</dd></div>
                  <div><dt className="text-gray-500">Stock</dt><dd className="font-medium text-gray-900">{p.stock_quantity} {p.unit}</dd></div>
                </dl>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button type="button" onClick={() => startEdit(p)} className="rounded-lg border border-deepgreen px-3 py-2 text-sm font-medium text-deepgreen">Edit</button>
                  <button type="button" onClick={() => setDeleteTarget(p)} title="Delete product" aria-label="Delete product" className="ml-auto inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 p-2 text-red-600 transition hover:bg-red-100 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </article>
            );
          })}
          {filteredProducts.length === 0 && <p className="py-6 text-center text-gray-500">No products found</p>}
        </div>

        {/* Desktop table */}
        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b">
                <th className="py-2">Product</th>
                <th className="py-2">Cost</th>
                <th className="py-2">Price ex VAT</th>
                <th className="py-2">VAT %</th>
                <th className="py-2">VAT Amount</th>
                <th className="py-2">Total inc VAT</th>
                <th className="py-2">Stock</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => {
                const vat = vatAmount(p.selling_price, p.vat_percent);
                const total = totalIncVat(p.selling_price, p.vat_percent);
                return (
                  <tr key={p.id} className="border-b align-top">
                    <td className="py-2">
                      <div className="font-medium text-gray-900">{p.product_name}</div>
                      <div className="text-sm text-gray-500">{p.sku} · {p.category}</div>
                      {!p.active && <span className="mt-1 inline-block rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600">Inactive</span>}
                    </td>
                    <td className="py-2">{formatGBP(p.cost_price)}</td>
                    <td className="py-2">{formatGBP(p.selling_price)}</td>
                    <td className="py-2">{p.vat_percent}%</td>
                    <td className="py-2">{formatGBP(vat)}</td>
                    <td className="py-2">{formatGBP(total)}</td>
                    <td className="py-2">{p.stock_quantity} {p.unit}</td>
                    <td className="py-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <button type="button" onClick={() => startEdit(p)} className="text-sm font-medium text-deepgreen">Edit</button>
                        <button type="button" onClick={() => setDeleteTarget(p)} title="Delete product" aria-label="Delete product" className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 p-2 text-red-600 transition hover:bg-red-100 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredProducts.length === 0 && <tr><td colSpan={8} className="py-6 text-center text-gray-500">No products found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">Delete product?</h3>
            <p className="mt-2 text-sm text-gray-600">This product will be permanently deleted.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setDeleteTarget(null)} disabled={deleting} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Keep product</button>
              <button type="button" onClick={confirmDelete} disabled={deleting} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">{deleting ? 'Deleting...' : 'Delete permanently'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
