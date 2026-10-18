import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  ShoppingCart, Package, Truck, Bell, BellRing, LogOut, Clock, CheckCircle, XCircle,
  MapPin, Phone, User, Car, Bike, Plus, Trash2, Edit2, Save, X, Eye,
  ChevronDown, AlertCircle, Store, Settings, Palette, Type, ExternalLink,
  Globe, LayoutDashboard, TrendingUp, DollarSign, ShoppingBag, Users,
  Upload, Image, Film, Sparkles, Monitor, Paintbrush, Tag, GripVertical, ChevronRight,
  Layers, FileText, AlertTriangle, Megaphone, ListChecks, Leaf, Apple, Calculator,
  Award, Thermometer, MapPin as MapPinIcon, Factory, Info, Building2, Loader2, Clipboard, ClipboardPaste, Power, Navigation, CircleDot
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

type GroceryOrder = {
  id: string; branchId: string; customerName: string; customerPhone: string | null;
  customerEmail: string | null; customerAddress: string | null; customerPostcode: string | null;
  status: string; subtotal: string; deliveryCharge: string; discount: string; total: string;
  paymentMethod: string; orderType: string; stripePaymentId: string | null;
  stripePaymentStatus: string | null; notes: string | null; createdAt: string;
  vatAmount: string; cutleryRequested: boolean; cutleryCharge: string;
};
type GroceryOrderItem = {
  id: string; orderId: string; productName: string; productImage: string | null;
  price: string; quantity: number; total: string;
};
type GroceryDriver = {
  id: string; branchId: string; name: string; phone: string; vehicleType: string;
  vehiclePlate: string | null; isActive: boolean; isOnDuty: boolean;
  lastLocationLat: string | null; lastLocationLng: string | null; lastSeen: string | null;
};

const STATUS_FLOW = ["pending", "confirmed", "preparing", "ready", "delivering", "completed"];
const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  preparing: "bg-orange-100 text-orange-800",
  ready: "bg-purple-100 text-purple-800",
  delivering: "bg-indigo-100 text-indigo-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

function apiCall(url: string, method = "GET", body?: any) {
  return fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  }).then(r => r.json());
}

