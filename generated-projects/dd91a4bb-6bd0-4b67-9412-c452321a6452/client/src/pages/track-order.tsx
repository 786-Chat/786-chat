import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Car, MapPin, Phone, Clock, Package, CheckCircle, Navigation, Loader2, ChefHat, Bike, ArrowLeft, Satellite, Route, AlertTriangle } from "lucide-react";
import { getBranchFeatures } from "@/lib/api";

interface TrackingData {
  order: {
    id: string;
    orderNumber: number;
    status: string;
    type: string;
    customerName: string;
    address: string;
    estimatedDeliveryMinutes: number | null;
    statusMessage: string | null;
    createdAt: string;
  };
  delivery: {
    status: string;
    acceptedAt: string | null;
    pickedUpAt: string | null;
    deliveredAt: string | null;
  } | null;
  driver: {
    name: string;
    phone: string;
    vehicleType: string | null;
  } | null;
  driverLocation: {
    lat: number;
    lng: number;
    updatedAt: string | null;
  } | null;
  restaurant: {
    id: string;
    name: string;
    address: string | null;
  } | null;
}

interface DriverLocationData {
  hasDriver: boolean;
  driver?: {
    id: string;
    name: string;
    phone: string;
    vehicleType: string | null;
  };
  currentLocation?: {
    lat: number;
    lng: number;
    updatedAt: string | null;
  };
  locationHistory?: Array<{
    lat: number;
    lng: number;
    timestamp: string;
    speed: number | null;
    heading: number | null;
  }>;
  deliveryStatus?: string;
  deliveryAddress?: string;
  restaurant?: {
    name: string;
    address: string | null;
    lat: number | null;
    lng: number | null;
  };
  message?: string;
}

