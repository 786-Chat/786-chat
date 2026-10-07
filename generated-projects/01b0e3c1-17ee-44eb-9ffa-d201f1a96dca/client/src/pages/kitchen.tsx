import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useSearch } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { getOrders, updateOrderStatus, connectWebSocket, getRestaurantBySlug } from "@/lib/api";
import type { Order, OrderItem, KitchenStation, OrderItemCompletion } from "@shared/schema";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { ChefHat, Clock, Loader2, AlertTriangle, Utensils, CreditCard, Banknote, Bell, BellOff, CheckCircle2, Settings, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistance } from "date-fns";
import useSound from "use-sound";
import { InstallPrompt } from "@/components/install-prompt";

const KITCHEN_NOTIFICATION_URL = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3";

type OrderWithItems = Order & { items: OrderItem[] };

async function getKitchenStations(restaurantId: string): Promise<KitchenStation[]> {
  const res = await fetch(`/api/restaurants/${restaurantId}/kitchen-stations`);
  if (!res.ok) throw new Error("Failed to fetch kitchen stations");
  return res.json();
}

async function getOrderItemCompletions(orderId: string): Promise<OrderItemCompletion[]> {
  const res = await fetch(`/api/orders/${orderId}/item-completions`);
  if (!res.ok) throw new Error("Failed to fetch item completions");
  return res.json();
}

async function markItemReady(orderItemId: string, quantity: number, stationId?: string): Promise<OrderItemCompletion> {
  const res = await fetch(`/api/order-items/${orderItemId}/mark-ready`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ quantity, stationId }),
  });
  if (!res.ok) throw new Error("Failed to mark item ready");
  return res.json();
}

