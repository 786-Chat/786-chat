import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { useSubdomainSlug } from "@/App";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, ShoppingBag, Plus, Minus, X, Search, 
  AlertTriangle, Calendar, Trash2, ChevronRight, ChevronUp,
  Home, Phone, Clock, MapPin, Loader2, User, Banknote, CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { getRestaurantBySlug, getMenuItems, createBooking, getToppingGroups, createPaymentIntent } from "@/lib/api";
import { getCurrencySymbol, type MenuItem as MenuItemType, type ToppingGroupWithOptions, ALLERGEN_KEYS, type AllergenKey, type Customer } from "@shared/schema";
import { OptionGroupSelector } from "@/components/option-group-selector";
import { Check } from "lucide-react";
import { LoginPopup } from "@/components/login-popup";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

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
  sulphites: "🍷",
  lupin: "🌸",
  molluscs: "🦪"
};

const HELLO_MUMBAI_CATEGORIES = [
  { id: "vegetarian-starters", name: "Vegetarian Starters", gradient: "from-orange-500 via-red-500 to-pink-500", icon: "🥗" },
  { id: "non-veg-starters", name: "Non-Veg Starters", gradient: "from-red-600 via-rose-500 to-pink-400", icon: "🍗" },
  { id: "momos", name: "Momos", gradient: "from-blue-500 via-purple-500 to-pink-500", icon: "🥟" },
  { id: "soup", name: "Soup", gradient: "from-green-500 via-teal-500 to-cyan-500", icon: "🍜" },
  { id: "indo-chinese-taster", name: "Indo-Chinese Taster", gradient: "from-yellow-500 via-orange-500 to-red-500", icon: "🥡" },
  { id: "mumbai-ki-chaat", name: "Mumbai Ki Chaat", gradient: "from-amber-500 via-yellow-500 to-orange-400", icon: "🍲" },
  { id: "seafood", name: "Seafood", gradient: "from-cyan-500 via-blue-500 to-indigo-500", icon: "🦐" },
  { id: "indo-chinese-non-veg", name: "Indo-Chinese Non-Veg", gradient: "from-rose-500 via-red-500 to-orange-500", icon: "🍖" },
  { id: "veg-main-course", name: "Veg Main Course", gradient: "from-emerald-500 via-green-500 to-teal-500", icon: "🥘" },
  { id: "non-veg-main-course", name: "Non-Veg Main Course", gradient: "from-red-500 via-pink-500 to-purple-500", icon: "🍛" },
  { id: "vegan-starters", name: "Vegan Starters", gradient: "from-lime-500 via-green-500 to-emerald-500", icon: "🥬" },
  { id: "vegan-main-course", name: "Vegan Main Course", gradient: "from-green-600 via-emerald-500 to-teal-400", icon: "🥦" },
  { id: "vegan-rice-noodles-breads", name: "Vegan Rice Noodles Breads", gradient: "from-teal-500 via-cyan-500 to-blue-500", icon: "🍚" },
  { id: "biryani", name: "Biryani", gradient: "from-amber-600 via-yellow-500 to-orange-500", icon: "🍚" },
  { id: "breads", name: "Breads", gradient: "from-orange-400 via-amber-500 to-yellow-500", icon: "🫓" },
  { id: "kids-menu", name: "Kid's Menu", gradient: "from-pink-500 via-purple-500 to-indigo-500", icon: "👶" },
  { id: "rice-noodles", name: "Rice & Noodles", gradient: "from-yellow-400 via-amber-500 to-orange-400", icon: "🍝" },
  { id: "accompaniments", name: "Accompaniments", gradient: "from-slate-500 via-gray-500 to-zinc-500", icon: "🧄" },
  { id: "salads", name: "Salads", gradient: "from-green-400 via-lime-500 to-yellow-500", icon: "🥗" },
  { id: "desserts", name: "Desserts", gradient: "from-pink-400 via-rose-500 to-red-400", icon: "🍨" },
  { id: "drinks", name: "Drinks", gradient: "from-blue-400 via-cyan-500 to-teal-400", icon: "🥤" },
];

const CATEGORY_ICONS: Record<string, string> = {
  "starters": "🍽️",
  "vegetarian-starters": "🥗",
  "non-veg-starters": "🍗",
  "vegan-starters": "🥬",
  "momos": "🥟",
  "soup": "🍜",
  "indo-chinese-taster": "🥡",
  "mumbai-ki-chaat": "🍲",
  "seafood": "🦐",
  "indo-chinese-non-veg": "🍖",
  "veg-main-course": "🥘",
  "non-veg-main-course": "🍛",
  "vegan-main-course": "🥦",
  "vegan-rice-noodles-breads": "🍚",
  "biryani": "🍚",
  "breads": "🫓",
  "kids-menu": "👶",
  "rice-noodles": "🍝",
  "accompaniments": "🧄",
  "salads": "🥗",
  "desserts": "🍨",
  "drinks": "🥤",
  "pizza": "🍕",
  "peri-peri": "🌶️",
  "chicken": "🍗",
  "burgers": "🍔",
  "wraps": "🌯",
  "sides": "🍟",
  "meals": "🍱",
  "combos": "🎁",
  "specials": "⭐",
  "pizza-12-large": "🍕",
  "grilled-chicken": "🍗",
  "grilled-burger-and-wraps": "🍔",
  "emparo-fried-chicken": "🍗",
  "emparo-collection-special": "⭐",
  "emparo-peri-peri": "🌶️",
  "platters": "🍱",
  "meal-deals": "🎁",
  "dips": "🥣",
  "emparo-shakes": "🥤",
  "shakes": "🥤",
  "fried-chicken": "🍗",
  "default": "🍽️"
};

interface CartItem extends MenuItemType {
  quantity: number;
  selectedExtras?: { name: string; price: number }[];
}

interface ToppingGroup {
  id: string;
  menu_item_id?: string;
  menuItemId?: string | null;
  headline: string;
  is_required?: boolean;
  isRequired?: boolean | null;
  max_selections?: number;
  maxSelections?: number | null;
}

interface ToppingOption {
  id: string;
  group_id: string;
  name: string;
  price: string;
}

interface CardPaymentFormProps {
  amount: number;
  restaurantId: string;
  onPaymentSuccess: (paymentIntentId: string) => void;
  onPaymentError: (error: string) => void;
  isProcessing: boolean;
  setIsProcessing: (v: boolean) => void;
  children: React.ReactNode;
  validateBeforePayment?: () => string | null;
}

const FastInput = memo(function FastInput({ 
  value, 
  onChange, 
  placeholder, 
  className,
  type = "text",
  autoComplete,
  inputMode
}: { 
  value: string; 
  onChange: (v: string) => void; 
  placeholder?: string; 
  className?: string;
  type?: string;
  autoComplete?: string;
  inputMode?: "text" | "tel" | "email" | "numeric";
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoComplete={autoComplete}
      inputMode={inputMode}
      className={`flex h-10 w-full rounded-md border px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${className}`}
    />
  );
});

