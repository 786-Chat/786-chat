import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Car, Users, Plus, Edit2, Trash2, Check, X, AlertTriangle,
  Phone, Mail, MapPin, Shield, ExternalLink, FileText, LogOut,
  Menu as MenuIcon, Navigation, Star, Clock, Loader2, Settings,
  LayoutDashboard, MessageCircle, TrendingUp, Search, Map,
  ChevronDown, ChevronUp, PoundSterling, Palette, Save, Ban,
  UserX, Send, Eye, CreditCard, DollarSign, Banknote, Truck,
  Bike, Camera, IdCard, Building2, UserCheck, Globe, Hash,
  Wallet, CalendarDays, Fuel, Armchair, ShieldAlert, Lock, QrCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

type TabView = "dashboard" | "drivers" | "add-driver" | "blocked-drivers" | "customers" | "blocked-customers" | "live-map" | "rides" | "complaints" | "messages" | "brand-settings" | "qr-codes";

const VEHICLE_TYPES = [
  { value: "car", label: "Car" },
  { value: "sedan_5", label: "Sedan (5 Seat)" },
  { value: "mpv_7", label: "MPV (7 Seat)" },
  { value: "motorbike", label: "Motorbike" },
  { value: "3_seater", label: "3 Seater" },
  { value: "5_seater", label: "5 Seater" },
  { value: "7_seater", label: "7 Seater" },
  { value: "18_seater", label: "18 Seater (Minibus)" },
  { value: "truck", label: "Truck" },
  { value: "bus", label: "Bus" },
  { value: "bicycle", label: "Bicycle" },
  { value: "electric", label: "Electric Vehicle" },
  { value: "custom", label: "Custom (Specify Seats)" },
];

const VEHICLE_CATEGORIES = [
  { value: "taxi", label: "Taxi" },
  { value: "sharing", label: "Ride Sharing" },
  { value: "recovery_truck", label: "Recovery Truck" },
  { value: "delivery_truck", label: "Delivery Truck" },
  { value: "removal_van", label: "Removal Van" },
  { value: "courier", label: "Courier / Parcel" },
  { value: "school_run", label: "School Run" },
  { value: "airport_transfer", label: "Airport Transfer" },
  { value: "corporate", label: "Corporate / Executive" },
  { value: "ambulance", label: "Private Ambulance" },
  { value: "tow_truck", label: "Tow Truck" },
  { value: "other", label: "Other" },
];

const FUEL_TYPES = [
  { value: "petrol", label: "Petrol" },
  { value: "diesel", label: "Diesel" },
  { value: "electric", label: "Electric" },
  { value: "hybrid", label: "Hybrid" },
  { value: "lpg", label: "LPG" },
  { value: "cng", label: "CNG" },
];

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "stripe", label: "Stripe" },
  { value: "jazzcash", label: "JazzCash" },
  { value: "easypaisa", label: "EasyPaisa" },
  { value: "hbl", label: "HBL" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "upi", label: "UPI" },
  { value: "paypal", label: "PayPal" },
];

const CURRENCIES = [
  { value: "GBP", symbol: "£", label: "British Pound (£)" },
  { value: "USD", symbol: "$", label: "US Dollar ($)" },
  { value: "PKR", symbol: "₨", label: "Pakistani Rupee (₨)" },
  { value: "EUR", symbol: "€", label: "Euro (€)" },
  { value: "INR", symbol: "₹", label: "Indian Rupee (₹)" },
  { value: "AED", symbol: "د.إ", label: "UAE Dirham (د.إ)" },
  { value: "SAR", symbol: "﷼", label: "Saudi Riyal (﷼)" },
  { value: "TRY", symbol: "₺", label: "Turkish Lira (₺)" },
];

const EMPLOYMENT_TYPES = [
  { value: "self_employed", label: "Self Employed" },
  { value: "company", label: "Company Driver" },
  { value: "contractor", label: "Contractor" },
  { value: "part_time", label: "Part Time" },
];

const PAYMENT_AGREEMENTS = [
  { value: "commission", label: "Commission Based" },
  { value: "fixed_weekly", label: "Fixed Salary (Weekly)" },
  { value: "fixed_monthly", label: "Fixed Salary (Monthly)" },
  { value: "commission_plus_fixed", label: "Commission + Fixed Salary" },
  { value: "per_ride", label: "Per Ride Flat Fee" },
];

const defaultDriverForm = {
  name: "", phone: "", whatsapp: "", email: "", address: "", country: "",
  photo: "", emergencyPhone: "", companyName: "", employmentType: "self_employed",
  drivingLicenceNumber: "", drivingLicenceImage: "", visaType: "citizen",
  visaImage: "", insuranceImage: "", carImage: "", carColor: "", carModel: "",
  numberPlate: "", vehicleType: "sedan_5", vehicleCategory: "taxi",
  seatCount: 5, fuelType: "petrol", serviceRadiusMiles: "5",
  password: "", weeklyHoursAllowed: 48, timingPreference: "",
  paymentAgreement: "commission", commissionPercent: "10", fixedSalary: "0",
  salaryPeriod: "weekly", paymentMethod: "cash", currency: "GBP",
  receiveBankName: "", receiveBankAccountName: "", receiveBankSortCode: "",
  receiveBankAccountNumber: "", receiveBankIban: "",
  receiveJazzCashNumber: "", receiveJazzCashName: "",
  receiveEasyPaisaNumber: "", receiveEasyPaisaName: "",
  receiveStripeAccountId: "",
  receiveHblAccountName: "", receiveHblAccountNumber: "", receiveHblIban: "",
};

const DRIVER_ACCENT = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b"];
const DEMO_STARTS = [
  { lat: 51.5120, lng: -0.1000 },
  { lat: 51.5060, lng: -0.1150 },
  { lat: 51.5180, lng: -0.0850 },
  { lat: 51.5040, lng: -0.0950 },
];

function makeCarSvg(rotation: number, accent: string, name: string, idx: number): string {
  const r = rotation - 90;
  const darken = (hex: string, amt: number) => {
    const n = parseInt(hex.slice(1), 16);
    const rr = Math.max(0, (n >> 16) - amt);
    const gg = Math.max(0, ((n >> 8) & 0xff) - amt);
    const bb = Math.max(0, (n & 0xff) - amt);
    return `rgb(${rr},${gg},${bb})`;
  };
  const bodyDark = darken(accent, 40);
  const bodyLight = accent;
  return `<div style="position:relative;width:56px;height:68px;">
    <div style="position:absolute;left:50%;top:50%;width:56px;height:56px;margin-left:-28px;margin-top:-34px;">
      <div style="width:56px;height:56px;filter:drop-shadow(0 4px 8px rgba(0,0,0,0.6));transform:rotate(${r}deg);transform-origin:center center;">
        <svg viewBox="0 0 60 60" width="56" height="56">
          <rect x="18" y="4" width="24" height="52" rx="12" fill="${bodyDark}" stroke="rgba(255,255,255,0.3)" stroke-width="0.8"/>
          <rect x="20" y="6" width="20" height="48" rx="10" fill="${bodyLight}"/>
          <rect x="21" y="12" width="18" height="10" rx="3" fill="rgba(200,240,255,0.45)" stroke="rgba(255,255,255,0.35)" stroke-width="0.6"/>
          <rect x="21" y="38" width="18" height="8" rx="3" fill="rgba(200,240,255,0.35)" stroke="rgba(255,255,255,0.25)" stroke-width="0.5"/>
          <line x1="30" y1="24" x2="30" y2="36" stroke="rgba(255,255,255,0.12)" stroke-width="0.5"/>
          <rect x="15" y="16" width="5" height="9" rx="2" fill="${bodyDark}" stroke="rgba(255,255,255,0.2)" stroke-width="0.5"/>
          <rect x="40" y="16" width="5" height="9" rx="2" fill="${bodyDark}" stroke="rgba(255,255,255,0.2)" stroke-width="0.5"/>
          <rect x="15" y="35" width="5" height="9" rx="2" fill="${bodyDark}" stroke="rgba(255,255,255,0.2)" stroke-width="0.5"/>
          <rect x="40" y="35" width="5" height="9" rx="2" fill="${bodyDark}" stroke="rgba(255,255,255,0.2)" stroke-width="0.5"/>
          <circle cx="23" cy="7" r="2" fill="rgba(255,255,200,0.95)" stroke="rgba(255,255,255,0.5)" stroke-width="0.4"/>
          <circle cx="37" cy="7" r="2" fill="rgba(255,255,200,0.95)" stroke="rgba(255,255,255,0.5)" stroke-width="0.4"/>
          <rect x="23" y="50" width="6" height="3" rx="1.5" fill="rgba(255,80,80,0.85)"/>
          <rect x="31" y="50" width="6" height="3" rx="1.5" fill="rgba(255,80,80,0.85)"/>
          <rect x="26" y="24" width="8" height="12" rx="1" fill="rgba(255,255,255,0.08)"/>
        </svg>
      </div>
    </div>
    <div style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);white-space:nowrap;font-size:10px;font-weight:700;color:#fff;background:${accent};padding:2px 8px;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,0.4);letter-spacing:0.3px;line-height:1.3;">${name}</div>
  </div>`;
}

