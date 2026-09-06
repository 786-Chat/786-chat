import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Car, Users, Plus, Edit2, Trash2, Check, X, AlertTriangle,
  Phone, Mail, MapPin, CreditCard, Shield, ExternalLink,
  ChevronDown, ChevronUp, FileText, Menu as MenuIcon,
  Star, Clock, Loader2, Settings, LayoutDashboard, MessageCircle,
  PoundSterling, TrendingUp, Eye, Navigation, Search, Copy,
  Globe, User, Lock, Link as LinkIcon, Image, DollarSign,
  Building2, Bike, Bus, Truck, ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

type TabView = "dashboard" | "create-brand" | "brands" | "check-business" | "drivers" | "customers" | "rides" | "complaints" | "map" | "settings";

const MAP_LOCATIONS: Record<string, { label: string; areas: string[] }> = {
  united_kingdom: {
    label: "United Kingdom",
    areas: [
      "London", "Manchester", "Bolton", "Oldham", "Rochdale", "Stockport", "Salford",
      "Birmingham", "Walsall", "Dudley", "Wolverhampton", "Solihull", "West Bromwich",
      "Leeds", "Glasgow", "Liverpool", "Bradford", "Edinburgh", "Bristol", "Sheffield",
      "Nottingham", "Leicester", "Coventry", "Newcastle", "Luton", "Slough",
    ],
  },
  pakistan: {
    label: "Pakistan",
    areas: [
      "Karachi", "Shah Faisal Colony Karachi", "Gulshan-e-Iqbal Karachi", "Clifton Karachi", "Saddar Karachi", "Korangi Karachi", "North Nazimabad Karachi", "Malir Karachi",
      "Lahore", "Gulberg Lahore", "Model Town Lahore", "DHA Lahore", "Johar Town Lahore",
      "Islamabad", "Rawalpindi", "Faisalabad", "Multan", "Peshawar", "Quetta",
      "Murree", "Abbottabad", "Sialkot", "Gujranwala", "Hyderabad", "Bahawalpur",
    ],
  },
  india: {
    label: "India",
    areas: [
      "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Kolkata",
      "Pune", "Ahmedabad", "Jaipur", "Lucknow", "Surat", "Chandigarh",
    ],
  },
  uae: {
    label: "UAE",
    areas: ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Ras Al Khaimah"],
  },
  usa: {
    label: "USA",
    areas: ["New York", "Los Angeles", "Chicago", "Houston", "Miami", "San Francisco", "Dallas"],
  },
  saudi_arabia: {
    label: "Saudi Arabia",
    areas: ["Riyadh", "Jeddah", "Makkah", "Madinah", "Dammam"],
  },
  turkey: {
    label: "Turkey",
    areas: ["Istanbul", "Ankara", "Antalya", "Izmir", "Bursa"],
  },
  bangladesh: {
    label: "Bangladesh",
    areas: ["Dhaka", "Chittagong", "Sylhet", "Rajshahi", "Khulna"],
  },
};