export default function TrackOrderPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [liveLocation, setLiveLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const { data: tracking, isLoading, error, refetch } = useQuery<TrackingData>({
    queryKey: ["/api/track", orderId],
    queryFn: async () => {
      const res = await fetch(`/api/track/${orderId}`);
      if (!res.ok) throw new Error("Order not found");
      return res.json();
    },
    enabled: !!orderId,
    refetchInterval: 15000,
  });

  const { data: driverLocationData, refetch: refetchLocation } = useQuery<DriverLocationData>({
    queryKey: ["/api/orders", orderId, "driver-location"],
    queryFn: async () => {
      const res = await fetch(`/api/orders/${orderId}/driver-location`);
      if (!res.ok) throw new Error("Failed to get driver location");
      return res.json();
    },
    enabled: !!orderId && tracking?.delivery?.status !== 'completed',
    refetchInterval: 10000,
  });

  const restaurantId = tracking?.restaurant?.id;
  const { data: branchFeatures } = useQuery({
    queryKey: ["/api/branch-features", restaurantId],
    queryFn: () => getBranchFeatures(restaurantId!),
    enabled: !!restaurantId,
  });

  const isDeliveryTrackingEnabled = branchFeatures?.deliveryTracking ?? true;

  useEffect(() => {
    if (driverLocationData?.currentLocation) {
      setLiveLocation({
        lat: driverLocationData.currentLocation.lat,
        lng: driverLocationData.currentLocation.lng,
      });
      if (driverLocationData.currentLocation.updatedAt) {
        setLastUpdateTime(new Date(driverLocationData.currentLocation.updatedAt));
      }
    }
  }, [driverLocationData]);

  useEffect(() => {
    if (!orderId || tracking?.delivery?.status === 'completed') return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws?trackOrderId=${orderId}`;
    
    const connectWebSocket = () => {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[Tracking] WebSocket connected');
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'DRIVER_LOCATION_UPDATE') {
            setLiveLocation({
              lat: data.location.lat,
              lng: data.location.lng,
            });
            setLastUpdateTime(new Date(data.timestamp));
          }
        } catch (e) {
          console.error('[Tracking] Failed to parse message:', e);
        }
      };

      ws.onclose = () => {
        console.log('[Tracking] WebSocket disconnected');
        setIsConnected(false);
        setTimeout(connectWebSocket, 5000);
      };

      ws.onerror = (error) => {
        console.error('[Tracking] WebSocket error:', error);
      };
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [orderId, tracking?.delivery?.status]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-5 w-5" />;
      case 'confirmed': return <CheckCircle className="h-5 w-5" />;
      case 'preparing': return <ChefHat className="h-5 w-5" />;
      case 'ready': return <Package className="h-5 w-5" />;
      case 'assigned': return <Car className="h-5 w-5" />;
      case 'accepted': return <Car className="h-5 w-5" />;
      case 'picked_up': return <Navigation className="h-5 w-5" />;
      case 'delivering': return <Navigation className="h-5 w-5 animate-pulse" />;
      case 'completed': return <CheckCircle className="h-5 w-5" />;
      default: return <Package className="h-5 w-5" />;
    }
  };

  const getStatusLabel = (deliveryStatus: string | undefined) => {
    switch (deliveryStatus) {
      case 'assigned': return { label: 'Driver Assigned', color: 'bg-blue-500' };
      case 'accepted': return { label: 'Driver On The Way To Restaurant', color: 'bg-cyan-500' };
      case 'picked_up': return { label: 'Order Picked Up', color: 'bg-purple-500' };
      case 'delivering': return { label: 'Driver On The Way To You', color: 'bg-emerald-500 animate-pulse' };
      case 'completed': return { label: 'Delivered', color: 'bg-green-600' };
      default: return { label: 'Preparing Your Order', color: 'bg-amber-500' };
    }
  };

  const getVehicleIcon = (type: string | null) => {
    if (type === 'motorcycle' || type === 'bicycle') return <Bike className="h-6 w-6" />;
    return <Car className="h-6 w-6" />;
  };

  const formatTimeAgo = (date: Date | null) => {
    if (!date) return 'Unknown';
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 5) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    return date.toLocaleTimeString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (error || !tracking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <Card className="border-slate-700 bg-slate-800/50 max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <Package className="h-16 w-16 mx-auto mb-4 text-slate-500" />
            <p className="text-red-400 text-lg font-medium">Order Not Found</p>
            <p className="text-slate-400 text-sm mt-2">Please check your order ID and try again</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { order, delivery, driver, restaurant } = tracking;
  const statusInfo = getStatusLabel(delivery?.status);
  const isDeliveringNow = delivery?.status === 'delivering' || delivery?.status === 'picked_up' || delivery?.status === 'accepted';
  const showMap = isDeliveryTrackingEnabled && liveLocation && (delivery?.status === 'delivering' || delivery?.status === 'picked_up' || delivery?.status === 'accepted');
  const displayDriver = driverLocationData?.hasDriver ? driverLocationData.driver : driver;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur border-b border-slate-700 p-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
              <Navigation className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg">Track Order</h1>
              <p className="text-sm text-slate-400">#{String(order.orderNumber).padStart(3, '0')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isConnected && (
              <Badge variant="outline" className="border-emerald-500 text-emerald-400 text-xs">
                <span className="w-2 h-2 bg-emerald-500 rounded-full mr-1.5 animate-pulse"></span>
                Live
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { refetch(); refetchLocation(); }}
              className="text-cyan-400"
            >
              <Loader2 className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4 space-y-4">
        <Card className="border-slate-700 bg-slate-800/50 overflow-hidden">
          <div className={`${statusInfo.color} p-4`}>
            <div className="flex items-center gap-3">
              {getStatusIcon(delivery?.status || order.status)}
              <div>
                <p className="font-bold text-lg">{statusInfo.label}</p>
                {order.estimatedDeliveryMinutes && (
                  <p className="text-sm opacity-90">
                    Estimated: {order.estimatedDeliveryMinutes} mins
                  </p>
                )}
              </div>
            </div>
          </div>
          
          {order.statusMessage && (
            <div className="px-4 py-3 bg-slate-700/50 border-b border-slate-600">
              <p className="text-sm text-slate-300">{order.statusMessage}</p>
            </div>
          )}

          <CardContent className="pt-4">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-red-400 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-400">Delivery Address</p>
                  <p className="font-medium">{order.address}</p>
                </div>
              </div>

              {restaurant && (
                <div className="flex items-start gap-3">
                  <ChefHat className="h-5 w-5 text-amber-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-slate-400">Restaurant</p>
                    <p className="font-medium">{restaurant.name}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {displayDriver && (
          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                {getVehicleIcon(displayDriver.vehicleType)}
                Your Driver
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-lg">{displayDriver.name}</p>
                  {displayDriver.vehicleType && (
                    <p className="text-sm text-slate-400 capitalize">{displayDriver.vehicleType}</p>
                  )}
                </div>
                {displayDriver.phone && (
                  <a href={`tel:${displayDriver.phone}`}>
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                      <Phone className="h-4 w-4 mr-2" />
                      Call
                    </Button>
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {showMap && liveLocation && (
          <Card className="border-emerald-500/50 bg-emerald-500/10">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2 text-emerald-400">
                  <Satellite className="h-5 w-5 animate-pulse" />
                  Live Driver Location
                </CardTitle>
                {lastUpdateTime && (
                  <span className="text-xs text-slate-400">
                    Updated: {formatTimeAgo(lastUpdateTime)}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-slate-700 rounded-lg overflow-hidden relative">
                <iframe
                  src={`https://www.google.com/maps?q=${liveLocation.lat},${liveLocation.lng}&z=16&output=embed`}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Driver Location"
                />
                <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 rounded text-xs flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                  <span className="text-emerald-400">Live Tracking</span>
                </div>
                <div className="absolute top-2 right-2 bg-black/70 px-2 py-1 rounded text-xs text-slate-300">
                  {liveLocation.lat.toFixed(5)}, {liveLocation.lng.toFixed(5)}
                </div>
              </div>
              
              <div className="flex gap-2 mt-3">
                <a 
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(order.address)}&origin=${liveLocation.lat},${liveLocation.lng}&travelmode=driving`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button variant="outline" className="w-full border-emerald-500 text-emerald-400 hover:bg-emerald-500/20">
                    <Route className="h-4 w-4 mr-2" />
                    View Route
                  </Button>
                </a>
                <a 
                  href={`https://www.google.com/maps?q=${liveLocation.lat},${liveLocation.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button variant="outline" className="w-full border-cyan-500 text-cyan-400 hover:bg-cyan-500/20">
                    <Navigation className="h-4 w-4 mr-2" />
                    Open Map
                  </Button>
                </a>
              </div>

              <p className="text-xs text-slate-400 mt-3 text-center">
                {isConnected ? "Location updates in real-time via GPS" : "Reconnecting to live updates..."}
              </p>
            </CardContent>
          </Card>
        )}

        {driverLocationData?.hasDriver && !showMap && delivery?.status !== 'completed' && (
          <Card className="border-blue-500/50 bg-blue-500/10">
            <CardContent className="pt-6 text-center">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Car className="h-8 w-8 text-blue-400" />
              </div>
              <p className="text-slate-300">Driver is preparing to pick up your order</p>
              <p className="text-sm text-slate-400 mt-1">Live tracking will begin when the driver starts the delivery</p>
            </CardContent>
          </Card>
        )}

        {!driverLocationData?.hasDriver && !driver && delivery?.status !== 'completed' && (
          <Card className="border-slate-700 bg-slate-800/50">
            <CardContent className="pt-6 text-center">
              <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <ChefHat className="h-8 w-8 text-amber-400" />
              </div>
              <p className="text-slate-300">Your order is being prepared</p>
              <p className="text-sm text-slate-400 mt-1">A driver will be assigned soon</p>
            </CardContent>
          </Card>
        )}

        {delivery?.status === 'completed' && (
          <Card className="border-green-500/50 bg-green-500/10">
            <CardContent className="pt-6 text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
              <p className="text-green-300 font-medium text-lg">Order Delivered!</p>
              <p className="text-sm text-slate-400 mt-1">Thank you for your order</p>
            </CardContent>
          </Card>
        )}

        <div className="text-center text-sm text-slate-400 pt-4">
          <p>Order placed at {new Date(order.createdAt).toLocaleTimeString()}</p>
          <p className="mt-1">Thank you for your order, {order.customerName}!</p>
        </div>
      </main>
    </div>
  );
}
