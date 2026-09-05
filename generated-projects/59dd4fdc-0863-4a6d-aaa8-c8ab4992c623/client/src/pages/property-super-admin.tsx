import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Building2, Home, Users, FileText, CreditCard, Settings, LogOut,
  ChevronDown, ChevronRight, Bell, Search, Moon, Sun, Volume2, VolumeX,
  BarChart3, TrendingUp, DollarSign, Eye, Clock, CheckCircle, XCircle,
  Plus, Edit, Trash2, Filter, Download, Upload, MapPin, Bed, Bath,
  Crown, Shield, UserCog, Activity, Calendar, ArrowUpRight, ArrowDownRight,
  Building, Landmark, PieChart, Package, Star, Heart, MessageSquare,
  ChevronLeft, MoreVertical, RefreshCw, Maximize2, HelpCircle, Layers,
  Copy, ExternalLink, Globe, Sparkles, X, Palette
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogOverlay,
} from "@/components/ui/dialog";

interface PropertyBranch {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  logoUrl: string | null;
  loginUsername: string | null;
  loginPassword: string | null;
  // Currency & Status
  currency: string;
  isOpen: boolean;
  googleMapsUrl: string | null;
  // Stripe
  stripeAccountId: string | null;
  stripePublishableKey: string | null;
  stripeSecretKey: string | null;
  // Mobile payments
  jazzCashEnabled: boolean;
  jazzCashNumber: string | null;
  easyPaisaEnabled: boolean;
  easyPaisaNumber: string | null;
  hblBankEnabled: boolean;
  hblAccountNumber: string | null;
  hblAccountTitle: string | null;
  cashOnDeliveryEnabled: boolean;
  // Alternative card readers
  sumupApiKey: string | null;
  sumupMerchantCode: string | null;
  squareAccessToken: string | null;
  squareLocationId: string | null;
  zettleApiKey: string | null;
  zettleMerchantId: string | null;
  // Fees
  commissionRate: string;
  visitCharges: string;
  monthlyFee: string | null;
  agreedPrice: string | null;
  // Web address
  useDefaultUrl: boolean;
  subdomain: string | null;
  customDomain: string | null;
  // Colors
  primaryColor: string;
  secondaryColor: string;
  isActive: boolean;
  createdAt: string;
  themeConfig?: any;
}

const sidebarItems = [
  { icon: Layers, label: "Branches", id: "branches" },
  { icon: BarChart3, label: "Dashboard", id: "dashboard" },
  { icon: Building2, label: "Properties", id: "properties" },
  { icon: Users, label: "Users & Agents", id: "users" },
  { icon: CreditCard, label: "Payments", id: "payments" },
  { icon: Palette, label: "Theme Customization", id: "theme" },
  { icon: Settings, label: "Settings", id: "settings" },
];

function AnimatedGlobe() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <div className="absolute inset-0 bg-gradient-to-br from-[#020617] via-[#0a1628] to-[#000814]" />
      
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0"
        >
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute top-1/2 left-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent"
              style={{ transform: `translate(-50%, -50%) rotate(${i * 22.5}deg)` }}
            />
          ))}
        </motion.div>
        
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
          className="absolute inset-[10%] rounded-full border border-cyan-500/10"
        />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
          className="absolute inset-[20%] rounded-full border border-blue-500/10"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
          className="absolute inset-[30%] rounded-full border border-cyan-400/10"
        />
        
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute inset-[35%] rounded-full bg-gradient-to-br from-cyan-500/10 via-blue-600/10 to-purple-600/10 blur-xl"
        />
        
        <div className="absolute inset-[38%] rounded-full overflow-hidden">
          <motion.div
            animate={{ backgroundPosition: ["0% 0%", "100% 100%"] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 opacity-30"
            style={{
              background: "radial-gradient(circle at 30% 30%, rgba(6, 182, 212, 0.4), transparent 50%), radial-gradient(circle at 70% 70%, rgba(59, 130, 246, 0.4), transparent 50%)",
              backgroundSize: "200% 200%",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/20 to-blue-900/30 rounded-full" />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0"
          >
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="absolute h-[2px] w-full top-1/2 left-0 bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent"
                style={{ transform: `translateY(-50%) rotate(${i * 36}deg)` }}
              />
            ))}
          </motion.div>
        </div>
      </div>
      
      {[...Array(50)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-cyan-400/60 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 3,
          }}
        />
      ))}
      
      <motion.div
        animate={{ x: ["-100%", "200%"] }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        className="absolute top-1/4 left-0 w-96 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent"
      />
      <motion.div
        animate={{ x: ["200%", "-100%"] }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear", delay: 2 }}
        className="absolute top-3/4 left-0 w-96 h-[1px] bg-gradient-to-r from-transparent via-blue-400/50 to-transparent"
      />
    </div>
  );
}

