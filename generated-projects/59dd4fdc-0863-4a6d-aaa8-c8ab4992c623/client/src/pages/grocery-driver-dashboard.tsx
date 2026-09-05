import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  Truck, Package, MapPin, Phone, User, Clock, CheckCircle,
  Navigation, LogOut, Bell, ChevronRight, ShoppingCart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

type DeliveryOrder = {
  id: string; orderId: string; driverId: string; deliveryStatus: string;
  order: { id: string; customerName: string; customerPhone: string | null; customerAddress: string | null; total: string; status: string; notes: string | null; createdAt: string; };
  items: { id: string; productName: string; productImage: string | null; price: string; quantity: number; total: string; }[];
};

function apiCall(url: string, method = "GET", body?: any) {
  return fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  }).then(r => r.json());
}

export default function GroceryDriverDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const driverId = localStorage.getItem("groceryDriverId");
  const driverName = localStorage.getItem("groceryDriverName");
  const branchName = localStorage.getItem("groceryBranchName");
  const branchId = localStorage.getItem("groceryBranchId");
  const [isOnDuty, setIsOnDuty] = useState(true);
  const watchIdRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { data: deliveries = [] } = useQuery<DeliveryOrder[]>({
    queryKey: ["/api/grocery/driver/orders", driverId],
    queryFn: () => apiCall(`/api/grocery/driver/${driverId}/orders`),
    enabled: !!driverId,
    refetchInterval: 10000,
  });

  useEffect(() => {
    if (!driverId) { setLocation("/grocery-driver"); return; }
  }, [driverId, setLocation]);

  useEffect(() => {
    if (!driverId || !branchId) return;
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/grocery-ws?groceryDriverId=${driverId}`);
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === "new_delivery") {
        try {
          if (!audioRef.current) audioRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
          audioRef.current.play().catch(() => {});
        } catch (e) {}
        toast({ title: "New Delivery Assigned!" });
        qc.invalidateQueries({ queryKey: ["/api/grocery/driver/orders"] });
      }
    };
    return () => ws.close();
  }, [driverId, branchId, qc, toast]);

  const startLocationTracking = useCallback(() => {
    if (!driverId || !navigator.geolocation) return;
    if (watchIdRef.current !== null) return;
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        fetch(`/api/grocery/driver/${driverId}/location`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        }).catch(() => {});
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
  }, [driverId]);

  const stopLocationTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isOnDuty) startLocationTracking();
    else stopLocationTracking();
    return stopLocationTracking;
  }, [isOnDuty, startLocationTracking, stopLocationTracking]);

  const toggleDuty = async () => {
    const res = await apiCall(`/api/grocery/driver/${driverId}/toggle-duty`, "POST");
    setIsOnDuty(res.isOnDuty);
    toast({ title: res.isOnDuty ? "You are now on duty" : "You are now off duty" });
  };

  const updateDeliveryStatus = async (orderId: string, status: string) => {
    await apiCall(`/api/grocery/driver/${driverId}/delivery-status`, "POST", { orderId, status });
    qc.invalidateQueries({ queryKey: ["/api/grocery/driver/orders"] });
    toast({ title: `Status: ${status.replace("_", " ")}` });
  };

  const logout = () => {
    stopLocationTracking();
    localStorage.removeItem("groceryDriverId");
    localStorage.removeItem("groceryDriverName");
    localStorage.removeItem("groceryBranchId");
    localStorage.removeItem("groceryBranchName");
    setLocation("/grocery-driver");
  };

  const openNavigation = (address: string) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`, "_blank");
  };

  const statusSteps = ["accepted", "picked_up", "delivering", "delivered"];
  const statusLabels: Record<string, string> = {
    assigned: "Accept", accepted: "Mark Picked Up", picked_up: "Start Delivering", delivering: "Mark Delivered",
  };

  const getNextStatus = (current: string) => {
    const idx = statusSteps.indexOf(current);
    return idx >= 0 && idx < statusSteps.length - 1 ? statusSteps[idx + 1] : null;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-green-600 to-emerald-700 text-white p-4 sticky top-0 z-50">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="flex items-center gap-2">
            <Truck className="h-6 w-6" />
            <div>
              <p className="font-bold">{driverName}</p>
              <p className="text-xs opacity-80">{branchName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant={isOnDuty ? "default" : "secondary"} size="sm" onClick={toggleDuty} className={isOnDuty ? "bg-green-800 hover:bg-green-900" : ""} data-testid="button-toggle-duty">
              {isOnDuty ? "On Duty" : "Off Duty"}
            </Button>
            <Button variant="ghost" size="sm" onClick={logout} className="text-white hover:bg-white/20" data-testid="button-logout">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto p-4 space-y-4">
        {deliveries.length === 0 ? (
          <div className="text-center py-16">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No active deliveries</p>
            <p className="text-gray-400 text-sm">New orders will appear here when assigned</p>
          </div>
        ) : (
          deliveries.map((del: DeliveryOrder) => (
            <Card key={del.id} className="overflow-hidden" data-testid={`delivery-card-${del.orderId}`}>
              <CardHeader className="bg-green-50 p-4">
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    Order #{del.orderId.slice(0, 8)}
                  </span>
                  <Badge variant={del.deliveryStatus === "assigned" ? "destructive" : "default"}>
                    {del.deliveryStatus.replace("_", " ")}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="space-y-1">
                  <p className="flex items-center gap-2 font-medium"><User className="h-4 w-4" /> {del.order.customerName}</p>
                  {del.order.customerPhone && (
                    <a href={`tel:${del.order.customerPhone}`} className="flex items-center gap-2 text-sm text-blue-600">
                      <Phone className="h-4 w-4" /> {del.order.customerPhone}
                    </a>
                  )}
                  {del.order.customerAddress && (
                    <p className="flex items-center gap-2 text-sm"><MapPin className="h-4 w-4" /> {del.order.customerAddress}</p>
                  )}
                  {del.order.notes && <p className="text-sm text-muted-foreground">Notes: {del.order.notes}</p>}
                </div>

                <div className="border rounded p-2 space-y-1">
                  {del.items.map(item => (
                    <div key={item.id} className="flex items-center gap-2 text-sm">
                      {item.productImage && <img src={item.productImage} alt="" className="w-8 h-8 object-cover rounded" />}
                      <span className="flex-1">{item.productName} x{item.quantity}</span>
                      <span className="font-medium">{item.total}</span>
                    </div>
                  ))}
                  <div className="border-t pt-1 text-right font-bold">Total: {del.order.total}</div>
                </div>

                <div className="flex gap-2">
                  {del.order.customerAddress && (
                    <Button variant="outline" className="flex-1" onClick={() => openNavigation(del.order.customerAddress!)} data-testid={`navigate-${del.orderId}`}>
                      <Navigation className="h-4 w-4 mr-1" /> Navigate
                    </Button>
                  )}
                  {del.deliveryStatus === "assigned" ? (
                    <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => updateDeliveryStatus(del.orderId, "accepted")} data-testid={`accept-${del.orderId}`}>
                      <CheckCircle className="h-4 w-4 mr-1" /> Accept
                    </Button>
                  ) : (
                    (() => {
                      const next = getNextStatus(del.deliveryStatus);
                      return next ? (
                        <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => updateDeliveryStatus(del.orderId, next)} data-testid={`next-status-${del.orderId}`}>
                          <ChevronRight className="h-4 w-4 mr-1" /> {statusLabels[del.deliveryStatus] || next.replace("_", " ")}
                        </Button>
                      ) : null;
                    })()
                  )}
                </div>

                <div className="flex gap-1">
                  {statusSteps.map((step, i) => (
                    <div key={step} className={`flex-1 h-1.5 rounded-full ${statusSteps.indexOf(del.deliveryStatus) >= i ? "bg-green-500" : "bg-gray-200"}`} />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
