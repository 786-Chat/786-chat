/**
 * AI Usage Protection System
 * Handles rate limiting, spam detection, daily limits, and budget protection
 */

import { neon } from "@neondatabase/serverless"
import { AI_LIMITS, getLimitsForPlan, estimateTokens, type PlanType } from "./ai-limits"
import { checkBudgetLimits, trackAICost } from "./ai-spending"

const sql = neon(process.env.DATABASE_URL!)

export interface ProtectionResult {
  allowed: boolean
  error?: string
  errorCode?: string
  retryAfter?: number // seconds
  remaining?: {
    dailyMessages: number
    monthlyMessages: number
    extraCredits: number
  }
  canUseExtraCredits?: boolean
}

export interface UsageContext {
  userId: string
  plan: PlanType
  messageContent?: string
  fileSize?: number
  fileType?: string
  pdfPages?: number
  imageCount?: number
}

/**
 * Main protection check - call this before processing any AI request
 * DISABLED FOR TESTING - Always allows requests
 */
export async function checkAIProtection(ctx: UsageContext): Promise<ProtectionResult> {
  // TESTING MODE: Always allow all requests
  return {
    allowed: true,
    remaining: {
      dailyMessages: 9999,
      monthlyMessages: 9999,
      extraCredits: 9999,
    },
    canUseExtraCredits: false,
  }
}

/**
 * Check if user is currently blocked
 */
async function checkUserBlocked(userId: string): Promise<ProtectionResult> {
  const result = await sql`
    SELECT is_blocked, blocked_until, block_reason
    FROM rate_limits
    WHERE user_id = ${userId}::uuid AND action = 'chat'
    LIMIT 1
  `

  if (result.length === 0) return { allowed: true }

  const { is_blocked, blocked_until, block_reason } = result[0]

  if (is_blocked) {
    if (blocked_until && new Date(blocked_until) < new Date()) {
      // Block expired, unblock user
      await sql`
        UPDATE rate_limits
        SET is_blocked = FALSE, blocked_until = NULL, block_reason = NULL
        WHERE user_id = ${userId}::uuid AND action = 'chat'
      `
      return { allowed: true }
    }

    const retryAfter = blocked_until
      ? Math.ceil((new Date(blocked_until).getTime() - Date.now()) / 1000)
      : undefined

    return {
      allowed: false,
      error: block_reason || "Your account has been temporarily blocked due to unusual activity.",
      errorCode: "USER_BLOCKED",
      retryAfter,
    }
  }

  return { allowed: true }
}

/**
 * Check rate limits (messages per minute/hour)
 */
async function checkRateLimit(userId: string): Promise<ProtectionResult> {
  const { messagesPerMinute } = AI_LIMITS.rateLimit

  // Get or create rate limit record
  const result = await sql`
    INSERT INTO rate_limits (user_id, action, window_start, request_count, last_request_at)
    VALUES (${userId}::uuid, 'chat', NOW(), 1, NOW())
    ON CONFLICT (user_id, action) DO UPDATE SET
      request_count = CASE
        WHEN rate_limits.window_start < NOW() - INTERVAL '1 minute'
        THEN 1
        ELSE rate_limits.request_count + 1
      END,
      window_start = CASE
        WHEN rate_limits.window_start < NOW() - INTERVAL '1 minute'
        THEN NOW()
        ELSE rate_limits.window_start
      END,
      last_request_at = NOW(),
      updated_at = NOW()
    RETURNING request_count, 
      EXTRACT(EPOCH FROM (NOW() - window_start)) as window_seconds
  `

  const { request_count, window_seconds } = result[0]

  // Check requests per minute
  if (request_count > messagesPerMinute && Number(window_seconds) < 60) {
    const retryAfter = Math.ceil(60 - Number(window_seconds))
    return {
      allowed: false,
      error: `Rate limit exceeded. Please wait ${retryAfter} seconds.`,
      errorCode: "RATE_LIMIT_MINUTE",
      retryAfter,
    }
  }

  return { allowed: true }
}

/**
 * Check daily and monthly usage limits
 */
