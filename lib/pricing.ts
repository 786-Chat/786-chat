import { getSql } from "./db"

export interface PricingSetting {
  setting_key: string
  setting_value: number
  description: string
}

// Get all pricing settings
export async function getPricingSettings(): Promise<Record<string, number>> {
  const sql = getSql()
  const result = await sql`SELECT setting_key, setting_value FROM pricing_settings`
  
  const settings: Record<string, number> = {}
  for (const row of result) {
    settings[row.setting_key] = Number(row.setting_value)
  }
  
  // Default values if not in database
  return {
    free_messages: settings.free_messages ?? 10,
    message_pack_100: settings.message_pack_100 ?? 5.00,
    default_referral_discount: settings.default_referral_discount ?? 2.00,
    default_referral_commission: settings.default_referral_commission ?? 1.00,
    ...settings
  }
}

// Update a pricing setting (admin only)
export async function updatePricingSetting(key: string, value: number): Promise<void> {
  const sql = getSql()
  await sql`
    UPDATE pricing_settings 
    SET setting_value = ${value}, updated_at = NOW()
    WHERE setting_key = ${key}
  `
}

// Get free message limit
export async function getFreeMessageLimit(): Promise<number> {
  const settings = await getPricingSettings()
  return settings.free_messages
}

// Check if user has exceeded free messages
export async function hasExceededFreeMessages(userId: string): Promise<boolean> {
  const sql = getSql()
  const freeLimit = await getFreeMessageLimit()
  
  const result = await sql`
    SELECT COUNT(*) as count FROM ai_usage 
    WHERE user_id = ${userId}
  `
  
  const messageCount = Number(result[0]?.count || 0)
  return messageCount >= freeLimit
}

// Check if user has paid subscription
export async function hasPaidSubscription(userId: string): Promise<boolean> {
  const sql = getSql()
  const result = await sql`
    SELECT plan FROM users WHERE id = ${userId}
  `
  
  const plan = result[0]?.plan || 'starter'
  return plan !== 'starter'
}
