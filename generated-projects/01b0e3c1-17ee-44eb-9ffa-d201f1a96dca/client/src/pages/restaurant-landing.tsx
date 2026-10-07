import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { getRestaurantBySlug, getMenuItems, getGalleryImages, getHeroImages, getPromotion } from "@/lib/api";
import { getCurrencySymbol } from "@shared/schema";
import { themes, getTheme } from "@shared/themes";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Clock, Phone, ChevronRight, ChevronLeft, Star, Loader2, Calendar, Users } from "lucide-react";
import { HeroCarousel } from "@/components/hero-carousel";
import { motion } from "framer-motion";
import useSound from "use-sound";

const DIXY_PREMIUM_THEME = {
  gradient: {
    background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 25%, #4c1d95 50%, #5b21b6 75%, #1e1b4b 100%)',
    header: 'linear-gradient(90deg, rgba(30, 27, 75, 0.98) 0%, rgba(76, 29, 149, 0.95) 50%, rgba(30, 27, 75, 0.98) 100%)',
    sidebar: 'linear-gradient(180deg, rgba(30, 27, 75, 0.98) 0%, rgba(49, 46, 129, 0.95) 50%, rgba(30, 27, 75, 0.98) 100%)',
    categoryBanner: 'linear-gradient(135deg, #dc2626 0%, #ea580c 50%, #dc2626 100%)',
    card: 'linear-gradient(145deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
  },
  colors: {
    primary: '#E31E24',
    accent: '#fbbf24',
    text: '#ffffff',
  }
};

const TAWA_THEME = {
  gradient: {
    background: 'linear-gradient(180deg, #1f2937 0%, #111827 100%)',
    header: 'linear-gradient(135deg, #d97706 0%, #ea580c 50%, #dc2626 100%)',
    hero: 'linear-gradient(180deg, rgba(217, 119, 6, 0.9) 0%, rgba(234, 88, 12, 0.8) 100%)',
  },
  colors: {
    primary: '#d97706',
    accent: '#ea580c',
    secondary: '#dc2626',
    text: '#ffffff',
    cream: '#faf5f0',
  }
};

const TAWA_WATFORD_THEME = {
  gradient: {
    background: 'linear-gradient(180deg, #0f1c2e 0%, #1a2d47 100%)',
    header: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a87 50%, #1e3a5f 100%)',
    hero: 'linear-gradient(180deg, rgba(30, 58, 95, 0.95) 0%, rgba(15, 28, 46, 0.9) 100%)',
    gold: 'linear-gradient(135deg, #c9a646 0%, #e8c547 50%, #c9a646 100%)',
    card: 'linear-gradient(145deg, rgba(30, 58, 95, 0.9) 0%, rgba(26, 45, 71, 0.95) 100%)',
  },
  colors: {
    primary: '#1e3a5f',
    accent: '#c9a646',
    secondary: '#2d5a87',
    gold: '#c9a646',
    text: '#ffffff',
    cream: '#f8f5f0',
  }
};

const EMPARO_THEME = {
  gradient: {
    background: 'linear-gradient(180deg, #fef7ed 0%, #fff7ed 100%)',
    header: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
    hero: 'linear-gradient(180deg, rgba(220, 38, 38, 0.95) 0%, rgba(185, 28, 28, 0.9) 100%)',
  },
  colors: {
    primary: '#dc2626',
    accent: '#f97316',
    cream: '#fef7ed',
    text: '#1f2937',
  }
};

const DHABA_THEME = {
  gradient: {
    background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
    header: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    hero: 'linear-gradient(180deg, rgba(26, 26, 46, 0.95) 0%, rgba(22, 33, 62, 0.9) 100%)',
    gold: 'linear-gradient(90deg, #c9a646, #f6c343, #c9a646)',
  },
  colors: {
    primary: '#1a1a2e',
    secondary: '#c9a646',
    accent: '#f6c343',
    text: '#ffffff',
  }
};

// Production theme keys
const SPICY_FLAME_THEME = {
  gradient: {
    background: 'linear-gradient(180deg, #1f1f1f 0%, #2d1f1f 100%)',
    header: 'linear-gradient(135deg, #dc2626 0%, #ea580c 50%, #f97316 100%)',
    hero: 'linear-gradient(180deg, rgba(220, 38, 38, 0.95) 0%, rgba(234, 88, 12, 0.9) 100%)',
  },
  colors: {
    primary: '#dc2626',
    accent: '#f97316',
    secondary: '#ea580c',
    text: '#ffffff',
    cream: '#fef7ed',
  }
};

const MIDNIGHT_BLUE_THEME = {
  gradient: {
    background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
    header: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #1e3a8a 100%)',
    hero: 'linear-gradient(180deg, rgba(30, 58, 138, 0.95) 0%, rgba(59, 130, 246, 0.8) 100%)',
  },
  colors: {
    primary: '#1e3a8a',
    accent: '#3b82f6',
    secondary: '#60a5fa',
    text: '#ffffff',
    cream: '#f0f9ff',
  }
};

const SUNSET_ORANGE_THEME = {
  gradient: {
    background: 'linear-gradient(180deg, #1c1917 0%, #292524 100%)',
    header: 'linear-gradient(135deg, #ea580c 0%, #f97316 50%, #fb923c 100%)',
    hero: 'linear-gradient(180deg, rgba(234, 88, 12, 0.95) 0%, rgba(251, 146, 60, 0.85) 100%)',
  },
  colors: {
    primary: '#ea580c',
    accent: '#fb923c',
    secondary: '#f97316',
    text: '#ffffff',
    cream: '#fff7ed',
  }
};

const FRESH_GREEN_THEME = {
  gradient: {
    background: 'linear-gradient(180deg, #14532d 0%, #166534 100%)',
    header: 'linear-gradient(135deg, #15803d 0%, #22c55e 50%, #4ade80 100%)',
    hero: 'linear-gradient(180deg, rgba(21, 128, 61, 0.95) 0%, rgba(34, 197, 94, 0.85) 100%)',
  },
  colors: {
    primary: '#15803d',
    accent: '#22c55e',
    secondary: '#4ade80',
    text: '#ffffff',
    cream: '#f0fdf4',
  }
};

const CLASSIC_RED_THEME = {
  gradient: {
    background: 'linear-gradient(180deg, #1f1f1f 0%, #2a1515 100%)',
    header: 'linear-gradient(135deg, #b91c1c 0%, #dc2626 50%, #ef4444 100%)',
    hero: 'linear-gradient(180deg, rgba(185, 28, 28, 0.95) 0%, rgba(220, 38, 38, 0.85) 100%)',
  },
  colors: {
    primary: '#dc2626',
    accent: '#ef4444',
    secondary: '#f87171',
    text: '#ffffff',
    cream: '#fef2f2',
  }
};

const TAWA_CLEAN_THEME = {
  gradient: {
    background: 'linear-gradient(180deg, #fafaf9 0%, #f5f5f4 100%)',
    header: 'linear-gradient(135deg, #292524 0%, #44403c 50%, #57534e 100%)',
    hero: 'linear-gradient(180deg, rgba(41, 37, 36, 0.9) 0%, rgba(68, 64, 60, 0.8) 100%)',
  },
  colors: {
    primary: '#292524',
    accent: '#a16207',
    secondary: '#ca8a04',
    text: '#ffffff',
    cream: '#fafaf9',
  }
};

const SPICY_THEME = {
  primary: "#dc2626",
  secondary: "#1e3a5f",
  accent: "#22c55e",
  dark: "#0f172a",
  cream: "#f8fafc",
  gradient: {
    hero: "linear-gradient(135deg, #dc2626 0%, #1e3a5f 35%, #22c55e 65%, #0f172a 100%)",
    header: "linear-gradient(135deg, #dc2626 0%, #1e3a5f 50%, #0f172a 100%)",
    button: "linear-gradient(135deg, #dc2626 0%, #22c55e 100%)",
    categoryBanner: "linear-gradient(135deg, #dc2626 0%, #1e3a5f 50%, #22c55e 100%)",
    card: "linear-gradient(145deg, rgba(30, 58, 95, 0.95) 0%, rgba(15, 23, 42, 0.9) 100%)",
    section1: "linear-gradient(180deg, #dc2626 0%, #b91c1c 100%)",
    section2: "linear-gradient(180deg, #1e3a5f 0%, #0f172a 100%)",
    section3: "linear-gradient(180deg, #22c55e 0%, #16a34a 100%)",
  }
};

