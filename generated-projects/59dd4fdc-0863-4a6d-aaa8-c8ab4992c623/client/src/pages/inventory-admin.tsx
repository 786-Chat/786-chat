import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft, Plus, Search, Package, MapPin, Tag, Building2, Percent, Trash2, Edit,
  AlertTriangle, QrCode, X, ChevronDown, ChevronUp, Factory, Truck, Copy,
  LayoutDashboard, Boxes, BarChart3, Settings, DollarSign, Warehouse, ChevronLeft, ChevronRight,
  ExternalLink, Monitor, Eye, Lock, Globe
} from "lucide-react";

type MainTab = "dashboard" | "brands";
type BrandTab = "products" | "categories" | "locations" | "discounts";

export default function InventoryAdmin() {
  const [, navigate] = useLocation();
  const [mainTab, setMainTab] = useState<MainTab>("dashboard");
  const [selectedBrand, setSelectedBrand] = useState<any>(null);
  const [brandTab, setBrandTab] = useState<BrandTab>("products");
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [showAddBrand, setShowAddBrand] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showGlobalDiscount, setShowGlobalDiscount] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [editBrand, setEditBrand] = useState<any>(null);
  const [showStockModal, setShowStockModal] = useState<any>(null);
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const [stockLogs, setStockLogs] = useState<any[]>([]);
  const [showBrandPrices, setShowBrandPrices] = useState<any>(null);
  const [brandPrices, setBrandPrices] = useState<any[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const fetchAll = useCallback(() => {
    fetch("/api/inventory/products").then(r => r.json()).then(setProducts).catch(() => {});
    fetch("/api/inventory/categories").then(r => r.json()).then(setCategories).catch(() => {});
    fetch("/api/inventory/locations").then(r => r.json()).then(setLocations).catch(() => {});
    fetch("/api/inventory/brands").then(r => r.json()).then(setBrands).catch(() => {});
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) || p.code.toLowerCase().includes(search.toLowerCase()) || (p.barcode && p.barcode.includes(search))
  );
  const lowStockProducts = products.filter(p => p.currentStock <= p.lowStockThreshold);
  const totalStock = products.reduce((s: number, p: any) => s + (p.currentStock || 0), 0);
  const totalValue = products.reduce((s: number, p: any) => s + (parseFloat(p.basePrice || "0") * (p.currentStock || 0)), 0);

  const openBrandManagement = (brand: any) => {
    setSelectedBrand(brand);
    setBrandTab("products");
    setMainTab("brands");
  };

  const closeBrandManagement = () => {
    setSelectedBrand(null);
    setMainTab("brands");
  };

  const mainSidebarItems: { key: MainTab; label: string; icon: any }[] = [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { key: "brands", label: "Brand Companies", icon: Building2 },
  ];

  const brandSidebarItems: { key: BrandTab; label: string; icon: any }[] = [
    { key: "products", label: "Products", icon: Package },
    { key: "categories", label: "Categories", icon: Tag },
    { key: "locations", label: "Stores/Warehouse", icon: Warehouse },
    { key: "discounts", label: "Discounts", icon: Percent },
  ];

  return (
    <div className="min-h-screen bg-[#0f1729] flex">
      <aside className={`${sidebarOpen ? "w-64" : "w-16"} bg-[#141d33] border-r border-white/10 flex flex-col transition-all duration-300 shrink-0`}>
        <div className="p-4 border-b border-white/10 flex items-center gap-3">
          {sidebarOpen && (
            <div className="flex items-center gap-2 flex-1">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}>
                <Factory size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-white font-bold text-sm">Mujeeb Manufacturing</h1>
                <p className="text-white/40 text-xs">Inventory System</p>
              </div>
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-white/40 hover:text-white p-1">
            {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>

        {!selectedBrand ? (
          <nav className="flex-1 p-2 space-y-1">
            {mainSidebarItems.map(item => (
              <button key={item.key} onClick={() => setMainTab(item.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${mainTab === item.key ? "bg-amber-500/20 text-amber-400" : "text-white/50 hover:text-white hover:bg-white/5"}`}
                data-testid={`sidebar-${item.key}`}
              >
                <item.icon size={18} />
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            ))}
          </nav>
        ) : (
          <nav className="flex-1 p-2 space-y-1">
            <button onClick={closeBrandManagement}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-amber-400 hover:bg-amber-500/10 transition-all mb-2"
              data-testid="btn-back-brands"
            >
              <ArrowLeft size={18} />
              {sidebarOpen && <span>All Brands</span>}
            </button>

            {sidebarOpen && (
              <div className="px-3 py-2 mb-2">
                <div className="flex items-center gap-2">
                  {selectedBrand.logoUrl ? (
                    <img src={selectedBrand.logoUrl} alt="" className="w-8 h-8 rounded-lg object-contain bg-white/10" />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                      <Building2 size={16} className="text-purple-400" />
                    </div>
                  )}
                  <div>
                    <div className="text-white font-bold text-sm">{selectedBrand.name}</div>
                    <div className="text-white/30 text-xs">@{selectedBrand.slug}</div>
                  </div>
                </div>
              </div>
            )}

            {brandSidebarItems.map(item => (
              <button key={item.key} onClick={() => setBrandTab(item.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${brandTab === item.key ? "bg-purple-500/20 text-purple-400" : "text-white/50 hover:text-white hover:bg-white/5"}`}
                data-testid={`sidebar-brand-${item.key}`}
              >
                <item.icon size={18} />
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            ))}
          </nav>
        )}

        <div className="p-3 border-t border-white/10">
          {selectedBrand && (
            <button onClick={() => setShowScanner(true)} className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-all mb-1 ${!sidebarOpen ? "justify-center" : ""}`} data-testid="button-scan">
              <QrCode size={18} />
              {sidebarOpen && <span>Scan Barcode</span>}
            </button>
          )}
          <button onClick={() => navigate("/")} className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-white/30 hover:text-white/60 mt-1 ${!sidebarOpen ? "justify-center" : ""}`} data-testid="button-back">
            <ArrowLeft size={16} />
            {sidebarOpen && <span>Back to Home</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        {!selectedBrand ? (
          <>
            {mainTab === "dashboard" && <DashboardView products={products} brands={brands} categories={categories} locations={locations} lowStockProducts={lowStockProducts} totalStock={totalStock} totalValue={totalValue} onOpenBrand={openBrandManagement} />}
            {mainTab === "brands" && (
              <BrandCompaniesView brands={brands} onAddBrand={() => setShowAddBrand(true)} onEditBrand={setEditBrand} onOpenBrand={openBrandManagement} onRefresh={fetchAll} products={products} brandPrices={brandPrices} setBrandPrices={setBrandPrices} showBrandPrices={showBrandPrices} setShowBrandPrices={setShowBrandPrices} />
            )}
          </>
        ) : (
          <>
            {brandTab === "products" && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    {selectedBrand.logoUrl && <img src={selectedBrand.logoUrl} alt="" className="w-8 h-8 rounded-lg object-contain bg-white/10" />}
                    {selectedBrand.name} — Products
                  </h2>
                  <button onClick={() => setShowAddProduct(true)} className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-5 py-2.5 rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all font-medium" data-testid="button-add-product"><Plus size={18} /> Add Product</button>
                </div>
                <div className="relative mb-4">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products, codes, barcodes..." className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-purple-400/50" data-testid="input-search" />
                </div>
                {lowStockProducts.length > 0 && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4">
                    <div className="flex items-center gap-2 text-red-400 font-bold mb-2"><AlertTriangle size={18} /> Low Stock Alert - Order Manufacturing Again!</div>
                    <div className="flex flex-wrap gap-2">{lowStockProducts.map((p: any) => <span key={p.id} className="bg-red-500/20 text-red-300 px-3 py-1 rounded-full text-sm animate-pulse">{p.name}: {p.currentStock} left</span>)}</div>
                  </div>
                )}
                <div className="grid gap-4">
                  {filteredProducts.map((p: any) => {
                    const isLow = p.currentStock <= p.lowStockThreshold;
                    const cat = categories.find((c: any) => c.id === p.categoryId);
                    const loc = locations.find((l: any) => l.id === p.locationId);
                    return (
                      <div key={p.id} className={`bg-[#1a2440] rounded-2xl border overflow-hidden transition-all hover:border-purple-400/30 ${isLow ? "border-red-500/50" : "border-white/10"}`} data-testid={`card-product-${p.id}`}>
                        <div className="p-5">
                          <div className="flex items-start gap-4">
                            {p.images && p.images.length > 0 ? (
                              <ProductImageSlider images={p.images} />
                            ) : (
                              <div className="w-24 h-24 bg-white/5 rounded-xl flex items-center justify-center shrink-0"><Package size={32} className="text-white/20" /></div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-bold text-white text-lg">{p.name}</h3>
                                {isLow && <span className="bg-red-500/30 text-red-300 text-xs px-2 py-0.5 rounded-full font-bold animate-pulse">LOW STOCK!</span>}
                              </div>
                              <div className="flex flex-wrap gap-2 mt-1 text-sm text-white/40">
                                <span>Code: <b className="text-white/60">{p.code}</b></span>
                                {p.barcode && <span>Barcode: {p.barcode}</span>}
                                {cat && <span className="bg-indigo-500/20 text-indigo-300 px-2 rounded">{cat.name}</span>}
                                <span className="capitalize">{p.unitType}{p.unitsPerBox > 1 ? ` (${p.unitsPerBox}/box)` : ""}</span>
                              </div>
                              {loc && <div className="text-sm text-white/30 mt-1"><MapPin size={12} className="inline" /> {loc.name}{p.rowNumber ? ` · Row ${p.rowNumber}` : ""}{p.area ? ` · ${p.area}` : ""}</div>}
                            </div>
                            <div className="text-right shrink-0">
                              {parseFloat(p.discountPercent || "0") > 0 && <div className="text-sm text-white/30 line-through">£{parseFloat(p.basePrice).toFixed(2)}</div>}
                              <div className="text-2xl font-bold text-emerald-400">£{p.discountedPrice ? parseFloat(p.discountedPrice).toFixed(2) : parseFloat(p.basePrice).toFixed(2)}</div>
                              {parseFloat(p.discountPercent || "0") > 0 && <div className="text-xs text-amber-400">-{p.discountPercent}%</div>}
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-3 mt-4">
                            <div className="bg-blue-500/10 rounded-xl p-3 text-center"><div className="text-xs text-blue-300/60">Manufactured</div><div className="font-bold text-blue-300 text-lg">{p.totalManufactured}</div></div>
                            <div className="bg-orange-500/10 rounded-xl p-3 text-center"><div className="text-xs text-orange-300/60">Dispatched</div><div className="font-bold text-orange-300 text-lg">{p.totalDispatched}</div></div>
                            <div className={`rounded-xl p-3 text-center ${isLow ? "bg-red-500/10" : "bg-emerald-500/10"}`}>
                              <div className={`text-xs ${isLow ? "text-red-300/60" : "text-emerald-300/60"}`}>In Stock</div>
                              <div className={`font-bold text-lg ${isLow ? "text-red-400 animate-pulse" : "text-emerald-300"}`}>{p.currentStock}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-4">
                            <button onClick={() => setShowStockModal({ product: p, action: "add" })} className="flex-1 flex items-center justify-center gap-1 bg-blue-500/15 text-blue-300 py-2 rounded-xl text-sm hover:bg-blue-500/25 transition-all" data-testid={`btn-add-stock-${p.id}`}><Factory size={14} /> Add Stock</button>
                            <button onClick={() => setShowStockModal({ product: p, action: "dispatch" })} className="flex-1 flex items-center justify-center gap-1 bg-orange-500/15 text-orange-300 py-2 rounded-xl text-sm hover:bg-orange-500/25 transition-all" data-testid={`btn-dispatch-${p.id}`}><Truck size={14} /> Dispatch</button>
                            <button onClick={() => setEditProduct(p)} className="p-2 hover:bg-white/5 rounded-xl transition-all"><Edit size={16} className="text-white/40" /></button>
                            <button onClick={async () => { if (confirm("Delete?")) { await fetch(`/api/inventory/products/${p.id}`, { method: "DELETE" }); fetchAll(); } }} className="p-2 hover:bg-red-500/10 rounded-xl transition-all"><Trash2 size={16} className="text-red-400/60" /></button>
                            <button onClick={async () => { if (expandedProduct === p.id) { setExpandedProduct(null); return; } setExpandedProduct(p.id); const r = await fetch(`/api/inventory/products/${p.id}/stock-log`); setStockLogs(await r.json()); }} className="p-2 hover:bg-white/5 rounded-xl transition-all">{expandedProduct === p.id ? <ChevronUp size={16} className="text-white/40" /> : <ChevronDown size={16} className="text-white/40" />}</button>
                          </div>
                        </div>
                        {expandedProduct === p.id && (
                          <div className="border-t border-white/5 bg-white/[0.02] p-4">
                            <h4 className="font-semibold text-white/60 text-sm mb-2">Stock History</h4>
                            {stockLogs.length === 0 ? <p className="text-sm text-white/20">No history</p> : (
                              <div className="space-y-2 max-h-40 overflow-y-auto">{stockLogs.map((log: any) => (
                                <div key={log.id} className="flex items-center justify-between text-sm">
                                  <span className={`capitalize font-medium ${log.action === "manufactured" ? "text-blue-400" : "text-orange-400"}`}>{log.action}</span>
                                  <span className="text-white/50">{log.quantity} units</span>
                                  <span className="text-white/20">{new Date(log.createdAt).toLocaleDateString()}</span>
                                </div>
                              ))}</div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {filteredProducts.length === 0 && <div className="text-center py-16 text-white/20"><Package size={48} className="mx-auto mb-3 opacity-50" /><p>No products yet</p></div>}
                </div>
              </div>
            )}
            {brandTab === "categories" && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">{selectedBrand.name} — Categories</h2>
                  <button onClick={() => setShowAddCategory(true)} className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-5 py-2.5 rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all font-medium" data-testid="button-add-category"><Plus size={18} /> Add Category</button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {categories.map((c: any) => (
                    <div key={c.id} className="bg-[#1a2440] rounded-2xl border border-white/10 p-5 hover:border-purple-400/30 transition-all" data-testid={`card-cat-${c.id}`}>
                      <div className="flex items-center justify-between"><h3 className="font-bold text-white">{c.name}</h3><button onClick={async () => { if (confirm("Delete?")) { await fetch(`/api/inventory/categories/${c.id}`, { method: "DELETE" }); fetchAll(); } }} className="text-red-400/40 hover:text-red-400"><Trash2 size={16} /></button></div>
                      {c.description && <p className="text-sm text-white/30 mt-1">{c.description}</p>}
                    </div>
                  ))}
                  {categories.length === 0 && <div className="col-span-full text-center py-16 text-white/20"><Tag size={48} className="mx-auto mb-3 opacity-50" /><p>No categories yet</p></div>}
                </div>
              </div>
            )}
            {brandTab === "locations" && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">{selectedBrand.name} — Stores / Warehouse</h2>
                  <button onClick={() => setShowAddLocation(true)} className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-5 py-2.5 rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all font-medium" data-testid="button-add-location"><Plus size={18} /> Add Store</button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {locations.map((l: any) => (
                    <div key={l.id} className="bg-[#1a2440] rounded-2xl border border-white/10 p-5 hover:border-purple-400/30 transition-all" data-testid={`card-loc-${l.id}`}>
                      <div className="flex items-center justify-between"><h3 className="font-bold text-white flex items-center gap-2"><MapPin size={16} className="text-purple-400" /> {l.name}</h3><button onClick={async () => { if (confirm("Delete?")) { await fetch(`/api/inventory/locations/${l.id}`, { method: "DELETE" }); fetchAll(); } }} className="text-red-400/40 hover:text-red-400"><Trash2 size={16} /></button></div>
                      {l.address && <p className="text-sm text-white/30 mt-1">{l.address}</p>}
                      <div className="flex gap-3 mt-2 text-xs text-white/20">{l.rowNumber && <span>Row: {l.rowNumber}</span>}{l.area && <span>Area: {l.area}</span>}</div>
                    </div>
                  ))}
                  {locations.length === 0 && <div className="col-span-full text-center py-16 text-white/20"><Warehouse size={48} className="mx-auto mb-3 opacity-50" /><p>No stores yet</p></div>}
                </div>
              </div>
            )}
            {brandTab === "discounts" && (
              <div className="p-6">
                <h2 className="text-2xl font-bold text-white mb-6">{selectedBrand.name} — Discounts</h2>
                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="bg-[#1a2440] rounded-2xl border border-white/10 p-6">
                    <h3 className="font-bold text-white text-lg flex items-center gap-2 mb-3"><Percent size={20} className="text-purple-400" /> Global Discount</h3>
                    <p className="text-white/40 text-sm mb-4">Apply discount to ALL products. Example: 40% on £200 = £120</p>
                    <button onClick={() => setShowGlobalDiscount(true)} className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-6 py-2.5 rounded-xl font-medium" data-testid="button-global-discount">Apply Global Discount</button>
                  </div>
                  <SpecificDiscountPanel products={products} onRefresh={fetchAll} />
                </div>
                <div className="bg-[#1a2440] rounded-2xl border border-white/10 p-6 mt-6">
                  <h3 className="font-bold text-white text-lg mb-4">Price Overview</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b border-white/10 text-white/40"><th className="text-left py-3">Product</th><th className="text-right py-3">Base</th><th className="text-right py-3">Discount</th><th className="text-right py-3">Final</th></tr></thead>
                      <tbody>{products.map((p: any) => (
                        <tr key={p.id} className="border-b border-white/5"><td className="py-3 text-white">{p.name}</td><td className="text-right text-white/50">£{parseFloat(p.basePrice).toFixed(2)}</td><td className="text-right text-amber-400">{parseFloat(p.discountPercent || "0") > 0 ? `-${p.discountPercent}%` : "-"}</td><td className="text-right font-bold text-emerald-400">£{p.discountedPrice ? parseFloat(p.discountedPrice).toFixed(2) : parseFloat(p.basePrice).toFixed(2)}</td></tr>
                      ))}</tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {showAddProduct && <AddProductModal categories={categories} locations={locations} onClose={() => setShowAddProduct(false)} onSave={fetchAll} />}
      {editProduct && <AddProductModal categories={categories} locations={locations} product={editProduct} onClose={() => setEditProduct(null)} onSave={fetchAll} />}
      {showAddCategory && <SimpleModal title="Add Category" onClose={() => setShowAddCategory(false)} onSave={fetchAll} fields={[{ name: "name", label: "Name *", required: true }, { name: "description", label: "Description" }]} endpoint="/api/inventory/categories" extraData={(f: any) => ({ slug: (f.name || "").toLowerCase().replace(/\s+/g, "-") })} />}
      {showAddLocation && <SimpleModal title="Add Store" onClose={() => setShowAddLocation(false)} onSave={fetchAll} fields={[{ name: "name", label: "Store Name *", required: true }, { name: "address", label: "Address" }, { name: "rowNumber", label: "Row Number" }, { name: "area", label: "Area" }]} endpoint="/api/inventory/locations" />}
      {showAddBrand && <BrandModal onClose={() => setShowAddBrand(false)} onSave={fetchAll} />}
      {editBrand && <BrandModal brand={editBrand} onClose={() => setEditBrand(null)} onSave={fetchAll} />}
      {showScanner && <BarcodeScanner onClose={() => setShowScanner(false)} onFound={(p: any) => { setShowScanner(false); setEditProduct(p); }} onNotFound={() => { setShowScanner(false); setShowAddProduct(true); }} />}
      {showGlobalDiscount && <GlobalDiscountModal onClose={() => setShowGlobalDiscount(false)} onSave={fetchAll} />}
      {showStockModal && <StockModal product={showStockModal.product} action={showStockModal.action} brands={brands} onClose={() => setShowStockModal(null)} onSave={fetchAll} />}
      {showBrandPrices && <BrandPricesModal brand={showBrandPrices} products={products} prices={brandPrices} onClose={() => { setShowBrandPrices(null); }} onSave={() => { fetch(`/api/inventory/brands/${showBrandPrices.id}/prices`).then(r => r.json()).then(setBrandPrices); fetchAll(); }} />}
    </div>
  );
}

function BrandCompaniesView({ brands, onAddBrand, onEditBrand, onOpenBrand, onRefresh, products, brandPrices, setBrandPrices, showBrandPrices, setShowBrandPrices }: any) {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Brand Companies</h2>
        <button onClick={onAddBrand} className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-5 py-2.5 rounded-xl hover:shadow-lg hover:shadow-amber-500/25 transition-all font-medium" data-testid="button-add-brand"><Plus size={18} /> Add Brand</button>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {brands.map((b: any) => (
          <div key={b.id} className="bg-[#1a2440] rounded-2xl border border-white/10 overflow-hidden hover:border-amber-400/30 transition-all group" data-testid={`card-brand-${b.id}`}>
            <div className="p-5">
              <div className="flex items-start gap-3 mb-4">
                {b.logoUrl ? (
                  <img src={b.logoUrl} alt={b.name} className="w-14 h-14 rounded-xl object-contain bg-white/10 p-1" />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                    <Building2 size={24} className="text-amber-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white text-lg">{b.name}</h3>
                  <div className="text-sm text-white/30">@{b.slug}</div>
                </div>
              </div>

              {b.contactPerson && <div className="text-sm text-white/50 mb-1">Contact: {b.contactPerson}</div>}
              {b.phone && <div className="text-sm text-white/40 mb-2">{b.phone}</div>}

              <div className="bg-white/5 rounded-xl p-3 border border-white/5 mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <Lock size={12} className="text-amber-400/60" />
                  <span className="text-xs text-white/40 font-medium">Login Credentials</span>
                </div>
                <div className="text-sm text-white/60">
                  Username: <b className="text-amber-400">{b.adminUsername}</b>
                </div>
                <div className="text-sm text-white/60">
                  Password: <b className="text-amber-400/70">{b.adminPassword}</b>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={() => onOpenBrand(b)} className="flex-1 flex items-center justify-center gap-2 bg-purple-500/15 text-purple-400 py-2.5 rounded-xl text-sm font-medium hover:bg-purple-500/25 transition-all" title="Open Brand Management" data-testid={`btn-manage-${b.id}`}>
                  <Monitor size={16} /> Manage
                </button>
                <button onClick={() => onEditBrand(b)} className="p-2.5 hover:bg-white/5 rounded-xl text-white/40 transition-all" title="Edit Brand" data-testid={`btn-edit-${b.id}`}><Edit size={16} /></button>
                <button onClick={async () => { if (confirm("Delete this brand?")) { await fetch(`/api/inventory/brands/${b.id}`, { method: "DELETE" }); onRefresh(); } }} className="p-2.5 hover:bg-red-500/10 rounded-xl text-red-400/60 transition-all" title="Delete Brand" data-testid={`btn-del-${b.id}`}><Trash2 size={16} /></button>
              </div>
            </div>
          </div>
        ))}
        {brands.length === 0 && (
          <div className="col-span-full text-center py-16 text-white/20">
            <Building2 size={48} className="mx-auto mb-3 opacity-50" />
            <p>No brand companies yet</p>
            <p className="text-sm mt-1">Click "Add Brand" to create your first brand company</p>
          </div>
        )}
      </div>
    </div>
  );
}

function DashboardView({ products, brands, categories, locations, lowStockProducts, totalStock, totalValue, onOpenBrand }: any) {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-white mb-6">Dashboard</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Products", value: products.length, color: "from-blue-500 to-indigo-500", icon: Package },
          { label: "Total Stock", value: totalStock, color: "from-emerald-500 to-teal-500", icon: Boxes },
          { label: "Brand Companies", value: brands.length, color: "from-purple-500 to-pink-500", icon: Building2 },
          { label: "Low Stock Items", value: lowStockProducts.length, color: "from-red-500 to-orange-500", icon: AlertTriangle },
        ].map((card, i) => (
          <div key={i} className="relative overflow-hidden bg-[#1a2440] rounded-2xl border border-white/10 p-5">
            <div className={`absolute top-0 right-0 w-20 h-20 rounded-full bg-gradient-to-br ${card.color} opacity-10 -translate-y-4 translate-x-4`} />
            <card.icon size={20} className="text-white/30 mb-2" />
            <div className="text-3xl font-bold text-white">{card.value}</div>
            <div className="text-sm text-white/40">{card.label}</div>
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2 mb-6">
        <div className="bg-[#1a2440] rounded-2xl border border-white/10 p-5">
          <h3 className="text-white font-bold mb-3">Stock Value</h3>
          <div className="text-3xl font-bold text-emerald-400">£{totalValue.toFixed(2)}</div>
          <p className="text-white/30 text-sm mt-1">Total inventory value at base price</p>
        </div>
        <div className="bg-[#1a2440] rounded-2xl border border-white/10 p-5">
          <h3 className="text-white font-bold mb-3">Quick Stats</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-white/50"><span>Categories</span><span className="text-white font-medium">{categories.length}</span></div>
            <div className="flex justify-between text-white/50"><span>Stores</span><span className="text-white font-medium">{locations.length}</span></div>
            <div className="flex justify-between text-white/50"><span>Active Brands</span><span className="text-white font-medium">{brands.length}</span></div>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-white font-bold text-lg mb-4">Brand Companies</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {brands.map((b: any) => (
            <button key={b.id} onClick={() => onOpenBrand(b)} className="bg-[#1a2440] rounded-2xl border border-white/10 p-5 hover:border-purple-400/30 transition-all text-left group" data-testid={`dash-brand-${b.id}`}>
              <div className="flex items-center gap-3">
                {b.logoUrl ? (
                  <img src={b.logoUrl} alt={b.name} className="w-12 h-12 rounded-xl object-contain bg-white/10 p-1" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center">
                    <Building2 size={20} className="text-purple-400" />
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-white group-hover:text-purple-300 transition-colors">{b.name}</h4>
                  <p className="text-sm text-white/30">@{b.slug}</p>
                </div>
                <ChevronRight size={18} className="text-white/20 ml-auto group-hover:text-purple-400 transition-colors" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {lowStockProducts.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5">
          <h3 className="text-red-400 font-bold flex items-center gap-2 mb-3"><AlertTriangle size={18} /> Order Manufacturing Again!</h3>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {lowStockProducts.map((p: any) => (
              <div key={p.id} className="bg-red-500/10 rounded-xl p-3 flex items-center justify-between">
                <span className="text-red-300 font-medium">{p.name}</span>
                <span className="text-red-400 font-bold animate-pulse">{p.currentStock} left</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ProductImageSlider({ images }: { images: string[] }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(() => setIdx(i => (i + 1) % images.length), 3000);
    return () => clearInterval(timer);
  }, [images.length]);
  return (
    <div className="w-24 h-24 rounded-xl overflow-hidden relative shrink-0 bg-white/5">
      <img src={images[idx]} alt="" className="w-full h-full object-cover transition-all duration-500" />
      {images.length > 1 && (
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1">
          {images.map((_, i) => <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === idx ? "bg-amber-400" : "bg-white/30"}`} />)}
        </div>
      )}
    </div>
  );
}

function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className={`bg-[#1a2440] rounded-2xl border border-white/10 shadow-2xl w-full ${wide ? "max-w-2xl" : "max-w-lg"} max-h-[90vh] overflow-y-auto`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-white/10"><h2 className="font-bold text-white text-lg">{title}</h2><button onClick={onClose} className="p-1 hover:bg-white/5 rounded-lg text-white/40 hover:text-white"><X size={20} /></button></div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function AddProductModal({ categories, locations, product, onClose, onSave }: any) {
  const [form, setForm] = useState({
    name: product?.name || "", code: product?.code || "", barcode: product?.barcode || "", type: product?.type || "general",
    categoryId: product?.categoryId || "", locationId: product?.locationId || "", rowNumber: product?.rowNumber || "", area: product?.area || "",
    description: product?.description || "", unitType: product?.unitType || "pieces", unitsPerBox: product?.unitsPerBox || 1,
    manufacturingCost: product?.manufacturingCost || "0", basePrice: product?.basePrice || "", discountPercent: product?.discountPercent || "0",
    totalManufactured: product?.totalManufactured || 0, lowStockThreshold: product?.lowStockThreshold || 5,
    manufacturer: product?.manufacturer || "", weight: product?.weight || "", dimensions: product?.dimensions || "",
  });
  const [saving, setSaving] = useState(false);
  const base = parseFloat(form.basePrice) || 0;
  const disc = parseFloat(form.discountPercent) || 0;
  const final_ = base - (base * disc / 100);

  const save = async () => {
    if (!form.name || !form.code || !form.basePrice) return;
    setSaving(true);
    const url = product ? `/api/inventory/products/${product.id}` : "/api/inventory/products";
    await fetch(url, { method: product ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false); onSave(); onClose();
  };

  const inputClass = "w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-amber-400/50 mt-1";
  const labelClass = "text-sm font-medium text-white/60";

  return (
    <Modal title={product ? "Edit Product" : "Add New Product"} onClose={onClose} wide>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div><label className={labelClass}>Product Name *</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputClass} data-testid="input-product-name" /></div>
          <div><label className={labelClass}>Product Code *</label><input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} className={inputClass} data-testid="input-product-code" /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={labelClass}>Barcode</label><input value={form.barcode} onChange={e => setForm({ ...form, barcode: e.target.value })} className={inputClass} data-testid="input-barcode" /></div>
          <div><label className={labelClass}>Type</label><select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className={inputClass} data-testid="select-type"><option value="general">General</option><option value="food">Food</option><option value="cosmetic">Cosmetic</option><option value="electronic">Electronic</option><option value="clothing">Clothing</option><option value="raw_material">Raw Material</option></select></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={labelClass}>Category</label><select value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })} className={inputClass}><option value="">None</option>{categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div><label className={labelClass}>Store Location</label><select value={form.locationId} onChange={e => setForm({ ...form, locationId: e.target.value })} className={inputClass}><option value="">None</option>{locations.map((l: any) => <option key={l.id} value={l.id}>{l.name}</option>)}</select></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={labelClass}>Row Number</label><input value={form.rowNumber} onChange={e => setForm({ ...form, rowNumber: e.target.value })} className={inputClass} /></div>
          <div><label className={labelClass}>Area / Shelf</label><input value={form.area} onChange={e => setForm({ ...form, area: e.target.value })} className={inputClass} /></div>
        </div>
        <div><label className={labelClass}>Description</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className={inputClass} rows={2} /></div>
        <div className="grid grid-cols-3 gap-3">
          <div><label className={labelClass}>Unit Type</label><select value={form.unitType} onChange={e => setForm({ ...form, unitType: e.target.value })} className={inputClass}><option value="pieces">Pieces</option><option value="packets">Packets</option><option value="bucks">Bucks</option><option value="boxes">Boxes</option><option value="kg">KG</option><option value="litre">Litres</option></select></div>
          <div><label className={labelClass}>Units/Box</label><input type="number" value={form.unitsPerBox} onChange={e => setForm({ ...form, unitsPerBox: parseInt(e.target.value) || 1 })} className={inputClass} /></div>
          <div><label className={labelClass}>Low Stock Alert</label><input type="number" value={form.lowStockThreshold} onChange={e => setForm({ ...form, lowStockThreshold: parseInt(e.target.value) || 5 })} className={inputClass} /></div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div><label className={labelClass}>Mfg Cost (£)</label><input type="number" step="0.01" value={form.manufacturingCost} onChange={e => setForm({ ...form, manufacturingCost: e.target.value })} className={inputClass} /></div>
          <div><label className={labelClass}>Base Price (£) *</label><input type="number" step="0.01" value={form.basePrice} onChange={e => setForm({ ...form, basePrice: e.target.value })} className={inputClass} data-testid="input-base-price" /></div>
          <div><label className={labelClass}>Discount %</label><input type="number" step="0.01" value={form.discountPercent} onChange={e => setForm({ ...form, discountPercent: e.target.value })} className={inputClass} /></div>
        </div>
        {base > 0 && <div className="bg-emerald-500/10 rounded-xl p-3 text-center border border-emerald-500/20"><span className="text-white/40 text-sm">Final Price: </span><span className="text-2xl font-bold text-emerald-400">£{final_.toFixed(2)}</span>{disc > 0 && <span className="text-amber-400 text-sm ml-2">(-{disc}%)</span>}</div>}
        {!product && <div><label className={labelClass}>Initial Manufactured Qty</label><input type="number" value={form.totalManufactured} onChange={e => setForm({ ...form, totalManufactured: parseInt(e.target.value) || 0 })} className={inputClass} data-testid="input-qty" /></div>}
        <button onClick={save} disabled={saving} className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:shadow-lg hover:shadow-amber-500/25 disabled:opacity-50 transition-all" data-testid="button-save-product">{saving ? "Saving..." : product ? "Update Product" : "Add Product"}</button>
      </div>
    </Modal>
  );
}

function SimpleModal({ title, onClose, onSave, fields, endpoint, extraData }: any) {
  const [form, setForm] = useState<any>({});
  const save = async () => {
    const data = { ...form, ...(extraData ? extraData(form) : {}) };
    await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    onSave(); onClose();
  };
  const inputClass = "w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-amber-400/50 mt-1";
  return (
    <Modal title={title} onClose={onClose}>
      <div className="space-y-3">
        {fields.map((f: any) => (
          <div key={f.name}><label className="text-sm font-medium text-white/60">{f.label}</label><input value={form[f.name] || ""} onChange={e => setForm({ ...form, [f.name]: e.target.value })} className={inputClass} /></div>
        ))}
        <button onClick={save} className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:shadow-lg hover:shadow-amber-500/25 transition-all">Save</button>
      </div>
    </Modal>
  );
}

function BrandModal({ brand, onClose, onSave }: any) {
  const [form, setForm] = useState({
    name: brand?.name || "", slug: brand?.slug || "", phone: brand?.phone || "", email: brand?.email || "",
    address: brand?.address || "", contactPerson: brand?.contactPerson || "",
    adminUsername: brand?.adminUsername || "", adminPassword: brand?.adminPassword || "",
    agreedDiscountPercent: brand?.agreedDiscountPercent || "0",
    logoUrl: brand?.logoUrl || "",
  });
  const save = async () => {
    if (!form.name || !form.slug || !form.adminUsername || !form.adminPassword) return;
    const url = brand ? `/api/inventory/brands/${brand.id}` : "/api/inventory/brands";
    await fetch(url, { method: brand ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    onSave(); onClose();
  };
  const inputClass = "w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-amber-400/50 mt-1";
  return (
    <Modal title={brand ? "Edit Brand" : "Add Brand Company"} onClose={onClose}>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-sm font-medium text-white/60">Company Name *</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputClass} data-testid="input-brand-name" /></div>
          <div><label className="text-sm font-medium text-white/60">Slug *</label><input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })} className={inputClass} data-testid="input-brand-slug" /></div>
        </div>
        <div><label className="text-sm font-medium text-white/60">Logo URL</label><input value={form.logoUrl} onChange={e => setForm({ ...form, logoUrl: e.target.value })} placeholder="/chillpack-logo.png" className={inputClass} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-sm font-medium text-white/60">Contact Person</label><input value={form.contactPerson} onChange={e => setForm({ ...form, contactPerson: e.target.value })} className={inputClass} /></div>
          <div><label className="text-sm font-medium text-white/60">Phone</label><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={inputClass} /></div>
        </div>
        <div><label className="text-sm font-medium text-white/60">Email</label><input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={inputClass} /></div>
        <div><label className="text-sm font-medium text-white/60">Address</label><input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className={inputClass} /></div>
        <div className="bg-white/5 rounded-xl p-4 space-y-3 border border-white/10">
          <h4 className="font-semibold text-amber-400 text-sm">Login Credentials</h4>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-sm font-medium text-white/60">Username *</label><input value={form.adminUsername} onChange={e => setForm({ ...form, adminUsername: e.target.value })} className={inputClass} data-testid="input-brand-user" /></div>
            <div><label className="text-sm font-medium text-white/60">Password *</label><input value={form.adminPassword} onChange={e => setForm({ ...form, adminPassword: e.target.value })} className={inputClass} data-testid="input-brand-pass" /></div>
          </div>
        </div>
        <div><label className="text-sm font-medium text-white/60">Agreed Discount %</label><input type="number" step="0.01" value={form.agreedDiscountPercent} onChange={e => setForm({ ...form, agreedDiscountPercent: e.target.value })} className={inputClass} /></div>
        <button onClick={save} className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:shadow-lg hover:shadow-amber-500/25 transition-all" data-testid="button-save-brand">{brand ? "Update" : "Add Brand"}</button>
      </div>
    </Modal>
  );
}

function GlobalDiscountModal({ onClose, onSave }: any) {
  const [percent, setPercent] = useState(""); const [applying, setApplying] = useState(false); const [result, setResult] = useState("");
  const apply = async () => {
    if (!percent) return;
    setApplying(true);
    const res = await fetch("/api/inventory/products/global-discount", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ discountPercent: parseFloat(percent) }) });
    const data = await res.json();
    setResult(`${percent}% discount applied to ${data.count} products!`);
    setApplying(false); onSave();
  };
  return (
    <Modal title="Apply Global Discount" onClose={onClose}>
      <div className="space-y-4">
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
          <p className="text-amber-300 text-sm font-medium">This applies to ALL products</p>
          <p className="text-amber-300/60 text-xs mt-1">Example: 40% on £200 = £120</p>
        </div>
        {result && <div className="bg-emerald-500/10 text-emerald-300 p-3 rounded-xl border border-emerald-500/20">{result}</div>}
        <div><label className="text-sm font-medium text-white/60">Discount %</label><input type="number" step="0.01" value={percent} onChange={e => setPercent(e.target.value)} placeholder="e.g. 40" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-white text-lg placeholder-white/20 focus:outline-none focus:border-amber-400/50 mt-1" data-testid="input-global-disc" /></div>
        <button onClick={apply} disabled={applying} className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-500 disabled:opacity-50" data-testid="button-apply-global">{applying ? "Applying..." : "Apply to All Products"}</button>
      </div>
    </Modal>
  );
}

function SpecificDiscountPanel({ products, onRefresh }: any) {
  const [productId, setProductId] = useState(""); const [disc, setDisc] = useState(""); const [msg, setMsg] = useState("");
  const apply = async () => {
    if (!productId || !disc) return;
    await fetch(`/api/inventory/products/${productId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ discountPercent: disc }) });
    setMsg("Applied!"); setProductId(""); setDisc(""); onRefresh();
  };
  const inputClass = "w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-purple-400/50";
  return (
    <div className="bg-[#1a2440] rounded-2xl border border-white/10 p-6">
      <h3 className="font-bold text-white text-lg flex items-center gap-2 mb-3"><Tag size={20} className="text-indigo-400" /> Specific Product Discount</h3>
      <p className="text-white/40 text-sm mb-4">Apply discount to one product only</p>
      {msg && <div className="bg-emerald-500/10 text-emerald-300 p-2 rounded-xl mb-3 text-sm">{msg}</div>}
      <div className="space-y-3">
        <select value={productId} onChange={e => setProductId(e.target.value)} className={inputClass}><option value="">Select Product</option>{products.map((p: any) => <option key={p.id} value={p.id}>{p.name} (£{parseFloat(p.basePrice).toFixed(2)})</option>)}</select>
        <input type="number" value={disc} onChange={e => setDisc(e.target.value)} placeholder="Discount %" className={inputClass} />
        <button onClick={apply} className="w-full py-2.5 rounded-xl font-medium text-white bg-indigo-500 hover:bg-indigo-600 transition-all">Apply Discount</button>
      </div>
    </div>
  );
}

function StockModal({ product, action, brands, onClose, onSave }: any) {
  const [quantity, setQuantity] = useState(""); const [notes, setNotes] = useState(""); const [brandId, setBrandId] = useState(""); const [saving, setSaving] = useState(false);
  const save = async () => {
    if (!quantity) return;
    setSaving(true);
    const url = action === "add" ? `/api/inventory/products/${product.id}/add-stock` : `/api/inventory/products/${product.id}/dispatch`;
    await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ quantity: parseInt(quantity), notes, brandId }) });
    setSaving(false); onSave(); onClose();
  };
  const inputClass = "w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-400/50 mt-1";
  return (
    <Modal title={`${action === "add" ? "Add Stock" : "Dispatch"} - ${product.name}`} onClose={onClose}>
      <div className="space-y-4">
        <div className="bg-white/5 rounded-xl p-4 text-center border border-white/10"><span className="text-white/40 text-sm">Current Stock: </span><span className="text-3xl font-bold text-white">{product.currentStock}</span><span className="text-white/30 text-sm ml-1">{product.unitType}</span></div>
        <div><label className="text-sm font-medium text-white/60">Quantity *</label><input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} className={inputClass} data-testid="input-stock-qty" /></div>
        {action === "dispatch" && <div><label className="text-sm font-medium text-white/60">Dispatch To</label><select value={brandId} onChange={e => setBrandId(e.target.value)} className={inputClass}><option value="">Select Brand</option>{brands.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>}
        <div><label className="text-sm font-medium text-white/60">Notes</label><input value={notes} onChange={e => setNotes(e.target.value)} className={inputClass} /></div>
        <button onClick={save} disabled={saving} className={`w-full py-3 rounded-xl font-semibold text-white disabled:opacity-50 ${action === "add" ? "bg-blue-500 hover:bg-blue-600" : "bg-orange-500 hover:bg-orange-600"} transition-all`} data-testid="button-save-stock">{saving ? "Saving..." : action === "add" ? "Add Stock" : "Dispatch"}</button>
      </div>
    </Modal>
  );
}

function BarcodeScanner({ onClose, onFound, onNotFound }: any) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [manual, setManual] = useState("");
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      setError("");
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; setCameraActive(true); }
    } catch { setError("Camera access denied. Use manual entry."); }
  };
  const stopCamera = () => { if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; } setCameraActive(false); };
  useEffect(() => () => stopCamera(), []);

  const lookup = async (barcode: string) => {
    if (!barcode) return;
    setScanning(true);
    try {
      const res = await fetch(`/api/inventory/products/barcode/${barcode}`);
      if (res.ok) { stopCamera(); onFound(await res.json()); } else { stopCamera(); onNotFound(barcode); }
    } catch { setError("Lookup failed"); }
    setScanning(false);
  };

  return (
    <Modal title="Barcode Scanner" onClose={() => { stopCamera(); onClose(); }}>
      <div className="space-y-4">
        <div className="relative bg-black rounded-xl overflow-hidden aspect-video">
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
          {!cameraActive && <div className="absolute inset-0 flex items-center justify-center bg-[#0f1729]"><button onClick={startCamera} className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-3 rounded-xl flex items-center gap-2" data-testid="btn-open-cam"><QrCode size={20} /> Open Camera</button></div>}
          {cameraActive && <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><div className="w-64 h-32 border-2 border-amber-400 rounded-lg animate-pulse" /></div>}
        </div>
        {error && <div className="bg-red-500/10 text-red-300 p-3 rounded-xl text-sm">{error}</div>}
        <div className="text-center text-sm text-white/20">— or enter barcode manually —</div>
        <div className="flex gap-2">
          <input value={manual} onChange={e => setManual(e.target.value)} placeholder="Barcode number..." className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-400/50" data-testid="input-barcode-manual" onKeyDown={e => e.key === "Enter" && lookup(manual)} />
          <button onClick={() => lookup(manual)} disabled={scanning} className="bg-amber-500 text-white px-4 py-2.5 rounded-xl disabled:opacity-50" data-testid="btn-lookup">{scanning ? "..." : "Look Up"}</button>
        </div>
        <p className="text-xs text-white/20 text-center">If product exists it opens for editing. If not found, you can create it.</p>
      </div>
    </Modal>
  );
}

function BrandPricesModal({ brand, products, prices, onClose, onSave }: any) {
  const [productId, setProductId] = useState(""); const [agreedPrice, setAgreedPrice] = useState("");
  const save = async () => {
    if (!productId || !agreedPrice) return;
    await fetch("/api/inventory/brand-prices", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ brandId: brand.id, productId, agreedPrice }) });
    setProductId(""); setAgreedPrice(""); onSave();
  };
  const inputClass = "w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-400/50";
  return (
    <Modal title={`Agreed Prices — ${brand.name}`} onClose={onClose}>
      <div className="space-y-4">
        {prices.map((p: any) => {
          const prod = products.find((pr: any) => pr.id === p.productId);
          return (
            <div key={p.id} className="flex items-center justify-between bg-white/5 rounded-xl p-3 border border-white/5">
              <div><div className="font-medium text-white">{prod?.name || "Unknown"}</div><div className="text-xs text-white/30">Base: £{prod ? parseFloat(prod.basePrice).toFixed(2) : "?"}</div></div>
              <div className="flex items-center gap-2"><span className="font-bold text-emerald-400">£{parseFloat(p.agreedPrice).toFixed(2)}</span><button onClick={async () => { await fetch(`/api/inventory/brand-prices/${p.id}`, { method: "DELETE" }); onSave(); }} className="text-red-400/40 hover:text-red-400"><Trash2 size={14} /></button></div>
            </div>
          );
        })}
        {prices.length === 0 && <p className="text-center text-white/20 py-4">No agreed prices set yet</p>}
        <div className="border-t border-white/10 pt-4">
          <h4 className="font-semibold text-white/60 text-sm mb-3">Set Agreed Price</h4>
          <div className="flex gap-2">
            <select value={productId} onChange={e => setProductId(e.target.value)} className={`flex-1 ${inputClass}`}><option value="">Select Product</option>{products.map((p: any) => <option key={p.id} value={p.id}>{p.name} (£{parseFloat(p.basePrice).toFixed(2)})</option>)}</select>
            <input type="number" step="0.01" value={agreedPrice} onChange={e => setAgreedPrice(e.target.value)} placeholder="£" className={`w-24 ${inputClass}`} />
            <button onClick={save} className="bg-emerald-500 text-white px-4 py-2.5 rounded-xl">Set</button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
