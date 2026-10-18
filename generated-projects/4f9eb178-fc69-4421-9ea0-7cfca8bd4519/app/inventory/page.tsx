'use client';

import { useEffect, useMemo, useState } from 'react';
import { Trash2, PackagePlus, Pencil, PackageMinus, Info, History } from 'lucide-react';

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
  rotation_method: 'FIFO' | 'FEFO' | 'Manual';
  storage_type: string;
  min_temperature: number | null;
  max_temperature: number | null;
  last_stock_in_at?: string | null;
  last_stock_out_at?: string | null;
  last_stock_in_date?: string | null;
  last_stock_out_date?: string | null;
  used_date?: string | null;
  best_before_date?: string | null;
  use_by_date?: string | null;
  expiry_date?: string | null;
};

type StockBatch = {
  id: number;
  batch_number: string;
  product_id: number;
  sku: string;
  product_name: string;
  qty_received: number;
  qty_remaining: number;
  unit: string;
  stock_in_date: string;
  stock_in_time: string;
  reference: string;
  supplier: string;
  best_before_date?: string | null;
  use_by_date?: string | null;
  expiry_date?: string | null;
  status: 'ACTIVE' | 'DEPLETED' | 'EXPIRED';
  created_by: string;
  created_at: string;
  received_temperature?: number | null;
  storage_type?: string | null;
  min_temperature?: number | null;
  max_temperature?: number | null;
};

type StockMovement = {
  id: number;
  product_id: number;
  sku: string;
  product_name: string;
  movement_type: 'STOCK IN' | 'STOCK OUT';
  qty_in: number | null;
  qty_out: number | null;
  previous_stock: number;
  new_stock: number;
  unit: string;
  reference: string;
  user_id: string;
  user_name: string;
  batch_number?: string | null;
  batch_allocations?: { batch_id: number; batch_number: string; qty: number }[];
  created_at: string;
};

const tenantHeaders = { 'x-company-id': 'saffron' };
const units = ['Each', 'Kg', 'Gram', 'Litre', 'Box', 'Pack'];
const storageTypes = ['Ambient / Room Temperature', 'Chilled', 'Frozen', 'Hot Holding', 'Dry Store', 'Custom'];
const currentUser = { id: 'staff-001', name: 'Mujeeb' };

const formatGBP = (value: number) =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(value);

const vatAmount = (price: number, vatPercent: number) => (price * vatPercent) / 100;
const totalIncVat = (price: number, vatPercent: number) => price + vatAmount(price, vatPercent);

