import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { getRestaurantBySlug, updateRestaurant, getExtraToppings, createExtraTopping, updateExtraTopping, deleteExtraTopping, getMenuItems, createMenuItem, updateMenuItem, deleteMenuItem, getMenuItemVariants, createMenuItemVariant, updateMenuItemVariant, deleteMenuItemVariant } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Store, MapPin, Phone, Save, Loader2, Globe, Copy, Settings, CreditCard, Building, Plus, Trash2, Upload, UtensilsCrossed, X, LinkIcon, Pencil, Check, Image, Clock, Percent, Truck, Megaphone, Layers, Key, ChefHat, ConciergeBell, Package, Wallet, Receipt, ChevronDown, ChevronUp, Video, Smartphone, Download } from "lucide-react";
import { getCurrencySymbol, CURRENCIES, type MenuItem, type MenuItemVariant, type ExtraTopping, type ToppingGroupWithOptions, type ToppingGroup, type ToppingGroupOption } from "@shared/schema";

const MENU_CATEGORIES = [
  { id: "platters", name: "Platters", icon: "🍱" },
  { id: "starters", name: "Starters", icon: "🥗" },
  { id: "mains", name: "Mains", icon: "🍛" },
  { id: "biryanis", name: "Biryanis", icon: "🍚" },
  { id: "karahis", name: "Karahis", icon: "🥘" },
  { id: "grills", name: "Grills", icon: "🍖" },
  { id: "kebabs", name: "Kebabs", icon: "🥙" },
  { id: "sides", name: "Sides", icon: "🍟" },
  { id: "breads", name: "Breads", icon: "🫓" },
  { id: "desserts", name: "Desserts", icon: "🍰" },
  { id: "drinks", name: "Drinks", icon: "🥤" },
  { id: "specials", name: "Specials", icon: "⭐" },
];

