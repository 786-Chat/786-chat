import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Tv, Upload, Image as ImageIcon, X, Plus, Monitor, Download, Save, FolderOpen, Music, Clipboard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import JSZip from "jszip";
import { Usb, Users, UserPlus, Trash2, ToggleLeft, ToggleRight, Copy, ExternalLink } from "lucide-react";

interface MenuItem {
  id: number;
  name: string;
  price: string;
  calories: string;
  description: string;
  image: string | null;
  animation: string;
}

interface KidsMenuItem {
  id: number;
  name: string;
  price: string;
  animation: string;
}

interface Tv3Item {
  id: number;
  name: string;
  price: string;
  calories: string;
}

interface Tv3Section {
  title: string;
  items: Tv3Item[];
  image: string | null;
  bgImage: string | null;
  promoText: string;
  promoPrice: string;
  promoSubText: string;
}

interface Tv3DrinkSize {
  id: number;
  name: string;
  small: string;
  medium: string;
  large: string;
  cal: string;
}

interface Tv3ShakeFlavor {
  id: number;
  name: string;
}

interface Tv5GridItem {
  id: number;
  label: string;
  name: string;
  price: string;
  image: string | null;
  animation: string;
}

interface Tv5DualItem {
  id: number;
  name: string;
  price: string;
}

interface Tv5SideItem {
  id: number;
  name: string;
  price: string;
  image: string | null;
  animation: string;
}

interface Tv6PromoItem {
  id: number;
  title: string;
  price: string;
  image: string | null;
  animation: string;
}

interface Tv7MenuItem {
  id: number;
  name: string;
  price: string;
  image: string | null;
  animation: string;
}

interface Tv7BoxItem {
  id: number;
  name: string;
  price: string;
  image: string | null;
  animation: string;
}

interface Tv8FeaturedItem {
  title: string;
  subtitle: string;
  singlePrice: string;
  mealPrice: string;
  image: string | null;
  animation: string;
}

interface Tv8GridItem {
  id: number;
  name: string;
  price: string;
  image: string | null;
  animation: string;
}

interface Tv9LeftItem {
  id: number;
  name: string;
  price: string;
  image: string | null;
  animation: string;
}

interface Tv9RightItem {
  id: number;
  name: string;
  price: string;
  image: string | null;
  animation: string;
}

const TV_SIZES = [
  { label: '10"', width: 200 },
  { label: '14"', width: 280 },
  { label: '24"', width: 380 },
  { label: '32"', width: 480 },
  { label: '40"', width: 560 },
  { label: '43"', width: 600 },
  { label: '50"', width: 680 },
  { label: '55"', width: 740 },
  { label: '65"', width: 840 },
  { label: '75"', width: 960 },
];

