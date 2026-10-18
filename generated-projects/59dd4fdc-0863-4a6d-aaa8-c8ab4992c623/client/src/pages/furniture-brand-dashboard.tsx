import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Sofa, LayoutDashboard, Package, Layers, ShoppingBag, Settings, Eye, LogOut, Plus, Edit, Trash2, Upload, ImagePlus, Image, Type, BellRing, X, Volume2, Printer, CheckCircle, Clock, Truck, MapPin, Phone, Mail, CreditCard, Calendar, Hash, ChevronDown, ChevronUp, Menu } from "lucide-react";

export default function FurnitureBrandDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [brand, setBrand] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showProductForm, setShowProductForm] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [showCatForm, setShowCatForm] = useState(false);
  const [editCat, setEditCat] = useState<any>(null);
  const [showSliderForm, setShowSliderForm] = useState(false);
  const [uploadCatId, setUploadCatId] = useState("");
  const [uploadProductId, setUploadProductId] = useState("");
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [animProduct, setAnimProduct] = useState("");
  const [animSearch, setAnimSearch] = useState("");
  const [alarmOrder, setAlarmOrder] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const alarmAudioRef = useRef<HTMLAudioElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const DEFAULT_ALARM_URL = "https://cdn.pixabay.com/audio/2024/11/04/audio_4956b4ece1.mp3";

  const [productForm, setProductForm] = useState({
    name: "", description: "", specifications: "", material: "", color: "", dimensions: "", weight: "",
    price: "", wasPrice: "", categoryId: "",
    image1: "", image2: "", image3: "", image4: "", image5: "", image6: "",
    isSoldOut: false, isFeatured: false, isNew: false, isOnSale: false,
  });

  const [catForm, setCatForm] = useState({ name: "", parentId: "", image: "", sortOrder: 0 });
  const [sliderForm, setSliderForm] = useState({ imageUrl: "", text: "", link: "" });

  const getAlarmSoundUrl = useCallback(() => {
    const pm: any = brand?.paymentMethods || {};
    return pm.alarmSoundUrl || DEFAULT_ALARM_URL;
  }, [brand]);

  const playAlarm = useCallback(() => {
    if (alarmAudioRef.current) { alarmAudioRef.current.pause(); alarmAudioRef.current = null; }
    const audio = new Audio(getAlarmSoundUrl());
    audio.loop = true; audio.volume = 1.0;
    audio.play().catch(() => {});
    alarmAudioRef.current = audio;
  }, [getAlarmSoundUrl]);

  const stopAlarm = useCallback(() => {
    if (alarmAudioRef.current) { alarmAudioRef.current.pause(); alarmAudioRef.current.currentTime = 0; alarmAudioRef.current = null; }
    setAlarmOrder(null);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("furnitureBrand");
    if (stored) setBrand(JSON.parse(stored));
    else setLocation("/furniture-brand-login");
  }, [setLocation]);

  const brandId = brand?.id;

  useEffect(() => {
    if (!brandId) return;
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/furniture-ws?brandId=${brandId}`);
    wsRef.current = ws;
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "new_order") { setAlarmOrder(data.order); playAlarm(); queryClient.invalidateQueries({ queryKey: ["/api/furniture/orders"] }); }
      } catch {}
    };
    ws.onclose = () => { setTimeout(() => { if (wsRef.current === ws) { const r = new WebSocket(`${protocol}//${window.location.host}/furniture-ws?brandId=${brandId}`); wsRef.current = r; r.onmessage = ws.onmessage; } }, 3000); };
    return () => { ws.close(); };
  }, [brandId, playAlarm, queryClient]);

  const { data: products = [] } = useQuery({ queryKey: ["/api/furniture/products", brandId], queryFn: () => fetch(`/api/furniture/products?brandId=${brandId}`).then(r => r.json()), enabled: !!brandId });
  const { data: categories = [] } = useQuery({ queryKey: ["/api/furniture/categories", brandId], queryFn: () => fetch(`/api/furniture/categories?brandId=${brandId}`).then(r => r.json()), enabled: !!brandId });
  const { data: orders = [] } = useQuery({ queryKey: ["/api/furniture/orders", brandId], queryFn: () => fetch(`/api/furniture/orders?brandId=${brandId}`).then(r => r.json()), enabled: !!brandId });

  const createProduct = useMutation({
    mutationFn: (data: any) => fetch("/api/furniture/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...data, brandId, price: data.price || "0" }) }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/furniture/products"] }); setShowProductForm(false); toast({ title: "Product added!" }); },
  });
  const updateProduct = useMutation({
    mutationFn: ({ id, ...data }: any) => fetch(`/api/furniture/products/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/furniture/products"] }); setShowProductForm(false); setEditProduct(null); toast({ title: "Product updated!" }); },
  });
  const deleteProduct = useMutation({
    mutationFn: (id: string) => fetch(`/api/furniture/products/${id}`, { method: "DELETE" }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/furniture/products"] }); toast({ title: "Product deleted!" }); },
  });
  const createCategory = useMutation({
    mutationFn: (data: any) => fetch("/api/furniture/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...data, brandId }) }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/furniture/categories"] }); setShowCatForm(false); toast({ title: "Category added!" }); },
  });
  const updateCategory = useMutation({
    mutationFn: ({ id, ...data }: any) => fetch(`/api/furniture/categories/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/furniture/categories"] }); setShowCatForm(false); setEditCat(null); toast({ title: "Category updated!" }); },
  });
  const deleteCategory = useMutation({
    mutationFn: (id: string) => fetch(`/api/furniture/categories/${id}`, { method: "DELETE" }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/furniture/categories"] }); toast({ title: "Category deleted!" }); },
  });
  const updateOrder = useMutation({
    mutationFn: ({ id, ...data }: any) => fetch(`/api/furniture/orders/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/furniture/orders"] }); toast({ title: "Order updated!" }); },
  });

  const uploadImage = async (file: File, field: string) => {
    setUploading(p => ({ ...p, [field]: true }));
    const reader = new FileReader();
    reader.onload = async () => {
      const res = await fetch("/api/upload-image", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image: reader.result, filename: `furn-${Date.now()}.${file.name.split('.').pop()}` }) });
      const data = await res.json();
      if (data.url) { setProductForm(p => ({ ...p, [field]: data.url })); toast({ title: "Image uploaded!" }); }
      setUploading(p => ({ ...p, [field]: false }));
    };
    reader.readAsDataURL(file);
  };

  const uploadImageForProduct = async (file: File, productId: string, field: string) => {
    setUploading(p => ({ ...p, [`${productId}-${field}`]: true }));
    const reader = new FileReader();
    reader.onload = async () => {
      const res = await fetch("/api/upload-image", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image: reader.result, filename: `furn-${Date.now()}.${file.name.split('.').pop()}` }) });
      const data = await res.json();
      if (data.url) {
        await fetch(`/api/furniture/products/${productId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ [field]: data.url }) });
        queryClient.invalidateQueries({ queryKey: ["/api/furniture/products"] });
        toast({ title: "Image uploaded!" });
      }
      setUploading(p => ({ ...p, [`${productId}-${field}`]: false }));
    };
    reader.readAsDataURL(file);
  };

  if (!brand) return null;

  const mainCategories = categories.filter((c: any) => !c.parentId);
  const subCategories = (parentId: string) => categories.filter((c: any) => c.parentId === parentId);
  const currency = brand.currency || "£";
  const accentColor = brand.accentColor || "#D4AF37";

  const toggleOrderExpand = (orderId: string) => {
    setExpandedOrders(prev => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId); else next.add(orderId);
      return next;
    });
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { bg: string; text: string; icon: any; label: string }> = {
      pending: { bg: "bg-amber-500/20", text: "text-amber-400", icon: Clock, label: "Pending" },
      confirmed: { bg: "bg-blue-500/20", text: "text-blue-400", icon: CheckCircle, label: "Confirmed" },
      processing: { bg: "bg-purple-500/20", text: "text-purple-400", icon: Package, label: "Processing" },
      shipped: { bg: "bg-cyan-500/20", text: "text-cyan-400", icon: Truck, label: "Shipped" },
      delivered: { bg: "bg-green-500/20", text: "text-green-400", icon: CheckCircle, label: "Delivered" },
      cancelled: { bg: "bg-red-500/20", text: "text-red-400", icon: X, label: "Cancelled" },
    };
    return configs[status] || configs.pending;
  };

  const printFurnitureReceipt = (order: any) => {
    const items = Array.isArray(order.items) ? order.items : [];
    const subtotal = items.reduce((sum: number, item: any) => sum + (Number(item.price) * Number(item.quantity)), 0);
    const orderDate = new Date(order.createdAt);
    const receiptHtml = `<!DOCTYPE html><html><head><title>Receipt #${order.id.slice(0,8).toUpperCase()}</title>
<style>
  @page { size: 80mm auto; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Courier New', monospace; width: 80mm; max-width: 80mm; padding: 4mm; color: #000; background: #fff; font-size: 12px; }
  .center { text-align: center; } .bold { font-weight: bold; }
  .line { border-top: 1px dashed #000; margin: 6px 0; }
  .double-line { border-top: 2px solid #000; margin: 6px 0; }
  .flex { display: flex; justify-content: space-between; }
  .brand-name { font-size: 18px; font-weight: bold; letter-spacing: 2px; margin-bottom: 2px; }
  .item-row { display: flex; justify-content: space-between; padding: 2px 0; font-size: 11px; }
  .item-detail { font-size: 10px; color: #555; padding-left: 8px; }
  .total-row { display: flex; justify-content: space-between; font-size: 14px; font-weight: bold; padding: 4px 0; }
  .footer { font-size: 9px; color: #555; text-align: center; margin-top: 8px; }
</style></head><body>
<div class="center">
  <div class="brand-name">${brand.name?.toUpperCase() || 'FURNITURE STORE'}</div>
  <div style="font-size:10px;color:#555">${brand.description?.slice(0,60) || 'Premium Furniture'}</div>
  ${brand.address ? `<div style="font-size:9px;color:#555">${brand.address}</div>` : ''}
  ${brand.phone ? `<div style="font-size:9px;color:#555">Tel: ${brand.phone}</div>` : ''}
  ${brand.email ? `<div style="font-size:9px;color:#555">${brand.email}</div>` : ''}
</div>
<div class="double-line"></div>
<div class="center"><div style="font-size:14px;font-weight:bold;margin:4px 0">SALES RECEIPT</div></div>
<div class="line"></div>
<div class="flex" style="font-size:10px"><span>Order: #${order.id.slice(0,8).toUpperCase()}</span><span>${orderDate.toLocaleDateString()}</span></div>
<div style="font-size:10px">${orderDate.toLocaleTimeString()}</div>
<div class="line"></div>
<div style="font-size:11px;margin-bottom:4px">
  <div class="bold">${order.customerName}</div>
  ${order.customerPhone ? `<div>${order.customerPhone}</div>` : ''}
  ${order.customerAddress ? `<div style="font-size:10px">${order.customerAddress}${order.customerCity ? ', ' + order.customerCity : ''}</div>` : ''}
</div>
<div class="double-line"></div>
<div class="flex bold" style="font-size:11px;margin-bottom:4px"><span>ITEM</span><span>AMOUNT</span></div>
<div class="line"></div>
${items.map((item: any) => `<div>
  <div class="item-row"><span style="flex:1">${item.name}</span><span>${currency} ${(Number(item.price) * Number(item.quantity)).toLocaleString()}</span></div>
  <div class="item-detail">${item.quantity}x @ ${currency} ${Number(item.price).toLocaleString()}${item.color ? ' | ' + item.color : ''}${item.dimensions ? ' | ' + item.dimensions : ''}</div>
</div>`).join('')}
<div class="double-line"></div>
<div class="flex" style="font-size:11px"><span>Subtotal:</span><span>${currency} ${subtotal.toLocaleString()}</span></div>
${order.deliveryFee && Number(order.deliveryFee) > 0 ? `<div class="flex" style="font-size:11px"><span>Delivery:</span><span>${currency} ${Number(order.deliveryFee).toLocaleString()}</span></div>` : ''}
<div class="line"></div>
<div class="total-row"><span>TOTAL:</span><span>${currency} ${Number(order.total).toLocaleString()}</span></div>
<div class="line"></div>
<div class="flex" style="font-size:10px"><span>Payment:</span><span class="bold">${(order.paymentMethod || 'Cash').toUpperCase()}</span></div>
<div class="flex" style="font-size:10px"><span>Status:</span><span class="bold">${(order.orderStatus || 'confirmed').toUpperCase()}</span></div>
<div class="double-line"></div>
<div class="center footer">
  <p style="font-size:11px;font-weight:bold;margin-bottom:4px">Thank you for your purchase!</p>
  <p>Visit us at</p>
  <p style="font-weight:bold">${window.location.origin}/furniture/${brand.slug}</p>
  <div class="line" style="margin-top:8px"></div>
  <p style="margin-top:4px">Powered by Link24</p>
  <p>www.link24.online</p>
</div></body></html>`;
    const pw = window.open('', '_blank', 'width=320,height=600');
    if (pw) { pw.document.write(receiptHtml); pw.document.close(); setTimeout(() => pw.print(), 300); }
  };

  const sidebar = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "products", label: "Products", icon: Package },
    { id: "categories", label: "Categories", icon: Layers },
    { id: "orders", label: "Orders", icon: ShoppingBag },
    { id: "upload", label: "Upload Images", icon: ImagePlus },
    { id: "banners", label: "Banner Slider", icon: Image },
    { id: "animate", label: "Animated Text", icon: Type },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const ProductFormUI = ({ label, onSubmit }: { label: string; onSubmit: () => void }) => (
    <div className="grid gap-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div><Label className="text-xs">Product Name *</Label><Input value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} /></div>
        <div><Label className="text-xs">Category</Label>
          <Select value={productForm.categoryId} onValueChange={v => setProductForm({ ...productForm, categoryId: v })}>
            <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
            <SelectContent>{categories.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.parentId ? "  └ " : ""}{c.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div><Label className="text-xs">Description</Label><Textarea value={productForm.description} onChange={e => setProductForm({ ...productForm, description: e.target.value })} rows={3} /></div>
      <div><Label className="text-xs">Specifications</Label><Textarea value={productForm.specifications} onChange={e => setProductForm({ ...productForm, specifications: e.target.value })} rows={2} placeholder="Assembly required, Warranty info..." /></div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div><Label className="text-xs">Material</Label><Input value={productForm.material} onChange={e => setProductForm({ ...productForm, material: e.target.value })} placeholder="Wood, Metal, Glass..." /></div>
        <div><Label className="text-xs">Color</Label><Input value={productForm.color} onChange={e => setProductForm({ ...productForm, color: e.target.value })} placeholder="Oak, White..." /></div>
        <div><Label className="text-xs">Weight</Label><Input value={productForm.weight} onChange={e => setProductForm({ ...productForm, weight: e.target.value })} placeholder="25kg" /></div>
      </div>
      <div><Label className="text-xs">Dimensions (W x H x D)</Label><Input value={productForm.dimensions} onChange={e => setProductForm({ ...productForm, dimensions: e.target.value })} placeholder="120cm x 75cm x 60cm" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-xs">Price *</Label><Input value={productForm.price} onChange={e => setProductForm({ ...productForm, price: e.target.value })} placeholder="0.00" /></div>
        <div><Label className="text-xs">Was Price (before)</Label><Input value={productForm.wasPrice} onChange={e => setProductForm({ ...productForm, wasPrice: e.target.value })} placeholder="Original price" /></div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {["image1","image2","image3","image4","image5","image6"].map(f => (
          <div key={f}>
            <Label className="text-xs">{f.replace("image","Image ")}</Label>
            <div className="flex gap-1">
              <Input value={(productForm as any)[f]} onChange={e => setProductForm({ ...productForm, [f]: e.target.value })} placeholder="URL or upload" className="text-xs" />
              <label className="cursor-pointer px-2 py-1 bg-amber-600 rounded text-xs flex items-center">
                {uploading[f] ? "..." : <Upload className="h-3 w-3" />}
                <input type="file" className="hidden" accept="image/*,.gif" onChange={e => { if (e.target.files?.[0]) uploadImage(e.target.files[0], f); }} />
              </label>
            </div>
            {(productForm as any)[f] && <img src={(productForm as any)[f]} className="w-full h-16 object-cover rounded mt-1" />}
          </div>
        ))}
      </div>
      <div className="flex gap-4 flex-wrap">
        <label className="flex items-center gap-2 text-sm"><Switch checked={productForm.isSoldOut} onCheckedChange={v => setProductForm({ ...productForm, isSoldOut: v })} /> Sold Out</label>
        <label className="flex items-center gap-2 text-sm"><Switch checked={productForm.isFeatured} onCheckedChange={v => setProductForm({ ...productForm, isFeatured: v })} /> Featured</label>
        <label className="flex items-center gap-2 text-sm"><Switch checked={productForm.isNew} onCheckedChange={v => setProductForm({ ...productForm, isNew: v })} /> New</label>
        <label className="flex items-center gap-2 text-sm"><Switch checked={productForm.isOnSale} onCheckedChange={v => setProductForm({ ...productForm, isOnSale: v })} /> On Sale</label>
      </div>
      <Button className="bg-gradient-to-r from-amber-500 to-orange-600" onClick={onSubmit}>{label}</Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-950 via-amber-950/30 to-stone-950 text-white flex flex-col md:flex-row relative">
      {alarmOrder && (
        <div className="fixed inset-0 z-[9999] bg-black/70 flex items-center justify-center" style={{ animation: "pulse 1s infinite" }}>
          <style>{`@keyframes pulse { 0%,100% { background: rgba(0,0,0,0.7); } 50% { background: rgba(220,38,38,0.4); } } @keyframes bellRing { 0%,100% { transform: rotate(0); } 25% { transform: rotate(15deg); } 75% { transform: rotate(-15deg); } }`}</style>
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full mx-4 text-center shadow-2xl">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4" style={{ animation: "bellRing 0.5s infinite" }}>
              <BellRing className="h-10 w-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">New Order Received!</h2>
            <div className="bg-gray-50 rounded-lg p-4 mb-4 text-left">
              <p className="text-sm text-gray-600"><span className="font-medium">Customer:</span> {alarmOrder.customerName}</p>
              <p className="text-sm text-gray-600"><span className="font-medium">Phone:</span> {alarmOrder.customerPhone}</p>
              <p className="text-sm text-gray-600"><span className="font-medium">Payment:</span> {alarmOrder.paymentMethod?.toUpperCase()}</p>
              <p className="text-lg font-bold text-green-600 mt-2">{currency} {Number(alarmOrder.total).toLocaleString()}</p>
            </div>
            <Button onClick={stopAlarm} className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-bold text-lg" data-testid="button-dismiss-alarm"><X className="h-5 w-5 mr-2" /> DISMISS ALARM</Button>
          </div>
        </div>
      )}

      <div className="md:hidden flex items-center justify-between p-3 bg-black/40 border-b border-white/10">
        <div className="flex items-center gap-3">
          {brand.logo ? <img src={brand.logo} className="w-8 h-8 rounded-lg object-cover" /> : <Sofa className="h-6 w-6 text-amber-400" />}
          <h2 className="font-bold text-sm truncate">{brand.name}</h2>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { const a = new Audio(getAlarmSoundUrl()); a.play().catch(() => {}); setTimeout(() => a.pause(), 3000); }}
            className="relative p-2 rounded-lg hover:bg-white/10" data-testid="button-test-alarm-mobile">
            <BellRing className="h-5 w-5 text-amber-400" />
            {orders.filter((o: any) => o.orderStatus === "pending").length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold flex items-center justify-center text-white animate-pulse">
                {orders.filter((o: any) => o.orderStatus === "pending").length}
              </span>
            )}
          </button>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg bg-white/10">
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/80" onClick={() => setSidebarOpen(false)}>
          <div className="w-64 h-full bg-stone-950 border-r border-white/10 p-4 flex flex-col overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4 p-2">
              {brand.logo ? <img src={brand.logo} className="w-10 h-10 rounded-lg object-cover" /> : <Sofa className="h-8 w-8 text-amber-400" />}
              <div className="min-w-0"><h2 className="font-bold text-sm truncate">{brand.name}</h2><p className="text-xs text-gray-400">Brand Dashboard</p></div>
            </div>
            <div className="border-b border-white/10 mb-4" />
            {sidebar.map(item => (
              <button key={item.id} onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm transition-all ${activeTab === item.id ? "bg-amber-600/20 text-amber-400" : "text-gray-400 hover:bg-white/5"}`}>
                <item.icon className="h-4 w-4" />{item.label}
                {item.id === "orders" && orders.filter((o: any) => o.orderStatus === "pending").length > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-1.5">{orders.filter((o: any) => o.orderStatus === "pending").length}</span>
                )}
              </button>
            ))}
            <div className="mt-auto space-y-2 pt-4">
              <Button variant="ghost" className="w-full justify-start text-gray-400 hover:text-white" onClick={() => window.open(`/furniture/${brand.slug}`, "_blank")}><Eye className="h-4 w-4 mr-2" /> View Store</Button>
              <Button variant="ghost" className="w-full justify-start text-gray-400 hover:text-red-400" onClick={() => { localStorage.removeItem("furnitureBrand"); setLocation("/furniture-brand-login"); }}><LogOut className="h-4 w-4 mr-2" /> Logout</Button>
            </div>
          </div>
        </div>
      )}

      <div className="hidden md:flex w-60 bg-black/40 border-r border-white/10 p-4 flex-col flex-shrink-0">
        <div className="flex items-center gap-3 mb-4 p-2">
          {brand.logo ? <img src={brand.logo} className="w-10 h-10 rounded-lg object-cover" /> : <Sofa className="h-8 w-8 text-amber-400" />}
          <div className="min-w-0 flex-1"><h2 className="font-bold text-sm truncate">{brand.name}</h2><p className="text-xs text-gray-400">Brand Dashboard</p></div>
          <button onClick={() => { const a = new Audio(getAlarmSoundUrl()); a.play().catch(() => {}); setTimeout(() => a.pause(), 3000); }}
            className="relative p-2 rounded-lg hover:bg-white/10 transition-all" title="Test Alarm" data-testid="button-test-alarm">
            <BellRing className="h-5 w-5 text-amber-400" />
            {orders.filter((o: any) => o.orderStatus === "pending").length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold flex items-center justify-center text-white animate-pulse">
                {orders.filter((o: any) => o.orderStatus === "pending").length}
              </span>
            )}
          </button>
        </div>
        <div className="border-b border-white/10 mb-4" />
        {sidebar.map(item => (
          <button key={item.id} onClick={() => setActiveTab(item.id)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm transition-all ${activeTab === item.id ? "bg-amber-600/20 text-amber-400" : "text-gray-400 hover:bg-white/5"}`}>
            <item.icon className="h-4 w-4" />{item.label}
            {item.id === "orders" && orders.filter((o: any) => o.orderStatus === "pending").length > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-1.5">{orders.filter((o: any) => o.orderStatus === "pending").length}</span>
            )}
          </button>
        ))}
        <div className="mt-auto space-y-2">
          <Button variant="ghost" className="w-full justify-start text-gray-400 hover:text-white" onClick={() => window.open(`/furniture/${brand.slug}`, "_blank")}><Eye className="h-4 w-4 mr-2" /> View Store</Button>
          <Button variant="ghost" className="w-full justify-start text-gray-400 hover:text-red-400" onClick={() => { localStorage.removeItem("furnitureBrand"); setLocation("/furniture-brand-login"); }}><LogOut className="h-4 w-4 mr-2" /> Logout</Button>
        </div>
      </div>

      <div className="flex-1 p-3 sm:p-6 overflow-y-auto min-h-0" style={{ maxHeight: "100vh" }}>
        {activeTab === "dashboard" && (
          <div>
            <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Products", value: products.length, color: "from-amber-500 to-orange-600" },
                { label: "Categories", value: categories.length, color: "from-emerald-500 to-teal-600" },
                { label: "Total Orders", value: orders.length, color: "from-blue-500 to-indigo-600" },
                { label: "Pending", value: orders.filter((o: any) => o.orderStatus === "pending").length, color: "from-red-500 to-pink-600" },
              ].map(s => (
                <Card key={s.label} className="bg-black/40 border-white/10 text-white">
                  <CardContent className="pt-6 text-center">
                    <p className={`text-3xl font-bold bg-gradient-to-r ${s.color} bg-clip-text text-transparent`}>{s.value}</p>
                    <p className="text-sm text-gray-400 mt-1">{s.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === "products" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold">Products ({products.length})</h1>
              <Button onClick={() => { setEditProduct(null); setProductForm({ name: "", description: "", specifications: "", material: "", color: "", dimensions: "", weight: "", price: "", wasPrice: "", categoryId: "", image1: "", image2: "", image3: "", image4: "", image5: "", image6: "", isSoldOut: false, isFeatured: false, isNew: false, isOnSale: false }); setShowProductForm(true); }}
                className="bg-gradient-to-r from-amber-500 to-orange-600"><Plus className="h-4 w-4 mr-2" /> Add Product</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((p: any) => {
                const cat = categories.find((c: any) => c.id === p.categoryId);
                return (
                  <Card key={p.id} className={`bg-black/40 border-white/10 text-white ${p.isSoldOut ? "opacity-60" : ""}`}>
                    <CardContent className="pt-4">
                      {p.image1 && <img src={p.image1} className="w-full h-40 object-cover rounded-lg mb-3" />}
                      <div className="flex gap-1 mb-2">
                        {p.isSoldOut && <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded">SOLD</span>}
                        {p.isNew && <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">NEW</span>}
                        {p.isOnSale && <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded">SALE</span>}
                        {p.isFeatured && <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded">FEATURED</span>}
                      </div>
                      <h3 className="font-bold truncate">{p.name}</h3>
                      <p className="text-xs text-gray-400">{cat?.name || "No category"}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="font-bold" style={{ color: accentColor }}>{currency} {Number(p.price).toLocaleString()}</span>
                        {p.wasPrice && <span className="text-sm text-gray-500 line-through">{currency} {Number(p.wasPrice).toLocaleString()}</span>}
                      </div>
                      {p.dimensions && <p className="text-xs text-gray-500 mt-1">{p.dimensions}</p>}
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10" onClick={() => {
                          setEditProduct(p);
                          setProductForm({ name: p.name, description: p.description || "", specifications: p.specifications || "", material: p.material || "", color: p.color || "", dimensions: p.dimensions || "", weight: p.weight || "", price: p.price || "", wasPrice: p.wasPrice || "", categoryId: p.categoryId || "", image1: p.image1 || "", image2: p.image2 || "", image3: p.image3 || "", image4: p.image4 || "", image5: p.image5 || "", image6: p.image6 || "", isSoldOut: p.isSoldOut, isFeatured: p.isFeatured, isNew: p.isNew, isOnSale: p.isOnSale });
                          setShowProductForm(true);
                        }}><Edit className="h-3 w-3" /></Button>
                        <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10"
                          onClick={() => fetch(`/api/furniture/products/${p.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isSoldOut: !p.isSoldOut }) }).then(() => { queryClient.invalidateQueries({ queryKey: ["/api/furniture/products"] }); toast({ title: p.isSoldOut ? "Marked available" : "Marked sold out" }); })}>
                          {p.isSoldOut ? "Available" : "Sold Out"}
                        </Button>
                        <Button size="sm" variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-500/10" onClick={() => deleteProduct.mutate(p.id)}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            <Dialog open={showProductForm} onOpenChange={setShowProductForm}>
              <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 text-white border-white/10">
                <DialogHeader><DialogTitle>{editProduct ? "Edit" : "Add"} Product</DialogTitle></DialogHeader>
                <ProductFormUI label={editProduct ? "Update Product" : "Add Product"} onSubmit={() => {
                  if (!productForm.name || !productForm.price) return;
                  editProduct ? updateProduct.mutate({ id: editProduct.id, ...productForm }) : createProduct.mutate(productForm);
                }} />
              </DialogContent>
            </Dialog>
          </div>
        )}

        {activeTab === "categories" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold">Categories</h1>
              <Button onClick={() => { setEditCat(null); setCatForm({ name: "", parentId: "", image: "", sortOrder: 0 }); setShowCatForm(true); }}
                className="bg-gradient-to-r from-amber-500 to-orange-600"><Plus className="h-4 w-4 mr-2" /> Add Category</Button>
            </div>
            <div className="space-y-2">
              {mainCategories.map((mc: any) => (
                <div key={mc.id}>
                  <Card className="bg-black/40 border-white/10 text-white">
                    <CardContent className="pt-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {mc.image && <img src={mc.image} className="w-10 h-10 rounded object-cover" />}
                        <div><h3 className="font-bold">{mc.name}</h3><p className="text-xs text-gray-400">{subCategories(mc.id).length} subcategories • {products.filter((p: any) => p.categoryId === mc.id).length} products</p></div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10" onClick={() => { setEditCat(mc); setCatForm({ name: mc.name, parentId: mc.parentId || "", image: mc.image || "", sortOrder: mc.sortOrder || 0 }); setShowCatForm(true); }}><Edit className="h-3 w-3" /></Button>
                        <Button size="sm" variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-500/10" onClick={() => deleteCategory.mutate(mc.id)}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </CardContent>
                  </Card>
                  {subCategories(mc.id).map((sc: any) => (
                    <Card key={sc.id} className="bg-black/20 border-white/5 text-white ml-8 mt-1">
                      <CardContent className="pt-3 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-gray-500">└</span>
                          {sc.image && <img src={sc.image} className="w-8 h-8 rounded object-cover" />}
                          <div><p className="text-sm font-medium">{sc.name}</p><p className="text-xs text-gray-500">{products.filter((p: any) => p.categoryId === sc.id).length} products</p></div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10" onClick={() => { setEditCat(sc); setCatForm({ name: sc.name, parentId: sc.parentId || "", image: sc.image || "", sortOrder: sc.sortOrder || 0 }); setShowCatForm(true); }}><Edit className="h-3 w-3" /></Button>
                          <Button size="sm" variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-500/10" onClick={() => deleteCategory.mutate(sc.id)}><Trash2 className="h-3 w-3" /></Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ))}
            </div>
            <Dialog open={showCatForm} onOpenChange={setShowCatForm}>
              <DialogContent className="bg-slate-900 text-white border-white/10">
                <DialogHeader><DialogTitle>{editCat ? "Edit" : "Add"} Category</DialogTitle></DialogHeader>
                <div className="grid gap-3">
                  <div><Label>Name *</Label><Input value={catForm.name} onChange={e => setCatForm({ ...catForm, name: e.target.value })} /></div>
                  <div><Label>Parent Category (leave empty for main)</Label>
                    <Select value={catForm.parentId} onValueChange={v => setCatForm({ ...catForm, parentId: v === "none" ? "" : v })}>
                      <SelectTrigger><SelectValue placeholder="None (Main Category)" /></SelectTrigger>
                      <SelectContent><SelectItem value="none">None (Main Category)</SelectItem>{mainCategories.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Image URL</Label><Input value={catForm.image} onChange={e => setCatForm({ ...catForm, image: e.target.value })} /></div>
                  <div><Label>Sort Order</Label><Input type="number" value={catForm.sortOrder} onChange={e => setCatForm({ ...catForm, sortOrder: parseInt(e.target.value) || 0 })} /></div>
                  <Button className="bg-gradient-to-r from-amber-500 to-orange-600" onClick={() => {
                    if (!catForm.name) return;
                    editCat ? updateCategory.mutate({ id: editCat.id, ...catForm }) : createCategory.mutate(catForm);
                  }}>{editCat ? "Update" : "Add"} Category</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {activeTab === "orders" && (
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">Orders ({orders.length})</h1>
                <p className="text-sm text-gray-400">{orders.filter((o: any) => o.orderStatus === "pending").length} pending</p>
              </div>
            </div>

            <div className="space-y-4">
              {orders.map((o: any) => {
                const sc = getStatusConfig(o.orderStatus);
                const StatusIcon = sc.icon;
                const isExpanded = expandedOrders.has(o.id);
                const items = Array.isArray(o.items) ? o.items : [];
                const itemCount = items.reduce((s: number, i: any) => s + Number(i.quantity), 0);

                return (
                  <Card key={o.id} className="bg-gradient-to-br from-black/60 to-black/30 border-white/10 text-white overflow-hidden hover:border-white/20 transition-all" data-testid={`card-order-${o.id}`}>
                    <div className={`h-1 w-full ${o.orderStatus === "pending" ? "bg-amber-500" : o.orderStatus === "confirmed" ? "bg-blue-500" : o.orderStatus === "delivered" ? "bg-green-500" : o.orderStatus === "cancelled" ? "bg-red-500" : "bg-purple-500"}`} />
                    <CardContent className="pt-4 pb-3">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full ${sc.bg} flex items-center justify-center flex-shrink-0`}>
                                <StatusIcon className={`h-4 w-4 sm:h-5 sm:w-5 ${sc.text}`} />
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="font-bold text-sm sm:text-base">{o.customerName}</h3>
                                  <span className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-medium ${sc.bg} ${sc.text}`}>{sc.label}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                                  <Hash className="h-3 w-3" />
                                  <span>{o.id.slice(0,8).toUpperCase()}</span>
                                  <span>•</span>
                                  <Calendar className="h-3 w-3" />
                                  <span>{new Date(o.createdAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-lg sm:text-xl font-bold" style={{ color: accentColor }}>{currency} {Number(o.total).toLocaleString()}</p>
                              <p className="text-[10px] text-gray-500">{itemCount} item{itemCount !== 1 ? "s" : ""}</p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400 mb-3">
                            {o.customerPhone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{o.customerPhone}</span>}
                            {o.customerEmail && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{o.customerEmail}</span>}
                            {o.customerCity && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{o.customerCity}</span>}
                            {o.paymentMethod && <span className="flex items-center gap-1"><CreditCard className="h-3 w-3" />{o.paymentMethod.toUpperCase()}</span>}
                          </div>

                          {isExpanded && (
                            <div className="bg-white/5 rounded-lg p-3 mb-3 border border-white/5">
                              {o.customerAddress && <p className="text-xs text-gray-400 mb-2 flex items-start gap-1"><MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />{o.customerAddress}, {o.customerCity}</p>}
                              <div className="space-y-2">
                                {items.map((item: any, idx: number) => (
                                  <div key={idx} className="flex justify-between items-center text-sm border-b border-white/5 pb-2 last:border-0 last:pb-0">
                                    <div>
                                      <p className="font-medium text-xs sm:text-sm">{item.name}</p>
                                      <p className="text-[10px] sm:text-xs text-gray-500">
                                        Qty: {item.quantity} {item.color && `| ${item.color}`} {item.dimensions && `| ${item.dimensions}`}
                                      </p>
                                    </div>
                                    <p className="font-medium text-xs sm:text-sm" style={{ color: accentColor }}>{currency} {(Number(item.price) * Number(item.quantity)).toLocaleString()}</p>
                                  </div>
                                ))}
                              </div>
                              {o.notes && <p className="text-xs text-gray-400 mt-2 italic">Note: {o.notes}</p>}
                            </div>
                          )}

                          <div className="flex flex-wrap items-center gap-2">
                            <button onClick={() => toggleOrderExpand(o.id)} className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors" data-testid={`button-expand-order-${o.id}`}>
                              {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                              {isExpanded ? "Less" : "Details"}
                            </button>

                            <Select value={o.orderStatus} onValueChange={v => updateOrder.mutate({ id: o.id, orderStatus: v })}>
                              <SelectTrigger className="w-28 sm:w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {["pending","confirmed","processing","shipped","delivered","cancelled"].map(s => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}
                              </SelectContent>
                            </Select>

                            {o.orderStatus === "pending" && (
                              <Button size="sm" className="h-8 bg-green-600 hover:bg-green-700 text-xs" data-testid={`button-accept-order-${o.id}`}
                                onClick={() => updateOrder.mutate({ id: o.id, orderStatus: "confirmed" })}>
                                <CheckCircle className="h-3 w-3 mr-1" /> Accept
                              </Button>
                            )}

                            {o.orderStatus !== "pending" && o.orderStatus !== "cancelled" && (
                              <Button size="sm" variant="outline" className="h-8 border-white/20 text-xs gap-1" data-testid={`button-print-receipt-${o.id}`}
                                onClick={() => printFurnitureReceipt(o)}>
                                <Printer className="h-3 w-3" /> Receipt
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            {orders.length === 0 && (
              <div className="text-center py-16">
                <ShoppingBag className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No orders yet</p>
                <p className="text-gray-600 text-sm mt-1">Orders will appear here when customers place them</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "upload" && (
          <div>
            <h1 className="text-2xl font-bold mb-6">Upload Images</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <Label>Select Category</Label>
                <Select value={uploadCatId} onValueChange={v => { setUploadCatId(v); setUploadProductId(""); }}>
                  <SelectTrigger><SelectValue placeholder="All categories" /></SelectTrigger>
                  <SelectContent><SelectItem value="all">All</SelectItem>{categories.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.parentId ? "  └ " : ""}{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Select Product</Label>
                <Select value={uploadProductId} onValueChange={v => setUploadProductId(v)}>
                  <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                  <SelectContent>{products.filter((p: any) => !uploadCatId || uploadCatId === "all" || p.categoryId === uploadCatId).map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            {uploadProductId && (() => {
              const prod = products.find((p: any) => p.id === uploadProductId);
              if (!prod) return null;
              return (
                <Card className="bg-black/40 border-white/10 text-white">
                  <CardContent className="pt-6">
                    <h3 className="font-bold mb-4">{prod.name} — Images</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {["image1","image2","image3","image4","image5","image6"].map(f => (
                        <div key={f} className="border border-white/10 rounded-lg p-3">
                          <p className="text-xs text-gray-400 mb-2">{f.replace("image","Image ")}</p>
                          {prod[f] ? (
                            <div className="relative">
                              <img src={prod[f]} className="w-full h-32 object-cover rounded" />
                              <Button size="sm" className="absolute top-1 right-1 bg-red-600 h-6 w-6 p-0" onClick={() => {
                                fetch(`/api/furniture/products/${prod.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ [f]: null }) })
                                  .then(() => { queryClient.invalidateQueries({ queryKey: ["/api/furniture/products"] }); toast({ title: "Image removed" }); });
                              }}><X className="h-3 w-3" /></Button>
                            </div>
                          ) : <div className="w-full h-32 bg-white/5 rounded flex items-center justify-center text-gray-500 text-xs">No image</div>}
                          <label className="mt-2 flex items-center justify-center gap-2 bg-amber-600 rounded py-2 cursor-pointer text-xs font-medium">
                            {uploading[`${prod.id}-${f}`] ? "Uploading..." : <><Upload className="h-3 w-3" /> Upload</>}
                            <input type="file" className="hidden" accept="image/*,.gif,.png" onChange={e => { if (e.target.files?.[0]) uploadImageForProduct(e.target.files[0], prod.id, f); }} />
                          </label>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })()}
          </div>
        )}

        {activeTab === "banners" && (
          <div>
            <h1 className="text-2xl font-bold mb-6">Banner Slider</h1>
            <p className="text-sm text-gray-400 mb-4">These banners auto-slide at the top of your public store.</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              {(brand.bannerImages as any[] || []).map((img: any, i: number) => (
                <Card key={i} className="bg-black/40 border-white/10 text-white">
                  <CardContent className="pt-4">
                    {typeof img === "string" ? <img src={img} className="w-full h-32 object-cover rounded mb-2" /> : (
                      <div>
                        {img.imageUrl && <img src={img.imageUrl} className="w-full h-32 object-cover rounded mb-2" />}
                        {img.text && <p className="text-sm font-medium">{img.text}</p>}
                      </div>
                    )}
                    <Button size="sm" variant="outline" className="border-red-500/50 text-red-400 w-full mt-2"
                      onClick={() => {
                        const banners = [...(brand.bannerImages as any[] || [])];
                        banners.splice(i, 1);
                        fetch(`/api/furniture/brands/${brandId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bannerImages: banners }) })
                          .then(r => r.json()).then(u => { setBrand(u); localStorage.setItem("furnitureBrand", JSON.stringify(u)); toast({ title: "Banner removed" }); });
                      }}><Trash2 className="h-3 w-3 mr-1" /> Remove</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Card className="bg-black/40 border-white/10 text-white">
              <CardContent className="pt-6">
                <h3 className="font-bold mb-3">Add Banner</h3>
                <div className="grid gap-3">
                  <div><Label className="text-xs">Image URL or Upload</Label>
                    <div className="flex gap-2">
                      <Input value={sliderForm.imageUrl} onChange={e => setSliderForm({ ...sliderForm, imageUrl: e.target.value })} placeholder="Paste URL" />
                      <label className="cursor-pointer px-3 py-2 bg-amber-600 rounded flex items-center text-sm">
                        <Upload className="h-4 w-4 mr-1" /> Upload
                        <input type="file" className="hidden" accept="image/*,.gif" onChange={async e => {
                          const file = e.target.files?.[0]; if (!file) return;
                          const reader = new FileReader();
                          reader.onload = async () => {
                            const res = await fetch("/api/upload-image", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image: reader.result, filename: `banner-${Date.now()}.${file.name.split('.').pop()}` }) });
                            const data = await res.json();
                            if (data.url) setSliderForm(p => ({ ...p, imageUrl: data.url }));
                          };
                          reader.readAsDataURL(file);
                        }} />
                      </label>
                    </div>
                  </div>
                  <div><Label className="text-xs">Banner Text (optional)</Label><Input value={sliderForm.text} onChange={e => setSliderForm({ ...sliderForm, text: e.target.value })} placeholder="Sale - Up to 50% Off!" /></div>
                  <Button className="bg-gradient-to-r from-amber-500 to-orange-600" onClick={() => {
                    if (!sliderForm.imageUrl && !sliderForm.text) return;
                    const banners = [...(brand.bannerImages as any[] || []), sliderForm];
                    fetch(`/api/furniture/brands/${brandId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bannerImages: banners }) })
                      .then(r => r.json()).then(u => { setBrand(u); localStorage.setItem("furnitureBrand", JSON.stringify(u)); setSliderForm({ imageUrl: "", text: "", link: "" }); toast({ title: "Banner added!" }); });
                  }}>Add Banner</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "animate" && (
          <div>
            <h1 className="text-2xl font-bold mb-6">Animated Text</h1>
            <p className="text-sm text-gray-400 mb-4">Add animated text effects to products. Search or select a product, then configure the animation.</p>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div><Label>Search Product</Label><Input value={animSearch} onChange={e => setAnimSearch(e.target.value)} placeholder="Type product name..." /></div>
              <div><Label>Select Product</Label>
                <Select value={animProduct} onValueChange={v => setAnimProduct(v)}>
                  <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                  <SelectContent>{products.filter((p: any) => !animSearch || p.name.toLowerCase().includes(animSearch.toLowerCase())).map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            {animProduct && (() => {
              const prod = products.find((p: any) => p.id === animProduct);
              if (!prod) return null;
              const at: any = prod.animatedText || {};
              const saveAnim = (updates: any) => {
                const newAt = { ...at, ...updates };
                fetch(`/api/furniture/products/${prod.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ animatedText: newAt }) })
                  .then(() => { queryClient.invalidateQueries({ queryKey: ["/api/furniture/products"] }); toast({ title: "Animation saved!" }); });
              };
              return (
                <Card className="bg-black/40 border-white/10 text-white">
                  <CardContent className="pt-6">
                    <h3 className="font-bold mb-4">{prod.name} — Animated Text</h3>
                    <div className="grid gap-4">
                      <div><Label className="text-xs">Text Content</Label><Input defaultValue={at.text || ""} onBlur={e => saveAnim({ text: e.target.value })} placeholder="Spring Sale! Limited Time Offer" /></div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><Label className="text-xs">Heading Size</Label>
                          <Select value={at.headingSize || "h3"} onValueChange={v => saveAnim({ headingSize: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>{["h1","h2","h3","h4","h5","h6"].map(h => <SelectItem key={h} value={h}>{h.toUpperCase()}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div><Label className="text-xs">Animation Style</Label>
                          <Select value={at.animation || "none"} onValueChange={v => saveAnim({ animation: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              <SelectItem value="ticker">News Ticker (scroll)</SelectItem>
                              <SelectItem value="bounce">Bounce</SelectItem>
                              <SelectItem value="pulse">Pulse</SelectItem>
                              <SelectItem value="fadeIn">Fade In</SelectItem>
                              <SelectItem value="slideIn">Slide In</SelectItem>
                              <SelectItem value="spring">Spring Effect</SelectItem>
                              <SelectItem value="glow">Glow</SelectItem>
                              <SelectItem value="typewriter">Typewriter</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div><Label className="text-xs">Text Color</Label><Input type="color" defaultValue={at.color || accentColor} onChange={e => saveAnim({ color: e.target.value })} /></div>
                      <div className="flex items-center gap-2"><Switch checked={at.enabled || false} onCheckedChange={v => saveAnim({ enabled: v })} /><Label>Enable Animation</Label></div>
                      {at.text && at.enabled && (
                        <div className="p-4 bg-white/5 rounded-lg">
                          <p className="text-xs text-gray-400 mb-2">Preview:</p>
                          <div style={{ color: at.color || accentColor, animation: at.animation === "bounce" ? "bounce 1s infinite" : at.animation === "pulse" ? "pulse 2s infinite" : undefined, overflow: at.animation === "ticker" ? "hidden" : undefined }}>
                            {at.animation === "ticker" ? (
                              <div style={{ whiteSpace: "nowrap", animation: "ticker 10s linear infinite" }}>
                                <style>{`@keyframes ticker { from { transform: translateX(100%); } to { transform: translateX(-100%); } }`}</style>
                                <span className={`text-${at.headingSize === "h1" ? "4xl" : at.headingSize === "h2" ? "3xl" : at.headingSize === "h3" ? "2xl" : "xl"} font-bold`}>{at.text}</span>
                              </div>
                            ) : (
                              <span className={`text-${at.headingSize === "h1" ? "4xl" : at.headingSize === "h2" ? "3xl" : at.headingSize === "h3" ? "2xl" : "xl"} font-bold`}>{at.text}</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })()}
          </div>
        )}

        {activeTab === "settings" && (
          <div>
            <h1 className="text-2xl font-bold mb-6">Settings</h1>
            <Card className="bg-black/40 border-white/10 text-white mb-6">
              <CardContent className="pt-6">
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Brand Name</Label><p className="text-lg font-bold">{brand.name}</p></div>
                    <div><Label>Store URL</Label><p className="text-sm text-amber-400">/furniture/{brand.slug}</p></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Currency</Label><p>{brand.currency}</p></div>
                    <div><Label>Login</Label><p className="text-sm text-gray-400">{brand.adminUsername}</p></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <h2 className="text-xl font-bold mb-4">Logo</h2>
            <Card className="bg-black/40 border-white/10 text-white mb-6">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  {brand.logo ? <img src={brand.logo} className="w-20 h-20 rounded-xl object-cover" /> : <div className="w-20 h-20 rounded-xl bg-amber-600/20 flex items-center justify-center"><Sofa className="h-10 w-10 text-amber-400" /></div>}
                  <div>
                    <label className="cursor-pointer px-4 py-2 bg-amber-600 rounded-lg flex items-center text-sm font-medium">
                      <Upload className="h-4 w-4 mr-2" /> Upload Logo (PNG/GIF)
                      <input type="file" className="hidden" accept="image/*,.gif" onChange={async e => {
                        const file = e.target.files?.[0]; if (!file) return;
                        const reader = new FileReader();
                        reader.onload = async () => {
                          const res = await fetch("/api/upload-image", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image: reader.result, filename: `logo-${brandId}.${file.name.split('.').pop()}` }) });
                          const data = await res.json();
                          if (data.url) {
                            const u = await fetch(`/api/furniture/brands/${brandId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ logo: data.url }) }).then(r => r.json());
                            setBrand(u); localStorage.setItem("furnitureBrand", JSON.stringify(u)); toast({ title: "Logo uploaded!" });
                          }
                        };
                        reader.readAsDataURL(file);
                      }} />
                    </label>
                    <p className="text-xs text-gray-500 mt-1">Supports PNG, GIF - shown big on public store</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <h2 className="text-xl font-bold mb-4">Store Footer Info</h2>
            <Card className="bg-black/40 border-white/10 text-white mb-6">
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Phone", field: "phone", placeholder: "+44 123 456 7890" },
                    { label: "Email", field: "email", placeholder: "info@link24.online" },
                    { label: "Address", field: "address", placeholder: "41 Hamilton Road, IG1 2EU", colSpan: true },
                    { label: "City", field: "city", placeholder: "London" },
                    { label: "Country", field: "country", placeholder: "UK" },
                  ].map(f => (
                    <div key={f.field} className={f.colSpan ? "col-span-2" : ""}>
                      <Label className="text-xs">{f.label}</Label>
                      <Input defaultValue={brand[f.field] || ""} className="bg-white/5 border-white/20" placeholder={f.placeholder}
                        onBlur={e => {
                          fetch(`/api/furniture/brands/${brandId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ [f.field]: e.target.value }) })
                            .then(r => r.json()).then(u => { setBrand(u); localStorage.setItem("furnitureBrand", JSON.stringify(u)); toast({ title: `${f.label} updated!` }); });
                        }} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <h2 className="text-xl font-bold mb-4">Opening Hours</h2>
            <Card className="bg-black/40 border-white/10 text-white mb-6">
              <CardContent className="pt-6">
                <div className="grid gap-2">
                  {["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map(day => {
                    const hours: any = brand.openingHours || {};
                    return (
                      <div key={day} className="flex items-center gap-3">
                        <span className="w-24 text-sm">{day}</span>
                        <Input className="w-24 bg-white/5 border-white/20 text-xs" defaultValue={hours[day]?.open || "09:00"} placeholder="09:00"
                          onBlur={e => {
                            const newH = { ...hours, [day]: { ...(hours[day] || {}), open: e.target.value } };
                            fetch(`/api/furniture/brands/${brandId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ openingHours: newH }) })
                              .then(r => r.json()).then(u => { setBrand(u); localStorage.setItem("furnitureBrand", JSON.stringify(u)); });
                          }} />
                        <span className="text-gray-500">to</span>
                        <Input className="w-24 bg-white/5 border-white/20 text-xs" defaultValue={hours[day]?.close || "18:00"} placeholder="18:00"
                          onBlur={e => {
                            const newH = { ...hours, [day]: { ...(hours[day] || {}), close: e.target.value } };
                            fetch(`/api/furniture/brands/${brandId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ openingHours: newH }) })
                              .then(r => r.json()).then(u => { setBrand(u); localStorage.setItem("furnitureBrand", JSON.stringify(u)); });
                          }} />
                        <Switch checked={hours[day]?.closed !== true} onCheckedChange={v => {
                          const newH = { ...hours, [day]: { ...(hours[day] || {}), closed: !v } };
                          fetch(`/api/furniture/brands/${brandId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ openingHours: newH }) })
                            .then(r => r.json()).then(u => { setBrand(u); localStorage.setItem("furnitureBrand", JSON.stringify(u)); toast({ title: `${day} updated` }); });
                        }} />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <h2 className="text-xl font-bold mb-4">Store Theme Colors</h2>
            <Card className="bg-black/40 border-white/10 text-white mb-6">
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Primary Color", field: "primaryColor" },
                    { label: "Accent / Gold Color", field: "accentColor" },
                    { label: "Background Color", field: "bgColor" },
                    { label: "Card Background", field: "cardBgColor" },
                  ].map(c => (
                    <div key={c.field}>
                      <Label className="text-xs">{c.label}</Label>
                      <div className="flex gap-2">
                        <Input type="color" defaultValue={brand[c.field] || "#000"} className="w-14 h-10 p-1"
                          onChange={e => {
                            fetch(`/api/furniture/brands/${brandId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ [c.field]: e.target.value }) })
                              .then(r => r.json()).then(u => { setBrand(u); localStorage.setItem("furnitureBrand", JSON.stringify(u)); });
                          }} />
                        <Input defaultValue={brand[c.field] || ""} className="bg-white/5 border-white/20 text-xs" readOnly />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <h2 className="text-xl font-bold mb-4">Payment Methods</h2>
            {(() => {
              const pm: any = brand.paymentMethods || {};
              const savePM = (updates: any) => {
                const newPM = { ...pm, ...updates };
                fetch(`/api/furniture/brands/${brandId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paymentMethods: newPM }) })
                  .then(r => r.json()).then(u => { setBrand(u); localStorage.setItem("furnitureBrand", JSON.stringify(u)); toast({ title: "Payment settings saved!" }); });
              };
              return (
                <div className="grid gap-3 mb-6">
                  {[
                    { key: "cashEnabled", label: "Cash on Delivery", icon: "💵", def: true },
                    { key: "cardEnabled", label: "Card (Stripe)", icon: "💳" },
                    { key: "jazzCashEnabled", label: "JazzCash", icon: "📱", fields: [{ k: "jazzCashName", l: "Account Name" }, { k: "jazzCashNumber", l: "Account Number" }] },
                    { key: "easyPaisaEnabled", label: "EasyPaisa", icon: "📲", fields: [{ k: "easyPaisaName", l: "Account Name" }, { k: "easyPaisaNumber", l: "Account Number" }] },
                    { key: "bankEnabled", label: "Bank Transfer", icon: "🏦", fields: [{ k: "bankName", l: "Bank Name" }, { k: "bankAccountName", l: "Account Name" }, { k: "bankAccountNumber", l: "Account Number" }, { k: "bankIBAN", l: "IBAN Number" }] },
                  ].map(method => (
                    <Card key={method.key} className="bg-black/40 border-white/10 text-white">
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3"><span className="text-lg">{method.icon}</span><span className="font-medium">{method.label}</span></div>
                          <Switch checked={method.def ? pm[method.key] !== false : pm[method.key] || false} onCheckedChange={v => savePM({ [method.key]: v })} />
                        </div>
                        {method.fields && (method.def ? pm[method.key] !== false : pm[method.key]) && (
                          <div className="grid grid-cols-2 gap-2 mt-3">
                            {method.fields.map(f => (
                              <div key={f.k}><Label className="text-xs">{f.l}</Label><Input defaultValue={pm[f.k] || ""} onBlur={e => savePM({ [f.k]: e.target.value })} className="bg-white/5 border-white/20" /></div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              );
            })()}

            <h2 className="text-xl font-bold mb-4">Order Alarm Sound</h2>
            <Card className="bg-black/40 border-white/10 text-white mb-6">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <Volume2 className="h-5 w-5 text-amber-400" />
                  <div><h3 className="font-bold">Alarm Sound</h3><p className="text-xs text-gray-400">Default: Pakistani tone</p></div>
                </div>
                <div className="flex gap-2 mb-3">
                  <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10"
                    onClick={() => { const a = new Audio(getAlarmSoundUrl()); a.play().catch(() => {}); setTimeout(() => a.pause(), 5000); }}>
                    <Volume2 className="h-4 w-4 mr-1" /> Test
                  </Button>
                </div>
                <div>
                  <Label className="text-xs">Upload Custom Sound (MP3)</Label>
                  <Input type="file" accept="audio/*" className="bg-white/5 border-white/20" onChange={async e => {
                    const file = e.target.files?.[0]; if (!file || file.size > 5*1024*1024) { toast({ title: "Max 5MB", variant: "destructive" }); return; }
                    const reader = new FileReader();
                    reader.onload = async () => {
                      const res = await fetch("/api/upload-image", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image: reader.result, filename: `alarm-furn-${brandId}.mp3` }) });
                      const data = await res.json();
                      if (data.url) {
                        const pm: any = brand.paymentMethods || {};
                        const u = await fetch(`/api/furniture/brands/${brandId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paymentMethods: { ...pm, alarmSoundUrl: data.url } }) }).then(r => r.json());
                        setBrand(u); localStorage.setItem("furnitureBrand", JSON.stringify(u)); toast({ title: "Custom alarm uploaded!" });
                      }
                    };
                    reader.readAsDataURL(file);
                  }} />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