const AFGHAN_ROYAL_THEME = {
  gradient: {
    background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 25%, #24243e 50%, #1a1a2e 75%, #0f0c29 100%)',
    header: 'linear-gradient(135deg, #1a1040 0%, #3d2180 25%, #c9a646 50%, #3d2180 75%, #1a1040 100%)',
    hero: 'linear-gradient(180deg, rgba(15, 12, 41, 0.9) 0%, rgba(48, 43, 99, 0.85) 50%, rgba(36, 36, 62, 0.95) 100%)',
    gold: 'linear-gradient(135deg, #c9a646 0%, #f6d365 25%, #ffeaa7 50%, #f6d365 75%, #c9a646 100%)',
    card: 'linear-gradient(145deg, rgba(48, 43, 99, 0.9) 0%, rgba(26, 26, 46, 0.95) 100%)',
    button: 'linear-gradient(135deg, #f6d365 0%, #fda085 50%, #f6d365 100%)',
    categoryBanner: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
    ornate: 'linear-gradient(45deg, #f093fb, #f5576c, #4facfe, #00f2fe, #f093fb)',
    premium: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  colors: {
    primary: '#302b63',
    secondary: '#f6d365',
    accent: '#f093fb',
    gold: '#fda085',
    deepPurple: '#1a1a2e',
    royalPurple: '#764ba2',
    burgundy: '#f5576c',
    text: '#ffffff',
    cream: '#ffeaa7',
    darkBg: '#0f0c29',
    vibrant: '#4facfe',
  }
};

const MEAT_WHOLESALE_THEME = {
  gradient: {
    background: 'linear-gradient(180deg, #0a0a0a 0%, #1a0a0a 50%, #0f0f0f 100%)',
    header: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 25%, #c9a646 50%, #991b1b 75%, #7f1d1d 100%)',
    hero: 'linear-gradient(180deg, rgba(127, 29, 29, 0.95) 0%, rgba(10, 10, 10, 0.98) 100%)',
    gold: 'linear-gradient(135deg, #c9a646 0%, #d4af37 25%, #f0d78c 50%, #d4af37 75%, #c9a646 100%)',
    card: 'linear-gradient(145deg, rgba(127, 29, 29, 0.3) 0%, rgba(10, 10, 10, 0.95) 100%)',
    button: 'linear-gradient(135deg, #991b1b 0%, #7f1d1d 50%, #991b1b 100%)',
    categoryBanner: 'linear-gradient(135deg, #7f1d1d 0%, #c9a646 50%, #7f1d1d 100%)',
    premium: 'linear-gradient(135deg, #1a0a0a 0%, #2a1515 50%, #1a0a0a 100%)',
  },
  colors: {
    primary: '#991b1b',
    secondary: '#c9a646',
    accent: '#d4af37',
    gold: '#f0d78c',
    darkRed: '#7f1d1d',
    burgundy: '#450a0a',
    text: '#ffffff',
    cream: '#f0d78c',
    darkBg: '#0a0a0a',
    charcoal: '#1a1a1a',
  }
};

const MAHARAJ_THEME = {
  primary: "#FF6B35",
  secondary: "#1E88E5",
  accent: "#FFD700",
  purple: "#9C27B0",
  green: "#4CAF50",
  pink: "#E91E63",
  teal: "#00BCD4",
  darkBg: "#1a0a2e",
  text: "#ffffff",
  gradient: {
    background: 'linear-gradient(135deg, #1a0a2e 0%, #2d1b4e 25%, #4a1c6b 50%, #2d1b4e 75%, #1a0a2e 100%)',
    hero: 'linear-gradient(135deg, #FF6B35 0%, #E91E63 25%, #9C27B0 50%, #1E88E5 75%, #00BCD4 100%)',
    header: 'linear-gradient(90deg, #FF6B35 0%, #E91E63 20%, #9C27B0 40%, #1E88E5 60%, #00BCD4 80%, #4CAF50 100%)',
    card: 'linear-gradient(145deg, rgba(156, 39, 176, 0.15) 0%, rgba(30, 136, 229, 0.15) 50%, rgba(0, 188, 212, 0.15) 100%)',
    cardBorder: 'linear-gradient(135deg, #FF6B35 0%, #E91E63 25%, #9C27B0 50%, #1E88E5 75%, #00BCD4 100%)',
    button: 'linear-gradient(135deg, #FF6B35 0%, #E91E63 50%, #9C27B0 100%)',
    categoryCard: 'linear-gradient(135deg, #9C27B0 0%, #1E88E5 50%, #00BCD4 100%)',
    gold: 'linear-gradient(135deg, #FFD700 0%, #FFA000 50%, #FF6B35 100%)',
    shimmer: 'linear-gradient(90deg, transparent 0%, rgba(255,215,0,0.3) 50%, transparent 100%)',
  }
};

export default function RestaurantLanding() {
  const { slug } = useParams<{ slug: string }>();
  const [, navigate] = useLocation();
  
  useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);

  const [playClick] = useSound('https://cdn.pixabay.com/audio/2022/03/10/audio_4a47cad5f1.mp3', { volume: 0.3 });
  const [playHover] = useSound('https://cdn.pixabay.com/audio/2022/03/24/audio_a8ccf96f5e.mp3', { volume: 0.15 });

  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Booking dialog state
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    customerName: "",
    email: "",
    phone: "",
    date: "",
    time: "",
    guests: 2,
  });
  const [bookingLoading, setBookingLoading] = useState(false);

  const { data: restaurant, isLoading: loadingRestaurant } = useQuery({
    queryKey: ["/api/restaurants", slug],
    queryFn: () => getRestaurantBySlug(slug || ""),
    enabled: !!slug,
  });

  useEffect(() => {
    if (restaurant?.themeKey) {
      const customThemeRedirects: Record<string, string> = {
        "shirin-mahal": `/${slug}/welcome`,
        "mujeeb-catering": `/${slug}/welcome`,
        "meat-wholesale": `/${slug}/welcome`,
        "kebabish": `/${slug}/welcome`,
        "hello-mumbai": `/${slug}/welcome`,
        "mujeeb-sweets": `/${slug}/welcome`,
      };
      const redirectPath = customThemeRedirects[restaurant.themeKey];
      if (redirectPath) {
        navigate(redirectPath);
      }
    }
  }, [slug, restaurant?.themeKey, navigate]);

  const { data: menuItems = [], isLoading: loadingMenu } = useQuery({
    queryKey: ["/api/menu", restaurant?.id],
    queryFn: () => getMenuItems(restaurant?.id),
    enabled: !!restaurant?.id,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const { data: galleryImages = [] } = useQuery({
    queryKey: ["/api/gallery", restaurant?.id],
    queryFn: () => getGalleryImages(restaurant?.id || ""),
    enabled: !!restaurant?.id,
  });

  const { data: heroImages = [] } = useQuery({
    queryKey: ["/api/hero-images", restaurant?.id],
    queryFn: () => getHeroImages(restaurant?.id || ""),
    enabled: !!restaurant?.id,
  });

  const { data: promotion } = useQuery({
    queryKey: ["/api/promotions", restaurant?.id],
    queryFn: () => getPromotion(restaurant?.id || ""),
    enabled: !!restaurant?.id,
  });

  // Fetch popular items (category GIFs/images) from database
  const { data: popularItems = [] } = useQuery({
    queryKey: ["/api/popular-items", restaurant?.id],
    queryFn: async () => {
      const res = await fetch(`/api/restaurants/${restaurant?.id}/popular-items`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!restaurant?.id,
  });

  const currencySymbol = getCurrencySymbol(restaurant?.currency || "GBP");

  const featuredCategories = ["main-meals", "family-bucket", "platters", "chicken-strips", "wraps", "bbq-ribs", "burgers", "biryani"];
  const featuredItems = menuItems
    .filter(item => featuredCategories.includes(item.category || ""))
    .slice(0, 20);
  
  const defaultFeaturedImages = [
    "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=400",
    "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400",
    "https://images.unsplash.com/photo-1562967914-608f82629710?w=400",
    "https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=400",
    "https://images.unsplash.com/photo-1569058242567-93de6f36f8e6?w=400",
    "https://images.unsplash.com/photo-1585325701165-351af916e581?w=400",
    "https://images.unsplash.com/photo-1614398751058-eb2e0bf63e53?w=400",
    "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=400",
  ];
  
  const defaultGalleryImages = [
    "https://flipdish-web.imgix.net/fd27836/28750669757da21d9f7363bfa821d93b.jpeg?w=300&h=200&fit=crop",
    "https://flipdish-web.imgix.net/fd27836/b6e23d996423bf6fc8b539898d5dbc80.jpeg?w=300&h=200&fit=crop",
    "https://flipdish-web.imgix.net/fd27836/02f9a6cc08bb1626bee0805f383c8fc8.jpeg?w=300&h=200&fit=crop",
    "https://flipdish-web.imgix.net/fd27836/d2518e103a5eef93991ee1d1c5f3e6bb.jpeg?w=300&h=200&fit=crop",
    "https://flipdish-web.imgix.net/fd27836/356fa0b3bdf4e78686ed1f796ee482a4.jpeg?w=300&h=200&fit=crop",
    "/uploads/gallery-6.jpg",
    "https://flipdish-web.imgix.net/fd27836/1cd57971f0f16070afbeadda803fc78d.jpeg?w=300&h=200&fit=crop",
    "https://flipdish-web.imgix.net/fd27836/0b3e7127c96f3fe533ff1daa8b5fcf85.jpeg?w=300&h=200&fit=crop",
  ];
  
  const displayGalleryImages = galleryImages.length > 0 
    ? galleryImages.map(img => img.imageUrl) 
    : defaultGalleryImages;

  // Handle booking submission
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant?.id) return;
    
    setBookingLoading(true);
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          customerName: bookingForm.customerName,
          email: bookingForm.email,
          phone: bookingForm.phone,
          date: bookingForm.date,
          time: bookingForm.time,
          guests: bookingForm.guests,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create booking");
      }
      
      toast({
        title: "Booking Confirmed!",
        description: `Your table for ${bookingForm.guests} guests on ${bookingForm.date} at ${bookingForm.time} has been booked.`,
      });
      
      setShowBookingDialog(false);
      setBookingForm({
        customerName: "",
        email: "",
        phone: "",
        date: "",
        time: "",
        guests: 2,
      });
    } catch (error: any) {
      toast({
        title: "Booking Failed",
        description: error.message || "Unable to complete your booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setBookingLoading(false);
    }
  };

  if (loadingRestaurant || loadingMenu) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-red-600" />
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2 text-white">Restaurant Not Found</h1>
          <p className="text-gray-400">The restaurant you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  // Use themeKey from database instead of hardcoded slugs
  const isRoyalTheme = restaurant?.themeKey === "royal";
  const isDixyTheme = restaurant?.themeKey === "dixy";
  const isTawaTheme = restaurant?.themeKey === "tawa";
  const isTawaWatfordTheme = restaurant?.themeKey === "tawa-watford";
  const isEmparoTheme = restaurant?.themeKey === "emparo";
  const isDhabaTheme = restaurant?.themeKey === "dhaba";
  // Production theme keys (support multiple formats: spaces, camelCase, kebab-case)
  const themeKey = restaurant?.themeKey?.toLowerCase().replace(/\s+/g, '');
  const isSpicyTheme = restaurant?.themeKey === "spicy";
  const isSpicyFlameTheme = themeKey === "spicyflame" || restaurant?.themeKey === "Spicy Flame";
  const isMidnightBlueTheme = themeKey === "midnightblue" || restaurant?.themeKey === "Midnight Blue";
  const isSunsetOrangeTheme = themeKey === "sunsetorange" || restaurant?.themeKey === "Sunset Orange";
  const isFreshGreenTheme = themeKey === "freshgreen" || restaurant?.themeKey === "Fresh Green";
  const isClassicRedTheme = themeKey === "classicred" || restaurant?.themeKey === "Classic Red";
  const isTawaCleanTheme = themeKey === "tawaclean" || restaurant?.themeKey === "Tawa Clean";
  const isAfghanRoyalTheme = themeKey === "afghanroyal" || restaurant?.themeKey === "Afghan Royal" || restaurant?.themeKey === "afghan-royal";
  const isMaharajTheme = themeKey === "maharaj" || restaurant?.themeKey === "Maharaj" || restaurant?.themeKey === "maharaj";
  const isMujeebSweetsTheme = themeKey === "mujeeb-sweets" || restaurant?.themeKey === "mujeeb-sweets";
  const isMeatWholesaleTheme = themeKey === "meat-wholesale" || restaurant?.themeKey === "meat-wholesale";
  
  // Get generic theme from themes object (for themes like classic, modern, rustic, etc.)
  const genericTheme = restaurant?.themeKey ? themes[restaurant.themeKey] : null;
  const hasGenericTheme = genericTheme && !isRoyalTheme && !isDixyTheme && !isTawaTheme && !isTawaWatfordTheme && !isEmparoTheme && !isDhabaTheme && !isSpicyTheme && !isSpicyFlameTheme && !isMidnightBlueTheme && !isSunsetOrangeTheme && !isFreshGreenTheme && !isClassicRedTheme && !isTawaCleanTheme && !isAfghanRoyalTheme && !isMaharajTheme && !isMujeebSweetsTheme && !isMeatWholesaleTheme;

  // Default category images (fallback if no popular items in database)
  const defaultCategories = [
    { name: "Burgers", image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop" },
    { name: "Chicken", image: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=400&h=300&fit=crop" },
    { name: "Peri-Peri", image: "https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=400&h=300&fit=crop" },
    { name: "Panini", image: "https://images.unsplash.com/photo-1619096252214-ef06c45683e3?w=400&h=300&fit=crop" },
    { name: "Pizza", image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop" },
    { name: "Wraps", image: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&h=300&fit=crop" },
  ];
  
  // Use popular items from database if available, otherwise use defaults
  const dixyCategories = popularItems.length > 0 
    ? popularItems.map((item: any) => ({ name: item.name, image: item.imageUrl, linkUrl: item.linkUrl }))
    : defaultCategories;

  // Mujeeb Sweets Theme - Redirect to unique welcome page
  if (isMujeebSweetsTheme) {
    navigate(`/${slug}/welcome`);
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 30%, #f093fb 60%, #f5576c 100%)' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  // Meat Wholesale Theme - Redirect to unique welcome page
  if (isMeatWholesaleTheme) {
    navigate(`/${slug}/welcome`);
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: MEAT_WHOLESALE_THEME.gradient.background }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  // Maharaj Theme - Premium Indian Sweet Shop with Vibrant Rainbow Colors
  if (isMaharajTheme) {
    return (
      <div 
        className="min-h-screen text-white relative overflow-hidden" 
        style={{ 
          fontFamily: "'Poppins', 'Arial', sans-serif",
          background: MAHARAJ_THEME.gradient.background,
        }}
      >
        {/* Maharaj Animated Background Pattern */}
        <style>{`
          @keyframes maharaj-shimmer {
            0% { background-position: 0% center; }
            100% { background-position: 200% center; }
          }
          @keyframes gradient-shift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          @keyframes float-slow {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-15px) rotate(5deg); }
          }
          @keyframes pulse-glow {
            0%, 100% { opacity: 0.2; transform: scale(1); }
            50% { opacity: 0.4; transform: scale(1.1); }
          }
          .rainbow-shimmer {
            background: ${MAHARAJ_THEME.gradient.header};
            background-size: 200% auto;
            animation: maharaj-shimmer 4s linear infinite;
          }
          .gold-text {
            background: ${MAHARAJ_THEME.gradient.gold};
            background-size: 200% auto;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            animation: maharaj-shimmer 4s linear infinite;
          }
          .floating-orb { animation: pulse-glow 4s ease-in-out infinite; }
          .floating-slow { animation: float-slow 6s ease-in-out infinite; }
        `}</style>

        {/* Floating Color Orbs Background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="floating-orb absolute top-20 left-10 w-48 h-48 rounded-full blur-3xl" style={{ background: MAHARAJ_THEME.primary, opacity: 0.15 }} />
          <div className="floating-orb absolute top-40 right-20 w-64 h-64 rounded-full blur-3xl" style={{ background: MAHARAJ_THEME.pink, opacity: 0.12, animationDelay: '1s' }} />
          <div className="floating-orb absolute bottom-40 left-1/4 w-56 h-56 rounded-full blur-3xl" style={{ background: MAHARAJ_THEME.secondary, opacity: 0.15, animationDelay: '2s' }} />
          <div className="floating-orb absolute bottom-20 right-1/3 w-40 h-40 rounded-full blur-3xl" style={{ background: MAHARAJ_THEME.teal, opacity: 0.18, animationDelay: '0.5s' }} />
          <div className="floating-orb absolute top-1/2 left-1/2 w-72 h-72 rounded-full blur-3xl" style={{ background: MAHARAJ_THEME.purple, opacity: 0.1, animationDelay: '1.5s' }} />
        </div>

        {/* Rainbow Top Bar */}
        <div className="h-2 rainbow-shimmer" />

        {/* Navigation */}
        <nav className="relative z-50 px-4 py-3" style={{ background: 'rgba(26,10,46,0.95)', backdropFilter: 'blur(10px)' }}>
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              {restaurant.logoUrl && (
                <div className="relative">
                  <div className="absolute inset-0 rounded-full blur-md rainbow-shimmer opacity-50" />
                  <img src={restaurant.logoUrl} alt={restaurant.name} className="relative h-14 w-14 rounded-full object-contain border-2 border-white/30" />
                </div>
              )}
              <h1 className="text-xl md:text-2xl font-bold gold-text">{restaurant.name}</h1>
            </div>
            <Button 
              onClick={() => navigate(`/${slug}/menu`)}
              className="px-6 py-2 rounded-full text-white font-bold transition-all hover:scale-105"
              style={{ background: MAHARAJ_THEME.gradient.button }}
              data-testid="button-view-menu-maharaj-landing"
            >
              View Full Menu
            </Button>
          </div>
        </nav>

        {/* Hero Section with Background Image */}
        <div className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
          {/* Animated Gradient Background */}
          <div 
            className="absolute inset-0"
            style={{ 
              background: 'linear-gradient(135deg, #1a0a2e 0%, #2d1b4e 25%, #4a1c6b 50%, #722F37 75%, #1a0a2e 100%)',
              backgroundSize: '400% 400%',
              animation: 'gradient-shift 15s ease infinite'
            }}
          />
          
          {/* Hero Background Image */}
          <div 
            className="absolute inset-0"
            style={{ 
              backgroundImage: 'url(https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=1920&q=80)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: 0.5
            }}
          />
          
          {/* Dark Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60" />

          {/* Hero Content */}
          <div className="relative z-10 text-center px-4 py-16">
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-6xl md:text-8xl lg:text-9xl font-bold mb-6 gold-text"
              style={{ textShadow: '0 4px 20px rgba(0,0,0,0.8)' }}
            >
              {restaurant.name}
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-white/80 text-xl md:text-2xl mb-10 max-w-2xl mx-auto"
            >
              {restaurant.tagline || restaurant.cuisineType || "Fine Dining Experience"}
            </motion.p>
            
            {/* Deliver / Collect Buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="flex items-center justify-center gap-4 mb-8"
            >
              <Button 
                onClick={() => navigate(`/${slug}/menu`)}
                className="flex items-center gap-2 px-10 py-5 rounded-full text-white font-bold text-lg transition-all hover:scale-105 shadow-2xl"
                style={{ background: MAHARAJ_THEME.gradient.button }}
                data-testid="button-deliver-maharaj-landing"
              >
                🚚 Deliver
              </Button>
              <Button 
                onClick={() => navigate(`/${slug}/menu`)}
                className="flex items-center gap-2 px-10 py-5 rounded-full bg-white/10 backdrop-blur-sm text-white font-bold text-lg border border-white/30 transition-all hover:bg-white/20 hover:scale-105"
                data-testid="button-collect-maharaj-landing"
              >
                🛍️ Collect
              </Button>
            </motion.div>
            
            {/* Order Now Link */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.8 }}
            >
              <Button
                variant="link"
                onClick={() => navigate(`/${slug}/menu`)}
                className="text-white/90 hover:text-white text-lg flex items-center gap-2 group mx-auto"
              >
                <span className="border-b border-white/50 group-hover:border-white">Order Now</span>
                <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </motion.div>
            
            {/* Address */}
            {restaurant.address && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9, duration: 0.8 }}
                className="flex items-center justify-center gap-2 mt-10 text-white/60 text-sm"
              >
                <MapPin className="h-4 w-4" />
                <span>{restaurant.address}</span>
              </motion.div>
            )}
          </div>
        </div>

        {/* Rainbow Divider */}
        <div className="h-1.5 rainbow-shimmer" />

        {/* Menu Highlights Section with Vibrant Animated Background */}
        <div 
          className="py-16 px-4 relative z-10 overflow-hidden"
          style={{ 
            background: 'linear-gradient(135deg, #FF6B35 0%, #E91E63 20%, #9C27B0 40%, #1E88E5 60%, #00BCD4 80%, #4CAF50 100%)',
            backgroundSize: '400% 400%',
            animation: 'gradient-shift 8s ease infinite'
          }}
        >
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-10">
              <div>
                <p className="text-sm font-medium mb-1 text-yellow-200">Menu highlights</p>
                <h2 className="text-4xl md:text-5xl font-bold text-white">Our menu</h2>
              </div>
              <Button 
                onClick={() => navigate(`/${slug}/menu`)}
                variant="outline"
                className="px-6 py-2.5 rounded-lg border-2 border-white text-white font-semibold transition-all hover:bg-white hover:text-pink-600"
                data-testid="button-view-full-menu-maharaj-landing"
              >
                View full menu
              </Button>
            </div>
            
            {/* Scrolling Menu Items */}
            <div className="overflow-hidden">
              <motion.div 
                className="flex gap-6"
                animate={{ x: [0, -1000] }}
                transition={{ 
                  x: { 
                    repeat: Infinity, 
                    repeatType: "loop", 
                    duration: 30, 
                    ease: "linear" 
                  }
                }}
                style={{ width: 'max-content' }}
              >
                {/* Show menu items with images (first 10), sorted by name for consistency */}
                {(() => {
                  const itemsWithImages = menuItems
                    .filter((item: any) => item.image && item.image.trim() !== '')
                    .sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''))
                    .slice(0, 20);
                  const displayItems = [...itemsWithImages, ...itemsWithImages];
                  return displayItems.map((item: any, idx: number) => (
                    <div
                      key={`highlight-${item.id}-${idx}`}
                      onClick={() => navigate(`/${slug}/menu`)}
                      className="flex-shrink-0 w-56 rounded-2xl shadow-xl overflow-hidden cursor-pointer hover:shadow-2xl transition-all hover:scale-105 bg-white/10"
                    >
                      <div className="aspect-square bg-black/10 relative overflow-hidden">
                        <img 
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold text-base text-white truncate">{item.name}</h3>
                      </div>
                    </div>
                  ));
                })()}
              </motion.div>
            </div>
          </div>
        </div>

        {/* Rainbow Bottom Bar */}
        <div className="h-2 rainbow-shimmer" />

        {/* Footer */}
        <footer className="py-12 px-4 text-center relative z-10" style={{ background: 'rgba(26,10,46,0.98)' }}>
          <h3 className="text-2xl font-bold gold-text mb-4">{restaurant.name}</h3>
          {restaurant.address && (
            <p className="text-white/60 text-sm flex items-center justify-center gap-2 mb-4">
              <MapPin className="h-4 w-4" />
              {restaurant.address}
            </p>
          )}
          <Button 
            onClick={() => navigate(`/${slug}/menu`)}
            className="px-8 py-3 rounded-full text-white font-bold transition-all hover:scale-105"
            style={{ background: MAHARAJ_THEME.gradient.button }}
          >
            Order Now
          </Button>
        </footer>
      </div>
    );
  }

  // Afghan Royal Theme - Stunning Premium Design for 400+ seating
  if (isAfghanRoyalTheme) {
    return (
      <div 
        className="min-h-screen text-white relative overflow-hidden" 
        style={{ 
          fontFamily: "'Playfair Display', 'Georgia', serif",
          background: AFGHAN_ROYAL_THEME.gradient.background,
        }}
      >
        {/* Royal Animated Background Pattern */}
        <style>{`
          @keyframes shimmer {
            0% { background-position: -200% center; }
            100% { background-position: 200% center; }
          }
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }
          @keyframes goldPulse {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 0.6; }
          }
          @keyframes slideInLeft {
            from { opacity: 0; transform: translateX(-50px); }
            to { opacity: 1; transform: translateX(0); }
          }
          @keyframes slideInRight {
            from { opacity: 0; transform: translateX(50px); }
            to { opacity: 1; transform: translateX(0); }
          }
          .gold-shimmer {
            background: linear-gradient(90deg, #c9a646 0%, #f6d365 25%, #ffeaa7 50%, #f6d365 75%, #c9a646 100%);
            background-size: 200% auto;
            animation: shimmer 3s linear infinite;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          .royal-glow {
            box-shadow: 0 0 30px rgba(201, 166, 70, 0.3), 0 0 60px rgba(201, 166, 70, 0.1);
          }
          .ornate-border {
            border: 2px solid transparent;
            background: linear-gradient(#1a1040, #1a1040) padding-box,
                        linear-gradient(135deg, #c9a646, #f6d365, #c9a646) border-box;
          }
          .floating { animation: float 3s ease-in-out infinite; }
        `}</style>

        {/* Decorative Gold Particles */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-yellow-400/20 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `goldPulse ${2 + Math.random() * 3}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 2}s`
              }}
            />
          ))}
        </div>

        {/* Premium Royal Header */}
        <header 
          className="py-4 px-4 sticky top-0 z-50 backdrop-blur-xl border-b border-yellow-600/30"
          style={{ background: 'linear-gradient(180deg, rgba(26, 16, 64, 0.98) 0%, rgba(45, 27, 105, 0.95) 100%)' }}
        >
          <div className="container mx-auto flex justify-between items-center">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              {restaurant.logoUrl ? (
                <img 
                  src={restaurant.logoUrl} 
                  alt={restaurant.name}
                  className="h-14 md:h-16 object-contain drop-shadow-lg"
                  data-testid="header-logo"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-full ornate-border flex items-center justify-center royal-glow">
                    <span className="text-2xl md:text-3xl">🏰</span>
                  </div>
                  <div className="hidden sm:block">
                    <h1 className="gold-shimmer text-xl md:text-2xl font-bold tracking-wide">{restaurant.name}</h1>
                    <p className="text-yellow-400/70 text-xs uppercase tracking-widest">Authentic Afghan Cuisine</p>
                  </div>
                </div>
              )}
            </motion.div>
            
            <nav className="hidden lg:flex items-center gap-2">
              {[
                { label: 'Home', action: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
                { label: 'Our Menu', action: () => navigate(`/menu/${slug}`) },
                { label: 'Reserve Table', action: () => setShowBookingDialog(true) },
                { label: 'About Us', action: () => document.getElementById('about-section')?.scrollIntoView({ behavior: 'smooth' }) },
              ].map((item, index) => (
                <motion.button 
                  key={item.label}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.1 }}
                  className="text-white/90 font-medium px-5 py-2.5 rounded-lg hover:text-yellow-300 hover:bg-white/10 cursor-pointer transition-all border border-transparent hover:border-yellow-500/30"
                  onClick={() => { playClick(); item.action?.(); }}
                  onMouseEnter={() => playHover()}
                  data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
                >
                  {item.label}
                </motion.button>
              ))}
            </nav>

            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-2">
              <Button 
                className="hidden md:flex bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-600 hover:from-yellow-500 hover:via-yellow-400 hover:to-yellow-500 text-purple-900 font-bold shadow-lg transition-all px-6 py-2"
                onClick={() => { playClick(); navigate(`/menu/${slug}`); }}
                data-testid="button-order-now"
              >
                <span className="mr-2">🍽️</span> Order Now
              </Button>
              <Button 
                className="md:hidden bg-gradient-to-r from-yellow-600 to-yellow-500 text-purple-900 font-bold px-4"
                onClick={() => { playClick(); navigate(`/menu/${slug}`); }}
                data-testid="button-order-mobile"
              >
                Order
              </Button>
            </motion.div>
          </div>
        </header>

        {/* Grand Hero Section with Sliding Banners */}
        <section className="relative h-[70vh] md:h-[85vh] overflow-hidden">
          <div className="absolute inset-0">
            {heroImages.length > 0 ? (
              <HeroCarousel
                images={heroImages}
                effect={(restaurant.heroAnimationStyle as any) || "fade"}
                interval={restaurant.heroSlideInterval || 6000}
                fallbackImage="https://images.unsplash.com/photo-1544025162-d76978ae2a6c?w=1600&h=900&fit=crop"
                gradientStart={AFGHAN_ROYAL_THEME.colors.primary}
                gradientMiddle={AFGHAN_ROYAL_THEME.colors.gold}
                gradientEnd={AFGHAN_ROYAL_THEME.colors.deepPurple}
              />
            ) : (
              <div 
                className="w-full h-full"
                style={{
                  background: 'linear-gradient(135deg, #2d1b69 0%, #1a1040 50%, #0c0a1d 100%)',
                }}
              />
            )}
            {/* Royal Gradient Overlay */}
            <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(12, 10, 29, 0.4) 0%, rgba(45, 27, 105, 0.6) 50%, rgba(12, 10, 29, 0.95) 100%)' }} />
          </div>

          {/* Hero Content */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center px-4 max-w-5xl">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                {/* Ornate Crown Icon */}
                <motion.div 
                  className="floating mb-6"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring" }}
                >
                  <span className="text-6xl md:text-8xl drop-shadow-lg">👑</span>
                </motion.div>

                <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold mb-4 tracking-tight">
                  <span className="gold-shimmer">{restaurant.name}</span>
                </h1>
                
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-xl md:text-2xl lg:text-3xl text-yellow-100/90 mb-2 font-light italic"
                >
                  "A Royal Feast for the Senses"
                </motion.p>
                
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="text-base md:text-lg text-yellow-200/70 mb-8 flex items-center justify-center gap-2"
                >
                  <MapPin className="h-4 w-4" /> {restaurant.address}
                </motion.p>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                  className="flex flex-col sm:flex-row items-center justify-center gap-4"
                >
                  <Button 
                    size="lg"
                    className="bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-600 hover:from-yellow-500 hover:via-yellow-400 hover:to-yellow-500 text-purple-900 font-bold text-lg px-10 py-6 rounded-full shadow-2xl transition-all transform hover:scale-105"
                    onClick={() => { playClick(); navigate(`/menu/${slug}`); }}
                    data-testid="hero-order-button"
                  >
                    <span className="mr-2 text-xl">🍽️</span> Explore Our Menu
                  </Button>
                  <Button 
                    size="lg"
                    variant="outline"
                    className="border-2 border-yellow-500/50 text-yellow-100 hover:bg-yellow-500/20 font-semibold text-lg px-8 py-6 rounded-full backdrop-blur-sm"
                    onClick={() => { playClick(); setShowBookingDialog(true); }}
                    data-testid="hero-booking-button"
                  >
                    <Calendar className="mr-2 h-5 w-5" /> Reserve Your Table
                  </Button>
                </motion.div>

                {/* Seating Capacity Badge */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2 }}
                  className="mt-8 inline-flex items-center gap-2 bg-purple-900/50 border border-yellow-500/30 rounded-full px-6 py-2 backdrop-blur-sm"
                >
                  <Users className="h-5 w-5 text-yellow-400" />
                  <span className="text-yellow-100/90">400+ Seating Capacity</span>
                  <span className="text-yellow-400">|</span>
                  <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                  <span className="text-yellow-100/90">5.0 Rating</span>
                </motion.div>
              </motion.div>
            </div>
          </div>

          {/* Scroll Indicator */}
          <motion.div 
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <ChevronRight className="h-8 w-8 text-yellow-400/70 rotate-90" />
          </motion.div>
        </section>

        {/* Royal Features Section */}
        <section className="py-16 md:py-24 relative" style={{ background: 'linear-gradient(180deg, rgba(12, 10, 29, 1) 0%, rgba(26, 16, 64, 1) 50%, rgba(12, 10, 29, 1) 100%)' }}>
          <div className="container mx-auto px-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                <span className="gold-shimmer">Experience Afghan Royalty</span>
              </h2>
              <p className="text-yellow-100/70 text-lg max-w-2xl mx-auto">
                Discover the rich flavors of authentic Afghan cuisine in a majestic setting
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {[
                { icon: "🍖", title: "Authentic Flavors", desc: "Traditional recipes passed down through generations" },
                { icon: "🏰", title: "Royal Ambiance", desc: "Elegant dining space for 400+ guests" },
                { icon: "⭐", title: "Premium Quality", desc: "Only the finest ingredients, perfectly prepared" },
              ].map((feature, i) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.2 }}
                  className="ornate-border rounded-2xl p-8 text-center hover:scale-105 transition-all duration-300 royal-glow"
                  style={{ background: 'linear-gradient(145deg, rgba(45, 27, 105, 0.5) 0%, rgba(26, 16, 64, 0.8) 100%)' }}
                >
                  <span className="text-5xl mb-4 block">{feature.icon}</span>
                  <h3 className="text-xl md:text-2xl font-bold text-yellow-300 mb-2">{feature.title}</h3>
                  <p className="text-white/70">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Menu Categories Preview */}
        <section className="py-16 md:py-24" style={{ background: 'linear-gradient(180deg, rgba(12, 10, 29, 1) 0%, rgba(45, 27, 105, 0.8) 50%, rgba(12, 10, 29, 1) 100%)' }}>
          <div className="container mx-auto px-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                <span className="gold-shimmer">Our Royal Menu</span>
              </h2>
              <p className="text-yellow-100/70 text-lg">Taste the heritage of Afghanistan</p>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-12">
              {(popularItems.length > 0 ? popularItems.slice(0, 8) : [
                { name: "Shiraz Special Kebabs", image: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=400&h=400&fit=crop" },
                { name: "Afghan Biryani", image: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=400&h=400&fit=crop" },
                { name: "Grilled Kebabs", image: "https://images.unsplash.com/photo-1558030006-450675393462?w=400&h=400&fit=crop" },
                { name: "Mix Grills", image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=400&fit=crop" },
              ]).map((item: any, i: number) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="group relative overflow-hidden rounded-2xl cursor-pointer"
                  onClick={() => { playClick(); navigate(`/menu/${slug}`); }}
                >
                  <img 
                    src={item.image || item.imageUrl} 
                    alt={item.name}
                    className="w-full aspect-square object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-purple-900/90 via-purple-900/30 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-white font-bold text-sm md:text-lg">{item.name}</h3>
                  </div>
                  <div className="absolute inset-0 border-2 border-yellow-500/0 group-hover:border-yellow-500/50 rounded-2xl transition-all" />
                </motion.div>
              ))}
            </div>

            <div className="text-center">
              <Button 
                size="lg"
                className="bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-600 hover:from-yellow-500 hover:via-yellow-400 hover:to-yellow-500 text-purple-900 font-bold text-lg px-12 py-6 rounded-full shadow-2xl transition-all"
                onClick={() => { playClick(); navigate(`/menu/${slug}`); }}
                data-testid="view-full-menu-button"
              >
                View Full Menu <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </section>

        {/* Contact & Hours Section */}
        <section id="about-section" className="py-16 md:py-24 relative" style={{ background: 'linear-gradient(180deg, rgba(12, 10, 29, 1) 0%, rgba(26, 16, 64, 0.9) 100%)' }}>
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-8 md:gap-12">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="ornate-border rounded-2xl p-8 royal-glow"
                style={{ background: 'linear-gradient(145deg, rgba(45, 27, 105, 0.5) 0%, rgba(26, 16, 64, 0.8) 100%)' }}
              >
                <h3 className="text-2xl md:text-3xl font-bold gold-shimmer mb-6">Visit Us</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <MapPin className="h-6 w-6 text-yellow-400 flex-shrink-0 mt-1" />
                    <div>
                      <p className="text-white font-medium">Address</p>
                      <p className="text-yellow-100/70">{restaurant.address}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <Phone className="h-6 w-6 text-yellow-400 flex-shrink-0 mt-1" />
                    <div>
                      <p className="text-white font-medium">Phone</p>
                      <p className="text-yellow-100/70">{restaurant.phone || "Contact us for reservations"}</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="ornate-border rounded-2xl p-8 royal-glow"
                style={{ background: 'linear-gradient(145deg, rgba(45, 27, 105, 0.5) 0%, rgba(26, 16, 64, 0.8) 100%)' }}
              >
                <h3 className="text-2xl md:text-3xl font-bold gold-shimmer mb-6">Opening Hours</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-white">Mon - Thu</span>
                    <span className="text-yellow-300">{restaurant.deliveryHoursMonThu || "12PM - 11PM"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white">Fri - Sat</span>
                    <span className="text-yellow-300">{restaurant.deliveryHoursFriSat || "12PM - 12AM"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white">Sunday</span>
                    <span className="text-yellow-300">{restaurant.deliveryHoursSun || "12PM - 11PM"}</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 border-t border-yellow-600/20" style={{ background: 'rgba(12, 10, 29, 0.98)' }}>
          <div className="container mx-auto px-4 text-center">
            <p className="gold-shimmer text-xl font-bold mb-2">{restaurant.name}</p>
            <p className="text-yellow-100/50 text-sm">© {new Date().getFullYear()} All Rights Reserved</p>
          </div>
        </footer>

        {/* Booking Dialog */}
        <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
          <DialogContent className="bg-purple-900 border-yellow-500/30 text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="gold-shimmer text-2xl">Reserve Your Table</DialogTitle>
              <DialogDescription className="text-yellow-100/70">
                Book your royal dining experience at {restaurant.name}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleBookingSubmit} className="space-y-4 mt-4">
              <div>
                <Label className="text-yellow-100">Your Name</Label>
                <Input
                  value={bookingForm.customerName}
                  onChange={e => setBookingForm(prev => ({ ...prev, customerName: e.target.value }))}
                  className="bg-purple-800/50 border-yellow-500/30 text-white"
                  required
                  data-testid="input-booking-name"
                />
              </div>
              <div>
                <Label className="text-yellow-100">Phone</Label>
                <Input
                  type="tel"
                  value={bookingForm.phone}
                  onChange={e => setBookingForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="bg-purple-800/50 border-yellow-500/30 text-white"
                  required
                  data-testid="input-booking-phone"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-yellow-100">Date</Label>
                  <Input
                    type="date"
                    value={bookingForm.date}
                    onChange={e => setBookingForm(prev => ({ ...prev, date: e.target.value }))}
                    className="bg-purple-800/50 border-yellow-500/30 text-white"
                    required
                    data-testid="input-booking-date"
                  />
                </div>
                <div>
                  <Label className="text-yellow-100">Time</Label>
                  <Input
                    type="time"
                    value={bookingForm.time}
                    onChange={e => setBookingForm(prev => ({ ...prev, time: e.target.value }))}
                    className="bg-purple-800/50 border-yellow-500/30 text-white"
                    required
                    data-testid="input-booking-time"
                  />
                </div>
              </div>
              <div>
                <Label className="text-yellow-100">Number of Guests</Label>
                <Input
                  type="number"
                  min={1}
                  max={50}
                  value={bookingForm.guests}
                  onChange={e => setBookingForm(prev => ({ ...prev, guests: parseInt(e.target.value) || 2 }))}
                  className="bg-purple-800/50 border-yellow-500/30 text-white"
                  required
                  data-testid="input-booking-guests"
                />
              </div>
              <Button 
                type="submit" 
                disabled={bookingLoading}
                className="w-full bg-gradient-to-r from-yellow-600 to-yellow-500 text-purple-900 font-bold hover:from-yellow-500 hover:to-yellow-400"
                data-testid="button-submit-booking"
              >
                {bookingLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Reservation"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Dixy Theme - Premium Luxury Redesign
  if (isDixyTheme) {
    return (
      <div 
        className="min-h-screen text-white relative overflow-hidden" 
        style={{ 
          fontFamily: "'Poppins', 'Arial', sans-serif",
          background: DIXY_PREMIUM_THEME.gradient.background,
          backgroundSize: '400% 400%',
          animation: 'gradient-shift 15s ease infinite'
        }}
      >
        {/* Animated Gradient Mesh Background */}
        <div className="gradient-mesh" />
        
        {/* Premium Gradient Header Bar */}
        <header 
          className="py-3 px-4 sticky top-0 z-50 border-b border-white/10 backdrop-blur-md nav-premium"
          style={{ background: DIXY_PREMIUM_THEME.gradient.header }}
        >
          <div className="container mx-auto flex justify-between items-center">
            <motion.img 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              src={restaurant.logoUrl || "https://dixywalsall.co.uk/site-assets/img/logo/logo.png"} 
              alt={restaurant.name}
              className="h-12 object-contain drop-shadow-lg"
              data-testid="header-logo"
            />
            <nav className="hidden md:flex items-center gap-1">
              {[
                { label: 'Home', testId: 'nav-home', action: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
                { label: 'About Us', testId: 'nav-about', action: () => document.getElementById('footer-section')?.scrollIntoView({ behavior: 'smooth' }) },
                { label: 'Menu', testId: 'nav-menu', action: () => navigate(`/menu/${slug}`) },
                { label: 'Online Order', testId: 'nav-online-order', action: () => navigate(`/menu/${slug}`) },
                { label: 'Book a Table', testId: 'nav-booking', action: () => setShowBookingDialog(true) },
              ].map((item, index) => (
                <motion.button 
                  key={item.label}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  className="text-white/90 font-medium px-4 py-2 rounded-lg hover:text-yellow-300 hover:bg-white/10 cursor-pointer transition-all hover:-translate-y-0.5"
                  onClick={() => { playClick(); item.action?.(); }}
                  onMouseEnter={() => playHover()}
                  data-testid={item.testId}
                >
                  {item.label}
                </motion.button>
              ))}
            </nav>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Button 
                className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-400 hover:to-orange-400 text-white font-bold shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 md:hidden"
                onClick={() => { playClick(); navigate(`/menu/${slug}`); }}
                onMouseEnter={() => playHover()}
                data-testid="button-order-mobile"
              >
                Order
              </Button>
            </motion.div>
          </div>
        </header>

        {/* Hero Section - Full Width with Premium Overlay */}
        <section className="relative h-[500px] md:h-[650px] overflow-hidden">
          <div className="absolute inset-0">
            {heroImages.length > 0 ? (
              <HeroCarousel
                images={heroImages}
                effect={(restaurant.heroAnimationStyle as any) || "slide"}
                interval={restaurant.heroSlideInterval || 5000}
                fallbackImage="https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=1400&h=600&fit=crop"
                gradientStart="#4c1d95"
                gradientMiddle="#7c3aed"
                gradientEnd="#a855f7"
              />
            ) : (
              <img 
                src={restaurant.welcomeImageUrl || "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=1400&h=600&fit=crop"}
                alt={restaurant.name}
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/60 via-purple-900/50 to-indigo-950/80"></div>
            {/* Decorative light rays */}
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 50% 0%, #fbbf24 0%, transparent 40%)' }}></div>
          </div>
          
          {/* Centered Premium Content */}
          <div className="relative z-10 h-full flex flex-col items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center"
            >
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                <span className="text-sm font-medium text-white/90">Premium Fast Food Experience</span>
                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
              </div>
              <h1 className="text-5xl md:text-7xl font-bold mb-4">
                <span className="bg-gradient-to-r from-red-400 via-yellow-300 to-red-400 bg-clip-text text-transparent drop-shadow-2xl">
                  Welcome to
                </span>
              </h1>
              <h2 className="text-4xl md:text-6xl font-bold mb-8 bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">
                {restaurant.name}
              </h2>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
              >
                <Button 
                  size="lg"
                  className="btn-3d-premium bg-gradient-to-r from-red-500 via-orange-500 to-red-500 hover:from-red-400 hover:via-orange-400 hover:to-red-400 text-white font-bold text-xl px-14 py-7 rounded-2xl shadow-2xl hover:shadow-black/40 transition-all hover:-translate-y-1"
                  onClick={() => { playClick(); navigate(`/menu/${slug}`); }}
                  onMouseEnter={() => playHover()}
                  data-testid="button-order-now"
                >
                  Order Now
                </Button>
              </motion.div>
            </motion.div>
          </div>

          {/* Bottom Right Floating Logo */}
          <motion.div 
            className="absolute bottom-6 right-6 z-10"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/80 backdrop-blur-sm border border-gray-700/50 p-3 rounded-2xl">
              <img 
                src={restaurant.logoUrl || "https://dixywalsall.co.uk/site-assets/img/logo/logo.png"} 
                alt={restaurant.name}
                className="h-16 md:h-20 object-contain"
              />
            </div>
          </motion.div>
        </section>

        {/* About Us Section - Premium Glass Cards */}
        <section className="py-20 relative">
          <div className="container mx-auto px-4 relative z-10">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-red-400 via-yellow-300 to-red-400 bg-clip-text text-transparent mb-4">
                About Us
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-red-500 to-orange-500 mx-auto rounded-full"></div>
            </motion.div>
            
            <div className="grid md:grid-cols-2 gap-12 items-start">
              {/* Left Column - Text */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="space-y-6"
              >
                <div className="card-3d-luxury p-6 rounded-2xl">
                  <p className="text-white/90 leading-relaxed">
                    Welcome to {restaurant.name}, where we redefine fast food with a delightful twist of flavour and convenience. We are serving the community with passion, dedication, and a commitment to bringing joy to every mealtime.
                  </p>
                </div>

                <div className="card-3d-luxury p-6 rounded-2xl">
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent mb-3">
                    Our Mission
                  </h3>
                  <p className="text-white/80 leading-relaxed">
                    At {restaurant.name}, we believe that fast food doesn't have to mean compromising on quality. Our mission is to provide mouthwatering, freshly prepared meals that tantalize the taste buds.
                  </p>
                </div>

                <div className="card-3d-luxury p-6 rounded-2xl">
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent mb-3">
                    Quality You Can Taste
                  </h3>
                  <p className="text-white/80 leading-relaxed">
                    We take pride in using only the freshest, locally sourced ingredients. Our chefs work tirelessly to create meals that satisfy your cravings and meet the highest standards.
                  </p>
                </div>

                <Button 
                  size="lg"
                  className="btn-3d-premium bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-400 hover:to-orange-400 text-white font-bold px-10 py-5 rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
                  onClick={() => { playClick(); navigate(`/menu/${slug}`); }}
                  onMouseEnter={() => playHover()}
                  data-testid="button-order-about"
                >
                  Order Now
                </Button>
              </motion.div>

              {/* Right Column - Food Images Collage */}
              <motion.div 
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="hidden md:grid grid-cols-2 gap-4"
              >
                {[
                  { src: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=300&h=200&fit=crop", alt: "Chicken Wings", mt: false },
                  { src: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&h=200&fit=crop", alt: "Burger", mt: true },
                  { src: "https://images.unsplash.com/photo-1598679253544-2c97992403ea?w=300&h=200&fit=crop", alt: "Fries", mt: false },
                  { src: "https://images.unsplash.com/photo-1562967914-608f82629710?w=300&h=200&fit=crop", alt: "Chicken Pieces", mt: true },
                ].map((img, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className={`card-3d-luxury overflow-hidden rounded-2xl ${img.mt ? 'mt-8' : ''}`}
                  >
                    <img 
                      src={img.src}
                      alt={img.alt}
                      className="w-full h-40 object-cover hover:scale-110 transition-transform duration-500"
                    />
                  </motion.div>
                ))}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 }}
                  className="col-span-2 card-3d-luxury overflow-hidden rounded-2xl"
                >
                  <img 
                    src="https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=600&h=200&fit=crop"
                    alt="Onion Rings"
                    className="w-full h-40 object-cover hover:scale-105 transition-transform duration-500"
                  />
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Popular Items Section - Premium Gradient */}
        <section className="py-20 relative">
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.3) 0%, rgba(234, 88, 12, 0.2) 50%, rgba(220, 38, 38, 0.3) 100%)' }}></div>
          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-yellow-300 via-orange-300 to-yellow-300 bg-clip-text text-transparent mb-4">
                Popular Items
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-yellow-400 to-orange-400 mx-auto rounded-full"></div>
            </motion.div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {dixyCategories.map((category: { name: string; image: string; linkUrl?: string }, index: number) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="card-3d-luxury rounded-2xl overflow-hidden cursor-pointer group"
                  onClick={() => { playClick(); navigate(`/menu/${slug}`); }}
                  onMouseEnter={() => playHover()}
                  data-testid={`card-category-${category.name.toLowerCase()}`}
                >
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={category.image}
                      alt={category.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                    {/* Order Now button with logo overlay */}
                    <div className="absolute bottom-4 left-4 flex items-center gap-2">
                      <Button 
                        size="sm"
                        className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-400 hover:to-orange-400 text-white font-bold text-xs px-4 shadow-lg"
                      >
                        Order Now
                      </Button>
                      <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/70 p-1 rounded-lg">
                        <img 
                          src={restaurant.logoUrl || "https://dixywalsall.co.uk/site-assets/img/logo/logo.png"}
                          alt="Dixy"
                          className="h-6 object-contain"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="p-4 text-center bg-white/5">
                    <h3 className="text-xl font-bold text-white">{category.name}</h3>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer - Premium Glass Morphism */}
        <footer id="footer-section" className="py-12 relative border-t border-white/10">
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(30, 27, 75, 0.95) 0%, rgba(15, 10, 40, 0.98) 100%)' }}></div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="grid md:grid-cols-4 gap-8">
              {/* Logo & Description */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/80 inline-block p-3 rounded-xl mb-4 border border-gray-700/50">
                  <img 
                    src={restaurant.logoUrl || "https://dixywalsall.co.uk/site-assets/img/logo/logo.png"} 
                    alt={restaurant.name}
                    className="h-14"
                  />
                </div>
                <p className="text-white/70 text-sm leading-relaxed">
                  {restaurant.name}. Satisfy your cravings with a mouthwatering array of fast-food delights. From juicy burgers to succulent chicken, zesty peri-peri, and cheesy pizzas.
                </p>
              </motion.div>

              {/* Contact Us */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
              >
                <h4 className="text-white font-bold text-lg mb-4 bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">Contact Us</h4>
                <div className="space-y-2 text-white/70 text-sm">
                  <p>{restaurant.name}</p>
                  <p>{restaurant.address || "Address not set"}</p>
                  <p className="flex items-center gap-2 mt-3 text-white/80">
                    <Phone className="h-4 w-4 text-red-400" />
                    {restaurant.phone || "Phone not set"}
                  </p>
                  {restaurant.email && (
                    <p className="text-purple-300">{restaurant.email}</p>
                  )}
                </div>
              </motion.div>

              {/* Opening Hours */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                <h4 className="text-white font-bold text-lg mb-4 bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">Opening Hours</h4>
                <div className="space-y-2 text-white/70 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-yellow-400" />
                    <span>Mon - Thu: {restaurant.deliveryHoursMonThu || "12:00 - 22:00"}</span>
                  </div>
                  <p className="pl-6">Fri - Sat: {restaurant.deliveryHoursFriSat || "12:00 - 23:00"}</p>
                  <p className="pl-6">Sunday: {restaurant.deliveryHoursSun || "12:00 - 21:00"}</p>
                </div>
              </motion.div>

              {/* Add to Home Screen */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
              >
                <h4 className="text-white font-bold text-lg mb-4 bg-gradient-to-r from-green-300 to-teal-300 bg-clip-text text-transparent">Add to Home Screen</h4>
                <div className="card-3d-luxury rounded-xl px-4 py-4">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">📱</span>
                    <p className="text-sm text-white/80 leading-relaxed">
                      Add this website to your mobile Home Screen for fast access — just like an app.
                    </p>
                  </div>
                  <p className="text-xs text-purple-300 text-center mt-2">
                    Works on iPhone & Android
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Copyright */}
            <div className="mt-8 pt-6 border-t border-white/20 text-center">
              <p className="text-white/60 text-sm">
                © {new Date().getFullYear()} {restaurant.name}. All rights reserved.
              </p>
            </div>
          </div>
        </footer>

        {/* Booking Dialog */}
        <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
          <DialogContent className="sm:max-w-[425px] bg-gradient-to-br from-slate-900 to-slate-800 border-purple-500/30 text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent flex items-center gap-2">
                <Calendar className="h-6 w-6 text-yellow-400" />
                Book a Table
              </DialogTitle>
              <DialogDescription className="text-gray-300">
                Reserve your table at {restaurant.name}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleBookingSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="customerName" className="text-gray-200">Your Name</Label>
                <Input
                  id="customerName"
                  placeholder="Enter your name"
                  value={bookingForm.customerName}
                  onChange={(e) => setBookingForm({ ...bookingForm, customerName: e.target.value })}
                  required
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-gray-400"
                  data-testid="input-booking-name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-200">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={bookingForm.email}
                    onChange={(e) => setBookingForm({ ...bookingForm, email: e.target.value })}
                    required
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-gray-400"
                    data-testid="input-booking-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-gray-200">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="07xxx xxx xxx"
                    value={bookingForm.phone}
                    onChange={(e) => setBookingForm({ ...bookingForm, phone: e.target.value })}
                    required
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-gray-400"
                    data-testid="input-booking-phone"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date" className="text-gray-200">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={bookingForm.date}
                    onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                    required
                    min={new Date().toISOString().split('T')[0]}
                    className="bg-slate-700/50 border-slate-600 text-white"
                    data-testid="input-booking-date"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time" className="text-gray-200">Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={bookingForm.time}
                    onChange={(e) => setBookingForm({ ...bookingForm, time: e.target.value })}
                    required
                    className="bg-slate-700/50 border-slate-600 text-white"
                    data-testid="input-booking-time"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="guests" className="text-gray-200 flex items-center gap-2">
                  <Users className="h-4 w-4" /> Number of Guests
                </Label>
                <Input
                  id="guests"
                  type="number"
                  min="1"
                  max="20"
                  value={bookingForm.guests}
                  onChange={(e) => setBookingForm({ ...bookingForm, guests: parseInt(e.target.value) || 1 })}
                  required
                  className="bg-slate-700/50 border-slate-600 text-white"
                  data-testid="input-booking-guests"
                />
              </div>
              <Button 
                type="submit" 
                disabled={bookingLoading}
                className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-400 hover:to-orange-400 text-white font-bold py-3"
                data-testid="button-submit-booking"
              >
                {bookingLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Booking...
                  </>
                ) : (
                  "Confirm Booking"
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Spicy Theme - Red, Navy, Green, Dark Gradient Theme (Peri Peri Watford)
  if (isSpicyTheme) {
    return (
      <div 
        className="min-h-screen text-white relative overflow-y-auto" 
        style={{ 
          fontFamily: "'Poppins', 'Arial', sans-serif",
          background: SPICY_THEME.gradient.hero,
        }}
      >
        <header 
          className="py-4 px-4 sticky top-0 z-50 border-b border-white/10 backdrop-blur-md nav-premium"
          style={{ background: SPICY_THEME.gradient.header }}
        >
          <div className="container mx-auto flex justify-between items-center">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <img 
                src={restaurant.logoUrl || "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=60&h=60&fit=crop"} 
                alt={restaurant.name}
                className="h-12 w-12 rounded-full object-cover ring-2 ring-green-400/50"
                data-testid="header-logo"
              />
              <span className="text-xl font-bold text-white">{restaurant.name}</span>
            </motion.div>
            <nav className="hidden md:flex items-center gap-1">
              {[
                { label: 'Home', testId: 'nav-home', action: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
                { label: 'About Us', testId: 'nav-about', action: () => document.getElementById('footer-section')?.scrollIntoView({ behavior: 'smooth' }) },
                { label: 'Menu', testId: 'nav-menu', action: () => navigate(`/menu/${slug}`) },
                { label: 'Order Online', testId: 'nav-online-order', action: () => navigate(`/menu/${slug}`) },
                { label: 'Book a Table', testId: 'nav-booking', action: () => setShowBookingDialog(true) },
              ].map((item, index) => (
                <motion.button 
                  key={item.label}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  className="text-white/90 font-medium px-4 py-2 rounded-lg hover:text-green-300 hover:bg-white/10 cursor-pointer transition-all hover:-translate-y-0.5"
                  onClick={() => { playClick(); item.action?.(); }}
                  onMouseEnter={() => playHover()}
                  data-testid={item.testId}
                >
                  {item.label}
                </motion.button>
              ))}
            </nav>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Button 
                className="text-white font-bold shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 md:hidden"
                style={{ background: SPICY_THEME.gradient.button }}
                onClick={() => { playClick(); navigate(`/menu/${slug}`); }}
                onMouseEnter={() => playHover()}
                data-testid="button-order-mobile"
              >
                Order
              </Button>
            </motion.div>
          </div>
        </header>

        <section className="relative h-[500px] md:h-[650px] overflow-hidden">
          <div className="absolute inset-0">
            {heroImages.length > 0 ? (
              <HeroCarousel
                images={heroImages}
                effect={(restaurant.heroAnimationStyle as any) || "slide"}
                interval={restaurant.heroSlideInterval || 5000}
                fallbackImage="https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=1400&h=600&fit=crop"
                gradientStart="#dc2626"
                gradientMiddle="#1e3a5f"
                gradientEnd="#22c55e"
              />
            ) : (
              <img 
                src={restaurant.welcomeImageUrl || "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=1400&h=600&fit=crop"}
                alt={restaurant.name}
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(220, 38, 38, 0.6) 0%, rgba(30, 58, 95, 0.5) 50%, rgba(15, 23, 42, 0.8) 100%)' }}></div>
          </div>
          
          <div className="relative z-10 h-full flex flex-col items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center"
            >
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
                <Star className="h-4 w-4 text-green-400 fill-green-400" />
                <span className="text-sm font-medium text-white/90">Authentic Peri Peri Experience</span>
                <Star className="h-4 w-4 text-green-400 fill-green-400" />
              </div>
              <h1 className="text-5xl md:text-7xl font-bold mb-4">
                <span className="bg-gradient-to-r from-red-400 via-green-300 to-white bg-clip-text text-transparent drop-shadow-2xl">
                  Welcome to
                </span>
              </h1>
              <h2 className="text-4xl md:text-6xl font-bold mb-8 bg-gradient-to-r from-white via-green-200 to-white bg-clip-text text-transparent">
                {restaurant.name}
              </h2>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
              >
                <Button 
                  size="lg"
                  className="text-white font-bold text-xl px-14 py-7 rounded-2xl shadow-2xl transition-all hover:-translate-y-1"
                  style={{ background: SPICY_THEME.gradient.button }}
                  onClick={() => { playClick(); navigate(`/menu/${slug}`); }}
                  onMouseEnter={() => playHover()}
                  data-testid="button-order-now"
                >
                  Order Now
                </Button>
              </motion.div>
            </motion.div>
          </div>

          <motion.div 
            className="absolute bottom-6 right-6 z-10"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="p-3 rounded-2xl backdrop-blur-md border border-white/20" style={{ background: 'rgba(30, 58, 95, 0.8)' }}>
              <img 
                src={restaurant.logoUrl || "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=80&h=80&fit=crop"} 
                alt={restaurant.name}
                className="h-16 md:h-20 object-contain"
              />
            </div>
          </motion.div>
        </section>

        <section className="py-20 relative" style={{ background: SPICY_THEME.gradient.section2 }}>
          <div className="container mx-auto px-4 relative z-10">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-red-400 via-green-300 to-red-400 bg-clip-text text-transparent mb-4">
                About Us
              </h2>
              <div className="w-24 h-1 mx-auto rounded-full" style={{ background: SPICY_THEME.gradient.categoryBanner }}></div>
            </motion.div>
            
            <div className="grid md:grid-cols-2 gap-12 items-start">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="space-y-6"
              >
                <div className="p-6 rounded-2xl backdrop-blur-md border border-white/20" style={{ background: 'rgba(220, 38, 38, 0.2)' }}>
                  <p className="text-white/90 leading-relaxed">
                    Welcome to {restaurant.name}, where we serve the most authentic Peri Peri chicken in town. Our secret recipes and premium ingredients create flavours that will keep you coming back for more.
                  </p>
                </div>

                <div className="p-6 rounded-2xl backdrop-blur-md border border-white/20" style={{ background: 'rgba(34, 197, 94, 0.2)' }}>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-green-300 to-white bg-clip-text text-transparent mb-3">
                    Our Mission
                  </h3>
                  <p className="text-white/80 leading-relaxed">
                    At {restaurant.name}, we believe in bringing the bold, fiery flavours of Peri Peri to our community. Every dish is prepared fresh with love and care.
                  </p>
                </div>

                <div className="p-6 rounded-2xl backdrop-blur-md border border-white/20" style={{ background: 'rgba(30, 58, 95, 0.3)' }}>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-red-300 to-green-300 bg-clip-text text-transparent mb-3">
                    Quality You Can Taste
                  </h3>
                  <p className="text-white/80 leading-relaxed">
                    We source only the finest ingredients and prepare every meal to order. From our signature Peri Peri marinades to our crispy chicken, quality is our promise.
                  </p>
                </div>

                <Button 
                  size="lg"
                  className="w-full text-white font-bold text-lg py-6 rounded-xl shadow-xl"
                  style={{ background: SPICY_THEME.gradient.button }}
                  onClick={() => navigate(`/menu/${slug}`)}
                  data-testid="button-view-menu"
                >
                  View Our Menu
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="space-y-6"
              >
                <div className="rounded-2xl overflow-hidden shadow-2xl">
                  <img 
                    src={galleryImages[0]?.imageUrl || "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=600&h=400&fit=crop"}
                    alt="Delicious food"
                    className="w-full h-64 object-cover"
                  />
                </div>

                <div className="p-6 rounded-2xl backdrop-blur-md border border-white/20" style={{ background: 'rgba(220, 38, 38, 0.3)' }}>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 rounded-xl" style={{ background: SPICY_THEME.gradient.categoryBanner }}>
                      <MapPin className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-green-300">Find Us</p>
                      <p className="font-semibold text-white">{restaurant.address || "Visit us today!"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 rounded-xl" style={{ background: SPICY_THEME.gradient.categoryBanner }}>
                      <Clock className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-green-300">Opening Hours</p>
                      <p className="font-semibold text-white">{restaurant.collectionHoursMonThu || "12PM - 10:30PM"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl" style={{ background: SPICY_THEME.gradient.categoryBanner }}>
                      <Phone className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-green-300">Call Us</p>
                      <p className="font-semibold text-white">{restaurant.phone || "Contact us today!"}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="py-16 px-4" style={{ background: SPICY_THEME.gradient.section3 }}>
          <div className="container mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-4xl font-bold text-white mb-4">Popular Categories</h2>
              <p className="text-white/80">Explore our delicious menu categories</p>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {dixyCategories.slice(0, 6).map((category: any, index: number) => (
                <motion.div
                  key={category.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="group cursor-pointer"
                  onClick={() => navigate(`/menu/${slug}`)}
                >
                  <div className="rounded-2xl overflow-hidden shadow-xl border-2 border-white/20 hover:border-white/50 transition-all hover:scale-105">
                    <img 
                      src={category.image}
                      alt={category.name}
                      className="w-full h-32 object-cover"
                    />
                    <div className="p-3 text-center" style={{ background: SPICY_THEME.gradient.section2 }}>
                      <p className="font-bold text-white text-sm">{category.name}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section id="footer-section" className="py-16 px-4" style={{ background: SPICY_THEME.dark }}>
          <div className="container mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <img 
                  src={restaurant.logoUrl || "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=120&h=120&fit=crop"} 
                  alt={restaurant.name}
                  className="h-16 mb-4 object-contain"
                />
                <p className="text-white/70 text-sm">{restaurant.name} - Serving authentic Peri Peri flavours with passion.</p>
              </div>
              <div>
                <h4 className="font-bold text-white mb-4">Quick Links</h4>
                <ul className="space-y-2 text-white/70 text-sm">
                  <li className="cursor-pointer hover:text-green-400 transition-colors" onClick={() => navigate(`/menu/${slug}`)}>Menu</li>
                  <li className="cursor-pointer hover:text-green-400 transition-colors" onClick={() => setShowBookingDialog(true)}>Book a Table</li>
                  <li className="cursor-pointer hover:text-green-400 transition-colors">Contact Us</li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-white mb-4">Contact</h4>
                <ul className="space-y-2 text-white/70 text-sm">
                  <li>{restaurant.address || "Visit us today!"}</li>
                  <li>{restaurant.phone || "Contact us"}</li>
                  <li>{restaurant.email || ""}</li>
                </ul>
              </div>
            </div>
            <div className="border-t border-white/10 mt-8 pt-8 text-center text-white/50 text-sm">
              <p>&copy; {new Date().getFullYear()} {restaurant.name}. All rights reserved.</p>
            </div>
          </div>
        </section>

        <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
          <DialogContent className="bg-slate-800 text-white border-slate-700 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-red-400 to-green-400 bg-clip-text text-transparent">Book a Table</DialogTitle>
              <DialogDescription className="text-slate-300">
                Reserve your table at {restaurant.name}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleBookingSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-slate-200">Name</Label>
                <Input
                  id="name"
                  value={bookingForm.customerName}
                  onChange={(e) => setBookingForm({ ...bookingForm, customerName: e.target.value })}
                  required
                  className="bg-slate-700/50 border-slate-600 text-white"
                  data-testid="input-booking-name"
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-slate-200">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={bookingForm.email}
                  onChange={(e) => setBookingForm({ ...bookingForm, email: e.target.value })}
                  required
                  className="bg-slate-700/50 border-slate-600 text-white"
                  data-testid="input-booking-email"
                />
              </div>
              <div>
                <Label htmlFor="phone" className="text-slate-200">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={bookingForm.phone}
                  onChange={(e) => setBookingForm({ ...bookingForm, phone: e.target.value })}
                  required
                  className="bg-slate-700/50 border-slate-600 text-white"
                  data-testid="input-booking-phone"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date" className="text-slate-200">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={bookingForm.date}
                    onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                    required
                    className="bg-slate-700/50 border-slate-600 text-white"
                    data-testid="input-booking-date"
                  />
                </div>
                <div>
                  <Label htmlFor="time" className="text-slate-200">Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={bookingForm.time}
                    onChange={(e) => setBookingForm({ ...bookingForm, time: e.target.value })}
                    required
                    className="bg-slate-700/50 border-slate-600 text-white"
                    data-testid="input-booking-time"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="guests" className="text-slate-200">Number of Guests</Label>
                <Input
                  id="guests"
                  type="number"
                  min="1"
                  max="20"
                  value={bookingForm.guests}
                  onChange={(e) => setBookingForm({ ...bookingForm, guests: parseInt(e.target.value) || 1 })}
                  required
                  className="bg-slate-700/50 border-slate-600 text-white"
                  data-testid="input-booking-guests"
                />
              </div>
              <Button 
                type="submit" 
                disabled={bookingLoading}
                className="w-full text-white font-bold py-3"
                style={{ background: SPICY_THEME.gradient.button }}
                data-testid="button-submit-booking"
              >
                {bookingLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Booking...
                  </>
                ) : (
                  "Confirm Booking"
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Tawa Watford Theme - Premium Navy Blue & Gold Design
  if (isTawaWatfordTheme) {
    return (
      <div 
        className="min-h-screen text-white relative overflow-hidden" 
        style={{ 
          fontFamily: "'Playfair Display', 'Georgia', serif",
          background: TAWA_WATFORD_THEME.gradient.background,
        }}
      >
        <style>{`
          @keyframes goldShimmer {
            0% { background-position: -200% center; }
            100% { background-position: 200% center; }
          }
          .gold-text {
            background: linear-gradient(90deg, #c9a646 0%, #e8c547 25%, #f5d76e 50%, #e8c547 75%, #c9a646 100%);
            background-size: 200% auto;
            animation: goldShimmer 3s linear infinite;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          .gold-border {
            border: 2px solid transparent;
            background: linear-gradient(#1e3a5f, #1e3a5f) padding-box,
                        linear-gradient(135deg, #c9a646, #e8c547, #c9a646) border-box;
          }
          .premium-glow {
            box-shadow: 0 0 30px rgba(201, 166, 70, 0.2), 0 0 60px rgba(201, 166, 70, 0.1);
          }
        `}</style>

        {/* Premium Header */}
        <header 
          className="py-4 px-4 sticky top-0 z-50 backdrop-blur-xl border-b border-yellow-600/20"
          style={{ background: 'linear-gradient(180deg, rgba(15, 28, 46, 0.98) 0%, rgba(30, 58, 95, 0.95) 100%)' }}
        >
          <div className="container mx-auto flex justify-between items-center">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              {restaurant.logoUrl ? (
                <img 
                  src={restaurant.logoUrl} 
                  alt={restaurant.name}
                  className="h-12 md:h-14 object-contain drop-shadow-lg"
                  data-testid="header-logo"
                />
              ) : (
                <div className="w-12 h-12 rounded-full gold-border flex items-center justify-center premium-glow">
                  <span className="text-2xl">🍽️</span>
                </div>
              )}
              <div className="hidden sm:block">
                <h1 className="gold-text text-xl md:text-2xl font-bold">{restaurant.name}</h1>
                <p className="text-yellow-400/60 text-xs uppercase tracking-widest">{restaurant.cuisineType || 'Pakistani & Afghani Cuisine'}</p>
              </div>
            </motion.div>
            
            <nav className="hidden lg:flex items-center gap-2">
              {[
                { label: 'Home', action: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
                { label: 'Menu', action: () => navigate(`/menu/${slug}`) },
                { label: 'Book Table', action: () => setShowBookingDialog(true) },
              ].map((item, index) => (
                <motion.button 
                  key={item.label}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.1 }}
                  className="text-white/90 font-medium px-5 py-2.5 rounded-lg hover:text-yellow-300 hover:bg-white/10 cursor-pointer transition-all border border-transparent hover:border-yellow-500/30"
                  onClick={() => { playClick(); item.action?.(); }}
                  onMouseEnter={() => playHover()}
                  data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
                >
                  {item.label}
                </motion.button>
              ))}
            </nav>

            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-2">
              <Button 
                className="bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-600 hover:from-yellow-500 hover:via-yellow-400 hover:to-yellow-500 text-blue-900 font-bold shadow-lg transition-all px-6 py-2"
                onClick={() => { playClick(); navigate(`/menu/${slug}`); }}
                data-testid="button-order-now"
              >
                Order Now
              </Button>
            </motion.div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="relative h-[70vh] md:h-[80vh] overflow-hidden">
          <div className="absolute inset-0">
            <img 
              src={restaurant.welcomeImageUrl || "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=1600&h=900&fit=crop"}
              alt={restaurant.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(15, 28, 46, 0.5) 0%, rgba(30, 58, 95, 0.7) 50%, rgba(15, 28, 46, 0.95) 100%)' }} />
          </div>

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center px-4 max-w-4xl">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <motion.div 
                  className="mb-6"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring" }}
                >
                  <span className="text-5xl md:text-6xl drop-shadow-lg">🍛</span>
                </motion.div>

                <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-4 tracking-tight">
                  <span className="gold-text">{restaurant.name}</span>
                </h1>
                
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-xl md:text-2xl text-yellow-100/90 mb-2 font-light italic"
                >
                  "{restaurant.tagline || 'Where every bite feels like home'}"
                </motion.p>
                
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="text-base md:text-lg text-yellow-200/70 mb-8 flex items-center justify-center gap-2"
                >
                  <MapPin className="h-4 w-4" /> {restaurant.address}
                </motion.p>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                  className="flex flex-col sm:flex-row items-center justify-center gap-4"
                >
                  <Button 
                    size="lg"
                    className="bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-600 hover:from-yellow-500 hover:via-yellow-400 hover:to-yellow-500 text-blue-900 font-bold text-lg px-10 py-6 rounded-full shadow-2xl transition-all transform hover:scale-105"
                    onClick={() => { playClick(); navigate(`/menu/${slug}`); }}
                    data-testid="hero-order-button"
                  >
                    <span className="mr-2">🛵</span> Order Delivery
                  </Button>
                  <Button 
                    size="lg"
                    variant="outline"
                    className="border-2 border-yellow-500/50 text-yellow-100 hover:bg-yellow-500/20 font-semibold text-lg px-8 py-6 rounded-full backdrop-blur-sm"
                    onClick={() => { playClick(); navigate(`/menu/${slug}`); }}
                    data-testid="hero-collect-button"
                  >
                    <span className="mr-2">🛍️</span> Collection
                  </Button>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Menu Categories Section */}
        <section className="py-16 md:py-20" style={{ background: TAWA_WATFORD_THEME.colors.cream }}>
          <div className="container mx-auto px-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Our Menu</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Explore our authentic Pakistani & Afghani cuisine, prepared with traditional recipes
              </p>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-12">
              {(() => {
                const categories = Array.from(new Set(menuItems.map(item => item.category).filter(Boolean)));
                const categoryImages: Record<string, string> = {
                  'popular': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=300&fit=crop',
                  'starters': 'https://images.unsplash.com/photo-1601050690117-94f5f6fa8bd7?w=400&h=300&fit=crop',
                  'tawa': 'https://images.unsplash.com/photo-1567337710282-00832b415979?w=400&h=300&fit=crop',
                  'karahis': 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&h=300&fit=crop',
                  'curries': 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop',
                  'biryani': 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&h=300&fit=crop',
                  'platters': 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&h=300&fit=crop',
                  'grill': 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop',
                  'kebab-roll': 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=400&h=300&fit=crop',
                  'burgers': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop',
                  'sides': 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=300&fit=crop',
                  'drinks': 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&h=300&fit=crop',
                  'desserts': 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&h=300&fit=crop',
                  'milkshakes': 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&h=300&fit=crop',
                  'lassi': 'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=400&h=300&fit=crop',
                  'mojito': 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=400&h=300&fit=crop',
                  'kids': 'https://images.unsplash.com/photo-1562967914-608f82629710?w=400&h=300&fit=crop',
                  'iftar-offer': 'https://images.unsplash.com/photo-1567337710282-00832b415979?w=400&h=300&fit=crop',
                };
                return categories.slice(0, 8).map((category, i) => {
                  const displayName = (category || '').split('-').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                  const categoryItem = menuItems.find(item => item.category === category && item.image);
                  const imageUrl = categoryItem?.image || categoryImages[category || ''] || 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=300&fit=crop';
                  return (
                    <motion.div
                      key={category}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className="group relative overflow-hidden rounded-2xl cursor-pointer shadow-lg hover:shadow-2xl transition-all"
                      onClick={() => { playClick(); navigate(`/menu/${slug}?category=${category}`); }}
                      data-testid={`category-${category}`}
                    >
                      <img 
                        src={imageUrl} 
                        alt={displayName}
                        className="w-full aspect-square object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-blue-900/90 via-blue-900/30 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h4 className="text-white font-bold text-sm md:text-lg">{displayName}</h4>
                      </div>
                      <div className="absolute inset-0 border-2 border-yellow-500/0 group-hover:border-yellow-500/50 rounded-2xl transition-all" />
                    </motion.div>
                  );
                });
              })()}
            </div>

            <div className="text-center">
              <Button 
                size="lg"
                className="bg-gradient-to-r from-blue-800 to-blue-900 hover:from-blue-700 hover:to-blue-800 text-white font-bold text-lg px-12 py-6 rounded-full shadow-xl"
                onClick={() => { playClick(); navigate(`/menu/${slug}`); }}
                data-testid="view-full-menu-button"
              >
                View Full Menu <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </section>

        {/* Popular Dishes Section */}
        <section className="py-16 md:py-20" style={{ background: 'linear-gradient(180deg, #0f1c2e 0%, #1a2d47 100%)' }}>
          <div className="container mx-auto px-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                <span className="gold-text">Popular Dishes</span>
              </h2>
              <p className="text-yellow-100/70">Our customers' favorites</p>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {menuItems.filter(item => item.category === 'popular' || item.category === 'tawa' || item.category === 'karahis').slice(0, 8).map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="gold-border rounded-2xl overflow-hidden hover:scale-105 transition-all cursor-pointer premium-glow"
                  style={{ background: TAWA_WATFORD_THEME.gradient.card }}
                  onClick={() => { playClick(); navigate(`/menu/${slug}`); }}
                  data-testid={`featured-item-${item.id}`}
                >
                  <img 
                    src={item.image || 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=300&fit=crop'} 
                    alt={item.name}
                    className="w-full h-32 md:h-40 object-cover"
                  />
                  <div className="p-4">
                    <h4 className="font-bold text-white text-sm md:text-base mb-1">{item.name}</h4>
                    <p className="text-yellow-400 font-bold">{currencySymbol}{item.price}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-16 md:py-20" style={{ background: 'linear-gradient(180deg, #1a2d47 0%, #0f1c2e 100%)' }}>
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="gold-border rounded-2xl p-8 premium-glow"
                style={{ background: TAWA_WATFORD_THEME.gradient.card }}
              >
                <h3 className="text-2xl font-bold gold-text mb-6">Visit Us</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <MapPin className="h-6 w-6 text-yellow-400 flex-shrink-0 mt-1" />
                    <div>
                      <p className="text-white font-medium">Address</p>
                      <p className="text-yellow-100/70">{restaurant.address}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <Phone className="h-6 w-6 text-yellow-400 flex-shrink-0 mt-1" />
                    <div>
                      <p className="text-white font-medium">Phone</p>
                      <p className="text-yellow-100/70">{restaurant.phone || "Contact us for orders"}</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="gold-border rounded-2xl p-8 premium-glow"
                style={{ background: TAWA_WATFORD_THEME.gradient.card }}
              >
                <h3 className="text-2xl font-bold gold-text mb-6">Opening Hours</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-white">Mon - Thu</span>
                    <span className="text-yellow-300">{restaurant.deliveryHoursMonThu || "12PM - 11PM"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white">Fri - Sat</span>
                    <span className="text-yellow-300">{restaurant.deliveryHoursFriSat || "12PM - 12AM"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white">Sunday</span>
                    <span className="text-yellow-300">{restaurant.deliveryHoursSun || "12PM - 11PM"}</span>
                  </div>
                </div>
              </motion.div>

              {/* Map Card */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="gold-border rounded-2xl overflow-hidden premium-glow"
                style={{ background: TAWA_WATFORD_THEME.gradient.card }}
              >
                <h3 className="text-xl font-bold gold-text p-4 pb-2">Find Us</h3>
                <div className="h-48 md:h-56">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2476.234912345678!2d-0.3969!3d51.6545!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x48761471c6e3f3d5%3A0x1234567890abcdef!2s195%20Saint%20Albans%20Road%2C%20Watford!5e0!3m2!1sen!2suk!4v1234567890123"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Tawa Restaurant Watford Location"
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 border-t border-yellow-600/20" style={{ background: 'rgba(15, 28, 46, 0.98)' }}>
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left">
                <p className="gold-text text-xl font-bold mb-1">{restaurant.name}</p>
                <p className="text-yellow-100/50 text-sm">{restaurant.address}</p>
              </div>
              
              {/* Small Map in Footer */}
              <div className="gold-border rounded-xl overflow-hidden w-48 h-32 premium-glow">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2476.234912345678!2d-0.3969!3d51.6545!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x48761471c6e3f3d5%3A0x1234567890abcdef!2s195%20Saint%20Albans%20Road%2C%20Watford!5e0!3m2!1sen!2suk!4v1234567890123"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Location Map"
                />
              </div>
              
              <div className="text-center md:text-right">
                <p className="text-yellow-100/40 text-xs">© {new Date().getFullYear()} All Rights Reserved</p>
              </div>
            </div>
          </div>
        </footer>

        {/* Booking Dialog */}
        <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
          <DialogContent className="bg-blue-900 border-yellow-500/30 text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="gold-text text-2xl">Book a Table</DialogTitle>
              <DialogDescription className="text-yellow-100/70">
                Reserve your table at {restaurant.name}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleBookingSubmit} className="space-y-4 mt-4">
              <div>
                <Label className="text-yellow-100">Your Name</Label>
                <Input
                  value={bookingForm.customerName}
                  onChange={e => setBookingForm(prev => ({ ...prev, customerName: e.target.value }))}
                  className="bg-blue-800/50 border-yellow-500/30 text-white"
                  required
                  data-testid="input-booking-name"
                />
              </div>
              <div>
                <Label className="text-yellow-100">Phone</Label>
                <Input
                  type="tel"
                  value={bookingForm.phone}
                  onChange={e => setBookingForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="bg-blue-800/50 border-yellow-500/30 text-white"
                  required
                  data-testid="input-booking-phone"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-yellow-100">Date</Label>
                  <Input
                    type="date"
                    value={bookingForm.date}
                    onChange={e => setBookingForm(prev => ({ ...prev, date: e.target.value }))}
                    className="bg-blue-800/50 border-yellow-500/30 text-white"
                    required
                    data-testid="input-booking-date"
                  />
                </div>
                <div>
                  <Label className="text-yellow-100">Time</Label>
                  <Input
                    type="time"
                    value={bookingForm.time}
                    onChange={e => setBookingForm(prev => ({ ...prev, time: e.target.value }))}
                    className="bg-blue-800/50 border-yellow-500/30 text-white"
                    required
                    data-testid="input-booking-time"
                  />
                </div>
              </div>
              <div>
                <Label className="text-yellow-100">Number of Guests</Label>
                <Input
                  type="number"
                  min={1}
                  max={50}
                  value={bookingForm.guests}
                  onChange={e => setBookingForm(prev => ({ ...prev, guests: parseInt(e.target.value) || 2 }))}
                  className="bg-blue-800/50 border-yellow-500/30 text-white"
                  required
                  data-testid="input-booking-guests"
                />
              </div>
              <Button 
                type="submit" 
                disabled={bookingLoading}
                className="w-full bg-gradient-to-r from-yellow-600 to-yellow-500 text-blue-900 font-bold hover:from-yellow-500 hover:to-yellow-400"
                data-testid="button-submit-booking"
              >
                {bookingLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Reservation"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Tawa Theme - Warm Orange/Amber Indian Restaurant Theme
  if (isTawaTheme) {
    return (
      <div 
        className="min-h-screen text-white relative overflow-hidden" 
        style={{ 
          fontFamily: "'Poppins', 'Arial', sans-serif",
          background: TAWA_THEME.gradient.background,
        }}
      >
        <header 
          className="py-4 px-4 sticky top-0 z-50 border-b border-white/10 backdrop-blur-md"
          style={{ background: TAWA_THEME.gradient.header }}
        >
          <div className="container mx-auto flex justify-between items-center">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <img 
                src={restaurant.logoUrl || "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=60&h=60&fit=crop"} 
                alt={restaurant.name}
                className="h-12 w-12 rounded-full object-cover ring-2 ring-amber-400/50"
                data-testid="header-logo"
              />
              <span className="text-xl font-bold text-white">{restaurant.name}</span>
            </motion.div>
            <nav className="hidden md:flex items-center gap-4">
              <Button 
                variant="ghost" 
                className="text-white hover:bg-white/10"
                onClick={() => navigate(`/menu/${slug}`)}
                data-testid="nav-menu"
              >
                Menu
              </Button>
              <Button 
                variant="ghost" 
                className="text-white hover:bg-white/10"
                onClick={() => setShowBookingDialog(true)}
                data-testid="nav-booking"
              >
                Book a Table
              </Button>
              <Button 
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold"
                onClick={() => navigate(`/menu/${slug}`)}
                data-testid="button-order-now"
              >
                Order Now
              </Button>
            </nav>
          </div>
        </header>

        <section className="relative h-[500px] md:h-[600px] overflow-hidden">
          <div className="absolute inset-0">
            {restaurant.tawaHeroVideo ? (
              <video
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
                data-testid="tawa-hero-video"
              >
                <source src={restaurant.tawaHeroVideo} type="video/mp4" />
              </video>
            ) : heroImages.length > 0 ? (
              <HeroCarousel
                images={heroImages}
                effect={(restaurant.heroAnimationStyle as any) || "slide"}
                interval={restaurant.heroSlideInterval || 5000}
                fallbackImage="https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=1400&h=600&fit=crop"
                gradientStart="#d97706"
                gradientMiddle="#ea580c"
                gradientEnd="#dc2626"
              />
            ) : restaurant.tawaHeroImage ? (
              <img 
                src={restaurant.tawaHeroImage}
                alt={restaurant.name}
                className="w-full h-full object-cover"
                data-testid="tawa-hero-image"
              />
            ) : (
              <img 
                src={restaurant.welcomeImageUrl || "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=1400&h=600&fit=crop"}
                alt={restaurant.name}
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-gray-900/70 via-gray-900/50 to-gray-900/80"></div>
          </div>
          
          <div className="relative z-10 h-full flex flex-col items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center max-w-3xl"
            >
              {promotion?.isActive && (
                <Badge className="mb-4 text-sm px-4 py-1" style={{ background: TAWA_THEME.gradient.header }}>
                  {promotion.headline}
                </Badge>
              )}
              <h1 className="text-5xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-amber-300 via-orange-300 to-amber-300 bg-clip-text text-transparent">
                {restaurant.name}
              </h1>
              <p className="text-xl text-gray-300 mb-8">Authentic Indian Cuisine & Tawa Specials</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg"
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold text-lg px-10 py-6 rounded-xl"
                  onClick={() => navigate(`/menu/${slug}`)}
                  data-testid="button-deliver"
                >
                  🚗 Delivery
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  className="border-amber-400 text-amber-300 hover:bg-amber-500/20 font-bold text-lg px-10 py-6 rounded-xl"
                  onClick={() => navigate(`/menu/${slug}`)}
                  data-testid="button-collect"
                >
                  🛍️ Collection
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="py-16 px-4" style={{ background: TAWA_THEME.colors.cream }}>
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">Welcome to {restaurant.name}</h2>
            <p className="text-gray-600 text-center max-w-2xl mx-auto mb-8">
              {restaurant.tagline || "Experience the authentic flavors of India with our signature Tawa dishes, aromatic biryanis, and sizzling karahis prepared with traditional recipes."}
            </p>
            
            {/* Menu Categories Section */}
            <div className="mb-12">
              <h3 className="text-2xl font-bold text-gray-800 text-center mb-6">Our Menu Categories</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(() => {
                  const categories = Array.from(new Set(menuItems.map(item => item.category).filter(Boolean)));
                  const categoryImages: Record<string, string> = {
                    'popular': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=300&fit=crop',
                    'starters': 'https://images.unsplash.com/photo-1601050690117-94f5f6fa8bd7?w=400&h=300&fit=crop',
                    'tawa': 'https://images.unsplash.com/photo-1567337710282-00832b415979?w=400&h=300&fit=crop',
                    'karahis': 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&h=300&fit=crop',
                    'curries': 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop',
                    'biryani': 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&h=300&fit=crop',
                    'platters': 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&h=300&fit=crop',
                    'grill': 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop',
                    'kebab-roll': 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=400&h=300&fit=crop',
                    'burgers': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop',
                    'sides': 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=300&fit=crop',
                    'drinks': 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&h=300&fit=crop',
                    'desserts': 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&h=300&fit=crop',
                    'milkshakes': 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&h=300&fit=crop',
                    'lassi': 'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=400&h=300&fit=crop',
                    'mojito': 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=400&h=300&fit=crop',
                    'kids': 'https://images.unsplash.com/photo-1562967914-608f82629710?w=400&h=300&fit=crop',
                    'iftar-offer': 'https://images.unsplash.com/photo-1567337710282-00832b415979?w=400&h=300&fit=crop',
                  };
                  return categories.slice(0, 8).map((category, i) => {
                    const displayName = (category || '').split('-').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                    const categoryItem = menuItems.find(item => item.category === category && item.image);
                    const imageUrl = categoryItem?.image || categoryImages[category || ''] || 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=300&fit=crop';
                    return (
                      <motion.div
                        key={category}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                        className="group relative overflow-hidden rounded-xl cursor-pointer shadow-lg hover:shadow-xl transition-all"
                        onClick={() => { playClick(); navigate(`/menu/${slug}?category=${category}`); }}
                        data-testid={`category-${category}`}
                      >
                        <img 
                          src={imageUrl} 
                          alt={displayName}
                          className="w-full aspect-square object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <h4 className="text-white font-bold text-sm md:text-base">{displayName}</h4>
                        </div>
                      </motion.div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Featured Items Section */}
            <div className="mb-12">
              <h3 className="text-2xl font-bold text-gray-800 text-center mb-6">Popular Dishes</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {menuItems.filter(item => item.category === 'popular' || item.category === 'tawa' || item.category === 'karahis').slice(0, 8).map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all cursor-pointer"
                    onClick={() => { playClick(); navigate(`/menu/${slug}`); }}
                    data-testid={`featured-item-${item.id}`}
                  >
                    <img 
                      src={item.image || 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=300&fit=crop'} 
                      alt={item.name}
                      className="w-full h-32 object-cover"
                    />
                    <div className="p-3">
                      <h4 className="font-bold text-gray-800 text-sm">{item.name}</h4>
                      <p className="text-amber-600 font-bold">{currencySymbol}{item.price}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="text-center">
              <Button 
                size="lg"
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400"
                onClick={() => navigate(`/menu/${slug}`)}
                data-testid="button-explore-menu"
              >
                Explore Full Menu
              </Button>
            </div>
          </div>
        </section>

        {/* Hours & Location */}
        <section className="py-16 px-4 bg-gray-900">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center mb-10 text-amber-400">Visit Us</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="rounded-2xl p-8 bg-gray-800">
                <h3 className="text-2xl font-bold mb-6 text-amber-400">Find Us</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <MapPin className="h-6 w-6 flex-shrink-0 mt-1 text-amber-400" />
                    <div>
                      <p className="text-white font-medium">Address</p>
                      <p className="text-gray-300">{restaurant.address || "Address not set"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <Phone className="h-6 w-6 flex-shrink-0 mt-1 text-amber-400" />
                    <div>
                      <p className="text-white font-medium">Phone</p>
                      <p className="text-gray-300">{restaurant.phone || "Contact us"}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl p-8 bg-gray-800">
                <h3 className="text-2xl font-bold mb-6 text-amber-400">Opening Hours</h3>
                <div className="space-y-3">
                  <div className="flex justify-between"><span className="text-white">Mon - Thu</span><span className="text-amber-400">{restaurant.deliveryHoursMonThu || "12PM - 10:30PM"}</span></div>
                  <div className="flex justify-between"><span className="text-white">Fri - Sat</span><span className="text-amber-400">{restaurant.deliveryHoursFriSat || "12PM - 11:30PM"}</span></div>
                  <div className="flex justify-between"><span className="text-white">Sunday</span><span className="text-amber-400">{restaurant.deliveryHoursSun || "12PM - 10:30PM"}</span></div>
                </div>
              </div>
              <div className="rounded-2xl overflow-hidden bg-gray-800">
                <h3 className="text-xl font-bold p-4 pb-2 text-amber-400">Our Location</h3>
                <div className="h-48 md:h-56">
                  {(restaurant as any).mapEmbedUrl ? (
                    <iframe src={(restaurant as any).mapEmbedUrl} width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" title={`${restaurant.name} Location`} />
                  ) : (
                    <div className="h-full flex items-center justify-center p-4">
                      <div className="text-center">
                        <MapPin className="h-8 w-8 mx-auto mb-2 text-amber-400" />
                        <p className="text-gray-300 text-sm">{restaurant.address || "Visit us today!"}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* Bottom CTA */}
        <section className="py-12 px-4 text-center" style={{ background: '#111827' }}>
          <div className="container mx-auto">
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-4">
              <Button size="lg" className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold text-lg px-10 py-6 rounded-xl" onClick={() => navigate(`/menu/${slug}`)}>🚗 Order Delivery</Button>
              <Button size="lg" variant="outline" className="border-amber-400 text-amber-400 hover:bg-amber-500/20 font-bold text-lg px-10 py-6 rounded-xl" onClick={() => setShowBookingDialog(true)}>📅 Book a Table</Button>
            </div>
            {restaurant.phone && <p className="text-gray-400 text-sm">Or call us: {restaurant.phone}</p>}
          </div>
        </section>

        <footer className="py-12 px-4" style={{ background: '#111827' }}>
          <div className="container mx-auto text-center">
            <img 
              src={restaurant.logoUrl || "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=60&h=60&fit=crop"} 
              alt={restaurant.name}
              className="h-16 w-16 rounded-full mx-auto mb-4 object-cover ring-2 ring-amber-400/50"
            />
            <p className="text-amber-400 font-bold text-xl mb-2">{restaurant.name}</p>
            {restaurant.address && <p className="text-gray-400 text-sm mb-1">{restaurant.address}</p>}
            {restaurant.phone && <p className="text-gray-400 text-sm">{restaurant.phone}</p>}
            <p className="text-gray-500 text-sm mt-4">© {new Date().getFullYear()} {restaurant.name}. All rights reserved.</p>
          </div>
        </footer>

        <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
          <DialogContent className="sm:max-w-[425px] bg-gray-900 border-amber-500/30 text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-amber-400">Book a Table</DialogTitle>
              <DialogDescription className="text-gray-300">Reserve your table at {restaurant.name}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleBookingSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label className="text-gray-200">Your Name</Label>
                <Input value={bookingForm.customerName} onChange={(e) => setBookingForm({ ...bookingForm, customerName: e.target.value })} required className="bg-gray-800 border-gray-700 text-white" data-testid="input-booking-name" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-200">Email</Label>
                  <Input type="email" value={bookingForm.email} onChange={(e) => setBookingForm({ ...bookingForm, email: e.target.value })} required className="bg-gray-800 border-gray-700 text-white" data-testid="input-booking-email" />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-200">Phone</Label>
                  <Input type="tel" value={bookingForm.phone} onChange={(e) => setBookingForm({ ...bookingForm, phone: e.target.value })} required className="bg-gray-800 border-gray-700 text-white" data-testid="input-booking-phone" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-200">Date</Label>
                  <Input type="date" value={bookingForm.date} onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })} required min={new Date().toISOString().split('T')[0]} className="bg-gray-800 border-gray-700 text-white" data-testid="input-booking-date" />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-200">Time</Label>
                  <Input type="time" value={bookingForm.time} onChange={(e) => setBookingForm({ ...bookingForm, time: e.target.value })} required className="bg-gray-800 border-gray-700 text-white" data-testid="input-booking-time" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-200">Number of Guests</Label>
                <Input type="number" min="1" max="20" value={bookingForm.guests} onChange={(e) => setBookingForm({ ...bookingForm, guests: parseInt(e.target.value) || 1 })} required className="bg-gray-800 border-gray-700 text-white" data-testid="input-booking-guests" />
              </div>
              <Button type="submit" disabled={bookingLoading} className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold" data-testid="button-submit-booking">
                {bookingLoading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Booking...</> : "Confirm Booking"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Emparo Theme - Bold Red Peri Peri Theme  
  if (isEmparoTheme) {
    const bgType = restaurant.welcomeBackgroundType || 'gradient';
    const gifUrl = restaurant.welcomeBackgroundGifUrl;
    
    return (
      <div 
        className="min-h-screen text-gray-900 relative" 
        style={{ 
          fontFamily: "'Poppins', 'Arial', sans-serif",
          background: EMPARO_THEME.colors.cream,
        }}
      >
        {/* GIF Background when set */}
        {bgType === 'gif' && gifUrl && (
          <div className="fixed inset-0 z-0">
            <img src={gifUrl} alt="Background" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-red-900/70 via-red-800/50 to-black/80"></div>
          </div>
        )}
        <header 
          className="py-4 px-4 sticky top-0 z-50 shadow-lg"
          style={{ background: EMPARO_THEME.gradient.header }}
        >
          <div className="container mx-auto flex justify-between items-center">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <img 
                src={restaurant.logoUrl || "https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=60&h=60&fit=crop"} 
                alt={restaurant.name}
                className="h-12 object-contain"
                data-testid="header-logo"
              />
              <span className="text-xl font-bold text-white hidden sm:inline">{restaurant.name}</span>
            </motion.div>
            <nav className="flex items-center gap-2 md:gap-4">
              <Button 
                variant="ghost" 
                className="text-white hover:bg-white/10 text-sm"
                onClick={() => navigate(`/menu/${slug}`)}
                data-testid="nav-menu"
              >
                Menu
              </Button>
              <Button 
                variant="ghost" 
                className="text-white hover:bg-white/10 text-sm hidden sm:inline-flex"
                onClick={() => setShowBookingDialog(true)}
                data-testid="nav-booking"
              >
                Book a Table
              </Button>
              <Button 
                className="bg-white text-red-600 hover:bg-gray-100 font-bold"
                onClick={() => navigate(`/menu/${slug}`)}
                data-testid="button-order-now"
              >
                Order Now
              </Button>
            </nav>
          </div>
        </header>

        <section className="relative h-[500px] md:h-[600px] overflow-hidden">
          <div className="absolute inset-0">
            {bgType === 'gif' && gifUrl ? (
              <>
                <img src={gifUrl} alt="Background" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-b from-red-900/70 via-red-800/50 to-black/80"></div>
              </>
            ) : heroImages.length > 0 ? (
              <HeroCarousel
                images={heroImages}
                effect={(restaurant.heroAnimationStyle as any) || "slide"}
                interval={restaurant.heroSlideInterval || 5000}
                fallbackImage="https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=1400&h=600&fit=crop"
                gradientStart="#dc2626"
                gradientMiddle="#b91c1c"
                gradientEnd="#991b1b"
              />
            ) : (
              <img 
                src={restaurant.welcomeImageUrl || "https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=1400&h=600&fit=crop"}
                alt={restaurant.name}
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-red-900/60 via-red-800/40 to-black/70"></div>
          </div>
          
          <div className="relative z-10 h-full flex flex-col items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center max-w-3xl"
            >
              {promotion?.isActive && (
                <Badge className="mb-4 text-sm px-4 py-1 bg-white text-red-600 font-bold">
                  🔥 {promotion.headline}
                </Badge>
              )}
              <h1 className="text-5xl md:text-7xl font-bold mb-4 text-white">
                {restaurant.name}
              </h1>
              <p className="text-xl text-red-100 mb-8">Flame-Grilled Peri Peri Perfection</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg"
                  className="bg-white text-red-600 hover:bg-gray-100 font-bold text-lg px-10 py-6 rounded-xl shadow-lg"
                  onClick={() => navigate(`/menu/${slug}`)}
                  data-testid="button-deliver"
                >
                  🔥 Order Delivery
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/20 font-bold text-lg px-10 py-6 rounded-xl"
                  onClick={() => navigate(`/menu/${slug}`)}
                  data-testid="button-collect"
                >
                  🛍️ Collect (10% Off)
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="py-16 px-4 bg-white">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-red-600 text-center mb-8">Welcome to Emparo Peri Peri</h2>
            <p className="text-gray-600 text-center max-w-2xl mx-auto mb-8">
              Experience the heat! Our flame-grilled chicken is marinated in authentic 
              Peri Peri sauce, bringing you the bold flavors you crave.
            </p>
            <div className="text-center">
              <Button 
                size="lg"
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() => navigate(`/menu/${slug}`)}
              >
                View Our Menu
              </Button>
            </div>
          </div>
        </section>

        {/* Hours & Location */}
        <section className="py-16 px-4 bg-red-800">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center mb-10 text-white">Visit Us</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="rounded-2xl p-8 bg-red-900">
                <h3 className="text-2xl font-bold mb-6 text-red-300">Find Us</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <MapPin className="h-6 w-6 flex-shrink-0 mt-1 text-red-300" />
                    <div>
                      <p className="text-white font-medium">Address</p>
                      <p className="text-gray-300">{restaurant.address || "Address not set"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <Phone className="h-6 w-6 flex-shrink-0 mt-1 text-red-300" />
                    <div>
                      <p className="text-white font-medium">Phone</p>
                      <p className="text-gray-300">{restaurant.phone || "Contact us"}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl p-8 bg-red-900">
                <h3 className="text-2xl font-bold mb-6 text-red-300">Opening Hours</h3>
                <div className="space-y-3">
                  <div className="flex justify-between"><span className="text-white">Mon - Thu</span><span className="text-red-300">{restaurant.deliveryHoursMonThu || "12PM - 10:30PM"}</span></div>
                  <div className="flex justify-between"><span className="text-white">Fri - Sat</span><span className="text-red-300">{restaurant.deliveryHoursFriSat || "12PM - 11:30PM"}</span></div>
                  <div className="flex justify-between"><span className="text-white">Sunday</span><span className="text-red-300">{restaurant.deliveryHoursSun || "12PM - 10:30PM"}</span></div>
                </div>
              </div>
              <div className="rounded-2xl overflow-hidden bg-red-900">
                <h3 className="text-xl font-bold p-4 pb-2 text-red-300">Our Location</h3>
                <div className="h-48 md:h-56">
                  {(restaurant as any).mapEmbedUrl ? (
                    <iframe src={(restaurant as any).mapEmbedUrl} width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" title={`${restaurant.name} Location`} />
                  ) : (
                    <div className="h-full flex items-center justify-center p-4">
                      <div className="text-center">
                        <MapPin className="h-8 w-8 mx-auto mb-2 text-red-300" />
                        <p className="text-gray-300 text-sm">{restaurant.address || "Visit us today!"}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* Bottom CTA */}
        <section className="py-12 px-4 bg-red-900 text-center">
          <div className="container mx-auto">
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-4">
              <Button size="lg" className="bg-white text-red-600 hover:bg-gray-100 font-bold text-lg px-10 py-6 rounded-xl" onClick={() => navigate(`/menu/${slug}`)}>🚗 Order Delivery</Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/20 font-bold text-lg px-10 py-6 rounded-xl" onClick={() => setShowBookingDialog(true)}>📅 Book a Table</Button>
            </div>
            {restaurant.phone && <p className="text-red-200 text-sm">Or call us: {restaurant.phone}</p>}
          </div>
        </section>

        <footer className="py-12 px-4 bg-red-900 text-white">
          <div className="container mx-auto text-center">
            <img 
              src={restaurant.logoUrl || "https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=60&h=60&fit=crop"} 
              alt={restaurant.name}
              className="h-16 mx-auto mb-4 object-contain"
            />
            <p className="font-bold text-xl mb-2">{restaurant.name}</p>
            {restaurant.address && <p className="text-red-200 text-sm mb-1">{restaurant.address}</p>}
            {restaurant.phone && <p className="text-red-200 text-sm">{restaurant.phone}</p>}
            <p className="text-red-300 text-sm mt-4">© {new Date().getFullYear()} {restaurant.name}. All rights reserved.</p>
          </div>
        </footer>

        <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
          <DialogContent className="sm:max-w-[425px] bg-red-900 border-red-500/30 text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-white">Book a Table</DialogTitle>
              <DialogDescription className="text-red-200">Reserve your table at {restaurant.name}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleBookingSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label className="text-red-100">Your Name</Label>
                <Input value={bookingForm.customerName} onChange={(e) => setBookingForm({ ...bookingForm, customerName: e.target.value })} required className="bg-red-800 border-red-700 text-white" data-testid="input-booking-name" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-red-100">Email</Label>
                  <Input type="email" value={bookingForm.email} onChange={(e) => setBookingForm({ ...bookingForm, email: e.target.value })} required className="bg-red-800 border-red-700 text-white" data-testid="input-booking-email" />
                </div>
                <div className="space-y-2">
                  <Label className="text-red-100">Phone</Label>
                  <Input type="tel" value={bookingForm.phone} onChange={(e) => setBookingForm({ ...bookingForm, phone: e.target.value })} required className="bg-red-800 border-red-700 text-white" data-testid="input-booking-phone" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-red-100">Date</Label>
                  <Input type="date" value={bookingForm.date} onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })} required min={new Date().toISOString().split('T')[0]} className="bg-red-800 border-red-700 text-white" data-testid="input-booking-date" />
                </div>
                <div className="space-y-2">
                  <Label className="text-red-100">Time</Label>
                  <Input type="time" value={bookingForm.time} onChange={(e) => setBookingForm({ ...bookingForm, time: e.target.value })} required className="bg-red-800 border-red-700 text-white" data-testid="input-booking-time" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-red-100">Number of Guests</Label>
                <Input type="number" min="1" max="20" value={bookingForm.guests} onChange={(e) => setBookingForm({ ...bookingForm, guests: parseInt(e.target.value) || 1 })} required className="bg-red-800 border-red-700 text-white" data-testid="input-booking-guests" />
              </div>
              <Button type="submit" disabled={bookingLoading} className="w-full bg-white text-red-600 hover:bg-gray-100 font-bold" data-testid="button-submit-booking">
                {bookingLoading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Booking...</> : "Confirm Booking"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Dhaba Theme - Elegant Indian with Gold Accents
  if (isDhabaTheme) {
    const bgType = restaurant.welcomeBackgroundType || 'gradient';
    const gifUrl = restaurant.welcomeBackgroundGifUrl;
    
    return (
      <div 
        className="min-h-screen text-white relative" 
        style={{ 
          fontFamily: "'Poppins', 'Arial', sans-serif",
          background: DHABA_THEME.colors.primary,
        }}
      >
        {/* GIF Background when set */}
        {bgType === 'gif' && gifUrl && (
          <div className="fixed inset-0 z-0">
            <img src={gifUrl} alt="Background" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-blue-900/80 via-blue-800/70 to-black/90"></div>
          </div>
        )}
        <header 
          className="py-4 px-4 sticky top-0 z-50 border-b"
          style={{ background: DHABA_THEME.gradient.header, borderColor: DHABA_THEME.colors.secondary + '40' }}
        >
          <div className="container mx-auto flex justify-between items-center">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              {restaurant.logoUrl && (
                <img 
                  src={restaurant.logoUrl} 
                  alt={restaurant.name}
                  className="h-10 md:h-12 object-contain"
                  data-testid="header-logo"
                />
              )}
              <span className="text-lg md:text-xl font-bold" style={{ color: DHABA_THEME.colors.secondary }}>{restaurant.name}</span>
            </motion.div>
            <nav className="flex items-center gap-2 md:gap-4">
              <Button 
                variant="ghost" 
                className="text-white hover:text-yellow-300 text-sm"
                onClick={() => navigate(`/menu/${slug}`)}
                data-testid="nav-menu"
              >
                Menu
              </Button>
              <Button 
                variant="ghost" 
                className="text-white hover:text-yellow-300 text-sm hidden sm:inline-flex"
                onClick={() => setShowBookingDialog(true)}
                data-testid="nav-booking"
              >
                Book a Table
              </Button>
              <Button 
                className="font-bold"
                style={{ background: DHABA_THEME.gradient.gold, color: DHABA_THEME.colors.primary }}
                onClick={() => navigate(`/menu/${slug}`)}
                data-testid="button-order-now"
              >
                Order Now
              </Button>
            </nav>
          </div>
        </header>

        <section className="relative h-[500px] md:h-[600px] overflow-hidden">
          <div className="absolute inset-0">
            {bgType === 'gif' && gifUrl ? (
              <>
                <img src={gifUrl} alt="Background" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-b from-blue-900/70 via-blue-800/50 to-black/80"></div>
              </>
            ) : heroImages.length > 0 ? (
              <HeroCarousel
                images={heroImages}
                effect={(restaurant.heroAnimationStyle as any) || "slide"}
                interval={restaurant.heroSlideInterval || 5000}
                fallbackImage="https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=1400&h=600&fit=crop"
                gradientStart="#c9a646"
                gradientMiddle="#f6c343"
                gradientEnd="#c9a646"
              />
            ) : (
              <img 
                src={restaurant.welcomeImageUrl || "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=1400&h=600&fit=crop"}
                alt={restaurant.name}
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(26,26,46,0.7) 0%, rgba(26,26,46,0.5) 50%, rgba(26,26,46,0.8) 100%)' }}></div>
          </div>
          
          <div className="relative z-10 h-full flex flex-col items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center max-w-3xl"
            >
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="h-px w-16 bg-gradient-to-r from-transparent to-amber-400"></div>
                <span className="text-amber-400 text-sm tracking-widest uppercase">Welcome to</span>
                <div className="h-px w-16 bg-gradient-to-l from-transparent to-amber-400"></div>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold mb-4" style={{ color: DHABA_THEME.colors.secondary }}>
                {restaurant.name}
              </h1>
              <p className="text-xl text-gray-300 mb-8">Traditional Family Restaurant & Take Away</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg"
                  className="font-bold text-lg px-10 py-6 rounded-xl shadow-lg"
                  style={{ background: DHABA_THEME.gradient.gold, color: DHABA_THEME.colors.primary }}
                  onClick={() => navigate(`/menu/${slug}`)}
                  data-testid="button-deliver"
                >
                  Order Delivery
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  className="font-bold text-lg px-10 py-6 rounded-xl"
                  style={{ borderColor: DHABA_THEME.colors.secondary, color: DHABA_THEME.colors.secondary }}
                  onClick={() => navigate(`/menu/${slug}`)}
                  data-testid="button-collect"
                >
                  Collection
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="py-16 px-4" style={{ background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)' }}>
          <div className="container mx-auto text-center">
            <h2 className="text-3xl font-bold mb-8" style={{ color: DHABA_THEME.colors.secondary }}>Authentic Family Recipes</h2>
            <p className="text-gray-400 max-w-2xl mx-auto mb-8">
              Experience the warmth of traditional Indian hospitality with our 
              carefully crafted dishes, made from authentic family recipes passed down through generations.
            </p>
            <Button 
              size="lg"
              style={{ background: DHABA_THEME.gradient.gold, color: DHABA_THEME.colors.primary }}
              onClick={() => navigate(`/menu/${slug}`)}
            >
              Explore Our Menu
            </Button>
          </div>
        </section>

        {/* Hours & Location */}
        <section className="py-16 px-4" style={{ background: '#16213e' }}>
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center mb-10" style={{ color: DHABA_THEME.colors.secondary }}>Visit Us</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="rounded-2xl p-8" style={{ background: DHABA_THEME.colors.primary }}>
                <h3 className="text-2xl font-bold mb-6" style={{ color: DHABA_THEME.colors.secondary }}>Find Us</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <MapPin className="h-6 w-6 flex-shrink-0 mt-1" style={{ color: DHABA_THEME.colors.accent }} />
                    <div>
                      <p className="text-white font-medium">Address</p>
                      <p className="text-gray-300">{restaurant.address || "Address not set"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <Phone className="h-6 w-6 flex-shrink-0 mt-1" style={{ color: DHABA_THEME.colors.accent }} />
                    <div>
                      <p className="text-white font-medium">Phone</p>
                      <p className="text-gray-300">{restaurant.phone || "Contact us"}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl p-8" style={{ background: DHABA_THEME.colors.primary }}>
                <h3 className="text-2xl font-bold mb-6" style={{ color: DHABA_THEME.colors.secondary }}>Opening Hours</h3>
                <div className="space-y-3">
                  <div className="flex justify-between"><span className="text-white">Mon - Thu</span><span style={{ color: DHABA_THEME.colors.accent }}>{restaurant.deliveryHoursMonThu || "12PM - 10:30PM"}</span></div>
                  <div className="flex justify-between"><span className="text-white">Fri - Sat</span><span style={{ color: DHABA_THEME.colors.accent }}>{restaurant.deliveryHoursFriSat || "12PM - 11:30PM"}</span></div>
                  <div className="flex justify-between"><span className="text-white">Sunday</span><span style={{ color: DHABA_THEME.colors.accent }}>{restaurant.deliveryHoursSun || "12PM - 10:30PM"}</span></div>
                </div>
              </div>
              <div className="rounded-2xl overflow-hidden" style={{ background: DHABA_THEME.colors.primary }}>
                <h3 className="text-xl font-bold p-4 pb-2" style={{ color: DHABA_THEME.colors.secondary }}>Our Location</h3>
                <div className="h-48 md:h-56">
                  {(restaurant as any).mapEmbedUrl ? (
                    <iframe src={(restaurant as any).mapEmbedUrl} width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" title={`${restaurant.name} Location`} />
                  ) : (
                    <div className="h-full flex items-center justify-center p-4">
                      <div className="text-center">
                        <MapPin className="h-8 w-8 mx-auto mb-2" style={{ color: DHABA_THEME.colors.accent }} />
                        <p className="text-gray-300 text-sm">{restaurant.address || "Visit us today!"}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* Bottom CTA */}
        <section className="py-12 px-4 text-center" style={{ background: DHABA_THEME.colors.primary }}>
          <div className="container mx-auto">
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-4">
              <Button size="lg" className="font-bold text-lg px-10 py-6 rounded-xl" style={{ background: DHABA_THEME.gradient.gold, color: DHABA_THEME.colors.primary }} onClick={() => navigate(`/menu/${slug}`)}>🚗 Order Delivery</Button>
              <Button size="lg" variant="outline" className="font-bold text-lg px-10 py-6 rounded-xl" style={{ borderColor: DHABA_THEME.colors.secondary, color: DHABA_THEME.colors.secondary }} onClick={() => setShowBookingDialog(true)}>📅 Book a Table</Button>
            </div>
            {restaurant.phone && <p className="text-gray-400 text-sm">Or call us: {restaurant.phone}</p>}
          </div>
        </section>

        <footer className="py-12 px-4" style={{ background: DHABA_THEME.colors.primary, borderTop: `1px solid ${DHABA_THEME.colors.secondary}40` }}>
          <div className="container mx-auto text-center">
            <h3 className="text-xl font-bold mb-4" style={{ color: DHABA_THEME.colors.secondary }}>{restaurant.name}</h3>
            {restaurant.address && <p className="text-gray-400 text-sm mb-1">{restaurant.address}</p>}
            {restaurant.phone && <p className="text-gray-400 text-sm">{restaurant.phone}</p>}
            <p className="text-gray-500 text-sm mt-4">© {new Date().getFullYear()} {restaurant.name}. All rights reserved.</p>
          </div>
        </footer>

        <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
          <DialogContent className="sm:max-w-[425px] text-white" style={{ background: DHABA_THEME.colors.primary, borderColor: DHABA_THEME.colors.secondary + '40' }}>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold" style={{ color: DHABA_THEME.colors.secondary }}>Book a Table</DialogTitle>
              <DialogDescription className="text-gray-400">Reserve your table at {restaurant.name}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleBookingSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Your Name</Label>
                <Input value={bookingForm.customerName} onChange={(e) => setBookingForm({ ...bookingForm, customerName: e.target.value })} required className="bg-gray-800 border-gray-700 text-white" data-testid="input-booking-name" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Email</Label>
                  <Input type="email" value={bookingForm.email} onChange={(e) => setBookingForm({ ...bookingForm, email: e.target.value })} required className="bg-gray-800 border-gray-700 text-white" data-testid="input-booking-email" />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Phone</Label>
                  <Input type="tel" value={bookingForm.phone} onChange={(e) => setBookingForm({ ...bookingForm, phone: e.target.value })} required className="bg-gray-800 border-gray-700 text-white" data-testid="input-booking-phone" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Date</Label>
                  <Input type="date" value={bookingForm.date} onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })} required min={new Date().toISOString().split('T')[0]} className="bg-gray-800 border-gray-700 text-white" data-testid="input-booking-date" />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Time</Label>
                  <Input type="time" value={bookingForm.time} onChange={(e) => setBookingForm({ ...bookingForm, time: e.target.value })} required className="bg-gray-800 border-gray-700 text-white" data-testid="input-booking-time" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Number of Guests</Label>
                <Input type="number" min="1" max="20" value={bookingForm.guests} onChange={(e) => setBookingForm({ ...bookingForm, guests: parseInt(e.target.value) || 1 })} required className="bg-gray-800 border-gray-700 text-white" data-testid="input-booking-guests" />
              </div>
              <Button type="submit" disabled={bookingLoading} className="w-full font-bold" style={{ background: DHABA_THEME.gradient.gold, color: DHABA_THEME.colors.primary }} data-testid="button-submit-booking">
                {bookingLoading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Booking...</> : "Confirm Booking"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Spicy Flame Theme - Red/Orange Peri Peri
  if (isSpicyFlameTheme) {
    return (
      <div className="min-h-screen text-white relative" style={{ fontFamily: "'Poppins', 'Arial', sans-serif", background: SPICY_FLAME_THEME.gradient.background }}>
        <header className="py-4 px-4 sticky top-0 z-50 shadow-lg" style={{ background: SPICY_FLAME_THEME.gradient.header }}>
          <div className="container mx-auto flex justify-between items-center">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
              <img src={restaurant.logoUrl || "https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=60&h=60&fit=crop"} alt={restaurant.name} className="h-12 object-contain" data-testid="header-logo" />
              <span className="text-xl font-bold text-white hidden sm:inline">{restaurant.name}</span>
            </motion.div>
            <nav className="flex items-center gap-2 md:gap-4">
              <Button variant="ghost" className="text-white hover:bg-white/10 text-sm" onClick={() => navigate(`/menu/${slug}`)} data-testid="nav-menu">Menu</Button>
              <Button variant="ghost" className="text-white hover:bg-white/10 text-sm hidden sm:inline-flex" onClick={() => setShowBookingDialog(true)} data-testid="nav-booking">Book a Table</Button>
              <Button className="bg-white text-red-600 hover:bg-gray-100 font-bold" onClick={() => navigate(`/menu/${slug}`)} data-testid="button-order-now">Order Now</Button>
            </nav>
          </div>
        </header>
        <section className="relative h-[500px] md:h-[600px] overflow-hidden">
          <div className="absolute inset-0">
            {heroImages.length > 0 ? (<HeroCarousel images={heroImages} effect={(restaurant.heroAnimationStyle as any) || "slide"} interval={restaurant.heroSlideInterval || 5000} fallbackImage="https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=1400&h=600&fit=crop" gradientStart="#dc2626" gradientMiddle="#ea580c" gradientEnd="#f97316" />) : (<img src={restaurant.welcomeImageUrl || "https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=1400&h=600&fit=crop"} alt={restaurant.name} className="w-full h-full object-cover" />)}
            <div className="absolute inset-0 bg-gradient-to-b from-red-900/60 via-orange-800/40 to-black/70"></div>
          </div>
          <div className="relative z-10 h-full flex flex-col items-center justify-center px-4">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-center max-w-3xl">
              {promotion?.isActive && <Badge className="mb-4 text-sm px-4 py-1 bg-white text-red-600 font-bold">🔥 {promotion.headline}</Badge>}
              <h1 className="text-5xl md:text-7xl font-bold mb-4 text-white">{restaurant.name}</h1>
              <p className="text-xl text-red-100 mb-8">Flame-Grilled Peri Peri Perfection</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-white text-red-600 hover:bg-gray-100 font-bold text-lg px-10 py-6 rounded-xl shadow-lg" onClick={() => navigate(`/menu/${slug}`)} data-testid="button-deliver">🔥 Order Delivery</Button>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/20 font-bold text-lg px-10 py-6 rounded-xl" onClick={() => navigate(`/menu/${slug}`)} data-testid="button-collect">🛍️ Collection</Button>
              </div>
            </motion.div>
          </div>
        </section>
        <section className="py-16 px-4" style={{ background: SPICY_FLAME_THEME.colors.cream }}>
          <div className="container mx-auto text-center">
            <h2 className="text-3xl font-bold text-red-600 mb-8">Welcome to {restaurant.name}</h2>
            <p className="text-gray-600 max-w-2xl mx-auto mb-8">Experience the heat! Our flame-grilled chicken is marinated in authentic Peri Peri sauce, bringing you the bold flavors you crave.</p>
            <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white" onClick={() => navigate(`/menu/${slug}`)}>View Our Menu</Button>
          </div>
        </section>
        {/* Hours & Location */}
        <section className="py-16 px-4" style={{ background: SPICY_FLAME_THEME.gradient.background }}>
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center mb-10 text-orange-400">Visit Us</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="rounded-2xl p-8 bg-red-900/40">
                <h3 className="text-2xl font-bold mb-6 text-orange-400">Find Us</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <MapPin className="h-6 w-6 flex-shrink-0 mt-1 text-orange-400" />
                    <div>
                      <p className="text-white font-medium">Address</p>
                      <p className="text-gray-300">{restaurant.address || "Address not set"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <Phone className="h-6 w-6 flex-shrink-0 mt-1 text-orange-400" />
                    <div>
                      <p className="text-white font-medium">Phone</p>
                      <p className="text-gray-300">{restaurant.phone || "Contact us"}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl p-8 bg-red-900/40">
                <h3 className="text-2xl font-bold mb-6 text-orange-400">Opening Hours</h3>
                <div className="space-y-3">
                  <div className="flex justify-between"><span className="text-white">Mon - Thu</span><span className="text-orange-400">{restaurant.deliveryHoursMonThu || "12PM - 10:30PM"}</span></div>
                  <div className="flex justify-between"><span className="text-white">Fri - Sat</span><span className="text-orange-400">{restaurant.deliveryHoursFriSat || "12PM - 11:30PM"}</span></div>
                  <div className="flex justify-between"><span className="text-white">Sunday</span><span className="text-orange-400">{restaurant.deliveryHoursSun || "12PM - 10:30PM"}</span></div>
                </div>
              </div>
              <div className="rounded-2xl overflow-hidden bg-red-900/40">
                <h3 className="text-xl font-bold p-4 pb-2 text-orange-400">Our Location</h3>
                <div className="h-48 md:h-56">
                  {(restaurant as any).mapEmbedUrl ? (
                    <iframe src={(restaurant as any).mapEmbedUrl} width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" title={`${restaurant.name} Location`} />
                  ) : (
                    <div className="h-full flex items-center justify-center p-4">
                      <div className="text-center">
                        <MapPin className="h-8 w-8 mx-auto mb-2 text-orange-400" />
                        <p className="text-gray-300 text-sm">{restaurant.address || "Visit us today!"}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* Bottom CTA */}
        <section className="py-12 px-4 bg-red-900 text-center">
          <div className="container mx-auto">
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-4">
              <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg px-10 py-6 rounded-xl" onClick={() => navigate(`/menu/${slug}`)}>🚗 Order Delivery</Button>
              <Button size="lg" variant="outline" className="border-orange-400 text-orange-400 hover:bg-orange-500/20 font-bold text-lg px-10 py-6 rounded-xl" onClick={() => setShowBookingDialog(true)}>📅 Book a Table</Button>
            </div>
            {restaurant.phone && <p className="text-red-200 text-sm">Or call us: {restaurant.phone}</p>}
          </div>
        </section>
        <footer className="py-12 px-4 bg-red-900 text-white">
          <div className="container mx-auto text-center">
            <p className="font-bold text-xl mb-2">{restaurant.name}</p>
            {restaurant.address && <p className="text-red-200 text-sm mb-1">{restaurant.address}</p>}
            {restaurant.phone && <p className="text-red-200 text-sm">{restaurant.phone}</p>}
            <p className="text-red-300 text-sm mt-4">© {new Date().getFullYear()} {restaurant.name}. All rights reserved.</p>
          </div>
        </footer>
        <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
          <DialogContent className="sm:max-w-[425px] bg-red-900 border-red-500/30 text-white">
            <DialogHeader><DialogTitle className="text-2xl font-bold text-white">Book a Table</DialogTitle><DialogDescription className="text-red-200">Reserve your table at {restaurant.name}</DialogDescription></DialogHeader>
            <form onSubmit={handleBookingSubmit} className="space-y-4 mt-4">
              <div className="space-y-2"><Label className="text-red-100">Your Name</Label><Input value={bookingForm.customerName} onChange={(e) => setBookingForm({ ...bookingForm, customerName: e.target.value })} required className="bg-red-800 border-red-700 text-white" data-testid="input-booking-name" /></div>
              <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label className="text-red-100">Email</Label><Input type="email" value={bookingForm.email} onChange={(e) => setBookingForm({ ...bookingForm, email: e.target.value })} required className="bg-red-800 border-red-700 text-white" data-testid="input-booking-email" /></div><div className="space-y-2"><Label className="text-red-100">Phone</Label><Input type="tel" value={bookingForm.phone} onChange={(e) => setBookingForm({ ...bookingForm, phone: e.target.value })} required className="bg-red-800 border-red-700 text-white" data-testid="input-booking-phone" /></div></div>
              <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label className="text-red-100">Date</Label><Input type="date" value={bookingForm.date} onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })} required min={new Date().toISOString().split('T')[0]} className="bg-red-800 border-red-700 text-white" data-testid="input-booking-date" /></div><div className="space-y-2"><Label className="text-red-100">Time</Label><Input type="time" value={bookingForm.time} onChange={(e) => setBookingForm({ ...bookingForm, time: e.target.value })} required className="bg-red-800 border-red-700 text-white" data-testid="input-booking-time" /></div></div>
              <div className="space-y-2"><Label className="text-red-100">Number of Guests</Label><Input type="number" min="1" max="20" value={bookingForm.guests} onChange={(e) => setBookingForm({ ...bookingForm, guests: parseInt(e.target.value) || 1 })} required className="bg-red-800 border-red-700 text-white" data-testid="input-booking-guests" /></div>
              <Button type="submit" disabled={bookingLoading} className="w-full bg-white text-red-600 hover:bg-gray-100 font-bold" data-testid="button-submit-booking">{bookingLoading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Booking...</> : "Confirm Booking"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Midnight Blue Theme - Deep Blue Professional
  if (isMidnightBlueTheme) {
    return (
      <div className="min-h-screen text-white relative" style={{ fontFamily: "'Poppins', 'Arial', sans-serif", background: MIDNIGHT_BLUE_THEME.gradient.background }}>
        <header className="py-4 px-4 sticky top-0 z-50 shadow-lg" style={{ background: MIDNIGHT_BLUE_THEME.gradient.header }}>
          <div className="container mx-auto flex justify-between items-center">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
              <img src={restaurant.logoUrl || "https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=60&h=60&fit=crop"} alt={restaurant.name} className="h-12 object-contain" data-testid="header-logo" />
              <span className="text-xl font-bold text-white hidden sm:inline">{restaurant.name}</span>
            </motion.div>
            <nav className="flex items-center gap-2 md:gap-4">
              <Button variant="ghost" className="text-white hover:bg-white/10 text-sm" onClick={() => navigate(`/menu/${slug}`)} data-testid="nav-menu">Menu</Button>
              <Button variant="ghost" className="text-white hover:bg-white/10 text-sm hidden sm:inline-flex" onClick={() => setShowBookingDialog(true)} data-testid="nav-booking">Book a Table</Button>
              <Button className="bg-white text-blue-700 hover:bg-gray-100 font-bold" onClick={() => navigate(`/menu/${slug}`)} data-testid="button-order-now">Order Now</Button>
            </nav>
          </div>
        </header>
        <section className="relative h-[500px] md:h-[600px] overflow-hidden">
          <div className="absolute inset-0">
            {heroImages.length > 0 ? (<HeroCarousel images={heroImages} effect={(restaurant.heroAnimationStyle as any) || "slide"} interval={restaurant.heroSlideInterval || 5000} fallbackImage="https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=1400&h=600&fit=crop" gradientStart="#1e3a8a" gradientMiddle="#3b82f6" gradientEnd="#60a5fa" />) : (<img src={restaurant.welcomeImageUrl || "https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=1400&h=600&fit=crop"} alt={restaurant.name} className="w-full h-full object-cover" />)}
            <div className="absolute inset-0 bg-gradient-to-b from-blue-900/70 via-blue-800/50 to-slate-900/80"></div>
          </div>
          <div className="relative z-10 h-full flex flex-col items-center justify-center px-4">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-center max-w-3xl">
              {promotion?.isActive && <Badge className="mb-4 text-sm px-4 py-1 bg-blue-500 text-white font-bold">{promotion.headline}</Badge>}
              <h1 className="text-5xl md:text-7xl font-bold mb-4 text-white">{restaurant.name}</h1>
              <p className="text-xl text-blue-100 mb-8">Premium Flame-Grilled Cuisine</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-blue-500 hover:bg-blue-600 text-white font-bold text-lg px-10 py-6 rounded-xl shadow-lg" onClick={() => navigate(`/menu/${slug}`)} data-testid="button-deliver">🚗 Order Delivery</Button>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/20 font-bold text-lg px-10 py-6 rounded-xl" onClick={() => navigate(`/menu/${slug}`)} data-testid="button-collect">🛍️ Collection</Button>
              </div>
            </motion.div>
          </div>
        </section>
        <section className="py-16 px-4" style={{ background: MIDNIGHT_BLUE_THEME.colors.cream }}>
          <div className="container mx-auto text-center">
            <h2 className="text-3xl font-bold text-blue-800 mb-8">Welcome to {restaurant.name}</h2>
            <p className="text-gray-600 max-w-2xl mx-auto mb-8">Experience premium flame-grilled chicken with our signature marinades and fresh ingredients.</p>
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => navigate(`/menu/${slug}`)}>View Our Menu</Button>
          </div>
        </section>
        {/* Hours & Location */}
        <section className="py-16 px-4 bg-slate-800">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center mb-10 text-blue-400">Visit Us</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="rounded-2xl p-8 bg-slate-900">
                <h3 className="text-2xl font-bold mb-6 text-blue-400">Find Us</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <MapPin className="h-6 w-6 flex-shrink-0 mt-1 text-blue-400" />
                    <div>
                      <p className="text-white font-medium">Address</p>
                      <p className="text-gray-300">{restaurant.address || "Address not set"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <Phone className="h-6 w-6 flex-shrink-0 mt-1 text-blue-400" />
                    <div>
                      <p className="text-white font-medium">Phone</p>
                      <p className="text-gray-300">{restaurant.phone || "Contact us"}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl p-8 bg-slate-900">
                <h3 className="text-2xl font-bold mb-6 text-blue-400">Opening Hours</h3>
                <div className="space-y-3">
                  <div className="flex justify-between"><span className="text-white">Mon - Thu</span><span className="text-blue-400">{restaurant.deliveryHoursMonThu || "12PM - 10:30PM"}</span></div>
                  <div className="flex justify-between"><span className="text-white">Fri - Sat</span><span className="text-blue-400">{restaurant.deliveryHoursFriSat || "12PM - 11:30PM"}</span></div>
                  <div className="flex justify-between"><span className="text-white">Sunday</span><span className="text-blue-400">{restaurant.deliveryHoursSun || "12PM - 10:30PM"}</span></div>
                </div>
              </div>
              <div className="rounded-2xl overflow-hidden bg-slate-900">
                <h3 className="text-xl font-bold p-4 pb-2 text-blue-400">Our Location</h3>
                <div className="h-48 md:h-56">
                  {(restaurant as any).mapEmbedUrl ? (
                    <iframe src={(restaurant as any).mapEmbedUrl} width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" title={`${restaurant.name} Location`} />
                  ) : (
                    <div className="h-full flex items-center justify-center p-4">
                      <div className="text-center">
                        <MapPin className="h-8 w-8 mx-auto mb-2 text-blue-400" />
                        <p className="text-gray-300 text-sm">{restaurant.address || "Visit us today!"}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* Bottom CTA */}
        <section className="py-12 px-4 bg-slate-900 text-center">
          <div className="container mx-auto">
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-4">
              <Button size="lg" className="bg-blue-500 hover:bg-blue-600 text-white font-bold text-lg px-10 py-6 rounded-xl" onClick={() => navigate(`/menu/${slug}`)}>🚗 Order Delivery</Button>
              <Button size="lg" variant="outline" className="border-blue-400 text-blue-400 hover:bg-blue-500/20 font-bold text-lg px-10 py-6 rounded-xl" onClick={() => setShowBookingDialog(true)}>📅 Book a Table</Button>
            </div>
            {restaurant.phone && <p className="text-gray-400 text-sm">Or call us: {restaurant.phone}</p>}
          </div>
        </section>
        <footer className="py-12 px-4 bg-slate-900 text-white">
          <div className="container mx-auto text-center">
            <p className="font-bold text-xl mb-2 text-blue-400">{restaurant.name}</p>
            {restaurant.address && <p className="text-gray-400 text-sm mb-1">{restaurant.address}</p>}
            {restaurant.phone && <p className="text-gray-400 text-sm">{restaurant.phone}</p>}
            <p className="text-gray-500 text-sm mt-4">© {new Date().getFullYear()} {restaurant.name}. All rights reserved.</p>
          </div>
        </footer>
        <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
          <DialogContent className="sm:max-w-[425px] bg-slate-900 border-blue-500/30 text-white">
            <DialogHeader><DialogTitle className="text-2xl font-bold text-blue-400">Book a Table</DialogTitle><DialogDescription className="text-gray-400">Reserve your table at {restaurant.name}</DialogDescription></DialogHeader>
            <form onSubmit={handleBookingSubmit} className="space-y-4 mt-4">
              <div className="space-y-2"><Label className="text-gray-300">Your Name</Label><Input value={bookingForm.customerName} onChange={(e) => setBookingForm({ ...bookingForm, customerName: e.target.value })} required className="bg-slate-800 border-slate-700 text-white" data-testid="input-booking-name" /></div>
              <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label className="text-gray-300">Email</Label><Input type="email" value={bookingForm.email} onChange={(e) => setBookingForm({ ...bookingForm, email: e.target.value })} required className="bg-slate-800 border-slate-700 text-white" data-testid="input-booking-email" /></div><div className="space-y-2"><Label className="text-gray-300">Phone</Label><Input type="tel" value={bookingForm.phone} onChange={(e) => setBookingForm({ ...bookingForm, phone: e.target.value })} required className="bg-slate-800 border-slate-700 text-white" data-testid="input-booking-phone" /></div></div>
              <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label className="text-gray-300">Date</Label><Input type="date" value={bookingForm.date} onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })} required min={new Date().toISOString().split('T')[0]} className="bg-slate-800 border-slate-700 text-white" data-testid="input-booking-date" /></div><div className="space-y-2"><Label className="text-gray-300">Time</Label><Input type="time" value={bookingForm.time} onChange={(e) => setBookingForm({ ...bookingForm, time: e.target.value })} required className="bg-slate-800 border-slate-700 text-white" data-testid="input-booking-time" /></div></div>
              <div className="space-y-2"><Label className="text-gray-300">Number of Guests</Label><Input type="number" min="1" max="20" value={bookingForm.guests} onChange={(e) => setBookingForm({ ...bookingForm, guests: parseInt(e.target.value) || 1 })} required className="bg-slate-800 border-slate-700 text-white" data-testid="input-booking-guests" /></div>
              <Button type="submit" disabled={bookingLoading} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold" data-testid="button-submit-booking">{bookingLoading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Booking...</> : "Confirm Booking"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Sunset Orange Theme - Warm Orange Tones
  if (isSunsetOrangeTheme) {
    return (
      <div className="min-h-screen text-white relative" style={{ fontFamily: "'Poppins', 'Arial', sans-serif", background: SUNSET_ORANGE_THEME.gradient.background }}>
        <header className="py-4 px-4 sticky top-0 z-50 shadow-lg" style={{ background: SUNSET_ORANGE_THEME.gradient.header }}>
          <div className="container mx-auto flex justify-between items-center">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
              <img src={restaurant.logoUrl || "https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=60&h=60&fit=crop"} alt={restaurant.name} className="h-12 object-contain" data-testid="header-logo" />
              <span className="text-xl font-bold text-white hidden sm:inline">{restaurant.name}</span>
            </motion.div>
            <nav className="flex items-center gap-2 md:gap-4">
              <Button variant="ghost" className="text-white hover:bg-white/10 text-sm" onClick={() => navigate(`/menu/${slug}`)} data-testid="nav-menu">Menu</Button>
              <Button variant="ghost" className="text-white hover:bg-white/10 text-sm hidden sm:inline-flex" onClick={() => setShowBookingDialog(true)} data-testid="nav-booking">Book a Table</Button>
              <Button className="bg-white text-orange-600 hover:bg-gray-100 font-bold" onClick={() => navigate(`/menu/${slug}`)} data-testid="button-order-now">Order Now</Button>
            </nav>
          </div>
        </header>
        <section className="relative h-[500px] md:h-[600px] overflow-hidden">
          <div className="absolute inset-0">
            {heroImages.length > 0 ? (<HeroCarousel images={heroImages} effect={(restaurant.heroAnimationStyle as any) || "slide"} interval={restaurant.heroSlideInterval || 5000} fallbackImage="https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=1400&h=600&fit=crop" gradientStart="#ea580c" gradientMiddle="#f97316" gradientEnd="#fb923c" />) : (<img src={restaurant.welcomeImageUrl || "https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=1400&h=600&fit=crop"} alt={restaurant.name} className="w-full h-full object-cover" />)}
            <div className="absolute inset-0 bg-gradient-to-b from-orange-900/60 via-orange-700/40 to-stone-900/80"></div>
          </div>
          <div className="relative z-10 h-full flex flex-col items-center justify-center px-4">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-center max-w-3xl">
              {promotion?.isActive && <Badge className="mb-4 text-sm px-4 py-1 bg-orange-500 text-white font-bold">🌅 {promotion.headline}</Badge>}
              <h1 className="text-5xl md:text-7xl font-bold mb-4 text-white">{restaurant.name}</h1>
              <p className="text-xl text-orange-100 mb-8">Bold Flavors, Fresh Ingredients</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg px-10 py-6 rounded-xl shadow-lg" onClick={() => navigate(`/menu/${slug}`)} data-testid="button-deliver">🚗 Order Delivery</Button>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/20 font-bold text-lg px-10 py-6 rounded-xl" onClick={() => navigate(`/menu/${slug}`)} data-testid="button-collect">🛍️ Collection</Button>
              </div>
            </motion.div>
          </div>
        </section>
        <section className="py-16 px-4" style={{ background: SUNSET_ORANGE_THEME.colors.cream }}>
          <div className="container mx-auto text-center">
            <h2 className="text-3xl font-bold text-orange-700 mb-8">Welcome to {restaurant.name}</h2>
            <p className="text-gray-600 max-w-2xl mx-auto mb-8">Discover the perfect blend of spices and flame-grilled goodness in every bite.</p>
            <Button size="lg" className="bg-orange-600 hover:bg-orange-700 text-white" onClick={() => navigate(`/menu/${slug}`)}>View Our Menu</Button>
          </div>
        </section>
        {/* Hours & Location */}
        <section className="py-16 px-4 bg-stone-800">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center mb-10 text-orange-400">Visit Us</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="rounded-2xl p-8 bg-stone-900">
                <h3 className="text-2xl font-bold mb-6 text-orange-400">Find Us</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <MapPin className="h-6 w-6 flex-shrink-0 mt-1 text-orange-400" />
                    <div>
                      <p className="text-white font-medium">Address</p>
                      <p className="text-gray-300">{restaurant.address || "Address not set"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <Phone className="h-6 w-6 flex-shrink-0 mt-1 text-orange-400" />
                    <div>
                      <p className="text-white font-medium">Phone</p>
                      <p className="text-gray-300">{restaurant.phone || "Contact us"}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl p-8 bg-stone-900">
                <h3 className="text-2xl font-bold mb-6 text-orange-400">Opening Hours</h3>
                <div className="space-y-3">
                  <div className="flex justify-between"><span className="text-white">Mon - Thu</span><span className="text-orange-400">{restaurant.deliveryHoursMonThu || "12PM - 10:30PM"}</span></div>
                  <div className="flex justify-between"><span className="text-white">Fri - Sat</span><span className="text-orange-400">{restaurant.deliveryHoursFriSat || "12PM - 11:30PM"}</span></div>
                  <div className="flex justify-between"><span className="text-white">Sunday</span><span className="text-orange-400">{restaurant.deliveryHoursSun || "12PM - 10:30PM"}</span></div>
                </div>
              </div>
              <div className="rounded-2xl overflow-hidden bg-stone-900">
                <h3 className="text-xl font-bold p-4 pb-2 text-orange-400">Our Location</h3>
                <div className="h-48 md:h-56">
                  {(restaurant as any).mapEmbedUrl ? (
                    <iframe src={(restaurant as any).mapEmbedUrl} width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" title={`${restaurant.name} Location`} />
                  ) : (
                    <div className="h-full flex items-center justify-center p-4">
                      <div className="text-center">
                        <MapPin className="h-8 w-8 mx-auto mb-2 text-orange-400" />
                        <p className="text-gray-300 text-sm">{restaurant.address || "Visit us today!"}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* Bottom CTA */}
        <section className="py-12 px-4 bg-stone-900 text-center">
          <div className="container mx-auto">
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-4">
              <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg px-10 py-6 rounded-xl" onClick={() => navigate(`/menu/${slug}`)}>🚗 Order Delivery</Button>
              <Button size="lg" variant="outline" className="border-orange-400 text-orange-400 hover:bg-orange-500/20 font-bold text-lg px-10 py-6 rounded-xl" onClick={() => setShowBookingDialog(true)}>📅 Book a Table</Button>
            </div>
            {restaurant.phone && <p className="text-gray-400 text-sm">Or call us: {restaurant.phone}</p>}
          </div>
        </section>
        <footer className="py-12 px-4 bg-stone-900 text-white">
          <div className="container mx-auto text-center">
            <p className="font-bold text-xl mb-2 text-orange-400">{restaurant.name}</p>
            {restaurant.address && <p className="text-gray-400 text-sm mb-1">{restaurant.address}</p>}
            {restaurant.phone && <p className="text-gray-400 text-sm">{restaurant.phone}</p>}
            <p className="text-gray-500 text-sm mt-4">© {new Date().getFullYear()} {restaurant.name}. All rights reserved.</p>
          </div>
        </footer>
        <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
          <DialogContent className="sm:max-w-[425px] bg-stone-900 border-orange-500/30 text-white">
            <DialogHeader><DialogTitle className="text-2xl font-bold text-orange-400">Book a Table</DialogTitle><DialogDescription className="text-gray-400">Reserve your table at {restaurant.name}</DialogDescription></DialogHeader>
            <form onSubmit={handleBookingSubmit} className="space-y-4 mt-4">
              <div className="space-y-2"><Label className="text-gray-300">Your Name</Label><Input value={bookingForm.customerName} onChange={(e) => setBookingForm({ ...bookingForm, customerName: e.target.value })} required className="bg-stone-800 border-stone-700 text-white" data-testid="input-booking-name" /></div>
              <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label className="text-gray-300">Email</Label><Input type="email" value={bookingForm.email} onChange={(e) => setBookingForm({ ...bookingForm, email: e.target.value })} required className="bg-stone-800 border-stone-700 text-white" data-testid="input-booking-email" /></div><div className="space-y-2"><Label className="text-gray-300">Phone</Label><Input type="tel" value={bookingForm.phone} onChange={(e) => setBookingForm({ ...bookingForm, phone: e.target.value })} required className="bg-stone-800 border-stone-700 text-white" data-testid="input-booking-phone" /></div></div>
              <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label className="text-gray-300">Date</Label><Input type="date" value={bookingForm.date} onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })} required min={new Date().toISOString().split('T')[0]} className="bg-stone-800 border-stone-700 text-white" data-testid="input-booking-date" /></div><div className="space-y-2"><Label className="text-gray-300">Time</Label><Input type="time" value={bookingForm.time} onChange={(e) => setBookingForm({ ...bookingForm, time: e.target.value })} required className="bg-stone-800 border-stone-700 text-white" data-testid="input-booking-time" /></div></div>
              <div className="space-y-2"><Label className="text-gray-300">Number of Guests</Label><Input type="number" min="1" max="20" value={bookingForm.guests} onChange={(e) => setBookingForm({ ...bookingForm, guests: parseInt(e.target.value) || 1 })} required className="bg-stone-800 border-stone-700 text-white" data-testid="input-booking-guests" /></div>
              <Button type="submit" disabled={bookingLoading} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold" data-testid="button-submit-booking">{bookingLoading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Booking...</> : "Confirm Booking"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Fresh Green Theme - Vibrant Green
  if (isFreshGreenTheme) {
    return (
      <div className="min-h-screen text-white relative" style={{ fontFamily: "'Poppins', 'Arial', sans-serif", background: FRESH_GREEN_THEME.gradient.background }}>
        <header className="py-4 px-4 sticky top-0 z-50 shadow-lg" style={{ background: FRESH_GREEN_THEME.gradient.header }}>
          <div className="container mx-auto flex justify-between items-center">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
              <img src={restaurant.logoUrl || "https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=60&h=60&fit=crop"} alt={restaurant.name} className="h-12 object-contain" data-testid="header-logo" />
              <span className="text-xl font-bold text-white hidden sm:inline">{restaurant.name}</span>
            </motion.div>
            <nav className="flex items-center gap-2 md:gap-4">
              <Button variant="ghost" className="text-white hover:bg-white/10 text-sm" onClick={() => navigate(`/menu/${slug}`)} data-testid="nav-menu">Menu</Button>
              <Button variant="ghost" className="text-white hover:bg-white/10 text-sm hidden sm:inline-flex" onClick={() => setShowBookingDialog(true)} data-testid="nav-booking">Book a Table</Button>
              <Button className="bg-white text-green-700 hover:bg-gray-100 font-bold" onClick={() => navigate(`/menu/${slug}`)} data-testid="button-order-now">Order Now</Button>
            </nav>
          </div>
        </header>
        <section className="relative h-[500px] md:h-[600px] overflow-hidden">
          <div className="absolute inset-0">
            {heroImages.length > 0 ? (<HeroCarousel images={heroImages} effect={(restaurant.heroAnimationStyle as any) || "slide"} interval={restaurant.heroSlideInterval || 5000} fallbackImage="https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=1400&h=600&fit=crop" gradientStart="#15803d" gradientMiddle="#22c55e" gradientEnd="#4ade80" />) : (<img src={restaurant.welcomeImageUrl || "https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=1400&h=600&fit=crop"} alt={restaurant.name} className="w-full h-full object-cover" />)}
            <div className="absolute inset-0 bg-gradient-to-b from-green-900/60 via-green-700/40 to-green-950/80"></div>
          </div>
          <div className="relative z-10 h-full flex flex-col items-center justify-center px-4">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-center max-w-3xl">
              {promotion?.isActive && <Badge className="mb-4 text-sm px-4 py-1 bg-green-500 text-white font-bold">🌿 {promotion.headline}</Badge>}
              <h1 className="text-5xl md:text-7xl font-bold mb-4 text-white">{restaurant.name}</h1>
              <p className="text-xl text-green-100 mb-8">Fresh, Healthy & Delicious</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-green-500 hover:bg-green-600 text-white font-bold text-lg px-10 py-6 rounded-xl shadow-lg" onClick={() => navigate(`/menu/${slug}`)} data-testid="button-deliver">🚗 Order Delivery</Button>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/20 font-bold text-lg px-10 py-6 rounded-xl" onClick={() => navigate(`/menu/${slug}`)} data-testid="button-collect">🛍️ Collection</Button>
              </div>
            </motion.div>
          </div>
        </section>
        <section className="py-16 px-4" style={{ background: FRESH_GREEN_THEME.colors.cream }}>
          <div className="container mx-auto text-center">
            <h2 className="text-3xl font-bold text-green-700 mb-8">Welcome to {restaurant.name}</h2>
            <p className="text-gray-600 max-w-2xl mx-auto mb-8">Experience fresh, quality ingredients combined with our signature flame-grilled cooking.</p>
            <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => navigate(`/menu/${slug}`)}>View Our Menu</Button>
          </div>
        </section>
        {/* Hours & Location */}
        <section className="py-16 px-4 bg-green-950">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center mb-10 text-green-400">Visit Us</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="rounded-2xl p-8 bg-green-900/50">
                <h3 className="text-2xl font-bold mb-6 text-green-400">Find Us</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <MapPin className="h-6 w-6 flex-shrink-0 mt-1 text-green-400" />
                    <div>
                      <p className="text-white font-medium">Address</p>
                      <p className="text-gray-300">{restaurant.address || "Address not set"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <Phone className="h-6 w-6 flex-shrink-0 mt-1 text-green-400" />
                    <div>
                      <p className="text-white font-medium">Phone</p>
                      <p className="text-gray-300">{restaurant.phone || "Contact us"}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl p-8 bg-green-900/50">
                <h3 className="text-2xl font-bold mb-6 text-green-400">Opening Hours</h3>
                <div className="space-y-3">
                  <div className="flex justify-between"><span className="text-white">Mon - Thu</span><span className="text-green-400">{restaurant.deliveryHoursMonThu || "12PM - 10:30PM"}</span></div>
                  <div className="flex justify-between"><span className="text-white">Fri - Sat</span><span className="text-green-400">{restaurant.deliveryHoursFriSat || "12PM - 11:30PM"}</span></div>
                  <div className="flex justify-between"><span className="text-white">Sunday</span><span className="text-green-400">{restaurant.deliveryHoursSun || "12PM - 10:30PM"}</span></div>
                </div>
              </div>
              <div className="rounded-2xl overflow-hidden bg-green-900/50">
                <h3 className="text-xl font-bold p-4 pb-2 text-green-400">Our Location</h3>
                <div className="h-48 md:h-56">
                  {(restaurant as any).mapEmbedUrl ? (
                    <iframe src={(restaurant as any).mapEmbedUrl} width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" title={`${restaurant.name} Location`} />
                  ) : (
                    <div className="h-full flex items-center justify-center p-4">
                      <div className="text-center">
                        <MapPin className="h-8 w-8 mx-auto mb-2 text-green-400" />
                        <p className="text-gray-300 text-sm">{restaurant.address || "Visit us today!"}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* Bottom CTA */}
        <section className="py-12 px-4 bg-green-900 text-center">
          <div className="container mx-auto">
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-4">
              <Button size="lg" className="bg-green-500 hover:bg-green-600 text-white font-bold text-lg px-10 py-6 rounded-xl" onClick={() => navigate(`/menu/${slug}`)}>🚗 Order Delivery</Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/20 font-bold text-lg px-10 py-6 rounded-xl" onClick={() => setShowBookingDialog(true)}>📅 Book a Table</Button>
            </div>
            {restaurant.phone && <p className="text-green-200 text-sm">Or call us: {restaurant.phone}</p>}
          </div>
        </section>
        <footer className="py-12 px-4 bg-green-950 text-white">
          <div className="container mx-auto text-center">
            <p className="font-bold text-xl mb-2 text-green-400">{restaurant.name}</p>
            {restaurant.address && <p className="text-gray-400 text-sm mb-1">{restaurant.address}</p>}
            {restaurant.phone && <p className="text-gray-400 text-sm">{restaurant.phone}</p>}
            <p className="text-gray-500 text-sm mt-4">© {new Date().getFullYear()} {restaurant.name}. All rights reserved.</p>
          </div>
        </footer>
        <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
          <DialogContent className="sm:max-w-[425px] bg-green-950 border-green-500/30 text-white">
            <DialogHeader><DialogTitle className="text-2xl font-bold text-green-400">Book a Table</DialogTitle><DialogDescription className="text-gray-400">Reserve your table at {restaurant.name}</DialogDescription></DialogHeader>
            <form onSubmit={handleBookingSubmit} className="space-y-4 mt-4">
              <div className="space-y-2"><Label className="text-gray-300">Your Name</Label><Input value={bookingForm.customerName} onChange={(e) => setBookingForm({ ...bookingForm, customerName: e.target.value })} required className="bg-green-900 border-green-800 text-white" data-testid="input-booking-name" /></div>
              <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label className="text-gray-300">Email</Label><Input type="email" value={bookingForm.email} onChange={(e) => setBookingForm({ ...bookingForm, email: e.target.value })} required className="bg-green-900 border-green-800 text-white" data-testid="input-booking-email" /></div><div className="space-y-2"><Label className="text-gray-300">Phone</Label><Input type="tel" value={bookingForm.phone} onChange={(e) => setBookingForm({ ...bookingForm, phone: e.target.value })} required className="bg-green-900 border-green-800 text-white" data-testid="input-booking-phone" /></div></div>
              <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label className="text-gray-300">Date</Label><Input type="date" value={bookingForm.date} onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })} required min={new Date().toISOString().split('T')[0]} className="bg-green-900 border-green-800 text-white" data-testid="input-booking-date" /></div><div className="space-y-2"><Label className="text-gray-300">Time</Label><Input type="time" value={bookingForm.time} onChange={(e) => setBookingForm({ ...bookingForm, time: e.target.value })} required className="bg-green-900 border-green-800 text-white" data-testid="input-booking-time" /></div></div>
              <div className="space-y-2"><Label className="text-gray-300">Number of Guests</Label><Input type="number" min="1" max="20" value={bookingForm.guests} onChange={(e) => setBookingForm({ ...bookingForm, guests: parseInt(e.target.value) || 1 })} required className="bg-green-900 border-green-800 text-white" data-testid="input-booking-guests" /></div>
              <Button type="submit" disabled={bookingLoading} className="w-full bg-green-500 hover:bg-green-600 text-white font-bold" data-testid="button-submit-booking">{bookingLoading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Booking...</> : "Confirm Booking"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Classic Red Theme - Traditional Red
  if (isClassicRedTheme) {
    const bgType = restaurant.welcomeBackgroundType || 'gradient';
    const gifUrl = restaurant.welcomeBackgroundGifUrl;
    
    return (
      <div className="min-h-screen text-white relative" style={{ fontFamily: "'Poppins', 'Arial', sans-serif", background: CLASSIC_RED_THEME.gradient.background }}>
        {/* GIF Background when set */}
        {bgType === 'gif' && gifUrl && (
          <div className="fixed inset-0 z-0">
            <img src={gifUrl} alt="Background" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-red-900/70 via-red-800/50 to-black/90"></div>
          </div>
        )}
        <header className="py-4 px-4 sticky top-0 z-50 shadow-lg" style={{ background: CLASSIC_RED_THEME.gradient.header }}>
          <div className="container mx-auto flex justify-between items-center">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
              <img src={restaurant.logoUrl || "https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=60&h=60&fit=crop"} alt={restaurant.name} className="h-12 object-contain" data-testid="header-logo" />
              <span className="text-xl font-bold text-white hidden sm:inline">{restaurant.name}</span>
            </motion.div>
            <nav className="flex items-center gap-2 md:gap-4">
              <Button variant="ghost" className="text-white hover:bg-white/10 text-sm" onClick={() => navigate(`/menu/${slug}`)} data-testid="nav-menu">Menu</Button>
              <Button variant="ghost" className="text-white hover:bg-white/10 text-sm hidden sm:inline-flex" onClick={() => setShowBookingDialog(true)} data-testid="nav-booking">Book a Table</Button>
              <Button className="bg-white text-red-600 hover:bg-gray-100 font-bold" onClick={() => navigate(`/menu/${slug}`)} data-testid="button-order-now">Order Now</Button>
            </nav>
          </div>
        </header>
        <section className="relative h-[500px] md:h-[600px] overflow-hidden">
          <div className="absolute inset-0">
            {bgType === 'gif' && gifUrl ? (
              <>
                <img src={gifUrl} alt="Background" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-b from-red-900/70 via-red-800/50 to-black/80"></div>
              </>
            ) : heroImages.length > 0 ? (<HeroCarousel images={heroImages} effect={(restaurant.heroAnimationStyle as any) || "slide"} interval={restaurant.heroSlideInterval || 5000} fallbackImage="https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=1400&h=600&fit=crop" gradientStart="#b91c1c" gradientMiddle="#dc2626" gradientEnd="#ef4444" />) : (<img src={restaurant.welcomeImageUrl || "https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=1400&h=600&fit=crop"} alt={restaurant.name} className="w-full h-full object-cover" />)}
            {bgType !== 'gif' && <div className="absolute inset-0 bg-gradient-to-b from-red-900/70 via-red-800/50 to-black/80"></div>}
          </div>
          <div className="relative z-10 h-full flex flex-col items-center justify-center px-4">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-center max-w-3xl">
              {promotion?.isActive && <Badge className="mb-4 text-sm px-4 py-1 bg-white text-red-600 font-bold">{promotion.headline}</Badge>}
              <h1 className="text-5xl md:text-7xl font-bold mb-4 text-white">{restaurant.name}</h1>
              <p className="text-xl text-red-100 mb-8">Authentic Flame-Grilled Flavors</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-white text-red-600 hover:bg-gray-100 font-bold text-lg px-10 py-6 rounded-xl shadow-lg" onClick={() => navigate(`/menu/${slug}`)} data-testid="button-deliver">🚗 Order Delivery</Button>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/20 font-bold text-lg px-10 py-6 rounded-xl" onClick={() => navigate(`/menu/${slug}`)} data-testid="button-collect">🛍️ Collection</Button>
              </div>
            </motion.div>
          </div>
        </section>
        <section className="py-16 px-4" style={{ background: CLASSIC_RED_THEME.colors.cream }}>
          <div className="container mx-auto text-center">
            <h2 className="text-3xl font-bold text-red-700 mb-8">Welcome to {restaurant.name}</h2>
            <p className="text-gray-600 max-w-2xl mx-auto mb-8">Experience our classic flame-grilled chicken with authentic recipes and bold flavors.</p>
            <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white" onClick={() => navigate(`/menu/${slug}`)}>View Our Menu</Button>
          </div>
        </section>
        {/* Hours & Location */}
        <section className="py-16 px-4 bg-red-950">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center mb-10 text-red-400">Visit Us</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="rounded-2xl p-8 bg-red-900/50">
                <h3 className="text-2xl font-bold mb-6 text-red-400">Find Us</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <MapPin className="h-6 w-6 flex-shrink-0 mt-1 text-red-400" />
                    <div>
                      <p className="text-white font-medium">Address</p>
                      <p className="text-gray-300">{restaurant.address || "Address not set"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <Phone className="h-6 w-6 flex-shrink-0 mt-1 text-red-400" />
                    <div>
                      <p className="text-white font-medium">Phone</p>
                      <p className="text-gray-300">{restaurant.phone || "Contact us"}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl p-8 bg-red-900/50">
                <h3 className="text-2xl font-bold mb-6 text-red-400">Opening Hours</h3>
                <div className="space-y-3">
                  <div className="flex justify-between"><span className="text-white">Mon - Thu</span><span className="text-red-400">{restaurant.deliveryHoursMonThu || "12PM - 10:30PM"}</span></div>
                  <div className="flex justify-between"><span className="text-white">Fri - Sat</span><span className="text-red-400">{restaurant.deliveryHoursFriSat || "12PM - 11:30PM"}</span></div>
                  <div className="flex justify-between"><span className="text-white">Sunday</span><span className="text-red-400">{restaurant.deliveryHoursSun || "12PM - 10:30PM"}</span></div>
                </div>
              </div>
              <div className="rounded-2xl overflow-hidden bg-red-900/50">
                <h3 className="text-xl font-bold p-4 pb-2 text-red-400">Our Location</h3>
                <div className="h-48 md:h-56">
                  {(restaurant as any).mapEmbedUrl ? (
                    <iframe src={(restaurant as any).mapEmbedUrl} width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" title={`${restaurant.name} Location`} />
                  ) : (
                    <div className="h-full flex items-center justify-center p-4">
                      <div className="text-center">
                        <MapPin className="h-8 w-8 mx-auto mb-2 text-red-400" />
                        <p className="text-gray-300 text-sm">{restaurant.address || "Visit us today!"}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* Bottom CTA */}
        <section className="py-12 px-4 bg-red-900 text-center">
          <div className="container mx-auto">
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-4">
              <Button size="lg" className="bg-white text-red-600 hover:bg-gray-100 font-bold text-lg px-10 py-6 rounded-xl" onClick={() => navigate(`/menu/${slug}`)}>🚗 Order Delivery</Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/20 font-bold text-lg px-10 py-6 rounded-xl" onClick={() => setShowBookingDialog(true)}>📅 Book a Table</Button>
            </div>
            {restaurant.phone && <p className="text-red-200 text-sm">Or call us: {restaurant.phone}</p>}
          </div>
        </section>
        <footer className="py-12 px-4 bg-red-950 text-white">
          <div className="container mx-auto text-center">
            <p className="font-bold text-xl mb-2 text-red-400">{restaurant.name}</p>
            {restaurant.address && <p className="text-gray-400 text-sm mb-1">{restaurant.address}</p>}
            {restaurant.phone && <p className="text-gray-400 text-sm">{restaurant.phone}</p>}
            <p className="text-gray-500 text-sm mt-4">© {new Date().getFullYear()} {restaurant.name}. All rights reserved.</p>
          </div>
        </footer>
        <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
          <DialogContent className="sm:max-w-[425px] bg-red-950 border-red-500/30 text-white">
            <DialogHeader><DialogTitle className="text-2xl font-bold text-red-400">Book a Table</DialogTitle><DialogDescription className="text-gray-400">Reserve your table at {restaurant.name}</DialogDescription></DialogHeader>
            <form onSubmit={handleBookingSubmit} className="space-y-4 mt-4">
              <div className="space-y-2"><Label className="text-gray-300">Your Name</Label><Input value={bookingForm.customerName} onChange={(e) => setBookingForm({ ...bookingForm, customerName: e.target.value })} required className="bg-red-900 border-red-800 text-white" data-testid="input-booking-name" /></div>
              <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label className="text-gray-300">Email</Label><Input type="email" value={bookingForm.email} onChange={(e) => setBookingForm({ ...bookingForm, email: e.target.value })} required className="bg-red-900 border-red-800 text-white" data-testid="input-booking-email" /></div><div className="space-y-2"><Label className="text-gray-300">Phone</Label><Input type="tel" value={bookingForm.phone} onChange={(e) => setBookingForm({ ...bookingForm, phone: e.target.value })} required className="bg-red-900 border-red-800 text-white" data-testid="input-booking-phone" /></div></div>
              <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label className="text-gray-300">Date</Label><Input type="date" value={bookingForm.date} onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })} required min={new Date().toISOString().split('T')[0]} className="bg-red-900 border-red-800 text-white" data-testid="input-booking-date" /></div><div className="space-y-2"><Label className="text-gray-300">Time</Label><Input type="time" value={bookingForm.time} onChange={(e) => setBookingForm({ ...bookingForm, time: e.target.value })} required className="bg-red-900 border-red-800 text-white" data-testid="input-booking-time" /></div></div>
              <div className="space-y-2"><Label className="text-gray-300">Number of Guests</Label><Input type="number" min="1" max="20" value={bookingForm.guests} onChange={(e) => setBookingForm({ ...bookingForm, guests: parseInt(e.target.value) || 1 })} required className="bg-red-900 border-red-800 text-white" data-testid="input-booking-guests" /></div>
              <Button type="submit" disabled={bookingLoading} className="w-full bg-red-500 hover:bg-red-600 text-white font-bold" data-testid="button-submit-booking">{bookingLoading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Booking...</> : "Confirm Booking"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Tawa Clean Theme - Clean Modern with Gold Accents
  if (isTawaCleanTheme) {
    return (
      <div className="min-h-screen text-gray-900 relative" style={{ fontFamily: "'Poppins', 'Arial', sans-serif", background: TAWA_CLEAN_THEME.gradient.background }}>
        <header className="py-4 px-4 sticky top-0 z-50 shadow-lg" style={{ background: TAWA_CLEAN_THEME.gradient.header }}>
          <div className="container mx-auto flex justify-between items-center">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
              <img src={restaurant.logoUrl || "https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=60&h=60&fit=crop"} alt={restaurant.name} className="h-12 object-contain" data-testid="header-logo" />
              <span className="text-xl font-bold text-white hidden sm:inline">{restaurant.name}</span>
            </motion.div>
            <nav className="flex items-center gap-2 md:gap-4">
              <Button variant="ghost" className="text-white hover:bg-white/10 text-sm" onClick={() => navigate(`/menu/${slug}`)} data-testid="nav-menu">Menu</Button>
              <Button variant="ghost" className="text-white hover:bg-white/10 text-sm hidden sm:inline-flex" onClick={() => setShowBookingDialog(true)} data-testid="nav-booking">Book a Table</Button>
              <Button className="bg-amber-500 text-white hover:bg-amber-600 font-bold" onClick={() => navigate(`/menu/${slug}`)} data-testid="button-order-now">Order Now</Button>
            </nav>
          </div>
        </header>
        <section className="relative h-[500px] md:h-[600px] overflow-hidden">
          <div className="absolute inset-0">
            {heroImages.length > 0 ? (<HeroCarousel images={heroImages} effect={(restaurant.heroAnimationStyle as any) || "slide"} interval={restaurant.heroSlideInterval || 5000} fallbackImage="https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=1400&h=600&fit=crop" gradientStart="#292524" gradientMiddle="#44403c" gradientEnd="#57534e" />) : (<img src={restaurant.welcomeImageUrl || "https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=1400&h=600&fit=crop"} alt={restaurant.name} className="w-full h-full object-cover" />)}
            <div className="absolute inset-0 bg-gradient-to-b from-stone-900/70 via-stone-800/50 to-stone-900/80"></div>
          </div>
          <div className="relative z-10 h-full flex flex-col items-center justify-center px-4">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-center max-w-3xl">
              {promotion?.isActive && <Badge className="mb-4 text-sm px-4 py-1 bg-amber-500 text-white font-bold">{promotion.headline}</Badge>}
              <h1 className="text-5xl md:text-7xl font-bold mb-4 text-white">{restaurant.name}</h1>
              <p className="text-xl text-stone-200 mb-8">Authentic Indian Cuisine</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-lg px-10 py-6 rounded-xl shadow-lg" onClick={() => navigate(`/menu/${slug}`)} data-testid="button-deliver">🚗 Order Delivery</Button>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/20 font-bold text-lg px-10 py-6 rounded-xl" onClick={() => navigate(`/menu/${slug}`)} data-testid="button-collect">🛍️ Collection</Button>
              </div>
            </motion.div>
          </div>
        </section>
        <section className="py-16 px-4" style={{ background: '#fafaf9' }}>
          <div className="container mx-auto text-center">
            <h2 className="text-3xl font-bold text-stone-800 mb-8">Welcome to {restaurant.name}</h2>
            <p className="text-gray-600 max-w-2xl mx-auto mb-8">Experience the finest authentic Indian cuisine, prepared with love and tradition.</p>
            <Button size="lg" className="bg-amber-600 hover:bg-amber-700 text-white" onClick={() => navigate(`/menu/${slug}`)}>View Our Menu</Button>
          </div>
        </section>
        {/* Hours & Location */}
        <section className="py-16 px-4 bg-stone-800">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center mb-10 text-amber-500">Visit Us</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="rounded-2xl p-8 bg-stone-900">
                <h3 className="text-2xl font-bold mb-6 text-amber-500">Find Us</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <MapPin className="h-6 w-6 flex-shrink-0 mt-1 text-amber-500" />
                    <div>
                      <p className="text-white font-medium">Address</p>
                      <p className="text-gray-300">{restaurant.address || "Address not set"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <Phone className="h-6 w-6 flex-shrink-0 mt-1 text-amber-500" />
                    <div>
                      <p className="text-white font-medium">Phone</p>
                      <p className="text-gray-300">{restaurant.phone || "Contact us"}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl p-8 bg-stone-900">
                <h3 className="text-2xl font-bold mb-6 text-amber-500">Opening Hours</h3>
                <div className="space-y-3">
                  <div className="flex justify-between"><span className="text-white">Mon - Thu</span><span className="text-amber-500">{restaurant.deliveryHoursMonThu || "12PM - 10:30PM"}</span></div>
                  <div className="flex justify-between"><span className="text-white">Fri - Sat</span><span className="text-amber-500">{restaurant.deliveryHoursFriSat || "12PM - 11:30PM"}</span></div>
                  <div className="flex justify-between"><span className="text-white">Sunday</span><span className="text-amber-500">{restaurant.deliveryHoursSun || "12PM - 10:30PM"}</span></div>
                </div>
              </div>
              <div className="rounded-2xl overflow-hidden bg-stone-900">
                <h3 className="text-xl font-bold p-4 pb-2 text-amber-500">Our Location</h3>
                <div className="h-48 md:h-56">
                  {(restaurant as any).mapEmbedUrl ? (
                    <iframe src={(restaurant as any).mapEmbedUrl} width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" title={`${restaurant.name} Location`} />
                  ) : (
                    <div className="h-full flex items-center justify-center p-4">
                      <div className="text-center">
                        <MapPin className="h-8 w-8 mx-auto mb-2 text-amber-500" />
                        <p className="text-gray-300 text-sm">{restaurant.address || "Visit us today!"}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* Bottom CTA */}
        <section className="py-12 px-4 bg-stone-900 text-center">
          <div className="container mx-auto">
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-4">
              <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-lg px-10 py-6 rounded-xl" onClick={() => navigate(`/menu/${slug}`)}>🚗 Order Delivery</Button>
              <Button size="lg" variant="outline" className="border-amber-500 text-amber-500 hover:bg-amber-500/20 font-bold text-lg px-10 py-6 rounded-xl" onClick={() => setShowBookingDialog(true)}>📅 Book a Table</Button>
            </div>
            {restaurant.phone && <p className="text-gray-400 text-sm">Or call us: {restaurant.phone}</p>}
          </div>
        </section>
        <footer className="py-12 px-4 bg-stone-900 text-white">
          <div className="container mx-auto text-center">
            <p className="font-bold text-xl mb-2 text-amber-400">{restaurant.name}</p>
            {restaurant.address && <p className="text-gray-400 text-sm mb-1">{restaurant.address}</p>}
            {restaurant.phone && <p className="text-gray-400 text-sm">{restaurant.phone}</p>}
            <p className="text-gray-500 text-sm mt-4">© {new Date().getFullYear()} {restaurant.name}. All rights reserved.</p>
          </div>
        </footer>
        <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
          <DialogContent className="sm:max-w-[425px] bg-stone-900 border-amber-500/30 text-white">
            <DialogHeader><DialogTitle className="text-2xl font-bold text-amber-400">Book a Table</DialogTitle><DialogDescription className="text-gray-400">Reserve your table at {restaurant.name}</DialogDescription></DialogHeader>
            <form onSubmit={handleBookingSubmit} className="space-y-4 mt-4">
              <div className="space-y-2"><Label className="text-gray-300">Your Name</Label><Input value={bookingForm.customerName} onChange={(e) => setBookingForm({ ...bookingForm, customerName: e.target.value })} required className="bg-stone-800 border-stone-700 text-white" data-testid="input-booking-name" /></div>
              <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label className="text-gray-300">Email</Label><Input type="email" value={bookingForm.email} onChange={(e) => setBookingForm({ ...bookingForm, email: e.target.value })} required className="bg-stone-800 border-stone-700 text-white" data-testid="input-booking-email" /></div><div className="space-y-2"><Label className="text-gray-300">Phone</Label><Input type="tel" value={bookingForm.phone} onChange={(e) => setBookingForm({ ...bookingForm, phone: e.target.value })} required className="bg-stone-800 border-stone-700 text-white" data-testid="input-booking-phone" /></div></div>
              <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label className="text-gray-300">Date</Label><Input type="date" value={bookingForm.date} onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })} required min={new Date().toISOString().split('T')[0]} className="bg-stone-800 border-stone-700 text-white" data-testid="input-booking-date" /></div><div className="space-y-2"><Label className="text-gray-300">Time</Label><Input type="time" value={bookingForm.time} onChange={(e) => setBookingForm({ ...bookingForm, time: e.target.value })} required className="bg-stone-800 border-stone-700 text-white" data-testid="input-booking-time" /></div></div>
              <div className="space-y-2"><Label className="text-gray-300">Number of Guests</Label><Input type="number" min="1" max="20" value={bookingForm.guests} onChange={(e) => setBookingForm({ ...bookingForm, guests: parseInt(e.target.value) || 1 })} required className="bg-stone-800 border-stone-700 text-white" data-testid="input-booking-guests" /></div>
              <Button type="submit" disabled={bookingLoading} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold" data-testid="button-submit-booking">{bookingLoading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Booking...</> : "Confirm Booking"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Check for GIF background for all themes
  const bgType = restaurant.welcomeBackgroundType || 'gradient';
  const gifUrl = restaurant.welcomeBackgroundGifUrl;

  return (
    <div 
      className={`min-h-screen ${isRoyalTheme ? 'text-gray-900' : 'bg-white font-sans text-gray-900'}`}
      style={isRoyalTheme ? { 
        fontFamily: "'Georgia', 'Times New Roman', serif",
        background: 'linear-gradient(180deg, #1a0a1a 0%, #2d1530 100%)'
      } : hasGenericTheme ? {
        fontFamily: genericTheme.fontFamily,
        background: genericTheme.colors.background
      } : {}}
    >
      {/* GIF Background when set */}
      {bgType === 'gif' && gifUrl && (
        <div className="fixed inset-0 z-0">
          <img src={gifUrl} alt="Background" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80"></div>
        </div>
      )}
      {/* Hero Section */}
      <section className="relative h-[500px] md:h-[600px] overflow-hidden">
        <div className="absolute inset-0">
          {bgType === 'gif' && gifUrl ? (
            <>
              <img src={gifUrl} alt="Background" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70"></div>
            </>
          ) : heroImages.length > 0 ? (
            <HeroCarousel
              images={heroImages}
              effect={(restaurant.heroAnimationStyle as any) || "slide"}
              interval={restaurant.heroSlideInterval || 5000}
              fallbackImage="https://flipdish-web.imgix.net/fd27836/0b3e7127c96f3fe533ff1daa8b5fcf85.jpeg?w=1400&h=600"
              gradientStart={restaurant.heroGradientStart || "#dc2626"}
              gradientMiddle={restaurant.heroGradientMiddle || "#f97316"}
              gradientEnd={restaurant.heroGradientEnd || "#fbbf24"}
            />
          ) : (
            <img 
              src={restaurant.welcomeImageUrl || "https://flipdish-web.imgix.net/fd27836/0b3e7127c96f3fe533ff1daa8b5fcf85.jpeg?w=1400&h=600"}
              alt={restaurant.name}
              className="w-full h-full object-cover"
            />
          )}
          {bgType !== 'gif' && <div 
            className={`absolute inset-0 ${isRoyalTheme ? 'bg-gradient-to-b from-black/60 via-purple-900/40 to-black/70' : 'bg-black/40'}`}
            style={hasGenericTheme ? { background: `linear-gradient(to bottom, ${genericTheme.colors.primary}90, ${genericTheme.colors.secondary}80)` } : {}}
          ></div>}
          {/* Royal decorative overlay */}
          {isRoyalTheme && (
            <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 50% 0%, #fbbf24 0%, transparent 40%)' }}></div>
          )}
        </div>
        
        <div className="relative z-10 h-full flex flex-col">
          {/* Header */}
          <header className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className={`rounded-2xl overflow-hidden ${isRoyalTheme ? 'h-32 w-32 ring-4 ring-amber-400/50 shadow-xl' : 'h-16 w-16 shadow-lg'}`}>
                <img 
                  src={restaurant.logoUrl || "https://flipdish.imgix.net/Q92vjMBZrCS3eeVpIVpQHYiTJf8.png?w=60"} 
                  alt={restaurant.name}
                  className={`w-full h-full object-cover ${isRoyalTheme ? 'bg-gradient-to-br from-amber-200 to-amber-400 p-1' : ''}`}
                  data-testid="header-logo"
                />
              </div>
            </div>
            <Button 
              variant="outline" 
              className={isRoyalTheme ? "bg-amber-500/20 border-amber-400/50 text-amber-100 hover:bg-amber-500/40 hover:text-white font-semibold" : "bg-white/10 border-white/30 text-white hover:bg-white hover:text-gray-900"}
              style={hasGenericTheme ? { 
                backgroundColor: `${genericTheme.colors.accent}20`,
                borderColor: genericTheme.colors.accent,
                color: genericTheme.colors.text || '#ffffff'
              } : {}}
              onClick={() => navigate(`/menu/${slug}`)}
            >
              View Full Menu
            </Button>
          </header>

          {/* Hero Content */}
          <div className="flex-1 flex items-center justify-center px-4">
            <div className="text-center text-white max-w-2xl">
              {promotion?.isActive && (
                <Badge 
                  className={`mb-4 text-sm px-4 py-1 ${isRoyalTheme ? 'shadow-lg' : ''}`}
                  style={isRoyalTheme ? { 
                    background: 'linear-gradient(135deg, #7c2d12 0%, #b91c1c 50%, #7c2d12 100%)',
                    color: '#fef3c7',
                    border: '1px solid rgba(251, 191, 36, 0.5)'
                  } : { 
                    backgroundColor: promotion.backgroundColor || "#dc2626",
                    color: promotion.textColor || "#ffffff"
                  }}
                >
                  {isRoyalTheme && <span className="mr-2">👑</span>}
                  {promotion.headline}
                  {promotion.subtext && <span className="ml-1 opacity-90">- {promotion.subtext}</span>}
                </Badge>
              )}
              
              {/* Royal Title */}
              {isRoyalTheme ? (
                <div className="mb-8">
                  <div className="flex items-center justify-center gap-4 mb-3">
                    <div className="h-px w-16 bg-gradient-to-r from-transparent to-amber-400"></div>
                    <span className="text-amber-300 text-xs tracking-[0.4em] uppercase">✦ Welcome to ✦</span>
                    <div className="h-px w-16 bg-gradient-to-l from-transparent to-amber-400"></div>
                  </div>
                  <h1 className="text-5xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-200 bg-clip-text text-transparent drop-shadow-2xl" style={{ fontFamily: "'Georgia', serif" }}>
                    {restaurant.name}
                  </h1>
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-amber-400 text-4xl">👑</span>
                    <div className="text-center">
                      <span className="text-amber-100 text-lg font-semibold tracking-wide block" style={{ fontFamily: "'Georgia', serif" }}>The King of Fried Chicken</span>
                      <span className="text-amber-300/60 text-xs tracking-widest uppercase">Est. Premium Quality</span>
                    </div>
                    <span className="text-amber-400 text-4xl">👑</span>
                  </div>
                </div>
              ) : hasGenericTheme ? (
                <h1 
                  className="text-4xl md:text-6xl font-bold mb-6"
                  style={{ color: genericTheme.colors.text || '#ffffff', fontFamily: genericTheme.fontFamily }}
                >
                  {restaurant.name}
                </h1>
              ) : (
                <h1 className="text-4xl md:text-6xl font-bold mb-6">{restaurant.name}</h1>
              )}
              
              {/* Order Type Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <Button 
                  size="lg"
                  className={isRoyalTheme ? "bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 hover:from-amber-600 hover:via-orange-600 hover:to-red-700 text-white font-bold text-lg px-10 py-6 rounded-full shadow-lg border border-amber-400/30" : "bg-red-600 hover:bg-red-700 text-white font-bold text-lg px-8 py-6 rounded-full"}
                  style={hasGenericTheme ? {
                    backgroundColor: genericTheme.colors.primary,
                    color: genericTheme.colors.text || '#ffffff',
                  } : {}}
                  onClick={() => navigate(`/menu/${slug}`)}
                  data-testid="button-deliver"
                >
                  🚗 Deliver
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  className={isRoyalTheme ? "bg-white/10 text-amber-100 hover:bg-amber-500/30 font-bold text-lg px-10 py-6 rounded-full border-2 border-amber-400/50 backdrop-blur-sm" : "bg-white text-gray-900 hover:bg-gray-100 font-bold text-lg px-8 py-6 rounded-full border-2"}
                  style={hasGenericTheme ? {
                    borderColor: genericTheme.colors.accent,
                    color: genericTheme.colors.text || '#ffffff',
                    backgroundColor: 'transparent'
                  } : {}}
                  onClick={() => navigate(`/menu/${slug}`)}
                  data-testid="button-collect"
                >
                  🛍️ Collect
                </Button>
              </div>

              <Button 
                variant="link" 
                className={isRoyalTheme ? "text-amber-200 hover:text-amber-100 underline decoration-amber-400/50 underline-offset-4" : "text-white underline"}
                onClick={() => navigate(`/menu/${slug}`)}
              >
                Order Now <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Menu Highlights Section - Animated 3D Carousel */}
      <section 
        className={`py-12 overflow-hidden ${isRoyalTheme ? '' : 'bg-gray-50'}`}
        style={isRoyalTheme ? { background: 'linear-gradient(180deg, #1e293b 0%, #334155 50%, #1e293b 100%)' } : hasGenericTheme ? { background: genericTheme.colors.cardBg || genericTheme.colors.background } : {}}
      >
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <div>
              <p 
                className={`font-medium mb-1 ${isRoyalTheme ? 'text-amber-400' : 'text-red-600'}`}
                style={hasGenericTheme ? { color: genericTheme.colors.accent } : {}}
              >
                {isRoyalTheme ? '✨ Menu highlights ✨' : 'Menu highlights'}
              </p>
              <h2 
                className={`text-3xl font-bold ${isRoyalTheme ? 'bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-300 bg-clip-text text-transparent' : ''}`} 
                style={isRoyalTheme ? { fontFamily: "'Georgia', serif" } : hasGenericTheme ? { color: genericTheme.colors.text, fontFamily: genericTheme.fontFamily } : {}}
              >
                {isRoyalTheme ? 'Our Royal Menu' : 'Our menu'}
              </h2>
            </div>
            <Button 
              variant="outline" 
              className={isRoyalTheme ? "border-amber-400 text-amber-300 hover:bg-amber-400/20 font-semibold" : "border-red-600 text-red-600 hover:bg-red-50"}
              style={hasGenericTheme ? { borderColor: genericTheme.colors.primary, color: genericTheme.colors.primary } : {}}
              onClick={() => navigate(`/menu/${slug}`)}
            >
              View full menu
            </Button>
          </div>
        </div>

        {/* Infinite Scrolling Carousel */}
        <div className="relative w-full overflow-hidden" style={{ perspective: '1000px' }}>
          <div 
            className="flex gap-6 py-4 animate-scroll-left"
            style={{
              width: 'max-content',
            }}
          >
            {[...featuredItems, ...featuredItems].map((item, index) => (
              <div
                key={`${item.id}-${index}`}
                className={`flex-shrink-0 w-[220px] rounded-2xl shadow-lg overflow-hidden cursor-pointer group transform transition-all duration-500 hover:scale-105 hover:-translate-y-2 hover:shadow-2xl ${isRoyalTheme ? 'bg-gradient-to-br from-slate-700 via-slate-600 to-slate-700 border border-amber-500/30' : 'bg-white border border-gray-100'}`}
                onClick={() => navigate(`/menu/${slug}`)}
                data-testid={`card-menu-item-${item.id}`}
                style={{
                  transformStyle: 'preserve-3d',
                }}
              >
                <div className={`h-36 relative overflow-hidden ${isRoyalTheme ? 'bg-gradient-to-br from-slate-600 to-slate-700' : 'bg-gray-100'}`}>
                  <img 
                    src={item.image || defaultFeaturedImages[index % defaultFeaturedImages.length]}
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity ${isRoyalTheme ? 'bg-gradient-to-t from-slate-900/50 to-transparent' : 'bg-gradient-to-t from-black/20 to-transparent'}`} />
                </div>
                <div className="p-4">
                  <h3 className={`font-bold text-base mb-1 line-clamp-1 transition-colors ${isRoyalTheme ? 'text-white group-hover:text-amber-300' : 'group-hover:text-red-600'}`} style={isRoyalTheme ? { fontFamily: "'Georgia', serif" } : {}}>{item.name}</h3>
                  <p className={`text-xs mb-2 line-clamp-2 h-8 ${isRoyalTheme ? 'text-slate-300' : 'text-gray-500'}`}>{item.description || "Delicious meal prepared fresh"}</p>
                  <div className="flex justify-between items-center">
                    <span className={`text-xs uppercase tracking-wider ${isRoyalTheme ? 'text-amber-400/70' : 'text-gray-400'}`}>From</span>
                    <span className={`font-bold text-lg ${isRoyalTheme ? 'text-amber-300' : 'text-gray-900'}`}>{currencySymbol}{item.price}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CSS Animation Styles */}
        <style>{`
          @keyframes scroll-left {
            0% {
              transform: translateX(0);
            }
            100% {
              transform: translateX(-50%);
            }
          }
          .animate-scroll-left {
            animation: scroll-left 30s linear infinite;
          }
          .animate-scroll-left:hover {
            animation-play-state: paused;
          }
        `}</style>
      </section>

      {/* Hours & Location */}
      <section 
        className="py-16 px-4"
        style={isRoyalTheme ? { background: 'linear-gradient(180deg, #2d1530 0%, #1a0a1a 100%)' } : hasGenericTheme ? { background: genericTheme.colors.cardBg || genericTheme.colors.background } : { background: '#1f2937' }}
      >
        <div className="container mx-auto">
          <h2 
            className={`text-3xl font-bold text-center mb-10 ${isRoyalTheme ? 'bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-300 bg-clip-text text-transparent' : ''}`}
            style={isRoyalTheme ? { fontFamily: "'Georgia', serif" } : hasGenericTheme ? { color: genericTheme.colors.accent || genericTheme.colors.primary } : { color: '#f87171' }}
          >
            {isRoyalTheme ? '✦ Visit Us ✦' : 'Visit Us'}
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div 
              className={`rounded-2xl p-8 ${isRoyalTheme ? 'border border-amber-500/30' : ''}`}
              style={isRoyalTheme ? { background: 'rgba(45, 21, 48, 0.8)' } : hasGenericTheme ? { background: `${genericTheme.colors.primary}30` } : { background: 'rgba(31, 41, 55, 0.8)' }}
            >
              <h3 
                className={`text-2xl font-bold mb-6 ${isRoyalTheme ? 'text-amber-300' : ''}`}
                style={isRoyalTheme ? { fontFamily: "'Georgia', serif" } : hasGenericTheme ? { color: genericTheme.colors.accent } : { color: '#f87171' }}
              >
                Find Us
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <MapPin className={`h-6 w-6 flex-shrink-0 mt-1 ${isRoyalTheme ? 'text-amber-400' : 'text-red-400'}`} style={hasGenericTheme ? { color: genericTheme.colors.accent } : {}} />
                  <div>
                    <p className="text-white font-medium">Address</p>
                    <p className={isRoyalTheme ? 'text-amber-100/70' : 'text-gray-300'} style={hasGenericTheme ? { color: `${genericTheme.colors.text}99` } : {}}>{restaurant.address || "Address not set"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Phone className={`h-6 w-6 flex-shrink-0 mt-1 ${isRoyalTheme ? 'text-amber-400' : 'text-red-400'}`} style={hasGenericTheme ? { color: genericTheme.colors.accent } : {}} />
                  <div>
                    <p className="text-white font-medium">Phone</p>
                    <p className={isRoyalTheme ? 'text-amber-100/70' : 'text-gray-300'} style={hasGenericTheme ? { color: `${genericTheme.colors.text}99` } : {}}>{restaurant.phone || "Contact us"}</p>
                  </div>
                </div>
              </div>
            </div>
            <div 
              className={`rounded-2xl p-8 ${isRoyalTheme ? 'border border-amber-500/30' : ''}`}
              style={isRoyalTheme ? { background: 'rgba(45, 21, 48, 0.8)' } : hasGenericTheme ? { background: `${genericTheme.colors.primary}30` } : { background: 'rgba(31, 41, 55, 0.8)' }}
            >
              <h3 
                className={`text-2xl font-bold mb-6 ${isRoyalTheme ? 'text-amber-300' : ''}`}
                style={isRoyalTheme ? { fontFamily: "'Georgia', serif" } : hasGenericTheme ? { color: genericTheme.colors.accent } : { color: '#f87171' }}
              >
                Opening Hours
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between"><span className="text-white">Mon - Thu</span><span className={isRoyalTheme ? 'text-amber-300' : ''} style={hasGenericTheme ? { color: genericTheme.colors.accent } : !isRoyalTheme ? { color: '#f87171' } : {}}>{restaurant.deliveryHoursMonThu || "12PM - 10:30PM"}</span></div>
                <div className="flex justify-between"><span className="text-white">Fri - Sat</span><span className={isRoyalTheme ? 'text-amber-300' : ''} style={hasGenericTheme ? { color: genericTheme.colors.accent } : !isRoyalTheme ? { color: '#f87171' } : {}}>{restaurant.deliveryHoursFriSat || "12PM - 11:30PM"}</span></div>
                <div className="flex justify-between"><span className="text-white">Sunday</span><span className={isRoyalTheme ? 'text-amber-300' : ''} style={hasGenericTheme ? { color: genericTheme.colors.accent } : !isRoyalTheme ? { color: '#f87171' } : {}}>{restaurant.deliveryHoursSun || "12PM - 10:30PM"}</span></div>
              </div>
            </div>
            <div 
              className={`rounded-2xl overflow-hidden ${isRoyalTheme ? 'border border-amber-500/30' : ''}`}
              style={isRoyalTheme ? { background: 'rgba(45, 21, 48, 0.8)' } : hasGenericTheme ? { background: `${genericTheme.colors.primary}30` } : { background: 'rgba(31, 41, 55, 0.8)' }}
            >
              <h3 
                className={`text-xl font-bold p-4 pb-2 ${isRoyalTheme ? 'text-amber-300' : ''}`}
                style={isRoyalTheme ? { fontFamily: "'Georgia', serif" } : hasGenericTheme ? { color: genericTheme.colors.accent } : { color: '#f87171' }}
              >
                Our Location
              </h3>
              <div className="h-48 md:h-56">
                {(restaurant as any).mapEmbedUrl ? (
                  <iframe src={(restaurant as any).mapEmbedUrl} width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" title={`${restaurant.name} Location`} />
                ) : (
                  <div className="h-full flex items-center justify-center p-4">
                    <div className="text-center">
                      <MapPin className={`h-8 w-8 mx-auto mb-2 ${isRoyalTheme ? 'text-amber-400' : 'text-red-400'}`} style={hasGenericTheme ? { color: genericTheme.colors.accent } : {}} />
                      <p className={isRoyalTheme ? 'text-amber-100/70 text-sm' : 'text-gray-300 text-sm'} style={hasGenericTheme ? { color: `${genericTheme.colors.text}99` } : {}}>{restaurant.address || "Visit us today!"}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section 
        className="py-12 px-4 text-center"
        style={isRoyalTheme ? { background: 'linear-gradient(135deg, #7c2d12 0%, #b91c1c 50%, #7c2d12 100%)' } : hasGenericTheme ? { background: genericTheme.colors.primary } : { background: '#dc2626' }}
      >
        <div className="container mx-auto">
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-4">
            <Button 
              size="lg" 
              className={isRoyalTheme ? "bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 text-white font-bold text-lg px-10 py-6 rounded-xl" : "bg-white font-bold text-lg px-10 py-6 rounded-xl"}
              style={hasGenericTheme ? { backgroundColor: '#ffffff', color: genericTheme.colors.primary } : !isRoyalTheme ? { color: '#dc2626' } : {}}
              onClick={() => navigate(`/menu/${slug}`)}
            >
              Order Delivery
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white text-white hover:bg-white/20 font-bold text-lg px-10 py-6 rounded-xl" 
              onClick={() => setShowBookingDialog(true)}
            >
              Book a Table
            </Button>
          </div>
          {restaurant.phone && <p className="text-white/80 text-sm">Or call us: {restaurant.phone}</p>}
        </div>
      </section>

      {/* Footer */}
      <footer 
        className="py-12"
        style={isRoyalTheme ? { background: 'linear-gradient(180deg, #1a0a1a 0%, #2d1530 50%, #1a0a1a 100%)' } : hasGenericTheme ? { background: genericTheme.colors.secondary || genericTheme.colors.background } : { background: '#111827' }}
      >
        <div className="container mx-auto px-4 text-center">
          {isRoyalTheme && (
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="h-px flex-1 max-w-32 bg-gradient-to-r from-transparent to-amber-400/50"></div>
              <span className="text-4xl">👑</span>
              <div className="h-px flex-1 max-w-32 bg-gradient-to-l from-transparent to-amber-400/50"></div>
            </div>
          )}
          <div className={`h-16 w-16 rounded-2xl overflow-hidden mx-auto mb-4 ${isRoyalTheme ? 'ring-2 ring-amber-400/50' : 'shadow-lg'}`}>
            <img 
              src={restaurant.logoUrl || "https://flipdish.imgix.net/Q92vjMBZrCS3eeVpIVpQHYiTJf8.png?w=60"} 
              alt={restaurant.name}
              className={`w-full h-full object-cover ${isRoyalTheme ? 'bg-gradient-to-br from-amber-200 to-amber-400 p-1' : ''}`}
              data-testid="footer-logo"
            />
          </div>
          {isRoyalTheme ? (
            <>
              <p className="text-amber-200/80 text-sm font-medium mb-1" style={{ fontFamily: "'Georgia', serif" }}>Thank You for Choosing</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-amber-200 via-yellow-200 to-amber-200 bg-clip-text text-transparent mb-2" style={{ fontFamily: "'Georgia', serif" }}>
                {restaurant.name}
              </p>
              <p className="text-amber-300/60 text-xs italic mb-4">Where Every Meal is a Royal Experience</p>
              <div className="flex justify-center gap-2 mb-4">
                <span className="text-amber-400">★</span>
                <span className="text-amber-300">★</span>
                <span className="text-amber-400">★</span>
                <span className="text-amber-300">★</span>
                <span className="text-amber-400">★</span>
              </div>
              <p className="text-amber-400/60 text-xs">
                © {new Date().getFullYear()} {restaurant.name}. All rights reserved.
              </p>
            </>
          ) : hasGenericTheme ? (
            <p className="text-sm" style={{ color: genericTheme.colors.text }}>
              © {new Date().getFullYear()} {restaurant.name}. All rights reserved.
            </p>
          ) : (
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} {restaurant.name}. All rights reserved.
            </p>
          )}
        </div>
      </footer>
    </div>
  );
}