async function checkOrderCompletion(orderId: string): Promise<{ allComplete: boolean; orderStatus: string }> {
  const res = await fetch(`/api/orders/${orderId}/check-completion`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to check order completion");
  return res.json();
}

export default function KitchenDisplay() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const stationSlug = searchParams.get("station");
  
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFlashing, setIsFlashing] = useState(false);
  const [completions, setCompletions] = useState<Record<string, Record<string, OrderItemCompletion>>>({});
  const [completedExtras, setCompletedExtras] = useState<Record<string, Set<string>>>({});
  const knownOrderIds = useRef<Set<string>>(new Set());
  
  // Helper to mark an extra as completed
  const markExtraComplete = (itemId: string, extraKey: string) => {
    setCompletedExtras(prev => {
      const itemExtras = new Set(prev[itemId] || []);
      itemExtras.add(extraKey);
      return { ...prev, [itemId]: itemExtras };
    });
  };
  
  // Check if an extra is completed
  const isExtraComplete = (itemId: string, extraKey: string) => {
    return completedExtras[itemId]?.has(extraKey) || false;
  };

  const [playNotification] = useSound(KITCHEN_NOTIFICATION_URL, {
    volume: 1,
    interrupt: false,
  });

  const { data: restaurant, isLoading: loadingRestaurant, error: restaurantError } = useQuery({
    queryKey: ["/api/restaurants", slug],
    queryFn: () => getRestaurantBySlug(slug!),
    enabled: !!slug,
  });

  const restaurantId = restaurant?.id || null;
  const restaurantName = restaurant?.name || "Kitchen Display";

  const { data: stations = [] } = useQuery({
    queryKey: ["/api/kitchen-stations", restaurantId],
    queryFn: () => getKitchenStations(restaurantId!),
    enabled: !!restaurantId,
  });

  const currentStation = stationSlug ? stations.find(s => s.slug === stationSlug) : null;

  // PWA manifest switching for Kitchen
  useEffect(() => {
    document.documentElement.classList.add("dark");
    
    const originalManifest = document.querySelector('link[rel="manifest"]');
    const originalManifestHref = originalManifest?.getAttribute('href');
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    const originalThemeColor = metaThemeColor?.getAttribute('content');
    const appleAppTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
    const originalAppleTitle = appleAppTitle?.getAttribute('content');

    if (originalManifest) originalManifest.setAttribute('href', '/manifest-kitchen.json');
    if (metaThemeColor) metaThemeColor.setAttribute('content', '#f97316');
    if (appleAppTitle) appleAppTitle.setAttribute('content', 'Link24-Kitchen');
    
    return () => {
      document.documentElement.classList.remove("dark");
      if (originalManifest && originalManifestHref) originalManifest.setAttribute('href', originalManifestHref);
      if (metaThemeColor && originalThemeColor) metaThemeColor.setAttribute('content', originalThemeColor);
      if (appleAppTitle && originalAppleTitle) appleAppTitle.setAttribute('content', originalAppleTitle);
    };
  }, []);

  const { data: orders = [] } = useQuery<OrderWithItems[]>({
    queryKey: ["/api/orders", restaurantId],
    queryFn: () => getOrders(restaurantId!),
    refetchInterval: 5000,
    enabled: !!restaurantId,
  });

  // Fetch completions for all orders
  useEffect(() => {
    if (!orders.length) return;
    
    const fetchAllCompletions = async () => {
      const newCompletions: Record<string, Record<string, OrderItemCompletion>> = {};
      for (const order of orders.filter(o => o.status === "preparing" || o.status === "new")) {
        try {
          const orderCompletions = await getOrderItemCompletions(order.id);
          newCompletions[order.id] = {};
          orderCompletions.forEach(c => {
            newCompletions[order.id][c.orderItemId] = c;
          });
        } catch (e) {
          console.error("Failed to fetch completions for order", order.id);
        }
      }
      setCompletions(newCompletions);
    };
    
    fetchAllCompletions();
  }, [orders]);

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "new" | "preparing" | "ready" | "completed" }) =>
      updateOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders", restaurantId] });
    },
  });

  // WebSocket for real-time updates
  useEffect(() => {
    if (!restaurantId) return;

    const ws = connectWebSocket(restaurantId, (data) => {
      if (data.type === "NEW_ORDER") {
        if (soundEnabled) {
          playNotification();
          setIsFlashing(true);
          setTimeout(() => setIsFlashing(false), 3000);
        }
        queryClient.invalidateQueries({ queryKey: ["/api/orders", restaurantId] });
      } else if (data.type === "ORDER_STATUS_UPDATE" || data.type === "ORDER_STATUS_CHANGED") {
        queryClient.invalidateQueries({ queryKey: ["/api/orders", restaurantId] });
      } else if (data.type === "ORDER_ITEM_STATUS_CHANGED") {
        // Update local completions state for real-time sync across tablets
        const { orderId, orderItemId, completion } = data.data;
        setCompletions(prev => ({
          ...prev,
          [orderId]: {
            ...(prev[orderId] || {}),
            [orderItemId]: completion
          }
        }));
      }
    });

    return () => ws.close();
  }, [restaurantId, soundEnabled, playNotification]);

  // Effect to detect new orders
  useEffect(() => {
    if (!orders.length) return;
    
    const preparingOrderIds = orders
      .filter(o => o.status === "preparing" && !o.isArchived)
      .map(o => o.id);
    
    const newOrders = preparingOrderIds.filter(id => !knownOrderIds.current.has(id));
    
    if (newOrders.length > 0 && knownOrderIds.current.size > 0 && soundEnabled) {
      playNotification();
      setIsFlashing(true);
      setTimeout(() => setIsFlashing(false), 3000);
    }
    
    knownOrderIds.current = new Set(preparingOrderIds);
  }, [orders, soundEnabled, playNotification]);

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  // Filter orders for kitchen display
  const kitchenOrders = orders
    .filter(o => {
      const orderDate = new Date(o.createdAt || 0);
      return o.status === "preparing" && !o.isArchived && orderDate >= startOfToday;
    })
    .sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());

  // Filter items by station categories if a station is selected
  // Also excludes completed items from station view so they disappear when done
  const getRelevantItems = useCallback((items: OrderItem[], orderId: string, excludeCompleted: boolean = true): OrderItem[] => {
    let filteredItems = items;
    
    // Filter by station categories if a station is selected
    if (currentStation && currentStation.categories && currentStation.categories.length > 0) {
      filteredItems = filteredItems.filter(item => 
        currentStation.categories?.some(cat => 
          item.name.toLowerCase().includes(cat.toLowerCase()) ||
          (item.notes && item.notes.toLowerCase().includes(cat.toLowerCase()))
        )
      );
    }
    
    // Exclude completed items so they disappear from station view
    if (excludeCompleted) {
      filteredItems = filteredItems.filter(item => {
        const completion = completions[orderId]?.[item.id];
        return !completion || (completion.completedQuantity || 0) < item.quantity;
      });
    }
    
    return filteredItems;
  }, [currentStation, completions]);

  // Check if an item is complete
  const isItemComplete = useCallback((orderId: string, item: OrderItem): boolean => {
    const completion = completions[orderId]?.[item.id];
    return !!completion && (completion.completedQuantity || 0) >= item.quantity;
  }, [completions]);

  // Handle marking individual item as ready
  const handleMarkItemReady = async (orderId: string, item: OrderItem) => {
    try {
      const completion = await markItemReady(item.id, item.quantity, currentStation?.id);
      
      // Update local state
      setCompletions(prev => ({
        ...prev,
        [orderId]: {
          ...(prev[orderId] || {}),
          [item.id]: completion
        }
      }));
      
      // Check if order is complete
      await checkOrderCompletion(orderId);
      queryClient.invalidateQueries({ queryKey: ["/api/orders", restaurantId] });
    } catch (error) {
      console.error("Failed to mark item ready:", error);
    }
  };

  // Calculate stats
  const preparingCount = kitchenOrders.length;
  const readyCount = orders.filter(o => {
    const orderDate = new Date(o.createdAt || 0);
    return o.status === "ready" && !o.isArchived && orderDate >= startOfToday;
  }).length;
  const todayOrdersCount = orders.filter(o => {
    const orderDate = new Date(o.createdAt || 0);
    return orderDate >= startOfToday;
  }).length;

  const handleMarkReady = (id: string) => {
    updateStatusMutation.mutate({ id, status: "ready" });
  };

  if (loadingRestaurant) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading kitchen display...</p>
        </div>
      </div>
    );
  }

  if (restaurantError || !restaurant) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
          <h2 className="text-xl font-bold">Kitchen Display Not Found</h2>
          <p className="text-muted-foreground">The restaurant you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  // Filter orders based on station - only show orders that have relevant items (incomplete ones)
  const filteredOrders = currentStation 
    ? kitchenOrders.filter(order => getRelevantItems(order.items, order.id).length > 0)
    : kitchenOrders;

  return (
    <div className={cn(
      "min-h-screen bg-background text-foreground font-sans flex flex-col",
      isFlashing && "animate-pulse bg-orange-500/10"
    )}>
      {/* Header */}
      <header className={cn(
        "border-b border-border bg-card px-6 py-4 flex justify-between items-center sticky top-0 z-40 shadow-md transition-all duration-300",
        isFlashing && "bg-orange-500/30 border-orange-500"
      )}>
        <div className="flex items-center gap-4">
          <div className={cn(
            "p-2 rounded-lg transition-all",
            currentStation ? `bg-[${currentStation.color}]/20` : "bg-orange-500/20",
            isFlashing && "bg-orange-500 animate-bounce"
          )}
          style={currentStation ? { backgroundColor: `${currentStation.color}20` } : undefined}
          >
            <Utensils className="h-6 w-6" style={currentStation ? { color: currentStation.color || '#3b82f6' } : { color: '#f97316' }} />
          </div>
          <div>
            <h1 className="text-xl font-bold" data-testid="text-kitchen-name">
              {currentStation ? currentStation.name : restaurantName}
            </h1>
            <p className="text-sm text-muted-foreground">
              {currentStation ? `${restaurantName} - Kitchen Station` : "All Items View"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {isFlashing && (
            <div className="bg-orange-500 text-white px-4 py-2 rounded-lg animate-bounce font-bold">
              🔔 NEW ORDER!
            </div>
          )}
          
          {/* Order Stats */}
          <div className="flex items-center gap-3">
            <div className="bg-amber-500/20 border border-amber-500/40 px-3 py-1.5 rounded-lg text-center">
              <span className="text-amber-400 font-bold text-lg">{preparingCount}</span>
              <p className="text-xs text-amber-300/70">Preparing</p>
            </div>
            <div className="bg-emerald-500/20 border border-emerald-500/40 px-3 py-1.5 rounded-lg text-center">
              <span className="text-emerald-400 font-bold text-lg">{readyCount}</span>
              <p className="text-xs text-emerald-300/70">Ready</p>
            </div>
            <div className="bg-purple-500/20 border border-purple-500/40 px-3 py-1.5 rounded-lg text-center">
              <span className="text-purple-400 font-bold text-lg">{todayOrdersCount}</span>
              <p className="text-xs text-purple-300/70">Today</p>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={cn(
              "rounded-full",
              soundEnabled ? "text-green-400 hover:text-green-300" : "text-slate-500 hover:text-slate-300"
            )}
            data-testid="button-toggle-kitchen-sound"
            title={soundEnabled ? "Sound On" : "Sound Off"}
          >
            {soundEnabled ? <Bell className="h-6 w-6" /> : <BellOff className="h-6 w-6" />}
          </Button>
          <div className="text-sm text-muted-foreground">
            {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </div>
        </div>
      </header>

      {/* Station Tabs */}
      {stations.length > 0 && (
        <div className="border-b border-border bg-card/50 px-6 py-3 flex gap-2 overflow-x-auto">
          <a
            href={`/kitchen/${slug}`}
            className={cn(
              "px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap",
              !stationSlug 
                ? "bg-primary text-primary-foreground" 
                : "bg-muted hover:bg-muted/80 text-muted-foreground"
            )}
            data-testid="station-tab-all"
          >
            All Items
          </a>
          {stations.filter(s => s.isActive).map(station => (
            <a
              key={station.id}
              href={`/kitchen/${slug}?station=${station.slug}`}
              className={cn(
                "px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-2",
                stationSlug === station.slug
                  ? "text-white"
                  : "hover:opacity-80 text-muted-foreground"
              )}
              style={{
                backgroundColor: stationSlug === station.slug ? station.color || '#3b82f6' : undefined,
                borderColor: station.color || '#3b82f6',
                borderWidth: '2px',
                borderStyle: 'solid',
              }}
              data-testid={`station-tab-${station.slug}`}
            >
              {station.name}
            </a>
          ))}
          <a
            href={`/kitchen/${slug}/settings`}
            className="px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap bg-muted hover:bg-muted/80 text-muted-foreground flex items-center gap-2"
            data-testid="station-tab-settings"
          >
            <Settings className="h-4 w-4" />
            Settings
          </a>
        </div>
      )}

      {/* Orders Grid */}
      <main className="flex-1 p-6">
        {filteredOrders.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-border rounded-xl bg-card/30">
            <ChefHat className="h-16 w-16 mb-4 opacity-20" />
            <p className="text-2xl font-medium">
              {currentStation ? `No ${currentStation.name} items to prepare` : "No orders to prepare"}
            </p>
            <p className="text-sm">Waiting for orders...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredOrders.map(order => {
              const minutesElapsed = order.createdAt 
                ? Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000)
                : 0;
              const isOverdue = minutesElapsed >= 30;
              // For station view: show only incomplete items for that station
              // For all items view: show all items (including completed) for full visibility
              const relevantItems = currentStation 
                ? getRelevantItems(order.items, order.id, true)  // exclude completed for station view
                : getRelevantItems(order.items, order.id, false);  // include all for overview
              const allItemsComplete = order.items.every(item => isItemComplete(order.id, item));
              
              return (
                <Card 
                  key={order.id} 
                  className={cn(
                    "shadow-lg flex flex-col overflow-hidden border-2",
                    allItemsComplete
                      ? "border-emerald-500 bg-emerald-500/5"
                      : isOverdue 
                        ? "border-red-500 bg-red-500/10 animate-pulse" 
                        : "border-amber-500 bg-amber-500/5"
                  )}
                  data-testid={`kitchen-order-${order.id}`}
                >
                  <div className={cn(
                    "text-white text-center py-3 font-bold text-lg",
                    allItemsComplete
                      ? "bg-emerald-600"
                      : isOverdue ? "bg-red-600" : "bg-amber-500"
                  )}>
                    {allItemsComplete ? "✓ READY TO SERVE" : isOverdue ? "⚠️ OVERDUE" : "PREPARING"}
                  </div>

                  <CardHeader className="pb-2 space-y-1">
                    <div className="flex justify-between items-start">
                      <h3 className="text-4xl font-bold font-mono text-primary" data-testid={`kitchen-order-number-${order.id}`}>
                        #{String(order.orderNumber || 0).padStart(3, '0')}
                      </h3>
                      <div className="flex flex-col gap-1 items-end">
                        <Badge variant="secondary" className="uppercase text-xs font-bold tracking-wider">
                          {order.type === 'collection' ? 'Collection' : order.type}
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-xs font-bold flex items-center gap-1",
                            order.paymentMethod === 'card' 
                              ? "bg-blue-500/10 text-blue-400 border-blue-500/30" 
                              : "bg-green-500/10 text-green-400 border-green-500/30"
                          )}
                        >
                          {order.paymentMethod === 'card' ? (
                            <><CreditCard className="h-3 w-3" /> Card</>
                          ) : (
                            <><Banknote className="h-3 w-3" /> Cash</>
                          )}
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Customer/Table Info - Shows prominently for dine-in orders */}
                    {order.type === 'dine-in' && order.customerName && (
                      <div className="bg-gradient-to-r from-violet-500/20 to-purple-500/20 border-2 border-violet-500/40 rounded-xl p-3 mt-2">
                        <div className="flex items-center gap-2 mb-1">
                          <Users className="h-5 w-5 text-violet-400" />
                          <span className="font-bold text-violet-300 text-sm uppercase tracking-wider">Dine-In Customer</span>
                        </div>
                        <p className="text-lg font-bold text-white leading-tight">
                          {order.customerName.split(' | ')[0]}
                        </p>
                        {order.customerName.includes('Waiter:') && (
                          <p className="text-sm text-violet-300 mt-1">
                            👤 {order.customerName.split(' | ').find(s => s.includes('Waiter:'))?.replace('Waiter: ', '')}
                            {order.customerName.includes('Tablet') && (
                              <span className="ml-2 opacity-70">
                                📱 {order.customerName.split(' | ').find(s => s.includes('Tablet'))}
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                    )}
                    
                    <div className={cn(
                      "rounded-lg px-3 py-2 mt-2 border",
                      isOverdue 
                        ? "bg-red-500/20 border-red-500/50" 
                        : "bg-amber-500/10 border-amber-500/30"
                    )}>
                      <div className={cn(
                        "font-bold text-lg flex items-center gap-2",
                        isOverdue ? "text-red-400" : "text-amber-400"
                      )}>
                        <Clock className="h-5 w-5" />
                        {order.createdAt ? formatDistance(new Date(order.createdAt), new Date(), { addSuffix: true }) : "Just now"}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1 space-y-3">
                    <Separator />
                    <div className="space-y-3">
                      {relevantItems.map((item, idx) => {
                        const itemComplete = isItemComplete(order.id, item);
                        return (
                          <div 
                            key={idx} 
                            className={cn(
                              "space-y-1 p-2 rounded-lg transition-all cursor-pointer",
                              itemComplete 
                                ? "bg-emerald-500/20 opacity-60" 
                                : "hover:bg-muted/50"
                            )}
                            onClick={() => !itemComplete && handleMarkItemReady(order.id, item)}
                            data-testid={`kitchen-item-${order.id}-${item.id}`}
                          >
                            <div className="flex gap-2 items-center text-lg">
                              <Checkbox 
                                checked={itemComplete}
                                className={cn(
                                  "h-6 w-6",
                                  itemComplete && "bg-emerald-500 border-emerald-500"
                                )}
                                data-testid={`checkbox-item-${item.id}`}
                              />
                              <span className={cn(
                                "font-bold w-8",
                                itemComplete ? "text-emerald-400" : "text-primary"
                              )}>
                                {item.quantity}x
                              </span>
                              <span className={cn(
                                "font-semibold flex-1",
                                itemComplete && "line-through text-muted-foreground"
                              )}>
                                {item.name}
                              </span>
                              {itemComplete && (
                                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                              )}
                            </div>
                            {item.notes && (
                              <div className="ml-10 space-y-1">
                                {(() => {
                                  const notes = item.notes;
                                  const parts = notes.split(' | ');
                                  const elements: React.ReactNode[] = [];
                                  
                                  parts.forEach((part, partIdx) => {
                                    // Check if this part contains EXTRAS
                                    if (part.includes('EXTRAS:') || part.includes('EXTRA:')) {
                                      // Extract the extras content after "EXTRAS:" or "EXTRA:"
                                      const extrasMatch = part.match(/EXTRAS?:\s*(.+)/i);
                                      if (extrasMatch) {
                                        // Split individual toppings by comma
                                        const toppings = extrasMatch[1].split(',').map(t => t.trim()).filter(t => t);
                                        toppings.forEach((topping, tIdx) => {
                                          const extraKey = `${item.id}-extra-${tIdx}`;
                                          const extraDone = isExtraComplete(item.id, extraKey);
                                          
                                          // Only show if not completed
                                          if (!extraDone) {
                                            elements.push(
                                              <div 
                                                key={`extra-${partIdx}-${tIdx}`}
                                                className={cn(
                                                  "flex items-center gap-2 text-sm font-bold px-2 py-1 rounded cursor-pointer transition-all hover:opacity-80",
                                                  itemComplete 
                                                    ? "text-emerald-400/60 bg-emerald-500/10" 
                                                    : "text-green-400 bg-green-500/20"
                                                )}
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  markExtraComplete(item.id, extraKey);
                                                }}
                                              >
                                                <Checkbox 
                                                  checked={false}
                                                  className="h-4 w-4 border-green-400"
                                                />
                                                <span>🍽️ {topping}</span>
                                              </div>
                                            );
                                          }
                                        });
                                      }
                                    } else {
                                      // Regular description/note
                                      elements.push(
                                        <div 
                                          key={`note-${partIdx}`}
                                          className={cn(
                                            "text-sm font-medium px-2 py-1 rounded",
                                            itemComplete 
                                              ? "text-emerald-400/60 bg-emerald-500/10" 
                                              : "text-amber-400 bg-amber-500/10"
                                          )}
                                        >
                                          {part}
                                        </div>
                                      );
                                    }
                                  });
                                  
                                  return elements;
                                })()}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>

                  <CardFooter className="pt-4 pb-6">
                    {allItemsComplete ? (
                      <Button 
                        size="lg"
                        className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xl h-16"
                        onClick={() => handleMarkReady(order.id)}
                        data-testid={`button-kitchen-ready-${order.id}`}
                      >
                        <ChefHat className="h-6 w-6" />
                        COMPLETE ORDER
                      </Button>
                    ) : (
                      <div className="w-full text-center text-muted-foreground py-4">
                        Tap items when ready
                      </div>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </main>
      
      <InstallPrompt restaurantName={restaurantName} themeColor="#f97316" appName="Link24-Kitchen" />
    </div>
  );
}
