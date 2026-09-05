import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { getRestaurantBySlug, getMenuItems, createOrder, getExtraToppings, createBooking, getToppingGroups, getStripeConfig } from "@/lib/api";
import { OptionGroupSelector } from "@/components/option-group-selector";
import { useSubdomainSlug } from "@/App";
import { type MenuItem, type ExtraTopping, type ToppingGroupWithOptions, getCurrencySymbol, ALLERGEN_KEYS, type AllergenKey, type InsertBooking } from "@shared/schema";
import { X, Plus, Minus, Search, ShoppingBag, ChevronDown, ArrowLeft, Sparkles, Crown, Sun, Moon, Sunrise, Calendar, Users, Phone, Mail, AlertTriangle, Check, Clock, CreditCard, Banknote, Loader2, Building, Copy } from "lucide-react";
import { useLocation } from "wouter";
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
      if (error) { onPaymentError(error); return; }
    }
    if (!stripe || !elements) return;
    setIsProcessing(true);
    try {
      const res = await fetch("/api/create-payment-intent", {
        method: "POST", headers: { "Content-Type": "application/json" },
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
        <CardElement options={{ style: { base: { fontSize: "16px", color: "#fff", "::placeholder": { color: "#aab7c4" } }, invalid: { color: "#ef4444" } } }} />
      </div>
      <Button type="submit" disabled={!stripe || isProcessing} className="w-full py-4 text-lg font-bold" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
        {isProcessing ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...</> : <><CreditCard className="mr-2 h-5 w-5" /> Pay Now</>}
      </Button>
    </form>
  );
}

const ALLERGEN_ICONS: Record<AllergenKey, string> = {
  gluten: "🌾",
  crustaceans: "🦐",
  eggs: "🥚",
  fish: "🐟",
  peanuts: "🥜",
  soybeans: "🫘",
  milk: "🥛",
  nuts: "🌰",
  celery: "🥬",
  mustard: "🟡",
  sesame: "⚪",
  sulphites: "🧪",
  lupin: "🌸",
  molluscs: "🦪",
};

const ADD_TO_CART_SOUND = "https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3";
const CLICK_SOUND = "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3";

interface MouseParticle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  vx: number;
  vy: number;
  color: string;
  rotation: number;
}

const SECTION_THEMES = {
  main: {
    name: "Morning Glow",
    icon: Sunrise,
    tagline: "Start Your Day Right",
    bg: 'from-amber-950 via-orange-950 to-rose-950',
    orb1: '#ff6b35',
    orb2: '#f9c8a7',
    orb3: '#f48b72',
    accent: '#f6d27f',
    accentDark: '#c87533',
    header: 'linear-gradient(135deg, #c87533 0%, #a14520 100%)',
    button: 'linear-gradient(135deg, #ff6b35 0%, #c87533 100%)',
    buttonGlow: 'rgba(255,107,53,0.4)',
    particle: '#ffd700',
    cardBg: 'rgba(255,200,167,0.08)',
    cardBorder: 'rgba(255,200,167,0.15)',
  },
  lunch: {
    name: "Midday Fresh",
    icon: Sun,
    tagline: "Fuel Your Afternoon",
    bg: 'from-teal-950 via-cyan-950 to-emerald-950',
    orb1: '#4cc4a0',
    orb2: '#5ad6ff',
    orb3: '#1b9d8a',
    accent: '#5ad6ff',
    accentDark: '#1b9d8a',
    header: 'linear-gradient(135deg, #1b9d8a 0%, #0d7377 100%)',
    button: 'linear-gradient(135deg, #4cc4a0 0%, #1b9d8a 100%)',
    buttonGlow: 'rgba(76,196,160,0.4)',
    particle: '#5ad6ff',
    cardBg: 'rgba(90,214,255,0.08)',
    cardBorder: 'rgba(90,214,255,0.15)',
  },
  nashta: {
    name: "Evening Elegance",
    icon: Moon,
    tagline: "Traditional Breakfast",
    bg: 'from-indigo-950 via-purple-950 to-slate-950',
    orb1: '#a58cf6',
    orb2: '#c87533',
    orb3: '#4a1e5e',
    accent: '#a58cf6',
    accentDark: '#6b21a8',
    header: 'linear-gradient(135deg, #6b21a8 0%, #4a1e5e 100%)',
    button: 'linear-gradient(135deg, #a58cf6 0%, #7c3aed 100%)',
    buttonGlow: 'rgba(165,140,246,0.4)',
    particle: '#e879f9',
    cardBg: 'rgba(165,140,246,0.08)',
    cardBorder: 'rgba(165,140,246,0.15)',
  },
};

const MAIN_MENU_CATEGORIES = [
  { id: "Vegetarian Starters", name: "Veg Starters", icon: "🥗" },
  { id: "Non-Vegetarian Starters", name: "Non-Veg Starters", icon: "🍗" },
  { id: "Sizzling Platters", name: "Sizzling Platters", icon: "🔥" },
  { id: "Signature Karahi", name: "Signature Karahi", icon: "🍲" },
  { id: "Lahori Platter", name: "Lahori Platter", icon: "🍛" },
  { id: "Afghani Platter", name: "Afghani Platter", icon: "🥘" },
  { id: "Chicken Dishes", name: "Chicken", icon: "🐔" },
  { id: "Lamb Dishes", name: "Lamb", icon: "🍖" },
  { id: "Vegetable Dishes", name: "Vegetable", icon: "🥬" },
  { id: "Biryani & Rice", name: "Biryani & Rice", icon: "🍚" },
  { id: "Wraps", name: "Wraps", icon: "🌯" },
  { id: "Naan & Bread", name: "Naan & Bread", icon: "🫓" },
  { id: "Kids Menu", name: "Kids Menu", icon: "👶" },
  { id: "Sides", name: "Sides", icon: "🍟" },
  { id: "Soft Drinks", name: "Soft Drinks", icon: "🥤" },
  { id: "Milkshakes", name: "Milkshakes", icon: "🥛" },
  { id: "Lassi", name: "Lassi", icon: "🧉" },
  { id: "Mocktails", name: "Mocktails", icon: "🍹" },
  { id: "Dessert", name: "Dessert", icon: "🍰" },
];

const LUNCH_MENU_CATEGORIES = [
  { id: "Grilled Chicken", name: "Grilled Chicken", icon: "🍗" },
  { id: "Burgers", name: "Burgers", icon: "🍔" },
  { id: "Sides", name: "Sides", icon: "🍟" },
  { id: "Soft Drinks", name: "Soft Drinks", icon: "🥤" },
  { id: "Milkshakes", name: "Milkshakes", icon: "🥛" },
  { id: "Lassi", name: "Lassi", icon: "🧉" },
  { id: "Mocktails", name: "Mocktails", icon: "🍹" },
];

const NASHTA_MENU_CATEGORIES = [
  { id: "Nashta", name: "Nashta", icon: "🍳" },
  { id: "Hot Drinks", name: "Hot Drinks", icon: "☕" },
  { id: "Milkshakes", name: "Milkshakes", icon: "🥛" },
  { id: "Lassi", name: "Lassi", icon: "🧉" },
];

type MenuSection = "main" | "lunch" | "nashta";

const MENU_SECTIONS = [
  { id: "main" as MenuSection, name: "Main Menu", subtitle: "Full Menu", timeIcon: "🌅" },
  { id: "lunch" as MenuSection, name: "Lunch Menu", subtitle: "Grilled & Burgers", timeIcon: "☀️" },
  { id: "nashta" as MenuSection, name: "Nashta Menu", subtitle: "Breakfast", timeIcon: "🌙" },
];

const getCategoriesForSection = (section: MenuSection) => {
  switch (section) {
    case "main": return MAIN_MENU_CATEGORIES;
    case "lunch": return LUNCH_MENU_CATEGORIES;
    case "nashta": return NASHTA_MENU_CATEGORIES;
    default: return MAIN_MENU_CATEGORIES;
  }
};

interface CartExtra {
  name: string;
  price: number;
}

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  selectedOptions: string[];
  totalPrice: number;
  notes: string;
  extras: CartExtra[];
  baseUnitPrice: number;
}

