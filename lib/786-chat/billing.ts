import "server-only"

import { sql } from "@/lib/db"

export type BuilderPlanId = "free" | "pro" | "business"

export type BuilderPlan = {
  id: BuilderPlanId
  name: string
  monthlyPriceGbp: number
  messagesIncluded: number
  projects: number
  deploymentsPerMonth: number
  customDomains: number
  teamMembers: number
  features: string[]
}

export const BUILDER_PLANS: Record<BuilderPlanId, BuilderPlan> = {
  free: {
    id: "free",
    name: "Free",
    monthlyPriceGbp: 0,
    messagesIncluded: 20,
    projects: 3,
    deploymentsPerMonth: 0,
    customDomains: 0,
    teamMembers: 1,
    features: ["3 private projects", "20 AI generations/month", "Code and visual editing", "Preview builds"],
  },
  pro: {
    id: "pro",
    name: "Pro",
    monthlyPriceGbp: 20,
    messagesIncluded: 500,
    projects: 20,
    deploymentsPerMonth: 20,
    customDomains: 3,
    teamMembers: 1,
    features: ["20 private projects", "500 AI generations/month", "Production deployments", "3 custom domains", "Priority builds"],
  },
  business: {
    id: "business",
    name: "Business",
    monthlyPriceGbp: 40,
    messagesIncluded: 3000,
    projects: 100,
    deploymentsPerMonth: 200,
    customDomains: 20,
    teamMembers: 10,
    features: ["100 private projects", "3,000 AI generations/month", "200 deployments/month", "20 custom domains", "10 team members"],
  },
}

export const BUILDER_CREDIT_PACKAGES = {
  small: { id: "small", credits: 50, priceGbp: 5 },
  medium: { id: "medium", credits: 150, priceGbp: 12 },
  large: { id: "large", credits: 500, priceGbp: 35 },
} as const

export type BuilderCreditPackageId = keyof typeof BUILDER_CREDIT_PACKAGES

export type BuilderSubscription = {
  plan: BuilderPlanId
  planConfig: BuilderPlan
  status: string
  messages_used: number
  messages_limit: number
  extra_credits: number
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  current_period_start: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
}

export function normalizeBuilderPlan(value: string | null | undefined): BuilderPlanId {
  const plan = String(value || "free").toLowerCase()
  if (plan === "business" || plan === "enterprise") return "business"
  if (plan === "pro" || plan === "basic" || plan === "builder" || plan === "publish") return "pro"
  return "free"
}

export function builderPlan(value: string | null | undefined) {
  return BUILDER_PLANS[normalizeBuilderPlan(value)]
}

export async function getBuilderSubscription(userId: string): Promise<BuilderSubscription> {
  const rows = (await sql`
    SELECT plan, status, messages_used, messages_limit, extra_credits,
           stripe_customer_id, stripe_subscription_id, current_period_start,
           current_period_end, cancel_at_period_end
    FROM subscriptions
    WHERE user_id = ${userId}::uuid
    LIMIT 1
  `) as unknown as Array<Record<string, unknown>>
  const row = rows[0] || {}
  const plan = builderPlan(String(row.plan || "free"))
  return {
    plan: plan.id,
    planConfig: plan,
    status: String(row.status || "active"),
    messages_used: Number(row.messages_used || 0),
    messages_limit: Number(row.messages_limit || plan.messagesIncluded),
    extra_credits: Number(row.extra_credits || 0),
    stripe_customer_id: typeof row.stripe_customer_id === "string" ? row.stripe_customer_id : null,
    stripe_subscription_id: typeof row.stripe_subscription_id === "string" ? row.stripe_subscription_id : null,
    current_period_start: typeof row.current_period_start === "string" ? row.current_period_start : null,
    current_period_end: typeof row.current_period_end === "string" ? row.current_period_end : null,
    cancel_at_period_end: Boolean(row.cancel_at_period_end),
  }
}

export function trustedBillingOrigin(request: Request) {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (configured) {
    const url = new URL(configured)
    if (url.protocol === "https:") return url.origin
  }
  const requestUrl = new URL(request.url)
  if (
    requestUrl.protocol === "https:" &&
    (requestUrl.hostname === "786.chat" || requestUrl.hostname.endsWith(".vercel.app"))
  ) return requestUrl.origin
  return "https://786.chat"
}

export async function builderPlanUsage(input: { userId: string; ownerEmail: string }) {
  const subscription = await getBuilderSubscription(input.userId)
  const rows = (await sql`
    SELECT
      (SELECT COUNT(*) FROM admin_projects
        WHERE owner_email = ${input.ownerEmail.toLowerCase().trim()} AND kind = '786chat') AS projects,
      (SELECT COUNT(*) FROM admin_project_deployment_versions v
        INNER JOIN admin_projects p ON p.id = v.project_id
        WHERE p.owner_email = ${input.ownerEmail.toLowerCase().trim()}
          AND v.published_at >= DATE_TRUNC('month', CURRENT_DATE)) AS deployments_month,
      (SELECT COUNT(*) FROM admin_project_domains d
        WHERE d.owner_email = ${input.ownerEmail.toLowerCase().trim()}
          AND d.address_type = 'custom' AND d.status != 'removed') AS custom_domains
  `) as unknown as Array<{ projects: number; deployments_month: number; custom_domains: number }>
  return {
    subscription,
    usage: {
      projects: Number(rows[0]?.projects || 0),
      deploymentsThisMonth: Number(rows[0]?.deployments_month || 0),
      customDomains: Number(rows[0]?.custom_domains || 0),
    },
  }
}