async function checkUsageLimits(ctx: UsageContext): Promise<ProtectionResult> {
  const limits = getLimitsForPlan(ctx.plan)

  // Get subscription info
  const subResult = await sql`
    SELECT 
      messages_used,
      messages_limit,
      daily_messages_used,
      daily_reset_at,
      extra_credits,
      plan,
      status
    FROM subscriptions
    WHERE user_id = ${ctx.userId}::uuid
    LIMIT 1
  `

  if (subResult.length === 0) {
    // No subscription, use starter limits
    return checkStarterLimits(ctx.userId)
  }

  const sub = subResult[0]
  const isActive = sub.status === "active" || sub.status === "trialing"

  if (!isActive) {
    return {
      allowed: false,
      error: "Your subscription is not active. Please update your payment method.",
      errorCode: "SUBSCRIPTION_INACTIVE",
    }
  }

  // Reset daily counter if new day
  const dailyResetAt = new Date(sub.daily_reset_at)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let dailyUsed = Number(sub.daily_messages_used || 0)
  if (dailyResetAt < today) {
    // Reset daily counter
    await sql`
      UPDATE subscriptions
      SET daily_messages_used = 0, daily_reset_at = NOW()
      WHERE user_id = ${ctx.userId}::uuid
    `
    dailyUsed = 0
  }

  // Check daily limit
  if (dailyUsed >= limits.messagesPerDay) {
    return {
      allowed: false,
      error: `Daily limit reached (${limits.messagesPerDay} messages/day). Try again tomorrow or upgrade your plan.`,
      errorCode: "DAILY_LIMIT_REACHED",
    }
  }

  // Check monthly limit
  const monthlyUsed = Number(sub.messages_used || 0)
  const monthlyLimit = Number(sub.messages_limit || limits.monthlyMessages)
  const extraCredits = Number(sub.extra_credits || 0)

  if (monthlyUsed >= monthlyLimit) {
    // Check for extra credits
    if (extraCredits > 0) {
      return {
        allowed: true,
        canUseExtraCredits: true,
      }
    }

    // Check if plan allows extra messages
    const planConfig = AI_LIMITS.extraMessageCost[ctx.plan as keyof typeof AI_LIMITS.extraMessageCost]
    if (planConfig === 0 || ctx.plan === "starter") {
      return {
        allowed: false,
        error: "Monthly message limit reached. Please upgrade your plan to continue.",
        errorCode: "MONTHLY_LIMIT_REACHED",
      }
    }

    return {
      allowed: false,
      error: `Monthly limit reached (${monthlyLimit} messages). Purchase extra credits or upgrade your plan.`,
      errorCode: "MONTHLY_LIMIT_REACHED_CAN_BUY",
    }
  }

  return { allowed: true }
}

/**
 * Check limits for starter/free users
 */
async function checkStarterLimits(userId: string): Promise<ProtectionResult> {
  // Check total messages ever used (starter is 5 total, not per month)
  const result = await sql`
    SELECT COUNT(*) as total_messages
    FROM usage_logs
    WHERE user_id = ${userId}::uuid
    AND action = 'ai_message'
  `

  const totalUsed = Number(result[0]?.total_messages || 0)

  if (totalUsed >= AI_LIMITS.dailyLimits.starter.monthlyMessages) {
    return {
      allowed: false,
      error: "Free trial ended. Please subscribe to continue using MujeebProAI.",
      errorCode: "FREE_TRIAL_ENDED",
    }
  }

  return { allowed: true }
}

/**
 * Check message content limits
 */
function checkMessageLimits(content: string): ProtectionResult {
  const { maxLength, minLength, maxTokens } = AI_LIMITS.message

  if (content.length < minLength) {
    return {
      allowed: false,
      error: "Message is too short.",
      errorCode: "MESSAGE_TOO_SHORT",
    }
  }

  if (content.length > maxLength) {
    return {
      allowed: false,
      error: `Message is too long. Maximum ${maxLength.toLocaleString()} characters allowed.`,
      errorCode: "MESSAGE_TOO_LONG",
    }
  }

  const estimatedTokens = estimateTokens(content)
  if (estimatedTokens > maxTokens) {
    return {
      allowed: false,
      error: `Message is too long. Please shorten your message.`,
      errorCode: "MESSAGE_TOO_MANY_TOKENS",
    }
  }

  return { allowed: true }
}

/**
 * Check file upload limits
 */
