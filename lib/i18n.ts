"use client"

// Supported languages (49 languages)
export const SUPPORTED_LANGUAGES = {
  en: { name: "English", nativeName: "English", flag: "🇬🇧" },
  es: { name: "Spanish", nativeName: "Español", flag: "🇪🇸" },
  fr: { name: "French", nativeName: "Français", flag: "🇫🇷" },
  de: { name: "German", nativeName: "Deutsch", flag: "🇩🇪" },
  it: { name: "Italian", nativeName: "Italiano", flag: "🇮🇹" },
  pt: { name: "Portuguese", nativeName: "Português", flag: "🇵🇹" },
  nl: { name: "Dutch", nativeName: "Nederlands", flag: "🇳🇱" },
  ru: { name: "Russian", nativeName: "Русский", flag: "🇷🇺" },
  zh: { name: "Chinese", nativeName: "中文", flag: "🇨🇳" },
  ja: { name: "Japanese", nativeName: "日本語", flag: "🇯🇵" },
  ko: { name: "Korean", nativeName: "한국어", flag: "🇰🇷" },
  ar: { name: "Arabic", nativeName: "العربية", flag: "🇸🇦" },
  hi: { name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳" },
  ur: { name: "Urdu", nativeName: "اردو", flag: "🇵🇰" },
  bn: { name: "Bengali", nativeName: "বাংলা", flag: "🇧🇩" },
  pa: { name: "Punjabi", nativeName: "ਪੰਜਾਬੀ", flag: "🇮🇳" },
  tr: { name: "Turkish", nativeName: "Türkçe", flag: "🇹🇷" },
  vi: { name: "Vietnamese", nativeName: "Tiếng Việt", flag: "🇻🇳" },
  th: { name: "Thai", nativeName: "ไทย", flag: "🇹🇭" },
  pl: { name: "Polish", nativeName: "Polski", flag: "🇵🇱" },
  uk: { name: "Ukrainian", nativeName: "Українська", flag: "🇺🇦" },
  ro: { name: "Romanian", nativeName: "Română", flag: "🇷🇴" },
  el: { name: "Greek", nativeName: "Ελληνικά", flag: "🇬🇷" },
  cs: { name: "Czech", nativeName: "Čeština", flag: "🇨🇿" },
  sv: { name: "Swedish", nativeName: "Svenska", flag: "🇸🇪" },
  hu: { name: "Hungarian", nativeName: "Magyar", flag: "🇭🇺" },
  fi: { name: "Finnish", nativeName: "Suomi", flag: "🇫🇮" },
  da: { name: "Danish", nativeName: "Dansk", flag: "🇩🇰" },
  no: { name: "Norwegian", nativeName: "Norsk", flag: "🇳🇴" },
  sk: { name: "Slovak", nativeName: "Slovenčina", flag: "🇸🇰" },
  bg: { name: "Bulgarian", nativeName: "Български", flag: "🇧🇬" },
  hr: { name: "Croatian", nativeName: "Hrvatski", flag: "🇭🇷" },
  sr: { name: "Serbian", nativeName: "Српски", flag: "🇷🇸" },
  sl: { name: "Slovenian", nativeName: "Slovenščina", flag: "🇸🇮" },
  lt: { name: "Lithuanian", nativeName: "Lietuvių", flag: "🇱🇹" },
  lv: { name: "Latvian", nativeName: "Latviešu", flag: "🇱🇻" },
  et: { name: "Estonian", nativeName: "Eesti", flag: "🇪🇪" },
  he: { name: "Hebrew", nativeName: "עברית", flag: "🇮🇱" },
  id: { name: "Indonesian", nativeName: "Bahasa Indonesia", flag: "🇮🇩" },
  ms: { name: "Malay", nativeName: "Bahasa Melayu", flag: "🇲🇾" },
  tl: { name: "Filipino", nativeName: "Filipino", flag: "🇵🇭" },
  sw: { name: "Swahili", nativeName: "Kiswahili", flag: "🇰🇪" },
  af: { name: "Afrikaans", nativeName: "Afrikaans", flag: "🇿🇦" },
  fa: { name: "Persian", nativeName: "فارسی", flag: "🇮🇷" },
  ta: { name: "Tamil", nativeName: "தமிழ்", flag: "🇮🇳" },
  te: { name: "Telugu", nativeName: "తెలుగు", flag: "🇮🇳" },
  mr: { name: "Marathi", nativeName: "मराठी", flag: "🇮🇳" },
  gu: { name: "Gujarati", nativeName: "ગુજરાતી", flag: "🇮🇳" },
  kn: { name: "Kannada", nativeName: "ಕನ್ನಡ", flag: "🇮🇳" },
} as const

export type LanguageCode = keyof typeof SUPPORTED_LANGUAGES

// Core translations
export const translations: Record<LanguageCode, Record<string, string>> = {
  en: {
    // Navigation
    "nav.home": "Home",
    "nav.features": "Features",
    "nav.pricing": "Pricing",
    "nav.about": "About",
    "nav.login": "Login",
    "nav.register": "Register",
    "nav.dashboard": "Dashboard",
    "nav.logout": "Logout",
    
    // Hero
    "hero.title": "The Future of AI is Here",
    "hero.subtitle": "Smart AI Solutions for Everyone",
    "hero.cta": "Get Started Free",
    "hero.cta2": "View Pricing",
    
    // Features
    "features.title": "Powerful AI Features",
    "features.subtitle": "Everything you need to build AI-powered applications",
    
    // Pricing
    "pricing.title": "Simple, Transparent Pricing",
    "pricing.subtitle": "Choose the plan that fits your needs",
    "pricing.starter": "Starter",
    "pricing.basic": "Basic",
    "pricing.pro": "Pro",
    "pricing.business": "Business",
    "pricing.enterprise": "Enterprise",
    "pricing.perMonth": "/month",
    "pricing.free": "Free",
    "pricing.getStarted": "Get Started",
    "pricing.currentPlan": "Current Plan",
    "pricing.upgrade": "Upgrade",
    "pricing.mostPopular": "Most Popular",
    
    // Auth
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.name": "Full Name",
    "auth.login": "Sign In",
    "auth.register": "Create Account",
    "auth.forgotPassword": "Forgot Password?",
    "auth.noAccount": "Don't have an account?",
    "auth.hasAccount": "Already have an account?",
    "auth.signUp": "Sign Up",
    "auth.signIn": "Sign In",
    
    // Dashboard
    "dashboard.welcome": "Welcome back",
    "dashboard.overview": "Overview",
    "dashboard.chat": "AI Chat",
    "dashboard.history": "History",
    "dashboard.settings": "Settings",
    "dashboard.profile": "Profile",
    "dashboard.billing": "Billing",
    "dashboard.usage": "Usage",
    
    // Usage
    "usage.messagesUsed": "Messages Used",
    "usage.messagesRemaining": "Messages Remaining",
    "usage.extraCost": "Extra Usage Cost",
    "usage.upgradeNow": "Upgrade Now",
    "usage.freeTrialEnded": "Free Trial Ended",
    "usage.upgradeMessage": "You have used all 5 free messages. Upgrade to continue.",
    
    // Common
    "common.loading": "Loading...",
    "common.error": "Error",
    "common.success": "Success",
    "common.cancel": "Cancel",
    "common.save": "Save",
    "common.delete": "Delete",
    "common.edit": "Edit",
    "common.close": "Close",
    "common.submit": "Submit",
    "common.continue": "Continue",
    "common.back": "Back",
    "common.next": "Next",
    
    // Footer
    "footer.rights": "All rights reserved",
    "footer.privacy": "Privacy Policy",
    "footer.terms": "Terms of Service",
    "footer.contact": "Contact Us",
  },
  ur: {
    "nav.home": "ہوم",
    "nav.features": "فیچرز",
    "nav.pricing": "قیمتیں",
    "nav.about": "ہمارے بارے میں",
    "nav.login": "لاگ ان",
    "nav.register": "رجسٹر",
    "nav.dashboard": "ڈیش بورڈ",
    "nav.logout": "لاگ آؤٹ",
    "hero.title": "AI کا مستقبل یہاں ہے",
    "hero.subtitle": "سب کے لیے سمارٹ AI حل",
    "hero.cta": "مفت شروع کریں",
    "hero.cta2": "قیمتیں دیکھیں",
    "features.title": "طاقتور AI فیچرز",
    "features.subtitle": "AI پاورڈ ایپلیکیشنز بنانے کے لیے آپ کو جو کچھ بھی چاہیے",
    "pricing.title": "سادہ، شفاف قیمتیں",
    "pricing.subtitle": "اپنی ضروریات کے مطابق پلان منتخب کریں",
    "pricing.starter": "سٹارٹر",
    "pricing.basic": "بیسک",
    "pricing.pro": "پرو",
    "pricing.business": "بزنس",
    "pricing.enterprise": "انٹرپرائز",
    "pricing.perMonth": "/ماہ",
    "pricing.free": "مفت",
    "pricing.getStarted": "شروع کریں",
    "pricing.currentPlan": "موجودہ پلان",
    "pricing.upgrade": "اپ گریڈ",
    "pricing.mostPopular": "سب سے مقبول",
    "auth.email": "ای میل",
    "auth.password": "پاس ورڈ",
    "auth.name": "پورا نام",
    "auth.login": "سائن ان",
    "auth.register": "اکاؤنٹ بنائیں",
    "auth.forgotPassword": "پاس ورڈ بھول گئے؟",
    "auth.noAccount": "اکاؤنٹ نہیں ہے؟",
    "auth.hasAccount": "پہلے سے اکاؤنٹ ہے؟",
    "auth.signUp": "سائن اپ",
    "auth.signIn": "سائن ان",
    "dashboard.welcome": "خوش آمدید",
    "dashboard.overview": "جائزہ",
    "dashboard.chat": "AI چیٹ",
    "dashboard.history": "تاریخ",
    "dashboard.settings": "ترتیبات",
    "dashboard.profile": "پروفائل",
    "dashboard.billing": "بلنگ",
    "dashboard.usage": "استعمال",
    "usage.messagesUsed": "استعمال شدہ پیغامات",
    "usage.messagesRemaining": "باقی پیغامات",
    "usage.extraCost": "اضافی استعمال کی لاگت",
    "usage.upgradeNow": "ابھی اپ گریڈ کریں",
    "usage.freeTrialEnded": "مفت ٹرائل ختم",
    "usage.upgradeMessage": "آپ نے تمام 5 مفت پیغامات استعمال کر لیے ہیں۔ جاری رکھنے کے لیے اپ گریڈ کریں۔",
    "common.loading": "لوڈ ہو رہا ہے...",
    "common.error": "غلطی",
    "common.success": "کامیابی",
    "common.cancel": "منسوخ",
    "common.save": "محفوظ کریں",
    "common.delete": "حذف کریں",
    "common.edit": "ترمیم",
    "common.close": "بند کریں",
    "common.submit": "جمع کرائیں",
    "common.continue": "جاری رکھیں",
    "common.back": "واپس",
    "common.next": "اگلا",
    "footer.rights": "جملہ حقوق محفوظ ہیں",
    "footer.privacy": "رازداری کی پالیسی",
    "footer.terms": "سروس کی شرائط",
    "footer.contact": "ہم سے رابطہ کریں",
  },
  // Add placeholder for other languages - they will use English as fallback
  es: {} as Record<string, string>,
  fr: {} as Record<string, string>,
  de: {} as Record<string, string>,
  it: {} as Record<string, string>,
  pt: {} as Record<string, string>,
  nl: {} as Record<string, string>,
  ru: {} as Record<string, string>,
  zh: {} as Record<string, string>,
  ja: {} as Record<string, string>,
  ko: {} as Record<string, string>,
  ar: {} as Record<string, string>,
  hi: {} as Record<string, string>,
  bn: {} as Record<string, string>,
  pa: {} as Record<string, string>,
  tr: {} as Record<string, string>,
  vi: {} as Record<string, string>,
  th: {} as Record<string, string>,
  pl: {} as Record<string, string>,
  uk: {} as Record<string, string>,
  ro: {} as Record<string, string>,
  el: {} as Record<string, string>,
  cs: {} as Record<string, string>,
  sv: {} as Record<string, string>,
  hu: {} as Record<string, string>,
  fi: {} as Record<string, string>,
  da: {} as Record<string, string>,
  no: {} as Record<string, string>,
  sk: {} as Record<string, string>,
  bg: {} as Record<string, string>,
  hr: {} as Record<string, string>,
  sr: {} as Record<string, string>,
  sl: {} as Record<string, string>,
  lt: {} as Record<string, string>,
  lv: {} as Record<string, string>,
  et: {} as Record<string, string>,
  he: {} as Record<string, string>,
  id: {} as Record<string, string>,
  ms: {} as Record<string, string>,
  tl: {} as Record<string, string>,
  sw: {} as Record<string, string>,
  af: {} as Record<string, string>,
  fa: {} as Record<string, string>,
  ta: {} as Record<string, string>,
  te: {} as Record<string, string>,
  mr: {} as Record<string, string>,
  gu: {} as Record<string, string>,
  kn: {} as Record<string, string>,
}

// Translation function
export function t(key: string, lang: LanguageCode = "en"): string {
  return translations[lang]?.[key] || translations.en[key] || key
}

// Get browser language
export function getBrowserLanguage(): LanguageCode {
  if (typeof window === "undefined") return "en"
  
  const browserLang = navigator.language.split("-")[0]
  if (browserLang in SUPPORTED_LANGUAGES) {
    return browserLang as LanguageCode
  }
  return "en"
}

// Detect country from timezone or IP
export async function detectUserCountry(): Promise<string> {
  try {
    // Try to detect from timezone first
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    
    if (timezone.includes("London") || timezone.includes("Europe/London")) return "GB"
    if (timezone.includes("Karachi") || timezone.includes("Asia/Karachi")) return "PK"
    if (timezone.includes("America")) return "US"
    if (timezone.includes("Europe")) return "EU"
    
    // Fallback to IP-based detection
    const response = await fetch("https://ipapi.co/json/")
    const data = await response.json()
    return data.country_code || "GB"
  } catch {
    return "GB" // Default to UK
  }
}