function TaxiLiveMap({ brands, allDrivers, allRides, selectedBusinessId, setSelectedBusinessId, mapTown, setMapTown }: any) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const driverMarkersRef = useRef<Map<string, any>>(new Map());
  const wsRef = useRef<WebSocket | null>(null);
  const leafletRef = useRef<any>(null);
  const [mapCountry, setMapCountry] = useState("");

  const mapDrivers = selectedBusinessId
    ? allDrivers.filter((d: any) => d.brandId === selectedBusinessId)
    : allDrivers;

  const createTaxiIcon = useCallback((driver: any, L: any) => {
    const hasRide = allRides.some((r: any) => r.driverId === driver.id && (r.status === "in_progress" || r.status === "accepted" || r.status === "driver_arriving"));
    const color = hasRide ? "#22c55e" : driver.onDuty ? "#eab308" : "#6b7280";
    const vType = driver.vehicleType || "sedan_5";

    let carSvg = "";
    if (vType.includes("motorbike")) {
      carSvg = `<svg viewBox="0 0 40 40" width="44" height="44"><g transform="rotate(0,20,20)"><ellipse cx="20" cy="32" rx="8" ry="3" fill="rgba(0,0,0,0.2)"/><path d="M16 28c0-3 2-14 4-18s4 15 4 18c0 2-1 3-4 3s-4-1-4-3z" fill="${color}" stroke="#000" stroke-width="0.5"/><circle cx="20" cy="12" r="3.5" fill="${color}" stroke="#000" stroke-width="0.5"/><circle cx="20" cy="9" r="2" fill="#fff" opacity="0.7"/></g></svg>`;
    } else if (vType.includes("mpv") || vType.includes("bus") || vType.includes("van")) {
      carSvg = `<svg viewBox="0 0 48 48" width="52" height="52"><g transform="rotate(0,24,24)"><ellipse cx="24" cy="40" rx="12" ry="4" fill="rgba(0,0,0,0.2)"/><rect x="14" y="10" width="20" height="28" rx="5" fill="${color}" stroke="#000" stroke-width="0.7"/><rect x="16" y="12" width="16" height="8" rx="2" fill="#87ceeb" opacity="0.6"/><rect x="17" y="22" width="6" height="5" rx="1" fill="#fff" opacity="0.3"/><rect x="25" y="22" width="6" height="5" rx="1" fill="#fff" opacity="0.3"/><circle cx="17" cy="36" r="2.5" fill="#222"/><circle cx="31" cy="36" r="2.5" fill="#222"/><circle cx="17" cy="11" r="1.5" fill="#fbbf24"/><circle cx="31" cy="11" r="1.5" fill="#fbbf24"/></g></svg>`;
    } else {
      carSvg = `<svg viewBox="0 0 44 44" width="48" height="48"><g transform="rotate(0,22,22)"><ellipse cx="22" cy="38" rx="10" ry="3.5" fill="rgba(0,0,0,0.2)"/><rect x="14" y="12" width="16" height="24" rx="6" fill="${color}" stroke="#000" stroke-width="0.7"/><rect x="16" y="13" width="12" height="7" rx="2" fill="#87ceeb" opacity="0.6"/><rect x="16" y="28" width="12" height="4" rx="1" fill="#333" opacity="0.3"/><circle cx="16" cy="34" r="2.2" fill="#222"/><circle cx="28" cy="34" r="2.2" fill="#222"/><circle cx="18" cy="12.5" r="1.3" fill="#fbbf24"/><circle cx="26" cy="12.5" r="1.3" fill="#fbbf24"/><rect x="19" y="34" width="6" height="1.5" rx="0.5" fill="#ef4444"/></g></svg>`;
    }

    return L.divIcon({
      html: `<div style="filter:drop-shadow(0 2px 4px rgba(0,0,0,0.4));transition:transform 0.8s ease">${carSvg}</div>`,
      className: "",
      iconSize: [48, 48],
      iconAnchor: [24, 40],
      popupAnchor: [0, -40],
    });
  }, [allRides]);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
      driverMarkersRef.current.clear();
    }

    let cancelled = false;
    (async () => {
      const L = await import("leaflet");
      await import("leaflet/dist/leaflet.css");
      if (cancelled) return;
      leafletRef.current = L;
      (window as any).L = L;

      const map = L.map(mapContainerRef.current!, {
        zoomControl: true,
        attributionControl: false,
      }).setView([51.5074, -0.1278], 12);

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;

      const driversWithLoc = mapDrivers.filter((d: any) => d.lastLocationLat && d.lastLocationLng);
      driversWithLoc.forEach((driver: any) => {
        const icon = createTaxiIcon(driver, L);
        const marker = L.marker([parseFloat(driver.lastLocationLat), parseFloat(driver.lastLocationLng)], { icon })
          .addTo(map)
          .bindPopup(`
            <div style="font-family:system-ui;min-width:180px;padding:4px">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
                ${driver.photo ? `<img src="${driver.photo}" style="width:32px;height:32px;border-radius:50%;object-fit:cover"/>` : `<div style="width:32px;height:32px;border-radius:50%;background:#22c55e;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:bold">${(driver.name || "?")[0]}</div>`}
                <div>
                  <strong>${driver.name}</strong>
                  <div style="font-size:11px;color:#666">${driver.vehicleType?.replace(/_/g, " ") || "sedan"} | ${driver.numberPlate || ""}</div>
                </div>
              </div>
              <div style="font-size:11px;color:#333">
                <div>${driver.phone || ""}</div>
                <div style="margin-top:2px">
                  <span style="display:inline-block;padding:1px 6px;border-radius:10px;font-size:10px;background:${driver.onDuty ? "#dcfce7" : "#fee2e2"};color:${driver.onDuty ? "#166534" : "#991b1b"}">${driver.onDuty ? "ON DUTY" : "OFF DUTY"}</span>
                  ${allRides.some((r: any) => r.driverId === driver.id && r.status === "in_progress") ? '<span style="display:inline-block;padding:1px 6px;border-radius:10px;font-size:10px;background:#dbeafe;color:#1e40af;margin-left:4px">IN RIDE</span>' : ""}
                </div>
              </div>
            </div>
          `);
        driverMarkersRef.current.set(driver.id, marker);
      });

      if (driversWithLoc.length > 0) {
        const group = L.featureGroup(driversWithLoc.map((d: any) =>
          L.marker([parseFloat(d.lastLocationLat), parseFloat(d.lastLocationLng)])
        ));
        map.fitBounds(group.getBounds().pad(0.3));
      }
    })();

    return () => { cancelled = true; };
  }, [selectedBusinessId, mapDrivers.length]);

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/taxi-ws`);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "driver_location" && mapInstanceRef.current && leafletRef.current) {
          const L = leafletRef.current;
          const marker = driverMarkersRef.current.get(data.driverId);
          const newLatLng: [number, number] = [data.lat, data.lng];
          if (marker) {
            const oldLatLng = marker.getLatLng();
            const dx = data.lng - oldLatLng.lng;
            const dy = data.lat - oldLatLng.lat;
            const angle = Math.atan2(dx, dy) * (180 / Math.PI);
            const iconEl = marker.getElement();
            if (iconEl) {
              const svgG = iconEl.querySelector("g");
              if (svgG) svgG.setAttribute("transform", `rotate(${angle},22,22)`);
            }
            marker.setLatLng(newLatLng);
          } else {
            const driver = allDrivers.find((d: any) => d.id === data.driverId);
            if (driver) {
              const icon = createTaxiIcon(driver, L);
              const newMarker = L.marker(newLatLng, { icon }).addTo(mapInstanceRef.current);
              driverMarkersRef.current.set(data.driverId, newMarker);
            }
          }
        }
      } catch {}
    };

    wsRef.current = ws;
    return () => { ws.close(); };
  }, [allDrivers, createTaxiIcon]);

  const searchTown = async (town: string) => {
    if (!town || !mapInstanceRef.current) return;
    try {
      const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(town)}&limit=1`);
      const results = await resp.json();
      if (results.length > 0) {
        mapInstanceRef.current.setView([parseFloat(results[0].lat), parseFloat(results[0].lon)], 13);
      }
    } catch {}
  };

  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-white">Live Map</h2>
        <p className="text-gray-500 text-sm">View all drivers on the map in real-time</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div>
          <label className="text-xs font-semibold text-green-400 uppercase tracking-wider">Select Business</label>
          <select value={selectedBusinessId} onChange={(e) => setSelectedBusinessId(e.target.value)} className="mt-1 w-full md:w-72 bg-gray-900 border border-gray-700 text-white rounded-md px-3 py-2 text-sm focus:border-green-500 focus:outline-none" data-testid="select-map-business">
            <option value="">All Businesses</option>
            {brands.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-green-400 uppercase tracking-wider">Select Country</label>
          <select
            value={mapCountry}
            onChange={(e) => { setMapCountry(e.target.value); setMapTown(""); if (e.target.value && MAP_LOCATIONS[e.target.value]) searchTown(MAP_LOCATIONS[e.target.value].label); }}
            className="mt-1 w-full md:w-56 bg-gray-900 border border-gray-700 text-white rounded-md px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
            data-testid="select-map-country"
          >
            <option value="">-- Select country --</option>
            {Object.entries(MAP_LOCATIONS).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-green-400 uppercase tracking-wider">Select City / Area</label>
          <select
            value={mapTown}
            onChange={(e) => { setMapTown(e.target.value); if (e.target.value) searchTown(e.target.value); }}
            className="mt-1 w-full md:w-64 bg-gray-900 border border-gray-700 text-white rounded-md px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
            data-testid="select-map-city"
            disabled={!mapCountry}
          >
            <option value="">{mapCountry ? "-- Select city / area --" : "-- Select country first --"}</option>
            {mapCountry && MAP_LOCATIONS[mapCountry]?.areas.map((area) => (
              <option key={area} value={area}>{area}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-green-400 uppercase tracking-wider">Or Type Any Area</label>
          <div className="flex gap-2 mt-1">
            <Input
              value={mapTown}
              onChange={(e: any) => setMapTown(e.target.value)}
              placeholder="Type any area name..."
              className="w-52 bg-gray-900 border-gray-700 text-white placeholder:text-gray-500"
              onKeyDown={(e: any) => { if (e.key === "Enter" && mapTown) searchTown(mapTown); }}
              data-testid="input-custom-area"
            />
            <Button onClick={() => { if (mapTown) searchTown(mapTown); }} className="bg-green-600 hover:bg-green-700" data-testid="button-go-area">
              Go
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-white">{mapDrivers.length}</p>
          <p className="text-xs text-gray-500">Total Drivers</p>
        </div>
        <div className="bg-gray-900 border border-green-500/20 rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-green-400">{mapDrivers.filter((d: any) => d.onDuty).length}</p>
          <p className="text-xs text-gray-500">On Duty</p>
        </div>
        <div className="bg-gray-900 border border-blue-500/20 rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-blue-400">{allRides.filter((r: any) => r.status === "in_progress" && (!selectedBusinessId || r.brandId === selectedBusinessId)).length}</p>
          <p className="text-xs text-gray-500">Active Rides</p>
        </div>
        <div className="bg-gray-900 border border-yellow-500/20 rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-yellow-400">{mapDrivers.filter((d: any) => d.lastLocationLat).length}</p>
          <p className="text-xs text-gray-500">On Map</p>
        </div>
      </div>

      <div className="flex gap-3 text-xs">
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-green-500"></div><span className="text-gray-400">In Ride (Customer inside)</span></div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-yellow-500"></div><span className="text-gray-400">On Duty (Available)</span></div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-gray-500"></div><span className="text-gray-400">Off Duty</span></div>
      </div>

      <div
        ref={mapContainerRef}
        className="w-full rounded-2xl border border-gray-700 overflow-hidden"
        style={{ height: "calc(100vh - 360px)", minHeight: "400px" }}
        data-testid="map-container"
      />
    </div>
  );
}

const COUNTRIES = [
  { value: "united_kingdom", label: "United Kingdom", currency: "GBP", symbol: "£" },
  { value: "pakistan", label: "Pakistan", currency: "PKR", symbol: "Rs" },
  { value: "usa", label: "United States", currency: "USD", symbol: "$" },
  { value: "canada", label: "Canada", currency: "CAD", symbol: "C$" },
  { value: "uae", label: "Dubai / UAE", currency: "AED", symbol: "AED" },
  { value: "qatar", label: "Qatar", currency: "QAR", symbol: "QR" },
  { value: "oman", label: "Oman", currency: "OMR", symbol: "OMR" },
  { value: "saudi_arabia", label: "Saudi Arabia", currency: "SAR", symbol: "SAR" },
  { value: "india", label: "India", currency: "INR", symbol: "₹" },
  { value: "germany", label: "Germany", currency: "EUR", symbol: "€" },
  { value: "france", label: "France", currency: "EUR", symbol: "€" },
  { value: "turkey", label: "Turkey", currency: "TRY", symbol: "₺" },
];

const PAYMENT_METHODS = [
  { value: "stripe", label: "Stripe" },
  { value: "jazzcash", label: "JazzCash" },
  { value: "easypaisa", label: "EasyPaisa" },
  { value: "hbl_bank", label: "HBL Bank" },
  { value: "cash", label: "Cash Only" },
];

function VehicleIcon({ type, size = 20 }: { type: string; size?: number }) {
  const s = size;
  if (type === "sedan_5" || type === "car") return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 17h14M5 17a2 2 0 01-2-2v-3l2-4h3l2 4h4l2-4h3l2 4v3a2 2 0 01-2 2M5 17a2 2 0 100 4 2 2 0 000-4zM19 17a2 2 0 100 4 2 2 0 000-4z"/>
      <text x="12" y="12" textAnchor="middle" fontSize="5" fill="currentColor" stroke="none">5</text>
    </svg>
  );
  if (type === "mpv_7") return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="8" width="20" height="8" rx="2"/>
      <path d="M4 8l2-3h12l2 3M5 20a2 2 0 100-4 2 2 0 000 4zM19 20a2 2 0 100-4 2 2 0 000 4z"/>
      <text x="12" y="13" textAnchor="middle" fontSize="5" fill="currentColor" stroke="none">7</text>
    </svg>
  );
  if (type === "motorbike" || type === "motorcycle") return <Bike size={s} />;
  if (type === "bus") return <Bus size={s} />;
  if (type === "van") return <Truck size={s} />;
  return <Car size={s} />;
}

function getCurrencySymbol(currency: string) {
  return COUNTRIES.find(c => c.currency === currency)?.symbol || currency;
}

const emptyBrandForm = {
  name: "", slug: "", logo: "", ownerName: "", address: "", phone: "", email: "", whatsapp: "",
  country: "united_kingdom", currency: "GBP",
  primaryColor: "#0a0a0a", secondaryColor: "#22c55e",
  description: "", paymentMethod: "stripe",
  stripeSecretKey: "", stripePublishableKey: "",
  googleLink: "", domainType: "link24", customDomain: "", username: "",
  monthlyFee: "0", agreedPrice: "0", platformCommissionPercent: "10", adminPassword: "",
};

export default function TaxiAdminDashboard() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<TabView>("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showBrandForm, setShowBrandForm] = useState(false);
  const [editingBrand, setEditingBrand] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>("");
  const [brandForm, setBrandForm] = useState({ ...emptyBrandForm });
  const [mapTown, setMapTown] = useState("");

  const resetBrandForm = () => setBrandForm({ ...emptyBrandForm });

  const { data: brands = [] } = useQuery({
    queryKey: ["/api/taxi-brands"],
    queryFn: () => fetch("/api/taxi-brands").then(r => r.json()),
  });

  const { data: allDrivers = [] } = useQuery({
    queryKey: ["/api/taxi-drivers"],
    queryFn: () => fetch("/api/taxi-drivers").then(r => r.json()),
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["/api/taxi-customers"],
    queryFn: () => fetch("/api/taxi-customers").then(r => r.json()),
  });

  const { data: allRides = [] } = useQuery({
    queryKey: ["/api/taxi-rides", "all"],
    queryFn: () => fetch("/api/taxi-rides").then(r => r.json()),
  });

  const { data: complaints = [] } = useQuery({
    queryKey: ["/api/taxi-complaints"],
    queryFn: () => fetch("/api/taxi-complaints").then(r => r.json()),
  });

  const createBrandMutation = useMutation({
    mutationFn: (data: any) => fetch("/api/taxi-brands", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(r => { if (!r.ok) throw new Error("Failed"); return r.json(); }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/taxi-brands"] }); setShowBrandForm(false); resetBrandForm(); toast({ title: "Business Created Successfully!" }); setActiveTab("brands"); },
  });

  const updateBrandMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => fetch(`/api/taxi-brands/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/taxi-brands"] }); setEditingBrand(null); setShowBrandForm(false); resetBrandForm(); toast({ title: "Business Updated!" }); },
  });

  const deleteBrandMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/taxi-brands/${id}`, { method: "DELETE" }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/taxi-brands"] }); toast({ title: "Business Deleted" }); },
  });

  const duplicateBrandMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => fetch(`/api/taxi-brands/${id}/duplicate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(r => { if (!r.ok) throw new Error("Failed"); return r.json(); }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/taxi-brands"] }); toast({ title: "Business Duplicated!" }); setShowBrandForm(false); resetBrandForm(); setEditingBrand(null); },
  });

  const updateDriverMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => fetch(`/api/taxi-drivers/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/taxi-drivers"] }); toast({ title: "Driver Updated" }); },
  });

  const updateCustomerMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => fetch(`/api/taxi-customers/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/taxi-customers"] }); toast({ title: "Customer Updated" }); },
  });

  const resolveComplaintMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => fetch(`/api/taxi-complaints/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/taxi-complaints"] }); toast({ title: "Complaint Updated" }); },
  });

  const getDriversForBrand = (brandId: string) => allDrivers.filter((d: any) => d.brandId === brandId);
  const activeDrivers = allDrivers.filter((d: any) => d.onDuty);
  const pendingDrivers = allDrivers.filter((d: any) => d.status === "pending");
  const openComplaints = complaints.filter((c: any) => c.status === "open");
  const completedRides = allRides.filter((r: any) => r.status === "completed");

  const handleCountryChange = (country: string) => {
    const c = COUNTRIES.find(co => co.value === country);
    setBrandForm(p => ({ ...p, country, currency: c?.currency || "GBP" }));
  };

  const openEditForm = (brand: any) => {
    setEditingBrand(brand);
    setBrandForm({
      name: brand.name || "", slug: brand.slug || "", logo: brand.logo || "",
      ownerName: brand.ownerName || "", address: brand.address || "",
      phone: brand.phone || "", email: brand.email || "", whatsapp: brand.whatsapp || "",
      country: brand.country || "united_kingdom", currency: brand.currency || "GBP",
      primaryColor: brand.primaryColor || "#0a0a0a", secondaryColor: brand.secondaryColor || "#22c55e",
      description: brand.description || "", paymentMethod: brand.paymentMethod || "stripe",
      stripeSecretKey: brand.stripeSecretKey || "", stripePublishableKey: brand.stripePublishableKey || "",
      googleLink: brand.googleLink || "", domainType: brand.domainType || "link24",
      customDomain: brand.customDomain || "", username: brand.username || "",
      monthlyFee: String(brand.monthlyFee || 0), agreedPrice: String(brand.agreedPrice || 0),
      platformCommissionPercent: String(brand.platformCommissionPercent || 10),
      adminPassword: "",
    });
    setShowBrandForm(true);
  };

  const openDuplicateForm = (brand: any) => {
    setEditingBrand({ ...brand, _isDuplicate: true });
    setBrandForm({
      name: "", slug: "", logo: "",
      ownerName: "", address: "",
      phone: "", email: "", whatsapp: "",
      country: brand.country || "united_kingdom", currency: brand.currency || "GBP",
      primaryColor: brand.primaryColor || "#0a0a0a", secondaryColor: brand.secondaryColor || "#22c55e",
      description: brand.description || "", paymentMethod: brand.paymentMethod || "stripe",
      stripeSecretKey: "", stripePublishableKey: "",
      googleLink: "", domainType: brand.domainType || "link24",
      customDomain: "", username: "",
      monthlyFee: String(brand.monthlyFee || 0), agreedPrice: String(brand.agreedPrice || 0),
      platformCommissionPercent: String(brand.platformCommissionPercent || 10),
      adminPassword: "",
    });
    setShowBrandForm(true);
  };

  const handleSaveBrand = () => {
    if (editingBrand?._isDuplicate) {
      duplicateBrandMutation.mutate({ id: editingBrand.id, data: brandForm });
    } else if (editingBrand) {
      updateBrandMutation.mutate({ id: editingBrand.id, data: brandForm });
    } else {
      createBrandMutation.mutate(brandForm);
    }
  };

  const sidebarItems = [
    { id: "dashboard" as TabView, icon: LayoutDashboard, label: "Dashboard" },
    { id: "check-business" as TabView, icon: Eye, label: "Check Business" },
    { id: "map" as TabView, icon: Navigation, label: "Map" },
    { id: "customers" as TabView, icon: Users, label: "Customers" },
    { id: "complaints" as TabView, icon: MessageCircle, label: "Complaints" },
    { id: "settings" as TabView, icon: Settings, label: "Settings" },
  ];

  const renderBrandForm = () => (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-green-400 uppercase tracking-wider">Business Name *</label>
          <Input value={brandForm.name} onChange={(e) => setBrandForm(p => ({ ...p, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/,"") }))} placeholder="My Taxi Company" className="mt-1 bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus:border-green-500" data-testid="input-brand-name" />
        </div>
        <div>
          <label className="text-xs font-semibold text-green-400 uppercase tracking-wider">URL Slug *</label>
          <Input value={brandForm.slug} onChange={(e) => setBrandForm(p => ({ ...p, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }))} placeholder="my-taxi-company" className="mt-1 bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus:border-green-500" data-testid="input-brand-slug" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-green-400 uppercase tracking-wider">Owner Name *</label>
          <Input value={brandForm.ownerName} onChange={(e) => setBrandForm(p => ({ ...p, ownerName: e.target.value }))} placeholder="John Smith" className="mt-1 bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus:border-green-500" data-testid="input-owner-name" />
        </div>
        <div>
          <label className="text-xs font-semibold text-green-400 uppercase tracking-wider">Owner Phone *</label>
          <Input value={brandForm.phone} onChange={(e) => setBrandForm(p => ({ ...p, phone: e.target.value }))} placeholder="+44 7123 456789" className="mt-1 bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus:border-green-500" data-testid="input-owner-phone" />
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-green-400 uppercase tracking-wider">Owner Address</label>
        <Input value={brandForm.address} onChange={(e) => setBrandForm(p => ({ ...p, address: e.target.value }))} placeholder="123 Main Street, London, UK" className="mt-1 bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus:border-green-500" data-testid="input-owner-address" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-green-400 uppercase tracking-wider">Email</label>
          <Input value={brandForm.email} onChange={(e) => setBrandForm(p => ({ ...p, email: e.target.value }))} placeholder="owner@company.com" className="mt-1 bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus:border-green-500" />
        </div>
        <div>
          <label className="text-xs font-semibold text-green-400 uppercase tracking-wider">WhatsApp</label>
          <Input value={brandForm.whatsapp} onChange={(e) => setBrandForm(p => ({ ...p, whatsapp: e.target.value }))} placeholder="+44 7123 456789" className="mt-1 bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus:border-green-500" />
        </div>
      </div>

      <div className="border-t border-gray-700 pt-4">
        <h3 className="text-sm font-bold text-green-400 mb-3 flex items-center gap-2"><Globe className="h-4 w-4" /> Location & Currency</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-green-400 uppercase tracking-wider">Country *</label>
            <select value={brandForm.country} onChange={(e) => handleCountryChange(e.target.value)} className="mt-1 w-full bg-gray-900 border border-gray-700 text-white rounded-md px-3 py-2 text-sm focus:border-green-500 focus:outline-none" data-testid="select-country">
              {COUNTRIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-green-400 uppercase tracking-wider">Currency</label>
            <div className="mt-1 bg-gray-900 border border-gray-700 text-white rounded-md px-3 py-2 text-sm flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-400" />
              <span>{getCurrencySymbol(brandForm.currency)} ({brandForm.currency})</span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-700 pt-4">
        <h3 className="text-sm font-bold text-green-400 mb-3 flex items-center gap-2"><DollarSign className="h-4 w-4" /> Pricing Agreement</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-semibold text-green-400 uppercase tracking-wider">Agreed Price ({getCurrencySymbol(brandForm.currency)})</label>
            <Input type="number" value={brandForm.agreedPrice} onChange={(e) => setBrandForm(p => ({ ...p, agreedPrice: e.target.value }))} className="mt-1 bg-gray-900 border-gray-700 text-white focus:border-green-500" data-testid="input-agreed-price" />
          </div>
          <div>
            <label className="text-xs font-semibold text-green-400 uppercase tracking-wider">Monthly Fee ({getCurrencySymbol(brandForm.currency)})</label>
            <Input type="number" value={brandForm.monthlyFee} onChange={(e) => setBrandForm(p => ({ ...p, monthlyFee: e.target.value }))} className="mt-1 bg-gray-900 border-gray-700 text-white focus:border-green-500" />
          </div>
          <div>
            <label className="text-xs font-semibold text-green-400 uppercase tracking-wider">Commission %</label>
            <Input type="number" value={brandForm.platformCommissionPercent} onChange={(e) => setBrandForm(p => ({ ...p, platformCommissionPercent: e.target.value }))} className="mt-1 bg-gray-900 border-gray-700 text-white focus:border-green-500" />
          </div>
        </div>
      </div>

      <div className="border-t border-gray-700 pt-4">
        <h3 className="text-sm font-bold text-green-400 mb-3 flex items-center gap-2"><Lock className="h-4 w-4" /> Login Credentials</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-green-400 uppercase tracking-wider">Username</label>
            <Input value={brandForm.username} onChange={(e) => setBrandForm(p => ({ ...p, username: e.target.value }))} placeholder="brand-admin" className="mt-1 bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus:border-green-500" data-testid="input-username" />
          </div>
          <div>
            <label className="text-xs font-semibold text-green-400 uppercase tracking-wider">Password</label>
            <Input type="text" value={brandForm.adminPassword} onChange={(e) => setBrandForm(p => ({ ...p, adminPassword: e.target.value }))} placeholder="Create a strong password" className="mt-1 bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus:border-green-500" data-testid="input-admin-password" />
            <p className="text-xs text-gray-500 mt-1">Brand owner uses slug + this password at /taxi-brand-login</p>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-700 pt-4">
        <h3 className="text-sm font-bold text-green-400 mb-3 flex items-center gap-2"><CreditCard className="h-4 w-4" /> Payment Method</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {PAYMENT_METHODS.map(pm => (
            <button key={pm.value} onClick={() => setBrandForm(p => ({ ...p, paymentMethod: pm.value }))}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all border ${brandForm.paymentMethod === pm.value ? "bg-green-500/20 border-green-500 text-green-400" : "bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500"}`}
              data-testid={`btn-payment-${pm.value}`}>
              {pm.label}
            </button>
          ))}
        </div>
        {brandForm.paymentMethod === "stripe" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
            <div>
              <label className="text-xs font-semibold text-green-400 uppercase tracking-wider">Stripe Publishable Key</label>
              <Input value={brandForm.stripePublishableKey} onChange={(e) => setBrandForm(p => ({ ...p, stripePublishableKey: e.target.value }))} placeholder="pk_..." className="mt-1 bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus:border-green-500" />
            </div>
            <div>
              <label className="text-xs font-semibold text-green-400 uppercase tracking-wider">Stripe Secret Key</label>
              <Input value={brandForm.stripeSecretKey} onChange={(e) => setBrandForm(p => ({ ...p, stripeSecretKey: e.target.value }))} placeholder="sk_..." className="mt-1 bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus:border-green-500" />
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-gray-700 pt-4">
        <h3 className="text-sm font-bold text-green-400 mb-3 flex items-center gap-2"><LinkIcon className="h-4 w-4" /> Domain & Links</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
          {[
            { value: "link24", label: "link24.online" },
            { value: "custom", label: "Custom Domain" },
            { value: "own", label: "Customer's Own Domain" },
          ].map(dt => (
            <button key={dt.value} onClick={() => setBrandForm(p => ({ ...p, domainType: dt.value }))}
              className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${brandForm.domainType === dt.value ? "bg-green-500/20 border-green-500 text-green-400" : "bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500"}`}>
              {dt.label}
            </button>
          ))}
        </div>
        {(brandForm.domainType === "custom" || brandForm.domainType === "own") && (
          <div>
            <label className="text-xs font-semibold text-green-400 uppercase tracking-wider">Custom Domain</label>
            <Input value={brandForm.customDomain} onChange={(e) => setBrandForm(p => ({ ...p, customDomain: e.target.value }))} placeholder="www.mytaxi.com" className="mt-1 bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus:border-green-500" />
          </div>
        )}
        <div className="mt-3">
          <label className="text-xs font-semibold text-green-400 uppercase tracking-wider">Google Maps / Business Link</label>
          <Input value={brandForm.googleLink} onChange={(e) => setBrandForm(p => ({ ...p, googleLink: e.target.value }))} placeholder="https://goo.gl/maps/..." className="mt-1 bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus:border-green-500" />
        </div>
      </div>

      <div className="border-t border-gray-700 pt-4">
        <h3 className="text-sm font-bold text-green-400 mb-3 flex items-center gap-2"><Image className="h-4 w-4" /> Branding</h3>
        <div>
          <label className="text-xs font-semibold text-green-400 uppercase tracking-wider">Logo</label>
          <div className="mt-1 flex items-start gap-3">
            <div className="flex-1 space-y-2">
              <div className="flex gap-2">
                <Input value={brandForm.logo} onChange={(e) => setBrandForm(p => ({ ...p, logo: e.target.value }))} placeholder="Paste URL or upload below" className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus:border-green-500" />
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-all shrink-0">
                  <Image className="h-4 w-4" />
                  Upload
                  <input type="file" accept="image/png,image/jpeg,image/jpg,image/gif" className="hidden" onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = async () => {
                      try {
                        const res = await fetch("/api/upload-image", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ image: reader.result }),
                        });
                        const data = await res.json();
                        if (data.url) {
                          setBrandForm(p => ({ ...p, logo: data.url }));
                          toast({ title: "Logo uploaded!" });
                        }
                      } catch {
                        toast({ title: "Upload failed", variant: "destructive" });
                      }
                    };
                    reader.readAsDataURL(file);
                  }} data-testid="input-logo-upload" />
                </label>
              </div>
            </div>
            {brandForm.logo && (
              <div className="w-16 h-16 rounded-xl overflow-hidden border border-gray-700 bg-gray-900 shrink-0">
                <img src={brandForm.logo} alt="Logo" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-3">
          <div>
            <label className="text-xs font-semibold text-green-400 uppercase tracking-wider">Primary Color</label>
            <div className="flex gap-2 mt-1">
              <input type="color" value={brandForm.primaryColor} onChange={(e) => setBrandForm(p => ({ ...p, primaryColor: e.target.value }))} className="w-10 h-10 rounded cursor-pointer border-0" />
              <Input value={brandForm.primaryColor} onChange={(e) => setBrandForm(p => ({ ...p, primaryColor: e.target.value }))} className="bg-gray-900 border-gray-700 text-white" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-green-400 uppercase tracking-wider">Secondary Color</label>
            <div className="flex gap-2 mt-1">
              <input type="color" value={brandForm.secondaryColor} onChange={(e) => setBrandForm(p => ({ ...p, secondaryColor: e.target.value }))} className="w-10 h-10 rounded cursor-pointer border-0" />
              <Input value={brandForm.secondaryColor} onChange={(e) => setBrandForm(p => ({ ...p, secondaryColor: e.target.value }))} className="bg-gray-900 border-gray-700 text-white" />
            </div>
          </div>
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-green-400 uppercase tracking-wider">Description</label>
        <Textarea value={brandForm.description} onChange={(e) => setBrandForm(p => ({ ...p, description: e.target.value }))} rows={2} placeholder="Brief description of the taxi business" className="mt-1 bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus:border-green-500" />
      </div>

      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={() => { setShowBrandForm(false); setEditingBrand(null); resetBrandForm(); }} className="border-gray-600 text-gray-300 hover:bg-gray-800">
          Cancel
        </Button>
        <Button onClick={handleSaveBrand} disabled={!brandForm.name || !brandForm.slug || !brandForm.phone} className="bg-green-600 hover:bg-green-700 text-white flex-1" data-testid="button-save-brand">
          {createBrandMutation.isPending || updateBrandMutation.isPending || duplicateBrandMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : null}
          {editingBrand?._isDuplicate ? "Create Duplicate Business" : editingBrand ? "Save Changes" : "Create Business"}
        </Button>
      </div>
    </div>
  );

  const renderBrandCard = (brand: any) => {
    const brandDrivers = getDriversForBrand(brand.id);
    const country = COUNTRIES.find(c => c.value === brand.country);
    const currSym = getCurrencySymbol(brand.currency || "GBP");
    const payMethod = PAYMENT_METHODS.find(p => p.value === brand.paymentMethod);

    return (
      <div key={brand.id} className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-700 rounded-2xl overflow-hidden shadow-xl hover:shadow-green-500/10 transition-all group" data-testid={`card-brand-${brand.id}`}>
        <div className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              {brand.logo ? (
                <img src={brand.logo} alt="" className="w-14 h-14 rounded-xl object-cover border border-gray-600" />
              ) : (
                <div className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-xl bg-gradient-to-br from-green-600 to-green-800">
                  {brand.name?.[0] || "T"}
                </div>
              )}
              <div>
                <h3 className="font-bold text-white text-lg">{brand.name}</h3>
                <p className="text-xs text-gray-400">{brand.ownerName || "No owner"} | {brand.phone || "No phone"}</p>
              </div>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${brand.status === "active" ? "bg-green-500/20 text-green-400 border border-green-500/30" : brand.status === "suspended" ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-gray-500/20 text-gray-400 border border-gray-500/30"}`}>
              {brand.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-black/30 rounded-lg px-3 py-2 text-xs">
              <span className="text-gray-500">Drivers</span>
              <p className="text-white font-bold text-sm">{brandDrivers.length}</p>
            </div>
            <div className="bg-black/30 rounded-lg px-3 py-2 text-xs">
              <span className="text-gray-500">Country</span>
              <p className="text-white font-bold text-sm">{country?.label || brand.country || "UK"}</p>
            </div>
            <div className="bg-black/30 rounded-lg px-3 py-2 text-xs">
              <span className="text-gray-500">Currency</span>
              <p className="text-white font-bold text-sm">{currSym}</p>
            </div>
            <div className="bg-black/30 rounded-lg px-3 py-2 text-xs">
              <span className="text-gray-500">Payment</span>
              <p className="text-white font-bold text-sm">{payMethod?.label || brand.paymentMethod || "Stripe"}</p>
            </div>
          </div>

          {brand.description && (
            <p className="text-xs text-gray-400 mb-4 line-clamp-2">{brand.description}</p>
          )}

          <div className="text-xs text-gray-500 mb-4">
            <span className="text-green-400 font-mono">/taxi/{brand.slug}</span>
            {brand.customDomain && <span className="ml-2 text-cyan-400">{brand.customDomain}</span>}
          </div>

          <div className="flex items-center gap-2 border-t border-gray-700 pt-3">
            <Button size="sm" variant="ghost" onClick={() => openEditForm(brand)} className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10" title="Edit" data-testid={`btn-edit-${brand.id}`}>
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { if (confirm(`Delete "${brand.name}"? This cannot be undone.`)) deleteBrandMutation.mutate(brand.id); }} className="text-red-400 hover:text-red-300 hover:bg-red-500/10" title="Delete" data-testid={`btn-delete-${brand.id}`}>
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => openDuplicateForm(brand)} className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10" title="Duplicate" data-testid={`btn-duplicate-${brand.id}`}>
              <Copy className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => window.open(`/taxi-brand-login`, "_blank")} className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10" title="Brand Dashboard" data-testid={`btn-brand-dash-${brand.id}`}>
              <LayoutDashboard className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => window.open(`/taxi/${brand.slug}`, "_blank")} className="text-green-400 hover:text-green-300 hover:bg-green-500/10" title="View Public Map" data-testid={`btn-view-map-${brand.id}`}>
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black flex">
      <aside className="hidden md:flex w-64 bg-gray-950 text-white flex-col fixed inset-y-0 border-r border-gray-800">
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center shadow-lg shadow-green-500/20">
              <Car className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-green-400">Taxi Super Admin</h1>
              <p className="text-xs text-gray-500">Control Center</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {sidebarItems.map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setShowBrandForm(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === item.id ? "bg-green-500/15 text-green-400 border border-green-500/30" : "text-gray-400 hover:text-white hover:bg-gray-800/50"}`}
              data-testid={`nav-${item.id}`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
              {item.id === "complaints" && openComplaints.length > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{openComplaints.length}</span>
              )}
              {item.id === "drivers" && pendingDrivers.length > 0 && (
                <span className="ml-auto bg-yellow-500 text-black text-xs px-1.5 py-0.5 rounded-full">{pendingDrivers.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-800">
          <button onClick={() => navigate("/portal")} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-green-400 hover:bg-gray-800/50 transition-all" data-testid="button-back-portal">
            <ArrowLeft className="h-4 w-4" /> Back to Portal
          </button>
        </div>
      </aside>

      <div className="md:hidden fixed top-0 left-0 right-0 bg-gray-950 text-white z-50 p-3 flex items-center justify-between border-b border-gray-800">
        <div className="flex items-center gap-2">
          <Car className="h-5 w-5 text-green-400" />
          <span className="font-bold text-green-400">Taxi Super Admin</span>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} data-testid="button-mobile-menu"><MenuIcon className="h-5 w-5 text-white" /></button>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-gray-950/98 z-40 pt-16 p-4">
          <nav className="space-y-1">
            {sidebarItems.map(item => (
              <button key={item.id} onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); setShowBrandForm(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${activeTab === item.id ? "bg-green-500/15 text-green-400" : "text-gray-400"}`}>
                <item.icon className="h-4 w-4" /> {item.label}
              </button>
            ))}
            <button onClick={() => navigate("/portal")} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-gray-400">
              <ArrowLeft className="h-4 w-4" /> Back to Portal
            </button>
          </nav>
        </div>
      )}

      <main className="flex-1 md:ml-64 p-4 md:p-8 pt-16 md:pt-8 overflow-auto bg-black min-h-screen">
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Dashboard</h2>
                <p className="text-gray-500 text-sm">Your taxi empire at a glance</p>
              </div>
              <Button onClick={() => { resetBrandForm(); setEditingBrand(null); setShowBrandForm(true); }} className="bg-green-600 hover:bg-green-700 text-white gap-2" data-testid="button-quick-create">
                <Plus className="h-4 w-4" /> New Business
              </Button>
            </div>

            {brands.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-gray-700 rounded-2xl bg-gray-900/50">
                <Car className="h-16 w-16 text-gray-700 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No businesses yet</p>
                <p className="text-gray-600 text-sm mt-1">Click "New Business" to get started</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {brands.map((brand: any) => renderBrandCard(brand))}
              </div>
            )}
          </div>
        )}

        {activeTab === "check-business" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Check Business</h2>
              <p className="text-gray-500 text-sm">Select a business to view its stats and details</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-green-400 uppercase tracking-wider">Select Business</label>
              <select value={selectedBusinessId} onChange={(e) => setSelectedBusinessId(e.target.value)} className="mt-1 w-full md:w-96 bg-gray-900 border border-gray-700 text-white rounded-md px-3 py-2 text-sm focus:border-green-500 focus:outline-none" data-testid="select-check-business">
                <option value="">-- Choose a business --</option>
                {brands.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>

            {selectedBusinessId && (() => {
              const brand = brands.find((b: any) => b.id === selectedBusinessId);
              if (!brand) return null;
              const bDrivers = allDrivers.filter((d: any) => d.brandId === selectedBusinessId);
              const bOnDuty = bDrivers.filter((d: any) => d.onDuty);
              const bPending = bDrivers.filter((d: any) => d.status === "pending");
              const bRides = allRides.filter((r: any) => r.brandId === selectedBusinessId);
              const bCompleted = bRides.filter((r: any) => r.status === "completed");
              const bComplaints = complaints.filter((c: any) => {
                const ride = allRides.find((r: any) => r.id === c.rideId);
                return ride && ride.brandId === selectedBusinessId;
              });
              const bOpenComplaints = bComplaints.filter((c: any) => c.status === "open");
              const bCustomers = new Set(bRides.map((r: any) => r.customerId));
              const country = COUNTRIES.find(c => c.value === brand.country);
              const currSym = getCurrencySymbol(brand.currency || "GBP");
              const payMethod = PAYMENT_METHODS.find(p => p.value === brand.paymentMethod);

              return (
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-6">
                    <div className="flex items-start gap-4 mb-5">
                      {brand.logo ? (
                        <img src={brand.logo} alt="" className="w-16 h-16 rounded-xl object-cover border border-gray-600" />
                      ) : (
                        <div className="w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-2xl bg-gradient-to-br from-green-600 to-green-800">
                          {brand.name?.[0] || "T"}
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white">{brand.name}</h3>
                        <p className="text-sm text-gray-400">{brand.ownerName || "No owner"} | {brand.phone || "No phone"}</p>
                        <p className="text-xs text-gray-500 mt-1">{brand.address || "No address"}</p>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${brand.status === "active" ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"}`}>
                        {brand.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                      <div className="bg-black/40 rounded-xl px-4 py-3 border border-gray-700/50">
                        <p className="text-xs text-gray-500">Country</p>
                        <p className="text-sm font-bold text-white">{country?.label || brand.country || "N/A"}</p>
                      </div>
                      <div className="bg-black/40 rounded-xl px-4 py-3 border border-gray-700/50">
                        <p className="text-xs text-gray-500">Currency</p>
                        <p className="text-sm font-bold text-white">{currSym} ({brand.currency || "GBP"})</p>
                      </div>
                      <div className="bg-black/40 rounded-xl px-4 py-3 border border-gray-700/50">
                        <p className="text-xs text-gray-500">Payment</p>
                        <p className="text-sm font-bold text-white">{payMethod?.label || brand.paymentMethod || "N/A"}</p>
                      </div>
                      <div className="bg-black/40 rounded-xl px-4 py-3 border border-green-500/30">
                        <p className="text-xs text-green-400">Agreed Commission</p>
                        <p className="text-sm font-bold text-green-400">{brand.platformCommissionPercent || 0}%</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-black/40 rounded-xl px-4 py-3 border border-gray-700/50">
                        <p className="text-xs text-gray-500">Agreed Price</p>
                        <p className="text-sm font-bold text-white">{currSym}{brand.agreedPrice || "0"}</p>
                      </div>
                      <div className="bg-black/40 rounded-xl px-4 py-3 border border-gray-700/50">
                        <p className="text-xs text-gray-500">Monthly Fee</p>
                        <p className="text-sm font-bold text-white">{currSym}{brand.monthlyFee || "0"}</p>
                      </div>
                      <div className="bg-black/40 rounded-xl px-4 py-3 border border-gray-700/50">
                        <p className="text-xs text-gray-500">Domain</p>
                        <p className="text-sm font-bold text-cyan-400 truncate">{brand.customDomain || `/taxi/${brand.slug}`}</p>
                      </div>
                      <div className="bg-black/40 rounded-xl px-4 py-3 border border-gray-700/50">
                        <p className="text-xs text-gray-500">Login</p>
                        <p className="text-sm font-bold text-white">{brand.username || brand.slug}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: "Total Drivers", value: bDrivers.length, icon: Car, color: "from-green-600 to-green-800", glow: "shadow-green-500/20" },
                      { label: "On Duty Now", value: bOnDuty.length, icon: Navigation, color: "from-emerald-600 to-emerald-800", glow: "shadow-emerald-500/20" },
                      { label: "Total Customers", value: bCustomers.size, icon: Users, color: "from-purple-600 to-purple-800", glow: "shadow-purple-500/20" },
                      { label: "Total Rides", value: bRides.length, icon: TrendingUp, color: "from-cyan-600 to-cyan-800", glow: "shadow-cyan-500/20" },
                      { label: "Completed", value: bCompleted.length, icon: Check, color: "from-teal-600 to-teal-800", glow: "shadow-teal-500/20" },
                      { label: "Pending Drivers", value: bPending.length, icon: Clock, color: "from-yellow-600 to-yellow-800", glow: "shadow-yellow-500/20" },
                      { label: "Open Complaints", value: bOpenComplaints.length, icon: AlertTriangle, color: "from-red-600 to-red-800", glow: "shadow-red-500/20" },
                      { label: "Commission Rate", value: `${brand.platformCommissionPercent || 0}%`, icon: PoundSterling, color: "from-green-500 to-green-700", glow: "shadow-green-500/30" },
                    ].map((stat, i) => (
                      <div key={i} className={`bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-4 border border-gray-700 shadow-lg ${stat.glow}`} data-testid={`stat-biz-${stat.label.toLowerCase().replace(/\s/g, '-')}`}>
                        <div className={`w-10 h-10 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center mb-3 shadow-lg`}>
                          <stat.icon className="h-5 w-5 text-white" />
                        </div>
                        <p className="text-2xl font-bold text-white">{stat.value}</p>
                        <p className="text-xs text-gray-500">{stat.label}</p>
                      </div>
                    ))}
                  </div>

                  {bDrivers.length > 0 && (
                    <div>
                      <h3 className="text-lg font-bold text-white mb-3">Drivers in {brand.name}</h3>
                      <div className="space-y-3">
                        {bDrivers.map((driver: any) => (
                          <div key={driver.id} className="bg-gray-900 border border-gray-700 rounded-xl p-4 flex items-center justify-between hover:border-green-500/30 transition-all">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden border border-gray-600">
                                {driver.photo ? <img src={driver.photo} alt="" className="w-full h-full object-cover" /> : <User className="h-4 w-4 text-green-400" />}
                              </div>
                              <div>
                                <p className="font-medium text-white">{driver.name}</p>
                                <p className="text-xs text-gray-400 flex items-center gap-2">
                                  {driver.phone} |
                                  <span className="flex items-center gap-1"><VehicleIcon type={driver.vehicleType} size={14} /> {driver.vehicleType?.replace(/_/g, " ")}</span> |
                                  {driver.numberPlate || "No plate"}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${driver.status === "active" ? "bg-green-500/20 text-green-400" : driver.status === "pending" ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400"}`}>
                                {driver.status} {driver.onDuty ? "| ON DUTY" : ""}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {!selectedBusinessId && brands.length === 0 && (
              <div className="text-center py-16 border border-dashed border-gray-700 rounded-2xl bg-gray-900/50">
                <Building2 className="h-16 w-16 text-gray-700 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No businesses to check</p>
                <p className="text-gray-600 text-sm mt-1">Create a business first</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "customers" && (() => {
          const selectedBrand = brands.find((b: any) => b.id === selectedBusinessId);
          const brandRides = selectedBusinessId ? allRides.filter((r: any) => r.brandId === selectedBusinessId) : [];

          const now = new Date();
          const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const yesterdayStart = new Date(todayStart); yesterdayStart.setDate(yesterdayStart.getDate() - 1);
          const lastWeekStart = new Date(todayStart); lastWeekStart.setDate(lastWeekStart.getDate() - 7);
          const last12MonthsStart = new Date(todayStart); last12MonthsStart.setMonth(last12MonthsStart.getMonth() - 12);

          const todayRides = brandRides.filter((r: any) => new Date(r.createdAt) >= todayStart);
          const yesterdayRides = brandRides.filter((r: any) => { const d = new Date(r.createdAt); return d >= yesterdayStart && d < todayStart; });
          const lastWeekRides = brandRides.filter((r: any) => new Date(r.createdAt) >= lastWeekStart);
          const last12MonthsRides = brandRides.filter((r: any) => new Date(r.createdAt) >= last12MonthsStart);

          const todayCustomerIds = [...new Set(todayRides.map((r: any) => r.customerId))];
          const todayCustomers = customers.filter((c: any) => todayCustomerIds.includes(c.id));

          return (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white">Customers</h2>
                <p className="text-gray-500 text-sm">Select a business to view customer rides</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-green-400 uppercase tracking-wider">Select Business</label>
                <select value={selectedBusinessId} onChange={(e) => setSelectedBusinessId(e.target.value)} className="mt-1 w-full md:w-96 bg-gray-900 border border-gray-700 text-white rounded-md px-3 py-2 text-sm focus:border-green-500 focus:outline-none" data-testid="select-customer-business">
                  <option value="">-- Choose a business --</option>
                  {brands.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>

              {selectedBusinessId && selectedBrand && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: "Today Rides", value: todayRides.length, icon: Navigation, color: "from-green-600 to-green-800", glow: "shadow-green-500/20" },
                      { label: "Yesterday Rides", value: yesterdayRides.length, icon: Clock, color: "from-blue-600 to-blue-800", glow: "shadow-blue-500/20" },
                      { label: "Last 7 Days", value: lastWeekRides.length, icon: TrendingUp, color: "from-purple-600 to-purple-800", glow: "shadow-purple-500/20" },
                      { label: "Last 12 Months", value: last12MonthsRides.length, icon: Star, color: "from-cyan-600 to-cyan-800", glow: "shadow-cyan-500/20" },
                    ].map((stat, i) => (
                      <div key={i} className={`bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-4 border border-gray-700 shadow-lg ${stat.glow}`} data-testid={`stat-cust-${stat.label.toLowerCase().replace(/\s/g, '-')}`}>
                        <div className={`w-10 h-10 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center mb-3 shadow-lg`}>
                          <stat.icon className="h-5 w-5 text-white" />
                        </div>
                        <p className="text-2xl font-bold text-white">{stat.value}</p>
                        <p className="text-xs text-gray-500">{stat.label}</p>
                      </div>
                    ))}
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white mb-3">Today's Customers ({todayCustomers.length})</h3>
                    {todayCustomers.length === 0 ? (
                      <p className="text-gray-600 text-sm">No customer rides today</p>
                    ) : (
                      <div className="space-y-3">
                        {todayCustomers.map((customer: any) => {
                          const customerTodayRides = todayRides.filter((r: any) => r.customerId === customer.id);
                          return (
                            <div key={customer.id} className="bg-gray-900 border border-gray-700 rounded-xl p-4 hover:border-green-500/30 transition-all" data-testid={`card-customer-${customer.id}`}>
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-white">{customer.name}</p>
                                  <p className="text-sm text-gray-400">{customer.phone} | {customer.email || "No email"}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs px-2.5 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 font-medium">
                                    {customerTodayRides.length} ride{customerTodayRides.length !== 1 ? "s" : ""} today
                                  </span>
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${customer.status === "active" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>{customer.status}</span>
                                  {customer.status === "active" ? (
                                    <Button size="sm" variant="outline" className="text-red-400 border-red-500/30" onClick={() => updateCustomerMutation.mutate({ id: customer.id, data: { status: "blocked" } })}>Block</Button>
                                  ) : (
                                    <Button size="sm" variant="outline" className="text-green-400 border-green-500/30" onClick={() => updateCustomerMutation.mutate({ id: customer.id, data: { status: "active" } })}>Unblock</Button>
                                  )}
                                </div>
                              </div>
                              <div className="mt-3 space-y-2">
                                {customerTodayRides.map((ride: any) => {
                                  const driver = allDrivers.find((d: any) => d.id === ride.driverId);
                                  const currSym = getCurrencySymbol(selectedBrand?.currency || "GBP");
                                  return (
                                    <div key={ride.id} className="bg-black/30 rounded-lg p-3 border border-gray-700/50">
                                      <div className="flex items-center justify-between text-xs">
                                        <span className={`px-2 py-0.5 rounded-full ${ride.status === "completed" ? "bg-green-500/20 text-green-400" : ride.status === "cancelled" ? "bg-red-500/20 text-red-400" : ride.status === "in_progress" ? "bg-blue-500/20 text-blue-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                                          {ride.status?.replace(/_/g, " ")}
                                        </span>
                                        <span className="text-gray-500">{new Date(ride.createdAt).toLocaleTimeString()}</span>
                                      </div>
                                      <div className="grid grid-cols-2 gap-1 mt-2 text-xs">
                                        <p className="text-gray-400">From: <span className="text-white">{ride.pickupAddress || "N/A"}</span></p>
                                        <p className="text-gray-400">To: <span className="text-white">{ride.dropoffAddress || "N/A"}</span></p>
                                        <p className="text-gray-400">Driver: <span className="text-white">{driver?.name || "N/A"}</span></p>
                                        <p className="text-gray-400">Price: <span className="text-green-400 font-bold">{currSym}{ride.finalPrice || ride.estimatedPrice || "0"}</span></p>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white mb-3">All Customers in {selectedBrand.name} ({(() => { const ids = [...new Set(brandRides.map((r: any) => r.customerId))]; return ids.length; })()})</h3>
                    {(() => {
                      const allBrandCustomerIds = [...new Set(brandRides.map((r: any) => r.customerId))];
                      const allBrandCustomers = customers.filter((c: any) => allBrandCustomerIds.includes(c.id));
                      if (allBrandCustomers.length === 0) return <p className="text-gray-600 text-sm">No customers yet</p>;
                      return (
                        <div className="space-y-3">
                          {allBrandCustomers.map((customer: any) => {
                            const totalRides = brandRides.filter((r: any) => r.customerId === customer.id).length;
                            return (
                              <div key={customer.id} className="bg-gray-900 border border-gray-700 rounded-xl p-4 flex items-center justify-between hover:border-green-500/30 transition-all">
                                <div>
                                  <p className="font-medium text-white">{customer.name}</p>
                                  <p className="text-sm text-gray-400">{customer.phone} | {customer.email || "No email"}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">{totalRides} total rides</span>
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${customer.status === "active" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>{customer.status}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {!selectedBusinessId && (
                <div className="text-center py-16 border border-dashed border-gray-700 rounded-2xl bg-gray-900/50">
                  <Users className="h-12 w-12 text-gray-700 mx-auto mb-3" />
                  <p className="text-gray-500">Select a business above to see customers and ride stats</p>
                </div>
              )}
            </div>
          );
        })()}

        {activeTab === "map" && (
          <TaxiLiveMap
            brands={brands}
            allDrivers={allDrivers}
            allRides={allRides}
            selectedBusinessId={selectedBusinessId}
            setSelectedBusinessId={setSelectedBusinessId}
            mapTown={mapTown}
            setMapTown={setMapTown}
          />
        )}

        {activeTab === "complaints" && (() => {
          const complaintTypes: Record<string, { label: string; icon: any; color: string }> = {
            extra_charge: { label: "Extra Charge", icon: PoundSterling, color: "text-red-400 bg-red-500/20" },
            misbehaviour: { label: "Misbehaviour", icon: AlertTriangle, color: "text-orange-400 bg-orange-500/20" },
            late_arrival: { label: "Late Arrival", icon: Clock, color: "text-yellow-400 bg-yellow-500/20" },
            bad_driving: { label: "Bad Driving", icon: Car, color: "text-red-400 bg-red-500/20" },
            no_refund: { label: "No Refund", icon: DollarSign, color: "text-pink-400 bg-pink-500/20" },
            wrong_route: { label: "Wrong Route", icon: Navigation, color: "text-blue-400 bg-blue-500/20" },
            vehicle_condition: { label: "Vehicle Condition", icon: Car, color: "text-purple-400 bg-purple-500/20" },
            rude_behaviour: { label: "Rude Behaviour", icon: MessageCircle, color: "text-orange-400 bg-orange-500/20" },
            other: { label: "Other", icon: FileText, color: "text-gray-400 bg-gray-500/20" },
          };

          const brandComplaints = selectedBusinessId
            ? complaints.filter((c: any) => {
                if (c.brandId === selectedBusinessId) return true;
                const ride = allRides.find((r: any) => r.id === c.rideId);
                if (ride && ride.brandId === selectedBusinessId) return true;
                const driver = allDrivers.find((d: any) => d.id === c.driverId);
                if (driver && driver.brandId === selectedBusinessId) return true;
                return false;
              })
            : [];

          const openCount = brandComplaints.filter((c: any) => c.status === "open").length;
          const investigatingCount = brandComplaints.filter((c: any) => c.status === "investigating").length;
          const resolvedCount = brandComplaints.filter((c: any) => c.status === "resolved").length;

          return (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white">Complaints</h2>
                <p className="text-gray-500 text-sm">Select a business to view and manage complaints</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-green-400 uppercase tracking-wider">Select Business</label>
                <select value={selectedBusinessId} onChange={(e) => setSelectedBusinessId(e.target.value)} className="mt-1 w-full md:w-96 bg-gray-900 border border-gray-700 text-white rounded-md px-3 py-2 text-sm focus:border-green-500 focus:outline-none" data-testid="select-complaint-business">
                  <option value="">-- Choose a business --</option>
                  {brands.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>

              {selectedBusinessId && (
                <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-4 border border-red-500/20 shadow-lg shadow-red-500/10">
                      <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-800 rounded-lg flex items-center justify-center mb-3">
                        <AlertTriangle className="h-5 w-5 text-white" />
                      </div>
                      <p className="text-2xl font-bold text-white">{openCount}</p>
                      <p className="text-xs text-gray-500">Open</p>
                    </div>
                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-4 border border-yellow-500/20 shadow-lg shadow-yellow-500/10">
                      <div className="w-10 h-10 bg-gradient-to-br from-yellow-600 to-yellow-800 rounded-lg flex items-center justify-center mb-3">
                        <Search className="h-5 w-5 text-white" />
                      </div>
                      <p className="text-2xl font-bold text-white">{investigatingCount}</p>
                      <p className="text-xs text-gray-500">Investigating</p>
                    </div>
                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-4 border border-green-500/20 shadow-lg shadow-green-500/10">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-green-800 rounded-lg flex items-center justify-center mb-3">
                        <Check className="h-5 w-5 text-white" />
                      </div>
                      <p className="text-2xl font-bold text-white">{resolvedCount}</p>
                      <p className="text-xs text-gray-500">Resolved</p>
                    </div>
                  </div>

                  {brandComplaints.length === 0 ? (
                    <div className="text-center py-16 border border-dashed border-gray-700 rounded-2xl bg-gray-900/50">
                      <Check className="h-12 w-12 text-green-600 mx-auto mb-3" />
                      <p className="text-gray-500">No complaints for this business</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {brandComplaints.map((complaint: any) => {
                        const customer = customers.find((c: any) => c.id === complaint.customerId);
                        const driver = allDrivers.find((d: any) => d.id === complaint.driverId);
                        const ride = allRides.find((r: any) => r.id === complaint.rideId);
                        const typeInfo = complaintTypes[complaint.complaintType || "other"] || complaintTypes.other;
                        const TypeIcon = typeInfo.icon;
                        const brand = brands.find((b: any) => b.id === selectedBusinessId);
                        const currSym = getCurrencySymbol(brand?.currency || "GBP");

                        return (
                          <div key={complaint.id} className="bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden hover:border-green-500/30 transition-all" data-testid={`card-complaint-${complaint.id}`}>
                            <div className="flex items-center justify-between px-5 py-3 bg-gray-800/50 border-b border-gray-700/50">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${typeInfo.color}`}>
                                  <TypeIcon className="h-4 w-4" />
                                </div>
                                <div>
                                  <span className={`text-sm font-semibold ${typeInfo.color.split(" ")[0]}`}>{typeInfo.label}</span>
                                  <p className="text-[10px] text-gray-500">#{complaint.id.slice(0, 8)}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${complaint.status === "open" ? "bg-red-500/20 text-red-400 border border-red-500/30" : complaint.status === "investigating" ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30" : "bg-green-500/20 text-green-400 border border-green-500/30"}`}>
                                  {complaint.status === "open" ? "Open" : complaint.status === "investigating" ? "Investigating" : "Resolved"}
                                </span>
                                <span className="text-xs text-gray-500">{new Date(complaint.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>

                            <div className="p-5 space-y-4">
                              <div className="grid md:grid-cols-2 gap-4">
                                <div className="bg-black/30 rounded-xl p-4 border border-gray-700/50">
                                  <p className="text-[10px] font-semibold text-green-400 uppercase tracking-wider mb-2">Customer</p>
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center border border-gray-600">
                                      <User className="h-5 w-5 text-green-400" />
                                    </div>
                                    <div>
                                      <p className="font-medium text-white text-sm">{customer?.name || "Unknown"}</p>
                                      <div className="flex flex-col gap-0.5 mt-1">
                                        {customer?.phone && <p className="text-xs text-gray-400 flex items-center gap-1"><Phone className="h-3 w-3" /> {customer.phone}</p>}
                                        {customer?.email && <p className="text-xs text-gray-400 flex items-center gap-1"><Mail className="h-3 w-3" /> {customer.email}</p>}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="bg-black/30 rounded-xl p-4 border border-gray-700/50">
                                  <p className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider mb-2">Driver</p>
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center border border-gray-600 overflow-hidden">
                                      {driver?.photo ? <img src={driver.photo} alt="" className="w-full h-full object-cover" /> : <User className="h-5 w-5 text-blue-400" />}
                                    </div>
                                    <div>
                                      <p className="font-medium text-white text-sm">{driver?.name || "Unknown"}</p>
                                      <div className="flex flex-col gap-0.5 mt-1">
                                        {driver?.phone && <p className="text-xs text-gray-400 flex items-center gap-1"><Phone className="h-3 w-3" /> {driver.phone}</p>}
                                        <p className="text-xs text-gray-400 flex items-center gap-1">
                                          <VehicleIcon type={driver?.vehicleType} size={12} /> {driver?.vehicleType?.replace(/_/g, " ") || "N/A"} | {driver?.numberPlate || "No plate"}
                                        </p>
                                        {driver?.address && <p className="text-xs text-gray-400 flex items-center gap-1"><MapPin className="h-3 w-3" /> {driver.address}</p>}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {ride && (
                                <div className="bg-black/20 rounded-xl p-4 border border-gray-700/30">
                                  <p className="text-[10px] font-semibold text-purple-400 uppercase tracking-wider mb-2">Ride Details</p>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                    <div>
                                      <p className="text-gray-500">From</p>
                                      <p className="text-white">{ride.pickupAddress || "N/A"}</p>
                                    </div>
                                    <div>
                                      <p className="text-gray-500">To</p>
                                      <p className="text-white">{ride.dropoffAddress || "N/A"}</p>
                                    </div>
                                    <div>
                                      <p className="text-gray-500">Distance</p>
                                      <p className="text-white">{ride.distanceMiles ? `${ride.distanceMiles} mi` : "N/A"}</p>
                                    </div>
                                    <div>
                                      <p className="text-gray-500">Price</p>
                                      <p className="text-green-400 font-bold">{currSym}{ride.finalPrice || ride.estimatedPrice || "0"}</p>
                                    </div>
                                  </div>
                                </div>
                              )}

                              <div className="bg-black/20 rounded-xl p-4 border border-gray-700/30">
                                <p className="text-[10px] font-semibold text-yellow-400 uppercase tracking-wider mb-2">Complaint Details</p>
                                <p className="text-sm text-gray-300 leading-relaxed">{complaint.description}</p>
                              </div>

                              {complaint.resolution && (
                                <div className="bg-green-500/5 rounded-xl p-4 border border-green-500/20">
                                  <p className="text-[10px] font-semibold text-green-400 uppercase tracking-wider mb-1">Resolution</p>
                                  <p className="text-sm text-green-300">{complaint.resolution}</p>
                                  {complaint.resolvedBy && <p className="text-xs text-gray-500 mt-1">Resolved by: {complaint.resolvedBy}</p>}
                                </div>
                              )}

                              {complaint.status !== "resolved" && (
                                <div className="flex gap-2 pt-1">
                                  {complaint.status === "open" && (
                                    <Button size="sm" variant="outline" className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10 gap-1" onClick={() => resolveComplaintMutation.mutate({ id: complaint.id, data: { status: "investigating" } })}>
                                      <Search className="h-3 w-3" /> Investigating
                                    </Button>
                                  )}
                                  <Button size="sm" className="bg-green-600 hover:bg-green-700 gap-1" onClick={() => { const res = prompt("Enter resolution:"); if (res) resolveComplaintMutation.mutate({ id: complaint.id, data: { status: "resolved", resolution: res, resolvedBy: "super_admin" } }); }}>
                                    <Check className="h-3 w-3" /> Resolve
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {!selectedBusinessId && (
                <div className="text-center py-16 border border-dashed border-gray-700 rounded-2xl bg-gray-900/50">
                  <MessageCircle className="h-12 w-12 text-gray-700 mx-auto mb-3" />
                  <p className="text-gray-500">Select a business above to see complaints</p>
                </div>
              )}
            </div>
          );
        })()}

        {activeTab === "settings" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Settings</h2>
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 space-y-4 max-w-md">
              <p className="text-gray-400 text-sm">You are the Super Admin. You control all taxi businesses from this dashboard.</p>
              <div className="bg-black/30 rounded-lg p-4 space-y-2 text-sm">
                <p className="text-gray-400">Brand Admin Login: <span className="text-green-400 font-mono">/taxi-brand-login</span></p>
                <p className="text-gray-400">Driver Login: <span className="text-green-400 font-mono">/taxi-login</span></p>
                <p className="text-gray-400">Customer Page: <span className="text-green-400 font-mono">/taxi/brand-slug</span></p>
              </div>
              <Button variant="outline" onClick={() => navigate("/portal")} className="border-gray-600 text-gray-300 hover:bg-gray-800 gap-2">
                <ArrowLeft className="h-4 w-4" /> Back to Portal
              </Button>
            </div>
          </div>
        )}
      </main>

      <Dialog open={showBrandForm} onOpenChange={(open) => { if (!open) { setShowBrandForm(false); setEditingBrand(null); resetBrandForm(); } }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-gray-950 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center">
                {editingBrand?._isDuplicate ? <Copy className="h-4 w-4 text-white" /> : editingBrand ? <Edit2 className="h-4 w-4 text-white" /> : <Plus className="h-4 w-4 text-white" />}
              </div>
              {editingBrand?._isDuplicate ? "Duplicate Business" : editingBrand ? "Edit Business" : "Create New Business"}
            </DialogTitle>
          </DialogHeader>
          {renderBrandForm()}
        </DialogContent>
      </Dialog>
    </div>
  );
}