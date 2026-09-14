import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { getOrders, getBookings, updateOrderStatus, updateBookingStatus, deleteOrder, connectWebSocket, getRestaurantBySlug, getMenuItems, createMenuItem, updateMenuItem, deleteMenuItem, getPromotion, createPromotion, updatePromotion, deletePromotion, getHeroImages, createHeroImage, updateHeroImage, deleteHeroImage, reorderHeroImages, updateRestaurant, getDashboardSettings, getBranchDrivers, createBranchDriver, deleteBranchDriver, assignDriverToOrder, toggleDriverDuty, getExtraToppings, createExtraTopping, updateExtraTopping, deleteExtraTopping, capturePayment, cancelPayment, createOrder, getBranchFeatures } from "@/lib/api";
import { ALLERGEN_KEYS, type Order, type OrderItem, type Booking, type MenuItem, type BookingWithHistory, type Promotion, type HeroImage, type DashboardSettings, type Driver, type BranchDriverAssignment, type ExtraTopping, type WaiterTablet, type Waiter, getCurrencySymbol } from "@shared/schema";
import { OrderCard } from "@/components/order-card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Volume2, VolumeX, LogOut, Calendar, Clock, Users, User, Check, X, AlertTriangle, Plane, Loader2, UtensilsCrossed, ChevronUp, ChevronDown, Plus, Minus, Trash2, MapPin, DollarSign, CreditCard, Link as LinkIcon, Copy, Globe, Upload, Store, Phone, Image as ImageIcon, Truck, ShoppingBag, Car, UserPlus, UserMinus, RotateCcw, Save, HelpCircle, FileText, ArrowLeft, Video, Coins, CheckCircle, Calculator, ClipboardCheck, Package, Tablet, PiggyBank, Settings, Pencil, Edit2, Printer, Mic, Play, Pause, Square, MessageCircle, ChefHat, Banknote } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import useSound from "use-sound";
import { toast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AddDriverForm, DriverFormData } from "@/components/add-driver-form";

const MENU_CATEGORIES = [
  { id: "popular", name: "Popular", icon: "⭐" },
  { id: "new-items", name: "New Items", icon: "🆕" },
  { id: "starters", name: "Starters", icon: "🥗" },
  { id: "iftar-offer", name: "Iftar Offer", icon: "🌙" },
  { id: "tawa", name: "Tawa", icon: "🍳" },
  { id: "karahis", name: "Karahis", icon: "🥘" },
  { id: "biryani", name: "Biryani", icon: "🍚" },
  { id: "curries", name: "Curries", icon: "🍛" },
  { id: "main-meals", name: "Main Meals", icon: "🍽️" },
  { id: "platter", name: "Platter", icon: "🍽️" },
  { id: "platters", name: "Platters", icon: "🍽️" },
  { id: "grill", name: "Grill", icon: "🔥" },
  { id: "kebab-roll", name: "Kebab Roll", icon: "🌯" },
  { id: "wraps", name: "Wraps", icon: "🌯" },
  { id: "tortilla-wrap-meals", name: "Tortilla Wrap Meals", icon: "🌯" },
  { id: "burger-meals", name: "Burger Meals", icon: "🍔" },
  { id: "burgers", name: "Burgers", icon: "🍔" },
  { id: "beef-burgers", name: "Beef Burgers", icon: "🍔" },
  { id: "chicken-burgers", name: "Chicken Burgers", icon: "🍗" },
  { id: "chicken", name: "Chicken", icon: "🍗" },
  { id: "fried-chicken", name: "Fried Chicken", icon: "🍖" },
  { id: "southern-fried-chicken-meals", name: "Southern Fried Chicken", icon: "🍗" },
  { id: "chicken-strips", name: "Chicken Strips", icon: "🍗" },
  { id: "wings", name: "Wings", icon: "🍗" },
  { id: "bbq-wings", name: "BBQ Wings", icon: "🍗" },
  { id: "bbq-chicken", name: "BBQ Chicken", icon: "🍗" },
  { id: "bbq-ribs", name: "BBQ Ribs", icon: "🍖" },
  { id: "peri-peri", name: "Peri Peri Original", icon: "🔥" },
  { id: "peri-peri-chicken-meals", name: "Peri Peri Chicken Meals", icon: "🔥" },
  { id: "dixy-box-meals", name: "Dixy Box Meals", icon: "📦" },
  { id: "dixy-buckets", name: "Dixy Buckets", icon: "🪣" },
  { id: "dixy-rice-box", name: "Dixy Rice Box", icon: "🍚" },
  { id: "bucket-family", name: "Bucket Family", icon: "🪣" },
  { id: "family-bucket", name: "Family Buckets", icon: "🪣" },
  { id: "family-feast-deals", name: "Family Feast Deals", icon: "👨‍👩‍👧‍👦" },
  { id: "family-special-offers", name: "Family Special Offers", icon: "🎉" },
  { id: "snack-packs", name: "Snack Packs", icon: "🍿" },
  { id: "pizza", name: "Pizza", icon: "🍕" },
  { id: "pizza-offer", name: "Pizza Offers", icon: "🍕" },
  { id: "9-small-pizza", name: "9\" Small Pizza", icon: "🍕" },
  { id: "12-medium-pizza", name: "12\" Medium Pizza", icon: "🍕" },
  { id: "15-large-pizza", name: "15\" Large Pizza", icon: "🍕" },
  { id: "panini-meals", name: "Panini Meals", icon: "🥪" },
  { id: "sides", name: "Sides", icon: "🍟" },
  { id: "extras", name: "Extras", icon: "➕" },
  { id: "salads", name: "Salads", icon: "🥗" },
  { id: "healthy-salad", name: "Healthy Salad", icon: "🥗" },
  { id: "kids-meal", name: "Kids Meal", icon: "👶" },
  { id: "kids-meals", name: "Kids Meals", icon: "👶" },
  { id: "kids", name: "Kids Menu", icon: "👶" },
  { id: "dips", name: "Dips", icon: "🫕" },
  { id: "sauce-dips", name: "Sauce & Dips", icon: "🫕" },
  { id: "sauces", name: "Sauces", icon: "🥫" },
  { id: "drinks", name: "Drinks", icon: "🧃" },
  { id: "soft-drinks", name: "Soft Drinks", icon: "🥤" },
  { id: "drinks-desserts", name: "Drinks & Desserts", icon: "🥤" },
  { id: "mojito", name: "Mojito", icon: "🍹" },
  { id: "milkshakes", name: "Milkshakes", icon: "🥛" },
  { id: "lassi", name: "Lassi", icon: "🥛" },
  { id: "desserts", name: "Desserts", icon: "🍨" },
  { id: "other-menus", name: "Other Menus", icon: "📋" },
];

const ALARM_SOUNDS = [
  { id: "alarm1", name: "Classic Alert", url: "https://assets.mixkit.co/active_storage/sfx/1569/1569-preview.mp3" },
  { id: "alarm2", name: "Urgent Beep", url: "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" },
  { id: "alarm3", name: "Bell Ring", url: "https://assets.mixkit.co/active_storage/sfx/2867/2867-preview.mp3" },
  { id: "alarm4", name: "Digital Alert", url: "https://assets.mixkit.co/active_storage/sfx/2870/2870-preview.mp3" },
  { id: "alarm5", name: "Warning Siren", url: "https://assets.mixkit.co/active_storage/sfx/2868/2868-preview.mp3" },
  { id: "alarm6", name: "Notification Chime", url: "https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3" },
  { id: "alarm7", name: "Emergency Tone", url: "https://assets.mixkit.co/active_storage/sfx/2866/2866-preview.mp3" },
  { id: "alarm8", name: "Soft Ping", url: "https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3" },
] as const;

const getAlarmUrl = (alarmId: string): string => {
  const alarm = ALARM_SOUNDS.find(a => a.id === alarmId);
  return alarm?.url || ALARM_SOUNDS[0].url;
};

const ANIMATION_EFFECTS = [
  { id: "slide", name: "Slide", description: "Smooth horizontal sliding" },
  { id: "fade", name: "Fade", description: "Gentle fade transition" },
  { id: "scrapbook", name: "Scrapbook", description: "Playful rotate & tilt" },
  { id: "stomp", name: "Stomp", description: "Bouncy scale effect" },
  { id: "flicker", name: "Flicker", description: "Dynamic flashing" },
  { id: "pulse", name: "Pulse", description: "Breathing scale" },
  { id: "tectonic", name: "Tectonic", description: "Shaking motion" },
] as const;

type OrderWithItems = Order & { items: OrderItem[] };

export default function RestaurantDashboard() {
  const [, navigate] = useLocation();
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  
  const { data: restaurant, isLoading: loadingRestaurant, error: restaurantError } = useQuery({
    queryKey: ["/api/restaurants", slug],
    queryFn: () => getRestaurantBySlug(slug!),
    enabled: !!slug,
  });
  
  const restaurantId = restaurant?.id || null;
  const restaurantName = restaurant?.name || "Loading...";
  const currencySymbol = getCurrencySymbol(restaurant?.currency || "GBP");

  // Query branch features for controlling which features are enabled
  const { data: branchFeatures } = useQuery({
    queryKey: ["/api/branch-features", restaurantId],
    queryFn: () => getBranchFeatures(restaurantId!),
    enabled: !!restaurantId,
  });

  // Feature flag helpers - default to true during loading
  const isTableBookingEnabled = branchFeatures?.tableBooking ?? true;
  const isDriverAppEnabled = branchFeatures?.driverApp ?? true;
  const isDeliveryTrackingEnabled = branchFeatures?.deliveryTracking ?? true;
  const isWaiterAppEnabled = branchFeatures?.waiterApp ?? true;
  const isTelephoneOrderingEnabled = branchFeatures?.telephoneOrdering ?? true;
  const isSupplierOrderingEnabled = branchFeatures?.supplierOrdering ?? true;
  const isKitchenDisplayEnabled = branchFeatures?.kitchenDisplay ?? true;
  const isEposSystemEnabled = branchFeatures?.eposSystem ?? true;
  const isAllergenManagementEnabled = branchFeatures?.allergenManagement ?? true;
  const isPromotionsEnabled = branchFeatures?.promotions ?? true;
  const isLoyaltyProgramEnabled = branchFeatures?.loyaltyProgram ?? false;
  const isOnlineOrderingEnabled = branchFeatures?.onlineOrdering ?? true;
  const isDineInOrderingEnabled = branchFeatures?.dineInOrdering ?? true;
  
  useEffect(() => {
    document.documentElement.classList.add("dark");
    return () => document.documentElement.classList.remove("dark");
  }, []);

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isRinging, setIsRinging] = useState(false);
  const [alarmFlash, setAlarmFlash] = useState(false);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  
  // Incoming call state for Twilio caller ID
  const [incomingCall, setIncomingCall] = useState<{
    callSid: string;
    callerNumber: string;
    customer: { id: string; name: string | null; phone: string; address: string | null } | null;
    timestamp: string;
  } | null>(null);
  
  // Audio unlock for mobile/tablet (browsers require user interaction before audio can play)
  const unlockAudio = async () => {
    try {
      // Create a short silent audio context to unlock audio on mobile
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        const audioCtx = new AudioContext();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        gainNode.gain.value = 0; // Silent
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.start(0);
        oscillator.stop(0.001);
        await audioCtx.resume();
      }
      // Use the actual alarm audio ref to unlock it
      if (alarmAudioRef.current) {
        const originalVolume = alarmAudioRef.current.volume;
        alarmAudioRef.current.volume = 0.01;
        await alarmAudioRef.current.play();
        alarmAudioRef.current.pause();
        alarmAudioRef.current.currentTime = 0;
        alarmAudioRef.current.volume = originalVolume;
      }
      
      setAudioUnlocked(true);
      localStorage.setItem(`audio_unlocked_${slug}`, 'true');
      toast({ 
        title: "Sound Enabled!", 
        description: "You'll now hear alarms when new orders arrive.",
      });
    } catch (e) {
      console.log('Audio unlock failed:', e);
      setAudioUnlocked(true); // Mark as unlocked anyway to hide the banner
    }
  };
  
  // Check if audio was previously unlocked
  useEffect(() => {
    const wasUnlocked = localStorage.getItem(`audio_unlocked_${slug}`);
    if (wasUnlocked) {
      setAudioUnlocked(true);
    }
  }, [slug]);
  
  // Tablet/Mobile welcome overlay and PWA install states
  const [showWelcomeOverlay, setShowWelcomeOverlay] = useState(() => {
    const dismissed = sessionStorage.getItem(`dashboard_welcome_${slug}`);
    return !dismissed;
  });
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isTabletOrMobile, setIsTabletOrMobile] = useState(false);
  
  // Detect tablet/mobile and handle PWA install prompt
  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      setIsTabletOrMobile(width <= 1024);
    };
    checkDevice();
    window.addEventListener('resize', checkDevice);
    
    // Listen for PWA install prompt
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    
    return () => {
      window.removeEventListener('resize', checkDevice);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);
  
  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        toast({ title: "App Installed!", description: "You can now access the dashboard from your home screen." });
      }
      setDeferredPrompt(null);
    }
  };
  
  const dismissWelcome = () => {
    sessionStorage.setItem(`dashboard_welcome_${slug}`, 'true');
    setShowWelcomeOverlay(false);
  };
  const [acknowledgedOrders, setAcknowledgedOrders] = useState<Set<string>>(() => {
    // Load acknowledged orders from localStorage to persist across navigation
    const stored = localStorage.getItem(`acknowledgedOrders_${slug}`);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });
  const [activeTab, setActiveTab] = useState("active");
  const [showMobileOrdersView, setShowMobileOrdersView] = useState(false);
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [mobileDashboardTab, setMobileDashboardTab] = useState<"active" | "completed" | "bookings" | "drivers" | "customers" | "allergens" | "waiter" | "phone">("active");
  
  // Telephone order modal states
  const [showTelephoneOrderModal, setShowTelephoneOrderModal] = useState(false);
  const [telephoneNumber, setTelephoneNumber] = useState("");
  const [telephoneCustomer, setTelephoneCustomer] = useState<any>(null);
  const [telephoneCustomerLoading, setTelephoneCustomerLoading] = useState(false);
  const [telephoneOrderType, setTelephoneOrderType] = useState<"delivery" | "collection">("delivery");
  const [telephonePaymentMethod, setTelephonePaymentMethod] = useState<"cash" | "card" | "account">("cash");
  const [telephoneOrderItems, setTelephoneOrderItems] = useState<{item: MenuItem, quantity: number}[]>([]);
  const [telephoneCustomerName, setTelephoneCustomerName] = useState("");
  const [telephoneAddress, setTelephoneAddress] = useState("");
  const [telephoneNotes, setTelephoneNotes] = useState("");
  const [saveCustomerDetails, setSaveCustomerDetails] = useState(true);
  const [telephoneSelectedCategory, setTelephoneSelectedCategory] = useState<string | null>(null);
  
  // Call history modal states
  const [showCallHistoryModal, setShowCallHistoryModal] = useState(false);
  const [playingRecordingId, setPlayingRecordingId] = useState<string | null>(null);
  
  // Booking confirmation modal states
  const [confirmingBooking, setConfirmingBooking] = useState<BookingWithHistory | null>(null);
  const [bookingTableLabel, setBookingTableLabel] = useState("");
  
  const [allergenEditItem, setAllergenEditItem] = useState<MenuItem | null>(null);
  const [allergenEditProfile, setAllergenEditProfile] = useState<Record<string, string>>({});
  const allergenPrintRef = useRef<HTMLDivElement>(null);
  
  // Persist acknowledged orders to localStorage when they change
  useEffect(() => {
    if (slug && acknowledgedOrders.size > 0) {
      localStorage.setItem(`acknowledgedOrders_${slug}`, JSON.stringify(Array.from(acknowledgedOrders)));
    }
  }, [acknowledgedOrders, slug]);
  
  // Use HTML5 Audio directly for more reliable playback across browsers
  const alarmAudioRef = useRef<HTMLAudioElement | null>(null);
  
  // Initialize audio element with selected alarm sound
  useEffect(() => {
    const selectedAlarm = (restaurant as any)?.alarmSound || "alarm1";
    const alarmUrl = getAlarmUrl(selectedAlarm);
    const audio = new Audio(alarmUrl);
    audio.loop = true;
    audio.volume = 1;
    audio.preload = 'auto';
    alarmAudioRef.current = audio;
    
    return () => {
      if (alarmAudioRef.current) {
        alarmAudioRef.current.pause();
        alarmAudioRef.current = null;
      }
    };
  }, [restaurant]);
  
  const playAlarm = useCallback(() => {
    if (alarmAudioRef.current) {
      alarmAudioRef.current.currentTime = 0;
      alarmAudioRef.current.play().catch(err => {
        console.log('Audio play failed (user interaction required):', err);
      });
    }
  }, []);
  
  const stopAlarm = useCallback(() => {
    if (alarmAudioRef.current) {
      alarmAudioRef.current.pause();
      alarmAudioRef.current.currentTime = 0;
    }
  }, []);

  const { data: orders = [] } = useQuery<OrderWithItems[]>({
    queryKey: ["/api/orders", restaurantId],
    queryFn: () => getOrders(restaurantId!),
    refetchInterval: 5000,
    enabled: !!restaurantId,
  });

  const { data: bookingsData = [] } = useQuery<BookingWithHistory[]>({
    queryKey: ["/api/bookings", restaurantId],
    queryFn: () => getBookings(restaurantId!),
    refetchInterval: 10000,
    enabled: !!restaurantId,
  });
  const bookings: BookingWithHistory[] = bookingsData ?? [];

  // Call recordings query
  const { data: callRecordings = [], refetch: refetchRecordings } = useQuery<{
    id: string;
    restaurantId: string;
    callSid: string;
    recordingSid: string | null;
    recordingUrl: string | null;
    callerNumber: string;
    customerName: string | null;
    duration: number | null;
    status: string | null;
    createdAt: string;
  }[]>({
    queryKey: ["/api/call-recordings", restaurantId],
    queryFn: async () => {
      const response = await fetch(`/api/call-recordings/${restaurantId}`);
      return response.json();
    },
    enabled: !!restaurantId && showCallHistoryModal,
  });

  const deleteRecordingMutation = useMutation({
    mutationFn: async (recordingId: string) => {
      const response = await fetch(`/api/call-recordings/${recordingId}`, {
        method: "DELETE",
      });
      return response.json();
    },
    onSuccess: () => {
      refetchRecordings();
      toast({ title: "Recording deleted", description: "The call recording has been removed." });
    },
  });

  // Twilio settings query (for toggle button)
  const { data: twilioSettings, refetch: refetchTwilioSettings } = useQuery<{
    id: string;
    restaurantId: string;
    accountSid: string;
    authToken: string;
    phoneNumber: string;
    enabled: boolean | null;
  } | null>({
    queryKey: ["/api/twilio-settings", restaurantId],
    queryFn: async () => {
      const response = await fetch(`/api/twilio-settings/${restaurantId}`);
      if (response.status === 404) return null;
      return response.json();
    },
    enabled: !!restaurantId,
  });

  // Toggle Twilio caller ID mutation
  const toggleTwilioMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const response = await fetch(`/api/twilio-settings/${restaurantId}/toggle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      if (!response.ok) {
        throw new Error("Failed to toggle caller ID");
      }
      return response.json();
    },
    onSuccess: (data) => {
      refetchTwilioSettings();
      toast({
        title: data.enabled ? "Caller ID ON" : "Caller ID OFF",
        description: data.enabled 
          ? "Incoming calls will now show caller information on your dashboard."
          : "Caller ID is disabled. Remember to disable call forwarding on your phone to avoid Twilio charges.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to toggle caller ID. Please try again.",
        variant: "destructive",
      });
    },
  });

  const { data: menuItems = [] } = useQuery<MenuItem[]>({
    queryKey: ["/api/menu", restaurantId],
    queryFn: () => getMenuItems(restaurantId!),
    enabled: !!restaurantId,
  });

  const { data: dbCategories = [] } = useQuery<{ id: string; slug: string; name: string; icon: string; restaurantId: string | null; imageUrl?: string; gifUrl?: string; videoUrl?: string }[]>({
    queryKey: ["/api/menu-categories", restaurantId],
    queryFn: async () => {
      const response = await fetch(`/api/menu-categories?restaurantId=${restaurantId}`);
      return response.json();
    },
    enabled: !!restaurantId,
  });

  // De-duplicate categories by name, preferring branch-specific over global
  // Use name as id since menu items store category by name, not slug
  const dynamicCategories = useMemo(() => {
    if (dbCategories.length === 0) return MENU_CATEGORIES;
    
    const byName = new Map<string, { id: string; name: string; icon: string; dbId: string; restaurantId: string | null; slug: string; imageUrl?: string; gifUrl?: string; videoUrl?: string }>();
    for (const cat of dbCategories) {
      const existing = byName.get(cat.name);
      // Prefer branch-specific (has restaurantId matching this branch) over global (null)
      if (!existing || (cat.restaurantId && cat.restaurantId === restaurantId)) {
        byName.set(cat.name, {
          id: cat.name, // Use name as id since menu items store category by name
          name: cat.name,
          icon: cat.icon || "🍽️",
          dbId: cat.id,
          slug: cat.slug,
          restaurantId: cat.restaurantId,
          imageUrl: cat.imageUrl,
          gifUrl: cat.gifUrl,
          videoUrl: cat.videoUrl,
        });
      }
    }
    return Array.from(byName.values());
  }, [dbCategories, restaurantId]);

  const [menuExpanded, setMenuExpanded] = useState(false);
  const [editingPrices, setEditingPrices] = useState<Record<string, string>>({});
  const [addingMenuItem, setAddingMenuItem] = useState(false);
  const [editingMenuItemId, setEditingMenuItemId] = useState<string | null>(null);
  const [editMenuItemName, setEditMenuItemName] = useState("");
  const [editMenuItemDescription, setEditMenuItemDescription] = useState("");
  const [editMenuItemImage, setEditMenuItemImage] = useState("");
  const [editMenuItemCategory, setEditMenuItemCategory] = useState("");
  const [newMenuItemName, setNewMenuItemName] = useState("");
  const [newMenuItemPrice, setNewMenuItemPrice] = useState("");
  const [newMenuItemCategory, setNewMenuItemCategory] = useState("");
  const [newMenuItemDescription, setNewMenuItemDescription] = useState("");
  const [newMenuItemImage, setNewMenuItemImage] = useState("");
  const [newMenuItemVideo, setNewMenuItemVideo] = useState("");
  const [isUploadingMenuImage, setIsUploadingMenuImage] = useState(false);
  const [isUploadingMenuVideo, setIsUploadingMenuVideo] = useState(false);
  const [editMenuItemVideo, setEditMenuItemVideo] = useState("");

  // Promotion state
  const [promoExpanded, setPromoExpanded] = useState(false);
  const [promoHeadline, setPromoHeadline] = useState("");
  const [promoSubtext, setPromoSubtext] = useState("");
  const [promoIsActive, setPromoIsActive] = useState(true);
  const [promoBgColor, setPromoBgColor] = useState("#dc2626");
  const [promoTextColor, setPromoTextColor] = useState("#ffffff");
  
  // Hero Gallery state
  const [heroGalleryExpanded, setHeroGalleryExpanded] = useState(false);
  const [newHeroImageUrl, setNewHeroImageUrl] = useState("");
  const [newHeroImageLabel, setNewHeroImageLabel] = useState("");
  const [selectedAnimationEffect, setSelectedAnimationEffect] = useState<string>("slide");
  const [heroSlideInterval, setHeroSlideInterval] = useState(5000);
  const [isUploadingHeroImage, setIsUploadingHeroImage] = useState(false);
  
  // Tawa Hero Image state
  const [tawaHeroExpanded, setTawaHeroExpanded] = useState(false);
  const [tawaHeroImage, setTawaHeroImage] = useState<string>("");
  const [isUploadingTawaHero, setIsUploadingTawaHero] = useState(false);
  
  // Tawa Hero Video state
  const [tawaVideoExpanded, setTawaVideoExpanded] = useState(false);
  const [tawaHeroVideo, setTawaHeroVideo] = useState<string>("");
  const [isUploadingTawaVideo, setIsUploadingTawaVideo] = useState(false);
  
  // Emparo Hero Image state
  const [emparoHeroExpanded, setEmparoHeroExpanded] = useState(false);
  const [emparoHeroImage, setEmparoHeroImage] = useState<string>("");
  const [isUploadingEmparoHero, setIsUploadingEmparoHero] = useState(false);
  
  // Emparo Hero Video state
  const [emparoVideoExpanded, setEmparoVideoExpanded] = useState(false);
  const [emparoHeroVideo, setEmparoHeroVideo] = useState<string>("");
  const [isUploadingEmparoVideo, setIsUploadingEmparoVideo] = useState(false);
  
  // Welcome Page Slider Images state
  const [welcomeSliderExpanded, setWelcomeSliderExpanded] = useState(false);
  const [welcomeSliderImages, setWelcomeSliderImages] = useState<string[]>([]);
  const [newWelcomeSliderUrl, setNewWelcomeSliderUrl] = useState("");
  const [isUploadingWelcomeSlider, setIsUploadingWelcomeSlider] = useState(false);
  
  // Popular Items state
  const [popularItemsExpanded, setPopularItemsExpanded] = useState(false);
  const [newPopularItemName, setNewPopularItemName] = useState("");
  const [newPopularItemImageUrl, setNewPopularItemImageUrl] = useState("");
  const [newPopularItemLinkUrl, setNewPopularItemLinkUrl] = useState("");
  const [isUploadingPopularImage, setIsUploadingPopularImage] = useState(false);
  
  // Branding state
  const [brandingExpanded, setBrandingExpanded] = useState(false);
  const [isUploadingHighlightImage, setIsUploadingHighlightImage] = useState(false);
  
  // Theme Customization state
  const [themeExpanded, setThemeExpanded] = useState(false);
  const [primaryColor, setPrimaryColor] = useState("#8B0000");
  const [secondaryColor, setSecondaryColor] = useState("#FFD700");
  const [accentColor, setAccentColor] = useState("#4A0E4E");
  const [headerBgColor, setHeaderBgColor] = useState("#1a1a2e");
  const [cardBgColor, setCardBgColor] = useState("#ffffff");
  const [buttonColor, setButtonColor] = useState("#dc2626");
  const [textColor, setTextColor] = useState("#ffffff");
  const [heroVideoUrl, setHeroVideoUrl] = useState("");
  const [heroGifUrl, setHeroGifUrl] = useState("");
  const [heroVideoExpanded, setHeroVideoExpanded] = useState(false);
  const [isUploadingHeroVideo, setIsUploadingHeroVideo] = useState(false);
  const [isUploadingHeroGif, setIsUploadingHeroGif] = useState(false);
  
  // Category Management state
  const [categoriesExpanded, setCategoriesExpanded] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryIcon, setNewCategoryIcon] = useState("🍽️");
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");
  const [editingCategoryIcon, setEditingCategoryIcon] = useState("");
  const [deleteCategoryConfirm, setDeleteCategoryConfirm] = useState<{ id: string; dbId?: number; name: string; itemCount: number } | null>(null);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);
  const [editCategoryDialog, setEditCategoryDialog] = useState<{ id: string; dbId?: string; name: string; icon: string; itemCount: number; imageUrl?: string; videoUrl?: string } | null>(null);
  const [editingCategoryImageUrl, setEditingCategoryImageUrl] = useState("");
  const [isUploadingCategoryImage, setIsUploadingCategoryImage] = useState(false);
  const [editingCategoryVideoUrl, setEditingCategoryVideoUrl] = useState("");
  const [isUploadingCategoryVideo, setIsUploadingCategoryVideo] = useState(false);
  
  // Branch Details state
  const [branchDetailsExpanded, setBranchDetailsExpanded] = useState(false);
  const [editBranchAddress, setEditBranchAddress] = useState("");
  const [editBranchEmail, setEditBranchEmail] = useState("");
  const [editBranchPhone, setEditBranchPhone] = useState("");
  const [editSupplierOrderFromEmail, setEditSupplierOrderFromEmail] = useState("");
  const [editCuisineType, setEditCuisineType] = useState("");
  const [editTagline, setEditTagline] = useState("");
  
  // Gradient state
  const [heroGradientStart, setHeroGradientStart] = useState("#dc2626");
  const [heroGradientMiddle, setHeroGradientMiddle] = useState("#f97316");
  const [heroGradientEnd, setHeroGradientEnd] = useState("#fbbf24");
  
  // Operating hours state
  const [hoursExpanded, setHoursExpanded] = useState(false);
  const [deliveryHoursMonThu, setDeliveryHoursMonThu] = useState("12PM - 10:30PM");
  const [deliveryHoursFriSat, setDeliveryHoursFriSat] = useState("12PM - 11:30PM");
  const [deliveryHoursSun, setDeliveryHoursSun] = useState("12PM - 10:30PM");
  const [collectionHoursMonThu, setCollectionHoursMonThu] = useState("12PM - 10:30PM");
  const [collectionHoursFriSat, setCollectionHoursFriSat] = useState("12PM - 11:30PM");
  const [collectionHoursSun, setCollectionHoursSun] = useState("12PM - 10:30PM");

  // Collection discount state
  const [discountExpanded, setDiscountExpanded] = useState(false);
  const [collectionDiscountPercent, setCollectionDiscountPercent] = useState(10);
  const [collectionDiscountMinimum, setCollectionDiscountMinimum] = useState("15.00");

  // Delivery time state
  const [deliveryTimeExpanded, setDeliveryTimeExpanded] = useState(false);
  const [deliveryTimeMinutes, setDeliveryTimeMinutes] = useState(45);

  // Extra Toppings state
  const [extraToppingsExpanded, setExtraToppingsExpanded] = useState(false);
  const [newToppingName, setNewToppingName] = useState("");
  const [newToppingPrice, setNewToppingPrice] = useState("");
  const [newToppingCategory, setNewToppingCategory] = useState("");
  const [newToppingMenuItem, setNewToppingMenuItem] = useState("");
  const [editingToppingId, setEditingToppingId] = useState<string | null>(null);
  const [editingToppingName, setEditingToppingName] = useState("");
  const [editingToppingPrice, setEditingToppingPrice] = useState("");
  
  // Menu item toppings modal state
  const [selectedMenuItemForToppings, setSelectedMenuItemForToppings] = useState<MenuItem | null>(null);
  const [quickToppingName, setQuickToppingName] = useState("");
  const [quickToppingPrice, setQuickToppingPrice] = useState("1.00");

  // Bulk Image Upload state
  const [bulkUploadExpanded, setBulkUploadExpanded] = useState(false);
  const [bulkUploadImages, setBulkUploadImages] = useState<Array<{ file: File; preview: string; targetType: 'category' | 'menuItem'; targetId: string; targetName: string }>>([]);
  const [isUploadingBulk, setIsUploadingBulk] = useState(false);

  const { data: heroImages = [] } = useQuery<HeroImage[]>({
    queryKey: ["/api/hero-images", restaurantId],
    queryFn: () => getHeroImages(restaurantId!),
    enabled: !!restaurantId,
  });

  const { data: popularItems = [] } = useQuery<any[]>({
    queryKey: ["/api/popular-items", restaurantId],
    queryFn: async () => {
      const res = await fetch(`/api/restaurants/${restaurantId}/popular-items`);
      if (!res.ok) throw new Error("Failed to fetch popular items");
      return res.json();
    },
    enabled: !!restaurantId,
  });

  const { data: promotion } = useQuery<Promotion | null>({
    queryKey: ["/api/promotions", restaurantId],
    queryFn: () => getPromotion(restaurantId!),
    enabled: !!restaurantId,
  });

  // Fetch dashboard settings (which sections are enabled by super admin)
  const { data: dashboardSettings, isLoading: loadingDashboardSettings, isError: settingsError } = useQuery<DashboardSettings>({
    queryKey: ["/api/dashboard-settings", restaurantId],
    queryFn: () => getDashboardSettings(restaurantId!),
    enabled: !!restaurantId,
  });

  // Fetch branch drivers - drivers now belong directly to a restaurant
  const { data: branchDrivers = [] } = useQuery<Driver[]>({
    queryKey: ["/api/branch-drivers", restaurantId],
    queryFn: () => getBranchDrivers(restaurantId!),
    enabled: !!restaurantId,
  });

  // Fetch earnings for all branch drivers
  const { data: driversEarnings = {} } = useQuery<Record<string, { received: number; due: number; todayPayments: number }>>({
    queryKey: ["/api/branch-drivers-earnings", restaurantId],
    queryFn: async () => {
      const earningsMap: Record<string, { received: number; due: number; todayPayments: number }> = {};
      await Promise.all(
        branchDrivers.map(async (driver) => {
          try {
            const res = await fetch(`/api/drivers/${driver.id}/earnings`);
            if (res.ok) {
              const data = await res.json();
              const todayStart = new Date();
              todayStart.setHours(0, 0, 0, 0);
              const todayPayments = (data.payments?.recentPayments || [])
                .filter((p: any) => new Date(p.paidAt) >= todayStart)
                .reduce((sum: number, p: any) => sum + Number(p.amount), 0);
              earningsMap[driver.id] = {
                received: data.payments?.received || 0,
                due: data.payments?.due || 0,
                todayPayments
              };
            }
          } catch (e) {
            earningsMap[driver.id] = { received: 0, due: 0, todayPayments: 0 };
          }
        })
      );
      return earningsMap;
    },
    enabled: !!restaurantId && branchDrivers.length > 0,
  });

  // Fetch extra toppings for this restaurant
  const { data: extraToppings = [] } = useQuery<ExtraTopping[]>({
    queryKey: ["/api/extra-toppings", restaurantId],
    queryFn: () => getExtraToppings(restaurantId!),
    enabled: !!restaurantId,
  });

  // Fetch customers for this restaurant only
  const { data: allCustomers = [] } = useQuery<any[]>({
    queryKey: ["/api/restaurants", restaurantId, "customers"],
    queryFn: async () => {
      const res = await fetch(`/api/restaurants/${restaurantId}/customers`);
      if (!res.ok) throw new Error("Failed to fetch customers");
      return res.json();
    },
    enabled: !!restaurantId,
  });

  // Fetch waiter tablets for this restaurant
  const { data: waiterTablets = [] } = useQuery<WaiterTablet[]>({
    queryKey: ["/api/waiter-tablets", restaurantId],
    queryFn: async () => {
      const res = await fetch(`/api/restaurants/${restaurantId}/waiter-tablets`);
      if (!res.ok) throw new Error("Failed to fetch waiter tablets");
      return res.json();
    },
    refetchInterval: 10000,
    enabled: !!restaurantId,
  });

  // Fetch registered waiters for this restaurant
  const { data: registeredWaiters = [] } = useQuery<Waiter[]>({
    queryKey: ["/api/waiters", restaurantId],
    queryFn: async () => {
      const res = await fetch(`/api/restaurants/${restaurantId}/waiters`);
      if (!res.ok) throw new Error("Failed to fetch waiters");
      return res.json();
    },
    enabled: !!restaurantId,
  });

  // Driver assignment state
  const [assigningDriverToOrder, setAssigningDriverToOrder] = useState<string | null>(null);
  const [notifiedOrders, setNotifiedOrders] = useState<Set<string>>(new Set());
  
  // Delivery offer state
  const [deliveryOfferAmount, setDeliveryOfferAmount] = useState<string>("");
  const [deliveryPaymentInstruction, setDeliveryPaymentInstruction] = useState<string>("");
  const [deliveryDriverNotes, setDeliveryDriverNotes] = useState<string>("");

  // State for adding new driver
  const [showAddDriverForm, setShowAddDriverForm] = useState(false);

  // State for driver payment
  const [selectedPaymentDriver, setSelectedPaymentDriver] = useState<string>("");
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [paymentPeriod, setPaymentPeriod] = useState<string>("weekly");
  const [paymentNotes, setPaymentNotes] = useState<string>("");

  // Mutations for driver management
  const createDriverMutation = useMutation({
    mutationFn: (driver: Parameters<typeof createBranchDriver>[1]) =>
      createBranchDriver(restaurantId!, driver),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/branch-drivers", restaurantId] });
      setShowAddDriverForm(false);
      toast({ title: "Driver Added", description: "New driver has been created for this branch." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create driver. Phone may already be in use.", variant: "destructive" });
    }
  });

  const deleteDriverMutation = useMutation({
    mutationFn: (driverId: string) =>
      deleteBranchDriver(restaurantId!, driverId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/branch-drivers", restaurantId] });
      toast({ title: "Driver Removed", description: "Driver has been removed from this branch." });
    },
  });

  // Release waiter tablet mutation
  const releaseTabletMutation = useMutation({
    mutationFn: async (tabletId: string) => {
      const res = await fetch(`/api/restaurants/${restaurantId}/waiter-tablets/${tabletId}/release`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to release tablet");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/waiter-tablets", restaurantId] });
      toast({ title: "Tablet Released", description: data?.tabletNumber ? `Tablet ${data.tabletNumber} is now available.` : "Tablet is now available." });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/waiter-tablets", restaurantId] });
      toast({ title: "Error", description: "Failed to release tablet.", variant: "destructive" });
    }
  });

  // Release all waiter tablets mutation
  const releaseAllTabletsMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/restaurants/${restaurantId}/waiter-tablets/release-all`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to release all tablets");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/waiter-tablets", restaurantId] });
      toast({ title: "All Tablets Released", description: `${data.released} tablets are now available.` });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to release all tablets.", variant: "destructive" });
    }
  });

  // Delete waiter mutation
  const deleteWaiterMutation = useMutation({
    mutationFn: async (waiterId: string) => {
      const res = await fetch(`/api/restaurants/${restaurantId}/waiters/${waiterId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete waiter");
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/waiters", restaurantId] });
      toast({ title: "Waiter Removed", description: "Waiter has been removed from this branch." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to remove waiter.", variant: "destructive" });
    }
  });

  const toggleDriverDutyMutation = useMutation({
    mutationFn: ({ driverId, isOnDuty }: { driverId: string; isOnDuty: boolean }) =>
      toggleDriverDuty(driverId, isOnDuty),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/branch-drivers", restaurantId] });
      toast({ 
        title: data.isOnDuty ? "Driver On Duty" : "Driver Off Duty", 
        description: data.isOnDuty 
          ? `${data.name} started shift at ${new Date().toLocaleTimeString()}` 
          : `${data.name} finished shift` 
      });
    },
  });

  const assignDriverToOrderMutation = useMutation({
    mutationFn: ({ orderId, driverId, broadcastToAll, offerAmount, paymentInstruction, driverNotes }: { 
      orderId: string; 
      driverId?: string; 
      broadcastToAll?: boolean;
      offerAmount?: string;
      paymentInstruction?: string;
      driverNotes?: string;
    }) =>
      assignDriverToOrder(orderId, driverId, broadcastToAll, offerAmount, paymentInstruction, driverNotes),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders", restaurantId] });
      setAssigningDriverToOrder(null);
      if (variables.broadcastToAll) {
        // Add to notified orders to show green success state
        setNotifiedOrders(prev => {
          const newSet = new Set(Array.from(prev));
          newSet.add(variables.orderId);
          return newSet;
        });
        toast({ title: "✅ All Drivers Notified!", description: "All on-duty drivers have been notified. First to accept gets the order." });
        // Clear success state after 5 seconds
        setTimeout(() => {
          setNotifiedOrders(prev => {
            const newSet = new Set(prev);
            newSet.delete(variables.orderId);
            return newSet;
          });
        }, 5000);
      } else {
        toast({ title: "Driver Assigned", description: "Driver has been assigned to this order." });
      }
    },
  });

  // Driver payment mutation
  const payDriverMutation = useMutation({
    mutationFn: async ({ driverId, amount, paymentType, paymentPeriod, notes }: { 
      driverId: string; 
      amount: string; 
      paymentType: string; 
      paymentPeriod: string; 
      notes?: string 
    }) => {
      const res = await fetch(`/api/drivers/${driverId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, paymentType, paymentPeriod, notes }),
      });
      if (!res.ok) throw new Error("Failed to record payment");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/drivers", variables.driverId, "earnings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/branch-drivers-earnings", restaurantId] });
      setSelectedPaymentDriver("");
      setPaymentAmount("");
      setPaymentPeriod("weekly");
      setPaymentNotes("");
      toast({ title: "Payment Recorded", description: "Driver payment has been recorded successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to record payment.", variant: "destructive" });
    }
  });

  // Extra Toppings mutations
  const createToppingMutation = useMutation({
    mutationFn: (data: { name: string; price: string; menuItemId?: string }) =>
      createExtraTopping(restaurantId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/extra-toppings", restaurantId] });
      setNewToppingName("");
      setNewToppingPrice("");
      setNewToppingCategory("");
      setNewToppingMenuItem("");
      toast({ title: "Topping Added", description: "New extra topping has been created." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create topping.", variant: "destructive" });
    }
  });

  const updateToppingMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<{ name: string; price: string; isActive: boolean }> }) =>
      updateExtraTopping(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/extra-toppings", restaurantId] });
      setEditingToppingId(null);
      setEditingToppingName("");
      setEditingToppingPrice("");
      toast({ title: "Topping Updated", description: "Extra topping has been updated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update topping.", variant: "destructive" });
    }
  });

  const deleteToppingMutation = useMutation({
    mutationFn: (id: string) => deleteExtraTopping(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/extra-toppings", restaurantId] });
      toast({ title: "Topping Deleted", description: "Extra topping has been removed." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete topping.", variant: "destructive" });
    }
  });

  // Get on-duty drivers for this branch
  const onDutyDrivers = branchDrivers.filter(d => d.isOnDuty && d.isActive);

  // Get available drivers for order assignment (on-duty drivers)
  const availableDriversForOrder = branchDrivers.filter(d => d.isOnDuty && d.isActive);

  // Helper to check if a feature is enabled
  // - While loading: hide sections to prevent flash of all features
  // - On fetch error: default to showing all features (fail open for branch admins)
  // - If settings loaded but record doesn't exist (new restaurant): show all features (default true)
  // - If settings exist: use the actual setting value
  const isFeatureEnabled = (feature: 'promotionsEnabled' | 'brandingEnabled' | 'hoursEnabled' | 'heroGalleryEnabled'): boolean => {
    if (loadingDashboardSettings) return false; // Hide while loading
    if (settingsError) return true; // On error, default to showing all features
    if (!dashboardSettings || !dashboardSettings.id) return true; // No record exists, default to enabled
    return dashboardSettings[feature] ?? true;
  };

  // Sync promotion form with fetched data
  useEffect(() => {
    if (promotion) {
      setPromoHeadline(promotion.headline || "");
      setPromoSubtext(promotion.subtext || "");
      setPromoIsActive(promotion.isActive ?? true);
      setPromoBgColor(promotion.backgroundColor || "#dc2626");
      setPromoTextColor(promotion.textColor || "#ffffff");
    }
  }, [promotion]);

  // Sync hero gallery settings with restaurant data
  useEffect(() => {
    if (restaurant) {
      setSelectedAnimationEffect(restaurant.heroAnimationStyle || "slide");
      setHeroSlideInterval(restaurant.heroSlideInterval || 5000);
      setHeroGradientStart(restaurant.heroGradientStart || "#dc2626");
      setHeroGradientMiddle(restaurant.heroGradientMiddle || "#f97316");
      setHeroGradientEnd(restaurant.heroGradientEnd || "#fbbf24");
      setDeliveryHoursMonThu(restaurant.deliveryHoursMonThu || "12PM - 10:30PM");
      setDeliveryHoursFriSat(restaurant.deliveryHoursFriSat || "12PM - 11:30PM");
      setDeliveryHoursSun(restaurant.deliveryHoursSun || "12PM - 10:30PM");
      setCollectionHoursMonThu(restaurant.collectionHoursMonThu || "12PM - 10:30PM");
      setCollectionHoursFriSat(restaurant.collectionHoursFriSat || "12PM - 11:30PM");
      setCollectionHoursSun(restaurant.collectionHoursSun || "12PM - 10:30PM");
      setTawaHeroImage(restaurant.tawaHeroImage || "");
      setTawaHeroVideo(restaurant.tawaHeroVideo || "");
      // Emparo hero
      setEmparoHeroImage(restaurant.emparoHeroImage || "");
      setEmparoHeroVideo(restaurant.emparoHeroVideo || "");
      // Welcome slider images
      setWelcomeSliderImages(Array.isArray(restaurant.welcomeSliderImages) ? restaurant.welcomeSliderImages : []);
      // Collection discount
      setCollectionDiscountPercent(restaurant.collectionDiscountPercent ?? 10);
      setCollectionDiscountMinimum(String(restaurant.collectionDiscountMinimum ?? "15.00"));
      // Delivery time
      setDeliveryTimeMinutes((restaurant as any).deliveryTimeMinutes ?? 45);
      // Branch details
      setEditBranchAddress(restaurant.address || "");
      setEditBranchEmail(restaurant.email || "");
      setEditBranchPhone(restaurant.phone || "");
      setEditSupplierOrderFromEmail(restaurant.supplierOrderFromEmail || "");
      setEditCuisineType(restaurant.cuisineType || "");
      setEditTagline(restaurant.tagline || "");
      // Theme colors
      setPrimaryColor(restaurant.primaryColor || "#8B0000");
      setSecondaryColor(restaurant.secondaryColor || "#FFD700");
      setAccentColor(restaurant.accentColor || "#4A0E4E");
      setHeaderBgColor(restaurant.headerBgColor || "#1a1a2e");
      setCardBgColor(restaurant.cardBgColor || "#ffffff");
      setButtonColor(restaurant.buttonColor || "#dc2626");
      setTextColor(restaurant.textColor || "#ffffff");
      setHeroVideoUrl(restaurant.heroVideoUrl || "");
      setHeroGifUrl(restaurant.heroGifUrl || "");
    }
  }, [restaurant]);

  const updateOrderMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "new" | "preparing" | "ready" | "completed" }) =>
      updateOrderStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders", restaurantId] });
      // Refresh restaurant data when order is completed to update saved totals
      if (variables.status === "completed") {
        queryClient.invalidateQueries({ queryKey: ["/api/restaurants", slug] });
      }
    },
  });

  const deleteOrderMutation = useMutation({
    mutationFn: (id: string) => deleteOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders", restaurantId] });
    },
  });

  // Manager approves waiter order
  const approveWaiterOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const res = await fetch(`/api/orders/${orderId}/manager-approve`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to approve order");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders", restaurantId] });
      toast({ title: "Order Approved!", description: "Order sent to kitchen" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to approve order", variant: "destructive" });
    }
  });

  // Manager rejects waiter order
  const rejectWaiterOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const res = await fetch(`/api/orders/${orderId}/manager-reject`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to reject order");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders", restaurantId] });
      toast({ title: "Order Rejected", description: "Order has been cancelled" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to reject order", variant: "destructive" });
    }
  });

  const updateBookingMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "pending" | "confirmed" | "cancelled" }) =>
      updateBookingStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings", restaurantId] });
    },
  });

  const deleteBookingMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/bookings/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error("Failed to delete booking");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings", restaurantId] });
      toast({ title: "Booking Deleted", description: "The booking has been removed." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete booking", variant: "destructive" });
    }
  });

  // Toggle accepting orders (wall switch)
  const toggleAcceptingOrdersMutation = useMutation({
    mutationFn: (acceptingOrders: boolean) => 
      updateRestaurant(restaurantId!, { acceptingOrders }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurants", slug] });
      toast({
        title: data.acceptingOrders ? "✅ Now Accepting Orders" : "🚫 Orders Paused",
        description: data.acceptingOrders 
          ? "Customers can now place orders on your menu page." 
          : "Your menu page will show 'Not accepting orders'.",
        variant: data.acceptingOrders ? "default" : "destructive"
      });
    },
  });

  const isAcceptingOrders = restaurant?.acceptingOrders ?? true;

  const deleteCustomerMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/customers/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({ title: "Customer deleted successfully" });
    },
  });

  useEffect(() => {
    if (!restaurantId) return;
    
    const ws = connectWebSocket(restaurantId, (data) => {
      if (data.type === "NEW_ORDER" || data.type === "PENDING_APPROVAL_ORDER") {
        queryClient.invalidateQueries({ queryKey: ["/api/orders", restaurantId] });
        if (soundEnabled) {
          playAlarm();
          setIsRinging(true);
          setAlarmFlash(true);
          
          // Voice alert - speak the custom message
          const voiceEnabled = (restaurant as any)?.voiceAlertEnabled ?? true;
          const voiceMessage = (restaurant as any)?.voiceAlertMessage || "New order received";
          const voiceRate = parseFloat((restaurant as any)?.voiceAlertRate) || 1.0;
          const voicePitch = parseFloat((restaurant as any)?.voiceAlertPitch) || 1.0;
          
          if (voiceEnabled && 'speechSynthesis' in window) {
            setTimeout(() => {
              window.speechSynthesis.cancel();
              const utterance = new SpeechSynthesisUtterance(voiceMessage);
              utterance.rate = voiceRate;
              utterance.pitch = voicePitch;
              utterance.volume = 1;
              window.speechSynthesis.speak(utterance);
            }, 500);
          }
        }
        const isCardOrder = data.type === "PENDING_APPROVAL_ORDER";
        toast({
          title: isCardOrder ? "💳 NEW CARD ORDER!" : "🚨 NEW ORDER RECEIVED!",
          description: isCardOrder ? "Card payment received - approve to capture payment." : "Check the dashboard immediately.",
          variant: "destructive"
        });
      } else if (data.type === "NEW_BOOKING") {
        queryClient.invalidateQueries({ queryKey: ["/api/bookings", restaurantId] });
        toast({
          title: "New Booking Request!",
          description: "A customer wants to reserve a table.",
        });
      } else if (data.type === "driver_accepted") {
        queryClient.invalidateQueries({ queryKey: ["/api/orders", restaurantId] });
        toast({
          title: "Order accepted. Driver is on the way.",
          description: `${data.driverName || 'Driver'} has accepted the delivery.`,
        });
      } else if (data.type === "driver_rejected") {
        queryClient.invalidateQueries({ queryKey: ["/api/orders", restaurantId] });
        toast({
          title: "Delivery Declined",
          description: `${data.driverName || 'Driver'} has declined the delivery. Please assign another driver.`,
          variant: "destructive",
        });
      } else if (data.type === "DELIVERY_STATUS_UPDATE") {
        queryClient.invalidateQueries({ queryKey: ["/api/orders", restaurantId] });
        if (data.status === 'accepted') {
          toast({
            title: "Driver Accepted Order!",
            description: `${data.driverInfo?.name || 'A driver'} is coming to pick up the order.`,
          });
        } else if (data.status === 'picked_up') {
          toast({
            title: "Order Picked Up",
            description: "Driver has picked up the order and is on the way to customer.",
          });
        } else if (data.status === 'delivering') {
          toast({
            title: "On The Way",
            description: "Driver is delivering the order to the customer.",
          });
        } else if (data.status === 'completed') {
          toast({
            title: "Delivery Complete",
            description: "Order has been delivered successfully.",
          });
        } else if (data.status === 'returned') {
          toast({
            title: "Order Returned",
            description: data.driverNotes ? `Driver returned: ${data.driverNotes}` : "Driver has returned the order. Please assign another driver.",
            variant: "destructive",
          });
        }
      } else if (data.type === "incoming_call") {
        // Incoming phone call from Twilio
        setIncomingCall({
          callSid: data.callSid,
          callerNumber: data.callerNumber,
          customer: data.customer,
          timestamp: data.timestamp,
        });
        // Play notification sound
        if (soundEnabled) {
          playAlarm();
        }
        toast({
          title: "📞 Incoming Call!",
          description: data.customer?.name 
            ? `${data.customer.name} is calling` 
            : `Unknown caller: ${data.callerNumber}`,
        });
        // Auto-dismiss after 30 seconds
        setTimeout(() => {
          setIncomingCall(prev => prev?.callSid === data.callSid ? null : prev);
        }, 30000);
      }
    });

    return () => ws.close();
  }, [restaurantId]);

  useEffect(() => {
    // Trigger alarm for NEW orders and PENDING_APPROVAL orders (card payments awaiting manager approval)
    const newOrderIds = orders.filter(o => (o.status === "new" || o.status === "pending_approval") && !o.isArchived).map(o => o.id);
    const unacknowledgedNewOrders = newOrderIds.filter(id => !acknowledgedOrders.has(id));
    const hasUnacknowledgedOrders = unacknowledgedNewOrders.length > 0;
    
    if (hasUnacknowledgedOrders && soundEnabled && !isRinging) {
      playAlarm();
      setIsRinging(true);
      setAlarmFlash(true);
      
      // Voice alert - speak the custom message
      const voiceEnabled = (restaurant as any)?.voiceAlertEnabled ?? true;
      const voiceMessage = (restaurant as any)?.voiceAlertMessage || "New order received";
      const voiceRate = parseFloat((restaurant as any)?.voiceAlertRate) || 1.0;
      const voicePitch = parseFloat((restaurant as any)?.voiceAlertPitch) || 1.0;
      
      if (voiceEnabled && 'speechSynthesis' in window) {
        setTimeout(() => {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(voiceMessage);
          utterance.rate = voiceRate;
          utterance.pitch = voicePitch;
          utterance.volume = 1;
          window.speechSynthesis.speak(utterance);
        }, 500);
      }
    } else if ((!hasUnacknowledgedOrders || !soundEnabled) && isRinging) {
      stopAlarm();
      setIsRinging(false);
      setAlarmFlash(false);
    }
  }, [orders, soundEnabled, playAlarm, stopAlarm, isRinging, acknowledgedOrders]);

  useEffect(() => {
    if (!alarmFlash) return;
    const interval = setInterval(() => {
      document.body.classList.toggle("alarm-flash");
    }, 500);
    return () => {
      clearInterval(interval);
      document.body.classList.remove("alarm-flash");
    };
  }, [alarmFlash]);

  const handleAcceptOrder = async (id: string) => {
    const order = orders.find(o => o.id === id);
    
    try {
      // Backend handles payment capture for card orders automatically
      await updateOrderStatus(id, "preparing");
      
      if (order?.stripePaymentId && order.paymentMethod === 'card') {
        toast({
          title: "Order Accepted & Payment Captured",
          description: `Card payment of ${currencySymbol}${order.total} has been charged.`,
        });
      } else {
        toast({
          title: "Order Accepted",
          description: `Order moved to preparation.`,
        });
      }
      
      
      
      // Refresh orders to get updated status
      queryClient.invalidateQueries({ queryKey: ["/api/orders", restaurantId] });
    } catch (error: any) {
      toast({
        title: "Failed to Accept Order",
        description: error.message || "Could not accept order",
        variant: "destructive",
      });
    }
  };

  const handleRejectOrder = async (id: string) => {
    const order = orders.find(o => o.id === id);
    
    if (order?.stripePaymentId && order.paymentMethod === 'card') {
      try {
        await cancelPayment(order.stripePaymentId, id, order.restaurantId);
        toast({
          title: "Payment Cancelled",
          description: `Card payment authorization has been released. Customer will not be charged.`,
        });
      } catch (error: any) {
        console.warn("Payment cancel failed (proceeding with rejection):", error.message);
        toast({
          title: "Payment Cancel Notice",
          description: "Could not auto-cancel payment (may need manual refund). Order will still be rejected.",
        });
      }
    }
    
    // Delete the order after successfully rejecting payment (or if cash order)
    deleteOrderMutation.mutate(id);
    toast({
      title: "Order Rejected",
      description: `Order has been rejected and removed.`,
    });
  };

  const handleStopAlarm = () => {
    stopAlarm();
    setIsRinging(false);
    setAlarmFlash(false);
    
    // Acknowledge current new AND pending_approval orders so alarm won't play for them again
    // But keep soundEnabled = true so new orders will still trigger alarm
    const currentNewOrderIds = orders.filter(o => o.status === "new" || o.status === "pending_approval").map(o => o.id);
    setAcknowledgedOrders(prev => {
      const newSet = new Set(prev);
      currentNewOrderIds.forEach(id => newSet.add(id));
      return newSet;
    });
    
    toast({
      title: "Alarm Stopped",
      description: "Sound stopped. New orders will still trigger the alarm!",
    });
  };
  
  const handleBookingAction = (id: string, action: 'confirm' | 'cancel') => {
    if (action === 'confirm') {
      updateBookingMutation.mutate({ 
        id, 
        status: 'confirmed' 
      });
      toast({
        title: "Booking Confirmed",
        description: `Booking has been confirmed.`,
      });
    } else {
      updateBookingMutation.mutate({ 
        id, 
        status: 'cancelled' 
      });
      toast({
        title: "Booking Cancelled",
        description: `Booking has been declined.`,
      });
    }
  };
  
  const confirmBookingWithWhatsApp = async () => {
    if (!confirmingBooking || !restaurant) return;
    
    const booking = confirmingBooking;
    const totalGuests = (booking.adults || booking.guests || 0) + (booking.children || 0) + (booking.infants || 0);
    
    const message = `Hello ${booking.customerName}!

Your booking at *${restaurant.name}* has been confirmed!

Booking Details:
- Date: ${booking.date}
- Time: ${booking.time}
- Guests: ${totalGuests} (${booking.adults || booking.guests || 0} Adults${booking.children ? `, ${booking.children} Children` : ''}${booking.infants ? `, ${booking.infants} Infants` : ''})
${bookingTableLabel ? `- Table: ${bookingTableLabel}` : ''}

Address:
${restaurant.address}

We look forward to seeing you!

Thank you for choosing ${restaurant.name}.`;

    updateBookingMutation.mutate({ 
      id: booking.id, 
      status: 'confirmed' 
    });
    
    const phoneNumber = booking.phone.replace(/[^0-9+]/g, '').replace(/^\+/, '');
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    toast({
      title: "Booking Confirmed!",
      description: "WhatsApp opened with confirmation message.",
    });
    
    setConfirmingBooking(null);
    setBookingTableLabel("");
  };

  const handleStatusChange = async (id: string, status: "new" | "preparing" | "ready" | "completed") => {
    const order = orders.find(o => o.id === id);
    
    // If changing to preparing (accepting) and order was paid by card, capture the payment (using restaurant-specific Stripe keys)
    if (status === "preparing" && order?.stripePaymentId && order.paymentMethod === 'card' && (order.status === 'new' || order.status === 'pending_approval')) {
      try {
        await capturePayment(order.stripePaymentId, id, order.restaurantId);
        toast({
          title: "Payment Captured",
          description: `Card payment of ${currencySymbol}${order.total} has been charged.`,
        });
      } catch (error: any) {
        toast({
          title: "Payment Capture Failed",
          description: error.message || "Could not capture card payment",
          variant: "destructive",
        });
        return; // Don't change status if payment capture fails
      }
    }
    
    updateOrderMutation.mutate({ id, status });
  };

  const handleDeleteOrder = (id: string) => {
    deleteOrderMutation.mutate(id);
    toast({
      title: "Order Deleted",
      description: "The completed order has been removed.",
    });
  };

  const handleUpdateDeliveryTime = async (orderId: string, minutes: number, message?: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          estimatedDeliveryMinutes: minutes,
          statusMessage: message || null,
        }),
      });
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
        toast({
          title: "Delivery Time Updated",
          description: `Customer will see: Today - ${minutes} mins${message ? ` (${message})` : ''}`,
        });
      } else {
        throw new Error("Failed to update");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update delivery time",
        variant: "destructive",
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("shopRestaurantId");
    localStorage.removeItem("shopRestaurantName");
    localStorage.removeItem("shopRestaurantSlug");
    navigate("/shop-login");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "Link copied to clipboard" });
  };

  const handleMenuImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const isVideo = file.type.startsWith('video/');
    const maxSize = isVideo ? 50 * 1024 * 1024 : 20 * 1024 * 1024;
    
    if (file.size > maxSize) {
      toast({ title: "File too large", description: isVideo ? "Maximum video size is 50MB" : "Maximum image size is 20MB", variant: "destructive" });
      return;
    }
    
    setIsUploadingMenuImage(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const data = await response.json();
        setNewMenuItemImage(data.url);
        toast({ title: isVideo ? "Video Uploaded" : "Image Uploaded", description: "File uploaded successfully!" });
      } else {
        toast({ title: "Upload Failed", description: "Could not upload file", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Upload Failed", description: "Could not upload file", variant: "destructive" });
    } finally {
      setIsUploadingMenuImage(false);
    }
  };

  const handleMenuVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('video/')) {
      toast({ title: "Invalid File", description: "Please select a video file (MP4, WebM)", variant: "destructive" });
      return;
    }
    
    if (file.size > 50 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum video size is 50MB", variant: "destructive" });
      return;
    }
    
    setIsUploadingMenuVideo(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const data = await response.json();
        if (isEdit) {
          setEditMenuItemVideo(data.url);
        } else {
          setNewMenuItemVideo(data.url);
        }
        toast({ title: "Video Uploaded", description: "Video uploaded successfully!" });
      } else {
        toast({ title: "Upload Failed", description: "Could not upload video", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Upload Failed", description: "Could not upload video", variant: "destructive" });
    } finally {
      setIsUploadingMenuVideo(false);
    }
  };

  const handleToggleAvailability = async (menuItem: MenuItem) => {
    try {
      await updateMenuItem(menuItem.id, { available: !menuItem.available });
      queryClient.invalidateQueries({ queryKey: ["/api/menu", restaurantId] });
      toast({ 
        title: menuItem.available ? "Item Disabled" : "Item Enabled", 
        description: `${menuItem.name} is now ${menuItem.available ? "sold out" : "available"}` 
      });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update item", variant: "destructive" });
    }
  };

  const handleInlinePriceUpdate = async (menuItem: MenuItem) => {
    let newPrice = editingPrices[menuItem.id];
    if (!newPrice) {
      setEditingPrices(prev => {
        const updated = { ...prev };
        delete updated[menuItem.id];
        return updated;
      });
      return;
    }

    // Clean up the price input - remove £ symbol, "p" suffix, and trim
    newPrice = newPrice.trim().replace(/^£/, '').replace(/p$/i, '');
    
    // If empty after cleaning, cancel
    if (!newPrice) {
      setEditingPrices(prev => {
        const updated = { ...prev };
        delete updated[menuItem.id];
        return updated;
      });
      return;
    }

    // Check if it's the same price (compare as numbers)
    const oldPriceNum = parseFloat(menuItem.price);
    const newPriceNum = parseFloat(newPrice);
    
    if (!isNaN(oldPriceNum) && !isNaN(newPriceNum) && oldPriceNum === newPriceNum) {
      setEditingPrices(prev => {
        const updated = { ...prev };
        delete updated[menuItem.id];
        return updated;
      });
      toast({ title: "No Change", description: "Price is the same" });
      return;
    }

    try {
      await updateMenuItem(menuItem.id, { price: newPrice });
      queryClient.invalidateQueries({ queryKey: ["/api/menu", restaurantId] });
      toast({ title: "Price Updated", description: `${menuItem.name} price updated to ${currencySymbol}${newPrice}` });
      setEditingPrices(prev => {
        const updated = { ...prev };
        delete updated[menuItem.id];
        return updated;
      });
    } catch (error) {
      console.error("Price update error:", error);
      toast({ title: "Error", description: "Failed to update price", variant: "destructive" });
    }
  };

  const handleDeleteMenuItem = async (menuItem: MenuItem) => {
    try {
      await deleteMenuItem(menuItem.id);
      queryClient.invalidateQueries({ queryKey: ["/api/menu", restaurantId] });
      toast({ title: "Menu Item Deleted", description: `${menuItem.name} has been removed.` });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete menu item", variant: "destructive" });
    }
  };

  const handleSaveMenuItemEdit = async (itemId: string) => {
    if (!editMenuItemName.trim()) {
      toast({ title: "Required", description: "Item name is required.", variant: "destructive" });
      return;
    }

    try {
      await updateMenuItem(itemId, {
        name: editMenuItemName.trim(),
        description: editMenuItemDescription.trim() || "",
        image: editMenuItemImage.trim() || "",
        videoUrl: editMenuItemVideo.trim() || null,
        category: editMenuItemCategory || undefined,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/menu", restaurantId] });
      toast({ title: "Menu Item Updated", description: `${editMenuItemName} has been updated.` });
      setEditingMenuItemId(null);
      setEditMenuItemName("");
      setEditMenuItemDescription("");
      setEditMenuItemImage("");
      setEditMenuItemVideo("");
      setEditMenuItemCategory("");
    } catch (error) {
      console.error("Menu item update error:", error);
      toast({ title: "Error", description: "Failed to update menu item", variant: "destructive" });
    }
  };

  const handleSaveCategoryEdit = async (category: { id: string; name: string; icon: string; dbId?: number; restaurantId?: number | null }) => {
    if (!editingCategoryName.trim() || !restaurantId) {
      toast({ title: "Required", description: "Category name is required.", variant: "destructive" });
      return;
    }
    // Check for duplicate category name (case-insensitive)
    const existingCategory = dynamicCategories.find(
      cat => cat.name.toLowerCase() === editingCategoryName.trim().toLowerCase() && 
             cat.id !== category.id
    );
    if (existingCategory) {
      toast({ 
        title: "Duplicate Category", 
        description: `A category named "${editingCategoryName}" already exists.`, 
        variant: "destructive" 
      });
      return;
    }

    try {
      const response = await fetch(`/api/menu-categories/${category.dbId || category.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editingCategoryName.trim(),
          icon: editingCategoryIcon.trim() || "🍽️",
          restaurantId: restaurantId,
        }),
      });

      if (!response.ok) throw new Error("Failed to update category");

      queryClient.invalidateQueries({ queryKey: ["/api/menu-categories", restaurantId] });
      toast({ title: "Category Updated", description: `${editingCategoryName} has been updated.` });
      setEditingCategoryId(null);
      setEditingCategoryName("");
      setEditingCategoryIcon("");
    } catch (error) {
      console.error("Category update error:", error);
      toast({ title: "Error", description: "Failed to update category", variant: "destructive" });
    }
  };

  const handleDeleteCategory = async () => {
    if (!deleteCategoryConfirm) return;
    
    setIsDeletingCategory(true);
    try {
      const categoryId = deleteCategoryConfirm.dbId || deleteCategoryConfirm.id;
      const response = await fetch(`/api/menu-categories/${categoryId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete category");

      queryClient.invalidateQueries({ queryKey: ["/api/menu-categories", restaurantId] });
      toast({ title: "Category Deleted", description: `${deleteCategoryConfirm.name} has been deleted.` });
      setDeleteCategoryConfirm(null);
    } catch (error) {
      console.error("Category delete error:", error);
      toast({ title: "Error", description: "Failed to delete category", variant: "destructive" });
    } finally {
      setIsDeletingCategory(false);
    }
  };

  const handleAddMenuItem = async () => {
    if (!newMenuItemName || !newMenuItemPrice || !restaurantId) {
      toast({ title: "Required Fields", description: "Please enter name and price.", variant: "destructive" });
      return;
    }
    if (!newMenuItemCategory) {
      toast({ title: "Category Required", description: "Please select a category.", variant: "destructive" });
      return;
    }
    // Check for duplicate item name in same category (case-insensitive for both name and category)
    const existingItem = menuItems.find(
      item => item.name.toLowerCase() === newMenuItemName.toLowerCase() && 
              item.category?.toLowerCase() === newMenuItemCategory.toLowerCase()
    );
    if (existingItem) {
      toast({ 
        title: "Duplicate Item", 
        description: `"${newMenuItemName}" already exists in this category.`, 
        variant: "destructive" 
      });
      return;
    }

    try {
      await createMenuItem({
        restaurantId,
        name: newMenuItemName,
        description: newMenuItemDescription || "",
        price: newMenuItemPrice,
        category: newMenuItemCategory,
        image: newMenuItemImage || "",
        videoUrl: newMenuItemVideo || null,
        available: true,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/menu", restaurantId] });
      toast({ title: "Menu Item Added", description: `${newMenuItemName} has been added.` });
      setAddingMenuItem(false);
      setNewMenuItemName("");
      setNewMenuItemPrice("");
      setNewMenuItemCategory("");
      setNewMenuItemDescription("");
      setNewMenuItemImage("");
      setNewMenuItemVideo("");
    } catch (error) {
      toast({ title: "Error", description: "Failed to add menu item", variant: "destructive" });
    }
  };

  const handleSavePromotion = async () => {
    if (!promoHeadline || !restaurantId) {
      toast({ title: "Required", description: "Please enter a promotion headline.", variant: "destructive" });
      return;
    }

    try {
      if (promotion) {
        await updatePromotion(promotion.id, {
          headline: promoHeadline,
          subtext: promoSubtext || null,
          isActive: promoIsActive,
          backgroundColor: promoBgColor,
          textColor: promoTextColor,
        });
        toast({ title: "Promotion Updated", description: "Your promotion has been updated." });
      } else {
        await createPromotion({
          restaurantId,
          headline: promoHeadline,
          subtext: promoSubtext || null,
          isActive: promoIsActive,
          backgroundColor: promoBgColor,
          textColor: promoTextColor,
        });
        toast({ title: "Promotion Created", description: "Your promotion is now active." });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/promotions", restaurantId] });
    } catch (error) {
      toast({ title: "Error", description: "Failed to save promotion", variant: "destructive" });
    }
  };

  const handleDeletePromotion = async () => {
    if (!promotion) return;
    
    try {
      await deletePromotion(promotion.id);
      setPromoHeadline("");
      setPromoSubtext("");
      setPromoIsActive(true);
      setPromoBgColor("#dc2626");
      setPromoTextColor("#ffffff");
      queryClient.invalidateQueries({ queryKey: ["/api/promotions", restaurantId] });
      toast({ title: "Promotion Deleted", description: "The promotion has been removed." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete promotion", variant: "destructive" });
    }
  };

  const handleAddHeroImage = async () => {
    if (!restaurantId || !newHeroImageUrl) return;
    
    try {
      await createHeroImage(restaurantId, {
        imageUrl: newHeroImageUrl,
        label: newHeroImageLabel || null,
        isActive: true,
      });
      setNewHeroImageUrl("");
      setNewHeroImageLabel("");
      queryClient.invalidateQueries({ queryKey: ["/api/hero-images", restaurantId] });
      toast({ title: "Image Added", description: "Your hero image has been added." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to add hero image", variant: "destructive" });
    }
  };

  const handleDeleteHeroImage = async (id: string) => {
    try {
      await deleteHeroImage(id);
      queryClient.invalidateQueries({ queryKey: ["/api/hero-images", restaurantId] });
      toast({ title: "Image Deleted", description: "The hero image has been removed." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete hero image", variant: "destructive" });
    }
  };

  const handleToggleHeroImage = async (id: string, isActive: boolean) => {
    try {
      await updateHeroImage(id, { isActive });
      queryClient.invalidateQueries({ queryKey: ["/api/hero-images", restaurantId] });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update hero image", variant: "destructive" });
    }
  };

  const handleSaveHeroSettings = async () => {
    if (!restaurantId) return;
    
    try {
      const res = await fetch(`/api/restaurants/${restaurantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          heroAnimationStyle: selectedAnimationEffect,
          heroSlideInterval: heroSlideInterval,
          heroGradientStart: heroGradientStart,
          heroGradientMiddle: heroGradientMiddle,
          heroGradientEnd: heroGradientEnd,
        }),
      });
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ["/api/restaurants", slug] });
        toast({ title: "Settings Saved", description: "Your hero carousel settings have been updated." });
      } else {
        throw new Error("Failed to update");
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to save hero settings", variant: "destructive" });
    }
  };

  const handleSaveBranchDetails = async () => {
    if (!restaurantId) return;
    
    try {
      const res = await fetch(`/api/restaurants/${restaurantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          address: editBranchAddress,
          email: editBranchEmail,
          phone: editBranchPhone,
          supplierOrderFromEmail: editSupplierOrderFromEmail || null,
          cuisineType: editCuisineType || null,
          tagline: editTagline || null,
        }),
      });
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ["/api/restaurants", slug] });
        toast({ title: "Branch Details Updated", description: "Your branch details have been saved." });
      } else {
        throw new Error("Failed to update");
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to save branch details", variant: "destructive" });
    }
  };

  const moveHeroImage = async (index: number, direction: 'up' | 'down') => {
    if (!restaurantId) return;
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= heroImages.length) return;
    
    const newOrder = [...heroImages];
    [newOrder[index], newOrder[newIndex]] = [newOrder[newIndex], newOrder[index]];
    const imageIds = newOrder.map(img => img.id);
    
    try {
      await reorderHeroImages(restaurantId, imageIds);
      queryClient.invalidateQueries({ queryKey: ["/api/hero-images", restaurantId] });
    } catch (error) {
      toast({ title: "Error", description: "Failed to reorder images", variant: "destructive" });
    }
  };

  const handleAddPopularItem = async () => {
    if (!restaurantId || !newPopularItemName || !newPopularItemImageUrl) {
      toast({ title: "Missing Fields", description: "Please add both an image and a category name", variant: "destructive" });
      return;
    }
    
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/popular-items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newPopularItemName,
          imageUrl: newPopularItemImageUrl,
          linkUrl: newPopularItemLinkUrl || null,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save");
      }
      
      setNewPopularItemName("");
      setNewPopularItemImageUrl("");
      setNewPopularItemLinkUrl("");
      queryClient.invalidateQueries({ queryKey: ["/api/popular-items", restaurantId] });
      toast({ title: "Category Saved!", description: "Your category has been saved and will appear on the landing page." });
    } catch (error: any) {
      toast({ title: "Save Failed", description: error.message || "Failed to save category", variant: "destructive" });
    }
  };

  const handleDeletePopularItem = async (id: string) => {
    try {
      await fetch(`/api/popular-items/${id}`, { method: "DELETE" });
      queryClient.invalidateQueries({ queryKey: ["/api/popular-items", restaurantId] });
      toast({ title: "Item Deleted", description: "The popular item has been removed." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete popular item", variant: "destructive" });
    }
  };

  const pendingApprovalOrders = orders.filter(o => o.status === "pending_approval" && !o.isArchived);
  // Include pending_approval orders in activeOrders so they show up in the dashboard
  const activeOrders = orders.filter(o => o.status !== "completed" && !o.isArchived);
  const newOrders = orders.filter(o => (o.status === "new" || o.status === "pending_approval") && !o.isArchived);
  // Visible completed orders (not archived) - for display in the list
  const visibleCompletedOrders = orders.filter(o => o.status === "completed" && !o.isArchived);
  // All completed orders (including archived) - for totals calculation
  const allCompletedOrders = orders.filter(o => o.status === "completed");
  // All orders (for total count and revenue display)
  const allOrders = orders.filter(o => !o.isArchived);
  const allOrdersTotal = allOrders.reduce((sum, order) => sum + Number(order.total), 0);
  
  // Order breakdown by type (for stat cards)
  const takeawayOrders = allCompletedOrders.filter(o => o.type === 'takeaway');
  const deliveryOrders = allCompletedOrders.filter(o => o.type === 'delivery');
  const dineInOrders = allCompletedOrders.filter(o => o.type === 'dine-in');
  
  const onlineTakeawayCount = takeawayOrders.length + deliveryOrders.length;
  const onlineTakeawayTotal = [...takeawayOrders, ...deliveryOrders].reduce((sum, o) => sum + Number(o.total), 0);
  const dineInCount = dineInOrders.length;
  const dineInTotal = dineInOrders.reduce((sum, o) => sum + Number(o.total), 0);
  const pendingBookingsCount = bookings.filter(b => b.status === 'pending').length;
  const confirmedBookingsCount = bookings.filter(b => b.status === 'confirmed').length;

  if (loadingRestaurant) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading branch dashboard...</p>
        </div>
      </div>
    );
  }

  if (restaurantError || !restaurant) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
          <h2 className="text-xl font-bold">Branch Not Found</h2>
          <p className="text-muted-foreground">The branch you're looking for doesn't exist or you don't have access.</p>
          <Link href="/shop-login">
            <Button>Go to Shop Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-screen bg-background text-foreground font-sans flex flex-col overflow-hidden dashboard-premium ${alarmFlash ? 'animate-pulse' : ''}`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap');
        
        .dashboard-premium { font-family: 'Montserrat', sans-serif; }
        
        .alarm-flash {
          animation: flash-red 0.5s ease-in-out;
        }
        @keyframes flash-red {
          0%, 100% { background-color: transparent; }
          50% { background-color: rgba(239, 68, 68, 0.1); }
        }
        
        /* Premium Dashboard Styles */
        .premium-header {
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
          border-bottom: 1px solid rgba(99, 102, 241, 0.2);
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.4), 0 0 40px rgba(99, 102, 241, 0.1);
        }
        
        .glass-button {
          background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.15);
          box-shadow: 0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .glass-button:hover {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 12px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2), 0 0 20px rgba(99, 102, 241, 0.3);
          border-color: rgba(99, 102, 241, 0.4);
        }
        
        /* Animated Border Keyframes */
        @keyframes border-rotate {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        /* 3D VIP Tab Cards */
        .vip-tab-3d {
          position: relative;
          background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
          border-radius: 16px;
          box-shadow: 
            0 10px 30px rgba(0,0,0,0.5),
            0 6px 10px rgba(0,0,0,0.3),
            inset 0 2px 0 rgba(255,255,255,0.1),
            inset 0 -2px 0 rgba(0,0,0,0.3);
          transform: perspective(1000px) rotateX(2deg);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
        }
        .vip-tab-3d::before {
          content: '';
          position: absolute;
          inset: -3px;
          background: linear-gradient(90deg, #3b82f6, #8b5cf6, #06b6d4, #10b981, #f59e0b, #ef4444, #3b82f6);
          background-size: 300% 100%;
          animation: border-rotate 3s linear infinite;
          border-radius: 18px;
          z-index: -1;
          opacity: 0.7;
        }
        .vip-tab-3d::after {
          content: '';
          position: absolute;
          inset: 2px;
          background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
          border-radius: 14px;
          z-index: -1;
        }
        .vip-tab-3d:hover {
          transform: perspective(1000px) rotateX(0deg) translateY(-4px);
          box-shadow: 
            0 20px 40px rgba(0,0,0,0.6),
            0 10px 20px rgba(0,0,0,0.4),
            inset 0 2px 0 rgba(255,255,255,0.15);
        }
        
        /* Individual Color Tab Cards with Animated Borders */
        .tab-card-blue, .tab-card-green, .tab-card-amber, .tab-card-cyan, .tab-card-purple, .tab-card-orange {
          position: relative;
          overflow: hidden;
        }
        .tab-card-blue::before, .tab-card-green::before, .tab-card-amber::before, .tab-card-cyan::before, .tab-card-purple::before, .tab-card-orange::before {
          content: '';
          position: absolute;
          inset: -2px;
          background: conic-gradient(from var(--angle, 0deg), transparent 0%, currentColor 10%, transparent 20%);
          animation: rotate-border 3s linear infinite;
          border-radius: inherit;
          z-index: -1;
        }
        @property --angle {
          syntax: '<angle>';
          initial-value: 0deg;
          inherits: false;
        }
        @keyframes rotate-border {
          to { --angle: 360deg; }
        }
        @keyframes slide-line {
          0% { left: -25%; }
          50% { left: 100%; }
          100% { left: -25%; }
        }
        .tab-card-blue {
          background: linear-gradient(135deg, #1e3a5f 0%, #1e40af 50%, #0f172a 100%);
          border: 2px solid #3b82f6;
          box-shadow: 0 8px 30px rgba(59,130,246,0.3), inset 0 1px 0 rgba(255,255,255,0.1);
          color: #3b82f6;
        }
        .tab-card-green {
          background: linear-gradient(135deg, #14532d 0%, #166534 50%, #0f172a 100%);
          border: 2px solid #10b981;
          box-shadow: 0 8px 30px rgba(16,185,129,0.3), inset 0 1px 0 rgba(255,255,255,0.1);
          color: #10b981;
        }
        .tab-card-amber {
          background: linear-gradient(135deg, #451a03 0%, #b45309 50%, #0f172a 100%);
          border: 2px solid #f59e0b;
          box-shadow: 0 8px 30px rgba(245,158,11,0.3), inset 0 1px 0 rgba(255,255,255,0.1);
          color: #f59e0b;
        }
        .tab-card-pink {
          background: linear-gradient(135deg, #831843 0%, #db2777 50%, #0f172a 100%);
          border: 2px solid #ec4899;
          box-shadow: 0 8px 30px rgba(236,72,153,0.3), inset 0 1px 0 rgba(255,255,255,0.1);
          color: #ec4899;
        }
        .tab-card-cyan {
          background: linear-gradient(135deg, #083344 0%, #0891b2 50%, #0f172a 100%);
          border: 2px solid #06b6d4;
          box-shadow: 0 8px 30px rgba(6,182,212,0.3), inset 0 1px 0 rgba(255,255,255,0.1);
          color: #06b6d4;
        }
        .tab-card-purple {
          background: linear-gradient(135deg, #2e1065 0%, #7c3aed 50%, #0f172a 100%);
          border: 2px solid #8b5cf6;
          box-shadow: 0 8px 30px rgba(139,92,246,0.3), inset 0 1px 0 rgba(255,255,255,0.1);
          color: #8b5cf6;
        }
        .tab-card-orange {
          background: linear-gradient(135deg, #431407 0%, #ea580c 50%, #0f172a 100%);
          border: 2px solid #f97316;
          box-shadow: 0 8px 30px rgba(249,115,22,0.3), inset 0 1px 0 rgba(255,255,255,0.1);
          color: #f97316;
        }
        
        /* Active state with glow */
        [data-state="active"].tab-card-blue { box-shadow: 0 0 40px rgba(59,130,246,0.6), 0 10px 30px rgba(59,130,246,0.4); }
        [data-state="active"].tab-card-green { box-shadow: 0 0 40px rgba(16,185,129,0.6), 0 10px 30px rgba(16,185,129,0.4); }
        [data-state="active"].tab-card-amber { box-shadow: 0 0 40px rgba(245,158,11,0.6), 0 10px 30px rgba(245,158,11,0.4); }
        [data-state="active"].tab-card-cyan { box-shadow: 0 0 40px rgba(6,182,212,0.6), 0 10px 30px rgba(6,182,212,0.4); }
        [data-state="active"].tab-card-purple { box-shadow: 0 0 40px rgba(139,92,246,0.6), 0 10px 30px rgba(139,92,246,0.4); }
        [data-state="active"].tab-card-orange { box-shadow: 0 0 40px rgba(249,115,22,0.6), 0 10px 30px rgba(249,115,22,0.4); }
        
        .stat-card {
          background: linear-gradient(145deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          box-shadow: 0 8px 30px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08);
          transition: all 0.3s ease;
        }
        .stat-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.5);
        }
        
        .neon-blue { color: #60a5fa; text-shadow: 0 0 15px rgba(59, 130, 246, 0.8), 0 0 30px rgba(59, 130, 246, 0.4); }
        .neon-green { color: #34d399; text-shadow: 0 0 15px rgba(16, 185, 129, 0.8), 0 0 30px rgba(16, 185, 129, 0.4); }
        .neon-purple { color: #a78bfa; text-shadow: 0 0 15px rgba(139, 92, 246, 0.8), 0 0 30px rgba(139, 92, 246, 0.4); }
        .neon-amber { color: #fbbf24; text-shadow: 0 0 15px rgba(245, 158, 11, 0.8), 0 0 30px rgba(245, 158, 11, 0.4); }
        .neon-cyan { color: #22d3ee; text-shadow: 0 0 15px rgba(6, 182, 212, 0.8), 0 0 30px rgba(6, 182, 212, 0.4); }
        .neon-orange { color: #fb923c; text-shadow: 0 0 15px rgba(249, 115, 22, 0.8), 0 0 30px rgba(249, 115, 22, 0.4); }
        
        /* Tablet responsive fixes (7" and 9" tablets: 600-1024px) */
        @media (min-width: 600px) and (max-width: 1024px) {
          .tablet-scroll-x { overflow-x: auto; -webkit-overflow-scrolling: touch; }
          .tablet-stack { flex-direction: column !important; }
          .tablet-full { width: 100% !important; }
          .tablet-text-sm { font-size: 0.875rem !important; }
          .tablet-p-2 { padding: 0.5rem !important; }
          .tablet-gap-2 { gap: 0.5rem !important; }
        }
        /* Enable horizontal scroll on tables only on small tablets and mobile */
        @media (max-width: 768px) {
          .overflow-x-auto table, .table-responsive { display: block; overflow-x: auto; -webkit-overflow-scrolling: touch; }
        }
        
        /* Print Styles for Allergen Matrix */
        @media print {
          body * { visibility: hidden !important; }
          #allergen-matrix-print, #allergen-matrix-print * { visibility: visible !important; }
          #allergen-matrix-print { 
            position: absolute !important; 
            left: 0 !important; 
            top: 0 !important; 
            width: 100% !important;
            background: white !important;
            padding: 20px !important;
          }
          #allergen-matrix-print .hidden.print\\:block { display: block !important; }
          #allergen-matrix-print button { display: none !important; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>

      {isRinging && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          <div className="absolute inset-0 bg-red-500/10 animate-pulse" />
          <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-auto">
            <div className="bg-red-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-bounce">
              <Plane className="h-6 w-6 animate-pulse" />
              <span className="font-bold text-lg">NEW ORDER - ATTENTION REQUIRED!</span>
              <Button 
                size="sm" 
                variant="secondary" 
                className="bg-white text-red-600 hover:bg-gray-100"
                onClick={handleStopAlarm}
                data-testid="button-stop-alarm"
              >
                Stop Alarm
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tablet/Mobile Welcome Overlay */}
      {showWelcomeOverlay && isTabletOrMobile && (
        <div className="fixed inset-0 z-[100] bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center p-6">
          <div className="text-center max-w-md w-full space-y-6">
            {/* Logo */}
            <div className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-2xl">
              <span className="text-4xl font-bold text-white">{restaurantName.charAt(0)}</span>
            </div>
            
            {/* Branch Name */}
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">{restaurantName}</h1>
              <p className="text-purple-200 text-sm">Branch Dashboard</p>
            </div>
            
            {/* Contact Info */}
            {restaurant?.phone && (
              <div className="flex items-center justify-center gap-2 text-purple-200">
                <Phone className="h-4 w-4" />
                <span className="text-sm">{restaurant.phone}</span>
              </div>
            )}
            {restaurant?.address && (
              <div className="flex items-center justify-center gap-2 text-purple-200">
                <MapPin className="h-4 w-4" />
                <span className="text-sm text-center">{restaurant.address}</span>
              </div>
            )}
            
            {/* Install to Home Screen Button */}
            {deferredPrompt && (
              <Button
                onClick={handleInstallPWA}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold py-4 rounded-xl shadow-lg"
                data-testid="button-install-pwa"
              >
                <Tablet className="h-5 w-5 mr-2" />
                Install to Home Screen
              </Button>
            )}
            
            {/* iOS Install Instructions */}
            {!deferredPrompt && /iPad|iPhone|iPod/.test(navigator.userAgent) && (
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-left text-white text-sm">
                <p className="font-semibold mb-2">📱 Install on iPad/iPhone:</p>
                <ol className="list-decimal list-inside space-y-1 text-purple-100">
                  <li>Tap the Share button (box with arrow)</li>
                  <li>Scroll down and tap "Add to Home Screen"</li>
                  <li>Tap "Add" to install</li>
                </ol>
              </div>
            )}
            
            {/* Open Dashboard Button */}
            <Button
              onClick={dismissWelcome}
              className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white font-bold py-4 rounded-xl shadow-lg text-lg"
              data-testid="button-open-dashboard"
            >
              Open Dashboard
            </Button>
            
            <p className="text-purple-300 text-xs">
              Optimized for tablets • Works offline
            </p>
          </div>
        </div>
      )}

      {/* Audio Enable Banner for Mobile/Tablet (shows after welcome overlay dismissed) */}
      {!showWelcomeOverlay && isTabletOrMobile && !audioUnlocked && soundEnabled && (
        <div className="fixed bottom-0 left-0 right-0 z-[90] bg-gradient-to-r from-orange-500 to-red-600 p-4 shadow-2xl animate-bounce">
          <div className="max-w-lg mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-white">
              <div className="bg-white/20 rounded-full p-2">
                <Volume2 className="h-6 w-6" />
              </div>
              <div>
                <p className="font-bold text-sm">Enable Order Alerts</p>
                <p className="text-xs text-white/80">Tap to hear alarm when orders arrive</p>
              </div>
            </div>
            <Button
              onClick={unlockAudio}
              className="bg-white text-orange-600 hover:bg-gray-100 font-bold px-6 py-3 rounded-xl shadow-lg"
              data-testid="button-enable-sound"
            >
              <Bell className="h-5 w-5 mr-2" />
              Enable
            </Button>
          </div>
        </div>
      )}

      <header className="premium-header px-3 md:px-6 py-2 md:py-3 sticky top-0 z-40" style={{background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)', borderBottom: '2px solid rgba(6, 182, 212, 0.3)'}}>
        {/* Top Row: Logo and Name on Left */}
        <div className="flex items-center justify-between gap-3 mb-2 md:mb-3">
          <div className="flex items-center gap-3 md:gap-4">
            <div className={`h-12 w-12 md:h-14 md:w-14 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-600 flex items-center justify-center font-bold text-white text-xl md:text-2xl flex-shrink-0 shadow-xl border-2 border-cyan-400/50 ${newOrders.length > 0 ? 'animate-pulse ring-4 ring-cyan-500/50' : ''}`} style={{boxShadow: '0 0 30px rgba(6, 182, 212, 0.5)'}}>
              {restaurantName.charAt(0)}
            </div>
            <div>
              <h1 className="font-bold text-lg md:text-2xl text-white tracking-tight" style={{textShadow: '0 0 20px rgba(6, 182, 212, 0.5)'}}>{restaurantName}</h1>
              <span className="text-[10px] md:text-xs text-cyan-400 uppercase tracking-widest font-semibold">Branch Dashboard</span>
            </div>
            {newOrders.length > 0 && (
              <Badge className="bg-gradient-to-r from-red-500 to-rose-600 text-white animate-pulse text-xs hidden sm:flex shadow-lg border-0" style={{boxShadow: '0 0 15px rgba(239, 68, 68, 0.5)'}}>
                {newOrders.length} NEW!
              </Badge>
            )}
            {/* Bookings notification badge - clickable to go to bookings tab */}
            {pendingBookingsCount > 0 && (
              <button 
                onClick={() => setActiveTab("bookings")}
                className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg animate-pulse hover:scale-105 transition-transform"
                style={{boxShadow: '0 0 15px rgba(245, 158, 11, 0.6)'}}
                data-testid="button-header-bookings"
              >
                <Calendar className="h-3.5 w-3.5" />
                {pendingBookingsCount} Booking{pendingBookingsCount > 1 ? 's' : ''}
              </button>
            )}
          </div>
          
          {/* ON/OFF Switch, Sound, Logout on right */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Compact Wall Switch */}
            <button
              onClick={() => toggleAcceptingOrdersMutation.mutate(!isAcceptingOrders)}
              disabled={toggleAcceptingOrdersMutation.isPending}
              className={`
                relative flex items-center justify-center w-12 h-8 md:w-16 md:h-10 rounded-lg border-2 shadow-lg transition-all duration-300
                ${isAcceptingOrders 
                  ? 'bg-gradient-to-b from-zinc-700 to-zinc-800 border-emerald-500' 
                  : 'bg-gradient-to-b from-zinc-800 to-zinc-900 border-red-500'
                }
              `}
              data-testid="button-wall-switch"
            >
              <div className={`
                w-8 h-5 md:w-10 md:h-6 rounded-md shadow-inner transition-all duration-200 flex items-center justify-center
                ${isAcceptingOrders 
                  ? 'bg-gradient-to-b from-emerald-400 to-emerald-600' 
                  : 'bg-gradient-to-b from-red-500 to-red-700'
                }
              `}>
                <div className={`w-5 h-0.5 md:w-6 md:h-1 rounded-full ${isAcceptingOrders ? 'bg-emerald-200' : 'bg-red-300'}`} />
              </div>
              <div className={`
                absolute -top-1 -right-1 w-2 h-2 md:w-3 md:h-3 rounded-full border border-zinc-600
                ${isAcceptingOrders 
                  ? 'bg-emerald-500 animate-pulse shadow-lg' 
                  : 'bg-red-500 shadow-lg'
                }
              `} />
            </button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`h-8 w-8 md:h-10 md:w-10 rounded-full border border-slate-600 ${!soundEnabled ? "text-muted-foreground" : "text-cyan-400"}`}
              data-testid="button-toggle-sound"
            >
              {soundEnabled ? <Volume2 className="h-4 w-4 md:h-5 md:w-5" /> : <VolumeX className="h-4 w-4 md:h-5 md:w-5" />}
            </Button>
            
            {twilioSettings && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => toggleTwilioMutation.mutate(!(twilioSettings?.enabled ?? true))}
                disabled={toggleTwilioMutation.isPending}
                className={`h-8 w-8 md:h-10 md:w-10 rounded-full border border-slate-600 ${
                  twilioSettings?.enabled 
                    ? "text-green-400 border-green-500/50 bg-green-500/10" 
                    : "text-muted-foreground"
                }`}
                title={twilioSettings?.enabled ? "Caller ID ON - Click to turn off" : "Caller ID OFF - Click to turn on"}
                data-testid="button-toggle-caller-id"
              >
                <Phone className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
            )}
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 md:h-10 md:w-10 rounded-full border border-slate-600 text-red-400 hover:text-red-300 hover:bg-red-500/10"
              onClick={handleLogout}
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
          </div>
        </div>

        {/* Bottom Row: Navigation Buttons centered */}
        <div className="flex items-center justify-center flex-wrap gap-2 sm:gap-3 md:gap-4 lg:gap-5 py-2">
          {/* Branch Dashboard Button - Shows mobile-friendly orders view */}
          <div 
            onClick={() => setShowMobileOrdersView(!showMobileOrdersView)}
            className={`nav-card-3d cursor-pointer ${showMobileOrdersView ? 'nav-card-pink ring-2 ring-white/50' : 'nav-card-pink'}`} 
            data-testid="button-branch-dashboard"
          >
            <div className="shimmer-overlay"></div>
            <ClipboardCheck className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-white drop-shadow-lg" />
            <span className="font-bold text-[10px] sm:text-xs md:text-sm text-white mt-1 sm:mt-2">Branch</span>
            <span className="text-[7px] sm:text-[8px] md:text-[10px] uppercase tracking-wider text-white/80 font-medium">Dashboard</span>
          </div>

          {isKitchenDisplayEnabled && (
            <Link href={`/kitchen/${slug}`}>
              <div className="nav-card-3d nav-card-orange" data-testid="button-kitchen-header">
                <div className="shimmer-overlay"></div>
                <UtensilsCrossed className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-white drop-shadow-lg" />
                <span className="font-bold text-[10px] sm:text-xs md:text-sm text-white mt-1 sm:mt-2">Kitchen</span>
                <span className="text-[7px] sm:text-[8px] md:text-[10px] uppercase tracking-wider text-white/80 font-medium">Display</span>
              </div>
            </Link>
          )}

          {isSupplierOrderingEnabled && (
            <Link href={`/suppliers/${slug}`}>
              <div className="nav-card-3d nav-card-purple" data-testid="button-suppliers">
                <div className="shimmer-overlay"></div>
                <Package className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-white drop-shadow-lg" />
                <span className="font-bold text-[10px] sm:text-xs md:text-sm text-white mt-1 sm:mt-2">Suppliers</span>
                <span className="text-[7px] sm:text-[8px] md:text-[10px] uppercase tracking-wider text-white/80 font-medium">Orders</span>
              </div>
            </Link>
          )}

          <Link href={`/finances/${slug}`}>
            <div className="nav-card-3d nav-card-green" data-testid="button-finances">
              <div className="shimmer-overlay"></div>
              <Coins className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-white drop-shadow-lg" />
              <span className="font-bold text-[10px] sm:text-xs md:text-sm text-white mt-1 sm:mt-2">Finances</span>
              <span className="text-[7px] sm:text-[8px] md:text-[10px] uppercase tracking-wider text-white/80 font-medium">Dashboard</span>
            </div>
          </Link>

          <Link href={`/branch-settings/${slug}`}>
            <div className="nav-card-3d nav-card-cyan" data-testid="button-my-branch">
              <div className="shimmer-overlay"></div>
              <Store className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-white drop-shadow-lg" />
              <span className="font-bold text-[10px] sm:text-xs md:text-sm text-white mt-1 sm:mt-2">Branch</span>
              <span className="text-[7px] sm:text-[8px] md:text-[10px] uppercase tracking-wider text-white/80 font-medium">Settings</span>
            </div>
          </Link>

          {isWaiterAppEnabled && (
            <Link href={`/waiter/${slug}`}>
              <div className="nav-card-3d nav-card-amber" data-testid="button-waiter">
                <div className="shimmer-overlay"></div>
                <Users className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-white drop-shadow-lg" />
                <span className="font-bold text-[10px] sm:text-xs md:text-sm text-white mt-1 sm:mt-2">Waiter</span>
                <span className="text-[7px] sm:text-[8px] md:text-[10px] uppercase tracking-wider text-white/80 font-medium">Service</span>
              </div>
            </Link>
          )}

          {isEposSystemEnabled && (
            <Link href={`/epos/${slug}`}>
              <div className="nav-card-3d nav-card-blue" data-testid="button-epos">
                <div className="shimmer-overlay"></div>
                <Calculator className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-white drop-shadow-lg" />
                <span className="font-bold text-[10px] sm:text-xs md:text-sm text-white mt-1 sm:mt-2">EPOS</span>
                <span className="text-[7px] sm:text-[8px] md:text-[10px] uppercase tracking-wider text-white/80 font-medium">Till</span>
              </div>
            </Link>
          )}

          {isTelephoneOrderingEnabled && (
            <div 
              onClick={() => setShowTelephoneOrderModal(true)}
              className="nav-card-3d nav-card-rose cursor-pointer" 
              data-testid="button-telephone-order"
            >
              <div className="shimmer-overlay"></div>
              <Phone className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-white drop-shadow-lg" />
              <span className="font-bold text-[10px] sm:text-xs md:text-sm text-white mt-1 sm:mt-2">Phone</span>
              <span className="text-[7px] sm:text-[8px] md:text-[10px] uppercase tracking-wider text-white/80 font-medium">Order</span>
            </div>
          )}

          {isTelephoneOrderingEnabled && (
            <div 
              onClick={() => setShowCallHistoryModal(true)}
              className="nav-card-3d nav-card-indigo cursor-pointer" 
              data-testid="button-call-log"
            >
              <div className="shimmer-overlay"></div>
              <Phone className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-white drop-shadow-lg" />
              <span className="font-bold text-[10px] sm:text-xs md:text-sm text-white mt-1 sm:mt-2">Call</span>
              <span className="text-[7px] sm:text-[8px] md:text-[10px] uppercase tracking-wider text-white/80 font-medium">Log</span>
            </div>
          )}

          {isDriverAppEnabled && (
            <Link href={`/drivers/${slug}`}>
              <div className="nav-card-3d nav-card-teal relative" data-testid="button-drivers-header">
                <div className="shimmer-overlay"></div>
                <Car className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-white drop-shadow-lg" />
                <span className="font-bold text-[10px] sm:text-xs md:text-sm text-white mt-1 sm:mt-2">{onDutyDrivers.length}/{branchDrivers.length}</span>
                <span className="text-[7px] sm:text-[8px] md:text-[10px] uppercase tracking-wider text-white/80 font-medium">Drivers</span>
                {(() => {
                  const rejectedCount = orders.filter(o => o.type === 'delivery' && !o.isArchived && (o as any).delivery?.deliveryStatus === 'rejected').length;
                  const returnedCount = orders.filter(o => o.type === 'delivery' && !o.isArchived && (o as any).delivery?.deliveryStatus === 'returned').length;
                  const totalAlerts = rejectedCount + returnedCount;
                  if (totalAlerts === 0) return null;
                  return (
                    <span className={`absolute -top-2 -right-2 h-5 w-5 sm:h-6 sm:w-6 ${rejectedCount > 0 ? 'bg-red-600' : 'bg-orange-500'} text-white text-[10px] sm:text-xs font-bold rounded-full flex items-center justify-center animate-pulse shadow-xl`} style={{boxShadow: '0 0 15px rgba(239,68,68,0.7)'}}>
                      {totalAlerts}
                    </span>
                  );
                })()}
              </div>
            </Link>
          )}

        </div>
      </header>

      {/* Incoming Call Notification Card - Caller ID from Twilio */}
      {incomingCall && (
        <div className="mx-3 md:mx-6 mt-2 animate-pulse">
          <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 rounded-xl p-4 shadow-2xl border border-green-400/50" style={{boxShadow: '0 0 30px rgba(16, 185, 129, 0.4)'}}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 bg-white/20 rounded-full flex items-center justify-center animate-bounce">
                  <Phone className="h-7 w-7 text-white" />
                </div>
                <div>
                  <div className="text-white/80 text-sm font-medium">Incoming Call</div>
                  <div className="text-white text-xl font-bold">
                    {incomingCall.customer?.name || 'Unknown Caller'}
                  </div>
                  <div className="text-white/90 text-lg font-medium">{incomingCall.callerNumber}</div>
                  {incomingCall.customer?.address && (
                    <div className="text-white/70 text-sm mt-1 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {incomingCall.customer.address}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Start telephone order with this caller */}
                <Button
                  onClick={() => {
                    setTelephoneNumber(incomingCall.callerNumber);
                    if (incomingCall.customer) {
                      setTelephoneCustomer(incomingCall.customer as any);
                      setTelephoneCustomerName(incomingCall.customer.name || '');
                      setTelephoneAddress(incomingCall.customer.address || '');
                    }
                    setShowTelephoneOrderModal(true);
                    setIncomingCall(null);
                  }}
                  className="bg-white text-green-700 hover:bg-green-50 font-bold px-6 py-3 text-lg shadow-lg"
                  data-testid="button-start-call-order"
                >
                  <Phone className="h-5 w-5 mr-2" />
                  Take Order
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIncomingCall(null)}
                  className="text-white/80 hover:text-white hover:bg-white/20"
                  data-testid="button-dismiss-call"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Orders View - Full screen view for mobile/tablet */}
      {showMobileOrdersView && (
        <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-y-auto">
          {/* Header with back button */}
          <div className="sticky top-0 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700 p-4 flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setShowMobileOrdersView(false)}
              className="h-10 w-10 rounded-full border border-slate-600 text-white hover:bg-slate-700"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-white">{restaurantName}</h1>
              <p className="text-xs text-slate-400">Branch Dashboard</p>
            </div>
            {/* Alarm Icon with notification count - Click to dismiss */}
            <button 
              className="relative p-2 rounded-full hover:bg-slate-700 transition-colors"
              onClick={() => {
                document.querySelectorAll('audio').forEach(a => { a.pause(); a.currentTime = 0; });
                setAlarmFlash(false);
                const orderIds = newOrders.map(o => o.id);
                setAcknowledgedOrders(prev => new Set([...Array.from(prev), ...orderIds]));
                toast({
                  title: "Alarm Dismissed",
                  description: "You can now interact with the orders.",
                });
              }}
              data-testid="button-dismiss-alarm"
            >
              <Bell className={`h-6 w-6 ${newOrders.length > 0 ? 'text-red-400 animate-pulse' : 'text-slate-400'}`} />
              {newOrders.length > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse shadow-lg" style={{boxShadow: '0 0 10px rgba(239,68,68,0.7)'}}>
                  {newOrders.length}
                </span>
              )}
            </button>
          </div>
          
          {/* Alarm Popup Overlay - Shows when new orders arrive */}
          {newOrders.length > 0 && alarmFlash && (
            <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
              <div className="bg-gradient-to-br from-red-900 via-red-800 to-red-900 rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-red-500 animate-pulse">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-4 bg-red-600 rounded-full flex items-center justify-center animate-bounce">
                    <Bell className="h-10 w-10 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">New Order!</h2>
                  <p className="text-red-200 mb-4">{newOrders.length} new order{newOrders.length > 1 ? 's' : ''} waiting</p>
                  <Button
                    className="w-full bg-white text-red-700 hover:bg-red-100 font-bold py-3 text-lg"
                    onClick={() => {
                      document.querySelectorAll('audio').forEach(a => { a.pause(); a.currentTime = 0; });
                      setAlarmFlash(false);
                      const orderIds = newOrders.map(o => o.id);
                      setAcknowledgedOrders(prev => new Set([...Array.from(prev), ...orderIds]));
                    }}
                    data-testid="button-close-alarm-popup"
                  >
                    <X className="h-5 w-5 mr-2" />
                    Dismiss Alarm
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {/* Search Order by Number */}
          <div className="px-4 py-2 bg-slate-800/50">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search order #010..."
                value={orderSearchQuery}
                onChange={(e) => setOrderSearchQuery(e.target.value)}
                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 pl-10"
                data-testid="input-search-order"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">#</span>
            </div>
          </div>

          {/* Stats Row */}
          <div className="p-4">
            <div className="flex flex-wrap gap-2 justify-center mb-4">
              <div className={`tab-card-blue rounded-xl flex flex-col items-center justify-center w-[80px] h-[65px] cursor-pointer ${mobileDashboardTab === 'active' ? 'ring-2 ring-blue-400' : ''}`} onClick={() => setMobileDashboardTab("active")}>
                <span className="text-xl font-bold text-white">{activeOrders.length}</span>
                <span className="text-[9px] text-blue-200 uppercase font-semibold">Active</span>
              </div>
              <div className={`tab-card-green rounded-xl flex flex-col items-center justify-center w-[80px] h-[65px] cursor-pointer ${mobileDashboardTab === 'completed' ? 'ring-2 ring-green-400' : ''}`} onClick={() => setMobileDashboardTab("completed")}>
                <span className="text-xl font-bold text-white">{visibleCompletedOrders.length}</span>
                <span className="text-[9px] text-green-200 uppercase font-semibold">Done</span>
              </div>
              {isTableBookingEnabled && (
                <div className={`tab-card-amber rounded-xl flex flex-col items-center justify-center w-[80px] h-[65px] cursor-pointer ${mobileDashboardTab === 'bookings' ? 'ring-2 ring-amber-400' : ''}`} onClick={() => setMobileDashboardTab("bookings")}>
                  <span className="text-xl font-bold text-white">{bookings.filter(b => b.status === 'pending').length}</span>
                  <span className="text-[9px] text-amber-200 uppercase font-semibold">Bookings</span>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2 justify-center mb-4">
              {isDriverAppEnabled && (
                <div className={`tab-card-cyan rounded-xl flex flex-col items-center justify-center w-[80px] h-[65px] cursor-pointer ${mobileDashboardTab === 'drivers' ? 'ring-2 ring-cyan-400' : ''}`} onClick={() => setMobileDashboardTab("drivers")}>
                  <Car className="h-5 w-5 text-white" />
                  <span className="text-[9px] text-cyan-200 uppercase font-semibold">Drivers</span>
                </div>
              )}
              <div className={`tab-card-purple rounded-xl flex flex-col items-center justify-center w-[80px] h-[65px] cursor-pointer ${mobileDashboardTab === 'customers' ? 'ring-2 ring-purple-400' : ''}`} onClick={() => setMobileDashboardTab("customers")}>
                <Users className="h-5 w-5 text-white" />
                <span className="text-[9px] text-purple-200 uppercase font-semibold">Customers</span>
              </div>
              {isAllergenManagementEnabled && (
                <div className={`tab-card-amber rounded-xl flex flex-col items-center justify-center w-[80px] h-[65px] cursor-pointer ${mobileDashboardTab === 'allergens' ? 'ring-2 ring-amber-400' : ''}`} onClick={() => setMobileDashboardTab("allergens")}>
                  <AlertTriangle className="h-5 w-5 text-white" />
                  <span className="text-[9px] text-amber-200 uppercase font-semibold">Allergens</span>
                </div>
              )}
              {isWaiterAppEnabled && (
                <div className={`tab-card-orange rounded-xl flex flex-col items-center justify-center w-[80px] h-[65px] relative cursor-pointer ${mobileDashboardTab === 'waiter' ? 'ring-2 ring-orange-400' : ''}`} onClick={() => setMobileDashboardTab("waiter")}>
                  <span className="text-xl font-bold text-white">{pendingApprovalOrders.length}</span>
                  <span className="text-[9px] text-orange-200 uppercase font-semibold">Waiter</span>
                </div>
              )}
              {isTelephoneOrderingEnabled && (
                <div className={`tab-card-rose rounded-xl flex flex-col items-center justify-center w-[80px] h-[65px] relative cursor-pointer ${mobileDashboardTab === 'phone' ? 'ring-2 ring-rose-400' : ''}`} onClick={() => setMobileDashboardTab("phone")} style={{background: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)'}}>
                  <span className="text-xl font-bold text-white">{activeOrders.filter(o => (o as any).source === 'telephone').length}</span>
                  <span className="text-[9px] text-rose-200 uppercase font-semibold">Phone</span>
                </div>
              )}
            </div>

            {/* Stats Summary Cards */}
            <div className="flex flex-wrap gap-2 justify-center mb-4">
              <div className="stat-card flex-1 min-w-[100px] p-3" style={{borderLeft: '3px solid #06b6d4'}}>
                <div className="text-[9px] text-slate-400 uppercase">Online/Takeaway</div>
                <div className="flex items-center gap-1">
                  <span className="text-lg font-bold neon-cyan">{onlineTakeawayCount}</span>
                  <span className="text-cyan-300 text-xs">{currencySymbol}{onlineTakeawayTotal.toFixed(2)}</span>
                </div>
              </div>
              <div className="stat-card flex-1 min-w-[100px] p-3" style={{borderLeft: '3px solid #8b5cf6'}}>
                <div className="text-[9px] text-slate-400 uppercase">Dine-in</div>
                <div className="flex items-center gap-1">
                  <span className="text-lg font-bold neon-purple">{dineInCount}</span>
                  <span className="text-purple-300 text-xs">{currencySymbol}{dineInTotal.toFixed(2)}</span>
                </div>
              </div>
              <div className="stat-card flex-1 min-w-[100px] p-3" style={{borderLeft: '3px solid #10b981'}}>
                <div className="text-[9px] text-slate-400 uppercase">Total Today</div>
                <div className="flex items-center gap-1">
                  <span className="text-lg font-bold neon-green">{allCompletedOrders.length}</span>
                  <span className="text-emerald-300 text-xs">{currencySymbol}{allCompletedOrders.reduce((sum, o) => sum + Number(o.total), 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Content Area - Shows based on selected tab */}
          <div className="p-4 pb-24">
            {/* Search Results - Show when searching */}
            {orderSearchQuery.trim() && (() => {
              const rawSearch = orderSearchQuery.replace('#', '').trim();
              const searchTerm = rawSearch.replace(/^0+/, '') || rawSearch;
              const allOrdersForSearch = [...activeOrders, ...visibleCompletedOrders];
              const filteredOrders = allOrdersForSearch.filter(o => 
                String(o.orderNumber || '') === searchTerm || 
                String(o.orderNumber || '').includes(searchTerm) ||
                o.id.toString().includes(rawSearch.toLowerCase())
              );
              return (
                <>
                  <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-pink-500"></span>
                    Search Results ({filteredOrders.length})
                  </h2>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {filteredOrders.map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        onAccept={(id) => handleAcceptOrder(id)}
                        onReject={(id) => handleRejectOrder(id)}
                        onStatusChange={(id, status) => handleStatusChange(id, status)}
                        onDelete={(id) => handleDeleteOrder(id)}
                        currencySymbol={currencySymbol}
                        restaurantName={restaurantName}
                        restaurantAddress={restaurant?.address || ""}
                      />
                    ))}
                  </div>
                  {filteredOrders.length === 0 && (
                    <div className="text-center py-8 text-slate-400">
                      <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No orders found for "{orderSearchQuery}"</p>
                    </div>
                  )}
                </>
              );
            })()}

            {/* Active Orders */}
            {!orderSearchQuery.trim() && mobileDashboardTab === 'active' && (() => {
              const filteredOrders = activeOrders;
              return (
                <>
                  <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></span>
                    Active Orders ({activeOrders.length})
                  </h2>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {filteredOrders.map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        onAccept={(id) => handleAcceptOrder(id)}
                        onReject={(id) => handleRejectOrder(id)}
                        onStatusChange={(id, status) => handleStatusChange(id, status)}
                        onDelete={(id) => handleDeleteOrder(id)}
                        currencySymbol={currencySymbol}
                        restaurantName={restaurantName}
                        restaurantAddress={restaurant?.address || ""}
                      />
                    ))}
                  </div>
                  {filteredOrders.length === 0 && (
                    <div className="text-center py-8 text-slate-400">
                      <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No active orders</p>
                    </div>
                  )}
                </>
              );
            })()}

            {/* Completed Orders */}
            {!orderSearchQuery.trim() && mobileDashboardTab === 'completed' && (
              <>
                <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-green-500"></span>
                  Completed Orders ({visibleCompletedOrders.length})
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {visibleCompletedOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onAccept={(id) => handleAcceptOrder(id)}
                      onStatusChange={(id, status) => handleStatusChange(id, status)}
                      onDelete={(id) => handleDeleteOrder(id)}
                      currencySymbol={currencySymbol}
                      restaurantName={restaurantName}
                      restaurantAddress={restaurant?.address || ""}
                    />
                  ))}
                </div>
                {visibleCompletedOrders.length === 0 && (
                  <div className="text-center py-8 text-slate-400">
                    <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No completed orders</p>
                  </div>
                )}
              </>
            )}

            {/* Bookings */}
            {!orderSearchQuery.trim() && mobileDashboardTab === 'bookings' && (
              <>
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-amber-500"></span>
                  Bookings ({bookings.length})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {bookings.sort((a,b) => a.status === 'pending' ? -1 : 1).map((booking) => (
                    <Card key={booking.id} className={`border-t-4 ${booking.status === 'pending' ? 'border-t-amber-500 bg-gradient-to-b from-slate-800 to-slate-900' : booking.status === 'confirmed' ? 'border-t-emerald-500 bg-gradient-to-b from-slate-800/80 to-slate-900/80' : 'border-t-slate-500 bg-slate-800/50'} shadow-2xl rounded-xl`} data-testid={`mobile-card-booking-${booking.id}`}>
                      <CardContent className="p-4 sm:p-5 flex flex-col min-w-0">
                        <div className="flex justify-between items-start mb-3">
                          <Badge className={`text-sm sm:text-base px-3 sm:px-4 py-1 font-bold ${booking.status === 'confirmed' ? 'bg-green-600' : booking.status === 'pending' ? 'bg-amber-600 animate-pulse' : 'bg-red-600'}`}>
                            {booking.status.toUpperCase()}
                          </Badge>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                            onClick={() => {
                              if (confirm(`Delete booking for ${booking.customerName}?`)) {
                                deleteBookingMutation.mutate(booking.id);
                              }
                            }}
                            data-testid={`mobile-button-delete-booking-${booking.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <p className="text-white font-bold text-lg sm:text-xl text-center mb-1 break-words">
                          {booking.customerName}
                        </p>
                        
                        {booking.totalVisits > 0 && (
                          <div className="text-center mb-2">
                            <Badge variant="outline" className="text-xs sm:text-sm px-2 sm:px-3 py-0.5 bg-amber-500/10 text-amber-400 border-amber-500/30">
                              Returning Customer
                            </Badge>
                          </div>
                        )}
                        
                        <div className="text-center space-y-1 sm:space-y-2 mb-3 sm:mb-4">
                          <p className="text-base sm:text-lg text-white flex items-center justify-center gap-1 sm:gap-2">
                            <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-400 flex-shrink-0" /> {booking.date}
                          </p>
                          <p className="text-base sm:text-lg text-white flex items-center justify-center gap-1 sm:gap-2">
                            <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-400 flex-shrink-0" /> {booking.time}
                          </p>
                          <p className="text-xl sm:text-2xl text-emerald-400 font-bold mt-1 sm:mt-2">
                            {(booking.adults || booking.guests || 0) + (booking.children || 0) + (booking.infants || 0)} Guests
                          </p>
                        </div>

                        <a 
                          href={`tel:${booking.phone}`}
                          className="bg-blue-600 hover:bg-blue-700 text-white py-2 sm:py-3 rounded-xl text-sm sm:text-base font-bold flex items-center justify-center gap-1 sm:gap-2 mb-3 shadow-lg min-w-0 break-all"
                        >
                          <Phone className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" /> 
                          <span className="truncate">{booking.phone}</span>
                        </a>

                        <div className="mt-auto space-y-2">
                          {booking.status === 'pending' && (
                            <>
                              <Button 
                                className="w-full bg-green-600 hover:bg-green-700 text-sm sm:text-base h-10 sm:h-12 font-bold rounded-xl shadow-lg" 
                                onClick={() => handleBookingAction(booking.id, 'confirm')}
                                data-testid={`mobile-button-confirm-booking-${booking.id}`}
                              >
                                <Check className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2 flex-shrink-0" /> 
                                <span className="whitespace-nowrap">Confirm</span>
                              </Button>
                              <Button 
                                variant="outline" 
                                className="w-full border-slate-500 text-slate-300 text-sm sm:text-base h-10 sm:h-12 font-bold rounded-xl" 
                                onClick={() => handleBookingAction(booking.id, 'cancel')}
                                data-testid={`mobile-button-cancel-booking-${booking.id}`}
                              >
                                <X className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2 flex-shrink-0" /> Decline
                              </Button>
                            </>
                          )}

                          {booking.status === 'confirmed' && (
                            <div className="text-center text-emerald-400 text-base sm:text-lg font-bold py-3 sm:py-4 bg-emerald-500/10 rounded-xl flex items-center justify-center gap-2 border border-emerald-500/30">
                              <Check className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" /> Confirmed
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {bookings.length === 0 && (
                  <div className="text-center py-8 text-slate-400">
                    <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No bookings</p>
                  </div>
                )}
              </>
            )}

            {/* Drivers */}
            {!orderSearchQuery.trim() && mobileDashboardTab === 'drivers' && (
              <>
                <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-cyan-500"></span>
                  Drivers ({branchDrivers.length})
                </h2>
                <div className="space-y-3">
                  {branchDrivers.map((driver) => (
                    <Card key={driver.id} className="premium-card border-0">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${driver.isOnDuty ? 'bg-green-600' : 'bg-slate-600'}`}>
                              <Car className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <p className="text-white font-bold">{driver.name}</p>
                              <p className="text-slate-400 text-sm">{driver.phone}</p>
                            </div>
                          </div>
                          <Badge className={driver.isOnDuty ? 'bg-green-600' : 'bg-slate-600'}>
                            {driver.isOnDuty ? 'On Duty' : 'Off Duty'}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {branchDrivers.length === 0 && (
                  <div className="text-center py-8 text-slate-400">
                    <Car className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No drivers</p>
                  </div>
                )}
              </>
            )}

            {/* Customers */}
            {!orderSearchQuery.trim() && mobileDashboardTab === 'customers' && (
              <>
                <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-purple-500"></span>
                  Recent Customers
                </h2>
                <div className="space-y-3">
                  {orders.slice(0, 20).map((order) => (
                    <Card key={order.id} className="premium-card border-0">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-white font-bold">{order.customerName || 'Walk-in'}</p>
                            <p className="text-slate-400 text-sm">{(order as any).customerPhone || (order as any).phone || 'No phone'}</p>
                            <p className="text-purple-400 text-sm">Order #{order.orderNumber}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-white font-bold">{currencySymbol}{Number(order.total).toFixed(2)}</p>
                            <p className="text-slate-400 text-xs">{order.type}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {orders.length === 0 && (
                  <div className="text-center py-8 text-slate-400">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No customers</p>
                  </div>
                )}
              </>
            )}

            {/* Allergens */}
            {!orderSearchQuery.trim() && mobileDashboardTab === 'allergens' && (
              <>
                <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                  Orders with Allergens
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {orders.filter(o => (o as any).allergens && (o as any).allergens.length > 0).map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onAccept={(id) => handleAcceptOrder(id)}
                      onStatusChange={(id, status) => handleStatusChange(id, status)}
                      onDelete={(id) => handleDeleteOrder(id)}
                      currencySymbol={currencySymbol}
                      restaurantName={restaurantName}
                      restaurantAddress={restaurant?.address || ""}
                    />
                  ))}
                </div>
                {orders.filter(o => (o as any).allergens && (o as any).allergens.length > 0).length === 0 && (
                  <div className="text-center py-8 text-slate-400">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No orders with allergens</p>
                  </div>
                )}
              </>
            )}

            {/* Waiter Orders */}
            {!orderSearchQuery.trim() && mobileDashboardTab === 'waiter' && (
              <>
                <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                  Waiter Orders ({pendingApprovalOrders.length})
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {pendingApprovalOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onAccept={(id) => handleAcceptOrder(id)}
                      onReject={(id) => handleRejectOrder(id)}
                      onStatusChange={(id, status) => handleStatusChange(id, status)}
                      onDelete={(id) => handleDeleteOrder(id)}
                      currencySymbol={currencySymbol}
                      restaurantName={restaurantName}
                      restaurantAddress={restaurant?.address || ""}
                    />
                  ))}
                </div>
                {pendingApprovalOrders.length === 0 && (
                  <div className="text-center py-8 text-slate-400">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No pending waiter orders</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        {/* Fixed Tabs Navigation Bar */}
        <div className="flex-shrink-0 p-3 md:p-4 border-b border-slate-700/50" style={{background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)'}}>
          <div className="flex flex-col gap-3">
             <TabsList className="vip-tab-3d h-auto p-3 md:p-4 flex flex-col gap-3 w-full items-center justify-center">
              {/* Row 1: Main Order Tabs */}
              <div className="flex flex-wrap gap-2 md:gap-3 justify-center w-full">
                <TabsTrigger value="active" className="tab-card-blue rounded-xl flex flex-col items-center justify-center w-[90px] h-[70px] md:w-[110px] md:h-[80px] relative transition-all duration-300 hover:scale-105 hover:-translate-y-1">
                  <span className="text-xl md:text-2xl font-bold text-white drop-shadow-lg">{activeOrders.length}</span>
                  <span className="text-[10px] md:text-xs text-blue-200 uppercase tracking-wider font-semibold">Active</span>
                  {newOrders.length > 0 && (
                    <span className="absolute -top-2 -right-2 h-6 w-6 md:h-7 md:w-7 bg-gradient-to-r from-red-500 to-rose-600 text-white text-xs md:text-sm font-bold rounded-full flex items-center justify-center animate-pulse shadow-xl" style={{boxShadow: '0 0 20px rgba(239, 68, 68, 0.8)'}}>
                      {newOrders.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="completed" className="tab-card-green rounded-xl flex flex-col items-center justify-center w-[90px] h-[70px] md:w-[110px] md:h-[80px] transition-all duration-300 hover:scale-105 hover:-translate-y-1">
                  <span className="text-xl md:text-2xl font-bold text-white drop-shadow-lg">{visibleCompletedOrders.length}</span>
                  <span className="text-[10px] md:text-xs text-green-200 uppercase tracking-wider font-semibold">Done</span>
                </TabsTrigger>
                {isTableBookingEnabled && (
                  <TabsTrigger value="bookings" className="tab-card-amber rounded-xl flex flex-col items-center justify-center w-[90px] h-[70px] md:w-[110px] md:h-[80px] relative transition-all duration-300 hover:scale-105 hover:-translate-y-1">
                    <span className="text-xl md:text-2xl font-bold text-white drop-shadow-lg">{bookings.filter(b => b.status === 'pending').length}</span>
                    <span className="text-[10px] md:text-xs text-amber-200 uppercase tracking-wider font-semibold">Bookings</span>
                    {pendingBookingsCount > 0 && (
                      <span className="absolute -top-2 -right-2 h-6 w-6 md:h-7 md:w-7 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-xs md:text-sm font-bold rounded-full flex items-center justify-center animate-pulse shadow-xl" style={{boxShadow: '0 0 20px rgba(245, 158, 11, 0.8)'}}>
                        {pendingBookingsCount}
                      </span>
                    )}
                  </TabsTrigger>
                )}
                {isAllergenManagementEnabled && (
                  <Link href={`/dashboard/${slug}/allergens`}>
                    <div className="tab-card-pink rounded-xl flex flex-col items-center justify-center w-[90px] h-[70px] md:w-[110px] md:h-[80px] transition-all duration-300 hover:scale-105 hover:-translate-y-1 cursor-pointer">
                      <AlertTriangle className="h-6 w-6 md:h-7 md:w-7 text-white drop-shadow-lg" />
                      <span className="text-[10px] md:text-xs text-pink-200 uppercase tracking-wider font-semibold">Allergens</span>
                    </div>
                  </Link>
                )}
              </div>
              {/* Row 2: Secondary Tabs - Drivers, Customers, Waiter */}
              <div className="flex flex-wrap gap-2 md:gap-3 justify-center w-full">
                {(isDriverAppEnabled || isDeliveryTrackingEnabled) && (
                  <TabsTrigger value="drivers" className="tab-card-cyan rounded-xl flex flex-col items-center justify-center w-[90px] h-[70px] md:w-[110px] md:h-[80px] relative transition-all duration-300 hover:scale-105 hover:-translate-y-1" data-testid="tab-drivers">
                    <Car className="h-6 w-6 md:h-7 md:w-7 text-white drop-shadow-lg" />
                    <span className="text-[10px] md:text-xs text-cyan-200 uppercase tracking-wider font-semibold">Drivers</span>
                    {(() => {
                      const readyDeliveryCount = orders.filter(o => 
                        o.type === 'delivery' && 
                        !o.isArchived && 
                        (o.status === 'ready' || o.status === 'completed') &&
                        !(o as any).delivery?.deliveryStatus
                      ).length;
                      const rejectedCount = orders.filter(o => o.type === 'delivery' && !o.isArchived && (o as any).delivery?.deliveryStatus === 'rejected').length;
                      const returnedCount = orders.filter(o => o.type === 'delivery' && !o.isArchived && (o as any).delivery?.deliveryStatus === 'returned').length;
                      const totalAlerts = readyDeliveryCount + rejectedCount + returnedCount;
                      if (totalAlerts === 0) return null;
                      return (
                        <span className={`absolute -top-2 -right-2 h-6 w-6 md:h-7 md:w-7 ${rejectedCount > 0 || returnedCount > 0 ? 'bg-red-600' : 'bg-amber-500'} text-white text-xs md:text-sm font-bold rounded-full flex items-center justify-center animate-pulse shadow-xl`} style={{boxShadow: '0 0 15px rgba(239,68,68,0.7)'}}>
                          {totalAlerts}
                        </span>
                      );
                    })()}
                  </TabsTrigger>
                )}
                <TabsTrigger value="customers" className="tab-card-purple rounded-xl flex flex-col items-center justify-center w-[90px] h-[70px] md:w-[110px] md:h-[80px] transition-all duration-300 hover:scale-105 hover:-translate-y-1">
                  <Users className="h-6 w-6 md:h-7 md:w-7 text-white drop-shadow-lg" />
                  <span className="text-[10px] md:text-xs text-purple-200 uppercase tracking-wider font-semibold">Customers</span>
                </TabsTrigger>
                {isWaiterAppEnabled && (
                  <TabsTrigger value="pending_approval" className="tab-card-orange rounded-xl flex flex-col items-center justify-center w-[90px] h-[70px] md:w-[110px] md:h-[80px] relative transition-all duration-300 hover:scale-105 hover:-translate-y-1">
                    <span className="text-xl md:text-2xl font-bold text-white drop-shadow-lg">{pendingApprovalOrders.length}</span>
                    <span className="text-[10px] md:text-xs text-orange-200 uppercase tracking-wider font-semibold">Waiter</span>
                    {pendingApprovalOrders.length > 0 && (
                      <span className="absolute -top-2 -right-2 h-6 w-6 md:h-7 md:w-7 bg-gradient-to-r from-orange-500 to-red-600 text-white text-xs md:text-sm font-bold rounded-full flex items-center justify-center animate-pulse shadow-xl" style={{boxShadow: '0 0 20px rgba(249, 115, 22, 0.8)'}}>
                        {pendingApprovalOrders.length}
                      </span>
                    )}
                  </TabsTrigger>
                )}
              </div>
            </TabsList>
            <div className="flex items-center gap-3 md:gap-4 flex-wrap justify-center w-full">
              {/* Order Type Breakdown Cards - Premium Styled - Bigger Size - Centered */}
              <div className="stat-card w-[140px] h-[70px] md:w-[165px] md:h-[75px] lg:w-[180px] lg:h-[80px] flex flex-col items-center justify-center text-center" data-testid="stat-online-orders" style={{borderLeft: '4px solid #06b6d4'}}>
                <div className="text-[10px] md:text-xs text-slate-400 uppercase tracking-widest font-medium">Online/Takeaway</div>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <span className="text-xl md:text-2xl font-bold neon-cyan">{onlineTakeawayCount}</span>
                  <span className="text-cyan-300 text-sm md:text-base font-medium">{currencySymbol}{onlineTakeawayTotal.toFixed(2)}</span>
                </div>
              </div>
              <div className="stat-card w-[140px] h-[70px] md:w-[165px] md:h-[75px] lg:w-[180px] lg:h-[80px] flex flex-col items-center justify-center text-center" data-testid="stat-dinein-orders" style={{borderLeft: '4px solid #8b5cf6'}}>
                <div className="text-[10px] md:text-xs text-slate-400 uppercase tracking-widest font-medium">Dine-in</div>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <span className="text-xl md:text-2xl font-bold neon-purple">{dineInCount}</span>
                  <span className="text-purple-300 text-sm md:text-base font-medium">{currencySymbol}{dineInTotal.toFixed(2)}</span>
                </div>
              </div>
              <div className="stat-card w-[140px] h-[70px] md:w-[165px] md:h-[75px] lg:w-[180px] lg:h-[80px] flex flex-col items-center justify-center text-center" data-testid="stat-bookings" style={{borderLeft: '4px solid #f59e0b'}}>
                <div className="text-[10px] md:text-xs text-slate-400 uppercase tracking-widest font-medium">Bookings</div>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <span className="text-xl md:text-2xl font-bold neon-amber">{pendingBookingsCount}</span>
                  <span className="text-amber-300 text-sm md:text-base font-medium">{confirmedBookingsCount} conf</span>
                </div>
              </div>
              <div className="stat-card w-[140px] h-[70px] md:w-[165px] md:h-[75px] lg:w-[180px] lg:h-[80px] flex flex-col items-center justify-center text-center" data-testid="stat-total-revenue" style={{borderLeft: '4px solid #10b981'}}>
                <div className="text-[10px] md:text-xs text-slate-400 uppercase tracking-widest font-medium">Total Today</div>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <span className="text-xl md:text-2xl font-bold neon-green">{allCompletedOrders.length}</span>
                  <span className="text-emerald-300 text-sm md:text-base font-medium">{currencySymbol}{allCompletedOrders.reduce((sum, o) => sum + Number(o.total), 0).toFixed(2)}</span>
                </div>
              </div>
              <div className="text-sm text-slate-500 font-medium">
                {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </div>
            </div>
            
            {/* Animated 3D Line */}
            <div className="w-full h-1 mt-3 rounded-full overflow-hidden relative" style={{background: 'linear-gradient(90deg, transparent 0%, rgba(6,182,212,0.2) 50%, transparent 100%)'}}>
              <div className="animated-line-glow absolute h-full w-1/4 rounded-full" style={{
                background: 'linear-gradient(90deg, transparent, #06b6d4, #8b5cf6, #f59e0b, #10b981, transparent)',
                boxShadow: '0 0 20px rgba(6,182,212,0.8), 0 0 40px rgba(139,92,246,0.6), 0 0 60px rgba(245,158,11,0.4)',
                animation: 'slide-line 3s ease-in-out infinite'
              }} />
            </div>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-3 md:p-4 pb-24" style={{background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)'}}>
          {/* Pending Approval Tab - Waiter orders awaiting manager approval */}
          {isWaiterAppEnabled && (
          <TabsContent value="pending_approval" className="flex-1 mt-0">
            {pendingApprovalOrders.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-border rounded-xl bg-card/30">
                <ClipboardCheck className="h-12 w-12 mb-4 opacity-20" />
                <p className="text-xl font-medium">No waiter orders pending</p>
                <p className="text-sm">Orders from waiter tablets will appear here for approval</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {pendingApprovalOrders.map(order => (
                  <Card key={order.id} className="ring-2 ring-orange-500 rounded-xl bg-orange-500/5" data-testid={`card-pending-order-${order.id}`}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <Badge variant="outline" className="bg-orange-500/20 text-orange-400 border-orange-500/30 mb-2">
                            Awaiting Approval
                          </Badge>
                          <CardTitle className="text-lg">{order.customerName}</CardTitle>
                          <p className="text-xs text-muted-foreground">
                            {order.createdAt && new Date(order.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                        <span className="text-2xl font-bold text-orange-400">{currencySymbol}{Number(order.total).toFixed(2)}</span>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-4">
                      <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                        {(order as any).items?.map((item: any, idx: number) => (
                          <div key={idx} className="border-b border-border/50 pb-2">
                            <div className="flex justify-between text-sm">
                              <span>{item.quantity}x {item.name}</span>
                              <span className="text-muted-foreground">{currencySymbol}{Number(item.price).toFixed(2)}</span>
                            </div>
                            {item.notes && (
                              <div className="ml-4 mt-1 space-y-0.5">
                                {(() => {
                                  const notes = item.notes;
                                  const parts = notes.split(' | ');
                                  const elements: React.ReactNode[] = [];
                                  
                                  parts.forEach((part: string, partIdx: number) => {
                                    if (part.includes('EXTRAS:') || part.includes('EXTRA:')) {
                                      const extrasMatch = part.match(/EXTRAS?:\s*(.+)/i);
                                      if (extrasMatch) {
                                        const toppings = extrasMatch[1].split(',').map((t: string) => t.trim()).filter((t: string) => t);
                                        toppings.forEach((topping: string, tIdx: number) => {
                                          elements.push(
                                            <div
                                              key={`extra-${partIdx}-${tIdx}`}
                                              className="text-xs text-emerald-400 flex items-center gap-1"
                                            >
                                              <span>🍽️</span>
                                              <span>{topping}</span>
                                            </div>
                                          );
                                        });
                                      }
                                    } else if (part.trim()) {
                                      elements.push(
                                        <p key={`desc-${partIdx}`} className="text-xs text-amber-400">
                                          {part.trim()}
                                        </p>
                                      );
                                    }
                                  });
                                  
                                  return elements;
                                })()}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button 
                          variant="outline"
                          className="flex-1 border-red-500/50 text-red-400 hover:bg-red-500/20"
                          onClick={() => rejectWaiterOrderMutation.mutate(order.id)}
                          disabled={rejectWaiterOrderMutation.isPending}
                          data-testid={`button-reject-${order.id}`}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                        <Button 
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => approveWaiterOrderMutation.mutate(order.id)}
                          disabled={approveWaiterOrderMutation.isPending}
                          data-testid={`button-approve-${order.id}`}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Waiter Tablet Management Section */}
            <div className="mt-8">
              <div className="flex items-center gap-3 mb-4">
                <Tablet className="h-5 w-5 text-blue-400" />
                <h3 className="text-lg font-semibold">Waiter Tablets</h3>
                <Badge variant="outline" className="text-xs">
                  {waiterTablets.filter(t => t.assignedWaiterName).length} / {waiterTablets.length} in use
                </Badge>
                {waiterTablets.filter(t => t.assignedWaiterName).length > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="ml-auto text-xs border-orange-500/50 text-orange-400 hover:bg-orange-500/20"
                    onClick={() => releaseAllTabletsMutation.mutate()}
                    disabled={releaseAllTabletsMutation.isPending}
                    data-testid="button-release-all-tablets"
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Release All
                  </Button>
                )}
              </div>
              
              {waiterTablets.length === 0 ? (
                <div className="border-2 border-dashed border-border rounded-xl p-6 text-center text-muted-foreground bg-card/30">
                  <Tablet className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No waiter tablets configured for this branch</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {waiterTablets.map(tablet => (
                    <Card 
                      key={tablet.id} 
                      className={`${tablet.assignedWaiterName ? 'bg-blue-500/10 border-blue-500/30' : 'bg-card/50 border-border/50'}`}
                      data-testid={`card-tablet-${tablet.tabletNumber}`}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <Badge 
                            variant={tablet.assignedWaiterName ? "default" : "outline"} 
                            className={`text-xs ${tablet.assignedWaiterName ? 'bg-blue-600' : 'text-muted-foreground'}`}
                          >
                            Tablet {tablet.tabletNumber}
                          </Badge>
                          {tablet.orderCount && tablet.orderCount > 0 && (
                            <span className="text-xs text-muted-foreground">{tablet.orderCount} orders</span>
                          )}
                        </div>
                        
                        {tablet.assignedWaiterName ? (
                          <>
                            <p className="font-medium text-sm truncate" title={tablet.assignedWaiterName}>
                              {tablet.assignedWaiterName}
                            </p>
                            <p className="text-xs text-muted-foreground mb-2">
                              Since {tablet.sessionStartedAt ? new Date(tablet.sessionStartedAt).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}) : 'N/A'}
                            </p>
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full text-xs border-red-500/50 text-red-400 hover:bg-red-500/20"
                              onClick={() => releaseTabletMutation.mutate(tablet.id)}
                              disabled={releaseTabletMutation.isPending}
                              data-testid={`button-release-tablet-${tablet.tabletNumber}`}
                            >
                              <UserMinus className="h-3 w-3 mr-1" />
                              Release
                            </Button>
                          </>
                        ) : (
                          <p className="text-xs text-muted-foreground italic">Available</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Registered Waiters Management Section */}
            <div className="mt-8">
              <div className="flex items-center gap-3 mb-4">
                <Users className="h-5 w-5 text-purple-400" />
                <h3 className="text-lg font-semibold">Registered Waiters</h3>
                <Badge variant="outline" className="text-xs">
                  {registeredWaiters.length} staff
                </Badge>
              </div>
              
              {registeredWaiters.length === 0 ? (
                <div className="border-2 border-dashed border-border rounded-xl p-6 text-center text-muted-foreground bg-card/30">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No waiters registered yet</p>
                  <p className="text-xs mt-1">Waiters register when they first use a tablet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {registeredWaiters.map(waiter => (
                    <Card 
                      key={waiter.id} 
                      className="bg-card/50 border-border/50"
                      data-testid={`card-waiter-${waiter.id}`}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">{waiter.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {waiter.createdAt ? `Since ${new Date(waiter.createdAt).toLocaleDateString()}` : 'Staff member'}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-400 hover:text-red-500 hover:bg-red-500/20"
                            onClick={() => deleteWaiterMutation.mutate(waiter.id)}
                            disabled={deleteWaiterMutation.isPending}
                            data-testid={`button-delete-waiter-${waiter.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>)}

          <TabsContent value="active" className="flex-1 mt-0">
            {activeOrders.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-border rounded-xl bg-card/30">
                <Bell className="h-12 w-12 mb-4 opacity-20" />
                <p className="text-xl font-medium">No active orders</p>
                <p className="text-sm">Waiting for new orders to arrive...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {activeOrders.map(order => (
                  <div key={order.id} className={`h-full ${order.status === 'new' ? 'ring-2 ring-red-500 rounded-xl animate-pulse' : ''}`}>
                    <OrderCard 
                      order={order} 
                      onAccept={handleAcceptOrder}
                      onReject={handleRejectOrder}
                      onStatusChange={handleStatusChange}
                      onUpdateDeliveryTime={handleUpdateDeliveryTime}
                      restaurantAddress={restaurant?.address}
                      restaurantName={restaurant?.name}
                      currencySymbol={currencySymbol}
                    />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="completed" className="mt-0">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 opacity-75">
                {visibleCompletedOrders.map(order => (
                  <div key={order.id} className="h-full">
                    <OrderCard 
                      order={order} 
                      onAccept={handleAcceptOrder}
                      onStatusChange={handleStatusChange}
                      onDelete={handleDeleteOrder}
                      restaurantAddress={restaurant?.address}
                      restaurantName={restaurant?.name}
                      currencySymbol={currencySymbol}
                    />
                  </div>
                ))}
              </div>
          </TabsContent>

          {isTableBookingEnabled && (
          <TabsContent value="bookings" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bookings.sort((a,b) => a.status === 'pending' ? -1 : 1).map(booking => (
                 <Card key={booking.id} className={`border-l-4 ${booking.status === 'pending' ? 'border-l-accent' : booking.status === 'confirmed' ? 'border-l-emerald-500' : 'border-l-muted'}`} data-testid={`card-booking-${booking.id}`}>
                   <CardHeader className="pb-2">
                     <div className="flex justify-between items-start">
                       <div>
                         <CardTitle className="flex items-center gap-2">
                           {booking.customerName}
                           {booking.totalVisits > 0 && (
                             <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-400 border-amber-500/30" data-testid={`badge-returning-customer-${booking.id}`}>
                               Returning Customer
                             </Badge>
                           )}
                         </CardTitle>
                         <div className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                           <Calendar className="h-3 w-3" /> {booking.date}
                         </div>
                         {booking.customer?.address && (
                           <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                             <MapPin className="h-3 w-3" /> {booking.customer.address}
                           </div>
                         )}
                       </div>
                       <div className="flex items-center gap-2">
                         <Badge variant={booking.status === 'pending' ? 'destructive' : 'secondary'}>
                           {booking.status}
                         </Badge>
                         <Button
                           size="icon"
                           variant="ghost"
                           className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                           onClick={() => {
                             if (confirm(`Delete booking for ${booking.customerName}?`)) {
                               deleteBookingMutation.mutate(booking.id);
                             }
                           }}
                           data-testid={`button-delete-booking-${booking.id}`}
                         >
                           <Trash2 className="h-4 w-4" />
                         </Button>
                       </div>
                     </div>
                   </CardHeader>
                   <CardContent>
                     {/* Phone Number with Call Button */}
                     <div className="flex items-center justify-between bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-4">
                       <div className="flex items-center gap-2">
                         <Phone className="h-4 w-4 text-blue-400" />
                         <span className="font-medium" data-testid={`text-booking-phone-${booking.id}`}>{booking.phone}</span>
                       </div>
                       <a 
                         href={`tel:${booking.phone}`}
                         className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-full text-sm font-medium flex items-center gap-1"
                         data-testid={`button-call-booking-${booking.id}`}
                       >
                         <Phone className="h-3 w-3" /> Call
                       </a>
                     </div>

                     {/* Visit History */}
                     {booking.totalVisits > 0 && (
                       <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mb-4" data-testid={`section-visit-history-${booking.id}`}>
                         <div className="text-xs font-bold text-amber-400 uppercase mb-2 flex items-center gap-1">
                           <Users className="h-3 w-3" /> Previous Visits ({booking.totalVisits})
                         </div>
                         <div className="space-y-1 max-h-24 overflow-y-auto">
                           {booking.visitHistory.slice(0, 5).map((visit, idx) => (
                             <div key={idx} className="text-xs text-muted-foreground flex justify-between items-center" data-testid={`text-visit-${booking.id}-${idx}`}>
                               <span>{visit.date} at {visit.time}</span>
                               <span className="text-amber-400">{visit.guests} guests</span>
                             </div>
                           ))}
                         </div>
                       </div>
                     )}

                     <div className="grid grid-cols-2 gap-3 mb-4">
                       <div className="bg-secondary/30 p-2 rounded text-center">
                         <div className="text-xs text-muted-foreground uppercase font-bold">Time</div>
                         <div className="text-lg font-bold flex items-center justify-center gap-1">
                           <Clock className="h-4 w-4" /> {booking.time}
                         </div>
                       </div>
                       <div className="bg-blue-500/10 border border-blue-500/30 p-2 rounded text-center">
                         <div className="text-xs text-blue-400 uppercase font-bold">Adults</div>
                         <div className="text-lg font-bold text-blue-400 flex items-center justify-center gap-1">
                           <Users className="h-4 w-4" /> {booking.adults || booking.guests || 0}
                         </div>
                       </div>
                       <div className="bg-amber-500/10 border border-amber-500/30 p-2 rounded text-center">
                         <div className="text-xs text-amber-400 uppercase font-bold">Children</div>
                         <div className="text-sm text-amber-300">Ages 2-12</div>
                         <div className="text-lg font-bold text-amber-400 flex items-center justify-center gap-1">
                           👧 {booking.children || 0}
                         </div>
                       </div>
                       <div className="bg-pink-500/10 border border-pink-500/30 p-2 rounded text-center">
                         <div className="text-xs text-pink-400 uppercase font-bold">Infants</div>
                         <div className="text-sm text-pink-300">Ages 0-2</div>
                         <div className="text-lg font-bold text-pink-400 flex items-center justify-center gap-1">
                           👶 {booking.infants || 0}
                         </div>
                       </div>
                     </div>
                     
                     {/* Total Guests Summary */}
                     <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-2 mb-4 text-center">
                       <span className="text-sm text-emerald-400 font-medium">
                         Total: {(booking.adults || booking.guests || 0) + (booking.children || 0) + (booking.infants || 0)} guests
                       </span>
                     </div>
                     
                     {/* Special Assistance Needs */}
                     {booking.specialHelp && (
                       <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 mb-4" data-testid={`section-special-help-${booking.id}`}>
                         <div className="text-xs font-bold text-purple-400 uppercase mb-2 flex items-center gap-1">
                           ♿ Special Assistance Required
                         </div>
                         <div className="text-sm text-white/80">
                           {booking.specialHelp}
                         </div>
                       </div>
                     )}
                     
                     {booking.status === 'pending' && (
                       <div className="flex gap-2">
                         <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => handleBookingAction(booking.id, 'confirm')} data-testid={`button-confirm-booking-${booking.id}`}>
                           <Check className="h-4 w-4 mr-2" /> Confirm
                         </Button>
                         <Button variant="outline" className="flex-1" onClick={() => handleBookingAction(booking.id, 'cancel')} data-testid={`button-cancel-booking-${booking.id}`}>
                           <X className="h-4 w-4 mr-2" /> Decline
                         </Button>
                       </div>
                     )}
                     
                     {booking.status === 'confirmed' && (
                        <Button variant="outline" className="w-full text-emerald-500 border-emerald-500/30" disabled>
                           <Check className="h-4 w-4 mr-2" /> Confirmed
                        </Button>
                     )}
                   </CardContent>
                 </Card>
              ))}
            </div>
          </TabsContent>)}

          {/* My Branch Tab */}
          <TabsContent value="branch" className="mt-0">
            <div className="max-w-2xl">
              <Card className="premium-card overflow-hidden border-0" data-testid="card-my-branch">
                <div className={`h-3 rounded-t-xl shadow-lg ${restaurant.status === "open" ? "bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400" : "bg-gradient-to-r from-gray-400 via-gray-500 to-gray-400"}`} />
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-teal-500/15 to-cyan-500/10 flex items-center justify-center font-bold text-xl text-emerald-500 shadow-lg border border-emerald-500/20">
                        {restaurant.name.charAt(0)}
                      </div>
                      <div>
                        <CardTitle className="text-lg gradient-text">{restaurant.name}</CardTitle>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {restaurant.address}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant={restaurant.status === "open" ? "default" : "secondary"} className={`badge-3d ${restaurant.status === "open" ? "bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg" : "bg-gradient-to-r from-gray-500 to-gray-600"}`}>
                      {restaurant.status === "open" ? "Open" : "Closed"}
                    </Badge>
                    <Badge variant="outline" className="badge-3d gap-1 border-blue-500/30 text-blue-400 bg-blue-500/10">
                      <DollarSign className="h-3 w-3" /> {currencySymbol}{Number(restaurant.revenueToday).toFixed(2)} today
                    </Badge>
                    {restaurant.stripeAccountId && (
                      <Badge variant="outline" className="badge-3d gap-1 text-purple-400 border-purple-500/30 bg-purple-500/10">
                        <CreditCard className="h-3 w-3" /> Stripe Connected
                      </Badge>
                    )}
                  </div>

                  <div className="bg-secondary/30 rounded-lg p-3 space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                      <LinkIcon className="h-3 w-3" /> GOOGLE BUSINESS LINKS
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-1">
                        <Input readOnly value={`/menu/${restaurant.slug}`} className="h-8 text-xs bg-background" />
                        <Button size="icon" variant="secondary" className="h-8 w-8 shrink-0" onClick={() => copyToClipboard(`${window.location.origin}/menu/${restaurant.slug}`)}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-1">
                        <Input readOnly value={`/r/${restaurant.slug}`} className="h-8 text-xs bg-background" />
                        <Button size="icon" variant="secondary" className="h-8 w-8 shrink-0" onClick={() => copyToClipboard(`${window.location.origin}/r/${restaurant.slug}`)}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link href={`/menu/${restaurant.slug}`} className="flex-1">
                      <Button variant="secondary" className="w-full gap-2 stat-card-3d bg-gradient-to-r from-blue-500/10 to-indigo-500/5 border border-blue-500/30 hover:border-blue-500/50 hover:from-blue-500/20 hover:to-indigo-500/10 text-blue-400 hover:text-blue-300">
                        <Globe className="h-4 w-4" /> View Menu
                      </Button>
                    </Link>
                  </div>

                  {/* Expandable Menu Management Section */}
                  <div className="border-t pt-4 mt-4">
                    <Button 
                      variant="ghost" 
                      className="w-full justify-between"
                      onClick={() => setMenuExpanded(!menuExpanded)}
                      data-testid="button-expand-menu-branch"
                    >
                      <span className="flex items-center gap-2">
                        <UtensilsCrossed className="h-4 w-4" />
                        Manage Menu ({menuItems.length} items)
                      </span>
                      {menuExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>

                    {menuExpanded && (
                      <div className="mt-4 space-y-4">
                        {/* Category & Menu Item Actions */}
                        <div className="flex flex-wrap justify-between items-center gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setCategoriesExpanded(!categoriesExpanded)}
                            className="gap-2"
                            data-testid="button-manage-categories-branch"
                          >
                            <Settings className="h-4 w-4" /> {categoriesExpanded ? 'Hide' : 'Edit'} Categories
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setBulkUploadExpanded(!bulkUploadExpanded)}
                            className="gap-2"
                            data-testid="button-bulk-upload-images"
                          >
                            <ImageIcon className="h-4 w-4" /> {bulkUploadExpanded ? 'Hide' : 'Bulk'} Images
                          </Button>
                          <Button 
                            size="sm" 
                            onClick={() => setAddingMenuItem(true)}
                            className="gap-2"
                            data-testid="button-add-menu-item-branch"
                          >
                            <Plus className="h-4 w-4" /> Add Menu Item
                          </Button>
                        </div>
                        
                        {/* Bulk Image Upload Section */}
                        {bulkUploadExpanded && (
                          <div className="bg-secondary/20 rounded-lg p-4 space-y-4 border border-dashed border-primary/50">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold text-sm flex items-center gap-2">
                                <ImageIcon className="h-4 w-4" /> Bulk Image Upload
                              </h4>
                              {bulkUploadImages.length > 0 && (
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => {
                                    bulkUploadImages.forEach(img => URL.revokeObjectURL(img.preview));
                                    setBulkUploadImages([]);
                                  }}
                                  data-testid="button-bulk-clear-all"
                                >
                                  Clear All
                                </Button>
                              )}
                            </div>
                            
                            <p className="text-xs text-muted-foreground">
                              Upload multiple images at once. Name your files to match category or menu item names (e.g., "Chicken Burger.jpg").
                            </p>
                            
                            {/* Drop zone */}
                            <div className="relative border-2 border-dashed border-muted-foreground/30 rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                              <input
                                type="file"
                                multiple
                                accept="image/*"
                                data-testid="input-bulk-file-upload"
                                onChange={(e) => {
                                  const files = Array.from(e.target.files || []);
                                  const allItems = [
                                    ...dynamicCategories.map(c => ({ type: 'category' as const, id: (c as any).dbId || c.id, name: c.name })),
                                    ...menuItems.map(m => ({ type: 'menuItem' as const, id: m.id, name: m.name }))
                                  ];
                                  
                                  const newImages = files.map(file => {
                                    const fileName = file.name.replace(/\.[^/.]+$/, "").toLowerCase().trim();
                                    const match = allItems.find(item => 
                                      item.name.toLowerCase().trim() === fileName ||
                                      item.name.toLowerCase().trim().includes(fileName) ||
                                      fileName.includes(item.name.toLowerCase().trim())
                                    );
                                    
                                    return {
                                      file,
                                      preview: URL.createObjectURL(file),
                                      targetType: match?.type || 'menuItem' as const,
                                      targetId: match?.id || '',
                                      targetName: match?.name || ''
                                    };
                                  });
                                  
                                  setBulkUploadImages(prev => [...prev, ...newImages]);
                                }}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              />
                              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                              <p className="text-sm font-medium">Click or drag images here</p>
                              <p className="text-xs text-muted-foreground mt-1">PNG, JPG, GIF - Multiple files supported</p>
                            </div>
                            
                            {/* Preview & Assignment */}
                            {bulkUploadImages.length > 0 && (
                              <div className="space-y-3">
                                <p className="text-xs font-medium">{bulkUploadImages.length} image(s) ready to upload</p>
                                <div className="max-h-[300px] overflow-y-auto space-y-2">
                                  {bulkUploadImages.map((img, idx) => (
                                    <div key={idx} className="flex items-center gap-3 p-2 bg-background rounded-lg border">
                                      <img src={img.preview} alt="" className="w-12 h-12 object-cover rounded" />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium truncate">{img.file.name}</p>
                                        <div className="flex gap-2 mt-1">
                                          <select
                                            value={img.targetType}
                                            onChange={(e) => {
                                              const newType = e.target.value as 'category' | 'menuItem';
                                              setBulkUploadImages(prev => prev.map((i, j) => 
                                                j === idx ? { ...i, targetType: newType, targetId: '', targetName: '' } : i
                                              ));
                                            }}
                                            className="h-7 text-xs bg-secondary rounded px-2 border-0"
                                            data-testid={`select-bulk-type-${idx}`}
                                          >
                                            <option value="category">Category</option>
                                            <option value="menuItem">Menu Item</option>
                                          </select>
                                          <select
                                            value={img.targetId}
                                            onChange={(e) => {
                                              const id = e.target.value;
                                              const list = img.targetType === 'category' ? dynamicCategories : menuItems;
                                              const item = list.find((i: any) => ((i as any).dbId || i.id) === id);
                                              setBulkUploadImages(prev => prev.map((i, j) => 
                                                j === idx ? { ...i, targetId: id, targetName: item?.name || '' } : i
                                              ));
                                            }}
                                            className="h-7 text-xs bg-secondary rounded px-2 flex-1 border-0"
                                            data-testid={`select-bulk-target-${idx}`}
                                          >
                                            <option value="">-- Select --</option>
                                            {img.targetType === 'category' 
                                              ? dynamicCategories.map(c => (
                                                  <option key={c.id} value={(c as any).dbId || c.id}>{c.name}</option>
                                                ))
                                              : menuItems.map(m => (
                                                  <option key={m.id} value={m.id}>{m.name}</option>
                                                ))
                                            }
                                          </select>
                                        </div>
                                      </div>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 text-red-500"
                                        onClick={() => {
                                          URL.revokeObjectURL(img.preview);
                                          setBulkUploadImages(prev => prev.filter((_, j) => j !== idx));
                                        }}
                                        data-testid={`button-bulk-remove-${idx}`}
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                                
                                <Button
                                  className="w-full gap-2"
                                  disabled={isUploadingBulk || bulkUploadImages.every(i => !i.targetId)}
                                  data-testid="button-bulk-upload-submit"
                                  onClick={async () => {
                                    setIsUploadingBulk(true);
                                    let successCount = 0;
                                    
                                    for (const img of bulkUploadImages) {
                                      if (!img.targetId) continue;
                                      
                                      try {
                                        const formData = new FormData();
                                        formData.append('file', img.file);
                                        
                                        const endpoint = img.targetType === 'category'
                                          ? `/api/menu-categories/${img.targetId}/upload-media?type=image`
                                          : `/api/menu/${img.targetId}/upload-media?type=image`;
                                        
                                        const response = await fetch(endpoint, {
                                          method: 'POST',
                                          body: formData
                                        });
                                        
                                        if (response.ok) successCount++;
                                      } catch (err) {
                                        console.error('Failed to upload', img.file.name, err);
                                      }
                                    }
                                    
                                    if (successCount > 0) {
                                      queryClient.invalidateQueries({ queryKey: ["/api/menu-categories", restaurantId] });
                                      queryClient.invalidateQueries({ queryKey: ["/api/menu", restaurantId] });
                                      toast({ 
                                        title: "Upload Complete", 
                                        description: `${successCount} image(s) uploaded successfully` 
                                      });
                                    }
                                    
                                    bulkUploadImages.forEach(img => URL.revokeObjectURL(img.preview));
                                    setBulkUploadImages([]);
                                    setIsUploadingBulk(false);
                                  }}
                                >
                                  {isUploadingBulk ? (
                                    <>
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                      Uploading...
                                    </>
                                  ) : (
                                    <>
                                      <Upload className="h-4 w-4" />
                                      Upload {bulkUploadImages.filter(i => i.targetId).length} Image(s)
                                    </>
                                  )}
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Category Editing Section */}
                        {categoriesExpanded && (
                          <div className="bg-secondary/20 rounded-lg p-4 space-y-3 border">
                            <h4 className="font-semibold text-sm">Edit Categories ({dynamicCategories.length})</h4>
                            <div className="space-y-2 max-h-[300px] overflow-y-auto">
                              {dynamicCategories.map(category => (
                                <div key={category.id} className="flex items-center gap-2 p-2 bg-background rounded-lg border">
                                  {editingCategoryId === category.id ? (
                                    <div className="flex items-center gap-1 w-full">
                                      <Input 
                                        value={editingCategoryIcon}
                                        onChange={(e) => setEditingCategoryIcon(e.target.value)}
                                        className="h-7 w-10 text-center shrink-0 px-1"
                                        placeholder="🍽️"
                                        data-testid={`input-category-icon-${category.id}`}
                                      />
                                      <Input 
                                        value={editingCategoryName}
                                        onChange={(e) => setEditingCategoryName(e.target.value)}
                                        className="h-7 flex-1 max-w-[120px] px-2"
                                        placeholder="Name"
                                        data-testid={`input-category-name-${category.id}`}
                                      />
                                      <button 
                                        type="button"
                                        className="h-7 w-7 flex items-center justify-center shrink-0 text-green-500 hover:bg-green-500/10 rounded"
                                        onClick={() => handleSaveCategoryEdit(category)}
                                        data-testid={`button-save-category-${category.id}`}
                                      >
                                        <Check className="h-4 w-4" />
                                      </button>
                                      <button 
                                        type="button"
                                        className="h-7 w-7 flex items-center justify-center shrink-0 hover:bg-secondary rounded"
                                        onClick={() => { setEditingCategoryId(null); setEditingCategoryName(""); setEditingCategoryIcon(""); }}
                                      >
                                        <X className="h-4 w-4" />
                                      </button>
                                      <button 
                                        type="button"
                                        className="h-7 w-7 flex items-center justify-center shrink-0 hover:bg-red-500/10 rounded"
                                        style={{ color: '#ef4444' }}
                                        onClick={() => { 
                                          const itemCount = menuItems.filter(m => 
                                            m.category === category.id || 
                                            m.category === (category as any).dbId || 
                                            m.category === (category as any).slug
                                          ).length;
                                          setDeleteCategoryConfirm({ 
                                            id: category.id, 
                                            dbId: (category as any).dbId,
                                            name: category.name, 
                                            itemCount 
                                          }); 
                                        }}
                                        data-testid={`button-delete-category-edit-${category.id}`}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </div>
                                  ) : (
                                    <>
                                      <span className="text-xl w-10 text-center">{category.icon}</span>
                                      <span className="flex-1 font-medium text-sm">{category.name}</span>
                                      <Badge variant="secondary" className="text-xs">
                                        {menuItems.filter(m => m.category === category.id || m.category === (category as any).dbId || m.category === (category as any).slug).length} items
                                      </Badge>
                                      <Button 
                                        size="icon" 
                                        variant="ghost" 
                                        className="h-8 w-8"
                                        onClick={() => { 
                                          setEditingCategoryId(category.id); 
                                          setEditingCategoryName(category.name); 
                                          setEditingCategoryIcon(category.icon); 
                                        }}
                                        data-testid={`button-edit-category-${category.id}`}
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                      <Button 
                                        size="icon" 
                                        variant="ghost" 
                                        className="h-8 w-8 text-destructive"
                                        onClick={() => { 
                                          const itemCount = menuItems.filter(m => 
                                            m.category === category.id || 
                                            m.category === (category as any).dbId || 
                                            m.category === (category as any).slug
                                          ).length;
                                          setDeleteCategoryConfirm({ 
                                            id: category.id, 
                                            dbId: (category as any).dbId,
                                            name: category.name, 
                                            itemCount 
                                          }); 
                                        }}
                                        data-testid={`button-delete-category-${category.id}`}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Add Menu Item Form */}
                        {addingMenuItem && (
                          <div className="bg-secondary/20 rounded-lg p-4 space-y-4 border">
                            <div className="flex justify-between items-center">
                              <h4 className="font-semibold">Add New Menu Item</h4>
                              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { setAddingMenuItem(false); setNewMenuItemName(""); setNewMenuItemPrice(""); setNewMenuItemImage(""); }}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <Label className="text-xs">Name *</Label>
                                <Input 
                                  value={newMenuItemName}
                                  onChange={(e) => setNewMenuItemName(e.target.value)}
                                  placeholder="Item name"
                                  className="h-8"
                                  data-testid="input-branch-menu-name"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Price *</Label>
                                <Input 
                                  value={newMenuItemPrice}
                                  onChange={(e) => setNewMenuItemPrice(e.target.value)}
                                  placeholder="5.99"
                                  className="h-8"
                                  data-testid="input-branch-menu-price"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Category</Label>
                                <Select value={newMenuItemCategory} onValueChange={setNewMenuItemCategory}>
                                  <SelectTrigger className="h-8" data-testid="select-branch-menu-category">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {dynamicCategories.map(cat => (
                                      <SelectItem key={cat.id} value={cat.id}>{cat.icon} {cat.name}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Image (PNG/JPG/GIF/SVG)</Label>
                                <div className="flex gap-1">
                                  <Input 
                                    value={newMenuItemImage}
                                    onChange={(e) => setNewMenuItemImage(e.target.value)}
                                    placeholder="Image URL"
                                    className="h-8"
                                    data-testid="input-branch-menu-image"
                                  />
                                  <div className="relative">
                                    <input
                                      type="file"
                                      accept="image/*,.gif,.svg"
                                      onChange={handleMenuImageUpload}
                                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <Button type="button" variant="outline" size="sm" className="h-8" disabled={isUploadingMenuImage} title="Upload Image">
                                      {isUploadingMenuImage ? <Loader2 className="h-3 w-3 animate-spin" /> : <ImageIcon className="h-3 w-3" />}
                                    </Button>
                                  </div>
                                </div>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Video (MP4/WebM)</Label>
                                <div className="flex gap-1">
                                  <Input 
                                    value={newMenuItemVideo}
                                    onChange={(e) => setNewMenuItemVideo(e.target.value)}
                                    placeholder="Video URL (optional)"
                                    className="h-8"
                                    data-testid="input-branch-menu-video"
                                  />
                                  <div className="relative">
                                    <input
                                      type="file"
                                      accept="video/mp4,video/webm"
                                      onChange={(e) => handleMenuVideoUpload(e, false)}
                                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <Button type="button" variant="outline" size="sm" className="h-8" disabled={isUploadingMenuVideo} title="Upload Video">
                                      {isUploadingMenuVideo ? <Loader2 className="h-3 w-3 animate-spin" /> : <Video className="h-3 w-3" />}
                                    </Button>
                                  </div>
                                </div>
                              </div>
                              <div className="col-span-2 space-y-1">
                                <Label className="text-xs">Description</Label>
                                <Input 
                                  value={newMenuItemDescription}
                                  onChange={(e) => setNewMenuItemDescription(e.target.value)}
                                  placeholder="Optional description"
                                  className="h-8"
                                  data-testid="input-branch-menu-description"
                                />
                              </div>
                            </div>
                            <Button 
                              onClick={handleAddMenuItem}
                              className="w-full"
                              data-testid="button-submit-branch-menu-item"
                            >
                              Add Item
                            </Button>
                          </div>
                        )}

                        {/* Menu Items List by Category */}
                        {dynamicCategories.map(category => {
                          const categoryItems = menuItems.filter(m => 
                            m.category === category.id || 
                            m.category === category.name ||
                            m.category === (category as any).dbId ||
                            m.category === (category as any).slug ||
                            m.category?.toLowerCase() === category.name?.toLowerCase()
                          );
                          
                          const categoryImage = (category as any).imageUrl || (category as any).gifUrl;
                          return (
                            <Card key={category.id} className="overflow-hidden" data-testid={`branch-category-card-${category.id}`}>
                              {categoryImage && (
                                <div className="relative h-32 w-full overflow-hidden">
                                  <img src={categoryImage} alt={category.name} className="w-full h-full object-cover" />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                  <div className="absolute bottom-2 left-3 text-white">
                                    <h3 className="font-bold text-lg drop-shadow-lg">{category.icon} {category.name}</h3>
                                    <p className="text-xs opacity-90">{categoryItems.length} items</p>
                                  </div>
                                </div>
                              )}
                              <div className={`w-full p-3 flex items-center justify-between bg-secondary/30 hover:bg-secondary/50 transition-colors ${categoryImage ? 'border-t' : ''}`}>
                                {!categoryImage && (
                                  <div className="flex items-center gap-3">
                                    <span className="text-xl">{category.icon}</span>
                                    <div className="text-left">
                                      <h3 className="font-bold">{category.name}</h3>
                                      <p className="text-xs text-muted-foreground">{categoryItems.length} items</p>
                                    </div>
                                  </div>
                                )}
                                {categoryImage && <div />}
                                <div className="flex items-center gap-2">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => { 
                                      setEditCategoryDialog({
                                        id: category.id,
                                        dbId: (category as any).dbId,
                                        name: category.name,
                                        icon: category.icon,
                                        itemCount: categoryItems.length,
                                        imageUrl: (category as any).imageUrl || "",
                                        videoUrl: (category as any).videoUrl || ""
                                      });
                                      setEditingCategoryName(category.name);
                                      setEditingCategoryIcon(category.icon);
                                      setEditingCategoryImageUrl((category as any).imageUrl || "");
                                      setEditingCategoryVideoUrl((category as any).videoUrl || "");
                                    }}
                                    data-testid={`button-edit-category-header-${category.id}`}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                    onClick={() => { 
                                      setDeleteCategoryConfirm({ 
                                        id: category.id, 
                                        dbId: (category as any).dbId,
                                        name: category.name, 
                                        itemCount: categoryItems.length 
                                      }); 
                                    }}
                                    data-testid={`button-delete-category-header-${category.id}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                  <Badge variant="outline">{categoryItems.length}</Badge>
                                </div>
                              </div>
                              <CardContent className="p-3 space-y-2">
                                {categoryItems.length === 0 && (
                                  <div className="text-center py-4 text-muted-foreground">
                                    <p className="text-sm">No items in this category yet</p>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="mt-2 gap-1"
                                      onClick={() => {
                                        setAddingMenuItem(true);
                                        setNewMenuItemCategory(category.id);
                                      }}
                                      data-testid={`button-add-item-empty-${category.id}`}
                                    >
                                      <Plus className="h-3 w-3" /> Add Menu Item
                                    </Button>
                                  </div>
                                )}
                                {categoryItems.map(item => (
                                  <div key={item.id}>
                                    {editingMenuItemId === item.id ? (
                                      <div className="bg-secondary/30 rounded-lg p-3 space-y-3 border" data-testid={`branch-menu-item-edit-${item.id}`}>
                                        <div className="flex justify-between items-center">
                                          <h5 className="font-semibold text-sm">Edit Menu Item</h5>
                                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { setEditingMenuItemId(null); setEditMenuItemName(""); setEditMenuItemDescription(""); setEditMenuItemImage(""); setEditMenuItemVideo(""); setEditMenuItemCategory(""); }}>
                                            <X className="h-4 w-4" />
                                          </Button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                          <div className="space-y-1">
                                            <Label className="text-xs">Name *</Label>
                                            <Input value={editMenuItemName} onChange={(e) => setEditMenuItemName(e.target.value)} className="h-8" data-testid={`input-edit-menu-name-${item.id}`} />
                                          </div>
                                          <div className="space-y-1">
                                            <Label className="text-xs">Category</Label>
                                            <Select value={editMenuItemCategory} onValueChange={setEditMenuItemCategory}>
                                              <SelectTrigger className="h-8" data-testid={`select-edit-menu-category-${item.id}`}><SelectValue /></SelectTrigger>
                                              <SelectContent>{dynamicCategories.map(cat => (<SelectItem key={cat.id} value={cat.id}>{cat.icon} {cat.name}</SelectItem>))}</SelectContent>
                                            </Select>
                                          </div>
                                          <div className="col-span-2 space-y-1">
                                            <Label className="text-xs">Description</Label>
                                            <Input value={editMenuItemDescription} onChange={(e) => setEditMenuItemDescription(e.target.value)} className="h-8" placeholder="Optional" data-testid={`input-edit-menu-desc-${item.id}`} />
                                          </div>
                                          <div className="space-y-1">
                                            <Label className="text-xs">Image (PNG/JPG/GIF/SVG)</Label>
                                            <div className="flex gap-1">
                                              <Input value={editMenuItemImage} onChange={(e) => setEditMenuItemImage(e.target.value)} className="h-8" placeholder="Image URL" data-testid={`input-edit-menu-image-${item.id}`} />
                                              <div className="relative">
                                                <input type="file" accept="image/*,.gif,.svg" onChange={handleMenuImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                                <Button type="button" variant="outline" size="sm" className="h-8" disabled={isUploadingMenuImage} title="Upload Image">
                                                  {isUploadingMenuImage ? <Loader2 className="h-3 w-3 animate-spin" /> : <ImageIcon className="h-3 w-3" />}
                                                </Button>
                                              </div>
                                            </div>
                                          </div>
                                          <div className="space-y-1">
                                            <Label className="text-xs">Video (MP4/WebM)</Label>
                                            <div className="flex gap-1">
                                              <Input value={editMenuItemVideo} onChange={(e) => setEditMenuItemVideo(e.target.value)} className="h-8" placeholder="Video URL" data-testid={`input-edit-menu-video-${item.id}`} />
                                              <div className="relative">
                                                <input type="file" accept="video/mp4,video/webm" onChange={(e) => handleMenuVideoUpload(e, true)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                                <Button type="button" variant="outline" size="sm" className="h-8" disabled={isUploadingMenuVideo} title="Upload Video">
                                                  {isUploadingMenuVideo ? <Loader2 className="h-3 w-3 animate-spin" /> : <Video className="h-3 w-3" />}
                                                </Button>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                        <div className="flex gap-2">
                                          <Button size="sm" onClick={() => handleSaveMenuItemEdit(item.id)} className="flex-1 gap-1" data-testid={`button-save-menu-item-${item.id}`}>
                                            <Check className="h-4 w-4" /> Save
                                          </Button>
                                          <Button size="sm" variant="outline" onClick={() => { setEditingMenuItemId(null); setEditMenuItemName(""); setEditMenuItemDescription(""); setEditMenuItemImage(""); setEditMenuItemVideo(""); setEditMenuItemCategory(""); }}>
                                            Cancel
                                          </Button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div 
                                        className={`rounded-lg overflow-hidden ${item.available !== false ? 'bg-secondary/20' : 'bg-red-500/10 border border-red-500/30'}`}
                                        data-testid={`branch-menu-item-row-${item.id}`}
                                      >
                                        {item.image && (
                                          <div className="relative h-24 w-full overflow-hidden">
                                            <img src={item.image} alt={item.name} className={`w-full h-full object-cover ${item.available === false ? 'opacity-50 grayscale' : ''}`} />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                                            <div className="absolute bottom-2 left-2 right-2">
                                              <p className={`font-semibold text-white text-sm drop-shadow-lg ${item.available === false ? 'line-through' : ''}`}>{item.name}</p>
                                            </div>
                                            {item.available === false && (
                                              <Badge variant="destructive" className="absolute top-2 right-2 text-[10px]">SOLD OUT</Badge>
                                            )}
                                          </div>
                                        )}
                                        <div className="flex items-center gap-3 p-2">
                                          {!item.image && (
                                            <div className="h-12 w-12 rounded bg-secondary/50 flex items-center justify-center text-muted-foreground">
                                              <ImageIcon className="h-5 w-5" />
                                            </div>
                                          )}
                                          <div className="flex-1 min-w-0">
                                            {!item.image && (
                                              <>
                                                <div className="flex items-center gap-2">
                                                  <p className={`font-medium text-sm truncate ${item.available === false ? 'line-through text-muted-foreground' : ''}`}>{item.name}</p>
                                                  {item.available === false && (
                                                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0">SOLD OUT</Badge>
                                                  )}
                                                </div>
                                              </>
                                            )}
                                            {item.description && (
                                              <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                                            )}
                                          </div>
                                          <div className="flex items-center gap-2">
                                          <Switch
                                            checked={item.available !== false}
                                            onCheckedChange={() => handleToggleAvailability(item)}
                                            data-testid={`switch-availability-${item.id}`}
                                            className="data-[state=unchecked]:bg-red-500"
                                          />
                                          {editingPrices[item.id] !== undefined ? (
                                            <div className="flex items-center gap-1">
                                              <span className="text-sm">{currencySymbol}</span>
                                              <Input 
                                                value={editingPrices[item.id]}
                                                onChange={(e) => setEditingPrices(prev => ({ ...prev, [item.id]: e.target.value }))}
                                                className="h-7 w-20 text-sm"
                                                data-testid={`input-branch-edit-price-${item.id}`}
                                              />
                                              <Button 
                                                size="icon" 
                                                variant="ghost" 
                                                className="h-7 w-7 text-green-500"
                                                onClick={() => handleInlinePriceUpdate(item)}
                                                data-testid={`button-branch-save-price-${item.id}`}
                                              >
                                                <Check className="h-4 w-4" />
                                              </Button>
                                              <Button 
                                                size="icon" 
                                                variant="ghost" 
                                                className="h-7 w-7"
                                                onClick={() => setEditingPrices(prev => { const updated = { ...prev }; delete updated[item.id]; return updated; })}
                                              >
                                                <X className="h-4 w-4" />
                                              </Button>
                                            </div>
                                          ) : (
                                            <Button 
                                              variant="ghost" 
                                              size="sm"
                                              className="h-7 px-2 font-medium"
                                              onClick={() => setEditingPrices(prev => ({ ...prev, [item.id]: item.price }))}
                                              data-testid={`button-branch-edit-price-${item.id}`}
                                            >
                                              {currencySymbol}{item.price}
                                            </Button>
                                          )}
                                          <Button 
                                            size="icon" 
                                            variant="ghost" 
                                            className="h-7 w-7"
                                            onClick={() => { 
                                              setEditingMenuItemId(item.id); 
                                              setEditMenuItemName(item.name); 
                                              setEditMenuItemDescription(item.description || ""); 
                                              setEditMenuItemImage(item.image || ""); 
                                              setEditMenuItemVideo((item as any).videoUrl || ""); 
                                              setEditMenuItemCategory(item.category || "");
                                            }}
                                            data-testid={`button-branch-edit-menu-${item.id}`}
                                          >
                                            <Pencil className="h-4 w-4" />
                                          </Button>
                                          <Button 
                                            size="icon" 
                                            variant="ghost" 
                                            className="h-7 w-7 text-destructive hover:text-destructive"
                                            onClick={() => handleDeleteMenuItem(item)}
                                            data-testid={`button-branch-delete-menu-${item.id}`}
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                          <Button 
                                            size="icon" 
                                            variant="ghost" 
                                            className="h-7 w-7 text-orange-500 hover:text-orange-600 relative"
                                            onClick={() => {
                                              setSelectedMenuItemForToppings(item);
                                              setQuickToppingName("");
                                              setQuickToppingPrice("1.00");
                                            }}
                                            data-testid={`button-manage-toppings-${item.id}`}
                                            title="Manage Toppings"
                                          >
                                            <Plus className="h-4 w-4" />
                                            {extraToppings.filter(t => (t as any).menuItemId === item.id).length > 0 && (
                                              <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[9px] rounded-full h-3.5 w-3.5 flex items-center justify-center">
                                                {extraToppings.filter(t => (t as any).menuItemId === item.id).length}
                                              </span>
                                            )}
                                          </Button>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </CardContent>
                            </Card>
                          );
                        })}

                        {menuItems.length === 0 && (
                          <div className="text-center py-6 text-muted-foreground">
                            <UtensilsCrossed className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>No menu items yet</p>
                            <p className="text-xs">Click "Add Menu Item" to get started</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Stripe & Payment Status Section */}
                  <div className="border-t pt-4 mt-4">
                    <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-lg p-4 space-y-3">
                      <div className="flex items-center gap-2 mb-2">
                        <CreditCard className="h-4 w-4 text-purple-400" />
                        <span className="text-sm font-semibold">Payment & Stripe Status</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Stripe Connection</p>
                          {(restaurant?.stripeSecretKey || restaurant?.stripePublishableKey) ? (
                            <div className="flex items-center gap-1.5">
                              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                              <span className="text-sm font-medium text-emerald-400">Connected</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <div className="h-2 w-2 rounded-full bg-red-500" />
                              <span className="text-sm font-medium text-red-400">Not connected</span>
                            </div>
                          )}
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Currency</p>
                          <p className="text-sm font-medium">{currencySymbol} {restaurant?.currency || 'GBP'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Card Payments</p>
                          {(restaurant?.stripeSecretKey && restaurant?.stripePublishableKey) ? (
                            <span className="text-sm font-medium text-emerald-400">Enabled</span>
                          ) : (
                            <span className="text-sm font-medium text-yellow-400">Disabled</span>
                          )}
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Bank Transfer</p>
                          {restaurant?.bankTransferEnabled ? (
                            <span className="text-sm font-medium text-emerald-400">Enabled</span>
                          ) : (
                            <span className="text-sm font-medium text-muted-foreground">Not set up</span>
                          )}
                        </div>
                      </div>

                      <p className="text-[10px] text-muted-foreground mt-2">
                        Stripe keys and currency are managed by Super Admin. Contact your administrator to update payment settings.
                      </p>
                    </div>
                  </div>

                  {/* Branch Details Section - Address, Email, Phone */}
                  <div className="border-t pt-4 mt-4">
                    <Button 
                      variant="ghost" 
                      className="w-full justify-between"
                      onClick={() => setBranchDetailsExpanded(!branchDetailsExpanded)}
                      data-testid="button-expand-branch-details"
                    >
                      <span className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-blue-500" />
                        Branch Details (Address, Cuisine, Tagline, Phone)
                      </span>
                      {branchDetailsExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>

                    {branchDetailsExpanded && (
                      <div className="mt-4 space-y-4 bg-secondary/20 rounded-lg p-4 border">
                        <p className="text-xs text-muted-foreground">
                          Update your branch contact details. These appear on your landing page.
                        </p>

                        <div className="space-y-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Address</Label>
                            <Input 
                              value={editBranchAddress}
                              onChange={(e) => setEditBranchAddress(e.target.value)}
                              placeholder="e.g., 38 Freer Street, Walsall, WS1 1QF"
                              className="h-8"
                              data-testid="input-branch-address"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Email</Label>
                            <Input 
                              type="email"
                              value={editBranchEmail}
                              onChange={(e) => setEditBranchEmail(e.target.value)}
                              placeholder="e.g., info@dixychicken.com"
                              className="h-8"
                              data-testid="input-branch-email"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Phone</Label>
                            <Input 
                              type="tel"
                              value={editBranchPhone}
                              onChange={(e) => setEditBranchPhone(e.target.value)}
                              placeholder="e.g., 01922 915 965"
                              className="h-8"
                              data-testid="input-branch-phone"
                            />
                          </div>
                          <div className="space-y-1 border-t pt-3 mt-3">
                            <Label className="text-xs">Cuisine Type</Label>
                            <Input 
                              value={editCuisineType}
                              onChange={(e) => setEditCuisineType(e.target.value)}
                              placeholder="e.g., Indian & Indo-Chinese"
                              className="h-8"
                              data-testid="input-cuisine-type"
                            />
                            <p className="text-xs text-muted-foreground">
                              Shows on your welcome page (e.g., "Indian & Indo-Chinese", "Pakistani & Afghani Cuisine")
                            </p>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Tagline</Label>
                            <Input 
                              value={editTagline}
                              onChange={(e) => setEditTagline(e.target.value)}
                              placeholder='e.g., "Where every bite feels like home"'
                              className="h-8"
                              data-testid="input-tagline"
                            />
                            <p className="text-xs text-muted-foreground">
                              Shows below your restaurant name on the welcome page
                            </p>
                          </div>
                          <div className="space-y-1 border-t pt-3 mt-3">
                            <Label className="text-xs">Supplier Order Reply-To Email</Label>
                            <Input 
                              type="email"
                              value={editSupplierOrderFromEmail}
                              onChange={(e) => setEditSupplierOrderFromEmail(e.target.value)}
                              placeholder="e.g., orders@yourbranch.com"
                              className="h-8"
                              data-testid="input-supplier-order-from-email"
                            />
                            <p className="text-xs text-muted-foreground">
                              When suppliers reply to order emails, their response will go to this address.
                            </p>
                          </div>
                        </div>

                        <Button 
                          onClick={handleSaveBranchDetails}
                          className="w-full"
                          data-testid="button-save-branch-details"
                        >
                          Save Branch Details
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Extra Toppings Section */}
                  <div className="border-t pt-4 mt-4">
                    <Button 
                      variant="ghost" 
                      className="w-full justify-between"
                      onClick={() => setExtraToppingsExpanded(!extraToppingsExpanded)}
                      data-testid="button-expand-extra-toppings"
                    >
                      <span className="flex items-center gap-2">
                        <Plus className="h-4 w-4 text-orange-500" />
                        Extra Toppings ({extraToppings.length} items)
                      </span>
                      {extraToppingsExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>

                    {extraToppingsExpanded && (
                      <div className="mt-4 space-y-4 bg-secondary/20 rounded-lg p-4 border">
                        <p className="text-xs text-muted-foreground">
                          Manage extra toppings that customers can add to their orders. These appear in the extras dialog on your menu page.
                        </p>

                        {/* Add New Topping Form */}
                        <div className="space-y-3 p-3 bg-background rounded-lg border">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <Label className="text-xs">Category</Label>
                              <Select value={newToppingCategory} onValueChange={(val) => { setNewToppingCategory(val); setNewToppingMenuItem(""); }}>
                                <SelectTrigger className="h-8" data-testid="select-topping-category">
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                  {dynamicCategories.map(cat => (
                                    <SelectItem key={cat.id} value={cat.id}>{cat.icon} {cat.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Menu Item</Label>
                              <Select value={newToppingMenuItem} onValueChange={setNewToppingMenuItem} disabled={!newToppingCategory}>
                                <SelectTrigger className="h-8" data-testid="select-topping-menu-item">
                                  <SelectValue placeholder={newToppingCategory ? "Select item" : "Select category first"} />
                                </SelectTrigger>
                                <SelectContent>
                                  {menuItems.filter(m => m.category === newToppingCategory).map(item => (
                                    <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="flex gap-2 items-end">
                            <div className="flex-1 space-y-1">
                              <Label className="text-xs">Topping Name</Label>
                              <Input 
                                value={newToppingName}
                                onChange={(e) => setNewToppingName(e.target.value)}
                                placeholder="e.g., Mature cheddar"
                                className="h-8"
                                data-testid="input-new-topping-name"
                              />
                            </div>
                            <div className="w-24 space-y-1">
                              <Label className="text-xs">Price ({currencySymbol})</Label>
                              <Input 
                                value={newToppingPrice}
                                onChange={(e) => setNewToppingPrice(e.target.value)}
                                placeholder="1.00"
                                className="h-8"
                                data-testid="input-new-topping-price"
                              />
                            </div>
                            <Button 
                              size="sm"
                              onClick={() => {
                                if (newToppingName && newToppingPrice && newToppingMenuItem) {
                                  createToppingMutation.mutate({ name: newToppingName, price: newToppingPrice, menuItemId: newToppingMenuItem });
                                }
                              }}
                              disabled={!newToppingName || !newToppingPrice || !newToppingMenuItem || createToppingMutation.isPending}
                              data-testid="button-add-topping"
                            >
                              {createToppingMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>

                        {/* Existing Toppings List - Grouped by Menu Item */}
                        <div className="space-y-3">
                          {(() => {
                            const groupedToppings = extraToppings.reduce((acc, topping) => {
                              const menuItem = menuItems.find(m => m.id === (topping as any).menuItemId);
                              const key = menuItem?.id || 'global';
                              if (!acc[key]) acc[key] = { menuItem, toppings: [] };
                              acc[key].toppings.push(topping);
                              return acc;
                            }, {} as Record<string, { menuItem: any; toppings: typeof extraToppings }>);

                            return Object.entries(groupedToppings).map(([key, { menuItem, toppings }]) => (
                              <div key={key} className="space-y-1">
                                {menuItem && (
                                  <p className="text-xs font-medium text-primary flex items-center gap-1">
                                    <UtensilsCrossed className="h-3 w-3" />
                                    {menuItem.name}
                                  </p>
                                )}
                                {toppings.map((topping) => (
                                  <div 
                                    key={topping.id} 
                                    className={`flex items-center gap-2 rounded-lg p-2 ${topping.isActive !== false ? 'bg-secondary/30' : 'bg-red-500/10 border border-red-500/30'}`}
                                    data-testid={`topping-row-${topping.id}`}
                                  >
                                    {editingToppingId === topping.id ? (
                                      <>
                                        <Input 
                                          value={editingToppingName}
                                          onChange={(e) => setEditingToppingName(e.target.value)}
                                          className="h-7 flex-1"
                                          data-testid={`input-edit-topping-name-${topping.id}`}
                                        />
                                        <div className="flex items-center gap-1">
                                          <span className="text-sm">{currencySymbol}</span>
                                          <Input 
                                            value={editingToppingPrice}
                                            onChange={(e) => setEditingToppingPrice(e.target.value)}
                                            className="h-7 w-16"
                                            data-testid={`input-edit-topping-price-${topping.id}`}
                                          />
                                        </div>
                                        <Button 
                                          size="icon" 
                                          variant="ghost" 
                                          className="h-7 w-7 text-green-500"
                                          onClick={() => updateToppingMutation.mutate({ id: topping.id, data: { name: editingToppingName, price: editingToppingPrice } })}
                                          disabled={updateToppingMutation.isPending}
                                          data-testid={`button-save-topping-${topping.id}`}
                                        >
                                          <Check className="h-4 w-4" />
                                        </Button>
                                        <Button 
                                          size="icon" 
                                          variant="ghost" 
                                          className="h-7 w-7"
                                          onClick={() => { setEditingToppingId(null); setEditingToppingName(""); setEditingToppingPrice(""); }}
                                        >
                                          <X className="h-4 w-4" />
                                        </Button>
                                      </>
                                    ) : (
                                      <>
                                        <div className="flex-1">
                                          <p className={`font-medium text-sm ${topping.isActive === false ? 'line-through text-muted-foreground' : ''}`}>
                                            {topping.name}
                                          </p>
                                        </div>
                                        <Switch
                                          checked={topping.isActive !== false}
                                          onCheckedChange={(checked) => updateToppingMutation.mutate({ id: topping.id, data: { isActive: checked } })}
                                          data-testid={`switch-topping-active-${topping.id}`}
                                          className="data-[state=unchecked]:bg-red-500"
                                        />
                                        <span className="text-sm font-medium w-12 text-right">{currencySymbol}{topping.price}</span>
                                        <Button 
                                          size="icon" 
                                          variant="ghost" 
                                          className="h-7 w-7"
                                          onClick={() => { 
                                            setEditingToppingId(topping.id); 
                                            setEditingToppingName(topping.name); 
                                            setEditingToppingPrice(topping.price); 
                                          }}
                                          data-testid={`button-edit-topping-${topping.id}`}
                                        >
                                          <UtensilsCrossed className="h-3 w-3" />
                                        </Button>
                                        <Button 
                                          size="icon" 
                                          variant="ghost" 
                                          className="h-7 w-7 text-destructive hover:text-destructive"
                                          onClick={() => deleteToppingMutation.mutate(topping.id)}
                                          disabled={deleteToppingMutation.isPending}
                                          data-testid={`button-delete-topping-${topping.id}`}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ));
                          })()}

                          {extraToppings.length === 0 && (
                            <div className="text-center py-4 text-muted-foreground">
                              <Plus className="h-6 w-6 mx-auto mb-2 opacity-50" />
                              <p className="text-sm">No extra toppings yet</p>
                              <p className="text-xs">Add toppings above to get started</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Promotions Section - only show if enabled by super admin */}
                  {isFeatureEnabled('promotionsEnabled') && (
                  <div className="border-t pt-4 mt-4">
                    <Button 
                      variant="ghost" 
                      className="w-full justify-between"
                      onClick={() => setPromoExpanded(!promoExpanded)}
                      data-testid="button-expand-promotions"
                    >
                      <span className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Promotions {promotion?.isActive && <Badge className="ml-2 bg-green-500 text-white text-[10px]">ACTIVE</Badge>}
                      </span>
                      {promoExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>

                    {promoExpanded && (
                      <div className="mt-4 space-y-4 bg-secondary/20 rounded-lg p-4 border">
                        <div className="flex justify-between items-center">
                          <h4 className="font-semibold">Promotional Banner</h4>
                          <div className="flex items-center gap-2">
                            <Label htmlFor="promo-active" className="text-sm text-muted-foreground">Active</Label>
                            <Switch
                              id="promo-active"
                              checked={promoIsActive}
                              onCheckedChange={setPromoIsActive}
                              data-testid="switch-promo-active"
                            />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Headline *</Label>
                            <Input 
                              value={promoHeadline}
                              onChange={(e) => setPromoHeadline(e.target.value)}
                              placeholder="e.g., 25% off your 1st online order"
                              className="h-8"
                              data-testid="input-promo-headline"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Subtext (optional)</Label>
                            <Input 
                              value={promoSubtext}
                              onChange={(e) => setPromoSubtext(e.target.value)}
                              placeholder="e.g., Use code WELCOME25"
                              className="h-8"
                              data-testid="input-promo-subtext"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs">Background Color</Label>
                              <div className="flex gap-2">
                                <input 
                                  type="color"
                                  value={promoBgColor}
                                  onChange={(e) => setPromoBgColor(e.target.value)}
                                  className="h-8 w-10 rounded border cursor-pointer"
                                  data-testid="input-promo-bg-color"
                                />
                                <Input 
                                  value={promoBgColor}
                                  onChange={(e) => setPromoBgColor(e.target.value)}
                                  className="h-8 flex-1"
                                />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Text Color</Label>
                              <div className="flex gap-2">
                                <input 
                                  type="color"
                                  value={promoTextColor}
                                  onChange={(e) => setPromoTextColor(e.target.value)}
                                  className="h-8 w-10 rounded border cursor-pointer"
                                  data-testid="input-promo-text-color"
                                />
                                <Input 
                                  value={promoTextColor}
                                  onChange={(e) => setPromoTextColor(e.target.value)}
                                  className="h-8 flex-1"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Preview */}
                        {promoHeadline && (
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Preview</Label>
                            <div 
                              className="p-3 rounded-lg text-center"
                              style={{ backgroundColor: promoBgColor, color: promoTextColor }}
                            >
                              <p className="font-bold text-sm">{promoHeadline}</p>
                              {promoSubtext && <p className="text-xs opacity-90">{promoSubtext}</p>}
                            </div>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Button 
                            onClick={handleSavePromotion}
                            className="flex-1"
                            data-testid="button-save-promo"
                          >
                            {promotion ? "Update Promotion" : "Create Promotion"}
                          </Button>
                          {promotion && (
                            <Button 
                              variant="destructive"
                              onClick={handleDeletePromotion}
                              data-testid="button-delete-promo"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  )}

                  {/* Branding Section - only show if enabled by super admin */}
                  {isFeatureEnabled('brandingEnabled') && (
                  <div className="border-t pt-4 mt-4">
                    <Button 
                      variant="ghost" 
                      className="w-full justify-between"
                      onClick={() => setBrandingExpanded(!brandingExpanded)}
                      data-testid="button-expand-branding"
                    >
                      <span className="flex items-center gap-2">
                        <Store className="h-4 w-4" />
                        Branding & Highlight Image
                      </span>
                      {brandingExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>

                    {brandingExpanded && (
                      <div className="mt-4 space-y-4 bg-secondary/20 rounded-lg p-4 border">
                        <p className="text-xs text-muted-foreground">
                          Manage your restaurant logo and highlight images.
                        </p>

                        {/* Logo Section */}
                        <div className="space-y-2 border-b pb-4">
                          <Label className="text-xs font-medium">Restaurant Logo</Label>
                          <div className="flex items-center gap-4">
                            <img 
                              src={restaurant?.logoUrl || "https://flipdish.imgix.net/Q92vjMBZrCS3eeVpIVpQHYiTJf8.png?w=60"}
                              alt="Logo"
                              className="w-16 h-16 object-contain rounded-full border bg-white p-1"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "https://flipdish.imgix.net/Q92vjMBZrCS3eeVpIVpQHYiTJf8.png?w=60";
                              }}
                            />
                            <div className="flex-1">
                              <p className="text-xs text-muted-foreground mb-2">
                                Your logo appears in the header and footer of your restaurant page.
                              </p>
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                                className="hidden"
                                id="logo-image-upload"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  
                                  if (file.size > 5 * 1024 * 1024) {
                                    toast({ title: "File too large", description: "Maximum size is 5MB", variant: "destructive" });
                                    return;
                                  }
                                  
                                  try {
                                    const reader = new FileReader();
                                    reader.onload = async () => {
                                      const base64 = reader.result as string;
                                      const response = await fetch('/api/upload-image', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ image: base64, filename: file.name })
                                      });
                                      
                                      if (!response.ok) throw new Error('Upload failed');
                                      
                                      const { url } = await response.json();
                                      
                                      await fetch(`/api/restaurants/${restaurantId}`, {
                                        method: 'PATCH',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ logoUrl: url })
                                      });
                                      
                                      queryClient.invalidateQueries({ queryKey: ["/api/restaurants", slug] });
                                      toast({ title: "Logo updated", description: "Restaurant logo changed successfully" });
                                    };
                                    reader.readAsDataURL(file);
                                  } catch (error) {
                                    toast({ title: "Upload failed", description: "Could not upload logo", variant: "destructive" });
                                  } finally {
                                    e.target.value = '';
                                  }
                                }}
                                data-testid="input-logo-upload"
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8"
                                onClick={() => document.getElementById('logo-image-upload')?.click()}
                                data-testid="button-logo-upload"
                              >
                                <Upload className="h-3 w-3 mr-2" />
                                Upload Logo (PNG, JPG, SVG, GIF)
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Current Highlight Image */}
                        <div className="space-y-2">
                          <Label className="text-xs font-medium">Highlight Image</Label>
                          <div className="flex items-center gap-4">
                            <img 
                              src={restaurant?.welcomeImageUrl || restaurant?.logoUrl || "/uploads/placeholder.jpg"}
                              alt="Highlight"
                              className="w-24 h-24 object-cover rounded-lg border"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=200";
                              }}
                            />
                            <div className="flex-1">
                              <p className="text-xs text-muted-foreground mb-2">
                                This image appears in the "Welcome" section of your restaurant page.
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Upload New Image */}
                        <div className="space-y-2">
                          <Label className="text-xs font-medium">Upload New Image</Label>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                            className="hidden"
                            id="highlight-image-upload"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              
                              if (file.size > 5 * 1024 * 1024) {
                                toast({ title: "File too large", description: "Maximum size is 5MB", variant: "destructive" });
                                return;
                              }
                              
                              setIsUploadingHighlightImage(true);
                              try {
                                const reader = new FileReader();
                                reader.onload = async () => {
                                  const base64 = reader.result as string;
                                  const response = await fetch('/api/upload-image', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ image: base64, filename: file.name })
                                  });
                                  
                                  if (!response.ok) throw new Error('Upload failed');
                                  
                                  const { url } = await response.json();
                                  
                                  // Update restaurant with new highlight image
                                  await fetch(`/api/restaurants/${restaurantId}`, {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ welcomeImageUrl: url })
                                  });
                                  
                                  queryClient.invalidateQueries({ queryKey: ["/api/restaurants", slug] });
                                  toast({ title: "Image updated", description: "Highlight image changed successfully" });
                                };
                                reader.readAsDataURL(file);
                              } catch (error) {
                                toast({ title: "Upload failed", description: "Could not upload image", variant: "destructive" });
                              } finally {
                                setIsUploadingHighlightImage(false);
                                e.target.value = '';
                              }
                            }}
                            data-testid="input-highlight-image-upload"
                          />
                          <Button
                            variant="outline"
                            className="w-full h-10"
                            onClick={() => document.getElementById('highlight-image-upload')?.click()}
                            disabled={isUploadingHighlightImage}
                            data-testid="button-highlight-image-upload"
                          >
                            {isUploadingHighlightImage ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Upload className="h-4 w-4 mr-2" />
                            )}
                            {isUploadingHighlightImage ? "Uploading..." : "Choose New Highlight Image"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                  )}

                  {/* Theme Colors Section */}
                  <div className="border-t pt-4 mt-4">
                    <Button 
                      variant="ghost" 
                      className="w-full justify-between"
                      onClick={() => setThemeExpanded(!themeExpanded)}
                      data-testid="button-expand-theme"
                    >
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-purple-500"></span>
                        Theme Colors
                      </span>
                      {themeExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>

                    {themeExpanded && (
                      <div className="mt-4 space-y-4 bg-secondary/20 rounded-lg p-4 border">
                        <p className="text-xs text-muted-foreground">
                          Customize the colors used throughout your restaurant's public pages.
                        </p>

                        {/* Color Pickers Grid */}
                        <div className="grid grid-cols-2 gap-4">
                          {/* Primary Color */}
                          <div className="space-y-2">
                            <Label className="text-xs font-medium">Primary Color</Label>
                            <div className="flex items-center gap-2">
                              <input 
                                type="color" 
                                value={primaryColor}
                                onChange={(e) => setPrimaryColor(e.target.value)}
                                className="w-10 h-10 rounded cursor-pointer border-0"
                                data-testid="input-primary-color"
                              />
                              <Input 
                                value={primaryColor}
                                onChange={(e) => setPrimaryColor(e.target.value)}
                                className="h-8 flex-1 font-mono text-xs"
                                data-testid="input-primary-color-text"
                              />
                            </div>
                          </div>

                          {/* Secondary Color */}
                          <div className="space-y-2">
                            <Label className="text-xs font-medium">Secondary Color</Label>
                            <div className="flex items-center gap-2">
                              <input 
                                type="color" 
                                value={secondaryColor}
                                onChange={(e) => setSecondaryColor(e.target.value)}
                                className="w-10 h-10 rounded cursor-pointer border-0"
                                data-testid="input-secondary-color"
                              />
                              <Input 
                                value={secondaryColor}
                                onChange={(e) => setSecondaryColor(e.target.value)}
                                className="h-8 flex-1 font-mono text-xs"
                                data-testid="input-secondary-color-text"
                              />
                            </div>
                          </div>

                          {/* Accent Color */}
                          <div className="space-y-2">
                            <Label className="text-xs font-medium">Accent Color</Label>
                            <div className="flex items-center gap-2">
                              <input 
                                type="color" 
                                value={accentColor}
                                onChange={(e) => setAccentColor(e.target.value)}
                                className="w-10 h-10 rounded cursor-pointer border-0"
                                data-testid="input-accent-color"
                              />
                              <Input 
                                value={accentColor}
                                onChange={(e) => setAccentColor(e.target.value)}
                                className="h-8 flex-1 font-mono text-xs"
                                data-testid="input-accent-color-text"
                              />
                            </div>
                          </div>

                          {/* Header Background */}
                          <div className="space-y-2">
                            <Label className="text-xs font-medium">Header Background</Label>
                            <div className="flex items-center gap-2">
                              <input 
                                type="color" 
                                value={headerBgColor}
                                onChange={(e) => setHeaderBgColor(e.target.value)}
                                className="w-10 h-10 rounded cursor-pointer border-0"
                                data-testid="input-header-bg-color"
                              />
                              <Input 
                                value={headerBgColor}
                                onChange={(e) => setHeaderBgColor(e.target.value)}
                                className="h-8 flex-1 font-mono text-xs"
                                data-testid="input-header-bg-color-text"
                              />
                            </div>
                          </div>

                          {/* Card Background */}
                          <div className="space-y-2">
                            <Label className="text-xs font-medium">Card Background</Label>
                            <div className="flex items-center gap-2">
                              <input 
                                type="color" 
                                value={cardBgColor}
                                onChange={(e) => setCardBgColor(e.target.value)}
                                className="w-10 h-10 rounded cursor-pointer border-0"
                                data-testid="input-card-bg-color"
                              />
                              <Input 
                                value={cardBgColor}
                                onChange={(e) => setCardBgColor(e.target.value)}
                                className="h-8 flex-1 font-mono text-xs"
                                data-testid="input-card-bg-color-text"
                              />
                            </div>
                          </div>

                          {/* Button Color */}
                          <div className="space-y-2">
                            <Label className="text-xs font-medium">Button Color</Label>
                            <div className="flex items-center gap-2">
                              <input 
                                type="color" 
                                value={buttonColor}
                                onChange={(e) => setButtonColor(e.target.value)}
                                className="w-10 h-10 rounded cursor-pointer border-0"
                                data-testid="input-button-color"
                              />
                              <Input 
                                value={buttonColor}
                                onChange={(e) => setButtonColor(e.target.value)}
                                className="h-8 flex-1 font-mono text-xs"
                                data-testid="input-button-color-text"
                              />
                            </div>
                          </div>

                          {/* Text Color */}
                          <div className="space-y-2">
                            <Label className="text-xs font-medium">Text Color</Label>
                            <div className="flex items-center gap-2">
                              <input 
                                type="color" 
                                value={textColor}
                                onChange={(e) => setTextColor(e.target.value)}
                                className="w-10 h-10 rounded cursor-pointer border-0"
                                data-testid="input-text-color"
                              />
                              <Input 
                                value={textColor}
                                onChange={(e) => setTextColor(e.target.value)}
                                className="h-8 flex-1 font-mono text-xs"
                                data-testid="input-text-color-text"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Color Preview */}
                        <div className="space-y-2 pt-2 border-t">
                          <Label className="text-xs font-medium">Preview</Label>
                          <div 
                            className="rounded-lg p-4 border"
                            style={{ backgroundColor: headerBgColor }}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <span style={{ color: textColor }} className="font-semibold text-sm">Header Preview</span>
                              <button 
                                style={{ backgroundColor: buttonColor, color: textColor }}
                                className="px-3 py-1 rounded text-xs font-medium"
                              >
                                Button
                              </button>
                            </div>
                            <div 
                              className="rounded p-3"
                              style={{ backgroundColor: cardBgColor }}
                            >
                              <p style={{ color: primaryColor }} className="font-semibold text-sm">Primary Text</p>
                              <p style={{ color: secondaryColor }} className="text-xs">Secondary Text</p>
                              <p style={{ color: accentColor }} className="text-xs mt-1">Accent Color</p>
                            </div>
                          </div>
                        </div>

                        {/* Save Button */}
                        <Button 
                          className="w-full"
                          onClick={async () => {
                            if (!restaurantId) return;
                            try {
                              const res = await fetch(`/api/restaurants/${restaurantId}`, {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ 
                                  primaryColor,
                                  secondaryColor,
                                  accentColor,
                                  headerBgColor,
                                  cardBgColor,
                                  buttonColor,
                                  textColor,
                                }),
                              });
                              if (res.ok) {
                                queryClient.invalidateQueries({ queryKey: ["/api/restaurants", slug] });
                                toast({ title: "Theme Saved", description: "Your color settings have been updated." });
                              } else {
                                throw new Error("Failed to save");
                              }
                            } catch (error) {
                              toast({ title: "Error", description: "Failed to save theme colors", variant: "destructive" });
                            }
                          }}
                          data-testid="button-save-theme-colors"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Save Theme Colors
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Operating Hours Section - only show if enabled by super admin */}
                  {isFeatureEnabled('hoursEnabled') && (
                  <div className="border-t pt-4 mt-4">
                    <Button 
                      variant="ghost" 
                      className="w-full justify-between"
                      onClick={() => setHoursExpanded(!hoursExpanded)}
                      data-testid="button-expand-hours"
                    >
                      <span className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Delivery & Collection Hours
                      </span>
                      {hoursExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>

                    {hoursExpanded && (
                      <div className="mt-4 space-y-4 bg-secondary/20 rounded-lg p-4 border">
                        <p className="text-xs text-muted-foreground">
                          Set your delivery and collection hours for each day of the week.
                        </p>

                        {/* Delivery Hours */}
                        <div className="space-y-2">
                          <Label className="text-xs font-medium flex items-center gap-2">
                            <Truck className="h-3 w-3" /> Delivery Hours
                          </Label>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div className="space-y-1">
                              <Label className="text-[10px] text-muted-foreground">Mon - Thu</Label>
                              <Input 
                                value={deliveryHoursMonThu}
                                onChange={(e) => setDeliveryHoursMonThu(e.target.value)}
                                placeholder="12PM - 10:30PM"
                                className="h-8 text-xs"
                                data-testid="input-delivery-mon-thu"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-[10px] text-muted-foreground">Fri - Sat</Label>
                              <Input 
                                value={deliveryHoursFriSat}
                                onChange={(e) => setDeliveryHoursFriSat(e.target.value)}
                                placeholder="12PM - 11:30PM"
                                className="h-8 text-xs"
                                data-testid="input-delivery-fri-sat"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-[10px] text-muted-foreground">Sunday</Label>
                              <Input 
                                value={deliveryHoursSun}
                                onChange={(e) => setDeliveryHoursSun(e.target.value)}
                                placeholder="12PM - 10:30PM"
                                className="h-8 text-xs"
                                data-testid="input-delivery-sun"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Collection Hours */}
                        <div className="space-y-2">
                          <Label className="text-xs font-medium flex items-center gap-2">
                            <ShoppingBag className="h-3 w-3" /> Collection Hours
                          </Label>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div className="space-y-1">
                              <Label className="text-[10px] text-muted-foreground">Mon - Thu</Label>
                              <Input 
                                value={collectionHoursMonThu}
                                onChange={(e) => setCollectionHoursMonThu(e.target.value)}
                                placeholder="12PM - 10:30PM"
                                className="h-8 text-xs"
                                data-testid="input-collection-mon-thu"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-[10px] text-muted-foreground">Fri - Sat</Label>
                              <Input 
                                value={collectionHoursFriSat}
                                onChange={(e) => setCollectionHoursFriSat(e.target.value)}
                                placeholder="12PM - 11:30PM"
                                className="h-8 text-xs"
                                data-testid="input-collection-fri-sat"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-[10px] text-muted-foreground">Sunday</Label>
                              <Input 
                                value={collectionHoursSun}
                                onChange={(e) => setCollectionHoursSun(e.target.value)}
                                placeholder="12PM - 10:30PM"
                                className="h-8 text-xs"
                                data-testid="input-collection-sun"
                              />
                            </div>
                          </div>
                        </div>

                        <Button 
                          onClick={async () => {
                            if (!restaurantId) return;
                            try {
                              const res = await fetch(`/api/restaurants/${restaurantId}`, {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ 
                                  deliveryHoursMonThu,
                                  deliveryHoursFriSat,
                                  deliveryHoursSun,
                                  collectionHoursMonThu,
                                  collectionHoursFriSat,
                                  collectionHoursSun,
                                  acceptingOrders: true,
                                }),
                              });
                              if (res.ok) {
                                queryClient.invalidateQueries({ queryKey: ["/api/restaurants", slug] });
                                toast({ title: "Hours Saved & Orders Enabled", description: "Your operating hours have been updated and orders are now enabled." });
                              } else {
                                throw new Error("Failed to update");
                              }
                            } catch (error) {
                              toast({ title: "Error", description: "Failed to save hours", variant: "destructive" });
                            }
                          }}
                          variant="outline"
                          size="sm"
                          className="w-full"
                          data-testid="button-save-hours"
                        >
                          Save Operating Hours
                        </Button>
                      </div>
                    )}
                  </div>
                  )}

                  {/* Collection Discount Section */}
                  <div className="border-t pt-4 mt-4">
                    <Button 
                      variant="ghost" 
                      className="w-full justify-between"
                      onClick={() => setDiscountExpanded(!discountExpanded)}
                      data-testid="button-expand-discount"
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-green-500">%</span>
                        Collection Discount
                      </span>
                      {discountExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>

                    {discountExpanded && (
                      <div className="mt-4 space-y-4 bg-secondary/20 rounded-lg p-4 border">
                        <p className="text-xs text-muted-foreground">
                          Set a discount percentage for collection orders over a minimum amount.
                        </p>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <Label className="text-xs font-medium">Discount Percent (%)</Label>
                            <Input 
                              type="number"
                              min="0"
                              max="100"
                              value={collectionDiscountPercent}
                              onChange={(e) => setCollectionDiscountPercent(Number(e.target.value))}
                              placeholder="10"
                              className="h-8 text-xs"
                              data-testid="input-discount-percent"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs font-medium">Minimum Order (£)</Label>
                            <Input 
                              type="number"
                              min="0"
                              step="0.01"
                              value={collectionDiscountMinimum}
                              onChange={(e) => setCollectionDiscountMinimum(e.target.value)}
                              placeholder="15.00"
                              className="h-8 text-xs"
                              data-testid="input-discount-minimum"
                            />
                          </div>
                        </div>

                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <p className="text-xs text-green-700 text-center">
                            Preview: ✨ {collectionDiscountPercent}% discount over {currencySymbol}{Number(collectionDiscountMinimum).toFixed(2)} on collection
                          </p>
                        </div>

                        <Button 
                          onClick={async () => {
                            if (!restaurantId) return;
                            try {
                              const res = await fetch(`/api/restaurants/${restaurantId}`, {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ 
                                  collectionDiscountPercent,
                                  collectionDiscountMinimum,
                                }),
                              });
                              if (res.ok) {
                                queryClient.invalidateQueries({ queryKey: ["/api/restaurants", slug] });
                                toast({ title: "Discount Saved", description: "Collection discount settings have been updated." });
                              } else {
                                throw new Error("Failed to update");
                              }
                            } catch (error) {
                              toast({ title: "Error", description: "Failed to save discount settings", variant: "destructive" });
                            }
                          }}
                          variant="outline"
                          size="sm"
                          className="w-full"
                          data-testid="button-save-discount"
                        >
                          Save Discount Settings
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Delivery Time Section */}
                  <div className="border-t pt-4 mt-4">
                    <Button 
                      variant="ghost" 
                      className="w-full justify-between"
                      onClick={() => setDeliveryTimeExpanded(!deliveryTimeExpanded)}
                      data-testid="button-expand-delivery-time"
                    >
                      <span className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-500" />
                        Delivery Time ({deliveryTimeMinutes} mins)
                      </span>
                      {deliveryTimeExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>

                    {deliveryTimeExpanded && (
                      <div className="mt-4 space-y-4 bg-secondary/20 rounded-lg p-4 border">
                        <p className="text-xs text-muted-foreground">
                          Set estimated delivery time shown to customers. Increase during busy periods.
                        </p>

                        <div className="space-y-3">
                          <div className="space-y-1">
                            <Label className="text-xs font-medium">Estimated Delivery Time (minutes)</Label>
                            <div className="flex gap-2">
                              {[15, 30, 45, 60, 90].map((mins) => (
                                <Button
                                  key={mins}
                                  variant={deliveryTimeMinutes === mins ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => setDeliveryTimeMinutes(mins)}
                                  className="flex-1"
                                  data-testid={`button-time-${mins}`}
                                >
                                  {mins}m
                                </Button>
                              ))}
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                            <Label className="text-xs font-medium">Custom Time</Label>
                            <Input 
                              type="number"
                              min="5"
                              max="180"
                              value={deliveryTimeMinutes}
                              onChange={(e) => setDeliveryTimeMinutes(Number(e.target.value))}
                              placeholder="45"
                              className="h-8 text-xs"
                              data-testid="input-delivery-time"
                            />
                          </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-xs text-blue-700 text-center">
                            🚚 Customer sees: "Delivery Time: Today - {deliveryTimeMinutes} Minutes"
                          </p>
                        </div>

                        <Button 
                          onClick={async () => {
                            if (!restaurantId) return;
                            try {
                              const res = await fetch(`/api/restaurants/${restaurantId}`, {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ 
                                  deliveryTimeMinutes,
                                }),
                              });
                              if (res.ok) {
                                queryClient.invalidateQueries({ queryKey: ["/api/restaurants", slug] });
                                toast({ title: "Delivery Time Saved", description: `Estimated delivery time set to ${deliveryTimeMinutes} minutes.` });
                              } else {
                                throw new Error("Failed to update");
                              }
                            } catch (error) {
                              toast({ title: "Error", description: "Failed to save delivery time", variant: "destructive" });
                            }
                          }}
                          variant="outline"
                          size="sm"
                          className="w-full"
                          data-testid="button-save-delivery-time"
                        >
                          Save Delivery Time
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Hero Gallery Section - only show if enabled by super admin */}
                  {isFeatureEnabled('heroGalleryEnabled') && (
                  <div className="border-t pt-4 mt-4">
                    <Button 
                      variant="ghost" 
                      className="w-full justify-between"
                      onClick={() => setHeroGalleryExpanded(!heroGalleryExpanded)}
                      data-testid="button-expand-hero-gallery"
                    >
                      <span className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" />
                        Hero Gallery {heroImages.length > 0 && <Badge className="ml-2 bg-blue-500 text-white text-[10px]">{heroImages.length} IMAGES</Badge>}
                      </span>
                      {heroGalleryExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>

                    {heroGalleryExpanded && (
                      <div className="mt-4 space-y-4 bg-secondary/20 rounded-lg p-4 border">
                        <p className="text-xs text-muted-foreground">
                          Add multiple images to create a sliding carousel on your landing page. Supports shop front, interior, and food photos.
                        </p>

                        {/* Animation Effect Selector */}
                        <div className="space-y-2">
                          <Label className="text-xs font-medium">Transition Effect</Label>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {ANIMATION_EFFECTS.map((effect) => (
                              <button
                                key={effect.id}
                                onClick={() => setSelectedAnimationEffect(effect.id)}
                                className={`p-2 rounded-lg border text-xs transition-all ${
                                  selectedAnimationEffect === effect.id 
                                    ? 'bg-primary text-primary-foreground border-primary' 
                                    : 'bg-secondary/50 hover:bg-secondary border-border'
                                }`}
                                data-testid={`button-effect-${effect.id}`}
                              >
                                <div className="font-medium">{effect.name}</div>
                                <div className="text-[10px] opacity-70">{effect.description}</div>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Slide Interval */}
                        <div className="space-y-1">
                          <Label className="text-xs">Slide Interval (seconds)</Label>
                          <Select
                            value={String(heroSlideInterval / 1000)}
                            onValueChange={(v) => setHeroSlideInterval(Number(v) * 1000)}
                          >
                            <SelectTrigger className="h-8" data-testid="select-slide-interval">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="3">3 seconds</SelectItem>
                              <SelectItem value="4">4 seconds</SelectItem>
                              <SelectItem value="5">5 seconds</SelectItem>
                              <SelectItem value="7">7 seconds</SelectItem>
                              <SelectItem value="10">10 seconds</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Gradient Background Colors */}
                        <div className="space-y-2">
                          <Label className="text-xs font-medium">Slider Background Gradient</Label>
                          <p className="text-[10px] text-muted-foreground">
                            Choose colors that show when images are sliding
                          </p>
                          <div className="grid grid-cols-3 gap-2">
                            <div className="space-y-1">
                              <Label className="text-[10px]">Start Color</Label>
                              <div className="flex gap-1">
                                <input 
                                  type="color"
                                  value={heroGradientStart}
                                  onChange={(e) => setHeroGradientStart(e.target.value)}
                                  className="w-8 h-8 rounded cursor-pointer border-0"
                                  data-testid="input-gradient-start"
                                />
                                <Input 
                                  value={heroGradientStart}
                                  onChange={(e) => setHeroGradientStart(e.target.value)}
                                  className="h-8 text-[10px] flex-1"
                                  data-testid="input-gradient-start-text"
                                />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-[10px]">Middle Color</Label>
                              <div className="flex gap-1">
                                <input 
                                  type="color"
                                  value={heroGradientMiddle}
                                  onChange={(e) => setHeroGradientMiddle(e.target.value)}
                                  className="w-8 h-8 rounded cursor-pointer border-0"
                                  data-testid="input-gradient-middle"
                                />
                                <Input 
                                  value={heroGradientMiddle}
                                  onChange={(e) => setHeroGradientMiddle(e.target.value)}
                                  className="h-8 text-[10px] flex-1"
                                  data-testid="input-gradient-middle-text"
                                />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-[10px]">End Color</Label>
                              <div className="flex gap-1">
                                <input 
                                  type="color"
                                  value={heroGradientEnd}
                                  onChange={(e) => setHeroGradientEnd(e.target.value)}
                                  className="w-8 h-8 rounded cursor-pointer border-0"
                                  data-testid="input-gradient-end"
                                />
                                <Input 
                                  value={heroGradientEnd}
                                  onChange={(e) => setHeroGradientEnd(e.target.value)}
                                  className="h-8 text-[10px] flex-1"
                                  data-testid="input-gradient-end-text"
                                />
                              </div>
                            </div>
                          </div>
                          {/* Gradient Preview */}
                          <div 
                            className="h-8 rounded-lg mt-2"
                            style={{
                              background: `linear-gradient(135deg, ${heroGradientStart} 0%, ${heroGradientMiddle} 50%, ${heroGradientEnd} 100%)`
                            }}
                            data-testid="gradient-preview"
                          />
                        </div>

                        <Button 
                          onClick={handleSaveHeroSettings}
                          variant="outline"
                          size="sm"
                          className="w-full"
                          data-testid="button-save-hero-settings"
                        >
                          Save Effect & Interval Settings
                        </Button>

                        {/* Existing Images */}
                        {heroImages.length > 0 && (
                          <div className="space-y-2">
                            <Label className="text-xs font-medium">Current Images ({heroImages.length}/10)</Label>
                            <div className="space-y-2">
                              {heroImages.map((image, index) => (
                                <div 
                                  key={image.id}
                                  className={`flex items-center gap-2 p-2 rounded-lg border ${
                                    image.isActive ? 'bg-secondary/30' : 'bg-secondary/10 opacity-60'
                                  }`}
                                >
                                  <img 
                                    src={image.imageUrl}
                                    alt={image.label || `Hero ${index + 1}`}
                                    className="w-16 h-12 object-cover rounded"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200";
                                    }}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs truncate">{image.label || `Image ${index + 1}`}</p>
                                    <p className="text-[10px] text-muted-foreground truncate">{image.imageUrl}</p>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                      onClick={() => moveHeroImage(index, 'up')}
                                      disabled={index === 0}
                                      data-testid={`button-move-up-${image.id}`}
                                    >
                                      <ChevronUp className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                      onClick={() => moveHeroImage(index, 'down')}
                                      disabled={index === heroImages.length - 1}
                                      data-testid={`button-move-down-${image.id}`}
                                    >
                                      <ChevronDown className="h-3 w-3" />
                                    </Button>
                                    <Switch
                                      checked={image.isActive ?? true}
                                      onCheckedChange={(checked) => handleToggleHeroImage(image.id, checked)}
                                      data-testid={`switch-hero-active-${image.id}`}
                                    />
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                      onClick={() => handleDeleteHeroImage(image.id)}
                                      data-testid={`button-delete-hero-${image.id}`}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Add New Image */}
                        {heroImages.length < 10 && (
                          <div className="space-y-3 border-t pt-4">
                            <Label className="text-xs font-medium">Add New Image</Label>
                            
                            {/* File Upload Option */}
                            <div className="space-y-2">
                              <Label className="text-[10px] text-muted-foreground">Upload from device (images or MP4 videos)</Label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="file"
                                  accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml,video/mp4"
                                  className="hidden"
                                  id="hero-image-upload"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    
                                    const isVideo = file.type === 'video/mp4';
                                    const maxSize = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
                                    
                                    if (file.size > maxSize) {
                                      toast({ title: "File too large", description: isVideo ? "Maximum video size is 50MB" : "Maximum image size is 5MB", variant: "destructive" });
                                      return;
                                    }
                                    
                                    setIsUploadingHeroImage(true);
                                    try {
                                      const formData = new FormData();
                                      formData.append('image', file);
                                      formData.append('label', newHeroImageLabel || file.name.replace(/\.[^/.]+$/, ""));
                                      
                                      const response = await fetch(`/api/restaurants/${restaurantId}/hero-images/upload`, {
                                        method: 'POST',
                                        body: formData
                                      });
                                      
                                      if (!response.ok) {
                                        throw new Error('Upload failed');
                                      }
                                      
                                      queryClient.invalidateQueries({ queryKey: ["/api/hero-images", restaurantId] });
                                      setNewHeroImageLabel("");
                                      toast({ title: isVideo ? "Video uploaded" : "Image uploaded", description: "Hero media added successfully" });
                                    } catch (error) {
                                      toast({ title: "Upload failed", description: "Could not upload file", variant: "destructive" });
                                    } finally {
                                      setIsUploadingHeroImage(false);
                                      e.target.value = '';
                                    }
                                  }}
                                  data-testid="input-hero-file-upload"
                                />
                                <Button
                                  variant="outline"
                                  className="flex-1 h-10 bg-green-600/20 hover:bg-green-600/40 border-green-600 text-green-400 font-semibold"
                                  onClick={() => document.getElementById('hero-image-upload')?.click()}
                                  disabled={isUploadingHeroImage}
                                  data-testid="button-hero-file-upload"
                                >
                                  {isUploadingHeroImage ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  ) : (
                                    <Upload className="h-4 w-4 mr-2" />
                                  )}
                                  {isUploadingHeroImage ? "Uploading & Saving..." : "Choose File & Save"}
                                </Button>
                              </div>
                            </div>
                            
                            <div className="text-center text-[10px] text-muted-foreground">— or —</div>
                            
                            {/* URL Option */}
                            <div className="space-y-2">
                              <Label className="text-[10px] text-muted-foreground">Add from URL</Label>
                              <Input 
                                value={newHeroImageUrl}
                                onChange={(e) => setNewHeroImageUrl(e.target.value)}
                                placeholder="https://example.com/image.jpg"
                                className="h-8"
                                data-testid="input-new-hero-url"
                              />
                            </div>
                            
                            {/* Shared Label */}
                            <Input 
                              value={newHeroImageLabel}
                              onChange={(e) => setNewHeroImageLabel(e.target.value)}
                              placeholder="Label (optional) - e.g., 'Shop Front'"
                              className="h-8"
                              data-testid="input-new-hero-label"
                            />
                            
                            <Button 
                              onClick={handleAddHeroImage}
                              disabled={!newHeroImageUrl}
                              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold"
                              data-testid="button-add-hero-image"
                            >
                              <Save className="h-4 w-4 mr-2" />
                              Save Image
                            </Button>
                          </div>
                        )}

                        {heroImages.length >= 10 && (
                          <p className="text-xs text-muted-foreground text-center py-2">
                            Maximum 10 images reached. Delete an image to add more.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  )}

                  {/* Welcome Page Slider Images Section */}
                  <div className="border-t pt-4 mt-4">
                    <Button 
                      variant="ghost" 
                      className="w-full justify-between"
                      onClick={() => setWelcomeSliderExpanded(!welcomeSliderExpanded)}
                      data-testid="button-expand-welcome-slider"
                    >
                      <span className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4 text-orange-500" />
                        Welcome Page Slider {welcomeSliderImages.length > 0 && <Badge className="ml-2 bg-orange-500 text-white text-[10px]">{welcomeSliderImages.length} IMAGES</Badge>}
                      </span>
                      {welcomeSliderExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>

                    {welcomeSliderExpanded && (
                      <div className="mt-4 space-y-4 bg-secondary/20 rounded-lg p-4 border">
                        <p className="text-xs text-muted-foreground">
                          Manage the rotating background images for your welcome page hero section. Images will auto-rotate through the slider.
                        </p>

                        {welcomeSliderImages.length > 0 && (
                          <div className="grid grid-cols-2 gap-3">
                            {welcomeSliderImages.map((img, index) => (
                              <div key={index} className="relative group rounded-lg overflow-hidden border">
                                <img src={img} alt={`Slider ${index + 1}`} className="w-full h-24 object-cover" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={async () => {
                                      const newImages = [...welcomeSliderImages];
                                      if (index > 0) {
                                        [newImages[index], newImages[index - 1]] = [newImages[index - 1], newImages[index]];
                                        setWelcomeSliderImages(newImages);
                                        await fetch(`/api/restaurants/${restaurantId}`, {
                                          method: "PATCH",
                                          headers: { "Content-Type": "application/json" },
                                          body: JSON.stringify({ welcomeSliderImages: newImages }),
                                        });
                                        queryClient.invalidateQueries({ queryKey: ["/api/restaurants"] });
                                      }
                                    }}
                                    disabled={index === 0}
                                    className="h-6 w-6 p-0"
                                  >
                                    <ChevronUp className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={async () => {
                                      const newImages = [...welcomeSliderImages];
                                      if (index < newImages.length - 1) {
                                        [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
                                        setWelcomeSliderImages(newImages);
                                        await fetch(`/api/restaurants/${restaurantId}`, {
                                          method: "PATCH",
                                          headers: { "Content-Type": "application/json" },
                                          body: JSON.stringify({ welcomeSliderImages: newImages }),
                                        });
                                        queryClient.invalidateQueries({ queryKey: ["/api/restaurants"] });
                                      }
                                    }}
                                    disabled={index === welcomeSliderImages.length - 1}
                                    className="h-6 w-6 p-0"
                                  >
                                    <ChevronDown className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={async () => {
                                      const newImages = welcomeSliderImages.filter((_, i) => i !== index);
                                      setWelcomeSliderImages(newImages);
                                      await fetch(`/api/restaurants/${restaurantId}`, {
                                        method: "PATCH",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ welcomeSliderImages: newImages }),
                                      });
                                      queryClient.invalidateQueries({ queryKey: ["/api/restaurants"] });
                                      toast({ title: "Image removed" });
                                    }}
                                    className="h-6 w-6 p-0"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                                <div className="absolute bottom-1 left-1 bg-black/70 text-white text-[10px] px-1 rounded">
                                  #{index + 1}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {welcomeSliderImages.length < 10 && (
                          <div className="space-y-3 pt-2 border-t">
                            <Label className="text-xs font-medium">Add New Slider Image</Label>
                            
                            <div className="flex gap-2">
                              <label className="flex-1">
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file || !restaurantId) return;
                                    setIsUploadingWelcomeSlider(true);
                                    try {
                                      const formData = new FormData();
                                      formData.append('file', file);
                                      formData.append('label', file.name.replace(/\.[^/.]+$/, ""));
                                      const res = await fetch(`/api/restaurants/${restaurantId}/hero-images/upload`, {
                                        method: 'POST',
                                        body: formData,
                                      });
                                      if (res.ok) {
                                        const { imageUrl } = await res.json();
                                        const newImages = [...welcomeSliderImages, imageUrl];
                                        setWelcomeSliderImages(newImages);
                                        await fetch(`/api/restaurants/${restaurantId}`, {
                                          method: "PATCH",
                                          headers: { "Content-Type": "application/json" },
                                          body: JSON.stringify({ welcomeSliderImages: newImages }),
                                        });
                                        queryClient.invalidateQueries({ queryKey: ["/api/restaurants"] });
                                        toast({ title: "Image uploaded and saved!" });
                                      }
                                    } catch (err) {
                                      toast({ title: "Upload failed", variant: "destructive" });
                                    } finally {
                                      setIsUploadingWelcomeSlider(false);
                                    }
                                  }}
                                  disabled={isUploadingWelcomeSlider}
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  className="w-full"
                                  disabled={isUploadingWelcomeSlider}
                                  onClick={(e) => (e.currentTarget.previousElementSibling as HTMLInputElement)?.click()}
                                >
                                  {isUploadingWelcomeSlider ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                                  {isUploadingWelcomeSlider ? "Uploading..." : "Upload Image"}
                                </Button>
                              </label>
                            </div>

                            <div className="text-xs text-muted-foreground text-center">or paste URL</div>
                            
                            <div className="flex gap-2">
                              <Input
                                placeholder="https://example.com/image.jpg"
                                value={newWelcomeSliderUrl}
                                onChange={(e) => setNewWelcomeSliderUrl(e.target.value)}
                                className="flex-1"
                              />
                              <Button
                                onClick={async () => {
                                  if (!newWelcomeSliderUrl || !restaurantId) return;
                                  const newImages = [...welcomeSliderImages, newWelcomeSliderUrl];
                                  setWelcomeSliderImages(newImages);
                                  await fetch(`/api/restaurants/${restaurantId}`, {
                                    method: "PATCH",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ welcomeSliderImages: newImages }),
                                  });
                                  queryClient.invalidateQueries({ queryKey: ["/api/restaurants"] });
                                  setNewWelcomeSliderUrl("");
                                  toast({ title: "Image added!" });
                                }}
                                disabled={!newWelcomeSliderUrl}
                                className="bg-orange-600 hover:bg-orange-700"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}

                        {welcomeSliderImages.length >= 10 && (
                          <p className="text-xs text-muted-foreground text-center py-2">
                            Maximum 10 images reached. Delete an image to add more.
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Hero Video Section - for all branches */}
                  <div className="border-t pt-4 mt-4">
                    <Button 
                      variant="ghost" 
                      className="w-full justify-between"
                      onClick={() => setHeroVideoExpanded(!heroVideoExpanded)}
                      data-testid="button-expand-hero-video"
                    >
                      <span className="flex items-center gap-2">
                        <Video className="h-4 w-4 text-purple-500" />
                        Hero Video
                        {heroVideoUrl && <Badge className="ml-2 bg-purple-500 text-white text-[10px]">SET</Badge>}
                      </span>
                      {heroVideoExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>

                    {heroVideoExpanded && (
                      <div className="mt-4 space-y-4 bg-secondary/20 rounded-lg p-4 border">
                        <p className="text-xs text-muted-foreground">
                          Upload a background video for your landing page hero section. Supports MP4, WebM formats (max 100MB).
                        </p>

                        {/* Current Video Preview */}
                        {heroVideoUrl && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs font-medium">Current Hero Video</Label>
                              <Button
                                variant="destructive"
                                size="sm"
                                className="h-7 px-2"
                                onClick={async (e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  try {
                                    const res = await fetch(`/api/restaurants/${restaurantId}`, {
                                      method: "PATCH",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ heroVideoUrl: "" }),
                                    });
                                    if (res.ok) {
                                      setHeroVideoUrl("");
                                      queryClient.invalidateQueries({ queryKey: ["/api/restaurants", slug] });
                                      toast({ title: "Removed", description: "Hero video has been removed." });
                                    } else {
                                      throw new Error("Failed to remove");
                                    }
                                  } catch (error) {
                                    toast({ title: "Error", description: "Failed to remove video", variant: "destructive" });
                                  }
                                }}
                                data-testid="button-remove-hero-video"
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Delete
                              </Button>
                            </div>
                            <div className="rounded-lg overflow-hidden border">
                              <video 
                                src={heroVideoUrl}
                                className="w-full h-32 object-cover"
                                controls
                                muted
                              />
                            </div>
                          </div>
                        )}

                        {/* Upload Section */}
                        <div className="space-y-3">
                          <Label className="text-xs font-medium">
                            {heroVideoUrl ? "Replace Video" : "Upload Video"}
                          </Label>
                          
                          {/* File Upload */}
                          <div className="space-y-2">
                            <input
                              type="file"
                              accept="video/mp4,video/webm"
                              id="hero-video-upload"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                
                                if (file.size > 100 * 1024 * 1024) {
                                  toast({ title: "File too large", description: "Maximum size is 100MB", variant: "destructive" });
                                  return;
                                }
                                
                                setIsUploadingHeroVideo(true);
                                try {
                                  const formData = new FormData();
                                  formData.append("video", file);
                                  
                                  const uploadRes = await fetch("/api/upload-video", {
                                    method: "POST",
                                    body: formData,
                                  });
                                  
                                  if (uploadRes.ok) {
                                    const { url } = await uploadRes.json();
                                    
                                    // Save to restaurant
                                    const res = await fetch(`/api/restaurants/${restaurantId}`, {
                                      method: "PATCH",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ heroVideoUrl: url }),
                                    });
                                    
                                    if (res.ok) {
                                      setHeroVideoUrl(url);
                                      queryClient.invalidateQueries({ queryKey: ["/api/restaurants", slug] });
                                      toast({ title: "Uploaded!", description: "Hero video has been saved." });
                                    }
                                  } else {
                                    const errorData = await uploadRes.json().catch(() => ({}));
                                    throw new Error(errorData.error || "Upload failed");
                                  }
                                } catch (error: any) {
                                  toast({ title: "Error", description: error.message || "Failed to upload video", variant: "destructive" });
                                } finally {
                                  setIsUploadingHeroVideo(false);
                                }
                              }}
                              data-testid="input-hero-video-upload"
                            />
                            <Button 
                              variant="outline"
                              className="w-full"
                              onClick={() => document.getElementById('hero-video-upload')?.click()}
                              disabled={isUploadingHeroVideo}
                              data-testid="button-upload-hero-video"
                            >
                              {isUploadingHeroVideo ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Uploading...
                                </>
                              ) : (
                                <>
                                  <Upload className="h-4 w-4 mr-2" />
                                  Choose Video File
                                </>
                              )}
                            </Button>
                          </div>

                          {/* URL Input */}
                          <div className="space-y-2">
                            <Label className="text-[10px] text-muted-foreground">Or enter video URL</Label>
                            <Input 
                              placeholder="https://example.com/video.mp4"
                              value={heroVideoUrl}
                              onChange={(e) => setHeroVideoUrl(e.target.value)}
                              className="text-sm"
                              data-testid="input-hero-video-url"
                            />
                            <Button 
                              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                              disabled={!heroVideoUrl}
                              onClick={async () => {
                                try {
                                  const res = await fetch(`/api/restaurants/${restaurantId}`, {
                                    method: "PATCH",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ heroVideoUrl }),
                                  });
                                  if (res.ok) {
                                    queryClient.invalidateQueries({ queryKey: ["/api/restaurants", slug] });
                                    toast({ title: "Saved!", description: "Hero video URL has been saved." });
                                  } else {
                                    throw new Error("Failed to save");
                                  }
                                } catch (error) {
                                  toast({ title: "Error", description: "Failed to save video URL", variant: "destructive" });
                                }
                              }}
                              data-testid="button-save-hero-video-url"
                            >
                              <Save className="h-4 w-4 mr-2" />
                              Save URL
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Tawa Hero Image Section - for Tawa restaurant branches */}
                  {restaurant?.name?.toLowerCase().includes('tawa') && (
                  <div className="border-t pt-4 mt-4">
                    <Button 
                      variant="ghost" 
                      className="w-full justify-between"
                      onClick={() => setTawaHeroExpanded(!tawaHeroExpanded)}
                      data-testid="button-expand-tawa-hero"
                    >
                      <span className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4 text-orange-500" />
                        Tawa Menu Hero Image
                        {tawaHeroImage && <Badge className="ml-2 bg-orange-500 text-white text-[10px]">SET</Badge>}
                      </span>
                      {tawaHeroExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>

                    {tawaHeroExpanded && (
                      <div className="mt-4 space-y-4 bg-secondary/20 rounded-lg p-4 border">
                        <p className="text-xs text-muted-foreground">
                          Upload a banner image for the Tawa menu page. Supports PNG, JPG, GIF, and SVG formats.
                        </p>

                        {/* Current Image Preview */}
                        {tawaHeroImage && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs font-medium">Current Hero Image</Label>
                              <Button
                                variant="destructive"
                                size="sm"
                                className="h-7 px-2"
                                onClick={async (e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  try {
                                    const res = await fetch(`/api/restaurants/${restaurantId}`, {
                                      method: "PATCH",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ tawaHeroImage: "" }),
                                    });
                                    if (res.ok) {
                                      setTawaHeroImage("");
                                      queryClient.invalidateQueries({ queryKey: ["/api/restaurants", slug] });
                                      toast({ title: "Removed", description: "Tawa hero image has been removed." });
                                    } else {
                                      throw new Error("Failed to remove");
                                    }
                                  } catch (error) {
                                    toast({ title: "Error", description: "Failed to remove image", variant: "destructive" });
                                  }
                                }}
                                data-testid="button-remove-tawa-hero"
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Delete
                              </Button>
                            </div>
                            <div className="rounded-lg overflow-hidden border">
                              <img 
                                src={tawaHeroImage}
                                alt="Tawa Hero"
                                className="w-full h-32 object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400";
                                }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Upload Section */}
                        <div className="space-y-3">
                          <Label className="text-xs font-medium">
                            {tawaHeroImage ? "Replace Image" : "Upload Image"}
                          </Label>
                          
                          {/* File Upload */}
                          <div className="space-y-2">
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/gif,image/svg+xml"
                              id="tawa-hero-upload"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                
                                setIsUploadingTawaHero(true);
                                try {
                                  const formData = new FormData();
                                  formData.append("file", file);
                                  
                                  const uploadRes = await fetch("/api/upload", {
                                    method: "POST",
                                    body: formData,
                                  });
                                  
                                  if (uploadRes.ok) {
                                    const { url } = await uploadRes.json();
                                    
                                    // Save to restaurant
                                    const res = await fetch(`/api/restaurants/${restaurantId}`, {
                                      method: "PATCH",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ tawaHeroImage: url }),
                                    });
                                    
                                    if (res.ok) {
                                      setTawaHeroImage(url);
                                      queryClient.invalidateQueries({ queryKey: ["/api/restaurants", slug] });
                                      toast({ title: "Uploaded!", description: "Tawa hero image has been saved." });
                                    }
                                  } else {
                                    const errorData = await uploadRes.json().catch(() => ({}));
                                    throw new Error(errorData.error || "Upload failed");
                                  }
                                } catch (error: any) {
                                  toast({ title: "Error", description: error.message || "Failed to upload image", variant: "destructive" });
                                } finally {
                                  setIsUploadingTawaHero(false);
                                }
                              }}
                              data-testid="input-tawa-hero-upload"
                            />
                            <Button 
                              variant="outline"
                              className="w-full"
                              onClick={() => document.getElementById('tawa-hero-upload')?.click()}
                              disabled={isUploadingTawaHero}
                              data-testid="button-upload-tawa-hero"
                            >
                              {isUploadingTawaHero ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Uploading...
                                </>
                              ) : (
                                <>
                                  <Upload className="h-4 w-4 mr-2" />
                                  Choose File (PNG, JPG, GIF, SVG)
                                </>
                              )}
                            </Button>
                          </div>

                          {/* URL Input Section */}
                          <div className="space-y-2 pt-2 border-t">
                            <Label className="text-xs font-medium">Or paste image URL</Label>
                            <Input
                              type="url"
                              placeholder="https://example.com/image.png"
                              value={tawaHeroImage}
                              onChange={(e) => setTawaHeroImage(e.target.value)}
                              className="text-sm"
                              data-testid="input-tawa-hero-url"
                            />
                            <Button 
                              className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                              disabled={!tawaHeroImage}
                              onClick={async () => {
                                try {
                                  const res = await fetch(`/api/restaurants/${restaurantId}`, {
                                    method: "PATCH",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ tawaHeroImage }),
                                  });
                                  if (res.ok) {
                                    queryClient.invalidateQueries({ queryKey: ["/api/restaurants", slug] });
                                    toast({ title: "Saved!", description: "Tawa hero image URL has been saved." });
                                  } else {
                                    throw new Error("Failed to save");
                                  }
                                } catch (error) {
                                  toast({ title: "Error", description: "Failed to save image URL", variant: "destructive" });
                                }
                              }}
                              data-testid="button-save-tawa-hero-url"
                            >
                              <Save className="h-4 w-4 mr-2" />
                              Save URL
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  )}

                  {/* Tawa Hero Video Section - for Tawa restaurant branches */}
                  {restaurant?.name?.toLowerCase().includes('tawa') && (
                  <div className="border-t pt-4 mt-4">
                    <Button 
                      variant="ghost" 
                      className="w-full justify-between"
                      onClick={() => setTawaVideoExpanded(!tawaVideoExpanded)}
                      data-testid="button-expand-tawa-video"
                    >
                      <span className="flex items-center gap-2">
                        <Video className="h-4 w-4 text-red-500" />
                        Tawa Menu Hero Video
                        {tawaHeroVideo && <Badge className="ml-2 bg-red-500 text-white text-[10px]">SET</Badge>}
                      </span>
                      {tawaVideoExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>

                    {tawaVideoExpanded && (
                      <div className="mt-4 space-y-4 bg-secondary/20 rounded-lg p-4 border">
                        <p className="text-xs text-muted-foreground">
                          Upload an MP4 video for the Tawa menu page header. Supports MP4, WebM, and MOV formats (max 100MB).
                        </p>

                        {/* Current Video Preview */}
                        {tawaHeroVideo && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs font-medium">Current Hero Video</Label>
                              <Button
                                variant="destructive"
                                size="sm"
                                className="h-7 px-2"
                                onClick={async (e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  try {
                                    const res = await fetch(`/api/restaurants/${restaurantId}`, {
                                      method: "PATCH",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ tawaHeroVideo: "" }),
                                    });
                                    if (res.ok) {
                                      setTawaHeroVideo("");
                                      queryClient.invalidateQueries({ queryKey: ["/api/restaurants", slug] });
                                      toast({ title: "Removed", description: "Tawa hero video has been removed." });
                                    } else {
                                      throw new Error("Failed to remove");
                                    }
                                  } catch (error) {
                                    toast({ title: "Error", description: "Failed to remove video", variant: "destructive" });
                                  }
                                }}
                                data-testid="button-remove-tawa-video"
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Delete
                              </Button>
                            </div>
                            <div className="rounded-lg overflow-hidden border">
                              <video 
                                src={tawaHeroVideo}
                                className="w-full h-32 object-cover"
                                controls
                                muted
                              />
                            </div>
                          </div>
                        )}

                        {/* Upload Section */}
                        <div className="space-y-3">
                          <Label className="text-xs font-medium">
                            {tawaHeroVideo ? "Replace Video" : "Upload Video"}
                          </Label>
                          
                          {/* File Upload */}
                          <div className="space-y-2">
                            <input
                              type="file"
                              accept="video/mp4,video/webm,video/quicktime"
                              id="tawa-video-upload"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                
                                if (file.size > 100 * 1024 * 1024) {
                                  toast({ title: "File too large", description: "Maximum size is 100MB", variant: "destructive" });
                                  return;
                                }
                                
                                setIsUploadingTawaVideo(true);
                                try {
                                  const formData = new FormData();
                                  formData.append("video", file);
                                  
                                  const uploadRes = await fetch("/api/upload-video", {
                                    method: "POST",
                                    body: formData,
                                  });
                                  
                                  if (uploadRes.ok) {
                                    const { url } = await uploadRes.json();
                                    
                                    // Save to restaurant
                                    const res = await fetch(`/api/restaurants/${restaurantId}`, {
                                      method: "PATCH",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ tawaHeroVideo: url }),
                                    });
                                    
                                    if (res.ok) {
                                      setTawaHeroVideo(url);
                                      queryClient.invalidateQueries({ queryKey: ["/api/restaurants", slug] });
                                      toast({ title: "Uploaded!", description: "Tawa hero video has been saved." });
                                    }
                                  } else {
                                    const errorData = await uploadRes.json().catch(() => ({}));
                                    throw new Error(errorData.error || "Upload failed");
                                  }
                                } catch (error: any) {
                                  toast({ title: "Error", description: error.message || "Failed to upload video", variant: "destructive" });
                                } finally {
                                  setIsUploadingTawaVideo(false);
                                }
                              }}
                              data-testid="input-tawa-video-upload"
                            />
                            <Button 
                              variant="outline"
                              className="w-full"
                              onClick={() => document.getElementById('tawa-video-upload')?.click()}
                              disabled={isUploadingTawaVideo}
                              data-testid="button-upload-tawa-video"
                            >
                              {isUploadingTawaVideo ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Uploading...
                                </>
                              ) : (
                                <>
                                  <Upload className="h-4 w-4 mr-2" />
                                  Choose Video (MP4, WebM, MOV)
                                </>
                              )}
                            </Button>
                          </div>

                          {/* URL Input Section */}
                          <div className="space-y-2 pt-2 border-t">
                            <Label className="text-xs font-medium">Or paste video URL</Label>
                            <Input
                              type="url"
                              placeholder="https://example.com/video.mp4"
                              value={tawaHeroVideo}
                              onChange={(e) => setTawaHeroVideo(e.target.value)}
                              className="text-sm"
                              data-testid="input-tawa-video-url"
                            />
                            <Button 
                              className="w-full bg-red-600 hover:bg-red-700 text-white"
                              disabled={!tawaHeroVideo}
                              onClick={async () => {
                                try {
                                  const res = await fetch(`/api/restaurants/${restaurantId}`, {
                                    method: "PATCH",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ tawaHeroVideo }),
                                  });
                                  if (res.ok) {
                                    queryClient.invalidateQueries({ queryKey: ["/api/restaurants", slug] });
                                    toast({ title: "Saved!", description: "Tawa hero video URL has been saved." });
                                  } else {
                                    throw new Error("Failed to save");
                                  }
                                } catch (error) {
                                  toast({ title: "Error", description: "Failed to save video URL", variant: "destructive" });
                                }
                              }}
                              data-testid="button-save-tawa-video-url"
                            >
                              <Save className="h-4 w-4 mr-2" />
                              Save URL
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  )}

                  {/* Emparo Hero Image Section - for Emparo restaurant branches */}
                  {restaurant?.name?.toLowerCase().includes('emparo') && (
                  <div className="border-t pt-4 mt-4">
                    <Button 
                      variant="ghost" 
                      className="w-full justify-between"
                      onClick={() => setEmparoHeroExpanded(!emparoHeroExpanded)}
                      data-testid="button-expand-emparo-hero"
                    >
                      <span className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4 text-orange-500" />
                        Emparo Menu Hero Image
                        {emparoHeroImage && <Badge className="ml-2 bg-orange-500 text-white text-[10px]">SET</Badge>}
                      </span>
                      {emparoHeroExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>

                    {emparoHeroExpanded && (
                      <div className="mt-4 space-y-4 bg-secondary/20 rounded-lg p-4 border">
                        <p className="text-xs text-muted-foreground">
                          Upload a banner image for the Emparo menu page hero section. Supports PNG, JPG, GIF, and SVG formats.
                        </p>

                        {/* Current Image Preview */}
                        {emparoHeroImage && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs font-medium">Current Hero Image</Label>
                              <Button
                                variant="destructive"
                                size="sm"
                                className="h-7 px-2"
                                onClick={async (e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  try {
                                    const res = await fetch(`/api/restaurants/${restaurantId}`, {
                                      method: "PATCH",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ emparoHeroImage: "" }),
                                    });
                                    if (res.ok) {
                                      setEmparoHeroImage("");
                                      queryClient.invalidateQueries({ queryKey: ["/api/restaurants", slug] });
                                      toast({ title: "Removed", description: "Emparo hero image has been removed." });
                                    } else {
                                      throw new Error("Failed to remove");
                                    }
                                  } catch (error) {
                                    toast({ title: "Error", description: "Failed to remove image", variant: "destructive" });
                                  }
                                }}
                                data-testid="button-remove-emparo-hero"
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Delete
                              </Button>
                            </div>
                            <div className="rounded-lg overflow-hidden border">
                              <img 
                                src={emparoHeroImage}
                                alt="Emparo Hero"
                                className="w-full h-32 object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400";
                                }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Upload Section */}
                        <div className="space-y-3">
                          <Label className="text-xs font-medium">
                            {emparoHeroImage ? "Replace Image" : "Upload Image"}
                          </Label>
                          
                          {/* File Upload */}
                          <div className="space-y-2">
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/gif,image/svg+xml"
                              id="emparo-hero-upload"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                
                                setIsUploadingEmparoHero(true);
                                try {
                                  const formData = new FormData();
                                  formData.append("file", file);
                                  
                                  const uploadRes = await fetch("/api/upload", {
                                    method: "POST",
                                    body: formData,
                                  });
                                  
                                  if (uploadRes.ok) {
                                    const { url } = await uploadRes.json();
                                    
                                    // Save to restaurant
                                    const res = await fetch(`/api/restaurants/${restaurantId}`, {
                                      method: "PATCH",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ emparoHeroImage: url }),
                                    });
                                    
                                    if (res.ok) {
                                      setEmparoHeroImage(url);
                                      queryClient.invalidateQueries({ queryKey: ["/api/restaurants", slug] });
                                      toast({ title: "Uploaded!", description: "Emparo hero image has been saved." });
                                    }
                                  } else {
                                    const errorData = await uploadRes.json().catch(() => ({}));
                                    throw new Error(errorData.error || "Upload failed");
                                  }
                                } catch (error: any) {
                                  toast({ title: "Error", description: error.message || "Failed to upload image", variant: "destructive" });
                                } finally {
                                  setIsUploadingEmparoHero(false);
                                }
                              }}
                              data-testid="input-emparo-hero-upload"
                            />
                            <Button 
                              variant="outline"
                              className="w-full"
                              onClick={() => document.getElementById('emparo-hero-upload')?.click()}
                              disabled={isUploadingEmparoHero}
                              data-testid="button-upload-emparo-hero"
                            >
                              {isUploadingEmparoHero ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Uploading...
                                </>
                              ) : (
                                <>
                                  <Upload className="h-4 w-4 mr-2" />
                                  Choose File (PNG, JPG, GIF, SVG)
                                </>
                              )}
                            </Button>
                          </div>

                          {/* URL Input Section */}
                          <div className="space-y-2 pt-2 border-t">
                            <Label className="text-xs font-medium">Or paste image URL</Label>
                            <Input
                              type="url"
                              placeholder="https://example.com/image.png"
                              value={emparoHeroImage}
                              onChange={(e) => setEmparoHeroImage(e.target.value)}
                              className="text-sm"
                              data-testid="input-emparo-hero-url"
                            />
                            <Button 
                              className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                              disabled={!emparoHeroImage}
                              onClick={async () => {
                                try {
                                  const res = await fetch(`/api/restaurants/${restaurantId}`, {
                                    method: "PATCH",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ emparoHeroImage }),
                                  });
                                  if (res.ok) {
                                    queryClient.invalidateQueries({ queryKey: ["/api/restaurants", slug] });
                                    toast({ title: "Saved!", description: "Emparo hero image URL has been saved." });
                                  } else {
                                    throw new Error("Failed to save");
                                  }
                                } catch (error) {
                                  toast({ title: "Error", description: "Failed to save image URL", variant: "destructive" });
                                }
                              }}
                              data-testid="button-save-emparo-hero-url"
                            >
                              <Save className="h-4 w-4 mr-2" />
                              Save URL
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  )}

                  {/* Emparo Hero Video Section - for Emparo restaurant branches */}
                  {restaurant?.name?.toLowerCase().includes('emparo') && (
                  <div className="border-t pt-4 mt-4">
                    <Button 
                      variant="ghost" 
                      className="w-full justify-between"
                      onClick={() => setEmparoVideoExpanded(!emparoVideoExpanded)}
                      data-testid="button-expand-emparo-video"
                    >
                      <span className="flex items-center gap-2">
                        <Video className="h-4 w-4 text-red-500" />
                        Emparo Menu Hero Video
                        {emparoHeroVideo && <Badge className="ml-2 bg-red-500 text-white text-[10px]">SET</Badge>}
                      </span>
                      {emparoVideoExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>

                    {emparoVideoExpanded && (
                      <div className="mt-4 space-y-4 bg-secondary/20 rounded-lg p-4 border">
                        <p className="text-xs text-muted-foreground">
                          Upload an MP4 video for the Emparo menu page header. Supports MP4, WebM, and MOV formats (max 100MB).
                        </p>

                        {/* Current Video Preview */}
                        {emparoHeroVideo && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs font-medium">Current Hero Video</Label>
                              <Button
                                variant="destructive"
                                size="sm"
                                className="h-7 px-2"
                                onClick={async (e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  try {
                                    const res = await fetch(`/api/restaurants/${restaurantId}`, {
                                      method: "PATCH",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ emparoHeroVideo: "" }),
                                    });
                                    if (res.ok) {
                                      setEmparoHeroVideo("");
                                      queryClient.invalidateQueries({ queryKey: ["/api/restaurants", slug] });
                                      toast({ title: "Removed", description: "Emparo hero video has been removed." });
                                    } else {
                                      throw new Error("Failed to remove");
                                    }
                                  } catch (error) {
                                    toast({ title: "Error", description: "Failed to remove video", variant: "destructive" });
                                  }
                                }}
                                data-testid="button-remove-emparo-video"
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Delete
                              </Button>
                            </div>
                            <div className="rounded-lg overflow-hidden border">
                              <video 
                                src={emparoHeroVideo}
                                className="w-full h-32 object-cover"
                                controls
                                muted
                              />
                            </div>
                          </div>
                        )}

                        {/* Upload Section */}
                        <div className="space-y-3">
                          <Label className="text-xs font-medium">
                            {emparoHeroVideo ? "Replace Video" : "Upload Video"}
                          </Label>
                          
                          {/* File Upload */}
                          <div className="space-y-2">
                            <input
                              type="file"
                              accept="video/mp4,video/webm,video/quicktime"
                              id="emparo-video-upload"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                
                                if (file.size > 100 * 1024 * 1024) {
                                  toast({ title: "File too large", description: "Maximum size is 100MB", variant: "destructive" });
                                  return;
                                }
                                
                                setIsUploadingEmparoVideo(true);
                                try {
                                  const formData = new FormData();
                                  formData.append("video", file);
                                  
                                  const uploadRes = await fetch("/api/upload-video", {
                                    method: "POST",
                                    body: formData,
                                  });
                                  
                                  if (uploadRes.ok) {
                                    const { url } = await uploadRes.json();
                                    
                                    // Save to restaurant
                                    const res = await fetch(`/api/restaurants/${restaurantId}`, {
                                      method: "PATCH",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ emparoHeroVideo: url }),
                                    });
                                    
                                    if (res.ok) {
                                      setEmparoHeroVideo(url);
                                      queryClient.invalidateQueries({ queryKey: ["/api/restaurants", slug] });
                                      toast({ title: "Uploaded!", description: "Emparo hero video has been saved." });
                                    }
                                  } else {
                                    const errorData = await uploadRes.json().catch(() => ({}));
                                    throw new Error(errorData.error || "Upload failed");
                                  }
                                } catch (error: any) {
                                  toast({ title: "Error", description: error.message || "Failed to upload video", variant: "destructive" });
                                } finally {
                                  setIsUploadingEmparoVideo(false);
                                }
                              }}
                              data-testid="input-emparo-video-upload"
                            />
                            <Button 
                              variant="outline"
                              className="w-full"
                              onClick={() => document.getElementById('emparo-video-upload')?.click()}
                              disabled={isUploadingEmparoVideo}
                              data-testid="button-upload-emparo-video"
                            >
                              {isUploadingEmparoVideo ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Uploading...
                                </>
                              ) : (
                                <>
                                  <Upload className="h-4 w-4 mr-2" />
                                  Choose Video (MP4, WebM, MOV)
                                </>
                              )}
                            </Button>
                          </div>

                          {/* URL Input Section */}
                          <div className="space-y-2 pt-2 border-t">
                            <Label className="text-xs font-medium">Or paste video URL</Label>
                            <Input
                              type="url"
                              placeholder="https://example.com/video.mp4"
                              value={emparoHeroVideo}
                              onChange={(e) => setEmparoHeroVideo(e.target.value)}
                              className="text-sm"
                              data-testid="input-emparo-video-url"
                            />
                            <Button 
                              className="w-full bg-red-600 hover:bg-red-700 text-white"
                              disabled={!emparoHeroVideo}
                              onClick={async () => {
                                try {
                                  const res = await fetch(`/api/restaurants/${restaurantId}`, {
                                    method: "PATCH",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ emparoHeroVideo }),
                                  });
                                  if (res.ok) {
                                    queryClient.invalidateQueries({ queryKey: ["/api/restaurants", slug] });
                                    toast({ title: "Saved!", description: "Emparo hero video URL has been saved." });
                                  } else {
                                    throw new Error("Failed to save");
                                  }
                                } catch (error) {
                                  toast({ title: "Error", description: "Failed to save video URL", variant: "destructive" });
                                }
                              }}
                              data-testid="button-save-emparo-video-url"
                            >
                              <Save className="h-4 w-4 mr-2" />
                              Save URL
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  )}

                  {/* Popular Items Section - Category GIF/Image Management */}
                  {dashboardSettings?.heroGalleryEnabled && (
                  <div className="border rounded-lg p-4 bg-secondary/5">
                    <button 
                      className="w-full flex items-center justify-between text-left"
                      onClick={() => setPopularItemsExpanded(!popularItemsExpanded)}
                      data-testid="button-toggle-popular-items"
                    >
                      <span className="font-medium flex items-center gap-2">
                        <ImageIcon className="h-4 w-4 text-purple-500" />
                        Popular Items / Categories {popularItems.length > 0 && <Badge className="ml-2 bg-purple-500 text-white text-[10px]">{popularItems.length} ITEMS</Badge>}
                      </span>
                      {popularItemsExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                    {popularItemsExpanded && (
                      <div className="mt-4 space-y-4">
                        <p className="text-xs text-muted-foreground">
                          Add category images (supports GIFs) to display in the "Most Popular" section on your landing page.
                        </p>

                        {/* Existing Items */}
                        {popularItems.length > 0 && (
                          <div className="space-y-2">
                            <Label className="text-xs font-medium">Current Items ({popularItems.length})</Label>
                            <div className="space-y-2">
                              {popularItems.map((item: any) => (
                                <div 
                                  key={item.id}
                                  className="flex items-center gap-2 p-2 rounded-lg border bg-secondary/30"
                                >
                                  <img 
                                    src={item.imageUrl}
                                    alt={item.name}
                                    className="w-16 h-12 object-cover rounded"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200";
                                    }}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium truncate">{item.name}</p>
                                    {item.linkUrl && (
                                      <p className="text-[10px] text-blue-400 truncate">🔗 {item.linkUrl}</p>
                                    )}
                                    <p className="text-[10px] text-muted-foreground truncate">{item.imageUrl}</p>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                    onClick={() => handleDeletePopularItem(item.id)}
                                    data-testid={`button-delete-popular-${item.id}`}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Add New Item */}
                        <div className="space-y-3 border-t pt-4">
                          <Label className="text-xs font-medium">Add New Category</Label>
                          
                          {/* File Upload Option */}
                          <div className="space-y-2">
                            <Label className="text-[10px] text-muted-foreground">Upload from device (JPG, PNG, GIF, SVG, WebP)</Label>
                            <div className="flex items-center gap-2">
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                                className="hidden"
                                id="popular-image-upload"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  
                                  if (file.size > 10 * 1024 * 1024) {
                                    toast({ title: "File too large", description: "Maximum size is 10MB", variant: "destructive" });
                                    return;
                                  }
                                  
                                  setIsUploadingPopularImage(true);
                                  try {
                                    const reader = new FileReader();
                                    reader.onload = async () => {
                                      const base64 = reader.result as string;
                                      const response = await fetch('/api/upload-image', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ image: base64, filename: file.name })
                                      });
                                      
                                      if (!response.ok) {
                                        throw new Error('Upload failed');
                                      }
                                      
                                      const { url } = await response.json();
                                      setNewPopularItemImageUrl(url);
                                      setIsUploadingPopularImage(false);
                                      toast({ title: "Image Uploaded", description: "Now add a name for this category." });
                                    };
                                    reader.readAsDataURL(file);
                                  } catch (error) {
                                    toast({ title: "Upload Failed", description: "Could not upload image", variant: "destructive" });
                                    setIsUploadingPopularImage(false);
                                    e.target.value = '';
                                  }
                                }}
                                data-testid="input-popular-file-upload"
                              />
                              <Button
                                variant="outline"
                                className="flex-1 h-10 bg-purple-600/20 hover:bg-purple-600/40 border-purple-600 text-purple-400 font-semibold"
                                onClick={() => document.getElementById('popular-image-upload')?.click()}
                                disabled={isUploadingPopularImage}
                                data-testid="button-popular-file-upload"
                              >
                                {isUploadingPopularImage ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <Upload className="h-4 w-4 mr-2" />
                                )}
                                {isUploadingPopularImage ? "Uploading..." : "Choose File (JPG/PNG/GIF/SVG)"}
                              </Button>
                            </div>
                          </div>
                          
                          <div className="text-center text-[10px] text-muted-foreground">— or —</div>
                          
                          {/* URL Option */}
                          <div className="space-y-2">
                            <Label className="text-[10px] text-muted-foreground">Add from URL</Label>
                            <Input 
                              value={newPopularItemImageUrl}
                              onChange={(e) => setNewPopularItemImageUrl(e.target.value)}
                              placeholder="https://example.com/category.gif"
                              className="h-8"
                              data-testid="input-popular-image-url"
                            />
                          </div>
                          
                          {/* Category Name */}
                          <Input 
                            value={newPopularItemName}
                            onChange={(e) => setNewPopularItemName(e.target.value)}
                            placeholder="Category name - e.g., 'Fried Chicken'"
                            className="h-8"
                            data-testid="input-popular-item-name"
                          />

                          {/* Link URL (Optional) */}
                          <div className="space-y-1">
                            <Label className="text-[10px] text-muted-foreground">Link URL (optional - where to navigate when clicked)</Label>
                            <Input 
                              value={newPopularItemLinkUrl}
                              onChange={(e) => setNewPopularItemLinkUrl(e.target.value)}
                              placeholder="https://example.com or /menu/category"
                              className="h-8"
                              data-testid="input-popular-item-link"
                            />
                          </div>

                          {newPopularItemImageUrl && (
                            <div className="border rounded p-2 bg-secondary/20">
                              <p className="text-[10px] text-muted-foreground mb-1">Preview:</p>
                              <img 
                                src={newPopularItemImageUrl} 
                                alt="Preview" 
                                className="w-full h-24 object-cover rounded"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            </div>
                          )}
                          
                          <Button 
                            onClick={handleAddPopularItem}
                            disabled={!newPopularItemName || !newPopularItemImageUrl}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold"
                            data-testid="button-add-popular-item"
                          >
                            <Save className="h-4 w-4 mr-2" />
                            Save Category
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Drivers Tab */}
          {(isDriverAppEnabled || isDeliveryTrackingEnabled) && (
          <TabsContent value="drivers" className="mt-0">
            {/* Rejected Deliveries Alert - Shows when driver declines an order */}
            {(() => {
              const rejectedDeliveries = orders.filter(o => {
                if (o.type !== 'delivery' || o.isArchived) return false;
                const delivery = (o as any).delivery;
                return delivery?.deliveryStatus === 'rejected';
              });
              
              if (rejectedDeliveries.length === 0) return null;
              
              return (
                <div className="mb-4 space-y-2">
                  {rejectedDeliveries.map(order => {
                    const delivery = (order as any).delivery;
                    return (
                      <div 
                        key={order.id}
                        className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 flex items-center justify-between animate-pulse"
                        data-testid={`rejected-alert-${order.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="bg-red-500 rounded-full p-2">
                            <AlertTriangle className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <p className="font-bold text-red-400">
                              DELIVERY DECLINED - Order #{String(order.orderNumber).padStart(3, '0')}
                            </p>
                            <p className="text-sm text-red-300">
                              Driver {delivery?.driverName} rejected this delivery
                              {delivery?.driverNotes && ` - "${delivery.driverNotes}"`}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Customer: {order.customerName} • {order.address}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-amber-500 text-amber-500 hover:bg-amber-500/20"
                            onClick={() => setAssigningDriverToOrder(order.id)}
                            data-testid={`button-reassign-${order.id}`}
                          >
                            <UserPlus className="h-4 w-4 mr-1" />
                            Reassign
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                            onClick={() => {
                              if (confirm("Delete this rejected order?")) {
                                deleteOrderMutation.mutate(order.id);
                              }
                            }}
                            data-testid={`button-delete-rejected-${order.id}`}
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* Returned Deliveries Alert - Shows when driver returns an order */}
            {(() => {
              const returnedDeliveries = orders.filter(o => {
                if (o.type !== 'delivery' || o.isArchived) return false;
                const delivery = (o as any).delivery;
                return delivery?.deliveryStatus === 'returned';
              });
              
              if (returnedDeliveries.length === 0) return null;
              
              const getReturnReasonLabel = (reason: string) => {
                const labels: Record<string, string> = {
                  'customer_unavailable': 'Customer unavailable',
                  'order_refused': 'Order refused by customer',
                  'incorrect_address': 'Incorrect address',
                  'food_damaged': 'Food damaged',
                  'other': 'Other reason'
                };
                return labels[reason] || reason;
              };

              const parseReturnReason = (notes: string | null) => {
                if (!notes) return { reason: 'Unknown', details: '' };
                const match = notes.match(/^Return Reason: (\w+)(?:\s*-\s*(.*))?$/);
                if (match) {
                  return { reason: getReturnReasonLabel(match[1]), details: match[2] || '' };
                }
                return { reason: notes, details: '' };
              };
              
              return (
                <div className="mb-4 space-y-2">
                  {returnedDeliveries.map(order => {
                    const delivery = (order as any).delivery;
                    const { reason, details } = parseReturnReason(delivery?.driverNotes);
                    return (
                      <div 
                        key={order.id}
                        className="bg-orange-500/20 border border-orange-500/50 rounded-lg p-3 flex items-center justify-between animate-pulse"
                        data-testid={`returned-alert-${order.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="bg-orange-500 rounded-full p-2">
                            <RotateCcw className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <p className="font-bold text-orange-400">
                              DELIVERY RETURNED - Order #{String(order.orderNumber).padStart(3, '0')}
                            </p>
                            <p className="text-sm text-orange-300">
                              Driver {delivery?.driverName} returned this delivery
                            </p>
                            <p className="text-sm text-orange-200 font-medium">
                              Reason: {reason}
                              {details && ` - "${details}"`}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Customer: {order.customerName} • {order.address}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-amber-500 text-amber-500 hover:bg-amber-500/20"
                            onClick={() => setAssigningDriverToOrder(order.id)}
                            data-testid={`button-retry-${order.id}`}
                          >
                            <UserPlus className="h-4 w-4 mr-1" />
                            Retry
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-orange-400 hover:text-orange-300 hover:bg-orange-500/20"
                            onClick={() => {
                              if (confirm("Delete this returned order?")) {
                                deleteOrderMutation.mutate(order.id);
                              }
                            }}
                            data-testid={`button-delete-returned-${order.id}`}
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Branch Drivers Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Car className="h-5 w-5" />
                    Drivers ({onDutyDrivers.length}/{branchDrivers.length})
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {onDutyDrivers.length} on duty, {branchDrivers.length - onDutyDrivers.length} off duty
                  </p>
                </CardHeader>
                <CardContent>
                  {branchDrivers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Car className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p>No drivers for this branch</p>
                      <p className="text-sm">Add drivers to enable delivery assignments</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {branchDrivers.map((driver) => (
                        <div 
                          key={driver.id}
                          className={`p-4 rounded-lg border ${
                            driver.isOnDuty 
                              ? 'bg-emerald-500/10 border-emerald-500/30' 
                              : 'bg-secondary/30 border-border'
                          }`}
                          data-testid={`driver-card-${driver.id}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                driver.isOnDuty ? 'bg-emerald-500' : 'bg-muted'
                              }`}>
                                <Car className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <p className="font-medium">{driver.name}</p>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Phone className="h-3 w-3" />
                                  {driver.phone}
                                </div>
                                {driver.vehicleType && (
                                  <p className="text-xs text-muted-foreground capitalize">
                                    {driver.vehicleType} {driver.vehiclePlate && `• ${driver.vehiclePlate}`}
                                  </p>
                                )}
                                {driver.shiftStartTime && driver.isOnDuty && (
                                  <p className="text-xs text-emerald-500">
                                    <Clock className="h-3 w-3 inline mr-1" />
                                    Started: {new Date(driver.shiftStartTime).toLocaleTimeString()}
                                  </p>
                                )}
                                {driver.shiftEndTime && !driver.isOnDuty && (
                                  <p className="text-xs text-muted-foreground">
                                    <Clock className="h-3 w-3 inline mr-1" />
                                    Finished: {new Date(driver.shiftEndTime).toLocaleTimeString()}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={driver.isOnDuty ?? false}
                                  onCheckedChange={(checked) => {
                                    toggleDriverDutyMutation.mutate({ driverId: driver.id, isOnDuty: checked });
                                  }}
                                  data-testid={`switch-driver-duty-${driver.id}`}
                                />
                                <span className={`text-xs font-medium ${driver.isOnDuty ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                                  {driver.isOnDuty ? "On" : "Off"}
                                </span>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => deleteDriverMutation.mutate(driver.id)}
                                data-testid={`button-remove-driver-${driver.id}`}
                              >
                                <UserMinus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          {/* License Preview Card */}
                          {driver.licenseCopyUrl && (
                            <div className="mt-3 pt-3 border-t border-border/50">
                              <div className="flex items-center gap-2">
                                <a
                                  href={driver.licenseCopyUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 p-2 bg-secondary/50 rounded-md hover:bg-secondary/70 transition-colors"
                                  data-testid={`license-card-${driver.id}`}
                                >
                                  {driver.licenseCopyUrl.endsWith('.pdf') ? (
                                    <div className="w-10 h-10 bg-red-500/20 rounded flex items-center justify-center">
                                      <span className="text-xs font-bold text-red-500">PDF</span>
                                    </div>
                                  ) : (
                                    <img
                                      src={driver.licenseCopyUrl}
                                      alt="License"
                                      className="w-10 h-10 object-cover rounded"
                                    />
                                  )}
                                  <div className="text-xs">
                                    <p className="font-medium">
                                      {driver.licenseType === 'uk_full' ? 'UK Full License' : 'International License'}
                                    </p>
                                    <p className="text-muted-foreground">Click to view</p>
                                  </div>
                                </a>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add New Driver Button/Form */}
                  <div className="mt-6 pt-4 border-t">
                    {!showAddDriverForm ? (
                      <Button 
                        onClick={() => setShowAddDriverForm(true)}
                        className="w-full"
                        data-testid="button-show-add-driver-form"
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add New Driver
                      </Button>
                    ) : (
                      <AddDriverForm
                        onSubmit={(data: DriverFormData) => {
                          createDriverMutation.mutate({
                            name: data.name,
                            phone: data.phone,
                            password: data.password,
                            vehicleType: data.vehicleType,
                            vehiclePlate: data.vehiclePlate,
                            paymentType: data.paymentType,
                            mileageRate1: data.mileageRate1,
                            mileageRate2: data.mileageRate2,
                            mileageRate3: data.mileageRate3,
                            mileageRange1Max: data.mileageRange1Max,
                            mileageRange2Max: data.mileageRange2Max,
                            mileageRange3Max: data.mileageRange3Max,
                            salaryAmount: data.salaryAmount,
                            salaryPeriod: data.salaryPeriod,
                            agreedDeliveryCharge: data.agreedDeliveryCharge,
                            licenseType: data.licenseType,
                            licenseCopyUrl: data.licenseCopyUrl,
                            address: data.address,
                            city: data.city,
                            county: data.county,
                            postcode: data.postcode,
                            yearsAtAddress: data.yearsAtAddress,
                            residencyStatus: data.residencyStatus,
                            residencyOther: data.residencyOther,
                          });
                        }}
                        onCancel={() => setShowAddDriverForm(false)}
                        isPending={createDriverMutation.isPending}
                        currencySymbol={currencySymbol}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Active Deliveries Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Active Deliveries
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    // Show delivery orders that need driver management
                    // Use full orders list (not activeOrders) so orders stay visible even after marking "completed" in kitchen
                    const deliveryOrders = orders.filter(o => {
                      if (o.type !== 'delivery' || o.isArchived) return false;
                      const delivery = (o as any).delivery;
                      
                      // Show delivery orders that are ready OR completed (but still need driver)
                      // Orders without a driver - show if ready or completed (waiting for driver assignment/completion)
                      if (!delivery) {
                        return o.status === 'ready' || o.status === 'completed';
                      }
                      
                      // Show orders with driver assigned (any status except driver completed)
                      // Hide only when driver has completed the delivery
                      if (delivery.deliveryStatus === 'completed') return false;
                      return true; // Show: assigned, accepted, picked_up, delivering, rejected, returned
                    });
                    if (deliveryOrders.length === 0) {
                      return (
                        <div className="text-center py-8 text-muted-foreground">
                          <Truck className="h-12 w-12 mx-auto mb-4 opacity-20" />
                          <p>No ready delivery orders</p>
                          <p className="text-sm">Orders marked "Ready" will appear here for driver assignment</p>
                        </div>
                      );
                    }
                    return (
                      <div className="space-y-3">
                        {deliveryOrders.map(order => {
                          const delivery = (order as any).delivery;
                          const hasDriver = delivery && delivery.deliveryStatus !== 'rejected' && delivery.deliveryStatus !== 'returned';
                          const isRejected = delivery?.deliveryStatus === 'rejected';
                          const isReturned = delivery?.deliveryStatus === 'returned';
                          
                          return (
                            <div 
                              key={order.id}
                              className={`p-4 rounded-lg border ${
                                isRejected || isReturned ? 'bg-red-500/10 border-red-500/30' :
                                delivery?.deliveryStatus === 'accepted' ? 'bg-emerald-500/10 border-emerald-500/30' :
                                delivery?.deliveryStatus === 'picked_up' ? 'bg-blue-500/10 border-blue-500/30' :
                                delivery?.deliveryStatus === 'delivering' ? 'bg-purple-500/10 border-purple-500/30' :
                                'bg-amber-500/10 border-amber-500/30'
                              }`}
                              data-testid={`delivery-order-${order.id}`}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <p className="font-bold">Order #{String(order.orderNumber).padStart(3, '0')}</p>
                                  <p className="text-sm font-medium">{order.customerName}</p>
                                </div>
                                <Badge variant={
                                  isRejected || isReturned ? "destructive" :
                                  delivery?.deliveryStatus === 'accepted' ? "default" :
                                  delivery?.deliveryStatus === 'picked_up' ? "default" :
                                  delivery?.deliveryStatus === 'delivering' ? "default" :
                                  "secondary"
                                } className={
                                  isReturned ? 'bg-orange-500' :
                                  delivery?.deliveryStatus === 'accepted' ? 'bg-emerald-500' :
                                  delivery?.deliveryStatus === 'picked_up' ? 'bg-blue-500' :
                                  delivery?.deliveryStatus === 'delivering' ? 'bg-purple-500' :
                                  ''
                                }>
                                  {isReturned ? 'Returned' :
                                   isRejected ? 'Rejected' :
                                   delivery?.deliveryStatus === 'accepted' ? 'Driver Accepted' :
                                   delivery?.deliveryStatus === 'picked_up' ? 'Picked Up' :
                                   delivery?.deliveryStatus === 'delivering' ? 'On The Way' :
                                   delivery?.deliveryStatus === 'assigned' ? 'Waiting Driver' :
                                   'Ready for Pickup'}
                                </Badge>
                              </div>
                              
                              {/* Driver Info */}
                              {delivery && (
                                <div className={`flex items-center gap-2 text-sm mb-2 ${
                                  isRejected || isReturned ? 'text-red-400' : 'text-emerald-400'
                                }`}>
                                  <Car className="h-4 w-4" />
                                  <span className="font-medium">{delivery.driverName}</span>
                                  {delivery.deliveryStatus === 'accepted' && (
                                    <span className="text-xs text-muted-foreground">- On the way to pickup</span>
                                  )}
                                  {delivery.deliveryStatus === 'picked_up' && (
                                    <span className="text-xs text-muted-foreground">- Has the order</span>
                                  )}
                                  {delivery.deliveryStatus === 'delivering' && (
                                    <span className="text-xs text-muted-foreground">- Delivering to customer</span>
                                  )}
                                </div>
                              )}
                              
                              {/* Rejection/Return Reason */}
                              {(isRejected || isReturned) && delivery?.driverNotes && (
                                <div className="p-2 mb-2 rounded bg-red-500/20 border border-red-500/30">
                                  <p className="text-xs text-red-300 font-medium">{isReturned ? 'Return Reason:' : 'Rejection Reason:'}</p>
                                  <p className="text-sm text-red-200">{delivery.driverNotes}</p>
                                </div>
                              )}
                              
                              {order.address && (
                                <div className="flex items-start gap-2 text-sm text-muted-foreground mb-3">
                                  <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                  <span>{order.address}</span>
                                </div>
                              )}
                            
                              {/* Driver Assignment - show if no driver or rejected */}
                              {(!hasDriver || isRejected) && (
                                <>
                                  {assigningDriverToOrder === order.id ? (
                                    <div className="space-y-3 p-3 bg-card/50 border border-border rounded-lg">
                                      {/* Offer Amount */}
                                      <div className="space-y-1">
                                        <label className="text-xs text-muted-foreground">Delivery Offer (£)</label>
                                        <Input
                                          type="number"
                                          step="0.50"
                                          min="0"
                                          placeholder="e.g. 5.00"
                                          value={deliveryOfferAmount}
                                          onChange={(e) => setDeliveryOfferAmount(e.target.value)}
                                          className="h-9"
                                          data-testid={`input-offer-amount-${order.id}`}
                                        />
                                      </div>
                                      
                                      {/* Payment Instruction */}
                                      <div className="space-y-1">
                                        <label className="text-xs text-muted-foreground">Payment</label>
                                        <Select 
                                          value={deliveryPaymentInstruction} 
                                          onValueChange={setDeliveryPaymentInstruction}
                                        >
                                          <SelectTrigger className="h-9" data-testid={`select-payment-instruction-${order.id}`}>
                                            <SelectValue placeholder="Select payment type..." />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="customer_paid_online">Paid Online</SelectItem>
                                            <SelectItem value="collect_cash">Collect Cash</SelectItem>
                                            <SelectItem value="branch_pays_driver">Branch Will Pay</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      
                                      {/* Driver Instructions */}
                                      <div className="space-y-1">
                                        <label className="text-xs text-muted-foreground">Instructions (optional)</label>
                                        <Input
                                          placeholder="e.g. Collect £15.50 cash"
                                          value={deliveryDriverNotes}
                                          onChange={(e) => setDeliveryDriverNotes(e.target.value)}
                                          className="h-9"
                                          data-testid={`input-driver-notes-${order.id}`}
                                        />
                                      </div>
                                      
                                      {/* Driver Selection */}
                                      <div className="flex gap-2">
                                        <Select onValueChange={(driverId) => {
                                          assignDriverToOrderMutation.mutate({ 
                                            orderId: order.id, 
                                            driverId,
                                            offerAmount: deliveryOfferAmount || undefined,
                                            paymentInstruction: deliveryPaymentInstruction || undefined,
                                            driverNotes: deliveryDriverNotes || undefined
                                          });
                                          setDeliveryOfferAmount("");
                                          setDeliveryPaymentInstruction("");
                                          setDeliveryDriverNotes("");
                                        }}>
                                          <SelectTrigger className="flex-1 h-9" data-testid={`select-driver-for-order-${order.id}`}>
                                            <SelectValue placeholder="Select driver..." />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {onDutyDrivers.map((driver) => (
                                              <SelectItem key={driver.id} value={driver.id}>
                                                {driver.name}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => {
                                            setAssigningDriverToOrder(null);
                                            setDeliveryOfferAmount("");
                                            setDeliveryPaymentInstruction("");
                                            setDeliveryDriverNotes("");
                                          }}
                                        >
                                          <X className="h-4 w-4" />
                                        </Button>
                                      </div>
                                      
                                      {/* Notify All Drivers */}
                                      {onDutyDrivers.length > 0 && (
                                        <Button
                                          className={`w-full ${
                                            notifiedOrders.has(order.id) 
                                              ? 'bg-emerald-600 hover:bg-emerald-700' 
                                              : 'bg-amber-600 hover:bg-amber-700'
                                          }`}
                                          disabled={assignDriverToOrderMutation.isPending || notifiedOrders.has(order.id)}
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            console.log('[Dashboard] Notify All Drivers clicked for order:', order.id);
                                            assignDriverToOrderMutation.mutate({ 
                                              orderId: order.id, 
                                              broadcastToAll: true,
                                              offerAmount: deliveryOfferAmount || undefined,
                                              paymentInstruction: deliveryPaymentInstruction || undefined,
                                              driverNotes: deliveryDriverNotes || undefined
                                            });
                                            setDeliveryOfferAmount("");
                                            setDeliveryPaymentInstruction("");
                                            setDeliveryDriverNotes("");
                                          }}
                                          data-testid={`button-notify-all-drivers-${order.id}`}
                                        >
                                          {assignDriverToOrderMutation.isPending ? (
                                            <>
                                              <span className="animate-spin mr-2">⏳</span>
                                              Notifying...
                                            </>
                                          ) : notifiedOrders.has(order.id) ? (
                                            <>
                                              <CheckCircle className="h-4 w-4 mr-2" />
                                              Drivers Notified!
                                            </>
                                          ) : (
                                            <>
                                              <Bell className="h-4 w-4 mr-2" />
                                              Notify All ({onDutyDrivers.length})
                                            </>
                                          )}
                                        </Button>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="space-y-2">
                                      {onDutyDrivers.length > 0 && (
                                        <Button
                                          className={`w-full ${
                                            notifiedOrders.has(order.id) 
                                              ? 'bg-emerald-600 hover:bg-emerald-700' 
                                              : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700'
                                          } text-white font-bold`}
                                          disabled={assignDriverToOrderMutation.isPending || notifiedOrders.has(order.id)}
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            assignDriverToOrderMutation.mutate({ 
                                              orderId: order.id, 
                                              broadcastToAll: true
                                            });
                                          }}
                                          data-testid={`button-push-all-drivers-${order.id}`}
                                        >
                                          {assignDriverToOrderMutation.isPending ? (
                                            <>
                                              <span className="animate-spin mr-2">⏳</span>
                                              Pushing...
                                            </>
                                          ) : notifiedOrders.has(order.id) ? (
                                            <>
                                              <CheckCircle className="h-4 w-4 mr-2" />
                                              Drivers Notified!
                                            </>
                                          ) : (
                                            <>
                                              <Bell className="h-4 w-4 mr-2" />
                                              Push to All Drivers ({onDutyDrivers.length})
                                            </>
                                          )}
                                        </Button>
                                      )}
                                      <div className="flex gap-2">
                                        <Button
                                          className="flex-1"
                                          variant={isRejected ? "destructive" : "outline"}
                                          onClick={() => setAssigningDriverToOrder(order.id)}
                                          disabled={onDutyDrivers.length === 0}
                                          data-testid={`button-assign-driver-${order.id}`}
                                        >
                                          <Car className="h-4 w-4 mr-2" />
                                          {onDutyDrivers.length === 0 ? 'No drivers on duty' : 
                                           isRejected ? 'Assign Specific' : 'Assign Specific Driver'}
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                                          onClick={() => handleDeleteOrder(order.id)}
                                          data-testid={`button-delete-delivery-${order.id}`}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </>
                              )}
                              
                              {/* Delete button for assigned deliveries */}
                              {hasDriver && !isRejected && (
                                <div className="mt-3 pt-3 border-t border-border/50">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full text-red-500 hover:text-red-400 hover:bg-red-500/10"
                                    onClick={() => handleDeleteOrder(order.id)}
                                    data-testid={`button-delete-assigned-delivery-${order.id}`}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Order
                                  </Button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>

            {/* Driver Locations Card */}
            {onDutyDrivers.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Driver Locations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {onDutyDrivers.map((driver) => {
                      const hasLocation = driver.lastLocationLat && driver.lastLocationLng;
                      const driverLastSeen = driver.lastSeen ? new Date(driver.lastSeen) : null;
                      const isRecent = driverLastSeen && (Date.now() - driverLastSeen.getTime()) < 5 * 60 * 1000;
                      
                      return (
                        <div 
                          key={driver.id}
                          className={`p-4 rounded-lg border ${
                            isRecent ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-secondary/30 border-border'
                          }`}
                          data-testid={`driver-location-${driver.id}`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{driver.name}</span>
                            <div className={`w-2 h-2 rounded-full ${isRecent ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                          </div>
                          
                          {hasLocation ? (
                            <>
                              <div className="text-xs text-muted-foreground mb-2">
                                Last update: {driverLastSeen ? driverLastSeen.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Unknown'}
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full"
                                onClick={() => {
                                  window.open(
                                    `https://www.google.com/maps?q=${driver.lastLocationLat},${driver.lastLocationLng}`,
                                    '_blank'
                                  );
                                }}
                                data-testid={`button-view-driver-location-${driver.id}`}
                              >
                                <MapPin className="h-3 w-3 mr-1" />
                                View on Map
                              </Button>
                            </>
                          ) : (
                            <div className="text-xs text-muted-foreground">
                              Location not available
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Pay Driver Card */}
            {branchDrivers.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Coins className="h-5 w-5 text-emerald-500" />
                    Pay Driver
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Record payments made to drivers
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Select Driver</Label>
                        <Select value={selectedPaymentDriver} onValueChange={setSelectedPaymentDriver}>
                          <SelectTrigger data-testid="select-payment-driver">
                            <SelectValue placeholder="Choose a driver..." />
                          </SelectTrigger>
                          <SelectContent>
                            {branchDrivers.map((driver) => (
                              <SelectItem key={driver.id} value={driver.id}>
                                {driver.name} ({driver.phone})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Amount ({currencySymbol})</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Enter amount..."
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                          data-testid="input-payment-amount"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Payment Period</Label>
                        <Select value={paymentPeriod} onValueChange={setPaymentPeriod}>
                          <SelectTrigger data-testid="select-payment-period">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Notes (optional)</Label>
                        <Input
                          placeholder="Payment notes..."
                          value={paymentNotes}
                          onChange={(e) => setPaymentNotes(e.target.value)}
                          data-testid="input-payment-notes"
                        />
                      </div>
                    </div>
                    <Button
                      className="w-full bg-emerald-600 hover:bg-emerald-700"
                      disabled={!selectedPaymentDriver || !paymentAmount || payDriverMutation.isPending}
                      onClick={() => {
                        const driver = branchDrivers.find(d => d.id === selectedPaymentDriver);
                        payDriverMutation.mutate({
                          driverId: selectedPaymentDriver,
                          amount: paymentAmount,
                          paymentType: driver?.paymentType || 'mileage',
                          paymentPeriod: paymentPeriod,
                          notes: paymentNotes || undefined,
                        });
                      }}
                      data-testid="button-pay-driver"
                    >
                      {payDriverMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Coins className="h-4 w-4 mr-2" />
                      )}
                      Record Payment
                    </Button>
                  </div>

                  {/* Driver Payment Summary */}
                  <div className="mt-6 pt-4 border-t">
                    <h4 className="text-sm font-medium mb-3">Driver Payment Summary</h4>
                    <div className="space-y-3">
                      {branchDrivers.map((driver) => {
                        const paymentType = driver.paymentType === 'salary' ? 'Salary' : 
                                           driver.paymentType === 'salary_plus_commission' ? 'Salary + Commission' : 'Per Delivery';
                        const driverEarnings = driversEarnings[driver.id] || { received: 0, due: 0, todayPayments: 0 };
                        return (
                          <div 
                            key={driver.id}
                            className="p-3 rounded-lg bg-secondary/30 border border-border"
                            data-testid={`driver-payment-summary-${driver.id}`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <p className="font-medium">{driver.name}</p>
                                <p className="text-xs text-muted-foreground">{paymentType}</p>
                              </div>
                              <div className="text-right">
                                {driver.paymentType === 'salary' ? (
                                  <p className="text-sm text-muted-foreground">
                                    {currencySymbol}{Number(driver.salaryAmount || 0).toFixed(2)}/{driver.salaryPeriod === 'weekly' ? 'week' : 'month'}
                                  </p>
                                ) : driver.paymentType === 'salary_plus_commission' ? (
                                  <p className="text-sm text-muted-foreground">
                                    {currencySymbol}{Number(driver.salaryAmount || 0).toFixed(2)} + {currencySymbol}{Number(driver.agreedDeliveryCharge || 0).toFixed(2)}/delivery
                                  </p>
                                ) : (
                                  <p className="text-sm text-muted-foreground">
                                    {currencySymbol}{Number(driver.mileageRate1 || 0.50).toFixed(2)}/delivery
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-border/50">
                              <div className="text-center">
                                <p className="text-xs text-muted-foreground">Received</p>
                                <p className="text-sm font-medium text-emerald-500">{currencySymbol}{driverEarnings.received.toFixed(2)}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-xs text-muted-foreground">Due</p>
                                <p className={`text-sm font-medium ${driverEarnings.due > 0 ? 'text-amber-500' : 'text-muted-foreground'}`}>
                                  {currencySymbol}{Math.max(0, driverEarnings.due).toFixed(2)}
                                </p>
                              </div>
                              <div className="text-center">
                                <p className="text-xs text-muted-foreground">Today</p>
                                <p className={`text-sm font-medium ${driverEarnings.todayPayments > 0 ? 'text-blue-500' : 'text-muted-foreground'}`}>
                                  {driverEarnings.todayPayments > 0 ? `${currencySymbol}${driverEarnings.todayPayments.toFixed(2)}` : '-'}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Driver Info Notice */}
            {branchDrivers.length === 0 && (
              <Card className="mt-6 bg-blue-500/5 border-blue-500/20">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">No Drivers Added</h4>
                      <p className="text-sm text-muted-foreground">
                        Add drivers using the form above. Drivers will use their phone number and password to log in to the driver app.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>)}

          {/* Customers Tab */}
          <TabsContent value="customers" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Registered Customers ({allCustomers.length})
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Customers who have registered via the menu page
                </p>
              </CardHeader>
              <CardContent>
                {allCustomers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p>No customers registered yet</p>
                    <p className="text-sm">Customers will appear here after they register on the menu page</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left p-3 font-medium">Name</th>
                          <th className="text-left p-3 font-medium">Mobile</th>
                          <th className="text-left p-3 font-medium">Home Address</th>
                          <th className="text-left p-3 font-medium">Work Address</th>
                          <th className="text-left p-3 font-medium">City</th>
                          <th className="text-left p-3 font-medium">Postcode</th>
                          <th className="text-left p-3 font-medium">Registered</th>
                          <th className="text-center p-3 font-medium">Orders</th>
                          <th className="text-center p-3 font-medium">Delete</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allCustomers.map((customer) => (
                          <tr key={customer.id} className="border-b border-border/50 hover:bg-secondary/30">
                            <td className="p-3" data-testid={`customer-name-${customer.id}`}>
                              {customer.name || <span className="text-muted-foreground italic">Not provided</span>}
                            </td>
                            <td className="p-3" data-testid={`customer-phone-${customer.id}`}>
                              <a href={`tel:${customer.phone}`} className="text-primary hover:underline">
                                {customer.phone}
                              </a>
                            </td>
                            <td className="p-3" data-testid={`customer-address-${customer.id}`}>
                              {customer.address || <span className="text-muted-foreground">-</span>}
                            </td>
                            <td className="p-3" data-testid={`customer-work-address-${customer.id}`}>
                              {customer.workAddress || <span className="text-muted-foreground">-</span>}
                            </td>
                            <td className="p-3" data-testid={`customer-city-${customer.id}`}>
                              {customer.city || <span className="text-muted-foreground">-</span>}
                            </td>
                            <td className="p-3" data-testid={`customer-postcode-${customer.id}`}>
                              {customer.postcode || <span className="text-muted-foreground">-</span>}
                            </td>
                            <td className="p-3 text-muted-foreground" data-testid={`customer-created-${customer.id}`}>
                              {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : '-'}
                            </td>
                            <td className="p-3 text-center" data-testid={`customer-orders-${customer.id}`}>
                              <span className={`inline-flex items-center justify-center min-w-[28px] px-2 py-1 rounded-full text-xs font-medium ${
                                customer.orderCount > 0 
                                  ? 'bg-green-500/20 text-green-400' 
                                  : 'bg-secondary text-muted-foreground'
                              }`}>
                                {customer.orderCount || 0}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => deleteCustomerMutation.mutate(customer.id)}
                                data-testid={`button-delete-customer-${customer.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Allergens Tab */}
          <TabsContent value="allergens" className="mt-0">
            <div className="min-h-screen bg-gradient-to-br from-pink-500 via-rose-500 to-purple-600 rounded-xl overflow-hidden">
              <div className="text-center py-6 px-4">
                <h1 className="text-3xl font-bold text-white flex items-center justify-center gap-2">
                  {restaurant?.name || 'Branch'} <Edit2 className="w-5 h-5 opacity-70" />
                </h1>
                <h2 className="text-2xl font-bold text-yellow-300 mt-2">ALLERGEN MATRIX</h2>
                <p className="text-white/80 text-sm mt-2 max-w-2xl mx-auto">
                  The Food Information Regulations 2014 requires all food businesses to provide information about the 14 major allergenic ingredients.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="px-4 pb-4 flex flex-wrap gap-3 justify-center">
                <Button 
                  onClick={() => {
                    toast({ title: "Saved", description: "Allergen matrix saved successfully" });
                  }}
                  className="bg-green-500 hover:bg-green-600 text-white font-medium px-6"
                  data-testid="button-save-matrix"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Matrix
                </Button>
                <Button 
                  onClick={() => window.print()}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-medium px-6"
                  data-testid="button-print-matrix"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print Matrix
                </Button>
                <Button 
                  onClick={() => setActiveTab("branch")}
                  className="bg-slate-700 hover:bg-slate-800 text-white font-medium px-6"
                  data-testid="button-back-to-branch"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Branch
                </Button>
              </div>

              <div ref={allergenPrintRef} className="px-4 pb-8 space-y-6 print:bg-white print:min-h-0 print:p-4" id="allergen-matrix-print">
                {/* Print Header - only visible in print */}
                <div className="hidden print:block text-center mb-6">
                  <h1 className="text-2xl font-bold text-gray-900">{restaurant?.name || 'Branch'}</h1>
                  <h2 className="text-xl font-bold text-pink-600">ALLERGEN MATRIX</h2>
                </div>
                {(() => {
                  const categories = Array.from(new Set(menuItems.map(item => item.category)));
                  return categories.map(category => {
                    const categoryItems = menuItems.filter(item => item.category === category);
                    if (categoryItems.length === 0) return null;
                    return (
                      <div key={category} className="bg-white rounded-xl overflow-hidden shadow-lg">
                        <div className="bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-3">
                          <h3 className="text-white font-bold text-lg uppercase">{category}</h3>
                        </div>
                        <div className="divide-y divide-gray-100">
                          {categoryItems.map(item => {
                            const profile = (item as any).allergenProfile as Record<string, string> | undefined;
                            const activeAllergens = profile 
                              ? Object.entries(profile).filter(([_, val]) => val === "contains").map(([key]) => key)
                              : [];
                            return (
                              <div key={item.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900">{item.name}</p>
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {activeAllergens.length > 0 ? (
                                      activeAllergens.map(allergen => (
                                        <span 
                                          key={allergen} 
                                          className="px-2 py-0.5 text-xs font-medium rounded bg-red-100 text-red-700 capitalize"
                                        >
                                          {allergen === "gluten" ? "Cereals" : allergen}
                                        </span>
                                      ))
                                    ) : (
                                      <span className="text-gray-400 text-xs">No allergens set</span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 ml-4 print:hidden">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 h-8 w-8 p-0"
                                    onClick={() => {
                                      setAllergenEditItem(item);
                                      setAllergenEditProfile(profile || {});
                                    }}
                                    data-testid={`edit-allergen-${item.id}`}
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                                    onClick={async () => {
                                      try {
                                        await deleteMenuItem(item.id);
                                        queryClient.invalidateQueries({ queryKey: ["/api/menu", restaurantId] });
                                        toast({ title: "Deleted", description: `${item.name} has been removed` });
                                      } catch (err) {
                                        toast({ title: "Error", description: "Failed to delete item", variant: "destructive" });
                                      }
                                    }}
                                    data-testid={`delete-item-${item.id}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>

              {menuItems.length === 0 && (
                <div className="text-center py-12 text-white/70">
                  <AlertTriangle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No menu items found</p>
                  <p className="text-sm mt-1">Add menu items first to configure their allergen information</p>
                </div>
              )}
            </div>

            <Dialog open={!!allergenEditItem} onOpenChange={(open) => !open && setAllergenEditItem(null)}>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Edit Allergens for {allergenEditItem?.name}</DialogTitle>
                  <DialogDescription>
                    Click on allergens to toggle them on or off for this menu item.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-3 gap-3 py-4">
                  {ALLERGEN_KEYS.map(allergen => {
                    const isActive = allergenEditProfile[allergen] === "contains";
                    return (
                      <button
                        key={allergen}
                        onClick={() => {
                          setAllergenEditProfile(prev => ({
                            ...prev,
                            [allergen]: isActive ? "unknown" : "contains"
                          }));
                        }}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                          isActive 
                            ? 'bg-red-100 text-red-700 border-red-300' 
                            : 'bg-gray-100 text-gray-500 border-gray-200 hover:border-gray-300'
                        }`}
                        data-testid={`toggle-allergen-${allergen}`}
                      >
                        <span className="mr-1">
                          {allergen === "gluten" ? "🌾" :
                           allergen === "crustaceans" ? "🦐" :
                           allergen === "eggs" ? "🥚" :
                           allergen === "fish" ? "🐟" :
                           allergen === "peanuts" ? "🥜" :
                           allergen === "soybeans" ? "🫘" :
                           allergen === "milk" ? "🥛" :
                           allergen === "nuts" ? "🌰" :
                           allergen === "celery" ? "🥬" :
                           allergen === "mustard" ? "🟡" :
                           allergen === "sesame" ? "⚪" :
                           allergen === "sulphites" ? "🧪" :
                           allergen === "lupin" ? "🌸" :
                           allergen === "molluscs" ? "🦪" : "❓"}
                        </span>
                        <span className="capitalize">{allergen === "gluten" ? "Cereals" : allergen}</span>
                      </button>
                    );
                  })}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setAllergenEditItem(null)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={async () => {
                      if (!allergenEditItem) return;
                      try {
                        await fetch(`/api/menu/${allergenEditItem.id}/allergens`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify(allergenEditProfile)
                        });
                        queryClient.invalidateQueries({ queryKey: ["/api/menu", restaurantId] });
                        toast({ title: "Allergens Updated", description: `Updated allergens for ${allergenEditItem.name}` });
                        setAllergenEditItem(null);
                      } catch (err) {
                        toast({ title: "Error", description: "Failed to update allergens", variant: "destructive" });
                      }
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Allergens
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>
        </div>
      </Tabs>

      {/* Edit Category Dialog */}
      <Dialog open={!!editCategoryDialog} onOpenChange={(open) => !open && setEditCategoryDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update the category name, icon, and image.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-4 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Icon</Label>
                <Input 
                  value={editingCategoryIcon}
                  onChange={(e) => setEditingCategoryIcon(e.target.value)}
                  placeholder="🍽️"
                  className="h-8 text-center"
                />
              </div>
              <div className="col-span-3 space-y-1">
                <Label className="text-xs">Category Name</Label>
                <Input 
                  value={editingCategoryName}
                  onChange={(e) => setEditingCategoryName(e.target.value)}
                  placeholder="Category name"
                  className="h-8"
                />
              </div>
            </div>
            
            {/* Category Image Upload */}
            <div className="space-y-2">
              <Label className="text-xs">Category Image (PNG/JPG/GIF)</Label>
              <div className="flex gap-2">
                <Input 
                  value={editingCategoryImageUrl}
                  onChange={(e) => setEditingCategoryImageUrl(e.target.value)}
                  placeholder="Image URL or upload"
                  className="h-8 flex-1"
                />
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*,.gif"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file || !editCategoryDialog?.dbId) return;
                      setIsUploadingCategoryImage(true);
                      try {
                        const formData = new FormData();
                        formData.append('file', file);
                        const response = await fetch(`/api/menu-categories/${editCategoryDialog.dbId}/upload-media?type=image`, {
                          method: 'POST',
                          body: formData
                        });
                        if (response.ok) {
                          const result = await response.json();
                          setEditingCategoryImageUrl(result.imageUrl || result.gifUrl || "");
                          queryClient.invalidateQueries({ queryKey: ["/api/menu-categories", restaurantId] });
                          toast({ title: "Image Uploaded", description: "Category image updated successfully" });
                        }
                      } catch (err) {
                        toast({ title: "Error", description: "Failed to upload image", variant: "destructive" });
                      } finally {
                        setIsUploadingCategoryImage(false);
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Button type="button" variant="outline" size="sm" className="h-8" disabled={isUploadingCategoryImage}>
                    {isUploadingCategoryImage ? <Loader2 className="h-3 w-3 animate-spin" /> : <ImageIcon className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
              {editingCategoryImageUrl && (
                <div className="relative h-24 w-full rounded overflow-hidden">
                  <img src={editingCategoryImageUrl} alt="Preview" className="w-full h-full object-cover" />
                  <Button 
                    size="icon" 
                    variant="destructive" 
                    className="absolute top-1 right-1 h-6 w-6"
                    onClick={() => setEditingCategoryImageUrl("")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
            
            {/* Category Video Upload */}
            <div className="space-y-2">
              <Label className="text-xs">Category Video (MP4/WebM)</Label>
              <div className="flex gap-2">
                <Input 
                  value={editingCategoryVideoUrl}
                  onChange={(e) => setEditingCategoryVideoUrl(e.target.value)}
                  placeholder="Video URL or upload"
                  className="h-8 flex-1"
                />
                <div className="relative">
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file || !editCategoryDialog?.dbId) return;
                      setIsUploadingCategoryVideo(true);
                      try {
                        const formData = new FormData();
                        formData.append('file', file);
                        const response = await fetch(`/api/menu-categories/${editCategoryDialog.dbId}/upload-media?type=video`, {
                          method: 'POST',
                          body: formData
                        });
                        if (response.ok) {
                          const result = await response.json();
                          setEditingCategoryVideoUrl(result.videoUrl || "");
                          queryClient.invalidateQueries({ queryKey: ["/api/menu-categories", restaurantId] });
                          toast({ title: "Video Uploaded", description: "Category video updated successfully" });
                        }
                      } catch (err) {
                        toast({ title: "Error", description: "Failed to upload video", variant: "destructive" });
                      } finally {
                        setIsUploadingCategoryVideo(false);
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Button type="button" variant="outline" size="sm" className="h-8" disabled={isUploadingCategoryVideo}>
                    {isUploadingCategoryVideo ? <Loader2 className="h-3 w-3 animate-spin" /> : <Video className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
              {editingCategoryVideoUrl && (
                <div className="relative h-24 w-full rounded overflow-hidden">
                  <video src={editingCategoryVideoUrl} className="w-full h-full object-cover" muted autoPlay loop />
                  <Button 
                    size="icon" 
                    variant="destructive" 
                    className="absolute top-1 right-1 h-6 w-6"
                    onClick={() => setEditingCategoryVideoUrl("")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
            
            {editCategoryDialog?.itemCount ? (
              <p className="text-xs text-muted-foreground">
                {editCategoryDialog.itemCount} menu items in this category
              </p>
            ) : null}
          </div>
          <DialogFooter className="flex justify-between sm:justify-between">
            <Button 
              variant="destructive" 
              onClick={() => {
                if (editCategoryDialog) {
                  setDeleteCategoryConfirm({
                    id: editCategoryDialog.id,
                    dbId: editCategoryDialog.dbId as any,
                    name: editCategoryDialog.name,
                    itemCount: editCategoryDialog.itemCount
                  });
                  setEditCategoryDialog(null);
                }
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditCategoryDialog(null)}>
                Cancel
              </Button>
              <Button onClick={async () => {
                if (!editCategoryDialog || !editingCategoryName.trim()) return;
                try {
                  const response = await fetch(`/api/menu-categories/${editCategoryDialog.dbId || editCategoryDialog.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      name: editingCategoryName.trim(),
                      icon: editingCategoryIcon.trim() || "🍽️",
                      imageUrl: editingCategoryImageUrl || null,
                      videoUrl: editingCategoryVideoUrl || null,
                      restaurantId: restaurantId,
                    }),
                  });
                  if (!response.ok) throw new Error("Failed to update category");
                  queryClient.invalidateQueries({ queryKey: ["/api/menu-categories", restaurantId] });
                  toast({ title: "Category Updated", description: `${editingCategoryName} has been updated.` });
                  setEditCategoryDialog(null);
                  setEditingCategoryName("");
                  setEditingCategoryIcon("");
                  setEditingCategoryImageUrl("");
                  setEditingCategoryVideoUrl("");
                } catch (error) {
                  toast({ title: "Error", description: "Failed to update category", variant: "destructive" });
                }
              }}>
                Save
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Category Confirmation Dialog */}
      <AlertDialog open={!!deleteCategoryConfirm} onOpenChange={(open) => !open && setDeleteCategoryConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteCategoryConfirm?.name}"? 
              {deleteCategoryConfirm?.itemCount ? ` This category has ${deleteCategoryConfirm.itemCount} menu items.` : ""}
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingCategory}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteCategory}
              disabled={isDeletingCategory}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingCategory ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Telephone Order Modal */}
      <Dialog open={showTelephoneOrderModal} onOpenChange={(open) => {
        setShowTelephoneOrderModal(open);
        if (!open) {
          setTelephoneNumber("");
          setTelephoneCustomer(null);
          setTelephoneOrderItems([]);
          setTelephoneCustomerName("");
          setTelephoneAddress("");
          setTelephoneNotes("");
          setTelephoneOrderType("delivery");
          setTelephonePaymentMethod("cash");
          setSaveCustomerDetails(true);
          setTelephoneSelectedCategory(null);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-rose-500" />
              Telephone Order
            </DialogTitle>
            <DialogDescription>
              Enter caller's phone number to lookup existing customer or create new order
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto space-y-4 py-4">
            {/* Phone Number Input */}
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="telephone-number">Phone Number</Label>
                <Input
                  id="telephone-number"
                  type="tel"
                  placeholder="e.g. 020 8597 8608"
                  value={telephoneNumber}
                  onChange={(e) => setTelephoneNumber(e.target.value)}
                  className="text-lg"
                  data-testid="input-telephone-number"
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={async () => {
                    if (!telephoneNumber.trim() || !restaurantId) return;
                    setTelephoneCustomerLoading(true);
                    try {
                      const response = await fetch("/api/customers/login", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ phone: telephoneNumber.trim(), restaurantId }),
                      });
                      if (response.ok) {
                        const data = await response.json();
                        const customer = data.customer;
                        setTelephoneCustomer(customer);
                        if (data.isNewCustomer) {
                          setTelephoneCustomerName("");
                          setTelephoneAddress("");
                          toast({ title: "New Customer", description: "Customer account created - please enter their details" });
                        } else {
                          setTelephoneCustomerName(customer.name || "");
                          setTelephoneAddress(customer.address || "");
                          toast({ title: "Customer Found!", description: `${customer.name || 'Returning customer'} - Details loaded` });
                        }
                      } else {
                        setTelephoneCustomer(null);
                        setTelephoneCustomerName("");
                        setTelephoneAddress("");
                        toast({ title: "Error", description: "Failed to lookup customer", variant: "destructive" });
                      }
                    } catch (error) {
                      toast({ title: "Error", description: "Failed to lookup customer", variant: "destructive" });
                    } finally {
                      setTelephoneCustomerLoading(false);
                    }
                  }}
                  disabled={telephoneCustomerLoading || !telephoneNumber.trim()}
                  data-testid="button-lookup-customer"
                >
                  {telephoneCustomerLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Lookup"}
                </Button>
              </div>
            </div>

            {/* Customer Info Badge */}
            {telephoneCustomer && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-semibold text-green-600">Returning Customer</p>
                  <p className="text-sm text-muted-foreground">{telephoneCustomer.name} - {telephoneCustomer.phone}</p>
                </div>
              </div>
            )}

            {/* Customer Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customer-name">Customer Name</Label>
                <Input
                  id="customer-name"
                  placeholder="Enter customer name"
                  value={telephoneCustomerName}
                  onChange={(e) => setTelephoneCustomerName(e.target.value)}
                  data-testid="input-customer-name"
                />
              </div>
              <div>
                <Label htmlFor="order-type">Order Type</Label>
                <Select value={telephoneOrderType} onValueChange={(v: "delivery" | "collection") => setTelephoneOrderType(v)}>
                  <SelectTrigger data-testid="select-order-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="delivery">
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4" /> Delivery
                      </div>
                    </SelectItem>
                    <SelectItem value="collection">
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="h-4 w-4" /> Collection
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <Label htmlFor="payment-method">Payment Method</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <Button
                  type="button"
                  variant={telephonePaymentMethod === "cash" ? "default" : "outline"}
                  onClick={() => setTelephonePaymentMethod("cash")}
                  className={telephonePaymentMethod === "cash" ? "bg-emerald-500 hover:bg-emerald-600" : ""}
                  data-testid="button-payment-cash"
                >
                  <Banknote className="h-4 w-4 mr-2" /> Cash
                </Button>
                <Button
                  type="button"
                  variant={telephonePaymentMethod === "card" ? "default" : "outline"}
                  onClick={() => setTelephonePaymentMethod("card")}
                  className={telephonePaymentMethod === "card" ? "bg-blue-500 hover:bg-blue-600" : ""}
                  data-testid="button-payment-card"
                >
                  <CreditCard className="h-4 w-4 mr-2" /> Card
                </Button>
                <Button
                  type="button"
                  variant={telephonePaymentMethod === "account" ? "default" : "outline"}
                  onClick={() => setTelephonePaymentMethod("account")}
                  className={telephonePaymentMethod === "account" ? "bg-amber-500 hover:bg-amber-600" : ""}
                  data-testid="button-payment-account"
                >
                  <User className="h-4 w-4 mr-2" /> Account
                </Button>
              </div>
            </div>

            {telephoneOrderType === "delivery" && (
              <div>
                <Label htmlFor="delivery-address">Delivery Address</Label>
                <Textarea
                  id="delivery-address"
                  placeholder="Enter delivery address"
                  value={telephoneAddress}
                  onChange={(e) => setTelephoneAddress(e.target.value)}
                  rows={2}
                  data-testid="input-delivery-address"
                />
              </div>
            )}

            <div>
              <Label htmlFor="order-notes">Order Notes (Optional)</Label>
              <Textarea
                id="order-notes"
                placeholder="Any special instructions..."
                value={telephoneNotes}
                onChange={(e) => setTelephoneNotes(e.target.value)}
                rows={2}
                data-testid="input-order-notes"
              />
            </div>

            {/* Save Customer Details Checkbox */}
            <div className="flex items-center gap-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <Checkbox
                id="save-customer"
                checked={saveCustomerDetails}
                onCheckedChange={(checked: boolean) => setSaveCustomerDetails(checked)}
                data-testid="checkbox-save-customer"
              />
              <div className="flex-1">
                <Label htmlFor="save-customer" className="font-medium cursor-pointer">
                  Save customer details for future calls
                </Label>
                <p className="text-xs text-muted-foreground">
                  Next time this customer calls, their name and address will appear automatically
                </p>
              </div>
            </div>

            {/* Menu Items Selection with Categories */}
            <div className="border rounded-lg p-4">
              <Label className="text-base font-semibold mb-3 block">Add Menu Items</Label>
              
              {/* Category Tabs - Horizontal Scrolling */}
              <div className="mb-3 sticky top-0 bg-background z-10 pb-2 border-b">
                <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-rose-500 scrollbar-track-transparent">
                  <div className="flex gap-2 pb-2 min-w-max px-1">
                    <Button
                      size="sm"
                      variant={telephoneSelectedCategory === null ? "default" : "outline"}
                      onClick={() => setTelephoneSelectedCategory(null)}
                      className={`shrink-0 ${telephoneSelectedCategory === null ? "bg-rose-500 hover:bg-rose-600" : ""}`}
                      data-testid="telephone-category-all"
                    >
                      All Items
                    </Button>
                    {dbCategories.map((cat: { id: string; name: string }) => (
                      <Button
                        key={cat.id}
                        size="sm"
                        variant={telephoneSelectedCategory === cat.id ? "default" : "outline"}
                        onClick={() => setTelephoneSelectedCategory(cat.id)}
                        className={`shrink-0 ${telephoneSelectedCategory === cat.id ? "bg-rose-500 hover:bg-rose-600" : ""}`}
                        data-testid={`telephone-category-${cat.id}`}
                      >
                        {cat.name}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Menu Items Grid - Vertical Scrolling */}
              <ScrollArea className="h-80">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {menuItems
                    .filter(item => item.available !== false)
                    .filter(item => {
                      if (telephoneSelectedCategory === null) return true;
                      const selectedCat = dbCategories.find((c: { id: string; dbId?: string }) => c.id === telephoneSelectedCategory || (c as any).dbId === telephoneSelectedCategory);
                      if (!selectedCat) return true;
                      // Check if item.category matches by ID, dbId, name, or slug
                      return item.category === telephoneSelectedCategory || 
                             item.category === (selectedCat as any).dbId ||
                             item.category === selectedCat.name ||
                             item.category === (selectedCat as any).slug;
                    })
                    .map((item) => {
                      const inCart = telephoneOrderItems.find(oi => oi.item.id === item.id);
                      return (
                        <div
                          key={item.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-all ${
                            inCart ? "border-rose-500 bg-rose-500/10" : "hover:border-gray-400"
                          }`}
                          onClick={() => {
                            setTelephoneOrderItems(prev => {
                              const existing = prev.find(oi => oi.item.id === item.id);
                              if (existing) {
                                return prev.map(oi => oi.item.id === item.id ? {...oi, quantity: oi.quantity + 1} : oi);
                              } else {
                                return [...prev, { item, quantity: 1 }];
                              }
                            });
                          }}
                          data-testid={`telephone-menu-item-${item.id}`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{item.name}</p>
                              <p className="text-xs text-muted-foreground">{currencySymbol}{Number(item.price).toFixed(2)}</p>
                            </div>
                            {inCart && (
                              <Badge className="bg-rose-500 text-white ml-1 shrink-0">{inCart.quantity}</Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </ScrollArea>
            </div>

            {/* Order Summary */}
            {telephoneOrderItems.length > 0 && (
              <div className="border rounded-lg p-4 bg-muted/50">
                <Label className="text-base font-semibold mb-2 block">Order Summary</Label>
                <div className="space-y-2">
                  {telephoneOrderItems.map(({ item, quantity }) => (
                    <div key={item.id} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-6 w-6"
                            onClick={() => {
                              if (quantity > 1) {
                                setTelephoneOrderItems(prev => 
                                  prev.map(oi => oi.item.id === item.id ? {...oi, quantity: oi.quantity - 1} : oi)
                                );
                              } else {
                                setTelephoneOrderItems(prev => prev.filter(oi => oi.item.id !== item.id));
                              }
                            }}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-6 text-center font-medium">{quantity}</span>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-6 w-6"
                            onClick={() => {
                              setTelephoneOrderItems(prev => 
                                prev.map(oi => oi.item.id === item.id ? {...oi, quantity: oi.quantity + 1} : oi)
                              );
                            }}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <span className="text-sm">{item.name}</span>
                      </div>
                      <span className="font-medium">{currencySymbol}{(Number(item.price) * quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 mt-2 flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>{currencySymbol}{telephoneOrderItems.reduce((sum, { item, quantity }) => sum + Number(item.price) * quantity, 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="border-t pt-4 flex gap-2 flex-shrink-0 sticky bottom-0 bg-background">
            <Button variant="outline" onClick={() => setShowTelephoneOrderModal(false)}>
              Cancel
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={!telephoneNumber.trim() || !telephoneCustomerName.trim() || telephoneOrderItems.length === 0 || (telephoneOrderType === "delivery" && !telephoneAddress.trim())}
              onClick={async () => {
                if (!restaurantId) return;
                
                const total = telephoneOrderItems.reduce((sum, { item, quantity }) => sum + Number(item.price) * quantity, 0);
                
                const orderData = {
                  restaurantId,
                  customerName: telephoneCustomerName.trim(),
                  phone: telephoneNumber.trim(),
                  address: telephoneOrderType === "delivery" ? telephoneAddress.trim() : "",
                  type: telephoneOrderType === "delivery" ? "delivery" as const : "collection" as const,
                  paymentMethod: telephonePaymentMethod,
                  total: total.toString(),
                  status: "new" as const,
                  customerId: telephoneCustomer?.id || null,
                  source: "telephone",
                };
                
                const orderItems = telephoneOrderItems.map(({ item, quantity }) => ({
                  menuItemId: item.id,
                  name: item.name,
                  price: item.price,
                  quantity,
                  removedIngredients: [],
                  extras: [],
                  notes: telephoneNotes || null,
                }));
                
                try {
                  if (saveCustomerDetails && telephoneCustomer?.id) {
                    await fetch(`/api/customers/${telephoneCustomer.id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        name: telephoneCustomerName.trim(),
                        address: telephoneOrderType === "delivery" ? telephoneAddress.trim() : telephoneCustomer.address,
                      }),
                    });
                  }
                  
                  const newOrder = await createOrder(orderData, orderItems);
                  toast({ title: "Order Sent to Kitchen!", description: `Order #${newOrder.orderNumber || newOrder.id.slice(-4)} sent to kitchen` });
                  
                  queryClient.invalidateQueries({ queryKey: ["/api/orders", restaurantId] });
                  setShowTelephoneOrderModal(false);
                } catch (error) {
                  toast({ title: "Error", description: "Failed to create order", variant: "destructive" });
                }
              }}
              data-testid="button-send-to-kitchen"
            >
              <ChefHat className="h-4 w-4 mr-2" />
              Send to Kitchen
            </Button>
            <Button
              className="bg-rose-500 hover:bg-rose-600 text-white"
              disabled={!telephoneNumber.trim() || !telephoneCustomerName.trim() || telephoneOrderItems.length === 0 || (telephoneOrderType === "delivery" && !telephoneAddress.trim())}
              onClick={async () => {
                if (!restaurantId) return;
                
                const total = telephoneOrderItems.reduce((sum, { item, quantity }) => sum + Number(item.price) * quantity, 0);
                
                const orderData = {
                  restaurantId,
                  customerName: telephoneCustomerName.trim(),
                  phone: telephoneNumber.trim(),
                  address: telephoneOrderType === "delivery" ? telephoneAddress.trim() : "",
                  type: telephoneOrderType === "delivery" ? "delivery" as const : "collection" as const,
                  paymentMethod: telephonePaymentMethod,
                  total: total.toString(),
                  status: "new" as const,
                  customerId: telephoneCustomer?.id || null,
                  source: "telephone",
                };
                
                const orderItems = telephoneOrderItems.map(({ item, quantity }) => ({
                  menuItemId: item.id,
                  name: item.name,
                  price: item.price,
                  quantity,
                  removedIngredients: [],
                  extras: [],
                  notes: telephoneNotes || null,
                }));
                
                try {
                  // Save customer details for future calls if checkbox is checked
                  if (saveCustomerDetails && telephoneCustomer?.id) {
                    await fetch(`/api/customers/${telephoneCustomer.id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        name: telephoneCustomerName.trim(),
                        address: telephoneOrderType === "delivery" ? telephoneAddress.trim() : telephoneCustomer.address,
                      }),
                    });
                  }
                  
                  const newOrder = await createOrder(orderData, orderItems);
                  toast({ title: "Order Created!", description: `Order #${newOrder.orderNumber || newOrder.id.slice(-4)} placed successfully${saveCustomerDetails ? ' - Customer details saved!' : ''}` });
                  
                  queryClient.invalidateQueries({ queryKey: ["/api/orders", restaurantId] });
                  
                  // Print the order receipt
                  const printWindow = window.open('', '_blank', 'width=400,height=600');
                  if (printWindow) {
                    const orderNum = newOrder.orderNumber || newOrder.id.slice(-4);
                    const printContent = `
                      <html>
                      <head>
                        <title>Order #${orderNum}</title>
                        <style>
                          body { font-family: monospace; padding: 20px; max-width: 300px; margin: 0 auto; }
                          h1 { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px; }
                          .info { margin: 10px 0; }
                          .items { border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 10px 0; margin: 10px 0; }
                          .item { display: flex; justify-content: space-between; margin: 5px 0; }
                          .total { font-weight: bold; font-size: 1.2em; text-align: right; margin-top: 10px; }
                          .type { background: #000; color: #fff; padding: 5px 10px; display: inline-block; margin: 5px 0; }
                        </style>
                      </head>
                      <body>
                        <h1>Order #${orderNum}</h1>
                        <div class="info">
                          <strong>Customer:</strong> ${telephoneCustomerName}<br>
                          <strong>Phone:</strong> ${telephoneNumber}<br>
                          <span class="type">${telephoneOrderType.toUpperCase()}</span>
                        </div>
                        ${telephoneOrderType === 'delivery' ? `<div class="info"><strong>Address:</strong><br>${telephoneAddress}</div>` : ''}
                        ${telephoneNotes ? `<div class="info"><strong>Notes:</strong> ${telephoneNotes}</div>` : ''}
                        <div class="items">
                          ${telephoneOrderItems.map(({item, quantity}) => 
                            `<div class="item"><span>${quantity}x ${item.name}</span><span>${currencySymbol}${(Number(item.price) * quantity).toFixed(2)}</span></div>`
                          ).join('')}
                        </div>
                        <div class="total">TOTAL: ${currencySymbol}${total.toFixed(2)}</div>
                        <p style="text-align:center;margin-top:20px;font-size:0.8em;">Thank you for your order!</p>
                      </body>
                      </html>
                    `;
                    printWindow.document.write(printContent);
                    printWindow.document.close();
                    printWindow.print();
                  }
                  
                  setShowTelephoneOrderModal(false);
                  setTelephoneNumber("");
                  setTelephoneCustomer(null);
                  setTelephoneOrderItems([]);
                  setTelephoneCustomerName("");
                  setTelephoneAddress("");
                  setTelephoneNotes("");
                  setTelephonePaymentMethod("cash");
                  
                } catch (error: any) {
                  toast({ title: "Error", description: error.message || "Failed to create order", variant: "destructive" });
                }
              }}
              data-testid="button-submit-telephone-order"
            >
              <Printer className="h-4 w-4 mr-2" />
              Create Order & Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      

      {/* Call Log Modal - Shows caller ID history (no recordings to save costs) */}
      <Dialog open={showCallHistoryModal} onOpenChange={setShowCallHistoryModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-indigo-500" />
              Call Log
            </DialogTitle>
            <DialogDescription>
              View incoming call history. Customer details are saved automatically when they call.
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="flex-1 pr-4">
            {callRecordings.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Phone className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>No calls yet</p>
                <p className="text-sm mt-1">Incoming calls will appear here with caller details.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {callRecordings.map((call) => (
                  <div 
                    key={call.id}
                    className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700"
                    data-testid={`call-log-${call.id}`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Phone className="h-4 w-4 text-green-500" />
                          <span className="font-medium">{call.callerNumber}</span>
                          {call.customerName && (
                            <span className="text-sm bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{call.customerName}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                          <span>{new Date(call.createdAt).toLocaleDateString()} {new Date(call.createdAt).toLocaleTimeString()}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setTelephoneNumber(call.callerNumber);
                            if (call.customerName) {
                              setTelephoneCustomerName(call.customerName);
                            }
                            setShowCallHistoryModal(false);
                            setShowTelephoneOrderModal(true);
                          }}
                          data-testid={`button-order-from-call-${call.id}`}
                        >
                          <Phone className="h-3 w-3 mr-1" />
                          Order
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => {
                            if (confirm('Delete this call log? This cannot be undone.')) {
                              deleteRecordingMutation.mutate(call.id);
                            }
                          }}
                          data-testid={`button-delete-call-${call.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          
          <DialogFooter className="mt-4 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowCallHistoryModal(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Menu Item Toppings Management Dialog */}
      <Dialog open={!!selectedMenuItemForToppings} onOpenChange={(open) => !open && setSelectedMenuItemForToppings(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-orange-500" />
              Extra Toppings for {selectedMenuItemForToppings?.name}
            </DialogTitle>
            <DialogDescription>
              Add extra toppings that customers can choose when ordering this item.
            </DialogDescription>
          </DialogHeader>
          
          {selectedMenuItemForToppings && (
            <div className="space-y-4">
              {/* Item preview */}
              <div className="flex items-center gap-3 p-3 bg-secondary/20 rounded-lg">
                {selectedMenuItemForToppings.image ? (
                  <img 
                    src={selectedMenuItemForToppings.image} 
                    alt={selectedMenuItemForToppings.name}
                    className="h-12 w-12 rounded object-cover"
                  />
                ) : (
                  <div className="h-12 w-12 rounded bg-secondary flex items-center justify-center">
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <p className="font-medium">{selectedMenuItemForToppings.name}</p>
                  <p className="text-sm text-muted-foreground">{currencySymbol}{selectedMenuItemForToppings.price}</p>
                </div>
              </div>

              {/* Add new topping */}
              <div className="flex gap-2 items-end">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">Topping Name</Label>
                  <Input 
                    value={quickToppingName}
                    onChange={(e) => setQuickToppingName(e.target.value)}
                    placeholder="e.g., Extra Cheese"
                    className="h-9"
                    data-testid="input-quick-topping-name"
                  />
                </div>
                <div className="w-24 space-y-1">
                  <Label className="text-xs">Price ({currencySymbol})</Label>
                  <Input 
                    value={quickToppingPrice}
                    onChange={(e) => setQuickToppingPrice(e.target.value)}
                    placeholder="1.00"
                    className="h-9"
                    data-testid="input-quick-topping-price"
                  />
                </div>
                <Button 
                  size="sm"
                  className="h-9 bg-orange-500 hover:bg-orange-600"
                  onClick={() => {
                    if (quickToppingName && quickToppingPrice && selectedMenuItemForToppings) {
                      createToppingMutation.mutate({ 
                        name: quickToppingName, 
                        price: quickToppingPrice, 
                        menuItemId: selectedMenuItemForToppings.id 
                      });
                      setQuickToppingName("");
                      setQuickToppingPrice("1.00");
                    }
                  }}
                  disabled={!quickToppingName || !quickToppingPrice || createToppingMutation.isPending}
                  data-testid="button-quick-add-topping"
                >
                  {createToppingMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                </Button>
              </div>

              {/* Existing toppings for this item */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                <Label className="text-xs text-muted-foreground">Existing Toppings</Label>
                {extraToppings
                  .filter(t => (t as any).menuItemId === selectedMenuItemForToppings?.id)
                  .map((topping) => (
                    <div 
                      key={topping.id}
                      className={`flex items-center gap-2 p-2 rounded-lg ${topping.isActive !== false ? 'bg-secondary/30' : 'bg-red-500/10 border border-red-500/30'}`}
                      data-testid={`quick-topping-row-${topping.id}`}
                    >
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${topping.isActive === false ? 'line-through text-muted-foreground' : ''}`}>
                          {topping.name}
                        </p>
                      </div>
                      <span className="text-sm font-medium">{currencySymbol}{topping.price}</span>
                      <Switch
                        checked={topping.isActive !== false}
                        onCheckedChange={(checked) => updateToppingMutation.mutate({ id: topping.id, data: { isActive: checked } })}
                        data-testid={`switch-quick-topping-active-${topping.id}`}
                        className="data-[state=unchecked]:bg-red-500"
                      />
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => deleteToppingMutation.mutate(topping.id)}
                        disabled={deleteToppingMutation.isPending}
                        data-testid={`button-quick-delete-topping-${topping.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                }
                {extraToppings.filter(t => (t as any).menuItemId === selectedMenuItemForToppings?.id).length === 0 && (
                  <div className="text-center py-6 text-muted-foreground">
                    <Plus className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No toppings yet</p>
                    <p className="text-xs">Add toppings above</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedMenuItemForToppings(null)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