function LiveMapComponent({ brandId, drivers }: { brandId: string; drivers: any[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const simulatedPosRef = useRef<Record<string, { lat: number; lng: number; angle: number; speed: number }>>({});
  const [simTick, setSimTick] = useState(0);

  useEffect(() => {
    drivers.forEach((d: any, i: number) => {
      if (!simulatedPosRef.current[d.id]) {
        const start = DEMO_STARTS[i % DEMO_STARTS.length];
        simulatedPosRef.current[d.id] = {
          lat: (d.lastLocationLat ? parseFloat(d.lastLocationLat) : start.lat) + (Math.random() - 0.5) * 0.008,
          lng: (d.lastLocationLng ? parseFloat(d.lastLocationLng) : start.lng) + (Math.random() - 0.5) * 0.008,
          angle: Math.random() * Math.PI * 2,
          speed: 0.00015 + Math.random() * 0.00025,
        };
      }
    });
  }, [drivers]);

  useEffect(() => {
    const interval = setInterval(() => {
      const center = { lat: 51.510, lng: -0.100 };
      const radius = 0.025;
      Object.keys(simulatedPosRef.current).forEach(id => {
        const pos = simulatedPosRef.current[id];
        pos.angle += (Math.random() - 0.5) * 1.0;
        pos.lat += Math.sin(pos.angle) * pos.speed;
        pos.lng += Math.cos(pos.angle) * pos.speed;
        const dLat = pos.lat - center.lat;
        const dLng = pos.lng - center.lng;
        const dist = Math.sqrt(dLat * dLat + dLng * dLng);
        if (dist > radius) {
          pos.angle = Math.atan2(-dLat, -dLng) + (Math.random() - 0.5) * 0.5;
        }
      });
      setSimTick(t => t + 1);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let L: any;
    const initMap = async () => {
      L = (await import("leaflet")).default;
      if (!document.querySelector('link[href*="leaflet"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }
      if (!mapRef.current || mapInstanceRef.current) return;
      const map = L.map(mapRef.current, { zoomControl: true }).setView([51.510, -0.100], 15);
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
      }).addTo(map);
      mapInstanceRef.current = map;
      updateMarkers(L, map);
    };
    initMap();
    return () => { if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; } };
  }, []);

  useEffect(() => {
    const updateAsync = async () => {
      const L = (await import("leaflet")).default;
      if (mapInstanceRef.current) updateMarkers(L, mapInstanceRef.current);
    };
    updateAsync();
  }, [drivers, simTick]);

  const updateMarkers = (L: any, map: any) => {
    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];
    const driversOnDuty = drivers.filter((d: any) => d.onDuty);
    driversOnDuty.forEach((driver: any, idx: number) => {
      const accent = DRIVER_ACCENT[idx % DRIVER_ACCENT.length];
      const pos = simulatedPosRef.current[driver.id];
      if (!pos) return;
      const rotation = pos.angle * 180 / Math.PI;
      const svgIcon = L.divIcon({
        html: makeCarSvg(rotation, accent, driver.name?.split(" ")[0] || "Driver", idx),
        className: "",
        iconSize: [56, 68],
        iconAnchor: [28, 34],
      });
      const marker = L.marker([pos.lat, pos.lng], { icon: svgIcon })
        .addTo(map)
        .bindPopup(`<div style="min-width:160px;font-family:system-ui">
          <div style="font-weight:700;font-size:14px;color:${accent};margin-bottom:4px">${driver.name}</div>
          <div style="font-size:12px;color:#666;margin-bottom:2px">${driver.phone}</div>
          <div style="font-size:11px;color:#999">${driver.vehicleType?.replace(/_/g," ")} • ${driver.numberPlate || "N/A"}</div>
          <div style="margin-top:4px;font-size:11px;font-weight:600;color:${accent}">${driver.onDuty ? "● On Duty" : "○ Off Duty"}</div>
        </div>`);
      markersRef.current.push(marker);
    });
  };

  const onDutyCount = drivers.filter((d: any) => d.onDuty).length;
  const liveCount = Object.keys(simulatedPosRef.current).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-gray-900">Live Driver Map</h2>
        <div className="flex gap-2 text-sm flex-wrap">
          {drivers.filter((d: any) => d.onDuty).map((d: any, i: number) => (
            <span key={d.id} className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border shadow-sm">
              <span className="w-3 h-3 rounded-full inline-block" style={{ background: DRIVER_ACCENT[i % DRIVER_ACCENT.length] }} />
              <span className="text-xs font-semibold text-gray-700">{d.name?.split(" ")[0]}</span>
              <span className={`w-2 h-2 rounded-full ${d.onDuty ? "bg-green-500 animate-pulse" : "bg-gray-300"}`} />
            </span>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-3 border shadow-sm text-center">
          <p className="text-2xl font-bold text-blue-600">{drivers.length}</p>
          <p className="text-xs text-gray-500">Total Drivers</p>
        </div>
        <div className="bg-white rounded-xl p-3 border shadow-sm text-center">
          <p className="text-2xl font-bold text-green-600">{onDutyCount}</p>
          <p className="text-xs text-gray-500">On Duty Now</p>
        </div>
        <div className="bg-white rounded-xl p-3 border shadow-sm text-center">
          <p className="text-2xl font-bold text-purple-600">{liveCount}</p>
          <p className="text-xs text-gray-500">Live on Map</p>
        </div>
      </div>
      <div ref={mapRef} className="w-full rounded-2xl border overflow-hidden shadow-lg" style={{ height: "550px" }} />
    </div>
  );
}

function QrCodesTab({ drivers, qrSelectedDriverId, setQrSelectedDriverId, setEditingDriver, setActiveTab }: { drivers: any[]; qrSelectedDriverId: string | null; setQrSelectedDriverId: (id: string | null) => void; setEditingDriver: (d: any) => void; setActiveTab: (t: TabView) => void }) {
  const qrDriver = drivers.find((d: any) => String(d.id) === qrSelectedDriverId);
  const hasBankDetails = qrDriver?.receiveBankName || qrDriver?.receiveBankAccountNumber;
  const hasJazzCash = qrDriver?.receiveJazzCashNumber;
  const hasEasyPaisa = qrDriver?.receiveEasyPaisaNumber;
  const hasHbl = qrDriver?.receiveHblAccountName || qrDriver?.receiveHblAccountNumber;
  const hasAnyPayment = hasBankDetails || hasJazzCash || hasEasyPaisa || hasHbl;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3"><QrCode className="h-7 w-7 text-cyan-500" /> Payment QR Codes</h2>
        <p className="text-gray-500 mt-1">Select a driver to see their payment QR codes. Customers scan these to pay the driver directly.</p>
      </div>

      <div className="bg-white rounded-xl border p-5 shadow-sm">
        <label className="text-sm font-medium text-gray-700 block mb-2">Select Driver</label>
        <select
          className="w-full border rounded-lg px-4 py-3 text-sm bg-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
          value={qrSelectedDriverId ?? ""}
          onChange={e => {
            const val = e.target.value;
            setQrSelectedDriverId(val || null);
          }}
          data-testid="select-qr-driver"
        >
          <option value="">-- Choose a driver --</option>
          {drivers.map((d: any) => (
            <option key={d.id} value={d.id}>{d.name} — {d.phone}</option>
          ))}
        </select>
      </div>

      {qrDriver && !hasAnyPayment && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
          <AlertTriangle className="h-10 w-10 text-yellow-500 mx-auto mb-3" />
          <h3 className="font-bold text-lg text-gray-800">{qrDriver.name} has no payment details</h3>
          <p className="text-gray-600 mt-1">Go to <button onClick={() => { setEditingDriver(qrDriver); setActiveTab("drivers"); }} className="text-cyan-600 underline font-medium">Edit Driver</button> and add payment details under "Customer Payment Receiving"</p>
        </div>
      )}

      {qrDriver && hasAnyPayment && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {hasBankDetails && (
            <div className="bg-white rounded-2xl border-2 border-green-200 shadow-lg overflow-hidden" data-testid="qr-card-bank">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-5 py-3">
                <h3 className="font-bold text-white flex items-center gap-2"><Banknote className="h-5 w-5" /> Bank Transfer</h3>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex justify-center">
                  <div className="bg-white p-3 rounded-xl shadow-md border-2 border-green-100">
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`Bank: ${qrDriver.receiveBankName || ""}\nName: ${qrDriver.receiveBankAccountName || ""}\nSort Code: ${qrDriver.receiveBankSortCode || ""}\nAccount: ${qrDriver.receiveBankAccountNumber || ""}\nIBAN: ${qrDriver.receiveBankIban || ""}`)}`} alt="Bank QR" className="w-[200px] h-[200px]" data-testid="img-qr-bank" />
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  {qrDriver.receiveBankName && <div className="flex justify-between bg-green-50 rounded-lg px-3 py-2"><span className="text-gray-500">Bank</span><span className="font-mono font-medium">{qrDriver.receiveBankName}</span></div>}
                  {qrDriver.receiveBankAccountName && <div className="flex justify-between bg-green-50 rounded-lg px-3 py-2"><span className="text-gray-500">Name</span><span className="font-mono font-medium">{qrDriver.receiveBankAccountName}</span></div>}
                  {qrDriver.receiveBankSortCode && <div className="flex justify-between bg-green-50 rounded-lg px-3 py-2"><span className="text-gray-500">Sort Code</span><span className="font-mono font-medium">{qrDriver.receiveBankSortCode}</span></div>}
                  {qrDriver.receiveBankAccountNumber && <div className="flex justify-between bg-green-50 rounded-lg px-3 py-2"><span className="text-gray-500">Account No.</span><span className="font-mono font-medium">{qrDriver.receiveBankAccountNumber}</span></div>}
                  {qrDriver.receiveBankIban && <div className="flex justify-between bg-green-50 rounded-lg px-3 py-2"><span className="text-gray-500">IBAN</span><span className="font-mono font-medium text-xs">{qrDriver.receiveBankIban}</span></div>}
                </div>
                <p className="text-xs text-gray-400 text-center">Pay {qrDriver.name} via bank transfer</p>
              </div>
            </div>
          )}

          {hasJazzCash && (
            <div className="bg-white rounded-2xl border-2 border-purple-200 shadow-lg overflow-hidden" data-testid="qr-card-jazzcash">
              <div className="bg-gradient-to-r from-purple-500 to-indigo-600 px-5 py-3">
                <h3 className="font-bold text-white flex items-center gap-2"><Wallet className="h-5 w-5" /> JazzCash</h3>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex justify-center">
                  <div className="bg-white p-3 rounded-xl shadow-md border-2 border-purple-100">
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`JazzCash: ${qrDriver.receiveJazzCashNumber}\nName: ${qrDriver.receiveJazzCashName || ""}`)}`} alt="JazzCash QR" className="w-[200px] h-[200px]" data-testid="img-qr-jazzcash" />
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between bg-purple-50 rounded-lg px-3 py-2"><span className="text-gray-500">Number</span><span className="font-mono font-medium">{qrDriver.receiveJazzCashNumber}</span></div>
                  {qrDriver.receiveJazzCashName && <div className="flex justify-between bg-purple-50 rounded-lg px-3 py-2"><span className="text-gray-500">Name</span><span className="font-mono font-medium">{qrDriver.receiveJazzCashName}</span></div>}
                </div>
                <p className="text-xs text-gray-400 text-center">Pay {qrDriver.name} via JazzCash</p>
              </div>
            </div>
          )}

          {hasEasyPaisa && (
            <div className="bg-white rounded-2xl border-2 border-orange-200 shadow-lg overflow-hidden" data-testid="qr-card-easypaisa">
              <div className="bg-gradient-to-r from-orange-500 to-amber-600 px-5 py-3">
                <h3 className="font-bold text-white flex items-center gap-2"><Wallet className="h-5 w-5" /> EasyPaisa</h3>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex justify-center">
                  <div className="bg-white p-3 rounded-xl shadow-md border-2 border-orange-100">
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`EasyPaisa: ${qrDriver.receiveEasyPaisaNumber}\nName: ${qrDriver.receiveEasyPaisaName || ""}`)}`} alt="EasyPaisa QR" className="w-[200px] h-[200px]" data-testid="img-qr-easypaisa" />
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between bg-orange-50 rounded-lg px-3 py-2"><span className="text-gray-500">Number</span><span className="font-mono font-medium">{qrDriver.receiveEasyPaisaNumber}</span></div>
                  {qrDriver.receiveEasyPaisaName && <div className="flex justify-between bg-orange-50 rounded-lg px-3 py-2"><span className="text-gray-500">Name</span><span className="font-mono font-medium">{qrDriver.receiveEasyPaisaName}</span></div>}
                </div>
                <p className="text-xs text-gray-400 text-center">Pay {qrDriver.name} via EasyPaisa</p>
              </div>
            </div>
          )}

          {hasHbl && (
            <div className="bg-white rounded-2xl border-2 border-teal-200 shadow-lg overflow-hidden" data-testid="qr-card-hbl">
              <div className="bg-gradient-to-r from-teal-500 to-cyan-600 px-5 py-3">
                <h3 className="font-bold text-white flex items-center gap-2"><Banknote className="h-5 w-5" /> HBL Bank</h3>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex justify-center">
                  <div className="bg-white p-3 rounded-xl shadow-md border-2 border-teal-100">
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`HBL Bank\nName: ${qrDriver.receiveHblAccountName || ""}\nAccount: ${qrDriver.receiveHblAccountNumber || ""}\nIBAN: ${qrDriver.receiveHblIban || ""}`)}`} alt="HBL QR" className="w-[200px] h-[200px]" data-testid="img-qr-hbl" />
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  {qrDriver.receiveHblAccountName && <div className="flex justify-between bg-teal-50 rounded-lg px-3 py-2"><span className="text-gray-500">Name</span><span className="font-mono font-medium">{qrDriver.receiveHblAccountName}</span></div>}
                  {qrDriver.receiveHblAccountNumber && <div className="flex justify-between bg-teal-50 rounded-lg px-3 py-2"><span className="text-gray-500">Account No.</span><span className="font-mono font-medium">{qrDriver.receiveHblAccountNumber}</span></div>}
                  {qrDriver.receiveHblIban && <div className="flex justify-between bg-teal-50 rounded-lg px-3 py-2"><span className="text-gray-500">IBAN</span><span className="font-mono font-medium text-xs">{qrDriver.receiveHblIban}</span></div>}
                </div>
                <p className="text-xs text-gray-400 text-center">Pay {qrDriver.name} via HBL</p>
              </div>
            </div>
          )}
        </div>
      )}

      {!qrSelectedDriverId && (
        <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-10 text-center">
          <QrCode className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-500 text-lg">Select a driver above</h3>
          <p className="text-gray-400 mt-1">Their payment QR codes will appear here</p>
        </div>
      )}
    </div>
  );
}

