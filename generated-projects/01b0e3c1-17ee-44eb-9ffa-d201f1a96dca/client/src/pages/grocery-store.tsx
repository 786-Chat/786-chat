import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import {
  ShoppingCart, Search, Plus, Minus, Trash2, X, ChevronRight,
  ChevronLeft, CreditCard, Truck, MapPin, Phone, Mail, User,
  Store, Package, Tag, ArrowLeft, CheckCircle, Loader2, ArrowDown, ShoppingBag, Navigation, Clock, ExternalLink,
  ChevronDown, Info, AlertTriangle, Megaphone, ListChecks, Flame,
  Leaf, Apple, Calculator, Award, Thermometer, MapPin as MapPinIcon, Factory, Building2, FileText,
  UtensilsCrossed, Banknote, Sparkles, XCircle,
  Milk, Croissant, Wine, Cigarette, Wind, GlassWater, Cookie, Candy, IceCream,
  Beef, Fish, Carrot, Baby, Dog, Pill, SprayCan, Shirt, Home,
  Coffee, Egg, Droplets, Salad, Pizza, Ham, Beer,
  Cake, Cherry, Grape, Citrus, Refrigerator, Gift, Snowflake, HeartPulse, Box,
  Wheat, CookingPot, MessageCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

type Branch = {
  id: string; name: string; slug: string; country: string; currency: string;
  themeColor: string; logo: string | null; address: string | null; phone: string | null;
  deliveryCharge: string; freeDeliveryThreshold: string; discountThreshold: string; discountPercent: string;
  welcomeTitle: string | null; welcomeSubtitle: string | null; welcomeCtaText: string | null;
  welcomePostcodeEnabled: boolean | null; welcomeBackgroundType: string | null;
  welcomeBackgroundImageUrl: string | null; welcomeBackgroundVideoUrl: string | null;
  welcomeSliderImages: string[] | null; heroAnimationStyle: string | null;
  heroSlideInterval: number | null; fontFamily: string | null;
  titleFontSize: string | null; subtitleFontSize: string | null;
  primaryColor: string | null; secondaryColor: string | null; accentColor: string | null;
  categoryCardStyle: string | null; menuCardStyle: string | null;
  headerBgColor: string | null; footerText: string | null;
  vatRate: string | null; collectionDiscountPercent: string | null;
  collectionDiscountThreshold: string | null; estimatedDeliveryTime: string | null;
  cutleryPrice: string | null;
  acceptingOrders: boolean | null;
  categoryBgType: string | null;
  categoryBgColor: string | null;
  categoryBgImages: string[] | null;
  categoryBgVideo: string | null;
  categoryBgAnimation: string | null;
  categoryBgAnimationSpeed: number | null;
  productCardLayout: string | null;
  storeLanguage: string | null;
  whatsappNumber: string | null;
};
type MainCategory = { id: string; name: string; image: string | null; gif: string | null; color: string; };
type SubCategory = { id: string; name: string; image: string | null; gif: string | null; video: string | null; };
type SubSubCategory = { id: string; name: string; image: string | null; gif: string | null; video: string | null; };
type Product = { id: string; name: string; description: string | null; image1: string | null; image2: string | null; wasPrice: string | null; nowPrice: string; weight: string | null; unit: string; stockQuantity: number; isFeatured: boolean; isAvailable: boolean; calories: string | null; allergyAdvice: string | null; productMarketing: string | null; features: string | null; lifestyle: string | null; ingredients: string | null; calculatedNutrition: string | null; nutritionalClaims: string | null; storageUsage: string | null; storageConditions: string | null; storageType: string | null; country: string | null; companyName: string | null; companyAddress: string | null; manufacturer: string | null; moreInformation: string | null; nutrition: string | null; disclaimer: string | null; };
type CartItem = { product: Product; quantity: number; };

const TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    searchProducts: "Search products...", allCategories: "All Categories", viewAll: "View All",
    addToCart: "Add", inCart: "In Cart", outOfStock: "Out of Stock", viewBasket: "View Basket",
    items: "items", item: "item", cart: "Your Cart", cartEmpty: "Your cart is empty",
    subtotal: "Subtotal", delivery: "Delivery", free: "FREE", discount: "Discount",
    total: "Total", checkout: "Checkout", continueShopping: "Continue Shopping",
    orderType: "Order Type", forDelivery: "Delivery", collection: "Collection",
    yourDetails: "Your Details", fullName: "Full Name", phoneNumber: "Phone Number",
    emailAddress: "Email Address", deliveryAddress: "Delivery Address",
    city: "City", postcode: "Postcode", orderNotes: "Order Notes",
    paymentMethod: "Payment Method", cashOnDelivery: "Cash on Delivery",
    cardPayment: "Card Payment", placeOrder: "Place Order", processing: "Processing...",
    orderConfirmed: "Order Confirmed!", orderThankYou: "Thank you for your order!",
    orderNumber: "Order Number", backToStore: "Back to Store",
    categories: "Categories", products: "Products", featured: "Featured",
    shopNow: "Shop Now", deliveryInfo: "Delivery Info", freeDeliveryOver: "Free delivery over",
    spendMore: "Spend {amount} more for free delivery",
    discountApplied: "{percent}% discount applied!",
    spendMoreDiscount: "Spend {amount} more to get {percent}% off",
    storeClosed: "This store is currently not accepting orders",
    per: "per", each: "each", details: "Details", nutrition: "Nutrition",
    ingredients: "Ingredients", allergyAdvice: "Allergy Advice", storageInfo: "Storage Info",
    calories: "Calories", weight: "Weight", barcode: "Barcode",
    whatsappOrder: "Message us on WhatsApp", close: "Close",
    payWithCash: "Pay with Cash", payWithCard: "Pay with Card",
    bankTransfer: "Bank Transfer", jazzcash: "JazzCash", easypaisa: "Easypaisa",
    orderSummary: "Order Summary", qty: "Qty",
    subCategories: "Sub Categories", back: "Back",
    noProductsFound: "No products found", clearSearch: "Clear search",
    off: "OFF", save: "Save", bestSeller: "Best Seller",
    estimatedDelivery: "Estimated Delivery", minutes: "minutes",
    vat: "VAT", includingVat: "Including VAT",
  },
  ur: {
    searchProducts: "مصنوعات تلاش کریں...", allCategories: "تمام زمرے", viewAll: "سب دیکھیں",
    addToCart: "شامل کریں", inCart: "ٹوکری میں", outOfStock: "دستیاب نہیں", viewBasket: "ٹوکری دیکھیں",
    items: "اشیاء", item: "شے", cart: "آپ کی ٹوکری", cartEmpty: "آپ کی ٹوکری خالی ہے",
    subtotal: "ذیلی کل", delivery: "ترسیل", free: "مفت", discount: "رعایت",
    total: "کل", checkout: "چیک آؤٹ", continueShopping: "خریداری جاری رکھیں",
    orderType: "آرڈر کی قسم", forDelivery: "ترسیل", collection: "خود لے جائیں",
    yourDetails: "آپ کی تفصیلات", fullName: "پورا نام", phoneNumber: "فون نمبر",
    emailAddress: "ای میل", deliveryAddress: "ترسیل کا پتہ",
    city: "شہر", postcode: "پوسٹ کوڈ", orderNotes: "آرڈر نوٹس",
    paymentMethod: "ادائیگی کا طریقہ", cashOnDelivery: "کیش آن ڈلیوری",
    cardPayment: "کارڈ سے ادائیگی", placeOrder: "آرڈر کریں", processing: "عمل جاری ہے...",
    orderConfirmed: "آرڈر کی تصدیق!", orderThankYou: "آپ کے آرڈر کا شکریہ!",
    orderNumber: "آرڈر نمبر", backToStore: "واپس دکان پر",
    categories: "زمرے", products: "مصنوعات", featured: "نمایاں",
    shopNow: "ابھی خریدیں", deliveryInfo: "ترسیل کی معلومات", freeDeliveryOver: "مفت ترسیل",
    spendMore: "مفت ترسیل کے لیے مزید {amount} خریدیں",
    discountApplied: "{percent}% رعایت لاگو!",
    spendMoreDiscount: "{percent}% رعایت کے لیے مزید {amount} خریدیں",
    storeClosed: "یہ دکان فی الحال آرڈر قبول نہیں کر رہی",
    per: "فی", each: "ہر ایک", details: "تفصیلات", nutrition: "غذائیت",
    ingredients: "اجزاء", allergyAdvice: "الرجی مشورہ", storageInfo: "ذخیرہ معلومات",
    calories: "کیلوریز", weight: "وزن", barcode: "بارکوڈ",
    whatsappOrder: "واٹس ایپ پر پیغام بھیجیں", close: "بند",
    payWithCash: "نقد ادائیگی", payWithCard: "کارڈ سے ادائیگی",
    bankTransfer: "بینک ٹرانسفر", jazzcash: "جاز کیش", easypaisa: "ایزی پیسہ",
    orderSummary: "آرڈر کا خلاصہ", qty: "مقدار",
    subCategories: "ذیلی زمرے", back: "واپس",
    noProductsFound: "کوئی مصنوعات نہیں ملیں", clearSearch: "تلاش صاف کریں",
    off: "چھوٹ", save: "بچائیں", bestSeller: "بہترین فروخت",
    estimatedDelivery: "تخمینی ترسیل", minutes: "منٹ",
    vat: "ٹیکس", includingVat: "ٹیکس شامل",
  },
  ar: {
    searchProducts: "ابحث عن المنتجات...", allCategories: "جميع الفئات", viewAll: "عرض الكل",
    addToCart: "أضف", inCart: "في السلة", outOfStock: "غير متوفر", viewBasket: "عرض السلة",
    items: "عناصر", item: "عنصر", cart: "سلتك", cartEmpty: "سلتك فارغة",
    subtotal: "المجموع الفرعي", delivery: "التوصيل", free: "مجاني", discount: "خصم",
    total: "الإجمالي", checkout: "الدفع", continueShopping: "متابعة التسوق",
    orderType: "نوع الطلب", forDelivery: "توصيل", collection: "استلام",
    yourDetails: "بياناتك", fullName: "الاسم الكامل", phoneNumber: "رقم الهاتف",
    emailAddress: "البريد الإلكتروني", deliveryAddress: "عنوان التوصيل",
    city: "المدينة", postcode: "الرمز البريدي", orderNotes: "ملاحظات الطلب",
    paymentMethod: "طريقة الدفع", cashOnDelivery: "الدفع عند الاستلام",
    cardPayment: "الدفع بالبطاقة", placeOrder: "تأكيد الطلب", processing: "جاري المعالجة...",
    orderConfirmed: "تم تأكيد الطلب!", orderThankYou: "شكراً لطلبك!",
    orderNumber: "رقم الطلب", backToStore: "العودة للمتجر",
    categories: "الفئات", products: "المنتجات", featured: "مميز",
    shopNow: "تسوق الآن", deliveryInfo: "معلومات التوصيل", freeDeliveryOver: "توصيل مجاني فوق",
    spendMore: "أنفق {amount} إضافية للتوصيل المجاني",
    discountApplied: "خصم {percent}% مطبق!",
    spendMoreDiscount: "أنفق {amount} للحصول على خصم {percent}%",
    storeClosed: "هذا المتجر لا يقبل الطلبات حالياً",
    per: "لكل", each: "كل", details: "التفاصيل", nutrition: "التغذية",
    ingredients: "المكونات", allergyAdvice: "نصائح الحساسية", storageInfo: "معلومات التخزين",
    calories: "السعرات", weight: "الوزن", barcode: "الباركود",
    whatsappOrder: "راسلنا على واتساب", close: "إغلاق",
    payWithCash: "الدفع نقداً", payWithCard: "الدفع بالبطاقة",
    bankTransfer: "تحويل بنكي", jazzcash: "جاز كاش", easypaisa: "إيزي بايسا",
    orderSummary: "ملخص الطلب", qty: "الكمية",
    subCategories: "فئات فرعية", back: "رجوع",
    noProductsFound: "لم يتم العثور على منتجات", clearSearch: "مسح البحث",
    off: "خصم", save: "وفر", bestSeller: "الأكثر مبيعاً",
    estimatedDelivery: "التوصيل المتوقع", minutes: "دقائق",
    vat: "ضريبة", includingVat: "شامل الضريبة",
  },
  hi: {
    searchProducts: "उत्पाद खोजें...", allCategories: "सभी श्रेणियाँ", viewAll: "सब देखें",
    addToCart: "जोड़ें", inCart: "कार्ट में", outOfStock: "उपलब्ध नहीं", viewBasket: "बास्केट देखें",
    items: "आइटम", item: "आइटम", cart: "आपकी कार्ट", cartEmpty: "आपकी कार्ट खाली है",
    subtotal: "उप-कुल", delivery: "डिलीवरी", free: "मुफ़्त", discount: "छूट",
    total: "कुल", checkout: "चेकआउट", continueShopping: "खरीदारी जारी रखें",
    orderType: "ऑर्डर प्रकार", forDelivery: "डिलीवरी", collection: "स्वयं ले जाएं",
    yourDetails: "आपकी जानकारी", fullName: "पूरा नाम", phoneNumber: "फ़ोन नंबर",
    emailAddress: "ईमेल", deliveryAddress: "डिलीवरी पता",
    city: "शहर", postcode: "पिन कोड", orderNotes: "ऑर्डर नोट्स",
    paymentMethod: "भुगतान विधि", cashOnDelivery: "कैश ऑन डिलीवरी",
    cardPayment: "कार्ड से भुगतान", placeOrder: "ऑर्डर करें", processing: "प्रोसेसिंग...",
    orderConfirmed: "ऑर्डर की पुष्टि!", orderThankYou: "ऑर्डर के लिए धन्यवाद!",
    orderNumber: "ऑर्डर नंबर", backToStore: "दुकान पर वापस",
    categories: "श्रेणियाँ", products: "उत्पाद", featured: "विशेष",
    shopNow: "अभी खरीदें", deliveryInfo: "डिलीवरी जानकारी", freeDeliveryOver: "मुफ़्त डिलीवरी",
    spendMore: "मुफ़्त डिलीवरी के लिए {amount} और खर्च करें",
    discountApplied: "{percent}% छूट लागू!",
    spendMoreDiscount: "{percent}% छूट पाने के लिए {amount} और खर्च करें",
    storeClosed: "यह दुकान अभी ऑर्डर स्वीकार नहीं कर रही",
    per: "प्रति", each: "प्रत्येक", details: "विवरण", nutrition: "पोषण",
    ingredients: "सामग्री", allergyAdvice: "एलर्जी सलाह", storageInfo: "भंडारण जानकारी",
    calories: "कैलोरी", weight: "वजन", barcode: "बारकोड",
    whatsappOrder: "व्हाट्सएप पर मैसेज करें", close: "बंद",
    payWithCash: "नकद भुगतान", payWithCard: "कार्ड से भुगतान",
    bankTransfer: "बैंक ट्रांसफर", jazzcash: "जैज़कैश", easypaisa: "ईज़ीपैसा",
    orderSummary: "ऑर्डर सारांश", qty: "मात्रा",
    subCategories: "उप श्रेणियाँ", back: "वापस",
    noProductsFound: "कोई उत्पाद नहीं मिला", clearSearch: "खोज साफ करें",
    off: "छूट", save: "बचाएं", bestSeller: "बेस्ट सेलर",
    estimatedDelivery: "अनुमानित डिलीवरी", minutes: "मिनट",
    vat: "टैक्स", includingVat: "टैक्स सहित",
  },
  bn: {
    searchProducts: "পণ্য খুঁজুন...", allCategories: "সব বিভাগ", viewAll: "সব দেখুন",
    addToCart: "যোগ করুন", inCart: "কার্টে আছে", outOfStock: "স্টক নেই", viewBasket: "বাস্কেট দেখুন",
    items: "আইটেম", item: "আইটেম", cart: "আপনার কার্ট", cartEmpty: "আপনার কার্ট খালি",
    subtotal: "সাবটোটাল", delivery: "ডেলিভারি", free: "ফ্রি", discount: "ছাড়",
    total: "মোট", checkout: "চেকআউট", continueShopping: "কেনাকাটা চালিয়ে যান",
    placeOrder: "অর্ডার করুন", processing: "প্রসেসিং...",
    orderConfirmed: "অর্ডার নিশ্চিত!", orderThankYou: "আপনার অর্ডারের জন্য ধন্যবাদ!",
    orderNumber: "অর্ডার নম্বর", backToStore: "দোকানে ফিরুন",
    orderType: "অর্ডারের ধরন", forDelivery: "ডেলিভারি", collection: "নিজে নিন",
    yourDetails: "আপনার তথ্য", fullName: "পুরো নাম", phoneNumber: "ফোন নম্বর",
    emailAddress: "ইমেইল", deliveryAddress: "ডেলিভারি ঠিকানা",
    city: "শহর", postcode: "পোস্ট কোড", orderNotes: "অর্ডার নোটস",
    paymentMethod: "পেমেন্ট পদ্ধতি", cashOnDelivery: "ক্যাশ অন ডেলিভারি",
    cardPayment: "কার্ড পেমেন্ট", categories: "বিভাগ", products: "পণ্য",
    shopNow: "এখনই কিনুন", close: "বন্ধ", back: "পিছনে",
    noProductsFound: "কোন পণ্য পাওয়া যায়নি", clearSearch: "সার্চ মুছুন",
    storeClosed: "এই দোকান বর্তমানে অর্ডার নিচ্ছে না",
    featured: "বিশেষ", off: "ছাড়", details: "বিস্তারিত",
    whatsappOrder: "হোয়াটসঅ্যাপে মেসেজ করুন", orderSummary: "অর্ডার সারাংশ", qty: "পরিমাণ",
    deliveryInfo: "ডেলিভারি তথ্য", freeDeliveryOver: "ফ্রি ডেলিভারি",
    spendMore: "ফ্রি ডেলিভারির জন্য আরও {amount} খরচ করুন",
    discountApplied: "{percent}% ছাড় প্রযোজ্য!", spendMoreDiscount: "{percent}% ছাড়ের জন্য আরও {amount} খরচ করুন",
    per: "প্রতি", each: "প্রতিটি", nutrition: "পুষ্টি", ingredients: "উপকরণ",
    allergyAdvice: "অ্যালার্জি পরামর্শ", storageInfo: "স্টোরেজ তথ্য",
    calories: "ক্যালোরি", weight: "ওজন", barcode: "বারকোড",
    payWithCash: "নগদ পেমেন্ট", payWithCard: "কার্ড পেমেন্ট",
    bankTransfer: "ব্যাংক ট্রান্সফার", jazzcash: "জ্যাজক্যাশ", easypaisa: "ইজিপেসা",
    subCategories: "উপ বিভাগ", save: "সংরক্ষণ", bestSeller: "বেস্ট সেলার",
    estimatedDelivery: "আনুমানিক ডেলিভারি", minutes: "মিনিট",
    vat: "ট্যাক্স", includingVat: "ট্যাক্স সহ",
  },
  tr: {
    searchProducts: "Ürün ara...", allCategories: "Tüm Kategoriler", viewAll: "Tümünü Gör",
    addToCart: "Ekle", inCart: "Sepette", outOfStock: "Stokta Yok", viewBasket: "Sepeti Gör",
    items: "ürün", item: "ürün", cart: "Sepetiniz", cartEmpty: "Sepetiniz boş",
    subtotal: "Ara Toplam", delivery: "Teslimat", free: "ÜCRETSİZ", discount: "İndirim",
    total: "Toplam", checkout: "Ödeme", continueShopping: "Alışverişe Devam",
    placeOrder: "Sipariş Ver", processing: "İşleniyor...",
    orderConfirmed: "Sipariş Onaylandı!", orderThankYou: "Siparişiniz için teşekkürler!",
    orderNumber: "Sipariş No", backToStore: "Mağazaya Dön",
    orderType: "Sipariş Türü", forDelivery: "Teslimat", collection: "Gel Al",
    yourDetails: "Bilgileriniz", fullName: "Ad Soyad", phoneNumber: "Telefon",
    emailAddress: "E-posta", deliveryAddress: "Teslimat Adresi",
    city: "Şehir", postcode: "Posta Kodu", orderNotes: "Sipariş Notları",
    paymentMethod: "Ödeme Yöntemi", cashOnDelivery: "Kapıda Ödeme",
    cardPayment: "Kart ile Ödeme", categories: "Kategoriler", products: "Ürünler",
    shopNow: "Alışverişe Başla", close: "Kapat", back: "Geri",
    noProductsFound: "Ürün bulunamadı", clearSearch: "Aramayı temizle",
    storeClosed: "Bu mağaza şu anda sipariş almıyor",
    featured: "Öne Çıkan", off: "İNDİRİM", details: "Detaylar",
    whatsappOrder: "WhatsApp'tan mesaj at", orderSummary: "Sipariş Özeti", qty: "Adet",
    deliveryInfo: "Teslimat Bilgisi", freeDeliveryOver: "Ücretsiz teslimat",
    spendMore: "Ücretsiz teslimat için {amount} daha harcayın",
    discountApplied: "%{percent} indirim uygulandı!", spendMoreDiscount: "%{percent} indirim için {amount} daha harcayın",
    per: "her", each: "adet", nutrition: "Besin", ingredients: "İçerikler",
    allergyAdvice: "Alerji Bilgisi", storageInfo: "Saklama Bilgisi",
    calories: "Kalori", weight: "Ağırlık", barcode: "Barkod",
    payWithCash: "Nakit Ödeme", payWithCard: "Kart ile Ödeme",
    bankTransfer: "Banka Havalesi", jazzcash: "JazzCash", easypaisa: "Easypaisa",
    subCategories: "Alt Kategoriler", save: "Kaydet", bestSeller: "Çok Satan",
    estimatedDelivery: "Tahmini Teslimat", minutes: "dakika",
    vat: "KDV", includingVat: "KDV Dahil",
  },
  fr: {
    searchProducts: "Rechercher...", allCategories: "Toutes les catégories", viewAll: "Voir tout",
    addToCart: "Ajouter", inCart: "Dans le panier", outOfStock: "Rupture", viewBasket: "Voir le panier",
    items: "articles", item: "article", cart: "Votre panier", cartEmpty: "Votre panier est vide",
    subtotal: "Sous-total", delivery: "Livraison", free: "GRATUIT", discount: "Réduction",
    total: "Total", checkout: "Payer", continueShopping: "Continuer les achats",
    placeOrder: "Commander", processing: "Traitement...",
    orderConfirmed: "Commande confirmée!", orderThankYou: "Merci pour votre commande!",
    orderNumber: "N° de commande", backToStore: "Retour au magasin",
    orderType: "Type de commande", forDelivery: "Livraison", collection: "À emporter",
    yourDetails: "Vos coordonnées", fullName: "Nom complet", phoneNumber: "Téléphone",
    emailAddress: "Email", deliveryAddress: "Adresse de livraison",
    city: "Ville", postcode: "Code postal", orderNotes: "Notes",
    paymentMethod: "Mode de paiement", cashOnDelivery: "Paiement à la livraison",
    cardPayment: "Paiement par carte", categories: "Catégories", products: "Produits",
    shopNow: "Acheter", close: "Fermer", back: "Retour",
    noProductsFound: "Aucun produit trouvé", clearSearch: "Effacer la recherche",
    storeClosed: "Ce magasin n'accepte pas de commandes",
    featured: "En vedette", off: "REMISE", details: "Détails",
    whatsappOrder: "Nous contacter sur WhatsApp", orderSummary: "Résumé", qty: "Qté",
    deliveryInfo: "Info livraison", freeDeliveryOver: "Livraison gratuite dès",
    spendMore: "Dépensez {amount} de plus pour la livraison gratuite",
    discountApplied: "Réduction de {percent}% appliquée!", spendMoreDiscount: "Dépensez {amount} de plus pour {percent}% de réduction",
    per: "par", each: "chaque", nutrition: "Nutrition", ingredients: "Ingrédients",
    allergyAdvice: "Allergènes", storageInfo: "Conservation",
    calories: "Calories", weight: "Poids", barcode: "Code-barres",
    payWithCash: "Payer en espèces", payWithCard: "Payer par carte",
    bankTransfer: "Virement bancaire", jazzcash: "JazzCash", easypaisa: "Easypaisa",
    subCategories: "Sous-catégories", save: "Économiser", bestSeller: "Meilleure vente",
    estimatedDelivery: "Livraison estimée", minutes: "minutes",
    vat: "TVA", includingVat: "TTC",
  },
  es: {
    searchProducts: "Buscar productos...", allCategories: "Todas las categorías", viewAll: "Ver todo",
    addToCart: "Agregar", inCart: "En carrito", outOfStock: "Agotado", viewBasket: "Ver carrito",
    items: "artículos", item: "artículo", cart: "Tu carrito", cartEmpty: "Tu carrito está vacío",
    subtotal: "Subtotal", delivery: "Envío", free: "GRATIS", discount: "Descuento",
    total: "Total", checkout: "Pagar", continueShopping: "Seguir comprando",
    placeOrder: "Hacer pedido", processing: "Procesando...",
    orderConfirmed: "¡Pedido confirmado!", orderThankYou: "¡Gracias por tu pedido!",
    orderNumber: "N° de pedido", backToStore: "Volver a la tienda",
    orderType: "Tipo de pedido", forDelivery: "Envío", collection: "Recoger",
    yourDetails: "Tus datos", fullName: "Nombre completo", phoneNumber: "Teléfono",
    emailAddress: "Correo", deliveryAddress: "Dirección de envío",
    city: "Ciudad", postcode: "Código postal", orderNotes: "Notas",
    paymentMethod: "Método de pago", cashOnDelivery: "Pago contra entrega",
    cardPayment: "Pago con tarjeta", categories: "Categorías", products: "Productos",
    shopNow: "Comprar", close: "Cerrar", back: "Volver",
    noProductsFound: "No se encontraron productos", clearSearch: "Borrar búsqueda",
    storeClosed: "Esta tienda no acepta pedidos actualmente",
    featured: "Destacado", off: "DESC.", details: "Detalles",
    whatsappOrder: "Escríbenos por WhatsApp", orderSummary: "Resumen", qty: "Cant.",
    deliveryInfo: "Info de envío", freeDeliveryOver: "Envío gratis desde",
    spendMore: "Gasta {amount} más para envío gratis",
    discountApplied: "¡{percent}% de descuento aplicado!", spendMoreDiscount: "Gasta {amount} más para {percent}% de descuento",
    per: "por", each: "cada", nutrition: "Nutrición", ingredients: "Ingredientes",
    allergyAdvice: "Alérgenos", storageInfo: "Conservación",
    calories: "Calorías", weight: "Peso", barcode: "Código de barras",
    payWithCash: "Pagar en efectivo", payWithCard: "Pagar con tarjeta",
    bankTransfer: "Transferencia bancaria", jazzcash: "JazzCash", easypaisa: "Easypaisa",
    subCategories: "Subcategorías", save: "Ahorra", bestSeller: "Más vendido",
    estimatedDelivery: "Entrega estimada", minutes: "minutos",
    vat: "IVA", includingVat: "IVA incluido",
  },
  de: {
    searchProducts: "Produkte suchen...", allCategories: "Alle Kategorien", viewAll: "Alle anzeigen",
    addToCart: "Hinzufügen", inCart: "Im Warenkorb", outOfStock: "Ausverkauft", viewBasket: "Warenkorb",
    items: "Artikel", item: "Artikel", cart: "Ihr Warenkorb", cartEmpty: "Ihr Warenkorb ist leer",
    subtotal: "Zwischensumme", delivery: "Lieferung", free: "KOSTENLOS", discount: "Rabatt",
    total: "Gesamt", checkout: "Zur Kasse", continueShopping: "Weiter einkaufen",
    placeOrder: "Bestellen", processing: "Verarbeitung...",
    orderConfirmed: "Bestellung bestätigt!", orderThankYou: "Danke für Ihre Bestellung!",
    orderNumber: "Bestellnr.", backToStore: "Zurück zum Shop",
    orderType: "Bestellart", forDelivery: "Lieferung", collection: "Abholung",
    yourDetails: "Ihre Daten", fullName: "Vollständiger Name", phoneNumber: "Telefon",
    emailAddress: "E-Mail", deliveryAddress: "Lieferadresse",
    city: "Stadt", postcode: "PLZ", orderNotes: "Bestellnotizen",
    paymentMethod: "Zahlungsmethode", cashOnDelivery: "Nachnahme",
    cardPayment: "Kartenzahlung", categories: "Kategorien", products: "Produkte",
    shopNow: "Jetzt einkaufen", close: "Schließen", back: "Zurück",
    noProductsFound: "Keine Produkte gefunden", clearSearch: "Suche löschen",
    storeClosed: "Dieser Shop nimmt derzeit keine Bestellungen an",
    featured: "Empfohlen", off: "RABATT", details: "Details",
    whatsappOrder: "Uns auf WhatsApp schreiben", orderSummary: "Zusammenfassung", qty: "Menge",
    deliveryInfo: "Lieferinfo", freeDeliveryOver: "Kostenlose Lieferung ab",
    spendMore: "Noch {amount} für kostenlose Lieferung",
    discountApplied: "{percent}% Rabatt angewendet!", spendMoreDiscount: "Noch {amount} für {percent}% Rabatt",
    per: "pro", each: "je", nutrition: "Nährwerte", ingredients: "Zutaten",
    allergyAdvice: "Allergiehinweis", storageInfo: "Lagerung",
    calories: "Kalorien", weight: "Gewicht", barcode: "Barcode",
    payWithCash: "Barzahlung", payWithCard: "Kartenzahlung",
    bankTransfer: "Banküberweisung", jazzcash: "JazzCash", easypaisa: "Easypaisa",
    subCategories: "Unterkategorien", save: "Sparen", bestSeller: "Bestseller",
    estimatedDelivery: "Geschätzte Lieferung", minutes: "Minuten",
    vat: "MwSt.", includingVat: "inkl. MwSt.",
  },
  zh: {
    searchProducts: "搜索产品...", allCategories: "所有分类", viewAll: "查看全部",
    addToCart: "添加", inCart: "已加入", outOfStock: "缺货", viewBasket: "查看购物车",
    items: "件商品", item: "件商品", cart: "您的购物车", cartEmpty: "购物车为空",
    subtotal: "小计", delivery: "配送", free: "免费", discount: "折扣",
    total: "合计", checkout: "结账", continueShopping: "继续购物",
    placeOrder: "下单", processing: "处理中...",
    orderConfirmed: "订单已确认!", orderThankYou: "感谢您的订单!",
    orderNumber: "订单号", backToStore: "返回商店",
    orderType: "订单类型", forDelivery: "配送", collection: "自取",
    yourDetails: "您的信息", fullName: "姓名", phoneNumber: "电话",
    emailAddress: "邮箱", deliveryAddress: "配送地址",
    city: "城市", postcode: "邮编", orderNotes: "备注",
    paymentMethod: "支付方式", cashOnDelivery: "货到付款",
    cardPayment: "银行卡支付", categories: "分类", products: "产品",
    shopNow: "立即购买", close: "关闭", back: "返回",
    noProductsFound: "未找到产品", clearSearch: "清除搜索",
    storeClosed: "该店铺暂不接受订单",
    featured: "精选", off: "折扣", details: "详情",
    whatsappOrder: "WhatsApp联系我们", orderSummary: "订单摘要", qty: "数量",
    deliveryInfo: "配送信息", freeDeliveryOver: "满额免运费",
    spendMore: "再消费{amount}即可免运费",
    discountApplied: "已享{percent}%折扣!", spendMoreDiscount: "再消费{amount}享{percent}%折扣",
    per: "每", each: "每个", nutrition: "营养", ingredients: "成分",
    allergyAdvice: "过敏提示", storageInfo: "存储信息",
    calories: "卡路里", weight: "重量", barcode: "条码",
    payWithCash: "现金支付", payWithCard: "刷卡支付",
    bankTransfer: "银行转账", jazzcash: "JazzCash", easypaisa: "Easypaisa",
    subCategories: "子分类", save: "节省", bestSeller: "畅销",
    estimatedDelivery: "预计配送", minutes: "分钟",
    vat: "税", includingVat: "含税",
  },
};

