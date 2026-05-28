"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { 
  SUPPORTED_LANGUAGES, 
  type LanguageCode, 
  t as translate, 
  getBrowserLanguage,
  detectUserCountry
} from "@/lib/i18n"
import { 
  getCurrencyFromCountry, 
  type Currency 
} from "@/lib/billing"

interface I18nContextType {
  language: LanguageCode
  setLanguage: (lang: LanguageCode) => void
  t: (key: string) => string
  currency: Currency
  setCurrency: (currency: Currency) => void
  country: string
  languages: typeof SUPPORTED_LANGUAGES
  isRTL: boolean
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>("en")
  const [currency, setCurrencyState] = useState<Currency>("GBP")
  const [country, setCountry] = useState<string>("GB")
  const [mounted, setMounted] = useState(false)

  // RTL languages
  const rtlLanguages: LanguageCode[] = ["ar", "he", "ur", "fa"]
  const isRTL = rtlLanguages.includes(language)

  useEffect(() => {
    setMounted(true)
    
    // Load saved preferences
    const savedLang = localStorage.getItem("mujeebproai_language") as LanguageCode
    const savedCurrency = localStorage.getItem("mujeebproai_currency") as Currency
    
    if (savedLang && savedLang in SUPPORTED_LANGUAGES) {
      setLanguageState(savedLang)
    } else {
      const browserLang = getBrowserLanguage()
      setLanguageState(browserLang)
    }
    
    if (savedCurrency) {
      setCurrencyState(savedCurrency)
    }

    // Detect country and set currency
    detectUserCountry().then((detectedCountry) => {
      setCountry(detectedCountry)
      if (!savedCurrency) {
        const detectedCurrency = getCurrencyFromCountry(detectedCountry)
        setCurrencyState(detectedCurrency)
      }
    })
  }, [])

  useEffect(() => {
    if (mounted) {
      // Update document direction for RTL languages
      document.documentElement.dir = isRTL ? "rtl" : "ltr"
      document.documentElement.lang = language
    }
  }, [language, isRTL, mounted])

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang)
    localStorage.setItem("mujeebproai_language", lang)
  }

  const setCurrency = (curr: Currency) => {
    setCurrencyState(curr)
    localStorage.setItem("mujeebproai_currency", curr)
  }

  const t = (key: string): string => {
    return translate(key, language)
  }

  if (!mounted) {
    return null
  }

  return (
    <I18nContext.Provider
      value={{
        language,
        setLanguage,
        t,
        currency,
        setCurrency,
        country,
        languages: SUPPORTED_LANGUAGES,
        isRTL
      }}
    >
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (context === undefined) {
    throw new Error("useI18n must be used within an I18nProvider")
  }
  return context
}