function formatDate(value?: string | null) {
  if (!value) return '—';
  const raw = String(value).slice(0, 10);
  const [year, month, day] = raw.split('-').map(Number);
  if (!year || !month || !day) return value;
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function formatDateTime(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function getStockStatus(product: Product) {
  const stock = product.stock_quantity;
  const min = product.minimum_stock;
  if (stock === 0) return { label: 'OUT OF STOCK', type: 'out' as const };
  if (stock <= min) return { label: 'LOW STOCK', type: 'low' as const };
  return { label: 'NORMAL', type: 'normal' as const };
}

function getDateWarnings(product: Product) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const warnings: { label: string; type: 'red' | 'amber' }[] = [];
  if (product.expiry_date) {
    const expiry = new Date(product.expiry_date + 'T00:00:00');
    if (expiry < today) warnings.push({ label: 'EXPIRED', type: 'red' });
  }
  if (product.use_by_date) {
    const useBy = new Date(product.use_by_date + 'T00:00:00');
    if (useBy < today) warnings.push({ label: 'USE BY DATE PASSED', type: 'red' });
  }
  if (product.best_before_date) {
    const bestBefore = new Date(product.best_before_date + 'T00:00:00');
    const in7Days = new Date(today);
    in7Days.setDate(in7Days.getDate() + 7);
    if (bestBefore >= today && bestBefore <= in7Days) warnings.push({ label: 'BEST BEFORE SOON', type: 'amber' });
  }
  return warnings;
}

function getTemperatureStatus(batch: StockBatch) {
  if (batch.received_temperature == null || batch.min_temperature == null || batch.max_temperature == null) return null;
  const temp = Number(batch.received_temperature);
  const min = Number(batch.min_temperature);
  const max = Number(batch.max_temperature);
  if (temp >= min && temp <= max) return { label: 'IN RANGE', type: 'green' as const };
  return { label: 'OUT OF RANGE', type: 'amber' as const };
}

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
  const [rotationMethod, setRotationMethod] = useState<'FIFO' | 'FEFO' | 'Manual'>('FIFO');
  const [storageType, setStorageType] = useState('Ambient / Room Temperature');
  const [minTemperature, setMinTemperature] = useState('');
  const [maxTemperature, setMaxTemperature] = useState('');
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [stockInTarget, setStockInTarget] = useState<Product | null>(null);
  const [stockInQty, setStockInQty] = useState('');
  const [stockInNote, setStockInNote] = useState('');
  const [stockInBatchNumber, setStockInBatchNumber] = useState('');
  const [stockInBestBefore, setStockInBestBefore] = useState('');
  const [stockInUseBy, setStockInUseBy] = useState('');
  const [stockInExpiry, setStockInExpiry] = useState('');
  const [stockInReceivedTemp, setStockInReceivedTemp] = useState('');
  const [stockInSubmitting, setStockInSubmitting] = useState(false);

  const [stockOutTarget, setStockOutTarget] = useState<Product | null>(null);
  const [stockOutQty, setStockOutQty] = useState('');
  const [stockOutNote, setStockOutNote] = useState('');
  const [stockOutBatchId, setStockOutBatchId] = useState('');
  const [stockOutSubmitting, setStockOutSubmitting] = useState(false);

  const [detailsTarget, setDetailsTarget] = useState<Product | null>(null);
  const [detailsForm, setDetailsForm] = useState({
    used_date: '',
    best_before_date: '',
    use_by_date: '',
    expiry_date: '',
  });
  const [detailsSaving, setDetailsSaving] = useState(false);
  const [batches, setBatches] = useState<StockBatch[]>([]);

  const [showHistory, setShowHistory] = useState(false);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [historySearch, setHistorySearch] = useState('');
  const [historyType, setHistoryType] = useState('');
  const [historyDateFrom, setHistoryDateFrom] = useState('');
  const [historyDateTo, setHistoryDateTo] = useState('');
  const [historyProductId, setHistoryProductId] = useState('');
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPageSize, setHistoryPageSize] = useState(50);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [productSearch, setProductSearch] = useState('');
  const [productSearchResults, setProductSearchResults] = useState<Product[]>([]);
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [pendingMovementType, setPendingMovementType] = useState<'STOCK IN' | 'STOCK OUT' | null>(null);

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
    setRotationMethod('FIFO');
    setStorageType('Ambient / Room Temperature');
    setMinTemperature('');
    setMaxTemperature('');
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
    setRotationMethod(product.rotation_method || 'FIFO');
    setStorageType(product.storage_type || 'Ambient / Room Temperature');
    setMinTemperature(product.min_temperature != null ? String(product.min_temperature) : '');
    setMaxTemperature(product.max_temperature != null ? String(product.max_temperature) : '');
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
        rotation_method: rotationMethod,
        storage_type: storageType,
        min_temperature: minTemperature === '' ? null : Number(minTemperature),
        max_temperature: maxTemperature === '' ? null : Number(maxTemperature),
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

  const openStockIn = (product: Product) => {
    setMessage('');
    setError('');
    setStockInTarget(product);
    setStockInQty('');
    setStockInNote('');
    setStockInBatchNumber('');
    setStockInBestBefore('');
    setStockInUseBy('');
    setStockInExpiry('');
    setStockInReceivedTemp('');
  };

  const closeStockIn = () => {
    setStockInTarget(null);
    setStockInQty('');
    setStockInNote('');
    setStockInBatchNumber('');
    setStockInBestBefore('');
    setStockInUseBy('');
    setStockInExpiry('');
    setStockInReceivedTemp('');
  };

  const submitStockIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockInTarget) return;
    const qty = Number(stockInQty);
    if (!qty || qty <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }
    setStockInSubmitting(true);
    setMessage('');
    setError('');
    try {
      const res = await fetch('/api/stock-movements/transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...tenantHeaders },
        body: JSON.stringify({
          product_id: stockInTarget.id,
          movement_type: 'STOCK IN',
          qty,
          reference: stockInNote,
          user_id: currentUser.id,
          user_name: currentUser.name,
          batch_number: stockInBatchNumber || undefined,
          best_before_date: stockInBestBefore || undefined,
          use_by_date: stockInUseBy || undefined,
          expiry_date: stockInExpiry || undefined,
          received_temperature: stockInReceivedTemp === '' ? undefined : Number(stockInReceivedTemp),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update stock');
      await loadProducts();
      closeStockIn();
      setMessage('Stock added successfully');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setStockInSubmitting(false);
    }
  };

  const openStockOut = (product: Product) => {
    setMessage('');
    setError('');
    setStockOutTarget(product);
    setStockOutQty('');
    setStockOutNote('');
    setStockOutBatchId('');
  };

  const closeStockOut = () => {
    setStockOutTarget(null);
    setStockOutQty('');
    setStockOutNote('');
    setStockOutBatchId('');
  };

  const submitStockOut = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockOutTarget) return;
    const qty = Number(stockOutQty);
    if (!qty || qty <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }
    if (qty > stockOutTarget.stock_quantity) {
      setError('Not enough stock available');
      return;
    }
    if (stockOutTarget.rotation_method === 'Manual' && !stockOutBatchId) {
      setError('Please select a batch');
      return;
    }
    setStockOutSubmitting(true);
    setMessage('');
    setError('');
    try {
      const res = await fetch('/api/stock-movements/transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...tenantHeaders },
        body: JSON.stringify({
          product_id: stockOutTarget.id,
          movement_type: 'STOCK OUT',
          qty,
          reference: stockOutNote,
          user_id: currentUser.id,
          user_name: currentUser.name,
          batch_id: stockOutBatchId ? Number(stockOutBatchId) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update stock');
      await loadProducts();
      closeStockOut();
      setMessage('Stock removed successfully');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setStockOutSubmitting(false);
    }
  };

  const openDetails = async (product: Product) => {
    setMessage('');
    setError('');
    setDetailsTarget(product);
    setDetailsForm({
      used_date: product.used_date ? String(product.used_date).slice(0, 10) : '',
      best_before_date: product.best_before_date ? String(product.best_before_date).slice(0, 10) : '',
      use_by_date: product.use_by_date ? String(product.use_by_date).slice(0, 10) : '',
      expiry_date: product.expiry_date ? String(product.expiry_date).slice(0, 10) : '',
    });
    try {
      const res = await fetch(`/api/stock-batches?productId=${product.id}`, { headers: tenantHeaders });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load batches');
      setBatches(data.rows || []);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const closeDetails = () => {
    setDetailsTarget(null);
    setDetailsForm({ used_date: '', best_before_date: '', use_by_date: '', expiry_date: '' });
    setBatches([]);
  };

  const submitDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailsTarget) return;
    setDetailsSaving(true);
    setMessage('');
    setError('');
    try {
      const payload = {
        used_date: detailsForm.used_date || null,
        best_before_date: detailsForm.best_before_date || null,
        use_by_date: detailsForm.use_by_date || null,
        expiry_date: detailsForm.expiry_date || null,
      };
      const res = await fetch(`/api/products/${detailsTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...tenantHeaders },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update stock details');
      await loadProducts();
      closeDetails();
      setMessage('Stock details saved successfully');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDetailsSaving(false);
    }
  };

  const loadHistory = async () => {
    setHistoryLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (historySearch) params.set('search', historySearch);
      if (historyType) params.set('type', historyType);
      if (historyDateFrom) params.set('dateFrom', historyDateFrom);
      if (historyDateTo) params.set('dateTo', historyDateTo);
      if (historyProductId) params.set('productId', historyProductId);
      params.set('page', String(historyPage));
      params.set('pageSize', String(historyPageSize));
      const res = await fetch(`/api/stock-movements?${params}`, { headers: tenantHeaders });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load history');
      setMovements(data.rows || []);
      setHistoryTotalPages(data.totalPages || 1);
      setHistoryTotal(data.total || 0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (showHistory) {
      loadHistory();
    }
  }, [showHistory, historyPage, historyPageSize]);

  const openProductSearch = (type: 'STOCK IN' | 'STOCK OUT') => {
    setPendingMovementType(type);
    setProductSearch('');
    setProductSearchResults([]);
    setShowProductSearch(true);
  };

  const handleProductSearch = (term: string) => {
    setProductSearch(term);
    const lower = term.trim().toLowerCase();
    if (!lower) {
      setProductSearchResults([]);
      return;
    }
    const results = products.filter((p) =>
      p.sku.toLowerCase().includes(lower) || p.product_name.toLowerCase().includes(lower)
    ).slice(0, 10);
    setProductSearchResults(results);
  };

  const selectProductFromSearch = (product: Product) => {
    setShowProductSearch(false);
    setProductSearch('');
    setProductSearchResults([]);
    if (pendingMovementType === 'STOCK IN') {
      openStockIn(product);
    } else if (pendingMovementType === 'STOCK OUT') {
      openStockOut(product);
    }
    setPendingMovementType(null);
  };

  const renderStockStatus = (product: Product) => {
    const status = getStockStatus(product);
    const warnings = getDateWarnings(product);
    const badgeClass =
      status.type === 'out' ? 'bg-red-600 text-white' :
      status.type === 'low' ? 'bg-amber-500 text-white' :
      'bg-green-600 text-white';
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${badgeClass}`}>{status.label}</span>
        {warnings.map((w) => (
          <span key={w.label} className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${w.type === 'red' ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'}`}>{w.label}</span>
        ))}
      </div>
    );
  };

  const cardBorderClass = (product: Product) => {
    const status = getStockStatus(product);
    const warnings = getDateWarnings(product);
    if (status.type === 'out' || warnings.some((w) => w.type === 'red')) return 'border-red-300';
    if (status.type === 'low' || warnings.some((w) => w.type === 'amber')) return 'border-amber-300';
    return 'border-gray-200';
  };

  const formatMovementDate = (value: string) => {
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
  };

  const formatMovementTime = (value: string) => {
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }).format(date);
  };

  const activeBatches = batches.filter((b) => b.status === 'ACTIVE');

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
            <div><label className="label">Stock Rotation Method</label><select className="input w-full min-w-0" value={rotationMethod} onChange={(e) => setRotationMethod(e.target.value as 'FIFO' | 'FEFO' | 'Manual')}><option value="FIFO">FIFO</option><option value="FEFO">FEFO</option><option value="Manual">Manual</option></select></div>
            <div><label className="label">Storage Type</label><select className="input w-full min-w-0" value={storageType} onChange={(e) => setStorageType(e.target.value)}>{storageTypes.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
            <div><label className="label">Minimum Temperature (°C)</label><input type="number" step="0.1" className="input w-full min-w-0" value={minTemperature} onChange={(e) => setMinTemperature(e.target.value)} /></div>
            <div><label className="label">Maximum Temperature (°C)</label><input type="number" step="0.1" className="input w-full min-w-0" value={maxTemperature} onChange={(e) => setMaxTemperature(e.target.value)} /></div>
          </div>
          <div className="flex items-center gap-2"><input type="checkbox" id="active" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-4 w-4" /><label htmlFor="active" className="text-sm font-medium text-gray-700">Active</label></div>
          {message && <p className="break-words text-green-600">{message}</p>}
          {error && <p className="break-words text-red-600">{error}</p>}
          <button type="submit" className="btn-primary">{editingId ? 'Save Changes' : 'Add Product'}</button>
        </form>
      </div>

      <div className="card-gold min-w-0 overflow-hidden">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">Product List</h2>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => openProductSearch('STOCK IN')} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-deepgreen bg-deepgreen px-4 text-sm font-medium text-white">
              <PackagePlus className="h-4 w-4" />Stock In
            </button>
            <button type="button" onClick={() => openProductSearch('STOCK OUT')} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-amber-500 bg-amber-50 px-4 text-sm font-medium text-amber-700">
              <PackageMinus className="h-4 w-4" />Stock Out
            </button>
            <button type="button" onClick={() => setShowHistory(!showHistory)} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-blue-500 bg-blue-50 px-4 text-sm font-medium text-blue-700">
              <History className="h-4 w-4" />Stock History
            </button>
          </div>
        </div>

        <div className="relative mb-4 min-w-0">
          <input className="input w-full min-w-0 pr-10" placeholder="Search products by name, SKU, category, or supplier..." value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search products" />
          {search && <button type="button" onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-900" aria-label="Clear product search">×</button>}
        </div>

        {/* Mobile cards */}
        <div className="space-y-3 sm:hidden">
          {filteredProducts.map((p) => {
            const sellingPrice = Number(p.selling_price);
            const vatPercent = Number(p.vat_percent);
            const vat = vatAmount(sellingPrice, vatPercent);
            const total = totalIncVat(sellingPrice, vatPercent);
            return (
              <article key={p.id} className={`min-w-0 rounded-xl border bg-white/85 p-4 shadow-sm ${cardBorderClass(p)}`}>
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <h3 className="min-w-0 break-words font-semibold text-gray-900">{p.product_name}</h3>
                  {!p.active && <span className="shrink-0 rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600">Inactive</span>}
                </div>
                <div className="mt-2">{renderStockStatus(p)}</div>
                <p className="mt-1 break-all text-sm text-gray-500">{p.sku} · {p.category}</p>
                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div><dt className="text-gray-500">Cost</dt><dd className="font-medium text-gray-900">{formatGBP(p.cost_price)}</dd></div>
                  <div><dt className="text-gray-500">Price ex VAT</dt><dd className="font-medium text-gray-900">{formatGBP(sellingPrice)}</dd></div>
                  <div><dt className="text-gray-500">VAT %</dt><dd className="font-medium text-gray-900">{vatPercent}%</dd></div>
                  <div><dt className="text-gray-500">VAT Amount</dt><dd className="font-medium text-gray-900">{formatGBP(vat)}</dd></div>
                  <div><dt className="text-gray-500">Total inc VAT</dt><dd className="font-medium text-gray-900">{formatGBP(total)}</dd></div>
                  <div><dt className="text-gray-500">Stock</dt><dd className="font-medium text-gray-900">{p.stock_quantity} {p.unit}</dd></div>
                  <div><dt className="text-gray-500">Storage</dt><dd className="font-medium text-gray-900">{p.storage_type}</dd></div>
                  <div><dt className="text-gray-500">Temp Range</dt><dd className="font-medium text-gray-900">{p.min_temperature != null && p.max_temperature != null ? `${p.min_temperature}°C – ${p.max_temperature}°C` : '—'}</dd></div>
                </dl>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <button type="button" onClick={() => startEdit(p)} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-deepgreen bg-white text-sm font-medium text-deepgreen">
                    <Pencil className="h-4 w-4" />Edit
                  </button>
                  <button type="button" onClick={() => openDetails(p)} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-blue-500 bg-blue-50 text-sm font-medium text-blue-700">
                    <Info className="h-4 w-4" />Stock Details
                  </button>
                  <button type="button" onClick={() => setDeleteTarget(p)} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-red-300 bg-red-50 text-sm font-medium text-red-600">
                    <Trash2 className="h-4 w-4" />Delete
                  </button>
                </div>
              </article>
            );
          })}
          {filteredProducts.length === 0 && <p className="py-6 text-center text-gray-500">No products found</p>}
        </div>

        {/* Desktop product cards */}
        <div className="hidden sm:block">
          <div className="space-y-4">
            {filteredProducts.map((p) => {
              const sellingPrice = Number(p.selling_price);
              const vatPercent = Number(p.vat_percent);
              const vat = vatAmount(sellingPrice, vatPercent);
              const total = totalIncVat(sellingPrice, vatPercent);
              return (
                <article key={p.id} className={`flex items-stretch gap-6 rounded-xl border bg-white/85 p-6 shadow-sm ${cardBorderClass(p)}`}>
                  {/* Column 1: Product (28%) */}
                  <div className="flex min-w-0 w-[28%] flex-col justify-center border-r border-gray-200 pr-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="min-w-0 break-words text-lg font-semibold text-gray-900">{p.product_name}</h3>
                      {!p.active && <span className="shrink-0 rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600">Inactive</span>}
                    </div>
                    <div className="mt-2">{renderStockStatus(p)}</div>
                    <p className="mt-1 break-all text-sm text-gray-500">{p.sku}</p>
                    <p className="mt-1 break-words text-sm text-gray-500">{p.category}</p>
                  </div>

                  {/* Column 2: Values (32%) */}
                  <div className="flex min-w-0 w-[32%] flex-col justify-center border-r border-gray-200 pr-6">
                    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                      <dt className="whitespace-nowrap text-gray-500">Cost</dt>
                      <dd className="whitespace-nowrap text-right font-medium text-gray-900">{formatGBP(p.cost_price)}</dd>
                      <dt className="whitespace-nowrap text-gray-500">Price ex VAT</dt>
                      <dd className="whitespace-nowrap text-right font-medium text-gray-900">{formatGBP(sellingPrice)}</dd>
                      <dt className="whitespace-nowrap text-gray-500">VAT %</dt>
                      <dd className="whitespace-nowrap text-right font-medium text-gray-900">{vatPercent}%</dd>
                      <dt className="whitespace-nowrap text-gray-500">VAT Amount</dt>
                      <dd className="whitespace-nowrap text-right font-medium text-gray-900">{formatGBP(vat)}</dd>
                      <dt className="whitespace-nowrap text-gray-500">Total inc VAT</dt>
                      <dd className="whitespace-nowrap text-right font-semibold text-gray-900">{formatGBP(total)}</dd>
                    </dl>
                  </div>

                  {/* Column 3: Stock (16%) */}
                  <div className="flex min-w-0 w-[16%] flex-col justify-center border-r border-gray-200 pr-6">
                    <p className="text-sm text-gray-500">Stock</p>
                    <p className="mt-1 text-2xl font-semibold text-gray-900">{p.stock_quantity} <span className="text-base font-normal text-gray-600">{p.unit}</span></p>
                    <p className="mt-2 text-sm text-gray-500">Storage</p>
                    <p className="text-sm font-medium text-gray-900">{p.storage_type}</p>
                    <p className="mt-1 text-sm text-gray-500">Temp Range</p>
                    <p className="text-sm font-medium text-gray-900">{p.min_temperature != null && p.max_temperature != null ? `${p.min_temperature}°C – ${p.max_temperature}°C` : '—'}</p>
                  </div>

                  {/* Column 4: Actions (24%) */}
                  <div className="flex min-w-0 w-[24%] flex-col items-start justify-center gap-2">
                    <button type="button" onClick={() => startEdit(p)} className="inline-flex h-10 w-[110px] items-center justify-center gap-2 rounded-lg border border-deepgreen bg-white text-sm font-medium text-deepgreen transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-deepgreen">
                      <Pencil className="h-4 w-4" />Edit
                    </button>
                    <button type="button" onClick={() => openDetails(p)} className="inline-flex h-10 w-[110px] items-center justify-center gap-2 rounded-lg border border-blue-500 bg-blue-50 text-sm font-medium text-blue-700 transition hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <Info className="h-4 w-4" />Stock Details
                    </button>
                    <button type="button" onClick={() => setDeleteTarget(p)} title="Delete product" aria-label="Delete product" className="inline-flex h-10 w-[110px] items-center justify-center gap-2 rounded-lg border border-red-300 bg-red-50 text-sm font-medium text-red-600 transition hover:bg-red-100 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500">
                      <Trash2 className="h-4 w-4" />Delete
                    </button>
                  </div>
                </article>
              );
            })}
            {filteredProducts.length === 0 && <p className="py-6 text-center text-gray-500">No products found</p>}
          </div>
        </div>
      </div>

      {showHistory && (
        <div className="card-gold min-w-0 overflow-hidden">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Stock Movement History</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="label">Search</label>
              <input className="input w-full" placeholder="Product name or SKU" value={historySearch} onChange={(e) => setHistorySearch(e.target.value)} />
            </div>
            <div>
              <label className="label">Type</label>
              <select className="input w-full" value={historyType} onChange={(e) => setHistoryType(e.target.value)}>
                <option value="">All</option>
                <option value="STOCK IN">Stock In</option>
                <option value="STOCK OUT">Stock Out</option>
              </select>
            </div>
            <div>
              <label className="label">Date From</label>
              <input type="date" className="input w-full" value={historyDateFrom} onChange={(e) => setHistoryDateFrom(e.target.value)} />
            </div>
            <div>
              <label className="label">Date To</label>
              <input type="date" className="input w-full" value={historyDateTo} onChange={(e) => setHistoryDateTo(e.target.value)} />
            </div>
            <div>
              <label className="label">Product</label>
              <select className="input w-full" value={historyProductId} onChange={(e) => setHistoryProductId(e.target.value)}>
                <option value="">All Products</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.sku} — {p.product_name}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => { setHistoryPage(1); loadHistory(); }} className="btn-primary">Apply Filters</button>
            <button type="button" onClick={() => { setHistorySearch(''); setHistoryType(''); setHistoryDateFrom(''); setHistoryDateTo(''); setHistoryProductId(''); setHistoryPage(1); loadHistory(); }} className="btn-secondary">Reset</button>
          </div>

          {historyLoading ? (
            <p className="py-6 text-center text-gray-500">Loading history...</p>
          ) : (
            <>
              <div className="mt-4 hidden overflow-x-auto sm:block">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-300">
                      <th className="py-2 pr-4">Date</th>
                      <th className="py-2 pr-4">Time</th>
                      <th className="py-2 pr-4">SKU</th>
                      <th className="py-2 pr-4">Product</th>
                      <th className="py-2 pr-4">Type</th>
                      <th className="py-2 pr-4 text-right">Qty In</th>
                      <th className="py-2 pr-4 text-right">Qty Out</th>
                      <th className="py-2 pr-4 text-right">Previous Stock</th>
                      <th className="py-2 pr-4 text-right">New Stock</th>
                      <th className="py-2 pr-4">Batch</th>
                      <th className="py-2 pr-4">Reference</th>
                      <th className="py-2">User</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movements.map((m) => (
                      <tr key={m.id} className="border-b border-gray-200">
                        <td className="py-2 pr-4 whitespace-nowrap">{formatMovementDate(m.created_at)}</td>
                        <td className="py-2 pr-4 whitespace-nowrap">{formatMovementTime(m.created_at)}</td>
                        <td className="py-2 pr-4 whitespace-nowrap">{m.sku}</td>
                        <td className="py-2 pr-4">{m.product_name}</td>
                        <td className="py-2 pr-4">
                          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${m.movement_type === 'STOCK IN' ? 'bg-green-600 text-white' : 'bg-amber-500 text-white'}`}>{m.movement_type}</span>
                        </td>
                        <td className="py-2 pr-4 text-right">{m.qty_in ?? '—'}</td>
                        <td className="py-2 pr-4 text-right">{m.qty_out ?? '—'}</td>
                        <td className="py-2 pr-4 text-right">{m.previous_stock}</td>
                        <td className="py-2 pr-4 text-right">{m.new_stock}</td>
                        <td className="py-2 pr-4">{m.batch_number || '—'}</td>
                        <td className="py-2 pr-4">{m.reference || '—'}</td>
                        <td className="py-2">{m.user_name}</td>
                      </tr>
                    ))}
                    {movements.length === 0 && <tr><td colSpan={12} className="py-6 text-center text-gray-500">No stock movements recorded yet.</td></tr>}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 space-y-3 sm:hidden">
                {movements.map((m) => (
                  <article key={m.id} className="rounded-xl border border-gray-200 bg-white/85 p-4 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-medium text-gray-900">{formatMovementDate(m.created_at)} · {formatMovementTime(m.created_at)}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${m.movement_type === 'STOCK IN' ? 'bg-green-600 text-white' : 'bg-amber-500 text-white'}`}>{m.movement_type}</span>
                    </div>
                    <p className="mt-2 text-sm text-gray-700">{m.sku} · {m.product_name}</p>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-gray-500">Qty In:</span> <span className="font-medium">{m.qty_in ?? '—'}</span></div>
                      <div><span className="text-gray-500">Qty Out:</span> <span className="font-medium">{m.qty_out ?? '—'}</span></div>
                      <div><span className="text-gray-500">Prev Stock:</span> <span className="font-medium">{m.previous_stock}</span></div>
                      <div><span className="text-gray-500">New Stock:</span> <span className="font-medium">{m.new_stock}</span></div>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">Batch: {m.batch_number || '—'}</p>
                    <p className="mt-1 text-sm text-gray-600">Reference: {m.reference || '—'}</p>
                    <p className="mt-1 text-sm text-gray-600">User: {m.user_name}</p>
                  </article>
                ))}
                {movements.length === 0 && <p className="py-6 text-center text-gray-500">No stock movements recorded yet.</p>}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">Rows per page:</label>
                  <select className="input w-auto" value={historyPageSize} onChange={(e) => { setHistoryPageSize(Number(e.target.value)); setHistoryPage(1); }}>
                    <option value="25">25</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" disabled={historyPage <= 1} onClick={() => setHistoryPage(historyPage - 1)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium disabled:opacity-50">Previous</button>
                  <span className="text-sm text-gray-600">Page {historyPage} of {historyTotalPages}</span>
                  <button type="button" disabled={historyPage >= historyTotalPages} onClick={() => setHistoryPage(historyPage + 1)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium disabled:opacity-50">Next</button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

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

      {stockInTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">Stock In</h3>
            <p className="mt-2 text-sm text-gray-600">{stockInTarget.product_name}</p>
            <p className="mt-1 text-sm text-gray-600">SKU: {stockInTarget.sku}</p>
            <p className="mt-1 text-sm text-gray-600">Current stock: {stockInTarget.stock_quantity} {stockInTarget.unit}</p>
            <form onSubmit={submitStockIn} className="mt-4 space-y-4">
              <div>
                <label className="label">Quantity to add</label>
                <input type="number" min="1" step="1" className="input w-full" value={stockInQty} onChange={(e) => setStockInQty(e.target.value)} required />
              </div>
              <div>
                <label className="label">Batch Number (optional)</label>
                <input className="input w-full" placeholder="Auto-generated if empty" value={stockInBatchNumber} onChange={(e) => setStockInBatchNumber(e.target.value)} />
              </div>
              <div>
                <label className="label">Best Before Date (optional)</label>
                <input type="date" className="input w-full" value={stockInBestBefore} onChange={(e) => setStockInBestBefore(e.target.value)} />
              </div>
              <div>
                <label className="label">Use By Date (optional)</label>
                <input type="date" className="input w-full" value={stockInUseBy} onChange={(e) => setStockInUseBy(e.target.value)} />
              </div>
              <div>
                <label className="label">Expiry Date (optional)</label>
                <input type="date" className="input w-full" value={stockInExpiry} onChange={(e) => setStockInExpiry(e.target.value)} />
              </div>
              <div>
                <label className="label">Received Temperature °C (optional)</label>
                <input type="number" step="0.1" className="input w-full" value={stockInReceivedTemp} onChange={(e) => setStockInReceivedTemp(e.target.value)} />
              </div>
              <div>
                <label className="label">Note / Reference (optional)</label>
                <input className="input w-full" value={stockInNote} onChange={(e) => setStockInNote(e.target.value)} />
              </div>
              {error && <p className="break-words text-red-600">{error}</p>}
              <div className="flex justify-end gap-3">
                <button type="button" onClick={closeStockIn} disabled={stockInSubmitting} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={stockInSubmitting} className="rounded-lg bg-deepgreen px-4 py-2 text-sm font-semibold text-white hover:bg-opacity-90 disabled:opacity-50">{stockInSubmitting ? 'Adding...' : 'Add Stock'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {stockOutTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">Stock Out</h3>
            <p className="mt-2 text-sm text-gray-600">{stockOutTarget.product_name}</p>
            <p className="mt-1 text-sm text-gray-600">SKU: {stockOutTarget.sku}</p>
            <p className="mt-1 text-sm text-gray-600">Current stock: {stockOutTarget.stock_quantity} {stockOutTarget.unit}</p>
            <p className="mt-1 text-sm text-gray-600">Rotation: {stockOutTarget.rotation_method}</p>
            <form onSubmit={submitStockOut} className="mt-4 space-y-4">
              <div>
                <label className="label">Quantity to remove</label>
                <input type="number" min="1" step="1" className="input w-full" value={stockOutQty} onChange={(e) => setStockOutQty(e.target.value)} required />
              </div>
              {stockOutTarget.rotation_method === 'Manual' && (
                <div>
                  <label className="label">Select Batch</label>
                  <select className="input w-full" value={stockOutBatchId} onChange={(e) => setStockOutBatchId(e.target.value)} required>
                    <option value="">Select batch</option>
                    {batches.filter((b) => b.status === 'ACTIVE' && b.qty_remaining > 0).map((b) => (
                      <option key={b.id} value={b.id}>{b.batch_number} — {b.qty_remaining} {b.unit}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="label">Note / Reference (optional)</label>
                <input className="input w-full" value={stockOutNote} onChange={(e) => setStockOutNote(e.target.value)} />
              </div>
              {error && <p className="break-words text-red-600">{error}</p>}
              <div className="flex justify-end gap-3">
                <button type="button" onClick={closeStockOut} disabled={stockOutSubmitting} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={stockOutSubmitting} className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50">{stockOutSubmitting ? 'Removing...' : 'Remove Stock'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {detailsTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl bg-white p-6 shadow-xl">
            <div className="overflow-y-auto pr-1">
              <h3 className="text-lg font-semibold text-gray-900">Stock Details</h3>
              <p className="mt-2 text-sm text-gray-600">{detailsTarget.product_name}</p>
              <div className="mt-4 space-y-3">
                <div className="flex justify-between text-sm"><span className="text-gray-500">Last Stock In</span><span className="font-medium text-gray-900">{formatDateTime(detailsTarget.last_stock_in_at)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Last Stock Out</span><span className="font-medium text-gray-900">{formatDateTime(detailsTarget.last_stock_out_at)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Current Stock</span><span className="font-medium text-gray-900">{detailsTarget.stock_quantity} {detailsTarget.unit}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Minimum Stock</span><span className="font-medium text-gray-900">{detailsTarget.minimum_stock} {detailsTarget.unit}</span></div>
                <div className="flex justify-between items-center text-sm"><span className="text-gray-500">Stock Status</span>{renderStockStatus(detailsTarget)}</div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Stock Rotation</span><span className="font-medium text-gray-900">{detailsTarget.rotation_method}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Storage</span><span className="font-medium text-gray-900">{detailsTarget.storage_type}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Required Temperature</span><span className="font-medium text-gray-900">{detailsTarget.min_temperature != null && detailsTarget.max_temperature != null ? `${detailsTarget.min_temperature}°C – ${detailsTarget.max_temperature}°C` : '—'}</span></div>
              </div>
              <div className="mt-6">
                <h4 className="text-md font-semibold text-gray-900">Active Batches</h4>
                <div className="mt-2 space-y-2">
                  {batches.length === 0 && <p className="text-sm text-gray-500">No batches</p>}
                  {batches.map((b) => {
                    const tempStatus = getTemperatureStatus(b);
                    return (
                      <div key={b.id} className="rounded-lg border border-gray-200 p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-medium text-gray-900">{b.batch_number}</span>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${b.status === 'ACTIVE' ? 'bg-green-600 text-white' : b.status === 'DEPLETED' ? 'bg-gray-400 text-white' : 'bg-red-600 text-white'}`}>{b.status}</span>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                          <div><span className="text-gray-500">Stock In:</span> <span className="font-medium">{formatDate(b.stock_in_date)}</span></div>
                          <div><span className="text-gray-500">Qty Received:</span> <span className="font-medium">{b.qty_received} {b.unit}</span></div>
                          <div><span className="text-gray-500">Qty Remaining:</span> <span className="font-medium">{b.qty_remaining} {b.unit}</span></div>
                          <div><span className="text-gray-500">Best Before:</span> <span className="font-medium">{formatDate(b.best_before_date)}</span></div>
                          <div><span className="text-gray-500">Use By:</span> <span className="font-medium">{formatDate(b.use_by_date)}</span></div>
                          <div><span className="text-gray-500">Expiry:</span> <span className="font-medium">{formatDate(b.expiry_date)}</span></div>
                          <div><span className="text-gray-500">Storage:</span> <span className="font-medium">{b.storage_type || detailsTarget.storage_type}</span></div>
                          <div><span className="text-gray-500">Required:</span> <span className="font-medium">{b.min_temperature != null && b.max_temperature != null ? `${b.min_temperature}°C – ${b.max_temperature}°C` : '—'}</span></div>
                          <div><span className="text-gray-500">Received:</span> <span className="font-medium">{b.received_temperature != null ? `${b.received_temperature}°C` : '—'}</span></div>
                          <div><span className="text-gray-500">Temp Status:</span> {tempStatus ? <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${tempStatus.type === 'green' ? 'bg-green-600 text-white' : 'bg-amber-500 text-white'}`}>{tempStatus.label}</span> : <span className="font-medium">—</span>}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <form onSubmit={submitDetails} className="mt-6 space-y-4">
                <div className="space-y-4">
                  <div>
                    <label className="label">Used Date</label>
                    <div className="relative">
                      <input type="date" className="input w-full pr-10" value={detailsForm.used_date} onChange={(e) => setDetailsForm({ ...detailsForm, used_date: e.target.value })} />
                      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">📅</span>
                    </div>
                  </div>
                  <div>
                    <label className="label">Best Before Date</label>
                    <div className="relative">
                      <input type="date" className="input w-full pr-10" value={detailsForm.best_before_date} onChange={(e) => setDetailsForm({ ...detailsForm, best_before_date: e.target.value })} />
                      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">📅</span>
                    </div>
                  </div>
                  <div>
                    <label className="label">Use By Date</label>
                    <div className="relative">
                      <input type="date" className="input w-full pr-10" value={detailsForm.use_by_date} onChange={(e) => setDetailsForm({ ...detailsForm, use_by_date: e.target.value })} />
                      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">📅</span>
                    </div>
                  </div>
                  <div>
                    <label className="label">Expiry Date</label>
                    <div className="relative">
                      <input type="date" className="input w-full pr-10" value={detailsForm.expiry_date} onChange={(e) => setDetailsForm({ ...detailsForm, expiry_date: e.target.value })} />
                      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">📅</span>
                    </div>
                  </div>
                </div>
                {error && <p className="break-words text-red-600">{error}</p>}
                <div className="flex justify-end gap-3 pb-1">
                  <button type="button" onClick={closeDetails} disabled={detailsSaving} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                  <button type="submit" disabled={detailsSaving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">{detailsSaving ? 'Saving...' : 'Save Details'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showProductSearch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">Select Product for {pendingMovementType === 'STOCK IN' ? 'Stock In' : 'Stock Out'}</h3>
            <div className="mt-4">
              <label className="label">Search by SKU or Product Name</label>
              <input className="input w-full" placeholder="Type to search..." value={productSearch} onChange={(e) => handleProductSearch(e.target.value)} autoFocus />
            </div>
            <div className="mt-4 max-h-64 overflow-y-auto">
              {productSearchResults.length === 0 && productSearch && <p className="py-4 text-center text-gray-500">No products found</p>}
              {productSearchResults.map((p) => (
                <button key={p.id} type="button" onClick={() => selectProductFromSearch(p)} className="block w-full rounded-lg border border-gray-200 px-4 py-3 text-left hover:bg-gray-50">
                  <span className="font-medium text-gray-900">{p.sku}</span>
                  <span className="ml-2 text-gray-600">{p.product_name}</span>
                  <span className="ml-2 text-sm text-gray-500">Stock: {p.stock_quantity} {p.unit}</span>
                </button>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <button type="button" onClick={() => { setShowProductSearch(false); setPendingMovementType(null); }} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