const RTL_LANGUAGES = ["ur", "ar"];

function useTranslations(lang: string | null | undefined) {
  const language = lang || "en";
  const translations = TRANSLATIONS[language] || TRANSLATIONS.en;
  const isRtl = RTL_LANGUAGES.includes(language);
  const t = (key: string, replacements?: Record<string, string>) => {
    let text = translations[key] || TRANSLATIONS.en[key] || key;
    if (replacements) {
      Object.entries(replacements).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, v);
      });
    }
    return text;
  };
  return { t, isRtl, language };
}

function apiCall(url: string, method = "GET", body?: any) {
  return fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  }).then(r => r.json());
}

let stripePromise: Promise<Stripe | null> | null = null;
function getStripe() {
  if (!stripePromise) {
    stripePromise = fetch("/api/grocery/stripe-key")
      .then(r => r.json())
      .then(({ publishableKey }) => publishableKey ? loadStripe(publishableKey) : null);
  }
  return stripePromise;
}

function CheckoutForm({ orderId, total, currency, onSuccess }: { orderId: string; total: string; currency: string; onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError("");

    const result = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (result.error) {
      setError(result.error.message || "Payment failed");
      setLoading(false);
    } else if (result.paymentIntent?.status === "succeeded") {
      await apiCall("/api/grocery/confirm-payment", "POST", { orderId, paymentIntentId: result.paymentIntent.id });
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <Button type="submit" disabled={!stripe || loading} className="w-full h-12 text-lg font-bold gap-2" data-testid="button-pay-now">
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <CreditCard className="h-5 w-5" />}
        {loading ? "Processing..." : `Pay ${currency}${total}`}
      </Button>
    </form>
  );
}