function checkFileLimits(sizeBytes: number, fileType: string, pdfPages?: number): ProtectionResult {
  const isPdf = fileType === "application/pdf"
  const allowedImageTypes: readonly string[] = AI_LIMITS.uploads.image.allowedTypes
  const isImage = allowedImageTypes.includes(fileType)

  // Check blocked file types
  const extension = "." + fileType.split("/").pop()?.toLowerCase()
  const blockedTypes: readonly string[] = AI_LIMITS.uploads.file.blockedTypes
  if (blockedTypes.includes(extension)) {
    return {
      allowed: false,
      error: "This file type is not allowed for security reasons.",
      errorCode: "BLOCKED_FILE_TYPE",
    }
  }

  // Check general file size
  const maxFileSize = AI_LIMITS.uploads.file.maxSizeMB * 1024 * 1024
  if (sizeBytes > maxFileSize) {
    return {
      allowed: false,
      error: `File is too large. Maximum ${AI_LIMITS.uploads.file.maxSizeMB}MB allowed.`,
      errorCode: "FILE_TOO_LARGE",
    }
  }

  if (isPdf) {
    const maxSize = AI_LIMITS.uploads.pdf.maxSizeMB * 1024 * 1024
    if (sizeBytes > maxSize) {
      return {
        allowed: false,
        error: `PDF file is too large. Maximum ${AI_LIMITS.uploads.pdf.maxSizeMB}MB allowed.`,
        errorCode: "PDF_TOO_LARGE",
      }
    }
    if (pdfPages && pdfPages > AI_LIMITS.uploads.pdf.maxPages) {
      return {
        allowed: false,
        error: `PDF has too many pages. Maximum ${AI_LIMITS.uploads.pdf.maxPages} pages allowed.`,
        errorCode: "PDF_TOO_MANY_PAGES",
      }
    }
  } else if (isImage) {
    const maxSize = AI_LIMITS.uploads.image.maxSizeMB * 1024 * 1024
    if (sizeBytes > maxSize) {
      return {
        allowed: false,
        error: `Image is too large. Maximum ${AI_LIMITS.uploads.image.maxSizeMB}MB allowed.`,
        errorCode: "IMAGE_TOO_LARGE",
      }
    }
  }

  return { allowed: true }
}

/**
 * Check for spam patterns and repeated messages
 */
async function checkSpamPatterns(userId: string, content: string): Promise<ProtectionResult> {
  const { suspiciousPatterns, maxSpamScore } = AI_LIMITS.spam

  // Check for suspicious patterns
  let spamScore = 0
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(content)) {
      spamScore += 3
    }
  }

  // Check for mostly whitespace/empty content
  const trimmedContent = content.trim()
  if (trimmedContent.length < content.length * 0.5) {
    spamScore += 2
  }

  // Check for repeated messages
  const recentMessages = await sql`
    SELECT details
    FROM usage_logs
    WHERE user_id = ${userId}::uuid
    AND action = 'ai_message'
    AND created_at > NOW() - INTERVAL '5 minutes'
    ORDER BY created_at DESC
    LIMIT 5
  `

  // Count identical recent messages
  const contentHash = hashString(trimmedContent)
  let repeatedCount = 0
  for (const msg of recentMessages) {
    if (msg.details && hashString(msg.details) === contentHash) {
      repeatedCount++
    }
  }

  if (repeatedCount >= AI_LIMITS.spam.maxRepeatedMessages) {
    spamScore += 5
  }

  // Update spam score in database
  if (spamScore > 0) {
    const result = await sql`
      UPDATE rate_limits
      SET spam_score = LEAST(spam_score + ${spamScore}, 100), updated_at = NOW()
      WHERE user_id = ${userId}::uuid AND action = 'chat'
      RETURNING spam_score
    `

    if (result.length > 0 && Number(result[0].spam_score) >= maxSpamScore) {
      // Block the user
      const blockMinutes = AI_LIMITS.blockDurations.moderate
      await sql`
        UPDATE rate_limits
        SET is_blocked = TRUE, 
            blocked_until = NOW() + INTERVAL '30 minutes',
            block_reason = 'Suspicious activity detected. Please contact support if you believe this is an error.'
        WHERE user_id = ${userId}::uuid AND action = 'chat'
      `

      return {
        allowed: false,
        error: "Your account has been temporarily blocked due to suspicious activity.",
        errorCode: "SPAM_BLOCKED",
        retryAfter: blockMinutes * 60,
      }
    }
  }

  return { allowed: true }
}

/**
 * Simple string hash for comparison
 */
function hashString(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return hash.toString(36)
}

/**
 * Get remaining usage for response
 */
async function getRemainingUsage(
  userId: string,
  plan: PlanType
): Promise<{ dailyMessages: number; monthlyMessages: number; extraCredits: number }> {
  const limits = getLimitsForPlan(plan)

  const result = await sql`
    SELECT 
      messages_used,
      messages_limit,
      daily_messages_used,
      extra_credits
    FROM subscriptions
    WHERE user_id = ${userId}::uuid
    LIMIT 1
  `

  if (result.length === 0) {
    // Starter user
    const usageResult = await sql`
      SELECT COUNT(*) as total_messages
      FROM usage_logs
      WHERE user_id = ${userId}::uuid AND action = 'ai_message'
    `
    const used = Number(usageResult[0]?.total_messages || 0)
    return {
      dailyMessages: Math.max(0, limits.messagesPerDay - used),
      monthlyMessages: Math.max(0, limits.monthlyMessages - used),
      extraCredits: 0,
    }
  }

  const sub = result[0]
  const dailyUsed = Number(sub.daily_messages_used || 0)
  const monthlyUsed = Number(sub.messages_used || 0)
  const monthlyLimit = Number(sub.messages_limit || limits.monthlyMessages)

  return {
    dailyMessages: Math.max(0, limits.messagesPerDay - dailyUsed),
    monthlyMessages: Math.max(0, monthlyLimit - monthlyUsed),
    extraCredits: Number(sub.extra_credits || 0),
  }
}

