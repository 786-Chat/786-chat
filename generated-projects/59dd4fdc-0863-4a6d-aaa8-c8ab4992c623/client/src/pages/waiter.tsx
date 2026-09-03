import { useState, useMemo, useCallback, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRestaurantBySlug, getMenuItems } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, Trash2, Plus, Minus, Users, ChefHat, Search, ShoppingCart, Bell, Home, Utensils, Clock, MapPin, User, Tablet, DoorOpen, LogOut, Banknote, CreditCard } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { motion, AnimatePresence } from "framer-motion";
import { getCurrencySymbol, type MenuItem, type Restaurant, type ExtraTopping, type TableSession, type WaiterTablet } from "@shared/schema";
import { InstallPrompt } from "@/components/install-prompt";

const CATEGORY_COLORS = [
  "from-rose-500 to-pink-600", "from-orange-500 to-amber-600", "from-emerald-500 to-green-600",
  "from-cyan-500 to-blue-600", "from-violet-500 to-purple-600", "from-fuchsia-500 to-pink-600",
  "from-red-500 to-rose-600", "from-amber-500 to-yellow-600", "from-teal-500 to-cyan-600",
  "from-indigo-500 to-blue-600", "from-lime-500 to-green-600", "from-sky-500 to-indigo-600"
];

interface SelectedTopping {
  id: string;
  name: string;
  price: number;
}

interface CartItem {
  menuItemId: string;
  cartItemId: string;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  image?: string;
  toppings: SelectedTopping[];
}

interface GuestCounts {
  adults: number;
  kids: number;
  children: number;
}

