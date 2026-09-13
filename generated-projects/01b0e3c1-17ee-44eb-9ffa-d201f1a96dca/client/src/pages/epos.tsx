import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRestaurantBySlug, getMenuItems } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Trash2, Plus, Minus, Printer, Save, Calculator, Percent, DollarSign, X, Search, Receipt, CreditCard, Banknote, ShoppingCart, Menu, History, Eye, ChefHat, User, Settings, Check, Coins } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { getCurrencySymbol, type MenuItem, type Restaurant, type ExtraTopping } from "@shared/schema";
import { InstallPrompt } from "@/components/install-prompt";

const CATEGORY_COLORS = [
  "#ef4444", "#f97316", "#84cc16", "#eab308", "#22c55e", "#14b8a6", 
  "#ec4899", "#8b5cf6", "#f43f5e", "#06b6d4", "#10b981", "#f59e0b", 
  "#3b82f6", "#d97706", "#dc2626", "#ea580c", "#a855f7", "#0ea5e9"
];

interface SelectedTopping {
  id: string;
  name: string;
  price: number;
}

interface CartItem {
  menuItemId: string;
  cartItemId: string; // Unique ID for each cart entry (allows same item with different toppings)
  name: string;
  description?: string;
  price: number;
  quantity: number;
  image?: string;
  toppings: SelectedTopping[];
}

