import { sql } from "@/lib/db"

// Subscription plan definitions
export const SUBSCRIPTION_PLANS = {
  free: {
    id: "free",
    name: "Free",
    price: 0,
    messagesIncluded: 10,
    imagesIncluded: 0,
    videosIncluded: 0,
    websitesIncluded: 0,
    features: [
      "10 AI messages",
      "Code preview",
      "Copy code manually",
    ],
  },
  basic: {
    id: "basic",
    name: "Basic",
    price: 9,
    messagesIncluded: 100,
    imagesIncluded: 10,
    videosIncluded: 2,
    websitesIncluded: 0,
    features: [
      "100 AI messages/month",
      "10 image uploads",
      "2 video uploads",
      "Code preview",
      "Email support",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    price: 19,
    messagesIncluded: 500,
    imagesIncluded: 50,
    videosIncluded: 10,
    websitesIncluded: 1,
    features: [
      "500 AI messages/month",
      "50 image uploads",
      "10 video uploads",
      "1 website hosting",
      "Custom subdomain",
      "Admin panel",
      "Priority support",
    ],
  },
  business: {
    id: "business",
    name: "Business",
    price: 29,
    messagesIncluded: -1, // Unlimited
    imagesIncluded: -1, // Unlimited
    videosIncluded: 50,
    websitesIncluded: 3,
    features: [
      "Unlimited AI messages",
      "Unlimited image uploads",
      "50 video uploads",
      "3 websites hosting",
      "Custom subdomain",
      "Custom domain support",
      "Admin panel",
      "White-label option",
      "Priority support",
    ],
  },
} as const

export type PlanId = keyof typeof SUBSCRIPTION_PLANS

// Get plan by ID
export function getPlan(planId: string) {
  return SUBSCRIPTION_PLANS[planId as PlanId] || SUBSCRIPTION_PLANS.free
}

// Check if user has access to a feature based on their plan
export function hasFeature(planId: string, feature: string): boolean {
  const plan = getPlan(planId)
  return plan.features.includes(feature)
}

// Check usage limits
export function checkUsageLimit(
  planId: string,
  type: "messages" | "images" | "videos" | "websites",
  currentUsage: number
): { allowed: boolean; limit: number; remaining: number } {
  const plan = getPlan(planId)
  
  let limit: number
  switch (type) {
    case "messages":
      limit = plan.messagesIncluded
      break
    case "images":
      limit = plan.imagesIncluded
      break
    case "videos":
      limit = plan.videosIncluded
      break
    case "websites":
      limit = plan.websitesIncluded
      break
  }
  
  // -1 means unlimited
  if (limit === -1) {
    return { allowed: true, limit: -1, remaining: -1 }
  }
  
  const remaining = Math.max(0, limit - currentUsage)
  return {
    allowed: currentUsage < limit,
    limit,
    remaining,
  }
}

// Initialize plans in database
export async function initializePlans() {
  for (const [planId, plan] of Object.entries(SUBSCRIPTION_PLANS)) {
    await sql`
      INSERT INTO pricing_plans (
        plan_id, name, price_usd, price_gbp, price_eur,
        messages_included, features, is_active
      )
      VALUES (
        ${planId},
        ${plan.name},
        ${plan.price},
        ${Math.round(plan.price * 0.79)},
        ${Math.round(plan.price * 0.92)},
        ${plan.messagesIncluded},
        ${JSON.stringify(plan.features)},
        true
      )
      ON CONFLICT (plan_id) DO UPDATE SET
        name = EXCLUDED.name,
        price_usd = EXCLUDED.price_usd,
        features = EXCLUDED.features,
        updated_at = NOW()
    `
  }
}
