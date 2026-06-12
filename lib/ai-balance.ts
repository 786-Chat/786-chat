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

// Get or create user balance record
export async function getUserBalance(userId: string, userEmail?: string): Promise<UserBalance> {
  const isOwner = userEmail ? isAdminUser(userEmail) : false

  // Try to get existing balance
  const [existing] = await sql`
    SELECT * FROM user_balances WHERE user_id = ${userId}::uuid
  `

  if (existing) {
    if (isOwner) {
      return {
        balance: Number(existing.balance) || 0,
        freeMessagesUsed: existing.free_messages_used || 0,
        freeMessagesLimit: 999999,
        freeMessagesRemaining: 999999,
        totalMessagesSent: existing.total_messages_sent || 0,
        totalSpent: Number(existing.total_spent) || 0,
      }
    }
    const limit = existing.free_messages_limit || 10
    const used = existing.free_messages_used || 0
    return {
      balance: Number(existing.balance) || 0,
      freeMessagesUsed: used,
      freeMessagesLimit: limit,
      freeMessagesRemaining: Math.max(0, limit - used),
      totalMessagesSent: existing.total_messages_sent || 0,
      totalSpent: Number(existing.total_spent) || 0,
    }
  }

  // Get default free messages from settings
  const [settings] = await sql`SELECT free_messages_default FROM ai_pricing_settings LIMIT 1`
  const freeLimit = isOwner ? 999999 : (settings?.free_messages_default ?? 10)

  // Create new balance record
  await sql`
    INSERT INTO user_balances (user_id, free_messages_limit)
    VALUES (${userId}::uuid, ${freeLimit})
  `

  return {
    balance: 0,
    freeMessagesUsed: 0,
    freeMessagesLimit: freeLimit,
    freeMessagesRemaining: freeLimit,
    totalMessagesSent: 0,
    totalSpent: 0,
  }
}

// Get pricing settings
export async function getPricingSettings(): Promise<PricingSettings> {
  const [settings] = await sql`SELECT * FROM ai_pricing_settings WHERE is_active = true LIMIT 1`

  const costPer1000 = Number(settings?.cost_per_1000_messages) || 0.50
  
  return {
    costPer1000Messages: costPer1000,
    costPerMessage: costPer1000 / 1000,
    freeMessagesDefault: settings?.free_messages_default || 10,
    markupPercentage: settings?.markup_percentage || 50,
    minBalanceWarning: Number(settings?.min_balance_warning) || 0.10,
    topupAmounts: settings?.topup_amounts || [5, 10, 20, 50],
  }
}

// Check if user can send a message
export async function canSendMessage(userId: string, userEmail?: string): Promise<CanSendResult> {
  const isOwner = userEmail ? isAdminUser(userEmail) : false

  // Owner (mujeeb@job4u.com) always has unlimited access
  if (isOwner) {
    return {
      allowed: true,
      usingFreeMessage: true,
      messageCost: 0,
      freeMessagesRemaining: 999999,
    }
  }

  // For normal customers: check their actual free message balance
  const balance = await getUserBalance(userId, userEmail)

  if (balance.freeMessagesRemaining > 0) {
    return {
      allowed: true,
      usingFreeMessage: true,
      messageCost: 0,
      freeMessagesRemaining: balance.freeMessagesRemaining,
    }
  }

  // If they have paid balance, allow using that
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

  // No free messages left and no balance
  return {
    allowed: false,
    reason: "You've used all your free messages. Please upgrade to continue.",
    usingFreeMessage: false,
    messageCost: 0,
    freeMessagesRemaining: 0,
  }
}

// Deduct cost after successful message
export async function deductMessageCost(userId: string, usingFreeMessage: boolean, cost: number): Promise<void> {
  if (usingFreeMessage) {
    // Track free message usage
    await sql`
      UPDATE user_balances 
      SET free_messages_used = free_messages_used + 1,
          total_messages_sent = total_messages_sent + 1,
          updated_at = NOW()
      WHERE user_id = ${userId}::uuid
    `
  } else {
    // Deduct from paid balance
    await sql`
      UPDATE user_balances 
      SET balance = balance - ${cost},
          total_messages_sent = total_messages_sent + 1,
          total_spent = total_spent + ${cost},
          updated_at = NOW()
      WHERE user_id = ${userId}::uuid
    `
  }
}

// Add credits to user balance (after successful payment)
export async function addCredits(userId: string, amount: number): Promise<number> {
  // Make sure user has a balance record
  await getUserBalance(userId)

  // Add credits
  const [result] = await sql`
    UPDATE user_balances 
    SET balance = balance + ${amount},
        updated_at = NOW()
    WHERE user_id = ${userId}::uuid
    RETURNING balance
  `

  return Number(result?.balance) || 0
}

// Record a top-up transaction
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

// Complete a top-up transaction
export async function completeTopup(stripeSessionId: string, paymentIntentId: string): Promise<boolean> {
  // Get the transaction
  const [transaction] = await sql`
    SELECT * FROM topup_transactions WHERE stripe_session_id = ${stripeSessionId} AND status = 'pending'
  `

  if (!transaction) {
    return false
  }

  // Update transaction status
  await sql`
    UPDATE topup_transactions 
    SET status = 'completed', payment_intent_id = ${paymentIntentId}, completed_at = NOW()
    WHERE id = ${transaction.id}::uuid
  `

  // Add credits to user balance
  await addCredits(transaction.user_id, Number(transaction.credits_added))

  return true
}