export default function WaiterPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const queryClient = useQueryClient();

  // Setup state
  const [setupStep, setSetupStep] = useState<"tablet" | "waiter" | "table" | "ordering">("tablet");
  const [selectedTablet, setSelectedTablet] = useState<number | null>(null);
  const [claimedTabletId, setClaimedTabletId] = useState<string | null>(null);
  const [waiterName, setWaiterName] = useState("");
  const [waiterPin, setWaiterPin] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [reconnectTablet, setReconnectTablet] = useState<{ id: string; number: number; waiterName: string } | null>(null);
  const [reconnectPin, setReconnectPin] = useState("");
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [orderCount, setOrderCount] = useState(0);
  const [tableNumber, setTableNumber] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [guestCounts, setGuestCounts] = useState<GuestCounts>({ adults: 1, kids: 0, children: 0 });
  const [currentSession, setCurrentSession] = useState<TableSession | null>(null);

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showToppingModal, setShowToppingModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [selectedToppings, setSelectedToppings] = useState<SelectedTopping[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [orderReady, setOrderReady] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "account">("cash");

  const { data: restaurant, isLoading: loadingRestaurant } = useQuery<Restaurant>({
    queryKey: ["/api/restaurants", slug],
    queryFn: () => getRestaurantBySlug(slug!),
    enabled: !!slug,
  });

  const restaurantId = restaurant?.id;
  const currencySymbol = getCurrencySymbol(restaurant?.currency || "GBP");

  const { data: menuItems = [], isLoading: loadingMenu } = useQuery<MenuItem[]>({
    queryKey: ["/api/menu", restaurantId],
    queryFn: () => getMenuItems(restaurantId!),
    enabled: !!restaurantId,
  });

  const { data: extraToppings = [] } = useQuery<ExtraTopping[]>({
    queryKey: ["/api/extra-toppings", restaurantId],
    queryFn: async () => {
      const res = await fetch(`/api/restaurants/${restaurantId}/extra-toppings`);
      return res.json();
    },
    enabled: !!restaurantId,
  });

  // Fetch database categories for proper name display
  const { data: dbCategories = [] } = useQuery<{ id: string; dbId?: string; slug: string; name: string; icon: string }[]>({
    queryKey: ["/api/menu-categories", restaurantId],
    queryFn: async () => {
      const response = await fetch(`/api/menu-categories?restaurantId=${restaurantId}`);
      return response.json();
    },
    enabled: !!restaurantId,
  });

  // Topping groups (Goes well with, Add a Drink, etc.)
  const { data: toppingGroups = [] } = useQuery({
    queryKey: ["/api/topping-groups", restaurantId],
    queryFn: async () => {
      const response = await fetch(`/api/restaurants/${restaurantId}/topping-groups`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!restaurantId,
  });

  const { data: toppingOptions = [] } = useQuery({
    queryKey: ["/api/topping-group-options", restaurantId],
    queryFn: async () => {
      const response = await fetch(`/api/topping-group-options?restaurantId=${restaurantId}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!restaurantId,
  });

  // Fetch waiter tablets to see which are in use
  const { data: waiterTablets = [], refetch: refetchTablets } = useQuery<WaiterTablet[]>({
    queryKey: ["/api/waiter-tablets", restaurantId],
    queryFn: async () => {
      // First seed tablets to ensure we have 10
      await fetch(`/api/restaurants/${restaurantId}/waiter-tablets/seed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: 10 })
      });
      const res = await fetch(`/api/restaurants/${restaurantId}/waiter-tablets`);
      return res.json();
    },
    enabled: !!restaurantId,
    refetchInterval: setupStep === "tablet" ? 5000 : false, // Refresh every 5s on tablet selection screen
  });

  // Claim tablet mutation
  const claimTabletMutation = useMutation({
    mutationFn: async ({ tabletId, name, pin }: { tabletId: string; name: string; pin: string }) => {
      const res = await fetch(`/api/restaurants/${restaurantId}/waiter-tablets/${tabletId}/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ waiterName: name, waiterPin: pin })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to claim tablet");
      }
      return res.json();
    },
    onSuccess: (tablet: WaiterTablet) => {
      setClaimedTabletId(tablet.id);
      setSessionStartTime(tablet.sessionStartedAt ? new Date(tablet.sessionStartedAt) : new Date());
      setOrderCount(tablet.orderCount || 0);
      setSetupStep("table");
      refetchTablets();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  // Register new waiter mutation
  const registerWaiterMutation = useMutation({
    mutationFn: async ({ name, pin, tabletId }: { name: string; pin: string; tabletId: string }) => {
      const res = await fetch(`/api/restaurants/${restaurantId}/waiters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, pin })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to register");
      }
      return res.json();
    },
    onSuccess: (_data, variables) => {
      toast({ title: "Registered!", description: "Now logging you in..." });
      claimTabletMutation.mutate({ tabletId: variables.tabletId, name: variables.name, pin: variables.pin });
    },
    onError: (error: Error) => {
      toast({ title: "Registration Failed", description: error.message, variant: "destructive" });
    }
  });

  // Handle reconnect to existing tablet session
  const handleReconnect = useCallback(() => {
    if (reconnectTablet && reconnectPin.length === 4) {
      setWaiterName(reconnectTablet.waiterName);
      setWaiterPin(reconnectPin);
      claimTabletMutation.mutate({ 
        tabletId: reconnectTablet.id, 
        name: reconnectTablet.waiterName, 
        pin: reconnectPin 
      });
    }
  }, [reconnectTablet, reconnectPin, claimTabletMutation]);

  // Handle new waiter registration from tablet page
  const handleRegisterFromTabletPage = useCallback(() => {
    if (waiterName.trim() && waiterPin.length === 4 && selectedTablet && claimedTabletId) {
      registerWaiterMutation.mutate({ name: waiterName.trim(), pin: waiterPin.trim(), tabletId: claimedTabletId });
    }
  }, [waiterName, waiterPin, selectedTablet, claimedTabletId, registerWaiterMutation]);

  // Release tablet mutation (logout)
  const releaseTabletMutation = useMutation({
    mutationFn: async (tabletId: string) => {
      const res = await fetch(`/api/restaurants/${restaurantId}/waiter-tablets/${tabletId}/release`, {
        method: "POST"
      });
      if (!res.ok) throw new Error("Failed to release tablet");
      return res.json();
    },
    onSuccess: () => {
      setSetupStep("tablet");
      setSelectedTablet(null);
      setClaimedTabletId(null);
      setWaiterName("");
      setWaiterPin("");
      setSessionStartTime(null);
      setOrderCount(0);
      setTableNumber("");
      setRoomNumber("");
      setGuestCounts({ adults: 1, kids: 0, children: 0 });
      setCart([]);
      setCurrentSession(null);
      refetchTablets();
      toast({ title: "Logged out", description: "Tablet released successfully" });
    }
  });

  const handleLogout = useCallback(() => {
    if (claimedTabletId) {
      releaseTabletMutation.mutate(claimedTabletId);
    }
  }, [claimedTabletId, releaseTabletMutation]);

  // Timer tick for updating session duration display
  const [durationTick, setDurationTick] = useState(0);
  
  useEffect(() => {
    if (!sessionStartTime) return;
    
    const interval = setInterval(() => {
      setDurationTick(t => t + 1);
    }, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, [sessionStartTime]);

  // Format session duration
  const formatDuration = useCallback((start: Date) => {
    // durationTick is included to force re-render
    void durationTick;
    const now = new Date();
    const diff = Math.floor((now.getTime() - start.getTime()) / 1000);
    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }, [durationTick]);

  // WebSocket for real-time notifications
  useEffect(() => {
    if (!restaurantId || setupStep !== "ordering") return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws?restaurantId=${restaurantId}`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "ORDER_READY" && data.tableNumber === tableNumber) {
        setOrderReady(true);
        if (navigator.vibrate) {
          navigator.vibrate([200, 100, 200, 100, 200]);
        }
      }
    };

    return () => ws.close();
  }, [restaurantId, setupStep, tableNumber]);

  const categories = useMemo(() => {
    const usedCategoryIds = new Set<string>();
    menuItems.forEach(item => usedCategoryIds.add(item.category));
    
    // Map database categories by both ID and slug for flexibility
    const categoryMapById: Record<string, { id: string; name: string; icon: string }> = {};
    const categoryMapBySlug: Record<string, { id: string; name: string; icon: string }> = {};
    const categoryMapByName: Record<string, { id: string; name: string; icon: string }> = {};
    
    dbCategories.forEach((cat) => {
      const catId = cat.dbId || cat.id || cat.slug;
      const catData = { id: catId, name: cat.name, icon: cat.icon || "🍽️" };
      categoryMapById[catId] = catData;
      categoryMapBySlug[cat.slug] = catData;
      categoryMapByName[cat.name] = catData;
    });
    
    // Return only categories that have items, with proper names from DB
    return Array.from(usedCategoryIds)
      .map(catId => {
        const found = categoryMapById[catId] || categoryMapBySlug[catId] || categoryMapByName[catId];
        return found || { id: catId, name: catId.charAt(0).toUpperCase() + catId.slice(1).replace(/-/g, ' '), icon: "🍽️" };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [menuItems, dbCategories]);

  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0].id);
    }
  }, [categories, activeCategory]);

  useEffect(() => {
    const originalManifest = document.querySelector('link[rel="manifest"]');
    const originalManifestHref = originalManifest?.getAttribute('href');
    
    const appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]:not([sizes])');
    const originalIconHref = appleTouchIcon?.getAttribute('href');
    
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    const originalThemeColor = metaThemeColor?.getAttribute('content');
    
    const appleAppTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
    const originalAppleTitle = appleAppTitle?.getAttribute('content');

    if (originalManifest) {
      originalManifest.setAttribute('href', '/manifest-waiter.json');
    }
    if (appleTouchIcon) {
      appleTouchIcon.setAttribute('href', '/icon-waiter-512.png');
    }
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', '#1e3a5f');
    }
    if (appleAppTitle) {
      appleAppTitle.setAttribute('content', 'Link24-Waiter');
    }
    
    return () => {
      if (originalManifest && originalManifestHref) {
        originalManifest.setAttribute('href', originalManifestHref);
      }
      if (appleTouchIcon && originalIconHref) {
        appleTouchIcon.setAttribute('href', originalIconHref);
      }
      if (metaThemeColor && originalThemeColor) {
        metaThemeColor.setAttribute('content', originalThemeColor);
      }
      if (appleAppTitle && originalAppleTitle) {
        appleAppTitle.setAttribute('content', originalAppleTitle);
      }
    };
  }, []);

  const filteredMenuItems = useMemo(() => {
    let items = menuItems.filter(item => item.available !== false);
    if (activeCategory) {
      const activeCat = categories.find(c => c.id === activeCategory);
      items = items.filter(item => 
        item.category === activeCategory || 
        item.category === activeCat?.name ||
        item.category === (activeCat as any)?.slug
      );
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = items.filter(item => 
        item.name.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query)
      );
    }
    return items;
  }, [menuItems, activeCategory, searchQuery, categories]);

  const handleItemClick = useCallback((item: MenuItem) => {
    setSelectedItem(item);
    setSelectedToppings([]);
    setShowToppingModal(true);
  }, []);

  const toggleTopping = useCallback((topping: ExtraTopping) => {
    setSelectedToppings(prev => {
      const exists = prev.find(t => t.id === topping.id);
      if (exists) return prev.filter(t => t.id !== topping.id);
      return [...prev, { id: topping.id, name: topping.name, price: Number(topping.price) }];
    });
  }, []);

  const confirmAddToCart = useCallback(() => {
    if (!selectedItem) return;
    const cartItemId = `${selectedItem.id}-${Date.now()}`;
    const newItem: CartItem = {
      menuItemId: selectedItem.id,
      cartItemId,
      name: selectedItem.name,
      description: selectedItem.description || undefined,
      price: Number(selectedItem.price),
      quantity: 1,
      image: selectedItem.image || undefined,
      toppings: selectedToppings,
    };
    setCart(prev => [...prev, newItem]);
    setShowToppingModal(false);
    setSelectedItem(null);
    setSelectedToppings([]);
  }, [selectedItem, selectedToppings]);

  const updateQuantity = useCallback((cartItemId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.cartItemId === cartItemId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  }, []);

  const removeFromCart = useCallback((cartItemId: string) => {
    setCart(prev => prev.filter(item => item.cartItemId !== cartItemId));
  }, []);

  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => {
      const toppingsTotal = item.toppings.reduce((t, topping) => t + topping.price, 0);
      return sum + (item.price + toppingsTotal) * item.quantity;
    }, 0);
  }, [cart]);

  const totalGuests = guestCounts.adults + guestCounts.kids + guestCounts.children;

  // Create table session and start ordering
  const createSessionMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/restaurants/${restaurantId}/table-sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableNumber,
          guestCounts: { ...guestCounts, room: roomNumber, waiterName, tabletNumber: selectedTablet },
          status: "ordering"
        })
      });
      if (!res.ok) throw new Error("Failed to create session");
      return res.json();
    },
    onSuccess: (session) => {
      setCurrentSession(session);
      setSetupStep("ordering");
      toast({ title: "Ready!", description: `Table ${tableNumber} - Taking orders` });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to start session", variant: "destructive" });
    }
  });

  // Send to kitchen
  const sendToKitchenMutation = useMutation({
    mutationFn: async () => {
      if (!currentSession) throw new Error("No session");
      
      for (const item of cart) {
        await fetch(`/api/table-sessions/${currentSession.id}/items`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            menuItemId: item.menuItemId,
            name: item.name,
            description: item.description,
            price: item.price.toFixed(2),
            quantity: item.quantity,
            toppings: item.toppings,
            notes: item.toppings.length > 0 ? `EXTRAS: ${item.toppings.map(t => t.name).join(', ')}` : null
          })
        });
      }
      
      const res = await fetch(`/api/table-sessions/${currentSession.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMethod })
      });
      if (!res.ok) throw new Error("Failed to send to kitchen");
      
      // Increment tablet order count
      if (claimedTabletId) {
        await fetch(`/api/restaurants/${restaurantId}/waiter-tablets/${claimedTabletId}/increment-order`, {
          method: "POST"
        });
      }
      
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Sent for Approval!", description: "Manager will review and send to kitchen" });
      setOrderCount(prev => prev + 1);
      setCart([]);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to send to kitchen", variant: "destructive" });
    }
  });

  if (loadingRestaurant || loadingMenu) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-white/60 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  // Order ready notification
  if (orderReady) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 flex flex-col items-center justify-center z-50"
      >
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
          transition={{ repeat: Infinity, duration: 1 }}
        >
          <Bell className="h-32 w-32 text-white" />
        </motion.div>
        <h1 className="text-5xl font-black text-white mt-8 tracking-tight">ORDER READY!</h1>
        <p className="text-3xl text-white/90 mt-4">Table {tableNumber}{roomNumber && ` • Room ${roomNumber}`}</p>
        <Button 
          className="mt-12 bg-white text-emerald-600 hover:bg-gray-100 text-xl px-12 py-6 rounded-2xl shadow-2xl"
          onClick={() => setOrderReady(false)}
        >
          Dismiss
        </Button>
      </motion.div>
    );
  }

  // Step 1: Select Tablet (with registration panel)
  if (setupStep === "tablet") {
    const tabletMap = new Map(waiterTablets.map(t => [t.tabletNumber, t]));
    const isPending = claimTabletMutation.isPending || registerWaiterMutation.isPending;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-8">
        <header className="flex items-center justify-center mb-6">
          <h1 className="text-xl font-bold text-white">{restaurant?.name}</h1>
        </header>

        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: New Waiter Registration Panel */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-1">
              <Card className="bg-white/10 border-white/20 backdrop-blur-xl p-6 rounded-3xl h-full">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                    <Plus className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-1">New Waiter</h3>
                  <p className="text-white/60 text-sm">Register and select your tablet</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">Your Name</label>
                    <Input
                      type="text"
                      value={waiterName}
                      onChange={(e) => setWaiterName(e.target.value)}
                      placeholder="Enter your name..."
                      className="h-12 text-center bg-white/10 border-white/20 text-white placeholder:text-white/40 rounded-xl"
                      data-testid="input-register-name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">Create 4-digit PIN</label>
                    <Input
                      type="password"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={4}
                      value={waiterPin}
                      onChange={(e) => setWaiterPin(e.target.value.replace(/\D/g, ""))}
                      placeholder="Create PIN..."
                      className="h-12 text-center tracking-widest bg-white/10 border-white/20 text-white placeholder:text-white/40 rounded-xl"
                      data-testid="input-register-pin"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">Select Tablet</label>
                    <div className="grid grid-cols-5 gap-2">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                        const tablet = tabletMap.get(num);
                        const isInUse = tablet?.isActive && tablet?.assignedWaiterName;
                        const isSelected = selectedTablet === num;
                        return (
                          <button
                            key={num}
                            onClick={() => {
                              if (!isInUse && tablet) {
                                setSelectedTablet(num);
                                setClaimedTabletId(tablet.id);
                              }
                            }}
                            disabled={!!isInUse}
                            className={`
                              aspect-square rounded-lg text-sm font-bold transition-all
                              ${isInUse 
                                ? "bg-emerald-500/30 text-emerald-300 cursor-not-allowed" 
                                : isSelected 
                                  ? "bg-violet-500 text-white ring-2 ring-violet-300" 
                                  : "bg-white/10 text-white/70 hover:bg-white/20"
                              }
                            `}
                            data-testid={`register-tablet-${num}`}
                          >
                            {num}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <Button
                    onClick={handleRegisterFromTabletPage}
                    disabled={!waiterName.trim() || waiterPin.length !== 4 || !selectedTablet || !claimedTabletId || isPending}
                    className="w-full h-12 mt-2 text-lg font-bold bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 rounded-xl shadow-lg"
                    data-testid="button-register-new-waiter"
                  >
                    {registerWaiterMutation.isPending ? "Registering..." : "Register & Start"}
                  </Button>
                </div>
              </Card>
            </motion.div>

            {/* Right: Tablet Grid */}
            <div className="lg:col-span-2">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-violet-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-2xl">
                  <Tablet className="h-10 w-10 text-white" />
                </div>
                <h2 className="text-3xl font-black text-white mb-2">Select Your Tablet</h2>
                <p className="text-white/60">Tap your tablet to login, or register as new waiter</p>
              </motion.div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                  const tablet = tabletMap.get(num);
                  const isInUse = tablet?.isActive && tablet?.assignedWaiterName;
                  const startTime = tablet?.sessionStartedAt ? new Date(tablet.sessionStartedAt) : null;
                  
                  return (
                    <motion.button
                      key={num}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: num * 0.05 }}
                      onClick={() => {
                        if (isInUse && tablet) {
                          setReconnectTablet({ id: tablet.id, number: num, waiterName: tablet.assignedWaiterName! });
                          setReconnectPin("");
                        } else if (tablet) {
                          setSelectedTablet(num);
                          setClaimedTabletId(tablet.id);
                          setSetupStep("waiter");
                        }
                      }}
                      className={`
                        relative aspect-square rounded-3xl p-4 transition-all duration-300
                        flex flex-col items-center justify-center group cursor-pointer
                        ${isInUse 
                          ? "bg-gradient-to-br from-emerald-500/30 to-green-600/30 border-2 border-emerald-400/60 hover:from-emerald-500/40 hover:to-green-600/40 hover:scale-105"
                          : "bg-gradient-to-br from-white/10 to-white/5 border border-white/20 hover:from-violet-500/30 hover:to-purple-600/30 hover:border-violet-400/50 hover:shadow-2xl hover:scale-105"
                        }
                      `}
                      data-testid={`tablet-${num}`}
                    >
                      {isInUse ? (
                        <>
                          <div className="absolute top-2 right-2">
                            <span className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse inline-block" />
                          </div>
                          <User className="h-8 w-8 text-emerald-300 mb-1" />
                          <span className="text-2xl font-black text-white">{num}</span>
                          <span className="text-xs text-emerald-300 font-bold mt-1 truncate max-w-full px-2">
                            {tablet.assignedWaiterName}
                          </span>
                          {startTime && (
                            <span className="text-[10px] text-emerald-200/70 mt-0.5">
                              <Clock className="h-2.5 w-2.5 inline mr-0.5" />
                              {formatDuration(startTime)}
                            </span>
                          )}
                          <span className="text-[10px] text-emerald-200 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">Tap to login</span>
                        </>
                      ) : (
                        <>
                          <Tablet className="h-10 w-10 text-white/70 group-hover:text-white mb-2 transition-colors" />
                          <span className="text-3xl font-black text-white">{num}</span>
                          <span className="text-xs text-white/50 mt-1">Available</span>
                        </>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Reconnect Dialog - when clicking on in-use tablet */}
        <Dialog open={!!reconnectTablet} onOpenChange={(open) => { if (!open) { setReconnectTablet(null); setReconnectPin(""); } }}>
          <DialogContent className="bg-slate-900/95 border-white/20 backdrop-blur-xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-white text-center">
                Welcome back, {reconnectTablet?.waiterName}!
              </DialogTitle>
            </DialogHeader>
            <div className="py-6">
              <p className="text-white/60 text-center mb-6">Enter your PIN to continue on Tablet {reconnectTablet?.number}</p>
              <Input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={reconnectPin}
                onChange={(e) => setReconnectPin(e.target.value.replace(/\D/g, ""))}
                placeholder="Enter 4-digit PIN..."
                className="h-14 text-xl text-center tracking-widest bg-white/10 border-white/20 text-white placeholder:text-white/40 rounded-xl"
                data-testid="input-reconnect-pin"
                autoFocus
                onKeyDown={(e) => { if (e.key === "Enter" && reconnectPin.length === 4) handleReconnect(); }}
              />
            </div>
            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => { setReconnectTablet(null); setReconnectPin(""); }}
                className="text-white/60 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleReconnect}
                disabled={reconnectPin.length !== 4 || claimTabletMutation.isPending}
                className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
                data-testid="button-reconnect"
              >
                {claimTabletMutation.isPending ? "Logging in..." : "Login"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Step 2: Enter Waiter Name and PIN (Login or Register)
  if (setupStep === "waiter") {
    const handleClaimTablet = () => {
      if (claimedTabletId && waiterName.trim() && waiterPin.trim()) {
        claimTabletMutation.mutate({ tabletId: claimedTabletId, name: waiterName.trim(), pin: waiterPin.trim() });
      }
    };

    const handleRegister = () => {
      if (waiterName.trim() && waiterPin.length === 4 && claimedTabletId) {
        registerWaiterMutation.mutate({ name: waiterName.trim(), pin: waiterPin.trim(), tabletId: claimedTabletId });
      }
    };

    const isPending = claimTabletMutation.isPending || registerWaiterMutation.isPending;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-8">
        <header className="flex items-center justify-between mb-8">
          <Button variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10" onClick={() => { setSetupStep("tablet"); setClaimedTabletId(null); setWaiterName(""); setWaiterPin(""); setIsRegistering(false); }}>
            <ArrowLeft className="h-5 w-5 mr-2" /> Back
          </Button>
          <div className="flex items-center gap-2">
            <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30">Tablet {selectedTablet}</Badge>
          </div>
          <div className="w-20" />
        </header>

        <div className="max-w-md mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <div className={`w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl ${isRegistering ? "bg-gradient-to-br from-emerald-500 to-green-600" : "bg-gradient-to-br from-amber-500 to-orange-600"}`}>
              <User className="h-12 w-12 text-white" />
            </div>
            <h2 className="text-4xl font-black text-white mb-2">{isRegistering ? "New Waiter" : "Waiter Login"}</h2>
            <p className="text-white/60 text-lg">{isRegistering ? "Create your name and PIN to get started" : "Enter your name and PIN to continue"}</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="bg-white/10 border-white/20 backdrop-blur-xl p-8 rounded-3xl">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Your Name</label>
                  <Input
                    type="text"
                    value={waiterName}
                    onChange={(e) => setWaiterName(e.target.value)}
                    placeholder="Enter your name..."
                    className="h-14 text-lg text-center bg-white/10 border-white/20 text-white placeholder:text-white/40 rounded-2xl"
                    data-testid="input-waiter-name"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">{isRegistering ? "Create 4-digit PIN" : "PIN Code"}</label>
                  <Input
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    value={waiterPin}
                    onChange={(e) => setWaiterPin(e.target.value.replace(/\D/g, ""))}
                    placeholder={isRegistering ? "Create your PIN..." : "Enter 4-digit PIN..."}
                    className="h-14 text-lg text-center tracking-widest bg-white/10 border-white/20 text-white placeholder:text-white/40 rounded-2xl"
                    data-testid="input-waiter-pin"
                    onKeyDown={(e) => { 
                      if (e.key === "Enter" && waiterName.trim() && waiterPin.length === 4) {
                        isRegistering ? handleRegister() : handleClaimTablet();
                      }
                    }}
                  />
                </div>
              </div>
              {isRegistering ? (
                <Button
                  onClick={handleRegister}
                  disabled={!waiterName.trim() || waiterPin.length !== 4 || isPending}
                  className="w-full h-14 mt-6 text-lg font-bold bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 rounded-2xl shadow-xl"
                  data-testid="button-register-waiter"
                >
                  {registerWaiterMutation.isPending ? "Registering..." : "Register & Login"}
                </Button>
              ) : (
                <Button
                  onClick={handleClaimTablet}
                  disabled={!waiterName.trim() || waiterPin.length !== 4 || isPending}
                  className="w-full h-14 mt-6 text-lg font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 rounded-2xl shadow-xl"
                  data-testid="button-continue-waiter"
                >
                  {claimTabletMutation.isPending ? "Logging in..." : "Login"}
                </Button>
              )}
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => { setIsRegistering(!isRegistering); setWaiterName(""); setWaiterPin(""); }}
                  className="text-sm text-white/60 hover:text-white transition-colors underline underline-offset-2"
                  data-testid="toggle-register-login"
                >
                  {isRegistering ? "Already registered? Login" : "New waiter? Register here"}
                </button>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  // Step 3: Table Setup
  if (setupStep === "table") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-8">
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30 px-3 py-1.5">
              <Tablet className="h-3.5 w-3.5 inline mr-1" /> {selectedTablet}
            </Badge>
            <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 px-3 py-1.5">
              <User className="h-3.5 w-3.5 inline mr-1" /> {waiterName}
            </Badge>
            {sessionStartTime && (
              <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 px-3 py-1.5">
                <Clock className="h-3.5 w-3.5 inline mr-1" /> {formatDuration(sessionStartTime)}
              </Badge>
            )}
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 px-3 py-1.5">
              Orders: {orderCount}
            </Badge>
          </div>
          <Button
            variant="ghost"
            onClick={handleLogout}
            disabled={releaseTabletMutation.isPending}
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
            data-testid="button-logout"
          >
            <LogOut className="h-5 w-5 mr-2" /> Logout
          </Button>
        </header>

        <div className="max-w-lg mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-2xl">
              <Utensils className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-3xl font-black text-white mb-2">Table Details</h2>
            <p className="text-white/60">Set up the table for your guests</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="bg-white/10 border-white/20 backdrop-blur-xl p-6 rounded-3xl space-y-6">
              {/* Table & Room */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    <MapPin className="h-4 w-4 inline mr-1" /> Table Number
                  </label>
                  <Input
                    type="text"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    placeholder="e.g., 5"
                    className="h-14 text-xl text-center bg-white/10 border-white/20 text-white placeholder:text-white/40 rounded-xl font-bold"
                    data-testid="input-table-number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    <DoorOpen className="h-4 w-4 inline mr-1" /> Room (optional)
                  </label>
                  <Input
                    type="text"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    placeholder="e.g., 2"
                    className="h-14 text-xl text-center bg-white/10 border-white/20 text-white placeholder:text-white/40 rounded-xl font-bold"
                    data-testid="input-room-number"
                  />
                </div>
              </div>

              {/* Guest Counts */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-3">
                  <Users className="h-4 w-4 inline mr-1" /> Guests
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: "adults", label: "Adults", icon: "👤" },
                    { key: "kids", label: "Kids 5-12", icon: "🧒" },
                    { key: "children", label: "Under 5", icon: "👶" }
                  ].map(({ key, label, icon }) => (
                    <div key={key} className="bg-white/5 rounded-2xl p-4 text-center border border-white/10">
                      <p className="text-2xl mb-1">{icon}</p>
                      <p className="text-xs text-white/50 mb-2">{label}</p>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setGuestCounts(g => ({ ...g, [key]: Math.max(0, g[key as keyof GuestCounts] - 1) }))}
                          className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="text-2xl font-bold text-white w-8">{guestCounts[key as keyof GuestCounts]}</span>
                        <button
                          onClick={() => setGuestCounts(g => ({ ...g, [key]: g[key as keyof GuestCounts] + 1 }))}
                          className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-center mt-4 py-3 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-xl border border-cyan-500/30">
                  <span className="text-white/70">Total:</span>
                  <span className="text-3xl font-black text-white ml-2">{totalGuests}</span>
                  <span className="text-white/70 ml-1">guests</span>
                </div>
              </div>

              <Button
                onClick={() => createSessionMutation.mutate()}
                disabled={!tableNumber || totalGuests === 0 || createSessionMutation.isPending}
                className="w-full h-16 text-xl font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 rounded-2xl shadow-xl"
                data-testid="button-start-order"
              >
                {createSessionMutation.isPending ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Utensils className="h-6 w-6 mr-2" />
                    Start Taking Order
                  </>
                )}
              </Button>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  // Main Ordering Screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-800 to-slate-900 border-b border-white/10 px-4 py-2 flex-shrink-0">
        {/* Top row - Session info */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30 px-2 py-1 text-xs">
              <Tablet className="h-3 w-3 inline mr-1" /> {selectedTablet}
            </Badge>
            <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 px-2 py-1 text-xs">
              <User className="h-3 w-3 inline mr-1" /> {waiterName}
            </Badge>
            {sessionStartTime && (
              <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 px-2 py-1 text-xs">
                <Clock className="h-3 w-3 inline mr-1" /> {formatDuration(sessionStartTime)}
              </Badge>
            )}
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 px-2 py-1 text-xs">
              Orders: {orderCount}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            disabled={releaseTabletMutation.isPending}
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 px-2"
            data-testid="button-logout-ordering"
          >
            <LogOut className="h-4 w-4 mr-1" /> Logout
          </Button>
        </div>
        
        {/* Bottom row - Table info and cart */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSetupStep("table")}
              className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <Home className="h-5 w-5 text-white" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-white">Table {tableNumber}</span>
                {roomNumber && <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">Room {roomNumber}</Badge>}
              </div>
              <div className="flex items-center gap-2 text-sm text-white/60">
                <span>{totalGuests} guests</span>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => setShowCart(true)}
            className="relative bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white px-5 py-3 rounded-2xl flex items-center gap-2 shadow-lg transition-all"
          >
            <ShoppingCart className="h-5 w-5" />
            <span className="font-bold">{cart.reduce((sum, i) => sum + i.quantity, 0)}</span>
            {cart.length > 0 && (
              <span className="text-sm font-medium">{currencySymbol}{subtotal.toFixed(2)}</span>
            )}
          </button>
        </div>
      </header>

      {/* Search */}
      <div className="px-4 py-3 bg-slate-800/50 border-b border-white/5">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search menu..."
            className="pl-12 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/40 rounded-xl"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto bg-slate-800/30 border-b border-white/5 flex-shrink-0">
        {categories.map((cat, i) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-5 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all ${
              activeCategory === cat.id
                ? `bg-gradient-to-r ${CATEGORY_COLORS[i % CATEGORY_COLORS.length]} text-white shadow-lg`
                : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            {cat.icon} {cat.name}
          </button>
        ))}
      </div>

      {/* Menu Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {filteredMenuItems.map((item, idx) => (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.02 }}
              onClick={() => handleItemClick(item)}
              className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-2xl overflow-hidden text-left transition-all hover:shadow-xl group"
              data-testid={`menu-item-${item.id}`}
            >
              <div className="aspect-[4/3] overflow-hidden bg-black/20">
                {item.image ? (
                  <img 
                    src={item.image} 
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => { e.currentTarget.style.display = 'none'; (e.currentTarget.parentElement as HTMLElement).innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg class="h-12 w-12 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>'; }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Utensils className="h-12 w-12 text-white/20" />
                  </div>
                )}
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-white text-sm line-clamp-2 mb-1">{item.name}</h3>
                {item.description && (
                  <p className="text-xs text-white/50 line-clamp-2 mb-2">{item.description}</p>
                )}
                <p className="text-lg font-bold bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">
                  {currencySymbol}{Number(item.price).toFixed(2)}
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Cart Slide-over */}
      <AnimatePresence>
        {showCart && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setShowCart(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-gradient-to-b from-slate-900 to-slate-800 border-l border-white/10 shadow-2xl z-50 flex flex-col"
            >
              {/* Cart Header */}
              <div className="p-4 border-b border-white/10 bg-gradient-to-r from-emerald-500/10 to-green-500/10">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-white">Order</h2>
                    <p className="text-sm text-white/60">Table {tableNumber}{roomNumber && ` • Room ${roomNumber}`}</p>
                  </div>
                  <button
                    onClick={() => setShowCart(false)}
                    className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                  >
                    <ArrowLeft className="h-5 w-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {cart.length === 0 ? (
                  <div className="text-center py-16">
                    <ShoppingCart className="h-16 w-16 text-white/20 mx-auto mb-4" />
                    <p className="text-white/40 text-lg">No items yet</p>
                    <p className="text-white/30 text-sm">Tap items to add them</p>
                  </div>
                ) : (
                  cart.map(item => {
                    const toppingsTotal = item.toppings.reduce((sum, t) => sum + t.price, 0);
                    const itemTotal = (item.price + toppingsTotal) * item.quantity;
                    return (
                      <motion.div
                        key={item.cartItemId}
                        layout
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="bg-white/5 rounded-2xl p-4 border border-white/10"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-white truncate">{item.name}</p>
                            {item.toppings.length > 0 && (
                              <p className="text-xs text-amber-400 mt-1">
                                + {item.toppings.map(t => t.name).join(', ')}
                              </p>
                            )}
                            <p className="text-emerald-400 font-bold mt-1">{currencySymbol}{itemTotal.toFixed(2)}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => updateQuantity(item.cartItemId, -1)}
                              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="w-8 text-center font-bold text-white">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.cartItemId, 1)}
                              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => removeFromCart(item.cartItemId)}
                              className="w-8 h-8 rounded-lg bg-red-500/20 hover:bg-red-500/30 flex items-center justify-center text-red-400 transition-colors ml-2"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>

              {/* Cart Footer */}
              {cart.length > 0 && (
                <div className="p-4 border-t border-white/10 bg-slate-900/80 backdrop-blur-xl space-y-4">
                  {/* Payment Method Selection */}
                  <div className="space-y-2">
                    <span className="text-white/60 text-sm">Payment Method</span>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => setPaymentMethod("cash")}
                        className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                          paymentMethod === "cash"
                            ? "border-emerald-500 bg-emerald-500/20"
                            : "border-white/20 bg-white/5 hover:bg-white/10"
                        }`}
                      >
                        <Banknote className="h-5 w-5 text-emerald-400" />
                        <span className="text-white text-xs font-medium">Cash</span>
                      </button>
                      <button
                        onClick={() => setPaymentMethod("card")}
                        className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                          paymentMethod === "card"
                            ? "border-blue-500 bg-blue-500/20"
                            : "border-white/20 bg-white/5 hover:bg-white/10"
                        }`}
                      >
                        <CreditCard className="h-5 w-5 text-blue-400" />
                        <span className="text-white text-xs font-medium">Card</span>
                      </button>
                      <button
                        onClick={() => setPaymentMethod("account")}
                        className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                          paymentMethod === "account"
                            ? "border-amber-500 bg-amber-500/20"
                            : "border-white/20 bg-white/5 hover:bg-white/10"
                        }`}
                      >
                        <User className="h-5 w-5 text-amber-400" />
                        <span className="text-white text-xs font-medium">Account</span>
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-white/70 text-lg">Total</span>
                    <span className="text-3xl font-black text-white">{currencySymbol}{subtotal.toFixed(2)}</span>
                  </div>
                  <Button
                    onClick={() => { sendToKitchenMutation.mutate(); setShowCart(false); }}
                    disabled={sendToKitchenMutation.isPending}
                    className="w-full h-16 text-xl font-bold bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 rounded-2xl shadow-xl"
                  >
                    {sendToKitchenMutation.isPending ? (
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <ChefHat className="h-6 w-6 mr-2" />
                        Send to Kitchen
                      </>
                    )}
                  </Button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Topping Modal */}
      <Dialog open={showToppingModal} onOpenChange={(open) => !open && setShowToppingModal(false)}>
        <DialogContent className="bg-slate-900 border-white/20 text-white max-w-sm rounded-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{selectedItem?.name}</DialogTitle>
          </DialogHeader>
          
          {selectedItem?.description && (
            <p className="text-sm text-white/60">{selectedItem.description}</p>
          )}
          
          <p className="text-2xl font-bold text-emerald-400">{currencySymbol}{Number(selectedItem?.price || 0).toFixed(2)}</p>

          {/* Topping Groups (Goes well with, Add a Drink, etc.) */}
          {(() => {
            const itemGroups = toppingGroups.filter((g: any) => (g.menu_item_id || g.menuItemId) === selectedItem?.id);
            const getOptionsForGroup = (groupId: string) => toppingOptions.filter((o: any) => o.group_id === groupId);
            
            return itemGroups.length > 0 && (
              <div className="space-y-4">
                {itemGroups.map((group: any) => (
                  <div key={group.id}>
                    <h3 className="text-sm font-bold text-amber-400 mb-2 flex items-center gap-2">
                      {group.headline || 'Options'}
                      {group.is_required && <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">Required</span>}
                    </h3>
                    <div className="space-y-2">
                      {getOptionsForGroup(group.id).map((option: any) => (
                        <label
                          key={option.id}
                          onClick={() => toggleTopping({ id: option.id, name: option.name, price: option.price } as any)}
                          className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                            selectedToppings.some(t => t.id === option.id)
                              ? "bg-emerald-500/20 border-emerald-500"
                              : "bg-white/5 hover:bg-white/10 border-white/10"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={selectedToppings.some(t => t.id === option.id)}
                              className="border-white/30 data-[state=checked]:bg-emerald-500"
                            />
                            <span className="text-white">{option.name}</span>
                          </div>
                          <span className="text-amber-400 font-medium">+{currencySymbol}{Number(option.price).toFixed(2)}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* Extra Toppings */}
          {(() => {
            const itemToppings = extraToppings.filter((t: any) => t.menuItemId === selectedItem?.id);
            return itemToppings.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                <p className="text-sm font-medium text-cyan-400">Add Extras:</p>
                {itemToppings.map((topping) => {
                  const isSoldOut = topping.isActive === false;
                  return (
                  <label
                    key={topping.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                      isSoldOut 
                        ? "bg-red-500/10 border-red-500/30 cursor-not-allowed opacity-60" 
                        : "bg-white/5 hover:bg-white/10 cursor-pointer border-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedToppings.some(t => t.id === topping.id)}
                        onCheckedChange={() => !isSoldOut && toggleTopping(topping)}
                        disabled={isSoldOut}
                        className="border-white/30 data-[state=checked]:bg-emerald-500"
                      />
                      <span className={isSoldOut ? "text-white/50 line-through" : "text-white"}>{topping.name}</span>
                      {isSoldOut && <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">SOLD OUT</span>}
                    </div>
                    {isSoldOut ? (
                      <span className="text-red-400 font-medium text-sm">Unavailable</span>
                    ) : (
                      <span className="text-amber-400 font-medium">+{currencySymbol}{Number(topping.price).toFixed(2)}</span>
                    )}
                  </label>
                );
                })}
              </div>
            );
          })()}

          <DialogFooter className="gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowToppingModal(false)}
              className="flex-1 h-12 border-white/20 text-white hover:bg-white/10 rounded-xl"
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmAddToCart}
              className="flex-1 h-12 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 rounded-xl"
            >
              Add to Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <InstallPrompt restaurantName={restaurant?.name ? `${restaurant.name} Waiter` : "Waiter"} themeColor="#1e3a5f" />
    </div>
  );
}
