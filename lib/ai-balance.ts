import { sql } from "@/lib/db"
import { isAdminUser } from "@/lib/admin-config"

export interface UserBalance {
  balance: number
  freeMessagesUsed: number
  freeMessagesLimit: number
  freeMessagesRemaining: number
  totalMessagesSent: number
  totalSpent: number
}

export interface PricingSettings {
  costPer1000Messages: number
  costPerMessage: number
  freeMessagesDefault: number
  markupPercentage: number
  minBalanceWarning: number
  topupAmounts: number[]
}

export interface CanSendResult {
  allowed: boolean
  reason?: string
  usingFreeMessage: boolean
  messageCost: number
  balanceAfter?: number
  freeMessagesRemaining?: number
}

const DEFAULT_FREE_LIMIT = 10
const OWNER_FREE_LIMIT = 999999999

const DEFAULT_PRICING: PricingSettings = {
  costPer1000Messages: 0.5,
  costPerMessage: 0.0005,
  freeMessagesDefault: DEFAULT_FREE_LIMIT,
  markupPercentage: 50,
  minBalanceWarning: 0.1,
  topupAmounts: [5, 10, 20, 50],
}

function toNumber(value: unknown, fallback: number): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function normalizeTopupAmounts(value: unknown): number[] {
  if (Array.isArray(value)) {
    const nums = value.map((v) => Number(v)).filter((v) => Number.isFinite(v) && v > 0)
    return nums.length > 0 ? nums : DEFAULT_PRICING.topupAmounts
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) {
        const nums = parsed.map((v) => Number(v)).filter((v) => Number.isFinite(v) && v > 0)
        return nums.length > 0 ? nums : DEFAULT_PRICING.topupAmounts
      }
    } catch {
      return DEFAULT_PRICING.topupAmounts
    }
  }

  return DEFAULT_PRICING.topupAmounts
}

export async function getUserBalance(userId: string, userEmail?: string): Promise<UserBalance> {
  const isOwner = userEmail ? isAdminUser(userEmail) : false
  const freeLimit = isOwner ? OWNER_FREE_LIMIT : DEFAULT_FREE_LIMIT

  try {
    const [existing] = await sql`
      SELECT *
      FROM user_balances
      WHERE user_id = ${userId}::uuid
      LIMIT 1
    `

    if (existing) {
      const used = Number(existing.free_messages_used ?? 0)

      return {
        balance: toNumber(existing.balance, 0),
        freeMessagesUsed: used,
        freeMessagesLimit: freeLimit,
        freeMessagesRemaining: isOwner ? OWNER_FREE_LIMIT : Math.max(0, freeLimit - used),
        totalMessagesSent: Number(existing.total_messages_sent ?? used),
        totalSpent: toNumber(existing.total_spent, 0),
      }
    }

    await sql`
      INSERT INTO user_balances (user_id, free_messages_limit)
      VALUES (${userId}::uuid, ${freeLimit})
      ON CONFLICT (user_id) DO NOTHING
    `

    return {
      balance: 0,
      freeMessagesUsed: 0,
      freeMessagesLimit: freeLimit,
      freeMessagesRemaining: freeLimit,
      totalMessagesSent: 0,
      totalSpent: 0,
    }
  } catch (error) {
    console.error("[MujeebProAI Balance] getUserBalance fallback:", error)

    return {
      balance: 0,
      freeMessagesUsed: 0,
      freeMessagesLimit: freeLimit,
      freeMessagesRemaining: freeLimit,
      totalMessagesSent: 0,
      totalSpent: 0,
    }
  }
}

export async function getPricingSettings(): Promise<PricingSettings> {
  try {
    const [settings] = await sql`
      SELECT *
      FROM ai_pricing_settings
      WHERE is_active = true
      LIMIT 1
    `

    if (!settings) return DEFAULT_PRICING

    const costPer1000 = toNumber(settings.cost_per_1000_messages, DEFAULT_PRICING.costPer1000Messages)

    return {
      costPer1000Messages: costPer1000,
      costPerMessage: costPer1000 / 1000,
      freeMessagesDefault: Number(settings.free_messages_default ?? DEFAULT_FREE_LIMIT),
      markupPercentage: Number(settings.markup_percentage ?? DEFAULT_PRICING.markupPercentage),
      minBalanceWarning: toNumber(settings.min_balance_warning, DEFAULT_PRICING.minBalanceWarning),
      topupAmounts: normalizeTopupAmounts(settings.topup_amounts),
    }
  } catch (error) {
    console.error("[MujeebProAI Balance] getPricingSettings fallback:", error)
    return DEFAULT_PRICING
  }
}

