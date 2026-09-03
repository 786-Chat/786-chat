import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Car, MapPin, Phone, User, Navigation, Shield, Star,
  LogOut, X, ChevronRight, Clock, PoundSterling, Check,
  AlertCircle, Loader2, Smartphone, Lock, ArrowRight,
  Bike, Bus,
} from "lucide-react";

const VEHICLE_ICONS: Record<string, any> = {
  sedan_5: Car,
  mpv_7: Bus,
  motorbike: Bike,
};

const VEHICLE_LABELS: Record<string, string> = {
  sedan_5: "Sedan (5 Seats)",
  mpv_7: "MPV (7 Seats)",
  motorbike: "Motorbike",
};

function getPriceCategory(pricePerMile: number, allPrices: number[]): string {
  if (allPrices.length === 0) return "green";
  const sorted = [...allPrices].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q2 = sorted[Math.floor(sorted.length * 0.5)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  if (pricePerMile <= q1) return "green";
  if (pricePerMile <= q2) return "yellow";
  if (pricePerMile <= q3) return "orange";
  return "red";
}

const COLOR_MAP: Record<string, { bg: string; text: string; glow: string; label: string }> = {
  green: { bg: "bg-green-500", text: "text-green-400", glow: "shadow-green-500/50", label: "Low Price" },
  yellow: { bg: "bg-yellow-500", text: "text-yellow-400", glow: "shadow-yellow-500/50", label: "Medium Price" },
  orange: { bg: "bg-orange-500", text: "text-orange-400", glow: "shadow-orange-500/50", label: "Average Price" },
  red: { bg: "bg-red-500", text: "text-red-400", glow: "shadow-red-500/50", label: "Premium Price" },
};

const CUST_CAR_COLORS = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316"];

function makeCustomerCarSvg(rotation: number, color: string, name: string): string {
  const r = rotation - 90;
  const darken = (hex: string, amt: number) => {
    const n = parseInt(hex.slice(1), 16);
    return `rgb(${Math.max(0,(n>>16)-amt)},${Math.max(0,((n>>8)&0xff)-amt)},${Math.max(0,(n&0xff)-amt)})`;
  };
  const dark = darken(color, 40);
  return `<div style="position:relative;width:52px;height:64px;">
    <div style="position:absolute;left:50%;top:50%;width:52px;height:52px;margin-left:-26px;margin-top:-32px;">
      <div style="width:52px;height:52px;filter:drop-shadow(0 4px 10px rgba(0,0,0,0.7));transform:rotate(${r}deg);transform-origin:center center;">
        <svg viewBox="0 0 60 60" width="52" height="52">
          <rect x="18" y="4" width="24" height="52" rx="12" fill="${dark}" stroke="rgba(255,255,255,0.25)" stroke-width="0.8"/>
          <rect x="20" y="6" width="20" height="48" rx="10" fill="${color}"/>
          <rect x="21" y="12" width="18" height="10" rx="3" fill="rgba(200,240,255,0.45)" stroke="rgba(255,255,255,0.3)" stroke-width="0.5"/>
          <rect x="21" y="38" width="18" height="8" rx="3" fill="rgba(200,240,255,0.35)" stroke="rgba(255,255,255,0.2)" stroke-width="0.5"/>
          <rect x="15" y="16" width="5" height="9" rx="2" fill="${dark}" stroke="rgba(255,255,255,0.15)" stroke-width="0.5"/>
          <rect x="40" y="16" width="5" height="9" rx="2" fill="${dark}" stroke="rgba(255,255,255,0.15)" stroke-width="0.5"/>
          <rect x="15" y="35" width="5" height="9" rx="2" fill="${dark}" stroke="rgba(255,255,255,0.15)" stroke-width="0.5"/>
          <rect x="40" y="35" width="5" height="9" rx="2" fill="${dark}" stroke="rgba(255,255,255,0.15)" stroke-width="0.5"/>
          <circle cx="23" cy="7" r="2" fill="rgba(255,255,200,0.95)"/>
          <circle cx="37" cy="7" r="2" fill="rgba(255,255,200,0.95)"/>
          <rect x="23" y="50" width="6" height="3" rx="1.5" fill="rgba(255,80,80,0.85)"/>
          <rect x="31" y="50" width="6" height="3" rx="1.5" fill="rgba(255,80,80,0.85)"/>
        </svg>
      </div>
    </div>
    <div style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);white-space:nowrap;font-size:9px;font-weight:700;color:#fff;background:${color};padding:1px 7px;border-radius:8px;box-shadow:0 2px 6px rgba(0,0,0,0.5);">${name}</div>
  </div>`;
}

function CustomerMapView({ drivers, allPrices, onSelectDriver, primaryColor, secondaryColor }: {
  drivers: any[]; allPrices: number[]; onSelectDriver: (d: any) => void; primaryColor: string; secondaryColor: string;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const simRef = useRef<Record<string, { lat: number; lng: number; angle: number; speed: number }>>({});
  const [tick, setTick] = useState(0);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    const starts = [
      { lat: 51.5120, lng: -0.1000 }, { lat: 51.5060, lng: -0.1150 },
      { lat: 51.5180, lng: -0.0850 }, { lat: 51.5040, lng: -0.0950 },
    ];
    drivers.forEach((d: any, i: number) => {
      if (!simRef.current[d.id]) {
        const s = starts[i % starts.length];
        simRef.current[d.id] = {
          lat: (d.lastLocationLat ? parseFloat(d.lastLocationLat) : s.lat) + (Math.random() - 0.5) * 0.006,
          lng: (d.lastLocationLng ? parseFloat(d.lastLocationLng) : s.lng) + (Math.random() - 0.5) * 0.006,
          angle: Math.random() * Math.PI * 2,
          speed: 0.00012 + Math.random() * 0.0002,
        };
      }
    });
  }, [drivers]);

  useEffect(() => {
    const iv = setInterval(() => {
      const ctr = { lat: 51.510, lng: -0.100 };
      Object.values(simRef.current).forEach((pos: any) => {
        pos.angle += (Math.random() - 0.5) * 1.0;
        pos.lat += Math.sin(pos.angle) * pos.speed;
        pos.lng += Math.cos(pos.angle) * pos.speed;
        const d = Math.sqrt((pos.lat - ctr.lat) ** 2 + (pos.lng - ctr.lng) ** 2);
        if (d > 0.02) pos.angle = Math.atan2(ctr.lat - pos.lat, ctr.lng - pos.lng) + (Math.random() - 0.5) * 0.4;
      });
      setTick(t => t + 1);
    }, 2500);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const init = async () => {
      const L = (await import("leaflet")).default;
      if (!document.querySelector('link[href*="leaflet"]')) {
        const lk = document.createElement("link"); lk.rel = "stylesheet";
        lk.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"; document.head.appendChild(lk);
      }
      if (!mapRef.current || mapInstanceRef.current) return;
      const map = L.map(mapRef.current, { zoomControl: false }).setView([51.510, -0.100], 15);
      L.control.zoom({ position: "bottomright" }).addTo(map);
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", { maxZoom: 19 }).addTo(map);
      mapInstanceRef.current = map;
    };
    init();
    return () => { if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; } };
  }, []);

  useEffect(() => {
    const update = async () => {
      const L = (await import("leaflet")).default;
      const map = mapInstanceRef.current;
      if (!map) return;
      markersRef.current.forEach(m => map.removeLayer(m));
      markersRef.current = [];
      drivers.forEach((driver: any, idx: number) => {
        const color = CUST_CAR_COLORS[idx % CUST_CAR_COLORS.length];
        const pos = simRef.current[driver.id];
        if (!pos) return;
        const icon = L.divIcon({
          html: makeCustomerCarSvg(pos.angle * 180 / Math.PI, color, driver.name?.split(" ")[0] || "Driver"),
          className: "", iconSize: [52, 64], iconAnchor: [26, 32],
        });
        const marker = L.marker([pos.lat, pos.lng], { icon })
          .addTo(map)
          .on("click", () => onSelectDriver(driver));
        markersRef.current.push(marker);
      });
    };
    update();
  }, [drivers, tick]);

  return (
    <div className="mt-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Nearby Drivers</h2>
          <p className="text-gray-400 text-sm">{drivers.length} driver{drivers.length !== 1 ? "s" : ""} on duty near you</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-green-400 font-medium">Live</span>
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl" style={{ height: "380px" }}>
        <div ref={mapRef} className="w-full h-full" />
      </div>

      {drivers.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-10 text-center">
          <Car className="h-12 w-12 text-gray-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold mb-1">No Drivers Available</h3>
          <p className="text-gray-400 text-sm">Check back soon — drivers will appear when they go on duty</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Tap a driver to book</p>
          {drivers.map((driver: any, idx: number) => {
            const pricePerMile = parseFloat(driver.pricing?.pricePerMile || "2");
            const category = getPriceCategory(pricePerMile, allPrices);
            const colors = COLOR_MAP[category];
            const carColor = CUST_CAR_COLORS[idx % CUST_CAR_COLORS.length];
            const VehicleIcon = VEHICLE_ICONS[driver.vehicleType] || Car;
            return (
              <button
                key={driver.id}
                onClick={() => onSelectDriver(driver)}
                onMouseEnter={() => setHoveredId(driver.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`w-full bg-white/5 backdrop-blur-sm border rounded-2xl p-4 text-left transition-all group ${hoveredId === driver.id ? "border-white/30 bg-white/10 scale-[1.01]" : "border-white/10 hover:border-white/20 hover:bg-white/8"}`}
                data-testid={`card-driver-${driver.id}`}
              >
                <div className="flex items-center gap-4">
                  <div className="relative shrink-0">
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center overflow-hidden border-2" style={{ borderColor: carColor, background: `${carColor}15` }}>
                      {driver.photo ? (
                        <img src={driver.photo} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <User className="h-7 w-7" style={{ color: carColor }} />
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: carColor }}>
                      <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold truncate">{driver.name}</p>
                      <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                    </div>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <VehicleIcon className="h-3 w-3" />
                      {VEHICLE_LABELS[driver.vehicleType] || "Sedan"}
                      {driver.carModel && <span> • {driver.carModel}</span>}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold" style={{ color: carColor }}>£{pricePerMile.toFixed(2)}</p>
                    <p className="text-[10px] text-gray-500">per mile</p>
                  </div>

                  <ChevronRight className="h-5 w-5 text-gray-600 group-hover:text-white transition-colors shrink-0" />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function TaxiCustomerPage() {
  const { brandSlug } = useParams<{ brandSlug: string }>();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);

  const [step, setStep] = useState<"login" | "register" | "map" | "driver_detail" | "booking" | "tracking">("login");
  const [customerId, setCustomerId] = useState(localStorage.getItem("taxiCustomerId") || "");
  const [customerName, setCustomerName] = useState(localStorage.getItem("taxiCustomerName") || "");

  const [loginPhone, setLoginPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loginError, setLoginError] = useState("");

  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regAddress, setRegAddress] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPin, setRegPin] = useState("");

  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [pickupAddress, setPickupAddress] = useState("");
  const [dropoffAddress, setDropoffAddress] = useState("");
  const [stops, setStops] = useState<string[]>([]);
  const [estimatedDistance, setEstimatedDistance] = useState("");
  const [calculatedPrice, setCalculatedPrice] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [activeRide, setActiveRide] = useState<any>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (customerId) setStep("map");
  }, [customerId]);

  const { data: brandData, isLoading: brandLoading } = useQuery({
    queryKey: ["/api/taxi-drivers/on-duty", brandSlug],
    queryFn: () => fetch(`/api/taxi-drivers/on-duty/${brandSlug}`).then(r => r.json()),
    enabled: !!brandSlug,
    refetchInterval: 8000,
  });

  const brand = brandData?.brand;
  const drivers = brandData?.drivers || [];

  const allPrices = useMemo(() =>
    drivers.map((d: any) => parseFloat(d.pricing?.pricePerMile || "2")).filter((p: number) => !isNaN(p)),
    [drivers]
  );

  const { data: customerRides = [] } = useQuery({
    queryKey: ["/api/taxi-rides", customerId],
    queryFn: () => fetch(`/api/taxi-rides?customerId=${customerId}`).then(r => r.json()),
    enabled: !!customerId,
    refetchInterval: 5000,
  });

  useEffect(() => {
    const active = customerRides.find((r: any) =>
      ["requested", "accepted", "driver_arriving", "otp_verified", "in_progress"].includes(r.status)
    );
    if (active) {
      setActiveRide(active);
      setStep("tracking");
    }
  }, [customerRides]);

  useEffect(() => {
    if (!customerId) return;
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/taxi-ws`);
    wsRef.current = ws;
    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "register_customer", customerId }));
    };
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "ride_update") {
          setActiveRide(msg.ride);
          queryClient.invalidateQueries({ queryKey: ["/api/taxi-rides"] });
        }
        if (msg.type === "driver_location") {
          queryClient.invalidateQueries({ queryKey: ["/api/taxi-drivers/on-duty"] });
        }
      } catch {}
    };
    return () => { ws.close(); };
  }, [customerId, queryClient]);

  const requestOtpMutation = useMutation({
    mutationFn: () => fetch("/api/taxi-customers/request-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: loginPhone }),
    }).then(r => r.json().then(d => ({ ok: r.ok, data: d }))),
    onSuccess: (result) => {
      if (!result.ok) { setLoginError(result.data.error); return; }
      setOtpSent(true);
      setLoginError("");
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: () => fetch("/api/taxi-customers/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: loginPhone, otp: otpCode }),
    }).then(r => r.json().then(d => ({ ok: r.ok, data: d }))),
    onSuccess: (result) => {
      if (!result.ok) { setLoginError(result.data.error); return; }
      localStorage.setItem("taxiCustomerId", result.data.customer.id);
      localStorage.setItem("taxiCustomerName", result.data.customer.name);
      setCustomerId(result.data.customer.id);
      setCustomerName(result.data.customer.name);
      setStep("map");
    },
  });

  const registerMutation = useMutation({
    mutationFn: () => fetch("/api/taxi-customers/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: regName, phone: regPhone, address: regAddress, email: regEmail, pin: regPin }),
    }).then(r => r.json().then(d => ({ ok: r.ok, data: d }))),
    onSuccess: (result) => {
      if (!result.ok) { setLoginError(result.data.error); return; }
      localStorage.setItem("taxiCustomerId", result.data.id);
      localStorage.setItem("taxiCustomerName", result.data.name);
      setCustomerId(result.data.id);
      setCustomerName(result.data.name);
      setStep("map");
    },
  });

  const calculatePriceMutation = useMutation({
    mutationFn: () => fetch("/api/taxi-rides/calculate-price", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ driverId: selectedDriver?.id, distanceMiles: parseFloat(estimatedDistance) || 0, stops: stops.filter(s => s.trim()) }),
    }).then(r => r.json()),
    onSuccess: (data) => setCalculatedPrice(data),
  });

  const requestRideMutation = useMutation({
    mutationFn: () => fetch("/api/taxi-rides", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId,
        driverId: selectedDriver.id,
        brandId: brand.id,
        pickupAddress,
        dropoffAddress,
        stops: stops.filter(s => s.trim()),
        distanceMiles: estimatedDistance,
        estimatedPrice: String(calculatedPrice?.estimatedPrice || 0),
        priceBreakdown: calculatedPrice?.breakdown,
        paymentMethod,
      }),
    }).then(r => r.json()),
    onSuccess: (ride) => {
      setActiveRide(ride);
      setStep("tracking");
    },
  });

  const handleLogout = () => {
    localStorage.removeItem("taxiCustomerId");
    localStorage.removeItem("taxiCustomerName");
    setCustomerId("");
    setCustomerName("");
    setStep("login");
  };

  const primaryColor = brand?.primaryColor || "#1a1a2e";
  const secondaryColor = brand?.secondaryColor || "#e94560";
  const currencySymbol = ({ GBP: "£", USD: "$", EUR: "€", PKR: "₨", INR: "₹", AED: "د.إ", SAR: "﷼", TRY: "₺" } as Record<string, string>)[brand?.currency || "GBP"] || "£";

  useEffect(() => {
    if (brand && !paymentMethod) {
      setPaymentMethod("online");
    }
  }, [brand, paymentMethod]);

  if (brandLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Brand Not Found</h1>
          <p className="text-gray-400">This taxi service doesn't exist</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white" style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, #0a0a1a 50%, ${primaryColor} 100%)` }}>
      <nav className="sticky top-0 z-50 backdrop-blur-md border-b border-white/10 px-4 py-3" style={{ background: `${primaryColor}ee` }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {brand.logo && <img src={brand.logo} alt="" className="h-10 object-contain" />}
            <h1 className="text-xl font-bold">{brand.name}</h1>
          </div>
          {customerId && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-300 hidden sm:block">{customerName}</span>
              <button onClick={handleLogout} className="p-2 hover:bg-white/10 rounded-xl transition-all" data-testid="button-logout-customer">
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-4">
        {step === "login" && (
          <div className="max-w-md mx-auto mt-12">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4 shadow-2xl" style={{ background: `linear-gradient(135deg, ${secondaryColor}, ${primaryColor})` }}>
                <Car className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold">Welcome to {brand.name}</h2>
              <p className="text-gray-400 mt-2">Enter your phone number to get started</p>
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
              {loginError && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm">{loginError}</div>
              )}

              {!otpSent ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="tel"
                        value={loginPhone}
                        onChange={(e) => setLoginPhone(e.target.value)}
                        placeholder="07xxx xxx xxx"
                        className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
                        data-testid="input-login-phone"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => requestOtpMutation.mutate()}
                    disabled={!loginPhone || requestOtpMutation.isPending}
                    className="w-full py-3.5 rounded-xl font-bold transition-all disabled:opacity-50"
                    style={{ background: secondaryColor }}
                    data-testid="button-request-otp"
                  >
                    {requestOtpMutation.isPending ? "Sending..." : "Send OTP"}
                  </button>
                  <p className="text-center text-sm text-gray-400">
                    New here?{" "}
                    <button onClick={() => setStep("register")} className="underline hover:text-white" data-testid="link-register">
                      Register first
                    </button>
                  </p>

                  <div className="border-t border-white/10 pt-4 mt-2">
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const res = await fetch("/api/taxi-customers/test-login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ brandSlug }) });
                          const data = await res.json();
                          if (data.customer) {
                            localStorage.setItem("taxiCustomerId", data.customer.id);
                            localStorage.setItem("taxiCustomerName", data.customer.name);
                            setCustomerId(data.customer.id);
                            setCustomerName(data.customer.name);
                            setStep("map");
                          }
                        } catch {}
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border border-emerald-500/30 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 transition-all"
                      data-testid="button-test-login-customer"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                      Quick Test Login
                    </button>
                    <p className="text-center text-gray-600 text-xs mt-1.5">Skip OTP — instant test access</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-400">Enter the OTP sent to your phone</p>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="Enter 6-digit OTP"
                      maxLength={6}
                      className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 text-center text-2xl tracking-widest"
                      data-testid="input-otp"
                    />
                  </div>
                  <button
                    onClick={() => verifyOtpMutation.mutate()}
                    disabled={otpCode.length < 6 || verifyOtpMutation.isPending}
                    className="w-full py-3.5 rounded-xl font-bold transition-all disabled:opacity-50"
                    style={{ background: secondaryColor }}
                    data-testid="button-verify-otp"
                  >
                    {verifyOtpMutation.isPending ? "Verifying..." : "Verify OTP"}
                  </button>
                  <div className="border-t border-white/10 pt-3 mt-1">
                    <button
                      type="button"
                      onClick={() => { setOtpCode("111111"); }}
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-medium border border-cyan-500/30 text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 transition-all"
                      data-testid="button-fill-test-otp"
                    >
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                      Use Test OTP: 111111
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setOtpSent(false); setOtpCode(""); setLoginError(""); }}
                    className="w-full text-center text-sm text-gray-500 hover:text-gray-300 transition-all"
                  >
                    ← Back to phone number
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {step === "register" && (
          <div className="max-w-md mx-auto mt-12">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold">Create Your Account</h2>
              <p className="text-gray-400 mt-2">Fill in your details to get started</p>
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
              {loginError && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm">{loginError}</div>
              )}
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Full Name *</label>
                  <input type="text" value={regName} onChange={(e) => setRegName(e.target.value)} placeholder="Your full name" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50" data-testid="input-reg-name" />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Phone Number *</label>
                  <input type="tel" value={regPhone} onChange={(e) => setRegPhone(e.target.value)} placeholder="07xxx xxx xxx" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50" data-testid="input-reg-phone" />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Email</label>
                  <input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} placeholder="your@email.com" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50" data-testid="input-reg-email" />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Address</label>
                  <input type="text" value={regAddress} onChange={(e) => setRegAddress(e.target.value)} placeholder="Your address" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50" data-testid="input-reg-address" />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">PIN (4 digits)</label>
                  <input type="password" value={regPin} onChange={(e) => setRegPin(e.target.value)} placeholder="Set a 4-digit PIN" maxLength={4} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50" data-testid="input-reg-pin" />
                </div>
                <button
                  onClick={() => registerMutation.mutate()}
                  disabled={!regName || !regPhone || registerMutation.isPending}
                  className="w-full py-3.5 rounded-xl font-bold transition-all disabled:opacity-50"
                  style={{ background: secondaryColor }}
                  data-testid="button-register"
                >
                  {registerMutation.isPending ? "Creating..." : "Create Account"}
                </button>
                <p className="text-center text-sm text-gray-400">
                  Already have an account?{" "}
                  <button onClick={() => setStep("login")} className="underline hover:text-white">
                    Login
                  </button>
                </p>
              </div>
            </div>
          </div>
        )}

        {step === "map" && (
          <CustomerMapView
            drivers={drivers}
            allPrices={allPrices}
            onSelectDriver={(driver: any) => { setSelectedDriver(driver); setStep("driver_detail"); }}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
          />
        )}

        {step === "driver_detail" && selectedDriver && (
          <div className="max-w-2xl mx-auto mt-4 space-y-6">
            <button onClick={() => { setSelectedDriver(null); setStep("map"); }} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors" data-testid="button-back-to-map">
              <ArrowRight className="h-4 w-4 rotate-180" /> Back to drivers
            </button>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center overflow-hidden">
                  {selectedDriver.photo ? (
                    <img src={selectedDriver.photo} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User className="h-10 w-10 text-white" />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{selectedDriver.name}</h3>
                  <p className="text-gray-400">{VEHICLE_LABELS[selectedDriver.vehicleType] || "Sedan"}</p>
                  {selectedDriver.carModel && <p className="text-sm text-gray-500">{selectedDriver.carModel} • {selectedDriver.carColor} • {selectedDriver.numberPlate}</p>}
                </div>
              </div>

              {selectedDriver.carImage && (
                <div className="mb-6 rounded-2xl overflow-hidden">
                  <img src={selectedDriver.carImage} alt="Vehicle" className="w-full h-48 object-cover" />
                </div>
              )}

              <div className="mb-6">
                <h4 className="font-bold mb-3 flex items-center gap-2">
                  <PoundSterling className="h-5 w-5 text-yellow-400" />
                  Today's Pricing
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-white/5 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-400">Per Mile</p>
                    <p className="text-lg font-bold text-yellow-400">£{parseFloat(selectedDriver.pricing?.pricePerMile || "2").toFixed(2)}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-400">Min Fare</p>
                    <p className="text-lg font-bold">£{parseFloat(selectedDriver.pricing?.minimumFare || "6").toFixed(2)}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-400">Wait £/min</p>
                    <p className="text-lg font-bold">£{parseFloat(selectedDriver.pricing?.waitingChargePerMin || "0.30").toFixed(2)}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-400">Free Stops</p>
                    <p className="text-lg font-bold">{selectedDriver.pricing?.freeStops || 0}</p>
                  </div>
                </div>
                {(selectedDriver.pricing?.freeWaitingMins || 0) > 0 && (
                  <p className="text-sm text-green-400 mt-2">First {selectedDriver.pricing.freeWaitingMins} minutes waiting free</p>
                )}
                {(selectedDriver.pricing?.chargePerExtraStop || 0) > 0 && (
                  <p className="text-sm text-gray-400 mt-1">Extra stops: £{parseFloat(selectedDriver.pricing.chargePerExtraStop).toFixed(2)} each</p>
                )}
              </div>

              <button
                onClick={() => setStep("booking")}
                className="w-full py-3.5 rounded-xl font-bold transition-all text-white"
                style={{ background: secondaryColor }}
                data-testid="button-book-this-driver"
              >
                Book This Driver
              </button>
            </div>
          </div>
        )}

        {step === "booking" && selectedDriver && (
          <div className="max-w-md mx-auto mt-4 space-y-6">
            <button onClick={() => setStep("driver_detail")} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
              <ArrowRight className="h-4 w-4 rotate-180" /> Back to driver
            </button>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6">
              <h3 className="text-xl font-bold mb-6">Book Your Ride</h3>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-green-400" /> Pickup Location
                  </label>
                  <input
                    type="text"
                    value={pickupAddress}
                    onChange={(e) => setPickupAddress(e.target.value)}
                    placeholder="Enter pickup address or postcode"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50"
                    data-testid="input-pickup"
                  />
                </div>

                {stops.map((stop, index) => (
                  <div key={index}>
                    <label className="text-sm text-gray-400 mb-1 block flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-yellow-400" /> Stop {index + 1}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={stop}
                        onChange={(e) => { const newStops = [...stops]; newStops[index] = e.target.value; setStops(newStops); }}
                        placeholder={`Stop ${index + 1} address`}
                        className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50"
                        data-testid={`input-stop-${index}`}
                      />
                      <button onClick={() => setStops(stops.filter((_, i) => i !== index))} className="px-3 py-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 hover:bg-red-500/30 transition-all" data-testid={`button-remove-stop-${index}`}>
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => setStops([...stops, ""])}
                  className="w-full py-2.5 border border-dashed border-yellow-500/30 rounded-xl text-yellow-400 text-sm hover:bg-yellow-500/10 transition-all flex items-center justify-center gap-2"
                  data-testid="button-add-stop"
                >
                  <MapPin className="h-3.5 w-3.5" /> Add Stop
                  {selectedDriver?.pricing?.freeStops > 0 && (
                    <span className="text-xs text-gray-500">({selectedDriver.pricing.freeStops} free)</span>
                  )}
                </button>

                <div>
                  <label className="text-sm text-gray-400 mb-1 block flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-red-400" /> Drop-off Location
                  </label>
                  <input
                    type="text"
                    value={dropoffAddress}
                    onChange={(e) => setDropoffAddress(e.target.value)}
                    placeholder="Enter destination address or postcode"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50"
                    data-testid="input-dropoff"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-1 block flex items-center gap-2">
                    <Navigation className="h-4 w-4 text-blue-400" /> Estimated Distance (miles)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={estimatedDistance}
                    onChange={(e) => setEstimatedDistance(e.target.value)}
                    placeholder="e.g. 3.5"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
                    data-testid="input-distance"
                  />
                </div>

                <button
                  onClick={() => calculatePriceMutation.mutate()}
                  disabled={!estimatedDistance || !pickupAddress || !dropoffAddress}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold transition-all disabled:opacity-50"
                  data-testid="button-calculate-price"
                >
                  Calculate Price
                </button>

                {calculatedPrice && (
                  <div className="bg-gradient-to-br from-green-900/30 to-blue-900/30 border border-green-500/20 rounded-2xl p-5">
                    <h4 className="font-bold mb-3">Price Breakdown</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-gray-400">Distance ({calculatedPrice.breakdown?.distance} mi × {currencySymbol}{calculatedPrice.breakdown?.pricePerMile})</span><span>{currencySymbol}{(calculatedPrice.breakdown?.distanceCost || 0).toFixed(2)}</span></div>
                      {calculatedPrice.breakdown?.extraStopsCost > 0 && (
                        <div className="flex justify-between"><span className="text-gray-400">Extra Stops ({calculatedPrice.breakdown?.extraStops})</span><span>{currencySymbol}{calculatedPrice.breakdown?.extraStopsCost.toFixed(2)}</span></div>
                      )}
                      <div className="flex justify-between pt-2 border-t border-white/10 text-lg font-bold">
                        <span>Total</span>
                        <span className="text-green-400">{currencySymbol}{(calculatedPrice.estimatedPrice || 0).toFixed(2)}</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">Free waiting: {calculatedPrice.breakdown?.freeWaitingMins} mins • After: {currencySymbol}{calculatedPrice.breakdown?.waitingChargePerMin}/min</p>
                  </div>
                )}

                {calculatedPrice && (
                  <>
                    <div>
                      <label className="text-sm text-gray-400 mb-2 block">Payment Method</label>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setPaymentMethod("online")}
                          className={`flex-1 min-w-[100px] py-3 rounded-xl font-bold border transition-all text-sm ${paymentMethod === "online" ? "border-blue-500 bg-blue-500/10 text-blue-400" : "border-white/10 bg-white/5 text-gray-400"}`}
                          data-testid="button-pay-online"
                        >
                          💳 Card
                        </button>
                        <button
                          onClick={() => setPaymentMethod("bank_transfer")}
                          className={`flex-1 min-w-[100px] py-3 rounded-xl font-bold border transition-all text-sm ${paymentMethod === "bank_transfer" ? "border-green-500 bg-green-500/10 text-green-400" : "border-white/10 bg-white/5 text-gray-400"}`}
                          data-testid="button-pay-bank"
                        >
                          🏦 Bank
                        </button>
                        <button
                          onClick={() => setPaymentMethod("jazzcash")}
                          className={`flex-1 min-w-[100px] py-3 rounded-xl font-bold border transition-all text-sm flex flex-col items-center gap-0.5 ${paymentMethod === "jazzcash" ? "border-purple-500 bg-purple-500/10 text-purple-400" : "border-white/10 bg-white/5 text-gray-400"}`}
                          data-testid="button-pay-jazzcash"
                        >
                          <span>📱 JazzCash</span>
                          {(selectedDriver?.receiveJazzCashNumber || brand?.jazzCashNumber) && <span className="text-[10px] font-normal opacity-70">{selectedDriver?.receiveJazzCashNumber || brand?.jazzCashNumber}</span>}
                        </button>
                        <button
                          onClick={() => setPaymentMethod("easypaisa")}
                          className={`flex-1 min-w-[100px] py-3 rounded-xl font-bold border transition-all text-sm flex flex-col items-center gap-0.5 ${paymentMethod === "easypaisa" ? "border-orange-500 bg-orange-500/10 text-orange-400" : "border-white/10 bg-white/5 text-gray-400"}`}
                          data-testid="button-pay-easypaisa"
                        >
                          <span>📱 EasyPaisa</span>
                          {(selectedDriver?.receiveEasyPaisaNumber || brand?.easyPaisaNumber) && <span className="text-[10px] font-normal opacity-70">{selectedDriver?.receiveEasyPaisaNumber || brand?.easyPaisaNumber}</span>}
                        </button>
                      </div>
                    </div>

                    {paymentMethod === "bank_transfer" && (() => {
                      const bk = selectedDriver?.receiveBankName || selectedDriver?.receiveBankAccountNumber ? selectedDriver : brand;
                      const bankName = bk?.receiveBankName || bk?.bankName;
                      const accName = bk?.receiveBankAccountName || bk?.bankAccountName;
                      const sortCode = bk?.receiveBankSortCode || bk?.bankSortCode;
                      const accNo = bk?.receiveBankAccountNumber || bk?.bankAccountNumber;
                      const iban = bk?.receiveBankIban || bk?.bankIban;
                      const hasBank = bankName || accNo;
                      return (
                        <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 border border-green-500/20 rounded-2xl p-5 space-y-4">
                          <h4 className="font-bold text-green-400 flex items-center gap-2">🏦 Bank Transfer — Pay {selectedDriver?.name}</h4>
                          {hasBank ? (
                            <>
                              <div className="flex justify-center">
                                <div className="bg-white p-3 rounded-xl">
                                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`Bank: ${bankName || ""}\nName: ${accName || ""}\nSort: ${sortCode || ""}\nAcc: ${accNo || ""}\nIBAN: ${iban || ""}\nAmount: ${currencySymbol}${(calculatedPrice.estimatedPrice || 0).toFixed(2)}`)}`} alt="QR Code" className="w-[180px] h-[180px]" data-testid="img-bank-qr" />
                                </div>
                              </div>
                              <div className="space-y-2">
                                {[
                                  { label: "Bank", value: bankName, key: "bank" },
                                  { label: "Account Name", value: accName, key: "accName" },
                                  { label: "Sort Code", value: sortCode, key: "sort" },
                                  { label: "Account No.", value: accNo, key: "accNo" },
                                  { label: "IBAN", value: iban, key: "iban" },
                                ].filter(f => f.value).map(field => (
                                  <div key={field.key} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
                                    <div><span className="text-xs text-gray-500 block">{field.label}</span><span className="font-mono text-sm">{field.value}</span></div>
                                    <button onClick={() => { navigator.clipboard.writeText(field.value || ""); setCopiedField(field.key); setTimeout(() => setCopiedField(null), 2000); }} className={`px-2 py-1 rounded text-xs transition-all ${copiedField === field.key ? "bg-green-500/20 text-green-400" : "bg-white/10 text-gray-400 hover:bg-white/20"}`} data-testid={`button-copy-${field.key}`}>
                                      {copiedField === field.key ? "Copied" : "Copy"}
                                    </button>
                                  </div>
                                ))}
                              </div>
                              <p className="text-xs text-gray-400 text-center">Payment goes directly to {selectedDriver?.name}'s account</p>
                            </>
                          ) : (
                            <p className="text-sm text-gray-400 text-center py-4">Bank details not configured yet. Contact the driver or business owner.</p>
                          )}
                        </div>
                      );
                    })()}

                    {paymentMethod === "jazzcash" && (() => {
                      const jzNum = selectedDriver?.receiveJazzCashNumber || brand?.jazzCashNumber;
                      const jzName = selectedDriver?.receiveJazzCashName || brand?.jazzCashAccountName;
                      return (
                        <div className="bg-gradient-to-br from-purple-900/20 to-indigo-900/20 border border-purple-500/20 rounded-2xl p-5 space-y-4">
                          <h4 className="font-bold text-purple-400 flex items-center gap-2">📱 JazzCash — Pay {selectedDriver?.name}</h4>
                          {jzNum ? (
                            <>
                              <div className="flex justify-center">
                                <div className="bg-white p-3 rounded-xl">
                                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`JazzCash: ${jzNum}\nName: ${jzName || ""}\nAmount: ${currencySymbol}${(calculatedPrice.estimatedPrice || 0).toFixed(2)}`)}`} alt="QR Code" className="w-[180px] h-[180px]" data-testid="img-jazzcash-qr" />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
                                  <div><span className="text-xs text-gray-500 block">JazzCash Number</span><span className="font-mono text-sm">{jzNum}</span></div>
                                  <button onClick={() => { navigator.clipboard.writeText(jzNum || ""); setCopiedField("jz"); setTimeout(() => setCopiedField(null), 2000); }} className={`px-2 py-1 rounded text-xs transition-all ${copiedField === "jz" ? "bg-green-500/20 text-green-400" : "bg-white/10 text-gray-400 hover:bg-white/20"}`} data-testid="button-copy-jazzcash">
                                    {copiedField === "jz" ? "Copied" : "Copy"}
                                  </button>
                                </div>
                                {jzName && <div className="bg-white/5 rounded-lg px-3 py-2"><span className="text-xs text-gray-500 block">Account Name</span><span className="text-sm">{jzName}</span></div>}
                              </div>
                              <p className="text-xs text-gray-400 text-center">Send {currencySymbol}{(calculatedPrice.estimatedPrice || 0).toFixed(2)} — goes to {selectedDriver?.name}'s account</p>
                            </>
                          ) : (
                            <p className="text-sm text-gray-400 text-center py-4">JazzCash details not configured. Contact the driver or business owner.</p>
                          )}
                        </div>
                      );
                    })()}

                    {paymentMethod === "easypaisa" && (() => {
                      const epNum = selectedDriver?.receiveEasyPaisaNumber || brand?.easyPaisaNumber;
                      const epName = selectedDriver?.receiveEasyPaisaName || brand?.easyPaisaAccountName;
                      return (
                        <div className="bg-gradient-to-br from-orange-900/20 to-amber-900/20 border border-orange-500/20 rounded-2xl p-5 space-y-4">
                          <h4 className="font-bold text-orange-400 flex items-center gap-2">📱 EasyPaisa — Pay {selectedDriver?.name}</h4>
                          {epNum ? (
                            <>
                              <div className="flex justify-center">
                                <div className="bg-white p-3 rounded-xl">
                                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`EasyPaisa: ${epNum}\nName: ${epName || ""}\nAmount: ${currencySymbol}${(calculatedPrice.estimatedPrice || 0).toFixed(2)}`)}`} alt="QR Code" className="w-[180px] h-[180px]" data-testid="img-easypaisa-qr" />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
                                  <div><span className="text-xs text-gray-500 block">EasyPaisa Number</span><span className="font-mono text-sm">{epNum}</span></div>
                                  <button onClick={() => { navigator.clipboard.writeText(epNum || ""); setCopiedField("ep"); setTimeout(() => setCopiedField(null), 2000); }} className={`px-2 py-1 rounded text-xs transition-all ${copiedField === "ep" ? "bg-green-500/20 text-green-400" : "bg-white/10 text-gray-400 hover:bg-white/20"}`} data-testid="button-copy-easypaisa">
                                    {copiedField === "ep" ? "Copied" : "Copy"}
                                  </button>
                                </div>
                                {epName && <div className="bg-white/5 rounded-lg px-3 py-2"><span className="text-xs text-gray-500 block">Account Name</span><span className="text-sm">{epName}</span></div>}
                              </div>
                              <p className="text-xs text-gray-400 text-center">Send {currencySymbol}{(calculatedPrice.estimatedPrice || 0).toFixed(2)} — goes to {selectedDriver?.name}'s account</p>
                            </>
                          ) : (
                            <p className="text-sm text-gray-400 text-center py-4">EasyPaisa details not configured. Contact the driver or business owner.</p>
                          )}
                        </div>
                      );
                    })()}

                    {paymentMethod === "online" && (
                      <div className="bg-gradient-to-br from-blue-900/20 to-indigo-900/20 border border-blue-500/20 rounded-2xl p-5 space-y-4">
                        <h4 className="font-bold text-blue-400 flex items-center gap-2">💳 Card Payment</h4>
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs text-gray-400 block mb-1">Card Number</label>
                            <input
                              type="text"
                              inputMode="numeric"
                              maxLength={19}
                              placeholder="1234 5678 9012 3456"
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none font-mono tracking-wider"
                              onChange={e => {
                                const v = e.target.value.replace(/\D/g, "").replace(/(\d{4})/g, "$1 ").trim();
                                e.target.value = v;
                              }}
                              data-testid="input-card-number"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs text-gray-400 block mb-1">Expiry Date</label>
                              <input
                                type="text"
                                inputMode="numeric"
                                maxLength={5}
                                placeholder="MM/YY"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none font-mono"
                                onChange={e => {
                                  let v = e.target.value.replace(/\D/g, "");
                                  if (v.length >= 2) v = v.slice(0, 2) + "/" + v.slice(2);
                                  e.target.value = v;
                                }}
                                data-testid="input-card-expiry"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-400 block mb-1">CVV</label>
                              <input
                                type="password"
                                inputMode="numeric"
                                maxLength={4}
                                placeholder="•••"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none font-mono"
                                data-testid="input-card-cvv"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-xs text-gray-400 block mb-1">Cardholder Name</label>
                            <input
                              type="text"
                              placeholder="Name on card"
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                              data-testid="input-card-name"
                            />
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 text-center flex items-center justify-center gap-1">🔒 Your card details are secure</p>
                      </div>
                    )}

                    <button
                      onClick={() => requestRideMutation.mutate()}
                      disabled={requestRideMutation.isPending}
                      className="w-full py-4 rounded-xl font-bold text-lg transition-all disabled:opacity-50 text-white"
                      style={{ background: secondaryColor }}
                      data-testid="button-request-ride"
                    >
                      {requestRideMutation.isPending ? "Requesting..." : `Request Ride — ${currencySymbol}${(calculatedPrice.estimatedPrice || 0).toFixed(2)}`}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {step === "tracking" && activeRide && (
          <div className="max-w-md mx-auto mt-4 space-y-6">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6">
              <div className="text-center mb-6">
                {activeRide.status === "requested" && (
                  <>
                    <Loader2 className="h-16 w-16 text-yellow-400 mx-auto mb-4 animate-spin" />
                    <h3 className="text-xl font-bold">Waiting for Driver</h3>
                    <p className="text-gray-400">Your ride request has been sent</p>
                  </>
                )}
                {activeRide.status === "cancelled" && (
                  <>
                    <X className="h-16 w-16 text-red-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-red-400">Ride Cancelled</h3>
                    <p className="text-gray-400">This ride has been cancelled</p>
                  </>
                )}
                {activeRide.status === "accepted" && (
                  <>
                    <Check className="h-16 w-16 text-green-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-green-400">Driver Accepted!</h3>
                    <p className="text-gray-400">Your driver is preparing to come</p>
                  </>
                )}
                {activeRide.status === "driver_arriving" && (
                  <>
                    <div className="relative inline-block">
                      <Car className="h-16 w-16 text-blue-400 mx-auto mb-4 animate-bounce" />
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-12 h-2 bg-blue-500/30 rounded-full blur-sm" />
                    </div>
                    <h3 className="text-xl font-bold text-blue-400">Driver is Coming!</h3>
                    <p className="text-gray-400">Your driver is on the way to pick you up</p>
                  </>
                )}
                {activeRide.status === "otp_verified" && (
                  <>
                    <Shield className="h-16 w-16 text-green-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-green-400">OTP Verified!</h3>
                    <p className="text-gray-400">Identity confirmed — ride starting soon</p>
                  </>
                )}
                {activeRide.status === "in_progress" && (
                  <>
                    <Navigation className="h-16 w-16 text-purple-400 mx-auto mb-4 animate-pulse" />
                    <h3 className="text-xl font-bold text-purple-400">Ride in Progress</h3>
                    <p className="text-gray-400">Enjoy your ride!</p>
                  </>
                )}
              </div>

              {activeRide.status === "driver_arriving" && activeRide.otpCode && (
                <div className="bg-gradient-to-br from-yellow-900/30 to-orange-900/30 border border-yellow-500/30 rounded-2xl p-6 text-center mb-4">
                  <Shield className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-400 mb-2">Share this OTP with your driver</p>
                  <p className="text-4xl font-bold tracking-[0.3em] text-yellow-400" data-testid="text-otp-code">{activeRide.otpCode}</p>
                  <p className="text-xs text-gray-500 mt-2">Driver must enter this to start the ride</p>
                </div>
              )}

              <div className="space-y-3 mb-4">
                <div className="flex items-start gap-3 bg-white/5 rounded-xl p-3">
                  <MapPin className="h-5 w-5 text-green-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Pickup</p>
                    <p className="font-medium">{activeRide.pickupAddress}</p>
                  </div>
                </div>
                {Array.isArray(activeRide.stops) && activeRide.stops.map((stop: string, i: number) => (
                  <div key={i} className="flex items-start gap-3 bg-white/5 rounded-xl p-3">
                    <MapPin className="h-5 w-5 text-yellow-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">Stop {i + 1}</p>
                      <p className="font-medium">{stop}</p>
                    </div>
                  </div>
                ))}
                <div className="flex items-start gap-3 bg-white/5 rounded-xl p-3">
                  <MapPin className="h-5 w-5 text-red-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Drop-off</p>
                    <p className="font-medium">{activeRide.dropoffAddress}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between bg-white/5 rounded-xl p-4">
                <div>
                  <p className="text-xs text-gray-400">Estimated Fare</p>
                  <p className="text-2xl font-bold text-yellow-400">£{parseFloat(activeRide.estimatedPrice || "0").toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Payment</p>
                  <p className="font-bold">{activeRide.paymentMethod === "cash" ? "💵 Cash" : "💳 Card"}</p>
                </div>
              </div>

              {(activeRide.status === "requested" || activeRide.status === "cancelled") && (
                <div className="mt-4 space-y-3">
                  {activeRide.status === "requested" && (
                    <button
                      onClick={async () => {
                        try {
                          const res = await fetch(`/api/taxi-rides/${activeRide.id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ status: "cancelled" }),
                          });
                          if (res.ok) {
                            setActiveRide(null);
                            setStep("map");
                            setSelectedDriver(null);
                            setCalculatedPrice(null);
                            setPickupAddress("");
                            setDropoffAddress("");
                            setStops([]);
                            setEstimatedDistance("");
                          }
                        } catch (e) {}
                      }}
                      className="w-full py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-400 font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                      data-testid="button-cancel-ride"
                    >
                      <X className="h-5 w-5" />
                      Cancel Ride Request
                    </button>
                  )}
                  {activeRide.status === "cancelled" && (
                    <button
                      onClick={() => {
                        setActiveRide(null);
                        setStep("map");
                        setSelectedDriver(null);
                        setCalculatedPrice(null);
                        setPickupAddress("");
                        setDropoffAddress("");
                        setStops([]);
                        setEstimatedDistance("");
                      }}
                      className="w-full py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                      data-testid="button-back-to-drivers"
                    >
                      <ArrowRight className="h-5 w-5 rotate-180" />
                      Back to Drivers
                    </button>
                  )}
                </div>
              )}

              {activeRide.status === "completed" && (
                <div className="mt-4 bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center">
                  <Check className="h-8 w-8 text-green-400 mx-auto mb-2" />
                  <p className="font-bold text-green-400">Ride Completed!</p>
                  <p className="text-2xl font-bold mt-1">£{parseFloat(activeRide.finalPrice || activeRide.estimatedPrice || "0").toFixed(2)}</p>
                  <button
                    onClick={() => { setActiveRide(null); setStep("map"); setSelectedDriver(null); setCalculatedPrice(null); setPickupAddress(""); setDropoffAddress(""); setStops([]); setEstimatedDistance(""); }}
                    className="mt-4 px-6 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all"
                    data-testid="button-done"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
