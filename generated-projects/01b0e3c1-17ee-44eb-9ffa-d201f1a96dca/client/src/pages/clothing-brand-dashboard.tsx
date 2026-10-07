import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import useSound from "use-sound";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Edit, Trash2, Shirt, Package, Image, ShoppingBag, Settings, Eye, LogOut, LayoutDashboard, Tag, Layers, Upload, Gift, ImagePlus, Bell, BellRing, BellOff, Volume2, X, Printer, CheckCircle, Clock, Truck, MapPin, Phone, Mail, CreditCard, User, Calendar, Hash, ChevronDown, ChevronUp } from "lucide-react";

const ORDER_NOTIFICATION_URL = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3";

function PaymentSettingsForm({ brand, brandId, setBrand, toast }: { brand: any; brandId: string; setBrand: (b: any) => void; toast: any }) {
  const initial = brand?.paymentMethods || {};
  const [pm, setPm] = useState<any>(initial);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setPm(brand?.paymentMethods || {});
    setDirty(false);
  }, [brand?.id]);

  const update = (patch: any) => { setPm((prev: any) => ({ ...prev, ...patch })); setDirty(true); };

  const cleanIBAN = (s: string) => {
    if (!s) return s;
    const m = s.toUpperCase().match(/[A-Z]{2}\d{2}[A-Z0-9]{10,30}/);
    return m ? m[0] : s.replace(/[^A-Z0-9]/gi, "").toUpperCase();
  };
  const cleanDigits = (s: string) => {
    if (!s) return s;
    const matches = s.match(/\d+/g);
    if (!matches) return "";
    return matches.reduce((longest, cur) => (cur.length > longest.length ? cur : longest), "");
  };
  const cleanName = (s: string) => {
    if (!s) return s;
    return s.replace(/\[[^\]]*\]/g, "").replace(/\d{1,2}[:/]\d{1,2}([:/]\d{1,4})?\s*(AM|PM|am|pm)?/g, "")
      .replace(/Mujeeb:|IBAN:|Bank code:|Account:|A\/c:/gi, "").replace(/\s+/g, " ").trim();
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      const r = await fetch(`/api/clothing/brands/${brandId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMethods: pm }),
      });
      const updated = await r.json();
      setBrand(updated);
      localStorage.setItem("clothingBrand", JSON.stringify(updated));
      setDirty(false);
      toast({ title: "Payment settings saved!", description: "Customers will now see the enabled methods at checkout." });
    } catch (e) {
      toast({ title: "Save failed", description: "Please try again", variant: "destructive" });
    }
    setSaving(false);
  };

  return (
    <div className="grid gap-4">
      <Card className="bg-black/40 border-white/10 text-white">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-600/20 flex items-center justify-center"><span className="text-lg">💵</span></div>
              <div><h3 className="font-bold">Cash on Delivery</h3><p className="text-xs text-gray-400">Customer pays on delivery</p></div>
            </div>
            <Switch checked={pm.cashEnabled !== false} onCheckedChange={v => update({ cashEnabled: v })} data-testid="switch-cash" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-black/40 border-white/10 text-white">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center"><span className="text-lg">💳</span></div>
              <div><h3 className="font-bold">Card Payment (Stripe)</h3><p className="text-xs text-gray-400">Managed by Super Admin</p></div>
            </div>
            <Switch checked={pm.cardEnabled || false} onCheckedChange={v => update({ cardEnabled: v })} data-testid="switch-card" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-black/40 border-white/10 text-white">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-600/20 flex items-center justify-center"><span className="text-lg">📱</span></div>
              <div><h3 className="font-bold">JazzCash</h3><p className="text-xs text-gray-400">Mobile money transfer</p></div>
            </div>
            <Switch checked={pm.jazzCashEnabled || false} onCheckedChange={v => update({ jazzCashEnabled: v })} data-testid="switch-jazzcash" />
          </div>
          {pm.jazzCashEnabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              <div><Label className="text-xs">Account Name</Label><Input value={pm.jazzCashName || ""} onChange={e => update({ jazzCashName: e.target.value })} onBlur={e => update({ jazzCashName: cleanName(e.target.value) })} placeholder="Account holder name" data-testid="input-jazzcash-name" /></div>
              <div><Label className="text-xs">Account Number</Label><Input value={pm.jazzCashNumber || ""} onChange={e => update({ jazzCashNumber: e.target.value })} onBlur={e => update({ jazzCashNumber: cleanDigits(e.target.value) })} placeholder="03XX-XXXXXXX" data-testid="input-jazzcash-number" /></div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-black/40 border-white/10 text-white">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-600/20 flex items-center justify-center"><span className="text-lg">📲</span></div>
              <div><h3 className="font-bold">EasyPaisa</h3><p className="text-xs text-gray-400">Mobile money transfer</p></div>
            </div>
            <Switch checked={pm.easyPaisaEnabled || false} onCheckedChange={v => update({ easyPaisaEnabled: v })} data-testid="switch-easypaisa" />
          </div>
          {pm.easyPaisaEnabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              <div><Label className="text-xs">Account Name</Label><Input value={pm.easyPaisaName || ""} onChange={e => update({ easyPaisaName: e.target.value })} onBlur={e => update({ easyPaisaName: cleanName(e.target.value) })} placeholder="Account holder name" data-testid="input-easypaisa-name" /></div>
              <div><Label className="text-xs">Account Number</Label><Input value={pm.easyPaisaNumber || ""} onChange={e => update({ easyPaisaNumber: e.target.value })} onBlur={e => update({ easyPaisaNumber: cleanDigits(e.target.value) })} placeholder="03XX-XXXXXXX" data-testid="input-easypaisa-number" /></div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-black/40 border-white/10 text-white">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center"><span className="text-lg">🏦</span></div>
              <div><h3 className="font-bold">Bank Transfer</h3><p className="text-xs text-gray-400">Direct bank deposit with QR code</p></div>
            </div>
            <Switch checked={pm.bankEnabled || false} onCheckedChange={v => update({ bankEnabled: v })} data-testid="switch-bank" />
          </div>
          {pm.bankEnabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              <div><Label className="text-xs">Bank Name</Label><Input value={pm.bankName || ""} onChange={e => update({ bankName: e.target.value })} onBlur={e => update({ bankName: cleanName(e.target.value) })} placeholder="e.g. HBL Bank" data-testid="input-bank-name" /></div>
              <div><Label className="text-xs">Account Name</Label><Input value={pm.bankAccountName || ""} onChange={e => update({ bankAccountName: e.target.value })} onBlur={e => update({ bankAccountName: cleanName(e.target.value) })} placeholder="Account holder name" data-testid="input-bank-account-name" /></div>
              <div><Label className="text-xs">Account Number</Label><Input value={pm.bankAccountNumber || ""} onChange={e => update({ bankAccountNumber: e.target.value })} onBlur={e => update({ bankAccountNumber: cleanDigits(e.target.value) })} placeholder="Account number" data-testid="input-bank-account-number" /></div>
              <div><Label className="text-xs">IBAN Number</Label><Input value={pm.bankIBAN || ""} onChange={e => update({ bankIBAN: e.target.value })} onBlur={e => update({ bankIBAN: cleanIBAN(e.target.value) })} placeholder="PK00XXXX0000000000" data-testid="input-bank-iban" /><p className="text-[10px] text-gray-400 mt-1">Tip: paste anything, we'll auto-extract just the IBAN.</p></div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="sticky bottom-0 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent pt-6 pb-2 -mx-2 px-2 z-10">
        <Button
          onClick={saveAll}
          disabled={saving}
          className={`w-full h-14 text-base font-bold shadow-2xl ${dirty ? "bg-pink-600 hover:bg-pink-700 animate-pulse" : "bg-green-600 hover:bg-green-700"}`}
          data-testid="button-save-payment-settings"
        >
          {saving ? "Saving..." : dirty ? "💾 SAVE PAYMENT SETTINGS" : "✓ All saved"}
        </Button>
        {dirty && <p className="text-xs text-yellow-400 text-center mt-2">⚠ You have unsaved changes — click Save above</p>}
      </div>
    </div>
  );
}

export default function ClothingBrandDashboard() {
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

  const [productForm, setProductForm] = useState({
    name: "", description: "", fabric: "", color: "", price: "", wasPrice: "",
    categoryId: "", image1: "", image2: "", image3: "", image4: "", image5: "",
    sizes: [] as {name: string, inStock: boolean}[], sizeGuide: "", isSoldOut: false, isFeatured: false, isNew: false,
  });

  const [catForm, setCatForm] = useState({ name: "", gender: "Women", image: "", sortOrder: 0 });
  const [sliderUrl, setSliderUrl] = useState("");
  const [promoForm, setPromoForm] = useState({ title: "", minItems: 3, reward: "Free Delivery", productIds: [] as string[], isActive: true });
  const [showPromoForm, setShowPromoForm] = useState(false);
  const [uploadCatId, setUploadCatId] = useState("");
  const [uploadProductId, setUploadProductId] = useState("");
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [receiptOrder, setReceiptOrder] = useState<any>(null);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [orderSearch, setOrderSearch] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFlashing, setIsFlashing] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const knownOrderIdsRef = useRef<Set<string>>(new Set());
  const hasInitializedOrdersRef = useRef<boolean>(false);
  const originalTitleRef = useRef<string>("");
  const ringIntervalRef = useRef<number | null>(null);
  const [isRinging, setIsRinging] = useState(false);

  const [playNotification, { stop: stopNotificationSound }] = useSound(ORDER_NOTIFICATION_URL, {
    volume: 1,
    interrupt: false,
  });

  const stopRinging = useCallback(() => {
    if (ringIntervalRef.current) {
      clearInterval(ringIntervalRef.current);
      ringIntervalRef.current = null;
    }
    try { stopNotificationSound(); } catch {}
    setIsRinging(false);
  }, [stopNotificationSound]);

  const triggerAlert = useCallback(() => {
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 3000);
    if (!soundEnabled) return;
    if (ringIntervalRef.current) {
      clearInterval(ringIntervalRef.current);
      ringIntervalRef.current = null;
    }
    setIsRinging(true);
    try { playNotification(); } catch {}
    ringIntervalRef.current = window.setInterval(() => {
      try { playNotification(); } catch {}
    }, 3000);
  }, [soundEnabled, playNotification]);

  useEffect(() => {
    return () => {
      if (ringIntervalRef.current) {
        clearInterval(ringIntervalRef.current);
        ringIntervalRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!soundEnabled) stopRinging();
  }, [soundEnabled, stopRinging]);

  useEffect(() => {
    const stored = localStorage.getItem("clothingBrand");
    if (stored) {
      setBrand(JSON.parse(stored));
    } else {
      setLocation("/clothing-brand-login");
    }
  }, [setLocation]);

  const brandId = brand?.id;

  const isPendingStatus = (o: any) => {
    const s = o?.orderStatus || o?.status;
    return !s || s === "pending" || s === "new" || s === "pending_approval";
  };

  useEffect(() => {
    if (!brandId) return;
    let cancelled = false;
    let reconnectTimer: number | null = null;
    let pingTimer: number | null = null;
    let attempt = 0;

    const connect = () => {
      if (cancelled) return;
      if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
      if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
        return;
      }
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const ws = new WebSocket(`${protocol}//${window.location.host}/clothing-ws?brandId=${brandId}`);
      wsRef.current = ws;
      ws.onopen = () => {
        attempt = 0;
        setWsConnected(true);
        queryClient.invalidateQueries({ queryKey: ["/api/clothing/orders", brandId] });
        if (pingTimer) clearInterval(pingTimer);
        pingTimer = window.setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            try { ws.send(JSON.stringify({ type: "ping" })); } catch {}
          }
        }, 25000);
      };
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "new_order") {
            queryClient.invalidateQueries({ queryKey: ["/api/clothing/orders", brandId] });
          }
        } catch (e) {}
      };
      ws.onclose = () => {
        setWsConnected(false);
        if (pingTimer) { clearInterval(pingTimer); pingTimer = null; }
        if (cancelled) return;
        if (reconnectTimer) clearTimeout(reconnectTimer);
        const delay = Math.min(1000 * Math.pow(1.5, attempt++), 15000);
        reconnectTimer = window.setTimeout(connect, delay);
      };
      ws.onerror = () => { try { ws.close(); } catch {} };
    };

    connect();

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        if (wsRef.current?.readyState !== WebSocket.OPEN && wsRef.current?.readyState !== WebSocket.CONNECTING) {
          connect();
        } else {
          queryClient.invalidateQueries({ queryKey: ["/api/clothing/orders", brandId] });
        }
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (pingTimer) clearInterval(pingTimer);
      try { wsRef.current?.close(); } catch {}
    };
  }, [brandId, queryClient]);

  const { data: products = [] } = useQuery({
    queryKey: ["/api/clothing/products", brandId],
    queryFn: () => fetch(`/api/clothing/products?brandId=${brandId}`).then(r => r.json()),
    enabled: !!brandId,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/clothing/categories", brandId],
    queryFn: () => fetch(`/api/clothing/categories?brandId=${brandId}`).then(r => r.json()),
    enabled: !!brandId,
  });

  const { data: orders = [] } = useQuery<any[]>({
    queryKey: ["/api/clothing/orders", brandId],
    queryFn: () => fetch(`/api/clothing/orders?brandId=${brandId}`).then(r => r.json()),
    enabled: !!brandId,
    refetchInterval: 5000,
  });

  const newOrderNotifs = useMemo(() => {
    return (Array.isArray(orders) ? orders : [])
      .filter(isPendingStatus)
      .sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 50);
  }, [orders]);

  useEffect(() => {
    if (newOrderNotifs.length === 0) stopRinging();
  }, [newOrderNotifs.length, stopRinging]);

  useEffect(() => {
    hasInitializedOrdersRef.current = false;
    knownOrderIdsRef.current = new Set();
  }, [brandId]);

  useEffect(() => {
    if (!Array.isArray(orders)) return;
    const pendingIds = orders.filter(isPendingStatus).map((o: any) => o.id).filter(Boolean);
    const trulyNew = pendingIds.filter(id => !knownOrderIdsRef.current.has(id));
    const wasInitialized = hasInitializedOrdersRef.current;

    if (wasInitialized && trulyNew.length > 0) {
      triggerAlert();
    }
    knownOrderIdsRef.current = new Set(pendingIds);
    hasInitializedOrdersRef.current = true;
  }, [orders, triggerAlert, brand?.currency]);

  useEffect(() => {
    if (!originalTitleRef.current) originalTitleRef.current = document.title;
    if (newOrderNotifs.length > 0) {
      document.title = `(${newOrderNotifs.length}) NEW ORDER! - ${originalTitleRef.current}`;
    } else {
      document.title = originalTitleRef.current;
    }
  }, [newOrderNotifs.length]);

  const createProduct = useMutation({
    mutationFn: (data: any) => fetch("/api/clothing/products", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, brandId }),
    }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clothing/products"] });
      setShowProductForm(false);
      resetProductForm();
      toast({ title: "Product added!" });
    },
  });

  const updateProduct = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => fetch(`/api/clothing/products/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
    }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clothing/products"] });
      setEditProduct(null);
      resetProductForm();
      toast({ title: "Product updated!" });
    },
  });

  const deleteProduct = useMutation({
    mutationFn: (id: string) => fetch(`/api/clothing/products/${id}`, { method: "DELETE" }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clothing/products"] });
      toast({ title: "Product deleted" });
    },
  });

  const createCategory = useMutation({
    mutationFn: (data: any) => fetch("/api/clothing/categories", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, brandId }),
    }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clothing/categories"] });
      setShowCatForm(false);
      toast({ title: "Category added!" });
    },
  });

  const updateCategory = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => fetch(`/api/clothing/categories/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
    }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clothing/categories"] });
      setEditCat(null);
      toast({ title: "Category updated!" });
    },
  });

  const deleteCategory = useMutation({
    mutationFn: (id: string) => fetch(`/api/clothing/categories/${id}`, { method: "DELETE" }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clothing/categories"] });
      toast({ title: "Category deleted" });
    },
  });

  const updateBrandPromos = useMutation({
    mutationFn: (promoDeals: any[]) => fetch(`/api/clothing/brands/${brandId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ promoDeals }),
    }).then(r => r.json()),
    onSuccess: (updated) => {
      setBrand(updated);
      localStorage.setItem("clothingBrand", JSON.stringify(updated));
      toast({ title: "Promotion saved!" });
    },
  });

  const updateBrandSliders = useMutation({
    mutationFn: (bannerImages: string[]) => fetch(`/api/clothing/brands/${brandId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bannerImages }),
    }).then(r => r.json()),
    onSuccess: (updated) => {
      setBrand(updated);
      localStorage.setItem("clothingBrand", JSON.stringify(updated));
      queryClient.invalidateQueries({ queryKey: ["/api/clothing/brands"] });
      toast({ title: "Sliders updated!" });
    },
  });

  function resetProductForm() {
    setProductForm({
      name: "", description: "", fabric: "", color: "", price: "", wasPrice: "",
      categoryId: "", image1: "", image2: "", image3: "", image4: "", image5: "",
      sizes: [], sizeGuide: "", isSoldOut: false, isFeatured: false, isNew: false,
    });
  }

  function openEditProduct(p: any) {
    setEditProduct(p);
    setProductForm({
      name: p.name || "", description: p.description || "", fabric: p.fabric || "",
      color: p.color || "", price: p.price || "", wasPrice: p.wasPrice || "",
      categoryId: p.categoryId || "", image1: p.image1 || "", image2: p.image2 || "",
      image3: p.image3 || "", image4: p.image4 || "", image5: p.image5 || "",
      sizes: Array.isArray(p.sizes) ? p.sizes.map((s: any) => typeof s === "string" ? { name: s, inStock: true } : s) : [],
      sizeGuide: p.sizeGuide || "", isSoldOut: p.isSoldOut || false,
      isFeatured: p.isFeatured || false, isNew: p.isNew || false,
    });
  }

  async function handleImageUpload(file: File, field: string) {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const res = await fetch("/api/upload-image", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: reader.result, filename: file.name }),
        });
        const data = await res.json();
        if (data.url) {
          setProductForm(prev => ({ ...prev, [field]: data.url }));
          toast({ title: "Image uploaded!" });
        } else {
          toast({ title: data.error || "Upload failed", variant: "destructive" });
        }
      } catch { toast({ title: "Upload failed", variant: "destructive" }); }
    };
    reader.readAsDataURL(file);
  }

  const sizeOptions = ["XS", "S", "M", "L", "XL", "XXL", "3XL", "One Size", "Free Size"];
  const toggleSize = (size: string) => {
    setProductForm(prev => {
      const existing = prev.sizes.find(s => s.name === size);
      if (existing) {
        return { ...prev, sizes: prev.sizes.filter(s => s.name !== size) };
      }
      return { ...prev, sizes: [...prev.sizes, { name: size, inStock: true }] };
    });
  };
  const toggleSizeStock = (size: string) => {
    setProductForm(prev => ({
      ...prev,
      sizes: prev.sizes.map(s => s.name === size ? { ...s, inStock: !s.inStock } : s),
    }));
  };

  const bannerImages: string[] = Array.isArray(brand?.bannerImages) ? brand.bannerImages : [];

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

  const printReceipt = (order: any) => {
    const items = Array.isArray(order.items) ? order.items : [];
    const subtotal = items.reduce((sum: number, item: any) => sum + (Number(item.price) * Number(item.quantity)), 0);
    const orderDate = new Date(order.createdAt);

    const receiptHtml = `
<!DOCTYPE html>
<html>
<head>
<title>Receipt #${order.id.slice(0,8).toUpperCase()}</title>
<style>
  @page { size: 80mm auto; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Courier New', monospace; width: 80mm; max-width: 80mm; padding: 4mm; color: #000; background: #fff; font-size: 12px; }
  .center { text-align: center; }
  .bold { font-weight: bold; }
  .line { border-top: 1px dashed #000; margin: 6px 0; }
  .double-line { border-top: 2px solid #000; margin: 6px 0; }
  .flex { display: flex; justify-content: space-between; }
  .brand-name { font-size: 18px; font-weight: bold; letter-spacing: 2px; margin-bottom: 2px; }
  .brand-tagline { font-size: 10px; color: #555; margin-bottom: 4px; }
  .receipt-title { font-size: 14px; font-weight: bold; margin: 4px 0; }
  .item-row { display: flex; justify-content: space-between; padding: 2px 0; font-size: 11px; }
  .item-name { flex: 1; }
  .item-detail { font-size: 10px; color: #555; padding-left: 8px; }
  .total-row { display: flex; justify-content: space-between; font-size: 14px; font-weight: bold; padding: 4px 0; }
  .footer { font-size: 9px; color: #555; text-align: center; margin-top: 8px; }
  .qr-placeholder { text-align: center; margin: 8px 0; }
</style>
</head>
<body>
<div class="center">
  <div class="brand-name">${brand.name?.toUpperCase() || 'FASHION PEAKS'}</div>
  <div class="brand-tagline">${brand.description?.slice(0, 60) || 'Premium Fashion Brand'}</div>
  ${brand.address ? `<div style="font-size:9px;color:#555">${brand.address}</div>` : ''}
  ${brand.phone ? `<div style="font-size:9px;color:#555">Tel: ${brand.phone}</div>` : ''}
  ${brand.email ? `<div style="font-size:9px;color:#555">${brand.email}</div>` : ''}
</div>

<div class="double-line"></div>

<div class="center">
  <div class="receipt-title">SALES RECEIPT</div>
</div>

<div class="line"></div>

<div class="flex" style="font-size:10px">
  <span>Order: #${order.id.slice(0,8).toUpperCase()}</span>
  <span>${orderDate.toLocaleDateString()}</span>
</div>
<div style="font-size:10px">${orderDate.toLocaleTimeString()}</div>

<div class="line"></div>

<div style="font-size:11px;margin-bottom:4px">
  <div class="bold">${order.customerName}</div>
  ${order.customerPhone ? `<div>${order.customerPhone}</div>` : ''}
  ${order.customerAddress ? `<div style="font-size:10px">${order.customerAddress}${order.customerCity ? ', ' + order.customerCity : ''}</div>` : ''}
</div>

<div class="double-line"></div>

<div class="flex bold" style="font-size:11px;margin-bottom:4px">
  <span>ITEM</span>
  <span>AMOUNT</span>
</div>
<div class="line"></div>

${items.map((item: any) => `
<div>
  <div class="item-row">
    <span class="item-name">${item.name}</span>
    <span>${brand.currency || 'PKR'} ${(Number(item.price) * Number(item.quantity)).toLocaleString()}</span>
  </div>
  <div class="item-detail">${item.quantity}x @ ${brand.currency || 'PKR'} ${Number(item.price).toLocaleString()} ${item.size ? '| Size: ' + item.size : ''} ${item.color ? '| ' + item.color : ''}</div>
</div>
`).join('')}

<div class="double-line"></div>

<div class="flex" style="font-size:11px">
  <span>Subtotal:</span>
  <span>${brand.currency || 'PKR'} ${subtotal.toLocaleString()}</span>
</div>
${order.deliveryFee && Number(order.deliveryFee) > 0 ? `
<div class="flex" style="font-size:11px">
  <span>Delivery:</span>
  <span>${brand.currency || 'PKR'} ${Number(order.deliveryFee).toLocaleString()}</span>
</div>` : ''}
${order.discount && Number(order.discount) > 0 ? `
<div class="flex" style="font-size:11px;color:green">
  <span>Discount:</span>
  <span>-${brand.currency || 'PKR'} ${Number(order.discount).toLocaleString()}</span>
</div>` : ''}

<div class="line"></div>

<div class="total-row">
  <span>TOTAL:</span>
  <span>${brand.currency || 'PKR'} ${Number(order.total).toLocaleString()}</span>
</div>

<div class="line"></div>

<div class="flex" style="font-size:10px">
  <span>Payment:</span>
  <span class="bold">${(order.paymentMethod || 'Cash').toUpperCase()}</span>
</div>
<div class="flex" style="font-size:10px">
  <span>Status:</span>
  <span class="bold">${(order.orderStatus || 'confirmed').toUpperCase()}</span>
</div>

<div class="double-line"></div>

<div class="center footer">
  <p style="font-size:11px;font-weight:bold;margin-bottom:4px">Thank you for your purchase!</p>
  <p>Visit us again at</p>
  <p style="font-weight:bold">${window.location.origin}/clothing/${brand.slug}</p>
  <div class="line" style="margin-top:8px"></div>
  <p style="margin-top:4px">Powered by Link24</p>
  <p>www.link24.online</p>
</div>
</body>
</html>`;

    const printWindow = window.open('', '_blank', 'width=320,height=600');
    if (printWindow) {
      printWindow.document.write(receiptHtml);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 300);
    }
  };

  if (!brand) return null;

  const ProductFormUI = ({ onSubmit, label }: { onSubmit: () => void; label: string }) => (
    <div className="grid gap-3 max-h-[70vh] overflow-y-auto pr-1 sm:pr-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div><Label>Name *</Label><Input value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} /></div>
        <div><Label>Category</Label>
          <Select value={productForm.categoryId} onValueChange={v => setProductForm({ ...productForm, categoryId: v })}>
            <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
            <SelectContent>{categories.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.gender} - {c.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div><Label>Description</Label><Textarea value={productForm.description} onChange={e => setProductForm({ ...productForm, description: e.target.value })} /></div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div><Label>Price *</Label><Input type="number" value={productForm.price} onChange={e => setProductForm({ ...productForm, price: e.target.value })} /></div>
        <div><Label>Was Price</Label><Input type="number" value={productForm.wasPrice} onChange={e => setProductForm({ ...productForm, wasPrice: e.target.value })} /></div>
        <div className="col-span-2 sm:col-span-1">
          <Label>Color</Label>
          <div className="flex flex-col gap-2 mt-1">
            <div className="flex flex-wrap gap-1.5">
              {["#000000","#FFFFFF","#DC143C","#8B0000","#FF69B4","#4169E1","#000080","#228B22","#FFD700","#FF8C00","#800080","#808080","#F5F5DC","#D2B48C","#8B4513","#C0C0C0","#87CEEB","#006400","#FF0000","#2F4F4F"].map(c => (
                <button key={c} onClick={() => setProductForm({ ...productForm, color: c })}
                  className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 transition-all ${productForm.color === c ? "border-pink-500 scale-110" : "border-gray-600"}`}
                  style={{ background: c }} />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Input value={productForm.color} onChange={e => setProductForm({ ...productForm, color: e.target.value })} className="w-28" placeholder="#hex or name" />
              {productForm.color && <div className="w-8 h-8 rounded-full border-2 border-white/30 flex-shrink-0" style={{ background: productForm.color }} />}
            </div>
          </div>
        </div>
      </div>
      <div><Label>Fabric</Label><Input value={productForm.fabric} onChange={e => setProductForm({ ...productForm, fabric: e.target.value })} /></div>
      <div>
        <Label>Sizes (click to add, then toggle stock status)</Label>
        <div className="flex flex-wrap gap-2 mt-1">
          {sizeOptions.map(s => {
            const sizeObj = productForm.sizes.find(sz => sz.name === s);
            const isSelected = !!sizeObj;
            return (
              <div key={s} className="flex flex-col items-center gap-1">
                <button onClick={() => toggleSize(s)}
                  className={`px-3 py-1 rounded-full text-sm border ${isSelected ? "bg-pink-600 text-white border-pink-600" : "border-gray-600 text-gray-400"}`}>
                  {s}
                </button>
                {isSelected && (
                  <button onClick={() => toggleSizeStock(s)}
                    className={`text-[10px] px-2 py-0.5 rounded ${sizeObj.inStock ? "bg-green-600 text-white" : "bg-orange-500 text-white"}`}>
                    {sizeObj.inStock ? "In Stock" : "Out of Stock"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div>
        <Label>Size & Fit Guide</Label>
        <Textarea placeholder="e.g. Model is 5'7&quot; wearing size S. Relaxed fit. Chest: S=34&quot;, M=36&quot;, L=38&quot;, XL=40&quot;" value={productForm.sizeGuide} onChange={e => setProductForm({ ...productForm, sizeGuide: e.target.value })} rows={2} />
      </div>
      <div className="grid grid-cols-1 gap-2">
        <Label>Product Images (3-5 views: Front, Back, Left, Right, Detail)</Label>
        {[
          { field: "image1", label: "Front view" },
          { field: "image2", label: "Back view" },
          { field: "image3", label: "Left side" },
          { field: "image4", label: "Right side" },
          { field: "image5", label: "Detail/zoom" },
        ].map(({ field, label }) => (
          <div key={field} className="flex gap-2 items-center">
            <Input placeholder={`${label} URL`} value={(productForm as any)[field]} onChange={e => setProductForm({ ...productForm, [field]: e.target.value })} className="flex-1" />
            <label className="cursor-pointer">
              <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f, field); }} />
              <div className="h-9 w-9 rounded-md bg-pink-600 hover:bg-pink-700 flex items-center justify-center flex-shrink-0">
                <Upload className="h-4 w-4 text-white" />
              </div>
            </label>
            {(productForm as any)[field] && <img src={(productForm as any)[field]} className="h-9 w-9 rounded object-cover flex-shrink-0" />}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-4 sm:gap-6">
        <div className="flex items-center gap-2"><Switch checked={productForm.isSoldOut} onCheckedChange={v => setProductForm({ ...productForm, isSoldOut: v })} /><Label>Sold Out</Label></div>
        <div className="flex items-center gap-2"><Switch checked={productForm.isFeatured} onCheckedChange={v => setProductForm({ ...productForm, isFeatured: v })} /><Label>Featured</Label></div>
        <div className="flex items-center gap-2"><Switch checked={productForm.isNew} onCheckedChange={v => setProductForm({ ...productForm, isNew: v })} /><Label>New Arrival</Label></div>
      </div>
      <Button onClick={onSubmit} className="w-full bg-pink-600 hover:bg-pink-700">{label}</Button>
    </div>
  );

  const sidebar = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "products", label: "Products", icon: Package },
    { id: "upload", label: "Upload Images", icon: ImagePlus },
    { id: "categories", label: "Categories", icon: Layers },
    { id: "orders", label: "Orders", icon: ShoppingBag },
    { id: "sliders", label: "Banner Sliders", icon: Image },
    { id: "promos", label: "Promotions", icon: Gift },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white flex flex-col md:flex-row relative">
      <style>{`@keyframes bellRing { 0%,100% { transform: rotate(0); } 25% { transform: rotate(15deg); } 75% { transform: rotate(-15deg); } } @keyframes badgePulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.2); } }`}</style>

      {isFlashing && <div className="fixed inset-0 bg-red-600/30 z-[9998] pointer-events-none animate-pulse" />}

      <div className="fixed top-3 left-1/2 -translate-x-1/2 md:left-auto md:right-3 md:translate-x-0 z-[9999] flex items-center gap-2">
        {isRinging && (
          <button
            onClick={(e) => { e.stopPropagation(); stopRinging(); }}
            className="h-12 px-4 rounded-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold text-sm shadow-lg flex items-center gap-2 animate-pulse"
            data-testid="button-stop-ringing"
            title="Stop the alarm sound"
          >
            <Volume2 className="h-4 w-4" /> STOP
          </button>
        )}
        <button
          onClick={() => { setShowNotifPanel(v => !v); stopRinging(); }}
          className={`relative w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all ${newOrderNotifs.length > 0 ? "bg-red-600 hover:bg-red-700" : "bg-slate-800 hover:bg-slate-700 border border-white/10"}`}
          data-testid="button-notification-bell"
          title={`${newOrderNotifs.length} pending orders${wsConnected ? " (live)" : " (reconnecting...)"}`}
        >
          {newOrderNotifs.length > 0 ? (
            <BellRing className="h-6 w-6 text-white" style={{ animation: "bellRing 0.5s infinite" }} />
          ) : soundEnabled ? (
            <Bell className="h-6 w-6 text-white" />
          ) : (
            <BellOff className="h-6 w-6 text-white" />
          )}
          {newOrderNotifs.length > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[22px] h-[22px] px-1.5 rounded-full bg-yellow-400 text-black text-xs font-bold flex items-center justify-center" style={{ animation: "badgePulse 1s infinite" }} data-testid="badge-notif-count">
              {newOrderNotifs.length}
            </span>
          )}
          <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${wsConnected ? "bg-green-500" : "bg-gray-400"}`} title={wsConnected ? "Live" : "Reconnecting"} data-testid="indicator-ws-status" />
        </button>

        {showNotifPanel && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 md:left-auto md:right-0 md:translate-x-0 w-[92vw] max-w-[360px] sm:w-96 max-h-[70vh] bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-pink-600 to-red-600 text-white p-3 flex items-center justify-between">
              <div className="flex items-center gap-2"><BellRing className="h-5 w-5" /><span className="font-bold">New Orders ({newOrderNotifs.length})</span></div>
              <button onClick={() => setShowNotifPanel(false)} className="hover:bg-white/20 rounded p-1" data-testid="button-close-notif">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex gap-2 p-2 border-b bg-gray-50">
              <Button size="sm" variant="outline" className="flex-1 h-8 text-xs" onClick={() => { try { playNotification(); } catch {} }} data-testid="button-test-sound">
                <Volume2 className="h-3 w-3 mr-1" /> Test
              </Button>
              <Button size="sm" variant="outline" className={`flex-1 h-8 text-xs ${soundEnabled ? "" : "bg-gray-100"}`} onClick={() => setSoundEnabled(v => !v)} data-testid="button-toggle-sound">
                {soundEnabled ? <><Bell className="h-3 w-3 mr-1" /> Sound On</> : <><BellOff className="h-3 w-3 mr-1" /> Muted</>}
              </Button>
            </div>
            <div className="overflow-y-auto flex-1">
              {newOrderNotifs.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No new orders</p>
                  <p className="text-xs mt-1">You'll be notified here when a new order comes in.</p>
                </div>
              ) : (
                newOrderNotifs.map((order, idx) => (
                  <div key={order.id || idx} className="p-3 border-b hover:bg-gray-50 cursor-pointer" onClick={() => { setReceiptOrder(order); setShowNotifPanel(false); }} data-testid={`notif-order-${order.id}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm text-gray-900">{order.customerName}</span>
                      <span className="font-bold text-green-600 text-sm">{brand?.currency || "PKR"} {Number(order.total).toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-gray-600">📞 {order.customerPhone} · 📍 {order.customerCity}</p>
                    <p className="text-xs text-gray-500 mt-1">💳 {order.paymentMethod?.toUpperCase()} · Click to view details</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <div className="md:hidden flex items-center justify-between p-3 bg-black/40 border-b border-white/10">
        <div className="flex items-center gap-3">
          {brand.logo ? <img src={brand.logo} className="w-8 h-8 rounded-lg object-cover" /> : <Shirt className="h-6 w-6 text-pink-400" />}
          <h2 className="font-bold text-sm truncate">{brand.name}</h2>
        </div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg bg-white/10">
          {sidebarOpen ? <X className="h-5 w-5" /> : <Layers className="h-5 w-5" />}
        </button>
      </div>

      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/80" onClick={() => setSidebarOpen(false)}>
          <div className="w-64 h-full bg-slate-950 border-r border-white/10 p-4 flex flex-col overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-6 p-2">
              {brand.logo ? <img src={brand.logo} className="w-10 h-10 rounded-lg object-cover" /> : <Shirt className="h-8 w-8 text-pink-400" />}
              <div className="min-w-0">
                <h2 className="font-bold text-sm truncate">{brand.name}</h2>
                <p className="text-xs text-gray-400">Brand Dashboard</p>
              </div>
            </div>
            {sidebar.map(item => (
              <button key={item.id} onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm transition-all ${activeTab === item.id ? "bg-pink-600/20 text-pink-400" : "text-gray-400 hover:bg-white/5"}`}>
                <item.icon className="h-4 w-4" />{item.label}
              </button>
            ))}
            <div className="mt-auto pt-4">
              <button onClick={() => window.open(`/clothing/${brand.slug}`, "_blank")} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-white/5 w-full">
                <Eye className="h-4 w-4" /> View Store
              </button>
              <button onClick={() => { localStorage.removeItem("clothingBrand"); setLocation("/clothing-brand-login"); }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 w-full">
                <LogOut className="h-4 w-4" /> Logout
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="hidden md:flex w-64 bg-black/40 border-r border-white/10 p-4 flex-col flex-shrink-0">
        <div className="flex items-center gap-3 mb-8 p-2">
          {brand.logo ? <img src={brand.logo} className="w-10 h-10 rounded-lg object-cover" /> : <Shirt className="h-8 w-8 text-pink-400" />}
          <div className="min-w-0">
            <h2 className="font-bold text-sm truncate">{brand.name}</h2>
            <p className="text-xs text-gray-400">Brand Dashboard</p>
          </div>
        </div>
        {sidebar.map(item => (
          <button key={item.id} onClick={() => setActiveTab(item.id)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm transition-all ${activeTab === item.id ? "bg-pink-600/20 text-pink-400" : "text-gray-400 hover:bg-white/5"}`}>
            <item.icon className="h-4 w-4" />{item.label}
          </button>
        ))}
        <div className="mt-auto">
          <button onClick={() => window.open(`/clothing/${brand.slug}`, "_blank")} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-white/5 w-full">
            <Eye className="h-4 w-4" /> View Store
          </button>
          <button onClick={() => { localStorage.removeItem("clothingBrand"); setLocation("/clothing-brand-login"); }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 w-full">
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </div>

      <div className="flex-1 p-3 sm:p-6 overflow-y-auto min-h-0" style={{ maxHeight: "100vh" }}>
        {activeTab === "dashboard" && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <h1 className="text-2xl font-bold">Dashboard</h1>
              <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border-2 ${brand?.isOpen === false ? "bg-red-500/15 border-red-500/40" : "bg-green-500/15 border-green-500/40"}`}>
                <div className={`w-3 h-3 rounded-full ${brand?.isOpen === false ? "bg-red-500" : "bg-green-500 animate-pulse"}`} />
                <span className={`font-bold text-sm ${brand?.isOpen === false ? "text-red-400" : "text-green-400"}`} data-testid="text-shop-status">
                  {brand?.isOpen === false ? "SHOP CLOSED" : "SHOP OPEN"}
                </span>
                <button
                  onClick={async () => {
                    const newStatus = !(brand?.isOpen === false ? false : true);
                    try {
                      const r = await fetch(`/api/clothing/brands/${brand.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ isOpen: newStatus }),
                      });
                      if (r.ok) {
                        const updated = await r.json();
                        const merged = { ...brand, ...updated };
                        setBrand(merged);
                        localStorage.setItem("clothingBrand", JSON.stringify(merged));
                        toast({ title: newStatus ? "Shop is now OPEN" : "Shop is now CLOSED", description: newStatus ? "Customers can place orders." : "Customers will see a closed message." });
                      } else {
                        toast({ title: "Failed to update", variant: "destructive" });
                      }
                    } catch {
                      toast({ title: "Network error", variant: "destructive" });
                    }
                  }}
                  className={`ml-1 px-3 py-1 rounded-lg text-xs font-bold transition-colors ${brand?.isOpen === false ? "bg-green-600 hover:bg-green-700 text-white" : "bg-red-600 hover:bg-red-700 text-white"}`}
                  data-testid="button-toggle-shop-status"
                >
                  {brand?.isOpen === false ? "OPEN SHOP" : "CLOSE SHOP"}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <Card className="bg-black/40 border-white/10 text-white"><CardContent className="pt-6">
                <div className="text-3xl font-bold text-pink-400">{products.length}</div><p className="text-sm text-gray-400">Total Products</p>
              </CardContent></Card>
              <Card className="bg-black/40 border-white/10 text-white"><CardContent className="pt-6">
                <div className="text-3xl font-bold text-green-400">{categories.length}</div><p className="text-sm text-gray-400">Categories</p>
              </CardContent></Card>
              <Card className="bg-black/40 border-white/10 text-white"><CardContent className="pt-6">
                <div className="text-3xl font-bold text-blue-400">{orders.length}</div><p className="text-sm text-gray-400">Orders</p>
              </CardContent></Card>
              <Card className="bg-black/40 border-white/10 text-white"><CardContent className="pt-6">
                <div className="text-3xl font-bold text-orange-400">{products.filter((p: any) => p.isSoldOut).length}</div><p className="text-sm text-gray-400">Sold Out</p>
              </CardContent></Card>
            </div>
            <h2 className="text-lg font-bold mb-4">Recent Orders</h2>
            {orders.slice(0, 5).map((o: any) => (
              <Card key={o.id} className="bg-black/40 border-white/10 text-white mb-3"><CardContent className="pt-4 flex justify-between items-center">
                <div><p className="font-medium">{o.customerName}</p><p className="text-sm text-gray-400">{new Date(o.createdAt).toLocaleDateString()}</p></div>
                <div className="text-right"><p className="font-bold">{brand.currency} {o.total}</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${o.orderStatus === "delivered" ? "bg-green-500/20 text-green-400" : o.orderStatus === "processing" ? "bg-blue-500/20 text-blue-400" : "bg-yellow-500/20 text-yellow-400"}`}>{o.orderStatus}</span>
                </div>
              </CardContent></Card>
            ))}
            {orders.length === 0 && <p className="text-gray-500 text-center py-8">No orders yet</p>}
          </div>
        )}

        {activeTab === "products" && (
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
              <h1 className="text-xl sm:text-2xl font-bold">Products ({products.length})</h1>
              <Dialog open={showProductForm} onOpenChange={setShowProductForm}>
                <DialogTrigger asChild>
                  <Button className="bg-pink-600 hover:bg-pink-700 w-full sm:w-auto" onClick={() => { resetProductForm(); setShowProductForm(true); }}>
                    <Plus className="h-4 w-4 mr-2" /> Add Product
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-900 text-white border-slate-700 max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader><DialogTitle>Add New Product</DialogTitle></DialogHeader>
                  <ProductFormUI label="Add Product" onSubmit={() => { if (!productForm.name || !productForm.price) return; createProduct.mutate(productForm); }} />
                </DialogContent>
              </Dialog>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((p: any) => {
                const cat = categories.find((c: any) => c.id === p.categoryId);
                return (
                  <Card key={p.id} className="bg-black/40 border-white/10 text-white overflow-hidden" data-testid={`card-product-${p.id}`}>
                    <div className="relative h-48 bg-gray-800">
                      {p.image1 ? <img src={p.image1} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full"><Package className="h-12 w-12 text-gray-600" /></div>}
                      {p.isSoldOut && <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded">SOLD OUT</div>}
                      {p.isNew && <div className="absolute top-2 right-2 bg-green-600 text-white text-xs px-2 py-1 rounded">NEW</div>}
                      {p.isFeatured && <div className="absolute bottom-2 left-2 bg-yellow-600 text-white text-xs px-2 py-1 rounded">FEATURED</div>}
                    </div>
                    <CardContent className="pt-4">
                      <h3 className="font-bold text-sm mb-1">{p.name}</h3>
                      <p className="text-xs text-gray-400 mb-2">{cat?.gender} - {cat?.name || "Uncategorized"}</p>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg font-bold text-pink-400">{brand.currency} {p.price}</span>
                        {p.wasPrice && <span className="text-sm text-gray-500 line-through">{brand.currency} {p.wasPrice}</span>}
                      </div>
                      {Array.isArray(p.sizes) && p.sizes.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {p.sizes.map((s: any) => {
                            const name = typeof s === "string" ? s : s.name;
                            const inStock = typeof s === "string" ? true : s.inStock;
                            return <span key={name} className={`text-xs px-2 py-0.5 rounded ${inStock ? "bg-green-600/30 text-green-300" : "bg-orange-500/30 text-orange-300 line-through"}`}>{name}</span>;
                          })}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2">
                        <Dialog open={editProduct?.id === p.id} onOpenChange={open => { if (!open) { setEditProduct(null); resetProductForm(); } }}>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline" className="flex-1 min-w-[60px] border-white/20" onClick={() => openEditProduct(p)}><Edit className="h-3 w-3 mr-1" /> Edit</Button>
                          </DialogTrigger>
                          <DialogContent className="bg-slate-900 text-white border-slate-700 max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader><DialogTitle>Edit {p.name}</DialogTitle></DialogHeader>
                            <ProductFormUI label="Save Changes" onSubmit={() => updateProduct.mutate({ id: p.id, data: productForm })} />
                          </DialogContent>
                        </Dialog>
                        <Button size="sm" variant="outline" className="border-white/20 text-xs"
                          onClick={() => updateProduct.mutate({ id: p.id, data: { isSoldOut: !p.isSoldOut } })}>
                          {p.isSoldOut ? "In Stock" : "Sold Out"}
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => { if (confirm("Delete?")) deleteProduct.mutate(p.id); }}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            {products.length === 0 && <p className="text-gray-500 text-center py-16">No products yet. Add your first product!</p>}
          </div>
        )}

        {activeTab === "upload" && (
          <div>
            <h1 className="text-2xl font-bold mb-6">Upload Product Images</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <Label className="mb-2 block">1. Select Category</Label>
                <Select value={uploadCatId} onValueChange={v => { setUploadCatId(v); setUploadProductId(""); }}>
                  <SelectTrigger><SelectValue placeholder="Choose a category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.gender} - {c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block">2. Select Product</Label>
                <Select value={uploadProductId} onValueChange={setUploadProductId}>
                  <SelectTrigger><SelectValue placeholder="Choose a product" /></SelectTrigger>
                  <SelectContent>
                    {products.filter((p: any) => !uploadCatId || uploadCatId === "all" || p.categoryId === uploadCatId).map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {uploadProductId && (() => {
              const product = products.find((p: any) => p.id === uploadProductId);
              if (!product) return null;
              const imageFields = [
                { key: "image1", label: "Image 1 - Front View" },
                { key: "image2", label: "Image 2 - Back View" },
                { key: "image3", label: "Image 3 - Left Side" },
                { key: "image4", label: "Image 4 - Right Side" },
                { key: "image5", label: "Image 5 - Detail / Zoom" },
              ];
              return (
                <Card className="bg-black/40 border-white/10 text-white">
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-bold mb-1">{product.name}</h3>
                    <p className="text-sm text-gray-400 mb-6">{brand.currency} {product.price} {product.color && `| ${product.color}`}</p>
                    <div className="grid grid-cols-1 gap-6">
                      {imageFields.map(({ key, label }) => (
                        <div key={key} className="border border-white/10 rounded-xl p-4">
                          <Label className="text-sm font-medium mb-3 block">{label}</Label>
                          <div className="flex flex-col sm:flex-row gap-4 items-start">
                            <div className="w-full sm:w-32 h-40 bg-gray-800 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center border border-white/10">
                              {(product as any)[key] ? (
                                <img src={(product as any)[key]} className="w-full h-full object-cover" />
                              ) : (
                                <div className="text-center text-gray-500 p-2">
                                  <ImagePlus className="h-8 w-8 mx-auto mb-1" />
                                  <p className="text-xs">No image</p>
                                </div>
                              )}
                            </div>
                            <div className="flex-1 space-y-2">
                              <Input placeholder="Paste image URL" value={(product as any)[key] || ""} onChange={e => {
                                fetch(`/api/clothing/products/${product.id}`, {
                                  method: "PATCH", headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ [key]: e.target.value }),
                                }).then(() => queryClient.invalidateQueries({ queryKey: [`/api/clothing/products`] }));
                              }} className="text-sm" />
                              <label className="cursor-pointer">
                                <input type="file" accept="image/*" className="hidden" onChange={async e => {
                                  const f = e.target.files?.[0];
                                  if (!f) return;
                                  setUploading(prev => ({ ...prev, [`${product.id}-${key}`]: true }));
                                  const reader = new FileReader();
                                  reader.onload = async () => {
                                    try {
                                      const res = await fetch("/api/upload-image", {
                                        method: "POST", headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ image: reader.result, filename: f.name }),
                                      });
                                      const data = await res.json();
                                      if (data.url) {
                                        await fetch(`/api/clothing/products/${product.id}`, {
                                          method: "PATCH", headers: { "Content-Type": "application/json" },
                                          body: JSON.stringify({ [key]: data.url }),
                                        });
                                        queryClient.invalidateQueries({ queryKey: [`/api/clothing/products`] });
                                        toast({ title: `${label} uploaded!` });
                                      }
                                    } catch { toast({ title: "Upload failed", variant: "destructive" }); }
                                    setUploading(prev => ({ ...prev, [`${product.id}-${key}`]: false }));
                                  };
                                  reader.readAsDataURL(f);
                                }} />
                                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${uploading[`${product.id}-${key}`] ? "bg-gray-600 cursor-wait" : "bg-pink-600 hover:bg-pink-700 cursor-pointer"}`}>
                                  <Upload className="h-4 w-4" />
                                  {uploading[`${product.id}-${key}`] ? "Uploading..." : "Upload Image"}
                                </div>
                              </label>
                              {(product as any)[key] && (
                                <Button size="sm" variant="destructive" className="text-xs" onClick={async () => {
                                  await fetch(`/api/clothing/products/${product.id}`, {
                                    method: "PATCH", headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ [key]: null }),
                                  });
                                  queryClient.invalidateQueries({ queryKey: [`/api/clothing/products`] });
                                  toast({ title: `${label} removed` });
                                }}>
                                  <Trash2 className="h-3 w-3 mr-1" /> Remove
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })()}

            {!uploadProductId && (
              <div className="text-center py-16">
                <ImagePlus className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Select a category and product to upload images</p>
                <p className="text-gray-600 text-sm mt-1">You can upload up to 5 images per product (Front, Back, Left, Right, Detail)</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "categories" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">Categories ({categories.length})</h1>
              <Dialog open={showCatForm} onOpenChange={setShowCatForm}>
                <DialogTrigger asChild>
                  <Button className="bg-pink-600 hover:bg-pink-700" onClick={() => { setCatForm({ name: "", gender: "Women", image: "", sortOrder: 0 }); setShowCatForm(true); }}>
                    <Plus className="h-4 w-4 mr-2" /> Add Category
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-900 text-white border-slate-700">
                  <DialogHeader><DialogTitle>Add Category</DialogTitle></DialogHeader>
                  <div className="grid gap-3">
                    <div><Label>Name</Label><Input value={catForm.name} onChange={e => setCatForm({ ...catForm, name: e.target.value })} /></div>
                    <div><Label>Section</Label>
                      <Select value={catForm.gender} onValueChange={v => setCatForm({ ...catForm, gender: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Women">Women</SelectItem>
                          <SelectItem value="Men">Men</SelectItem>
                          <SelectItem value="Kids">Kids</SelectItem>
                          <SelectItem value="Accessories">Accessories</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>Image URL</Label><Input value={catForm.image} onChange={e => setCatForm({ ...catForm, image: e.target.value })} /></div>
                    <div><Label>Sort Order</Label><Input type="number" value={catForm.sortOrder} onChange={e => setCatForm({ ...catForm, sortOrder: parseInt(e.target.value) || 0 })} /></div>
                    <Button className="bg-pink-600" onClick={() => { if (!catForm.name) return; createCategory.mutate(catForm); }}>Add Category</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            {["Women", "Men", "Kids", "Accessories"].map(gender => {
              const genderCats = categories.filter((c: any) => c.gender === gender);
              if (genderCats.length === 0) return null;
              return (
                <div key={gender} className="mb-6">
                  <h2 className="text-lg font-bold mb-3 text-pink-400">{gender}</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {genderCats.map((c: any) => (
                      <Card key={c.id} className="bg-black/40 border-white/10 text-white">
                        <CardContent className="pt-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-sm">{c.name}</p>
                              <p className="text-xs text-gray-400">{products.filter((p: any) => p.categoryId === c.id).length} products</p>
                            </div>
                            <div className="flex gap-1">
                              <Dialog open={editCat?.id === c.id} onOpenChange={open => { if (!open) setEditCat(null); }}>
                                <DialogTrigger asChild>
                                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditCat(c); setCatForm({ name: c.name, gender: c.gender || "Women", image: c.image || "", sortOrder: c.sortOrder || 0 }); }}>
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-slate-900 text-white border-slate-700">
                                  <DialogHeader><DialogTitle>Edit Category</DialogTitle></DialogHeader>
                                  <div className="grid gap-3">
                                    <div><Label>Name</Label><Input value={catForm.name} onChange={e => setCatForm({ ...catForm, name: e.target.value })} /></div>
                                    <div><Label>Section</Label>
                                      <Select value={catForm.gender} onValueChange={v => setCatForm({ ...catForm, gender: v })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="Women">Women</SelectItem><SelectItem value="Men">Men</SelectItem>
                                          <SelectItem value="Kids">Kids</SelectItem><SelectItem value="Accessories">Accessories</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div><Label>Image URL</Label><Input value={catForm.image} onChange={e => setCatForm({ ...catForm, image: e.target.value })} /></div>
                                    <Button className="bg-pink-600" onClick={() => updateCategory.mutate({ id: c.id, data: catForm })}>Save</Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400" onClick={() => { if (confirm("Delete category?")) deleteCategory.mutate(c.id); }}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "orders" && (() => {
          const q = orderSearch.trim().toLowerCase();
          const filteredOrders = q
            ? orders.filter((o: any) => {
                const code = (o.id || "").slice(0, 8).toLowerCase();
                const fullId = (o.id || "").toLowerCase();
                return code.includes(q)
                  || fullId.includes(q)
                  || (o.customerName || "").toLowerCase().includes(q)
                  || (o.customerPhone || "").toLowerCase().includes(q);
              })
            : orders;
          return (
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">Orders ({filteredOrders.length}{q ? ` of ${orders.length}` : ""})</h1>
                <p className="text-sm text-gray-400">{orders.filter((o: any) => o.orderStatus === "pending").length} pending</p>
              </div>
            </div>

            <div className="mb-4 relative">
              <Input
                value={orderSearch}
                onChange={e => setOrderSearch(e.target.value)}
                placeholder="Search by order code, name or phone..."
                className="bg-black/40 border-white/10 text-white pl-3 pr-10"
                data-testid="input-order-search"
              />
              {orderSearch && (
                <button onClick={() => setOrderSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1" data-testid="button-clear-search">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="space-y-4">
              {filteredOrders.map((o: any) => {
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
                              <p className="text-lg sm:text-xl font-bold text-pink-400">{brand.currency} {Number(o.total).toLocaleString()}</p>
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
                                        Qty: {item.quantity} {item.size && `| Size: ${item.size}`} {item.color && `| ${item.color}`}
                                      </p>
                                    </div>
                                    <p className="font-medium text-xs sm:text-sm text-pink-300">{brand.currency} {(Number(item.price) * Number(item.quantity)).toLocaleString()}</p>
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

                            <Select value={o.orderStatus} onValueChange={v => {
                              fetch(`/api/clothing/orders/${o.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderStatus: v }) })
                                .then(() => queryClient.invalidateQueries({ queryKey: ["/api/clothing/orders"] }));
                            }}>
                              <SelectTrigger className="w-28 sm:w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="confirmed">Confirmed</SelectItem>
                                <SelectItem value="processing">Processing</SelectItem>
                                <SelectItem value="shipped">Shipped</SelectItem>
                                <SelectItem value="delivered">Delivered</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>

                            {o.orderStatus === "pending" && (
                              <Button size="sm" className="h-8 bg-green-600 hover:bg-green-700 text-xs" data-testid={`button-accept-order-${o.id}`}
                                onClick={() => {
                                  fetch(`/api/clothing/orders/${o.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderStatus: "confirmed" }) })
                                    .then(() => { queryClient.invalidateQueries({ queryKey: ["/api/clothing/orders"] }); toast({ title: "Order accepted!" }); });
                                }}>
                                <CheckCircle className="h-3 w-3 mr-1" /> Accept
                              </Button>
                            )}

                            {o.orderStatus !== "pending" && o.orderStatus !== "cancelled" && (
                              <Button size="sm" variant="outline" className="h-8 border-white/20 text-xs gap-1" data-testid={`button-print-receipt-${o.id}`}
                                onClick={() => printReceipt(o)}>
                                <Printer className="h-3 w-3" /> Receipt
                              </Button>
                            )}

                            <Button size="sm" variant="outline" className="h-8 border-red-600/40 text-red-400 hover:bg-red-600 hover:text-white text-xs gap-1 ml-auto"
                              data-testid={`button-delete-order-${o.id}`}
                              onClick={async () => {
                                const code = (o.id || "").slice(0,8).toUpperCase();
                                if (!window.confirm(`Delete order ${code} from ${o.customerName || "customer"}?\n\nThis cannot be undone.`)) return;
                                try {
                                  const r = await fetch(`/api/clothing/orders/${o.id}?brandId=${brandId}`, { method: "DELETE" });
                                  if (!r.ok) {
                                    const err = await r.json().catch(() => ({}));
                                    toast({ title: "Delete failed", description: err.message || `Status ${r.status}`, variant: "destructive" });
                                    return;
                                  }
                                  queryClient.invalidateQueries({ queryKey: ["/api/clothing/orders"] });
                                  toast({ title: "Order deleted" });
                                } catch {
                                  toast({ title: "Delete failed", description: "Network error", variant: "destructive" });
                                }
                              }}>
                              <Trash2 className="h-3 w-3" /> Delete
                            </Button>
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
            {orders.length > 0 && filteredOrders.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-400">No orders match "{orderSearch}"</p>
                <Button variant="outline" size="sm" className="mt-3 border-white/20" onClick={() => setOrderSearch("")} data-testid="button-clear-search-empty">
                  Clear search
                </Button>
              </div>
            )}
          </div>
          );
        })()}

        {activeTab === "sliders" && (
          <div>
            <h1 className="text-2xl font-bold mb-6">Banner Sliders</h1>
            <div className="mb-6">
              <div className="flex gap-2 mb-4">
                <Input placeholder="Banner image URL" value={sliderUrl} onChange={e => setSliderUrl(e.target.value)} className="flex-1" />
                <Button className="bg-pink-600 hover:bg-pink-700" onClick={() => {
                  if (!sliderUrl) return;
                  updateBrandSliders.mutate([...bannerImages, sliderUrl]);
                  setSliderUrl("");
                }}><Plus className="h-4 w-4 mr-2" /> Add Slider</Button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bannerImages.map((img: string, idx: number) => (
                <Card key={idx} className="bg-black/40 border-white/10 overflow-hidden">
                  <div className="h-40 bg-gray-800">
                    <img src={img} className="w-full h-full object-cover" />
                  </div>
                  <CardContent className="pt-3 flex justify-between items-center">
                    <span className="text-sm text-gray-400">Slide {idx + 1}</span>
                    <Button size="sm" variant="destructive" onClick={() => {
                      updateBrandSliders.mutate(bannerImages.filter((_: string, i: number) => i !== idx));
                    }}><Trash2 className="h-3 w-3" /></Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            {bannerImages.length === 0 && <p className="text-gray-500 text-center py-8">No banner sliders yet. Add images to show on your storefront.</p>}
          </div>
        )}

        {activeTab === "promos" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">Promotions</h1>
              <Button className="bg-pink-600 hover:bg-pink-700" onClick={() => {
                setPromoForm({ title: "Shop any 3 items — Get Free Delivery!", minItems: 3, reward: "Free Delivery", productIds: [], isActive: true });
                setShowPromoForm(true);
              }}><Plus className="h-4 w-4 mr-2" /> Add Promotion</Button>
            </div>

            {(() => {
              const promoDeals: any[] = Array.isArray(brand.promoDeals) ? brand.promoDeals : [];
              return promoDeals.length > 0 ? promoDeals.map((promo: any, idx: number) => (
                <Card key={idx} className="bg-black/40 border-white/10 text-white mb-4">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-bold flex items-center gap-2">
                          <Gift className="h-5 w-5 text-pink-400" /> {promo.title}
                        </h3>
                        <p className="text-sm text-gray-400 mt-1">Buy {promo.minItems} items → {promo.reward}</p>
                        <p className="text-xs text-gray-500 mt-1">{promo.productIds?.length || 0} products selected</p>
                      </div>
                      <div className="flex gap-2 items-center">
                        <span className={`text-xs px-2 py-1 rounded-full ${promo.isActive ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"}`}>
                          {promo.isActive ? "Active" : "Inactive"}
                        </span>
                        <Button size="sm" variant="outline" className="border-white/20 text-white" onClick={() => {
                          setPromoForm({ ...promo });
                          setShowPromoForm(true);
                        }}><Edit className="h-3 w-3" /></Button>
                        <Button size="sm" variant="destructive" onClick={() => {
                          updateBrandPromos.mutate(promoDeals.filter((_: any, i: number) => i !== idx));
                        }}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </div>
                    {promo.productIds?.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {promo.productIds.map((pid: string) => {
                          const p = products.find((pr: any) => pr.id === pid);
                          return p ? (
                            <div key={pid} className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-1.5">
                              {p.image1 && <img src={p.image1} className="w-8 h-8 rounded object-cover" />}
                              <span className="text-xs">{p.name}</span>
                            </div>
                          ) : null;
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )) : <p className="text-gray-500 text-center py-16">No promotions yet. Create one to offer deals to your customers.</p>;
            })()}

            <Dialog open={showPromoForm} onOpenChange={setShowPromoForm}>
              <DialogContent className="bg-slate-900 text-white border-slate-700 max-w-2xl">
                <DialogHeader><DialogTitle>{promoForm.title ? "Edit Promotion" : "New Promotion"}</DialogTitle></DialogHeader>
                <div className="grid gap-4 max-h-[70vh] overflow-y-auto pr-2">
                  <div><Label>Promotion Title</Label>
                    <Input value={promoForm.title} onChange={e => setPromoForm({ ...promoForm, title: e.target.value })} placeholder="e.g. Shop any 3 items — Get Free Delivery!" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Minimum Items Required</Label>
                      <Input type="number" value={promoForm.minItems} onChange={e => setPromoForm({ ...promoForm, minItems: parseInt(e.target.value) || 1 })} min={1} />
                    </div>
                    <div><Label>Reward</Label>
                      <Select value={promoForm.reward} onValueChange={v => setPromoForm({ ...promoForm, reward: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Free Delivery">Free Delivery</SelectItem>
                          <SelectItem value="10% Off">10% Off</SelectItem>
                          <SelectItem value="20% Off">20% Off</SelectItem>
                          <SelectItem value="Free Gift">Free Gift</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={promoForm.isActive} onCheckedChange={v => setPromoForm({ ...promoForm, isActive: v })} />
                    <Label>Active</Label>
                  </div>
                  <div>
                    <Label className="mb-2 block">Select Products for this Deal ({promoForm.productIds.length} selected)</Label>
                    <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                      {products.map((p: any) => {
                        const isSelected = promoForm.productIds.includes(p.id);
                        return (
                          <button key={p.id} onClick={() => setPromoForm(prev => ({
                            ...prev,
                            productIds: isSelected ? prev.productIds.filter(id => id !== p.id) : [...prev.productIds, p.id],
                          }))} className={`flex items-center gap-2 p-2 rounded-lg border text-left text-sm transition-all ${isSelected ? "border-pink-500 bg-pink-500/10" : "border-white/10 hover:border-white/30"}`}>
                            {p.image1 && <img src={p.image1} className="w-10 h-10 rounded object-cover flex-shrink-0" />}
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-medium text-xs">{p.name}</p>
                              <p className="text-xs text-gray-400">{brand.currency} {p.price}</p>
                            </div>
                            {isSelected && <div className="w-5 h-5 bg-pink-600 rounded-full flex items-center justify-center flex-shrink-0"><span className="text-white text-xs">✓</span></div>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <Button className="w-full bg-pink-600 hover:bg-pink-700" onClick={() => {
                    if (!promoForm.title) return;
                    const promoDeals: any[] = Array.isArray(brand.promoDeals) ? [...brand.promoDeals] : [];
                    const existingIdx = promoDeals.findIndex((d: any) => d.title === promoForm.title);
                    if (existingIdx >= 0) {
                      promoDeals[existingIdx] = promoForm;
                    } else {
                      promoDeals.push(promoForm);
                    }
                    updateBrandPromos.mutate(promoDeals);
                    setShowPromoForm(false);
                  }}>Save Promotion</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {activeTab === "settings" && (
          <div>
            <h1 className="text-2xl font-bold mb-6">Brand Settings</h1>
            <Card className="bg-black/40 border-white/10 text-white mb-6">
              <CardContent className="pt-6">
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Brand Name</Label><p className="text-lg font-bold">{brand.name}</p></div>
                    <div><Label>Store URL</Label><p className="text-sm text-pink-400">/clothing/{brand.slug}</p></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-xs">Currency (shows on store + WhatsApp)</Label>
                      <select
                        value={brand.currency || "PKR"}
                        onChange={async (e) => {
                          const newCurrency = e.target.value;
                          const r = await fetch(`/api/clothing/brands/${brandId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currency: newCurrency }) });
                          const u = await r.json();
                          setBrand(u); localStorage.setItem("clothingBrand", JSON.stringify(u));
                          toast({ title: "Currency updated!", description: `Now showing ${newCurrency} on your public store.` });
                        }}
                        className="w-full h-10 px-3 rounded-md bg-white/5 border border-white/20 text-white"
                        data-testid="select-currency"
                      >
                        <option value="PKR">🇵🇰 Pakistani Rupee (Rs)</option>
                        <option value="GBP">🇬🇧 British Pound (£)</option>
                        <option value="USD">🇺🇸 US Dollar ($)</option>
                        <option value="EUR">🇪🇺 Euro (€)</option>
                        <option value="AED">🇦🇪 UAE Dirham (د.إ)</option>
                        <option value="INR">🇮🇳 Indian Rupee (₹)</option>
                        <option value="SAR">🇸🇦 Saudi Riyal (﷼)</option>
                      </select>
                    </div>
                    <div><Label className="text-xs">City</Label><p className="pt-2">{brand.city || "Not set"}</p></div>
                    <div><Label className="text-xs">Country</Label><p className="pt-2">{brand.country}</p></div>
                  </div>
                  <div><Label>Login Credentials</Label><p className="text-sm text-gray-400">Username: {brand.adminUsername}</p></div>
                </div>
              </CardContent>
            </Card>

            <h2 className="text-xl font-bold mb-4">Public Store Footer Info</h2>
            <p className="text-sm text-gray-400 mb-4">This information appears at the bottom of your public store page.</p>
            <Card className="bg-black/40 border-white/10 text-white mb-6">
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">Phone Number</Label>
                    <Input defaultValue={brand.phone || ""} className="bg-white/5 border-white/20"
                      onBlur={e => {
                        fetch(`/api/clothing/brands/${brandId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone: e.target.value }) })
                          .then(r => r.json()).then(u => { setBrand(u); localStorage.setItem("clothingBrand", JSON.stringify(u)); toast({ title: "Phone updated!" }); });
                      }} placeholder="+92 300 1234567" />
                  </div>
                  <div>
                    <Label className="text-xs">Email</Label>
                    <Input defaultValue={brand.email || ""} className="bg-white/5 border-white/20"
                      onBlur={e => {
                        fetch(`/api/clothing/brands/${brandId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: e.target.value }) })
                          .then(r => r.json()).then(u => { setBrand(u); localStorage.setItem("clothingBrand", JSON.stringify(u)); toast({ title: "Email updated!" }); });
                      }} placeholder="info@link24.online" />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Address</Label>
                    <Input defaultValue={brand.address || ""} className="bg-white/5 border-white/20"
                      onBlur={e => {
                        fetch(`/api/clothing/brands/${brandId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ address: e.target.value }) })
                          .then(r => r.json()).then(u => { setBrand(u); localStorage.setItem("clothingBrand", JSON.stringify(u)); toast({ title: "Address updated!" }); });
                      }} placeholder="123 Main Street" />
                  </div>
                  <div>
                    <Label className="text-xs">City</Label>
                    <Input defaultValue={brand.city || ""} className="bg-white/5 border-white/20"
                      onBlur={e => {
                        fetch(`/api/clothing/brands/${brandId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ city: e.target.value }) })
                          .then(r => r.json()).then(u => { setBrand(u); localStorage.setItem("clothingBrand", JSON.stringify(u)); toast({ title: "City updated!" }); });
                      }} placeholder="Karachi" />
                  </div>
                  <div>
                    <Label className="text-xs">Country</Label>
                    <Input defaultValue={brand.country || ""} className="bg-white/5 border-white/20"
                      onBlur={e => {
                        fetch(`/api/clothing/brands/${brandId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ country: e.target.value }) })
                          .then(r => r.json()).then(u => { setBrand(u); localStorage.setItem("clothingBrand", JSON.stringify(u)); toast({ title: "Country updated!" }); });
                      }} placeholder="Pakistan" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <h2 className="text-xl font-bold mb-4">Payment Methods</h2>
            <p className="text-sm text-gray-400 mb-4">Configure which payment methods are available at checkout. Customers will see enabled methods when placing orders.</p>

            <PaymentSettingsForm brand={brand} brandId={brandId} setBrand={setBrand} toast={toast} />

          </div>
        )}
      </div>
    </div>
  );
}
