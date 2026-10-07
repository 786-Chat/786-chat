import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft, LogOut, Package, Users, ShoppingCart, Plus, Search, X, Trash2, Edit,
  AlertTriangle, LayoutDashboard, BarChart3, ChevronLeft, ChevronRight, Factory,
  MapPin, DollarSign, Boxes, UserPlus, TrendingUp, ClipboardList, Clock, CheckCircle, XCircle, Truck
} from "lucide-react";

export default function InventoryBrandDashboard() {
  const [, navigate] = useLocation();
  const [brand, setBrand] = useState<any>(null);
  const [tab, setTab] = useState("dashboard");
  const [products, setProducts] = useState<any[]>([]);
  const [prices, setPrices] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showNewSale, setShowNewSale] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("inventoryBrand");
    if (!stored) { navigate("/inventory-brand-login"); return; }
    setBrand(JSON.parse(stored));
  }, [navigate]);

  const fetchData = useCallback(() => {
    if (!brand) return;
    fetch("/api/inventory/products").then(r => r.json()).then(setProducts).catch(() => {});
    fetch(`/api/inventory/brands/${brand.id}/prices`).then(r => r.json()).then(setPrices).catch(() => {});
    fetch(`/api/inventory/brands/${brand.id}/customers`).then(r => r.json()).then(setCustomers).catch(() => {});
    fetch(`/api/inventory/brands/${brand.id}/sales`).then(r => r.json()).then(setSales).catch(() => {});
    fetch(`/api/inventory/orders/brand/${brand.id}`).then(r => r.json()).then(setOrders).catch(() => {});
  }, [brand]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const logout = () => { localStorage.removeItem("inventoryBrand"); navigate("/inventory-brand-login"); };

  const getProductPrice = (product: any) => {
    const p = prices.find((pr: any) => pr.productId === product.id);
    if (p) return parseFloat(p.agreedPrice);
    return product.discountedPrice ? parseFloat(product.discountedPrice) : parseFloat(product.basePrice);
  };

  const filteredProducts = products.filter((p: any) => p.name.toLowerCase().includes(search.toLowerCase()) || p.code.toLowerCase().includes(search.toLowerCase()));
  const totalSalesValue = sales.reduce((s: number, sale: any) => s + parseFloat(sale.totalPrice), 0);
  const totalCustomers = customers.length;

  if (!brand) return null;

  const sidebarItems = [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { key: "products", label: "Products", icon: Package },
    { key: "customers", label: "Customers", icon: Users },
    { key: "orders", label: "Orders", icon: ClipboardList },
    { key: "sales", label: "Sales", icon: ShoppingCart },
  ];

  return (
    <div className="min-h-screen bg-[#0f1729] flex">
      <aside className={`${sidebarOpen ? "w-64" : "w-16"} bg-[#141d33] border-r border-white/10 flex flex-col transition-all duration-300 shrink-0`}>
        <div className="p-4 border-b border-white/10 flex items-center gap-3">
          {sidebarOpen && (
            <div className="flex items-center gap-2 flex-1">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #8b5cf6, #6d28d9)" }}>
                <Factory size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-white font-bold text-sm truncate">{brand.name}</h1>
                <p className="text-white/40 text-xs">Brand Dashboard</p>
              </div>
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-white/40 hover:text-white p-1">
            {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {sidebarItems.map(item => (
            <button key={item.key} onClick={() => setTab(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === item.key ? "bg-purple-500/20 text-purple-300" : "text-white/50 hover:text-white hover:bg-white/5"}`}
              data-testid={`sidebar-${item.key}`}
            >
              <item.icon size={18} />
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10">
          <button onClick={logout} className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-all ${!sidebarOpen ? "justify-center" : ""}`} data-testid="button-logout">
            <LogOut size={16} />
            {sidebarOpen && <span>Logout</span>}
          </button>
          <button onClick={() => navigate("/")} className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-white/30 hover:text-white/60 mt-1 ${!sidebarOpen ? "justify-center" : ""}`} data-testid="button-back">
            <ArrowLeft size={16} />
            {sidebarOpen && <span>Back to Home</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        {tab === "dashboard" && (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-white mb-2">Welcome, {brand.name}</h2>
            <p className="text-white/40 mb-6">Here's your inventory overview</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[
                { label: "Products Available", value: products.length, icon: Package, color: "from-blue-500 to-indigo-500" },
                { label: "Your Customers", value: totalCustomers, icon: Users, color: "from-emerald-500 to-teal-500" },
                { label: "Total Sales", value: `£${totalSalesValue.toFixed(2)}`, icon: TrendingUp, color: "from-purple-500 to-pink-500" },
                { label: "Sales Count", value: sales.length, icon: ShoppingCart, color: "from-amber-500 to-orange-500" },
              ].map((card, i) => (
                <div key={i} className="relative overflow-hidden bg-[#1a2440] rounded-2xl border border-white/10 p-5">
                  <div className={`absolute top-0 right-0 w-20 h-20 rounded-full bg-gradient-to-br ${card.color} opacity-10 -translate-y-4 translate-x-4`} />
                  <card.icon size={20} className="text-white/30 mb-2" />
                  <div className="text-3xl font-bold text-white">{card.value}</div>
                  <div className="text-sm text-white/40">{card.label}</div>
                </div>
              ))}
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="bg-[#1a2440] rounded-2xl border border-white/10 p-5">
                <h3 className="text-white font-bold mb-3 flex items-center gap-2"><Users size={18} className="text-emerald-400" /> Recent Customers</h3>
                {customers.length === 0 ? <p className="text-white/20 text-sm">No customers yet</p> : (
                  <div className="space-y-2">{customers.slice(0, 5).map((c: any) => (
                    <div key={c.id} className="flex items-center justify-between bg-white/[0.03] rounded-xl p-3">
                      <div><div className="text-white font-medium text-sm">{c.name}</div>{c.shopName && <div className="text-white/30 text-xs">{c.shopName}</div>}</div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${c.customerType === "wholesale" ? "bg-blue-500/20 text-blue-300" : "bg-amber-500/20 text-amber-300"}`}>{c.customerType}</span>
                    </div>
                  ))}</div>
                )}
              </div>
              <div className="bg-[#1a2440] rounded-2xl border border-white/10 p-5">
                <h3 className="text-white font-bold mb-3 flex items-center gap-2"><ShoppingCart size={18} className="text-purple-400" /> Recent Sales</h3>
                {sales.length === 0 ? <p className="text-white/20 text-sm">No sales yet</p> : (
                  <div className="space-y-2">{sales.slice(0, 5).map((s: any) => {
                    const prod = products.find((p: any) => p.id === s.productId);
                    return (
                      <div key={s.id} className="flex items-center justify-between bg-white/[0.03] rounded-xl p-3">
                        <div><div className="text-white font-medium text-sm">{prod?.name || "Product"}</div><div className="text-white/30 text-xs">Qty: {s.quantity}</div></div>
                        <span className="text-emerald-400 font-bold">£{parseFloat(s.totalPrice).toFixed(2)}</span>
                      </div>
                    );
                  })}</div>
                )}
              </div>
            </div>
          </div>
        )}

        {tab === "products" && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Products</h2>
              <button onClick={() => setShowNewSale(true)} className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-5 py-2.5 rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 transition-all font-medium" data-testid="button-new-sale"><ShoppingCart size={18} /> New Sale</button>
            </div>
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..." className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-purple-400/50" data-testid="input-search" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProducts.map((p: any) => {
                const myPrice = getProductPrice(p);
                const hasAgreed = prices.some((pr: any) => pr.productId === p.id);
                const isLow = p.currentStock <= p.lowStockThreshold;
                return (
                  <div key={p.id} className={`bg-[#1a2440] rounded-2xl border overflow-hidden hover:border-purple-400/30 transition-all ${isLow ? "border-red-500/50" : "border-white/10"}`} data-testid={`card-product-${p.id}`}>
                    {p.images && p.images.length > 0 ? (
                      <ProductSlider images={p.images} />
                    ) : (
                      <div className="h-40 bg-gradient-to-br from-white/[0.03] to-white/[0.01] flex items-center justify-center"><Package size={40} className="text-white/10" /></div>
                    )}
                    <div className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-white">{p.name}</h3>
                          <div className="text-xs text-white/30 mt-0.5">Code: {p.code} · {p.unitType}</div>
                        </div>
                        <div className="text-right">
                          {hasAgreed && <div className="text-xs text-white/20 line-through">£{parseFloat(p.basePrice).toFixed(2)}</div>}
                          <div className="text-xl font-bold text-emerald-400">£{myPrice.toFixed(2)}</div>
                          {hasAgreed && <div className="text-xs text-purple-300">Agreed</div>}
                        </div>
                      </div>
                      <div className={`mt-3 flex items-center gap-1 text-sm ${isLow ? "text-red-400 font-bold" : "text-white/40"}`}>
                        {isLow && <AlertTriangle size={14} />}
                        <Boxes size={14} /> Stock: {p.currentStock}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === "customers" && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Customers</h2>
              <button onClick={() => setShowAddCustomer(true)} className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-5 py-2.5 rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all font-medium" data-testid="button-add-customer"><UserPlus size={18} /> Add Customer</button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {customers.map((c: any) => (
                <div key={c.id} className="bg-[#1a2440] rounded-2xl border border-white/10 p-5 hover:border-purple-400/30 transition-all" data-testid={`card-customer-${c.id}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-white">{c.name}</h3>
                      {c.shopName && <div className="text-sm text-white/40 mt-0.5">{c.shopName}</div>}
                      {c.phone && <div className="text-sm text-white/30 mt-1">{c.phone}</div>}
                      {c.email && <div className="text-sm text-white/30">{c.email}</div>}
                      {c.address && <div className="text-sm text-white/20 mt-1 flex items-center gap-1"><MapPin size={12} /> {c.address}</div>}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${c.customerType === "wholesale" ? "bg-blue-500/20 text-blue-300" : "bg-amber-500/20 text-amber-300"}`}>{c.customerType}</span>
                      <button onClick={async () => { if (confirm("Delete?")) { await fetch(`/api/inventory/customers/${c.id}`, { method: "DELETE" }); fetchData(); } }} className="p-1 hover:bg-red-500/10 rounded-lg"><Trash2 size={14} className="text-red-400/40" /></button>
                    </div>
                  </div>
                </div>
              ))}
              {customers.length === 0 && <div className="col-span-full text-center py-16 text-white/20"><Users size={48} className="mx-auto mb-3 opacity-50" /><p>No customers yet. Add your first wholesale or trade customer.</p></div>}
            </div>
          </div>
        )}

        {tab === "orders" && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">Customer Orders</h2>
                <p className="text-white/40 text-sm">{orders.filter(o => o.status === "pending").length} pending orders</p>
              </div>
            </div>
            {orders.length === 0 ? (
              <div className="text-center py-16 text-white/20"><ClipboardList size={48} className="mx-auto mb-3 opacity-50" /><p>No orders yet</p></div>
            ) : (
              <div className="space-y-4">
                {orders.map((o: any) => {
                  const cust = customers.find((c: any) => c.id === o.customerId);
                  let items: any[] = [];
                  try { items = JSON.parse(o.items); } catch {}
                  const statusColors: Record<string, string> = {
                    pending: "text-amber-400 bg-amber-500/10 border-amber-500/20",
                    confirmed: "text-blue-400 bg-blue-500/10 border-blue-500/20",
                    delivered: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
                    cancelled: "text-red-400 bg-red-500/10 border-red-500/20",
                  };
                  return (
                    <div key={o.id} className="bg-[#1a2440] rounded-2xl border border-white/10 p-5" data-testid={`order-${o.id}`}>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-bold">{cust?.name || "Customer"}</span>
                            {cust?.shopName && <span className="text-white/30 text-sm">({cust.shopName})</span>}
                          </div>
                          <p className="text-white/30 text-xs mt-0.5">Order #{o.id.slice(0, 8)} · {new Date(o.createdAt).toLocaleString()}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[o.status] || "text-white/40 bg-white/5 border-white/10"}`}>{o.status}</span>
                          <select value={o.status} onChange={async (e) => {
                            await fetch(`/api/inventory/orders/${o.id}/status`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: e.target.value }) });
                            fetchData();
                          }} className="bg-[#141d33] border border-white/10 text-white text-xs rounded-lg px-2 py-1 focus:outline-none" data-testid={`select-order-status-${o.id}`}>
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>
                      </div>
                      <div className="space-y-1.5 mb-3">
                        {items.map((item: any, i: number) => (
                          <div key={i} className="flex justify-between text-sm bg-white/[0.02] px-3 py-2 rounded-lg">
                            <span className="text-white/60">{item.name} <span className="text-white/30">x{item.qty}</span></span>
                            <span className="text-white/40">£{item.subtotal}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between pt-3 border-t border-white/5">
                        <span className="text-white/40 text-sm">Total</span>
                        <span className="text-emerald-400 font-bold text-lg">£{parseFloat(o.totalAmount || "0").toFixed(2)}</span>
                      </div>
                      {o.notes && <p className="text-white/20 text-xs mt-2">Note: {o.notes}</p>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab === "sales" && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">Sales</h2>
                <p className="text-white/40 text-sm">Total: <span className="text-emerald-400 font-bold">£{totalSalesValue.toFixed(2)}</span></p>
              </div>
              <button onClick={() => setShowNewSale(true)} className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-5 py-2.5 rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 transition-all font-medium" data-testid="button-new-sale-tab"><ShoppingCart size={18} /> New Sale</button>
            </div>
            <div className="space-y-3">
              {sales.map((s: any) => {
                const prod = products.find((p: any) => p.id === s.productId);
                const cust = customers.find((c: any) => c.id === s.customerId);
                return (
                  <div key={s.id} className="bg-[#1a2440] rounded-2xl border border-white/10 p-5 hover:border-purple-400/20 transition-all" data-testid={`card-sale-${s.id}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-white">{prod?.name || "Product"}</h3>
                        <div className="text-sm text-white/40 mt-0.5">Qty: {s.quantity} x £{parseFloat(s.unitPrice).toFixed(2)}</div>
                        {cust && <div className="text-sm text-white/30 mt-1">Customer: {cust.name}</div>}
                        {s.notes && <div className="text-sm text-white/20 mt-0.5">{s.notes}</div>}
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-emerald-400">£{parseFloat(s.totalPrice).toFixed(2)}</div>
                        <div className="text-xs text-white/20 mt-1">{new Date(s.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {sales.length === 0 && <div className="text-center py-16 text-white/20"><ShoppingCart size={48} className="mx-auto mb-3 opacity-50" /><p>No sales yet</p></div>}
            </div>
          </div>
        )}
      </main>

      {showAddCustomer && <AddCustomerModal brandId={brand.id} onClose={() => setShowAddCustomer(false)} onSave={fetchData} />}
      {showNewSale && <NewSaleModal brand={brand} products={products} prices={prices} customers={customers} onClose={() => setShowNewSale(false)} onSave={fetchData} />}
    </div>
  );
}

function ProductSlider({ images }: { images: string[] }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (images.length <= 1) return;
    const t = setInterval(() => setIdx(i => (i + 1) % images.length), 3000);
    return () => clearInterval(t);
  }, [images.length]);
  return (
    <div className="h-40 relative overflow-hidden bg-white/[0.02]">
      <img src={images[idx]} alt="" className="w-full h-full object-cover transition-all duration-700" />
      {images.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
          {images.map((_, i) => <div key={i} className={`w-2 h-2 rounded-full transition-all ${i === idx ? "bg-purple-400 w-4" : "bg-white/30"}`} />)}
        </div>
      )}
    </div>
  );
}

function ModalWrapper({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-[#1a2440] rounded-2xl border border-white/10 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-white/10"><h2 className="font-bold text-white text-lg">{title}</h2><button onClick={onClose} className="p-1 hover:bg-white/5 rounded-lg text-white/40"><X size={20} /></button></div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function AddCustomerModal({ brandId, onClose, onSave }: { brandId: string; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({ name: "", shopName: "", email: "", phone: "", address: "", customerType: "wholesale", username: "", password: "" });
  const save = async () => {
    if (!form.name) return;
    await fetch("/api/inventory/customers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, brandId }) });
    onSave(); onClose();
  };
  const inputClass = "w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-purple-400/50 mt-1";
  return (
    <ModalWrapper title="Add Customer" onClose={onClose}>
      <div className="space-y-3">
        <div><label className="text-sm font-medium text-white/60">Customer Name *</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputClass} data-testid="input-customer-name" /></div>
        <div><label className="text-sm font-medium text-white/60">Shop Name</label><input value={form.shopName} onChange={e => setForm({ ...form, shopName: e.target.value })} className={inputClass} /></div>
        <div><label className="text-sm font-medium text-white/60">Type</label>
          <select value={form.customerType} onChange={e => setForm({ ...form, customerType: e.target.value })} className={inputClass} data-testid="select-customer-type">
            <option value="wholesale">Wholesale</option><option value="trade">Trade</option><option value="retail">Retail</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-sm font-medium text-white/60">Phone</label><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={inputClass} /></div>
          <div><label className="text-sm font-medium text-white/60">Email</label><input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={inputClass} /></div>
        </div>
        <div><label className="text-sm font-medium text-white/60">Address</label><input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className={inputClass} /></div>
        <div className="border-t border-white/10 pt-3 mt-3">
          <p className="text-xs text-white/30 mb-2">Portal Login (so customer can browse products & order online)</p>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-sm font-medium text-white/60">Username</label><input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} className={inputClass} placeholder="e.g. shop123" data-testid="input-customer-username" /></div>
            <div><label className="text-sm font-medium text-white/60">Password</label><input value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className={inputClass} placeholder="e.g. pass123" data-testid="input-customer-password" /></div>
          </div>
        </div>
        <button onClick={save} className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:shadow-lg hover:shadow-purple-500/25 transition-all" data-testid="button-save-customer">Add Customer</button>
      </div>
    </ModalWrapper>
  );
}

function NewSaleModal({ brand, products, prices, customers, onClose, onSave }: any) {
  const [productId, setProductId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [discountPercent, setDiscountPercent] = useState("0");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const selectedProduct = products.find((p: any) => p.id === productId);
  const agreedEntry = prices.find((p: any) => p.productId === productId);
  const unitPrice = agreedEntry ? parseFloat(agreedEntry.agreedPrice) : selectedProduct ? (selectedProduct.discountedPrice ? parseFloat(selectedProduct.discountedPrice) : parseFloat(selectedProduct.basePrice)) : 0;
  const qty = parseInt(quantity) || 0;
  const disc = parseFloat(discountPercent) || 0;
  const subtotal = unitPrice * qty;
  const total = subtotal - (subtotal * disc / 100);

  const save = async () => {
    if (!productId || qty <= 0) return;
    setSaving(true);
    await fetch("/api/inventory/sales", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brandId: brand.id, productId, customerId: customerId || null, quantity: qty, unitPrice: unitPrice.toFixed(2), totalPrice: total.toFixed(2), discountPercent, notes }),
    });
    setSaving(false); onSave(); onClose();
  };

  const inputClass = "w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-emerald-400/50 mt-1";
  return (
    <ModalWrapper title="New Sale" onClose={onClose}>
      <div className="space-y-4">
        <div><label className="text-sm font-medium text-white/60">Product *</label>
          <select value={productId} onChange={e => setProductId(e.target.value)} className={inputClass} data-testid="select-sale-product">
            <option value="">Select Product</option>{products.map((p: any) => <option key={p.id} value={p.id}>{p.name} (Stock: {p.currentStock})</option>)}
          </select>
        </div>
        <div><label className="text-sm font-medium text-white/60">Customer</label>
          <select value={customerId} onChange={e => setCustomerId(e.target.value)} className={inputClass} data-testid="select-sale-customer">
            <option value="">Walk-in Customer</option>{customers.map((c: any) => <option key={c.id} value={c.id}>{c.name}{c.shopName ? ` (${c.shopName})` : ""}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-sm font-medium text-white/60">Quantity</label><input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} className={inputClass} data-testid="input-sale-qty" /></div>
          <div><label className="text-sm font-medium text-white/60">Discount %</label><input type="number" value={discountPercent} onChange={e => setDiscountPercent(e.target.value)} className={inputClass} /></div>
        </div>
        {selectedProduct && (
          <div className="bg-white/[0.03] rounded-xl p-4 space-y-2 text-sm border border-white/5">
            <div className="flex justify-between text-white/50"><span>Unit Price:</span><span className="text-white font-medium">£{unitPrice.toFixed(2)}</span></div>
            <div className="flex justify-between text-white/50"><span>Subtotal ({qty} x £{unitPrice.toFixed(2)}):</span><span className="text-white">£{subtotal.toFixed(2)}</span></div>
            {disc > 0 && <div className="flex justify-between text-amber-400"><span>Discount ({disc}%):</span><span>-£{(subtotal * disc / 100).toFixed(2)}</span></div>}
            <div className="flex justify-between font-bold text-lg pt-2 border-t border-white/10"><span className="text-white">Total:</span><span className="text-emerald-400">£{total.toFixed(2)}</span></div>
          </div>
        )}
        <div><label className="text-sm font-medium text-white/60">Notes</label><input value={notes} onChange={e => setNotes(e.target.value)} className={inputClass} /></div>
        <button onClick={save} disabled={saving} className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 disabled:opacity-50 hover:shadow-lg hover:shadow-emerald-500/25 transition-all" data-testid="button-save-sale">{saving ? "Saving..." : "Complete Sale"}</button>
      </div>
    </ModalWrapper>
  );
}