export default function TaxiBrandAdminDashboard() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const brandId = localStorage.getItem("taxiBrandAdminId") || "";
  const brandName = localStorage.getItem("taxiBrandAdminName") || "";
  const brandSlug = localStorage.getItem("taxiBrandAdminSlug") || "";

  const [activeTab, setActiveTab] = useState<TabView>("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingBrandSettings, setEditingBrandSettings] = useState(false);
  const [viewingDriver, setViewingDriver] = useState<any>(null);
  const [editingDriver, setEditingDriver] = useState<any>(null);
  const [messageText, setMessageText] = useState("");
  const [messageDriver, setMessageDriver] = useState<any>(null);
  const [qrSelectedDriverId, setQrSelectedDriverId] = useState<string | null>(null);

  const [driverForm, setDriverForm] = useState({ ...defaultDriverForm, brandId });
  const resetDriverForm = () => setDriverForm({ ...defaultDriverForm, brandId });
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);

  useEffect(() => {
    if (!brandId) navigate("/taxi-brand-login");
  }, [brandId, navigate]);

  const { data: brand } = useQuery({
    queryKey: ["/api/taxi-brands", brandSlug],
    queryFn: () => fetch(`/api/taxi-brands/${brandSlug}`).then(r => r.json()),
    enabled: !!brandSlug,
  });

  const [brandSettingsForm, setBrandSettingsForm] = useState<any>({});
  useEffect(() => {
    if (brand) setBrandSettingsForm({ name: brand.name, logo: brand.logo || "", address: brand.address || "", phone: brand.phone || "", email: brand.email || "", whatsapp: brand.whatsapp || "", primaryColor: brand.primaryColor || "#1a1a2e", secondaryColor: brand.secondaryColor || "#e94560", description: brand.description || "", stripePublishableKey: brand.stripePublishableKey || "", stripeSecretKey: brand.stripeSecretKey || "", bankTransferEnabled: brand.bankTransferEnabled || false, bankName: brand.bankName || "", bankAccountName: brand.bankAccountName || "", bankSortCode: brand.bankSortCode || "", bankAccountNumber: brand.bankAccountNumber || "", bankIban: brand.bankIban || "", jazzCashEnabled: brand.jazzCashEnabled || false, jazzCashNumber: brand.jazzCashNumber || "", jazzCashAccountName: brand.jazzCashAccountName || "", easyPaisaEnabled: brand.easyPaisaEnabled || false, easyPaisaNumber: brand.easyPaisaNumber || "", easyPaisaAccountName: brand.easyPaisaAccountName || "" });
  }, [brand]);

  const { data: drivers = [] } = useQuery({
    queryKey: ["/api/taxi-drivers", "brand", brandId],
    queryFn: () => fetch(`/api/taxi-drivers?brandId=${brandId}`).then(r => r.json()),
    enabled: !!brandId,
    refetchInterval: 15000,
  });

  const { data: rides = [] } = useQuery({
    queryKey: ["/api/taxi-rides", "brand", brandId],
    queryFn: () => fetch(`/api/taxi-rides?brandId=${brandId}`).then(r => r.json()),
    enabled: !!brandId,
  });

  const { data: complaints = [] } = useQuery({
    queryKey: ["/api/taxi-complaints", "brand", brandId],
    queryFn: () => fetch(`/api/taxi-complaints?brandId=${brandId}`).then(r => r.json()),
    enabled: !!brandId,
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["/api/taxi-customers", "brand", brandId],
    queryFn: () => fetch(`/api/taxi-customers`).then(r => r.json()),
    enabled: !!brandId,
  });

  const { data: selectedDriverEarnings } = useQuery({
    queryKey: ["/api/taxi-drivers", selectedDriverId, "earnings"],
    queryFn: () => fetch(`/api/taxi-drivers/${selectedDriverId}/earnings`).then(r => r.json()),
    enabled: !!selectedDriverId,
  });

  const { data: selectedDriverFuel = [] } = useQuery({
    queryKey: ["/api/taxi-drivers", selectedDriverId, "fuel-logs"],
    queryFn: () => fetch(`/api/taxi-drivers/${selectedDriverId}/fuel-logs`).then(r => r.json()),
    enabled: !!selectedDriverId,
  });

  const { data: selectedDriverExpenses = [] } = useQuery({
    queryKey: ["/api/taxi-drivers", selectedDriverId, "expenses"],
    queryFn: () => fetch(`/api/taxi-drivers/${selectedDriverId}/expenses`).then(r => r.json()),
    enabled: !!selectedDriverId,
  });

  const { data: selectedDriverWorkLogs = [] } = useQuery({
    queryKey: ["/api/taxi-drivers", selectedDriverId, "work-logs"],
    queryFn: () => fetch(`/api/taxi-drivers/${selectedDriverId}/work-logs`).then(r => r.json()),
    enabled: !!selectedDriverId,
  });

  const createDriverMutation = useMutation({
    mutationFn: (data: any) => fetch("/api/taxi-drivers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(r => { if (!r.ok) throw new Error("Failed"); return r.json(); }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/taxi-drivers"] }); resetDriverForm(); setActiveTab("drivers"); toast({ title: "Driver Created Successfully!" }); },
    onError: () => { toast({ title: "Failed to create driver", variant: "destructive" }); },
  });

  const updateDriverMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => fetch(`/api/taxi-drivers/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/taxi-drivers"] }); toast({ title: "Driver Updated" }); },
  });

  const deleteDriverMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/taxi-drivers/${id}`, { method: "DELETE" }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/taxi-drivers"] }); toast({ title: "Driver Deleted" }); },
  });

  const deleteRideMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/taxi-rides/${id}`, { method: "DELETE" }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/taxi-rides"] }); toast({ title: "Ride Deleted" }); },
  });

  const updateBrandMutation = useMutation({
    mutationFn: (data: any) => fetch(`/api/taxi-brands/${brandId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/taxi-brands"] }); setEditingBrandSettings(false); toast({ title: "Brand Settings Saved" }); },
  });

  const updateCustomerMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => fetch(`/api/taxi-customers/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/taxi-customers"] }); toast({ title: "Customer Updated" }); },
  });

  const activeDrivers = drivers.filter((d: any) => d.onDuty);
  const pendingDrivers = drivers.filter((d: any) => d.status === "pending");
  const blockedDrivers = drivers.filter((d: any) => d.status === "blocked");
  const blockedCustomers = customers.filter((c: any) => c.status === "blocked");
  const completedRides = rides.filter((r: any) => r.status === "completed");
  const openComplaints = complaints.filter((c: any) => c.status === "open");
  const currSymbol = CURRENCIES.find(c => c.value === (brand?.currency || "GBP"))?.symbol || "£";

  const sidebarItems = [
    { id: "dashboard" as TabView, icon: LayoutDashboard, label: "Dashboard", badge: 0 },
    { id: "drivers" as TabView, icon: Users, label: "All Drivers", badge: pendingDrivers.length },
    { id: "add-driver" as TabView, icon: Plus, label: "Add Driver", badge: 0 },
    { id: "blocked-drivers" as TabView, icon: Ban, label: "Blocked Drivers", badge: blockedDrivers.length },
    { id: "customers" as TabView, icon: UserCheck, label: "Customers", badge: 0 },
    { id: "blocked-customers" as TabView, icon: UserX, label: "Blocked Customers", badge: blockedCustomers.length },
    { id: "live-map" as TabView, icon: Map, label: "Live Map", badge: activeDrivers.length },
    { id: "rides" as TabView, icon: Navigation, label: "Rides", badge: 0 },
    { id: "complaints" as TabView, icon: MessageCircle, label: "Complaints", badge: openComplaints.length },
    { id: "messages" as TabView, icon: Send, label: "Messages", badge: 0 },
    { id: "qr-codes" as TabView, icon: QrCode, label: "QR Codes", badge: 0 },
    { id: "brand-settings" as TabView, icon: Settings, label: "Brand Settings", badge: 0 },
  ];

  const handleLogout = () => {
    localStorage.removeItem("taxiBrandAdminId");
    localStorage.removeItem("taxiBrandAdminName");
    localStorage.removeItem("taxiBrandAdminSlug");
    navigate("/taxi-brand-login");
  };

  const uf = (key: string, value: any) => setDriverForm(p => ({ ...p, [key]: value }));

  const renderDriverForm = (isEditing = false) => {
    const form = isEditing ? editingDriver : driverForm;
    const setForm = isEditing
      ? (key: string, value: any) => setEditingDriver((p: any) => ({ ...p, [key]: value }))
      : uf;

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl border p-6 shadow-sm">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><IdCard className="h-5 w-5 text-blue-500" /> Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="text-sm font-medium text-gray-700">Full Name *</label><Input value={form.name} onChange={e => setForm("name", e.target.value)} placeholder="John Smith" data-testid="input-driver-name" /></div>
            <div><label className="text-sm font-medium text-gray-700">Phone Number *</label><Input value={form.phone} onChange={e => setForm("phone", e.target.value)} placeholder="+44 7700 900000" data-testid="input-driver-phone" /></div>
            <div><label className="text-sm font-medium text-gray-700">WhatsApp Number</label><Input value={form.whatsapp} onChange={e => setForm("whatsapp", e.target.value)} placeholder="+44 7700 900000" /></div>
            <div><label className="text-sm font-medium text-gray-700">Emergency Contact Number</label><Input value={form.emergencyPhone} onChange={e => setForm("emergencyPhone", e.target.value)} placeholder="+44 7700 900001" /></div>
            <div><label className="text-sm font-medium text-gray-700">Email</label><Input value={form.email} onChange={e => setForm("email", e.target.value)} placeholder="driver@email.com" /></div>
            <div><label className="text-sm font-medium text-gray-700">Address</label><Input value={form.address} onChange={e => setForm("address", e.target.value)} placeholder="123 Main St, London" /></div>
            <div><label className="text-sm font-medium text-gray-700">Country</label><Input value={form.country} onChange={e => setForm("country", e.target.value)} placeholder="United Kingdom" /></div>
            <div>
              <label className="text-sm font-medium text-gray-700">Photo (Passport Size) *</label>
              <Input value={form.photo} onChange={e => setForm("photo", e.target.value)} placeholder="Paste image URL" />
              {form.photo && <img src={form.photo} alt="Driver" className="w-16 h-20 object-cover rounded mt-2 border" />}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-6 shadow-sm">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Building2 className="h-5 w-5 text-purple-500" /> Employment Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Employment Type</label>
              <select value={form.employmentType} onChange={e => setForm("employmentType", e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm bg-white">
                {EMPLOYMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Company Name {form.employmentType === "company" && "*"}</label>
              <Input value={form.companyName} onChange={e => setForm("companyName", e.target.value)} placeholder="Company name (if applicable)" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-6 shadow-sm">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><FileText className="h-5 w-5 text-green-500" /> Documents & Licence</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="text-sm font-medium text-gray-700">Driving Licence Number</label><Input value={form.drivingLicenceNumber} onChange={e => setForm("drivingLicenceNumber", e.target.value)} placeholder="SMITH901234AB5CD" /></div>
            <div><label className="text-sm font-medium text-gray-700">Driving Licence Image (Upload)</label><Input value={form.drivingLicenceImage} onChange={e => setForm("drivingLicenceImage", e.target.value)} placeholder="Paste image URL" /></div>
            <div>
              <label className="text-sm font-medium text-gray-700">Visa / Immigration Status</label>
              <select value={form.visaType} onChange={e => setForm("visaType", e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm bg-white">
                <option value="citizen">Citizen</option><option value="resident">Permanent Resident</option><option value="work_permit">Work Permit</option><option value="student">Student Visa</option>
              </select>
            </div>
            <div><label className="text-sm font-medium text-gray-700">Visa Image</label><Input value={form.visaImage} onChange={e => setForm("visaImage", e.target.value)} placeholder="Paste image URL" /></div>
            <div><label className="text-sm font-medium text-gray-700">Insurance Document</label><Input value={form.insuranceImage} onChange={e => setForm("insuranceImage", e.target.value)} placeholder="Paste image URL" /></div>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-6 shadow-sm">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Car className="h-5 w-5 text-orange-500" /> Vehicle Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Vehicle Type *</label>
              <select value={form.vehicleType} onChange={e => { setForm("vehicleType", e.target.value); const vt = e.target.value; if (vt === "3_seater") setForm("seatCount", 3); else if (vt === "5_seater" || vt === "sedan_5") setForm("seatCount", 5); else if (vt === "7_seater" || vt === "mpv_7") setForm("seatCount", 7); else if (vt === "18_seater") setForm("seatCount", 18); else if (vt === "motorbike" || vt === "bicycle") setForm("seatCount", 1); }} className="w-full border rounded-md px-3 py-2 text-sm bg-white">
                {VEHICLE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Vehicle Category *</label>
              <select value={form.vehicleCategory} onChange={e => setForm("vehicleCategory", e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm bg-white">
                {VEHICLE_CATEGORIES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Number of Seats</label>
              <Input type="number" min={1} max={60} value={form.seatCount} onChange={e => setForm("seatCount", parseInt(e.target.value) || 1)} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Fuel Type</label>
              <select value={form.fuelType} onChange={e => setForm("fuelType", e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm bg-white">
                {FUEL_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div><label className="text-sm font-medium text-gray-700">Car Model</label><Input value={form.carModel} onChange={e => setForm("carModel", e.target.value)} placeholder="Toyota Prius" /></div>
            <div><label className="text-sm font-medium text-gray-700">Car Colour</label><Input value={form.carColor} onChange={e => setForm("carColor", e.target.value)} placeholder="Black" /></div>
            <div><label className="text-sm font-medium text-gray-700">Registration / Number Plate *</label><Input value={form.numberPlate} onChange={e => setForm("numberPlate", e.target.value)} placeholder="AB12 CDE" /></div>
            <div><label className="text-sm font-medium text-gray-700">Car Image</label><Input value={form.carImage} onChange={e => setForm("carImage", e.target.value)} placeholder="Paste image URL" /></div>
            <div><label className="text-sm font-medium text-gray-700">Service Radius (miles)</label><Input type="number" value={form.serviceRadiusMiles} onChange={e => setForm("serviceRadiusMiles", e.target.value)} /></div>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-6 shadow-sm">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Wallet className="h-5 w-5 text-emerald-500" /> Payment Agreement</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Payment Agreement Type *</label>
              <select value={form.paymentAgreement} onChange={e => setForm("paymentAgreement", e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm bg-white">
                {PAYMENT_AGREEMENTS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Currency *</label>
              <select value={form.currency} onChange={e => setForm("currency", e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm bg-white">
                {CURRENCIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            {(form.paymentAgreement === "commission" || form.paymentAgreement === "commission_plus_fixed") && (
              <div><label className="text-sm font-medium text-gray-700">Commission %</label><Input type="number" min={0} max={100} value={form.commissionPercent} onChange={e => setForm("commissionPercent", e.target.value)} /></div>
            )}
            {(form.paymentAgreement === "fixed_weekly" || form.paymentAgreement === "fixed_monthly" || form.paymentAgreement === "commission_plus_fixed") && (
              <>
                <div><label className="text-sm font-medium text-gray-700">Fixed Salary Amount</label><Input type="number" min={0} value={form.fixedSalary} onChange={e => setForm("fixedSalary", e.target.value)} /></div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Salary Period</label>
                  <select value={form.salaryPeriod} onChange={e => setForm("salaryPeriod", e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm bg-white">
                    <option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="daily">Daily</option>
                  </select>
                </div>
              </>
            )}
            <div>
              <label className="text-sm font-medium text-gray-700">Payment Method *</label>
              <select value={form.paymentMethod} onChange={e => setForm("paymentMethod", e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm bg-white">
                {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-6 shadow-sm">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><CreditCard className="h-5 w-5 text-indigo-500" /> Customer Payment Receiving</h3>
          <p className="text-xs text-gray-500 mb-4">Set up how this driver receives payment from customers. QR codes with these details will be shown to customers during booking.</p>
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h5 className="font-semibold mb-2 text-sm flex items-center gap-2"><CreditCard className="h-4 w-4 text-blue-600" /> Stripe Account</h5>
              <div><label className="text-sm font-medium text-gray-700">Stripe Account ID</label><Input value={form.receiveStripeAccountId || ""} onChange={e => setForm("receiveStripeAccountId", e.target.value)} placeholder="acct_..." /></div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <h5 className="font-semibold mb-2 text-sm flex items-center gap-2"><Banknote className="h-4 w-4 text-green-600" /> Bank Account</h5>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-sm font-medium text-gray-700">Bank Name</label><Input value={form.receiveBankName || ""} onChange={e => setForm("receiveBankName", e.target.value)} placeholder="e.g. Barclays" /></div>
                <div><label className="text-sm font-medium text-gray-700">Account Name</label><Input value={form.receiveBankAccountName || ""} onChange={e => setForm("receiveBankAccountName", e.target.value)} placeholder="John Smith" /></div>
                <div><label className="text-sm font-medium text-gray-700">Sort Code</label><Input value={form.receiveBankSortCode || ""} onChange={e => setForm("receiveBankSortCode", e.target.value)} placeholder="00-00-00" /></div>
                <div><label className="text-sm font-medium text-gray-700">Account Number</label><Input value={form.receiveBankAccountNumber || ""} onChange={e => setForm("receiveBankAccountNumber", e.target.value)} placeholder="12345678" /></div>
                <div className="col-span-2"><label className="text-sm font-medium text-gray-700">IBAN</label><Input value={form.receiveBankIban || ""} onChange={e => setForm("receiveBankIban", e.target.value)} placeholder="GB00XXXX..." /></div>
              </div>
              {(form.receiveBankName || form.receiveBankAccountNumber) && (
                <div className="mt-4 pt-4 border-t border-green-200">
                  <p className="text-xs font-medium text-green-700 mb-2 text-center">QR Code Preview — Customers will scan this</p>
                  <div className="flex justify-center">
                    <div className="bg-white p-3 rounded-xl shadow-sm border">
                      <img src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(`Bank: ${form.receiveBankName || ""}\nName: ${form.receiveBankAccountName || ""}\nSort Code: ${form.receiveBankSortCode || ""}\nAccount: ${form.receiveBankAccountNumber || ""}\nIBAN: ${form.receiveBankIban || ""}`)}`} alt="Bank QR" className="w-[160px] h-[160px]" />
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <h5 className="font-semibold mb-2 text-sm flex items-center gap-2"><Wallet className="h-4 w-4 text-purple-600" /> JazzCash</h5>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-sm font-medium text-gray-700">JazzCash Number</label><Input value={form.receiveJazzCashNumber || ""} onChange={e => setForm("receiveJazzCashNumber", e.target.value)} placeholder="03XX-XXXXXXX" /></div>
                <div><label className="text-sm font-medium text-gray-700">Account Name</label><Input value={form.receiveJazzCashName || ""} onChange={e => setForm("receiveJazzCashName", e.target.value)} placeholder="Account name" /></div>
              </div>
              {form.receiveJazzCashNumber && (
                <div className="mt-4 pt-4 border-t border-purple-200">
                  <p className="text-xs font-medium text-purple-700 mb-2 text-center">QR Code Preview — Customers will scan this</p>
                  <div className="flex justify-center">
                    <div className="bg-white p-3 rounded-xl shadow-sm border">
                      <img src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(`JazzCash: ${form.receiveJazzCashNumber}\nName: ${form.receiveJazzCashName || ""}`)}`} alt="JazzCash QR" className="w-[160px] h-[160px]" />
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
              <h5 className="font-semibold mb-2 text-sm flex items-center gap-2"><Wallet className="h-4 w-4 text-orange-600" /> EasyPaisa</h5>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-sm font-medium text-gray-700">EasyPaisa Number</label><Input value={form.receiveEasyPaisaNumber || ""} onChange={e => setForm("receiveEasyPaisaNumber", e.target.value)} placeholder="03XX-XXXXXXX" /></div>
                <div><label className="text-sm font-medium text-gray-700">Account Name</label><Input value={form.receiveEasyPaisaName || ""} onChange={e => setForm("receiveEasyPaisaName", e.target.value)} placeholder="Account name" /></div>
              </div>
              {form.receiveEasyPaisaNumber && (
                <div className="mt-4 pt-4 border-t border-orange-200">
                  <p className="text-xs font-medium text-orange-700 mb-2 text-center">QR Code Preview — Customers will scan this</p>
                  <div className="flex justify-center">
                    <div className="bg-white p-3 rounded-xl shadow-sm border">
                      <img src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(`EasyPaisa: ${form.receiveEasyPaisaNumber}\nName: ${form.receiveEasyPaisaName || ""}`)}`} alt="EasyPaisa QR" className="w-[160px] h-[160px]" />
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
              <h5 className="font-semibold mb-2 text-sm flex items-center gap-2"><Banknote className="h-4 w-4 text-teal-600" /> HBL Bank</h5>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-sm font-medium text-gray-700">HBL Account Name</label><Input value={form.receiveHblAccountName || ""} onChange={e => setForm("receiveHblAccountName", e.target.value)} placeholder="Account holder" /></div>
                <div><label className="text-sm font-medium text-gray-700">HBL Account Number</label><Input value={form.receiveHblAccountNumber || ""} onChange={e => setForm("receiveHblAccountNumber", e.target.value)} placeholder="Account number" /></div>
                <div className="col-span-2"><label className="text-sm font-medium text-gray-700">HBL IBAN</label><Input value={form.receiveHblIban || ""} onChange={e => setForm("receiveHblIban", e.target.value)} placeholder="PK00XXXX..." /></div>
              </div>
              {(form.receiveHblAccountName || form.receiveHblAccountNumber) && (
                <div className="mt-4 pt-4 border-t border-teal-200">
                  <p className="text-xs font-medium text-teal-700 mb-2 text-center">QR Code Preview — Customers will scan this</p>
                  <div className="flex justify-center">
                    <div className="bg-white p-3 rounded-xl shadow-sm border">
                      <img src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(`HBL Bank\nName: ${form.receiveHblAccountName || ""}\nAccount: ${form.receiveHblAccountNumber || ""}\nIBAN: ${form.receiveHblIban || ""}`)}`} alt="HBL QR" className="w-[160px] h-[160px]" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-6 shadow-sm">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Clock className="h-5 w-5 text-cyan-500" /> Working Hours & Login</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="text-sm font-medium text-gray-700">Weekly Hours Allowed</label><Input type="number" min={1} max={168} value={form.weeklyHoursAllowed} onChange={e => setForm("weeklyHoursAllowed", parseInt(e.target.value) || 48)} /></div>
            <div><label className="text-sm font-medium text-gray-700">Timing Preference</label><Input value={form.timingPreference} onChange={e => setForm("timingPreference", e.target.value)} placeholder="Day shift / Night shift / Flexible" /></div>
            {!isEditing && (
              <div><label className="text-sm font-medium text-gray-700">Login Password *</label><Input type="password" value={form.password} onChange={e => setForm("password", e.target.value)} placeholder="Min 4 characters" data-testid="input-driver-password" /></div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="hidden md:flex w-64 bg-slate-900 text-white flex-col fixed inset-y-0 z-30">
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            {brand?.logo ? (
              <img src={brand.logo} alt="" className="w-10 h-10 rounded-xl object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold" style={{ background: brand?.primaryColor || "#1a1a2e" }}>
                {brandName[0] || "T"}
              </div>
            )}
            <div>
              <h1 className="font-bold text-sm truncate max-w-[160px]">{brandName}</h1>
              <p className="text-xs text-gray-400">Brand Admin</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {sidebarItems.map(item => (
            <button key={item.id} onClick={() => { setActiveTab(item.id); setSearchQuery(""); }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === item.id ? "bg-cyan-500/20 text-cyan-400" : "text-gray-400 hover:text-white hover:bg-slate-800"}`}
              data-testid={`nav-${item.id}`}>
              <item.icon className="h-4 w-4 flex-shrink-0" /> <span className="truncate">{item.label}</span>
              {item.badge > 0 && <span className="ml-auto bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center">{item.badge}</span>}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-800 space-y-0.5">
          <button onClick={() => window.open(`/taxi/${brandSlug}`, "_blank")} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-slate-800 transition-all">
            <ExternalLink className="h-4 w-4" /> View Public Page
          </button>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-red-400 hover:bg-slate-800 transition-all" data-testid="button-logout">
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </aside>

      <div className="md:hidden fixed top-0 left-0 right-0 z-50 p-3 flex items-center justify-between" style={{ background: brand?.primaryColor || "#1e293b" }}>
        <div className="flex items-center gap-2 text-white">
          <Car className="h-5 w-5" />
          <span className="font-bold text-sm truncate max-w-[200px]">{brandName}</span>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-white"><MenuIcon className="h-5 w-5" /></button>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-slate-900/95 z-40 pt-16 p-4 overflow-y-auto">
          <nav className="space-y-1">
            {sidebarItems.map(item => (
              <button key={item.id} onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); setSearchQuery(""); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${activeTab === item.id ? "bg-cyan-500/20 text-cyan-400" : "text-gray-400"}`}>
                <item.icon className="h-4 w-4" /> {item.label}
                {item.badge > 0 && <span className="ml-auto bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{item.badge}</span>}
              </button>
            ))}
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-red-400">
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </nav>
        </div>
      )}

      <main className="flex-1 md:ml-64 p-4 md:p-8 pt-16 md:pt-8 overflow-auto min-h-screen">
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">{brandName} Dashboard</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Drivers", value: drivers.length, color: "bg-blue-500", icon: Users },
                { label: "On Duty", value: activeDrivers.length, color: "bg-green-500", icon: Navigation },
                { label: "Pending Approval", value: pendingDrivers.length, color: "bg-yellow-500", icon: Clock },
                { label: "Blocked Drivers", value: blockedDrivers.length, color: "bg-red-500", icon: Ban },
                { label: "Total Rides", value: rides.length, color: "bg-purple-500", icon: TrendingUp },
                { label: "Completed Rides", value: completedRides.length, color: "bg-emerald-500", icon: Check },
                { label: "Customers", value: customers.length, color: "bg-indigo-500", icon: UserCheck },
                { label: "Open Complaints", value: openComplaints.length, color: "bg-orange-500", icon: AlertTriangle },
              ].map((stat, i) => (
                <div key={i} className="bg-white rounded-xl p-4 border shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => { if (stat.label.includes("Driver")) setActiveTab("drivers"); else if (stat.label.includes("Rides") || stat.label.includes("Completed")) setActiveTab("rides"); else if (stat.label.includes("Customer")) setActiveTab("customers"); else if (stat.label.includes("Complaint")) setActiveTab("complaints"); }}>
                  <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center mb-3`}>
                    <stat.icon className="h-5 w-5 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                </div>
              ))}
            </div>

            {pendingDrivers.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <h3 className="font-bold text-yellow-800 mb-3 flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Pending Driver Approvals</h3>
                <div className="space-y-2">
                  {pendingDrivers.slice(0, 5).map((driver: any) => (
                    <div key={driver.id} className="bg-white rounded-lg p-3 flex items-center justify-between border">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center overflow-hidden">
                          {driver.photo ? <img src={driver.photo} alt="" className="w-full h-full object-cover" /> : <Users className="h-5 w-5 text-yellow-600" />}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{driver.name}</p>
                          <p className="text-xs text-gray-500">{driver.phone} • {driver.vehicleType?.replace(/_/g, " ")}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => updateDriverMutation.mutate({ id: driver.id, data: { status: "active" } })}><Check className="h-3 w-3 mr-1" /> Approve</Button>
                        <Button size="sm" variant="outline" className="text-red-500" onClick={() => updateDriverMutation.mutate({ id: driver.id, data: { status: "blocked" } })}><X className="h-3 w-3 mr-1" /> Reject</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeDrivers.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <h3 className="font-bold text-green-800 mb-3 flex items-center gap-2"><Navigation className="h-4 w-4" /> Currently On Duty ({activeDrivers.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {activeDrivers.map((driver: any) => (
                    <div key={driver.id} className="bg-white rounded-lg p-3 border flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center overflow-hidden">
                        {driver.photo ? <img src={driver.photo} alt="" className="w-full h-full object-cover" /> : <Car className="h-4 w-4 text-green-600" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{driver.name}</p>
                        <p className="text-xs text-gray-500">{driver.numberPlate || driver.vehicleType?.replace(/_/g, " ")}</p>
                      </div>
                      <span className="ml-auto w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white border rounded-xl p-5 shadow-sm">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-gray-900"><Users className="h-5 w-5 text-blue-500" /> Select Driver</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {drivers.filter((d: any) => d.status !== "blocked").map((driver: any) => {
                  const isSelected = selectedDriverId === driver.id;
                  const driverRides = rides.filter((r: any) => r.driverId === driver.id);
                  const driverCompletedRides = driverRides.filter((r: any) => r.status === "completed");
                  const dCurr = CURRENCIES.find(c => c.value === driver.currency)?.symbol || "£";
                  return (
                    <div key={driver.id}
                      onClick={() => setSelectedDriverId(isSelected ? null : driver.id)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md ${isSelected ? "border-blue-500 bg-blue-50 shadow-md" : "border-gray-200 bg-gray-50 hover:border-blue-300"}`}
                      data-testid={`select-driver-${driver.id}`}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center overflow-hidden border-2 ${isSelected ? "border-blue-500" : "border-gray-300"}`}>
                          {driver.photo ? <img src={driver.photo} alt="" className="w-full h-full object-cover" /> : <Users className="h-6 w-6 text-gray-400" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 truncate">{driver.name}</p>
                          <p className="text-xs text-gray-500">{driver.phone}</p>
                        </div>
                        <div className={`w-3 h-3 rounded-full ${driver.onDuty ? "bg-green-500 animate-pulse" : "bg-gray-300"}`} />
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-white/80 rounded-lg p-2">
                          <p className="text-xs text-gray-500">Rides</p>
                          <p className="text-sm font-bold text-purple-600">{driverCompletedRides.length}</p>
                        </div>
                        <div className="bg-white/80 rounded-lg p-2">
                          <p className="text-xs text-gray-500">Vehicle</p>
                          <p className="text-xs font-bold text-gray-700 truncate">{driver.vehicleType?.replace(/_/g, " ")}</p>
                        </div>
                        <div className="bg-white/80 rounded-lg p-2">
                          <p className="text-xs text-gray-500">Status</p>
                          <p className={`text-xs font-bold ${driver.onDuty ? "text-green-600" : "text-gray-500"}`}>{driver.onDuty ? "On Duty" : "Off"}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {selectedDriverId && (() => {
              const selDriver = drivers.find((d: any) => d.id === selectedDriverId);
              if (!selDriver) return null;
              const driverRides = rides.filter((r: any) => r.driverId === selectedDriverId);
              const driverCompletedRides = driverRides.filter((r: any) => r.status === "completed");
              const dCurr = CURRENCIES.find(c => c.value === selDriver.currency)?.symbol || "£";
              const earnings = selectedDriverEarnings?.earnings || [];
              const totalEarnings = earnings.reduce((s: number, e: any) => s + parseFloat(e.amount || "0"), 0);
              const totalVat = earnings.reduce((s: number, e: any) => s + parseFloat(e.vatAmount || "0"), 0);
              const totalNet = earnings.reduce((s: number, e: any) => s + parseFloat(e.netAmount || "0"), 0);
              const totalFuel = selectedDriverFuel.reduce((s: number, f: any) => s + parseFloat(f.amount || "0"), 0);
              const totalExpenses = selectedDriverExpenses.reduce((s: number, e: any) => s + parseFloat(e.amount || "0"), 0);
              const totalHours = selectedDriverWorkLogs.reduce((s: number, l: any) => s + parseFloat(l.hoursWorked || "0"), 0);
              const payAgr = PAYMENT_AGREEMENTS.find(p => p.value === selDriver.paymentAgreement)?.label || "Commission";
              return (
                <div className="bg-white border rounded-xl shadow-sm overflow-hidden" data-testid={`driver-detail-card-${selectedDriverId}`}>
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 rounded-xl bg-white/20 flex items-center justify-center overflow-hidden border-2 border-white/30">
                        {selDriver.photo ? <img src={selDriver.photo} alt="" className="w-full h-full object-cover" /> : <Users className="h-10 w-10 text-white/60" />}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold">{selDriver.name}</h3>
                        <p className="text-sm text-white/80">{selDriver.phone} • {selDriver.email || "No email"}</p>
                        <div className="flex gap-2 mt-2 flex-wrap">
                          <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${selDriver.onDuty ? "bg-green-500/20 text-green-200" : "bg-gray-500/20 text-gray-200"}`}>
                            {selDriver.onDuty ? "On Duty" : "Off Duty"}
                          </span>
                          <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-white/20">{selDriver.vehicleType?.replace(/_/g, " ")}</span>
                          <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-white/20">{selDriver.numberPlate}</span>
                          <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-yellow-500/20 text-yellow-200">{payAgr}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
                        <PoundSterling className="h-5 w-5 text-green-600 mx-auto mb-1" />
                        <p className="text-xl font-bold text-green-700">{dCurr}{totalEarnings.toFixed(2)}</p>
                        <p className="text-xs text-green-600">Total Earnings</p>
                      </div>
                      <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
                        <TrendingUp className="h-5 w-5 text-red-600 mx-auto mb-1" />
                        <p className="text-xl font-bold text-red-700">{dCurr}{totalVat.toFixed(2)}</p>
                        <p className="text-xs text-red-600">VAT (20%)</p>
                      </div>
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
                        <Wallet className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                        <p className="text-xl font-bold text-blue-700">{dCurr}{totalNet.toFixed(2)}</p>
                        <p className="text-xs text-blue-600">Net Income</p>
                      </div>
                      <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-center">
                        <Navigation className="h-5 w-5 text-purple-600 mx-auto mb-1" />
                        <p className="text-xl font-bold text-purple-700">{driverCompletedRides.length}</p>
                        <p className="text-xs text-purple-600">Completed Rides</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-center">
                        <Fuel className="h-5 w-5 text-orange-600 mx-auto mb-1" />
                        <p className="text-lg font-bold text-orange-700">{dCurr}{totalFuel.toFixed(2)}</p>
                        <p className="text-xs text-orange-600">Fuel Costs</p>
                      </div>
                      <div className="bg-pink-50 border border-pink-200 rounded-xl p-3 text-center">
                        <Banknote className="h-5 w-5 text-pink-600 mx-auto mb-1" />
                        <p className="text-lg font-bold text-pink-700">{dCurr}{totalExpenses.toFixed(2)}</p>
                        <p className="text-xs text-pink-600">Expenses</p>
                      </div>
                      <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-3 text-center">
                        <Clock className="h-5 w-5 text-cyan-600 mx-auto mb-1" />
                        <p className="text-lg font-bold text-cyan-700">{totalHours.toFixed(1)}h</p>
                        <p className="text-xs text-cyan-600">Hours Worked</p>
                      </div>
                      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 text-center">
                        <Car className="h-5 w-5 text-indigo-600 mx-auto mb-1" />
                        <p className="text-lg font-bold text-indigo-700">{driverRides.length}</p>
                        <p className="text-xs text-indigo-600">Total Rides</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                      <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">Car</p><p className="font-medium">{selDriver.carModel} ({selDriver.carColor})</p></div>
                      <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">Licence</p><p className="font-medium truncate">{selDriver.drivingLicenceNumber || "N/A"}</p></div>
                      <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">Fuel</p><p className="font-medium">{selDriver.fuelType}</p></div>
                      <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">Service Radius</p><p className="font-medium">{selDriver.serviceRadiusMiles} miles</p></div>
                      <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">Weekly Hours</p><p className="font-medium">{selDriver.weeklyHoursAllowed}h</p></div>
                      <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">Address</p><p className="font-medium truncate">{selDriver.address || "N/A"}</p></div>
                    </div>

                    {driverRides.length > 0 && (
                      <div>
                        <h4 className="font-bold text-sm text-gray-700 mb-2">Recent Rides</h4>
                        <div className="space-y-1 max-h-48 overflow-y-auto">
                          {driverRides.slice(0, 10).map((ride: any) => (
                            <div key={ride.id} className="bg-gray-50 rounded-lg p-2 flex items-center justify-between text-sm">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-500 truncate">{ride.pickupAddress} → {ride.dropoffAddress}</p>
                              </div>
                              <span className={`text-xs px-2 py-0.5 rounded-full ml-2 whitespace-nowrap ${ride.status === "completed" ? "bg-green-100 text-green-700" : ride.status === "cancelled" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
                                {ride.status?.replace(/_/g, " ")}
                              </span>
                              <span className="text-xs font-medium ml-2 whitespace-nowrap">{dCurr}{ride.finalPrice || ride.estimatedPrice || "0"}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {activeTab === "drivers" && (
          <div>
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
              <h2 className="text-2xl font-bold text-gray-900">All Drivers ({drivers.filter((d: any) => d.status !== "blocked").length})</h2>
              <div className="flex gap-3">
                <div className="relative w-48">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
                </div>
                <Button onClick={() => { resetDriverForm(); setActiveTab("add-driver"); }} className="gap-2" data-testid="button-add-driver">
                  <Plus className="h-4 w-4" /> Add Driver
                </Button>
              </div>
            </div>

            <div className="flex gap-4" style={{ minHeight: "calc(100vh - 180px)" }}>
              <div className="w-72 shrink-0 space-y-1.5 overflow-y-auto pr-1" style={{ maxHeight: "calc(100vh - 180px)" }}>
                {drivers.filter((d: any) => d.status !== "blocked" && (!searchQuery || d.name?.toLowerCase().includes(searchQuery.toLowerCase()) || d.phone?.includes(searchQuery))).map((driver: any) => {
                  const isActive = selectedDriverId === driver.id;
                  return (
                    <div key={driver.id}
                      onClick={() => setSelectedDriverId(isActive ? null : driver.id)}
                      className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${isActive ? "border-blue-500 bg-blue-50 shadow-md" : "border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm"}`}
                      data-testid={`sidebar-driver-${driver.id}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-full flex items-center justify-center overflow-hidden shrink-0 border-2 ${isActive ? "border-blue-500" : "border-gray-200"}`}>
                          {driver.photo ? <img src={driver.photo} alt="" className="w-full h-full object-cover" /> :
                            <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm">{driver.name?.[0]}</div>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-bold text-sm truncate ${isActive ? "text-blue-700" : "text-gray-900"}`}>{driver.name}</p>
                          <p className="text-[11px] text-gray-500 truncate">{driver.phone}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${driver.onDuty ? "bg-green-500 animate-pulse" : "bg-gray-300"}`} />
                            <span className="text-[10px] text-gray-400 truncate">{driver.vehicleType?.replace(/_/g, " ")} • {driver.numberPlate || "N/A"}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {drivers.filter((d: any) => d.status !== "blocked").length === 0 && (
                  <div className="text-center py-10 border border-dashed rounded-xl bg-white">
                    <Users className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                    <p className="text-xs text-gray-400">No drivers</p>
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                {!selectedDriverId && (
                  <div className="flex items-center justify-center h-full bg-white rounded-2xl border border-dashed border-gray-200">
                    <div className="text-center py-20">
                      <Users className="h-16 w-16 text-gray-200 mx-auto mb-4" />
                      <p className="text-gray-400 text-lg font-medium">Select a driver from the list</p>
                      <p className="text-gray-300 text-sm mt-1">Click on a driver to view their details, earnings, and ride history</p>
                    </div>
                  </div>
                )}

                {selectedDriverId && (() => {
                  const selDriver = drivers.find((d: any) => d.id === selectedDriverId);
                  if (!selDriver) return null;
                  const driverRides = rides.filter((r: any) => r.driverId === selectedDriverId);
                  const driverCompletedRides = driverRides.filter((r: any) => r.status === "completed");
                  const dCurr = CURRENCIES.find(c => c.value === selDriver.currency)?.symbol || "£";
                  const earnList = selectedDriverEarnings?.earnings || [];
                  const totalEarnings = earnList.reduce((s: number, e: any) => s + parseFloat(e.amount || "0"), 0);
                  const totalVat = earnList.reduce((s: number, e: any) => s + parseFloat(e.vatAmount || "0"), 0);
                  const totalNet = earnList.reduce((s: number, e: any) => s + parseFloat(e.netAmount || "0"), 0);
                  const totalFuel = selectedDriverFuel.reduce((s: number, f: any) => s + parseFloat(f.amount || "0"), 0);
                  const totalExpenses = selectedDriverExpenses.reduce((s: number, e: any) => s + parseFloat(e.amount || "0"), 0);
                  const totalHours = selectedDriverWorkLogs.reduce((s: number, l: any) => s + parseFloat(l.hoursWorked || "0"), 0);
                  const payAgr = PAYMENT_AGREEMENTS.find(p => p.value === selDriver.paymentAgreement)?.label || "Commission";
                  return (
                    <div className="space-y-4 overflow-y-auto" style={{ maxHeight: "calc(100vh - 180px)" }}>
                      <div className="bg-white border rounded-2xl shadow-sm overflow-hidden" data-testid={`driver-detail-card-${selectedDriverId}`}>
                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-5 text-white">
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center overflow-hidden border-2 border-white/30 shrink-0">
                              {selDriver.photo ? <img src={selDriver.photo} alt="" className="w-full h-full object-cover" /> :
                                <div className="w-full h-full bg-white/10 flex items-center justify-center text-2xl font-bold">{selDriver.name?.[0]}</div>}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-xl font-bold truncate">{selDriver.name}</h3>
                              <p className="text-sm text-white/80 truncate">{selDriver.phone} • {selDriver.email || "No email"}</p>
                              <div className="flex gap-1.5 mt-2 flex-wrap">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${selDriver.onDuty ? "bg-green-500/20 text-green-200" : "bg-gray-500/20 text-gray-200"}`}>
                                  {selDriver.onDuty ? "ON DUTY" : "OFF DUTY"}
                                </span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-white/20">{selDriver.vehicleType?.replace(/_/g, " ")}</span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-white/20">{selDriver.numberPlate}</span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-yellow-500/20 text-yellow-200">{payAgr}</span>
                              </div>
                            </div>
                            <div className="flex gap-1.5 shrink-0">
                              <Button size="sm" variant="ghost" className="text-white hover:bg-white/20 h-8 w-8 p-0" onClick={() => setEditingDriver({ ...selDriver })}><Edit2 className="h-3.5 w-3.5" /></Button>
                              <Button size="sm" variant="ghost" className="text-white hover:bg-white/20 h-8 w-8 p-0" onClick={() => setViewingDriver(selDriver)}><Eye className="h-3.5 w-3.5" /></Button>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 space-y-4">
                          <div className="grid grid-cols-4 gap-2">
                            <div className="bg-green-50 border border-green-200 rounded-xl p-2.5 text-center">
                              <PoundSterling className="h-4 w-4 text-green-600 mx-auto mb-0.5" />
                              <p className="text-lg font-bold text-green-700">{dCurr}{totalEarnings.toFixed(2)}</p>
                              <p className="text-[10px] text-green-600">Earnings</p>
                            </div>
                            <div className="bg-red-50 border border-red-200 rounded-xl p-2.5 text-center">
                              <TrendingUp className="h-4 w-4 text-red-600 mx-auto mb-0.5" />
                              <p className="text-lg font-bold text-red-700">{dCurr}{totalVat.toFixed(2)}</p>
                              <p className="text-[10px] text-red-600">VAT (20%)</p>
                            </div>
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-2.5 text-center">
                              <Wallet className="h-4 w-4 text-blue-600 mx-auto mb-0.5" />
                              <p className="text-lg font-bold text-blue-700">{dCurr}{totalNet.toFixed(2)}</p>
                              <p className="text-[10px] text-blue-600">Net</p>
                            </div>
                            <div className="bg-purple-50 border border-purple-200 rounded-xl p-2.5 text-center">
                              <Navigation className="h-4 w-4 text-purple-600 mx-auto mb-0.5" />
                              <p className="text-lg font-bold text-purple-700">{driverCompletedRides.length}</p>
                              <p className="text-[10px] text-purple-600">Rides</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-4 gap-2">
                            <div className="bg-orange-50 border border-orange-200 rounded-xl p-2.5 text-center">
                              <Fuel className="h-4 w-4 text-orange-600 mx-auto mb-0.5" />
                              <p className="text-sm font-bold text-orange-700">{dCurr}{totalFuel.toFixed(2)}</p>
                              <p className="text-[10px] text-orange-600">Fuel</p>
                            </div>
                            <div className="bg-pink-50 border border-pink-200 rounded-xl p-2.5 text-center">
                              <Banknote className="h-4 w-4 text-pink-600 mx-auto mb-0.5" />
                              <p className="text-sm font-bold text-pink-700">{dCurr}{totalExpenses.toFixed(2)}</p>
                              <p className="text-[10px] text-pink-600">Expenses</p>
                            </div>
                            <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-2.5 text-center">
                              <Clock className="h-4 w-4 text-cyan-600 mx-auto mb-0.5" />
                              <p className="text-sm font-bold text-cyan-700">{totalHours.toFixed(1)}h</p>
                              <p className="text-[10px] text-cyan-600">Hours</p>
                            </div>
                            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-2.5 text-center">
                              <Car className="h-4 w-4 text-indigo-600 mx-auto mb-0.5" />
                              <p className="text-sm font-bold text-indigo-700">{driverRides.length}</p>
                              <p className="text-[10px] text-indigo-600">Total Rides</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white border rounded-2xl p-4 shadow-sm">
                        <h4 className="font-bold text-sm text-gray-800 mb-3 flex items-center gap-2"><IdCard className="h-4 w-4 text-blue-500" /> Driver Details</h4>
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                          <div className="bg-gray-50 rounded-lg p-2.5"><p className="text-[10px] text-gray-400">Car</p><p className="font-medium text-xs">{selDriver.carModel} ({selDriver.carColor})</p></div>
                          <div className="bg-gray-50 rounded-lg p-2.5"><p className="text-[10px] text-gray-400">Plate</p><p className="font-medium text-xs">{selDriver.numberPlate || "N/A"}</p></div>
                          <div className="bg-gray-50 rounded-lg p-2.5"><p className="text-[10px] text-gray-400">Fuel Type</p><p className="font-medium text-xs">{selDriver.fuelType}</p></div>
                          <div className="bg-gray-50 rounded-lg p-2.5"><p className="text-[10px] text-gray-400">Licence</p><p className="font-medium text-xs truncate">{selDriver.drivingLicenceNumber || "N/A"}</p></div>
                          <div className="bg-gray-50 rounded-lg p-2.5"><p className="text-[10px] text-gray-400">Radius</p><p className="font-medium text-xs">{selDriver.serviceRadiusMiles} miles</p></div>
                          <div className="bg-gray-50 rounded-lg p-2.5"><p className="text-[10px] text-gray-400">Hours/Wk</p><p className="font-medium text-xs">{selDriver.weeklyHoursAllowed}h</p></div>
                          <div className="bg-gray-50 rounded-lg p-2.5"><p className="text-[10px] text-gray-400">Address</p><p className="font-medium text-xs truncate">{selDriver.address || "N/A"}</p></div>
                          <div className="bg-gray-50 rounded-lg p-2.5"><p className="text-[10px] text-gray-400">Country</p><p className="font-medium text-xs">{selDriver.country || "N/A"}</p></div>
                          <div className="bg-gray-50 rounded-lg p-2.5"><p className="text-[10px] text-gray-400">WhatsApp</p><p className="font-medium text-xs">{selDriver.whatsapp || "N/A"}</p></div>
                        </div>
                        {(selDriver.drivingLicenceImage || selDriver.visaImage || selDriver.insuranceImage || selDriver.carImage) && (
                          <div className="mt-3 flex gap-3 flex-wrap">
                            {selDriver.drivingLicenceImage && <a href={selDriver.drivingLicenceImage} target="_blank" className="text-xs text-blue-500 underline flex items-center gap-1"><FileText className="h-3 w-3" /> Licence</a>}
                            {selDriver.visaImage && <a href={selDriver.visaImage} target="_blank" className="text-xs text-blue-500 underline flex items-center gap-1"><FileText className="h-3 w-3" /> Visa</a>}
                            {selDriver.insuranceImage && <a href={selDriver.insuranceImage} target="_blank" className="text-xs text-blue-500 underline flex items-center gap-1"><Shield className="h-3 w-3" /> Insurance</a>}
                            {selDriver.carImage && <a href={selDriver.carImage} target="_blank" className="text-xs text-blue-500 underline flex items-center gap-1"><Car className="h-3 w-3" /> Car</a>}
                          </div>
                        )}
                      </div>

                      <div className="bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-4 shadow-sm text-white">
                        <h4 className="font-bold text-sm mb-3 flex items-center gap-2"><Lock className="h-4 w-4 text-cyan-400" /> Test Login Details</h4>
                        <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                          <div className="grid grid-cols-2 gap-3">
                            <div><p className="text-[10px] text-gray-400">Phone</p><p className="font-mono text-sm font-bold text-cyan-400">{selDriver.phone}</p></div>
                            <div><p className="text-[10px] text-gray-400">Password</p><p className="font-mono text-sm font-bold text-cyan-400">driver123</p></div>
                          </div>
                          <div className="mt-3 flex gap-2">
                            <a href="/taxi-login" target="_blank" className="flex-1 text-center py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-bold transition-all">
                              Open Driver Login
                            </a>
                            <button onClick={() => { navigator.clipboard.writeText(selDriver.phone); toast({ title: "Phone copied!" }); }}
                              className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-medium transition-all">
                              Copy Phone
                            </button>
                          </div>
                        </div>
                      </div>

                      {driverRides.length > 0 && (
                        <div className="bg-white border rounded-2xl p-4 shadow-sm">
                          <h4 className="font-bold text-sm text-gray-800 mb-3 flex items-center gap-2"><Navigation className="h-4 w-4 text-purple-500" /> Recent Rides</h4>
                          <div className="space-y-1.5 max-h-48 overflow-y-auto">
                            {driverRides.slice(0, 10).map((ride: any) => (
                              <div key={ride.id} className="bg-gray-50 rounded-lg p-2.5 flex items-center justify-between text-sm">
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs text-gray-700 truncate font-medium">{ride.pickupAddress} → {ride.dropoffAddress}</p>
                                  <p className="text-[10px] text-gray-400">{new Date(ride.createdAt).toLocaleDateString()}</p>
                                </div>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full ml-2 whitespace-nowrap font-medium ${ride.status === "completed" ? "bg-green-100 text-green-700" : ride.status === "cancelled" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
                                  {ride.status?.replace(/_/g, " ")}
                                </span>
                                <span className="text-xs font-bold ml-2 whitespace-nowrap">{dCurr}{ride.finalPrice || ride.estimatedPrice || "0"}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2 flex-wrap">
                        {selDriver.status === "pending" && <Button size="sm" onClick={() => updateDriverMutation.mutate({ id: selDriver.id, data: { status: "active" } })} className="gap-1 bg-green-600 hover:bg-green-700"><Check className="h-3 w-3" /> Approve</Button>}
                        {selDriver.status === "active" && <Button size="sm" variant="outline" className="text-red-500 gap-1" onClick={() => updateDriverMutation.mutate({ id: selDriver.id, data: { status: "blocked" } })}><Ban className="h-3 w-3" /> Block</Button>}
                        <Button size="sm" variant="outline" onClick={() => { setMessageDriver(selDriver); setActiveTab("messages"); }} className="gap-1"><Send className="h-3 w-3" /> WhatsApp</Button>
                        <Button size="sm" variant="ghost" className="text-red-500 gap-1" onClick={() => { if (confirm(`Delete "${selDriver.name}"? This cannot be undone.`)) { deleteDriverMutation.mutate(selDriver.id); setSelectedDriverId(null); } }}><Trash2 className="h-3 w-3" /> Delete</Button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {activeTab === "add-driver" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Add New Driver</h2>
              <Button variant="outline" onClick={() => setActiveTab("drivers")}>Cancel</Button>
            </div>
            {renderDriverForm(false)}
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => { resetDriverForm(); setActiveTab("drivers"); }}>Cancel</Button>
              <Button
                onClick={() => {
                  if (!driverForm.name || !driverForm.phone || !driverForm.password) {
                    toast({ title: "Please fill required fields: Name, Phone, Password", variant: "destructive" });
                    return;
                  }
                  createDriverMutation.mutate({ ...driverForm, brandId });
                }}
                disabled={createDriverMutation.isPending}
                className="gap-2 bg-blue-600 hover:bg-blue-700 px-8"
                data-testid="button-submit-driver"
              >
                {createDriverMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Create Driver
              </Button>
            </div>
          </div>
        )}

        {activeTab === "blocked-drivers" && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Blocked Drivers ({blockedDrivers.length})</h2>
            {blockedDrivers.length === 0 && (
              <div className="text-center py-16 border border-dashed rounded-xl bg-white">
                <Shield className="h-12 w-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400">No blocked drivers</p>
              </div>
            )}
            {blockedDrivers.map((driver: any) => (
              <div key={driver.id} className="bg-white border border-red-200 rounded-xl p-5 shadow-sm" data-testid={`card-blocked-driver-${driver.id}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center overflow-hidden">
                      {driver.photo ? <img src={driver.photo} alt="" className="w-full h-full object-cover opacity-60" /> : <Ban className="h-6 w-6 text-red-400" />}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{driver.name}</p>
                      <p className="text-xs text-gray-500">{driver.phone} • {driver.vehicleType?.replace(/_/g, " ")} • {driver.numberPlate || "No plate"}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => updateDriverMutation.mutate({ id: driver.id, data: { status: "active" } })} className="gap-1 bg-green-600 hover:bg-green-700"><Check className="h-3 w-3" /> Unblock</Button>
                    <Button size="sm" variant="ghost" className="text-red-500" onClick={() => { if (confirm(`Permanently delete "${driver.name}"?`)) deleteDriverMutation.mutate(driver.id); }}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "customers" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="text-2xl font-bold text-gray-900">Customers ({customers.filter((c: any) => c.status !== "blocked").length})</h2>
              <div className="relative w-56">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input placeholder="Search customers..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
              </div>
            </div>
            {customers.filter((c: any) => c.status !== "blocked" && (!searchQuery || c.name?.toLowerCase().includes(searchQuery.toLowerCase()) || c.phone?.includes(searchQuery))).map((customer: any) => (
              <div key={customer.id} className="bg-white border rounded-xl p-4 shadow-sm" data-testid={`card-customer-${customer.id}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                      <UserCheck className="h-5 w-5 text-indigo-500" />
                    </div>
                    <div>
                      <p className="font-semibold">{customer.name}</p>
                      <p className="text-xs text-gray-500">{customer.phone} {customer.email ? `• ${customer.email}` : ""}</p>
                      {customer.address && <p className="text-xs text-gray-400">{customer.address}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${customer.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{customer.status}</span>
                    <Button size="sm" variant="outline" className="text-red-500 gap-1" onClick={() => { if (confirm(`Block customer "${customer.name}"?`)) updateCustomerMutation.mutate({ id: customer.id, data: { status: "blocked" } }); }}>
                      <Ban className="h-3 w-3" /> Block
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {customers.filter((c: any) => c.status !== "blocked").length === 0 && (
              <div className="text-center py-16 border border-dashed rounded-xl bg-white">
                <UserCheck className="h-12 w-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400">No customers registered yet</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "blocked-customers" && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Blocked / Fake Customers ({blockedCustomers.length})</h2>
            {blockedCustomers.length === 0 && (
              <div className="text-center py-16 border border-dashed rounded-xl bg-white">
                <UserX className="h-12 w-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400">No blocked customers</p>
              </div>
            )}
            {blockedCustomers.map((customer: any) => (
              <div key={customer.id} className="bg-white border border-red-200 rounded-xl p-4 shadow-sm" data-testid={`card-blocked-customer-${customer.id}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                      <UserX className="h-5 w-5 text-red-400" />
                    </div>
                    <div>
                      <p className="font-semibold">{customer.name}</p>
                      <p className="text-xs text-gray-500">{customer.phone} {customer.email ? `• ${customer.email}` : ""}</p>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => updateCustomerMutation.mutate({ id: customer.id, data: { status: "active" } })} className="gap-1 bg-green-600 hover:bg-green-700">
                    <Check className="h-3 w-3" /> Unblock
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "live-map" && (
          <LiveMapComponent brandId={brandId} drivers={drivers} />
        )}

        {activeTab === "rides" && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Rides ({rides.length})</h2>
            {rides.map((ride: any) => {
              const driver = drivers.find((d: any) => d.id === ride.driverId);
              return (
                <div key={ride.id} className="bg-white border rounded-xl p-4 shadow-sm" data-testid={`card-ride-${ride.id}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${ride.status === "completed" ? "bg-green-100 text-green-700" : ride.status === "cancelled" ? "bg-red-100 text-red-700" : ride.status === "in_progress" ? "bg-blue-100 text-blue-700" : "bg-yellow-100 text-yellow-700"}`}>
                      {ride.status?.replace(/_/g, " ").toUpperCase()}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{new Date(ride.createdAt).toLocaleString()}</span>
                      {ride.status === "cancelled" && (
                        <button
                          onClick={() => { if (confirm("Delete this cancelled ride?")) deleteRideMutation.mutate(ride.id); }}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
                          title="Delete ride"
                          data-testid={`button-delete-ride-${ride.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                    <p><span className="text-gray-400">Driver:</span> {driver?.name || "Unassigned"}</p>
                    <p><span className="text-gray-400">Price:</span> {currSymbol}{ride.finalPrice || ride.estimatedPrice || "0"}</p>
                    <p><span className="text-gray-400">From:</span> {ride.pickupAddress || "N/A"}</p>
                    <p><span className="text-gray-400">To:</span> {ride.dropoffAddress || "N/A"}</p>
                    <p><span className="text-gray-400">Payment:</span> {ride.paymentMethod || "N/A"} ({ride.paymentStatus || "N/A"})</p>
                    <p><span className="text-gray-400">Distance:</span> {ride.distanceMiles ? `${ride.distanceMiles} mi` : "N/A"}</p>
                  </div>
                </div>
              );
            })}
            {rides.length === 0 && (
              <div className="text-center py-16 border border-dashed rounded-xl bg-white">
                <Navigation className="h-12 w-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400">No rides yet</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "complaints" && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Complaints ({complaints.length})</h2>
            {complaints.map((complaint: any) => {
              const ride = rides.find((r: any) => r.id === complaint.rideId);
              const driver = ride ? drivers.find((d: any) => d.id === ride.driverId) : null;
              return (
                <div key={complaint.id} className="bg-white border rounded-xl p-4 shadow-sm" data-testid={`card-complaint-${complaint.id}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${complaint.status === "open" ? "bg-red-100 text-red-700" : complaint.status === "investigating" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}>
                        {complaint.status?.toUpperCase()}
                      </span>
                      {complaint.complaintType && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{complaint.complaintType.replace(/_/g, " ")}</span>}
                    </div>
                    <span className="text-xs text-gray-400">{new Date(complaint.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-sm mb-2">{complaint.description}</p>
                  {driver && <p className="text-xs text-gray-500">Driver: {driver.name} ({driver.phone})</p>}
                  <p className="text-xs text-gray-400">Filed by: {complaint.filedBy}</p>
                  {complaint.resolution && <p className="text-xs text-green-600 mt-1 bg-green-50 p-2 rounded">Resolution: {complaint.resolution}</p>}
                </div>
              );
            })}
            {complaints.length === 0 && (
              <div className="text-center py-16 border border-dashed rounded-xl bg-white">
                <MessageCircle className="h-12 w-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400">No complaints</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "messages" && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Messages & Communication</h2>
            <p className="text-sm text-gray-500">Send messages to your drivers via WhatsApp</p>

            {messageDriver && (
              <div className="bg-white border rounded-xl p-5 shadow-sm">
                <h3 className="font-bold mb-3">Message to: {messageDriver.name}</h3>
                <Textarea value={messageText} onChange={e => setMessageText(e.target.value)} placeholder="Type your message..." rows={4} className="mb-3" />
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      const phone = (messageDriver.whatsapp || messageDriver.phone || "").replace(/[^0-9+]/g, "");
                      if (phone) {
                        window.open(`https://wa.me/${phone.replace("+", "")}?text=${encodeURIComponent(messageText)}`, "_blank");
                        toast({ title: "WhatsApp opened" });
                        setMessageText("");
                        setMessageDriver(null);
                      } else {
                        toast({ title: "No phone number available", variant: "destructive" });
                      }
                    }}
                    className="gap-2 bg-green-600 hover:bg-green-700"
                  >
                    <Send className="h-4 w-4" /> Send via WhatsApp
                  </Button>
                  <Button variant="outline" onClick={() => { setMessageDriver(null); setMessageText(""); }}>Cancel</Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <h3 className="font-semibold text-gray-700 mt-4">Quick Message - Select Driver</h3>
              {drivers.filter((d: any) => d.status !== "blocked").map((driver: any) => (
                <div key={driver.id} className="bg-white border rounded-lg p-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer" onClick={() => setMessageDriver(driver)}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center overflow-hidden">
                      {driver.photo ? <img src={driver.photo} alt="" className="w-full h-full object-cover" /> : <Users className="h-4 w-4 text-blue-400" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{driver.name}</p>
                      <p className="text-xs text-gray-500">{driver.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${driver.onDuty ? "bg-green-500" : "bg-gray-300"}`}></span>
                    <Send className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              ))}
              {drivers.filter((d: any) => d.status !== "blocked").length === 0 && (
                <p className="text-center text-gray-400 py-8">No drivers to message</p>
              )}
            </div>
          </div>
        )}

        {activeTab === "qr-codes" && (
          <QrCodesTab drivers={drivers} qrSelectedDriverId={qrSelectedDriverId} setQrSelectedDriverId={setQrSelectedDriverId} setEditingDriver={setEditingDriver} setActiveTab={setActiveTab} />
        )}

        {activeTab === "brand-settings" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Brand Settings</h2>
              {!editingBrandSettings ? (
                <Button onClick={() => setEditingBrandSettings(true)} variant="outline" className="gap-2"><Edit2 className="h-4 w-4" /> Edit</Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setEditingBrandSettings(false)}>Cancel</Button>
                  <Button onClick={() => updateBrandMutation.mutate(brandSettingsForm)} className="gap-2"><Save className="h-4 w-4" /> Save</Button>
                </div>
              )}
            </div>
            <div className="bg-white border rounded-xl p-6 space-y-5 max-w-2xl">
              <div className="flex items-center gap-4 mb-4">
                {brand?.logo ? <img src={brand.logo} alt="" className="w-16 h-16 rounded-xl object-cover" /> : (
                  <div className="w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-2xl" style={{ background: brand?.primaryColor }}>{brandName[0]}</div>
                )}
                <div>
                  <h3 className="text-xl font-bold">{brandName}</h3>
                  <p className="text-sm text-gray-500">/taxi/{brandSlug}</p>
                </div>
              </div>
              {editingBrandSettings ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-sm font-medium">Brand Name</label><Input value={brandSettingsForm.name || ""} onChange={e => setBrandSettingsForm((p: any) => ({ ...p, name: e.target.value }))} /></div>
                    <div><label className="text-sm font-medium">Logo URL</label><Input value={brandSettingsForm.logo || ""} onChange={e => setBrandSettingsForm((p: any) => ({ ...p, logo: e.target.value }))} /></div>
                  </div>
                  <div><label className="text-sm font-medium">Address</label><Input value={brandSettingsForm.address || ""} onChange={e => setBrandSettingsForm((p: any) => ({ ...p, address: e.target.value }))} /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-sm font-medium">Phone</label><Input value={brandSettingsForm.phone || ""} onChange={e => setBrandSettingsForm((p: any) => ({ ...p, phone: e.target.value }))} /></div>
                    <div><label className="text-sm font-medium">Email</label><Input value={brandSettingsForm.email || ""} onChange={e => setBrandSettingsForm((p: any) => ({ ...p, email: e.target.value }))} /></div>
                  </div>
                  <div><label className="text-sm font-medium">WhatsApp</label><Input value={brandSettingsForm.whatsapp || ""} onChange={e => setBrandSettingsForm((p: any) => ({ ...p, whatsapp: e.target.value }))} /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Primary Color</label>
                      <div className="flex gap-2"><input type="color" value={brandSettingsForm.primaryColor || "#1a1a2e"} onChange={e => setBrandSettingsForm((p: any) => ({ ...p, primaryColor: e.target.value }))} className="w-10 h-10 rounded" /><Input value={brandSettingsForm.primaryColor || ""} onChange={e => setBrandSettingsForm((p: any) => ({ ...p, primaryColor: e.target.value }))} /></div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Secondary Color</label>
                      <div className="flex gap-2"><input type="color" value={brandSettingsForm.secondaryColor || "#e94560"} onChange={e => setBrandSettingsForm((p: any) => ({ ...p, secondaryColor: e.target.value }))} className="w-10 h-10 rounded" /><Input value={brandSettingsForm.secondaryColor || ""} onChange={e => setBrandSettingsForm((p: any) => ({ ...p, secondaryColor: e.target.value }))} /></div>
                    </div>
                  </div>
                  <div><label className="text-sm font-medium">Description</label><Textarea value={brandSettingsForm.description || ""} onChange={e => setBrandSettingsForm((p: any) => ({ ...p, description: e.target.value }))} rows={3} /></div>

                  <div className="border-t pt-4 mt-4">
                    <h4 className="font-bold text-lg mb-3 flex items-center gap-2"><CreditCard className="h-5 w-5" /> Payment Settings</h4>

                    <div className="space-y-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <h5 className="font-semibold mb-2 flex items-center gap-2"><CreditCard className="h-4 w-4 text-blue-600" /> Stripe (Card Payments)</h5>
                        <div className="grid grid-cols-1 gap-3">
                          <div><label className="text-sm font-medium">Stripe Publishable Key</label><Input value={brandSettingsForm.stripePublishableKey || ""} onChange={e => setBrandSettingsForm((p: any) => ({ ...p, stripePublishableKey: e.target.value }))} placeholder="pk_live_..." /></div>
                          <div><label className="text-sm font-medium">Stripe Secret Key</label><Input type="password" value={brandSettingsForm.stripeSecretKey || ""} onChange={e => setBrandSettingsForm((p: any) => ({ ...p, stripeSecretKey: e.target.value }))} placeholder="sk_live_..." /></div>
                        </div>
                      </div>

                      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-semibold flex items-center gap-2"><Banknote className="h-4 w-4 text-green-600" /> Bank Transfer</h5>
                          <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={brandSettingsForm.bankTransferEnabled || false} onChange={e => setBrandSettingsForm((p: any) => ({ ...p, bankTransferEnabled: e.target.checked }))} className="w-4 h-4" /><span className="text-sm">Enabled</span></label>
                        </div>
                        {brandSettingsForm.bankTransferEnabled && (
                          <div className="grid grid-cols-2 gap-3">
                            <div><label className="text-sm font-medium">Bank Name</label><Input value={brandSettingsForm.bankName || ""} onChange={e => setBrandSettingsForm((p: any) => ({ ...p, bankName: e.target.value }))} placeholder="e.g. Barclays" /></div>
                            <div><label className="text-sm font-medium">Account Name</label><Input value={brandSettingsForm.bankAccountName || ""} onChange={e => setBrandSettingsForm((p: any) => ({ ...p, bankAccountName: e.target.value }))} placeholder="Account holder name" /></div>
                            <div><label className="text-sm font-medium">Sort Code</label><Input value={brandSettingsForm.bankSortCode || ""} onChange={e => setBrandSettingsForm((p: any) => ({ ...p, bankSortCode: e.target.value }))} placeholder="00-00-00" /></div>
                            <div><label className="text-sm font-medium">Account Number</label><Input value={brandSettingsForm.bankAccountNumber || ""} onChange={e => setBrandSettingsForm((p: any) => ({ ...p, bankAccountNumber: e.target.value }))} placeholder="12345678" /></div>
                            <div className="col-span-2"><label className="text-sm font-medium">IBAN</label><Input value={brandSettingsForm.bankIban || ""} onChange={e => setBrandSettingsForm((p: any) => ({ ...p, bankIban: e.target.value }))} placeholder="GB00XXXX..." /></div>
                          </div>
                        )}
                      </div>

                      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-semibold flex items-center gap-2"><Wallet className="h-4 w-4 text-purple-600" /> JazzCash</h5>
                          <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={brandSettingsForm.jazzCashEnabled || false} onChange={e => setBrandSettingsForm((p: any) => ({ ...p, jazzCashEnabled: e.target.checked }))} className="w-4 h-4" /><span className="text-sm">Enabled</span></label>
                        </div>
                        {brandSettingsForm.jazzCashEnabled && (
                          <div className="grid grid-cols-2 gap-3">
                            <div><label className="text-sm font-medium">JazzCash Number</label><Input value={brandSettingsForm.jazzCashNumber || ""} onChange={e => setBrandSettingsForm((p: any) => ({ ...p, jazzCashNumber: e.target.value }))} placeholder="03XX-XXXXXXX" /></div>
                            <div><label className="text-sm font-medium">Account Name</label><Input value={brandSettingsForm.jazzCashAccountName || ""} onChange={e => setBrandSettingsForm((p: any) => ({ ...p, jazzCashAccountName: e.target.value }))} placeholder="Account holder name" /></div>
                          </div>
                        )}
                      </div>

                      <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-semibold flex items-center gap-2"><Wallet className="h-4 w-4 text-orange-600" /> EasyPaisa</h5>
                          <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={brandSettingsForm.easyPaisaEnabled || false} onChange={e => setBrandSettingsForm((p: any) => ({ ...p, easyPaisaEnabled: e.target.checked }))} className="w-4 h-4" /><span className="text-sm">Enabled</span></label>
                        </div>
                        {brandSettingsForm.easyPaisaEnabled && (
                          <div className="grid grid-cols-2 gap-3">
                            <div><label className="text-sm font-medium">EasyPaisa Number</label><Input value={brandSettingsForm.easyPaisaNumber || ""} onChange={e => setBrandSettingsForm((p: any) => ({ ...p, easyPaisaNumber: e.target.value }))} placeholder="03XX-XXXXXXX" /></div>
                            <div><label className="text-sm font-medium">Account Name</label><Input value={brandSettingsForm.easyPaisaAccountName || ""} onChange={e => setBrandSettingsForm((p: any) => ({ ...p, easyPaisaAccountName: e.target.value }))} placeholder="Account holder name" /></div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div><span className="text-gray-400">Phone:</span> {brand?.phone || "Not set"}</div>
                    <div><span className="text-gray-400">Email:</span> {brand?.email || "Not set"}</div>
                    <div><span className="text-gray-400">WhatsApp:</span> {brand?.whatsapp || "Not set"}</div>
                    <div><span className="text-gray-400">Address:</span> {brand?.address || "Not set"}</div>
                    <div><span className="text-gray-400">Commission:</span> {brand?.platformCommissionPercent || 0}%</div>
                  </div>
                  {brand?.description && <div><span className="text-gray-400">Description:</span> {brand.description}</div>}
                  <div className="flex gap-3 mt-4">
                    <div className="flex items-center gap-2"><div className="w-6 h-6 rounded" style={{ background: brand?.primaryColor }} /><span className="text-xs text-gray-500">Primary</span></div>
                    <div className="flex items-center gap-2"><div className="w-6 h-6 rounded" style={{ background: brand?.secondaryColor }} /><span className="text-xs text-gray-500">Secondary</span></div>
                  </div>
                  <div className="border-t pt-3 mt-3">
                    <span className="text-gray-400 font-medium">Payment Methods:</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {brand?.stripePublishableKey && <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">💳 Stripe Card</span>}
                      {brand?.bankTransferEnabled && <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">🏦 Bank Transfer</span>}
                      {brand?.jazzCashEnabled && <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">📱 JazzCash</span>}
                      {brand?.easyPaisaEnabled && <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs">📱 EasyPaisa</span>}
                      {!brand?.stripePublishableKey && !brand?.bankTransferEnabled && !brand?.jazzCashEnabled && !brand?.easyPaisaEnabled && <span className="text-gray-400 text-xs">No payment methods configured</span>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <Dialog open={!!viewingDriver} onOpenChange={(open) => { if (!open) setViewingDriver(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Driver Details — {viewingDriver?.name}</DialogTitle></DialogHeader>
          {viewingDriver && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-20 h-24 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden border">
                  {viewingDriver.photo ? <img src={viewingDriver.photo} alt="" className="w-full h-full object-cover" /> : <Users className="h-10 w-10 text-gray-300" />}
                </div>
                <div>
                  <h3 className="text-lg font-bold">{viewingDriver.name}</h3>
                  <p className="text-sm text-gray-500">{viewingDriver.phone}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${viewingDriver.status === "active" ? "bg-green-100 text-green-700" : viewingDriver.status === "pending" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>{viewingDriver.status}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { label: "Phone", value: viewingDriver.phone },
                  { label: "WhatsApp", value: viewingDriver.whatsapp },
                  { label: "Email", value: viewingDriver.email },
                  { label: "Emergency", value: viewingDriver.emergencyPhone },
                  { label: "Address", value: viewingDriver.address },
                  { label: "Country", value: viewingDriver.country },
                  { label: "Employment", value: EMPLOYMENT_TYPES.find(e => e.value === viewingDriver.employmentType)?.label },
                  { label: "Company", value: viewingDriver.companyName },
                  { label: "Licence No.", value: viewingDriver.drivingLicenceNumber },
                  { label: "Visa Type", value: viewingDriver.visaType?.replace(/_/g, " ") },
                  { label: "Vehicle", value: VEHICLE_TYPES.find(v => v.value === viewingDriver.vehicleType)?.label },
                  { label: "Category", value: VEHICLE_CATEGORIES.find(v => v.value === viewingDriver.vehicleCategory)?.label },
                  { label: "Seats", value: viewingDriver.seatCount },
                  { label: "Fuel", value: FUEL_TYPES.find(f => f.value === viewingDriver.fuelType)?.label },
                  { label: "Model", value: `${viewingDriver.carModel || ""} ${viewingDriver.carColor || ""}`.trim() },
                  { label: "Plate", value: viewingDriver.numberPlate },
                  { label: "Radius", value: `${viewingDriver.serviceRadiusMiles} miles` },
                  { label: "Payment", value: PAYMENT_AGREEMENTS.find(p => p.value === viewingDriver.paymentAgreement)?.label },
                  { label: "Commission", value: viewingDriver.commissionPercent ? `${viewingDriver.commissionPercent}%` : "N/A" },
                  { label: "Salary", value: viewingDriver.fixedSalary && viewingDriver.fixedSalary !== "0" ? `${CURRENCIES.find(c => c.value === viewingDriver.currency)?.symbol || "£"}${viewingDriver.fixedSalary}/${viewingDriver.salaryPeriod}` : "N/A" },
                  { label: "Pay Method", value: PAYMENT_METHODS.find(m => m.value === viewingDriver.paymentMethod)?.label },
                  { label: "Currency", value: CURRENCIES.find(c => c.value === viewingDriver.currency)?.label },
                  { label: "Hours/Week", value: viewingDriver.weeklyHoursAllowed },
                  { label: "Timing", value: viewingDriver.timingPreference },
                ].map((item, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-2">
                    <span className="text-gray-400 text-xs block">{item.label}</span>
                    <span className="font-medium">{item.value || "N/A"}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 flex-wrap">
                {viewingDriver.drivingLicenceImage && <a href={viewingDriver.drivingLicenceImage} target="_blank" className="text-sm text-blue-500 underline flex items-center gap-1"><FileText className="h-4 w-4" /> View Licence</a>}
                {viewingDriver.visaImage && <a href={viewingDriver.visaImage} target="_blank" className="text-sm text-blue-500 underline flex items-center gap-1"><FileText className="h-4 w-4" /> View Visa</a>}
                {viewingDriver.insuranceImage && <a href={viewingDriver.insuranceImage} target="_blank" className="text-sm text-blue-500 underline flex items-center gap-1"><Shield className="h-4 w-4" /> View Insurance</a>}
                {viewingDriver.carImage && <a href={viewingDriver.carImage} target="_blank" className="text-sm text-blue-500 underline flex items-center gap-1"><Car className="h-4 w-4" /> View Car Photo</a>}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingDriver} onOpenChange={(open) => { if (!open) setEditingDriver(null); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Driver — {editingDriver?.name}</DialogTitle></DialogHeader>
          {editingDriver && renderDriverForm(true)}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingDriver(null)}>Cancel</Button>
            <Button onClick={() => {
              const { id, brandId: _, password, createdAt, onDuty, lastLocationLat, lastLocationLng, lastLocationUpdated, status, ...updateData } = editingDriver;
              updateDriverMutation.mutate({ id, data: updateData });
              setEditingDriver(null);
            }} className="gap-2"><Save className="h-4 w-4" /> Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}