export default function EposPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const queryClient = useQueryClient();

  // Load saved state from localStorage on mount
  const getStorageKey = (key: string) => `epos_${slug}_${key}`;
  
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined' && slug) {
      const saved = localStorage.getItem(getStorageKey('cart'));
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(() => {
    if (typeof window !== 'undefined' && slug) {
      return localStorage.getItem(getStorageKey('activeCategory')) || null;
    }
    return null;
  });
  const [discountType, setDiscountType] = useState<"fixed" | "percent">(() => {
    if (typeof window !== 'undefined' && slug) {
      const saved = localStorage.getItem(getStorageKey('discountType'));
      return (saved === 'percent' ? 'percent' : 'fixed') as "fixed" | "percent";
    }
    return "fixed";
  });
  const [discountValue, setDiscountValue] = useState<string>(() => {
    if (typeof window !== 'undefined' && slug) {
      return localStorage.getItem(getStorageKey('discountValue')) || "";
    }
    return "";
  });
  const [customerName, setCustomerName] = useState(() => {
    if (typeof window !== 'undefined' && slug) {
      return localStorage.getItem(getStorageKey('customerName')) || "";
    }
    return "";
  });
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "account">(() => {
    if (typeof window !== 'undefined' && slug) {
      const saved = localStorage.getItem(getStorageKey('paymentMethod'));
      return (saved === 'card' ? 'card' : saved === 'account' ? 'account' : 'cash') as "cash" | "card" | "account";
    }
    return "cash";
  });
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<any>(null);
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState<any>(null);
  const [showToppingModal, setShowToppingModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [selectedToppings, setSelectedToppings] = useState<SelectedTopping[]>([]);
  const [editingCartItem, setEditingCartItem] = useState<CartItem | null>(null);
  const [showPrinterSettings, setShowPrinterSettings] = useState(false);
  const [showCashChangeModal, setShowCashChangeModal] = useState(false);
  const [amountTendered, setAmountTendered] = useState("");
  const [changeAmount, setChangeAmount] = useState(0);
  const [cashChangeTotal, setCashChangeTotal] = useState(0);
  const [vatRate, setVatRate] = useState<string>(() => {
    if (typeof window !== 'undefined' && slug) {
      return localStorage.getItem(`epos_${slug}_vatRate`) || "0";
    }
    return "0";
  });
  const [serviceFeeValue, setServiceFeeValue] = useState<string>(() => {
    if (typeof window !== 'undefined' && slug) {
      return localStorage.getItem(`epos_${slug}_serviceFee`) || "0";
    }
    return "0";
  });

  const [autoPrintEnabled, setAutoPrintEnabled] = useState(() => {
    if (typeof window !== 'undefined' && slug) {
      return localStorage.getItem(`epos_${slug}_autoPrint`) === 'true';
    }
    return false;
  });
  const [cashDrawerEnabled, setCashDrawerEnabled] = useState(() => {
    if (typeof window !== 'undefined' && slug) {
      return localStorage.getItem(`epos_${slug}_cashDrawer`) === 'true';
    }
    return false;
  });
  const [savedPrinterName, setSavedPrinterName] = useState(() => {
    if (typeof window !== 'undefined' && slug) {
      return localStorage.getItem(`epos_${slug}_printerName`) || '';
    }
    return '';
  });

  useEffect(() => {
    if (slug) {
      localStorage.setItem(`epos_${slug}_autoPrint`, String(autoPrintEnabled));
      localStorage.setItem(`epos_${slug}_cashDrawer`, String(cashDrawerEnabled));
      localStorage.setItem(`epos_${slug}_printerName`, savedPrinterName);
    }
  }, [autoPrintEnabled, cashDrawerEnabled, savedPrinterName, slug]);

  // PWA manifest switching for EPOS
  useEffect(() => {
    document.documentElement.classList.add("dark");
    
    const originalManifest = document.querySelector('link[rel="manifest"]');
    const originalManifestHref = originalManifest?.getAttribute('href');
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    const originalThemeColor = metaThemeColor?.getAttribute('content');
    const appleAppTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
    const originalAppleTitle = appleAppTitle?.getAttribute('content');

    if (originalManifest) originalManifest.setAttribute('href', '/manifest-epos.json');
    if (metaThemeColor) metaThemeColor.setAttribute('content', '#06b6d4');
    if (appleAppTitle) appleAppTitle.setAttribute('content', 'Link24-EPOS');
    
    return () => {
      document.documentElement.classList.remove("dark");
      if (originalManifest && originalManifestHref) originalManifest.setAttribute('href', originalManifestHref);
      if (metaThemeColor && originalThemeColor) metaThemeColor.setAttribute('content', originalThemeColor);
      if (appleAppTitle && originalAppleTitle) appleAppTitle.setAttribute('content', originalAppleTitle);
    };
  }, []);

  // Save state to localStorage when it changes
  useEffect(() => {
    if (slug) {
      localStorage.setItem(getStorageKey('cart'), JSON.stringify(cart));
    }
  }, [cart, slug]);

  useEffect(() => {
    if (slug) {
      if (activeCategory) {
        localStorage.setItem(getStorageKey('activeCategory'), activeCategory);
      } else {
        localStorage.removeItem(getStorageKey('activeCategory'));
      }
    }
  }, [activeCategory, slug]);

  useEffect(() => {
    if (slug) {
      localStorage.setItem(getStorageKey('discountType'), discountType);
      localStorage.setItem(getStorageKey('discountValue'), discountValue);
      localStorage.setItem(getStorageKey('customerName'), customerName);
      localStorage.setItem(getStorageKey('paymentMethod'), paymentMethod);
      localStorage.setItem(`epos_${slug}_vatRate`, vatRate);
      localStorage.setItem(`epos_${slug}_serviceFee`, serviceFeeValue);
    }
  }, [discountType, discountValue, customerName, paymentMethod, vatRate, serviceFeeValue, slug]);

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

  const { data: dbCategories = [] } = useQuery({
    queryKey: ["/api/menu-categories", restaurantId],
    queryFn: async () => {
      const response = await fetch(`/api/menu-categories?restaurantId=${restaurantId}`);
      return response.json();
    },
    enabled: !!restaurantId,
  });

  const { data: receiptHistory = [], refetch: refetchHistory } = useQuery({
    queryKey: ["/api/epos-orders", restaurantId],
    queryFn: async () => {
      const response = await fetch(`/api/restaurants/${restaurantId}/epos-orders`);
      if (!response.ok) throw new Error("Failed to fetch receipts");
      return response.json();
    },
    enabled: !!restaurantId && showHistoryModal,
  });

  const { data: extraToppings = [] } = useQuery<ExtraTopping[]>({
    queryKey: ["/api/extra-toppings", restaurantId],
    queryFn: async () => {
      const response = await fetch(`/api/restaurants/${restaurantId}/extra-toppings`);
      if (!response.ok) throw new Error("Failed to fetch toppings");
      return response.json();
    },
    enabled: !!restaurantId,
  });

  // Topping groups (Goes well with, Add a Drink, etc.)
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
      const response = await fetch(`/api/topping-group-options?restaurantId=${restaurantId}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!restaurantId,
  });

  const deleteReceiptMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/epos-orders/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete receipt");
    },
    onSuccess: () => {
      refetchHistory();
      toast({ title: "Receipt deleted", description: "The receipt has been removed from history." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete receipt", variant: "destructive" });
    }
  });

  const printReceiptDirect = useCallback((receiptData?: any) => {
    const data = receiptData || lastReceipt;
    if (!data || !restaurant) return;

    const printIframe = document.createElement('iframe');
    printIframe.style.position = 'fixed';
    printIframe.style.right = '0';
    printIframe.style.bottom = '0';
    printIframe.style.width = '0';
    printIframe.style.height = '0';
    printIframe.style.border = 'none';
    document.body.appendChild(printIframe);

    const doc = printIframe.contentDocument || printIframe.contentWindow?.document;
    if (!doc) return;

    const sym = currencySymbol;
    const itemsHtml = (data.items || []).map((item: any) => {
      let notesHtml = '';
      if (item.toppings?.length > 0) {
        notesHtml = item.toppings.map((t: any) => 
          `<div style="margin-left:16px;font-size:11px;">+ ${t.name} (${sym}${Number(t.price).toFixed(2)})</div>`
        ).join('');
      }
      const desc = item.description ? `<div style="margin-left:16px;font-size:10px;color:#666;">${item.description}</div>` : '';
      return `
        <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
          <span><b>${item.quantity}x</b> ${item.name}</span>
          <span>${sym}${Number(item.total).toFixed(2)}</span>
        </div>${desc}${notesHtml}`;
    }).join('');

    const vatHtml = Number(data.vatAmount) > 0 ? `
        <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
          <span>VAT (${Number(data.vatRate || 0)}%)</span><span>${sym}${Number(data.vatAmount).toFixed(2)}</span>
        </div>` : '';
    
    const serviceFeeHtml = Number(data.serviceFee) > 0 ? `
        <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
          <span>Service Fee</span><span>${sym}${Number(data.serviceFee).toFixed(2)}</span>
        </div>` : '';

    const changeHtml = (data.paymentMethod === 'cash' && data.amountTendered) ? `
      <div style="border-top:1px dashed #000;margin-top:6px;padding-top:6px;">
        <div style="display:flex;justify-content:space-between;font-size:13px;">
          <span>Tendered</span>
          <span>${sym}${Number(data.amountTendered).toFixed(2)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:16px;font-weight:bold;">
          <span>CHANGE</span>
          <span>${sym}${Number(data.changeGiven).toFixed(2)}</span>
        </div>
      </div>` : '';

    doc.open();
    doc.write(`<!DOCTYPE html><html><head><style>
      * { margin:0; padding:0; box-sizing:border-box; }
      body { font-family:'Courier New',monospace; width:72mm; font-size:12px; padding:6mm 2mm 2mm 4mm; }
      @page { size:72mm auto; margin:0; }
      @media print { body { width:72mm; } }
    </style></head><body>
      <div style="text-align:center;border-bottom:2px solid #000;padding-bottom:6px;margin-bottom:6px;">
        <div style="font-size:16px;font-weight:bold;">${restaurant.name}</div>
        ${restaurant.address ? `<div style="font-size:10px;">${restaurant.address}</div>` : ''}
        <div style="font-size:14px;font-weight:bold;margin-top:6px;">Receipt #${data.receiptNumber}</div>
        <div style="font-size:10px;">${data.createdAt ? new Date(data.createdAt).toLocaleString() : new Date().toLocaleString()}</div>
      </div>
      <div style="border-bottom:1px dashed #000;padding-bottom:6px;margin-bottom:6px;">
        ${itemsHtml}
      </div>
      <div>
        <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
          <span>Subtotal</span><span>${sym}${Number(data.subtotal || 0).toFixed(2)}</span>
        </div>
        ${Number(data.discountAmount) > 0 ? `<div style="display:flex;justify-content:space-between;margin-bottom:2px;">
          <span>Discount</span><span>-${sym}${Number(data.discountAmount).toFixed(2)}</span>
        </div>` : ''}
        ${vatHtml}
        ${serviceFeeHtml}
        <div style="display:flex;justify-content:space-between;font-size:16px;font-weight:bold;border-top:2px solid #000;padding-top:4px;margin-top:4px;">
          <span>TOTAL</span><span>${sym}${Number(data.total || 0).toFixed(2)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-top:4px;font-size:11px;">
          <span>Payment</span><span style="font-weight:bold;">${(data.paymentMethod || '').toUpperCase()}</span>
        </div>
        ${changeHtml}
      </div>
      ${data.customerName ? `<div style="margin-top:6px;font-size:11px;border-top:1px dashed #000;padding-top:4px;">Customer: ${data.customerName}</div>` : ''}
      <div style="text-align:center;margin-top:8px;padding-top:6px;border-top:1px dashed #000;">
        <div style="font-weight:bold;font-size:11px;">Thank you!</div>
      </div>
    </body></html>`);
    doc.close();

    setTimeout(() => {
      try {
        printIframe.contentWindow?.print();
      } catch (err) {
        console.warn('Print failed:', err);
      }
      setTimeout(() => {
        try {
          if (printIframe.parentNode) {
            document.body.removeChild(printIframe);
          }
        } catch (e) {}
      }, 3000);
    }, 500);
  }, [lastReceipt, restaurant, currencySymbol, cashDrawerEnabled]);

  const openCashDrawer = useCallback(() => {
    if (!cashDrawerEnabled) return;
    const drawerIframe = document.createElement('iframe');
    drawerIframe.style.position = 'fixed';
    drawerIframe.style.width = '0';
    drawerIframe.style.height = '0';
    drawerIframe.style.border = 'none';
    document.body.appendChild(drawerIframe);
    const doc = drawerIframe.contentDocument || drawerIframe.contentWindow?.document;
    if (!doc) return;
    doc.open();
    doc.write(`<!DOCTYPE html><html><head><style>@page{size:72mm auto;margin:0;}body{width:72mm;font-size:0;}</style></head><body>\x1B\x70\x00\x19\xFA</body></html>`);
    doc.close();
    setTimeout(() => {
      try {
        drawerIframe.contentWindow?.print();
      } catch (err) {
        console.warn('Cash drawer print failed:', err);
      }
      setTimeout(() => {
        try {
          if (drawerIframe.parentNode) document.body.removeChild(drawerIframe);
        } catch (e) {}
      }, 3000);
    }, 100);
  }, [cashDrawerEnabled]);

  const handleDeleteReceipt = (e: React.MouseEvent, receiptId: string) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this receipt?")) {
      deleteReceiptMutation.mutate(receiptId);
    }
  };

  const availableCategories = useMemo(() => {
    const usedCategoryIds = new Set(menuItems.map(item => item.category));
    
    // Map database categories by both ID and slug for flexibility
    const categoryMapById: Record<string, { id: string; name: string; icon: string }> = {};
    const categoryMapBySlug: Record<string, { id: string; name: string; icon: string }> = {};
    const categoryMapByName: Record<string, { id: string; name: string; icon: string }> = {};
    
    dbCategories.forEach((cat: { id?: string; dbId?: string; slug: string; name: string; icon: string }) => {
      const catId = cat.dbId || cat.id || cat.slug;
      const catData = { id: catId, name: cat.name, icon: cat.icon || "🍽️" };
      categoryMapById[catId] = catData;
      categoryMapBySlug[cat.slug] = catData;
      categoryMapByName[cat.name] = catData;
    });
    
    // Helper to check if string looks like a UUID
    const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
    
    // Return only categories that have items, with proper names from DB
    return Array.from(usedCategoryIds)
      .map(catId => {
        const found = categoryMapById[catId] || categoryMapBySlug[catId] || categoryMapByName[catId];
        if (found) return { ...found, id: catId };
        
        // For missing categories, don't show raw UUIDs - show "Uncategorized" or infer from first item
        if (isUUID(catId)) {
          const itemsInCat = menuItems.filter(m => m.category === catId);
          if (itemsInCat.length > 0) {
            // Try to infer a reasonable name from items (e.g., if all chicken items, call it "Chicken")
            const firstItem = itemsInCat[0].name.split(' ')[0];
            return { id: catId, name: `${firstItem} Items`, icon: "🍽️" };
          }
          return { id: catId, name: "Other", icon: "🍽️" };
        }
        
        return { id: catId, name: catId.charAt(0).toUpperCase() + catId.slice(1).replace(/-/g, ' '), icon: "🍽️" };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [menuItems, dbCategories]);

  // Auto-select first category when categories load, or reset if current category is invalid
  useEffect(() => {
    if (availableCategories.length > 0) {
      // Check if current activeCategory exists in available categories
      const categoryExists = activeCategory && availableCategories.some(cat => cat.id === activeCategory);
      if (!categoryExists) {
        setActiveCategory(availableCategories[0].id);
      }
    }
  }, [availableCategories, activeCategory]);

  const filteredItems = useMemo(() => {
    let items = menuItems.filter(item => item.available !== false);
    
    if (activeCategory) {
      items = items.filter(item => item.category === activeCategory);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = items.filter(item => 
        item.name.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query)
      );
    }
    
    return items;
  }, [menuItems, activeCategory, searchQuery]);

  // Open topping modal when clicking an item
  const handleItemClick = useCallback((item: MenuItem) => {
    setSelectedItem(item);
    setSelectedToppings([]);
    setEditingCartItem(null);
    setShowToppingModal(true);
  }, []);

  // Toggle topping selection
  const toggleTopping = useCallback((topping: ExtraTopping) => {
    setSelectedToppings(prev => {
      const exists = prev.find(t => t.id === topping.id);
      if (exists) {
        return prev.filter(t => t.id !== topping.id);
      }
      return [...prev, { id: topping.id, name: topping.name, price: Number(topping.price) }];
    });
  }, []);

  // Add item with toppings to cart
  const confirmAddToCart = useCallback(() => {
    if (!selectedItem) return;
    
    const cartItemId = `${selectedItem.id}-${Date.now()}`;
    const newItem: CartItem = {
      menuItemId: selectedItem.id,
      cartItemId,
      name: selectedItem.name,
      description: selectedItem.description || undefined,
      price: Number(selectedItem.price),
      quantity: 1,
      image: selectedItem.image || undefined,
      toppings: selectedToppings,
    };
    
    setCart(prev => [...prev, newItem]);
    setShowToppingModal(false);
    setSelectedItem(null);
    setSelectedToppings([]);
  }, [selectedItem, selectedToppings]);

  // Quick add without toppings (double-tap or skip)
  const quickAddToCart = useCallback((item: MenuItem) => {
    const cartItemId = `${item.id}-${Date.now()}`;
    setCart(prev => [...prev, {
      menuItemId: item.id,
      cartItemId,
      name: item.name,
      description: item.description || undefined,
      price: Number(item.price),
      quantity: 1,
      image: item.image || undefined,
      toppings: [],
    }]);
  }, []);

  // Edit toppings on existing cart item
  const editCartItemToppings = useCallback((cartItem: CartItem) => {
    const menuItem = menuItems.find(m => m.id === cartItem.menuItemId);
    if (menuItem) {
      setSelectedItem(menuItem);
      setSelectedToppings(cartItem.toppings);
      setEditingCartItem(cartItem);
      setShowToppingModal(true);
    }
  }, [menuItems]);

  // Update cart item with new toppings
  const updateCartItemToppings = useCallback(() => {
    if (!editingCartItem) return;
    
    setCart(prev => prev.map(item => 
      item.cartItemId === editingCartItem.cartItemId
        ? { ...item, toppings: selectedToppings }
        : item
    ));
    setShowToppingModal(false);
    setEditingCartItem(null);
    setSelectedItem(null);
    setSelectedToppings([]);
  }, [editingCartItem, selectedToppings]);

  const updateQuantity = useCallback((cartItemId: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.cartItemId === cartItemId) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null as any;
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(Boolean);
    });
  }, []);

  const removeFromCart = useCallback((cartItemId: string) => {
    setCart(prev => prev.filter(item => item.cartItemId !== cartItemId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setDiscountValue("");
    setCustomerName("");
  }, []);

  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => {
      const toppingsTotal = item.toppings.reduce((t, topping) => t + topping.price, 0);
      return sum + ((item.price + toppingsTotal) * item.quantity);
    }, 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    const val = parseFloat(discountValue) || 0;
    if (discountType === "percent") {
      return Math.min(subtotal, (subtotal * val) / 100);
    }
    return Math.min(subtotal, val);
  }, [subtotal, discountType, discountValue]);

  const vatAmount = useMemo(() => {
    const rate = parseFloat(vatRate) || 0;
    const afterDiscount = Math.max(0, subtotal - discountAmount);
    return (afterDiscount * rate) / 100;
  }, [subtotal, discountAmount, vatRate]);

  const serviceFeeAmount = useMemo(() => {
    return parseFloat(serviceFeeValue) || 0;
  }, [serviceFeeValue]);

  const total = useMemo(() => {
    return Math.max(0, subtotal - discountAmount + vatAmount + serviceFeeAmount);
  }, [subtotal, discountAmount, vatAmount, serviceFeeAmount]);

  const [shouldPrintAfterSave, setShouldPrintAfterSave] = useState(false);

  const saveReceiptMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/epos-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody?.details || errBody?.error || "Failed to save receipt");
      }
      return res.json();
    },
    onSuccess: (data) => {
      setLastReceipt(data);
      
      if (shouldPrintAfterSave) {
        setShouldPrintAfterSave(false);
        setShowReceiptModal(true);
        printReceiptDirect(data);
        if (cashDrawerEnabled && paymentMethod === 'cash') {
          setTimeout(() => openCashDrawer(), 500);
        }
        toast({
          title: "Receipt Printed",
          description: `Receipt #${data.receiptNumber} saved. Click 'Send to Kitchen' to complete.`,
        });
      } else {
        setShowReceiptModal(true);
        toast({
          title: "Receipt Saved",
          description: `Receipt #${data.receiptNumber} has been saved.`,
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to save receipt. Please try again.",
        variant: "destructive",
      });
      setShouldPrintAfterSave(false);
    },
  });

  const handleSaveReceipt = () => {
    if (cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Add items to the cart first.",
        variant: "destructive",
      });
      return;
    }

    const receiptData = {
      restaurantId,
      items: cart.map(item => {
        const toppingsTotal = item.toppings.reduce((sum, t) => sum + t.price, 0);
        const itemTotal = (item.price + toppingsTotal) * item.quantity;
        return {
          menuItemId: item.menuItemId,
          name: item.name,
          description: item.description || null,
          price: item.price,
          quantity: item.quantity,
          total: itemTotal,
          toppings: item.toppings.map(t => ({ name: t.name, price: t.price })),
        };
      }),
      subtotal: subtotal.toFixed(2),
      discountType: discountValue ? discountType : null,
      discountValue: discountValue || "0",
      discountAmount: discountAmount.toFixed(2),
      vatRate: vatRate || "0",
      vatAmount: vatAmount.toFixed(2),
      serviceFee: serviceFeeAmount.toFixed(2),
      total: total.toFixed(2),
      paymentMethod,
      customerName: customerName || null,
      amountTendered: paymentMethod === 'cash' && amountTendered ? parseFloat(amountTendered) : null,
      changeGiven: paymentMethod === 'cash' && amountTendered ? changeAmount : null,
    };

    saveReceiptMutation.mutate(receiptData);
  };

  const handlePrint = () => {
    if (cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Add items to the cart first.",
        variant: "destructive",
      });
      return;
    }
    if (paymentMethod === 'cash') {
      setCashChangeTotal(total);
      setAmountTendered("");
      setChangeAmount(0);
      setShowCashChangeModal(true);
    } else {
      setAmountTendered("");
      setChangeAmount(0);
      setShouldPrintAfterSave(true);
      handleSaveReceipt();
    }
  };

  const handleCashPaymentComplete = () => {
    setShowCashChangeModal(false);
    setShouldPrintAfterSave(true);
    handleSaveReceipt();
  };

  const printReceipt = () => {
    if (lastReceipt) {
      printReceiptDirect();
    }
  };

  // Send to Kitchen - creates a real order that shows on kitchen display
  const sendToKitchenMutation = useMutation({
    mutationFn: async () => {
      // Build items with full descriptions and toppings for kitchen display
      const itemsWithDetails = cart.map(cartItem => {
        const menuItem = menuItems.find(m => m.id === cartItem.menuItemId);
        const toppingsTotal = cartItem.toppings.reduce((sum, t) => sum + t.price, 0);
        
        // Build notes with description and toppings so chef sees full details
        const parts: string[] = [];
        if (menuItem?.description) {
          parts.push(menuItem.description);
        }
        if (cartItem.toppings.length > 0) {
          const toppingsList = cartItem.toppings.map(t => `+ ${t.name}`).join(", ");
          parts.push(`EXTRAS: ${toppingsList}`);
        }
        
        return {
          menuItemId: cartItem.menuItemId,
          name: cartItem.name,
          quantity: cartItem.quantity,
          price: (cartItem.price + toppingsTotal).toFixed(2),
          notes: parts.length > 0 ? parts.join(" | ") : undefined,
        };
      });

      const orderData = {
        order: {
          restaurantId,
          type: "dine-in",
          status: "new",
          customerName: customerName || "EPOS Order",
          phone: "",
          address: "",
          total: total.toFixed(2),
          paymentMethod: paymentMethod,
        },
        items: itemsWithDetails,
      };
      
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to send order");
      }
      return res.json();
    },
    onSuccess: (data) => {
      clearCart();
      toast({
        title: "Sent to Kitchen!",
        description: `Order #${data.orderNumber} has been sent to the kitchen.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send order to kitchen.",
        variant: "destructive",
      });
    },
  });

  const handleSendToKitchen = () => {
    if (cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Add items to the cart first.",
        variant: "destructive",
      });
      return;
    }
    sendToKitchenMutation.mutate();
  };

  const handleViewReceipt = (receipt: any) => {
    setViewingReceipt(receipt);
  };

  const handleReprintReceipt = () => {
    if (viewingReceipt) {
      const receiptToReprint = { ...viewingReceipt };
      setLastReceipt(receiptToReprint);
      setViewingReceipt(null);
      setShowHistoryModal(false);
      printReceiptDirect(receiptToReprint);
    }
  };

  const openHistoryModal = () => {
    setShowHistoryModal(true);
    if (restaurantId) {
      refetchHistory();
    }
  };

  const getCategoryColor = (categoryId: string) => {
    // Generate consistent color based on category ID hash
    const hash = categoryId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return CATEGORY_COLORS[hash % CATEGORY_COLORS.length];
  };

  if (loadingRestaurant) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <Calculator className="h-16 w-16 mx-auto mb-4 animate-pulse text-blue-400" />
          <p className="text-xl">Loading EPOS System...</p>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <Calculator className="h-16 w-16 mx-auto mb-4 text-red-400" />
          <p className="text-xl mb-2">Restaurant not found</p>
          <p className="text-gray-400 mb-4">The branch "{slug}" could not be found.</p>
          <Link href="/shop-login">
            <Button className="bg-blue-600 hover:bg-blue-700">Go to Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (loadingMenu) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <Calculator className="h-16 w-16 mx-auto mb-4 animate-pulse text-blue-400" />
          <p className="text-xl">Loading Menu...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @media print {
          .screen-only { display: none !important; }
          .no-print { display: none !important; }
          body, html, #root { 
            background: white !important; 
            margin: 0 !important; 
            padding: 0 !important;
          }
          @page { 
            size: 72mm auto;
            margin: 0;
          }
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 flex flex-col screen-only">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 px-3 md:px-6 py-3 md:py-4 flex justify-between items-center shadow-xl">
        <div className="flex items-center gap-2 md:gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white hover:bg-white/20 md:hidden"
            onClick={() => setShowMobileSidebar(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>
          <Link href={`/dashboard/${slug}`}>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 hidden md:flex">
              <ArrowLeft className="h-6 w-6" />
            </Button>
          </Link>
          <div className="flex items-center gap-2 md:gap-3">
            <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Calculator className="h-5 w-5 md:h-7 md:w-7 text-white" />
            </div>
            <div>
              <h1 className="text-lg md:text-2xl font-bold text-white">EPOS</h1>
              <p className="text-white/70 text-xs md:text-sm hidden sm:block">{restaurant?.name}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20 hidden md:flex items-center gap-2"
            onClick={() => setShowPrinterSettings(true)}
            data-testid="button-printer-settings"
          >
            <Settings className="h-5 w-5" />
            <span>Printer</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20 hidden md:flex items-center gap-2"
            onClick={openHistoryModal}
            data-testid="button-receipt-history"
          >
            <History className="h-5 w-5" />
            <span>History</span>
          </Button>
          <Badge className="bg-white/20 text-white text-sm md:text-lg px-2 md:px-4 py-1 md:py-2">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20 md:hidden"
            onClick={openHistoryModal}
            data-testid="button-receipt-history-mobile"
          >
            <History className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20 md:hidden relative"
            onClick={() => setShowMobileCart(true)}
          >
            <ShoppingCart className="h-6 w-6" />
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {cart.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            )}
          </Button>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {showMobileSidebar && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowMobileSidebar(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-gray-900 shadow-xl flex flex-col">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Categories</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowMobileSidebar(false)}>
                <X className="h-5 w-5 text-white" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {availableCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => { setActiveCategory(cat.id); setShowMobileSidebar(false); }}
                  className={`w-full text-left p-3 rounded-lg mb-1 flex items-center gap-3 ${
                    activeCategory === cat.id ? 'text-white' : 'text-gray-300 hover:bg-gray-800'
                  }`}
                  style={activeCategory === cat.id ? { backgroundColor: getCategoryColor(cat.id) } : {}}
                >
                  <span className="text-xl">{cat.icon}</span>
                  <span className="font-medium">{cat.name}</span>
                </button>
              ))}
            </div>
            <div className="p-4 border-t border-gray-700 space-y-2">
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => { setShowMobileSidebar(false); setShowPrinterSettings(true); }}
              >
                <Settings className="h-4 w-4 mr-2" /> Printer Settings
              </Button>
              <Link href={`/dashboard/${slug}`}>
                <Button className="w-full" variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Cart Overlay */}
      {showMobileCart && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowMobileCart(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-gray-800 shadow-xl flex flex-col">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between flex-shrink-0">
              <h2 className="text-lg font-bold text-white">Order ({cart.reduce((sum, item) => sum + item.quantity, 0)})</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowMobileCart(false)}>
                <X className="h-5 w-5 text-white" />
              </Button>
            </div>
            {/* Scrollable content area */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 border-b border-gray-700">
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Customer Name (optional)"
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div className="p-4 space-y-2">
                {cart.length === 0 ? (
                  <div className="py-8 flex flex-col items-center justify-center text-gray-500">
                    <Receipt className="h-16 w-16 mb-4 opacity-30" />
                    <p className="text-lg">No items in order</p>
                  </div>
                ) : (
                  cart.map(item => {
                    const toppingsTotal = item.toppings.reduce((sum, t) => sum + t.price, 0);
                    const itemTotal = (item.price + toppingsTotal) * item.quantity;
                    return (
                      <Card key={item.cartItemId} className="bg-gray-700 border-gray-600 p-3">
                        <div className="flex items-start gap-2">
                          <div className="flex-1">
                            <p className="font-medium text-white text-sm">{item.name}</p>
                            {item.description && (
                              <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{item.description}</p>
                            )}
                            {item.toppings.length > 0 && (
                              <div className="mt-0.5">
                                {item.toppings.map(t => (
                                  <div key={t.id} className="flex items-center gap-1 text-xs text-amber-400">
                                    <button
                                      onClick={() => {
                                        setCart(prev => prev.map(cartItem => 
                                          cartItem.cartItemId === item.cartItemId
                                            ? { ...cartItem, toppings: cartItem.toppings.filter(top => top.id !== t.id) }
                                            : cartItem
                                        ));
                                      }}
                                      className="text-red-400 hover:text-red-300 rounded p-0.5"
                                    >
                                      <Minus className="h-3 w-3" />
                                    </button>
                                    <span>{t.name} ({currencySymbol}{t.price.toFixed(2)})</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            <p className="text-emerald-400 font-bold text-sm">{currencySymbol}{itemTotal.toFixed(2)}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button size="icon" variant="outline" className="h-7 w-7 border-gray-500" onClick={() => updateQuantity(item.cartItemId, -1)}>
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-6 text-center text-white font-bold text-sm">{item.quantity}</span>
                            <Button size="icon" variant="outline" className="h-7 w-7 border-gray-500" onClick={() => updateQuantity(item.cartItemId, 1)}>
                              <Plus className="h-3 w-3" />
                            </Button>
                            <Button size="icon" variant="destructive" className="h-7 w-7" onClick={() => removeFromCart(item.cartItemId)}>
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })
                )}
              </div>
              {/* Checkout section - now inside scrollable area */}
              <div className="p-4 border-t border-gray-700 space-y-3">
                <div className="flex items-center gap-2">
                  <Select value={discountType} onValueChange={(v) => setDiscountType(v as "fixed" | "percent")}>
                    <SelectTrigger className="w-20 bg-gray-700 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">{currencySymbol}</SelectItem>
                      <SelectItem value="percent">%</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder="Discount"
                    className="flex-1 bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Subtotal</span>
                  <span>{currencySymbol}{subtotal.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-orange-400">
                    <span>Discount</span>
                    <span>-{currencySymbol}{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                {vatAmount > 0 && (
                  <div className="flex justify-between text-sm text-blue-400">
                    <span>VAT ({vatRate}%)</span>
                    <span>+{currencySymbol}{vatAmount.toFixed(2)}</span>
                  </div>
                )}
                {serviceFeeAmount > 0 && (
                  <div className="flex justify-between text-sm text-purple-400">
                    <span>Service Fee</span>
                    <span>+{currencySymbol}{serviceFeeAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-bold text-white">
                  <span>Total</span>
                  <span className="text-emerald-400">{currencySymbol}{total.toFixed(2)}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Button 
                    className={`${paymentMethod === "cash" ? "bg-emerald-600 ring-2 ring-white ring-offset-2 ring-offset-gray-900 scale-105 shadow-lg shadow-emerald-500/30" : "bg-gray-700 opacity-60"} hover:bg-emerald-700 text-white transition-all`}
                    onClick={() => setPaymentMethod("cash")}
                  >
                    <Banknote className="h-4 w-4 mr-1" /> Cash
                  </Button>
                  <Button 
                    className={`${paymentMethod === "card" ? "bg-blue-600 ring-2 ring-white ring-offset-2 ring-offset-gray-900 scale-105 shadow-lg shadow-blue-500/30" : "bg-gray-700 opacity-60"} hover:bg-blue-700 text-white transition-all`}
                    onClick={() => setPaymentMethod("card")}
                  >
                    <CreditCard className="h-4 w-4 mr-1" /> Card
                  </Button>
                  <Button 
                    className={`${paymentMethod === "account" ? "bg-amber-600 ring-2 ring-white ring-offset-2 ring-offset-gray-900 scale-105 shadow-lg shadow-amber-500/30" : "bg-gray-700 opacity-60"} hover:bg-amber-700 text-white transition-all`}
                    onClick={() => setPaymentMethod("account")}
                  >
                    <User className="h-4 w-4 mr-1" /> Acct
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button className="bg-red-500 hover:bg-red-600 text-white" onClick={clearCart}>
                    <X className="h-4 w-4 mr-2" /> Clear
                  </Button>
                  <Button className="bg-amber-500 hover:bg-amber-600 text-white" onClick={() => { handleSaveReceipt(); setShowMobileCart(false); }}>
                    <Save className="h-4 w-4 mr-2" /> Save
                  </Button>
                </div>
                <Button
                  onClick={() => { handlePrint(); setShowMobileCart(false); }}
                  disabled={cart.length === 0}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4"
                >
                  <Printer className="h-5 w-5 mr-2" />
                  Print Receipt & Complete
                </Button>
                <Button
                  onClick={() => { handleSendToKitchen(); setShowMobileCart(false); }}
                  disabled={cart.length === 0 || sendToKitchenMutation.isPending}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-4"
                >
                  <ChefHat className="h-5 w-5 mr-2" />
                  {sendToKitchenMutation.isPending ? "Sending..." : "Send to Kitchen"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden no-print">
        {/* Left Side - Menu Items */}
        <div className="flex-1 flex flex-col p-2 md:p-4 overflow-hidden">
          {/* Search & Category Tabs */}
          <div className="mb-2 md:mb-4 space-y-2 md:space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search menu items..."
                className="pl-10 h-10 md:h-12 bg-gray-800 border-gray-700 text-white text-base md:text-lg"
                data-testid="input-epos-search"
              />
            </div>
            
            {/* Desktop category tabs - hidden on mobile */}
            <div className="hidden md:flex gap-2 overflow-x-auto pb-2">
              {availableCategories.map(cat => (
                <Button
                  key={cat.id}
                  variant={activeCategory === cat.id ? "default" : "outline"}
                  onClick={() => setActiveCategory(cat.id)}
                  style={activeCategory === cat.id ? { backgroundColor: getCategoryColor(cat.id) } : {}}
                  className={activeCategory === cat.id 
                    ? "text-white" 
                    : "border-gray-600 text-gray-300 hover:bg-gray-800"
                  }
                  data-testid={`button-category-${cat.id}`}
                >
                  {cat.icon} {cat.name}
                </Button>
              ))}
            </div>
            
            {/* Mobile category indicator */}
            <div className="md:hidden flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-gray-600 text-gray-300"
                onClick={() => setShowMobileSidebar(true)}
              >
                <Menu className="h-4 w-4 mr-2" />
                {availableCategories.find(c => c.id === activeCategory)?.name || activeCategory || "Categories"}
              </Button>
            </div>
          </div>

          {/* Menu Items Grid */}
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-3">
              {filteredItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className="group relative aspect-square rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-200 hover:scale-105 border-2 border-transparent hover:border-white/30"
                  style={{ backgroundColor: getCategoryColor(item.category) }}
                  data-testid={`button-add-item-${item.id}`}
                >
                  {item.image && item.image !== '/placeholder.svg' ? (
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-4xl md:text-6xl opacity-30">🍽️</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-1.5 md:p-2 text-white">
                    <p className="font-bold text-xs md:text-sm leading-tight line-clamp-2">{item.name}</p>
                    <p className="text-sm md:text-lg font-bold text-emerald-400">{currencySymbol}{Number(item.price).toFixed(2)}</p>
                  </div>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-white text-gray-900 rounded-full p-1">
                      <Plus className="h-3 w-3 md:h-4 md:w-4" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side - Order Builder (Desktop only) */}
        <div className="hidden md:flex w-96 bg-gray-800 border-l border-gray-700 flex-col">
          {/* Customer Name */}
          <div className="p-4 border-b border-gray-700">
            <Input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Customer Name (optional)"
              className="bg-gray-700 border-gray-600 text-white"
              data-testid="input-customer-name"
            />
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-500">
                <Receipt className="h-16 w-16 mb-4 opacity-30" />
                <p className="text-lg">No items in order</p>
                <p className="text-sm">Tap items to add</p>
              </div>
            ) : (
              cart.map(item => {
                const toppingsTotal = item.toppings.reduce((sum, t) => sum + t.price, 0);
                const itemTotal = (item.price + toppingsTotal) * item.quantity;
                return (
                  <Card key={item.cartItemId} className="bg-gray-700 border-gray-600 p-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <p className="font-medium text-white text-sm">{item.name}</p>
                        {item.description && (
                          <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{item.description}</p>
                        )}
                        {item.toppings.length > 0 && (
                          <div className="mt-1 space-y-0.5">
                            {item.toppings.map(t => (
                              <div key={t.id} className="flex items-center gap-1 text-xs text-amber-400">
                                <button
                                  onClick={() => {
                                    setCart(prev => prev.map(cartItem => 
                                      cartItem.cartItemId === item.cartItemId
                                        ? { ...cartItem, toppings: cartItem.toppings.filter(top => top.id !== t.id) }
                                        : cartItem
                                    ));
                                  }}
                                  className="text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded p-0.5"
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                                <span>{t.name} ({currencySymbol}{t.price.toFixed(2)})</span>
                              </div>
                            ))}
                          </div>
                        )}
                        <p className="text-emerald-400 font-bold mt-1">{currencySymbol}{itemTotal.toFixed(2)}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-7 w-7 border-gray-500"
                            onClick={() => updateQuantity(item.cartItemId, -1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-6 text-center text-white font-bold text-sm">{item.quantity}</span>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-7 w-7 border-gray-500"
                            onClick={() => updateQuantity(item.cartItemId, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="flex gap-1">
                          {extraToppings.some((t: any) => t.menuItemId === item.menuItemId) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 text-xs text-blue-400 hover:text-blue-300"
                              onClick={() => editCartItemToppings(item)}
                            >
                              Edit
                            </Button>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                            onClick={() => removeFromCart(item.cartItemId)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>

          {/* Totals & Actions */}
          <div className="border-t border-gray-700 p-4 space-y-4">
            {/* Discount Section */}
            <div className="flex gap-2">
              <Select value={discountType} onValueChange={(v: "fixed" | "percent") => setDiscountType(v)}>
                <SelectTrigger className="w-24 bg-gray-700 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">{currencySymbol}</SelectItem>
                  <SelectItem value="percent">%</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="number"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder="Discount"
                className="flex-1 bg-gray-700 border-gray-600 text-white"
                data-testid="input-discount"
              />
            </div>

            {/* VAT & Service Fee */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-400">VAT %</label>
                <Input
                  type="number"
                  value={vatRate}
                  onChange={(e) => setVatRate(e.target.value)}
                  placeholder="0"
                  className="bg-gray-700 border-gray-600 text-white h-9"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400">Service Fee ({currencySymbol})</label>
                <Input
                  type="number"
                  value={serviceFeeValue}
                  onChange={(e) => setServiceFeeValue(e.target.value)}
                  placeholder="0.00"
                  className="bg-gray-700 border-gray-600 text-white h-9"
                />
              </div>
            </div>

            {/* Totals */}
            <div className="space-y-2 text-white">
              <div className="flex justify-between text-lg">
                <span className="text-gray-400">Subtotal</span>
                <span>{currencySymbol}{subtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-lg text-orange-400">
                  <span>Discount</span>
                  <span>-{currencySymbol}{discountAmount.toFixed(2)}</span>
                </div>
              )}
              {vatAmount > 0 && (
                <div className="flex justify-between text-sm text-blue-400">
                  <span>VAT ({vatRate}%)</span>
                  <span>+{currencySymbol}{vatAmount.toFixed(2)}</span>
                </div>
              )}
              {serviceFeeAmount > 0 && (
                <div className="flex justify-between text-sm text-purple-400">
                  <span>Service Fee</span>
                  <span>+{currencySymbol}{serviceFeeAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-2xl font-bold pt-2 border-t border-gray-600">
                <span>Total</span>
                <span className="text-emerald-400">{currencySymbol}{total.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Method */}
            <div className="grid grid-cols-3 gap-2">
              <Button
                onClick={() => setPaymentMethod("cash")}
                className={`${paymentMethod === "cash" ? "bg-emerald-600 hover:bg-emerald-700 ring-2 ring-white ring-offset-2 ring-offset-gray-900 scale-105 shadow-lg shadow-emerald-500/30" : "bg-gray-700 hover:bg-emerald-600/80 opacity-60"} text-white transition-all`}
                data-testid="button-payment-cash"
              >
                <Banknote className="h-4 w-4 mr-1" />
                Cash
              </Button>
              <Button
                onClick={() => setPaymentMethod("card")}
                className={`${paymentMethod === "card" ? "bg-blue-600 hover:bg-blue-700 ring-2 ring-white ring-offset-2 ring-offset-gray-900 scale-105 shadow-lg shadow-blue-500/30" : "bg-gray-700 hover:bg-blue-600/80 opacity-60"} text-white transition-all`}
                data-testid="button-payment-card"
              >
                <CreditCard className="h-4 w-4 mr-1" />
                Card
              </Button>
              <Button
                onClick={() => setPaymentMethod("account")}
                className={`${paymentMethod === "account" ? "bg-amber-600 hover:bg-amber-700 ring-2 ring-white ring-offset-2 ring-offset-gray-900 scale-105 shadow-lg shadow-amber-500/30" : "bg-gray-700 hover:bg-amber-600/80 opacity-60"} text-white transition-all`}
                data-testid="button-payment-account"
              >
                <User className="h-4 w-4 mr-1" />
                Acct
              </Button>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={clearCart}
                className="bg-red-500 hover:bg-red-600 text-white"
                data-testid="button-clear-cart"
              >
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
              <Button
                onClick={handleSaveReceipt}
                disabled={cart.length === 0 || saveReceiptMutation.isPending}
                className="bg-amber-500 hover:bg-amber-600 text-white"
                data-testid="button-save-receipt"
              >
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
            <Button
              onClick={handlePrint}
              disabled={cart.length === 0}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg py-6"
              data-testid="button-print-receipt"
            >
              <Printer className="h-5 w-5 mr-2" />
              Print Receipt & Complete
            </Button>
            <Button
              onClick={handleSendToKitchen}
              disabled={cart.length === 0 || sendToKitchenMutation.isPending}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-lg py-6"
              data-testid="button-send-kitchen"
            >
              <ChefHat className="h-5 w-5 mr-2" />
              {sendToKitchenMutation.isPending ? "Sending..." : "Send to Kitchen"}
            </Button>
          </div>
        </div>
      </div>

      {/* Receipt Modal */}
      <Dialog open={showReceiptModal} onOpenChange={setShowReceiptModal}>
        <DialogContent className="sm:max-w-sm bg-white text-black p-0 overflow-hidden rounded-2xl shadow-2xl no-print">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-center text-white">
            <div className="w-16 h-16 bg-white/20 rounded-full mx-auto mb-3 flex items-center justify-center">
              <Receipt className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold">Receipt #{lastReceipt?.receiptNumber}</h2>
            <p className="text-white/80 text-sm mt-1">Order Complete</p>
          </div>
          
          <div className="p-6 space-y-4">
            <div className="text-center pb-4 border-b border-gray-200">
              <h3 className="font-bold text-lg text-gray-800">{restaurant?.name}</h3>
              <p className="text-sm text-gray-500">{restaurant?.address}</p>
              <p className="text-xs text-gray-400 mt-1">{lastReceipt?.createdAt ? new Date(lastReceipt.createdAt).toLocaleString() : new Date().toLocaleString()}</p>
            </div>
            
            <div className="space-y-3">
              {lastReceipt?.items?.map((item: any, i: number) => {
                const menuItem = menuItems.find(m => m.id === item.menuItemId);
                const description = item.description || menuItem?.description;
                return (
                <div key={i} className="py-2 border-b border-gray-100 last:border-0">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-2">
                      <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2 py-1 rounded">{item.quantity}x</span>
                      <div>
                        <span className="text-gray-800 font-medium">{item.name}</span>
                        {description && (
                          <p className="text-xs text-gray-500 mt-1">{description}</p>
                        )}
                        {item.toppings?.length > 0 && (
                          <div className="text-xs text-gray-600 mt-2">
                            {item.toppings.map((t: any, ti: number) => (
                              <p key={ti} className="flex items-center gap-1">
                                <span className="text-gray-400">→</span> {t.name} ({currencySymbol}{Number(t.price).toFixed(2)})
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="font-medium text-gray-800">{currencySymbol}{Number(item.total).toFixed(2)}</span>
                  </div>
                </div>
              );})}
            </div>
            
            <div className="border-t border-gray-200 pt-4 space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{currencySymbol}{Number(lastReceipt?.subtotal || 0).toFixed(2)}</span>
              </div>
              {Number(lastReceipt?.discountAmount) > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount</span>
                  <span>-{currencySymbol}{Number(lastReceipt?.discountAmount).toFixed(2)}</span>
                </div>
              )}
              {Number(lastReceipt?.vatAmount) > 0 && (
                <div className="flex justify-between text-blue-600">
                  <span>VAT ({Number(lastReceipt?.vatRate || 0)}%)</span>
                  <span>+{currencySymbol}{Number(lastReceipt?.vatAmount).toFixed(2)}</span>
                </div>
              )}
              {Number(lastReceipt?.serviceFee) > 0 && (
                <div className="flex justify-between text-purple-600">
                  <span>Service Fee</span>
                  <span>+{currencySymbol}{Number(lastReceipt?.serviceFee).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t border-gray-200">
                <span>TOTAL</span>
                <span className="text-emerald-600">{currencySymbol}{Number(lastReceipt?.total || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm bg-gray-50 p-2 rounded-lg">
                <span className="text-gray-500">Payment Method</span>
                <span className="font-medium text-gray-800 uppercase">{lastReceipt?.paymentMethod}</span>
              </div>
              {lastReceipt?.paymentMethod === 'cash' && lastReceipt?.amountTendered && (
                <div className="bg-emerald-50 p-3 rounded-lg space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Tendered</span>
                    <span className="font-medium text-gray-800">{currencySymbol}{Number(lastReceipt.amountTendered).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-emerald-700">Change to Give Back</span>
                    <span className="text-emerald-700">{currencySymbol}{Number(lastReceipt.changeGiven || 0).toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-gray-500 text-sm">Thank you for your visit!</p>
              <p className="text-gray-400 text-xs mt-1">We appreciate your business</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <Button 
                onClick={() => setShowReceiptModal(false)} 
                className="bg-gray-900 hover:bg-gray-800 text-white py-3 rounded-xl font-medium"
              >
                Close
              </Button>
              <Button 
                onClick={() => printReceiptDirect()} 
                className="bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium"
                data-testid="button-reprint-last"
              >
                <Printer className="h-4 w-4 mr-2" />
                Print Again
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Receipt History Modal */}
      <Dialog open={showHistoryModal} onOpenChange={setShowHistoryModal}>
        <DialogContent className="sm:max-w-lg bg-gray-900 text-white border-gray-700 max-h-[80vh] overflow-hidden flex flex-col no-print">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <History className="h-6 w-6 text-blue-400" />
              Receipt History
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {receiptHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Receipt className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No receipts found</p>
              </div>
            ) : (
              receiptHistory.map((receipt: any) => (
                <Card 
                  key={receipt.id} 
                  className="bg-gray-800 border-gray-700 p-3 cursor-pointer hover:bg-gray-750 transition-colors"
                  onClick={() => handleViewReceipt(receipt)}
                  data-testid={`receipt-history-item-${receipt.id}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg text-white">#{receipt.receiptNumber}</span>
                        <Badge className={receipt.paymentMethod === "cash" ? "bg-emerald-600" : "bg-blue-600"}>
                          {receipt.paymentMethod?.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-gray-400 text-sm mt-1">
                        {new Date(receipt.createdAt).toLocaleString()}
                      </p>
                      {receipt.customerName && (
                        <p className="text-gray-500 text-xs mt-1">Customer: {receipt.customerName}</p>
                      )}
                      <div className="mt-2 space-y-1">
                        {receipt.items?.map((item: any, idx: number) => {
                          const menuItem = menuItems.find(m => m.id === item.menuItemId);
                          const description = item.description || menuItem?.description;
                          return (
                            <div key={idx} className="text-sm">
                              <div className="flex items-start gap-1">
                                <span className="text-gray-300">{item.quantity}x</span>
                                <div className="flex-1">
                                  <span className="text-white">{item.name}</span>
                                  {description && (
                                    <p className="text-gray-500 text-xs">{description}</p>
                                  )}
                                  {item.toppings?.length > 0 && item.toppings.map((t: any, ti: number) => (
                                    <p key={ti} className="text-amber-400 text-xs">→ {t.name} ({currencySymbol}{Number(t.price).toFixed(2)})</p>
                                  ))}
                                </div>
                                <span className="text-gray-300">{currencySymbol}{Number(item.total).toFixed(2)}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div className="text-right ml-2">
                      <p className="font-bold text-xl text-emerald-400">{currencySymbol}{Number(receipt.total).toFixed(2)}</p>
                      <div className="flex gap-1 mt-1 justify-end">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-blue-400 hover:text-blue-300 p-1 h-auto"
                          onClick={(e) => { e.stopPropagation(); handleViewReceipt(receipt); }}
                          data-testid={`button-view-receipt-${receipt.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-red-400 hover:text-red-300 p-1 h-auto"
                          onClick={(e) => handleDeleteReceipt(e, receipt.id)}
                          data-testid={`button-delete-receipt-${receipt.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* View Receipt Modal */}
      <Dialog open={!!viewingReceipt} onOpenChange={(open) => !open && setViewingReceipt(null)}>
        <DialogContent className="sm:max-w-sm bg-white text-black p-0 overflow-hidden rounded-2xl shadow-2xl no-print">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-6 text-center text-white">
            <div className="w-16 h-16 bg-white/20 rounded-full mx-auto mb-3 flex items-center justify-center">
              <Receipt className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold">Receipt #{viewingReceipt?.receiptNumber}</h2>
            <p className="text-white/80 text-sm mt-1">
              {viewingReceipt?.createdAt && new Date(viewingReceipt.createdAt).toLocaleString()}
            </p>
          </div>
          
          <div className="p-6 space-y-4">
            <div className="text-center pb-4 border-b border-gray-200">
              <h3 className="font-bold text-lg text-gray-800">{restaurant?.name}</h3>
              <p className="text-sm text-gray-500">{restaurant?.address}</p>
            </div>
            
            <div className="space-y-3">
              {viewingReceipt?.items?.map((item: any, i: number) => {
                const menuItem = menuItems.find(m => m.id === item.menuItemId);
                const description = item.description || menuItem?.description;
                return (
                <div key={i} className="py-2 border-b border-gray-100 last:border-0">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-2">
                      <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2 py-1 rounded">{item.quantity}x</span>
                      <div>
                        <span className="text-gray-800 font-medium">{item.name}</span>
                        {description && (
                          <p className="text-xs text-gray-500 mt-1">{description}</p>
                        )}
                        {item.toppings?.length > 0 && (
                          <div className="text-xs text-gray-600 mt-2">
                            {item.toppings.map((t: any, ti: number) => (
                              <p key={ti} className="flex items-center gap-1">
                                <span className="text-gray-400">→</span> {t.name} ({currencySymbol}{Number(t.price).toFixed(2)})
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="font-medium text-gray-800">{currencySymbol}{Number(item.total).toFixed(2)}</span>
                  </div>
                </div>
              );})}
            </div>
            
            <div className="border-t border-gray-200 pt-4 space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{currencySymbol}{Number(viewingReceipt?.subtotal || 0).toFixed(2)}</span>
              </div>
              {Number(viewingReceipt?.discountAmount) > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount</span>
                  <span>-{currencySymbol}{Number(viewingReceipt?.discountAmount).toFixed(2)}</span>
                </div>
              )}
              {Number(viewingReceipt?.vatAmount) > 0 && (
                <div className="flex justify-between text-blue-600">
                  <span>VAT ({Number(viewingReceipt?.vatRate || 0)}%)</span>
                  <span>+{currencySymbol}{Number(viewingReceipt?.vatAmount).toFixed(2)}</span>
                </div>
              )}
              {Number(viewingReceipt?.serviceFee) > 0 && (
                <div className="flex justify-between text-purple-600">
                  <span>Service Fee</span>
                  <span>+{currencySymbol}{Number(viewingReceipt?.serviceFee).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t border-gray-200">
                <span>TOTAL</span>
                <span className="text-emerald-600">{currencySymbol}{Number(viewingReceipt?.total || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm bg-gray-50 p-2 rounded-lg">
                <span className="text-gray-500">Payment Method</span>
                <span className="font-medium text-gray-800 uppercase">{viewingReceipt?.paymentMethod}</span>
              </div>
              {viewingReceipt?.paymentMethod === 'cash' && viewingReceipt?.amountTendered && (
                <div className="bg-emerald-50 p-3 rounded-lg space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Tendered</span>
                    <span className="font-medium text-gray-800">{currencySymbol}{Number(viewingReceipt.amountTendered).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-emerald-700">Change to Give Back</span>
                    <span className="text-emerald-700">{currencySymbol}{Number(viewingReceipt.changeGiven || 0).toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-3 pt-4">
              <Button 
                onClick={() => setViewingReceipt(null)} 
                variant="outline"
                className="border-gray-300 text-gray-600"
              >
                Close
              </Button>
              <Button 
                onClick={handleReprintReceipt} 
                className="bg-blue-600 hover:bg-blue-700 text-white"
                data-testid="button-reprint-receipt"
              >
                <Printer className="h-4 w-4 mr-2" />
                Reprint
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Toppings Modal */}
      <Dialog open={selectedItem !== null && !editingCartItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="max-w-md bg-gray-800 border-gray-700 text-white no-print max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">{selectedItem?.name}</DialogTitle>
          </DialogHeader>
          
          {/* Topping Groups (Goes well with, Add a Drink, etc.) */}
          {(() => {
            const itemGroups = toppingGroups.filter((g: any) => (g.menu_item_id || g.menuItemId) === selectedItem?.id);
            const getOptionsForGroup = (groupId: string) => toppingOptions.filter((o: any) => o.group_id === groupId);
            
            return itemGroups.length > 0 && (
              <div className="space-y-4">
                {itemGroups.map((group: any) => (
                  <div key={group.id}>
                    <h3 className="text-sm font-bold text-amber-400 mb-2 flex items-center gap-2">
                      {group.headline || 'Options'}
                      {group.is_required && <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">Required</span>}
                    </h3>
                    <div className="space-y-2">
                      {getOptionsForGroup(group.id).map((option: any) => (
                        <button
                          key={option.id}
                          onClick={() => toggleTopping({ id: option.id, name: option.name, price: option.price } as any)}
                          className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                            selectedToppings.some(t => t.id === option.id)
                              ? "bg-emerald-600 border-emerald-500 text-white"
                              : "bg-gray-700 border-gray-600 hover:border-gray-500"
                          }`}
                        >
                          <span className="font-medium">{option.name}</span>
                          <span className="text-emerald-400 font-bold">+{currencySymbol}{Number(option.price).toFixed(2)}</span>
                        </button>
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
              <div className="space-y-2 max-h-48 overflow-y-auto py-2">
                <h3 className="text-sm font-bold text-cyan-400 mb-2">Add Extras</h3>
                {itemToppings.map(topping => {
                  const isSoldOut = topping.isActive === false;
                  return (
                  <button
                    key={topping.id}
                    onClick={() => !isSoldOut && toggleTopping(topping)}
                    disabled={isSoldOut}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                      isSoldOut
                        ? "bg-red-900/30 border-red-700/50 cursor-not-allowed opacity-60"
                        : selectedToppings.some(t => t.id === topping.id)
                          ? "bg-emerald-600 border-emerald-500 text-white"
                          : "bg-gray-700 border-gray-600 hover:border-gray-500"
                    }`}
                  >
                    <span className={`font-medium flex items-center gap-2 ${isSoldOut ? "line-through text-gray-400" : ""}`}>
                      {topping.name}
                      {isSoldOut && <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full no-underline">SOLD OUT</span>}
                    </span>
                    {isSoldOut ? (
                      <span className="text-red-400 text-sm">Unavailable</span>
                    ) : (
                      <span className="text-emerald-400 font-bold">+{currencySymbol}{Number(topping.price).toFixed(2)}</span>
                    )}
                  </button>
                );
                })}
              </div>
            );
          })()}
          
          {/* No options message */}
          {(() => {
            const itemToppings = extraToppings.filter((t: any) => t.menuItemId === selectedItem?.id);
            const itemGroups = toppingGroups.filter((g: any) => (g.menu_item_id || g.menuItemId) === selectedItem?.id);
            return itemToppings.length === 0 && itemGroups.length === 0 && (
              <p className="text-gray-400 py-4">No extras available for this item.</p>
            );
          })()}
          
          <div className="flex gap-3 mt-4">
            <Button 
              variant="outline" 
              className="flex-1 border-gray-600"
              onClick={() => {
                setSelectedItem(null);
                setSelectedToppings([]);
              }}
            >
              Cancel
            </Button>
            <Button 
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              onClick={confirmAddToCart}
            >
              Add to Order
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Toppings Modal */}
      <Dialog open={editingCartItem !== null} onOpenChange={(open) => !open && setEditingCartItem(null)}>
        <DialogContent className="max-w-md bg-gray-800 border-gray-700 text-white no-print">
          <DialogHeader>
            <DialogTitle className="text-xl">Edit: {editingCartItem?.name}</DialogTitle>
          </DialogHeader>
          {(() => {
            const itemToppings = extraToppings.filter((t: any) => t.menuItemId === editingCartItem?.menuItemId);
            return itemToppings.length === 0 ? (
              <p className="text-gray-400 py-4">No extras available for this item.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto py-2">
                {itemToppings.map(topping => {
                  const isSoldOut = topping.isActive === false;
                  return (
                  <button
                    key={topping.id}
                    onClick={() => !isSoldOut && toggleTopping(topping)}
                    disabled={isSoldOut}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                      isSoldOut
                        ? "bg-red-900/30 border-red-700/50 cursor-not-allowed opacity-60"
                        : selectedToppings.some(t => t.id === topping.id)
                          ? "bg-emerald-600 border-emerald-500 text-white"
                          : "bg-gray-700 border-gray-600 hover:border-gray-500"
                    }`}
                  >
                    <span className={`font-medium flex items-center gap-2 ${isSoldOut ? "line-through text-gray-400" : ""}`}>
                      {topping.name}
                      {isSoldOut && <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full no-underline">SOLD OUT</span>}
                    </span>
                    {isSoldOut ? (
                      <span className="text-red-400 text-sm">Unavailable</span>
                    ) : (
                      <span className="text-emerald-400 font-bold">+{currencySymbol}{Number(topping.price).toFixed(2)}</span>
                    )}
                  </button>
                );
                })}
              </div>
            );
          })()}
          <div className="flex gap-3 mt-4">
            <Button 
              variant="outline" 
              className="flex-1 border-gray-600"
              onClick={() => {
                setEditingCartItem(null);
                setSelectedToppings([]);
              }}
            >
              Cancel
            </Button>
            <Button 
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              onClick={confirmAddToCart}
            >
              Update
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      </div>

      {/* Cash Change Calculator Modal */}
      <Dialog open={showCashChangeModal} onOpenChange={setShowCashChangeModal}>
        <DialogContent className="sm:max-w-md bg-gray-900 text-white border-gray-700 no-print">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Coins className="h-7 w-7 text-emerald-400" />
              Cash Payment
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="text-center p-6 bg-gray-800 rounded-xl">
              <p className="text-gray-400 text-sm mb-1">Order Total</p>
              <p className="text-5xl font-bold text-emerald-400">{currencySymbol}{cashChangeTotal.toFixed(2)}</p>
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-2 block">Amount Given by Customer</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={amountTendered}
                onChange={(e) => {
                  setAmountTendered(e.target.value);
                  const tendered = parseFloat(e.target.value) || 0;
                  setChangeAmount(Math.max(0, tendered - cashChangeTotal));
                }}
                placeholder={`${currencySymbol}0.00`}
                className="text-3xl h-16 text-center bg-gray-800 border-gray-600 text-white font-bold"
                autoFocus
                data-testid="input-amount-tendered"
              />
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[5, 10, 20, 50].map(amount => (
                <Button
                  key={amount}
                  variant="outline"
                  className="h-14 text-lg font-bold border-gray-600 text-white hover:bg-emerald-600 hover:border-emerald-600"
                  onClick={() => {
                    setAmountTendered(String(amount));
                    setChangeAmount(Math.max(0, amount - cashChangeTotal));
                  }}
                  data-testid={`button-quick-amount-${amount}`}
                >
                  {currencySymbol}{amount}
                </Button>
              ))}
            </div>

            <div className={`text-center p-6 rounded-xl ${parseFloat(amountTendered) > 0 ? (changeAmount >= 0 ? 'bg-emerald-900/50 border-2 border-emerald-500/50' : 'bg-red-900/50 border-2 border-red-500/50') : 'bg-gray-800/50 border border-gray-600/30'}`}>
              <p className="text-gray-300 text-sm mb-1">Change to Give Back</p>
              <p className={`text-5xl font-bold ${parseFloat(amountTendered) > 0 ? (changeAmount >= 0 ? 'text-emerald-400' : 'text-red-400') : 'text-gray-500'}`}>
                {currencySymbol}{parseFloat(amountTendered) > 0 ? changeAmount.toFixed(2) : '0.00'}
              </p>
              {parseFloat(amountTendered) > 0 && changeAmount < 0 && (
                <p className="text-red-400 text-sm mt-2">Not enough! Need {currencySymbol}{Math.abs(changeAmount).toFixed(2)} more</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-14 border-gray-600 text-gray-300"
                onClick={() => {
                  setShowCashChangeModal(false);
                  setShouldPrintAfterSave(true);
                  handleSaveReceipt();
                }}
                data-testid="button-skip-change"
              >
                Exact Amount
              </Button>
              <Button
                className="h-14 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold whitespace-nowrap"
                onClick={handleCashPaymentComplete}
                disabled={parseFloat(amountTendered) < cashChangeTotal && parseFloat(amountTendered) > 0}
                data-testid="button-complete-cash-payment"
              >
                <Printer className="h-4 w-4 mr-1 flex-shrink-0" />
                Print & Complete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Printer Settings Modal */}
      <Dialog open={showPrinterSettings} onOpenChange={setShowPrinterSettings}>
        <DialogContent className="sm:max-w-md bg-gray-900 text-white border-gray-700 no-print">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Printer className="h-6 w-6 text-blue-400" />
              Receipt Printer Settings
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-sm text-gray-400">Saved Printer Name</label>
              <Input
                value={savedPrinterName}
                onChange={(e) => setSavedPrinterName(e.target.value)}
                placeholder="e.g., EPSON TM-T20III, Star TSP143"
                className="bg-gray-800 border-gray-600 text-white"
                data-testid="input-printer-name"
              />
              <p className="text-xs text-gray-500">
                Enter the name of your receipt printer as it appears in your system printer list. 
                When you print, select this printer in the print dialog and check "Save as default".
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <Printer className="h-5 w-5 text-blue-400" />
                  <div>
                    <p className="font-medium">Auto-Print Receipt</p>
                    <p className="text-xs text-gray-400">Automatically print after completing an order</p>
                  </div>
                </div>
                <button
                  onClick={() => setAutoPrintEnabled(!autoPrintEnabled)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${autoPrintEnabled ? 'bg-emerald-500' : 'bg-gray-600'}`}
                  data-testid="toggle-auto-print"
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${autoPrintEnabled ? 'translate-x-6' : ''}`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <Receipt className="h-5 w-5 text-amber-400" />
                  <div>
                    <p className="font-medium">Cash Drawer</p>
                    <p className="text-xs text-gray-400">Auto-open cash drawer after cash payment</p>
                  </div>
                </div>
                <button
                  onClick={() => setCashDrawerEnabled(!cashDrawerEnabled)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${cashDrawerEnabled ? 'bg-emerald-500' : 'bg-gray-600'}`}
                  data-testid="toggle-cash-drawer"
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${cashDrawerEnabled ? 'translate-x-6' : ''}`} />
                </button>
              </div>
            </div>

            <div className="p-4 bg-blue-900/30 border border-blue-500/30 rounded-lg">
              <h4 className="font-medium text-blue-300 mb-2">How to Set Up Your Printer</h4>
              <ol className="text-xs text-gray-300 space-y-1 list-decimal list-inside">
                <li>Connect your receipt printer via USB to this tablet/computer</li>
                <li>Install the printer driver from the manufacturer</li>
                <li>Click "Print Receipt" on any order</li>
                <li>In the print dialog, select your receipt printer</li>
                <li>The printer will remember your selection for future prints</li>
              </ol>
            </div>

            {savedPrinterName && (
              <div className="flex items-center gap-2 p-3 bg-emerald-900/30 border border-emerald-500/30 rounded-lg">
                <Check className="h-5 w-5 text-emerald-400" />
                <span className="text-emerald-300 text-sm">Printer saved: <b>{savedPrinterName}</b></span>
              </div>
            )}

            <Button
              onClick={() => setShowPrinterSettings(false)}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Save & Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      <InstallPrompt restaurantName={restaurant?.name} themeColor="#06b6d4" appName="Link24-EPOS" />
    </>
  );
}