/**
 * Record usage after successful AI request
 */
export async function recordUsage(
  userId: string,
  inputTokens: number,
  outputTokens: number,
  imageCount: number = 0,
  pdfPages: number = 0,
  useExtraCredit: boolean = false
): Promise<void> {
  try {
    // Track cost
    await trackAICost(userId, inputTokens, outputTokens, imageCount, pdfPages)

    // Update subscription counters
    if (useExtraCredit) {
      await sql`
        UPDATE subscriptions
        SET 
          extra_credits = extra_credits - 1,
          daily_messages_used = daily_messages_used + 1,
          updated_at = NOW()
        WHERE user_id = ${userId}::uuid
      `
    } else {
      await sql`
        UPDATE subscriptions
        SET 
          messages_used = messages_used + 1,
          daily_messages_used = daily_messages_used + 1,
          updated_at = NOW()
        WHERE user_id = ${userId}::uuid
      `
    }

    // Decay spam score over time
    await sql`
      UPDATE rate_limits
      SET spam_score = GREATEST(0, spam_score - 1)
      WHERE user_id = ${userId}::uuid AND action = 'chat'
        AND updated_at < NOW() - INTERVAL '1 hour'
    `
  } catch (error) {
    console.error("[AI Protection] Error recording usage:", error)
  }
}

/**
 * Create a timeout wrapper for AI requests
 */
export function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("Request timed out")), timeoutMs)
    ),
  ])
}

/**
 * Admin function to block a user
 */
export async function blockUser(
  userId: string,
  reason: string,
  durationMinutes: number = AI_LIMITS.blockDurations.moderate
): Promise<void> {
  const blockedUntil = durationMinutes === -1 ? null : `NOW() + INTERVAL '${durationMinutes} minutes'`
  
  await sql`
    INSERT INTO rate_limits (user_id, action, is_blocked, blocked_until, block_reason)
    VALUES (${userId}::uuid, 'chat', TRUE, ${blockedUntil ? sql`NOW() + INTERVAL '${durationMinutes} minutes'` : null}, ${reason})
    ON CONFLICT (user_id, action) DO UPDATE SET
      is_blocked = TRUE,
      blocked_until = ${blockedUntil ? sql`NOW() + INTERVAL '${durationMinutes} minutes'` : null},
      block_reason = ${reason},
      updated_at = NOW()
  `
}

/**
 * Admin function to unblock a user
 */
export async function unblockUser(userId: string): Promise<void> {
  await sql`
    UPDATE rate_limits
    SET is_blocked = FALSE, blocked_until = NULL, block_reason = NULL, spam_score = 0
    WHERE user_id = ${userId}::uuid
  `
}

/**
 * Admin function to suspend a user
 */
export async function suspendUser(userId: string, reason: string): Promise<void> {
  await sql`
    UPDATE users
    SET status = 'suspended', updated_at = NOW()
    WHERE id = ${userId}::uuid
  `
  await blockUser(userId, reason, AI_LIMITS.blockDurations.permanent)
}

/**
 * Add extra credits to a user
 */
export async function addExtraCredits(userId: string, credits: number): Promise<void> {
  await sql`
    UPDATE subscriptions
    SET extra_credits = extra_credits + ${credits}, updated_at = NOW()
    WHERE user_id = ${userId}::uuid
  `
}

/**
 * Check for duplicate free trial abuse (same email patterns, device fingerprint, etc.)
 */
export async function checkFreeTrialAbuse(email: string, ipAddress?: string): Promise<boolean> {
  // Check for similar email patterns (e.g., user+1@gmail.com, user+2@gmail.com)
  const baseEmail = email.replace(/\+[^@]+@/, "@").toLowerCase()
  
  const result = await sql`
    SELECT COUNT(*) as count
    FROM users
    WHERE LOWER(REPLACE(email, SUBSTRING(email FROM '\\+[^@]+'), '')) = ${baseEmail}
  `

  if (Number(result[0]?.count || 0) > 2) {
    return true // Likely abuse
  }

  // Check for multiple accounts from same IP in last 24 hours
  if (ipAddress) {
    const ipResult = await sql`
      SELECT COUNT(*) as count
      FROM users
      WHERE created_at > NOW() - INTERVAL '24 hours'
      AND ip_address = ${ipAddress}
    `
    if (Number(ipResult[0]?.count || 0) > 3) {
      return true // Likely abuse
    }
  }

  return false
}
