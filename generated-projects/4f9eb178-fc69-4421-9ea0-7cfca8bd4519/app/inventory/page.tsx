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
            <div>
              <label className="label" htmlFor="productName">Product Name</label>
              <input
                id="productName"
                className="input"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="sku">SKU</label>
              <input
                id="sku"
                className="input"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="category">Category</label>
              <input
                id="category"
                className="input"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="costPrice">Cost Price</label>
              <input
                id="costPrice"
                type="number"
                step="0.01"
                className="input"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="sellingPrice">Selling Price</label>
              <input
                id="sellingPrice"
                type="number"
                step="0.01"
                className="input"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="vatPercent">VAT %</label>
              <input
                id="vatPercent"
                type="number"
                step="0.01"
                className="input"
                value={vatPercent}
                onChange={(e) => setVatPercent(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="stockQuantity">Stock Quantity</label>
              <input
                id="stockQuantity"
                type="number"
                className="input"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="minimumStock">Minimum Stock</label>
              <input
                id="minimumStock"
                type="number"
                className="input"
                value={minimumStock}
                onChange={(e) => setMinimumStock(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="unit">Unit</label>
              <select
                id="unit"
                className="input"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
              >
                {units.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="supplier">Supplier</label>
              <input
                id="supplier"
                className="input"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                id="active"
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-deepgreen focus:ring-deepgreen"
              />
              <label htmlFor="active" className="label mb-0">Active</label>
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" className="btn-primary">
              {editingId ? 'Update Product' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>

      {message && <p className="text-green-700 bg-green-100 p-3 rounded">{message}</p>}
      {error && <p className="text-red-700 bg-red-100 p-3 rounded">{error}</p>}

      <div className="card-blue">
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search products..."
            className="input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b">
                <th className="py-2">Name</th>
                <th className="py-2">SKU</th>
                <th className="py-2">Category</th>
                <th className="py-2">Cost</th>
                <th className="py-2">Price</th>
                <th className="py-2">Stock</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id} className="border-b hover:bg-gray-50">
                  <td className="py-2">{product.product_name}</td>
                  <td className="py-2">{product.sku}</td>
                  <td className="py-2">{product.category}</td>
                  <td className="py-2">{product.cost_price}</td>
                  <td className="py-2">{product.selling_price}</td>
                  <td className="py-2">{product.stock_quantity}</td>
                  <td className="py-2 flex gap-2">
                    <button
                      onClick={() => startEdit(product)}
                      className="text-blue-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteTarget(product)}
                      className="text-red-600 hover:underline flex items-center gap-1"
                    >
                      <Trash2 size={16} /> Delete
                    </button>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-4 text-center text-gray-500">
                    No products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
            <p className="mb-4">
              Are you sure you want to delete <strong>{deleteTarget.product_name}</strong>?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 border rounded hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