function CardPaymentForm({ amount, restaurantId, onPaymentSuccess, onPaymentError, isProcessing, setIsProcessing, children, validateBeforePayment }: CardPaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateBeforePayment) {
      const validationError = validateBeforePayment();
      if (validationError) {
        onPaymentError(validationError);
        return;
      }
    }
    
    if (!stripe || !elements) {
      onPaymentError("Payment system not ready. Please try again.");
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      onPaymentError("Card element not found");
      return;
    }

    setIsProcessing(true);

    try {
      const { clientSecret, paymentIntentId } = await createPaymentIntent(amount, restaurantId);

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (error) {
        onPaymentError(error.message || "Payment failed");
        setIsProcessing(false);
      } else if (paymentIntent?.status === "succeeded" || paymentIntent?.status === "requires_capture") {
        onPaymentSuccess(paymentIntentId);
      } else {
        onPaymentError("Payment was not completed");
        setIsProcessing(false);
      }
    } catch (err: any) {
      onPaymentError(err.message || "Payment failed");
      setIsProcessing(false);
    }
  };

  const cardElementOptions = {
    hidePostalCode: true,
    disableLink: true,
    style: {
      base: {
        fontSize: '16px',
        color: '#ffffff',
        '::placeholder': {
          color: 'rgba(255,255,255,0.5)',
        },
      },
      invalid: {
        color: '#ef4444',
      },
    },
  };

  return (
    <form onSubmit={handleSubmit}>
      {children}
      <div className="p-3 rounded-lg bg-white/10 border border-white/20 mt-4">
        <label className="text-sm text-white/60 mb-2 block">Card Details</label>
        <CardElement options={cardElementOptions} />
      </div>
      <Button
        type="submit"
        className="w-full py-6 text-lg font-bold rounded-xl mt-4"
        style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}
        disabled={isProcessing || !stripe}
      >
        {isProcessing ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <span className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Pay Now - £{amount.toFixed(2)}
          </span>
        )}
      </Button>
    </form>
  );
}

