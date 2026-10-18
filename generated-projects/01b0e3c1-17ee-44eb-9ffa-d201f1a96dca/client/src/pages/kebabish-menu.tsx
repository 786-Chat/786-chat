import React, { useState, useEffect, useRef, useMemo } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { getRestaurantBySlug, getMenuItems, createOrder, getExtraToppings, getToppingGroups, getStripeConfig } from "@/lib/api";
import { useSubdomainSlug } from "@/App";
import { type MenuItem, type ExtraTopping, type ToppingGroupWithOptions, getCurrencySymbol, ALLERGEN_KEYS, type AllergenKey } from "@shared/schema";
import { OptionGroupSelector } from "@/components/option-group-selector";
import { X, Plus, Minus, Search, ShoppingBag, ArrowLeft, Flame, Star, Sparkles, Check, Clock, ChevronRight, Calendar, Users, Phone as PhoneIcon, Mail, CreditCard, Banknote, Loader2, Building, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import useSound from "use-sound";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

interface CardPaymentFormProps {
  amount: number;
  restaurantId: string;
  onPaymentSuccess: (paymentIntentId: string) => void;
  onPaymentError: (error: string) => void;
  isProcessing: boolean;
  setIsProcessing: (val: boolean) => void;
  validateBeforePayment?: () => string | null;
}

function CardPaymentForm({ amount, restaurantId, onPaymentSuccess, onPaymentError, isProcessing, setIsProcessing, validateBeforePayment }: CardPaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateBeforePayment) {
      const error = validateBeforePayment();
      if (error) {
        onPaymentError(error);
        return;
      }
    }
    if (!stripe || !elements) return;
    setIsProcessing(true);
    try {
      const res = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Math.round(amount * 100), restaurantId }),
      });
      const { clientSecret, error } = await res.json();
      if (error) { onPaymentError(error); setIsProcessing(false); return; }
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) { onPaymentError("Card element not found"); setIsProcessing(false); return; }
      const { paymentIntent, error: confirmError } = await stripe.confirmCardPayment(clientSecret, { payment_method: { card: cardElement } });
      if (confirmError) { onPaymentError(confirmError.message || "Payment failed"); setIsProcessing(false); return; }
      if (paymentIntent?.status === "succeeded") { onPaymentSuccess(paymentIntent.id); }
    } catch (err: any) { onPaymentError(err.message || "Payment failed"); }
    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 rounded-xl bg-white/10 border border-white/20">
        <CardElement options={{
          style: { base: { fontSize: "16px", color: "#fff", "::placeholder": { color: "#aab7c4" } }, invalid: { color: "#ef4444" } }
        }} />
      </div>
      <Button type="submit" disabled={!stripe || isProcessing} className="w-full py-4 text-lg font-bold bg-gradient-to-r from-green-600 to-green-500">
        {isProcessing ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...</> : <>
          <CreditCard className="mr-2 h-5 w-5" /> Pay Now
        </>}
      </Button>
    </form>
  );
}

const ALLERGEN_ICONS: Record<AllergenKey, string> = {
  gluten: "🌾", crustaceans: "🦐", eggs: "🥚", fish: "🐟", peanuts: "🥜",
  soybeans: "🫘", milk: "🥛", nuts: "🌰", celery: "🥬", mustard: "🟡",
  sesame: "⚪", sulphites: "🧪", lupin: "🌸", molluscs: "🦪",
};

const ADD_TO_CART_SOUND = "https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3";
const CLICK_SOUND = "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3";

const KEBABISH_FALLBACK_CATEGORIES = [
  { id: "starters", name: "Starters", icon: "🍢", slug: "starters" },
  { id: "mains", name: "Mains", icon: "🍛", slug: "mains" },
  { id: "sides", name: "Sides", icon: "🍟", slug: "sides" },
  { id: "drinks", name: "Drinks", icon: "🥤", slug: "drinks" },
  { id: "desserts", name: "Desserts", icon: "🍰", slug: "desserts" },
];

interface CartExtra { name: string; price: number; }
interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  selectedOptions: string[];
  totalPrice: number;
  notes: string;
  extras: CartExtra[];
  baseUnitPrice: number;
}