function WelcomeHero({ branch, onEnterStore }: { branch: Branch; onEnterStore: () => void }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const sliderImages = (branch.welcomeSliderImages as string[] || []).filter(Boolean);
  const slideInterval = branch.heroSlideInterval || 5000;
  const animStyle = branch.heroAnimationStyle || "slide";
  const titleText = branch.welcomeTitle || "Fresh Groceries\nDelivered to You";
  const subtitleText = branch.welcomeSubtitle || "Quality products at your doorstep";
  const ctaText = branch.welcomeCtaText || "Start Shopping";
  const primaryCol = branch.primaryColor || "#00bcd4";
  const secondaryCol = branch.secondaryColor || "#ffffff";
  const accentCol = branch.accentColor || "#ff9800";
  const fontFam = branch.fontFamily || "Inter";
  const titleSize = branch.titleFontSize || "3.5rem";
  const subtitleSize = branch.subtitleFontSize || "1.2rem";
  const bgType = branch.welcomeBackgroundType || "gradient";

  useEffect(() => {
    setTimeout(() => setLoaded(true), 100);
  }, []);

  useEffect(() => {
    if (sliderImages.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % sliderImages.length);
    }, slideInterval);
    return () => clearInterval(timer);
  }, [sliderImages.length, slideInterval]);

  const getAnimationClass = () => {
    if (!loaded) return "opacity-0 translate-y-8";
    switch (animStyle) {
      case "fade": return "animate-[fadeIn_1s_ease-in-out]";
      case "zoom": return "animate-[zoomIn_0.8s_ease-out]";
      case "bounce": return "animate-[bounceIn_1s_ease-out]";
      default: return "animate-[slideUp_0.8s_ease-out]";
    }
  };

  const hasMediaBg = (bgType === "video" && branch.welcomeBackgroundVideoUrl) ||
    (bgType === "image" && branch.welcomeBackgroundImageUrl) ||
    (bgType === "slider" && sliderImages.length > 0);

  const isMartWelcome = branch.productCardLayout === "mart";

  const renderBackground = () => {
    if (isMartWelcome && bgType === "gradient") {
      return (
        <div className="absolute inset-0">
          <div className="absolute inset-0" style={{ background: "#991b1b" }} />
          <div className="absolute top-0 right-0 w-[55%] h-full" style={{
            background: `linear-gradient(160deg, #fbbf24 0%, #f59e0b 60%, #d97706 100%)`,
            clipPath: "polygon(25% 0, 100% 0, 100% 100%, 0% 100%)",
          }} />
          <div className="absolute bottom-0 right-0 w-[40%] h-[45%]" style={{
            background: `linear-gradient(145deg, #fef3c7 0%, #fef9e7 100%)`,
            clipPath: "polygon(30% 0, 100% 0, 100% 100%, 0% 100%)",
          }} />
          <div className="absolute inset-0" style={{
            background: `radial-gradient(ellipse at 15% 50%, rgba(153,27,27,0.6) 0%, transparent 45%), radial-gradient(ellipse at 70% 30%, rgba(251,191,36,0.15) 0%, transparent 40%)`,
          }} />
          <div className="absolute top-0 left-0 w-full h-full opacity-[0.03]" style={{
            backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 30px, rgba(255,255,255,0.5) 30px, rgba(255,255,255,0.5) 31px)`,
          }} />
        </div>
      );
    }
    if (bgType === "video" && branch.welcomeBackgroundVideoUrl) {
      return (
        <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover" src={branch.welcomeBackgroundVideoUrl} />
      );
    }
    if (bgType === "image" && branch.welcomeBackgroundImageUrl) {
      return (
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${branch.welcomeBackgroundImageUrl})` }} />
      );
    }
    if (bgType === "slider" && sliderImages.length > 0) {
      return (
        <>
          {sliderImages.map((img, i) => (
            <div key={i} className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000" style={{ backgroundImage: `url(${img})`, opacity: currentSlide === i ? 1 : 0 }} />
          ))}
        </>
      );
    }
    return (
      <div className="absolute inset-0" style={{ background: `linear-gradient(160deg, ${primaryCol} 0%, ${primaryCol}cc 30%, ${accentCol}40 70%, ${primaryCol}90 100%)` }} />
    );
  };

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden" style={{ fontFamily: fontFam }}>
      {renderBackground()}
      <div className="absolute inset-0" style={{ background: hasMediaBg ? "rgba(0,0,0,0.45)" : "rgba(0,0,0,0.15)" }} />

      <div className="relative z-20 pt-5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {branch.logo ? (
              <img src={branch.logo} alt="" className="h-11 w-11 rounded-2xl object-cover shadow-lg ring-2 ring-white/20" />
            ) : (
              <div className="h-11 w-11 rounded-2xl flex items-center justify-center shadow-lg ring-2 ring-white/20" style={{ background: `${primaryCol}` }}>
                <Store className="h-5 w-5 text-white" />
              </div>
            )}
            <span className="text-xl sm:text-2xl font-extrabold text-white tracking-tight drop-shadow-lg" data-testid="text-welcome-brand">
              {branch.name}
            </span>
          </div>
          <div className="flex items-center gap-2">
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center relative z-10 px-6 py-6">
        <div className={`text-center max-w-2xl mx-auto transition-all duration-700 ${getAnimationClass()}`}>
          {branch.logo && (
            <div className="mb-4 sm:mb-6 flex justify-center">
              <img src={branch.logo} alt="" className="h-16 w-16 sm:h-20 sm:w-20 rounded-3xl object-cover shadow-2xl ring-4 ring-white/10" />
            </div>
          )}
          <h1 className="font-extrabold leading-[1.1] mb-3 sm:mb-5 whitespace-pre-line text-white drop-shadow-2xl text-3xl sm:text-[3.5rem]" style={{ fontFamily: fontFam }} data-testid="text-welcome-title">
            {titleText}
          </h1>
          <p className="text-white/80 mb-6 sm:mb-10 font-medium max-w-lg mx-auto leading-relaxed text-base sm:text-lg" style={{ fontFamily: fontFam }} data-testid="text-welcome-subtitle">
            {subtitleText}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={onEnterStore} className="group relative h-14 sm:h-16 px-8 sm:px-12 text-base sm:text-lg font-extrabold rounded-2xl shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-3xl flex items-center gap-3 overflow-hidden" style={{ backgroundColor: primaryCol, color: secondaryCol }} data-testid="button-enter-store">
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6 relative z-10" />
              <span className="relative z-10">{ctaText}</span>
              <ChevronRight className="h-5 w-5 relative z-10 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {branch.address && (
        <div className="relative z-10 w-full max-w-md mx-auto px-4 pb-4 sm:pb-6" style={{ animation: "slideUp 0.8s ease 0.5s both" }}>
          <div className="rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl" style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.18)" }} data-testid="card-map-location">
            <div className="relative h-28 sm:h-36 w-full overflow-hidden bg-gray-800">
              <iframe
                src={`https://maps.google.com/maps?q=${encodeURIComponent(branch.address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                className="w-full h-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Store Location"
                allowFullScreen
              />
            </div>
            <div className="px-4 py-3 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${primaryCol}30` }}>
                <MapPin className="h-5 w-5" style={{ color: primaryCol }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm truncate">{branch.name}</p>
                <p className="text-white/50 text-xs truncate">{branch.address}</p>
                {branch.phone && (
                  <a href={`tel:${branch.phone}`} className="text-white/60 text-xs flex items-center gap-1 mt-1 hover:text-white/80 transition-colors">
                    <Phone className="h-3 w-3" /> {branch.phone}
                  </a>
                )}
              </div>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(branch.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 hover:scale-110 transition-transform"
                style={{ background: primaryCol }}
                data-testid="button-get-directions"
              >
                <Navigation className="h-4 w-4 text-white" />
              </a>
            </div>
          </div>
        </div>
      )}

      {!branch.address && (
        <div className="relative z-10 flex justify-center pb-8">
          <button onClick={onEnterStore} className="p-3 rounded-full backdrop-blur-md shadow-lg animate-bounce hover:bg-white/30 transition-all" style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)" }} data-testid="button-scroll-down">
            <ArrowDown className="h-5 w-5 text-white" />
          </button>
        </div>
      )}

      {sliderImages.length > 1 && bgType === "slider" && (
        <div className="relative z-10 flex justify-center gap-2 pb-4">
          {sliderImages.map((_, i) => (
            <button key={i} onClick={() => setCurrentSlide(i)} className={`w-2.5 h-2.5 rounded-full transition-all ${currentSlide === i ? "scale-125 bg-white" : "bg-white/40"}`} />
          ))}
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/30 to-transparent z-[1]" />

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes zoomIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes bounceIn {
          0% { opacity: 0; transform: scale(0.3); }
          50% { transform: scale(1.05); }
          70% { transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

function CategoryBgSlider({ images, animation, speed }: { images: string[]; animation: string; speed: number }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIdx(prev => (prev + 1) % images.length);
      setAnimKey(prev => prev + 1);
    }, speed);
    return () => clearInterval(interval);
  }, [images.length, speed]);

  const getAnimStyle = (isActive: boolean): React.CSSProperties => {
    if (!isActive) return { opacity: 0, position: "absolute", inset: 0 };
    const base: React.CSSProperties = { position: "absolute", inset: 0, opacity: 1, zIndex: 0 };
    switch (animation) {
      case "slide-left": return { ...base, animation: `catSlideLeft ${speed * 0.15}ms ease-out` };
      case "slide-right": return { ...base, animation: `catSlideRight ${speed * 0.15}ms ease-out` };
      case "slide-down": return { ...base, animation: `catSlideDown ${speed * 0.15}ms ease-out` };
      case "slide-up": return { ...base, animation: `catSlideUp ${speed * 0.15}ms ease-out` };
      case "fade": return { ...base, animation: `catFade ${speed * 0.2}ms ease-out` };
      case "zoom": return { ...base, animation: `catZoom ${speed * 0.2}ms ease-out` };
      case "flip": return { ...base, animation: `catFlip ${speed * 0.15}ms ease-out` };
      case "rotate-corner": return { ...base, animation: `catRotateCorner ${speed * 0.15}ms ease-out` };
      case "blinds": return { ...base, animation: `catBlinds ${speed * 0.15}ms ease-out` };
      case "swirl": return { ...base, animation: `catSwirl ${speed * 0.2}ms ease-out` };
      default: return { ...base, animation: `catFade ${speed * 0.2}ms ease-out` };
    }
  };

  return (
    <>
      <div className="absolute inset-0 z-0">
        {images.map((img, idx) => (
          <div key={`${idx}-${idx === currentIdx ? animKey : 'inactive'}`} style={getAnimStyle(idx === currentIdx)}>
            <img src={img} alt="" className="w-full h-full object-cover" />
          </div>
        ))}
        <div className="absolute inset-0 bg-black/30" />
      </div>
      <style>{`
        @keyframes catSlideLeft { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes catSlideRight { from { transform: translateX(-100%); } to { transform: translateX(0); } }
        @keyframes catSlideDown { from { transform: translateY(-100%); } to { transform: translateY(0); } }
        @keyframes catSlideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes catFade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes catZoom { from { transform: scale(1.3); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes catFlip { from { transform: perspective(600px) rotateY(90deg); } to { transform: perspective(600px) rotateY(0); } }
        @keyframes catRotateCorner { from { transform: rotate(15deg) scale(1.2); opacity: 0; transform-origin: bottom left; } to { transform: rotate(0) scale(1); opacity: 1; } }
        @keyframes catBlinds { from { clip-path: inset(0 0 100% 0); } to { clip-path: inset(0 0 0 0); } }
        @keyframes catSwirl { from { transform: rotate(180deg) scale(0); opacity: 0; } to { transform: rotate(0) scale(1); opacity: 1; } }
      `}</style>
    </>
  );
}

