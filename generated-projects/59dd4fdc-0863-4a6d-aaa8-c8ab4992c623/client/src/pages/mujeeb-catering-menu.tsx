import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, ShoppingCart, Plus, Minus, Phone, MapPin, Search, ChefHat, Clock, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

const MAGIC_SOUND = "data:audio/wav;base64,UklGRl9vT19teleVAAAA==";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface MenuCategory {
  id: string;
  name: string;
  slug: string;
  icon: string;
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number | string;
  category: string;
  image: string;
  available?: boolean;
}

export default function MujeebCateringMenu() {
  const [, setLocation] = useLocation();
  
  const { data: menuCategories = [] } = useQuery<MenuCategory[]>({
    queryKey: ["/api/menu-categories", { restaurantId: "mujeeb-catering-001" }],
    queryFn: async () => {
      const res = await fetch("/api/menu-categories?restaurantId=mujeeb-catering-001");
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json();
    }
  });

  const { data: menuItems = [] } = useQuery<MenuItem[]>({
    queryKey: ["/api/menu", { restaurantId: "mujeeb-catering-001" }],
    queryFn: async () => {
      const res = await fetch("/api/menu?restaurantId=mujeeb-catering-001");
      if (!res.ok) throw new Error("Failed to fetch menu");
      return res.json();
    }
  });

  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  
  useEffect(() => {
    if (menuCategories.length > 0 && !activeCategory) {
      setActiveCategory(menuCategories[0].id);
    }
  }, [menuCategories, activeCategory]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showBooking, setShowBooking] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [orderType, setOrderType] = useState<"delivery" | "collection">("delivery");
  const [isProcessing, setIsProcessing] = useState(false);

  const playSound = () => {
    const audio = new Audio(MAGIC_SOUND);
    audio.volume = 0.1;
    audio.play().catch(() => {});
  };

  const addToCart = (item: MenuItem) => {
    playSound();
    const itemPrice = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { id: item.id, name: item.name, price: itemPrice, quantity: 1, image: item.image }];
    });
  };

  const removeFromCart = (id: string) => {
    playSound();
    setCart(prev => {
      const existing = prev.find(i => i.id === id);
      if (existing && existing.quantity > 1) {
        return prev.map(i => i.id === id ? { ...i, quantity: i.quantity - 1 } : i);
      }
      return prev.filter(i => i.id !== id);
    });
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const filteredItems = searchQuery 
    ? menuItems.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : menuItems.filter(item => item.category === activeCategory || !activeCategory);

  const handleBooking = () => {
    toast({ title: "Booking Submitted!", description: "We'll confirm your reservation shortly." });
    setShowBooking(false);
  };

  return (
    <div className="min-h-screen bg-[#1a1a2e]">
      <div className="flex-1">
        <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-[#1a1a2e]/95 via-[#16213e]/95 to-[#1a1a2e]/95 backdrop-blur-lg">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => { playSound(); setLocation("/mujeeb-catering/welcome"); }}
                className="p-2 bg-white/10 hover:bg-orange-500/20 rounded-full"
              >
                <ArrowLeft className="w-5 h-5 text-orange-400" />
              </motion.button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF8C00] to-[#FF4500] flex items-center justify-center">
                  <ChefHat className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white">Mujeeb & Catering</h1>
                  <p className="text-xs text-orange-400">Our Menu</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden md:block relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input
                  placeholder="Search menu..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40 rounded-full"
                />
              </div>
              {cartCount > 0 && (
                <button 
                  onClick={() => { playSound(); setShowCart(true); }}
                  className="relative p-3 bg-gradient-to-r from-[#FF8C00] to-[#FF4500] rounded-full cursor-pointer hover:scale-105 transition-transform"
                  data-testid="button-open-cart"
                >
                  <ShoppingCart className="w-5 h-5 text-white" />
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-white text-orange-500 text-xs font-bold rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                </button>
              )}
            </div>
          </div>

          <div className="border-t border-white/10">
            <div className="max-w-6xl mx-auto px-4">
              <div className="flex items-center gap-2 py-3 overflow-x-auto scrollbar-hide">
                {menuCategories.map((cat) => (
                  <motion.button
                    key={cat.id}
                    whileHover={{ scale: 1.05 }}
                    onClick={() => { playSound(); setActiveCategory(cat.id); setSearchQuery(""); }}
                    className={`px-5 py-2 rounded-full font-medium whitespace-nowrap transition-all ${
                      activeCategory === cat.id 
                        ? "bg-gradient-to-r from-[#FF8C00] to-[#FF4500] text-white" 
                        : "bg-white/10 text-white/70 hover:text-white"
                    }`}
                  >
                    <span className="mr-2">{cat.icon}</span>
                    {cat.name}
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        </header>

        <main className="pt-36 pb-20 px-4">
          <div className="max-w-6xl mx-auto">
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <h2 className="text-3xl font-bold text-white mb-2">
                {menuCategories.find(c => c.id === activeCategory)?.icon}{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF8C00] to-[#FFD700]">
                  {menuCategories.find(c => c.id === activeCategory)?.name}
                </span>
              </h2>
              <p className="text-white/50">Discover our delicious selection</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {filteredItems.map((item, index) => {
                const colorSchemes = [
                  { border: "hover:border-orange-400/60", shadow: "hover:shadow-orange-500/20", accent: "border-orange-400", accentBg: "bg-orange-400", btnGradient: "from-orange-500 to-red-500", btnShadow: "shadow-orange-500/30" },
                  { border: "hover:border-emerald-400/60", shadow: "hover:shadow-emerald-500/20", accent: "border-emerald-400", accentBg: "bg-emerald-400", btnGradient: "from-emerald-500 to-teal-500", btnShadow: "shadow-emerald-500/30" },
                  { border: "hover:border-purple-400/60", shadow: "hover:shadow-purple-500/20", accent: "border-purple-400", accentBg: "bg-purple-400", btnGradient: "from-purple-500 to-pink-500", btnShadow: "shadow-purple-500/30" },
                  { border: "hover:border-cyan-400/60", shadow: "hover:shadow-cyan-500/20", accent: "border-cyan-400", accentBg: "bg-cyan-400", btnGradient: "from-cyan-500 to-blue-500", btnShadow: "shadow-cyan-500/30" },
                  { border: "hover:border-amber-400/60", shadow: "hover:shadow-amber-500/20", accent: "border-amber-400", accentBg: "bg-amber-400", btnGradient: "from-amber-500 to-yellow-500", btnShadow: "shadow-amber-500/30" },
                  { border: "hover:border-rose-400/60", shadow: "hover:shadow-rose-500/20", accent: "border-rose-400", accentBg: "bg-rose-400", btnGradient: "from-rose-500 to-pink-500", btnShadow: "shadow-rose-500/30" },
                  { border: "hover:border-indigo-400/60", shadow: "hover:shadow-indigo-500/20", accent: "border-indigo-400", accentBg: "bg-indigo-400", btnGradient: "from-indigo-500 to-violet-500", btnShadow: "shadow-indigo-500/30" },
                  { border: "hover:border-lime-400/60", shadow: "hover:shadow-lime-500/20", accent: "border-lime-400", accentBg: "bg-lime-400", btnGradient: "from-lime-500 to-green-500", btnShadow: "shadow-lime-500/30" },
                ];
                const scheme = colorSchemes[index % colorSchemes.length];
                
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ y: -8, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => addToCart(item)}
                    className={`group cursor-pointer bg-white/5 backdrop-blur-xl rounded-[28px] overflow-hidden border border-white/10 ${scheme.border} hover:shadow-2xl ${scheme.shadow} transition-all duration-300`}
                  >
                    <div className="relative aspect-square overflow-hidden rounded-t-[28px]">
                      <img 
                        src={item.image} 
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <div className="absolute top-4 right-4 px-4 py-2 bg-black/40 backdrop-blur-md rounded-full border border-white/20">
                        <span className="text-white font-bold text-lg">£{(typeof item.price === 'string' ? parseFloat(item.price) : item.price).toFixed(2)}</span>
                      </div>
                      <div className="absolute bottom-4 left-4 right-4">
                        <h3 className="text-xl font-bold text-white drop-shadow-lg">{item.name}</h3>
                      </div>
                    </div>
                    <div className="p-5 bg-gradient-to-b from-white/5 to-transparent">
                      <p className="text-white/60 text-sm mb-4 line-clamp-2">{item.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-5 h-5 rounded-full border-2 ${scheme.accent} flex items-center justify-center group-hover:${scheme.accentBg} transition-colors`}>
                            <div className={`w-2 h-2 rounded-full ${scheme.accentBg} opacity-0 group-hover:opacity-100 transition-opacity`} />
                          </div>
                          <span className="text-white/60 text-sm group-hover:text-white transition-colors">Tap to add</span>
                        </div>
                        <motion.div
                          whileHover={{ scale: 1.1, rotate: 90 }}
                          className={`w-10 h-10 rounded-full bg-gradient-to-r ${scheme.btnGradient} flex items-center justify-center shadow-lg ${scheme.btnShadow}`}
                        >
                          <Plus className="w-5 h-5 text-white" />
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {filteredItems.length === 0 && (
              <div className="text-center py-20">
                <Search className="w-16 h-16 text-white/20 mx-auto mb-4" />
                <p className="text-white/40">No items found</p>
              </div>
            )}
          </div>
        </main>

        <footer className="py-12 px-4 bg-gradient-to-t from-[#0d0d1a] to-[#1a1a2e] border-t border-white/10">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF8C00] to-[#FF4500] flex items-center justify-center">
                    <ChefHat className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Mujeeb & Catering</h3>
                    <p className="text-orange-400 text-xs">Central London Excellence</p>
                  </div>
                </div>
                <p className="text-white/60 text-sm flex items-center justify-center md:justify-start gap-2">
                  <MapPin className="w-4 h-4 text-orange-400" /> 41 Hamilton Road, Ilford, IG1 2EU
                </p>
                <p className="text-white/60 text-sm flex items-center justify-center md:justify-start gap-2 mt-2">
                  <Phone className="w-4 h-4 text-orange-400" /> 07427 070000
                </p>
              </div>
              <div className="text-center">
                <h4 className="text-orange-400 font-bold mb-3">Opening Hours</h4>
                <p className="text-white/60 text-sm">Monday - Thursday: 11AM - 10PM</p>
                <p className="text-white/60 text-sm">Friday - Sunday: 11AM - 11PM</p>
              </div>
              <div className="text-center md:text-right">
                <h4 className="text-orange-400 font-bold mb-3">Quick Links</h4>
                <p className="text-white/60 hover:text-orange-400 text-sm cursor-pointer" onClick={() => setShowBooking(true)}>Book a Table</p>
                <p className="text-white/60 hover:text-orange-400 text-sm cursor-pointer mt-1" onClick={() => setLocation("/mujeeb-catering/welcome")}>Home</p>
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-white/10 text-center">
              <p className="text-white/40 text-sm">© 2024 Mujeeb & Catering. All rights reserved. Powered by Mujeeb AI</p>
            </div>
          </div>
        </footer>

        </div>

      <Dialog open={showBooking} onOpenChange={setShowBooking}>
        <DialogContent className="bg-[#16213e] border-white/20 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl text-orange-400">Book a Table</DialogTitle>
            <DialogDescription className="text-white/60">Reserve your spot for an unforgettable dining experience</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-white/80">Number of Guests</Label>
              <Select>
                <SelectTrigger className="bg-white/10 border-white/20 text-white mt-1">
                  <SelectValue placeholder="Select guests" />
                </SelectTrigger>
                <SelectContent>
                  {[1,2,3,4,5,6,7,8].map(n => <SelectItem key={n} value={String(n)}>{n} {n === 1 ? 'Guest' : 'Guests'}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-white/80">Preferred Date</Label>
              <Input type="date" className="bg-white/10 border-white/20 text-white mt-1" />
            </div>
            <div>
              <Label className="text-white/80">Time</Label>
              <Select>
                <SelectTrigger className="bg-white/10 border-white/20 text-white mt-1">
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  {["12:00", "13:00", "14:00", "18:00", "19:00", "20:00", "21:00"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-white/80">Your Name</Label>
              <Input placeholder="Enter your name" className="bg-white/10 border-white/20 text-white placeholder:text-white/40 mt-1" />
            </div>
            <div>
              <Label className="text-white/80">Phone Number</Label>
              <Input placeholder="Your phone number" className="bg-white/10 border-white/20 text-white placeholder:text-white/40 mt-1" />
            </div>
            <Button onClick={handleBooking} className="w-full py-6 bg-gradient-to-r from-[#FF8C00] to-[#FF4500] font-bold mt-4">
              <Calendar className="mr-2 h-5 w-5" />
              Confirm Booking
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cart Dialog */}
      <Dialog open={showCart} onOpenChange={setShowCart}>
        <DialogContent className="bg-[#1a1a2e] border-orange-500/30 text-white max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl text-orange-400 flex items-center gap-2">
              <ShoppingCart className="h-6 w-6" />
              Your Order ({cartCount} items)
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {cart.length === 0 ? (
              <p className="text-white/60 text-center py-8">Your cart is empty</p>
            ) : (
              <>
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                    <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-lg" />
                    <div className="flex-1">
                      <p className="font-medium text-white">{item.name}</p>
                      <p className="text-orange-400">£{item.price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-bold">{item.quantity}</span>
                      <button
                        onClick={() => addToCart({ id: item.id, name: item.name, price: item.price, category: "", description: "", image: item.image })}
                        className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center hover:bg-orange-600"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                <div className="border-t border-white/10 pt-4 mt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-orange-400">£{cartTotal.toFixed(2)}</span>
                  </div>
                </div>
                <Button 
                  className="w-full py-6 bg-gradient-to-r from-[#FF8C00] to-[#FF4500] font-bold text-lg"
                  onClick={() => {
                    setShowCart(false);
                    setShowCheckout(true);
                  }}
                >
                  Proceed to Checkout - £{cartTotal.toFixed(2)}
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Checkout Dialog */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="bg-[#1a1a2e] border-orange-500/30 text-white max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl text-orange-400 flex items-center gap-2">
              <ShoppingCart className="h-6 w-6" />
              Checkout
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {/* Order Summary */}
            <div className="bg-white/5 rounded-lg p-4">
              <h3 className="font-bold text-white mb-3">Order Summary</h3>
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between text-sm py-1">
                  <span className="text-white/80">{item.quantity}x {item.name}</span>
                  <span className="text-orange-400">£{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t border-white/10 mt-3 pt-3 flex justify-between font-bold">
                <span>Total:</span>
                <span className="text-orange-400">£{cartTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Order Type */}
            <div>
              <Label className="text-orange-300 mb-2 block">Order Type</Label>
              <div className="flex gap-3">
                <Button
                  variant={orderType === "delivery" ? "default" : "outline"}
                  onClick={() => setOrderType("delivery")}
                  className={orderType === "delivery" ? "bg-orange-500 flex-1" : "flex-1 border-orange-500/30 text-white"}
                >
                  🚗 Delivery
                </Button>
                <Button
                  variant={orderType === "collection" ? "default" : "outline"}
                  onClick={() => setOrderType("collection")}
                  className={orderType === "collection" ? "bg-orange-500 flex-1" : "flex-1 border-orange-500/30 text-white"}
                >
                  🏪 Collection
                </Button>
              </div>
            </div>

            {/* Customer Details */}
            <div>
              <Label className="text-orange-300">Your Name *</Label>
              <Input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Full name"
                className="bg-white/10 border-orange-500/30 text-white placeholder:text-white/50 mt-1"
              />
            </div>
            <div>
              <Label className="text-orange-300">Phone Number *</Label>
              <Input
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="+44 7XXX XXXXXX"
                className="bg-white/10 border-orange-500/30 text-white placeholder:text-white/50 mt-1"
              />
            </div>
            <div>
              <Label className="text-orange-300">Email</Label>
              <Input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="your@email.com"
                className="bg-white/10 border-orange-500/30 text-white placeholder:text-white/50 mt-1"
              />
            </div>
            {orderType === "delivery" && (
              <div>
                <Label className="text-orange-300">Delivery Address *</Label>
                <Input
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="Full delivery address"
                  className="bg-white/10 border-orange-500/30 text-white placeholder:text-white/50 mt-1"
                />
              </div>
            )}

            {/* Payment Buttons */}
            <div className="space-y-3 pt-4 border-t border-white/10">
              <Button 
                className="w-full py-6 bg-gradient-to-r from-[#FF8C00] to-[#FF4500] font-bold text-lg"
                disabled={isProcessing || !customerName || !customerPhone || (orderType === "delivery" && !customerAddress)}
                onClick={async () => {
                  if (!customerName || !customerPhone) {
                    toast({ title: "Please fill required fields", variant: "destructive" });
                    return;
                  }
                  if (orderType === "delivery" && !customerAddress) {
                    toast({ title: "Please enter delivery address", variant: "destructive" });
                    return;
                  }
                  setIsProcessing(true);
                  try {
                    const response = await fetch("/api/orders", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        restaurantId: "mujeeb-catering-001",
                        customerName,
                        customerPhone,
                        customerEmail,
                        customerAddress: orderType === "delivery" ? customerAddress : null,
                        orderType,
                        items: cart.map(item => ({
                          menuItemId: item.id,
                          name: item.name,
                          price: item.price,
                          quantity: item.quantity,
                        })),
                        subtotal: cartTotal,
                        total: cartTotal,
                        paymentMethod: "card",
                        status: "pending",
                      }),
                    });
                    if (response.ok) {
                      const order = await response.json();
                      // Redirect to Stripe checkout or show success
                      toast({ title: "Order Placed!", description: `Order #${order.id?.slice(-6) || 'confirmed'} - We'll contact you shortly.` });
                      setCart([]);
                      setShowCheckout(false);
                      setCustomerName("");
                      setCustomerPhone("");
                      setCustomerEmail("");
                      setCustomerAddress("");
                    } else {
                      toast({ title: "Order Failed", description: "Please try again.", variant: "destructive" });
                    }
                  } catch (error) {
                    toast({ title: "Order Failed", description: "Please try again.", variant: "destructive" });
                  } finally {
                    setIsProcessing(false);
                  }
                }}
              >
                {isProcessing ? "Processing..." : `Pay £${cartTotal.toFixed(2)} - Card`}
              </Button>
              <Button 
                variant="outline"
                className="w-full py-6 border-orange-500/30 text-white font-bold text-lg"
                disabled={isProcessing || !customerName || !customerPhone || (orderType === "delivery" && !customerAddress)}
                onClick={async () => {
                  if (!customerName || !customerPhone) {
                    toast({ title: "Please fill required fields", variant: "destructive" });
                    return;
                  }
                  setIsProcessing(true);
                  try {
                    const response = await fetch("/api/orders", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        restaurantId: "mujeeb-catering-001",
                        customerName,
                        customerPhone,
                        customerEmail,
                        customerAddress: orderType === "delivery" ? customerAddress : null,
                        orderType,
                        items: cart.map(item => ({
                          menuItemId: item.id,
                          name: item.name,
                          price: item.price,
                          quantity: item.quantity,
                        })),
                        subtotal: cartTotal,
                        total: cartTotal,
                        paymentMethod: "cash",
                        status: "pending",
                      }),
                    });
                    if (response.ok) {
                      const order = await response.json();
                      toast({ title: "Order Placed!", description: `Order #${order.id?.slice(-6) || 'confirmed'} - Pay on ${orderType === "delivery" ? "delivery" : "collection"}.` });
                      setCart([]);
                      setShowCheckout(false);
                      setCustomerName("");
                      setCustomerPhone("");
                      setCustomerEmail("");
                      setCustomerAddress("");
                    } else {
                      toast({ title: "Order Failed", description: "Please try again.", variant: "destructive" });
                    }
                  } catch (error) {
                    toast({ title: "Order Failed", description: "Please try again.", variant: "destructive" });
                  } finally {
                    setIsProcessing(false);
                  }
                }}
              >
                💵 Pay Cash on {orderType === "delivery" ? "Delivery" : "Collection"}
              </Button>
            </div>

            <button 
              onClick={() => { setShowCheckout(false); setShowCart(true); }}
              className="w-full text-center text-white/60 hover:text-white text-sm py-2"
            >
              ← Back to Cart
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
