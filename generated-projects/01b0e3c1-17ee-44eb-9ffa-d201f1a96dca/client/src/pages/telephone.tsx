import { useState, useMemo, useCallback, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRestaurantBySlug, getMenuItems } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Trash2, Plus, Minus, Search, ShoppingCart, Phone, MapPin, User, Banknote, CreditCard, ChefHat, Truck, Store, Clock, Check, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { motion, AnimatePresence } from "framer-motion";
import { getCurrencySymbol, type MenuItem, type Restaurant, type ExtraTopping } from "@shared/schema";

const CATEGORY_COLORS = [
  "from-rose-500 to-pink-600", "from-orange-500 to-amber-600", "from-emerald-500 to-green-600",
  "from-cyan-500 to-blue-600", "from-violet-500 to-purple-600", "from-fuchsia-500 to-pink-600",
  "from-red-500 to-rose-600", "from-amber-500 to-yellow-600", "from-teal-500 to-cyan-600",
  "from-indigo-500 to-blue-600", "from-lime-500 to-green-600", "from-sky-500 to-indigo-600"
];

interface SelectedTopping {
  id: string;
  name: string;
  price: number;
}

interface CartItem {
  menuItemId: string;
  cartItemId: string;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  image?: string;
  toppings: SelectedTopping[];
}