export default function GroceryBranchDashboard() {
  const staffRoleInit = localStorage.getItem("groceryStaffId") ? (localStorage.getItem("groceryStaffRole") || "info-product") : null;
  const getInitialTab = (): "orders" | "drivers" | "categories" | "sub-categories" | "product-info" | "settings" | "branch-settings" => {
    if (!staffRoleInit) return "orders";
    const map: Record<string, any> = { "info-product": "product-info", "categories": "categories", "orders": "orders", "settings": "settings", "all": "orders" };
    return map[staffRoleInit] || "product-info";
  };
  const [activeTab, setActiveTab] = useState<"orders" | "drivers" | "categories" | "sub-categories" | "product-info" | "settings" | "branch-settings">(getInitialTab());
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const alarmRef = useRef<HTMLAudioElement | null>(null);
  const prevOrderCountRef = useRef<number>(0);
  const [showAreaSelector, setShowAreaSelector] = useState(false);
  const [visitorView, setVisitorView] = useState<"today" | "week">("today");
  const [areaType, setAreaType] = useState("town");
  const [areaValue, setAreaValue] = useState("");
  const areaSelectorRef = useRef<HTMLDivElement>(null);

  const branchId = localStorage.getItem("groceryBranchOwnerId");
  const branchName = localStorage.getItem("groceryBranchOwnerName");
  const currency = localStorage.getItem("groceryBranchOwnerCurrency") || "£";
  const staffId = localStorage.getItem("groceryStaffId");
  const staffName = localStorage.getItem("groceryStaffName");
  const staffRole = localStorage.getItem("groceryStaffRole");
  const isStaffLogin = !!staffId;

  const { data: branchInfo } = useQuery<any>({
    queryKey: ["/api/grocery/branch-info", branchId],
    queryFn: async () => {
      const branches = await apiCall(`/api/grocery/branches`);
      return branches.find((b: any) => b.id === branchId) || null;
    },
    enabled: !!branchId,
  });
  const branchLogo = branchInfo?.logo || "";

  useEffect(() => {
    if (!branchId) setLocation(isStaffLogin ? "/grocery-staff-login" : "/grocery-branch-login");
  }, [branchId]);

  useEffect(() => {
    if (isStaffLogin) setActiveTab(getInitialTab());
  }, [isStaffLogin]);

  useEffect(() => {
    if (branchInfo) {
      setAreaType(branchInfo.serviceAreaType || "town");
      setAreaValue(branchInfo.serviceAreaValue || "");
    }
  }, [branchInfo]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (areaSelectorRef.current && !areaSelectorRef.current.contains(e.target as Node)) {
        setShowAreaSelector(false);
      }
    };
    if (showAreaSelector) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showAreaSelector]);

  const { data: orders = [] } = useQuery<GroceryOrder[]>({
    queryKey: ["/api/grocery/orders", branchId],
    queryFn: () => apiCall(`/api/grocery/orders/${branchId}`),
    enabled: !!branchId,
    refetchInterval: 10000,
  });

  const { data: drivers = [] } = useQuery<GroceryDriver[]>({
    queryKey: ["/api/grocery/drivers", branchId],
    queryFn: () => apiCall(`/api/grocery/drivers/${branchId}`),
    enabled: !!branchId,
  });

  const { data: visitStats } = useQuery<{ today: number; lastWeek: number }>({
    queryKey: ["/api/grocery/visit-stats", branchId],
    queryFn: () => apiCall(`/api/grocery/branches/${branchId}/visit-stats`),
    enabled: !!branchId,
    refetchInterval: 30000,
  });

  const pendingOrders = orders.filter((o: GroceryOrder) => o.status === "pending" || o.status === "confirmed");

  useEffect(() => {
    if (orders.length > prevOrderCountRef.current && prevOrderCountRef.current > 0) {
      try {
        if (!alarmRef.current) {
          alarmRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
          alarmRef.current.loop = false;
        }
        alarmRef.current.currentTime = 0;
        alarmRef.current.play().catch(() => {});
        setTimeout(() => { alarmRef.current?.play().catch(() => {}); }, 2000);
        setTimeout(() => { alarmRef.current?.play().catch(() => {}); }, 4000);
      } catch {}
      toast({ title: "🔔 New Order!", description: "A customer just placed an order. Check the Orders tab." });
    }
    prevOrderCountRef.current = orders.length;
  }, [orders.length]);

  useEffect(() => {
    if (!branchId) return;
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/grocery-ws?groceryBranchId=${branchId}`);
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "new_order" || data.type === "order_updated") {
          qc.invalidateQueries({ queryKey: ["/api/grocery/orders", branchId] });
        }
      } catch {}
    };
    return () => ws.close();
  }, [branchId]);

  const logout = () => {
    localStorage.removeItem("groceryBranchOwnerId");
    localStorage.removeItem("groceryBranchOwnerName");
    localStorage.removeItem("groceryBranchOwnerSlug");
    localStorage.removeItem("groceryBranchOwnerCurrency");
    if (isStaffLogin) {
      localStorage.removeItem("groceryStaffId");
      localStorage.removeItem("groceryStaffName");
      localStorage.removeItem("groceryStaffRole");
      setLocation("/grocery-staff-login");
    } else {
      setLocation("/grocery-branch-login");
    }
  };

  if (!branchId) return null;

  const pendingCount = orders.filter(o => o.status === "pending").length;
  const confirmedCount = orders.filter(o => o.status === "confirmed").length;
  const preparingCount = orders.filter(o => o.status === "preparing").length;
  const completedCount = orders.filter(o => o.status === "completed").length;
  const todayRevenue = orders.filter(o => o.status === "completed").reduce((sum, o) => sum + parseFloat(o.total), 0);
  const activeDrivers = drivers.filter((d: GroceryDriver) => d.isActive).length;

  const { data: categoriesData = [] } = useQuery<any[]>({
    queryKey: ["/api/grocery/main-categories", branchId],
    queryFn: () => apiCall(`/api/grocery/main-categories/${branchId}`),
    enabled: !!branchId,
  });

  const allTabs = [
    { id: "orders" as const, label: "Orders", icon: Package, count: orders.length },
    { id: "drivers" as const, label: "Drivers", icon: Truck, count: drivers.length },
    { id: "categories" as const, label: "Categories", icon: Tag, count: categoriesData.length },
    { id: "sub-categories" as const, label: "Sub Categories", icon: Layers, count: null },
    { id: "product-info" as const, label: "Info Product", icon: FileText, count: null },
    { id: "settings" as const, label: "Store Settings", icon: Settings, count: null },
    { id: "branch-settings" as const, label: "Branch Settings", icon: Store, count: null },
  ];

  const getStaffTabs = () => {
    if (!isStaffLogin || !staffRoleInit) return allTabs;
    if (staffRoleInit === "all") return allTabs;
    const roleTabMap: Record<string, string[]> = {
      "info-product": ["product-info"],
      "categories": ["categories", "sub-categories"],
      "orders": ["orders"],
      "settings": ["settings"],
    };
    const allowedIds = roleTabMap[staffRoleInit] || ["product-info"];
    return allTabs.filter(t => allowedIds.includes(t.id));
  };
  const tabs = isStaffLogin ? getStaffTabs() : allTabs;

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #0f2027 0%, #203a43 30%, #2c5364 60%, #0f2027 100%)" }}>
      <header className="sticky top-0 z-30 backdrop-blur-xl" style={{ background: "rgba(15, 32, 39, 0.85)", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {branchLogo ? (
              <img src={branchLogo} alt="" className="h-11 w-11 rounded-xl object-cover shadow-lg ring-2 ring-white/20" />
            ) : (
              <div className="h-11 w-11 rounded-xl flex items-center justify-center shadow-lg" style={{ background: "linear-gradient(135deg, #00b09b, #96c93d)" }}>
                <Store className="h-5 w-5 text-white" />
              </div>
            )}
            <div>
              <h1 className="font-bold text-lg text-white flex items-center gap-2" data-testid="text-branch-name">
                {branchName}
                {branchInfo?.branchNumber && (
                  <span className="branch-id-animate text-sm font-black px-2 py-0.5 rounded-lg" style={{ border: "1px solid rgba(79,172,254,0.3)" }}>
                    B{branchInfo.branchNumber}
                  </span>
                )}
                {branchInfo?.serviceAreaType === "postcode" && branchInfo?.serviceAreaValue && (
                  <span className="flex items-center gap-1">
                    {branchInfo.serviceAreaValue.split(",").slice(0, 3).map((pc: string, i: number) => {
                      const colors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#3b82f6", "#8b5cf6"];
                      return (
                        <span key={pc.trim()} className="postcode-badge-animate text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: colors[i % colors.length] + "25", color: colors[i % colors.length], border: `1px solid ${colors[i % colors.length]}50`, animationDelay: `${i * 0.15}s` }}>
                          {pc.trim()}
                        </span>
                      );
                    })}
                    {branchInfo.serviceAreaValue.split(",").length > 3 && (
                      <span className="text-[10px] text-white/40">+{branchInfo.serviceAreaValue.split(",").length - 3}</span>
                    )}
                  </span>
                )}
              </h1>
              <p className="text-xs text-emerald-300/70">{isStaffLogin ? `Staff: ${staffName}` : "Branch Dashboard"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!isStaffLogin && (
            <div className="relative" ref={areaSelectorRef}>
              <button
                onClick={() => setShowAreaSelector(!showAreaSelector)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all bg-blue-500/15 text-blue-300 border border-blue-500/30 hover:bg-blue-500/25"
                data-testid="button-service-area"
              >
                <Navigation className="h-3.5 w-3.5" />
                <span className="hidden sm:inline max-w-[120px] truncate">
                  {areaValue || (areaType === "worldwide" ? "Worldwide" : areaType === "radius" ? "Set Radius" : "Set Area")}
                </span>
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showAreaSelector ? "rotate-180" : ""}`} />
              </button>
              {showAreaSelector && (
                <div className="absolute top-full right-0 mt-2 w-80 rounded-xl shadow-2xl z-50 overflow-hidden" style={{ background: "rgba(20, 40, 50, 0.98)", border: "1px solid rgba(255,255,255,0.15)", backdropFilter: "blur(20px)" }}>
                  <div className="p-4">
                    <h3 className="text-white font-semibold text-sm mb-1">Service Area</h3>
                    <p className="text-white/40 text-xs mb-4">Set your delivery or service coverage</p>
                    <div className="grid grid-cols-3 gap-1.5 mb-4">
                      {[
                        { key: "radius", label: "Radius", icon: CircleDot },
                        { key: "town", label: "Town", icon: Building2 },
                        { key: "postcode", label: "Postcode", icon: MapPin },
                        { key: "county", label: "County", icon: MapPin },
                        { key: "city", label: "City", icon: Building2 },
                        { key: "country", label: "Country", icon: Globe },
                        { key: "worldwide", label: "Worldwide", icon: Globe },
                      ].map(opt => (
                        <button
                          key={opt.key}
                          onClick={() => {
                            setAreaType(opt.key);
                            if (opt.key === "worldwide") setAreaValue("Worldwide");
                          }}
                          className={`flex flex-col items-center gap-1 p-2.5 rounded-lg text-xs font-medium transition-all ${areaType === opt.key ? "bg-blue-500/25 text-blue-300 border border-blue-500/40" : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white"}`}
                          data-testid={`button-area-type-${opt.key}`}
                        >
                          <opt.icon className="h-4 w-4" />
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    {areaType === "postcode" ? (
                      <div className="mb-4">
                        <Label className="text-white/60 text-xs mb-1.5 block">Add postcodes (e.g. IG1, WS3, E7)</Label>
                        <div className="flex gap-2 mb-3">
                          <Input
                            value={areaValue.includes(",") ? "" : areaValue}
                            onChange={e => {
                              const val = e.target.value.toUpperCase();
                              if (val.includes(",")) {
                                const parts = val.split(",").map(p => p.trim()).filter(Boolean);
                                const existing = areaValue ? areaValue.split(",").map(p => p.trim()).filter(Boolean) : [];
                                const merged = Array.from(new Set([...existing, ...parts]));
                                setAreaValue(merged.join(","));
                              } else {
                                const existing = areaValue ? areaValue.split(",").map(p => p.trim()).filter(Boolean) : [];
                                if (existing.length > 0) {
                                  // keep existing, this is for the input
                                }
                              }
                            }}
                            onKeyDown={e => {
                              if (e.key === "Enter") {
                                const input = (e.target as HTMLInputElement);
                                const val = input.value.trim().toUpperCase();
                                if (val) {
                                  const existing = areaValue ? areaValue.split(",").map(p => p.trim()).filter(Boolean) : [];
                                  if (!existing.includes(val)) {
                                    setAreaValue([...existing, val].join(","));
                                  }
                                  input.value = "";
                                }
                                e.preventDefault();
                              }
                            }}
                            placeholder="Type postcode & press Enter"
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/30 rounded-lg text-sm"
                            data-testid="input-postcode-add"
                          />
                        </div>
                        {areaValue && (
                          <div className="flex flex-wrap gap-2">
                            {areaValue.split(",").map(p => p.trim()).filter(Boolean).map((pc, i) => {
                              const colors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6", "#f43f5e"];
                              const color = colors[i % colors.length];
                              return (
                                <div
                                  key={pc}
                                  className="postcode-badge-animate flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-all hover:scale-110"
                                  style={{ background: color + "25", border: `2px solid ${color}60`, color, animationDelay: `${i * 0.1}s` }}
                                  onClick={() => {
                                    const updated = areaValue.split(",").map(p => p.trim()).filter(p => p !== pc).join(",");
                                    setAreaValue(updated);
                                  }}
                                  data-testid={`badge-postcode-${pc}`}
                                >
                                  <CheckCircle className="h-3.5 w-3.5" />
                                  {pc}
                                  <X className="h-3 w-3 opacity-60 hover:opacity-100" />
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ) : areaType !== "worldwide" && (
                      <div className="mb-4">
                        <Label className="text-white/60 text-xs mb-1.5 block">
                          {areaType === "radius" ? "Delivery radius (e.g. 5 miles)" :
                           areaType === "town" ? "Town name (e.g. Ilford)" :
                           areaType === "county" ? "County name (e.g. Essex)" :
                           areaType === "city" ? "City name (e.g. London)" :
                           "Country name (e.g. United Kingdom)"}
                        </Label>
                        <Input
                          value={areaValue}
                          onChange={e => setAreaValue(e.target.value)}
                          placeholder={
                            areaType === "radius" ? "5 miles" :
                            areaType === "town" ? "Ilford" :
                            areaType === "county" ? "Essex" :
                            areaType === "city" ? "London" : "United Kingdom"
                          }
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/30 rounded-lg text-sm"
                          data-testid="input-area-value"
                        />
                      </div>
                    )}
                    <Button
                      onClick={async () => {
                        if (!branchId) return;
                        try {
                          await apiCall(`/api/grocery/branches/${branchId}`, "PATCH", {
                            serviceAreaType: areaType,
                            serviceAreaValue: areaType === "worldwide" ? "Worldwide" : areaValue || null,
                          });
                          qc.invalidateQueries({ queryKey: ["/api/grocery/branch-info", branchId] });
                          toast({ title: "Service area updated!" });
                          setShowAreaSelector(false);
                        } catch {
                          toast({ title: "Failed to update", variant: "destructive" });
                        }
                      }}
                      className="w-full rounded-lg text-white text-sm font-semibold"
                      style={{ background: "linear-gradient(135deg, #4facfe, #00f2fe)" }}
                      data-testid="button-save-area"
                    >
                      <Save className="h-4 w-4 mr-2" /> Save Area
                    </Button>
                  </div>
                </div>
              )}
            </div>
            )}
            {!isStaffLogin && (<>
            <button
              onClick={async () => {
                if (!branchId) return;
                const newVal = !(branchInfo?.acceptingOrders ?? true);
                try {
                  await apiCall(`/api/grocery/branches/${branchId}`, "PATCH", { acceptingOrders: newVal });
                  qc.invalidateQueries({ queryKey: ["/api/grocery/branch-info", branchId] });
                  toast({ title: newVal ? "Branch is now OPEN - accepting orders" : "Branch is now CLOSED - not accepting orders", variant: newVal ? "default" : "destructive" });
                } catch { toast({ title: "Failed to update", variant: "destructive" }); }
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold transition-all ${(branchInfo?.acceptingOrders ?? true) ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30" : "bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30"}`}
              data-testid="button-toggle-accepting-orders"
            >
              <Power className="h-4 w-4" />
              {(branchInfo?.acceptingOrders ?? true) ? "ON" : "OFF"}
            </button>
            <button
              onClick={() => {
                try {
                  if (!alarmRef.current) {
                    alarmRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
                    alarmRef.current.loop = false;
                  }
                  alarmRef.current.currentTime = 0;
                  alarmRef.current.play().catch(() => {});
                } catch {}
                toast({ title: "Alarm test - sound played!" });
              }}
              className="relative p-2 rounded-full hover:bg-white/10 transition-colors"
              data-testid="button-alarm-bell"
            >
              <BellRing className={`h-5 w-5 ${pendingCount > 0 ? "text-amber-400 animate-bounce" : "text-white/60"}`} />
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse shadow-lg shadow-red-500/40">
                  {pendingCount}
                </span>
              )}
            </button>
            {pendingCount > 0 && (
              <Badge className="bg-red-500/90 text-white animate-pulse shadow-lg shadow-red-500/30 px-3" data-testid="badge-pending-count">
                <Bell className="h-3 w-3 mr-1" /> {pendingCount} pending
              </Badge>
            )}
            </>)}
            <a href={`/grocery/${localStorage.getItem("groceryBranchOwnerSlug") || ""}`} target="_blank" rel="noopener noreferrer">
              <Button size="sm" className="gap-2 rounded-lg text-white border-white/20" style={{ background: "rgba(255,255,255,0.1)", borderWidth: "1px" }} data-testid="button-view-store">
                <Globe className="h-4 w-4" /> View Store
              </Button>
            </a>
            <Button size="sm" onClick={logout} className="gap-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10" variant="ghost" data-testid="button-logout">
              <LogOut className="h-4 w-4" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 pt-6 pb-4">
        {!isStaffLogin && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {[
            { label: "Pending Orders", value: pendingCount, icon: ShoppingBag, gradient: "linear-gradient(135deg, #f093fb, #f5576c)", shadow: "rgba(245,87,108,0.3)" },
            { label: "In Progress", value: confirmedCount + preparingCount, icon: TrendingUp, gradient: "linear-gradient(135deg, #4facfe, #00f2fe)", shadow: "rgba(79,172,254,0.3)" },
            { label: "Today Revenue", value: `${currency}${todayRevenue.toFixed(2)}`, icon: DollarSign, gradient: "linear-gradient(135deg, #43e97b, #38f9d7)", shadow: "rgba(67,233,123,0.3)" },
            { label: "Active Drivers", value: activeDrivers, icon: Users, gradient: "linear-gradient(135deg, #fa709a, #fee140)", shadow: "rgba(250,112,154,0.3)" },
          ].map((stat, idx) => (
            <div key={idx} className="relative rounded-2xl p-4 overflow-hidden" style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.12)" }}>
              <div className="absolute top-0 right-0 w-16 h-16 rounded-full opacity-20 -mr-4 -mt-4" style={{ background: stat.gradient }} />
              <div className="h-9 w-9 rounded-xl flex items-center justify-center mb-2 shadow-lg" style={{ background: stat.gradient, boxShadow: `0 4px 15px ${stat.shadow}` }}>
                <stat.icon className="h-4 w-4 text-white" />
              </div>
              <p className="text-2xl font-bold text-white" data-testid={`stat-value-${idx}`}>{stat.value}</p>
              <p className="text-xs text-white/50">{stat.label}</p>
            </div>
          ))}
          <div className="relative rounded-2xl p-4 overflow-hidden cursor-pointer" style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.12)" }} onClick={() => setVisitorView(visitorView === "today" ? "week" : "today")} data-testid="stat-visitors">
            <div className="absolute top-0 right-0 w-16 h-16 rounded-full opacity-20 -mr-4 -mt-4" style={{ background: "linear-gradient(135deg, #a18cd1, #fbc2eb)" }} />
            <div className="h-9 w-9 rounded-xl flex items-center justify-center mb-2 shadow-lg" style={{ background: "linear-gradient(135deg, #a18cd1, #fbc2eb)", boxShadow: "0 4px 15px rgba(161,140,209,0.3)" }}>
              <Eye className="h-4 w-4 text-white" />
            </div>
            <p className="text-2xl font-bold text-white" data-testid="stat-value-visitors">{visitorView === "today" ? (visitStats?.today || 0) : (visitStats?.lastWeek || 0)}</p>
            <div className="flex items-center gap-1.5">
              <p className="text-xs text-white/50">{visitorView === "today" ? "Visitors Today" : "Visitors (7 Days)"}</p>
              <span className="text-[10px] text-white/30 bg-white/10 px-1.5 py-0.5 rounded-full">tap to toggle</span>
            </div>
          </div>
        </div>
        )}

        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                activeTab === tab.id
                  ? "text-white shadow-lg"
                  : "text-white/60 hover:text-white hover:bg-white/10"
              }`}
              style={activeTab === tab.id ? { background: "linear-gradient(135deg, #00b09b, #96c93d)", boxShadow: "0 4px 15px rgba(0,176,155,0.3)" } : { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
              data-testid={`tab-${tab.id}`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              {tab.count !== null && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? "bg-white/20" : "bg-white/10"}`}>{tab.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-8">
        <div className="rounded-2xl p-5 md:p-6" style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(15px)", border: "1px solid rgba(255,255,255,0.1)" }}>
          {activeTab === "orders" && (
            <OrdersSection orders={orders} drivers={drivers} branchId={branchId} currency={currency} qc={qc} toast={toast} />
          )}
          {activeTab === "drivers" && (
            <DriversSection drivers={drivers} branchId={branchId} qc={qc} toast={toast} />
          )}
          {activeTab === "categories" && (
            <CategoriesSection branchId={branchId} toast={toast} qc={qc} />
          )}
          {activeTab === "sub-categories" && (
            <SubCategoriesSection branchId={branchId} toast={toast} qc={qc} />
          )}
          {activeTab === "product-info" && (
            <BranchProductInfoSection branchId={branchId} toast={toast} qc={qc} isStaffLogin={isStaffLogin} />
          )}
          {activeTab === "settings" && (
            <BranchSettingsSection branchId={branchId} toast={toast} />
          )}
          {activeTab === "branch-settings" && (
            <BranchProductsManagerSection branchId={branchId} toast={toast} qc={qc} currency={currency} />
          )}
        </div>
      </div>
    </div>
  );
}

function OrdersSection({ orders, drivers, branchId, currency, qc, toast }: any) {
  const [orderItems, setOrderItems] = useState<Record<string, GroceryOrderItem[]>>({});
  const [statusFilter, setStatusFilter] = useState("all");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [driverMapOrderId, setDriverMapOrderId] = useState<string | null>(null);

  const loadItems = useCallback(async (orderId: string) => {
    if (orderItems[orderId]) return;
    const items = await apiCall(`/api/grocery/orders/${branchId}/items/${orderId}`);
    setOrderItems(prev => ({ ...prev, [orderId]: items }));
  }, [orderItems, branchId]);

  useEffect(() => {
    orders.forEach((o: GroceryOrder) => {
      if (!orderItems[o.id]) loadItems(o.id);
    });
  }, [orders]);

  const updateStatus = async (orderId: string, status: string) => {
    await apiCall(`/api/grocery/orders/${orderId}/status`, "PATCH", { status });
    qc.invalidateQueries({ queryKey: ["/api/grocery/orders", branchId] });
    toast({ title: `Order ${status}` });
  };

  const acceptOrder = async (orderId: string) => {
    await apiCall(`/api/grocery/orders/${orderId}/status`, "PATCH", { status: "confirmed" });
    qc.invalidateQueries({ queryKey: ["/api/grocery/orders", branchId] });
    toast({ title: "Order accepted!" });
  };

  const rejectOrder = async (order: GroceryOrder) => {
    setRejectingId(order.id);
    try {
      if (order.stripePaymentId && order.stripePaymentStatus === "paid") {
        const res = await fetch(`/api/grocery/orders/${order.id}/reject-refund`, { method: "POST" });
        const data = await res.json();
        if (!res.ok) {
          toast({ title: "Refund failed", description: data.error || "Could not process refund", variant: "destructive" });
          setRejectingId(null);
          return;
        }
        toast({ title: data.refunded ? "Order rejected & payment refunded" : "Order rejected" });
      } else {
        await apiCall(`/api/grocery/orders/${order.id}/status`, "PATCH", { status: "cancelled" });
        toast({ title: "Order rejected" });
      }
      qc.invalidateQueries({ queryKey: ["/api/grocery/orders", branchId] });
    } catch {
      toast({ title: "Failed to reject order", variant: "destructive" });
    }
    setRejectingId(null);
  };

  const assignDriver = async (orderId: string, driverId: string) => {
    await apiCall(`/api/grocery/orders/${orderId}/assign-driver`, "POST", { driverId });
    qc.invalidateQueries({ queryKey: ["/api/grocery/orders", branchId] });
    toast({ title: "Driver assigned & delivery started" });
  };

  const filtered = statusFilter === "all" ? orders : orders.filter((o: GroceryOrder) => o.status === statusFilter);

  const STATUS_GRADIENTS: Record<string, string> = {
    all: "linear-gradient(135deg, #667eea, #764ba2)",
    pending: "linear-gradient(135deg, #f093fb, #f5576c)",
    confirmed: "linear-gradient(135deg, #4facfe, #00f2fe)",
    preparing: "linear-gradient(135deg, #fa709a, #fee140)",
    ready: "linear-gradient(135deg, #a18cd1, #fbc2eb)",
    delivering: "linear-gradient(135deg, #667eea, #764ba2)",
    completed: "linear-gradient(135deg, #43e97b, #38f9d7)",
    cancelled: "linear-gradient(135deg, #ff6a88, #ff99ac)",
  };

  const timeSince = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ${mins % 60}m ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 mb-4">
        {["all", ...STATUS_FLOW, "cancelled"].map(s => {
          const count = s === "all" ? orders.length : orders.filter((o: GroceryOrder) => o.status === s).length;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                statusFilter === s ? "text-white shadow-lg scale-105" : "text-white/60 hover:text-white"
              }`}
              style={statusFilter === s
                ? { background: STATUS_GRADIENTS[s], boxShadow: "0 4px 15px rgba(0,0,0,0.2)" }
                : { background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }
              }
              data-testid={`filter-${s}`}
            >
              {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)} ({count})
            </button>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-2xl p-12 text-center" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <ShoppingBag className="h-12 w-12 mx-auto mb-3 text-white/20" />
          <p className="text-white/40 text-lg font-medium">No orders found</p>
          <p className="text-white/25 text-sm mt-1">Orders will appear here when customers place them</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((order: GroceryOrder) => {
          const items = orderItems[order.id] || [];
          const isPending = order.status === "pending" || order.status === "confirmed";
          const isDelivery = order.orderType === "delivery";
          const isPaid = order.stripePaymentStatus === "paid";
          const isCash = order.paymentMethod === "cash";

          return (
            <div key={order.id} className={`rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl ${order.status === "pending" ? "ring-2 ring-yellow-400/60 animate-pulse-slow" : ""}`} style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }} data-testid={`order-card-${order.id}`}>
              <div className="h-1.5" style={{ background: STATUS_GRADIENTS[order.status] || STATUS_GRADIENTS.pending }} />
              <div className="p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm font-bold text-white px-2.5 py-1 rounded-lg" style={{ background: "rgba(255,255,255,0.12)" }} data-testid={`order-number-${order.id}`}>#{order.id.slice(-4).toUpperCase()}</span>
                    <span className="text-[11px] font-bold text-white px-2.5 py-1 rounded-full uppercase tracking-wide" style={{ background: STATUS_GRADIENTS[order.status] }}>{order.status}</span>
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${isDelivery ? "bg-blue-500/30 text-blue-300 border border-blue-400/30" : "bg-purple-500/30 text-purple-300 border border-purple-400/30"}`}>
                      {isDelivery ? "🚗 Delivery" : "🏪 Collection"}
                    </span>
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${isCash ? "bg-amber-500/30 text-amber-300 border border-amber-400/30" : isPaid ? "bg-emerald-500/30 text-emerald-300 border border-emerald-400/30" : "bg-gray-500/30 text-gray-300 border border-gray-400/30"}`}>
                      {isCash ? "💵 Cash" : isPaid ? "💳 Paid" : "💳 Card"}
                    </span>
                  </div>
                  <p className="text-xs text-white/40 whitespace-nowrap">{timeSince(order.createdAt)}</p>
                </div>

                <div className="rounded-xl p-3 mb-3" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div className="flex items-center gap-2 mb-1">
                    <User className="h-4 w-4 text-emerald-400" />
                    <span className="font-semibold text-white text-sm">{order.customerName}</span>
                  </div>
                  {order.customerPhone && (
                    <a href={`tel:${order.customerPhone}`} className="flex items-center gap-2 text-sm text-white/60 hover:text-emerald-400 transition-colors ml-6 mb-0.5">
                      <Phone className="h-3.5 w-3.5" />{order.customerPhone}
                    </a>
                  )}
                  {order.customerAddress && (
                    <p className="flex items-center gap-2 text-sm text-white/60 ml-6 mb-0.5">
                      <MapPin className="h-3.5 w-3.5 text-red-400" />{order.customerAddress}{order.customerPostcode ? `, ${order.customerPostcode}` : ""}
                    </p>
                  )}
                  {order.customerEmail && (
                    <p className="flex items-center gap-2 text-xs text-white/40 ml-6">
                      ✉️ {order.customerEmail}
                    </p>
                  )}
                </div>

                {items.length > 0 && (
                  <div className="rounded-xl p-3 mb-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <p className="text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-2">Items ({items.length})</p>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.1) transparent" }}>
                      {items.map((item: GroceryOrderItem) => (
                        <div key={item.id} className="flex items-center gap-2 text-sm">
                          {item.productImage ? (
                            <img src={item.productImage} alt="" className="h-7 w-7 rounded-md object-cover shrink-0" />
                          ) : (
                            <div className="h-7 w-7 rounded-md bg-white/10 shrink-0 flex items-center justify-center"><Package className="h-3 w-3 text-white/30" /></div>
                          )}
                          <span className="text-white/80 flex-1 truncate text-xs">{item.productName}</span>
                          <span className="text-white/50 text-xs">×{item.quantity}</span>
                          <span className="text-white/90 font-semibold text-xs">{currency}{parseFloat(item.total).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between rounded-xl px-3 py-2 mb-3" style={{ background: "rgba(67,233,123,0.08)", border: "1px solid rgba(67,233,123,0.15)" }}>
                  <div className="flex gap-3 text-xs text-white/50">
                    <span>Sub: {currency}{parseFloat(order.subtotal).toFixed(2)}</span>
                    {parseFloat(order.deliveryCharge) > 0 && <span>Del: {currency}{parseFloat(order.deliveryCharge).toFixed(2)}</span>}
                    {parseFloat(order.discount) > 0 && <span className="text-emerald-400">-{currency}{parseFloat(order.discount).toFixed(2)}</span>}
                  </div>
                  <p className="text-xl font-bold bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(135deg, #43e97b, #38f9d7)" }}>{currency}{parseFloat(order.total).toFixed(2)}</p>
                </div>

                {order.notes && (
                  <p className="text-xs p-2.5 rounded-lg text-white/70 mb-3" style={{ background: "rgba(250,200,50,0.1)", border: "1px solid rgba(250,200,50,0.2)" }}>
                    <AlertCircle className="h-3 w-3 inline mr-1 text-yellow-400" />Note: {order.notes}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                  {order.status === "pending" && (
                    <>
                      <button
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg transition-transform hover:scale-[1.02]"
                        style={{ background: "linear-gradient(135deg, #43e97b, #38f9d7)", boxShadow: "0 4px 15px rgba(67,233,123,0.4)" }}
                        onClick={() => acceptOrder(order.id)}
                        data-testid={`button-accept-${order.id}`}
                      >
                        <CheckCircle className="h-4 w-4" /> Accept Order
                      </button>
                      <button
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg transition-transform hover:scale-[1.02]"
                        style={{ background: "linear-gradient(135deg, #ff6a88, #ff3d71)", boxShadow: "0 4px 15px rgba(255,106,136,0.4)" }}
                        onClick={() => rejectOrder(order)}
                        disabled={rejectingId === order.id}
                        data-testid={`button-reject-${order.id}`}
                      >
                        {rejectingId === order.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                        {rejectingId === order.id ? "Refunding..." : "Reject Order"}
                      </button>
                    </>
                  )}

                  {order.status === "confirmed" && (
                    <button
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg"
                      style={{ background: "linear-gradient(135deg, #fa709a, #fee140)", boxShadow: "0 4px 15px rgba(250,112,154,0.3)" }}
                      onClick={() => updateStatus(order.id, "preparing")}
                      data-testid={`button-preparing-${order.id}`}
                    >
                      <Package className="h-4 w-4" /> Start Preparing
                    </button>
                  )}

                  {order.status === "preparing" && (
                    <button
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg"
                      style={{ background: "linear-gradient(135deg, #a18cd1, #fbc2eb)", boxShadow: "0 4px 15px rgba(161,140,209,0.3)" }}
                      onClick={() => updateStatus(order.id, "ready")}
                      data-testid={`button-ready-${order.id}`}
                    >
                      <CheckCircle className="h-4 w-4" /> Order Ready
                    </button>
                  )}

                  {order.status === "ready" && !isDelivery && (
                    <button
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg"
                      style={{ background: "linear-gradient(135deg, #43e97b, #38f9d7)", boxShadow: "0 4px 15px rgba(67,233,123,0.3)" }}
                      onClick={() => updateStatus(order.id, "completed")}
                      data-testid={`button-collected-${order.id}`}
                    >
                      <CheckCircle className="h-4 w-4" /> Customer Collected
                    </button>
                  )}

                  {order.status === "ready" && isDelivery && (
                    <div className="flex-1">
                      <Select onValueChange={(val) => assignDriver(order.id, val)}>
                        <SelectTrigger className="w-full h-10 rounded-xl text-sm font-semibold text-white" style={{ background: "linear-gradient(135deg, #667eea, #764ba2)" }} data-testid={`select-driver-${order.id}`}>
                          <SelectValue placeholder="🚗 Assign Driver & Start Delivery" />
                        </SelectTrigger>
                        <SelectContent>
                          {drivers.filter((d: GroceryDriver) => d.isActive).map((d: GroceryDriver) => (
                            <SelectItem key={d.id} value={d.id}>
                              {d.vehicleType === "car" ? "🚗" : d.vehicleType === "bike" ? "🏍️" : d.vehicleType === "bicycle" ? "🚲" : "🚐"} {d.name} ({d.phone})
                            </SelectItem>
                          ))}
                          {drivers.filter((d: GroceryDriver) => d.isActive).length === 0 && (
                            <SelectItem value="none" disabled>No active drivers</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {order.status === "delivering" && (
                    <>
                      <button
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg"
                        style={{ background: "linear-gradient(135deg, #43e97b, #38f9d7)", boxShadow: "0 4px 15px rgba(67,233,123,0.3)" }}
                        onClick={() => updateStatus(order.id, "completed")}
                        data-testid={`button-delivered-${order.id}`}
                      >
                        <CheckCircle className="h-4 w-4" /> Mark Delivered
                      </button>
                      <button
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white/80 hover:text-white"
                        style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}
                        onClick={() => setDriverMapOrderId(driverMapOrderId === order.id ? null : order.id)}
                        data-testid={`button-track-driver-${order.id}`}
                      >
                        <MapPin className="h-4 w-4" /> {driverMapOrderId === order.id ? "Hide Map" : "Track Driver"}
                      </button>
                    </>
                  )}

                  {order.status === "completed" && (
                    <div className="flex-1 text-center py-2 rounded-xl" style={{ background: "rgba(67,233,123,0.1)", border: "1px solid rgba(67,233,123,0.2)" }}>
                      <p className="text-emerald-400 font-semibold text-sm">✅ Order Completed</p>
                    </div>
                  )}

                  {order.status === "cancelled" && (
                    <div className="flex-1 text-center py-2 rounded-xl" style={{ background: "rgba(255,106,136,0.1)", border: "1px solid rgba(255,106,136,0.2)" }}>
                      <p className="text-red-400 font-semibold text-sm">❌ Order Cancelled</p>
                    </div>
                  )}
                </div>

                {driverMapOrderId === order.id && order.status === "delivering" && (
                  <DriverMapEmbed orderId={order.id} branchId={branchId} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DriverMapEmbed({ orderId, branchId }: { orderId: string; branchId: string }) {
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [driverInfo, setDriverInfo] = useState<any>(null);

  useEffect(() => {
    apiCall(`/api/grocery/deliveries/${orderId}`).then(data => {
      if (data?.driver) {
        setDriverInfo(data.driver);
        if (data.driver.lastLocationLat && data.driver.lastLocationLng) {
          setDriverLocation({ lat: parseFloat(data.driver.lastLocationLat), lng: parseFloat(data.driver.lastLocationLng) });
        }
      }
    });
  }, [orderId]);

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/grocery-ws?groceryBranchId=${branchId}`);
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "driver_location" && data.orderId === orderId) {
          setDriverLocation({ lat: data.lat, lng: data.lng });
        }
      } catch {}
    };
    return () => ws.close();
  }, [orderId, branchId]);

  if (!driverLocation) {
    return (
      <div className="mt-3 rounded-xl p-6 text-center" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
        <Loader2 className="h-6 w-6 animate-spin mx-auto text-white/40 mb-2" />
        <p className="text-white/40 text-sm">Waiting for driver location...</p>
        {driverInfo && <p className="text-white/60 text-xs mt-1">Driver: {driverInfo.name} ({driverInfo.phone})</p>}
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.15)" }}>
      {driverInfo && (
        <div className="px-3 py-2 flex items-center gap-2" style={{ background: "rgba(102,126,234,0.15)", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <Car className="h-4 w-4 text-blue-400" />
          <span className="text-white/80 text-sm font-medium">{driverInfo.name}</span>
          <span className="text-white/40 text-xs">({driverInfo.phone})</span>
          <span className="text-white/40 text-xs ml-auto">{driverInfo.vehicleType}</span>
        </div>
      )}
      <iframe
        src={`https://www.google.com/maps?q=${driverLocation.lat},${driverLocation.lng}&z=15&output=embed`}
        className="w-full h-64"
        style={{ border: 0 }}
        loading="lazy"
        allowFullScreen
        data-testid={`map-driver-${orderId}`}
      />
    </div>
  );
}

function DriversSection({ drivers, branchId, qc, toast }: any) {
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [vehicleType, setVehicleType] = useState("car");
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editPlate, setEditPlate] = useState("");

  const addDriver = async () => {
    if (!name.trim() || !phone.trim() || !password.trim()) {
      toast({ title: "Name, phone, and password required", variant: "destructive" });
      return;
    }
    await apiCall("/api/grocery/drivers", "POST", {
      branchId, name: name.trim(), phone: phone.trim(), password, vehicleType, vehiclePlate: vehiclePlate.trim() || null,
    });
    setName(""); setPhone(""); setPassword(""); setVehiclePlate(""); setShowAdd(false);
    qc.invalidateQueries({ queryKey: ["/api/grocery/drivers", branchId] });
    toast({ title: "Driver added!" });
  };

  const deleteDriver = async (id: string) => {
    if (!confirm("Delete this driver?")) return;
    await apiCall(`/api/grocery/drivers/${id}`, "DELETE");
    qc.invalidateQueries({ queryKey: ["/api/grocery/drivers", branchId] });
    toast({ title: "Driver removed" });
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    await apiCall(`/api/grocery/drivers/${id}`, "PATCH", { isActive: !isActive });
    qc.invalidateQueries({ queryKey: ["/api/grocery/drivers", branchId] });
  };

  const saveEdit = async (id: string) => {
    await apiCall(`/api/grocery/drivers/${id}`, "PATCH", { name: editName, phone: editPhone, vehiclePlate: editPlate || null });
    setEditId(null);
    qc.invalidateQueries({ queryKey: ["/api/grocery/drivers", branchId] });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-white">Drivers</h2>
        <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white shadow-md" style={{ background: "linear-gradient(135deg, #43e97b, #38f9d7)", boxShadow: "0 4px 15px rgba(67,233,123,0.3)" }} data-testid="button-add-driver">
          <Plus className="h-4 w-4" /> Add Driver
        </button>
      </div>

      {showAdd && (
        <div className="rounded-2xl p-5 space-y-3" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label className="text-white/70">Name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Driver name" className="bg-white/10 border-white/10 text-white placeholder:text-white/30" data-testid="input-driver-name" />
            </div>
            <div>
              <Label className="text-white/70">Phone</Label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone number" className="bg-white/10 border-white/10 text-white placeholder:text-white/30" data-testid="input-driver-phone-add" />
            </div>
            <div>
              <Label className="text-white/70">Password</Label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Login password" className="bg-white/10 border-white/10 text-white placeholder:text-white/30" data-testid="input-driver-password-add" />
            </div>
            <div>
              <Label className="text-white/70">Vehicle Type</Label>
              <Select value={vehicleType} onValueChange={setVehicleType}>
                <SelectTrigger className="bg-white/10 border-white/10 text-white" data-testid="select-vehicle-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="car">Car</SelectItem>
                  <SelectItem value="bike">Bike</SelectItem>
                  <SelectItem value="bicycle">Bicycle</SelectItem>
                  <SelectItem value="van">Van</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-white/70">Vehicle Plate</Label>
              <Input value={vehiclePlate} onChange={e => setVehiclePlate(e.target.value)} placeholder="Optional" className="bg-white/10 border-white/10 text-white placeholder:text-white/30" data-testid="input-vehicle-plate" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={addDriver} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: "linear-gradient(135deg, #43e97b, #38f9d7)" }} data-testid="button-save-driver">Save Driver</button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-xl text-sm text-white/60 hover:text-white" style={{ background: "rgba(255,255,255,0.08)" }}>Cancel</button>
          </div>
        </div>
      )}

      {drivers.length === 0 && !showAdd && (
        <div className="rounded-2xl p-12 text-center" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <Truck className="h-12 w-12 mx-auto mb-3 text-white/20" />
          <p className="text-white/40 text-lg font-medium">No drivers yet</p>
          <p className="text-white/25 text-sm mt-1">Add your first delivery driver to get started</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {drivers.map((d: GroceryDriver) => {
          const vehicleGradient = d.vehicleType === "car" ? "linear-gradient(135deg, #4facfe, #00f2fe)" : d.vehicleType === "van" ? "linear-gradient(135deg, #667eea, #764ba2)" : "linear-gradient(135deg, #fa709a, #fee140)";
          return (
          <div key={d.id} className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }} data-testid={`driver-card-${d.id}`}>
            <div className="h-1" style={{ background: vehicleGradient }} />
            <div className="p-4">
              {editId === d.id ? (
                <div className="space-y-2">
                  <Input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Name" className="h-8 bg-white/10 border-white/10 text-white" />
                  <Input value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="Phone" className="h-8 bg-white/10 border-white/10 text-white" />
                  <Input value={editPlate} onChange={e => setEditPlate(e.target.value)} placeholder="Plate" className="h-8 bg-white/10 border-white/10 text-white" />
                  <div className="flex gap-2">
                    <button onClick={() => saveEdit(d.id)} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: "linear-gradient(135deg, #43e97b, #38f9d7)" }}><Save className="h-3 w-3" /></button>
                    <button onClick={() => setEditId(null)} className="px-3 py-1.5 rounded-lg text-xs text-white/60 hover:text-white" style={{ background: "rgba(255,255,255,0.08)" }}><X className="h-3 w-3" /></button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: vehicleGradient }}>
                        {d.vehicleType === "car" ? <Car className="h-4 w-4 text-white" /> : <Bike className="h-4 w-4 text-white" />}
                      </div>
                      <span className="font-bold text-white">{d.name}</span>
                    </div>
                    <div className="flex gap-1">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${d.isActive ? "text-white" : "text-white/50"}`} style={{ background: d.isActive ? "linear-gradient(135deg, #43e97b, #38f9d7)" : "rgba(255,255,255,0.1)" }}>
                        {d.isActive ? "Active" : "Inactive"}
                      </span>
                      {d.isOnDuty && <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-white" style={{ background: "linear-gradient(135deg, #4facfe, #00f2fe)" }}>On Duty</span>}
                    </div>
                  </div>
                  <p className="text-sm text-white/50 flex items-center gap-1"><Phone className="h-3 w-3" />{d.phone}</p>
                  {d.vehiclePlate && <p className="text-sm text-white/40">{d.vehicleType} · {d.vehiclePlate}</p>}
                  {d.lastSeen && <p className="text-xs text-white/30 mt-1">Last seen: {new Date(d.lastSeen).toLocaleString()}</p>}
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => toggleActive(d.id, d.isActive)} className="px-3 py-1.5 rounded-lg text-xs font-medium text-white" style={{ background: d.isActive ? "linear-gradient(135deg, #ff6a88, #ff99ac)" : "linear-gradient(135deg, #43e97b, #38f9d7)" }} data-testid={`toggle-active-${d.id}`}>
                      {d.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button onClick={() => { setEditId(d.id); setEditName(d.name); setEditPhone(d.phone); setEditPlate(d.vehiclePlate || ""); }} className="px-3 py-1.5 rounded-lg text-xs text-white/60 hover:text-white" style={{ background: "rgba(255,255,255,0.08)" }}>
                      <Edit2 className="h-3 w-3" />
                    </button>
                    <button onClick={() => deleteDriver(d.id)} className="px-3 py-1.5 rounded-lg text-xs text-red-400 hover:text-red-300" style={{ background: "rgba(255,255,255,0.08)" }}>
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}

function FileUploadBox({ label, accept, icon: Icon, currentUrl, onUpload, onClear, uploading }: {
  label: string; accept: string; icon: any; currentUrl: string;
  onUpload: (file: File) => void; onClear: () => void; uploading: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isVideo = accept.includes("video");
  const isImage = !isVideo;

  return (
    <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-white/70 text-xs font-medium flex items-center gap-1.5">
          <Icon className="h-3.5 w-3.5" /> {label}
        </span>
        {currentUrl && (
          <button onClick={onClear} className="text-red-400 hover:text-red-300 text-xs flex items-center gap-1">
            <X className="h-3 w-3" /> Remove
          </button>
        )}
      </div>
      {currentUrl ? (
        <div className="relative rounded-lg overflow-hidden" style={{ background: "rgba(0,0,0,0.3)" }}>
          {isImage && <img src={currentUrl} alt="" className="w-full h-32 object-cover rounded-lg" />}
          {isVideo && <video src={currentUrl} className="w-full h-32 object-cover rounded-lg" muted autoPlay loop playsInline />}
          <button
            onClick={() => inputRef.current?.click()}
            className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity text-white text-xs font-medium gap-1"
          >
            <Upload className="h-3.5 w-3.5" /> Replace
          </button>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full h-24 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-colors hover:border-emerald-400/50"
          style={{ borderColor: "rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.03)" }}
        >
          {uploading ? (
            <Store className="h-5 w-5 animate-spin text-emerald-400" />
          ) : (
            <>
              <Upload className="h-5 w-5 text-white/30" />
              <span className="text-white/30 text-xs">Click to upload</span>
              <span className="text-white/20 text-[10px]">{isVideo ? "MP4, WebM (50MB)" : "PNG, JPG, GIF, WebP (10MB)"}</span>
            </>
          )}
        </button>
      )}
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={e => {
        const file = e.target.files?.[0];
        if (file) onUpload(file);
        e.target.value = "";
      }} data-testid={`upload-${label.toLowerCase().replace(/\s+/g, "-")}`} />
    </div>
  );
}

function CategoriesSection({ branchId, toast, qc }: { branchId: string; toast: any; qc: any }) {
  const [editingCat, setEditingCat] = useState<any | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newCat, setNewCat] = useState({ name: "", color: "#22c55e", image: "" });

  const { data: categories = [], refetch } = useQuery<any[]>({
    queryKey: ["/api/grocery/main-categories", branchId],
    queryFn: () => apiCall(`/api/grocery/main-categories/${branchId}`),
    enabled: !!branchId,
  });

  const uploadFile = async (file: File): Promise<string | null> => {
    setUploading(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const result = await apiCall("/api/upload-image", "POST", { image: base64, filename: file.name });
      if (result.error) {
        toast({ title: result.error, variant: "destructive" });
        return null;
      }
      return result.url;
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleAdd = async () => {
    if (!newCat.name.trim()) {
      toast({ title: "Please enter a category name", variant: "destructive" });
      return;
    }
    await apiCall("/api/grocery/main-categories", "POST", {
      branchId,
      name: newCat.name,
      color: newCat.color,
      image: newCat.image || null,
      displayOrder: categories.length,
    });
    toast({ title: "Category added!" });
    setNewCat({ name: "", color: "#22c55e", image: "" });
    setShowAddDialog(false);
    refetch();
    qc.invalidateQueries({ queryKey: ["/api/grocery/main-categories", branchId] });
  };

  const handleUpdate = async () => {
    if (!editingCat) return;
    await apiCall(`/api/grocery/main-categories/${editingCat.id}`, "PATCH", {
      name: editingCat.name,
      color: editingCat.color,
      image: editingCat.image || null,
      displayOrder: editingCat.displayOrder,
    });
    toast({ title: "Category updated!" });
    setEditingCat(null);
    refetch();
    qc.invalidateQueries({ queryKey: ["/api/grocery/main-categories", branchId] });
  };

  const handleDelete = async (catId: string, catName: string) => {
    if (!confirm(`Delete "${catName}"? This will also remove all sub-categories and products in this category.`)) return;
    await apiCall(`/api/grocery/main-categories/${catId}`, "DELETE");
    toast({ title: "Category deleted" });
    refetch();
    qc.invalidateQueries({ queryKey: ["/api/grocery/main-categories", branchId] });
  };

  const darkInput = "bg-white/10 border-white/10 text-white placeholder:text-white/30 focus:border-emerald-400/50";
  const darkLabel = "text-white/70 text-sm font-medium";

  const presetColors = [
    "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16", "#22c55e", "#10b981",
    "#14b8a6", "#06b6d4", "#0ea5e9", "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7",
    "#d946ef", "#ec4899", "#f43f5e", "#64748b", "#78716c", "#b91c1c",
  ];

  const isVideoUrl = (url: string) => /\.(mp4|webm|mov)(\?|$)/i.test(url);

  const CategoryMediaUpload = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => {
    const imgRef = useRef<HTMLInputElement>(null);
    const vidRef = useRef<HTMLInputElement>(null);
    const isVideo = value ? isVideoUrl(value) : false;
    return (
      <div className="space-y-2">
        <Label className={darkLabel}>Category Media (Image / GIF / Video)</Label>
        <div className="flex gap-3 items-start">
          <div
            className="w-20 h-20 rounded-xl overflow-hidden border border-white/10 flex items-center justify-center cursor-pointer hover:border-emerald-400/50 transition-colors flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.05)" }}
            onClick={() => imgRef.current?.click()}
          >
            {value && isVideo ? (
              <video src={value} className="w-full h-full object-cover" muted autoPlay loop playsInline />
            ) : value ? (
              <img src={value} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center">
                <Upload className="h-5 w-5 text-white/30 mx-auto mb-1" />
                <span className="text-[10px] text-white/30">Upload</span>
              </div>
            )}
          </div>
          <div className="flex-1 space-y-2">
            <Input
              value={value}
              onChange={e => onChange(e.target.value)}
              placeholder="Media URL or upload..."
              className={darkInput + " text-xs"}
            />
            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                variant="ghost"
                className="text-xs text-emerald-400 hover:bg-emerald-400/10 h-7 px-2"
                onClick={() => imgRef.current?.click()}
                disabled={uploading}
              >
                <Image className="h-3 w-3 mr-1" /> Image/GIF
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-xs text-purple-400 hover:bg-purple-400/10 h-7 px-2"
                onClick={() => vidRef.current?.click()}
                disabled={uploading}
              >
                <Film className="h-3 w-3 mr-1" /> Video
              </Button>
              {value && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs text-red-400 hover:bg-red-400/10 h-7 px-2"
                  onClick={() => onChange("")}
                >
                  <X className="h-3 w-3 mr-1" /> Remove
                </Button>
              )}
            </div>
          </div>
        </div>
        <input
          ref={imgRef}
          type="file"
          accept="image/*,.gif"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            if (file.size > 10 * 1024 * 1024) {
              toast({ title: "File too large (max 10MB)", variant: "destructive" });
              return;
            }
            const url = await uploadFile(file);
            if (url) onChange(url);
          }}
        />
        <input
          ref={vidRef}
          type="file"
          accept="video/mp4,video/webm"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            if (file.size > 50 * 1024 * 1024) {
              toast({ title: "Video too large (max 50MB)", variant: "destructive" });
              return;
            }
            const url = await uploadFile(file);
            if (url) onChange(url);
          }}
        />
      </div>
    );
  };

  const ColorPicker = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <div className="space-y-2">
      <Label className={darkLabel}>Background Color</Label>
      <div className="flex items-center gap-3">
        <div className="relative">
          <input
            type="color"
            value={value}
            onChange={e => onChange(e.target.value)}
            className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0"
            style={{ background: "transparent" }}
          />
        </div>
        <Input value={value} onChange={e => onChange(e.target.value)} className={darkInput + " w-28 text-xs font-mono"} />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {presetColors.map(c => (
          <button
            key={c}
            onClick={() => onChange(c)}
            className={`w-6 h-6 rounded-md transition-all hover:scale-110 ${value === c ? "ring-2 ring-white ring-offset-1 ring-offset-transparent scale-110" : ""}`}
            style={{ background: c }}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Categories</h2>
          <p className="text-white/50 text-sm mt-0.5">{categories.length} categories • Manage your store departments</p>
        </div>
        <Button
          onClick={() => setShowAddDialog(true)}
          className="gap-2 rounded-xl font-semibold"
          style={{ background: "linear-gradient(135deg, #00b09b, #96c93d)" }}
          data-testid="button-add-category"
        >
          <Plus className="h-4 w-4" /> Add Category
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {categories.map((cat: any, idx: number) => (
          <div
            key={cat.id}
            className="group flex items-center gap-4 p-4 rounded-2xl transition-all hover:scale-[1.01]"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
            data-testid={`card-category-${cat.id}`}
          >
            <div
              className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center shadow-md"
              style={{ background: cat.image ? "transparent" : `linear-gradient(145deg, ${cat.color}40, ${cat.color}20)` }}
            >
              {cat.image && isVideoUrl(cat.image) ? (
                <video src={cat.image} className="w-full h-full object-cover" muted autoPlay loop playsInline />
              ) : cat.image ? (
                <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
              ) : (
                <Tag className="h-6 w-6" style={{ color: cat.color || "#22c55e" }} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm truncate">{cat.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-4 h-4 rounded-full border border-white/20" style={{ background: cat.color }} />
                <span className="text-white/40 text-xs">Order: {cat.displayOrder}</span>
              </div>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-blue-400 hover:bg-blue-400/10"
                onClick={() => setEditingCat({ ...cat })}
                data-testid={`button-edit-category-${cat.id}`}
              >
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-red-400 hover:bg-red-400/10"
                onClick={() => handleDelete(cat.id, cat.name)}
                data-testid={`button-delete-category-${cat.id}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {categories.length === 0 && (
        <div className="text-center py-16">
          <Tag className="h-12 w-12 text-white/20 mx-auto mb-3" />
          <p className="text-white/50 font-medium">No categories yet</p>
          <p className="text-white/30 text-sm mt-1">Add your first category to get started</p>
        </div>
      )}

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md border-white/10" style={{ background: "linear-gradient(135deg, #1a2a32, #1e3a45)", color: "#fff" }}>
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Plus className="h-5 w-5 text-emerald-400" /> Add New Category
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className={darkLabel}>Category Name</Label>
              <Input
                value={newCat.name}
                onChange={e => setNewCat(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Dairy & Eggs"
                className={darkInput}
                data-testid="input-new-category-name"
              />
            </div>
            <ColorPicker value={newCat.color} onChange={c => setNewCat(p => ({ ...p, color: c }))} />
            <CategoryMediaUpload value={newCat.image} onChange={v => setNewCat(p => ({ ...p, image: v }))} />
            <div className="flex gap-3 pt-2">
              <Button variant="ghost" onClick={() => setShowAddDialog(false)} className="flex-1 text-white/60 hover:text-white hover:bg-white/10 rounded-xl">
                Cancel
              </Button>
              <Button
                onClick={handleAdd}
                className="flex-1 rounded-xl font-bold"
                style={{ background: "linear-gradient(135deg, #00b09b, #96c93d)" }}
                data-testid="button-save-new-category"
              >
                <Save className="h-4 w-4 mr-2" /> Add Category
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingCat} onOpenChange={open => !open && setEditingCat(null)}>
        <DialogContent className="sm:max-w-md border-white/10" style={{ background: "linear-gradient(135deg, #1a2a32, #1e3a45)", color: "#fff" }}>
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Edit2 className="h-5 w-5 text-blue-400" /> Edit Category
            </DialogTitle>
          </DialogHeader>
          {editingCat && (
            <div className="space-y-4 pt-2">
              <div>
                <Label className={darkLabel}>Category Name</Label>
                <Input
                  value={editingCat.name}
                  onChange={e => setEditingCat((p: any) => ({ ...p, name: e.target.value }))}
                  className={darkInput}
                  data-testid="input-edit-category-name"
                />
              </div>
              <div>
                <Label className={darkLabel}>Display Order</Label>
                <Input
                  type="number"
                  value={editingCat.displayOrder}
                  onChange={e => setEditingCat((p: any) => ({ ...p, displayOrder: parseInt(e.target.value) || 0 }))}
                  className={darkInput + " w-24"}
                  data-testid="input-edit-category-order"
                />
              </div>
              <ColorPicker value={editingCat.color || "#22c55e"} onChange={c => setEditingCat((p: any) => ({ ...p, color: c }))} />
              <CategoryMediaUpload value={editingCat.image || ""} onChange={v => setEditingCat((p: any) => ({ ...p, image: v }))} />
              <div className="flex gap-3 pt-2">
                <Button variant="ghost" onClick={() => setEditingCat(null)} className="flex-1 text-white/60 hover:text-white hover:bg-white/10 rounded-xl">
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdate}
                  className="flex-1 rounded-xl font-bold"
                  style={{ background: "linear-gradient(135deg, #4facfe, #00f2fe)" }}
                  data-testid="button-save-edit-category"
                >
                  <Save className="h-4 w-4 mr-2" /> Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SubCategoriesSection({ branchId, toast, qc }: { branchId: string; toast: any; qc: any }) {
  const [selectedMainCat, setSelectedMainCat] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingSub, setEditingSub] = useState<any | null>(null);
  const [uploading, setUploading] = useState(false);
  const [newSub, setNewSub] = useState({ name: "", image: "" });
  const imgRef = useRef<HTMLInputElement>(null);
  const editImgRef = useRef<HTMLInputElement>(null);
  const gifRef = useRef<HTMLInputElement>(null);
  const editGifRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const editVideoRef = useRef<HTMLInputElement>(null);

  const { data: mainCategories = [] } = useQuery<any[]>({
    queryKey: ["/api/grocery/main-categories", branchId],
    queryFn: () => apiCall(`/api/grocery/main-categories/${branchId}`),
    enabled: !!branchId,
  });

  const { data: subCategories = [] } = useQuery<any[]>({
    queryKey: ["/api/grocery/sub-categories", selectedMainCat],
    queryFn: () => apiCall(`/api/grocery/sub-categories/${selectedMainCat}`),
    enabled: !!selectedMainCat,
  });

  const uploadFile = async (file: File): Promise<string | null> => {
    setUploading(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const result = await apiCall("/api/upload-image", "POST", { image: base64, filename: file.name });
      if (result.error) { toast({ title: result.error, variant: "destructive" }); return null; }
      return result.url;
    } catch { toast({ title: "Upload failed", variant: "destructive" }); return null; }
    finally { setUploading(false); }
  };

  const handleImageUpload = async (file: File, setter: (url: string) => void) => {
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large (max 10MB)", variant: "destructive" }); return;
    }
    const url = await uploadFile(file);
    if (url) setter(url);
  };

  const handleAdd = async () => {
    if (!newSub.name.trim()) { toast({ title: "Enter a name", variant: "destructive" }); return; }
    if (!selectedMainCat) { toast({ title: "Select a main category first", variant: "destructive" }); return; }
    await apiCall("/api/grocery/sub-categories", "POST", {
      branchId, mainCategoryId: selectedMainCat,
      name: newSub.name, image: newSub.image || null, displayOrder: subCategories.length,
    });
    toast({ title: "Sub-category added!" });
    setNewSub({ name: "", image: "" });
    setShowAddDialog(false);
    qc.invalidateQueries({ queryKey: ["/api/grocery/sub-categories", selectedMainCat] });
  };

  const handleUpdate = async () => {
    if (!editingSub) return;
    await apiCall(`/api/grocery/sub-categories/${editingSub.id}`, "PATCH", {
      name: editingSub.name, image: editingSub.image || null, gif: editingSub.gif || null, video: editingSub.video || null, displayOrder: editingSub.displayOrder,
    });
    toast({ title: "Sub-category updated!" });
    setEditingSub(null);
    qc.invalidateQueries({ queryKey: ["/api/grocery/sub-categories", selectedMainCat] });
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This will also remove all sub-sub-categories and products.`)) return;
    await apiCall(`/api/grocery/sub-categories/${id}`, "DELETE");
    qc.invalidateQueries({ queryKey: ["/api/grocery/sub-categories", selectedMainCat] });
    toast({ title: "Deleted" });
  };

  const darkInput = "bg-white/10 border-white/10 text-white placeholder:text-white/30 focus:border-emerald-400/50";
  const darkLabel = "text-white/70 text-sm font-medium";

  const MediaUploadField = ({ label, hint, value, onChange, fileRef, accept, icon: IconComp, color, testIdSuffix }: { label: string; hint?: string; value: string; onChange: (v: string) => void; fileRef: any; accept: string; icon: any; color: string; testIdSuffix: string }) => (
    <div className="space-y-2">
      <Label className={darkLabel}>{label} {hint && <span className="text-white/30 font-normal">({hint})</span>}</Label>
      <div className="flex gap-3 items-start">
        <div
          className="w-20 h-14 rounded-xl overflow-hidden border border-white/10 flex items-center justify-center cursor-pointer hover:border-emerald-400/50 transition-colors flex-shrink-0"
          style={{ background: "rgba(255,255,255,0.05)" }}
          onClick={() => fileRef.current?.click()}
          data-testid={`preview-${testIdSuffix}`}
        >
          {value ? (
            accept.includes("video") ? (
              <video src={value} className="w-full h-full object-cover" muted />
            ) : (
              <img src={value} alt="" className="w-full h-full object-cover" />
            )
          ) : (
            <div className="text-center">
              <Upload className="h-4 w-4 text-white/30 mx-auto" />
              <span className="text-[9px] text-white/40">Upload</span>
            </div>
          )}
        </div>
        <div className="flex-1 space-y-2">
          <Input value={value} onChange={e => onChange(e.target.value)} placeholder={`${label} URL or upload...`} className={darkInput + " text-xs"} data-testid={`input-${testIdSuffix}`} />
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="ghost" className={`text-xs h-7 px-2`} style={{ color }} onClick={() => fileRef.current?.click()} disabled={uploading} data-testid={`button-upload-${testIdSuffix}`}>
              <IconComp className="h-3 w-3 mr-1" /> Upload {label}
            </Button>
            {value && <Button size="sm" variant="ghost" className="text-xs text-red-400 hover:bg-red-400/10 h-7 px-2" onClick={() => onChange("")} data-testid={`button-remove-${testIdSuffix}`}><X className="h-3 w-3 mr-1" /> Remove</Button>}
          </div>
        </div>
      </div>
      <input ref={fileRef} type="file" accept={accept} className="hidden" onChange={async e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f, onChange); }} />
    </div>
  );

  const ImageUploadField = ({ value, onChange, fileRef }: { value: string; onChange: (v: string) => void; fileRef: any }) => (
    <MediaUploadField label="Image" hint="Landscape 700x400 recommended" value={value} onChange={onChange} fileRef={fileRef} accept="image/*,.gif,.png,.jpg,.jpeg,.webp" icon={Image} color="#34d399" testIdSuffix="image" />
  );

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Sub Categories</h2>
          <p className="text-white/50 text-sm mt-0.5">Manage sub-categories — add name & image</p>
        </div>
      </div>

      <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
        <Label className={darkLabel}>Select Main Category</Label>
        <Select value={selectedMainCat} onValueChange={setSelectedMainCat}>
          <SelectTrigger className={darkInput + " mt-2"} data-testid="select-main-cat-branch">
            <SelectValue placeholder="Choose a main category..." />
          </SelectTrigger>
          <SelectContent>
            {mainCategories.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {selectedMainCat && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-white/60 text-sm">{subCategories.length} sub-categories</p>
            <Button
              onClick={() => setShowAddDialog(true)}
              className="gap-2 rounded-xl font-semibold"
              style={{ background: "linear-gradient(135deg, #00b09b, #96c93d)" }}
              data-testid="button-add-sub-category-branch"
            >
              <Plus className="h-4 w-4" /> Add Sub Category
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {subCategories.map((cat: any, idx: number) => (
              <div
                key={cat.id}
                className="group relative overflow-hidden rounded-2xl transition-all hover:scale-[1.02]"
                style={{ aspectRatio: "7/4", border: "1px solid rgba(255,255,255,0.12)" }}
                data-testid={`card-subcategory-${cat.id}`}
              >
                {cat.image ? (
                  <img src={cat.image} alt={cat.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                ) : (
                  <div className="absolute inset-0 w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(0,176,155,0.3), rgba(150,201,61,0.3))" }}>
                    <Layers className="h-10 w-10 text-white/30" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-extrabold text-lg drop-shadow-lg truncate">{cat.name}</p>
                    <span className="text-white/60 text-sm font-medium">#{idx + 1}</span>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-blue-500/60 transition-colors"
                      onClick={() => setEditingSub({ ...cat })}
                      data-testid={`button-edit-subcategory-${cat.id}`}
                    >
                      <Edit2 className="h-3 w-3 text-white" />
                    </button>
                    <button
                      className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-red-500/60 transition-colors"
                      onClick={() => handleDelete(cat.id, cat.name)}
                      data-testid={`button-delete-subcategory-${cat.id}`}
                    >
                      <Trash2 className="h-3 w-3 text-white" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {subCategories.length === 0 && (
            <div className="text-center py-16">
              <Layers className="h-12 w-12 text-white/20 mx-auto mb-3" />
              <p className="text-white/50 font-medium">No sub-categories yet</p>
              <p className="text-white/30 text-sm mt-1">Add your first sub-category to get started</p>
            </div>
          )}

          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogContent className="sm:max-w-md border-white/10" style={{ background: "linear-gradient(135deg, #1a2a32, #1e3a45)", color: "#fff" }}>
              <DialogHeader>
                <DialogTitle className="text-white flex items-center gap-2">
                  <Plus className="h-5 w-5 text-emerald-400" /> Add Sub Category
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label className={darkLabel}>Sub Category Name</Label>
                  <Input
                    value={newSub.name}
                    onChange={e => setNewSub(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Bread"
                    className={darkInput}
                    data-testid="input-new-subcategory-name-branch"
                  />
                </div>
                <ImageUploadField value={newSub.image} onChange={v => setNewSub(p => ({ ...p, image: v }))} fileRef={imgRef} />
                <div className="flex gap-3 pt-2">
                  <Button variant="ghost" onClick={() => setShowAddDialog(false)} className="flex-1 text-white/60 hover:text-white hover:bg-white/10 rounded-xl" data-testid="button-cancel-add-subcategory">
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAdd}
                    className="flex-1 rounded-xl font-bold"
                    style={{ background: "linear-gradient(135deg, #00b09b, #96c93d)" }}
                    data-testid="button-save-new-subcategory-branch"
                  >
                    <Save className="h-4 w-4 mr-2" /> Add
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={!!editingSub} onOpenChange={open => !open && setEditingSub(null)}>
            <DialogContent className="sm:max-w-md border-white/10" style={{ background: "linear-gradient(135deg, #1a2a32, #1e3a45)", color: "#fff" }}>
              <DialogHeader>
                <DialogTitle className="text-white flex items-center gap-2">
                  <Edit2 className="h-5 w-5 text-blue-400" /> Edit Sub Category
                </DialogTitle>
              </DialogHeader>
              {editingSub && (
                <div className="space-y-4 pt-2">
                  <div>
                    <Label className={darkLabel}>Name</Label>
                    <Input
                      value={editingSub.name}
                      onChange={e => setEditingSub((p: any) => ({ ...p, name: e.target.value }))}
                      className={darkInput}
                      data-testid="input-edit-subcategory-name-branch"
                    />
                  </div>
                  <div>
                    <Label className={darkLabel}>Display Order</Label>
                    <Input
                      type="number"
                      value={editingSub.displayOrder}
                      onChange={e => setEditingSub((p: any) => ({ ...p, displayOrder: parseInt(e.target.value) || 0 }))}
                      className={darkInput + " w-24"}
                      data-testid="input-edit-subcategory-order-branch"
                    />
                  </div>
                  <ImageUploadField value={editingSub.image || ""} onChange={v => setEditingSub((p: any) => ({ ...p, image: v }))} fileRef={editImgRef} />
                  <MediaUploadField label="GIF" hint="Animated GIF" value={editingSub.gif || ""} onChange={v => setEditingSub((p: any) => ({ ...p, gif: v }))} fileRef={editGifRef} accept="image/gif,.gif" icon={Sparkles} color="#f59e0b" testIdSuffix="gif" />
                  <MediaUploadField label="Video" hint="MP4 recommended" value={editingSub.video || ""} onChange={v => setEditingSub((p: any) => ({ ...p, video: v }))} fileRef={editVideoRef} accept="video/*,.mp4,.webm,.mov" icon={Film} color="#8b5cf6" testIdSuffix="video" />
                  <div className="flex gap-3 pt-2">
                    <Button variant="ghost" onClick={() => setEditingSub(null)} className="flex-1 text-white/60 hover:text-white hover:bg-white/10 rounded-xl" data-testid="button-cancel-edit-subcategory">
                      Cancel
                    </Button>
                    <Button
                      onClick={handleUpdate}
                      className="flex-1 rounded-xl font-bold"
                      style={{ background: "linear-gradient(135deg, #4facfe, #00f2fe)" }}
                      data-testid="button-save-edit-subcategory-branch"
                    >
                      <Save className="h-4 w-4 mr-2" /> Save Changes
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}

function BranchSettingsSection({ branchId, toast }: { branchId: string; toast: any }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [settingsTab, setSettingsTab] = useState<"welcome" | "colors" | "store">("welcome");
  const [form, setForm] = useState({
    welcomeTitle: "", welcomeSubtitle: "", welcomeCtaText: "",
    welcomeBackgroundType: "gradient",
    welcomeBackgroundImageUrl: "", welcomeBackgroundVideoUrl: "",
    welcomeSliderImages: "",
    heroAnimationStyle: "slide", heroSlideInterval: 5000,
    fontFamily: "Inter", titleFontSize: "3rem", subtitleFontSize: "1.1rem",
    primaryColor: "#00bcd4", secondaryColor: "#ffffff", accentColor: "#ff9800",
    logo: "", themeColor: "#22c55e", address: "", phone: "", email: "",
    deliveryCharge: "1.99", freeDeliveryThreshold: "30",
    discountThreshold: "30", discountPercent: "5",
    vatRate: "0", collectionDiscountPercent: "10",
    collectionDiscountThreshold: "15", estimatedDeliveryTime: "45 minutes",
    cutleryPrice: "0.50",
    categoryCardStyle: "rounded", menuCardStyle: "grid",
  });

  const uploadFile = async (file: File, fieldKey: string) => {
    setUploading(fieldKey);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const result = await apiCall("/api/upload-image", "POST", { image: base64, filename: file.name });
      if (result.error) {
        toast({ title: result.error, variant: "destructive" });
      } else {
        setForm(prev => ({ ...prev, [fieldKey]: result.url }));
        toast({ title: "Uploaded successfully!" });
      }
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    }
    setUploading(null);
  };

  useEffect(() => {
    apiCall(`/api/grocery/branches`).then((branches: any[]) => {
      const b = branches.find((br: any) => br.id === branchId);
      if (b) {
        setForm({
          welcomeTitle: b.welcomeTitle || "What you need,\nWhen you need it.",
          welcomeSubtitle: b.welcomeSubtitle || "Delivered straight to your door",
          welcomeCtaText: b.welcomeCtaText || "Start Shopping",
          welcomeBackgroundType: b.welcomeBackgroundType || "gradient",
          welcomeBackgroundImageUrl: b.welcomeBackgroundImageUrl || "",
          welcomeBackgroundVideoUrl: b.welcomeBackgroundVideoUrl || "",
          welcomeSliderImages: Array.isArray(b.welcomeSliderImages) ? b.welcomeSliderImages.join("\n") : "",
          heroAnimationStyle: b.heroAnimationStyle || "slide",
          heroSlideInterval: b.heroSlideInterval || 5000,
          fontFamily: b.fontFamily || "Inter",
          titleFontSize: b.titleFontSize || "3rem",
          subtitleFontSize: b.subtitleFontSize || "1.1rem",
          primaryColor: b.primaryColor || "#00bcd4",
          secondaryColor: b.secondaryColor || "#ffffff",
          accentColor: b.accentColor || "#ff9800",
          logo: b.logo || "",
          themeColor: b.themeColor || "#22c55e",
          address: b.address || "",
          phone: b.phone || "",
          email: b.email || "",
          deliveryCharge: b.deliveryCharge || "1.99",
          freeDeliveryThreshold: b.freeDeliveryThreshold || "30",
          discountThreshold: b.discountThreshold || "30",
          discountPercent: b.discountPercent || "5",
          vatRate: b.vatRate || "0",
          collectionDiscountPercent: b.collectionDiscountPercent || "10",
          collectionDiscountThreshold: b.collectionDiscountThreshold || "15",
          estimatedDeliveryTime: b.estimatedDeliveryTime || "45 minutes",
          cutleryPrice: b.cutleryPrice || "0.50",
          categoryCardStyle: b.categoryCardStyle || "rounded",
          menuCardStyle: b.menuCardStyle || "grid",
        });
      }
      setLoading(false);
    });
  }, [branchId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const sliderImages = form.welcomeSliderImages.split("\n").map(s => s.trim()).filter(Boolean);
      await apiCall(`/api/grocery/branches/${branchId}`, "PATCH", {
        welcomeTitle: form.welcomeTitle,
        welcomeSubtitle: form.welcomeSubtitle,
        welcomeCtaText: form.welcomeCtaText,
        welcomePostcodeEnabled: false,
        welcomeBackgroundType: form.welcomeBackgroundType,
        welcomeBackgroundImageUrl: form.welcomeBackgroundImageUrl || null,
        welcomeBackgroundVideoUrl: form.welcomeBackgroundVideoUrl || null,
        welcomeSliderImages: sliderImages,
        heroAnimationStyle: form.heroAnimationStyle,
        heroSlideInterval: form.heroSlideInterval,
        fontFamily: form.fontFamily,
        titleFontSize: form.titleFontSize,
        subtitleFontSize: form.subtitleFontSize,
        primaryColor: form.primaryColor,
        secondaryColor: form.secondaryColor,
        accentColor: form.accentColor,
        logo: form.logo || null,
        themeColor: form.themeColor,
        address: form.address || null,
        phone: form.phone || null,
        email: form.email || null,
        deliveryCharge: form.deliveryCharge,
        freeDeliveryThreshold: form.freeDeliveryThreshold,
        discountThreshold: form.discountThreshold,
        discountPercent: form.discountPercent,
        vatRate: form.vatRate,
        collectionDiscountPercent: form.collectionDiscountPercent,
        collectionDiscountThreshold: form.collectionDiscountThreshold,
        estimatedDeliveryTime: form.estimatedDeliveryTime,
        cutleryPrice: form.cutleryPrice,
        categoryCardStyle: form.categoryCardStyle,
        menuCardStyle: form.menuCardStyle,
      });
      toast({ title: "Settings saved!" });
    } catch (err) {
      toast({ title: "Failed to save settings", variant: "destructive" });
    }
    setSaving(false);
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Store className="h-8 w-8 animate-spin text-emerald-400" /></div>;

  const update = (key: string, val: any) => setForm(prev => ({ ...prev, [key]: val }));

  const darkInput = "bg-white/10 border-white/10 text-white placeholder:text-white/30 focus:border-emerald-400/50";
  const darkLabel = "text-white/70 text-sm font-medium";
  const darkCard = "rounded-2xl p-5 space-y-4";
  const darkCardStyle = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" } as const;

  const settingsTabs = [
    { key: "welcome" as const, label: "Welcome Page", icon: Monitor, gradient: "linear-gradient(135deg, #a18cd1, #fbc2eb)" },
    { key: "colors" as const, label: "Colors & Style", icon: Paintbrush, gradient: "linear-gradient(135deg, #4facfe, #00f2fe)" },
    { key: "store" as const, label: "Store Details", icon: Store, gradient: "linear-gradient(135deg, #43e97b, #38f9d7)" },
  ];

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex gap-2 flex-wrap">
        {settingsTabs.map(t => (
          <button
            key={t.key}
            onClick={() => setSettingsTab(t.key)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={settingsTab === t.key
              ? { background: t.gradient, color: "#fff", boxShadow: "0 4px 15px rgba(0,0,0,0.2)" }
              : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }
            }
            data-testid={`tab-settings-${t.key}`}
          >
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      {settingsTab === "welcome" && (
        <div className="space-y-5">
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="flex items-center gap-2 px-4 py-2" style={{ background: "rgba(255,255,255,0.06)" }}>
              <Eye className="h-3.5 w-3.5 text-white/40" />
              <span className="text-white/40 text-xs font-medium">Live Preview</span>
            </div>
            <div className="relative h-52 overflow-hidden flex items-center justify-center" style={{
              background: form.welcomeBackgroundType === "gradient"
                ? `linear-gradient(160deg, ${form.primaryColor} 0%, ${form.primaryColor}cc 30%, ${form.accentColor}40 70%, ${form.primaryColor}90 100%)`
                : "rgba(0,0,0,0.6)"
            }}>
              {form.welcomeBackgroundType === "image" && form.welcomeBackgroundImageUrl && (
                <img src={form.welcomeBackgroundImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />
              )}
              {form.welcomeBackgroundType === "video" && form.welcomeBackgroundVideoUrl && (
                <video src={form.welcomeBackgroundVideoUrl} className="absolute inset-0 w-full h-full object-cover opacity-60" muted autoPlay loop playsInline />
              )}
              <div className="relative z-10 text-center px-6">
                {form.logo && <img src={form.logo} alt="" className="h-10 w-10 rounded-xl mx-auto mb-2 object-cover ring-2 ring-white/20" />}
                <h3 className="text-white font-extrabold text-lg leading-tight whitespace-pre-line mb-1 drop-shadow-lg" style={{ fontFamily: form.fontFamily }}>{form.welcomeTitle || "Welcome Title"}</h3>
                <p className="text-white/70 text-xs mb-3" style={{ fontFamily: form.fontFamily }}>{form.welcomeSubtitle || "Subtitle text"}</p>
                <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold text-white" style={{ background: form.primaryColor }}>
                  <ShoppingBag className="h-3 w-3" /> {form.welcomeCtaText || "Start Shopping"}
                </div>
              </div>
            </div>
          </div>

          <div className={darkCard} style={darkCardStyle}>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-4 w-4 text-purple-400" />
              <h3 className="text-white font-bold text-sm">Text & Button</h3>
            </div>
            <div>
              <Label className={darkLabel}>Welcome Title</Label>
              <Textarea value={form.welcomeTitle} onChange={e => update("welcomeTitle", e.target.value)} rows={3} className={darkInput} data-testid="input-welcome-title" />
            </div>
            <div>
              <Label className={darkLabel}>Welcome Subtitle</Label>
              <Input value={form.welcomeSubtitle} onChange={e => update("welcomeSubtitle", e.target.value)} className={darkInput} data-testid="input-welcome-subtitle" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className={darkLabel}>Button Text</Label>
                <Input value={form.welcomeCtaText} onChange={e => update("welcomeCtaText", e.target.value)} className={darkInput} data-testid="input-cta-text" />
              </div>
              <div>
                <Label className={darkLabel}>Animation Style</Label>
                <Select value={form.heroAnimationStyle} onValueChange={v => update("heroAnimationStyle", v)}>
                  <SelectTrigger className={darkInput} data-testid="select-animation"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="slide">Slide Up</SelectItem>
                    <SelectItem value="fade">Fade In</SelectItem>
                    <SelectItem value="zoom">Zoom In</SelectItem>
                    <SelectItem value="bounce">Bounce</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className={darkCard} style={darkCardStyle}>
            <div className="flex items-center gap-2 mb-1">
              <Image className="h-4 w-4 text-blue-400" />
              <h3 className="text-white font-bold text-sm">Background</h3>
            </div>
            <div>
              <Label className={darkLabel}>Background Type</Label>
              <div className="grid grid-cols-4 gap-2 mt-1">
                {[
                  { val: "gradient", label: "Gradient", icon: Palette },
                  { val: "image", label: "Image/GIF", icon: Image },
                  { val: "video", label: "Video", icon: Film },
                  { val: "slider", label: "Slider", icon: Monitor },
                ].map(opt => (
                  <button
                    key={opt.val}
                    onClick={() => update("welcomeBackgroundType", opt.val)}
                    className="flex flex-col items-center gap-1 p-3 rounded-xl text-xs font-medium transition-all"
                    style={form.welcomeBackgroundType === opt.val
                      ? { background: "linear-gradient(135deg, #4facfe, #00f2fe)", color: "#fff" }
                      : { background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)" }
                    }
                    data-testid={`btn-bg-${opt.val}`}
                  >
                    <opt.icon className="h-4 w-4" />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {form.welcomeBackgroundType === "image" && (
              <div className="space-y-3">
                <FileUploadBox
                  label="Background Image / GIF / PNG"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  icon={Image}
                  currentUrl={form.welcomeBackgroundImageUrl}
                  onUpload={(file) => uploadFile(file, "welcomeBackgroundImageUrl")}
                  onClear={() => update("welcomeBackgroundImageUrl", "")}
                  uploading={uploading === "welcomeBackgroundImageUrl"}
                />
                <div>
                  <Label className={darkLabel}>Or paste image URL</Label>
                  <Input value={form.welcomeBackgroundImageUrl} onChange={e => update("welcomeBackgroundImageUrl", e.target.value)} placeholder="https://..." className={darkInput} data-testid="input-bg-image" />
                </div>
              </div>
            )}

            {form.welcomeBackgroundType === "video" && (
              <div className="space-y-3">
                <FileUploadBox
                  label="Background Video"
                  accept="video/mp4,video/webm"
                  icon={Film}
                  currentUrl={form.welcomeBackgroundVideoUrl}
                  onUpload={(file) => uploadFile(file, "welcomeBackgroundVideoUrl")}
                  onClear={() => update("welcomeBackgroundVideoUrl", "")}
                  uploading={uploading === "welcomeBackgroundVideoUrl"}
                />
                <div>
                  <Label className={darkLabel}>Or paste video URL</Label>
                  <Input value={form.welcomeBackgroundVideoUrl} onChange={e => update("welcomeBackgroundVideoUrl", e.target.value)} placeholder="https://..." className={darkInput} data-testid="input-bg-video" />
                </div>
              </div>
            )}

            {form.welcomeBackgroundType === "slider" && (
              <div className="space-y-3">
                <div>
                  <Label className={darkLabel}>Slider Image URLs (one per line)</Label>
                  <Textarea value={form.welcomeSliderImages} onChange={e => update("welcomeSliderImages", e.target.value)} rows={4} placeholder={"https://image1.jpg\nhttps://image2.jpg"} className={darkInput} data-testid="input-slider-images" />
                </div>
                <div>
                  <Label className={darkLabel}>Slide Interval (ms)</Label>
                  <Input type="number" value={form.heroSlideInterval} onChange={e => update("heroSlideInterval", parseInt(e.target.value) || 5000)} className={darkInput} data-testid="input-slide-interval" />
                </div>
              </div>
            )}
          </div>

          <div className={darkCard} style={darkCardStyle}>
            <div className="flex items-center gap-2 mb-1">
              <Upload className="h-4 w-4 text-green-400" />
              <h3 className="text-white font-bold text-sm">Logo</h3>
            </div>
            <FileUploadBox
              label="Store Logo"
              accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
              icon={Image}
              currentUrl={form.logo}
              onUpload={(file) => uploadFile(file, "logo")}
              onClear={() => update("logo", "")}
              uploading={uploading === "logo"}
            />
            <div>
              <Label className={darkLabel}>Or paste logo URL</Label>
              <Input value={form.logo} onChange={e => update("logo", e.target.value)} placeholder="https://..." className={darkInput} data-testid="input-logo" />
            </div>
          </div>
        </div>
      )}

      {settingsTab === "colors" && (
        <div className="space-y-5">
          <div className={darkCard} style={darkCardStyle}>
            <div className="flex items-center gap-2 mb-1">
              <Type className="h-4 w-4 text-cyan-400" />
              <h3 className="text-white font-bold text-sm">Typography</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className={darkLabel}>Font Family</Label>
                <Select value={form.fontFamily} onValueChange={v => update("fontFamily", v)}>
                  <SelectTrigger className={darkInput} data-testid="select-font"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Inter", "Poppins", "Montserrat", "Roboto", "Playfair Display", "Lato", "Open Sans"].map(f => (
                      <SelectItem key={f} value={f}>{f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className={darkLabel}>Title Font Size</Label>
                <Input value={form.titleFontSize} onChange={e => update("titleFontSize", e.target.value)} placeholder="3rem" className={darkInput} data-testid="input-title-size" />
              </div>
            </div>
            <div>
              <Label className={darkLabel}>Subtitle Font Size</Label>
              <Input value={form.subtitleFontSize} onChange={e => update("subtitleFontSize", e.target.value)} placeholder="1.1rem" className={darkInput} data-testid="input-subtitle-size" />
            </div>
          </div>

          <div className={darkCard} style={darkCardStyle}>
            <div className="flex items-center gap-2 mb-1">
              <Palette className="h-4 w-4 text-pink-400" />
              <h3 className="text-white font-bold text-sm">Colors</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { key: "primaryColor", label: "Primary", testId: "primary" },
                { key: "secondaryColor", label: "Secondary", testId: "secondary" },
                { key: "accentColor", label: "Accent", testId: "accent" },
                { key: "themeColor", label: "Theme", testId: "theme" },
              ].map(c => (
                <div key={c.key} className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.04)" }}>
                  <Label className={darkLabel}>{c.label} Color</Label>
                  <div className="flex gap-2 mt-1">
                    <div className="relative">
                      <input type="color" value={(form as any)[c.key]} onChange={e => update(c.key, e.target.value)} className="h-10 w-12 rounded-lg cursor-pointer opacity-0 absolute inset-0" data-testid={`color-${c.testId}`} />
                      <div className="h-10 w-12 rounded-lg border border-white/10 shadow-inner" style={{ background: (form as any)[c.key] }} />
                    </div>
                    <Input value={(form as any)[c.key]} onChange={e => update(c.key, e.target.value)} className={`flex-1 ${darkInput}`} data-testid={`input-${c.testId}-color`} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={darkCard} style={darkCardStyle}>
            <div className="flex items-center gap-2 mb-1">
              <LayoutDashboard className="h-4 w-4 text-amber-400" />
              <h3 className="text-white font-bold text-sm">Display Style</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className={darkLabel}>Category Card Style</Label>
                <Select value={form.categoryCardStyle} onValueChange={v => update("categoryCardStyle", v)}>
                  <SelectTrigger className={darkInput} data-testid="select-cat-style"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rounded">Rounded</SelectItem>
                    <SelectItem value="square">Square</SelectItem>
                    <SelectItem value="minimal">Minimal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className={darkLabel}>Menu Card Style</Label>
                <Select value={form.menuCardStyle} onValueChange={v => update("menuCardStyle", v)}>
                  <SelectTrigger className={darkInput} data-testid="select-menu-style"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grid">Grid</SelectItem>
                    <SelectItem value="list">List</SelectItem>
                    <SelectItem value="compact">Compact</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      )}

      {settingsTab === "store" && (
        <div className={darkCard} style={darkCardStyle}>
          <div className="flex items-center gap-2 mb-1">
            <Store className="h-4 w-4 text-emerald-400" />
            <h3 className="text-white font-bold text-sm">Store Information</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className={darkLabel}>Address</Label>
              <Input value={form.address} onChange={e => update("address", e.target.value)} placeholder="Store address" className={darkInput} data-testid="input-address" />
            </div>
            <div>
              <Label className={darkLabel}>Phone</Label>
              <Input value={form.phone} onChange={e => update("phone", e.target.value)} placeholder="Phone number" className={darkInput} data-testid="input-phone" />
            </div>
          </div>
          <div>
            <Label className={darkLabel}>Email</Label>
            <Input value={form.email} onChange={e => update("email", e.target.value)} placeholder="email@store.com" className={darkInput} data-testid="input-email" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
            <div>
              <Label className={darkLabel}>Delivery Charge (£)</Label>
              <Input value={form.deliveryCharge} onChange={e => update("deliveryCharge", e.target.value)} className={darkInput} data-testid="input-delivery-charge" />
            </div>
            <div>
              <Label className={darkLabel}>Free Delivery Min (£)</Label>
              <Input value={form.freeDeliveryThreshold} onChange={e => update("freeDeliveryThreshold", e.target.value)} className={darkInput} data-testid="input-free-delivery" />
            </div>
            <div>
              <Label className={darkLabel}>Delivery Discount Min (£)</Label>
              <Input value={form.discountThreshold} onChange={e => update("discountThreshold", e.target.value)} className={darkInput} data-testid="input-discount-min" />
            </div>
            <div>
              <Label className={darkLabel}>Delivery Discount %</Label>
              <Input value={form.discountPercent} onChange={e => update("discountPercent", e.target.value)} className={darkInput} data-testid="input-discount-pct" />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
            <div>
              <Label className={darkLabel}>VAT Rate (%)</Label>
              <Input value={form.vatRate} onChange={e => update("vatRate", e.target.value)} placeholder="0" className={darkInput} data-testid="input-vat-rate" />
            </div>
            <div>
              <Label className={darkLabel}>Collection Discount %</Label>
              <Input value={form.collectionDiscountPercent} onChange={e => update("collectionDiscountPercent", e.target.value)} placeholder="10" className={darkInput} data-testid="input-collection-discount-pct" />
            </div>
            <div>
              <Label className={darkLabel}>Collection Min (£)</Label>
              <Input value={form.collectionDiscountThreshold} onChange={e => update("collectionDiscountThreshold", e.target.value)} placeholder="15" className={darkInput} data-testid="input-collection-discount-min" />
            </div>
            <div>
              <Label className={darkLabel}>Cutlery Price (£)</Label>
              <Input value={form.cutleryPrice} onChange={e => update("cutleryPrice", e.target.value)} placeholder="0.50" className={darkInput} data-testid="input-cutlery-price" />
            </div>
          </div>
          <div>
            <Label className={darkLabel}>Estimated Delivery Time</Label>
            <Input value={form.estimatedDeliveryTime} onChange={e => update("estimatedDeliveryTime", e.target.value)} placeholder="45 minutes" className={darkInput} data-testid="input-est-delivery-time" />
          </div>
        </div>
      )}

      <button onClick={handleSave} disabled={saving} className="w-full h-12 rounded-2xl text-lg font-bold text-white flex items-center justify-center gap-2 shadow-lg transition-all hover:shadow-xl disabled:opacity-50" style={{ background: "linear-gradient(135deg, #43e97b, #38f9d7)", boxShadow: "0 4px 20px rgba(67,233,123,0.3)" }} data-testid="button-save-settings">
        {saving ? <Store className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
        {saving ? "Saving..." : "Save All Settings"}
      </button>
    </div>
  );
}

type BranchProduct = { id: string; branchId: string; mainCategoryId: string; subCategoryId: string | null; name: string; description: string | null; allergyAdvice: string | null; productMarketing: string | null; features: string | null; lifestyle: string | null; ingredients: string | null; calculatedNutrition: string | null; nutritionalClaims: string | null; storageUsage: string | null; storageType: string | null; country: string | null; companyName: string | null; companyAddress: string | null; manufacturer: string | null; moreInformation: string | null; nutrition: string | null; disclaimer: string | null; isAvailable: boolean; };

function BranchProductInfoSection({ branchId, toast, qc, isStaffLogin = false }: { branchId: string | null; toast: any; qc: any; isStaffLogin?: boolean }) {
  const [infoMainCat, setInfoMainCat] = useState("");
  const [infoSubCat, setInfoSubCat] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [saving, setSaving] = useState(false);
  const [hiddenFields, setHiddenFields] = useState<Set<string>>(new Set());
  const [taskMode, setTaskMode] = useState(false);
  const [copiedFlag, setCopiedFlag] = useState(false);
  const [customSections, setCustomSections] = useState<{ key: string; label: string }[]>([]);
  const [newSectionName, setNewSectionName] = useState("");
  const [savedSuccess, setSavedSuccess] = useState(false);

  const emptyFormData: Record<string, string> = {
    allergyAdvice: "", productMarketing: "", description: "", features: "", lifestyle: "",
    ingredients: "", calculatedNutrition: "", nutritionalClaims: "", storageUsage: "",
    storageConditions: "", storageType: "", country: "", companyName: "", companyAddress: "",
    manufacturer: "", moreInformation: "", nutrition: "", disclaimer: "",
  };

  const [formData, setFormData] = useState<Record<string, string>>({ ...emptyFormData });

  const { data: mainCats = [] } = useQuery<any[]>({
    queryKey: ["/api/grocery/main-categories", branchId],
    queryFn: () => apiCall(`/api/grocery/main-categories/${branchId}`),
    enabled: !!branchId,
  });
  const { data: subCats = [] } = useQuery<any[]>({
    queryKey: ["/api/grocery/sub-categories", infoMainCat],
    queryFn: () => apiCall(`/api/grocery/sub-categories/${infoMainCat}`),
    enabled: !!infoMainCat,
  });
  const { data: products = [] } = useQuery<BranchProduct[]>({
    queryKey: ["/api/grocery/products-branch-info", branchId, infoMainCat, infoSubCat],
    queryFn: () => {
      let url = `/api/grocery/products/${branchId}?`;
      if (infoMainCat) url += `mainCategoryId=${infoMainCat}&`;
      if (infoSubCat) url += `subCategoryId=${infoSubCat}`;
      return apiCall(url);
    },
    enabled: !!branchId,
  });

  const loadProductData = (p: BranchProduct) => {
    const baseData: Record<string, string> = {
      allergyAdvice: p.allergyAdvice || "", productMarketing: p.productMarketing || "",
      description: p.description || "", features: p.features || "", lifestyle: p.lifestyle || "",
      ingredients: p.ingredients || "", calculatedNutrition: p.calculatedNutrition || "",
      nutritionalClaims: p.nutritionalClaims || "", storageUsage: p.storageUsage || "",
      storageConditions: (p as any).storageConditions || "", storageType: p.storageType || "",
      country: p.country || "", companyName: p.companyName || "",
      companyAddress: p.companyAddress || "", manufacturer: p.manufacturer || "",
      moreInformation: p.moreInformation || "", nutrition: p.nutrition || "", disclaimer: p.disclaimer || "",
    };
    setFormData(baseData);
    setHiddenFields(new Set());
    setTaskMode(false);
    setSavedSuccess(false);
    setCustomSections([]);
  };

  useEffect(() => {
    if (selectedProduct) {
      const p = products.find((pr: BranchProduct) => pr.id === selectedProduct);
      if (p) loadProductData(p);
    }
  }, [selectedProduct]);

  const infoFields = [
    { key: "allergyAdvice", label: "Allergy Advice", icon: AlertTriangle, color: "#ef4444" },
    { key: "productMarketing", label: "Product Marketing", icon: Megaphone, color: "#8b5cf6" },
    { key: "description", label: "Description", icon: FileText, color: "#3b82f6" },
    { key: "features", label: "Features", icon: ListChecks, color: "#10b981" },
    { key: "lifestyle", label: "Life Style", icon: Leaf, color: "#22c55e" },
    { key: "ingredients", label: "Ingredients", icon: Apple, color: "#f97316" },
    { key: "calculatedNutrition", label: "Calculated Nutrition", icon: Calculator, color: "#6366f1" },
    { key: "nutritionalClaims", label: "Nutritional Claims", icon: Award, color: "#eab308" },
    { key: "storageUsage", label: "Storage And Usage Statements", icon: Thermometer, color: "#14b8a6" },
    { key: "storageConditions", label: "Storage Conditions", icon: Thermometer, color: "#0d9488" },
    { key: "storageType", label: "Storage Type", icon: Package, color: "#64748b" },
    { key: "country", label: "Country", icon: MapPinIcon, color: "#06b6d4" },
    { key: "companyName", label: "Company Name", icon: Building2, color: "#7c3aed" },
    { key: "companyAddress", label: "Company Address", icon: MapPinIcon, color: "#d946ef" },
    { key: "manufacturer", label: "Manufacturer", icon: Factory, color: "#78716c" },
    { key: "moreInformation", label: "More Information", icon: Info, color: "#0ea5e9" },
    { key: "nutrition", label: "Nutrition", icon: Apple, color: "#16a34a" },
    { key: "disclaimer", label: "Disclaimer", icon: AlertTriangle, color: "#f43f5e" },
  ];

  const allFields = [
    ...infoFields,
    ...customSections.map(c => ({ key: c.key, label: c.label, icon: FileText, color: "#9333ea" })),
  ];

  const addCustomSection = () => {
    const name = newSectionName.trim();
    if (!name) return;
    const key = "custom_" + name.toLowerCase().replace(/[^a-z0-9]+/g, "_");
    if (customSections.some(c => c.key === key) || infoFields.some(f => f.key === key)) {
      toast({ title: "Already exists", description: `A section named "${name}" already exists.`, variant: "destructive" });
      return;
    }
    setCustomSections(prev => [...prev, { key, label: name }]);
    setFormData(prev => ({ ...prev, [key]: "" }));
    setNewSectionName("");
  };

  const removeCustomSection = (key: string) => {
    setCustomSections(prev => prev.filter(c => c.key !== key));
    setFormData(prev => { const n = { ...prev }; delete n[key]; return n; });
  };

  const saveProductInfo = async () => {
    if (!selectedProduct) return;
    setSaving(true);
    try {
      const saveData: Record<string, string | null> = {};
      for (const [k, v] of Object.entries(formData)) {
        if (k.startsWith("custom_")) continue;
        saveData[k] = v.trim() || null;
      }
      const customData = customSections
        .filter(c => formData[c.key]?.trim())
        .map(c => `${c.label}:\n${formData[c.key].trim()}`)
        .join("\n\n");
      if (customData) {
        saveData.moreInformation = [saveData.moreInformation, customData].filter(Boolean).join("\n\n");
      }
      const res = await fetch(`/api/grocery/products/${selectedProduct}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(saveData),
      });
      if (!res.ok) throw new Error("Save failed");
      qc.invalidateQueries({ queryKey: ["/api/grocery/products"] });
      qc.invalidateQueries({ queryKey: ["/api/grocery/products-branch-info"] });
      setSavedSuccess(true);
      toast({ title: "Saved!", description: "Product information updated." });
      setCustomSections([]);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (e) {
      toast({ title: "Error", description: "Failed to save.", variant: "destructive" });
    }
    setSaving(false);
  };


  const copyAllInfo = () => {
    const data: Record<string, string> = {};
    for (const f of infoFields) {
      if (formData[f.key]) data[f.key] = formData[f.key];
    }
    (window as any).__copiedProductInfo = data;
    setCopiedFlag(true);
  };

  const pasteAllInfo = () => {
    const data = (window as any).__copiedProductInfo;
    if (!data || Object.keys(data).length === 0) return;
    setFormData(prev => ({ ...prev, ...data }));
  };

  const darkCard = "rounded-2xl overflow-hidden";
  const darkCardBg = { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #4facfe, #00f2fe)" }}>
          <FileText className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white" data-testid="text-branch-product-info-title">Information Product</h2>
          <p className="text-sm text-white/50">Select a product and paste detailed information</p>
        </div>
      </div>

      <div className={darkCard} style={darkCardBg}>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold mb-1.5 block text-white/70">Main Category</label>
              <Select value={infoMainCat} onValueChange={(v) => { setInfoMainCat(v); setInfoSubCat(""); setSelectedProduct(""); }}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white" data-testid="select-branch-info-main-cat"><SelectValue placeholder="Select Category" /></SelectTrigger>
                <SelectContent>{mainCats.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold mb-1.5 block text-white/70">Sub Category</label>
              <Select value={infoSubCat} onValueChange={(v) => { setInfoSubCat(v); setSelectedProduct(""); }} disabled={!infoMainCat}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white" data-testid="select-branch-info-sub-cat"><SelectValue placeholder="Select Sub Category" /></SelectTrigger>
                <SelectContent>{subCats.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold mb-1.5 block text-white/70">Product</label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct} disabled={!branchId}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white" data-testid="select-branch-info-product"><SelectValue placeholder="Select Product" /></SelectTrigger>
                <SelectContent>{products.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {selectedProduct ? (
        <div className="space-y-3">
          {(() => {
            const currentProduct = products.find((p: BranchProduct) => p.id === selectedProduct);
            if (!currentProduct) return null;
            return (
              <div className={darkCard} style={darkCardBg}>
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: currentProduct.isAvailable ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)" }}>
                      {currentProduct.isAvailable ? <Eye className="h-4 w-4 text-green-400" /> : <XCircle className="h-4 w-4 text-red-400" />}
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-white">Product Availability</span>
                      <p className="text-xs text-white/50">{currentProduct.isAvailable ? "Available in store" : "Marked as Sold / Unavailable"}</p>
                    </div>
                  </div>
                  <Switch
                    checked={currentProduct.isAvailable}
                    onCheckedChange={async (checked) => {
                      await fetch(`/api/grocery/products/${selectedProduct}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ isAvailable: checked }),
                      });
                      qc.invalidateQueries({ queryKey: ["/api/grocery/products-branch-info"] });
                      qc.invalidateQueries({ queryKey: ["/api/grocery/products"] });
                    }}
                    data-testid="switch-product-availability"
                  />
                </div>
              </div>
            );
          })()}
          <div className="flex gap-2">
            <button onClick={copyAllInfo} className="px-4 h-12 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all hover:shadow-xl" style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }} data-testid="button-copy-info-branch">
              <Clipboard className="h-4 w-4" /> {copiedFlag ? "Copied!" : "Copy"}
            </button>
            <button onClick={pasteAllInfo} disabled={!(window as any).__copiedProductInfo} className="px-4 h-12 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all hover:shadow-xl disabled:opacity-40" style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }} data-testid="button-paste-info-branch">
              <ClipboardPaste className="h-4 w-4" /> Paste
            </button>
          </div>
          {taskMode && (
            <div className={darkCard} style={{ ...darkCardBg, borderColor: "rgba(79,172,254,0.3)" }}>
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-semibold text-cyan-300">Click a field below to open it and add information:</label>
                  <button onClick={() => { setTaskMode(false); setHiddenFields(new Set()); }} className="text-xs text-white/50 hover:text-white px-2 py-1 rounded-lg bg-white/10" data-testid="button-exit-task-mode">
                    Show All Fields
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {allFields.filter(f => hiddenFields.has(f.key)).map(field => (
                    <button key={field.key} onClick={() => { setHiddenFields(prev => { const n = new Set(prev); n.delete(field.key); return n; }); }} className="px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-all hover:scale-105" style={{ background: field.color + "20", border: `1px solid ${field.color}40`, color: field.color }} data-testid={`button-task-${field.key}`}>
                      <field.icon className="h-3.5 w-3.5" />
                      {field.label}
                      <Plus className="h-3 w-3 opacity-60" />
                    </button>
                  ))}
                </div>
                {allFields.filter(f => hiddenFields.has(f.key)).length === 0 && (
                  <p className="text-white/40 text-sm">All fields are visible.</p>
                )}
              </div>
            </div>
          )}

          {allFields.map(field => {
            if (hiddenFields.has(field.key)) return null;
            return (
              <div key={field.key} className={darkCard} style={darkCardBg}>
                <div className="flex items-center justify-between gap-3 p-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: field.color + "30" }}>
                      <field.icon className="h-4 w-4" style={{ color: field.color }} />
                    </div>
                    <label className="font-semibold text-sm" style={{ color: field.color }}>{field.label}</label>
                  </div>
                  {!isStaffLogin && (
                  <button onClick={() => { if (field.key.startsWith("custom_")) { removeCustomSection(field.key); } else { setFormData(prev => ({ ...prev, [field.key]: "" })); setHiddenFields(prev => new Set(prev).add(field.key)); } }} className="h-8 w-8 rounded-full flex items-center justify-center transition-colors" style={{ border: "2px solid rgba(239,68,68,0.4)", color: "#ef4444" }} data-testid={`button-delete-branch-${field.key}`}>
                    <X className="h-4 w-4" />
                  </button>
                  )}
                </div>
                <div className="p-4">
                  {field.key === "country" ? (
                    <div className="space-y-3">
                      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
                        <table className="w-full text-sm">
                          <tbody>
                            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                              <td className="px-4 py-3 text-white/50 font-medium w-[160px]">Country of Origin</td>
                              <td className="px-4 py-3">
                                <Input
                                  value={formData.country?.replace(/^Country of Origin\s*/, "") || ""}
                                  onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value ? `Country of Origin\t${e.target.value}` : "" }))}
                                  placeholder="e.g. United Kingdom"
                                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-8 text-sm"
                                  data-testid="input-country-origin"
                                />
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <p className="text-white/30 text-xs">This will display as a table row in the store</p>
                    </div>
                  ) : (
                    <Textarea
                      value={formData[field.key]}
                      onChange={(e) => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                      placeholder={`Paste ${field.label} information here...`}
                      rows={3}
                      className="resize-y bg-white/5 border-white/10 text-white placeholder:text-white/30"
                      data-testid={`textarea-branch-info-${field.key}`}
                    />
                  )}
                </div>
              </div>
            );
          })}

          <div className={darkCard} style={{ ...darkCardBg, borderColor: "rgba(147,51,234,0.3)" }}>
            <div className="p-4">
              <label className="text-xs font-semibold mb-3 block text-purple-300">Add Custom Section:</label>
              <div className="flex gap-2">
                <Input
                  value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value)}
                  placeholder="Enter section name..."
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 text-sm"
                  onKeyDown={(e) => { if (e.key === "Enter") addCustomSection(); }}
                  data-testid="input-branch-custom-section-name"
                />
                <button
                  onClick={addCustomSection}
                  disabled={!newSectionName.trim()}
                  className="px-4 h-10 rounded-xl text-sm font-bold text-white flex items-center gap-1.5 transition-all hover:shadow-xl disabled:opacity-40 shrink-0"
                  style={{ background: "linear-gradient(135deg, #9333ea, #7c3aed)" }}
                  data-testid="button-branch-add-custom-section"
                >
                  <Plus className="h-4 w-4" /> Add
                </button>
              </div>
            </div>
          </div>

          <button onClick={saveProductInfo} disabled={saving} className="w-full h-14 rounded-2xl text-lg font-bold text-white flex items-center justify-center gap-2 shadow-lg transition-all hover:shadow-xl disabled:opacity-50" style={{ background: savedSuccess ? "linear-gradient(135deg, #10b981, #059669)" : "linear-gradient(135deg, #43e97b, #38f9d7)", boxShadow: "0 4px 20px rgba(67,233,123,0.3)" }} data-testid="button-save-branch-product-info">
            {savedSuccess ? <CheckCircle className="h-5 w-5" /> : <Save className="h-5 w-5" />} {saving ? "Saving..." : savedSuccess ? "Saved Successfully!" : "Save Product Information"}
          </button>
          {!taskMode ? (
          <button onClick={() => { setTaskMode(true); setHiddenFields(new Set(infoFields.map(f => f.key))); }} className="w-full h-12 rounded-2xl text-base font-bold text-white flex items-center justify-center gap-2 shadow-lg transition-all hover:shadow-xl" style={{ background: "linear-gradient(135deg, #4facfe, #00f2fe)", boxShadow: "0 4px 20px rgba(79,172,254,0.3)" }} data-testid="button-new-task">
            <Plus className="h-5 w-5" /> New Task (Select Fields)
          </button>
          ) : (
          <button onClick={() => { setTaskMode(false); setHiddenFields(new Set()); }} className="w-full h-12 rounded-2xl text-base font-bold text-white flex items-center justify-center gap-2 shadow-lg transition-all hover:shadow-xl" style={{ background: "linear-gradient(135deg, #f97316, #ef4444)", boxShadow: "0 4px 20px rgba(249,115,22,0.3)" }} data-testid="button-exit-task">
            <Eye className="h-5 w-5" /> Show All Fields
          </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4" style={{ background: "rgba(79,172,254,0.15)" }}>
            <FileText className="h-10 w-10" style={{ color: "#4facfe" }} />
          </div>
          <h3 className="text-lg font-semibold mb-2 text-white">Select a Product</h3>
          <p className="text-white/50 max-w-md">Choose a category and product above to start adding detailed product information.</p>
        </div>
      )}
    </div>
  );
}

type BranchManagedProduct = {
  id: string; branchId: string; mainCategoryId: string; subCategoryId: string | null;
  subSubCategoryId: string | null;
  name: string; description: string | null; image1: string | null; image2: string | null;
  wasPrice: string | null; nowPrice: string; isAvailable: boolean; isFeatured: boolean;
  unit: string; weight: string | null; stockQuantity: number;
};

function BranchProductsManagerSection({ branchId, toast, qc, currency }: { branchId: string | null; toast: any; qc: any; currency: string }) {
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [selectedSubCatId, setSelectedSubCatId] = useState<string | null>(null);
  const [selectedSubSubCatId, setSelectedSubSubCatId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<{ description: string; nowPrice: string; wasPrice: string; image1: string }>({ description: "", nowPrice: "", wasPrice: "", image1: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data: products = [] } = useQuery<BranchManagedProduct[]>({
    queryKey: ["/api/grocery/products", branchId],
    queryFn: () => apiCall(`/api/grocery/products/${branchId}`),
    enabled: !!branchId,
  });

  const { data: mainCats = [] } = useQuery<any[]>({
    queryKey: ["/api/grocery/main-categories", branchId],
    queryFn: () => apiCall(`/api/grocery/main-categories/${branchId}`),
    enabled: !!branchId,
  });

  const { data: subCats = [] } = useQuery<any[]>({
    queryKey: ["/api/grocery/sub-categories", selectedCatId],
    queryFn: () => apiCall(`/api/grocery/sub-categories/${selectedCatId}`),
    enabled: !!selectedCatId,
  });

  const { data: subSubCats = [] } = useQuery<any[]>({
    queryKey: ["/api/grocery/sub-sub-categories", selectedSubCatId],
    queryFn: () => apiCall(`/api/grocery/sub-sub-categories/${selectedSubCatId}`),
    enabled: !!selectedSubCatId && selectedSubCatId !== "__all__",
  });

  const selectedCat = mainCats.find((c: any) => c.id === selectedCatId);
  const selectedSubCat = subCats.find((c: any) => c.id === selectedSubCatId);
  const selectedSubSubCat = subSubCats.find((c: any) => c.id === selectedSubSubCatId);
  const hasSubSubCats = subSubCats.length > 0;

  const filtered = products.filter((p: BranchManagedProduct) => {
    if (!selectedCatId) return false;
    const matchCat = p.mainCategoryId === selectedCatId;
    const matchSub = !selectedSubCatId || selectedSubCatId === "__all__" || p.subCategoryId === selectedSubCatId;
    const matchSubSub = !selectedSubSubCatId || selectedSubSubCatId === "__all__" || p.subSubCategoryId === selectedSubSubCatId;
    const matchSearch = !searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSub && matchSubSub && matchSearch;
  });

  const catProductCounts = mainCats.reduce((acc: Record<string, number>, c: any) => {
    acc[c.id] = products.filter((p: BranchManagedProduct) => p.mainCategoryId === c.id).length;
    return acc;
  }, {});

  const subCatProductCounts = subCats.reduce((acc: Record<string, number>, c: any) => {
    acc[c.id] = products.filter((p: BranchManagedProduct) => p.subCategoryId === c.id).length;
    return acc;
  }, {});

  const subSubCatProductCounts = subSubCats.reduce((acc: Record<string, number>, c: any) => {
    acc[c.id] = products.filter((p: BranchManagedProduct) => p.subSubCategoryId === c.id).length;
    return acc;
  }, {});

  const startEdit = (p: BranchManagedProduct) => {
    setEditingId(p.id);
    setEditData({
      description: p.description || "",
      nowPrice: p.nowPrice,
      wasPrice: p.wasPrice || "",
      image1: p.image1 || "",
    });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const cleanPrice = (v: string) => v.replace(/[^0-9.]/g, '');
    const cleanedNowPrice = cleanPrice(editData.nowPrice);
    const cleanedWasPrice = cleanPrice(editData.wasPrice);
    if (!cleanedNowPrice || isNaN(parseFloat(cleanedNowPrice)) || parseFloat(cleanedNowPrice) < 0) {
      toast({ title: "Please enter a valid price", variant: "destructive" });
      return;
    }
    if (cleanedWasPrice && (isNaN(parseFloat(cleanedWasPrice)) || parseFloat(cleanedWasPrice) < 0)) {
      toast({ title: "Please enter a valid was price (numbers only, no £ symbol)", variant: "destructive" });
      return;
    }
    try {
      await apiCall(`/api/grocery/products/${editingId}`, "PATCH", {
        description: editData.description || null,
        nowPrice: cleanedNowPrice,
        wasPrice: cleanedWasPrice || null,
        image1: editData.image1 || null,
      });
      qc.invalidateQueries({ queryKey: ["/api/grocery/products", branchId] });
      toast({ title: "Product updated!" });
      setEditingId(null);
    } catch {
      toast({ title: "Failed to update", variant: "destructive" });
    }
  };

  const toggleAvailability = async (p: BranchManagedProduct) => {
    try {
      await apiCall(`/api/grocery/products/${p.id}`, "PATCH", { isAvailable: !p.isAvailable });
      qc.invalidateQueries({ queryKey: ["/api/grocery/products", branchId] });
      toast({ title: p.isAvailable ? "Product turned OFF - hidden from store" : "Product turned ON - visible in store" });
    } catch {
      toast({ title: "Failed to toggle", variant: "destructive" });
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      await apiCall(`/api/grocery/products/${id}`, "DELETE");
      qc.invalidateQueries({ queryKey: ["/api/grocery/products", branchId] });
      toast({ title: "Product deleted" });
      setDeleteConfirm(null);
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  };

  const handleImagePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
            setEditData(prev => ({ ...prev, image1: reader.result as string }));
          };
          reader.readAsDataURL(file);
        }
        break;
      }
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #667eea, #764ba2)" }}>
          <Store className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white" data-testid="text-branch-settings-title">Branch Settings</h2>
          <p className="text-white/50 text-sm">Manage your products - edit, toggle visibility, or delete</p>
        </div>
        <div className="ml-auto text-sm text-white/40">{products.length} total products</div>
      </div>

      {(selectedCatId || selectedSubCatId) && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <button
            onClick={() => { setSelectedCatId(null); setSelectedSubCatId(null); setSelectedSubSubCatId(null); setSearchTerm(""); setEditingId(null); }}
            className="text-sm px-3 py-1.5 rounded-lg bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-all"
            data-testid="button-back-all-categories"
          >
            All Categories
          </button>
          {selectedCatId && (
            <>
              <ChevronRight className="h-4 w-4 text-white/30" />
              <button
                onClick={() => { setSelectedSubCatId(null); setSelectedSubSubCatId(null); setSearchTerm(""); setEditingId(null); }}
                className={`text-sm px-3 py-1.5 rounded-lg transition-all ${!selectedSubCatId ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"}`}
                data-testid="button-breadcrumb-category"
              >
                {selectedCat?.name || "Category"}
              </button>
            </>
          )}
          {selectedSubCatId && (
            <>
              <ChevronRight className="h-4 w-4 text-white/30" />
              <button
                onClick={() => { setSelectedSubSubCatId(null); setSearchTerm(""); setEditingId(null); }}
                className={`text-sm px-3 py-1.5 rounded-lg transition-all ${!selectedSubSubCatId ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"}`}
                data-testid="button-breadcrumb-subcategory"
              >
                {selectedSubCat?.name || "Sub Category"}
              </button>
            </>
          )}
          {selectedSubSubCatId && (
            <>
              <ChevronRight className="h-4 w-4 text-white/30" />
              <span className="text-sm px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {selectedSubSubCat?.name || "Sub+Sub Category"}
              </span>
            </>
          )}
        </div>
      )}

      {!selectedCatId ? (
        <div>
          <p className="text-white/60 text-sm mb-4">Select a category to view products</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {mainCats.map((c: any) => (
              <button
                key={c.id}
                onClick={() => { setSelectedCatId(c.id); setSelectedSubCatId(null); setSelectedSubSubCatId(null); }}
                className="rounded-xl p-4 text-left transition-all hover:scale-[1.02] group"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}
                data-testid={`button-select-category-${c.id}`}
              >
                {c.image ? (
                  <img src={c.image} alt="" className="h-14 w-14 rounded-lg object-cover mb-3 border border-white/10" />
                ) : (
                  <div className="h-14 w-14 rounded-lg flex items-center justify-center mb-3" style={{ background: (c.color || "#22c55e") + "25" }}>
                    <Tag className="h-6 w-6" style={{ color: c.color || "#22c55e" }} />
                  </div>
                )}
                <h4 className="font-semibold text-white text-sm group-hover:text-emerald-300 transition-colors">{c.name}</h4>
                <p className="text-white/40 text-xs mt-1">{catProductCounts[c.id] || 0} products</p>
              </button>
            ))}
          </div>
          {mainCats.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Tag className="h-12 w-12 text-white/30 mb-3" />
              <h3 className="text-lg font-semibold text-white mb-1">No categories yet</h3>
              <p className="text-white/50">Add categories first from the Categories tab</p>
            </div>
          )}
        </div>
      ) : !selectedSubCatId ? (
        <div>
          <p className="text-white/60 text-sm mb-4">Select a sub-category or view all products in {selectedCat?.name}</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-5">
            <button
              onClick={() => setSelectedSubCatId("__all__")}
              className="rounded-xl p-4 text-left transition-all hover:scale-[1.02] group"
              style={{ background: "linear-gradient(135deg, rgba(67,233,123,0.15), rgba(56,249,215,0.15))", border: "1px solid rgba(67,233,123,0.25)" }}
              data-testid="button-view-all-products"
            >
              <div className="h-14 w-14 rounded-lg flex items-center justify-center mb-3" style={{ background: "rgba(67,233,123,0.2)" }}>
                <Package className="h-6 w-6 text-emerald-400" />
              </div>
              <h4 className="font-semibold text-emerald-300 text-sm">All Products</h4>
              <p className="text-white/40 text-xs mt-1">{catProductCounts[selectedCatId] || 0} products</p>
            </button>
            {subCats.map((c: any) => (
              <button
                key={c.id}
                onClick={() => { setSelectedSubCatId(c.id); setSelectedSubSubCatId(null); }}
                className="rounded-xl p-4 text-left transition-all hover:scale-[1.02] group"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}
                data-testid={`button-select-subcategory-${c.id}`}
              >
                {c.image ? (
                  <img src={c.image} alt="" className="h-14 w-14 rounded-lg object-cover mb-3 border border-white/10" />
                ) : (
                  <div className="h-14 w-14 rounded-lg flex items-center justify-center mb-3" style={{ background: "rgba(79,172,254,0.2)" }}>
                    <Layers className="h-6 w-6 text-blue-400" />
                  </div>
                )}
                <h4 className="font-semibold text-white text-sm group-hover:text-blue-300 transition-colors">{c.name}</h4>
                <p className="text-white/40 text-xs mt-1">{subCatProductCounts[c.id] || 0} products</p>
              </button>
            ))}
          </div>
          {subCats.length === 0 && (
            <div className="text-center py-8">
              <p className="text-white/40 text-sm">No sub-categories. Click "All Products" to see products in this category.</p>
            </div>
          )}
        </div>
      ) : selectedSubCatId !== "__all__" && hasSubSubCats && !selectedSubSubCatId ? (
        <div>
          <p className="text-white/60 text-sm mb-4">Select a sub+sub category or view all products in {selectedSubCat?.name}</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-5">
            <button
              onClick={() => setSelectedSubSubCatId("__all__")}
              className="rounded-xl p-4 text-left transition-all hover:scale-[1.02] group"
              style={{ background: "linear-gradient(135deg, rgba(67,233,123,0.15), rgba(56,249,215,0.15))", border: "1px solid rgba(67,233,123,0.25)" }}
              data-testid="button-view-all-sub-products"
            >
              <div className="h-14 w-14 rounded-lg flex items-center justify-center mb-3" style={{ background: "rgba(67,233,123,0.2)" }}>
                <Package className="h-6 w-6 text-emerald-400" />
              </div>
              <h4 className="font-semibold text-emerald-300 text-sm">All Products</h4>
              <p className="text-white/40 text-xs mt-1">{subCatProductCounts[selectedSubCatId!] || 0} products</p>
            </button>
            {subSubCats.map((c: any) => (
              <button
                key={c.id}
                onClick={() => setSelectedSubSubCatId(c.id)}
                className="rounded-xl p-4 text-left transition-all hover:scale-[1.02] group"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}
                data-testid={`button-select-subsubcategory-${c.id}`}
              >
                {c.image && /\.(mp4|webm|mov)(\?|$)/i.test(c.image) ? (
                  <video src={c.image} className="h-14 w-14 rounded-lg object-cover mb-3 border border-white/10" muted autoPlay loop playsInline />
                ) : c.image ? (
                  <img src={c.image} alt="" className="h-14 w-14 rounded-lg object-cover mb-3 border border-white/10" />
                ) : (
                  <div className="h-14 w-14 rounded-lg flex items-center justify-center mb-3" style={{ background: "rgba(168,85,247,0.2)" }}>
                    <Layers className="h-6 w-6 text-purple-400" />
                  </div>
                )}
                <h4 className="font-semibold text-white text-sm group-hover:text-purple-300 transition-colors">{c.name}</h4>
                <p className="text-white/40 text-xs mt-1">{subSubCatProductCounts[c.id] || 0} products</p>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <div className="flex flex-wrap gap-3 mb-5">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 rounded-xl"
                data-testid="input-branch-product-search"
              />
            </div>
            <div className="text-sm text-white/40 flex items-center">{filtered.length} product{filtered.length !== 1 ? "s" : ""}</div>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Package className="h-12 w-12 text-white/30 mb-3" />
              <h3 className="text-lg font-semibold text-white mb-1">No products found</h3>
              <p className="text-white/50">Try adjusting your search or select a different sub-category</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((p: BranchManagedProduct) => (
                <div
                  key={p.id}
                  className="rounded-xl p-4 transition-all"
                  style={{
                    background: p.isAvailable ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${p.isAvailable ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.06)"}`,
                    opacity: p.isAvailable ? 1 : 0.6,
                  }}
                  data-testid={`card-branch-product-${p.id}`}
                >
                  {editingId === p.id ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-white text-lg">{p.name}</h4>
                        <Badge className="bg-yellow-500/20 text-yellow-300 text-xs">Editing</Badge>
                      </div>

                      <div>
                        <Label className="text-white/70 text-xs mb-1 block">Description</Label>
                        <Textarea
                          value={editData.description}
                          onChange={e => setEditData(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Product description..."
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/40 rounded-xl min-h-[80px]"
                          data-testid="input-edit-description"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-white/70 text-xs mb-1 block">Price ({currency})</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={editData.nowPrice}
                            onChange={e => setEditData(prev => ({ ...prev, nowPrice: e.target.value.replace(/[^0-9.]/g, '') }))}
                            className="bg-white/10 border-white/20 text-white rounded-xl"
                            data-testid="input-edit-price"
                          />
                        </div>
                        <div>
                          <Label className="text-white/70 text-xs mb-1 block">Was Price ({currency})</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={editData.wasPrice}
                            onChange={e => setEditData(prev => ({ ...prev, wasPrice: e.target.value.replace(/[^0-9.]/g, '') }))}
                            placeholder="Optional"
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/40 rounded-xl"
                            data-testid="input-edit-was-price"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-white/70 text-xs mb-1 block">Image (paste or enter URL)</Label>
                        <div className="flex gap-2">
                          <Input
                            value={editData.image1}
                            onChange={e => setEditData(prev => ({ ...prev, image1: e.target.value }))}
                            onPaste={handleImagePaste}
                            placeholder="Paste image or enter URL..."
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/40 rounded-xl flex-1"
                            data-testid="input-edit-image"
                          />
                        </div>
                        {editData.image1 && (
                          <div className="mt-2 relative inline-block">
                            <img src={editData.image1} alt="" className="h-20 w-20 rounded-lg object-cover border border-white/20" />
                            <button onClick={() => setEditData(prev => ({ ...prev, image1: "" }))} className="absolute -top-2 -right-2 bg-red-500 rounded-full p-0.5">
                              <X className="h-3 w-3 text-white" />
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button onClick={saveEdit} className="gap-2 rounded-xl text-white flex-1" style={{ background: "linear-gradient(135deg, #43e97b, #38f9d7)" }} data-testid="button-save-edit">
                          <Save className="h-4 w-4" /> Save Changes
                        </Button>
                        <Button onClick={() => setEditingId(null)} variant="ghost" className="text-white/60 rounded-xl" data-testid="button-cancel-edit">
                          <X className="h-4 w-4 mr-1" /> Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      {p.image1 ? (
                        <img src={p.image1} alt="" className="h-16 w-16 rounded-xl object-cover border border-white/10 shrink-0" />
                      ) : (
                        <div className="h-16 w-16 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(255,255,255,0.08)" }}>
                          <Image className="h-6 w-6 text-white/30" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-white truncate" data-testid={`text-product-name-${p.id}`}>{p.name}</h4>
                        {p.description && (
                          <p className="text-white/50 text-sm truncate mt-0.5" data-testid={`text-product-desc-${p.id}`}>{p.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          {p.wasPrice && (
                            <span className="text-white/40 text-sm line-through">{currency}{parseFloat(p.wasPrice).toFixed(2)}</span>
                          )}
                          <span className="text-emerald-300 font-bold text-lg" data-testid={`text-product-price-${p.id}`}>{currency}{parseFloat(p.nowPrice).toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-2 mr-2">
                          <span className={`text-xs ${p.isAvailable ? "text-emerald-300" : "text-red-400"}`}>
                            {p.isAvailable ? "ON" : "OFF"}
                          </span>
                          <Switch
                            checked={p.isAvailable}
                            onCheckedChange={() => toggleAvailability(p)}
                            data-testid={`switch-product-${p.id}`}
                          />
                        </div>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEdit(p)}
                          className="text-white/60 hover:text-white hover:bg-white/10 rounded-lg h-9 w-9 p-0"
                          data-testid={`button-edit-product-${p.id}`}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>

                        {deleteConfirm === p.id ? (
                          <div className="flex gap-1">
                            <Button size="sm" onClick={() => deleteProduct(p.id)} className="bg-red-500 hover:bg-red-600 text-white rounded-lg h-9 px-3 text-xs" data-testid={`button-confirm-delete-${p.id}`}>
                              Yes
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setDeleteConfirm(null)} className="text-white/60 rounded-lg h-9 px-2 text-xs" data-testid={`button-cancel-delete-${p.id}`}>
                              No
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteConfirm(p.id)}
                            className="text-red-400/60 hover:text-red-400 hover:bg-red-500/10 rounded-lg h-9 w-9 p-0"
                            data-testid={`button-delete-product-${p.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
