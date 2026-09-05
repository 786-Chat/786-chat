import React, { useState, useMemo, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { getRestaurants, createRestaurant, updateRestaurant, deleteRestaurant, duplicateRestaurant, getMenuItems, createMenuItem, updateMenuItem, deleteMenuItem, getGalleryImages, createGalleryImage, deleteGalleryImage, getDashboardSettings, updateDashboardSettings, getHeroImages, createHeroImage, getPromotion, createPromotion, getBranchFeatures, updateBranchFeatures, getPopularItems, createPopularItem, updatePopularItem, deletePopularItem } from "@/lib/api";
import type { Restaurant, MenuItem, GalleryImage, DashboardSettings, BranchFeatures, PopularItem } from "@shared/schema";
import { CURRENCIES, getCurrencySymbol } from "@shared/schema";
import { themes, themeList } from "@shared/themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  LayoutDashboard, 
  Store,
  UtensilsCrossed, 
  Settings, 
  LogOut, 
  Plus, 
  Search,
  TrendingUp,
  DollarSign,
  ExternalLink,
  ShieldCheck,
  Edit2,
  Pencil,
  Trash2,
  Copy,
  CreditCard,
  Link as LinkIcon,
  Loader2,
  Image as ImageIcon,
  Images,
  Save,
  X,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  MapPin,
  Phone,
  Globe,
  Check,
  CheckCircle,
  AlertCircle,
  Upload,
  FileSpreadsheet,
  ScanLine,
  CheckSquare,
  Square,
  Sparkles,
  Video,
  Users,
  ArrowLeft,
  Volume2,
  Play,
  Clock,
  Menu,
  RotateCcw,
  History,
  Bell,
  CalendarDays,
  MessageCircle,
  Percent,
  Building,
  Building2,
  Wallet,
  FileText,
  LayoutGrid,
  ClipboardPaste,
  AlertTriangle,
  Home,
  RefreshCw,
  Palette,
  Smartphone,
  ImagePlus,
  QrCode,
  Download,
  Briefcase
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import AdminMarketingStaff from "@/components/admin-marketing-staff";
import { AdminLink24Phone } from "@/components/admin/admin-link24-phone";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const CategoryIcon = ({ icon, size = "sm" }: { icon: string; size?: "sm" | "md" | "lg" }) => {
  const isUrl = icon?.startsWith('http') || icon?.startsWith('/objects/');
  const sizeClass = size === "lg" ? "w-6 h-6" : size === "md" ? "w-5 h-5" : "w-4 h-4";
  
  if (isUrl) {
    return <img src={icon} alt="category icon" className={`${sizeClass} object-contain inline-block`} />;
  }
  return <span>{icon || "🍽️"}</span>;
};

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

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  
  useEffect(() => {
    const adminLoggedIn = localStorage.getItem("adminLoggedIn");
    if (adminLoggedIn !== "true") {
      setLocation("/admin");
    } else {
      setIsAuthenticated(true);
    }
  }, [setLocation]);

  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== "undefined") {
      const t = new URLSearchParams(window.location.search).get("tab");
      if (t) return t;
    }
    return "restaurants";
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [branchesPage, setBranchesPage] = useState(1);
  const BRANCHES_PER_PAGE = 10;
  const [selectedRestaurantMenu, setSelectedRestaurantMenu] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isAddRestaurantOpen, setIsAddRestaurantOpen] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);
  const [isAddMenuItemOpen, setIsAddMenuItemOpen] = useState(false);
  const [addMenuItemBranch, setAddMenuItemBranch] = useState<string>("");
  const [addMenuItemCategory, setAddMenuItemCategory] = useState<string>("");
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: "restaurant" | "menuItem"; id: string; name: string } | null>(null);
  const [isUploadingCSV, setIsUploadingCSV] = useState(false);
  const [csvUploadRestaurant, setCsvUploadRestaurant] = useState<string>("");
  const [menuImageUrl, setMenuImageUrl] = useState<string>("");
  const [editMenuImageUrl, setEditMenuImageUrl] = useState<string>("");
  const [editMenuCategory, setEditMenuCategory] = useState<string>("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [selectedGalleryRestaurant, setSelectedGalleryRestaurant] = useState<string>("all");
  const [isAddGalleryImageOpen, setIsAddGalleryImageOpen] = useState(false);
  const [galleryImageUrl, setGalleryImageUrl] = useState<string>("");
  const [galleryImageTitle, setGalleryImageTitle] = useState<string>("");
  const [isUploadingGalleryImage, setIsUploadingGalleryImage] = useState(false);
  const [editLogoUrl, setEditLogoUrl] = useState<string>("");
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [editBranchCurrency, setEditBranchCurrency] = useState<string>("GBP");
  const [editCardEnabled, setEditCardEnabled] = useState<boolean>(false);
  const [newBranchLogoUrl, setNewBranchLogoUrl] = useState<string>("");
  const [isUploadingNewBranchLogo, setIsUploadingNewBranchLogo] = useState(false);
  const [newBranchCurrency, setNewBranchCurrency] = useState<string>("GBP");
  const [bankTransferBranchId, setBankTransferBranchId] = useState<string | null>(null);
  const [btBankName, setBtBankName] = useState("");
  const [btAccountName, setBtAccountName] = useState("");
  const [btSortCode, setBtSortCode] = useState("");
  const [btAccountNumber, setBtAccountNumber] = useState("");
  const [btIban, setBtIban] = useState("");
  const [btVideoUrl, setBtVideoUrl] = useState("");
  const [isSavingBankTransfer, setIsSavingBankTransfer] = useState(false);
  const [isUploadingMenuBg, setIsUploadingMenuBg] = useState(false);
  const [welcomeBgType, setWelcomeBgType] = useState<string>("gradient");
  const [welcomeBgImageUrl, setWelcomeBgImageUrl] = useState<string>("");
  const [welcomeBgVideoUrl, setWelcomeBgVideoUrl] = useState<string>("");
  const [welcomeGradientStart, setWelcomeGradientStart] = useState<string>("#1a1a2e");
  const [welcomeGradientMiddle, setWelcomeGradientMiddle] = useState<string>("");
  const [welcomeGradientEnd, setWelcomeGradientEnd] = useState<string>("#16213e");
  const [isSavingWelcomeBg, setIsSavingWelcomeBg] = useState(false);
  const [isUploadingWelcomeBg, setIsUploadingWelcomeBg] = useState(false);
  const [editVoiceAlertEnabled, setEditVoiceAlertEnabled] = useState(true);
  const [editVoiceAlertMessage, setEditVoiceAlertMessage] = useState("New order received");
  const [editVoiceAlertRate, setEditVoiceAlertRate] = useState(1.0);
  const [editVoiceAlertPitch, setEditVoiceAlertPitch] = useState(1.0);
  const [editAlarmSound, setEditAlarmSound] = useState("alarm1");
  const [soundSettingsBranch, setSoundSettingsBranch] = useState<string | null>(null);
  const [soundAlarmSound, setSoundAlarmSound] = useState("alarm1");
  const [soundVoiceEnabled, setSoundVoiceEnabled] = useState(true);
  const [soundVoiceMessage, setSoundVoiceMessage] = useState("New order received");
  const [soundVoiceRate, setSoundVoiceRate] = useState(1.0);
  const [soundVoicePitch, setSoundVoicePitch] = useState(1.0);
  const [newBranchDomainOption, setNewBranchDomainOption] = useState<"default" | "link24" | "custom">("default");
  const [newBranchSubdomain, setNewBranchSubdomain] = useState<string>("");
  const [newBranchCustomDomain, setNewBranchCustomDomain] = useState<string>("");
  const [newBranchTheme, setNewBranchTheme] = useState<string>("");
  const [newBranchSourceId, setNewBranchSourceId] = useState<string>("");
  const [hiddenThemes, setHiddenThemes] = useState<string[]>(() => {
    const saved = localStorage.getItem('hiddenThemes');
    return saved ? JSON.parse(saved) : [];
  });
  const [showAllThemes, setShowAllThemes] = useState(false);
  const [editDomainOption, setEditDomainOption] = useState<"default" | "link24" | "custom">("default");
  const [editSubdomain, setEditSubdomain] = useState<string>("");
  const [editCustomDomain, setEditCustomDomain] = useState<string>("");
  const [duplicatingRestaurant, setDuplicatingRestaurant] = useState<Restaurant | null>(null);
  const [duplicateName, setDuplicateName] = useState<string>("");
  const [duplicateAddress, setDuplicateAddress] = useState<string>("");
  const [duplicatePhone, setDuplicatePhone] = useState<string>("");
  const [duplicateEmail, setDuplicateEmail] = useState<string>("");
  const [duplicateLogoUrl, setDuplicateLogoUrl] = useState<string>("");
  const [duplicateStripeId, setDuplicateStripeId] = useState<string>("");
  const [duplicateUsername, setDuplicateUsername] = useState<string>("");
  const [duplicatePassword, setDuplicatePassword] = useState<string>("");
  const [duplicateTheme, setDuplicateTheme] = useState<string>("");
  const [duplicateTagline, setDuplicateTagline] = useState<string>("");
  const [duplicateCuisineType, setDuplicateCuisineType] = useState<string>("");
  const [duplicateRating, setDuplicateRating] = useState<string>("");
  const [isUploadingDuplicateLogo, setIsUploadingDuplicateLogo] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [expandedRestaurant, setExpandedRestaurant] = useState<string | null>(null);
  const [editingPrices, setEditingPrices] = useState<Record<string, string>>({});
  const [addingMenuToRestaurant, setAddingMenuToRestaurant] = useState<string | null>(null);
  const [newMenuItemName, setNewMenuItemName] = useState("");
  const [newMenuItemPrice, setNewMenuItemPrice] = useState("");
  const [newMenuItemCategory, setNewMenuItemCategory] = useState("platters");
  const [newMenuItemDescription, setNewMenuItemDescription] = useState("");
  const [newMenuItemImage, setNewMenuItemImage] = useState("");
  const [isUploadingNewMenuImage, setIsUploadingNewMenuImage] = useState(false);
  
  // Menu Manager state
  const [menuManagerBranch, setMenuManagerBranch] = useState<string>("");
  const [menuManagerExpandedCategories, setMenuManagerExpandedCategories] = useState<string[]>([]);
  
  // Add Category state
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryIcon, setNewCategoryIcon] = useState("🍽️");
  const [newCategoryIconType, setNewCategoryIconType] = useState<"emoji" | "image">("emoji");
  const [newCategoryIconUrl, setNewCategoryIconUrl] = useState("");
  const [isUploadingCategoryIcon, setIsUploadingCategoryIcon] = useState(false);
  
  // Edit Category state
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryDbId, setEditingCategoryDbId] = useState<string>("");
  const [editingCategoryName, setEditingCategoryName] = useState("");
  const [editingCategoryIcon, setEditingCategoryIcon] = useState("");
  const [editingCategorySlug, setEditingCategorySlug] = useState("");
  const [editingCategoryIsGlobal, setEditingCategoryIsGlobal] = useState(false);
  const [editingCategoryImageUrl, setEditingCategoryImageUrl] = useState("");
  const [editingCategoryVideoUrl, setEditingCategoryVideoUrl] = useState("");
  const [editingCategoryGifUrl, setEditingCategoryGifUrl] = useState("");
  const [editingCategoryDescription, setEditingCategoryDescription] = useState("");
  const [isEditCategoryOpen, setIsEditCategoryOpen] = useState(false);
  const [isUploadingCategoryMedia, setIsUploadingCategoryMedia] = useState<'image' | 'gif' | 'video' | null>(null);
  
  // Tawa Image Manager state
  const [expandedImageManager, setExpandedImageManager] = useState<string | null>(null);
  const [tawaLogoUrl, setTawaLogoUrl] = useState<string>("");
  const [editingMenuImage, setEditingMenuImage] = useState<string | null>(null);
  const [newMenuImageUrl, setNewMenuImageUrl] = useState<string>("");

  // Dashboard Features Control state (Super Admin feature)
  const [expandedDashboardSettings, setExpandedDashboardSettings] = useState<string | null>(null);
  const [dashboardSettings, setDashboardSettings] = useState<Record<string, DashboardSettings>>({});

  // Branch Features Control state (Super Admin - control actual branch capabilities)
  const [expandedBranchFeatures, setExpandedBranchFeatures] = useState<string | null>(null);
  const [branchFeaturesState, setBranchFeaturesState] = useState<Record<string, BranchFeatures>>({});

  // Platform Settings state (global super admin settings)
  const [platformCommission, setPlatformCommission] = useState("2.5");
  const [smsNotificationsEnabled, setSmsNotificationsEnabled] = useState(true);
  const [emailDigestsEnabled, setEmailDigestsEnabled] = useState(true);
  const [operatingHours, setOperatingHours] = useState<Record<string, { open: string; close: string; enabled: boolean }>>({
    monday: { open: "11:00", close: "23:00", enabled: true },
    tuesday: { open: "11:00", close: "23:00", enabled: true },
    wednesday: { open: "11:00", close: "23:00", enabled: true },
    thursday: { open: "11:00", close: "23:00", enabled: true },
    friday: { open: "11:00", close: "23:00", enabled: true },
    saturday: { open: "11:00", close: "23:00", enabled: true },
    sunday: { open: "11:00", close: "23:00", enabled: false },
  });

  // Branches Customers state
  const [selectedCustomerBranch, setSelectedCustomerBranch] = useState<string>("");

  // Operating Hours per branch state
  const [selectedHoursBranch, setSelectedHoursBranch] = useState<string>("");
  const [hoursSearchQuery, setHoursSearchQuery] = useState("");
  const [branchHours, setBranchHours] = useState({
    deliveryHoursMonThu: "12PM - 10:30PM",
    deliveryHoursFriSat: "12PM - 11:30PM",
    deliveryHoursSun: "12PM - 10:30PM",
    collectionHoursMonThu: "12PM - 10:30PM",
    collectionHoursFriSat: "12PM - 11:30PM",
    collectionHoursSun: "12PM - 10:30PM",
  });

  // Delivery Radius Settings state
  const [deliveryRadius, setDeliveryRadius] = useState({
    deliveryRadiusType: "uk_only" as "uk_only" | "worldwide" | "radius",
    deliveryRadiusMiles: "5",
    restaurantLatitude: "",
    restaurantLongitude: "",
  });

  // Link Import state
  const [linkImportUrls, setLinkImportUrls] = useState<string[]>([""]);
  const [linkImportRestaurant, setLinkImportRestaurant] = useState<string>("");
  const [isImportingFromLink, setIsImportingFromLink] = useState(false);
  const [linkImportComplete, setLinkImportComplete] = useState(false);
  const [linkImportedItems, setLinkImportedItems] = useState<any[]>([]);
  const [linkImportSections, setLinkImportSections] = useState<any[]>([]);
  const [linkImportBranch, setLinkImportBranch] = useState<string>("");
  const [linkImportRestaurantId, setLinkImportRestaurantId] = useState<string>("");

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
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
          if (isEdit) {
            setEditMenuImageUrl(data.url);
          } else {
            setMenuImageUrl(data.url);
          }
          toast({ title: "Image Uploaded", description: "Image uploaded successfully!" });
        } else {
          const error = await response.json();
          toast({ title: "Upload Failed", description: error.error, variant: "destructive" });
        }
        setIsUploadingImage(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast({ title: "Upload Failed", description: "Could not upload image", variant: "destructive" });
      setIsUploadingImage(false);
    }
  };

  const handleMenuBgUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploadingMenuBg(true);
    
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
          if (type === 'image') {
            setMenuBgImageUrl(data.url);
          } else {
            setMenuBgVideoUrl(data.url);
          }
          toast({ title: "Upload Successful", description: `${type === 'image' ? 'Image' : 'Video'} uploaded successfully!` });
        } else {
          const error = await response.json();
          toast({ title: "Upload Failed", description: error.error, variant: "destructive" });
        }
        setIsUploadingMenuBg(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast({ title: "Upload Failed", description: "Could not upload file", variant: "destructive" });
      setIsUploadingMenuBg(false);
    }
  };

  const handleWelcomeBgUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploadingWelcomeBg(true);
    
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
          if (type === 'image') {
            setWelcomeBgImageUrl(data.url);
          } else {
            setWelcomeBgVideoUrl(data.url);
          }
          toast({ title: "Upload Successful", description: `${type === 'image' ? 'Image' : 'Video'} uploaded successfully!` });
        } else {
          const error = await response.json();
          toast({ title: "Upload Failed", description: error.error, variant: "destructive" });
        }
        setIsUploadingWelcomeBg(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast({ title: "Upload Failed", description: "Could not upload file", variant: "destructive" });
      setIsUploadingWelcomeBg(false);
    }
  };

  const { data: restaurants = [], isLoading: loadingRestaurants } = useQuery({
    queryKey: ["/api/restaurants"],
    queryFn: getRestaurants,
  });

  const { data: menuItems = [], isLoading: loadingMenu } = useQuery({
    queryKey: ["/api/menu"],
    queryFn: () => getMenuItems(),
  });

  const { data: dbCategories = [] } = useQuery({
    queryKey: ["/api/menu-categories"],
    queryFn: async () => {
      const response = await fetch("/api/menu-categories");
      return response.json();
    },
  });

  // Platform Settings query
  const { data: platformSettingsData } = useQuery({
    queryKey: ["/api/platform-settings"],
    queryFn: async () => {
      const response = await fetch("/api/platform-settings");
      return response.json();
    },
  });

  // Pending bookings counts for all branches
  const { data: pendingBookingCounts = {} } = useQuery<Record<string, number>>({
    queryKey: ["/api/bookings/pending-counts"],
    queryFn: async () => {
      const response = await fetch("/api/bookings/pending-counts");
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Load platform settings into state when data changes
  useEffect(() => {
    if (platformSettingsData) {
      setPlatformCommission(platformSettingsData.platformCommission || "2.5");
      setSmsNotificationsEnabled(platformSettingsData.smsNotificationsEnabled ?? true);
      setEmailDigestsEnabled(platformSettingsData.emailDigestsEnabled ?? true);
      setOperatingHours({
        monday: { open: platformSettingsData.mondayOpen || "11:00", close: platformSettingsData.mondayClose || "23:00", enabled: platformSettingsData.mondayEnabled ?? true },
        tuesday: { open: platformSettingsData.tuesdayOpen || "11:00", close: platformSettingsData.tuesdayClose || "23:00", enabled: platformSettingsData.tuesdayEnabled ?? true },
        wednesday: { open: platformSettingsData.wednesdayOpen || "11:00", close: platformSettingsData.wednesdayClose || "23:00", enabled: platformSettingsData.wednesdayEnabled ?? true },
        thursday: { open: platformSettingsData.thursdayOpen || "11:00", close: platformSettingsData.thursdayClose || "23:00", enabled: platformSettingsData.thursdayEnabled ?? true },
        friday: { open: platformSettingsData.fridayOpen || "11:00", close: platformSettingsData.fridayClose || "23:00", enabled: platformSettingsData.fridayEnabled ?? true },
        saturday: { open: platformSettingsData.saturdayOpen || "11:00", close: platformSettingsData.saturdayClose || "23:00", enabled: platformSettingsData.saturdayEnabled ?? true },
        sunday: { open: platformSettingsData.sundayOpen || "11:00", close: platformSettingsData.sundayClose || "23:00", enabled: platformSettingsData.sundayEnabled ?? false },
      });
    }
  }, [platformSettingsData]);

  // Load branch hours and delivery radius when selectedHoursBranch changes
  useEffect(() => {
    if (selectedHoursBranch && restaurants.length > 0) {
      const branch = restaurants.find(r => r.id === selectedHoursBranch);
      if (branch) {
        setBranchHours({
          deliveryHoursMonThu: branch.deliveryHoursMonThu || "12PM - 10:30PM",
          deliveryHoursFriSat: branch.deliveryHoursFriSat || "12PM - 11:30PM",
          deliveryHoursSun: branch.deliveryHoursSun || "12PM - 10:30PM",
          collectionHoursMonThu: branch.collectionHoursMonThu || "12PM - 10:30PM",
          collectionHoursFriSat: branch.collectionHoursFriSat || "12PM - 11:30PM",
          collectionHoursSun: branch.collectionHoursSun || "12PM - 10:30PM",
        });
        setDeliveryRadius({
          deliveryRadiusType: (branch.deliveryRadiusType as "uk_only" | "worldwide" | "radius") || "uk_only",
          deliveryRadiusMiles: branch.deliveryRadiusMiles || "5",
          restaurantLatitude: branch.restaurantLatitude || "",
          restaurantLongitude: branch.restaurantLongitude || "",
        });
      }
    }
  }, [selectedHoursBranch, restaurants]);

  const updatePlatformSettingsMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const response = await fetch("/api/platform-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/platform-settings"] });
      toast({ title: "Settings Saved", description: "Platform settings updated successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save settings", variant: "destructive" });
    },
  });

  // Combine database categories with hardcoded fallback for backwards compatibility
  const allCategories = useMemo(() => {
    if (dbCategories.length > 0) {
      return dbCategories.map((cat: { id: string; slug: string; name: string; icon: string; restaurantId: string | null }) => ({
        id: cat.id,
        slug: cat.slug,
        name: cat.name,
        icon: cat.icon || "🍽️",
        dbId: cat.id,
        restaurantId: cat.restaurantId,
      }));
    }
    return MENU_CATEGORIES.map((cat: { id: string; name: string; icon: string }) => ({ ...cat, restaurantId: null }));
  }, [dbCategories]);

  // Get categories for a specific branch (prefer branch-specific over global)
  const getCategoriesForBranch = (branchId: string | null) => {
    if (!branchId) return allCategories;
    
    // ONLY return categories specific to this branch - complete data isolation
    return allCategories.filter((cat: { id: string; name: string; icon: string; restaurantId: string | null }) => cat.restaurantId === branchId);
  };

  // Get ONLY branch-specific categories (not global) - for accurate counting
  const getBranchSpecificCategories = (branchId: string | null) => {
    if (!branchId) return [];
    return allCategories.filter((cat: { id: string; name: string; icon: string; restaurantId: string | null }) => cat.restaurantId === branchId);
  };

  const { data: branchCustomers = [], isLoading: loadingBranchCustomers } = useQuery({
    queryKey: ["/api/restaurants", selectedCustomerBranch, "customers"],
    queryFn: async () => {
      if (!selectedCustomerBranch) return [];
      const response = await fetch(`/api/restaurants/${selectedCustomerBranch}/customers`);
      return response.json();
    },
    enabled: !!selectedCustomerBranch,
  });

  const deleteCustomerMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/customers/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurants", selectedCustomerBranch, "customers"] });
      toast({ title: "Customer Deleted", description: "Customer has been removed." });
    },
  });

  const createRestaurantMutation = useMutation({
    mutationFn: createRestaurant,
    onSuccess: async (newRestaurant) => {
      // Copy menu from source branch if selected
      if (newBranchSourceId && newBranchSourceId !== "none") {
        try {
          const copyResponse = await fetch(`/api/restaurants/${newRestaurant.id}/copy-menu`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sourceRestaurantId: newBranchSourceId }),
          });
          if (copyResponse.ok) {
            const result = await copyResponse.json();
            toast({ 
              title: "Menu Copied", 
              description: `Copied ${result.itemsCopied} menu items and ${result.categoriesCopied} categories from source branch.` 
            });
          }
        } catch (error) {
          console.error("Failed to copy menu:", error);
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/restaurants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/menu"] });
      queryClient.invalidateQueries({ queryKey: ["/api/menu-categories"] });
      toast({ title: "Branch Created", description: `${newRestaurant.name} has been added successfully.` });
      setIsAddRestaurantOpen(false);
      setNewBranchLogoUrl("");
      setNewBranchSourceId("");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create branch", variant: "destructive" });
    },
  });

  const updateRestaurantMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Restaurant> }) => updateRestaurant(id, data as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/restaurants/slug"] });
      toast({ title: "Branch Updated", description: "Changes saved successfully." });
      // Close dialog after a brief delay to ensure animations complete
      setTimeout(() => {
        setEditingRestaurant(null);
      }, 100);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update branch", variant: "destructive" });
    },
  });

  const deleteRestaurantMutation = useMutation({
    mutationFn: deleteRestaurant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurants"] });
      toast({ title: "Branch Deleted", description: "Branch has been removed." });
      setDeleteConfirm(null);
    },
  });

  const createMenuItemMutation = useMutation({
    mutationFn: createMenuItem,
    onSuccess: () => {
      // Refresh both menu items and categories to update counts
      queryClient.invalidateQueries({ queryKey: ["/api/menu"] });
      queryClient.invalidateQueries({ queryKey: ["/api/menu-categories"] });
      queryClient.refetchQueries({ queryKey: ["/api/menu"] });
      toast({ title: "Menu Item Added", description: "Item has been added to the menu." });
      setIsAddMenuItemOpen(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add menu item", variant: "destructive" });
    },
  });

  const updateMenuItemMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<MenuItem> }) => updateMenuItem(id, data as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/menu"] });
      toast({ title: "Menu Item Updated", description: "Changes saved successfully." });
      setEditingMenuItem(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update menu item", variant: "destructive" });
    },
  });

  const deleteMenuItemMutation = useMutation({
    mutationFn: deleteMenuItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/menu"] });
      toast({ title: "Menu Item Deleted", description: "Item has been removed from the menu." });
      setDeleteConfirm(null);
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (data: { name: string; icon: string; restaurantId?: string }) => {
      const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const response = await fetch('/api/menu-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          slug,
          icon: data.icon,
          restaurantId: data.restaurantId || null,
          sortOrder: 100,
        }),
      });
      if (!response.ok) throw new Error('Failed to create category');
      return response.json();
    },
    onSuccess: () => {
      // Invalidate all category-related queries to refresh dropdowns everywhere
      queryClient.invalidateQueries({ queryKey: ["/api/menu-categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/menu-items"] });
      queryClient.refetchQueries({ queryKey: ["/api/menu-categories"] });
      toast({ title: "Category Added", description: "New category has been created." });
      setIsAddCategoryOpen(false);
      setNewCategoryName("");
      setNewCategoryIcon("🍽️");
      setNewCategoryIconType("emoji");
      setNewCategoryIconUrl("");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create category", variant: "destructive" });
    },
  });

  const [deleteCategoryConfirm, setDeleteCategoryConfirm] = useState<{ id: string; name: string; itemCount: number } | null>(null);

  const deleteCategoryMutation = useMutation({
    mutationFn: async (categorySlugOrId: string) => {
      // First try to find by slug (from allCategories which uses slug as id)
      let category = dbCategories.find((c: { slug: string }) => c.slug === categorySlugOrId);
      // If not found by slug, try by actual database id
      if (!category) {
        category = dbCategories.find((c: { id: string }) => c.id === categorySlugOrId);
      }
      if (!category) throw new Error('Category not found');
      const response = await fetch(`/api/menu-categories/${category.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete category');
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/menu-categories"] });
      toast({ title: "Category Deleted", description: "Category has been removed." });
      setDeleteCategoryConfirm(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete category", variant: "destructive" });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async (data: { dbId: string; name: string; icon: string; slug: string; isGlobal: boolean; restaurantId: string }) => {
      // Server handles cloning global categories to branch-specific ones
      const response = await fetch(`/api/menu-categories/${data.dbId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          icon: data.icon,
          restaurantId: data.restaurantId, // Server uses this to clone global categories
        }),
      });
      if (!response.ok) throw new Error('Failed to update category');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/menu-categories"] });
      toast({ title: "Category Updated", description: "Category has been updated." });
      setIsEditCategoryOpen(false);
      setEditingCategoryId(null);
      setEditingCategoryDbId("");
      setEditingCategoryName("");
      setEditingCategoryIcon("");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update category", variant: "destructive" });
    },
  });

  const { data: allGalleryImages = [] } = useQuery({
    queryKey: ["/api/gallery", selectedGalleryRestaurant],
    queryFn: async () => {
      if (selectedGalleryRestaurant === "all") {
        const imageArrays = await Promise.all(
          restaurants.map(r => getGalleryImages(r.id))
        );
        return imageArrays.flat();
      }
      return getGalleryImages(selectedGalleryRestaurant);
    },
    enabled: activeTab === "gallery" && restaurants.length > 0,
  });

  const createGalleryImageMutation = useMutation({
    mutationFn: createGalleryImage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gallery"] });
      toast({ title: "Image Added", description: "Gallery image has been added successfully." });
      setIsAddGalleryImageOpen(false);
      setGalleryImageUrl("");
      setGalleryImageTitle("");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add gallery image", variant: "destructive" });
    },
  });

  const deleteGalleryImageMutation = useMutation({
    mutationFn: deleteGalleryImage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gallery"] });
      toast({ title: "Image Deleted", description: "Gallery image has been removed." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete gallery image", variant: "destructive" });
    },
  });

  const handleGalleryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploadingGalleryImage(true);
    
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
          setGalleryImageUrl(data.url);
          toast({ title: "Image Uploaded", description: "Image uploaded successfully!" });
        } else {
          const error = await response.json();
          toast({ title: "Upload Failed", description: error.error, variant: "destructive" });
        }
        setIsUploadingGalleryImage(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast({ title: "Upload Failed", description: "Could not upload image", variant: "destructive" });
      setIsUploadingGalleryImage(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>, isNewBranch = false) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      toast({ title: "Invalid Format", description: "Please upload PNG, JPG, SVG, or GIF files only.", variant: "destructive" });
      return;
    }
    
    if (isNewBranch) {
      setIsUploadingNewBranchLogo(true);
    } else {
      setIsUploadingLogo(true);
    }
    
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
          if (isNewBranch) {
            setNewBranchLogoUrl(data.url);
          } else {
            setEditLogoUrl(data.url);
          }
          toast({ title: "Logo Uploaded", description: "Logo uploaded successfully!" });
        } else {
          const error = await response.json();
          toast({ title: "Upload Failed", description: error.error, variant: "destructive" });
        }
        if (isNewBranch) {
          setIsUploadingNewBranchLogo(false);
        } else {
          setIsUploadingLogo(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast({ title: "Upload Failed", description: "Could not upload logo", variant: "destructive" });
      if (isNewBranch) {
        setIsUploadingNewBranchLogo(false);
      } else {
        setIsUploadingLogo(false);
      }
    }
  };

  const handleDuplicateLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      toast({ title: "Invalid Format", description: "Please upload PNG, JPG, SVG, or GIF files only.", variant: "destructive" });
      return;
    }
    
    setIsUploadingDuplicateLogo(true);
    
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
          setDuplicateLogoUrl(data.url);
          toast({ title: "Logo Uploaded", description: "Logo uploaded successfully!" });
        } else {
          const error = await response.json();
          toast({ title: "Upload Failed", description: error.error, variant: "destructive" });
        }
        setIsUploadingDuplicateLogo(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast({ title: "Upload Failed", description: "Could not upload logo", variant: "destructive" });
      setIsUploadingDuplicateLogo(false);
    }
  };

  const openDuplicateDialog = (restaurant: Restaurant) => {
    console.log("Opening duplicate dialog for:", restaurant.name, restaurant.id);
    // Clone the restaurant object to prevent React Query cache mutations from affecting dialog state
    setDuplicatingRestaurant({ ...restaurant });
    setDuplicateName("");
    setDuplicateAddress("");
    setDuplicatePhone("");
    setDuplicateEmail("");
    setDuplicateLogoUrl(restaurant.logoUrl || "");
    setDuplicateStripeId("");
    setDuplicateUsername("");
    setDuplicatePassword("");
    setDuplicateTheme("");
  };

  const handleNewMenuImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploadingNewMenuImage(true);
    
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
          const error = await response.json();
          toast({ title: "Upload Failed", description: error.error, variant: "destructive" });
        }
        setIsUploadingNewMenuImage(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast({ title: "Upload Failed", description: "Could not upload image", variant: "destructive" });
      setIsUploadingNewMenuImage(false);
    }
  };

  const handleInlinePriceUpdate = async (menuItem: MenuItem) => {
    const newPrice = editingPrices[menuItem.id];
    if (!newPrice || newPrice === menuItem.price) {
      setEditingPrices(prev => {
        const updated = { ...prev };
        delete updated[menuItem.id];
        return updated;
      });
      return;
    }

    try {
      await updateMenuItem(menuItem.id, { price: newPrice });
      queryClient.invalidateQueries({ queryKey: ["/api/menu"] });
      const restaurant = restaurants.find(r => r.id === menuItem.restaurantId);
      const symbol = getCurrencySymbol(restaurant?.currency || "GBP");
      toast({ title: "Price Updated", description: `${menuItem.name} price updated to ${symbol}${newPrice}` });
      setEditingPrices(prev => {
        const updated = { ...prev };
        delete updated[menuItem.id];
        return updated;
      });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update price", variant: "destructive" });
    }
  };

  const handleInlineDeleteMenuItem = async (menuItem: MenuItem) => {
    try {
      await deleteMenuItem(menuItem.id);
      queryClient.invalidateQueries({ queryKey: ["/api/menu"] });
      toast({ title: "Menu Item Deleted", description: `${menuItem.name} has been removed.` });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete menu item", variant: "destructive" });
    }
  };

  const handleAddNewMenuItem = async (restaurantId: string) => {
    if (!newMenuItemName || !newMenuItemPrice) {
      toast({ title: "Required Fields", description: "Please enter name and price.", variant: "destructive" });
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
      queryClient.invalidateQueries({ queryKey: ["/api/menu"] });
      toast({ title: "Menu Item Added", description: `${newMenuItemName} has been added.` });
      setAddingMenuToRestaurant(null);
      setNewMenuItemName("");
      setNewMenuItemPrice("");
      setNewMenuItemCategory("platters");
      setNewMenuItemDescription("");
      setNewMenuItemImage("");
    } catch (error) {
      toast({ title: "Error", description: "Failed to add menu item", variant: "destructive" });
    }
  };

  // Tawa Image Manager Handlers
  const handleTawaLogoUpdate = async (restaurant: Restaurant) => {
    if (!tawaLogoUrl) return;
    
    try {
      await updateRestaurant(restaurant.id, { logoUrl: tawaLogoUrl });
      queryClient.invalidateQueries({ queryKey: ["/api/restaurants"] });
      toast({ title: "Logo Updated", description: "Restaurant logo has been updated!" });
      setTawaLogoUrl("");
    } catch (error) {
      toast({ title: "Error", description: "Failed to update logo", variant: "destructive" });
    }
  };

  const handleMenuImageUpdate = async (menuItemId: string) => {
    if (!newMenuImageUrl) return;
    
    try {
      await updateMenuItem(menuItemId, { image: newMenuImageUrl });
      queryClient.invalidateQueries({ queryKey: ["/api/menu"] });
      toast({ title: "Image Updated", description: "Menu item image has been updated!" });
      setEditingMenuImage(null);
      setNewMenuImageUrl("");
    } catch (error) {
      toast({ title: "Error", description: "Failed to update image", variant: "destructive" });
    }
  };

  // Dashboard Features Handlers
  const loadDashboardSettings = async (restaurantId: string) => {
    if (dashboardSettings[restaurantId]) return;
    
    try {
      const settings = await getDashboardSettings(restaurantId);
      setDashboardSettings(prev => ({ ...prev, [restaurantId]: settings }));
    } catch (error) {
      toast({ title: "Error", description: "Failed to load dashboard settings", variant: "destructive" });
    }
  };

  const handleToggleDashboardFeature = async (restaurantId: string, feature: string, enabled: boolean) => {
    try {
      const updates: Record<string, boolean> = { [feature]: enabled };
      const updatedSettings = await updateDashboardSettings(restaurantId, updates);
      setDashboardSettings(prev => ({ ...prev, [restaurantId]: updatedSettings }));
      toast({ 
        title: "Feature Updated", 
        description: `${feature.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).replace('Enabled', '')} has been ${enabled ? 'enabled' : 'disabled'}.` 
      });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update feature", variant: "destructive" });
    }
  };

  // Branch Features Handlers (control actual branch capabilities)
  const loadBranchFeatures = async (restaurantId: string) => {
    if (branchFeaturesState[restaurantId]) return;
    
    try {
      const features = await getBranchFeatures(restaurantId);
      setBranchFeaturesState(prev => ({ ...prev, [restaurantId]: features }));
    } catch (error) {
      toast({ title: "Error", description: "Failed to load branch features", variant: "destructive" });
    }
  };

  const handleToggleBranchFeature = async (restaurantId: string, feature: keyof BranchFeatures, enabled: boolean) => {
    try {
      const updates = { [feature]: enabled };
      const updatedFeatures = await updateBranchFeatures(restaurantId, updates);
      setBranchFeaturesState(prev => ({ ...prev, [restaurantId]: updatedFeatures }));
      const featureName = feature.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      toast({ 
        title: "Branch Feature Updated", 
        description: `${featureName} has been ${enabled ? 'enabled' : 'disabled'} for this branch.` 
      });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update branch feature", variant: "destructive" });
    }
  };

  const handleDuplicateBranch = async () => {
    if (!duplicatingRestaurant || !duplicateName) {
      toast({ title: "Required Fields", description: "Please fill in branch name.", variant: "destructive" });
      return;
    }

    setIsDuplicating(true);
    
    try {
      // Generate slug from name
      const slug = duplicateName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      
      // Use the backend API to duplicate everything in one call
      // This copies: restaurant settings, menu items, menu modifiers/toppings, 
      // hero images, gallery images, promotions, and dashboard settings
      await duplicateRestaurant(duplicatingRestaurant.id, {
        name: duplicateName,
        slug,
        address: duplicateAddress || undefined,
        phone: duplicatePhone || undefined,
        email: duplicateEmail || undefined,
        loginUsername: duplicateUsername || undefined,
        loginPassword: duplicatePassword || undefined,
        stripeAccountId: duplicateStripeId || undefined,
        logoUrl: duplicateLogoUrl || undefined,
        tagline: duplicateTagline || undefined,
        cuisineType: duplicateCuisineType || undefined,
        rating: duplicateRating || undefined,
        themeKey: duplicateTheme || undefined,
      });

      queryClient.invalidateQueries({ queryKey: ["/api/restaurants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/menu"] });
      queryClient.invalidateQueries({ queryKey: ["/api/gallery"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hero-images"] });
      queryClient.invalidateQueries({ queryKey: ["/api/promotions"] });
      
      toast({ 
        title: "Branch Duplicated", 
        description: `${duplicateName} has been created with ALL settings, menu items (including toppings), images, promotions and theme from ${duplicatingRestaurant.name}.` 
      });
      
      setDuplicatingRestaurant(null);
    } catch (error: any) {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to duplicate branch", 
        variant: "destructive" 
      });
    } finally {
      setIsDuplicating(false);
    }
  };

  const filteredRestaurants = restaurants.filter(r =>
    r.address !== "Phone-only customer" &&
    (r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     r.address.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalBranchPages = Math.ceil(filteredRestaurants.length / BRANCHES_PER_PAGE);
  const paginatedRestaurants = filteredRestaurants.slice(
    (branchesPage - 1) * BRANCHES_PER_PAGE,
    branchesPage * BRANCHES_PER_PAGE
  );

  const filteredMenuItems = menuItems.filter(item => {
    const matchesRestaurant = selectedRestaurantMenu === "all" || item.restaurantId === selectedRestaurantMenu;
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRestaurant && matchesCategory && matchesSearch;
  });

  const totalRevenue = restaurants.reduce((acc, r) => acc + Number(r.revenueToday || 0), 0);
  const totalOrders = restaurants.reduce((acc, r) => acc + (r.ordersToday || 0), 0);
  const activeRestaurants = restaurants.filter(r => r.status === "open").length;

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !csvUploadRestaurant) return;
    
    setIsUploadingCSV(true);
    
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      let imported = 0;
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const item: Record<string, string> = {};
        headers.forEach((h, idx) => {
          item[h] = values[idx] || '';
        });
        
        if (item.name && item.price) {
          await createMenuItem({
            restaurantId: csvUploadRestaurant,
            name: item.name,
            description: item.description || '',
            price: item.price,
            category: item.category || 'other-menus',
            image: item.image || '',
            available: true,
          });
          imported++;
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/menu"] });
      toast({ title: "Import Complete", description: `Successfully imported ${imported} menu items.` });
    } catch (error) {
      toast({ title: "Import Failed", description: "Could not parse CSV file.", variant: "destructive" });
    } finally {
      setIsUploadingCSV(false);
      e.target.value = '';
    }
  };

  const handleAddRestaurant = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const name = formData.get("name") as string;
    const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    createRestaurantMutation.mutate({
      name,
      slug,
      address: formData.get("address") as string,
      status: "closed",
      rating: "5.0",
      ordersToday: 0,
      revenueToday: "0.00",
      lastOrderTime: "Never",
      googleMapsUrl: formData.get("googleMapsUrl") as string || "",
      stripeAccountId: (formData.get("stripeAccountId") as string)?.trim() || null,
      stripePublishableKey: (formData.get("stripePublishableKey") as string)?.trim() || null,
      stripeSecretKey: (formData.get("stripeSecretKey") as string)?.trim() || null,
      loginUsername: formData.get("loginUsername") as string || undefined,
      loginPassword: formData.get("loginPassword") as string || undefined,
      logoUrl: newBranchLogoUrl || null,
      currency: newBranchCurrency || "GBP",
      themeKey: newBranchTheme || "",
      customDomain: (() => {
        if (newBranchDomainOption === "link24" && newBranchSubdomain.trim()) {
          return `${newBranchSubdomain.trim()}.link24.online`;
        }
        if (newBranchDomainOption === "custom" && newBranchCustomDomain.trim()) {
          return newBranchCustomDomain.trim();
        }
        return null;
      })(),
      bankTransferEnabled: !!(formData.get("bankAccountName") as string)?.trim(),
      bankName: (formData.get("bankName") as string)?.trim() || null,
      bankAccountName: (formData.get("bankAccountName") as string)?.trim() || null,
      bankSortCode: (formData.get("bankSortCode") as string)?.trim() || null,
      bankAccountNumber: (formData.get("bankAccountNumber") as string)?.trim() || null,
      bankIban: (formData.get("bankIban") as string)?.trim() || null,
      bankTransferVideoUrl: (formData.get("bankTransferVideoUrl") as string)?.trim() || null,
      easypaisaAccountNumber: (formData.get("easypaisaAccountNumber") as string)?.trim() || null,
      easypaisaAccountName: (formData.get("easypaisaAccountName") as string)?.trim() || null,
      jazzcashAccountNumber: (formData.get("jazzcashAccountNumber") as string)?.trim() || null,
      jazzcashAccountName: (formData.get("jazzcashAccountName") as string)?.trim() || null,
      hblAccountNumber: (formData.get("hblAccountNumber") as string)?.trim() || null,
      hblAccountName: (formData.get("hblAccountName") as string)?.trim() || null,
      hblIban: (formData.get("hblIban") as string)?.trim() || null,
      ublAccountNumber: (formData.get("ublAccountNumber") as string)?.trim() || null,
      ublAccountName: (formData.get("ublAccountName") as string)?.trim() || null,
      ublIban: (formData.get("ublIban") as string)?.trim() || null,
    });
    // Reset state after submission
    setNewBranchDomainOption("default");
    setNewBranchSubdomain("");
    setNewBranchCustomDomain("");
    setNewBranchTheme("classic");
  };

  const handleUpdateRestaurant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRestaurant) return;
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const stripeAccountId = (formData.get("stripeAccountId") as string)?.trim() || null;
    const stripePublishableKey = (formData.get("stripePublishableKey") as string)?.trim() || null;
    const stripeSecretKey = (formData.get("stripeSecretKey") as string)?.trim() || null;
    
    const newName = formData.get("name") as string;
    const newSlug = newName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    
    updateRestaurantMutation.mutate({
      id: editingRestaurant.id,
      data: {
        name: newName,
        slug: newSlug,
        address: formData.get("address") as string,
        googleMapsUrl: formData.get("googleMapsUrl") as string,
        stripeAccountId,
        stripePublishableKey,
        stripeSecretKey,
        cardEnabled: editCardEnabled,
        loginUsername: formData.get("loginUsername") as string || undefined,
        loginPassword: formData.get("loginPassword") as string || undefined,
        status: formData.get("status") as "open" | "closed",
        logoUrl: editLogoUrl || null,
        currency: editBranchCurrency || editingRestaurant.currency || "GBP",
        customDomain: (() => {
          if (editDomainOption === "link24" && editSubdomain.trim()) {
            return `${editSubdomain.trim()}.link24.online`;
          }
          if (editDomainOption === "custom" && editCustomDomain.trim()) {
            return editCustomDomain.trim();
          }
          return null;
        })(),
        bankTransferEnabled: !!(formData.get("bankAccountName") as string)?.trim(),
        bankName: (formData.get("bankName") as string)?.trim() || null,
        bankAccountName: (formData.get("bankAccountName") as string)?.trim() || null,
        bankSortCode: (formData.get("bankSortCode") as string)?.trim() || null,
        bankAccountNumber: (formData.get("bankAccountNumber") as string)?.trim() || null,
        bankIban: (formData.get("bankIban") as string)?.trim() || null,
        bankTransferVideoUrl: (formData.get("bankTransferVideoUrl") as string)?.trim() || null,
        easypaisaAccountNumber: (formData.get("easypaisaAccountNumber") as string)?.trim() || null,
        easypaisaAccountName: (formData.get("easypaisaAccountName") as string)?.trim() || null,
        jazzcashAccountNumber: (formData.get("jazzcashAccountNumber") as string)?.trim() || null,
        jazzcashAccountName: (formData.get("jazzcashAccountName") as string)?.trim() || null,
        hblAccountNumber: (formData.get("hblAccountNumber") as string)?.trim() || null,
        hblAccountName: (formData.get("hblAccountName") as string)?.trim() || null,
        hblIban: (formData.get("hblIban") as string)?.trim() || null,
        ublAccountNumber: (formData.get("ublAccountNumber") as string)?.trim() || null,
        ublAccountName: (formData.get("ublAccountName") as string)?.trim() || null,
        ublIban: (formData.get("ublIban") as string)?.trim() || null,
        sumupApiKey: (formData.get("sumupApiKey") as string)?.trim() || null,
        sumupMerchantCode: (formData.get("sumupMerchantCode") as string)?.trim() || null,
        squareAccessToken: (formData.get("squareAccessToken") as string)?.trim() || null,
        squareLocationId: (formData.get("squareLocationId") as string)?.trim() || null,
        zettleApiKey: (formData.get("zettleApiKey") as string)?.trim() || null,
        zettleMerchantId: (formData.get("zettleMerchantId") as string)?.trim() || null,
      },
    });
  };

  const handleAddMenuItem = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    if (!addMenuItemBranch || !addMenuItemCategory) {
      toast({ title: "Error", description: "Please select both branch and category", variant: "destructive" });
      return;
    }

    createMenuItemMutation.mutate({
      restaurantId: addMenuItemBranch,
      name: formData.get("name") as string,
      description: formData.get("description") as string || "",
      price: formData.get("price") as string,
      category: addMenuItemCategory,
      image: menuImageUrl || "",
      available: true,
    });
  };

  const handleUpdateMenuItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMenuItem) return;
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const imageUrl = editMenuImageUrl || editingMenuItem.image || "";

    updateMenuItemMutation.mutate({
      id: editingMenuItem.id,
      data: {
        restaurantId: formData.get("restaurantId") as string,
        name: formData.get("name") as string,
        description: formData.get("description") as string,
        price: formData.get("price") as string,
        category: formData.get("category") as string,
        image: imageUrl,
        available: formData.get("available") === "on",
      },
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "Link copied to clipboard." });
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="stat-card-3d bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 text-white border-0">
          <CardHeader className="pb-2 relative z-10">
            <CardTitle className="text-sm font-medium opacity-90">Today's Revenue</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold drop-shadow-lg">{getCurrencySymbol(restaurants[0]?.currency || "GBP")}{totalRevenue.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</div>
            <p className="text-xs opacity-75 mt-1">+20.1% from yesterday</p>
          </CardContent>
        </Card>
        <Card className="stat-card-3d bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 text-white border-0">
          <CardHeader className="pb-2 relative z-10">
            <CardTitle className="text-sm font-medium opacity-90">Total Orders</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold drop-shadow-lg">{totalOrders}</div>
            <p className="text-xs opacity-75 mt-1">+12 in last hour</p>
          </CardContent>
        </Card>
        <Card className="stat-card-3d bg-gradient-to-br from-purple-500 via-purple-600 to-violet-600 text-white border-0">
          <CardHeader className="pb-2 relative z-10">
            <CardTitle className="text-sm font-medium opacity-90">Active Branches</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold drop-shadow-lg">{activeRestaurants} <span className="text-lg opacity-75">/ {restaurants.length}</span></div>
            <p className="text-xs opacity-75 mt-1">All systems operational</p>
          </CardContent>
        </Card>
        <Card className="stat-card-3d bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 text-white border-0">
          <CardHeader className="pb-2 relative z-10">
            <CardTitle className="text-sm font-medium opacity-90">Menu Items</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold drop-shadow-lg">{menuItems.length}</div>
            <p className="text-xs opacity-75 mt-1">Across all branches</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="premium-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5 text-emerald-500" /> <span className="gradient-text">Recent Branches</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {restaurants.slice(0, 5).map((r) => (
                <div key={r.id} className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-secondary/40 to-secondary/20 hover:from-secondary/60 hover:to-secondary/40 transition-all duration-300 hover:translate-x-1 border border-border/50 hover:border-emerald-500/30 hover:shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center font-bold text-primary shadow-lg">
                      {r.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{r.name}</p>
                      <p className="text-xs text-muted-foreground">{r.address}</p>
                    </div>
                  </div>
                  <Badge variant={r.status === "open" ? "default" : "secondary"} className={`badge-3d ${r.status === "open" ? "bg-gradient-to-r from-emerald-500 to-teal-500" : ""}`}>
                    {r.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="premium-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" /> <span className="gradient-text">Quick Actions</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="h-20 flex-col gap-2 stat-card-3d bg-gradient-to-br from-emerald-500/10 to-teal-500/5 hover:from-emerald-500/20 hover:to-teal-500/10 border-emerald-500/30 hover:border-emerald-500/50" onClick={() => { setActiveTab("restaurants"); setIsAddRestaurantOpen(true); }}>
              <Plus className="h-5 w-5 text-emerald-500" />
              <span>Add Branch</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2 stat-card-3d bg-gradient-to-br from-blue-500/10 to-indigo-500/5 hover:from-blue-500/20 hover:to-indigo-500/10 border-blue-500/30 hover:border-blue-500/50" onClick={() => { setActiveTab("menus"); setIsAddMenuItemOpen(true); }}>
              <UtensilsCrossed className="h-5 w-5 text-blue-500" />
              <span>Add Menu Item</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2 stat-card-3d bg-gradient-to-br from-purple-500/10 to-violet-500/5 hover:from-purple-500/20 hover:to-violet-500/10 border-purple-500/30 hover:border-purple-500/50" onClick={() => setActiveTab("menus")}>
              <ImageIcon className="h-5 w-5 text-purple-500" />
              <span>Manage Images</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2 stat-card-3d bg-gradient-to-br from-orange-500/10 to-amber-500/5 hover:from-orange-500/20 hover:to-amber-500/10 border-orange-500/30 hover:border-orange-500/50" onClick={() => setActiveTab("settings")}>
              <Settings className="h-5 w-5 text-orange-500" />
              <span>Settings</span>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderRestaurants = () => (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search branches..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setBranchesPage(1); }}
            data-testid="input-search-restaurants"
          />
        </div>
        <div className="flex gap-2">
          <Dialog open={isAddRestaurantOpen} onOpenChange={setIsAddRestaurantOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-gradient-to-r from-primary to-primary/80" data-testid="button-add-restaurant">
                <Plus className="h-4 w-4" /> Add New Branch
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" /> Create New Branch
              </DialogTitle>
              <DialogDescription>Add a new restaurant branch to your network.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddRestaurant} className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Branch Name *</Label>
                  <Input id="name" name="name" placeholder="e.g. Peri Peri London" required data-testid="input-restaurant-name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address *</Label>
                  <Input id="address" name="address" placeholder="e.g. 123 High Street, London" required data-testid="input-restaurant-address" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="googleMapsUrl">Google Maps URL</Label>
                  <Input id="googleMapsUrl" name="googleMapsUrl" placeholder="https://g.page/r/..." data-testid="input-restaurant-maps" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select name="currency" value={newBranchCurrency} onValueChange={setNewBranchCurrency}>
                    <SelectTrigger data-testid="select-restaurant-currency">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((curr) => (
                        <SelectItem key={curr.code} value={curr.code}>
                          {curr.symbol} - {curr.name} ({curr.country})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Stripe Payment Configuration - Hide for Pakistan */}
              {newBranchCurrency !== "PKR" && (
                <div className="border rounded-lg p-4 space-y-4 bg-secondary/10">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Payment Configuration (Stripe)</h3>
                  </div>
                  <div className="space-y-2">
                    <Label>Stripe Account ID</Label>
                    <Input name="stripeAccountId" placeholder="acct_..." data-testid="input-restaurant-stripe" />
                  </div>
                  <div className="space-y-2">
                    <Label>Stripe Publishable Key</Label>
                    <Input name="stripePublishableKey" placeholder="pk_live_..." data-testid="input-restaurant-stripe-pk" />
                  </div>
                  <div className="space-y-2">
                    <Label>Stripe Secret Key</Label>
                    <Input name="stripeSecretKey" type="password" placeholder="sk_live_..." data-testid="input-restaurant-stripe-sk" />
                    <p className="text-xs text-muted-foreground">Enter API keys from your customer's Stripe dashboard.</p>
                  </div>
                </div>
              )}

              <div className="border rounded-lg p-4 space-y-4 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border-purple-500/30">
                <div className="flex items-center gap-2">
                  <Building className="h-5 w-5 text-purple-500" />
                  <h3 className="font-semibold text-purple-600">Bank Transfer Payment</h3>
                </div>
                <p className="text-xs text-muted-foreground">Add bank details so customers can pay directly to the branch account. A QR code will be auto-generated at checkout.</p>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Bank Name</Label>
                      <Input name="bankName" placeholder="e.g. Halifax, Barclays, Lloyds..." data-testid="input-bank-name" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Account Name</Label>
                      <Input name="bankAccountName" placeholder="e.g. Mujeeb Sardar" data-testid="input-bank-account-name" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Sort Code</Label>
                      <Input name="bankSortCode" placeholder="e.g. 11-13-16" data-testid="input-bank-sort-code" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Account Number</Label>
                      <Input name="bankAccountNumber" placeholder="e.g. 00065300" data-testid="input-bank-account-number" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">IBAN (optional, for international transfers)</Label>
                    <Input name="bankIban" placeholder="e.g. GB29 NWBK 6016 1331 9268 19" data-testid="input-bank-iban" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Video Tutorial URL (optional)</Label>
                    <Input name="bankTransferVideoUrl" placeholder="https://youtube.com/watch?v=..." data-testid="input-bank-video-url" />
                  </div>
                </div>
              </div>

              {/* Pakistan Payment Methods - EasyPaisa & JazzCash */}
              {newBranchCurrency === "PKR" && (
                <div className="border rounded-lg p-4 space-y-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-green-500" />
                    <h3 className="font-semibold text-green-600">Pakistan Payment Methods</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">Add your EasyPaisa and JazzCash account details for Pakistani customers.</p>
                  
                  <div className="space-y-4">
                    <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                      <h4 className="font-medium text-green-600 mb-2 flex items-center gap-2">
                        <span className="w-6 h-6 rounded bg-green-500 text-white text-xs flex items-center justify-center font-bold">EP</span>
                        EasyPaisa
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Account Number</Label>
                          <Input name="easypaisaAccountNumber" placeholder="03XX-XXXXXXX" data-testid="input-easypaisa-number" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Account Name</Label>
                          <Input name="easypaisaAccountName" placeholder="Account holder name" data-testid="input-easypaisa-name" />
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                      <h4 className="font-medium text-red-600 mb-2 flex items-center gap-2">
                        <span className="w-6 h-6 rounded bg-red-500 text-white text-xs flex items-center justify-center font-bold">JC</span>
                        JazzCash
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Account Number</Label>
                          <Input name="jazzcashAccountNumber" placeholder="03XX-XXXXXXX" data-testid="input-jazzcash-number" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Account Name</Label>
                          <Input name="jazzcashAccountName" placeholder="Account holder name" data-testid="input-jazzcash-name" />
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                      <h4 className="font-medium text-blue-600 mb-2 flex items-center gap-2">
                        <span className="w-6 h-6 rounded bg-blue-600 text-white text-xs flex items-center justify-center font-bold">HBL</span>
                        HBL Bank
                      </h4>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Account Number</Label>
                          <Input name="hblAccountNumber" placeholder="Account number" data-testid="input-hbl-number" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Account Name</Label>
                          <Input name="hblAccountName" placeholder="Account holder name" data-testid="input-hbl-name" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">IBAN</Label>
                          <Input name="hblIban" placeholder="PK..." data-testid="input-hbl-iban" />
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/20">
                      <h4 className="font-medium text-purple-600 mb-2 flex items-center gap-2">
                        <span className="w-6 h-6 rounded bg-purple-600 text-white text-xs flex items-center justify-center font-bold">UBL</span>
                        UBL Bank
                      </h4>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Account Number</Label>
                          <Input name="ublAccountNumber" placeholder="Account number" data-testid="input-ubl-number" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Account Name</Label>
                          <Input name="ublAccountName" placeholder="Account holder name" data-testid="input-ubl-name" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">IBAN</Label>
                          <Input name="ublIban" placeholder="PK..." data-testid="input-ubl-iban" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="border rounded-lg p-4 space-y-4 bg-secondary/10">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Branch Login Credentials</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Username</Label>
                    <Input name="loginUsername" placeholder="branch_username" data-testid="input-restaurant-username" />
                  </div>
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Input name="loginPassword" type="password" placeholder="••••••••" data-testid="input-restaurant-password" />
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4 space-y-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/30">
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-blue-500" />
                  <h3 className="font-semibold text-blue-600">Branch Web Address</h3>
                </div>
                <p className="text-xs text-muted-foreground">Choose how customers will access this branch's menu online.</p>
                
                <div className="space-y-3">
                  <div 
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${newBranchDomainOption === "default" ? "bg-green-50 dark:bg-green-950/30 border-green-500 ring-2 ring-green-500" : "bg-secondary/50 border-border hover:border-green-300"}`}
                    onClick={() => setNewBranchDomainOption("default")}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${newBranchDomainOption === "default" ? "border-green-500" : "border-muted-foreground"}`}>
                        {newBranchDomainOption === "default" && <div className="w-2 h-2 rounded-full bg-green-500" />}
                      </div>
                      <div className="flex-1">
                        <Label className="text-sm font-medium cursor-pointer">Use Default App URL</Label>
                        <p className="text-xs text-muted-foreground">Customer accesses via your main app URL with branch name</p>
                        <p className="text-xs font-mono text-green-600 dark:text-green-400 mt-1">yourapp.replit.app/menu/branch-name</p>
                      </div>
                    </div>
                  </div>

                  <div 
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${newBranchDomainOption === "link24" ? "bg-blue-50 dark:bg-blue-950/30 border-blue-500 ring-2 ring-blue-500" : "bg-secondary/50 border-border hover:border-blue-300"}`}
                    onClick={() => setNewBranchDomainOption("link24")}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${newBranchDomainOption === "link24" ? "border-blue-500" : "border-muted-foreground"}`}>
                        {newBranchDomainOption === "link24" && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                      </div>
                      <div className="flex-1">
                        <Label className="text-sm font-medium cursor-pointer">Use Your link24.online Subdomain</Label>
                        <p className="text-xs text-muted-foreground">Give them a professional subdomain - no setup needed by customer!</p>
                      </div>
                    </div>
                    {newBranchDomainOption === "link24" && (
                      <div className="mt-3 ml-7 flex items-center gap-2 bg-white dark:bg-gray-900 rounded px-3 py-2 border">
                        <Input 
                          value={newBranchSubdomain}
                          onChange={(e) => setNewBranchSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                          placeholder="branchname" 
                          className="border-0 p-0 h-auto focus-visible:ring-0 flex-1"
                          data-testid="input-subdomain-prefix"
                        />
                        <span className="text-muted-foreground font-mono text-sm">.link24.online</span>
                      </div>
                    )}
                  </div>

                  <div 
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${newBranchDomainOption === "custom" ? "bg-purple-50 dark:bg-purple-950/30 border-purple-500 ring-2 ring-purple-500" : "bg-secondary/50 border-border hover:border-purple-300"}`}
                    onClick={() => setNewBranchDomainOption("custom")}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${newBranchDomainOption === "custom" ? "border-purple-500" : "border-muted-foreground"}`}>
                        {newBranchDomainOption === "custom" && <div className="w-2 h-2 rounded-full bg-purple-500" />}
                      </div>
                      <div className="flex-1">
                        <Label className="text-sm font-medium cursor-pointer">Customer's Own Domain</Label>
                        <p className="text-xs text-muted-foreground">Customer uses their own domain (they must configure their DNS)</p>
                      </div>
                    </div>
                    {newBranchDomainOption === "custom" && (
                      <div className="mt-3 ml-7">
                        <Input 
                          value={newBranchCustomDomain}
                          onChange={(e) => setNewBranchCustomDomain(e.target.value)}
                          placeholder="e.g. pizzapalace.com" 
                          data-testid="input-custom-domain"
                        />
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">Customer must point their domain DNS to your app</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4 space-y-4 bg-secondary/10">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Branch Logo</h3>
                </div>
                <p className="text-sm text-muted-foreground">Upload your restaurant logo (PNG, JPG, SVG, GIF). Displayed in header and footer.</p>
                
                {newBranchLogoUrl && (
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-lg border bg-white p-1 flex items-center justify-center">
                      <img src={newBranchLogoUrl} alt="Logo preview" className="max-h-full max-w-full object-contain" />
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setNewBranchLogoUrl("")}>
                      <X className="h-4 w-4 mr-1" /> Remove
                    </Button>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Input 
                    placeholder="Enter logo URL..." 
                    value={newBranchLogoUrl}
                    onChange={(e) => setNewBranchLogoUrl(e.target.value)}
                    data-testid="input-new-branch-logo-url"
                  />
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/gif"
                      onChange={(e) => handleLogoUpload(e, true)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      data-testid="input-new-branch-logo-file"
                    />
                    <Button type="button" variant="outline" size="sm" disabled={isUploadingNewBranchLogo}>
                      {isUploadingNewBranchLogo ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-1" /> Upload
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4 space-y-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-500" />
                    <h3 className="font-semibold text-purple-600">Branch Theme (Optional)</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {hiddenThemes.length > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAllThemes(!showAllThemes)}
                        className="text-xs"
                      >
                        {showAllThemes ? 'Hide removed' : `Show ${hiddenThemes.length} hidden`}
                      </Button>
                    )}
                    {hiddenThemes.length > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setHiddenThemes([]);
                          localStorage.removeItem('hiddenThemes');
                        }}
                        className="text-xs text-green-600 hover:text-green-700"
                      >
                        Restore all
                      </Button>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">Select a theme for the menu and welcome pages. Leave empty for default layout.</p>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div
                    onClick={() => setNewBranchTheme("")}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      newBranchTheme === "" 
                        ? 'ring-2 ring-gray-400 border-gray-400 bg-gray-50 dark:bg-gray-800' 
                        : 'border-border hover:border-gray-300'
                    }`}
                    data-testid="theme-none"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-4 h-4 rounded-full border-2 border-dashed border-gray-400" />
                      <div className="w-4 h-4 rounded-full border-2 border-dashed border-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">No Theme</p>
                  </div>
                  {themeList
                    .filter(theme => showAllThemes || !hiddenThemes.includes(theme.id))
                    .map((theme) => (
                    <div
                      key={theme.id}
                      className={`relative group p-3 rounded-lg border cursor-pointer transition-all ${
                        newBranchTheme === theme.id 
                          ? 'ring-2 ring-purple-500 border-purple-500' 
                          : hiddenThemes.includes(theme.id)
                          ? 'border-red-300 bg-red-50/50 dark:bg-red-950/20 opacity-60'
                          : 'border-border hover:border-purple-300'
                      }`}
                      style={{
                        background: newBranchTheme === theme.id 
                          ? `linear-gradient(135deg, ${theme.colors.primary}15, ${theme.colors.secondary}15)`
                          : undefined
                      }}
                      data-testid={`theme-${theme.id}`}
                    >
                      <div onClick={() => setNewBranchTheme(theme.id)} className="cursor-pointer">
                        <div className="flex items-center gap-1 mb-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: theme.colors.primary }}
                          />
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: theme.colors.secondary }}
                          />
                          {theme.colors.accent && (
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: theme.colors.accent }}
                            />
                          )}
                          {theme.colors.gradient1 && (
                            <>
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: theme.colors.gradient1 }}
                              />
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: theme.colors.gradient2 }}
                              />
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: theme.colors.gradient3 }}
                              />
                            </>
                          )}
                        </div>
                        <p className="text-xs font-medium truncate">{theme.name}</p>
                        {theme.effects && (
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {theme.effects.glassmorphism && <span className="text-[9px] px-1 py-0.5 bg-purple-100 dark:bg-purple-900 rounded text-purple-600 dark:text-purple-300">Glass</span>}
                            {theme.effects.neonGlow && <span className="text-[9px] px-1 py-0.5 bg-pink-100 dark:bg-pink-900 rounded text-pink-600 dark:text-pink-300">Glow</span>}
                            {theme.effects.shadow3d && <span className="text-[9px] px-1 py-0.5 bg-blue-100 dark:bg-blue-900 rounded text-blue-600 dark:text-blue-300">3D</span>}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (hiddenThemes.includes(theme.id)) {
                            const newHidden = hiddenThemes.filter(id => id !== theme.id);
                            setHiddenThemes(newHidden);
                            localStorage.setItem('hiddenThemes', JSON.stringify(newHidden));
                          } else {
                            const newHidden = [...hiddenThemes, theme.id];
                            setHiddenThemes(newHidden);
                            localStorage.setItem('hiddenThemes', JSON.stringify(newHidden));
                            if (newBranchTheme === theme.id) {
                              setNewBranchTheme("");
                            }
                          }
                        }}
                        className={`absolute top-1 right-1 p-1 rounded-full transition-all ${
                          hiddenThemes.includes(theme.id)
                            ? 'bg-green-500 text-white hover:bg-green-600'
                            : 'bg-red-500/0 group-hover:bg-red-500 text-transparent group-hover:text-white'
                        }`}
                        data-testid={`delete-theme-${theme.id}`}
                      >
                        {hiddenThemes.includes(theme.id) ? (
                          <Plus className="h-3 w-3" />
                        ) : (
                          <X className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
                
                {newBranchTheme && (
                  <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
                    <p className="text-sm text-purple-700 dark:text-purple-300 flex items-center gap-2">
                      <Check className="h-4 w-4" />
                      Selected theme: <strong>{themeList.find(t => t.id === newBranchTheme)?.name}</strong>
                    </p>
                  </div>
                )}
              </div>

              <div className="border rounded-lg p-4 space-y-4 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30">
                <div className="flex items-center gap-2">
                  <Copy className="h-5 w-5 text-amber-500" />
                  <h3 className="font-semibold text-amber-600">Import Menu from Existing Branch</h3>
                </div>
                <p className="text-sm text-muted-foreground">Optionally copy all categories and menu items from an existing branch. Images will show placeholders until you upload new ones.</p>
                
                <Select value={newBranchSourceId} onValueChange={setNewBranchSourceId}>
                  <SelectTrigger data-testid="select-source-branch">
                    <SelectValue placeholder="Select a branch to copy menu from (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Start with empty menu</SelectItem>
                    {restaurants.map((r) => {
                      const itemCount = menuItems.filter(m => m.restaurantId === r.id).length;
                      const categoryCount = getBranchSpecificCategories(r.id).length;
                      return (
                        <SelectItem key={r.id} value={r.id}>
                          {r.name} ({itemCount} items, {categoryCount} categories)
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                
                {newBranchSourceId && newBranchSourceId !== "none" && (
                  <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                    <p className="text-sm text-amber-700 dark:text-amber-300 flex items-center gap-2">
                      <Check className="h-4 w-4" />
                      Menu will be copied from: <strong>{restaurants.find(r => r.id === newBranchSourceId)?.name}</strong>
                    </p>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { setIsAddRestaurantOpen(false); setNewBranchLogoUrl(""); setNewBranchTheme(""); setNewBranchSourceId(""); }}>Cancel</Button>
                <Button type="submit" disabled={createRestaurantMutation.isPending} data-testid="button-submit-restaurant">
                  {createRestaurantMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Branch
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Top Pagination Controls */}
      {totalBranchPages > 1 && (
        <div className="flex items-center justify-center gap-2 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setBranchesPage(p => Math.max(1, p - 1))}
            disabled={branchesPage === 1}
            data-testid="button-prev-page-top"
          >
            Previous
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalBranchPages }, (_, i) => i + 1).map(page => (
              <Button
                key={page}
                variant={branchesPage === page ? "default" : "outline"}
                size="sm"
                className={`w-9 ${branchesPage === page ? "bg-primary" : ""}`}
                onClick={() => setBranchesPage(page)}
                data-testid={`button-page-top-${page}`}
              >
                {page}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setBranchesPage(p => Math.min(totalBranchPages, p + 1))}
            disabled={branchesPage === totalBranchPages}
            data-testid="button-next-page-top"
          >
            Next
          </Button>
          <span className="text-sm text-muted-foreground ml-2">
            Showing {(branchesPage - 1) * BRANCHES_PER_PAGE + 1}-{Math.min(branchesPage * BRANCHES_PER_PAGE, filteredRestaurants.length)} of {filteredRestaurants.length} branches
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {paginatedRestaurants.map((restaurant) => (
          <Card key={restaurant.id} className="premium-card overflow-hidden border-0" data-testid={`card-restaurant-${restaurant.id}`}>
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
                <div className="flex gap-2">
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDuplicateDialog(restaurant)} title="Duplicate Branch" data-testid={`button-duplicate-restaurant-${restaurant.id}`}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => { 
                    setEditingRestaurant(restaurant); 
                    setEditLogoUrl(restaurant.logoUrl || ""); 
                    setEditBranchCurrency(restaurant.currency || "GBP");
                    setEditCardEnabled(restaurant.cardEnabled ?? false);
                    setEditVoiceAlertEnabled((restaurant as any).voiceAlertEnabled ?? true);
                    setEditVoiceAlertMessage((restaurant as any).voiceAlertMessage || "New order received");
                    setEditVoiceAlertRate(parseFloat((restaurant as any).voiceAlertRate) || 1.0);
                    setEditVoiceAlertPitch(parseFloat((restaurant as any).voiceAlertPitch) || 1.0);
                    setEditAlarmSound((restaurant as any).alarmSound || "alarm1");
                    const customDomain = (restaurant as any).customDomain || "";
                    if (customDomain.endsWith('.link24.online')) {
                      setEditDomainOption("link24");
                      setEditSubdomain(customDomain.replace('.link24.online', ''));
                      setEditCustomDomain("");
                    } else if (customDomain) {
                      setEditDomainOption("custom");
                      setEditSubdomain("");
                      setEditCustomDomain(customDomain);
                    } else {
                      setEditDomainOption("default");
                      setEditSubdomain("");
                      setEditCustomDomain("");
                    }
                  }} data-testid={`button-edit-restaurant-${restaurant.id}`}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteConfirm({ type: "restaurant", id: restaurant.id, name: restaurant.name })} data-testid={`button-delete-restaurant-${restaurant.id}`}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                <Badge variant={restaurant.status === "open" ? "default" : "secondary"} className={`badge-3d ${restaurant.status === "open" ? "bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg" : "bg-gradient-to-r from-gray-500 to-gray-600"}`}>
                  {restaurant.status === "open" ? "Open" : "Closed"}
                </Badge>
                <Badge variant="outline" className="badge-3d gap-1 border-blue-500/30 text-blue-400 bg-blue-500/10">
                  <DollarSign className="h-3 w-3" /> {getCurrencySymbol(restaurant.currency || "GBP")}{Number(restaurant.revenueToday).toFixed(2)} today
                </Badge>
                {(restaurant.stripeAccountId?.trim() || restaurant.stripePublishableKey?.trim() || restaurant.stripeSecretKey?.trim()) && (
                  <Badge variant="outline" className="badge-3d gap-1 text-purple-400 border-purple-500/30 bg-purple-500/10">
                    <CreditCard className="h-3 w-3" /> Stripe Connected
                  </Badge>
                )}
                {restaurant.themeKey && themes[restaurant.themeKey] && (
                  <Badge 
                    variant="outline" 
                    className="badge-3d gap-1"
                    style={{ 
                      borderColor: themes[restaurant.themeKey].colors.primary + '50',
                      color: themes[restaurant.themeKey].colors.primary,
                      backgroundColor: themes[restaurant.themeKey].colors.primary + '15'
                    }}
                    data-testid={`badge-theme-${restaurant.id}`}
                  >
                    <Sparkles className="h-3 w-3" /> {themes[restaurant.themeKey].name}
                  </Badge>
                )}
              </div>

              {restaurant.address && (
                <div className="bg-secondary/20 rounded-lg px-3 py-2 flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <p className="text-xs text-muted-foreground">{restaurant.address}</p>
                </div>
              )}

              <div className="bg-secondary/30 rounded-lg p-3 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  <LinkIcon className="h-3 w-3" /> GOOGLE BUSINESS LINKS
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Input readOnly value={restaurant.customDomain ? `https://${restaurant.customDomain}` : `${window.location.origin}/${restaurant.slug}/welcome`} className="h-8 text-xs bg-background" />
                    <Button size="icon" variant="secondary" className="h-8 w-8 shrink-0" onClick={() => copyToClipboard(restaurant.customDomain ? `https://${restaurant.customDomain}` : `${window.location.origin}/${restaurant.slug}/welcome`)}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Link href={`/dashboard/${restaurant.slug}`} className="flex-1">
                  <Button variant="outline" className="w-full gap-2 stat-card-3d bg-gradient-to-r from-emerald-500/10 to-teal-500/5 border-emerald-500/30 hover:border-emerald-500/50 hover:from-emerald-500/20 hover:to-teal-500/10 text-emerald-400 hover:text-emerald-300 relative" data-testid={`button-dashboard-${restaurant.id}`}>
                    <ExternalLink className="h-4 w-4" /> Dashboard
                    {pendingBookingCounts[restaurant.id] > 0 && (
                      <span className="absolute -top-2 -right-2 h-5 w-5 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse shadow-lg" style={{boxShadow: '0 0 10px rgba(245, 158, 11, 0.6)'}}>
                        {pendingBookingCounts[restaurant.id]}
                      </span>
                    )}
                  </Button>
                </Link>
                {restaurant.customDomain ? (
                  <a href={`https://${restaurant.customDomain}`} target="_blank" rel="noopener noreferrer" className="flex-1">
                    <Button variant="secondary" className="w-full gap-2 stat-card-3d bg-gradient-to-r from-blue-500/10 to-indigo-500/5 border border-blue-500/30 hover:border-blue-500/50 hover:from-blue-500/20 hover:to-indigo-500/10 text-blue-400 hover:text-blue-300" data-testid={`button-view-menu-${restaurant.id}`}>
                      <Globe className="h-4 w-4" /> View Menu
                    </Button>
                  </a>
                ) : (
                  <Link href={`/${restaurant.slug}/welcome`} className="flex-1">
                    <Button variant="secondary" className="w-full gap-2 stat-card-3d bg-gradient-to-r from-blue-500/10 to-indigo-500/5 border border-blue-500/30 hover:border-blue-500/50 hover:from-blue-500/20 hover:to-indigo-500/10 text-blue-400 hover:text-blue-300" data-testid={`button-view-menu-${restaurant.id}`}>
                      <Globe className="h-4 w-4" /> View Menu
                    </Button>
                  </Link>
                )}
              </div>
              <div className="mt-2">
                <Link href={`/admin-payments?branch=${encodeURIComponent(restaurant.name)}`}>
                  <Button variant="secondary" className="w-full gap-2 stat-card-3d bg-gradient-to-r from-purple-500/10 to-indigo-500/5 border border-purple-500/30 hover:border-purple-500/50 hover:from-purple-500/20 hover:to-indigo-500/10 text-purple-400 hover:text-purple-300" data-testid={`button-payment-apps-${restaurant.id}`}>
                    <CreditCard className="h-4 w-4" /> Payment Applications
                  </Button>
                </Link>
              </div>

              {/* Expandable Menu Management Section */}
              <div className="border-t pt-4 mt-4">
                <Button 
                  variant="ghost" 
                  className="w-full justify-between"
                  onClick={() => setExpandedRestaurant(expandedRestaurant === restaurant.id ? null : restaurant.id)}
                  data-testid={`button-expand-menu-${restaurant.id}`}
                >
                  <span className="flex items-center gap-2">
                    <UtensilsCrossed className="h-4 w-4" />
                    Manage Menu ({menuItems.filter(m => m.restaurantId === restaurant.id).length} items)
                  </span>
                  {expandedRestaurant === restaurant.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>

                {expandedRestaurant === restaurant.id && (
                  <div className="mt-4 space-y-4">
                    {/* Add Menu Item Button */}
                    <div className="flex justify-end">
                      <Button 
                        size="sm" 
                        onClick={() => setAddingMenuToRestaurant(restaurant.id)}
                        className="gap-2"
                        data-testid={`button-add-menu-item-${restaurant.id}`}
                      >
                        <Plus className="h-4 w-4" /> Add Menu Item
                      </Button>
                    </div>

                    {/* Add Menu Item Form */}
                    {addingMenuToRestaurant === restaurant.id && (
                      <div className="bg-secondary/20 rounded-lg p-4 space-y-4 border">
                        <div className="flex justify-between items-center">
                          <h4 className="font-semibold">Add New Menu Item</h4>
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { setAddingMenuToRestaurant(null); setNewMenuItemName(""); setNewMenuItemPrice(""); setNewMenuItemImage(""); }}>
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
                              data-testid="input-new-menu-name"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Price *</Label>
                            <Input 
                              value={newMenuItemPrice}
                              onChange={(e) => setNewMenuItemPrice(e.target.value)}
                              placeholder="5.99"
                              className="h-8"
                              data-testid="input-new-menu-price"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Category</Label>
                            <Select value={newMenuItemCategory} onValueChange={setNewMenuItemCategory}>
                              <SelectTrigger className="h-8" data-testid="select-new-menu-category">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {getCategoriesForBranch(restaurant.id || null).map((cat: { id: string; name: string; icon: string }) => (
                                  <SelectItem key={cat.id} value={cat.id}><CategoryIcon icon={cat.icon} /> {cat.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Image</Label>
                            <div className="flex gap-1">
                              <Input 
                                value={newMenuItemImage}
                                onChange={(e) => setNewMenuItemImage(e.target.value)}
                                placeholder="Image URL"
                                className="h-8"
                                data-testid="input-new-menu-image"
                              />
                              <div className="relative">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleNewMenuImageUpload}
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <Button type="button" variant="outline" size="sm" className="h-8" disabled={isUploadingNewMenuImage}>
                                  {isUploadingNewMenuImage ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
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
                              data-testid="input-new-menu-description"
                            />
                          </div>
                        </div>
                        <Button 
                          onClick={() => handleAddNewMenuItem(restaurant.id)}
                          className="w-full"
                          data-testid="button-submit-new-menu-item"
                        >
                          Add Item
                        </Button>
                      </div>
                    )}

                    {/* Menu Items List by Category */}
                    {allCategories.map((category: { id: string; name: string; icon: string; dbId?: string; restaurantId: string | null }) => {
                      const categoryItems = menuItems.filter(m => m.restaurantId === restaurant.id && m.category === category.id);
                      if (categoryItems.length === 0) return null;
                      
                      return (
                        <div key={category.id} className="space-y-2">
                          <h4 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                            <span>{category.icon}</span> {category.name}
                          </h4>
                          <div className="space-y-2">
                            {categoryItems.map(item => (
                              <div 
                                key={item.id} 
                                className="flex items-center gap-3 bg-secondary/20 rounded-lg p-2"
                                data-testid={`menu-item-row-${item.id}`}
                              >
                                {item.image && (
                                  <img src={item.image} alt={item.name} className="h-10 w-10 rounded object-cover" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm truncate">{item.name}</p>
                                  {item.description && (
                                    <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  {editingPrices[item.id] !== undefined ? (
                                    <div className="flex items-center gap-1">
                                      <span className="text-sm">{getCurrencySymbol(restaurant.currency || "GBP")}</span>
                                      <Input 
                                        value={editingPrices[item.id]}
                                        onChange={(e) => setEditingPrices(prev => ({ ...prev, [item.id]: e.target.value }))}
                                        className="h-7 w-20 text-sm"
                                        data-testid={`input-edit-price-${item.id}`}
                                      />
                                      <Button 
                                        size="icon" 
                                        variant="ghost" 
                                        className="h-7 w-7 text-green-600"
                                        onClick={() => handleInlinePriceUpdate(item)}
                                        data-testid={`button-save-price-${item.id}`}
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
                                      data-testid={`button-edit-price-${item.id}`}
                                    >
                                      {getCurrencySymbol(restaurant.currency || "GBP")}{item.price}
                                    </Button>
                                  )}
                                  <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    className="h-7 w-7 text-destructive hover:text-destructive"
                                    onClick={() => handleInlineDeleteMenuItem(item)}
                                    data-testid={`button-delete-menu-${item.id}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}

                    {menuItems.filter(m => m.restaurantId === restaurant.id).length === 0 && (
                      <div className="text-center py-6 text-muted-foreground">
                        <UtensilsCrossed className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No menu items yet</p>
                        <p className="text-xs">Click "Add Menu Item" to get started</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Tawa Image Manager - Only for Tawa restaurants */}
              {restaurant.themeKey === "tawa" && (
                <div className="border-t pt-4 mt-4">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-between"
                    onClick={() => setExpandedImageManager(expandedImageManager === restaurant.id ? null : restaurant.id)}
                    data-testid={`button-expand-images-${restaurant.id}`}
                  >
                    <span className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      Image Manager (Logo & Menu Images)
                    </span>
                    {expandedImageManager === restaurant.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>

                  {expandedImageManager === restaurant.id && (
                    <div className="mt-4 space-y-6">
                      {/* Restaurant Logo Section */}
                      <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-lg p-4 border border-orange-500/20">
                        <h4 className="font-semibold flex items-center gap-2 mb-3">
                          <Store className="h-4 w-4 text-orange-500" /> Restaurant Logo
                        </h4>
                        <div className="flex items-center gap-4">
                          <div className="w-20 h-20 rounded-xl bg-gray-800 flex items-center justify-center overflow-hidden border-2 border-orange-500/30">
                            {restaurant.logoUrl ? (
                              <img src={restaurant.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-3xl">🔥</span>
                            )}
                          </div>
                          <div className="flex-1 space-y-2">
                            <Input 
                              placeholder="Enter logo image URL"
                              value={tawaLogoUrl}
                              onChange={(e) => setTawaLogoUrl(e.target.value)}
                              className="h-9"
                              data-testid={`input-tawa-logo-${restaurant.id}`}
                            />
                            <Button 
                              size="sm" 
                              onClick={() => handleTawaLogoUpdate(restaurant)}
                              disabled={!tawaLogoUrl}
                              className="gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                              data-testid={`button-update-logo-${restaurant.id}`}
                            >
                              <Upload className="h-4 w-4" /> Update Logo
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Menu Item Images Section */}
                      <div className="space-y-3">
                        <h4 className="font-semibold flex items-center gap-2">
                          <Images className="h-4 w-4 text-blue-400" /> Menu Item Images
                        </h4>
                        <p className="text-xs text-muted-foreground">Click on any menu item to update its image</p>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[400px] overflow-y-auto p-1">
                          {menuItems.filter(m => m.restaurantId === restaurant.id).map(item => (
                            <div 
                              key={item.id}
                              className={`relative group rounded-lg overflow-hidden border cursor-pointer transition-all ${
                                editingMenuImage === item.id ? 'ring-2 ring-orange-500' : 'hover:border-orange-500/50'
                              }`}
                              onClick={() => {
                                if (editingMenuImage === item.id) {
                                  setEditingMenuImage(null);
                                  setNewMenuImageUrl("");
                                } else {
                                  setEditingMenuImage(item.id);
                                  setNewMenuImageUrl(item.image || "");
                                }
                              }}
                              data-testid={`image-card-${item.id}`}
                            >
                              <div className="aspect-square bg-gray-800">
                                {item.image ? (
                                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-4xl">🍽️</div>
                                )}
                              </div>
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                                <p className="text-xs font-medium text-white truncate">{item.name}</p>
                                <p className="text-xs text-gray-300">{getCurrencySymbol(restaurant.currency || "GBP")}{item.price}</p>
                              </div>
                              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="bg-white/90 rounded-full p-1">
                                  <Edit2 className="h-3 w-3 text-gray-800" />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Edit Image Form */}
                        {editingMenuImage && (
                          <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/30 space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium">
                                Editing: {menuItems.find(m => m.id === editingMenuImage)?.name}
                              </p>
                              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditingMenuImage(null)}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="flex gap-2">
                              <Input 
                                placeholder="Enter new image URL"
                                value={newMenuImageUrl}
                                onChange={(e) => setNewMenuImageUrl(e.target.value)}
                                className="h-9 flex-1"
                                data-testid={`input-menu-image-${editingMenuImage}`}
                              />
                              <Button 
                                size="sm" 
                                onClick={() => handleMenuImageUpdate(editingMenuImage)}
                                disabled={!newMenuImageUrl}
                                className="gap-1"
                                data-testid={`button-update-image-${editingMenuImage}`}
                              >
                                <Check className="h-4 w-4" /> Save
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Dashboard Features Control - Super Admin */}
              <div className="border-t pt-4 mt-4">
                <Button 
                  variant="ghost" 
                  className="w-full justify-between"
                  onClick={() => {
                    if (expandedDashboardSettings === restaurant.id) {
                      setExpandedDashboardSettings(null);
                    } else {
                      setExpandedDashboardSettings(restaurant.id);
                      loadDashboardSettings(restaurant.id);
                    }
                  }}
                  data-testid={`button-expand-dashboard-features-${restaurant.id}`}
                >
                  <span className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Dashboard Features
                  </span>
                  {expandedDashboardSettings === restaurant.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>

                {expandedDashboardSettings === restaurant.id && (
                  <div className="mt-4 space-y-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg p-4 border border-purple-500/20">
                    <div className="flex items-center gap-2 mb-3">
                      <Settings className="h-4 w-4 text-purple-400" />
                      <h4 className="font-semibold text-purple-300">Branch Dashboard Visibility</h4>
                    </div>
                    <p className="text-xs text-muted-foreground mb-4">
                      Control which sections are visible in this branch's dashboard. Disabled sections will be hidden from the branch admin.
                    </p>
                    
                    {dashboardSettings[restaurant.id] ? (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">💰</span>
                            <span className="text-sm font-medium">Promotions</span>
                          </div>
                          <Switch 
                            checked={dashboardSettings[restaurant.id]?.promotionsEnabled ?? true}
                            onCheckedChange={(checked) => handleToggleDashboardFeature(restaurant.id, 'promotionsEnabled', checked)}
                            data-testid={`switch-promotions-${restaurant.id}`}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">🎨</span>
                            <span className="text-sm font-medium">Branding</span>
                          </div>
                          <Switch 
                            checked={dashboardSettings[restaurant.id]?.brandingEnabled ?? true}
                            onCheckedChange={(checked) => handleToggleDashboardFeature(restaurant.id, 'brandingEnabled', checked)}
                            data-testid={`switch-branding-${restaurant.id}`}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">⏰</span>
                            <span className="text-sm font-medium">Hours</span>
                          </div>
                          <Switch 
                            checked={dashboardSettings[restaurant.id]?.hoursEnabled ?? true}
                            onCheckedChange={(checked) => handleToggleDashboardFeature(restaurant.id, 'hoursEnabled', checked)}
                            data-testid={`switch-hours-${restaurant.id}`}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">🖼️</span>
                            <span className="text-sm font-medium">Hero Gallery</span>
                          </div>
                          <Switch 
                            checked={dashboardSettings[restaurant.id]?.heroGalleryEnabled ?? true}
                            onCheckedChange={(checked) => handleToggleDashboardFeature(restaurant.id, 'heroGalleryEnabled', checked)}
                            data-testid={`switch-hero-gallery-${restaurant.id}`}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Branch Features Control - Super Admin controls actual capabilities */}
              <div className="border-t pt-4 mt-4">
                <Button 
                  variant="ghost" 
                  className="w-full justify-between"
                  onClick={() => {
                    if (expandedBranchFeatures === restaurant.id) {
                      setExpandedBranchFeatures(null);
                    } else {
                      setExpandedBranchFeatures(restaurant.id);
                      loadBranchFeatures(restaurant.id);
                    }
                  }}
                  data-testid={`button-expand-branch-features-${restaurant.id}`}
                >
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    Branch Features
                  </span>
                  {expandedBranchFeatures === restaurant.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>

                {expandedBranchFeatures === restaurant.id && (
                  <div className="mt-4 space-y-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg p-4 border border-green-500/20">
                    <div className="flex items-center gap-2 mb-3">
                      <ShieldCheck className="h-4 w-4 text-green-400" />
                      <h4 className="font-semibold text-green-300">Branch Capabilities</h4>
                    </div>
                    <p className="text-xs text-muted-foreground mb-4">
                      Control which features are available for this branch. Disabled features will be completely unavailable.
                    </p>
                    
                    {branchFeaturesState[restaurant.id] ? (
                      <div className="space-y-4">
                        {/* Core Features */}
                        <div>
                          <h5 className="text-xs font-semibold text-green-400 mb-2 uppercase tracking-wide">Core Features</h5>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">🛒</span>
                                <span className="text-sm font-medium">Online Ordering</span>
                              </div>
                              <Switch 
                                checked={branchFeaturesState[restaurant.id]?.onlineOrdering ?? true}
                                onCheckedChange={(checked) => handleToggleBranchFeature(restaurant.id, 'onlineOrdering', checked)}
                              />
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">📅</span>
                                <span className="text-sm font-medium">Table Booking</span>
                              </div>
                              <Switch 
                                checked={branchFeaturesState[restaurant.id]?.tableBooking ?? true}
                                onCheckedChange={(checked) => handleToggleBranchFeature(restaurant.id, 'tableBooking', checked)}
                              />
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">🚗</span>
                                <span className="text-sm font-medium">Delivery Tracking</span>
                              </div>
                              <Switch 
                                checked={branchFeaturesState[restaurant.id]?.deliveryTracking ?? true}
                                onCheckedChange={(checked) => handleToggleBranchFeature(restaurant.id, 'deliveryTracking', checked)}
                              />
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">🍽️</span>
                                <span className="text-sm font-medium">Dine-In Ordering</span>
                              </div>
                              <Switch 
                                checked={branchFeaturesState[restaurant.id]?.dineInOrdering ?? true}
                                onCheckedChange={(checked) => handleToggleBranchFeature(restaurant.id, 'dineInOrdering', checked)}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Staff Systems */}
                        <div>
                          <h5 className="text-xs font-semibold text-green-400 mb-2 uppercase tracking-wide">Staff Systems</h5>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">👨‍🍳</span>
                                <span className="text-sm font-medium">Kitchen Display</span>
                              </div>
                              <Switch 
                                checked={branchFeaturesState[restaurant.id]?.kitchenDisplay ?? true}
                                onCheckedChange={(checked) => handleToggleBranchFeature(restaurant.id, 'kitchenDisplay', checked)}
                              />
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">💳</span>
                                <span className="text-sm font-medium">EPOS System</span>
                              </div>
                              <Switch 
                                checked={branchFeaturesState[restaurant.id]?.eposSystem ?? true}
                                onCheckedChange={(checked) => handleToggleBranchFeature(restaurant.id, 'eposSystem', checked)}
                              />
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">🚚</span>
                                <span className="text-sm font-medium">Driver App</span>
                              </div>
                              <Switch 
                                checked={branchFeaturesState[restaurant.id]?.driverApp ?? true}
                                onCheckedChange={(checked) => handleToggleBranchFeature(restaurant.id, 'driverApp', checked)}
                              />
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">🧑‍🍳</span>
                                <span className="text-sm font-medium">Waiter App</span>
                              </div>
                              <Switch 
                                checked={branchFeaturesState[restaurant.id]?.waiterApp ?? false}
                                onCheckedChange={(checked) => handleToggleBranchFeature(restaurant.id, 'waiterApp', checked)}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Advanced Features */}
                        <div>
                          <h5 className="text-xs font-semibold text-green-400 mb-2 uppercase tracking-wide">Advanced Features</h5>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">📦</span>
                                <span className="text-sm font-medium">Supplier Ordering</span>
                              </div>
                              <Switch 
                                checked={branchFeaturesState[restaurant.id]?.supplierOrdering ?? false}
                                onCheckedChange={(checked) => handleToggleBranchFeature(restaurant.id, 'supplierOrdering', checked)}
                              />
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">📞</span>
                                <span className="text-sm font-medium">Telephone Ordering</span>
                              </div>
                              <Switch 
                                checked={branchFeaturesState[restaurant.id]?.telephoneOrdering ?? false}
                                onCheckedChange={(checked) => handleToggleBranchFeature(restaurant.id, 'telephoneOrdering', checked)}
                              />
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">⭐</span>
                                <span className="text-sm font-medium">Loyalty Program</span>
                              </div>
                              <Switch 
                                checked={branchFeaturesState[restaurant.id]?.loyaltyProgram ?? false}
                                onCheckedChange={(checked) => handleToggleBranchFeature(restaurant.id, 'loyaltyProgram', checked)}
                              />
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">🎁</span>
                                <span className="text-sm font-medium">Promotions</span>
                              </div>
                              <Switch 
                                checked={branchFeaturesState[restaurant.id]?.promotions ?? true}
                                onCheckedChange={(checked) => handleToggleBranchFeature(restaurant.id, 'promotions', checked)}
                              />
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">⚠️</span>
                                <span className="text-sm font-medium">Allergen Management</span>
                              </div>
                              <Switch 
                                checked={branchFeaturesState[restaurant.id]?.allergenManagement ?? true}
                                onCheckedChange={(checked) => handleToggleBranchFeature(restaurant.id, 'allergenManagement', checked)}
                              />
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">🌐</span>
                                <span className="text-sm font-medium">Multi-Language</span>
                              </div>
                              <Switch 
                                checked={branchFeaturesState[restaurant.id]?.multiLanguage ?? false}
                                onCheckedChange={(checked) => handleToggleBranchFeature(restaurant.id, 'multiLanguage', checked)}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin text-green-400" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination Controls */}
      {totalBranchPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setBranchesPage(p => Math.max(1, p - 1))}
            disabled={branchesPage === 1}
            data-testid="button-prev-page"
          >
            Previous
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalBranchPages }, (_, i) => i + 1).map(page => (
              <Button
                key={page}
                variant={branchesPage === page ? "default" : "outline"}
                size="sm"
                className={`w-9 ${branchesPage === page ? "bg-primary" : ""}`}
                onClick={() => setBranchesPage(page)}
                data-testid={`button-page-${page}`}
              >
                {page}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setBranchesPage(p => Math.min(totalBranchPages, p + 1))}
            disabled={branchesPage === totalBranchPages}
            data-testid="button-next-page"
          >
            Next
          </Button>
          <span className="text-sm text-muted-foreground ml-2">
            Showing {(branchesPage - 1) * BRANCHES_PER_PAGE + 1}-{Math.min(branchesPage * BRANCHES_PER_PAGE, filteredRestaurants.length)} of {filteredRestaurants.length} branches
          </span>
        </div>
      )}

      <Dialog open={!!editingRestaurant} onOpenChange={(open) => { if (!open) { setEditingRestaurant(null); updateRestaurantMutation.reset(); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="h-5 w-5" /> Edit Branch
            </DialogTitle>
            <DialogDescription>Update branch details and settings.</DialogDescription>
          </DialogHeader>
          {editingRestaurant && (
            <form onSubmit={handleUpdateRestaurant} className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Branch Name *</Label>
                  <Input id="edit-name" name="name" defaultValue={editingRestaurant.name} required data-testid="input-edit-restaurant-name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-address">Address *</Label>
                  <Input id="edit-address" name="address" defaultValue={editingRestaurant.address} required data-testid="input-edit-restaurant-address" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select name="status" defaultValue={editingRestaurant.status}>
                    <SelectTrigger data-testid="select-restaurant-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-currency">Currency</Label>
                  <Select name="currency" value={editBranchCurrency} onValueChange={setEditBranchCurrency}>
                    <SelectTrigger data-testid="select-edit-restaurant-currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((curr) => (
                        <SelectItem key={curr.code} value={curr.code}>
                          {curr.symbol} - {curr.name} ({curr.country})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-maps">Google Maps URL</Label>
                <Input id="edit-maps" name="googleMapsUrl" defaultValue={editingRestaurant.googleMapsUrl || ""} data-testid="input-edit-restaurant-maps" />
              </div>

              {/* Stripe Payment Configuration - Hide for Pakistan */}
              {editBranchCurrency !== "PKR" && (
                <div className="border rounded-lg p-4 space-y-4 bg-secondary/10">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Payment Configuration (Stripe)</h3>
                  </div>
                  <div className="space-y-2">
                    <Label>Stripe Account ID</Label>
                    <Input name="stripeAccountId" defaultValue={editingRestaurant.stripeAccountId || ""} placeholder="acct_..." data-testid="input-edit-restaurant-stripe" />
                  </div>
                  <div className="space-y-2">
                    <Label>Stripe Publishable Key</Label>
                    <Input name="stripePublishableKey" defaultValue={editingRestaurant.stripePublishableKey || ""} placeholder="pk_live_..." data-testid="input-edit-restaurant-stripe-pk" />
                  </div>
                  <div className="space-y-2">
                    <Label>Stripe Secret Key</Label>
                    <Input name="stripeSecretKey" type="password" defaultValue={editingRestaurant.stripeSecretKey || ""} placeholder="sk_live_..." data-testid="input-edit-restaurant-stripe-sk" />
                    <p className="text-xs text-muted-foreground">Enter API keys from your customer's Stripe dashboard.</p>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 mt-3">
                    <div>
                      <Label className="text-sm font-semibold">Enable Card Payments</Label>
                      <p className="text-xs text-muted-foreground mt-0.5">When enabled, customers can pay by card</p>
                    </div>
                    <Switch
                      checked={editCardEnabled}
                      onCheckedChange={setEditCardEnabled}
                      data-testid="switch-edit-card-enabled"
                    />
                  </div>
                  {editCardEnabled ? (
                    <Badge className="bg-green-500/20 text-green-600 border-green-500/30">Card Payments Enabled</Badge>
                  ) : (
                    <Badge variant="outline" className="text-orange-600 border-orange-300">Cash Only</Badge>
                  )}
                </div>
              )}

              {/* Alternative Card Reader APIs - Super Admin Only */}
              {editBranchCurrency === "GBP" && (
                <div className="border rounded-lg p-4 space-y-4 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-amber-500" />
                    <h3 className="font-semibold text-amber-600">Alternative Card Readers (Optional)</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">If the branch uses SumUp, Square, or Zettle, add their API keys here.</p>
                  
                  {/* SumUp */}
                  <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                    <h4 className="font-medium text-blue-600 mb-2 flex items-center gap-2">
                      <span className="w-6 h-6 rounded bg-blue-600 text-white text-xs flex items-center justify-center font-bold">S</span>
                      SumUp
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">API Key</Label>
                        <Input name="sumupApiKey" type="password" defaultValue={(editingRestaurant as any).sumupApiKey || ""} placeholder="sup_sk_..." data-testid="input-edit-sumup-api" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Merchant Code</Label>
                        <Input name="sumupMerchantCode" defaultValue={(editingRestaurant as any).sumupMerchantCode || ""} placeholder="MXXXXXXXX" data-testid="input-edit-sumup-merchant" />
                      </div>
                    </div>
                  </div>

                  {/* Square */}
                  <div className="p-3 rounded-lg bg-slate-500/5 border border-slate-500/20">
                    <h4 className="font-medium text-slate-600 mb-2 flex items-center gap-2">
                      <span className="w-6 h-6 rounded bg-slate-700 text-white text-xs flex items-center justify-center font-bold">▢</span>
                      Square
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Access Token</Label>
                        <Input name="squareAccessToken" type="password" defaultValue={(editingRestaurant as any).squareAccessToken || ""} placeholder="EAAAl..." data-testid="input-edit-square-token" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Location ID</Label>
                        <Input name="squareLocationId" defaultValue={(editingRestaurant as any).squareLocationId || ""} placeholder="LXXXXXXXX" data-testid="input-edit-square-location" />
                      </div>
                    </div>
                  </div>

                  {/* Zettle */}
                  <div className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/20">
                    <h4 className="font-medium text-purple-600 mb-2 flex items-center gap-2">
                      <span className="w-6 h-6 rounded bg-purple-600 text-white text-xs flex items-center justify-center font-bold">Z</span>
                      Zettle (PayPal)
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">API Key</Label>
                        <Input name="zettleApiKey" type="password" defaultValue={(editingRestaurant as any).zettleApiKey || ""} placeholder="zettle_..." data-testid="input-edit-zettle-api" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Merchant ID</Label>
                        <Input name="zettleMerchantId" defaultValue={(editingRestaurant as any).zettleMerchantId || ""} placeholder="MXXXXXXXX" data-testid="input-edit-zettle-merchant" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="border rounded-lg p-4 space-y-4 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border-purple-500/30">
                <div className="flex items-center gap-2">
                  <Building className="h-5 w-5 text-purple-500" />
                  <h3 className="font-semibold text-purple-600">Bank Transfer Payment</h3>
                </div>
                <p className="text-xs text-muted-foreground">Add bank details so customers can pay directly to the branch account. A QR code will be auto-generated at checkout.</p>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Bank Name</Label>
                      <Input name="bankName" defaultValue={(editingRestaurant as any).bankName || ""} placeholder="e.g. Halifax, Barclays, Lloyds..." data-testid="input-edit-bank-name" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Account Name</Label>
                      <Input name="bankAccountName" defaultValue={(editingRestaurant as any).bankAccountName || ""} placeholder="e.g. Mujeeb Sardar" data-testid="input-edit-bank-account-name" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Sort Code</Label>
                      <Input name="bankSortCode" defaultValue={(editingRestaurant as any).bankSortCode || ""} placeholder="e.g. 11-13-16" data-testid="input-edit-bank-sort-code" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Account Number</Label>
                      <Input name="bankAccountNumber" defaultValue={(editingRestaurant as any).bankAccountNumber || ""} placeholder="e.g. 00065300" data-testid="input-edit-bank-account-number" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">IBAN (optional, for international transfers)</Label>
                    <Input name="bankIban" defaultValue={(editingRestaurant as any).bankIban || ""} placeholder="e.g. GB29 NWBK 6016 1331 9268 19" data-testid="input-edit-bank-iban" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Video Tutorial URL (optional)</Label>
                    <Input name="bankTransferVideoUrl" defaultValue={(editingRestaurant as any).bankTransferVideoUrl || ""} placeholder="https://youtube.com/watch?v=..." data-testid="input-edit-bank-video-url" />
                  </div>
                </div>
              </div>

              {/* Pakistan Payment Methods - EasyPaisa & JazzCash */}
              {editBranchCurrency === "PKR" && (
                <div className="border rounded-lg p-4 space-y-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-green-500" />
                    <h3 className="font-semibold text-green-600">Pakistan Payment Methods</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">Add your EasyPaisa and JazzCash account details for Pakistani customers.</p>
                  
                  <div className="space-y-4">
                    <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                      <h4 className="font-medium text-green-600 mb-2 flex items-center gap-2">
                        <span className="w-6 h-6 rounded bg-green-500 text-white text-xs flex items-center justify-center font-bold">EP</span>
                        EasyPaisa
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Account Number</Label>
                          <Input name="easypaisaAccountNumber" defaultValue={(editingRestaurant as any).easypaisaAccountNumber || ""} placeholder="03XX-XXXXXXX" data-testid="input-edit-easypaisa-number" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Account Name</Label>
                          <Input name="easypaisaAccountName" defaultValue={(editingRestaurant as any).easypaisaAccountName || ""} placeholder="Account holder name" data-testid="input-edit-easypaisa-name" />
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                      <h4 className="font-medium text-red-600 mb-2 flex items-center gap-2">
                        <span className="w-6 h-6 rounded bg-red-500 text-white text-xs flex items-center justify-center font-bold">JC</span>
                        JazzCash
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Account Number</Label>
                          <Input name="jazzcashAccountNumber" defaultValue={(editingRestaurant as any).jazzcashAccountNumber || ""} placeholder="03XX-XXXXXXX" data-testid="input-edit-jazzcash-number" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Account Name</Label>
                          <Input name="jazzcashAccountName" defaultValue={(editingRestaurant as any).jazzcashAccountName || ""} placeholder="Account holder name" data-testid="input-edit-jazzcash-name" />
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                      <h4 className="font-medium text-blue-600 mb-2 flex items-center gap-2">
                        <span className="w-6 h-6 rounded bg-blue-600 text-white text-xs flex items-center justify-center font-bold">HBL</span>
                        HBL Bank
                      </h4>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Account Number</Label>
                          <Input name="hblAccountNumber" defaultValue={(editingRestaurant as any).hblAccountNumber || ""} placeholder="Account number" data-testid="input-edit-hbl-number" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Account Name</Label>
                          <Input name="hblAccountName" defaultValue={(editingRestaurant as any).hblAccountName || ""} placeholder="Account holder name" data-testid="input-edit-hbl-name" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">IBAN</Label>
                          <Input name="hblIban" defaultValue={(editingRestaurant as any).hblIban || ""} placeholder="PK..." data-testid="input-edit-hbl-iban" />
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/20">
                      <h4 className="font-medium text-purple-600 mb-2 flex items-center gap-2">
                        <span className="w-6 h-6 rounded bg-purple-600 text-white text-xs flex items-center justify-center font-bold">UBL</span>
                        UBL Bank
                      </h4>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Account Number</Label>
                          <Input name="ublAccountNumber" defaultValue={(editingRestaurant as any).ublAccountNumber || ""} placeholder="Account number" data-testid="input-edit-ubl-number" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Account Name</Label>
                          <Input name="ublAccountName" defaultValue={(editingRestaurant as any).ublAccountName || ""} placeholder="Account holder name" data-testid="input-edit-ubl-name" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">IBAN</Label>
                          <Input name="ublIban" defaultValue={(editingRestaurant as any).ublIban || ""} placeholder="PK..." data-testid="input-edit-ubl-iban" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="border rounded-lg p-4 space-y-4 bg-secondary/10">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Branch Login Credentials</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Username</Label>
                    <Input name="loginUsername" defaultValue={editingRestaurant.loginUsername || ""} placeholder="branch_username" data-testid="input-edit-restaurant-username" />
                  </div>
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Input name="loginPassword" type="password" defaultValue={editingRestaurant.loginPassword || ""} placeholder="Leave empty to keep current" data-testid="input-edit-restaurant-password" />
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4 space-y-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/30">
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-blue-500" />
                  <h3 className="font-semibold text-blue-600">Branch Web Address</h3>
                </div>
                <p className="text-xs text-muted-foreground">Choose how customers will access this branch's menu online.</p>
                
                <div className="space-y-3">
                  <div 
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${editDomainOption === "default" ? "bg-green-50 dark:bg-green-950/30 border-green-500 ring-2 ring-green-500" : "bg-secondary/50 border-border hover:border-green-300"}`}
                    onClick={() => setEditDomainOption("default")}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${editDomainOption === "default" ? "border-green-500" : "border-muted-foreground"}`}>
                        {editDomainOption === "default" && <div className="w-2 h-2 rounded-full bg-green-500" />}
                      </div>
                      <div className="flex-1">
                        <Label className="text-sm font-medium cursor-pointer">Use Default App URL</Label>
                        <p className="text-xs text-muted-foreground">Customer accesses via your main app URL with branch name</p>
                        <p className="text-xs font-mono text-green-600 dark:text-green-400 mt-1">yourapp.replit.app/menu/{editingRestaurant.slug}</p>
                      </div>
                    </div>
                  </div>

                  <div 
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${editDomainOption === "link24" ? "bg-blue-50 dark:bg-blue-950/30 border-blue-500 ring-2 ring-blue-500" : "bg-secondary/50 border-border hover:border-blue-300"}`}
                    onClick={() => setEditDomainOption("link24")}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${editDomainOption === "link24" ? "border-blue-500" : "border-muted-foreground"}`}>
                        {editDomainOption === "link24" && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                      </div>
                      <div className="flex-1">
                        <Label className="text-sm font-medium cursor-pointer">Use Your link24.online Subdomain</Label>
                        <p className="text-xs text-muted-foreground">Give them a professional subdomain - no setup needed by customer!</p>
                      </div>
                    </div>
                    {editDomainOption === "link24" && (
                      <div className="mt-3 ml-7 flex items-center gap-2 bg-white dark:bg-gray-900 rounded px-3 py-2 border">
                        <Input 
                          value={editSubdomain}
                          onChange={(e) => setEditSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                          placeholder="branchname" 
                          className="border-0 p-0 h-auto focus-visible:ring-0 flex-1"
                          data-testid="input-edit-subdomain-prefix"
                        />
                        <span className="text-muted-foreground font-mono text-sm">.link24.online</span>
                      </div>
                    )}
                  </div>

                  <div 
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${editDomainOption === "custom" ? "bg-purple-50 dark:bg-purple-950/30 border-purple-500 ring-2 ring-purple-500" : "bg-secondary/50 border-border hover:border-purple-300"}`}
                    onClick={() => setEditDomainOption("custom")}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${editDomainOption === "custom" ? "border-purple-500" : "border-muted-foreground"}`}>
                        {editDomainOption === "custom" && <div className="w-2 h-2 rounded-full bg-purple-500" />}
                      </div>
                      <div className="flex-1">
                        <Label className="text-sm font-medium cursor-pointer">Customer's Own Domain</Label>
                        <p className="text-xs text-muted-foreground">Customer uses their own domain (they must configure their DNS)</p>
                      </div>
                    </div>
                    {editDomainOption === "custom" && (
                      <div className="mt-3 ml-7">
                        <Input 
                          value={editCustomDomain}
                          onChange={(e) => setEditCustomDomain(e.target.value)}
                          placeholder="e.g. pizzapalace.com" 
                          data-testid="input-edit-custom-domain"
                        />
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">Customer must point their domain DNS to your app</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4 space-y-4 bg-secondary/10">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Branch Logo</h3>
                </div>
                <p className="text-sm text-muted-foreground">Upload your restaurant logo (PNG, JPG, SVG, GIF). Displayed in header and footer.</p>
                <div className="flex gap-4 items-start">
                  {editLogoUrl && (
                    <div className="relative shrink-0">
                      <img src={editLogoUrl} alt="Logo preview" className="h-20 w-20 object-contain rounded-lg border bg-white p-1" />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6"
                        onClick={() => setEditLogoUrl("")}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  <div className="flex-1 space-y-2">
                    <div className="flex gap-2 items-center">
                      <Input
                        type="text"
                        placeholder="Enter logo URL or upload..."
                        value={editLogoUrl}
                        onChange={(e) => setEditLogoUrl(e.target.value)}
                        className="flex-1"
                        data-testid="input-edit-logo-url"
                      />
                      <span className="text-muted-foreground text-sm">or</span>
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/gif"
                          onChange={handleLogoUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          data-testid="input-edit-logo-file"
                        />
                        <Button type="button" variant="outline" size="sm" disabled={isUploadingLogo}>
                          {isUploadingLogo ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-1" /> Upload
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingRestaurant(null)}>Cancel</Button>
                <Button 
                  type="submit" 
                  disabled={updateRestaurantMutation.isPending} 
                  data-testid="button-save-restaurant"
                  className={updateRestaurantMutation.isSuccess ? "bg-green-600 hover:bg-green-700" : ""}
                >
                  {updateRestaurantMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {updateRestaurantMutation.isSuccess ? (
                    <>
                      <Check className="mr-2 h-4 w-4" /> Saved!
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Duplicate Branch Dialog */}
      <Dialog key={duplicatingRestaurant?.id || 'no-restaurant'} open={!!duplicatingRestaurant} onOpenChange={(open) => !open && setDuplicatingRestaurant(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Copy className="h-5 w-5" /> Duplicate Branch
            </DialogTitle>
            <DialogDescription>
              Create a new branch by copying everything from the source branch below.
            </DialogDescription>
          </DialogHeader>
          
          {/* Source Restaurant Info - Prominent Display */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-4 text-white shadow-lg">
            <div className="flex items-center gap-4">
              {duplicatingRestaurant?.logoUrl ? (
                <div className="h-16 w-16 rounded-lg bg-white p-1 flex items-center justify-center shrink-0">
                  <img src={duplicatingRestaurant.logoUrl} alt="Source Logo" className="max-h-full max-w-full object-contain" />
                </div>
              ) : (
                <div className="h-16 w-16 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                  <Store className="h-8 w-8 text-white" />
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-white/80">Copying From:</p>
                <h3 className="text-xl font-bold">{duplicatingRestaurant?.name}</h3>
                <p className="text-sm text-white/80 flex items-center gap-1 mt-1">
                  <MapPin className="h-3 w-3" /> {duplicatingRestaurant?.address}
                </p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-white/20 text-xs text-white/70">
              This will copy: menu items, toppings, gallery images, hero images, promotions, theme settings, and operating hours
            </div>
          </div>
          
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>New Branch Name *</Label>
                <Input 
                  value={duplicateName}
                  onChange={(e) => setDuplicateName(e.target.value)}
                  placeholder="Enter new branch name"
                  data-testid="input-duplicate-name"
                />
                {duplicateName && (
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded border border-emerald-200 dark:border-emerald-800">
                    <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">
                      Menu URL: <span className="font-mono">link24.online/{duplicateName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}</span>
                    </p>
                  </div>
                )}
                {!duplicateName && (
                  <p className="text-xs text-muted-foreground">This will also be used to create the URL slug</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Tagline / Subtitle</Label>
                <Input 
                  value={duplicateTagline}
                  onChange={(e) => setDuplicateTagline(e.target.value)}
                  placeholder="e.g. Indian Sweet Shop"
                  data-testid="input-duplicate-tagline"
                />
                <p className="text-xs text-muted-foreground">Appears below the branch name on menu page</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cuisine Type</Label>
                <Input 
                  value={duplicateCuisineType}
                  onChange={(e) => setDuplicateCuisineType(e.target.value)}
                  placeholder="e.g. Chicken • Comfort food • American • Wings"
                  data-testid="input-duplicate-cuisine"
                />
                <p className="text-xs text-muted-foreground">Appears after rating on menu page</p>
              </div>
              <div className="space-y-2">
                <Label>Rating</Label>
                <Input 
                  value={duplicateRating}
                  onChange={(e) => setDuplicateRating(e.target.value)}
                  placeholder="e.g. 4.6"
                  data-testid="input-duplicate-rating"
                />
                <p className="text-xs text-muted-foreground">Star rating (1.0 - 5.0)</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Address</Label>
                <Input 
                  value={duplicateAddress}
                  onChange={(e) => setDuplicateAddress(e.target.value)}
                  placeholder="e.g. 456 Oxford Road, Manchester"
                  data-testid="input-duplicate-address"
                />
                <p className="text-xs text-muted-foreground">Leave empty to keep source address</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input 
                  value={duplicatePhone}
                  onChange={(e) => setDuplicatePhone(e.target.value)}
                  placeholder="e.g. 0121 123 4567"
                  data-testid="input-duplicate-phone"
                />
                <p className="text-xs text-muted-foreground">Leave empty to keep source phone</p>
              </div>
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input 
                  type="email"
                  value={duplicateEmail}
                  onChange={(e) => setDuplicateEmail(e.target.value)}
                  placeholder="e.g. newbranch@example.com"
                  data-testid="input-duplicate-email"
                />
                <p className="text-xs text-muted-foreground">Leave empty to keep source email</p>
              </div>
            </div>

            <div className="border rounded-lg p-4 space-y-4 bg-secondary/10">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Branch Logo</h3>
              </div>
              <p className="text-sm text-muted-foreground">Keep the same logo or upload a new one for this branch.</p>
              
              {duplicateLogoUrl && (
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-lg border bg-white p-1 flex items-center justify-center">
                    <img src={duplicateLogoUrl} alt="Logo preview" className="max-h-full max-w-full object-contain" />
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setDuplicateLogoUrl("")}>
                    <X className="h-4 w-4 mr-1" /> Remove
                  </Button>
                </div>
              )}
              
              <div className="flex gap-2">
                <Input 
                  placeholder="Enter logo URL..." 
                  value={duplicateLogoUrl}
                  onChange={(e) => setDuplicateLogoUrl(e.target.value)}
                  data-testid="input-duplicate-logo-url"
                />
                <div className="relative">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/gif"
                    onChange={handleDuplicateLogoUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    data-testid="input-duplicate-logo-file"
                  />
                  <Button type="button" variant="outline" size="sm" disabled={isUploadingDuplicateLogo}>
                    {isUploadingDuplicateLogo ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-1" /> Upload
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4 space-y-4 bg-secondary/10">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Theme Selection</h3>
              </div>
              <div className="space-y-2">
                <Label>Branch Theme</Label>
                <Select value={duplicateTheme} onValueChange={(val) => setDuplicateTheme(val === "keep-original" ? "" : val)}>
                  <SelectTrigger data-testid="select-duplicate-theme">
                    <SelectValue placeholder="Keep original theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="keep-original">Keep original theme ({duplicatingRestaurant?.themeKey || 'classic'})</SelectItem>
                    {themeList.map((theme) => (
                      <SelectItem key={theme.id} value={theme.id}>
                        {theme.name} - {theme.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Choose a different theme for the new branch or keep the original.</p>
              </div>
            </div>

            <div className="border rounded-lg p-4 space-y-4 bg-secondary/10">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Payment Configuration</h3>
              </div>
              <div className="space-y-2">
                <Label>Stripe Account ID</Label>
                <Input 
                  value={duplicateStripeId}
                  onChange={(e) => setDuplicateStripeId(e.target.value)}
                  placeholder="acct_..."
                  data-testid="input-duplicate-stripe"
                />
                <p className="text-xs text-muted-foreground">Enter a new Stripe account ID for this branch's payments.</p>
              </div>
            </div>

            <div className="border rounded-lg p-4 space-y-4 bg-secondary/10">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Branch Login Credentials</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Username</Label>
                  <Input 
                    value={duplicateUsername}
                    onChange={(e) => setDuplicateUsername(e.target.value)}
                    placeholder="branch_username"
                    data-testid="input-duplicate-username"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input 
                    type="password"
                    value={duplicatePassword}
                    onChange={(e) => setDuplicatePassword(e.target.value)}
                    placeholder="••••••••"
                    data-testid="input-duplicate-password"
                  />
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">What will be copied:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>All menu items ({menuItems.filter(m => m.restaurantId === duplicatingRestaurant?.id).length} items)</li>
                <li>All gallery images</li>
                <li>All menu highlight images</li>
                <li>Google Maps URL (if set)</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDuplicatingRestaurant(null)}>
              Cancel
            </Button>
            <Button 
              onClick={handleDuplicateBranch} 
              disabled={isDuplicating || !duplicateName}
              data-testid="button-confirm-duplicate"
            >
              {isDuplicating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Duplicate Branch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  const renderMenus = () => (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search menu items..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search-menu"
            />
          </div>
          <Select value={selectedRestaurantMenu} onValueChange={setSelectedRestaurantMenu}>
            <SelectTrigger className="w-[200px]" data-testid="select-filter-restaurant">
              <SelectValue placeholder="All Branches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              {restaurants.map(r => (
                <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[180px]" data-testid="select-filter-category">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {allCategories.map((cat: { id: string; name: string; icon: string }) => (
                <SelectItem key={cat.id} value={cat.id}><CategoryIcon icon={cat.icon} /> {cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2" data-testid="button-import-csv">
                <Upload className="h-4 w-4" /> Import CSV
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5" /> Import Menu from CSV
                </DialogTitle>
                <DialogDescription>
                  Upload a CSV file with columns: name, price, category, description, image
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Select Branch *</Label>
                  <Select value={csvUploadRestaurant} onValueChange={setCsvUploadRestaurant}>
                    <SelectTrigger data-testid="select-csv-restaurant">
                      <SelectValue placeholder="Select branch to import to" />
                    </SelectTrigger>
                    <SelectContent>
                      {restaurants.map(r => (
                        <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>CSV File *</Label>
                  <Input 
                    type="file" 
                    accept=".csv" 
                    onChange={handleCSVUpload}
                    disabled={!csvUploadRestaurant || isUploadingCSV}
                    data-testid="input-csv-file"
                  />
                  <p className="text-xs text-muted-foreground">
                    CSV format: name, price, category, description, image (URL)
                  </p>
                </div>
                {isUploadingCSV && (
                  <div className="flex items-center gap-2 text-primary">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Importing menu items...</span>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isAddMenuItemOpen} onOpenChange={(open) => {
            setIsAddMenuItemOpen(open);
            if (!open) {
              setAddMenuItemBranch("");
              setAddMenuItemCategory("");
              setMenuImageUrl("");
            }
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-gradient-to-r from-primary to-primary/80" data-testid="button-add-menu-item">
                <Plus className="h-4 w-4" /> Add Menu Item
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UtensilsCrossed className="h-5 w-5" /> Add New Menu Item
              </DialogTitle>
              <DialogDescription>Create a new item and assign it to a branch.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddMenuItem} className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="item-name">Item Name *</Label>
                  <Input id="item-name" name="name" placeholder="e.g. Classic Burger" required data-testid="input-menu-name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="item-price">Price (£) *</Label>
                  <Input id="item-price" name="price" type="number" step="0.01" placeholder="9.99" required data-testid="input-menu-price" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Branch *</Label>
                  <Select name="restaurantId" required value={addMenuItemBranch} onValueChange={(val) => {
                    setAddMenuItemBranch(val);
                    setAddMenuItemCategory("");
                  }}>
                    <SelectTrigger data-testid="select-menu-restaurant">
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {restaurants.map(r => (
                        <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Select name="category" required disabled={!addMenuItemBranch} value={addMenuItemCategory} onValueChange={setAddMenuItemCategory}>
                    <SelectTrigger data-testid="select-menu-category">
                      <SelectValue placeholder={addMenuItemBranch ? "Select category" : "Select branch first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {getCategoriesForBranch(addMenuItemBranch || null).map((cat: { id: string; name: string; icon: string }) => (
                        <SelectItem key={cat.id} value={cat.id}><CategoryIcon icon={cat.icon} /> {cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="item-desc">Description</Label>
                <Textarea id="item-desc" name="description" placeholder="Describe the item..." rows={2} data-testid="input-menu-description" />
              </div>

              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" /> Product Image
                </Label>
                
                <div className="flex gap-3">
                  <div className="flex-1 space-y-2">
                    <Label className="text-xs text-muted-foreground">Upload Photo</Label>
                    <Input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, false)}
                      disabled={isUploadingImage}
                      data-testid="input-menu-image-upload"
                    />
                  </div>
                  <div className="text-muted-foreground flex items-end pb-2">or</div>
                  <div className="flex-1 space-y-2">
                    <Label className="text-xs text-muted-foreground">Paste URL</Label>
                    <Input 
                      name="image" 
                      placeholder="https://example.com/image.jpg" 
                      value={menuImageUrl}
                      onChange={(e) => setMenuImageUrl(e.target.value)}
                      data-testid="input-menu-image" 
                    />
                  </div>
                </div>
                
                {menuImageUrl && (
                  <div className="relative h-24 w-24 rounded-lg overflow-hidden border">
                    <img src={menuImageUrl} alt="Preview" className="w-full h-full object-cover" />
                    <Button 
                      type="button" 
                      size="icon" 
                      variant="destructive" 
                      className="absolute top-1 right-1 h-5 w-5"
                      onClick={() => setMenuImageUrl("")}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                
                {isUploadingImage && (
                  <div className="flex items-center gap-2 text-primary">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Uploading image...</span>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { setIsAddMenuItemOpen(false); setMenuImageUrl(""); }}>Cancel</Button>
                <Button type="submit" disabled={createMenuItemMutation.isPending || isUploadingImage} data-testid="button-submit-menu-item">
                  {createMenuItemMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Item
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        Showing {filteredMenuItems.length} items
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredMenuItems.map((item) => {
          const restaurant = restaurants.find(r => r.id === item.restaurantId);
          return (
            <Card key={item.id} className="overflow-hidden group hover:shadow-lg transition-all" data-testid={`card-menu-item-${item.id}`}>
              <div className="relative h-32 bg-gradient-to-br from-gray-100 to-gray-50 overflow-hidden">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="h-10 w-10 text-gray-300" />
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-1">
                  <Button type="button" size="icon" variant="secondary" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => { setEditingMenuItem(item); setEditMenuCategory(item.category); }} data-testid={`button-edit-menu-${item.id}`}>
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button type="button" size="icon" variant="destructive" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setDeleteConfirm({ type: "menuItem", id: item.id, name: item.name })} data-testid={`button-delete-menu-${item.id}`}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                {!item.available && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Badge variant="destructive">Unavailable</Badge>
                  </div>
                )}
              </div>
              <CardContent className="p-3">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-semibold text-sm line-clamp-1">{item.name}</h3>
                  <span className="font-bold text-primary shrink-0">{getCurrencySymbol(restaurant?.currency || "GBP")}{Number(item.price).toFixed(2)}</span>
                </div>
                {item.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{item.description}</p>
                )}
                <div className="flex gap-1 flex-wrap">
                  <Badge variant="outline" className="text-[10px] capitalize">{item.category}</Badge>
                  {restaurant && (
                    <Badge variant="secondary" className="text-[10px]">{restaurant.name}</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );

  const renderBranchesCustomers = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Branches Customers
          </CardTitle>
          <CardDescription>
            View and manage customers registered at each branch
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-center">
            <Label>Select Branch:</Label>
            <Select value={selectedCustomerBranch} onValueChange={setSelectedCustomerBranch}>
              <SelectTrigger className="w-[300px]" data-testid="select-customer-branch">
                <SelectValue placeholder="Choose a branch..." />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                {restaurants.map(r => (
                  <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!selectedCustomerBranch ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg">Select a branch to view customers</p>
              <p className="text-sm">Choose a branch from the dropdown above</p>
            </div>
          ) : loadingBranchCustomers ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-5 w-5" />
                <span className="font-medium">Registered Customers ({branchCustomers.length})</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Customers who have registered via the menu page
              </p>

              {branchCustomers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border rounded-lg">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>No customers registered at this branch yet</p>
                  <p className="text-sm">Customers will appear here after they register on the menu page</p>
                </div>
              ) : (
                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-secondary/50">
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
                      {branchCustomers.map((customer: any) => (
                        <tr key={customer.id} className="border-b border-border/50 hover:bg-secondary/30">
                          <td className="p-3" data-testid={`admin-customer-name-${customer.id}`}>
                            {customer.name || <span className="text-muted-foreground italic">Not provided</span>}
                          </td>
                          <td className="p-3" data-testid={`admin-customer-phone-${customer.id}`}>
                            <a href={`tel:${customer.phone}`} className="text-primary hover:underline">
                              {customer.phone}
                            </a>
                          </td>
                          <td className="p-3" data-testid={`admin-customer-address-${customer.id}`}>
                            {customer.address || <span className="text-muted-foreground">-</span>}
                          </td>
                          <td className="p-3" data-testid={`admin-customer-work-address-${customer.id}`}>
                            {customer.workAddress || <span className="text-muted-foreground">-</span>}
                          </td>
                          <td className="p-3" data-testid={`admin-customer-city-${customer.id}`}>
                            {customer.city || <span className="text-muted-foreground">-</span>}
                          </td>
                          <td className="p-3" data-testid={`admin-customer-postcode-${customer.id}`}>
                            {customer.postcode || <span className="text-muted-foreground">-</span>}
                          </td>
                          <td className="p-3 text-muted-foreground" data-testid={`admin-customer-created-${customer.id}`}>
                            {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : '-'}
                          </td>
                          <td className="p-3 text-center" data-testid={`admin-customer-orders-${customer.id}`}>
                            <span className={`inline-flex items-center justify-center min-w-[28px] px-2 py-1 rounded-full text-xs font-medium ${
                              customer.orderCount > 0 
                                ? 'bg-green-500/20 text-green-600' 
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
                              data-testid={`button-admin-delete-customer-${customer.id}`}
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderGallery = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-2 items-center">
          <Select value={selectedGalleryRestaurant} onValueChange={setSelectedGalleryRestaurant}>
            <SelectTrigger className="w-[200px]" data-testid="select-gallery-restaurant">
              <SelectValue placeholder="Select branch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              {restaurants.map(r => (
                <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Dialog open={isAddGalleryImageOpen} onOpenChange={setIsAddGalleryImageOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-gallery-image">
              <Plus className="h-4 w-4 mr-2" /> Add Image
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Gallery Image</DialogTitle>
              <DialogDescription>
                Upload an image to show in the restaurant's landing page gallery carousel.
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                const restaurantId = formData.get("restaurantId") as string;
                
                if (!restaurantId) {
                  toast({ title: "Error", description: "Please select a branch", variant: "destructive" });
                  return;
                }
                
                if (!galleryImageUrl) {
                  toast({ title: "Error", description: "Please provide an image", variant: "destructive" });
                  return;
                }
                
                createGalleryImageMutation.mutate({
                  restaurantId,
                  imageUrl: galleryImageUrl,
                  title: galleryImageTitle || undefined,
                });
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label>Branch *</Label>
                <Select name="restaurantId" defaultValue={selectedGalleryRestaurant !== "all" ? selectedGalleryRestaurant : undefined}>
                  <SelectTrigger data-testid="select-new-gallery-restaurant">
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {restaurants.map(r => (
                      <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Image</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    type="text"
                    placeholder="Enter image URL or upload..."
                    value={galleryImageUrl}
                    onChange={(e) => setGalleryImageUrl(e.target.value)}
                    className="flex-1"
                    data-testid="input-gallery-image-url"
                  />
                  <span className="text-muted-foreground text-sm">or</span>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleGalleryImageUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      data-testid="input-gallery-image-file"
                    />
                    <Button type="button" variant="outline" size="sm" disabled={isUploadingGalleryImage}>
                      {isUploadingGalleryImage ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-1" /> Upload
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                {galleryImageUrl && (
                  <div className="mt-2 relative">
                    <img src={galleryImageUrl} alt="Preview" className="w-full h-40 object-cover rounded-lg" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => setGalleryImageUrl("")}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Title (Optional)</Label>
                <Input
                  placeholder="Enter a title for this image..."
                  value={galleryImageTitle}
                  onChange={(e) => setGalleryImageTitle(e.target.value)}
                  data-testid="input-gallery-title"
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => {
                  setIsAddGalleryImageOpen(false);
                  setGalleryImageUrl("");
                  setGalleryImageTitle("");
                }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createGalleryImageMutation.isPending || isUploadingGalleryImage} data-testid="button-save-gallery-image">
                  {createGalleryImageMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Image
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {allGalleryImages.length === 0 ? (
        <Card className="p-8 text-center">
          <Images className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2">No Gallery Images</h3>
          <p className="text-muted-foreground mb-4">Add images to display in the restaurant landing page gallery carousel.</p>
          <Button onClick={() => setIsAddGalleryImageOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Add Your First Image
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {allGalleryImages.map((image) => {
            const restaurant = restaurants.find(r => r.id === image.restaurantId);
            return (
              <Card key={image.id} className="overflow-hidden group" data-testid={`gallery-image-${image.id}`}>
                <div className="relative aspect-square">
                  <img
                    src={image.imageUrl}
                    alt={image.title || "Gallery image"}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteGalleryImageMutation.mutate(image.id)}
                      disabled={deleteGalleryImageMutation.isPending}
                      data-testid={`button-delete-gallery-${image.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="p-3">
                  {image.title && (
                    <p className="text-sm font-medium truncate">{image.title}</p>
                  )}
                  <p className="text-xs text-muted-foreground">{restaurant?.name || "Unknown"}</p>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );

  const handleSaveSchedule = () => {
    updatePlatformSettingsMutation.mutate({
      mondayOpen: operatingHours.monday.open,
      mondayClose: operatingHours.monday.close,
      mondayEnabled: operatingHours.monday.enabled,
      tuesdayOpen: operatingHours.tuesday.open,
      tuesdayClose: operatingHours.tuesday.close,
      tuesdayEnabled: operatingHours.tuesday.enabled,
      wednesdayOpen: operatingHours.wednesday.open,
      wednesdayClose: operatingHours.wednesday.close,
      wednesdayEnabled: operatingHours.wednesday.enabled,
      thursdayOpen: operatingHours.thursday.open,
      thursdayClose: operatingHours.thursday.close,
      thursdayEnabled: operatingHours.thursday.enabled,
      fridayOpen: operatingHours.friday.open,
      fridayClose: operatingHours.friday.close,
      fridayEnabled: operatingHours.friday.enabled,
      saturdayOpen: operatingHours.saturday.open,
      saturdayClose: operatingHours.saturday.close,
      saturdayEnabled: operatingHours.saturday.enabled,
      sundayOpen: operatingHours.sunday.open,
      sundayClose: operatingHours.sunday.close,
      sundayEnabled: operatingHours.sunday.enabled,
    });
  };

  const handleSaveBranchHours = () => {
    if (!selectedHoursBranch) {
      toast({ title: "Error", description: "Please select a branch first", variant: "destructive" });
      return;
    }
    updateRestaurantMutation.mutate({
      id: selectedHoursBranch,
      data: {
        deliveryHoursMonThu: branchHours.deliveryHoursMonThu,
        deliveryHoursFriSat: branchHours.deliveryHoursFriSat,
        deliveryHoursSun: branchHours.deliveryHoursSun,
        collectionHoursMonThu: branchHours.collectionHoursMonThu,
        collectionHoursFriSat: branchHours.collectionHoursFriSat,
        collectionHoursSun: branchHours.collectionHoursSun,
        deliveryRadiusType: deliveryRadius.deliveryRadiusType,
        deliveryRadiusMiles: deliveryRadius.deliveryRadiusMiles,
        restaurantLatitude: deliveryRadius.restaurantLatitude || null,
        restaurantLongitude: deliveryRadius.restaurantLongitude || null,
      },
    });
  };

  const handleSavePaymentSettings = () => {
    updatePlatformSettingsMutation.mutate({
      platformCommission: platformCommission,
    });
  };

  const handleSaveNotificationSettings = (sms: boolean, email: boolean) => {
    updatePlatformSettingsMutation.mutate({
      smsNotificationsEnabled: sms,
      emailDigestsEnabled: email,
    });
  };


  // Welcome Page Editor state
  const [selectedWelcomeBranch, setSelectedWelcomeBranch] = useState<string | null>(null);
  const [welcomeTagline, setWelcomeTagline] = useState("");
  const [welcomeCuisineType, setWelcomeCuisineType] = useState("");
  const selectedWelcomeBranchData = restaurants.find(r => r.id === selectedWelcomeBranch);
  const [editingWelcomeItem, setEditingWelcomeItem] = useState<string | null>(null);
  const [editWelcomeItemName, setEditWelcomeItemName] = useState("");
  const [editWelcomeItemImage, setEditWelcomeItemImage] = useState("");
  const [isUploadingWelcomeImage, setIsUploadingWelcomeImage] = useState(false);
  const welcomeImageInputRef = useRef<HTMLInputElement>(null);
  
  // Sync tagline and background settings when branch changes or data updates
  React.useEffect(() => {
    if (selectedWelcomeBranchData) {
      setWelcomeTagline(selectedWelcomeBranchData.tagline || "");
      setWelcomeCuisineType(selectedWelcomeBranchData.cuisineType || "");
      setWelcomeBgType((selectedWelcomeBranchData as any).welcomeBackgroundType || "gradient");
      setWelcomeBgImageUrl((selectedWelcomeBranchData as any).welcomeBackgroundImageUrl || "");
      setWelcomeBgVideoUrl((selectedWelcomeBranchData as any).welcomeBackgroundVideoUrl || "");
      setWelcomeGradientStart((selectedWelcomeBranchData as any).welcomeGradientStart || "#1a1a2e");
      setWelcomeGradientMiddle((selectedWelcomeBranchData as any).welcomeGradientMiddle || "");
      setWelcomeGradientEnd((selectedWelcomeBranchData as any).welcomeGradientEnd || "#16213e");
    }
  }, [selectedWelcomeBranch, selectedWelcomeBranchData]);

  // Data Recovery state
  const [selectedRecoveryBranch, setSelectedRecoveryBranch] = useState<string | null>(null);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreConfirmId, setRestoreConfirmId] = useState<string | null>(null);
  const [isSyncingProduction, setIsSyncingProduction] = useState(false);
  const [isResettingBranch, setIsResettingBranch] = useState(false);
  const [resetBranchSlug, setResetBranchSlug] = useState<string | null>(null);

  // Menu Import state
  const [menuImportTarget, setMenuImportTarget] = useState<string | null>(null);
  const [isImportingMenu, setIsImportingMenu] = useState(false);
  const [menuPdfFile, setMenuPdfFile] = useState<File | null>(null);
  const [categoryDisplayPosition, setCategoryDisplayPosition] = useState<"header" | "sidebar">("header");
  const [uploadedCategories, setUploadedCategories] = useState<string[]>([]);
  const menuPdfInputRef = useRef<HTMLInputElement>(null);
  
  // Paste Menu Import state
  const [pasteMenuText, setPasteMenuText] = useState("");
  const [parsedMenuItems, setParsedMenuItems] = useState<Array<{
    category: string;
    name: string;
    price: string;
    description: string;
    allergens: string[];
    tags: string[];
    imageUrl?: string;
  }>>([]);
  const [importMode, setImportMode] = useState<"pdf" | "paste">("paste");
  const [selectedItemForImage, setSelectedItemForImage] = useState<number | null>(null);

  // Known allergens list for detection
  const knownAllergens = [
    "Gluten", "Milk", "Eggs", "Fish", "Shellfish", "Tree Nuts", "Peanuts", 
    "Wheat", "Soy", "Sesame", "Celery", "Mustard", "Lupin", "Molluscs", "Sulphites"
  ];
  const knownTags = ["Vegetarian", "Vegan", "Hot", "Spicy", "Mild", "New", "Popular", "Chef's Special"];

  // Replace Menu, Categories state
  const [replaceTargetBranch, setReplaceTargetBranch] = useState<string | null>(null);
  const [isReplacingMenu, setIsReplacingMenu] = useState(false);
  const [replaceMode, setReplaceMode] = useState<"categories" | "items" | "all">("all");
  const [appendMode, setAppendMode] = useState(true); // true = add to existing, false = replace all
  const [pasteCategoriesText, setPasteCategoriesText] = useState("");
  const [pasteItemsText, setPasteItemsText] = useState("");
  const [parsedCategories, setParsedCategories] = useState<string[]>([]);
  const [parsedReplaceItems, setParsedReplaceItems] = useState<Array<{
    category: string;
    name: string;
    price: string;
    description: string;
    allergens: string[];
    tags: string[];
  }>>([]);
  const [selectedReplaceCategory, setSelectedReplaceCategory] = useState<string>("");
  const [pasteAllText, setPasteAllText] = useState("");
  const [parsedAllData, setParsedAllData] = useState<{
    categories: string[];
    items: Array<{ category: string; name: string; price: string; description: string; allergens: string[]; tags: string[]; imageUrl?: string }>;
  }>({ categories: [], items: [] });
  const [selectedMenuSection, setSelectedMenuSection] = useState<string>("all");
  const [pastedImages, setPastedImages] = useState<Array<{filename: string, url: string}>>([]);
  const [pasteAllImages, setPasteAllImages] = useState<Array<{filename: string, url: string}>>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [isUploadingAllImages, setIsUploadingAllImages] = useState(false);
  const [selectedAllItemForImage, setSelectedAllItemForImage] = useState<number | null>(null);
  const pasteAreaRef = useRef<HTMLDivElement>(null);
  
  // Bulk Images State
  const [bulkImagesBranch, setBulkImagesBranch] = useState<string>("");
  const [bulkImagesCategory, setBulkImagesCategory] = useState<string>("");
  const [bulkImages, setBulkImages] = useState<Array<{filename: string, url: string, assignedTo?: string}>>([]);
  const [isUploadingBulkImages, setIsUploadingBulkImages] = useState(false);
  
  // Category Media State
  const [categoryMediaBranch, setCategoryMediaBranch] = useState<string>("");
  const [categoryMediaSelected, setCategoryMediaSelected] = useState<string>("");
  const [categoryMediaType, setCategoryMediaType] = useState<"image" | "gif" | "video">("image");

  const uploadImageToStorage = async (file: File | Blob, filename: string): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append('file', file, filename);
      const response = await fetch('/api/upload-menu-image', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Upload failed');
      const result = await response.json();
      return result.url;
    } catch (error) {
      console.error('Image upload error:', error);
      return null;
    }
  };

  const handleRichPaste = async (e: React.ClipboardEvent) => {
    const clipboardData = e.clipboardData;
    const htmlContent = clipboardData.getData('text/html');
    const textContent = clipboardData.getData('text/plain');
    
    const newImages: Array<{filename: string, url: string}> = [];
    setIsUploadingImages(true);
    
    try {
      for (const item of Array.from(clipboardData.items)) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            const ext = item.type.split('/')[1] || 'png';
            const filename = `menu-image-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${ext}`;
            const url = await uploadImageToStorage(file, filename);
            if (url) {
              newImages.push({ filename, url });
            }
          }
        }
      }
      
      if (htmlContent && htmlContent.includes('<img')) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        const images = doc.querySelectorAll('img');
        
        for (const img of Array.from(images)) {
          const src = img.getAttribute('src');
          if (src && src.startsWith('data:image')) {
            const [header, base64Data] = src.split(',');
            const mimeMatch = header.match(/data:image\/(\w+)/);
            const ext = mimeMatch ? mimeMatch[1] : 'png';
            const filename = `menu-image-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${ext}`;
            
            const byteString = atob(base64Data);
            const arrayBuffer = new ArrayBuffer(byteString.length);
            const uint8Array = new Uint8Array(arrayBuffer);
            for (let i = 0; i < byteString.length; i++) {
              uint8Array[i] = byteString.charCodeAt(i);
            }
            const blob = new Blob([uint8Array], { type: `image/${ext}` });
            
            const url = await uploadImageToStorage(blob, filename);
            if (url) {
              newImages.push({ filename, url });
            }
          }
        }
      }
      
      setPastedImages(prev => [...prev, ...newImages]);
      
      if (newImages.length > 0) {
        toast({
          title: "Images Uploaded",
          description: `${newImages.length} image(s) uploaded successfully. Add them to menu items in the preview.`,
        });
      }
    } catch (error) {
      console.error('Paste handling error:', error);
    } finally {
      setIsUploadingImages(false);
    }
  };
  
  // Branch-specific menu sections configuration
  const branchMenuSections: Record<string, Array<{ id: string; name: string; categories: string[] }>> = {
    // Tawa Grill sections - map section to category slugs
    "tawa-grill": [
      { id: "section1", name: "Main Menu / Full Menu", categories: ["starters", "grills", "curries", "rice-dishes", "naans", "sides", "desserts", "drinks", "specials", "combos", "platters", "wraps", "burgers", "bbq"] },
      { id: "section2", name: "Lunch Menu (Grilled & Burgers)", categories: ["lunch-grills", "lunch-burgers", "lunch-deals", "lunch-combos", "lunch-specials"] },
      { id: "section3", name: "Nashta Menu", categories: ["nashta", "breakfast", "paratha", "halwa-puri", "desi-breakfast", "nashta-specials"] },
    ],
  };
  
  // Get sections for the selected branch
  const getMenuSections = (branchId: string | null) => {
    if (!branchId) return null;
    const branch = restaurants.find(r => r.id === branchId);
    if (!branch) return null;
    const slug = branch.slug?.toLowerCase() || branch.name.toLowerCase().replace(/\s+/g, '-');
    // Check if this branch has defined sections
    if (slug.includes('tawa') && slug.includes('grill')) {
      return branchMenuSections["tawa-grill"];
    }
    return null;
  };

  // Topping Menus state
  const [toppingMenuBranch, setToppingMenuBranch] = useState<string | null>(null);
  const [selectedMenuItemsForToppings, setSelectedMenuItemsForToppings] = useState<string[]>([]);
  const [pasteToppingsText, setPasteToppingsText] = useState("");
  const [parsedToppings, setParsedToppings] = useState<Array<{ name: string; price: string; isFree: boolean; groupHeader?: string }>>([]);
  const [isApplyingToppings, setIsApplyingToppings] = useState(false);
  const [selectedToppingSection, setSelectedToppingSection] = useState<string>("all");
  const [isClearingToppings, setIsClearingToppings] = useState(false);

  // Payment Settings state
  const [paymentSettingsBranch, setPaymentSettingsBranch] = useState<string | null>(null);
  const [paymentStripePublishable, setPaymentStripePublishable] = useState("");
  const [paymentStripeSecret, setPaymentStripeSecret] = useState("");
  const [paymentStripeAccountId, setPaymentStripeAccountId] = useState("");
  const [isSavingPayment, setIsSavingPayment] = useState(false);

  // Parse pasted menu text - uses provided category list to match items
  const parseMenuText = (text: string, categoryList?: string[]) => {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const items: typeof parsedMenuItems = [];
    let currentCategory = "Uncategorized";
    
    console.log("=== parseMenuText START ===");
    console.log("Total lines:", lines.length);

    // Helper to check if a line looks like a price
    const isPriceLine = (line: string) => {
      const pricePatterns = [
        /^[£$€]?\s*\d+(?:\.\d{1,2})?(?:\s*each)?$/i,
        /^[£$€]\d+(?:\.\d{1,2})?/,
        /^\d+\.\d{1,2}$/,
        /^from\s*[£$€]?\s*\d+(?:\.\d{1,2})?$/i,
      ];
      return pricePatterns.some(p => p.test(line.trim()));
    };
    
    // Helper to extract price from a line
    const extractPrice = (line: string) => {
      const match = line.match(/[£$€]?\s*(\d+(?:\.\d{1,2})?)/);
      return match ? match[1] : "0";
    };
    
    // Check if line is a **Category** pattern
    const isAsteriskCategory = (line: string) => {
      const match = line.match(/^\*\*(.+)\*\*$/);
      return match ? match[1].trim() : null;
    };
    
    // Check if line should be skipped
    const isSkipLine = (line: string) => {
      if (line === '•' || line === '-' || line === '*') return true;
      if (/^\s*\d+%\s*\(\d+\)/.test(line)) return true;
      if (/^\d+\s*kcal/i.test(line)) return true;
      if (/^choose\s*\d*(-\d+)?$/i.test(line.trim())) return true;
      if (/^required$/i.test(line.trim())) return true;
      if (/^select\s*\d*(-\d+)?$/i.test(line.trim())) return true;
      return false;
    };
    
    // First pass: identify all item positions (lines followed by price lines OR with price on same line)
    const itemPositions: Array<{nameIdx: number, priceIdx: number, name: string, price: string}> = [];
    
    // Helper to extract name and price from same line (e.g., "Family Meal 2  £19.99")
    const extractSameLineItem = (line: string) => {
      const match = line.match(/^(.+?)\s+[£$€](\d+(?:\.\d{1,2})?)$/);
      if (match) {
        return { name: match[1].trim(), price: match[2] };
      }
      return null;
    };
    
    // Helper to check if line is a potential item name (not empty, not a category, not a price, not skip, not description)
    const isPotentialItemName = (line: string) => {
      if (!line || line.length < 2) return false;
      if (isSkipLine(line)) return false;
      if (isAsteriskCategory(line)) return false;
      if (isPriceLine(line)) return false;
      // Skip lines that are clearly descriptions (unambiguous patterns only)
      const descPatterns = [
        /^(with\s|served\s|includes\s|comes\s|topped\s|filled\s|accompanied)/i,
        /^contains\s/i,
        /^(allergens?:)/i,
      ];
      if (descPatterns.some(p => p.test(line.trim()))) return false;
      return true;
    };
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!isPotentialItemName(line)) continue;
      
      // First check if price is on the same line
      const sameLineItem = extractSameLineItem(line);
      if (sameLineItem) {
        itemPositions.push({
          nameIdx: i,
          priceIdx: i,
          name: sameLineItem.name.replace(/^"|"$/g, '').trim(),
          price: sameLineItem.price
        });
        console.log(`Same-line item found: "${sameLineItem.name}" at line ${i}`);
        continue;
      }
      
      // Look for price in next few lines (up to 6 lines ahead to handle descriptions)
      for (let j = i + 1; j < Math.min(i + 7, lines.length); j++) {
        const nextLine = lines[j];
        
        // Found price - this is an item
        if (isPriceLine(nextLine)) {
          itemPositions.push({
            nameIdx: i,
            priceIdx: j,
            name: line.replace(/^"|"$/g, '').trim(),
            price: extractPrice(nextLine)
          });
          console.log(`Item found: "${line}" with price at line ${j}`);
          break;
        }
        
        // Hit a category - stop looking
        if (isAsteriskCategory(nextLine)) {
          console.log(`Category hit at line ${j}, stopping search for "${line}"`);
          break;
        }
        
        // Check if this line might be the next item (has a price on the line after it)
        if (isPotentialItemName(nextLine)) {
          const afterNext = j + 1 < lines.length ? lines[j + 1] : "";
          if (isPriceLine(afterNext)) {
            // This is the next item, stop looking for current item's price
            console.log(`Next item "${nextLine}" found at line ${j}, stopping search for "${line}"`);
            break;
          }
        }
      }
    }
    
    console.log(`Total item positions found: ${itemPositions.length}`);
    
    console.log("Found item positions:", itemPositions.length);
    
    // Second pass: process each item with its details
    for (let idx = 0; idx < itemPositions.length; idx++) {
      const pos = itemPositions[idx];
      const nextPos = itemPositions[idx + 1];
      const endIdx = nextPos ? nextPos.nameIdx : lines.length;
      
      // Check for category before this item (between start/previous item and this item's name)
      for (let k = (idx === 0 ? 0 : itemPositions[idx - 1].priceIdx + 1); k < pos.nameIdx; k++) {
        const cat = isAsteriskCategory(lines[k]);
        if (cat) {
          currentCategory = cat;
        }
      }
      
      // Capture the category for THIS item before scanning details
      const itemCategory = currentCategory;
      
      let description = "";
      let allergens: string[] = [];
      let tags: string[] = [];
      
      // Look for details between price and next item
      for (let j = pos.priceIdx + 1; j < endIdx; j++) {
        const checkLine = lines[j];
        
        // Check for category (this sets category for NEXT items, not current)
        const cat = isAsteriskCategory(checkLine);
        if (cat) {
          currentCategory = cat;
          continue;
        }
        
        if (isSkipLine(checkLine)) continue;
        if (isPriceLine(checkLine)) continue;
        
        // Check for allergens
        if (checkLine.toLowerCase().includes('contains')) {
          const cleanedLine = checkLine.replace(/^["']|["']$/g, '').replace(/on separate line/i, '').trim();
          const parts = cleanedLine.split(',').map(p => p.trim());
          parts.forEach(part => {
            const cleanPart = part.replace(/^Contains\s*/i, '').replace(/^["']|["']$/g, '').trim();
            if (cleanPart && knownAllergens.some(a => cleanPart.toLowerCase().includes(a.toLowerCase()))) {
              allergens.push(cleanPart);
            }
          });
          continue;
        }
        
        // Check for tags
        const tagPatterns = [/^halal$/i, /^popular$/i, /^spicy$/i, /^vegetarian$/i, /^vegan$/i, /^hot$/i, /^mild$/i, /^veg$/i];
        if (tagPatterns.some(p => p.test(checkLine.trim()))) {
          tags.push(checkLine.trim());
          continue;
        }
        
        // Otherwise, it's description (if not too long and not the next item name)
        if (!description && checkLine.length > 5 && checkLine.length < 200) {
          const cleanDesc = checkLine.replace(/^["']|["']$/g, '').replace(/on separate line/i, '').trim();
          if (cleanDesc.length > 5) {
            description = cleanDesc;
          }
        }
      }
      
      items.push({
        category: itemCategory,
        name: pos.name,
        price: pos.price,
        description,
        allergens,
        tags
      });
      console.log(`Added item #${items.length}: "${pos.name}" in "${itemCategory}"`);
    }
    
    console.log("=== parseMenuText END === Total items:", items.length);
    return items;
  };

  // Twilio System state
  const [selectedTwilioBranch, setSelectedTwilioBranch] = useState<string | null>(null);
  const [selectedCommissionBranch, setSelectedCommissionBranch] = useState<string | null>(null);
  const [commissionSearchQuery, setCommissionSearchQuery] = useState("");
  const [twilioAccountSid, setTwilioAccountSid] = useState("");
  const [twilioAuthToken, setTwilioAuthToken] = useState("");
  const [twilioPhoneNumber, setTwilioPhoneNumber] = useState("");
  const [twilioEnabled, setTwilioEnabled] = useState(true);
  const [isSavingTwilio, setIsSavingTwilio] = useState(false);
  const [twilioSearchQuery, setTwilioSearchQuery] = useState("");

  // Delivery Area state
  const [deliverySearchQuery, setDeliverySearchQuery] = useState("");
  const [selectedDeliveryBranch, setSelectedDeliveryBranch] = useState<string>("");
  const [deliveryRadiusType, setDeliveryRadiusType] = useState<string>("uk_only");
  const [deliveryRadiusMiles, setDeliveryRadiusMiles] = useState<string>("5");
  const [restaurantLatitude, setRestaurantLatitude] = useState<string>("");
  const [restaurantLongitude, setRestaurantLongitude] = useState<string>("");
  const [isSavingDelivery, setIsSavingDelivery] = useState(false);

  // QR Code state
  const [qrSearchQuery, setQrSearchQuery] = useState("");
  const [selectedQrBranch, setSelectedQrBranch] = useState<string>("");
  const [qrPageType, setQrPageType] = useState<"menu" | "welcome" | "both">("menu");
  const qrRef = useRef<HTMLDivElement>(null);

  // Menu Background state
  const [menuBgSearchQuery, setMenuBgSearchQuery] = useState("");
  const [selectedMenuBgBranch, setSelectedMenuBgBranch] = useState<string>("");
  const [menuBgType, setMenuBgType] = useState<"gradient" | "image" | "video">("gradient");
  const [menuBgImageUrl, setMenuBgImageUrl] = useState("");
  const [menuBgVideoUrl, setMenuBgVideoUrl] = useState("");
  const [menuGradientStart, setMenuGradientStart] = useState("#1a1a2e");
  const [menuGradientMiddle, setMenuGradientMiddle] = useState("#2d1b4e");
  const [menuGradientEnd, setMenuGradientEnd] = useState("#1a1a2e");
  const [isSavingMenuBg, setIsSavingMenuBg] = useState(false);

  // Load menu background settings when branch is selected
  const selectedMenuBgBranchData = restaurants.find(r => r.id === selectedMenuBgBranch);
  useEffect(() => {
    if (selectedMenuBgBranchData) {
      setMenuBgType((selectedMenuBgBranchData as any).menuBackgroundType || "gradient");
      setMenuBgImageUrl((selectedMenuBgBranchData as any).menuBackgroundImageUrl || "");
      setMenuBgVideoUrl((selectedMenuBgBranchData as any).menuBackgroundVideoUrl || "");
      setMenuGradientStart((selectedMenuBgBranchData as any).menuGradientStart || "#1a1a2e");
      setMenuGradientMiddle((selectedMenuBgBranchData as any).menuGradientMiddle || "#2d1b4e");
      setMenuGradientEnd((selectedMenuBgBranchData as any).menuGradientEnd || "#1a1a2e");
    }
  }, [selectedMenuBgBranchData]);

  // Load delivery settings when branch is selected
  const selectedDeliveryBranchData = restaurants.find(r => r.id === selectedDeliveryBranch);
  useEffect(() => {
    if (selectedDeliveryBranchData) {
      setDeliveryRadiusType(selectedDeliveryBranchData.deliveryRadiusType || "uk_only");
      setDeliveryRadiusMiles(String(selectedDeliveryBranchData.deliveryRadiusMiles || 5));
      setRestaurantLatitude(String(selectedDeliveryBranchData.restaurantLatitude || ""));
      setRestaurantLongitude(String(selectedDeliveryBranchData.restaurantLongitude || ""));
    }
  }, [selectedDeliveryBranchData]);

  // Theme Colors state
  const [selectedThemeBranch, setSelectedThemeBranch] = useState<string | null>(null);
  const [themeSearchQuery, setThemeSearchQuery] = useState("");
  const [themePrimaryColor, setThemePrimaryColor] = useState("#8B0000");
  const [themeSecondaryColor, setThemeSecondaryColor] = useState("#FFD700");
  const [themeAccentColor, setThemeAccentColor] = useState("#4A0E4E");
  const [themeButtonColor, setThemeButtonColor] = useState("#dc2626");
  const [themeHeaderBgColor, setThemeHeaderBgColor] = useState("#1a1a2e");
  const [themeCardBgColor, setThemeCardBgColor] = useState("#ffffff");
  const [themeTextColor, setThemeTextColor] = useState("#ffffff");
  const [isSavingTheme, setIsSavingTheme] = useState(false);

  // App Icon state
  const [selectedAppIconBranch, setSelectedAppIconBranch] = useState<string | null>(null);
  const [appIconSearchQuery, setAppIconSearchQuery] = useState("");
  const [appIconUrl, setAppIconUrl] = useState("");
  const [appName, setAppName] = useState("");
  const [appShortName, setAppShortName] = useState("");
  const [appThemeColor, setAppThemeColor] = useState("#2563eb");
  const [appBackgroundColor, setAppBackgroundColor] = useState("transparent");
  const [isSavingAppIcon, setIsSavingAppIcon] = useState(false);
  const [aiIconPrompt, setAiIconPrompt] = useState("");
  const [aiIconStyle, setAiIconStyle] = useState("modern");
  const [isGeneratingIcons, setIsGeneratingIcons] = useState(false);
  const [generatedIcons, setGeneratedIcons] = useState<{b64: string; style: string}[]>([]);
  const [showAiGenerator, setShowAiGenerator] = useState(false);
  const [isUploadingGenIcon, setIsUploadingGenIcon] = useState<number | null>(null);

  const handleGenerateIcons = async () => {
    const name = aiIconPrompt || appName || selectedBranch?.name || "";
    if (!name) { toast({ title: "Enter a name", variant: "destructive" }); return; }
    setIsGeneratingIcons(true);
    setGeneratedIcons([]);
    const styles = [
      { style: "modern", prompt: `Create a flat square app icon for "${name}". The gradient background MUST fill every pixel of the entire 512x512 canvas with ZERO white space, ZERO margins, ZERO rounded corners, ZERO borders. The background color goes right to every edge and corner. Place a simple white symbol in the center. IMPORTANT: The corners must be sharp 90-degree angles filled with color, NOT rounded. No text.` },
      { style: "vibrant", prompt: `Create a flat square app icon for "${name}". Bright orange-to-pink gradient background that MUST fill every single pixel of the 512x512 canvas. ZERO white space anywhere, ZERO margins, ZERO rounded corners. Background color touches all 4 edges and all 4 corners with sharp 90-degree angles. Simple white symbol in center. No text.` },
      { style: "elegant", prompt: `Create a flat square app icon for "${name}". Dark navy/black background that MUST fill every single pixel of the 512x512 canvas. ZERO white space anywhere, ZERO margins, ZERO rounded corners. Background goes edge to edge with sharp 90-degree corners. Gold/champagne symbol in center. No text.` },
      { style: "fresh", prompt: `Create a flat square app icon for "${name}". Green-to-teal gradient background that MUST fill every single pixel of the 512x512 canvas. ZERO white space anywhere, ZERO margins, ZERO rounded corners. Background goes edge to edge with sharp 90-degree corners. Clean white symbol in center. No text.` },
    ];
    const results: {b64: string; style: string}[] = [];
    for (const s of styles) {
      try {
        const res = await fetch("/api/generate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: s.prompt }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.b64_json) results.push({ b64: data.b64_json, style: s.style });
        }
      } catch {}
      setGeneratedIcons([...results]);
    }
    setGeneratedIcons(results);
    setIsGeneratingIcons(false);
    if (results.length === 0) toast({ title: "Could not generate icons", description: "Try again with a different name", variant: "destructive" });
  };

  const handleUseGeneratedIcon = async (b64: string, index: number) => {
    setIsUploadingGenIcon(index);
    try {
      const byteChars = atob(b64);
      const byteArray = new Uint8Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) byteArray[i] = byteChars.charCodeAt(i);
      const blob = new Blob([byteArray], { type: "image/png" });
      const formData = new FormData();
      formData.append("file", blob, "app-icon.png");
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        const url = data.url || data.path || data.fileUrl;
        if (url) {
          setAppIconUrl(url);
          setAppBackgroundColor("transparent");
          toast({ title: "Icon selected!", description: "Background set to transparent. Click 'Save App Icon Settings' to apply." });
        }
      } else {
        toast({ title: "Upload failed", variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    }
    setIsUploadingGenIcon(null);
  };

  const { data: branchSnapshots = [], refetch: refetchSnapshots } = useQuery({
    queryKey: ["/api/snapshots", selectedRecoveryBranch],
    queryFn: async () => {
      if (!selectedRecoveryBranch) return [];
      const res = await fetch(`/api/snapshots/${selectedRecoveryBranch}`);
      if (!res.ok) throw new Error("Failed to fetch snapshots");
      return res.json();
    },
    enabled: !!selectedRecoveryBranch,
  });

  // Twilio settings query for selected branch
  const { data: twilioSettings, refetch: refetchTwilioSettings } = useQuery({
    queryKey: ["/api/twilio-settings", selectedTwilioBranch],
    queryFn: async () => {
      if (!selectedTwilioBranch) return null;
      const res = await fetch(`/api/twilio-settings/${selectedTwilioBranch}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!selectedTwilioBranch,
  });

  // Query for all twilio settings (to show enabled/disabled status in list)
  const { data: allTwilioSettings = [], refetch: refetchAllTwilioSettings } = useQuery<Array<{ restaurantId: string; enabled: boolean; phoneNumber: string }>>({
    queryKey: ["/api/twilio-settings"],
    queryFn: async () => {
      const res = await fetch("/api/twilio-settings");
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Quick toggle for branch twilio
  const handleQuickToggleTwilio = async (branchId: string, newEnabled: boolean) => {
    try {
      const res = await fetch(`/api/twilio-settings/${branchId}/toggle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: newEnabled }),
      });
      if (!res.ok) throw new Error("Failed to toggle");
      await refetchAllTwilioSettings();
      if (selectedTwilioBranch === branchId) {
        await refetchTwilioSettings();
      }
      toast({ title: newEnabled ? "Twilio Enabled" : "Twilio Disabled", description: `Caller ID is now ${newEnabled ? "active" : "disabled"} for this branch.` });
    } catch (error) {
      toast({ title: "Error", description: "This branch needs Twilio credentials first. Click to configure.", variant: "destructive" });
    }
  };

  // Load Twilio settings when branch is selected
  useEffect(() => {
    if (twilioSettings) {
      setTwilioAccountSid(twilioSettings.accountSid || "");
      setTwilioAuthToken(twilioSettings.authToken || "");
      setTwilioPhoneNumber(twilioSettings.phoneNumber || "");
      setTwilioEnabled(twilioSettings.enabled !== false);
    } else {
      setTwilioAccountSid("");
      setTwilioAuthToken("");
      setTwilioPhoneNumber("");
      setTwilioEnabled(true);
    }
  }, [twilioSettings]);

  const handleSaveTwilioSettings = async () => {
    if (!selectedTwilioBranch || !twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      toast({ title: "Error", description: "Please fill in all Twilio credentials", variant: "destructive" });
      return;
    }
    setIsSavingTwilio(true);
    try {
      const res = await fetch("/api/twilio-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId: selectedTwilioBranch,
          accountSid: twilioAccountSid,
          authToken: twilioAuthToken,
          phoneNumber: twilioPhoneNumber,
          enabled: twilioEnabled,
        }),
      });
      if (!res.ok) throw new Error("Failed to save Twilio settings");
      await refetchTwilioSettings();
      toast({ title: "Twilio Settings Saved", description: "Caller ID is now configured for this branch." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to save Twilio settings", variant: "destructive" });
    } finally {
      setIsSavingTwilio(false);
    }
  };

  const handleDeleteTwilioSettings = async () => {
    if (!selectedTwilioBranch) return;
    try {
      const res = await fetch(`/api/twilio-settings/${selectedTwilioBranch}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete Twilio settings");
      setTwilioAccountSid("");
      setTwilioAuthToken("");
      setTwilioPhoneNumber("");
      setTwilioEnabled(true);
      await refetchTwilioSettings();
      toast({ title: "Twilio Settings Removed", description: "Caller ID has been disabled for this branch." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to remove Twilio settings", variant: "destructive" });
    }
  };

  const handleCreateBackup = async () => {
    if (!selectedRecoveryBranch) return;
    setIsCreatingBackup(true);
    try {
      const res = await fetch("/api/snapshots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          restaurantId: selectedRecoveryBranch, 
          label: `Manual backup - ${new Date().toLocaleString()}`,
          snapshotType: "manual"
        }),
      });
      if (!res.ok) throw new Error("Failed to create backup");
      await refetchSnapshots();
      toast({ title: "Backup Created", description: "Your branch data has been backed up successfully." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to create backup", variant: "destructive" });
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleSyncProduction = async () => {
    setIsSyncingProduction(true);
    try {
      const res = await fetch("/api/sync-production", { method: "POST" });
      if (!res.ok) throw new Error("Failed to sync production");
      const data = await res.json();
      toast({ title: "Production Sync Complete", description: data.message || "All branch data has been synced." });
      queryClient.invalidateQueries();
    } catch (error) {
      toast({ title: "Error", description: "Failed to sync production data", variant: "destructive" });
    } finally {
      setIsSyncingProduction(false);
    }
  };

  const handleResetBranchMenu = async (slug: string) => {
    if (!confirm(`Are you sure you want to reset ALL menu data for this branch? This will DELETE all existing menu items and categories, then re-import from seed data.`)) {
      return;
    }
    setIsResettingBranch(true);
    setResetBranchSlug(slug);
    try {
      const res = await fetch(`/api/reset-branch-menu/${slug}`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to reset branch menu");
      const data = await res.json();
      toast({ title: "Branch Menu Reset", description: data.message || "Menu data has been reset and re-imported." });
      queryClient.invalidateQueries();
    } catch (error) {
      toast({ title: "Error", description: "Failed to reset branch menu", variant: "destructive" });
    } finally {
      setIsResettingBranch(false);
      setResetBranchSlug(null);
    }
  };

  const handleRestoreBackup = async (snapshotId: string) => {
    setIsRestoring(true);
    try {
      const res = await fetch(`/api/snapshots/${snapshotId}/restore`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to restore backup");
      toast({ title: "Restore Complete", description: "Branch data has been restored from backup." });
      setRestoreConfirmId(null);
      queryClient.invalidateQueries();
    } catch (error) {
      toast({ title: "Error", description: "Failed to restore backup", variant: "destructive" });
    } finally {
      setIsRestoring(false);
    }
  };

  const handleDeleteBackup = async (snapshotId: string) => {
    try {
      const res = await fetch(`/api/snapshots/${snapshotId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete backup");
      await refetchSnapshots();
      toast({ title: "Deleted", description: "Backup has been deleted." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete backup", variant: "destructive" });
    }
  };

  const renderSoundSettings = () => {
    const selectedBranch = restaurants.find(r => r.id === soundSettingsBranch);
    
    const handleLoadBranchSound = (branchId: string) => {
      const branch = restaurants.find(r => r.id === branchId);
      if (branch) {
        setSoundSettingsBranch(branchId);
        setSoundAlarmSound((branch as any).alarmSound || "alarm1");
        setSoundVoiceEnabled((branch as any).voiceAlertEnabled ?? true);
        setSoundVoiceMessage((branch as any).voiceAlertMessage || "New order received");
        setSoundVoiceRate(parseFloat((branch as any).voiceAlertRate) || 1.0);
        setSoundVoicePitch(parseFloat((branch as any).voiceAlertPitch) || 1.0);
      }
    };

    const handleSaveSoundSettings = () => {
      if (!soundSettingsBranch) return;
      updateRestaurantMutation.mutate({
        id: soundSettingsBranch,
        data: {
          alarmSound: soundAlarmSound,
          voiceAlertEnabled: soundVoiceEnabled,
          voiceAlertMessage: soundVoiceMessage,
          voiceAlertRate: String(soundVoiceRate),
          voiceAlertPitch: String(soundVoicePitch),
        },
      });
    };

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Volume2 className="h-5 w-5 text-orange-500" />
              Sound Settings
            </CardTitle>
            <CardDescription>
              Configure alarm sounds and voice alerts for each branch. When new orders arrive, the selected alarm will play along with the voice message.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="mb-2 block">Select Branch</Label>
              <Select value={soundSettingsBranch || ""} onValueChange={handleLoadBranchSound}>
                <SelectTrigger data-testid="select-sound-branch">
                  <SelectValue placeholder="Select a branch to configure sounds" />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  {restaurants.map(restaurant => (
                    <SelectItem key={restaurant.id} value={restaurant.id}>
                      {restaurant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {soundSettingsBranch && (
              <div className="space-y-6">
                <div className="border rounded-lg p-4 space-y-4 bg-gradient-to-br from-red-500/10 to-orange-500/5 border-red-500/30">
                  <div className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-red-500" />
                    <h3 className="font-semibold text-red-600">Alarm Sound</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">Choose the alarm sound that plays when new orders arrive.</p>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {ALARM_SOUNDS.map((alarm) => (
                      <div
                        key={alarm.id}
                        onClick={() => setSoundAlarmSound(alarm.id)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all hover:bg-accent ${
                          soundAlarmSound === alarm.id 
                            ? 'border-red-500 bg-red-500/10 ring-2 ring-red-500/30' 
                            : 'border-border hover:border-red-300'
                        }`}
                        data-testid={`sound-alarm-option-${alarm.id}`}
                      >
                        <div className="text-center">
                          <div className="text-xl mb-1">🔔</div>
                          <div className="text-xs font-medium truncate">{alarm.name}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    className="gap-2"
                    onClick={() => {
                      const alarm = ALARM_SOUNDS.find(a => a.id === soundAlarmSound);
                      if (alarm) {
                        const audio = new Audio(alarm.url);
                        audio.play().catch(e => console.log('Audio play failed:', e));
                      }
                    }}
                    data-testid="button-test-sound-alarm"
                  >
                    <Play className="h-4 w-4" /> Test Selected Alarm
                  </Button>
                </div>

                <div className="border rounded-lg p-4 space-y-4 bg-gradient-to-br from-orange-500/10 to-amber-500/5 border-orange-500/30">
                  <div className="flex items-center gap-2">
                    <Volume2 className="h-5 w-5 text-orange-500" />
                    <h3 className="font-semibold text-orange-600">Voice Alert Settings</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">When a new order arrives, the computer will speak this message along with the alarm sound.</p>
                  
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={soundVoiceEnabled} 
                        onChange={(e) => setSoundVoiceEnabled(e.target.checked)}
                        className="w-4 h-4 rounded"
                        data-testid="checkbox-sound-voice-enabled"
                      />
                      <span className="text-sm font-medium">Enable Voice Alert</span>
                    </label>
                  </div>

                  {soundVoiceEnabled && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Voice Message</Label>
                        <Textarea 
                          value={soundVoiceMessage}
                          onChange={(e) => setSoundVoiceMessage(e.target.value)}
                          placeholder="Enter what the computer should say..."
                          className="min-h-[80px]"
                          data-testid="input-sound-voice-message"
                        />
                        <p className="text-xs text-muted-foreground">Example: "Attention! New order received at the counter"</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Speed: {soundVoiceRate.toFixed(1)}x</Label>
                          <input 
                            type="range" 
                            min="0.5" 
                            max="2" 
                            step="0.1" 
                            value={soundVoiceRate}
                            onChange={(e) => setSoundVoiceRate(parseFloat(e.target.value))}
                            className="w-full"
                            data-testid="slider-sound-voice-rate"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Pitch: {soundVoicePitch.toFixed(1)}</Label>
                          <input 
                            type="range" 
                            min="0.5" 
                            max="2" 
                            step="0.1" 
                            value={soundVoicePitch}
                            onChange={(e) => setSoundVoicePitch(parseFloat(e.target.value))}
                            className="w-full"
                            data-testid="slider-sound-voice-pitch"
                          />
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          className="gap-2"
                          onClick={() => {
                            if ('speechSynthesis' in window) {
                              window.speechSynthesis.cancel();
                              const utterance = new SpeechSynthesisUtterance(soundVoiceMessage || "New order received");
                              utterance.rate = soundVoiceRate;
                              utterance.pitch = soundVoicePitch;
                              window.speechSynthesis.speak(utterance);
                            } else {
                              alert("Your browser does not support text-to-speech");
                            }
                          }}
                          data-testid="button-test-sound-voice"
                        >
                          <Play className="h-4 w-4" /> Test Voice
                        </Button>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          className="gap-2"
                          onClick={() => {
                            setSoundVoiceMessage("New order received");
                            setSoundVoiceRate(1.0);
                            setSoundVoicePitch(1.0);
                          }}
                          data-testid="button-reset-sound-voice"
                        >
                          <RotateCcw className="h-4 w-4" /> Reset to Default
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <Button 
                  onClick={handleSaveSoundSettings}
                  disabled={updateRestaurantMutation.isPending}
                  className="w-full gap-2"
                  data-testid="button-save-sound-settings"
                >
                  {updateRestaurantMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save Sound Settings for {selectedBranch?.name}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderWelcomeEditor = () => {
    // Get menu items for selected branch, sorted by name for consistency with Welcome page
    const branchMenuItems = menuItems
      .filter(item => item.restaurantId === selectedWelcomeBranch && item.image && item.image.trim() !== '')
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    const handleSaveWelcomeText = () => {
      if (!selectedWelcomeBranch) return;
      updateRestaurantMutation.mutate({
        id: selectedWelcomeBranch,
        data: { tagline: welcomeTagline, cuisineType: welcomeCuisineType },
      });
    };

    return (
      <div className="space-y-6">
        {/* Branch Selector */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Welcome Page
            </CardTitle>
            <CardDescription>Select a branch to edit its welcome page content</CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedWelcomeBranch || ""}
              onValueChange={(value) => setSelectedWelcomeBranch(value)}
            >
              <SelectTrigger data-testid="select-welcome-branch">
                <SelectValue placeholder="Select a branch..." />
              </SelectTrigger>
              <SelectContent>
                {restaurants.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {selectedWelcomeBranch && selectedWelcomeBranchData && (
          <>
            {/* Welcome Text Editor */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{selectedWelcomeBranchData.name}</CardTitle>
                    <CardDescription>Edit the text shown on the welcome page</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const slug = selectedWelcomeBranchData?.slug;
                      if (slug) {
                        const specialSlugs = ['shirin-mahal', 'dasi-food-hub'];
                        const url = specialSlugs.includes(slug) ? `/${slug}` : `/${slug}/welcome`;
                        window.open(url, '_blank');
                      }
                    }}
                    className="gap-2"
                    data-testid="button-view-live-welcome"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View Live
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Cuisine Type <span className="text-xs text-amber-500 font-normal">(Gold text - Line 1)</span></Label>
                  <Input
                    placeholder="e.g., Indian & Indo-Chinese"
                    value={welcomeCuisineType}
                    onChange={(e) => setWelcomeCuisineType(e.target.value)}
                    data-testid="input-welcome-cuisine-type"
                  />
                  <p className="text-xs text-muted-foreground">The big gold text on the welcome page (e.g., "Indian & Indo-Chinese")</p>
                </div>
                <div className="space-y-2">
                  <Label>Tagline <span className="text-xs text-gray-400 font-normal">(Silver text - Line 2)</span></Label>
                  <Input
                    placeholder='e.g., "Where every bite feels like home"'
                    value={welcomeTagline}
                    onChange={(e) => setWelcomeTagline(e.target.value)}
                    data-testid="input-welcome-tagline"
                  />
                  <p className="text-xs text-muted-foreground">The smaller text below the cuisine type</p>
                </div>

                <Button
                  onClick={handleSaveWelcomeText}
                  disabled={updateRestaurantMutation.isPending}
                  className="w-full gap-2"
                  data-testid="button-save-welcome-tagline"
                >
                  {updateRestaurantMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  <Save className="h-4 w-4" />
                  Save Welcome Text
                </Button>
              </CardContent>
            </Card>

            {/* Welcome Page Background */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Welcome Page Background
                </CardTitle>
                <CardDescription>Customize the background of the welcome page with gradients, images, or videos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Background Type</Label>
                  <div className="grid grid-cols-3 gap-3">
                    <Button
                      type="button"
                      variant={welcomeBgType === "gradient" ? "default" : "outline"}
                      onClick={() => setWelcomeBgType("gradient")}
                      className="flex flex-col items-center gap-2 h-auto py-4"
                      data-testid="welcome-bg-type-gradient"
                    >
                      <Palette className="h-5 w-5" />
                      <span>Gradient</span>
                    </Button>
                    <Button
                      type="button"
                      variant={welcomeBgType === "image" ? "default" : "outline"}
                      onClick={() => setWelcomeBgType("image")}
                      className="flex flex-col items-center gap-2 h-auto py-4"
                      data-testid="welcome-bg-type-image"
                    >
                      <ImageIcon className="h-5 w-5" />
                      <span>Image</span>
                    </Button>
                    <Button
                      type="button"
                      variant={welcomeBgType === "video" ? "default" : "outline"}
                      onClick={() => setWelcomeBgType("video")}
                      className="flex flex-col items-center gap-2 h-auto py-4"
                      data-testid="welcome-bg-type-video"
                    >
                      <Video className="h-5 w-5" />
                      <span>Video</span>
                    </Button>
                  </div>
                </div>

                {welcomeBgType === "gradient" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Start Color</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={welcomeGradientStart}
                            onChange={(e) => setWelcomeGradientStart(e.target.value)}
                            className="w-12 h-10 p-1 cursor-pointer"
                          />
                          <Input
                            value={welcomeGradientStart}
                            onChange={(e) => setWelcomeGradientStart(e.target.value)}
                            className="flex-1"
                            data-testid="input-welcome-gradient-start"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Middle Color</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={welcomeGradientMiddle || "#2d1b4e"}
                            onChange={(e) => setWelcomeGradientMiddle(e.target.value)}
                            className="w-12 h-10 p-1 cursor-pointer"
                          />
                          <Input
                            value={welcomeGradientMiddle}
                            onChange={(e) => setWelcomeGradientMiddle(e.target.value)}
                            className="flex-1"
                            placeholder="Optional"
                            data-testid="input-welcome-gradient-middle"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>End Color</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={welcomeGradientEnd}
                            onChange={(e) => setWelcomeGradientEnd(e.target.value)}
                            className="w-12 h-10 p-1 cursor-pointer"
                          />
                          <Input
                            value={welcomeGradientEnd}
                            onChange={(e) => setWelcomeGradientEnd(e.target.value)}
                            className="flex-1"
                            data-testid="input-welcome-gradient-end"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="h-24 rounded-lg" style={{
                      background: welcomeGradientMiddle 
                        ? `linear-gradient(135deg, ${welcomeGradientStart}, ${welcomeGradientMiddle}, ${welcomeGradientEnd})`
                        : `linear-gradient(135deg, ${welcomeGradientStart}, ${welcomeGradientEnd})`
                    }}>
                      <p className="text-center text-white/70 pt-9 text-sm">Preview</p>
                    </div>
                  </div>
                )}

                {welcomeBgType === "image" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Upload Background Image</Label>
                      <div className="flex gap-2">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleWelcomeBgUpload(e, 'image')}
                          disabled={isUploadingWelcomeBg}
                          className="flex-1"
                          data-testid="input-welcome-bg-image-upload"
                        />
                      </div>
                      {isUploadingWelcomeBg && (
                        <p className="text-sm text-muted-foreground">Uploading...</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Or Enter Image URL</Label>
                      <Input
                        value={welcomeBgImageUrl}
                        onChange={(e) => setWelcomeBgImageUrl(e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        data-testid="input-welcome-bg-image"
                      />
                    </div>
                    {welcomeBgImageUrl && (
                      <div className="h-32 rounded-lg bg-cover bg-center border" style={{
                        backgroundImage: `url(${welcomeBgImageUrl})`
                      }}>
                        <p className="text-center text-white/70 pt-12 text-sm drop-shadow-lg">Preview</p>
                      </div>
                    )}
                  </div>
                )}

                {welcomeBgType === "video" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Upload Background Video</Label>
                      <div className="flex gap-2">
                        <Input
                          type="file"
                          accept="video/*"
                          onChange={(e) => handleWelcomeBgUpload(e, 'video')}
                          disabled={isUploadingWelcomeBg}
                          className="flex-1"
                          data-testid="input-welcome-bg-video-upload"
                        />
                      </div>
                      {isUploadingWelcomeBg && (
                        <p className="text-sm text-muted-foreground">Uploading...</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Or Enter Video URL</Label>
                      <Input
                        value={welcomeBgVideoUrl}
                        onChange={(e) => setWelcomeBgVideoUrl(e.target.value)}
                        placeholder="https://example.com/video.mp4"
                        data-testid="input-welcome-bg-video"
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Use a short looping video for best performance. MP4 format recommended.
                    </p>
                    {welcomeBgVideoUrl && (
                      <div className="rounded-lg border overflow-hidden">
                        <video 
                          src={welcomeBgVideoUrl} 
                          className="w-full h-32 object-cover"
                          autoPlay 
                          loop 
                          muted 
                          playsInline
                        />
                      </div>
                    )}
                  </div>
                )}

                <Button 
                  onClick={async () => {
                    if (!selectedWelcomeBranch) return;
                    setIsSavingWelcomeBg(true);
                    try {
                      await fetch(`/api/restaurants/${selectedWelcomeBranch}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          welcomeBackgroundType: welcomeBgType,
                          welcomeBackgroundImageUrl: welcomeBgImageUrl,
                          welcomeBackgroundVideoUrl: welcomeBgVideoUrl,
                          welcomeGradientStart: welcomeGradientStart,
                          welcomeGradientMiddle: welcomeGradientMiddle,
                          welcomeGradientEnd: welcomeGradientEnd,
                        }),
                      });
                      toast({ title: "Saved", description: "Welcome page background settings saved!" });
                      queryClient.invalidateQueries({ queryKey: ["/api/restaurants"] });
                    } catch (error) {
                      toast({ title: "Error", description: "Failed to save settings", variant: "destructive" });
                    } finally {
                      setIsSavingWelcomeBg(false);
                    }
                  }}
                  disabled={isSavingWelcomeBg}
                  className="w-full"
                  data-testid="button-save-welcome-bg"
                >
                  {isSavingWelcomeBg ? "Saving..." : "Save Welcome Background Settings"}
                </Button>
              </CardContent>
            </Card>

            {/* Menu Highlights - Horizontal Scroll with Edit Icons */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Badge className="mb-2 bg-blue-600">Menu highlights</Badge>
                    <CardTitle className="text-2xl bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">Our menu</CardTitle>
                    <CardDescription className="mt-1">
                      Click the edit icon on each image to change
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-amber-500" data-testid="text-menu-highlights-count">
                      {Math.min(branchMenuItems.length, 10)}/10
                    </div>
                    <p className="text-xs text-muted-foreground">images uploaded</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {branchMenuItems.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No menu items with images found for this branch</p>
                    <p className="text-sm mt-2">Add images to menu items in the Menu Manager</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto pb-4">
                    <div className="flex gap-4" style={{ minWidth: 'max-content' }}>
                      {branchMenuItems.slice(0, 10).map((item, index) => (
                        <div
                          key={item.id}
                          className="flex-shrink-0 w-32 group cursor-pointer relative"
                          data-testid={`carousel-item-${item.id}`}
                        >
                          <div className="aspect-square rounded-xl overflow-hidden shadow-lg relative border-2 border-amber-200">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              data-testid={`img-menu-carousel-${item.id}`}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                            <div className="absolute bottom-0 left-0 right-0 p-2">
                              <p className="text-white text-xs font-medium truncate" data-testid={`text-menu-name-${item.id}`}>{item.name}</p>
                            </div>
                            {/* Position Number */}
                            <div className="absolute top-1 left-1 bg-amber-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                              {index + 1}
                            </div>
                            {/* Edit Button - Always Visible */}
                            <button
                              onClick={() => {
                                setEditingWelcomeItem(item.id);
                                setEditWelcomeItemName(item.name);
                                setEditWelcomeItemImage(item.image || "");
                              }}
                              className="absolute top-1 right-1 bg-white hover:bg-amber-100 rounded-full p-1.5 shadow-md transition-colors"
                              data-testid={`button-edit-menu-${item.id}`}
                            >
                              <Pencil className="h-3.5 w-3.5 text-amber-600" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-3 text-center">← Scroll right to see more images →</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Edit Menu Item Dialog */}
            <Dialog open={!!editingWelcomeItem} onOpenChange={(open) => !open && setEditingWelcomeItem(null)}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Edit Menu Item</DialogTitle>
                  <DialogDescription>Change the name or upload a new image</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {/* Current Image Preview */}
                  {editWelcomeItemImage && (
                    <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted">
                      <img 
                        src={editWelcomeItemImage} 
                        alt="Current" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  {/* Upload New Image */}
                  <div className="space-y-2">
                    <Label>Image</Label>
                    <input
                      type="file"
                      accept="image/*"
                      ref={welcomeImageInputRef}
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setIsUploadingWelcomeImage(true);
                        try {
                          const formData = new FormData();
                          formData.append('file', file);
                          const response = await fetch('/api/upload', {
                            method: 'POST',
                            body: formData,
                          });
                          if (response.ok) {
                            const data = await response.json();
                            setEditWelcomeItemImage(data.url);
                            toast({ title: "Image uploaded" });
                          }
                        } catch (err) {
                          toast({ title: "Upload failed", variant: "destructive" });
                        } finally {
                          setIsUploadingWelcomeImage(false);
                        }
                      }}
                    />
                    <Button
                      variant="outline"
                      onClick={() => welcomeImageInputRef.current?.click()}
                      disabled={isUploadingWelcomeImage}
                      className="w-full gap-2"
                    >
                      {isUploadingWelcomeImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      Upload New Image
                    </Button>
                  </div>

                  {/* Edit Name */}
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      value={editWelcomeItemName}
                      onChange={(e) => setEditWelcomeItemName(e.target.value)}
                      placeholder="Menu item name"
                      data-testid="input-edit-menu-name"
                    />
                  </div>

                  {/* Save Button */}
                  <Button
                    type="button"
                    onClick={async () => {
                      if (!editingWelcomeItem) {
                        toast({ title: "Error", description: "No item selected", variant: "destructive" });
                        return;
                      }
                      try {
                        await updateMenuItemMutation.mutateAsync({
                          id: editingWelcomeItem,
                          data: {
                            name: editWelcomeItemName,
                            image: editWelcomeItemImage,
                          },
                        });
                        setEditingWelcomeItem(null);
                        toast({ title: "Menu item updated" });
                      } catch (error) {
                        toast({ title: "Error", description: "Failed to update item", variant: "destructive" });
                      }
                    }}
                    disabled={updateMenuItemMutation.isPending}
                    className="w-full gap-2"
                    data-testid="button-save-menu-edit"
                  >
                    {updateMenuItemMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    <Save className="h-4 w-4" />
                    Save Changes
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    );
  };

  const renderMenuImport = () => {
    const targetBranch = restaurants.find(r => r.id === menuImportTarget);

    const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && file.type === 'application/pdf') {
        setMenuPdfFile(file);
        toast({ title: "PDF Uploaded", description: `${file.name} is ready for import` });
      } else {
        toast({ title: "Error", description: "Please upload a PDF file", variant: "destructive" });
      }
    };

    const handleMenuImport = async () => {
      if (!menuPdfFile || !menuImportTarget) {
        toast({ title: "Error", description: "Please upload a PDF and select a target branch", variant: "destructive" });
        return;
      }

      setIsImportingMenu(true);
      try {
        const formData = new FormData();
        formData.append('menu', menuPdfFile);
        formData.append('categoryDisplay', categoryDisplayPosition);

        const response = await fetch(`/api/restaurants/${menuImportTarget}/import-menu-pdf`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Failed to import menu");
        }

        const result = await response.json();
        toast({
          title: "Menu Import Started",
          description: `Processing menu for ${targetBranch?.name}. Categories will display in ${categoryDisplayPosition}.`,
        });

        queryClient.invalidateQueries({ queryKey: ["/api/menu"] });
        queryClient.invalidateQueries({ queryKey: ["/api/menu-categories"] });
        setMenuPdfFile(null);
        setMenuImportTarget(null);
        if (menuPdfInputRef.current) menuPdfInputRef.current.value = '';
      } catch (error) {
        console.error("Menu import error:", error);
        toast({ title: "Error", description: "Failed to import menu. Please try again.", variant: "destructive" });
      } finally {
        setIsImportingMenu(false);
      }
    };

    const handlePasteImport = async () => {
      if (!menuImportTarget || parsedMenuItems.length === 0) {
        toast({ title: "Error", description: "Please paste menu data and select a target branch", variant: "destructive" });
        return;
      }

      setIsImportingMenu(true);
      try {
        const response = await fetch(`/api/restaurants/${menuImportTarget}/import-menu-paste`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: parsedMenuItems, categoryDisplayPosition }),
        });

        if (!response.ok) {
          throw new Error("Failed to import menu");
        }

        const result = await response.json();
        toast({
          title: "Menu Imported Successfully",
          description: `Imported ${result.itemsCreated} items to ${targetBranch?.name}`,
        });

        queryClient.invalidateQueries({ queryKey: ["/api/menu"] });
        queryClient.invalidateQueries({ queryKey: ["/api/menu-categories"] });
        setPasteMenuText("");
        setParsedMenuItems([]);
        setMenuImportTarget(null);
      } catch (error) {
        console.error("Menu import error:", error);
        toast({ title: "Error", description: "Failed to import menu. Please try again.", variant: "destructive" });
      } finally {
        setIsImportingMenu(false);
      }
    };

    return (
      <div className="space-y-6">
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-3 text-xl">
              <Upload className="h-6 w-6" />
              Menu Import
            </CardTitle>
            <CardDescription className="text-indigo-100">
              Import menu items with allergens from paste or PDF
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Import Mode Toggle */}
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-2 p-1 bg-muted rounded-lg">
            <Button
              variant={importMode === "paste" ? "default" : "ghost"}
              className="flex-1"
              onClick={() => setImportMode("paste")}
            >
              <ClipboardPaste className="h-4 w-4 mr-2" />
              Paste Menu
            </Button>
            <Button
              variant={importMode === "pdf" ? "default" : "ghost"}
              className="flex-1"
              onClick={() => setImportMode("pdf")}
            >
              <FileText className="h-4 w-4 mr-2" />
              Upload PDF
            </Button>
          </div>
        </div>

        <div className="max-w-3xl mx-auto space-y-6">
          {/* Paste Mode */}
          {importMode === "paste" && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ClipboardPaste className="h-5 w-5" />
                    Step 1: Paste Menu Text & Images
                  </CardTitle>
                  <CardDescription>
                    Paste from Word/PDF - text and images will be captured automatically
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div 
                    ref={pasteAreaRef}
                    onPaste={handleRichPaste}
                    className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 hover:border-primary transition-colors"
                  >
                    <Textarea
                      placeholder={`Paste from Word or PDF here...\n\n"Vegetarian Starters"\nHara Bhara Kebab\n£8.20\nSpiced minced vegetables and grated Cottage cheese patties.\nContains Gluten, Contains Milk, Vegetarian, Hot, Contains Mustard\n\n📷 Images pasted from clipboard will be uploaded automatically!`}
                      value={pasteMenuText}
                      onChange={(e) => {
                        setPasteMenuText(e.target.value);
                        const parsed = parseMenuText(e.target.value);
                        setParsedMenuItems(parsed);
                      }}
                      onPaste={handleRichPaste}
                      className="min-h-[200px] font-mono text-sm border-0 focus-visible:ring-0"
                      data-testid="textarea-paste-menu"
                    />
                  </div>
                  
                  {isUploadingImages && (
                    <div className="flex items-center gap-2 text-primary">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Uploading images...</span>
                    </div>
                  )}
                  
                  {pastedImages.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" />
                        Uploaded Images ({pastedImages.length})
                      </p>
                      <div className="grid grid-cols-4 gap-2">
                        {pastedImages.map((img) => (
                          <div key={img.filename} className="relative group">
                            <img 
                              src={img.url} 
                              alt={img.filename}
                              className="w-full h-20 object-cover rounded-lg border"
                            />
                            <Button
                              size="sm"
                              variant="destructive"
                              className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => {
                                setPastedImages(pastedImages.filter(i => i.filename !== img.filename));
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Click on menu items in preview to assign images
                      </p>
                    </div>
                  )}
                  
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 rounded-lg space-y-2">
                    <p className="text-sm text-blue-800 dark:text-blue-200 font-medium flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      How to format your menu:
                    </p>
                    <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
                      <li><strong>Categories:</strong> Use **Category Name** with asterisks on both sides</li>
                      <li><strong>Item name:</strong> On its own line</li>
                      <li><strong>Options:</strong> "Choose 1-7" or "Required" on next line (if needed)</li>
                      <li><strong>Tags:</strong> Veg, Hot, Spicy, Halal icons on next line (if needed)</li>
                      <li><strong>Price:</strong> On the next line (£5.99)</li>
                      <li><strong>Description:</strong> On the following line</li>
                      <li><strong>Allergens:</strong> "Contains Gluten, Milk" after description</li>
                      <li><strong>Images:</strong> Copy from Canva/Word → Paste → Images appear in gallery (PNG, JPG, SVG, GIF)</li>
                    </ul>
                    <div className="mt-2 p-2 bg-white dark:bg-gray-900 rounded border text-xs font-mono space-y-0.5">
                      <p className="text-blue-600 font-bold">**Starters**</p>
                      <p>Samosa</p>
                      <p className="text-purple-600">Choose 1-3</p>
                      <p className="text-pink-600">Veg, Hot</p>
                      <p className="text-green-600">£3.50</p>
                      <p className="text-gray-600">Crispy pastry filled with spiced potatoes</p>
                      <p className="text-orange-600">Contains Gluten</p>
                    </div>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                      Tip: Paste from Canva/Word → Images appear in gallery → Click menu item → Click image to assign
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Parsed Preview */}
              {parsedMenuItems.length > 0 && (
                <Card className="border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-emerald-700">
                      <Check className="h-5 w-5" />
                      Parsed Items Preview ({parsedMenuItems.length} items)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 max-h-[400px] overflow-y-auto">
                      {Object.entries(
                        parsedMenuItems.reduce((acc, item) => {
                          if (!acc[item.category]) acc[item.category] = [];
                          acc[item.category].push(item);
                          return acc;
                        }, {} as Record<string, typeof parsedMenuItems>)
                      ).map(([category, items]) => (
                        <div key={category} className="space-y-2">
                          <h4 className="font-semibold text-sm text-emerald-800 border-b pb-1">{category}</h4>
                          {items.map((item, idx) => {
                            const globalIdx = parsedMenuItems.findIndex(p => p.name === item.name && p.category === item.category);
                            return (
                              <div 
                                key={idx} 
                                className={`bg-white dark:bg-gray-900 rounded-lg p-3 shadow-sm border cursor-pointer transition-all ${selectedItemForImage === globalIdx ? 'ring-2 ring-primary' : ''} ${pastedImages.length > 0 ? 'hover:ring-2 hover:ring-primary/50' : ''}`}
                                onClick={() => {
                                  if (pastedImages.length > 0 && selectedItemForImage !== globalIdx) {
                                    setSelectedItemForImage(globalIdx);
                                  } else {
                                    setSelectedItemForImage(null);
                                  }
                                }}
                              >
                                <div className="flex gap-3">
                                  {item.imageUrl ? (
                                    <img src={item.imageUrl} alt={item.name} className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
                                  ) : pastedImages.length > 0 && selectedItemForImage === globalIdx ? (
                                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg flex-shrink-0 flex flex-col items-center justify-center gap-1">
                                      <p className="text-xs text-center text-muted-foreground px-1">Click image below</p>
                                    </div>
                                  ) : null}
                                  <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <p className="font-medium">{item.name}</p>
                                        {item.description && (
                                          <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                                        )}
                                        <div className="flex flex-wrap gap-1 mt-2">
                                          {item.allergens.map((allergen, i) => (
                                            <span key={i} className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
                                              {allergen}
                                            </span>
                                          ))}
                                          {item.tags.map((tag, i) => (
                                            <span key={i} className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                                              {tag}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                      <span className="font-bold text-emerald-600">£{item.price}</span>
                                    </div>
                                  </div>
                                </div>
                                {selectedItemForImage === globalIdx && pastedImages.length > 0 && (
                                  <div className="mt-3 pt-3 border-t">
                                    <p className="text-xs font-medium mb-2">Click an image to assign:</p>
                                    <div className="flex gap-2 flex-wrap">
                                      {pastedImages.map((img) => (
                                        <img 
                                          key={img.filename}
                                          src={img.url} 
                                          alt={img.filename}
                                          className="w-12 h-12 object-cover rounded cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const updated = [...parsedMenuItems];
                                            updated[globalIdx] = { ...updated[globalIdx], imageUrl: img.url };
                                            setParsedMenuItems(updated);
                                            setSelectedItemForImage(null);
                                          }}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Select Branch */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Store className="h-5 w-5" />
                    Step 2: Select Target Branch
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Select 
                    value={menuImportTarget || ""} 
                    onValueChange={(value) => {
                      setMenuImportTarget(value);
                      // Auto-set category display position from selected branch
                      const selectedBranch = restaurants.find(r => r.id === value);
                      if (selectedBranch?.categoryDisplayPosition) {
                        setCategoryDisplayPosition(selectedBranch.categoryDisplayPosition as "header" | "sidebar");
                      }
                    }}
                  >
                    <SelectTrigger className={`${menuImportTarget ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30' : ''}`} data-testid="select-paste-target">
                      <SelectValue placeholder="Select target branch" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px] overflow-y-auto">
                      {restaurants.map(r => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.name} {r.categoryDisplayPosition === 'sidebar' ? '(Sidebar)' : '(Header)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {/* Show existing categories for selected branch */}
                  {menuImportTarget && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm font-medium mb-2">Existing Categories:</p>
                      <div className="flex flex-wrap gap-2">
                        {(() => {
                          const branchCategories = dbCategories?.filter((cat: any) => cat.restaurantId === menuImportTarget) || [];
                          if (branchCategories.length === 0) {
                            return <span className="text-sm text-muted-foreground">No categories yet</span>;
                          }
                          return branchCategories.map((cat: any) => (
                            <span key={cat.id} className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                              {cat.name}
                            </span>
                          ));
                        })()}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Category Display Position */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <LayoutGrid className="h-5 w-5" />
                    Step 3: Category Display Position
                  </CardTitle>
                  <CardDescription>
                    Choose where to show categories on the menu page
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-primary ${
                        categoryDisplayPosition === 'header' ? 'border-primary bg-primary/5' : 'border-muted'
                      }`}
                      onClick={() => setCategoryDisplayPosition('header')}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-full h-20 bg-muted rounded-md relative overflow-hidden">
                          <div className="absolute top-0 left-0 right-0 h-6 bg-primary/30 flex items-center justify-center gap-1 px-2">
                            <div className="w-8 h-3 bg-primary/50 rounded-sm"></div>
                            <div className="w-8 h-3 bg-primary/50 rounded-sm"></div>
                            <div className="w-8 h-3 bg-primary/50 rounded-sm"></div>
                          </div>
                          <div className="absolute top-8 left-2 right-2 bottom-2 bg-background/50 rounded-sm"></div>
                        </div>
                        <span className="font-medium text-sm">Top Header</span>
                        <p className="text-xs text-muted-foreground text-center">
                          Categories shown as tabs at the top
                        </p>
                      </div>
                    </div>
                    
                    <div
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-primary ${
                        categoryDisplayPosition === 'sidebar' ? 'border-primary bg-primary/5' : 'border-muted'
                      }`}
                      onClick={() => setCategoryDisplayPosition('sidebar')}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-full h-20 bg-muted rounded-md relative overflow-hidden">
                          <div className="absolute top-0 left-0 bottom-0 w-8 bg-primary/30 flex flex-col items-center pt-1 gap-1">
                            <div className="w-5 h-2 bg-primary/50 rounded-sm"></div>
                            <div className="w-5 h-2 bg-primary/50 rounded-sm"></div>
                            <div className="w-5 h-2 bg-primary/50 rounded-sm"></div>
                          </div>
                          <div className="absolute top-2 left-10 right-2 bottom-2 bg-background/50 rounded-sm"></div>
                        </div>
                        <span className="font-medium text-sm">Sidebar</span>
                        <p className="text-xs text-muted-foreground text-center">
                          Categories shown on the left side
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Import Button */}
              <Button
                onClick={handlePasteImport}
                disabled={parsedMenuItems.length === 0 || !menuImportTarget || isImportingMenu}
                className="w-full gap-2 h-12 text-lg"
                size="lg"
              >
                {isImportingMenu ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Importing Menu...
                  </>
                ) : (
                  <>
                    <Upload className="h-5 w-5" />
                    Import {parsedMenuItems.length} Items to Branch
                  </>
                )}
              </Button>
            </>
          )}

          {/* PDF Mode */}
          {importMode === "pdf" && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Step 1: Upload PDF Menu
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div 
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all hover:border-primary hover:bg-primary/5 ${
                      menuPdfFile ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' : 'border-muted-foreground/25'
                    }`}
                    onClick={() => menuPdfInputRef.current?.click()}
                  >
                    <input
                      ref={menuPdfInputRef}
                      type="file"
                      accept=".pdf"
                      onChange={handlePdfUpload}
                      className="hidden"
                      data-testid="input-pdf-upload"
                    />
                    {menuPdfFile ? (
                      <div className="space-y-2">
                        <FileText className="h-12 w-12 mx-auto text-emerald-600" />
                        <p className="font-medium text-emerald-700">{menuPdfFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(menuPdfFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuPdfFile(null);
                            if (menuPdfInputRef.current) menuPdfInputRef.current.value = '';
                          }}
                          className="mt-2"
                        >
                          <X className="h-4 w-4 mr-1" /> Remove
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="h-12 w-12 mx-auto text-muted-foreground/50" />
                        <p className="font-medium">Click to upload PDF menu</p>
                        <p className="text-sm text-muted-foreground">
                          or drag and drop your menu file here
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Store className="h-5 w-5" />
                    Step 2: Select Target Branch
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={menuImportTarget || ""} onValueChange={setMenuImportTarget}>
                    <SelectTrigger className={`${menuImportTarget ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30' : ''}`} data-testid="select-import-target">
                      <SelectValue placeholder="Select target branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {restaurants.map(r => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <LayoutGrid className="h-5 w-5" />
                    Step 3: Category Display Position
                  </CardTitle>
                  <CardDescription>
                    Choose where to show categories on the menu page
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-primary ${
                        categoryDisplayPosition === 'header' ? 'border-primary bg-primary/5' : 'border-muted'
                      }`}
                      onClick={() => setCategoryDisplayPosition('header')}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-full h-20 bg-muted rounded-md relative overflow-hidden">
                          <div className="absolute top-0 left-0 right-0 h-6 bg-primary/30 flex items-center justify-center gap-1 px-2">
                            <div className="w-8 h-3 bg-primary/50 rounded-sm"></div>
                            <div className="w-8 h-3 bg-primary/50 rounded-sm"></div>
                            <div className="w-8 h-3 bg-primary/50 rounded-sm"></div>
                          </div>
                          <div className="absolute top-8 left-2 right-2 bottom-2 bg-background/50 rounded-sm"></div>
                        </div>
                        <span className="font-medium text-sm">Top Header</span>
                        <p className="text-xs text-muted-foreground text-center">
                          Categories shown as tabs at the top
                        </p>
                      </div>
                    </div>
                    
                    <div
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-primary ${
                        categoryDisplayPosition === 'sidebar' ? 'border-primary bg-primary/5' : 'border-muted'
                      }`}
                      onClick={() => setCategoryDisplayPosition('sidebar')}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-full h-20 bg-muted rounded-md relative overflow-hidden">
                          <div className="absolute top-0 left-0 bottom-0 w-8 bg-primary/30 flex flex-col items-center pt-1 gap-1">
                            <div className="w-5 h-2 bg-primary/50 rounded-sm"></div>
                            <div className="w-5 h-2 bg-primary/50 rounded-sm"></div>
                            <div className="w-5 h-2 bg-primary/50 rounded-sm"></div>
                          </div>
                          <div className="absolute top-2 left-10 right-2 bottom-2 bg-background/50 rounded-sm"></div>
                        </div>
                        <span className="font-medium text-sm">Sidebar</span>
                        <p className="text-xs text-muted-foreground text-center">
                          Categories shown on the left side
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Button
                onClick={handleMenuImport}
                disabled={!menuPdfFile || !menuImportTarget || isImportingMenu}
                className="w-full gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 py-6 text-lg"
                data-testid="button-import-menu"
              >
                {isImportingMenu ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Upload className="h-5 w-5" />
                )}
                Import Menu to {targetBranch?.name || 'Branch'}
              </Button>

              {menuPdfFile && menuImportTarget && (
                <div className="p-4 border rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-emerald-800 dark:text-emerald-200">Ready to Import</p>
                      <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-1">
                        <strong>{menuPdfFile.name}</strong> will be imported to <strong>{targetBranch?.name}</strong>.
                        Categories will display in the <strong>{categoryDisplayPosition}</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  // Bulk Images - Paste multiple images and auto-assign to menu items in a category
  const renderBulkImages = () => {
    // Get categories for selected branch
    const branchCategories = (dbCategories as Array<{ id: string; restaurantId: string | null; name: string; slug: string }>)
      .filter(cat => cat.restaurantId === bulkImagesBranch);
    
    // Get selected category data
    const selectedCategoryData = branchCategories.find(cat => cat.id === bulkImagesCategory);
    
    // Get menu items for selected category (match by ID or slug for compatibility)
    const categoryMenuItems = menuItems
      .filter(item => {
        if (item.restaurantId !== bulkImagesBranch) return false;
        if (!bulkImagesCategory) return false;
        // Match by category ID or slug
        return item.category === bulkImagesCategory || 
               (selectedCategoryData && item.category === selectedCategoryData.slug);
      })
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    // Handle paste event for bulk images
    const MAX_FILE_SIZE_MB = 20;
    const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
    
    const handleBulkImagePaste = async (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const imageItems: DataTransferItem[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          imageItems.push(items[i]);
        }
      }

      if (imageItems.length === 0) return;

      setIsUploadingBulkImages(true);
      const newImages: Array<{filename: string, url: string}> = [];
      let skippedCount = 0;

      for (let i = 0; i < imageItems.length; i++) {
        const file = imageItems[i].getAsFile();
        if (file) {
          // Check file size limit (20MB max)
          if (file.size > MAX_FILE_SIZE_BYTES) {
            skippedCount++;
            console.warn(`Skipped file: ${file.name || 'image'} - exceeds ${MAX_FILE_SIZE_MB}MB limit (${(file.size / 1024 / 1024).toFixed(1)}MB)`);
            continue;
          }
          
          const filename = `img${bulkImages.length + newImages.length + 1}.${file.type.split('/')[1] || 'png'}`;
          try {
            const formData = new FormData();
            formData.append('file', file, filename);
            const response = await fetch('/api/upload-menu-image', {
              method: 'POST',
              body: formData,
            });
            if (response.ok) {
              const result = await response.json();
              newImages.push({ filename, url: result.url });
            }
          } catch (error) {
            console.error('Bulk image upload error:', error);
          }
        }
      }

      setBulkImages(prev => [...prev, ...newImages]);
      setIsUploadingBulkImages(false);
      
      if (skippedCount > 0) {
        toast({ 
          title: "Some files skipped", 
          description: `${skippedCount} file(s) exceeded the ${MAX_FILE_SIZE_MB}MB limit`,
          variant: "destructive"
        });
      }
    };

    // Auto-assign images to menu items
    const autoAssignImages = async () => {
      if (bulkImages.length === 0 || categoryMenuItems.length === 0) return;

      let successCount = 0;
      let failCount = 0;
      const assignCount = Math.min(bulkImages.length, categoryMenuItems.length);

      for (let i = 0; i < assignCount; i++) {
        const item = categoryMenuItems[i];
        const image = bulkImages[i];
        try {
          const response = await fetch(`/api/menu/${item.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: image.url })
          });
          if (response.ok) {
            successCount++;
          } else {
            failCount++;
            console.error(`Failed to update ${item.name}:`, await response.text());
          }
        } catch (error) {
          failCount++;
          console.error(`Error updating ${item.name}:`, error);
        }
      }

      queryClient.invalidateQueries({ queryKey: ["/api/menu"] });
      
      if (failCount === 0) {
        toast({ title: "Success", description: `Assigned ${successCount} images to menu items` });
        setBulkImages([]);
      } else if (successCount > 0) {
        toast({ title: "Partial Success", description: `Assigned ${successCount} images, ${failCount} failed`, variant: "default" });
        setBulkImages(prev => prev.slice(successCount));
      } else {
        toast({ title: "Error", description: "Failed to assign images", variant: "destructive" });
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <ImagePlus className="h-6 w-6" /> Bulk Images
            </h2>
            <p className="text-muted-foreground">Paste multiple images and auto-assign to menu items in order</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Step 1: Select Branch & Category</CardTitle>
            <CardDescription>Choose which branch and category to assign images to</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Select Branch</Label>
                <Select value={bulkImagesBranch} onValueChange={(val) => { setBulkImagesBranch(val); setBulkImagesCategory(""); setBulkImages([]); }}>
                  <SelectTrigger data-testid="select-bulk-images-branch">
                    <SelectValue placeholder="Choose a branch..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    {restaurants.map(r => (
                      <SelectItem key={r.id} value={r.id} data-testid={`bulk-branch-${r.id}`}>{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Select Category</Label>
                <Select value={bulkImagesCategory} onValueChange={(val) => { setBulkImagesCategory(val); setBulkImages([]); }} disabled={!bulkImagesBranch}>
                  <SelectTrigger data-testid="select-bulk-images-category">
                    <SelectValue placeholder={bulkImagesBranch ? "Choose a category..." : "Select branch first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {branchCategories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id} data-testid={`bulk-category-${cat.id}`}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {bulkImagesBranch && bulkImagesCategory && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Step 2: Menu Items in Category ({categoryMenuItems.length} items)</CardTitle>
                <CardDescription>These items will receive images in order (top to bottom = img1, img2, img3...)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto">
                  {categoryMenuItems.map((item, idx) => (
                    <div key={item.id} className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
                      <div className="flex-shrink-0 w-10 h-10 rounded bg-primary/10 flex items-center justify-center font-bold text-primary">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">img{idx + 1}</p>
                      </div>
                      {item.image && (
                        <img src={item.image} alt="" className="w-10 h-10 rounded object-cover" />
                      )}
                    </div>
                  ))}
                </div>
                {categoryMenuItems.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No menu items in this category</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Step 3: Paste Images</CardTitle>
                <CardDescription>
                  Copy images from Canva/Word and paste here. Images will be named img1, img2, img3... 
                  and assigned to items in order.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  tabIndex={0}
                  onPaste={handleBulkImagePaste}
                  data-testid="bulk-images-paste-area"
                >
                  {isUploadingBulkImages ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p>Uploading images...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <ImagePlus className="h-12 w-12 text-muted-foreground" />
                      <p className="font-medium">Click here and paste images (Ctrl+V / Cmd+V)</p>
                      <p className="text-sm text-muted-foreground">Supports PNG, JPG, GIF, SVG (max 20MB) - named img1, img2, img3...</p>
                    </div>
                  )}
                </div>

                {bulkImages.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{bulkImages.length} images ready</p>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setBulkImages([])} data-testid="button-bulk-clear">
                          <X className="h-4 w-4 mr-2" /> Clear All
                        </Button>
                        <Button onClick={autoAssignImages} disabled={categoryMenuItems.length === 0} data-testid="button-bulk-assign">
                          <Check className="h-4 w-4 mr-2" /> Assign to {Math.min(bulkImages.length, categoryMenuItems.length)} Items
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {bulkImages.map((img, idx) => {
                        const ext = img.filename.split('.').pop()?.toUpperCase() || 'IMG';
                        const isGif = ext === 'GIF';
                        return (
                          <div key={idx} className="relative group" data-testid={`bulk-image-${idx}`}>
                            <img src={img.url} alt={img.filename} className="w-full h-24 object-cover rounded-lg border" />
                            <div className="absolute bottom-1 left-1 flex gap-1">
                              <span className="bg-black/70 text-white text-xs px-2 py-0.5 rounded">img{idx + 1}</span>
                              {isGif && <span className="bg-purple-500 text-white text-xs px-1.5 py-0.5 rounded font-bold">GIF</span>}
                            </div>
                            <div className="absolute top-1 left-1 bg-primary text-white text-xs px-2 py-0.5 rounded max-w-[90%] truncate">
                              → {categoryMenuItems[idx]?.name?.substring(0, 15) || 'No item'}
                            </div>
                            <button
                              className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => setBulkImages(prev => prev.filter((_, i) => i !== idx))}
                              data-testid={`button-remove-bulk-image-${idx}`}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    );
  };

  // Category Media - Upload images, GIFs, or videos for categories
  const renderCategoryMedia = () => {
    // Get categories for selected branch
    const branchCategories = (dbCategories as Array<{ id: string; restaurantId: string | null; name: string; slug: string; imageUrl?: string | null; videoUrl?: string | null; gifUrl?: string | null }>)
      .filter(cat => cat.restaurantId === categoryMediaBranch);
    
    // Get selected category data
    const selectedCategory = branchCategories.find(cat => cat.id === categoryMediaSelected);

    // Handle file upload
    const handleCategoryMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !categoryMediaSelected) return;

      // Check file size (20MB max)
      const MAX_SIZE = 20 * 1024 * 1024;
      if (file.size > MAX_SIZE) {
        toast({ title: "File too large", description: "Maximum file size is 20MB", variant: "destructive" });
        return;
      }

      // Validate file type
      const isImage = file.type.startsWith('image/') && !file.type.includes('gif');
      const isGif = file.type === 'image/gif';
      const isVideo = file.type.startsWith('video/');

      if (categoryMediaType === 'image' && !isImage) {
        toast({ title: "Invalid file", description: "Please upload an image file (PNG, JPG, etc.)", variant: "destructive" });
        return;
      }
      if (categoryMediaType === 'gif' && !isGif) {
        toast({ title: "Invalid file", description: "Please upload a GIF file", variant: "destructive" });
        return;
      }
      if (categoryMediaType === 'video' && !isVideo) {
        toast({ title: "Invalid file", description: "Please upload a video file (MP4, WebM, etc.)", variant: "destructive" });
        return;
      }

      setIsUploadingCategoryMedia(categoryMediaType);

      try {
        const formData = new FormData();
        formData.append('file', file);
        const response = await fetch('/api/upload-menu-image', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          
          // Update category with the new media URL
          const updateData: any = {};
          if (categoryMediaType === 'image') {
            updateData.imageUrl = result.url;
          } else if (categoryMediaType === 'gif') {
            updateData.gifUrl = result.url;
          } else if (categoryMediaType === 'video') {
            updateData.videoUrl = result.url;
          }

          const updateResponse = await fetch(`/api/menu-categories/${categoryMediaSelected}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
          });

          if (updateResponse.ok) {
            toast({ title: "Success", description: `Category ${categoryMediaType} updated successfully` });
            queryClient.invalidateQueries({ queryKey: ["/api/menu-categories"] });
          } else {
            toast({ title: "Error", description: "Failed to update category", variant: "destructive" });
          }
        } else {
          toast({ title: "Error", description: "Failed to upload file", variant: "destructive" });
        }
      } catch (error) {
        console.error('Category media upload error:', error);
        toast({ title: "Error", description: "Upload failed", variant: "destructive" });
      }

      setIsUploadingCategoryMedia(null);
      e.target.value = '';
    };

    // Remove media from category
    const removeCategoryMedia = async (type: 'image' | 'gif' | 'video') => {
      if (!categoryMediaSelected) return;

      const updateData: any = {};
      if (type === 'image') updateData.imageUrl = null;
      if (type === 'gif') updateData.gifUrl = null;
      if (type === 'video') updateData.videoUrl = null;

      try {
        const response = await fetch(`/api/menu-categories/${categoryMediaSelected}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData)
        });

        if (response.ok) {
          toast({ title: "Removed", description: `Category ${type} removed` });
          queryClient.invalidateQueries({ queryKey: ["/api/menu-categories"] });
        }
      } catch (error) {
        toast({ title: "Error", description: "Failed to remove media", variant: "destructive" });
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Images className="h-6 w-6" /> Category Media
            </h2>
            <p className="text-muted-foreground">Upload images, GIFs, or videos for category display</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Step 1: Select Branch & Category</CardTitle>
            <CardDescription>Choose which branch and category to add media to</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Select Branch</Label>
                <Select value={categoryMediaBranch} onValueChange={(val) => { setCategoryMediaBranch(val); setCategoryMediaSelected(""); }}>
                  <SelectTrigger data-testid="select-category-media-branch">
                    <SelectValue placeholder="Choose a branch..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    {restaurants.map(r => (
                      <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Select Category</Label>
                <Select value={categoryMediaSelected} onValueChange={setCategoryMediaSelected} disabled={!categoryMediaBranch}>
                  <SelectTrigger data-testid="select-category-media-category">
                    <SelectValue placeholder={categoryMediaBranch ? "Choose a category..." : "Select branch first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {branchCategories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {categoryMediaBranch && categoryMediaSelected && selectedCategory && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Step 2: Current Category Media</CardTitle>
                <CardDescription>View and manage media for "{selectedCategory.name}"</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Image */}
                  <div className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="font-semibold">Image</Label>
                      {selectedCategory.imageUrl && (
                        <Button size="sm" variant="ghost" className="text-red-500 h-7" onClick={() => removeCategoryMedia('image')}>
                          <X className="h-3 w-3 mr-1" /> Remove
                        </Button>
                      )}
                    </div>
                    {selectedCategory.imageUrl ? (
                      <img src={selectedCategory.imageUrl} alt="Category" className="w-full h-32 object-cover rounded-lg border" />
                    ) : (
                      <div className="w-full h-32 bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
                        No image
                      </div>
                    )}
                  </div>

                  {/* GIF */}
                  <div className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="font-semibold flex items-center gap-1">GIF <Badge variant="secondary" className="text-xs">Animated</Badge></Label>
                      {selectedCategory.gifUrl && (
                        <Button size="sm" variant="ghost" className="text-red-500 h-7" onClick={() => removeCategoryMedia('gif')}>
                          <X className="h-3 w-3 mr-1" /> Remove
                        </Button>
                      )}
                    </div>
                    {selectedCategory.gifUrl ? (
                      <img src={selectedCategory.gifUrl} alt="Category GIF" className="w-full h-32 object-cover rounded-lg border" />
                    ) : (
                      <div className="w-full h-32 bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
                        No GIF
                      </div>
                    )}
                  </div>

                  {/* Video */}
                  <div className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="font-semibold flex items-center gap-1">Video <Badge variant="secondary" className="text-xs">Moving</Badge></Label>
                      {selectedCategory.videoUrl && (
                        <Button size="sm" variant="ghost" className="text-red-500 h-7" onClick={() => removeCategoryMedia('video')}>
                          <X className="h-3 w-3 mr-1" /> Remove
                        </Button>
                      )}
                    </div>
                    {selectedCategory.videoUrl ? (
                      <video src={selectedCategory.videoUrl} className="w-full h-32 object-cover rounded-lg border" autoPlay loop muted playsInline />
                    ) : (
                      <div className="w-full h-32 bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
                        No video
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Step 3: Upload New Media</CardTitle>
                <CardDescription>Choose media type and upload file (max 20MB)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    variant={categoryMediaType === 'image' ? 'default' : 'outline'}
                    onClick={() => setCategoryMediaType('image')}
                    data-testid="button-media-type-image"
                  >
                    <ImageIcon className="h-4 w-4 mr-2" /> Image
                  </Button>
                  <Button
                    variant={categoryMediaType === 'gif' ? 'default' : 'outline'}
                    onClick={() => setCategoryMediaType('gif')}
                    className={categoryMediaType === 'gif' ? 'bg-purple-500 hover:bg-purple-600' : ''}
                    data-testid="button-media-type-gif"
                  >
                    <Sparkles className="h-4 w-4 mr-2" /> GIF
                  </Button>
                  <Button
                    variant={categoryMediaType === 'video' ? 'default' : 'outline'}
                    onClick={() => setCategoryMediaType('video')}
                    className={categoryMediaType === 'video' ? 'bg-blue-500 hover:bg-blue-600' : ''}
                    data-testid="button-media-type-video"
                  >
                    <Video className="h-4 w-4 mr-2" /> Video
                  </Button>
                </div>

                <div className="border-2 border-dashed rounded-lg p-8">
                  <input
                    type="file"
                    accept={
                      categoryMediaType === 'image' ? 'image/png,image/jpeg,image/jpg,image/webp,image/svg+xml' :
                      categoryMediaType === 'gif' ? 'image/gif' :
                      'video/mp4,video/webm,video/ogg'
                    }
                    onChange={handleCategoryMediaUpload}
                    className="hidden"
                    id="category-media-upload"
                    disabled={isUploadingCategoryMedia !== null}
                  />
                  <label htmlFor="category-media-upload" className="cursor-pointer flex flex-col items-center gap-2">
                    {isUploadingCategoryMedia === categoryMediaType ? (
                      <>
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p>Uploading {categoryMediaType}...</p>
                      </>
                    ) : (
                      <>
                        <Upload className="h-12 w-12 text-muted-foreground" />
                        <p className="font-medium">Click to upload {categoryMediaType}</p>
                        <p className="text-sm text-muted-foreground">
                          {categoryMediaType === 'image' && 'PNG, JPG, WebP, SVG (max 20MB)'}
                          {categoryMediaType === 'gif' && 'GIF files only (max 20MB)'}
                          {categoryMediaType === 'video' && 'MP4, WebM, OGG (max 20MB)'}
                        </p>
                      </>
                    )}
                  </label>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    );
  };

  const renderReplaceMenu = () => {
    const targetBranchData = restaurants.find(r => r.id === replaceTargetBranch);
    
    // Get existing categories from target branch (use full objects from menu-categories table)
    // dbCategories is fetched at component level
    const targetBranchCategoriesData = (dbCategories as Array<{ id: string; restaurantId: string | null; name: string; slug: string }>)
      .filter(cat => cat.restaurantId === replaceTargetBranch);

    // Parse categories from pasted text (one per line)
    const parseCategoriesText = (text: string) => {
      return text
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
    };

    // Handle creating categories from paste
    const handlePasteCategories = async () => {
      if (!replaceTargetBranch || parsedCategories.length === 0) {
        toast({ title: "Error", description: "Please select a branch and paste category names", variant: "destructive" });
        return;
      }
      
      setIsReplacingMenu(true);
      try {
        for (const categoryName of parsedCategories) {
          const slug = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
          await fetch('/api/menu-categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              restaurantId: replaceTargetBranch,
              slug: slug,
              name: categoryName,
              icon: "🍽️",
              sortOrder: 0,
              isEnabled: true,
            }),
          });
        }
        
        queryClient.invalidateQueries({ queryKey: ["/api/menu-categories"] });
        queryClient.invalidateQueries({ queryKey: ["/api/menu-categories", replaceTargetBranch] });
        toast({ title: "Success", description: `Created ${parsedCategories.length} categories in ${targetBranchData?.name}` });
        setPasteCategoriesText("");
        setParsedCategories([]);
      } catch (error) {
        toast({ title: "Error", description: "Failed to create categories", variant: "destructive" });
      } finally {
        setIsReplacingMenu(false);
      }
    };

    // Handle creating all (categories + items) from paste
    const handlePasteAll = async () => {
      console.log("=== handlePasteAll START ===");
      console.log("Branch:", replaceTargetBranch);
      console.log("Categories:", parsedAllData.categories);
      console.log("Items count:", parsedAllData.items.length);
      console.log("Items:", parsedAllData.items.map(i => ({ name: i.name, category: i.category, price: i.price })));
      
      if (!replaceTargetBranch || parsedAllData.categories.length === 0) {
        toast({ title: "Error", description: "Please select a branch and paste menu content", variant: "destructive" });
        return;
      }
      
      setIsReplacingMenu(true);
      try {
        // Get existing categories for this branch
        const existingCategoriesResponse = await fetch(`/api/menu-categories?restaurantId=${replaceTargetBranch}`);
        const existingCategories = await existingCategoriesResponse.json();
        const existingCategoryNames = new Set((existingCategories || []).map((c: any) => c.name.toLowerCase().trim()));
        const existingCategoryMap: Record<string, string> = {};
        (existingCategories || []).forEach((c: any) => {
          existingCategoryMap[c.name.toLowerCase().trim()] = c.id;
        });
        
        // First create all categories (skip existing ones in append mode)
        const categoryIdMap: Record<string, string> = {};
        const categoryIdMapNormalized: Record<string, string> = {};
        let newCategoriesCount = 0;
        let skippedCategoriesCount = 0;
        
        for (const categoryName of parsedAllData.categories) {
          const categoryKey = categoryName.toLowerCase().trim();
          
          // Check if category already exists
          if (appendMode && existingCategoryNames.has(categoryKey)) {
            // Use existing category ID
            categoryIdMap[categoryName] = existingCategoryMap[categoryKey];
            categoryIdMapNormalized[categoryKey] = existingCategoryMap[categoryKey];
            skippedCategoriesCount++;
            continue;
          }
          
          const slug = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
          const response = await fetch('/api/menu-categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              restaurantId: replaceTargetBranch,
              slug: slug,
              name: categoryName,
              icon: "🍽️",
              sortOrder: 0,
              isEnabled: true,
            }),
          });
          const data = await response.json();
          if (data.id) {
            categoryIdMap[categoryName] = data.id;
            categoryIdMapNormalized[categoryKey] = data.id;
            newCategoriesCount++;
          }
        }
        
        console.log("Category ID Map:", categoryIdMap);
        console.log("Category ID Map Normalized:", categoryIdMapNormalized);
        
        // Then create all menu items
        console.log(`Creating ${parsedAllData.items.length} menu items...`);
        let createdItemsCount = 0;
        
        for (const item of parsedAllData.items) {
          const allergenProfile: Record<string, string> = {};
          for (const allergen of item.allergens) {
            const key = allergen.toLowerCase().replace(/\s+/g, '');
            allergenProfile[key] = 'contains';
          }
          
          // Use category ID if available - try exact match first, then normalized
          const itemCategoryKey = item.category.toLowerCase().trim();
          let categoryId = categoryIdMap[item.category] || categoryIdMapNormalized[itemCategoryKey];
          console.log(`Item: ${item.name}, Category: "${item.category}", Normalized: "${itemCategoryKey}", CategoryId: ${categoryId}`);
          
          if (!categoryId) {
            // Category wasn't created yet - create it now
            const slug = item.category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
            const catResponse = await fetch('/api/menu-categories', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                restaurantId: replaceTargetBranch,
                slug: slug,
                name: item.category,
                icon: "🍽️",
                sortOrder: 0,
                isEnabled: true,
              }),
            });
            const catData = await catResponse.json();
            if (catData.id) {
              categoryId = catData.id;
              categoryIdMap[item.category] = catData.id;
            } else {
              // Fallback: use slug as category (will be matched via slug on menu page)
              categoryId = slug;
            }
          }
          
          try {
            const menuResponse = await fetch('/api/menu', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                restaurantId: replaceTargetBranch,
                name: item.name,
                description: item.description || "",
                price: item.price,
                category: categoryId,
                image: item.imageUrl || "",
                available: true,
                allergenProfile: allergenProfile,
              }),
            });
            const menuResult = await menuResponse.json();
            if (menuResponse.ok) {
              createdItemsCount++;
              console.log(`Created menu item: ${item.name}`, menuResult);
            } else {
              console.error(`Failed to create menu item: ${item.name}`, menuResult);
            }
          } catch (menuError) {
            console.error(`Error creating menu item: ${item.name}`, menuError);
          }
        }
        
        console.log(`Successfully created ${createdItemsCount} of ${parsedAllData.items.length} menu items`);
        
        queryClient.invalidateQueries({ queryKey: ["/api/menu"] });
        queryClient.invalidateQueries({ queryKey: ["/api/menu", replaceTargetBranch] });
        queryClient.invalidateQueries({ queryKey: ["/api/menu-categories"] });
        queryClient.invalidateQueries({ queryKey: ["/api/menu-categories", replaceTargetBranch] });
        
        const catMessage = skippedCategoriesCount > 0 
          ? `${newCategoriesCount} new categories (${skippedCategoriesCount} existing)`
          : `${newCategoriesCount} categories`;
        
        toast({ 
          title: "Success", 
          description: `Created ${catMessage} and ${createdItemsCount} of ${parsedAllData.items.length} menu items in ${targetBranchData?.name}` 
        });
        setPasteAllText("");
        setParsedAllData({ categories: [], items: [] });
        setPasteAllImages([]);
        setSelectedAllItemForImage(null);
      } catch (error) {
        toast({ title: "Error", description: "Failed to create menu", variant: "destructive" });
      } finally {
        setIsReplacingMenu(false);
      }
    };

    // Handle creating menu items from paste
    const handlePasteItems = async () => {
      if (!replaceTargetBranch || !selectedReplaceCategory || parsedReplaceItems.length === 0) {
        toast({ title: "Error", description: "Please select a branch, category, and paste menu items", variant: "destructive" });
        return;
      }
      
      setIsReplacingMenu(true);
      try {
        for (const item of parsedReplaceItems) {
          // Convert allergens to allergenProfile format
          const allergenProfile: Record<string, string> = {};
          for (const allergen of item.allergens) {
            const key = allergen.toLowerCase().replace(/\s+/g, '');
            allergenProfile[key] = 'contains';
          }
          
          await fetch('/api/menu', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              restaurantId: replaceTargetBranch,
              name: item.name,
              description: item.description || "",
              price: item.price,
              category: selectedReplaceCategory,
              image: "",
              available: true,
              allergenProfile: allergenProfile,
            }),
          });
        }
        
        queryClient.invalidateQueries({ queryKey: ["/api/menu"] });
        queryClient.invalidateQueries({ queryKey: ["/api/menu", replaceTargetBranch] });
        const selectedCategoryName = targetBranchCategoriesData.find(c => c.id === selectedReplaceCategory)?.name || selectedReplaceCategory;
        toast({ title: "Success", description: `Created ${parsedReplaceItems.length} menu items in "${selectedCategoryName}"` });
        setPasteItemsText("");
        setParsedReplaceItems([]);
      } catch (error) {
        toast({ title: "Error", description: "Failed to create menu items", variant: "destructive" });
      } finally {
        setIsReplacingMenu(false);
      }
    };

    // Get menu items for branch
    const branchMenuItemsList = menuItems?.filter(m => m.restaurantId === replaceTargetBranch) || [];

    return (
      <div className="flex gap-6 h-[calc(100vh-10rem)]">
        {/* Branch Sidebar */}
        <div className="w-72 bg-card border rounded-xl overflow-hidden flex flex-col shrink-0">
          <div className="p-4 border-b bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
            <h3 className="font-bold flex items-center gap-2">
              <RefreshCw className="h-4 w-4" /> Replace Menu
            </h3>
            <p className="text-xs text-emerald-100 mt-1">Select a branch to manage</p>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {restaurants.map(r => {
                const itemCount = menuItems.filter(m => m.restaurantId === r.id).length;
                const categoryCount = getBranchSpecificCategories(r.id).length;
                return (
                  <button
                    key={r.id}
                    onClick={() => {
                      setReplaceTargetBranch(r.id);
                      setParsedCategories([]);
                      setParsedReplaceItems([]);
                      setSelectedReplaceCategory("");
                      setSelectedMenuSection("all");
                    }}
                    className={`w-full text-left p-3 rounded-lg transition-all ${
                      replaceTargetBranch === r.id 
                        ? 'bg-primary text-primary-foreground' 
                        : 'hover:bg-secondary/50'
                    }`}
                    data-testid={`replace-menu-branch-${r.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className={`h-10 w-10 rounded-lg flex items-center justify-center font-bold text-sm ${
                          replaceTargetBranch === r.id 
                            ? 'bg-primary-foreground/20 text-primary-foreground' 
                            : 'bg-primary/10 text-primary'
                        }`}
                      >
                        {r.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{r.name}</p>
                        <p className={`text-xs truncate ${replaceTargetBranch === r.id ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                          {r.address}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge variant="outline" className={`text-[10px] ${replaceTargetBranch === r.id ? 'border-primary-foreground/30 text-primary-foreground' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
                        {categoryCount} categories
                      </Badge>
                      <Badge variant="outline" className={`text-[10px] ${replaceTargetBranch === r.id ? 'border-primary-foreground/30 text-primary-foreground' : ''}`}>
                        {itemCount} items
                      </Badge>
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {!replaceTargetBranch ? (
            <Card className="flex-1 flex items-center justify-center">
              <CardContent className="text-center">
                <Store className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Select a Branch</h3>
                <p className="text-muted-foreground">Choose a branch from the left to manage its menu</p>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="flex-1">
              <div className="space-y-6 pr-4">
                {/* Current Branch Data Cards */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Categories Card */}
                  <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2 text-blue-700">
                        <LayoutGrid className="h-4 w-4" />
                        Categories
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-blue-600">{targetBranchCategoriesData?.length || 0}</p>
                      <div className="mt-2 max-h-20 overflow-y-auto">
                        {targetBranchCategoriesData?.slice(0, 5).map((cat: { id: string; name: string }) => (
                          <Badge key={cat.id} variant="secondary" className="text-[10px] mr-1 mb-1">
                            {cat.name}
                          </Badge>
                        ))}
                        {(targetBranchCategoriesData?.length || 0) > 5 && (
                          <span className="text-xs text-muted-foreground">+{targetBranchCategoriesData.length - 5} more</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Menu Items Card */}
                  <Card className="border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2 text-emerald-700">
                        <UtensilsCrossed className="h-4 w-4" />
                        Menu Items
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-emerald-600">{branchMenuItemsList.length}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Items in this branch
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Hierarchical Category Tree View */}
                <Card className="border-indigo-200 bg-indigo-50/50 dark:bg-indigo-950/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 text-indigo-700">
                      <LayoutGrid className="h-4 w-4" />
                      Category Structure
                    </CardTitle>
                    <CardDescription>
                      Hierarchical view of categories (parent → children)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="max-h-[300px]">
                      <div className="space-y-2">
                        {(() => {
                          // Build hierarchical category structure
                          const parentCategories = targetBranchCategoriesData?.filter((c: any) => !c.parentId) || [];
                          const childCategories = targetBranchCategoriesData?.filter((c: any) => c.parentId) || [];
                          
                          if (parentCategories.length === 0 && childCategories.length === 0) {
                            return (
                              <p className="text-sm text-muted-foreground text-center py-4">
                                No categories yet. Add categories using the paste options below.
                              </p>
                            );
                          }
                          
                          return parentCategories.map((parent: any) => {
                            const children = childCategories.filter((c: any) => c.parentId === parent.id);
                            const hasChildren = children.length > 0;
                            const menuItemCount = branchMenuItemsList.filter(item => 
                              item.category === parent.id || item.category === parent.slug
                            ).length;
                            
                            return (
                              <div key={parent.id} className="border rounded-lg overflow-hidden bg-white dark:bg-gray-900">
                                {/* Parent Category */}
                                <div className="flex items-center justify-between px-3 py-2 bg-indigo-100 dark:bg-indigo-900/30">
                                  <div className="flex items-center gap-2">
                                    {hasChildren && (
                                      <ChevronRight className="h-4 w-4 text-indigo-600" />
                                    )}
                                    <span className="font-medium text-indigo-800 dark:text-indigo-200">
                                      {parent.name}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {hasChildren && (
                                      <Badge variant="outline" className="text-[10px] bg-purple-100 text-purple-700 border-purple-300">
                                        {children.length} sub
                                      </Badge>
                                    )}
                                    <Badge variant="outline" className="text-[10px]">
                                      {menuItemCount} items
                                    </Badge>
                                  </div>
                                </div>
                                
                                {/* Child Categories */}
                                {hasChildren && (
                                  <div className="border-t border-indigo-100 dark:border-indigo-900">
                                    {children.map((child: any) => {
                                      const childItemCount = branchMenuItemsList.filter(item => 
                                        item.category === child.id || item.category === child.slug
                                      ).length;
                                      
                                      return (
                                        <div 
                                          key={child.id} 
                                          className="flex items-center justify-between px-3 py-1.5 pl-8 border-b last:border-b-0 border-indigo-50 dark:border-indigo-900/50 hover:bg-indigo-50 dark:hover:bg-indigo-950/20"
                                        >
                                          <span className="text-sm text-muted-foreground">
                                            └ {child.name}
                                          </span>
                                          <Badge variant="outline" className="text-[9px]">
                                            {childItemCount} items
                                          </Badge>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          });
                        })()}
                        
                        {/* Show orphaned children (categories with parentId but parent not found) */}
                        {(() => {
                          const parentIds = new Set(targetBranchCategoriesData?.filter((c: any) => !c.parentId).map((c: any) => c.id) || []);
                          const orphanedChildren = targetBranchCategoriesData?.filter((c: any) => 
                            c.parentId && !parentIds.has(c.parentId)
                          ) || [];
                          
                          if (orphanedChildren.length === 0) return null;
                          
                          return (
                            <div className="mt-4 pt-4 border-t">
                              <p className="text-xs text-amber-600 mb-2 flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                Orphaned Categories (parent not found)
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {orphanedChildren.map((cat: any) => (
                                  <Badge key={cat.id} variant="outline" className="text-[10px] bg-amber-50 border-amber-300">
                                    {cat.name}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* Section Selector for branches with multiple menu sections (like Tawa Grill) */}
                {getMenuSections(replaceTargetBranch) && (
                  <Card className="border-purple-200 bg-purple-50/50 dark:bg-purple-950/20">
                    <CardContent className="py-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <LayoutGrid className="h-5 w-5 text-purple-600" />
                          <p className="font-medium text-purple-700">Select Menu Section</p>
                        </div>
                        <p className="text-sm text-purple-600">This branch has multiple menu sections. Select which section to manage:</p>
                        <div className="grid grid-cols-1 gap-2">
                          <Button
                            variant={selectedMenuSection === "all" ? "default" : "outline"}
                            className={`justify-start ${selectedMenuSection === "all" ? "bg-purple-600 hover:bg-purple-700" : ""}`}
                            onClick={() => setSelectedMenuSection("all")}
                          >
                            <Sparkles className="h-4 w-4 mr-2" />
                            All Sections (Entire Menu)
                          </Button>
                          {getMenuSections(replaceTargetBranch)?.map((section, idx) => (
                            <Button
                              key={section.id}
                              variant={selectedMenuSection === section.id ? "default" : "outline"}
                              className={`justify-start ${selectedMenuSection === section.id ? "bg-purple-600 hover:bg-purple-700" : ""}`}
                              onClick={() => setSelectedMenuSection(section.id)}
                            >
                              <span className="mr-2">{idx === 0 ? "🍽️" : idx === 1 ? "☀️" : "🌙"}</span>
                              Section {idx + 1}: {section.name}
                            </Button>
                          ))}
                        </div>
                        {selectedMenuSection !== "all" && (
                          <p className="text-xs text-purple-500 bg-purple-100 dark:bg-purple-900 p-2 rounded">
                            Only categories and items in "{getMenuSections(replaceTargetBranch)?.find(s => s.id === selectedMenuSection)?.name}" will be affected
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Clear All Button */}
                <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-red-700">
                          {selectedMenuSection !== "all" && getMenuSections(replaceTargetBranch) 
                            ? `Clear Section: ${getMenuSections(replaceTargetBranch)?.find(s => s.id === selectedMenuSection)?.name}`
                            : "Clear All Data"
                          }
                        </p>
                        <p className="text-sm text-red-600">
                          {selectedMenuSection !== "all" && getMenuSections(replaceTargetBranch)
                            ? "Delete categories and menu items in the selected section"
                            : "Delete all categories and menu items before adding new ones"
                          }
                        </p>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" className="gap-2">
                            <Trash2 className="h-4 w-4" />
                            {selectedMenuSection !== "all" && getMenuSections(replaceTargetBranch) ? "Clear Section" : "Clear All"}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              {selectedMenuSection !== "all" && getMenuSections(replaceTargetBranch)
                                ? `Clear "${getMenuSections(replaceTargetBranch)?.find(s => s.id === selectedMenuSection)?.name}" Section?`
                                : "Clear All Menu Data?"
                              }
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              {selectedMenuSection !== "all" && getMenuSections(replaceTargetBranch)
                                ? `This will permanently delete categories and menu items in the "${getMenuSections(replaceTargetBranch)?.find(s => s.id === selectedMenuSection)?.name}" section for ${targetBranchData?.name}. This cannot be undone.`
                                : `This will permanently delete ALL categories and menu items for ${targetBranchData?.name}. This cannot be undone.`
                              }
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-red-600 hover:bg-red-700"
                              onClick={async () => {
                                setIsReplacingMenu(true);
                                try {
                                  const sections = getMenuSections(replaceTargetBranch);
                                  const selectedSection = sections?.find(s => s.id === selectedMenuSection);
                                  
                                  let branchItems = menuItems?.filter(m => m.restaurantId === replaceTargetBranch) || [];
                                  let branchCategories = targetBranchCategoriesData || [];
                                  
                                  // If a specific section is selected, filter by section categories
                                  if (selectedMenuSection !== "all" && selectedSection) {
                                    const sectionCategorySlugs = selectedSection.categories;
                                    branchCategories = branchCategories.filter(cat => {
                                      const catSlug = cat.slug?.toLowerCase() || cat.name.toLowerCase().replace(/\s+/g, '-');
                                      return sectionCategorySlugs.some(slug => catSlug.includes(slug) || slug.includes(catSlug));
                                    });
                                    const categoryIds = new Set(branchCategories.map(c => c.id));
                                    branchItems = branchItems.filter(item => categoryIds.has(item.category));
                                  }
                                  
                                  for (const item of branchItems) {
                                    await fetch(`/api/menu/${item.id}`, { method: 'DELETE' });
                                  }
                                  const categoriesToDelete = branchCategories || [];
                                  for (const cat of branchCategories) {
                                    await fetch(`/api/menu-categories/${cat.id}`, { method: 'DELETE' });
                                  }
                                  queryClient.invalidateQueries({ queryKey: ["/api/menu"] });
                                  queryClient.invalidateQueries({ queryKey: ["/api/menu-categories"] });
                                  toast({ title: "Cleared", description: `Deleted ${branchItems.length} items and ${branchCategories.length} categories` });
                                } catch (error) {
                                  toast({ title: "Error", description: "Failed to clear menu", variant: "destructive" });
                                } finally {
                                  setIsReplacingMenu(false);
                                }
                              }}
                            >
                              Yes, Clear Everything
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>

                {/* Mode Toggle */}
                <div className="flex gap-2 p-1 bg-muted rounded-lg">
                <Button
                  variant={replaceMode === "all" ? "default" : "ghost"}
                  className="flex-1"
                  onClick={() => setReplaceMode("all")}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Paste All (Auto-Detect)
                </Button>
                <Button
                  variant={replaceMode === "categories" ? "default" : "ghost"}
                  className="flex-1"
                  onClick={() => setReplaceMode("categories")}
                >
                  <ClipboardPaste className="h-4 w-4 mr-2" />
                  Categories Only
                </Button>
                <Button
                  variant={replaceMode === "items" ? "default" : "ghost"}
                  className="flex-1"
                  onClick={() => setReplaceMode("items")}
                >
                  <ClipboardPaste className="h-4 w-4 mr-2" />
                  Items Only
                </Button>
              </div>

              {/* Append vs Replace Toggle */}
              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Add Mode</p>
                  <p className="text-xs text-blue-600 dark:text-blue-300">
                    {appendMode 
                      ? "Add to existing menu (keeps current categories & items)" 
                      : "Replace mode (use Clear All first to start fresh)"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={appendMode ? "default" : "outline"}
                    onClick={() => setAppendMode(true)}
                    className={appendMode ? "bg-blue-600 hover:bg-blue-700" : ""}
                    data-testid="button-append-mode"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add
                  </Button>
                  <Button
                    size="sm"
                    variant={!appendMode ? "default" : "outline"}
                    onClick={() => setAppendMode(false)}
                    className={!appendMode ? "bg-red-600 hover:bg-red-700" : ""}
                    data-testid="button-replace-mode"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Replace
                  </Button>
                </div>
              </div>

              {replaceMode === "all" ? (
                <>
                  {/* Paste All - Auto Detect Categories */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-amber-500" />
                        Step 3: Paste Full Menu
                      </CardTitle>
                      <CardDescription>
                        Paste your entire menu with categories. Categories will be auto-detected from headers.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Textarea
                        placeholder={`**Buy 1 get 1 free**
Chicken Burger Deal
£9.99
Two juicy chicken burgers with fries

**Metro's Saver's deals**
Family Meal
£19.99
Perfect for sharing

**Burgers**
Classic Burger
£7.50
Beef patty with cheese and salad

**Sides**
Chips
£2.99
Crispy golden fries`}
                        value={pasteAllText}
                        onChange={(e) => {
                          setPasteAllText(e.target.value);
                          const text = e.target.value;
                          
                          // Parse categories directly from **Category Name** patterns (including empty ones)
                          const categoryPattern = /\*\*([^*]+)\*\*/g;
                          const detectedCategories: string[] = [];
                          let match;
                          while ((match = categoryPattern.exec(text)) !== null) {
                            const catName = match[1].trim();
                            if (catName && !detectedCategories.includes(catName)) {
                              detectedCategories.push(catName);
                            }
                          }
                          
                          // Also parse menu items
                          const parsed = parseMenuText(text, detectedCategories);
                          
                          // Combine categories from both sources (pattern + items)
                          const itemCategories = parsed.map(item => item.category).filter(c => c !== "Uncategorized");
                          const allCategories = Array.from(new Set([...detectedCategories, ...itemCategories]));
                          
                          setParsedAllData({ categories: allCategories, items: parsed });
                        }}
                        className="min-h-[300px] font-mono text-sm"
                        data-testid="textarea-paste-all"
                      />
                      
                      <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 rounded-lg space-y-2">
                        <p className="text-sm text-amber-800 dark:text-amber-200 font-medium flex items-center gap-2">
                          <Sparkles className="h-4 w-4" />
                          How to format your menu:
                        </p>
                        <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1 list-disc list-inside">
                          <li><strong>Categories:</strong> Use **Category Name** with asterisks on both sides</li>
                          <li><strong>Item name:</strong> On its own line</li>
                          <li><strong>Options:</strong> "Choose 1-7" or "Required" on next line (if needed)</li>
                          <li><strong>Tags:</strong> Veg, Hot, Spicy, Halal icons on next line (if needed)</li>
                          <li><strong>Price:</strong> On the next line (£5.99)</li>
                          <li><strong>Description:</strong> On the following line</li>
                          <li><strong>Allergens:</strong> "Contains Gluten, Milk" after description</li>
                        </ul>
                        <div className="mt-2 p-2 bg-white dark:bg-gray-900 rounded border text-xs font-mono space-y-0.5">
                          <p className="text-amber-600 font-bold">**Starters**</p>
                          <p>Samosa</p>
                          <p className="text-purple-600">Choose 1-3</p>
                          <p className="text-pink-600">Veg, Hot</p>
                          <p className="text-green-600">£3.50</p>
                          <p className="text-gray-600">Crispy pastry filled with spiced potatoes</p>
                          <p className="text-orange-600">Contains Gluten</p>
                        </div>
                        <p className="text-xs text-amber-600 mt-2">
                          Note: To add images, use the "Paste Images" section in the sidebar after creating menu items.
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Preview */}
                  {(parsedAllData.categories.length > 0 || parsedAllData.items.length > 0) && (
                    <Card className="border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2 text-emerald-700">
                          <Check className="h-5 w-5" />
                          Preview: {parsedAllData.categories.length} Categories, {parsedAllData.items.length} Items
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Categories Preview - Badges Only */}
                        <div>
                          <p className="text-sm font-medium mb-2">Categories Detected:</p>
                          <div className="flex flex-wrap gap-2">
                            {parsedAllData.categories.map((cat, idx) => (
                              <Badge key={idx} variant="secondary" className="px-3 py-1 bg-emerald-100 text-emerald-800">
                                🍽️ {cat}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        {/* Menu Items Preview - With Image Assignment */}
                        <div className="max-h-[400px] overflow-y-auto">
                          <p className="text-sm font-medium mb-2">Menu Items ({parsedAllData.items.length}):</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {parsedAllData.items.slice(0, 30).map((item, idx) => (
                              <div 
                                key={idx} 
                                className={`bg-white dark:bg-gray-900 rounded p-2 shadow-sm border flex gap-2 items-center cursor-pointer transition-all ${selectedAllItemForImage === idx ? 'ring-2 ring-primary' : ''} ${pasteAllImages.length > 0 ? 'hover:ring-2 hover:ring-primary/50' : ''}`}
                                onClick={() => {
                                  if (pasteAllImages.length > 0 && selectedAllItemForImage !== idx) {
                                    setSelectedAllItemForImage(idx);
                                  } else {
                                    setSelectedAllItemForImage(null);
                                  }
                                }}
                              >
                                {item.imageUrl ? (
                                  <img src={item.imageUrl} alt={item.name} className="w-10 h-10 object-cover rounded flex-shrink-0" />
                                ) : pasteAllImages.length > 0 && selectedAllItemForImage === idx ? (
                                  <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded flex-shrink-0 flex items-center justify-center">
                                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                ) : null}
                                <div className="flex-1 min-w-0">
                                  <span className="font-medium text-sm truncate block">{item.name}</span>
                                  <span className="text-xs text-muted-foreground">{item.category}</span>
                                </div>
                                <span className="font-bold text-emerald-600 text-sm">£{item.price}</span>
                              </div>
                            ))}
                          </div>
                          {parsedAllData.items.length > 30 && (
                            <p className="text-xs text-muted-foreground mt-2 text-center">
                              +{parsedAllData.items.length - 30} more items...
                            </p>
                          )}
                          
                          {/* Image selection when item is selected */}
                          {selectedAllItemForImage !== null && pasteAllImages.length > 0 && (
                            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200">
                              <p className="text-sm font-medium mb-2">Click an image to assign to "{parsedAllData.items[selectedAllItemForImage]?.name}":</p>
                              <div className="flex gap-2 flex-wrap">
                                {pasteAllImages.map((img) => (
                                  <img 
                                    key={img.filename}
                                    src={img.url} 
                                    alt={img.filename}
                                    className="w-14 h-14 object-cover rounded cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const updated = { ...parsedAllData };
                                      updated.items = [...updated.items];
                                      updated.items[selectedAllItemForImage] = { ...updated.items[selectedAllItemForImage], imageUrl: img.url };
                                      setParsedAllData(updated);
                                      setSelectedAllItemForImage(null);
                                    }}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Create Button */}
                  <Button
                    onClick={handlePasteAll}
                    disabled={!replaceTargetBranch || parsedAllData.categories.length === 0 || isReplacingMenu}
                    className="w-full gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 py-6 text-lg"
                    data-testid="button-create-all"
                  >
                    {isReplacingMenu ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Sparkles className="h-5 w-5" />
                    )}
                    Create {parsedAllData.categories.length} Categories & {parsedAllData.items.length} Items in {targetBranchData?.name || 'Branch'}
                  </Button>
                </>
              ) : replaceMode === "categories" ? (
                <>
                  {/* Paste Categories */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <ClipboardPaste className="h-5 w-5" />
                        Step 3: Paste Category Names
                      </CardTitle>
                      <CardDescription>
                        Copy category names from Word/PDF and paste here (one category per line)
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Textarea
                        placeholder={`Starters\nMain Course\nBiryani\nDesserts\nDrinks`}
                        value={pasteCategoriesText}
                        onChange={(e) => {
                          setPasteCategoriesText(e.target.value);
                          setParsedCategories(parseCategoriesText(e.target.value));
                        }}
                        className="min-h-[150px] font-mono text-sm"
                        data-testid="textarea-paste-categories"
                      />
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <AlertTriangle className="h-4 w-4" />
                        Paste one category name per line
                      </div>
                    </CardContent>
                  </Card>

                  {/* Parsed Categories Preview */}
                  {parsedCategories.length > 0 && (
                    <Card className="border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2 text-emerald-700">
                          <Check className="h-5 w-5" />
                          Categories Preview ({parsedCategories.length} categories)
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {parsedCategories.map((cat, idx) => (
                            <Badge key={idx} variant="secondary" className="px-3 py-1">
                              🍽️ {cat}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Create Categories Button */}
                  <Button
                    onClick={handlePasteCategories}
                    disabled={!replaceTargetBranch || parsedCategories.length === 0 || isReplacingMenu}
                    className="w-full gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 py-6 text-lg"
                    data-testid="button-create-categories"
                  >
                    {isReplacingMenu ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Plus className="h-5 w-5" />
                    )}
                    Create {parsedCategories.length} Categories in {targetBranchData?.name || 'Branch'}
                  </Button>
                </>
              ) : (
                <>
                  {/* Select Category for Items */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <LayoutGrid className="h-5 w-5" />
                        Step 3: Select Category
                      </CardTitle>
                      <CardDescription>
                        Choose which category to add menu items to
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Select value={selectedReplaceCategory} onValueChange={setSelectedReplaceCategory}>
                        <SelectTrigger data-testid="select-replace-category">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          {targetBranchCategoriesData.map(cat => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </CardContent>
                  </Card>

                  {selectedReplaceCategory && (
                    <>
                      {/* Paste Menu Items */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <ClipboardPaste className="h-5 w-5" />
                            Step 3: Paste Menu Items
                          </CardTitle>
                          <CardDescription>
                            Copy menu items from Word/PDF and paste here. Same format as Menu Import.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <Textarea
                            placeholder={`Chicken Tikka\n£8.50\nTender pieces of chicken marinated in spices\nContains Gluten, Contains Milk\n\nLamb Seekh Kebab\n£9.00\nMinced lamb with herbs and spices\nContains Gluten`}
                            value={pasteItemsText}
                            onChange={(e) => {
                              setPasteItemsText(e.target.value);
                              const parsed = parseMenuText(e.target.value);
                              setParsedReplaceItems(parsed);
                            }}
                            className="min-h-[200px] font-mono text-sm"
                            data-testid="textarea-paste-items"
                          />
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <AlertTriangle className="h-4 w-4" />
                            Format: Item name, price, description, allergens (one item per block)
                          </div>
                        </CardContent>
                      </Card>

                      {/* Parsed Items Preview */}
                      {parsedReplaceItems.length > 0 && (
                        <Card className="border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20">
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2 text-emerald-700">
                              <Check className="h-5 w-5" />
                              Items Preview ({parsedReplaceItems.length} items for "{targetBranchCategoriesData.find(c => c.id === selectedReplaceCategory)?.name || selectedReplaceCategory}")
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3 max-h-[300px] overflow-y-auto">
                              {parsedReplaceItems.map((item, idx) => (
                                <div key={idx} className="bg-white dark:bg-gray-900 rounded-lg p-3 shadow-sm border">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <p className="font-medium">{item.name}</p>
                                      {item.description && (
                                        <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                                      )}
                                      <div className="flex flex-wrap gap-1 mt-2">
                                        {item.allergens.map((allergen, i) => (
                                          <span key={i} className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
                                            {allergen}
                                          </span>
                                        ))}
                                        {item.tags.map((tag, i) => (
                                          <span key={i} className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                                            {tag}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                    <span className="font-bold text-emerald-600">£{item.price}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Create Items Button */}
                      <Button
                        onClick={handlePasteItems}
                        disabled={!replaceTargetBranch || !selectedReplaceCategory || parsedReplaceItems.length === 0 || isReplacingMenu}
                        className="w-full gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 py-6 text-lg"
                        data-testid="button-create-items"
                      >
                        {isReplacingMenu ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Plus className="h-5 w-5" />
                        )}
                        Add {parsedReplaceItems.length} Items to "{targetBranchCategoriesData.find(c => c.id === selectedReplaceCategory)?.name || selectedReplaceCategory}"
                      </Button>
                    </>
                  )}
                </>
              )}
              </div>
            </ScrollArea>
          )}
        </div>
      </div>
    );
  };

  // Topping Groups parsed state
  type ParsedToppingGroup = {
    name: string;
    minSelect: number;
    maxSelect: number;
    isRequired: boolean;
    options: Array<{ name: string; price: string; isFree: boolean }>;
  };
  
  // Topping Menus feature
  const renderToppingMenus = () => {
    const toppingBranchData = restaurants.find(r => r.id === toppingMenuBranch);
    const branchMenuItems = menuItems?.filter(m => String(m.restaurantId) === String(toppingMenuBranch)) || [];
    
    // Parse toppings from pasted text - creates TOPPING GROUPS with options
    const parseToppingsText = (text: string): ParsedToppingGroup[] => {
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      const groups: ParsedToppingGroup[] = [];
      let currentGroup: ParsedToppingGroup | null = null;
      let i = 0;
      
      // Lines to skip (ordered by, ratings, promotional text, etc.)
      const skipPatterns = [
        /^#\d+/i,  // #1, Ordered by 30+ others
        /ordered by/i,
        /most liked/i,
        /most popular/i,
        /buy \d+.*get/i,  // Buy 1, get 1 free
        /^\d+%/,  // 87% (41)
        /freshly prepared/i,
        /^\d+\s*kcal/i,  // calories
      ];
      
      // Helper to check if a line is just a price
      const isPriceOnlyLine = (line: string) => /^\+?[£$€]?\d+(?:\.\d{1,2})?$/.test(line.replace(/\s/g, ''));
      
      // Helper to extract price from line
      const extractPriceFromLine = (line: string) => {
        const match = line.match(/\+?\s*[£$€]?\s*(\d+(?:\.\d{1,2})?)/);
        return match ? match[1] : null;
      };
      
      while (i < lines.length) {
        const line = lines[i];
        
        // Skip promotional/info lines
        if (skipPatterns.some(p => p.test(line))) {
          i++;
          continue;
        }
        
        // Skip lines that are just comma-separated options (popular choices)
        if (line.includes(',') && !line.match(/[£$€]\d/) && line.split(',').length > 2) {
          i++;
          continue;
        }
        
        // Skip standalone price lines (we'll handle them with the previous option)
        if (isPriceOnlyLine(line)) {
          i++;
          continue;
        }
        
        // Detect **Group Header** format with optional [Left Half], [Right Half], [Extra] marker
        const asteriskMatch = line.match(/^\*\*(.+?)\*\*(?:\s*\[(Left Half|Right Half|Extra)\])?$/i);
        if (asteriskMatch) {
          // Save previous group if exists
          if (currentGroup && currentGroup.options.length > 0) {
            groups.push(currentGroup);
          }
          const halfTypeMarker = asteriskMatch[2]?.toLowerCase();
          let halfType: string | null = null;
          if (halfTypeMarker === 'left half') halfType = 'left';
          else if (halfTypeMarker === 'right half') halfType = 'right';
          else if (halfTypeMarker === 'extra') halfType = 'extra';
          
          currentGroup = {
            name: asteriskMatch[1].trim(),
            minSelect: 0,
            maxSelect: 10,
            isRequired: false,
            options: [],
            halfType
          };
          i++;
          continue;
        }
        
        // Detect selection rules: "Choose up to 10", "Choose 1", "Choose between 1 and 3", "Choose up 2 to 10", "Required"
        const chooseUpTo = line.match(/choose\s+up\s+to\s+(\d+)/i);
        const chooseExact = line.match(/^choose\s+(\d+)$/i);
        const chooseBetween = line.match(/choose\s+between\s+(\d+)\s+and\s+(\d+)/i);
        const chooseUpMinToMax = line.match(/choose\s+up\s+(\d+)\s+to\s+(\d+)/i); // "Choose up 2 to 10" = min 2, max 10
        const isRequired = /^required$/i.test(line);
        
        if (currentGroup) {
          // Check "Choose up X to Y" first (more specific pattern)
          if (chooseUpMinToMax) {
            currentGroup.minSelect = parseInt(chooseUpMinToMax[1]);
            currentGroup.maxSelect = parseInt(chooseUpMinToMax[2]);
            currentGroup.isRequired = parseInt(chooseUpMinToMax[1]) > 0;
            i++;
            continue;
          }
          if (chooseUpTo) {
            currentGroup.maxSelect = parseInt(chooseUpTo[1]);
            currentGroup.minSelect = 0;
            i++;
            continue;
          }
          if (chooseExact) {
            currentGroup.minSelect = parseInt(chooseExact[1]);
            currentGroup.maxSelect = parseInt(chooseExact[1]);
            currentGroup.isRequired = true;
            i++;
            continue;
          }
          if (chooseBetween) {
            currentGroup.minSelect = parseInt(chooseBetween[1]);
            currentGroup.maxSelect = parseInt(chooseBetween[2]);
            currentGroup.isRequired = parseInt(chooseBetween[1]) > 0;
            i++;
            continue;
          }
          if (isRequired) {
            currentGroup.isRequired = true;
            currentGroup.minSelect = 1;
            i++;
            continue;
          }
        }
        
        // Also detect group headers without asterisks (capitalized, no price)
        const isPlainGroupHeader = !currentGroup && 
          line.match(/^[A-Z]/) && 
          !line.match(/[£$€+]/) && 
          line.length > 3 && 
          line.length < 50 &&
          !line.match(/^\d/) &&
          !/^(no\s|with\s)/i.test(line);
        
        if (isPlainGroupHeader) {
          currentGroup = {
            name: line,
            minSelect: 0,
            maxSelect: 10,
            isRequired: false,
            options: [],
            halfType: null
          };
          i++;
          continue;
        }
        
        // Check if this line is an option name (next line might have price)
        if (currentGroup) {
          const cleanName = line.replace(/^[•\-\*]\s*/, '').trim();
          
          // Skip instruction lines
          if (/^choose/i.test(cleanName)) {
            i++;
            continue;
          }
          
          // Check if price is on SAME line
          const samLinePriceMatch = line.match(/\+?\s*[£$€]\s*(\d+(?:\.\d{1,2})?)\s*$/);
          if (samLinePriceMatch && parseFloat(samLinePriceMatch[1]) > 0) {
            const name = line.replace(samLinePriceMatch[0], '').replace(/^\+/, '').trim();
            if (name && name.length > 1) {
              currentGroup.options.push({ name, price: samLinePriceMatch[1], isFree: false });
            }
            i++;
            continue;
          }
          
          // Check if NEXT line is a price
          if (i + 1 < lines.length && isPriceOnlyLine(lines[i + 1])) {
            const price = extractPriceFromLine(lines[i + 1]);
            if (price && parseFloat(price) > 0 && cleanName.length > 1 && cleanName.length < 50) {
              currentGroup.options.push({ name: cleanName, price, isFree: false });
              i += 2; // Skip both name and price lines
              continue;
            }
          }
          
          // No price found - treat as free option
          if (cleanName.length > 1 && cleanName.length < 50) {
            currentGroup.options.push({ name: cleanName, price: "0", isFree: true });
          }
        }
        
        i++;
      }
      
      // Don't forget the last group
      if (currentGroup && currentGroup.options.length > 0) {
        groups.push(currentGroup);
      }
      
      return groups;
    };
    
    // Get parsed groups from text
    const parsedGroups = parseToppingsText(pasteToppingsText);
    
    // Handle applying topping GROUPS to selected menu items
    const handleApplyToppings = async () => {
      if (!toppingMenuBranch || selectedMenuItemsForToppings.length === 0 || parsedGroups.length === 0) {
        toast({ title: "Error", description: "Please select menu items and add topping groups", variant: "destructive" });
        return;
      }
      
      setIsApplyingToppings(true);
      let groupsCreated = 0;
      let optionsCreated = 0;
      
      try {
        // Create topping groups for each selected menu item
        for (const menuItemId of selectedMenuItemsForToppings) {
          for (const group of parsedGroups) {
            // Create the topping group
            const groupResponse = await fetch(`/api/restaurants/${toppingMenuBranch}/topping-groups`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                menuItemId: menuItemId,
                headline: group.name,
                minSelections: group.minSelect || 0,
                maxSelections: group.maxSelect,
                isRequired: group.isRequired || group.minSelect > 0,
                halfType: group.halfType || null,
              }),
            });
            
            if (groupResponse.ok) {
              groupsCreated++;
              const createdGroup = await groupResponse.json();
              
              // Create options for this group using correct endpoint
              for (const option of group.options) {
                const optionResponse = await fetch(`/api/topping-groups/${createdGroup.id}/options`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    name: option.name,
                    price: option.isFree ? "0" : option.price,
                    isAvailable: true,
                  }),
                });
                
                if (optionResponse.ok) {
                  optionsCreated++;
                }
              }
            }
          }
        }
        
        queryClient.invalidateQueries({ queryKey: ["/api/topping-groups"] });
        queryClient.invalidateQueries({ queryKey: ["/api/topping-groups", toppingMenuBranch] });
        queryClient.invalidateQueries({ queryKey: ["/api/topping-group-options"] });
        
        toast({ 
          title: "Success", 
          description: `Created ${groupsCreated} topping groups with ${optionsCreated} options for ${selectedMenuItemsForToppings.length} menu items` 
        });
        
        setPasteToppingsText("");
        setSelectedMenuItemsForToppings([]);
      } catch (error) {
        toast({ title: "Error", description: "Failed to create topping groups", variant: "destructive" });
      } finally {
        setIsApplyingToppings(false);
      }
    };
    
    // Toggle menu item selection
    const toggleMenuItemSelection = (itemId: string) => {
      setSelectedMenuItemsForToppings(prev => 
        prev.includes(itemId) 
          ? prev.filter(id => id !== itemId)
          : [...prev, itemId]
      );
    };
    
    // Toggle all items in a category
    const toggleCategoryItems = (categoryId: string) => {
      const category = branchCategories.find(c => c.id === categoryId);
      const categoryItems = branchMenuItems.filter(item => 
        String(item.category) === String(categoryId) || 
        item.category === category?.slug ||
        item.category === category?.name
      );
      const categoryItemIds = categoryItems.map(item => item.id);
      const allSelected = categoryItemIds.every(id => selectedMenuItemsForToppings.includes(id));
      
      if (allSelected) {
        setSelectedMenuItemsForToppings(prev => prev.filter(id => !categoryItemIds.includes(id)));
      } else {
        setSelectedMenuItemsForToppings(prev => Array.from(new Set([...prev, ...categoryItemIds])));
      }
    };
    
    // Toggle topping free/priced
    const toggleToppingPrice = (index: number) => {
      setParsedToppings(prev => prev.map((t, i) => 
        i === index ? { ...t, isFree: !t.isFree } : t
      ));
    };
    
    // Update topping price
    const updateToppingPrice = (index: number, price: string) => {
      setParsedToppings(prev => prev.map((t, i) => 
        i === index ? { ...t, price, isFree: price === "0" || price === "" } : t
      ));
    };
    
    // Get categories for this branch
    const branchCategories = (dbCategories as Array<{ id: string; restaurantId: string | null; name: string; slug?: string }>)
      .filter(cat => String(cat.restaurantId) === String(toppingMenuBranch));
    
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Plus className="h-6 w-6 text-primary" />
              Topping Menus
            </h2>
            <p className="text-muted-foreground mt-1">
              Add toppings to multiple menu items at once. Paste from Word or PDF.
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Branch & Menu Items Selection */}
          <div className="space-y-4">
            {/* Step 1: Select Branch */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  Step 1: Select Branch
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={toppingMenuBranch || ""} onValueChange={(val) => {
                  setToppingMenuBranch(val);
                  setSelectedMenuItemsForToppings([]);
                  setSelectedToppingSection("all");
                }}>
                  <SelectTrigger data-testid="select-topping-branch">
                    <SelectValue placeholder="Select a branch" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    {restaurants.map(r => (
                      <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Section Selector for branches with multiple menu sections (like Tawa Grill) */}
            {toppingMenuBranch && getMenuSections(toppingMenuBranch) && (
              <Card className="border-purple-200 bg-purple-50/50 dark:bg-purple-950/20">
                <CardContent className="py-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <LayoutGrid className="h-5 w-5 text-purple-600" />
                      <p className="font-medium text-purple-700">Select Menu Section</p>
                    </div>
                    <p className="text-sm text-purple-600">Choose which section to apply toppings to:</p>
                    <div className="grid grid-cols-1 gap-2">
                      <Button
                        variant={selectedToppingSection === "all" ? "default" : "outline"}
                        className={`justify-start ${selectedToppingSection === "all" ? "bg-purple-600 hover:bg-purple-700" : ""}`}
                        onClick={() => setSelectedToppingSection("all")}
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        All Sections (Entire Menu)
                      </Button>
                      {getMenuSections(toppingMenuBranch)?.map((section, idx) => (
                        <Button
                          key={section.id}
                          variant={selectedToppingSection === section.id ? "default" : "outline"}
                          className={`justify-start ${selectedToppingSection === section.id ? "bg-purple-600 hover:bg-purple-700" : ""}`}
                          onClick={() => setSelectedToppingSection(section.id)}
                        >
                          <span className="mr-2">{idx === 0 ? "🍽️" : idx === 1 ? "☀️" : "🌙"}</span>
                          Section {idx + 1}: {section.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Clear Toppings Button */}
            {toppingMenuBranch && (
              <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-red-700">
                        {selectedToppingSection !== "all" && getMenuSections(toppingMenuBranch) 
                          ? `Clear Toppings: ${getMenuSections(toppingMenuBranch)?.find(s => s.id === selectedToppingSection)?.name}`
                          : "Clear All Toppings"
                        }
                      </p>
                      <p className="text-sm text-red-600">Remove all topping groups before pasting new ones</p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" className="gap-2" disabled={isClearingToppings}>
                          {isClearingToppings ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          Clear Toppings
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Clear All Topping Groups?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete all topping groups and options for {toppingBranchData?.name}. This cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700"
                            onClick={async () => {
                              setIsClearingToppings(true);
                              try {
                                // Get all topping groups for this branch
                                const response = await fetch(`/api/restaurants/${toppingMenuBranch}/topping-groups`);
                                const toppingGroups = await response.json();
                                
                                // Delete each topping group (this should cascade to options)
                                for (const group of toppingGroups || []) {
                                  await fetch(`/api/topping-groups/${group.id}`, { method: 'DELETE' });
                                }
                                
                                queryClient.invalidateQueries({ queryKey: ["/api/topping-groups", toppingMenuBranch] });
                                toast({ title: "Cleared", description: `Deleted ${toppingGroups?.length || 0} topping groups` });
                              } catch (error) {
                                toast({ title: "Error", description: "Failed to clear toppings", variant: "destructive" });
                              } finally {
                                setIsClearingToppings(false);
                              }
                            }}
                          >
                            Yes, Clear All Toppings
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Step 2: Select Menu Items */}
            {toppingMenuBranch && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <UtensilsCrossed className="h-5 w-5" />
                    Step 2: Select Menu Items ({selectedMenuItemsForToppings.length} selected)
                  </CardTitle>
                  <CardDescription>
                    Click categories to select all items, or click individual items
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-4">
                      {branchCategories.map(category => {
                        // Match by category ID, slug, or name
                        const categoryItems = branchMenuItems.filter(item => 
                          String(item.category) === String(category.id) || 
                          item.category === category.slug ||
                          item.category === category.name
                        );
                        if (categoryItems.length === 0) return null;
                        
                        const allCategorySelected = categoryItems.every(item => 
                          selectedMenuItemsForToppings.includes(item.id)
                        );
                        const someCategorySelected = categoryItems.some(item => 
                          selectedMenuItemsForToppings.includes(item.id)
                        );
                        
                        return (
                          <div key={category.id} className="space-y-2">
                            {/* Category Header - Clickable */}
                            <button
                              onClick={() => toggleCategoryItems(category.id)}
                              className={`w-full text-left px-3 py-2 rounded-lg font-medium flex items-center justify-between transition-colors ${
                                allCategorySelected 
                                  ? 'bg-primary text-primary-foreground' 
                                  : someCategorySelected 
                                    ? 'bg-primary/20 text-primary' 
                                    : 'bg-muted hover:bg-muted/80'
                              }`}
                              data-testid={`toggle-category-${category.id}`}
                            >
                              <span>{category.name}</span>
                              <Badge variant="outline" className={allCategorySelected ? 'bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30' : ''}>
                                {categoryItems.length} items
                              </Badge>
                            </button>
                            
                            {/* Menu Items */}
                            <div className="grid grid-cols-1 gap-1 pl-2">
                              {categoryItems.map(item => (
                                <label
                                  key={item.id}
                                  className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ${
                                    selectedMenuItemsForToppings.includes(item.id)
                                      ? 'bg-primary/10 border border-primary/30'
                                      : 'hover:bg-muted border border-transparent'
                                  }`}
                                >
                                  <Checkbox
                                    checked={selectedMenuItemsForToppings.includes(item.id)}
                                    onCheckedChange={() => toggleMenuItemSelection(item.id)}
                                    data-testid={`checkbox-item-${item.id}`}
                                  />
                                  <span className="text-sm flex-1 truncate">{item.name}</span>
                                  <span className="text-xs text-muted-foreground">£{item.price}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </div>
          
          {/* Right: Paste Toppings & Preview */}
          <div className="space-y-4">
            {/* Step 3: Paste Toppings */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ClipboardPaste className="h-5 w-5" />
                  Step 3: Paste Topping Groups
                </CardTitle>
                <CardDescription>
                  Paste from Word/PDF. Use **Group Name** for headers.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder={`**Salad options**
Choose between 1 and 3
Required

No salad
Lettuce
Tomatoes
Onions

**Choice of sauce Dips**
Choose up to 10

Flamed Peri Peri sauce
+£0.70

Lemon & herb sauce
+£0.70`}
                  value={pasteToppingsText}
                  onChange={(e) => setPasteToppingsText(e.target.value)}
                  className="min-h-[200px] font-mono text-sm"
                  data-testid="textarea-paste-toppings"
                />
                <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 rounded-lg space-y-2">
                  <p className="text-sm text-blue-800 dark:text-blue-200 font-bold mb-2">Format:</p>
                  <p className="text-sm text-blue-700 dark:text-blue-300"><strong>**Group Name**</strong> = Group header</p>
                  <p className="text-sm text-blue-700 dark:text-blue-300"><strong>Choose up to 10</strong> = Max 10, optional</p>
                  <p className="text-sm text-blue-700 dark:text-blue-300"><strong>Choose up 2 to 10</strong> = Min 2, Max 10 (2 required)</p>
                  <p className="text-sm text-blue-700 dark:text-blue-300"><strong>Choose between 1 and 3</strong> = Min 1, Max 3</p>
                  <p className="text-sm text-blue-700 dark:text-blue-300"><strong>Choose 1</strong> = Exactly 1 required</p>
                  <p className="text-sm text-blue-700 dark:text-blue-300"><strong>Required</strong> = Must select at least 1</p>
                  <p className="text-sm text-blue-700 dark:text-blue-300"><strong>Option Name</strong> = Free | <strong>+£0.70</strong> = Priced</p>
                  <div className="border-t border-purple-300 pt-2 mt-3">
                    <p className="text-sm text-purple-700 dark:text-purple-300 font-bold">🍕 Half & Half Pizza:</p>
                    <p className="text-sm text-purple-700 dark:text-purple-300"><strong>**Toppings** [Left Half]</strong> = Left side toppings</p>
                    <p className="text-sm text-purple-700 dark:text-purple-300"><strong>**Toppings** [Right Half]</strong> = Right side toppings</p>
                    <p className="text-sm text-purple-700 dark:text-purple-300"><strong>**Extras** [Extra]</strong> = Extra toppings (shown bold)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Parsed Topping Groups Preview */}
            {parsedGroups.length > 0 && (
              <Card className="border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2 text-emerald-700">
                    <Check className="h-5 w-5" />
                    Topping Groups Preview ({parsedGroups.length} groups)
                  </CardTitle>
                  <CardDescription>
                    Groups with their options and selection rules.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-[400px] overflow-y-auto">
                    {parsedGroups.map((group, gIdx) => (
                      <div key={gIdx} className="border rounded-lg overflow-hidden">
                        {/* Group Header */}
                        <div className="px-3 py-2 bg-blue-100 dark:bg-blue-900/30 flex items-center justify-between">
                          <span className="font-semibold text-blue-700 dark:text-blue-300">{group.name}</span>
                          <div className="flex items-center gap-2">
                            {group.halfType && (
                              <Badge className={`text-xs ${
                                group.halfType === 'left' ? 'bg-purple-500' : 
                                group.halfType === 'right' ? 'bg-indigo-500' : 
                                'bg-amber-500'
                              }`}>
                                {group.halfType === 'left' ? '🍕 Left Half' : 
                                 group.halfType === 'right' ? '🍕 Right Half' : 
                                 '⭐ Extra'}
                              </Badge>
                            )}
                            {group.isRequired && (
                              <Badge variant="destructive" className="text-xs">Required</Badge>
                            )}
                            <Badge variant="outline" className="text-xs">
                              {group.minSelect === group.maxSelect 
                                ? `Choose ${group.minSelect}` 
                                : group.minSelect === 0 
                                  ? `Up to ${group.maxSelect}` 
                                  : `${group.minSelect}-${group.maxSelect}`}
                            </Badge>
                          </div>
                        </div>
                        {/* Options */}
                        <div className="p-2 space-y-1">
                          {group.options.map((option, oIdx) => (
                            <div key={oIdx} className="flex items-center justify-between px-2 py-1 bg-white dark:bg-gray-900 rounded text-sm">
                              <span>{option.name}</span>
                              <span className={option.isFree ? "text-emerald-600 font-medium" : "text-gray-600"}>
                                {option.isFree ? "FREE" : `+£${option.price}`}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Apply Button */}
            <Button
              onClick={handleApplyToppings}
              disabled={!toppingMenuBranch || selectedMenuItemsForToppings.length === 0 || parsedGroups.length === 0 || isApplyingToppings}
              className="w-full gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 py-6 text-lg"
              data-testid="button-apply-toppings"
            >
              {isApplyingToppings ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Plus className="h-5 w-5" />
              )}
              Create {parsedGroups.length} Topping Groups for {selectedMenuItemsForToppings.length} Items
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderDataRecovery = () => {
    const selectedBranchForRecovery = restaurants.find(r => r.id === selectedRecoveryBranch);

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Data Recovery
            </CardTitle>
            <CardDescription>
              Create backups and restore your branch data. Automatic backups are created hourly when you make changes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="mb-2 block">Select Branch</Label>
              <Select value={selectedRecoveryBranch || ""} onValueChange={setSelectedRecoveryBranch}>
                <SelectTrigger data-testid="select-recovery-branch">
                  <SelectValue placeholder="Select a branch to manage backups" />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  {restaurants.map(restaurant => (
                    <SelectItem key={restaurant.id} value={restaurant.id}>
                      {restaurant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedRecoveryBranch && (
              <div className="flex gap-2">
                <Button 
                  onClick={handleCreateBackup} 
                  disabled={isCreatingBackup}
                  className="gap-2"
                  data-testid="button-create-backup"
                >
                  {isCreatingBackup ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Create Backup Now
                </Button>
              </div>
            )}

            <div className="pt-4 border-t">
              <h4 className="font-medium mb-2">Production Sync</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Sync all embedded seed data to the database. Use this to populate production with branch data.
              </p>
              <Button 
                onClick={handleSyncProduction} 
                disabled={isSyncingProduction}
                variant="outline"
                className="gap-2"
                data-testid="button-sync-production"
              >
                {isSyncingProduction ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                {isSyncingProduction ? "Syncing..." : "Sync Production Data"}
              </Button>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-medium mb-2">Fix Category IDs</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Fix menu items that have category slugs instead of category IDs. This fixes EPOS menus not showing items.
              </p>
              <Button 
                onClick={async () => {
                  try {
                    const response = await fetch("/api/fix-category-ids", { method: "POST" });
                    const data = await response.json();
                    if (data.success) {
                      alert(`Fixed ${data.fixedCount} menu items!`);
                    } else {
                      alert("Fix failed: " + (data.error || "Unknown error"));
                    }
                  } catch (err) {
                    alert("Fix failed: " + String(err));
                  }
                }}
                variant="default"
                size="sm"
                className="gap-2"
                data-testid="button-fix-category-ids"
              >
                <RefreshCw className="h-4 w-4" />
                Fix All Category IDs
              </Button>
            </div>
          </CardContent>
        </Card>

        {selectedRecoveryBranch && (
          <Card>
            <CardHeader>
              <CardTitle>Backups for {selectedBranchForRecovery?.name}</CardTitle>
              <CardDescription>
                {branchSnapshots.length === 0 
                  ? "No backups found. Create one to protect your data."
                  : `${branchSnapshots.length} backup(s) available`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {branchSnapshots.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No backups yet. Click "Create Backup Now" to save your current data.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {branchSnapshots.map((snapshot: any) => (
                    <div 
                      key={snapshot.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-secondary/30 transition-colors"
                      data-testid={`backup-item-${snapshot.id}`}
                    >
                      <div className="flex-1">
                        <div className="font-medium flex items-center gap-2">
                          {snapshot.label || "Backup"}
                          <Badge variant={snapshot.snapshotType === "auto" ? "secondary" : "default"}>
                            {snapshot.snapshotType === "auto" ? "Auto" : "Manual"}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(snapshot.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setRestoreConfirmId(snapshot.id)}
                          data-testid={`button-restore-${snapshot.id}`}
                        >
                          <RotateCcw className="h-4 w-4 mr-1" /> Restore
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteBackup(snapshot.id)}
                          className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                          data-testid={`button-delete-backup-${snapshot.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <AlertDialog open={!!restoreConfirmId} onOpenChange={(open) => !open && setRestoreConfirmId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Restore Backup?</AlertDialogTitle>
              <AlertDialogDescription>
                This will replace all current menu items, categories, option groups, and settings with the data from this backup.
                This action cannot be undone. Make sure to create a new backup first if you want to save the current state.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isRestoring}>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => restoreConfirmId && handleRestoreBackup(restoreConfirmId)}
                disabled={isRestoring}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isRestoring ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Yes, Restore
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  };

  const renderDeliveryArea = () => {
    const filteredBranchesForDelivery = restaurants.filter(r =>
      r.name.toLowerCase().includes(deliverySearchQuery.toLowerCase()) ||
      r.address.toLowerCase().includes(deliverySearchQuery.toLowerCase())
    );
    const selectedBranchData = selectedDeliveryBranchData;

    const handleSaveDeliverySettings = async () => {
      if (!selectedDeliveryBranch) return;
      setIsSavingDelivery(true);
      try {
        const response = await fetch(`/api/restaurants/${selectedDeliveryBranch}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            deliveryRadiusType,
            deliveryRadiusMiles: parseFloat(deliveryRadiusMiles) || 5,
            restaurantLatitude: parseFloat(restaurantLatitude) || null,
            restaurantLongitude: parseFloat(restaurantLongitude) || null,
          }),
        });
        if (response.ok) {
          queryClient.invalidateQueries({ queryKey: ["/api/restaurants"] });
          toast({
            title: "Delivery Settings Saved",
            description: "Delivery area restrictions have been updated.",
          });
        } else {
          throw new Error("Failed to save");
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to save delivery settings",
          variant: "destructive",
        });
      } finally {
        setIsSavingDelivery(false);
      }
    };

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Delivery Area Restrictions
            </CardTitle>
            <CardDescription>
              Control where your branches can deliver to prevent far-away orders
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label>Search & Select Branch</Label>
              <Input
                placeholder="Search branches..."
                value={deliverySearchQuery}
                onChange={(e) => setDeliverySearchQuery(e.target.value)}
                className="mb-2"
                data-testid="input-search-delivery-branch"
              />
              <div className="grid gap-2 max-h-48 overflow-y-auto">
                {filteredBranchesForDelivery.map((branch) => (
                  <div
                    key={branch.id}
                    className={`p-3 rounded-lg cursor-pointer border transition-colors ${
                      selectedDeliveryBranch === branch.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => setSelectedDeliveryBranch(branch.id)}
                    data-testid={`delivery-branch-${branch.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <Store className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{branch.name}</p>
                        <p className="text-xs text-muted-foreground">{branch.address}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedBranchData && (
              <div className="space-y-6 pt-4 border-t">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Selected: {selectedBranchData.name}</h4>
                  <p className="text-sm text-muted-foreground">{selectedBranchData.address}</p>
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-semibold">Delivery Area Type</Label>
                  <div className="grid gap-3">
                    <div
                      className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                        deliveryRadiusType === "uk_only"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => setDeliveryRadiusType("uk_only")}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 ${deliveryRadiusType === "uk_only" ? "border-primary bg-primary" : "border-muted-foreground"}`} />
                        <div>
                          <p className="font-medium">UK Only</p>
                          <p className="text-sm text-muted-foreground">Accept orders from anywhere in the UK</p>
                        </div>
                      </div>
                    </div>

                    <div
                      className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                        deliveryRadiusType === "worldwide"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => setDeliveryRadiusType("worldwide")}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 ${deliveryRadiusType === "worldwide" ? "border-primary bg-primary" : "border-muted-foreground"}`} />
                        <div>
                          <p className="font-medium">Worldwide</p>
                          <p className="text-sm text-muted-foreground">Accept orders from any location globally</p>
                        </div>
                      </div>
                    </div>

                    <div
                      className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                        deliveryRadiusType === "radius"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => setDeliveryRadiusType("radius")}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 ${deliveryRadiusType === "radius" ? "border-primary bg-primary" : "border-muted-foreground"}`} />
                        <div>
                          <p className="font-medium">Specific Radius</p>
                          <p className="text-sm text-muted-foreground">Only accept orders within a set mile radius from your restaurant</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {deliveryRadiusType === "radius" && (
                  <div className="space-y-4 p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                      <MapPin className="h-4 w-4" />
                      <span className="font-medium">Radius Settings</span>
                    </div>

                    <div className="grid gap-4">
                      <div>
                        <Label>Delivery Radius (miles)</Label>
                        <Input
                          type="number"
                          min="1"
                          max="100"
                          value={deliveryRadiusMiles}
                          onChange={(e) => setDeliveryRadiusMiles(e.target.value)}
                          placeholder="e.g., 5"
                          data-testid="input-delivery-radius-miles"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Orders outside this radius will be blocked
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Restaurant Latitude</Label>
                          <Input
                            type="text"
                            value={restaurantLatitude}
                            onChange={(e) => setRestaurantLatitude(e.target.value)}
                            placeholder="e.g., 51.5074"
                            data-testid="input-restaurant-latitude"
                          />
                        </div>
                        <div>
                          <Label>Restaurant Longitude</Label>
                          <Input
                            type="text"
                            value={restaurantLongitude}
                            onChange={(e) => setRestaurantLongitude(e.target.value)}
                            placeholder="e.g., -0.1278"
                            data-testid="input-restaurant-longitude"
                          />
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground">
                        Tip: You can find your coordinates by searching your address on Google Maps, 
                        right-clicking the location, and copying the coordinates.
                      </p>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleSaveDeliverySettings}
                  disabled={isSavingDelivery}
                  className="w-full"
                  data-testid="button-save-delivery-settings"
                >
                  {isSavingDelivery ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Delivery Settings
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderMenuBackground = () => {
    const filteredBranchesForMenuBg = restaurants.filter(r =>
      r.name.toLowerCase().includes(menuBgSearchQuery.toLowerCase()) ||
      r.address.toLowerCase().includes(menuBgSearchQuery.toLowerCase())
    );

    const handleSaveMenuBg = async () => {
      if (!selectedMenuBgBranch) return;
      setIsSavingMenuBg(true);
      try {
        await updateRestaurant(selectedMenuBgBranch, {
          menuBackgroundType: menuBgType,
          menuBackgroundImageUrl: menuBgImageUrl || null,
          menuBackgroundVideoUrl: menuBgVideoUrl || null,
          menuGradientStart: menuGradientStart,
          menuGradientMiddle: menuGradientMiddle || null,
          menuGradientEnd: menuGradientEnd,
        } as any);
        queryClient.invalidateQueries({ queryKey: ["/api/restaurants"] });
        toast({
          title: "Success",
          description: "Menu background settings saved successfully",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to save menu background settings",
          variant: "destructive",
        });
      } finally {
        setIsSavingMenuBg(false);
      }
    };

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Menu Page Background
            </CardTitle>
            <CardDescription>
              Customize the background of your menu page with gradients, images, or videos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label>Search & Select Branch</Label>
              <Input
                placeholder="Search branches..."
                value={menuBgSearchQuery}
                onChange={(e) => setMenuBgSearchQuery(e.target.value)}
                className="mb-2"
                data-testid="input-search-menu-bg-branch"
              />
              <div className="grid gap-2 max-h-48 overflow-y-auto">
                {filteredBranchesForMenuBg.map((branch) => (
                  <div
                    key={branch.id}
                    className={`p-3 rounded-lg cursor-pointer border transition-colors ${
                      selectedMenuBgBranch === branch.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => setSelectedMenuBgBranch(branch.id)}
                    data-testid={`menu-bg-branch-${branch.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <Store className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{branch.name}</p>
                        <p className="text-xs text-muted-foreground">{branch.address}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedMenuBgBranch && (
              <div className="space-y-6 pt-4 border-t">
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Background Type</Label>
                  <div className="grid grid-cols-3 gap-3">
                    <Button
                      type="button"
                      variant={menuBgType === "gradient" ? "default" : "outline"}
                      onClick={() => setMenuBgType("gradient")}
                      className="flex flex-col items-center gap-2 h-auto py-4"
                      data-testid="menu-bg-type-gradient"
                    >
                      <Palette className="h-5 w-5" />
                      <span>Gradient</span>
                    </Button>
                    <Button
                      type="button"
                      variant={menuBgType === "image" ? "default" : "outline"}
                      onClick={() => setMenuBgType("image")}
                      className="flex flex-col items-center gap-2 h-auto py-4"
                      data-testid="menu-bg-type-image"
                    >
                      <ImageIcon className="h-5 w-5" />
                      <span>Image</span>
                    </Button>
                    <Button
                      type="button"
                      variant={menuBgType === "video" ? "default" : "outline"}
                      onClick={() => setMenuBgType("video")}
                      className="flex flex-col items-center gap-2 h-auto py-4"
                      data-testid="menu-bg-type-video"
                    >
                      <Video className="h-5 w-5" />
                      <span>Video</span>
                    </Button>
                  </div>
                </div>

                {menuBgType === "gradient" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Start Color</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={menuGradientStart}
                            onChange={(e) => setMenuGradientStart(e.target.value)}
                            className="w-12 h-10 p-1 cursor-pointer"
                          />
                          <Input
                            value={menuGradientStart}
                            onChange={(e) => setMenuGradientStart(e.target.value)}
                            className="flex-1"
                            data-testid="input-menu-gradient-start"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Middle Color</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={menuGradientMiddle || "#2d1b4e"}
                            onChange={(e) => setMenuGradientMiddle(e.target.value)}
                            className="w-12 h-10 p-1 cursor-pointer"
                          />
                          <Input
                            value={menuGradientMiddle}
                            onChange={(e) => setMenuGradientMiddle(e.target.value)}
                            className="flex-1"
                            placeholder="Optional"
                            data-testid="input-menu-gradient-middle"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>End Color</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={menuGradientEnd}
                            onChange={(e) => setMenuGradientEnd(e.target.value)}
                            className="w-12 h-10 p-1 cursor-pointer"
                          />
                          <Input
                            value={menuGradientEnd}
                            onChange={(e) => setMenuGradientEnd(e.target.value)}
                            className="flex-1"
                            data-testid="input-menu-gradient-end"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="h-24 rounded-lg" style={{
                      background: menuGradientMiddle 
                        ? `linear-gradient(135deg, ${menuGradientStart}, ${menuGradientMiddle}, ${menuGradientEnd})`
                        : `linear-gradient(135deg, ${menuGradientStart}, ${menuGradientEnd})`
                    }}>
                      <p className="text-center text-white/70 pt-9 text-sm">Preview</p>
                    </div>
                  </div>
                )}

                {menuBgType === "image" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Upload Background Image</Label>
                      <div className="flex gap-2">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleMenuBgUpload(e, 'image')}
                          disabled={isUploadingMenuBg}
                          className="flex-1"
                          data-testid="input-menu-bg-image-upload"
                        />
                      </div>
                      {isUploadingMenuBg && (
                        <p className="text-sm text-muted-foreground">Uploading...</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Or Enter Image URL</Label>
                      <Input
                        value={menuBgImageUrl}
                        onChange={(e) => setMenuBgImageUrl(e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        data-testid="input-menu-bg-image"
                      />
                    </div>
                    {menuBgImageUrl && (
                      <div className="h-32 rounded-lg bg-cover bg-center border" style={{
                        backgroundImage: `url(${menuBgImageUrl})`
                      }}>
                        <p className="text-center text-white/70 pt-12 text-sm drop-shadow-lg">Preview</p>
                      </div>
                    )}
                  </div>
                )}

                {menuBgType === "video" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Upload Background Video</Label>
                      <div className="flex gap-2">
                        <Input
                          type="file"
                          accept="video/*"
                          onChange={(e) => handleMenuBgUpload(e, 'video')}
                          disabled={isUploadingMenuBg}
                          className="flex-1"
                          data-testid="input-menu-bg-video-upload"
                        />
                      </div>
                      {isUploadingMenuBg && (
                        <p className="text-sm text-muted-foreground">Uploading...</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Or Enter Video URL</Label>
                      <Input
                        value={menuBgVideoUrl}
                        onChange={(e) => setMenuBgVideoUrl(e.target.value)}
                        placeholder="https://example.com/video.mp4"
                        data-testid="input-menu-bg-video"
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Use a short looping video for best performance. MP4 format recommended.
                    </p>
                    {menuBgVideoUrl && (
                      <div className="rounded-lg border overflow-hidden">
                        <video 
                          src={menuBgVideoUrl} 
                          className="w-full h-32 object-cover"
                          autoPlay 
                          loop 
                          muted 
                          playsInline
                        />
                      </div>
                    )}
                  </div>
                )}

                <Button 
                  onClick={handleSaveMenuBg}
                  disabled={isSavingMenuBg}
                  className="w-full"
                  data-testid="button-save-menu-bg"
                >
                  {isSavingMenuBg ? "Saving..." : "Save Menu Background Settings"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderQRCode = () => {
    const filteredBranchesForQr = restaurants.filter(r =>
      r.name.toLowerCase().includes(qrSearchQuery.toLowerCase()) ||
      r.address.toLowerCase().includes(qrSearchQuery.toLowerCase())
    );
    const selectedBranchData = restaurants.find(r => r.id === selectedQrBranch);

    const getQrUrl = () => {
      if (!selectedBranchData) return "";
      const baseUrl = window.location.origin;
      if (qrPageType === "menu") {
        return `${baseUrl}/menu/${selectedBranchData.slug}`;
      } else if (qrPageType === "welcome") {
        return `${baseUrl}/${selectedBranchData.slug}`;
      } else {
        return `${baseUrl}/${selectedBranchData.slug}`;
      }
    };

    const handleDownloadQr = () => {
      if (!qrRef.current || !selectedBranchData) return;
      const svg = qrRef.current.querySelector("svg");
      if (!svg) return;

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const svgData = new XMLSerializer().serializeToString(svg);
      const img = new Image();
      
      canvas.width = 400;
      canvas.height = 400;

      img.onload = () => {
        if (ctx) {
          ctx.fillStyle = "white";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, 400, 400);
          
          const link = document.createElement("a");
          const pageName = qrPageType === "menu" ? "Menu" : qrPageType === "welcome" ? "Welcome" : "All";
          link.download = `${selectedBranchData.name.replace(/\s+/g, "-")}-${pageName}-QR.png`;
          link.href = canvas.toDataURL("image/png");
          link.click();
        }
      };
      
      img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
    };

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              QR Code Generator
            </CardTitle>
            <CardDescription>
              Generate QR codes for your branches to share with customers for marketing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label>Search & Select Branch</Label>
              <Input
                placeholder="Search branches..."
                value={qrSearchQuery}
                onChange={(e) => setQrSearchQuery(e.target.value)}
                className="mb-2"
                data-testid="input-search-qr-branch"
              />
              <div className="grid gap-2 max-h-48 overflow-y-auto">
                {filteredBranchesForQr.map((branch) => (
                  <div
                    key={branch.id}
                    className={`p-3 rounded-lg cursor-pointer border transition-colors ${
                      selectedQrBranch === branch.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => setSelectedQrBranch(branch.id)}
                    data-testid={`qr-branch-${branch.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <Store className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{branch.name}</p>
                        <p className="text-xs text-muted-foreground">{branch.address}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedBranchData && (
              <div className="space-y-6 pt-4 border-t">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Selected: {selectedBranchData.name}</h4>
                  <p className="text-sm text-muted-foreground">{selectedBranchData.address}</p>
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-semibold">Select Page Type</Label>
                  <div className="grid gap-3">
                    <div
                      className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                        qrPageType === "menu"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => setQrPageType("menu")}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 ${qrPageType === "menu" ? "border-primary bg-primary" : "border-muted-foreground"}`} />
                        <div>
                          <p className="font-medium">Menu Page Only</p>
                          <p className="text-sm text-muted-foreground">Direct link to the menu page</p>
                        </div>
                      </div>
                    </div>

                    <div
                      className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                        qrPageType === "welcome"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => setQrPageType("welcome")}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 ${qrPageType === "welcome" ? "border-primary bg-primary" : "border-muted-foreground"}`} />
                        <div>
                          <p className="font-medium">Welcome Page Only</p>
                          <p className="text-sm text-muted-foreground">Link to the welcome/landing page</p>
                        </div>
                      </div>
                    </div>

                    <div
                      className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                        qrPageType === "both"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => setQrPageType("both")}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 ${qrPageType === "both" ? "border-primary bg-primary" : "border-muted-foreground"}`} />
                        <div>
                          <p className="font-medium">Welcome + Menu (All Pages)</p>
                          <p className="text-sm text-muted-foreground">Customer starts at welcome page and can navigate to menu</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-4 p-6 bg-white rounded-lg border">
                  <div ref={qrRef} className="p-4 bg-white rounded-lg">
                    <QRCodeSVG
                      value={getQrUrl()}
                      size={256}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-700">{selectedBranchData.name}</p>
                    <p className="text-xs text-gray-500 break-all max-w-[300px]">{getQrUrl()}</p>
                  </div>
                </div>

                <Button
                  onClick={handleDownloadQr}
                  className="w-full"
                  data-testid="button-download-qr"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download QR Code
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderTwilioSystem = () => {
    const filteredBranchesForTwilio = restaurants.filter(r =>
      r.name.toLowerCase().includes(twilioSearchQuery.toLowerCase()) ||
      r.address.toLowerCase().includes(twilioSearchQuery.toLowerCase())
    );
    const selectedBranchData = restaurants.find(r => r.id === selectedTwilioBranch);

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Twilio Caller ID System
            </CardTitle>
            <CardDescription>
              Configure Twilio for each branch to show caller ID on the dashboard when customers call.
              Each branch needs its own Twilio account credentials.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Select Branch</Label>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search branches..."
                  className="pl-10"
                  value={twilioSearchQuery}
                  onChange={(e) => setTwilioSearchQuery(e.target.value)}
                  data-testid="input-search-twilio-branch"
                />
              </div>
              <ScrollArea className="h-64 border rounded-lg mt-2">
                <div className="p-2 space-y-1">
                  {filteredBranchesForTwilio.map(branch => {
                    const branchTwilioSettings = allTwilioSettings.find(s => s.restaurantId === branch.id);
                    const hasCredentials = !!branchTwilioSettings;
                    const isEnabled = branchTwilioSettings?.enabled ?? false;
                    
                    return (
                      <div
                        key={branch.id}
                        className={`w-full p-3 rounded-lg transition-all flex items-center justify-between gap-3 ${
                          selectedTwilioBranch === branch.id 
                            ? 'bg-primary text-primary-foreground' 
                            : 'hover:bg-secondary/50 border border-border'
                        }`}
                        data-testid={`twilio-branch-${branch.id}`}
                      >
                        <button
                          onClick={() => {
                            setSelectedTwilioBranch(branch.id);
                            setTwilioSearchQuery("");
                          }}
                          className="flex items-center gap-3 flex-1 text-left"
                        >
                          <Store className="h-4 w-4" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{branch.name}</div>
                            <div className="text-xs opacity-70 truncate">{branch.address}</div>
                            {branchTwilioSettings?.phoneNumber && (
                              <div className="text-xs text-green-500 mt-1">
                                <Phone className="h-3 w-3 inline mr-1" />
                                {branchTwilioSettings.phoneNumber}
                              </div>
                            )}
                          </div>
                        </button>
                        <div className="flex items-center gap-2">
                          {hasCredentials ? (
                            <Switch
                              checked={isEnabled}
                              onCheckedChange={(checked) => handleQuickToggleTwilio(branch.id, checked)}
                              data-testid={`twilio-toggle-${branch.id}`}
                            />
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              Not configured
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>

        {selectedTwilioBranch && selectedBranchData && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Twilio Settings for {selectedBranchData.name}</span>
                {twilioSettings && (
                  <Badge variant={twilioSettings.enabled ? "default" : "secondary"}>
                    {twilioSettings.enabled ? "Active" : "Disabled"}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Enter the Twilio credentials provided by the restaurant customer.
                They can find these in their Twilio Console dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="twilio-sid">Account SID</Label>
                <Input
                  id="twilio-sid"
                  placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  value={twilioAccountSid}
                  onChange={(e) => setTwilioAccountSid(e.target.value)}
                  data-testid="input-twilio-sid"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="twilio-token">Auth Token</Label>
                <Input
                  id="twilio-token"
                  type="password"
                  placeholder="Your Twilio Auth Token"
                  value={twilioAuthToken}
                  onChange={(e) => setTwilioAuthToken(e.target.value)}
                  data-testid="input-twilio-token"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="twilio-phone">Twilio Phone Number</Label>
                <Input
                  id="twilio-phone"
                  placeholder="+1234567890"
                  value={twilioPhoneNumber}
                  onChange={(e) => setTwilioPhoneNumber(e.target.value)}
                  data-testid="input-twilio-phone"
                />
                <p className="text-xs text-muted-foreground">
                  This is the phone number customers will call. Include country code (e.g., +44 for UK, +1 for US).
                </p>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Caller ID</Label>
                  <p className="text-xs text-muted-foreground">Turn on/off caller ID display on the dashboard</p>
                </div>
                <Switch
                  checked={twilioEnabled}
                  onCheckedChange={setTwilioEnabled}
                  data-testid="switch-twilio-enabled"
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              {twilioSettings && (
                <Button 
                  variant="destructive" 
                  onClick={handleDeleteTwilioSettings}
                  data-testid="button-delete-twilio"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove Twilio
                </Button>
              )}
              <Button 
                onClick={handleSaveTwilioSettings}
                disabled={isSavingTwilio || !twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber}
                className="ml-auto"
                data-testid="button-save-twilio"
              >
                {isSavingTwilio ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Save Settings
              </Button>
            </CardFooter>
          </Card>
        )}

        <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-blue-800 dark:text-blue-200 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              How to Set Up Twilio
            </CardTitle>
          </CardHeader>
          <CardContent className="text-blue-700 dark:text-blue-300 text-sm space-y-2">
            <p><strong>1.</strong> Restaurant customer creates a Twilio account at <a href="https://www.twilio.com" target="_blank" rel="noopener noreferrer" className="underline">twilio.com</a></p>
            <p><strong>2.</strong> They purchase a phone number in their Twilio console</p>
            <p><strong>3.</strong> They provide you with their Account SID, Auth Token, and Phone Number</p>
            <p><strong>4.</strong> Enter those credentials here and save</p>
            <p><strong>5.</strong> In their Twilio console, they need to configure the webhook URL:</p>
            <div className="bg-white dark:bg-gray-900 p-2 rounded font-mono text-xs mt-2">
              {typeof window !== 'undefined' ? `${window.location.origin}/api/twilio/incoming-call` : '/api/twilio/incoming-call'}
            </div>
            <p className="mt-2">When customers call, their number will appear on the branch dashboard in real-time!</p>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderPlatformCommission = () => {
    const filteredBranches = restaurants.filter(r =>
      r.name.toLowerCase().includes(commissionSearchQuery.toLowerCase()) ||
      r.address.toLowerCase().includes(commissionSearchQuery.toLowerCase())
    );
    const selectedBranchData = restaurants.find(r => r.id === selectedCommissionBranch);
    const commissionRate = parseFloat(platformCommission) || 0;
    
    // Calculate totals for selected branch or all branches
    const branchRevenue = selectedBranchData ? Number(selectedBranchData.revenueToday || 0) : totalRevenue;
    const branchOrders = selectedBranchData ? Number(selectedBranchData.ordersToday || 0) : totalOrders;
    const branchCommissionEarned = branchRevenue * commissionRate / 100;
    const currencySymbol = getCurrencySymbol(selectedBranchData?.currency || restaurants[0]?.currency || "GBP");

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="h-5 w-5" />
              Platform Commission Settings
            </CardTitle>
            <CardDescription>
              Set the commission percentage and view earnings from each branch.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Platform Commission (%)</Label>
              <div className="flex gap-2">
                <Input 
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={platformCommission} 
                  onChange={(e) => setPlatformCommission(e.target.value)}
                  className="max-w-[150px]"
                  data-testid="input-platform-commission"
                />
                <Button 
                  onClick={handleSavePaymentSettings}
                  disabled={updatePlatformSettingsMutation.isPending}
                  data-testid="button-save-commission"
                >
                  {updatePlatformSettingsMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Percentage taken from each order total. Set to 0 for no commission.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Select Branch</CardTitle>
            <CardDescription>View commission earned from a specific branch, or see all branches below.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search branches..."
                className="pl-10"
                value={commissionSearchQuery}
                onChange={(e) => setCommissionSearchQuery(e.target.value)}
                data-testid="input-search-commission-branch"
              />
            </div>
            <ScrollArea className="h-48 border rounded-lg">
              <div className="p-2 space-y-1">
                <button
                  onClick={() => {
                    setSelectedCommissionBranch(null);
                    setCommissionSearchQuery("");
                  }}
                  className={`w-full text-left p-3 rounded-lg transition-all flex items-center gap-3 ${
                    selectedCommissionBranch === null 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-secondary/50'
                  }`}
                  data-testid="commission-branch-all"
                >
                  <Building2 className="h-4 w-4" />
                  <div>
                    <div className="font-medium">All Branches</div>
                    <div className="text-xs opacity-70">{restaurants.length} total</div>
                  </div>
                </button>
                {filteredBranches.map(branch => (
                  <button
                    key={branch.id}
                    onClick={() => {
                      setSelectedCommissionBranch(branch.id);
                      setCommissionSearchQuery("");
                    }}
                    className={`w-full text-left p-3 rounded-lg transition-all flex items-center gap-3 ${
                      selectedCommissionBranch === branch.id 
                        ? 'bg-primary text-primary-foreground' 
                        : 'hover:bg-secondary/50'
                    }`}
                    data-testid={`commission-branch-${branch.id}`}
                  >
                    <Store className="h-4 w-4" />
                    <div>
                      <div className="font-medium">{branch.name}</div>
                      <div className="text-xs opacity-70">{branch.address}</div>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Commission Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="stat-card-3d bg-gradient-to-br from-pink-500 via-rose-500 to-red-500 text-white border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
                <Percent className="h-4 w-4" />
                Commission Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{platformCommission}%</div>
              <p className="text-sm opacity-75 mt-1">
                {selectedBranchData ? selectedBranchData.name : 'All Branches'} • {branchOrders} orders today
              </p>
            </CardContent>
          </Card>

          <Card className="stat-card-3d bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 text-white border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Link24 Earnings Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{currencySymbol}{branchCommissionEarned.toFixed(2)}</div>
              <p className="text-sm opacity-75 mt-1">
                From {currencySymbol}{branchRevenue.toFixed(2)} revenue
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Per-Branch Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Commission By Branch (Today)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {restaurants.map((r) => {
                const branchRev = Number(r.revenueToday || 0);
                const branchOrd = Number(r.ordersToday || 0);
                const branchComm = branchRev * commissionRate / 100;
                const cs = getCurrencySymbol(r.currency || "GBP");
                
                return (
                  <div key={r.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-secondary/20 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-pink-500/20 to-rose-500/10 flex items-center justify-center font-bold text-pink-500">
                        {r.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{r.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {branchOrd} orders • {cs}{branchRev.toFixed(2)} revenue
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-emerald-500">
                        {cs}{branchComm.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {platformCommission}% commission
                      </p>
                    </div>
                  </div>
                );
              })}
              {restaurants.length === 0 && (
                <p className="text-center text-muted-foreground py-4">No branches yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Load theme colors when branch is selected
  useEffect(() => {
    if (selectedThemeBranch) {
      const branch = restaurants.find(r => r.id === selectedThemeBranch);
      if (branch) {
        setThemePrimaryColor(branch.primaryColor || "#8B0000");
        setThemeSecondaryColor(branch.secondaryColor || "#FFD700");
        setThemeAccentColor(branch.accentColor || "#4A0E4E");
        setThemeButtonColor(branch.buttonColor || "#dc2626");
        setThemeHeaderBgColor(branch.headerBgColor || "#1a1a2e");
        setThemeCardBgColor(branch.cardBgColor || "#ffffff");
        setThemeTextColor(branch.textColor || "#ffffff");
      }
    }
  }, [selectedThemeBranch, restaurants]);

  const handleSaveThemeColors = async () => {
    if (!selectedThemeBranch) return;
    setIsSavingTheme(true);
    try {
      const res = await fetch(`/api/restaurants/${selectedThemeBranch}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          primaryColor: themePrimaryColor,
          secondaryColor: themeSecondaryColor,
          accentColor: themeAccentColor,
          buttonColor: themeButtonColor,
          headerBgColor: themeHeaderBgColor,
          cardBgColor: themeCardBgColor,
          textColor: themeTextColor
        }),
      });
      if (!res.ok) throw new Error("Failed to save theme");
      queryClient.invalidateQueries({ queryKey: ["/api/restaurants"] });
      const branchName = restaurants.find(r => r.id === selectedThemeBranch)?.name || "Branch";
      alert(`Theme colors saved for ${branchName}!`);
    } catch (error) {
      console.error("Error saving theme:", error);
      alert("Failed to save theme colors");
    } finally {
      setIsSavingTheme(false);
    }
  };

  const renderThemeColors = () => {
    const filteredBranches = restaurants.filter(r =>
      r.name.toLowerCase().includes(themeSearchQuery.toLowerCase()) ||
      r.address.toLowerCase().includes(themeSearchQuery.toLowerCase())
    );
    const selectedBranch = restaurants.find(r => r.id === selectedThemeBranch);

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Theme Colors
            </CardTitle>
            <CardDescription>Select a branch to customize its public page colors.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search branches..."
                className="pl-10"
                value={themeSearchQuery}
                onChange={(e) => setThemeSearchQuery(e.target.value)}
                data-testid="input-search-theme-branch"
              />
            </div>
            
            <ScrollArea className="h-64 border rounded-lg">
              <div className="p-2 space-y-1">
                {filteredBranches.map(branch => (
                  <Button
                    key={branch.id}
                    variant={selectedThemeBranch === branch.id ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setSelectedThemeBranch(branch.id)}
                    data-testid={`theme-branch-${branch.id}`}
                  >
                    <Store className="h-4 w-4 mr-2" />
                    {branch.name}
                  </Button>
                ))}
                {filteredBranches.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">No branches found</p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {selectedBranch ? `Colors for ${selectedBranch.name}` : "Select a Branch"}
            </CardTitle>
            <CardDescription>
              Customize the colors used throughout your restaurant's public pages.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedBranch ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Primary Color</label>
                    <div className="flex gap-2">
                      <input 
                        type="color" 
                        value={themePrimaryColor} 
                        onChange={(e) => setThemePrimaryColor(e.target.value)} 
                        className="w-10 h-10 rounded cursor-pointer border" 
                      />
                      <Input 
                        value={themePrimaryColor} 
                        onChange={(e) => setThemePrimaryColor(e.target.value)} 
                        className="text-xs"
                        data-testid="input-theme-primary"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Secondary Color</label>
                    <div className="flex gap-2">
                      <input 
                        type="color" 
                        value={themeSecondaryColor} 
                        onChange={(e) => setThemeSecondaryColor(e.target.value)} 
                        className="w-10 h-10 rounded cursor-pointer border" 
                      />
                      <Input 
                        value={themeSecondaryColor} 
                        onChange={(e) => setThemeSecondaryColor(e.target.value)} 
                        className="text-xs"
                        data-testid="input-theme-secondary"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Accent Color</label>
                    <div className="flex gap-2">
                      <input 
                        type="color" 
                        value={themeAccentColor} 
                        onChange={(e) => setThemeAccentColor(e.target.value)} 
                        className="w-10 h-10 rounded cursor-pointer border" 
                      />
                      <Input 
                        value={themeAccentColor} 
                        onChange={(e) => setThemeAccentColor(e.target.value)} 
                        className="text-xs"
                        data-testid="input-theme-accent"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Button Color</label>
                    <div className="flex gap-2">
                      <input 
                        type="color" 
                        value={themeButtonColor} 
                        onChange={(e) => setThemeButtonColor(e.target.value)} 
                        className="w-10 h-10 rounded cursor-pointer border" 
                      />
                      <Input 
                        value={themeButtonColor} 
                        onChange={(e) => setThemeButtonColor(e.target.value)} 
                        className="text-xs"
                        data-testid="input-theme-button"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Header Background</label>
                    <div className="flex gap-2">
                      <input 
                        type="color" 
                        value={themeHeaderBgColor} 
                        onChange={(e) => setThemeHeaderBgColor(e.target.value)} 
                        className="w-10 h-10 rounded cursor-pointer border" 
                      />
                      <Input 
                        value={themeHeaderBgColor} 
                        onChange={(e) => setThemeHeaderBgColor(e.target.value)} 
                        className="text-xs"
                        data-testid="input-theme-header"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Card Background</label>
                    <div className="flex gap-2">
                      <input 
                        type="color" 
                        value={themeCardBgColor} 
                        onChange={(e) => setThemeCardBgColor(e.target.value)} 
                        className="w-10 h-10 rounded cursor-pointer border" 
                      />
                      <Input 
                        value={themeCardBgColor} 
                        onChange={(e) => setThemeCardBgColor(e.target.value)} 
                        className="text-xs"
                        data-testid="input-theme-card"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Text Color</label>
                    <div className="flex gap-2">
                      <input 
                        type="color" 
                        value={themeTextColor} 
                        onChange={(e) => setThemeTextColor(e.target.value)} 
                        className="w-10 h-10 rounded cursor-pointer border" 
                      />
                      <Input 
                        value={themeTextColor} 
                        onChange={(e) => setThemeTextColor(e.target.value)} 
                        className="text-xs"
                        data-testid="input-theme-text"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 rounded-lg border bg-muted/50">
                  <h4 className="text-sm font-medium mb-3">Preview</h4>
                  <div className="flex flex-wrap gap-2">
                    <div className="px-4 py-2 rounded" style={{ backgroundColor: themePrimaryColor, color: themeTextColor }}>Primary Text</div>
                    <div className="px-4 py-2 rounded" style={{ backgroundColor: themeSecondaryColor, color: '#000' }}>Secondary Text</div>
                    <div className="px-4 py-2 rounded" style={{ backgroundColor: themeAccentColor, color: themeTextColor }}>Accent Color</div>
                    <div className="px-4 py-2 rounded" style={{ backgroundColor: themeButtonColor, color: '#fff' }}>Button</div>
                  </div>
                </div>

                <Button 
                  onClick={handleSaveThemeColors} 
                  disabled={isSavingTheme} 
                  className="w-full bg-gradient-to-r from-pink-500 to-rose-600 text-white"
                  data-testid="button-save-theme"
                >
                  {isSavingTheme ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Theme Colors
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Palette className="h-12 w-12 mb-4 opacity-50" />
                <p>Select a branch to customize its theme colors</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  // Load app icon settings when branch is selected
  useEffect(() => {
    if (selectedAppIconBranch) {
      const branch = restaurants.find(r => r.id === selectedAppIconBranch);
      if (branch) {
        setAppIconUrl((branch as any).appIconUrl || "");
        setAppName((branch as any).appName || branch.name);
        setAppShortName((branch as any).appShortName || branch.name.substring(0, 12));
        setAppThemeColor((branch as any).appThemeColor || branch.primaryColor || "#2563eb");
        setAppBackgroundColor((branch as any).appBackgroundColor || "transparent");
      }
    }
  }, [selectedAppIconBranch, restaurants]);

  const handleSaveAppIcon = async () => {
    if (!selectedAppIconBranch) return;
    setIsSavingAppIcon(true);
    try {
      const res = await fetch(`/api/restaurants/${selectedAppIconBranch}/app-icon`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appIconUrl, appName, appShortName, appThemeColor, appBackgroundColor }),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast({ title: "App Icon Saved", description: "Mobile app settings have been updated." });
      queryClient.invalidateQueries({ queryKey: ["/api/restaurants"] });
    } catch (error) {
      toast({ title: "Error", description: "Failed to save app icon settings.", variant: "destructive" });
    } finally {
      setIsSavingAppIcon(false);
    }
  };

  const renderAppIcon = () => {
    const filteredBranches = restaurants.filter(r =>
      r.name.toLowerCase().includes(appIconSearchQuery.toLowerCase()) ||
      r.address.toLowerCase().includes(appIconSearchQuery.toLowerCase())
    );
    const selectedBranch = restaurants.find(r => r.id === selectedAppIconBranch);

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Mobile App Icon
            </CardTitle>
            <CardDescription>Select a branch to customize its mobile app icon and settings.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search branches..."
                className="pl-10"
                value={appIconSearchQuery}
                onChange={(e) => setAppIconSearchQuery(e.target.value)}
                data-testid="input-search-app-icon-branch"
              />
            </div>
            
            <ScrollArea className="h-64 border rounded-lg">
              <div className="p-2 space-y-1">
                {filteredBranches.map(branch => (
                  <Button
                    key={branch.id}
                    variant={selectedAppIconBranch === branch.id ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setSelectedAppIconBranch(branch.id)}
                    data-testid={`app-icon-branch-${branch.id}`}
                  >
                    <Store className="h-4 w-4 mr-2" />
                    {branch.name}
                  </Button>
                ))}
                {filteredBranches.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">No branches found</p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {selectedBranch ? `App Icon for ${selectedBranch.name}` : "Select a Branch"}
            </CardTitle>
            <CardDescription>
              Customize the icon and name that appears when customers install your app.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedBranch ? (
              <div className="space-y-6">
                {/* App Icon Preview */}
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-2xl border-2 overflow-hidden flex items-center justify-center" style={{ background: 'repeating-conic-gradient(#d4d4d4 0% 25%, transparent 0% 50%) 50% / 16px 16px' }}>
                    {appIconUrl ? (
                      <img src={appIconUrl} alt="App Icon" className="w-full h-full object-contain" />
                    ) : (
                      <Store className="h-8 w-8 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold">{appShortName || selectedBranch.name}</p>
                    <p className="text-xs text-muted-foreground">How it appears on phone home screen</p>
                  </div>
                </div>

                {/* AI Icon Generator */}
                <div className="border-2 border-purple-200 dark:border-purple-800 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600">
                    <h3 className="flex items-center gap-2 font-bold text-white text-sm">
                      <Sparkles className="h-4 w-4" /> AI App Icon Generator
                    </h3>
                    <p className="text-purple-100 text-xs mt-0.5">Type your shop name and AI creates Apple-style icons</p>
                  </div>
                  <div className="p-4 space-y-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder={appName || selectedBranch.name || "Enter your shop name..."}
                        value={aiIconPrompt}
                        onChange={(e) => setAiIconPrompt(e.target.value)}
                        className="flex-1"
                        data-testid="input-ai-icon-name"
                      />
                      <Button
                        onClick={handleGenerateIcons}
                        disabled={isGeneratingIcons}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6"
                        data-testid="button-generate-ai-icons"
                      >
                        {isGeneratingIcons ? (
                          <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating...</>
                        ) : (
                          <><Sparkles className="h-4 w-4 mr-2" /> Generate</>
                        )}
                      </Button>
                    </div>
                    {(generatedIcons.length > 0 || isGeneratingIcons) && (
                      <div className="grid grid-cols-2 gap-4">
                        {generatedIcons.map((icon, i) => (
                          <div key={i} className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-md">
                            <div className="aspect-square overflow-hidden">
                              <img
                                src={`data:image/png;base64,${icon.b64}`}
                                alt={`${icon.style} icon`}
                                className="w-full h-full object-cover"
                                data-testid={`img-generated-icon-${i}`}
                              />
                            </div>
                            <div className="px-2 pb-2 space-y-1.5">
                              <p className="text-xs text-center capitalize font-semibold">{icon.style} Style</p>
                              <div className="flex gap-1.5">
                                <Button
                                  size="sm"
                                  onClick={() => handleUseGeneratedIcon(icon.b64, i)}
                                  disabled={isUploadingGenIcon === i}
                                  className="flex-1 text-xs h-7 bg-green-600 hover:bg-green-700 text-white"
                                  data-testid={`button-use-icon-${i}`}
                                >
                                  {isUploadingGenIcon === i ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Check className="h-3 w-3 mr-1" /> Use</>}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    const link = document.createElement("a");
                                    link.href = `data:image/png;base64,${icon.b64}`;
                                    link.download = `app-icon-${icon.style}.png`;
                                    link.click();
                                  }}
                                  className="text-xs h-7 px-2"
                                  data-testid={`button-download-icon-${i}`}
                                >
                                  <Download className="h-3 w-3" />
                                </Button>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const img = new Image();
                                  img.onload = () => {
                                    const canvas = document.createElement("canvas");
                                    canvas.width = img.width;
                                    canvas.height = img.height;
                                    const ctx = canvas.getContext("2d")!;
                                    ctx.drawImage(img, 0, 0);
                                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                                    const data = imageData.data;
                                    const corners = [
                                      { x: 0, y: 0 },
                                      { x: canvas.width - 1, y: 0 },
                                      { x: 0, y: canvas.height - 1 },
                                      { x: canvas.width - 1, y: canvas.height - 1 },
                                    ];
                                    for (const corner of corners) {
                                      const idx = (corner.y * canvas.width + corner.x) * 4;
                                      const bgR = data[idx], bgG = data[idx + 1], bgB = data[idx + 2];
                                      const tolerance = 60;
                                      for (let py = 0; py < canvas.height; py++) {
                                        for (let px = 0; px < canvas.width; px++) {
                                          const pi = (py * canvas.width + px) * 4;
                                          const dr = Math.abs(data[pi] - bgR);
                                          const dg = Math.abs(data[pi + 1] - bgG);
                                          const db = Math.abs(data[pi + 2] - bgB);
                                          if (dr < tolerance && dg < tolerance && db < tolerance) {
                                            data[pi + 3] = 0;
                                          }
                                        }
                                      }
                                    }
                                    ctx.putImageData(imageData, 0, 0);
                                    const newB64 = canvas.toDataURL("image/png").split(",")[1];
                                    setGeneratedIcons(prev => prev.map((ic, idx) => idx === i ? { ...ic, b64: newB64 } : ic));
                                    toast({ title: "Background removed!" });
                                  };
                                  img.src = `data:image/png;base64,${icon.b64}`;
                                }}
                                className="w-full text-xs h-7 text-purple-600 border-purple-300 hover:bg-purple-50"
                                data-testid={`button-transparent-icon-${i}`}
                              >
                                <Sparkles className="h-3 w-3 mr-1" /> Make Transparent
                              </Button>
                            </div>
                          </div>
                        ))}
                        {isGeneratingIcons && generatedIcons.length < 4 && (
                          Array.from({ length: 4 - generatedIcons.length }).map((_, i) => (
                            <div key={`loading-${i}`} className="rounded-xl border-2 border-dashed border-purple-300 dark:border-purple-700 overflow-hidden">
                              <div className="aspect-square flex items-center justify-center bg-purple-50/50 dark:bg-purple-950/20">
                                <div className="text-center">
                                  <Loader2 className="h-8 w-8 animate-spin text-purple-500 mx-auto" />
                                  <p className="text-xs text-purple-500 font-medium mt-2">AI is creating...</p>
                                </div>
                              </div>
                              <div className="p-2 bg-gray-50 dark:bg-gray-900">
                                <div className="h-8 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                    {generatedIcons.length === 0 && !isGeneratingIcons && (
                      <div className="text-center py-6 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                        <Sparkles className="h-8 w-8 text-purple-300 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Enter your shop name above and click Generate</p>
                        <p className="text-xs text-muted-foreground mt-1">AI will create 4 different icon styles for you</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* App Icon URL */}
                <div className="space-y-2">
                  <Label>App Icon URL (512x512px recommended)</Label>
                  <Input
                    placeholder="https://example.com/icon.png"
                    value={appIconUrl}
                    onChange={(e) => setAppIconUrl(e.target.value)}
                    data-testid="input-app-icon-url"
                  />
                  <p className="text-xs text-muted-foreground">Or paste an icon URL manually</p>
                </div>

                {/* App Name */}
                <div className="space-y-2">
                  <Label>App Name (full name)</Label>
                  <Input
                    placeholder="Restaurant Name"
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    data-testid="input-app-name"
                  />
                </div>

                {/* App Short Name */}
                <div className="space-y-2">
                  <Label>Short Name (max 12 chars, shown under icon)</Label>
                  <Input
                    placeholder="Rest Name"
                    value={appShortName}
                    onChange={(e) => setAppShortName(e.target.value.substring(0, 12))}
                    maxLength={12}
                    data-testid="input-app-short-name"
                  />
                </div>

                {/* Colors */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Theme Color</Label>
                    <div className="flex gap-2">
                      <input 
                        type="color" 
                        value={appThemeColor} 
                        onChange={(e) => setAppThemeColor(e.target.value)} 
                        className="w-10 h-10 rounded cursor-pointer border" 
                      />
                      <Input 
                        value={appThemeColor} 
                        onChange={(e) => setAppThemeColor(e.target.value)} 
                        className="text-xs"
                        data-testid="input-app-theme-color"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Background Color</Label>
                    <div className="flex gap-2">
                      {appBackgroundColor !== "transparent" && (
                        <input 
                          type="color" 
                          value={appBackgroundColor} 
                          onChange={(e) => setAppBackgroundColor(e.target.value)} 
                          className="w-10 h-10 rounded cursor-pointer border" 
                        />
                      )}
                      <Input 
                        value={appBackgroundColor} 
                        onChange={(e) => setAppBackgroundColor(e.target.value)} 
                        placeholder="transparent"
                        className="text-xs"
                        data-testid="input-app-bg-color"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Type "transparent" for no background</p>
                  </div>
                </div>

                <Button 
                  className="w-full" 
                  onClick={handleSaveAppIcon}
                  disabled={isSavingAppIcon}
                  data-testid="button-save-app-icon"
                >
                  {isSavingAppIcon ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save App Icon Settings
                </Button>

                <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200">How customers install the app:</p>
                  <ol className="text-xs text-blue-700 dark:text-blue-300 mt-2 space-y-1 list-decimal list-inside">
                    <li>Visit your menu page: /menu/{selectedBranch.slug}</li>
                    <li>On iPhone: Tap Share → Add to Home Screen</li>
                    <li>On Android: Tap Menu → Install App</li>
                  </ol>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Smartphone className="h-12 w-12 mb-4 opacity-50" />
                <p>Select a branch to customize its mobile app icon</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderSettings = () => {
    const filteredBranchesForHours = restaurants.filter(r =>
      r.name.toLowerCase().includes(hoursSearchQuery.toLowerCase()) ||
      r.address.toLowerCase().includes(hoursSearchQuery.toLowerCase())
    );
    const selectedBranchData = restaurants.find(r => r.id === selectedHoursBranch);

    return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Operating Hours</CardTitle>
          <CardDescription>Select a branch to configure its opening times.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search branches..."
              className="pl-10"
              value={hoursSearchQuery}
              onChange={(e) => setHoursSearchQuery(e.target.value)}
              data-testid="input-search-hours-branch"
            />
          </div>
          
          <ScrollArea className="h-40 border rounded-lg">
            <div className="p-2 space-y-1">
              {filteredBranchesForHours.map(branch => (
                <button
                  key={branch.id}
                  onClick={() => {
                    setSelectedHoursBranch(branch.id);
                    setHoursSearchQuery("");
                  }}
                  className={`w-full text-left p-3 rounded-lg transition-all flex items-center gap-3 ${
                    selectedHoursBranch === branch.id 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-secondary/50'
                  }`}
                  data-testid={`hours-branch-${branch.id}`}
                >
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                    selectedHoursBranch === branch.id 
                      ? 'bg-primary-foreground/20' 
                      : 'bg-primary/10 text-primary'
                  }`}>
                    {branch.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-sm">{branch.name}</p>
                    <p className={`text-xs truncate ${selectedHoursBranch === branch.id ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                      {branch.address}
                    </p>
                  </div>
                </button>
              ))}
              {filteredBranchesForHours.length === 0 && (
                <p className="text-center text-muted-foreground py-4 text-sm">No branches found</p>
              )}
            </div>
          </ScrollArea>

          {selectedBranchData && (
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center gap-2 mb-4">
                <Store className="h-4 w-4 text-primary" />
                <span className="font-semibold">{selectedBranchData.name}</span>
              </div>
              
              <div className="space-y-3">
                <Label className="text-sm font-medium">Delivery Hours</Label>
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm w-24 text-muted-foreground">Mon-Thu:</span>
                    <Input 
                      value={branchHours.deliveryHoursMonThu}
                      onChange={(e) => setBranchHours(prev => ({ ...prev, deliveryHoursMonThu: e.target.value }))}
                      placeholder="12PM - 10:30PM"
                      className="flex-1"
                      data-testid="input-delivery-mon-thu"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm w-24 text-muted-foreground">Fri-Sat:</span>
                    <Input 
                      value={branchHours.deliveryHoursFriSat}
                      onChange={(e) => setBranchHours(prev => ({ ...prev, deliveryHoursFriSat: e.target.value }))}
                      placeholder="12PM - 11:30PM"
                      className="flex-1"
                      data-testid="input-delivery-fri-sat"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm w-24 text-muted-foreground">Sunday:</span>
                    <Input 
                      value={branchHours.deliveryHoursSun}
                      onChange={(e) => setBranchHours(prev => ({ ...prev, deliveryHoursSun: e.target.value }))}
                      placeholder="12PM - 10:30PM"
                      className="flex-1"
                      data-testid="input-delivery-sun"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">Collection Hours</Label>
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm w-24 text-muted-foreground">Mon-Thu:</span>
                    <Input 
                      value={branchHours.collectionHoursMonThu}
                      onChange={(e) => setBranchHours(prev => ({ ...prev, collectionHoursMonThu: e.target.value }))}
                      placeholder="12PM - 10:30PM"
                      className="flex-1"
                      data-testid="input-collection-mon-thu"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm w-24 text-muted-foreground">Fri-Sat:</span>
                    <Input 
                      value={branchHours.collectionHoursFriSat}
                      onChange={(e) => setBranchHours(prev => ({ ...prev, collectionHoursFriSat: e.target.value }))}
                      placeholder="12PM - 11:30PM"
                      className="flex-1"
                      data-testid="input-collection-fri-sat"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm w-24 text-muted-foreground">Sunday:</span>
                    <Input 
                      value={branchHours.collectionHoursSun}
                      onChange={(e) => setBranchHours(prev => ({ ...prev, collectionHoursSun: e.target.value }))}
                      placeholder="12PM - 10:30PM"
                      className="flex-1"
                      data-testid="input-collection-sun"
                    />
                  </div>
                </div>
              </div>

              {/* Delivery Radius Settings */}
              <div className="space-y-3 pt-4 border-t">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Delivery Area Restriction
                </Label>
                <p className="text-xs text-muted-foreground">
                  Control which areas can place delivery orders to prevent far-away orders
                </p>
                
                <div className="space-y-3">
                  <div className="flex flex-col gap-2">
                    <Label className="text-xs text-muted-foreground">Delivery Area Type</Label>
                    <select
                      value={deliveryRadius.deliveryRadiusType}
                      onChange={(e) => setDeliveryRadius(prev => ({ 
                        ...prev, 
                        deliveryRadiusType: e.target.value as "uk_only" | "worldwide" | "radius" 
                      }))}
                      className="w-full p-2 border rounded-md text-sm"
                      data-testid="select-delivery-radius-type"
                    >
                      <option value="uk_only">UK Only (No Restriction)</option>
                      <option value="worldwide">Worldwide (No Restriction)</option>
                      <option value="radius">Specific Mileage Radius</option>
                    </select>
                  </div>

                  {deliveryRadius.deliveryRadiusType === "radius" && (
                    <>
                      <div className="flex flex-col gap-2">
                        <Label className="text-xs text-muted-foreground">Maximum Delivery Distance (Miles)</Label>
                        <select
                          value={deliveryRadius.deliveryRadiusMiles}
                          onChange={(e) => setDeliveryRadius(prev => ({ ...prev, deliveryRadiusMiles: e.target.value }))}
                          className="w-full p-2 border rounded-md text-sm"
                          data-testid="select-delivery-miles"
                        >
                          <option value="1">1 Mile</option>
                          <option value="2">2 Miles</option>
                          <option value="3">3 Miles</option>
                          <option value="4">4 Miles</option>
                          <option value="5">5 Miles</option>
                          <option value="6">6 Miles</option>
                          <option value="7">7 Miles</option>
                          <option value="8">8 Miles</option>
                          <option value="10">10 Miles</option>
                          <option value="15">15 Miles</option>
                          <option value="20">20 Miles</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col gap-1">
                          <Label className="text-xs text-muted-foreground">Restaurant Latitude</Label>
                          <Input
                            value={deliveryRadius.restaurantLatitude}
                            onChange={(e) => setDeliveryRadius(prev => ({ ...prev, restaurantLatitude: e.target.value }))}
                            placeholder="e.g. 51.5384"
                            className="text-sm"
                            data-testid="input-restaurant-latitude"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <Label className="text-xs text-muted-foreground">Restaurant Longitude</Label>
                          <Input
                            value={deliveryRadius.restaurantLongitude}
                            onChange={(e) => setDeliveryRadius(prev => ({ ...prev, restaurantLongitude: e.target.value }))}
                            placeholder="e.g. 0.7069"
                            className="text-sm"
                            data-testid="input-restaurant-longitude"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Find coordinates: Go to Google Maps, right-click your restaurant location, copy the coordinates
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {!selectedHoursBranch && (
            <div className="text-center text-muted-foreground py-8">
              <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Select a branch above to configure its hours</p>
            </div>
          )}
        </CardContent>
        {selectedHoursBranch && (
          <CardFooter>
            <Button 
              className="w-full" 
              onClick={handleSaveBranchHours}
              disabled={updateRestaurantMutation.isPending}
              data-testid="button-save-branch-hours"
            >
              {updateRestaurantMutation.isPending ? "Saving..." : "Save Settings"}
            </Button>
          </CardFooter>
        )}
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Payment Gateway</CardTitle>
            <CardDescription>Stripe integration status.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 border rounded-lg bg-secondary/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-[#635BFF] text-white p-2 rounded font-bold text-xl">S</div>
                <div>
                  <div className="font-bold">Stripe Connect</div>
                  <div className="text-xs text-muted-foreground">Platform Account Connected</div>
                </div>
              </div>
              <Badge className="bg-emerald-500">Active</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              To manage commission rates, go to <strong>Platform Commission</strong> in the sidebar.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notification Settings</CardTitle>
            <CardDescription>Configure system-wide alerts.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">SMS Notifications</Label>
                <p className="text-xs text-muted-foreground">Send text alerts for new orders.</p>
              </div>
              <Switch 
                checked={smsNotificationsEnabled}
                onCheckedChange={(checked) => {
                  setSmsNotificationsEnabled(checked);
                  handleSaveNotificationSettings(checked, emailDigestsEnabled);
                }}
                data-testid="switch-sms-notifications"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Email Digests</Label>
                <p className="text-xs text-muted-foreground">Daily revenue reports to owners.</p>
              </div>
              <Switch 
                checked={emailDigestsEnabled}
                onCheckedChange={(checked) => {
                  setEmailDigestsEnabled(checked);
                  handleSaveNotificationSettings(smsNotificationsEnabled, checked);
                }}
                data-testid="switch-email-digests"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
  };

  const handleLinkImport = async () => {
    const validUrls = linkImportUrls.filter(url => url.trim().length > 0);
    if (validUrls.length === 0) {
      toast({ title: "Error", description: "Please enter at least one URL", variant: "destructive" });
      return;
    }
    if (!linkImportRestaurant) {
      toast({ title: "Error", description: "Please select a branch first", variant: "destructive" });
      return;
    }

    setIsImportingFromLink(true);
    setLinkImportComplete(false);

    try {
      const response = await fetch('/api/scrape-menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: validUrls }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Show warnings for blocked URLs
        if (data.errors && data.errors.length > 0) {
          toast({ 
            title: "Some URLs could not be accessed", 
            description: data.errors[0], 
            variant: "destructive" 
          });
        }
        
        if (data.items && data.items.length > 0) {
          const items = data.items.map((item: any) => ({
            name: item.name || "",
            description: item.description || "",
            price: String(item.price || "0.00").replace(/[^0-9.]/g, '') || "0.00",
            category: item.category || "other-menus",
            isBold: item.isBold || false,
            isHeader: false,
            modifiers: (item.modifiers || []).map((mod: any) => ({
              name: mod.name || "",
              price: String(mod.price || "0.00").replace(/[^0-9.]/g, '') || "0.00",
              selected: true
            })),
            selected: true
          }));
          setLinkImportedItems(items);
          setLinkImportSections(data.sections || []);
          setLinkImportComplete(true);
          toast({ title: "Import Complete", description: `Found ${items.length} menu items from ${validUrls.length} page(s)` });
        } else if (data.suggestion) {
          // Dynamic site detected
          toast({ 
            title: "Website Uses Dynamic Loading", 
            description: data.suggestion, 
            variant: "destructive" 
          });
        } else if (data.errors && data.errors.length > 0) {
          // All URLs had errors
          toast({ 
            title: "Import Failed", 
            description: data.errors[0], 
            variant: "destructive" 
          });
        } else {
          toast({ title: "No Items Found", description: "Could not find menu items on the provided URL(s). Try the AI Menu Scanner with a photo instead.", variant: "destructive" });
        }
      } else {
        const error = await response.json();
        toast({ title: "Import Failed", description: error.error || "Could not import from URL", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Import Failed", description: "Could not import from URL", variant: "destructive" });
    } finally {
      setIsImportingFromLink(false);
    }
  };

  const handleAddLinkImportedItems = async () => {
    const selectedItems = linkImportedItems.filter(item => item.selected);
    if (selectedItems.length === 0) {
      toast({ title: "Error", description: "Please select at least one item to add", variant: "destructive" });
      return;
    }
    
    try {
      let modifiersAdded = 0;
      for (const item of selectedItems) {
        const cleanPrice = String(item.price || "0.00").replace(/[^0-9.]/g, '') || "0.00";
        const newMenuItem = await createMenuItem({
          restaurantId: linkImportRestaurant,
          name: item.name,
          description: item.description || "",
          price: cleanPrice,
          category: item.category || "other-menus",
          image: "",
          available: true,
        });
        
        const selectedModifiers = (item.modifiers || []).filter((m: { selected: boolean }) => m.selected);
        for (const mod of selectedModifiers) {
          const modPrice = String(mod.price || "0.00").replace(/[^0-9.]/g, '') || "0.00";
          await fetch(`/api/menu/${newMenuItem.id}/modifiers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: mod.name, price: modPrice, available: true }),
          });
          modifiersAdded++;
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/menu"] });
      const modMsg = modifiersAdded > 0 ? ` with ${modifiersAdded} toppings` : "";
      toast({ title: "Items Added", description: `${selectedItems.length} menu items${modMsg} have been added to the restaurant` });
      
      setLinkImportUrls([""]);
      setLinkImportedItems([]);
      setLinkImportComplete(false);
      setLinkImportSections([]);
    } catch (error) {
      toast({ title: "Error", description: "Failed to add some items", variant: "destructive" });
    }
  };

  const renderMenuManager = () => {
    const selectedBranch = restaurants.find(r => r.id === menuManagerBranch);
    const branchMenuItems = menuManagerBranch 
      ? menuItems.filter(m => m.restaurantId === menuManagerBranch)
      : [];
    
    type CategoryGroup = { name: string; icon: string; items: typeof branchMenuItems };
    const groupedByCategory: Record<string, CategoryGroup> = {};
    
    // Use filtered categories for this branch (prefers branch-specific over global)
    const branchCategories = getCategoriesForBranch(menuManagerBranch);
    
    branchCategories.forEach((cat: { id: string; slug?: string; name: string; icon: string }) => {
      const items = branchMenuItems.filter(m => 
        m.category === cat.id || 
        m.category === cat.slug || 
        m.category === cat.name ||
        m.category?.toLowerCase() === cat.name?.toLowerCase()
      );
      // Show ALL categories including empty ones
      groupedByCategory[cat.id] = { name: cat.name, icon: cat.icon, items };
    });

    const toggleCategory = (categoryId: string) => {
      setMenuManagerExpandedCategories(prev => 
        prev.includes(categoryId) 
          ? prev.filter(id => id !== categoryId)
          : [...prev, categoryId]
      );
    };

    const expandAll = () => {
      setMenuManagerExpandedCategories(Object.keys(groupedByCategory));
    };

    const collapseAll = () => {
      setMenuManagerExpandedCategories([]);
    };

    return (
      <div className="flex gap-6 h-[calc(100vh-10rem)]">
        {/* Branch Sidebar */}
        <div className="w-72 bg-card border rounded-xl overflow-hidden flex flex-col shrink-0">
          <div className="p-4 border-b bg-secondary/30">
            <h3 className="font-bold flex items-center gap-2">
              <Store className="h-4 w-4" /> Select Branch
            </h3>
            <p className="text-xs text-muted-foreground mt-1">Choose a branch to manage its menu</p>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {restaurants.map(r => {
                const theme = r.themeKey ? themes[r.themeKey] : null;
                const itemCount = menuItems.filter(m => m.restaurantId === r.id).length;
                const categoryCount = getBranchSpecificCategories(r.id).length;
                return (
                  <button
                    key={r.id}
                    onClick={() => {
                      setMenuManagerBranch(r.id);
                      setMenuManagerExpandedCategories([]);
                    }}
                    className={`w-full text-left p-3 rounded-lg transition-all ${
                      menuManagerBranch === r.id 
                        ? 'bg-primary text-primary-foreground' 
                        : 'hover:bg-secondary/50'
                    }`}
                    data-testid={`menu-manager-branch-${r.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className={`h-10 w-10 rounded-lg flex items-center justify-center font-bold text-sm ${
                          menuManagerBranch === r.id 
                            ? 'bg-primary-foreground/20 text-primary-foreground' 
                            : 'bg-primary/10 text-primary'
                        }`}
                        style={theme && menuManagerBranch !== r.id ? { backgroundColor: theme.colors.primary + '20', color: theme.colors.primary } : {}}
                      >
                        {r.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{r.name}</p>
                        <p className={`text-xs truncate ${menuManagerBranch === r.id ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                          {r.address}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge 
                        variant={r.status === "open" ? "default" : "secondary"} 
                        className={`text-[10px] ${menuManagerBranch === r.id && r.status === "open" ? 'bg-primary-foreground/20 text-primary-foreground' : r.status === "open" ? "bg-emerald-500" : ""}`}
                      >
                        {r.status}
                      </Badge>
                      <Badge variant="outline" className={`text-[10px] ${menuManagerBranch === r.id ? 'border-primary-foreground/30 text-primary-foreground' : ''}`}>
                        {itemCount} items
                      </Badge>
                      <Badge variant="outline" className={`text-[10px] ${menuManagerBranch === r.id ? 'border-primary-foreground/30 text-primary-foreground' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
                        {categoryCount} categories
                      </Badge>
                      {theme && (
                        <Badge 
                          variant="outline" 
                          className="text-[10px]"
                          style={menuManagerBranch !== r.id ? { borderColor: theme.colors.primary, color: theme.colors.primary } : {}}
                        >
                          {theme.name}
                        </Badge>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Menu Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {!menuManagerBranch ? (
            <Card className="flex-1 flex items-center justify-center">
              <CardContent className="text-center">
                <Store className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Select a Branch</h3>
                <p className="text-muted-foreground">Choose a branch from the sidebar to view and manage its menu</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold">{selectedBranch?.name} Menu</h3>
                  <p className="text-sm text-muted-foreground">{branchMenuItems.length} items in {Object.values(groupedByCategory).filter(cat => cat.items.length > 0).length} categories</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={expandAll}>
                    <ChevronDown className="h-4 w-4 mr-1" /> Expand All
                  </Button>
                  <Button variant="outline" size="sm" onClick={collapseAll}>
                    <ChevronUp className="h-4 w-4 mr-1" /> Collapse All
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setIsAddCategoryOpen(true)} data-testid="button-add-category">
                    <Plus className="h-4 w-4 mr-1" /> Add Category
                  </Button>
                  <Button size="sm" onClick={() => { setAddingMenuToRestaurant(menuManagerBranch); }} data-testid="button-add-menu-item-manager">
                    <Plus className="h-4 w-4 mr-1" /> Add Item
                  </Button>
                </div>
              </div>

              {/* Category List */}
              <ScrollArea className="flex-1">
                <div className="space-y-4 pr-4">
                  {Object.entries(groupedByCategory).map(([categoryId, category]) => (
                    <Card key={categoryId} className="overflow-hidden group/category" data-testid={`category-card-${categoryId}`}>
                      <div
                        className="w-full p-4 flex items-center justify-between bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer"
                        onClick={() => toggleCategory(categoryId)}
                        data-testid={`category-header-${categoryId}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{category.icon}</span>
                          <div className="text-left">
                            <h3 className="text-lg font-bold">{category.name}</h3>
                            <p className="text-sm text-muted-foreground">{category.items.length} items</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              const cat = branchCategories.find((c: { id: string; restaurantId: string | null; dbId?: string }) => c.id === categoryId);
                              const isGlobal = cat ? cat.restaurantId === null : true;
                              if (cat && (cat as any).dbId) {
                                setEditingCategoryId(categoryId);
                                setEditingCategoryDbId((cat as any).dbId);
                                setEditingCategoryName(category.name);
                                setEditingCategoryIcon(category.icon);
                                setEditingCategorySlug(cat.id);
                                setEditingCategoryIsGlobal(isGlobal);
                                setIsEditCategoryOpen(true);
                              } else {
                                toast({ title: "Cannot Edit", description: "Category not found in database", variant: "destructive" });
                              }
                            }}
                            data-testid={`button-edit-category-${categoryId}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              const cat = branchCategories.find((c: { id: string; dbId?: string }) => c.id === categoryId);
                              const dbId = cat ? (cat as any).dbId : "";
                              if (dbId) {
                                setDeleteCategoryConfirm({ id: dbId, name: category.name, itemCount: category.items.length });
                              } else {
                                toast({ title: "Cannot Delete", description: "Category not found in database", variant: "destructive" });
                              }
                            }}
                            data-testid={`button-delete-category-${categoryId}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Badge variant="outline">{category.items.length}</Badge>
                          {menuManagerExpandedCategories.includes(categoryId) ? (
                            <ChevronUp className="h-5 w-5" />
                          ) : (
                            <ChevronDown className="h-5 w-5" />
                          )}
                        </div>
                      </div>
                      
                      {menuManagerExpandedCategories.includes(categoryId) && (
                        <CardContent className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {category.items.map((item) => (
                              <div 
                                key={item.id} 
                                className="flex gap-4 p-3 bg-secondary/20 rounded-lg hover:bg-secondary/40 transition-colors group"
                                data-testid={`menu-item-manager-${item.id}`}
                              >
                                {/* Item Image */}
                                <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted shrink-0">
                                  {item.image ? (
                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                      <ImageIcon className="h-8 w-8" />
                                    </div>
                                  )}
                                </div>
                                
                                {/* Item Details */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <h4 className="font-bold text-base">{item.name}</h4>
                                      <p className="text-lg font-bold text-primary">{getCurrencySymbol(restaurants.find(r => r.id === menuManagerBranch)?.currency || "GBP")}{item.price}</p>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Button 
                                        type="button"
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-7 w-7"
                                        onClick={() => { setEditingMenuItem(item); setEditMenuCategory(item.category); }}
                                      >
                                        <Edit2 className="h-3.5 w-3.5" />
                                      </Button>
                                      <Button 
                                        type="button"
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-7 w-7 text-destructive"
                                        onClick={() => setDeleteConfirm({ type: "menuItem", id: item.id, name: item.name })}
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
                                  </div>
                                  {item.description && (
                                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{item.description}</p>
                                  )}
                                  <div className="flex items-center gap-2 mt-2">
                                    <Badge variant={item.available ? "default" : "secondary"} className={`text-[10px] ${item.available ? "bg-emerald-500" : ""}`}>
                                      {item.available ? "Available" : "Unavailable"}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  ))}

                  {Object.keys(groupedByCategory).length === 0 && (
                    <Card className="p-8 text-center">
                      <UtensilsCrossed className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="font-semibold mb-2">No Menu Items</h3>
                      <p className="text-muted-foreground mb-4">This branch doesn't have any menu items yet.</p>
                      <Button onClick={() => setAddingMenuToRestaurant(menuManagerBranch)}>
                        <Plus className="h-4 w-4 mr-2" /> Add First Item
                      </Button>
                    </Card>
                  )}
                </div>
              </ScrollArea>
            </>
          )}
        </div>
      </div>
    );
  };

  const renderLinkImport = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5 text-blue-500" />
            Import Menu from Website
          </CardTitle>
          <CardDescription>
            Paste a URL to a restaurant menu page and we'll automatically extract all items including names, descriptions, prices, and toppings.
          </CardDescription>
          <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-md">
            <p className="text-sm text-amber-200">
              <strong>Note:</strong> This works best with simple restaurant websites that show menu items directly on the page. 
              Delivery platforms (Just Eat, Deliveroo) and sites that use ordering widgets may not work. 
              For those, use the <strong>AI Menu Scanner</strong> with a photo or screenshot of the menu.
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Select Branch */}
          <div className="space-y-2">
            <Label className="text-base font-semibold flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center">1</span>
              Select Branch
            </Label>
            <Select value={linkImportRestaurant} onValueChange={setLinkImportRestaurant}>
              <SelectTrigger className="w-full max-w-md" data-testid="select-link-import-restaurant">
                <SelectValue placeholder="Choose a restaurant branch..." />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                {restaurants.map(r => (
                  <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Step 2: Enter URLs */}
          <div className="space-y-2">
            <Label className="text-base font-semibold flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center">2</span>
              Enter Menu Page URL(s)
            </Label>
            <p className="text-sm text-muted-foreground mb-3">
              Add one or more URLs. Each page will be scanned for menu items.
            </p>
            
            <div className="space-y-3">
              {linkImportUrls.map((url, idx) => (
                <div key={idx} className="flex gap-2">
                  <div className="flex-1 relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={url}
                      onChange={(e) => {
                        const newUrls = [...linkImportUrls];
                        newUrls[idx] = e.target.value;
                        setLinkImportUrls(newUrls);
                      }}
                      placeholder="https://restaurant.com/menu"
                      className="pl-10"
                      data-testid={`input-link-url-${idx}`}
                    />
                  </div>
                  {linkImportUrls.length > 1 && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setLinkImportUrls(prev => prev.filter((_, i) => i !== idx));
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => setLinkImportUrls(prev => [...prev, ""])}
                data-testid="button-add-url"
              >
                <Plus className="h-4 w-4" />
                Add Another Page
              </Button>
            </div>
          </div>

          {/* Step 3: Import */}
          <div className="space-y-2">
            <Label className="text-base font-semibold flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center">3</span>
              Import Menu
            </Label>
            <Button 
              onClick={handleLinkImport}
              disabled={isImportingFromLink || !linkImportRestaurant || linkImportUrls.every(u => !u.trim())}
              className="w-full max-w-md gap-2 bg-blue-600 hover:bg-blue-700"
              data-testid="button-import-from-link"
            >
              {isImportingFromLink ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Importing Menu...
                </>
              ) : (
                <>
                  <LinkIcon className="h-4 w-4" />
                  Import from URL
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {linkImportComplete && linkImportedItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Check className="h-5 w-5 text-emerald-500" />
                Imported Menu Items ({linkImportedItems.length})
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLinkImportedItems(prev => prev.map(item => ({ ...item, selected: true })))}
                >
                  Select All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLinkImportedItems(prev => prev.map(item => ({ ...item, selected: false })))}
                >
                  Deselect All
                </Button>
              </div>
            </CardTitle>
            <CardDescription>
              Review and edit the imported items. Bold items are highlighted. Select the ones you want to add to your menu.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {linkImportedItems.map((item, idx) => (
                <div 
                  key={idx} 
                  className={`p-4 rounded-lg border ${item.selected ? 'bg-blue-500/10 border-blue-500/30' : 'bg-secondary/30'}`}
                  data-testid={`imported-item-${idx}`}
                >
                  <div className="flex items-start gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 mt-1"
                      onClick={() => {
                        setLinkImportedItems(prev => prev.map((it, i) => 
                          i === idx ? { ...it, selected: !it.selected } : it
                        ));
                      }}
                    >
                      {item.selected ? (
                        <CheckSquare className="h-5 w-5 text-blue-500" />
                      ) : (
                        <Square className="h-5 w-5 text-muted-foreground" />
                      )}
                    </Button>
                    
                    <div className="flex-1">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div className="md:col-span-1">
                          <Label className="text-xs text-muted-foreground">Name</Label>
                          <Input
                            value={item.name}
                            onChange={(e) => {
                              setLinkImportedItems(prev => prev.map((it, i) => 
                                i === idx ? { ...it, name: e.target.value } : it
                              ));
                            }}
                            className={`h-8 ${item.isBold ? 'font-bold' : ''}`}
                          />
                        </div>
                        <div className="md:col-span-1">
                          <Label className="text-xs text-muted-foreground">Price</Label>
                          <Input
                            value={item.price}
                            onChange={(e) => {
                              setLinkImportedItems(prev => prev.map((it, i) => 
                                i === idx ? { ...it, price: e.target.value } : it
                              ));
                            }}
                            className="h-8"
                          />
                        </div>
                        <div className="md:col-span-1">
                          <Label className="text-xs text-muted-foreground">Category</Label>
                          <Select 
                            value={item.category} 
                            onValueChange={(v) => {
                              setLinkImportedItems(prev => prev.map((it, i) => 
                                i === idx ? { ...it, category: v } : it
                              ));
                            }}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {getCategoriesForBranch(linkImportBranch || null).map((cat: { id: string; name: string; icon: string }) => (
                                <SelectItem key={cat.id} value={cat.id}><CategoryIcon icon={cat.icon} /> {cat.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="md:col-span-1">
                          <Label className="text-xs text-muted-foreground">Description</Label>
                          <Input
                            value={item.description}
                            onChange={(e) => {
                              setLinkImportedItems(prev => prev.map((it, i) => 
                                i === idx ? { ...it, description: e.target.value } : it
                              ));
                            }}
                            className="h-8"
                            placeholder="Optional"
                          />
                        </div>
                      </div>
                      
                      {/* Styling indicator */}
                      {item.isBold && (
                        <div className="mt-2">
                          <Badge variant="secondary" className="text-xs">
                            <strong>B</strong> Bold Text
                          </Badge>
                        </div>
                      )}
                      
                      {/* Modifiers/Toppings */}
                      {item.modifiers && item.modifiers.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-dashed">
                          <Label className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                            <Plus className="h-3 w-3" /> Toppings/Add-ons ({item.modifiers.length})
                          </Label>
                          <div className="flex flex-wrap gap-2">
                            {item.modifiers.map((mod: { name: string; price: string; selected: boolean }, modIdx: number) => (
                              <Badge 
                                key={modIdx}
                                variant={mod.selected ? "default" : "outline"}
                                className={`cursor-pointer ${mod.selected ? 'bg-amber-500 hover:bg-amber-600' : ''}`}
                                onClick={() => {
                                  setLinkImportedItems(prev => prev.map((it, i) => 
                                    i === idx ? {
                                      ...it,
                                      modifiers: it.modifiers.map((m: { name: string; price: string; selected: boolean }, mi: number) => 
                                        mi === modIdx ? { ...m, selected: !m.selected } : m
                                      )
                                    } : it
                                  ));
                                }}
                              >
                                {mod.name} {mod.price !== "0.00" && `+${getCurrencySymbol(restaurants.find(r => r.id === linkImportRestaurantId)?.currency || "GBP")}${mod.price}`}
                                {mod.selected ? <Check className="h-3 w-3 ml-1" /> : null}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleAddLinkImportedItems}
              className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
              data-testid="button-add-imported-items"
            >
              <Plus className="h-4 w-4" />
              Add {linkImportedItems.filter(i => i.selected).length} Selected Items to Menu
            </Button>
          </CardFooter>
        </Card>
      )}

      {linkImportComplete && linkImportedItems.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No menu items found</p>
            <p className="text-muted-foreground">The page(s) you provided don't appear to contain menu data. Try a different URL.</p>
          </CardContent>
        </Card>
      )}

      {/* Sections Preview */}
      {linkImportSections.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Menu Sections Found</CardTitle>
            <CardDescription>These sections were detected in the menu pages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {linkImportSections.map((section, idx) => (
                <Badge key={idx} variant="outline" className="px-3 py-1">
                  {section.title} ({section.items.length} items)
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  // Payment Settings render function
  const renderPaymentSettings = () => {
    const selectedBranch = restaurants.find(r => r.id === paymentSettingsBranch);
    
    const handleSelectBranch = (branchId: string) => {
      const branch = restaurants.find(r => r.id === branchId);
      setPaymentSettingsBranch(branchId);
      setPaymentStripePublishable(branch?.stripePublishableKey || "");
      setPaymentStripeSecret(branch?.stripeSecretKey || "");
      setPaymentStripeAccountId(branch?.stripeAccountId || "");
    };

    const handleSavePaymentSettings = async () => {
      if (!paymentSettingsBranch) return;
      setIsSavingPayment(true);
      try {
        const response = await fetch(`/api/restaurants/${paymentSettingsBranch}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            stripePublishableKey: paymentStripePublishable || null,
            stripeSecretKey: paymentStripeSecret || null,
            stripeAccountId: paymentStripeAccountId || null,
          }),
        });
        if (!response.ok) {
          const error = await response.text();
          throw new Error(error || "Failed to save");
        }
        queryClient.invalidateQueries({ queryKey: ["/api/restaurants"] });
        toast({ title: "Saved", description: "Payment settings updated successfully" });
      } catch (err: any) {
        toast({ title: "Error", description: err.message || "Failed to save payment settings", variant: "destructive" });
      }
      setIsSavingPayment(false);
    };

    return (
      <div className="flex gap-6 h-[calc(100vh-10rem)]">
        {/* Branch Sidebar */}
        <div className="w-72 bg-card border rounded-xl overflow-hidden flex flex-col shrink-0">
          <div className="p-4 border-b bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <h3 className="font-bold flex items-center gap-2">
              <CreditCard className="h-4 w-4" /> Payment Card System
            </h3>
            <p className="text-xs text-blue-100 mt-1">Configure Stripe for branches</p>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {restaurants.map(r => (
                <button
                  key={r.id}
                  onClick={() => handleSelectBranch(r.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-all ${
                    paymentSettingsBranch === r.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                >
                  <div className="font-medium text-sm truncate">{r.name}</div>
                  <div className="text-xs opacity-70 flex items-center gap-1 mt-0.5">
                    {r.cardEnabled ? (
                      <><CheckCircle className="h-3 w-3 text-green-500" /> Card Enabled</>
                    ) : (
                      <><AlertCircle className="h-3 w-3 text-orange-500" /> Cash Only</>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Settings Panel */}
        <div className="flex-1 overflow-auto">
          {!paymentSettingsBranch ? (
            <Card className="h-full flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <CreditCard className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <h3 className="text-lg font-medium">Select a Branch</h3>
                <p className="text-sm">Choose a branch from the sidebar to configure payment</p>
              </div>
            </Card>
          ) : (
            <Card>
              <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  {selectedBranch?.name} - Payment Configuration
                </CardTitle>
                <CardDescription className="text-blue-100">
                  Configure Stripe to enable card payments for this branch
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Card Payment Toggle */}
                <div className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
                  <div>
                    <Label className="text-base font-semibold">Enable Card Payments</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      When enabled, customers can pay by card in checkout
                    </p>
                  </div>
                  <Switch 
                    checked={selectedBranch?.cardEnabled || false}
                    onCheckedChange={async (checked) => {
                      try {
                        const response = await fetch(`/api/restaurants/${paymentSettingsBranch}`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ cardEnabled: checked }),
                        });
                        if (!response.ok) throw new Error("Failed to update");
                        queryClient.invalidateQueries({ queryKey: ["/api/restaurants"] });
                        toast({ 
                          title: checked ? "Card Payments Enabled" : "Card Payments Disabled",
                          description: checked ? "Customers can now pay by card" : "Customers will only see cash option"
                        });
                      } catch (err) {
                        toast({ title: "Error", description: "Failed to update setting", variant: "destructive" });
                      }
                    }}
                  />
                </div>

                {/* Status Badge */}
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">Status:</span>
                  {selectedBranch?.cardEnabled ? (
                    <Badge className="bg-green-500 hover:bg-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" /> Card Payments Enabled
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-orange-600 border-orange-300">
                      <AlertCircle className="h-3 w-3 mr-1" /> Cash Only
                    </Badge>
                  )}
                </div>

                {/* Stripe Configuration */}
                <div className="border rounded-lg p-4 space-y-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
                  <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                    <CreditCard className="h-5 w-5" />
                    <h3 className="font-semibold">Stripe API Keys</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Stripe Account ID</Label>
                      <Input 
                        value={paymentStripeAccountId}
                        onChange={(e) => setPaymentStripeAccountId(e.target.value)}
                        placeholder="acct_..." 
                        className="bg-white dark:bg-gray-900"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Stripe Publishable Key</Label>
                      <Input 
                        value={paymentStripePublishable}
                        onChange={(e) => setPaymentStripePublishable(e.target.value)}
                        placeholder="pk_live_..." 
                        className="bg-white dark:bg-gray-900"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Stripe Secret Key</Label>
                      <Input 
                        type="password"
                        value={paymentStripeSecret}
                        onChange={(e) => setPaymentStripeSecret(e.target.value)}
                        placeholder="sk_live_..." 
                        className="bg-white dark:bg-gray-900"
                      />
                      <p className="text-xs text-muted-foreground">
                        Enter API keys from your customer's Stripe dashboard
                      </p>
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <Button 
                  onClick={handleSavePaymentSettings}
                  disabled={isSavingPayment}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  {isSavingPayment ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
                  ) : (
                    <><Save className="h-4 w-4 mr-2" /> Save Payment Settings</>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      {isDuplicating && (
        <div className="fixed inset-0 bg-black/70 z-[9999] flex items-center justify-center">
          <div className="bg-card p-8 rounded-xl shadow-2xl flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <div className="text-center">
              <h3 className="text-lg font-semibold text-foreground">Duplicating Branch</h3>
              <p className="text-sm text-muted-foreground mt-1">Please wait while we copy all data...</p>
            </div>
          </div>
        </div>
      )}
      <div className="h-screen bg-background font-sans flex overflow-hidden">
      <aside className="w-64 border-r bg-card hidden md:flex flex-col h-screen sticky top-0 overflow-hidden">
        <div className="p-6 border-b shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-lg">link24</h1>
              <p className="text-xs text-muted-foreground">Admin Panel</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto min-h-0">
          {[
            { id: "dashboard", icon: LayoutDashboard, label: "Mujeeb AI", isSpecial: true },
            { id: "restaurants", icon: Store, label: "Branches" },
            { id: "customers", icon: Users, label: "Branches Customers" },
            { id: "welcome-editor", icon: Home, label: "Welcome Page" },
            { id: "menu-manager", icon: UtensilsCrossed, label: "Menu Manager" },
            { id: "menus", icon: UtensilsCrossed, label: "All Menu Items" },
            { id: "menu-import", icon: Copy, label: "Menu Import" },
            { id: "bulk-images", icon: ImagePlus, label: "Bulk Images" },
            { id: "category-media", icon: Images, label: "Category Media" },
            { id: "replace-menu", icon: RefreshCw, label: "Replace Menu, Categories" },
            { id: "topping-menus", icon: Plus, label: "Topping Menus" },
            { id: "platform-commission", icon: Percent, label: "Platform Commission" },
            { id: "theme-colors", icon: Palette, label: "Theme Colors" },
            { id: "app-icon", icon: Smartphone, label: "App Icon" },
            { id: "sound-settings", icon: Volume2, label: "Sound Settings" },
            { id: "data-recovery", icon: History, label: "Data Recovery" },
            { id: "delivery-area", icon: MapPin, label: "Delivery Area" },
            { id: "menu-background", icon: Palette, label: "Menu Background" },
            { id: "bank-transfer", icon: Building, label: "Bank Transfer" },
            { id: "qr-code", icon: QrCode, label: "QR Code" },
            { id: "twilio-system", icon: Phone, label: "Twilio System" },
            { id: "link24-phone", icon: Phone, label: "Link24 Phone (PBX)" },
            { id: "marketing-staff", icon: Briefcase, label: "Marketing Staff" },
            { id: "settings", icon: Settings, label: "Settings" },
          ].map(item => (
            <Button
              key={item.id}
              variant={activeTab === item.id ? "secondary" : "ghost"}
              className="w-full justify-start gap-3"
              onClick={() => { setActiveTab(item.id); setSearchQuery(""); }}
              data-testid={`nav-${item.id}`}
            >
              <item.icon className="h-4 w-4" /> 
              {(item as any).isSpecial ? (
                <div className="flex items-center">
                  <span className="bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent font-bold">Mujeeb</span>
                  <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent font-black italic ml-1.5">AI</span>
                </div>
              ) : item.label}
            </Button>
          ))}
          <div className="border-t border-border my-2 pt-2">
            <p className="text-xs text-muted-foreground px-3 mb-2 font-semibold uppercase tracking-wider">External Modules</p>
            <Link href="/admin-payments">
              <Button variant="ghost" className="w-full justify-start gap-3" data-testid="nav-payment-applications">
                <CreditCard className="h-4 w-4" /> Payment Applications
              </Button>
            </Link>
          </div>
        </nav>

        <div className="p-4 pb-16 border-t space-y-2 shrink-0">
          <Link href="/portal">
            <Button variant="outline" className="w-full gap-2" data-testid="button-back">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          </Link>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-y-auto">
        <header className="h-16 border-b bg-card px-4 md:px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 md:gap-4">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden" data-testid="mobile-menu-trigger">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0 flex flex-col h-full overflow-hidden">
                <div className="p-6 border-b">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                      <ShieldCheck className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div>
                      <h1 className="font-bold text-lg">link24</h1>
                      <p className="text-xs text-muted-foreground">Admin Panel</p>
                    </div>
                  </div>
                </div>
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                  {[
                    { id: "dashboard", icon: LayoutDashboard, label: "Mujeeb AI", isSpecial: true },
                    { id: "restaurants", icon: Store, label: "Branches" },
                    { id: "customers", icon: Users, label: "Branches Customers" },
                    { id: "welcome-editor", icon: Home, label: "Welcome Page" },
                    { id: "menu-manager", icon: UtensilsCrossed, label: "Menu Manager" },
                    { id: "menus", icon: UtensilsCrossed, label: "All Menu Items" },
                    { id: "menu-import", icon: Copy, label: "Menu Import" },
                    { id: "bulk-images", icon: ImagePlus, label: "Bulk Images" },
                    { id: "category-media", icon: Images, label: "Category Media" },
                    { id: "replace-menu", icon: RefreshCw, label: "Replace Menu, Categories" },
                    { id: "topping-menus", icon: Plus, label: "Topping Menus" },
                    { id: "platform-commission", icon: Percent, label: "Platform Commission" },
                    { id: "theme-colors", icon: Palette, label: "Theme Colors" },
                    { id: "app-icon", icon: Smartphone, label: "App Icon" },
                    { id: "sound-settings", icon: Volume2, label: "Sound Settings" },
                    { id: "data-recovery", icon: History, label: "Data Recovery" },
                    { id: "delivery-area", icon: MapPin, label: "Delivery Area" },
                    { id: "menu-background", icon: Palette, label: "Menu Background" },
                    { id: "bank-transfer", icon: Building, label: "Bank Transfer" },
                    { id: "qr-code", icon: QrCode, label: "QR Code" },
                    { id: "twilio-system", icon: Phone, label: "Twilio System" },
                    { id: "link24-phone", icon: Phone, label: "Link24 Phone (PBX)" },
                    { id: "marketing-staff", icon: Briefcase, label: "Marketing Staff" },
                    { id: "settings", icon: Settings, label: "Settings" },
                  ].map(item => (
                    <Button
                      key={item.id}
                      variant={activeTab === item.id ? "secondary" : "ghost"}
                      className="w-full justify-start gap-3"
                      onClick={() => { setActiveTab(item.id); setSearchQuery(""); setMobileMenuOpen(false); }}
                      data-testid={`mobile-nav-${item.id}`}
                    >
                      <item.icon className="h-4 w-4" /> 
                      {(item as any).isSpecial ? (
                        <div className="flex items-center">
                          <span className="bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent font-bold">Mujeeb</span>
                          <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent font-black italic ml-1.5">AI</span>
                        </div>
                      ) : item.label}
                    </Button>
                  ))}
                  <div className="border-t border-border my-2 pt-2">
                    <p className="text-xs text-muted-foreground px-3 mb-2 font-semibold uppercase tracking-wider">External Modules</p>
                    <Link href="/admin-payments">
                      <Button variant="ghost" className="w-full justify-start gap-3" data-testid="mobile-nav-payment-applications">
                        <CreditCard className="h-4 w-4" /> Payment Applications
                      </Button>
                    </Link>
                  </div>
                </nav>
                <div className="p-4 border-t space-y-2">
                  <Link href="/portal">
                    <Button variant="outline" className="w-full gap-2">
                      <ArrowLeft className="h-4 w-4" /> Back
                    </Button>
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
            <Link href="/portal" className="hidden md:block">
              <Button variant="ghost" size="sm" className="gap-2" data-testid="button-back-header">
                <ArrowLeft className="h-4 w-4" /> Back to Portal
              </Button>
            </Link>
            {activeTab === "dashboard" ? (
              <div className="relative group">
                <div className="relative px-4 py-2 bg-background rounded-xl border border-border/50 shadow-xl">
                  <h2 className="text-lg md:text-xl font-bold flex items-center">
                    <span className="bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500 bg-clip-text text-transparent font-extrabold tracking-tight">Mujeeb</span>
                    <span className="ml-1.5 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 bg-clip-text text-transparent font-black italic">AI</span>
                  </h2>
                </div>
              </div>
            ) : (
              <h2 className="text-lg md:text-xl font-bold capitalize">{activeTab === "menus" ? "Menu Items" : activeTab}</h2>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Logged in as <span className="font-bold text-foreground">Admin</span>
            </div>
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground font-bold">
              A
            </div>
          </div>
        </header>

        <ScrollArea className="flex-1">
          <div className="p-4 md:p-6">
            {activeTab === "dashboard" && renderDashboard()}
            {activeTab === "restaurants" && renderRestaurants()}
            {activeTab === "customers" && renderBranchesCustomers()}
            {activeTab === "welcome-editor" && renderWelcomeEditor()}
            {activeTab === "menu-manager" && renderMenuManager()}
            {activeTab === "menus" && renderMenus()}
            {activeTab === "menu-import" && renderMenuImport()}
            {activeTab === "bulk-images" && renderBulkImages()}
            {activeTab === "category-media" && renderCategoryMedia()}
            {activeTab === "replace-menu" && renderReplaceMenu()}
            {activeTab === "topping-menus" && renderToppingMenus()}
            {activeTab === "gallery" && renderGallery()}
            {activeTab === "data-recovery" && renderDataRecovery()}
            {activeTab === "delivery-area" && renderDeliveryArea()}
            {activeTab === "menu-background" && renderMenuBackground()}
            {activeTab === "qr-code" && renderQRCode()}
            {activeTab === "sound-settings" && renderSoundSettings()}
            {activeTab === "twilio-system" && renderTwilioSystem()}
            {activeTab === "platform-commission" && renderPlatformCommission()}
            {activeTab === "theme-colors" && renderThemeColors()}
            {activeTab === "app-icon" && renderAppIcon()}
            {activeTab === "bank-transfer" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Building className="h-6 w-6 text-purple-500" />
                    Bank Transfer Payment
                  </h2>
                  <p className="text-muted-foreground mt-1">Select a branch and add bank details. A QR code will be generated and shown at customer checkout.</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Select Branch</Label>
                  <Select 
                    value={bankTransferBranchId || ""} 
                    onValueChange={(val) => {
                      setBankTransferBranchId(val);
                      setBtBankName("");
                      setBtAccountName("");
                      setBtSortCode("");
                      setBtAccountNumber("");
                      setBtIban("");
                      setBtVideoUrl("");
                    }}
                  >
                    <SelectTrigger data-testid="select-bank-transfer-branch">
                      <SelectValue placeholder="Choose a branch..." />
                    </SelectTrigger>
                    <SelectContent>
                      {restaurants.map((r: any) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.name} {r.bankAccountName ? "  (Bank set)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {bankTransferBranchId && (
                  <div className="border rounded-lg p-6 space-y-5 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border-purple-500/30">
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Bank Name</Label>
                          <Input value={btBankName} onChange={(e) => setBtBankName(e.target.value)} placeholder="e.g. Halifax, Barclays, Lloyds..." data-testid="input-bt-bank-name" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Account Name</Label>
                          <Input value={btAccountName} onChange={(e) => setBtAccountName(e.target.value)} placeholder="e.g. Mujeeb Sardar" data-testid="input-bt-account-name" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Sort Code</Label>
                          <Input value={btSortCode} onChange={(e) => setBtSortCode(e.target.value)} placeholder="e.g. 11-13-16" data-testid="input-bt-sort-code" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Account Number</Label>
                          <Input value={btAccountNumber} onChange={(e) => setBtAccountNumber(e.target.value)} placeholder="e.g. 00065300" data-testid="input-bt-account-number" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">IBAN (optional, for international transfers)</Label>
                        <Input value={btIban} onChange={(e) => setBtIban(e.target.value)} placeholder="e.g. GB29 NWBK 6016 1331 9268 19" data-testid="input-bt-iban" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Video Tutorial URL (optional)</Label>
                        <Input value={btVideoUrl} onChange={(e) => setBtVideoUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." data-testid="input-bt-video-url" />
                      </div>
                    </div>

                    {btAccountName && (
                      <div className="border-t border-purple-500/20 pt-5">
                        <p className="text-sm font-semibold text-purple-500 mb-3 flex items-center gap-1.5">
                          <CheckCircle className="h-4 w-4" /> QR Code Preview
                        </p>
                        <div className="flex items-center gap-5 bg-white rounded-xl p-5 shadow-sm">
                          <QRCodeSVG
                            value={[
                              btBankName && `Bank: ${btBankName}`,
                              btAccountName && `Account: ${btAccountName}`,
                              btSortCode && `Sort Code: ${btSortCode}`,
                              btAccountNumber && `Acc No: ${btAccountNumber}`,
                              btIban && `IBAN: ${btIban}`
                            ].filter(Boolean).join('\n')}
                            size={140}
                            level="M"
                          />
                          <div className="text-sm space-y-1.5 text-gray-700">
                            {btBankName && <p><span className="font-semibold">Bank:</span> {btBankName}</p>}
                            <p><span className="font-semibold">Account:</span> {btAccountName}</p>
                            {btSortCode && <p><span className="font-semibold">Sort Code:</span> {btSortCode}</p>}
                            {btAccountNumber && <p><span className="font-semibold">Acc No:</span> {btAccountNumber}</p>}
                            {btIban && <p><span className="font-semibold">IBAN:</span> {btIban}</p>}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">This QR code and bank details will appear at customer checkout when they select "Bank" payment.</p>
                      </div>
                    )}

                    <Button
                      className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                      disabled={isSavingBankTransfer}
                      onClick={async () => {
                        setIsSavingBankTransfer(true);
                        try {
                          const res = await fetch(`/api/restaurants/${bankTransferBranchId}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              bankTransferEnabled: !!btAccountName.trim(),
                              bankName: btBankName.trim() || null,
                              bankAccountName: btAccountName.trim() || null,
                              bankSortCode: btSortCode.trim() || null,
                              bankAccountNumber: btAccountNumber.trim() || null,
                              bankIban: btIban.trim() || null,
                              bankTransferVideoUrl: btVideoUrl.trim() || null,
                            }),
                          });
                          if (!res.ok) throw new Error("Failed to save");
                          queryClient.invalidateQueries({ queryKey: ["/api/restaurants"] });
                          toast({ title: "Bank Transfer Saved", description: "Bank details have been updated for this branch." });
                        } catch (err) {
                          toast({ title: "Error", description: "Failed to save bank transfer details.", variant: "destructive" });
                        } finally {
                          setIsSavingBankTransfer(false);
                        }
                      }}
                      data-testid="button-save-bank-transfer"
                    >
                      {isSavingBankTransfer ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                      Save Bank Transfer Details
                    </Button>
                  </div>
                )}

                {!bankTransferBranchId && (
                  <div className="text-center py-12 text-muted-foreground border rounded-lg bg-secondary/20">
                    <Building className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">Select a branch above</p>
                    <p className="text-xs mt-1">Choose a branch to add or edit bank transfer details</p>
                  </div>
                )}
              </div>
            )}
            {activeTab === "link24-phone" && <AdminLink24Phone />}
            {activeTab === "marketing-staff" && <AdminMarketingStaff />}
            {activeTab === "settings" && renderSettings()}
          </div>
        </ScrollArea>
      </main>

      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Delete {deleteConfirm?.type === "restaurant" ? "Branch" : "Menu Item"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteConfirm?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteConfirm?.type === "restaurant") {
                  deleteRestaurantMutation.mutate(deleteConfirm.id);
                } else if (deleteConfirm?.type === "menuItem") {
                  deleteMenuItemMutation.mutate(deleteConfirm.id);
                }
              }}
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!editingMenuItem} onOpenChange={(open) => { if (!open) { setEditingMenuItem(null); setEditMenuImageUrl(""); setEditMenuCategory(""); } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="h-5 w-5" /> Edit Menu Item
            </DialogTitle>
            <DialogDescription>Update item details, image, and category.</DialogDescription>
          </DialogHeader>
          {editingMenuItem && (
            <form onSubmit={handleUpdateMenuItem} className="space-y-6 py-4">
              <div className="flex gap-4">
                <div className="w-32 h-32 rounded-lg bg-gray-100 overflow-hidden shrink-0 relative">
                  {(editMenuImageUrl || editingMenuItem.image) ? (
                    <img src={editMenuImageUrl || editingMenuItem.image || ""} alt={editingMenuItem.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-gray-300" />
                    </div>
                  )}
                  {editMenuImageUrl && (
                    <Button 
                      type="button" 
                      size="icon" 
                      variant="destructive" 
                      className="absolute top-1 right-1 h-5 w-5"
                      onClick={() => setEditMenuImageUrl("")}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <div className="flex-1 space-y-3">
                  <div className="space-y-2">
                    <Label>Upload New Photo</Label>
                    <Input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, true)}
                      disabled={isUploadingImage}
                      data-testid="input-edit-menu-image-upload"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-item-image">Or paste Image URL</Label>
                    <Input 
                      id="edit-item-image" 
                      name="image" 
                      value={editMenuImageUrl || editingMenuItem.image || ""} 
                      onChange={(e) => setEditMenuImageUrl(e.target.value)}
                      placeholder="https://example.com/image.jpg" 
                      data-testid="input-edit-menu-image" 
                    />
                  </div>
                  {isUploadingImage && (
                    <div className="flex items-center gap-2 text-primary">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Uploading...</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Switch id="edit-available" name="available" defaultChecked={editingMenuItem.available ?? true} />
                    <Label htmlFor="edit-available">Available for order</Label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-item-name">Item Name *</Label>
                  <Input id="edit-item-name" name="name" defaultValue={editingMenuItem.name} required data-testid="input-edit-menu-name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-item-price">Price (£) *</Label>
                  <Input id="edit-item-price" name="price" type="number" step="0.01" defaultValue={editingMenuItem.price} required data-testid="input-edit-menu-price" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Branch *</Label>
                  <Select name="restaurantId" defaultValue={editingMenuItem.restaurantId || ""}>
                    <SelectTrigger data-testid="select-edit-menu-restaurant">
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {restaurants.map(r => (
                        <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <div className="flex gap-2">
                    <Select name="category" value={editMenuCategory || editingMenuItem.category} onValueChange={setEditMenuCategory}>
                      <SelectTrigger data-testid="select-edit-menu-category" className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-60 overflow-y-auto">
                        {getCategoriesForBranch(editingMenuItem.restaurantId || null).map((cat: { id: string; name: string; icon: string }) => (
                          <SelectItem key={cat.id} value={cat.id}><CategoryIcon icon={cat.icon} /> {cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        const currentCategory = editMenuCategory || editingMenuItem.category;
                        const category = allCategories.find((c: { id: string; name: string }) => c.id === currentCategory);
                        if (category) {
                          const itemCount = menuItems.filter(m => m.category === currentCategory && m.restaurantId === editingMenuItem.restaurantId).length;
                          setDeleteCategoryConfirm({ id: currentCategory, name: category.name, itemCount });
                        }
                      }}
                      title="Delete selected category"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-item-desc">Description</Label>
                <Textarea id="edit-item-desc" name="description" defaultValue={editingMenuItem.description || ""} rows={2} data-testid="input-edit-menu-description" />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { setEditingMenuItem(null); setEditMenuImageUrl(""); setEditMenuCategory(""); }}>Cancel</Button>
                <Button type="submit" disabled={updateMenuItemMutation.isPending || isUploadingImage} data-testid="button-save-menu-item">
                  {updateMenuItemMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!addingMenuToRestaurant && activeTab === "menu-manager"} onOpenChange={(open) => { if (!open) { setAddingMenuToRestaurant(null); setNewMenuItemName(""); setNewMenuItemPrice(""); setNewMenuItemImage(""); setNewMenuItemDescription(""); setNewMenuItemCategory("other-menus"); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" /> Add New Menu Item
            </DialogTitle>
            <DialogDescription>Add a new item to {restaurants.find(r => r.id === addingMenuToRestaurant)?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input 
                  value={newMenuItemName}
                  onChange={(e) => setNewMenuItemName(e.target.value)}
                  placeholder="Item name"
                  data-testid="input-global-new-menu-name"
                />
              </div>
              <div className="space-y-2">
                <Label>Price *</Label>
                <Input 
                  value={newMenuItemPrice}
                  onChange={(e) => setNewMenuItemPrice(e.target.value)}
                  placeholder="5.99"
                  data-testid="input-global-new-menu-price"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between" data-testid="select-global-new-menu-category">
                    {newMenuItemCategory ? (
                      <>
                        <CategoryIcon icon={allCategories.find((c: { id: string; icon: string }) => c.id === newMenuItemCategory)?.icon || ""} /> {allCategories.find((c: { id: string; name: string }) => c.id === newMenuItemCategory)?.name}
                      </>
                    ) : (
                      "Select category..."
                    )}
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0 max-h-60 overflow-y-auto">
                  {getCategoriesForBranch(addingMenuToRestaurant || null).map((cat: { id: string; name: string; icon: string }) => (
                    <div 
                      key={cat.id} 
                      className={`flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-muted ${newMenuItemCategory === cat.id ? 'bg-muted' : ''}`}
                    >
                      <div 
                        className="flex-1"
                        onClick={() => setNewMenuItemCategory(cat.id)}
                      >
                        <CategoryIcon icon={cat.icon} /> {cat.name}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          const itemCount = menuItems.filter(m => m.category === cat.id && m.restaurantId === addingMenuToRestaurant).length;
                          setDeleteCategoryConfirm({ id: cat.id, name: cat.name, itemCount });
                        }}
                        title="Delete category"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Image</Label>
              <div className="flex gap-2">
                <Input 
                  value={newMenuItemImage}
                  onChange={(e) => setNewMenuItemImage(e.target.value)}
                  placeholder="Image URL"
                  className="flex-1"
                  data-testid="input-global-new-menu-image"
                />
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleNewMenuImageUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Button type="button" variant="outline" disabled={isUploadingNewMenuImage}>
                    {isUploadingNewMenuImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input 
                value={newMenuItemDescription}
                onChange={(e) => setNewMenuItemDescription(e.target.value)}
                placeholder="Optional description"
                data-testid="input-global-new-menu-description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAddingMenuToRestaurant(null); setNewMenuItemName(""); setNewMenuItemPrice(""); setNewMenuItemImage(""); setNewMenuItemDescription(""); setNewMenuItemCategory("other-menus"); }}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (addingMenuToRestaurant) {
                  handleAddNewMenuItem(addingMenuToRestaurant);
                }
              }}
              disabled={!newMenuItemName || !newMenuItemPrice}
              data-testid="button-submit-global-new-menu-item"
            >
              Add Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" /> Add New Category
            </DialogTitle>
            <DialogDescription>
              {menuManagerBranch ? (
                <>Create a new category for <strong>{restaurants.find(r => r.id === menuManagerBranch)?.name}</strong></>
              ) : (
                "Create a new menu category available for all branches"
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Category Name *</Label>
              <Input 
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="e.g. Biryani, Tandoori, Pizza"
                data-testid="input-new-category-name"
              />
            </div>
            <div className="space-y-2">
              <Label>Icon Type</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={newCategoryIconType === "emoji" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setNewCategoryIconType("emoji")}
                >
                  Emoji
                </Button>
                <Button
                  type="button"
                  variant={newCategoryIconType === "image" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setNewCategoryIconType("image")}
                >
                  Upload Image
                </Button>
              </div>
            </div>
            
            {newCategoryIconType === "emoji" ? (
              <div className="space-y-2">
                <Label>Icon (emoji)</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    value={newCategoryIcon}
                    onChange={(e) => setNewCategoryIcon(e.target.value)}
                    placeholder="🍽️"
                    className="w-20 text-center text-xl"
                    data-testid="input-new-category-icon"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => setNewCategoryIcon("")}
                  >
                    Clear
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Paste an emoji to represent this category</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Icon Image</Label>
                {newCategoryIconUrl ? (
                  <div className="flex items-center gap-3">
                    <img src={newCategoryIconUrl} alt="Category icon" className="w-12 h-12 object-contain rounded border" />
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => setNewCategoryIconUrl("")}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      disabled={isUploadingCategoryIcon}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setIsUploadingCategoryIcon(true);
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
                              setNewCategoryIconUrl(data.url);
                              toast({ title: "Icon Uploaded", description: "Category icon uploaded successfully!" });
                            } else {
                              const error = await response.json();
                              toast({ title: "Upload Failed", description: error.error, variant: "destructive" });
                            }
                            setIsUploadingCategoryIcon(false);
                          };
                          reader.readAsDataURL(file);
                        } catch (err) {
                          toast({ title: "Upload Failed", description: "Failed to upload icon", variant: "destructive" });
                          setIsUploadingCategoryIcon(false);
                        }
                      }}
                      data-testid="input-category-icon-upload"
                    />
                    {isUploadingCategoryIcon && <Loader2 className="h-4 w-4 animate-spin" />}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">Upload a custom icon image (PNG, JPG)</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { 
              setIsAddCategoryOpen(false); 
              setNewCategoryName(""); 
              setNewCategoryIcon("🍽️"); 
              setNewCategoryIconType("emoji");
              setNewCategoryIconUrl("");
            }}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (newCategoryName) {
                  const iconValue = newCategoryIconType === "image" ? newCategoryIconUrl : newCategoryIcon;
                  createCategoryMutation.mutate({ 
                    name: newCategoryName, 
                    icon: iconValue || "🍽️",
                    restaurantId: menuManagerBranch || undefined
                  });
                }
              }}
              disabled={!newCategoryName || createCategoryMutation.isPending || isUploadingCategoryIcon}
              data-testid="button-submit-new-category"
            >
              {createCategoryMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={isEditCategoryOpen} onOpenChange={setIsEditCategoryOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="h-5 w-5" />
              Edit Category
            </DialogTitle>
            <DialogDescription>Update the category name, icon, and media for large cards</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Category Name *</Label>
              <Input 
                value={editingCategoryName}
                onChange={(e) => setEditingCategoryName(e.target.value)}
                placeholder="e.g. Biryani, Tandoori, Pizza"
                data-testid="input-edit-category-name"
              />
            </div>
            <div className="space-y-2">
              <Label>Icon (Emoji)</Label>
              <div className="flex gap-2">
                <Input 
                  value={editingCategoryIcon}
                  onChange={(e) => setEditingCategoryIcon(e.target.value)}
                  placeholder="🍽️"
                  className="w-20"
                  data-testid="input-edit-category-icon"
                />
                <div className="text-2xl p-2">{editingCategoryIcon || "🍽️"}</div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description (Optional)</Label>
              <Input 
                value={editingCategoryDescription}
                onChange={(e) => setEditingCategoryDescription(e.target.value)}
                placeholder="Short description for the category card"
                data-testid="input-edit-category-description"
              />
            </div>
            
            <div className="border rounded-lg p-4 space-y-4 bg-gradient-to-br from-amber-500/10 to-orange-500/10">
              <h4 className="font-semibold text-amber-700 dark:text-amber-400">Large Card Media (Optional)</h4>
              <p className="text-xs text-muted-foreground">Add images, GIFs, or videos to display on large landscape category cards. If multiple are added, they will slide automatically.</p>
              
              <div className="space-y-2">
                <Label className="text-sm">Image</Label>
                <div className="flex gap-2">
                  <Input 
                    value={editingCategoryImageUrl}
                    onChange={(e) => setEditingCategoryImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    data-testid="input-edit-category-image"
                    className="flex-1"
                  />
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file || !editingCategoryDbId) return;
                        setIsUploadingCategoryMedia('image');
                        const formData = new FormData();
                        formData.append('file', file);
                        try {
                          const res = await fetch(`/api/menu-categories/${editingCategoryDbId}/upload-media`, {
                            method: 'POST',
                            body: formData,
                          });
                          const data = await res.json();
                          if (data.url) {
                            setEditingCategoryImageUrl(data.url);
                            toast({ title: "Image uploaded successfully" });
                          } else {
                            toast({ title: "Upload failed", description: data.error || "Please try again", variant: "destructive" });
                          }
                        } catch (err) {
                          console.error('Upload failed:', err);
                          toast({ title: "Upload failed", description: "Network error, please try again", variant: "destructive" });
                        }
                        setIsUploadingCategoryMedia(null);
                      }}
                    />
                    <Button type="button" variant="outline" size="sm" disabled={isUploadingCategoryMedia === 'image'} asChild>
                      <span>{isUploadingCategoryMedia === 'image' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}</span>
                    </Button>
                  </label>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm">GIF</Label>
                <div className="flex gap-2">
                  <Input 
                    value={editingCategoryGifUrl}
                    onChange={(e) => setEditingCategoryGifUrl(e.target.value)}
                    placeholder="https://example.com/animation.gif"
                    data-testid="input-edit-category-gif"
                    className="flex-1"
                  />
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/gif"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file || !editingCategoryDbId) return;
                        setIsUploadingCategoryMedia('gif');
                        const formData = new FormData();
                        formData.append('file', file);
                        try {
                          const res = await fetch(`/api/menu-categories/${editingCategoryDbId}/upload-media`, {
                            method: 'POST',
                            body: formData,
                          });
                          const data = await res.json();
                          if (data.url) {
                            setEditingCategoryGifUrl(data.url);
                            toast({ title: "GIF uploaded successfully" });
                          } else {
                            toast({ title: "Upload failed", description: data.error || "Please try again", variant: "destructive" });
                          }
                        } catch (err) {
                          console.error('Upload failed:', err);
                          toast({ title: "Upload failed", description: "Network error, please try again", variant: "destructive" });
                        }
                        setIsUploadingCategoryMedia(null);
                      }}
                    />
                    <Button type="button" variant="outline" size="sm" disabled={isUploadingCategoryMedia === 'gif'} asChild>
                      <span>{isUploadingCategoryMedia === 'gif' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}</span>
                    </Button>
                  </label>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm">Video</Label>
                <div className="flex gap-2">
                  <Input 
                    value={editingCategoryVideoUrl}
                    onChange={(e) => setEditingCategoryVideoUrl(e.target.value)}
                    placeholder="https://example.com/video.mp4"
                    data-testid="input-edit-category-video"
                    className="flex-1"
                  />
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file || !editingCategoryDbId) return;
                        setIsUploadingCategoryMedia('video');
                        const formData = new FormData();
                        formData.append('file', file);
                        try {
                          const res = await fetch(`/api/menu-categories/${editingCategoryDbId}/upload-media`, {
                            method: 'POST',
                            body: formData,
                          });
                          const data = await res.json();
                          if (data.url) {
                            setEditingCategoryVideoUrl(data.url);
                            toast({ title: "Video uploaded successfully" });
                          } else {
                            toast({ title: "Upload failed", description: data.error || "Please try again", variant: "destructive" });
                          }
                        } catch (err) {
                          console.error('Upload failed:', err);
                          toast({ title: "Upload failed", description: "Network error, please try again", variant: "destructive" });
                        }
                        setIsUploadingCategoryMedia(null);
                      }}
                    />
                    <Button type="button" variant="outline" size="sm" disabled={isUploadingCategoryMedia === 'video'} asChild>
                      <span>{isUploadingCategoryMedia === 'video' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}</span>
                    </Button>
                  </label>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { 
              setIsEditCategoryOpen(false); 
              setEditingCategoryId(null);
              setEditingCategoryDbId("");
              setEditingCategoryName("");
              setEditingCategoryIcon("");
              setEditingCategoryImageUrl("");
              setEditingCategoryVideoUrl("");
              setEditingCategoryGifUrl("");
              setEditingCategoryDescription("");
            }}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (editingCategoryName && editingCategoryDbId && menuManagerBranch) {
                  updateCategoryMutation.mutate({ 
                    dbId: editingCategoryDbId,
                    name: editingCategoryName, 
                    icon: editingCategoryIcon || "🍽️",
                    slug: editingCategorySlug,
                    isGlobal: editingCategoryIsGlobal,
                    restaurantId: menuManagerBranch,
                  } as any);
                }
              }}
              disabled={!editingCategoryName || updateCategoryMutation.isPending}
              data-testid="button-submit-edit-category"
            >
              {updateCategoryMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteCategoryConfirm} onOpenChange={(open) => { if (!open) setDeleteCategoryConfirm(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Delete Category?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the category "{deleteCategoryConfirm?.name}"?
              {deleteCategoryConfirm?.itemCount && deleteCategoryConfirm.itemCount > 0 ? (
                <span className="block mt-2 text-destructive font-medium">
                  Warning: This category has {deleteCategoryConfirm.itemCount} items. They will need to be moved to another category first, or they will become uncategorized.
                </span>
              ) : (
                <span className="block mt-2">This category is empty and can be safely deleted.</span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteCategoryConfirm) {
                  deleteCategoryMutation.mutate(deleteCategoryConfirm.id);
                }
              }}
              data-testid="button-confirm-delete-category"
            >
              {deleteCategoryMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </>
  );
}
