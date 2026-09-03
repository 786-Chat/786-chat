import { useState, useEffect, useRef } from "react";
import { useParams } from "wouter";
import {
  Package, MapPin, Phone, User, Clock, CheckCircle, Truck,
  ShoppingCart, Loader2, Navigation
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type TrackingData = {
  order: { id: string; customerName: string; customerPhone: string | null; customerAddress: string | null; status: string; subtotal: string; deliveryCharge: string; discount: string; total: string; notes: string | null; createdAt: string; };
  branch: { id: string; name: string; themeColor: string; logo: string | null; address: string | null; phone: string | null; currency: string; } | null;
  items: { id: string; productName: string; productImage: string | null; price: string; quantity: number; total: string; }[];
  delivery: { id: string; deliveryStatus: string; assignedAt: string | null; acceptedAt: string | null; pickedUpAt: string | null; deliveredAt: string | null; } | null;
  driver: { id: string; name: string; phone: string; vehicleType: string; lastLocationLat: string | null; lastLocationLng: string | null; } | null;
};

export default function GroceryTrackOrder() {
  const { orderId } = useParams<{ orderId: string }>();
  const [tracking, setTracking] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [driverLat, setDriverLat] = useState<number | null>(null);
  const [driverLng, setDriverLng] = useState<number | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!orderId) return;
    fetch(`/api/grocery/order-tracking/${orderId}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); setLoading(false); return; }
        setTracking(data);
        if (data.driver?.lastLocationLat && data.driver?.lastLocationLng) {
          setDriverLat(parseFloat(data.driver.lastLocationLat));
          setDriverLng(parseFloat(data.driver.lastLocationLng));
        }
        setLoading(false);
      })
      .catch(() => { setError("Failed to load tracking data"); setLoading(false); });
  }, [orderId]);

  useEffect(() => {
    if (!orderId) return;
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/grocery-ws?groceryTrackOrderId=${orderId}`);
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === "driver_location") {
        setDriverLat(data.lat);
        setDriverLng(data.lng);
      }
      if (data.type === "order_status" || data.type === "delivery_status") {
        fetch(`/api/grocery/order-tracking/${orderId}`)
          .then(r => r.json())
          .then(d => { if (!d.error) setTracking(d); });
      }
    };
    return () => ws.close();
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-green-600" />
      </div>
    );
  }

  if (error || !tracking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-700 mb-2">Order Not Found</h2>
          <p className="text-gray-500">{error || "Unable to track this order"}</p>
        </div>
      </div>
    );
  }

  const { order, branch, items, delivery, driver } = tracking;
  const themeColor = branch?.themeColor || "#16a34a";
  const currency = branch?.currency || "£";

  const allSteps = [
    { key: "confirmed", label: "Confirmed", icon: CheckCircle },
    { key: "preparing", label: "Preparing", icon: Package },
    { key: "ready", label: "Ready", icon: ShoppingCart },
    { key: "delivering", label: "On The Way", icon: Truck },
    { key: "completed", label: "Delivered", icon: CheckCircle },
  ];
  const statusOrder = ["pending", "confirmed", "preparing", "ready", "delivering", "completed"];
  const currentIdx = statusOrder.indexOf(order.status);

  const mapUrl = driverLat && driverLng
    ? `https://www.google.com/maps/embed/v1/place?key=REPLACE_WITH_VITE_GOOGLE_MAPS_API_KEY&q=${driverLat},${driverLng}&zoom=15`
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 shadow-lg p-4 text-white" style={{ background: `linear-gradient(135deg, ${themeColor}, ${themeColor}dd)` }}>
        <div className="max-w-lg mx-auto flex items-center gap-3">
          {branch?.logo && <img src={branch.logo} alt="" className="h-10 w-10 rounded-full object-cover" />}
          <div>
            <h1 className="font-bold text-lg">{branch?.name || "Grocery"}</h1>
            <p className="text-xs opacity-80">Order Tracking</p>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto p-4 space-y-4">
        {order.status === "cancelled" && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-5 text-center">
              <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
                <span className="text-3xl">❌</span>
              </div>
              <h2 className="text-lg font-bold text-red-700 mb-1">Order Cancelled</h2>
              <p className="text-sm text-red-600">This order has been cancelled by the shop.</p>
              <p className="text-sm text-red-500 mt-1">If you paid by card, your payment will be refunded automatically.</p>
            </CardContent>
          </Card>
        )}

        {order.status === "ready" && (
          <Card className="border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg">
            <CardContent className="p-5 text-center">
              <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3 animate-bounce">
                <span className="text-4xl">🎉</span>
              </div>
              <h2 className="text-xl font-bold text-green-700 mb-1">Your Order is Ready!</h2>
              <p className="text-2xl font-bold" style={{ color: themeColor }}>Order #{order.id.slice(-4).toUpperCase()}</p>
              <p className="text-sm text-green-600 mt-2">Your order is ready for collection. Please visit the store to pick it up.</p>
            </CardContent>
          </Card>
        )}

        {order.status !== "cancelled" && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-base">
                <span>Order #{order.id.slice(-4).toUpperCase()}</span>
                <Badge style={{ backgroundColor: themeColor, color: "white" }}>{order.status}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 my-4">
                {allSteps.map((step, i) => {
                  const stepIdx = statusOrder.indexOf(step.key);
                  const isActive = currentIdx >= stepIdx;
                  return (
                    <div key={step.key} className="flex-1 flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${isActive ? "text-white" : "bg-gray-200 text-gray-400"}`} style={isActive ? { backgroundColor: themeColor } : {}}>
                        <step.icon className="h-4 w-4" />
                      </div>
                      <p className={`text-[10px] mt-1 text-center ${isActive ? "font-semibold" : "text-gray-400"}`}>{step.label}</p>
                      {i < allSteps.length - 1 && <div className={`h-0.5 w-full mt-1 ${currentIdx > stepIdx ? "" : "bg-gray-200"}`} style={currentIdx > stepIdx ? { backgroundColor: themeColor } : {}} />}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {driver && (delivery?.deliveryStatus === "accepted" || delivery?.deliveryStatus === "picked_up" || delivery?.deliveryStatus === "delivering") && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Truck className="h-5 w-5" style={{ color: themeColor }} /> Your Driver
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full flex items-center justify-center" style={{ backgroundColor: `${themeColor}20` }}>
                    <User className="h-6 w-6" style={{ color: themeColor }} />
                  </div>
                  <div>
                    <p className="font-semibold">{driver.name}</p>
                    <p className="text-sm text-muted-foreground capitalize">{driver.vehicleType}</p>
                  </div>
                </div>
                <a href={`tel:${driver.phone}`}>
                  <Button variant="outline" size="sm"><Phone className="h-4 w-4 mr-1" /> Call</Button>
                </a>
              </div>

              {mapUrl && (
                <div className="rounded-lg overflow-hidden border" style={{ height: 250 }}>
                  <iframe src={mapUrl} width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                </div>
              )}

              {driverLat && driverLng && (
                <a href={`https://www.google.com/maps?q=${driverLat},${driverLng}`} target="_blank" rel="noopener noreferrer" className="block">
                  <Button variant="outline" className="w-full"><Navigation className="h-4 w-4 mr-2" /> View Driver on Full Map</Button>
                </a>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Order Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {items.map(item => (
              <div key={item.id} className="flex items-center gap-3 p-2 border rounded">
                {item.productImage && <img src={item.productImage} alt="" className="w-10 h-10 object-cover rounded" />}
                <div className="flex-1">
                  <p className="font-medium text-sm">{item.productName}</p>
                  <p className="text-xs text-muted-foreground">x{item.quantity} @ {currency}{item.price}</p>
                </div>
                <p className="font-semibold text-sm">{currency}{item.total}</p>
              </div>
            ))}
            <div className="border-t pt-2 space-y-1 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>{currency}{order.subtotal}</span></div>
              <div className="flex justify-between"><span>Delivery</span><span>{currency}{order.deliveryCharge}</span></div>
              {parseFloat(order.discount) > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-{currency}{order.discount}</span></div>}
              <div className="flex justify-between font-bold text-base border-t pt-1"><span>Total</span><span>{currency}{order.total}</span></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1 text-sm">
            <p className="flex items-center gap-2"><User className="h-4 w-4" /> {order.customerName}</p>
            {order.customerAddress && <p className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {order.customerAddress}</p>}
            <p className="flex items-center gap-2"><Clock className="h-4 w-4" /> {new Date(order.createdAt).toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
