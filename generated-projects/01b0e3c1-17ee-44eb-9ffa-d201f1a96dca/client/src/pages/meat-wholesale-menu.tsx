import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ShoppingCart, Plus, Minus, Phone, MapPin, Search, X, ChevronRight, ChevronDown, Clock, Truck, Award, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const softClickSound = () => {
  const audio = new Audio("data:audio/wav;base64,UklGRl9vT19teleVAAAAV0FWRWZtdCAQAAAAAQABAJYEAACWBAAABABIAAAAZGF0YQ");
  audio.volume = 0.1;
  audio.play().catch(() => {});
};

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  available: boolean;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  parentId?: string | null;
}

interface CartItem extends MenuItem {
  quantity: number;
}

export default function MeatWholesaleMenu() {
  const [, setLocation] = useLocation();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const menuRef = useRef<HTMLDivElement>(null);

  const toggleExpanded = (categoryId: string) => {
    softClickSound();
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const { data: restaurant } = useQuery({
    queryKey: ["/api/restaurants/meat-wholesale"],
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/menu-categories", { restaurantId: "meat-wholesale-001" }],
    queryFn: async () => {
      const res = await fetch("/api/menu-categories?restaurantId=meat-wholesale-001");
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json();
    }
  });

  const { data: menuItems = [] } = useQuery<MenuItem[]>({
    queryKey: ["/api/menu", { restaurantId: "meat-wholesale-001" }],
    queryFn: async () => {
      const res = await fetch("/api/menu?restaurantId=meat-wholesale-001");
      if (!res.ok) throw new Error("Failed to fetch menu");
      return res.json();
    }
  });

  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0]?.id);
    }
  }, [categories, activeCategory]);

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = !activeCategory || item.category === activeCategory;
    const matchesSearch = !searchQuery || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch && item.available;
  });

  const addToCart = (item: MenuItem) => {
    softClickSound();
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id);
      if (existing) {
        return prev.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    softClickSound();
    setCart(prev => {
      const existing = prev.find(c => c.id === itemId);
      if (existing && existing.quantity > 1) {
        return prev.map(c => c.id === itemId ? { ...c, quantity: c.quantity - 1 } : c);
      }
      return prev.filter(c => c.id !== itemId);
    });
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const scrollToCategory = (categoryId: string) => {
    softClickSound();
    setActiveCategory(categoryId);
    const element = document.getElementById(`category-${categoryId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header - Same style as welcome page */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-[#1a0000]/95 via-[#2a0808]/95 to-[#1a0000]/95 backdrop-blur-lg"
      >
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => { softClickSound(); setLocation("/meat-wholesale/welcome"); }}
              className="p-2 bg-white/10 hover:bg-[#FFD700]/20 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-[#FFD700]" />
            </motion.button>
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => { softClickSound(); setLocation("/meat-wholesale/welcome"); }}
            >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FFD700] to-[#B8860B] flex items-center justify-center shadow-lg shadow-[#FFD700]/30">
              <span className="text-2xl">🥩</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-wide">MEAT WHOLESALE</h1>
              <p className="text-xs text-[#FFD700]/80">Premium Fresh Cuts</p>
            </div>
          </motion.div>
          </div>
          
          <nav className="hidden md:flex items-center gap-8">
            {["Home", "Products", "About", "Contact"].map((item) => (
              <motion.a
                key={item}
                whileHover={{ scale: 1.1, color: "#FFD700" }}
                onClick={() => { if (item === "Home") setLocation("/meat-wholesale/welcome"); }}
                className="text-white/80 hover:text-[#FFD700] font-medium cursor-pointer transition-colors"
              >
                {item}
              </motion.a>
            ))}
          </nav>
          
          <div className="flex items-center gap-4">
            <motion.a
              whileHover={{ scale: 1.05 }}
              href="tel:07427070000"
              className="hidden md:flex items-center gap-2 text-white/80 hover:text-[#FFD700] transition-colors"
            >
              <Phone className="w-4 h-4" />
              <span>07427 070000</span>
            </motion.a>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { softClickSound(); setShowCart(true); }}
              className="relative px-4 py-2 bg-[#FFD700] text-[#1a0000] font-bold rounded-full hover:bg-[#B8860B] transition-colors shadow-lg flex items-center gap-2"
            >
              <ShoppingCart className="w-5 h-5" />
              <span className="hidden sm:inline">Cart</span>
              {cartCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-[#8B0000] text-white text-xs font-bold rounded-full flex items-center justify-center"
                >
                  {cartCount}
                </motion.span>
              )}
            </motion.button>
          </div>
        </div>
      </motion.header>

      <div className="flex pt-20">
        {/* Sidebar */}
        <motion.aside
          initial={{ x: -300 }}
          animate={{ x: sidebarOpen ? 0 : -260 }}
          className="fixed left-0 top-20 bottom-0 w-72 bg-gradient-to-b from-[#1a0000] via-[#150505] to-[#0d0d0d] z-40 overflow-y-auto scrollbar-thin scrollbar-thumb-[#8B0000] scrollbar-track-transparent"
        >
          <div className="p-4">
            {/* Search in sidebar */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
              <Input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 bg-white/10 border-[#FFD700]/20 text-white placeholder:text-white/50 focus:border-[#FFD700]/50"
              />
            </div>

            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-[#FFD700]">Categories</h2>
              <Badge className="bg-[#8B0000] text-white">{categories.filter(c => !c.parentId).length}</Badge>
            </div>
            <div className="space-y-2">
              {categories.filter(c => !c.parentId).map((category, index) => {
                const subcategories = categories.filter(c => c.parentId === category.id);
                const hasSubcategories = subcategories.length > 0;
                const isExpanded = expandedCategories.has(category.id);
                
                return (
                  <div key={category.id}>
                    <motion.button
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ x: hasSubcategories ? 0 : 10, backgroundColor: "rgba(139,0,0,0.3)" }}
                      onClick={() => {
                        if (hasSubcategories) {
                          toggleExpanded(category.id);
                        } else {
                          scrollToCategory(category.id);
                        }
                      }}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-300 group ${
                        activeCategory === category.id
                          ? "bg-gradient-to-r from-[#8B0000] to-[#a50000] shadow-lg shadow-[#8B0000]/30"
                          : "bg-white/5 hover:bg-white/10"
                      }`}
                    >
                      <span className="text-2xl group-hover:scale-125 transition-transform duration-300">
                        {category.icon || "🥩"}
                      </span>
                      <span className={`flex-1 text-left font-medium ${
                        activeCategory === category.id ? "text-white" : "text-white/80"
                      }`}>
                        {category.name}
                      </span>
                      {hasSubcategories ? (
                        <ChevronDown className={`w-4 h-4 transition-all duration-300 ${
                          isExpanded ? "rotate-180 text-[#FFD700]" : "text-white/30 group-hover:text-white/60"
                        }`} />
                      ) : (
                        <ChevronRight className={`w-4 h-4 transition-all duration-300 ${
                          activeCategory === category.id 
                            ? "text-[#FFD700] translate-x-1" 
                            : "text-white/30 group-hover:text-white/60"
                        }`} />
                      )}
                    </motion.button>
                    
                    {/* Subcategories dropdown */}
                    <AnimatePresence>
                      {hasSubcategories && isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden ml-4 mt-1 space-y-1"
                        >
                          {subcategories.map((sub) => (
                            <motion.button
                              key={sub.id}
                              whileHover={{ x: 5, backgroundColor: "rgba(139,0,0,0.2)" }}
                              onClick={() => scrollToCategory(sub.id)}
                              className={`w-full flex items-center gap-2 p-2 pl-4 rounded-lg transition-all duration-300 border-l-2 ${
                                activeCategory === sub.id
                                  ? "border-[#FFD700] bg-[#8B0000]/30 text-white"
                                  : "border-white/20 text-white/70 hover:text-white hover:border-[#FFD700]/50"
                              }`}
                            >
                              <span className="text-lg">{sub.icon || "•"}</span>
                              <span className="text-sm font-medium">{sub.name}</span>
                            </motion.button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            {/* Info section */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-white/70">
                  <Truck className="w-5 h-5 text-[#FFD700]" />
                  <span className="text-sm">Same Day Delivery</span>
                </div>
                <div className="flex items-center gap-3 text-white/70">
                  <ShieldCheck className="w-5 h-5 text-[#FFD700]" />
                  <span className="text-sm">100% Halal Certified</span>
                </div>
                <div className="flex items-center gap-3 text-white/70">
                  <Award className="w-5 h-5 text-[#FFD700]" />
                  <span className="text-sm">Premium Quality</span>
                </div>
                <div className="flex items-center gap-3 text-white/70">
                  <Clock className="w-5 h-5 text-[#FFD700]" />
                  <span className="text-sm">Mon-Sat: 8AM - 6PM</span>
                </div>
              </div>
            </div>
          </div>
        </motion.aside>

        {/* Toggle sidebar button (mobile) */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="fixed left-0 top-1/2 -translate-y-1/2 z-50 p-2 bg-[#8B0000] text-white rounded-r-lg shadow-lg md:hidden"
        >
          <ChevronRight className={`w-5 h-5 transition-transform ${sidebarOpen ? "rotate-180" : ""}`} />
        </motion.button>

        {/* Main Content */}
        <main 
          ref={menuRef}
          className={`flex-1 min-h-screen transition-all duration-300 ${sidebarOpen ? "ml-72" : "ml-0"} p-6 bg-gradient-to-br from-[#0a1628] via-[#0d1b2a] to-[#1b263b]`}
        >
          {/* Mobile search */}
          <div className="md:hidden mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#FFD700]/50" />
              <Input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 bg-[#1b263b] border-[#FFD700]/30 text-white placeholder:text-white/50 focus:border-[#FFD700]/50"
              />
            </div>
          </div>

          {/* Category sections */}
          {categories.map((category) => {
            const categoryItems = filteredItems.filter(item => item.category === category.id);
            if (categoryItems.length === 0 && !activeCategory) return null;
            
            return (
              <motion.section
                key={category.id}
                id={`category-${category.id}`}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                className="mb-12"
              >
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-3xl">{category.icon || "🥩"}</span>
                  <h2 className="text-2xl md:text-3xl font-bold text-[#FFD700]">{category.name}</h2>
                  <div className="flex-1 h-px bg-gradient-to-r from-[#FFD700]/50 to-transparent" />
                </div>

                {categoryItems.length === 0 ? (
                  <div className="text-center py-12 bg-[#1b263b] rounded-2xl border border-[#FFD700]/20">
                    <span className="text-4xl mb-4 block">📦</span>
                    <p className="text-[#FFD700]/70">Products coming soon...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {categoryItems.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ y: -5, scale: 1.02 }}
                        className="group relative bg-[#1b263b] rounded-2xl overflow-hidden border border-[#FFD700]/20 hover:border-[#FFD700]/50 shadow-lg hover:shadow-xl hover:shadow-[#FFD700]/10 transition-all duration-300"
                      >
                        <div className="relative aspect-[4/3] overflow-hidden">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-[#8B0000]/10 to-[#4a0000]/10 flex items-center justify-center">
                              <span className="text-5xl">🥩</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="absolute top-3 right-3">
                            <Badge className="bg-[#8B0000] text-white font-bold shadow-lg">
                              £{Number(item.price).toFixed(2)}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="p-4">
                          <h3 className="text-lg font-bold text-white mb-1 group-hover:text-[#FFD700] transition-colors">
                            {item.name}
                          </h3>
                          <p className="text-white/60 text-sm mb-4 line-clamp-2">
                            {item.description || "Fresh quality meat"}
                          </p>
                          
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => addToCart(item)}
                            className="w-full py-3 bg-gradient-to-r from-[#FFD700] to-[#B8860B] hover:from-[#B8860B] hover:to-[#DAA520] text-[#0a1628] font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-[#FFD700]/20 transition-all duration-300"
                          >
                            <Plus className="w-5 h-5" />
                            Add to Cart
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.section>
            );
          })}

          {filteredItems.length === 0 && searchQuery && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <span className="text-6xl mb-4">🔍</span>
              <h3 className="text-xl font-bold text-[#FFD700] mb-2">No products found</h3>
              <p className="text-white/60">Try a different search term</p>
            </motion.div>
          )}
        </main>
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
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[#0a1628] z-50 shadow-2xl overflow-y-auto"
            >
              <div className="sticky top-0 bg-gradient-to-r from-[#FFD700] to-[#B8860B] p-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-[#0a1628] flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Your Cart
                </h2>
                <button
                  onClick={() => setShowCart(false)}
                  className="p-2 hover:bg-black/20 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-[#0a1628]" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                {cart.length === 0 ? (
                  <div className="text-center py-12">
                    <span className="text-5xl mb-4 block">🛒</span>
                    <p className="text-[#FFD700]/70">Your cart is empty</p>
                  </div>
                ) : (
                  <>
                    {cart.map((item) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        className="flex items-center gap-4 p-3 bg-[#1b263b] rounded-xl border border-[#FFD700]/20"
                      >
                        <div className="w-16 h-16 rounded-lg overflow-hidden">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-[#FFD700]/10 flex items-center justify-center">
                              <span className="text-2xl">🥩</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-white">{item.name}</h4>
                          <p className="text-[#FFD700] font-bold">£{(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="p-1 bg-[#0a1628] rounded-full text-white/60 hover:bg-[#FFD700] hover:text-[#0a1628] transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center font-bold text-white">{item.quantity}</span>
                          <button
                            onClick={() => addToCart(item)}
                            className="p-1 bg-[#0a1628] rounded-full text-white/60 hover:bg-[#FFD700] hover:text-[#0a1628] transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </>
                )}
              </div>

              {cart.length > 0 && (
                <div className="sticky bottom-0 bg-[#0a1628] p-4 border-t border-[#FFD700]/30">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-white/70">Total</span>
                    <span className="text-2xl font-bold text-[#FFD700]">£{cartTotal.toFixed(2)}</span>
                  </div>
                  <Button className="w-full py-6 bg-gradient-to-r from-[#FFD700] to-[#B8860B] hover:from-[#B8860B] hover:to-[#DAA520] text-[#0a1628] font-bold text-lg rounded-xl">
                    Proceed to Checkout
                  </Button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
