import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Car, MapPin, Clock, DollarSign, Power, PowerOff, Bell, Star,
  Settings, LogOut, ChevronRight, Calendar, TrendingUp, Receipt,
  Shield, Phone, Mail, Camera, FileText, Edit2, Save, X, Check,
  AlertTriangle, Fuel, Navigation, User, CreditCard, Building,
  Banknote, PoundSterling, Calculator, ArrowLeft, Menu as MenuIcon,
  Plus, Trash2, Coffee, UtensilsCrossed, Droplets, Wallet,
  Timer, CalendarDays, Ban, QrCode, Hash, Eye,
} from "lucide-react";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const EXPENSE_CATEGORIES = [
  { value: "breakfast", label: "Breakfast", icon: "🍳" },
  { value: "lunch", label: "Lunch", icon: "🥘" },
  { value: "dinner", label: "Dinner", icon: "🍽️" },
  { value: "coffee_tea", label: "Coffee / Tea", icon: "☕" },
  { value: "soft_drink", label: "Soft Drink", icon: "🥤" },
  { value: "water", label: "Water", icon: "💧" },
  { value: "snack", label: "Snack", icon: "🍪" },
  { value: "other", label: "Other", icon: "📦" },
];

const CURRENCIES: Record<string, string> = {
  GBP: "£", USD: "$", PKR: "₨", EUR: "€", INR: "₹", AED: "د.إ", SAR: "﷼", TRY: "₺",
};

function getDateRange(period: string) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const weekAgo = new Date(today.getTime() - 7 * 86400000);
  const yearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
  if (period === "today") return { start: today, end: now };
  if (period === "yesterday") return { start: yesterday, end: today };
  if (period === "week") return { start: weekAgo, end: now };
  if (period === "year") return { start: yearAgo, end: now };
  return { start: yearAgo, end: now };
}

function sumByPeriod(items: any[], period: string, field = "amount") {
  const { start, end } = getDateRange(period);
  return items
    .filter(item => {
      const d = new Date(item.date || item.createdAt);
      return d >= start && d <= end;
    })
    .reduce((sum, item) => sum + parseFloat(item[field] || "0"), 0);
}

function countByPeriod(items: any[], period: string) {
  const { start, end } = getDateRange(period);
  return items.filter(item => {
    const d = new Date(item.date || item.createdAt);
    return d >= start && d <= end;
  }).length;
}

function StatCard({ label, value, icon: Icon, color, prefix = "" }: { label: string; value: string | number; icon: any; color: string; prefix?: string }) {
  return (
    <div className={`bg-gradient-to-br ${color} border border-white/10 rounded-2xl p-4`}>
      <Icon className="h-6 w-6 mb-2 opacity-80" />
      <p className="text-2xl font-bold">{prefix}{typeof value === "number" ? value.toFixed(2) : value}</p>
      <p className="text-xs opacity-70 mt-1">{label}</p>
    </div>
  );
}