function BranchCard({ 
  branch, 
  onEdit, 
  onDuplicate, 
  onDelete,
  onView,
  onWebsite
}: { 
  branch: PropertyBranch;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onView: () => void;
  onWebsite: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.01 }}
      className="relative group"
    >
      <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-cyan-500/20 overflow-hidden">
        <div className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div 
                className="w-14 h-14 rounded-xl flex items-center justify-center shadow-lg"
                style={{ background: `linear-gradient(135deg, ${branch.primaryColor}, ${branch.secondaryColor})` }}
              >
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white">{branch.name}</h3>
                <p className="text-sm text-cyan-400/70">/{branch.slug}</p>
              </div>
            </div>
            <Badge className={branch.isActive 
              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" 
              : "bg-red-500/20 text-red-400 border-red-500/30"
            }>
              {branch.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
          
          <div className="space-y-2 mb-4">
            {branch.address && (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <MapPin className="w-4 h-4 text-cyan-400" />
                <span className="truncate">{branch.address}</span>
              </div>
            )}
            {branch.phone && (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span className="text-cyan-400">📞</span>
                <span>{branch.phone}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 text-xs">
              {branch.commissionRate}% Commission
            </Badge>
            <Badge variant="outline" className="border-blue-500/30 text-blue-400 text-xs">
              Rs. {branch.visitCharges} Visit
            </Badge>
          </div>
          
          <div className="flex flex-wrap gap-1.5 mb-4">
            {branch.jazzCashEnabled && (
              <span className="px-2 py-1 text-xs bg-red-500/20 text-red-300 rounded-full">JazzCash</span>
            )}
            {branch.easyPaisaEnabled && (
              <span className="px-2 py-1 text-xs bg-green-500/20 text-green-300 rounded-full">EasyPaisa</span>
            )}
            {branch.hblBankEnabled && (
              <span className="px-2 py-1 text-xs bg-blue-500/20 text-blue-300 rounded-full">HBL Bank</span>
            )}
            {branch.cashOnDeliveryEnabled && (
              <span className="px-2 py-1 text-xs bg-yellow-500/20 text-yellow-300 rounded-full">COD</span>
            )}
          </div>
        </div>
        
        <div className="border-t border-cyan-500/10 px-5 py-3 bg-black/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onEdit}
                className="p-2 rounded-lg hover:bg-blue-500/20 text-blue-400 transition-colors"
                title="Edit"
              >
                <Edit className="w-4 h-4" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onDuplicate}
                className="p-2 rounded-lg hover:bg-purple-500/20 text-purple-400 transition-colors"
                title="Duplicate"
              >
                <Copy className="w-4 h-4" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onDelete}
                className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              variant="outline"
              className="flex-1 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/20"
              onClick={onWebsite}
            >
              <Globe className="w-3 h-3 mr-1" /> Go to Website
            </Button>
            <Button 
              size="sm" 
              className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:opacity-90"
              onClick={onView}
            >
              <BarChart3 className="w-3 h-3 mr-1" /> Dashboard
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function PropertySuperAdmin() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("branches");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<PropertyBranch | null>(null);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    address: "",
    phone: "",
    email: "",
    loginUsername: "",
    loginPassword: "",
    logoUrl: "",
    // Currency & Status
    currency: "PKR",
    isOpen: true,
    googleMapsUrl: "",
    // Stripe
    stripeAccountId: "",
    stripePublishableKey: "",
    stripeSecretKey: "",
    // Mobile Payments
    jazzCashEnabled: false,
    jazzCashNumber: "",
    easyPaisaEnabled: false,
    easyPaisaNumber: "",
    hblBankEnabled: false,
    hblAccountNumber: "",
    hblAccountTitle: "",
    cashOnDeliveryEnabled: true,
    // Alternative Card Readers
    sumupApiKey: "",
    sumupMerchantCode: "",
    squareAccessToken: "",
    squareLocationId: "",
    zettleApiKey: "",
    zettleMerchantId: "",
    // Commission & Fees
    commissionRate: "25.00",
    visitCharges: "1000.00",
    monthlyFee: "2000.00",
    agreedPrice: "0.00",
    // Web Address
    useDefaultUrl: true,
    subdomain: "",
    customDomain: "",
    // Colors
    primaryColor: "#0ea5e9",
    secondaryColor: "#06b6d4",
  });

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("propertyLoggedIn");
    if (isLoggedIn !== "true") {
      setLocation("/property-admin-login");
    }
  }, [setLocation]);

  // Auto-sync property branches on page load
  useEffect(() => {
    const syncBranches = async () => {
      try {
        await fetch("/api/property-branches/force-sync", { method: "POST" });
        queryClient.invalidateQueries({ queryKey: ["/api/property-branches"] });
      } catch (err) {
        console.error("Auto-sync failed:", err);
      }
    };
    syncBranches();
  }, []);

  const { data: branches = [], isLoading } = useQuery<PropertyBranch[]>({
    queryKey: ["/api/property-branches"],
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch("/api/property-branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create branch");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/property-branches"] });
      setShowCreateModal(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      // Filter out empty password/secret fields to avoid overwriting
      const cleanData = { ...data };
      if (!cleanData.loginPassword) delete cleanData.loginPassword;
      if (!cleanData.stripeSecretKey) delete cleanData.stripeSecretKey;
      
      const res = await fetch(`/api/property-branches/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanData),
      });
      if (!res.ok) throw new Error("Failed to update branch");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/property-branches"] });
      setShowEditModal(false);
      setSelectedBranch(null);
      resetForm();
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/property-branches/${id}/duplicate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error("Failed to duplicate branch");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/property-branches"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/property-branches/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete branch");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/property-branches"] });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      address: "",
      phone: "",
      email: "",
      loginUsername: "",
      loginPassword: "",
      logoUrl: "",
      currency: "PKR",
      isOpen: true,
      googleMapsUrl: "",
      stripeAccountId: "",
      stripePublishableKey: "",
      stripeSecretKey: "",
      jazzCashEnabled: false,
      jazzCashNumber: "",
      easyPaisaEnabled: false,
      easyPaisaNumber: "",
      hblBankEnabled: false,
      hblAccountNumber: "",
      hblAccountTitle: "",
      cashOnDeliveryEnabled: true,
      sumupApiKey: "",
      sumupMerchantCode: "",
      squareAccessToken: "",
      squareLocationId: "",
      zettleApiKey: "",
      zettleMerchantId: "",
      commissionRate: "25.00",
      visitCharges: "1000.00",
      monthlyFee: "2000.00",
      agreedPrice: "0.00",
      useDefaultUrl: true,
      subdomain: "",
      customDomain: "",
      primaryColor: "#0ea5e9",
      secondaryColor: "#06b6d4",
    });
  };

  const handleEdit = (branch: PropertyBranch) => {
    setSelectedBranch(branch);
    setFormData({
      name: branch.name,
      slug: branch.slug,
      address: branch.address || "",
      phone: branch.phone || "",
      email: branch.email || "",
      loginUsername: branch.loginUsername || "",
      loginPassword: "",
      logoUrl: branch.logoUrl || "",
      currency: branch.currency || "PKR",
      isOpen: branch.isOpen ?? true,
      googleMapsUrl: branch.googleMapsUrl || "",
      stripeAccountId: branch.stripeAccountId || "",
      stripePublishableKey: branch.stripePublishableKey || "",
      stripeSecretKey: "",
      jazzCashEnabled: branch.jazzCashEnabled,
      jazzCashNumber: branch.jazzCashNumber || "",
      easyPaisaEnabled: branch.easyPaisaEnabled,
      easyPaisaNumber: branch.easyPaisaNumber || "",
      hblBankEnabled: branch.hblBankEnabled,
      hblAccountNumber: branch.hblAccountNumber || "",
      hblAccountTitle: branch.hblAccountTitle || "",
      cashOnDeliveryEnabled: branch.cashOnDeliveryEnabled,
      sumupApiKey: branch.sumupApiKey || "",
      sumupMerchantCode: branch.sumupMerchantCode || "",
      squareAccessToken: branch.squareAccessToken || "",
      squareLocationId: branch.squareLocationId || "",
      zettleApiKey: branch.zettleApiKey || "",
      zettleMerchantId: branch.zettleMerchantId || "",
      commissionRate: branch.commissionRate,
      visitCharges: branch.visitCharges,
      monthlyFee: branch.monthlyFee || "2000.00",
      agreedPrice: branch.agreedPrice || "0.00",
      useDefaultUrl: branch.useDefaultUrl ?? true,
      subdomain: branch.subdomain || "",
      customDomain: branch.customDomain || "",
      primaryColor: branch.primaryColor,
      secondaryColor: branch.secondaryColor,
    });
    setShowEditModal(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("propertyLoggedIn");
    localStorage.removeItem("propertyRole");
    localStorage.removeItem("propertyUsername");
    setLocation("/");
  };

  const username = localStorage.getItem("propertyUsername") || "Super Admin";

  const filteredBranches = useMemo(() => {
    if (!searchQuery) return branches;
    const query = searchQuery.toLowerCase();
    return branches.filter(b => 
      b.name.toLowerCase().includes(query) || 
      b.slug.toLowerCase().includes(query) ||
      b.address?.toLowerCase().includes(query)
    );
  }, [branches, searchQuery]);

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  return (
    <div className="min-h-screen text-white flex relative overflow-hidden">
      <AnimatedGlobe />
      
      <motion.aside
        initial={false}
        animate={{ width: sidebarCollapsed ? 80 : 280 }}
        className="fixed left-0 top-0 bottom-0 bg-gradient-to-b from-black/80 to-black/60 backdrop-blur-xl border-r border-cyan-500/20 z-50 flex flex-col"
      >
        <div className="p-4 border-b border-cyan-500/20">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-cyan-500/30"
            >
              <Globe className="w-6 h-6 text-white" />
            </motion.div>
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                >
                  <h1 className="font-bold text-lg bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                    Mujeeb Ai
                  </h1>
                  <p className="text-xs text-cyan-400/60">Super Admin Portal</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <nav className="flex-1 py-4 px-2 overflow-y-auto">
          <ul className="space-y-1">
            {sidebarItems.map((item, index) => (
              <motion.li
                key={item.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <motion.button
                  whileHover={{ x: 4 }}
                  onClick={() => {
                    setActiveTab(item.id);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 cursor-pointer w-full ${
                    activeTab === item.id
                      ? "bg-gradient-to-r from-cyan-500/20 via-blue-500/15 to-purple-500/10 border border-cyan-500/30 text-cyan-400"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <item.icon className={`w-5 h-5 flex-shrink-0 ${activeTab === item.id ? "text-cyan-400" : ""}`} />
                  <AnimatePresence>
                    {!sidebarCollapsed && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="font-medium"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {activeTab === item.id && !sidebarCollapsed && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="ml-auto w-2 h-2 rounded-full bg-cyan-400"
                    />
                  )}
                </motion.button>
              </motion.li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-cyan-500/20">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut className="w-5 h-5" />
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="font-medium"
                >
                  Logout
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </motion.aside>

      <main className={`flex-1 transition-all duration-300 relative z-10 ${sidebarCollapsed ? "ml-20" : "ml-[280px]"}`}>
        <header className="sticky top-0 z-40 bg-black/40 backdrop-blur-xl border-b border-cyan-500/20 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
              </motion.button>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  placeholder="Search branches..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-80 pl-10 bg-white/5 border-cyan-500/20 text-white placeholder:text-gray-500 rounded-xl"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="relative p-2 rounded-lg hover:bg-white/5 transition-colors text-gray-400"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-cyan-500 rounded-full" />
              </motion.button>

              <div className="h-8 w-px bg-cyan-500/20" />

              <div className="flex items-center gap-3">
                <motion.div 
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 flex items-center justify-center"
                >
                  <Crown className="w-5 h-5 text-white" />
                </motion.div>
                <div className="text-right">
                  <p className="text-xs text-cyan-400">Super Admin</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="p-6">
          {activeTab === "branches" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                    Property Branches
                  </h1>
                  <p className="text-gray-400">Manage all your property branches from one place</p>
                </div>
                <Button 
                  onClick={() => setShowCreateModal(true)}
                  className="bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 text-white hover:opacity-90 shadow-lg shadow-cyan-500/30"
                >
                  <Plus className="w-4 h-4 mr-2" /> Add New Branch
                </Button>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-64 bg-white/5 rounded-2xl animate-pulse" />
                  ))}
                </div>
              ) : filteredBranches.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-20"
                >
                  <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                    <Building2 className="w-12 h-12 text-cyan-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No Branches Yet</h3>
                  <p className="text-gray-400 mb-6">Create your first property branch to get started</p>
                  <Button 
                    onClick={() => setShowCreateModal(true)}
                    className="bg-gradient-to-r from-cyan-500 to-blue-600"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Create First Branch
                  </Button>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredBranches.map((branch) => (
                    <BranchCard
                      key={branch.id}
                      branch={branch}
                      onView={() => setLocation(`/property-branch/${branch.slug}`)}
                      onWebsite={() => setLocation(`/property/${branch.slug}`)}
                      onEdit={() => handleEdit(branch)}
                      onDuplicate={() => duplicateMutation.mutate(branch.id)}
                      onDelete={() => {
                        if (confirm(`Delete "${branch.name}"? This cannot be undone.`)) {
                          deleteMutation.mutate(branch.id);
                        }
                      }}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "dashboard" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20"
            >
              <BarChart3 className="w-16 h-16 mx-auto mb-4 text-cyan-400" />
              <h2 className="text-2xl font-bold mb-2">Dashboard Coming Soon</h2>
              <p className="text-gray-400">Analytics and insights for all branches</p>
            </motion.div>
          )}

          {activeTab === "properties" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20"
            >
              <Building2 className="w-16 h-16 mx-auto mb-4 text-cyan-400" />
              <h2 className="text-2xl font-bold mb-2">Properties Coming Soon</h2>
              <p className="text-gray-400">View all properties across branches</p>
            </motion.div>
          )}

          {activeTab === "theme" && branches && (
            <ThemeCustomizationTab branches={branches} />
          )}

          {["users", "payments", "settings"].includes(activeTab) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20"
            >
              <Sparkles className="w-16 h-16 mx-auto mb-4 text-cyan-400" />
              <h2 className="text-2xl font-bold mb-2 capitalize">{activeTab} Coming Soon</h2>
              <p className="text-gray-400">This feature is under development</p>
            </motion.div>
          )}
        </div>
      </main>

      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="bg-[#0a0a14]/95 backdrop-blur-xl border-cyan-500/30 text-white max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl shadow-cyan-500/20">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Create New Branch
            </DialogTitle>
            <button 
              onClick={() => setShowCreateModal(false)}
              className="p-1 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-300">Branch Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ 
                      ...formData, 
                      name: e.target.value,
                      slug: generateSlug(e.target.value)
                    });
                  }}
                  placeholder="Al Rehman Garden Office"
                  className="bg-white/5 border-cyan-500/30 mt-1"
                />
              </div>
              <div>
                <Label className="text-gray-300">Slug (URL) *</Label>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="al-rehman-garden"
                  className="bg-white/5 border-cyan-500/30 mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-gray-300">Address</Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Gate #4, City Center Plaza, Lahore"
                className="bg-white/5 border-cyan-500/30 mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-300">Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+923334111575"
                  className="bg-white/5 border-cyan-500/30 mt-1"
                />
              </div>
              <div>
                <Label className="text-gray-300">Email</Label>
                <Input
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="info@kingsproperty.pk"
                  className="bg-white/5 border-cyan-500/30 mt-1"
                />
              </div>
            </div>

            <div className="border-t border-cyan-500/20 pt-4">
              <h4 className="font-semibold mb-3 text-cyan-400">Login Credentials</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">Username</Label>
                  <Input
                    value={formData.loginUsername}
                    onChange={(e) => setFormData({ ...formData, loginUsername: e.target.value })}
                    placeholder="branch_admin"
                    className="bg-white/5 border-cyan-500/30 mt-1"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Password</Label>
                  <Input
                    type="password"
                    value={formData.loginPassword}
                    onChange={(e) => setFormData({ ...formData, loginPassword: e.target.value })}
                    placeholder="••••••••"
                    className="bg-white/5 border-cyan-500/30 mt-1"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-cyan-500/20 pt-4">
              <h4 className="font-semibold mb-3 text-cyan-400">Payment Methods</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={formData.jazzCashEnabled}
                      onCheckedChange={(checked) => setFormData({ ...formData, jazzCashEnabled: checked })}
                    />
                    <span className="font-medium text-red-300">JazzCash</span>
                  </div>
                  {formData.jazzCashEnabled && (
                    <Input
                      value={formData.jazzCashNumber}
                      onChange={(e) => setFormData({ ...formData, jazzCashNumber: e.target.value })}
                      placeholder="03XX-XXXXXXX"
                      className="w-40 bg-white/5 border-red-500/30"
                    />
                  )}
                </div>
                <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-xl border border-green-500/20">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={formData.easyPaisaEnabled}
                      onCheckedChange={(checked) => setFormData({ ...formData, easyPaisaEnabled: checked })}
                    />
                    <span className="font-medium text-green-300">EasyPaisa</span>
                  </div>
                  {formData.easyPaisaEnabled && (
                    <Input
                      value={formData.easyPaisaNumber}
                      onChange={(e) => setFormData({ ...formData, easyPaisaNumber: e.target.value })}
                      placeholder="03XX-XXXXXXX"
                      className="w-40 bg-white/5 border-green-500/30"
                    />
                  )}
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={formData.hblBankEnabled}
                      onCheckedChange={(checked) => setFormData({ ...formData, hblBankEnabled: checked })}
                    />
                    <span className="font-medium text-blue-300">HBL Bank</span>
                  </div>
                </div>
                {formData.hblBankEnabled && (
                  <div className="grid grid-cols-2 gap-4 pl-4">
                    <Input
                      value={formData.hblAccountNumber}
                      onChange={(e) => setFormData({ ...formData, hblAccountNumber: e.target.value })}
                      placeholder="Account Number"
                      className="bg-white/5 border-blue-500/30"
                    />
                    <Input
                      value={formData.hblAccountTitle}
                      onChange={(e) => setFormData({ ...formData, hblAccountTitle: e.target.value })}
                      placeholder="Account Title"
                      className="bg-white/5 border-blue-500/30"
                    />
                  </div>
                )}
                <div className="flex items-center gap-3 p-3 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
                  <Switch
                    checked={formData.cashOnDeliveryEnabled}
                    onCheckedChange={(checked) => setFormData({ ...formData, cashOnDeliveryEnabled: checked })}
                  />
                  <span className="font-medium text-yellow-300">Cash on Delivery</span>
                </div>
              </div>
            </div>

            {/* Open/Close & Currency */}
            <div className="border-t border-cyan-500/20 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                  <Switch
                    checked={formData.isOpen}
                    onCheckedChange={(checked) => setFormData({ ...formData, isOpen: checked })}
                  />
                  <span className="font-medium text-emerald-300">{formData.isOpen ? "Open" : "Closed"}</span>
                </div>
                <div>
                  <Label className="text-gray-300">Currency</Label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-white/5 border border-cyan-500/30 rounded-md text-white"
                  >
                    <option value="PKR">Rs. - Pakistani Rupee</option>
                    <option value="GBP">£ - British Pound</option>
                    <option value="USD">$ - US Dollar</option>
                    <option value="EUR">€ - Euro</option>
                    <option value="AED">AED - UAE Dirham</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Google Maps */}
            <div>
              <Label className="text-gray-300">Google Maps URL</Label>
              <Input
                value={formData.googleMapsUrl}
                onChange={(e) => setFormData({ ...formData, googleMapsUrl: e.target.value })}
                placeholder="https://maps.google.com/..."
                className="bg-white/5 border-cyan-500/30 mt-1"
              />
            </div>

            {/* Stripe Payment */}
            <div className="border-t border-cyan-500/20 pt-4">
              <h4 className="font-semibold mb-3 text-purple-400 flex items-center gap-2">
                <CreditCard className="w-5 h-5" /> Payment Configuration (Stripe)
              </h4>
              <p className="text-gray-500 text-sm mb-3">Enter API keys from your customer's Stripe dashboard.</p>
              <div className="space-y-3">
                <div>
                  <Label className="text-gray-300">Stripe Account ID</Label>
                  <Input
                    value={formData.stripeAccountId}
                    readOnly
                    placeholder="Auto-detected from secret key..."
                    className="bg-white/5 border-purple-500/30 mt-1 text-gray-400"
                  />
                  {formData.stripeAccountId && (
                    <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Account verified
                    </p>
                  )}
                </div>
                <div>
                  <Label className="text-gray-300">Stripe Publishable Key</Label>
                  <Input
                    value={formData.stripePublishableKey}
                    onChange={(e) => setFormData({ ...formData, stripePublishableKey: e.target.value })}
                    placeholder="pk_live_..."
                    className="bg-white/5 border-purple-500/30 mt-1"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Stripe Secret Key</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      type="password"
                      value={formData.stripeSecretKey}
                      onChange={(e) => setFormData({ ...formData, stripeSecretKey: e.target.value })}
                      placeholder="sk_live_..."
                      className="bg-white/5 border-purple-500/30 flex-1"
                    />
                    <Button
                      type="button"
                      size="sm"
                      className="bg-purple-600 hover:bg-purple-500 text-white px-4"
                      disabled={!formData.stripeSecretKey || formData.stripeSecretKey.length < 10}
                      onClick={async () => {
                        try {
                          const res = await fetch("/api/verify-stripe-key", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ stripeSecretKey: formData.stripeSecretKey }),
                          });
                          const data = await res.json();
                          if (data.valid) {
                            setFormData(prev => ({ ...prev, stripeAccountId: data.accountId }));
                            alert(`✅ Stripe Key Valid!\n\nAccount ID: ${data.accountId}\nBusiness: ${data.businessName || 'N/A'}\nCountry: ${data.country?.toUpperCase() || 'N/A'}\nCurrency: ${data.currency?.toUpperCase() || 'N/A'}\nCharges: ${data.chargesEnabled ? 'Enabled' : 'Disabled'}\nPayouts: ${data.payoutsEnabled ? 'Enabled' : 'Disabled'}`);
                          } else {
                            setFormData(prev => ({ ...prev, stripeAccountId: "" }));
                            alert(`❌ Invalid Stripe Key\n\n${data.error}`);
                          }
                        } catch (err) {
                          alert("❌ Failed to verify key. Please check the key and try again.");
                        }
                      }}
                    >
                      Verify
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Click Verify to auto-detect Account ID and validate the key</p>
                </div>
              </div>
            </div>

            {/* Commission & Fees Settings */}
            <div className="border-t border-cyan-500/20 pt-4">
              <h4 className="font-semibold mb-3 text-cyan-400">Super Admin Fees & Commission</h4>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <Label className="text-gray-300">Agreed Price with Mujeeb AI (Rs.)</Label>
                  <Input
                    type="number"
                    value={formData.agreedPrice}
                    onChange={(e) => setFormData({ ...formData, agreedPrice: e.target.value })}
                    placeholder="Price agreed when branch signed up"
                    className="bg-white/5 border-cyan-500/30 mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">The agreed subscription/partnership price</p>
                </div>
                <div>
                  <Label className="text-gray-300">Monthly Fee (Rs.)</Label>
                  <Input
                    type="number"
                    value={formData.monthlyFee}
                    onChange={(e) => setFormData({ ...formData, monthlyFee: e.target.value })}
                    className="bg-white/5 border-cyan-500/30 mt-1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-gray-300">Commission Rate (%)</Label>
                  <Input
                    type="number"
                    value={formData.commissionRate}
                    onChange={(e) => setFormData({ ...formData, commissionRate: e.target.value })}
                    className="bg-white/5 border-cyan-500/30 mt-1"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Visit Charges (Rs.)</Label>
                  <Input
                    type="number"
                    value={formData.visitCharges}
                    onChange={(e) => setFormData({ ...formData, visitCharges: e.target.value })}
                    className="bg-white/5 border-cyan-500/30 mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Alternative Card Readers */}
            <div className="border-t border-cyan-500/20 pt-4">
              <h4 className="font-semibold mb-3 text-orange-400">Alternative Card Readers (Optional)</h4>
              <p className="text-gray-500 text-sm mb-3">If the branch uses SumUp, Square, or Zettle, add their API keys here.</p>
              <div className="space-y-4">
                {/* SumUp */}
                <div className="p-3 bg-orange-500/10 rounded-xl border border-orange-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded bg-orange-500 flex items-center justify-center text-xs font-bold text-white">S</div>
                    <span className="font-medium text-orange-300">SumUp</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={formData.sumupApiKey}
                      onChange={(e) => setFormData({ ...formData, sumupApiKey: e.target.value })}
                      placeholder="API Key"
                      className="bg-white/5 border-orange-500/30"
                    />
                    <Input
                      value={formData.sumupMerchantCode}
                      onChange={(e) => setFormData({ ...formData, sumupMerchantCode: e.target.value })}
                      placeholder="Merchant Code"
                      className="bg-white/5 border-orange-500/30"
                    />
                  </div>
                </div>
                {/* Square */}
                <div className="p-3 bg-slate-500/10 rounded-xl border border-slate-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded bg-slate-500 flex items-center justify-center text-xs">▢</div>
                    <span className="font-medium text-slate-300">Square</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={formData.squareAccessToken}
                      onChange={(e) => setFormData({ ...formData, squareAccessToken: e.target.value })}
                      placeholder="Access Token"
                      className="bg-white/5 border-slate-500/30"
                    />
                    <Input
                      value={formData.squareLocationId}
                      onChange={(e) => setFormData({ ...formData, squareLocationId: e.target.value })}
                      placeholder="Location ID"
                      className="bg-white/5 border-slate-500/30"
                    />
                  </div>
                </div>
                {/* Zettle */}
                <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center text-xs font-bold text-white">Z</div>
                    <span className="font-medium text-blue-300">Zettle (PayPal)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={formData.zettleApiKey}
                      onChange={(e) => setFormData({ ...formData, zettleApiKey: e.target.value })}
                      placeholder="API Key"
                      className="bg-white/5 border-blue-500/30"
                    />
                    <Input
                      value={formData.zettleMerchantId}
                      onChange={(e) => setFormData({ ...formData, zettleMerchantId: e.target.value })}
                      placeholder="Merchant ID"
                      className="bg-white/5 border-blue-500/30"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Web Address Options */}
            <div className="border-t border-cyan-500/20 pt-4">
              <h4 className="font-semibold mb-3 text-cyan-400">Branch Web Address</h4>
              <p className="text-gray-500 text-sm mb-3">Choose how customers will access this branch's web app.</p>
              <div className="space-y-3">
                <div
                  onClick={() => setFormData({ ...formData, useDefaultUrl: true })}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${formData.useDefaultUrl ? "bg-cyan-500/20 border-cyan-500" : "bg-white/5 border-gray-600 hover:border-cyan-500/50"}`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full border-2 ${formData.useDefaultUrl ? "border-cyan-400 bg-cyan-400" : "border-gray-500"}`} />
                    <span className="font-medium">Use Default App URL</span>
                  </div>
                  <p className="text-gray-400 text-sm mt-1 ml-6">yourapp.replit.app/property/{formData.slug || "branch-name"}</p>
                </div>
                <div
                  onClick={() => setFormData({ ...formData, useDefaultUrl: false })}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${!formData.useDefaultUrl ? "bg-cyan-500/20 border-cyan-500" : "bg-white/5 border-gray-600 hover:border-cyan-500/50"}`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full border-2 ${!formData.useDefaultUrl ? "border-cyan-400 bg-cyan-400" : "border-gray-500"}`} />
                    <span className="font-medium">Custom Domain</span>
                  </div>
                  {!formData.useDefaultUrl && (
                    <Input
                      value={formData.customDomain}
                      onChange={(e) => setFormData({ ...formData, customDomain: e.target.value })}
                      placeholder="www.yourdomain.com"
                      className="bg-white/5 border-cyan-500/30 mt-2 ml-6"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Logo URL */}
            <div className="border-t border-cyan-500/20 pt-4">
              <h4 className="font-semibold mb-3 text-cyan-400">Branch Logo</h4>
              <p className="text-gray-500 text-sm mb-2">Upload your branch logo (PNG, JPG, SVG, GIF).</p>
              <Input
                value={formData.logoUrl}
                onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                placeholder="Enter logo URL or upload..."
                className="bg-white/5 border-cyan-500/30"
              />
            </div>

            {/* Theme Colors */}
            <div className="border-t border-cyan-500/20 pt-4">
              <h4 className="font-semibold mb-3 text-cyan-400">Theme Colors</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">Primary Color</Label>
                  <div className="flex gap-2 mt-1">
                    <input
                      type="color"
                      value={formData.primaryColor}
                      onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                      className="w-12 h-10 rounded cursor-pointer"
                    />
                    <Input
                      value={formData.primaryColor}
                      onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                      className="bg-white/5 border-cyan-500/30 flex-1"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-gray-300">Secondary Color</Label>
                  <div className="flex gap-2 mt-1">
                    <input
                      type="color"
                      value={formData.secondaryColor}
                      onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                      className="w-12 h-10 rounded cursor-pointer"
                    />
                    <Input
                      value={formData.secondaryColor}
                      onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                      className="bg-white/5 border-cyan-500/30 flex-1"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => createMutation.mutate(formData)}
              disabled={!formData.name || !formData.slug || createMutation.isPending}
              className="bg-gradient-to-r from-cyan-500 to-blue-600"
            >
              {createMutation.isPending ? "Creating..." : "Create Branch"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="bg-[#0a0a14]/95 backdrop-blur-xl border-cyan-500/30 text-white max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl shadow-cyan-500/20">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Edit Branch: {selectedBranch?.name}
            </DialogTitle>
            <button 
              onClick={() => setShowEditModal(false)}
              className="p-1 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-300">Branch Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-white/5 border-cyan-500/30 mt-1"
                />
              </div>
              <div>
                <Label className="text-gray-300">Slug (URL) *</Label>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="bg-white/5 border-cyan-500/30 mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-gray-300">Address</Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="bg-white/5 border-cyan-500/30 mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-300">Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="bg-white/5 border-cyan-500/30 mt-1"
                />
              </div>
              <div>
                <Label className="text-gray-300">Email</Label>
                <Input
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-white/5 border-cyan-500/30 mt-1"
                />
              </div>
            </div>

            {/* Open/Close & Currency */}
            <div className="border-t border-cyan-500/20 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                  <Switch
                    checked={formData.isOpen}
                    onCheckedChange={(checked) => setFormData({ ...formData, isOpen: checked })}
                  />
                  <span className="font-medium text-emerald-300">{formData.isOpen ? "Open" : "Closed"}</span>
                </div>
                <div>
                  <Label className="text-gray-300">Currency</Label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-white/5 border border-cyan-500/30 rounded-md text-white"
                  >
                    <option value="PKR">Rs. - Pakistani Rupee</option>
                    <option value="GBP">£ - British Pound</option>
                    <option value="USD">$ - US Dollar</option>
                    <option value="EUR">€ - Euro</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Google Maps */}
            <div>
              <Label className="text-gray-300">Google Maps URL</Label>
              <Input
                value={formData.googleMapsUrl}
                onChange={(e) => setFormData({ ...formData, googleMapsUrl: e.target.value })}
                placeholder="https://maps.google.com/..."
                className="bg-white/5 border-cyan-500/30 mt-1"
              />
            </div>

            {/* Stripe Payment */}
            <div className="border-t border-cyan-500/20 pt-4">
              <h4 className="font-semibold mb-3 text-purple-400 flex items-center gap-2">
                <CreditCard className="w-5 h-5" /> Payment Configuration (Stripe)
              </h4>
              <div className="space-y-3">
                <div>
                  <Label className="text-gray-300 text-sm">Stripe Account ID</Label>
                  <Input
                    value={formData.stripeAccountId}
                    readOnly
                    placeholder="Auto-detected from secret key..."
                    className="bg-white/5 border-purple-500/30 text-gray-400 mt-1"
                  />
                  {formData.stripeAccountId && (
                    <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Account verified
                    </p>
                  )}
                </div>
                <div>
                  <Label className="text-gray-300 text-sm">Publishable Key</Label>
                  <Input
                    value={formData.stripePublishableKey}
                    onChange={(e) => setFormData({ ...formData, stripePublishableKey: e.target.value })}
                    placeholder="pk_live_..."
                    className="bg-white/5 border-purple-500/30 mt-1"
                  />
                </div>
                <div>
                  <Label className="text-gray-300 text-sm">Secret Key</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      type="password"
                      value={formData.stripeSecretKey}
                      onChange={(e) => setFormData({ ...formData, stripeSecretKey: e.target.value })}
                      placeholder="sk_live_..."
                      className="bg-white/5 border-purple-500/30 flex-1"
                    />
                    <Button
                      type="button"
                      size="sm"
                      className="bg-purple-600 hover:bg-purple-500 text-white px-4"
                      disabled={!formData.stripeSecretKey || formData.stripeSecretKey.length < 10}
                      onClick={async () => {
                        try {
                          const res = await fetch("/api/verify-stripe-key", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ stripeSecretKey: formData.stripeSecretKey }),
                          });
                          const data = await res.json();
                          if (data.valid) {
                            setFormData(prev => ({ ...prev, stripeAccountId: data.accountId }));
                            alert(`✅ Stripe Key Valid!\n\nAccount ID: ${data.accountId}\nBusiness: ${data.businessName || 'N/A'}\nCountry: ${data.country?.toUpperCase() || 'N/A'}\nCurrency: ${data.currency?.toUpperCase() || 'N/A'}\nCharges: ${data.chargesEnabled ? 'Enabled' : 'Disabled'}\nPayouts: ${data.payoutsEnabled ? 'Enabled' : 'Disabled'}`);
                          } else {
                            setFormData(prev => ({ ...prev, stripeAccountId: "" }));
                            alert(`❌ Invalid Stripe Key\n\n${data.error}`);
                          }
                        } catch (err) {
                          alert("❌ Failed to verify key. Please check the key and try again.");
                        }
                      }}
                    >
                      Verify
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Click Verify to auto-detect Account ID and validate the key</p>
                </div>
              </div>
            </div>

            {/* Commission & Fees */}
            <div className="border-t border-cyan-500/20 pt-4">
              <h4 className="font-semibold mb-3 text-cyan-400">Super Admin Fees & Commission</h4>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <Label className="text-gray-300">Agreed Price with Mujeeb AI (Rs.)</Label>
                  <Input
                    type="number"
                    value={formData.agreedPrice}
                    onChange={(e) => setFormData({ ...formData, agreedPrice: e.target.value })}
                    placeholder="Price agreed when branch signed up"
                    className="bg-white/5 border-cyan-500/30 mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">The agreed subscription/partnership price</p>
                </div>
                <div>
                  <Label className="text-gray-300">Monthly Fee</Label>
                  <Input
                    type="number"
                    value={formData.monthlyFee}
                    onChange={(e) => setFormData({ ...formData, monthlyFee: e.target.value })}
                    className="bg-white/5 border-cyan-500/30 mt-1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-gray-300">Commission (%)</Label>
                  <Input
                    type="number"
                    value={formData.commissionRate}
                    onChange={(e) => setFormData({ ...formData, commissionRate: e.target.value })}
                    className="bg-white/5 border-cyan-500/30 mt-1"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Visit Charges</Label>
                  <Input
                    type="number"
                    value={formData.visitCharges}
                    onChange={(e) => setFormData({ ...formData, visitCharges: e.target.value })}
                    className="bg-white/5 border-cyan-500/30 mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Login Credentials */}
            <div className="border-t border-cyan-500/20 pt-4">
              <h4 className="font-semibold mb-3 text-cyan-400">Branch Login Credentials</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">Username</Label>
                  <Input
                    value={formData.loginUsername}
                    onChange={(e) => setFormData({ ...formData, loginUsername: e.target.value })}
                    className="bg-white/5 border-cyan-500/30 mt-1"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Password</Label>
                  <Input
                    type="password"
                    value={formData.loginPassword}
                    onChange={(e) => setFormData({ ...formData, loginPassword: e.target.value })}
                    placeholder="Leave empty to keep current"
                    className="bg-white/5 border-cyan-500/30 mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Logo */}
            <div className="border-t border-cyan-500/20 pt-4">
              <Label className="text-gray-300">Branch Logo URL</Label>
              <Input
                value={formData.logoUrl}
                onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                placeholder="https://..."
                className="bg-white/5 border-cyan-500/30 mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => selectedBranch && updateMutation.mutate({ id: selectedBranch.id, data: formData })}
              disabled={updateMutation.isPending}
              className="bg-gradient-to-r from-cyan-500 to-blue-600"
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Canva-style color palette
const solidColors = [
  "#000000", "#374151", "#6b7280", "#9ca3af", "#d1d5db", "#ffffff",
  "#ef4444", "#f97316", "#fb923c", "#fbbf24", "#facc15", "#eab308",
  "#f472b6", "#ec4899", "#d946ef", "#a855f7", "#8b5cf6", "#6366f1",
  "#22c55e", "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9", "#3b82f6",
  "#34d399", "#4ade80", "#a3e635", "#84cc16", "#65a30d", "#16a34a",
];

const gradientColors = [
  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
  "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  "linear-gradient(135deg, #ff0844 0%, #ffb199 100%)",
  "linear-gradient(135deg, #00c6fb 0%, #005bea 100%)",
  "linear-gradient(135deg, #f5af19 0%, #f12711 100%)",
  "linear-gradient(135deg, #0cebeb 0%, #20e3b2 50%, #29ffc6 100%)",
  "linear-gradient(135deg, #eb3349 0%, #f45c43 100%)",
];

interface ThemeConfig {
  headerBg?: string;
  middleBg?: string;
  bottomBg?: string;
  cardStyles?: {
    [key: string]: {
      bgColor?: string;
      borderColor?: string;
      borderSize?: number;
      animatedBorder?: boolean;
    };
  };
  sectionStyles?: {
    [key: string]: {
      bgColor?: string;
      textColor?: string;
    };
  };
}

function ThemeCustomizationTab({ branches }: { branches: PropertyBranch[] }) {
  const queryClient = useQueryClient();
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>({});
  const [activeSection, setActiveSection] = useState<"sections" | "cards">("sections");
  const [selectedCard, setSelectedCard] = useState<string>("card1");
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);

  // Fetch branch theme config when selected
  const { data: branchData } = useQuery({
    queryKey: ["/api/property-branches", selectedBranchId],
    queryFn: async () => {
      if (!selectedBranchId) return null;
      const res = await fetch(`/api/property-branches/${selectedBranchId}`);
      return res.json();
    },
    enabled: !!selectedBranchId,
  });

  useEffect(() => {
    if (branchData?.themeConfig) {
      setThemeConfig(branchData.themeConfig);
    } else {
      setThemeConfig({});
    }
  }, [branchData]);

  const updateThemeMutation = useMutation({
    mutationFn: async (config: ThemeConfig) => {
      const res = await fetch(`/api/property-branches/${selectedBranchId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ themeConfig: config }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/property-branches"] });
      alert("Theme saved successfully!");
    },
  });

  const updateColor = (key: string, value: string) => {
    setThemeConfig(prev => ({ ...prev, [key]: value }));
  };

  const updateCardStyle = (cardKey: string, field: string, value: any) => {
    setThemeConfig(prev => ({
      ...prev,
      cardStyles: {
        ...prev.cardStyles,
        [cardKey]: {
          ...prev.cardStyles?.[cardKey],
          [field]: value,
        },
      },
    }));
  };

  const ColorPickerPanel = ({ colorKey, value, onSelect }: { colorKey: string; value?: string; onSelect: (color: string) => void }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="absolute z-50 top-full left-0 mt-2 bg-[#1a1a2e] border border-cyan-500/30 rounded-xl p-4 shadow-2xl min-w-[320px]"
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-white">Colour</h4>
        <button onClick={() => setShowColorPicker(null)} className="text-gray-400 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input placeholder='Try "blue" or "#00c4cc"' className="pl-10 bg-white/5 border-gray-600" />
      </div>

      <div className="mb-4">
        <h5 className="text-sm text-gray-400 mb-2">Document colours</h5>
        <div className="flex gap-2">
          <button className="w-8 h-8 rounded-full border-2 border-dashed border-cyan-500 flex items-center justify-center">
            <Plus className="w-4 h-4 text-cyan-400" />
          </button>
          <button
            onClick={() => onSelect("#1a1a2e")}
            className="w-8 h-8 rounded-full bg-[#1a1a2e] border border-gray-600"
          />
          <button
            onClick={() => onSelect("#f5c842")}
            className="w-8 h-8 rounded-full bg-[#f5c842]"
          />
        </div>
      </div>

      <div className="mb-4">
        <h5 className="text-sm text-gray-400 mb-2">Default solid colours</h5>
        <div className="grid grid-cols-6 gap-2">
          {solidColors.map((color) => (
            <button
              key={color}
              onClick={() => {
                onSelect(color);
                setShowColorPicker(null);
              }}
              className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${value === color ? "border-cyan-400 ring-2 ring-cyan-400/50" : "border-transparent"}`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      <div>
        <h5 className="text-sm text-gray-400 mb-2">Default gradient colours</h5>
        <div className="grid grid-cols-6 gap-2">
          {gradientColors.map((gradient, idx) => (
            <button
              key={idx}
              onClick={() => {
                onSelect(gradient);
                setShowColorPicker(null);
              }}
              className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${value === gradient ? "border-cyan-400 ring-2 ring-cyan-400/50" : "border-transparent"}`}
              style={{ background: gradient }}
            />
          ))}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-700">
        <Label className="text-gray-400 text-sm">Custom Hex</Label>
        <div className="flex gap-2 mt-1">
          <input
            type="color"
            value={value?.startsWith("#") ? value : "#000000"}
            onChange={(e) => onSelect(e.target.value)}
            className="w-10 h-10 rounded cursor-pointer"
          />
          <Input
            value={value || ""}
            onChange={(e) => onSelect(e.target.value)}
            placeholder="#000000"
            className="bg-white/5 border-gray-600 flex-1"
          />
        </div>
      </div>
    </motion.div>
  );

  const selectedBranch = branches.find(b => b.id === selectedBranchId);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Theme Customization
          </h2>
          <p className="text-gray-400 mt-1">Customize colors and styles for each branch website</p>
        </div>
      </div>

      {/* Branch Selector */}
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-cyan-500/20 p-6">
        <Label className="text-gray-300 text-lg font-semibold mb-3 block">Select Branch</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {branches.map((branch) => (
            <motion.button
              key={branch.id}
              onClick={() => setSelectedBranchId(branch.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                selectedBranchId === branch.id
                  ? "border-cyan-400 bg-cyan-500/10"
                  : "border-white/10 hover:border-cyan-500/30 bg-white/5"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${branch.primaryColor}, ${branch.secondaryColor})` }}
                >
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-white">{branch.name}</p>
                  <p className="text-xs text-gray-400">/{branch.slug}</p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {selectedBranchId && (
        <>
          {/* Section/Card Toggle */}
          <div className="flex gap-2 p-1 bg-white/5 rounded-xl w-fit">
            <button
              onClick={() => setActiveSection("sections")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeSection === "sections" ? "bg-cyan-500 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              Section Backgrounds
            </button>
            <button
              onClick={() => setActiveSection("cards")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeSection === "cards" ? "bg-cyan-500 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              Card Customization
            </button>
          </div>

          {/* Section Backgrounds */}
          {activeSection === "sections" && (
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-cyan-500/20 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Page Section Backgrounds</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { key: "headerBg", label: "Header / Top Section", icon: "1" },
                  { key: "middleBg", label: "Middle Section", icon: "2" },
                  { key: "bottomBg", label: "Bottom / Footer Section", icon: "3" },
                ].map((section) => (
                  <div key={section.key} className="relative">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center text-xs font-bold">
                        {section.icon}
                      </div>
                      <Label className="text-gray-300">{section.label}</Label>
                    </div>
                    <button
                      onClick={() => setShowColorPicker(showColorPicker === section.key ? null : section.key)}
                      className="w-full h-16 rounded-xl border-2 border-dashed border-gray-600 hover:border-cyan-500 transition-all flex items-center justify-center gap-2"
                      style={{
                        background: themeConfig[section.key as keyof ThemeConfig] as string || "transparent",
                      }}
                    >
                      {!themeConfig[section.key as keyof ThemeConfig] && (
                        <>
                          <Plus className="w-5 h-5 text-gray-400" />
                          <span className="text-gray-400">Select Color</span>
                        </>
                      )}
                    </button>
                    <AnimatePresence>
                      {showColorPicker === section.key && (
                        <ColorPickerPanel
                          colorKey={section.key}
                          value={themeConfig[section.key as keyof ThemeConfig] as string}
                          onSelect={(color) => updateColor(section.key, color)}
                        />
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Card Customization */}
          {activeSection === "cards" && (
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-cyan-500/20 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Card Customization</h3>
              
              {/* Card Selector */}
              <div className="flex gap-2 mb-6 flex-wrap">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <button
                    key={num}
                    onClick={() => setSelectedCard(`card${num}`)}
                    className={`w-10 h-10 rounded-lg font-bold transition-all ${
                      selectedCard === `card${num}`
                        ? "bg-cyan-500 text-white"
                        : "bg-white/10 text-gray-400 hover:bg-white/20"
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Card Background */}
                <div className="relative">
                  <Label className="text-gray-300 mb-2 block">Card Background Color</Label>
                  <button
                    onClick={() => setShowColorPicker(showColorPicker === "cardBg" ? null : "cardBg")}
                    className="w-full h-12 rounded-xl border-2 border-gray-600 hover:border-cyan-500 transition-all flex items-center justify-center"
                    style={{
                      background: themeConfig.cardStyles?.[selectedCard]?.bgColor || "#1a1a2e",
                    }}
                  >
                    <span className="text-white text-sm px-2 py-1 bg-black/50 rounded">
                      {themeConfig.cardStyles?.[selectedCard]?.bgColor || "Select Color"}
                    </span>
                  </button>
                  <AnimatePresence>
                    {showColorPicker === "cardBg" && (
                      <ColorPickerPanel
                        colorKey="cardBg"
                        value={themeConfig.cardStyles?.[selectedCard]?.bgColor}
                        onSelect={(color) => updateCardStyle(selectedCard, "bgColor", color)}
                      />
                    )}
                  </AnimatePresence>
                </div>

                {/* Card Border Color */}
                <div className="relative">
                  <Label className="text-gray-300 mb-2 block">Card Border Color</Label>
                  <button
                    onClick={() => setShowColorPicker(showColorPicker === "borderColor" ? null : "borderColor")}
                    className="w-full h-12 rounded-xl border-2 border-gray-600 hover:border-cyan-500 transition-all flex items-center justify-center"
                    style={{
                      background: themeConfig.cardStyles?.[selectedCard]?.borderColor || "#06b6d4",
                    }}
                  >
                    <span className="text-white text-sm px-2 py-1 bg-black/50 rounded">
                      {themeConfig.cardStyles?.[selectedCard]?.borderColor || "Select Color"}
                    </span>
                  </button>
                  <AnimatePresence>
                    {showColorPicker === "borderColor" && (
                      <ColorPickerPanel
                        colorKey="borderColor"
                        value={themeConfig.cardStyles?.[selectedCard]?.borderColor}
                        onSelect={(color) => updateCardStyle(selectedCard, "borderColor", color)}
                      />
                    )}
                  </AnimatePresence>
                </div>

                {/* Border Size */}
                <div>
                  <Label className="text-gray-300 mb-2 block">Border Size (px)</Label>
                  <div className="flex gap-2">
                    {[0, 1, 2, 3, 4, 5].map((size) => (
                      <button
                        key={size}
                        onClick={() => updateCardStyle(selectedCard, "borderSize", size)}
                        className={`w-12 h-12 rounded-lg font-bold transition-all ${
                          themeConfig.cardStyles?.[selectedCard]?.borderSize === size
                            ? "bg-cyan-500 text-white"
                            : "bg-white/10 text-gray-400 hover:bg-white/20"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Animated Border Toggle */}
                <div>
                  <Label className="text-gray-300 mb-2 block">Animated Border</Label>
                  <button
                    onClick={() => updateCardStyle(selectedCard, "animatedBorder", !themeConfig.cardStyles?.[selectedCard]?.animatedBorder)}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                      themeConfig.cardStyles?.[selectedCard]?.animatedBorder
                        ? "bg-gradient-to-r from-cyan-500 to-purple-500 text-white"
                        : "bg-white/10 text-gray-400 hover:bg-white/20"
                    }`}
                  >
                    {themeConfig.cardStyles?.[selectedCard]?.animatedBorder ? "✨ Enabled" : "Disabled"}
                  </button>
                </div>
              </div>

              {/* Preview Card */}
              <div className="mt-6 p-4 bg-black/30 rounded-xl">
                <Label className="text-gray-400 mb-3 block text-center">Preview</Label>
                <div className="flex justify-center">
                  <motion.div
                    animate={themeConfig.cardStyles?.[selectedCard]?.animatedBorder ? {
                      boxShadow: [
                        `0 0 10px ${themeConfig.cardStyles?.[selectedCard]?.borderColor || "#06b6d4"}`,
                        `0 0 20px ${themeConfig.cardStyles?.[selectedCard]?.borderColor || "#06b6d4"}`,
                        `0 0 10px ${themeConfig.cardStyles?.[selectedCard]?.borderColor || "#06b6d4"}`,
                      ],
                    } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-48 h-32 rounded-xl flex items-center justify-center"
                    style={{
                      background: themeConfig.cardStyles?.[selectedCard]?.bgColor || "#1a1a2e",
                      border: `${themeConfig.cardStyles?.[selectedCard]?.borderSize || 2}px solid ${themeConfig.cardStyles?.[selectedCard]?.borderColor || "#06b6d4"}`,
                    }}
                  >
                    <span className="text-white font-semibold">Card {selectedCard.replace("card", "")}</span>
                  </motion.div>
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="flex justify-end gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                if (branchData?.themeConfig) {
                  setThemeConfig(branchData.themeConfig);
                } else {
                  setThemeConfig({});
                }
                alert("Theme reset to original saved values!");
              }}
              className="px-6 py-3 rounded-xl bg-white/10 border border-amber-500/30 text-amber-400 font-semibold flex items-center gap-2 hover:bg-amber-500/10"
            >
              <RefreshCw className="w-5 h-5" />
              Reset to Original
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => updateThemeMutation.mutate(themeConfig)}
              disabled={updateThemeMutation.isPending}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold flex items-center gap-2 shadow-lg disabled:opacity-50"
            >
              {updateThemeMutation.isPending ? "Saving..." : "Apply Theme to Branch"}
            </motion.button>
          </div>
        </>
      )}
    </motion.div>
  );
}
