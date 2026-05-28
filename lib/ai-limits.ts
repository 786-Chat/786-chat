/**
 * AI Usage Protection Configuration
 * Centralized limits and settings for abuse prevention
 */

export const AI_LIMITS = {
  // Message limits
  message: {
    maxLength: 10000, // Max characters per message
    maxTokens: 4000, // Max estimated tokens per message
    minLength: 1, // Minimum message length
    maxResponseTokens: 8000, // Max response tokens
  },

  // File upload limits
  uploads: {
    pdf: {
      maxSizeMB: 10, // 10MB max for PDFs
      maxPages: 50, // Max pages per PDF
      maxPerDay: 20, // Max PDF uploads per day
    },
    image: {
      maxSizeMB: 5, // 5MB max for images
      maxPerMessage: 5, // Max images per message
      maxPerDay: 50, // Max image uploads per day
      allowedTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
    },
    file: {
      maxSizeMB: 15, // 15MB max for general files
      blockedTypes: [".exe", ".bat", ".sh", ".cmd", ".scr", ".msi", ".dll"],
    },
    total: {
      maxPerDay: 100, // Total uploads per day
      maxPerRequest: 10, // Max uploads per single request
    },
  },

  // Rate limiting
  rateLimit: {
    messagesPerMinute: 10, // Max messages per minute
    messagesPerHour: 60, // Max messages per hour
    requestsPerSecond: 2, // Max requests per second (burst protection)
    windowMinutes: 1, // Rate limit window in minutes
  },

  // DAILY limits by plan (not monthly - this prevents abuse)
  dailyLimits: {
    starter: {
      messagesPerDay: 5, // 5 total (free trial, not daily)
      monthlyMessages: 5,
      tokens: 25000,
      uploads: 5,
      pdfPages: 10,
    },
    basic: {
      messagesPerDay: 25, // Max 25/day
      monthlyMessages: 100,
      tokens: 500000,
      uploads: 50,
      pdfPages: 100,
    },
    pro: {
      messagesPerDay: 50, // Max 50/day
      monthlyMessages: 300,
      tokens: 1500000,
      uploads: 200,
      pdfPages: 500,
    },
    business: {
      messagesPerDay: 100, // Max 100/day
      monthlyMessages: 2000,
      tokens: 10000000,
      uploads: 1000,
      pdfPages: 2000,
    },
    enterprise: {
      messagesPerDay: 200, // Max 200/day
      monthlyMessages: 3000,
      tokens: 15000000,
      uploads: 5000,
      pdfPages: 5000,
    },
  },

  // Extra message pricing (GBP)
  extraMessageCost: {
    starter: 0, // No extra messages allowed
    basic: 0.15,
    pro: 0.10,
    business: 0.05,
    enterprise: 0.03,
  },

  // Timeout protection
  timeout: {
    requestTimeoutMs: 60000, // 60 second timeout for AI requests
    streamTimeoutMs: 120000, // 2 minute timeout for streaming
    idleTimeoutMs: 30000, // 30 second idle timeout
    maxLoopIterations: 10, // Prevent infinite AI loops
  },

  // Spam detection
  spam: {
    maxRepeatedMessages: 3, // Max identical messages in a row
    minTimeBetweenMessages: 1000, // Min 1 second between messages (ms)
    suspiciousPatterns: [
      /(.)\1{10,}/, // Repeated characters (11+ times)
      /\b(spam|hack|inject|exploit)\b/i, // Suspicious keywords
      /<script|javascript:|data:/i, // XSS attempts
    ],
    maxSpamScore: 10, // Block user after this spam score
    spamScoreDecayHours: 24, // Hours until spam score resets
  },

  // Block durations (in minutes)
  blockDurations: {
    mild: 5, // 5 minutes for mild violations
    moderate: 30, // 30 minutes for moderate violations
    severe: 1440, // 24 hours for severe violations
    permanent: -1, // Permanent block (admin review required)
  },

  // AI Cost Estimation (Claude Sonnet pricing - approximate)
  costEstimation: {
    inputTokenCost: 0.003, // $0.003 per 1K input tokens
    outputTokenCost: 0.015, // $0.015 per 1K output tokens
    imageProcessingCost: 0.01, // $0.01 per image
    pdfPageCost: 0.005, // $0.005 per PDF page
  },

  // Budget Protection
  budgetProtection: {
    warningThresholdGBP: 100, // Warn admin at £100 daily spend
    hardLimitGBP: 150, // Stop AI requests at £150 daily spend
    enableHardStop: true, // Enable hard stop when limit reached
  },
} as const

export type PlanType = "starter" | "basic" | "pro" | "business" | "enterprise"

// Helper to get limits for a plan
export function getLimitsForPlan(plan: string) {
  const planKey = plan as PlanType
  return AI_LIMITS.dailyLimits[planKey] || AI_LIMITS.dailyLimits.starter
}

// Helper to estimate tokens from text
export function estimateTokens(text: string): number {
  // Rough estimation: ~4 characters per token for English
  return Math.ceil(text.length / 4)
}

// Helper to check file size
export function checkFileSize(sizeBytes: number, maxSizeMB: number): boolean {
  return sizeBytes <= maxSizeMB * 1024 * 1024
}

// Helper to format bytes
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

// Estimate cost of a message
export function estimateMessageCost(
  inputTokens: number,
  outputTokens: number,
  imageCount: number = 0,
  pdfPages: number = 0
): number {
  const { costEstimation } = AI_LIMITS
  const inputCost = (inputTokens / 1000) * costEstimation.inputTokenCost
  const outputCost = (outputTokens / 1000) * costEstimation.outputTokenCost
  const imageCost = imageCount * costEstimation.imageProcessingCost
  const pdfCost = pdfPages * costEstimation.pdfPageCost
  return inputCost + outputCost + imageCost + pdfCost
}

// Convert USD to GBP (approximate)
export function usdToGbp(usd: number): number {
  return usd * 0.79 // Approximate conversion rate
}