export default function ShopDisplayMenus() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [activeTv, setActiveTv] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9>(1);
  const [saving, setSaving] = useState(false);
  const [savedLiveUrl, setSavedLiveUrl] = useState<string | null>(null);
  const [showCustomerPanel, setShowCustomerPanel] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [newCustName, setNewCustName] = useState("");
  const [newCustUsername, setNewCustUsername] = useState("");
  const [newCustPassword, setNewCustPassword] = useState("");
  const [newCustTvs, setNewCustTvs] = useState<number[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [allCustomers, setAllCustomers] = useState<any[]>([]);
  const [tv1SizeIndex, setTv1SizeIndex] = useState(6);
  const [tv2SizeIndex, setTv2SizeIndex] = useState(6);
  const [customPreviewWidth, setCustomPreviewWidth] = useState(600);
  const [customPreviewHeight, setCustomPreviewHeight] = useState(450);
  const [useCustomSize, setUseCustomSize] = useState(false);
  const [tv1Orientation, setTv1Orientation] = useState<"landscape" | "portrait">("landscape");
  const [tv2Orientation, setTv2Orientation] = useState<"landscape" | "portrait">("landscape");

  const [headerText, setHeaderText] = useState("Power Deals");
  const [mainText, setMainText] = useState("BUY 2 GET 1");
  const [mainTextHighlight, setMainTextHighlight] = useState("FREE");
  const [sideText, setSideText] = useState("3 Days\nOnly!");
  const [sideSubText, setSideSubText] = useState("17-19 February 2026");
  const [priceText, setPriceText] = useState("£13.99");
  const [bgColor, setBgColor] = useState("#FF8C00");
  const [priceColor, setPriceColor] = useState("#FFFFFF");
  const [priceAnimation, setPriceAnimation] = useState("none");
  const [highlightColor, setHighlightColor] = useState("#FFD700");
  const [highlightAnimation, setHighlightAnimation] = useState("none");
  const [mainTextColor, setMainTextColor] = useState("#FFFFFF");
  const [mainTextAnimation, setMainTextAnimation] = useState("none");
  const [logo, setLogo] = useState<string | null>(null);
  const [images, setImages] = useState<{ src: string; original: string; bgRemoved: boolean }[]>([]);
  const [rotationStep, setRotationStep] = useState(0);
  const [removingBg, setRemovingBg] = useState<number | null>(null);

  const [tv2BgColor, setTv2BgColor] = useState("#1a1a1a");
  const [tv2AccentColor, setTv2AccentColor] = useState("#DAA520");
  const [tv2TextColor, setTv2TextColor] = useState("#FFFFFF");
  const [tv2FeaturedTitle, setTv2FeaturedTitle] = useState("GRILLED CHEESE\nSANDWICH");
  const [tv2FeaturedSubtitle, setTv2FeaturedSubtitle] = useState("TODAY IS\nSANDWICH\nDAY");
  const [tv2FeaturedPrice, setTv2FeaturedPrice] = useState("$5.50");
  const [tv2FeaturedDesc, setTv2FeaturedDesc] = useState("with red cabbage of green, mustard and onion and lemon soda");
  const [tv2FeaturedImage, setTv2FeaturedImage] = useState<string | null>(null);
  const [tv2Logo, setTv2Logo] = useState<string | null>(null);
  const [tv2ComboText, setTv2ComboText] = useState("ADD DRINK AND FRIES MAKE IT A COMBO");
  const [tv2ComboPrice, setTv2ComboPrice] = useState("JUST FOR $3 MORE");
  const [tv2FeaturedAnimation, setTv2FeaturedAnimation] = useState("none");
  const [tv2PriceAnimation, setTv2PriceAnimation] = useState("none");
  const [tv2ComboAnimation, setTv2ComboAnimation] = useState("none");
  const [tv2ImageAnimation, setTv2ImageAnimation] = useState("none");
  const [tv2ComboImage, setTv2ComboImage] = useState<string | null>(null);
  const [tv2ComboImageAnimation, setTv2ComboImageAnimation] = useState("none");
  const [tv2KidsImage, setTv2KidsImage] = useState<string | null>(null);
  const [tv2KidsImageAnimation, setTv2KidsImageAnimation] = useState("none");
  const [tv2MenuItems, setTv2MenuItems] = useState<MenuItem[]>([
    { id: 1, name: "CHICKEN BURGER", price: "$4.50", calories: "CAL 515", description: "Package includes chicken patties, tomato, lettuce, sauce, cheese", image: null, animation: "none" },
    { id: 2, name: "BEEF BURGER", price: "$4.99", calories: "CAL 200", description: "Package includes beef patties, tomato, lettuce, sauce, cheese", image: null, animation: "none" },
    { id: 3, name: "ROYAL BURGER", price: "$6.99", calories: "CAL 900", description: "Package includes 2 chicken patties, tomato, lettuce, sauce, cheese", image: null, animation: "none" },
    { id: 4, name: "CRUNCH BURGER", price: "$6.50", calories: "CAL 495", description: "Package ginger patties, tomato, lettuce, sauce, cheese", image: null, animation: "none" },
    { id: 5, name: "BIG BURGER", price: "$9.50", calories: "CAL 390", description: "Package includes 2 meat patties, tomato, lettuce, sauce, cheese", image: null, animation: "none" },
    { id: 6, name: "STEAK BURGER", price: "$7.99", calories: "CAL 425", description: "Package includes handmade steak, tomato, lettuce, sauce, cheese", image: null, animation: "none" },
    { id: 7, name: "TERIYAKI BURGER", price: "$6.99", calories: "CAL 280", description: "Package includes shrimp piece, tomato, lettuce, sauce, cheese", image: null, animation: "none" },
    { id: 8, name: "BACON BURGER", price: "$8.50", calories: "CAL 590", description: "Package includes bacon, tomato, lettuce, sauce, cheese", image: null, animation: "none" },
  ]);
  const [tv2KidsMenu, setTv2KidsMenu] = useState<KidsMenuItem[]>([
    { id: 1, name: "JR ROAST BEEF", price: "$4.75", animation: "none" },
    { id: 2, name: "JR HAM & SWISS", price: "$4.50", animation: "none" },
    { id: 3, name: "JR CHEDDAR & SWISS", price: "$4.60", animation: "none" },
    { id: 4, name: "CHICKEN TENDERS", price: "$3.75", animation: "none" },
  ]);

  const [tv3SizeIndex, setTv3SizeIndex] = useState(6);
  const [tv3Orientation, setTv3Orientation] = useState<"landscape" | "portrait">("landscape");
  const [tv3Logo, setTv3Logo] = useState<string | null>(null);
  const [tv3BgColor, setTv3BgColor] = useState("#1a1a1a");
  const [tv3AccentColor, setTv3AccentColor] = useState("#DAA520");
  const [tv3TextColor, setTv3TextColor] = useState("#FFFFFF");
  const [tv3Starters, setTv3Starters] = useState<Tv3Item[]>([
    { id: 1, name: "French Fries", price: "$1.50", calories: "Cal 300" },
    { id: 2, name: "Onion Rings", price: "$1.75", calories: "Cal 400" },
    { id: 3, name: "Sweet Potato Fries", price: "$1.25", calories: "Cal 280" },
    { id: 4, name: "Chili Bowl", price: "$1.40", calories: "Cal 350" },
    { id: 5, name: "Curly Fries", price: "$1.65", calories: "Cal 310" },
    { id: 6, name: "Cheese Fries", price: "$1.50", calories: "Cal 350" },
    { id: 7, name: "Chili Cheese Fries", price: "$1.75", calories: "Cal 540" },
    { id: 8, name: "Bacon Cheese Fries", price: "$1.25", calories: "Cal 475" },
    { id: 9, name: "Chicken Wings", price: "$1.40", calories: "Cal 360" },
  ]);
  const [tv3StartersImage, setTv3StartersImage] = useState<string | null>(null);
  const [tv3StartersBgImage, setTv3StartersBgImage] = useState<string | null>(null);
  const [tv3StartersImageAnim, setTv3StartersImageAnim] = useState("none");
  const [tv3StartersTitle, setTv3StartersTitle] = useState("Starters");
  const [tv3Sides, setTv3Sides] = useState<Tv3Item[]>([
    { id: 1, name: "Corn Bread Muffins", price: "$2.25", calories: "Cal 220" },
    { id: 2, name: "Water Ganache", price: "$5.85", calories: "Cal 180" },
    { id: 3, name: "Baked Beans", price: "$4.95", calories: "Cal 250" },
    { id: 4, name: "Kaiser Roll", price: "$1.50", calories: "Cal 190" },
    { id: 5, name: "Whoopee Pies", price: "$2.00", calories: "Cal 300" },
    { id: 6, name: "Brownies", price: "$3.25", calories: "Cal 340" },
  ]);
  const [tv3SidesImage, setTv3SidesImage] = useState<string | null>(null);
  const [tv3SidesBgImage, setTv3SidesBgImage] = useState<string | null>(null);
  const [tv3SidesImageAnim, setTv3SidesImageAnim] = useState("none");
  const [tv3SidesTitle, setTv3SidesTitle] = useState("BREAD & SIDES");
  const [tv3CookiesText, setTv3CookiesText] = useState("COOKIES 0.5$");
  const [tv3CookiesSubText, setTv3CookiesSubText] = useState("AVAILABLE IN OLD FASHIONED CHOCOLATE CHIP, SUGAR, OATMEAL, CURRANT, MONSTER, SNICKERDOODLE AND TOFFEE.");
  const [tv3CookiesImage, setTv3CookiesImage] = useState<string | null>(null);
  const [tv3Drinks, setTv3Drinks] = useState<Tv3DrinkSize[]>([
    { id: 1, name: "Fountain Drink", small: "$1.05", medium: "$2.05", large: "$3.05", cal: "80-350" },
    { id: 2, name: "Iced Tea", small: "$1.05", medium: "$2.05", large: "$3.05", cal: "0-5" },
    { id: 3, name: "Sweet Tea", small: "$1.01", medium: "$2.01", large: "$3.01", cal: "100-280" },
  ]);
  const [tv3DrinksImage, setTv3DrinksImage] = useState<string | null>(null);
  const [tv3DrinksBgImage, setTv3DrinksBgImage] = useState<string | null>(null);
  const [tv3DrinksImageAnim, setTv3DrinksImageAnim] = useState("none");
  const [tv3DrinksTitle, setTv3DrinksTitle] = useState("SOFT DRINKS");
  const [tv3ShakesTitle, setTv3ShakesTitle] = useState("SUMMER OF\nSHAKES");
  const [tv3ShakeSmall, setTv3ShakeSmall] = useState("$2.70");
  const [tv3ShakeMedium, setTv3ShakeMedium] = useState("$3.10");
  const [tv3ShakeLarge, setTv3ShakeLarge] = useState("$3.99");
  const [tv3ShakeFlavors, setTv3ShakeFlavors] = useState<Tv3ShakeFlavor[]>([
    { id: 1, name: "Vanilla" }, { id: 2, name: "Pineapple" },
    { id: 3, name: "Chocolate" }, { id: 4, name: "Peanut Butter" },
    { id: 5, name: "Strawberry" }, { id: 6, name: "Cheesecake" },
    { id: 7, name: "Fresh Banana" }, { id: 8, name: "Oreo" },
  ]);
  const [tv3ShakesImage, setTv3ShakesImage] = useState<string | null>(null);
  const [tv3ShakesBgImage, setTv3ShakesBgImage] = useState<string | null>(null);
  const [tv3ShakesImageAnim, setTv3ShakesImageAnim] = useState("none");

  // TV 4 State
  const [tv4SizeIndex, setTv4SizeIndex] = useState(6);
  const [tv4Orientation, setTv4Orientation] = useState<"landscape" | "portrait">("landscape");
  const [tv4BgColor, setTv4BgColor] = useState("#0d0d2b");
  const [tv4AccentColor, setTv4AccentColor] = useState("#DAA520");
  const [tv4TextColor, setTv4TextColor] = useState("#FFFFFF");
  const [tv4Logo, setTv4Logo] = useState<string | null>(null);
  const [tv4MainImage, setTv4MainImage] = useState<string | null>(null);
  const [tv4MainImageAnim, setTv4MainImageAnim] = useState("rotate");
  const [tv4BgMedia, setTv4BgMedia] = useState<string | null>(null);
  const [tv4BgMediaType, setTv4BgMediaType] = useState<"image" | "video" | "gif">("image");
  const [tv4TitleLine1, setTv4TitleLine1] = useState("Special");
  const [tv4TitleLine2, setTv4TitleLine2] = useState("Pizza Offer");
  const [tv4TitleAnim, setTv4TitleAnim] = useState("none");
  const [tv4SizeIcon, setTv4SizeIcon] = useState<string | null>(null);
  const [tv4SizeIconAnim, setTv4SizeIconAnim] = useState("rotate");
  const [tv4Sizes, setTv4Sizes] = useState([
    { id: 1, label: "Small", price: "£ 2.99" },
    { id: 2, label: "Medium", price: "£ 3.99" },
    { id: 3, label: "Large", price: "£ 5.99" },
    { id: 4, label: "Extra Large", price: "£ 8.00" },
  ]);

  // TV 5 State
  const [tv5SizeIndex, setTv5SizeIndex] = useState(6);
  const [tv5Orientation, setTv5Orientation] = useState<"landscape" | "portrait">("landscape");
  const [tv5BgColor, setTv5BgColor] = useState("#1a1a2e");
  const [tv5AccentColor, setTv5AccentColor] = useState("#FF6B00");
  const [tv5TextColor, setTv5TextColor] = useState("#FFFFFF");
  const [tv5Logo, setTv5Logo] = useState<string | null>(null);
  const [tv5BgMedia, setTv5BgMedia] = useState<string | null>(null);
  const [tv5BgMediaType, setTv5BgMediaType] = useState<"image" | "video" | "gif">("image");
  const [tv5Section1Title, setTv5Section1Title] = useState("GRILLED CHICKEN");
  const [tv5Section1Subtitle, setTv5Section1Subtitle] = useState("(Rice & Drink  £2.99)");
  const [tv5Section1Items, setTv5Section1Items] = useState<Tv5GridItem[]>([
    { id: 1, label: "Grilled", name: "Chicken Wings", price: "£4.99", image: null, animation: "none" },
    { id: 2, label: "Grilled", name: "Chicken Strips", price: "£5.50", image: null, animation: "none" },
    { id: 3, label: "Grilled", name: "Quarter Chicken", price: "£4.50", image: null, animation: "none" },
    { id: 4, label: "Grilled", name: "Half Chicken", price: "£6.99", image: null, animation: "none" },
    { id: 5, label: "Grilled", name: "Whole Chicken", price: "£12.99", image: null, animation: "none" },
    { id: 6, label: "Grilled", name: "Chicken Burger", price: "£5.50", image: null, animation: "none" },
    { id: 7, label: "Grilled", name: "Chicken Wrap", price: "£4.99", image: null, animation: "none" },
    { id: 8, label: "Grilled", name: "Strips with Rice", price: "£7.99", image: null, animation: "none" },
  ]);
  const [tv5Section2Title, setTv5Section2Title] = useState("DONER & KEBAB");
  const [tv5Section2Subtitle, setTv5Section2Subtitle] = useState("(Chips & Drink  £1.99)");
  const [tv5DualLeft, setTv5DualLeft] = useState({ title: "DONER WRAP", image: null as string | null, animation: "none", items: [
    { id: 1, name: "Chicken", price: "£7.50" },
    { id: 2, name: "Lamb", price: "£7.99" },
    { id: 3, name: "Mix", price: "£8.50" },
  ] as Tv5DualItem[] });
  const [tv5DualRight, setTv5DualRight] = useState({ title: "DONER KEBAB", image: null as string | null, animation: "none", items: [
    { id: 1, name: "Chicken", price: "£7.99" },
    { id: 2, name: "Lamb", price: "£8.50" },
    { id: 3, name: "Mix", price: "£8.99" },
  ] as Tv5DualItem[] });
  const [tv5SideTitle, setTv5SideTitle] = useState("VEGGIE");
  const [tv5SideItems, setTv5SideItems] = useState<Tv5SideItem[]>([
    { id: 1, name: "Veggie Burger", price: "£4.50", image: null, animation: "none" },
    { id: 2, name: "Fish Burger", price: "£4.50", image: null, animation: "none" },
    { id: 3, name: "Falafel Wrap", price: "£5.50", image: null, animation: "none" },
  ]);

  const [tv6SizeIndex, setTv6SizeIndex] = useState(6);
  const [tv6Orientation, setTv6Orientation] = useState<"landscape" | "portrait">("landscape");
  const [tv6TopColor, setTv6TopColor] = useState("#f5a623");
  const [tv6BottomColor, setTv6BottomColor] = useState("#cc0000");
  const [tv6TextColor, setTv6TextColor] = useState("#ffffff");
  const [tv6AccentColor, setTv6AccentColor] = useState("#cc0000");
  const [tv6Logo, setTv6Logo] = useState<string | null>(null);
  const [tv6BgMedia, setTv6BgMedia] = useState<string | null>(null);
  const [tv6BgMediaType, setTv6BgMediaType] = useState<"image" | "video" | "gif">("image");
  const [tv6PromoItems, setTv6PromoItems] = useState<Tv6PromoItem[]>([
    { id: 1, title: "PROMO #2", price: "$5.99", image: null, animation: "float" },
    { id: 2, title: "PROMO #1", price: "$5.99", image: null, animation: "rotate" },
    { id: 3, title: "PROMO #3", price: "$5.99", image: null, animation: "float" },
  ]);

  const [tv7SizeIndex, setTv7SizeIndex] = useState(6);
  const [tv7Orientation, setTv7Orientation] = useState<"landscape" | "portrait">("landscape");
  const [tv7TopBgColor, setTv7TopBgColor] = useState("#3b2314");
  const [tv7BottomBgColor, setTv7BottomBgColor] = useState("#e8a317");
  const [tv7TextColor, setTv7TextColor] = useState("#ffffff");
  const [tv7PriceColor, setTv7PriceColor] = useState("#e8a317");
  const [tv7Logo, setTv7Logo] = useState<string | null>(null);
  const [tv7BgMedia, setTv7BgMedia] = useState<string | null>(null);
  const [tv7BgMediaType, setTv7BgMediaType] = useState<"image" | "video" | "gif">("image");
  const [tv7MenuItems, setTv7MenuItems] = useState<Tv7MenuItem[]>([
    { id: 1, name: "6 CHICKEN TANDERS", price: "£4.00", image: null, animation: "none" },
    { id: 2, name: "6 CHICKEN NUGGATS", price: "£4.00", image: null, animation: "none" },
    { id: 3, name: "6 CHICKEN WINGS", price: "£4.00", image: null, animation: "none" },
    { id: 4, name: "5 CHICKEN NUGGATS MEAL", price: "£6.00", image: null, animation: "none" },
    { id: 5, name: "5 CHICKEN TUNDER MEAL", price: "£6.00", image: null, animation: "none" },
    { id: 6, name: "5 CHICKEN WINGS MEAL", price: "£6.00", image: null, animation: "none" },
    { id: 7, name: "7 CHICKEN TANDER MEAL", price: "£7.00", image: null, animation: "none" },
    { id: 8, name: "7 CHICKEN NUGGATS MEAL", price: "£7.00", image: null, animation: "none" },
    { id: 9, name: "7 CHICKEN WINGS MEAL", price: "£7.00", image: null, animation: "none" },
  ]);
  const [tv7BoxItems, setTv7BoxItems] = useState<Tv7BoxItem[]>([
    { id: 1, name: "FAMILY BOX", price: "£8.50", image: null, animation: "pulse" },
    { id: 2, name: "SNACK BOX", price: "£5.00", image: null, animation: "pulse" },
    { id: 3, name: "LANCH BOX", price: "£3.50", image: null, animation: "pulse" },
  ]);

  const [tv8SizeIndex, setTv8SizeIndex] = useState(6);
  const [tv8Orientation, setTv8Orientation] = useState<"landscape" | "portrait">("landscape");
  const [tv8BgColor, setTv8BgColor] = useState("#1a1000");
  const [tv8GridBgColor, setTv8GridBgColor] = useState("#2a1800");
  const [tv8BorderColor, setTv8BorderColor] = useState("#c8941e");
  const [tv8TextColor, setTv8TextColor] = useState("#ffffff");
  const [tv8PriceColor, setTv8PriceColor] = useState("#c8941e");
  const [tv8Logo, setTv8Logo] = useState<string | null>(null);
  const [tv8BgMedia, setTv8BgMedia] = useState<string | null>(null);
  const [tv8BgMediaType, setTv8BgMediaType] = useState<"image" | "video" | "gif">("image");
  const [tv8Featured, setTv8Featured] = useState<Tv8FeaturedItem>({
    title: "1/2 POUNDER MEAL",
    subtitle: "Single Burger    Meal",
    singlePrice: "£6.00",
    mealPrice: "£7.50",
    image: null,
    animation: "float",
  });
  const [tv8GridItems, setTv8GridItems] = useState<Tv8GridItem[]>([
    { id: 1, name: "1/4 POUNDER MEAL", price: "£6.50", image: null, animation: "none" },
    { id: 2, name: "CHICKEN BURGER MEAL", price: "£6.50", image: null, animation: "none" },
    { id: 3, name: "CHICKEN FELT MEAL", price: "£6.50", image: null, animation: "none" },
    { id: 4, name: "1/4 POUNDER", price: "£4.00", image: null, animation: "none" },
    { id: 5, name: "CHICKEN BURGER", price: "£4.00", image: null, animation: "none" },
    { id: 6, name: "CHICKEN FELT", price: "£4.00", image: null, animation: "none" },
  ]);

  const [tv9SizeIndex, setTv9SizeIndex] = useState(6);
  const [tv9Orientation, setTv9Orientation] = useState<"landscape" | "portrait">("landscape");
  const [tv9BgColor, setTv9BgColor] = useState("#1a3cb5");
  const [tv9TextColor, setTv9TextColor] = useState("#ffffff");
  const [tv9PriceColor, setTv9PriceColor] = useState("#ffffff");
  const [tv9Logo, setTv9Logo] = useState<string | null>(null);
  const [tv9BgMedia, setTv9BgMedia] = useState<string | null>(null);
  const [tv9BgMediaType, setTv9BgMediaType] = useState<"image" | "video" | "gif">("image");
  const [tv9LeftItems, setTv9LeftItems] = useState<Tv9LeftItem[]>([
    { id: 1, name: "ROLL ICE CREAM", price: "£1.99", image: null, animation: "float" },
    { id: 2, name: "", price: "", image: null, animation: "float" },
  ]);
  const [tv9RightItems, setTv9RightItems] = useState<Tv9RightItem[]>([
    { id: 1, name: "CUP CAKES", price: "99p", image: null, animation: "rotate" },
    { id: 2, name: "", price: "", image: null, animation: "rotateSlow" },
    { id: 3, name: "", price: "", image: null, animation: "rotateFast" },
  ]);

  const [tv1Music, setTv1Music] = useState<string | null>(null);
  const [tv2Music, setTv2Music] = useState<string | null>(null);
  const [tv3Music, setTv3Music] = useState<string | null>(null);
  const [tv4Music, setTv4Music] = useState<string | null>(null);
  const [tv5Music, setTv5Music] = useState<string | null>(null);
  const [tv6Music, setTv6Music] = useState<string | null>(null);
  const [tv7Music, setTv7Music] = useState<string | null>(null);
  const [tv8Music, setTv8Music] = useState<string | null>(null);
  const [tv9Music, setTv9Music] = useState<string | null>(null);

  const animationOptions = [
    { value: "none", label: "None" },
    { value: "pulse", label: "Pulse" },
    { value: "bounce", label: "Bounce" },
    { value: "glow", label: "Glow" },
    { value: "shake", label: "Shake" },
    { value: "flash", label: "Flash" },
    { value: "swing", label: "Swing" },
    { value: "float", label: "Float" },
    { value: "slideIn", label: "Slide In" },
  ];

  const removeBgFn = (imgSrc: string, threshold: number = 230): Promise<string> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2];
          const brightness = (r + g + b) / 3;
          if (brightness > threshold) data[i + 3] = 0;
          else if (brightness > threshold - 30) data[i + 3] = Math.floor(255 * (1 - (brightness - (threshold - 30)) / 30));
        }
        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      };
      img.src = imgSrc;
    });
  };

  const toggleBgRemoval = async (index: number) => {
    const img = images[index];
    if (img.bgRemoved) {
      setImages(prev => prev.map((item, i) => i === index ? { ...item, src: item.original, bgRemoved: false } : item));
    } else {
      setRemovingBg(index);
      const processed = await removeBgFn(img.original);
      setImages(prev => prev.map((item, i) => i === index ? { ...item, src: processed, bgRemoved: true } : item));
      setRemovingBg(null);
    }
  };

  useEffect(() => {
    if (images.length < 2) return;
    const interval = setInterval(() => setRotationStep(prev => prev + 1), 2000);
    return () => clearInterval(interval);
  }, [images.length]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        const src = reader.result as string;
        setImages(prev => [...prev, { src, original: src, bgRemoved: false }]);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const pasteCallbackRef = useRef<((dataUrl: string) => void) | null>(null);
  const pasteAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: ClipboardEvent) => {
      if (!pasteCallbackRef.current) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          e.preventDefault();
          const file = items[i].getAsFile();
          if (!file) continue;
          const reader = new FileReader();
          reader.onload = () => {
            if (reader.result && pasteCallbackRef.current) {
              pasteCallbackRef.current(reader.result as string);
              pasteCallbackRef.current = null;
              toast({ title: "Image pasted!" });
            }
          };
          reader.readAsDataURL(file);
          return;
        }
      }
      const text = e.clipboardData?.getData("text");
      if (text && (text.startsWith("http") || text.startsWith("data:image"))) {
        e.preventDefault();
        if (pasteCallbackRef.current) {
          pasteCallbackRef.current(text);
          pasteCallbackRef.current = null;
          toast({ title: "Image URL pasted!" });
        }
        return;
      }
    };
    document.addEventListener("paste", handler);
    return () => document.removeEventListener("paste", handler);
  }, []);

  const handlePasteImage = (callback: (dataUrl: string) => void) => () => {
    pasteCallbackRef.current = callback;
    toast({ title: "Ready to paste", description: "Now press Ctrl+V (or Cmd+V) to paste your image" });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { if (reader.result) setLogo(reader.result as string); };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleTv2LogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { if (reader.result) setTv2Logo(reader.result as string); };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleMenuItemImage = (itemId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        setTv2MenuItems(prev => prev.map(item => item.id === itemId ? { ...item, image: reader.result as string } : item));
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleFeaturedImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { if (reader.result) setTv2FeaturedImage(reader.result as string); };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleComboImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { if (reader.result) setTv2ComboImage(reader.result as string); };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleKidsImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { if (reader.result) setTv2KidsImage(reader.result as string); };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const updateMenuItem = (id: number, field: keyof MenuItem, value: string) => {
    setTv2MenuItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const addMenuItem = () => {
    const nextId = tv2MenuItems.length > 0 ? Math.max(...tv2MenuItems.map(m => m.id)) + 1 : 1;
    setTv2MenuItems(prev => [...prev, { id: nextId, name: "NEW ITEM", price: "$0.00", calories: "CAL 0", description: "", image: null, animation: "none" }]);
  };

  const removeMenuItem = (id: number) => {
    setTv2MenuItems(prev => prev.filter(item => item.id !== id));
  };

  const updateKidsItem = (id: number, field: keyof KidsMenuItem, value: string) => {
    setTv2KidsMenu(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const addKidsItem = () => {
    const nextId = tv2KidsMenu.length > 0 ? Math.max(...tv2KidsMenu.map(m => m.id)) + 1 : 1;
    setTv2KidsMenu(prev => [...prev, { id: nextId, name: "NEW ITEM", price: "$0.00", animation: "none" }]);
  };

  const removeKidsItem = (id: number) => {
    setTv2KidsMenu(prev => prev.filter(item => item.id !== id));
  };

  const getAnimStyle = (anim: string, color?: string) => {
    if (anim === "none") return {};
    return {
      animation: `tv2_${anim} ${anim === "flash" ? "1.5s" : anim === "slideIn" ? "1s" : "2s"} ${anim === "slideIn" ? "ease-out forwards" : "ease-in-out infinite"}`,
      ...(anim === "glow" && color ? { textShadow: `0 0 10px ${color}, 0 0 20px ${color}, 0 0 30px ${color}` } : {}),
    };
  };

  const tv1Size = TV_SIZES[tv1SizeIndex];
  const tv2Size = TV_SIZES[tv2SizeIndex];
  const tv3Size = TV_SIZES[tv3SizeIndex];
  const tv4Size = TV_SIZES[tv4SizeIndex];
  const tv5Size = TV_SIZES[tv5SizeIndex];
  const tv6Size = TV_SIZES[tv6SizeIndex];
  const tv7Size = TV_SIZES[tv7SizeIndex];
  const tv8Size = TV_SIZES[tv8SizeIndex];
  const tv9Size = TV_SIZES[tv9SizeIndex];

  const tv3AnimStyle = (anim: string): React.CSSProperties => {
    if (anim === "none") return {};
    const map: Record<string, string> = {
      pulse: "tv3_pulse 2s ease-in-out infinite",
      bounce: "tv3_bounce 1.5s ease-in-out infinite",
      glow: "tv3_glow 2s ease-in-out infinite",
      shake: "tv3_shake 1.5s ease-in-out infinite",
      float: "tv3_float 3s ease-in-out infinite",
    };
    return { animation: map[anim] || "" };
  };

  const tv4AnimStyle = (anim: string): React.CSSProperties => {
    if (anim === "none") return {};
    const map: Record<string, string> = {
      pulse: "tv4_pulse 2s ease-in-out infinite",
      bounce: "tv4_bounce 1.5s ease-in-out infinite",
      glow: "tv4_glow 2s ease-in-out infinite",
      shake: "tv4_shake 1.5s ease-in-out infinite",
      float: "tv4_float 3s ease-in-out infinite",
      rotate: "tv4_rotate 8s linear infinite",
      rotateSlow: "tv4_rotate 15s linear infinite",
      rotateFast: "tv4_rotate 4s linear infinite",
      swing: "tv4_swing 2s ease-in-out infinite",
      flash: "tv4_flash 1.5s ease-in-out infinite",
      slideIn: "tv4_slideIn 1s ease-out forwards",
      zoomPulse: "tv4_zoomPulse 3s ease-in-out infinite",
    };
    return { animation: map[anim] || "" };
  };

  const tv5AnimStyle = (anim: string): React.CSSProperties => {
    if (anim === "none") return {};
    const map: Record<string, string> = {
      pulse: "tv5_pulse 2s ease-in-out infinite",
      bounce: "tv5_bounce 1.5s ease-in-out infinite",
      glow: "tv5_glow 2s ease-in-out infinite",
      shake: "tv5_shake 1.5s ease-in-out infinite",
      float: "tv5_float 3s ease-in-out infinite",
      rotate: "tv5_rotate 8s linear infinite",
      rotateSlow: "tv5_rotate 15s linear infinite",
      rotateFast: "tv5_rotate 4s linear infinite",
      swing: "tv5_swing 2s ease-in-out infinite",
      flash: "tv5_flash 1.5s ease-in-out infinite",
      slideIn: "tv5_slideIn 1s ease-out forwards",
      zoomPulse: "tv5_zoomPulse 3s ease-in-out infinite",
    };
    return { animation: map[anim] || "" };
  };

  const tv6AnimStyle = (anim: string): React.CSSProperties => {
    if (anim === "none") return {};
    const map: Record<string, string> = {
      pulse: "tv6_pulse 2s ease-in-out infinite",
      bounce: "tv6_bounce 1.5s ease-in-out infinite",
      glow: "tv6_glow 2s ease-in-out infinite",
      shake: "tv6_shake 1.5s ease-in-out infinite",
      float: "tv6_float 3s ease-in-out infinite",
      rotate: "tv6_rotate 8s linear infinite",
      rotateSlow: "tv6_rotate 15s linear infinite",
      rotateFast: "tv6_rotate 4s linear infinite",
      swing: "tv6_swing 2s ease-in-out infinite",
      flash: "tv6_flash 1.5s ease-in-out infinite",
      slideIn: "tv6_slideIn 1s ease-out forwards",
      zoomPulse: "tv6_zoomPulse 3s ease-in-out infinite",
    };
    return { animation: map[anim] || "" };
  };

  const tv7AnimStyle = (anim: string): React.CSSProperties => {
    if (anim === "none") return {};
    const map: Record<string, string> = {
      pulse: "tv7_pulse 2s ease-in-out infinite",
      bounce: "tv7_bounce 1.5s ease-in-out infinite",
      glow: "tv7_glow 2s ease-in-out infinite",
      shake: "tv7_shake 1.5s ease-in-out infinite",
      float: "tv7_float 3s ease-in-out infinite",
      rotate: "tv7_rotate 8s linear infinite",
      rotateSlow: "tv7_rotate 15s linear infinite",
      rotateFast: "tv7_rotate 4s linear infinite",
      swing: "tv7_swing 2s ease-in-out infinite",
      flash: "tv7_flash 1.5s ease-in-out infinite",
      slideIn: "tv7_slideIn 1s ease-out forwards",
      zoomPulse: "tv7_zoomPulse 3s ease-in-out infinite",
    };
    return { animation: map[anim] || "" };
  };

  const tv8AnimStyle = (anim: string): React.CSSProperties => {
    if (anim === "none") return {};
    const map: Record<string, string> = {
      pulse: "tv8_pulse 2s ease-in-out infinite",
      bounce: "tv8_bounce 1.5s ease-in-out infinite",
      glow: "tv8_glow 2s ease-in-out infinite",
      shake: "tv8_shake 1.5s ease-in-out infinite",
      float: "tv8_float 3s ease-in-out infinite",
      rotate: "tv8_rotate 8s linear infinite",
      rotateSlow: "tv8_rotate 15s linear infinite",
      rotateFast: "tv8_rotate 4s linear infinite",
      swing: "tv8_swing 2s ease-in-out infinite",
      flash: "tv8_flash 1.5s ease-in-out infinite",
      slideIn: "tv8_slideIn 1s ease-out forwards",
      zoomPulse: "tv8_zoomPulse 3s ease-in-out infinite",
    };
    return { animation: map[anim] || "" };
  };

  const tv9AnimStyle = (anim: string): React.CSSProperties => {
    if (anim === "none") return {};
    const map: Record<string, string> = {
      pulse: "tv9_pulse 2s ease-in-out infinite",
      bounce: "tv9_bounce 1.5s ease-in-out infinite",
      glow: "tv9_glow 2s ease-in-out infinite",
      shake: "tv9_shake 1.5s ease-in-out infinite",
      float: "tv9_float 3s ease-in-out infinite",
      rotate: "tv9_rotate 8s linear infinite",
      rotateSlow: "tv9_rotate 15s linear infinite",
      rotateFast: "tv9_rotate 4s linear infinite",
      swing: "tv9_swing 2s ease-in-out infinite",
      flash: "tv9_flash 1.5s ease-in-out infinite",
      slideIn: "tv9_slideIn 1s ease-out forwards",
      zoomPulse: "tv9_zoomPulse 3s ease-in-out infinite",
      orbitSpin: "tv9_orbitSpin 6s linear infinite",
    };
    return { animation: map[anim] || "" };
  };

  const AnimSelect = ({ value, onChange, testId }: { value: string; onChange: (v: string) => void; testId: string }) => (
    <select value={value} onChange={e => onChange(e.target.value)} className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-1 py-1.5 text-xs mt-1" data-testid={testId}>
      {animationOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
    </select>
  );

  const getCurrentTvConfig = () => {
    const orientationMap: Record<number, string> = {
      1: tv1Orientation, 2: tv2Orientation, 3: tv3Orientation, 4: tv4Orientation,
      5: tv5Orientation, 6: tv6Orientation, 7: tv7Orientation, 8: tv8Orientation, 9: tv9Orientation,
    };
    const configs: Record<number, any> = {
      1: { bgColor, priceColor, highlightColor, mainTextColor, headerText, mainText, mainTextHighlight, sideText, sideSubText, priceText, priceAnimation, highlightAnimation, mainTextAnimation, logo, images, music: tv1Music },
      2: { bgColor: tv2BgColor, accentColor: tv2AccentColor, textColor: tv2TextColor, featuredTitle: tv2FeaturedTitle, featuredSubtitle: tv2FeaturedSubtitle, featuredPrice: tv2FeaturedPrice, featuredDesc: tv2FeaturedDesc, featuredImage: tv2FeaturedImage, logo: tv2Logo, comboText: tv2ComboText, comboPrice: tv2ComboPrice, featuredAnimation: tv2FeaturedAnimation, priceAnimation: tv2PriceAnimation, comboAnimation: tv2ComboAnimation, imageAnimation: tv2ImageAnimation, comboImage: tv2ComboImage, comboImageAnimation: tv2ComboImageAnimation, kidsImage: tv2KidsImage, kidsImageAnimation: tv2KidsImageAnimation, menuItems: tv2MenuItems, kidsMenu: tv2KidsMenu, music: tv2Music },
      3: { bgColor: tv3BgColor, accentColor: tv3AccentColor, textColor: tv3TextColor, logo: tv3Logo, starters: tv3Starters, startersImage: tv3StartersImage, startersBgImage: tv3StartersBgImage, startersImageAnim: tv3StartersImageAnim, startersTitle: tv3StartersTitle, sides: tv3Sides, sidesImage: tv3SidesImage, sidesBgImage: tv3SidesBgImage, sidesImageAnim: tv3SidesImageAnim, sidesTitle: tv3SidesTitle, cookiesText: tv3CookiesText, cookiesSubText: tv3CookiesSubText, cookiesImage: tv3CookiesImage, drinks: tv3Drinks, drinksImage: tv3DrinksImage, drinksBgImage: tv3DrinksBgImage, drinksImageAnim: tv3DrinksImageAnim, drinksTitle: tv3DrinksTitle, shakesTitle: tv3ShakesTitle, shakeSmall: tv3ShakeSmall, shakeMedium: tv3ShakeMedium, shakeLarge: tv3ShakeLarge, shakeFlavors: tv3ShakeFlavors, shakesImage: tv3ShakesImage, shakesBgImage: tv3ShakesBgImage, shakesImageAnim: tv3ShakesImageAnim, music: tv3Music },
      4: { bgColor: tv4BgColor, accentColor: tv4AccentColor, textColor: tv4TextColor, logo: tv4Logo, mainImage: tv4MainImage, mainImageAnim: tv4MainImageAnim, bgMedia: tv4BgMedia, bgMediaType: tv4BgMediaType, titleLine1: tv4TitleLine1, titleLine2: tv4TitleLine2, titleAnim: tv4TitleAnim, sizeIcon: tv4SizeIcon, sizeIconAnim: tv4SizeIconAnim, sizes: tv4Sizes, music: tv4Music },
      5: { bgColor: tv5BgColor, accentColor: tv5AccentColor, textColor: tv5TextColor, logo: tv5Logo, bgMedia: tv5BgMedia, bgMediaType: tv5BgMediaType, section1Title: tv5Section1Title, section1Subtitle: tv5Section1Subtitle, section1Items: tv5Section1Items, section2Title: tv5Section2Title, section2Subtitle: tv5Section2Subtitle, dualLeft: tv5DualLeft, dualRight: tv5DualRight, sideTitle: tv5SideTitle, sideItems: tv5SideItems, music: tv5Music },
      6: { topColor: tv6TopColor, bottomColor: tv6BottomColor, textColor: tv6TextColor, accentColor: tv6AccentColor, logo: tv6Logo, bgMedia: tv6BgMedia, bgMediaType: tv6BgMediaType, promoItems: tv6PromoItems, music: tv6Music },
      7: { topBgColor: tv7TopBgColor, bottomBgColor: tv7BottomBgColor, textColor: tv7TextColor, priceColor: tv7PriceColor, logo: tv7Logo, bgMedia: tv7BgMedia, bgMediaType: tv7BgMediaType, menuItems: tv7MenuItems, boxItems: tv7BoxItems, music: tv7Music },
      8: { bgColor: tv8BgColor, gridBgColor: tv8GridBgColor, borderColor: tv8BorderColor, textColor: tv8TextColor, priceColor: tv8PriceColor, logo: tv8Logo, bgMedia: tv8BgMedia, bgMediaType: tv8BgMediaType, featured: tv8Featured, gridItems: tv8GridItems, music: tv8Music },
      9: { bgColor: tv9BgColor, textColor: tv9TextColor, priceColor: tv9PriceColor, logo: tv9Logo, bgMedia: tv9BgMedia, bgMediaType: tv9BgMediaType, leftItems: tv9LeftItems, rightItems: tv9RightItems, music: tv9Music },
    };
    return { tvType: activeTv, orientation: orientationMap[activeTv], config: configs[activeTv] };
  };

  const base64ToBlob = (dataUrl: string): { blob: Blob; ext: string; type: string } | null => {
    try {
      const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!match) return null;
      const mime = match[1];
      const binary = atob(match[2]);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      let ext = mime.split("/")[1] || "bin";
      if (ext === "jpeg") ext = "jpg";
      if (ext === "quicktime") ext = "mov";
      if (ext === "svg+xml") ext = "svg";
      let type = "images";
      if (mime.startsWith("video/")) type = "videos";
      else if (mime === "image/gif") type = "gifs";
      else if (mime.startsWith("audio/")) type = "audio";
      return { blob: new Blob([bytes], { type: mime }), ext, type };
    } catch { return null; }
  };

  const getMediaTypeFromUrl = (url: string): { ext: string; type: string } | null => {
    const lower = url.toLowerCase();
    if (lower.match(/\.(png|jpg|jpeg|webp|svg|bmp|ico)(\?|$)/)) {
      const ext = lower.match(/\.(png|jpg|jpeg|webp|svg|bmp|ico)/)?.[1] || "png";
      return { ext: ext === "jpeg" ? "jpg" : ext, type: "images" };
    }
    if (lower.match(/\.gif(\?|$)/)) return { ext: "gif", type: "gifs" };
    if (lower.match(/\.(mp4|webm|mov|avi)(\?|$)/)) {
      const ext = lower.match(/\.(mp4|webm|mov|avi)/)?.[1] || "mp4";
      return { ext, type: "videos" };
    }
    if (lower.match(/\.(mp3|wav|ogg|m4a|aac)(\?|$)/)) {
      const ext = lower.match(/\.(mp3|wav|ogg|m4a|aac)/)?.[1] || "mp3";
      return { ext, type: "audio" };
    }
    return null;
  };

  const isMediaUrl = (val: string): boolean => {
    if (!val || typeof val !== "string") return false;
    if (val.startsWith("data:")) return false;
    if (val.startsWith("http://") || val.startsWith("https://") || val.startsWith("/") || val.startsWith("blob:")) {
      return getMediaTypeFromUrl(val) !== null;
    }
    return false;
  };

  const handleDownloadConfig = async () => {
    const data = getCurrentTvConfig();
    const zip = new JSZip();
    const configCopy = JSON.parse(JSON.stringify(data));
    let fileCounter = 0;
    const fetchPromises: Promise<void>[] = [];

    const extractMedia = (obj: any, prefix: string) => {
      if (!obj || typeof obj !== "object") return;
      for (const key of Object.keys(obj)) {
        const val = obj[key];
        if (typeof val === "string" && val.startsWith("data:")) {
          const result = base64ToBlob(val);
          if (result) {
            fileCounter++;
            const filename = `${prefix}_${key}_${fileCounter}.${result.ext}`;
            zip.folder(result.type)!.file(filename, result.blob);
            obj[key] = `${result.type}/${filename}`;
          }
        } else if (typeof val === "string" && isMediaUrl(val)) {
          const info = getMediaTypeFromUrl(val);
          if (info) {
            fileCounter++;
            const filename = `${prefix}_${key}_${fileCounter}.${info.ext}`;
            const capturedObj = obj;
            const capturedKey = key;
            fetchPromises.push(
              fetch(val).then(r => r.blob()).then(blob => {
                zip.folder(info.type)!.file(filename, blob);
                capturedObj[capturedKey] = `${info.type}/${filename}`;
              }).catch(() => {})
            );
          }
        } else if (Array.isArray(val)) {
          val.forEach((item, idx) => {
            if (typeof item === "string" && item.startsWith("data:")) {
              const result = base64ToBlob(item);
              if (result) {
                fileCounter++;
                const filename = `${prefix}_${key}_${idx + 1}.${result.ext}`;
                zip.folder(result.type)!.file(filename, result.blob);
                val[idx] = `${result.type}/${filename}`;
              }
            } else if (typeof item === "string" && isMediaUrl(item)) {
              const info = getMediaTypeFromUrl(item);
              if (info) {
                fileCounter++;
                const filename = `${prefix}_${key}_${idx + 1}.${info.ext}`;
                const capturedIdx = idx;
                fetchPromises.push(
                  fetch(item).then(r => r.blob()).then(blob => {
                    zip.folder(info.type)!.file(filename, blob);
                    val[capturedIdx] = `${info.type}/${filename}`;
                  }).catch(() => {})
                );
              }
            } else if (typeof item === "object" && item !== null) {
              extractMedia(item, `${prefix}_${key}_${idx + 1}`);
            }
          });
        } else if (typeof val === "object" && val !== null && !Array.isArray(val)) {
          extractMedia(val, `${prefix}_${key}`);
        }
      }
    };

    extractMedia(configCopy.config, `tv${activeTv}`);
    if (fetchPromises.length > 0) {
      toast({ title: "Downloading media...", description: `Fetching ${fetchPromises.length} media files` });
      await Promise.all(fetchPromises);
    }
    zip.file(`tv${activeTv}-config.json`, JSON.stringify(configCopy, null, 2));

    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tv${activeTv}-design.zip`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Downloaded", description: `TV ${activeTv} design downloaded as ZIP with media folders` });
  };

  const handleDownloadForUsb = async () => {
    toast({ title: "Generating USB file...", description: "Creating offline TV display file" });

    try {
      const config = getCurrentTvConfig();
      const configJson = JSON.stringify(config);

      const convertToBase64 = async (url: string): Promise<string> => {
        try {
          if (url.startsWith("data:")) return url;
          const response = await fetch(url);
          const blob = await response.blob();
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => resolve(url);
            reader.readAsDataURL(blob);
          });
        } catch {
          return url;
        }
      };

      const mediaUrls: string[] = [];
      const findMedia = (obj: any) => {
        if (!obj || typeof obj !== "object") return;
        for (const key of Object.keys(obj)) {
          const val = obj[key];
          if (typeof val === "string" && (val.startsWith("data:") || val.startsWith("http") || val.startsWith("/objects/"))) {
            mediaUrls.push(val);
          } else if (Array.isArray(val)) {
            val.forEach(item => {
              if (typeof item === "string" && (item.startsWith("data:") || item.startsWith("http") || item.startsWith("/objects/"))) {
                mediaUrls.push(item);
              } else if (typeof item === "object") findMedia(item);
            });
          } else if (typeof val === "object") {
            findMedia(val);
          }
        }
      };
      findMedia(config.config);

      const mediaMap: Record<string, string> = {};
      for (const url of mediaUrls) {
        if (!mediaMap[url]) {
          mediaMap[url] = await convertToBase64(url);
        }
      }

      const configCopy = JSON.parse(configJson);
      for (const [original, base64] of Object.entries(mediaMap)) {
        if (original !== base64) {
          const strConfig = JSON.stringify(configCopy);
          const replaced = strConfig.split(JSON.stringify(original).slice(1, -1)).join(JSON.stringify(base64).slice(1, -1));
          Object.assign(configCopy, JSON.parse(replaced));
        }
      }
      const safeConfigStr = JSON.stringify(configCopy);

      const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>TV Display ${activeTv} - USB Playback</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { width: 100%; height: 100%; overflow: hidden; background: #000; font-family: 'Segoe UI', Arial, sans-serif; }
.fullscreen { width: 100vw; height: 100vh; display: flex; align-items: center; justify-content: center; }

@keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
@keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
@keyframes glow { 0%, 100% { filter: brightness(1); } 50% { filter: brightness(1.3); } }
@keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
@keyframes flash { 0%, 50%, 100% { opacity: 1; } 25%, 75% { opacity: 0.5; } }
@keyframes swing { 0%, 100% { transform: rotate(0deg); } 25% { transform: rotate(3deg); } 75% { transform: rotate(-3deg); } }
@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
@keyframes slideIn { 0% { transform: translateX(-20px); opacity: 0; } 100% { transform: translateX(0); opacity: 1; } }
@keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes rotateSlow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes rotateFast { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes zoomPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.15); } }
@keyframes orbitSpin { from { transform: rotate(0deg) translateX(20px) rotate(0deg); } to { transform: rotate(360deg) translateX(20px) rotate(-360deg); } }
@keyframes productRotate { from { transform: rotateY(0deg); } to { transform: rotateY(360deg); } }

.anim-pulse { animation: pulse 2s infinite; }
.anim-bounce { animation: bounce 1.5s infinite; }
.anim-glow { animation: glow 2s infinite; }
.anim-shake { animation: shake 0.5s infinite; }
.anim-flash { animation: flash 2s infinite; }
.anim-swing { animation: swing 2s infinite; }
.anim-float { animation: float 3s ease-in-out infinite; }
.anim-slideIn { animation: slideIn 1s ease-out; }
.anim-rotate { animation: rotate 4s linear infinite; }
.anim-rotateSlow { animation: rotateSlow 8s linear infinite; }
.anim-rotateFast { animation: rotateFast 2s linear infinite; }
.anim-zoomPulse { animation: zoomPulse 2s infinite; }
.anim-orbitSpin { animation: orbitSpin 4s linear infinite; }
.anim-Rotate { animation: rotate 4s linear infinite; }
.anim-RotateSlow { animation: rotateSlow 8s linear infinite; }
.anim-RotateFast { animation: rotateFast 2s linear infinite; }
.anim-Pulse { animation: pulse 2s infinite; }
.anim-Bounce { animation: bounce 1.5s infinite; }
.anim-Glow { animation: glow 2s infinite; }
.anim-Shake { animation: shake 0.5s infinite; }
.anim-Float { animation: float 3s ease-in-out infinite; }
.anim-Swing { animation: swing 2s infinite; }
.anim-Flash { animation: flash 2s infinite; }
.anim-ZoomPulse { animation: zoomPulse 2s infinite; }
.anim-SlideIn { animation: slideIn 1s ease-out; }
.anim-OrbitSpin { animation: orbitSpin 4s linear infinite; }

.instructions {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(135deg, #0f172a, #1e293b);
  color: white; display: flex; flex-direction: column; align-items: center; justify-content: center;
  z-index: 9999; padding: 40px; text-align: center;
}
.instructions h1 { font-size: 2.5em; margin-bottom: 20px; color: #38bdf8; }
.instructions p { font-size: 1.2em; margin: 8px 0; color: #94a3b8; max-width: 600px; }
.instructions .step { background: #1e3a5f; border-radius: 12px; padding: 20px 30px; margin: 10px 0; width: 100%; max-width: 500px; text-align: left; }
.instructions .step-num { color: #38bdf8; font-weight: bold; font-size: 1.3em; }
.instructions button { margin-top: 30px; padding: 15px 50px; font-size: 1.3em; background: #2563eb; border: none; border-radius: 12px; color: white; cursor: pointer; font-weight: bold; }
.instructions button:hover { background: #1d4ed8; }
</style>
</head>
<body>
<div class="instructions" id="instructions">
  <h1>\\uD83D\\uDCFA TV Display Ready</h1>
  <p style="color:#e2e8f0;font-size:1.4em;margin-bottom:20px;">TV ${activeTv} - Offline USB Playback</p>
  <div class="step"><span class="step-num">How to use:</span><br>1. Copy this HTML file to a USB drive<br>2. Plug USB into your Smart TV<br>3. Open this file from TV's file browser<br>4. Press the button below to start fullscreen</div>
  <p style="color:#64748b;font-size:0.9em;">Works on Smart TVs with built-in web browser (Samsung, LG, Sony, etc.)</p>
  <button onclick="startDisplay()">Start Full Screen Display</button>
</div>
<div id="display" class="fullscreen" style="display:none;"></div>
<script id="config-data" type="application/json">${safeConfigStr.replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/\`/g, '\\u0060')}</script>

<script>
var CONFIG = JSON.parse(document.getElementById('config-data').textContent);

function startDisplay() {
  document.getElementById('instructions').style.display = 'none';
  document.getElementById('display').style.display = 'flex';
  
  try {
    document.documentElement.requestFullscreen && document.documentElement.requestFullscreen();
  } catch(e) {}
  
  renderDisplay();
  
  if (CONFIG.config && CONFIG.config.music) {
    var audio = new Audio(CONFIG.config.music);
    audio.loop = true;
    audio.volume = 0.5;
    audio.play().catch(function(){});
  }
}

function getAnimClass(anim) {
  if (!anim || anim === 'None' || anim === 'none') return '';
  return 'anim-' + anim;
}

function renderDisplay() {
  var c = CONFIG.config || {};
  var el = document.getElementById('display');
  var tv = CONFIG.tvType;
  
  if (tv === 1) renderTv1(el, c);
  else if (tv === 2) renderTv2(el, c);
  else if (tv === 4) renderTv4(el, c);
  else if (tv === 6) renderTv6(el, c);
  else if (tv === 7) renderTv7(el, c);
  else if (tv === 8) renderTv8(el, c);
  else {
    el.innerHTML = '<div style="color:white;text-align:center;font-size:2em;">TV ' + tv + ' display loaded.<br>Config data embedded.</div>';
  }
}

function renderTv1(el, c) {
  var bgColor = c.bgColor || '#FF8C00';
  var images = c.images || [];
  var mainColor = c.mainTextColor || '#FFFFFF';
  var hlColor = c.highlightColor || '#FFD700';
  var pColor = c.priceColor || '#FFFFFF';
  var mainAnim = c.mainTextAnimation || 'none';
  var hlAnim = c.highlightAnimation || 'none';
  var priceAnim = c.priceAnimation || 'none';
  
  el.style.background = bgColor;
  el.style.position = 'relative';
  el.style.width = '100vw';
  el.style.height = '100vh';
  el.style.overflow = 'hidden';
  
  var style = document.createElement('style');
  style.textContent = '\\n' +
    '@keyframes pricePopIn { 0% { transform: scale(0) rotate(-20deg); opacity: 0; } 50% { transform: scale(1.2) rotate(8deg); } 100% { transform: scale(1) rotate(5deg); opacity: 1; } }\\n' +
    '@keyframes price_pulse { 0%,100% { transform: scale(1) rotate(5deg); } 50% { transform: scale(1.15) rotate(5deg); } }\\n' +
    '@keyframes price_bounce { 0%,100% { transform: translateY(0) rotate(5deg); } 50% { transform: translateY(-15px) rotate(5deg); } }\\n' +
    '@keyframes price_glow { 0%,100% { filter: brightness(1); } 50% { filter: brightness(1.4); } }\\n' +
    '@keyframes price_shake { 0%,100% { transform: translateX(0) rotate(5deg); } 25% { transform: translateX(-8px) rotate(5deg); } 75% { transform: translateX(8px) rotate(5deg); } }\\n' +
    '@keyframes price_flash { 0%,50%,100% { opacity: 1; } 25%,75% { opacity: 0.4; } }\\n' +
    '@keyframes price_swing { 0%,100% { transform: rotate(0deg); } 25% { transform: rotate(8deg); } 75% { transform: rotate(-3deg); } }\\n' +
    '@keyframes anim_pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.05); } }\\n' +
    '@keyframes anim_bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }\\n' +
    '@keyframes anim_glow { 0%,100% { filter: brightness(1); } 50% { filter: brightness(1.4); } }\\n' +
    '@keyframes anim_shake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }\\n' +
    '@keyframes anim_flash { 0%,50%,100% { opacity: 1; } 25%,75% { opacity: 0.5; } }\\n' +
    '@keyframes anim_swing { 0%,100% { transform: rotate(0deg); } 25% { transform: rotate(3deg); } 75% { transform: rotate(-3deg); } }\\n' +
    '@keyframes sideSlideIn { 0% { transform: rotate(-5deg) translateX(-40px); opacity: 0; } 100% { transform: rotate(-5deg) translateX(0); opacity: 1; } }\\n' +
    '@keyframes imgFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }\\n' +
    '@keyframes headerSlideDown { 0% { transform: translateY(-30px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }\\n';
  document.head.appendChild(style);
  
  var html = '';
  if (c.logo) html += '<img src="' + c.logo + '" style="position:absolute;top:20px;left:20px;width:60px;height:60px;border-radius:50%;object-fit:cover;z-index:5;" />';
  
  html += '<div style="position:absolute;top:7%;left:5%;right:35%;text-align:center;z-index:5;animation:headerSlideDown 0.8s ease-out;">';
  html += '<div style="font-size:clamp(1.8em,3.5vw,3em);font-weight:900;color:' + mainColor + ';text-transform:uppercase;letter-spacing:3px;text-shadow:2px 3px 6px rgba(0,0,0,0.3);font-family:Arial Black,Impact,sans-serif;' + (mainAnim !== 'none' ? 'animation:anim_' + mainAnim + ' 2s ease-in-out infinite;' : '') + '">' + (c.headerText || '') + '</div>';
  html += '<div style="font-size:clamp(2.5em,6vw,5em);font-weight:900;margin-top:10px;font-family:Arial Black,Impact,sans-serif;">';
  html += '<span style="color:' + mainColor + ';text-shadow:2px 3px 6px rgba(0,0,0,0.3);' + (mainAnim !== 'none' ? 'animation:anim_' + mainAnim + ' 2s ease-in-out infinite;display:inline-block;' : '') + '">' + (c.mainText || '') + ' </span>';
  var hlShadow = hlAnim === 'glow' ? '0 0 10px ' + hlColor + ',0 0 20px ' + hlColor : '';
  html += '<span style="color:' + hlColor + ';display:inline-block;font-size:110%;' + (hlShadow ? 'text-shadow:' + hlShadow + ';' : '') + (hlAnim !== 'none' ? 'animation:anim_' + hlAnim + (hlAnim === 'flash' ? ' 1.5s' : ' 2s') + ' ease-in-out infinite;' : '') + '">' + (c.mainTextHighlight || '') + '</span>';
  html += '</div></div>';
  
  if (c.sideText) {
    html += '<div style="position:absolute;bottom:8%;left:4%;background:rgba(0,0,0,0.75);color:white;padding:18px 28px;border-radius:14px;transform:rotate(-5deg);max-width:220px;text-align:center;z-index:5;animation:sideSlideIn 1s ease-out;backdrop-filter:blur(5px);">';
    html += '<div style="font-size:1.3em;font-weight:bold;letter-spacing:0.5px;">' + c.sideText + '</div>';
    if (c.sideSubText) html += '<div style="font-size:0.85em;margin-top:6px;opacity:0.8;">' + c.sideSubText + '</div>';
    html += '</div>';
  }
  
  if (c.priceText) {
    var priceShadow = priceAnim === 'glow' ? '0 0 10px ' + pColor + ',0 0 20px ' + pColor + ',0 0 40px ' + pColor : '2px 3px 6px rgba(0,0,0,0.4)';
    var priceAnimStyle = priceAnim !== 'none' ? 'animation:price_' + priceAnim + (priceAnim === 'flash' ? ' 1.5s' : ' 2s') + ' ease-in-out infinite;' : 'animation:pricePopIn 0.8s ease-out;';
    html += '<div style="position:absolute;top:5%;right:5%;text-align:right;z-index:5;' + priceAnimStyle + '">';
    var pt = c.priceText;
    html += '<div style="font-size:clamp(2.5em,6vw,5em);font-weight:900;color:' + pColor + ';font-family:Arial Black,Impact,sans-serif;text-shadow:' + priceShadow + ';line-height:0.9;transform:rotate(5deg);">';
    html += '<span style="font-size:55%;vertical-align:super;">' + pt.charAt(0) + '</span>' + pt.slice(1, -2) + '<span style="font-size:60%;vertical-align:super;">' + pt.slice(-2) + '</span>';
    html += '</div></div>';
  }
  
  if (images.length > 0) {
    var productHtml = '<div style="position:absolute;bottom:3%;right:3%;display:flex;gap:20px;align-items:flex-end;z-index:5;">';
    images.forEach(function(img, i) {
      var src = typeof img === 'string' ? img : (img.src || '');
      productHtml += '<img src="' + src + '" style="max-height:35vh;max-width:30vw;object-fit:contain;filter:drop-shadow(0 8px 20px rgba(0,0,0,0.5));animation:imgFloat 3s ease-in-out infinite;animation-delay:' + (i * 0.3) + 's;" />';
    });
    productHtml += '</div>';
    html += productHtml;
  }
  
  el.innerHTML = html;
  
  if (images.length > 1) {
    var imgEls = el.querySelectorAll('img[style*="max-height:35vh"]');
    var current = 0;
    imgEls.forEach(function(img, i) { img.style.opacity = i === 0 ? '1' : '0'; img.style.transition = 'opacity 0.8s ease'; img.style.position = i > 0 ? 'absolute' : 'relative'; });
    setInterval(function() {
      imgEls[current].style.opacity = '0';
      current = (current + 1) % imgEls.length;
      imgEls[current].style.opacity = '1';
    }, 3000);
  }
}

function renderTv2(el, c) { genericRender(el, c, 'Menu Board'); }
function renderTv4(el, c) {
  var bgColor = c.bgColor || '#1a1a2e';
  el.style.background = bgColor;
  el.style.width = '100vw';
  el.style.height = '100vh';
  el.style.position = 'relative';
  el.style.overflow = 'hidden';
  
  if (c.bgMedia) {
    var isVideo = /\\.(mp4|webm|mov)/i.test(c.bgMedia);
    if (isVideo) el.innerHTML = '<video src="' + c.bgMedia + '" autoplay loop muted playsinline style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0.4;" />';
    else el.innerHTML = '<img src="' + c.bgMedia + '" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0.4;" />';
  }
  
  var html = '<div style="position:relative;z-index:1;width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px;">';
  if (c.logo) html += '<img src="' + c.logo + '" style="width:80px;height:80px;border-radius:50%;object-fit:cover;margin-bottom:20px;" />';
  html += '<div style="font-size:clamp(2em,5vw,4em);font-weight:900;color:' + (c.textColor || '#fff') + ';text-align:center;margin-bottom:10px;" class="' + getAnimClass(c.titleAnimation) + '">' + (c.title1 || '') + '</div>';
  html += '<div style="font-size:clamp(1.5em,3vw,2.5em);font-weight:700;color:' + (c.accentColor || '#ff6b35') + ';text-align:center;margin-bottom:30px;" class="' + getAnimClass(c.titleAnimation) + '">' + (c.title2 || '') + '</div>';
  
  if (c.productImage) html += '<img src="' + c.productImage + '" style="max-height:35vh;max-width:50vw;object-fit:contain;margin-bottom:20px;" class="' + getAnimClass(c.productAnimation) + '" />';
  
  if (c.sizes && c.sizes.length > 0) {
    html += '<div style="display:flex;gap:30px;flex-wrap:wrap;justify-content:center;">';
    c.sizes.forEach(function(s) {
      html += '<div style="text-align:center;background:rgba(255,255,255,0.1);border-radius:16px;padding:20px 30px;">';
      html += '<div style="font-size:1em;color:' + (c.textColor || '#fff') + ';opacity:0.7;">' + (s.label || '') + '</div>';
      html += '<div style="font-size:1.8em;font-weight:900;color:' + (c.accentColor || '#ff6b35') + ';">' + (s.price || '') + '</div>';
      html += '</div>';
    });
    html += '</div>';
  }
  html += '</div>';
  el.innerHTML += html;
}

function renderTv6(el, c) {
  el.style.width = '100vw';
  el.style.height = '100vh';
  el.style.position = 'relative';
  el.style.background = 'linear-gradient(to bottom, ' + (c.topColor || '#1a1a2e') + ' 50%, ' + (c.bottomColor || '#16213e') + ' 50%)';
  
  if (c.bgMedia) {
    var isVideo = /\\.(mp4|webm|mov)/i.test(c.bgMedia);
    if (isVideo) el.innerHTML = '<video src="' + c.bgMedia + '" autoplay loop muted playsinline style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;" />';
    else el.innerHTML = '<img src="' + c.bgMedia + '" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;" />';
  }
  
  var items = c.promoItems || [];
  var html = '<div style="position:relative;z-index:1;width:100%;height:100%;display:flex;align-items:center;justify-content:center;gap:20px;padding:40px;">';
  items.forEach(function(item, i) {
    var scale = i === Math.floor(items.length / 2) ? '1.1' : '1';
    html += '<div style="text-align:center;transform:scale(' + scale + ');flex:1;max-width:300px;" class="' + getAnimClass(item.animation) + '">';
    if (item.image) html += '<img src="' + item.image + '" style="width:100%;max-height:40vh;object-fit:contain;margin-bottom:15px;" />';
    html += '<div style="font-size:1.3em;font-weight:bold;color:' + (c.textColor || '#fff') + ';">' + (item.title || '') + '</div>';
    html += '<div style="font-size:1.8em;font-weight:900;color:' + (c.accentColor || '#ff6b35') + ';">' + (item.price || '') + '</div>';
    html += '</div>';
  });
  html += '</div>';
  el.innerHTML += html;
}

function renderTv7(el, c) { genericRender(el, c, 'Menu & Boxes'); }
function renderTv8(el, c) { genericRender(el, c, 'Featured + Grid'); }

function genericRender(el, c, label) {
  el.style.width = '100vw';
  el.style.height = '100vh';
  el.style.background = c.bgColor || '#1a1a2e';
  el.style.color = c.textColor || '#ffffff';
  el.style.display = 'flex';
  el.style.alignItems = 'center';
  el.style.justifyContent = 'center';
  el.innerHTML = '<div style="text-align:center;"><div style="font-size:3em;font-weight:900;margin-bottom:20px;">' + label + '</div><div style="font-size:1.5em;opacity:0.7;">Display loaded from USB</div></div>';
}
</script>
</body>
</html>`;

      const blob = new Blob([htmlContent], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tv${activeTv}-usb-display.html`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "USB file ready!", description: "Copy the HTML file to your USB drive, plug into TV, and open it" });
    } catch (err: any) {
      toast({ title: "Download failed", description: err.message, variant: "destructive" });
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch("/api/tv-display-customers");
      if (res.ok) setCustomers(await res.json());
    } catch {}
  };

  const addCustomer = async () => {
    if (!newCustName || !newCustUsername || !newCustPassword) {
      toast({ title: "Missing fields", description: "Name, username, and password are required", variant: "destructive" });
      return;
    }
    if (newCustTvs.length === 0) {
      toast({ title: "No TVs selected", description: "Please select at least one TV", variant: "destructive" });
      return;
    }
    try {
      const res = await fetch("/api/tv-display-customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCustName, username: newCustUsername, password: newCustPassword, assignedTvs: newCustTvs }),
      });
      if (res.ok) {
        setNewCustName(""); setNewCustUsername(""); setNewCustPassword(""); setNewCustTvs([]);
        fetchCustomers();
        fetch("/api/tv-display-customers").then(r => r.ok ? r.json() : []).then(setAllCustomers).catch(() => {});
        toast({ title: "Customer added", description: `Login URL: ${window.location.origin}/tv-login` });
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.error, variant: "destructive" });
      }
    } catch { toast({ title: "Error", description: "Failed to add customer", variant: "destructive" }); }
  };

  const toggleCustomer = async (id: string, currentActive: boolean) => {
    try {
      await fetch(`/api/tv-display-customers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentActive }),
      });
      fetchCustomers();
    } catch {}
  };

  const deleteCustomer = async (id: string) => {
    try {
      await fetch(`/api/tv-display-customers/${id}`, { method: "DELETE" });
      fetchCustomers();
      toast({ title: "Deleted", description: "Customer removed" });
    } catch {}
  };

  const updateCustomerTvs = async (id: string, tvs: number[]) => {
    try {
      await fetch(`/api/tv-display-customers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedTvs: tvs }),
      });
      fetchCustomers();
    } catch {}
  };

  useEffect(() => { if (showCustomerPanel) fetchCustomers(); }, [showCustomerPanel]);

  useEffect(() => {
    fetch("/api/tv-display-customers").then(r => r.ok ? r.json() : []).then(setAllCustomers).catch(() => {});
  }, []);

  const applyTvConfig = (tvNum: number, c: any) => {
    if (!c || Object.keys(c).length === 0) return;
    if (tvNum === 1) {
      setBgColor(c.bgColor ?? "#FF8C00"); setPriceColor(c.priceColor ?? "#FFFFFF");
      setHighlightColor(c.highlightColor ?? "#FFD700"); setMainTextColor(c.mainTextColor ?? "#FFFFFF");
      setHeaderText(c.headerText ?? ""); setMainText(c.mainText ?? "");
      setMainTextHighlight(c.mainTextHighlight ?? ""); setSideText(c.sideText ?? "");
      setSideSubText(c.sideSubText ?? ""); setPriceText(c.priceText ?? "");
      setPriceAnimation(c.priceAnimation ?? "none"); setHighlightAnimation(c.highlightAnimation ?? "none");
      setMainTextAnimation(c.mainTextAnimation ?? "none"); setLogo(c.logo ?? null);
      setImages(c.images ?? []); setTv1Music(c.music ?? null);
    } else if (tvNum === 2) {
      setTv2BgColor(c.bgColor ?? "#1a1a1a"); setTv2AccentColor(c.accentColor ?? "#DAA520");
      setTv2TextColor(c.textColor ?? "#FFFFFF"); setTv2FeaturedTitle(c.featuredTitle ?? "");
      setTv2FeaturedSubtitle(c.featuredSubtitle ?? ""); setTv2FeaturedPrice(c.featuredPrice ?? "");
      setTv2FeaturedDesc(c.featuredDesc ?? ""); setTv2FeaturedImage(c.featuredImage ?? null);
      setTv2Logo(c.logo ?? null); setTv2ComboText(c.comboText ?? "");
      setTv2ComboPrice(c.comboPrice ?? ""); setTv2FeaturedAnimation(c.featuredAnimation ?? "none");
      setTv2PriceAnimation(c.priceAnimation ?? "none"); setTv2ComboAnimation(c.comboAnimation ?? "none");
      setTv2ImageAnimation(c.imageAnimation ?? "none"); setTv2ComboImage(c.comboImage ?? null);
      setTv2ComboImageAnimation(c.comboImageAnimation ?? "none"); setTv2KidsImage(c.kidsImage ?? null);
      setTv2KidsImageAnimation(c.kidsImageAnimation ?? "none");
      if (c.menuItems) setTv2MenuItems(c.menuItems);
      if (c.kidsMenu) setTv2KidsMenu(c.kidsMenu);
      setTv2Music(c.music ?? null);
    } else if (tvNum === 3) {
      setTv3BgColor(c.bgColor ?? "#1a1a1a"); setTv3AccentColor(c.accentColor ?? "#DAA520");
      setTv3TextColor(c.textColor ?? "#FFFFFF"); setTv3Logo(c.logo ?? null);
      if (c.starters) setTv3Starters(c.starters); setTv3StartersImage(c.startersImage ?? null);
      setTv3StartersBgImage(c.startersBgImage ?? null); setTv3StartersImageAnim(c.startersImageAnim ?? "none");
      setTv3StartersTitle(c.startersTitle ?? "Starters");
      if (c.sides) setTv3Sides(c.sides); setTv3SidesImage(c.sidesImage ?? null);
      setTv3SidesBgImage(c.sidesBgImage ?? null); setTv3SidesImageAnim(c.sidesImageAnim ?? "none");
      setTv3SidesTitle(c.sidesTitle ?? "Sides");
      setTv3CookiesText(c.cookiesText ?? ""); setTv3CookiesSubText(c.cookiesSubText ?? "");
      setTv3CookiesImage(c.cookiesImage ?? null);
      if (c.drinks) setTv3Drinks(c.drinks); setTv3DrinksImage(c.drinksImage ?? null);
      setTv3DrinksBgImage(c.drinksBgImage ?? null); setTv3DrinksImageAnim(c.drinksImageAnim ?? "none");
      setTv3DrinksTitle(c.drinksTitle ?? "Drinks");
      setTv3ShakesTitle(c.shakesTitle ?? ""); setTv3ShakeSmall(c.shakeSmall ?? "");
      setTv3ShakeMedium(c.shakeMedium ?? ""); setTv3ShakeLarge(c.shakeLarge ?? "");
      setTv3ShakeFlavors(c.shakeFlavors ?? ""); setTv3ShakesImage(c.shakesImage ?? null);
      setTv3ShakesBgImage(c.shakesBgImage ?? null); setTv3ShakesImageAnim(c.shakesImageAnim ?? "none");
      setTv3Music(c.music ?? null);
    } else if (tvNum === 4) {
      setTv4BgColor(c.bgColor ?? "#1a1a2e"); setTv4AccentColor(c.accentColor ?? "#ff6b35");
      setTv4TextColor(c.textColor ?? "#ffffff"); setTv4Logo(c.logo ?? null);
      setTv4MainImage(c.mainImage ?? null); setTv4MainImageAnim(c.mainImageAnim ?? "none");
      setTv4BgMedia(c.bgMedia ?? null); setTv4BgMediaType(c.bgMediaType ?? "image");
      setTv4TitleLine1(c.titleLine1 ?? ""); setTv4TitleLine2(c.titleLine2 ?? "");
      setTv4TitleAnim(c.titleAnim ?? "none"); setTv4SizeIcon(c.sizeIcon ?? null);
      setTv4SizeIconAnim(c.sizeIconAnim ?? "none");
      if (c.sizes) setTv4Sizes(c.sizes); setTv4Music(c.music ?? null);
    } else if (tvNum === 5) {
      setTv5BgColor(c.bgColor ?? "#0f0f0f"); setTv5AccentColor(c.accentColor ?? "#e63946");
      setTv5TextColor(c.textColor ?? "#ffffff"); setTv5Logo(c.logo ?? null);
      setTv5BgMedia(c.bgMedia ?? null); setTv5BgMediaType(c.bgMediaType ?? "image");
      setTv5Section1Title(c.section1Title ?? ""); setTv5Section1Subtitle(c.section1Subtitle ?? "");
      if (c.section1Items) setTv5Section1Items(c.section1Items);
      setTv5Section2Title(c.section2Title ?? ""); setTv5Section2Subtitle(c.section2Subtitle ?? "");
      if (c.dualLeft) setTv5DualLeft(c.dualLeft); if (c.dualRight) setTv5DualRight(c.dualRight);
      setTv5SideTitle(c.sideTitle ?? ""); if (c.sideItems) setTv5SideItems(c.sideItems);
      setTv5Music(c.music ?? null);
    } else if (tvNum === 6) {
      setTv6TopColor(c.topColor ?? "#1a1a2e"); setTv6BottomColor(c.bottomColor ?? "#16213e");
      setTv6TextColor(c.textColor ?? "#ffffff"); setTv6AccentColor(c.accentColor ?? "#ff6b35");
      setTv6Logo(c.logo ?? null); setTv6BgMedia(c.bgMedia ?? null); setTv6BgMediaType(c.bgMediaType ?? "image");
      if (c.promoItems) setTv6PromoItems(c.promoItems); setTv6Music(c.music ?? null);
    } else if (tvNum === 7) {
      setTv7TopBgColor(c.topBgColor ?? "#1a1a1a"); setTv7BottomBgColor(c.bottomBgColor ?? "#2d2d2d");
      setTv7TextColor(c.textColor ?? "#ffffff"); setTv7PriceColor(c.priceColor ?? "#ff6b35");
      setTv7Logo(c.logo ?? null); setTv7BgMedia(c.bgMedia ?? null); setTv7BgMediaType(c.bgMediaType ?? "image");
      if (c.menuItems) setTv7MenuItems(c.menuItems); if (c.boxItems) setTv7BoxItems(c.boxItems);
      setTv7Music(c.music ?? null);
    } else if (tvNum === 8) {
      setTv8BgColor(c.bgColor ?? "#0a0a0a"); setTv8GridBgColor(c.gridBgColor ?? "#1a1a1a");
      setTv8BorderColor(c.borderColor ?? "#333"); setTv8TextColor(c.textColor ?? "#ffffff");
      setTv8PriceColor(c.priceColor ?? "#ff6b35"); setTv8Logo(c.logo ?? null);
      setTv8BgMedia(c.bgMedia ?? null); setTv8BgMediaType(c.bgMediaType ?? "image");
      if (c.featured) setTv8Featured(c.featured); if (c.gridItems) setTv8GridItems(c.gridItems);
      setTv8Music(c.music ?? null);
    } else if (tvNum === 9) {
      setTv9BgColor(c.bgColor ?? "#0a0a0a"); setTv9TextColor(c.textColor ?? "#ffffff");
      setTv9PriceColor(c.priceColor ?? "#ff6b35"); setTv9Logo(c.logo ?? null);
      setTv9BgMedia(c.bgMedia ?? null); setTv9BgMediaType(c.bgMediaType ?? "image");
      if (c.leftItems) setTv9LeftItems(c.leftItems); if (c.rightItems) setTv9RightItems(c.rightItems);
      setTv9Music(c.music ?? null);
    }
  };

  const loadCustomerTvConfig = async (customerId: string, tvNum: number) => {
    try {
      const res = await fetch(`/api/tv-display-customers/${customerId}/tv/${tvNum}`);
      if (!res.ok) return;
      const data = await res.json();
      const c = data.config || {};
      if (Object.keys(c).length > 0) {
        applyTvConfig(tvNum, c);
        toast({ title: "Loaded", description: `TV ${tvNum} config loaded for customer` });
      } else {
        toast({ title: "Info", description: `No saved TV ${tvNum} config for this customer yet. Design and save.` });
      }
    } catch {}
  };

  useEffect(() => {
    if (selectedCustomerId) {
      loadCustomerTvConfig(selectedCustomerId, activeTv);
    }
  }, [selectedCustomerId, activeTv]);

  const handleCustomerChange = (custId: string) => {
    if (custId === "") {
      setSelectedCustomerId(null);
      return;
    }
    setSelectedCustomerId(custId);
  };

  const handleLoadConfig = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result as string);
          if (data.tvType) setActiveTv(data.tvType);
          toast({ title: "Loaded", description: `TV config loaded from file` });
        } catch {
          toast({ title: "Error", description: "Invalid config file", variant: "destructive" });
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleSaveToServer = async () => {
    const data = getCurrentTvConfig();
    setSaving(true);
    try {
      if (selectedCustomerId) {
        const cust = allCustomers.find(c => c.id === selectedCustomerId);
        const res = await fetch(`/api/tv-display-customers/${selectedCustomerId}/tv/${data.tvType}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            config: data.config,
            orientation: data.orientation,
            name: `TV ${data.tvType} Design`,
          }),
        });
        if (res.ok) {
          const liveUrl = `${window.location.origin}/tv-customer/${selectedCustomerId}/${data.tvType}`;
          setSavedLiveUrl(liveUrl);
          toast({ title: "Saved!", description: `TV ${data.tvType} saved for ${cust?.name || "customer"}. Live URL ready!` });
          fetch("/api/tv-display-customers").then(r => r.ok ? r.json() : []).then(setAllCustomers).catch(() => {});
        } else {
          const err = await res.json();
          toast({ title: "Save Failed", description: err.error || "Could not save", variant: "destructive" });
        }
      } else {
        const res = await fetch("/api/tv-assignments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            branchId: "default",
            tvType: data.tvType,
            name: `TV ${data.tvType} Design`,
            config: data.config,
            orientation: data.orientation,
          }),
        });
        if (res.ok) {
          const result = await res.json();
          const liveUrl = `${window.location.origin}/tv-live/${result.accessToken}`;
          setSavedLiveUrl(liveUrl);
          toast({ title: "Saved!", description: "TV display saved. Live URL generated!" });
        } else {
          const err = await res.json();
          toast({ title: "Save Failed", description: err.error || "Could not save", variant: "destructive" });
        }
      }
    } catch {
      toast({ title: "Error", description: "Connection failed", variant: "destructive" });
    }
    setSaving(false);
  };

  const MusicInput = ({ value, onChange, tvNum }: { value: string | null; onChange: (v: string | null) => void; tvNum: number }) => (
    <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
      <div className="flex items-center gap-2 mb-2">
        <Music className="h-3.5 w-3.5 text-purple-400" />
        <span className="text-xs font-semibold text-purple-300">Background Music</span>
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={value || ""}
          onChange={(e) => onChange(e.target.value || null)}
          placeholder="Paste music URL (MP3, WAV, OGG)..."
          className="flex-1 bg-slate-700 border border-slate-600 text-white rounded px-2 py-1.5 text-xs focus:outline-none focus:border-purple-500"
          data-testid={`input-tv${tvNum}-music-url`}
        />
        <label className="flex items-center gap-1 px-2 py-1.5 bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/50 rounded cursor-pointer transition text-xs text-purple-300" data-testid={`btn-tv${tvNum}-music-upload`}>
          <Upload className="h-3 w-3" />
          <span>Upload</span>
          <input type="file" accept="audio/*" className="hidden" onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = () => onChange(reader.result as string);
              reader.readAsDataURL(file);
            }
          }} />
        </label>
        {value && (
          <button onClick={() => onChange(null)} className="px-2 py-1.5 bg-red-600/30 hover:bg-red-600/50 border border-red-500/50 rounded text-xs text-red-300" data-testid={`btn-tv${tvNum}-music-clear`}>
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
      {value && (
        <div className="mt-2 flex items-center gap-2">
          <audio src={value} controls className="h-7 w-full" style={{ maxWidth: "100%" }} data-testid={`audio-tv${tvNum}-preview`} />
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white" onClick={() => navigate("/admin")} data-testid="btn-back-admin">
            <ArrowLeft className="h-4 w-4 mr-2" />Back
          </Button>
          <div className="flex items-center gap-3">
            <Tv className="h-6 w-6 text-red-500" />
            <h1 className="text-xl font-bold" data-testid="text-page-title">Shop Display Menus</h1>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <Users className="h-4 w-4 text-purple-400" />
            <select
              value={selectedCustomerId || ""}
              onChange={(e) => handleCustomerChange(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-sm min-w-[160px] focus:outline-none focus:border-purple-500"
              data-testid="select-customer"
            >
              <option value="">-- No Customer (Global) --</option>
              {allCustomers.filter(c => c.isActive).map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {selectedCustomerId && (
              <span className="text-xs text-purple-400 font-medium bg-purple-900/30 px-2 py-1 rounded">
                Editing: {allCustomers.find(c => c.id === selectedCustomerId)?.name}
              </span>
            )}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800" onClick={handleDownloadConfig} data-testid="btn-download-config">
              <Download className="h-4 w-4 mr-1" />Download
            </Button>
            <Button variant="outline" size="sm" className="border-orange-800 text-orange-400 hover:text-white hover:bg-orange-900" onClick={handleDownloadForUsb} data-testid="btn-download-usb">
              <Usb className="h-4 w-4 mr-1" />USB
            </Button>
            <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800" onClick={handleLoadConfig} data-testid="btn-load-config">
              <FolderOpen className="h-4 w-4 mr-1" />Load
            </Button>
            <Button variant="outline" size="sm" className="border-green-800 text-green-400 hover:text-white hover:bg-green-900" onClick={handleSaveToServer} disabled={saving} data-testid="btn-save-config">
              <Save className="h-4 w-4 mr-1" />{saving ? "Saving..." : "Save"}
            </Button>
            <Button variant="outline" size="sm" className="border-purple-800 text-purple-400 hover:text-white hover:bg-purple-900" onClick={() => setShowCustomerPanel(true)} data-testid="btn-customers">
              <Users className="h-4 w-4 mr-1" />Customers
            </Button>
            <Button variant="outline" size="sm" className="border-blue-800 text-blue-400 hover:text-white hover:bg-blue-900" onClick={() => navigate("/tv-admin")} data-testid="btn-tv-admin">
              <Monitor className="h-4 w-4 mr-1" />Manage TVs
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 py-8">
        <div className="flex gap-6">

          <div className="w-20 flex-shrink-0 space-y-3 max-h-[80vh] overflow-y-auto sticky top-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((tvNum) => (
              <button
                key={tvNum}
                onClick={() => setActiveTv(tvNum as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9)}
                className={`w-full aspect-square rounded-xl flex flex-col items-center justify-center gap-1 transition-all border-2 ${
                  activeTv === tvNum
                    ? "bg-red-600 border-red-500 text-white shadow-lg shadow-red-500/30"
                    : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white"
                }`}
                data-testid={`btn-select-tv-${tvNum}`}
              >
                <Tv className="h-5 w-5" />
                <span className="text-[10px] font-bold">TV {tvNum}</span>
              </button>
            ))}
          </div>

          <div className="flex-1">
            {activeTv === 1 ? (
              <div className="grid grid-cols-1 xl:grid-cols-[minmax(350px,1fr)_minmax(500px,2fr)] gap-8">
                <div className="space-y-5">
                  <h2 className="text-lg font-bold text-slate-200 border-b border-slate-700 pb-2" data-testid="text-editor-title">Layout Editor — TV 1 (Promo)</h2>
                  <MusicInput value={tv1Music} onChange={setTv1Music} tvNum={1} />

                  <div className="space-y-3">
                    <div className="flex items-end gap-4">
                      <div className="flex-shrink-0">
                        <Label className="text-slate-400 text-xs">Logo</Label>
                        <div className="mt-1 relative">
                          {logo ? (
                            <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-slate-600 relative group">
                              <img src={logo} alt="Logo" className="w-full h-full object-cover" />
                              <button onClick={() => setLogo(null)} className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" data-testid="btn-remove-logo"><X className="h-4 w-4 text-white" /></button>
                            </div>
                          ) : (
                            <div className="flex gap-1">
                              <label className="w-14 h-14 rounded-full border-2 border-dashed border-slate-600 flex flex-col items-center justify-center cursor-pointer hover:border-red-500 transition-colors" data-testid="btn-upload-logo">
                                <Upload className="h-4 w-4 text-slate-500" />
                                <input type="file" accept="image/*,video/*,.gif" className="hidden" onChange={handleLogoUpload} />
                              </label>
                              <button onClick={handlePasteImage((dataUrl) => setLogo(dataUrl))} className="w-14 h-14 rounded-full border-2 border-dashed border-purple-600 flex flex-col items-center justify-center cursor-pointer hover:border-purple-400 hover:bg-purple-900/20 transition-colors" title="Paste from clipboard" data-testid="btn-paste-logo">
                                <Clipboard className="h-4 w-4 text-purple-400" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex-1">
                        <Label className="text-slate-400 text-xs">Header Text (Line 1)</Label>
                        <Input value={headerText} onChange={e => setHeaderText(e.target.value)} className="bg-slate-800 border-slate-700 text-white mt-1" data-testid="input-header-text" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-slate-400 text-xs">Main Text (Line 2)</Label>
                        <Input value={mainText} onChange={e => setMainText(e.target.value)} className="bg-slate-800 border-slate-700 text-white mt-1" data-testid="input-main-text" />
                      </div>
                      <div>
                        <Label className="text-slate-400 text-xs">Highlight Word</Label>
                        <Input value={mainTextHighlight} onChange={e => setMainTextHighlight(e.target.value)} className="bg-slate-800 border-slate-700 text-white mt-1" data-testid="input-highlight-text" />
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <Label className="text-slate-400 text-xs">Main Text Color</Label>
                        <input type="color" value={mainTextColor} onChange={e => setMainTextColor(e.target.value)} className="w-full h-8 rounded cursor-pointer border-0 mt-1" data-testid="input-main-text-color" />
                      </div>
                      <div>
                        <Label className="text-slate-400 text-xs">Main Animation</Label>
                        <select value={mainTextAnimation} onChange={e => setMainTextAnimation(e.target.value)} className="w-full bg-slate-800 border border-slate-700 text-white mt-1 rounded-md px-1 py-2 text-xs" data-testid="select-main-animation">
                          <option value="none">None</option><option value="pulse">Pulse</option><option value="bounce">Bounce</option><option value="glow">Glow</option><option value="shake">Shake</option><option value="flash">Flash</option><option value="swing">Swing</option>
                        </select>
                      </div>
                      <div>
                        <Label className="text-slate-400 text-xs">FREE Color</Label>
                        <input type="color" value={highlightColor} onChange={e => setHighlightColor(e.target.value)} className="w-full h-8 rounded cursor-pointer border-0 mt-1" data-testid="input-highlight-color" />
                      </div>
                      <div>
                        <Label className="text-slate-400 text-xs">FREE Animation</Label>
                        <select value={highlightAnimation} onChange={e => setHighlightAnimation(e.target.value)} className="w-full bg-slate-800 border border-slate-700 text-white mt-1 rounded-md px-1 py-2 text-xs" data-testid="select-highlight-animation">
                          <option value="none">None</option><option value="pulse">Pulse</option><option value="bounce">Bounce</option><option value="glow">Glow</option><option value="shake">Shake</option><option value="flash">Flash</option><option value="swing">Swing</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-slate-400 text-xs">Side Text (Left)</Label>
                        <textarea value={sideText} onChange={e => setSideText(e.target.value)} className="w-full bg-slate-800 border border-slate-700 text-white mt-1 rounded-md px-3 py-2 text-sm resize-none h-16" data-testid="input-side-text" />
                      </div>
                      <div>
                        <Label className="text-slate-400 text-xs">Side Sub Text</Label>
                        <Input value={sideSubText} onChange={e => setSideSubText(e.target.value)} className="bg-slate-800 border-slate-700 text-white mt-1" data-testid="input-side-subtext" />
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <Label className="text-slate-400 text-xs">Price (Right)</Label>
                        <Input value={priceText} onChange={e => setPriceText(e.target.value)} className="bg-slate-800 border-slate-700 text-white mt-1" data-testid="input-price-text" />
                      </div>
                      <div>
                        <Label className="text-slate-400 text-xs">Price Color</Label>
                        <input type="color" value={priceColor} onChange={e => setPriceColor(e.target.value)} className="w-full h-8 rounded cursor-pointer border-0 mt-1" data-testid="input-price-color" />
                      </div>
                      <div>
                        <Label className="text-slate-400 text-xs">Price Animation</Label>
                        <select value={priceAnimation} onChange={e => setPriceAnimation(e.target.value)} className="w-full bg-slate-800 border border-slate-700 text-white mt-1 rounded-md px-1 py-2 text-xs" data-testid="select-price-animation">
                          <option value="none">None</option><option value="pulse">Pulse</option><option value="bounce">Bounce</option><option value="glow">Glow</option><option value="shake">Shake</option><option value="flash">Flash</option><option value="swing">Swing</option>
                        </select>
                      </div>
                      <div>
                        <Label className="text-slate-400 text-xs">BG Color</Label>
                        <div className="flex gap-1 mt-1">
                          <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0" data-testid="input-bg-color" />
                          <Input value={bgColor} onChange={e => setBgColor(e.target.value)} className="bg-slate-800 border-slate-700 text-white flex-1 text-xs" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-slate-400 text-xs">Product Images (upload burgers, food items)</Label>
                    <div className="flex flex-wrap gap-3">
                      {images.map((img, i) => (
                        <div key={i} className="relative w-20 rounded-lg overflow-hidden border border-slate-600 group">
                          <div className="w-20 h-20 relative" style={{ background: img.bgRemoved ? "repeating-conic-gradient(#333 0% 25%, #555 0% 50%) 50% / 10px 10px" : undefined }}>
                            <img src={img.src} alt="" className="w-full h-full object-cover" />
                          </div>
                          <button onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-0 right-0 bg-red-600 text-white text-xs px-1.5 py-0.5 rounded-bl opacity-0 group-hover:opacity-100 transition-opacity" data-testid={`btn-remove-image-${i}`}>×</button>
                          <button onClick={() => toggleBgRemoval(i)} disabled={removingBg === i} className={`w-full text-[9px] py-0.5 font-medium transition-colors ${img.bgRemoved ? "bg-green-600 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"}`} data-testid={`btn-bg-remove-${i}`}>
                            {removingBg === i ? "Removing..." : img.bgRemoved ? "BG Removed ✓" : "Remove BG"}
                          </button>
                        </div>
                      ))}
                      <label className="w-20 h-20 rounded-lg border-2 border-dashed border-slate-600 flex flex-col items-center justify-center cursor-pointer hover:border-red-500 transition-colors" data-testid="btn-upload-image">
                        <Upload className="h-5 w-5 text-slate-500 mb-1" /><span className="text-[10px] text-slate-500">Upload</span>
                        <input type="file" accept="image/*,video/*,.gif" className="hidden" onChange={handleImageUpload} />
                      </label>
                      <button onClick={handlePasteImage((dataUrl) => setImages(prev => [...prev, { src: dataUrl, original: dataUrl, bgRemoved: false }]))} className="w-20 h-20 rounded-lg border-2 border-dashed border-purple-600 flex flex-col items-center justify-center cursor-pointer hover:border-purple-400 hover:bg-purple-900/20 transition-colors" title="Paste image from clipboard" data-testid="btn-paste-image">
                        <Clipboard className="h-5 w-5 text-purple-400 mb-1" /><span className="text-[10px] text-purple-400">Paste</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                    <h2 className="text-lg font-bold text-slate-200" data-testid="text-preview-title">Live TV Preview — TV 1</h2>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5 border border-slate-700 rounded overflow-hidden">
                        <button onClick={() => setTv1Orientation("landscape")} className={`px-1.5 py-0.5 text-[10px] font-bold transition-all ${tv1Orientation === "landscape" ? "bg-red-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"}`} data-testid="btn-orientation-landscape">Landscape</button>
                        <button onClick={() => setTv1Orientation("portrait")} className={`px-1.5 py-0.5 text-[10px] font-bold transition-all ${tv1Orientation === "portrait" ? "bg-red-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"}`} data-testid="btn-orientation-portrait">Portrait</button>
                      </div>
                      <Monitor className="h-4 w-4 text-slate-400" />
                      <div className="flex gap-1 flex-wrap">
                        {TV_SIZES.map((size, idx) => (
                          <button key={size.label} onClick={() => { setTv1SizeIndex(idx); setUseCustomSize(false); }} className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all ${!useCustomSize && tv1SizeIndex === idx ? "bg-red-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"}`} data-testid={`btn-tv-size-${size.label}`}>{size.label}</button>
                        ))}
                        <button onClick={() => setUseCustomSize(!useCustomSize)} className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all ${useCustomSize ? "bg-purple-600 text-white" : "bg-slate-800 text-purple-400 hover:text-white"}`} data-testid="btn-custom-size">Custom</button>
                      </div>
                      {useCustomSize && (
                        <div className="flex items-center gap-1 ml-1">
                          <input type="number" value={customPreviewWidth} onChange={e => setCustomPreviewWidth(Number(e.target.value) || 100)} className="w-14 bg-slate-800 border border-slate-600 text-white rounded px-1 py-0.5 text-[10px] text-center" data-testid="input-custom-width" />
                          <span className="text-[10px] text-slate-500">×</span>
                          <input type="number" value={customPreviewHeight} onChange={e => setCustomPreviewHeight(Number(e.target.value) || 100)} className="w-14 bg-slate-800 border border-slate-600 text-white rounded px-1 py-0.5 text-[10px] text-center" data-testid="input-custom-height" />
                          <span className="text-[10px] text-slate-500">px</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <div style={{ width: useCustomSize ? customPreviewWidth : (tv1Orientation === "portrait" ? tv1Size.width * 0.56 : tv1Size.width), maxWidth: "100%", transition: "width 0.3s ease" }}>
                      <div className="relative overflow-hidden rounded-xl shadow-2xl border-4 border-slate-800" style={{ aspectRatio: useCustomSize ? `${customPreviewWidth}/${customPreviewHeight}` : (tv1Orientation === "portrait" ? "9/16" : "16/9"), background: bgColor }} data-testid="tv-preview">
                        {tv1Orientation === "portrait" ? (
                          <>
                            <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${bgColor} 0%, ${bgColor}ee 50%, rgba(139,90,43,0.9) 100%)` }} />
                            <div className="absolute bottom-0 left-0 right-0 h-[15%]" style={{ background: "linear-gradient(180deg, transparent 0%, rgba(120,80,30,0.6) 30%, rgba(100,65,20,0.9) 100%)", borderTop: "1px solid rgba(160,120,60,0.3)" }} />
                            {logo && (<div className="absolute top-[1%] left-[4%] z-20" style={{ width: "12%", aspectRatio: "1" }}><div className="w-full h-full rounded-full overflow-hidden border-2 border-white/60 shadow-xl"><img src={logo} alt="Logo" className="w-full h-full object-cover" /></div></div>)}
                            {headerText && (<div className="absolute top-[1.5%] left-0 right-0 text-center z-10"><h2 className="font-black tracking-[0.15em] uppercase" style={{ fontSize: "clamp(8px, 2.5vw, 16px)", color: "#4a1a00", textShadow: "1px 1px 2px rgba(0,0,0,0.2)", fontFamily: "'Arial Black', 'Impact', sans-serif", letterSpacing: "0.15em" }}>{headerText}</h2></div>)}
                            {priceText && (<div className="absolute right-[5%] top-[1%] z-10 text-right"><div className="font-black" style={{ fontSize: "clamp(14px, 5vw, 34px)", color: priceColor, fontFamily: "'Arial Black', 'Impact', sans-serif", textShadow: priceAnimation === "glow" ? `0 0 10px ${priceColor}, 0 0 20px ${priceColor}, 0 0 40px ${priceColor}` : "2px 3px 6px rgba(0,0,0,0.4)", lineHeight: 0.9, transform: "rotate(5deg)", animation: priceAnimation === "none" ? "pricePopIn 0.8s ease-out" : `price_${priceAnimation} ${priceAnimation === "flash" ? "1.5s" : "2s"} ease-in-out infinite` }}><span style={{ fontSize: "55%", verticalAlign: "super" }}>{priceText.charAt(0)}</span>{priceText.slice(1, -2)}<span style={{ fontSize: "60%", verticalAlign: "super" }}>{priceText.slice(-2)}</span></div></div>)}
                            {(mainText || mainTextHighlight) && (<div className="absolute top-[7%] left-[5%] right-[5%] text-center z-10" style={{ animation: mainTextAnimation !== "none" ? `anim_${mainTextAnimation} 2s ease-in-out infinite` : undefined }}><h1 className="font-black" style={{ fontSize: "clamp(14px, 5vw, 36px)", color: mainTextColor, textShadow: mainTextAnimation === "glow" ? `0 0 10px ${mainTextColor}, 0 0 20px ${mainTextColor}` : "2px 3px 6px rgba(0,0,0,0.3)", fontFamily: "'Arial Black', 'Impact', sans-serif", lineHeight: 1.15 }}>{mainText}{mainTextHighlight ? " " : ""}{mainTextHighlight && (<span style={{ color: highlightColor, fontSize: "110%", display: "inline-block", textShadow: highlightAnimation === "glow" ? `0 0 10px ${highlightColor}, 0 0 20px ${highlightColor}` : undefined, animation: highlightAnimation !== "none" ? `anim_${highlightAnimation} ${highlightAnimation === "flash" ? "1.5s" : "2s"} ease-in-out infinite` : undefined }}>{mainTextHighlight}</span>)}</h1></div>)}
                            {sideText && (<div className="absolute left-[3%] top-[30%] z-10 text-center" style={{ animation: "sideTextPulse 2s ease-in-out infinite" }}><div className="relative"><div className="absolute -inset-1.5 rounded-md" style={{ background: "rgba(180,30,30,0.75)", transform: "rotate(-12deg)" }} /><div className="relative px-3 py-1" style={{ transform: "rotate(-12deg)" }}>{sideText.split("\n").map((line, i) => (<div key={i} className="font-black" style={{ fontSize: i === 0 ? "clamp(7px, 2vw, 14px)" : "clamp(9px, 2.5vw, 18px)", color: "#FFFFFF", fontFamily: "'Georgia', serif", lineHeight: 1.1, textShadow: "1px 2px 3px rgba(0,0,0,0.4)" }}>{line}</div>))}{sideSubText && (<div className="font-bold mt-0.5" style={{ fontSize: "clamp(4px, 1.2vw, 9px)", color: "#FFE4B5", fontFamily: "'Georgia', serif" }}>{sideSubText}</div>)}</div></div></div>)}
                            <div className="absolute bottom-[2%] left-1/2 -translate-x-1/2 z-10 flex items-end justify-center" style={{ width: "92%", height: "55%" }}>
                              {images.length === 0 ? (
                                <div className="flex items-end justify-center gap-3 h-full">{[0, 1, 2].map(i => (<div key={i} className="rounded-lg border-2 border-dashed flex items-center justify-center border-white/20" style={{ width: i === 1 ? "35%" : "28%", aspectRatio: "1", transform: i === 0 ? "translateX(15%) scale(0.85)" : i === 2 ? "translateX(-15%) scale(0.85)" : "translateY(-10%) scale(1.1)", zIndex: i === 1 ? 3 : 1 }}><ImageIcon className="h-6 w-6 text-white/20" /></div>))}</div>
                              ) : images.length === 1 ? (
                                <img src={images[0].src} alt="" className="max-h-full max-w-[75%] object-contain" style={{ filter: "drop-shadow(0 8px 20px rgba(0,0,0,0.5))", animation: "floatUpDown 3s ease-in-out infinite" }} />
                              ) : (() => {
                                const count = Math.min(images.length, 3);
                                const slots3 = [{ x: "2%", scale: 0.85, z: 1 }, { x: "28%", scale: 1.2, z: 3 }, { x: "58%", scale: 0.85, z: 1 }];
                                const slots2 = [{ x: "8%", scale: 0.95, z: 1 }, { x: "42%", scale: 1.15, z: 3 }];
                                const slots = count === 2 ? slots2 : slots3;
                                return (<div className="relative h-full w-full">{images.slice(0, count).map((img, i) => { const pos = (i + rotationStep) % count; const slot = slots[pos]; const isFront = slot.z === 3; return (<img key={i} src={img.src} alt="" className="absolute object-contain" style={{ left: slot.x, bottom: isFront ? "3%" : "0%", maxHeight: isFront ? "88%" : "68%", maxWidth: isFront ? "48%" : "38%", filter: `drop-shadow(0 ${isFront ? 12 : 5}px ${isFront ? 25 : 10}px rgba(0,0,0,${isFront ? 0.7 : 0.35}))`, zIndex: slot.z, transform: `scale(${slot.scale})`, transition: "all 1s cubic-bezier(0.4, 0, 0.2, 1)" }} />); })}</div>);
                              })()}
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${bgColor} 0%, ${bgColor}ee 60%, rgba(139,90,43,0.9) 100%)` }} />
                            <div className="absolute bottom-0 left-0 right-0 h-[18%]" style={{ background: "linear-gradient(180deg, transparent 0%, rgba(120,80,30,0.6) 30%, rgba(100,65,20,0.9) 100%)", borderTop: "1px solid rgba(160,120,60,0.3)" }} />
                            {logo && (<div className="absolute top-[4%] left-[3%] z-20" style={{ width: "12%", aspectRatio: "1" }}><div className="w-full h-full rounded-full overflow-hidden border-2 border-white/60 shadow-xl"><img src={logo} alt="Logo" className="w-full h-full object-cover" /></div></div>)}
                            {headerText && (<div className="absolute top-[5%] left-1/2 -translate-x-1/2 text-center z-10"><h2 className="font-black tracking-[0.15em] uppercase" style={{ fontSize: "clamp(8px, 1.8vw, 18px)", color: "#4a1a00", textShadow: "1px 1px 2px rgba(0,0,0,0.2)", fontFamily: "'Arial Black', 'Impact', sans-serif", letterSpacing: "0.2em" }}>{headerText}</h2></div>)}
                            {(mainText || mainTextHighlight) && (<div className="absolute top-[16%] left-1/2 -translate-x-1/2 text-center z-10 whitespace-nowrap" style={{ animation: mainTextAnimation !== "none" ? `anim_${mainTextAnimation} 2s ease-in-out infinite` : undefined }}><h1 className="font-black" style={{ fontSize: "clamp(14px, 3.5vw, 36px)", color: mainTextColor, textShadow: mainTextAnimation === "glow" ? `0 0 10px ${mainTextColor}, 0 0 20px ${mainTextColor}` : "2px 3px 6px rgba(0,0,0,0.3)", fontFamily: "'Arial Black', 'Impact', sans-serif", lineHeight: 1.1 }}>{mainText}{mainTextHighlight ? " " : ""}{mainTextHighlight && (<span style={{ color: highlightColor, fontSize: "110%", display: "inline-block", textShadow: highlightAnimation === "glow" ? `0 0 10px ${highlightColor}, 0 0 20px ${highlightColor}` : undefined, animation: highlightAnimation !== "none" ? `anim_${highlightAnimation} ${highlightAnimation === "flash" ? "1.5s" : "2s"} ease-in-out infinite` : undefined }}>{mainTextHighlight}</span>)}</h1></div>)}
                            {sideText && (<div className="absolute left-[2%] top-[40%] z-10 text-center" style={{ animation: "sideTextPulse 2s ease-in-out infinite" }}><div className="relative"><div className="absolute -inset-1.5 rounded-md" style={{ background: "rgba(180,30,30,0.75)", transform: "rotate(-12deg)" }} /><div className="relative px-2 py-0.5" style={{ transform: "rotate(-12deg)" }}>{sideText.split("\n").map((line, i) => (<div key={i} className="font-black" style={{ fontSize: i === 0 ? "clamp(7px, 1.2vw, 14px)" : "clamp(9px, 1.6vw, 18px)", color: "#FFFFFF", fontFamily: "'Georgia', serif", lineHeight: 1.1, textShadow: "1px 2px 3px rgba(0,0,0,0.4)" }}>{line}</div>))}{sideSubText && (<div className="font-bold mt-0.5" style={{ fontSize: "clamp(4px, 0.7vw, 8px)", color: "#FFE4B5", fontFamily: "'Georgia', serif" }}>{sideSubText}</div>)}</div></div></div>)}
                            {priceText && (<div className="absolute right-[3%] top-[5%] z-10 text-right"><div className="font-black" style={{ fontSize: "clamp(16px, 3.5vw, 38px)", color: priceColor, fontFamily: "'Arial Black', 'Impact', sans-serif", textShadow: priceAnimation === "glow" ? `0 0 10px ${priceColor}, 0 0 20px ${priceColor}, 0 0 40px ${priceColor}` : "2px 3px 6px rgba(0,0,0,0.4)", lineHeight: 0.9, transform: "rotate(5deg)", animation: priceAnimation === "none" ? "pricePopIn 0.8s ease-out" : `price_${priceAnimation} ${priceAnimation === "flash" ? "1.5s" : "2s"} ease-in-out infinite` }}><span style={{ fontSize: "55%", verticalAlign: "super" }}>{priceText.charAt(0)}</span>{priceText.slice(1, -2)}<span style={{ fontSize: "60%", verticalAlign: "super" }}>{priceText.slice(-2)}</span></div></div>)}
                            <div className="absolute bottom-[8%] left-1/2 -translate-x-1/2 z-10 flex items-end justify-center" style={{ width: "80%", height: "55%" }}>
                              {images.length === 0 ? (
                                <div className="flex items-end justify-center gap-2 h-full">{[0, 1, 2].map(i => (<div key={i} className="rounded-lg border-2 border-dashed flex items-center justify-center border-white/20" style={{ width: i === 1 ? "22%" : "18%", aspectRatio: "1", transform: i === 0 ? "translateX(15%) scale(0.85)" : i === 2 ? "translateX(-15%) scale(0.85)" : "translateY(-10%) scale(1.1)", zIndex: i === 1 ? 3 : 1 }}><ImageIcon className="h-5 w-5 text-white/20" /></div>))}</div>
                              ) : images.length === 1 ? (
                                <img src={images[0].src} alt="" className="max-h-full max-w-[50%] object-contain" style={{ filter: "drop-shadow(0 6px 15px rgba(0,0,0,0.5))", animation: "floatUpDown 3s ease-in-out infinite" }} />
                              ) : (() => {
                                const count = Math.min(images.length, 3);
                                const slots3 = [{ x: "5%", scale: 0.8, z: 1 }, { x: "35%", scale: 1.15, z: 3 }, { x: "65%", scale: 0.8, z: 1 }];
                                const slots2 = [{ x: "15%", scale: 0.9, z: 1 }, { x: "55%", scale: 1.1, z: 3 }];
                                const slots = count === 2 ? slots2 : slots3;
                                return (<div className="relative h-full w-full">{images.slice(0, count).map((img, i) => { const pos = (i + rotationStep) % count; const slot = slots[pos]; const isFront = slot.z === 3; return (<img key={i} src={img.src} alt="" className="absolute object-contain" style={{ left: slot.x, bottom: isFront ? "5%" : "0%", maxHeight: isFront ? "90%" : "70%", maxWidth: isFront ? "35%" : "28%", filter: `drop-shadow(0 ${isFront ? 12 : 5}px ${isFront ? 25 : 10}px rgba(0,0,0,${isFront ? 0.7 : 0.35}))`, zIndex: slot.z, transform: `scale(${slot.scale})`, transition: "all 1s cubic-bezier(0.4, 0, 0.2, 1)" }} />); })}</div>);
                              })()}
                            </div>
                          </>
                        )}
                      </div>
                      <div className="text-center mt-2 text-xs text-slate-500" data-testid="text-tv-size-label">Preview: {useCustomSize ? `Custom ${customPreviewWidth}×${customPreviewHeight}px` : `${tv1Size.label} TV — ${tv1Orientation === "portrait" ? "Portrait 9:16" : "Landscape 16:9"}`}</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : activeTv === 2 ? (
              /* ============ TV 2 - MENU BOARD ============ */
              <div className="grid grid-cols-1 xl:grid-cols-[minmax(350px,1fr)_minmax(500px,2fr)] gap-8">
                <div className="space-y-5 max-h-[80vh] overflow-y-auto pr-2">
                  <h2 className="text-lg font-bold text-slate-200 border-b border-slate-700 pb-2" data-testid="text-editor-title-tv2">Layout Editor — TV 2 (Menu Board)</h2>
                  <MusicInput value={tv2Music} onChange={setTv2Music} tvNum={2} />

                  <div className="space-y-3">
                    <div className="flex items-end gap-3">
                      <div className="flex-shrink-0">
                        <Label className="text-slate-400 text-xs">Logo</Label>
                        <div className="mt-1">
                          {tv2Logo ? (
                            <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-slate-600 relative group">
                              <img src={tv2Logo} alt="Logo" className="w-full h-full object-cover" />
                              <button onClick={() => setTv2Logo(null)} className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" data-testid="btn-remove-tv2-logo"><X className="h-4 w-4 text-white" /></button>
                            </div>
                          ) : (
                            <div className="flex gap-1">
                              <label className="w-14 h-14 rounded-full border-2 border-dashed border-slate-600 flex flex-col items-center justify-center cursor-pointer hover:border-red-500 transition-colors" data-testid="btn-upload-tv2-logo">
                                <Upload className="h-4 w-4 text-slate-500" />
                                <input type="file" accept="image/*,video/*,.gif" className="hidden" onChange={handleTv2LogoUpload} />
                              </label>
                              <button onClick={handlePasteImage((d) => setTv2Logo(d))} className="w-14 h-14 rounded-full border-2 border-dashed border-purple-600 flex flex-col items-center justify-center cursor-pointer hover:border-purple-400 hover:bg-purple-900/20 transition-colors" title="Paste from clipboard" data-testid="btn-paste-tv2-logo">
                                <Clipboard className="h-4 w-4 text-purple-400" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex-1 grid grid-cols-3 gap-2">
                        <div>
                          <Label className="text-slate-400 text-xs">BG Color</Label>
                          <input type="color" value={tv2BgColor} onChange={e => setTv2BgColor(e.target.value)} className="w-full h-8 rounded cursor-pointer border-0 mt-1" data-testid="input-tv2-bg-color" />
                        </div>
                        <div>
                          <Label className="text-slate-400 text-xs">Accent Color</Label>
                          <input type="color" value={tv2AccentColor} onChange={e => setTv2AccentColor(e.target.value)} className="w-full h-8 rounded cursor-pointer border-0 mt-1" data-testid="input-tv2-accent" />
                        </div>
                        <div>
                          <Label className="text-slate-400 text-xs">Text Color</Label>
                          <input type="color" value={tv2TextColor} onChange={e => setTv2TextColor(e.target.value)} className="w-full h-8 rounded cursor-pointer border-0 mt-1" data-testid="input-tv2-text-color" />
                        </div>
                      </div>
                    </div>

                    <div className="border border-slate-700 rounded-lg p-3 space-y-2">
                      <Label className="text-slate-300 text-xs font-semibold">Featured Item (Left Side)</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-slate-400 text-xs">Title</Label>
                          <textarea value={tv2FeaturedTitle} onChange={e => setTv2FeaturedTitle(e.target.value)} className="w-full bg-slate-800 border border-slate-700 text-white mt-1 rounded-md px-2 py-1 text-xs resize-none h-12" data-testid="input-tv2-featured-title" />
                        </div>
                        <div>
                          <Label className="text-slate-400 text-xs">Subtitle</Label>
                          <textarea value={tv2FeaturedSubtitle} onChange={e => setTv2FeaturedSubtitle(e.target.value)} className="w-full bg-slate-800 border border-slate-700 text-white mt-1 rounded-md px-2 py-1 text-xs resize-none h-12" data-testid="input-tv2-featured-subtitle" />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <Label className="text-slate-400 text-xs">Price</Label>
                          <Input value={tv2FeaturedPrice} onChange={e => setTv2FeaturedPrice(e.target.value)} className="bg-slate-800 border-slate-700 text-white mt-1 text-xs" data-testid="input-tv2-featured-price" />
                        </div>
                        <div>
                          <Label className="text-slate-400 text-xs">Title Anim</Label>
                          <AnimSelect value={tv2FeaturedAnimation} onChange={setTv2FeaturedAnimation} testId="select-tv2-featured-anim" />
                        </div>
                        <div>
                          <Label className="text-slate-400 text-xs">Price Anim</Label>
                          <AnimSelect value={tv2PriceAnimation} onChange={setTv2PriceAnimation} testId="select-tv2-price-anim" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-slate-400 text-xs">Image</Label>
                          <div className="mt-1">
                            {tv2FeaturedImage ? (
                              <div className="w-16 h-16 rounded border border-slate-600 overflow-hidden relative group">
                                <img src={tv2FeaturedImage} alt="" className="w-full h-full object-cover" />
                                <button onClick={() => setTv2FeaturedImage(null)} className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" data-testid="btn-remove-featured-image"><X className="h-3 w-3 text-white" /></button>
                              </div>
                            ) : (
                              <div className="flex gap-1">
                                <label className="w-16 h-16 rounded border-2 border-dashed border-slate-600 flex items-center justify-center cursor-pointer hover:border-red-500 transition-colors" data-testid="btn-upload-featured-image">
                                  <Upload className="h-4 w-4 text-slate-500" />
                                  <input type="file" accept="image/*,video/*,.gif" className="hidden" onChange={handleFeaturedImageUpload} />
                                </label>
                                <button onClick={handlePasteImage((d) => setTv2FeaturedImage(d))} className="w-16 h-16 rounded border-2 border-dashed border-purple-600 flex flex-col items-center justify-center cursor-pointer hover:border-purple-400 hover:bg-purple-900/20 transition-colors" title="Paste from clipboard" data-testid="btn-paste-featured-image">
                                  <Clipboard className="h-4 w-4 text-purple-400" />
                                  <span className="text-[8px] text-purple-400">Paste</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        <div>
                          <Label className="text-slate-400 text-xs">Image Anim</Label>
                          <AnimSelect value={tv2ImageAnimation} onChange={setTv2ImageAnimation} testId="select-tv2-image-anim" />
                        </div>
                      </div>
                      <div>
                        <Label className="text-slate-400 text-xs">Description</Label>
                        <Input value={tv2FeaturedDesc} onChange={e => setTv2FeaturedDesc(e.target.value)} className="bg-slate-800 border-slate-700 text-white mt-1 text-xs" data-testid="input-tv2-featured-desc" />
                      </div>
                    </div>

                    <div className="border border-slate-700 rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-slate-300 text-xs font-semibold">Menu Items (Right Grid)</Label>
                        <button onClick={addMenuItem} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1" data-testid="btn-add-menu-item"><Plus className="h-3 w-3" /> Add</button>
                      </div>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {tv2MenuItems.map((item) => (
                          <div key={item.id} className="flex gap-2 items-start bg-slate-800/50 rounded p-2">
                            <div className="flex-shrink-0 space-y-1">
                              {item.image ? (
                                <div className="w-12 h-12 rounded overflow-hidden relative group">
                                  <img src={item.image} alt="" className="w-full h-full object-cover" />
                                  <button onClick={() => updateMenuItem(item.id, "image", "")} className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100"><X className="h-3 w-3 text-white" /></button>
                                </div>
                              ) : (
                                <label className="w-12 h-12 rounded border border-dashed border-slate-600 flex items-center justify-center cursor-pointer hover:border-red-500" data-testid={`btn-upload-menu-image-${item.id}`}>
                                  <Upload className="h-3 w-3 text-slate-500" />
                                  <input type="file" accept="image/*,video/*,.gif" className="hidden" onChange={(e) => handleMenuItemImage(item.id, e)} />
                                </label>
                              )}
                              <select value={item.animation} onChange={e => updateMenuItem(item.id, "animation", e.target.value)} className="w-12 bg-slate-800 border border-slate-700 text-white rounded text-[8px] px-0.5 py-0.5" data-testid={`select-menu-anim-${item.id}`}>
                                {animationOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                              </select>
                            </div>
                            <div className="flex-1 space-y-1">
                              <div className="flex gap-1">
                                <Input value={item.name} onChange={e => updateMenuItem(item.id, "name", e.target.value)} className="bg-slate-800 border-slate-700 text-white text-xs h-7 flex-1" data-testid={`input-menu-name-${item.id}`} />
                                <Input value={item.price} onChange={e => updateMenuItem(item.id, "price", e.target.value)} className="bg-slate-800 border-slate-700 text-white text-xs h-7 w-16" data-testid={`input-menu-price-${item.id}`} />
                              </div>
                              <div className="flex gap-1">
                                <Input value={item.calories} onChange={e => updateMenuItem(item.id, "calories", e.target.value)} className="bg-slate-800 border-slate-700 text-white text-xs h-7 w-20" data-testid={`input-menu-cal-${item.id}`} />
                                <Input value={item.description} onChange={e => updateMenuItem(item.id, "description", e.target.value)} className="bg-slate-800 border-slate-700 text-white text-xs h-7 flex-1" data-testid={`input-menu-desc-${item.id}`} />
                              </div>
                            </div>
                            <button onClick={() => removeMenuItem(item.id)} className="text-red-500 hover:text-red-400 mt-1" data-testid={`btn-remove-menu-${item.id}`}><X className="h-3 w-3" /></button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="border border-slate-700 rounded-lg p-3 space-y-2">
                      <Label className="text-slate-300 text-xs font-semibold">Combo Deal Banner</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-slate-400 text-xs">Text</Label>
                          <Input value={tv2ComboText} onChange={e => setTv2ComboText(e.target.value)} className="bg-slate-800 border-slate-700 text-white mt-1 text-xs" data-testid="input-tv2-combo-text" />
                        </div>
                        <div>
                          <Label className="text-slate-400 text-xs">Price Text</Label>
                          <Input value={tv2ComboPrice} onChange={e => setTv2ComboPrice(e.target.value)} className="bg-slate-800 border-slate-700 text-white mt-1 text-xs" data-testid="input-tv2-combo-price" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-slate-400 text-xs">Combo Animation</Label>
                          <AnimSelect value={tv2ComboAnimation} onChange={setTv2ComboAnimation} testId="select-tv2-combo-anim" />
                        </div>
                        <div>
                          <Label className="text-slate-400 text-xs">BG Image</Label>
                          <div className="mt-1">
                            {tv2ComboImage ? (
                              <div className="w-full h-8 rounded border border-slate-600 overflow-hidden relative group">
                                <img src={tv2ComboImage} alt="" className="w-full h-full object-cover" />
                                <button onClick={() => setTv2ComboImage(null)} className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" data-testid="btn-remove-combo-image"><X className="h-3 w-3 text-white" /></button>
                              </div>
                            ) : (
                              <div className="flex gap-1">
                                <label className="flex-1 h-8 rounded border border-dashed border-slate-600 flex items-center justify-center cursor-pointer hover:border-red-500 text-[10px] text-slate-500 gap-1" data-testid="btn-upload-combo-image">
                                  <Upload className="h-3 w-3" /> Upload
                                  <input type="file" accept="image/*,video/*,.gif" className="hidden" onChange={handleComboImageUpload} />
                                </label>
                                <button onClick={handlePasteImage((d) => setTv2ComboImage(d))} className="h-8 px-2 rounded border border-dashed border-purple-600 flex items-center justify-center cursor-pointer hover:border-purple-400 hover:bg-purple-900/20 text-[10px] text-purple-400 gap-1" title="Paste" data-testid="btn-paste-combo-image">
                                  <Clipboard className="h-3 w-3" /> Paste
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div>
                        <Label className="text-slate-400 text-xs">BG Image Animation</Label>
                        <AnimSelect value={tv2ComboImageAnimation} onChange={setTv2ComboImageAnimation} testId="select-tv2-combo-image-anim" />
                      </div>
                    </div>

                    <div className="border border-slate-700 rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-slate-300 text-xs font-semibold">Kids Menu</Label>
                        <button onClick={addKidsItem} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1" data-testid="btn-add-kids-item"><Plus className="h-3 w-3" /> Add</button>
                      </div>
                      <div>
                        <Label className="text-slate-400 text-xs">BG Image</Label>
                        <div className="mt-1">
                          {tv2KidsImage ? (
                            <div className="w-full h-8 rounded border border-slate-600 overflow-hidden relative group">
                              <img src={tv2KidsImage} alt="" className="w-full h-full object-cover" />
                              <button onClick={() => setTv2KidsImage(null)} className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" data-testid="btn-remove-kids-image"><X className="h-3 w-3 text-white" /></button>
                            </div>
                          ) : (
                            <div className="flex gap-1">
                              <label className="flex-1 h-8 rounded border border-dashed border-slate-600 flex items-center justify-center cursor-pointer hover:border-red-500 text-[10px] text-slate-500 gap-1" data-testid="btn-upload-kids-image">
                                <Upload className="h-3 w-3" /> Upload
                                <input type="file" accept="image/*,video/*,.gif" className="hidden" onChange={handleKidsImageUpload} />
                              </label>
                              <button onClick={handlePasteImage((d) => setTv2KidsImage(d))} className="h-8 px-2 rounded border border-dashed border-purple-600 flex items-center justify-center cursor-pointer hover:border-purple-400 hover:bg-purple-900/20 text-[10px] text-purple-400 gap-1" title="Paste" data-testid="btn-paste-kids-image">
                                <Clipboard className="h-3 w-3" /> Paste
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <Label className="text-slate-400 text-xs">BG Image Animation</Label>
                        <AnimSelect value={tv2KidsImageAnimation} onChange={setTv2KidsImageAnimation} testId="select-tv2-kids-image-anim" />
                      </div>
                      <div className="space-y-1">
                        {tv2KidsMenu.map((item) => (
                          <div key={item.id} className="flex gap-2 items-center">
                            <Input value={item.name} onChange={e => updateKidsItem(item.id, "name", e.target.value)} className="bg-slate-800 border-slate-700 text-white text-xs h-7 flex-1" data-testid={`input-kids-name-${item.id}`} />
                            <Input value={item.price} onChange={e => updateKidsItem(item.id, "price", e.target.value)} className="bg-slate-800 border-slate-700 text-white text-xs h-7 w-16" data-testid={`input-kids-price-${item.id}`} />
                            <select value={item.animation} onChange={e => updateKidsItem(item.id, "animation", e.target.value)} className="bg-slate-800 border border-slate-700 text-white rounded text-[8px] px-0.5 py-0.5 h-7 w-14" data-testid={`select-kids-anim-${item.id}`}>
                              {animationOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                            <button onClick={() => removeKidsItem(item.id)} className="text-red-500 hover:text-red-400" data-testid={`btn-remove-kids-${item.id}`}><X className="h-3 w-3" /></button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                    <h2 className="text-lg font-bold text-slate-200" data-testid="text-preview-title-tv2">Live TV Preview — TV 2</h2>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5 border border-slate-700 rounded overflow-hidden">
                        <button onClick={() => setTv2Orientation("landscape")} className={`px-1.5 py-0.5 text-[10px] font-bold transition-all ${tv2Orientation === "landscape" ? "bg-red-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"}`} data-testid="btn-tv2-orientation-landscape">Landscape</button>
                        <button onClick={() => setTv2Orientation("portrait")} className={`px-1.5 py-0.5 text-[10px] font-bold transition-all ${tv2Orientation === "portrait" ? "bg-red-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"}`} data-testid="btn-tv2-orientation-portrait">Portrait</button>
                      </div>
                      <Monitor className="h-4 w-4 text-slate-400" />
                      <div className="flex gap-1">
                        {TV_SIZES.map((size, idx) => (
                          <button key={size.label} onClick={() => setTv2SizeIndex(idx)} className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all ${tv2SizeIndex === idx ? "bg-red-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"}`} data-testid={`btn-tv2-size-${size.label}`}>{size.label}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <div style={{ width: tv2Orientation === "portrait" ? tv2Size.width * 0.56 : tv2Size.width, maxWidth: "100%", transition: "width 0.3s ease" }}>
                      <div className="relative overflow-hidden rounded-xl shadow-2xl border-4 border-slate-800" style={{ aspectRatio: tv2Orientation === "portrait" ? "9/16" : "16/9", background: tv2BgColor }} data-testid="tv2-preview">
                        {tv2Orientation === "portrait" ? (
                          <div className="absolute inset-0 flex flex-col">
                            {/* Portrait: Featured Section Top */}
                            <div className="relative overflow-hidden" style={{ height: "28%", background: `linear-gradient(180deg, ${tv2BgColor} 0%, #2a1a00 100%)` }}>
                              {tv2Logo && (
                                <div className="absolute top-[5%] right-[4%] z-20" style={{ width: "10%", aspectRatio: "1" }}>
                                  <div className="w-full h-full rounded-full overflow-hidden border-2 shadow-lg" style={{ borderColor: tv2AccentColor }}>
                                    <img src={tv2Logo} alt="Logo" className="w-full h-full object-cover" />
                                  </div>
                                </div>
                              )}
                              <div className="absolute top-[5%] left-[4%] right-[18%] z-10" style={getAnimStyle(tv2FeaturedAnimation, tv2AccentColor)}>
                                {tv2FeaturedTitle.split("\n").map((line, i) => (
                                  <div key={i} className="font-black uppercase" style={{
                                    fontSize: "clamp(10px, 3vw, 24px)",
                                    color: tv2AccentColor,
                                    fontFamily: "'Arial Black', 'Impact', sans-serif",
                                    lineHeight: 1.1,
                                    textShadow: "1px 1px 3px rgba(0,0,0,0.5)",
                                  }}>{line}</div>
                                ))}
                              </div>
                              <div className="absolute top-[40%] left-[4%] z-10 flex items-end gap-[4%]">
                                <div className="flex-shrink-0">
                                  {tv2FeaturedSubtitle.split("\n").map((line, i) => (
                                    <div key={i} className="font-black uppercase" style={{
                                      fontSize: "clamp(6px, 2vw, 14px)",
                                      color: tv2TextColor,
                                      fontFamily: "'Arial Black', 'Impact', sans-serif",
                                      lineHeight: 1.2,
                                    }}>{line}</div>
                                  ))}
                                </div>
                                <div style={getAnimStyle(tv2PriceAnimation, tv2AccentColor)}>
                                  <span className="font-black" style={{
                                    fontSize: "clamp(14px, 4.5vw, 32px)",
                                    color: tv2AccentColor,
                                    fontFamily: "'Arial Black', 'Impact', sans-serif",
                                    textShadow: tv2PriceAnimation === "glow" ? `0 0 10px ${tv2AccentColor}, 0 0 20px ${tv2AccentColor}` : "2px 2px 5px rgba(0,0,0,0.5)",
                                  }}>{tv2FeaturedPrice}</span>
                                </div>
                              </div>
                              <div className="absolute top-[65%] left-[4%] right-[40%] z-10">
                                <p style={{ fontSize: "clamp(4px, 1vw, 8px)", color: `${tv2TextColor}99`, fontFamily: "sans-serif", lineHeight: 1.3, textTransform: "uppercase", letterSpacing: "0.03em" }}>{tv2FeaturedDesc}</p>
                              </div>
                              {tv2FeaturedImage && (
                                <div className="absolute bottom-0 right-0 z-10" style={{ width: "45%", height: "85%", ...getAnimStyle(tv2ImageAnimation) }}>
                                  <img src={tv2FeaturedImage} alt="" className="w-full h-full object-contain object-bottom" style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.7))" }} />
                                </div>
                              )}
                            </div>

                            {/* Portrait: Menu Grid */}
                            <div className="flex-1 grid grid-cols-4 grid-rows-2 gap-px p-px" style={{ background: `${tv2AccentColor}44` }}>
                              {tv2MenuItems.slice(0, 8).map((item, idx) => (
                                <div key={item.id} className="relative flex flex-col items-center justify-center p-1" style={{ background: tv2BgColor }}>
                                  <div className="absolute top-0.5 left-1 font-bold" style={{ fontSize: "clamp(5px, 1.2vw, 10px)", color: tv2AccentColor }}>{idx + 1}</div>
                                  {item.image ? (
                                    <div className="w-[80%] aspect-square rounded overflow-hidden" style={getAnimStyle(item.animation)}>
                                      <img src={item.image} alt="" className="w-full h-full object-cover" />
                                    </div>
                                  ) : (
                                    <div className="w-[80%] aspect-square rounded border border-dashed flex items-center justify-center" style={{ borderColor: `${tv2AccentColor}44` }}>
                                      <ImageIcon className="h-4 w-4" style={{ color: `${tv2AccentColor}44` }} />
                                    </div>
                                  )}
                                  <div className="text-center w-full mt-0.5">
                                    <div className="font-bold truncate" style={{ fontSize: "clamp(5px, 1.2vw, 10px)", color: tv2TextColor }}>{item.name}</div>
                                    <div className="font-black" style={{ fontSize: "clamp(6px, 1.6vw, 13px)", color: tv2AccentColor }}>{item.price}</div>
                                    <div style={{ fontSize: "clamp(4px, 0.9vw, 7px)", color: `${tv2TextColor}88` }}>{item.calories}</div>
                                    <div className="truncate" style={{ fontSize: "clamp(3px, 0.7vw, 5px)", color: `${tv2TextColor}66` }}>{item.description}</div>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Portrait: Combo Banner */}
                            <div className="relative py-2 px-3 text-center overflow-hidden" style={{ background: tv2AccentColor }}>
                              {tv2ComboImage && (
                                <div className="absolute inset-0 z-0" style={getAnimStyle(tv2ComboImageAnimation)}>
                                  <img src={tv2ComboImage} alt="" className="w-full h-full object-cover opacity-30" />
                                </div>
                              )}
                              <div className="relative z-10" style={{ animation: "tv2_comboScroll 4s linear infinite" }}>
                                <div className="font-bold" style={{ fontSize: "clamp(5px, 1.2vw, 10px)", color: tv2BgColor, textShadow: "0 1px 2px rgba(255,255,255,0.3)" }}>{tv2ComboText}</div>
                                <div className="font-black" style={{ fontSize: "clamp(7px, 1.8vw, 14px)", color: tv2BgColor, textShadow: "0 1px 2px rgba(255,255,255,0.3)" }}>{tv2ComboPrice}</div>
                              </div>
                            </div>

                            {/* Portrait: Kids Menu */}
                            <div className="relative px-3 py-2 overflow-hidden" style={{ background: tv2BgColor }}>
                              {tv2KidsImage && (
                                <div className="absolute inset-0 z-0" style={getAnimStyle(tv2KidsImageAnimation)}>
                                  <img src={tv2KidsImage} alt="" className="w-full h-full object-cover opacity-25" />
                                </div>
                              )}
                              <div className="relative z-10">
                                <div className="font-black mb-1" style={{ fontSize: "clamp(8px, 2vw, 16px)", color: tv2AccentColor, fontFamily: "'Arial Black', 'Impact', sans-serif" }}>KIDS MENU</div>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                  {tv2KidsMenu.map((item) => (
                                    <div key={item.id} className="flex justify-between" style={getAnimStyle(item.animation, tv2AccentColor)}>
                                      <span className="font-bold" style={{ fontSize: "clamp(4px, 1vw, 8px)", color: tv2TextColor }}>{item.name}</span>
                                      <span className="font-black" style={{ fontSize: "clamp(4px, 1vw, 8px)", color: tv2AccentColor }}>{item.price}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="absolute inset-0 flex">
                            {/* Landscape: Left Featured Section */}
                            <div className="w-[35%] h-full relative overflow-hidden" style={{ background: `linear-gradient(180deg, ${tv2BgColor} 0%, #2a1a00 100%)` }}>
                              {tv2Logo && (
                                <div className="absolute top-[3%] right-[5%] z-20" style={{ width: "18%", aspectRatio: "1" }}>
                                  <div className="w-full h-full rounded-full overflow-hidden border-2 shadow-lg" style={{ borderColor: tv2AccentColor }}>
                                    <img src={tv2Logo} alt="Logo" className="w-full h-full object-cover" />
                                  </div>
                                </div>
                              )}
                              <div className="absolute top-[2%] left-[5%] right-[25%] z-10" style={getAnimStyle(tv2FeaturedAnimation, tv2AccentColor)}>
                                {tv2FeaturedTitle.split("\n").map((line, i) => (
                                  <div key={i} className="font-black uppercase" style={{
                                    fontSize: "clamp(8px, 1.6vw, 20px)",
                                    color: tv2AccentColor,
                                    fontFamily: "'Arial Black', 'Impact', sans-serif",
                                    lineHeight: 1.1,
                                    textShadow: "1px 1px 3px rgba(0,0,0,0.5)",
                                  }}>{line}</div>
                                ))}
                              </div>
                              <div className="absolute top-[20%] left-[5%] right-[5%] z-10 flex items-end gap-[3%]">
                                <div className="flex-shrink-0">
                                  {tv2FeaturedSubtitle.split("\n").map((line, i) => (
                                    <div key={i} className="font-black uppercase" style={{
                                      fontSize: "clamp(5px, 1.1vw, 13px)",
                                      color: tv2TextColor,
                                      fontFamily: "'Arial Black', 'Impact', sans-serif",
                                      lineHeight: 1.2,
                                    }}>{line}</div>
                                  ))}
                                </div>
                                <div style={getAnimStyle(tv2PriceAnimation, tv2AccentColor)}>
                                  <span className="font-black" style={{
                                    fontSize: "clamp(12px, 2.5vw, 28px)",
                                    color: tv2AccentColor,
                                    fontFamily: "'Arial Black', 'Impact', sans-serif",
                                    textShadow: tv2PriceAnimation === "glow" ? `0 0 10px ${tv2AccentColor}, 0 0 20px ${tv2AccentColor}` : "2px 2px 5px rgba(0,0,0,0.5)",
                                  }}>{tv2FeaturedPrice}</span>
                                </div>
                              </div>
                              <div className="absolute top-[42%] left-[5%] right-[5%] z-10">
                                <p style={{ fontSize: "clamp(3px, 0.55vw, 7px)", color: `${tv2TextColor}99`, fontFamily: "sans-serif", lineHeight: 1.3, textTransform: "uppercase", letterSpacing: "0.03em" }}>{tv2FeaturedDesc}</p>
                              </div>
                              {tv2FeaturedImage && (
                                <div className="absolute bottom-0 left-0 right-0 z-10" style={{ height: "52%", ...getAnimStyle(tv2ImageAnimation) }}>
                                  <img src={tv2FeaturedImage} alt="" className="w-full h-full object-contain object-bottom" style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.7))" }} />
                                </div>
                              )}
                            </div>

                            {/* Landscape: Right Menu Grid */}
                            <div className="w-[65%] h-full flex flex-col">
                              <div className="flex-1 grid grid-cols-4 grid-rows-2 gap-px p-px" style={{ background: `${tv2AccentColor}44` }}>
                                {tv2MenuItems.slice(0, 8).map((item, idx) => (
                                  <div key={item.id} className="relative flex flex-col items-center justify-center p-1" style={{ background: tv2BgColor }}>
                                    <div className="absolute top-0.5 left-1 font-bold" style={{ fontSize: "clamp(4px, 0.6vw, 8px)", color: tv2AccentColor }}>{idx + 1}</div>
                                    {item.image ? (
                                      <div className="w-[75%] aspect-square rounded overflow-hidden" style={getAnimStyle(item.animation)}>
                                        <img src={item.image} alt="" className="w-full h-full object-cover" />
                                      </div>
                                    ) : (
                                      <div className="w-[75%] aspect-square rounded border border-dashed flex items-center justify-center" style={{ borderColor: `${tv2AccentColor}44` }}>
                                        <ImageIcon className="h-3 w-3" style={{ color: `${tv2AccentColor}44` }} />
                                      </div>
                                    )}
                                    <div className="text-center w-full mt-0.5">
                                      <div className="font-bold truncate" style={{ fontSize: "clamp(4px, 0.65vw, 8px)", color: tv2TextColor }}>{item.name}</div>
                                      <div className="font-black" style={{ fontSize: "clamp(5px, 0.85vw, 11px)", color: tv2AccentColor }}>{item.price}</div>
                                      <div style={{ fontSize: "clamp(3px, 0.45vw, 5px)", color: `${tv2TextColor}88` }}>{item.calories}</div>
                                      <div className="truncate" style={{ fontSize: "clamp(2px, 0.35vw, 4px)", color: `${tv2TextColor}66` }}>{item.description}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Combo Banner */}
                              <div className="relative py-1 px-2 text-center overflow-hidden" style={{ background: tv2AccentColor }}>
                                {tv2ComboImage && (
                                  <div className="absolute inset-0 z-0" style={getAnimStyle(tv2ComboImageAnimation)}>
                                    <img src={tv2ComboImage} alt="" className="w-full h-full object-cover opacity-30" />
                                  </div>
                                )}
                                <div className="relative z-10" style={{ animation: "tv2_comboScroll 4s linear infinite" }}>
                                  <div className="font-bold" style={{ fontSize: "clamp(3px, 0.55vw, 7px)", color: tv2BgColor, textShadow: "0 1px 2px rgba(255,255,255,0.3)" }}>{tv2ComboText}</div>
                                  <div className="font-black" style={{ fontSize: "clamp(5px, 0.8vw, 10px)", color: tv2BgColor, textShadow: "0 1px 2px rgba(255,255,255,0.3)" }}>{tv2ComboPrice}</div>
                                </div>
                              </div>

                              {/* Kids Menu */}
                              <div className="relative px-2 py-1.5 overflow-hidden" style={{ background: tv2BgColor }}>
                                {tv2KidsImage && (
                                  <div className="absolute inset-0 z-0" style={getAnimStyle(tv2KidsImageAnimation)}>
                                    <img src={tv2KidsImage} alt="" className="w-full h-full object-cover opacity-25" />
                                  </div>
                                )}
                                <div className="relative z-10">
                                  <div className="font-black mb-0.5" style={{ fontSize: "clamp(6px, 1vw, 13px)", color: tv2AccentColor, fontFamily: "'Arial Black', 'Impact', sans-serif" }}>KIDS MENU</div>
                                  <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                                    {tv2KidsMenu.map((item) => (
                                      <div key={item.id} className="flex justify-between" style={getAnimStyle(item.animation, tv2AccentColor)}>
                                        <span className="font-bold" style={{ fontSize: "clamp(3px, 0.5vw, 6px)", color: tv2TextColor }}>{item.name}</span>
                                        <span className="font-black" style={{ fontSize: "clamp(3px, 0.5vw, 6px)", color: tv2AccentColor }}>{item.price}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="text-center mt-2 text-xs text-slate-500" data-testid="text-tv2-size-label">Preview: {tv2Size.label} TV — {tv2Orientation === "portrait" ? "Portrait 9:16" : "Landscape 16:9"}</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : activeTv === 3 ? (
              /* ============ TV 3 - FULL MENU BOARD ============ */
              <div className="grid grid-cols-1 xl:grid-cols-[minmax(350px,1fr)_minmax(500px,2fr)] gap-8">
                <div className="space-y-5 max-h-[80vh] overflow-y-auto pr-2">
                  <h2 className="text-lg font-bold text-slate-200 border-b border-slate-700 pb-2" data-testid="text-editor-title-tv3">Layout Editor — TV 3 (Full Menu)</h2>
                  <MusicInput value={tv3Music} onChange={setTv3Music} tvNum={3} />

                  <div className="space-y-3">
                    <div className="flex items-end gap-3">
                      <div className="flex-shrink-0">
                        <Label className="text-slate-400 text-xs">Logo</Label>
                        <div className="mt-1">
                          {tv3Logo ? (
                            <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-slate-600 relative group">
                              <img src={tv3Logo} alt="Logo" className="w-full h-full object-cover" />
                              <button onClick={() => setTv3Logo(null)} className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" data-testid="btn-remove-tv3-logo"><X className="h-4 w-4 text-white" /></button>
                            </div>
                          ) : (
                            <label className="w-14 h-14 rounded-full border-2 border-dashed border-slate-600 flex flex-col items-center justify-center cursor-pointer hover:border-amber-500 transition-colors" data-testid="btn-upload-tv3-logo">
                              <Upload className="h-4 w-4 text-slate-500" />
                              <input type="file" accept="image/*,video/*,.gif" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = () => setTv3Logo(r.result as string); r.readAsDataURL(f); } if (e.target) e.target.value = ""; }} />
                            </label>
                          )}
                        </div>
                      </div>
                      <div className="flex-1 grid grid-cols-3 gap-2">
                        <div>
                          <Label className="text-slate-400 text-xs">BG Color</Label>
                          <input type="color" value={tv3BgColor} onChange={e => setTv3BgColor(e.target.value)} className="w-full h-8 rounded cursor-pointer border-0 mt-1" data-testid="input-tv3-bg-color" />
                        </div>
                        <div>
                          <Label className="text-slate-400 text-xs">Accent Color</Label>
                          <input type="color" value={tv3AccentColor} onChange={e => setTv3AccentColor(e.target.value)} className="w-full h-8 rounded cursor-pointer border-0 mt-1" data-testid="input-tv3-accent-color" />
                        </div>
                        <div>
                          <Label className="text-slate-400 text-xs">Text Color</Label>
                          <input type="color" value={tv3TextColor} onChange={e => setTv3TextColor(e.target.value)} className="w-full h-8 rounded cursor-pointer border-0 mt-1" data-testid="input-tv3-text-color" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Starters Section */}
                  <div className="space-y-2 border border-slate-700 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-slate-300 text-sm font-bold">Section 1: Starters</Label>
                      <label className="flex items-center gap-1 cursor-pointer text-xs text-slate-400 hover:text-white" data-testid="btn-tv3-starters-image">
                        <Upload className="h-3 w-3" /><span>Image</span>
                        <input type="file" accept="image/*,video/*,.gif" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = () => setTv3StartersImage(r.result as string); r.readAsDataURL(f); } e.target.value = ""; }} />
                      </label>
                    </div>
                    <div className="flex gap-2 flex-wrap items-center">
                      {tv3StartersImage && <div className="relative w-12 h-10 rounded overflow-hidden"><img src={tv3StartersImage} className="w-full h-full object-cover" /><button onClick={() => setTv3StartersImage(null)} className="absolute top-0 right-0 bg-black/60 p-0.5"><X className="h-2 w-2 text-white" /></button></div>}
                      <label className="flex items-center gap-1 cursor-pointer text-[10px] text-slate-400 hover:text-white" data-testid="btn-tv3-starters-bg">
                        <Upload className="h-3 w-3" /><span>BG Image</span>
                        <input type="file" accept="image/*,video/*,.gif" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = () => setTv3StartersBgImage(r.result as string); r.readAsDataURL(f); } e.target.value = ""; }} />
                      </label>
                      {tv3StartersBgImage && <div className="relative w-12 h-10 rounded overflow-hidden border border-blue-500/50"><img src={tv3StartersBgImage} className="w-full h-full object-cover" /><button onClick={() => setTv3StartersBgImage(null)} className="absolute top-0 right-0 bg-black/60 p-0.5"><X className="h-2 w-2 text-white" /></button></div>}
                      <div className="flex items-center gap-1">
                        <Label className="text-slate-400 text-[10px] whitespace-nowrap">Anim</Label>
                        <select value={tv3StartersImageAnim} onChange={e => setTv3StartersImageAnim(e.target.value)} className="bg-slate-800 border border-slate-700 text-white text-[10px] rounded px-1 py-0.5 h-6" data-testid="select-tv3-starters-anim">
                          {[{value:"none",label:"None"},{value:"pulse",label:"Pulse"},{value:"bounce",label:"Bounce"},{value:"glow",label:"Glow"},{value:"shake",label:"Shake"},{value:"float",label:"Float"}].map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </div>
                    </div>
                    <Input value={tv3StartersTitle} onChange={e => setTv3StartersTitle(e.target.value)} className="bg-slate-800 border-slate-700 text-white text-sm" placeholder="Section title" data-testid="input-tv3-starters-title" />
                    {tv3Starters.map((item) => (
                      <div key={item.id} className="grid grid-cols-[1fr_60px_30px] gap-1 items-center">
                        <Input value={item.name} onChange={e => setTv3Starters(prev => prev.map(s => s.id === item.id ? { ...s, name: e.target.value } : s))} className="bg-slate-800 border-slate-700 text-white text-xs h-7" data-testid={`input-tv3-starter-name-${item.id}`} />
                        <Input value={item.price} onChange={e => setTv3Starters(prev => prev.map(s => s.id === item.id ? { ...s, price: e.target.value } : s))} className="bg-slate-800 border-slate-700 text-white text-xs h-7" data-testid={`input-tv3-starter-price-${item.id}`} />
                        <button onClick={() => setTv3Starters(prev => prev.filter(s => s.id !== item.id))} className="text-red-400 hover:text-red-300"><X className="h-3 w-3" /></button>
                      </div>
                    ))}
                    <Button size="sm" variant="outline" className="w-full text-xs h-7" onClick={() => setTv3Starters(prev => [...prev, { id: Date.now(), name: "New Item", price: "$0.00", calories: "" }])} data-testid="btn-tv3-add-starter"><Plus className="h-3 w-3 mr-1" />Add</Button>
                  </div>

                  {/* Bread & Sides Section */}
                  <div className="space-y-2 border border-slate-700 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-slate-300 text-sm font-bold">Section 2: Bread & Sides</Label>
                      <label className="flex items-center gap-1 cursor-pointer text-xs text-slate-400 hover:text-white" data-testid="btn-tv3-sides-image">
                        <Upload className="h-3 w-3" /><span>Image</span>
                        <input type="file" accept="image/*,video/*,.gif" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = () => setTv3SidesImage(r.result as string); r.readAsDataURL(f); } e.target.value = ""; }} />
                      </label>
                    </div>
                    <div className="flex gap-2 flex-wrap items-center">
                      {tv3SidesImage && <div className="relative w-12 h-10 rounded overflow-hidden"><img src={tv3SidesImage} className="w-full h-full object-cover" /><button onClick={() => setTv3SidesImage(null)} className="absolute top-0 right-0 bg-black/60 p-0.5"><X className="h-2 w-2 text-white" /></button></div>}
                      <label className="flex items-center gap-1 cursor-pointer text-[10px] text-slate-400 hover:text-white" data-testid="btn-tv3-sides-bg">
                        <Upload className="h-3 w-3" /><span>BG Image</span>
                        <input type="file" accept="image/*,video/*,.gif" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = () => setTv3SidesBgImage(r.result as string); r.readAsDataURL(f); } e.target.value = ""; }} />
                      </label>
                      {tv3SidesBgImage && <div className="relative w-12 h-10 rounded overflow-hidden border border-blue-500/50"><img src={tv3SidesBgImage} className="w-full h-full object-cover" /><button onClick={() => setTv3SidesBgImage(null)} className="absolute top-0 right-0 bg-black/60 p-0.5"><X className="h-2 w-2 text-white" /></button></div>}
                      <div className="flex items-center gap-1">
                        <Label className="text-slate-400 text-[10px] whitespace-nowrap">Anim</Label>
                        <select value={tv3SidesImageAnim} onChange={e => setTv3SidesImageAnim(e.target.value)} className="bg-slate-800 border border-slate-700 text-white text-[10px] rounded px-1 py-0.5 h-6" data-testid="select-tv3-sides-anim">
                          {[{value:"none",label:"None"},{value:"pulse",label:"Pulse"},{value:"bounce",label:"Bounce"},{value:"glow",label:"Glow"},{value:"shake",label:"Shake"},{value:"float",label:"Float"}].map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </div>
                    </div>
                    <Input value={tv3SidesTitle} onChange={e => setTv3SidesTitle(e.target.value)} className="bg-slate-800 border-slate-700 text-white text-sm" placeholder="Section title" data-testid="input-tv3-sides-title" />
                    {tv3Sides.map((item) => (
                      <div key={item.id} className="grid grid-cols-[1fr_60px_30px] gap-1 items-center">
                        <Input value={item.name} onChange={e => setTv3Sides(prev => prev.map(s => s.id === item.id ? { ...s, name: e.target.value } : s))} className="bg-slate-800 border-slate-700 text-white text-xs h-7" data-testid={`input-tv3-side-name-${item.id}`} />
                        <Input value={item.price} onChange={e => setTv3Sides(prev => prev.map(s => s.id === item.id ? { ...s, price: e.target.value } : s))} className="bg-slate-800 border-slate-700 text-white text-xs h-7" data-testid={`input-tv3-side-price-${item.id}`} />
                        <button onClick={() => setTv3Sides(prev => prev.filter(s => s.id !== item.id))} className="text-red-400 hover:text-red-300"><X className="h-3 w-3" /></button>
                      </div>
                    ))}
                    <Button size="sm" variant="outline" className="w-full text-xs h-7" onClick={() => setTv3Sides(prev => [...prev, { id: Date.now(), name: "New Item", price: "$0.00", calories: "" }])} data-testid="btn-tv3-add-side"><Plus className="h-3 w-3 mr-1" />Add</Button>
                    <div className="space-y-2 pt-1">
                      <div>
                        <Label className="text-slate-400 text-[10px]">Promo Text</Label>
                        <Input value={tv3CookiesText} onChange={e => setTv3CookiesText(e.target.value)} className="bg-slate-800 border-slate-700 text-white text-xs h-7" data-testid="input-tv3-cookies-text" />
                      </div>
                      <div>
                        <Label className="text-slate-400 text-[10px]">Promo Sub Text</Label>
                        <textarea value={tv3CookiesSubText} onChange={e => setTv3CookiesSubText(e.target.value)} className="w-full bg-slate-800 border border-slate-700 text-white text-[10px] rounded-md px-2 py-1 resize-none" rows={2} data-testid="input-tv3-cookies-subtext" />
                      </div>
                      <label className="flex items-center gap-1 cursor-pointer text-[10px] text-slate-400 hover:text-white" data-testid="btn-tv3-cookies-image">
                        <Upload className="h-3 w-3" /><span>Promo Image</span>
                        <input type="file" accept="image/*,video/*,.gif" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = () => setTv3CookiesImage(r.result as string); r.readAsDataURL(f); } e.target.value = ""; }} />
                      </label>
                      {tv3CookiesImage && <div className="relative w-10 h-10 rounded overflow-hidden mt-1"><img src={tv3CookiesImage} className="w-full h-full object-cover" /><button onClick={() => setTv3CookiesImage(null)} className="absolute top-0 right-0 bg-black/60 p-0.5"><X className="h-2 w-2 text-white" /></button></div>}
                    </div>
                  </div>

                  {/* Soft Drinks Section */}
                  <div className="space-y-2 border border-slate-700 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-slate-300 text-sm font-bold">Section 3: Soft Drinks</Label>
                      <div className="flex gap-1">
                        <label className="flex items-center gap-1 cursor-pointer text-xs text-slate-400 hover:text-white" data-testid="btn-tv3-drinks-image">
                          <Upload className="h-3 w-3" /><span>Image</span>
                          <input type="file" accept="image/*,video/*,.gif" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = () => setTv3DrinksImage(r.result as string); r.readAsDataURL(f); } e.target.value = ""; }} />
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer text-xs text-slate-400 hover:text-white" data-testid="btn-tv3-drinks-bg">
                          <Upload className="h-3 w-3" /><span>BG</span>
                          <input type="file" accept="image/*,video/*,.gif" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = () => setTv3DrinksBgImage(r.result as string); r.readAsDataURL(f); } e.target.value = ""; }} />
                        </label>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap items-center">
                      {tv3DrinksImage && <div className="relative w-12 h-10 rounded overflow-hidden"><img src={tv3DrinksImage} className="w-full h-full object-cover" /><button onClick={() => setTv3DrinksImage(null)} className="absolute top-0 right-0 bg-black/60 p-0.5"><X className="h-2 w-2 text-white" /></button></div>}
                      {tv3DrinksBgImage && <div className="relative w-12 h-10 rounded overflow-hidden border border-blue-500/50"><img src={tv3DrinksBgImage} className="w-full h-full object-cover" /><button onClick={() => setTv3DrinksBgImage(null)} className="absolute top-0 right-0 bg-black/60 p-0.5"><X className="h-2 w-2 text-white" /></button></div>}
                      <div className="flex items-center gap-1">
                        <Label className="text-slate-400 text-[10px] whitespace-nowrap">Anim</Label>
                        <select value={tv3DrinksImageAnim} onChange={e => setTv3DrinksImageAnim(e.target.value)} className="bg-slate-800 border border-slate-700 text-white text-[10px] rounded px-1 py-0.5 h-6" data-testid="select-tv3-drinks-anim">
                          {[{value:"none",label:"None"},{value:"pulse",label:"Pulse"},{value:"bounce",label:"Bounce"},{value:"glow",label:"Glow"},{value:"shake",label:"Shake"},{value:"float",label:"Float"}].map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </div>
                    </div>
                    <Input value={tv3DrinksTitle} onChange={e => setTv3DrinksTitle(e.target.value)} className="bg-slate-800 border-slate-700 text-white text-sm" placeholder="Section title" data-testid="input-tv3-drinks-title" />
                    {tv3Drinks.map((drink) => (
                      <div key={drink.id} className="grid grid-cols-[1fr_50px_50px_50px_30px] gap-1 items-center">
                        <Input value={drink.name} onChange={e => setTv3Drinks(prev => prev.map(d => d.id === drink.id ? { ...d, name: e.target.value } : d))} className="bg-slate-800 border-slate-700 text-white text-xs h-7" data-testid={`input-tv3-drink-name-${drink.id}`} />
                        <Input value={drink.small} onChange={e => setTv3Drinks(prev => prev.map(d => d.id === drink.id ? { ...d, small: e.target.value } : d))} className="bg-slate-800 border-slate-700 text-white text-xs h-7" placeholder="S" data-testid={`input-tv3-drink-small-${drink.id}`} />
                        <Input value={drink.medium} onChange={e => setTv3Drinks(prev => prev.map(d => d.id === drink.id ? { ...d, medium: e.target.value } : d))} className="bg-slate-800 border-slate-700 text-white text-xs h-7" placeholder="M" data-testid={`input-tv3-drink-med-${drink.id}`} />
                        <Input value={drink.large} onChange={e => setTv3Drinks(prev => prev.map(d => d.id === drink.id ? { ...d, large: e.target.value } : d))} className="bg-slate-800 border-slate-700 text-white text-xs h-7" placeholder="L" data-testid={`input-tv3-drink-large-${drink.id}`} />
                        <button onClick={() => setTv3Drinks(prev => prev.filter(d => d.id !== drink.id))} className="text-red-400 hover:text-red-300"><X className="h-3 w-3" /></button>
                      </div>
                    ))}
                    <Button size="sm" variant="outline" className="w-full text-xs h-7" onClick={() => setTv3Drinks(prev => [...prev, { id: Date.now(), name: "New Drink", small: "$0.00", medium: "$0.00", large: "$0.00", cal: "" }])} data-testid="btn-tv3-add-drink"><Plus className="h-3 w-3 mr-1" />Add</Button>
                  </div>

                  {/* Shakes Section */}
                  <div className="space-y-2 border border-slate-700 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-slate-300 text-sm font-bold">Section 4: Shakes</Label>
                      <label className="flex items-center gap-1 cursor-pointer text-xs text-slate-400 hover:text-white" data-testid="btn-tv3-shakes-image">
                        <Upload className="h-3 w-3" /><span>Image</span>
                        <input type="file" accept="image/*,video/*,.gif" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = () => setTv3ShakesImage(r.result as string); r.readAsDataURL(f); } e.target.value = ""; }} />
                      </label>
                    </div>
                    <div className="flex gap-2 flex-wrap items-center">
                      {tv3ShakesImage && <div className="relative w-12 h-10 rounded overflow-hidden"><img src={tv3ShakesImage} className="w-full h-full object-cover" /><button onClick={() => setTv3ShakesImage(null)} className="absolute top-0 right-0 bg-black/60 p-0.5"><X className="h-2 w-2 text-white" /></button></div>}
                      <label className="flex items-center gap-1 cursor-pointer text-[10px] text-slate-400 hover:text-white" data-testid="btn-tv3-shakes-bg">
                        <Upload className="h-3 w-3" /><span>BG Image</span>
                        <input type="file" accept="image/*,video/*,.gif" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = () => setTv3ShakesBgImage(r.result as string); r.readAsDataURL(f); } e.target.value = ""; }} />
                      </label>
                      {tv3ShakesBgImage && <div className="relative w-12 h-10 rounded overflow-hidden border border-blue-500/50"><img src={tv3ShakesBgImage} className="w-full h-full object-cover" /><button onClick={() => setTv3ShakesBgImage(null)} className="absolute top-0 right-0 bg-black/60 p-0.5"><X className="h-2 w-2 text-white" /></button></div>}
                      <div className="flex items-center gap-1">
                        <Label className="text-slate-400 text-[10px] whitespace-nowrap">Anim</Label>
                        <select value={tv3ShakesImageAnim} onChange={e => setTv3ShakesImageAnim(e.target.value)} className="bg-slate-800 border border-slate-700 text-white text-[10px] rounded px-1 py-0.5 h-6" data-testid="select-tv3-shakes-anim">
                          {[{value:"none",label:"None"},{value:"pulse",label:"Pulse"},{value:"bounce",label:"Bounce"},{value:"glow",label:"Glow"},{value:"shake",label:"Shake"},{value:"float",label:"Float"}].map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </div>
                    </div>
                    <textarea value={tv3ShakesTitle} onChange={e => setTv3ShakesTitle(e.target.value)} className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-md px-2 py-1 resize-none" rows={2} placeholder="Title (use Enter for line break)" data-testid="input-tv3-shakes-title" />
                    <div className="grid grid-cols-3 gap-2">
                      <div><Label className="text-slate-400 text-[10px]">Small</Label><Input value={tv3ShakeSmall} onChange={e => setTv3ShakeSmall(e.target.value)} className="bg-slate-800 border-slate-700 text-white text-xs h-7" data-testid="input-tv3-shake-small" /></div>
                      <div><Label className="text-slate-400 text-[10px]">Medium</Label><Input value={tv3ShakeMedium} onChange={e => setTv3ShakeMedium(e.target.value)} className="bg-slate-800 border-slate-700 text-white text-xs h-7" data-testid="input-tv3-shake-medium" /></div>
                      <div><Label className="text-slate-400 text-[10px]">Large</Label><Input value={tv3ShakeLarge} onChange={e => setTv3ShakeLarge(e.target.value)} className="bg-slate-800 border-slate-700 text-white text-xs h-7" data-testid="input-tv3-shake-large" /></div>
                    </div>
                    <Label className="text-slate-400 text-xs">Flavors</Label>
                    <div className="grid grid-cols-2 gap-1">
                      {tv3ShakeFlavors.map((flavor) => (
                        <div key={flavor.id} className="flex items-center gap-1">
                          <Input value={flavor.name} onChange={e => setTv3ShakeFlavors(prev => prev.map(f => f.id === flavor.id ? { ...f, name: e.target.value } : f))} className="bg-slate-800 border-slate-700 text-white text-xs h-7 flex-1" data-testid={`input-tv3-flavor-${flavor.id}`} />
                          <button onClick={() => setTv3ShakeFlavors(prev => prev.filter(f => f.id !== flavor.id))} className="text-red-400 hover:text-red-300"><X className="h-3 w-3" /></button>
                        </div>
                      ))}
                    </div>
                    <Button size="sm" variant="outline" className="w-full text-xs h-7" onClick={() => setTv3ShakeFlavors(prev => [...prev, { id: Date.now(), name: "New Flavor" }])} data-testid="btn-tv3-add-flavor"><Plus className="h-3 w-3 mr-1" />Add Flavor</Button>
                  </div>
                </div>

                {/* TV 3 Preview */}
                <div>
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                    <h2 className="text-lg font-bold text-slate-200" data-testid="text-tv3-preview-title">Live TV Preview — TV 3</h2>
                    <div className="flex items-center gap-2">
                      <div className="flex rounded-lg overflow-hidden border border-slate-700">
                        <button onClick={() => setTv3Orientation("landscape")} className={`px-3 py-1.5 text-xs font-medium ${tv3Orientation === "landscape" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400"}`} data-testid="btn-tv3-landscape">Landscape</button>
                        <button onClick={() => setTv3Orientation("portrait")} className={`px-3 py-1.5 text-xs font-medium ${tv3Orientation === "portrait" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400"}`} data-testid="btn-tv3-portrait">Portrait</button>
                      </div>
                      <div className="flex items-center gap-1">
                        <Monitor className="h-4 w-4 text-slate-500" />
                        {TV_SIZES.map((size, idx) => (
                          <button key={idx} onClick={() => setTv3SizeIndex(idx)} className={`px-1.5 py-1 text-[10px] rounded ${tv3SizeIndex === idx ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"}`} data-testid={`btn-tv3-size-${idx}`}>{size.label}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <div style={{ width: tv3Orientation === "portrait" ? tv3Size.width * 0.56 : tv3Size.width, maxWidth: "100%", transition: "width 0.3s ease" }}>
                      <div className="relative overflow-hidden rounded-xl shadow-2xl border-4 border-slate-800" style={{ aspectRatio: tv3Orientation === "portrait" ? "9/16" : "16/9", background: tv3BgColor }} data-testid="tv3-preview">
                        {tv3Logo && (
                          <div className="absolute z-20" style={{ top: "1%", right: tv3Orientation === "portrait" ? "3%" : "51%" }}>
                            <div className="rounded-full overflow-hidden border-2" style={{ borderColor: tv3AccentColor, width: "clamp(24px, 5vw, 48px)", height: "clamp(24px, 5vw, 48px)" }}>
                              <img src={tv3Logo} alt="Logo" className="w-full h-full object-cover" />
                            </div>
                          </div>
                        )}
                        {tv3Orientation === "portrait" ? (
                          /* Portrait: Vertical stack of 4 sections */
                          <div className="absolute inset-0 flex flex-col">
                            {/* Section 1: Starters */}
                            <div className="relative flex-1 overflow-hidden" style={{ borderBottom: `1px solid ${tv3AccentColor}44` }}>
                              {tv3StartersBgImage && <div className="absolute inset-0 z-0"><img src={tv3StartersBgImage} alt="" className="w-full h-full object-cover opacity-30" /></div>}
                              <div className="absolute inset-0 p-[3%] z-10">
                                <div className="flex items-center gap-[2%] mb-[3%]">
                                  <span style={{ fontSize: "clamp(7px, 2vw, 14px)", color: tv3AccentColor }}>🍴</span>
                                  <span className="font-black italic" style={{ fontSize: "clamp(8px, 2.5vw, 16px)", color: tv3AccentColor, fontFamily: "'Georgia', serif" }}>{tv3StartersTitle}</span>
                                </div>
                                <div className="flex gap-[3%]" style={{ paddingTop: tv3Logo ? "clamp(4px, 1.5vw, 12px)" : 0 }}>
                                  <div className="flex-1">
                                    {tv3Starters.slice(0, 5).map((item) => (
                                      <div key={item.id} className="flex justify-between items-baseline" style={{ marginBottom: "2px" }}>
                                        <span className="font-bold" style={{ fontSize: "clamp(4px, 1.1vw, 7px)", color: tv3TextColor }}>{item.name}</span>
                                        <span className="font-black" style={{ fontSize: "clamp(4px, 1.1vw, 7px)", color: tv3AccentColor }}>{item.price}</span>
                                      </div>
                                    ))}
                                  </div>
                                  <div className="flex-1" style={{ paddingRight: tv3Logo ? "clamp(8px, 3vw, 24px)" : 0 }}>
                                    {tv3Starters.slice(5).map((item) => (
                                      <div key={item.id} className="flex justify-between items-baseline" style={{ marginBottom: "2px" }}>
                                        <span className="font-bold" style={{ fontSize: "clamp(4px, 1.1vw, 7px)", color: tv3TextColor }}>{item.name}</span>
                                        <span className="font-black" style={{ fontSize: "clamp(4px, 1.1vw, 7px)", color: tv3AccentColor }}>{item.price}</span>
                                      </div>
                                    ))}
                                  </div>
                                  {tv3StartersImage && (
                                    <div className="w-[25%] flex-shrink-0 rounded overflow-hidden" style={tv3AnimStyle(tv3StartersImageAnim)}>
                                      <img src={tv3StartersImage} alt="" className="w-full h-full object-cover" />
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Section 2: Bread & Sides */}
                            <div className="relative flex-1 overflow-hidden" style={{ background: tv3SidesBgImage ? undefined : `${tv3AccentColor}15`, borderBottom: `1px solid ${tv3AccentColor}44` }}>
                              {tv3SidesBgImage && <div className="absolute inset-0 z-0"><img src={tv3SidesBgImage} alt="" className="w-full h-full object-cover opacity-30" /></div>}
                              <div className="absolute inset-0 p-[3%] z-10">
                                <div className="font-black uppercase mb-[2%]" style={{ fontSize: "clamp(7px, 2.2vw, 14px)", color: tv3AccentColor, fontFamily: "'Arial Black', sans-serif" }}>{tv3SidesTitle}</div>
                                <div className="flex gap-[3%]">
                                  {tv3SidesImage && (
                                    <div className="w-[25%] flex-shrink-0 rounded overflow-hidden" style={tv3AnimStyle(tv3SidesImageAnim)}>
                                      <img src={tv3SidesImage} alt="" className="w-full h-full object-cover" />
                                    </div>
                                  )}
                                  <div className="flex-1">
                                    {tv3Sides.map((item) => (
                                      <div key={item.id} className="flex justify-between items-baseline" style={{ marginBottom: "1px" }}>
                                        <span className="font-bold" style={{ fontSize: "clamp(4px, 1.1vw, 7px)", color: tv3TextColor }}>{item.name}</span>
                                        <span className="font-black" style={{ fontSize: "clamp(4px, 1.1vw, 7px)", color: tv3AccentColor }}>{item.price}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                <div className="mt-[2%] flex items-center gap-[2%]">
                                  {tv3CookiesImage && <div className="w-[15%] rounded overflow-hidden"><img src={tv3CookiesImage} alt="" className="w-full object-cover" /></div>}
                                  <div>
                                    <div className="font-black" style={{ fontSize: "clamp(6px, 2vw, 12px)", color: tv3AccentColor }}>{tv3CookiesText}</div>
                                    <div style={{ fontSize: "clamp(2px, 0.6vw, 4px)", color: `${tv3TextColor}88`, textTransform: "uppercase" }}>{tv3CookiesSubText}</div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Section 3: Soft Drinks */}
                            <div className="relative flex-1 overflow-hidden" style={{ borderBottom: `1px solid ${tv3AccentColor}44` }}>
                              {tv3DrinksBgImage && <div className="absolute inset-0 z-0"><img src={tv3DrinksBgImage} alt="" className="w-full h-full object-cover opacity-30" /></div>}
                              <div className="absolute inset-0 p-[3%] z-10">
                                <div className="flex items-center gap-[2%] mb-[2%]">
                                  <span style={{ fontSize: "clamp(6px, 1.8vw, 12px)", color: tv3AccentColor }}>🍺</span>
                                  <span className="font-black uppercase" style={{ fontSize: "clamp(7px, 2.2vw, 14px)", color: tv3AccentColor, fontFamily: "'Arial Black', sans-serif" }}>{tv3DrinksTitle}</span>
                                </div>
                                <div className="flex gap-[3%]">
                                  <div className="flex-1">
                                    <div className="grid grid-cols-4 gap-x-1 mb-[2%]">
                                      <div></div>
                                      <div className="text-center font-bold" style={{ fontSize: "clamp(3px, 0.8vw, 5px)", color: tv3AccentColor }}>Small</div>
                                      <div className="text-center font-bold" style={{ fontSize: "clamp(3px, 0.8vw, 5px)", color: tv3AccentColor }}>Medium</div>
                                      <div className="text-center font-bold" style={{ fontSize: "clamp(3px, 0.8vw, 5px)", color: tv3AccentColor }}>Large</div>
                                    </div>
                                    {tv3Drinks.map((drink) => (
                                      <div key={drink.id} className="grid grid-cols-4 gap-x-1" style={{ marginBottom: "1px" }}>
                                        <span className="font-bold" style={{ fontSize: "clamp(3px, 0.9vw, 6px)", color: tv3TextColor }}>{drink.name}</span>
                                        <span className="text-center font-black" style={{ fontSize: "clamp(3px, 0.9vw, 6px)", color: tv3AccentColor }}>{drink.small}</span>
                                        <span className="text-center font-black" style={{ fontSize: "clamp(3px, 0.9vw, 6px)", color: tv3AccentColor }}>{drink.medium}</span>
                                        <span className="text-center font-black" style={{ fontSize: "clamp(3px, 0.9vw, 6px)", color: tv3AccentColor }}>{drink.large}</span>
                                      </div>
                                    ))}
                                  </div>
                                  {tv3DrinksImage && <div className="w-[25%] flex-shrink-0 rounded overflow-hidden" style={tv3AnimStyle(tv3DrinksImageAnim)}><img src={tv3DrinksImage} alt="" className="w-full h-full object-cover" /></div>}
                                </div>
                              </div>
                            </div>

                            {/* Section 4: Shakes */}
                            <div className="relative flex-1 overflow-hidden">
                              {tv3ShakesBgImage && <div className="absolute inset-0 z-0"><img src={tv3ShakesBgImage} alt="" className="w-full h-full object-cover opacity-30" /></div>}
                              <div className="absolute inset-0 p-[3%] z-10">
                                <div className="flex gap-[3%]">
                                  <div className="flex-1">
                                    <div className="font-black uppercase" style={{ fontSize: "clamp(7px, 2.2vw, 14px)", color: tv3AccentColor, fontFamily: "'Arial Black', sans-serif", lineHeight: 1.1 }}>
                                      {tv3ShakesTitle.split("\n").map((l, i) => <div key={i}>{l}</div>)}
                                    </div>
                                    <div className="mt-[3%] space-y-[1px]">
                                      <div className="flex justify-between"><span className="font-bold" style={{ fontSize: "clamp(3px, 0.9vw, 6px)", color: tv3TextColor }}>Small</span><span className="font-black" style={{ fontSize: "clamp(4px, 1.2vw, 8px)", color: tv3AccentColor }}>{tv3ShakeSmall}</span></div>
                                      <div className="flex justify-between"><span className="font-bold" style={{ fontSize: "clamp(3px, 0.9vw, 6px)", color: tv3TextColor }}>Medium</span><span className="font-black" style={{ fontSize: "clamp(4px, 1.2vw, 8px)", color: tv3AccentColor }}>{tv3ShakeMedium}</span></div>
                                      <div className="flex justify-between"><span className="font-bold" style={{ fontSize: "clamp(3px, 0.9vw, 6px)", color: tv3TextColor }}>Large</span><span className="font-black" style={{ fontSize: "clamp(4px, 1.2vw, 8px)", color: tv3AccentColor }}>{tv3ShakeLarge}</span></div>
                                    </div>
                                    <div className="mt-[3%] grid grid-cols-2 gap-x-2 gap-y-[1px]">
                                      {tv3ShakeFlavors.map(f => <span key={f.id} className="font-bold" style={{ fontSize: "clamp(3px, 0.8vw, 5px)", color: tv3TextColor }}>{f.name}</span>)}
                                    </div>
                                  </div>
                                  {tv3ShakesImage && <div className="w-[30%] flex-shrink-0 rounded overflow-hidden" style={tv3AnimStyle(tv3ShakesImageAnim)}><img src={tv3ShakesImage} alt="" className="w-full h-full object-contain" /></div>}
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* Landscape: 2x2 grid layout */
                          <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
                            {/* Top-Left: Starters */}
                            <div className="relative overflow-hidden" style={{ borderRight: `1px solid ${tv3AccentColor}33`, borderBottom: `1px solid ${tv3AccentColor}33` }}>
                              {tv3StartersBgImage && <div className="absolute inset-0 z-0"><img src={tv3StartersBgImage} alt="" className="w-full h-full object-cover opacity-30" /></div>}
                              <div className="absolute inset-0 p-[4%] z-10">
                                <div className="flex items-center gap-[3%] mb-[3%]">
                                  <span style={{ fontSize: "clamp(8px, 1.2vw, 16px)", color: tv3AccentColor }}>🍴</span>
                                  <span className="font-black italic" style={{ fontSize: "clamp(8px, 1.5vw, 18px)", color: tv3AccentColor, fontFamily: "'Georgia', serif" }}>{tv3StartersTitle}</span>
                                </div>
                                <div className="flex gap-[4%]">
                                  <div className="flex-1 space-y-[1px]">
                                    {tv3Starters.slice(0, 5).map((item) => (
                                      <div key={item.id} className="flex justify-between items-baseline">
                                        <span className="font-bold" style={{ fontSize: "clamp(3px, 0.55vw, 6px)", color: tv3TextColor }}>{item.name}</span>
                                        <span className="font-black ml-1" style={{ fontSize: "clamp(3px, 0.6vw, 7px)", color: tv3AccentColor }}>{item.price}</span>
                                      </div>
                                    ))}
                                  </div>
                                  {tv3StartersImage && (
                                    <div className="w-[28%] flex-shrink-0 rounded overflow-hidden self-start" style={tv3AnimStyle(tv3StartersImageAnim)}>
                                      <img src={tv3StartersImage} alt="" className="w-full object-cover" style={{ maxHeight: "100%" }} />
                                    </div>
                                  )}
                                  <div className="flex-1 space-y-[1px]" style={{ paddingTop: tv3Logo ? "clamp(12px, 3vw, 28px)" : 0 }}>
                                    {tv3Starters.slice(5).map((item) => (
                                      <div key={item.id} className="flex justify-between items-baseline">
                                        <span className="font-bold" style={{ fontSize: "clamp(3px, 0.55vw, 6px)", color: tv3TextColor }}>{item.name}</span>
                                        <span className="font-black ml-1" style={{ fontSize: "clamp(3px, 0.6vw, 7px)", color: tv3AccentColor }}>{item.price}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Top-Right: Soft Drinks */}
                            <div className="relative overflow-hidden" style={{ borderBottom: `1px solid ${tv3AccentColor}33` }}>
                              {tv3DrinksBgImage && <div className="absolute inset-0 z-0"><img src={tv3DrinksBgImage} alt="" className="w-full h-full object-cover opacity-30" /></div>}
                              <div className="absolute inset-0 p-[4%] z-10">
                                <div className="flex items-center gap-[3%] mb-[3%]">
                                  <span style={{ fontSize: "clamp(6px, 1vw, 14px)", color: tv3AccentColor }}>🍺</span>
                                  <span className="font-black uppercase" style={{ fontSize: "clamp(7px, 1.3vw, 16px)", color: tv3AccentColor, fontFamily: "'Arial Black', sans-serif" }}>{tv3DrinksTitle}</span>
                                </div>
                                <div className="flex gap-[4%]">
                                  <div className="flex-1">
                                    <div className="grid grid-cols-5 gap-x-1 mb-[3%]">
                                      <div></div>
                                      <div className="text-center font-bold" style={{ fontSize: "clamp(2px, 0.45vw, 5px)", color: tv3AccentColor }}>Small</div>
                                      <div className="text-center font-bold" style={{ fontSize: "clamp(2px, 0.45vw, 5px)", color: tv3AccentColor }}>Medium</div>
                                      <div className="text-center font-bold" style={{ fontSize: "clamp(2px, 0.45vw, 5px)", color: tv3AccentColor }}>Large</div>
                                      <div className="text-center font-bold" style={{ fontSize: "clamp(2px, 0.45vw, 5px)", color: tv3AccentColor }}>Cal</div>
                                    </div>
                                    {tv3Drinks.map((drink) => (
                                      <div key={drink.id} className="grid grid-cols-5 gap-x-1" style={{ marginBottom: "2px" }}>
                                        <span className="font-bold" style={{ fontSize: "clamp(2px, 0.5vw, 5px)", color: tv3TextColor }}>{drink.name}</span>
                                        <span className="text-center font-black" style={{ fontSize: "clamp(2px, 0.5vw, 5px)", color: tv3AccentColor }}>{drink.small}</span>
                                        <span className="text-center font-black" style={{ fontSize: "clamp(2px, 0.5vw, 5px)", color: tv3AccentColor }}>{drink.medium}</span>
                                        <span className="text-center font-black" style={{ fontSize: "clamp(2px, 0.5vw, 5px)", color: tv3AccentColor }}>{drink.large}</span>
                                        <span className="text-center" style={{ fontSize: "clamp(2px, 0.4vw, 4px)", color: `${tv3TextColor}88` }}>{drink.cal}</span>
                                      </div>
                                    ))}
                                  </div>
                                  {tv3DrinksImage && <div className="w-[30%] flex-shrink-0 rounded overflow-hidden" style={tv3AnimStyle(tv3DrinksImageAnim)}><img src={tv3DrinksImage} alt="" className="w-full h-full object-cover" /></div>}
                                </div>
                              </div>
                            </div>

                            {/* Bottom-Left: Bread & Sides */}
                            <div className="relative overflow-hidden" style={{ background: tv3SidesBgImage ? undefined : `${tv3AccentColor}12`, borderRight: `1px solid ${tv3AccentColor}33` }}>
                              {tv3SidesBgImage && <div className="absolute inset-0 z-0"><img src={tv3SidesBgImage} alt="" className="w-full h-full object-cover opacity-30" /></div>}
                              <div className="absolute inset-0 p-[4%] z-10">
                                <div className="font-black uppercase mb-[3%]" style={{ fontSize: "clamp(7px, 1.3vw, 16px)", color: tv3AccentColor, fontFamily: "'Arial Black', sans-serif" }}>{tv3SidesTitle}</div>
                                <div className="flex gap-[4%]">
                                  {tv3SidesImage && (
                                    <div className="w-[28%] flex-shrink-0 rounded overflow-hidden" style={tv3AnimStyle(tv3SidesImageAnim)}>
                                      <img src={tv3SidesImage} alt="" className="w-full object-cover" />
                                    </div>
                                  )}
                                  <div className="flex-1 space-y-[1px]">
                                    {tv3Sides.map((item) => (
                                      <div key={item.id} className="flex justify-between items-baseline">
                                        <span className="font-bold" style={{ fontSize: "clamp(3px, 0.55vw, 6px)", color: tv3TextColor }}>{item.name}</span>
                                        <span className="font-black ml-1" style={{ fontSize: "clamp(3px, 0.6vw, 7px)", color: tv3AccentColor }}>{item.price}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                <div className="absolute bottom-[4%] left-[4%] right-[4%] flex items-end gap-[3%]">
                                  {tv3CookiesImage && <div className="w-[18%] rounded overflow-hidden"><img src={tv3CookiesImage} alt="" className="w-full object-cover" /></div>}
                                  <div>
                                    <div className="font-black" style={{ fontSize: "clamp(5px, 1vw, 12px)", color: tv3AccentColor }}>{tv3CookiesText}<span style={{ fontSize: "60%", verticalAlign: "sub", color: tv3TextColor }}> Each</span></div>
                                    <div style={{ fontSize: "clamp(2px, 0.35vw, 3px)", color: `${tv3TextColor}77`, textTransform: "uppercase", lineHeight: 1.2 }}>{tv3CookiesSubText}</div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Bottom-Right: Shakes */}
                            <div className="relative overflow-hidden">
                              {tv3ShakesBgImage && <div className="absolute inset-0 z-0"><img src={tv3ShakesBgImage} alt="" className="w-full h-full object-cover opacity-30" /></div>}
                              <div className="absolute inset-0 p-[4%] z-10">
                                <div className="font-black uppercase" style={{ fontSize: "clamp(7px, 1.3vw, 16px)", color: tv3AccentColor, fontFamily: "'Arial Black', sans-serif", lineHeight: 1.1 }}>
                                  {tv3ShakesTitle.split("\n").map((l, i) => <div key={i}>{l}</div>)}
                                </div>
                                <div className="flex gap-[4%] mt-[3%]">
                                  <div className="flex-1">
                                    <div className="space-y-[2px]">
                                      <div className="flex justify-between items-baseline"><span className="font-bold" style={{ fontSize: "clamp(3px, 0.5vw, 5px)", color: tv3TextColor }}>Small</span><span className="font-black" style={{ fontSize: "clamp(4px, 0.8vw, 9px)", color: tv3AccentColor }}>{tv3ShakeSmall}</span></div>
                                      <div className="flex justify-between items-baseline"><span className="font-bold" style={{ fontSize: "clamp(3px, 0.5vw, 5px)", color: tv3TextColor }}>Medium</span><span className="font-black" style={{ fontSize: "clamp(4px, 0.8vw, 9px)", color: tv3AccentColor }}>{tv3ShakeMedium}</span></div>
                                      <div className="flex justify-between items-baseline"><span className="font-bold" style={{ fontSize: "clamp(3px, 0.5vw, 5px)", color: tv3TextColor }}>Large</span><span className="font-black" style={{ fontSize: "clamp(4px, 0.8vw, 9px)", color: tv3AccentColor }}>{tv3ShakeLarge}</span></div>
                                    </div>
                                    <div className="mt-[5%] grid grid-cols-2 gap-x-3 gap-y-[2px]">
                                      {tv3ShakeFlavors.map(f => <span key={f.id} className="font-bold" style={{ fontSize: "clamp(2px, 0.45vw, 5px)", color: tv3TextColor }}>{f.name}</span>)}
                                    </div>
                                  </div>
                                  {tv3ShakesImage && <div className="w-[35%] flex-shrink-0 rounded overflow-hidden" style={tv3AnimStyle(tv3ShakesImageAnim)}><img src={tv3ShakesImage} alt="" className="w-full h-full object-contain" /></div>}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="text-center mt-2 text-xs text-slate-500" data-testid="text-tv3-size-label">Preview: {tv3Size.label} TV — {tv3Orientation === "portrait" ? "Portrait 9:16" : "Landscape 16:9"}</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : activeTv === 4 ? (
              <div className="grid grid-cols-1 xl:grid-cols-[minmax(350px,1fr)_minmax(500px,2fr)] gap-8">
                {/* TV 4 Editor Panel */}
                <div className="space-y-5">
                  <h2 className="text-lg font-bold text-slate-200 border-b border-slate-700 pb-2" data-testid="text-tv4-editor-title">Layout Editor — TV 4 (Pizza Promo)</h2>
                  <MusicInput value={tv4Music} onChange={setTv4Music} tvNum={4} />
                  
                  {/* Colors */}
                  <div className="space-y-2">
                    <Label className="text-slate-300 text-xs font-semibold">Colors</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <div><label className="text-[10px] text-slate-400">Background</label><input type="color" value={tv4BgColor} onChange={e => setTv4BgColor(e.target.value)} className="w-full h-8 rounded cursor-pointer" data-testid="input-tv4-bg-color" /></div>
                      <div><label className="text-[10px] text-slate-400">Accent</label><input type="color" value={tv4AccentColor} onChange={e => setTv4AccentColor(e.target.value)} className="w-full h-8 rounded cursor-pointer" data-testid="input-tv4-accent-color" /></div>
                      <div><label className="text-[10px] text-slate-400">Text</label><input type="color" value={tv4TextColor} onChange={e => setTv4TextColor(e.target.value)} className="w-full h-8 rounded cursor-pointer" data-testid="input-tv4-text-color" /></div>
                    </div>
                  </div>

                  {/* Logo */}
                  <div className="space-y-2">
                    <Label className="text-slate-300 text-xs font-semibold">Logo</Label>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors">
                        <Upload className="h-3.5 w-3.5 text-slate-400" /><span className="text-xs text-slate-300">Upload Logo</span>
                        <input type="file" accept="image/*,video/*,.gif" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = ev => setTv4Logo(ev.target?.result as string); r.readAsDataURL(f); }}} data-testid="input-tv4-logo" />
                      </label>
                      {tv4Logo && <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-blue-500"><img src={tv4Logo} className="w-full h-full object-cover" /><button onClick={() => setTv4Logo(null)} className="absolute -top-1 -right-1 bg-red-600 rounded-full p-0.5"><X className="h-2 w-2 text-white" /></button></div>}
                    </div>
                  </div>

                  {/* Main Product Image */}
                  <div className="space-y-2">
                    <Label className="text-slate-300 text-xs font-semibold">Main Product Image</Label>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors">
                        <ImageIcon className="h-3.5 w-3.5 text-slate-400" /><span className="text-xs text-slate-300">Upload Image</span>
                        <input type="file" accept="image/*,video/*,.gif" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = ev => setTv4MainImage(ev.target?.result as string); r.readAsDataURL(f); }}} data-testid="input-tv4-main-image" />
                      </label>
                      {tv4MainImage && <div className="relative w-14 h-14 rounded overflow-hidden border border-blue-500/50"><img src={tv4MainImage} className="w-full h-full object-cover" /><button onClick={() => setTv4MainImage(null)} className="absolute top-0 right-0 bg-black/60 p-0.5"><X className="h-2 w-2 text-white" /></button></div>}
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400">Animation</label>
                      <select value={tv4MainImageAnim} onChange={e => setTv4MainImageAnim(e.target.value)} className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-1 py-1.5 text-xs mt-1" data-testid="select-tv4-main-anim">
                        {[{value:"none",label:"None"},{value:"rotate",label:"Rotate"},{value:"rotateSlow",label:"Rotate Slow"},{value:"rotateFast",label:"Rotate Fast"},{value:"pulse",label:"Pulse"},{value:"bounce",label:"Bounce"},{value:"glow",label:"Glow"},{value:"shake",label:"Shake"},{value:"float",label:"Float"},{value:"swing",label:"Swing"},{value:"flash",label:"Flash"},{value:"zoomPulse",label:"Zoom Pulse"},{value:"slideIn",label:"Slide In"}].map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Background Media (image/video/gif) */}
                  <div className="space-y-2">
                    <Label className="text-slate-300 text-xs font-semibold">Background Media</Label>
                    <div className="flex gap-2 mb-2">
                      {(["image", "video", "gif"] as const).map(t => (
                        <button key={t} onClick={() => { setTv4BgMediaType(t); setTv4BgMedia(null); }} className={`px-3 py-1 text-[10px] rounded ${tv4BgMediaType === t ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400"}`} data-testid={`btn-tv4-bg-${t}`}>{t.toUpperCase()}</button>
                      ))}
                    </div>
                    <label className="flex items-center gap-2 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors">
                      <Upload className="h-3.5 w-3.5 text-slate-400" /><span className="text-xs text-slate-300">Upload {tv4BgMediaType === "gif" ? "GIF" : tv4BgMediaType === "video" ? "Video" : "Image"}</span>
                      <input type="file" accept={tv4BgMediaType === "video" ? "video/*" : "image/*"} className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = ev => setTv4BgMedia(ev.target?.result as string); r.readAsDataURL(f); }}} data-testid="input-tv4-bg-media" />
                    </label>
                    {tv4BgMedia && <div className="relative w-20 h-12 rounded overflow-hidden border border-blue-500/50">
                      {tv4BgMediaType === "video" ? <video src={tv4BgMedia} className="w-full h-full object-cover" muted autoPlay loop /> : <img src={tv4BgMedia} className="w-full h-full object-cover" />}
                      <button onClick={() => setTv4BgMedia(null)} className="absolute top-0 right-0 bg-black/60 p-0.5"><X className="h-2 w-2 text-white" /></button>
                    </div>}
                  </div>

                  {/* Size Icon */}
                  <div className="space-y-2">
                    <Label className="text-slate-300 text-xs font-semibold">Size Icon (small icons on right)</Label>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors">
                        <ImageIcon className="h-3.5 w-3.5 text-slate-400" /><span className="text-xs text-slate-300">Upload Icon</span>
                        <input type="file" accept="image/*,video/*,.gif" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = ev => setTv4SizeIcon(ev.target?.result as string); r.readAsDataURL(f); }}} data-testid="input-tv4-size-icon" />
                      </label>
                      {tv4SizeIcon && <div className="relative w-10 h-10 rounded-full overflow-hidden border border-blue-500/50"><img src={tv4SizeIcon} className="w-full h-full object-cover" /><button onClick={() => setTv4SizeIcon(null)} className="absolute top-0 right-0 bg-black/60 p-0.5"><X className="h-2 w-2 text-white" /></button></div>}
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400">Icon Animation</label>
                      <select value={tv4SizeIconAnim} onChange={e => setTv4SizeIconAnim(e.target.value)} className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-1 py-1.5 text-xs mt-1" data-testid="select-tv4-icon-anim">
                        {[{value:"none",label:"None"},{value:"rotate",label:"Rotate"},{value:"rotateSlow",label:"Rotate Slow"},{value:"rotateFast",label:"Rotate Fast"},{value:"pulse",label:"Pulse"},{value:"bounce",label:"Bounce"},{value:"glow",label:"Glow"},{value:"shake",label:"Shake"},{value:"float",label:"Float"},{value:"swing",label:"Swing"},{value:"zoomPulse",label:"Zoom Pulse"}].map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Title Text */}
                  <div className="space-y-2">
                    <Label className="text-slate-300 text-xs font-semibold">Title Text</Label>
                    <Input value={tv4TitleLine1} onChange={e => setTv4TitleLine1(e.target.value)} className="bg-slate-800 border-slate-700 text-white text-xs" placeholder="Line 1 (e.g. Special)" data-testid="input-tv4-title1" />
                    <Input value={tv4TitleLine2} onChange={e => setTv4TitleLine2(e.target.value)} className="bg-slate-800 border-slate-700 text-white text-xs" placeholder="Line 2 (e.g. Pizza Offer)" data-testid="input-tv4-title2" />
                    <div>
                      <label className="text-[10px] text-slate-400">Title Animation</label>
                      <select value={tv4TitleAnim} onChange={e => setTv4TitleAnim(e.target.value)} className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-1 py-1.5 text-xs mt-1" data-testid="select-tv4-title-anim">
                        {[{value:"none",label:"None"},{value:"pulse",label:"Pulse"},{value:"bounce",label:"Bounce"},{value:"glow",label:"Glow"},{value:"shake",label:"Shake"},{value:"float",label:"Float"},{value:"swing",label:"Swing"},{value:"flash",label:"Flash"},{value:"slideIn",label:"Slide In"}].map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Size Items */}
                  <div className="space-y-2">
                    <Label className="text-slate-300 text-xs font-semibold">Size & Price Options</Label>
                    {tv4Sizes.map((s, i) => (
                      <div key={s.id} className="flex gap-2 items-center">
                        <Input value={s.label} onChange={e => setTv4Sizes(prev => prev.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} className="bg-slate-800 border-slate-700 text-white text-xs flex-1" data-testid={`input-tv4-size-label-${i}`} />
                        <Input value={s.price} onChange={e => setTv4Sizes(prev => prev.map((x, j) => j === i ? { ...x, price: e.target.value } : x))} className="bg-slate-800 border-slate-700 text-white text-xs w-24" data-testid={`input-tv4-size-price-${i}`} />
                        {tv4Sizes.length > 1 && <button onClick={() => setTv4Sizes(prev => prev.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-300"><X className="h-3.5 w-3.5" /></button>}
                      </div>
                    ))}
                    {tv4Sizes.length < 6 && <button onClick={() => setTv4Sizes(prev => [...prev, { id: Date.now(), label: "New Size", price: "£ 0.00" }])} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1" data-testid="btn-tv4-add-size"><Plus className="h-3 w-3" />Add Size</button>}
                  </div>
                </div>

                {/* TV 4 Preview Panel */}
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <div className="flex bg-slate-800 rounded-lg overflow-hidden border border-slate-700">
                      <button onClick={() => setTv4Orientation("landscape")} className={`px-3 py-1.5 text-xs font-medium ${tv4Orientation === "landscape" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400"}`} data-testid="btn-tv4-landscape">Landscape</button>
                      <button onClick={() => setTv4Orientation("portrait")} className={`px-3 py-1.5 text-xs font-medium ${tv4Orientation === "portrait" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400"}`} data-testid="btn-tv4-portrait">Portrait</button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4 text-slate-400" />
                      <div className="flex gap-1">
                        {TV_SIZES.map((s, i) => (
                          <button key={s.label} onClick={() => setTv4SizeIndex(i)} className={`px-2 py-1 text-[10px] rounded ${i === tv4SizeIndex ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`} data-testid={`btn-tv4-size-${i}`}>{s.label}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <div style={{ width: tv4Orientation === "portrait" ? tv4Size.width * 0.56 : tv4Size.width, maxWidth: "100%", transition: "width 0.3s ease" }}>
                      <div className="relative overflow-hidden rounded-xl shadow-2xl border-4 border-slate-800" style={{ aspectRatio: tv4Orientation === "portrait" ? "9/16" : "16/9", background: tv4BgColor }} data-testid="tv4-preview">
                        
                        {tv4BgMedia && (
                          <div className="absolute inset-0 z-0">
                            {tv4BgMediaType === "video" ? (
                              <video src={tv4BgMedia} className="w-full h-full object-cover opacity-30" muted autoPlay loop />
                            ) : (
                              <img src={tv4BgMedia} alt="" className="w-full h-full object-cover opacity-30" />
                            )}
                          </div>
                        )}

                        {tv4Logo && (
                          <div className="absolute z-20" style={{ top: "3%", left: "3%" }}>
                            <div className="rounded-full overflow-hidden border-2" style={{ borderColor: tv4AccentColor, width: "clamp(20px, 4vw, 40px)", height: "clamp(20px, 4vw, 40px)" }}>
                              <img src={tv4Logo} alt="Logo" className="w-full h-full object-cover" />
                            </div>
                          </div>
                        )}

                        {tv4Orientation === "landscape" ? (
                          <div className="absolute inset-0 flex z-10">
                            <div className="flex-[3] flex flex-col justify-end items-center p-[4%] relative">
                              {tv4MainImage && (
                                <div className="flex-1 flex items-center justify-center w-full" style={tv4AnimStyle(tv4MainImageAnim)}>
                                  <img src={tv4MainImage} alt="" className="max-w-[85%] max-h-[75%] object-contain drop-shadow-2xl" style={{ filter: "drop-shadow(0 10px 30px rgba(0,0,0,0.6))" }} />
                                </div>
                              )}
                              <div className="w-full text-left" style={tv4AnimStyle(tv4TitleAnim)}>
                                <div className="italic font-bold" style={{ fontSize: "clamp(10px, 3vw, 28px)", color: tv4AccentColor, fontFamily: "'Georgia', serif" }}>{tv4TitleLine1}</div>
                                <div className="font-black uppercase" style={{ fontSize: "clamp(14px, 4.5vw, 44px)", color: tv4TextColor, fontFamily: "'Arial Black', sans-serif", lineHeight: 1, textShadow: `0 2px 8px rgba(0,0,0,0.5)` }}>{tv4TitleLine2}</div>
                              </div>
                            </div>
                            <div className="flex-[1.5] flex flex-col justify-around p-[3%]">
                              {tv4Sizes.map((s) => (
                                <div key={s.id} className="flex items-center gap-[6%]">
                                  <div className="flex-1">
                                    <div className="italic font-bold" style={{ fontSize: "clamp(7px, 2vw, 18px)", color: tv4AccentColor, fontFamily: "'Georgia', serif" }}>{s.label}</div>
                                    <div className="font-black" style={{ fontSize: "clamp(8px, 2.2vw, 20px)", color: tv4TextColor }}>{s.price}</div>
                                  </div>
                                  {tv4SizeIcon && (
                                    <div className="rounded-full overflow-hidden flex-shrink-0" style={{ width: "clamp(18px, 4vw, 40px)", height: "clamp(18px, 4vw, 40px)", ...tv4AnimStyle(tv4SizeIconAnim) }}>
                                      <img src={tv4SizeIcon} alt="" className="w-full h-full object-cover" />
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="absolute inset-0 flex flex-col z-10">
                            <div className="flex-[2] flex items-center justify-center p-[4%]">
                              {tv4MainImage && (
                                <div style={tv4AnimStyle(tv4MainImageAnim)}>
                                  <img src={tv4MainImage} alt="" className="max-w-[80%] max-h-[90%] object-contain drop-shadow-2xl mx-auto" style={{ filter: "drop-shadow(0 10px 30px rgba(0,0,0,0.6))" }} />
                                </div>
                              )}
                            </div>
                            <div className="px-[5%] py-[2%]" style={tv4AnimStyle(tv4TitleAnim)}>
                              <div className="italic font-bold" style={{ fontSize: "clamp(10px, 4vw, 28px)", color: tv4AccentColor, fontFamily: "'Georgia', serif" }}>{tv4TitleLine1}</div>
                              <div className="font-black uppercase" style={{ fontSize: "clamp(16px, 6vw, 48px)", color: tv4TextColor, fontFamily: "'Arial Black', sans-serif", lineHeight: 1, textShadow: `0 2px 8px rgba(0,0,0,0.5)` }}>{tv4TitleLine2}</div>
                            </div>
                            <div className="flex-[1.5] grid grid-cols-2 gap-[2%] p-[4%]">
                              {tv4Sizes.map((s) => (
                                <div key={s.id} className="flex items-center gap-[6%] p-[3%] rounded-lg" style={{ background: `${tv4AccentColor}15` }}>
                                  {tv4SizeIcon && (
                                    <div className="rounded-full overflow-hidden flex-shrink-0" style={{ width: "clamp(16px, 5vw, 36px)", height: "clamp(16px, 5vw, 36px)", ...tv4AnimStyle(tv4SizeIconAnim) }}>
                                      <img src={tv4SizeIcon} alt="" className="w-full h-full object-cover" />
                                    </div>
                                  )}
                                  <div>
                                    <div className="italic font-bold" style={{ fontSize: "clamp(6px, 2.5vw, 16px)", color: tv4AccentColor, fontFamily: "'Georgia', serif" }}>{s.label}</div>
                                    <div className="font-black" style={{ fontSize: "clamp(7px, 3vw, 18px)", color: tv4TextColor }}>{s.price}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="text-center mt-2 text-xs text-slate-500" data-testid="text-tv4-size-label">Preview: {tv4Size.label} TV — {tv4Orientation === "portrait" ? "Portrait 9:16" : "Landscape 16:9"}</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : activeTv === 5 ? (
              <div className="grid grid-cols-1 xl:grid-cols-[minmax(350px,1fr)_minmax(500px,2fr)] gap-8">
                <div className="space-y-5 max-h-[80vh] overflow-y-auto pr-2">
                  <h2 className="text-lg font-bold text-slate-200 border-b border-slate-700 pb-2" data-testid="text-tv5-editor-title">Layout Editor — TV 5 (Full Menu Board)</h2>
                  <MusicInput value={tv5Music} onChange={setTv5Music} tvNum={5} />
                  <div className="space-y-2">
                    <Label className="text-slate-300 text-xs font-semibold">Colors</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <div><label className="text-[10px] text-slate-400">Background</label><input type="color" value={tv5BgColor} onChange={e => setTv5BgColor(e.target.value)} className="w-full h-8 rounded cursor-pointer" data-testid="input-tv5-bg-color" /></div>
                      <div><label className="text-[10px] text-slate-400">Accent</label><input type="color" value={tv5AccentColor} onChange={e => setTv5AccentColor(e.target.value)} className="w-full h-8 rounded cursor-pointer" data-testid="input-tv5-accent-color" /></div>
                      <div><label className="text-[10px] text-slate-400">Text</label><input type="color" value={tv5TextColor} onChange={e => setTv5TextColor(e.target.value)} className="w-full h-8 rounded cursor-pointer" data-testid="input-tv5-text-color" /></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300 text-xs font-semibold">Logo</Label>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors">
                        <Upload className="h-3.5 w-3.5 text-slate-400" /><span className="text-xs text-slate-300">Upload Logo</span>
                        <input type="file" accept="image/*,video/*,.gif" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = ev => setTv5Logo(ev.target?.result as string); r.readAsDataURL(f); }}} data-testid="input-tv5-logo" />
                      </label>
                      {tv5Logo && <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-blue-500"><img src={tv5Logo} className="w-full h-full object-cover" /><button onClick={() => setTv5Logo(null)} className="absolute -top-1 -right-1 bg-red-600 rounded-full p-0.5"><X className="h-2 w-2 text-white" /></button></div>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300 text-xs font-semibold">Background Media</Label>
                    <div className="flex gap-2 mb-2">
                      {(["image", "video", "gif"] as const).map(t => (
                        <button key={t} onClick={() => { setTv5BgMediaType(t); setTv5BgMedia(null); }} className={`px-3 py-1 text-[10px] rounded ${tv5BgMediaType === t ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400"}`} data-testid={`btn-tv5-bg-${t}`}>{t.toUpperCase()}</button>
                      ))}
                    </div>
                    <label className="flex items-center gap-2 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors">
                      <Upload className="h-3.5 w-3.5 text-slate-400" /><span className="text-xs text-slate-300">Upload {tv5BgMediaType === "gif" ? "GIF" : tv5BgMediaType === "video" ? "Video" : "Image"}</span>
                      <input type="file" accept={tv5BgMediaType === "video" ? "video/*" : "image/*"} className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = ev => setTv5BgMedia(ev.target?.result as string); r.readAsDataURL(f); }}} data-testid="input-tv5-bg-media" />
                    </label>
                    {tv5BgMedia && <div className="relative w-20 h-12 rounded overflow-hidden border border-blue-500/50">{tv5BgMediaType === "video" ? <video src={tv5BgMedia} className="w-full h-full object-cover" muted autoPlay loop /> : <img src={tv5BgMedia} className="w-full h-full object-cover" />}<button onClick={() => setTv5BgMedia(null)} className="absolute top-0 right-0 bg-black/60 p-0.5"><X className="h-2 w-2 text-white" /></button></div>}
                  </div>
                  <div className="space-y-2 border-t border-slate-700 pt-3">
                    <Label className="text-slate-300 text-xs font-semibold">Section 1: {tv5Section1Title}</Label>
                    <Input value={tv5Section1Title} onChange={e => setTv5Section1Title(e.target.value)} className="bg-slate-800 border-slate-700 text-white text-xs" placeholder="Section title" data-testid="input-tv5-s1-title" />
                    <Input value={tv5Section1Subtitle} onChange={e => setTv5Section1Subtitle(e.target.value)} className="bg-slate-800 border-slate-700 text-white text-xs" placeholder="Subtitle" data-testid="input-tv5-s1-subtitle" />
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {tv5Section1Items.map((item, i) => (
                        <div key={item.id} className="bg-slate-800/50 p-2 rounded border border-slate-700 space-y-1">
                          <div className="flex gap-1">
                            <Input value={item.label} onChange={e => setTv5Section1Items(prev => prev.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} className="bg-slate-900 border-slate-600 text-white text-[10px] h-6 flex-1" placeholder="Label" data-testid={`input-tv5-s1-label-${i}`} />
                            <Input value={item.name} onChange={e => setTv5Section1Items(prev => prev.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} className="bg-slate-900 border-slate-600 text-white text-[10px] h-6 flex-[2]" placeholder="Name" data-testid={`input-tv5-s1-name-${i}`} />
                            <Input value={item.price} onChange={e => setTv5Section1Items(prev => prev.map((x, j) => j === i ? { ...x, price: e.target.value } : x))} className="bg-slate-900 border-slate-600 text-white text-[10px] h-6 w-16" placeholder="Price" data-testid={`input-tv5-s1-price-${i}`} />
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="flex items-center gap-1 px-2 py-1 bg-slate-900 border border-slate-600 rounded cursor-pointer text-[10px] text-slate-400 hover:bg-slate-700">
                              <ImageIcon className="h-2.5 w-2.5" />Img
                              <input type="file" accept="image/*,video/*,.gif" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = ev => setTv5Section1Items(prev => prev.map((x, j) => j === i ? { ...x, image: ev.target?.result as string } : x)); r.readAsDataURL(f); }}} data-testid={`input-tv5-s1-img-${i}`} />
                            </label>
                            {item.image && <div className="relative w-6 h-6 rounded overflow-hidden border border-blue-500/50"><img src={item.image} className="w-full h-full object-cover" /><button onClick={() => setTv5Section1Items(prev => prev.map((x, j) => j === i ? { ...x, image: null } : x))} className="absolute top-0 right-0 bg-black/60 p-0.5"><X className="h-1.5 w-1.5 text-white" /></button></div>}
                            <select value={item.animation} onChange={e => setTv5Section1Items(prev => prev.map((x, j) => j === i ? { ...x, animation: e.target.value } : x))} className="bg-slate-900 border border-slate-600 text-white text-[10px] rounded px-1 py-0.5 h-5 flex-1" data-testid={`select-tv5-s1-anim-${i}`}>
                              {[{value:"none",label:"None"},{value:"rotate",label:"Rotate"},{value:"rotateSlow",label:"Rotate Slow"},{value:"rotateFast",label:"Rotate Fast"},{value:"pulse",label:"Pulse"},{value:"bounce",label:"Bounce"},{value:"glow",label:"Glow"},{value:"shake",label:"Shake"},{value:"float",label:"Float"},{value:"swing",label:"Swing"},{value:"flash",label:"Flash"},{value:"zoomPulse",label:"Zoom Pulse"},{value:"slideIn",label:"Slide In"}].map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2 border-t border-slate-700 pt-3">
                    <Label className="text-slate-300 text-xs font-semibold">Section 2: {tv5Section2Title}</Label>
                    <Input value={tv5Section2Title} onChange={e => setTv5Section2Title(e.target.value)} className="bg-slate-800 border-slate-700 text-white text-xs" placeholder="Section title" data-testid="input-tv5-s2-title" />
                    <Input value={tv5Section2Subtitle} onChange={e => setTv5Section2Subtitle(e.target.value)} className="bg-slate-800 border-slate-700 text-white text-xs" placeholder="Subtitle" data-testid="input-tv5-s2-subtitle" />
                    {[{ data: tv5DualLeft, setter: setTv5DualLeft, key: "left" }, { data: tv5DualRight, setter: setTv5DualRight, key: "right" }].map(({ data, setter, key }) => (
                      <div key={key} className="bg-slate-800/50 p-2 rounded border border-slate-700 space-y-1">
                        <Input value={data.title} onChange={e => setter(prev => ({ ...prev, title: e.target.value }))} className="bg-slate-900 border-slate-600 text-white text-[10px] h-6" placeholder={`${key} title`} data-testid={`input-tv5-dual-${key}-title`} />
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-1 px-2 py-1 bg-slate-900 border border-slate-600 rounded cursor-pointer text-[10px] text-slate-400 hover:bg-slate-700">
                            <ImageIcon className="h-2.5 w-2.5" />Img
                            <input type="file" accept="image/*,video/*,.gif" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = ev => setter(prev => ({ ...prev, image: ev.target?.result as string })); r.readAsDataURL(f); }}} data-testid={`input-tv5-dual-${key}-img`} />
                          </label>
                          {data.image && <div className="relative w-6 h-6 rounded overflow-hidden border border-blue-500/50"><img src={data.image} className="w-full h-full object-cover" /><button onClick={() => setter(prev => ({ ...prev, image: null }))} className="absolute top-0 right-0 bg-black/60 p-0.5"><X className="h-1.5 w-1.5 text-white" /></button></div>}
                          <select value={data.animation} onChange={e => setter(prev => ({ ...prev, animation: e.target.value }))} className="bg-slate-900 border border-slate-600 text-white text-[10px] rounded px-1 py-0.5 h-5 flex-1" data-testid={`select-tv5-dual-${key}-anim`}>
                            {[{value:"none",label:"None"},{value:"rotate",label:"Rotate"},{value:"rotateSlow",label:"Rotate Slow"},{value:"rotateFast",label:"Rotate Fast"},{value:"pulse",label:"Pulse"},{value:"bounce",label:"Bounce"},{value:"glow",label:"Glow"},{value:"shake",label:"Shake"},{value:"float",label:"Float"},{value:"swing",label:"Swing"},{value:"flash",label:"Flash"},{value:"zoomPulse",label:"Zoom Pulse"},{value:"slideIn",label:"Slide In"}].map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                        </div>
                        {data.items.map((item, i) => (
                          <div key={item.id} className="flex gap-1">
                            <Input value={item.name} onChange={e => setter(prev => ({ ...prev, items: prev.items.map((x, j) => j === i ? { ...x, name: e.target.value } : x) }))} className="bg-slate-900 border-slate-600 text-white text-[10px] h-5 flex-1" data-testid={`input-tv5-dual-${key}-name-${i}`} />
                            <Input value={item.price} onChange={e => setter(prev => ({ ...prev, items: prev.items.map((x, j) => j === i ? { ...x, price: e.target.value } : x) }))} className="bg-slate-900 border-slate-600 text-white text-[10px] h-5 w-16" data-testid={`input-tv5-dual-${key}-price-${i}`} />
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2 border-t border-slate-700 pt-3">
                    <Label className="text-slate-300 text-xs font-semibold">Sidebar: {tv5SideTitle}</Label>
                    <Input value={tv5SideTitle} onChange={e => setTv5SideTitle(e.target.value)} className="bg-slate-800 border-slate-700 text-white text-xs" placeholder="Sidebar title" data-testid="input-tv5-side-title" />
                    {tv5SideItems.map((item, i) => (
                      <div key={item.id} className="bg-slate-800/50 p-2 rounded border border-slate-700 space-y-1">
                        <div className="flex gap-1">
                          <Input value={item.name} onChange={e => setTv5SideItems(prev => prev.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} className="bg-slate-900 border-slate-600 text-white text-[10px] h-6 flex-1" data-testid={`input-tv5-side-name-${i}`} />
                          <Input value={item.price} onChange={e => setTv5SideItems(prev => prev.map((x, j) => j === i ? { ...x, price: e.target.value } : x))} className="bg-slate-900 border-slate-600 text-white text-[10px] h-6 w-16" data-testid={`input-tv5-side-price-${i}`} />
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-1 px-2 py-1 bg-slate-900 border border-slate-600 rounded cursor-pointer text-[10px] text-slate-400 hover:bg-slate-700">
                            <ImageIcon className="h-2.5 w-2.5" />Img
                            <input type="file" accept="image/*,video/*,.gif" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = ev => setTv5SideItems(prev => prev.map((x, j) => j === i ? { ...x, image: ev.target?.result as string } : x)); r.readAsDataURL(f); }}} data-testid={`input-tv5-side-img-${i}`} />
                          </label>
                          {item.image && <div className="relative w-6 h-6 rounded overflow-hidden border border-blue-500/50"><img src={item.image} className="w-full h-full object-cover" /><button onClick={() => setTv5SideItems(prev => prev.map((x, j) => j === i ? { ...x, image: null } : x))} className="absolute top-0 right-0 bg-black/60 p-0.5"><X className="h-1.5 w-1.5 text-white" /></button></div>}
                          <select value={item.animation} onChange={e => setTv5SideItems(prev => prev.map((x, j) => j === i ? { ...x, animation: e.target.value } : x))} className="bg-slate-900 border border-slate-600 text-white text-[10px] rounded px-1 py-0.5 h-5 flex-1" data-testid={`select-tv5-side-anim-${i}`}>
                            {[{value:"none",label:"None"},{value:"rotate",label:"Rotate"},{value:"rotateSlow",label:"Rotate Slow"},{value:"rotateFast",label:"Rotate Fast"},{value:"pulse",label:"Pulse"},{value:"bounce",label:"Bounce"},{value:"glow",label:"Glow"},{value:"shake",label:"Shake"},{value:"float",label:"Float"},{value:"swing",label:"Swing"},{value:"flash",label:"Flash"},{value:"zoomPulse",label:"Zoom Pulse"},{value:"slideIn",label:"Slide In"}].map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                        </div>
                      </div>
                    ))}
                    {tv5SideItems.length < 6 && <button onClick={() => setTv5SideItems(prev => [...prev, { id: Date.now(), name: "New Item", price: "£0.00", image: null, animation: "none" }])} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1" data-testid="btn-tv5-add-side"><Plus className="h-3 w-3" />Add Item</button>}
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <div className="flex bg-slate-800 rounded-lg overflow-hidden border border-slate-700">
                      <button onClick={() => setTv5Orientation("landscape")} className={`px-3 py-1.5 text-xs font-medium ${tv5Orientation === "landscape" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400"}`} data-testid="btn-tv5-landscape">Landscape</button>
                      <button onClick={() => setTv5Orientation("portrait")} className={`px-3 py-1.5 text-xs font-medium ${tv5Orientation === "portrait" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400"}`} data-testid="btn-tv5-portrait">Portrait</button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4 text-slate-400" />
                      <div className="flex gap-1">
                        {TV_SIZES.map((s, i) => (
                          <button key={s.label} onClick={() => setTv5SizeIndex(i)} className={`px-2 py-1 text-[10px] rounded ${i === tv5SizeIndex ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`} data-testid={`btn-tv5-size-${i}`}>{s.label}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <div style={{ width: tv5Orientation === "portrait" ? tv5Size.width * 0.56 : tv5Size.width, maxWidth: "100%", transition: "width 0.3s ease" }}>
                      <div className="relative overflow-hidden rounded-xl shadow-2xl border-4 border-slate-800" style={{ aspectRatio: tv5Orientation === "portrait" ? "9/16" : "16/9", background: tv5BgColor }} data-testid="tv5-preview">
                        {tv5BgMedia && <div className="absolute inset-0 z-0">{tv5BgMediaType === "video" ? <video src={tv5BgMedia} className="w-full h-full object-cover opacity-20" muted autoPlay loop /> : <img src={tv5BgMedia} alt="" className="w-full h-full object-cover opacity-20" />}</div>}
                        {tv5Logo && <div className="absolute z-30" style={{ top: "2%", right: "2%" }}><div className="rounded-full overflow-hidden border-2" style={{ borderColor: tv5AccentColor, width: "clamp(16px, 3vw, 32px)", height: "clamp(16px, 3vw, 32px)" }}><img src={tv5Logo} alt="Logo" className="w-full h-full object-cover" /></div></div>}
                        {tv5Orientation === "landscape" ? (
                          <div className="absolute inset-0 flex z-10">
                            <div className="flex-[3] flex flex-col p-[2%]" style={{ overflow: "hidden" }}>
                              <div style={{ marginBottom: "0.5%" }}>
                                <div className="flex items-baseline gap-[2%]">
                                  <span className="font-black uppercase" style={{ fontSize: "clamp(8px, 2.5vw, 22px)", color: tv5AccentColor, fontFamily: "'Arial Black', sans-serif" }}>{tv5Section1Title}</span>
                                  <span style={{ fontSize: "clamp(4px, 1vw, 9px)", color: tv5TextColor }}>{tv5Section1Subtitle}</span>
                                </div>
                              </div>
                              <div className="grid grid-cols-4 gap-[1%]" style={{ flex: "5 1 0%", minHeight: 0, marginBottom: "0.5%" }}>
                                {tv5Section1Items.map((item) => (
                                  <div key={item.id} className="rounded-lg overflow-hidden flex flex-col" style={{ background: `${tv5TextColor}10`, border: `1px solid ${tv5TextColor}20`, minHeight: 0 }}>
                                    {item.image ? <div className="flex-1 min-h-0 overflow-hidden" style={tv5AnimStyle(item.animation)}><img src={item.image} alt="" className="w-full h-full object-cover" /></div> : <div className="flex-1 min-h-0 flex items-center justify-center" style={{ background: `${tv5AccentColor}15` }}><ImageIcon className="h-3 w-3 opacity-30" style={{ color: tv5AccentColor }} /></div>}
                                    <div style={{ padding: "4% 6% 5%" }}>
                                      <div className="italic" style={{ fontSize: "clamp(2px, 0.6vw, 5px)", color: tv5AccentColor }}>{item.label}</div>
                                      <div className="font-bold leading-tight" style={{ fontSize: "clamp(3px, 0.8vw, 7px)", color: tv5TextColor }}>{item.name}</div>
                                      <div className="font-black" style={{ fontSize: "clamp(3px, 0.9vw, 8px)", color: tv5AccentColor, marginTop: "1%" }}>{item.price}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <div style={{ marginBottom: "0.5%" }}>
                                <div className="flex items-baseline gap-[2%]">
                                  <span className="font-black uppercase" style={{ fontSize: "clamp(7px, 2.2vw, 18px)", color: tv5AccentColor, fontFamily: "'Arial Black', sans-serif" }}>{tv5Section2Title}</span>
                                  <span style={{ fontSize: "clamp(3px, 0.8vw, 7px)", color: tv5TextColor }}>{tv5Section2Subtitle}</span>
                                </div>
                              </div>
                              <div className="flex gap-[2%]" style={{ flex: "3 1 0%", minHeight: 0 }}>
                                {[tv5DualLeft, tv5DualRight].map((dual, di) => (
                                  <div key={di} className="flex-1 flex gap-[3%] items-center" style={{ minHeight: 0 }}>
                                    {dual.image && <div className="rounded-lg overflow-hidden" style={{ ...tv5AnimStyle(dual.animation), width: "35%", height: "100%", maxHeight: "100%" }}><img src={dual.image} alt="" className="w-full h-full object-cover" /></div>}
                                    <div className="flex-1">
                                      <div className="font-black uppercase" style={{ fontSize: "clamp(4px, 1.1vw, 10px)", color: tv5TextColor, marginBottom: "3%" }}>{dual.title}</div>
                                      {dual.items.map((item) => (
                                        <div key={item.id} className="flex justify-between" style={{ marginBottom: "1px" }}>
                                          <span className="font-bold" style={{ fontSize: "clamp(3px, 0.8vw, 7px)", color: tv5TextColor }}>{item.name}</span>
                                          <span className="font-black" style={{ fontSize: "clamp(3px, 0.9vw, 7px)", color: tv5AccentColor }}>{item.price}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="flex flex-col p-[1.5%]" style={{ flex: "0 0 25%", background: "linear-gradient(180deg, #2d5a27 0%, #1a3518 100%)", overflow: "hidden" }}>
                              <div className="font-black uppercase" style={{ fontSize: "clamp(7px, 2vw, 16px)", color: tv5AccentColor, fontFamily: "'Arial Black', sans-serif", marginBottom: "2%" }}>{tv5SideTitle}</div>
                              <div className="flex-1 flex flex-col gap-[2%]" style={{ minHeight: 0 }}>
                                {tv5SideItems.map((item) => (
                                  <div key={item.id} className="rounded-lg overflow-hidden flex flex-col" style={{ background: `${tv5AccentColor}20`, flex: "1 1 0%", minHeight: 0 }}>
                                    {item.image ? <div style={{ ...tv5AnimStyle(item.animation), flex: "1 1 0%", minHeight: 0, overflow: "hidden" }}><img src={item.image} alt="" className="w-full h-full object-cover" /></div> : <div className="flex items-center justify-center" style={{ flex: "1 1 0%", minHeight: 0 }}><ImageIcon className="h-3 w-3 opacity-30" style={{ color: tv5AccentColor }} /></div>}
                                    <div style={{ padding: "4% 5% 5%" }}>
                                      <div className="font-bold" style={{ fontSize: "clamp(3px, 0.9vw, 8px)", color: tv5TextColor }}>{item.name}</div>
                                      <div className="font-black" style={{ fontSize: "clamp(4px, 1.2vw, 10px)", color: tv5AccentColor }}>{item.price}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="absolute inset-0 flex flex-col z-10" style={{ overflow: "hidden" }}>
                            <div className="flex-1 flex flex-col p-[2%]" style={{ minHeight: 0 }}>
                              <div style={{ marginBottom: "0.3%" }}>
                                <div className="flex items-baseline gap-[2%]">
                                  <span className="font-black uppercase" style={{ fontSize: "clamp(7px, 3vw, 16px)", color: tv5AccentColor, fontFamily: "'Arial Black', sans-serif" }}>{tv5Section1Title}</span>
                                  <span style={{ fontSize: "clamp(3px, 1vw, 7px)", color: tv5TextColor }}>{tv5Section1Subtitle}</span>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-[1.5%]" style={{ flex: "5 1 0%", minHeight: 0, marginBottom: "0.5%" }}>
                                {tv5Section1Items.map((item) => (
                                  <div key={item.id} className="rounded-lg overflow-hidden flex flex-col" style={{ background: `${tv5TextColor}10`, border: `1px solid ${tv5TextColor}20`, minHeight: 0 }}>
                                    {item.image ? <div style={{ ...tv5AnimStyle(item.animation), flex: "1 1 0%", minHeight: 0, overflow: "hidden" }}><img src={item.image} alt="" className="w-full h-full object-cover" /></div> : <div className="flex items-center justify-center" style={{ flex: "1 1 0%", minHeight: 0, background: `${tv5AccentColor}15` }}><ImageIcon className="h-3 w-3 opacity-30" style={{ color: tv5AccentColor }} /></div>}
                                    <div style={{ padding: "3% 5% 4%" }}>
                                      <div className="italic" style={{ fontSize: "clamp(2px, 0.8vw, 5px)", color: tv5AccentColor }}>{item.label}</div>
                                      <div className="font-bold leading-tight" style={{ fontSize: "clamp(3px, 1.1vw, 7px)", color: tv5TextColor }}>{item.name}</div>
                                      <div className="font-black" style={{ fontSize: "clamp(3px, 1.2vw, 8px)", color: tv5AccentColor, marginTop: "1%" }}>{item.price}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <div style={{ marginBottom: "0.3%" }}>
                                <div className="flex items-baseline gap-[2%]">
                                  <span className="font-black uppercase" style={{ fontSize: "clamp(6px, 2.5vw, 14px)", color: tv5AccentColor, fontFamily: "'Arial Black', sans-serif" }}>{tv5Section2Title}</span>
                                  <span style={{ fontSize: "clamp(3px, 0.9vw, 6px)", color: tv5TextColor }}>{tv5Section2Subtitle}</span>
                                </div>
                              </div>
                              <div className="flex gap-[3%]" style={{ flex: "2 1 0%", minHeight: 0, marginBottom: "0.5%" }}>
                                {[tv5DualLeft, tv5DualRight].map((dual, di) => (
                                  <div key={di} className="flex-1 flex gap-[3%] items-center" style={{ minHeight: 0 }}>
                                    {dual.image && <div className="rounded-lg overflow-hidden" style={{ ...tv5AnimStyle(dual.animation), width: "35%", height: "100%" }}><img src={dual.image} alt="" className="w-full h-full object-cover" /></div>}
                                    <div className="flex-1">
                                      <div className="font-black uppercase" style={{ fontSize: "clamp(3px, 1.4vw, 9px)", color: tv5TextColor, marginBottom: "2%" }}>{dual.title}</div>
                                      {dual.items.map((item) => (
                                        <div key={item.id} className="flex justify-between" style={{ marginBottom: "1px" }}>
                                          <span className="font-bold" style={{ fontSize: "clamp(3px, 1.1vw, 7px)", color: tv5TextColor }}>{item.name}</span>
                                          <span className="font-black" style={{ fontSize: "clamp(3px, 1.2vw, 7px)", color: tv5AccentColor }}>{item.price}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <div className="rounded-lg" style={{ flex: "2 1 0%", minHeight: 0, background: "linear-gradient(180deg, #2d5a27 0%, #1a3518 100%)", padding: "1.5%", display: "flex", flexDirection: "column" }}>
                                <div className="font-black uppercase" style={{ fontSize: "clamp(5px, 2vw, 12px)", color: tv5AccentColor, fontFamily: "'Arial Black', sans-serif", marginBottom: "1%" }}>{tv5SideTitle}</div>
                                <div className="flex gap-[2%]" style={{ flex: "1 1 0%", minHeight: 0 }}>
                                  {tv5SideItems.map((item) => (
                                    <div key={item.id} className="flex-1 rounded-lg overflow-hidden flex flex-col" style={{ background: `${tv5AccentColor}20`, minHeight: 0 }}>
                                      {item.image ? <div style={{ ...tv5AnimStyle(item.animation), flex: "1 1 0%", minHeight: 0, overflow: "hidden" }}><img src={item.image} alt="" className="w-full h-full object-cover" /></div> : <div className="flex items-center justify-center" style={{ flex: "1 1 0%", minHeight: 0 }}><ImageIcon className="h-3 w-3 opacity-30" style={{ color: tv5AccentColor }} /></div>}
                                      <div style={{ padding: "4% 5%" }}>
                                        <div className="font-bold" style={{ fontSize: "clamp(3px, 1vw, 6px)", color: tv5TextColor }}>{item.name}</div>
                                        <div className="font-black" style={{ fontSize: "clamp(3px, 1.3vw, 8px)", color: tv5AccentColor }}>{item.price}</div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="text-center mt-2 text-xs text-slate-500" data-testid="text-tv5-size-label">Preview: {tv5Size.label} TV — {tv5Orientation === "portrait" ? "Portrait 9:16" : "Landscape 16:9"}</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : activeTv === 6 ? (
              <div className="grid grid-cols-1 xl:grid-cols-[minmax(350px,1fr)_minmax(500px,2fr)] gap-8">
                <div className="space-y-5 max-h-[80vh] overflow-y-auto pr-2">
                  <h2 className="text-lg font-bold text-slate-200 border-b border-slate-700 pb-2" data-testid="text-tv6-editor-title">Layout Editor — TV 6 (Promo Display)</h2>
                  <MusicInput value={tv6Music} onChange={setTv6Music} tvNum={6} />
                  <div className="space-y-2">
                    <Label className="text-slate-300 text-xs font-semibold">Colors</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div><label className="text-[10px] text-slate-400">Top Half</label><input type="color" value={tv6TopColor} onChange={e => setTv6TopColor(e.target.value)} className="w-full h-8 rounded cursor-pointer" data-testid="input-tv6-top-color" /></div>
                      <div><label className="text-[10px] text-slate-400">Bottom Half</label><input type="color" value={tv6BottomColor} onChange={e => setTv6BottomColor(e.target.value)} className="w-full h-8 rounded cursor-pointer" data-testid="input-tv6-bottom-color" /></div>
                      <div><label className="text-[10px] text-slate-400">Text</label><input type="color" value={tv6TextColor} onChange={e => setTv6TextColor(e.target.value)} className="w-full h-8 rounded cursor-pointer" data-testid="input-tv6-text-color" /></div>
                      <div><label className="text-[10px] text-slate-400">Accent</label><input type="color" value={tv6AccentColor} onChange={e => setTv6AccentColor(e.target.value)} className="w-full h-8 rounded cursor-pointer" data-testid="input-tv6-accent-color" /></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300 text-xs font-semibold">Logo</Label>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors">
                        <Upload className="h-3.5 w-3.5 text-slate-400" /><span className="text-xs text-slate-300">Upload Logo</span>
                        <input type="file" accept="image/*,video/*,.gif" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = ev => setTv6Logo(ev.target?.result as string); r.readAsDataURL(f); }}} data-testid="input-tv6-logo" />
                      </label>
                      {tv6Logo && <div className="relative w-10 h-10 rounded overflow-hidden border-2 border-blue-500"><img src={tv6Logo} className="w-full h-full object-cover" /><button onClick={() => setTv6Logo(null)} className="absolute -top-1 -right-1 bg-red-600 rounded-full p-0.5"><X className="h-2 w-2 text-white" /></button></div>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300 text-xs font-semibold">Background Media</Label>
                    <div className="flex gap-2 mb-2">
                      {(["image", "video", "gif"] as const).map(t => (
                        <button key={t} onClick={() => { setTv6BgMediaType(t); setTv6BgMedia(null); }} className={`px-3 py-1 text-[10px] rounded ${tv6BgMediaType === t ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400"}`} data-testid={`btn-tv6-bg-${t}`}>{t.toUpperCase()}</button>
                      ))}
                    </div>
                    <label className="flex items-center gap-2 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors">
                      <Upload className="h-3.5 w-3.5 text-slate-400" /><span className="text-xs text-slate-300">Upload {tv6BgMediaType === "gif" ? "GIF" : tv6BgMediaType === "video" ? "Video" : "Image"}</span>
                      <input type="file" accept={tv6BgMediaType === "video" ? "video/*" : "image/*"} className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = ev => setTv6BgMedia(ev.target?.result as string); r.readAsDataURL(f); }}} data-testid="input-tv6-bg-media" />
                    </label>
                    {tv6BgMedia && <div className="relative w-20 h-12 rounded overflow-hidden border border-blue-500/50">{tv6BgMediaType === "video" ? <video src={tv6BgMedia} className="w-full h-full object-cover" muted autoPlay loop /> : <img src={tv6BgMedia} className="w-full h-full object-cover" />}<button onClick={() => setTv6BgMedia(null)} className="absolute top-0 right-0 bg-black/60 p-0.5"><X className="h-2 w-2 text-white" /></button></div>}
                  </div>
                  <div className="space-y-3 border-t border-slate-700 pt-3">
                    <Label className="text-slate-300 text-xs font-semibold">Promo Items</Label>
                    {tv6PromoItems.map((item, i) => (
                      <div key={item.id} className="bg-slate-800/50 p-3 rounded-lg border border-slate-700 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-500 font-bold w-4">{i === 1 ? "C" : i === 0 ? "L" : "R"}</span>
                          <Input value={item.title} onChange={e => setTv6PromoItems(prev => prev.map((x, j) => j === i ? { ...x, title: e.target.value } : x))} className="bg-slate-900 border-slate-600 text-white text-xs h-7 flex-1" placeholder="Title" data-testid={`input-tv6-promo-title-${i}`} />
                          <Input value={item.price} onChange={e => setTv6PromoItems(prev => prev.map((x, j) => j === i ? { ...x, price: e.target.value } : x))} className="bg-slate-900 border-slate-600 text-white text-xs h-7 w-20" placeholder="Price" data-testid={`input-tv6-promo-price-${i}`} />
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-1 px-2 py-1 bg-slate-900 border border-slate-600 rounded cursor-pointer text-[10px] text-slate-400 hover:bg-slate-700">
                            <ImageIcon className="h-2.5 w-2.5" />Image
                            <input type="file" accept="image/*,video/*,.gif" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = ev => setTv6PromoItems(prev => prev.map((x, j) => j === i ? { ...x, image: ev.target?.result as string } : x)); r.readAsDataURL(f); }}} data-testid={`input-tv6-promo-img-${i}`} />
                          </label>
                          {item.image && <div className="relative w-8 h-8 rounded overflow-hidden border border-blue-500/50"><img src={item.image} className="w-full h-full object-cover" /><button onClick={() => setTv6PromoItems(prev => prev.map((x, j) => j === i ? { ...x, image: null } : x))} className="absolute top-0 right-0 bg-black/60 p-0.5"><X className="h-1.5 w-1.5 text-white" /></button></div>}
                          <select value={item.animation} onChange={e => setTv6PromoItems(prev => prev.map((x, j) => j === i ? { ...x, animation: e.target.value } : x))} className="bg-slate-900 border border-slate-600 text-white text-[10px] rounded px-1 py-1 flex-1" data-testid={`select-tv6-promo-anim-${i}`}>
                            {[{value:"none",label:"None"},{value:"rotate",label:"Rotate"},{value:"rotateSlow",label:"Rotate Slow"},{value:"rotateFast",label:"Rotate Fast"},{value:"pulse",label:"Pulse"},{value:"bounce",label:"Bounce"},{value:"glow",label:"Glow"},{value:"shake",label:"Shake"},{value:"float",label:"Float"},{value:"swing",label:"Swing"},{value:"flash",label:"Flash"},{value:"zoomPulse",label:"Zoom Pulse"},{value:"slideIn",label:"Slide In"}].map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                        </div>
                      </div>
                    ))}
                    {tv6PromoItems.length < 5 && <button onClick={() => setTv6PromoItems(prev => [...prev, { id: Date.now(), title: `PROMO #${prev.length + 1}`, price: "$5.99", image: null, animation: "none" }])} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1" data-testid="btn-tv6-add-promo"><Plus className="h-3 w-3" />Add Promo</button>}
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <div className="flex bg-slate-800 rounded-lg overflow-hidden border border-slate-700">
                      <button onClick={() => setTv6Orientation("landscape")} className={`px-3 py-1.5 text-xs font-medium ${tv6Orientation === "landscape" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400"}`} data-testid="btn-tv6-landscape">Landscape</button>
                      <button onClick={() => setTv6Orientation("portrait")} className={`px-3 py-1.5 text-xs font-medium ${tv6Orientation === "portrait" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400"}`} data-testid="btn-tv6-portrait">Portrait</button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4 text-slate-400" />
                      <div className="flex gap-1">
                        {TV_SIZES.map((s, i) => (
                          <button key={s.label} onClick={() => setTv6SizeIndex(i)} className={`px-2 py-1 text-[10px] rounded ${i === tv6SizeIndex ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`} data-testid={`btn-tv6-size-${i}`}>{s.label}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <div style={{ width: tv6Orientation === "portrait" ? tv6Size.width * 0.56 : tv6Size.width, maxWidth: "100%", transition: "width 0.3s ease" }}>
                      <div className="relative overflow-hidden rounded-xl shadow-2xl border-4 border-slate-800" style={{ aspectRatio: tv6Orientation === "portrait" ? "9/16" : "16/9" }} data-testid="tv6-preview">
                        <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${tv6TopColor} 0%, ${tv6TopColor} 50%, ${tv6BottomColor} 50%, ${tv6BottomColor} 100%)` }} />
                        {tv6BgMedia && <div className="absolute inset-0 z-[1]">{tv6BgMediaType === "video" ? <video src={tv6BgMedia} className="w-full h-full object-cover opacity-30" muted autoPlay loop /> : <img src={tv6BgMedia} alt="" className="w-full h-full object-cover opacity-30" />}</div>}
                        {tv6Logo && <div className="absolute z-30" style={{ top: "4%", left: "50%", transform: "translateX(-50%)" }}><div className="overflow-hidden" style={{ width: "clamp(24px, 8vw, 60px)", height: "clamp(24px, 8vw, 60px)" }}><img src={tv6Logo} alt="Logo" className="w-full h-full object-contain" /></div></div>}
                        {tv6Orientation === "landscape" ? (
                          <div className="absolute inset-0 z-10 flex items-end justify-center" style={{ padding: "0 3% 3%" }}>
                            <div className="flex items-end justify-center gap-[4%] w-full" style={{ height: "85%" }}>
                              {tv6PromoItems.map((item, i) => {
                                const isCenter = i === 1;
                                return (
                                  <div key={item.id} className="flex flex-col items-center" style={{ flex: isCenter ? "1.3" : "1", height: "100%", justifyContent: "flex-end" }}>
                                    {item.image && (
                                      <div style={{ ...tv6AnimStyle(item.animation), width: isCenter ? "80%" : "70%", marginBottom: "-5%", zIndex: 2, position: "relative" }}>
                                        <img src={item.image} alt="" className="w-full h-auto object-contain drop-shadow-2xl" />
                                      </div>
                                    )}
                                    <div className="text-center w-full" style={{ paddingTop: isCenter ? "8%" : "6%", position: "relative", zIndex: 1 }}>
                                      <div className="font-black uppercase" style={{ fontSize: isCenter ? "clamp(8px, 2.5vw, 24px)" : "clamp(6px, 2vw, 18px)", color: tv6TextColor, textShadow: "1px 1px 3px rgba(0,0,0,0.5)" }}>{item.title}</div>
                                      <div className="italic font-bold" style={{ fontSize: isCenter ? "clamp(6px, 2vw, 20px)" : "clamp(5px, 1.5vw, 14px)", color: tv6TextColor, textShadow: "1px 1px 3px rgba(0,0,0,0.3)" }}>{item.price}</div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <div className="absolute inset-0 z-10 flex flex-col" style={{ padding: "3%" }}>
                            {tv6Logo && <div style={{ height: "8%" }} />}
                            <div className="flex-1 flex flex-col justify-center gap-[2%] w-full" style={{ minHeight: 0 }}>
                              {tv6PromoItems.map((item, i) => {
                                const isCenter = i === 1;
                                return (
                                  <div key={item.id} className="flex items-center" style={{ flex: isCenter ? "1.8" : "1", minHeight: 0, gap: "3%" }}>
                                    {item.image && (
                                      <div className="flex items-center justify-center" style={{ ...tv6AnimStyle(item.animation), width: isCenter ? "52%" : "35%", height: "100%", flexShrink: 0, overflow: "hidden" }}>
                                        <img src={item.image} alt="" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} className="drop-shadow-2xl" />
                                      </div>
                                    )}
                                    <div className="flex flex-col justify-center">
                                      <div className="font-black uppercase" style={{ fontSize: isCenter ? "clamp(7px, 3.5vw, 20px)" : "clamp(5px, 2.8vw, 15px)", color: tv6TextColor, textShadow: "1px 1px 3px rgba(0,0,0,0.5)", lineHeight: 1.2 }}>{item.title}</div>
                                      <div className="italic font-bold" style={{ fontSize: isCenter ? "clamp(5px, 3vw, 16px)" : "clamp(4px, 2.2vw, 12px)", color: tv6TextColor, textShadow: "1px 1px 3px rgba(0,0,0,0.3)", lineHeight: 1.2 }}>{item.price}</div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="text-center mt-2 text-xs text-slate-500" data-testid="text-tv6-size-label">Preview: {tv6Size.label} TV — {tv6Orientation === "portrait" ? "Portrait 9:16" : "Landscape 16:9"}</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : activeTv === 7 ? (
              <div className="grid grid-cols-1 xl:grid-cols-[minmax(350px,1fr)_minmax(500px,2fr)] gap-8">
                <div className="space-y-5 max-h-[80vh] overflow-y-auto pr-2">
                  <h2 className="text-lg font-bold text-slate-200 border-b border-slate-700 pb-2" data-testid="text-tv7-editor-title">Layout Editor — TV 7 (Menu & Boxes)</h2>
                  <MusicInput value={tv7Music} onChange={setTv7Music} tvNum={7} />
                  <div className="space-y-2">
                    <Label className="text-slate-300 text-xs font-semibold">Colors</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div><label className="text-[10px] text-slate-400">Menu Background</label><input type="color" value={tv7TopBgColor} onChange={e => setTv7TopBgColor(e.target.value)} className="w-full h-8 rounded cursor-pointer" data-testid="input-tv7-top-bg" /></div>
                      <div><label className="text-[10px] text-slate-400">Boxes Background</label><input type="color" value={tv7BottomBgColor} onChange={e => setTv7BottomBgColor(e.target.value)} className="w-full h-8 rounded cursor-pointer" data-testid="input-tv7-bottom-bg" /></div>
                      <div><label className="text-[10px] text-slate-400">Text</label><input type="color" value={tv7TextColor} onChange={e => setTv7TextColor(e.target.value)} className="w-full h-8 rounded cursor-pointer" data-testid="input-tv7-text-color" /></div>
                      <div><label className="text-[10px] text-slate-400">Price</label><input type="color" value={tv7PriceColor} onChange={e => setTv7PriceColor(e.target.value)} className="w-full h-8 rounded cursor-pointer" data-testid="input-tv7-price-color" /></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300 text-xs font-semibold">Logo</Label>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors">
                        <Upload className="h-3.5 w-3.5 text-slate-400" /><span className="text-xs text-slate-300">Upload Logo</span>
                        <input type="file" accept="image/*,video/*,.gif" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = ev => setTv7Logo(ev.target?.result as string); r.readAsDataURL(f); }}} data-testid="input-tv7-logo" />
                      </label>
                      {tv7Logo && <div className="relative w-10 h-10 rounded overflow-hidden border-2 border-blue-500"><img src={tv7Logo} className="w-full h-full object-cover" /><button onClick={() => setTv7Logo(null)} className="absolute -top-1 -right-1 bg-red-600 rounded-full p-0.5"><X className="h-2 w-2 text-white" /></button></div>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300 text-xs font-semibold">Background Media</Label>
                    <div className="flex gap-2 mb-2">
                      {(["image", "video", "gif"] as const).map(t => (
                        <button key={t} onClick={() => { setTv7BgMediaType(t); setTv7BgMedia(null); }} className={`px-3 py-1 text-[10px] rounded ${tv7BgMediaType === t ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400"}`} data-testid={`btn-tv7-bg-${t}`}>{t.toUpperCase()}</button>
                      ))}
                    </div>
                    <label className="flex items-center gap-2 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors">
                      <Upload className="h-3.5 w-3.5 text-slate-400" /><span className="text-xs text-slate-300">Upload {tv7BgMediaType === "gif" ? "GIF" : tv7BgMediaType === "video" ? "Video" : "Image"}</span>
                      <input type="file" accept={tv7BgMediaType === "video" ? "video/*" : "image/*"} className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = ev => setTv7BgMedia(ev.target?.result as string); r.readAsDataURL(f); }}} data-testid="input-tv7-bg-media" />
                    </label>
                    {tv7BgMedia && <div className="relative w-20 h-12 rounded overflow-hidden border border-blue-500/50">{tv7BgMediaType === "video" ? <video src={tv7BgMedia} className="w-full h-full object-cover" muted autoPlay loop /> : <img src={tv7BgMedia} className="w-full h-full object-cover" />}<button onClick={() => setTv7BgMedia(null)} className="absolute top-0 right-0 bg-black/60 p-0.5"><X className="h-2 w-2 text-white" /></button></div>}
                  </div>
                  <div className="space-y-2 border-t border-slate-700 pt-3">
                    <Label className="text-slate-300 text-xs font-semibold">Menu Items (3-col grid)</Label>
                    <div className="space-y-2 max-h-52 overflow-y-auto">
                      {tv7MenuItems.map((item, i) => (
                        <div key={item.id} className="bg-slate-800/50 p-2 rounded border border-slate-700 space-y-1">
                          <div className="flex gap-1">
                            <Input value={item.name} onChange={e => setTv7MenuItems(prev => prev.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} className="bg-slate-900 border-slate-600 text-white text-[10px] h-6 flex-1" placeholder="Name" data-testid={`input-tv7-menu-name-${i}`} />
                            <Input value={item.price} onChange={e => setTv7MenuItems(prev => prev.map((x, j) => j === i ? { ...x, price: e.target.value } : x))} className="bg-slate-900 border-slate-600 text-white text-[10px] h-6 w-16" placeholder="Price" data-testid={`input-tv7-menu-price-${i}`} />
                            {tv7MenuItems.length > 3 && <button onClick={() => setTv7MenuItems(prev => prev.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-300 px-1"><X className="h-3 w-3" /></button>}
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="flex items-center gap-1 px-2 py-0.5 bg-slate-900 border border-slate-600 rounded cursor-pointer text-[10px] text-slate-400 hover:bg-slate-700">
                              <ImageIcon className="h-2.5 w-2.5" />Img
                              <input type="file" accept="image/*,video/*,.gif" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = ev => setTv7MenuItems(prev => prev.map((x, j) => j === i ? { ...x, image: ev.target?.result as string } : x)); r.readAsDataURL(f); }}} data-testid={`input-tv7-menu-img-${i}`} />
                            </label>
                            {item.image && <div className="relative w-5 h-5 rounded overflow-hidden border border-blue-500/50"><img src={item.image} className="w-full h-full object-cover" /><button onClick={() => setTv7MenuItems(prev => prev.map((x, j) => j === i ? { ...x, image: null } : x))} className="absolute top-0 right-0 bg-black/60 p-0.5"><X className="h-1.5 w-1.5 text-white" /></button></div>}
                            <select value={item.animation} onChange={e => setTv7MenuItems(prev => prev.map((x, j) => j === i ? { ...x, animation: e.target.value } : x))} className="bg-slate-900 border border-slate-600 text-white text-[10px] rounded px-1 py-0.5 flex-1" data-testid={`select-tv7-menu-anim-${i}`}>
                              {[{value:"none",label:"None"},{value:"rotate",label:"Rotate"},{value:"rotateSlow",label:"Rotate Slow"},{value:"rotateFast",label:"Rotate Fast"},{value:"pulse",label:"Pulse"},{value:"bounce",label:"Bounce"},{value:"glow",label:"Glow"},{value:"shake",label:"Shake"},{value:"float",label:"Float"},{value:"swing",label:"Swing"},{value:"flash",label:"Flash"},{value:"zoomPulse",label:"Zoom Pulse"},{value:"slideIn",label:"Slide In"}].map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                    {tv7MenuItems.length < 12 && <button onClick={() => setTv7MenuItems(prev => [...prev, { id: Date.now(), name: "NEW ITEM", price: "£0.00", image: null, animation: "none" }])} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1" data-testid="btn-tv7-add-menu"><Plus className="h-3 w-3" />Add Menu Item</button>}
                  </div>
                  <div className="space-y-2 border-t border-slate-700 pt-3">
                    <Label className="text-slate-300 text-xs font-semibold">Featured Boxes</Label>
                    {tv7BoxItems.map((item, i) => (
                      <div key={item.id} className="bg-slate-800/50 p-2 rounded border border-slate-700 space-y-1">
                        <div className="flex gap-1">
                          <Input value={item.name} onChange={e => setTv7BoxItems(prev => prev.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} className="bg-slate-900 border-slate-600 text-white text-[10px] h-6 flex-1" placeholder="Name" data-testid={`input-tv7-box-name-${i}`} />
                          <Input value={item.price} onChange={e => setTv7BoxItems(prev => prev.map((x, j) => j === i ? { ...x, price: e.target.value } : x))} className="bg-slate-900 border-slate-600 text-white text-[10px] h-6 w-16" placeholder="Price" data-testid={`input-tv7-box-price-${i}`} />
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-1 px-2 py-0.5 bg-slate-900 border border-slate-600 rounded cursor-pointer text-[10px] text-slate-400 hover:bg-slate-700">
                            <ImageIcon className="h-2.5 w-2.5" />Img
                            <input type="file" accept="image/*,video/*,.gif" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = ev => setTv7BoxItems(prev => prev.map((x, j) => j === i ? { ...x, image: ev.target?.result as string } : x)); r.readAsDataURL(f); }}} data-testid={`input-tv7-box-img-${i}`} />
                          </label>
                          {item.image && <div className="relative w-5 h-5 rounded overflow-hidden border border-blue-500/50"><img src={item.image} className="w-full h-full object-cover" /><button onClick={() => setTv7BoxItems(prev => prev.map((x, j) => j === i ? { ...x, image: null } : x))} className="absolute top-0 right-0 bg-black/60 p-0.5"><X className="h-1.5 w-1.5 text-white" /></button></div>}
                          <select value={item.animation} onChange={e => setTv7BoxItems(prev => prev.map((x, j) => j === i ? { ...x, animation: e.target.value } : x))} className="bg-slate-900 border border-slate-600 text-white text-[10px] rounded px-1 py-0.5 flex-1" data-testid={`select-tv7-box-anim-${i}`}>
                            {[{value:"none",label:"None"},{value:"rotate",label:"Rotate"},{value:"rotateSlow",label:"Rotate Slow"},{value:"rotateFast",label:"Rotate Fast"},{value:"pulse",label:"Pulse"},{value:"bounce",label:"Bounce"},{value:"glow",label:"Glow"},{value:"shake",label:"Shake"},{value:"float",label:"Float"},{value:"swing",label:"Swing"},{value:"flash",label:"Flash"},{value:"zoomPulse",label:"Zoom Pulse"},{value:"slideIn",label:"Slide In"}].map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                        </div>
                      </div>
                    ))}
                    {tv7BoxItems.length < 5 && <button onClick={() => setTv7BoxItems(prev => [...prev, { id: Date.now(), name: "NEW BOX", price: "£0.00", image: null, animation: "none" }])} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1" data-testid="btn-tv7-add-box"><Plus className="h-3 w-3" />Add Box</button>}
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <div className="flex bg-slate-800 rounded-lg overflow-hidden border border-slate-700">
                      <button onClick={() => setTv7Orientation("landscape")} className={`px-3 py-1.5 text-xs font-medium ${tv7Orientation === "landscape" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400"}`} data-testid="btn-tv7-landscape">Landscape</button>
                      <button onClick={() => setTv7Orientation("portrait")} className={`px-3 py-1.5 text-xs font-medium ${tv7Orientation === "portrait" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400"}`} data-testid="btn-tv7-portrait">Portrait</button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4 text-slate-400" />
                      <div className="flex gap-1">
                        {TV_SIZES.map((s, i) => (
                          <button key={s.label} onClick={() => setTv7SizeIndex(i)} className={`px-2 py-1 text-[10px] rounded ${i === tv7SizeIndex ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`} data-testid={`btn-tv7-size-${i}`}>{s.label}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <div style={{ width: tv7Orientation === "portrait" ? tv7Size.width * 0.56 : tv7Size.width, maxWidth: "100%", transition: "width 0.3s ease" }}>
                      <div className="relative overflow-hidden rounded-xl shadow-2xl border-4 border-slate-800" style={{ aspectRatio: tv7Orientation === "portrait" ? "9/16" : "16/9" }} data-testid="tv7-preview">
                        {tv7BgMedia && <div className="absolute inset-0 z-[1]">{tv7BgMediaType === "video" ? <video src={tv7BgMedia} className="w-full h-full object-cover opacity-20" muted autoPlay loop /> : <img src={tv7BgMedia} alt="" className="w-full h-full object-cover opacity-20" />}</div>}
                        {tv7Logo && <div className="absolute z-30" style={{ top: "2%", right: "2%" }}><div className="overflow-hidden" style={{ width: "clamp(16px, 3vw, 32px)", height: "clamp(16px, 3vw, 32px)" }}><img src={tv7Logo} alt="Logo" className="w-full h-full object-contain" /></div></div>}
                        {tv7Orientation === "landscape" ? (
                          <div className="absolute inset-0 flex flex-col z-10">
                            <div className="flex-[3] relative" style={{ background: tv7TopBgColor }}>
                              <div className="absolute inset-0 p-[2%] flex flex-col">
                                {(() => {
                                  const rows: Tv7MenuItem[][] = [];
                                  for (let r = 0; r < tv7MenuItems.length; r += 3) rows.push(tv7MenuItems.slice(r, r + 3));
                                  return rows.map((row, ri) => (
                                    <div key={ri} className="flex-1 flex items-center" style={{ borderBottom: ri < rows.length - 1 ? `1px solid ${tv7PriceColor}30` : "none" }}>
                                      {row.map((item) => (
                                        <div key={item.id} className="flex-1 flex items-center gap-[3%] px-[1%]">
                                          {item.image && <div style={{ ...tv7AnimStyle(item.animation), width: "clamp(16px, 4vw, 40px)", height: "clamp(16px, 4vw, 40px)", flexShrink: 0 }}><img src={item.image} alt="" className="w-full h-full object-contain" /></div>}
                                          <div className="flex items-center gap-[4%] flex-1 min-w-0">
                                            <span className="font-bold uppercase truncate" style={{ fontSize: "clamp(3px, 0.8vw, 7px)", color: tv7TextColor, flex: 1 }}>{item.name}</span>
                                            <span className="font-black" style={{ fontSize: "clamp(5px, 1.4vw, 14px)", color: tv7PriceColor, flexShrink: 0 }}>{item.price}</span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ));
                                })()}
                              </div>
                            </div>
                            <div className="flex-[1.2]" style={{ background: tv7BottomBgColor }}>
                              <div className="h-full flex items-center justify-center gap-[2%] px-[2%]">
                                {tv7BoxItems.map((item) => (
                                  <div key={item.id} className="flex-1 flex items-center gap-[4%] h-[85%]">
                                    {item.image && <div className="h-full aspect-square flex items-center justify-center" style={tv7AnimStyle(item.animation)}><img src={item.image} alt="" className="max-w-full max-h-full object-contain drop-shadow-lg" /></div>}
                                    <div>
                                      <div className="font-black uppercase leading-tight" style={{ fontSize: "clamp(5px, 1.5vw, 16px)", color: tv7TopBgColor }}>{item.name}</div>
                                      <div className="font-black" style={{ fontSize: "clamp(6px, 1.8vw, 18px)", color: tv7TopBgColor }}>{item.price}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="absolute inset-0 flex flex-col z-10">
                            <div className="flex-[3.5] relative" style={{ background: tv7TopBgColor }}>
                              <div className="absolute inset-0 p-[3%] flex flex-col">
                                {(() => {
                                  const rows: Tv7MenuItem[][] = [];
                                  for (let r = 0; r < tv7MenuItems.length; r += 3) rows.push(tv7MenuItems.slice(r, r + 3));
                                  return rows.map((row, ri) => (
                                    <div key={ri} className="flex-1 flex items-center" style={{ borderBottom: ri < rows.length - 1 ? `1px solid ${tv7PriceColor}30` : "none" }}>
                                      {row.map((item) => (
                                        <div key={item.id} className="flex-1 flex flex-col items-center justify-center gap-[2%] px-[1%]">
                                          {item.image && <div style={{ ...tv7AnimStyle(item.animation), width: "clamp(18px, 10vw, 52px)", height: "clamp(18px, 10vw, 52px)", flexShrink: 0 }}><img src={item.image} alt="" className="w-full h-full object-contain" /></div>}
                                          <div className="text-center min-w-0">
                                            <div className="font-bold uppercase" style={{ fontSize: "clamp(3px, 1.4vw, 7px)", color: tv7TextColor, lineHeight: 1.1 }}>{item.name}</div>
                                            <div className="font-black" style={{ fontSize: "clamp(4px, 1.8vw, 10px)", color: tv7PriceColor }}>{item.price}</div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ));
                                })()}
                              </div>
                            </div>
                            <div className="flex-[2.5]" style={{ background: tv7BottomBgColor }}>
                              <div className="h-full flex flex-col justify-center gap-[4%] px-[4%] py-[2%]">
                                {tv7BoxItems.map((item, idx) => {
                                  const imgLeft = idx % 2 === 0;
                                  const imgEl = item.image ? <div className="flex items-center justify-center" style={{ ...tv7AnimStyle(item.animation), width: "35%", flexShrink: 0 }}><img src={item.image} alt="" className="w-full h-auto object-contain drop-shadow-lg" /></div> : null;
                                  const textEl = <div className={imgLeft ? "text-left" : "text-right"} style={{ flex: 1 }}>
                                    <div className="font-black uppercase leading-tight" style={{ fontSize: "clamp(5px, 3vw, 16px)", color: tv7TopBgColor }}>{item.name}</div>
                                    <div className="font-black" style={{ fontSize: "clamp(6px, 3.5vw, 18px)", color: tv7TopBgColor }}>{item.price}</div>
                                  </div>;
                                  return (
                                    <div key={item.id} className="flex items-center gap-[3%]" style={{ flex: 1, minHeight: 0 }}>
                                      {imgLeft ? <>{imgEl}{textEl}</> : <>{textEl}{imgEl}</>}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="text-center mt-2 text-xs text-slate-500" data-testid="text-tv7-size-label">Preview: {tv7Size.label} TV — {tv7Orientation === "portrait" ? "Portrait 9:16" : "Landscape 16:9"}</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : activeTv === 8 ? (
              <div className="grid grid-cols-1 xl:grid-cols-[minmax(350px,1fr)_minmax(500px,2fr)] gap-8">
                <div className="space-y-5 max-h-[80vh] overflow-y-auto pr-2">
                  <h2 className="text-lg font-bold text-slate-200 border-b border-slate-700 pb-2" data-testid="text-tv8-editor-title">Layout Editor — TV 8 (Featured + Grid)</h2>
                  <MusicInput value={tv8Music} onChange={setTv8Music} tvNum={8} />
                  <div className="space-y-2">
                    <Label className="text-slate-300 text-xs font-semibold">Colors</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div><label className="text-[10px] text-slate-400">Background</label><input type="color" value={tv8BgColor} onChange={e => setTv8BgColor(e.target.value)} className="w-full h-8 rounded cursor-pointer" data-testid="input-tv8-bg" /></div>
                      <div><label className="text-[10px] text-slate-400">Grid Cells</label><input type="color" value={tv8GridBgColor} onChange={e => setTv8GridBgColor(e.target.value)} className="w-full h-8 rounded cursor-pointer" data-testid="input-tv8-grid-bg" /></div>
                      <div><label className="text-[10px] text-slate-400">Border</label><input type="color" value={tv8BorderColor} onChange={e => setTv8BorderColor(e.target.value)} className="w-full h-8 rounded cursor-pointer" data-testid="input-tv8-border" /></div>
                      <div><label className="text-[10px] text-slate-400">Text</label><input type="color" value={tv8TextColor} onChange={e => setTv8TextColor(e.target.value)} className="w-full h-8 rounded cursor-pointer" data-testid="input-tv8-text" /></div>
                      <div><label className="text-[10px] text-slate-400">Price</label><input type="color" value={tv8PriceColor} onChange={e => setTv8PriceColor(e.target.value)} className="w-full h-8 rounded cursor-pointer" data-testid="input-tv8-price" /></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300 text-xs font-semibold">Logo</Label>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors">
                        <Upload className="h-3.5 w-3.5 text-slate-400" /><span className="text-xs text-slate-300">Upload Logo</span>
                        <input type="file" accept="image/*,video/*,.gif" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = ev => setTv8Logo(ev.target?.result as string); r.readAsDataURL(f); }}} data-testid="input-tv8-logo" />
                      </label>
                      {tv8Logo && <div className="relative w-10 h-10 rounded overflow-hidden border-2 border-blue-500"><img src={tv8Logo} className="w-full h-full object-cover" /><button onClick={() => setTv8Logo(null)} className="absolute -top-1 -right-1 bg-red-600 rounded-full p-0.5"><X className="h-2 w-2 text-white" /></button></div>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300 text-xs font-semibold">Background Media</Label>
                    <div className="flex gap-2 mb-2">
                      {(["image", "video", "gif"] as const).map(t => (
                        <button key={t} onClick={() => { setTv8BgMediaType(t); setTv8BgMedia(null); }} className={`px-3 py-1 text-[10px] rounded ${tv8BgMediaType === t ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400"}`} data-testid={`btn-tv8-bg-${t}`}>{t.toUpperCase()}</button>
                      ))}
                    </div>
                    <label className="flex items-center gap-2 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors">
                      <Upload className="h-3.5 w-3.5 text-slate-400" /><span className="text-xs text-slate-300">Upload {tv8BgMediaType === "gif" ? "GIF" : tv8BgMediaType === "video" ? "Video" : "Image"}</span>
                      <input type="file" accept={tv8BgMediaType === "video" ? "video/*" : "image/*"} className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = ev => setTv8BgMedia(ev.target?.result as string); r.readAsDataURL(f); }}} data-testid="input-tv8-bg-media" />
                    </label>
                    {tv8BgMedia && <div className="relative w-20 h-12 rounded overflow-hidden border border-blue-500/50">{tv8BgMediaType === "video" ? <video src={tv8BgMedia} className="w-full h-full object-cover" muted autoPlay loop /> : <img src={tv8BgMedia} className="w-full h-full object-cover" />}<button onClick={() => setTv8BgMedia(null)} className="absolute top-0 right-0 bg-black/60 p-0.5"><X className="h-2 w-2 text-white" /></button></div>}
                  </div>
                  <div className="space-y-2 border-t border-slate-700 pt-3">
                    <Label className="text-slate-300 text-xs font-semibold">Featured Item (Left Panel)</Label>
                    <div className="bg-slate-800/50 p-2 rounded border border-slate-700 space-y-1">
                      <Input value={tv8Featured.title} onChange={e => setTv8Featured(prev => ({ ...prev, title: e.target.value }))} className="bg-slate-900 border-slate-600 text-white text-[10px] h-6" placeholder="Title" data-testid="input-tv8-feat-title" />
                      <Input value={tv8Featured.subtitle} onChange={e => setTv8Featured(prev => ({ ...prev, subtitle: e.target.value }))} className="bg-slate-900 border-slate-600 text-white text-[10px] h-6" placeholder="Subtitle" data-testid="input-tv8-feat-subtitle" />
                      <div className="flex gap-1">
                        <Input value={tv8Featured.singlePrice} onChange={e => setTv8Featured(prev => ({ ...prev, singlePrice: e.target.value }))} className="bg-slate-900 border-slate-600 text-white text-[10px] h-6 flex-1" placeholder="Single Price" data-testid="input-tv8-feat-single" />
                        <Input value={tv8Featured.mealPrice} onChange={e => setTv8Featured(prev => ({ ...prev, mealPrice: e.target.value }))} className="bg-slate-900 border-slate-600 text-white text-[10px] h-6 flex-1" placeholder="Meal Price" data-testid="input-tv8-feat-meal" />
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1 px-2 py-0.5 bg-slate-900 border border-slate-600 rounded cursor-pointer text-[10px] text-slate-400 hover:bg-slate-700">
                          <ImageIcon className="h-2.5 w-2.5" />Image
                          <input type="file" accept="image/*,video/*,.gif" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = ev => setTv8Featured(prev => ({ ...prev, image: ev.target?.result as string })); r.readAsDataURL(f); }}} data-testid="input-tv8-feat-img" />
                        </label>
                        {tv8Featured.image && <div className="relative w-8 h-8 rounded overflow-hidden border border-blue-500/50"><img src={tv8Featured.image} className="w-full h-full object-cover" /><button onClick={() => setTv8Featured(prev => ({ ...prev, image: null }))} className="absolute top-0 right-0 bg-black/60 p-0.5"><X className="h-1.5 w-1.5 text-white" /></button></div>}
                        <select value={tv8Featured.animation} onChange={e => setTv8Featured(prev => ({ ...prev, animation: e.target.value }))} className="bg-slate-900 border border-slate-600 text-white text-[10px] rounded px-1 py-0.5 flex-1" data-testid="select-tv8-feat-anim">
                          {[{value:"none",label:"None"},{value:"rotate",label:"Rotate"},{value:"rotateSlow",label:"Rotate Slow"},{value:"rotateFast",label:"Rotate Fast"},{value:"pulse",label:"Pulse"},{value:"bounce",label:"Bounce"},{value:"glow",label:"Glow"},{value:"shake",label:"Shake"},{value:"float",label:"Float"},{value:"swing",label:"Swing"},{value:"flash",label:"Flash"},{value:"zoomPulse",label:"Zoom Pulse"},{value:"slideIn",label:"Slide In"}].map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 border-t border-slate-700 pt-3">
                    <Label className="text-slate-300 text-xs font-semibold">Grid Items (2×3)</Label>
                    <div className="space-y-2 max-h-52 overflow-y-auto">
                      {tv8GridItems.map((item, i) => (
                        <div key={item.id} className="bg-slate-800/50 p-2 rounded border border-slate-700 space-y-1">
                          <div className="flex gap-1">
                            <Input value={item.name} onChange={e => setTv8GridItems(prev => prev.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} className="bg-slate-900 border-slate-600 text-white text-[10px] h-6 flex-1" placeholder="Name" data-testid={`input-tv8-grid-name-${i}`} />
                            <Input value={item.price} onChange={e => setTv8GridItems(prev => prev.map((x, j) => j === i ? { ...x, price: e.target.value } : x))} className="bg-slate-900 border-slate-600 text-white text-[10px] h-6 w-16" placeholder="Price" data-testid={`input-tv8-grid-price-${i}`} />
                            {tv8GridItems.length > 3 && <button onClick={() => setTv8GridItems(prev => prev.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-300 px-1"><X className="h-3 w-3" /></button>}
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="flex items-center gap-1 px-2 py-0.5 bg-slate-900 border border-slate-600 rounded cursor-pointer text-[10px] text-slate-400 hover:bg-slate-700">
                              <ImageIcon className="h-2.5 w-2.5" />Img
                              <input type="file" accept="image/*,video/*,.gif" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = ev => setTv8GridItems(prev => prev.map((x, j) => j === i ? { ...x, image: ev.target?.result as string } : x)); r.readAsDataURL(f); }}} data-testid={`input-tv8-grid-img-${i}`} />
                            </label>
                            {item.image && <div className="relative w-5 h-5 rounded overflow-hidden border border-blue-500/50"><img src={item.image} className="w-full h-full object-cover" /><button onClick={() => setTv8GridItems(prev => prev.map((x, j) => j === i ? { ...x, image: null } : x))} className="absolute top-0 right-0 bg-black/60 p-0.5"><X className="h-1.5 w-1.5 text-white" /></button></div>}
                            <select value={item.animation} onChange={e => setTv8GridItems(prev => prev.map((x, j) => j === i ? { ...x, animation: e.target.value } : x))} className="bg-slate-900 border border-slate-600 text-white text-[10px] rounded px-1 py-0.5 flex-1" data-testid={`select-tv8-grid-anim-${i}`}>
                              {[{value:"none",label:"None"},{value:"rotate",label:"Rotate"},{value:"rotateSlow",label:"Rotate Slow"},{value:"rotateFast",label:"Rotate Fast"},{value:"pulse",label:"Pulse"},{value:"bounce",label:"Bounce"},{value:"glow",label:"Glow"},{value:"shake",label:"Shake"},{value:"float",label:"Float"},{value:"swing",label:"Swing"},{value:"flash",label:"Flash"},{value:"zoomPulse",label:"Zoom Pulse"},{value:"slideIn",label:"Slide In"}].map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                    {tv8GridItems.length < 12 && <button onClick={() => setTv8GridItems(prev => [...prev, { id: Date.now(), name: "NEW ITEM", price: "£0.00", image: null, animation: "none" }])} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1" data-testid="btn-tv8-add-grid"><Plus className="h-3 w-3" />Add Grid Item</button>}
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <div className="flex bg-slate-800 rounded-lg overflow-hidden border border-slate-700">
                      <button onClick={() => setTv8Orientation("landscape")} className={`px-3 py-1.5 text-xs font-medium ${tv8Orientation === "landscape" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400"}`} data-testid="btn-tv8-landscape">Landscape</button>
                      <button onClick={() => setTv8Orientation("portrait")} className={`px-3 py-1.5 text-xs font-medium ${tv8Orientation === "portrait" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400"}`} data-testid="btn-tv8-portrait">Portrait</button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4 text-slate-400" />
                      <div className="flex gap-1">
                        {TV_SIZES.map((s, i) => (
                          <button key={s.label} onClick={() => setTv8SizeIndex(i)} className={`px-2 py-1 text-[10px] rounded ${i === tv8SizeIndex ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`} data-testid={`btn-tv8-size-${i}`}>{s.label}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <div style={{ width: tv8Orientation === "portrait" ? tv8Size.width * 0.56 : tv8Size.width, maxWidth: "100%", transition: "width 0.3s ease" }}>
                      <div className="relative overflow-hidden rounded-xl shadow-2xl border-4 border-slate-800" style={{ aspectRatio: tv8Orientation === "portrait" ? "9/16" : "16/9", background: tv8BgColor }} data-testid="tv8-preview">
                        {tv8BgMedia && <div className="absolute inset-0 z-[1]">{tv8BgMediaType === "video" ? <video src={tv8BgMedia} className="w-full h-full object-cover opacity-20" muted autoPlay loop /> : <img src={tv8BgMedia} alt="" className="w-full h-full object-cover opacity-20" />}</div>}
                        {tv8Logo && <div className="absolute z-30" style={{ top: "2%", right: "2%" }}><div className="overflow-hidden" style={{ width: "clamp(16px, 3vw, 32px)", height: "clamp(16px, 3vw, 32px)" }}><img src={tv8Logo} alt="Logo" className="w-full h-full object-contain" /></div></div>}
                        {tv8Orientation === "landscape" ? (
                          <div className="absolute inset-0 flex z-10">
                            <div className="flex-[2] flex flex-col items-center justify-center p-[3%]" style={{ background: tv8BgColor }}>
                              <div className="font-black uppercase leading-tight text-center" style={{ fontSize: "clamp(8px, 2.5vw, 28px)", color: tv8TextColor }}>{tv8Featured.title}</div>
                              <div className="w-[60%] h-[2px] my-[2%]" style={{ background: tv8BorderColor }}></div>
                              {tv8Featured.image && <div className="my-[3%]" style={{ ...tv8AnimStyle(tv8Featured.animation), width: "70%", maxHeight: "50%" }}><img src={tv8Featured.image} alt="" className="w-full h-full object-contain drop-shadow-2xl" /></div>}
                              <div className="font-medium mt-[2%]" style={{ fontSize: "clamp(4px, 0.9vw, 10px)", color: tv8TextColor, opacity: 0.8 }}>{tv8Featured.subtitle}</div>
                              <div className="flex items-center gap-[10%] mt-[2%]">
                                <span className="font-black" style={{ fontSize: "clamp(6px, 2vw, 22px)", color: tv8PriceColor }}>{tv8Featured.singlePrice}</span>
                                <span className="font-black" style={{ fontSize: "clamp(6px, 2vw, 22px)", color: tv8PriceColor }}>{tv8Featured.mealPrice}</span>
                              </div>
                            </div>
                            <div className="flex-[3] p-[1%]">
                              <div className="w-full h-full grid grid-cols-3 grid-rows-2 gap-[2px]">
                                {tv8GridItems.slice(0, 6).map((item) => (
                                  <div key={item.id} className="flex flex-col items-center justify-center p-[4%] relative" style={{ background: tv8GridBgColor, border: `1px solid ${tv8BorderColor}40` }}>
                                    {item.image && <div className="flex-1 flex items-center justify-center w-full" style={tv8AnimStyle(item.animation)}><img src={item.image} alt="" className="max-w-[85%] max-h-[70%] object-contain drop-shadow-lg" /></div>}
                                    <div className="flex items-center gap-[6%] mt-auto w-full justify-center">
                                      <span className="font-bold uppercase text-center" style={{ fontSize: "clamp(3px, 0.7vw, 7px)", color: tv8TextColor, lineHeight: 1.1 }}>{item.name}</span>
                                      <span className="font-black" style={{ fontSize: "clamp(5px, 1.2vw, 13px)", color: tv8PriceColor }}>{item.price}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="absolute inset-0 flex flex-col z-10">
                            <div className="flex-[1.5] flex flex-col items-center justify-center p-[4%]" style={{ background: tv8BgColor }}>
                              <div className="font-black uppercase leading-tight text-center" style={{ fontSize: "clamp(6px, 3.5vw, 22px)", color: tv8TextColor }}>{tv8Featured.title}</div>
                              <div className="w-[40%] h-[2px] my-[2%]" style={{ background: tv8BorderColor }}></div>
                              {tv8Featured.image && <div className="my-[2%]" style={{ ...tv8AnimStyle(tv8Featured.animation), width: "55%", maxHeight: "45%" }}><img src={tv8Featured.image} alt="" className="w-full h-full object-contain drop-shadow-2xl" /></div>}
                              <div className="font-medium mt-[1%]" style={{ fontSize: "clamp(3px, 1.5vw, 8px)", color: tv8TextColor, opacity: 0.8 }}>{tv8Featured.subtitle}</div>
                              <div className="flex items-center gap-[10%] mt-[1%]">
                                <span className="font-black" style={{ fontSize: "clamp(5px, 3vw, 18px)", color: tv8PriceColor }}>{tv8Featured.singlePrice}</span>
                                <span className="font-black" style={{ fontSize: "clamp(5px, 3vw, 18px)", color: tv8PriceColor }}>{tv8Featured.mealPrice}</span>
                              </div>
                            </div>
                            <div className="flex-[2.5] p-[2%]">
                              <div className="w-full h-full grid grid-cols-3 gap-[2px]" style={{ gridAutoRows: "1fr" }}>
                                {tv8GridItems.slice(0, 6).map((item) => (
                                  <div key={item.id} className="flex flex-col items-center justify-center p-[5%] relative" style={{ background: tv8GridBgColor, border: `1px solid ${tv8BorderColor}40` }}>
                                    {item.image && <div className="flex-1 flex items-center justify-center w-full" style={tv8AnimStyle(item.animation)}><img src={item.image} alt="" className="max-w-[90%] max-h-[65%] object-contain drop-shadow-lg" /></div>}
                                    <div className="text-center mt-auto w-full">
                                      <div className="font-bold uppercase" style={{ fontSize: "clamp(2px, 1.2vw, 6px)", color: tv8TextColor, lineHeight: 1.1 }}>{item.name}</div>
                                      <div className="font-black" style={{ fontSize: "clamp(4px, 2vw, 11px)", color: tv8PriceColor }}>{item.price}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="text-center mt-2 text-xs text-slate-500" data-testid="text-tv8-size-label">Preview: {tv8Size.label} TV — {tv8Orientation === "portrait" ? "Portrait 9:16" : "Landscape 16:9"}</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : activeTv === 9 ? (
              <div className="grid grid-cols-1 xl:grid-cols-[minmax(350px,1fr)_minmax(500px,2fr)] gap-8">
                <div className="space-y-5 max-h-[80vh] overflow-y-auto pr-2">
                  <h2 className="text-lg font-bold text-slate-200 border-b border-slate-700 pb-2" data-testid="text-tv9-editor-title">Layout Editor — TV 9 (Promo Layered)</h2>
                  <MusicInput value={tv9Music} onChange={setTv9Music} tvNum={9} />
                  <div className="space-y-2">
                    <Label className="text-slate-300 text-xs font-semibold">Colors</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div><label className="text-[10px] text-slate-400">Background</label><input type="color" value={tv9BgColor} onChange={e => setTv9BgColor(e.target.value)} className="w-full h-8 rounded cursor-pointer" data-testid="input-tv9-bg" /></div>
                      <div><label className="text-[10px] text-slate-400">Text</label><input type="color" value={tv9TextColor} onChange={e => setTv9TextColor(e.target.value)} className="w-full h-8 rounded cursor-pointer" data-testid="input-tv9-text" /></div>
                      <div><label className="text-[10px] text-slate-400">Price</label><input type="color" value={tv9PriceColor} onChange={e => setTv9PriceColor(e.target.value)} className="w-full h-8 rounded cursor-pointer" data-testid="input-tv9-price" /></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300 text-xs font-semibold">Logo</Label>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors">
                        <Upload className="h-3.5 w-3.5 text-slate-400" /><span className="text-xs text-slate-300">Upload Logo</span>
                        <input type="file" accept="image/*,video/*,.gif" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = ev => setTv9Logo(ev.target?.result as string); r.readAsDataURL(f); }}} data-testid="input-tv9-logo" />
                      </label>
                      {tv9Logo && <div className="relative w-10 h-10 rounded overflow-hidden border-2 border-blue-500"><img src={tv9Logo} className="w-full h-full object-cover" /><button onClick={() => setTv9Logo(null)} className="absolute -top-1 -right-1 bg-red-600 rounded-full p-0.5"><X className="h-2 w-2 text-white" /></button></div>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300 text-xs font-semibold">Background Media</Label>
                    <div className="flex gap-2 mb-2">
                      {(["image", "video", "gif"] as const).map(t => (
                        <button key={t} onClick={() => { setTv9BgMediaType(t); setTv9BgMedia(null); }} className={`px-3 py-1 text-[10px] rounded ${tv9BgMediaType === t ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400"}`} data-testid={`btn-tv9-bg-${t}`}>{t.toUpperCase()}</button>
                      ))}
                    </div>
                    <label className="flex items-center gap-2 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors">
                      <Upload className="h-3.5 w-3.5 text-slate-400" /><span className="text-xs text-slate-300">Upload {tv9BgMediaType === "gif" ? "GIF" : tv9BgMediaType === "video" ? "Video" : "Image"}</span>
                      <input type="file" accept={tv9BgMediaType === "video" ? "video/*" : "image/*"} className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = ev => setTv9BgMedia(ev.target?.result as string); r.readAsDataURL(f); }}} data-testid="input-tv9-bg-media" />
                    </label>
                    {tv9BgMedia && <div className="relative w-20 h-12 rounded overflow-hidden border border-blue-500/50">{tv9BgMediaType === "video" ? <video src={tv9BgMedia} className="w-full h-full object-cover" muted autoPlay loop /> : <img src={tv9BgMedia} className="w-full h-full object-cover" />}<button onClick={() => setTv9BgMedia(null)} className="absolute top-0 right-0 bg-black/60 p-0.5"><X className="h-2 w-2 text-white" /></button></div>}
                  </div>
                  <div className="space-y-2 border-t border-slate-700 pt-3">
                    <Label className="text-slate-300 text-xs font-semibold">Left Side — Layered Images (front/back)</Label>
                    {tv9LeftItems.map((item, i) => (
                      <div key={item.id} className="bg-slate-800/50 p-2 rounded border border-slate-700 space-y-1">
                        <div className="text-[10px] text-slate-400 font-medium">{i === 0 ? "Front Layer" : "Back Layer"}</div>
                        <div className="flex gap-1">
                          <Input value={item.name} onChange={e => setTv9LeftItems(prev => prev.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} className="bg-slate-900 border-slate-600 text-white text-[10px] h-6 flex-1" placeholder="Name" data-testid={`input-tv9-left-name-${i}`} />
                          <Input value={item.price} onChange={e => setTv9LeftItems(prev => prev.map((x, j) => j === i ? { ...x, price: e.target.value } : x))} className="bg-slate-900 border-slate-600 text-white text-[10px] h-6 w-16" placeholder="Price" data-testid={`input-tv9-left-price-${i}`} />
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-1 px-2 py-0.5 bg-slate-900 border border-slate-600 rounded cursor-pointer text-[10px] text-slate-400 hover:bg-slate-700">
                            <ImageIcon className="h-2.5 w-2.5" />Img
                            <input type="file" accept="image/*,video/*,.gif" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = ev => setTv9LeftItems(prev => prev.map((x, j) => j === i ? { ...x, image: ev.target?.result as string } : x)); r.readAsDataURL(f); }}} data-testid={`input-tv9-left-img-${i}`} />
                          </label>
                          {item.image && <div className="relative w-5 h-5 rounded overflow-hidden border border-blue-500/50"><img src={item.image} className="w-full h-full object-cover" /><button onClick={() => setTv9LeftItems(prev => prev.map((x, j) => j === i ? { ...x, image: null } : x))} className="absolute top-0 right-0 bg-black/60 p-0.5"><X className="h-1.5 w-1.5 text-white" /></button></div>}
                          <select value={item.animation} onChange={e => setTv9LeftItems(prev => prev.map((x, j) => j === i ? { ...x, animation: e.target.value } : x))} className="bg-slate-900 border border-slate-600 text-white text-[10px] rounded px-1 py-0.5 flex-1" data-testid={`select-tv9-left-anim-${i}`}>
                            {[{value:"none",label:"None"},{value:"rotate",label:"Rotate"},{value:"rotateSlow",label:"Rotate Slow"},{value:"rotateFast",label:"Rotate Fast"},{value:"pulse",label:"Pulse"},{value:"bounce",label:"Bounce"},{value:"glow",label:"Glow"},{value:"shake",label:"Shake"},{value:"float",label:"Float"},{value:"swing",label:"Swing"},{value:"flash",label:"Flash"},{value:"zoomPulse",label:"Zoom Pulse"},{value:"slideIn",label:"Slide In"},{value:"orbitSpin",label:"Orbit Spin"}].map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2 border-t border-slate-700 pt-3">
                    <Label className="text-slate-300 text-xs font-semibold">Right Side — Rotating Items (earth-style)</Label>
                    {tv9RightItems.map((item, i) => (
                      <div key={item.id} className="bg-slate-800/50 p-2 rounded border border-slate-700 space-y-1">
                        <div className="flex gap-1">
                          <Input value={item.name} onChange={e => setTv9RightItems(prev => prev.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} className="bg-slate-900 border-slate-600 text-white text-[10px] h-6 flex-1" placeholder="Name" data-testid={`input-tv9-right-name-${i}`} />
                          <Input value={item.price} onChange={e => setTv9RightItems(prev => prev.map((x, j) => j === i ? { ...x, price: e.target.value } : x))} className="bg-slate-900 border-slate-600 text-white text-[10px] h-6 w-16" placeholder="Price" data-testid={`input-tv9-right-price-${i}`} />
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-1 px-2 py-0.5 bg-slate-900 border border-slate-600 rounded cursor-pointer text-[10px] text-slate-400 hover:bg-slate-700">
                            <ImageIcon className="h-2.5 w-2.5" />Img
                            <input type="file" accept="image/*,video/*,.gif" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = ev => setTv9RightItems(prev => prev.map((x, j) => j === i ? { ...x, image: ev.target?.result as string } : x)); r.readAsDataURL(f); }}} data-testid={`input-tv9-right-img-${i}`} />
                          </label>
                          {item.image && <div className="relative w-5 h-5 rounded overflow-hidden border border-blue-500/50"><img src={item.image} className="w-full h-full object-cover" /><button onClick={() => setTv9RightItems(prev => prev.map((x, j) => j === i ? { ...x, image: null } : x))} className="absolute top-0 right-0 bg-black/60 p-0.5"><X className="h-1.5 w-1.5 text-white" /></button></div>}
                          <select value={item.animation} onChange={e => setTv9RightItems(prev => prev.map((x, j) => j === i ? { ...x, animation: e.target.value } : x))} className="bg-slate-900 border border-slate-600 text-white text-[10px] rounded px-1 py-0.5 flex-1" data-testid={`select-tv9-right-anim-${i}`}>
                            {[{value:"none",label:"None"},{value:"rotate",label:"Rotate"},{value:"rotateSlow",label:"Rotate Slow"},{value:"rotateFast",label:"Rotate Fast"},{value:"pulse",label:"Pulse"},{value:"bounce",label:"Bounce"},{value:"glow",label:"Glow"},{value:"shake",label:"Shake"},{value:"float",label:"Float"},{value:"swing",label:"Swing"},{value:"flash",label:"Flash"},{value:"zoomPulse",label:"Zoom Pulse"},{value:"slideIn",label:"Slide In"},{value:"orbitSpin",label:"Orbit Spin"}].map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                        </div>
                      </div>
                    ))}
                    {tv9RightItems.length < 5 && <button onClick={() => setTv9RightItems(prev => [...prev, { id: Date.now(), name: "", price: "", image: null, animation: "rotate" }])} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1" data-testid="btn-tv9-add-right"><Plus className="h-3 w-3" />Add Item</button>}
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <div className="flex bg-slate-800 rounded-lg overflow-hidden border border-slate-700">
                      <button onClick={() => setTv9Orientation("landscape")} className={`px-3 py-1.5 text-xs font-medium ${tv9Orientation === "landscape" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400"}`} data-testid="btn-tv9-landscape">Landscape</button>
                      <button onClick={() => setTv9Orientation("portrait")} className={`px-3 py-1.5 text-xs font-medium ${tv9Orientation === "portrait" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400"}`} data-testid="btn-tv9-portrait">Portrait</button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4 text-slate-400" />
                      <div className="flex gap-1">
                        {TV_SIZES.map((s, i) => (
                          <button key={s.label} onClick={() => setTv9SizeIndex(i)} className={`px-2 py-1 text-[10px] rounded ${i === tv9SizeIndex ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`} data-testid={`btn-tv9-size-${i}`}>{s.label}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <div style={{ width: tv9Orientation === "portrait" ? tv9Size.width * 0.56 : tv9Size.width, maxWidth: "100%", transition: "width 0.3s ease" }}>
                      <div className="relative overflow-hidden rounded-xl shadow-2xl border-4 border-slate-800" style={{ aspectRatio: tv9Orientation === "portrait" ? "9/16" : "16/9", background: tv9BgColor }} data-testid="tv9-preview">
                        {tv9BgMedia && <div className="absolute inset-0 z-[1]">{tv9BgMediaType === "video" ? <video src={tv9BgMedia} className="w-full h-full object-cover opacity-25" muted autoPlay loop /> : <img src={tv9BgMedia} alt="" className="w-full h-full object-cover opacity-25" />}</div>}
                        {tv9Logo && <div className="absolute z-30" style={{ top: "2%", ...(tv9Orientation === "portrait" ? { right: "3%" } : { left: "50%", transform: "translateX(-50%)" }) }}><div className="overflow-hidden" style={{ width: "clamp(28px, 5vw, 56px)", height: "clamp(28px, 5vw, 56px)" }}><img src={tv9Logo} alt="Logo" className="w-full h-full object-contain" /></div></div>}
                        {tv9Orientation === "landscape" ? (
                          <div className="absolute inset-0 flex z-10">
                            <div className="flex-[3] relative flex flex-col items-center justify-end p-[3%] overflow-hidden">
                              <div className="absolute top-[5%] left-[5%] right-[30%] z-20">
                                <div className="font-black uppercase leading-tight" style={{ fontSize: "clamp(8px, 2.8vw, 30px)", color: tv9TextColor, textShadow: "2px 2px 8px rgba(0,0,0,0.5)" }}>{tv9LeftItems[0]?.name}</div>
                              </div>
                              <div className="absolute z-10" style={{ bottom: "5%", left: "2%", width: "55%", height: "80%" }}>
                                {tv9LeftItems[1]?.image && <div style={{ ...tv9AnimStyle(tv9LeftItems[1].animation), width: "100%", height: "100%", opacity: 0.7 }}><img src={tv9LeftItems[1].image} alt="" className="w-full h-full object-contain drop-shadow-xl" /></div>}
                              </div>
                              <div className="absolute z-20" style={{ bottom: "3%", left: "15%", width: "65%", height: "85%" }}>
                                {tv9LeftItems[0]?.image && <div style={{ ...tv9AnimStyle(tv9LeftItems[0].animation), width: "100%", height: "100%" }}><img src={tv9LeftItems[0].image} alt="" className="w-full h-full object-contain drop-shadow-2xl" /></div>}
                              </div>
                              <div className="absolute z-30" style={{ bottom: "8%", right: "5%" }}>
                                <span className="font-black" style={{ fontSize: "clamp(6px, 2vw, 22px)", color: tv9PriceColor, textShadow: "2px 2px 6px rgba(0,0,0,0.5)" }}>{tv9LeftItems[0]?.price}</span>
                              </div>
                            </div>
                            <div className="flex-[2] relative flex flex-col items-center justify-center p-[3%]">
                              {tv9RightItems[0]?.name && <div className="absolute top-[5%] right-[5%] z-20 text-right">
                                <div className="font-black uppercase leading-tight" style={{ fontSize: "clamp(6px, 2vw, 22px)", color: tv9TextColor, textShadow: "2px 2px 8px rgba(0,0,0,0.5)" }}>{tv9RightItems[0]?.name}</div>
                              </div>}
                              <div className="relative w-full h-[70%]" style={{ animation: "tv9_orbitSpin 12s linear infinite" }}>
                                {tv9RightItems.map((item, idx) => {
                                  const angle = (idx * 360) / tv9RightItems.length;
                                  const rad = (angle * Math.PI) / 180;
                                  const rx = 30;
                                  const ry = 25;
                                  const cx = 50 + rx * Math.cos(rad);
                                  const cy = 50 + ry * Math.sin(rad);
                                  return item.image ? (
                                    <div key={item.id} className="absolute" style={{ left: `${cx - 15}%`, top: `${cy - 15}%`, width: "30%", height: "30%", ...tv9AnimStyle(item.animation) }}><img src={item.image} alt="" className="w-full h-full object-contain drop-shadow-lg" /></div>
                                  ) : null;
                                })}
                              </div>
                              {tv9RightItems[0]?.price && <div className="absolute bottom-[8%] z-20">
                                <span className="font-black" style={{ fontSize: "clamp(6px, 2.2vw, 24px)", color: tv9PriceColor, textShadow: "2px 2px 6px rgba(0,0,0,0.5)" }}>{tv9RightItems[0]?.price}</span>
                              </div>}
                            </div>
                          </div>
                        ) : (
                          <div className="absolute inset-0 flex flex-col z-10">
                            <div className="flex-[3] relative flex flex-col items-center justify-end overflow-hidden p-[4%]">
                              <div className="absolute top-[4%] left-[5%] right-[10%] z-20">
                                <div className="font-black uppercase leading-tight" style={{ fontSize: "clamp(6px, 4vw, 24px)", color: tv9TextColor, textShadow: "2px 2px 8px rgba(0,0,0,0.5)" }}>{tv9LeftItems[0]?.name}</div>
                              </div>
                              <div className="absolute z-10" style={{ bottom: "5%", left: "0%", width: "55%", height: "75%" }}>
                                {tv9LeftItems[1]?.image && <div style={{ ...tv9AnimStyle(tv9LeftItems[1].animation), width: "100%", height: "100%", opacity: 0.7 }}><img src={tv9LeftItems[1].image} alt="" className="w-full h-full object-contain drop-shadow-xl" /></div>}
                              </div>
                              <div className="absolute z-20" style={{ bottom: "2%", left: "15%", width: "70%", height: "80%" }}>
                                {tv9LeftItems[0]?.image && <div style={{ ...tv9AnimStyle(tv9LeftItems[0].animation), width: "100%", height: "100%" }}><img src={tv9LeftItems[0].image} alt="" className="w-full h-full object-contain drop-shadow-2xl" /></div>}
                              </div>
                              <div className="absolute z-30" style={{ bottom: "3%", right: "8%" }}>
                                <span className="font-black" style={{ fontSize: "clamp(5px, 3.5vw, 20px)", color: tv9PriceColor, textShadow: "2px 2px 6px rgba(0,0,0,0.5)" }}>{tv9LeftItems[0]?.price}</span>
                              </div>
                            </div>
                            <div className="flex-[1.5] relative flex flex-col items-center justify-center p-[3%]">
                              {tv9RightItems[0]?.name && <div className="z-20 text-center w-full mb-[2%]">
                                <div className="font-black uppercase leading-tight" style={{ fontSize: "clamp(5px, 3.5vw, 18px)", color: tv9TextColor, textShadow: "2px 2px 8px rgba(0,0,0,0.5)" }}>{tv9RightItems[0]?.name}</div>
                              </div>}
                              <div className="flex items-center justify-center gap-[4%] w-full">
                                {tv9RightItems.map((item) => (
                                  item.image ? (
                                    <div key={item.id} style={{ ...tv9AnimStyle(item.animation), width: "28%", flexShrink: 0 }}><img src={item.image} alt="" className="w-full h-auto object-contain drop-shadow-lg" /></div>
                                  ) : null
                                ))}
                              </div>
                              {tv9RightItems[0]?.price && <div className="z-20 mt-[3%]">
                                <span className="font-black" style={{ fontSize: "clamp(5px, 3.5vw, 20px)", color: tv9PriceColor, textShadow: "2px 2px 6px rgba(0,0,0,0.5)" }}>{tv9RightItems[0]?.price}</span>
                              </div>}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="text-center mt-2 text-xs text-slate-500" data-testid="text-tv9-size-label">Preview: {tv9Size.label} TV — {tv9Orientation === "portrait" ? "Portrait 9:16" : "Landscape 16:9"}</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes sideTextPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.06); } }
        @keyframes floatUpDown { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes pricePopIn { 0% { opacity: 0; transform: scale(0.3) rotate(5deg); } 60% { transform: scale(1.08) rotate(5deg); } 100% { opacity: 1; transform: scale(1) rotate(5deg); } }
        @keyframes price_pulse { 0%, 100% { transform: scale(1) rotate(5deg); } 50% { transform: scale(1.2) rotate(5deg); } }
        @keyframes price_bounce { 0%, 100% { transform: translateY(0) rotate(5deg); } 25% { transform: translateY(-8px) rotate(5deg); } 50% { transform: translateY(0) rotate(5deg); } 75% { transform: translateY(-4px) rotate(5deg); } }
        @keyframes price_glow { 0%, 100% { text-shadow: 0 0 5px #fff, 0 0 10px #FFD700; transform: rotate(5deg); } 50% { text-shadow: 0 0 15px #fff, 0 0 30px #FFD700, 0 0 50px #FF8C00; transform: scale(1.05) rotate(5deg); } }
        @keyframes price_shake { 0%, 100% { transform: translateX(0) rotate(5deg); } 10% { transform: translateX(-3px) rotate(3deg); } 20% { transform: translateX(3px) rotate(7deg); } 30% { transform: translateX(-3px) rotate(3deg); } 40% { transform: translateX(3px) rotate(7deg); } 50% { transform: translateX(0) rotate(5deg); } }
        @keyframes price_flash { 0%, 50%, 100% { opacity: 1; transform: rotate(5deg); } 25%, 75% { opacity: 0.3; transform: scale(1.1) rotate(5deg); } }
        @keyframes price_swing { 0%, 100% { transform: rotate(5deg); } 25% { transform: rotate(-5deg); } 50% { transform: rotate(10deg); } 75% { transform: rotate(-2deg); } }
        @keyframes anim_pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.15); } }
        @keyframes anim_bounce { 0%, 100% { transform: translateY(0); } 25% { transform: translateY(-6px); } 50% { transform: translateY(0); } 75% { transform: translateY(-3px); } }
        @keyframes anim_glow { 0%, 100% { filter: brightness(1); } 50% { filter: brightness(1.4); } }
        @keyframes anim_shake { 0%, 100% { transform: translateX(0); } 10% { transform: translateX(-3px); } 20% { transform: translateX(3px); } 30% { transform: translateX(-3px); } 40% { transform: translateX(3px); } 50% { transform: translateX(0); } }
        @keyframes anim_flash { 0%, 50%, 100% { opacity: 1; } 25%, 75% { opacity: 0.2; } }
        @keyframes anim_swing { 0%, 100% { transform: rotate(0deg); } 25% { transform: rotate(-5deg); } 50% { transform: rotate(5deg); } 75% { transform: rotate(-3deg); } }
        @keyframes tv2_pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.08); } }
        @keyframes tv2_bounce { 0%, 100% { transform: translateY(0); } 25% { transform: translateY(-5px); } 50% { transform: translateY(0); } 75% { transform: translateY(-2px); } }
        @keyframes tv2_glow { 0%, 100% { filter: brightness(1); } 50% { filter: brightness(1.5); } }
        @keyframes tv2_shake { 0%, 100% { transform: translateX(0); } 10% { transform: translateX(-2px); } 20% { transform: translateX(2px); } 30% { transform: translateX(-2px); } 40% { transform: translateX(2px); } 50% { transform: translateX(0); } }
        @keyframes tv2_flash { 0%, 50%, 100% { opacity: 1; } 25%, 75% { opacity: 0.3; } }
        @keyframes tv2_swing { 0%, 100% { transform: rotate(0deg); } 25% { transform: rotate(-3deg); } 50% { transform: rotate(3deg); } 75% { transform: rotate(-1deg); } }
        @keyframes tv2_float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes tv2_slideIn { 0% { opacity: 0; transform: translateX(-20px); } 100% { opacity: 1; transform: translateX(0); } }
        @keyframes tv2_comboScroll { 0% { opacity: 0.7; transform: scale(0.98); } 25% { opacity: 1; transform: scale(1.02); } 50% { opacity: 1; transform: scale(1); } 75% { opacity: 1; transform: scale(1.02); } 100% { opacity: 0.7; transform: scale(0.98); } }
        @keyframes tv3_pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.08); } }
        @keyframes tv3_bounce { 0%, 100% { transform: translateY(0); } 25% { transform: translateY(-5px); } 50% { transform: translateY(0); } 75% { transform: translateY(-2px); } }
        @keyframes tv3_glow { 0%, 100% { filter: brightness(1); } 50% { filter: brightness(1.5); } }
        @keyframes tv3_shake { 0%, 100% { transform: translateX(0); } 10% { transform: translateX(-3px); } 20% { transform: translateX(3px); } 30% { transform: translateX(-3px); } 40% { transform: translateX(3px); } 50% { transform: translateX(0); } }
        @keyframes tv3_float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes tv4_rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes tv4_pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.08); } }
        @keyframes tv4_bounce { 0%, 100% { transform: translateY(0); } 25% { transform: translateY(-5px); } 50% { transform: translateY(0); } 75% { transform: translateY(-2px); } }
        @keyframes tv4_glow { 0%, 100% { filter: brightness(1); } 50% { filter: brightness(1.5); } }
        @keyframes tv4_shake { 0%, 100% { transform: translateX(0); } 10% { transform: translateX(-3px); } 20% { transform: translateX(3px); } 30% { transform: translateX(-3px); } 40% { transform: translateX(3px); } 50% { transform: translateX(0); } }
        @keyframes tv4_float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes tv4_swing { 0%, 100% { transform: rotate(0deg); } 25% { transform: rotate(-5deg); } 50% { transform: rotate(5deg); } 75% { transform: rotate(-3deg); } }
        @keyframes tv4_flash { 0%, 50%, 100% { opacity: 1; } 25%, 75% { opacity: 0.3; } }
        @keyframes tv4_slideIn { 0% { opacity: 0; transform: translateX(-20px); } 100% { opacity: 1; transform: translateX(0); } }
        @keyframes tv4_zoomPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.15); } }
        @keyframes tv5_rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes tv5_pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.08); } }
        @keyframes tv5_bounce { 0%, 100% { transform: translateY(0); } 25% { transform: translateY(-5px); } 50% { transform: translateY(0); } 75% { transform: translateY(-2px); } }
        @keyframes tv5_glow { 0%, 100% { filter: brightness(1); } 50% { filter: brightness(1.5); } }
        @keyframes tv5_shake { 0%, 100% { transform: translateX(0); } 10% { transform: translateX(-3px); } 20% { transform: translateX(3px); } 30% { transform: translateX(-3px); } 40% { transform: translateX(3px); } 50% { transform: translateX(0); } }
        @keyframes tv5_float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes tv5_swing { 0%, 100% { transform: rotate(0deg); } 25% { transform: rotate(-5deg); } 50% { transform: rotate(5deg); } 75% { transform: rotate(-3deg); } }
        @keyframes tv5_flash { 0%, 50%, 100% { opacity: 1; } 25%, 75% { opacity: 0.3; } }
        @keyframes tv5_slideIn { 0% { opacity: 0; transform: translateX(-20px); } 100% { opacity: 1; transform: translateX(0); } }
        @keyframes tv5_zoomPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.15); } }
        @keyframes tv6_rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes tv6_pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.08); } }
        @keyframes tv6_bounce { 0%, 100% { transform: translateY(0); } 25% { transform: translateY(-8px); } 50% { transform: translateY(0); } 75% { transform: translateY(-4px); } }
        @keyframes tv6_glow { 0%, 100% { filter: brightness(1) drop-shadow(0 0 5px rgba(255,215,0,0.3)); } 50% { filter: brightness(1.3) drop-shadow(0 0 20px rgba(255,215,0,0.8)); } }
        @keyframes tv6_shake { 0%, 100% { transform: translateX(0); } 10% { transform: translateX(-4px); } 20% { transform: translateX(4px); } 30% { transform: translateX(-4px); } 40% { transform: translateX(4px); } 50% { transform: translateX(0); } }
        @keyframes tv6_float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes tv6_swing { 0%, 100% { transform: rotate(0deg); } 25% { transform: rotate(-8deg); } 50% { transform: rotate(8deg); } 75% { transform: rotate(-4deg); } }
        @keyframes tv6_flash { 0%, 50%, 100% { opacity: 1; } 25%, 75% { opacity: 0.3; } }
        @keyframes tv6_slideIn { 0% { opacity: 0; transform: translateY(30px); } 100% { opacity: 1; transform: translateY(0); } }
        @keyframes tv6_zoomPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.15); } }
        @keyframes tv7_rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes tv7_pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.08); } }
        @keyframes tv7_bounce { 0%, 100% { transform: translateY(0); } 25% { transform: translateY(-6px); } 50% { transform: translateY(0); } 75% { transform: translateY(-3px); } }
        @keyframes tv7_glow { 0%, 100% { filter: brightness(1); } 50% { filter: brightness(1.4); } }
        @keyframes tv7_shake { 0%, 100% { transform: translateX(0); } 10% { transform: translateX(-3px); } 20% { transform: translateX(3px); } 30% { transform: translateX(-3px); } 40% { transform: translateX(3px); } 50% { transform: translateX(0); } }
        @keyframes tv7_float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes tv7_swing { 0%, 100% { transform: rotate(0deg); } 25% { transform: rotate(-6deg); } 50% { transform: rotate(6deg); } 75% { transform: rotate(-3deg); } }
        @keyframes tv7_flash { 0%, 50%, 100% { opacity: 1; } 25%, 75% { opacity: 0.3; } }
        @keyframes tv7_slideIn { 0% { opacity: 0; transform: translateX(-20px); } 100% { opacity: 1; transform: translateX(0); } }
        @keyframes tv7_zoomPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.15); } }
        @keyframes tv8_rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes tv8_pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.08); } }
        @keyframes tv8_bounce { 0%, 100% { transform: translateY(0); } 25% { transform: translateY(-6px); } 50% { transform: translateY(0); } 75% { transform: translateY(-3px); } }
        @keyframes tv8_glow { 0%, 100% { filter: brightness(1); } 50% { filter: brightness(1.4); } }
        @keyframes tv8_shake { 0%, 100% { transform: translateX(0); } 10% { transform: translateX(-3px); } 20% { transform: translateX(3px); } 30% { transform: translateX(-3px); } 40% { transform: translateX(3px); } 50% { transform: translateX(0); } }
        @keyframes tv8_float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes tv8_swing { 0%, 100% { transform: rotate(0deg); } 25% { transform: rotate(-6deg); } 50% { transform: rotate(6deg); } 75% { transform: rotate(-3deg); } }
        @keyframes tv8_flash { 0%, 50%, 100% { opacity: 1; } 25%, 75% { opacity: 0.3; } }
        @keyframes tv8_slideIn { 0% { opacity: 0; transform: translateX(-20px); } 100% { opacity: 1; transform: translateX(0); } }
        @keyframes tv8_zoomPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.15); } }
        @keyframes tv9_rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes tv9_pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.08); } }
        @keyframes tv9_bounce { 0%, 100% { transform: translateY(0); } 25% { transform: translateY(-6px); } 50% { transform: translateY(0); } 75% { transform: translateY(-3px); } }
        @keyframes tv9_glow { 0%, 100% { filter: brightness(1); } 50% { filter: brightness(1.5); } }
        @keyframes tv9_shake { 0%, 100% { transform: translateX(0); } 10% { transform: translateX(-3px); } 20% { transform: translateX(3px); } 30% { transform: translateX(-3px); } 40% { transform: translateX(3px); } 50% { transform: translateX(0); } }
        @keyframes tv9_float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes tv9_swing { 0%, 100% { transform: rotate(0deg); } 25% { transform: rotate(-6deg); } 50% { transform: rotate(6deg); } 75% { transform: rotate(-3deg); } }
        @keyframes tv9_flash { 0%, 50%, 100% { opacity: 1; } 25%, 75% { opacity: 0.3; } }
        @keyframes tv9_slideIn { 0% { opacity: 0; transform: translateX(-30px); } 100% { opacity: 1; transform: translateX(0); } }
        @keyframes tv9_zoomPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.15); } }
        @keyframes tv9_orbitSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      {showCustomerPanel && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setShowCustomerPanel(false)}>
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-2xl w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()} data-testid="dialog-customers">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Users className="h-6 w-6 text-purple-400" />
                <h2 className="text-xl font-bold text-white">TV Display Customers</h2>
              </div>
              <button onClick={() => setShowCustomerPanel(false)} className="text-slate-400 hover:text-white p-1" data-testid="btn-close-customers"><X className="h-5 w-5" /></button>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <ExternalLink className="h-4 w-4 text-blue-400" />
                <span className="text-sm text-slate-300 font-medium">Customer Login URL</span>
              </div>
              <div className="flex items-center gap-2">
                <input type="text" readOnly value={`${window.location.origin}/tv-login`} className="flex-1 bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm font-mono" onClick={e => (e.target as HTMLInputElement).select()} data-testid="input-login-url" />
                <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/tv-login`); toast({ title: "Copied!" }); }} className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm" data-testid="btn-copy-login-url"><Copy className="h-4 w-4" /></button>
              </div>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 mb-6">
              <h3 className="text-sm font-semibold text-purple-300 mb-3 flex items-center gap-2"><UserPlus className="h-4 w-4" /> Add New Customer</h3>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Customer Name</label>
                  <input type="text" value={newCustName} onChange={e => setNewCustName(e.target.value)} placeholder="e.g. Ali's Restaurant" className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm" data-testid="input-cust-name" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Username</label>
                  <input type="text" value={newCustUsername} onChange={e => setNewCustUsername(e.target.value)} placeholder="e.g. ali2024" className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm" data-testid="input-cust-username" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Password</label>
                  <input type="text" value={newCustPassword} onChange={e => setNewCustPassword(e.target.value)} placeholder="e.g. pass123" className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm" data-testid="input-cust-password" />
                </div>
              </div>
              <div className="mb-3">
                <label className="text-xs text-slate-400 mb-2 block">Assign TV Displays</label>
                <div className="flex flex-wrap gap-2">
                  {[1,2,3,4,5,6,7,8,9].map(tv => (
                    <button
                      key={tv}
                      onClick={() => setNewCustTvs(prev => prev.includes(tv) ? prev.filter(t => t !== tv) : [...prev, tv])}
                      className={`w-10 h-10 rounded-lg font-bold text-sm transition ${newCustTvs.includes(tv) ? "bg-purple-600 text-white border-2 border-purple-400" : "bg-slate-700 text-slate-400 border border-slate-600 hover:border-purple-500"}`}
                      data-testid={`btn-new-tv-${tv}`}
                    >
                      TV{tv}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={addCustomer} className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium text-sm transition flex items-center justify-center gap-2" data-testid="btn-add-customer">
                <UserPlus className="h-4 w-4" /> Add Customer
              </button>
            </div>

            {customers.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Users className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p>No customers yet. Add your first customer above.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-300 mb-2">Active Customers ({customers.length})</h3>
                {customers.map((cust) => (
                  <div key={cust.id} className={`border rounded-xl p-4 transition ${cust.isActive ? "bg-slate-800/50 border-slate-700" : "bg-red-900/10 border-red-900/30 opacity-60"}`} data-testid={`customer-card-${cust.id}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className="font-bold text-white text-sm">{cust.name}</span>
                        <span className="ml-2 text-xs text-slate-500">@{cust.username}</span>
                        <span className="ml-2 text-xs text-slate-600">pw: {cust.password}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleCustomer(cust.id, cust.isActive)}
                          className={`p-1.5 rounded-lg transition ${cust.isActive ? "text-green-400 hover:bg-green-900/30" : "text-red-400 hover:bg-red-900/30"}`}
                          title={cust.isActive ? "Deactivate" : "Activate"}
                          data-testid={`btn-toggle-${cust.id}`}
                        >
                          {cust.isActive ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                        </button>
                        <button onClick={() => deleteCustomer(cust.id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-900/30 transition" title="Delete" data-testid={`btn-delete-${cust.id}`}>
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {[1,2,3,4,5,6,7,8,9].map(tv => {
                        const assigned = ((cust.assignedTvs as number[]) || []).includes(tv);
                        return (
                          <button
                            key={tv}
                            onClick={() => {
                              const current = (cust.assignedTvs as number[]) || [];
                              const updated = assigned ? current.filter((t: number) => t !== tv) : [...current, tv];
                              updateCustomerTvs(cust.id, updated);
                            }}
                            className={`px-2 py-1 rounded text-xs font-medium transition ${assigned ? "bg-purple-600/40 text-purple-300 border border-purple-500/50" : "bg-slate-700/50 text-slate-500 border border-slate-600/50 hover:border-purple-500/50"}`}
                            data-testid={`btn-cust-tv-${cust.id}-${tv}`}
                          >
                            TV{tv}
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-2 flex items-center gap-1">
                      <span className={`inline-block w-2 h-2 rounded-full ${cust.isActive ? "bg-green-500" : "bg-red-500"}`} />
                      <span className="text-xs text-slate-500">{cust.isActive ? "Active" : "Deactivated"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {savedLiveUrl && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setSavedLiveUrl(null)}>
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-lg w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()} data-testid="dialog-live-url">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-green-600/20 flex items-center justify-center mx-auto mb-4">
                <Tv className="h-8 w-8 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">TV Display Saved!</h2>
              <p className="text-slate-400 mt-2">Your TV {activeTv} display is now live. Use this URL on your TV's browser:</p>
            </div>
            
            <div className="bg-slate-800 border border-slate-600 rounded-xl p-4 mb-4">
              <p className="text-xs text-slate-500 mb-2 font-medium">LIVE TV URL</p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={savedLiveUrl}
                  readOnly
                  className="flex-1 bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2.5 text-sm font-mono select-all focus:outline-none focus:border-green-500"
                  onClick={e => (e.target as HTMLInputElement).select()}
                  data-testid="input-live-url"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(savedLiveUrl);
                    toast({ title: "Copied!", description: "URL copied to clipboard" });
                  }}
                  className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm whitespace-nowrap transition"
                  data-testid="btn-copy-live-url"
                >
                  Copy URL
                </button>
              </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 mb-6">
              <p className="text-sm font-semibold text-slate-300 mb-3">How to use on your TV:</p>
              <div className="space-y-2 text-sm text-slate-400">
                <p>1. Copy the URL above</p>
                <p>2. Open the web browser on your Smart TV</p>
                <p>3. Paste the URL and press Enter</p>
                <p>4. The display will run fullscreen automatically</p>
                <p className="text-green-400 text-xs mt-2">Updates automatically when you save changes here!</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => window.open(savedLiveUrl, "_blank")}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-sm transition"
                data-testid="btn-preview-live-url"
              >
                Open Preview
              </button>
              <button
                onClick={() => setSavedLiveUrl(null)}
                className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium text-sm transition"
                data-testid="btn-close-live-url"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