export default function GroceryStore() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const { toast } = useToast();

  const [showWelcome, setShowWelcome] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCat, setSelectedCat] = useState<string>("");
  const [selectedSubCat, setSelectedSubCat] = useState<string>("");
  const [selectedSubSubCat, setSelectedSubSubCat] = useState<string>("");
  const [checkoutStep, setCheckoutStep] = useState<"cart" | "checkout" | "payment" | "success">("cart");
  const [orderType, setOrderType] = useState<"delivery" | "collection">("delivery");
  const [wantCutlery, setWantCutlery] = useState(false);
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [customerForm, setCustomerForm] = useState({ name: "", phone: "", email: "", address: "", postcode: "", notes: "" });
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("card");
  const [clientSecret, setClientSecret] = useState("");
  const [orderId, setOrderId] = useState("");
  const [orderTotal, setOrderTotal] = useState("");
  const [stripeInstance, setStripeInstance] = useState<Stripe | null>(null);

  useEffect(() => {
    getStripe().then(s => setStripeInstance(s));
  }, []);

  useEffect(() => {
    if (slug) {
      fetch(`/api/grocery/store/${slug}/visit`, { method: "POST" }).catch(() => {});
    }
  }, [slug]);

  const { data: storeData, isError: storeError, isLoading: storeLoading } = useQuery<{ branch: Branch; categories: MainCategory[] }>({
    queryKey: ["/api/grocery/store", slug],
    queryFn: () => apiCall(`/api/grocery/store/${slug}`),
    enabled: !!slug,
  });

  const { data: subSubCategories = [], isLoading: subSubCatsLoading, isFetched: subSubCatsFetched } = useQuery<any[]>({
    queryKey: ["/api/grocery/store/sub-sub-categories", slug, selectedSubCat],
    queryFn: () => apiCall(`/api/grocery/store/${slug}/sub-sub-categories/${selectedSubCat}`),
    enabled: !!slug && !!selectedSubCat && !showWelcome,
  });

  const branch = storeData?.branch;
  const { t, isRtl } = useTranslations(branch?.storeLanguage);
  const hasSubSubCats = subSubCategories.length > 0;
  const isMartLayout = branch?.productCardLayout === "mart";

  const { data: subCategories = [], isLoading: subCatsLoading, isFetched: subCatsFetched } = useQuery<SubCategory[]>({
    queryKey: ["/api/grocery/store/sub-categories", slug, selectedCat],
    queryFn: () => apiCall(`/api/grocery/store/${slug}/sub-categories/${selectedCat}`),
    enabled: !!slug && !!selectedCat && !showWelcome,
  });

  const martSubCatsReady = !!selectedCat && subCatsFetched && !subCatsLoading;
  const martSubSubCatsReady = !!selectedSubCat && subSubCatsFetched && !subSubCatsLoading;
  const martHasSubCats = isMartLayout && subCategories.length > 0;
  const martHasSubSubCats = isMartLayout && subSubCategories.length > 0;
  const shouldShowProducts = isMartLayout
    ? ((!!selectedCat && martSubCatsReady && (!!selectedSubCat || !martHasSubCats) && (martSubSubCatsReady ? (!!selectedSubSubCat || !martHasSubSubCats) : !selectedSubCat)) || !!searchQuery)
    : ((!!selectedSubCat && (!!selectedSubSubCat || !hasSubSubCats)) || !!searchQuery);
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/grocery/store/products", slug, selectedCat, selectedSubCat, selectedSubSubCat, searchQuery],
    queryFn: () => {
      let url = `/api/grocery/store/${slug}/products?`;
      if (selectedCat) url += `mainCategoryId=${selectedCat}&`;
      if (selectedSubCat) url += `subCategoryId=${selectedSubCat}&`;
      if (selectedSubSubCat) url += `subSubCategoryId=${selectedSubSubCat}&`;
      if (searchQuery) url += `search=${encodeURIComponent(searchQuery)}`;
      return apiCall(url);
    },
    enabled: !!slug && !showWelcome && shouldShowProducts,
  });
  const categories = storeData?.categories || [];
  const themeColor = branch?.primaryColor || branch?.themeColor || "#22c55e";
  const currency = branch?.currency || "£";
  const fontFam = branch?.fontFamily || "Inter";

  const addToCart = useCallback((product: Product) => {
    setCart(prev => {
      const existing = prev.find(c => c.product.id === product.id);
      if (existing) {
        return prev.map(c => c.product.id === product.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { product, quantity: 1 }];
    });
    toast({ title: `${product.name} added to basket` });
  }, [toast]);

  const updateQuantity = useCallback((productId: string, delta: number) => {
    setCart(prev => {
      return prev.reduce((acc: CartItem[], c) => {
        if (c.product.id !== productId) { acc.push(c); return acc; }
        const newQty = c.quantity + delta;
        if (newQty > 0) acc.push({ ...c, quantity: newQty });
        return acc;
      }, []);
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart(prev => prev.filter(c => c.product.id !== productId));
  }, []);

  const cartTotal = cart.reduce((sum, c) => sum + parseFloat(c.product.nowPrice) * c.quantity, 0);
  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0);
  const freeThreshold = parseFloat(branch?.freeDeliveryThreshold || "30");
  const baseDeliveryCharge = parseFloat(branch?.deliveryCharge || "1.99");
  const deliveryCharge = orderType === "collection" ? 0 : (cartTotal >= freeThreshold ? 0 : baseDeliveryCharge);
  const discountThreshold = parseFloat(branch?.discountThreshold || "30");
  const discountPercent = parseFloat(branch?.discountPercent || "5");
  const collectionDiscountThreshold = parseFloat(branch?.collectionDiscountThreshold || "15");
  const collectionDiscountPercent = parseFloat(branch?.collectionDiscountPercent || "10");
  const deliveryDiscount = cartTotal >= discountThreshold ? (cartTotal * discountPercent / 100) : 0;
  const collectionDiscount = orderType === "collection" && cartTotal >= collectionDiscountThreshold ? (cartTotal * collectionDiscountPercent / 100) : 0;
  const discount = orderType === "collection" ? collectionDiscount : deliveryDiscount;
  const vatRate = parseFloat(branch?.vatRate || "0");
  const cutleryPrice = parseFloat(branch?.cutleryPrice || "0.50");
  const cutleryCharge = wantCutlery ? cutleryPrice : 0;
  const subtotalAfterDiscount = cartTotal - discount;
  const vatAmount = vatRate > 0 ? (subtotalAfterDiscount * vatRate / 100) : 0;
  const grandTotal = cartTotal + deliveryCharge + vatAmount - discount;
  const estimatedDeliveryTime = branch?.estimatedDeliveryTime || "45 minutes";

  const isAcceptingOrders = branch?.acceptingOrders !== false;

  const handleCheckout = async () => {
    if (!isAcceptingOrders) {
      toast({ title: "This store is currently closed and not accepting orders", variant: "destructive" });
      return;
    }
    if (!customerForm.name.trim()) {
      toast({ title: "Please enter your name", variant: "destructive" });
      return;
    }
    if (orderType === "delivery" && !customerForm.address.trim()) {
      toast({ title: "Please enter your delivery address", variant: "destructive" });
      return;
    }
    if (orderType === "delivery" && !customerForm.postcode.trim()) {
      toast({ title: "Please enter your postcode", variant: "destructive" });
      return;
    }
    if (!customerForm.phone.trim()) {
      toast({ title: "Please enter your phone number", variant: "destructive" });
      return;
    }
    try {
      const result = await apiCall("/api/grocery/checkout", "POST", {
        branchSlug: slug,
        items: cart.map(c => ({ productId: c.product.id, quantity: c.quantity })),
        customer: { ...customerForm, notes: specialInstructions || customerForm.notes },
        orderType,
        paymentMethod,
        wantCutlery: false,
      });
      if (result.error) {
        toast({ title: result.error, variant: "destructive" });
        return;
      }
      setOrderId(result.orderId);
      setOrderTotal(result.total);
      if (paymentMethod === "card" && result.clientSecret) {
        setClientSecret(result.clientSecret);
        setCheckoutStep("payment");
      } else {
        setCheckoutStep("success");
        setCart([]);
      }
    } catch (err) {
      toast({ title: "Checkout failed", variant: "destructive" });
    }
  };

  if (storeLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-green-600" />
      </div>
    );
  }

  if (storeError || (storeData && !storeData.branch)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Store className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-700 mb-2">Store Not Found</h2>
          <p className="text-gray-500">This grocery store doesn't exist or is unavailable.</p>
        </div>
      </div>
    );
  }

  if (!branch) return null;

  if (showWelcome) {
    return <WelcomeHero branch={branch} onEnterStore={() => setShowWelcome(false)} />;
  }

  return (
    <div className="min-h-screen grocery-store-page" dir={isRtl ? "rtl" : "ltr"} style={{ fontFamily: fontFam, minHeight: "100dvh", backgroundColor: branch?.productCardLayout === "mart" ? "#fef9e7" : "#f8f8f8" }}>
      {!isAcceptingOrders && (
        <div className="bg-red-600 text-white text-center py-3 px-4 font-semibold text-sm z-[60] relative" data-testid="banner-store-closed">
          <XCircle className="inline h-4 w-4 mr-2 -mt-0.5" />
          {t("storeClosed")}
        </div>
      )}
      <header className="sticky top-0 z-50 shadow-xl backdrop-blur-md" style={{ background: branch.headerBgColor ? `linear-gradient(135deg, ${branch.headerBgColor}, ${branch.headerBgColor}dd)` : `linear-gradient(135deg, ${themeColor}dd, ${themeColor}bb)` }}>
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-4 min-w-0 flex-1">
            {branch.logo ? (
              <img src={branch.logo} alt="" className="h-10 w-10 sm:h-16 sm:w-16 rounded-xl sm:rounded-2xl object-cover ring-2 ring-white/20 shadow-lg shrink-0" />
            ) : (
              <div className="h-10 w-10 sm:h-16 sm:w-16 rounded-xl sm:rounded-2xl bg-white/20 flex items-center justify-center ring-2 ring-white/20 shadow-lg shrink-0">
                <Store className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="text-white font-extrabold text-lg sm:text-4xl leading-tight tracking-tight drop-shadow-md truncate" data-testid="text-store-name">{branch.name}</h1>
              {branch.address && (
                <div className="overflow-hidden mt-0.5 sm:mt-1 max-w-[160px] sm:max-w-[400px]">
                  <p className="text-white/85 text-[10px] sm:text-sm whitespace-nowrap animate-marquee inline-block font-medium tracking-wide">{branch.address}</p>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />
              <Input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={t("searchProducts")}
                className="pl-9 w-48 md:w-64 bg-white/15 border-white/20 text-white placeholder:text-white/50 h-9"
                data-testid="input-search-products"
              />
            </div>
            <Sheet open={cartOpen} onOpenChange={setCartOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" className="relative text-white hover:bg-white/20 h-auto px-4 py-2 gap-2 cart-btn rounded-xl bg-white/10 border border-white/20" data-testid="button-open-cart">
                  <ShoppingCart className="h-6 w-6" />
                  <span className="text-sm font-semibold hidden sm:inline">Basket</span>
                  {cartCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[11px] font-bold rounded-full h-6 w-6 flex items-center justify-center shadow-lg animate-bounce-once ring-2 ring-white/30">
                      {cartCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-lg flex flex-col h-full p-0">
                <CartPanel
                  cart={cart}
                  currency={currency}
                  themeColor={themeColor}
                  cartTotal={cartTotal}
                  deliveryCharge={deliveryCharge}
                  discount={discount}
                  grandTotal={grandTotal}
                  freeThreshold={freeThreshold}
                  discountThreshold={discountThreshold}
                  discountPercent={discountPercent}
                  collectionDiscountPercent={collectionDiscountPercent}
                  collectionDiscountThreshold={collectionDiscountThreshold}
                  vatRate={vatRate}
                  vatAmount={vatAmount}
                  cutleryPrice={cutleryPrice}
                  cutleryCharge={cutleryCharge}
                  wantCutlery={wantCutlery}
                  setWantCutlery={setWantCutlery}
                  orderType={orderType}
                  setOrderType={setOrderType}
                  specialInstructions={specialInstructions}
                  setSpecialInstructions={setSpecialInstructions}
                  estimatedDeliveryTime={estimatedDeliveryTime}
                  paymentMethod={paymentMethod}
                  setPaymentMethod={setPaymentMethod}
                  updateQuantity={updateQuantity}
                  removeFromCart={removeFromCart}
                  checkoutStep={checkoutStep}
                  setCheckoutStep={setCheckoutStep}
                  customerForm={customerForm}
                  setCustomerForm={setCustomerForm}
                  handleCheckout={handleCheckout}
                  clientSecret={clientSecret}
                  orderId={orderId}
                  orderTotal={orderTotal}
                  stripeInstance={stripeInstance}
                  onPaymentSuccess={() => {
                    setCheckoutStep("success");
                    setCart([]);
                  }}
                  onClose={() => setCartOpen(false)}
                  isAcceptingOrders={isAcceptingOrders}
                  whatsappNumber={branch?.whatsappNumber || branch?.phone}
                  branchName={branch?.name}
                  storeLanguage={branch?.storeLanguage}
                />
              </SheetContent>
            </Sheet>
          </div>
        </div>
        <div className="sm:hidden max-w-7xl mx-auto px-3 pb-2.5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={t("searchProducts")}
              className="pl-9 bg-white/90 border-white/30 text-gray-900 placeholder:text-gray-400 h-10 rounded-xl shadow-sm"
              data-testid="input-search-products-mobile"
            />
          </div>
        </div>
      </header>

      {categories.length > 0 && !selectedCat && (() => {
        const catBgType = branch?.categoryBgType || "color";
        const defaultBgColor = isMartLayout ? "#1a1a2e" : "#1e293b";
        const catBgColor = branch?.categoryBgColor || defaultBgColor;
        const catBgImages: string[] = Array.isArray(branch?.categoryBgImages) ? branch.categoryBgImages as string[] : [];
        const catBgAnimation = branch?.categoryBgAnimation || "slide-left";
        const catBgSpeed = branch?.categoryBgAnimationSpeed || 5000;
        const catBgVideo = branch?.categoryBgVideo || "";
        const hasBgImages = catBgType === "image" && catBgImages.length > 0;
        const hasBgVideo = catBgType === "video" && !!catBgVideo;
        const colorBrightness = parseInt(catBgColor.replace('#',''), 16);
        const textColor = (hasBgImages || hasBgVideo) ? "white" : (colorBrightness < 0x888888 ? "white" : "#1e293b");
        return (
        <div className="relative overflow-hidden" style={{ minHeight: "calc(100vh - 140px)", backgroundColor: isMartLayout ? "#1a1a2e" : (catBgType === "color" ? catBgColor : "#1e293b") }}>
          {hasBgImages && <CategoryBgSlider images={catBgImages} animation={catBgAnimation} speed={catBgSpeed} />}
          {hasBgVideo && (
            <>
              <video src={catBgVideo} className="absolute inset-0 w-full h-full object-cover z-0" autoPlay muted loop playsInline />
              <div className="absolute inset-0 bg-black/30 z-[1]" />
            </>
          )}
          {isMartLayout && (
            <div className="absolute inset-0">
              <div className="absolute inset-0" style={{ background: `linear-gradient(160deg, #1a1a2e 0%, #16213e 30%, #0f3460 60%, #1a1a2e 100%)` }} />
              <div className="absolute inset-0" style={{
                background: `radial-gradient(circle at 15% 25%, rgba(220,38,38,0.2) 0%, transparent 40%), radial-gradient(circle at 85% 75%, rgba(251,191,36,0.15) 0%, transparent 40%), radial-gradient(circle at 50% 50%, rgba(15,52,96,0.3) 0%, transparent 60%)`
              }} />
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full opacity-[0.06]" style={{ background: `radial-gradient(circle, ${themeColor || "#dc2626"}, transparent 70%)` }} />
                <div className="absolute -bottom-32 -right-20 w-96 h-96 rounded-full opacity-[0.05]" style={{ background: `radial-gradient(circle, #fbbf24, transparent 70%)` }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.03]" style={{ background: `radial-gradient(circle, #0ea5e9, transparent 70%)` }} />
              </div>
              <div className="absolute inset-0 opacity-[0.02]" style={{
                backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 40px, rgba(255,255,255,0.5) 40px, rgba(255,255,255,0.5) 41px)`
              }} />
            </div>
          )}
          <div className="relative z-10 max-w-7xl mx-auto px-4 pt-6 pb-6">
          <button
            onClick={() => setShowWelcome(true)}
            className="flex items-center gap-1.5 text-sm font-medium mb-4 px-3 py-1.5 rounded-lg transition-colors"
            style={{ color: isMartLayout ? "rgba(255,255,255,0.9)" : (textColor === "white" ? "rgba(255,255,255,0.9)" : themeColor), backgroundColor: (isMartLayout || textColor === "white") ? "rgba(255,255,255,0.15)" : undefined }}
            data-testid="button-back-welcome"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Welcome
          </button>
          <div className="flex flex-col items-center justify-center mb-5 text-center">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight" style={{ color: isMartLayout ? "white" : textColor }} data-testid="text-categories-heading">Shop by Category</h2>
              <p className="text-sm mt-0.5" style={{ color: isMartLayout ? "rgba(255,255,255,0.7)" : textColor, opacity: isMartLayout ? 1 : 0.7 }}>{categories.length} departments to explore</p>
            </div>
          </div>
          <div className={isMartLayout ? "grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4" : "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3"}>
            {(() => {
              const iconCls = "h-10 w-10 sm:h-12 sm:w-12 text-white drop-shadow-lg";
              const categoryIconMap: Record<string, React.ReactNode> = {
                "dairy": <Milk className={iconCls} />,
                "egg": <Egg className={iconCls} />,
                "bakery": <Croissant className={iconCls} />,
                "bread": <Croissant className={iconCls} />,
                "alcohol": <Wine className={iconCls} />,
                "beer": <Beer className={iconCls} />,
                "tobacco": <Cigarette className={iconCls} />,
                "vaping": <Wind className={iconCls} />,
                "vape": <Wind className={iconCls} />,
                "drink": <GlassWater className={iconCls} />,
                "beverage": <GlassWater className={iconCls} />,
                "soft drink": <GlassWater className={iconCls} />,
                "juice": <Citrus className={iconCls} />,
                "crisp": <Cookie className={iconCls} />,
                "snack": <Cookie className={iconCls} />,
                "chocolate": <Candy className={iconCls} />,
                "sweet": <Candy className={iconCls} />,
                "candy": <Candy className={iconCls} />,
                "chilled": <Snowflake className={iconCls} />,
                "frozen": <IceCream className={iconCls} />,
                "fruit": <Apple className={iconCls} />,
                "veg": <Carrot className={iconCls} />,
                "vegetable": <Carrot className={iconCls} />,
                "baby": <Baby className={iconCls} />,
                "pet": <Dog className={iconCls} />,
                "grocery": <ShoppingBag className={iconCls} />,
                "health": <HeartPulse className={iconCls} />,
                "beauty": <SprayCan className={iconCls} />,
                "household": <Home className={iconCls} />,
                "cleaning": <SprayCan className={iconCls} />,
                "non food": <Box className={iconCls} />,
                "gift": <Gift className={iconCls} />,
                "meat": <Beef className={iconCls} />,
                "poultry": <Beef className={iconCls} />,
                "chicken": <Beef className={iconCls} />,
                "fish": <Fish className={iconCls} />,
                "seafood": <Fish className={iconCls} />,
                "coffee": <Coffee className={iconCls} />,
                "tea": <Coffee className={iconCls} />,
                "pizza": <Pizza className={iconCls} />,
                "medicine": <Pill className={iconCls} />,
                "pharmacy": <Pill className={iconCls} />,
                "rice": <Wheat className={iconCls} />,
                "flour": <Wheat className={iconCls} />,
                "pulse": <Wheat className={iconCls} />,
                "grain": <Wheat className={iconCls} />,
                "spice": <Flame className={iconCls} />,
                "cooking": <CookingPot className={iconCls} />,
                "oil": <Droplets className={iconCls} />,
                "sauce": <Droplets className={iconCls} />,
                "condiment": <Droplets className={iconCls} />,
                "cereal": <Wheat className={iconCls} />,
                "other": <Package className={iconCls} />,
              };
              const getCategoryIcon = (name: string) => {
                const lower = name.toLowerCase();
                for (const [key, icon] of Object.entries(categoryIconMap)) {
                  if (lower.includes(key)) return icon;
                }
                return <Tag className="h-10 w-10 sm:h-12 sm:w-12 text-white drop-shadow-lg" />;
              };
              return categories.map((cat, catIdx) => {
                if (isMartLayout) {
                  const displayImg = cat.gif || cat.image;
                  const martGradients = [
                    { from: "#dc2626", to: "#ef4444" },
                    { from: "#ea580c", to: "#f97316" },
                    { from: "#d97706", to: "#f59e0b" },
                    { from: "#16a34a", to: "#22c55e" },
                    { from: "#0891b2", to: "#06b6d4" },
                    { from: "#7c3aed", to: "#8b5cf6" },
                    { from: "#db2777", to: "#ec4899" },
                    { from: "#0284c7", to: "#0ea5e9" },
                  ];
                  const mg = martGradients[catIdx % martGradients.length];
                  return (
                    <button
                      key={cat.id}
                      onClick={() => { setSelectedCat(cat.id); setSelectedSubCat(""); setSelectedSubSubCat(""); }}
                      className="group flex flex-col items-center gap-2.5 p-2 rounded-2xl transition-all duration-300 hover:-translate-y-1 active:scale-[0.96]"
                      data-testid={`button-category-${cat.id}`}
                    >
                      <div className="w-[88px] h-[88px] sm:w-[104px] sm:h-[104px] rounded-full overflow-hidden bg-white shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105 flex items-center justify-center"
                        style={{ border: `3px solid ${themeColor || "#dc2626"}` }}>
                        {displayImg ? (
                          <img src={displayImg} alt={cat.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full rounded-full flex items-center justify-center" style={{ background: `linear-gradient(145deg, ${mg.from}, ${mg.to})` }}>
                            {getCategoryIcon(cat.name)}
                          </div>
                        )}
                      </div>
                      <span className="text-center font-bold text-[11px] sm:text-sm leading-tight line-clamp-2 max-w-[100px]" style={{ color: isMartLayout ? "white" : textColor }}>{cat.name}</span>
                    </button>
                  );
                }
                const appleGradients = [
                  { from: "#FF2D55", to: "#FF6482" },
                  { from: "#007AFF", to: "#5AC8FA" },
                  { from: "#34C759", to: "#30D158" },
                  { from: "#AF52DE", to: "#BF5AF2" },
                  { from: "#FF9500", to: "#FFCC00" },
                  { from: "#00C7BE", to: "#64D2FF" },
                  { from: "#FF3B30", to: "#FF6961" },
                  { from: "#5856D6", to: "#7B7FEC" },
                  { from: "#FF6B6B", to: "#FFB88C" },
                  { from: "#0A84FF", to: "#64D2FF" },
                  { from: "#30D158", to: "#A8E06C" },
                  { from: "#FFD60A", to: "#FFE66D" },
                  { from: "#BF5AF2", to: "#DA8FFF" },
                  { from: "#FF375F", to: "#FF7EB3" },
                  { from: "#32ADE6", to: "#6DD5FA" },
                  { from: "#63E6BE", to: "#96F2D7" },
                  { from: "#AC8E68", to: "#C4A882" },
                  { from: "#8E8E93", to: "#AEAEB2" },
                  { from: "#FF6B35", to: "#FFB347" },
                  { from: "#5E5CE6", to: "#8884FF" },
                ];
                const gradient = appleGradients[catIdx % appleGradients.length];
                const hasCustomColor = !!cat.color;
                const catColor = cat.color || gradient.from;
                const gradFrom = hasCustomColor ? catColor : gradient.from;
                const gradTo = hasCustomColor ? catColor + 'cc' : gradient.to;
                return (
                  <button
                    key={cat.id}
                    onClick={() => { setSelectedCat(cat.id); setSelectedSubCat(""); setSelectedSubSubCat(""); }}
                    className="apple-cat-card group relative flex flex-col items-center justify-center p-3 sm:p-5 rounded-[20px] sm:rounded-[24px] transition-all duration-300 hover:-translate-y-1 active:scale-[0.96] overflow-hidden aspect-square"
                    style={{
                      background: `linear-gradient(145deg, ${gradFrom}, ${gradTo})`,
                      boxShadow: `0 6px 20px ${gradFrom}40, 0 2px 6px rgba(0,0,0,0.1)`,
                    }}
                    data-testid={`button-category-${cat.id}`}
                  >
                    <div className="absolute inset-0 rounded-[20px] sm:rounded-[24px] pointer-events-none" style={{
                      background: `conic-gradient(from var(--angle, 0deg), transparent 0%, rgba(255,255,255,0.4) 10%, transparent 20%)`,
                    }} />
                    <div className="flex-shrink-0 transition-transform duration-300 group-hover:scale-110 relative z-10 mb-1.5 sm:mb-2 cat-icon-pulse">
                      {cat.image && /\.(mp4|webm|mov)(\?|$)/i.test(cat.image) ? (
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[16px] sm:rounded-[20px] overflow-hidden bg-white/20 backdrop-blur-sm">
                          <video src={cat.image} className="w-full h-full object-cover" muted autoPlay loop playsInline />
                        </div>
                      ) : cat.image ? (
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[16px] sm:rounded-[20px] overflow-hidden bg-white/20 backdrop-blur-sm">
                          <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        getCategoryIcon(cat.name)
                      )}
                    </div>
                    <span className="text-center font-extrabold text-base sm:text-lg text-white leading-tight line-clamp-2 relative z-10 drop-shadow-md">{cat.name}</span>
                  </button>
                );
              });
            })()}
          </div>
          <style>{`
            @property --angle {
              syntax: '<angle>';
              initial-value: 0deg;
              inherits: false;
            }
            .apple-cat-card {
              --angle: 0deg;
              animation: rotateBorder 3s linear infinite;
            }
            @keyframes rotateBorder {
              to { --angle: 360deg; }
            }
            .apple-cat-card::before {
              content: '';
              position: absolute;
              inset: 0;
              border-radius: inherit;
              padding: 2px;
              background: conic-gradient(from var(--angle), transparent 0%, rgba(100,200,255,0.6) 8%, rgba(0,122,255,0.8) 15%, transparent 25%);
              mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
              -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
              mask-composite: exclude;
              -webkit-mask-composite: xor;
              opacity: 0.7;
              transition: opacity 0.3s;
            }
            .cat-icon-pulse {
              animation: iconPulse 2s ease-in-out infinite;
            }
            @keyframes iconPulse {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.15); }
            }
            .apple-cat-card:hover .cat-icon-pulse {
              animation: iconShake 0.5s ease-in-out;
            }
            @keyframes iconShake {
              0%, 100% { transform: rotate(0deg) scale(1.1); }
              25% { transform: rotate(-8deg) scale(1.15); }
              75% { transform: rotate(8deg) scale(1.15); }
            }
            .apple-cat-card:hover::before {
              opacity: 1;
            }
            .animate-marquee {
              animation: marqueeScroll 12s linear infinite;
            }
            @keyframes marqueeScroll {
              0% { transform: translateX(100%); }
              100% { transform: translateX(-100%); }
            }
            .cart-btn {
              transition: transform 0.2s;
            }
            .cart-btn:hover {
              animation: cartWiggle 0.5s ease-in-out;
            }
            @keyframes cartWiggle {
              0%, 100% { transform: rotate(0deg); }
              20% { transform: rotate(-12deg); }
              40% { transform: rotate(10deg); }
              60% { transform: rotate(-6deg); }
              80% { transform: rotate(4deg); }
            }
            .animate-bounce-once {
              animation: badgePop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            }
            @keyframes badgePop {
              0% { transform: scale(0); }
              60% { transform: scale(1.3); }
              100% { transform: scale(1); }
            }
          `}</style>
          </div>
        </div>
        );
      })()}

      {isMartLayout && selectedCat && !selectedSubCat && !martSubCatsReady && (
        <div className="max-w-7xl mx-auto px-4 pt-12 pb-2 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: themeColor }} />
        </div>
      )}

      {selectedCat && !selectedSubCat && (!isMartLayout || (martSubCatsReady && martHasSubCats)) && (
        <div className="max-w-7xl mx-auto px-4 pt-6 pb-2">
          <div className="flex flex-col gap-3 mb-5">
            <button
              onClick={() => { setSelectedCat(""); setSelectedSubCat(""); setSelectedSubSubCat(""); }}
              className="flex items-center gap-2 text-base font-bold px-5 py-2.5 rounded-full transition-all hover:opacity-80 active:scale-95 min-h-[44px] self-start"
              style={{ color: isMartLayout ? "#dc2626" : "#d4a017", background: isMartLayout ? "rgba(220,38,38,0.08)" : "rgba(212,160,23,0.12)" }}
              data-testid="button-back-to-categories"
            >
              <ArrowLeft className="h-5 w-5" /> All Categories
            </button>
            <div className="text-center">
              {branch.logo && !isMartLayout && (
                <div className="mb-3 flex justify-center">
                  <img src={branch.logo} alt="" className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl object-cover shadow-lg ring-2 ring-gray-200/50" />
                </div>
              )}
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight uppercase" style={{ color: isMartLayout ? "#dc2626" : "#d4a017" }}>{categories.find(c => c.id === selectedCat)?.name}</h2>
              <p className="text-base sm:text-lg font-bold mt-0.5" style={{ color: isMartLayout ? "#b91c1c" : "#c8941a" }}>{subCategories.length} sub-categories</p>
            </div>
          </div>
          <div className={`grid ${isMartLayout ? "grid-cols-2 sm:grid-cols-3 gap-3" : "grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4"}`}>
            {subCategories.map(sub => (
              <button
                key={sub.id}
                onClick={() => { setSelectedSubCat(sub.id); setSelectedSubSubCat(""); }}
                className={`group relative overflow-hidden ${isMartLayout ? "rounded-xl border-2 border-red-100" : "rounded-xl sm:rounded-2xl border border-gray-100 bg-white"} transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-gray-200 active:scale-95`}
                style={{ aspectRatio: "7/4", backgroundColor: isMartLayout && !sub.image && !sub.gif && !sub.video ? themeColor : undefined }}
                data-testid={`button-sub-category-${sub.id}`}
              >
                {sub.video ? (
                  <video src={sub.video} className="absolute inset-0 w-full h-full object-cover" muted autoPlay loop playsInline />
                ) : sub.gif ? (
                  <img src={sub.gif} alt={sub.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                ) : sub.image && /\.(mp4|webm|mov)(\?|$)/i.test(sub.image) ? (
                  <video src={sub.image} className="absolute inset-0 w-full h-full object-cover" muted autoPlay loop playsInline />
                ) : sub.image ? (
                  <img src={sub.image} alt={sub.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                ) : (
                  <div className={`absolute inset-0 w-full h-full flex items-center justify-center ${isMartLayout ? "bg-gradient-to-br from-white/20 to-black/10" : "bg-gradient-to-br from-gray-50 to-gray-100"}`}>
                    <Package className={`h-8 w-8 sm:h-12 sm:w-12 ${isMartLayout ? "text-white/60" : "text-gray-200"}`} />
                  </div>
                )}
                <div className={`absolute inset-0 ${sub.image || sub.gif || sub.video ? "bg-gradient-to-t from-black/70 via-black/20 to-transparent" : isMartLayout ? "bg-gradient-to-t from-black/40 to-transparent" : "bg-gradient-to-t from-black/70 via-black/20 to-transparent"}`} />
                <div className="absolute bottom-0 left-0 right-0 p-2.5 sm:p-4 flex items-end justify-between">
                  <span className="text-white font-extrabold text-sm sm:text-lg drop-shadow-lg leading-tight">{sub.name}</span>
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/40 transition-all flex-shrink-0">
                    <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 text-white group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </button>
            ))}
          </div>
          {subCategories.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Package className="h-12 w-12 text-gray-300 mb-3" />
              <p className="text-gray-500">No sub-categories available yet</p>
            </div>
          )}
        </div>
      )}

      {isMartLayout && selectedCat && selectedSubCat && !selectedSubSubCat && !martSubSubCatsReady && (
        <div className="max-w-7xl mx-auto px-4 pt-12 pb-2 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: themeColor }} />
        </div>
      )}

      {selectedCat && selectedSubCat && !selectedSubSubCat && (isMartLayout ? (martSubSubCatsReady && martHasSubSubCats) : hasSubSubCats) && (
        <div className="max-w-7xl mx-auto px-4 pt-6 pb-2">
          <div className="flex flex-col gap-3 mb-5">
            <button
              onClick={() => { setSelectedSubCat(""); setSelectedSubSubCat(""); }}
              className="flex items-center gap-2 text-base font-bold px-5 py-2.5 rounded-full transition-all hover:opacity-80 active:scale-95 min-h-[44px] self-start"
              style={{ color: isMartLayout ? "#dc2626" : "#d4a017", background: isMartLayout ? "rgba(220,38,38,0.08)" : "rgba(212,160,23,0.12)" }}
              data-testid="button-back-to-subcategories"
            >
              <ArrowLeft className="h-5 w-5" /> Back to {categories.find(c => c.id === selectedCat)?.name}
            </button>
            <div className="text-center">
              {branch.logo && !isMartLayout && (
                <div className="mb-3 flex justify-center">
                  <img src={branch.logo} alt="" className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl object-cover shadow-lg ring-2 ring-gray-200/50" />
                </div>
              )}
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight uppercase" style={{ color: isMartLayout ? "#dc2626" : "#d4a017" }}>{subCategories.find(s => s.id === selectedSubCat)?.name}</h2>
              <p className="text-base sm:text-lg font-bold mt-0.5" style={{ color: isMartLayout ? "#b91c1c" : "#c8941a" }}>{subSubCategories.length} sub-categories</p>
            </div>
          </div>
          <div className={`grid ${isMartLayout ? "grid-cols-2 sm:grid-cols-3 gap-3" : "grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4"}`}>
            {subSubCategories.map((ssc: any) => (
              <button
                key={ssc.id}
                onClick={() => setSelectedSubSubCat(ssc.id)}
                className={`group relative overflow-hidden ${isMartLayout ? "rounded-xl border-2 border-red-100" : "rounded-xl sm:rounded-2xl border border-gray-100 bg-white"} transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-gray-200 active:scale-95`}
                style={{ aspectRatio: "7/4", backgroundColor: isMartLayout && !ssc.image && !ssc.gif && !ssc.video ? themeColor : undefined }}
                data-testid={`button-sub-sub-category-${ssc.id}`}
              >
                {ssc.video ? (
                  <video src={ssc.video} className="absolute inset-0 w-full h-full object-cover" muted autoPlay loop playsInline />
                ) : ssc.gif ? (
                  <img src={ssc.gif} alt={ssc.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                ) : ssc.image && /\.(mp4|webm|mov)(\?|$)/i.test(ssc.image) ? (
                  <video src={ssc.image} className="absolute inset-0 w-full h-full object-cover" muted autoPlay loop playsInline />
                ) : ssc.image ? (
                  <img src={ssc.image} alt={ssc.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                ) : (
                  <div className={`absolute inset-0 w-full h-full flex items-center justify-center ${isMartLayout ? "bg-gradient-to-br from-white/20 to-black/10" : "bg-gradient-to-br from-gray-50 to-gray-100"}`}>
                    <Package className={`h-8 w-8 sm:h-12 sm:w-12 ${isMartLayout ? "text-white/60" : "text-gray-200"}`} />
                  </div>
                )}
                <div className={`absolute inset-0 ${ssc.image || ssc.gif || ssc.video ? "bg-gradient-to-t from-black/70 via-black/20 to-transparent" : isMartLayout ? "bg-gradient-to-t from-black/40 to-transparent" : "bg-gradient-to-t from-black/70 via-black/20 to-transparent"}`} />
                <div className="absolute bottom-0 left-0 right-0 p-2.5 sm:p-4 flex items-end justify-between">
                  <span className="text-white font-extrabold text-sm sm:text-lg drop-shadow-lg leading-tight">{ssc.name}</span>
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/40 transition-all flex-shrink-0">
                    <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 text-white group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {((isMartLayout && selectedCat && shouldShowProducts) || (!isMartLayout && selectedCat && selectedSubCat && (selectedSubSubCat || !hasSubSubCats))) && (
        <div className="max-w-7xl mx-auto px-4 pt-6 pb-2">
          <button
            onClick={() => {
              if (isMartLayout) {
                if (selectedSubSubCat && martHasSubSubCats) {
                  setSelectedSubSubCat("");
                } else if (martHasSubCats && selectedSubCat) {
                  setSelectedSubCat(""); setSelectedSubSubCat("");
                } else {
                  setSelectedCat(""); setSelectedSubCat(""); setSelectedSubSubCat("");
                }
              } else if (selectedSubSubCat) {
                setSelectedSubSubCat("");
              } else {
                setSelectedSubCat("");
              }
            }}
            className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-full transition-all hover:opacity-80 active:scale-95 mb-4 min-h-[44px]"
            style={{ color: themeColor, background: `${themeColor}12` }}
            data-testid="button-back-from-products"
          >
            <ArrowLeft className="h-4 w-4" /> {isMartLayout
              ? (selectedSubSubCat && martHasSubSubCats
                ? `${t("back")} ${subCategories.find(s => s.id === selectedSubCat)?.name || t("subCategories")}`
                : martHasSubCats && selectedSubCat
                  ? `${t("back")} ${categories.find(c => c.id === selectedCat)?.name || t("subCategories")}`
                  : t("allCategories"))
              : `${t("back")} ${selectedSubSubCat ? (subCategories.find(s => s.id === selectedSubCat)?.name || t("subCategories")) : (categories.find(c => c.id === selectedCat)?.name || t("categories"))}`}
          </button>
          {branch.logo && !isMartLayout && (
            <div className="flex justify-center mb-2">
              <img src={branch.logo} alt="" className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl object-cover shadow-lg ring-2 ring-gray-200/50" />
            </div>
          )}
        </div>
      )}

      {shouldShowProducts && (
      <div className="max-w-7xl mx-auto px-4 py-4" style={{ paddingBottom: cartCount > 0 ? "100px" : undefined }}>

        {cartTotal > 0 && cartTotal < freeThreshold && (
          <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm flex items-center gap-2">
            <Truck className="h-4 w-4 shrink-0" />
            <span>Spend {currency}{(freeThreshold - cartTotal).toFixed(2)} more for <strong>FREE delivery!</strong></span>
          </div>
        )}

        {branch?.productCardLayout === "mart" ? (
          <>
          {selectedCat && !searchQuery && (
            <h2 className="text-xl sm:text-2xl font-extrabold mb-4 uppercase" style={{ color: "#dc2626" }}>
              {selectedSubSubCat ? subSubCategories.find((s: any) => s.id === selectedSubSubCat)?.name : selectedSubCat ? subCategories.find(s => s.id === selectedSubCat)?.name : categories.find(c => c.id === selectedCat)?.name} <span className="text-gray-400 font-medium text-base">({products.length})</span>
            </h2>
          )}
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {products.map(product => (
              <MartProductCard
                key={product.id}
                product={product}
                currency={currency}
                themeColor={themeColor}
                cartItem={cart.find(c => c.product.id === product.id)}
                onAdd={() => addToCart(product)}
                onIncrement={() => updateQuantity(product.id, 1)}
                onDecrement={() => updateQuantity(product.id, -1)}
              />
            ))}
          </div>
          </>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {products.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                currency={currency}
                themeColor={themeColor}
                cartItem={cart.find(c => c.product.id === product.id)}
                onAdd={() => addToCart(product)}
                onIncrement={() => updateQuantity(product.id, 1)}
                onDecrement={() => updateQuantity(product.id, -1)}
              />
            ))}
          </div>
        )}

        {products.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Package className="h-16 w-16 text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">No products found</p>
            <p className="text-gray-400 text-sm mt-1">{searchQuery ? "Try a different search" : "Check back soon"}</p>
          </div>
        )}
      </div>
      )}

      {cartCount > 0 && !cartOpen && (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-3 sm:p-4 bg-white/80 backdrop-blur-lg border-t shadow-2xl safe-area-bottom">
          <div className="max-w-7xl mx-auto">
            <Button
              className="w-full h-12 sm:h-14 text-base sm:text-lg font-bold rounded-2xl gap-2 sm:gap-3"
              style={{ backgroundColor: themeColor }}
              onClick={() => setCartOpen(true)}
              data-testid="button-view-basket"
            >
              <ShoppingCart className="h-5 w-5" />
              {t("viewBasket")} ({cartCount})
              <span className="ml-auto">{currency}{cartTotal.toFixed(2)}</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ProductCard({ product, currency, themeColor, cartItem, onAdd, onIncrement, onDecrement }: {
  product: Product; currency: string; themeColor: string; cartItem?: CartItem;
  onAdd: () => void; onIncrement: () => void; onDecrement: () => void;
}) {
  const [showDetail, setShowDetail] = useState(false);

  return (
    <>
      <div
        className="relative group cursor-pointer"
        style={{ perspective: "800px" }}
        data-testid={`card-product-${product.id}`}
      >
        <div
          className="bg-white rounded-2xl overflow-hidden transition-all duration-300 group-hover:-translate-y-1"
          style={{
            boxShadow: "0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.05)",
            transform: "translateZ(0)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.boxShadow = `0 12px 32px ${themeColor}25, 0 4px 12px rgba(0,0,0,0.1)`;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.05)";
          }}
        >
          <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden" onClick={() => setShowDetail(true)}>
            {product.image1 ? (
              <img
                src={product.image1}
                alt={product.name}
                className="w-full h-full object-contain p-3 group-hover:scale-110 transition-transform duration-500 ease-out drop-shadow-md"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="h-14 w-14 text-gray-200" />
              </div>
            )}
            {product.wasPrice && (
              <div className="absolute top-2 left-2">
                <div className="bg-gradient-to-r from-red-500 to-rose-500 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-lg shadow-red-200">
                  SALE
                </div>
              </div>
            )}
            {product.isFeatured && product.isAvailable !== false && (
              <div className="absolute top-2 right-2">
                <div className="text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-lg" style={{ background: `linear-gradient(135deg, ${themeColor}, ${themeColor}cc)`, boxShadow: `0 4px 12px ${themeColor}40` }}>
                  ★ Featured
                </div>
              </div>
            )}
            {product.isAvailable === false && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
                <div className="bg-red-500 text-white text-sm font-extrabold px-4 py-2 rounded-full shadow-lg transform -rotate-12" data-testid={`badge-sold-${product.id}`}>
                  SOLD
                </div>
              </div>
            )}
            {product.calories && (
              <div className="absolute bottom-2 left-2">
                <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm text-xs font-medium px-2 py-1 rounded-full shadow-sm" style={{ color: themeColor }}>
                  <Flame className="h-3 w-3" /> {product.calories}
                </div>
              </div>
            )}
          </div>

          <div className="p-3 space-y-2">
            <h3
              className="font-bold text-sm leading-snug line-clamp-2 min-h-[2.5rem] cursor-pointer hover:underline"
              onClick={() => setShowDetail(true)}
              data-testid={`text-product-name-${product.id}`}
            >
              {product.name}
            </h3>
            {product.weight && <p className="text-[11px] text-teal-600 font-semibold bg-teal-50 inline-block px-1.5 py-0.5 rounded">{product.weight}</p>}

            <div className="flex items-end justify-between pt-1">
              <div className="flex items-center gap-1.5">
                {product.wasPrice && (
                  <span className="text-gray-400 line-through text-xs font-medium">{currency}{product.wasPrice}</span>
                )}
                <span className="font-extrabold text-lg leading-none" style={{ color: themeColor }}>{currency}{product.nowPrice}</span>
              </div>
            </div>

            <div className="pt-1">
              {product.isAvailable === false ? (
                <div className="w-full h-9 text-sm font-bold rounded-xl text-white flex items-center justify-center gap-1.5 bg-gray-400 cursor-not-allowed opacity-60" data-testid={`button-sold-${product.id}`}>
                  Sold
                </div>
              ) : cartItem ? (
                <div className="flex items-center justify-between rounded-xl overflow-hidden" style={{ background: `${themeColor}10`, border: `2px solid ${themeColor}30` }}>
                  <button
                    className="h-9 w-10 flex items-center justify-center transition-colors hover:bg-white/50 active:scale-90"
                    onClick={(e) => { e.stopPropagation(); onDecrement(); }}
                    data-testid={`button-decrement-${product.id}`}
                  >
                    <Minus className="h-3.5 w-3.5" style={{ color: themeColor }} />
                  </button>
                  <span className="font-extrabold text-sm min-w-[28px] text-center" style={{ color: themeColor }} data-testid={`text-quantity-${product.id}`}>{cartItem.quantity}</span>
                  <button
                    className="h-9 w-10 flex items-center justify-center transition-colors hover:bg-white/50 active:scale-90"
                    onClick={(e) => { e.stopPropagation(); onIncrement(); }}
                    data-testid={`button-increment-${product.id}`}
                  >
                    <Plus className="h-3.5 w-3.5" style={{ color: themeColor }} />
                  </button>
                </div>
              ) : (
                <button
                  className="w-full h-9 text-sm font-bold rounded-xl text-white flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-95 hover:shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${themeColor}, ${themeColor}dd)`, boxShadow: `0 4px 14px ${themeColor}30` }}
                  onClick={(e) => { e.stopPropagation(); onAdd(); }}
                  data-testid={`button-add-${product.id}`}
                >
                  <Plus className="h-3.5 w-3.5" /> Add
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {showDetail && (
        <ProductDetailModal
          product={product}
          currency={currency}
          themeColor={themeColor}
          cartItem={cartItem}
          onAdd={onAdd}
          onIncrement={onIncrement}
          onDecrement={onDecrement}
          onClose={() => setShowDetail(false)}
        />
      )}
    </>
  );
}

function MartProductCard({ product, currency, themeColor, cartItem, onAdd, onIncrement, onDecrement }: {
  product: Product; currency: string; themeColor: string; cartItem?: CartItem;
  onAdd: () => void; onIncrement: () => void; onDecrement: () => void;
}) {
  const [showDetail, setShowDetail] = useState(false);
  return (
    <>
    <div
      className="relative group cursor-pointer select-none"
      style={{ marginBottom: "22px", paddingLeft: "10px" }}
      data-testid={`card-product-${product.id}`}
      onClick={() => setShowDetail(true)}
    >
      <div
        className="relative transition-all duration-200 group-hover:shadow-xl"
        style={{ borderRadius: "8px", border: "3px solid #dc2626", background: "#fff", overflow: "visible", zIndex: 1 }}
      >
        <div className="relative" style={{ aspectRatio: "1/0.9", borderRadius: "5px", overflow: "hidden" }}>
          {product.image1 ? (
            <img
              src={product.image1}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-50">
              <Package className="h-14 w-14 text-gray-300" />
            </div>
          )}
          {product.wasPrice && (
            <div className="absolute top-2 left-2 z-10">
              <div className="bg-red-600 text-white text-[9px] font-black px-2.5 py-1 rounded shadow-md">SALE</div>
            </div>
          )}
          {product.isAvailable === false && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
              <div className="bg-red-600 text-white text-sm font-black px-5 py-2 rounded-full transform -rotate-12" data-testid={`badge-sold-${product.id}`}>SOLD</div>
            </div>
          )}
          {cartItem && (
            <div className="absolute top-2 right-2 z-10">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-black shadow-lg" style={{ background: "#22c55e" }}>
                {cartItem.quantity}
              </div>
            </div>
          )}
        </div>
      </div>

      <div
        className="relative flex items-stretch"
        style={{
          marginTop: "-35px",
          marginLeft: "-12px",
          marginRight: "-8px",
          height: "65px",
          zIndex: 3,
          clipPath: "polygon(0 0, 100% 0, 97% 100%, 4% 100%)",
        }}
      >
        <div
          className="flex flex-col justify-center px-2 sm:px-4 py-1.5"
          style={{
            background: "#fbbf24",
            flex: "1 1 55%",
            minWidth: 0,
            paddingLeft: "12px",
          }}
        >
          <h3
            className="font-black leading-tight line-clamp-2 text-gray-900 uppercase"
            data-testid={`text-product-name-${product.id}`}
            style={{ fontSize: "clamp(10px, 2.8vw, 17px)", letterSpacing: "0.02em" }}
          >
            {product.name}
          </h3>
        </div>
        <div
          className="flex flex-col items-end justify-center px-2 sm:px-4 py-1.5"
          style={{
            background: "linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)",
            flex: "0 0 auto",
            minWidth: "70px",
          }}
        >
          {product.weight && (
            <span className="text-[10px] font-bold text-white leading-none mb-0.5">
              {product.weight}
            </span>
          )}
          <div className="flex items-baseline gap-0.5">
            {product.wasPrice && (
              <span className="text-red-200 line-through text-[8px] font-semibold mr-0.5">{currency}{product.wasPrice}</span>
            )}
            <span className="text-[10px] font-black text-white">{currency}</span>
            <span className="font-black text-white" style={{ fontSize: "clamp(18px, 5vw, 28px)", lineHeight: "1" }}>
              {product.nowPrice}
            </span>
          </div>
        </div>
      </div>
      {cartItem && (
        <button
          className="absolute w-6 h-6 rounded-full flex items-center justify-center text-white active:scale-90 transition-transform"
          style={{ background: "#dc2626", border: "2px solid #fff", bottom: "4px", right: "8px", zIndex: 10 }}
          onClick={(e) => { e.stopPropagation(); onDecrement(); }}
          data-testid={`button-decrement-${product.id}`}
        >
          <Minus className="h-3 w-3" />
        </button>
      )}
    </div>

    {showDetail && (
      <ProductDetailModal
        product={product}
        currency={currency}
        themeColor={themeColor}
        cartItem={cartItem}
        onAdd={onAdd}
        onIncrement={onIncrement}
        onDecrement={onDecrement}
        onClose={() => setShowDetail(false)}
      />
    )}
    </>
  );
}

function AccordionSection({ title, icon, color, children }: { title: string; icon: React.ReactNode; color: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        className="w-full flex items-center justify-between py-4 px-1 text-left transition-colors hover:bg-gray-50/50"
        onClick={() => setOpen(!open)}
      >
        <span className="flex items-center gap-2.5 font-bold text-base sm:text-lg" style={{ color }}>{icon} {title}</span>
        <ChevronDown className={`h-5 w-5 transition-transform duration-300 ${open ? "rotate-180" : ""}`} style={{ color }} />
      </button>
      <div
        className="overflow-hidden transition-all duration-300"
        style={{ maxHeight: open ? "2000px" : "0", opacity: open ? 1 : 0 }}
      >
        <div className="pb-4 px-1 text-base text-gray-600 leading-relaxed whitespace-pre-line">{children}</div>
      </div>
    </div>
  );
}

function ProductDetailModal({ product, currency, themeColor, cartItem, onAdd, onIncrement, onDecrement, onClose }: {
  product: Product; currency: string; themeColor: string; cartItem?: CartItem;
  onAdd: () => void; onIncrement: () => void; onDecrement: () => void; onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center overflow-y-auto" onClick={onClose}>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative bg-white w-full sm:max-w-lg sm:rounded-2xl sm:my-8 shadow-2xl animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="sticky top-3 float-right mr-3 z-20 h-9 w-9 rounded-full bg-white/95 backdrop-blur flex items-center justify-center shadow-lg hover:bg-gray-100 transition-colors border border-gray-200"
          onClick={onClose}
          data-testid="button-close-detail"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="bg-gradient-to-br from-gray-50 to-white px-4 pt-4 pb-4 flex items-center justify-center relative" style={{ minHeight: "280px" }}>
          {product.image1 ? (
            <img src={product.image1} alt={product.name} className="w-full object-contain drop-shadow-lg" style={{ maxHeight: "380px", minHeight: "200px" }} />
          ) : (
            <Package className="h-24 w-24 text-gray-200" />
          )}
          {product.wasPrice && (
            <div className="absolute top-4 left-4 bg-gradient-to-r from-red-500 to-rose-500 text-white text-xs font-extrabold px-3 py-1.5 rounded-full shadow-lg">SALE</div>
          )}
          {product.isAvailable === false && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="bg-red-500 text-white text-lg font-extrabold px-6 py-3 rounded-full shadow-lg transform -rotate-12">SOLD</div>
            </div>
          )}
        </div>

        <div className="p-5 space-y-4">
          <div>
            <h2 className="text-xl font-bold leading-tight mb-1" data-testid="text-detail-product-name">{product.name}</h2>
            {product.calories && (
              <div className="flex items-center gap-1.5 text-sm font-medium" style={{ color: themeColor }}>
                <Flame className="h-4 w-4" /> {product.calories}
              </div>
            )}
          </div>

          <div className="flex items-end justify-between">
            <div className="flex items-center gap-2">
              {product.wasPrice && (
                <span className="text-gray-400 line-through text-lg">{currency}{product.wasPrice}</span>
              )}
              <span className="font-extrabold text-2xl" style={{ color: themeColor }}>{currency}{product.nowPrice}</span>
            </div>

            {product.isAvailable === false ? (
              <div className="h-10 px-8 text-sm font-bold rounded-xl text-white flex items-center gap-2 bg-gray-400 cursor-not-allowed opacity-60">
                Sold
              </div>
            ) : cartItem ? (
              <div className="flex items-center gap-0 rounded-xl overflow-hidden" style={{ background: `${themeColor}10`, border: `2px solid ${themeColor}30` }}>
                <button
                  className="h-10 w-11 flex items-center justify-center hover:bg-white/50 active:scale-90"
                  onClick={onDecrement}
                  data-testid="button-detail-decrement"
                >
                  <Minus className="h-4 w-4" style={{ color: themeColor }} />
                </button>
                <span className="font-extrabold text-base min-w-[32px] text-center" style={{ color: themeColor }}>{cartItem.quantity}</span>
                <button
                  className="h-10 w-11 flex items-center justify-center hover:bg-white/50 active:scale-90"
                  onClick={onIncrement}
                  data-testid="button-detail-increment"
                >
                  <Plus className="h-4 w-4" style={{ color: themeColor }} />
                </button>
              </div>
            ) : (
              <button
                className="h-10 px-8 text-sm font-bold rounded-xl text-white flex items-center gap-2 transition-all active:scale-95 hover:shadow-lg"
                style={{ background: `linear-gradient(135deg, ${themeColor}, ${themeColor}dd)`, boxShadow: `0 4px 14px ${themeColor}30` }}
                onClick={onAdd}
                data-testid="button-detail-add"
              >
                <Plus className="h-4 w-4" /> Add
              </button>
            )}
          </div>

          <div className="border-t pt-3">
            {product.allergyAdvice?.trim() && (
              <AccordionSection title="Allergy Advice" icon={<AlertTriangle className="h-5 w-5" />} color={themeColor}>
                {product.allergyAdvice}
              </AccordionSection>
            )}
            {product.productMarketing?.trim() && (
              <AccordionSection title="Product Marketing" icon={<Megaphone className="h-5 w-5" />} color={themeColor}>
                {product.productMarketing}
              </AccordionSection>
            )}
            {product.description?.trim() && (
              <AccordionSection title="Description" icon={<FileText className="h-5 w-5" />} color={themeColor}>
                {product.description}
              </AccordionSection>
            )}
            {product.features?.trim() && (
              <AccordionSection title="Features" icon={<ListChecks className="h-5 w-5" />} color={themeColor}>
                <div className="flex flex-wrap gap-x-3 gap-y-1.5 items-center">
                  {product.features.split(/[\n,]+/).filter(f => f.trim()).map((feature, i) => (
                    <span key={i} className="flex items-center gap-1.5 text-sm text-gray-600">
                      <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: themeColor }} />
                      {feature.trim()}
                    </span>
                  ))}
                </div>
              </AccordionSection>
            )}
            {product.lifestyle?.trim() && (
              <AccordionSection title="Life Style" icon={<Leaf className="h-5 w-5" />} color={themeColor}>
                <div className="flex flex-wrap gap-x-3 gap-y-1.5 items-center">
                  {product.lifestyle.split(/[\n,]+/).filter(f => f.trim()).map((item, i) => (
                    <span key={i} className="flex items-center gap-1.5 text-sm text-gray-600">
                      <span className="h-2 w-2 rounded-full flex-shrink-0 bg-gray-400" />
                      {item.trim()}
                    </span>
                  ))}
                </div>
              </AccordionSection>
            )}
            {product.ingredients?.trim() && (
              <AccordionSection title="Ingredients" icon={<Apple className="h-5 w-5" />} color={themeColor}>
                <div className="flex flex-wrap gap-x-3 gap-y-1.5 items-center">
                  {product.ingredients.split(/[\n,]+/).filter(f => f.trim()).map((item, i) => (
                    <span key={i} className="flex items-center gap-1.5 text-sm text-gray-600">
                      <span className="h-2 w-2 rounded-full flex-shrink-0 bg-gray-400" />
                      {item.trim()}
                    </span>
                  ))}
                </div>
              </AccordionSection>
            )}
            {product.calculatedNutrition?.trim() && (
              <AccordionSection title="Calculated Nutrition" icon={<Calculator className="h-5 w-5" />} color={themeColor}>
                <div className="space-y-0">
                  {(() => {
                    const lines = product.calculatedNutrition!.split(/\n/).filter(l => l.trim());
                    const rows: { label: string; value: string }[] = [];
                    let header = "";
                    for (let i = 0; i < lines.length; i++) {
                      const line = lines[i].trim();
                      const parts = line.split(/\t+|  {2,}/);
                      if (parts.length >= 2) {
                        rows.push({ label: parts[0].trim(), value: parts.slice(1).join(" ").trim() });
                      } else if (/^\d/.test(line) || /^[\d.,]+$/.test(line)) {
                        if (rows.length > 0 && !rows[rows.length - 1].value) {
                          rows[rows.length - 1].value = line;
                        } else if (i > 0) {
                          const prev = lines[i - 1]?.trim();
                          if (prev && rows.length > 0 && rows[rows.length - 1].label === prev) {
                            rows[rows.length - 1].value = line;
                          } else {
                            rows.push({ label: "", value: line });
                          }
                        }
                      } else if (/^(per |Per )/.test(line)) {
                        header = line;
                      } else {
                        rows.push({ label: line, value: "" });
                      }
                    }
                    const paired: { label: string; value: string }[] = [];
                    for (let i = 0; i < rows.length; i++) {
                      if (rows[i].value) {
                        paired.push(rows[i]);
                      } else if (i + 1 < rows.length && !rows[i].value && rows[i + 1].label === "" && rows[i + 1].value) {
                        paired.push({ label: rows[i].label, value: rows[i + 1].value });
                        i++;
                      } else if (!rows[i].value && i + 1 < rows.length && /^\d/.test(rows[i + 1].label)) {
                        paired.push({ label: rows[i].label, value: rows[i + 1].label });
                        i++;
                      } else {
                        paired.push(rows[i]);
                      }
                    }
                    return (
                      <>
                        {header && (
                          <div className="flex justify-end text-sm font-semibold text-gray-700 pb-1 mb-1 border-b border-gray-200">{header}</div>
                        )}
                        {paired.map((row, idx) => (
                          <div key={idx} className={`flex justify-between items-center py-1.5 text-sm ${idx < paired.length - 1 ? "border-b border-gray-100" : ""}`}>
                            <span className="text-gray-600">{row.label}</span>
                            <span className="font-medium text-gray-800 text-right">{row.value}</span>
                          </div>
                        ))}
                      </>
                    );
                  })()}
                </div>
              </AccordionSection>
            )}
            {product.nutritionalClaims?.trim() && (
              <AccordionSection title="Nutritional Claims" icon={<Award className="h-5 w-5" />} color={themeColor}>
                <div className="flex flex-wrap gap-x-3 gap-y-1.5 items-center">
                  {product.nutritionalClaims.split(/[\n,]+/).filter(f => f.trim()).map((item, i) => (
                    <span key={i} className="flex items-center gap-1.5 text-sm text-gray-600">
                      <span className="h-2 w-2 rounded-full flex-shrink-0 bg-gray-400" />
                      {item.trim()}
                    </span>
                  ))}
                </div>
              </AccordionSection>
            )}
            {product.storageUsage?.trim() && (
              <AccordionSection title="Storage And Usage Statements" icon={<Thermometer className="h-5 w-5" />} color={themeColor}>
                {product.storageUsage}
              </AccordionSection>
            )}
            {product.storageConditions?.trim() && (
              <AccordionSection title="Storage Conditions" icon={<Thermometer className="h-5 w-5" />} color={themeColor}>
                {product.storageConditions}
              </AccordionSection>
            )}
            {product.storageType?.trim() && (
              <AccordionSection title="Storage Type" icon={<Package className="h-5 w-5" />} color={themeColor}>
                {product.storageType}
              </AccordionSection>
            )}
            {product.country?.trim() && (
              <AccordionSection title="Country" icon={<MapPinIcon className="h-5 w-5" />} color={themeColor}>
                <div className="space-y-1.5">
                  {product.country.split(/[\n]+/).filter(f => f.trim()).map((line, i) => {
                    const parts = line.split(/\t+|  +/);
                    if (parts.length >= 2) {
                      return (
                        <div key={i} className="flex justify-between items-center text-sm text-gray-600">
                          <span>{parts[0].trim()}</span>
                          <span className="font-medium text-gray-800">{parts.slice(1).join(" ").trim()}</span>
                        </div>
                      );
                    }
                    return <div key={i} className="text-sm text-gray-600">{line.trim()}</div>;
                  })}
                </div>
              </AccordionSection>
            )}
            {product.companyName?.trim() && (
              <AccordionSection title="Company Name" icon={<Building2 className="h-5 w-5" />} color={themeColor}>
                {product.companyName}
              </AccordionSection>
            )}
            {product.companyAddress?.trim() && (
              <AccordionSection title="Company Address" icon={<MapPinIcon className="h-5 w-5" />} color={themeColor}>
                {product.companyAddress}
              </AccordionSection>
            )}
            {product.manufacturer?.trim() && (
              <AccordionSection title="Manufacturer" icon={<Factory className="h-5 w-5" />} color={themeColor}>
                {product.manufacturer}
              </AccordionSection>
            )}
            {product.moreInformation?.trim() && (
              <AccordionSection title="More Information" icon={<Info className="h-5 w-5" />} color={themeColor}>
                {product.moreInformation}
              </AccordionSection>
            )}
            {(product as any).nutrition?.trim() && (
              <AccordionSection title="Nutrition" icon={<Apple className="h-5 w-5" />} color={themeColor}>
                {(product as any).nutrition}
              </AccordionSection>
            )}
            {product.disclaimer?.trim() && (
              <AccordionSection title="Disclaimer" icon={<AlertTriangle className="h-5 w-5" />} color={themeColor}>
                {product.disclaimer}
              </AccordionSection>
            )}
          </div>

          {product.weight && <p className="text-xs text-teal-600 font-semibold bg-teal-50 inline-block px-1.5 py-0.5 rounded pt-2 text-center">{product.weight}</p>}
        </div>
      </div>
    </div>
  );
}

function CartPanel({ cart, currency, themeColor, cartTotal, deliveryCharge, discount, grandTotal, freeThreshold, discountThreshold, discountPercent, collectionDiscountPercent, collectionDiscountThreshold, vatRate, vatAmount, cutleryPrice, cutleryCharge, wantCutlery, setWantCutlery, orderType, setOrderType, specialInstructions, setSpecialInstructions, estimatedDeliveryTime, paymentMethod, setPaymentMethod, updateQuantity, removeFromCart, checkoutStep, setCheckoutStep, customerForm, setCustomerForm, handleCheckout, clientSecret, orderId, orderTotal, stripeInstance, onPaymentSuccess, onClose, isAcceptingOrders = true, whatsappNumber, branchName, storeLanguage }: any) {
  const { t, isRtl } = useTranslations(storeLanguage);
  if (checkoutStep === "success") {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6" style={{ backgroundColor: `${themeColor}20` }}>
          <CheckCircle className="h-10 w-10" style={{ color: themeColor }} />
        </div>
        <h2 className="text-2xl font-bold mb-2">{t("orderConfirmed")}</h2>
        <p className="text-gray-500 mb-6">{t("orderThankYou")}</p>
        <p className="text-sm text-gray-400 mb-4">{t("orderNumber")}: {orderId}</p>
        <a href={`/grocery-track/${orderId}`} target="_blank" rel="noopener noreferrer" className="mb-3">
          <Button className="rounded-xl gap-2" style={{ backgroundColor: themeColor }} data-testid="button-track-order">
            <MapPin className="h-4 w-4" /> Track Your Order
          </Button>
        </a>
        {whatsappNumber && (
          <a
            href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hi ${branchName || ""}! I just placed order ${orderId}. Please confirm.`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-3"
          >
            <Button className="rounded-xl gap-2 bg-green-600 hover:bg-green-700" data-testid="button-whatsapp-order">
              <MessageCircle className="h-4 w-4" /> {t("whatsappOrder")}
            </Button>
          </a>
        )}
        <Button variant="outline" onClick={() => { setCheckoutStep("cart"); onClose(); }} className="rounded-xl" data-testid="button-continue-shopping">
          {t("continueShopping")}
        </Button>
      </div>
    );
  }

  if (checkoutStep === "payment" && clientSecret && stripeInstance) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setCheckoutStep("checkout")}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-lg font-bold">{t("cardPayment")}</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-4 p-4 rounded-xl border bg-gray-50">
            <div className="flex justify-between text-sm mb-1"><span>Total</span><span className="font-bold text-lg">{currency}{orderTotal}</span></div>
          </div>
          <Elements stripe={stripeInstance} options={{ clientSecret, appearance: { theme: "stripe" } }}>
            <CheckoutForm orderId={orderId} total={orderTotal} currency={currency} onSuccess={onPaymentSuccess} />
          </Elements>
        </div>
      </div>
    );
  }

  if (checkoutStep === "checkout") {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setCheckoutStep("cart")} data-testid="button-back-to-cart">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-lg font-bold">{t("checkout")}</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          <div>
            <Label className="text-sm font-bold text-gray-700 mb-2 block">{t("orderType")}</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => { setOrderType("delivery"); setPaymentMethod("card"); }}
                className={`p-3 rounded-xl border-2 text-center transition-all ${orderType === "delivery" ? "border-current shadow-md" : "border-gray-200 hover:border-gray-300"}`}
                style={orderType === "delivery" ? { borderColor: themeColor, backgroundColor: `${themeColor}08` } : {}}
                data-testid="button-order-delivery"
              >
                <Truck className="h-5 w-5 mx-auto mb-1" style={orderType === "delivery" ? { color: themeColor } : { color: "#9ca3af" }} />
                <span className="text-sm font-bold" style={orderType === "delivery" ? { color: themeColor } : {}}>{t("forDelivery")}</span>
              </button>
              <button
                onClick={() => setOrderType("collection")}
                className={`p-3 rounded-xl border-2 text-center transition-all ${orderType === "collection" ? "border-current shadow-md" : "border-gray-200 hover:border-gray-300"}`}
                style={orderType === "collection" ? { borderColor: themeColor, backgroundColor: `${themeColor}08` } : {}}
                data-testid="button-order-collection"
              >
                <Store className="h-5 w-5 mx-auto mb-1" style={orderType === "collection" ? { color: themeColor } : { color: "#9ca3af" }} />
                <span className="text-sm font-bold" style={orderType === "collection" ? { color: themeColor } : {}}>{t("collection")}</span>
              </button>
            </div>
          </div>

          {orderType === "delivery" && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-200">
              <Clock className="h-4 w-4 text-blue-600 shrink-0" />
              <span className="text-sm text-blue-700">Estimated Delivery Time: <strong>{estimatedDeliveryTime}</strong></span>
            </div>
          )}

          <div>
            <Label className="flex items-center gap-2 mb-1.5 text-sm font-bold text-gray-700"><User className="h-3.5 w-3.5" /> {t("fullName")} *</Label>
            <Input value={customerForm.name} onChange={e => setCustomerForm({ ...customerForm, name: e.target.value })} placeholder="Enter your full name" className="rounded-xl" data-testid="input-customer-name" />
          </div>

          <div>
            <Label className="flex items-center gap-2 mb-1.5 text-sm font-bold text-gray-700"><Phone className="h-3.5 w-3.5" /> {t("phoneNumber")} *</Label>
            <div className="flex gap-2">
              <div className="flex items-center px-3 rounded-xl border bg-gray-50 text-sm font-medium text-gray-600 shrink-0">+44</div>
              <Input value={customerForm.phone} onChange={e => setCustomerForm({ ...customerForm, phone: e.target.value })} placeholder="7XXX XXX XXX" className="rounded-xl" data-testid="input-customer-phone" />
            </div>
          </div>

          {orderType === "delivery" && (
            <>
              <div>
                <Label className="flex items-center gap-2 mb-1.5 text-sm font-bold text-gray-700"><MapPin className="h-3.5 w-3.5" /> {t("deliveryAddress")} *</Label>
                <Input value={customerForm.address} onChange={e => setCustomerForm({ ...customerForm, address: e.target.value })} placeholder="House number and street" className="rounded-xl" data-testid="input-customer-address" />
              </div>
              <div>
                <Label className="flex items-center gap-2 mb-1.5 text-sm font-bold text-gray-700"><Navigation className="h-3.5 w-3.5" /> {t("postcode")} *</Label>
                <Input value={customerForm.postcode} onChange={e => setCustomerForm({ ...customerForm, postcode: e.target.value.toUpperCase() })} placeholder="E.G. WD18 0AB" className="rounded-xl" data-testid="input-customer-postcode" />
              </div>
            </>
          )}

          <div>
            <Label className="text-sm font-bold text-gray-700 mb-2 block">{t("paymentMethod")}</Label>
            {orderType === "delivery" ? (
              <div className="p-3 rounded-xl border-2 text-center shadow-md" style={{ borderColor: themeColor, backgroundColor: `${themeColor}08` }}>
                <CreditCard className="h-5 w-5 mx-auto mb-1" style={{ color: themeColor }} />
                <span className="text-sm font-bold" style={{ color: themeColor }}>{t("cardPayment")}</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setPaymentMethod("cash")}
                  className={`p-3 rounded-xl border-2 text-center transition-all ${paymentMethod === "cash" ? "shadow-md" : "border-gray-200 hover:border-gray-300"}`}
                  style={paymentMethod === "cash" ? { borderColor: themeColor, backgroundColor: `${themeColor}08` } : {}}
                  data-testid="button-pay-cash"
                >
                  <Banknote className="h-5 w-5 mx-auto mb-1" style={paymentMethod === "cash" ? { color: themeColor } : { color: "#9ca3af" }} />
                  <span className="text-sm font-bold" style={paymentMethod === "cash" ? { color: themeColor } : {}}>{t("payWithCash")}</span>
                </button>
                <button
                  onClick={() => setPaymentMethod("card")}
                  className={`p-3 rounded-xl border-2 text-center transition-all ${paymentMethod === "card" ? "shadow-md" : "border-gray-200 hover:border-gray-300"}`}
                  style={paymentMethod === "card" ? { borderColor: themeColor, backgroundColor: `${themeColor}08` } : {}}
                  data-testid="button-pay-card"
                >
                  <CreditCard className="h-5 w-5 mx-auto mb-1" style={paymentMethod === "card" ? { color: themeColor } : { color: "#9ca3af" }} />
                  <span className="text-sm font-bold" style={paymentMethod === "card" ? { color: themeColor } : {}}>{t("payWithCard")}</span>
                </button>
              </div>
            )}
          </div>

          <div className="rounded-xl border bg-gray-50 overflow-hidden">
            <div className="p-3 border-b bg-white">
              <h3 className="text-sm font-bold text-gray-700">{t("orderSummary")}</h3>
            </div>
            <div className="p-3 space-y-2">
              {cart.map((item: CartItem) => (
                <div key={item.product.id} className="flex justify-between text-sm">
                  <span className="text-gray-600">{item.quantity}x {item.product.name}</span>
                  <span className="font-medium">{currency}{(parseFloat(item.product.nowPrice) * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t pt-2 mt-2 space-y-1">
                <div className="flex justify-between text-sm"><span className="text-gray-500">{t("subtotal")}</span><span>{currency}{cartTotal.toFixed(2)}</span></div>
                {orderType === "delivery" && <div className="flex justify-between text-sm"><span className="text-gray-500">{t("delivery")}</span><span>{deliveryCharge > 0 ? `${currency}${deliveryCharge.toFixed(2)}` : <span className="text-green-600 font-medium">{t("free")}</span>}</span></div>}
                {discount > 0 && <div className="flex justify-between text-sm text-green-600"><span>{t("discount")} ({orderType === "collection" ? `${collectionDiscountPercent}%` : `${discountPercent}%`})</span><span>-{currency}{discount.toFixed(2)}</span></div>}
                {vatAmount > 0 && <div className="flex justify-between text-sm"><span className="text-gray-500">{t("vat")} ({vatRate}%)</span><span>{currency}{vatAmount.toFixed(2)}</span></div>}
                <div className="flex justify-between font-bold text-base pt-2 border-t">
                  <span>{t("total")}</span>
                  <span>{currency}{grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t bg-white">
          <Button
            className="w-full h-12 text-base font-bold rounded-xl gap-2"
            style={{ backgroundColor: themeColor }}
            onClick={handleCheckout}
            data-testid="button-place-order"
          >
            {paymentMethod === "card" ? (
              <><CreditCard className="h-5 w-5" /> {t("payWithCard")} - {currency}{grandTotal.toFixed(2)}</>
            ) : (
              <><Banknote className="h-5 w-5" /> {t("placeOrder")} - {currency}{grandTotal.toFixed(2)}</>
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" /> {t("cart")} ({cart.length} {cart.length === 1 ? t("item") : t("items")})
          </SheetTitle>
        </SheetHeader>
      </div>

      {cart.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <ShoppingCart className="h-16 w-16 text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg">{t("cartEmpty")}</p>
          <p className="text-gray-400 text-sm mt-1">{t("continueShopping")}</p>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {orderType === "collection" && cartTotal >= collectionDiscountThreshold && (
              <div className="p-2.5 rounded-xl bg-green-50 border border-green-200 text-green-700 text-xs flex items-center gap-2">
                <Sparkles className="h-4 w-4 shrink-0" />
                <span><strong>{collectionDiscountPercent}% discount</strong> applied on collection over {currency}{collectionDiscountThreshold.toFixed(2)}!</span>
              </div>
            )}
            {orderType === "collection" && cartTotal < collectionDiscountThreshold && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                <Sparkles className="h-4 w-4 shrink-0" />
                <span>{collectionDiscountPercent}% discount over {currency}{collectionDiscountThreshold.toFixed(2)} on collection</span>
              </div>
            )}

            {cart.map((item: CartItem) => (
              <div key={item.product.id} className="flex gap-3 p-3 rounded-xl border bg-white" data-testid={`cart-item-${item.product.id}`}>
                <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                  {item.product.image1 ? (
                    <img src={item.product.image1} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Package className="h-6 w-6 text-gray-300" /></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm leading-tight line-clamp-2">{item.product.name}</h4>
                  <p className="font-bold text-sm mt-1" style={{ color: themeColor }}>{currency}{item.product.nowPrice}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQuantity(item.product.id, -1)}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="font-bold text-sm min-w-[20px] text-center">{item.quantity}</span>
                    <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQuantity(item.product.id, 1)}>
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 ml-auto" onClick={() => removeFromCart(item.product.id)}>
                      <Trash2 className="h-3 w-3 text-red-500" />
                    </Button>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-sm">{currency}{(parseFloat(item.product.nowPrice) * item.quantity).toFixed(2)}</p>
                </div>
              </div>
            ))}

            <div>
              <Label className="text-xs font-medium text-gray-500 mb-1 block">Special Instructions (optional)</Label>
              <Textarea
                value={specialInstructions}
                onChange={e => setSpecialInstructions(e.target.value)}
                placeholder="e.g., Wheelchair access, high chair needed, dietary requirements, allergies..."
                rows={2}
                className="rounded-xl text-sm resize-none"
                data-testid="input-special-instructions"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setOrderType("delivery")}
                className={`p-2.5 rounded-xl border-2 text-center transition-all ${orderType === "delivery" ? "shadow-sm" : "border-gray-200 hover:border-gray-300"}`}
                style={orderType === "delivery" ? { borderColor: themeColor, backgroundColor: `${themeColor}08` } : {}}
                data-testid="button-cart-delivery"
              >
                <Truck className="h-4 w-4 mx-auto mb-0.5" style={orderType === "delivery" ? { color: themeColor } : { color: "#9ca3af" }} />
                <span className="text-xs font-bold" style={orderType === "delivery" ? { color: themeColor } : {}}>{t("forDelivery")}</span>
                {deliveryCharge > 0 && orderType === "delivery" && <p className="text-[10px] text-gray-400 mt-0.5">{currency}{deliveryCharge.toFixed(2)}</p>}
              </button>
              <button
                onClick={() => setOrderType("collection")}
                className={`p-2.5 rounded-xl border-2 text-center transition-all ${orderType === "collection" ? "shadow-sm" : "border-gray-200 hover:border-gray-300"}`}
                style={orderType === "collection" ? { borderColor: themeColor, backgroundColor: `${themeColor}08` } : {}}
                data-testid="button-cart-collection"
              >
                <Store className="h-4 w-4 mx-auto mb-0.5" style={orderType === "collection" ? { color: themeColor } : { color: "#9ca3af" }} />
                <span className="text-xs font-bold" style={orderType === "collection" ? { color: themeColor } : {}}>{t("collection")}</span>
                <p className="text-[10px] text-green-600 mt-0.5 font-medium">{t("save")}</p>
              </button>
            </div>
          </div>

          <div className="p-4 border-t bg-white">
            {orderType === "delivery" && cartTotal < freeThreshold && cartTotal > 0 && (
              <div className="mb-3 p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-xs flex items-center gap-1">
                <Truck className="h-3 w-3 shrink-0" />
                <span>{t("spendMore", { amount: `${currency}${(freeThreshold - cartTotal).toFixed(2)}` })}</span>
              </div>
            )}
            <div className="space-y-1 mb-4 text-sm">
              <div className="flex justify-between"><span>{t("subtotal")}</span><span>{currency}{cartTotal.toFixed(2)}</span></div>
              {orderType === "delivery" && <div className="flex justify-between"><span>{t("delivery")}</span><span>{deliveryCharge > 0 ? `${currency}${deliveryCharge.toFixed(2)}` : <span className="text-green-600 font-medium">{t("free")}</span>}</span></div>}
              {discount > 0 && <div className="flex justify-between text-green-600"><span>{t("discount")} ({orderType === "collection" ? `${collectionDiscountPercent}%` : `${discountPercent}%`})</span><span>-{currency}{discount.toFixed(2)}</span></div>}
              {vatAmount > 0 && <div className="flex justify-between text-gray-500"><span>{t("vat")} ({vatRate}%)</span><span>{currency}{vatAmount.toFixed(2)}</span></div>}
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>{t("total")}</span>
                <span>{currency}{grandTotal.toFixed(2)}</span>
              </div>
            </div>
            {!isAcceptingOrders ? (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
                <XCircle className="h-5 w-5 text-red-500 mx-auto mb-1" />
                <p className="text-red-600 font-semibold text-sm">{t("storeClosed")}</p>
              </div>
            ) : (
              <Button className="w-full h-12 text-lg font-bold rounded-xl gap-2" style={{ backgroundColor: themeColor }} onClick={() => setCheckoutStep("checkout")} data-testid="button-go-to-checkout">
                {t("checkout")}
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