export default function TelephonePage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const queryClient = useQueryClient();

  // Customer details
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerPostcode, setCustomerPostcode] = useState("");
  const [orderType, setOrderType] = useState<"delivery" | "collection">("delivery");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "account">("cash");

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showToppingModal, setShowToppingModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [selectedToppings, setSelectedToppings] = useState<SelectedTopping[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  const { data: restaurant, isLoading: loadingRestaurant } = useQuery<Restaurant>({
    queryKey: ["/api/restaurants", slug],
    queryFn: () => getRestaurantBySlug(slug!),
    enabled: !!slug,
  });

  const restaurantId = restaurant?.id;
  const currencySymbol = getCurrencySymbol(restaurant?.currency || "GBP");

  const { data: menuItems = [], isLoading: loadingMenu } = useQuery<MenuItem[]>({
    queryKey: ["/api/menu", restaurantId],
    queryFn: () => getMenuItems(restaurantId!),
    enabled: !!restaurantId,
  });

  const { data: extraToppings = [] } = useQuery<ExtraTopping[]>({
    queryKey: ["/api/extra-toppings", restaurantId],
    queryFn: async () => {
      const res = await fetch(`/api/restaurants/${restaurantId}/extra-toppings`);
      return res.json();
    },
    enabled: !!restaurantId,
  });

  const { data: dbCategories = [] } = useQuery<{ id: string; slug: string; name: string }[]>({
    queryKey: ["/api/menu-categories", restaurantId],
    queryFn: async () => {
      const response = await fetch(`/api/menu-categories?restaurantId=${restaurantId}`);
      return response.json();
    },
    enabled: !!restaurantId,
  });

  const { data: toppingGroups = [] } = useQuery({
    queryKey: ["/api/topping-groups", restaurantId],
    queryFn: async () => {
      const response = await fetch(`/api/restaurants/${restaurantId}/topping-groups`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!restaurantId,
  });

  const { data: toppingOptions = [] } = useQuery({
    queryKey: ["/api/topping-group-options", restaurantId],
    queryFn: async () => {
      const response = await fetch(`/api/restaurants/${restaurantId}/topping-group-options`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!restaurantId,
  });

  const { data: customers = [] } = useQuery<any[]>({
    queryKey: ["/api/customers", restaurantId],
    queryFn: async () => {
      const res = await fetch(`/api/restaurants/${restaurantId}/customers`);
      return res.json();
    },
    enabled: !!restaurantId,
  });

  useEffect(() => {
    if (customerPhone.length >= 7) {
      const phoneClean = customerPhone.replace(/\s+/g, '');
      const match = customers.find((c: any) => {
        const cPhone = (c.phone || '').replace(/\s+/g, '');
        return cPhone.endsWith(phoneClean) || phoneClean.endsWith(cPhone.replace(/^\+44/, ''));
      });
      if (match) {
        if (match.name && !customerName) setCustomerName(match.name);
        if (match.address && !customerAddress) setCustomerAddress(match.address);
      }
    }
  }, [customerPhone, customers]);

  const categories = useMemo(() => {
    const cats = new Map<string, { name: string; count: number }>();
    menuItems.forEach((item: any) => {
      const catSlug = item.categorySlug || item.category || "uncategorized";
      const dbCat = dbCategories.find(c => c.slug === catSlug || c.id === catSlug);
      const catName = dbCat?.name || catSlug.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
      if (!cats.has(catSlug)) {
        cats.set(catSlug, { name: catName, count: 0 });
      }
      cats.get(catSlug)!.count++;
    });
    return Array.from(cats.entries()).map(([slug, data]) => ({ slug, ...data }));
  }, [menuItems, dbCategories]);

  const filteredItems = useMemo(() => {
    let items = menuItems;
    if (activeCategory) {
      items = items.filter((item: any) => (item.categorySlug || item.category) === activeCategory);
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = items.filter((item: any) => item.name.toLowerCase().includes(query) || item.description?.toLowerCase().includes(query));
    }
    return items;
  }, [menuItems, activeCategory, searchQuery]);

  const addToCart = useCallback((item: MenuItem, toppings: SelectedTopping[] = []) => {
    const cartItem: CartItem = {
      menuItemId: item.id,
      cartItemId: `${item.id}-${Date.now()}`,
      name: item.name,
      description: item.description || undefined,
      price: Number(item.price),
      quantity: 1,
      image: item.image || undefined,
      toppings
    };
    setCart(prev => [...prev, cartItem]);
    toast({ title: "Added to order", description: item.name });
  }, []);

  const updateQuantity = useCallback((cartItemId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.cartItemId === cartItemId) {
        const newQty = Math.max(0, item.quantity + delta);
        if (newQty === 0) return null;
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(Boolean) as CartItem[]);
  }, []);

  const removeFromCart = useCallback((cartItemId: string) => {
    setCart(prev => prev.filter(item => item.cartItemId !== cartItemId));
  }, []);

  const toggleTopping = useCallback((topping: ExtraTopping | SelectedTopping) => {
    setSelectedToppings(prev => {
      const exists = prev.some(t => t.id === topping.id);
      if (exists) {
        return prev.filter(t => t.id !== topping.id);
      }
      return [...prev, { id: topping.id, name: topping.name, price: Number(topping.price) }];
    });
  }, []);

  const subtotal = cart.reduce((sum, item) => {
    const toppingsTotal = item.toppings.reduce((t, topping) => t + topping.price, 0);
    return sum + (item.price + toppingsTotal) * item.quantity;
  }, 0);

  const deliveryFee = orderType === "delivery" && (restaurant as any)?.deliveryFeeEnabled 
    ? parseFloat((restaurant as any)?.deliveryFee || "4.50") 
    : 0;
  const total = subtotal + deliveryFee;
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const placeOrderMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order: {
            restaurantId: restaurant?.id,
            customerName,
            phone: customerPhone.startsWith("+") ? customerPhone : `+44${customerPhone.replace(/^0/, '')}`,
            address: orderType === "delivery" ? `${customerAddress}, ${customerPostcode}` : null,
            type: orderType,
            status: "pending_approval",
            total: total.toFixed(2),
            deliveryFee: deliveryFee.toFixed(2),
            paymentMethod,
            source: "telephone"
          },
          items: cart.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price.toFixed(2),
            notes: item.toppings.length > 0 ? `EXTRAS: ${item.toppings.map(t => t.name).join(', ')}` : null,
          })),
        }),
      });
      if (!response.ok) throw new Error("Failed to place order");
      return response.json();
    },
    onSuccess: () => {
      setOrderSuccess(true);
      toast({ title: "Order placed!", description: "Order sent to kitchen for approval" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to place order", variant: "destructive" });
    }
  });

  const handlePlaceOrder = () => {
    if (!customerName || !customerPhone) {
      toast({ title: "Missing details", description: "Please enter customer name and phone", variant: "destructive" });
      return;
    }
    if (orderType === "delivery" && (!customerAddress || !customerPostcode)) {
      toast({ title: "Missing address", description: "Please enter delivery address", variant: "destructive" });
      return;
    }
    if (cart.length === 0) {
      toast({ title: "Empty order", description: "Please add items to the order", variant: "destructive" });
      return;
    }
    placeOrderMutation.mutate();
  };

  const resetOrder = () => {
    setCart([]);
    setCustomerName("");
    setCustomerPhone("");
    setCustomerAddress("");
    setCustomerPostcode("");
    setOrderType("delivery");
    setPaymentMethod("cash");
    setOrderSuccess(false);
  };

  if (loadingRestaurant || loadingMenu) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-white/60 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="w-24 h-24 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Order Placed!</h1>
          <p className="text-white/60 mb-2">Customer: {customerName}</p>
          <p className="text-white/60 mb-2">Phone: {customerPhone}</p>
          <p className="text-white/60 mb-6">{orderType === "delivery" ? `Delivery to: ${customerAddress}` : "Collection"}</p>
          <Button
            onClick={resetOrder}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-8 py-4 text-lg rounded-xl"
          >
            <Phone className="h-5 w-5 mr-2" />
            New Order
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-xl border-b border-white/10 px-4 py-3 sticky top-0 z-40">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Link href={`/admin/${slug}`}>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Phone className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-white text-lg">Telephone Orders</h1>
                <p className="text-white/50 text-xs">{restaurant?.name}</p>
              </div>
            </div>
          </div>
          <Button
            onClick={() => setShowCart(true)}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-xl relative"
          >
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {cartCount}
              </span>
            )}
          </Button>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row max-w-7xl mx-auto">
        {/* Left Panel - Customer Details */}
        <div className="lg:w-80 p-4 space-y-4">
          <Card className="bg-white/10 border-white/20 backdrop-blur-xl p-4 rounded-2xl space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <User className="h-5 w-5 text-indigo-400" />
              Customer Details
            </h2>
            
            <div className="space-y-3">
              <div>
                <label className="text-sm text-white/60 mb-1 block">Name</label>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Customer name"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                />
              </div>
              
              <div>
                <label className="text-sm text-white/60 mb-1 block">Phone</label>
                <div className="flex gap-2">
                  <span className="bg-white/10 border border-white/20 rounded-md px-3 py-2 text-white/60 text-sm">+44</span>
                  <Input
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="7XXX XXX XXX"
                    className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/40"
                  />
                </div>
                {customerPhone.length >= 7 && customers.find((c: any) => {
                  const cPhone = (c.phone || '').replace(/\s+/g, '');
                  const phoneClean = customerPhone.replace(/\s+/g, '');
                  return cPhone.endsWith(phoneClean) || phoneClean.endsWith(cPhone.replace(/^\+44/, ''));
                }) && (
                  <div className="mt-1 px-2 py-1 bg-green-500/20 border border-green-500/40 rounded-lg flex items-center gap-2">
                    <Check className="h-3 w-3 text-green-400" />
                    <span className="text-green-400 text-xs font-medium">Returning customer - details auto-filled</span>
                  </div>
                )}
              </div>
            </div>

            {/* Order Type */}
            <div className="space-y-2">
              <label className="text-sm text-white/60">Order Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setOrderType("delivery")}
                  className={`p-3 rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${
                    orderType === "delivery"
                      ? "border-green-500 bg-green-500/20"
                      : "border-white/20 bg-white/5"
                  }`}
                >
                  <Truck className="h-4 w-4 text-green-400" />
                  <span className="text-white text-sm font-medium">Delivery</span>
                </button>
                <button
                  onClick={() => setOrderType("collection")}
                  className={`p-3 rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${
                    orderType === "collection"
                      ? "border-blue-500 bg-blue-500/20"
                      : "border-white/20 bg-white/5"
                  }`}
                >
                  <Store className="h-4 w-4 text-blue-400" />
                  <span className="text-white text-sm font-medium">Collection</span>
                </button>
              </div>
            </div>

            {/* Delivery Address */}
            {orderType === "delivery" && (
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-white/60 mb-1 block">Address</label>
                  <Input
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="House number and street"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                  />
                </div>
                <div>
                  <label className="text-sm text-white/60 mb-1 block">Postcode</label>
                  <Input
                    value={customerPostcode}
                    onChange={(e) => setCustomerPostcode(e.target.value.toUpperCase())}
                    placeholder="E.g. WD18 0AB"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40 uppercase"
                  />
                </div>
              </div>
            )}

            {/* Payment Method */}
            <div className="space-y-2">
              <label className="text-sm text-white/60">Payment</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setPaymentMethod("cash")}
                  className={`p-2 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                    paymentMethod === "cash"
                      ? "border-emerald-500 bg-emerald-500/20"
                      : "border-white/20 bg-white/5"
                  }`}
                >
                  <Banknote className="h-4 w-4 text-emerald-400" />
                  <span className="text-white text-xs">Cash</span>
                </button>
                <button
                  onClick={() => setPaymentMethod("card")}
                  className={`p-2 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                    paymentMethod === "card"
                      ? "border-blue-500 bg-blue-500/20"
                      : "border-white/20 bg-white/5"
                  }`}
                >
                  <CreditCard className="h-4 w-4 text-blue-400" />
                  <span className="text-white text-xs">Card</span>
                </button>
                <button
                  onClick={() => setPaymentMethod("account")}
                  className={`p-2 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                    paymentMethod === "account"
                      ? "border-amber-500 bg-amber-500/20"
                      : "border-white/20 bg-white/5"
                  }`}
                >
                  <User className="h-4 w-4 text-amber-400" />
                  <span className="text-white text-xs">Acct</span>
                </button>
              </div>
            </div>
          </Card>

          {/* Order Summary */}
          <Card className="bg-white/10 border-white/20 backdrop-blur-xl p-4 rounded-2xl space-y-3">
            <h2 className="text-lg font-bold text-white">Order Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-white/70">
                <span>Items ({cartCount})</span>
                <span>{currencySymbol}{subtotal.toFixed(2)}</span>
              </div>
              {orderType === "delivery" && deliveryFee > 0 && (
                <div className="flex justify-between text-white/70">
                  <span>Delivery</span>
                  <span>{currencySymbol}{deliveryFee.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold text-white pt-2 border-t border-white/10">
                <span>Total</span>
                <span className="text-emerald-400">{currencySymbol}{total.toFixed(2)}</span>
              </div>
            </div>
            <Button
              onClick={handlePlaceOrder}
              disabled={placeOrderMutation.isPending || cart.length === 0}
              className="w-full h-14 text-lg font-bold bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 rounded-xl"
            >
              {placeOrderMutation.isPending ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <ChefHat className="h-5 w-5 mr-2" />
                  Send to Kitchen
                </>
              )}
            </Button>
          </Card>
        </div>

        {/* Right Panel - Menu */}
        <div className="flex-1 p-4 overflow-auto">
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/40" />
            <Input
              placeholder="Search menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40 rounded-xl"
            />
          </div>

          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-4 py-2 rounded-xl whitespace-nowrap font-medium transition-all ${
                !activeCategory
                  ? "bg-indigo-500 text-white"
                  : "bg-white/10 text-white/70 hover:bg-white/20"
              }`}
            >
              All Items
            </button>
            {categories.map((cat, i) => (
              <button
                key={cat.slug}
                onClick={() => setActiveCategory(cat.slug)}
                className={`px-4 py-2 rounded-xl whitespace-nowrap font-medium transition-all ${
                  activeCategory === cat.slug
                    ? `bg-gradient-to-r ${CATEGORY_COLORS[i % CATEGORY_COLORS.length]} text-white`
                    : "bg-white/10 text-white/70 hover:bg-white/20"
                }`}
              >
                {cat.name} ({cat.count})
              </button>
            ))}
          </div>

          {/* Menu Items Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredItems.map((item: MenuItem) => {
              const itemToppings = extraToppings.filter((t: ExtraTopping) => t.menuItemId === item.id);
              const itemGroups = toppingGroups.filter((g: any) => (g.menu_item_id || g.menuItemId) === item.id);
              const hasToppings = itemToppings.length > 0 || itemGroups.length > 0;
              
              return (
                <motion.div
                  key={item.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    if (hasToppings) {
                      setSelectedItem(item);
                      setSelectedToppings([]);
                      setShowToppingModal(true);
                    } else {
                      addToCart(item);
                    }
                  }}
                  className="bg-white/10 backdrop-blur-xl rounded-xl overflow-hidden cursor-pointer hover:bg-white/15 transition-all border border-white/10"
                >
                  {item.image && (
                    <div className="h-24 overflow-hidden">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-3">
                    <h3 className="font-bold text-white text-sm line-clamp-2">{item.name}</h3>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-emerald-400 font-bold">{currencySymbol}{Number(item.price).toFixed(2)}</span>
                      <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
                        <Plus className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

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
              className="fixed right-0 top-0 h-full w-full max-w-md z-50 flex flex-col bg-gradient-to-br from-slate-900 to-indigo-900"
            >
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Order Items</h2>
                <button onClick={() => setShowCart(false)} className="text-white/60 hover:text-white">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="flex-1 overflow-auto p-4 space-y-3">
                {cart.length === 0 ? (
                  <div className="text-center py-10">
                    <ShoppingCart className="h-16 w-16 mx-auto text-white/30 mb-4" />
                    <p className="text-white/60">No items yet</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.cartItemId} className="bg-white/10 rounded-xl p-3 flex gap-3">
                      <div className="flex-1">
                        <h4 className="font-bold text-white text-sm">{item.name}</h4>
                        <p className="text-emerald-400 font-medium">{currencySymbol}{item.price.toFixed(2)}</p>
                        {item.toppings.length > 0 && (
                          <div className="mt-1">
                            {item.toppings.map((t, idx) => (
                              <p key={idx} className="text-xs text-amber-400">+ {t.name} (+{currencySymbol}{t.price.toFixed(2)})</p>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => updateQuantity(item.cartItemId, -1)}
                            className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center text-white"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-white font-bold w-6 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.cartItemId, 1)}
                            className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center text-white"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => removeFromCart(item.cartItemId)}
                            className="ml-auto text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-4 border-t border-white/10 space-y-3">
                  <div className="flex justify-between text-lg font-bold text-white">
                    <span>Total</span>
                    <span className="text-emerald-400">{currencySymbol}{total.toFixed(2)}</span>
                  </div>
                  <Button
                    onClick={() => { setShowCart(false); }}
                    className="w-full h-12 font-bold bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl"
                  >
                    Continue
                  </Button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Topping Modal */}
      <Dialog open={showToppingModal} onOpenChange={setShowToppingModal}>
        <DialogContent className="bg-slate-900 border-white/20 text-white max-w-sm rounded-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{selectedItem?.name}</DialogTitle>
          </DialogHeader>
          
          <p className="text-2xl font-bold text-emerald-400">{currencySymbol}{Number(selectedItem?.price || 0).toFixed(2)}</p>

          {/* Topping Groups */}
          {(() => {
            const itemGroups = toppingGroups.filter((g: any) => (g.menu_item_id || g.menuItemId) === selectedItem?.id);
            const getOptionsForGroup = (groupId: string) => toppingOptions.filter((o: any) => o.group_id === groupId);
            
            return itemGroups.length > 0 && (
              <div className="space-y-4">
                {itemGroups.map((group: any) => (
                  <div key={group.id}>
                    <h3 className="text-sm font-bold text-amber-400 mb-2">{group.headline || 'Options'}</h3>
                    <div className="space-y-2">
                      {getOptionsForGroup(group.id).map((option: any) => (
                        <label
                          key={option.id}
                          onClick={() => toggleTopping({ id: option.id, name: option.name, price: option.price } as any)}
                          className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                            selectedToppings.some(t => t.id === option.id)
                              ? "bg-emerald-500/20 border-emerald-500"
                              : "bg-white/5 border-white/10"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={selectedToppings.some(t => t.id === option.id)}
                              className="border-white/30 data-[state=checked]:bg-emerald-500"
                            />
                            <span className="text-white">{option.name}</span>
                          </div>
                          <span className="text-amber-400 font-medium">+{currencySymbol}{Number(option.price).toFixed(2)}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* Extra Toppings */}
          {(() => {
            const itemToppings = extraToppings.filter((t: any) => t.menuItemId === selectedItem?.id);
            return itemToppings.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-cyan-400">Add Extras:</p>
                {itemToppings.map((topping) => (
                  <label
                    key={topping.id}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer ${
                      selectedToppings.some(t => t.id === topping.id)
                        ? "bg-emerald-500/20 border-emerald-500"
                        : "bg-white/5 border-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedToppings.some(t => t.id === topping.id)}
                        onCheckedChange={() => toggleTopping(topping)}
                        className="border-white/30 data-[state=checked]:bg-emerald-500"
                      />
                      <span className="text-white">{topping.name}</span>
                    </div>
                    <span className="text-amber-400 font-medium">+{currencySymbol}{Number(topping.price).toFixed(2)}</span>
                  </label>
                ))}
              </div>
            );
          })()}

          <Button
            onClick={() => {
              if (selectedItem) {
                addToCart(selectedItem, selectedToppings);
                setShowToppingModal(false);
              }
            }}
            className="w-full h-14 text-lg font-bold bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl mt-4"
          >
            Add to Order - {currencySymbol}{(Number(selectedItem?.price || 0) + selectedToppings.reduce((s, t) => s + t.price, 0)).toFixed(2)}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