function ItemDetailWithToppings({ 
  item, 
  currencySymbol, 
  toppingGroups,
  toppingOptions,
  onAddToCart, 
  onClose 
}: { 
  item: MenuItemType; 
  currencySymbol: string;
  toppingGroups: ToppingGroupWithOptions[];
  toppingOptions: ToppingOption[];
  onAddToCart: (item: MenuItemType, extras?: { name: string; price: number }[]) => void; 
  onClose: () => void;
}) {
  const [optionGroupSelections, setOptionGroupSelections] = useState<Record<string, string[]>>({});
  const [optionGroupQuantities, setOptionGroupQuantities] = useState<Record<string, Record<string, number>>>({});

  // Filter groups for this item
  const itemToppingGroups = toppingGroups.filter(g => 
    String((g as any).menu_item_id || g.menuItemId) === String(item.id)
  );

  // Calculate total with option groups
  const getTotal = () => {
    let total = parseFloat(item.price);
    itemToppingGroups.forEach(group => {
      const allowQuantity = (group as any).allowQuantity;
      if (allowQuantity) {
        const groupQuantities = optionGroupQuantities[group.id] || {};
        Object.entries(groupQuantities).forEach(([optionId, qty]) => {
          const option = group.options.find(o => o.id === optionId);
          if (option && qty > 0) total += Number(option.price) * qty;
        });
      } else {
        const selections = optionGroupSelections[group.id] || [];
        selections.forEach(optionId => {
          const option = group.options.find(o => o.id === optionId);
          if (option) total += Number(option.price);
        });
      }
    });
    return total;
  };

  const handleAddToCart = () => {
    const extras: { name: string; price: number }[] = [];
    itemToppingGroups.forEach(group => {
      const allowQuantity = (group as any).allowQuantity;
      if (allowQuantity) {
        const groupQuantities = optionGroupQuantities[group.id] || {};
        Object.entries(groupQuantities).forEach(([optionId, qty]) => {
          const option = group.options.find(o => o.id === optionId);
          if (option && qty > 0) {
            for (let i = 0; i < qty; i++) {
              extras.push({ name: option.name, price: Number(option.price) });
            }
          }
        });
      } else {
        const selections = optionGroupSelections[group.id] || [];
        selections.forEach(optionId => {
          const option = group.options.find(o => o.id === optionId);
          if (option) extras.push({ name: option.name, price: Number(option.price) });
        });
      }
    });
    onAddToCart(item, extras);
    onClose();
  };

  return (
    <>
      <div className="relative h-48 -mx-6 -mt-6 mb-4 overflow-hidden rounded-t-lg">
        <img
          src={item.image || 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600'}
          alt={item.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
      </div>
      <DialogHeader>
        <DialogTitle className="text-2xl font-bold">{item.name}</DialogTitle>
      </DialogHeader>
      <p className="text-white/70">{item.description}</p>
      <p className="text-xl font-bold text-green-400 mt-2">{currencySymbol}{item.price}</p>
      
      {/* Option Group Selector */}
      {itemToppingGroups.length > 0 && (
        <div className="mt-4">
          <OptionGroupSelector
            groups={itemToppingGroups}
            selections={optionGroupSelections}
            quantities={optionGroupQuantities}
            onSelectionChange={(groupId, optionIds) => {
              setOptionGroupSelections(prev => ({ ...prev, [groupId]: optionIds }));
            }}
            onQuantityChange={(groupId, optionId, quantity) => {
              setOptionGroupQuantities(prev => ({
                ...prev,
                [groupId]: { ...(prev[groupId] || {}), [optionId]: quantity }
              }));
            }}
            currencySymbol={currencySymbol}
          />
        </div>
      )}

      <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
        <div>
          <span className="text-sm text-white/60">Total</span>
          <p className="text-2xl font-bold text-green-400">{currencySymbol}{getTotal().toFixed(2)}</p>
        </div>
        <Button
          onClick={handleAddToCart}
          className="px-8 py-3 rounded-full font-bold"
          style={{ background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' }}
        >
          Add to Basket
        </Button>
      </div>
    </>
  );
}

export default function HelloMumbaiMenu() {
  const [, navigate] = useLocation();
  const params = useParams<{ slug: string }>();
  const slug = params.slug || "hello-mumbai";
  const { toast } = useToast();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<MenuItemType | null>(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAllergens, setShowAllergens] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const [orderType, setOrderType] = useState<'delivery' | 'collection'>('delivery');
  const [showCheckout, setShowCheckout] = useState(false);
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerPostcode, setCustomerPostcode] = useState("");
  const [showBooking, setShowBooking] = useState(false);
  const [bookingName, setBookingName] = useState("");
  const [bookingEmail, setBookingEmail] = useState("");
  const [bookingPhone, setBookingPhone] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [bookingAdults, setBookingAdults] = useState(2);
  const [bookingKids, setBookingKids] = useState(0);
  const [bookingInfants, setBookingInfants] = useState(0);
  const [bookingSpecialRequests, setBookingSpecialRequests] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [stripePaymentIntentId, setStripePaymentIntentId] = useState<string | null>(null);

  const { data: restaurant, isLoading: restaurantLoading } = useQuery({
    queryKey: ["/api/restaurants/slug", slug],
    queryFn: () => getRestaurantBySlug(slug),
  });

  // Use React Query like Kebabish menu - proven to work in production
  const { data: menuItems = [], isLoading: menuLoading } = useQuery<MenuItemType[]>({
    queryKey: ["/api/menu", restaurant?.id],
    queryFn: async () => {
      if (!restaurant?.id) return [];
      return getMenuItems(restaurant.id);
    },
    enabled: !!restaurant?.id,
  });

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<any[]>({
    queryKey: ["/api/menu-categories", restaurant?.id],
    queryFn: async () => {
      if (!restaurant?.id) return [];
      const res = await fetch(`/api/menu-categories?restaurantId=${restaurant.id}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!restaurant?.id,
  });

  const { data: toppingGroups = [] } = useQuery({
    queryKey: ["/api/topping-groups", restaurant?.id],
    queryFn: () => getToppingGroups(restaurant!.id),
    enabled: !!restaurant?.id,
  });

  const { data: toppingOptions = [] } = useQuery({
    queryKey: ["/api/topping-group-options", restaurant?.id],
    queryFn: async () => {
      const res = await fetch(`/api/topping-group-options?restaurantId=${restaurant!.id}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!restaurant?.id,
  });

  // Memoized lookup for topping groups by menuItemId
  const groupsByMenuItemId = useMemo(() => {
    const map = new Map<string, ToppingGroupWithOptions[]>();
    (toppingGroups as ToppingGroupWithOptions[]).forEach(group => {
      const key = String(group.menuItemId);
      const existing = map.get(key) || [];
      existing.push(group);
      map.set(key, existing);
    });
    return map;
  }, [toppingGroups]);

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

  const currencySymbol = getCurrencySymbol(restaurant?.currency || "GBP");
  
  // Check if cards layout is enabled - hides sidebar completely
  const showCategoryCards = restaurant?.categoryDisplayPosition === 'cards';

  const availableCategories = useMemo(() => {
    // Always use database categories - they have UUID IDs that match menu items
    return categories;
  }, [categories]);

  const getItemsByCategory = (categoryId: string | null) => {
    if (!categoryId) return [];
    
    const category = categories.find((c: any) => c.id === categoryId);
    const categorySlug = category?.slug || categoryId;
    
    const filtered = menuItems.filter((item: any) => {
      return item.categorySlug === categorySlug || item.category === categoryId;
    });
    
    return filtered;
  };

  const addToCart = (item: MenuItemType, extras?: { name: string; price: number }[]) => {
    setCart(prev => {
      const cartItem: CartItem = { ...item, quantity: 1, selectedExtras: extras };
      return [...prev, cartItem];
    });
  };

  const removeFromCart = (itemId: string | number) => {
    setCart(prev => prev.filter(i => i.id !== itemId));
  };

  const updateQuantity = (itemId: string | number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === itemId) {
        const newQty = item.quantity + delta;
        if (newQty <= 0) return item;
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const cartSubtotal = cart.reduce((sum, item) => {
    const itemPrice = parseFloat(item.price);
    const extrasPrice = item.selectedExtras?.reduce((s, e) => s + e.price, 0) || 0;
    return sum + ((itemPrice + extrasPrice) * item.quantity);
  }, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  
  const deliveryFee = orderType === 'delivery' && (restaurant as any)?.deliveryFeeEnabled 
    ? parseFloat((restaurant as any)?.deliveryFee || "4.50") 
    : 0;
  const freeDeliveryMin = parseFloat((restaurant as any)?.freeDeliveryMinimum || "0");
  const qualifiesForFreeDelivery = (restaurant as any)?.freeDeliveryEnabled && cartSubtotal >= freeDeliveryMin;
  const finalDeliveryFee = qualifiesForFreeDelivery ? 0 : deliveryFee;
  const cartTotal = cartSubtotal + finalDeliveryFee;
  const busyModeExtra = (restaurant as any)?.busyModeEnabled ? parseInt((restaurant as any)?.busyModeExtraMinutes || "15") : 0;
  const baseTime = orderType === 'delivery' 
    ? parseInt((restaurant as any)?.deliveryTimeMinutes || "45")
    : parseInt((restaurant as any)?.collectionTimeMinutes || "20");
  const prepTimeMinutes = baseTime + busyModeExtra;

  // Pre-fill checkout form when modal opens and customer is logged in
  useEffect(() => {
    if (showCheckout && currentCustomer) {
      setCustomerName(currentCustomer.name || "");
      setCustomerPhone(currentCustomer.phone || "");
      setCustomerAddress(currentCustomer.address || "");
      setCustomerPostcode(currentCustomer.postcode || "");
    }
  }, [showCheckout, currentCustomer]);

  // Load Stripe when restaurant is loaded - fetch key from API
  useEffect(() => {
    const loadStripeKey = async () => {
      if (!restaurant?.id) return;
      
      // First try restaurant-specific key
      if (restaurant?.stripePublishableKey) {
        setStripePromise(loadStripe(restaurant.stripePublishableKey));
        return;
      }
      
      // Fetch from API endpoint (uses environment variable fallback)
      try {
        const response = await fetch(`/api/stripe-config?restaurantId=${restaurant.id}`);
        if (response.ok) {
          const data = await response.json();
          if (data.publishableKey) {
            setStripePromise(loadStripe(data.publishableKey));
          }
        }
      } catch (error) {
        console.error('Failed to load Stripe key:', error);
      }
    };
    
    loadStripeKey();
  }, [restaurant?.id, restaurant?.stripePublishableKey]);

  const getCategoryGradient = (categorySlug: string) => {
    // Match by slug to get gradient
    const cat = HELLO_MUMBAI_CATEGORIES.find(c => c.id === categorySlug);
    if (cat) return cat.gradient;
    
    // Try to find database category and match by slug
    const dbCat = categories.find((c: any) => c.id === categorySlug || c.slug === categorySlug);
    if (dbCat) {
      const matchByCatSlug = HELLO_MUMBAI_CATEGORIES.find(c => c.id === dbCat.slug);
      if (matchByCatSlug) return matchByCatSlug.gradient;
    }
    
    return "from-orange-500 via-red-500 to-pink-500";
  };
  
  const getCategoryIcon = (categorySlug: string, categoryName: string) => {
    // Try exact match first
    if (CATEGORY_ICONS[categorySlug]) return CATEGORY_ICONS[categorySlug];
    
    // Try matching by name keywords
    const nameLower = categoryName.toLowerCase();
    if (nameLower.includes('starter')) return "🍽️";
    if (nameLower.includes('pizza')) return "🍕";
    if (nameLower.includes('peri') || nameLower.includes('spicy')) return "🌶️";
    if (nameLower.includes('fried chicken')) return "🍗";
    if (nameLower.includes('grilled chicken')) return "🍗";
    if (nameLower.includes('chicken')) return "🍗";
    if (nameLower.includes('burger')) return "🍔";
    if (nameLower.includes('wrap')) return "🌯";
    if (nameLower.includes('side')) return "🍟";
    if (nameLower.includes('shake')) return "🥤";
    if (nameLower.includes('drink') || nameLower.includes('beverage')) return "🥤";
    if (nameLower.includes('dessert') || nameLower.includes('sweet')) return "🍨";
    if (nameLower.includes('salad')) return "🥗";
    if (nameLower.includes('platter')) return "🍱";
    if (nameLower.includes('meal') || nameLower.includes('deal')) return "🎁";
    if (nameLower.includes('special') || nameLower.includes('collection')) return "⭐";
    if (nameLower.includes('dip')) return "🫕";
    if (nameLower.includes('kid')) return "👶";
    if (nameLower.includes('seafood') || nameLower.includes('fish')) return "🦐";
    if (nameLower.includes('veg')) return "🥬";
    if (nameLower.includes('bread') || nameLower.includes('naan')) return "🫓";
    if (nameLower.includes('rice') || nameLower.includes('biryani')) return "🍚";
    if (nameLower.includes('soup')) return "🍜";
    
    return CATEGORY_ICONS["default"];
  };

  // Wait for all data to load before rendering
  if (restaurantLoading || menuLoading || categoriesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <Loader2 className="w-10 h-10 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-black">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-96 h-96 bg-pink-500 rounded-full filter blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-orange-500 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>
      </div>

      {/* Sidebar Navigation - Hidden when cards mode is enabled */}
      {!showCategoryCards && (
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: sidebarOpen ? 0 : -240 }}
        className="fixed left-0 top-0 h-full w-64 z-40 flex flex-col"
        style={{
          background: 'linear-gradient(180deg, rgba(0,0,0,0.95) 0%, rgba(20,10,30,0.95) 100%)',
          borderRight: '1px solid rgba(255,255,255,0.1)'
        }}
      >
        {/* Logo & Back */}
        <div className="p-4 border-b border-white/10">
          <button 
            onClick={() => navigate(`/${slug}/welcome`)}
            className="flex items-center gap-2 text-white/80 hover:text-white transition-all mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Back to Home</span>
          </button>
          <h1 className="text-xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
            {restaurant?.name || "Hello Mumbai"}
          </h1>
          <p className="text-white/50 text-xs mt-1">Indian & Indo-Chinese</p>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-white/10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <Input
              placeholder="Search menu..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 bg-white/10 border-white/20 text-white placeholder:text-white/40 h-9 text-sm"
            />
          </div>
        </div>

        {/* Category List */}
        <ScrollArea className="flex-1 p-2">
          <div className="space-y-1 pb-32">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                selectedCategory === null 
                  ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white' 
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              All Categories
            </button>
            {availableCategories.map((category: any) => (
              <button
                key={category.id}
                onClick={() => {
                  setSelectedCategory(category.id);
                  document.getElementById(`category-${category.id}`)?.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  selectedCategory === category.id 
                    ? `bg-gradient-to-r ${getCategoryGradient(category.id)} text-white` 
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                {category.name || category.displayName}
              </button>
            ))}
          </div>
        </ScrollArea>

      </motion.aside>
      )}

      {/* Sidebar Toggle - Hidden when cards mode is enabled */}
      {!showCategoryCards && (
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed left-0 top-1/2 -translate-y-1/2 z-50 w-6 h-16 bg-white/10 hover:bg-white/20 rounded-r-lg flex items-center justify-center transition-all"
        style={{ left: sidebarOpen ? '256px' : '0' }}
      >
        <ChevronRight className={`h-4 w-4 text-white transition-transform ${sidebarOpen ? 'rotate-180' : ''}`} />
      </button>
      )}

      {/* Cards Layout Header - Only shown when cards mode is enabled */}
      {showCategoryCards && (
        <div className="fixed top-0 left-0 right-0 z-50 py-4 px-4" style={{ background: '#000000', borderBottom: '2px solid rgba(255, 165, 0, 0.5)' }}>
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate(`/${slug}/welcome`)}
                className="flex items-center gap-2 text-orange-400 hover:text-orange-300 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="text-base font-semibold">Back to Home</span>
              </button>
              <div className="hidden sm:block h-8 w-px bg-orange-500/40" />
              <div className="hidden sm:flex items-center gap-3">
                {restaurant?.logoUrl && (
                  <img src={restaurant.logoUrl} alt={restaurant?.name} className="h-12 object-contain" />
                )}
                <span className="text-orange-400 font-bold text-lg">{restaurant?.name}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowAllergens(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-yellow-500/20 text-yellow-400 text-sm font-medium hover:bg-yellow-500/30 transition-all"
              >
                <AlertTriangle className="h-4 w-4" />
                Allergens
              </button>
              <button 
                onClick={() => setShowLoginPopup(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-500/20 text-cyan-400 text-sm font-medium hover:bg-cyan-500/30 transition-all"
              >
                <User className="h-4 w-4" />
                {currentCustomer ? currentCustomer.name?.split(' ')[0] || 'Account' : 'Login'}
              </button>
              <button 
                onClick={() => setShowBooking(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-purple-500/20 text-purple-400 text-sm font-medium hover:bg-purple-500/30 transition-all"
              >
                <Calendar className="h-4 w-4" />
                Booking
              </button>
              <button 
                onClick={() => setSearchQuery(searchQuery ? '' : ' ')}
                className="p-2.5 rounded-full border border-orange-500/50 text-orange-400 hover:bg-orange-500/20 transition-all"
              >
                <Search className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main 
        className="flex-1 relative z-10 transition-all duration-300"
        style={{ marginLeft: showCategoryCards ? '0' : (sidebarOpen ? '256px' : '24px'), paddingTop: showCategoryCards ? '80px' : '0' }}
      >
        <div className="max-w-6xl mx-auto px-4 py-6">
          {/* Show Categories Grid or Selected Category Items */}
          <AnimatePresence mode="wait">
            {selectedCategory === null ? (
              /* Categories Grid - App Icons Style */
              <motion.div
                key="categories"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="mb-8"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
                  <h2 className="text-2xl font-bold text-white">Categories</h2>
                  {!showCategoryCards && (
                  <div className="flex flex-wrap items-center gap-2">
                    <button 
                      onClick={() => setShowAllergens(true)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-yellow-500/20 text-yellow-400 text-xs sm:text-sm hover:bg-yellow-500/30 transition-all"
                      data-testid="button-view-allergens"
                    >
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Allergens
                    </button>
                    <button 
                      onClick={() => setShowLoginPopup(true)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 text-xs sm:text-sm hover:bg-cyan-500/30 transition-all"
                      data-testid="button-customer-login"
                    >
                      <User className="h-3.5 w-3.5" />
                      {currentCustomer ? currentCustomer.name?.split(' ')[0] || 'Account' : 'Login'}
                    </button>
                    <button 
                      onClick={() => setShowBooking(true)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-purple-500/20 text-purple-400 text-xs sm:text-sm hover:bg-purple-500/30 transition-all"
                      data-testid="button-table-booking"
                    >
                      <Calendar className="h-3.5 w-3.5" />
                      Booking
                    </button>
                  </div>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {availableCategories.map((category: any, index: number) => (
                    <motion.div
                      key={category.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`relative overflow-hidden rounded-2xl cursor-pointer group aspect-square`}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${getCategoryGradient(category.slug || category.id)} opacity-90 group-hover:opacity-100 transition-opacity`} />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-all" />
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-3 gap-2">
                        <span className="text-3xl md:text-4xl drop-shadow-lg">
                          {getCategoryIcon(category.slug || category.id, category.name)}
                        </span>
                        <h3 className="text-white font-bold text-center text-xs md:text-sm drop-shadow-lg leading-tight">
                          {category.name}
                        </h3>
                      </div>
                      <div className="absolute inset-0 border-2 border-white/20 rounded-2xl group-hover:border-white/40 transition-all" />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ) : (
              /* Menu Items for Selected Category */
              <motion.div
                key="items"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
              >
                {/* Back Button and Category Header */}
                <div className="mb-6">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className="flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-all"
                  >
                    <ArrowLeft className="h-5 w-5" />
                    <span>Back to Categories</span>
                  </button>
                  
                  {(() => {
                    const category = availableCategories.find((c: any) => c.id === selectedCategory);
                    const categorySlug = category?.slug || selectedCategory;
                    const gradient = getCategoryGradient(categorySlug);
                    return (
                      <div className={`inline-block px-8 py-3 rounded-2xl bg-gradient-to-r ${gradient}`}>
                        <h2 className="text-2xl font-bold text-white">
                          {category?.name || selectedCategory}
                        </h2>
                      </div>
                    );
                  })()}
                </div>

                {/* Menu Items Grid with Colorful Cards */}
                {(() => {
                  const items = getItemsByCategory(selectedCategory);
                  const category = availableCategories.find((c: any) => c.id === selectedCategory);
                  const categorySlug = category?.slug || selectedCategory;
                  const gradient = getCategoryGradient(categorySlug);
                  
                  if (items.length === 0) {
                    return (
                      <div className="text-center py-16">
                        <div className={`w-24 h-24 mx-auto rounded-full bg-gradient-to-br ${gradient} opacity-50 mb-4 flex items-center justify-center`}>
                          <ShoppingBag className="h-10 w-10 text-white" />
                        </div>
                        <p className="text-white/60 text-lg">No items yet in this category</p>
                        <p className="text-white/40 text-sm mt-2">Items will appear here once added</p>
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {items.map((item: MenuItemType, index: number) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={`relative overflow-hidden rounded-2xl cursor-pointer group ${item.available === false ? 'opacity-60' : ''}`}
                          onClick={() => {
                            if (item.available !== false) {
                              setSelectedItem(item);
                              setShowItemModal(true);
                            }
                          }}
                        >
                          {/* Gradient Background */}
                          <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-80`} />
                          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-all" />
                          
                          {/* Sold Out Badge */}
                          {item.available === false && (
                            <div className="absolute top-3 right-3 z-10 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                              SOLD OUT
                            </div>
                          )}
                          
                          {/* Item Content */}
                          <div className="relative p-4">
                            {/* Image */}
                            <div className={`w-full aspect-square rounded-xl overflow-hidden mb-3 shadow-lg ${item.available === false ? 'grayscale' : ''}`}>
                              <img
                                src={item.image || 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=400&fit=crop'}
                                alt={item.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              />
                            </div>
                            
                            {/* Details */}
                            <h4 className="font-bold text-white text-lg drop-shadow-lg">{item.name}</h4>
                            {item.description && (
                              <p className="text-white/80 text-sm line-clamp-2 mt-1 drop-shadow">{item.description}</p>
                            )}
                            
                            {/* Price and Add Button */}
                            <div className="flex items-center justify-between mt-3">
                              <span className="text-white font-bold text-xl drop-shadow-lg">{currencySymbol}{item.price}</span>
                              {item.available !== false ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    addToCart(item);
                                  }}
                                  className="w-10 h-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center transition-all shadow-lg group-hover:scale-110"
                                >
                                  <Plus className="h-6 w-6 text-gray-800" />
                                </button>
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gray-500/50 flex items-center justify-center">
                                  <X className="h-5 w-5 text-white/60" />
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Border */}
                          <div className="absolute inset-0 border-2 border-white/20 rounded-2xl group-hover:border-white/40 transition-all pointer-events-none" />
                        </motion.div>
                      ))}
                    </div>
                  );
                })()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Floating Cart Button */}
      <AnimatePresence>
        {cartCount > 0 && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setShowCart(true)}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-full shadow-2xl"
            style={{ background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' }}
          >
            <ShoppingBag className="h-6 w-6 text-white" />
            <div className="text-white">
              <p className="font-bold">{cartCount} items</p>
              <p className="text-sm">{currencySymbol}{cartTotal.toFixed(2)}</p>
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Cart Drawer */}
      <AnimatePresence>
        {showCart && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCart(false)}
              className="fixed inset-0 bg-black/60 z-50"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed right-0 top-0 h-full w-full max-w-md z-50 flex flex-col"
              style={{ background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)' }}
            >
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Your Basket</h2>
                <button onClick={() => setShowCart(false)} className="text-white/60 hover:text-white">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <ScrollArea className="flex-1 p-4">
                {cart.length === 0 ? (
                  <div className="text-center py-10">
                    <ShoppingBag className="h-16 w-16 mx-auto text-white/30 mb-4" />
                    <p className="text-white/60">Your basket is empty</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cart.map(item => {
                      const extrasTotal = item.selectedExtras?.reduce((s, e) => s + e.price, 0) || 0;
                      const itemTotal = (parseFloat(item.price) + extrasTotal) * item.quantity;
                      return (
                      <div key={item.id} className="bg-white/10 rounded-xl p-3 flex gap-3">
                        <img
                          src={item.image || 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=100'}
                          alt={item.name}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <h4 className="font-bold text-white text-sm">{item.name}</h4>
                          <p className="text-green-400 font-medium">{currencySymbol}{item.price}</p>
                          
                          {/* Show selected extras */}
                          {item.selectedExtras && item.selectedExtras.length > 0 && (
                            <div className="mt-1 space-y-0.5">
                              {item.selectedExtras.map((extra, idx) => (
                                <p key={idx} className="text-xs text-amber-400">
                                  + {extra.name} ({currencySymbol}{extra.price.toFixed(2)})
                                </p>
                              ))}
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={() => updateQuantity(item.id, -1)}
                              className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="text-white font-bold">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, 1)}
                              className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="ml-auto text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          
                          {/* Show item total if has extras */}
                          {item.selectedExtras && item.selectedExtras.length > 0 && (
                            <p className="text-xs text-white/50 mt-1">
                              Item total: {currencySymbol}{itemTotal.toFixed(2)}
                            </p>
                          )}
                        </div>
                      </div>
                    );})}
                  </div>
                )}
              </ScrollArea>

              {cart.length > 0 && (
                <div className="p-4 border-t border-white/10 space-y-4">
                  {/* Order Type Toggle */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setOrderType('delivery')}
                      className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                        orderType === 'delivery' 
                          ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white' 
                          : 'bg-white/10 text-white/60'
                      }`}
                    >
                      🚗 Delivery
                    </button>
                    <button
                      onClick={() => setOrderType('collection')}
                      className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                        orderType === 'collection' 
                          ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white' 
                          : 'bg-white/10 text-white/60'
                      }`}
                    >
                      🏪 Collection
                    </button>
                  </div>

                  {/* Estimated Time */}
                  <div className="flex items-center gap-2 text-amber-400 bg-amber-500/10 px-3 py-2 rounded-lg">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">
                      Estimated {orderType === 'delivery' ? 'delivery' : 'ready'}: {prepTimeMinutes} mins
                    </span>
                  </div>

                  {/* Price Breakdown */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-white/70">
                      <span>Subtotal</span>
                      <span>{currencySymbol}{cartSubtotal.toFixed(2)}</span>
                    </div>
                    {orderType === 'delivery' && (
                      <div className="flex justify-between text-white/70">
                        <span>Delivery</span>
                        <span>
                          {qualifiesForFreeDelivery ? (
                            <span className="text-green-400">FREE</span>
                          ) : (
                            `${currencySymbol}${finalDeliveryFee.toFixed(2)}`
                          )}
                        </span>
                      </div>
                    )}
                    {orderType === 'delivery' && !qualifiesForFreeDelivery && freeDeliveryMin > 0 && (
                      <div className="text-xs text-yellow-400/80">
                        Spend {currencySymbol}{(freeDeliveryMin - cartSubtotal).toFixed(2)} more for free delivery
                      </div>
                    )}
                    <div className="flex justify-between text-white font-bold text-lg pt-2 border-t border-white/10">
                      <span>Total</span>
                      <span>{currencySymbol}{cartTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Special Instructions */}
                  <div>
                    <label className="text-white/70 text-sm mb-2 block">Special Instructions (optional)</label>
                    <textarea
                      value={specialInstructions}
                      onChange={(e) => setSpecialInstructions(e.target.value)}
                      placeholder="e.g., Wheelchair access, high chair needed, dietary requirements, allergies, extra spicy..."
                      className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500/50"
                      rows={2}
                      data-testid="input-special-instructions-mumbai"
                    />
                  </div>

                  <Button
                    className="w-full py-6 text-lg font-bold rounded-xl"
                    style={{ background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' }}
                    onClick={() => setShowCheckout(true)}
                  >
                    Go to Checkout
                  </Button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Item Detail Modal with Goes Well With */}
      <Dialog open={showItemModal} onOpenChange={setShowItemModal}>
        <DialogContent className="bg-gradient-to-br from-slate-900 to-slate-800 border-white/20 text-white max-w-lg max-h-[90vh] overflow-y-auto">
          {selectedItem && (
            <ItemDetailWithToppings 
              item={selectedItem}
              currencySymbol={currencySymbol}
              toppingGroups={toppingGroups}
              toppingOptions={toppingOptions}
              onAddToCart={addToCart}
              onClose={() => setShowItemModal(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Allergen Matrix Modal */}
      <Dialog open={showAllergens} onOpenChange={setShowAllergens}>
        <DialogContent className="bg-gradient-to-br from-slate-900 to-slate-800 border-white/20 text-white max-w-5xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
              Allergen Information
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-white/70 text-sm">Please inform our staff of any allergies or dietary requirements before ordering.</p>
            
            {/* Legend */}
            <div className="flex flex-wrap gap-4 p-3 rounded-xl bg-white/5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <span className="text-white/80 text-xs">Contains</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center">
                  <span className="text-white text-xs">?</span>
                </div>
                <span className="text-white/80 text-xs">May Contain</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <span className="text-white/80 text-xs">Free From</span>
              </div>
            </div>
            
            {/* Allergen Matrix Table */}
            <div className="overflow-auto max-h-[60vh]">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10">
                  <tr className="border-b border-white/20">
                    <th className="p-2 text-left font-medium text-white sticky left-0 bg-slate-800 min-w-[150px]">
                      Menu Item
                    </th>
                    {ALLERGEN_KEYS.map(allergen => (
                      <th key={allergen} className="p-2 text-center font-medium text-white/80 text-xs whitespace-nowrap bg-slate-800">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-lg">{ALLERGEN_ICONS[allergen]}</span>
                          <span className="capitalize text-[10px]">{allergen}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {menuItems.map((item: MenuItemType) => (
                    <tr key={item.id} className="border-b border-white/10 hover:bg-white/5">
                      <td className="p-2 text-white font-medium sticky left-0 bg-slate-900 text-sm">
                        {item.name}
                      </td>
                      {ALLERGEN_KEYS.map(allergen => {
                        const profile = item.allergenProfile as Record<string, string> | undefined;
                        const status = profile?.[allergen] || "unknown";
                        
                        return (
                          <td key={allergen} className="p-2 text-center">
                            <div className={`w-6 h-6 mx-auto rounded-full flex items-center justify-center text-white text-xs ${
                              status === 'contains' ? 'bg-red-500' :
                              status === 'may_contain' ? 'bg-yellow-500' :
                              status === 'free' ? 'bg-green-500' :
                              'bg-gray-600'
                            }`}>
                              {status === 'contains' && <Check className="w-3 h-3" />}
                              {status === 'may_contain' && '?'}
                              {status === 'free' && <Check className="w-3 h-3" />}
                              {status === 'unknown' && '-'}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              {menuItems.length === 0 && (
                <div className="text-center py-8 text-white/50">
                  No menu items available yet.
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Table Booking Modal - Styled Card */}
      <AnimatePresence>
        {showBooking && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
              onClick={() => { setShowBooking(false); setBookingSuccess(false); }} 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl"
              style={{ 
                background: 'linear-gradient(180deg, #1a1a2e 0%, #0f0f1a 100%)',
                border: '1px solid rgba(234, 179, 8, 0.3)'
              }}
            >
              {/* Header */}
              <div 
                className="sticky top-0 flex items-center justify-between p-5 border-b z-10"
                style={{ background: '#1a1a2e', borderColor: 'rgba(234, 179, 8, 0.3)' }}
              >
                <h2 className="text-xl font-bold text-yellow-400">
                  Book a Table
                </h2>
                <button
                  onClick={() => { setShowBooking(false); setBookingSuccess(false); }}
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"
                  data-testid="button-close-booking"
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
                    <h3 className="text-2xl font-bold text-white mb-3">Booking Confirmed!</h3>
                    <p className="text-white/60 mb-6">Thank you for your reservation. We'll see you soon!</p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => { setShowBooking(false); setBookingSuccess(false); }}
                      className="px-8 py-4 rounded-2xl font-medium text-black shadow-lg bg-yellow-400 hover:bg-yellow-300"
                    >
                      Close
                    </motion.button>
                  </motion.div>
                ) : (
                  <div className="space-y-5">
                    {/* Date & Time */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-yellow-400 text-sm mb-2">Date</label>
                        <Input
                          type="date"
                          value={bookingDate}
                          onChange={(e) => setBookingDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          className="h-12 rounded-xl bg-slate-800 text-white border-yellow-400/30"
                          data-testid="input-booking-date"
                        />
                      </div>
                      <div>
                        <label className="block text-yellow-400 text-sm mb-2">Time</label>
                        <Input
                          type="time"
                          value={bookingTime}
                          onChange={(e) => setBookingTime(e.target.value)}
                          className="h-12 rounded-xl bg-slate-800 text-white border-yellow-400/30"
                          data-testid="input-booking-time"
                        />
                      </div>
                    </div>

                    {/* Guest Counters */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-yellow-400/20">
                        <span className="text-white">Adults</span>
                        <div className="flex items-center gap-3">
                          <button onClick={() => setBookingAdults(Math.max(1, bookingAdults - 1))} className="w-8 h-8 rounded-full bg-yellow-400/20 text-yellow-400 flex items-center justify-center hover:bg-yellow-400/30">
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="text-white font-bold w-6 text-center">{bookingAdults}</span>
                          <button onClick={() => setBookingAdults(bookingAdults + 1)} className="w-8 h-8 rounded-full bg-yellow-400/20 text-yellow-400 flex items-center justify-center hover:bg-yellow-400/30">
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-yellow-400/20">
                        <span className="text-white">Children <span className="text-white/50 text-xs">(2-12)</span></span>
                        <div className="flex items-center gap-3">
                          <button onClick={() => setBookingKids(Math.max(0, bookingKids - 1))} className="w-8 h-8 rounded-full bg-yellow-400/20 text-yellow-400 flex items-center justify-center hover:bg-yellow-400/30">
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="text-white font-bold w-6 text-center">{bookingKids}</span>
                          <button onClick={() => setBookingKids(bookingKids + 1)} className="w-8 h-8 rounded-full bg-yellow-400/20 text-yellow-400 flex items-center justify-center hover:bg-yellow-400/30">
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-yellow-400/20">
                        <span className="text-white">Infants <span className="text-white/50 text-xs">(0-2)</span></span>
                        <div className="flex items-center gap-3">
                          <button onClick={() => setBookingInfants(Math.max(0, bookingInfants - 1))} className="w-8 h-8 rounded-full bg-yellow-400/20 text-yellow-400 flex items-center justify-center hover:bg-yellow-400/30">
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="text-white font-bold w-6 text-center">{bookingInfants}</span>
                          <button onClick={() => setBookingInfants(bookingInfants + 1)} className="w-8 h-8 rounded-full bg-yellow-400/20 text-yellow-400 flex items-center justify-center hover:bg-yellow-400/30">
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Name */}
                    <div>
                      <label className="block text-yellow-400 text-sm mb-2">Name *</label>
                      <Input
                        type="text"
                        placeholder="Your name"
                        value={bookingName}
                        onChange={(e) => setBookingName(e.target.value)}
                        className="h-12 rounded-xl bg-slate-800 text-white border-yellow-400/30 placeholder:text-white/40"
                        data-testid="input-booking-name"
                      />
                    </div>

                    {/* Phone (WhatsApp) */}
                    <div>
                      <label className="block text-yellow-400 text-sm mb-2">Phone * (WhatsApp)</label>
                      <div className="flex gap-2">
                        <div className="h-12 px-3 rounded-xl bg-slate-800 border border-yellow-400/30 flex items-center text-white/60 text-sm">
                          GB +44
                        </div>
                        <Input
                          type="tel"
                          placeholder="Phone number"
                          value={bookingPhone}
                          onChange={(e) => setBookingPhone(e.target.value)}
                          className="flex-1 h-12 rounded-xl bg-slate-800 text-white border-yellow-400/30 placeholder:text-white/40"
                          data-testid="input-booking-phone"
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-yellow-400 text-sm mb-2">Email</label>
                      <Input
                        type="email"
                        placeholder="Your email"
                        value={bookingEmail}
                        onChange={(e) => setBookingEmail(e.target.value)}
                        className="h-12 rounded-xl bg-slate-800 text-white border-yellow-400/30 placeholder:text-white/40"
                        data-testid="input-booking-email"
                      />
                    </div>

                    {/* Special Assistance / Accessibility Needs */}
                    <div>
                      <label className="block text-yellow-400 text-sm mb-2">♿ Special Assistance / Accessibility Needs</label>
                      <textarea
                        placeholder="e.g., Wheelchair access, high chair needed, dietary requirements, etc."
                        value={bookingSpecialRequests}
                        onChange={(e) => setBookingSpecialRequests(e.target.value)}
                        className="w-full h-24 px-4 py-3 rounded-xl bg-slate-800 text-white border border-yellow-400/30 placeholder:text-white/40 resize-none"
                        data-testid="input-booking-special"
                      />
                    </div>

                    {/* Submit Button */}
                    <Button 
                      onClick={async () => {
                        if (!bookingName || !bookingPhone || !bookingDate || !bookingTime) {
                          toast({ title: "Please fill all required fields", variant: "destructive" });
                          return;
                        }
                        try {
                          await createBooking({
                            restaurantId: restaurant?.id || "",
                            customerName: bookingName,
                            phone: "+44" + bookingPhone.replace(/\s/g, ""),
                            email: bookingEmail,
                            date: bookingDate,
                            time: bookingTime,
                            guests: bookingAdults + bookingKids + bookingInfants,
                            adults: bookingAdults,
                            children: bookingKids,
                            infants: bookingInfants,
                            specialHelp: bookingSpecialRequests || null
                          });
                          setBookingSuccess(true);
                          setBookingName("");
                          setBookingEmail("");
                          setBookingPhone("");
                          setBookingDate("");
                          setBookingTime("");
                          setBookingAdults(2);
                          setBookingKids(0);
                          setBookingInfants(0);
                          setBookingSpecialRequests("");
                        } catch {
                          toast({ title: "Failed to submit booking", variant: "destructive" });
                        }
                      }}
                      className="w-full h-14 rounded-xl font-bold text-black bg-yellow-400 hover:bg-yellow-300"
                      data-testid="button-submit-booking"
                    >
                      Confirm Booking
                    </Button>
                    <p className="text-center text-white/50 text-sm mt-3">
                      Manager will confirm via WhatsApp
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Checkout Modal */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="bg-gradient-to-br from-slate-900 to-slate-800 border-white/20 text-white max-w-lg max-h-[90vh] overflow-y-auto">
          {orderSuccess ? (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="py-8 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center"
              >
                <Check className="h-12 w-12 text-white" />
              </motion.div>
              <h2 className="text-2xl font-bold text-white mb-2">Order Placed!</h2>
              <p className="text-white/60">Your order has been received</p>
              <p className="text-amber-400 mt-4 font-medium">
                Estimated time: {prepTimeMinutes} minutes
              </p>
              
              {orderType === 'delivery' && placedOrderId && (
                <div className="mt-6 space-y-3">
                  <p className="text-white/60 text-sm">Track your delivery in real-time</p>
                  <Button
                    onClick={() => window.open(`/track/${placedOrderId}`, '_blank')}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold px-6 py-3 rounded-xl"
                  >
                    <MapPin className="h-5 w-5 mr-2" />
                    Track My Order
                  </Button>
                </div>
              )}

              <Button
                variant="outline"
                className="mt-4 border-white/20 text-white hover:bg-white/10"
                onClick={() => {
                  setOrderSuccess(false);
                  setShowCheckout(false);
                  setShowCart(false);
                  setCart([]);
                  setCustomerName("");
                  setCustomerPhone("");
                  setCustomerAddress("");
                  setCustomerPostcode("");
                  setPaymentMethod('cash');
                  setPlacedOrderId(null);
                }}
              >
                Continue Shopping
              </Button>
            </motion.div>
          ) : (
          <>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-green-400" />
              Complete Your Order
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Order Type Badge */}
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${
              orderType === 'delivery' 
                ? 'bg-green-500/20 text-green-400' 
                : 'bg-blue-500/20 text-blue-400'
            }`}>
              {orderType === 'delivery' ? '🚗 Delivery Order' : '🏪 Collection Order'}
            </div>

            {/* Estimated Time */}
            <div className="flex items-center gap-2 text-amber-400 bg-amber-500/10 px-4 py-3 rounded-xl">
              <Clock className="h-5 w-5" />
              <div>
                <p className="font-bold">Estimated {orderType === 'delivery' ? 'Delivery' : 'Ready'} Time</p>
                <p className="text-sm text-amber-300">{prepTimeMinutes} minutes</p>
              </div>
            </div>

            {/* Customer Details */}
            <div className="space-y-3">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
              >
                <label className="text-sm text-white/60 mb-1 block">Your Name</label>
                <FastInput
                  value={customerName}
                  onChange={setCustomerName}
                  placeholder="Enter your full name"
                  autoComplete="name"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                />
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <label className="text-sm text-white/60 mb-1 block">Phone Number</label>
                <div className="flex gap-2">
                  <div className="bg-white/10 border border-white/20 rounded-md px-3 py-2 text-white/60 text-sm flex items-center">
                    +44
                  </div>
                  <FastInput
                    value={customerPhone}
                    onChange={setCustomerPhone}
                    placeholder="7XXX XXX XXX"
                    autoComplete="tel"
                    inputMode="tel"
                    className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/40"
                  />
                </div>
              </motion.div>

              {orderType === 'delivery' && (
                <>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                  >
                    <label className="text-sm text-white/60 mb-1 block">Delivery Address</label>
                    <FastInput
                      value={customerAddress}
                      onChange={setCustomerAddress}
                      placeholder="House number and street"
                      autoComplete="street-address"
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                    />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <label className="text-sm text-white/60 mb-1 block">Postcode</label>
                    <FastInput
                      value={customerPostcode}
                      onChange={(v) => setCustomerPostcode(v.toUpperCase())}
                      placeholder="E.g. WD18 0AB"
                      autoComplete="postal-code"
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/40 uppercase"
                    />
                  </motion.div>
                </>
              )}
            </div>

            {/* Payment Method */}
            {stripePromise && (
              <div className="space-y-3">
                <h4 className="font-bold text-white">Payment Method</h4>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPaymentMethod('cash')}
                    className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                      paymentMethod === 'cash' 
                        ? 'border-green-500 bg-green-500/20' 
                        : 'border-white/20 hover:border-white/40 bg-white/5'
                    }`}
                    data-testid="button-pay-cash"
                  >
                    <Banknote className="h-6 w-6 text-green-400" />
                    <span className="text-white font-medium">Cash</span>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('card')}
                    className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                      paymentMethod === 'card' 
                        ? 'border-blue-500 bg-blue-500/20' 
                        : 'border-white/20 hover:border-white/40 bg-white/5'
                    }`}
                    data-testid="button-pay-card"
                  >
                    <CreditCard className="h-6 w-6 text-blue-400" />
                    <span className="text-white font-medium">Card</span>
                  </button>
                </div>
              </div>
            )}

            {/* Order Summary */}
            <div className="bg-white/5 rounded-xl p-4 space-y-2">
              <h4 className="font-bold text-white mb-3">Order Summary</h4>
              {cart.map(item => (
                <div key={item.id} className="flex justify-between text-sm text-white/70">
                  <span>{item.quantity}x {item.name}</span>
                  <span>{currencySymbol}{(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t border-white/10 pt-2 mt-2 space-y-1">
                <div className="flex justify-between text-sm text-white/70">
                  <span>Subtotal</span>
                  <span>{currencySymbol}{cartSubtotal.toFixed(2)}</span>
                </div>
                {orderType === 'delivery' && (
                  <div className="flex justify-between text-sm text-white/70">
                    <span>Delivery</span>
                    <span>{qualifiesForFreeDelivery ? 'FREE' : `${currencySymbol}${finalDeliveryFee.toFixed(2)}`}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-white text-lg">
                  <span>Total</span>
                  <span>{currencySymbol}{cartTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Place Order Button - Card Payment with Stripe */}
            {paymentMethod === 'card' && stripePromise ? (
              <Elements stripe={stripePromise} key="stripe-elements">
                <CardPaymentForm
                  amount={cartTotal}
                  restaurantId={restaurant?.id || ""}
                  validateBeforePayment={() => {
                    if (!customerName || !customerPhone) {
                      return "Please fill in your name and phone number";
                    }
                    if (orderType === 'delivery' && (!customerAddress || !customerPostcode)) {
                      return "Please enter your delivery address and postcode";
                    }
                    return null;
                  }}
                  onPaymentSuccess={async (paymentIntentId) => {
                    try {
                      const response = await fetch("/api/orders", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          order: {
                            restaurantId: restaurant?.id,
                            customerName,
                            phone: `+44${customerPhone.replace(/^0/, '')}`,
                            address: orderType === 'delivery' ? `${customerAddress}, ${customerPostcode}` : '',
                            type: orderType,
                            status: "pending_approval",
                            total: cartTotal.toFixed(2),
                            deliveryFee: orderType === 'delivery' ? finalDeliveryFee.toFixed(2) : "0",
                            paymentMethod: 'card',
                            stripePaymentId: paymentIntentId,
                            notes: specialInstructions || null,
                          },
                          items: cart.map(item => ({
                            name: item.name,
                            quantity: item.quantity,
                            price: item.price,
                            notes: item.selectedExtras?.map(e => e.name).join(", ") || null,
                          })),
                        }),
                      });
                      
                      if (response.ok) {
                        const orderData = await response.json();
                        setPlacedOrderId(orderData.order?.id || null);
                        setOrderSuccess(true);
                      } else {
                        throw new Error("Failed to place order");
                      }
                    } catch {
                      toast({ title: "Failed to place order", description: "Please try again.", variant: "destructive" });
                    } finally {
                      setIsSubmittingOrder(false);
                    }
                  }}
                  onPaymentError={(error) => {
                    toast({ title: "Payment failed", description: error, variant: "destructive" });
                  }}
                  isProcessing={isSubmittingOrder}
                  setIsProcessing={setIsSubmittingOrder}
                >
                  <div />
                </CardPaymentForm>
              </Elements>
            ) : (
              /* Cash Payment Button */
              <Button
                className="w-full py-6 text-lg font-bold rounded-xl"
                style={{ background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' }}
                disabled={isSubmittingOrder}
                onClick={async () => {
                  if (!customerName || !customerPhone) {
                    toast({ title: "Please fill in your details", variant: "destructive" });
                    return;
                  }
                  if (orderType === 'delivery' && (!customerAddress || !customerPostcode)) {
                    toast({ title: "Please enter your delivery address", variant: "destructive" });
                    return;
                  }
                  
                  setIsSubmittingOrder(true);
                  try {
                    const response = await fetch("/api/orders", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        order: {
                          restaurantId: restaurant?.id,
                          customerName,
                          phone: `+44${customerPhone.replace(/^0/, '')}`,
                          address: orderType === 'delivery' ? `${customerAddress}, ${customerPostcode}` : '',
                          type: orderType,
                          status: "new",
                          total: cartTotal.toFixed(2),
                          deliveryFee: orderType === 'delivery' ? finalDeliveryFee.toFixed(2) : "0",
                          paymentMethod: 'cash',
                          notes: specialInstructions || null,
                        },
                        items: cart.map(item => ({
                          name: item.name,
                          quantity: item.quantity,
                          price: item.price,
                          notes: item.selectedExtras?.map(e => e.name).join(", ") || null,
                        })),
                      }),
                    });
                    
                    if (response.ok) {
                      const orderData = await response.json();
                      setPlacedOrderId(orderData.order?.id || null);
                      setOrderSuccess(true);
                    } else {
                      throw new Error("Failed to place order");
                    }
                  } catch {
                    toast({ title: "Failed to place order", description: "Please try again.", variant: "destructive" });
                  } finally {
                    setIsSubmittingOrder(false);
                  }
                }}
              >
                {isSubmittingOrder ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <span className="flex items-center gap-2">
                    <Banknote className="h-5 w-5" />
                    Place Order (Pay Cash) - {currencySymbol}{cartTotal.toFixed(2)}
                  </span>
                )}
              </Button>
            )}
          </div>
          </>
          )}
        </DialogContent>
      </Dialog>

      {/* Customer Login Popup */}
      <LoginPopup
        isOpen={showLoginPopup}
        onClose={() => setShowLoginPopup(false)}
        restaurantId={restaurant?.id}
        initialCustomer={currentCustomer}
        onCustomerUpdate={(customer) => {
          setCurrentCustomer(customer);
          if (customer) {
            setCustomerName(customer.name || "");
            setCustomerPhone(customer.phone || "");
            setCustomerAddress(customer.address || "");
            setCustomerPostcode(customer.postcode || "");
          }
        }}
      />
    </div>
  );
}