export default function TaxiDriverDashboard() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const driverId = localStorage.getItem("taxiDriverId");
  const brandName = localStorage.getItem("taxiBrandName");
  const [activeTab, setActiveTab] = useState("home");
  const [mobileMenu, setMobileMenu] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const alarmRef = useRef<HTMLAudioElement | null>(null);
  const [incomingRide, setIncomingRide] = useState<any>(null);
  const [otpInput, setOtpInput] = useState("");

  useEffect(() => {
    if (!driverId) { navigate("/taxi-login"); return; }
  }, [driverId, navigate]);

  const { data: driver, isLoading: driverLoading } = useQuery({
    queryKey: ["/api/taxi-drivers", driverId],
    queryFn: () => fetch(`/api/taxi-drivers/${driverId}`).then(r => r.json()),
    enabled: !!driverId,
    refetchInterval: 10000,
  });

  const { data: pricing = [] } = useQuery({
    queryKey: ["/api/taxi-drivers", driverId, "pricing"],
    queryFn: () => fetch(`/api/taxi-drivers/${driverId}/pricing`).then(r => r.json()),
    enabled: !!driverId,
  });

  const { data: earningsData } = useQuery({
    queryKey: ["/api/taxi-drivers", driverId, "earnings"],
    queryFn: () => fetch(`/api/taxi-drivers/${driverId}/earnings`).then(r => r.json()),
    enabled: !!driverId,
  });

  const { data: rides = [] } = useQuery({
    queryKey: ["/api/taxi-rides", driverId],
    queryFn: () => fetch(`/api/taxi-rides?driverId=${driverId}`).then(r => r.json()),
    enabled: !!driverId,
  });

  const { data: fuelLogs = [] } = useQuery({
    queryKey: ["/api/taxi-drivers", driverId, "fuel-logs"],
    queryFn: () => fetch(`/api/taxi-drivers/${driverId}/fuel-logs`).then(r => r.json()),
    enabled: !!driverId,
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ["/api/taxi-drivers", driverId, "expenses"],
    queryFn: () => fetch(`/api/taxi-drivers/${driverId}/expenses`).then(r => r.json()),
    enabled: !!driverId,
  });

  const { data: workLogs = [] } = useQuery({
    queryKey: ["/api/taxi-drivers", driverId, "work-logs"],
    queryFn: () => fetch(`/api/taxi-drivers/${driverId}/work-logs`).then(r => r.json()),
    enabled: !!driverId,
  });

  const activeRide = rides.find((r: any) => ["accepted", "driver_arriving", "otp_verified", "in_progress"].includes(r.status));
  const completedRides = rides.filter((r: any) => r.status === "completed");
  const earnings = earningsData?.earnings || [];
  const curr = CURRENCIES[driver?.currency || "GBP"] || "£";

  useEffect(() => {
    if (!driverId) return;
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/taxi-ws`);
    wsRef.current = ws;
    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "register_driver", driverId }));
    };
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "ride_request") {
          setIncomingRide(msg.ride);
          if (alarmRef.current) { alarmRef.current.currentTime = 0; alarmRef.current.play().catch(() => {}); }
        }
        if (msg.type === "ride_update") {
          queryClient.invalidateQueries({ queryKey: ["/api/taxi-rides"] });
        }
      } catch {}
    };
    return () => { ws.close(); };
  }, [driverId, queryClient]);

  useEffect(() => {
    if (!driverId || !driver?.onDuty) return;
    const interval = setInterval(() => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
          const { latitude, longitude } = pos.coords;
          fetch(`/api/taxi-drivers/${driverId}/location`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lat: latitude, lng: longitude }),
          });
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: "driver_location", driverId, lat: latitude, lng: longitude, rideId: activeRide?.id }));
          }
        });
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [driverId, driver?.onDuty, activeRide?.id]);

  const toggleDutyMutation = useMutation({
    mutationFn: (onDuty: boolean) => fetch(`/api/taxi-drivers/${driverId}/duty`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ onDuty }) }).then(r => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/taxi-drivers"] }),
  });

  const updateRideMutation = useMutation({
    mutationFn: ({ rideId, data }: { rideId: string; data: any }) => fetch(`/api/taxi-rides/${rideId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/taxi-rides"] }); queryClient.invalidateQueries({ queryKey: ["/api/taxi-drivers"] }); },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: ({ rideId, otp }: { rideId: string; otp: string }) => fetch(`/api/taxi-rides/${rideId}/verify-otp`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ otp }) }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/taxi-rides"] }); setOtpInput(""); },
  });

  const addFuelMutation = useMutation({
    mutationFn: (data: any) => fetch(`/api/taxi-drivers/${driverId}/fuel-logs`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(r => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/taxi-drivers", driverId, "fuel-logs"] }),
  });

  const deleteFuelMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/taxi-driver-fuel-logs/${id}`, { method: "DELETE" }).then(r => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/taxi-drivers", driverId, "fuel-logs"] }),
  });

  const addExpenseMutation = useMutation({
    mutationFn: (data: any) => fetch(`/api/taxi-drivers/${driverId}/expenses`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(r => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/taxi-drivers", driverId, "expenses"] }),
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/taxi-driver-expenses/${id}`, { method: "DELETE" }).then(r => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/taxi-drivers", driverId, "expenses"] }),
  });

  const addWorkLogMutation = useMutation({
    mutationFn: (data: any) => fetch(`/api/taxi-drivers/${driverId}/work-logs`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(r => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/taxi-drivers", driverId, "work-logs"] }),
  });

  const updateWorkLogMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => fetch(`/api/taxi-driver-work-logs/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(r => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/taxi-drivers", driverId, "work-logs"] }),
  });

  const [pricingForm, setPricingForm] = useState<Record<number, any>>({});
  const [editingPricing, setEditingPricing] = useState(false);

  useEffect(() => {
    if (pricing.length > 0) {
      const map: Record<number, any> = {};
      pricing.forEach((p: any) => { map[p.dayOfWeek] = p; });
      setPricingForm(map);
    }
  }, [pricing]);

  const savePricingMutation = useMutation({
    mutationFn: (pricingData: any[]) => fetch(`/api/taxi-drivers/${driverId}/pricing`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pricing: pricingData }) }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/taxi-drivers", driverId, "pricing"] }); setEditingPricing(false); },
  });

  const handleSavePricing = () => {
    const entries = Object.entries(pricingForm).map(([day, data]) => ({
      dayOfWeek: parseInt(day), pricePerMile: data.pricePerMile || "2.00", pricePerHour: data.pricePerHour || "15.00",
      minimumFare: data.minimumFare || "6.00", waitingChargePerMin: data.waitingChargePerMin || "0.30",
      freeWaitingMins: data.freeWaitingMins ?? 5, freeStops: data.freeStops ?? 0, chargePerExtraStop: data.chargePerExtraStop || "2.00",
    }));
    savePricingMutation.mutate(entries);
  };

  const handleAcceptRide = () => {
    if (!incomingRide) return;
    updateRideMutation.mutate({ rideId: incomingRide.id, data: { status: "accepted" } });
    setIncomingRide(null);
    if (alarmRef.current) alarmRef.current.pause();
  };

  const handleRejectRide = () => {
    if (!incomingRide) return;
    updateRideMutation.mutate({ rideId: incomingRide.id, data: { status: "cancelled" } });
    setIncomingRide(null);
    if (alarmRef.current) alarmRef.current.pause();
  };

  const handleLogout = () => {
    localStorage.removeItem("taxiDriverId");
    localStorage.removeItem("taxiDriverName");
    localStorage.removeItem("taxiBrandId");
    localStorage.removeItem("taxiBrandName");
    navigate("/taxi-login");
  };

  // Fuel form state
  const [fuelForm, setFuelForm] = useState({ fuelType: driver?.fuelType || "petrol", amount: "", litres: "", notes: "" });
  // Expense form state
  const [expenseForm, setExpenseForm] = useState({ category: "breakfast", amount: "", notes: "" });
  // Work log form state
  const [workForm, setWorkForm] = useState({ startTime: "", endTime: "", shiftType: "8" });

  const daysNotWorked = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const calcDaysOff = (totalDays: number) => {
      let daysWorked = 0;
      const worked = new Set<string>();
      workLogs.forEach((log: any) => {
        const d = new Date(log.date || log.createdAt);
        worked.add(d.toDateString());
      });
      const start = new Date(today.getTime() - totalDays * 86400000);
      for (let i = 0; i < totalDays; i++) {
        const d = new Date(start.getTime() + i * 86400000);
        if (worked.has(d.toDateString())) daysWorked++;
      }
      return totalDays - daysWorked;
    };
    return {
      week: calcDaysOff(7),
      month: calcDaysOff(30),
      year: calcDaysOff(365),
    };
  }, [workLogs]);

  const totalHours = useMemo(() => ({
    today: workLogs.filter((l: any) => new Date(l.date || l.createdAt).toDateString() === new Date().toDateString()).reduce((s: number, l: any) => s + parseFloat(l.hoursWorked || "0"), 0),
    yesterday: workLogs.filter((l: any) => { const d = new Date(l.date || l.createdAt); const y = new Date(); y.setDate(y.getDate() - 1); return d.toDateString() === y.toDateString(); }).reduce((s: number, l: any) => s + parseFloat(l.hoursWorked || "0"), 0),
    week: workLogs.filter((l: any) => new Date(l.date || l.createdAt) >= new Date(Date.now() - 7 * 86400000)).reduce((s: number, l: any) => s + parseFloat(l.hoursWorked || "0"), 0),
    year: workLogs.filter((l: any) => new Date(l.date || l.createdAt) >= new Date(Date.now() - 365 * 86400000)).reduce((s: number, l: any) => s + parseFloat(l.hoursWorked || "0"), 0),
  }), [workLogs]);

  const commissionPaid = useMemo(() => {
    if (driver?.paymentAgreement !== "commission" && driver?.paymentAgreement !== "commission_plus_fixed") return 0;
    const pct = parseFloat(driver?.commissionPercent || "10");
    const totalEarnings = earnings.reduce((s: number, e: any) => s + parseFloat(e.amount || "0"), 0);
    return (totalEarnings * pct) / 100;
  }, [earnings, driver]);

  if (!driverId || driverLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  const sideItems = [
    { id: "home", icon: Car, label: "Dashboard" },
    { id: "earnings", icon: PoundSterling, label: "Earnings" },
    { id: "rides", icon: Navigation, label: "Rides" },
    { id: "fuel", icon: Fuel, label: "Petrol / Diesel" },
    { id: "expenses", icon: UtensilsCrossed, label: "Expenses" },
    { id: "work-hours", icon: Timer, label: "Work Hours" },
    { id: "commission", icon: Wallet, label: "Commission & Pay" },
    { id: "pricing", icon: Calculator, label: "Pricing" },
    { id: "profile", icon: User, label: "Profile" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <audio ref={alarmRef} src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" loop preload="auto" />

      {incomingRide && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-blue-900 to-purple-900 rounded-3xl p-8 max-w-md w-full border border-white/20 shadow-2xl animate-pulse">
            <div className="text-center mb-6">
              <Bell className="h-16 w-16 text-yellow-400 mx-auto mb-4 animate-bounce" />
              <h2 className="text-2xl font-bold">New Ride Request!</h2>
            </div>
            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-3 bg-white/10 rounded-xl p-3">
                <MapPin className="h-5 w-5 text-green-400 mt-0.5 shrink-0" />
                <div><p className="text-xs text-gray-400">Pickup</p><p className="font-medium">{incomingRide.pickupAddress}</p></div>
              </div>
              <div className="flex items-start gap-3 bg-white/10 rounded-xl p-3">
                <MapPin className="h-5 w-5 text-red-400 mt-0.5 shrink-0" />
                <div><p className="text-xs text-gray-400">Drop-off</p><p className="font-medium">{incomingRide.dropoffAddress}</p></div>
              </div>
              {incomingRide.estimatedPrice && (
                <div className="flex items-center gap-3 bg-white/10 rounded-xl p-3">
                  <PoundSterling className="h-5 w-5 text-yellow-400 shrink-0" />
                  <div><p className="text-xs text-gray-400">Estimated Fare</p><p className="text-xl font-bold text-yellow-400">{curr}{parseFloat(incomingRide.estimatedPrice).toFixed(2)}</p></div>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={handleRejectRide} className="flex-1 py-3 bg-red-600 hover:bg-red-500 rounded-xl font-bold transition-all" data-testid="button-reject-ride">Reject</button>
              <button onClick={handleAcceptRide} className="flex-1 py-3 bg-green-600 hover:bg-green-500 rounded-xl font-bold transition-all" data-testid="button-accept-ride">Accept</button>
            </div>
          </div>
        </div>
      )}

      <div className="lg:hidden sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <button onClick={() => setMobileMenu(!mobileMenu)} className="text-white p-2"><MenuIcon className="h-6 w-6" /></button>
        <h1 className="font-bold text-lg">{brandName || "Taxi Driver"}</h1>
        <div className={`w-3 h-3 rounded-full ${driver?.onDuty ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
      </div>

      {mobileMenu && (
        <div className="lg:hidden fixed inset-0 z-[60] bg-black/60" onClick={() => setMobileMenu(false)}>
          <div className="w-72 h-full bg-slate-900 border-r border-white/10 p-4 overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-6 p-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg overflow-hidden">
                {driver?.photo ? <img src={driver.photo} alt="" className="w-full h-full object-cover" /> : driver?.name?.[0] || "D"}
              </div>
              <div><p className="font-bold">{driver?.name}</p><p className="text-xs text-gray-400">{driver?.numberPlate || driver?.vehicleType}</p></div>
            </div>
            {sideItems.map(item => (
              <button key={item.id} onClick={() => { setActiveTab(item.id); setMobileMenu(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-1 transition-all ${activeTab === item.id ? "bg-blue-600/20 text-blue-400" : "text-gray-400 hover:bg-white/5"}`}>
                <item.icon className="h-5 w-5" /><span>{item.label}</span>
              </button>
            ))}
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl mt-4 text-red-400 hover:bg-red-500/10 transition-all">
              <LogOut className="h-5 w-5" /><span>Logout</span>
            </button>
          </div>
        </div>
      )}

      <div className="flex">
        <div className="hidden lg:flex flex-col w-64 min-h-screen bg-slate-900/50 border-r border-white/10 p-4 fixed inset-y-0 z-30 overflow-y-auto">
          <div className="flex items-center gap-3 mb-6 p-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg overflow-hidden">
              {driver?.photo ? <img src={driver.photo} alt="" className="w-full h-full object-cover" /> : driver?.name?.[0] || "D"}
            </div>
            <div><p className="font-bold">{driver?.name}</p><p className="text-xs text-gray-400">{brandName}</p></div>
          </div>
          {sideItems.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl mb-0.5 transition-all ${activeTab === item.id ? "bg-blue-600/20 text-blue-400" : "text-gray-400 hover:bg-white/5"}`}>
              <item.icon className="h-5 w-5" /><span>{item.label}</span>
            </button>
          ))}
          <div className="mt-auto pt-4">
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all">
              <LogOut className="h-5 w-5" /><span>Logout</span>
            </button>
          </div>
        </div>

        <div className="flex-1 lg:ml-64 p-4 lg:p-8 max-w-5xl mx-auto w-full">

          {activeTab === "home" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold">Welcome, {driver?.name}</h2>
                  <p className="text-gray-400">Today is {DAYS[new Date().getDay()]}, {new Date().toLocaleDateString()}</p>
                </div>
                <button onClick={() => toggleDutyMutation.mutate(!driver?.onDuty)}
                  className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-bold text-lg transition-all transform hover:scale-105 ${driver?.onDuty ? "bg-green-600 hover:bg-green-500 shadow-lg shadow-green-500/30" : "bg-red-600 hover:bg-red-500 shadow-lg shadow-red-500/30"}`}
                  data-testid="button-toggle-duty">
                  {driver?.onDuty ? <Power className="h-6 w-6" /> : <PowerOff className="h-6 w-6" />}
                  {driver?.onDuty ? "ON DUTY" : "OFF DUTY"}
                </button>
              </div>

              <h3 className="text-lg font-semibold text-gray-300">Earnings</h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard label="Today" value={sumByPeriod(earnings, "today")} icon={PoundSterling} color="from-blue-600/20 to-blue-800/20" prefix={curr} />
                <StatCard label="Yesterday" value={sumByPeriod(earnings, "yesterday")} icon={PoundSterling} color="from-cyan-600/20 to-cyan-800/20" prefix={curr} />
                <StatCard label="Last 7 Days" value={sumByPeriod(earnings, "week")} icon={TrendingUp} color="from-purple-600/20 to-purple-800/20" prefix={curr} />
                <StatCard label="Last 12 Months" value={sumByPeriod(earnings, "year")} icon={TrendingUp} color="from-emerald-600/20 to-emerald-800/20" prefix={curr} />
              </div>

              <h3 className="text-lg font-semibold text-gray-300">Rides</h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard label="Today" value={countByPeriod(completedRides, "today")} icon={Car} color="from-green-600/20 to-green-800/20" />
                <StatCard label="Yesterday" value={countByPeriod(completedRides, "yesterday")} icon={Car} color="from-teal-600/20 to-teal-800/20" />
                <StatCard label="Last 7 Days" value={countByPeriod(completedRides, "week")} icon={Navigation} color="from-indigo-600/20 to-indigo-800/20" />
                <StatCard label="Last 12 Months" value={countByPeriod(completedRides, "year")} icon={Navigation} color="from-violet-600/20 to-violet-800/20" />
              </div>

              <h3 className="text-lg font-semibold text-gray-300">Fuel Costs</h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard label="Today" value={sumByPeriod(fuelLogs, "today")} icon={Fuel} color="from-orange-600/20 to-orange-800/20" prefix={curr} />
                <StatCard label="Yesterday" value={sumByPeriod(fuelLogs, "yesterday")} icon={Fuel} color="from-amber-600/20 to-amber-800/20" prefix={curr} />
                <StatCard label="Last 7 Days" value={sumByPeriod(fuelLogs, "week")} icon={Fuel} color="from-red-600/20 to-red-800/20" prefix={curr} />
                <StatCard label="Last 12 Months" value={sumByPeriod(fuelLogs, "year")} icon={Fuel} color="from-rose-600/20 to-rose-800/20" prefix={curr} />
              </div>

              <h3 className="text-lg font-semibold text-gray-300">Expenses (Food & Drink)</h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard label="Today" value={sumByPeriod(expenses, "today")} icon={UtensilsCrossed} color="from-pink-600/20 to-pink-800/20" prefix={curr} />
                <StatCard label="Yesterday" value={sumByPeriod(expenses, "yesterday")} icon={Coffee} color="from-fuchsia-600/20 to-fuchsia-800/20" prefix={curr} />
                <StatCard label="Last 7 Days" value={sumByPeriod(expenses, "week")} icon={UtensilsCrossed} color="from-yellow-600/20 to-yellow-800/20" prefix={curr} />
                <StatCard label="Last 12 Months" value={sumByPeriod(expenses, "year")} icon={Receipt} color="from-lime-600/20 to-lime-800/20" prefix={curr} />
              </div>

              {activeRide && (
                <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 border border-blue-500/30 rounded-2xl p-6">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Navigation className="h-6 w-6 text-blue-400" /> Active Ride</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-white/5 rounded-xl p-4"><p className="text-xs text-gray-400 mb-1">Pickup</p><p className="font-medium">{activeRide.pickupAddress}</p></div>
                    <div className="bg-white/5 rounded-xl p-4"><p className="text-xs text-gray-400 mb-1">Drop-off</p><p className="font-medium">{activeRide.dropoffAddress}</p></div>
                  </div>
                  <div className="flex items-center gap-4 mb-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${activeRide.status === "accepted" ? "bg-yellow-500/20 text-yellow-400" : activeRide.status === "driver_arriving" ? "bg-blue-500/20 text-blue-400" : activeRide.status === "otp_verified" ? "bg-green-500/20 text-green-400" : "bg-purple-500/20 text-purple-400"}`}>
                      {activeRide.status.replace(/_/g, " ").toUpperCase()}
                    </span>
                    <span className="text-yellow-400 font-bold text-lg">{curr}{parseFloat(activeRide.estimatedPrice || "0").toFixed(2)}</span>
                  </div>
                  {activeRide.status === "accepted" && (
                    <button onClick={() => updateRideMutation.mutate({ rideId: activeRide.id, data: { status: "driver_arriving" } })} className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold transition-all" data-testid="button-arriving">I'm On My Way</button>
                  )}
                  {activeRide.status === "driver_arriving" && !activeRide.otpVerified && (
                    <div className="space-y-3">
                      <p className="text-sm text-gray-400">Enter customer's OTP to start the ride:</p>
                      <div className="flex gap-3">
                        <input type="text" value={otpInput} onChange={(e) => setOtpInput(e.target.value)} placeholder="Enter 4-digit OTP" className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500" maxLength={4} data-testid="input-otp" />
                        <button onClick={() => verifyOtpMutation.mutate({ rideId: activeRide.id, otp: otpInput })} className="px-6 py-3 bg-green-600 hover:bg-green-500 rounded-xl font-bold transition-all" data-testid="button-verify-otp">Verify</button>
                      </div>
                    </div>
                  )}
                  {activeRide.status === "otp_verified" && (
                    <button onClick={() => updateRideMutation.mutate({ rideId: activeRide.id, data: { status: "in_progress" } })} className="w-full py-3 bg-purple-600 hover:bg-purple-500 rounded-xl font-bold transition-all" data-testid="button-start-ride">Start Ride</button>
                  )}
                  {activeRide.status === "in_progress" && (
                    <button onClick={() => updateRideMutation.mutate({ rideId: activeRide.id, data: { status: "completed", finalPrice: activeRide.estimatedPrice, paymentStatus: "captured" } })} className="w-full py-3 bg-green-600 hover:bg-green-500 rounded-xl font-bold transition-all" data-testid="button-complete-ride">Complete Ride</button>
                  )}
                </div>
              )}

              {!activeRide && driver?.onDuty && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
                  <Navigation className="h-16 w-16 text-blue-400 mx-auto mb-4 animate-pulse" />
                  <h3 className="text-xl font-bold mb-2">Waiting for Rides</h3>
                  <p className="text-gray-400">You'll receive a notification when a customer requests a ride</p>
                </div>
              )}
              {!driver?.onDuty && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
                  <PowerOff className="h-16 w-16 text-red-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">You're Off Duty</h3>
                  <p className="text-gray-400">Go on duty to start receiving ride requests</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "earnings" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Earnings Overview</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Today" value={sumByPeriod(earnings, "today")} icon={PoundSterling} color="from-blue-600/20 to-blue-800/20" prefix={curr} />
                <StatCard label="Yesterday" value={sumByPeriod(earnings, "yesterday")} icon={PoundSterling} color="from-cyan-600/20 to-cyan-800/20" prefix={curr} />
                <StatCard label="Last 7 Days" value={sumByPeriod(earnings, "week")} icon={TrendingUp} color="from-purple-600/20 to-purple-800/20" prefix={curr} />
                <StatCard label="Last 12 Months" value={sumByPeriod(earnings, "year")} icon={TrendingUp} color="from-emerald-600/20 to-emerald-800/20" prefix={curr} />
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="font-bold text-lg mb-4">VAT Breakdown (20%)</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white/5 rounded-xl p-4 text-center">
                    <p className="text-xs text-gray-400">Gross Earnings (12m)</p>
                    <p className="text-xl font-bold text-green-400">{curr}{sumByPeriod(earnings, "year").toFixed(2)}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 text-center">
                    <p className="text-xs text-gray-400">VAT 20%</p>
                    <p className="text-xl font-bold text-red-400">{curr}{(sumByPeriod(earnings, "year") * 0.2).toFixed(2)}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 text-center">
                    <p className="text-xs text-gray-400">Net After VAT</p>
                    <p className="text-xl font-bold text-blue-400">{curr}{(sumByPeriod(earnings, "year") * 0.8).toFixed(2)}</p>
                  </div>
                </div>
              </div>
              <h3 className="font-bold text-lg">Recent Earnings</h3>
              <div className="space-y-2">
                {earnings.slice(0, 20).map((e: any) => (
                  <div key={e.id} className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{curr}{parseFloat(e.amount).toFixed(2)}</p>
                      <p className="text-xs text-gray-400">{new Date(e.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="text-right text-xs">
                      <p className="text-gray-400">VAT: {curr}{parseFloat(e.vatAmount || "0").toFixed(2)}</p>
                      <p className="text-green-400">Net: {curr}{parseFloat(e.netAmount || "0").toFixed(2)}</p>
                    </div>
                  </div>
                ))}
                {earnings.length === 0 && <p className="text-center text-gray-500 py-8">No earnings recorded yet</p>}
              </div>
            </div>
          )}

          {activeTab === "rides" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Ride History</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Today" value={countByPeriod(completedRides, "today")} icon={Car} color="from-green-600/20 to-green-800/20" />
                <StatCard label="Yesterday" value={countByPeriod(completedRides, "yesterday")} icon={Car} color="from-teal-600/20 to-teal-800/20" />
                <StatCard label="Last 7 Days" value={countByPeriod(completedRides, "week")} icon={Navigation} color="from-indigo-600/20 to-indigo-800/20" />
                <StatCard label="Last 12 Months" value={countByPeriod(completedRides, "year")} icon={Navigation} color="from-violet-600/20 to-violet-800/20" />
              </div>
              <div className="space-y-2">
                {rides.map((ride: any) => (
                  <div key={ride.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${ride.status === "completed" ? "bg-green-500/20 text-green-400" : ride.status === "cancelled" ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400"}`}>{ride.status?.replace(/_/g, " ").toUpperCase()}</span>
                      <span className="text-xs text-gray-500">{new Date(ride.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <p><span className="text-gray-400">From:</span> {ride.pickupAddress || "N/A"}</p>
                      <p><span className="text-gray-400">To:</span> {ride.dropoffAddress || "N/A"}</p>
                      <p><span className="text-gray-400">Fare:</span> {curr}{ride.finalPrice || ride.estimatedPrice || "0"}</p>
                      <p><span className="text-gray-400">Payment:</span> {ride.paymentMethod}</p>
                    </div>
                  </div>
                ))}
                {rides.length === 0 && <p className="text-center text-gray-500 py-8">No rides yet</p>}
              </div>
            </div>
          )}

          {activeTab === "fuel" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold flex items-center gap-2"><Fuel className="h-7 w-7 text-orange-400" /> Petrol / Diesel Log</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Today" value={sumByPeriod(fuelLogs, "today")} icon={Fuel} color="from-orange-600/20 to-orange-800/20" prefix={curr} />
                <StatCard label="Yesterday" value={sumByPeriod(fuelLogs, "yesterday")} icon={Fuel} color="from-amber-600/20 to-amber-800/20" prefix={curr} />
                <StatCard label="Last 7 Days" value={sumByPeriod(fuelLogs, "week")} icon={Fuel} color="from-red-600/20 to-red-800/20" prefix={curr} />
                <StatCard label="Last 12 Months" value={sumByPeriod(fuelLogs, "year")} icon={Fuel} color="from-rose-600/20 to-rose-800/20" prefix={curr} />
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="font-bold mb-4">Add Fuel Entry</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs text-gray-400">Type</label>
                    <select value={fuelForm.fuelType} onChange={e => setFuelForm(p => ({ ...p, fuelType: e.target.value }))} className="w-full mt-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white">
                      <option value="petrol">Petrol</option><option value="diesel">Diesel</option><option value="electric">Electric</option><option value="lpg">LPG</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Amount ({curr})</label>
                    <input type="number" step="0.01" value={fuelForm.amount} onChange={e => setFuelForm(p => ({ ...p, amount: e.target.value }))} placeholder="0.00" className="w-full mt-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Litres</label>
                    <input type="number" step="0.01" value={fuelForm.litres} onChange={e => setFuelForm(p => ({ ...p, litres: e.target.value }))} placeholder="0.00" className="w-full mt-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white" />
                  </div>
                  <div className="flex items-end">
                    <button onClick={() => { if (fuelForm.amount) { addFuelMutation.mutate({ fuelType: fuelForm.fuelType, amount: fuelForm.amount, litres: fuelForm.litres || null, notes: fuelForm.notes, date: new Date() }); setFuelForm(p => ({ ...p, amount: "", litres: "", notes: "" })); } }}
                      className="w-full py-2 bg-orange-600 hover:bg-orange-500 rounded-lg font-bold transition-all flex items-center justify-center gap-2">
                      <Plus className="h-4 w-4" /> Add
                    </button>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                {fuelLogs.map((log: any) => (
                  <div key={log.id} className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Fuel className="h-5 w-5 text-orange-400" />
                      <div>
                        <p className="font-medium">{curr}{parseFloat(log.amount).toFixed(2)} <span className="text-xs text-gray-400">({log.fuelType})</span></p>
                        <p className="text-xs text-gray-500">{new Date(log.date).toLocaleDateString()} {log.litres ? `• ${log.litres}L` : ""}</p>
                      </div>
                    </div>
                    <button onClick={() => deleteFuelMutation.mutate(log.id)} className="text-red-400 hover:text-red-300 p-1"><Trash2 className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "expenses" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold flex items-center gap-2"><UtensilsCrossed className="h-7 w-7 text-pink-400" /> Daily Expenses</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Today" value={sumByPeriod(expenses, "today")} icon={UtensilsCrossed} color="from-pink-600/20 to-pink-800/20" prefix={curr} />
                <StatCard label="Yesterday" value={sumByPeriod(expenses, "yesterday")} icon={Coffee} color="from-fuchsia-600/20 to-fuchsia-800/20" prefix={curr} />
                <StatCard label="Last 7 Days" value={sumByPeriod(expenses, "week")} icon={UtensilsCrossed} color="from-yellow-600/20 to-yellow-800/20" prefix={curr} />
                <StatCard label="Last 12 Months" value={sumByPeriod(expenses, "year")} icon={Receipt} color="from-lime-600/20 to-lime-800/20" prefix={curr} />
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="font-bold mb-4">Add Expense</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                  {EXPENSE_CATEGORIES.map(cat => (
                    <button key={cat.value} onClick={() => setExpenseForm(p => ({ ...p, category: cat.value }))}
                      className={`p-3 rounded-xl border text-sm font-medium transition-all flex items-center gap-2 ${expenseForm.category === cat.value ? "bg-pink-600/20 border-pink-500/50 text-pink-400" : "bg-white/5 border-white/10 text-gray-400 hover:border-white/30"}`}>
                      <span className="text-lg">{cat.icon}</span> {cat.label}
                    </button>
                  ))}
                </div>
                <div className="flex gap-3">
                  <input type="number" step="0.01" value={expenseForm.amount} onChange={e => setExpenseForm(p => ({ ...p, amount: e.target.value }))} placeholder={`Amount (${curr})`} className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white" />
                  <input type="text" value={expenseForm.notes} onChange={e => setExpenseForm(p => ({ ...p, notes: e.target.value }))} placeholder="Notes (optional)" className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white" />
                  <button onClick={() => { if (expenseForm.amount) { addExpenseMutation.mutate({ category: expenseForm.category, amount: expenseForm.amount, notes: expenseForm.notes, date: new Date() }); setExpenseForm(p => ({ ...p, amount: "", notes: "" })); } }}
                    className="px-6 py-2 bg-pink-600 hover:bg-pink-500 rounded-lg font-bold transition-all flex items-center gap-2"><Plus className="h-4 w-4" /> Add</button>
                </div>
              </div>
              <div className="space-y-2">
                {expenses.map((exp: any) => {
                  const cat = EXPENSE_CATEGORIES.find(c => c.value === exp.category);
                  return (
                    <div key={exp.id} className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{cat?.icon || "📦"}</span>
                        <div>
                          <p className="font-medium">{curr}{parseFloat(exp.amount).toFixed(2)} <span className="text-xs text-gray-400">({cat?.label || exp.category})</span></p>
                          <p className="text-xs text-gray-500">{new Date(exp.date).toLocaleDateString()} {exp.notes ? `• ${exp.notes}` : ""}</p>
                        </div>
                      </div>
                      <button onClick={() => deleteExpenseMutation.mutate(exp.id)} className="text-red-400 hover:text-red-300 p-1"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === "work-hours" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold flex items-center gap-2"><Timer className="h-7 w-7 text-cyan-400" /> Work Hours</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Today Hours" value={totalHours.today.toFixed(1) + "h"} icon={Clock} color="from-cyan-600/20 to-cyan-800/20" />
                <StatCard label="Yesterday Hours" value={totalHours.yesterday.toFixed(1) + "h"} icon={Clock} color="from-sky-600/20 to-sky-800/20" />
                <StatCard label="Last 7 Days" value={totalHours.week.toFixed(1) + "h"} icon={Timer} color="from-blue-600/20 to-blue-800/20" />
                <StatCard label="Last 12 Months" value={totalHours.year.toFixed(1) + "h"} icon={Timer} color="from-indigo-600/20 to-indigo-800/20" />
              </div>

              <h3 className="text-lg font-semibold text-gray-300">Days Not Worked</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-red-600/20 to-red-800/20 border border-white/10 rounded-2xl p-4 text-center">
                  <Ban className="h-6 w-6 mx-auto mb-2 text-red-400" />
                  <p className="text-2xl font-bold">{daysNotWorked.week}</p>
                  <p className="text-xs text-gray-400">This Week (of 7)</p>
                </div>
                <div className="bg-gradient-to-br from-orange-600/20 to-orange-800/20 border border-white/10 rounded-2xl p-4 text-center">
                  <Ban className="h-6 w-6 mx-auto mb-2 text-orange-400" />
                  <p className="text-2xl font-bold">{daysNotWorked.month}</p>
                  <p className="text-xs text-gray-400">Last 30 Days</p>
                </div>
                <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-800/20 border border-white/10 rounded-2xl p-4 text-center">
                  <Ban className="h-6 w-6 mx-auto mb-2 text-yellow-400" />
                  <p className="text-2xl font-bold">{daysNotWorked.year}</p>
                  <p className="text-xs text-gray-400">Last 12 Months</p>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="font-bold mb-4">Log Work Hours</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs text-gray-400">Start Time</label>
                    <input type="time" value={workForm.startTime} onChange={e => setWorkForm(p => ({ ...p, startTime: e.target.value }))} className="w-full mt-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">End Time</label>
                    <input type="time" value={workForm.endTime} onChange={e => setWorkForm(p => ({ ...p, endTime: e.target.value }))} className="w-full mt-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Shift Type</label>
                    <select value={workForm.shiftType} onChange={e => setWorkForm(p => ({ ...p, shiftType: e.target.value }))} className="w-full mt-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white">
                      <option value="8">8 Hours</option><option value="12">12 Hours</option><option value="custom">Custom</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button onClick={() => {
                      if (workForm.startTime && workForm.endTime) {
                        const now = new Date();
                        const [sh, sm] = workForm.startTime.split(":").map(Number);
                        const [eh, em] = workForm.endTime.split(":").map(Number);
                        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), sh, sm);
                        const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), eh, em);
                        let hrs = (end.getTime() - start.getTime()) / 3600000;
                        if (hrs < 0) hrs += 24;
                        addWorkLogMutation.mutate({ startTime: start.toISOString(), endTime: end.toISOString(), hoursWorked: hrs.toFixed(2), shiftType: workForm.shiftType, date: now.toISOString() });
                        setWorkForm({ startTime: "", endTime: "", shiftType: "8" });
                      }
                    }} className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg font-bold transition-all flex items-center justify-center gap-2">
                      <Plus className="h-4 w-4" /> Log
                    </button>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                {workLogs.map((log: any) => (
                  <div key={log.id} className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Timer className="h-5 w-5 text-cyan-400" />
                      <div>
                        <p className="font-medium">{parseFloat(log.hoursWorked || "0").toFixed(1)} hours <span className="text-xs text-gray-400">({log.shiftType}h shift)</span></p>
                        <p className="text-xs text-gray-500">{new Date(log.date).toLocaleDateString()} • {log.startTime ? new Date(log.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""} - {log.endTime ? new Date(log.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "ongoing"}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "commission" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold flex items-center gap-2"><Wallet className="h-7 w-7 text-emerald-400" /> Commission & Payment</h2>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="font-bold text-lg mb-4">Payment Agreement with {brandName}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-xs text-gray-400">Agreement Type</p>
                    <p className="text-lg font-bold text-emerald-400">{driver?.paymentAgreement === "commission" ? "Commission Based" : driver?.paymentAgreement === "fixed_weekly" ? "Fixed Weekly" : driver?.paymentAgreement === "fixed_monthly" ? "Fixed Monthly" : driver?.paymentAgreement === "commission_plus_fixed" ? "Commission + Fixed" : driver?.paymentAgreement === "per_ride" ? "Per Ride" : driver?.paymentAgreement || "Commission"}</p>
                  </div>
                  {(driver?.paymentAgreement === "commission" || driver?.paymentAgreement === "commission_plus_fixed") && (
                    <div className="bg-white/5 rounded-xl p-4">
                      <p className="text-xs text-gray-400">Commission Rate</p>
                      <p className="text-lg font-bold text-yellow-400">{driver?.commissionPercent || "10"}%</p>
                    </div>
                  )}
                  {(driver?.paymentAgreement === "fixed_weekly" || driver?.paymentAgreement === "fixed_monthly" || driver?.paymentAgreement === "commission_plus_fixed") && (
                    <div className="bg-white/5 rounded-xl p-4">
                      <p className="text-xs text-gray-400">Fixed Salary</p>
                      <p className="text-lg font-bold text-blue-400">{curr}{driver?.fixedSalary || "0"} / {driver?.salaryPeriod || "week"}</p>
                    </div>
                  )}
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-xs text-gray-400">Payment Method</p>
                    <p className="text-lg font-bold text-purple-400">{driver?.paymentMethod === "jazzcash" ? "JazzCash" : driver?.paymentMethod === "easypaisa" ? "EasyPaisa" : driver?.paymentMethod === "hbl" ? "HBL" : driver?.paymentMethod === "stripe" ? "Stripe" : driver?.paymentMethod === "bank_transfer" ? "Bank Transfer" : driver?.paymentMethod === "upi" ? "UPI" : driver?.paymentMethod === "paypal" ? "PayPal" : "Cash"}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-xs text-gray-400">Currency</p>
                    <p className="text-lg font-bold">{curr} ({driver?.currency || "GBP"})</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-red-900/20 to-red-950/20 border border-red-500/20 rounded-2xl p-6">
                <h3 className="font-bold text-lg mb-4 text-red-400">Commission Paid to Brand Owner</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {["today", "yesterday", "week", "year"].map(period => {
                    const periodEarnings = sumByPeriod(earnings, period);
                    const pct = parseFloat(driver?.commissionPercent || "10");
                    const comm = (driver?.paymentAgreement === "commission" || driver?.paymentAgreement === "commission_plus_fixed") ? (periodEarnings * pct) / 100 : 0;
                    return (
                      <div key={period} className="bg-white/5 rounded-xl p-4 text-center">
                        <p className="text-xs text-gray-400">{period === "today" ? "Today" : period === "yesterday" ? "Yesterday" : period === "week" ? "Last 7 Days" : "12 Months"}</p>
                        <p className="text-xl font-bold text-red-400">{curr}{comm.toFixed(2)}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="font-bold text-lg mb-4">Your Payment Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-xs text-gray-400">Legal Full Name</p>
                    <p className="font-bold">{driver?.name || "Not set"}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-xs text-gray-400">Phone</p>
                    <p className="font-bold">{driver?.phone || "Not set"}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-xs text-gray-400">Company</p>
                    <p className="font-bold">{driver?.companyName || "Self Employed"}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-xs text-gray-400">Employment Type</p>
                    <p className="font-bold">{driver?.employmentType === "self_employed" ? "Self Employed" : driver?.employmentType === "company" ? "Company" : driver?.employmentType || "Self Employed"}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><QrCode className="h-5 w-5" /> Customer Payment QR Code</h3>
                <p className="text-sm text-gray-400 mb-4">Customers can scan this to pay you directly</p>
                <div className="bg-white rounded-2xl p-6 inline-block">
                  <div className="w-48 h-48 bg-gray-100 flex items-center justify-center rounded-xl border-2 border-dashed border-gray-300">
                    <div className="text-center">
                      <QrCode className="h-16 w-16 text-gray-800 mx-auto mb-2" />
                      <p className="text-xs text-gray-600 font-medium">{driver?.name}</p>
                      <p className="text-[10px] text-gray-400">{driver?.phone}</p>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-3">QR code generated automatically by your brand admin</p>
              </div>
            </div>
          )}

          {activeTab === "pricing" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Pricing Setup</h2>
                <button onClick={() => editingPricing ? handleSavePricing() : setEditingPricing(true)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${editingPricing ? "bg-green-600 hover:bg-green-500" : "bg-blue-600 hover:bg-blue-500"}`} data-testid="button-edit-pricing">
                  {editingPricing ? <><Save className="h-4 w-4" /> Save All</> : <><Edit2 className="h-4 w-4" /> Edit Pricing</>}
                </button>
              </div>
              <p className="text-gray-400">Set your prices for each day. Customers will see these before booking.</p>
              <div className="space-y-3">
                {DAYS.map((day, idx) => {
                  const p = pricingForm[idx] || {};
                  return (
                    <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                      <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-blue-400" /> {day}
                        {idx === new Date().getDay() && <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">Today</span>}
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          { key: "pricePerMile", label: `${curr} per Mile`, def: "2.00", color: "text-yellow-400" },
                          { key: "minimumFare", label: "Min Fare", def: "6.00", color: "text-green-400" },
                          { key: "waitingChargePerMin", label: `${curr} Wait/min`, def: "0.30", color: "text-orange-400" },
                          { key: "chargePerExtraStop", label: `${curr} Extra Stop`, def: "2.00", color: "text-red-400" },
                        ].map(field => (
                          <div key={field.key}>
                            <label className="text-xs text-gray-400">{field.label}</label>
                            {editingPricing ? (
                              <input type="number" step="0.01" value={p[field.key] || ""} onChange={e => setPricingForm(prev => ({ ...prev, [idx]: { ...prev[idx], [field.key]: e.target.value } }))} className="w-full mt-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white" />
                            ) : (
                              <p className={`text-lg font-bold ${field.color}`}>{curr}{p[field.key] || field.def}</p>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div>
                          <label className="text-xs text-gray-400">Free Waiting (mins)</label>
                          {editingPricing ? (
                            <input type="number" value={p.freeWaitingMins ?? 5} onChange={e => setPricingForm(prev => ({ ...prev, [idx]: { ...prev[idx], freeWaitingMins: parseInt(e.target.value) } }))} className="w-full mt-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white" />
                          ) : <p className="text-lg font-bold text-cyan-400">{p.freeWaitingMins ?? 5} mins</p>}
                        </div>
                        <div>
                          <label className="text-xs text-gray-400">Free Stops</label>
                          {editingPricing ? (
                            <input type="number" value={p.freeStops ?? 0} onChange={e => setPricingForm(prev => ({ ...prev, [idx]: { ...prev[idx], freeStops: parseInt(e.target.value) } }))} className="w-full mt-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white" />
                          ) : <p className="text-lg font-bold text-purple-400">{p.freeStops ?? 0} stops</p>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === "profile" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">My Profile</h2>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-20 h-24 rounded-xl bg-white/10 flex items-center justify-center overflow-hidden">
                    {driver?.photo ? <img src={driver.photo} alt="" className="w-full h-full object-cover" /> : <User className="h-10 w-10 text-gray-400" />}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{driver?.name}</h3>
                    <p className="text-gray-400">{driver?.phone}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${driver?.status === "active" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>{driver?.status}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {[
                    { label: "Email", value: driver?.email },
                    { label: "WhatsApp", value: driver?.whatsapp },
                    { label: "Emergency", value: driver?.emergencyPhone },
                    { label: "Address", value: driver?.address },
                    { label: "Country", value: driver?.country },
                    { label: "Employment", value: driver?.employmentType?.replace(/_/g, " ") },
                    { label: "Company", value: driver?.companyName },
                    { label: "Licence No.", value: driver?.drivingLicenceNumber },
                    { label: "Vehicle", value: driver?.vehicleType?.replace(/_/g, " ") },
                    { label: "Category", value: driver?.vehicleCategory?.replace(/_/g, " ") },
                    { label: "Seats", value: driver?.seatCount },
                    { label: "Fuel Type", value: driver?.fuelType },
                    { label: "Car Model", value: `${driver?.carModel || ""} ${driver?.carColor || ""}`.trim() },
                    { label: "Number Plate", value: driver?.numberPlate },
                    { label: "Service Radius", value: `${driver?.serviceRadiusMiles} miles` },
                    { label: "Hours/Week", value: driver?.weeklyHoursAllowed },
                  ].map((item, i) => (
                    <div key={i} className="bg-white/5 rounded-xl p-3">
                      <p className="text-xs text-gray-400">{item.label}</p>
                      <p className="font-medium">{item.value || "Not set"}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex gap-3 flex-wrap">
                  {driver?.drivingLicenceImage && <a href={driver.drivingLicenceImage} target="_blank" className="text-sm text-blue-400 underline flex items-center gap-1"><FileText className="h-4 w-4" /> Licence</a>}
                  {driver?.visaImage && <a href={driver.visaImage} target="_blank" className="text-sm text-blue-400 underline flex items-center gap-1"><FileText className="h-4 w-4" /> Visa</a>}
                  {driver?.insuranceImage && <a href={driver.insuranceImage} target="_blank" className="text-sm text-blue-400 underline flex items-center gap-1"><Shield className="h-4 w-4" /> Insurance</a>}
                  {driver?.carImage && <a href={driver.carImage} target="_blank" className="text-sm text-blue-400 underline flex items-center gap-1"><Car className="h-4 w-4" /> Car Photo</a>}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}