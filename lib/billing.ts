// Billing Plans Configuration
export const BILLING_PLANS = {
  starter: {
    id: "starter",
    name: "Starter",
    price: { GBP: 0, USD: 0, EUR: 0, PKR: 0 },
    messagesIncluded: 10,
    extraMessageCost: { GBP: 0, USD: 0, EUR: 0, PKR: 0 }, // No extra messages allowed
    features: [
      "10 total preview messages",
      "Basic AI responses",
      "No source code output",
      "Community support"
    ],
    isPopular: false,
    allowExtraMessages: false
  },
  basic: {
    id: "basic",
    name: "Basic",
    price: { GBP: 2, USD: 3, EUR: 3, PKR: 1000 },
    messagesIncluded: 100,
    extraMessageCost: { GBP: 0.15, USD: 0.19, EUR: 0.17, PKR: 52 },
    features: [
      "100 AI messages/month",
      "Full AI capabilities",
      "Source code output",
      "Email support",
      "Extra messages £0.15 each"
    ],
    isPopular: false,
    allowExtraMessages: true
  },
  pro: {
    id: "pro",
    name: "Pro",
    price: { GBP: 20, USD: 26, EUR: 24, PKR: 7000 },
    messagesIncluded: 300,
    extraMessageCost: { GBP: 0.10, USD: 0.13, EUR: 0.12, PKR: 35 },
    features: [
      "300 AI messages/month",
      "Priority AI processing",
      "Advanced source code",
      "Priority email support",
      "Extra messages £0.10 each",
      "API access"
    ],
    isPopular: true,
    allowExtraMessages: true
  },
  business: {
    id: "business",
    name: "Business",
    price: { GBP: 40, USD: 52, EUR: 48, PKR: 14000 },
    messagesIncluded: 2000,
    extraMessageCost: { GBP: 0.05, USD: 0.065, EUR: 0.06, PKR: 17 },
    features: [
      "2000 AI messages/month",
      "Team collaboration",
      "Custom AI models",
      "Phone support",
      "Extra messages £0.05 each",
      "Full API access",
      "Analytics dashboard"
    ],
    isPopular: false,
    allowExtraMessages: true
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    price: { GBP: 99, USD: 129, EUR: 119, PKR: 35000 },
    messagesIncluded: 3000,
    extraMessageCost: { GBP: 0.03, USD: 0.039, EUR: 0.036, PKR: 10 },
    features: [
      "3000 AI messages/month",
      "Unlimited team members",
      "Custom AI training",
      "Dedicated support",
      "Extra messages £0.03 each",
      "White-label options",
      "SLA guarantee",
      "On-premise deployment"
    ],
    isPopular: false,
    allowExtraMessages: true
  }
} as const

export type PlanId = keyof typeof BILLING_PLANS
export type Currency = "GBP" | "USD" | "EUR" | "PKR"

// Currency symbols
export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  GBP: "£",
  USD: "$",
  EUR: "€",
  PKR: "Rs"
}

// Country to currency mapping
export const COUNTRY_CURRENCY_MAP: Record<string, Currency> = {
  GB: "GBP",
  UK: "GBP",
  US: "GBP", // Changed to GBP as default
  PK: "PKR",
  // European countries
  DE: "EUR",
  FR: "EUR",
  IT: "EUR",
  ES: "EUR",
  NL: "EUR",
  BE: "EUR",
  AT: "EUR",
  PT: "EUR",
  IE: "EUR",
  FI: "EUR",
  GR: "EUR",
  // Default fallback
  DEFAULT: "GBP"
}

// Get currency from country code
export function getCurrencyFromCountry(countryCode: string): Currency {
  return COUNTRY_CURRENCY_MAP[countryCode?.toUpperCase()] || COUNTRY_CURRENCY_MAP.DEFAULT
}

// Format price for display
export function formatPrice(amount: number, currency: Currency): string {
  const symbol = CURRENCY_SYMBOLS[currency]
  if (currency === "PKR") {
    return `${symbol}${amount.toLocaleString()}`
  }
  return `${symbol}${amount.toFixed(2)}`
}

// Check if user has exceeded free trial
export function hasExceededFreeTrial(messagesUsed: number): boolean {
  return messagesUsed >= BILLING_PLANS.starter.messagesIncluded
}

// Calculate extra usage cost
export function calculateExtraUsageCost(
  plan: PlanId,
  messagesUsed: number,
  currency: Currency
): number {
  const planConfig = BILLING_PLANS[plan]
  const extraMessages = Math.max(0, messagesUsed - planConfig.messagesIncluded)
  
  if (!planConfig.allowExtraMessages || extraMessages === 0) {
    return 0
  }
  
  return extraMessages * planConfig.extraMessageCost[currency]
}

// Get remaining messages
export function getRemainingMessages(plan: PlanId, messagesUsed: number): number {
  const planConfig = BILLING_PLANS[plan]
  return Math.max(0, planConfig.messagesIncluded - messagesUsed)
}