export default function BranchSettingsPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  useEffect(() => {
    document.documentElement.classList.add("dark");
    return () => document.documentElement.classList.remove("dark");
  }, []);

  const { data: restaurant, isLoading: loadingRestaurant } = useQuery({
    queryKey: ["/api/restaurants", slug],
    queryFn: () => getRestaurantBySlug(slug!),
    enabled: !!slug,
  });

  const restaurantId = restaurant?.id || null;
  const currencySymbol = getCurrencySymbol(restaurant?.currency || "GBP");

  const { data: menuItems = [] } = useQuery<MenuItem[]>({
    queryKey: ["/api/menu", restaurantId],
    queryFn: () => getMenuItems(restaurantId!),
    enabled: !!restaurantId,
  });

  const { data: dbCategories = [] } = useQuery<{ id: string; slug: string; name: string; icon: string; isEnabled?: boolean; showInTelephone?: boolean; showInEpos?: boolean; showInWaiter?: boolean; showInOnline?: boolean; restaurantId?: string }[]>({
    queryKey: ["/api/menu-categories", restaurantId],
    queryFn: async () => {
      const response = await fetch(`/api/menu-categories?restaurantId=${restaurantId}`);
      return response.json();
    },
    enabled: !!restaurantId,
  });

  const dynamicCategories = useMemo(() => {
    if (dbCategories.length === 0) return MENU_CATEGORIES.map(cat => ({ ...cat, dbId: "", slug: cat.id, isEnabled: true, showInTelephone: true, showInEpos: true, showInWaiter: true, showInOnline: true }));
    
    // De-duplicate categories by slug, preferring branch-specific over global
    // Some branches store category by slug, others by name - we need to handle both
    const bySlug = new Map<string, { id: string; name: string; icon: string; dbId: string; slug: string; restaurantId: string | null; isEnabled: boolean; showInTelephone: boolean; showInEpos: boolean; showInWaiter: boolean; showInOnline: boolean }>();
    for (const cat of dbCategories as any[]) {
      const existing = bySlug.get(cat.slug);
      // Prefer branch-specific (has restaurantId matching this branch) over global (null)
      if (!existing || (cat.restaurantId && cat.restaurantId === restaurantId)) {
        bySlug.set(cat.slug, {
          id: cat.slug, // Primary id is slug
          name: cat.name,
          icon: cat.icon || "🍽️",
          dbId: cat.id,
          slug: cat.slug,
          restaurantId: cat.restaurantId,
          isEnabled: cat.isEnabled !== false,
          showInTelephone: cat.showInTelephone !== false,
          showInEpos: cat.showInEpos !== false,
          showInWaiter: cat.showInWaiter !== false,
          showInOnline: cat.showInOnline !== false,
        });
      }
    }
    return Array.from(bySlug.values());
  }, [dbCategories, restaurantId]);

  // Helper to match menu item category (could be slug, name, or dbId) to category
  const getCategoryForItem = (itemCategory: string) => {
    return dynamicCategories.find(cat => 
      cat.dbId === itemCategory ||
      cat.slug === itemCategory || 
      cat.name === itemCategory || 
      cat.slug === itemCategory.toLowerCase().replace(/\s+/g, '-')
    );
  };

  const { data: extraToppings = [] } = useQuery<ExtraTopping[]>({
    queryKey: ["/api/extra-toppings", restaurantId],
    queryFn: () => getExtraToppings(restaurantId!),
    enabled: !!restaurantId,
  });

  const { data: toppingGroups = [] } = useQuery<ToppingGroupWithOptions[]>({
    queryKey: ["/api/topping-groups", restaurantId],
    queryFn: async () => {
      const response = await fetch(`/api/restaurants/${restaurantId}/topping-groups`);
      return response.json();
    },
    enabled: !!restaurantId,
  });

  const [activeTab, setActiveTab] = useState("details");
  const [saving, setSaving] = useState(false);

  // App Icon settings
  const [appIconUrl, setAppIconUrl] = useState("");
  const [appName, setAppName] = useState("");
  const [appShortName, setAppShortName] = useState("");
  const [appThemeColor, setAppThemeColor] = useState("#8B0000");
  const [appBackgroundColor, setAppBackgroundColor] = useState("#ffffff");
  const [isUploadingAppIcon, setIsUploadingAppIcon] = useState(false);

  const [editAddress, setEditAddress] = useState("");
  const [editPhone, setEditPhone] = useState("");

  const [showAddMenuItem, setShowAddMenuItem] = useState(false);
  const [newMenuItemName, setNewMenuItemName] = useState("");
  const [newMenuItemPrice, setNewMenuItemPrice] = useState("");
  const [newMenuItemCategory, setNewMenuItemCategory] = useState("");
  const [newMenuItemDescription, setNewMenuItemDescription] = useState("");
  const [newMenuItemImage, setNewMenuItemImage] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const [editingPrices, setEditingPrices] = useState<Record<string, string>>({});
  
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<{name: string; description: string; price: string; image: string; videoUrl: string; category: string}>({
    name: "", description: "", price: "", image: "", videoUrl: "", category: ""
  });
  const [isUploadingEditImage, setIsUploadingEditImage] = useState(false);
  const [isUploadingEditVideo, setIsUploadingEditVideo] = useState(false);
  
  // Size variants state for editing menu items
  const [editingItemVariants, setEditingItemVariants] = useState<MenuItemVariant[]>([]);
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [newVariantName, setNewVariantName] = useState("");
  const [newVariantPrice, setNewVariantPrice] = useState("");

  // Category editing state
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");
  const [editingCategorySlug, setEditingCategorySlug] = useState("");
  const [editingCategoryIcon, setEditingCategoryIcon] = useState("");
  const [deleteCategoryConfirm, setDeleteCategoryConfirm] = useState<{ id: string; dbId: string; name: string; itemCount: number } | null>(null);

  const [newToppingCategory, setNewToppingCategory] = useState("");
  const [newToppingMenuItem, setNewToppingMenuItem] = useState("");
  const [newToppingName, setNewToppingName] = useState("");
  const [newToppingPrice, setNewToppingPrice] = useState("1.00");

  // Option Groups state
  const [showAddOptionGroup, setShowAddOptionGroup] = useState(false);
  const [optionGroupCategories, setOptionGroupCategories] = useState<string[]>([]);
  const [optionGroupMenuItems, setOptionGroupMenuItems] = useState<string[]>([]);
  const [optionGroupHeadline, setOptionGroupHeadline] = useState("Choose Your Drink");
  const [optionGroupIsRequired, setOptionGroupIsRequired] = useState(true);
  const [optionGroupMinSelections, setOptionGroupMinSelections] = useState(0);
  const [optionGroupMaxSelections, setOptionGroupMaxSelections] = useState(1);
  const [optionGroupAllowQuantity, setOptionGroupAllowQuantity] = useState(false);
  const [optionGroupMaxQuantity, setOptionGroupMaxQuantity] = useState(5);
  const [optionGroupTempCategory, setOptionGroupTempCategory] = useState("");
  const [optionGroupTempMenuItem, setOptionGroupTempMenuItem] = useState("");
  
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [newOptionName, setNewOptionName] = useState("");
  const [newOptionPrice, setNewOptionPrice] = useState("0.00");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  
  // Quick-add options from menu state
  const [quickAddCategory, setQuickAddCategory] = useState("");
  const [quickAddMenuItem, setQuickAddMenuItem] = useState("");

  // Branding state
  const [logoUrl, setLogoUrl] = useState("");
  const [welcomeImageUrl, setWelcomeImageUrl] = useState("");
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingWelcome, setIsUploadingWelcome] = useState(false);
  
  // Promotions state
  const [promoHeadline, setPromoHeadline] = useState("");
  const [promoSubtext, setPromoSubtext] = useState("");
  const [promoBgColor, setPromoBgColor] = useState("#dc2626");
  const [promoTextColor, setPromoTextColor] = useState("#ffffff");
  const [promoActive, setPromoActive] = useState(true);
  
  // Operating hours state
  const [deliveryHoursMonThu, setDeliveryHoursMonThu] = useState("12PM - 10:30PM");
  const [deliveryHoursFriSat, setDeliveryHoursFriSat] = useState("12PM - 11:30PM");
  const [deliveryHoursSun, setDeliveryHoursSun] = useState("12PM - 10:30PM");
  const [collectionHoursMonThu, setCollectionHoursMonThu] = useState("12PM - 10:30PM");
  const [collectionHoursFriSat, setCollectionHoursFriSat] = useState("12PM - 11:30PM");
  const [collectionHoursSun, setCollectionHoursSun] = useState("12PM - 10:30PM");
  
  // Discount & Delivery state
  const [collectionDiscountPercent, setCollectionDiscountPercent] = useState(10);
  const [collectionDiscountMinimum, setCollectionDiscountMinimum] = useState("15.00");
  const [deliveryTimeMinutes, setDeliveryTimeMinutes] = useState(45);
  const [collectionTimeMinutes, setCollectionTimeMinutes] = useState(20);
  const [busyModeEnabled, setBusyModeEnabled] = useState(false);
  const [busyModeExtraMinutes, setBusyModeExtraMinutes] = useState(15);
  
  // Fees & Taxes state
  const [vatPercent, setVatPercent] = useState("0");
  const [vatEnabled, setVatEnabled] = useState(false);
  const [serviceFeePercent, setServiceFeePercent] = useState("0");
  const [serviceFeeEnabled, setServiceFeeEnabled] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState("0");
  const [deliveryFeeEnabled, setDeliveryFeeEnabled] = useState(false);
  const [freeDeliveryMinimum, setFreeDeliveryMinimum] = useState("0");
  const [freeDeliveryEnabled, setFreeDeliveryEnabled] = useState(false);
  const [cutleryOptionEnabled, setCutleryOptionEnabled] = useState(false);
  const [cutleryName, setCutleryName] = useState("Cutlery Set");
  const [cutleryPrice, setCutleryPrice] = useState("0.50");
  
  // Role Login Passwords state
  const [kitchenLoginPassword, setKitchenLoginPassword] = useState("");
  const [kitchenStaffName, setKitchenStaffName] = useState("");
  const [eposLoginPassword, setEposLoginPassword] = useState("");
  const [eposStaffName, setEposStaffName] = useState("");
  const [waiterLoginPassword, setWaiterLoginPassword] = useState("");
  const [waiterStaffName, setWaiterStaffName] = useState("");
  const [suppliersLoginPassword, setSuppliersLoginPassword] = useState("");
  const [suppliersStaffName, setSuppliersStaffName] = useState("");
  const [financesLoginPassword, setFinancesLoginPassword] = useState("");
  const [financesStaffName, setFinancesStaffName] = useState("");
  
  // Hero Gallery state
  const [heroAnimationStyle, setHeroAnimationStyle] = useState("slide");
  const [heroSlideInterval, setHeroSlideInterval] = useState(5);
  const [heroGradientStart, setHeroGradientStart] = useState("#dc2626");
  const [heroGradientMiddle, setHeroGradientMiddle] = useState("#f97316");
  const [heroGradientEnd, setHeroGradientEnd] = useState("#fbbf24");
  
  // Welcome Page Background state
  const [welcomeBackgroundType, setWelcomeBackgroundType] = useState("gradient");
  const [welcomeBackgroundImageUrl, setWelcomeBackgroundImageUrl] = useState("");
  const [welcomeBackgroundGifUrl, setWelcomeBackgroundGifUrl] = useState("");
  const [welcomeBackgroundVideoUrl, setWelcomeBackgroundVideoUrl] = useState("");
  const [welcomeSliderImages, setWelcomeSliderImages] = useState<string[]>([]);
  const [isUploadingWelcomeBg, setIsUploadingWelcomeBg] = useState(false);
  const [isUploadingSliderImage, setIsUploadingSliderImage] = useState(false);
  
  // Pakistani Payment Methods state
  const [easypaisaAccountNumber, setEasypaisaAccountNumber] = useState("");
  const [easypaisaAccountName, setEasypaisaAccountName] = useState("");
  const [jazzcashAccountNumber, setJazzcashAccountNumber] = useState("");
  const [jazzcashAccountName, setJazzcashAccountName] = useState("");
  const [hblAccountNumber, setHblAccountNumber] = useState("");
  const [hblAccountName, setHblAccountName] = useState("");
  const [hblIban, setHblIban] = useState("");
  const [ublAccountNumber, setUblAccountNumber] = useState("");
  const [ublAccountName, setUblAccountName] = useState("");
  const [ublIban, setUblIban] = useState("");

  useEffect(() => {
    if (restaurant) {
      setEditAddress(restaurant.address || "");
      setEditPhone(restaurant.phone || "");
      // Branding
      setLogoUrl(restaurant.logoUrl || "");
      setWelcomeImageUrl(restaurant.welcomeImageUrl || "");
      // Operating hours
      setDeliveryHoursMonThu(restaurant.deliveryHoursMonThu || "12PM - 10:30PM");
      setDeliveryHoursFriSat(restaurant.deliveryHoursFriSat || "12PM - 11:30PM");
      setDeliveryHoursSun(restaurant.deliveryHoursSun || "12PM - 10:30PM");
      setCollectionHoursMonThu(restaurant.collectionHoursMonThu || "12PM - 10:30PM");
      setCollectionHoursFriSat(restaurant.collectionHoursFriSat || "12PM - 11:30PM");
      setCollectionHoursSun(restaurant.collectionHoursSun || "12PM - 10:30PM");
      // Discount & Delivery
      setCollectionDiscountPercent(restaurant.collectionDiscountPercent || 10);
      setCollectionDiscountMinimum(restaurant.collectionDiscountMinimum || "15.00");
      setDeliveryTimeMinutes(restaurant.deliveryTimeMinutes || 45);
      setCollectionTimeMinutes(restaurant.collectionTimeMinutes || 20);
      setBusyModeEnabled(restaurant.busyModeEnabled || false);
      setBusyModeExtraMinutes(restaurant.busyModeExtraMinutes || 15);
      // Fees & Taxes
      setVatPercent(restaurant.vatPercent || "0");
      setVatEnabled(restaurant.vatEnabled || false);
      setServiceFeePercent(restaurant.serviceFeePercent || "0");
      setServiceFeeEnabled(restaurant.serviceFeeEnabled || false);
      setDeliveryFee(restaurant.deliveryFee || "0");
      setDeliveryFeeEnabled(restaurant.deliveryFeeEnabled || false);
      setFreeDeliveryMinimum(restaurant.freeDeliveryMinimum || "0");
      setFreeDeliveryEnabled(restaurant.freeDeliveryEnabled || false);
      setCutleryOptionEnabled(restaurant.cutleryOptionEnabled || false);
      setCutleryName((restaurant as any).cutleryName || "Cutlery Set");
      setCutleryPrice((restaurant as any).cutleryPrice || "0.50");
      // Role Login Passwords and Staff Names
      setKitchenLoginPassword(restaurant.kitchenLoginPassword || "");
      setKitchenStaffName((restaurant as any).kitchenStaffName || "");
      setEposLoginPassword(restaurant.eposLoginPassword || "");
      setEposStaffName((restaurant as any).eposStaffName || "");
      setWaiterLoginPassword(restaurant.waiterLoginPassword || "");
      setWaiterStaffName((restaurant as any).waiterStaffName || "");
      setSuppliersLoginPassword(restaurant.suppliersLoginPassword || "");
      setSuppliersStaffName((restaurant as any).suppliersStaffName || "");
      setFinancesLoginPassword(restaurant.financesLoginPassword || "");
      setFinancesStaffName((restaurant as any).financesStaffName || "");
      // Hero Gallery
      setHeroAnimationStyle(restaurant.heroAnimationStyle || "slide");
      setHeroSlideInterval((restaurant.heroSlideInterval || 5000) / 1000);
      setHeroGradientStart(restaurant.heroGradientStart || "#dc2626");
      setHeroGradientMiddle(restaurant.heroGradientMiddle || "#f97316");
      setHeroGradientEnd(restaurant.heroGradientEnd || "#fbbf24");
      // Welcome Page Background
      setWelcomeBackgroundType((restaurant as any).welcomeBackgroundType || "gradient");
      setWelcomeBackgroundImageUrl((restaurant as any).welcomeBackgroundImageUrl || "");
      setWelcomeBackgroundGifUrl((restaurant as any).welcomeBackgroundGifUrl || "");
      setWelcomeBackgroundVideoUrl((restaurant as any).welcomeBackgroundVideoUrl || "");
      setWelcomeSliderImages((restaurant as any).welcomeSliderImages || []);
      // Pakistani Payment Methods
      setEasypaisaAccountNumber((restaurant as any).easypaisaAccountNumber || "");
      setEasypaisaAccountName((restaurant as any).easypaisaAccountName || "");
      setJazzcashAccountNumber((restaurant as any).jazzcashAccountNumber || "");
      setJazzcashAccountName((restaurant as any).jazzcashAccountName || "");
      setHblAccountNumber((restaurant as any).hblAccountNumber || "");
      setHblAccountName((restaurant as any).hblAccountName || "");
      setHblIban((restaurant as any).hblIban || "");
      setUblAccountNumber((restaurant as any).ublAccountNumber || "");
      setUblAccountName((restaurant as any).ublAccountName || "");
      setUblIban((restaurant as any).ublIban || "");
      // App Icon settings
      setAppIconUrl((restaurant as any).appIconUrl || "");
      setAppName((restaurant as any).appName || restaurant.name || "");
      setAppShortName((restaurant as any).appShortName || restaurant.name?.substring(0, 12) || "");
      setAppThemeColor((restaurant as any).appThemeColor || "#8B0000");
      setAppBackgroundColor((restaurant as any).appBackgroundColor || "#ffffff");
    }
  }, [restaurant]);

  const updateRestaurantMutation = useMutation({
    mutationFn: (data: any) => updateRestaurant(restaurantId!, data),
    onSuccess: () => {
      // Invalidate all restaurant-related queries to refresh data everywhere
      queryClient.invalidateQueries({ queryKey: ["/api/restaurants", slug] });
      queryClient.invalidateQueries({ queryKey: ["/api/restaurants"] }); // For Super Admin list
      queryClient.invalidateQueries({ queryKey: ["/api/restaurants", restaurantId] });
      toast({ title: "Settings Saved", description: "Your branch settings have been updated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save settings", variant: "destructive" });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ categoryId, name, icon, slug }: { categoryId: string; name: string; icon: string; slug?: string }) => {
      // If no dbId (empty string), create a new category for this restaurant
      if (!categoryId) {
        const createResponse = await fetch(`/api/menu-categories`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            name, 
            icon, 
            slug: slug,
            sortOrder: 0,
            restaurantId 
          }),
        });
        if (!createResponse.ok) throw new Error("Failed to create category");
        return createResponse.json();
      }
      
      // Update the category directly - each restaurant has its own categories
      const response = await fetch(`/api/menu-categories/${categoryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, icon }),
      });
      if (!response.ok) throw new Error("Failed to update category");
      return response.json();
    },
    onSuccess: (newCategory) => {
      // Immediately refresh category list to get the latest state
      queryClient.invalidateQueries({ queryKey: ["/api/menu-categories", restaurantId] });
      queryClient.invalidateQueries({ queryKey: ["/api/menu", restaurantId] });
      // Clear editing state - UI will refresh with new category data
      setEditingCategoryId(null);
      setEditingCategoryName("");
      setEditingCategoryIcon("");
      setEditingCategorySlug("");
      toast({ title: "Category Updated", description: "Category name and icon have been updated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update category", variant: "destructive" });
    },
  });

  const startEditCategory = (categoryDbId: string, name: string, icon: string, slug: string) => {
    setEditingCategoryId(categoryDbId);
    setEditingCategoryName(name);
    setEditingCategoryIcon(icon);
    setEditingCategorySlug(slug);
  };

  const saveCategory = () => {
    if (!editingCategoryId) return;
    // Check for duplicate category name (case-insensitive)
    const existingCategory = dynamicCategories.find(
      cat => cat.name.toLowerCase() === editingCategoryName.toLowerCase() && 
             cat.dbId !== editingCategoryId
    );
    if (existingCategory) {
      toast({ 
        title: "Duplicate Category", 
        description: `A category named "${editingCategoryName}" already exists.`, 
        variant: "destructive" 
      });
      return;
    }
    updateCategoryMutation.mutate({
      categoryId: editingCategoryId,
      name: editingCategoryName,
      icon: editingCategoryIcon,
      slug: editingCategorySlug,
    });
  };

  const cancelEditCategory = () => {
    setEditingCategoryId(null);
    setEditingCategoryName("");
    setEditingCategoryIcon("");
    setEditingCategorySlug("");
  };

  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      const response = await fetch(`/api/menu-categories/${categoryId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete category");
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/menu-categories", restaurantId] });
      setDeleteCategoryConfirm(null);
      toast({ title: "Category Deleted", description: "The category has been removed." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete category", variant: "destructive" });
    },
  });

  const updateCategoryVisibilityMutation = useMutation({
    mutationFn: async ({ categoryId, field, value }: { categoryId: string; field: string; value: boolean }) => {
      const response = await fetch(`/api/menu-categories/${categoryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (!response.ok) throw new Error("Failed to update visibility");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/menu-categories", restaurantId] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update visibility", variant: "destructive" });
    },
  });

  const handleDeleteCategory = () => {
    if (!deleteCategoryConfirm?.dbId) return;
    deleteCategoryMutation.mutate(deleteCategoryConfirm.dbId);
  };

  // Option Groups mutations
  const createOptionGroupMutation = useMutation({
    mutationFn: async (data: { menuItemId: string; headline: string; isRequired: boolean; minSelections: number; maxSelections: number; allowQuantity?: boolean; maxQuantityPerOption?: number }) => {
      const response = await fetch(`/api/restaurants/${restaurantId}/topping-groups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create option group");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/topping-groups", restaurantId] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create option group", variant: "destructive" });
    },
  });

  const deleteOptionGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      const response = await fetch(`/api/topping-groups/${groupId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete group");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/topping-groups", restaurantId] });
      toast({ title: "Group Deleted" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete group", variant: "destructive" });
    },
  });

  const addOptionMutation = useMutation({
    mutationFn: async ({ groupId, name, price, image }: { groupId: string; name: string; price: string; image?: string }) => {
      const response = await fetch(`/api/topping-groups/${groupId}/options`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, price, image }),
      });
      if (!response.ok) throw new Error("Failed to add option");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/topping-groups", restaurantId] });
      setNewOptionName("");
      setNewOptionPrice("0.00");
      toast({ title: "Option Added" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add option", variant: "destructive" });
    },
  });

  const deleteOptionMutation = useMutation({
    mutationFn: async (optionId: string) => {
      const response = await fetch(`/api/topping-group-options/${optionId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete option");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/topping-groups", restaurantId] });
      toast({ title: "Option Deleted" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete option", variant: "destructive" });
    },
  });

  const toggleOptionAvailability = useMutation({
    mutationFn: async ({ optionId, optionName, isAvailable }: { optionId: string; optionName: string; isAvailable: boolean }) => {
      if (!restaurantId) throw new Error("Restaurant not loaded");
      const response = await fetch(`/api/topping-group-options/sync-availability`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurantId, optionName, isAvailable }),
      });
      if (!response.ok) throw new Error("Failed to update option");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/topping-groups", restaurantId] });
      toast({ 
        title: data.isAvailable ? "Option Available" : "Option Sold Out",
        description: `"${data.optionName}" updated across ${data.updatedCount} group${data.updatedCount !== 1 ? 's' : ''}`
      });
    },
  });

  // Size variant mutations
  const addVariantMutation = useMutation({
    mutationFn: async ({ menuItemId, name, price }: { menuItemId: string; name: string; price: string }) => {
      return createMenuItemVariant(menuItemId, { name, price, sortOrder: editingItemVariants.length });
    },
    onSuccess: (newVariant) => {
      setEditingItemVariants(prev => [...prev, newVariant]);
      setNewVariantName("");
      setNewVariantPrice("");
      queryClient.invalidateQueries({ queryKey: ["/api/menu-with-variants", restaurantId] });
      toast({ title: "Size Added", description: `Added "${newVariant.name}" size option` });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add size variant", variant: "destructive" });
    },
  });

  const deleteVariantMutation = useMutation({
    mutationFn: async (variantId: string) => {
      await deleteMenuItemVariant(variantId);
      return variantId;
    },
    onSuccess: (deletedId) => {
      setEditingItemVariants(prev => prev.filter(v => v.id !== deletedId));
      queryClient.invalidateQueries({ queryKey: ["/api/menu-with-variants", restaurantId] });
      toast({ title: "Size Removed" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete size variant", variant: "destructive" });
    },
  });

  const toggleVariantAvailabilityMutation = useMutation({
    mutationFn: async ({ variantId, available }: { variantId: string; available: boolean }) => {
      return updateMenuItemVariant(variantId, { available });
    },
    onSuccess: (updatedVariant) => {
      setEditingItemVariants(prev => prev.map(v => v.id === updatedVariant.id ? { ...v, available: updatedVariant.available } : v));
      queryClient.invalidateQueries({ queryKey: ["/api/menu-with-variants", restaurantId] });
      toast({ title: updatedVariant.available ? "Size Available" : "Size Sold Out", description: `"${updatedVariant.name}" ${updatedVariant.available ? 'is now available' : 'marked as sold out'}` });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update size availability", variant: "destructive" });
    },
  });

  const handleCreateOptionGroup = async () => {
    if (optionGroupMenuItems.length === 0 || !optionGroupHeadline) {
      toast({ title: "Missing Fields", description: "Please select at least one menu item and enter a headline", variant: "destructive" });
      return;
    }
    
    let successCount = 0;
    for (const menuItemId of optionGroupMenuItems) {
      try {
        await createOptionGroupMutation.mutateAsync({
          menuItemId,
          headline: optionGroupHeadline,
          isRequired: optionGroupIsRequired,
          minSelections: optionGroupMinSelections,
          maxSelections: optionGroupMaxSelections,
          allowQuantity: optionGroupAllowQuantity,
          maxQuantityPerOption: optionGroupMaxQuantity,
        });
        successCount++;
      } catch (error) {
        console.error(`Failed to create group for menu item ${menuItemId}:`, error);
      }
    }
    
    if (successCount > 0) {
      setShowAddOptionGroup(false);
      setOptionGroupCategories([]);
      setOptionGroupMenuItems([]);
      setOptionGroupTempCategory("");
      setOptionGroupTempMenuItem("");
      setOptionGroupHeadline("Choose Your Drink");
      setOptionGroupIsRequired(true);
      setOptionGroupMinSelections(0);
      setOptionGroupMaxSelections(1);
      setOptionGroupAllowQuantity(false);
      setOptionGroupMaxQuantity(5);
      toast({ 
        title: "Option Groups Created", 
        description: `Created ${successCount} option group${successCount > 1 ? 's' : ''} for ${successCount} menu item${successCount > 1 ? 's' : ''}.` 
      });
    }
  };

  const handleAddOption = (groupId: string) => {
    if (!newOptionName.trim()) return;
    addOptionMutation.mutate({ groupId, name: newOptionName, price: newOptionPrice });
  };

  // Quick-add menu item as option
  const handleQuickAddFromMenu = (groupId: string, menuItem: typeof menuItems[0]) => {
    addOptionMutation.mutate({ 
      groupId, 
      name: menuItem.name, 
      price: String(menuItem.price),
      image: menuItem.image || undefined
    });
    setQuickAddMenuItem("");
  };

  // Copy options from one group to all other groups with same headline
  const [isCopying, setIsCopying] = useState(false);
  
  const handleCopyOptionsToSimilarGroups = async (sourceGroup: ToppingGroupWithOptions) => {
    const similarGroups = toppingGroups.filter(
      g => g.id !== sourceGroup.id && g.headline === sourceGroup.headline
    );
    
    if (similarGroups.length === 0) {
      toast({ 
        title: "No Similar Groups", 
        description: `No other groups found with headline "${sourceGroup.headline}"`,
        variant: "destructive"
      });
      return;
    }
    
    setIsCopying(true);
    let copiedCount = 0;
    
    try {
      const copyPromises: Promise<Response>[] = [];
      
      for (const targetGroup of similarGroups) {
        for (const option of sourceGroup.options) {
          const existingOption = targetGroup.options.find(o => o.name === option.name);
          if (!existingOption) {
            copyPromises.push(
              fetch(`/api/topping-groups/${targetGroup.id}/options`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                  name: option.name, 
                  price: String(option.price),
                  image: option.image || undefined
                }),
              })
            );
            copiedCount++;
          }
        }
      }
      
      await Promise.all(copyPromises);
      queryClient.invalidateQueries({ queryKey: ["/api/topping-groups", restaurantId] });
      
      toast({ 
        title: "Options Copied", 
        description: `Copied ${copiedCount} option${copiedCount !== 1 ? 's' : ''} to ${similarGroups.length} group${similarGroups.length !== 1 ? 's' : ''}`
      });
    } catch (error) {
      console.error("Failed to copy options:", error);
      toast({ 
        title: "Error", 
        description: "Some options failed to copy",
        variant: "destructive"
      });
    } finally {
      setIsCopying(false);
    }
  };


  // Helper to check if item category matches a category slug (handles slug vs name)
  const itemMatchesCategory = (itemCategory: string, categorySlug: string) => {
    const cat = dynamicCategories.find(c => c.slug === categorySlug);
    if (!cat) return itemCategory === categorySlug;
    return itemCategory === cat.slug || 
           itemCategory === cat.name || 
           itemCategory.toLowerCase().replace(/\s+/g, '-') === cat.slug;
  };

  // Filter menu items for option group selection
  const filteredMenuItemsForOptionGroup = useMemo(() => {
    if (optionGroupCategories.length === 0) return [];
    return menuItems.filter(item => 
      optionGroupCategories.some(catSlug => itemMatchesCategory(item.category, catSlug))
    );
  }, [optionGroupCategories, menuItems, dynamicCategories]);
  
  const filteredMenuItemsForTempCategory = useMemo(() => {
    if (!optionGroupTempCategory) return [];
    return menuItems.filter(item => itemMatchesCategory(item.category, optionGroupTempCategory));
  }, [optionGroupTempCategory, menuItems, dynamicCategories]);

  // Filter menu items for quick-add based on selected category
  const filteredMenuItemsForQuickAdd = useMemo(() => {
    if (!quickAddCategory) return [];
    return menuItems.filter(item => itemMatchesCategory(item.category, quickAddCategory));
  }, [quickAddCategory, menuItems, dynamicCategories]);

  const handleSaveDetails = async () => {
    setSaving(true);
    try {
      await updateRestaurantMutation.mutateAsync({
        address: editAddress,
        phone: editPhone,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBranding = async () => {
    setSaving(true);
    try {
      await updateRestaurantMutation.mutateAsync({ logoUrl, welcomeImageUrl });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveHours = async () => {
    setSaving(true);
    try {
      await updateRestaurantMutation.mutateAsync({
        deliveryHoursMonThu, deliveryHoursFriSat, deliveryHoursSun,
        collectionHoursMonThu, collectionHoursFriSat, collectionHoursSun
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDiscount = async () => {
    setSaving(true);
    try {
      await updateRestaurantMutation.mutateAsync({ collectionDiscountPercent, collectionDiscountMinimum });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveFees = async () => {
    setSaving(true);
    try {
      await updateRestaurantMutation.mutateAsync({
        vatPercent,
        vatEnabled,
        serviceFeePercent,
        serviceFeeEnabled,
        deliveryFee,
        deliveryFeeEnabled,
        freeDeliveryMinimum,
        freeDeliveryEnabled,
        cutleryOptionEnabled,
        cutleryName,
        cutleryPrice,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDeliveryTime = async () => {
    setSaving(true);
    try {
      await updateRestaurantMutation.mutateAsync({ 
        deliveryTimeMinutes, 
        collectionTimeMinutes,
        busyModeExtraMinutes 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveHeroGallery = async () => {
    setSaving(true);
    try {
      await updateRestaurantMutation.mutateAsync({
        heroAnimationStyle,
        heroSlideInterval: heroSlideInterval * 1000,
        heroGradientStart, heroGradientMiddle, heroGradientEnd
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveWelcomeBackground = async () => {
    setSaving(true);
    try {
      await updateRestaurantMutation.mutateAsync({
        welcomeBackgroundType,
        welcomeBackgroundImageUrl,
        welcomeBackgroundGifUrl,
        welcomeBackgroundVideoUrl,
        welcomeSliderImages,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleWelcomeBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'gif' | 'video') => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingWelcomeBg(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, filename: file.name }),
      });
      if (response.ok) {
        const { url } = await response.json();
        if (type === 'image') setWelcomeBackgroundImageUrl(url);
        else if (type === 'gif') setWelcomeBackgroundGifUrl(url);
        else if (type === 'video') setWelcomeBackgroundVideoUrl(url);
        toast({ title: "Uploaded", description: `${type.charAt(0).toUpperCase() + type.slice(1)} ready to save.` });
      }
      setIsUploadingWelcomeBg(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSliderImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingSliderImage(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, filename: file.name }),
      });
      if (response.ok) {
        const { url } = await response.json();
        setWelcomeSliderImages(prev => [...prev, url]);
        toast({ title: "Image Added", description: "Slider image added." });
      }
      setIsUploadingSliderImage(false);
    };
    reader.readAsDataURL(file);
  };

  const removeSliderImage = (index: number) => {
    setWelcomeSliderImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSavePakistaniPayments = async () => {
    setSaving(true);
    try {
      await updateRestaurantMutation.mutateAsync({
        easypaisaAccountNumber,
        easypaisaAccountName,
        jazzcashAccountNumber,
        jazzcashAccountName,
        hblAccountNumber,
        hblAccountName,
        hblIban,
        ublAccountNumber,
        ublAccountName,
        ublIban,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingLogo(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, filename: file.name }),
      });
      if (response.ok) {
        const { url } = await response.json();
        setLogoUrl(url);
        toast({ title: "Logo Uploaded", description: "Logo ready to save." });
      }
      setIsUploadingLogo(false);
    };
    reader.readAsDataURL(file);
  };

  const handleWelcomeImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingWelcome(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, filename: file.name }),
      });
      if (response.ok) {
        const { url } = await response.json();
        setWelcomeImageUrl(url);
        toast({ title: "Image Uploaded", description: "Highlight image ready to save." });
      }
      setIsUploadingWelcome(false);
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploadingImage(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        const response = await fetch('/api/upload-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64, filename: file.name }),
        });
        if (response.ok) {
          const data = await response.json();
          setNewMenuItemImage(data.url);
          toast({ title: "Image Uploaded", description: "Image uploaded successfully!" });
        } else {
          toast({ title: "Upload Failed", description: "Could not upload image", variant: "destructive" });
        }
        setIsUploadingImage(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast({ title: "Upload Failed", description: "Could not upload image", variant: "destructive" });
      setIsUploadingImage(false);
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
        available: true,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/menu", restaurantId] });
      toast({ title: "Menu Item Added", description: `${newMenuItemName} has been added.` });
      setShowAddMenuItem(false);
      setNewMenuItemName("");
      setNewMenuItemPrice("");
      setNewMenuItemCategory("");
      setNewMenuItemDescription("");
      setNewMenuItemImage("");
    } catch (error) {
      toast({ title: "Error", description: "Failed to add menu item", variant: "destructive" });
    }
  };

  const handleToggleAvailability = async (item: MenuItem) => {
    try {
      await updateMenuItem(item.id, { available: !item.available });
      queryClient.invalidateQueries({ queryKey: ["/api/menu", restaurantId] });
      toast({ 
        title: item.available ? "Item Disabled" : "Item Enabled", 
        description: `${item.name} is now ${item.available ? "sold out" : "available"}` 
      });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update item", variant: "destructive" });
    }
  };

  const handleUpdatePrice = async (item: MenuItem) => {
    const newPrice = editingPrices[item.id]?.trim().replace(/^£/, '').replace(/p$/i, '');
    if (!newPrice) {
      setEditingPrices(prev => { const u = {...prev}; delete u[item.id]; return u; });
      return;
    }
    try {
      await updateMenuItem(item.id, { price: newPrice });
      queryClient.invalidateQueries({ queryKey: ["/api/menu", restaurantId] });
      toast({ title: "Price Updated", description: `${item.name} price updated to ${currencySymbol}${newPrice}` });
      setEditingPrices(prev => { const u = {...prev}; delete u[item.id]; return u; });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update price", variant: "destructive" });
    }
  };

  const handleDeleteMenuItem = async (item: MenuItem) => {
    try {
      await deleteMenuItem(item.id);
      queryClient.invalidateQueries({ queryKey: ["/api/menu", restaurantId] });
      toast({ title: "Menu Item Deleted", description: `${item.name} has been removed.` });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete menu item", variant: "destructive" });
    }
  };

  const startEditingItem = (item: MenuItem) => {
    const itemId = item.id;
    setEditingItemId(itemId);
    setEditingItem({
      name: item.name,
      description: item.description || "",
      price: item.price,
      image: item.image || "",
      videoUrl: (item as any).videoUrl || "",
      category: item.category,
    });
    setEditingItemVariants([]);
    setLoadingVariants(true);
    // Load variants for this item asynchronously with race condition protection
    getMenuItemVariants(itemId)
      .then(variants => {
        // Only update if we're still editing the same item
        setEditingItemId(currentId => {
          if (currentId === itemId) {
            setEditingItemVariants(variants);
          }
          return currentId;
        });
      })
      .catch(() => {
        setEditingItemId(currentId => {
          if (currentId === itemId) {
            setEditingItemVariants([]);
          }
          return currentId;
        });
      })
      .finally(() => {
        setEditingItemId(currentId => {
          if (currentId === itemId) {
            setLoadingVariants(false);
          }
          return currentId;
        });
      });
  };

  const cancelEditingItem = () => {
    setEditingItemId(null);
    setEditingItem({ name: "", description: "", price: "", image: "", videoUrl: "", category: "" });
    setEditingItemVariants([]);
    setLoadingVariants(false);
    setNewVariantName("");
    setNewVariantPrice("");
  };

  const handleEditImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploadingEditImage(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        const response = await fetch('/api/upload-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64, filename: file.name }),
        });
        if (response.ok) {
          const { url } = await response.json();
          setEditingItem(prev => ({ ...prev, image: url }));
          toast({ title: "Image Uploaded", description: "New image ready to save." });
        }
        setIsUploadingEditImage(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setIsUploadingEditImage(false);
      toast({ title: "Error", description: "Failed to upload image", variant: "destructive" });
    }
  };

  const handleEditVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const validTypes = ['video/mp4', 'video/webm'];
    if (!validTypes.includes(file.type)) {
      toast({ title: "Invalid file type", description: "Please upload an MP4 or WebM video.", variant: "destructive" });
      return;
    }
    
    if (file.size > 50 * 1024 * 1024) {
      toast({ title: "File too large", description: "Video must be under 50MB.", variant: "destructive" });
      return;
    }
    
    setIsUploadingEditVideo(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      if (response.ok) {
        const { url } = await response.json();
        setEditingItem(prev => ({ ...prev, videoUrl: url }));
        toast({ title: "Video Uploaded", description: "Video ready to save." });
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to upload video", variant: "destructive" });
    } finally {
      setIsUploadingEditVideo(false);
    }
  };

  const handleSaveMenuItem = async () => {
    if (!editingItemId || !editingItem.name || !editingItem.price) {
      toast({ title: "Required Fields", description: "Name and price are required.", variant: "destructive" });
      return;
    }
    try {
      await updateMenuItem(editingItemId, {
        name: editingItem.name,
        description: editingItem.description,
        price: editingItem.price,
        image: editingItem.image,
        videoUrl: editingItem.videoUrl || null,
        category: editingItem.category,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/menu", restaurantId] });
      toast({ title: "Menu Item Updated", description: `${editingItem.name} has been updated.` });
      cancelEditingItem();
    } catch (error) {
      toast({ title: "Error", description: "Failed to update menu item", variant: "destructive" });
    }
  };

  const handleAddTopping = async () => {
    if (!newToppingName || !newToppingPrice || !restaurantId) {
      toast({ title: "Required Fields", description: "Please enter name and price.", variant: "destructive" });
      return;
    }
    try {
      await createExtraTopping(restaurantId, {
        name: newToppingName,
        price: newToppingPrice,
        menuItemId: newToppingMenuItem || undefined,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/extra-toppings", restaurantId] });
      toast({ title: "Topping Added", description: `${newToppingName} has been added.` });
      setNewToppingName("");
      setNewToppingPrice("1.00");
      setNewToppingCategory("");
      setNewToppingMenuItem("");
    } catch (error) {
      toast({ title: "Error", description: "Failed to add topping", variant: "destructive" });
    }
  };

  const handleDeleteTopping = async (topping: ExtraTopping) => {
    try {
      await deleteExtraTopping(topping.id);
      queryClient.invalidateQueries({ queryKey: ["/api/extra-toppings", restaurantId] });
      toast({ title: "Topping Deleted", description: `${topping.name} has been removed.` });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete topping", variant: "destructive" });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "Link copied to clipboard" });
  };

  const filteredMenuItemsForTopping = newToppingCategory
    ? menuItems.filter(item => itemMatchesCategory(item.category, newToppingCategory))
    : [];

  const categoriesWithItems = dynamicCategories.filter(cat => 
    menuItems.some(item => {
      if (!item.category) return false;
      // Match by category ID (dbId) first - this is how Hello Mumbai stores categories
      if (item.category === cat.dbId) return true;
      const itemCat = item.category.toLowerCase();
      const catSlug = cat.slug.toLowerCase();
      const catName = cat.name.toLowerCase();
      return itemCat === catSlug || 
        itemCat === catName || 
        itemCat.replace(/\s+/g, '-') === catSlug ||
        itemCat.replace(/[&]/g, '').replace(/\s+/g, '-') === catSlug ||
        catName.includes(itemCat) ||
        itemCat.includes(catName.replace(/[&]/g, '').trim());
    })
  );

  if (loadingRestaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)'}}>
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)'}}>
        <div className="text-center text-white">
          <h2 className="text-xl font-bold mb-2">Branch Not Found</h2>
          <Link href="/admin">
            <Button variant="outline">Back to Admin</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-8" style={{background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)'}}>
      <style>{`
        .premium-card {
          background: linear-gradient(145deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.95));
          border: 1px solid rgba(6, 182, 212, 0.2);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05);
        }
        .stat-card-3d {
          background: linear-gradient(145deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9));
          border: 1px solid rgba(6, 182, 212, 0.15);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
          transition: all 0.3s ease;
        }
        .stat-card-3d:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(6, 182, 212, 0.15);
        }
      `}</style>

      <header className="px-4 py-4 sticky top-0 z-40" style={{background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)', borderBottom: '2px solid rgba(6, 182, 212, 0.3)'}}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/dashboard/${slug}`}>
              <Button variant="ghost" size="icon" className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-600 flex items-center justify-center font-bold text-white text-xl shadow-xl border-2 border-cyan-400/50">
                {restaurant.name.charAt(0)}
              </div>
              <div>
                <h1 className="font-bold text-lg text-white">{restaurant.name}</h1>
                <p className="text-xs text-cyan-400 flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {restaurant.address}
                </p>
              </div>
            </div>
          </div>
          <Badge className={`${restaurant.status === "open" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"}`}>
            {restaurant.status === "open" ? "Open" : "Closed"}
          </Badge>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full bg-slate-800/50 border border-slate-700/50 p-1 rounded-xl flex-wrap h-auto gap-1">
            <TabsTrigger value="details" className="flex-1 min-w-[80px] data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 rounded-lg text-xs md:text-sm">
              <Store className="h-4 w-4 mr-1" /> Details
            </TabsTrigger>
            <TabsTrigger value="branding" className="flex-1 min-w-[80px] data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400 rounded-lg text-xs md:text-sm">
              <Image className="h-4 w-4 mr-1" /> Branding
            </TabsTrigger>
            <TabsTrigger value="operations" className="flex-1 min-w-[80px] data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 rounded-lg text-xs md:text-sm">
              <Clock className="h-4 w-4 mr-1" /> Hours
            </TabsTrigger>
            <TabsTrigger value="links" className="flex-1 min-w-[80px] data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400 rounded-lg text-xs md:text-sm">
              <Globe className="h-4 w-4 mr-1" /> Links
            </TabsTrigger>
            <TabsTrigger value="access" className="flex-1 min-w-[80px] data-[state=active]:bg-rose-500/20 data-[state=active]:text-rose-400 rounded-lg text-xs md:text-sm">
              <Key className="h-4 w-4 mr-1" /> Access
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex-1 min-w-[80px] data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400 rounded-lg text-xs md:text-sm">
              <Wallet className="h-4 w-4 mr-1" /> Payments
            </TabsTrigger>
            <TabsTrigger value="app" className="flex-1 min-w-[80px] data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-400 rounded-lg text-xs md:text-sm">
              <Smartphone className="h-4 w-4 mr-1" /> App Icon
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-6 space-y-6">
            <Card className="premium-card border-0">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Building className="h-5 w-5 text-cyan-400" />
                  Branch Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-cyan-400" /> Address
                    </Label>
                    <Input
                      value={editAddress}
                      onChange={(e) => setEditAddress(e.target.value)}
                      className="bg-slate-800/50 border-slate-600 text-white"
                      placeholder="Enter address"
                      data-testid="input-branch-address"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300 flex items-center gap-2">
                      <Phone className="h-4 w-4 text-cyan-400" /> Phone
                    </Label>
                    <Input
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="bg-slate-800/50 border-slate-600 text-white"
                      placeholder="Enter phone number"
                      data-testid="input-branch-phone"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300 flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-cyan-400" /> Stripe Account
                    </Label>
                    <Input
                      value={restaurant.stripeAccountId || "Not connected"}
                      className="bg-slate-800/50 border-slate-600 text-slate-400"
                      disabled
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300 flex items-center gap-2">
                      <Globe className="h-4 w-4 text-amber-400" /> Currency
                      <span className="text-xs text-slate-500">(Set by Super Admin)</span>
                    </Label>
                    <Input
                      value={(() => {
                        const currCode = restaurant?.currency || "GBP";
                        const curr = CURRENCIES.find(c => c.code === currCode);
                        return curr ? `${curr.symbol} ${curr.name} (${curr.country})` : currCode;
                      })()}
                      className="bg-slate-800/50 border-slate-600 text-slate-400"
                      disabled
                      data-testid="input-currency-display"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    onClick={handleSaveDetails}
                    disabled={saving}
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white"
                    data-testid="button-save-details"
                  >
                    {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="premium-card border-0">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Settings className="h-5 w-5 text-cyan-400" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="stat-card-3d rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-cyan-400">{menuItems.length}</div>
                    <div className="text-xs text-slate-400">Menu Items</div>
                  </div>
                  <div className="stat-card-3d rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-purple-400">{extraToppings.length}</div>
                    <div className="text-xs text-slate-400">Extra Toppings</div>
                  </div>
                  <div className="stat-card-3d rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-amber-400">{currencySymbol}</div>
                    <div className="text-xs text-slate-400">{restaurant.currency || "GBP"}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="premium-card border-0">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <UtensilsCrossed className="h-5 w-5 text-emerald-400" />
                  {restaurant.name} Menu
                  <Badge className="ml-2 bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                    {menuItems.length} items in {categoriesWithItems.length} categories
                  </Badge>
                </CardTitle>
                <Button
                  onClick={() => setShowAddMenuItem(!showAddMenuItem)}
                  className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white"
                  data-testid="button-add-menu-item"
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Menu Item
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {showAddMenuItem && (
                  <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-white font-semibold">Add New Menu Item</h4>
                      <Button size="icon" variant="ghost" onClick={() => setShowAddMenuItem(false)} className="text-slate-400 hover:text-white">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-slate-300">Name *</Label>
                        <Input
                          value={newMenuItemName}
                          onChange={(e) => setNewMenuItemName(e.target.value)}
                          className="bg-slate-900/50 border-slate-600 text-white"
                          placeholder="Item name"
                          data-testid="input-new-menu-name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-300">Price *</Label>
                        <Input
                          value={newMenuItemPrice}
                          onChange={(e) => setNewMenuItemPrice(e.target.value)}
                          className="bg-slate-900/50 border-slate-600 text-white"
                          placeholder="5.99"
                          data-testid="input-new-menu-price"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-300">Category</Label>
                        <Select value={newMenuItemCategory} onValueChange={setNewMenuItemCategory}>
                          <SelectTrigger className="bg-slate-900/50 border-slate-600 text-white" data-testid="select-new-menu-category">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="max-h-60 overflow-y-auto">
                            {categoriesWithItems.map(cat => (
                              <SelectItem key={cat.id} value={cat.name}>{cat.icon} {cat.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-300">Image</Label>
                        <div className="flex gap-2">
                          <Input
                            value={newMenuItemImage}
                            onChange={(e) => setNewMenuItemImage(e.target.value)}
                            className="bg-slate-900/50 border-slate-600 text-white flex-1"
                            placeholder="Image URL"
                            data-testid="input-new-menu-image"
                          />
                          <div className="relative">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <Button type="button" variant="outline" size="icon" disabled={isUploadingImage} className="border-slate-600">
                              {isUploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <Label className="text-slate-300">Description</Label>
                        <Input
                          value={newMenuItemDescription}
                          onChange={(e) => setNewMenuItemDescription(e.target.value)}
                          className="bg-slate-900/50 border-slate-600 text-white"
                          placeholder="Optional description"
                          data-testid="input-new-menu-description"
                        />
                      </div>
                    </div>
                    <Button
                      onClick={handleAddMenuItem}
                      className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white"
                      data-testid="button-submit-menu-item"
                    >
                      Add Item
                    </Button>
                  </div>
                )}

                <div className="space-y-4 max-h-[500px] overflow-y-auto">
                  {dynamicCategories.map(category => {
                    const categoryItems = menuItems.filter(m => 
                      m.category === category.dbId ||
                      m.category === category.slug || 
                      m.category === category.name || 
                      m.category.toLowerCase().replace(/\s+/g, '-') === category.slug
                    );
                    const isEditingThisCategory = editingCategoryId === category.dbId;
                    
                    return (
                      <div key={category.id} className="space-y-2">
                        {isEditingThisCategory ? (
                          <div className="flex items-center gap-2 sticky top-0 bg-slate-900/90 py-2 backdrop-blur-sm">
                            <Input
                              value={editingCategoryIcon}
                              onChange={(e) => setEditingCategoryIcon(e.target.value)}
                              className="w-16 bg-slate-800 border-slate-600 text-white text-center"
                              placeholder="🍽️"
                              data-testid={`input-category-icon-${category.id}`}
                            />
                            <Input
                              value={editingCategoryName}
                              onChange={(e) => setEditingCategoryName(e.target.value)}
                              className="flex-1 bg-slate-800 border-slate-600 text-white"
                              placeholder="Category Name"
                              data-testid={`input-category-name-${category.id}`}
                            />
                            <Button
                              size="icon"
                              onClick={saveCategory}
                              disabled={updateCategoryMutation.isPending}
                              className="bg-emerald-600 hover:bg-emerald-700 h-8 w-8"
                              data-testid={`button-save-category-${category.id}`}
                            >
                              {updateCategoryMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={cancelEditCategory}
                              className="text-slate-400 hover:text-white h-8 w-8"
                              data-testid={`button-cancel-category-${category.id}`}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <h4 className="text-sm font-semibold flex items-center gap-2 text-amber-400 sticky top-0 bg-slate-900/90 py-2 backdrop-blur-sm">
                            <span>{category.icon}</span> {category.name}
                            <div className="flex items-center gap-1 ml-auto">
                              {category.dbId && (
                                <>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => startEditCategory(category.dbId, category.name, category.icon, category.id)}
                                    className="h-6 w-6 text-slate-400 hover:text-amber-400"
                                    data-testid={`button-edit-category-${category.id}`}
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => setDeleteCategoryConfirm({ 
                                      id: category.id, 
                                      dbId: category.dbId, 
                                      name: category.name, 
                                      itemCount: categoryItems.length 
                                    })}
                                    className="h-6 w-6 text-red-400 hover:text-red-500"
                                    data-testid={`button-delete-category-${category.id}`}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </h4>
                        )}
                        <div className="space-y-2">
                          {categoryItems.map(item => (
                            editingItemId === item.id ? (
                              <div 
                                key={item.id} 
                                className="rounded-lg p-4 bg-slate-800/80 border border-cyan-500/30 space-y-4"
                                data-testid={`menu-item-edit-${item.id}`}
                              >
                                <div className="flex items-center justify-between">
                                  <h4 className="text-cyan-400 font-semibold flex items-center gap-2">
                                    <Pencil className="h-4 w-4" /> Edit Menu Item
                                  </h4>
                                  <Button size="icon" variant="ghost" onClick={cancelEditingItem} className="text-slate-400 hover:text-white">
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label className="text-slate-300">Name *</Label>
                                    <Input
                                      value={editingItem.name}
                                      onChange={(e) => setEditingItem(prev => ({...prev, name: e.target.value}))}
                                      className="bg-slate-900/50 border-slate-600 text-white"
                                      data-testid="input-edit-menu-name"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-slate-300">
                                      {editingItemVariants.length > 0 ? 'Fallback Price' : 'Price'} ({currencySymbol}) *
                                      {editingItemVariants.length > 0 && (
                                        <span className="text-amber-400 text-xs ml-2">(sizes added below)</span>
                                      )}
                                      {loadingVariants && (
                                        <span className="text-slate-500 text-xs ml-2">(checking sizes...)</span>
                                      )}
                                    </Label>
                                    <Input
                                      value={editingItem.price}
                                      onChange={(e) => setEditingItem(prev => ({...prev, price: e.target.value}))}
                                      className={`bg-slate-900/50 border-slate-600 text-white ${(editingItemVariants.length > 0 || loadingVariants) ? 'opacity-50' : ''}`}
                                      disabled={editingItemVariants.length > 0 || loadingVariants}
                                      data-testid="input-edit-menu-price"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-slate-300">Category</Label>
                                    <Select value={editingItem.category} onValueChange={(v) => setEditingItem(prev => ({...prev, category: v}))}>
                                      <SelectTrigger className="bg-slate-900/50 border-slate-600 text-white" data-testid="select-edit-menu-category">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent className="max-h-60 overflow-y-auto">
                                        {categoriesWithItems.map(cat => (
                                          <SelectItem key={cat.id} value={cat.name}>{cat.icon} {cat.name}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-slate-300">Image</Label>
                                    <div className="flex gap-2 items-center">
                                      {editingItem.image && (
                                        <div className="h-16 w-16 rounded-lg border border-slate-600 overflow-hidden flex-shrink-0">
                                          <img src={editingItem.image} alt="Preview" className="h-full w-full object-cover" />
                                        </div>
                                      )}
                                      <Input
                                        value={editingItem.image}
                                        onChange={(e) => setEditingItem(prev => ({...prev, image: e.target.value}))}
                                        className="bg-slate-900/50 border-slate-600 text-white flex-1 min-w-0"
                                        placeholder="Image URL"
                                      />
                                      <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleEditImageUpload}
                                        className="hidden"
                                        id={`edit-image-upload-${item.id}`}
                                      />
                                      <label htmlFor={`edit-image-upload-${item.id}`}>
                                        <Button type="button" variant="outline" size="icon" disabled={isUploadingEditImage} className="border-slate-600" asChild>
                                          <span>{isUploadingEditImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}</span>
                                        </Button>
                                      </label>
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-slate-300">Video (MP4/WebM)</Label>
                                    <div className="flex gap-2 items-center">
                                      {editingItem.videoUrl && (
                                        <div className="h-16 w-16 rounded-lg border border-slate-600 overflow-hidden flex-shrink-0">
                                          <video src={editingItem.videoUrl} className="h-full w-full object-cover" muted />
                                        </div>
                                      )}
                                      <Input
                                        value={editingItem.videoUrl}
                                        onChange={(e) => setEditingItem(prev => ({...prev, videoUrl: e.target.value}))}
                                        className="bg-slate-900/50 border-slate-600 text-white flex-1 min-w-0"
                                        placeholder="Video URL (optional)"
                                        data-testid="input-edit-menu-video"
                                      />
                                      <input
                                        type="file"
                                        accept="video/mp4,video/webm"
                                        onChange={handleEditVideoUpload}
                                        className="hidden"
                                        id={`edit-video-upload-${item.id}`}
                                      />
                                      <label htmlFor={`edit-video-upload-${item.id}`}>
                                        <Button type="button" variant="outline" size="icon" disabled={isUploadingEditVideo} className="border-slate-600" asChild>
                                          <span>{isUploadingEditVideo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}</span>
                                        </Button>
                                      </label>
                                    </div>
                                  </div>
                                  <div className="md:col-span-2 space-y-2">
                                    <Label className="text-slate-300">Description</Label>
                                    <Input
                                      value={editingItem.description}
                                      onChange={(e) => setEditingItem(prev => ({...prev, description: e.target.value}))}
                                      className="bg-slate-900/50 border-slate-600 text-white"
                                      placeholder="Optional description"
                                      data-testid="input-edit-menu-description"
                                    />
                                  </div>
                                </div>
                                
                                {/* Size Variants Section */}
                                <div className="border-t border-slate-700/50 pt-4 mt-4">
                                  <div className="flex items-center justify-between mb-3">
                                    <Label className="text-slate-300 flex items-center gap-2">
                                      <Layers className="h-4 w-4 text-amber-400" />
                                      Size Options
                                      <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
                                        {editingItemVariants.length} sizes
                                      </Badge>
                                    </Label>
                                  </div>
                                  <p className="text-xs text-slate-500 mb-3">
                                    Add different sizes with different prices (e.g., Regular 8" £6.99, Large 12" £11.99). 
                                    If you add sizes, customers will choose a size instead of seeing the base price.
                                  </p>
                                  
                                  {/* Loading state */}
                                  {loadingVariants && (
                                    <div className="flex items-center gap-2 text-slate-400 text-sm mb-3">
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                      Loading sizes...
                                    </div>
                                  )}
                                  
                                  {/* Existing variants */}
                                  {!loadingVariants && editingItemVariants.length > 0 && (
                                    <div className="space-y-2 mb-3">
                                      {editingItemVariants.map((variant) => (
                                        <div key={variant.id} className={`flex items-center justify-between rounded-lg p-2 ${variant.available === false ? 'bg-red-500/10 border border-red-500/30' : 'bg-slate-900/50'}`}>
                                          <div className="flex items-center gap-2">
                                            <Switch
                                              checked={variant.available !== false}
                                              onCheckedChange={(checked) => toggleVariantAvailabilityMutation.mutate({ variantId: variant.id, available: checked })}
                                              disabled={toggleVariantAvailabilityMutation.isPending}
                                              className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-red-500"
                                              data-testid={`switch-variant-availability-${variant.id}`}
                                            />
                                            <span className={`text-sm ${variant.available === false ? 'text-slate-400 line-through' : 'text-white'}`}>{variant.name}</span>
                                            {variant.available === false && (
                                              <Badge variant="destructive" className="text-[10px] px-1.5 py-0">SOLD OUT</Badge>
                                            )}
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <span className={`text-sm ${variant.available === false ? 'text-slate-500' : 'text-emerald-400'}`}>{currencySymbol}{variant.price}</span>
                                            <Button
                                              size="icon"
                                              variant="ghost"
                                              onClick={() => deleteVariantMutation.mutate(variant.id)}
                                              disabled={deleteVariantMutation.isPending}
                                              className="h-6 w-6 text-red-400 hover:text-red-300"
                                              data-testid={`button-delete-variant-${variant.id}`}
                                            >
                                              <Trash2 className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  
                                  {/* Add new variant */}
                                  {!loadingVariants && (
                                  <div className="flex gap-2 items-end">
                                    <div className="flex-1">
                                      <Input
                                        value={newVariantName}
                                        onChange={(e) => setNewVariantName(e.target.value)}
                                        placeholder="Size name (e.g., Large 12&quot;)"
                                        className="bg-slate-900/50 border-slate-600 text-white text-sm"
                                        data-testid="input-new-variant-name"
                                      />
                                    </div>
                                    <div className="w-24">
                                      <Input
                                        value={newVariantPrice}
                                        onChange={(e) => setNewVariantPrice(e.target.value)}
                                        placeholder="0.00"
                                        className="bg-slate-900/50 border-slate-600 text-white text-sm"
                                        data-testid="input-new-variant-price"
                                      />
                                    </div>
                                    <Button
                                      size="sm"
                                      onClick={() => {
                                        if (!editingItemId || !newVariantName.trim() || !newVariantPrice.trim()) return;
                                        addVariantMutation.mutate({ menuItemId: editingItemId, name: newVariantName, price: newVariantPrice });
                                      }}
                                      disabled={addVariantMutation.isPending || !newVariantName.trim() || !newVariantPrice.trim()}
                                      className="bg-amber-600 hover:bg-amber-700"
                                      data-testid="button-add-variant"
                                    >
                                      {addVariantMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                    </Button>
                                  </div>
                                  )}
                                </div>
                                
                                <div className="flex gap-2 justify-end">
                                  <Button variant="outline" onClick={cancelEditingItem} className="border-slate-600 text-slate-300">
                                    Cancel
                                  </Button>
                                  <Button onClick={handleSaveMenuItem} className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white" data-testid="button-save-menu-item">
                                    <Check className="h-4 w-4 mr-2" /> Save Changes
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div 
                                key={item.id} 
                                className={`flex items-center gap-3 rounded-lg p-3 ${item.available !== false ? 'bg-slate-800/50' : 'bg-red-500/10 border border-red-500/30'}`}
                                data-testid={`menu-item-row-${item.id}`}
                              >
                                {item.image && (
                                  <img src={item.image} alt={item.name} className={`h-12 w-12 rounded-lg object-cover ${item.available === false ? 'opacity-50' : ''}`} />
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className={`font-medium text-white truncate ${item.available === false ? 'line-through text-slate-400' : ''}`}>{item.name}</p>
                                    {item.available === false && (
                                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0">SOLD OUT</Badge>
                                    )}
                                  </div>
                                  {item.description && (
                                    <p className="text-xs text-slate-400 truncate">{item.description}</p>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Switch
                                    checked={item.available !== false}
                                    onCheckedChange={() => handleToggleAvailability(item)}
                                    data-testid={`switch-availability-${item.id}`}
                                  />
                                  <span className="text-emerald-400 font-semibold min-w-[60px] text-right">
                                    {currencySymbol}{item.price}
                                  </span>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => startEditingItem(item)}
                                    className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                                    data-testid={`button-edit-menu-${item.id}`}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => handleDeleteMenuItem(item)}
                                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                    data-testid={`button-delete-menu-${item.id}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            )
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="premium-card border-0">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Plus className="h-5 w-5 text-purple-400" />
                  Extra Toppings
                  <Badge className="ml-2 bg-purple-500/20 text-purple-400 border-purple-500/30">
                    {extraToppings.length} toppings
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-300">Category</Label>
                      <Select value={newToppingCategory} onValueChange={(v) => { setNewToppingCategory(v); setNewToppingMenuItem(""); }}>
                        <SelectTrigger className="bg-slate-900/50 border-slate-600 text-white" data-testid="select-topping-category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categoriesWithItems.map(cat => (
                            <SelectItem key={cat.id} value={cat.id}>{cat.icon} {cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">Menu Item</Label>
                      <Select value={newToppingMenuItem} onValueChange={setNewToppingMenuItem} disabled={!newToppingCategory}>
                        <SelectTrigger className="bg-slate-900/50 border-slate-600 text-white" data-testid="select-topping-menuitem">
                          <SelectValue placeholder={newToppingCategory ? "Select item" : "Select category first"} />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredMenuItemsForTopping.map(item => (
                            <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">Topping Name</Label>
                      <Input
                        value={newToppingName}
                        onChange={(e) => setNewToppingName(e.target.value)}
                        className="bg-slate-900/50 border-slate-600 text-white"
                        placeholder="e.g., Mature cheddar"
                        data-testid="input-topping-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">Price ({currencySymbol})</Label>
                      <div className="flex gap-2">
                        <Input
                          value={newToppingPrice}
                          onChange={(e) => setNewToppingPrice(e.target.value)}
                          className="bg-slate-900/50 border-slate-600 text-white"
                          placeholder="1.00"
                          data-testid="input-topping-price"
                        />
                        <Button
                          onClick={handleAddTopping}
                          className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500"
                          data-testid="button-add-topping"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {extraToppings.length > 0 && (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {extraToppings.map(topping => {
                      const linkedItem = menuItems.find(m => m.id === topping.menuItemId);
                      return (
                        <div key={topping.id} className="flex items-center justify-between bg-slate-800/50 rounded-lg p-3">
                          <div className="flex items-center gap-3">
                            <span className="text-white font-medium">{topping.name}</span>
                            {linkedItem && (
                              <Badge className="bg-slate-700 text-slate-300 text-xs">{linkedItem.name}</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-emerald-400 font-semibold">{currencySymbol}{topping.price}</span>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDeleteTopping(topping)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              data-testid={`button-delete-topping-${topping.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Option Groups (Drinks, Add-ons with selection rules) */}
            <Card className="premium-card border-0">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <Layers className="h-5 w-5 text-cyan-400" />
                  Option Groups
                  <Badge className="ml-2 bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                    {toppingGroups.length} groups
                  </Badge>
                </CardTitle>
                <Button
                  onClick={() => setShowAddOptionGroup(!showAddOptionGroup)}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white"
                  data-testid="button-add-option-group"
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Option Group
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-400">
                  Create option groups like "Choose Your Drink" for deals. Customers must select from these when ordering.
                </p>

                {showAddOptionGroup && (
                  <div className="bg-slate-800/50 rounded-xl p-4 border border-cyan-500/30 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-cyan-400 font-semibold">Create New Option Group</h4>
                      <Button size="icon" variant="ghost" onClick={() => setShowAddOptionGroup(false)} className="text-slate-400 hover:text-white">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {/* Add Categories & Menu Items */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-slate-300">Select Categories</Label>
                        <div className="flex gap-2">
                          <Select value={optionGroupTempCategory} onValueChange={setOptionGroupTempCategory}>
                            <SelectTrigger className="bg-slate-900/50 border-slate-600 text-white flex-1" data-testid="select-optiongroup-category">
                              <SelectValue placeholder="Choose category" />
                            </SelectTrigger>
                            <SelectContent className="max-h-60 overflow-y-auto">
                              {categoriesWithItems.filter(cat => !optionGroupCategories.includes(cat.id)).map(cat => (
                                <SelectItem key={cat.id} value={cat.id}>{cat.icon} {cat.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            type="button"
                            onClick={() => {
                              if (optionGroupTempCategory && !optionGroupCategories.includes(optionGroupTempCategory)) {
                                setOptionGroupCategories(prev => [...prev, optionGroupTempCategory]);
                                setOptionGroupTempCategory("");
                                toast({ title: "Category Added", description: "Category added to selection" });
                              }
                            }}
                            disabled={!optionGroupTempCategory}
                            className="bg-cyan-500 hover:bg-cyan-600 text-white px-4"
                            data-testid="button-add-category"
                          >
                            <Plus className="h-4 w-4 mr-1" /> Add
                          </Button>
                        </div>
                        {optionGroupCategories.length > 0 && (
                          <div className="flex flex-wrap gap-1 p-2 bg-slate-900/50 rounded-lg border border-slate-700">
                            {optionGroupCategories.map(catId => {
                              const cat = categoriesWithItems.find(c => c.id === catId);
                              return cat ? (
                                <Badge key={catId} className="bg-cyan-500/30 text-cyan-300 border-cyan-500/50 gap-1 py-1">
                                  {cat.icon} {cat.name}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOptionGroupCategories(prev => prev.filter(c => c !== catId));
                                      setOptionGroupMenuItems(prev => prev.filter(id => {
                                        const item = menuItems.find(m => m.id === id);
                                        return item && item.category !== catId;
                                      }));
                                    }}
                                    className="ml-1 hover:text-white"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </Badge>
                              ) : null;
                            })}
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-300">Select Menu Items (Deals)</Label>
                        <div className="flex gap-2">
                          <Select 
                            value={optionGroupTempMenuItem} 
                            onValueChange={setOptionGroupTempMenuItem}
                            disabled={optionGroupCategories.length === 0}
                          >
                            <SelectTrigger className="bg-slate-900/50 border-slate-600 text-white flex-1" data-testid="select-optiongroup-menuitem">
                              <SelectValue placeholder={optionGroupCategories.length === 0 ? "Add categories first" : "Choose menu item"} />
                            </SelectTrigger>
                            <SelectContent className="max-h-60 overflow-y-auto">
                              {filteredMenuItemsForOptionGroup.filter(item => !optionGroupMenuItems.includes(item.id)).map(item => (
                                <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            type="button"
                            onClick={() => {
                              if (optionGroupTempMenuItem && !optionGroupMenuItems.includes(optionGroupTempMenuItem)) {
                                setOptionGroupMenuItems(prev => [...prev, optionGroupTempMenuItem]);
                                setOptionGroupTempMenuItem("");
                                toast({ title: "Item Added", description: "Menu item added to selection" });
                              }
                            }}
                            disabled={!optionGroupTempMenuItem}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4"
                            data-testid="button-add-menuitem"
                          >
                            <Plus className="h-4 w-4 mr-1" /> Add
                          </Button>
                        </div>
                        {optionGroupCategories.length > 0 && filteredMenuItemsForOptionGroup.length > 0 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const allItems = filteredMenuItemsForOptionGroup.map(item => item.id);
                              setOptionGroupMenuItems(allItems);
                              toast({ title: "All Items Added", description: `Added ${allItems.length} menu items` });
                            }}
                            className="text-xs border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/20"
                          >
                            <Plus className="h-3 w-3 mr-1" /> Add All ({filteredMenuItemsForOptionGroup.length} items)
                          </Button>
                        )}
                        {optionGroupMenuItems.length > 0 && (
                          <div className="flex flex-wrap gap-1 p-2 bg-slate-900/50 rounded-lg border border-slate-700">
                            {optionGroupMenuItems.map(itemId => {
                              const item = menuItems.find(m => m.id === itemId);
                              return item ? (
                                <Badge key={itemId} className="bg-emerald-500/30 text-emerald-300 border-emerald-500/50 gap-1 py-1">
                                  {item.name}
                                  <button
                                    type="button"
                                    onClick={() => setOptionGroupMenuItems(prev => prev.filter(id => id !== itemId))}
                                    className="ml-1 hover:text-white"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </Badge>
                              ) : null;
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-slate-300">Headline</Label>
                        <Input
                          value={optionGroupHeadline}
                          onChange={(e) => setOptionGroupHeadline(e.target.value)}
                          className="bg-slate-900/50 border-slate-600 text-white"
                          placeholder="Choose Your Drink"
                          data-testid="input-optiongroup-headline"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-300">Selection Rule</Label>
                        <Select value={optionGroupIsRequired ? "required" : "optional"} onValueChange={(v) => setOptionGroupIsRequired(v === "required")}>
                          <SelectTrigger className="bg-slate-900/50 border-slate-600 text-white" data-testid="select-optiongroup-required">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="required">Required</SelectItem>
                            <SelectItem value="optional">Optional</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-300">Max Selections</Label>
                        <Select value={String(optionGroupMaxSelections)} onValueChange={(v) => setOptionGroupMaxSelections(Number(v))} disabled={optionGroupAllowQuantity}>
                          <SelectTrigger className="bg-slate-900/50 border-slate-600 text-white" data-testid="select-optiongroup-max">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 (Single Select)</SelectItem>
                            <SelectItem value="2">2</SelectItem>
                            <SelectItem value="3">3</SelectItem>
                            <SelectItem value="5">5</SelectItem>
                            <SelectItem value="10">10</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div className="space-y-2">
                        <Label className="text-slate-300">Min Required Selections</Label>
                        <Select value={String(optionGroupMinSelections)} onValueChange={(v) => setOptionGroupMinSelections(Number(v))} disabled={optionGroupAllowQuantity}>
                          <SelectTrigger className="bg-slate-900/50 border-slate-600 text-white" data-testid="select-optiongroup-min">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">0 (No minimum)</SelectItem>
                            <SelectItem value="1">1 (Must select 1)</SelectItem>
                            <SelectItem value="2">2 (Must select 2)</SelectItem>
                            <SelectItem value="3">3 (Must select 3)</SelectItem>
                            <SelectItem value="5">5 (Must select 5)</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-slate-500">E.g., "1 drink included" = min 1, max 1</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div className="flex items-center gap-3 bg-slate-900/30 p-3 rounded-lg">
                        <Switch
                          checked={optionGroupAllowQuantity}
                          onCheckedChange={setOptionGroupAllowQuantity}
                          data-testid="switch-optiongroup-quantity"
                        />
                        <div>
                          <Label className="text-slate-300">Quantity Mode (+/-)</Label>
                          <p className="text-xs text-slate-500">Enable +/- buttons for multiple quantities (e.g., "Frequently bought together")</p>
                        </div>
                      </div>
                      {optionGroupAllowQuantity && (
                        <div className="space-y-2">
                          <Label className="text-slate-300">Max Quantity Per Option</Label>
                          <Select value={String(optionGroupMaxQuantity)} onValueChange={(v) => setOptionGroupMaxQuantity(Number(v))}>
                            <SelectTrigger className="bg-slate-900/50 border-slate-600 text-white" data-testid="select-optiongroup-maxqty">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="3">3</SelectItem>
                              <SelectItem value="5">5</SelectItem>
                              <SelectItem value="10">10</SelectItem>
                              <SelectItem value="20">20</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-end mt-4">
                      <Button
                        onClick={handleCreateOptionGroup}
                        disabled={createOptionGroupMutation.isPending || optionGroupMenuItems.length === 0}
                        className="bg-gradient-to-r from-cyan-500 to-blue-600"
                        data-testid="button-create-option-group"
                      >
                        {createOptionGroupMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                        Create Group{optionGroupMenuItems.length > 1 ? `s (${optionGroupMenuItems.length})` : ''}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Display existing option groups */}
                {toppingGroups.length > 0 && (
                  <div className="space-y-4">
                    {toppingGroups.map(group => {
                      const linkedItem = menuItems.find(m => m.id === group.menuItemId);
                      return (
                        <div key={group.id} className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
                          <button
                            type="button"
                            className="flex items-center justify-between w-full p-4 text-left hover:bg-slate-700/30 transition-colors"
                            onClick={() => {
                              const newExpanded = new Set(expandedGroups);
                              if (newExpanded.has(group.id)) {
                                newExpanded.delete(group.id);
                              } else {
                                newExpanded.add(group.id);
                              }
                              setExpandedGroups(newExpanded);
                            }}
                            aria-expanded={expandedGroups.has(group.id)}
                            data-testid={`toggle-group-${group.id}`}
                          >
                            <div className="flex items-center gap-3 flex-wrap">
                              <div className="flex items-center gap-2">
                                {expandedGroups.has(group.id) ? (
                                  <ChevronUp className="h-4 w-4 text-slate-400" />
                                ) : (
                                  <ChevronDown className="h-4 w-4 text-slate-400" />
                                )}
                                <h4 className="text-white font-semibold">{group.headline}</h4>
                                <Badge className="bg-slate-600 text-slate-300 text-xs">{group.options.length} options</Badge>
                              </div>
                              {linkedItem && <Badge className="bg-slate-700 text-slate-300 text-xs">{linkedItem.name}</Badge>}
                              <Badge className={group.isRequired ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-slate-600/20 text-slate-400"}>
                                {group.isRequired ? "Required" : "Optional"}
                              </Badge>
                              {group.maxSelections && group.maxSelections > 1 && (
                                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                                  Max {group.maxSelections}
                                </Badge>
                              )}
                              {group.allowQuantity && (
                                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                                  Qty +/- (max {group.maxQuantityPerOption || 5})
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => { setEditingGroupId(group.id); setExpandedGroups(new Set(Array.from(expandedGroups).concat([group.id]))); }}
                                className="border-slate-600 text-slate-300 hover:text-white h-7"
                                data-testid={`button-add-option-header-${group.id}`}
                              >
                                <Plus className="h-3 w-3 mr-1" /> Add
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => deleteOptionGroupMutation.mutate(group.id)}
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-7 w-7"
                                data-testid={`button-delete-group-${group.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </button>

                          {/* Collapsible Options list */}
                          {expandedGroups.has(group.id) && (
                          <div className="p-4 pt-0 space-y-2 mb-3">
                            {group.options.map(option => (
                              <div key={option.id} className="flex items-center justify-between bg-slate-900/50 rounded-lg p-2">
                                <div className="flex items-center gap-3">
                                  {option.image && <img src={option.image} alt={option.name} className="h-8 w-8 rounded object-cover" />}
                                  <span className={`text-sm ${option.isAvailable !== false ? 'text-white' : 'text-slate-500 line-through'}`}>{option.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-emerald-400 text-sm">
                                    {Number(option.price) === 0 ? "Free" : `+${currencySymbol}${option.price}`}
                                  </span>
                                  <Switch
                                    checked={option.isAvailable !== false}
                                    onCheckedChange={(checked) => toggleOptionAvailability.mutate({ optionId: option.id, optionName: option.name, isAvailable: checked })}
                                    className="scale-75"
                                    data-testid={`switch-option-${option.id}`}
                                  />
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => deleteOptionMutation.mutate(option.id)}
                                    className="h-6 w-6 text-red-400 hover:text-red-300"
                                    data-testid={`button-delete-option-${option.id}`}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                          )}
                          
                          {/* Copy to Similar Groups button - only show when expanded */}
                          {expandedGroups.has(group.id) && (
                          <div className="px-4">
                          {/* Copy to Similar Groups button */}
                          {group.options.length > 0 && toppingGroups.filter(g => g.id !== group.id && g.headline === group.headline).length > 0 && (
                            <div className="mb-3 pb-3 border-b border-slate-700/50">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCopyOptionsToSimilarGroups(group)}
                                disabled={isCopying}
                                className="border-purple-500/50 text-purple-400 hover:bg-purple-500/20 text-xs"
                                data-testid={`button-copy-options-${group.id}`}
                              >
                                {isCopying ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Copy className="h-3 w-3 mr-1" />}
                                Copy Options to All "{group.headline}" Groups ({toppingGroups.filter(g => g.id !== group.id && g.headline === group.headline).length})
                              </Button>
                            </div>
                          )}

                          {/* Add option form */}
                          {editingGroupId === group.id ? (
                            <div className="space-y-4">
                              {/* Quick-add from menu category (branch-specific) */}
                              <div className="space-y-2 pb-3 border-b border-slate-700/50">
                                <span className="text-xs text-slate-400">Add from Menu Category:</span>
                                <div className="flex gap-2">
                                  <Select value={quickAddCategory} onValueChange={(v) => { setQuickAddCategory(v); setQuickAddMenuItem(""); }}>
                                    <SelectTrigger className="bg-slate-900/50 border-slate-600 text-white text-sm flex-1" data-testid="select-quickadd-category">
                                      <SelectValue placeholder="Select Category" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-60 overflow-y-auto">
                                      {categoriesWithItems.map(cat => (
                                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  {quickAddCategory && (
                                    <Select value={quickAddMenuItem} onValueChange={setQuickAddMenuItem}>
                                      <SelectTrigger className="bg-slate-900/50 border-slate-600 text-white text-sm flex-1" data-testid="select-quickadd-menuitem">
                                        <SelectValue placeholder="Select Item" />
                                      </SelectTrigger>
                                      <SelectContent className="max-h-60 overflow-y-auto">
                                        {filteredMenuItemsForQuickAdd.map(item => (
                                          <SelectItem key={item.id} value={item.id}>
                                            {item.name} - {currencySymbol}{Number(item.price).toFixed(2)}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  )}
                                  {quickAddMenuItem && (
                                    <Button
                                      size="sm"
                                      onClick={() => {
                                        const item = menuItems.find(m => m.id === quickAddMenuItem);
                                        if (item) handleQuickAddFromMenu(group.id, item);
                                      }}
                                      disabled={addOptionMutation.isPending}
                                      className="bg-purple-600 hover:bg-purple-700"
                                      data-testid="button-quickadd-item"
                                    >
                                      {addOptionMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                    </Button>
                                  )}
                                </div>
                              </div>
                              
                              {/* Manual add option */}
                              <div className="space-y-2">
                                <span className="text-xs text-slate-400">Or Add Manually:</span>
                                <div className="flex gap-2 items-end">
                                  <div className="flex-1">
                                    <Input
                                      value={newOptionName}
                                      onChange={(e) => setNewOptionName(e.target.value)}
                                      placeholder="Option name (e.g., Mountain Dew)"
                                      className="bg-slate-900/50 border-slate-600 text-white text-sm"
                                      data-testid="input-new-option-name"
                                    />
                                  </div>
                                  <div className="w-24">
                                    <Input
                                      value={newOptionPrice}
                                      onChange={(e) => setNewOptionPrice(e.target.value)}
                                      placeholder="0.00"
                                      className="bg-slate-900/50 border-slate-600 text-white text-sm"
                                      data-testid="input-new-option-price"
                                    />
                                  </div>
                                  <Button
                                    size="sm"
                                    onClick={() => handleAddOption(group.id)}
                                    disabled={addOptionMutation.isPending}
                                    className="bg-emerald-600 hover:bg-emerald-700"
                                    data-testid="button-save-option"
                                  >
                                    {addOptionMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                  </Button>
                                </div>
                              </div>
                              
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => { setEditingGroupId(null); setNewOptionName(""); setNewOptionPrice("0.00"); setQuickAddCategory(""); setQuickAddMenuItem(""); }}
                                className="text-slate-400 w-full"
                              >
                                <X className="h-4 w-4 mr-1" /> Close
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingGroupId(group.id)}
                              className="border-slate-600 text-slate-300 hover:text-white"
                              data-testid={`button-add-option-to-${group.id}`}
                            >
                              <Plus className="h-3 w-3 mr-1" /> Add Option
                            </Button>
                          )}
                          </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="branding" className="mt-6 space-y-6">
            {/* Logo & Highlight Image */}
            <Card className="premium-card border-0">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Image className="h-5 w-5 text-purple-400" />
                  Restaurant Logo & Highlight
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-slate-300">Logo</Label>
                    <p className="text-xs text-slate-500">Your logo appears in the header and footer of your restaurant page.</p>
                    {logoUrl && <img src={logoUrl} alt="Logo" className="h-20 w-20 rounded-xl object-cover border border-slate-600" />}
                    <div className="flex gap-2">
                      <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" id="logo-upload" />
                      <label htmlFor="logo-upload">
                        <Button type="button" variant="outline" className="border-slate-600" disabled={isUploadingLogo} asChild>
                          <span>{isUploadingLogo ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />} Upload Logo</span>
                        </Button>
                      </label>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-slate-300">Highlight Image</Label>
                    <p className="text-xs text-slate-500">This image appears in the "Welcome" section of your restaurant page.</p>
                    {welcomeImageUrl && <img src={welcomeImageUrl} alt="Highlight" className="h-20 w-32 rounded-xl object-cover border border-slate-600" />}
                    <div className="flex gap-2">
                      <input type="file" accept="image/*" onChange={handleWelcomeImageUpload} className="hidden" id="welcome-upload" />
                      <label htmlFor="welcome-upload">
                        <Button type="button" variant="outline" className="border-slate-600" disabled={isUploadingWelcome} asChild>
                          <span>{isUploadingWelcome ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />} Upload Highlight</span>
                        </Button>
                      </label>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleSaveBranding} disabled={saving} className="bg-gradient-to-r from-purple-500 to-pink-600 text-white">
                    {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />} Save Branding
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Hero Gallery */}
            <Card className="premium-card border-0">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Layers className="h-5 w-5 text-amber-400" />
                  Hero Gallery
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-400 text-sm">Configure the sliding carousel on your landing page.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Transition Effect</Label>
                    <Select value={heroAnimationStyle} onValueChange={setHeroAnimationStyle}>
                      <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="slide">Slide - Smooth horizontal sliding</SelectItem>
                        <SelectItem value="fade">Fade - Gentle fade transition</SelectItem>
                        <SelectItem value="scrapbook">Scrapbook - Playful rotate & tilt</SelectItem>
                        <SelectItem value="stomp">Stomp - Bouncy scale effect</SelectItem>
                        <SelectItem value="flicker">Flicker - Dynamic flashing</SelectItem>
                        <SelectItem value="pulse">Pulse - Breathing scale</SelectItem>
                        <SelectItem value="tectonic">Tectonic - Shaking motion</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Slide Interval (seconds)</Label>
                    <Input type="number" min={2} max={15} value={heroSlideInterval} onChange={(e) => setHeroSlideInterval(Number(e.target.value))} className="bg-slate-800/50 border-slate-600 text-white" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Slider Background Gradient</Label>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-400">Start</Label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={heroGradientStart} onChange={(e) => setHeroGradientStart(e.target.value)} className="w-10 h-10 rounded cursor-pointer" />
                        <Input value={heroGradientStart} onChange={(e) => setHeroGradientStart(e.target.value)} className="bg-slate-800/50 border-slate-600 text-white text-xs" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-400">Middle</Label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={heroGradientMiddle} onChange={(e) => setHeroGradientMiddle(e.target.value)} className="w-10 h-10 rounded cursor-pointer" />
                        <Input value={heroGradientMiddle} onChange={(e) => setHeroGradientMiddle(e.target.value)} className="bg-slate-800/50 border-slate-600 text-white text-xs" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-400">End</Label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={heroGradientEnd} onChange={(e) => setHeroGradientEnd(e.target.value)} className="w-10 h-10 rounded cursor-pointer" />
                        <Input value={heroGradientEnd} onChange={(e) => setHeroGradientEnd(e.target.value)} className="bg-slate-800/50 border-slate-600 text-white text-xs" />
                      </div>
                    </div>
                  </div>
                  <div className="h-4 rounded-lg mt-2" style={{ background: `linear-gradient(90deg, ${heroGradientStart}, ${heroGradientMiddle}, ${heroGradientEnd})` }} />
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleSaveHeroGallery} disabled={saving} className="bg-gradient-to-r from-amber-500 to-orange-600 text-white">
                    {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />} Save Gallery Settings
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Welcome Page Background */}
            <Card className="premium-card border-0">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Video className="h-5 w-5 text-purple-400" />
                  Welcome Page Background
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-400 text-sm">Customize the background of your welcome/landing page with images, GIFs, videos, or image sliders.</p>
                
                <div className="space-y-3">
                  <Label className="text-slate-300">Background Type</Label>
                  <Select value={welcomeBackgroundType} onValueChange={setWelcomeBackgroundType}>
                    <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gradient">Gradient (Default)</SelectItem>
                      <SelectItem value="image">Static Image</SelectItem>
                      <SelectItem value="gif">Animated GIF</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="slider">Image Slider</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {welcomeBackgroundType === "image" && (
                  <div className="space-y-3">
                    <Label className="text-slate-300">Background Image</Label>
                    <div className="flex items-center gap-4">
                      {welcomeBackgroundImageUrl ? (
                        <div className="relative">
                          <img src={welcomeBackgroundImageUrl} alt="Background" className="w-32 h-20 object-cover rounded-lg border border-slate-600" />
                          <Button variant="ghost" size="icon" className="absolute -top-2 -right-2 h-6 w-6 bg-red-500/80 hover:bg-red-500 rounded-full" onClick={() => setWelcomeBackgroundImageUrl("")}>
                            <X className="h-3 w-3 text-white" />
                          </Button>
                        </div>
                      ) : (
                        <div className="w-32 h-20 bg-slate-700/50 rounded-lg border border-dashed border-slate-500 flex items-center justify-center text-slate-400 text-xs">
                          No image
                        </div>
                      )}
                      <div>
                        <input type="file" accept="image/*" onChange={(e) => handleWelcomeBackgroundUpload(e, 'image')} className="hidden" id="bg-image-upload" />
                        <label htmlFor="bg-image-upload">
                          <Button asChild variant="outline" className="border-purple-500/50 text-purple-300 hover:bg-purple-500/10">
                            <span>{isUploadingWelcomeBg ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />} Upload Image</span>
                          </Button>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {welcomeBackgroundType === "gif" && (
                  <div className="space-y-3">
                    <Label className="text-slate-300">Animated GIF</Label>
                    <div className="flex items-center gap-4">
                      {welcomeBackgroundGifUrl ? (
                        <div className="relative">
                          <img src={welcomeBackgroundGifUrl} alt="GIF Background" className="w-32 h-20 object-cover rounded-lg border border-slate-600" />
                          <Button variant="ghost" size="icon" className="absolute -top-2 -right-2 h-6 w-6 bg-red-500/80 hover:bg-red-500 rounded-full" onClick={() => setWelcomeBackgroundGifUrl("")}>
                            <X className="h-3 w-3 text-white" />
                          </Button>
                        </div>
                      ) : (
                        <div className="w-32 h-20 bg-slate-700/50 rounded-lg border border-dashed border-slate-500 flex items-center justify-center text-slate-400 text-xs">
                          No GIF
                        </div>
                      )}
                      <div>
                        <input type="file" accept="image/gif" onChange={(e) => handleWelcomeBackgroundUpload(e, 'gif')} className="hidden" id="bg-gif-upload" />
                        <label htmlFor="bg-gif-upload">
                          <Button asChild variant="outline" className="border-purple-500/50 text-purple-300 hover:bg-purple-500/10">
                            <span>{isUploadingWelcomeBg ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />} Upload GIF</span>
                          </Button>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {welcomeBackgroundType === "video" && (
                  <div className="space-y-3">
                    <Label className="text-slate-300">Background Video</Label>
                    <div className="flex items-center gap-4">
                      {welcomeBackgroundVideoUrl ? (
                        <div className="relative">
                          <video src={welcomeBackgroundVideoUrl} className="w-32 h-20 object-cover rounded-lg border border-slate-600" muted loop autoPlay />
                          <Button variant="ghost" size="icon" className="absolute -top-2 -right-2 h-6 w-6 bg-red-500/80 hover:bg-red-500 rounded-full" onClick={() => setWelcomeBackgroundVideoUrl("")}>
                            <X className="h-3 w-3 text-white" />
                          </Button>
                        </div>
                      ) : (
                        <div className="w-32 h-20 bg-slate-700/50 rounded-lg border border-dashed border-slate-500 flex items-center justify-center text-slate-400 text-xs">
                          No video
                        </div>
                      )}
                      <div>
                        <input type="file" accept="video/*" onChange={(e) => handleWelcomeBackgroundUpload(e, 'video')} className="hidden" id="bg-video-upload" />
                        <label htmlFor="bg-video-upload">
                          <Button asChild variant="outline" className="border-purple-500/50 text-purple-300 hover:bg-purple-500/10">
                            <span>{isUploadingWelcomeBg ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />} Upload Video</span>
                          </Button>
                        </label>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500">Recommended: MP4 format, under 10MB for best performance</p>
                  </div>
                )}

                {welcomeBackgroundType === "slider" && (
                  <div className="space-y-3">
                    <Label className="text-slate-300">Slider Images</Label>
                    <div className="grid grid-cols-4 gap-3">
                      {welcomeSliderImages.map((url, index) => (
                        <div key={index} className="relative group">
                          <img src={url} alt={`Slide ${index + 1}`} className="w-full h-20 object-cover rounded-lg border border-slate-600" />
                          <Button variant="ghost" size="icon" className="absolute -top-2 -right-2 h-6 w-6 bg-red-500/80 hover:bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeSliderImage(index)}>
                            <X className="h-3 w-3 text-white" />
                          </Button>
                          <span className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-1 rounded">{index + 1}</span>
                        </div>
                      ))}
                      <div className="w-full h-20 bg-slate-700/50 rounded-lg border border-dashed border-slate-500 flex items-center justify-center">
                        <input type="file" accept="image/*" onChange={handleSliderImageUpload} className="hidden" id="slider-image-upload" />
                        <label htmlFor="slider-image-upload" className="cursor-pointer text-center">
                          {isUploadingSliderImage ? <Loader2 className="h-5 w-5 animate-spin text-purple-400 mx-auto" /> : (
                            <>
                              <Plus className="h-5 w-5 text-purple-400 mx-auto" />
                              <span className="text-xs text-slate-400">Add</span>
                            </>
                          )}
                        </label>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500">Add multiple images to create an auto-sliding background</p>
                  </div>
                )}

                {welcomeBackgroundType === "gradient" && (
                  <div className="stat-card-3d rounded-xl p-4">
                    <p className="text-slate-400 text-sm">Using the default gradient background. Configure colors in Theme Colors section above.</p>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button onClick={handleSaveWelcomeBackground} disabled={saving} className="bg-gradient-to-r from-purple-500 to-violet-600 text-white">
                    {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />} Save Background Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="operations" className="mt-6 space-y-6">
            {/* Operating Hours */}
            <Card className="premium-card border-0">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Clock className="h-5 w-5 text-emerald-400" />
                  Delivery & Collection Hours
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-400 text-sm">Set your delivery and collection hours for each day of the week.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-emerald-400 font-semibold">Delivery Hours</Label>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300 text-sm">Mon - Thu</span>
                        <Input value={deliveryHoursMonThu} onChange={(e) => setDeliveryHoursMonThu(e.target.value)} className="w-40 bg-slate-800/50 border-slate-600 text-white text-sm" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300 text-sm">Fri - Sat</span>
                        <Input value={deliveryHoursFriSat} onChange={(e) => setDeliveryHoursFriSat(e.target.value)} className="w-40 bg-slate-800/50 border-slate-600 text-white text-sm" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300 text-sm">Sunday</span>
                        <Input value={deliveryHoursSun} onChange={(e) => setDeliveryHoursSun(e.target.value)} className="w-40 bg-slate-800/50 border-slate-600 text-white text-sm" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-blue-400 font-semibold">Collection Hours</Label>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300 text-sm">Mon - Thu</span>
                        <Input value={collectionHoursMonThu} onChange={(e) => setCollectionHoursMonThu(e.target.value)} className="w-40 bg-slate-800/50 border-slate-600 text-white text-sm" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300 text-sm">Fri - Sat</span>
                        <Input value={collectionHoursFriSat} onChange={(e) => setCollectionHoursFriSat(e.target.value)} className="w-40 bg-slate-800/50 border-slate-600 text-white text-sm" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300 text-sm">Sunday</span>
                        <Input value={collectionHoursSun} onChange={(e) => setCollectionHoursSun(e.target.value)} className="w-40 bg-slate-800/50 border-slate-600 text-white text-sm" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleSaveHours} disabled={saving} className="bg-gradient-to-r from-emerald-500 to-green-600 text-white">
                    {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />} Save Operating Hours
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Collection Discount */}
            <Card className="premium-card border-0">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Percent className="h-5 w-5 text-yellow-400" />
                  Collection Discount
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-400 text-sm">Set a discount percentage for collection orders over a minimum amount.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Discount Percent (%)</Label>
                    <Input type="number" min={0} max={50} value={collectionDiscountPercent} onChange={(e) => setCollectionDiscountPercent(Number(e.target.value))} className="bg-slate-800/50 border-slate-600 text-white" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Minimum Order ({currencySymbol})</Label>
                    <Input type="text" value={collectionDiscountMinimum} onChange={(e) => setCollectionDiscountMinimum(e.target.value)} className="bg-slate-800/50 border-slate-600 text-white" />
                  </div>
                </div>
                <div className="stat-card-3d rounded-xl p-3 text-center">
                  <span className="text-amber-400">✨ {collectionDiscountPercent}% discount over {currencySymbol}{collectionDiscountMinimum} on collection</span>
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleSaveDiscount} disabled={saving} className="bg-gradient-to-r from-yellow-500 to-amber-600 text-white">
                    {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />} Save Discount Settings
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Order Time Settings */}
            <Card className="premium-card border-0">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Truck className="h-5 w-5 text-cyan-400" />
                  Order Time Estimates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Busy Mode Toggle */}
                <div className="stat-card-3d rounded-xl p-4 border-2 border-orange-500/30">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <Label className="text-white font-bold flex items-center gap-2">
                        <span className="text-orange-400">🔥</span> Busy Mode
                      </Label>
                      <p className="text-slate-400 text-xs">Add extra time during peak hours</p>
                    </div>
                    <Switch
                      checked={busyModeEnabled}
                      onCheckedChange={(checked) => {
                        setBusyModeEnabled(checked);
                        updateRestaurantMutation.mutate({ busyModeEnabled: checked });
                      }}
                      data-testid="switch-busy-mode"
                    />
                  </div>
                  {busyModeEnabled && (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-300 text-sm">Add</span>
                      <Input
                        type="number"
                        min={5}
                        max={60}
                        value={busyModeExtraMinutes}
                        onChange={(e) => setBusyModeExtraMinutes(Number(e.target.value))}
                        className="w-20 bg-slate-800/50 border-slate-600 text-white"
                      />
                      <span className="text-slate-300 text-sm">extra minutes to all orders</span>
                    </div>
                  )}
                </div>

                {/* Delivery Time */}
                <div>
                  <Label className="text-white font-medium mb-2 block">Delivery Time</Label>
                  <p className="text-slate-400 text-xs mb-3">Estimated time for delivery orders</p>
                  <div className="flex flex-wrap gap-2">
                    {[15, 30, 45, 60, 90].map((mins) => (
                      <Button
                        key={mins}
                        variant={deliveryTimeMinutes === mins ? "default" : "outline"}
                        onClick={() => setDeliveryTimeMinutes(mins)}
                        className={deliveryTimeMinutes === mins ? "bg-cyan-500 text-white" : "border-slate-600 text-slate-300"}
                      >
                        {mins}m
                      </Button>
                    ))}
                    <Input
                      type="number"
                      min={5}
                      max={180}
                      value={deliveryTimeMinutes}
                      onChange={(e) => setDeliveryTimeMinutes(Number(e.target.value))}
                      className="w-20 bg-slate-800/50 border-slate-600 text-white"
                      placeholder="Custom"
                    />
                  </div>
                </div>

                {/* Collection Time */}
                <div>
                  <Label className="text-white font-medium mb-2 block">Collection Time</Label>
                  <p className="text-slate-400 text-xs mb-3">Estimated time for pickup orders</p>
                  <div className="flex flex-wrap gap-2">
                    {[10, 15, 20, 30, 45].map((mins) => (
                      <Button
                        key={mins}
                        variant={collectionTimeMinutes === mins ? "default" : "outline"}
                        onClick={() => setCollectionTimeMinutes(mins)}
                        className={collectionTimeMinutes === mins ? "bg-emerald-500 text-white" : "border-slate-600 text-slate-300"}
                      >
                        {mins}m
                      </Button>
                    ))}
                    <Input
                      type="number"
                      min={5}
                      max={120}
                      value={collectionTimeMinutes}
                      onChange={(e) => setCollectionTimeMinutes(Number(e.target.value))}
                      className="w-20 bg-slate-800/50 border-slate-600 text-white"
                      placeholder="Custom"
                    />
                  </div>
                </div>

                {/* Preview */}
                <div className="stat-card-3d rounded-xl p-4 space-y-2">
                  <p className="text-cyan-400 text-sm">
                    🚚 Delivery: {deliveryTimeMinutes + (busyModeEnabled ? busyModeExtraMinutes : 0)} minutes
                    {busyModeEnabled && <span className="text-orange-400 ml-2">(+{busyModeExtraMinutes} busy)</span>}
                  </p>
                  <p className="text-emerald-400 text-sm">
                    🏪 Collection: {collectionTimeMinutes + (busyModeEnabled ? busyModeExtraMinutes : 0)} minutes
                    {busyModeEnabled && <span className="text-orange-400 ml-2">(+{busyModeExtraMinutes} busy)</span>}
                  </p>
                </div>
                
                <div className="flex justify-end">
                  <Button onClick={handleSaveDeliveryTime} disabled={saving} className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white">
                    {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />} Save Time Settings
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Fees & Taxes */}
            <Card className="premium-card border-0">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-emerald-400" />
                  Fees, Taxes & Options
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-slate-400 text-sm">Configure VAT, service fees, delivery charges, and customer options shown on the checkout.</p>
                
                {/* VAT Settings */}
                <div className="stat-card-3d rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white font-medium">VAT / Tax</Label>
                      <p className="text-slate-400 text-xs">Add VAT percentage to orders</p>
                    </div>
                    <Switch
                      checked={vatEnabled}
                      onCheckedChange={(checked) => {
                        setVatEnabled(checked);
                        updateRestaurantMutation.mutate({ vatEnabled: checked });
                      }}
                      data-testid="switch-vat-enabled"
                    />
                  </div>
                  {vatEnabled && (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={0}
                        max={30}
                        step={0.5}
                        value={vatPercent}
                        onChange={(e) => setVatPercent(e.target.value)}
                        className="w-24 bg-slate-800/50 border-slate-600 text-white"
                        data-testid="input-vat-percent"
                      />
                      <span className="text-slate-300">%</span>
                    </div>
                  )}
                </div>

                {/* Service Fee Settings */}
                <div className="stat-card-3d rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white font-medium">Service Fee</Label>
                      <p className="text-slate-400 text-xs">Add service fee percentage to orders</p>
                    </div>
                    <Switch
                      checked={serviceFeeEnabled}
                      onCheckedChange={(checked) => {
                        setServiceFeeEnabled(checked);
                        updateRestaurantMutation.mutate({ serviceFeeEnabled: checked });
                      }}
                      data-testid="switch-service-fee-enabled"
                    />
                  </div>
                  {serviceFeeEnabled && (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={0}
                        max={20}
                        step={0.5}
                        value={serviceFeePercent}
                        onChange={(e) => setServiceFeePercent(e.target.value)}
                        className="w-24 bg-slate-800/50 border-slate-600 text-white"
                        data-testid="input-service-fee-percent"
                      />
                      <span className="text-slate-300">%</span>
                    </div>
                  )}
                </div>

                {/* Delivery Fee Settings */}
                <div className="bg-slate-800/50 border border-slate-600 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white font-medium">Delivery Fee</Label>
                      <p className="text-slate-400 text-xs">Charge a fee for delivery orders</p>
                    </div>
                    <Switch
                      checked={deliveryFeeEnabled}
                      onCheckedChange={(checked) => {
                        setDeliveryFeeEnabled(checked);
                        updateRestaurantMutation.mutate({ deliveryFeeEnabled: checked });
                      }}
                      data-testid="switch-delivery-fee-enabled"
                    />
                  </div>
                  {deliveryFeeEnabled && (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-300">{currencySymbol}</span>
                      <Input
                        type="number"
                        min={0}
                        step={0.5}
                        value={deliveryFee}
                        onChange={(e) => setDeliveryFee(e.target.value)}
                        className="w-24 bg-slate-800/50 border-slate-600 text-white"
                        data-testid="input-delivery-fee"
                      />
                    </div>
                  )}
                </div>

                {/* Free Delivery Over */}
                {deliveryFeeEnabled && (
                  <div className="bg-slate-800/50 border border-slate-600 rounded-xl p-4 space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <Label className="text-white font-medium">Free Delivery Over</Label>
                        <p className="text-slate-400 text-xs">Waive delivery fee for orders above this amount</p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        data-testid="switch-free-delivery-enabled"
                        className={freeDeliveryEnabled 
                          ? "bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-6" 
                          : "bg-slate-600 hover:bg-slate-500 text-white font-bold px-6"}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const newVal = !freeDeliveryEnabled;
                          setFreeDeliveryEnabled(newVal);
                          updateRestaurantMutation.mutate({ freeDeliveryEnabled: newVal });
                        }}
                      >
                        {freeDeliveryEnabled ? "ON" : "OFF"}
                      </Button>
                    </div>
                    {freeDeliveryEnabled && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-300 text-lg font-medium">{currencySymbol}</span>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={freeDeliveryMinimum === "0" || freeDeliveryMinimum === "0.00" ? "" : freeDeliveryMinimum}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9.]/g, '');
                              setFreeDeliveryMinimum(val || "0");
                            }}
                            onBlur={() => {
                              updateRestaurantMutation.mutate({ freeDeliveryMinimum: freeDeliveryMinimum || "0" });
                            }}
                            className="w-28 h-10 px-3 rounded-md bg-slate-800 border border-slate-500 text-white text-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
                            placeholder="e.g. 40"
                            data-testid="input-free-delivery-minimum"
                          />
                          <span className="text-slate-400 text-xs">minimum order for free delivery</span>
                        </div>
                        {Number(freeDeliveryMinimum) > 0 && (
                          <p className="text-emerald-400 text-xs">Orders over {currencySymbol}{Number(freeDeliveryMinimum).toFixed(2)} get free delivery</p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Cutlery Option */}
                <div className="bg-slate-800/50 border border-slate-600 rounded-xl p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white font-medium">Cutlery Option</Label>
                      <p className="text-slate-400 text-xs">Show cutlery option to customers at checkout with price</p>
                    </div>
                    <Switch
                      checked={cutleryOptionEnabled}
                      onCheckedChange={(checked) => {
                        setCutleryOptionEnabled(checked);
                        updateRestaurantMutation.mutate({ cutleryOptionEnabled: checked });
                      }}
                      data-testid="switch-cutlery-option"
                    />
                  </div>
                  {cutleryOptionEnabled && (
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-600">
                      <div>
                        <Label className="text-slate-300 text-xs">Cutlery Name</Label>
                        <Input
                          type="text"
                          value={cutleryName}
                          onChange={(e) => setCutleryName(e.target.value)}
                          placeholder="e.g. Cutlery Set"
                          className="mt-1 bg-slate-800/50 border-slate-600 text-white"
                          data-testid="input-cutlery-name"
                        />
                      </div>
                      <div>
                        <Label className="text-slate-300 text-xs">Price ({currencySymbol})</Label>
                        <Input
                          type="number"
                          min={0}
                          step={0.10}
                          value={cutleryPrice}
                          onChange={(e) => setCutleryPrice(e.target.value)}
                          className="mt-1 bg-slate-800/50 border-slate-600 text-white"
                          data-testid="input-cutlery-price"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Preview */}
                <div className="stat-card-3d rounded-xl p-4 space-y-2">
                  <p className="text-slate-400 text-xs mb-3">Customer sees on checkout:</p>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between text-slate-300">
                      <span>Subtotal</span>
                      <span>{currencySymbol}100.00</span>
                    </div>
                    {deliveryFeeEnabled && (
                      <div className="flex justify-between text-slate-300">
                        <span>Standard Delivery</span>
                        <span className={freeDeliveryEnabled ? "text-emerald-400" : ""}>
                          {freeDeliveryEnabled ? "Free" : `${currencySymbol}${Number(deliveryFee).toFixed(2)}`}
                        </span>
                      </div>
                    )}
                    {serviceFeeEnabled && (
                      <div className="flex justify-between text-slate-300">
                        <span>Service Fee</span>
                        <span>{currencySymbol}{(100 * Number(serviceFeePercent) / 100).toFixed(2)}</span>
                      </div>
                    )}
                    {vatEnabled && (
                      <div className="flex justify-between text-slate-300">
                        <span>VAT ({vatPercent}%)</span>
                        <span>{currencySymbol}{(100 * Number(vatPercent) / 100).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="border-t border-slate-600 pt-2 mt-2 flex justify-between text-white font-bold">
                      <span>Total</span>
                      <span className="text-emerald-400">
                        {currencySymbol}{(100 + 
                          (serviceFeeEnabled ? 100 * Number(serviceFeePercent) / 100 : 0) + 
                          (vatEnabled ? 100 * Number(vatPercent) / 100 : 0) +
                          (deliveryFeeEnabled && !freeDeliveryEnabled ? Number(deliveryFee) : 0)
                        ).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveFees} disabled={saving} className="bg-gradient-to-r from-emerald-500 to-green-600 text-white">
                    {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />} Save Fees & Options
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="links" className="mt-6">
            <Card className="premium-card border-0">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Globe className="h-5 w-5 text-cyan-400" />
                  Public Links
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-400 text-sm">Share these links with your customers or add them to Google Business.</p>
                
                <div className="space-y-4">
                  <div className="stat-card-3d rounded-xl p-4">
                    <Label className="text-slate-300 text-sm mb-2 block">Menu Page</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        readOnly
                        value={`${window.location.origin}/menu/${restaurant.slug}`}
                        className="bg-slate-800/50 border-slate-600 text-white text-sm"
                      />
                      <Button
                        size="icon"
                        variant="secondary"
                        onClick={() => copyToClipboard(`${window.location.origin}/menu/${restaurant.slug}`)}
                        className="shrink-0"
                        data-testid="button-copy-menu-link"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="stat-card-3d rounded-xl p-4">
                    <Label className="text-slate-300 text-sm mb-2 block">Short Link</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        readOnly
                        value={`${window.location.origin}/r/${restaurant.slug}`}
                        className="bg-slate-800/50 border-slate-600 text-white text-sm"
                      />
                      <Button
                        size="icon"
                        variant="secondary"
                        onClick={() => copyToClipboard(`${window.location.origin}/r/${restaurant.slug}`)}
                        className="shrink-0"
                        data-testid="button-copy-short-link"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="stat-card-3d rounded-xl p-4">
                    <Label className="text-slate-300 text-sm mb-2 block">Booking Page</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        readOnly
                        value={`${window.location.origin}/menu/${restaurant.slug}?tab=booking`}
                        className="bg-slate-800/50 border-slate-600 text-white text-sm"
                      />
                      <Button
                        size="icon"
                        variant="secondary"
                        onClick={() => copyToClipboard(`${window.location.origin}/menu/${restaurant.slug}?tab=booking`)}
                        className="shrink-0"
                        data-testid="button-copy-booking-link"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Link href={`/menu/${restaurant.slug}`} className="flex-1">
                    <Button variant="secondary" className="w-full gap-2 stat-card-3d bg-gradient-to-r from-blue-500/10 to-indigo-500/5 border border-blue-500/30 hover:border-blue-500/50 text-blue-400" data-testid="button-view-menu">
                      <Globe className="h-4 w-4" /> View Menu
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="access" className="mt-6 space-y-6">
            <Card className="premium-card border-0">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Key className="h-5 w-5 text-rose-400" />
                  Staff Login Passwords
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-400 text-sm">Set unique names and passwords for each role. Staff will select this branch and enter the password to access their system.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="stat-card-3d rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <ChefHat className="h-5 w-5 text-orange-400" />
                      <Label className="text-orange-400 font-semibold">Kitchen Display</Label>
                    </div>
                    <Input
                      type="text"
                      placeholder="Staff name (e.g. Head Chef Ali)"
                      value={kitchenStaffName}
                      onChange={(e) => setKitchenStaffName(e.target.value)}
                      className="bg-slate-800/50 border-slate-600 text-white"
                      data-testid="input-kitchen-name"
                    />
                    <Input
                      type="password"
                      placeholder="Kitchen password"
                      value={kitchenLoginPassword}
                      onChange={(e) => setKitchenLoginPassword(e.target.value)}
                      className="bg-slate-800/50 border-slate-600 text-white"
                      data-testid="input-kitchen-password"
                    />
                  </div>

                  <div className="stat-card-3d rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-emerald-400" />
                      <Label className="text-emerald-400 font-semibold">EPOS System</Label>
                    </div>
                    <Input
                      type="text"
                      placeholder="Staff name (e.g. Cashier Ahmed)"
                      value={eposStaffName}
                      onChange={(e) => setEposStaffName(e.target.value)}
                      className="bg-slate-800/50 border-slate-600 text-white"
                      data-testid="input-epos-name"
                    />
                    <Input
                      type="password"
                      placeholder="EPOS password"
                      value={eposLoginPassword}
                      onChange={(e) => setEposLoginPassword(e.target.value)}
                      className="bg-slate-800/50 border-slate-600 text-white"
                      data-testid="input-epos-password"
                    />
                  </div>

                  <div className="stat-card-3d rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <ConciergeBell className="h-5 w-5 text-blue-400" />
                      <Label className="text-blue-400 font-semibold">Waiter Service</Label>
                    </div>
                    <Input
                      type="text"
                      placeholder="Staff name (e.g. Waiter Hassan)"
                      value={waiterStaffName}
                      onChange={(e) => setWaiterStaffName(e.target.value)}
                      className="bg-slate-800/50 border-slate-600 text-white"
                      data-testid="input-waiter-name"
                    />
                    <Input
                      type="password"
                      placeholder="Waiter password"
                      value={waiterLoginPassword}
                      onChange={(e) => setWaiterLoginPassword(e.target.value)}
                      className="bg-slate-800/50 border-slate-600 text-white"
                      data-testid="input-waiter-password"
                    />
                  </div>

                  <div className="stat-card-3d rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-purple-400" />
                      <Label className="text-purple-400 font-semibold">Supplier Orders</Label>
                    </div>
                    <Input
                      type="text"
                      placeholder="Staff name (e.g. Manager Usman)"
                      value={suppliersStaffName}
                      onChange={(e) => setSuppliersStaffName(e.target.value)}
                      className="bg-slate-800/50 border-slate-600 text-white"
                      data-testid="input-suppliers-name"
                    />
                    <Input
                      type="password"
                      placeholder="Suppliers password"
                      value={suppliersLoginPassword}
                      onChange={(e) => setSuppliersLoginPassword(e.target.value)}
                      className="bg-slate-800/50 border-slate-600 text-white"
                      data-testid="input-suppliers-password"
                    />
                  </div>

                  <div className="stat-card-3d rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-5 w-5 text-green-400" />
                      <Label className="text-green-400 font-semibold">Finances Dashboard</Label>
                    </div>
                    <Input
                      type="text"
                      placeholder="Staff name (e.g. Accountant Sara)"
                      value={financesStaffName}
                      onChange={(e) => setFinancesStaffName(e.target.value)}
                      className="bg-slate-800/50 border-slate-600 text-white"
                      data-testid="input-finances-name"
                    />
                    <Input
                      type="password"
                      placeholder="Finances password"
                      value={financesLoginPassword}
                      onChange={(e) => setFinancesLoginPassword(e.target.value)}
                      className="bg-slate-800/50 border-slate-600 text-white"
                      data-testid="input-finances-password"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    onClick={async () => {
                      setSaving(true);
                      try {
                        await fetch(`/api/restaurants/${restaurant.id}`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            kitchenLoginPassword: kitchenLoginPassword || null,
                            kitchenStaffName: kitchenStaffName || null,
                            eposLoginPassword: eposLoginPassword || null,
                            eposStaffName: eposStaffName || null,
                            waiterLoginPassword: waiterLoginPassword || null,
                            waiterStaffName: waiterStaffName || null,
                            suppliersLoginPassword: suppliersLoginPassword || null,
                            suppliersStaffName: suppliersStaffName || null,
                            financesLoginPassword: financesLoginPassword || null,
                            financesStaffName: financesStaffName || null,
                          }),
                        });
                        toast({ title: "Saved", description: "Staff names and passwords updated successfully" });
                      } catch (error) {
                        toast({ title: "Error", description: "Failed to save passwords", variant: "destructive" });
                      } finally {
                        setSaving(false);
                      }
                    }}
                    disabled={saving}
                    className="bg-gradient-to-r from-rose-500 to-pink-600 text-white"
                    data-testid="button-save-access"
                  >
                    {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />} Save Passwords
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="mt-6 space-y-6" data-testid="tab-content-payments">
            {/* Payment Methods Overview */}
            <Card className="premium-card border-0" data-testid="card-payment-methods">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-green-400" />
                  Payment Methods
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-400">Available payment options based on your region and setup</p>
                
                {/* Payment Methods Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm" data-testid="table-payment-methods">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left py-2 text-slate-400 font-medium">Payment Method</th>
                        <th className="text-left py-2 text-slate-400 font-medium">Hardware Needed</th>
                        <th className="text-left py-2 text-slate-400 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-slate-700/50" data-testid="row-payment-cash">
                        <td className="py-3 text-white">Cash</td>
                        <td className="py-3 text-slate-300">None</td>
                        <td className="py-3"><Badge className="bg-green-500/20 text-green-400 border-green-500/30" data-testid="status-payment-cash">Available</Badge></td>
                      </tr>
                      <tr className="border-b border-slate-700/50" data-testid="row-payment-online">
                        <td className="py-3 text-white">Online Card Payment</td>
                        <td className="py-3 text-slate-300">None</td>
                        <td className="py-3">
                          {restaurant?.stripeAccountId ? (
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30" data-testid="status-payment-online">Connected</Badge>
                          ) : (
                            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30" data-testid="status-payment-online">Not Set Up</Badge>
                          )}
                        </td>
                      </tr>
                      <tr className="border-b border-slate-700/50" data-testid="row-payment-card-reader">
                        <td className="py-3 text-white">Stripe Card Reader</td>
                        <td className="py-3 text-slate-300">Stripe Terminal ($59-$249)</td>
                        <td className="py-3">
                          {restaurant?.currency === "GBP" ? (
                            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30" data-testid="status-payment-card-reader">Available in UK</Badge>
                          ) : restaurant?.currency === "PKR" ? (
                            <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30" data-testid="status-payment-card-reader">Not Available in Pakistan</Badge>
                          ) : restaurant?.currency === "AED" ? (
                            <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30" data-testid="status-payment-card-reader">Not Available in UAE</Badge>
                          ) : (
                            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30" data-testid="status-payment-card-reader">Check Availability</Badge>
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Regional Payment Info */}
            <Card className="premium-card border-0" data-testid="card-regional-payments">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Globe className="h-5 w-5 text-blue-400" />
                  Regional Payment Options
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm" data-testid="table-regional-payments">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left py-2 text-slate-400 font-medium">Feature</th>
                        <th className="text-left py-2 text-slate-400 font-medium">Region</th>
                        <th className="text-left py-2 text-slate-400 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-slate-700/50" data-testid="row-regional-cash">
                        <td className="py-3 text-white">Cash</td>
                        <td className="py-3 text-slate-300">All</td>
                        <td className="py-3"><Badge className="bg-green-500/20 text-green-400 border-green-500/30" data-testid="status-regional-cash">Available</Badge></td>
                      </tr>
                      <tr className="border-b border-slate-700/50" data-testid="row-regional-stripe">
                        <td className="py-3 text-white">Stripe Online</td>
                        <td className="py-3 text-slate-300">UK, UAE</td>
                        <td className="py-3"><Badge className="bg-green-500/20 text-green-400 border-green-500/30" data-testid="status-regional-stripe">Available</Badge></td>
                      </tr>
                      <tr className="border-b border-slate-700/50" data-testid="row-regional-card-reader">
                        <td className="py-3 text-white">Stripe Card Reader</td>
                        <td className="py-3 text-slate-300">UK Only</td>
                        <td className="py-3"><Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30" data-testid="status-regional-card-reader">Can Add</Badge></td>
                      </tr>
                      <tr className="border-b border-slate-700/50" data-testid="row-regional-easypaisa">
                        <td className="py-3 text-white">EasyPaisa / JazzCash</td>
                        <td className="py-3 text-slate-300">Pakistan</td>
                        <td className="py-3"><Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30" data-testid="status-regional-easypaisa">Coming Soon</Badge></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Stripe Card Reader Section - Only for UK */}
            {restaurant?.currency === "GBP" && (
              <Card className="premium-card border-0 border-l-4 border-l-green-500" data-testid="card-stripe-terminal-uk">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-green-400" />
                    Stripe Card Reader (UK)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                    <h4 className="font-semibold text-green-400 mb-2">How to Add Card Readers</h4>
                    <ol className="text-sm text-slate-300 space-y-2 list-decimal list-inside">
                      <li>Purchase a Stripe Terminal reader ($59-$249)</li>
                      <li>Power on the reader and get the registration code</li>
                      <li>Contact support to register your reader</li>
                      <li>Start accepting in-person card payments!</li>
                    </ol>
                  </div>
                  
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-2">Supported Readers</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg">
                        <CreditCard className="h-8 w-8 text-cyan-400" />
                        <div>
                          <p className="text-white font-medium">Stripe Reader M2</p>
                          <p className="text-slate-400">~$59 - Portable</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg">
                        <CreditCard className="h-8 w-8 text-purple-400" />
                        <div>
                          <p className="text-white font-medium">WisePOS E</p>
                          <p className="text-slate-400">~$249 - Countertop</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500">
                    Note: You can add multiple readers per branch (e.g., 4-5 for different waiters). 
                    All readers connect to your branch's Stripe account.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Tap to Pay on Phone - FREE Option */}
            {restaurant?.currency === "GBP" && (
              <Card className="premium-card border-0 border-l-4 border-l-blue-500" data-testid="card-tap-to-pay">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Phone className="h-5 w-5 text-blue-400" />
                    Tap to Pay on Phone (FREE!)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-lg p-4">
                    <div className="flex items-start gap-4">
                      <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl p-3 flex-shrink-0">
                        <Phone className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-blue-300 mb-2">No Hardware Needed!</h4>
                        <p className="text-sm text-slate-300 mb-3">
                          Your phone becomes the card reader. Customer taps their card or phone on YOUR phone to pay.
                        </p>
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">FREE - No Extra Cost</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-800/50 rounded-lg p-4">
                      <h5 className="font-semibold text-white mb-3 flex items-center gap-2">
                        <span className="text-2xl">📱</span> iPhone Requirements
                      </h5>
                      <ul className="text-sm text-slate-300 space-y-2">
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-400" />
                          iPhone XS or newer
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-400" />
                          iOS 16.4 or later
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-400" />
                          Stripe app installed
                        </li>
                      </ul>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-4">
                      <h5 className="font-semibold text-white mb-3 flex items-center gap-2">
                        <span className="text-2xl">🤖</span> Android Requirements
                      </h5>
                      <ul className="text-sm text-slate-300 space-y-2">
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-400" />
                          Android 9 or newer
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-400" />
                          NFC enabled phone
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-400" />
                          Stripe app installed
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-400 mb-2">How to Set Up Tap to Pay</h4>
                    <ol className="text-sm text-slate-300 space-y-2 list-decimal list-inside">
                      <li>Download the <strong>Stripe Dashboard</strong> app on your phone</li>
                      <li>Log in with your Stripe account</li>
                      <li>Go to <strong>Payments → Tap to Pay</strong></li>
                      <li>Follow the setup instructions</li>
                      <li>Enter the payment amount and hold phone near customer's card</li>
                    </ol>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/20">
                    <div className="text-4xl">💳</div>
                    <div>
                      <p className="text-green-400 font-semibold">Perfect for waiters & delivery drivers</p>
                      <p className="text-sm text-slate-400">No need to buy expensive card readers - every staff phone can accept payments!</p>
                    </div>
                  </div>

                  <a 
                    href="https://stripe.com/gb/terminal/tap-to-pay" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm"
                  >
                    <Globe className="h-4 w-4" />
                    Learn more about Stripe Tap to Pay
                  </a>
                </CardContent>
              </Card>
            )}

            {/* Alternative Card Readers - UK */}
            {restaurant?.currency === "GBP" && (
              <Card className="premium-card border-0 border-l-4 border-l-amber-500" data-testid="card-alternative-readers">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-amber-400" />
                    Alternative Card Readers
                  </CardTitle>
                  <p className="text-sm text-slate-400">Popular standalone card reader options if you prefer not to use Stripe Terminal</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* SumUp */}
                    <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 border border-blue-500/30 rounded-xl p-4" data-testid="card-sumup">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center">
                          <span className="text-white font-bold text-lg">S</span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-white">SumUp</h4>
                          <p className="text-xs text-blue-300">Air Card Reader</p>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Reader Cost:</span>
                          <span className="text-white font-medium">~£39</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Transaction Fee:</span>
                          <span className="text-white font-medium">1.69%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Monthly Fee:</span>
                          <span className="text-green-400 font-medium">FREE</span>
                        </div>
                      </div>
                      <a 
                        href="https://sumup.co.uk" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 text-xs"
                      >
                        <Globe className="h-3 w-3" /> sumup.co.uk
                      </a>
                    </div>

                    {/* Square */}
                    <div className="bg-gradient-to-br from-slate-900/30 to-slate-800/20 border border-slate-500/30 rounded-xl p-4" data-testid="card-square">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-lg bg-slate-700 flex items-center justify-center">
                          <span className="text-white font-bold text-lg">▢</span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-white">Square</h4>
                          <p className="text-xs text-slate-300">Card Reader</p>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Reader Cost:</span>
                          <span className="text-white font-medium">~£19</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Transaction Fee:</span>
                          <span className="text-white font-medium">1.75%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Monthly Fee:</span>
                          <span className="text-green-400 font-medium">FREE</span>
                        </div>
                      </div>
                      <a 
                        href="https://squareup.com/gb" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-1 text-slate-400 hover:text-slate-300 text-xs"
                      >
                        <Globe className="h-3 w-3" /> squareup.com/gb
                      </a>
                    </div>

                    {/* Zettle by PayPal */}
                    <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/20 border border-purple-500/30 rounded-xl p-4" data-testid="card-zettle">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-lg bg-purple-600 flex items-center justify-center">
                          <span className="text-white font-bold text-lg">Z</span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-white">Zettle</h4>
                          <p className="text-xs text-purple-300">by PayPal</p>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Reader Cost:</span>
                          <span className="text-white font-medium">~£29</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Transaction Fee:</span>
                          <span className="text-white font-medium">1.75%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Monthly Fee:</span>
                          <span className="text-green-400 font-medium">FREE</span>
                        </div>
                      </div>
                      <a 
                        href="https://zettle.com/gb" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-1 text-purple-400 hover:text-purple-300 text-xs"
                      >
                        <Globe className="h-3 w-3" /> zettle.com/gb
                      </a>
                    </div>
                  </div>

                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mt-4">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">💡</div>
                      <div>
                        <h4 className="font-semibold text-amber-400 mb-1">Important Note</h4>
                        <p className="text-sm text-slate-300">
                          These are standalone card readers with their own payment accounts. They won't integrate with this system's order tracking - 
                          you'll need to mark orders as "Paid by Card" manually. For full integration, use <strong>Stripe Tap to Pay</strong> or <strong>Stripe Terminal</strong> readers above.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Pakistan Payment Info */}
            {restaurant?.currency === "PKR" && (
              <Card className="premium-card border-0 border-l-4 border-l-green-500" data-testid="card-payment-pakistan">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-green-400" />
                    Pakistan Payment Methods
                  </CardTitle>
                  <p className="text-sm text-slate-400">Add your EasyPaisa, JazzCash, and bank account details for Pakistani customers.</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* EasyPaisa */}
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4" data-testid="card-easypaisa-edit">
                    <h4 className="font-semibold text-green-400 mb-3 flex items-center gap-2">
                      <span className="w-6 h-6 rounded bg-green-500 text-white text-xs flex items-center justify-center font-bold">EP</span>
                      EasyPaisa
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-slate-300 text-xs">Account Number</Label>
                        <Input value={easypaisaAccountNumber} onChange={(e) => setEasypaisaAccountNumber(e.target.value)} placeholder="03XX-XXXXXXX" className="bg-slate-800/50 border-slate-600 text-white" data-testid="input-easypaisa-number" />
                      </div>
                      <div>
                        <Label className="text-slate-300 text-xs">Account Name</Label>
                        <Input value={easypaisaAccountName} onChange={(e) => setEasypaisaAccountName(e.target.value)} placeholder="Account holder name" className="bg-slate-800/50 border-slate-600 text-white" data-testid="input-easypaisa-name" />
                      </div>
                    </div>
                  </div>

                  {/* JazzCash */}
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4" data-testid="card-jazzcash-edit">
                    <h4 className="font-semibold text-red-400 mb-3 flex items-center gap-2">
                      <span className="w-6 h-6 rounded bg-red-500 text-white text-xs flex items-center justify-center font-bold">JC</span>
                      JazzCash
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-slate-300 text-xs">Account Number</Label>
                        <Input value={jazzcashAccountNumber} onChange={(e) => setJazzcashAccountNumber(e.target.value)} placeholder="03XX-XXXXXXX" className="bg-slate-800/50 border-slate-600 text-white" data-testid="input-jazzcash-number" />
                      </div>
                      <div>
                        <Label className="text-slate-300 text-xs">Account Name</Label>
                        <Input value={jazzcashAccountName} onChange={(e) => setJazzcashAccountName(e.target.value)} placeholder="Account holder name" className="bg-slate-800/50 border-slate-600 text-white" data-testid="input-jazzcash-name" />
                      </div>
                    </div>
                  </div>

                  {/* HBL Bank */}
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4" data-testid="card-hbl-edit">
                    <h4 className="font-semibold text-blue-400 mb-3 flex items-center gap-2">
                      <span className="w-6 h-6 rounded bg-blue-600 text-white text-xs flex items-center justify-center font-bold">HBL</span>
                      HBL Bank
                    </h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label className="text-slate-300 text-xs">Account Number</Label>
                        <Input value={hblAccountNumber} onChange={(e) => setHblAccountNumber(e.target.value)} placeholder="Account number" className="bg-slate-800/50 border-slate-600 text-white" data-testid="input-hbl-number" />
                      </div>
                      <div>
                        <Label className="text-slate-300 text-xs">Account Name</Label>
                        <Input value={hblAccountName} onChange={(e) => setHblAccountName(e.target.value)} placeholder="Account holder name" className="bg-slate-800/50 border-slate-600 text-white" data-testid="input-hbl-name" />
                      </div>
                      <div>
                        <Label className="text-slate-300 text-xs">IBAN</Label>
                        <Input value={hblIban} onChange={(e) => setHblIban(e.target.value)} placeholder="PK..." className="bg-slate-800/50 border-slate-600 text-white" data-testid="input-hbl-iban" />
                      </div>
                    </div>
                  </div>

                  {/* UBL Bank */}
                  <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4" data-testid="card-ubl-edit">
                    <h4 className="font-semibold text-purple-400 mb-3 flex items-center gap-2">
                      <span className="w-6 h-6 rounded bg-purple-600 text-white text-xs flex items-center justify-center font-bold">UBL</span>
                      UBL Bank
                    </h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label className="text-slate-300 text-xs">Account Number</Label>
                        <Input value={ublAccountNumber} onChange={(e) => setUblAccountNumber(e.target.value)} placeholder="Account number" className="bg-slate-800/50 border-slate-600 text-white" data-testid="input-ubl-number" />
                      </div>
                      <div>
                        <Label className="text-slate-300 text-xs">Account Name</Label>
                        <Input value={ublAccountName} onChange={(e) => setUblAccountName(e.target.value)} placeholder="Account holder name" className="bg-slate-800/50 border-slate-600 text-white" data-testid="input-ubl-name" />
                      </div>
                      <div>
                        <Label className="text-slate-300 text-xs">IBAN</Label>
                        <Input value={ublIban} onChange={(e) => setUblIban(e.target.value)} placeholder="PK..." className="bg-slate-800/50 border-slate-600 text-white" data-testid="input-ubl-iban" />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-slate-700">
                    <div className="text-sm text-slate-400">
                      <p><strong>Cash:</strong> Always available</p>
                      <p className="mt-1"><strong>Stripe:</strong> Not available in Pakistan</p>
                    </div>
                    <Button onClick={handleSavePakistaniPayments} disabled={saving} className="bg-gradient-to-r from-emerald-500 to-green-600 text-white" data-testid="button-save-pakistan-payments">
                      {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />} Save Payment Methods
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* UAE Payment Info */}
            {restaurant?.currency === "AED" && (
              <Card className="premium-card border-0 border-l-4 border-l-blue-500" data-testid="card-payment-uae">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-blue-400" />
                    UAE / Dubai Payment Options
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-400 mb-2">Available Options</h4>
                    <ul className="text-sm text-slate-300 space-y-1 list-disc list-inside">
                      <li>Cash payments</li>
                      <li>Stripe Online payments (customer types card on screen)</li>
                    </ul>
                  </div>
                  <div className="text-sm text-slate-400">
                    <p><strong>Stripe Card Reader:</strong> Not yet available in UAE</p>
                    <p className="mt-1 text-xs">Stripe Terminal hardware is only available in UK, US, and select European countries.</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* App Icon Tab */}
          <TabsContent value="app" className="mt-6 space-y-6" data-testid="tab-content-app">
            <Card className="premium-card border-0 border-l-4 border-l-orange-500">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-orange-400" />
                  Mobile App Icon Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-orange-400 mb-2">Separate App for Your Branch</h4>
                  <p className="text-sm text-slate-300">
                    Customers can install your menu as a separate app on their phone with your own icon.
                    Upload a square icon (512x512px recommended) from Canva or any design tool.
                  </p>
                </div>

                {/* App Icon Preview */}
                <div className="flex items-start gap-6">
                  <div className="text-center">
                    <Label className="text-slate-300 mb-2 block">App Icon Preview</Label>
                    <div 
                      className="w-24 h-24 rounded-2xl flex items-center justify-center border-2 border-dashed border-slate-600 overflow-hidden"
                      style={{ backgroundColor: appBackgroundColor }}
                    >
                      {appIconUrl ? (
                        <img src={appIconUrl} alt="App Icon" className="w-full h-full object-cover" />
                      ) : logoUrl ? (
                        <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <Smartphone className="h-10 w-10 text-slate-500" />
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-2">{appShortName || "App Name"}</p>
                  </div>

                  <div className="flex-1 space-y-4">
                    {/* Upload App Icon */}
                    <div className="space-y-2">
                      <Label className="text-slate-300 flex items-center gap-2">
                        <Image className="h-4 w-4 text-orange-400" /> App Icon (512x512px)
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          value={appIconUrl}
                          onChange={(e) => setAppIconUrl(e.target.value)}
                          className="bg-slate-800/50 border-slate-600 text-white flex-1"
                          placeholder="Icon URL or upload below"
                          data-testid="input-app-icon-url"
                        />
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setIsUploadingAppIcon(true);
                              try {
                                const formData = new FormData();
                                formData.append("file", file);
                                const res = await fetch("/api/upload", { method: "POST", body: formData });
                                if (res.ok) {
                                  const { url } = await res.json();
                                  setAppIconUrl(url);
                                  toast({ title: "Icon Uploaded", description: "App icon uploaded successfully" });
                                }
                              } catch (err) {
                                toast({ title: "Upload Failed", description: "Failed to upload icon", variant: "destructive" });
                              }
                              setIsUploadingAppIcon(false);
                            }}
                            data-testid="input-upload-app-icon"
                          />
                          <Button variant="outline" className="border-orange-500 text-orange-400 hover:bg-orange-500/10" disabled={isUploadingAppIcon} asChild>
                            <span>
                              {isUploadingAppIcon ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                            </span>
                          </Button>
                        </label>
                      </div>
                    </div>

                    {/* App Name */}
                    <div className="space-y-2">
                      <Label className="text-slate-300">App Name (shown under icon)</Label>
                      <Input
                        value={appName}
                        onChange={(e) => setAppName(e.target.value)}
                        className="bg-slate-800/50 border-slate-600 text-white"
                        placeholder="e.g. Lahore Tikka House"
                        data-testid="input-app-name"
                      />
                    </div>

                    {/* Short Name */}
                    <div className="space-y-2">
                      <Label className="text-slate-300">Short Name (max 12 chars)</Label>
                      <Input
                        value={appShortName}
                        onChange={(e) => setAppShortName(e.target.value.substring(0, 12))}
                        className="bg-slate-800/50 border-slate-600 text-white"
                        placeholder="e.g. Lahore Tikka"
                        maxLength={12}
                        data-testid="input-app-short-name"
                      />
                    </div>
                  </div>
                </div>

                {/* Colors */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Theme Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={appThemeColor}
                        onChange={(e) => setAppThemeColor(e.target.value)}
                        className="w-12 h-10 p-1 bg-slate-800/50 border-slate-600 cursor-pointer"
                        data-testid="input-app-theme-color"
                      />
                      <Input
                        value={appThemeColor}
                        onChange={(e) => setAppThemeColor(e.target.value)}
                        className="bg-slate-800/50 border-slate-600 text-white flex-1"
                        placeholder="#8B0000"
                        data-testid="input-app-theme-color-text"
                      />
                    </div>
                    <p className="text-xs text-slate-400">Browser/status bar color</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-300">Background Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={appBackgroundColor}
                        onChange={(e) => setAppBackgroundColor(e.target.value)}
                        className="w-12 h-10 p-1 bg-slate-800/50 border-slate-600 cursor-pointer"
                        data-testid="input-app-bg-color"
                      />
                      <Input
                        value={appBackgroundColor}
                        onChange={(e) => setAppBackgroundColor(e.target.value)}
                        className="bg-slate-800/50 border-slate-600 text-white flex-1"
                        placeholder="#ffffff"
                        data-testid="input-app-bg-color-text"
                      />
                    </div>
                    <p className="text-xs text-slate-400">Splash screen background</p>
                  </div>
                </div>

                {/* Save Button */}
                <Button 
                  onClick={async () => {
                    setSaving(true);
                    try {
                      await fetch(`/api/restaurants/${restaurantId}/app-settings`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ appIconUrl, appName, appShortName, appThemeColor, appBackgroundColor })
                      });
                      queryClient.invalidateQueries({ queryKey: ["/api/restaurants", slug] });
                      toast({ title: "App Settings Saved", description: "Your mobile app settings have been updated." });
                    } catch (err) {
                      toast({ title: "Error", description: "Failed to save app settings", variant: "destructive" });
                    }
                    setSaving(false);
                  }}
                  disabled={saving}
                  className="bg-gradient-to-r from-orange-500 to-red-600 text-white w-full"
                  data-testid="button-save-app-settings"
                >
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save App Settings
                </Button>

                {/* Instructions */}
                <div className="bg-slate-800/50 rounded-lg p-4 mt-4">
                  <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                    <Download className="h-4 w-4 text-orange-400" />
                    How Customers Install Your App
                  </h4>
                  <ol className="text-sm text-slate-300 space-y-2 list-decimal list-inside">
                    <li>Customer opens your menu: <code className="bg-slate-700 px-1 rounded">/menu/{slug}</code></li>
                    <li>On iPhone: Tap Share → "Add to Home Screen"</li>
                    <li>On Android: Tap menu (⋮) → "Install app" or "Add to Home Screen"</li>
                    <li>Your app icon appears on their phone!</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <AlertDialog open={!!deleteCategoryConfirm} onOpenChange={(open) => !open && setDeleteCategoryConfirm(null)}>
        <AlertDialogContent className="bg-slate-900 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Category?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Are you sure you want to delete "{deleteCategoryConfirm?.name}"?
              {deleteCategoryConfirm?.itemCount ? (
                <span className="text-amber-400 block mt-2">
                  This category has {deleteCategoryConfirm.itemCount} menu item(s). They will remain but won't show under this category.
                </span>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 text-white border-slate-600 hover:bg-slate-700">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteCategory} 
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteCategoryMutation.isPending}
              data-testid="button-confirm-delete-category"
            >
              {deleteCategoryMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