export async function canSendMessage(userId: string, userEmail?: string): Promise<CanSendResult> {
  const isOwner = userEmail ? isAdminUser(userEmail) : false

  if (isOwner) {
    return {
      allowed: true,
      usingFreeMessage: true,
      messageCost: 0,
      freeMessagesRemaining: OWNER_FREE_LIMIT,
    }
  }

  const balance = await getUserBalance(userId, userEmail)

  if (balance.freeMessagesRemaining > 0) {
    return {
      allowed: true,
      usingFreeMessage: true,
      messageCost: 0,
      freeMessagesRemaining: balance.freeMessagesRemaining,
    }
  }

  if (balance.balance > 0.001) {
    const pricing = await getPricingSettings()

    return {
      allowed: true,
      usingFreeMessage: false,
      messageCost: pricing.costPerMessage,
      balanceAfter: balance.balance - pricing.costPerMessage,
      freeMessagesRemaining: 0,
    }
  }

  return {
    allowed: false,
    reason: "You've used all your free messages. Please upgrade to continue.",
    usingFreeMessage: false,
    messageCost: 0,
    freeMessagesRemaining: 0,
  }
}

export async function deductMessageCost(
  userId: string,
  usingFreeMessage: boolean,
  cost: number
): Promise<void> {
  try {
    if (usingFreeMessage) {
      await sql`
        UPDATE user_balances
        SET free_messages_used = COALESCE(free_messages_used, 0) + 1,
            total_messages_sent = COALESCE(total_messages_sent, 0) + 1,
            updated_at = NOW()
        WHERE user_id = ${userId}::uuid
      `
      return
    }

    await sql`
      UPDATE user_balances
      SET balance = COALESCE(balance, 0) - ${cost},
          total_messages_sent = COALESCE(total_messages_sent, 0) + 1,
          total_spent = COALESCE(total_spent, 0) + ${cost},
          updated_at = NOW()
      WHERE user_id = ${userId}::uuid
    `
  } catch (error) {
    console.error("[MujeebProAI Balance] deductMessageCost error:", error)
  }
}

export async function addCredits(userId: string, amount: number): Promise<number> {
  await getUserBalance(userId)

  try {
    const [result] = await sql`
      UPDATE user_balances
      SET balance = COALESCE(balance, 0) + ${amount},
          updated_at = NOW()
      WHERE user_id = ${userId}::uuid
      RETURNING balance
    `

    return toNumber(result?.balance, 0)
  } catch (error) {
    console.error("[MujeebProAI Balance] addCredits error:", error)
    return 0
  }
}

export async function recordTopup(
  userId: string,
  amount: number,
  creditsAdded: number,
  stripeSessionId: string,
  status: string = "pending"
): Promise<string> {
  const [result] = await sql`
    INSERT INTO topup_transactions (user_id, amount, credits_added, stripe_session_id, status)
    VALUES (${userId}::uuid, ${amount}, ${creditsAdded}, ${stripeSessionId}, ${status})
    RETURNING id
  `

  return result.id
}

export async function completeTopup(
  stripeSessionId: string,
  paymentIntentId: string
): Promise<boolean> {
  const [transaction] = await sql`
    SELECT *
    FROM topup_transactions
    WHERE stripe_session_id = ${stripeSessionId}
      AND status = 'pending'
    LIMIT 1
  `

  if (!transaction) return false

  await sql`
    UPDATE topup_transactions
    SET status = 'completed',
        payment_intent_id = ${paymentIntentId},
        completed_at = NOW()
    WHERE id = ${transaction.id}::uuid
  `

  await addCredits(transaction.user_id, Number(transaction.credits_added))

  return true
}