export default function TawaMenu() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug || "";
  const [, setLocation] = useLocation();

  const [activeMenuSection, setActiveMenuSection] = useState<MenuSection>("main");
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [showCart, setShowCart] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [orderType, setOrderType] = useState<"pickup" | "delivery">("delivery");
  const [customNotes, setCustomNotes] = useState("");
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);

  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [checkoutPhone, setCheckoutPhone] = useState("");
  const [checkoutName, setCheckoutName] = useState("");
  const [phoneCountryCode, setPhoneCountryCode] = useState("+44");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("cash");
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [stripeLoadAttempted, setStripeLoadAttempted] = useState(false);

  // Allergen Matrix and Booking states
  const [showAllergenMatrix, setShowAllergenMatrix] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingName, setBookingName] = useState("");
  const [bookingEmail, setBookingEmail] = useState("");
  const [bookingPhone, setBookingPhone] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [bookingGuests, setBookingGuests] = useState(2);
  const [bookingKids, setBookingKids] = useState(0);
  const [bookingInfants, setBookingInfants] = useState(0);
  const [bookingSpecialRequests, setBookingSpecialRequests] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState(false);
  
  // Extras popup state
  const [showExtrasPopup, setShowExtrasPopup] = useState(false);
  const [tempSelectedExtras, setTempSelectedExtras] = useState<string[]>([]);

  const [playAddToCartSound] = useSound(ADD_TO_CART_SOUND, { volume: 0.5 });
  const [playClickSound] = useSound(CLICK_SOUND, { volume: 0.3 });

  const theme = SECTION_THEMES[activeMenuSection];
  const ThemeIcon = theme.icon;

  // Mouse trail effect state
  const [mouseParticles, setMouseParticles] = useState<MouseParticle[]>([]);
  const particleIdRef = useRef(0);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef<number | undefined>(undefined);

  // Get sparkle colors based on current theme
  const getSparkleColors = () => {
    switch (activeMenuSection) {
      case 'main':
        return ['#ffd700', '#ff6b35', '#ffffff', '#ffb347', '#f9c8a7'];
      case 'lunch':
        return ['#5ad6ff', '#4cc4a0', '#ffffff', '#a8e6cf', '#88d8b0'];
      case 'nashta':
        return ['#a58cf6', '#e879f9', '#ffffff', '#c4b5fd', '#ddd6fe'];
      default:
        return ['#ffffff', '#ffd700', '#f9c8a7'];
    }
  };

  // Handle mouse movement for wing-style trail
  const handleMouseMove = useCallback((e: MouseEvent) => {
    const dx = e.clientX - lastMousePosRef.current.x;
    const dy = e.clientY - lastMousePosRef.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Create wing-style trail when mouse moves
    if (distance > 4) {
      const colors = getSparkleColors();
      const newParticles: MouseParticle[] = [];
      
      // Create wing pattern - particles spread outward like wings
      const wingSpread = 10;
      
      for (let i = 0; i < wingSpread; i++) {
        const progress = i / wingSpread;
        
        // Left wing
        const leftAngle = -Math.PI / 2 - (progress * Math.PI / 3);
        const leftDist = 12 + progress * 35;
        newParticles.push({
          id: particleIdRef.current++,
          x: e.clientX + Math.cos(leftAngle) * leftDist,
          y: e.clientY + Math.sin(leftAngle) * leftDist,
          size: (1 - progress) * 10 + 3,
          opacity: (1 - progress) * 0.6 + 0.2,
          vx: Math.cos(leftAngle) * 1.5,
          vy: Math.sin(leftAngle) * 1.5 + 0.8,
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: leftAngle * (180 / Math.PI),
        });
        
        // Right wing
        const rightAngle = -Math.PI / 2 + (progress * Math.PI / 3);
        const rightDist = 12 + progress * 35;
        newParticles.push({
          id: particleIdRef.current++,
          x: e.clientX + Math.cos(rightAngle) * rightDist,
          y: e.clientY + Math.sin(rightAngle) * rightDist,
          size: (1 - progress) * 10 + 3,
          opacity: (1 - progress) * 0.6 + 0.2,
          vx: Math.cos(rightAngle) * 1.5,
          vy: Math.sin(rightAngle) * 1.5 + 0.8,
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: rightAngle * (180 / Math.PI),
        });
      }

      setMouseParticles(prev => [...prev.slice(-120), ...newParticles]);
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    }
  }, [activeMenuSection]);

  // Animate particles
  useEffect(() => {
    const animate = () => {
      setMouseParticles(prev => 
        prev
          .map(p => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            opacity: p.opacity - 0.015,
            rotation: p.rotation + 2,
            vy: p.vy + 0.05,
          }))
          .filter(p => p.opacity > 0)
      );
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Add mouse move listener
  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [handleMouseMove]);

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

  const { data: toppingGroups = [] } = useQuery<ToppingGroupWithOptions[]>({
    queryKey: ["/api/topping-groups", restaurant?.id],
    queryFn: () => getToppingGroups(restaurant?.id!),
    enabled: !!restaurant?.id,
  });

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

  const getGroupsForItem = (menuItemId: string) => groupsByMenuItemId.get(String(menuItemId)) || [];

  const [tempOptionGroupSelections, setTempOptionGroupSelections] = useState<Record<string, string[]>>({});
  const [tempOptionGroupQuantities, setTempOptionGroupQuantities] = useState<Record<string, Record<string, number>>>({});

  const getOptionGroupsPrice = (menuItemId: string): number => {
    const groups = getGroupsForItem(menuItemId);
    let total = 0;
    groups.forEach(group => {
      const allowQuantity = (group as any).allowQuantity;
      if (allowQuantity) {
        const groupQuantities = tempOptionGroupQuantities[group.id] || {};
        Object.entries(groupQuantities).forEach(([optionId, qty]) => {
          const option = group.options.find(o => o.id === optionId);
          if (option && qty > 0) total += Number(option.price) * qty;
        });
      } else {
        const selections = tempOptionGroupSelections[group.id] || [];
        selections.forEach(optionId => {
          const option = group.options.find(o => o.id === optionId);
          if (option) total += Number(option.price);
        });
      }
    });
    return total;
  };

  const categories = dbCategories.map((cat: any) => ({
    id: cat.id,
    name: cat.name,
    icon: cat.icon || "🍽️",
    slug: cat.slug,
  }));

  const activeToppings = extraToppings.filter(t => t.isActive);
  
  // Get toppings for a specific menu item (global toppings + item-specific toppings)
  const getItemToppings = (itemId: number | string) => {
    return activeToppings.filter(t => !t.menuItemId || String(t.menuItemId) === String(itemId));
  };
  const currencySymbol = getCurrencySymbol(restaurant?.currency || "GBP");

  const getCartExtrasTotal = (extras: CartExtra[]) => {
    return extras.reduce((sum, extra) => sum + extra.price, 0);
  };

  const getSelectionExtrasTotal = (extraNames: string[]) => {
    return extraNames.reduce((sum, extraName) => {
      const topping = activeToppings.find(t => t.name === extraName);
      return sum + (topping ? Number(topping.price) : 0);
    }, 0);
  };

  const createOrderMutation = useMutation({
    mutationFn: ({ order, items }: { order: any; items: any[] }) => createOrder(order, items),
    onSuccess: () => {
      setShowCart(false);
      setCart([]);
      setDeliveryAddress("");
      setCheckoutName("");
      setCheckoutPhone("");
      toast({
        title: "Order Placed!",
        description: "Your order has been sent to the kitchen.",
        duration: 5000,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to place order. Please try again.",
        variant: "destructive",
      });
    },
  });

  const createBookingMutation = useMutation({
    mutationFn: (booking: InsertBooking) => createBooking(booking),
    onSuccess: () => {
      setBookingSuccess(true);
      setBookingName("");
      setBookingEmail("");
      setBookingPhone("");
      setBookingDate("");
      setBookingTime("");
      setBookingGuests(2);
      setBookingSpecialRequests("");
      toast({
        title: "Booking Confirmed!",
        description: "We'll see you soon. Check your email for confirmation.",
        duration: 5000,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create booking. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleBooking = () => {
    playClickSound();
    if (!bookingName || !bookingEmail || !bookingPhone || !bookingDate || !bookingTime) {
      toast({ title: "Missing Details", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    if (!restaurant?.id) return;

    createBookingMutation.mutate({
      restaurantId: restaurant.id,
      customerName: bookingName,
      email: bookingEmail,
      phone: bookingPhone,
      date: bookingDate,
      time: bookingTime,
      guests: bookingGuests,
      specialHelp: bookingSpecialRequests || null,
    });
  };

  const handlePlaceOrder = () => {
    playClickSound();
    if (!checkoutName || !checkoutPhone) {
      toast({ title: "Missing Details", description: "Please enter your name and phone number", variant: "destructive" });
      return;
    }
    if (orderType === "delivery" && !deliveryAddress) {
      toast({ title: "Address Required", description: "Please enter your delivery address", variant: "destructive" });
      return;
    }

    const orderItems = cart.map(item => ({
      menuItemId: item.menuItem.id,
      name: item.menuItem.name,
      price: (item.totalPrice / item.quantity).toFixed(2),
      quantity: item.quantity,
      notes: item.notes || null,
    }));

    createOrderMutation.mutate({
      order: {
        restaurantId: restaurant?.id,
        customerName: checkoutName,
        phone: phoneCountryCode + checkoutPhone,
        address: orderType === "delivery" ? deliveryAddress : null,
        total: cartTotal.toFixed(2),
        type: orderType === "pickup" ? "takeaway" : orderType,
        status: "new",
        paymentMethod: "cash",
      },
      items: orderItems,
    });
  };

  const handleAddToCart = () => {
    if (!selectedItem) return;
    playAddToCartSound();
    
    const baseUnitPrice = parseFloat(selectedItem.price);
    const cartExtras: CartExtra[] = selectedExtras.map(name => {
      const topping = activeToppings.find(t => t.name === name);
      return { name, price: topping ? Number(topping.price) : 0 };
    });
    const extrasPrice = getCartExtrasTotal(cartExtras);
    const optionGroupsPrice = getOptionGroupsPrice(String(selectedItem.id));
    const itemTotal = (baseUnitPrice + extrasPrice + optionGroupsPrice) * quantity;

    const newCartItem: CartItem = {
      menuItem: selectedItem,
      quantity,
      selectedOptions: [],
      totalPrice: itemTotal,
      notes: customNotes.trim(),
      extras: cartExtras,
      baseUnitPrice: baseUnitPrice + optionGroupsPrice,
    };

    setCart([...cart, newCartItem]);
    setSelectedItem(null);
    setQuantity(1);
    setCustomNotes("");
    setSelectedExtras([]);
    setTempOptionGroupSelections({});
    setTempOptionGroupQuantities({});
  };

  const quickAddToCart = (item: MenuItem) => {
    if (!item.available) return;
    playAddToCartSound();
    const baseUnitPrice = parseFloat(item.price);
    const hasOptions = getGroupsForItem(String(item.id)).length > 0;
    if (hasOptions) {
      setSelectedItem(item);
      return;
    }
    const newCartItem: CartItem = {
      menuItem: item,
      quantity: 1,
      selectedOptions: [],
      totalPrice: baseUnitPrice,
      notes: "",
      extras: [],
      baseUnitPrice,
    };
    setCart(prev => [...prev, newCartItem]);
  };

  const toggleExtra = (toppingName: string) => {
    playClickSound();
    setSelectedExtras(prev => 
      prev.includes(toppingName) 
        ? prev.filter(e => e !== toppingName)
        : [...prev, toppingName]
    );
  };

  const updateCartQuantity = (index: number, newQuantity: number) => {
    playClickSound();
    if (newQuantity <= 0) {
      setCart(cart.filter((_, i) => i !== index));
      return;
    }
    const updatedCart = [...cart];
    const item = updatedCart[index];
    const extrasPrice = getCartExtrasTotal(item.extras);
    const unitPrice = item.baseUnitPrice + extrasPrice;
    updatedCart[index] = {
      ...item,
      quantity: newQuantity,
      totalPrice: unitPrice * newQuantity,
    };
    setCart(updatedCart);
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);

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

  const getItemsForCategory = (categoryId: string) => {
    const category = categories.find((c: any) => c.id === categoryId);
    const categorySlug = category?.slug || categoryId;
    
    return menuItems.filter(item => {
      const matchesCategory = item.category === categoryId || 
        (item as any).categorySlug === categorySlug ||
        item.category === categorySlug;
      const matchesSearch = searchQuery.trim() === '' || 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  };

  if (loadingRestaurant) {
    return (
      <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br ${theme.bg}`}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 rounded-full border-4 border-t-transparent"
          style={{ borderColor: theme.accent, borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  if (!slug || !restaurant || restaurantError) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center bg-gradient-to-br ${theme.bg} text-white`}>
        <h1 className="text-2xl font-bold mb-4">Restaurant Not Found</h1>
        <p className="text-white/70 mb-6">The restaurant you're looking for doesn't exist.</p>
        <button 
          onClick={() => setLocation('/')} 
          className="px-6 py-3 rounded-full bg-white/20 hover:bg-white/30 transition-all"
          data-testid="button-go-home"
        >
          Go Home
        </button>
      </div>
    );
  }

  // Custom cursor color based on theme
  const cursorColor = activeMenuSection === 'main' ? '#ffd700' : 
                      activeMenuSection === 'lunch' ? '#5ad6ff' : '#a58cf6';

  return (
    <div 
      className="min-h-screen overflow-hidden relative"
      style={{ 
        cursor: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='12' fill='${encodeURIComponent(cursorColor)}' opacity='0.8'/%3E%3Ccircle cx='16' cy='16' r='6' fill='white'/%3E%3C/svg%3E") 16 16, auto`
      }}
    >
      {/* Mouse Trail Snow Particles */}
      <div className="fixed inset-0 pointer-events-none z-[100]">
        {mouseParticles.map((particle) => (
          <div
            key={particle.id}
            className="absolute"
            style={{
              left: particle.x,
              top: particle.y,
              width: particle.size,
              height: particle.size,
              opacity: particle.opacity,
              transform: `translate(-50%, -50%) rotate(${particle.rotation}deg)`,
              background: `radial-gradient(circle, ${particle.color} 0%, transparent 70%)`,
              borderRadius: '50%',
              boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
              filter: 'blur(0.5px)',
            }}
          />
        ))}
      </div>

      {/* Animated Background - Changes with section */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={activeMenuSection}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-0"
        >
          <div className={`absolute inset-0 bg-gradient-to-br ${theme.bg}`} />
          
          {/* Animated Orbs */}
          <motion.div
            animate={{
              x: [0, 100, 0, -100, 0],
              y: [0, -50, 100, 50, 0],
              scale: [1, 1.2, 1, 1.3, 1],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-0 left-0 w-[800px] h-[800px] rounded-full opacity-25 blur-3xl"
            style={{ background: `radial-gradient(circle, ${theme.orb1} 0%, transparent 70%)` }}
          />
          <motion.div
            animate={{
              x: [0, -150, 50, 100, 0],
              y: [0, 100, -50, 0, 0],
              scale: [1, 1.3, 1, 1.1, 1],
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/4 right-0 w-[600px] h-[600px] rounded-full opacity-20 blur-3xl"
            style={{ background: `radial-gradient(circle, ${theme.orb2} 0%, transparent 70%)` }}
          />
          <motion.div
            animate={{
              x: [0, 80, -80, 0],
              y: [0, -80, 80, 0],
              scale: [1, 1.4, 1, 1.2, 1],
            }}
            transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-0 left-1/4 w-[700px] h-[700px] rounded-full opacity-15 blur-3xl"
            style={{ background: `radial-gradient(circle, ${theme.orb3} 0%, transparent 70%)` }}
          />

          {/* Shimmer Lines */}
          <div className="absolute inset-0 opacity-10">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 8 + i * 2, repeat: Infinity, ease: "linear", delay: i * 1.5 }}
                className="absolute h-[2px] w-1/3"
                style={{
                  top: `${20 + i * 15}%`,
                  background: `linear-gradient(90deg, transparent, ${theme.accent}, transparent)`,
                }}
              />
            ))}
          </div>

          {/* Star/Particle Effect for Evening */}
          {activeMenuSection === 'nashta' && (
            <div className="absolute inset-0">
              {[...Array(30)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    opacity: [0.2, 1, 0.2],
                    scale: [1, 1.5, 1],
                  }}
                  transition={{
                    duration: 2 + Math.random() * 2,
                    repeat: Infinity,
                    delay: Math.random() * 3,
                  }}
                  className="absolute w-1 h-1 bg-purple-300 rounded-full"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                />
              ))}
            </div>
          )}

          {/* Sun Rays for Lunch */}
          {activeMenuSection === 'lunch' && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
              className="absolute top-[-200px] right-[-200px] w-[600px] h-[600px] opacity-10"
              style={{
                background: `conic-gradient(from 0deg, transparent, ${theme.accent}40, transparent, ${theme.accent}40, transparent)`,
              }}
            />
          )}

          {/* Grid Pattern */}
          <div 
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `
                linear-gradient(${theme.accent}30 1px, transparent 1px),
                linear-gradient(90deg, ${theme.accent}30 1px, transparent 1px)
              `,
              backgroundSize: '80px 80px',
            }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Floating Particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-10">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={`${activeMenuSection}-${i}`}
            animate={{
              y: [-20, -100, -20],
              x: [0, Math.random() * 40 - 20, 0],
              opacity: [0, 0.6, 0],
            }}
            transition={{
              duration: 4 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 5,
            }}
            className="absolute w-1 h-1 rounded-full"
            style={{
              backgroundColor: theme.particle,
              left: `${Math.random() * 100}%`,
              top: `${50 + Math.random() * 50}%`,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <motion.header 
        key={`header-${activeMenuSection}`}
        initial={{ opacity: 0.8 }}
        animate={{ opacity: 1 }}
        className="sticky top-0 z-50 backdrop-blur-xl border-b border-white/10"
      >
        <div 
          className="absolute inset-0"
          style={{ background: theme.header }}
        />
        <div className="relative max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { playClickSound(); setLocation(slug ? `/${slug}/welcome` : '/'); }}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 hover:bg-white/30 transition-all backdrop-blur-sm"
                style={{ border: '1px solid rgba(255,255,255,0.3)' }}
                data-testid="button-back"
              >
                <ArrowLeft className="h-5 w-5 text-white" />
                <span className="text-white text-sm font-medium">Back</span>
              </motion.button>
              <div className="flex items-center gap-3">
                {restaurant?.logoUrl ? (
                  <motion.img 
                    src={restaurant.logoUrl}
                    alt={restaurant.name}
                    animate={{ scale: [1, 1.02, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-12 h-12 rounded-full object-cover shadow-lg"
                    style={{ border: `2px solid ${theme.accent}` }}
                  />
                ) : (
                  <motion.div 
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-lg"
                    style={{ background: theme.button }}
                  >
                    <ThemeIcon className="w-6 h-6 text-white" />
                  </motion.div>
                )}
                <div>
                  <h1 className="text-xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                    {restaurant?.name || 'TAWA GRILL'}
                  </h1>
                  <p className="text-xs text-white/70">{theme.name}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Allergen Matrix Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { playClickSound(); setShowAllergenMatrix(true); }}
                className="flex items-center gap-2 px-4 py-3 rounded-full font-medium transition-all shadow-lg backdrop-blur-sm"
                style={{ 
                  background: 'rgba(255,255,255,0.15)',
                  border: '1px solid rgba(255,255,255,0.3)'
                }}
                data-testid="button-allergens"
              >
                <AlertTriangle className="h-5 w-5 text-yellow-300" />
                <span className="text-white text-sm hidden sm:inline">Allergens</span>
              </motion.button>

              {/* Book Table Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { playClickSound(); setShowBookingForm(true); }}
                className="flex items-center gap-2 px-4 py-3 rounded-full font-medium transition-all shadow-lg"
                style={{ 
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  boxShadow: '0 4px 20px rgba(16,185,129,0.4)'
                }}
                data-testid="button-booking"
              >
                <Calendar className="h-5 w-5 text-white" />
                <span className="text-white text-sm hidden sm:inline">Book Table</span>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Hero Banner */}
      <div className="relative z-20 py-10 px-4 text-center">
        <motion.div
          key={`hero-${activeMenuSection}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto"
        >
          <motion.div 
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="flex items-center justify-center gap-2 mb-4"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <ThemeIcon className="w-6 h-6" style={{ color: theme.accent }} />
            </motion.div>
            <span style={{ color: theme.accent }} className="text-sm tracking-widest uppercase font-medium">
              {theme.name}
            </span>
            <motion.div
              animate={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <ThemeIcon className="w-6 h-6" style={{ color: theme.accent }} />
            </motion.div>
          </motion.div>
          <h2 
            className="text-4xl md:text-5xl font-bold text-white mb-3"
            style={{ 
              fontFamily: "'Playfair Display', serif",
              textShadow: '0 4px 30px rgba(0,0,0,0.5)'
            }}
          >
            Order Online
          </h2>
          <p className="text-white/60 mb-8">{theme.tagline}</p>
          
          {/* Order Type Buttons */}
          <div className="flex justify-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { playClickSound(); setOrderType("delivery"); }}
              className={`px-8 py-4 rounded-2xl font-medium transition-all ${
                orderType === "delivery" ? "shadow-lg" : "bg-white/10 backdrop-blur-sm"
              }`}
              style={{ 
                background: orderType === "delivery" ? theme.button : undefined,
                boxShadow: orderType === "delivery" ? `0 4px 20px ${theme.buttonGlow}` : undefined,
                border: orderType !== "delivery" ? '1px solid rgba(255,255,255,0.2)' : undefined
              }}
              data-testid="button-delivery"
            >
              <span className={orderType === "delivery" ? "text-white" : "text-white/70"}>
                🚗 Delivery
              </span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { playClickSound(); setOrderType("pickup"); }}
              className={`px-8 py-4 rounded-2xl font-medium transition-all ${
                orderType === "pickup" ? "shadow-lg" : "bg-white/10 backdrop-blur-sm"
              }`}
              style={{ 
                background: orderType === "pickup" ? theme.button : undefined,
                boxShadow: orderType === "pickup" ? `0 4px 20px ${theme.buttonGlow}` : undefined,
                border: orderType !== "pickup" ? '1px solid rgba(255,255,255,0.2)' : undefined
              }}
              data-testid="button-pickup"
            >
              <span className={orderType === "pickup" ? "text-white" : "text-white/70"}>
                🏪 Collection
              </span>
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Search Bar + Cart Button */}
      <div className="relative z-20 max-w-2xl mx-auto px-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-white/50" />
            <Input
              placeholder="Search menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-14 h-14 rounded-2xl border-white/20 bg-white/10 backdrop-blur-xl text-white placeholder:text-white/50"
              style={{ 
                borderColor: `${theme.accent}40`,
              }}
              data-testid="input-search"
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { playClickSound(); setShowCart(true); }}
            className="relative h-14 px-4 rounded-2xl flex items-center gap-2 shrink-0 font-bold text-white"
            style={{
              background: theme.button,
              boxShadow: `0 4px 20px ${theme.buttonGlow}`,
            }}
            data-testid="button-cart-mobile"
          >
            <ShoppingBag className="h-5 w-5" />
            <span className="text-sm">{currencySymbol}{cartTotal.toFixed(2)}</span>
            {cart.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-600 text-white text-[10px] flex items-center justify-center">
                {cart.length}
              </span>
            )}
          </motion.button>
        </div>
      </div>

      {/* Menu Section Tabs - Each with unique styling */}
      <div className="relative z-20 max-w-6xl mx-auto px-4 mb-6">
        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
          {MENU_SECTIONS.map((section) => {
            const sectionTheme = SECTION_THEMES[section.id];
            const isActive = activeMenuSection === section.id;
            
            return (
              <motion.button
                key={section.id}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { 
                  playClickSound(); 
                  setActiveMenuSection(section.id);
                  setExpandedCategory(null);
                }}
                className="flex-shrink-0 px-8 py-5 rounded-2xl transition-all relative overflow-hidden"
                style={{ 
                  background: isActive ? sectionTheme.button : 'rgba(255,255,255,0.08)',
                  boxShadow: isActive ? `0 8px 30px ${sectionTheme.buttonGlow}` : undefined,
                  border: `2px solid ${isActive ? sectionTheme.accent : 'rgba(255,255,255,0.1)'}`
                }}
                data-testid={`section-${section.id}`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 rounded-2xl"
                    style={{ background: sectionTheme.button }}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <div className="relative z-10">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <span className="text-2xl">{section.timeIcon}</span>
                  </div>
                  <div className={`font-bold ${isActive ? 'text-white' : 'text-white/70'}`}>
                    {section.name}
                  </div>
                  <div className={`text-xs ${isActive ? 'text-white/80' : 'text-white/40'}`}>
                    {section.subtitle}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Categories & Menu Items */}
      <main className="relative z-20 max-w-6xl mx-auto px-4 py-6 pb-32">
        <AnimatePresence mode="wait">
          <motion.div 
            key={activeMenuSection}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {categories.map((category: any, catIdx: number) => {
              const items = getItemsForCategory(category.id);
              const isExpanded = expandedCategory === category.id;
              
              if (items.length === 0) return null;

              return (
                <motion.div 
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: catIdx * 0.05 }}
                  className="rounded-3xl overflow-hidden backdrop-blur-xl"
                  style={{ 
                    background: theme.cardBg,
                    border: `1px solid ${theme.cardBorder}`,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
                  }}
                >
                  <motion.button
                    whileHover={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                    onClick={() => { 
                      playClickSound(); 
                      setExpandedCategory(isExpanded ? null : category.id); 
                    }}
                    className="w-full flex items-center justify-between p-6 transition-all"
                    data-testid={`category-${category.id}`}
                  >
                    <div className="flex items-center gap-4">
                      <motion.div 
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl backdrop-blur-sm"
                        style={{ 
                          background: `${theme.accent}20`,
                          border: `1px solid ${theme.accent}40`
                        }}
                      >
                        {category.icon}
                      </motion.div>
                      <div className="text-left">
                        <h3 className="text-xl font-bold text-white">
                          {category.name}
                        </h3>
                        <p className="text-sm" style={{ color: theme.accent }}>
                          {items.length} items
                        </p>
                      </div>
                    </div>
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ background: `${theme.accent}30` }}
                    >
                      <ChevronDown className="h-6 w-6" style={{ color: theme.accent }} />
                    </motion.div>
                  </motion.button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t"
                        style={{ borderColor: theme.cardBorder }}
                      >
                        {items.map((item, index) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.03 }}
                            className={`flex items-center justify-between p-5 cursor-pointer transition-all hover:bg-white/5 ${
                              index < items.length - 1 ? 'border-b' : ''
                            }`}
                            style={{ borderColor: theme.cardBorder }}
                            onClick={() => { if (item.available) { quickAddToCart(item); } }}
                            data-testid={`item-${item.id}`}
                          >
                            <div className="flex-1 pr-4">
                              <div className="flex items-center gap-2">
                                <h4 className={`font-semibold text-white ${!item.available ? 'line-through opacity-50' : ''}`}>
                                  {item.name}
                                </h4>
                                {!item.available && (
                                  <Badge className="bg-red-500/80 text-white text-xs">Sold Out</Badge>
                                )}
                              </div>
                              {item.description && (
                                <p className="text-sm mt-1 text-white/50 line-clamp-2">{item.description}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="font-bold text-xl" style={{ color: theme.accent }}>
                                {currencySymbol}{parseFloat(item.price).toFixed(2)}
                              </span>
                              {item.available && (
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
                                  style={{ 
                                    background: theme.button,
                                    boxShadow: `0 4px 15px ${theme.buttonGlow}`
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    quickAddToCart(item);
                                  }}
                                  data-testid={`add-${item.id}`}
                                >
                                  <Plus className="h-6 w-6 text-white" />
                                </motion.button>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Beautiful Footer */}
      <footer className="relative z-20 mt-16 pb-32">
        <div 
          className="max-w-4xl mx-auto px-6 py-12 text-center rounded-3xl mx-4 backdrop-blur-xl"
          style={{ 
            background: theme.cardBg,
            border: `1px solid ${theme.cardBorder}`,
            boxShadow: '0 -10px 40px rgba(0,0,0,0.3)'
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-white/60 text-lg mb-2">Thank You for Choosing</p>
            
            {restaurant?.logoUrl && (
              <motion.img 
                src={restaurant.logoUrl}
                alt={restaurant.name}
                animate={{ scale: [1, 1.03, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="w-24 h-24 rounded-full object-cover shadow-lg mx-auto mb-4"
                style={{ border: `3px solid ${theme.accent}` }}
              />
            )}
            
            <h2 
              className="text-3xl md:text-4xl font-bold text-white mb-3"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {restaurant?.name || 'TAWA GRILL'}
            </h2>
            <p className="text-lg mb-8" style={{ color: theme.accent }}>
              Authentic {restaurant?.name || 'TAWA GRILL'} Cuisine - A Royal Experience
            </p>
            
            <div className="flex items-center justify-center gap-4 mb-6">
              <motion.div 
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="text-3xl"
              >
                👑
              </motion.div>
              <div className="h-px w-24" style={{ background: `linear-gradient(90deg, transparent, ${theme.accent}, transparent)` }} />
              <motion.div 
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-3xl"
              >
                🔥
              </motion.div>
              <div className="h-px w-24" style={{ background: `linear-gradient(90deg, transparent, ${theme.accent}, transparent)` }} />
              <motion.div 
                animate={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="text-3xl"
              >
                👑
              </motion.div>
            </div>

            <div className="border-t pt-6" style={{ borderColor: theme.cardBorder }}>
              <p className="text-white/50 text-sm mb-2">
                © 2026 {restaurant?.name || 'TAWA GRILL'}. All rights reserved.
              </p>
              <a 
                href="/terms"
                className="text-sm hover:underline transition-all"
                style={{ color: theme.accent }}
                onClick={() => { playClickSound(); }}
                data-testid="link-terms"
              >
                Terms & Conditions
              </a>
              
              {/* Back to Top Button */}
              <motion.button
                whileHover={{ scale: 1.1, y: -5 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => { 
                  playClickSound(); 
                  window.scrollTo({ top: 0, behavior: 'smooth' }); 
                }}
                className="mt-6 mx-auto flex flex-col items-center gap-2 px-6 py-3 rounded-2xl transition-all"
                style={{ 
                  background: theme.button,
                  boxShadow: `0 4px 20px ${theme.buttonGlow}`
                }}
                data-testid="button-back-to-top"
              >
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </motion.div>
                <span className="text-white text-sm font-medium">Back to Top</span>
              </motion.button>
            </div>
          </motion.div>
        </div>
      </footer>

      {/* Floating Cart Bar */}
      <AnimatePresence>
        {cart.length > 0 && !showCart && !showExtrasPopup && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 p-4 z-40"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => { 
                playClickSound(); 
                if (activeToppings.length > 0) {
                  setShowExtrasPopup(true);
                } else {
                  setShowCart(true);
                }
              }}
              className="w-full max-w-lg mx-auto flex items-center justify-between px-8 py-5 rounded-3xl shadow-2xl"
              style={{ 
                background: theme.button,
                boxShadow: `0 10px 40px ${theme.buttonGlow}`
              }}
              data-testid="floating-cart"
            >
              <div className="flex items-center gap-3">
                <ShoppingBag className="h-6 w-6 text-white" />
                <span className="text-white font-semibold">{cart.length} items</span>
              </div>
              <span className="text-white font-bold text-xl">
                View Cart • {currencySymbol}{cartTotal.toFixed(2)}
              </span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Extras Popup Dialog */}
      <AnimatePresence>
        {showExtrasPopup && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              className="absolute inset-0 bg-black/70 backdrop-blur-sm" 
              onClick={() => { setShowExtrasPopup(false); setTempSelectedExtras([]); }} 
            />
            <motion.div 
              initial={{ y: 50, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 50, opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg max-h-[85vh] overflow-hidden rounded-3xl shadow-2xl"
              style={{ 
                background: `linear-gradient(180deg, ${theme.accentDark} 0%, #1a1a2e 50%, #0f0f1a 100%)`,
                border: `2px solid ${theme.accent}40`
              }}
            >
              {/* Header */}
              <div 
                className="p-5 border-b"
                style={{ borderColor: `${theme.accent}30`, background: `${theme.accentDark}50` }}
              >
                <h2 className="text-xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Add Extras to Your Order?
                </h2>
                <p className="text-sm mt-1 text-white/60">Select any extras you'd like to add</p>
              </div>
              
              {/* Extras Grid */}
              <div className="max-h-[50vh] overflow-y-auto p-5">
                <div className="grid grid-cols-2 gap-3">
                  {activeToppings.map((topping: ExtraTopping) => (
                    <motion.button
                      key={topping.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setTempSelectedExtras(prev => 
                          prev.includes(topping.name) 
                            ? prev.filter(n => n !== topping.name)
                            : [...prev, topping.name]
                        );
                      }}
                      className="p-4 rounded-xl border-2 transition-all text-left"
                      style={{
                        background: tempSelectedExtras.includes(topping.name) 
                          ? `${theme.accent}20` 
                          : 'rgba(255,255,255,0.05)',
                        borderColor: tempSelectedExtras.includes(topping.name) 
                          ? theme.accent 
                          : `${theme.accent}30`
                      }}
                    >
                      <p className="font-medium text-sm text-white">{topping.name}</p>
                      <p className="text-xs mt-1" style={{ color: theme.accent }}>
                        +{currencySymbol}{Number(topping.price).toFixed(2)}
                      </p>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Selected Summary */}
              {tempSelectedExtras.length > 0 && (
                <div 
                  className="px-5 py-3 border-t"
                  style={{ borderColor: `${theme.accent}30`, background: `${theme.accent}15` }}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-white/70">{tempSelectedExtras.length} extra(s) selected</span>
                    <span className="font-bold" style={{ color: theme.accent }}>
                      +{currencySymbol}{tempSelectedExtras.reduce((sum, name) => {
                        const t = activeToppings.find((tp: ExtraTopping) => tp.name === name);
                        return sum + (t ? Number(t.price) : 0);
                      }, 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="p-5 border-t flex gap-3" style={{ borderColor: `${theme.accent}30` }}>
                <Button
                  variant="outline"
                  onClick={() => {
                    setTempSelectedExtras([]);
                    setShowExtrasPopup(false);
                    setShowCart(true);
                  }}
                  className="flex-1 py-6 text-white hover:bg-white/10"
                  style={{ borderColor: `${theme.accent}40` }}
                >
                  Skip
                </Button>
                <Button
                  onClick={() => {
                    // Add selected extras to cart as order-level extras
                    if (tempSelectedExtras.length > 0) {
                      const extrasTotal = tempSelectedExtras.reduce((sum, name) => {
                        const t = activeToppings.find((tp: ExtraTopping) => tp.name === name);
                        return sum + (t ? Number(t.price) : 0);
                      }, 0);
                      
                      const extrasCartItem: CartItem = {
                        menuItem: { 
                          id: '__extras__', 
                          name: 'Order Extras', 
                          price: "0", 
                          category: 'Extras', 
                          restaurantId: restaurant?.id || '',
                          description: tempSelectedExtras.join(', '),
                          available: true,
                          image: '',
                          videoUrl: null,
                          gifUrl: null,
                          allergenProfile: null,
                          createdAt: null
                        } as unknown as MenuItem,
                        quantity: 1,
                        selectedOptions: [],
                        totalPrice: extrasTotal,
                        notes: '',
                        extras: tempSelectedExtras.map(name => {
                          const t = activeToppings.find((tp: ExtraTopping) => tp.name === name);
                          return { name, price: t ? Number(t.price) : 0 };
                        }),
                        baseUnitPrice: extrasTotal
                      };
                      
                      // Check if order extras already exist and update, otherwise add
                      const existingExtrasIndex = cart.findIndex(item => item.menuItem.id === '__extras__' && item.menuItem.name === 'Order Extras');
                      if (existingExtrasIndex >= 0) {
                        const updatedCart = [...cart];
                        updatedCart[existingExtrasIndex] = extrasCartItem;
                        setCart(updatedCart);
                      } else {
                        setCart([...cart, extrasCartItem]);
                      }
                    }
                    
                    setTempSelectedExtras([]);
                    setShowExtrasPopup(false);
                    setShowCart(true);
                  }}
                  className="flex-1 py-6 font-bold text-white"
                  style={{ background: theme.button }}
                >
                  {tempSelectedExtras.length > 0 ? 'Continue with Extras' : 'View Cart'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Item Detail Popup */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          >
            <motion.div 
              className="absolute inset-0 bg-black/70 backdrop-blur-sm" 
              onClick={() => { playClickSound(); setSelectedItem(null); }} 
            />
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl shadow-2xl"
              style={{ 
                background: `linear-gradient(180deg, ${theme.accentDark}20 0%, rgba(17,24,39,0.98) 100%)`,
                border: `1px solid ${theme.cardBorder}`
              }}
            >
              <div 
                className="sticky top-0 flex items-center justify-between p-5 border-b z-10 backdrop-blur-xl"
                style={{ background: 'rgba(17,24,39,0.95)', borderColor: theme.cardBorder }}
              >
                <h2 className="text-xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {selectedItem.name}
                </h2>
                <button
                  onClick={() => { playClickSound(); setSelectedItem(null); }}
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"
                >
                  <X className="h-5 w-5 text-white" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {selectedItem.description && (
                  <p className="text-white/60">{selectedItem.description}</p>
                )}

                <div className="text-3xl font-bold" style={{ color: theme.accent }}>
                  {currencySymbol}{(parseFloat(selectedItem.price) + getSelectionExtrasTotal(selectedExtras) + getOptionGroupsPrice(String(selectedItem.id))).toFixed(2)}
                </div>

                {getGroupsForItem(String(selectedItem.id)).length > 0 && (
                  <div className="mb-4">
                    <OptionGroupSelector
                      groups={getGroupsForItem(String(selectedItem.id))}
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

                {getItemToppings(selectedItem.id).length > 0 && (
                  <div>
                    <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" style={{ color: theme.accent }} />
                      Extra Options
                    </h3>
                    <div className="space-y-2">
                      {getItemToppings(selectedItem.id).map((topping) => (
                        <label 
                          key={topping.id} 
                          className="flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all"
                          style={{ 
                            background: selectedExtras.includes(topping.name) 
                              ? `${theme.accent}20`
                              : 'rgba(255,255,255,0.05)',
                            border: `2px solid ${selectedExtras.includes(topping.name) ? theme.accent : 'transparent'}`
                          }}
                        >
                          <span className="text-white">{topping.name}</span>
                          <div className="flex items-center gap-3">
                            <span style={{ color: theme.accent }}>+{currencySymbol}{Number(topping.price).toFixed(2)}</span>
                            <input
                              type="checkbox"
                              checked={selectedExtras.includes(topping.name)}
                              onChange={() => toggleExtra(topping.name)}
                              className="w-5 h-5 rounded"
                              style={{ accentColor: theme.accent }}
                            />
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="font-semibold text-white mb-2">Special Instructions</h3>
                  <textarea
                    value={customNotes}
                    onChange={(e) => setCustomNotes(e.target.value)}
                    placeholder="Any special requests?"
                    className="w-full p-4 rounded-2xl border bg-white/5 text-white placeholder:text-white/40 resize-none focus:ring-0"
                    style={{ borderColor: theme.cardBorder }}
                    rows={2}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-medium text-white">Quantity</span>
                  <div className="flex items-center gap-4">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => { playClickSound(); setQuantity(Math.max(1, quantity - 1)); }}
                      className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"
                    >
                      <Minus className="h-5 w-5 text-white" />
                    </motion.button>
                    <span className="text-2xl font-bold text-white w-8 text-center">{quantity}</span>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => { playClickSound(); setQuantity(quantity + 1); }}
                      className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
                      style={{ background: theme.button }}
                    >
                      <Plus className="h-5 w-5 text-white" />
                    </motion.button>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddToCart}
                  className="w-full h-16 rounded-2xl font-bold text-lg text-white shadow-lg"
                  style={{ 
                    background: theme.button,
                    boxShadow: `0 8px 30px ${theme.buttonGlow}`
                  }}
                >
                  Add to Cart • {currencySymbol}{((parseFloat(selectedItem.price) + getSelectionExtrasTotal(selectedExtras) + getOptionGroupsPrice(String(selectedItem.id))) * quantity).toFixed(2)}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Sidebar */}
      <AnimatePresence>
        {showCart && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex justify-end"
          >
            <motion.div 
              className="absolute inset-0 bg-black/70 backdrop-blur-sm" 
              onClick={() => { playClickSound(); setShowCart(false); }} 
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30 }}
              className="relative w-full max-w-md h-full overflow-y-auto shadow-2xl"
              style={{ 
                background: 'linear-gradient(180deg, #1f2937 0%, #111827 100%)',
              }}
            >
              <div 
                className="sticky top-0 flex items-center justify-between p-5 z-10"
                style={{ background: theme.header }}
              >
                <h2 className="text-xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Your Order
                </h2>
                <button
                  onClick={() => { playClickSound(); setShowCart(false); }}
                  className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-all"
                >
                  <X className="h-5 w-5 text-white" />
                </button>
              </div>

              <div className="p-5">
                {cart.length === 0 ? (
                  <div className="text-center py-16">
                    <ShoppingBag className="h-20 w-20 mx-auto mb-4 text-white/20" />
                    <p className="text-white/50">Your cart is empty</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4 mb-6">
                      {cart.map((item, index) => (
                        <motion.div 
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 rounded-2xl"
                          style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}
                        >
                          <div className="flex items-start gap-4">
                            <div className="flex-1">
                              <h4 className="font-semibold text-white">{item.menuItem.name}</h4>
                              {item.extras.length > 0 && (
                                <p className="text-sm mt-1" style={{ color: `${theme.accent}cc` }}>
                                  + {item.extras.map(e => e.name).join(", ")}
                                </p>
                              )}
                              {item.notes && (
                                <p className="text-sm italic mt-1 text-white/50">"{item.notes}"</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => updateCartQuantity(index, item.quantity - 1)}
                                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"
                              >
                                <Minus className="h-4 w-4 text-white" />
                              </button>
                              <span className="font-semibold text-white w-6 text-center">{item.quantity}</span>
                              <button
                                onClick={() => updateCartQuantity(index, item.quantity + 1)}
                                className="w-8 h-8 rounded-full flex items-center justify-center"
                                style={{ background: theme.button }}
                              >
                                <Plus className="h-4 w-4 text-white" />
                              </button>
                            </div>
                            <span className="font-bold" style={{ color: theme.accent }}>
                              {currencySymbol}{item.totalPrice.toFixed(2)}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    <div className="mb-6">
                      <div className="flex gap-2">
                        <button
                          onClick={() => { playClickSound(); setOrderType("delivery"); }}
                          className="flex-1 py-4 rounded-2xl font-medium transition-all"
                          style={{ 
                            background: orderType === "delivery" ? theme.button : 'rgba(255,255,255,0.05)',
                            border: orderType !== "delivery" ? `1px solid ${theme.cardBorder}` : undefined
                          }}
                        >
                          <span className={orderType === "delivery" ? "text-white" : "text-white/60"}>
                            🚗 Delivery
                          </span>
                        </button>
                        <button
                          onClick={() => { playClickSound(); setOrderType("pickup"); }}
                          className="flex-1 py-4 rounded-2xl font-medium transition-all"
                          style={{ 
                            background: orderType === "pickup" ? theme.button : 'rgba(255,255,255,0.05)',
                            border: orderType !== "pickup" ? `1px solid ${theme.cardBorder}` : undefined
                          }}
                        >
                          <span className={orderType === "pickup" ? "text-white" : "text-white/60"}>
                            🏪 Collection
                          </span>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3 mb-6">
                      <Input
                        placeholder="Your Name"
                        value={checkoutName}
                        onChange={(e) => setCheckoutName(e.target.value)}
                        className="h-14 rounded-2xl bg-white/5 text-white placeholder:text-white/40"
                        style={{ borderColor: theme.cardBorder }}
                      />
                      <div className="flex gap-2">
                        <select
                          value={phoneCountryCode}
                          onChange={(e) => setPhoneCountryCode(e.target.value)}
                          className="h-14 px-3 rounded-2xl bg-white/5 text-white"
                          style={{ borderColor: theme.cardBorder, border: `1px solid ${theme.cardBorder}` }}
                        >
                          <option value="+44">🇬🇧 +44</option>
                          <option value="+1">🇺🇸 +1</option>
                          <option value="+92">🇵🇰 +92</option>
                          <option value="+91">🇮🇳 +91</option>
                          <option value="+971">🇦🇪 +971</option>
                        </select>
                        <Input
                          placeholder="Phone Number"
                          value={checkoutPhone}
                          onChange={(e) => setCheckoutPhone(e.target.value)}
                          className="flex-1 h-14 rounded-2xl bg-white/5 text-white placeholder:text-white/40"
                          style={{ borderColor: theme.cardBorder }}
                        />
                      </div>
                      {orderType === "delivery" && (
                        <Input
                          placeholder="Delivery Address"
                          value={deliveryAddress}
                          onChange={(e) => setDeliveryAddress(e.target.value)}
                          className="h-14 rounded-2xl bg-white/5 text-white placeholder:text-white/40"
                          style={{ borderColor: theme.cardBorder }}
                        />
                      )}
                    </div>

                    <div className="flex items-center justify-between py-5 border-t border-b mb-4" style={{ borderColor: theme.cardBorder }}>
                      <span className="font-semibold text-lg text-white">Total</span>
                      <span className="font-bold text-3xl" style={{ color: theme.accent }}>
                        {currencySymbol}{cartTotal.toFixed(2)}
                      </span>
                    </div>

                    {/* Payment Method */}
                    <div className="mb-4">
                      <p className="text-white/70 text-sm mb-3">Payment Method</p>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => setPaymentMethod("cash")}
                          className={`py-4 rounded-2xl font-medium flex items-center justify-center gap-2 transition-all ${paymentMethod === "cash" ? "text-white" : "text-white/70"}`}
                          style={{ background: paymentMethod === "cash" ? theme.button : 'rgba(255,255,255,0.05)', border: paymentMethod !== "cash" ? `1px solid ${theme.cardBorder}` : undefined }}
                        >
                          <Banknote className="h-5 w-5" /> Cash
                        </button>
                        {hasStripeKeys && (
                        <button
                          onClick={() => setPaymentMethod("card")}
                          className={`py-4 rounded-2xl font-medium flex items-center justify-center gap-2 transition-all ${paymentMethod === "card" ? "text-white" : "text-white/70"}`}
                          style={{ background: paymentMethod === "card" ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : 'rgba(255,255,255,0.05)', border: paymentMethod !== "card" ? `1px solid ${theme.cardBorder}` : undefined }}
                        >
                          <CreditCard className="h-5 w-5" /> Card
                        </button>
                        )}
                        {((restaurant as any)?.bankTransferEnabled && (restaurant?.bankAccountName || (restaurant as any)?.easypaisaAccountNumber || (restaurant as any)?.jazzcashAccountNumber)) && (
                        <button
                          onClick={() => setPaymentMethod("bank_transfer" as any)}
                          className={`py-4 rounded-2xl font-medium flex items-center justify-center gap-2 transition-all ${paymentMethod === ("bank_transfer" as any) ? "text-white" : "text-white/70"}`}
                          style={{ background: paymentMethod === ("bank_transfer" as any) ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' : 'rgba(255,255,255,0.05)', border: paymentMethod !== ("bank_transfer" as any) ? `1px solid ${theme.cardBorder}` : undefined }}
                        >
                          <Building className="h-5 w-5" /> Bank
                        </button>
                        )}
                      </div>
                    </div>

                    {paymentMethod === ("bank_transfer" as any) && restaurant?.bankTransferEnabled && (
                      <div className="mt-4 p-4 rounded-2xl border border-purple-500/30 bg-purple-500/10">
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
                          qrParams.set('amount', cartTotal.toFixed(2));
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
                      <Elements stripe={stripePromise}>
                        <CardPaymentForm
                          amount={cartTotal}
                          restaurantId={restaurant?.id || ""}
                          validateBeforePayment={() => {
                            if (!checkoutName || !checkoutPhone) return "Please enter your name and phone number";
                            if (orderType === "delivery" && !deliveryAddress) return "Please enter your delivery address";
                            return null;
                          }}
                          onPaymentSuccess={(paymentIntentId) => {
                            const orderItems = cart.map(c => ({ name: c.menuItem.name, quantity: c.quantity, price: (c.totalPrice / c.quantity).toFixed(2), notes: c.notes || null }));
                            createOrderMutation.mutate({
                              order: { restaurantId: restaurant!.id, customerName: checkoutName, phone: phoneCountryCode + checkoutPhone, address: orderType === "delivery" ? deliveryAddress : undefined, type: orderType === "pickup" ? "takeaway" : "delivery", status: "new" as const, total: cartTotal.toFixed(2), paymentMethod: "card", paymentIntentId },
                              items: orderItems,
                            });
                          }}
                          onPaymentError={(error) => toast({ title: "Payment Failed", description: error, variant: "destructive" })}
                          isProcessing={isProcessingPayment}
                          setIsProcessing={setIsProcessingPayment}
                        />
                      </Elements>
                    ) : paymentMethod === "card" ? (
                      <div className="text-center text-white/60 py-4">Loading card payment...</div>
                    ) : (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          if (!checkoutName || !checkoutPhone) {
                            toast({ title: "Required Fields", description: "Please enter your name and phone number", variant: "destructive" });
                            return;
                          }
                          if (orderType === "delivery" && !deliveryAddress) {
                            toast({ title: "Address Required", description: "Please enter your delivery address", variant: "destructive" });
                            return;
                          }
                          handlePlaceOrder();
                        }}
                        disabled={createOrderMutation.isPending}
                        className="w-full h-16 rounded-2xl font-bold text-lg text-white shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                        style={{ 
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          boxShadow: '0 8px 30px rgba(16,185,129,0.4)'
                        }}
                      >
                        {createOrderMutation.isPending ? <><Loader2 className="h-5 w-5 animate-spin" /> Placing Order...</> : <><Banknote className="h-5 w-5" /> Pay Cash - {currencySymbol}{cartTotal.toFixed(2)}</>}
                      </motion.button>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Allergen Matrix Modal */}
      <AnimatePresence>
        {showAllergenMatrix && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
              onClick={() => { playClickSound(); setShowAllergenMatrix(false); }} 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-5xl max-h-[85vh] overflow-hidden rounded-3xl shadow-2xl"
              style={{ 
                background: 'linear-gradient(180deg, #1f2937 0%, #111827 100%)',
                border: `1px solid ${theme.cardBorder}`
              }}
            >
              <div 
                className="sticky top-0 flex items-center justify-between p-5 border-b z-10"
                style={{ background: theme.header, borderColor: theme.cardBorder }}
              >
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-6 w-6 text-yellow-300" />
                  <h2 className="text-xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                    Allergen Matrix
                  </h2>
                </div>
                <button
                  onClick={() => { playClickSound(); setShowAllergenMatrix(false); }}
                  className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-all"
                >
                  <X className="h-5 w-5 text-white" />
                </button>
              </div>

              <div className="p-5 overflow-auto max-h-[calc(85vh-80px)]">
                {/* Legend */}
                <div className="flex flex-wrap gap-4 mb-6 p-4 rounded-xl" style={{ background: theme.cardBg }}>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-white/80 text-sm">Contains Allergen</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center">
                      <span className="text-white text-xs">?</span>
                    </div>
                    <span className="text-white/80 text-sm">May Contain</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-white/80 text-sm">Free From</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gray-500 flex items-center justify-center">
                      <span className="text-white text-xs">-</span>
                    </div>
                    <span className="text-white/80 text-sm">Unknown</span>
                  </div>
                </div>

                {/* Matrix Table */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b" style={{ borderColor: theme.cardBorder }}>
                        <th className="p-3 text-left font-medium text-white sticky left-0" style={{ background: '#1f2937' }}>
                          Menu Item
                        </th>
                        {ALLERGEN_KEYS.map(allergen => (
                          <th key={allergen} className="p-2 text-center font-medium text-white/80 text-xs whitespace-nowrap">
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-lg">{ALLERGEN_ICONS[allergen]}</span>
                              <span className="capitalize text-[10px]">{allergen}</span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {menuItems.filter(item => item.available).map((item, index) => (
                        <tr 
                          key={item.id} 
                          className="border-b hover:bg-white/5 transition-colors"
                          style={{ borderColor: theme.cardBorder }}
                        >
                          <td className="p-3 text-white font-medium sticky left-0 text-sm" style={{ background: '#1f2937' }}>
                            {item.name}
                          </td>
                          {ALLERGEN_KEYS.map(allergen => {
                            const profile = (item as any).allergenProfile as Record<string, string> | undefined;
                            const status = profile?.[allergen] || "unknown";
                            
                            return (
                              <td key={allergen} className="p-2 text-center">
                                <div className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center text-white text-xs ${
                                  status === "contains" ? "bg-red-500" :
                                  status === "may_contain" ? "bg-yellow-500" :
                                  status === "free" ? "bg-green-500" :
                                  "bg-gray-600"
                                }`}>
                                  {status === "contains" && <Check className="w-4 h-4" />}
                                  {status === "may_contain" && "?"}
                                  {status === "free" && <Check className="w-4 h-4" />}
                                  {status === "unknown" && "-"}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {menuItems.length === 0 && (
                  <div className="text-center py-12 text-white/50">
                    <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No menu items available</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Booking Form Modal */}
      <AnimatePresence>
        {showBookingForm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
              onClick={() => { playClickSound(); setShowBookingForm(false); setBookingSuccess(false); }} 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl"
              style={{ 
                background: 'linear-gradient(180deg, #1f2937 0%, #111827 100%)',
                border: `1px solid ${theme.cardBorder}`
              }}
            >
              <div 
                className="sticky top-0 flex items-center justify-between p-5 border-b z-10"
                style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', borderColor: theme.cardBorder }}
              >
                <div className="flex items-center gap-3">
                  <Calendar className="h-6 w-6 text-white" />
                  <h2 className="text-xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                    Book a Table
                  </h2>
                </div>
                <button
                  onClick={() => { playClickSound(); setShowBookingForm(false); setBookingSuccess(false); }}
                  className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-all"
                >
                  <X className="h-5 w-5 text-white" />
                </button>
              </div>

              <div className="p-6">
                {bookingSuccess ? (
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center py-8"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.5 }}
                      className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500 flex items-center justify-center"
                    >
                      <Check className="w-10 h-10 text-white" />
                    </motion.div>
                    <h3 className="text-2xl font-bold text-white mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
                      Booking Confirmed!
                    </h3>
                    <p className="text-white/60 mb-6">
                      Thank you for your reservation. We'll see you soon!
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => { playClickSound(); setShowBookingForm(false); setBookingSuccess(false); }}
                      className="px-8 py-4 rounded-2xl font-medium text-white shadow-lg"
                      style={{ background: theme.button }}
                    >
                      Close
                    </motion.button>
                  </motion.div>
                ) : (
                  <div className="space-y-5">
                    <div>
                      <label className="block text-white/70 text-sm mb-2">Your Name *</label>
                      <Input
                        placeholder="John Smith"
                        value={bookingName}
                        onChange={(e) => setBookingName(e.target.value)}
                        className="h-14 rounded-2xl bg-white/5 text-white placeholder:text-white/40"
                        style={{ borderColor: theme.cardBorder }}
                        data-testid="booking-name"
                      />
                    </div>

                    <div>
                      <label className="block text-white/70 text-sm mb-2">Email *</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
                        <Input
                          type="email"
                          placeholder="your@email.com"
                          value={bookingEmail}
                          onChange={(e) => setBookingEmail(e.target.value)}
                          className="h-14 pl-12 rounded-2xl bg-white/5 text-white placeholder:text-white/40"
                          style={{ borderColor: theme.cardBorder }}
                          data-testid="booking-email"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-white/70 text-sm mb-2">Phone Number *</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
                        <Input
                          type="tel"
                          placeholder="+44 7123 456789"
                          value={bookingPhone}
                          onChange={(e) => setBookingPhone(e.target.value)}
                          className="h-14 pl-12 rounded-2xl bg-white/5 text-white placeholder:text-white/40"
                          style={{ borderColor: theme.cardBorder }}
                          data-testid="booking-phone"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-white/70 text-sm mb-2">Date *</label>
                        <div className="relative">
                          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
                          <Input
                            type="date"
                            value={bookingDate}
                            onChange={(e) => setBookingDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="h-14 pl-12 rounded-2xl bg-white/5 text-white placeholder:text-white/40"
                            style={{ borderColor: theme.cardBorder }}
                            data-testid="booking-date"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-white/70 text-sm mb-2">Time *</label>
                        <div className="relative">
                          <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
                          <Input
                            type="time"
                            value={bookingTime}
                            onChange={(e) => setBookingTime(e.target.value)}
                            className="h-14 pl-12 rounded-2xl bg-white/5 text-white placeholder:text-white/40"
                            style={{ borderColor: theme.cardBorder }}
                            data-testid="booking-time"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-white/70 text-sm mb-2">Adults *</label>
                      <div className="flex items-center gap-4">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => { playClickSound(); setBookingGuests(Math.max(1, bookingGuests - 1)); }}
                          className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"
                        >
                          <Minus className="h-5 w-5 text-white" />
                        </motion.button>
                        <div className="flex-1 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Users className="h-5 w-5" style={{ color: theme.accent }} />
                            <span className="text-2xl font-bold text-white">{bookingGuests}</span>
                          </div>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => { playClickSound(); setBookingGuests(Math.min(20, bookingGuests + 1)); }}
                          className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
                          style={{ background: theme.button }}
                        >
                          <Plus className="h-5 w-5 text-white" />
                        </motion.button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-white/70 text-sm mb-2">Kids (2-12 yrs)</label>
                        <div className="flex items-center gap-3">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => { playClickSound(); setBookingKids(Math.max(0, bookingKids - 1)); }}
                            className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"
                          >
                            <Minus className="h-4 w-4 text-white" />
                          </motion.button>
                          <div className="flex-1 text-center">
                            <span className="text-xl font-bold text-white">👧 {bookingKids}</span>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => { playClickSound(); setBookingKids(Math.min(10, bookingKids + 1)); }}
                            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
                            style={{ background: theme.button }}
                          >
                            <Plus className="h-4 w-4 text-white" />
                          </motion.button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-white/70 text-sm mb-2">Infants (0-2 yrs)</label>
                        <div className="flex items-center gap-3">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => { playClickSound(); setBookingInfants(Math.max(0, bookingInfants - 1)); }}
                            className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"
                          >
                            <Minus className="h-4 w-4 text-white" />
                          </motion.button>
                          <div className="flex-1 text-center">
                            <span className="text-xl font-bold text-white">👶 {bookingInfants}</span>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => { playClickSound(); setBookingInfants(Math.min(5, bookingInfants + 1)); }}
                            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
                            style={{ background: theme.button }}
                          >
                            <Plus className="h-4 w-4 text-white" />
                          </motion.button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-white/70 text-sm mb-2">♿ Special Assistance / Accessibility Needs</label>
                      <textarea
                        value={bookingSpecialRequests}
                        onChange={(e) => setBookingSpecialRequests(e.target.value)}
                        placeholder="e.g., Wheelchair access, high chair needed, dietary requirements, etc."
                        className="w-full p-4 rounded-2xl border bg-white/5 text-white placeholder:text-white/40 resize-none focus:ring-0"
                        style={{ borderColor: theme.cardBorder }}
                        rows={3}
                        data-testid="booking-requests"
                      />
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleBooking}
                      disabled={createBookingMutation.isPending}
                      className="w-full h-16 rounded-2xl font-bold text-lg text-white shadow-lg disabled:opacity-50"
                      style={{ 
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        boxShadow: '0 8px 30px rgba(16,185,129,0.4)'
                      }}
                      data-testid="booking-submit"
                    >
                      {createBookingMutation.isPending ? "Booking..." : "Confirm Booking"}
                    </motion.button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&display=swap');
      `}</style>
    </div>
  );
}
