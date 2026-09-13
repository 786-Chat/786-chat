import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Package, Search, ShoppingCart, LogOut, ChevronRight, Minus, Plus, X, Send, Clock, CheckCircle, XCircle, User, MapPin, Phone, Store } from "lucide-react";

export default function InventoryCustomerPortal() {
  const [, setLocation] = useLocation();
  const [customer, setCustomer] = useState<any>(null);
  const [brand, setBrand] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("shop");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [showCart, setShowCart] = useState(false);
  const [orderNotes, setOrderNotes] = useState("");
  const [orderSuccess, setOrderSuccess] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("inventoryCustomer");
    if (!stored) { setLocation("/inventory-customer-login"); return; }
    const c = JSON.parse(stored);
    setCustomer(c);
    fetchData(c);
  }, []);

  const fetchData = (c: any) => {
    fetch("/api/inventory/products").then(r => r.json()).then(setProducts).catch(() => {});
    fetch("/api/inventory/categories").then(r => r.json()).then(setCategories).catch(() => {});
    fetch(`/api/inventory/orders/customer/${c.id}`).then(r => r.json()).then(setOrders).catch(() => {});
    fetch(`/api/inventory/brands/${c.brandId}`).then(r => r.json()).then(setBrand).catch(() => {});
  };

  const logout = () => { localStorage.removeItem("inventoryCustomer"); setLocation("/inventory-customer-login"); };

  const filteredProducts = products.filter(p => {
    const matchCat = selectedCategory === "all" || p.categoryId === selectedCategory;
    const matchSearch = !searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase()) || (p.code || "").toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch && p.isActive;
  });

  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);
  const cartItems = Object.entries(cart).filter(([, qty]) => qty > 0).map(([id, qty]) => {
    const p = products.find(pr => pr.id === id);
    return { ...p, qty, subtotal: (parseFloat(p?.discountedPrice || p?.basePrice || "0") * qty).toFixed(2) };
  });
  const cartTotal = cartItems.reduce((s, i) => s + parseFloat(i.subtotal), 0).toFixed(2);

  const updateCart = (productId: string, delta: number) => {
    setCart(prev => {
      const current = prev[productId] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) { const { [productId]: _, ...rest } = prev; return rest; }
      return { ...prev, [productId]: next };
    });
  };

  const placeOrder = async () => {
    if (!customer || cartItems.length === 0) return;
    const items = cartItems.map(i => ({ productId: i.id, name: i.name, code: i.code, qty: i.qty, unitPrice: i.discountedPrice || i.basePrice, subtotal: i.subtotal }));
    try {
      await fetch("/api/inventory/orders", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandId: customer.brandId, customerId: customer.id, items: JSON.stringify(items), totalAmount: cartTotal, notes: orderNotes }),
      });
      setCart({}); setOrderNotes(""); setShowCart(false); setOrderSuccess(true);
      fetchData(customer);
      setTimeout(() => setOrderSuccess(false), 4000);
    } catch (e) { console.error(e); }
  };

  const statusColor = (s: string) => {
    if (s === "pending") return "text-amber-400 bg-amber-500/10";
    if (s === "confirmed") return "text-blue-400 bg-blue-500/10";
    if (s === "delivered") return "text-emerald-400 bg-emerald-500/10";
    if (s === "cancelled") return "text-red-400 bg-red-500/10";
    return "text-white/40 bg-white/5";
  };
  const statusIcon = (s: string) => {
    if (s === "pending") return <Clock size={14} />;
    if (s === "confirmed") return <CheckCircle size={14} />;
    if (s === "delivered") return <CheckCircle size={14} />;
    if (s === "cancelled") return <XCircle size={14} />;
    return <Clock size={14} />;
  };

  if (!customer) return null;

  return (
    <div className="min-h-screen bg-[#0f1729]" data-testid="page-inventory-customer-portal">
      <header className="bg-[#1a2440]/90 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {brand?.logo && <img src={brand.logo} alt={brand?.name} className="h-8 object-contain" />}
            <div>
              <h1 className="text-white font-bold text-lg">{brand?.name || "Product Catalog"}</h1>
              <p className="text-white/30 text-xs">{brand?.description || ""}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowCart(true)} className="relative p-2 bg-[#141d33] border border-white/10 rounded-xl hover:border-emerald-500/30 transition-all" data-testid="button-cart">
              <ShoppingCart size={20} className="text-white/60" />
              {cartCount > 0 && <span className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">{cartCount}</span>}
            </button>
            <div className="hidden sm:flex items-center gap-2 bg-[#141d33] border border-white/10 rounded-xl px-3 py-2">
              <User size={14} className="text-emerald-400" />
              <span className="text-white/60 text-sm">{customer.name}</span>
            </div>
            <button onClick={logout} className="p-2 bg-[#141d33] border border-white/10 rounded-xl hover:border-red-500/30 transition-all" data-testid="button-logout">
              <LogOut size={18} className="text-white/40" />
            </button>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 pb-2 flex gap-1">
          {[{ key: "shop", label: "Products", icon: Package }, { key: "orders", label: "My Orders", icon: Clock }, { key: "account", label: "My Account", icon: User }].map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === t.key ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "text-white/40 hover:text-white/60"}`}
              data-testid={`tab-${t.key}`}>
              <t.icon size={15} /> {t.label}
            </button>
          ))}
        </div>
      </header>

      {orderSuccess && (
        <div className="fixed top-4 right-4 z-[100] bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-6 py-4 rounded-2xl flex items-center gap-3 shadow-xl animate-pulse">
          <CheckCircle size={20} /> Order placed successfully!
        </div>
      )}

      <main className="max-w-7xl mx-auto p-4">
        {activeTab === "shop" && (
          <div>
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search products by name or code..."
                  className="w-full bg-[#1a2440] border border-white/10 text-white pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:border-emerald-500/30 text-sm"
                  data-testid="input-search" />
              </div>
            </div>

            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-thin">
              <button onClick={() => setSelectedCategory("all")}
                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${selectedCategory === "all" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20" : "bg-[#1a2440] text-white/40 border border-white/5 hover:text-white/60"}`}
                data-testid="button-category-all">All Products</button>
              {categories.map(c => (
                <button key={c.id} onClick={() => setSelectedCategory(c.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${selectedCategory === c.id ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20" : "bg-[#1a2440] text-white/40 border border-white/5 hover:text-white/60"}`}
                  data-testid={`button-category-${c.id}`}>{c.name}</button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map(p => {
                const cat = categories.find(c => c.id === p.categoryId);
                const price = parseFloat(p.discountedPrice || p.basePrice || "0");
                const basePrice = parseFloat(p.basePrice || "0");
                const hasDiscount = price < basePrice && basePrice > 0;
                const inCart = cart[p.id] || 0;
                return (
                  <div key={p.id} className="bg-[#1a2440]/80 border border-white/5 rounded-2xl overflow-hidden hover:border-emerald-500/20 transition-all group" data-testid={`card-product-${p.id}`}>
                    <div className="h-40 bg-[#141d33] flex items-center justify-center relative overflow-hidden">
                      {p.images && JSON.parse(p.images || "[]")[0] ? (
                        <img src={JSON.parse(p.images)[0]} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package size={40} className="text-white/10" />
                      )}
                      {cat && <span className="absolute top-2 left-2 bg-emerald-500/20 text-emerald-400 text-[10px] font-medium px-2 py-0.5 rounded-full">{cat.name}</span>}
                      {p.currentStock <= p.lowStockThreshold && (
                        <span className="absolute top-2 right-2 bg-red-500/20 text-red-400 text-[10px] font-medium px-2 py-0.5 rounded-full">Low Stock</span>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-white font-semibold text-sm mb-1 line-clamp-2">{p.name}</h3>
                      <p className="text-white/30 text-xs mb-3">Code: {p.code || "N/A"} · {p.unitType}</p>
                      <div className="flex items-center justify-between">
                        <div>
                          {price > 0 ? (
                            <div className="flex items-center gap-2">
                              <span className="text-emerald-400 font-bold text-lg">£{price.toFixed(2)}</span>
                              {hasDiscount && <span className="text-white/20 line-through text-xs">£{basePrice.toFixed(2)}</span>}
                            </div>
                          ) : (
                            <span className="text-white/30 text-sm">Price TBC</span>
                          )}
                        </div>
                        {inCart === 0 ? (
                          <button onClick={() => updateCart(p.id, 1)}
                            className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1"
                            data-testid={`button-add-${p.id}`}>
                            <Plus size={14} /> Add
                          </button>
                        ) : (
                          <div className="flex items-center gap-2 bg-[#141d33] rounded-lg px-1 py-0.5">
                            <button onClick={() => updateCart(p.id, -1)} className="p-1 text-white/60 hover:text-red-400" data-testid={`button-minus-${p.id}`}><Minus size={14} /></button>
                            <span className="text-white font-bold text-sm w-6 text-center">{inCart}</span>
                            <button onClick={() => updateCart(p.id, 1)} className="p-1 text-white/60 hover:text-emerald-400" data-testid={`button-plus-${p.id}`}><Plus size={14} /></button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {filteredProducts.length === 0 && (
              <div className="text-center py-20 text-white/20">
                <Package size={48} className="mx-auto mb-4 opacity-30" />
                <p className="text-lg">No products found</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "orders" && (
          <div>
            <h2 className="text-xl font-bold text-white mb-6">My Orders</h2>
            {orders.length === 0 ? (
              <div className="text-center py-20 text-white/20">
                <Clock size={48} className="mx-auto mb-4 opacity-30" />
                <p className="text-lg">No orders yet</p>
                <p className="text-sm mt-1">Browse products and place your first order</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map(o => {
                  let items: any[] = [];
                  try { items = JSON.parse(o.items); } catch {}
                  return (
                    <div key={o.id} className="bg-[#1a2440]/80 border border-white/5 rounded-2xl p-5" data-testid={`order-${o.id}`}>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <span className="text-white/30 text-xs">Order #{o.id.slice(0, 8)}</span>
                          <p className="text-white/40 text-xs mt-0.5">{new Date(o.createdAt).toLocaleString()}</p>
                        </div>
                        <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${statusColor(o.status)}`}>
                          {statusIcon(o.status)} {o.status}
                        </span>
                      </div>
                      <div className="space-y-2 mb-3">
                        {items.map((item: any, i: number) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span className="text-white/60">{item.name} <span className="text-white/30">x{item.qty}</span></span>
                            <span className="text-white/40">£{item.subtotal}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between pt-3 border-t border-white/5">
                        <span className="text-white/40 text-sm font-medium">Total</span>
                        <span className="text-emerald-400 font-bold">£{parseFloat(o.totalAmount || "0").toFixed(2)}</span>
                      </div>
                      {o.notes && <p className="text-white/20 text-xs mt-2">Note: {o.notes}</p>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "account" && (
          <div>
            <h2 className="text-xl font-bold text-white mb-6">My Account</h2>
            <div className="bg-[#1a2440]/80 border border-white/5 rounded-2xl p-6 max-w-lg">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/25">
                <User size={28} className="text-white" />
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <User size={16} className="text-emerald-400" />
                  <div><p className="text-white/30 text-xs">Name</p><p className="text-white font-medium">{customer.name}</p></div>
                </div>
                {customer.shopName && (
                  <div className="flex items-center gap-3">
                    <Store size={16} className="text-emerald-400" />
                    <div><p className="text-white/30 text-xs">Shop Name</p><p className="text-white font-medium">{customer.shopName}</p></div>
                  </div>
                )}
                {customer.phone && (
                  <div className="flex items-center gap-3">
                    <Phone size={16} className="text-emerald-400" />
                    <div><p className="text-white/30 text-xs">Phone</p><p className="text-white font-medium">{customer.phone}</p></div>
                  </div>
                )}
                {customer.address && (
                  <div className="flex items-center gap-3">
                    <MapPin size={16} className="text-emerald-400" />
                    <div><p className="text-white/30 text-xs">Address</p><p className="text-white font-medium">{customer.address}</p></div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Package size={16} className="text-emerald-400" />
                  <div><p className="text-white/30 text-xs">Customer Type</p><p className="text-white font-medium capitalize">{customer.customerType || "wholesale"}</p></div>
                </div>
                <div className="pt-4 border-t border-white/5">
                  <p className="text-white/20 text-xs">Total Orders: {orders.length}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {showCart && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCart(false)} />
          <div className="relative w-full max-w-md bg-[#1a2440] border-l border-white/10 h-full flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <h3 className="text-white font-bold text-lg flex items-center gap-2"><ShoppingCart size={20} className="text-emerald-400" /> Cart ({cartCount})</h3>
              <button onClick={() => setShowCart(false)} className="p-1.5 hover:bg-white/5 rounded-lg" data-testid="button-close-cart"><X size={18} className="text-white/40" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {cartItems.length === 0 ? (
                <div className="text-center py-12 text-white/20">
                  <ShoppingCart size={40} className="mx-auto mb-3 opacity-30" />
                  <p>Your cart is empty</p>
                </div>
              ) : (
                cartItems.map(item => (
                  <div key={item.id} className="bg-[#141d33] border border-white/5 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex-1 mr-3">
                      <p className="text-white text-sm font-medium line-clamp-1">{item.name}</p>
                      <p className="text-white/30 text-xs">{item.code} · £{parseFloat(item.discountedPrice || item.basePrice || "0").toFixed(2)} each</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 bg-[#0f1729] rounded-lg px-1 py-0.5">
                        <button onClick={() => updateCart(item.id, -1)} className="p-1 text-white/60 hover:text-red-400"><Minus size={12} /></button>
                        <span className="text-white font-bold text-xs w-5 text-center">{item.qty}</span>
                        <button onClick={() => updateCart(item.id, 1)} className="p-1 text-white/60 hover:text-emerald-400"><Plus size={12} /></button>
                      </div>
                      <span className="text-emerald-400 text-sm font-medium w-16 text-right">£{item.subtotal}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
            {cartItems.length > 0 && (
              <div className="p-5 border-t border-white/5 space-y-4">
                <textarea value={orderNotes} onChange={e => setOrderNotes(e.target.value)} placeholder="Order notes (optional)..."
                  className="w-full bg-[#141d33] border border-white/10 text-white px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-emerald-500/30 resize-none h-16"
                  data-testid="input-order-notes" />
                <div className="flex items-center justify-between mb-3">
                  <span className="text-white/60 font-medium">Total</span>
                  <span className="text-emerald-400 font-bold text-xl">£{cartTotal}</span>
                </div>
                <button onClick={placeOrder}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-emerald-500/25 transition-all flex items-center justify-center gap-2"
                  data-testid="button-place-order">
                  <Send size={16} /> Place Order
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