export default function KebabbishMenu() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug || "";
  const [, setLocation] = useLocation();

  const [activeCategory, setActiveCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [showCart, setShowCart] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [customNotes, setCustomNotes] = useState("");
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [addCutlery, setAddCutlery] = useState(false);
  const [orderType, setOrderType] = useState<"collection" | "delivery">("collection");

  const [showBooking, setShowBooking] = useState(false);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [bookingName, setBookingName] = useState("");
  const [bookingPhone, setBookingPhone] = useState("");
  const [bookingEmail, setBookingEmail] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [showAllergenMatrix, setShowAllergenMatrix] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [phoneCountryCode, setPhoneCountryCode] = useState("+44");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("cash");
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [stripeLoadAttempted, setStripeLoadAttempted] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('booking') === 'true') {
      setShowBooking(true);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const [playAddToCartSound] = useSound(ADD_TO_CART_SOUND, { volume: 0.5 });
  const [playClickSound] = useSound(CLICK_SOUND, { volume: 0.3 });

  const { data: restaurant, isLoading: loadingRestaurant, error: restaurantError } = useQuery({
    queryKey: ["/api/restaurants", slug],
    queryFn: () => getRestaurantBySlug(slug),
    enabled: !!slug,
  });
  const hasStripeKeys = !!(restaurant?.stripePublishableKey && restaurant?.stripeSecretKey);

  const { data: menuItems = [] } = useQuery<MenuItem[]>({
    queryKey: ["/api/menu", restaurant?.id],
    queryFn: async () => {
      if (!restaurant?.id) return [];
      return getMenuItems(restaurant.id);
    },
    enabled: !!restaurant?.id,
  });

  const { data: extraToppings = [] } = useQuery<ExtraTopping[]>({
    queryKey: ["/api/extra-toppings", restaurant?.id],
    queryFn: async () => {
      if (!restaurant?.id) return [];
      return getExtraToppings(restaurant.id);
    },
    enabled: !!restaurant?.id,
  });

  const { data: dbCategories = [] } = useQuery({
    queryKey: ["/api/menu-categories", restaurant?.id],
    queryFn: async () => {
      const url = restaurant?.id 
        ? `/api/menu-categories?restaurantId=${restaurant.id}`
        : "/api/menu-categories";
      const response = await fetch(url);
      return response.json();
    },
    enabled: !!restaurant?.id,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  // Fetch topping groups (option groups like "Choose Your Sauce", "Salad Options")
  const { data: toppingGroups = [] } = useQuery<ToppingGroupWithOptions[]>({
    queryKey: ["/api/topping-groups", restaurant?.id],
    queryFn: () => getToppingGroups(restaurant?.id!),
    enabled: !!restaurant?.id,
  });

  // Memoized lookup for topping groups by menuItemId
  const groupsByMenuItemId = useMemo(() => {
    const map = new Map<string, ToppingGroupWithOptions[]>();
    toppingGroups.forEach(group => {
      const key = String(group.menuItemId);
      const existing = map.get(key) || [];
      existing.push(group);
      map.set(key, existing);
    });
    return map;
  }, [toppingGroups]);

  // Get groups for a specific menu item
  const getGroupsForItem = (menuItemId: string) => groupsByMenuItemId.get(String(menuItemId)) || [];

  // State for option group selections
  const [tempOptionGroupSelections, setTempOptionGroupSelections] = useState<Record<string, string[]>>({});
  const [tempOptionGroupQuantities, setTempOptionGroupQuantities] = useState<Record<string, Record<string, number>>>({});

  // Calculate total price for option group selections
  const getOptionGroupsPrice = (menuItemId: string): number => {
    const groups = getGroupsForItem(menuItemId);
    let total = 0;
    groups.forEach(group => {
      const allowQuantity = (group as any).allowQuantity;
      if (allowQuantity) {
        const groupQuantities = tempOptionGroupQuantities[group.id] || {};
        Object.entries(groupQuantities).forEach(([optionId, qty]) => {
          const option = group.options.find(o => o.id === optionId);
          if (option && qty > 0) {
            total += Number(option.price) * qty;
          }
        });
      } else {
        const selections = tempOptionGroupSelections[group.id] || [];
        selections.forEach(optionId => {
          const option = group.options.find(o => o.id === optionId);
          if (option) {
            total += Number(option.price);
          }
        });
      }
    });
    return total;
  };

  // Validate if all required groups have selections and minimum selections are met
  const validateOptionGroups = (menuItemId: string): { valid: boolean; missingGroups: string[]; insufficientGroups: { name: string; required: number; selected: number }[] } => {
    const groups = getGroupsForItem(menuItemId);
    const missingGroups: string[] = [];
    const insufficientGroups: { name: string; required: number; selected: number }[] = [];
    
    groups.forEach(group => {
      const minSelections = (group as any).minSelections || 0;
      const allowQuantity = (group as any).allowQuantity;
      
      if (allowQuantity) {
        const groupQuantities = tempOptionGroupQuantities[group.id] || {};
        const totalQty = Object.values(groupQuantities).reduce((sum, q) => sum + q, 0);
        
        if (group.isRequired && totalQty === 0) {
          missingGroups.push(group.headline);
        } else if (minSelections > 0 && totalQty < minSelections) {
          insufficientGroups.push({
            name: group.headline,
            required: minSelections,
            selected: totalQty
          });
        }
      } else {
        const selections = tempOptionGroupSelections[group.id] || [];
        
        if (group.isRequired && selections.length === 0) {
          missingGroups.push(group.headline);
        } else if (minSelections > 0 && selections.length < minSelections) {
          insufficientGroups.push({
            name: group.headline,
            required: minSelections,
            selected: selections.length
          });
        }
      }
    });
    
    const allValid = missingGroups.length === 0 && insufficientGroups.length === 0;
    return { valid: allValid, missingGroups, insufficientGroups };
  };

  const categories = dbCategories.map((cat: any) => ({
    id: cat.id,
    name: cat.name,
    icon: cat.icon || "🍽️",
    slug: cat.slug,
    isNew: false,
  }));

  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0].id);
    }
  }, [categories, activeCategory]);

  useEffect(() => {
    if (paymentMethod === "card" && !stripePromise && !stripeLoadAttempted && restaurant?.id) {
      setStripeLoadAttempted(true);
      getStripeConfig(restaurant.id).then(config => {
        setStripePromise(loadStripe(config.publishableKey));
      }).catch(err => {
        console.error("Failed to load Stripe:", err);
      });
    }
  }, [paymentMethod, stripePromise, stripeLoadAttempted, restaurant?.id]);

  const activeToppings = extraToppings.filter(t => t.isActive);
  const currencySymbol = getCurrencySymbol(restaurant?.currency || "GBP");

  const getCartExtrasTotal = (extras: CartExtra[]) => extras.reduce((sum, e) => sum + e.price, 0);
  const getSelectionExtrasTotal = (extraNames: string[]) => 
    extraNames.reduce((sum, name) => {
      const t = activeToppings.find(x => x.name === name);
      return sum + (t ? Number(t.price) : 0);
    }, 0);

  const createOrderMutation = useMutation({
    mutationFn: ({ order, items }: { order: any; items: any[] }) => createOrder(order, items),
    onSuccess: () => {
      setShowCart(false);
      setCart([]);
      toast({ title: "Order Placed!", description: "Your order has been sent to the kitchen.", duration: 5000 });
    },
    onError: (error: any) => {
      const errorMessage = error?.message || "Failed to place order.";
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    },
  });

  const addToCart = (item: MenuItem, qty: number, options: string[], notes: string, extras: string[], optionGroupsTotal: number = 0) => {
    playAddToCartSound();
    const basePrice = Number(item.price);
    const extrasTotal = getSelectionExtrasTotal(extras);
    const unitPrice = basePrice + extrasTotal + optionGroupsTotal;
    const cartExtras: CartExtra[] = extras.map(name => {
      const t = activeToppings.find(x => x.name === name);
      return { name, price: t ? Number(t.price) : 0 };
    });
    setCart([...cart, {
      menuItem: item, quantity: qty, selectedOptions: options,
      totalPrice: unitPrice * qty, notes, extras: cartExtras, baseUnitPrice: basePrice + optionGroupsTotal,
    }]);
    setSelectedItem(null);
    setQuantity(1);
    setCustomNotes("");
    setSelectedExtras([]);
  };

  const updateCartQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) { setCart(cart.filter((_, i) => i !== index)); return; }
    const updated = [...cart];
    const item = updated[index];
    const extrasPrice = getCartExtrasTotal(item.extras);
    updated[index] = { ...item, quantity: newQty, totalPrice: (item.baseUnitPrice + extrasPrice) * newQty };
    setCart(updated);
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);

  const BEST_SELLER_NAMES = [
    "Kebab Roll", "Tandoori Naan", "Baby Chicken (Mild)", "Baby Chicken (Medium)", "Baby Chicken (Spicy)",
    "Lamb Seekh Kebab", "Butter Naan", "Chicken Doner", "Chips", "Plain Naan",
    "Chicken Curry (Regular)", "Chicken Curry (Large)", "Chicken Tikka Roll", 
    "Lahori Karahi Gosht (Regular)", "Lahori Karahi Gosht (Large)",
    "Butter Chicken (Regular)", "Butter Chicken (Large)", "Lamb Chops",
    "Chickchar Chanay (Regular)", "Chickchar Chanay (Large)", "Chicken Doner Meat and Chips"
  ];

  const getItemsForCategory = (catId: string) => {
    const cat = categories.find((c: any) => c.id === catId);
    if (!cat) return [];
    
    return menuItems.filter(item => {
      if (item.available === false) return false;
      
      const itemCategory = item.category || '';
      
      const matchesCat = itemCategory === cat.id || 
        itemCategory === cat.slug ||
        itemCategory.toLowerCase() === cat.name.toLowerCase() ||
        itemCategory.toLowerCase() === cat.slug?.toLowerCase();
      
      if (!matchesCat) return false;
      
      const matchesSearch = !searchQuery.trim() || 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesSearch;
    });
  };

  const categoryItems = getItemsForCategory(activeCategory);
  const activeCat = categories.find((c: any) => c.id === activeCategory);

  if (loadingRestaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-950 via-orange-950 to-yellow-950">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 rounded-full border-4 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  if (!slug || !restaurant || restaurantError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-red-950 via-orange-950 to-yellow-950 text-white">
        <h1 className="text-2xl font-bold mb-4">Restaurant Not Found</h1>
        <Button onClick={() => setLocation('/')} variant="outline" data-testid="button-go-home">Go Home</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gradient-to-br from-slate-950 via-red-950 to-orange-950">
      {/* Fire Particles Background - hidden on mobile for performance */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 hidden md:block">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              background: `radial-gradient(circle, ${['#ff6b35', '#ffd700', '#ff4500', '#ff8c00'][i % 4]} 0%, transparent 70%)`,
              left: `${Math.random() * 100}%`,
              bottom: `-10px`,
            }}
            animate={{
              y: [0, -window.innerHeight - 100],
              x: [0, (Math.random() - 0.5) * 100],
              opacity: [0.8, 0],
              scale: [1, 0.3],
            }}
            transition={{
              duration: 4 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: "easeOut",
            }}
          />
        ))}
      </div>

      {/* Mobile/Tablet Left Sidebar */}
      <aside 
        className="lg:hidden fixed left-0 top-0 h-full z-40 w-20 overflow-y-auto scrollbar-hide"
        style={{
          background: 'linear-gradient(180deg, rgba(0,0,0,0.98) 0%, rgba(20,0,0,0.95) 100%)',
          borderRight: '1px solid rgba(255,107,53,0.3)',
        }}
      >
        {/* Logo & Back Button */}
        <div className="p-2 border-b border-orange-500/30 flex flex-col items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setLocation(slug ? `/${slug}/welcome` : '/')}
            className="p-2 rounded-full bg-white/10"
          >
            <ArrowLeft className="h-4 w-4 text-white" />
          </motion.button>
          <img src={restaurant?.logoUrl || "/attached_assets/kologoheader_1767549304977.png"} alt={restaurant?.name || "K.O."} className="h-10 object-contain" />
        </div>
        
        {/* Mobile Categories - Vertical List */}
        <div className="py-2">
          {categories.map((cat: any) => (
            <motion.button
              key={cat.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => { 
                playClickSound(); 
                setActiveCategory(cat.id);
              }}
              className={`w-full flex flex-col items-center gap-1 px-1 py-3 transition-all relative ${
                activeCategory === cat.id 
                  ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white' 
                  : 'text-white/70 hover:bg-white/10'
              }`}
              data-testid={`mobile-category-${cat.id}`}
            >
              <span className="text-xl">{cat.icon}</span>
              <span className="font-medium text-[9px] leading-tight text-center px-1">{cat.name}</span>
              {cat.isNew && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-yellow-400 rounded-full" />
              )}
            </motion.button>
          ))}
        </div>
        
      </aside>

      {/* Mobile/Tablet Top Bar - Search + Cart */}
      <div className="lg:hidden fixed top-0 left-20 right-0 z-50"
        style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.98) 0%, rgba(20,0,0,0.95) 100%)' }}>
        <div className="px-3 py-2 border-b border-orange-500/30 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60" />
            <Input
              placeholder="Search menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full bg-white/10 border-white/20 text-white placeholder:text-white/50 h-9"
            />
          </div>
          <button
            onClick={() => setShowCart(true)}
            className="relative px-3 py-1.5 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold text-sm flex items-center gap-1 shrink-0"
            data-testid="button-cart-mobile"
          >
            <ShoppingBag className="h-4 w-4" />
            <span>{currencySymbol}{cartTotal.toFixed(2)}</span>
            {cart.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-600 text-white text-[10px] flex items-center justify-center">
                {cart.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Desktop Sidebar - hidden on mobile/tablet */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: 0, width: sidebarCollapsed ? 60 : 280 }}
        transition={{ type: "spring", damping: 20 }}
        className="hidden lg:block fixed left-0 top-0 h-full z-40 backdrop-blur-xl overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, rgba(0,0,0,0.95) 0%, rgba(20,0,0,0.95) 100%)',
          borderRight: '1px solid rgba(255,107,53,0.3)',
        }}
      >
        {/* Header with Animated K.O. Logo */}
        <div className="p-4 border-b border-orange-500/30">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="flex items-center justify-center cursor-pointer"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", damping: 10, stiffness: 100 }}
              className="relative"
            >
              {/* Glow effect behind logo */}
              <motion.div
                animate={{ 
                  boxShadow: [
                    '0 0 20px rgba(255,107,53,0.5)',
                    '0 0 40px rgba(255,215,0,0.8)',
                    '0 0 20px rgba(255,107,53,0.5)'
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 rounded-full"
              />
              <motion.img 
                src={restaurant?.logoUrl || "/attached_assets/kologoheader_1767549304977.png"}
                alt={restaurant?.name || "K.O. Kebabish"}
                className={`${sidebarCollapsed ? 'w-12 h-12' : 'w-full max-w-[200px] h-auto'} object-contain relative z-10`}
                animate={{ 
                  filter: [
                    'drop-shadow(0 0 10px rgba(255,107,53,0.6))',
                    'drop-shadow(0 0 20px rgba(255,215,0,0.8))',
                    'drop-shadow(0 0 10px rgba(255,107,53,0.6))'
                  ]
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
                whileHover={{ 
                  scale: 1.1,
                  rotate: [0, -5, 5, 0],
                  transition: { duration: 0.3 }
                }}
              />
              {/* Fire sparks around logo */}
              {!sidebarCollapsed && [...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1.5 h-1.5 rounded-full bg-yellow-400"
                  style={{
                    left: '50%',
                    top: '50%',
                  }}
                  animate={{
                    x: [0, Math.cos(i * 60 * Math.PI / 180) * 60],
                    y: [0, Math.sin(i * 60 * Math.PI / 180) * 60],
                    opacity: [1, 0],
                    scale: [1, 0],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </motion.div>
          </motion.div>
          {/* Address */}
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-3 text-center"
            >
              <p className="text-orange-400 text-xs font-medium flex items-center justify-center gap-1">
                <span>📍</span> Find us at:
              </p>
              <p className="text-white/70 text-xs mt-1 text-center px-2">{restaurant?.address || ''}</p>
            </motion.div>
          )}
        </div>

        {/* Categories */}
        <div className="overflow-y-auto h-[calc(100vh-200px)] py-2 pb-32 scrollbar-hide">
          {categories.map((cat: any, idx: number) => (
            <motion.button
              key={cat.id}
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ scale: 1.02, x: 5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => { playClickSound(); setActiveCategory(cat.id); }}
              className={`w-full flex items-center gap-3 px-4 py-3 transition-all relative overflow-hidden ${
                activeCategory === cat.id 
                  ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white' 
                  : 'text-white/80 hover:bg-white/10'
              }`}
              style={{ borderLeft: activeCategory === cat.id ? '4px solid #ffd700' : '4px solid transparent' }}
              data-testid={`category-${cat.id}`}
            >
              {activeCategory === cat.id && (
                <motion.div
                  layoutId="activeCategory"
                  className="absolute inset-0 bg-gradient-to-r from-red-600/50 to-orange-500/50"
                  transition={{ type: "spring", damping: 20 }}
                />
              )}
              <span className="text-xl relative z-10">{cat.icon}</span>
              {!sidebarCollapsed && (
                <span className="font-medium text-sm relative z-10 flex-1 text-left">{cat.name}</span>
              )}
              {cat.isNew && !sidebarCollapsed && (
                <Badge className="bg-yellow-500 text-black text-xs px-1.5 py-0.5 relative z-10">NEW</Badge>
              )}
            </motion.button>
          ))}
        </div>
      </motion.aside>

      {/* Main Content */}
      <main 
        className={`flex-1 relative z-10 transition-all duration-300 ml-20 lg:ml-0 ${sidebarCollapsed ? 'lg:ml-[60px]' : 'lg:ml-[280px]'} pt-14 lg:pt-0`}
      >
        {/* Desktop Header - hidden on mobile */}
        <header className="hidden lg:block sticky top-0 z-30 backdrop-blur-xl border-b border-orange-500/20"
          style={{ background: 'linear-gradient(135deg, rgba(185,28,28,0.9) 0%, rgba(194,65,12,0.9) 100%)' }}>
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setLocation(slug ? `/${slug}/welcome` : '/')}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 hover:bg-white/30 transition-all"
                  data-testid="button-back"
                >
                  <ArrowLeft className="h-5 w-5 text-white" />
                  <span className="text-white text-sm font-medium">Back</span>
                </motion.button>
                <div className="flex items-center gap-2">
                  <Flame className="w-6 h-6 text-yellow-400 animate-pulse" />
                  <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                    {activeCat?.name || "Menu"}
                  </h1>
                  {activeCat?.isNew && <Badge className="bg-yellow-400 text-black ml-2">NEW</Badge>}
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60" />
                  <Input
                    placeholder="Search by name or menu"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    data-testid="input-search"
                  />
                </div>

                {/* Cart */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowCart(true)}
                  className="relative px-4 py-2 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold"
                  data-testid="button-cart"
                >
                  <ShoppingBag className="h-5 w-5 inline mr-2" />
                  {currencySymbol}{cartTotal.toFixed(2)}
                  {cart.length > 0 && (
                    <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-600 text-white text-xs flex items-center justify-center">
                      {cart.length}
                    </span>
                  )}
                </motion.button>
              </div>
            </div>
          </div>
        </header>

        {/* Category Banner - Compact on mobile */}
        {activeCat?.id === 'ko-split-decision' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-red-600 via-orange-500 to-yellow-500 p-2 md:p-4 text-center"
          >
            <motion.h2 
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-sm md:text-2xl font-bold text-white mb-1"
              style={{ fontFamily: "'Playfair Display', serif", textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}
            >
              🥊 K.O. Split Decision Meals - Grab a bargain!
            </motion.h2>
            <p className="text-white/90 text-xs md:text-base">Choice of plain or pilau rice included.</p>
          </motion.div>
        )}

        {/* Menu Items Grid */}
        <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 py-4 md:py-8 overflow-y-auto">
          {/* Mobile Category Title */}
          <div className="lg:hidden mb-4 flex items-center gap-2">
            <Flame className="w-5 h-5 text-yellow-400" />
            <h2 className="text-xl font-bold text-white">{activeCat?.name || "Menu"}</h2>
            {activeCat?.isNew && <Badge className="bg-yellow-400 text-black text-xs">NEW</Badge>}
          </div>
          
          {categoryItems.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 md:py-20"
            >
              <Sparkles className="w-12 h-12 md:w-16 md:h-16 mx-auto text-orange-400 mb-4" />
              {activeCat?.id === 'my-last-order' ? (
                <>
                  <p className="text-white/70 text-base md:text-lg">We haven't added any products to this section yet.</p>
                  <p className="text-white/50 text-sm mt-2">Please check back soon, we regularly update it.</p>
                </>
              ) : (
                <>
                  <p className="text-white/70 text-base md:text-lg">No items found in this category yet.</p>
                  <p className="text-white/50 text-sm mt-2">Check back soon for delicious additions!</p>
                </>
              )}
            </motion.div>
          ) : (
            <div className="grid gap-3 md:gap-4">
              {categoryItems.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx * 0.03, 0.3) }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { playClickSound(); setSelectedItem(item); }}
                  className="flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl cursor-pointer transition-all active:bg-white/5"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,107,53,0.08) 100%)',
                    border: '1px solid rgba(255,107,53,0.2)',
                    backdropFilter: 'blur(10px)',
                  }}
                  data-testid={`menu-item-${item.id}`}
                >
                  {/* Image */}
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden flex-shrink-0 bg-slate-800 flex items-center justify-center">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="max-w-full max-h-full object-contain" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/30 text-[10px] md:text-xs text-center px-1">
                        Coming Soon
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 md:gap-2 flex-wrap">
                      <h3 className="font-bold text-white text-sm md:text-lg leading-tight">{item.name}</h3>
                      {(item as any).isVegetarian && <span className="text-green-400 text-xs md:text-sm">🟢</span>}
                      {(item as any).isSpicy && <span className="text-red-400 text-xs md:text-sm">🌶️</span>}
                    </div>
                    {item.description && (
                      <p className="text-white/60 text-xs md:text-sm line-clamp-2 mt-0.5 md:mt-1">{item.description}</p>
                    )}
                    {/* Mobile Price */}
                    <div className="md:hidden mt-1.5 flex items-center justify-between">
                      <span className="text-lg font-bold text-yellow-400">
                        {currencySymbol}{Number(item.price).toFixed(2)}
                      </span>
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(item, 1, [], '', []);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-red-600 to-orange-500 text-white text-sm font-bold flex items-center gap-1"
                        data-testid={`add-item-mobile-${item.id}`}
                      >
                        <Plus className="w-3 h-3" /> ADD
                      </motion.button>
                    </div>
                  </div>

                  {/* Desktop Price & Add */}
                  <div className="hidden md:flex items-center gap-4 flex-shrink-0">
                    <span className="text-2xl font-bold text-yellow-400">
                      {currencySymbol}{Number(item.price).toFixed(2)}
                    </span>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(item, 1, [], '', []);
                      }}
                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-red-600 to-orange-500 text-white font-bold flex items-center gap-1"
                      data-testid={`add-item-${item.id}`}
                    >
                      <Plus className="w-4 h-4" /> ADD
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Item Detail Modal */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setSelectedItem(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl"
              style={{
                background: 'linear-gradient(135deg, #1a0a0a 0%, #2d1810 100%)',
                border: '1px solid rgba(255,107,53,0.3)',
              }}
            >
              {/* Image */}
              {selectedItem.image && (
                <div className="h-48 relative overflow-hidden">
                  <img src={selectedItem.image} alt={selectedItem.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                </div>
              )}

              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white">{selectedItem.name}</h2>
                    <p className="text-yellow-400 text-xl font-bold mt-1">
                      {currencySymbol}{Number(selectedItem.price).toFixed(2)}
                    </p>
                  </div>
                  <button onClick={() => setSelectedItem(null)} className="text-white/60 hover:text-white">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {selectedItem.description && (
                  <p className="text-white/70 mb-4">{selectedItem.description}</p>
                )}

                {/* Topping Groups (Option Groups from Super Admin) */}
                {getGroupsForItem(selectedItem.id).length > 0 && (
                  <div className="mb-4">
                    <OptionGroupSelector
                      groups={getGroupsForItem(selectedItem.id)}
                      selections={tempOptionGroupSelections}
                      quantities={tempOptionGroupQuantities}
                      onSelectionChange={(groupId, optionIds) => {
                        setTempOptionGroupSelections(prev => ({ ...prev, [groupId]: optionIds }));
                      }}
                      onQuantityChange={(groupId, optionId, quantity) => {
                        setTempOptionGroupQuantities(prev => ({
                          ...prev,
                          [groupId]: { ...(prev[groupId] || {}), [optionId]: quantity }
                        }));
                      }}
                      currencySymbol={currencySymbol}
                    />
                  </div>
                )}

                {/* Extras */}
                {activeToppings.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-white font-semibold mb-2">Add Extras:</h4>
                    <div className="space-y-2">
                      {activeToppings.filter(t => !t.menuItemId || String(t.menuItemId) === String(selectedItem.id)).map(topping => (
                        <label key={topping.id} className="flex items-center gap-3 p-2 rounded-lg bg-white/5 cursor-pointer hover:bg-white/10">
                          <input
                            type="checkbox"
                            checked={selectedExtras.includes(topping.name)}
                            onChange={() => {
                              setSelectedExtras(prev => 
                                prev.includes(topping.name) 
                                  ? prev.filter(n => n !== topping.name)
                                  : [...prev, topping.name]
                              );
                            }}
                            className="w-5 h-5 rounded"
                          />
                          <span className="text-white flex-1">{topping.name}</span>
                          <span className="text-yellow-400">+{currencySymbol}{Number(topping.price).toFixed(2)}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div className="mb-4">
                  <Input
                    placeholder="Special instructions..."
                    value={customNotes}
                    onChange={(e) => setCustomNotes(e.target.value)}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>

                {/* Quantity */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <span className="text-white text-xl font-bold w-8 text-center">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  <span className="text-yellow-400 text-xl font-bold">
                    {currencySymbol}{((Number(selectedItem.price) + getSelectionExtrasTotal(selectedExtras) + getOptionGroupsPrice(selectedItem.id)) * quantity).toFixed(2)}
                  </span>
                </div>

                {/* Add to Cart */}
                <Button
                  onClick={() => {
                    const validation = validateOptionGroups(selectedItem.id);
                    if (!validation.valid) {
                      let errorMsg = "";
                      if (validation.missingGroups.length > 0) {
                        errorMsg = `Please select: ${validation.missingGroups.join(', ')}`;
                      }
                      if (validation.insufficientGroups && validation.insufficientGroups.length > 0) {
                        const insufficientMsgs = validation.insufficientGroups.map(g => 
                          `${g.name}: select ${g.required - g.selected} more (${g.selected}/${g.required})`
                        );
                        if (errorMsg) errorMsg += ". ";
                        errorMsg += insufficientMsgs.join(", ");
                      }
                      toast({ title: "Required Options", description: errorMsg, variant: "destructive" });
                      return;
                    }
                    const optionGroupsTotal = getOptionGroupsPrice(selectedItem.id);
                    addToCart(selectedItem, quantity, [], customNotes, selectedExtras, optionGroupsTotal);
                    setTempOptionGroupSelections({});
                    setTempOptionGroupQuantities({});
                  }}
                  className="w-full py-4 text-lg font-bold bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400"
                  data-testid="button-add-to-cart"
                >
                  Add to Order - {currencySymbol}{((Number(selectedItem.price) + getSelectionExtrasTotal(selectedExtras) + getOptionGroupsPrice(selectedItem.id)) * quantity).toFixed(2)}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Drawer */}
      <AnimatePresence>
        {showCart && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm"
            onClick={() => setShowCart(false)}
          >
            <motion.div
              initial={{ x: 400 }}
              animate={{ x: 0 }}
              exit={{ x: 400 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md h-full overflow-y-auto"
              style={{
                background: 'linear-gradient(180deg, #1a0a0a 0%, #2d1810 100%)',
                borderLeft: '1px solid rgba(255,107,53,0.3)',
              }}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <ShoppingBag className="w-6 h-6 text-orange-400" /> Your Order
                  </h2>
                  <button onClick={() => setShowCart(false)} className="text-white/60 hover:text-white">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {cart.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingBag className="w-16 h-16 mx-auto text-white/30 mb-4" />
                    <p className="text-white/60">Your cart is empty</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4 mb-6">
                      {cart.map((item, idx) => (
                        <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/10">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="text-white font-semibold">{item.menuItem.name}</h4>
                              {item.extras.length > 0 && (
                                <p className="text-white/50 text-sm">+ {item.extras.map(e => e.name).join(', ')}</p>
                              )}
                            </div>
                            <span className="text-yellow-400 font-bold">{currencySymbol}{item.totalPrice.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateCartQuantity(idx, item.quantity - 1)}
                              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="text-white w-8 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateCartQuantity(idx, item.quantity + 1)}
                              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-white/20 pt-4 space-y-3">
                      {/* Order Type Selector */}
                      <div className="flex gap-2 mb-3">
                        <button
                          onClick={() => setOrderType("collection")}
                          className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${orderType === "collection" ? 'bg-orange-500 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
                          data-testid="button-order-collection"
                        >
                          Collection
                        </button>
                        <button
                          onClick={() => setOrderType("delivery")}
                          className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${orderType === "delivery" ? 'bg-orange-500 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
                          data-testid="button-order-delivery"
                        >
                          Delivery
                        </button>
                      </div>
                      
                      {/* Subtotal */}
                      <div className="flex justify-between text-white/80">
                        <span>Subtotal</span>
                        <span>{currencySymbol}{cartTotal.toFixed(2)}</span>
                      </div>
                      
                      {/* Cutlery Option if enabled - shows before fees */}
                      {restaurant?.cutleryOptionEnabled && (
                        <div 
                          className={`flex items-center justify-between py-3 px-3 rounded-lg cursor-pointer transition-all ${addCutlery ? 'bg-orange-500/20 border border-orange-500' : 'bg-white/5 border border-white/10 hover:bg-white/10'}`}
                          onClick={() => setAddCutlery(!addCutlery)}
                          data-testid="button-add-cutlery"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${addCutlery ? 'bg-orange-500 border-orange-500' : 'border-white/40'}`}>
                              {addCutlery && <span className="text-white text-xs">✓</span>}
                            </div>
                            <span className="text-white">{(restaurant as any).cutleryName || "Cutlery Set"}</span>
                          </div>
                          <span className="text-yellow-400 font-semibold">+{currencySymbol}{Number((restaurant as any).cutleryPrice || 0.50).toFixed(2)}</span>
                        </div>
                      )}
                      
                      {/* All fees and total calculated with cutlery and collection discount */}
                      {(() => {
                        const cutleryPrice = addCutlery && restaurant?.cutleryOptionEnabled ? Number((restaurant as any).cutleryPrice || 0) : 0;
                        const subtotalWithCutlery = cartTotal + cutleryPrice;
                        
                        // Collection discount calculation
                        const collectionDiscountPercent = Number(restaurant?.collectionDiscountPercent || 0);
                        const collectionDiscountMinimum = Number(restaurant?.collectionDiscountMinimum || 0);
                        const qualifiesForDiscount = orderType === "collection" && collectionDiscountPercent > 0 && subtotalWithCutlery >= collectionDiscountMinimum;
                        const discountAmount = qualifiesForDiscount ? subtotalWithCutlery * collectionDiscountPercent / 100 : 0;
                        const subtotalAfterDiscount = subtotalWithCutlery - discountAmount;
                        
                        const vatAmount = restaurant?.vatEnabled ? subtotalAfterDiscount * Number(restaurant.vatPercent || 0) / 100 : 0;
                        const serviceFeeAmount = restaurant?.serviceFeeEnabled ? subtotalAfterDiscount * Number(restaurant.serviceFeePercent || 0) / 100 : 0;
                        const deliveryFeeAmount = orderType === "delivery" && restaurant?.deliveryFeeEnabled ? Number(restaurant.deliveryFee || 0) : 0;
                        const grandTotal = subtotalAfterDiscount + vatAmount + serviceFeeAmount + deliveryFeeAmount;
                        
                        return (
                          <>
                            {/* Collection Discount Message */}
                            {orderType === "collection" && collectionDiscountPercent > 0 && (
                              qualifiesForDiscount ? (
                                <div className="flex justify-between text-green-400 font-semibold bg-green-500/10 py-2 px-3 rounded-lg">
                                  <span>✨ Collection Discount ({collectionDiscountPercent}%)</span>
                                  <span>-{currencySymbol}{discountAmount.toFixed(2)}</span>
                                </div>
                              ) : (
                                <div className="text-amber-400 text-sm bg-amber-500/10 py-2 px-3 rounded-lg">
                                  ✨ {collectionDiscountPercent}% off on orders over {currencySymbol}{collectionDiscountMinimum.toFixed(2)}
                                </div>
                              )
                            )}
                            
                            {/* VAT/Tax if enabled */}
                            {restaurant?.vatEnabled && Number(restaurant.vatPercent) > 0 && (
                              <div className="flex justify-between text-white/80">
                                <span>VAT ({Number(restaurant.vatPercent)}%)</span>
                                <span>{currencySymbol}{vatAmount.toFixed(2)}</span>
                              </div>
                            )}
                            
                            {/* Service Fee if enabled */}
                            {restaurant?.serviceFeeEnabled && Number(restaurant.serviceFeePercent) > 0 && (
                              <div className="flex justify-between text-white/80">
                                <span>Service Fee ({Number(restaurant.serviceFeePercent)}%)</span>
                                <span>{currencySymbol}{serviceFeeAmount.toFixed(2)}</span>
                              </div>
                            )}
                            
                            {/* Delivery Fee if enabled and order is delivery */}
                            {orderType === "delivery" && restaurant?.deliveryFeeEnabled && Number(restaurant.deliveryFee) > 0 && (
                              <div className="flex justify-between text-white/80">
                                <span>Delivery Fee</span>
                                <span>{currencySymbol}{deliveryFeeAmount.toFixed(2)}</span>
                              </div>
                            )}
                            
                            {/* Total */}
                            <div className="flex justify-between text-xl font-bold text-white pt-2 border-t border-white/20">
                              <span>Total</span>
                              <span className="text-yellow-400">{currencySymbol}{grandTotal.toFixed(2)}</span>
                            </div>
                            
                            {/* Customer Info */}
                            <div className="space-y-3 mt-4 pt-4 border-t border-white/20">
                              <Input
                                placeholder="Your Name"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                className="h-12 rounded-xl bg-white/10 text-white placeholder:text-white/50 border-white/20"
                              />
                              <div className="flex gap-2">
                                <select
                                  value={phoneCountryCode}
                                  onChange={(e) => setPhoneCountryCode(e.target.value)}
                                  className="h-12 px-3 rounded-xl bg-white/10 text-white border border-white/20"
                                >
                                  <option value="+44">🇬🇧 +44</option>
                                  <option value="+1">🇺🇸 +1</option>
                                  <option value="+92">🇵🇰 +92</option>
                                  <option value="+91">🇮🇳 +91</option>
                                  <option value="+971">🇦🇪 +971</option>
                                </select>
                                <Input
                                  placeholder="Phone Number"
                                  value={customerPhone}
                                  onChange={(e) => setCustomerPhone(e.target.value)}
                                  className="flex-1 h-12 rounded-xl bg-white/10 text-white placeholder:text-white/50 border-white/20"
                                />
                              </div>
                              {orderType === "delivery" && (
                                <Input
                                  placeholder="Delivery Address"
                                  value={customerAddress}
                                  onChange={(e) => setCustomerAddress(e.target.value)}
                                  className="h-12 rounded-xl bg-white/10 text-white placeholder:text-white/50 border-white/20"
                                />
                              )}
                            </div>
                            
                            {/* Payment Method */}
                            <div className="mt-4 pt-4 border-t border-white/20">
                              <p className="text-white/70 text-sm mb-3">Payment Method</p>
                              <div className="grid grid-cols-2 gap-3">
                                <button
                                  onClick={() => setPaymentMethod("cash")}
                                  className={`py-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${paymentMethod === "cash" ? "bg-green-600 text-white" : "bg-white/10 text-white/70 border border-white/20"}`}
                                >
                                  <Banknote className="h-5 w-5" /> Cash
                                </button>
                                {hasStripeKeys && (
                                <button
                                  onClick={() => setPaymentMethod("card")}
                                  className={`py-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${paymentMethod === "card" ? "bg-blue-600 text-white" : "bg-white/10 text-white/70 border border-white/20"}`}
                                >
                                  <CreditCard className="h-5 w-5" /> Card
                                </button>
                                )}
                                {((restaurant as any)?.bankTransferEnabled && (restaurant?.bankAccountName || (restaurant as any)?.easypaisaAccountNumber || (restaurant as any)?.jazzcashAccountNumber)) && (
                                <button
                                  onClick={() => setPaymentMethod("bank_transfer" as any)}
                                  className={`py-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${paymentMethod === ("bank_transfer" as any) ? "bg-purple-600 text-white" : "bg-white/10 text-white/70 border border-white/20"}`}
                                >
                                  <Building className="h-5 w-5" /> Bank
                                </button>
                                )}
                              </div>
                            </div>

                            {paymentMethod === ("bank_transfer" as any) && restaurant?.bankTransferEnabled && (
                              <div className="mt-4 p-4 rounded-xl border border-purple-500/30 bg-purple-500/10">
                                <h4 className="text-white font-semibold mb-3 flex items-center gap-2"><Building className="h-5 w-5 text-purple-400" /> Bank Transfer Details</h4>
                                {(() => {
                                  const qrParams = new URLSearchParams();
                                  if (restaurant?.bankAccountName) {
                                    if ((restaurant as any)?.bankName) qrParams.set('bank', (restaurant as any).bankName);
                                    qrParams.set('name', restaurant.bankAccountName);
                                    if ((restaurant as any)?.bankSortCode) qrParams.set('sc', (restaurant as any).bankSortCode);
                                    if (restaurant?.bankAccountNumber) qrParams.set('acc', restaurant.bankAccountNumber);
                                    if ((restaurant as any)?.bankIban) qrParams.set('iban', (restaurant as any).bankIban);
                                  }
                                  qrParams.set('amount', grandTotal.toFixed(2));
                                  qrParams.set('cur', currencySymbol);
                                  if (restaurant?.name) qrParams.set('r', restaurant.name);
                                  const qrData = `${window.location.origin}/pay-info?${qrParams.toString()}`;
                                  return (
                                    <div className="flex justify-center mb-4">
                                      <div className="bg-white p-3 rounded-xl shadow-lg">
                                        <QRCodeSVG value={qrData} size={180} level="L" includeMargin={true} />
                                      </div>
                                    </div>
                                  );
                                })()}
                                {restaurant?.bankAccountName && (restaurant?.bankAccountNumber || (restaurant as any)?.bankIban) && (
                                  <div className="space-y-2 mb-3">
                                    {(restaurant as any)?.bankName && <div className="flex justify-between"><span className="text-gray-400 text-sm">Bank</span><span className="text-white text-sm font-medium">{(restaurant as any).bankName}</span></div>}
                                    <div className="flex justify-between"><span className="text-gray-400 text-sm">Account Name</span><span className="text-white text-sm font-medium">{restaurant.bankAccountName}</span></div>
                                    {(restaurant as any)?.bankSortCode && <div className="flex justify-between"><span className="text-gray-400 text-sm">Sort Code</span><span className="text-white text-sm font-medium">{(restaurant as any).bankSortCode}</span></div>}
                                    {restaurant?.bankAccountNumber && <div className="flex justify-between"><span className="text-gray-400 text-sm">Account No</span><span className="text-white text-sm font-medium">{restaurant.bankAccountNumber}</span></div>}
                                    {(restaurant as any)?.bankIban && <div className="flex justify-between"><span className="text-gray-400 text-sm">IBAN</span><span className="text-white text-sm font-medium">{(restaurant as any).bankIban}</span></div>}
                                  </div>
                                )}
                                <p className="text-purple-300 text-xs mt-2">Please transfer the total amount and place your order. Show proof of payment upon delivery/collection.</p>
                              </div>
                            )}
                            
                            {/* Card Payment */}
                            {paymentMethod === "card" && stripePromise ? (
                              <div className="mt-4">
                                <Elements stripe={stripePromise}>
                                  <CardPaymentForm
                                    amount={grandTotal}
                                    restaurantId={restaurant?.id || ""}
                                    validateBeforePayment={() => {
                                      if (!customerName || !customerPhone) return "Please enter your name and phone number";
                                      if (orderType === "delivery" && !customerAddress) return "Please enter your delivery address";
                                      return null;
                                    }}
                                    onPaymentSuccess={(paymentIntentId) => {
                                      const orderItems = cart.map(c => ({
                                        name: c.menuItem.name, quantity: c.quantity, price: c.totalPrice.toFixed(2), notes: c.notes || null,
                                      }));
                                      if (addCutlery && restaurant?.cutleryOptionEnabled) {
                                        orderItems.push({ name: (restaurant as any).cutleryName || "Cutlery Set", quantity: 1, price: cutleryPrice.toFixed(2), notes: null });
                                      }
                                      createOrderMutation.mutate({
                                        order: { restaurantId: restaurant!.id, customerName, phone: phoneCountryCode + customerPhone, address: orderType === "delivery" ? customerAddress : undefined, type: orderType === "collection" ? "takeaway" : "delivery", status: "new" as const, total: grandTotal.toFixed(2), paymentMethod: "card", paymentIntentId },
                                        items: orderItems,
                                      });
                                    }}
                                    onPaymentError={(error) => toast({ title: "Payment Failed", description: error, variant: "destructive" })}
                                    isProcessing={isProcessingPayment}
                                    setIsProcessing={setIsProcessingPayment}
                                  />
                                </Elements>
                              </div>
                            ) : paymentMethod === "card" ? (
                              <div className="mt-4 text-center text-white/60">Loading card payment...</div>
                            ) : (
                              <Button
                                onClick={() => {
                                  if (!customerName || !customerPhone) {
                                    toast({ title: "Required Fields", description: "Please enter your name and phone number", variant: "destructive" });
                                    return;
                                  }
                                  if (orderType === "delivery" && !customerAddress) {
                                    toast({ title: "Address Required", description: "Please enter your delivery address", variant: "destructive" });
                                    return;
                                  }
                                  if (!restaurant?.id) return;
                                  const orderItems = cart.map(c => ({
                                    name: c.menuItem.name, quantity: c.quantity, price: c.totalPrice.toFixed(2), notes: c.notes || null,
                                  }));
                                  if (addCutlery && restaurant?.cutleryOptionEnabled) {
                                    orderItems.push({ name: (restaurant as any).cutleryName || "Cutlery Set", quantity: 1, price: cutleryPrice.toFixed(2), notes: null });
                                  }
                                  createOrderMutation.mutate({
                                    order: { restaurantId: restaurant.id, customerName, phone: phoneCountryCode + customerPhone, address: orderType === "delivery" ? customerAddress : undefined, type: orderType === "collection" ? "takeaway" : "delivery", status: "new" as const, total: grandTotal.toFixed(2), paymentMethod: "cash" },
                                    items: orderItems,
                                  });
                                }}
                                disabled={createOrderMutation.isPending}
                                className="w-full mt-4 py-4 text-lg font-bold bg-gradient-to-r from-red-600 to-orange-500"
                                data-testid="button-checkout"
                              >
                                {createOrderMutation.isPending ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Placing Order...</> : `Pay Cash - ${currencySymbol}${grandTotal.toFixed(2)}`}
                              </Button>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBooking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => { setShowBooking(false); setBookingSuccess(false); }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-slate-900 via-red-950/20 to-slate-800 rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-orange-500/20 shadow-2xl"
            >
              {bookingSuccess ? (
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center py-12 px-6"
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.5 }}
                    className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center shadow-lg"
                  >
                    <Check className="w-12 h-12 text-white" />
                  </motion.div>
                  <h3 className="text-3xl font-bold text-white mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
                    Booking Confirmed!
                  </h3>
                  <p className="text-white/60 mb-2">
                    Thank you for your reservation at K.O. Kebabish.
                  </p>
                  <p className="text-orange-400 font-medium mb-8">
                    We'll see you soon!
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { playClickSound(); setShowBooking(false); setBookingSuccess(false); }}
                    className="px-10 py-4 rounded-2xl font-bold text-white shadow-lg bg-gradient-to-r from-red-600 to-orange-500"
                    data-testid="button-close-booking"
                  >
                    Close
                  </motion.button>
                </motion.div>
              ) : (
                <>
                  <div className="p-6 border-b border-white/10 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3" style={{ fontFamily: "'Playfair Display', serif" }}>
                      <Calendar className="w-7 h-7 text-orange-400" />
                      Book a Table
                    </h2>
                    <button onClick={() => setShowBooking(false)} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                      <X className="w-5 h-5 text-white" />
                    </button>
                  </div>

                  <div className="p-6 space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-white/70 text-sm mb-2">Your Name *</label>
                        <Input
                          value={bookingName}
                          onChange={(e) => setBookingName(e.target.value)}
                          placeholder="Enter your name"
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-orange-500"
                          data-testid="input-booking-name"
                        />
                      </div>
                      <div>
                        <label className="block text-white/70 text-sm mb-2">Phone Number *</label>
                        <Input
                          value={bookingPhone}
                          onChange={(e) => setBookingPhone(e.target.value)}
                          placeholder="Enter phone"
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-orange-500"
                          data-testid="input-booking-phone"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-white/70 text-sm mb-2">Email (Optional)</label>
                      <Input
                        value={bookingEmail}
                        onChange={(e) => setBookingEmail(e.target.value)}
                        placeholder="Enter email"
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-orange-500"
                        data-testid="input-booking-email"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-white/70 text-sm mb-2">Date *</label>
                        <Input
                          type="date"
                          value={bookingDate}
                          onChange={(e) => setBookingDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          className="bg-white/10 border-white/20 text-white focus:border-orange-500"
                          data-testid="input-booking-date"
                        />
                      </div>
                      <div>
                        <label className="block text-white/70 text-sm mb-2">Time *</label>
                        <Input
                          type="time"
                          value={bookingTime}
                          onChange={(e) => setBookingTime(e.target.value)}
                          className="bg-white/10 border-white/20 text-white focus:border-orange-500"
                          data-testid="input-booking-time"
                        />
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-2xl p-4">
                      <label className="block text-white/70 text-sm mb-4">Number of Guests</label>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <span className="text-white/60 text-xs block mb-2">Adults</span>
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => setAdults(Math.max(1, adults - 1))}
                              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="text-white font-bold w-6 text-center text-lg">{adults}</span>
                            <button
                              onClick={() => setAdults(adults + 1)}
                              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="text-center">
                          <span className="text-white/60 text-xs block mb-2">Children</span>
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => setChildren(Math.max(0, children - 1))}
                              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="text-white font-bold w-6 text-center text-lg">{children}</span>
                            <button
                              onClick={() => setChildren(children + 1)}
                              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="text-center">
                          <span className="text-white/60 text-xs block mb-2">Infants</span>
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => setInfants(Math.max(0, infants - 1))}
                              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="text-white font-bold w-6 text-center text-lg">{infants}</span>
                            <button
                              onClick={() => setInfants(infants + 1)}
                              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-white/70 text-sm mb-2">Special Requests (Optional)</label>
                      <textarea
                        value={specialRequests}
                        onChange={(e) => setSpecialRequests(e.target.value)}
                        placeholder="Any special requirements or dietary needs..."
                        className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:border-orange-500 rounded-lg p-3 min-h-[80px] resize-none"
                        data-testid="input-special-requests"
                      />
                    </div>

                    <Button
                      className="w-full py-5 text-lg font-bold bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 rounded-xl shadow-lg"
                      disabled={!bookingName || !bookingPhone || !bookingDate || !bookingTime || isSubmittingBooking}
                      onClick={async () => {
                        if (!restaurant) return;
                        setIsSubmittingBooking(true);
                        try {
                          const res = await fetch("/api/bookings", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              restaurantId: restaurant.id,
                              customerName: bookingName,
                              email: bookingEmail || "no-email@guest.com",
                              phone: bookingPhone,
                              date: bookingDate,
                              time: bookingTime,
                              guests: adults + children + infants,
                              adults: adults,
                              children: children,
                              infants: infants,
                              specialHelp: specialRequests,
                            }),
                          });
                          const result = await res.json();
                          if (res.ok && result) {
                            setBookingSuccess(true);
                            setBookingName("");
                            setBookingPhone("");
                            setBookingEmail("");
                            setBookingDate("");
                            setBookingTime("");
                            setAdults(2);
                            setChildren(0);
                            setInfants(0);
                            setSpecialRequests("");
                          } else {
                            toast({ title: "Booking Failed", description: result?.message || "Please try again", variant: "destructive" });
                          }
                        } catch (error) {
                          toast({ title: "Error", description: "Failed to place booking", variant: "destructive" });
                        }
                        setIsSubmittingBooking(false);
                      }}
                      data-testid="button-place-booking"
                    >
                      {isSubmittingBooking ? "Booking..." : "Confirm Booking"}
                    </Button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAllergenMatrix && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAllergenMatrix(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-orange-500/20"
            >
              <div className="p-6 border-b border-white/10 flex justify-between items-center sticky top-0 bg-slate-900/95 backdrop-blur-sm z-10">
                <h2 className="text-2xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Allergen Information
                </h2>
                <button onClick={() => setShowAllergenMatrix(false)} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-7 gap-2 mb-6">
                  {Object.entries(ALLERGEN_ICONS).map(([key, icon]) => (
                    <div key={key} className="text-center p-2 bg-white/5 rounded-lg">
                      <span className="text-2xl">{icon}</span>
                      <p className="text-white/60 text-xs mt-1 capitalize">{key}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 max-h-[50vh] overflow-y-auto">
                  {menuItems.filter(item => item.available === true).map((item) => {
                    const allergens = item.allergenProfile 
                      ? Object.entries(item.allergenProfile).filter(([_, val]) => val).map(([key]) => key)
                      : [];
                    return (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                        <span className="text-white font-medium flex-1">{item.name}</span>
                        <div className="flex gap-1 flex-wrap justify-end">
                          {allergens.length > 0 ? (
                            allergens.map((allergen) => (
                              <span key={allergen} className="text-lg" title={allergen}>
                                {ALLERGEN_ICONS[allergen as AllergenKey] || "⚠️"}
                              </span>
                            ))
                          ) : (
                            <span className="text-white/40 text-sm">No allergens listed</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fixed Bottom Buttons - positioned above safe area on mobile */}
      <div className="fixed bottom-6 md:bottom-4 left-1/2 -translate-x-1/2 z-40 flex gap-2 md:gap-3 pb-safe">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => { playClickSound(); setShowBooking(true); }}
          className="px-4 md:px-6 py-2.5 md:py-3 rounded-full bg-gradient-to-r from-red-600 to-orange-500 text-white text-sm md:text-base font-bold shadow-lg flex items-center gap-1.5 md:gap-2"
          data-testid="button-book-table-floating"
        >
          <Calendar className="w-4 h-4 md:w-5 md:h-5" />
          <span className="hidden sm:inline">Book a</span> Table
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => { playClickSound(); setShowAllergenMatrix(true); }}
          className="px-4 md:px-6 py-2.5 md:py-3 rounded-full bg-white/10 backdrop-blur-sm text-white text-sm md:text-base font-bold border border-white/20 shadow-lg flex items-center gap-1.5 md:gap-2"
          data-testid="button-view-allergens"
        >
          <span className="text-base md:text-lg">🥜</span>
          Allergens
        </motion.button>
      </div>

    </div>
  );
}
