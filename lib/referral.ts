import { getSql } from "./db"

export interface ReferralCode {
  id: string
  code: string
  referrer_name: string
  referrer_email: string | null
  referrer_mobile: string | null
  discount_amount: number
  commission_per_customer: number
  is_active: boolean
  created_at: string
}

export interface ReferralUsage {
  id: string
  referral_code_id: string
  customer_user_id: string
  customer_email: string
  discount_applied: number
  commission_earned: number
  is_paid: boolean
  created_at: string
  referrer_name?: string
  code?: string
}

// Generate a unique referral code
function generateReferralCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// Create a new referral code (admin only)
export async function createReferralCode(
  referrerName: string,
  referrerEmail?: string,
  referrerMobile?: string,
  discountAmount: number = 2.00,
  commissionPerCustomer: number = 1.00
): Promise<ReferralCode> {
  const sql = getSql()
  const code = generateReferralCode()
  
  const result = await sql`
    INSERT INTO referral_codes (code, referrer_name, referrer_email, referrer_mobile, discount_amount, commission_per_customer)
    VALUES (${code}, ${referrerName}, ${referrerEmail || null}, ${referrerMobile || null}, ${discountAmount}, ${commissionPerCustomer})
    RETURNING *
  `
  
  return result[0] as ReferralCode
}

// Get all referral codes (admin only)
export async function getAllReferralCodes(): Promise<ReferralCode[]> {
  const sql = getSql()
  const result = await sql`SELECT * FROM referral_codes ORDER BY created_at DESC`
  return result as ReferralCode[]
}

// Validate a referral code
export async function validateReferralCode(code: string): Promise<ReferralCode | null> {
  const sql = getSql()
  const result = await sql`
    SELECT * FROM referral_codes 
    WHERE code = ${code.toLowerCase()} AND is_active = true
  `
  return result[0] as ReferralCode || null
}

// Apply referral code for a customer
export async function applyReferralCode(
  code: string,
  customerUserId: string,
  customerEmail: string
): Promise<{ success: boolean; discount: number; error?: string }> {
  const referral = await validateReferralCode(code)
  
  if (!referral) {
    return { success: false, discount: 0, error: "Invalid or expired referral code" }
  }
  
  const sql = getSql()
  
  // Check if user already used a referral code
  const existing = await sql`
    SELECT * FROM referral_usage WHERE customer_user_id = ${customerUserId}
  `
  
  if (existing.length > 0) {
    return { success: false, discount: 0, error: "You have already used a referral code" }
  }
  
  // Record the referral usage
  await sql`
    INSERT INTO referral_usage (referral_code_id, customer_user_id, customer_email, discount_applied, commission_earned)
    VALUES (${referral.id}, ${customerUserId}, ${customerEmail}, ${referral.discount_amount}, ${referral.commission_per_customer})
  `
  
  return { success: true, discount: referral.discount_amount }
}

// Get all referral usages (admin only) - for tracking commissions
export async function getReferralUsages(): Promise<ReferralUsage[]> {
  const sql = getSql()
  const result = await sql`
    SELECT ru.*, rc.referrer_name, rc.code
    FROM referral_usage ru
    JOIN referral_codes rc ON ru.referral_code_id = rc.id
    ORDER BY ru.created_at DESC
  `
  return result as ReferralUsage[]
}

// Get total commission for a referrer
export async function getReferrerCommission(referralCodeId: string): Promise<{ total: number; paid: number; unpaid: number }> {
  const sql = getSql()
  const result = await sql`
    SELECT 
      COALESCE(SUM(commission_earned), 0) as total,
      COALESCE(SUM(CASE WHEN is_paid THEN commission_earned ELSE 0 END), 0) as paid,
      COALESCE(SUM(CASE WHEN NOT is_paid THEN commission_earned ELSE 0 END), 0) as unpaid
    FROM referral_usage
    WHERE referral_code_id = ${referralCodeId}
  `
  return {
    total: Number(result[0]?.total || 0),
    paid: Number(result[0]?.paid || 0),
    unpaid: Number(result[0]?.unpaid || 0)
  }
}

// Mark referral as paid (admin only)
export async function markReferralPaid(usageId: string): Promise<void> {
  const sql = getSql()
  await sql`UPDATE referral_usage SET is_paid = true WHERE id = ${usageId}`
}

// Delete referral code (admin only)
export async function deleteReferralCode(codeId: string): Promise<void> {
  const sql = getSql()
  await sql`UPDATE referral_codes SET is_active = false WHERE id = ${codeId}`
}
